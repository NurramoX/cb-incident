import { A } from '@solidjs/router'
import Background from '../components/Background'
import Particles from '../components/Particles'
import EventInfo from '../components/EventInfo'
import Countdown from '../components/Countdown'

export default function Home() {
  return (
    <>
      <Background />
      <Particles />

      <div class="relative w-full min-h-screen flex flex-col items-center justify-center p-4">
        <div class="relative z-10 w-full max-w-[480px] flex flex-col items-center gap-6">
          {/* Title */}
          <h1 class="font-orbitron font-black text-[2rem] text-center text-transparent [-webkit-text-stroke:1.5px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5),0_0_24px_rgba(212,175,55,0.3)] tracking-[0.1em] mb-0.5">
            CB INCIDENT
          </h1>

          <EventInfo />

          {/* Features */}
          <div class="w-full">
            <div class="font-orbitron text-[0.85rem] text-gold uppercase tracking-[0.15em] mb-2.5 text-center [text-shadow:0_0_8px_rgba(212,175,55,0.5)]">
              // WHAT'S GOING DOWN //
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <FeatureCard emoji="🎧" title="BE YOUR OWN DJ" desc="2000s • 2010s • White Girl Anthems • Bangers" />
              <FeatureCard emoji="🎮" title="MINI-GAME BATTLE*" desc="5 Games • 1 Final • Tiebreaker Quiz" />
              <FeatureCard emoji="👥" title="TEAM UP" desc="Bring a partner or go solo — we'll match you!" />
              <FeatureCard emoji="🎉" title="PARTY HARD" desc="Private venue, our rules, maximum vibes" />
            </div>
          </div>

          {/* Prize Banner */}
          <div class="w-full p-0.5 [background:linear-gradient(90deg,var(--color-blood-red),var(--color-crimson),var(--color-blood-red))] bg-[length:200%_200%] [animation:gradient-shift_4s_ease_infinite]">
            <div class="bg-dark-bg p-3.5 text-center">
              <div class="font-orbitron text-[0.8rem] text-crimson tracking-[0.2em] mb-1">
                🏆 GRAND PRIZE 🏆
              </div>
              <div class="font-orbitron text-[2.8rem] font-black text-pale-gold [text-shadow:0_0_8px_var(--color-gold),0_0_16px_rgba(212,175,55,0.5)]">
                €50
              </div>
              <div class="text-[0.9rem] text-[#aaa] mt-1 flex items-center justify-center gap-1.5">
                2x €25 Amazon giftcard
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f0e68c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="8" width="18" height="4" rx="1" />
                  <path d="M12 8v13" />
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                  <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 4.8 0 0 1 12 8a4.8 4.8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                </svg>
                for the winning team
              </div>
            </div>
          </div>

          {/* Details Link */}
          <div class="font-rajdhani text-[0.9rem] text-[#888] text-center mt-1">
            <A
              href="/details"
              class="text-[#888] no-underline transition-all duration-300 px-3 py-1.5 border border-transparent text-[0.85rem] hover:text-pale-gold hover:border-crimson hover:bg-crimson/10"
            >
              <span class="text-pale-gold">*</span> More details →
            </A>
          </div>

          <Countdown label="INITIALIZING INCIDENT IN" />
        </div>
      </div>
    </>
  )
}

function FeatureCard(props: { emoji: string; title: string; desc: string }) {
  return (
    <div class="bg-dark-bg/90 border border-crimson/50 py-3.5 px-2.5 text-center relative overflow-hidden transition-all duration-300 hover:border-crimson hover:shadow-[0_0_20px_rgba(220,20,60,0.4)] group">
      {/* Scan line */}
      <div class="absolute top-0 left-[-100%] w-full h-0.5 [background:linear-gradient(90deg,transparent,var(--color-neon-red),transparent)] [animation:scan_4s_infinite]" />
      <div class="text-[1.8rem] mb-1.5">{props.emoji}</div>
      <div class="text-[0.8rem] text-[#ccc] leading-[1.4]">
        <span class="text-pale-gold font-semibold text-[0.9rem]">{props.title}</span>
        <br />
        {props.desc}
      </div>
    </div>
  )
}
