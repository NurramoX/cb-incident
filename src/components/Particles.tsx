import { createSignal, onMount, onCleanup, For } from 'solid-js'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  color: string
}

const COLORS = ['#DC143C', '#ff2a2a', '#d4af37'] // crimson, neon-red, gold
const PARTICLE_COUNT = 10

function createParticle(id: number): Particle {
  return {
    id,
    x: Math.random() * 100,
    y: 100 + Math.random() * 20, // start below viewport
    size: Math.random() * 2 + 1.5,
    speed: Math.random() * 0.3 + 0.1,
    opacity: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

function resetParticle(p: Particle): Particle {
  return {
    ...p,
    x: Math.random() * 100,
    y: 100 + Math.random() * 10,
    size: Math.random() * 2 + 1.5,
    speed: Math.random() * 0.3 + 0.1,
    opacity: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }
}

export default function Particles() {
  const [particles, setParticles] = createSignal<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const p = createParticle(i)
      // Stagger initial positions so they don't all start at bottom
      p.y = Math.random() * 120
      p.opacity = p.y < 100 && p.y > 10 ? 0.6 : 0
      return p
    })
  )

  let animationId: number

  const animate = () => {
    setParticles((prev) =>
      prev.map((p) => {
        let newY = p.y - p.speed
        let newOpacity = p.opacity

        // Fade in when entering viewport
        if (newY < 95 && newY > 85) {
          newOpacity = Math.min(0.6, newOpacity + 0.02)
        }
        // Fade out when near top
        else if (newY < 15) {
          newOpacity = Math.max(0, newOpacity - 0.02)
        }

        // Reset when off screen
        if (newY < -5) {
          return resetParticle(p)
        }

        return { ...p, y: newY, opacity: newOpacity }
      })
    )

    animationId = requestAnimationFrame(animate)
  }

  onMount(() => {
    animationId = requestAnimationFrame(animate)
  })

  onCleanup(() => {
    cancelAnimationFrame(animationId)
  })

  return (
    <div class="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      <For each={particles()}>
        {(p) => (
          <div
            class="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              opacity: p.opacity,
              'box-shadow': `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        )}
      </For>
    </div>
  )
}
