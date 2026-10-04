# The Anand Medical College Murder

**A live, multiplayer murder-mystery game for 10 to 20 players, played in one room with phones.** Product by [Heet Sanghvi](https://github.com/heetsanghvvii), Product Manager. **[Read the PRD](docs/PRD.md)**

## The product thinking

| | |
|---|---|
| **Problem** | Murder-mystery party kits are built for a fixed group size and are easy to spoil: one peek at the answer ruins the night for everyone. |
| **User** | A host running a game night for 10 to 20 friends or colleagues, and the players who want a fair, immersive puzzle. |
| **Solution** | A web game that hands each player a private character dossier, unlocks clues round by round, and keeps the answer locked on the server. |
| **Key decisions** | The story stays solvable at any size from 10 to 20 (10 core suspects plus optional extras). Clues come in three tiers so the pace builds over five rounds. Partners must combine code halves, which forces players to talk. |
| **Trade-off** | Keeping every secret server-side took more build effort than a static site, but it makes cheating impossible. |
| **Success looks like** | The group solves it in one evening, nobody can peek, and the host runs it without a rehearsal. |

## How a game runs

1. The host opens a room and players join on their phones.
2. Each player gets a character with public and private information.
3. Over five rounds, paired riddles, cross-examination slips and final clue cards unlock.
4. Players vote on the culprit; the solution is revealed by the server.

<details>
<summary><b>Story and game design (spoilers)</b></summary>

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

</details>

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
