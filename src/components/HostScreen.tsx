import React, { useState, useEffect } from 'react';
import {
  RoomData,
  PlayerData,
  EnvelopeStateData,
  NairMessageData,
  VoteData,
  DeductionData,
  CompelUseData,
  GamePhase,
  ClueCard,
} from '../types';
import {
  CHARACTERS,
  ENVELOPES,
  PHASE_CONFIG,
  DROP_ORDER_CHARACTER_IDS,
} from '../data/game';
import {
  advanceGamePhase,
  updateRoomCapacity,
  hostReassignCharacter,
  hostForceUnlockEnvelope,
  hostForcePublishEnvelope,
  triggerSecondAttack,
  revealSafariSuitNudge,
  recordHuntFind,
  simulateBotSuspects,
  removeBotSuspects,
  simulateBotOnlyUnlocks,
  simulateAllVotesAndDeductions,
  simulateUnlockAllClues,
  simulateInstantFullGame,
  autoAssignRemainingCharacters,
  togglePlayerLock,
} from '../lib/firestoreService';
import { fetchClueCard, fetchGameSolution } from '../lib/apiService';
import { sound } from '../lib/audio';
import { ClueCardModal } from './ClueCardModal';
import { EnvelopeModal } from './EnvelopeModal';
import { SpectatorScreen } from './SpectatorScreen';
import { SoloSimulatorModal } from './SoloSimulatorModal';
import { PlayerManualModal } from './PlayerManualModal';
import { RelationshipMapModal } from './RelationshipMapModal';
import {
  Shield,
  Users,
  Tv,
  ExternalLink,
  FastForward,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Globe,
  Radio,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  Flame,
  Award,
  Zap,
  FlaskConical,
  Sparkles,
  Bot,
  User,
  FolderClosed,
  FileCheck,
  Ban,
  PartyPopper,
  Stamp,
  Building2,
  BookOpen,
  Network,
  Shuffle,
  Pin,
  PinOff,
  UserCheck,
  RotateCcw,
  Check,
} from 'lucide-react';

interface HostScreenProps {
  room: RoomData;
  players: PlayerData[];
  envelopeStates: EnvelopeStateData[];
  nairMessages: NairMessageData[];
  votes: VoteData[];
  deductions: DeductionData[];
  compels: CompelUseData[];
  hostUid: string;
}

