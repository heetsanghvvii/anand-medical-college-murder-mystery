import {
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  RoomData,
  PlayerData,
  EnvelopeStateData,
  CompelUseData,
  NairMessageData,
  VoteData,
  DeductionData,
  HuntFindData,
  GamePhase,
  FullRoomSnapshot,
  ScenarioAction,
  ScenarioReplayLog,
  OracleState,
} from '../types';
import {
  CHARACTERS,
  ENVELOPES,
  PHASE_CONFIG,
  DROP_ORDER_CHARACTER_IDS,
  CLUE_CARDS,
} from '../data/game';
import { computeOracleState } from './oracleService';

// 4-letter room code generator
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get active character list based on player capacity (12 - 20)
export function getActiveCharactersForCapacity(capacity: number) {
  const cap = Math.max(12, Math.min(20, capacity));
  const numToDrop = 20 - cap;
  const droppedIds = new Set(DROP_ORDER_CHARACTER_IDS.slice(0, numToDrop));
  return CHARACTERS.filter((c) => !droppedIds.has(c.id));
}

// 1. Create Room (Host)
export async function createGameRoom(
  hostUid: string,
  hostName: string,
  maxCapacity: number = 20
): Promise<string> {
  const roomCode = generateRoomCode();
  const roomRef = doc(db, 'rooms', roomCode);

  const initialRoom: RoomData = {
    roomCode,
    phase: 'LOBBY',
    phaseStartedAt: Date.now(),
    playerCount: 1,
    maxPlayerCapacity: maxCapacity,
    hostUid,
    createdAt: Date.now(),
    secondAttackTriggered: false,
    safariSuitRevealed: false,
    huntVialFoundBy: null,
    huntFileFoundBy: null,
  };

  await setDoc(roomRef, initialRoom);

  // Initialize host player doc
  const hostPlayerRef = doc(db, 'rooms', roomCode, 'players', hostUid);
  const hostPlayerData: PlayerData = {
    uid: hostUid,
    name: hostName || 'Game Director',
    characterId: 0,
    characterName: 'Host (Spectator/Director)',
    isHost: true,
    isReady: true,
    joinedAt: Date.now(),
    online: true,
  };
  await setDoc(hostPlayerRef, hostPlayerData);

  // Initialize envelopeStates (A through J)
  const letters = Object.keys(ENVELOPES);
  for (const letter of letters) {
    const envRef = doc(db, 'rooms', roomCode, 'envelopeStates', letter);
    const envData: EnvelopeStateData = {
      letter,
      unlocked: false,
      unlocked_at: null,
      unlocked_by: [],
      published: false,
      published_by: null,
      published_at: null,
      partner1_submitted: false,
      partner2_submitted: false,
    };
    await setDoc(envRef, envData);
  }

  // Welcome announcement
  const welcomeMsgRef = doc(db, 'rooms', roomCode, 'nairMessages', 'msg-welcome');
  const welcomeMsg: NairMessageData = {
    msgId: 'msg-welcome',
    senderUid: 'system',
    senderName: 'Anand Medical College Dispatch',
    characterName: 'Central Exchange',
    phase: 'LOBBY',
    text: `Room ${roomCode} established. Assembly in the Dean's chamber initiated. All 20 suspect dossiers are sealed.`,
    created_at: Date.now(),
    type: 'system',
  };
  await setDoc(welcomeMsgRef, welcomeMsg);

  return roomCode;
}

// 2. Join Room (Player with Auto Character Assignment)
export async function joinGameRoom(
  roomCode: string,
  playerUid: string,
  playerName: string
): Promise<{ characterId: number; characterName: string }> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error('Room not found. Please verify the 4-letter room code.');
  }

  const roomData = roomSnap.data() as RoomData;
  const activeCharacters = getActiveCharactersForCapacity(roomData.maxPlayerCapacity || 20);

  // Check existing players to find taken characters
  const existingPlayerRef = doc(db, 'rooms', cleanCode, 'players', playerUid);
  const existingPlayerSnap = await getDoc(existingPlayerRef);

  if (existingPlayerSnap.exists()) {
    const pData = existingPlayerSnap.data() as PlayerData;
    // Already joined, update online status
    await updateDoc(existingPlayerRef, { online: true, name: playerName || pData.name });
    return {
      characterId: pData.characterId,
      characterName: pData.characterName,
    };
  }

  // Query all existing players to see which active characters are already assigned
  const playersCol = collection(db, 'rooms', cleanCode, 'players');
  const playersSnap = await getDocs(playersCol);
  const takenIds = new Set<number>();
  playersSnap.forEach((d) => {
    const p = d.data() as PlayerData;
    if (p.characterId) {
      takenIds.add(p.characterId);
    }
  });

  // Assign next available active character
  const availableChars = activeCharacters.filter((c) => !takenIds.has(c.id));
  const assignedChar = availableChars.length > 0 ? availableChars[0] : activeCharacters[0];

  const playerData: PlayerData = {
    uid: playerUid,
    name: playerName,
    characterId: assignedChar.id,
    characterName: assignedChar.name,
    isHost: false,
    isReady: true,
    joinedAt: Date.now(),
    online: true,
    isManuallyAssigned: false,
    isLocked: false,
  };

  await setDoc(existingPlayerRef, playerData);

  // Update player count
  await updateDoc(roomRef, {
    playerCount: (roomData.playerCount || 1) + 1,
  });

  // Post join message
  const joinMsgId = `join-${playerUid.slice(0, 5)}-${Date.now()}`;
  const joinMsgRef = doc(db, 'rooms', cleanCode, 'nairMessages', joinMsgId);
  await setDoc(joinMsgRef, {
    msgId: joinMsgId,
    senderUid: playerUid,
    senderName: playerName,
    characterName: assignedChar.name,
    phase: roomData.phase || 'LOBBY',
    text: `${playerName} claimed case file #${assignedChar.id}: ${assignedChar.name} (${assignedChar.title}).`,
    created_at: Date.now(),
    type: 'system',
  });

  return {
    characterId: assignedChar.id,
    characterName: assignedChar.name,
  };
}

// 3. Host Reassigns Character
export async function hostReassignCharacter(
  roomCode: string,
  playerUid: string,
  newCharacterId: number,
  isManual: boolean = true,
  isLocked: boolean = true
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const char = CHARACTERS.find((c) => c.id === newCharacterId);
  if (!char) return;

  const playerRef = doc(db, 'rooms', cleanCode, 'players', playerUid);
  await updateDoc(playerRef, {
    characterId: char.id,
    characterName: char.name,
    isManuallyAssigned: isManual,
    isLocked: isLocked,
  });
}

// Toggle manual lock state for a player
export async function togglePlayerLock(
  roomCode: string,
  playerUid: string,
  isLocked: boolean
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const playerRef = doc(db, 'rooms', cleanCode, 'players', playerUid);
  await updateDoc(playerRef, {
    isLocked,
    isManuallyAssigned: isLocked,
  });
}

