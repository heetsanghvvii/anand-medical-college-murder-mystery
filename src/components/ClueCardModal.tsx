import React from 'react';
import { ClueCard } from '../types';
import { sound } from '../lib/audio';
import { Volume2, X, FileText, AlertCircle } from 'lucide-react';

interface ClueCardModalProps {
  card: ClueCard | null;
  onClose: () => void;
}

export const ClueCardModal: React.FC<ClueCardModalProps> = ({ card, onClose }) => {
  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
      <div className="dossier-card max-w-3xl w-full rounded-2xl p-6 sm:p-10 border border-[#8B1A1A]/50 shadow-2xl relative">
        {/* Top Crimson Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#8B1A1A]" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8B1A1A]/20 border border-[#8B1A1A]/40 rounded-lg text-[#8B1A1A]">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#8B1A1A] block">
                HOST ANNOUNCEMENT • READ ALOUD TO THE ROOM
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#F2ECEA]">
                {card.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            id="btn-close-clue-modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-xs font-mono text-white/50 mb-6 italic">
          {card.subtitle}
        </p>

        {/* Big Type Read Aloud Section */}
        <div className="p-6 sm:p-8 bg-black/60 border border-white/10 rounded-xl mb-8 relative">
          <div className="absolute -top-3 left-6 px-3 py-0.5 bg-[#8B1A1A] text-white text-[10px] font-mono uppercase tracking-wider rounded">
            Official Case Clue
          </div>
          <p className="text-lg sm:text-2xl font-serif leading-relaxed text-[#F2ECEA] text-center italic tracking-wide">
            "{card.readAloudText}"
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-[#8B1A1A] hover:bg-[#A82020] text-white text-xs font-mono uppercase tracking-wider rounded-lg transition-all"
            id="btn-dismiss-clue-card"
          >
            Dismiss Clue Card
          </button>
        </div>
      </div>
    </div>
  );
};
