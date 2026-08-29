import { useState } from 'react';
import { Search, FlaskConical, FileText, CheckCircle2, Lock, Sparkles, MapPin } from 'lucide-react';
import { recordHuntFind } from '../lib/firestoreService';
import { sound } from '../lib/audio';

interface ScavengerHuntGameProps {
  roomCode: string;
  playerUid: string;
  playerName: string;
  characterName: string;
  huntVialFoundBy: string | null;
  huntFileFoundBy: string | null;
}

interface RoomHotspot {
  id: string;
  label: string;
  icon: string;
  description: string;
  containsItem?: 'vial' | 'file';
  searchedText: string;
}

interface ManorRoom {
  id: string;
  name: string;
  atmosphere: string;
  imageAccent: string;
  hotspots: RoomHotspot[];
}

const MANOR_ROOMS: ManorRoom[] = [
  {
    id: 'ot3',
    name: 'Operating Theatre 3 (OT-3)',
    atmosphere: 'Stainless steel surgical tables, cold sterile lighting, and the anesthesia cart.',
    imageAccent: 'from-red-950/40 to-black',
    hotspots: [
      {
        id: 'anesthesia_trolley',
        label: 'Anesthesia Supply Trolley (OT-3)',
        icon: 'FlaskConical',
        description: 'A double-tiered metal trolley with lockable drug drawers.',
        containsItem: 'vial',
        searchedText: 'You slide open the lower tier—inside rests the missing 10ml ampoule of Potassium Chloride (KCl) with the seal snapped!'
      },
      {
        id: 'scrub_sink',
        label: 'Surgical Scrub Bay',
        icon: 'Lock',
        description: 'Automatic water sensors and wall-mounted betadine dispensers.',
        searchedText: 'A crumpled paper towel with faint gray grease stains near the trap.'
      },
      {
        id: 'ot_waste',
        label: 'Hazardous Sharps Bin',
        icon: 'Search',
        description: 'A yellow plastic sharps container mounted to the wall.',
        searchedText: 'Standard discarded suturing needles and a 5ml sterile syringe.'
      }
    ]
  },
  {
    id: 'archive',
    name: 'Registrar & MCI Examination Archive',
    atmosphere: 'Rows of metal filing cabinets containing 30 years of medical student records.',
    imageAccent: 'from-amber-950/40 to-black',
    hotspots: [
      {
        id: 'filing_cabinet',
        label: 'Confidential 1995 MCI Batch Cabinet',
        icon: 'FileText',
        description: 'A heavy metal filing cabinet with a broken brass lock.',
        containsItem: 'file',
        searchedText: 'Inside folder #95-AMC rests the Registrar’s Carbon Copy: Vivek Gokhale’s original failing marksheet with Dean Rathod’s signature!'
      },
      {
        id: 'registrar_desk',
        label: 'Registrar Desk Blotter',
        icon: 'Search',
        description: 'An old ledger and wooden in-tray with unfiled admission receipts.',
        searchedText: 'An admission note mentioning a 9-lakh management quota payment.'
      },
      {
        id: 'clock_shelf',
        label: 'Wall Clock & Storage Shelf',
        icon: 'Lock',
        description: 'Old textbooks and spare examination answer booklets.',
        searchedText: 'Empty cardboard boxes and blank degree certificate templates.'
      }
    ]
  }
];

