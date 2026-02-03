import { createSignal, onMount, onCleanup } from 'solid-js'

interface CountdownProps {
  label: string
  size?: 'default' | 'large'
}

export default function Countdown(props: CountdownProps) {
  const eventDate = new Date('2026-02-07T20:30:00').getTime()

  const [days, setDays] = createSignal('00')
  const [hours, setHours] = createSignal('00')
  const [minutes, setMinutes] = createSignal('00')
  const [seconds, setSeconds] = createSignal('00')

  const updateCountdown = () => {
    const now = Date.now()
    const diff = Math.max(0, eventDate - now)

    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)

    setDays(String(d).padStart(2, '0'))
    setHours(String(h).padStart(2, '0'))
    setMinutes(String(m).padStart(2, '0'))
    setSeconds(String(s).padStart(2, '0'))
  }

  onMount(() => {
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    onCleanup(() => clearInterval(interval))
  })

  const isLarge = () => props.size === 'large'

  const Block = (p: { value: string; unit: string }) => (
    <div class="flex flex-col items-center gap-0">
      <span class={`font-[Courier_New,monospace] font-black text-pale-gold leading-none [text-shadow:0_0_8px_var(--color-gold),0_0_15px_rgba(212,175,55,0.5)] ${isLarge() ? 'text-2xl' : 'text-base'}`}>
        {p.value}
      </span>
      <span class={`font-orbitron text-crimson [text-shadow:0_0_5px_var(--color-crimson)] mt-0.5 ${isLarge() ? 'text-[0.5rem]' : 'text-[0.35rem]'}`}>
        {p.unit}
      </span>
    </div>
  )

  const Sep = () => (
    <span class={`font-orbitron text-crimson opacity-40 -mt-1.5 ${isLarge() ? 'text-xl' : 'text-[0.8rem]'}`}>:</span>
  )

  return (
    <div class="flex flex-col items-center gap-2 mt-2">
      <span class="font-orbitron text-[0.55rem] text-white/40 tracking-[0.2em] uppercase">
        {props.label}
      </span>
      <div class="flex items-center gap-1.5">
        <Block value={days()} unit="D" />
        <Sep />
        <Block value={hours()} unit="H" />
        <Sep />
        <Block value={minutes()} unit="M" />
        <Sep />
        <Block value={seconds()} unit="S" />
      </div>
    </div>
  )
}
