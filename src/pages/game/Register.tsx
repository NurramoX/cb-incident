import { createSignal, createEffect, onMount, Show } from 'solid-js'
import { action, useSubmission, A, useNavigate } from '@solidjs/router'
import { register, isAuthenticated } from '../../lib/api'

function capitalize(str: string): string {
  const trimmed = str.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : ''
}

const registerAction = action(async (formData: FormData) => {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm-password') as string

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const result = await register({
    registrationToken: (formData.get('registration-token') as string).trim(),
    name: capitalize(formData.get('name') as string),
    surname: capitalize(formData.get('surname') as string),
    email: (formData.get('email') as string).trim(),
    password,
  })

  if (result.error) {
    throw new Error(result.error)
  }

  return { success: true }
}, 'register')

export default function Register() {
  const navigate = useNavigate()
  const submission = useSubmission(registerAction)
  const [showSuccess, setShowSuccess] = createSignal(false)

  onMount(() => {
    if (isAuthenticated()) {
      navigate('/game/dashboard')
    }
  })

  // Handle successful registration
  createEffect(() => {
    if (submission.result?.success && !showSuccess()) {
      setShowSuccess(true)
      setTimeout(() => navigate('/game/login'), 2000)
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
          // Registration //
        </div>

        {/* Form */}
        <form action={registerAction} method="post" class="w-full max-w-110 flex flex-col gap-4">
          <FormField
            label="Registration Token"
            type="password"
            name="registration-token"
            placeholder="Enter token from WhatsApp"
            disabled={submission.pending ?? false}
            hint="Get this from the WhatsApp group"
          />

          <div class="flex flex-col sm:flex-row gap-3">
            <FormField
              label="Name"
              type="text"
              name="name"
              placeholder="Your name"
              disabled={submission.pending ?? false}
              autocomplete="given-name"
            />
            <FormField
              label="Surname"
              type="text"
              name="surname"
              placeholder="Your surname"
              disabled={submission.pending ?? false}
              autocomplete="family-name"
            />
          </div>

          <FormField
            label="Email"
            type="email"
            name="email"
            placeholder="your@email.com"
            disabled={submission.pending ?? false}
            autocomplete="email"
          />

          <FormField
            label="Password"
            type="password"
            name="password"
            placeholder="Create a password (min 8 chars)"
            disabled={submission.pending ?? false}
            autocomplete="new-password"
          />

          <FormField
            label="Confirm Password"
            type="password"
            name="confirm-password"
            placeholder="Confirm your password"
            disabled={submission.pending ?? false}
            autocomplete="new-password"
          />

          <Show when={submission.error}>
            <div class="bg-blood-red/30 border border-blood-red text-neon-red py-2.5 px-3.5 text-[0.9rem] text-center">
              {submission.error?.message}
            </div>
          </Show>

          <Show when={showSuccess()}>
            <div class="bg-[rgba(0,100,0,0.3)] border border-[#228B22] text-[#90EE90] py-2.5 px-3.5 text-[0.9rem] text-center">
              Registration successful! Redirecting to login...
            </div>
          </Show>

          <button
            type="submit"
            disabled={submission.pending ?? false}
            class="glow-btn mt-4 w-full h-14 flex items-center justify-center font-orbitron text-[0.9rem] text-white uppercase tracking-[0.2em]"
          >
            {submission.pending ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </form>

        <div class="text-[0.9rem] text-white/50 text-center mt-4">
          Already registered?{' '}
          <A href="/game/login" class="text-pale-gold no-underline transition-all duration-200 hover:[text-shadow:0_0_10px_rgba(212,175,55,0.5)]">
            Login here
          </A>
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
  hint?: string
  autocomplete?: string
}) {
  const hintId = props.hint ? `${props.name}-hint` : undefined

  return (
    <div class="flex flex-col gap-1 flex-1">
      <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]" for={props.name}>
        {props.label}
      </label>
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
        aria-describedby={hintId}
        class="bg-dark-bg/90 border border-crimson/40 py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {props.hint && <span id={hintId} class="text-[0.75rem] text-white/40">{props.hint}</span>}
    </div>
  )
}
