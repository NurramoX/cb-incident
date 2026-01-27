import { createSignal, createEffect, onMount, Show } from 'solid-js'
import { action, useSubmission, A, useNavigate } from '@solidjs/router'
import { register, isAuthenticated } from '../../lib/api'

function capitalize(str: string): string {
  const trimmed = str.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase() : ''
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

  const [token, setToken] = createSignal('')
  const [name, setName] = createSignal('')
  const [surname, setSurname] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')

  const [emailError, setEmailError] = createSignal('')
  const [passwordLengthError, setPasswordLengthError] = createSignal('')
  const [passwordMatchError, setPasswordMatchError] = createSignal('')

  const isValid = () =>
    token().length > 0 &&
    name().length > 0 &&
    surname().length > 0 &&
    email().includes('@') &&
    password().length >= 8 &&
    password() === confirmPassword()

  const handleEmailBlur = () => {
    if (email().length > 0 && !email().includes('@')) {
      setEmailError('Please enter a valid email address')
    }
  }

  const handlePasswordBlur = () => {
    if (password().length > 0 && password().length < 8) {
      setPasswordLengthError('Password must be at least 8 characters')
    }
  }

  const handleConfirmPasswordBlur = () => {
    if (password().length > 0 && confirmPassword().length > 0 && password() !== confirmPassword()) {
      setPasswordMatchError('Passwords do not match')
    }
  }

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
        <form action={registerAction} method="post" class="w-full max-w-110 flex flex-col gap-6">
          <FormField
            label="Registration Token"
            type="password"
            name="registration-token"
            placeholder="Enter token from WhatsApp"
            disabled={submission.pending ?? false}
            hint="Get this from the WhatsApp group"
            onInput={setToken}
          />

          <div class="flex flex-col sm:flex-row gap-3">
            <FormField
              label="Name"
              type="text"
              name="name"
              placeholder="Your name"
              disabled={submission.pending ?? false}
              autocomplete="given-name"
              value={name()}
              onInput={setName}
              onBlur={() => setName(capitalize(name()))}
            />
            <FormField
              label="Surname"
              type="text"
              name="surname"
              placeholder="Your surname"
              disabled={submission.pending ?? false}
              autocomplete="family-name"
              value={surname()}
              onInput={setSurname}
              onBlur={() => setSurname(capitalize(surname()))}
            />
          </div>

          <FormField
            label="Email"
            type="email"
            name="email"
            placeholder="your@email.com"
            disabled={submission.pending ?? false}
            autocomplete="email"
            onInput={(v) => { setEmail(v); setEmailError('') }}
            onBlur={handleEmailBlur}
            error={emailError()}
          />

          <FormField
            label="Password"
            type="password"
            name="password"
            placeholder="Create a password (min 8 chars)"
            disabled={submission.pending ?? false}
            autocomplete="new-password"
            onInput={(v) => { setPassword(v); setPasswordLengthError(''); setPasswordMatchError('') }}
            onBlur={handlePasswordBlur}
            error={passwordLengthError()}
          />

          <FormField
            label="Confirm Password"
            type="password"
            name="confirm-password"
            placeholder="Confirm your password"
            disabled={submission.pending ?? false}
            autocomplete="new-password"
            onInput={(v) => { setConfirmPassword(v); setPasswordMatchError('') }}
            onBlur={handleConfirmPasswordBlur}
            error={passwordMatchError()}
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
            disabled={!isValid() || (submission.pending ?? false)}
            class="glow-btn mt-4 h-11 px-8 rounded-full flex items-center justify-center font-orbitron text-[0.8rem] text-white uppercase tracking-[0.2em] self-center"
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
  value?: string
  onInput?: (value: string) => void
  onBlur?: () => void
  error?: string
}) {
  const hintId = props.hint ? `${props.name}-hint` : undefined

  // Keep track of last error to show during fade-out
  const [displayedError, setDisplayedError] = createSignal(props.error || '')

  createEffect(() => {
    if (props.error) {
      setDisplayedError(props.error)
    }
    // When error clears, keep displaying old text while it fades out
  })

  return (
    <div class="flex flex-col gap-1 flex-1">
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
          aria-describedby={hintId}
          onInput={(e) => props.onInput?.(e.currentTarget.value)}
          onBlur={() => props.onBlur?.()}
          class={`w-full bg-dark-bg/90 border py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed ${
            props.error ? 'border-neon-red' : 'border-crimson/40'
          }`}
          {...(props.value !== undefined ? { value: props.value } : {})}
        />
        <span
          class={`absolute left-0 top-full mt-0.5 text-[0.75rem] text-neon-red transition-opacity duration-200 ${
            props.error ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {displayedError() || '\u00A0'}
        </span>
        {props.hint && !props.error && (
          <span id={hintId} class="absolute left-0 top-full mt-0.5 text-[0.75rem] text-white/40">
            {props.hint}
          </span>
        )}
      </div>
    </div>
  )
}
