import { CharacterData, EliminationRecord, OracleState, GamePhase } from '../types';
import { CHARACTERS, ENVELOPES } from '../data/game.public';

// Standard phase clue elimination maps for Director Mode solvability verification
const FORENSIC_CARD_ELIMINATIONS: Record<string, { title: string; eliminates: number[]; reason: string; phase: string }> = {
  R1_WAKE: {
    title: 'Autopsy Finding #1 — Time of Death & Lethal Toxin',
    phase: 'R1_WAKE',
    eliminates: [1, 2, 4, 11],
    reason: 'Eliminated by confirmed coroner time of death and surgical hall corridor cameras.',
  },
  INTERVAL: {
    title: 'Forensic Finding #2 — Potassium Chloride Delivery Method',
    phase: 'INTERVAL',
    eliminates: [3, 8, 9, 14, 16],
    reason: 'Eliminated by OT-3 restricted access log and missing surgical ampoules.',
  },
  R4_INTERROGATION: {
    title: 'Forensic Finding #3 — Marksheet Disciplinary Paper Trail',
    phase: 'R4_INTERROGATION',
    eliminates: [5, 6, 10, 12, 13, 17, 18, 19, 20],
    reason: 'Eliminated by Dean secret registrar safe disciplinary files.',
  },
};

const ENVELOPE_ELIMINATIONS: Record<string, { eliminates: number[]; reason: string }> = {
  A: { eliminates: [1, 2], reason: 'Eliminated by Pathology Ward log' },
  B: { eliminates: [3, 4], reason: 'Eliminated by Anatomy Lab register' },
  C: { eliminates: [5, 6], reason: 'Eliminated by Pharmacy Dispensing slip' },
  D: { eliminates: [8, 9], reason: 'Eliminated by Dean Office visitor registry' },
  E: { eliminates: [10, 11], reason: 'Eliminated by ICU CCTV timestamp' },
  F: { eliminates: [12, 13], reason: 'Eliminated by OT-3 Scrub log' },
  G: { eliminates: [14, 16], reason: 'Eliminated by Medical Records ledger' },
  H: { eliminates: [17, 18], reason: 'Eliminated by Security Gate keycard swipe' },
  I: { eliminates: [19, 20], reason: 'Eliminated by Resident Hostel register' },
  J: { eliminates: [15], reason: 'Narrows conclusively to Registrar' },
};

/**
 * Computes the Solvability Oracle state based on:
 * 1. All PUBLISHED envelopes
 * 2. All Host-read Tier III slips (clue cards)
 */
export function computeOracleState(
  publishedLetters: string[],
  hostReadPhasesOrIds: string[] = [],
  currentPhase: GamePhase | string = 'LOBBY'
): OracleState {
  const eliminatedMap = new Map<number, EliminationRecord>();
  let solvedRound: string | undefined;
  let solvedSlip: string | undefined;
  let runningRemaining = 20;

  // Process Host-Read Clue Cards first
  for (const key of hostReadPhasesOrIds) {
    const card = FORENSIC_CARD_ELIMINATIONS[key];
    if (card && card.eliminates && card.eliminates.length > 0) {
      for (const charId of card.eliminates) {
        if (!eliminatedMap.has(charId)) {
          const char = CHARACTERS.find((c) => c.id === charId);
          eliminatedMap.set(charId, {
            characterId: charId,
            characterName: char ? char.name : `Suspect #${charId}`,
            slipId: card.title,
            reason: card.reason,
            phase: card.phase,
            timestamp: Date.now(),
          });
          runningRemaining = 20 - eliminatedMap.size;
          if (runningRemaining === 1 && !solvedRound) {
            solvedRound = card.phase;
            solvedSlip = card.title;
          }
        }
      }
    }
  }

  // Process Published Envelopes
  for (const letter of publishedLetters) {
    const env = ENVELOPES[letter];
    const elim = ENVELOPE_ELIMINATIONS[letter];
    if (elim && elim.eliminates && elim.eliminates.length > 0) {
      for (const charId of elim.eliminates) {
        if (!eliminatedMap.has(charId)) {
          const char = CHARACTERS.find((c) => c.id === charId);
          eliminatedMap.set(charId, {
            characterId: charId,
            characterName: char ? char.name : `Suspect #${charId}`,
            slipId: `Exhibit ${letter}: ${env?.title || 'Forensic Exhibit'}`,
            reason: elim.reason,
            phase: currentPhase,
            timestamp: Date.now(),
          });
          runningRemaining = 20 - eliminatedMap.size;
          if (runningRemaining === 1 && !solvedRound) {
            solvedRound = String(currentPhase);
            solvedSlip = `Exhibit ${letter}`;
          }
        }
      }
    }
  }

  const eliminatedRecords = Array.from(eliminatedMap.values());
  const survivingCharacters = CHARACTERS.filter((c) => !eliminatedMap.has(c.id));
  const candidatesRemaining = survivingCharacters.length;
  const isSolved = candidatesRemaining === 1;

  return {
    candidatesRemaining,
    survivingCharacters,
    eliminatedRecords,
    isSolved,
    solvedRound,
    solvedSlip,
  };
}

