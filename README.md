# The Anand Medical College Murder (Live Interactive Mystery)

A real-time murder mystery game engineered for 10 to 20 live players, featuring synchronized forensic evidence boards, 3-tier slip progression, confidential dossiers, and server-authoritative security gating.

---

## 🏛️ Game Overview & Narrative

- **Setting:** Anand Medical College (AMC), Gujarat
- **Victim:** Dean Vikram Rathod
- **Time of Murder:** 8:15 PM during Dr. Priya Menon's 30th Birthday Reception in the College Banquet Hall
- **Cause of Death:** Acute cardiac arrest induced by Potassium Chloride (KCl) injection
- **Culprit:** Mr. Ramesh Gokhale (Registrar) — Motive: protecting his son Vivek Gokhale from expulsion after Dean Rathod discovered Vivek's forged medical entrance marksheet.

---

## 🎭 Scalable Player Capacities (10–20 Players)

The game dynamically adapts from **10 to 20 players** without breaking core solvability:
- **Core 10 Suspects (Tiers 1 & 2):** Critical narrative nodes, keyholders, and essential eyewitnesses.
- **Extended 11–20 Suspects (Tiers 2 & 3):** Support staff, junior residents, and family associates who hold corroborating physical riddles, forensic slips, and compel mechanics.
- **Family Tree & Hierarchy:** Automatically updates to reflect the exact player roster size in the room.

---

## 📜 3-Tier Multi-Round Slips Progression

1. **Tier I (Rounds 2 & 3 — White Paper):**
   - Paired forensic riddles (Exhibits A–J).
   - Unlocked when assigned character partners combine their 4-digit code halves.
2. **Tier II (Round 4 — Pale Yellow Paper):**
   - Cross-examination slips read aloud during active interrogation rounds.
3. **Tier III (Round 5 — Red Paper / Clue Cards):**
   - Host forensic telegraph wires, OT-3 narcotics logs, and registrar disciplinary files.

---

## 🔒 Security Architecture

1. **Server-Side Secret Isolation:**
   - Public data (`src/data/game.public.ts`) contains bios, titles, and public summaries.
   - Secret data (`src/data/game.secret.ts`) contains `is_murderer`, full codes, confidential motives, and `SOLUTION_CARD`, accessible strictly through backend Express routes (`/api/character/secret`, `/api/envelope/reveal`, `/api/game/solution`).
2. **Verified Firebase Token Authentication:**
   - Express server verifies caller Firebase ID tokens against Google Identity Toolkit and Firestore permissions.
3. **Firestore Security Rules:**
   - Authenticated role-based access control protecting room states, votes, and deductions.

---

## 🚀 Running the App

```bash
# Install dependencies
npm install

# Start development server (Express + Vite)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
