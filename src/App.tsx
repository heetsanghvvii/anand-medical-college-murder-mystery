import { useState, useEffect } from 'react';
import { ensureAnonymousAuth } from './lib/firebase';
import {
  listenToRoom,
  listenToPlayers,
  listenToEnvelopeStates,
  listenToNairMessages,
  listenToVotes,
  listenToDeductions,
  listenToCompels,
} from './lib/firestoreService';
import {
  RoomData,
  PlayerData,
  EnvelopeStateData,
  NairMessageData,
  VoteData,
  DeductionData,
  CompelUseData,
} from './types';
import { EntryScreen } from './components/EntryScreen';
import { HostScreen } from './components/HostScreen';
import { PlayerScreen } from './components/PlayerScreen';
import { SpectatorScreen } from './components/SpectatorScreen';
import { SoloSimulatorModal } from './components/SoloSimulatorModal';
import { DirectorMode } from './components/DirectorMode';
import { Shield, Tv, Smartphone, RefreshCw, FlaskConical, Sparkles, Users, Cpu, KeyRound, ExternalLink, ArrowLeft } from 'lucide-react';
import { sound } from './lib/audio';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentRoomCode, setCurrentRoomCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const tvCode = params.get('tv');
    if (tvCode && tvCode !== 'true') return tvCode.toUpperCase();
    const spectatorCode = params.get('spectator');
    if (spectatorCode && spectatorCode !== 'true') return spectatorCode.toUpperCase();
    return '';
  });
  const [isHostRole, setIsHostRole] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isTvMode, setIsTvMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('tv') || params.get('view') === 'spectator' || params.has('spectator');
  });
  const [isDirectorOpen, setIsDirectorOpen] = useState<boolean>(() => {
    const isDirectorPath = window.location.pathname.startsWith('/director') || window.location.hash.startsWith('#/director');
    const params = new URLSearchParams(window.location.search);
    return isDirectorPath || params.get('director') === 'true' || params.has('secret');
  });

  // Firestore Realtime State
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [envelopeStates, setEnvelopeStates] = useState<EnvelopeStateData[]>([]);
  const [nairMessages, setNairMessages] = useState<NairMessageData[]>([]);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [deductions, setDeductions] = useState<DeductionData[]>([]);
  const [compels, setCompels] = useState<CompelUseData[]>([]);

  // Manual view override (to allow host to inspect mobile suspect view or vice versa)
  const [viewModeOverride, setViewModeOverride] = useState<'auto' | 'host' | 'player'>('auto');

  // 1. Initialize Anonymous Firebase Auth on startup
  useEffect(() => {
    async function initAuth() {
      try {
        const user = await ensureAnonymousAuth();
        setCurrentUser(user);
      } catch (err) {
        console.error('Firebase authentication failed:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    initAuth();
  }, []);

  // 2. Check URL parameters for direct room joining (e.g. ?join=ABCD)
  const urlParams = new URLSearchParams(window.location.search);
  const initialJoinParam = urlParams.get('join') || urlParams.get('room') || '';

  // Listen to popstate or url changes for /director
  useEffect(() => {
    const handleLocationChange = () => {
      const isDir = window.location.pathname.startsWith('/director') || window.location.hash.startsWith('#/director');
      const params = new URLSearchParams(window.location.search);
      if (isDir || params.get('director') === 'true' || params.has('secret')) {
        setIsDirectorOpen(true);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // 3. Setup Firestore Realtime Listeners (onSnapshot) when connected to a room
  useEffect(() => {
    if (!currentRoomCode) return;

    const unsubRoom = listenToRoom(
      currentRoomCode,
      (data) => {
        setRoomData(data);
      }
    );

    const unsubPlayers = listenToPlayers(currentRoomCode, (pList) => {
      setPlayers(pList);
    });

    const unsubEnvelopes = listenToEnvelopeStates(currentRoomCode, (eList) => {
      setEnvelopeStates(eList);
    });

    const unsubMessages = listenToNairMessages(currentRoomCode, (mList) => {
      setNairMessages(mList);
    });

    const unsubVotes = listenToVotes(currentRoomCode, (vList) => {
      setVotes(vList);
    });

    const unsubDeductions = listenToDeductions(currentRoomCode, (dList) => {
      setDeductions(dList);
    });

    const unsubCompels = listenToCompels(currentRoomCode, (cList) => {
      setCompels(cList);
    });

    return () => {
      unsubRoom();
      unsubPlayers();
      unsubEnvelopes();
      unsubMessages();
      unsubVotes();
      unsubDeductions();
      unsubCompels();
    };
  }, [currentRoomCode]);

  // Handle Room Joined Callback from EntryScreen
  const handleRoomJoined = (code: string, isHost: boolean) => {
    setCurrentRoomCode(code);
    setIsHostRole(isHost);
    // Update browser URL without reloading
    const newUrl = `${window.location.pathname}?room=${code}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleLeaveRoom = () => {
    sound.playClick();
    setCurrentRoomCode('');
    setRoomData(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 space-y-4 font-mono">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-amber-400/90 uppercase tracking-widest">
          Securing Sanctum Neural Connection...
        </p>
      </div>
    );
  }

  // Find the current player doc for this device
  const myPlayerDoc = players.find((p) => p.uid === currentUser?.uid);
  const isActualHost = roomData?.hostUid === currentUser?.uid || isHostRole;
  const isViewingAsHost = viewModeOverride === 'host' || (viewModeOverride === 'auto' && isActualHost);

  // Convert envelopeStates list to dictionary mapping
  const envelopeMap: Record<string, EnvelopeStateData> = {};
  envelopeStates.forEach((e) => {
    envelopeMap[e.letter] = e;
  });

  // If Standalone TV Spectator Mode is active (?tv=CODE or ?spectator=CODE or ?view=spectator)
  if (isTvMode) {
    if (!currentRoomCode || !roomData) {
      return (
        <div className="min-h-screen bg-[#0D0C0B] text-[#F7F4EF] flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-full max-w-md bg-[#171615] border-2 border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="p-4 bg-[#8B1A1A]/20 border border-[#8B1A1A] rounded-2xl w-fit mx-auto text-[#8B1A1A]">
              <Tv className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs font-typewriter uppercase tracking-widest text-[#8B1A1A] font-bold block mb-1">
                KEM HOSPITAL 1995 • RECORDS ARCHIVE
              </span>
              <h2 className="text-2xl font-heading font-bold text-white">
                TV Spectator Screen
              </h2>
              <p className="text-xs font-typewriter text-white/60 mt-2">
                Connect this window to your TV or secondary projector to stream the clean archival evidence board and live broadcast alerts.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="ENTER 4-LETTER ROOM CODE"
                maxLength={4}
                defaultValue={initialJoinParam || ''}
                id="input-tv-connect-code"
                className="w-full bg-black/60 border border-white/20 text-center uppercase font-typewriter text-lg py-3 rounded-xl text-white tracking-widest focus:outline-none focus:border-[#8B1A1A]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim().toUpperCase();
                    if (val.length >= 3) {
                      setCurrentRoomCode(val);
                      window.history.pushState({}, '', `/?tv=${val}`);
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('input-tv-connect-code') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    const val = input.value.trim().toUpperCase();
                    setCurrentRoomCode(val);
                    window.history.pushState({}, '', `/?tv=${val}`);
                  }
                }}
                className="w-full py-3.5 bg-[#8B1A1A] hover:bg-[#A82020] text-white font-typewriter text-xs uppercase tracking-widest font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Tv className="w-4 h-4" />
                <span>Connect TV Display</span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-center">
              <button
                onClick={() => {
                  setIsTvMode(false);
                  window.history.pushState({}, '', '/');
                }}
                className="text-xs font-typewriter text-white/40 hover:text-white underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Standard App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <SpectatorScreen
          room={roomData}
          players={players}
          envelopeStates={envelopeStates}
          nairMessages={nairMessages}
          onClose={() => {
            setIsTvMode(false);
            window.history.pushState({}, '', `/?room=${currentRoomCode}`);
          }}
          isStandaloneTv={true}
        />
      </div>
    );
  }

  // If Director Mode is requested (via /director, URL param, or top HUD)
  if (isDirectorOpen) {
    return (
      <div className="min-h-screen bg-[#06080d] text-white">
        {!currentRoomCode || !roomData ? (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-black/90 border border-red-800/60 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
              <div className="p-3 bg-red-950/80 border border-red-600 rounded-xl text-amber-300 w-fit mx-auto">
                <Cpu className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-white">
                  Director Mode Standalone Console
                </h2>
                <p className="text-xs font-mono text-white/50 mt-1">
                  Connect or seed a room to access the Solvability Oracle, God View & Replay.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={async () => {
                    sound.playClick();
                    try {
                      const { createSoloDemoRoom } = await import('./lib/firestoreService');
                      const code = await createSoloDemoRoom(currentUser?.uid || 'director', 'Director Host');
                      handleRoomJoined(code, true);
                    } catch (err) {
                      console.error('Failed to create demo room:', err);
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Launch 20-Player Sandbox Room</span>
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="OR ENTER 4-LETTER CODE"
                    maxLength={4}
                    id="input-director-connect-code"
                    className="flex-1 bg-slate-900 border border-white/20 text-center uppercase font-mono text-sm py-2.5 rounded-xl text-white focus:outline-none focus:border-red-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim().toUpperCase();
                        if (val.length >= 3) handleRoomJoined(val, true);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('input-director-connect-code') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleRoomJoined(input.value.trim().toUpperCase(), true);
                      }
                    }}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase font-bold rounded-xl"
                  >
                    Connect
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsDirectorOpen(false);
                    window.history.pushState({}, '', '/');
                  }}
                  className="text-xs font-mono text-white/40 hover:text-white underline"
                >
                  Return to Standard Game Lobby
                </button>
              </div>
            </div>
          </div>
        ) : (
          <DirectorMode
            room={roomData}
            players={players}
            envelopeStates={envelopeMap}
            currentRoomCode={currentRoomCode}
            currentPlayerUid={currentUser?.uid || ''}
            onClose={() => setIsDirectorOpen(false)}
            onExitDirector={() => {
              setIsDirectorOpen(false);
              window.history.pushState({}, '', currentRoomCode ? `/?room=${currentRoomCode}` : '/');
            }}
            isStandaloneRoute={true}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-[#e0e0e0] font-sans relative overflow-x-hidden selection:bg-[#ffb000] selection:text-black">
      {/* Ambient Radial Gradient Overlays from Immersive UI */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(255, 68, 0, 0.12) 0%, transparent 70%), radial-gradient(circle at 100% 100%, rgba(0, 150, 255, 0.06) 0%, transparent 50%)',
        }}
      />

      {!currentRoomCode || !roomData ? (
        <div className="relative z-10">
          <EntryScreen
            userUid={currentUser?.uid || 'anonymous'}
            initialRoomCode={initialJoinParam}
            onRoomJoined={handleRoomJoined}
          />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Top Quick Bar for Multi-Device Perspective Switch */}
          <div className="bg-black/60 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-mono text-white/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffb000] shadow-[0_0_6px_#ffb000] animate-pulse"></span>
                <span className="text-[#ffb000] font-bold tracking-wider text-[11px]">FIRESTORE PROTOCOL LIVE</span>
              </div>
              <span className="hidden sm:inline text-white/20">|</span>
              <span className="hidden sm:inline text-white/40 text-[10px] tracking-wider">
                UID: {currentUser?.uid.slice(0, 8)}...
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Director Mode Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsDirectorOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-950 to-slate-900 hover:from-red-900 hover:to-slate-800 border border-red-700/60 text-red-200 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                title="Open Director Mode (/director): Solvability Oracle, God View, Time Travel & Scenario Replay"
                id="btn-open-director-mode"
              >
                <Cpu className="w-3.5 h-3.5 text-amber-300" />
                <span>Director Mode</span>
              </button>

              {/* Solo Player Test & Simulation Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsSimulatorOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#8B1A1A] to-amber-700/80 hover:from-[#A82020] hover:to-amber-600 text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                title="Open Solo Test Suite: fill bots, unlock clues, warp phases, or simulate entire game"
                id="btn-open-solo-simulator"
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-300" />
                <span>Solo Test Deck</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setViewModeOverride(isViewingAsHost ? 'player' : 'host');
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white flex items-center gap-2 transition-all text-[11px] font-mono uppercase tracking-wider"
                title="Switch between Room TV Display and Player Mobile View"
                id="btn-switch-view-mode"
              >
                {isViewingAsHost ? <Smartphone className="w-3.5 h-3.5 text-sky-400" /> : <Tv className="w-3.5 h-3.5 text-[#ffb000]" />}
                <span className="hidden sm:inline">View as: </span>
                <span>{isViewingAsHost ? 'Player Device' : 'Host Screen'}</span>
              </button>

              <button
                onClick={handleLeaveRoom}
                className="px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 text-red-300 transition-colors text-[11px] font-mono uppercase tracking-wider"
                id="btn-leave-room"
              >
                Exit Room
              </button>
            </div>
          </div>

          {/* Render Active View */}
          <div className="flex-1 flex flex-col">
            {isViewingAsHost ? (
              <HostScreen
                room={roomData}
                players={players}
                envelopeStates={envelopeStates}
                nairMessages={nairMessages}
                votes={votes}
                deductions={deductions}
                compels={compels}
                hostUid={currentUser?.uid || ''}
              />
            ) : (
              <PlayerScreen
                room={roomData}
                player={
                  myPlayerDoc || {
                    uid: currentUser?.uid || 'temp',
                    name: 'Suspect',
                    characterId: 1,
                    characterName: 'Dr. Arjun Sethi',
                    isHost: false,
                    isReady: true,
                    joinedAt: Date.now(),
                    online: true,
                  }
                }
                players={players}
                envelopeStates={envelopeStates}
                nairMessages={nairMessages}
                votes={votes}
                deductions={deductions}
                compels={compels}
              />
            )}
          </div>

          {/* Solo Test & Simulation Deck Modal */}
          <SoloSimulatorModal
            room={roomData}
            players={players}
            currentPlayerUid={currentUser?.uid || ''}
            currentPlayerDoc={myPlayerDoc}
            isOpen={isSimulatorOpen}
            onClose={() => setIsSimulatorOpen(false)}
            onToggleViewMode={() => setViewModeOverride(isViewingAsHost ? 'player' : 'host')}
            isViewingAsHost={isViewingAsHost}
          />

          {/* Tactical Bottom Footer HUD from Immersive UI */}
          <footer className="h-9 bg-black/80 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-6 text-[10px] font-mono text-white/30 z-30">
            <div className="flex gap-4">
              <span>FIREBASE_ANON_AUTH: ACTIVE</span>
              <span className="hidden sm:inline">ROOM: {roomData.roomCode}</span>
            </div>
            <div className="flex gap-4 items-center">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
                <span className="text-green-500/70 font-semibold">SYNCED</span>
              </span>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