// 3B. Auto-Assign Remaining Characters (Preserves hand-picked / locked players)
export async function autoAssignRemainingCharacters(
  roomCode: string,
  lockedPlayerUids: string[] = [],
  mode: 'remaining' | 'shuffle_all' = 'remaining'
): Promise<{ success: boolean; count: number; message: string }> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) {
    throw new Error('Room not found.');
  }

  const roomData = roomSnap.data() as RoomData;
  const capacity = roomData.maxPlayerCapacity || 20;
  const activeCharacters = getActiveCharactersForCapacity(capacity);
  const activeCharIds = new Set(activeCharacters.map((c) => c.id));

  const playersCol = collection(db, 'rooms', cleanCode, 'players');
  const playersSnap = await getDocs(playersCol);

  const playerList: PlayerData[] = [];
  playersSnap.forEach((d) => {
    const data = d.data() as PlayerData;
    if (!data.isHost) {
      playerList.push(data);
    }
  });

  if (playerList.length === 0) {
    return { success: true, count: 0, message: 'No suspects logged in the room to assign.' };
  }

  const lockedSet = new Set(lockedPlayerUids);

  if (mode === 'shuffle_all') {
    // Complete random shuffle of all active characters across all players
    const shuffledChars = [...activeCharacters].sort(() => Math.random() - 0.5);
    let updatedCount = 0;

    for (let i = 0; i < playerList.length; i++) {
      const p = playerList[i];
      const char = shuffledChars[i % shuffledChars.length];
      const pRef = doc(db, 'rooms', cleanCode, 'players', p.uid);
      await updateDoc(pRef, {
        characterId: char.id,
        characterName: char.name,
        isManuallyAssigned: false,
        isLocked: false,
      });
      updatedCount++;
    }

    const msgId = `auto-assign-shuffle-${Date.now()}`;
    const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
    await setDoc(msgRef, {
      msgId,
      senderUid: 'system',
      senderName: 'Director Assembly',
      characterName: 'Case Coordinator',
      phase: roomData.phase || 'LOBBY',
      text: `[CASE DISPATCH] All ${updatedCount} suspect files have been randomly shuffled and assigned across players.`,
      created_at: Date.now(),
      type: 'system',
    });

    return {
      success: true,
      count: updatedCount,
      message: `Randomly assigned all ${updatedCount} players across active suspect files.`,
    };
  }

  // mode === 'remaining': Preserve manually chosen / locked players and auto-assign the rest
  const takenCharIds = new Set<number>();
  const playersNeedingAssignment: PlayerData[] = [];

  // 1. First pass: Lock in players with explicit locked flag or passed in lockedPlayerUids
  for (const p of playerList) {
    const isExplicitlyLocked = lockedSet.has(p.uid) || p.isLocked || p.isManuallyAssigned;
    if (isExplicitlyLocked && p.characterId && activeCharIds.has(p.characterId) && !takenCharIds.has(p.characterId)) {
      takenCharIds.add(p.characterId);
      const pRef = doc(db, 'rooms', cleanCode, 'players', p.uid);
      await updateDoc(pRef, { isManuallyAssigned: true, isLocked: true });
    } else {
      playersNeedingAssignment.push(p);
    }
  }

  // 2. Second pass: If a non-locked player already has a unique active character that is free, keep them if no explicit locks were provided
  const finalToAssign: PlayerData[] = [];
  for (const p of playersNeedingAssignment) {
    if (lockedSet.size === 0 && !p.isLocked && !p.isManuallyAssigned && p.characterId && activeCharIds.has(p.characterId) && !takenCharIds.has(p.characterId)) {
      takenCharIds.add(p.characterId);
    } else {
      finalToAssign.push(p);
    }
  }

  // 3. Find available active characters
  const availableChars = activeCharacters
    .filter((c) => !takenCharIds.has(c.id))
    .sort(() => Math.random() - 0.5);

  let autoAssignedCount = 0;
  for (let i = 0; i < finalToAssign.length; i++) {
    const p = finalToAssign[i];
    const char = availableChars[i] || activeCharacters[i % activeCharacters.length];
    takenCharIds.add(char.id);

    const pRef = doc(db, 'rooms', cleanCode, 'players', p.uid);
    await updateDoc(pRef, {
      characterId: char.id,
      characterName: char.name,
      isManuallyAssigned: false,
      isLocked: false,
    });
    autoAssignedCount++;
  }

  const msgId = `auto-assign-rest-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'Director Assembly',
    characterName: 'Case Coordinator',
    phase: roomData.phase || 'LOBBY',
    text: `[CASE DISPATCH] Auto-assigned ${autoAssignedCount} remaining suspect dossier(s). Please review your assigned character file.`,
    created_at: Date.now(),
    type: 'system',
  });

  return {
    success: true,
    count: autoAssignedCount,
    message: `Auto-assigned ${autoAssignedCount} remaining player(s) while preserving your selected suspects.`,
  };
}

// Update Max Player Capacity
export async function updateRoomCapacity(
  roomCode: string,
  newCapacity: number
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  await updateDoc(roomRef, {
    maxPlayerCapacity: Math.max(12, Math.min(20, newCapacity)),
  });
}

// 4. Advance Phase
export async function advanceGamePhase(
  roomCode: string,
  newPhase: GamePhase
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  const duration = PHASE_CONFIG[newPhase]?.defaultDurationSeconds || 0;

  await updateDoc(roomRef, {
    phase: newPhase,
    phaseStartedAt: Date.now(),
    customTimerSeconds: duration,
    timerPaused: false,
  });

  // Post announcement
  const phaseInfo = PHASE_CONFIG[newPhase];
  const msgId = `phase-${newPhase}-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'Host Dispatch',
    characterName: 'Director',
    phase: newPhase,
    text: `[PHASE ADVANCED] ${phaseInfo.title.toUpperCase()}: ${phaseInfo.subtitle}`,
    created_at: Date.now(),
    type: 'transmission',
  });
}

