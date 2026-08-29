import React, { useState, useEffect } from 'react';
import { createGameRoom, joinGameRoom, createSoloDemoRoom } from '../lib/firestoreService';
import { sound } from '../lib/audio';
import { DROP_ORDER_CHARACTER_IDS, CHARACTERS } from '../data/game';
import { Shield, Users, KeyRound, AlertTriangle, ArrowRight, Skull, FileText, CheckCircle2, FlaskConical, Sparkles, Bot } from 'lucide-react';

interface EntryScreenProps {
  userUid: string;
  initialRoomCode?: string;
  onRoomJoined: (roomCode: string, isHost: boolean) => void;
}

export const EntryScreen: React.FC<EntryScreenProps> = ({
  userUid,
  initialRoomCode = '',
  onRoomJoined,
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'host'>('join');
  const [roomCodeInput, setRoomCodeInput] = useState<string>(initialRoomCode.toUpperCase());
  const [playerName, setPlayerName] = useState<string>('');
  const [hostName, setHostName] = useState<string>('Game Director');
  const [playerCapacity, setPlayerCapacity] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const savedName = localStorage.getItem('amcm_player_name');
    const savedCode = localStorage.getItem('amcm_room_code');
    if (savedName) setPlayerName(savedName);
    if (savedCode && !initialRoomCode) setRoomCodeInput(savedCode);
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode.toUpperCase());
      setActiveTab('join');
    }
  }, [initialRoomCode]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const code = roomCodeInput.trim().toUpperCase();
    const name = playerName.trim();

    if (!code || code.length < 3) {
      setErrorMessage('Please enter a valid 4-letter room code.');
      return;
    }
    if (!name) {
      setErrorMessage('Please enter your name to claim your identity.');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      localStorage.setItem('amcm_player_name', name);
      localStorage.setItem('amcm_room_code', code);
      await joinGameRoom(code, userUid, name);
      sound.playClueFound();
      onRoomJoined(code, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join room';
      setErrorMessage(msg);
      sound.playStinger();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    sound.playClick();

    try {
      const code = await createGameRoom(userUid, hostName.trim() || 'Director', playerCapacity);
      localStorage.setItem('amcm_room_code', code);
      sound.playClueFound();
      onRoomJoined(code, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create room';
      setErrorMessage(msg);
      sound.playStinger();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchSoloDemo = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    sound.playClick();

    try {
      const code = await createSoloDemoRoom(userUid, 'Solo Director');
      localStorage.setItem('amcm_room_code', code);
      sound.playClueFound();
      onRoomJoined(code, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create solo demo room';
      setErrorMessage(msg);
      sound.playStinger();
    } finally {
      setIsSubmitting(false);
    }
  };

  const droppedCharacters = DROP_ORDER_CHARACTER_IDS.slice(0, 20 - playerCapacity).map((id) =>
    CHARACTERS.find((c) => c.id === id)
  );

  return (
    <div className="min-h-screen bg-[#0F0E0E] text-[#F2ECEA] flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Subtle paper grain / line background */}
      <div className="w-full max-w-xl mx-auto">
        {/* Header Title Section */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8B1A1A]/20 border border-[#8B1A1A]/40 rounded text-[#F2ECEA]/80 text-xs font-mono tracking-widest uppercase mb-2">
            <Skull className="w-3.5 h-3.5 text-[#8B1A1A]" />
            <span>Forensic Case File #1995-2024</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif text-[#F2ECEA] tracking-tight leading-none">
            The Anand Medical College Murder
          </h1>
          <div className="h-[1px] w-24 bg-[#8B1A1A] mx-auto my-2" />
          <p className="text-sm text-[#F2ECEA]/60 max-w-md mx-auto leading-relaxed">
            Dean Dr. Vikram Rathod was murdered in the Anatomy Hall. 20 suspects. 10 sealed envelopes. 1 physical room.
          </p>
        </div>

        {/* Dossier Card Container */}
        <div className="dossier-card rounded-xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Top Crimson Rule */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#8B1A1A]" />

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-black/40 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('join');
                setErrorMessage('');
              }}
              className={`py-2.5 px-4 text-xs font-mono uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'join'
                  ? 'bg-[#8B1A1A] text-white shadow-md font-semibold'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              id="tab-join-player"
            >
              <Users className="w-4 h-4" />
              <span>Join as Player</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveTab('host');
                setErrorMessage('');
              }}
              className={`py-2.5 px-4 text-xs font-mono uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'host'
                  ? 'bg-[#8B1A1A] text-white shadow-md font-semibold'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              id="tab-host-director"
            >
              <Shield className="w-4 h-4" />
              <span>Host / Director</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-start gap-2.5 text-xs text-red-200 animate-shake">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'join' ? (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#F2ECEA]/70 uppercase tracking-wider mb-1.5">
                  4-Letter Room Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCD"
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-4 py-3 text-lg font-mono text-center tracking-widest text-[#F2ECEA] focus:outline-none focus:border-[#8B1A1A] transition-colors placeholder:text-white/20"
                    required
                    id="input-join-room-code"
                  />
                  <KeyRound className="w-4 h-4 text-white/30 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#F2ECEA]/70 uppercase tracking-wider mb-1.5">
                  Your Real Name
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-4 py-3 text-sm text-[#F2ECEA] focus:outline-none focus:border-[#8B1A1A] transition-colors placeholder:text-white/20"
                  required
                  id="input-join-player-name"
                />
                <p className="text-[11px] text-white/40 mt-1 font-mono">
                  You will be assigned a suspect dossier automatically or by the Host.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 bg-[#8B1A1A] hover:bg-[#A82020] disabled:bg-white/10 text-white font-mono text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99]"
                id="btn-submit-join-room"
              >
                {isSubmitting ? (
                  <span>Accessing Case Files...</span>
                ) : (
                  <>
                    <span>Enter Examination Chamber</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateHost} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#F2ECEA]/70 uppercase tracking-wider mb-1.5">
                  Host / Director Name
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Game Director"
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-4 py-3 text-sm text-[#F2ECEA] focus:outline-none focus:border-[#8B1A1A] transition-colors"
                  required
                  id="input-host-name"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-[#F2ECEA]/70 uppercase tracking-wider">
                    Expected Player Count
                  </label>
                  <span className="text-xs font-mono font-bold text-[#8B1A1A] px-2 py-0.5 bg-black/50 border border-white/10 rounded">
                    {playerCapacity} Players
                  </span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={20}
                  step={1}
                  value={playerCapacity}
                  onChange={(e) => setPlayerCapacity(Number(e.target.value))}
                  className="w-full accent-[#8B1A1A] bg-black/40 h-2 rounded-lg cursor-pointer"
                  id="range-player-capacity"
                />
                <div className="flex justify-between text-[10px] font-mono text-white/40 mt-1">
                  <span>12 (Minimum)</span>
                  <span>16 (Mid)</span>
                  <span>20 (Full Case)</span>
                </div>

                {playerCapacity < 20 && (
                  <div className="mt-3 p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg text-xs text-amber-200/80">
                    <p className="font-mono font-semibold text-[11px] mb-1 text-amber-300">
                      Auto-Dropped Characters ({20 - playerCapacity}):
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-white/60">
                      {droppedCharacters.map((c) => (
                        <li key={c?.id}>
                          {c?.name} ({c?.title}) - Partner unlocks envelope solo.
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-6 bg-[#8B1A1A] hover:bg-[#A82020] disabled:bg-white/10 text-white font-mono text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99]"
                id="btn-submit-create-room"
              >
                {isSubmitting ? (
                  <span>Initializing Examination Chamber...</span>
                ) : (
                  <>
                    <span>Create Murder Mystery Chamber</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Forensic Protocol Footer */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B1A1A]" />
              <span>Realtime Device Sync</span>
            </span>
            <a
              href="/director?secret=director2026"
              className="text-amber-400/70 hover:text-amber-300 hover:underline flex items-center gap-1"
            >
              <span>Director Mode (/director)</span>
            </a>
          </div>
        </div>

        {/* Solo Player Instant Test & Simulation Card */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-black to-[#8B1A1A]/10 border border-[#8B1A1A]/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8B1A1A]/30 border border-[#8B1A1A] rounded-xl text-amber-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif font-bold text-white">
                  Solo Tester / Single Player Sandbox
                </span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold rounded">
                  TEST MODE
                </span>
              </div>
              <p className="text-[11px] text-white/60 font-mono">
                No friends available? Launch an instant room pre-filled with 20 AI suspects & full simulation tools.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleLaunchSoloDemo}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#8B1A1A] hover:bg-[#A82020] text-white font-mono text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shrink-0 active:scale-95"
            id="btn-launch-solo-demo"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Launch Solo Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
