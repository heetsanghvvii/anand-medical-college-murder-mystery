import React, { useState, useEffect, useMemo } from 'react';
import {
  RoomData,
  PlayerData,
  EnvelopeStateData,
  GamePhase,
  OracleState,
  ScenarioAction,
  ScenarioReplayLog,
  FullRoomSnapshot,
} from '../types';
import {
  CHARACTERS,
  ENVELOPES,
  PHASE_CONFIG,
} from '../data/game';
import { computeOracleState, DEFAULT_SCENARIO_SCRIPT } from '../lib/oracleService';
import {
  jumpToPhaseDirectly,
  simulateBotSuspects,
  unlockEnvelopeDirectly,
  publishEnvelopeToBoard,
  hostReassignCharacter,
  exportFullRoomState,
  importFullRoomState,
  executeScenarioScript,
  simulateResetRoom,
  simulateUnlockAllClues,
  simulateAllVotesAndDeductions,
  simulateInstantFullGame,
  triggerSecondAttack,
  revealSafariSuitNudge,
} from '../lib/firestoreService';
import { sound } from '../lib/audio';
import {
  ShieldAlert,
  FlaskConical,
  Eye,
  FastForward,
  RotateCcw,
  Download,
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Sparkles,
  Bot,
  Layers,
  FileCode,
  Terminal,
  Lock,
  Unlock,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Cpu,
  Tv,
  Smartphone,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface DirectorModeProps {
  room: RoomData | null;
  players: PlayerData[];
  envelopeStates: Record<string, EnvelopeStateData>;
  currentRoomCode: string;
  currentPlayerUid: string;
  onSelectImpersonatedPlayer?: (uid: string) => void;
  onClose?: () => void;
  onExitDirector?: () => void;
  isStandaloneRoute?: boolean;
}

const PHASES_LIST: GamePhase[] = [
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

const DIRECTOR_SECRET_KEY = 'director2026';

export const DirectorMode: React.FC<DirectorModeProps> = ({
  room,
  players,
  envelopeStates,
  currentRoomCode,
  currentPlayerUid,
  onSelectImpersonatedPlayer,
  onClose,
  onExitDirector,
  isStandaloneRoute = false,
}) => {
  // Gating & Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check URL param ?secret=... or ?key=... or localStorage
    const params = new URLSearchParams(window.location.search);
    const secret = params.get('secret') || params.get('key') || params.get('auth');
    if (secret === DIRECTOR_SECRET_KEY || secret === 'amcm' || secret === 'director') {
      return true;
    }
    return localStorage.getItem('amcm_director_auth') === 'true';
  });
  const [passInput, setPassInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'oracle' | 'godview' | 'timetravel' | 'replay' | 'quicktools'>('oracle');

  // Solvability Oracle State
  const [manualHostReadCards, setManualHostReadCards] = useState<string[]>(['clue-1']);
  
  // Snapshots for quick in-memory rewind
  const [snapshots, setSnapshots] = useState<{ id: string; name: string; phase: GamePhase; data: FullRoomSnapshot }[]>([]);
  const [exportJson, setExportJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedExport, setCopiedExport] = useState<boolean>(false);

  // Scenario Replay State
  const [scenarioInput, setScenarioInput] = useState<string>(JSON.stringify(DEFAULT_SCENARIO_SCRIPT, null, 2));
  const [replayLogs, setReplayLogs] = useState<ScenarioReplayLog[]>([]);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayProgress, setReplayProgress] = useState<{ step: number; total: number } | null>(null);

  // Busy action indicators
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // God view filter
  const [godViewSearch, setGodViewSearch] = useState<string>('');
  const [godViewCategory, setGodViewCategory] = useState<'all' | 'faculty' | 'students' | 'outsiders'>('all');

  // Compute published envelopes
  const publishedLetters = useMemo(() => {
    return Object.keys(envelopeStates).filter((letter) => envelopeStates[letter]?.published);
  }, [envelopeStates]);

  // Compute active host-read clue cards based on room phase or manual toggles
  const activeClueCardPhases = useMemo(() => {
    const set = new Set<string>(manualHostReadCards);
    if (room?.phase) {
      if (['R1_WAKE', 'R2_PAIRING', 'R3_BOARD', 'INTERVAL', 'R4_INTERROGATION', 'R5_HUNT', 'DEDUCTION', 'VOTE', 'REVEAL'].includes(room.phase)) {
        set.add('R1_WAKE');
        set.add('clue-1');
      }
      if (['INTERVAL', 'R4_INTERROGATION', 'R5_HUNT', 'DEDUCTION', 'VOTE', 'REVEAL'].includes(room.phase)) {
        set.add('INTERVAL');
        set.add('clue-2');
      }
      if (['R4_INTERROGATION', 'R5_HUNT', 'DEDUCTION', 'VOTE', 'REVEAL'].includes(room.phase)) {
        set.add('R4_INTERROGATION');
        set.add('clue-3');
      }
    }
    return Array.from(set);
  }, [room?.phase, manualHostReadCards]);

  // Compute Oracle Output in real time on every published letter or clue event
  const oracleState: OracleState = useMemo(() => {
    return computeOracleState(publishedLetters, activeClueCardPhases, room?.phase || 'LOBBY');
  }, [publishedLetters, activeClueCardPhases, room?.phase]);

  // Passcode verification
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput.trim() === DIRECTOR_SECRET_KEY || passInput.trim().toLowerCase() === 'director') {
      setIsAuthenticated(true);
      localStorage.setItem('amcm_director_auth', 'true');
      setAuthError('');
      sound.playSuccess();
    } else {
      setAuthError('INVALID DIRECTOR AUTHORIZATION SECRET.');
      sound.playStinger();
    }
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Perform async actions safely
  const runAsync = async (label: string, fn: () => Promise<void>) => {
    setBusyAction(label);
    sound.playClick();
    try {
      await fn();
      showToast(`${label} executed successfully.`);
      sound.playSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      showToast(`Error: ${msg}`);
      sound.playStinger();
    } finally {
      setBusyAction(null);
    }
  };

  // Snapshot & Time Travel handlers
  const handleTakeSnapshot = async () => {
    if (!room?.roomCode) return;
    runAsync('Save Snapshot', async () => {
      const snapshot = await exportFullRoomState(room.roomCode);
      const newSnap = {
        id: `snap-${Date.now()}`,
        name: `Snapshot at [${room.phase}] (${new Date().toLocaleTimeString()})`,
        phase: room.phase,
        data: snapshot,
      };
      setSnapshots((prev) => [newSnap, ...prev]);
    });
  };

  const handleRestoreSnapshot = async (snap: FullRoomSnapshot) => {
    if (!room?.roomCode) return;
    runAsync('Rewind to Snapshot', async () => {
      await importFullRoomState(room.roomCode, snap);
    });
  };

  const handleExportStateJson = async () => {
    if (!room?.roomCode) return;
    runAsync('Export Board JSON', async () => {
      const snapshot = await exportFullRoomState(room.roomCode);
      setExportJson(JSON.stringify(snapshot, null, 2));
    });
  };

  const handleImportStateJson = async () => {
    if (!room?.roomCode || !importJson.trim()) return;
    runAsync('Import Board JSON', async () => {
      try {
        const parsed = JSON.parse(importJson) as FullRoomSnapshot;
        await importFullRoomState(room.roomCode, parsed);
        setImportStatus({ type: 'success', message: 'Board state successfully restored from JSON payload.' });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON format';
        setImportStatus({ type: 'error', message: `Parse error: ${msg}` });
        throw err;
      }
    });
  };

  // Scenario Replay Execution
  const handleRunReplay = async () => {
    if (!room?.roomCode || !scenarioInput.trim()) return;
    setIsReplaying(true);
    sound.playClick();
    try {
      const script = JSON.parse(scenarioInput) as ScenarioAction[];
      const logs = await executeScenarioScript(
        room.roomCode,
        script,
        (step, total) => setReplayProgress({ step, total })
      );
      setReplayLogs(logs);
      sound.playVictory();
      showToast(`Scenario Replay completed (${logs.length} phase boundaries evaluated).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to execute replay scenario';
      showToast(`Replay error: ${msg}`);
      sound.playStinger();
    } finally {
      setIsReplaying(false);
      setReplayProgress(null);
    }
  };

  // Auto-fill mock scenario if empty
  const handleLoadDefaultScenario = () => {
    setScenarioInput(JSON.stringify(DEFAULT_SCENARIO_SCRIPT, null, 2));
    sound.playClick();
  };

  // Locked Gate Screen if secret is invalid
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-black/90 border-2 border-red-700/60 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-red-900/50 pb-4">
            <div className="p-2.5 bg-red-950/80 border border-red-600 rounded-xl text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-white tracking-wide">
                Director Mode Authorization
              </h1>
              <p className="text-xs font-mono text-red-400">
                RESTRICTED DEV INSTRUMENT • ACCESS GATED
              </p>
            </div>
          </div>

          <p className="text-xs text-white/70 font-mono leading-relaxed">
            Please enter the secret key or visit this endpoint with <code className="text-amber-300 bg-black/50 px-1 py-0.5 rounded">?secret=director2026</code> in the URL.
          </p>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                Director Secret Key
              </label>
              <input
                type="password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="Enter secret (e.g. director2026)"
                className="w-full bg-slate-900/90 border border-white/20 text-white font-mono text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-red-500"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-2.5 bg-red-950/60 border border-red-600/60 text-red-300 text-xs font-mono rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-red-800 hover:bg-red-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock Director Console</span>
            </button>
          </form>

          {isStandaloneRoute && (
            <div className="pt-2 text-center">
              <a
                href="/"
                className="text-xs font-mono text-white/40 hover:text-white underline"
              >
                Return to standard game
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col font-sans selection:bg-red-900 selection:text-white">
      {/* Top HUD Bar */}
      <header className="bg-black/90 border-b border-red-900/40 px-4 py-3 sticky top-0 z-40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-red-950 to-amber-950 border border-red-600/70 rounded-xl text-amber-300 shadow-md">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-serif font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>DIRECTOR MODE</span>
                <span className="px-1.5 py-0.5 bg-red-600/30 border border-red-500/50 text-red-300 text-[9px] font-mono font-bold rounded">
                  DEV TOOL
                </span>
              </h1>
              {room && (
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                  ROOM: {room.roomCode}
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-white/50">
              Solvability Oracle • God View Matrix • Time Travel Engine • Scenario Replayer
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('oracle');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'oracle'
                ? 'bg-red-800 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-amber-300" />
            <span>1. Solvability Oracle</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] ${oracleState.isSolved ? 'bg-emerald-500 text-black font-bold' : 'bg-red-950 text-amber-300'}`}>
              N={oracleState.candidatesRemaining}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('godview');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'godview'
                ? 'bg-red-800 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-amber-300" />
            <span>2. God View</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('timetravel');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'timetravel'
                ? 'bg-red-800 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FastForward className="w-3.5 h-3.5 text-amber-300" />
            <span>3. Time Travel</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('replay');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'replay'
                ? 'bg-red-800 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-amber-300" />
            <span>4. Scenario Replay</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('quicktools');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quicktools'
                ? 'bg-red-800 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>5. Quick Tools</span>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-xs font-mono flex items-center gap-1"
              title="Close Director Overlay"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          )}

          {onExitDirector && (
            <button
              onClick={onExitDirector}
              className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-red-200 rounded-lg text-xs font-mono flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
          )}
        </div>
      </header>

      {/* Toast Feedback */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-amber-500/80 text-amber-200 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: SOLVABILITY ORACLE */}
        {activeTab === 'oracle' && (
          <div className="space-y-6">
            {/* Oracle Primary Status Banner */}
            <div className={`p-5 rounded-2xl border-2 shadow-xl transition-all ${
              oracleState.isSolved
                ? 'bg-gradient-to-r from-emerald-950/80 via-black to-emerald-950/50 border-emerald-500'
                : 'bg-gradient-to-r from-red-950/80 via-black to-amber-950/40 border-red-800/60'
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl border-2 ${
                    oracleState.isSolved
                      ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300'
                      : 'bg-red-900/50 border-red-500 text-amber-300'
                  }`}>
                    <Cpu className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                        Solvability Oracle
                      </h2>
                      {oracleState.isSolved ? (
                        <span className="px-2.5 py-0.5 bg-emerald-500 text-black text-xs font-mono font-black rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          SOLVABILITY REACHED (N=1)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold rounded-full">
                          DEDUCTION IN PROGRESS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/70 font-mono mt-1">
                      Computed automatically on every published evidence slip + host-read Tier III clue slip.
                    </p>
                  </div>
                </div>

                {/* Big N Counter Metric */}
                <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-5 py-3 rounded-xl shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest block">
                      Candidates Remaining
                    </span>
                    <span className={`text-3xl font-mono font-black ${
                      oracleState.isSolved ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {oracleState.candidatesRemaining} / 20
                    </span>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="text-left">
                    <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest block">
                      Eliminated
                    </span>
                    <span className="text-3xl font-mono font-black text-red-400">
                      {20 - oracleState.candidatesRemaining}
                    </span>
                  </div>
                </div>
              </div>

              {/* Solved Flag Banner when N=1 */}
              {oracleState.isSolved && (
                <div className="mt-4 p-3.5 bg-emerald-950/90 border border-emerald-500/60 rounded-xl flex items-center justify-between gap-3 text-xs font-mono text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white uppercase">Single Candidate Isolated: </span>
                      <span className="text-emerald-300 font-bold text-sm">
                        #{oracleState.survivingCharacters[0]?.id} {oracleState.survivingCharacters[0]?.name}
                      </span>
                      <span className="text-emerald-400/80 ml-2">({oracleState.survivingCharacters[0]?.title})</span>
                    </div>
                  </div>
                  {oracleState.solvedRound && (
                    <span className="bg-emerald-900/80 border border-emerald-400 px-2 py-1 rounded text-[11px] font-mono text-emerald-200">
                      Solved at: [{oracleState.solvedRound}]
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Two Column Layout: Surviving Candidates vs Elimination Trace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Surviving Candidates (5 Cols) */}
              <div className="lg:col-span-5 bg-black/70 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-serif font-bold text-white">
                      Surviving Candidate Pool ({oracleState.candidatesRemaining})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    Active Suspects
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {oracleState.survivingCharacters.map((c) => {
                    const isTheKiller = c.is_murderer;
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isTheKiller
                            ? 'bg-red-950/30 border-red-500/60 shadow-md'
                            : 'bg-slate-900/60 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            isTheKiller ? 'bg-red-700 text-white' : 'bg-slate-800 text-amber-300'
                          }`}>
                            #{c.id}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-serif font-bold text-white">
                                {c.name}
                              </span>
                              {isTheKiller && (
                                <span className="px-1.5 py-0.2 bg-red-600/30 border border-red-500 text-red-300 text-[9px] font-mono font-bold rounded">
                                  TRUE KILLER
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-white/50 truncate max-w-[200px]">
                              {c.title}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 rounded">
                          Env {c.envelope_letter}
                        </span>
                      </div>
                    );
                  })}

                  {oracleState.survivingCharacters.length === 0 && (
                    <div className="p-8 text-center text-xs font-mono text-red-400 border border-red-900/40 rounded-xl">
                      Over-elimination detected. 0 candidates remaining.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Detailed Elimination Trace Matrix (7 Cols) */}
              <div className="lg:col-span-7 bg-black/70 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-serif font-bold text-white">
                      Elimination Log & Forensic Causality ({oracleState.eliminatedRecords.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    Slip-by-Slip Audit
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {oracleState.eliminatedRecords.map((r, idx) => (
                    <div
                      key={`${r.characterId}-${idx}`}
                      className="p-3 bg-slate-900/80 border border-red-900/30 rounded-xl space-y-1.5 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-red-950 border border-red-700/60 text-red-300 rounded flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-serif font-bold text-white text-xs">
                            #{r.characterId} {r.characterName}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-red-950/60 border border-red-800/40 text-red-300 text-[10px] rounded">
                          {r.slipId}
                        </span>
                      </div>

                      <div className="text-[11px] text-white/70 bg-black/40 p-2 rounded-lg border border-white/5 leading-relaxed">
                        <span className="text-amber-400 font-bold">Reason: </span>
                        {r.reason}
                      </div>
                    </div>
                  ))}

                  {oracleState.eliminatedRecords.length === 0 && (
                    <div className="p-8 text-center text-xs font-mono text-white/40 border border-dashed border-white/10 rounded-xl space-y-2">
                      <p>No evidence slips published or host clue cards read yet.</p>
                      <p className="text-[11px] text-amber-300/70">
                        Publish envelopes in Round 3 or read Tier III clues to observe candidate set collapse in real time.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Envelope Publishing Simulator Deck for Oracle Verification */}
            <div className="bg-black/80 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-serif font-bold text-white">
                    Simulate Evidence Slips & Clue Cards
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-white/40">
                  Toggle published status to audit Oracle deductions
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {Object.keys(ENVELOPES).map((letter) => {
                  const env = ENVELOPES[letter];
                  const isPublished = envelopeStates[letter]?.published;
                  const isUnlocked = envelopeStates[letter]?.unlocked;

                  return (
                    <button
                      key={letter}
                      disabled={busyAction !== null}
                      onClick={async () => {
                        if (!room?.roomCode) return;
                        if (!isPublished) {
                          runAsync(`Publish Env ${letter}`, async () => {
                            if (!isUnlocked) {
                              await unlockEnvelopeDirectly(room.roomCode, letter, 'Director Override');
                            }
                            await publishEnvelopeToBoard(room.roomCode, letter, 'Director Override');
                          });
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                        isPublished
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                          : isUnlocked
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                          : 'bg-slate-900/60 border-white/10 text-white/60 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-serif font-bold">
                          Env {letter}
                        </span>
                        {isPublished ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-white/30" />
                        )}
                      </div>
                      <div className="text-[9px] font-mono line-clamp-2 text-white/50">
                        {env.title.split(':')[0]}
                      </div>
                      <span className="text-[9px] font-mono uppercase font-bold">
                        {isPublished ? 'PUBLISHED' : isUnlocked ? 'UNLOCKED' : 'CLICK TO PUB'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOT SEEDING & GOD VIEW */}
        {activeTab === 'godview' && (
          <div className="space-y-6">
            {/* Bot Seeding Bar */}
            <div className="p-4 bg-slate-900/80 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-300">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-bold text-white">
                    1-Click 20-Player Bot Seeding
                  </h3>
                  <p className="text-xs font-mono text-white/50">
                    Seeds 20 distinct AI suspects with complete secret dossiers into room {room?.roomCode || '---'}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  disabled={busyAction !== null || !room?.roomCode}
                  onClick={() => {
                    if (!room?.roomCode) return;
                    runAsync('Seed 20 Bots', async () => {
                      await simulateBotSuspects(room.roomCode, 20);
                    });
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#8B1A1A] to-amber-700 hover:from-[#A82020] text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                  id="btn-director-seed-20-bots"
                >
                  <Users className="w-4 h-4" />
                  <span>Seed 20 Bots</span>
                </button>
              </div>
            </div>

            {/* Impersonation Control Banner */}
            <div className="p-4 bg-black/80 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold block">
                    Director Impersonate / Perspective Hijack
                  </span>
                  <span className="text-[11px] font-mono text-white/60">
                    Act as any suspect to inspect private dossiers, riddles, or submit actions.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  onChange={async (e) => {
                    const charId = Number(e.target.value);
                    if (!charId || !room?.roomCode) return;
                    sound.playClick();
                    await hostReassignCharacter(room.roomCode, currentPlayerUid, charId);
                    showToast(`Hijacked identity to Suspect #${charId}`);
                  }}
                  className="w-full md:w-64 bg-slate-900 border border-amber-500/50 text-amber-200 text-xs font-mono py-2 px-3 rounded-xl focus:outline-none focus:border-amber-400"
                  id="select-director-impersonate"
                >
                  <option value="">-- Choose Character to Impersonate --</option>
                  {CHARACTERS.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      #{c.id} {c.name} ({c.title.split('.')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* God View Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={godViewSearch}
                  onChange={(e) => setGodViewSearch(e.target.value)}
                  placeholder="Filter suspects, secrets, codes..."
                  className="w-full bg-slate-900 border border-white/10 pl-9 pr-3 py-2 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-mono">
                {(['all', 'faculty', 'students', 'outsiders'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setGodViewCategory(cat)}
                    className={`px-3 py-1 rounded-lg uppercase tracking-wider ${
                      godViewCategory === cat ? 'bg-red-800 text-white font-bold' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* God View 20-Character Dossier Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {CHARACTERS.filter((c) => {
                if (godViewSearch) {
                  const q = godViewSearch.toLowerCase();
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.title.toLowerCase().includes(q) ||
                    c.secret.toLowerCase().includes(q) ||
                    c.fragment_riddle.toLowerCase().includes(q) ||
                    c.code_half.includes(q)
                  );
                }
                return true;
              }).map((c) => {
                const assignedPlayer = players.find((p) => p.characterId === c.id);
                const env = ENVELOPES[c.envelope_letter];

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      c.is_murderer
                        ? 'bg-red-950/40 border-red-500/80 shadow-lg'
                        : 'bg-black/70 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded">
                            #{c.id}
                          </span>
                          <h4 className="text-sm font-serif font-bold text-white">
                            {c.name}
                          </h4>
                          {c.is_murderer && (
                            <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-mono font-bold rounded">
                              MURDERER
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          {c.title}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono rounded">
                          Env {c.envelope_letter} (Code: {c.code_half})
                        </span>
                        <span className="text-[9px] font-mono text-white/40 block mt-0.5">
                          {assignedPlayer ? `Player: ${assignedPlayer.name}` : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Confidential Secret (God View Visible) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold block">
                        Confidential Secret:
                      </span>
                      <p className="text-[11px] text-white/80 font-serif leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5 max-h-28 overflow-y-auto">
                        {c.secret}
                      </p>
                    </div>

                    {/* Cryptic Riddle & Goal */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                        <span className="text-amber-400 font-bold block mb-0.5">Known Fact:</span>
                        <p className="text-white/70 line-clamp-3">{c.known_fact}</p>
                      </div>

                      <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                        <span className="text-amber-400 font-bold block mb-0.5">Riddle Fragment:</span>
                        <p className="text-white/70 line-clamp-3 italic">{c.fragment_riddle}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TIME TRAVEL & SNAPSHOTS */}
        {activeTab === 'timetravel' && (
          <div className="space-y-6">
            {/* Jump Direct to Any Phase */}
            <div className="bg-black/70 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <FastForward className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-serif font-bold text-white">
                    Direct Phase Warp (Skip Phase Timers)
                  </h3>
                </div>
                <span className="text-xs font-mono text-amber-300 font-bold">
                  Current: [{room?.phase || 'LOBBY'}]
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {PHASES_LIST.map((phase) => {
                  const isCurrent = room?.phase === phase;
                  const cfg = PHASE_CONFIG[phase];

                  return (
                    <button
                      key={phase}
                      disabled={busyAction !== null || !room?.roomCode}
                      onClick={() => {
                        if (!room?.roomCode) return;
                        runAsync(`Jump to ${phase}`, async () => {
                          await jumpToPhaseDirectly(room.roomCode, phase);
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                        isCurrent
                          ? 'bg-red-800 border-red-500 text-white shadow-lg'
                          : 'bg-slate-900/70 border-white/10 text-white/70 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold uppercase tracking-wider">
                        {phase}
                      </span>
                      <span className="text-[10px] font-serif text-white/60 line-clamp-2">
                        {cfg?.title || phase}
                      </span>
                      <span className="text-[9px] font-mono text-amber-300/80">
                        {isCurrent ? '● ACTIVE' : 'WARP NOW'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In-Memory Snapshot Manager */}
            <div className="bg-black/70 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-serif font-bold text-white">
                    Board Snapshots & Rewind
                  </h3>
                </div>

                <button
                  disabled={busyAction !== null || !room?.roomCode}
                  onClick={handleTakeSnapshot}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Capture Snapshot Now</span>
                </button>
              </div>

              <div className="space-y-2">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <span className="text-white font-bold block">{snap.name}</span>
                      <span className="text-white/40 text-[10px]">
                        Phase: {snap.phase} • Players: {snap.data.players.length} • Votes: {snap.data.votes.length}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRestoreSnapshot(snap.data)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-mono font-bold text-xs rounded-lg flex items-center gap-1 shadow-md active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rewind to this State</span>
                    </button>
                  </div>
                ))}

                {snapshots.length === 0 && (
                  <div className="p-6 text-center text-xs font-mono text-white/40 border border-dashed border-white/10 rounded-xl">
                    No snapshots captured in this session yet. Click "Capture Snapshot Now" to record state.
                  </div>
                )}
              </div>
            </div>

            {/* Export & Import Full Board State JSON */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Column */}
              <div className="bg-black/70 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-serif font-bold text-white">
                      Export Board State as JSON
                    </h3>
                  </div>

                  <button
                    onClick={handleExportStateJson}
                    className="px-3 py-1 bg-sky-800 hover:bg-sky-700 text-white text-xs font-mono rounded-lg"
                  >
                    Generate Export
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      readOnly
                      value={exportJson}
                      placeholder="Click 'Generate Export' to generate complete room snapshot..."
                      rows={8}
                      className="w-full bg-slate-950 border border-white/10 text-emerald-400 font-mono text-[11px] p-3 rounded-xl focus:outline-none resize-none"
                    />
                    {exportJson && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(exportJson);
                          setCopiedExport(true);
                          sound.playClick();
                          setTimeout(() => setCopiedExport(false), 2000);
                        }}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-xs font-mono flex items-center gap-1 shadow"
                      >
                        {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedExport ? 'Copied!' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Import Column */}
              <div className="bg-black/70 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-serif font-bold text-white">
                      Import & Restore Board State
                    </h3>
                  </div>

                  <button
                    disabled={!importJson.trim()}
                    onClick={handleImportStateJson}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-mono font-bold text-xs rounded-lg"
                  >
                    Restore from JSON
                  </button>
                </div>

                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Paste exported full room snapshot JSON here to restore all room documents..."
                  rows={8}
                  className="w-full bg-slate-950 border border-white/10 text-amber-300 font-mono text-[11px] p-3 rounded-xl focus:outline-none resize-none"
                />

                {importStatus && (
                  <div className={`p-2.5 rounded-lg text-xs font-mono ${
                    importStatus.type === 'success' ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                  }`}>
                    {importStatus.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SCENARIO REPLAY */}
        {activeTab === 'replay' && (
          <div className="space-y-6">
            <div className="bg-black/70 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white">
                      Automated Scenario Replay Engine
                    </h3>
                    <p className="text-[11px] font-mono text-white/50">
                      Executes an ordered array of actions and calculates the Solvability Oracle at each phase boundary.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadDefaultScenario}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono rounded-lg"
                  >
                    Load Default Script
                  </button>

                  <button
                    type="button"
                    disabled={isReplaying || !room?.roomCode}
                    onClick={handleRunReplay}
                    className="px-4 py-1.5 bg-gradient-to-r from-red-700 to-amber-700 hover:brightness-110 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 shadow-md active:scale-95"
                    id="btn-run-scenario-replay"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isReplaying ? 'Replaying...' : 'Execute Scenario'}</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar if Running */}
              {replayProgress && (
                <div className="space-y-1.5 font-mono text-xs text-amber-300">
                  <div className="flex justify-between">
                    <span>Executing step {replayProgress.step} of {replayProgress.total}...</span>
                    <span>{Math.round((replayProgress.step / replayProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-200"
                      style={{ width: `${(replayProgress.step / replayProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Scenario JSON Editor */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">
                  Scenario Actions Payload (JSON Array)
                </label>
                <textarea
                  value={scenarioInput}
                  onChange={(e) => setScenarioInput(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-950 border border-white/10 text-amber-300 font-mono text-xs p-3.5 rounded-xl focus:outline-none resize-y"
                />
              </div>

              {/* Replay Results & Oracle Phase Outputs Table */}
              {replayLogs.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                      Oracle Output at Phase Boundaries ({replayLogs.length} Steps)
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {replayLogs[replayLogs.length - 1]?.oracle.isSolved ? '✔ SOLVABLE' : 'UNSOLVED'}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {replayLogs.map((log) => (
                      <div
                        key={log.step}
                        className="p-3 bg-slate-900/90 border border-white/10 rounded-xl space-y-2 font-mono text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-red-900/80 text-white rounded flex items-center justify-center font-bold text-[10px]">
                              {log.step}
                            </span>
                            <span className="text-amber-300 font-bold">[{log.phase}]</span>
                            <span className="text-white/60">({log.actor})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-white/50">{log.action}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.oracle.isSolved ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-amber-300'
                            }`}>
                              N={log.oracle.candidatesRemaining}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-white/80">{log.summary}</p>

                        <div className="text-[10px] bg-black/50 p-2 rounded-lg space-y-1 text-white/60">
                          <div>
                            <span className="text-white/40">Surviving ({log.oracle.survivingNames.length}): </span>
                            <span className="text-emerald-300">{log.oracle.survivingNames.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: QUICK TOOLS & EMERGENCY RESETS */}
        {activeTab === 'quicktools' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unlock All Clues */}
              <div className="p-5 bg-black/70 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-white">
                      Unlock All 10 Evidence Envelopes
                    </h4>
                    <p className="text-xs font-mono text-white/50">
                      Unseals envelopes A through J simultaneously with matching partner codes.
                    </p>
                  </div>
                </div>
                <button
                  disabled={busyAction !== null || !room?.roomCode}
                  onClick={() => {
                    if (!room?.roomCode) return;
                    runAsync('Unlock All Clues', async () => {
                      await simulateUnlockAllClues(room.roomCode);
                    });
                  }}
                  className="w-full py-2 bg-amber-800 hover:bg-amber-700 text-white font-mono text-xs uppercase font-bold rounded-lg"
                >
                  Unseal All 10 Envelopes
                </button>
              </div>

              {/* Populate All Ballots */}
              <div className="p-5 bg-black/70 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500/20 text-sky-300 rounded-xl">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-white">
                      Populate All 20 Ballots & Deductions
                    </h4>
                    <p className="text-xs font-mono text-white/50">
                      Simulates votes, scoring questionnaires, and complicit designations.
                    </p>
                  </div>
                </div>
                <button
                  disabled={busyAction !== null || !room?.roomCode}
                  onClick={() => {
                    if (!room?.roomCode) return;
                    runAsync('Populate Votes', async () => {
                      await simulateAllVotesAndDeductions(room.roomCode);
                    });
                  }}
                  className="w-full py-2 bg-sky-800 hover:bg-sky-700 text-white font-mono text-xs uppercase font-bold rounded-lg"
                >
                  Populate All 20 Ballots
                </button>
              </div>

              {/* Trigger Second Attack */}
              <div className="p-5 bg-black/70 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-500/20 text-red-300 rounded-xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-white">
                      Trigger Anatomy Hall Attack Event
                    </h4>
                    <p className="text-xs font-mono text-white/50">
                      Plays the dramatic siren stinger and broadcasts blackout alert.
                    </p>
                  </div>
                </div>
                <button
                  disabled={busyAction !== null || !room?.roomCode}
                  onClick={() => {
                    if (!room?.roomCode) return;
                    runAsync('Trigger Attack', async () => {
                      await triggerSecondAttack(room.roomCode);
                    });
                  }}
                  className="w-full py-2 bg-red-800 hover:bg-red-700 text-white font-mono text-xs uppercase font-bold rounded-lg"
                >
                  Trigger Second Attack Siren
                </button>
              </div>

              {/* Clean Reset */}
              <div className="p-5 bg-black/70 border border-red-900/40 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-950 text-red-400 rounded-xl">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-bold text-white">
                      Full Clean Reset to LOBBY
                    </h4>
                    <p className="text-xs font-mono text-white/50">
                      Wipes all votes, deductions, and envelope unseals back to blank slate.
                    </p>
                  </div>
                </div>
                <button
                  disabled={busyAction !== null || !room?.roomCode}
                  onClick={() => {
                    if (!room?.roomCode) return;
                    runAsync('Full Room Reset', async () => {
                      await simulateResetRoom(room.roomCode);
                    });
                  }}
                  className="w-full py-2 bg-red-950 hover:bg-red-900 border border-red-600 text-red-200 font-mono text-xs uppercase font-bold rounded-lg"
                >
                  Clean Reset Room
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
