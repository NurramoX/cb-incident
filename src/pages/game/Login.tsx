import { createSignal } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { login, saveAccessToken } from '../../lib/api'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal('')
  const [loading, setLoading] = createSignal(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login({
      email: email(),
      password: password(),
    })

    if (result.data) {
      saveAccessToken(result.data.accessToken)
      navigate('/game/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }

    setLoading(false)
  }

  return (
    <div class="relative w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div class="relative z-10 w-full max-w-[480px] flex flex-col items-center gap-6">
        {/* Header */}
        <h1 class="font-orbitron font-black text-[2rem] text-center text-transparent [-webkit-text-stroke:1.5px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5),0_0_24px_rgba(212,175,55,0.3)] tracking-[0.1em] mb-0.5">
          CB INCIDENT
        </h1>
        <div class="font-orbitron text-[0.85rem] text-crimson uppercase tracking-[0.25em] [text-shadow:0_0_8px_var(--color-crimson)] mb-1.5">
          // Login //
        </div>

        {/* Form */}
        <form class="w-full max-w-[320px] flex flex-col gap-4" onSubmit={handleSubmit}>
          <FormField
            label="Email"
            type="email"
            id="email"
            placeholder="your@email.com"
            value={email()}
            onInput={setEmail}
            disabled={loading()}
            autocomplete="email"
          />

          <FormField
            label="Password"
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password()}
            onInput={setPassword}
            disabled={loading()}
            autocomplete="current-password"
          />

          {error() && (
            <div class="bg-blood-red/30 border border-blood-red text-neon-red py-2.5 px-3.5 text-[0.9rem] text-center">
              {error()}
            </div>
          )}

          <button
            type="submit"
            disabled={loading()}
            class="mt-2 py-3.5 px-5 font-orbitron text-[0.85rem] text-white uppercase tracking-[0.15em] cursor-pointer transition-all duration-200 [background:linear-gradient(180deg,var(--color-crimson)_0%,var(--color-blood-red)_100%)] border border-crimson hover:shadow-[0_0_20px_rgba(220,20,60,0.5)] hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading() ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div class="text-[0.9rem] text-white/50 text-center mt-4">
          Don't have an account?{' '}
          <A href="/game/register" class="text-pale-gold no-underline transition-all duration-200 hover:[text-shadow:0_0_10px_rgba(212,175,55,0.5)]">
            Register here
          </A>
        </div>
      </div>
    </div>
  )
}

function FormField(props: {
  label: string
  type: string
  id: string
  placeholder: string
  value: string
  onInput: (val: string) => void
  disabled: boolean
  autocomplete?: string
}) {
  return (
    <div class="flex flex-col gap-1">
      <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]" for={props.id}>
        {props.label}
      </label>
      <input
        type={props.type}
        id={props.id}
        name={props.id}
        placeholder={props.placeholder}
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        disabled={props.disabled}
        required
        autocomplete={props.autocomplete}
        class="bg-dark-bg/90 border border-crimson/40 py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}
