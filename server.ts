import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  SECRET_ENVELOPES,
  SECRET_CHARACTERS,
  SOLUTION_CARD,
  CLUE_CARDS,
} from './src/data/game.secret';
import { GAME_TITLE, VICTIM_NAME } from './src/data/game.public';
import firebaseConfigJson from './firebase-applet-config.json';

// Optional Gemini client initialization (lazy/guarded)
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Gemini AI failed to initialize:', e);
    }
  }
  return aiClient;
}

// Helper to convert Firestore REST representation to standard JavaScript object
function parseFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(parseFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue.fields || {};
    for (const k of Object.keys(fields)) {
      res[k] = parseFirestoreValue(fields[k]);
    }
    return res;
  }
  return val;
}

function parseFirestoreDoc(docObj: any): any {
  if (!docObj || !docObj.fields) return null;
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(docObj.fields)) {
    result[key] = parseFirestoreValue(val);
  }
  return result;
}

// Verify Firebase Auth ID token using Google Identity Toolkit
async function verifyFirebaseIdToken(idToken: string | undefined): Promise<string | null> {
  if (!idToken || typeof idToken !== 'string') return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfigJson.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.users && data.users.length > 0 && data.users[0].localId) {
      return data.users[0].localId;
    }
    return null;
  } catch (err) {
    console.error('Error verifying Firebase ID token:', err);
    return null;
  }
}

