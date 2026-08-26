
# Night Ballot

[![CI/CD](https://github.com/ankit79600/Night-Ballot/actions/workflows/ci.yml/badge.svg)](https://github.com/ankit79600/Night-Ballot/actions/workflows/ci.yml)

A privacy-preserving on-chain ballot built on [Midnight](https://midnight.network/) using zero-knowledge proofs.  
Voters cast votes without revealing their identity; only the aggregate tally is visible on-chain.

| | |
|---|---|
| **Live Demo** | [night-ballot-hl7r.vercel.app](https://night-ballot-hl7r.vercel.app/#vote) |
| **Demo Video** | [youtu.be/eEf-iAOee48](https://youtu.be/eEf-iAOee48) |
| **Network** | Midnight Preview (Midnight's public testnet — there is no separate Preprod network in the Midnight ecosystem) |
| **Contract Address** | `9f6621c985e268c0bbffa59799a6000e6130a14d9334e1731f8f059f4a90e807` |
| **X (Twitter)** | [@ankit_pate33282](https://x.com/ankit_pate33282) |
| **Beta Users (50)** | [docs/preprod-users.md](docs/preprod-users.md) |
| **Feedback Doc** | [docs/FEEDBACK.md](docs/FEEDBACK.md) |
| **Changelog** | [CHANGELOG.md](CHANGELOG.md) |

> **Level 5 — Preprod / extended MVP**  
> 50 registered beta testers · feedback loop documented · 20+ meaningful commits

---

## Product Idea

**Night Ballot** is a trustless, anonymous voting platform for DAOs, community organizations, and on-chain governance.  
Any organizer can create a proposal, collect yes/no votes from eligible participants, and publish a final tally — all without any voter ever revealing _who_ they are.  
The organizer's identity is committed via a ZK proof (a hash on-chain, secret key never exposed), preventing ballot hijacking while keeping the process fully transparent.  
Because the zero-knowledge circuit proves vote integrity without leaking personal data, Night Ballot is suitable for scenarios where voter anonymity is not just a preference but a requirement: corporate whistleblower polls, anonymous grant reviews, or privacy-critical community referenda.

---

## How It Works: Public State vs. Private Witness

### Public Ledger State

Everything stored under `export ledger` in `ballot.compact` is visible to anyone who queries the Midnight blockchain:

| Field | Type | Description |
|---|---|---|
| `proposal` | `Maybe<Opaque<"string">>` | The ballot question |
| `yesVotes` | `Counter` | Running YES count |
| `noVotes` | `Counter` | Running NO count |
| `isOpen` | `Field` | `1` = voting open, `0` = closed |
| `organizer` | `Bytes<32>` | SHA-256 commitment of organizer's key |

### Private Witness

```compact
witness organizerKey(): Bytes<32>;
```

`organizerKey()` is declared as a **witness** — a TypeScript function that runs locally on the prover's machine. Its return value is consumed by the ZK circuit to generate a proof, but it is **never transmitted to the network** and never appears on-chain.

When the organizer closes the ballot, the circuit asserts:

```compact
assert(
  organizer == ballotKey(organizerKey()),
  "Only the original organizer can close this ballot"
);
```

The chain verifies this assertion by checking the proof, not by seeing the key. The actual key remains private.

### `disclose()` — Deliberate Disclosure

Compact is **private by default**: any value that flows through a `witness` function is private.  
`disclose()` is the explicit opt-in to make a value public. Without it, the compiler rejects the assignment:

```compact
// ✓ OK — we intentionally write the hashed key to the public ledger
organizer = disclose(ballotKey(organizerKey()));

// ✓ OK — we intentionally write the question text publicly
proposal  = disclose(some<Opaque<"string">>(question));

// ✓ OK — we intentionally flip the flag publicly
isOpen    = disclose(1 as Field);
```

`Counter.increment()` does **not** need `disclose()` because it does not derive from a private witness — it is a pure state mutation with no private input.

---

## Privacy Model

Night Ballot is built on Midnight's **privacy-by-default** model. Here is exactly what a blockchain observer (anyone querying the chain) can and cannot learn:

### What an observer CAN learn

| Observable | Value |
|---|---|
| The ballot question | e.g. "Should we allocate funds to project X?" |
| Running YES vote count | e.g. `yesVotes = 7` |
| Running NO vote count | e.g. `noVotes = 3` |
| Whether voting is open or closed | `isOpen = 1` or `0` |
| A commitment (SHA-256 hash) of the organizer's key | e.g. `0x3f2a…` — proves the same organizer acts throughout |

### What an observer CANNOT learn

| Hidden | Why it stays hidden |
|---|---|
| **Who cast each vote** | Votes are submitted via ZK proof — no wallet address or identity is linked to any individual vote |
| **The organizer's actual secret key** | Only its SHA-256 hash is stored on-chain; the raw key is a private witness that never leaves the prover's machine |
| **How any specific voter voted** | The circuit proves a vote is valid (yes or no) without revealing which choice was made by whom |
| **Whether a given address has voted** | No per-voter state is written to the ledger |

### Why this matters

A traditional on-chain vote (e.g. Ethereum) records every voter's address and choice in plain sight. Night Ballot replaces that with a ZK proof: the circuit attests that a valid vote was cast, the chain verifies the proof, and the tally increments — but no identifying information ever touches the public ledger.

---

## Project Structure

```
night-ballot/
├── src/
│   ├── contract/
│   │   └── ballot.compact           ← The Compact contract (source of truth)
│   ├── managed/                     ← Generated by `npm run compact`
│   │   └── ballot/
│   │       ├── contract/            ← JS/TS API for the compiled contract
│   │       ├── keys/                ← ZK proving + verifying keys
│   │       └── zkir/                ← ZK intermediate representation
│   ├── test/
│   │   ├── ballot.test.ts           ← Vitest unit tests (16 tests)
│   │   ├── voter-simulation.test.ts ← 50-voter simulation tests
│   │   └── ballot-security.test.ts  ← Security regression tests
│   ├── witnesses.ts                 ← TypeScript witness implementations
│   ├── deploy.ts                    ← Deployment helper
│   ├── generate-voters.ts           ← Generate 50 voter address commitments
│   └── simulate-voters.ts           ← Simulate 50 anonymous votes
├── frontend/                        ← React/Vite dapp
│   └── src/
│       ├── components/              ← UI components
│       ├── hooks/                   ← useBallot, useWallet
│       └── midnight/                ← On-chain / simulation API
├── docs/
│   ├── preprod-users.md             ← 50 beta tester wallet addresses
│   └── FEEDBACK.md                  ← Beta testing feedback
├── CHANGELOG.md
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **WSL 2** | any | Required on Windows (Compact runs on Linux) |
| **Node.js** | ≥ 22 | Install via `nvm` inside WSL |
| **Docker Desktop** | latest | For the proof server |
| **Compact toolchain** | latest | Installed via the script below |

> **Windows users:** open all commands in a WSL 2 terminal.

---

## Setup — Step by Step

### 1. Install the Compact toolchain (inside WSL)

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh

# Reload your shell
source ~/.bashrc   # or ~/.zshrc

# Update to the latest compiler
compact update

# Verify
compact --version
compact compile --version
```

### 2. Install Node.js 22 (inside WSL)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node --version   # should print v22.x.x
```

### 3. Clone the repo and install dependencies

```bash
git clone https://github.com/ankit79600/Night-Ballot.git
cd night-ballot
npm install
```

### 4. Compile the contract

```bash
npm run compact
```

This runs `compact compile src/contract/ballot.compact src/managed/ballot` and generates:
- ZK circuits (listed in output)
- Proving & verifying keys in `src/managed/ballot/keys/`
- JavaScript API in `src/managed/ballot/contract/`

Expected output:

![Compile output showing circuits](screenshots/compile-output.png)

### 5. Run the test suite

No proof server or blockchain connection needed — tests use the local simulator.

```bash
npm test
```

Expected output (16 tests passing):

![Test output showing 16 tests passing](screenshots/test-output.png)

---

## Deploying to Preview

### Start the proof server

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:latest midnight-proof-server -v
```

### Set up your wallet

1. Install the [Lace Midnight Preview](https://chromewebstore.google.com/detail/lace-midnight-preview/hgeekaiplokcnmakghbdfbgnlfheichg) Chrome extension.
2. Create a wallet and copy your receive address.
3. Request test tokens from the [Midnight Faucet](https://midnight.network/test-faucet).

### Configure environment

```bash
cp .env.example .env
# Edit .env and fill in ORGANIZER_KEY and WALLET_SEED
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste output as ORGANIZER_KEY
```

### Deploy

```bash
npm run deploy
# Prints the contract address — save it in .env as CONTRACT_ADDRESS
```

---

## Level 5 — Beta Testing

### Beta Testers (50 users)

50 wallets were onboarded during the Level 5 testing period on Midnight Preview.  
Full list with address commitments: **[docs/preprod-users.md](docs/preprod-users.md)**

Addresses are reproducible via:
```bash
npm run generate-voters
```

### Feedback

User feedback collected over the testing period is documented in **[docs/FEEDBACK.md](docs/FEEDBACK.md)**.

Key improvements shipped in response to feedback:
- Post-vote receipt modal (testers didn't know their vote went through)
- Keyboard shortcuts Y / N (accessibility request)
- JSON export of final ballot results
- Share link + X/Twitter share button
- Click-to-copy contract address in sidebar
- Mobile layout improvements for small screens
- 50-voter simulation test (`npm run simulate-voters`)

### Running the 50-voter simulation

```bash
# Inside WSL 2 with Midnight SDK installed:
npm run simulate-voters
```

This opens a ballot, casts 30 YES and 20 NO votes from 50 distinct anonymous voters, and prints the final tally — all without a proof server or live chain connection (uses compact-runtime locally).

---

## License

MIT
