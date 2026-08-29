import React, { useState } from 'react';
import {
  CHARACTERS,
  ENVELOPES,
  PHASE_CONFIG,
  DROP_ORDER_CHARACTER_IDS,
} from '../data/game';
import {
  simulateBotSuspects,
  removeBotSuspects,
  simulateBotOnlyUnlocks,
  simulateUnlockAllClues,
  simulateScavengerRecovery,
  simulateWireDispatches,
  simulateCompelAction,
  simulateAllVotesAndDeductions,
  simulateInstantFullGame,
  simulateResetRoom,
  switchPlayerCharacter,
  advanceGamePhase,
  triggerSecondAttack,
  revealSafariSuitNudge,
  autoAssignRemainingCharacters,
} from '../lib/firestoreService';
import { sound } from '../lib/audio';
import { GamePhase, RoomData, PlayerData } from '../types';
import {
  FlaskConical,
  Sparkles,
  Zap,
  Bot,
  Unlock,
  FastForward,
  RotateCcw,
  Users,
  Award,
  Radio,
  FileText,
  Skull,
  Flame,
  CheckCircle2,
  X,
  Smartphone,
  Tv,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Ban,
} from 'lucide-react';

interface SoloSimulatorModalProps {
  room: RoomData;
  players: PlayerData[];
  currentPlayerUid: string;
  currentPlayerDoc?: PlayerData;
  isOpen: boolean;
  onClose: () => void;
  onToggleViewMode: () => void;
  isViewingAsHost: boolean;
}

const PHASES_LIST: Array<{ phase: GamePhase; label: string; desc: string }> = [
  { phase: 'LOBBY', label: '1. Lobby', desc: 'Room assembly & player check-in' },
  { phase: 'READ_IN', label: '2. Read-In', desc: 'Private dossier review & secret goals' },
  { phase: 'R1_WAKE', label: '3. Wake', desc: 'Public facts & first round discussion' },
  { phase: 'R2_PAIRING', label: '4. Pairing', desc: 'Riddle matching & 4-digit code entry' },
  { phase: 'R3_BOARD', label: '5. Board', desc: 'Public review of unlocked envelopes' },
  { phase: 'INTERVAL', label: '6. Interval', desc: 'Mid-game pause & strategy' },
  { phase: 'R4_INTERROGATION', label: '7. Interrogation', desc: 'Cross-examination & Priya Compel token' },
  { phase: 'R5_HUNT', label: '8. Hunt', desc: 'Physical room search for vial & file' },
  { phase: 'DEDUCTION', label: '9. Deduction', desc: '5-Question scoring questionnaire' },
  { phase: 'VOTE', label: '10. Vote', desc: 'Secret ballot box accusation' },
  { phase: 'REVEAL', label: '11. Reveal', desc: 'Truth resolution & final leaderboard' },
];