// 5. Submit Fragment Code & Partner Matching
export async function submitFragmentCode(
  roomCode: string,
  playerUid: string,
  characterId: number,
  partnerNameInput: string,
  enteredCode: string,
  maxCapacity: number = 20
): Promise<{ success: boolean; message?: string }> {
  const cleanCode = roomCode.trim().toUpperCase();
  const myChar = CHARACTERS.find((c) => c.id === characterId);
  if (!myChar) return { success: false, message: 'Character not recognized.' };

  const envelopeLetter = myChar.envelope_letter;
  const envelope = ENVELOPES[envelopeLetter];
  if (!envelope) return { success: false, message: 'Envelope not found.' };

  const activeChars = getActiveCharactersForCapacity(maxCapacity);
  const activeCharIds = new Set(activeChars.map((c) => c.id));

  // Determine partner id
  const partnerCharId = envelope.char_id_1 === characterId ? envelope.char_id_2 : envelope.char_id_1;
  const partnerChar = CHARACTERS.find((c) => c.id === partnerCharId);
  const isPartnerDropped = !activeCharIds.has(partnerCharId);

  // Clean code input (remove spaces/dashes)
  const cleanInputCode = enteredCode.replace(/[\s-]/g, '');

  if (isPartnerDropped) {
    // Partner dropped: solo survivor unlocks with their own 2-digit half
    if (cleanInputCode !== myChar.code_half.replace(/\s/g, '')) {
      return { success: false, message: 'That is not it.' };
    }
  } else {
    // Both partners active: full 4-digit code required
    if (cleanInputCode !== envelope.full_code.replace(/\s/g, '')) {
      return { success: false, message: 'That is not it.' };
    }

    // Check partner name if entered
    if (partnerChar && partnerNameInput.trim()) {
      const pNameLow = partnerChar.name.toLowerCase();
      const inputLow = partnerNameInput.trim().toLowerCase();
      // Allow matching if input is inside or contains parts of partner name
      const isNameMatch = pNameLow.includes(inputLow) || inputLow.split(' ').some((word) => pNameLow.includes(word));
      if (!isNameMatch && inputLow.length > 2) {
        return { success: false, message: 'That is not it.' };
      }
    }
  }

  // Code is correct! Update envelopeState
  const envRef = doc(db, 'rooms', cleanCode, 'envelopeStates', envelopeLetter);
  const envSnap = await getDoc(envRef);
  const envData = envSnap.exists() ? (envSnap.data() as EnvelopeStateData) : null;

  const isChar1 = envelope.char_id_1 === characterId;
  const p1Submitted = isChar1 ? true : envData?.partner1_submitted || false;
  const p2Submitted = !isChar1 ? true : envData?.partner2_submitted || false;

  const bothUnlocked = isPartnerDropped || (p1Submitted && p2Submitted);

  await updateDoc(envRef, {
    partner1_submitted: p1Submitted,
    partner2_submitted: p2Submitted,
    unlocked: bothUnlocked,
    unlocked_at: bothUnlocked ? Date.now() : envData?.unlocked_at || null,
    unlocked_by: bothUnlocked
      ? Array.from(new Set([...(envData?.unlocked_by || []), myChar.name, ...(partnerChar ? [partnerChar.name] : [])]))
      : Array.from(new Set([...(envData?.unlocked_by || []), myChar.name])),
  });

  if (bothUnlocked) {
    const msgId = `env-unlock-${envelopeLetter}-${Date.now()}`;
    const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
    await setDoc(msgRef, {
      msgId,
      senderUid: 'system',
      senderName: 'Wax Seal Broken',
      characterName: 'Evidence Archive',
      phase: 'R2_PAIRING',
      text: `SEAL BROKEN: Envelope ${envelopeLetter} has been unsealed by ${myChar.name}${partnerChar && !isPartnerDropped ? ` & ${partnerChar.name}` : ''}!`,
      created_at: Date.now(),
      type: 'clue',
    });
  }

  return { success: true };
}

// 6. Publish Envelope to Board
export async function publishEnvelope(
  roomCode: string,
  letter: string,
  publisherName: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const envRef = doc(db, 'rooms', cleanCode, 'envelopeStates', letter);

  await updateDoc(envRef, {
    published: true,
    published_by: publisherName,
    published_at: Date.now(),
  });

  // Post alert to Nair messages
  const msgId = `env-publish-${letter}-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'Public Board Alert',
    characterName: 'Central Board',
    phase: 'R3_BOARD',
    text: `DOCUMENT PUBLISHED TO LIVE BOARD: Envelope ${letter} (${ENVELOPES[letter]?.title || 'Evidence'}) was published by ${publisherName}!`,
    created_at: Date.now(),
    type: 'clue',
  });
}

export const publishEnvelopeToBoard = publishEnvelope;

// 7. Force Unlock / Publish (Host Overrides)
export async function hostForceUnlockEnvelope(
  roomCode: string,
  letter: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const envRef = doc(db, 'rooms', cleanCode, 'envelopeStates', letter);
  await updateDoc(envRef, {
    unlocked: true,
    unlocked_at: Date.now(),
  });
}

export async function hostForcePublishEnvelope(
  roomCode: string,
  letter: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const envRef = doc(db, 'rooms', cleanCode, 'envelopeStates', letter);
  await updateDoc(envRef, {
    unlocked: true,
    published: true,
    published_by: 'Host Override',
    published_at: Date.now(),
  });
}

// 8. Trigger Second Attack (Interval)
export async function triggerSecondAttack(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);

  await updateDoc(roomRef, {
    secondAttackTriggered: true,
    secondAttackTriggeredAt: Date.now(),
  });

  const msgId = `attack-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'EMERGENCY BROADCAST',
    characterName: 'Security Wire',
    phase: 'INTERVAL',
    text: `SECOND ATTACK CONFIRMED: Dr. Prakash Nair has been attacked in the drug store. Scrawled blood note recovered: "ASK THE SON."`,
    created_at: Date.now(),
    type: 'transmission',
  });
}

// 9. Host Panic Button: Reveal Safari Suit
export async function revealSafariSuitNudge(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);

  await updateDoc(roomRef, {
    safariSuitRevealed: true,
  });

  const msgId = `nudge-safari-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'Sanctum Forensic Wire',
    characterName: 'Forensic Unit',
    phase: 'R4_INTERROGATION',
    text: `Somebody in this building was not wearing scrubs that night.`,
    created_at: Date.now(),
    type: 'safari_nudge',
  });
}

// 10. Compel Token (Priya Menon only)
export async function issueCompel(
  roomCode: string,
  fromUid: string,
  fromChar: string,
  toUid: string,
  toChar: string,
  question: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const compelId = `compel-${Date.now()}`;
  const compelRef = doc(db, 'rooms', cleanCode, 'compels', compelId);

  const compelData: CompelUseData = {
    compelId,
    from_player_uid: fromUid,
    from_character: fromChar,
    to_player_uid: toUid,
    to_character: toChar,
    question,
    status: 'pending',
    used_at: Date.now(),
  };

  await setDoc(compelRef, compelData);

  // Board notification (does NOT expose question or answer)
  const msgId = `compel-notice-${compelId}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: fromUid,
    senderName: fromChar,
    characterName: fromChar,
    phase: 'R4_INTERROGATION',
    text: `⚡ COMPEL TOKEN EXERCISED: ${fromChar} has invoked a compulsory sworn truth demand on ${toChar}!`,
    created_at: Date.now(),
    type: 'compel_notice',
  });
}

export async function answerCompel(
  roomCode: string,
  compelId: string,
  answer: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const compelRef = doc(db, 'rooms', cleanCode, 'compels', compelId);

  await updateDoc(compelRef, {
    answer,
    status: 'answered',
    answered_at: Date.now(),
  });
}

