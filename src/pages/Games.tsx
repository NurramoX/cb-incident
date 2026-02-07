import { A } from '@solidjs/router'
import Background from '../components/Background'
import Particles from '../components/Particles'

export default function Games() {
  return (
    <>
      <Background darker />
      <Particles />

      <div class="relative w-full min-h-screen flex flex-col items-center justify-center py-5 px-4">
        <div class="relative z-10 w-full max-w-125 flex flex-col items-center gap-12">
          {/* Header */}
          <div class="text-center">
            <h1 class="font-orbitron font-black text-[2rem] text-transparent [-webkit-text-stroke:1.5px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5),0_0_24px_rgba(212,175,55,0.3)] tracking-widest mb-0.5">
              CB INCIDENT
            </h1>
            <div class="font-orbitron text-[0.85rem] text-crimson uppercase tracking-[0.25em] [text-shadow:0_0_8px_var(--color-crimson)] mb-1.5">
              // The Games //
            </div>
          </div>

          <GameCard title="🥤 FLIP CUP RELAY" index={0}>
            Classic flip cup — but with a twist!
            <br /><br />
            After each successful flip, the player who flipped <span class="text-pale-gold font-semibold">switches out</span> with their teammate. Keep the relay going!
          </GameCard>

          <GameCard title="🧱 JENGA" index={1}>
            The tower of terror. Pull a block, place it on top, and pray it doesn't fall.
            <br /><br />
            After each turn, <span class="text-pale-gold font-semibold">switch</span> with your teammate.
          </GameCard>

          <GameCard title="🔴 4 IN A ROW" index={2}>
            The classic strategy game — drop your disc and try to connect four in a row before the other team does.
          </GameCard>

          <GameCard title="🏓 BEER PONG" index={3}>
            You know the rules. Sink cups. Win glory!
          </GameCard>

          <GameCard title="🏀 BOUNCE STREAK" index={4}>
            Bounce the ball off the table — first <span class="text-pale-gold font-semibold">1 time</span>, then <span class="text-pale-gold font-semibold">2</span>, then <span class="text-pale-gold font-semibold">3</span>, and so on. You <span class="text-neon-red font-semibold">cannot</span> reach over the table to grab it.
            <br /><br />
            The team with the <span class="text-pale-gold font-semibold">highest streak</span> wins. On a tiebreaker, the winner is decided by <span class="text-pale-gold font-semibold">rock-paper-scissors</span>.
            <br /><br />
            <a href="https://www.tiktok.com/@foxyhomestaging/video/7171662879735794945" target="_blank" rel="noopener noreferrer" class="text-pale-gold font-semibold underline">Watch an example →</a>
          </GameCard>

          {/* Navigation */}
          <div class="flex gap-4 font-orbitron text-[0.65rem] tracking-[0.2em] uppercase mt-2">
            <A
              href="/"
              class="text-[#888] no-underline transition-all duration-300 px-3 py-1.5 border border-transparent text-[0.85rem] hover:text-pale-gold hover:border-crimson hover:bg-crimson/10"
            >
              ← Home
            </A>
            <A
              href="/details"
              class="text-[#888] no-underline transition-all duration-300 px-3 py-1.5 border border-transparent text-[0.85rem] hover:text-pale-gold hover:border-crimson hover:bg-crimson/10"
            >
              Details →
            </A>
          </div>
        </div>
      </div>
    </>
  )
}

function GameCard(props: { title: string; index: number; children: any }) {
  return (
    <div
      class="bg-black/70 border-l-[3px] border-l-crimson py-3.5 px-4 w-full [box-shadow:0_0_20px_rgba(220,20,60,0.3),0_0_40px_rgba(220,20,60,0.1)] animate-[glow-pulse_4s_ease-in-out_infinite]"
      style={{ 'animation-delay': `${props.index * 0.5}s` }}
    >
      <div class="font-orbitron text-[0.9rem] text-crimson mb-2 tracking-[0.08em]">
        {props.title}
      </div>
      <div class="text-[0.95rem] text-[#ccc] leading-normal">
        {props.children}
      </div>
    </div>
  )
}
