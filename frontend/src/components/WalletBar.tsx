import type { WalletState } from '../hooks/useWallet';

type Props = {
  walletState: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function WalletBar({ walletState: state, onConnect: connect, onDisconnect: disconnect }: Props) {
  const short = (addr: string) => `${addr.slice(0, 10)}…${addr.slice(-4)}`;

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <span className="text-lg">🗳️</span>
          <span className="font-semibold text-sm tracking-tight">Night Ballot</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 uppercase tracking-wider">preprod</span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-[13px] text-white/40">
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
          <a href="#vote" className="hover:text-white transition-colors">Vote</a>
        </nav>

        <div className="flex items-center gap-3">
          {state.status === 'connected' && (
            <div className="flex items-center gap-2 text-[12px] text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="font-mono hidden sm:block">{short(state.info.address)}</span>
            </div>
          )}
          {state.status === 'error' && (
            <span className="text-[12px] text-red-400">{state.message}</span>
          )}
          {state.status === 'connected' ? (
            <button onClick={disconnect}
              className="h-8 px-4 text-[12px] font-medium rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all">
              Disconnect
            </button>
          ) : (
            <button onClick={connect} disabled={state.status === 'connecting'}
              className="h-8 px-4 text-[12px] font-semibold rounded-lg bg-white text-black hover:bg-white/90 disabled:opacity-40 transition-all">
              {state.status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
