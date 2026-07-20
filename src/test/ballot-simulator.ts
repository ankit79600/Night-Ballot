import * as runtime from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, type Ledger } from '../managed/ballot/contract/index.js';

export type SimpleWitnesses = {
  organizerKey: () => Uint8Array;
};

/**
 * Wraps the generated Contract class with a simple, stateful API for testing.
 * The compact compiler (0.16.x) does not generate a simulator, so we build one
 * that manages ledger state internally and adapts the simplified test witness
 * signature ({ organizerKey: () => Uint8Array }) to the tuple form the Contract
 * requires ({ organizerKey: (ctx) => [privateState, Uint8Array] }).
 */
export class BallotSimulator {
  private readonly contract: Contract<null>;
  private contractState: runtime.ContractState;
  private privateState: null = null;
  private zswapState: runtime.EncodedZswapLocalState;

  constructor(witnesses: SimpleWitnesses) {
    this.contract = new Contract({
      organizerKey: (_ctx) => [null, witnesses.organizerKey()],
    });

    const dummyKey: runtime.EncodedCoinPublicKey = { bytes: new Uint8Array(32) };
    const { currentContractState, currentPrivateState, currentZswapLocalState } =
      this.contract.initialState(runtime.createConstructorContext(null, dummyKey));

    this.contractState = currentContractState;
    this.privateState = currentPrivateState;
    this.zswapState = currentZswapLocalState;
  }

  get ledger(): Ledger {
    return ledger(this.contractState.data);
  }

  private buildCtx(): runtime.CircuitContext<null> {
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
    this.sync(this.contract.circuits.openBallot(this.buildCtx(), proposal));
  }

  async castYes(): Promise<void> {
    this.sync(this.contract.circuits.castYes(this.buildCtx()));
  }

  async castNo(): Promise<void> {
    this.sync(this.contract.circuits.castNo(this.buildCtx()));
  }

  async closeBallot(): Promise<void> {
    this.sync(this.contract.circuits.closeBallot(this.buildCtx()));
  }

  /** Copy on-chain state from another simulator (for impersonation tests). */
  injectStateFrom(other: BallotSimulator): void {
    this.contractState.data = new runtime.ChargedState(other.contractState.data.state);
    this.zswapState = other.zswapState;
  }
}
