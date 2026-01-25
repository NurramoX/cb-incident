export default function EventInfo() {
  return (
    <div class="flex items-center justify-center gap-4 px-6 py-4 bg-dark-bg/80 border border-crimson/40 w-full">
      {/* Date */}
      <div class="flex flex-col items-center leading-none">
        <span class="font-orbitron text-[2.5rem] font-black text-pale-gold [text-shadow:0_0_20px_rgba(212,175,55,0.5)]">
          07
        </span>
        <span class="font-orbitron text-[0.9rem] font-bold text-crimson tracking-[0.2em] [text-shadow:0_0_10px_var(--color-crimson)]">
          FEB
        </span>
        <span class="font-orbitron text-[0.65rem] text-white/40 tracking-[0.15em] mt-0.5">
          2026
        </span>
      </div>

      {/* Divider */}
      <div class="w-0.5 h-[50px] [background:linear-gradient(180deg,transparent,var(--color-crimson),transparent)]" />

      {/* Time & Location */}
      <div class="flex flex-col gap-1">
        <div class="font-orbitron text-[1.4rem] font-bold text-white [text-shadow:0_0_10px_rgba(255,255,255,0.3)]">
          20:30
        </div>
        <div class="font-rajdhani text-base text-white/70 font-medium">
          Club Berlin · Raum C
        </div>
      </div>
    </div>
  )
}
