import { createSignal, onMount, onCleanup, createEffect, on } from 'solid-js'
import { animate } from 'animejs'

interface CountdownProps {
  label: string
  size?: 'default' | 'large'
  onComplete?: () => void
}

export default function Countdown(props: CountdownProps) {
  const eventDate = new Date('2026-02-07T20:30:00').getTime()

  const [days, setDays] = createSignal('00')
  const [hours, setHours] = createSignal('00')
  const [minutes, setMinutes] = createSignal('00')
  const [seconds, setSeconds] = createSignal('00')

  const [completed, setCompleted] = createSignal(false)

  const updateCountdown = () => {
    const now = Date.now()
    const diff = Math.max(0, eventDate - now)

    if (diff === 0 && !completed()) {
      setCompleted(true)
      props.onComplete?.()
    }

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

  // Animated block with flip-clock transition
  const AnimatedBlock = (p: { value: () => string; unit: string }) => {
    let containerRef: HTMLDivElement | undefined
    let currentRef: HTMLSpanElement | undefined

    createEffect(on(p.value, (newVal, oldVal) => {
      if (oldVal !== undefined && newVal !== oldVal && containerRef && currentRef) {
        // Create outgoing element
        const outgoing = document.createElement('span')
        outgoing.textContent = oldVal
        outgoing.className = currentRef.className
        outgoing.style.position = 'absolute'
        outgoing.style.top = '0'
        outgoing.style.left = '0'
        outgoing.style.right = '0'
        outgoing.style.bottom = '0'
        containerRef.appendChild(outgoing)

        // Set incoming element initial state
        currentRef.style.transform = 'translateY(60%) scale(0.8)'
        currentRef.style.opacity = '0'
        currentRef.style.filter = 'blur(2px)'

        // Animate outgoing up and away with scale
        animate(outgoing, {
          translateY: [0, '-60%'],
          scale: [1, 0.8],
          opacity: [1, 0],
          filter: ['blur(0px)', 'blur(2px)'],
          duration: 300,
          ease: 'inQuad',
          complete: () => outgoing.remove()
        })

        // Animate incoming from below with scale and slight bounce
        animate(currentRef, {
          translateY: ['60%', '-3%', '0%'],
          scale: [0.8, 1.02, 1],
          opacity: [0, 1, 1],
          filter: ['blur(2px)', 'blur(0px)', 'blur(0px)'],
          duration: 400,
          ease: 'outQuad',
        })
      }
    }))

    return (
      <div class="flex flex-col items-center gap-0 relative">
        <div class={`relative ${isLarge() ? 'px-2 py-1' : 'px-1 py-0.5'}`}>
          <div
            ref={containerRef}
            class={`relative overflow-hidden ${isLarge() ? 'h-7' : 'h-5'}`}
            style={{ width: isLarge() ? '2rem' : '1.5rem' }}
          >
            <span
              ref={currentRef}
              class={`absolute inset-0 flex items-center justify-center font-[Courier_New,monospace] font-black text-pale-gold leading-none ${isLarge() ? 'text-2xl' : 'text-base'}`}
            >
              {p.value()}
            </span>
          </div>
        </div>
        <span class={`font-orbitron text-crimson [text-shadow:0_0_5px_var(--color-crimson)] mt-1 ${isLarge() ? 'text-[0.5rem]' : 'text-[0.35rem]'}`}>
          {p.unit}
        </span>
      </div>
    )
  }

  const Block = (p: { value: () => string; unit: string }) => {
    return (
      <div class="flex flex-col items-center gap-0 relative">
        <div class={`relative ${isLarge() ? 'px-2 py-1' : 'px-1 py-0.5'}`}>
          <span
            class={`relative font-[Courier_New,monospace] font-black text-pale-gold leading-none ${isLarge() ? 'text-2xl' : 'text-base'}`}
          >
            {p.value()}
          </span>
        </div>
        <span class={`font-orbitron text-crimson [text-shadow:0_0_5px_var(--color-crimson)] mt-1 ${isLarge() ? 'text-[0.5rem]' : 'text-[0.35rem]'}`}>
          {p.unit}
        </span>
      </div>
    )
  }

  const Sep = () => {
    let sepRef: HTMLSpanElement | undefined

    onMount(() => {
      if (sepRef) {
        animate(sepRef, {
          opacity: [0.4, 0.8, 0.4],
          duration: 1000,
          loop: true,
          ease: 'inOutSine',
        })
      }
    })

    return (
      <span
        ref={sepRef}
        class={`font-orbitron text-crimson -mt-1.5 ${isLarge() ? 'text-xl' : 'text-[0.8rem]'}`}
      >
        :
      </span>
    )
  }

  return (
    <div class="flex flex-col items-center gap-2 mt-2">
      <span class="font-orbitron text-[0.55rem] text-white/40 tracking-[0.2em] uppercase">
        {props.label}
      </span>
      <div class="flex items-center gap-2">
        <Block value={days} unit="DAYS" />
        <Sep />
        <Block value={hours} unit="HRS" />
        <Sep />
        <AnimatedBlock value={minutes} unit="MIN" />
        <Sep />
        <AnimatedBlock value={seconds} unit="SEC" />
      </div>
    </div>
  )
}