// 11. Dr. Prakash Nair 5-Word Restricted Dispatch
export async function sendNairFiveWords(
  roomCode: string,
  senderUid: string,
  characterName: string,
  text: string,
  currentPhase: GamePhase
): Promise<void> {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length > 5) {
    throw new Error('Maximum five words permitted.');
  }

  const cleanCode = roomCode.trim().toUpperCase();
  const msgId = `nair-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);

  await setDoc(msgRef, {
    msgId,
    senderUid,
    senderName: 'Dr. Prakash Nair',
    characterName,
    phase: currentPhase,
    text: words.join(' '),
    created_at: Date.now(),
    type: 'nair_words',
  });
}

// 12. Scavenger Hunt Objects (Vial & File)
export async function recordHuntFind(
  roomCode: string,
  object: 'vial' | 'file',
  playerUid: string,
  playerName: string,
  characterName: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);

  const field = object === 'vial' ? 'huntVialFoundBy' : 'huntFileFoundBy';
  await updateDoc(roomRef, {
    [field]: `${playerName} (${characterName})`,
  });

  const playerRef = doc(db, 'rooms', cleanCode, 'players', playerUid);
  await updateDoc(playerRef, {
    [object === 'vial' ? 'vialFound' : 'fileFound']: true,
  });

  const itemName = object === 'vial' ? 'Potassium Chloride Vial (OT-3)' : 'Registrar Carbon Copy File';
  const msgId = `hunt-find-${object}-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: playerUid,
    senderName: playerName,
    characterName,
    phase: 'R5_HUNT',
    text: `FORENSIC RECOVERY: ${playerName} (${characterName}) located the ${itemName}!`,
    created_at: Date.now(),
    type: 'clue',
  });
}

// 13. Submit Single Vote
export async function submitVote(
  roomCode: string,
  voterUid: string,
  voterName: string,
  accusedCharId: number,
  accusedCharName: string
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const voteRef = doc(db, 'rooms', cleanCode, 'votes', voterUid);

  const voteData: VoteData = {
    voter_player_id: voterUid,
    voter_name: voterName,
    accused_player_id: String(accusedCharId),
    accused_character_id: accusedCharId,
    accused_character_name: accusedCharName,
    created_at: Date.now(),
  };

  await setDoc(voteRef, voteData);
}

// 14. Submit Deduction Sheet
export async function submitDeduction(
  roomCode: string,
  deduction: Omit<DeductionData, 'submitted_at'>
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const deductionRef = doc(db, 'rooms', cleanCode, 'deductions', deduction.player_id);

  await setDoc(deductionRef, {
    ...deduction,
    submitted_at: Date.now(),
  });
}

// 15. Realtime Listeners
export function listenToRoom(
  roomCode: string,
  onUpdate: (data: RoomData | null) => void
): Unsubscribe {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  return onSnapshot(roomRef, (snap) => {
    onUpdate(snap.exists() ? (snap.data() as RoomData) : null);
  });
}

export function listenToPlayers(
  roomCode: string,
  onUpdate: (players: PlayerData[]) => void
): Unsubscribe {
  const cleanCode = roomCode.trim().toUpperCase();
  const colRef = collection(db, 'rooms', cleanCode, 'players');
  return onSnapshot(colRef, (snap) => {
    const list: PlayerData[] = [];
    snap.forEach((d) => list.push(d.data() as PlayerData));
    list.sort((a, b) => {
      if (a.isHost) return -1;
      if (b.isHost) return 1;
      return a.joinedAt - b.joinedAt;
    });
    onUpdate(list);
  });
}

export function listenToEnvelopeStates(
  roomCode: string,
  onUpdate: (envelopes: EnvelopeStateData[]) => void
): Unsubscribe {
  const cleanCode = roomCode.trim().toUpperCase();
  const colRef = collection(db, 'rooms', cleanCode, 'envelopeStates');
  return onSnapshot(colRef, (snap) => {
    const list: EnvelopeStateData[] = [];
    snap.forEach((d) => list.push(d.data() as EnvelopeStateData));
    list.sort((a, b) => a.letter.localeCompare(b.letter));
    onUpdate(list);
  });
}

export function listenToNairMessages(
  roomCode: string,
  onUpdate: (msgs: NairMessageData[]) => void
): Unsubscribe {
  const cleanCode = roomCode.trim().toUpperCase();
  const colRef = collection(db, 'rooms', cleanCode, 'nairMessages');
  return onSnapshot(colRef, (snap) => {
    const list: NairMessageData[] = [];
    snap.forEach((d) => list.push(d.data() as NairMessageData));
    list.sort((a, b) => a.created_at - b.created_at);
    onUpdate(list);
  });
}

export function listenToVotes(
  roomCode: string,
  onUpdate: (votes: VoteData[]) => void
): Unsubscribe {
  const cleanCode = roomCode.trim().toUpperCase();
  const colRef = collection(db, 'rooms', cleanCode, 'votes');
  return onSnapshot(colRef, (snap) => {
    const list: VoteData[] = [];
    snap.forEach((d) => list.push(d.data() as VoteData));
    onUpdate(list);
  });
}

export function listenToDeductions(
  roomCode: string,
  onUpdate: (deductions: DeductionData[]) => void
): Unsubscribe {
  const cleanCode = roomCode.trim().toUpperCase();
  const colRef = collection(db, 'rooms', cleanCode, 'deductions');
  return onSnapshot(colRef, (snap) => {
    const list: DeductionData[] = [];
    snap.forEach((d) => list.push(d.data() as DeductionData));
    onUpdate(list);
  });
}

export function listenToCompels(
  roomCode: string,
  onUpdate: (compels: CompelUseData[]) => void
): Unsubscribe {
  const cleanCode = roomCode.trim().toUpperCase();
  const colRef = collection(db, 'rooms', cleanCode, 'compels');
  return onSnapshot(colRef, (snap) => {
    const list: CompelUseData[] = [];
    snap.forEach((d) => list.push(d.data() as CompelUseData));
    list.sort((a, b) => b.used_at - a.used_at);
    onUpdate(list);
  });
}

// 16. Solo Play & Simulation Engine

// A. Switch Active Player Character (for solo testing multiple personas)
export async function switchPlayerCharacter(
  roomCode: string,
  playerUid: string,
  targetCharacterId: number
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const playerRef = doc(db, 'rooms', cleanCode, 'players', playerUid);
  const targetChar = CHARACTERS.find((c) => c.id === targetCharacterId);

  if (!targetChar) return;

  await updateDoc(playerRef, {
    characterId: targetChar.id,
    characterName: targetChar.name,
    isReady: true,
  });
}

