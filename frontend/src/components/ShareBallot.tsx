import { useState } from 'react';

type Props = {
  proposal: string | null;
};

export function ShareBallot({ proposal }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#vote`
    : 'https://night-ballot-hl7r.vercel.app/#vote';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  const handleTwitter = () => {
    const text = proposal
      ? `Vote on "${proposal}" — anonymously via ZK proofs on Midnight Network`
      : 'Anonymous on-chain voting via ZK proofs — Night Ballot on Midnight Network';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleCopy}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-[12px] text-white/50 hover:text-white/80">
        {copied ? '✓ Copied' : '⧉ Copy link'}
      </button>
      <button onClick={handleTwitter}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-[12px] text-white/50 hover:text-white/80">
        Share on X
      </button>
    </div>
  );
}