/**
 * Standard default scenario sequence for automated replay testing
 */
export const DEFAULT_SCENARIO_SCRIPT = [
  {
    phase: 'LOBBY',
    actor: 'Director',
    action: 'SEED_BOTS',
    payload: { botCount: 20 },
  },
  {
    phase: 'READ_IN',
    actor: 'Host',
    action: 'ADVANCE_PHASE',
    payload: { phase: 'READ_IN' },
  },
  {
    phase: 'R1_WAKE',
    actor: 'Host',
    action: 'HOST_READ_CLUE',
    payload: { cardId: 'R1_WAKE' },
  },
  {
    phase: 'R2_PAIRING',
    actor: 'Dr. Meera Rathod & Rohan Nair',
    action: 'UNLOCK_ENVELOPE',
    payload: { letter: 'A', code: '7283' },
  },
  {
    phase: 'R2_PAIRING',
    actor: 'Simran Kale & Ramesh Gokhale',
    action: 'UNLOCK_ENVELOPE',
    payload: { letter: 'G', code: '5013' },
  },
  {
    phase: 'R3_BOARD',
    actor: 'Host',
    action: 'PUBLISH_ENVELOPE',
    payload: { letter: 'A' },
  },
  {
    phase: 'R3_BOARD',
    actor: 'Simran Kale',
    action: 'PUBLISH_ENVELOPE',
    payload: { letter: 'G' },
  },
  {
    phase: 'INTERVAL',
    actor: 'Host',
    action: 'TRIGGER_ATTACK',
    payload: {},
  },
  {
    phase: 'INTERVAL',
    actor: 'Host',
    action: 'HOST_READ_CLUE',
    payload: { cardId: 'INTERVAL' },
  },
  {
    phase: 'R4_INTERROGATION',
    actor: 'Priya Menon',
    action: 'COMPEL',
    payload: {
      fromCharacter: 'Priya Menon',
      toCharacter: 'Mr. Ramesh Gokhale',
      question: 'Did you speak to Vikram at 11 PM?',
      answer: "I only spoke to him about Vivek's enrollment.",
    },
  },
  {
    phase: 'R4_INTERROGATION',
    actor: 'Host',
    action: 'HOST_READ_CLUE',
    payload: { cardId: 'R4_INTERROGATION' },
  },
  {
    phase: 'R5_HUNT',
    actor: 'Ayesha Sheikh & Dhruv Iyer',
    action: 'PUBLISH_ENVELOPE',
    payload: { letter: 'J' },
  },
  {
    phase: 'DEDUCTION',
    actor: 'All Suspects',
    action: 'SUBMIT_DEDUCTION',
    payload: {},
  },
  {
    phase: 'VOTE',
    actor: 'All Suspects',
    action: 'SUBMIT_VOTE',
    payload: {},
  },
  {
    phase: 'REVEAL',
    actor: 'Host',
    action: 'ADVANCE_PHASE',
    payload: { phase: 'REVEAL' },
  },
];
