import React, { useState, useEffect } from 'react';
import {
  RoomData,
  PlayerData,
  EnvelopeStateData,
  NairMessageData,
  VoteData,
  DeductionData,
  CompelUseData,
} from '../types';
import {
  CHARACTERS,
  ENVELOPES,
  PHASE_CONFIG,
  DROP_ORDER_CHARACTER_IDS,
} from '../data/game';
import {
  submitFragmentCode,
  publishEnvelope,
  submitVote,
  submitDeduction,
  sendNairFiveWords,
  recordHuntFind,
} from '../lib/firestoreService';
import { fetchCharacterSecret, CharacterSecretResponse } from '../lib/apiService';
import { sound } from '../lib/audio';
import { CompelResponderModal, CompelInitiatorModal } from './CompelModal';
import { SecondAttackModal } from './SecondAttackModal';
import { EnvelopeModal } from './EnvelopeModal';
import { PlayerManualModal } from './PlayerManualModal';
import { RelationshipMapModal } from './RelationshipMapModal';
import {
  FileText,
  KeyRound,
  Grid,
  Zap,
  Lock,
  Globe,
  Radio,
  AlertTriangle,
  Send,
  CheckCircle2,
  HelpCircle,
  Award,
  Search,
  Eye,
  ShieldAlert,
  Sparkles,
  Ban,
  FileCheck,
  Building2,
  Stamp,
  FolderClosed,
  PartyPopper,
  HeartHandshake,
  Bot,
  BookOpen,
  Network,
  Volume2,
  VolumeX,
  Languages,
  MessageSquareQuote,
  EyeOff,
  NotebookPen,
} from 'lucide-react';

interface PlayerScreenProps {
  room: RoomData;
  player: PlayerData;
  players: PlayerData[];
  envelopeStates: EnvelopeStateData[];
  nairMessages: NairMessageData[];
  votes: VoteData[];
  deductions: DeductionData[];
  compels: CompelUseData[];
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({
  room,
  player,
  players,
  envelopeStates,
  nairMessages,
  votes,
  deductions,
  compels,
}) => {
  // Modal states
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isBoardOpen, setIsBoardOpen] = useState<boolean>(false);
  const [introLang, setIntroLang] = useState<'en' | 'gu'>('en');