// B. Fill Room with AI/Bot Suspects
export async function simulateBotSuspects(
  roomCode: string,
  targetCapacity: number = 20
): Promise<number> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  const playersColRef = collection(db, 'rooms', cleanCode, 'players');

  const activeChars = getActiveCharactersForCapacity(targetCapacity);

  // Read existing players
  const { getDocs } = await import('firebase/firestore');
  const existingDocs = await getDocs(playersColRef);
  const existingCharIds = new Set<number>();
  existingDocs.forEach((d) => {
    const data = d.data() as PlayerData;
    if (data.characterId && data.characterId > 0) {
      existingCharIds.add(data.characterId);
    }
  });

  let addedCount = 0;
  for (const char of activeChars) {
    if (!existingCharIds.has(char.id)) {
      const botUid = `bot_${char.id}_${Math.random().toString(36).substring(2, 7)}`;
      const botRef = doc(db, 'rooms', cleanCode, 'players', botUid);
      const botData: PlayerData = {
        uid: botUid,
        name: `${char.name.split(' ')[1] || char.name} (AI)`,
        characterId: char.id,
        characterName: char.name,
        isHost: false,
        isReady: true,
        isBot: true,
        joinedAt: Date.now() + char.id * 100,
        online: true,
      };
      await setDoc(botRef, botData);
      addedCount++;
    }
  }

  // Update room player count
  const updatedDocs = await getDocs(playersColRef);
  await updateDoc(roomRef, {
    playerCount: updatedDocs.size,
    maxPlayerCapacity: targetCapacity,
  });

  // Post announcement to Nair Wire
  const msgId = `sim-bots-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'Central Assembly',
    characterName: 'Dean’s Office',
    phase: 'LOBBY',
    text: `[SIMULATOR] Room populated. Added ${addedCount} AI suspect bot(s). Total active in room: ${updatedDocs.size}.`,
    created_at: Date.now(),
    type: 'system',
  });

  return addedCount;
}

// Clear all AI Bot Suspects (leaves human players intact)
export async function removeBotSuspects(roomCode: string): Promise<number> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  const playersColRef = collection(db, 'rooms', cleanCode, 'players');
  const { getDocs, deleteDoc } = await import('firebase/firestore');

  const existingDocs = await getDocs(playersColRef);
  let removedCount = 0;

  for (const d of existingDocs.docs) {
    const data = d.data() as PlayerData;
    if (data.isBot || data.uid.startsWith('bot_') || data.name.includes('(AI)')) {
      await deleteDoc(d.ref);
      removedCount++;
    }
  }

  const remainingDocs = await getDocs(playersColRef);
  await updateDoc(roomRef, {
    playerCount: remainingDocs.size,
  });

  const msgId = `sim-bots-clear-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'Central Assembly',
    characterName: 'Dean’s Office',
    phase: 'LOBBY',
    text: `[SIMULATOR] Cleared ${removedCount} AI bot suspect(s). ${remainingDocs.size} human suspect(s) remain in session.`,
    created_at: Date.now(),
    type: 'system',
  });

  return removedCount;
}

// Unlock envelopes held entirely by AI Bots
export async function simulateBotOnlyUnlocks(roomCode: string): Promise<number> {
  const cleanCode = roomCode.trim().toUpperCase();
  const playersColRef = collection(db, 'rooms', cleanCode, 'players');
  const { getDocs } = await import('firebase/firestore');
  const playerDocs = await getDocs(playersColRef);

  const playersList: PlayerData[] = [];
  playerDocs.forEach((d) => playersList.push(d.data() as PlayerData));

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  let unlockedCount = 0;

  for (const letter of letters) {
    const env = ENVELOPES[letter];
    if (!env) continue;

    const p1 = playersList.find((p) => p.characterId === env.char_id_1);
    const p2 = playersList.find((p) => p.characterId === env.char_id_2);

    const isP1BotOrMissing = !p1 || p1.isBot || p1.uid.startsWith('bot_');
    const isP2BotOrMissing = !p2 || p2.isBot || p2.uid.startsWith('bot_');

    // If both partners are bots or absent
    if (isP1BotOrMissing && isP2BotOrMissing) {
      const envRef = doc(db, 'rooms', cleanCode, 'envelopeStates', letter);
      const char1 = CHARACTERS.find((c) => c.id === env.char_id_1);
      const char2 = CHARACTERS.find((c) => c.id === env.char_id_2);

      await updateDoc(envRef, {
        unlocked: true,
        unlocked_at: Date.now(),
        unlocked_by: [char1?.name || 'Partner 1 (AI)', char2?.name || 'Partner 2 (AI)'],
        published: true,
        published_by: `${char1?.name.split(' ')[1] || 'Bot'} & ${char2?.name.split(' ')[1] || 'Bot'} (AI)`,
        published_at: Date.now(),
        partner1_submitted: true,
        partner2_submitted: true,
      });
      unlockedCount++;
    }
  }

  if (unlockedCount > 0) {
    const msgId = `bot-unlocks-${Date.now()}`;
    const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
    await setDoc(msgRef, {
      msgId,
      senderUid: 'system',
      senderName: 'Forensic Records',
      characterName: 'Archive Department',
      phase: 'R2_PAIRING',
      text: `[AI SIMULATION] ${unlockedCount} evidence envelope(s) unlocked and published by AI bot partner pairs.`,
      created_at: Date.now(),
      type: 'clue',
    });
  }

  return unlockedCount;
}

// Unlock a single envelope directly (for Director / Test modes)
export async function unlockEnvelopeDirectly(
  roomCode: string,
  envelopeLetter: string,
  unlockedByName: string = 'Director Override'
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const letter = envelopeLetter.toUpperCase();
  const env = ENVELOPES[letter];
  if (!env) return;

  const char1 = CHARACTERS.find((c) => c.id === env.char_id_1);
  const char2 = CHARACTERS.find((c) => c.id === env.char_id_2);

  const envRef = doc(db, 'rooms', cleanCode, 'envelopeStates', letter);
  await updateDoc(envRef, {
    unlocked: true,
    unlocked_at: Date.now(),
    unlocked_by: [char1?.name || unlockedByName, char2?.name || 'Director'],
    partner1_submitted: true,
    partner2_submitted: true,
  });
}

