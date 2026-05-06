export function HudFrame() {
  return (
    <>
      {/* ─── Barre du haut — identitaire (titre + cartouche IAU) ────── */}
      <div className="absolute top-0 inset-x-0 h-11
                      bg-linear-to-b from-[#0d0825]/95 via-[#0d0825]/70 to-transparent">
        <div className="absolute bottom-0 inset-x-0 h-px
                        bg-linear-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="flex items-center justify-between h-full px-5 sm:px-6">

          <div className="flex items-center gap-2 text-[10px] tracking-[0.35em]">
            <MoonGlyph />
            <span className="text-violet-100">CARTE&nbsp;DU&nbsp;CIEL&nbsp;RÉEL</span>
          </div>

          <div className="text-[9px] tracking-[0.25em] text-slate-500 flex items-center gap-2">
            <span>IAU&nbsp;1930</span>
            <StarDot />
          </div>
        </div>
      </div>

      {/* ─── Séparateur bas ─────────────────────────────────────────── */}
      <div className="absolute bottom-20 inset-x-0 h-px
                      bg-linear-to-r from-transparent via-violet-400/20 to-transparent" />
    </>
  );
}

function MoonGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-violet-300">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="0.9" />
      <path d="M7 1.5 C4.5 1.5 2.5 4 2.5 7 C2.5 10 4.5 12.5 7 12.5 C5.2 11 4.2 9.1 4.2 7 C4.2 4.9 5.2 3 7 1.5Z"
            fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function StarDot() {
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" className="text-slate-500">
      <path d="M3.5 0 L4.1 2.9 L7 3.5 L4.1 4.1 L3.5 7 L2.9 4.1 L0 3.5 L2.9 2.9 Z"
            fill="currentColor" />
    </svg>
  );
}
