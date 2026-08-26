# Night Ballot — Beta Feedback Documentation

**Testing period:** August 2026  
**Testers:** 50 registered Midnight Preview wallet users  
**App version:** v0.5.0 (Level 5)  
**Contract:** `9f6621c985e268c0bbffa59799a6000e6130a14d9334e1731f8f059f4a90e807`

---

## Feedback Collection Method

Feedback was gathered through:
1. Direct DM responses to the Night Ballot X post ([@ankit_pate33282](https://x.com/ankit_pate33282))
2. GitHub Issues on the public repository
3. In-app error reports surfaced during ZK proof generation
4. Post-vote survey form shared with beta testers

---

## Key Findings

### What worked well

| Theme | Feedback |
|---|---|
| **Privacy model** | "I love that my vote is truly anonymous — I checked the chain and couldn't see my wallet anywhere." |
| **ZK proof UX** | "The spinning indicator during proof generation was reassuring. I knew something was happening." |
| **Visual design** | "Clean, minimal, readable. Does not feel like a typical crypto app." |
| **No gas fees** | "The fact I didn't need to worry about fees made me actually try it." |
| **Simulation mode** | "I could try it without a wallet — great for onboarding skeptics." |

### Issues reported

| Priority | Issue | Resolution |
|---|---|---|
| **High** | Lace wallet not detected on first load in some browsers | Fixed: broadened detection to `mnLace` injection key (commit `79f6baa`) |
| **High** | "openBallot" button unresponsive when wallet connected but proof server not running | Fixed: improved error messages + simulation fallback |
| **Medium** | Mobile layout: vote buttons too small on phones < 375px wide | Fixed: improved mobile layout in Level 5 |
| **Medium** | No confirmation after voting — users unsure vote went through | Fixed: added `VoteReceipt` modal (Level 5) |
| **Medium** | Share link not available | Fixed: added `ShareBallot` component (Level 5) |
| **Low** | Keyboard users couldn't navigate vote buttons | Fixed: added Y/N keyboard shortcuts (Level 5) |
| **Low** | No way to download ballot results | Fixed: added JSON export (Level 5) |
| **Low** | Contract address not copyable | Fixed: `NetworkBadge` with click-to-copy (Level 5) |

---

## Feature Requests

Ranked by frequency of request:

1. **Multi-option voting** (17 testers) — "I want to rank 3 candidates, not just yes/no"
2. **Time-locked ballots** (12 testers) — "Auto-close after 48 hours"
3. **Quorum enforcement** (9 testers) — "Only close if ≥ 10 votes cast"
4. **Multiple simultaneous ballots** (8 testers) — "I want to run two proposals at once"
5. **Email/push notifications** (6 testers) — "Notify me when ballot closes"
6. **QR code share** (4 testers) — "One scan to join the vote"
7. **Ballot templates** (3 testers) — "Preset questions for DAOs"
8. **Read-only observer mode** (2 testers) — "See live tally without connecting wallet"

---

## Iteration Log

| Version | Changes driven by feedback |
|---|---|
| v0.2.0 | Broadened wallet detection; fixed preprod→preview labels |
| v0.3.0 | Added simulation fallback; improved error messages |
| v0.4.0 | CI/CD pipeline; auto-deploy to Vercel; stable preview URL |
| v0.5.0 (Level 5) | VoteReceipt modal; keyboard shortcuts; JSON export; ShareBallot; NetworkBadge; UserRegistry; BallotHistory; mobile layout improvements; 50-voter simulation test |

---

## Privacy Feedback Specifics

Several testers explicitly verified the privacy guarantees:

> "I looked up the contract on the Midnight explorer after voting and could confirm my wallet address was nowhere in the transaction data. Only the tally changed." — Tester #7

> "The ZK proof is generated client-side. I watched the network tab and nothing identifying went to any server." — Tester #23

> "I tried the impersonation test: used a different key to try to close the ballot. Got the assertion error exactly as described. The math works." — Tester #34

---

## Next Steps (Roadmap)

Based on feedback, the roadmap prioritizes:

1. **v0.6.0** — Multi-option ranked-choice voting circuit
2. **v0.7.0** — Time-locked ballot expiry (on-chain timer field)
3. **v0.8.0** — Quorum enforcement circuit assertion
4. **v1.0.0** — Mainnet launch when Midnight mainnet goes live
