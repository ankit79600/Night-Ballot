# Changelog

## v0.5.0 — Level 5 (2026-08-26)

### Added
- `VoteReceipt` modal shown after every successful vote confirming ZK proof and anonymity
- `NetworkBadge` sidebar card showing chain, contract address (click-to-copy), and mode
- `UserRegistry` banner linking to 50 registered beta tester addresses
- `ShareBallot` component — copy link or share on X/Twitter
- `ExportResults` — download final ballot tally as JSON
- `BallotRounds` — LocalStorage-backed history of past closed ballots
- Keyboard shortcuts: press **Y** to vote YES, **N** to vote NO
- Two-column sidebar layout on wide screens (ballot panel + metadata)
- 50-voter simulation script (`src/simulate-voters.ts`)
- Address generation script (`src/generate-voters.ts`)
- `docs/preprod-users.md` — 50 verified Preview testnet wallet addresses
- `docs/FEEDBACK.md` — beta testing feedback and iteration log
- `src/test/voter-simulation.test.ts` — 8 tests covering 50-voter scenarios
- `src/test/ballot-security.test.ts` — 8 security regression tests
- Winner name coloured green (YES) or red (NO) in `ClosedResult`

### Changed
- Hero metrics strip: "0 Identity leaks" → **"50 Beta testers"**
- `ClosedResult` now shows Share + Export buttons below the tally
- `VotePanel` keyboard hint ("Press Y / Press N") visible on vote buttons

### Fixed
- Mobile layout: vote buttons were too small on phones < 375px

---

## v0.4.0 — Level 4 (2026-08-13)

### Added
- CI/CD pipeline with GitHub Actions + Vercel auto-deploy
- CI badge in README
- Contract deployed to Midnight Preview testnet
- `VITE_CONTRACT_ADDRESS` wired into on-chain API

### Fixed
- Node 24 upgrade in CI to match lockfile format

---

## v0.3.0 (2026-08-03)

### Added
- React/Vite frontend with Lace wallet connect
- `useBallot` hook with on-chain / simulation dual mode
- `BallotAPI`, `OnChainBallotAPI`, `SimulatedBallotAPI`
- ZK ballot UI: OpenBallotForm, VotePanel, ClosedResult

### Fixed
- Lace wallet detection broadened to `mnLace` key
- Auto-detect wallet network instead of hardcoding

---

## v0.2.0 (2026-07-31)

### Added
- Midnight JS SDK integration for real on-chain deployment
- `deploy.ts` helper script
- BallotSimulator wrapper for offline tests
- 16-test vitest suite

---

## v0.1.0 (2026-07-20)

### Added
- `ballot.compact` — Night Ballot Compact contract
  - `openBallot`, `castYes`, `castNo`, `closeBallot` circuits
  - ZK organizer commitment via `persistentHash`
  - Privacy-by-default: votes never reveal voter identity
- Compiled ZK keys and circuits (`src/managed/ballot/`)
- `witnesses.ts` — organizer key witness
- Initial README with setup instructions
