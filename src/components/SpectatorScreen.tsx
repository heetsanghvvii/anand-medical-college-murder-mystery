import React, { useState, useEffect } from 'react';
import {
  RoomData,
  PlayerData,
  EnvelopeStateData,
  NairMessageData,
  VoteData,
  DeductionData,
} from '../types';
import { ENVELOPES, PHASE_CONFIG, CHARACTERS } from '../data/game';
import { sound } from '../lib/audio';
import { PlayerManualModal } from './PlayerManualModal';
import { RelationshipMapModal } from './RelationshipMapModal';
import {
  Tv,
  Lock,
  Globe,
  Radio,
  FileSearch,
  CheckCircle2,
  Clock,
  Skull,
  ShieldAlert,
  Flame,
  KeyRound,
  FolderClosed,
  FileCheck,
  Ban,
  PartyPopper,
  Shield,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Network,
  EyeOff,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface SpectatorScreenProps {
  room: RoomData;
  players: PlayerData[];
  envelopeStates: EnvelopeStateData[];
  nairMessages: NairMessageData[];
  votes: VoteData[];
  deductions: DeductionData[];
  onExitSpectator?: () => void;
  isStandaloneTv?: boolean;
}

export const SpectatorScreen: React.FC<SpectatorScreenProps> = ({
  room,
  players,
  envelopeStates,
  nairMessages,
  votes,
  deductions,
  onExitSpectator,
  isStandaloneTv = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);

  const currentPhase = room.phase || 'LOBBY';
  const phaseInfo = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.LOBBY;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Fullscreen Handler
  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Countdown timer logic
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
  const totalSuspects = players.filter((p) => !p.isHost).length;
  const recentBroadcasts = [...nairMessages].reverse().slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0D0C0B] text-[#F7F4EF] p-4 sm:p-8 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Top TV Bar: Room Code & Phase Header with 32px+ typography */}
      <header className="relative z-10 bg-[#171615] rounded-3xl p-5 sm:p-7 border-2 border-white/10 shadow-2xl mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#8B1A1A]/30 border-2 border-[#8B1A1A] flex items-center justify-center text-[#8B1A1A] shrink-0 shadow-lg">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#E58282] font-bold">
                  CENTRAL ARCHIVE EVIDENCE BOARD • 1995
                </span>
                <span className="text-white/30 text-sm">•</span>
                <span className="text-xs font-mono text-[#E8D5A3]">
                  {humanPlayers.length} Humans + {botPlayers.length} AI Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-[#F7F4EF]">
                The Anand Medical College Murder
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* TV Manual Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsManualOpen(true);
              }}
              className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-2xl text-xs font-mono font-bold tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow"
              id="btn-tv-open-manual"
            >
              <BookOpen className="w-4 h-4" />
              <span>How to Play</span>
            </button>

            {/* TV Family Tree & Hierarchy Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsMapOpen(true);
              }}
              className="px-4 py-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-2xl text-xs font-mono font-bold tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow"
              id="btn-tv-open-map"
            >
              <Network className="w-4 h-4" />
              <span>Family Tree & Hierarchy</span>
            </button>

            {/* Join Room Code Callout (Large for 15-foot viewing) */}
            <div className="text-center bg-black/80 border-2 border-white/20 px-5 py-2.5 rounded-2xl shadow-inner">
              <span className="text-[10px] font-mono uppercase text-white/50 tracking-widest block font-bold">
                ROOM CODE
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-[#E8D5A3] tracking-widest">
                {room.roomCode}
              </span>
            </div>

            {/* Live Phase Countdown */}
            <div className="text-right bg-[#8B1A1A]/20 border-2 border-[#8B1A1A] px-5 py-2.5 rounded-2xl min-w-[130px] shadow-lg">
              <span className="text-[10px] font-mono uppercase text-[#E58282] font-black tracking-widest block">
                PHASE TIMER
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                {formatTimer(secondsLeft)}
              </span>
            </div>

            {/* Fullscreen Toggle for TV Display */}
            <button
              onClick={toggleFullscreen}
              className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all active:scale-95"
              title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter TV Fullscreen (F11)'}
              id="btn-tv-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-amber-300" /> : <Maximize2 className="w-5 h-5 text-white" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all active:scale-95"
              title="Toggle Projector Audio"
              id="btn-tv-audio"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white/50" /> : <Volume2 className="w-5 h-5 text-[#8B1A1A]" />}
            </button>

            {onExitSpectator && (
              <button
                onClick={onExitSpectator}
                className="px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-mono border border-white/15"
                id="btn-exit-spectator"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Phase Announcement Banner */}
        <div className="mt-5 p-4 bg-black/60 border border-white/15 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#8B1A1A] animate-ping" />
            <div>
              <span className="text-sm sm:text-base font-mono uppercase tracking-wider text-[#E58282] font-bold">
                CURRENT PHASE: {phaseInfo.title}
              </span>
              <p className="text-xs sm:text-sm font-sans text-white/70">
                {phaseInfo.subtitle}
              </p>
            </div>
          </div>

          {currentPhase === 'VOTE' && (
            <div className="text-right">
              <span className="text-sm font-mono text-amber-300 font-bold">
                BALLOTS CAST: {votes.length} / {totalSuspects}
              </span>
            </div>
          )}

          {currentPhase === 'DEDUCTION' && (
            <div className="text-right">
              <span className="text-sm font-mono text-amber-300 font-bold">
                DEDUCTIONS LODGED: {deductions.length} / {totalSuspects}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Evidence Board 10-Grid (A through J) with STRICT SPOILER PROTECTION */}
      <main className="relative z-10 flex-1 flex flex-col justify-center my-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileSearch className="w-6 h-6 text-[#8B1A1A]" />
            <h2 className="text-lg sm:text-2xl font-mono uppercase tracking-wider font-bold text-[#E8D5A3]">
              PUBLIC FORENSIC EXHIBITS (EXHIBITS A – J)
            </h2>
          </div>
          <span className="text-xs font-mono text-white/60 bg-black/50 px-3 py-1 rounded-xl border border-white/10">
            {envelopeStates.filter((e) => e.published).length} / 10 Exhibits Published to Public Record
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {letters.map((letter) => {
            const env = ENVELOPES[letter];
            const state = envelopeStates.find((e) => e.letter === letter);
            const isUnlocked = !!state?.unlocked;
            const isPublished = !!state?.published;
            const holders = state?.unlocked_by || [];

            return (
              <div
                key={letter}
                className={`rounded-2xl p-4 transition-all flex flex-col justify-between border-2 min-h-[160px] shadow-lg relative overflow-hidden ${
                  isPublished
                    ? 'bg-[#EFE9DD] border-[#D5CFBE] text-[#1C1B19]'
                    : isUnlocked
                    ? 'bg-[#1C1B19] border-red-500/50 text-[#F7F4EF]'
                    : 'bg-[#141312] border-white/10 text-white/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-1.5 mb-2.5">
                    <span className="text-xl sm:text-2xl font-mono font-black">
                      EXHIBIT {letter}
                    </span>
                    {isPublished ? (
                      <span className="px-2 py-0.5 rounded bg-[#1B634B] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                        PUBLIC
                      </span>
                    ) : isUnlocked ? (
                      <span className="px-2 py-0.5 rounded bg-[#8B1A1A] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                        SEALED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white/60 text-[10px] font-mono font-bold uppercase tracking-wider">
                        LOCKED
                      </span>
                    )}
                  </div>

                  {/* STRICT SPOILER PROTECTION: Never show titles or headlines unless published! */}
                  {isPublished ? (
                    <h3 className="font-serif font-bold text-sm sm:text-base leading-snug text-[#1C1B19]">
                      {env?.title}
                    </h3>
                  ) : isUnlocked ? (
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>SEALED EVIDENCE</span>
                      </div>
                      <p className="text-[11px] text-white/70 italic font-mono">
                        Contents hidden in private custody.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-bold text-white/50 uppercase tracking-wide flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>ARCHIVAL VAULT</span>
                      </div>
                      <p className="text-[11px] text-white/40 italic font-mono">
                        Unopened case slip.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-[11px] font-mono border-t border-black/10 dark:border-white/10 pt-2">
                  {isPublished ? (
                    <p className="text-[#2A2723] line-clamp-3 font-sans leading-relaxed text-xs">
                      {env?.summary}
                    </p>
                  ) : isUnlocked ? (
                    <p className="text-amber-300/90 font-mono text-[11px]">
                      <strong>In Custody:</strong> {holders.length > 0 ? holders.join(' & ') : 'Pair'}
                    </p>
                  ) : (
                    <p className="text-white/40 flex items-center gap-1 italic text-[11px]">
                      <KeyRound className="w-3 h-3" /> Pair 4-digit code required
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Outstanding Forensic Slips by Tier Tracker */}
        <div className="mt-8 bg-[#171615] border-2 border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  3-Tier Slip Status & Outstanding Evidence Slips
                </h3>
                <p className="text-[11px] font-mono text-white/50">
                  Tracking un-published and un-sealed forensic slips across all 3 investigation rounds
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2.5 py-1 rounded bg-white text-zinc-900 font-bold">Tier I: White (R2/3)</span>
              <span className="px-2.5 py-1 rounded bg-amber-300 text-zinc-950 font-bold">Tier II: Pale Yellow (R4)</span>
              <span className="px-2.5 py-1 rounded bg-red-600 text-white font-bold">Tier III: Red Wire</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TIER I SLIPS */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-zinc-200">
                  TIER I (R2/R3 WHITE SLIPS)
                </span>
                <span className="text-[10px] font-mono text-white/60">
                  {letters.filter((l) => {
                    const st = envelopeStates.find((e) => e.letter === l);
                    return st?.published || st?.tier1_published;
                  }).length} / 10 Published
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
                {letters.map((l) => {
                  const st = envelopeStates.find((e) => e.letter === l);
                  const isPub = st?.published || st?.tier1_published;
                  const isUnsealed = st?.unlocked;
                  const bg = isPub
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                    : isUnsealed
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/60'
                    : 'bg-white/5 text-white/40 border-white/10';
                  return (
                    <div
                      key={l}
                      className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-center ${bg}`}
                      title={`Exhibit ${l}: ${isPub ? 'Published' : isUnsealed ? 'In Custody' : 'Sealed'}`}
                    >
                      <span className="text-xs">{l}</span>
                      <span className="text-[8px] opacity-80 uppercase tracking-tighter">
                        {isPub ? 'LIVE' : isUnsealed ? 'HELD' : 'SEAL'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] font-mono text-white/40 italic">
                *White slips unsealed by character pairs combining 4-digit codes.
              </p>
            </div>

            {/* TIER II SLIPS */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-amber-300">
                  TIER II (R4 YELLOW SLIPS)
                </span>
                <span className="text-[10px] font-mono text-white/60">
                  {letters.filter((l) => {
                    const st = envelopeStates.find((e) => e.letter === l);
                    return st?.published || st?.tier2_published;
                  }).length} / 10 Published
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
                {letters.map((l) => {
                  const st = envelopeStates.find((e) => e.letter === l);
                  const isPub = st?.published || st?.tier2_published;
                  const isUnsealed = st?.unlocked;
                  const bg = isPub
                    ? 'bg-amber-400/20 text-amber-300 border-amber-500/60 font-bold'
                    : isUnsealed
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    : 'bg-white/5 text-white/30 border-white/10';
                  return (
                    <div
                      key={l}
                      className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-center ${bg}`}
                      title={`Exhibit ${l} Tier II: ${isPub ? 'Published' : 'Outstanding'}`}
                    >
                      <span className="text-xs">{l}</span>
                      <span className="text-[8px] opacity-80 uppercase tracking-tighter">
                        {isPub ? 'PUB' : isUnsealed ? 'PEND' : 'LOCK'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] font-mono text-amber-200/50 italic">
                *Yellow slips read by assigned characters in Round 4 Cross-Examination.
              </p>
            </div>

            {/* TIER III SLIPS */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono font-bold uppercase text-red-400">
                  TIER III (RED FORENSIC WIRES)
                </span>
                <span className="text-[10px] font-mono text-white/60">
                  Host Directives
                </span>
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-between">
                  <span className="text-red-200 font-bold">R1 Wake Wire</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-red-900 text-red-100">
                    Autopsy Clue
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-between">
                  <span className="text-red-200 font-bold">Interval Audit Log</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-red-900 text-red-100">
                    OT-3 Poison Clue
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-between">
                  <span className="text-red-200 font-bold">R4 Dean Register</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-red-900 text-red-100">
                    Disciplinary File
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Forensic Broadcasts & Hunt Tracker */}
      <footer className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Scavenger Finds */}
        <div className="bg-[#171615] border-2 border-white/10 rounded-3xl p-5 shadow-xl">
          <span className="text-xs font-mono uppercase text-[#E58282] font-bold tracking-widest block mb-3">
            CRITICAL PHYSICAL EVIDENCE (OT-3 & REGISTRAR)
          </span>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded-xl border border-white/10">
              <span className="text-white/80">KCl Ampoule:</span>
              <span className={room.huntVialFoundBy ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                {room.huntVialFoundBy ? `Secured: ${room.huntVialFoundBy}` : 'MISSING'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded-xl border border-white/10">
              <span className="text-white/80">Marksheet Carbon File:</span>
              <span className={room.huntFileFoundBy ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                {room.huntFileFoundBy ? `Secured: ${room.huntFileFoundBy}` : 'MISSING'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Broadcast Ticker */}
        <div className="md:col-span-2 bg-[#171615] border-2 border-white/10 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-white/50 tracking-widest flex items-center gap-2 font-bold">
              <Radio className="w-4 h-4 text-[#8B1A1A] animate-pulse" />
              <span>OFFICIAL WIRE BROADCASTS</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              TV PROJECTOR SYNC ACTIVE
            </span>
          </div>
          <div className="space-y-2 overflow-hidden max-h-24 font-mono">
            {recentBroadcasts.length === 0 ? (
              <p className="text-xs text-white/40 italic">
                Awaiting telegraph transmissions from forensic teams...
              </p>
            ) : (
              recentBroadcasts.map((msg) => (
                <div key={msg.msgId} className="text-xs flex items-start gap-2">
                  <span className="text-[#E58282] font-bold shrink-0">[{msg.senderName}]:</span>
                  <span className="text-[#F7F4EF] line-clamp-1">{msg.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </footer>

      {/* Pop-up Modals for TV Screen */}
      <PlayerManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

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

