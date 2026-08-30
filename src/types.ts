export type GamePhase =
  | 'LOBBY'
  | 'READ_IN'
  | 'R1_WAKE'
  | 'R2_PAIRING'
  | 'R3_BOARD'
  | 'INTERVAL'
  | 'R4_INTERROGATION'
  | 'R5_HUNT'
  | 'DEDUCTION'
  | 'VOTE'
  | 'REVEAL';

export interface RoomData {
  roomCode: string;
  phase: GamePhase;
  phaseStartedAt: number;
  playerCount: number;
  maxPlayerCapacity: number; // 12-20
  hostUid: string;
  createdAt: number;
  secondAttackTriggered?: boolean;
  secondAttackTriggeredAt?: number;
  safariSuitRevealed?: boolean;
  huntVialFoundBy?: string | null;
  huntFileFoundBy?: string | null;
  customTimerSeconds?: number;
  timerPaused?: boolean;
  tier3RevealedIndex?: number; // 0 to 10 in R5_HUNT
  revealStepIndex?: number; // -1 to 7 during REVEAL
  lastSealedBanner?: {
    letter: string;
    tier: 'I' | 'II';
    members: string[];
    isRefusal?: boolean;
    timestamp: number;
  } | null;
  lastPublishedBanner?: {
    letter: string;
    tier: 'I' | 'II' | 'III';
    summary: string;
    timestamp: number;
  } | null;
}

export interface CharacterData {
  id: number;
  name: string;
  title: string;
  public_bio: string;
  secret?: string;
  goal?: string;
  known_fact?: string;
  fragment_riddle: string;
  code_half: string;
  speaks_first: boolean;
  envelope_letter: string;
  is_murderer?: boolean;
  intro_en?: string;
  intro_gu?: string;
  generation?: 'senior' | 'junior';
  batch?: string;
  parent_of?: number | null;
  child_of?: number | null;
  extension?: string;
  special_notes?: string;
  has_compel_token?: boolean;
  has_second_attack?: boolean;
}

export interface SlipData {
  tier: 'I' | 'II' | 'III';
  round: number;
  sealable: boolean;
  paper: 'white' | 'pale yellow' | 'red';
  title: string;
  text: string;
  board_summary: string;
  eliminates: number[];
  narrows_to?: number[] | null;
  why: string;
  read_by?: string;
}

export interface EnvelopeData {
  letter: string; // 'A' through 'J'
  members?: [number, number];
  code?: string;
  title: string;
  body?: string;
  char_id_1: number;
  char_id_2: number;
  full_code?: string;
  summary: string;
  slips?: SlipData[];
  eliminates?: number[]; // character ids this slip rules out
  reason?: string; // one-line reason string
}

export interface PlayerData {
  uid: string;
  name: string;
  characterId: number;
  characterName: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
  online: boolean;
  isBot?: boolean;
  vialFound?: boolean;
  fileFound?: boolean;
  isManuallyAssigned?: boolean;
  isLocked?: boolean;
}

export interface EnvelopeStateData {
  letter: string; // 'A' - 'J'
  unlocked: boolean;
  unlocked_at: number | null;
  unlocked_by?: string[]; // player names/ids
  published: boolean;
  published_by: string | null;
  published_at: number | null;
  partner1_submitted?: boolean;
  partner2_submitted?: boolean;
  // Multi-tier & Sealing States
  tier1_state?: 'LOCKED' | 'PUBLISHED' | 'SEALED' | 'SEALED_REFUSAL' | 'FORCED_OPEN';
  tier2_state?: 'LOCKED' | 'PUBLISHED' | 'SEALED' | 'SEALED_REFUSAL' | 'FORCED_OPEN';
  tier3_state?: 'LOCKED' | 'PUBLISHED';
  tier1_published?: boolean;
  tier2_published?: boolean;
  tier3_published?: boolean;
  tier1_sealed?: boolean;
  tier2_sealed?: boolean;
  tier1_refusal?: boolean;
  tier2_refusal?: boolean;
  tier1_forced_open?: boolean;
  tier2_forced_open?: boolean;
}

export interface CompelUseData {
  compelId: string;
  from_player_uid: string;
  from_character: string;
  to_player_uid: string;
  to_character: string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered';
  used_at: number;
  answered_at?: number;
}

export interface NairMessageData {
  msgId: string;
  senderUid: string;
  senderName: string;
  characterName: string;
  phase: GamePhase | string;
  text: string;
  created_at: number;
  type: 'transmission' | 'clue' | 'nair_words' | 'system' | 'compel_notice' | 'safari_nudge';
}

export interface VoteData {
  voter_player_id: string;
  voter_name: string;
  accused_player_id: string;
  accused_character_id: number;
  accused_character_name: string;
  created_at: number;
}

export interface DeductionData {
  player_id: string;
  player_name: string;
  character_name: string;
  character_id: number;
  q1_killer: string; // Character name or id
  q2_source: string;
  q3_motive: string;
  q4_secrets: string[];
  q5_envelope: string;
  score?: number;
  complicit?: boolean;
  submitted_at: number;
}

export interface HuntFindData {
  object: 'vial' | 'file';
  found_by_player_id: string;
  found_by_name: string;
  found_at: number;
}

export interface ClueCard {
  id: string;
  phase: GamePhase;
  title: string;
  subtitle: string;
  readAloudText: string;
  eliminates?: number[]; // character ids this slip rules out
  reason?: string; // one-line reason string
}

export interface EliminationRecord {
  characterId: number;
  characterName: string;
  slipId: string; // e.g. "Envelope A" or "Clue Card 1"
  reason: string;
  phase: GamePhase | string;
  timestamp?: number;
}

export interface OracleState {
  candidatesRemaining: number;
  survivingCharacters: CharacterData[];
  eliminatedRecords: EliminationRecord[];
  isSolved: boolean;
  solvedRound?: string;
  solvedSlip?: string;
}

export interface ScenarioAction {
  phase?: GamePhase;
  actor?: string;
  action: 'PUBLISH_ENVELOPE' | 'UNLOCK_ENVELOPE' | 'HOST_READ_CLUE' | 'ADVANCE_PHASE' | 'SUBMIT_VOTE' | 'SUBMIT_DEDUCTION' | 'SEND_WIRE' | 'TRIGGER_ATTACK' | 'COMPEL' | 'SEED_BOTS';
  payload?: any;
}

export interface ScenarioReplayLog {
  step: number;
  phase: GamePhase | string;
  actor: string;
  action: string;
  summary: string;
  oracle: {
    candidatesRemaining: number;
    survivingNames: string[];
    newEliminations: string[];
    isSolved: boolean;
  };
}

export interface FullRoomSnapshot {
  exportedAt: number;
  roomCode: string;
  roomData: RoomData;
  players: PlayerData[];
  envelopeStates: Record<string, EnvelopeStateData>;
  votes: VoteData[];
  deductions: DeductionData[];
  compels: CompelUseData[];
  nairMessages: NairMessageData[];
  hostReadSlips?: string[];
}