export const SoloSimulatorModal: React.FC<SoloSimulatorModalProps> = ({
  room,
  players,
  currentPlayerUid,
  currentPlayerDoc,
  isOpen,
  onClose,
  onToggleViewMode,
  isViewingAsHost,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'phases' | 'personas'>('quick');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setStatusFeedback(msg);
    sound.playClueFound();
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const handleAction = async (name: string, actionFn: () => Promise<unknown>) => {
    setBusyAction(name);
    sound.playClick();
    try {
      await actionFn();
      showSuccess(`Action executed: ${name}`);
    } catch (err: unknown) {
      console.error(err);
      sound.playStinger();
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      id="solo-simulator-modal"
    >
      <div className="bg-[#121111] border-2 border-[#8B1A1A]/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-[#F2ECEA]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-black/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#8B1A1A]/30 border border-[#8B1A1A] text-red-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white tracking-wide">
                  Solo Play Test Suite & Bot Simulator
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase">
                  Single Player Mode
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono">
                Room: {room.roomCode} • Active Phase: {room.phase} • Suspects: {players.length} / {room.maxPlayerCapacity || 20}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors"
            id="btn-close-simulator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert */}
        {statusFeedback && (
          <div className="px-6 py-2.5 bg-emerald-950/60 border-b border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-black/40 border-b border-white/10 flex items-center gap-2 overflow-x-auto font-mono text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('quick');
            }}
            className={`px-4 py-2 rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'quick'
                ? 'border-[#8B1A1A] bg-white/5 text-white font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulation Actions</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('phases');
            }}
            className={`px-4 py-2 rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'phases'
                ? 'border-[#8B1A1A] bg-white/5 text-white font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <FastForward className="w-3.5 h-3.5 text-sky-400" />
            <span>Fast-Travel Phase ({room.phase})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('personas');
            }}
            className={`px-4 py-2 rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'personas'
                ? 'border-[#8B1A1A] bg-white/5 text-white font-bold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-red-400" />
            <span>Switch Suspect Persona ({currentPlayerDoc?.characterName || 'Unassigned'})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: QUICK SIMULATION ACTIONS */}
          {activeTab === 'quick' && (
            <div className="space-y-6">
              {/* 1-Click Master Game Progression */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-black to-[#8B1A1A]/20 border-2 border-[#8B1A1A] space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-200">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="font-serif font-bold text-base text-white">
                      1-Click Full Game Progression (Instant Verdict & Leaderboard)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#8B1A1A] rounded text-white font-bold">
                    RECOMMENDED FOR SOLO TESTING
                  </span>
                </div>
                <p className="text-xs text-white/70 font-mono leading-relaxed">
                  Populates 20 AI suspects, unlocks all 10 clue envelopes (A–J), marks both scavenger hunt items found, sends wire dialogs, triggers the second attack, casts all 20 suspect votes, and submits scored deduction questionnaires—instantly revealing the truth resolution and leaderboard!
                </p>
                <button
                  disabled={busyAction !== null}
                  onClick={() =>
                    handleAction('1-Click Full Simulation', () => simulateInstantFullGame(room.roomCode))
                  }
                  className="w-full py-3 px-4 bg-[#8B1A1A] hover:bg-[#A82020] disabled:opacity-40 text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                  id="btn-solo-full-sim"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{busyAction === '1-Click Full Simulation' ? 'Simulating Entire Game...' : 'Simulate Complete 20-Person Game Now'}</span>
                </button>
              </div>

              {/* Hybrid Play (Humans + AI Bots) Section */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Bot className="w-5 h-5" />
                    <h4 className="font-serif font-bold text-sm text-white">
                      Hybrid Sandbox: Play with Human Friends + AI Suspects
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-900/60 border border-emerald-500/30 rounded text-emerald-200">
                    {players.filter((p) => !p.isHost && !p.isBot && !p.uid.startsWith('bot_') && !p.name.includes('(AI)')).length} Humans • {players.filter((p) => p.isBot || p.uid.startsWith('bot_') || p.name.includes('(AI)')).length} AI Bots
                  </span>
                </div>
                <p className="text-xs text-white/60 font-mono">
                  Have 2–5 human players and want AI suspects to fill the rest? These tools automate AI bot actions without touching or overwriting human player discoveries or votes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                  <button
                    disabled={busyAction !== null}
                    onClick={() =>
                      handleAction('Fill Open Slots with AI', () =>
                        simulateBotSuspects(room.roomCode, room.maxPlayerCapacity || 20)
                      )
                    }
                    className="py-2.5 px-3 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/40 text-emerald-200 font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>+ Fill Empty Slots</span>
                  </button>

                  <button
                    disabled={busyAction !== null}
                    onClick={() =>
                      handleAction('Auto-Assign Remaining', () =>
                        autoAssignRemainingCharacters(room.roomCode, [], 'remaining')
                      )
                    }
                    className="py-2.5 px-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Auto-Assign Rest</span>
                  </button>

                  <button
                    disabled={busyAction !== null}
                    onClick={() =>
                      handleAction('Unlock AI-Only Envelopes', () =>
                        simulateBotOnlyUnlocks(room.roomCode)
                      )
                    }
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unlock AI Clues (R2)</span>
                  </button>

                  <button
                    disabled={busyAction !== null}
                    onClick={() =>
                      handleAction('Simulate AI Bot Votes', () =>
                        simulateAllVotesAndDeductions(room.roomCode, true)
                      )
                    }
                    className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-sky-400" />
                    <span>Cast AI Ballots</span>
                  </button>
                </div>

                {players.some((p) => p.isBot || p.uid.startsWith('bot_') || p.name.includes('(AI)')) && (
                  <div className="pt-2 flex justify-end">
                    <button
                      disabled={busyAction !== null}
                      onClick={() =>
                        handleAction('Remove AI Bots', () => removeBotSuspects(room.roomCode))
                      }
                      className="text-[11px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
                    >
                      <Ban className="w-3 h-3" />
                      <span>Remove all AI bots (keep human players)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Step-by-Step Tactical Simulation Grid */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-3 font-semibold">
                  Granular Simulation Tools:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Fill Bots */}
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Bot className="w-4 h-4 text-emerald-400" />
                        <span>1. Auto-Fill 20 Suspects</span>
                      </div>
                      <p className="text-[11px] text-white/50 font-mono mt-1">
                        Creates AI suspect dossiers with ready statuses to fill every slot up to capacity.
                      </p>
                    </div>
                    <button
                      disabled={busyAction !== null}
                      onClick={() =>
                        handleAction('Fill 20 Suspects', () => simulateBotSuspects(room.roomCode, room.maxPlayerCapacity || 20))
                      }
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs rounded-lg transition-all"
                    >
                      {busyAction === 'Fill 20 Suspects' ? 'Populating...' : 'Fill Empty Slots with AI'}
                    </button>
                  </div>

                  {/* Unlock Envelopes */}
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Unlock className="w-4 h-4 text-amber-400" />
                        <span>2. Unlock All 10 Envelopes</span>
                      </div>
                      <p className="text-[11px] text-white/50 font-mono mt-1">
                        Simulates pair 4-digit code entries to unlock and publish Clues A through J.
                      </p>
                    </div>
                    <button
                      disabled={busyAction !== null}
                      onClick={() =>
                        handleAction('Unlock Envelopes', () => simulateUnlockAllClues(room.roomCode))
                      }
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs rounded-lg transition-all"
                    >
                      {busyAction === 'Unlock Envelopes' ? 'Unlocking...' : 'Unlock & Publish A–J'}
                    </button>
                  </div>

                  {/* Scavenger Recovery */}
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <FileText className="w-4 h-4 text-sky-400" />
                        <span>3. Recover Scavenger Items</span>
                      </div>
                      <p className="text-[11px] text-white/50 font-mono mt-1">
                        Marks the OT-3 KCl vial & Registrar Carbon File found in the physical rooms.
                      </p>
                    </div>
                    <button
                      disabled={busyAction !== null}
                      onClick={() =>
                        handleAction('Scavenger Items', () => simulateScavengerRecovery(room.roomCode))
                      }
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs rounded-lg transition-all"
                    >
                      {busyAction === 'Scavenger Items' ? 'Marking...' : 'Find Vial & File'}
                    </button>
                  </div>

                  {/* Wire Transmissions */}
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Radio className="w-4 h-4 text-red-400" />
                        <span>4. Inject Wire Transmissions</span>
                      </div>
                      <p className="text-[11px] text-white/50 font-mono mt-1">
                        Adds Dr. Nair 5-word dispatches and suspect cross-examination logs.
                      </p>
                    </div>
                    <button
                      disabled={busyAction !== null}
                      onClick={() =>
                        handleAction('Wire Feed', () => simulateWireDispatches(room.roomCode))
                      }
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs rounded-lg transition-all"
                    >
                      {busyAction === 'Wire Feed' ? 'Broadcasting...' : 'Seed Wire Transmissions'}
                    </button>
                  </div>

                  {/* Simulate Compel */}
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span>5. Simulate Priya Menon Compel</span>
                      </div>
                      <p className="text-[11px] text-white/50 font-mono mt-1">
                        Executes a sworn inquiry on Ramesh Gokhale regarding Operating Theatre 3.
                      </p>
                    </div>
                    <button
                      disabled={busyAction !== null}
                      onClick={() =>
                        handleAction('Compel Inquiry', () => simulateCompelAction(room.roomCode))
                      }
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs rounded-lg transition-all"
                    >
                      {busyAction === 'Compel Inquiry' ? 'Compelling...' : 'Execute Sworn Compel'}
                    </button>
                  </div>

                  {/* Ballots & Deductions */}
                  <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>6. Simulate All Votes & Sheets</span>
                      </div>
                      <p className="text-[11px] text-white/50 font-mono mt-1">
                        Casts all 20 suspect ballots and submits scored 5-question questionnaires.
                      </p>
                    </div>
                    <button
                      disabled={busyAction !== null}
                      onClick={() =>
                        handleAction('Votes & Deductions', () => simulateAllVotesAndDeductions(room.roomCode))
                      }
                      className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs rounded-lg transition-all"
                    >
                      {busyAction === 'Votes & Deductions' ? 'Submitting...' : 'Submit All Votes & Sheets'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset Room Cleanly */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs font-mono text-white/50">
                  Want to restart from scratch?
                </div>
                <button
                  disabled={busyAction !== null}
                  onClick={() =>
                    handleAction('Reset Room to Lobby', () => simulateResetRoom(room.roomCode))
                  }
                  className="px-4 py-2 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-mono uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Room to Lobby</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FAST-TRAVEL GAME PHASES */}
          {activeTab === 'phases' && (
            <div className="space-y-4">
              <p className="text-xs text-white/60 font-mono">
                Click any phase below to instantly warp the room and all connected devices to that exact game state:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PHASES_LIST.map((p) => {
                  const isCurrent = room.phase === p.phase;
                  return (
                    <button
                      key={p.phase}
                      onClick={() =>
                        handleAction(`Jump to ${p.label}`, () => advanceGamePhase(room.roomCode, p.phase))
                      }
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'bg-[#8B1A1A]/40 border-[#8B1A1A] text-white shadow-lg'
                          : 'bg-black/40 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs font-serif text-white">{p.label}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 bg-[#8B1A1A] rounded text-[9px] font-mono text-white font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/40 font-mono mt-0.5">{p.desc}</p>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-white/20'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SWITCH SUSPECT PERSONA */}
          {activeTab === 'personas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60 font-mono">
                  Select any character below to immediately step into their shoes and inspect their secret dossier, riddles, fragment codes, and abilities:
                </p>
                <button
                  onClick={() => {
                    sound.playClick();
                    onToggleViewMode();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs font-mono flex items-center gap-2"
                >
                  {isViewingAsHost ? <Smartphone className="w-3.5 h-3.5 text-sky-400" /> : <Tv className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Switch to {isViewingAsHost ? 'Player View' : 'Host View'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
                {CHARACTERS.map((char) => {
                  const isCurrent = currentPlayerDoc?.characterId === char.id;
                  const isKiller = char.is_murderer;
                  const hasCompel = char.id === 20; // Priya
                  const isAutopsy = char.id === 6; // Dr. Nair

                  return (
                    <div
                      key={char.id}
                      onClick={() =>
                        handleAction(`Switch to ${char.name}`, () =>
                          switchPlayerCharacter(room.roomCode, currentPlayerUid, char.id)
                        )
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-[#8B1A1A]/40 border-[#8B1A1A] text-white shadow-[0_0_15px_rgba(139,26,26,0.3)]'
                          : 'bg-black/50 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-mono text-[10px] text-white font-bold">
                              #{char.id}
                            </span>
                            <span className="font-semibold text-xs text-white font-serif">{char.name}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {isKiller && (
                              <span className="px-1.5 py-0.5 bg-red-950 border border-red-500 rounded text-[8px] font-mono text-red-300 font-bold uppercase">
                                MURDERER
                              </span>
                            )}
                            {hasCompel && (
                              <span className="px-1.5 py-0.5 bg-purple-950 border border-purple-500 rounded text-[8px] font-mono text-purple-300 font-bold uppercase">
                                COMPEL TOKEN
                              </span>
                            )}
                            {isAutopsy && (
                              <span className="px-1.5 py-0.5 bg-sky-950 border border-sky-500 rounded text-[8px] font-mono text-sky-300 font-bold uppercase">
                                5-WORD WIRE
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 rounded text-[8px] font-mono text-emerald-300 font-bold uppercase">
                                YOU
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-white/50 font-mono line-clamp-1">{char.title}</p>
                        <p className="text-[10px] font-mono text-amber-400/80 mt-1">
                          Envelope {char.envelope_letter} • Code Half: {char.code_half}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-white/40">Role: {char.speaks_first ? 'Speaks First' : 'Responds'}</span>
                        <span className={isCurrent ? 'text-emerald-400 font-bold' : 'text-[#8B1A1A] font-semibold'}>
                          {isCurrent ? 'Active Persona' : 'Click to Play as This Suspect'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-black/90 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50">
          <span>Solo Play Test Deck • Antigravity Game Engine</span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-mono"
          >
            Close Deck
          </button>
        </div>
      </div>
    </div>
  );
};
