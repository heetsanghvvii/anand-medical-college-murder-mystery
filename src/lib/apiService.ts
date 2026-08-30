import { getCurrentUserToken } from './firebase';
import { EnvelopeData, ClueCard } from '../types';

export interface DecryptedEnvelopeResponse {
  letter: string;
  title: string;
  summary: string;
  full_code?: string;
  body?: string;
  slips?: any[];
  eliminates?: number[];
  reason?: string;
  isDecrypted: boolean;
}

export interface CharacterSecretResponse {
  id: number;
  name: string;
  title: string;
  secret: string;
  goal: string;
  known_fact: string;
  is_murderer: boolean;
  special_notes?: string;
}

export async function fetchCharacterSecret(
  roomCode: string,
  characterId: number
): Promise<CharacterSecretResponse | null> {
  try {
    const idToken = await getCurrentUserToken();
    const res = await fetch('/api/character/secret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ roomCode, characterId, idToken }),
    });

    if (!res.ok) {
      console.warn(`Failed to fetch character secret: ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('Error fetching character secret:', err);
    return null;
  }
}

export async function fetchEnvelopeReveal(
  roomCode: string,
  letter: string
): Promise<DecryptedEnvelopeResponse | null> {
  try {
    const idToken = await getCurrentUserToken();
    const res = await fetch('/api/envelope/reveal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ roomCode, letter, idToken }),
    });

    if (!res.ok) {
      console.warn(`Failed to reveal envelope: ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('Error revealing envelope:', err);
    return null;
  }
}

export async function fetchGameSolution(roomCode: string): Promise<any | null> {
  try {
    const idToken = await getCurrentUserToken();
    const res = await fetch('/api/game/solution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ roomCode, idToken }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.solution;
  } catch (err) {
    console.error('Error fetching game solution:', err);
    return null;
  }
}

export async function fetchClueCard(
  roomCode: string,
  phase: string
): Promise<ClueCard | null> {
  try {
    const idToken = await getCurrentUserToken();
    const res = await fetch('/api/clue-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ roomCode, phase, idToken }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.clueCard;
  } catch (err) {
    console.error('Error fetching clue card:', err);
    return null;
  }
}
