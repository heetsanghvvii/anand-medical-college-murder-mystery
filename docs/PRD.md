# PRD: The Anand Medical College Murder

**Owner:** Heet Sanghvi (Product) · **Status:** Built, v1

## 1. Problem

Hosted murder-mystery nights are a great group experience, but the usual kits have three problems:

1. **Fixed group size.** A kit for 8 doesn't work for 14. Hosts cut or invent characters and the puzzle stops being solvable.
2. **Easy to spoil.** The answer sits in the same box or PDF as the clues.
3. **Heavy for the host.** They must hand out sheets, track rounds and remember who gets what.

## 2. Users

| User | Need |
|---|---|
| **Host** | Run a polished game for 10 to 20 people without rehearsing |
| **Player** | A fair puzzle, a character to play, and a reason to talk to everyone in the room |

## 3. Goals

- Works for **any group size from 10 to 20** without breaking the solution.
- **No way to peek** at the answer, even for a technical player.
- The host only has to start rounds; the app handles the rest.

## 4. Solution

| Feature | Why |
|---|---|
| **Scalable cast**: 10 core suspects carry the solution; up to 10 extra roles add corroborating clues | Solvability never depends on optional players |
| **Three clue tiers over five rounds**: paired riddles, then cross-examination slips, then final clue cards | Pacing: easy wins early, tension builds to the end |
| **Code halves**: two players each hold half of a 4-digit code | Forces conversation between players who wouldn't otherwise talk |
| **Private dossiers** on each player's phone | Each person has secrets to protect and reveal |
| **Synced evidence board** | Everyone sees the shared state live |
| **Server-only secrets**: the culprit, codes and solution are only served after the right step | Removes cheating entirely |

## 5. Out of scope for v1

- Multiple stories (one story done well first)
- Remote / video-call play
- Payments and a host marketplace

## 6. Success metrics

| Metric | Target |
|---|---|
| Groups that reach the final vote | 90%+ |
| Groups that solve it correctly | 40 to 70% (hard but fair) |
| Host setup time | Under 10 minutes |
| Players who'd play another story | Ask after each game |

## 7. Risks

| Risk | Mitigation |
|---|---|
| A player drops out mid-game | Optional roles only add corroborating clues, so losing one doesn't block the solution; core-role drop-outs to be tested in playtests |
| Too hard, groups give up | Tier III clue cards narrow it down in the last round |
| Phones die or lose signal | Room state is stored in the cloud database, not the phone; rejoin flow to be tested in playtests |

## 8. Next

1. Run with real groups and record the metrics above.
2. A second story on the same engine, to test whether the format is repeatable.
3. A host kit for corporate team-building events.
