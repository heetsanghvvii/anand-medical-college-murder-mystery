import React, { useState } from 'react';
import { EnvelopeData, EnvelopeStateData } from '../types';
import { publishEnvelope } from '../lib/firestoreService';
import { sound } from '../lib/audio';
import { FileText, Lock, Globe, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EnvelopeModalProps {
  envelope: EnvelopeData;
  state: EnvelopeStateData | undefined;
  roomCode: string;
  myPlayerName: string;
  isPartnerOrHost: boolean;
  onClose: () => void;
}

export const EnvelopeModal: React.FC<EnvelopeModalProps> = ({
  envelope,
  state,
  roomCode,
  myPlayerName,
  isPartnerOrHost,
  onClose,
}) => {
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const isUnlocked = state?.unlocked || false;
  const isPublished = state?.published || false;

  const handlePublish = async () => {
    if (!confirm('PUBLISH TO THE BOARD: This will immediately make this document visible to every suspect in the room. This action cannot be undone. Proceed?')) {
      return;
    }

    setIsPublishing(true);
    sound.playClick();
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      await publishEnvelope(roomCode, envelope.letter, myPlayerName);
      sound.playClueFound();
    } catch (err) {
      console.error('Failed to publish envelope:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="dossier-card max-w-2xl w-full rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#8B1A1A]/20 border border-[#8B1A1A]/40 flex items-center justify-center text-lg font-serif font-bold text-[#8B1A1A]">
              {envelope.letter}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B1A1A] block font-semibold">
                CONFIDENTIAL EVIDENCE FILE • ENVELOPE {envelope.letter}
              </span>
              <h2 className="text-base sm:text-lg font-serif text-[#F2ECEA]">
                {envelope.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            id="btn-close-envelope-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="mb-4">
          {isPublished ? (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-lg flex items-center gap-2 text-xs text-emerald-300 font-mono">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PUBLISHED ON PUBLIC EVIDENCE BOARD by {state?.published_by || 'Suspect'}</span>
            </div>
          ) : isUnlocked ? (
            <div className="p-2.5 bg-[#8B1A1A]/20 border border-[#8B1A1A]/50 rounded-lg flex items-center gap-2 text-xs text-amber-200 font-mono">
              <ShieldAlert className="w-4 h-4 text-[#8B1A1A] shrink-0" />
              <span>UNSEALED IN CONFIDENTIAL CUSTODY. Only holders can view this until published.</span>
            </div>
          ) : (
            <div className="p-2.5 bg-black/40 border border-white/10 rounded-lg flex items-center gap-2 text-xs text-white/40 font-mono">
              <Lock className="w-4 h-4 text-white/40 shrink-0" />
              <span>SEALED WITH WAX. Both matching code halves required.</span>
            </div>
          )}
        </div>

        {/* Document Content Scroll */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {isUnlocked || isPublished ? (
            <>
              <div className="p-4 bg-black/60 border border-white/10 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
                  Summary Findings:
                </span>
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  {envelope.summary}
                </p>
              </div>

              <div className="p-5 bg-[#121111] border border-white/10 rounded-xl relative">
                <div className="absolute top-2 right-3 text-[9px] font-mono text-white/20 uppercase tracking-widest">
                  DOCUMENT TRANSCRIPT
                </div>
                <pre className="text-xs sm:text-sm font-mono text-[#F2ECEA] whitespace-pre-wrap leading-relaxed">
                  {envelope.body}
                </pre>
              </div>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-sm font-serif text-white/60">
                This evidence envelope is sealed.
              </p>
              <p className="text-xs font-mono text-white/40 max-w-sm">
                Locate your matching cryptic fragment partner and submit the aligned 4-digit code in the Fragment tab to unseal this dossier.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors"
          >
            Close Dossier
          </button>

          {isUnlocked && !isPublished && isPartnerOrHost && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-5 py-2.5 bg-[#8B1A1A] hover:bg-[#A82020] text-white text-xs font-mono uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95"
              id="btn-publish-envelope-to-board"
            >
              <Globe className="w-4 h-4" />
              <span>{isPublishing ? 'Publishing...' : 'Publish to Board'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