export const HostScreen: React.FC<HostScreenProps> = ({
  room,
  players,
  envelopeStates,
  nairMessages,
  votes,
  deductions,
  compels,
  hostUid,
}) => {
  const [selectedClueCard, setSelectedClueCard] = useState<ClueCard | null>(null);
  const [selectedEnvelopeLetter, setSelectedEnvelopeLetter] = useState<string | null>(null);
  const [isSpectatorMode, setIsSpectatorMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [assignmentViewMode, setAssignmentViewMode] = useState<'by_player' | 'by_character'>('by_player');
  const [isAutoAssigning, setIsAutoAssigning] = useState<boolean>(false);
  const [autoAssignFeedback, setAutoAssignFeedback] = useState<string | null>(null);
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');
  const [activeClueCard, setActiveClueCard] = useState<ClueCard | null>(null);
  const [solutionData, setSolutionData] = useState<any | null>(null);

  const currentPhase = room.phase || 'LOBBY';
  const phaseInfo = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.LOBBY;
  const capacity = room.maxPlayerCapacity || 20;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  useEffect(() => {
    let isMounted = true;
    if (room?.roomCode && currentPhase) {
      fetchClueCard(room.roomCode, currentPhase).then((card) => {
        if (isMounted) setActiveClueCard(card);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [room?.roomCode, currentPhase]);

  useEffect(() => {
    let isMounted = true;
    if (room?.roomCode && (currentPhase === 'REVEAL' || room.hostUid === hostUid)) {
      fetchGameSolution(room.roomCode).then((sol) => {
        if (isMounted) setSolutionData(sol);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [room?.roomCode, currentPhase, room.hostUid, hostUid]);

  // Timer calculation
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    const totalDuration = room.customTimerSeconds ?? phaseInfo.defaultDurationSeconds;
    if (totalDuration <= 0) {
      setSecondsLeft(0);
      return;
    }

    const calcTime = () => {
      const elapsed = Math.floor((Date.now() - (room.phaseStartedAt || Date.now())) / 1000);
      const remaining = Math.max(0, totalDuration - elapsed);
      setSecondsLeft(remaining);
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [room.phaseStartedAt, room.customTimerSeconds, phaseInfo.defaultDurationSeconds]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const humanPlayers = players.filter((p) => !p.isHost && !p.isBot && !p.uid.startsWith('bot_') && !p.name.includes('(AI)'));
  const botPlayers = players.filter((p) => p.isBot || p.uid.startsWith('bot_') || p.name.includes('(AI)'));
  const allGamePlayers = players.filter((p) => !p.isHost);
  const totalSuspects = allGamePlayers.length;
  const droppedIds = new Set(DROP_ORDER_CHARACTER_IDS.slice(0, 20 - capacity));
  const activeCharacters = CHARACTERS.filter((c) => !droppedIds.has(c.id));

  const handleOpenTvPopup = () => {
    sound.playClick();
    const tvUrl = `${window.location.origin}${window.location.pathname}?tv=${room.roomCode}`;
    window.open(tvUrl, '_blank', 'noopener,noreferrer');
  };

  // Phase navigation
  const phasesList: GamePhase[] = [
    'LOBBY',
    'READ_IN',
    'R1_WAKE',
    'R2_PAIRING',
    'R3_BOARD',
    'INTERVAL',
    'R4_INTERROGATION',
    'R5_HUNT',
    'DEDUCTION',
    'VOTE',
    'REVEAL',
  ];

  const handleNextPhase = async () => {
    const currentIdx = phasesList.indexOf(currentPhase);
    if (currentIdx < phasesList.length - 1) {
      const nextP = phasesList[currentIdx + 1];
      setIsAdvancing(true);
      sound.playStinger();
      try {
        await advanceGamePhase(room.roomCode, nextP);
      } finally {
        setIsAdvancing(false);
      }
    }
  };

  const handleCapacityChange = async (newCap: number) => {
    sound.playClick();
    await updateRoomCapacity(room.roomCode, newCap);
  };

  const handleReassign = async (playerUid: string, newCharId: number) => {
    sound.playClick();
    await hostReassignCharacter(room.roomCode, playerUid, newCharId, true, true);
  };

  const handleToggleLock = async (playerUid: string, currentLock: boolean) => {
    sound.playClick();
    await togglePlayerLock(room.roomCode, playerUid, !currentLock);
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    sound.playClick();
    try {
      const lockedUids = players
        .filter((p) => !p.isHost && (p.isLocked || p.isManuallyAssigned))
        .map((p) => p.uid);
      const res = await autoAssignRemainingCharacters(room.roomCode, lockedUids, 'remaining');
      sound.playClueFound();
      setAutoAssignFeedback(res.message);
      setTimeout(() => setAutoAssignFeedback(null), 5000);
    } catch (err: unknown) {
      console.error(err);
      setAutoAssignFeedback(err instanceof Error ? err.message : 'Auto-assign failed');
      setTimeout(() => setAutoAssignFeedback(null), 5000);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleShuffleAll = async () => {
    if (
      !confirm(
        'Randomly shuffle all active suspect files across all players in the room? Any locked manual selections will be randomized.'
      )
    ) {
      return;
    }
    setIsAutoAssigning(true);
    sound.playClick();
    try {
      const res = await autoAssignRemainingCharacters(room.roomCode, [], 'shuffle_all');
      sound.playClueFound();
      setAutoAssignFeedback(res.message);
      setTimeout(() => setAutoAssignFeedback(null), 5000);
    } catch (err: unknown) {
      console.error(err);
      setAutoAssignFeedback(err instanceof Error ? err.message : 'Shuffle failed');
      setTimeout(() => setAutoAssignFeedback(null), 5000);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleTriggerSecondAttack = async () => {
    if (confirm('TRIGGER EMERGENCY BROADCAST: This locks Dr. Prakash Nair into 5-word restricted mode. Proceed?')) {
      sound.playCompelAlert();
      await triggerSecondAttack(room.roomCode);
    }
  };

  const handleRevealSafariSuit = async () => {
    sound.playClick();
    await revealSafariSuitNudge(room.roomCode);
  };

  const handleForceUnlock = async (letter: string) => {
    sound.playClueFound();
    await hostForceUnlockEnvelope(room.roomCode, letter);
  };

  const handleForcePublish = async (letter: string) => {
    sound.playClueFound();
    await hostForcePublishEnvelope(room.roomCode, letter);
  };

  const toggleSoundMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Vote counting logic
  const voteTallies: Record<string, { count: number; name: string; voters: string[] }> = {};
  votes.forEach((v) => {
    const targetKey = v.accused_character_name;
    if (!voteTallies[targetKey]) {
      voteTallies[targetKey] = { count: 0, name: targetKey, voters: [] };
    }
    voteTallies[targetKey].count += 1;
    voteTallies[targetKey].voters.push(v.voter_name);
  });

  const sortedVoteTallies = Object.values(voteTallies).sort((a, b) => b.count - a.count);

  // Scored deductions
  const scoredDeductions = deductions.map((d) => {
    let score = 0;
    const q1Correct = d.q1_killer.toLowerCase().includes('gokhale') || d.q1_killer === '7' || d.q1_killer.toLowerCase().includes('ramesh');
    if (q1Correct) score += 5;

    const q2Correct = d.q2_source.toLowerCase().includes('ot-3') || d.q2_source.toLowerCase().includes('potassium') || d.q2_source.toLowerCase().includes('trolley');
    if (q2Correct) score += 3;

    const q3Correct = d.q3_motive.toLowerCase().includes('vivek') || d.q3_motive.toLowerCase().includes('forg') || d.q3_motive.toLowerCase().includes('marksheet');
    if (q3Correct) score += 3;

    const secretsCount = Math.min(3, (d.q4_secrets || []).filter(Boolean).length);
    score += secretsCount;

    const q5Correct = ['G', 'E', 'I', 'J', 'A'].some((ltr) => d.q5_envelope?.toUpperCase().includes(ltr));
    if (q5Correct) score += 2;

    const murdererEscaped = sortedVoteTallies.length > 0 && !sortedVoteTallies[0].name.toLowerCase().includes('gokhale');
    const isComplicit = murdererEscaped && (d.character_id === 7 || d.character_id === 15);

    return {
      ...d,
      calculatedScore: score,
      isComplicit,
    };
  }).sort((a, b) => b.calculatedScore - a.calculatedScore);

  if (isSpectatorMode) {
    return (
      <SpectatorScreen
        room={room}
        players={players}
        envelopeStates={envelopeStates}
        nairMessages={nairMessages}
        votes={votes}
        deductions={deductions}
        onExitSpectator={() => setIsSpectatorMode(false)}
      />
    );
  }

  const selectedEnvelopeData = selectedEnvelopeLetter ? ENVELOPES[selectedEnvelopeLetter] : null;
  const selectedEnvelopeState = selectedEnvelopeLetter ? envelopeStates.find((e) => e.letter === selectedEnvelopeLetter) : undefined;

  return (
    <div className="flex-1 bg-[#0D0C0B] text-[#F7F4EF] p-4 sm:p-8 font-sans min-h-screen">
      {/* Top TV Command Header: 15-foot viewing distance with 32px min typography */}
      <header className="bg-[#171615] rounded-2xl p-6 sm:p-8 mb-8 border-2 border-white/10 shadow-2xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Main Title & Phase Announcement (32px+ for TV across room) */}
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#8B1A1A]/30 border-2 border-[#8B1A1A] flex items-center justify-center text-[#8B1A1A] shrink-0">
              <Shield className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-typewriter uppercase tracking-widest text-[#8B1A1A] font-bold">
                  CASE INQUIRY DESK • GOVERNMENT MEDICAL COLLEGE (1995)
                </span>
                <span className="text-white/30 text-sm">•</span>
                <span className="text-sm font-typewriter text-[#E8D5A3]">
                  {humanPlayers.length} / {capacity} Suspects Logged
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-[#F7F4EF] tracking-tight mt-1">
                Room <span className="font-typewriter text-[#E8D5A3] font-black">{room.roomCode}</span> •{' '}
                <span className="text-[#8B1A1A]">{phaseInfo.title}</span>
              </h1>
              <p className="text-base sm:text-lg font-typewriter text-white/70 mt-1">
                {phaseInfo.hostInstructions}
              </p>
            </div>
          </div>

          {/* TV Controls & Timer Display */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Live TV Timer (32px font for room legibility) */}
            <div className="bg-black/90 border-2 border-white/20 px-6 py-3 rounded-2xl flex items-center gap-4 font-typewriter shadow-inner">
              <div className="text-right">
                <span className="text-xs uppercase text-white/50 block font-bold">Phase Timer</span>
                <span className="text-3xl sm:text-4xl font-black text-[#E8D5A3] tracking-widest">
                  {formatTimer(secondsLeft)}
                </span>
              </div>
            </div>

            {/* Read Clue Card Button */}
            {activeClueCard && (
              <button
                onClick={() => setSelectedClueCard(activeClueCard)}
                className="px-5 py-4 bg-[#8B1A1A] hover:bg-[#A82020] text-white text-sm font-typewriter uppercase tracking-wider rounded-2xl flex items-center gap-2.5 transition-all shadow-xl animate-pulse active:scale-95"
                id="btn-open-clue-card"
              >
                <Volume2 className="w-6 h-6" />
                <span className="font-bold">Read Official Clue</span>
              </button>
            )}

            {/* How to Play Manual Modal */}
            <button
              onClick={() => {
                sound.playClick();
                setIsManualOpen(true);
              }}
              className="px-4 py-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-typewriter uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow"
              id="btn-host-open-manual"
            >
              <BookOpen className="w-5 h-5" />
              <span>How to Play</span>
            </button>

            {/* Campus Tree & Hierarchy */}
            <button
              onClick={() => {
                sound.playClick();
                setIsMapOpen(true);
              }}
              className="px-4 py-4 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-sm font-typewriter uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow"
              id="btn-host-open-map"
            >
              <Network className="w-5 h-5" />
              <span>Family Tree</span>
            </button>

            {/* Pop-out TV Spectator Mode */}
            <button
              onClick={handleOpenTvPopup}
              className="px-5 py-4 bg-[#2E4A6B] hover:bg-[#1E334D] text-white border border-[#2E4A6B]/50 text-sm font-typewriter uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95"
              title="Open the TV Spectator Screen in a new browser window to drag onto your TV or secondary display"
              id="btn-popout-tv-screen"
            >
              <ExternalLink className="w-5 h-5 text-amber-300" />
              <span>Pop-out TV Screen</span>
            </button>

            {/* In-Tab TV Clean Screen Mode */}
            <button
              onClick={() => setIsSpectatorMode(true)}
              className="px-5 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-typewriter uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all active:scale-95"
              id="btn-open-spectator-mode"
            >
              <Tv className="w-5 h-5 text-sky-400" />
              <span>TV Clean Screen</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSoundMute}
              className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20"
              title="Toggle Case Audio"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6 text-[#8B1A1A]" />}
            </button>

            {/* Solo Sim Launcher */}
            <button
              onClick={() => {
                sound.playClick();
                setIsSimulatorOpen(true);
              }}
              className="px-5 py-4 bg-[#2E4A6B] hover:bg-[#1E334D] text-white text-sm font-typewriter uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-lg"
              id="btn-host-open-solo-sim"
            >
              <FlaskConical className="w-5 h-5 text-amber-300" />
              <span>Sim Deck</span>
            </button>

            {/* Advance Phase Button */}
            <button
              onClick={handleNextPhase}
              disabled={isAdvancing || currentPhase === 'REVEAL'}
              className="px-7 py-4 bg-[#8B1A1A] hover:bg-[#A82020] disabled:bg-white/10 text-white text-sm font-typewriter uppercase tracking-widest font-bold rounded-2xl flex items-center gap-3 shadow-2xl active:scale-95"
              id="btn-advance-phase-host"
            >
              <span>Next Phase</span>
              <FastForward className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Phase Progress Breadcrumbs */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          {phasesList.map((p, idx) => {
            const isCurrent = p === currentPhase;
            const isPast = phasesList.indexOf(currentPhase) > idx;

            return (
              <button
                key={p}
                onClick={async () => {
                  if (confirm(`Jump case timeline to phase ${p}?`)) {
                    await advanceGamePhase(room.roomCode, p);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-typewriter uppercase tracking-wider rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-[#8B1A1A] text-white font-bold shadow-lg scale-105'
                    : isPast
                    ? 'bg-white/15 text-white/80 hover:bg-white/25'
                    : 'bg-black/40 text-white/30 hover:text-white/60'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </header>

      {/* Hybrid AI Suspects & Multi-Screen Command Bar */}
      <section
        className="bg-[#171615] rounded-3xl p-5 sm:p-6 border-2 border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        id="host-ai-suspects-bar"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shrink-0 shadow-inner">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-heading font-bold text-white tracking-wide">
                Hybrid Game Simulation Deck
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-typewriter font-bold uppercase">
                {humanPlayers.length} Humans + {botPlayers.length} AI Bots Active
              </span>
            </div>
            <p className="text-xs text-white/60 font-typewriter">
              Room Capacity: {totalSuspects} / {capacity} Suspects Claimed • Connect laptop to TV and click Pop-out to project clean spectator view.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {totalSuspects < capacity && (
            <button
              onClick={async () => {
                sound.playClick();
                await simulateBotSuspects(room.roomCode, capacity);
                sound.playClueFound();
              }}
              className="px-4 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-typewriter rounded-xl transition-all shadow flex items-center gap-2 active:scale-95"
              id="btn-host-fill-ai-bots"
            >
              <Bot className="w-4 h-4" />
              <span>Fill Open Slots with AI ({capacity - totalSuspects} slots)</span>
            </button>
          )}

          {botPlayers.length > 0 && (
            <button
              onClick={async () => {
                if (confirm(`Remove all ${botPlayers.length} AI suspects from this room? Human players will remain intact.`)) {
                  sound.playClick();
                  await removeBotSuspects(room.roomCode);
                }
              }}
              className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-typewriter rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
              id="btn-host-clear-ai-bots"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Clear AI Bots</span>
            </button>
          )}

          <button
            onClick={handleOpenTvPopup}
            className="px-4 py-2.5 bg-[#2E4A6B] hover:bg-[#1E334D] border border-sky-400/40 text-white text-xs font-typewriter rounded-xl transition-all shadow flex items-center gap-2 active:scale-95"
            id="btn-host-bar-popout"
          >
            <ExternalLink className="w-4 h-4 text-amber-300" />
            <span>Open TV Screen (Popup)</span>
          </button>
        </div>
      </section>

      {/* Main TV Layout: Full-Screen Evidence Board Grid (Center/Left) + Roster & Controls (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* CENTER / LEFT: Full Screen Evidence Board (8 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-[#171615] rounded-3xl p-6 sm:p-8 border-2 border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-white/10 pb-4 mb-6">
              <div>
                <span className="text-xs font-typewriter uppercase tracking-widest text-[#8B1A1A] font-bold block">
                  GOVERNMENT ARCHIVAL EVIDENCE GRID
                </span>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#F7F4EF] flex items-center gap-3">
                  <FileText className="w-7 h-7 text-[#8B1A1A]" />
                  <span>The Ten Exhibits (Envelopes A to J)</span>
                </h2>
              </div>

              {/* Accessible 4-State Legend for Colorblind Observers */}
              <div className="hidden sm:flex items-center gap-3 p-2.5 bg-black/60 rounded-xl border border-white/15 text-xs font-typewriter">
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/60">LOCKED (Hash)</span>
                </div>
                <div className="flex items-center gap-1">
                  <FolderClosed className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-200">SEALED (Dots)</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-[#8B1A1A]" />
                  <span className="text-white font-bold">PUBLIC (Stamp)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5 text-[#8B1A1A]" />
                  <span className="text-red-400">REFUSED (Cross)</span>
                </div>
              </div>
            </div>

            {/* 10 Evidence Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {letters.map((letter) => {
                const env = ENVELOPES[letter];
                const state = envelopeStates.find((e) => e.letter === letter);
                const isUnlocked = state?.unlocked || false;
                const isPublished = state?.published || false;
                const char1 = CHARACTERS.find((c) => c.id === env?.char_id_1);
                const char2 = CHARACTERS.find((c) => c.id === env?.char_id_2);

                // Accessible pattern and state styling
                let patternClass = 'pattern-locked border-white/10';
                let stateIcon = <Lock className="w-4 h-4 text-white/40" />;
                let stateBadge = (
                  <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-[10px] font-typewriter text-white/50">
                    LOCKED
                  </span>
                );

                if (isPublished) {
                  patternClass = 'bg-[#FAF8F5] text-[#1C1B19] border-2 border-[#8B1A1A] shadow-2xl';
                  stateIcon = <FileCheck className="w-4 h-4 text-[#8B1A1A]" />;
                  stateBadge = (
                    <span className="rubber-stamp-red text-[8px] py-0.5 px-2">
                      EXHIBIT PUBLIC
                    </span>
                  );
                } else if (isUnlocked) {
                  patternClass = 'pattern-sealed border-2 border-[#C4AD75] shadow-lg';
                  stateIcon = <FolderClosed className="w-4 h-4 text-[#E8D5A3]" />;
                  stateBadge = (
                    <span className="px-2 py-0.5 bg-[#8B1A1A]/40 border border-[#8B1A1A] rounded text-[10px] font-typewriter text-[#E8D5A3] font-bold">
                      IN CUSTODY
                    </span>
                  );
                }

                return (
                  <div
                    key={letter}
                    className={`rounded-2xl p-5 transition-all flex flex-col justify-between min-h-[170px] ${patternClass}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-typewriter font-black text-sm ${
                            isPublished
                              ? 'bg-[#8B1A1A] text-white'
                              : isUnlocked
                              ? 'bg-[#E8D5A3] text-[#1C1B19]'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {letter}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {stateBadge}
                        </div>
                      </div>

                      <h3
                        className={`text-base sm:text-lg font-heading font-bold line-clamp-1 ${
                          isPublished ? 'text-[#1C1B19]' : 'text-[#F7F4EF]'
                        }`}
                      >
                        {env?.title}
                      </h3>

                      <p
                        className={`text-xs font-typewriter mt-1 ${
                          isPublished ? 'text-[#4A4844]' : 'text-white/60'
                        }`}
                      >
                        Pair: {char1?.name.split(' ')[0]} (#{char1?.id}) & {char2?.name.split(' ')[0]} (#{char2?.id})
                      </p>
                      <p
                        className={`text-xs font-typewriter font-bold ${
                          isPublished ? 'text-[#8B1A1A]' : 'text-[#E8D5A3]'
                        }`}
                      >
                        Code: {env?.full_code}
                      </p>
                    </div>

                    {/* Summary or Custody details */}
                    <div className="mt-3 pt-2 border-t border-black/10 text-xs font-typewriter">
                      {isPublished ? (
                        <p className="text-[#1C1B19] line-clamp-2 leading-relaxed font-sans font-medium">
                          {env?.summary}
                        </p>
                      ) : isUnlocked ? (
                        <p className="text-[#E8D5A3] italic">
                          Held: {state?.unlocked_by?.join(' & ') || 'Partners'}
                        </p>
                      ) : (
                        <p className="text-white/40 italic">
                          Awaiting partner 4-digit code unseal
                        </p>
                      )}
                    </div>

                    {/* Director Overrides */}
                    <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedEnvelopeLetter(letter)}
                        className="px-2.5 py-1 bg-black/40 hover:bg-black/60 text-white rounded text-[10px] font-typewriter"
                      >
                        Inspect Dossier
                      </button>

                      {!isUnlocked && (
                        <button
                          onClick={() => handleForceUnlock(letter)}
                          className="px-2.5 py-1 bg-[#2E4A6B] hover:bg-[#1E334D] text-white rounded text-[10px] font-typewriter"
                        >
                          Force Unseal
                        </button>
                      )}

                      {!isPublished && (
                        <button
                          onClick={() => handleForcePublish(letter)}
                          className="px-2.5 py-1 bg-[#8B1A1A] hover:bg-[#A82020] text-white rounded text-[10px] font-typewriter"
                        >
                          Force Publish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registry Wire Broadcasts Feed */}
          <div className="bg-[#171615] rounded-3xl p-6 border-2 border-white/10 shadow-xl space-y-3">
            <span className="text-xs font-typewriter uppercase tracking-widest text-[#8B1A1A] font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#8B1A1A] animate-pulse" />
              <span>Official Inquiry Telegraph Wire Feed</span>
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {nairMessages.length === 0 ? (
                <p className="text-sm font-typewriter text-white/40 italic">
                  No telegram dispatches filed on the wire.
                </p>
              ) : (
                [...nairMessages].reverse().map((m) => (
                  <div key={m.msgId} className="text-sm font-typewriter p-3 bg-black/70 rounded-xl border border-white/10 flex items-start gap-2">
                    <span className="text-[#8B1A1A] font-bold shrink-0">[{m.senderName}]:</span>
                    <span className="text-[#F7F4EF]">{m.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Roster, Live Ballot Box, & Tactical Controls (4 Cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Tactical Overrides Deck */}
          <div className="bg-[#171615] rounded-3xl p-6 border-2 border-[#8B1A1A]/40 shadow-2xl space-y-4">
            <span className="text-xs font-typewriter uppercase tracking-widest text-[#8B1A1A] font-bold block">
              TACTICAL DIRECTOR OVERRIDES
            </span>

            <button
              onClick={handleRevealSafariSuit}
              className="w-full py-3.5 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-typewriter text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow"
              id="btn-panic-reveal-safari"
            >
              <Flame className="w-4 h-4 text-[#E8D5A3]" />
              <span>Nudge: Broadcast Safari Suit</span>
            </button>

            <button
              onClick={handleTriggerSecondAttack}
              className="w-full py-3.5 px-4 bg-[#8B1A1A] hover:bg-[#A82020] text-white font-typewriter text-xs uppercase tracking-widest font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
              id="btn-trigger-second-attack"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Trigger Second Attack</span>
            </button>

            {/* Scavenger Hunt Action */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-typewriter uppercase text-white/50 block">
                Forensic Hunt Quick Mark:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => recordHuntFind(room.roomCode, 'vial', hostUid, 'Host Override', 'Director')}
                  className="p-2 bg-black/50 border border-white/10 hover:border-emerald-500 text-xs font-typewriter text-white rounded-lg"
                >
                  Mark KCl Found
                </button>
                <button
                  onClick={() => recordHuntFind(room.roomCode, 'file', hostUid, 'Host Override', 'Director')}
                  className="p-2 bg-black/50 border border-white/10 hover:border-emerald-500 text-xs font-typewriter text-white rounded-lg"
                >
                  Mark File Found
                </button>
              </div>
            </div>
          </div>

          {/* Live Indictment Ballot Box */}
          <div className="bg-[#171615] rounded-3xl p-6 border-2 border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-typewriter uppercase tracking-wider text-white font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8B1A1A]" />
                <span>Live Ballot Box ({votes.length} / {humanPlayers.length})</span>
              </h3>
            </div>

            {votes.length === 0 ? (
              <p className="text-xs font-typewriter text-white/40 italic">
                Awaiting formal ballot lodging in the VOTE phase.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedVoteTallies.map((tally) => (
                  <div key={tally.name} className="p-3 bg-black/70 rounded-xl border border-white/10 text-xs font-typewriter">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F7F4EF] text-sm">{tally.name}</span>
                      <span className="text-[#8B1A1A] font-bold text-sm">{tally.count} votes</span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">
                      Lodged by: {tally.voters.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suspect Roster & Auto-Assign Control Deck */}
          <div className="bg-[#171615] rounded-3xl p-6 border-2 border-white/10 shadow-xl space-y-4" id="host-suspect-assignment-deck">
            {/* Header with Title & Capacity Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C4AD75]" />
                <div>
                  <h3 className="text-sm font-typewriter uppercase tracking-wider text-white font-bold flex items-center gap-2">
                    <span>Suspect Assignment & Auto-Assign</span>
                  </h3>
                  <span className="text-[10px] text-white/50 font-typewriter">
                    {allGamePlayers.length} Players • {activeCharacters.length} Active Suspects
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 font-typewriter uppercase">Capacity:</span>
                <select
                  value={capacity}
                  onChange={(e) => handleCapacityChange(Number(e.target.value))}
                  className="bg-black/80 border border-white/20 text-xs font-typewriter text-white rounded-lg px-2.5 py-1"
                  id="select-host-capacity"
                >
                  <option value={20}>20 Players (Full 20)</option>
                  <option value={19}>19 Players</option>
                  <option value={18}>18 Players</option>
                  <option value={17}>17 Players</option>
                  <option value={16}>16 Players</option>
                  <option value={15}>15 Players</option>
                  <option value={14}>14 Players</option>
                  <option value={13}>13 Players</option>
                  <option value={12}>12 Players (Min 12)</option>
                </select>
              </div>
            </div>

            {/* Quick Status Stats Badges */}
            {(() => {
              const allGamePlayers = players.filter((p) => !p.isHost);
              const activeCharIds = new Set(activeCharacters.map((c) => c.id));
              const lockedList = allGamePlayers.filter(
                (p) => (p.isLocked || p.isManuallyAssigned) && activeCharIds.has(p.characterId)
              );
              const unassignedList = allGamePlayers.filter(
                (p) => !p.characterId || !activeCharIds.has(p.characterId)
              );

              // Character duplicate tracking
              const charClaimCounts: Record<number, PlayerData[]> = {};
              allGamePlayers.forEach((p) => {
                if (p.characterId && activeCharIds.has(p.characterId)) {
                  if (!charClaimCounts[p.characterId]) charClaimCounts[p.characterId] = [];
                  charClaimCounts[p.characterId].push(p);
                }
              });
              const duplicateCharIds = new Set<number>();
              Object.entries(charClaimCounts).forEach(([cId, list]) => {
                if (list.length > 1) duplicateCharIds.add(Number(cId));
              });
              const hasConflicts = duplicateCharIds.size > 0;

              return (
                <div className="space-y-3">
                  {/* Status Bar */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-typewriter">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 font-bold">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>{lockedList.length} Hand-Picked (Locked)</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-sky-400" />
                      <span>{allGamePlayers.length - lockedList.length - unassignedList.length} Auto-Assigned</span>
                    </span>

                    {unassignedList.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 flex items-center gap-1.5 font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>{unassignedList.length} Unassigned</span>
                      </span>
                    )}

                    {hasConflicts && (
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3 h-3 text-orange-400" />
                        <span>{duplicateCharIds.size} Overlapping</span>
                      </span>
                    )}
                  </div>

                  {/* Auto-Assign Action Controls */}
                  <div className="bg-black/60 rounded-2xl p-3 border border-white/10 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Auto-Assign Remaining Button */}
                        <button
                          onClick={handleAutoAssign}
                          disabled={isAutoAssigning || allGamePlayers.length === 0}
                          className="px-4 py-2 bg-gradient-to-r from-[#8B1A1A] to-[#A82B2B] hover:from-[#9E2020] hover:to-[#BD3434] disabled:opacity-50 text-white text-xs font-typewriter font-bold rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
                          id="btn-host-auto-assign-remaining"
                          title="Preserves your hand-picked / locked players and automatically assigns the rest of the players to open suspect dossiers."
                        >
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>
                            {isAutoAssigning ? 'Assigning...' : '⚡ Auto-Assign Remaining'}
                          </span>
                        </button>

                        {/* Randomize All Button */}
                        <button
                          onClick={handleShuffleAll}
                          disabled={isAutoAssigning || allGamePlayers.length === 0}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white/80 hover:text-white text-xs font-typewriter rounded-xl transition-all border border-white/15 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          id="btn-host-shuffle-all"
                          title="Randomly shuffle all active suspect files across all players in the room."
                        >
                          <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                          <span>Shuffle All</span>
                        </button>
                      </div>

                      {/* View Switcher Tabs */}
                      <div className="flex items-center bg-black/80 p-0.5 rounded-xl border border-white/15 text-[11px] font-typewriter">
                        <button
                          onClick={() => setAssignmentViewMode('by_player')}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            assignmentViewMode === 'by_player'
                              ? 'bg-[#2E4A6B] text-white font-bold shadow'
                              : 'text-white/50 hover:text-white'
                          }`}
                          id="btn-view-by-player"
                        >
                          👤 By Player ({allGamePlayers.length})
                        </button>
                        <button
                          onClick={() => setAssignmentViewMode('by_character')}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            assignmentViewMode === 'by_character'
                              ? 'bg-[#2E4A6B] text-white font-bold shadow'
                              : 'text-white/50 hover:text-white'
                          }`}
                          id="btn-view-by-character"
                        >
                          🗂️ By Suspect ({activeCharacters.length})
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-white/50 font-typewriter">
                      Tip: Select characters for specific players below. Click the{' '}
                      <Lock className="w-2.5 h-2.5 inline text-amber-400" /> lock icon to pin them, then click{' '}
                      <strong className="text-amber-200">"Auto-Assign Remaining"</strong> to let the system fill the rest.
                    </p>
                  </div>

                  {/* Feedback Toast */}
                  {autoAssignFeedback && (
                    <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-typewriter flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{autoAssignFeedback}</span>
                    </div>
                  )}

                  {/* Overlap Conflict Notice */}
                  {hasConflicts && (
                    <div className="p-2.5 bg-orange-950/70 border border-orange-500/50 rounded-xl text-orange-200 text-xs font-typewriter flex items-center justify-between gap-2 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>
                          Multiple players hold the same suspect. Click <strong>Auto-Assign Remaining</strong> to resolve.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Search filter for player roster */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search player or suspect name..."
                      value={playerSearchQuery}
                      onChange={(e) => setPlayerSearchQuery(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 text-xs font-typewriter text-white placeholder-white/40 rounded-xl pl-8 pr-3 py-1.5 focus:border-[#C4AD75] focus:outline-none"
                    />
                  </div>

                  {/* LIST VIEW 1: BY PLAYER */}
                  {assignmentViewMode === 'by_player' && (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {allGamePlayers.length === 0 ? (
                        <div className="p-6 text-center text-xs font-typewriter text-white/40 italic bg-black/30 rounded-2xl border border-dashed border-white/10">
                          No players have joined the room yet. Share room code{' '}
                          <strong className="text-white font-mono">{room.roomCode}</strong> or add AI bots above.
                        </div>
                      ) : (
                        allGamePlayers
                          .filter((p) => {
                            if (!playerSearchQuery.trim()) return true;
                            const q = playerSearchQuery.toLowerCase();
                            return (
                              p.name.toLowerCase().includes(q) ||
                              p.characterName.toLowerCase().includes(q)
                            );
                          })
                          .map((player) => {
                            const char = CHARACTERS.find((c) => c.id === player.characterId);
                            const isLocked = !!(player.isLocked || player.isManuallyAssigned);
                            const isDuplicate = duplicateCharIds.has(player.characterId);
                            const isActiveInCap = char && activeCharIds.has(char.id);

                            return (
                              <div
                                key={player.uid}
                                className={`p-3 rounded-2xl border text-xs font-typewriter transition-all ${
                                  isDuplicate
                                    ? 'border-orange-500/60 bg-orange-950/20'
                                    : isLocked
                                    ? 'border-amber-500/40 bg-amber-950/15'
                                    : 'border-white/15 bg-black/60'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  {/* Player Identity */}
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">
                                      {player.name}
                                    </span>
                                    {player.isBot && (
                                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] rounded font-bold">
                                        AI BOT
                                      </span>
                                    )}
                                  </div>

                                  {/* Status Badges & Lock Toggle */}
                                  <div className="flex items-center gap-2">
                                    {isDuplicate && (
                                      <span className="px-2 py-0.5 bg-orange-500/30 text-orange-200 text-[9px] rounded font-bold border border-orange-400/50">
                                        DUPLICATE
                                      </span>
                                    )}

                                    <button
                                      onClick={() => handleToggleLock(player.uid, isLocked)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-typewriter font-bold flex items-center gap-1 border transition-all active:scale-95 cursor-pointer ${
                                        isLocked
                                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                          : 'bg-white/5 border-white/15 text-white/40 hover:text-white/70'
                                      }`}
                                      title={
                                        isLocked
                                          ? 'Locked (Hand-picked). Click to unlock for auto-assign.'
                                          : 'Unlocked. Click to lock this character choice.'
                                      }
                                    >
                                      {isLocked ? (
                                        <>
                                          <Lock className="w-3 h-3 text-amber-400" />
                                          <span>Hand-Picked</span>
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="w-3 h-3 text-white/40" />
                                          <span>Auto</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Character Selector Dropdown */}
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                                    {char && isActiveInCap ? (
                                      <>
                                        <span className="text-[#C4AD75] font-bold">
                                          #{char.id}
                                        </span>
                                        <span className="text-[#F7F4EF] font-semibold">
                                          {char.name}
                                        </span>
                                        <span className="text-[10px] text-white/40 font-mono">
                                          (Env {char.envelope_letter})
                                        </span>
                                        {char.is_murderer && (
                                          <span className="px-1 py-0.2 bg-[#8B1A1A] text-white text-[8px] rounded font-bold">
                                            MURDERER
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-red-400 italic">
                                        ⚠️ Unassigned / Invalid File
                                      </span>
                                    )}
                                  </div>

                                  <select
                                    value={player.characterId || ''}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleReassign(player.uid, Number(e.target.value));
                                      }
                                    }}
                                    className="bg-black/90 border border-white/20 text-[11px] font-typewriter rounded-lg px-2 py-1 text-white/90 max-w-[170px]"
                                  >
                                    <option value="">Choose Dossier...</option>
                                    {activeCharacters.map((c) => {
                                      const isClaimedByOther = allGamePlayers.some(
                                        (other) =>
                                          other.uid !== player.uid && other.characterId === c.id
                                      );
                                      return (
                                        <option key={c.id} value={c.id}>
                                          #{c.id} {c.name} {isClaimedByOther ? '⚠️ [Taken]' : '✓ [Free]'}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}

                  {/* LIST VIEW 2: BY SUSPECT DOSSIER (#1 - #20) */}
                  {assignmentViewMode === 'by_character' && (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {activeCharacters
                        .filter((c) => {
                          if (!playerSearchQuery.trim()) return true;
                          const q = playerSearchQuery.toLowerCase();
                          const holders = allGamePlayers.filter((p) => p.characterId === c.id);
                          return (
                            c.name.toLowerCase().includes(q) ||
                            c.title.toLowerCase().includes(q) ||
                            holders.some((h) => h.name.toLowerCase().includes(q))
                          );
                        })
                        .map((char) => {
                          const assignedPlayers = allGamePlayers.filter(
                            (p) => p.characterId === char.id
                          );
                          const isClaimed = assignedPlayers.length > 0;
                          const isDuplicate = assignedPlayers.length > 1;
                          const primaryPlayer = assignedPlayers[0];
                          const isLocked = primaryPlayer && (primaryPlayer.isLocked || primaryPlayer.isManuallyAssigned);

                          return (
                            <div
                              key={char.id}
                              className={`p-2.5 rounded-xl border text-xs font-typewriter transition-all ${
                                isDuplicate
                                  ? 'border-orange-500/60 bg-orange-950/20'
                                  : char.is_murderer
                                  ? 'border-[#8B1A1A] bg-[#8B1A1A]/10'
                                  : isClaimed
                                  ? 'border-white/15 bg-black/60'
                                  : 'border-dashed border-white/10 bg-black/20 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="text-[#8B1A1A]">#{char.id}</span>
                                  <span className="text-white">{char.name}</span>
                                  {char.is_murderer && (
                                    <span className="px-1 py-0.2 bg-[#8B1A1A] text-white text-[8px] rounded">
                                      MURDERER
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isLocked && (
                                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[8px] rounded font-bold flex items-center gap-0.5">
                                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                                      <span>HAND-PICKED</span>
                                    </span>
                                  )}
                                  <span className="text-[10px] text-white/40">
                                    Env {char.envelope_letter}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                <div>
                                  {isClaimed ? (
                                    <span
                                      className={`font-semibold ${
                                        isDuplicate
                                          ? 'text-orange-300'
                                          : 'text-emerald-400'
                                      }`}
                                    >
                                      {assignedPlayers.map((p) => p.name).join(', ')}
                                    </span>
                                  ) : (
                                    <span className="text-white/30 italic">Unclaimed</span>
                                  )}
                                </div>

                                <select
                                  value={primaryPlayer?.uid || ''}
                                  onChange={(e) => {
                                    if (e.target.value) handleReassign(e.target.value, char.id);
                                  }}
                                  className="bg-black/90 border border-white/15 text-[10px] font-typewriter rounded px-1.5 py-0.5 text-white/80"
                                >
                                  <option value="">Reassign player...</option>
                                  {allGamePlayers.map((p) => (
                                    <option key={p.uid} value={p.uid}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Reveal & Resolution View: Warm Celebratory Resolving */}
          {currentPhase === 'REVEAL' && (
            <div className="bg-[#FFF8EE] text-[#1C1B19] rounded-3xl p-6 border-4 border-[#E8D5A3] shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 border-b border-[#E8D5A3] pb-3">
                <PartyPopper className="w-8 h-8 text-[#8B1A1A]" />
                <div>
                  <span className="text-[10px] font-typewriter uppercase tracking-widest text-[#8B1A1A] font-bold block">
                    FINAL CASE RESOLUTION
                  </span>
                  <h3 className="text-xl font-heading font-bold text-[#1C1B19]">
                    Dr. Priya Menon's Birthday Celebration
                  </h3>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E8D5A3] text-xs font-typewriter text-[#8B1A1A] font-bold">
                True Culprit: Mr. Ramesh Gokhale (Registrar)
              </div>

              <p className="text-xs font-sans text-[#2C2A26] leading-relaxed">
                {solutionData?.full_resolution || 'Loading official police case resolution file...'}
              </p>

              {/* Scored Leaderboard */}
              <div className="space-y-1.5 border-t border-[#E8D5A3] pt-3">
                <span className="text-[10px] font-typewriter uppercase text-[#4A4844] font-bold block mb-1">
                  Detective Leaderboard:
                </span>
                {scoredDeductions.length === 0 ? (
                  <p className="text-xs font-typewriter text-[#4A4844] italic">
                    No deduction sheets lodged.
                  </p>
                ) : (
                  scoredDeductions.map((sc, idx) => (
                    <div
                      key={sc.player_id}
                      className="p-2 bg-white rounded-lg border border-[#E8D5A3] flex items-center justify-between text-xs font-typewriter"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#8B1A1A] font-bold">#{idx + 1}</span>
                        <div>
                          <span className="font-bold text-[#1C1B19]">{sc.player_name}</span>
                          <span className="text-[10px] text-[#4A4844] block">
                            {sc.character_name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[#2E4A6B] font-bold">{sc.calculatedScore} pts</span>
                        {sc.isComplicit && (
                          <span className="block text-[8px] text-[#8B1A1A] font-bold uppercase">
                            COMPLICIT
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clue Card Modal */}
      <ClueCardModal card={selectedClueCard} onClose={() => setSelectedClueCard(null)} />

      {/* Envelope Inspection Modal */}
      {selectedEnvelopeData && (
        <EnvelopeModal
          envelope={selectedEnvelopeData}
          state={selectedEnvelopeState}
          roomCode={room.roomCode}
          myPlayerName="Game Director"
          isPartnerOrHost={true}
          onClose={() => setSelectedEnvelopeLetter(null)}
        />
      )}

      {/* Solo Simulator Modal */}
      <SoloSimulatorModal
        room={room}
        players={players}
        currentPlayerUid={hostUid}
        currentPlayerDoc={players.find((p) => p.uid === hostUid)}
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onToggleViewMode={() => {}}
        isViewingAsHost={true}
      />

      {/* How to Play Manual Modal */}
      <PlayerManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      {/* Campus Hierarchy & Family Tree Map */}
      <RelationshipMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        currentPhase={currentPhase}
        capacity={room.capacity || players.length}
        players={players}
      />
    </div>
  );
};