// C. Unlock and Publish All 10 Clue Envelopes (A through J)
export async function simulateUnlockAllClues(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  for (const letter of letters) {
    const env = ENVELOPES[letter];
    if (!env) continue;
    const char1 = CHARACTERS.find((c) => c.id === env.char_id_1);
    const char2 = CHARACTERS.find((c) => c.id === env.char_id_2);

    const envRef = doc(db, 'rooms', cleanCode, 'envelopeStates', letter);
    await updateDoc(envRef, {
      unlocked: true,
      unlocked_at: Date.now() - Math.floor(Math.random() * 60000),
      unlocked_by: [char1?.name || 'Partner 1', char2?.name || 'Partner 2'],
      published: true,
      published_by: `${char1?.name.split(' ')[1] || 'Suspect'} & ${char2?.name.split(' ')[1] || 'Suspect'}`,
      published_at: Date.now(),
      partner1_submitted: true,
      partner2_submitted: true,
    });
  }

  const msgId = `sim-clues-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'Forensic Evidence Board',
    characterName: 'Central Exchange',
    phase: 'R3_BOARD',
    text: `[SOLO SIMULATOR] All 10 Evidence Envelopes (A through J) successfully unlocked, verified, and published to the public board.`,
    created_at: Date.now(),
    type: 'clue',
  });
}

// D. Simulate Scavenger Hunt Discoveries
export async function simulateScavengerRecovery(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);

  await updateDoc(roomRef, {
    huntVialFoundBy: 'Dr. Farida Qureshi (#3)',
    huntFileFoundBy: 'Ayesha Sheikh (#17)',
  });

  const msgId1 = `sim-hunt-1-${Date.now()}`;
  const msgRef1 = doc(db, 'rooms', cleanCode, 'nairMessages', msgId1);
  await setDoc(msgRef1, {
    msgId: msgId1,
    senderUid: 'system',
    senderName: 'Dr. Farida Qureshi',
    characterName: 'Head of Anaesthesia',
    phase: 'R5_HUNT',
    text: `RECOVERY: Found the discarded 10ml Potassium Chloride (KCl) ampoule on the lower shelf of OT-3 surgical cart!`,
    created_at: Date.now(),
    type: 'clue',
  });

  const msgId2 = `sim-hunt-2-${Date.now()}`;
  const msgRef2 = doc(db, 'rooms', cleanCode, 'nairMessages', msgId2);
  await setDoc(msgRef2, {
    msgId: msgId2,
    senderUid: 'system',
    senderName: 'Ayesha Sheikh',
    characterName: 'Union President',
    phase: 'R5_HUNT',
    text: `RECOVERY: Confidential 1995 MCI Batch file located in Archive Room. Vivek Gokhale’s marksheet was forged with 61%!`,
    created_at: Date.now() + 500,
    type: 'clue',
  });
}

// E. Simulate Suspect Wire Transmissions & Dr. Nair Dispatches
export async function simulateWireDispatches(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const sampleMessages: Array<{ sender: string; char: string; text: string; type: NairMessageData['type'] }> = [
    {
      sender: 'Dr. Prakash Nair',
      char: 'Head of Forensic Medicine',
      text: 'Potassium chloride injected left forearm.',
      type: 'nair_words',
    },
    {
      sender: 'Dr. Sanjay Bhatia',
      char: 'Head of Surgery',
      text: 'I left the campus at 9:30 PM. Check the main security gate logs!',
      type: 'transmission',
    },
    {
      sender: 'Dr. Farida Qureshi',
      char: 'Head of Anaesthesia',
      text: 'The OT-3 trolley lock was tampered with before 7 PM. Anyone had access.',
      type: 'transmission',
    },
    {
      sender: 'Rohan Nair',
      char: 'Hostel Secretary',
      text: 'There are only 4 master keys in the entire college. Who was holding them?',
      type: 'transmission',
    },
    {
      sender: 'Priya Menon',
      char: 'First Year Student',
      text: 'I saw size 11 shoe prints near the Anatomy Hall rear emergency drain.',
      type: 'transmission',
    },
    {
      sender: 'Mr. Ramesh Gokhale',
      char: 'College Registrar',
      text: 'I do not have medical training. I was in my ground floor office filing circulars.',
      type: 'transmission',
    },
  ];

  for (let i = 0; i < sampleMessages.length; i++) {
    const item = sampleMessages[i];
    const msgId = `sim-wire-${Date.now()}-${i}`;
    const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
    await setDoc(msgRef, {
      msgId,
      senderUid: `sim_user_${i}`,
      senderName: item.sender,
      characterName: item.char,
      phase: 'R4_INTERROGATION',
      text: item.text,
      created_at: Date.now() - (sampleMessages.length - i) * 8000,
      type: item.type,
    });
  }
}

// F. Simulate Compel Action (Priya Menon -> Ramesh Gokhale)
export async function simulateCompelAction(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const compelId = `compel-sim-${Date.now()}`;
  const compelRef = doc(db, 'rooms', cleanCode, 'compels', compelId);

  const compelData: CompelUseData = {
    compelId,
    from_player_uid: 'sim_priya',
    from_character: 'Priya Menon (#20)',
    to_player_uid: 'sim_ramesh',
    to_character: 'Mr. Ramesh Gokhale (#7)',
    question: 'Under solemn sworn oath: did you enter Operating Theatre 3 between 6:30 PM and 7:00 PM on the night of the murder?',
    answer: 'I did pass by the third floor corridor to collect student records, but I did not touch any surgical equipment.',
    status: 'answered',
    used_at: Date.now() - 30000,
    answered_at: Date.now() - 5000,
  };

  await setDoc(compelRef, compelData);

  const msgId = `compel-notice-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'sim_priya',
    senderName: 'Priya Menon',
    characterName: 'First Year Student',
    phase: 'R4_INTERROGATION',
    text: `SWORN COMPEL ANSWERED: Mr. Ramesh Gokhale responded to the sworn inquiry under public seal.`,
    created_at: Date.now(),
    type: 'compel_notice',
  });
}

// G. Simulate All Votes & 5-Question Deductions (Can target all or only AI bots)
export async function simulateAllVotesAndDeductions(
  roomCode: string,
  onlyBots: boolean = false
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const playersColRef = collection(db, 'rooms', cleanCode, 'players');
  const votesColRef = collection(db, 'rooms', cleanCode, 'votes');
  const deductionsColRef = collection(db, 'rooms', cleanCode, 'deductions');
  const { getDocs } = await import('firebase/firestore');

  const [playerDocs, existingVoteDocs, existingDeductionDocs] = await Promise.all([
    getDocs(playersColRef),
    getDocs(votesColRef),
    getDocs(deductionsColRef),
  ]);

  const existingVoterIds = new Set<string>();
  existingVoteDocs.forEach((d) => existingVoterIds.add(d.id));

  const existingDeductionIds = new Set<string>();
  existingDeductionDocs.forEach((d) => existingDeductionIds.add(d.id));

  const suspectCandidates = [
    { id: 7, name: 'Mr. Ramesh Gokhale', weight: 0.65 }, // 65% vote murderer
    { id: 2, name: 'Dr. Sanjay Bhatia', weight: 0.15 },
    { id: 1, name: 'Dr. Meera Rathod', weight: 0.10 },
    { id: 10, name: 'Aarav Rathod', weight: 0.05 },
    { id: 4, name: 'Dr. Anil Deshmukh', weight: 0.05 },
  ];

  for (const pDoc of playerDocs.docs) {
    const p = pDoc.data() as PlayerData;
    if (p.isHost) continue;

    const isBot = p.isBot || p.uid.startsWith('bot_') || p.name.includes('(AI)');
    if (onlyBots && !isBot) {
      // Leave human players to cast their own real votes and deductions
      continue;
    }

    // Pick suspect based on weights
    const rand = Math.random();
    let selectedCandidate = suspectCandidates[0];
    let cum = 0;
    for (const cand of suspectCandidates) {
      cum += cand.weight;
      if (rand <= cum) {
        selectedCandidate = cand;
        break;
      }
    }

    // Special case: Ramesh (#7) votes for Bhatia or Meera to deflect
    if (p.characterId === 7) {
      selectedCandidate = suspectCandidates[1];
    }

    // Submit Vote only if not already voted by human or if regenerating
    if (!existingVoterIds.has(p.uid) || !onlyBots) {
      const voteRef = doc(db, 'rooms', cleanCode, 'votes', p.uid);
      const voteData: VoteData = {
        voter_player_id: p.uid,
        voter_name: p.name,
        accused_player_id: String(selectedCandidate.id),
        accused_character_id: selectedCandidate.id,
        accused_character_name: selectedCandidate.name,
        created_at: Date.now() - Math.floor(Math.random() * 60000),
      };
      await setDoc(voteRef, voteData);
    }

    // Submit Deduction only if not already submitted by human or if regenerating
    if (!existingDeductionIds.has(p.uid) || !onlyBots) {
      const isCorrectKiller = selectedCandidate.id === 7;
      const isComplicit = p.characterId === 4 || p.characterId === 5; // Management quota accomplices
      let score = (isCorrectKiller ? 40 : 10) + Math.floor(Math.random() * 45);
      if (p.characterId === 20) score = 95; // Priya Menon is sharp
      if (p.characterId === 15) score = 90; // Simran Kale is gold medallist
      if (p.characterId === 7) score = 25; // Killer trying to cover tracks

      const deductionRef = doc(db, 'rooms', cleanCode, 'deductions', p.uid);
      const deductionData: DeductionData = {
        player_id: p.uid,
        player_name: p.name,
        character_name: p.characterName,
        character_id: p.characterId,
        q1_killer: selectedCandidate.name,
        q2_source: isCorrectKiller ? 'OT-3 Potassium Chloride Signout Trolley' : 'Dispensary Shelf',
        q3_motive: isCorrectKiller ? 'Protect Vivek from expulsion over forged 61% marksheet' : 'Dean Seat Racket',
        q4_secrets: ['Master Key Access', 'Size 11 Leather Shoes in Bin', 'Grey Safari Suit'],
        q5_envelope: 'Envelope G (Vivek Gokhale Admission File)',
        score,
        complicit: isComplicit,
        submitted_at: Date.now() - Math.floor(Math.random() * 50000),
      };
      await setDoc(deductionRef, deductionData);
    }
  }
}

