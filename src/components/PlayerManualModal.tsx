import React, { useState } from 'react';
import { PLAYER_MANUAL } from '../data/game';
import { BookOpen, X, Shield, Lock, Unlock, Users, AlertTriangle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { sound } from '../lib/audio';

interface PlayerManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerManualModal: React.FC<PlayerManualModalProps> = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState<'en' | 'gu' | 'both'>('both');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#171615] border-2 border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#F7F4EF]"
        id="modal-player-manual"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-[#21201D] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8B1A1A]/30 border border-[#8B1A1A] rounded-2xl text-[#E58282]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E58282] font-bold">
                  OFFICIAL INVESTIGATION MANUAL
                </span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono">
                  BILINGUAL GUIDE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                How to Play • રમત કેવી રીતે રમવી
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switch */}
            <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/15 text-xs font-mono">
              <button
                onClick={() => {
                  sound.playClick();
                  setLang('both');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'both' ? 'bg-[#8B1A1A] text-white font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setLang('en');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'en' ? 'bg-[#8B1A1A] text-white font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setLang('gu');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'gu' ? 'bg-[#8B1A1A] text-white font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                ગુજરાતી
              </button>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              id="btn-close-player-manual"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-8 font-sans">
          {/* THE STORY */}
          <section className="p-5 rounded-2xl bg-[#21201D] border border-white/10 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#E58282] font-bold flex items-center gap-2">
              <span>THE PREMISE & STORY • વાર્તા</span>
            </h3>
            {(lang === 'en' || lang === 'both') && (
              <p className="text-sm sm:text-base text-[#E6E1DA] font-serif leading-relaxed">
                Anand Medical College, Mumbai. Results night. At 11:40 PM a first-year student walks into the Anatomy Hall and finds the Dean dead on a dissection table. Poisoned by injection. The door was locked from the outside.
                <br /><br />
                Twenty people were in that building: 9 faculty batchmates from the Class of 1994, and 11 students/interns (their children). Every one of them had a reason to want him gone. <strong>One of you killed him.</strong>
              </p>
            )}
            {(lang === 'gu' || lang === 'both') && (
              <p className="text-sm sm:text-base text-amber-200/90 font-serif leading-relaxed border-t border-white/10 pt-2">
                Anand Medical College ના Dean રાત્રે 11:40 વાગ્યે Anatomy Hall માં મરેલા મળ્યા. ઝેરનું injection. બારણું બહારથી બંધ. એ રાત્રે તમે વીસ જણ એ building માં હતા. <strong>તમારામાંથી એક જણે એમને માર્યા છે.</strong>
              </p>
            )}
          </section>

          {/* TWO GOLDEN RULES */}
          <section className="p-6 rounded-2xl bg-[#8B1A1A]/15 border-2 border-[#8B1A1A]/50 space-y-5">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#E58282] font-bold">
                THE CORE MECHANIC • મુખ્ય નિયમો
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Two Rules. That Is All.
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-red-500/30 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-sm uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Rule 1: Lie About Your Secret</span>
                </div>
                {(lang === 'en' || lang === 'both') && (
                  <p className="text-xs sm:text-sm text-white/80">
                    Freely! Deny it, deflect, blame someone else, or invent an alibi. That is the game.
                  </p>
                )}
                {(lang === 'gu' || lang === 'both') && (
                  <p className="text-xs sm:text-sm text-amber-200/90 border-t border-white/10 pt-1">
                    નિયમ 1: તમારા secret પર ખુલ્લેઆમ જૂઠું બોલો, બહાના બનાવો.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Rule 2: Never Lie About What You Saw</span>
                </div>
                {(lang === 'en' || lang === 'both') && (
                  <p className="text-xs sm:text-sm text-white/80">
                    If someone asks you directly, you MUST tell the truth. You may stall, trade it, or stay quiet—but you cannot invent false facts.
                  </p>
                )}
                {(lang === 'gu' || lang === 'both') && (
                  <p className="text-xs sm:text-sm text-amber-200/90 border-t border-white/10 pt-1">
                    નિયમ 2: તમે જે જોયું એના પર ક્યારેય જૂઠું નહીં. ટાળી શકો, બદલામાં કંઈક માંગી શકો, પણ ખોટી વાત બનાવી ના શકો.
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-black/60 rounded-xl text-center border border-white/10">
              <span className="text-sm sm:text-base font-serif font-bold text-amber-300 block">
                &ldquo;Lie about yourself. Tell the truth about what you saw.&rdquo;
              </span>
              <span className="text-xs sm:text-sm font-serif text-amber-200/80 block mt-0.5">
                &ldquo;પોતાના વિશે જૂઠું. જોયેલી વાત પર સાચું.&rdquo;
              </span>
            </div>
          </section>

          {/* YOUR CARD HAS THREE THINGS */}
          <section className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 font-bold">
              YOUR CARD HAS THREE THINGS • તમારા કાર્ડમાં ત્રણ વસ્તુઓ છે
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#21201D] border border-white/10 space-y-2">
                <span className="w-6 h-6 rounded-full bg-[#8B1A1A] text-white font-mono text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <h4 className="text-sm font-bold text-white">Who You Are</h4>
                <p className="text-xs text-white/70">
                  Your name and job. There is an introduction line written on your card. In Round 1 you read it out loud. Nothing to invent!
                </p>
                <p className="text-[11px] text-amber-200/80 border-t border-white/10 pt-1">
                  તમે કોણ છો (Round 1 માં મોટેથી વાંચવાની લાઈન).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#21201D] border border-white/10 space-y-2">
                <span className="w-6 h-6 rounded-full bg-[#8B1A1A] text-white font-mono text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <h4 className="text-sm font-bold text-white">Your Secret</h4>
                <p className="text-xs text-white/70">
                  You are hiding something. It is almost never murder, but it looks terrible. Lie about this!
                </p>
                <p className="text-[11px] text-amber-200/80 border-t border-white/10 pt-1">
                  તમારું છુપાવેલું (ખૂન નથી, પણ શંકાસ્પદ લાગે છે).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#21201D] border border-white/10 space-y-2">
                <span className="w-6 h-6 rounded-full bg-[#8B1A1A] text-white font-mono text-xs flex items-center justify-center font-bold">
                  3
                </span>
                <h4 className="text-sm font-bold text-white">What You Saw</h4>
                <p className="text-xs text-white/70">
                  One verified fact from results night. You cannot lie about this when asked directly.
                </p>
                <p className="text-[11px] text-amber-200/80 border-t border-white/10 pt-1">
                  તમે શું જોયું (સાચી હકીકત, જૂઠું નહીં બોલવાનું).
                </p>
              </div>
            </div>
          </section>

          {/* FINDING YOUR PARTNER (ROUND 2) */}
          <section className="p-5 rounded-2xl bg-[#21201D] border border-white/10 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-sky-400 font-bold flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>ROUND 2: FINDING YOUR PARTNER • પાર્ટનર શોધવો</span>
            </h3>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              At the bottom of your card is a <strong>riddle</strong> describing exactly one other person in this room, plus <strong>half of a 4-digit code</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs space-y-1">
                <span className="font-bold text-white">1. Work out the riddle</span>
                <p className="text-white/60">Identify which character the riddle describes (check the TV Family Tree!).</p>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs space-y-1">
                <span className="font-bold text-white">2. Approach them quietly</span>
                <p className="text-white/60">Say your riddle one-on-one. <strong>Do NOT shout across the room</strong> or you lose your vote!</p>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs space-y-1">
                <span className="font-bold text-white">3. Combine your two halves</span>
                <p className="text-white/60">Join your two 2-digit numbers in the specified order to form a 4-digit code.</p>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs space-y-1">
                <span className="font-bold text-white">4. Break the Wax Seal</span>
                <p className="text-white/60">Enter the 4 digits into your phone to unseal your confidential evidence exhibit.</p>
              </div>
            </div>
          </section>

          {/* PUBLISH VS SEAL */}
          <section className="p-5 rounded-2xl bg-[#21201D] border border-white/10 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
              THE DECISION: PUBLISH OR SEAL? • પુરાવો બતાવવો કે છુપાવવો?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm">
                  <Unlock className="w-4 h-4" />
                  <span>PUBLISH · બતાવો</span>
                </div>
                <p className="text-xs text-white/80">
                  Read it aloud to the room. It goes on the live public TV board for all to see. It cannot be undone.
                </p>
                <p className="text-[11px] text-amber-200/80 border-t border-white/10 pt-1">
                  બધાની સામે મોટેથી વાંચો. TV Board પર લખાશે.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-sm">
                  <Lock className="w-4 h-4" />
                  <span>SEAL · છુપાવો</span>
                </div>
                <p className="text-xs text-white/80">
                  Keep it private. The TV board will show <strong>SEALED</strong> and <strong>both of your names</strong>. Everyone will know you are hiding something!
                </p>
                <p className="text-[11px] text-amber-200/80 border-t border-white/10 pt-1">
                  છુપાવવાથી પુરાવો છુપાય છે, પણ તમે છુપાવો છો એ નથી છુપાતું.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-950/40 rounded-xl border border-red-500/30 text-xs text-red-200 leading-relaxed">
              <strong>⚠️ The Danger:</strong> Publishing needs only <strong>ONE</strong> of you. Your partner can betray you at any moment without warning. Make a deal! Deals made out loud in front of the Host are binding.
            </div>
          </section>

          {/* FIVE SHORT RULES */}
          <section className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#E58282] font-bold">
              FIVE SUMMARY RULES • 5 ટૂંકા નિયમો
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-white/85 font-mono">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#8B1A1A] shrink-0" />
                <span>1. Lie about yourself. Tell the truth about what you saw.</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#8B1A1A] shrink-0" />
                <span>2. Deals made aloud in front of the Host are binding.</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#8B1A1A] shrink-0" />
                <span>3. Do not shout your riddle across the room (costs you your vote).</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#8B1A1A] shrink-0" />
                <span>4. Never read anyone else's card or phone screen.</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#8B1A1A] shrink-0" />
                <span>5. If you are the killer, you may lie about EVERYTHING.</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#21201D] flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-[#8B1A1A] hover:bg-[#A82020] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-all active:scale-95 shadow"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
