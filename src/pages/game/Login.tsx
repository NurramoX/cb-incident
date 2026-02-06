import { action, useSubmission, redirect, useNavigate } from '@solidjs/router'
import { createSignal, createEffect, onMount } from 'solid-js'
import { login, isAuthenticated } from '../../lib/api'

const loginAction = action(async (formData: FormData) => {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const result = await login({ email, password })

  if (result.error) {
    throw new Error(result.error)
  }

  throw redirect('/game/dashboard')
}, 'login')

export default function Login() {
  const navigate = useNavigate()
  const submission = useSubmission(loginAction)

  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [emailError, setEmailError] = createSignal('')
  const [passwordError, setPasswordError] = createSignal('')

  const isValid = () => email().includes('@') && password().length >= 1

  onMount(() => {
    if (isAuthenticated()) {
      navigate('/game/dashboard')
    }
  })

  // Show errors on both fields when login fails
  createEffect(() => {
    if (submission.error) {
      setEmailError('Invalid login credentials')
      setPasswordError('Invalid login credentials')
    }
  })

  return (
    <div class="relative w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div class="relative z-10 w-full max-w-120 flex flex-col items-center gap-6">
        {/* Header */}
        <h1 class="font-orbitron font-black text-[2rem] text-center text-transparent [-webkit-text-stroke:1.5px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5),0_0_24px_rgba(212,175,55,0.3)] tracking-[0.1em] mb-0.5">
          CB INCIDENT
        </h1>
        <div class="font-orbitron text-[0.85rem] text-crimson uppercase tracking-[0.25em] [text-shadow:0_0_8px_var(--color-crimson)] mb-1.5">
          // Login //
        </div>

        {/* Form */}
        <form action={loginAction} method="post" class="w-full max-w-[320px] flex flex-col gap-6">
          <FormField
            label="Email"
            type="email"
            name="email"
            placeholder="your@email.com"
            disabled={submission.pending ?? false}
            autocomplete="email"
            onInput={(v) => { setEmail(v); setEmailError(''); setPasswordError('') }}
            error={emailError()}
          />

          <FormField
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            disabled={submission.pending ?? false}
            autocomplete="current-password"
            onInput={(v) => { setPassword(v); setEmailError(''); setPasswordError('') }}
            error={passwordError()}
          />

          <button
            type="submit"
            disabled={!isValid() || (submission.pending ?? false)}
            class="glow-btn mt-4 h-11 px-8 rounded-full flex items-center justify-center font-orbitron text-[0.8rem] text-white uppercase tracking-[0.2em] self-center"
          >
            {submission.pending ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <div class="text-[0.9rem] text-white/50 text-center mt-4">
          Registrations are closed.
        </div>
      </div>
    </div>
  )
}

function FormField(props: {
  label: string
  type: string
  name: string
  placeholder: string
  disabled: boolean
  autocomplete?: string
  onInput?: (value: string) => void
  error?: string
}) {
  // Keep track of last error to show during fade-out
  const [displayedError, setDisplayedError] = createSignal(props.error || '')

  createEffect(() => {
    if (props.error) {
      setDisplayedError(props.error)
    }
  })

  return (
    <div class="flex flex-col gap-1">
      <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]" for={props.name}>
        {props.label}
      </label>
      <div class="relative">
        <input
          type={props.type}
          id={props.name}
          name={props.name}
          placeholder={props.placeholder}
          disabled={props.disabled}
          required
          autocomplete={props.autocomplete}
          autocorrect="off"
          spellcheck={false}
          onInput={(e) => props.onInput?.(e.currentTarget.value)}
          class={`w-full bg-dark-bg/90 border py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed ${
            props.error ? 'border-neon-red' : 'border-crimson/40'
          }`}
        />
        <span
          class={`absolute left-0 top-full mt-0.5 text-[0.75rem] text-neon-red transition-opacity duration-200 ${
            props.error ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {displayedError() || '\u00A0'}
        </span>
      </div>
    </div>
  )
}
