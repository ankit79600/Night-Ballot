const steps = [
  {
    n: '01',
    icon: '🔑',
    title: 'Organizer opens the ballot',
    desc: 'Set a proposal question. Your secret key never leaves your device — only its cryptographic hash is stored on-chain via disclose(ballotKey(organizerKey())).',
  },
  {
    n: '02',
    icon: '⚡',
    title: 'ZK proof generated locally',
    desc: "Your browser runs the Compact circuit locally. The circuit proves your vote is valid without transmitting who you are. The proof is the only thing sent on-chain.",
  },
  {
    n: '03',
    icon: '🗳️',
    title: 'Vote submitted on-chain',
    desc: 'The Midnight blockchain verifies the proof. Yes/No tallies update publicly. Your identity never appears — not in the transaction, not in the ledger.',
  },
  {
    n: '04',
    icon: '✅',
    title: 'Result is final and verifiable',
    desc: 'Once the organizer closes the ballot, the tally is permanent. Anyone can verify the result on-chain. No voter can be identified, ever.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-[12px] font-semibold text-white/30 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-[40px] md:text-[52px] font-black tracking-tight text-white leading-tight max-w-lg">
            Privacy enforced by math, not trust.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-white/[0.06]">
          {steps.map((s) => (
            <div key={s.n} className="bg-black p-8 group hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between mb-6">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-[11px] font-bold text-white/15 tabular-nums">{s.n}</span>
              </div>
              <h3 className="text-[18px] font-semibold text-white mb-3 leading-snug">{s.title}</h3>
              <p className="text-[14px] text-white/40 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
