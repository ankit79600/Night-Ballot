import { useState, useRef, useEffect } from 'react';
import type { WalletState } from '../hooks/useWallet';

type Props = {
  walletState: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function WalletBar({ walletState: state, onConnect: connect, onDisconnect: disconnect }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const short = (addr: string) => `${addr.slice(0, 10)}…${addr.slice(-4)}`;

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <span className="text-lg">🗳️</span>
          <span className="font-semibold text-sm tracking-tight">Night Ballot</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 uppercase tracking-wider">preview</span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-[13px] text-white/40">
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
          <a href="#vote" className="hover:text-white transition-colors">Vote</a>
        </nav>

        <div className="flex items-center gap-3">
          {state.status === 'connected' && (
            <div ref={popoverRef} className="relative flex items-center gap-2 text-[12px] text-white/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <button
                onClick={() => setOpen(v => !v)}
                className="font-mono hidden sm:block hover:text-white transition-colors cursor-pointer"
              >
                {short(state.info.address)}
              </button>

              {open && (
                <div className="absolute top-8 right-0 z-50 w-[340px] rounded-xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
                  <p className="text-[11px] text-white/40 mb-2 uppercase tracking-wider">Your Wallet Address</p>
                  <p className="font-mono text-[11px] text-emerald-400 break-all leading-relaxed mb-3">
                    {state.info.address}
                  </p>
                  <button
                    onClick={() => copyAddress(state.info.address)}
                    className="w-full h-8 text-[12px] font-medium rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
                  >
                    {copied ? '✓ Copied!' : 'Copy Address'}
                  </button>
                </div>
              )}
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
