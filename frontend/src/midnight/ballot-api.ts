/**
 * Ballot API — wraps the compiled contract for use in the frontend.
 *
 * ON-CHAIN MODE (default when wallet connected + CONTRACT_ADDRESS set):
 *   Uses @midnight-ntwrk/midnight-js-contracts to submit real ZK circuit
 *   transactions via the deployed Preprod contract.
 *
 * SIMULATION MODE (fallback when no contract address or no wallet):
 *   Runs circuits locally using compact-runtime with in-memory state.
 *   No proof server or wallet required.
 */

import * as runtime from '@midnight-ntwrk/compact-runtime';
import { findDeployedContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import {
  Contract,
  ledger,
  type Ledger,
} from '../contract/index.js';
import { buildMidnightProviders } from './providers.js';
import { CONTRACT_ADDRESS } from './network.js';

export type { Ledger };

export type BallotState = {
  isOpen: boolean;
  proposal: string | null;
  yesVotes: bigint;
  noVotes: bigint;
  organizer: Uint8Array;
};

export type OrganizerKey = Uint8Array;

// ---------------------------------------------------------------------------
// On-chain API (Midnight Preprod via Lace wallet)
// ---------------------------------------------------------------------------

export class OnChainBallotAPI {
  private constructor(
    private readonly foundContract: Awaited<ReturnType<typeof findDeployedContract>>,
    private readonly providers: Awaited<ReturnType<typeof buildMidnightProviders>>,
  ) {}

  static async create(connectedApi: ConnectedAPI): Promise<OnChainBallotAPI> {
    if (!CONTRACT_ADDRESS) {
      throw new Error(
        'No contract address configured. Set VITE_CONTRACT_ADDRESS in your .env file.',
      );
    }

    const providers = await buildMidnightProviders(connectedApi);

    const witnesses = {
      organizerKey: (_ctx: unknown): [null, Uint8Array] => {
        // The organizer key is provided via the connected wallet's private state.
        // For voting circuits (castYes/castNo), this witness is not called.
        throw new Error(
          'organizerKey witness called on voting-only circuit — organizer key not available in browser.',
        );
      },
    };

    const contract = new Contract(witnesses as any);

    const foundContract = await findDeployedContract(providers as any, {
      contractAddress: CONTRACT_ADDRESS,
      contract,
      privateStateKey: 'ballot-private',
      initialPrivateState: null,
    } as any);

    return new OnChainBallotAPI(foundContract as any, providers);
  }

  async getState(): Promise<BallotState> {
    const states = await (this.foundContract as any).getStates();
    const l: Ledger = ledger(states.public.data);
    return {
      isOpen: l.isOpen === 1n,
      proposal: l.proposal.is_some ? l.proposal.value : null,
      yesVotes: l.yesVotes,
      noVotes: l.noVotes,
      organizer: l.organizer,
    };
  }

  async openBallot(proposal: string): Promise<void> {
    const callTx = (this.foundContract as any).callTx;
    const callTxData = await callTx.openBallot(proposal);
    await submitCallTx(this.providers as any, callTxData);
  }

  async castVote(vote: 'yes' | 'no'): Promise<void> {
    const callTx = (this.foundContract as any).callTx;
    if (vote === 'yes') {
      const callTxData = await callTx.castYes();
      await submitCallTx(this.providers as any, callTxData);
    } else {
      const callTxData = await callTx.castNo();
      await submitCallTx(this.providers as any, callTxData);
    }
  }

  async closeBallot(): Promise<void> {
    const callTx = (this.foundContract as any).callTx;
    const callTxData = await callTx.closeBallot();
    await submitCallTx(this.providers as any, callTxData);
  }
}

// ---------------------------------------------------------------------------
// Simulation API (compact-runtime, no wallet or proof server needed)
// ---------------------------------------------------------------------------

const DUMMY_KEY: runtime.EncodedCoinPublicKey = { bytes: new Uint8Array(32) };

export class SimulatedBallotAPI {
  private contract: Contract<null>;
  private contractState: runtime.ContractState;
  private privateState: null = null;
  private zswapState: runtime.EncodedZswapLocalState;

  constructor(organizerKey: OrganizerKey) {
    this.contract = new Contract({
      organizerKey: (_ctx: unknown) => [null, organizerKey],
    });

    const init = this.contract.initialState(
      runtime.createConstructorContext(null, DUMMY_KEY),
    );
    this.contractState = init.currentContractState;
    this.privateState = init.currentPrivateState;
    this.zswapState = init.currentZswapLocalState;
  }

  getState(): BallotState {
    const l = ledger(this.contractState.data);
    return {
      isOpen: l.isOpen === 1n,
      proposal: l.proposal.is_some ? l.proposal.value : null,
      yesVotes: l.yesVotes,
      noVotes: l.noVotes,
      organizer: l.organizer,
    };
  }

  private ctx(): runtime.CircuitContext<null> {
    return runtime.createCircuitContext(
      runtime.dummyContractAddress(),
      this.zswapState.coinPublicKey,
      this.contractState.data,
      this.privateState,
    );
  }

  private sync(result: runtime.CircuitResults<null, unknown>): void {
    this.contractState.data = new runtime.ChargedState(
      result.context.currentQueryContext.state.state,
    );
    this.privateState = result.context.currentPrivateState;
    this.zswapState = result.context.currentZswapLocalState;
  }

  async openBallot(proposal: string): Promise<void> {
    this.sync(this.contract.circuits.openBallot(this.ctx(), proposal));
  }

  async castVote(vote: 'yes' | 'no'): Promise<void> {
    if (vote === 'yes') {
      this.sync(this.contract.circuits.castYes(this.ctx()));
    } else {
      this.sync(this.contract.circuits.castNo(this.ctx()));
    }
  }

  async closeBallot(): Promise<void> {
    this.sync(this.contract.circuits.closeBallot(this.ctx()));
  }
}

// ---------------------------------------------------------------------------
// Unified BallotAPI — selects on-chain or simulation based on wallet state
// ---------------------------------------------------------------------------

export type BallotMode = 'onchain' | 'simulation';

export class BallotAPI {
  private onChain: OnChainBallotAPI | null = null;
  private simulated: SimulatedBallotAPI;
  private mode: BallotMode;

  constructor(organizerKey: OrganizerKey) {
    this.simulated = new SimulatedBallotAPI(organizerKey);
    this.mode = 'simulation';
  }

  async connectWallet(connectedApi: ConnectedAPI): Promise<void> {
    try {
      this.onChain = await OnChainBallotAPI.create(connectedApi);
      this.mode = 'onchain';
    } catch (err) {
      console.warn('[BallotAPI] On-chain mode unavailable, using simulation:', err);
      this.mode = 'simulation';
    }
  }

  disconnectWallet(): void {
    this.onChain = null;
    this.mode = 'simulation';
  }

  getMode(): BallotMode {
    return this.mode;
  }

  async getState(): Promise<BallotState> {
    if (this.mode === 'onchain' && this.onChain) {
      return this.onChain.getState();
    }
    return this.simulated.getState();
  }

  getSimulatedState(): BallotState {
    return this.simulated.getState();
  }

  async openBallot(proposal: string): Promise<void> {
    if (this.mode === 'onchain' && this.onChain) {
      return this.onChain.openBallot(proposal);
    }
    return this.simulated.openBallot(proposal);
  }

  async castVote(vote: 'yes' | 'no'): Promise<void> {
    if (this.mode === 'onchain' && this.onChain) {
      return this.onChain.castVote(vote);
    }
    return this.simulated.castVote(vote);
  }

  async closeBallot(): Promise<void> {
    if (this.mode === 'onchain' && this.onChain) {
      return this.onChain.closeBallot();
    }
    return this.simulated.closeBallot();
  }
}
