type Props = {
  count?: number;
};

export function UserRegistry({ count = 50 }: Props) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-lg shrink-0">
          👥
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white">
            {count} beta testers onboarded
          </div>
          <div className="text-[11px] text-white/40 mt-0.5">
            Verified wallet addresses on Midnight Preview ·{' '}
            <a
              href="https://github.com/ankit79600/Night-Ballot/blob/main/docs/preprod-users.md"
              target="_blank"
              rel="noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              view list ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