  // Fragment Form State
  const [partnerNameInput, setPartnerNameInput] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [isSubmittingCode, setIsSubmittingCode] = useState<boolean>(false);
  const [codeError, setCodeError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Local Scratchpad Notes
  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem(`player_notes_${room.roomCode}_${player.uid}`) || '';
  });

  // Nair 5-Word State
  const [nairInput, setNairInput] = useState<string>('');
  const [nairSending, setNairSending] = useState<boolean>(false);

  // Compel Modal State for Priya
  const [showCompelInitiator, setShowCompelInitiator] = useState<boolean>(false);

  // Second Attack Modal Dismissal
  const [hasDismissedAttack, setHasDismissedAttack] = useState<boolean>(false);

  // Envelope Inspection Modal
  const [inspectEnvelopeLetter, setInspectEnvelopeLetter] = useState<string | null>(null);

  // Deduction Form State
  const [q1Killer, setQ1Killer] = useState<string>('');
  const [q2Source, setQ2Source] = useState<string>('');
  const [q3Motive, setQ3Motive] = useState<string>('');
  const [q4Secrets, setQ4Secrets] = useState<string[]>(['', '', '']);
  const [q5Envelope, setQ5Envelope] = useState<string>('');
  const [deductionSubmitted, setDeductionSubmitted] = useState<boolean>(false);

  // Vote Form State
  const [selectedAccusedId, setSelectedAccusedId] = useState<number | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState<boolean>(false);

  // Server-gated character secrets (secret, known_fact, is_murderer)
  const [characterSecrets, setCharacterSecrets] = useState<CharacterSecretResponse | null>(null);
  const [secretsLoading, setSecretsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    if (player?.characterId && room?.roomCode) {
      setSecretsLoading(true);
      fetchCharacterSecret(room.roomCode, player.characterId)
        .then((data) => {
          if (isMounted) {
            setCharacterSecrets(data);
          }
        })
        .catch((err) => {
          console.error('Failed to load private dossier:', err);
        })
        .finally(() => {
          if (isMounted) setSecretsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [player?.characterId, room?.roomCode]);

  // Strictly bind character to assigned character only
  const character = CHARACTERS.find((c) => c.id === player.characterId) || CHARACTERS[0];
  const envelopeLetter = character.envelope_letter;
  const myEnvelopeData = ENVELOPES[envelopeLetter];
  const myEnvelopeState = envelopeStates.find((e) => e.letter === envelopeLetter);
  const currentPhase = room.phase || 'LOBBY';
  const phaseInfo = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.LOBBY;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // Save notes locally
  useEffect(() => {
    localStorage.setItem(`player_notes_${room.roomCode}_${player.uid}`, notes);
  }, [notes, room.roomCode, player.uid]);

  // Determine Character Physical Slip Tier
  const tierNumber = character.id <= 6 ? 1 : character.id <= 14 ? 2 : 3;
  const tierColorName = tierNumber === 1 ? 'White' : tierNumber === 2 ? 'Amber' : 'Red';
  const tierPaperClass =
    tierNumber === 1
      ? 'bg-white border-[#D5CFBE] text-[#1C1B19]'
      : tierNumber === 2
      ? 'bg-[#E8D5A3] border-[#C4AD75] text-[#241F14]'
      : 'bg-[#C4453D] border-[#8B1A1A] text-[#FDFBF7]';

  // Check if player has an incoming pending compel
  const incomingCompel = compels.find(
    (c) => c.to_player_uid === player.uid && c.status === 'pending'
  );

  // Check if Priya has already used her token
  const hasUsedCompel = compels.some((c) => c.from_player_uid === player.uid);

  // Check existing vote & deduction
  const myVote = votes.find((v) => v.voter_player_id === player.uid);
  const myDeduction = deductions.find((d) => d.player_id === player.uid);

  // Check partner dropped status
  const capacity = room.maxPlayerCapacity || 20;
  const droppedIds = new Set(DROP_ORDER_CHARACTER_IDS.slice(0, 20 - capacity));
  const partnerCharId = myEnvelopeData?.char_id_1 === character.id ? myEnvelopeData?.char_id_2 : myEnvelopeData?.char_id_1;
  const isPartnerDropped = droppedIds.has(partnerCharId);
  const partnerChar = CHARACTERS.find((c) => c.id === partnerCharId);

  // Check if partner is AI
  const partnerPlayer = players.find((p) => p.characterId === partnerChar?.id);
  const isPartnerBot =
    partnerPlayer?.isBot ||
    partnerPlayer?.uid.startsWith('bot_') ||
    partnerPlayer?.name.includes('(AI)');

  // Handle fragment code submission
  const handleFragmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    setIsShaking(false);
    setIsSubmittingCode(true);
    sound.playClick();

    try {
      const res = await submitFragmentCode(
        room.roomCode,
        player.uid,
        character.id,
        partnerNameInput,
        enteredCode.trim(),
        capacity
      );

      if (!res.success) {
        setCodeError(res.message || 'Invalid code. Check your partner and digit order!');
        setIsShaking(true);
        sound.playStinger();
      } else {
        sound.playSuccess();
      }
    } catch (err: any) {
      setCodeError(err.message || 'Failed to submit code.');
      setIsShaking(true);
      sound.playStinger();
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Handle Vote Submission
  const handleCastVote = async () => {
    if (!selectedAccusedId) {
      alert('Please select a suspect to accuse.');
      return;
    }
    const accusedChar = CHARACTERS.find((c) => c.id === selectedAccusedId);
    if (!accusedChar) return;

    sound.playClick();
    await submitVote(
      room.roomCode,
      player.uid,
      player.name,
      accusedChar.id,
      accusedChar.name
    );
    sound.playSuccess();
    setVoteSubmitted(true);
  };

  // Handle Nair 5 Words
  const handleSendNairWords = async (e: React.FormEvent) => {
    e.preventDefault();
    const words = nairInput.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0 || words.length > 5) {
      alert('You must provide between 1 and 5 words.');
      return;
    }
    setNairSending(true);
    sound.playClick();
    await sendNairFiveWords(
      room.roomCode,
      player.uid,
      character.name,
      words.join(' '),
      currentPhase
    );
    setNairInput('');
    setNairSending(false);
    sound.playSuccess();
  };

  // Handle Deduction Submit
  const handleDeductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    await submitDeduction(room.roomCode, {
      player_id: player.uid,
      player_name: player.name,
      character_id: character.id,
      character_name: character.name,
      q1_killer: q1Killer,
      q2_source: q2Source,
      q3_motive: q3Motive,
      q4_secrets: q4Secrets,
      q5_envelope: q5Envelope,
    });
    sound.playClueFound();
    setDeductionSubmitted(true);
  };

  // Nair restricted words count
  const nairWordsCount = nairInput.trim() ? nairInput.trim().split(/\s+/).filter(Boolean).length : 0;
  const isNairAttacked = character.id === 6 && room.secondAttackTriggered;

  const selectedEnvelopeData = inspectEnvelopeLetter ? ENVELOPES[inspectEnvelopeLetter] : null;
  const selectedEnvelopeState = inspectEnvelopeLetter ? envelopeStates.find((e) => e.letter === inspectEnvelopeLetter) : undefined;

  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full min-h-screen bg-[#F7F4EF] text-[#1C1B19] font-sans pb-16 border-x border-[#E2DDD3] shadow-xl">
      {/* ================= STICKY TOP APP BAR ================= */}
      <header className="bg-[#1C2C3F] text-[#F7F4EF] p-4 sticky top-0 z-30 shadow-lg border-b-2 border-[#121E2C]">
        <div className="flex items-center justify-between gap-3">
          {/* Character Identity - Locked to this player only */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B1A1A] border border-white/30 flex items-center justify-center font-mono font-bold text-sm text-white shadow">
              #{character.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-white tracking-wide truncate max-w-[180px]">
                  {character.name}
                </span>
                {characterSecrets?.is_murderer && (
                  <span className="px-1.5 py-0.5 bg-[#8B1A1A] text-white text-[9px] font-mono font-bold rounded">
                    CULPRIT
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-white/70">
                {character.title}
              </div>
            </div>
          </div>

          {/* Quick Helper Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setIsManualOpen(true);
              }}
              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-all active:scale-95 shadow"
              title="How to Play Manual"
              id="btn-player-open-manual"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rules</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setIsMapOpen(true);
              }}
              className="px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-all active:scale-95 shadow"
              title="Campus Tree & Map"
              id="btn-player-open-map"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Tree</span>
            </button>
          </div>
        </div>

        {/* Phase Indicator Strip */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80">Phase: <strong>{phaseInfo.title}</strong></span>
          </div>
          <span className="px-2 py-0.5 rounded bg-black/40 text-amber-300 border border-white/10 text-[10px]">
            Room: {room.roomCode}
          </span>
        </div>
      </header>

      {/* ================= MAIN STREAMLINED SINGLE-PAGE VIEW ================= */}
      <main className="p-4 sm:p-5 space-y-6">
        {/* SECTION 1: ROUND 1 SPOKEN INTRODUCTION (READ ALOUD) */}
        <section className="bg-gradient-to-br from-[#241F18] to-[#171615] text-[#F7F4EF] rounded-2xl p-5 border-2 border-[#E8D5A3]/40 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  ROUND 1 SPOKEN INTRODUCTION
                </span>
                <h2 className="text-sm sm:text-base font-serif font-bold text-white">
                  Read This Aloud When Called Upon
                </h2>
              </div>
            </div>

            {/* Language Switch */}
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/15 text-[11px] font-mono">
              <button
                onClick={() => {
                  sound.playClick();
                  setIntroLang('en');
                }}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  introLang === 'en' ? 'bg-[#8B1A1A] text-white font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setIntroLang('gu');
                }}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  introLang === 'gu' ? 'bg-[#8B1A1A] text-white font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                ગુજરાતી
              </button>
            </div>
          </div>

          <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
            <p className="text-sm sm:text-base font-serif italic text-amber-100/95 leading-relaxed">
              "{introLang === 'en' ? character.intro_en : character.intro_gu}"
            </p>
          </div>

          <div className="text-[11px] font-mono text-white/60 flex items-center justify-between">
            <span>Nothing to invent — just read this aloud in Round 1!</span>
            <span className="text-amber-300">Slip Tier {tierNumber} ({tierColorName})</span>
          </div>
        </section>

        {/* SECTION 2: IDENTITY & PUBLIC DOSSIER */}
        <section className="bg-[#FAF8F5] rounded-2xl p-5 border-2 border-[#D5CFBE] shadow-md space-y-4">
          <div className="flex items-start justify-between border-b border-[#D5CFBE] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#2E4A6B] font-bold block">
                CAMPUS PERSONNEL DOSSIER #{character.id}
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1C1B19]">
                {character.name}
              </h3>
              <p className="text-xs font-mono text-[#5A5752] mt-0.5">
                {character.title}
              </p>
            </div>
            <div className="rubber-stamp-red shrink-0 text-[9px]">
              CONFIDENTIAL
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-white rounded-xl border border-[#D5CFBE]">
              <span className="text-[9px] uppercase text-[#6B665E] block font-bold">Generation & Batch</span>
              <span className="text-[#1C1B19] font-bold capitalize">{character.generation} ({character.batch})</span>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-[#D5CFBE]">
              <span className="text-[9px] uppercase text-[#6B665E] block font-bold">Internal Extension</span>
              <span className="text-[#1C1B19] font-bold">{character.extension ? `Ext ${character.extension}` : 'None'}</span>
            </div>

            {character.parent_of && (
              <div className="col-span-2 p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-sky-950">
                <span className="text-[9px] uppercase text-sky-700 block font-bold">Parent Of</span>
                <span className="font-bold">{character.parent_of}</span>
              </div>
            )}

            {character.child_of && (
              <div className="col-span-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                <span className="text-[9px] uppercase text-emerald-700 block font-bold">Child Of</span>
                <span className="font-bold">{character.child_of}</span>
              </div>
            )}
          </div>

          {/* Murderer Warning */}
          {characterSecrets?.is_murderer && (
            <div className="p-4 bg-[#FBF0EE] border-2 border-[#8B1A1A] rounded-xl space-y-1">
              <div className="text-sm font-serif font-bold text-[#8B1A1A] uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>YOU ARE THE KILLER</span>
              </div>
              <p className="text-xs font-mono text-[#5C1010] leading-relaxed">
                You poisoned Dean Vikram Rathod using potassium chloride from OT-3 to protect Vivek from expulsion. Deflect suspicion at all costs!
              </p>
            </div>
          )}

          {/* Public Bio */}
          <div>
            <span className="text-[10px] font-mono uppercase text-[#2E4A6B] font-bold block mb-1">
              Public Bio & Campus Background:
            </span>
            <p className="text-xs text-[#2C2A26] leading-relaxed font-sans bg-white p-3.5 rounded-xl border border-[#E2DDD3]">
              {character.public_bio}
            </p>
          </div>
        </section>

        {/* SECTION 3: YOUR SECRET (LIE FREELY) */}
        <section className="bg-[#FAF1F0] rounded-2xl p-5 border-2 border-[#E8C5C3] shadow-md space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#E8C5C3] pb-2">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-[#8B1A1A]" />
              <span className="text-xs font-mono uppercase text-[#8B1A1A] font-bold tracking-wider">
                YOUR CONFIDENTIAL SECRET (LIE FREELY)
              </span>
            </div>
            <span className="text-[9px] font-mono bg-[#8B1A1A] text-white px-2 py-0.5 rounded font-bold uppercase">
              RULE 1: LIE
            </span>
          </div>

          <p className="text-xs font-sans text-[#1C1B19] leading-relaxed bg-white p-3.5 rounded-xl border border-[#E8C5C3] whitespace-pre-wrap">
            {characterSecrets?.secret || (secretsLoading ? 'Decrypting classified dossier from police database...' : 'Confidential file locked.')}
          </p>

          <p className="text-[10px] font-mono text-[#8B1A1A] italic">
            💡 <strong>Guidance:</strong> This looks terrible, but it is not the murder. Deny it, deflect, or invent an alibi!
          </p>
        </section>

        {/* SECTION 4: WHAT YOU SAW / KNOWN FACT (TELL THE TRUTH) */}
        <section className="bg-[#EEF5F2] rounded-2xl p-5 border-2 border-[#BCE0D1] shadow-md space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#BCE0D1] pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B634B]" />
              <span className="text-xs font-mono uppercase text-[#1B634B] font-bold tracking-wider">
                VERIFIED FACT: WHAT YOU SAW (TELL THE TRUTH)
              </span>
            </div>
            <span className="text-[9px] font-mono bg-[#1B634B] text-white px-2 py-0.5 rounded font-bold uppercase">
              RULE 2: TRUTH
            </span>
          </div>

          <p className="text-xs font-sans text-[#124232] leading-relaxed bg-white p-3.5 rounded-xl border border-[#BCE0D1]">
            {characterSecrets?.known_fact || (secretsLoading ? 'Verifying eyewitness statement...' : 'Eyewitness statement locked.')}
          </p>

          <p className="text-[10px] font-mono text-[#1B634B] italic">
            💡 <strong>Guidance:</strong> If someone asks you directly about this, you MUST tell the truth. You may stall or trade, but never invent false facts.
          </p>
        </section>

        {/* SECTION 5: ROUND 2 PARTNER RIDDLE & WAX SEAL CODE (MERGED DIRECTLY ON PAGE) */}
        <section className="bg-[#FAF8F5] rounded-2xl p-5 border-2 border-[#D5CFBE] shadow-md space-y-4" id="section-partner-riddle">
          <div className="flex items-center justify-between border-b border-[#D5CFBE] pb-2.5">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#8B1A1A]" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#2E4A6B] font-bold block">
                  ROUND 2 PARTNER RIDDLE • EXHIBIT {character.envelope_letter}
                </span>
                <h3 className="text-sm font-serif font-bold text-[#1C1B19]">
                  Find Your Partner to Unseal Exhibit {character.envelope_letter}
                </h3>
              </div>
            </div>
            <span className="rubber-stamp-blue text-[8px]">
              EXHIBIT {character.envelope_letter}
            </span>
          </div>

          {/* Riddle Card */}
          <div className="p-4 bg-white border border-[#D5CFBE] rounded-xl space-y-1.5 shadow-sm">
            <span className="text-[10px] font-mono uppercase text-[#6B665E] font-bold block">
              Your Partner Riddle:
            </span>
            <p className="text-sm font-serif italic text-[#1C1B19] leading-relaxed">
              "{character.fragment_riddle}"
            </p>
            <p className="text-[10px] font-mono text-[#2E4A6B] pt-1">
              (Check the Family Tree on the TV screen or tap the Tree button above to decode who this is!)
            </p>
          </div>

          {/* Code Half & Speaking Order */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-[#D5CFBE] text-center shadow-sm">
              <span className="text-[9px] font-mono uppercase text-[#6B665E] block font-bold mb-0.5">
                Your 2-Digit Half
              </span>
              <span className="text-2xl font-mono font-bold text-[#8B1A1A]">
                {character.code_half}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#D5CFBE] text-center flex flex-col justify-center shadow-sm">
              <span className="text-[9px] font-mono uppercase text-[#6B665E] block font-bold mb-0.5">
                Speaking Order
              </span>
              <span className="text-xs font-mono font-bold text-[#2E4A6B]">
                {character.speaks_first ? 'Speak FIRST' : 'Speak SECOND'}
              </span>
            </div>
          </div>

          {/* AI Partner Helper If Simulated */}
          {isPartnerBot && partnerChar && !isPartnerDropped && (
            <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-900 font-bold flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Partner: #{partnerChar.id} {partnerChar.name} (AI Suspect)</span>
                </span>
                <span className="text-[9px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                  AI SIMULATED
                </span>
              </div>
              <p className="text-[11px] text-[#4A4844] font-mono leading-relaxed">
                Your partner is simulated by an AI. Tap below to automatically insert their 2-digit code ({partnerChar.code_half})!
              </p>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setPartnerNameInput(partnerChar.name);
                  const combined = character.speaks_first
                    ? `${character.code_half}${partnerChar.code_half}`
                    : `${partnerChar.code_half}${character.code_half}`;
                  setEnteredCode(combined);
                }}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono rounded-xl transition-all flex items-center justify-center gap-1.5 shadow active:scale-95 font-bold"
                id="btn-player-auto-fill-ai-code"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Auto-Fill AI Partner Code ({partnerChar.code_half})</span>
              </button>
            </div>
          )}

          {/* Unlocked Exhibit Content OR Code Input Form */}
          {myEnvelopeState?.unlocked ? (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500/50 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2 text-emerald-800 font-mono text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>WAX SEAL BROKEN • EXHIBIT UNLOCKED</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[9px] font-mono font-bold uppercase">
                  UNSEALED
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-serif font-bold text-[#1C1B19]">
                    {myEnvelopeData?.title}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">
                    3 ROUNDS OF SLIPS
                  </span>
                </div>
                <p className="text-xs text-[#4A4844] mt-1 font-sans">
                  {myEnvelopeData?.summary}
                </p>
              </div>

              {/* Multi-Tier Slips Presentation */}
              <div className="space-y-3">
                {myEnvelopeData?.slips?.map((slip, sIdx) => {
                  const isTier1 = slip.tier === 'I';
                  const isTier2 = slip.tier === 'II';
                  const isTier3 = slip.tier === 'III';

                  const slipBg = isTier1
                    ? 'bg-white border-[#D5CFBE]'
                    : isTier2
                    ? 'bg-[#FEF9E7] border-[#F2D786]'
                    : 'bg-[#FAF1F0] border-[#E8C5C3]';

                  const badgeStyle = isTier1
                    ? 'bg-zinc-200 text-zinc-800'
                    : isTier2
                    ? 'bg-amber-200 text-amber-900 font-bold'
                    : 'bg-red-200 text-red-950 font-bold';

                  return (
                    <div key={sIdx} className={`p-4 rounded-xl border-2 space-y-2 shadow-sm ${slipBg}`}>
                      <div className="flex items-center justify-between border-b border-black/10 pb-1.5">
                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${badgeStyle}`}>
                          TIER {slip.tier} • ROUND {slip.round} SLIP ({slip.paper.toUpperCase()} PAPER)
                        </span>
                        <span className="text-[10px] font-mono text-black/50 font-bold">
                          Slip #{sIdx + 1}
                        </span>
                      </div>
                      <h5 className="text-xs font-serif font-bold text-[#1C1B19]">
                        {slip.title}
                      </h5>
                      <p className="text-xs font-mono text-[#1C1B19] whitespace-pre-wrap leading-relaxed bg-black/5 p-2.5 rounded-lg">
                        {slip.text}
                      </p>
                      <div className="text-[10px] font-mono text-[#4A4844] flex items-center justify-between pt-1 border-t border-black/5">
                        <span>Wire: <em>"{slip.board_summary}"</em></span>
                        {slip.narrows_to && slip.narrows_to.length > 0 && (
                          <span className="text-red-700 font-bold">
                            Narrows: #{slip.narrows_to.join(', #')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Publish to Public TV Board */}
              {!myEnvelopeState.published ? (
                <div className="pt-2 space-y-2">
                  <button
                    onClick={async () => {
                      if (
                        confirm(
                          'PUBLISH TO PUBLIC RECORD: This will immediately display this exhibit on the TV board for everyone to see. Proceed?'
                        )
                      ) {
                        sound.playClick();
                        await publishEnvelope(room.roomCode, character.envelope_letter, player.name);
                      }
                    }}
                    className="w-full py-3 bg-[#8B1A1A] hover:bg-[#A82020] text-white font-mono text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow font-bold active:scale-95"
                    id="btn-player-publish-envelope"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Publish Exhibit to Public Board</span>
                  </button>
                  <p className="text-[10px] font-mono text-[#6B665E] text-center">
                    Currently held in confidential custody between you and your partner.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-center text-xs font-mono text-emerald-900 font-bold">
                  ✓ Exhibit published to public board by {myEnvelopeState.published_by}.
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleFragmentSubmit} className={`space-y-3 pt-1 ${isShaking ? 'animate-shake' : ''}`}>
              {!isPartnerDropped && (
                <div>
                  <label className="block text-[11px] font-mono text-[#4A4844] mb-1 font-bold">
                    Partner Suspect Name
                  </label>
                  <input
                    type="text"
                    value={partnerNameInput}
                    onChange={(e) => setPartnerNameInput(e.target.value)}
                    placeholder="e.g. Ramesh Gokhale"
                    className="w-full bg-white border border-[#C4BCAE] rounded-xl p-2.5 text-xs text-[#1C1B19] focus:outline-none focus:border-[#2E4A6B]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-[#4A4844] mb-1 font-bold">
                  {isPartnerDropped ? 'Your 2-Digit Code Half' : 'Combined 4-Digit Envelope Code'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder={isPartnerDropped ? 'e.g. 72' : 'e.g. 7283'}
                  className="w-full bg-white border border-[#C4BCAE] rounded-xl p-3 text-base font-mono text-center tracking-widest text-[#1C1B19] font-bold focus:outline-none focus:border-[#8B1A1A]"
                  required
                  id="input-fragment-code"
                />
              </div>

              {codeError && (
                <div className="p-2.5 bg-[#FBF0EE] border border-[#8B1A1A] rounded-xl text-xs font-mono text-[#8B1A1A] text-center font-bold">
                  {codeError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingCode}
                className="w-full py-3 bg-[#8B1A1A] hover:bg-[#A82020] disabled:bg-[#D5CFBE] text-white font-mono text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow font-bold active:scale-95"
                id="btn-submit-code-fragment"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmittingCode ? 'Verifying...' : 'Break Wax Seal'}</span>
              </button>
            </form>
          )}
        </section>

        {/* SECTION 6: ACTIVE PHASE ACTIONS (DEDUCTIONS, VOTES, SPECIAL TOKENS) */}
        {/* Voting Ballot */}
        {currentPhase === 'VOTE' && (
          <section className="bg-[#FAF8F5] rounded-2xl p-5 border-2 border-[#8B1A1A] shadow-lg space-y-4">
            <div className="border-b border-[#D5CFBE] pb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B1A1A] font-bold block">
                  BINDING INDICTMENT BALLOT
                </span>
                <h3 className="text-base font-serif font-bold text-[#1C1B19]">
                  Cast Your Vote: Who Killed Dean Rathod?
                </h3>
              </div>
              <div className="rubber-stamp-red text-[8px]">BALLOT BOX</div>
            </div>

            {myVote ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-mono text-emerald-900 font-bold">
                ✓ Ballot cast for: {myVote.accused_character_name}
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedAccusedId || ''}
                  onChange={(e) => setSelectedAccusedId(Number(e.target.value))}
                  className="w-full bg-white border border-[#C4BCAE] rounded-xl p-3 text-xs text-[#1C1B19] font-mono font-bold"
                  id="select-accused-vote"
                >
                  <option value="">-- Choose suspect to indict --</option>
                  {CHARACTERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id} {c.name} ({c.title})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleCastVote}
                  className="w-full py-3.5 bg-[#8B1A1A] hover:bg-[#A82020] text-white font-mono text-xs uppercase tracking-widest rounded-xl shadow font-bold active:scale-95"
                  id="btn-cast-vote"
                >
                  Cast Binding Indictment
                </button>
              </div>
            )}
          </section>
        )}

        {/* Deduction Sheet */}
        {currentPhase === 'DEDUCTION' && (
          <section className="bg-[#FAF8F5] rounded-2xl p-5 border-2 border-[#2E4A6B] shadow-lg space-y-4">
            <div className="border-b border-[#D5CFBE] pb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B1A1A] font-bold block">
                  OFFICIAL DEDUCTION SHEET
                </span>
                <h3 className="text-base font-serif font-bold text-[#1C1B19]">
                  Case Theory & Motive Audit
                </h3>
              </div>
              <div className="rubber-stamp-blue text-[8px]">OFFICIAL DOCKET</div>
            </div>

            {myDeduction ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-mono text-emerald-900 font-bold">
                ✓ Deduction Sheet lodged with Government Archive.
              </div>
            ) : (
              <form onSubmit={handleDeductionSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#2E4A6B] font-bold mb-1">
                    Q1: Who is the true murderer? (5 pts)
                  </label>
                  <select
                    value={q1Killer}
                    onChange={(e) => setQ1Killer(e.target.value)}
                    className="w-full bg-white border border-[#C4BCAE] rounded-xl p-2.5 text-xs text-[#1C1B19] font-mono font-bold"
                    required
                    id="select-deduction-killer"
                  >
                    <option value="">-- Select Murderer --</option>
                    {CHARACTERS.map((c) => (
                      <option key={c.id} value={c.name}>
                        #{c.id} {c.name} ({c.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#2E4A6B] font-bold mb-1">
                    Q2: Poison source & weapon? (3 pts)
                  </label>
                  <input
                    type="text"
                    value={q2Source}
                    onChange={(e) => setQ2Source(e.target.value)}
                    placeholder="e.g. Potassium chloride vial from OT-3"
                    className="w-full bg-white border border-[#C4BCAE] rounded-xl p-2.5 text-xs text-[#1C1B19]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#2E4A6B] font-bold mb-1">
                    Q3: Killer's exact motive? (3 pts)
                  </label>
                  <input
                    type="text"
                    value={q3Motive}
                    onChange={(e) => setQ3Motive(e.target.value)}
                    placeholder="e.g. Dean threatened to report Vivek's forged marksheet to MCI"
                    className="w-full bg-white border border-[#C4BCAE] rounded-xl p-2.5 text-xs text-[#1C1B19]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#2E4A6B] font-bold mb-1">
                    Q4: Name up to 3 uncovered secrets (1 pt each)
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={q4Secrets[0]}
                      onChange={(e) => setQ4Secrets([e.target.value, q4Secrets[1], q4Secrets[2]])}
                      placeholder="Secret 1: e.g. Meera divorce filing"
                      className="w-full bg-white border border-[#C4BCAE] rounded-xl p-2 text-xs text-[#1C1B19]"
                    />
                    <input
                      type="text"
                      value={q4Secrets[1]}
                      onChange={(e) => setQ4Secrets([q4Secrets[0], e.target.value, q4Secrets[2]])}
                      placeholder="Secret 2: e.g. Deshmukh & Iyer quota split"
                      className="w-full bg-white border border-[#C4BCAE] rounded-xl p-2 text-xs text-[#1C1B19]"
                    />
                    <input
                      type="text"
                      value={q4Secrets[2]}
                      onChange={(e) => setQ4Secrets([q4Secrets[0], q4Secrets[1], e.target.value])}
                      placeholder="Secret 3: e.g. Dr. Sheikh drug diversion"
                      className="w-full bg-white border border-[#C4BCAE] rounded-xl p-2 text-xs text-[#1C1B19]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#2E4A6B] font-bold mb-1">
                    Q5: Which key envelope sealed the case? (2 pts)
                  </label>
                  <select
                    value={q5Envelope}
                    onChange={(e) => setQ5Envelope(e.target.value)}
                    className="w-full bg-white border border-[#C4BCAE] rounded-xl p-2.5 text-xs text-[#1C1B19] font-mono font-bold"
                    required
                  >
                    <option value="">-- Choose Envelope Letter --</option>
                    {letters.map((ltr) => (
                      <option key={ltr} value={ltr}>
                        Envelope {ltr} - {ENVELOPES[ltr]?.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2E4A6B] hover:bg-[#1E334D] text-white font-mono text-xs uppercase tracking-widest rounded-xl shadow font-bold active:scale-95"
                  id="btn-submit-deduction"
                >
                  Lodge Case Deduction
                </button>
              </form>
            )}
          </section>
        )}

        {/* Priya Menon Compel Token */}
        {character.has_compel_token && (
          <section className="bg-[#FFF9E6] rounded-2xl p-5 border-2 border-[#C4AD75] shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B1A1A] font-bold">
                DR. PRIYA MENON • SWORN TRUTH TOKEN
              </span>
              <span className="px-2 py-0.5 bg-[#E8D5A3] border border-[#C4AD75] rounded text-[9px] font-mono text-[#241F14] font-bold">
                {hasUsedCompel ? 'EXERCISED' : '1 TOKEN AVAILABLE'}
              </span>
            </div>
            <p className="text-xs text-[#5E4E1C] font-mono">
              Demand a sworn truth from any suspect. They cannot dismiss their screen until answering.
            </p>

            {!hasUsedCompel ? (
              <button
                onClick={() => setShowCompelInitiator(true)}
                className="w-full py-3 bg-[#2E4A6B] hover:bg-[#1E334D] text-white font-mono text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow font-bold active:scale-95"
                id="btn-invoke-compel-token"
              >
                <Zap className="w-4 h-4" />
                <span>Invoke Sworn Truth Compel</span>
              </button>
            ) : (
              <p className="text-xs font-mono text-[#4A4844] italic text-center">
                You have exercised your one-time sworn truth token.
              </p>
            )}
          </section>
        )}

        {/* Dr. Nair 5-Word Wire Dispatch */}
        {isNairAttacked && (
          <section className="bg-[#FAF1F0] rounded-2xl p-5 border-2 border-[#8B1A1A] shadow-md space-y-3">
            <div className="flex items-center gap-2 text-[#8B1A1A] font-mono text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>EMERGENCY DISPATCH • EXACTLY FIVE WORDS</span>
            </div>
            <p className="text-xs text-[#5C1010] font-mono">
              You may not speak aloud. Wire up to 5 words to the TV board.
            </p>

            <form onSubmit={handleSendNairWords} className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={nairInput}
                  onChange={(e) => setNairInput(e.target.value)}
                  placeholder="e.g. check registrar safari suit bin"
                  className="w-full bg-white border border-[#8B1A1A] rounded-xl p-3 text-xs font-mono text-[#1C1B19] focus:outline-none"
                />
                <span
                  className={`absolute right-3 top-3 text-[10px] font-mono ${
                    nairWordsCount > 5 ? 'text-[#8B1A1A] font-bold' : 'text-[#4A4844]'
                  }`}
                >
                  {nairWordsCount} / 5 Words
                </span>
              </div>

              <button
                type="submit"
                disabled={nairSending || nairWordsCount === 0 || nairWordsCount > 5}
                className="w-full py-2.5 bg-[#8B1A1A] hover:bg-[#A82020] disabled:bg-[#D5CFBE] text-white font-mono text-xs uppercase tracking-widest rounded-xl font-bold"
              >
                Wire Dispatch
              </button>
            </form>
          </section>
        )}

        {/* SECTION 7: PERSONAL SCRATCHPAD & CLUE INSPECTION */}
        <section className="bg-white rounded-2xl p-5 border-2 border-[#D5CFBE] shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-[#D5CFBE] pb-2">
            <span className="text-xs font-mono uppercase text-[#2E4A6B] font-bold flex items-center gap-1.5">
              <NotebookPen className="w-4 h-4 text-[#8B1A1A]" />
              <span>Personal Scratchpad (Auto-saved)</span>
            </span>
            <button
              onClick={() => setIsBoardOpen(true)}
              className="px-2.5 py-1 bg-[#2E4A6B]/10 hover:bg-[#2E4A6B]/20 text-[#2E4A6B] border border-[#2E4A6B]/30 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1"
            >
              <Grid className="w-3 h-3" />
              <span>Open Clue Board</span>
            </button>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot down notes, codes, alibis, and suspects here..."
            className="w-full h-24 p-3 bg-[#FAF8F5] border border-[#D5CFBE] rounded-xl text-xs font-mono text-[#1C1B19] focus:outline-none focus:border-[#2E4A6B] resize-none"
            id="textarea-player-notes"
          />
        </section>
      </main>

      {/* ================= CLUE BOARD MODAL ================= */}
      {isBoardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] border-2 border-[#D5CFBE] rounded-3xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D5CFBE] pb-2">
              <h3 className="text-sm font-mono font-bold text-[#1C1B19] flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#8B1A1A]" />
                <span>Forensic Exhibits (Exhibits A – J)</span>
              </h3>
              <button
                onClick={() => setIsBoardOpen(false)}
                className="px-3 py-1 bg-[#8B1A1A] text-white rounded-lg text-xs font-mono font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {letters.map((ltr) => {
                const env = ENVELOPES[ltr];
                const state = envelopeStates.find((e) => e.letter === ltr);
                const isPub = state?.published;
                const isUnl = state?.unlocked;

                return (
                  <div
                    key={ltr}
                    onClick={() => setInspectEnvelopeLetter(ltr)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isPub
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : isUnl
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-stone-100 border-stone-300 text-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs">EXHIBIT {ltr}</span>
                      <span className="text-[9px] font-mono font-bold uppercase">
                        {isPub ? 'PUBLIC' : isUnl ? 'SEALED' : 'LOCKED'}
                      </span>
                    </div>
                    <div className="text-[11px] font-serif font-bold line-clamp-1">
                      {isPub ? env?.title : isUnl ? 'Sealed in Custody' : 'Archival Slip'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Emergency & Overlay Modals */}
      {room.secondAttackTriggered && !hasDismissedAttack && (
        <SecondAttackModal onDismiss={() => setHasDismissedAttack(true)} />
      )}

      {incomingCompel && (
        <CompelResponderModal compel={incomingCompel} roomCode={room.roomCode} />
      )}

      {showCompelInitiator && (
        <CompelInitiatorModal
          roomCode={room.roomCode}
          myUid={player.uid}
          myCharName={character.name}
          players={players}
          onClose={() => setShowCompelInitiator(false)}
        />
      )}

      {selectedEnvelopeData && (
        <EnvelopeModal
          envelope={selectedEnvelopeData}
          state={selectedEnvelopeState}
          roomCode={room.roomCode}
          myPlayerName={player.name}
          isPartnerOrHost={
            selectedEnvelopeData.char_id_1 === character.id ||
            selectedEnvelopeData.char_id_2 === character.id
          }
          onClose={() => setInspectEnvelopeLetter(null)}
        />
      )}

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
