import { useState, useRef, useEffect, FormEvent } from 'react';
import { Send, Radio, Terminal, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { NairMessageData, PlayerData, GamePhase } from '../types';
import { sendNairFiveWords } from '../lib/firestoreService';
import { sound } from '../lib/audio';

interface NairWireChatProps {
  roomCode: string;
  playerUid: string;
  playerName: string;
  characterName: string;
  messages: NairMessageData[];
  players: PlayerData[];
  currentPhase?: GamePhase;
  isHost?: boolean;
}

export function NairWireChat({
  roomCode,
  playerUid,
  playerName,
  characterName,
  messages,
  players,
  currentPhase = 'LOBBY',
  isHost = false,
}: NairWireChatProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sound.playClick();
    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await sendNairFiveWords(
        roomCode,
        playerUid,
        characterName || playerName,
        textToSend,
        currentPhase
      );
    } catch (err) {
      console.error('Failed to send wire transmission:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[480px] bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl" id="nair-wire-chat">
      {/* Terminal Header */}
      <div className="px-4 py-3 bg-black/80 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-[#8B1A1A] shadow-[0_0_8px_#8B1A1A] animate-pulse" />
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white">
            <Radio className="w-3.5 h-3.5 text-[#8B1A1A]" />
            <span>Forensic Wire Feed</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-white/40 uppercase">
          Phase: {currentPhase}
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs" id="wire-messages-feed">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-2">
            <Radio className="w-7 h-7 text-white/20 animate-pulse" />
            <p className="text-center font-sans text-xs">Wire channel quiet. Transmissions will appear here.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUid === playerUid;
            const isSystem = msg.type === 'system' || msg.type === 'safari_nudge';
            const isClue = msg.type === 'clue';
            const isNair = msg.type === 'nair_words' || msg.characterName?.includes('Nair');

            return (
              <div
                key={msg.msgId}
                className={`rounded-xl p-3 border transition-all ${
                  isSystem || isClue
                    ? 'bg-[#8B1A1A]/20 border-[#8B1A1A]/50 text-amber-200 shadow-[0_0_10px_rgba(139,26,26,0.2)]'
                    : isNair
                    ? 'bg-red-950/40 border-red-500/40 text-red-200'
                    : isMe
                    ? 'bg-white/10 border-white/20 text-white ml-6'
                    : 'bg-white/5 border-white/10 text-white/80 mr-6'
                }`}
              >
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-white/5">
                  <span className="font-bold tracking-tight text-white">
                    {msg.characterName || msg.senderName}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-black/80 border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Transmit statement to the case record..."
          className="flex-1 bg-black/60 border border-white/10 text-white text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#8B1A1A] placeholder-white/30 font-sans"
          id="input-wire-message"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          id="btn-send-wire-msg"
          className="p-2.5 rounded-xl bg-[#8B1A1A] hover:bg-[#A82020] disabled:opacity-30 text-white font-bold transition-all shadow-[0_0_10px_rgba(139,26,26,0.3)]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
