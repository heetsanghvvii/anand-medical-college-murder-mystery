import React, { useEffect, useState } from 'react';
import { sound } from '../lib/audio';
import { AlertOctagon, Skull } from 'lucide-react';

interface SecondAttackModalProps {
  onDismiss: () => void;
}

export const SecondAttackModal: React.FC<SecondAttackModalProps> = ({ onDismiss }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);

  useEffect(() => {
    sound.playCompelAlert();
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 500]);
      }
    } catch {
      // ignore
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0E0E] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      {/* Heavy Crimson Radial Flash */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 animate-pulse"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #8B1A1A 0%, transparent 80%)',
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#8B1A1A] text-white rounded-full text-xs font-mono uppercase tracking-widest animate-bounce">
          <AlertOctagon className="w-4 h-4" />
          <span>CRITICAL SECURITY EMERGENCY</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-serif text-[#F2ECEA] tracking-tight leading-snug">
          DR. PRAKASH NAIR HAS BEEN FOUND UNCONSCIOUS IN THE DRUG STORE
        </h1>

        <div className="p-6 bg-black/80 border-2 border-[#8B1A1A] rounded-2xl shadow-[0_0_40px_rgba(139,26,26,0.6)]">
          <p className="text-xs font-mono text-white/50 uppercase tracking-widest mb-2">
            Blood Note Scrawled on Floor Tile
          </p>
          <div className="text-3xl sm:text-6xl font-serif font-black text-[#8B1A1A] tracking-wider uppercase drop-shadow-md">
            ASK THE SON
          </div>
        </div>

        <p className="text-xs sm:text-sm font-mono text-white/60">
          Dr. Nair has sustained severe trauma and cannot speak aloud. His communications are restricted to 5 words per round.
        </p>

        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onDismiss();
            }}
            className="px-8 py-3 bg-[#8B1A1A] hover:bg-[#A82020] text-white text-xs font-mono uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
            id="btn-dismiss-second-attack"
          >
            Acknowledge Emergency ({secondsRemaining}s)
          </button>
        </div>
      </div>
    </div>
  );
};