// Fetch a Firestore document directly
async function getFirestoreDoc(docPath: string): Promise<any | null> {
  try {
    const dbName =
      firebaseConfigJson.firestoreDatabaseId &&
      firebaseConfigJson.firestoreDatabaseId !== '(default)'
        ? firebaseConfigJson.firestoreDatabaseId
        : '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfigJson.projectId}/databases/${dbName}/documents/${docPath}?key=${firebaseConfigJson.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const docData = await res.json();
    return parseFirestoreDoc(docData);
  } catch (err) {
    console.error(`Error fetching doc at ${docPath}:`, err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', game: GAME_TITLE });
  });

  // Extract ID token helper
  const getAuthToken = (req: express.Request): string | undefined => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return req.body?.idToken;
  };

  // Secure gating for envelope content delivery
  app.post('/api/envelope/reveal', async (req, res) => {
    try {
      const { letter, roomCode } = req.body;
      const idToken = getAuthToken(req);

      if (!letter || typeof letter !== 'string') {
        res.status(400).json({ error: 'Envelope letter is required.' });
        return;
      }

      const envLetter = letter.toUpperCase();
      const envelope = SECRET_ENVELOPES[envLetter];

      if (!envelope) {
        res.status(404).json({ error: 'Envelope not found.' });
        return;
      }

      // Verify caller token
      const callerUid = await verifyFirebaseIdToken(idToken);
      if (!callerUid) {
        res.status(401).json({ error: 'Authentication required. Valid Firebase ID token is missing.' });
        return;
      }

      let isHost = false;
      let isUnlocked = false;
      let isAssignedPair = false;

      if (roomCode && typeof roomCode === 'string') {
        const cleanRoom = roomCode.toUpperCase().trim();
        const roomDoc = await getFirestoreDoc(`rooms/${cleanRoom}`);
        if (roomDoc) {
          if (roomDoc.hostUid === callerUid) {
            isHost = true;
          }

          const envState = await getFirestoreDoc(`rooms/${cleanRoom}/envelopeStates/${envLetter}`);
          if (envState && (envState.unlocked === true || envState.published === true)) {
            isUnlocked = true;
          }

          const playerDoc = await getFirestoreDoc(`rooms/${cleanRoom}/players/${callerUid}`);
          if (
            playerDoc &&
            (playerDoc.characterId === envelope.char_id_1 ||
              playerDoc.characterId === envelope.char_id_2)
          ) {
            isAssignedPair = true;
          }
        }
      }

      // Allow reveal if Host, Envelope is already unlocked in room, or Caller is assigned pair member
      if (isHost || isUnlocked || isAssignedPair) {
        res.json({
          letter: envelope.letter,
          title: envelope.title,
          summary: envelope.summary,
          full_code: envelope.full_code,
          body: envelope.body,
          slips: envelope.slips,
          eliminates: envelope.eliminates,
          reason: envelope.reason,
          isDecrypted: true,
        });
        return;
      }

      // Otherwise return only the sealed preview
      res.json({
        letter: envelope.letter,
        title: envelope.title,
        summary: envelope.summary,
        body: '[SEALED CASE FILE - REQUIRES BOTH CODE HALVES TO UNSEAL]',
        isDecrypted: false,
      });
    } catch (error) {
      console.error('Error revealing envelope:', error);
      res.status(500).json({ error: 'Internal server error processing envelope.' });
    }
  });

  // Secure gating for private character confidential dossiers
  app.post('/api/character/secret', async (req, res) => {
    try {
      const { characterId, roomCode } = req.body;
      const idToken = getAuthToken(req);

      const character = SECRET_CHARACTERS.find((c) => c.id === characterId);
      if (!character) {
        res.status(404).json({ error: 'Character not found.' });
        return;
      }

      // Verify caller token
      const callerUid = await verifyFirebaseIdToken(idToken);
      if (!callerUid) {
        res.status(401).json({ error: 'Authentication required. Valid Firebase ID token is missing.' });
        return;
      }

      let isAuthorized = false;

      if (roomCode && typeof roomCode === 'string') {
        const cleanRoom = roomCode.toUpperCase().trim();
        const roomDoc = await getFirestoreDoc(`rooms/${cleanRoom}`);
        if (roomDoc && roomDoc.hostUid === callerUid) {
          isAuthorized = true; // Host has access
        } else {
          const playerDoc = await getFirestoreDoc(`rooms/${cleanRoom}/players/${callerUid}`);
          if (playerDoc && playerDoc.characterId === characterId) {
            isAuthorized = true; // Assigned player has access
          }
        }
      }

      if (isAuthorized) {
        res.json({
          id: character.id,
          name: character.name,
          title: character.title,
          secret: character.secret,
          goal: character.goal,
          known_fact: character.known_fact,
          is_murderer: character.is_murderer,
          special_notes: character.special_notes,
        });
        return;
      }

      res.status(403).json({ error: 'Access denied to classified personal dossier.' });
    } catch (error) {
      console.error('Error fetching character secrets:', error);
      res.status(500).json({ error: 'Internal error' });
    }
  });

  // Secure endpoint to get official solution during REVEAL or for host
  app.post('/api/game/solution', async (req, res) => {
    try {
      const { roomCode } = req.body;
      const idToken = getAuthToken(req);
      const callerUid = await verifyFirebaseIdToken(idToken);

      if (!callerUid) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      let authorized = false;
      if (roomCode) {
        const cleanRoom = String(roomCode).toUpperCase().trim();
        const roomDoc = await getFirestoreDoc(`rooms/${cleanRoom}`);
        if (roomDoc && (roomDoc.hostUid === callerUid || roomDoc.phase === 'REVEAL')) {
          authorized = true;
        }
      }

      if (authorized) {
        res.json({ solution: SOLUTION_CARD });
        return;
      }

      res.status(403).json({ error: 'Solution is sealed until final REVEAL.' });
    } catch (error) {
      console.error('Error serving solution:', error);
      res.status(500).json({ error: 'Internal error' });
    }
  });

  // Clue card endpoint for Host or specific phases
  app.post('/api/clue-card', async (req, res) => {
    try {
      const { phase, roomCode } = req.body;
      const idToken = getAuthToken(req);
      const callerUid = await verifyFirebaseIdToken(idToken);

      if (!callerUid) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }

      const card = CLUE_CARDS[phase];
      if (!card) {
        res.status(404).json({ error: 'Clue card not found for this phase.' });
        return;
      }

      res.json({ clueCard: card });
    } catch (error) {
      console.error('Error serving clue card:', error);
      res.status(500).json({ error: 'Internal error' });
    }
  });

  // AI Forensic Dispatch Broadcast
  app.post('/api/ai/transmission', async (req, res) => {
    try {
      const { phase, customQuery, recentClues } = req.body;
      const ai = getAI();

      if (!ai) {
        res.json({
          transmission: `[FORENSIC DISPATCH] Phase ${phase || 'ACTIVE'}. Crime scene investigators in the Anatomy Hall note high chemical traces on the victim's collar. Proceed with interrogations.`,
          source: 'local_archive',
        });
        return;
      }

      const prompt = `You are the cold, clinical voice of the Police Forensic Investigation Bureau examining the murder of ${VICTIM_NAME} at Anand Medical College.
Current investigation phase: ${phase}.
Recent evidence on board: ${recentClues || 'Potassium chloride vial, Master key register'}.
Query: "${customQuery || 'Deliver an authoritative, forensic status update.'}".
Give a short (2-3 sentences max), tense, realistic procedural forensic statement to the suspects assembled in the chamber.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        transmission:
          response.text?.trim() ||
          `[FORENSIC DISPATCH] Cardiac toxicology confirms rapid-onset arrhythmia. The lethal agent did not leave the building through public corridors.`,
        source: 'gemini',
      });
    } catch (error) {
      console.error('Error generating AI transmission:', error);
      res.json({
        transmission: `[FORENSIC DISPATCH] Evidence lockers have been sealed. All statements are being recorded for court submission.`,
        source: 'fallback',
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Anand Medical College Murder server running on port ${PORT}`);
  });
}

startServer();
