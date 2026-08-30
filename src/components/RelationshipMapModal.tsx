import React, { useState } from 'react';
import {
  VICTIM_NAME,
  VICTIM_ROLE,
  LOCATION,
  TIME_OF_DEATH,
  FAMILY_TREE,
  OUTSIDERS,
  NON_DOCTORS,
  ADMINISTRATIVE_WING_EXTENSIONS,
  STUDENT_BATCHES,
  POSITIONS_OF_ACCESS,
  KNOWN_FRICTION,
  CHARACTERS,
  getActiveCharactersForCapacity,
} from '../data/game';
import { PlayerData } from '../types';
import {
  Network,
  X,
  Users,
  Building,
  GraduationCap,
  KeyRound,
  Flame,
  PhoneCall,
  ShieldAlert,
  Info,
  ChevronRight,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { sound } from '../lib/audio';

interface RelationshipMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhase?: string;
  capacity?: number;
  players?: PlayerData[];
}

export const RelationshipMapModal: React.FC<RelationshipMapModalProps> = ({
  isOpen,
  onClose,
  currentPhase = 'LOBBY',
  capacity = 20,
  players = [],
}) => {
  const [activeTab, setActiveTab] = useState<'family' | 'hierarchy' | 'batches' | 'access' | 'extensions' | 'friction'>('family');
  const [hideAbsent, setHideAbsent] = useState<boolean>(false);

  // Compute active characters based on capacity or players list
  const activeCharList = getActiveCharactersForCapacity(capacity);
  const activeCharIds = new Set<number>(
    players.length > 0 && players.some((p) => p.characterId > 0)
      ? players.map((p) => p.characterId).filter((id) => id > 0)
      : activeCharList.map((c) => c.id)
  );

  const effectiveCapacity = Math.min(20, Math.max(12, capacity));
  const droppedCount = 20 - effectiveCapacity;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#171615] border-2 border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#F7F4EF]"
        id="modal-relationship-map"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-[#21201D] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-950/60 border border-sky-500/40 rounded-2xl text-sky-400">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                  CAMPUS ARCHIVE & DOSSIER MAP
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase">
                  {effectiveCapacity} PLAYERS ACTIVE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Relationships & Campus Hierarchy • કોણ કોનું છે
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                setHideAbsent(!hideAbsent);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 ${
                hideAbsent
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
              title="Toggle absent characters visibility"
            >
              {hideAbsent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{hideAbsent ? 'Hiding Absent' : 'Show All Lore'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              id="btn-close-relationship-map"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Capacity Notification Strip */}
        <div className="px-5 py-2.5 bg-sky-950/40 border-b border-sky-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-sky-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              Active Case Scope: <strong className="text-white">{effectiveCapacity} Suspects In Play</strong>
              {droppedCount > 0 ? (
                <span className="text-sky-300/80"> ({droppedCount} characters excluded from current investigation)</span>
              ) : (
                <span className="text-emerald-400"> (Full 20-Player Campus Roster)</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> In Room
            </span>
            {droppedCount > 0 && (
              <span className="flex items-center gap-1 text-white/40">
                <span className="w-2 h-2 rounded-full bg-white/30 inline-block" /> Absent / Off-Campus
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-3 bg-black/40 border-b border-white/10 flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('family');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'family'
                ? 'bg-[#8B1A1A] text-white font-bold shadow'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Family Tree (9 Units)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('hierarchy');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'hierarchy'
                ? 'bg-[#8B1A1A] text-white font-bold shadow'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Faculty Hierarchy & Non-Doctors</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('batches');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'batches'
                ? 'bg-[#8B1A1A] text-white font-bold shadow'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Batches</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('access');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'access'
                ? 'bg-[#8B1A1A] text-white font-bold shadow'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Positions of Access</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('extensions');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'extensions'
                ? 'bg-[#8B1A1A] text-white font-bold shadow'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Admin Wing Extensions (20x)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('friction');
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'friction'
                ? 'bg-[#8B1A1A] text-white font-bold shadow'
                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Known Friction (Open Secrets)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
          {/* THE VICTIM BANNER */}
          <div className="p-4 rounded-2xl bg-[#8B1A1A]/20 border border-[#8B1A1A]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#E58282] font-bold">
                THE DECEASED • શિકાર
              </span>
              <h3 className="text-lg font-serif font-bold text-white">
                {VICTIM_NAME}
              </h3>
              <p className="text-xs text-white/70 font-mono">
                {VICTIM_ROLE} • Class of 1994 • Husband of Dr. Meera Rathod • Father of Aarav Rathod
              </p>
            </div>
            <div className="text-left sm:text-right font-mono text-xs text-white/60">
              <div>Found: {TIME_OF_DEATH}</div>
              <div className="text-amber-300/80">{LOCATION}</div>
            </div>
          </div>

          {/* TAB 1: FAMILY TREE */}
          {activeTab === 'family' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <span>9 Parents (Class of 1994) & 9 Children (Students / Interns)</span>
                  <span className="text-xs font-mono text-white/50">· નવ મા-બાપ, નવ છોકરાં</span>
                </h3>
                <p className="text-xs text-white/60 font-mono mt-1">
                  Adjusted dynamically for your {effectiveCapacity}-player investigation. Suspects present in this case are highlighted with green badges.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {FAMILY_TREE.map((item, idx) => {
                  const parentActive = activeCharIds.has(item.parentId);
                  const childActive = activeCharIds.has(item.childId);
                  const bothInactive = !parentActive && !childActive;

                  if (hideAbsent && bothInactive) return null;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 shadow ${
                        bothInactive
                          ? 'bg-[#1a1917]/70 border-white/5 opacity-50'
                          : parentActive && childActive
                          ? 'bg-[#21201D] border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-[#21201D] border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70 uppercase">
                          Family Unit #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {bothInactive ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/40">
                              ABSENT ({effectiveCapacity}P)
                            </span>
                          ) : parentActive && childActive ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                              BOTH IN ROOM
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                              1 ACTIVE / 1 ABSENT
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-amber-300 font-bold">
                            {item.parentDept}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {/* Parent */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center font-bold ${
                                parentActive
                                  ? 'bg-sky-900/60 text-sky-300 border border-sky-500/40'
                                  : 'bg-white/10 text-white/40 line-through'
                              }`}
                            >
                              P
                            </span>
                            <div>
                              <div
                                className={`text-xs font-bold ${
                                  parentActive ? 'text-white' : 'text-white/40 line-through'
                                }`}
                              >
                                {item.parentName}
                              </div>
                              <div className="text-[10px] text-white/50 font-mono">
                                Parent • #{item.parentId}
                              </div>
                            </div>
                          </div>
                          {parentActive ? (
                            <span className="text-[9px] font-mono text-emerald-400 font-bold">✓ Active</span>
                          ) : (
                            <span className="text-[9px] font-mono text-white/30">Absent</span>
                          )}
                        </div>

                        <div className="pl-2.5 border-l border-white/20 ml-2.5 py-0.5">
                          <div className="text-[9px] font-mono text-white/40 uppercase">Child Relationship</div>
                        </div>

                        {/* Child */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center font-bold ${
                                childActive
                                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-white/10 text-white/40 line-through'
                              }`}
                            >
                              C
                            </span>
                            <div>
                              <div
                                className={`text-xs font-bold ${
                                  childActive ? 'text-emerald-300' : 'text-white/40 line-through'
                                }`}
                              >
                                {item.childName}
                              </div>
                              <div className="text-[10px] text-white/50 font-mono">
                                {item.childRole} • #{item.childId}
                              </div>
                            </div>
                          </div>
                          {childActive ? (
                            <span className="text-[9px] font-mono text-emerald-400 font-bold">✓ Active</span>
                          ) : (
                            <span className="text-[9px] font-mono text-white/30">Absent</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* OUTSIDERS */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Outsiders in the Building (No Family Relations Here)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-white/50">
                    Solo suspects without parental ties
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {OUTSIDERS.map((out) => {
                    const isActive = activeCharIds.has(out.id);
                    if (hideAbsent && !isActive) return null;
                    return (
                      <div
                        key={out.id}
                        className={`p-3 rounded-xl border ${
                          isActive
                            ? 'bg-[#21201D] border-white/20'
                            : 'bg-black/50 border-white/5 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-white">
                            #{out.id} · {out.name}
                          </div>
                          {isActive ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                              ✓ IN ROOM
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/40">
                              ABSENT ({effectiveCapacity}P)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/60 font-mono mt-0.5">{out.role}</div>
                        <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">{out.note}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACULTY HIERARCHY & NON-DOCTORS */}
          {activeTab === 'hierarchy' && (
            <div className="space-y-6">
              {/* NON-DOCTORS HIGHLIGHT */}
              <div className="p-4 rounded-2xl bg-red-950/30 border-2 border-red-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs font-mono uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    <span>CRITICAL FORENSIC FACT: Exactly Two People Are NOT Doctors</span>
                  </div>
                  <span className="text-[10px] font-mono text-red-300/80">Only 2 in entire institution</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {NON_DOCTORS.map((nd) => {
                    const isActive = activeCharIds.has(nd.id);
                    return (
                      <div
                        key={nd.id}
                        className={`p-3 rounded-xl border ${
                          isActive
                            ? 'bg-black/60 border-red-500/40'
                            : 'bg-black/30 border-white/5 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-white">#{nd.id} · {nd.name}</div>
                          {isActive ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                              ✓ IN ROOM
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/40">
                              ABSENT ({effectiveCapacity}P)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-red-300 font-mono font-bold">{nd.role}</div>
                        <div className="text-[10px] text-white/60 font-mono mt-0.5">{nd.note}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HEADS OF DEPARTMENT */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 font-bold mb-3">
                  HEADS OF DEPARTMENT (CLASS OF 1994)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CHARACTERS.filter((c) => c.generation === 'senior').map((c) => {
                    const isActive = activeCharIds.has(c.id);
                    if (hideAbsent && !isActive) return null;
                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-xl border space-y-1 ${
                          isActive
                            ? 'bg-[#21201D] border-white/10'
                            : 'bg-black/30 border-white/5 opacity-40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-amber-300 font-bold">#{c.id}</span>
                            {isActive ? (
                              <span className="text-[8px] font-mono text-emerald-400">✓ Present</span>
                            ) : (
                              <span className="text-[8px] font-mono text-white/30">Absent</span>
                            )}
                          </div>
                          {c.extension && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                              Ext {c.extension}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-white/60 font-mono">{c.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT BATCHES */}
          {activeTab === 'batches' && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 font-bold">
                CAMPUS STUDENT BATCHES & RANKS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {STUDENT_BATCHES.map((b, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#21201D] border border-white/10 space-y-2">
                    <h4 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wide">
                      {b.batch}
                    </h4>
                    <ul className="space-y-1 text-xs text-white/80 font-mono">
                      {b.members.map((m, i) => {
                        const matchingChar = CHARACTERS.find((c) => m.includes(c.name) || c.name.includes(m.split(' ')[0]));
                        const isActive = matchingChar ? activeCharIds.has(matchingChar.id) : true;
                        return (
                          <li
                            key={i}
                            className={`flex items-center justify-between ${
                              isActive ? 'text-white' : 'text-white/30 line-through'
                            }`}
                          >
                            <span>• {m}</span>
                            {matchingChar && (
                              <span
                                className={`text-[9px] ${
                                  isActive ? 'text-emerald-400' : 'text-white/20'
                                }`}
                              >
                                {isActive ? 'In Room' : 'Absent'}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: POSITIONS OF ACCESS */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 font-bold">
                  SPECIAL FACILITY ACCESS & JURISDICTIONS
                </h3>
                <p className="text-xs text-white/60 font-mono mt-1">
                  Who holds keys, registers, and controls vital evidence across campus.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {POSITIONS_OF_ACCESS.map((pos, idx) => {
                  const idMatch = pos.person.match(/#(\d+)/);
                  const charId = idMatch ? parseInt(idMatch[1], 10) : null;
                  const isActive = charId ? activeCharIds.has(charId) : true;

                  if (hideAbsent && !isActive) return null;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isActive
                          ? 'bg-[#21201D] border-white/10'
                          : 'bg-black/30 border-white/5 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-sky-400 font-mono">{pos.person}</div>
                        {isActive ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                            ✓ ACTIVE
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/40">
                            ABSENT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/90 font-mono bg-black/40 p-2.5 rounded-xl border border-white/5">
                        Controls: <span className="text-amber-200">{pos.controls}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN WING EXTENSIONS */}
          {activeTab === 'extensions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 font-bold">
                  ADMINISTRATIVE WING EXTENSIONS (201–209)
                </h3>
                <p className="text-xs text-white/60 font-mono mt-1">
                  Crucial for analyzing the 21:44 incoming call to the Dean's office landline (Envelope B).
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ADMINISTRATIVE_WING_EXTENSIONS.map((ext, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#21201D] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-mono font-bold text-amber-300">
                        Extension {ext.ext}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/70">
                        {ext.office}
                      </span>
                    </div>
                    <div className="text-xs text-white font-mono">
                      Occupant: <span className="text-white font-bold">{ext.occupant}</span>
                    </div>
                    {ext.personId && (
                      <div className="text-[11px] text-white/50 font-mono">
                        Person #{ext.personId} · {activeCharIds.has(ext.personId) ? '✓ Present in room' : 'Absent from room'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: KNOWN FRICTION */}
          {activeTab === 'friction' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 font-bold">
                  CAMPUS RIVALRIES & KNOWN FRICTION
                </h3>
                <p className="text-xs text-white/60 font-mono mt-1">
                  Public rivalries and animosities observed by staff and students before the incident.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {KNOWN_FRICTION.map((fric, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#21201D] border border-white/10 space-y-2">
                    <div className="text-xs font-bold text-amber-300 font-mono">
                      {fric.title}
                    </div>
                    <p className="text-xs text-white/80 font-mono leading-relaxed">
                      {fric.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#21201D] flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-[#8B1A1A] hover:bg-[#A82020] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl transition-all active:scale-95 shadow"
          >
            Close Relationship Map
          </button>
        </div>
      </div>
    </div>
  );
};
