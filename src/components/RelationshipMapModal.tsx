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
} from '../data/game';
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
} from 'lucide-react';
import { sound } from '../lib/audio';

interface RelationshipMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhase?: string;
}

export const RelationshipMapModal: React.FC<RelationshipMapModalProps> = ({
  isOpen,
  onClose,
  currentPhase = 'LOBBY',
}) => {
  const [activeTab, setActiveTab] = useState<'family' | 'hierarchy' | 'batches' | 'access' | 'extensions' | 'friction'>('family');

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
                  PUBLIC KNOWLEDGE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Relationships & Campus Hierarchy • કોણ કોનું છે
              </h2>
            </div>
          </div>

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
            <span>Family Tree (9 Parents & 9 Children)</span>
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
                  All 20 suspects have known each other for decades. Use this tree during Round 2 to decode your partner's riddle!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {FAMILY_TREE.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#21201D] border border-white/10 hover:border-white/20 transition-all space-y-2.5 shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70 uppercase">
                        Family Unit #{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-amber-300 font-bold">
                        {item.parentDept}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-sky-900/60 text-sky-300 text-[10px] font-mono flex items-center justify-center font-bold">
                          P
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">{item.parentName}</div>
                          <div className="text-[10px] text-white/50 font-mono">Parent • #{item.parentId}</div>
                        </div>
                      </div>

                      <div className="pl-2.5 border-l border-white/20 ml-2.5 py-0.5">
                        <div className="text-[9px] font-mono text-white/40 uppercase">Child Relationship</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-mono flex items-center justify-center font-bold">
                          C
                        </span>
                        <div>
                          <div className="text-xs font-bold text-emerald-300">{item.childName}</div>
                          <div className="text-[10px] text-white/50 font-mono">{item.childRole} • #{item.childId}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* OUTSIDERS */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Outsiders in the Building (No Family Relations Here)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {OUTSIDERS.map((out) => (
                    <div key={out.id} className="p-3 bg-[#21201D] rounded-xl border border-white/10">
                      <div className="text-xs font-bold text-white">#{out.id} · {out.name}</div>
                      <div className="text-[11px] text-white/60 font-mono">{out.role}</div>
                      <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">{out.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACULTY HIERARCHY & NON-DOCTORS */}
          {activeTab === 'hierarchy' && (
            <div className="space-y-6">
              {/* NON-DOCTORS HIGHLIGHT */}
              <div className="p-4 rounded-2xl bg-red-950/30 border-2 border-red-500/40 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs font-mono uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  <span>CRITICAL FORENSIC FACT: Exactly Two People Are NOT Doctors</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {NON_DOCTORS.map((nd) => (
                    <div key={nd.id} className="p-3 bg-black/50 rounded-xl border border-red-500/30">
                      <div className="text-xs font-bold text-white">#{nd.id} · {nd.name}</div>
                      <div className="text-[11px] text-red-300 font-mono font-bold">{nd.role}</div>
                      <div className="text-[10px] text-white/60 font-mono mt-0.5">{nd.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HEADS OF DEPARTMENT */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 font-bold mb-3">
                  HEADS OF DEPARTMENT (CLASS OF 1994)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CHARACTERS.filter((c) => c.generation === 'senior').map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-[#21201D] border border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-300 font-bold">#{c.id}</span>
                        {c.extension && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                            Ext {c.extension}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white">{c.name}</div>
                      <div className="text-[11px] text-white/60 font-mono">{c.title}</div>
                    </div>
                  ))}
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
                      {b.members.map((m, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{m}</span>
                        </li>
                      ))}
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
                  POSITIONS OF INSTITUTIONAL ACCESS
                </h3>
                <p className="text-xs text-white/60 font-mono mt-0.5">
                  Who holds keys, registers, drug cabinets, and academic files.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POSITIONS_OF_ACCESS.map((pos, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#21201D] border border-white/10 space-y-1 shadow">
                    <div className="text-xs font-bold text-amber-300 font-mono">{pos.person}</div>
                    <div className="text-xs text-white/80 font-sans">{pos.controls}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ADMINISTRATIVE WING EXTENSIONS */}
          {activeTab === 'extensions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/30">
                <h4 className="text-xs font-bold font-mono text-sky-400 uppercase">
                  Administrative Wing Internal Landlines (201–209)
                </h4>
                <p className="text-xs text-white/70 font-mono mt-1">
                  Clinical departments are 3xx. Student Hostels are 4xx. Dean's Office is 101.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADMINISTRATIVE_WING_EXTENSIONS.map((ext, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#21201D] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{ext.office}</div>
                      <div className="text-xs text-white/60 font-mono">{ext.occupant}</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-sky-400/40 text-sky-300 font-mono font-bold text-sm">
                      Ext {ext.ext}
                    </div>
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
                  KNOWN FRICTION & OPEN SECRETS
                </h3>
                <p className="text-xs text-white/60 font-mono mt-0.5">
                  These friction points are publicly known across the hospital and safe to discuss in the open.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {KNOWN_FRICTION.map((f, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-[#21201D] border border-white/10 space-y-1.5">
                    <div className="text-xs font-bold text-amber-300 font-mono">{f.title}</div>
                    <p className="text-xs text-white/80 font-sans leading-relaxed">{f.detail}</p>
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
