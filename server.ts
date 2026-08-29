import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { ENVELOPES, CHARACTERS, GAME_TITLE, VICTIM_NAME } from './src/data/game';

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', game: GAME_TITLE });
  });

  // Secure gating for envelope content delivery
  app.post('/api/envelope/reveal', (req, res) => {
    try {
      const { letter, isOpened, isHost } = req.body;

      if (!letter || typeof letter !== 'string') {
        res.status(400).json({ error: 'Envelope letter is required.' });
        return;
      }

      const envLetter = letter.toUpperCase();
      const envelope = ENVELOPES[envLetter];

      if (!envelope) {
        res.status(404).json({ error: 'Envelope not found.' });
        return;
      }

      if (isOpened || isHost) {
        res.json({
          letter: envelope.letter,
          title: envelope.title,
          summary: envelope.summary,
          full_code: envelope.full_code,
          body: envelope.body,
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
  app.post('/api/character/secret', (req, res) => {
    try {
      const { characterId, isAssignedPlayer, isHost } = req.body;

      const character = CHARACTERS.find((c) => c.id === characterId);
      if (!character) {
        res.status(404).json({ error: 'Character not found.' });
        return;
      }

      if (isAssignedPlayer || isHost) {
        res.json({
          id: character.id,
          name: character.name,
          title: character.title,
          secret: character.secret,
          goal: character.goal,
          known_fact: character.known_fact,
          is_murderer: character.is_murderer,
        });
        return;
      }

      res.status(403).json({ error: 'Access denied to classified personal dossier.' });
    } catch (error) {
      console.error('Error fetching character secrets:', error);
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
          source: 'local_archive'
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
        transmission: response.text?.trim() || `[FORENSIC DISPATCH] Cardiac toxicology confirms rapid-onset arrhythmia. The lethal agent did not leave the building through public corridors.`,
        source: 'gemini'
      });
    } catch (error) {
      console.error('Error generating AI transmission:', error);
      res.json({
        transmission: `[FORENSIC DISPATCH] Evidence lockers have been sealed. All statements are being recorded for court submission.`,
        source: 'fallback'
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