// H. 1-Click Instant Full Game Simulation (Jumps to Reveal with all data populated)
export async function simulateInstantFullGame(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();

  // 1. Fill 20 bots
  await simulateBotSuspects(cleanCode, 20);

  // 2. Unlock all 10 clues
  await simulateUnlockAllClues(cleanCode);

  // 3. Find both scavenger hunt items
  await simulateScavengerRecovery(cleanCode);

  // 4. Send wire transmissions
  await simulateWireDispatches(cleanCode);

  // 5. Simulate Compel
  await simulateCompelAction(cleanCode);

  // 6. Trigger Second Attack & Safari Suit Panic
  const roomRef = doc(db, 'rooms', cleanCode);
  await updateDoc(roomRef, {
    secondAttackTriggered: true,
    secondAttackTriggeredAt: Date.now() - 120000,
    safariSuitRevealed: true,
  });

  // 7. Populate All Votes and Deductions
  await simulateAllVotesAndDeductions(cleanCode);

  // 8. Set phase to REVEAL
  await advanceGamePhase(cleanCode, 'REVEAL');
}

// I. Reset Game Room Back to Clean Lobby
export async function simulateResetRoom(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);

  // Reset room fields
  await updateDoc(roomRef, {
    phase: 'LOBBY',
    phaseStartedAt: Date.now(),
    secondAttackTriggered: false,
    safariSuitRevealed: false,
    huntVialFoundBy: null,
    huntFileFoundBy: null,
    timerPaused: false,
  });

  // Reset envelopes
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  for (const letter of letters) {
    const envRef = doc(db, 'rooms', cleanCode, 'envelopeStates', letter);
    await updateDoc(envRef, {
      unlocked: false,
      unlocked_at: null,
      unlocked_by: [],
      published: false,
      published_by: null,
      published_at: null,
      partner1_submitted: false,
      partner2_submitted: false,
    });
  }

  // Clear votes, deductions, compels
  const { getDocs, deleteDoc: delDoc } = await import('firebase/firestore');
  const votesRef = collection(db, 'rooms', cleanCode, 'votes');
  const voteSnaps = await getDocs(votesRef);
  for (const d of voteSnaps.docs) await delDoc(d.ref);

  const dedRef = collection(db, 'rooms', cleanCode, 'deductions');
  const dedSnaps = await getDocs(dedRef);
  for (const d of dedSnaps.docs) await delDoc(d.ref);

  const compRef = collection(db, 'rooms', cleanCode, 'compels');
  const compSnaps = await getDocs(compRef);
  for (const d of compSnaps.docs) await delDoc(d.ref);

  // Welcome announcement
  const msgId = `reset-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'system',
    senderName: 'Central Exchange',
    characterName: 'Director Deck',
    phase: 'LOBBY',
    text: `Room reset to initial LOBBY state. All suspect records cleansed.`,
    created_at: Date.now(),
    type: 'system',
  });
}

// J. Create a Pre-Populated Solo Demo Room (1-click from entry screen)
export async function createSoloDemoRoom(
  hostUid: string,
  hostName: string = 'Game Director'
): Promise<string> {
  const roomCode = await createGameRoom(hostUid, hostName, 20);
  await simulateBotSuspects(roomCode, 20);
  return roomCode;
}

// K. Jump Directly to Any Phase (Time Travel)
export async function jumpToPhaseDirectly(roomCode: string, targetPhase: GamePhase): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, 'rooms', cleanCode);
  await updateDoc(roomRef, {
    phase: targetPhase,
    phaseStartedAt: Date.now(),
    timerPaused: false,
  });

  const msgId = `phase-jump-${Date.now()}`;
  const msgRef = doc(db, 'rooms', cleanCode, 'nairMessages', msgId);
  await setDoc(msgRef, {
    msgId,
    senderUid: 'director',
    senderName: 'Director Override',
    characterName: 'Time Travel Engine',
    phase: targetPhase,
    text: `⚡ Phase warped directly to [${targetPhase}].`,
    created_at: Date.now(),
    type: 'system',
  });
}

// L. Export Full Board State as JSON
export async function exportFullRoomState(roomCode: string): Promise<FullRoomSnapshot> {
  const cleanCode = roomCode.trim().toUpperCase();
  const { getDocs } = await import('firebase/firestore');

  // Room
  const roomRef = doc(db, 'rooms', cleanCode);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error(`Room ${cleanCode} does not exist.`);
  const roomData = roomSnap.data() as RoomData;

  // Players
  const playersRef = collection(db, 'rooms', cleanCode, 'players');
  const playersSnap = await getDocs(playersRef);
  const players = playersSnap.docs.map((d) => d.data() as PlayerData);

  // EnvelopeStates
  const envRef = collection(db, 'rooms', cleanCode, 'envelopeStates');
  const envSnap = await getDocs(envRef);
  const envelopeStates: Record<string, EnvelopeStateData> = {};
  envSnap.docs.forEach((d) => {
    envelopeStates[d.id] = d.data() as EnvelopeStateData;
  });

  // Votes
  const votesRef = collection(db, 'rooms', cleanCode, 'votes');
  const votesSnap = await getDocs(votesRef);
  const votes = votesSnap.docs.map((d) => d.data() as VoteData);

  // Deductions
  const dedRef = collection(db, 'rooms', cleanCode, 'deductions');
  const dedSnap = await getDocs(dedRef);
  const deductions = dedSnap.docs.map((d) => d.data() as DeductionData);

  // Compels
  const compRef = collection(db, 'rooms', cleanCode, 'compels');
  const compSnap = await getDocs(compRef);
  const compels = compSnap.docs.map((d) => d.data() as CompelUseData);

  // NairMessages
  const msgRef = collection(db, 'rooms', cleanCode, 'nairMessages');
  const msgSnap = await getDocs(msgRef);
  const nairMessages = msgSnap.docs.map((d) => d.data() as NairMessageData);

  return {
    exportedAt: Date.now(),
    roomCode: cleanCode,
    roomData,
    players,
    envelopeStates,
    votes,
    deductions,
    compels,
    nairMessages,
  };
}

// M. Import / Restore Full Board State from JSON
export async function importFullRoomState(roomCode: string, snapshot: FullRoomSnapshot): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();

  // Restore Room Data
  const roomRef = doc(db, 'rooms', cleanCode);
  await setDoc(roomRef, {
    ...snapshot.roomData,
    roomCode: cleanCode,
    phaseStartedAt: Date.now(),
  });

  // Restore Players
  for (const p of snapshot.players) {
    const pRef = doc(db, 'rooms', cleanCode, 'players', p.uid);
    await setDoc(pRef, p);
  }

  // Restore Envelopes
  if (snapshot.envelopeStates) {
    for (const [letter, env] of Object.entries(snapshot.envelopeStates)) {
      const eRef = doc(db, 'rooms', cleanCode, 'envelopeStates', letter);
      await setDoc(eRef, env);
    }
  }

  // Restore Votes
  if (snapshot.votes) {
    for (const v of snapshot.votes) {
      const vRef = doc(db, 'rooms', cleanCode, 'votes', v.voter_player_id);
      await setDoc(vRef, v);
    }
  }

  // Restore Deductions
  if (snapshot.deductions) {
    for (const d of snapshot.deductions) {
      const dRef = doc(db, 'rooms', cleanCode, 'deductions', d.player_id);
      await setDoc(dRef, d);
    }
  }

  // Restore Compels
  if (snapshot.compels) {
    for (const c of snapshot.compels) {
      const cRef = doc(db, 'rooms', cleanCode, 'compels', c.compelId);
      await setDoc(cRef, c);
    }
  }

  // Restore Messages
  if (snapshot.nairMessages) {
    for (const m of snapshot.nairMessages) {
      const mRef = doc(db, 'rooms', cleanCode, 'nairMessages', m.msgId);
      await setDoc(mRef, m);
    }
  }
}

// N. Execute Scenario Replay Script & Generate Oracle Trace
export async function executeScenarioScript(
  roomCode: string,
  script: ScenarioAction[],
  onStepProgress?: (step: number, total: number) => void
): Promise<ScenarioReplayLog[]> {
  const cleanCode = roomCode.trim().toUpperCase();
  const logs: ScenarioReplayLog[] = [];
  const publishedLetters = new Set<string>();
  const hostReadClues = new Set<string>();
  let currentPhase: GamePhase = 'LOBBY';

  for (let i = 0; i < script.length; i++) {
    const step = script[i];
    if (onStepProgress) onStepProgress(i + 1, script.length);

    let summary = '';
    const phase = step.phase || currentPhase;

    switch (step.action) {
      case 'SEED_BOTS': {
        const count = step.payload?.botCount || 20;
        await simulateBotSuspects(cleanCode, count);
        summary = `Seeded ${count} suspect bots and verified assignments.`;
        break;
      }
      case 'ADVANCE_PHASE': {
        const targetPhase = (step.payload?.phase || phase) as GamePhase;
        currentPhase = targetPhase;
        await jumpToPhaseDirectly(cleanCode, targetPhase);
        summary = `Advanced phase to [${targetPhase}].`;
        break;
      }
      case 'HOST_READ_CLUE': {
        const cardId = step.payload?.cardId || String(phase);
        hostReadClues.add(cardId);
        summary = `Host read Tier III Clue Card: [${cardId}].`;
        break;
      }
      case 'UNLOCK_ENVELOPE': {
        const letter = (step.payload?.letter || 'A').toUpperCase();
        await unlockEnvelopeDirectly(cleanCode, letter, 'Replay Partner');
        summary = `Unlocked Envelope ${letter} directly.`;
        break;
      }
      case 'PUBLISH_ENVELOPE': {
        const letter = (step.payload?.letter || 'A').toUpperCase();
        publishedLetters.add(letter);
        await publishEnvelopeToBoard(cleanCode, letter, step.actor || 'Investigator');
        summary = `Published Envelope ${letter} to Public Evidence Board.`;
        break;
      }
      case 'TRIGGER_ATTACK': {
        await triggerSecondAttack(cleanCode);
        summary = `Triggered Second Attack event in Anatomy Hall.`;
        break;
      }
      case 'COMPEL': {
        const fromChar = step.payload?.fromCharacter || 'Priya Menon';
        const toChar = step.payload?.toCharacter || 'Mr. Ramesh Gokhale';
        const question = step.payload?.question || 'Where were you between 11 PM and midnight?';
        const answer = step.payload?.answer || 'I was securing the administrative records.';
        await issueCompel(cleanCode, 'bot-priya', fromChar, 'bot-ramesh', toChar, question);
        summary = `Priya Menon exercised Compel against ${toChar}.`;
        break;
      }
      case 'SUBMIT_DEDUCTION':
      case 'SUBMIT_VOTE': {
        await simulateAllVotesAndDeductions(cleanCode);
        summary = `Submitted all 20 suspect ballots and scoring deductions.`;
        break;
      }
      case 'SEND_WIRE': {
        const text = step.payload?.text || 'URGENT: Formalin test positive.';
        await sendNairFiveWords(cleanCode, 'director', 'Dr. Prakash Nair', text, phase);
        summary = `Broadcast telegraph wire: "${text}"`;
        break;
      }
      default: {
        summary = `Executed action: ${step.action}`;
      }
    }

    // Recompute Oracle State at this boundary
    const oracle = computeOracleState(
      Array.from(publishedLetters),
      Array.from(hostReadClues),
      currentPhase
    );

    logs.push({
      step: i + 1,
      phase,
      actor: step.actor || 'Director',
      action: step.action,
      summary,
      oracle: {
        candidatesRemaining: oracle.candidatesRemaining,
        survivingNames: oracle.survivingCharacters.map((c) => c.name),
        newEliminations: oracle.eliminatedRecords.map((r) => `${r.characterName} (${r.slipId})`),
        isSolved: oracle.isSolved,
      },
    });
  }

  return logs;
}


