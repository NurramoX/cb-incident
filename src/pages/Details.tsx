import { A } from '@solidjs/router'
import Background from '../components/Background'
import Particles from '../components/Particles'
import Countdown from '../components/Countdown'

export default function Details() {
  return (
    <>
      <Background darker />
      <Particles />

      <div class="relative w-full min-h-screen flex flex-col items-center justify-center py-5 px-4">
        <div class="relative z-10 w-full max-w-[500px] flex flex-col items-center gap-12">
          {/* Header */}
          <div class="text-center">
            <h1 class="font-orbitron font-black text-[2rem] text-transparent [-webkit-text-stroke:1.5px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5),0_0_24px_rgba(212,175,55,0.3)] tracking-[0.1em] mb-0.5">
              CB INCIDENT
            </h1>
            <div class="font-orbitron text-[0.85rem] text-crimson uppercase tracking-[0.25em] [text-shadow:0_0_8px_var(--color-crimson)] mb-1.5">
              // The Details //
            </div>
          </div>

          {/* Rules */}
          <RulesBox title="🎮 MINI-GAME BATTLE*" delay={0}>
            Form teams of 2 for the showdown. Flying solo? No problem — you'll be paired with another lone wolf.
            <br /><br />
            <span class="text-pale-gold font-semibold">5 Games</span> → <span class="text-pale-gold font-semibold">1 Final</span> → Top 2 teams battle it out!
            <br /><br />
            No clear top 2? <span class="text-pale-gold font-semibold">Tiebreaker Quiz</span> decides who advances!
            <br /><br />
            🕐 <span class="text-pale-gold font-semibold">Games start at 22:30</span>
            <br /><br />
            Titles will be announced <span class="text-pale-gold font-semibold">1 day before</span> the event on this website
          </RulesBox>

          <RulesBox title="🎟️ REGISTRATIONS CLOSED" delay={1}>
            Registrations are now closed. Thank you to everyone who signed up!
            <br /><br />
            Already registered? <A href="/game/login" class="text-pale-gold font-semibold underline">Login here</A> to manage your team.
          </RulesBox>

          <RulesBox title="🎮 THE GAMES" delay={0.75}>
            Want to know what you'll be playing?
            <br /><br />
            <A href="/games" class="text-pale-gold font-semibold text-xl underline">View all games →</A>
          </RulesBox>


          <RulesBox title="🎵 MUSIC" delay={0.5}>
            A shared Spotify playlist drops <span class="text-pale-gold font-semibold">3 days before</span> the event — add your bangers and let's vibe together!
          </RulesBox>

          <RulesBox title="Any Questions or Issues?" delay={1.5}>
            Always feel free to ask me personally on WhatsApp!

            I'll try to respond as soon as possible!
          </RulesBox>

          {/* Back Link */}
          <div class="font-orbitron text-[0.65rem] text-white/40 tracking-[0.2em] uppercase mt-2">
            <A
              href="/"
              class="text-[#888] no-underline transition-all duration-300 px-3 py-1.5 border border-transparent text-[0.85rem] hover:text-pale-gold hover:border-crimson hover:bg-crimson/10"
            >
              ← Back to Main
            </A>
          </div>

          <Countdown label="SEE YOU THERE IN" />
        </div>
      </div>
    </>
  )
}

function RulesBox(props: { title: string; delay: number; children: any }) {
  return (
    <div
      class="bg-black/70 border-l-[3px] border-l-crimson py-3.5 px-4 w-full [box-shadow:0_0_20px_rgba(220,20,60,0.3),0_0_40px_rgba(220,20,60,0.1)] [animation:glow-pulse_4s_ease-in-out_infinite]"
      style={{ 'animation-delay': `${props.delay}s` }}
    >
      <div class="font-orbitron text-[0.9rem] text-crimson mb-2 tracking-[0.08em]">
        {props.title}
      </div>
      <div class="text-[0.95rem] text-[#ccc] leading-[1.5]">
        {props.children}
      </div>
    </div>
  )
}
