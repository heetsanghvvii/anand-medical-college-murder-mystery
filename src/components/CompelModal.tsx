import React, { useState } from 'react';
import { CompelUseData } from '../types';
import { answerCompel, issueCompel } from '../lib/firestoreService';
import { sound } from '../lib/audio';
import { Zap, AlertTriangle, ShieldCheck, Send, Lock } from 'lucide-react';

interface CompelResponderModalProps {
  compel: CompelUseData;
  roomCode: string;
}

export const CompelResponderModal: React.FC<CompelResponderModalProps> = ({ compel, roomCode }) => {
  const [answerInput, setAnswerInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) {
      setError('You must provide a truthful answer to proceed.');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();
    try {
      await answerCompel(roomCode, compel.compelId, answerInput.trim());
      sound.playClueFound();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0E0E]/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="dossier-card max-w-lg w-full rounded-2xl p-6 sm:p-8 border-2 border-[#8B1A1A] shadow-[0_0_50px_rgba(139,26,26,0.5)] relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#8B1A1A] text-white rounded-lg animate-pulse">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8B1A1A] font-bold block">
              SWORN COMPEL PROTOCOL INVOKED
            </span>
            <h2 className="text-xl font-serif text-[#F2ECEA]">
              Compulsory Truth Demand
            </h2>
          </div>
        </div>

        <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-[#F2ECEA]/80 mb-5 space-y-1">
          <p className="font-semibold text-red-300">
            {compel.from_character} has targeted you with the one-time Truth Token.
          </p>
          <p className="text-[11px] text-white/50">
            Under room protocol, you are required to answer this inquiry truthfully. Your answer will be delivered exclusively and privately to {compel.from_character}.
          </p>
        </div>

        <div className="p-4 bg-black/60 border border-white/10 rounded-xl mb-5">
          <span className="text-[10px] font-mono uppercase text-white/40 block mb-1">
            Question Asked:
          </span>
          <p className="text-sm font-serif text-white italic">
            "{compel.question}"
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitAnswer} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
              Your Sworn Answer
            </label>
            <textarea
              rows={4}
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="State the exact truth..."
              className="w-full bg-black/70 border border-white/20 rounded-xl p-3 text-sm text-[#F2ECEA] focus:outline-none focus:border-[#8B1A1A] transition-colors"
              required
              id="input-compel-response"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#8B1A1A] hover:bg-[#A82020] disabled:bg-white/10 text-white font-mono text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            id="btn-submit-compel-answer"
          >
            {isSubmitting ? (
              <span>Transmitting Confidential Sworn Answer...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Sworn Statement</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

interface CompelInitiatorModalProps {
  roomCode: string;
  myUid: string;
  myCharName: string;
  players: { uid: string; characterName: string; name: string }[];
  onClose: () => void;
}

export const CompelInitiatorModal: React.FC<CompelInitiatorModalProps> = ({
  roomCode,
  myUid,
  myCharName,
  players,
  onClose,
}) => {
  const [targetUid, setTargetUid] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const otherPlayers = players.filter((p) => p.uid !== myUid && !p.characterName.includes('Host'));

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUid) {
      setError('Please select a suspect to compel.');
      return;
    }
    if (!question.trim()) {
      setError('Please type your question.');
      return;
    }

    const target = players.find((p) => p.uid === targetUid);
    if (!target) return;

    setIsSubmitting(true);
    sound.playClick();

    try {
      await issueCompel(
        roomCode,
        myUid,
        myCharName,
        target.uid,
        target.characterName,
        question.trim()
      );
      sound.playCompelAlert();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to invoke compel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="dossier-card max-w-lg w-full rounded-2xl p-6 sm:p-8 border border-[#8B1A1A]/50 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-[#8B1A1A]" />
            <h2 className="text-xl font-serif text-[#F2ECEA]">
              Invoke Priya Menon's Compel Token
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1"
            id="btn-close-compel-initiator"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-white/60 mb-5 font-mono">
          You have <strong className="text-amber-400">ONE single compel token</strong> for the entire game. The chosen suspect will be locked into a blocking modal and compelled to answer truthfully.
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
              Select Suspect to Compel
            </label>
            <select
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              className="w-full bg-black/70 border border-white/20 rounded-xl p-3 text-sm text-[#F2ECEA] focus:outline-none focus:border-[#8B1A1A]"
              required
              id="select-compel-target"
            >
              <option value="">-- Choose a suspect --</option>
              {otherPlayers.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.characterName} ({p.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
              Your Compulsory Question
            </label>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What were you doing in OT-3 between 6:15 PM and 6:40 PM?"
              className="w-full bg-black/70 border border-white/20 rounded-xl p-3 text-sm text-[#F2ECEA] focus:outline-none focus:border-[#8B1A1A]"
              required
              id="input-compel-question"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/70 font-mono text-xs uppercase tracking-wider rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#8B1A1A] hover:bg-[#A82020] text-white font-mono text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2"
              id="btn-issue-compel-submit"
            >
              <Zap className="w-4 h-4" />
              <span>Issue Compel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