export function ScavengerHuntGame({
  roomCode,
  playerUid,
  playerName,
  characterName,
  huntVialFoundBy,
  huntFileFoundBy,
}: ScavengerHuntGameProps) {
  const [activeRoomId, setActiveRoomId] = useState<string>('ot3');
  const [searchedSpots, setSearchedSpots] = useState<Record<string, string>>({});
  const [inspectingSpot, setInspectingSpot] = useState<RoomHotspot | null>(null);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const currentRoom = MANOR_ROOMS.find((r) => r.id === activeRoomId) || MANOR_ROOMS[0];

  const handleInspect = async (spot: RoomHotspot) => {
    sound.playClick();
    setInspectingSpot(spot);
    setSearchLoading(true);

    setTimeout(async () => {
      setSearchLoading(false);
      setSearchedSpots((prev) => ({
        ...prev,
        [spot.id]: spot.searchedText,
      }));

      if (spot.containsItem === 'vial' && !huntVialFoundBy) {
        sound.playClueFound();
        await recordHuntFind(roomCode, 'vial', playerUid, playerName, characterName);
      } else if (spot.containsItem === 'file' && !huntFileFoundBy) {
        sound.playClueFound();
        await recordHuntFind(roomCode, 'file', playerUid, playerName, characterName);
      }
    }, 600);
  };

  return (
    <div className="space-y-6" id="scavenger-hunt-module">
      {/* Recovery Status Alert Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 transition-all backdrop-blur-md ${
            huntVialFoundBy
              ? 'bg-[#8B1A1A]/30 border-[#8B1A1A] text-red-200 shadow-[0_0_15px_rgba(139,26,26,0.25)]'
              : 'bg-black/60 border-white/10 text-white/50'
          }`}
          id="status-vial"
        >
          <div className={`p-2.5 rounded-xl ${huntVialFoundBy ? 'bg-[#8B1A1A]/40 text-red-300 border border-[#8B1A1A]' : 'bg-white/5 text-white/40'}`}>
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-[0.2em] font-semibold text-white/40">Critical Item: OT-3 KCl Vial</div>
            <div className="text-sm font-medium">
              {huntVialFoundBy ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Found: {huntVialFoundBy}
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1 mt-0.5 font-mono text-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Hidden in Operating Theatre 3
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 transition-all backdrop-blur-md ${
            huntFileFoundBy
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-black/60 border-white/10 text-white/50'
          }`}
          id="status-file"
        >
          <div className={`p-2.5 rounded-xl ${huntFileFoundBy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40'}`}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-[0.2em] font-semibold text-white/40">Critical Item: Registrar Carbon File</div>
            <div className="text-sm font-medium">
              {huntFileFoundBy ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Found: {huntFileFoundBy}
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1 mt-0.5 font-mono text-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Hidden in Archive Room
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manor Wing Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" id="manor-room-tabs">
        {MANOR_ROOMS.map((r) => (
          <button
            key={r.id}
            id={`room-tab-${r.id}`}
            onClick={() => {
              sound.playClick();
              setActiveRoomId(r.id);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeRoomId === r.id
                ? 'bg-[#8B1A1A] text-white font-bold shadow-lg'
                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {r.name}
          </button>
        ))}
      </div>

      {/* Active Room Stage */}
      <div className={`p-6 rounded-2xl border border-white/10 bg-gradient-to-b ${currentRoom.imageAccent} relative overflow-hidden backdrop-blur-md shadow-2xl`} id="manor-stage-container">
        <div className="relative z-10 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white font-serif">
              {currentRoom.name}
            </h3>
            <p className="text-xs text-white/50 mt-1">{currentRoom.atmosphere}</p>
          </div>

          <div className="text-xs font-mono uppercase tracking-[0.2em] text-white/40 font-semibold pt-2">
            Searchable Evidence Points:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentRoom.hotspots.map((spot) => {
              const isSearched = !!searchedSpots[spot.id];
              const isItemHere = (spot.containsItem === 'vial' && huntVialFoundBy) || (spot.containsItem === 'file' && huntFileFoundBy);

              return (
                <div
                  key={spot.id}
                  onClick={() => handleInspect(spot)}
                  id={`hotspot-${spot.id}`}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isItemHere
                      ? 'bg-[#8B1A1A]/30 border-[#8B1A1A] text-red-200'
                      : isSearched
                      ? 'bg-black/60 border-white/15 text-white/80'
                      : 'bg-black/40 border-white/10 hover:border-white/20 text-white/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-white font-serif">{spot.label}</span>
                    <Search className={`w-4 h-4 ${isSearched ? 'text-[#8B1A1A]' : 'text-white/30'}`} />
                  </div>
                  <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed">{spot.description}</p>

                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    {isSearched ? (
                      <span className="text-emerald-400 font-medium">✓ Inspected</span>
                    ) : (
                      <span className="text-[#8B1A1A] font-semibold">Inspect</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inspection Result Detail */}
      {inspectingSpot && (
        <div className="p-5 rounded-2xl border border-[#8B1A1A]/40 bg-black/90 backdrop-blur-xl space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#8B1A1A] font-mono text-xs font-semibold uppercase tracking-wider">
              <Search className="w-4 h-4" />
              <span>Inspection Log: {inspectingSpot.label}</span>
            </div>
            <button
              onClick={() => setInspectingSpot(null)}
              className="text-xs text-white/40 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-mono"
            >
              Dismiss
            </button>
          </div>

          {searchLoading ? (
            <div className="flex items-center gap-3 py-4 text-white/70 font-mono text-xs">
              <div className="w-4 h-4 border-2 border-[#8B1A1A] border-t-transparent rounded-full animate-spin" />
              Searching compartment and analyzing evidence...
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-white/80 leading-relaxed font-mono">
                {searchedSpots[inspectingSpot.id] || inspectingSpot.searchedText}
              </p>
              {inspectingSpot.containsItem && (
                <div className="p-3 bg-[#8B1A1A]/20 border border-[#8B1A1A] rounded-xl text-xs text-red-200 font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8B1A1A] shrink-0" />
                  <span>CRITICAL EVIDENCE CONFIRMED! Discovery broadcast to the room record.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
