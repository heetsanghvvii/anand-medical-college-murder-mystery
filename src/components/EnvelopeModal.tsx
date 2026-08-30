import React, { useState, useEffect } from 'react';
import { EnvelopeData, EnvelopeStateData, SlipData } from '../types';
import { publishEnvelope, publishTierSlip } from '../lib/firestoreService';
import { fetchEnvelopeReveal, DecryptedEnvelopeResponse } from '../lib/apiService';
import { sound } from '../lib/audio';
import { FileText, Lock, Globe, X, ShieldAlert, CheckCircle2, Layers, AlertCircle, Loader2 } from 'lucide-react';

interface EnvelopeModalProps {
  envelope: EnvelopeData;
  state: EnvelopeStateData | undefined;
  roomCode: string;
  myPlayerName: string;
  isPartnerOrHost: boolean;
  onClose: () => void;
  currentPhase?: string;
}

export const EnvelopeModal: React.FC<EnvelopeModalProps> = ({
  envelope,
  state,
  roomCode,
  myPlayerName,
  isPartnerOrHost,
  onClose,
  currentPhase = 'R2_FRAGMENTS',
}) => {
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'I' | 'II' | 'III'>('ALL');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [decryptedData, setDecryptedData] = useState<DecryptedEnvelopeResponse | null>(null);
  const [isLoadingReveal, setIsLoadingReveal] = useState<boolean>(false);

  const isUnlocked = state?.unlocked || false;
  const isPublished = state?.published || false;

  useEffect(() => {
    let isMounted = true;
    if (isUnlocked || isPublished || isPartnerOrHost) {
      setIsLoadingReveal(true);
      fetchEnvelopeReveal(roomCode, envelope.letter)
        .then((res) => {
          if (isMounted && res) {
            setDecryptedData(res);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingReveal(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [roomCode, envelope.letter, isUnlocked, isPublished, isPartnerOrHost]);

  const slips: SlipData[] = decryptedData?.slips || envelope.slips || [];
  const bodyText = decryptedData?.body || envelope.body || '';
  const canViewContent = decryptedData?.isDecrypted || isUnlocked || isPublished;

  const handlePublish = async (tier?: 'I' | 'II' | 'III') => {
    const tierName = tier ? `Tier ${tier}` : 'this exhibit';
    if (
      !confirm(
        `PUBLISH TO THE BOARD: This will immediately make ${tierName} visible to every suspect on the public board. Proceed?`
      )
    ) {
      return;
    }

    setIsPublishing(true);
    sound.playClick();
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      if (tier) {
        await publishTierSlip(roomCode, envelope.letter, tier, myPlayerName);
      } else {
        await publishEnvelope(roomCode, envelope.letter, myPlayerName);
      }
      sound.playClueFound();
    } catch (err) {
      console.error('Failed to publish envelope:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="dossier-card max-w-3xl w-full rounded-3xl p-5 sm:p-7 border-2 border-white/15 shadow-2xl relative max-h-[92vh] flex flex-col bg-[#171615] text-[#F7F4EF]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#8B1A1A]/20 border-2 border-[#8B1A1A]/50 flex items-center justify-center text-xl font-serif font-black text-[#E58282] shadow-inner">
              {envelope.letter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E58282] font-bold">
                  CONFIDENTIAL DOSSIER • EXHIBIT {envelope.letter}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  3 ROUNDS OF SLIPS
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
                {envelope.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            id="btn-close-envelope-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="mb-4">
          {isPublished ? (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-300 font-mono">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PUBLISHED ON CENTRAL EVIDENCE BOARD by {state?.published_by || 'Suspect'}</span>
              </div>
              <span className="text-[10px] bg-emerald-900/80 px-2 py-0.5 rounded font-bold">LIVE ON TV</span>
            </div>
          ) : isUnlocked ? (
            <div className="p-3 bg-[#8B1A1A]/20 border border-[#8B1A1A]/50 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-200 font-mono">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#E58282] shrink-0" />
                <span>UNSEALED IN CONFIDENTIAL CUSTODY (Pair #{envelope.char_id_1} & #{envelope.char_id_2})</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">SEALED</span>
            </div>
          ) : (
            <div className="p-3 bg-black/50 border border-white/10 rounded-xl flex items-center gap-2 text-xs text-white/40 font-mono">
              <Lock className="w-4 h-4 text-white/40 shrink-0" />
              <span>SEALED ARCHIVE. Requires matching 4-digit code in Round 2.</span>
            </div>
          )}
        </div>

        {/* Tier Selector Pills */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Slips:
          </span>
          <button
            onClick={() => {
              sound.playClick();
              setSelectedTier('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              selectedTier === 'ALL'
                ? 'bg-white/20 border-white/40 text-white font-bold'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            All 3 Slips
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setSelectedTier('I');
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              selectedTier === 'I'
                ? 'bg-amber-100 text-[#1C1B19] border-amber-300 font-bold'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white inline-block border border-black/20" />
            <span>Tier I (R2/R3 White)</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setSelectedTier('II');
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              selectedTier === 'II'
                ? 'bg-amber-300 text-[#1C1B19] border-amber-400 font-bold'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-300 inline-block border border-black/20" />
            <span>Tier II (R4 Pale Yellow)</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setSelectedTier('III');
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              selectedTier === 'III'
                ? 'bg-red-700 text-white border-red-500 font-bold'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block border border-white/40" />
            <span>Tier III (R5 Red)</span>
          </button>
        </div>

        {/* Document Content Scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {isUnlocked || isPublished ? (
            <>
              {/* Render Multi-Tier Slips */}
              {slips
                .filter((s) => selectedTier === 'ALL' || s.tier === selectedTier)
                .map((slip, idx) => {
                  const isTier1 = slip.tier === 'I';
                  const isTier2 = slip.tier === 'II';
                  const isTier3 = slip.tier === 'III';

                  const slipBg = isTier1
                    ? 'bg-[#FAF8F5] text-[#1C1B19] border-[#D5CFBE]'
                    : isTier2
                    ? 'bg-[#FEF9E7] text-[#1C1B19] border-[#F2D786]'
                    : 'bg-[#3A1414] text-[#F7F4EF] border-[#8B1A1A]';

                  const badgeBg = isTier1
                    ? 'bg-zinc-200 text-zinc-800'
                    : isTier2
                    ? 'bg-amber-200 text-amber-900 font-bold'
                    : 'bg-red-600 text-white font-bold';

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border-2 shadow-md space-y-3 relative overflow-hidden transition-all ${slipBg}`}
                    >
                      {/* Slip Header */}
                      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${badgeBg}`}>
                            TIER {slip.tier} • ROUND {slip.round} SLIP ({slip.paper.toUpperCase()} PAPER)
                          </span>
                          {slip.read_by && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/20 text-white/80">
                              Read by {slip.read_by}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold opacity-60 uppercase">
                          Exhibit {envelope.letter} / Slip {idx + 1}
                        </span>
                      </div>

                      {/* Slip Title */}
                      <h3 className="font-serif font-bold text-base sm:text-lg leading-snug">
                        {slip.title}
                      </h3>

                      {/* Slip Body Content */}
                      <div className="text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed p-3.5 bg-black/5 dark:bg-black/40 rounded-xl border border-black/5 dark:border-white/5">
                        {slip.text}
                      </div>

                      {/* Board Summary & Forensic Elimination */}
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-t border-black/10 dark:border-white/10">
                        <div className="flex items-center gap-1.5 opacity-80">
                          <strong>Public Wire Summary:</strong> <span>"{slip.board_summary}"</span>
                        </div>
                        {slip.narrows_to && slip.narrows_to.length > 0 && (
                          <div className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                            Narrows to Suspects: #{slip.narrows_to.join(', #')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

              {isLoadingReveal && slips.length === 0 && !bodyText && (
                <div className="py-8 flex items-center justify-center gap-2 text-xs font-mono text-amber-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Decrypting institutional case files from secure server...</span>
                </div>
              )}
              {/* Full Original Transcript Archive */}
              {bodyText && (
                <div className="p-5 bg-[#121111] border border-white/10 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest border-b border-white/10 pb-1.5">
                    <span>FULL INSTITUTIONAL TRANSCRIPT ARCHIVE</span>
                    <span>CONFIDENTIAL</span>
                  </div>
                  <pre className="text-xs sm:text-sm font-mono text-[#F2ECEA] whitespace-pre-wrap leading-relaxed">
                    {bodyText}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                <Lock className="w-7 h-7" />
              </div>
              <p className="text-base font-serif text-white/80 font-bold">
                Exhibit {envelope.letter} Is Sealed Under Archival Wax
              </p>
              <p className="text-xs font-mono text-white/50 max-w-md leading-relaxed">
                Contains 3 sequential rounds of forensic slips: Tier I (Round 2/3), Tier II (Round 4 Interrogation), and Tier III (Round 5 Hunt). Locate your partner to unlock!
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono uppercase tracking-wider rounded-xl transition-colors"
          >
            Close Dossier
          </button>

          {isUnlocked && !isPublished && isPartnerOrHost && (
            <button
              onClick={() => handlePublish()}
              disabled={isPublishing}
              className="px-6 py-2.5 bg-[#8B1A1A] hover:bg-[#A82020] text-white text-xs font-mono uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95 font-bold"
              id="btn-publish-envelope-to-board"
            >
              <Globe className="w-4 h-4" />
              <span>{isPublishing ? 'Publishing...' : 'Publish Exhibit to Board'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

