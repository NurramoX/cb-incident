import { createSignal } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { register } from '../../lib/api'

export default function Register() {
  const navigate = useNavigate()

  const [registrationToken, setRegistrationToken] = createSignal('')
  const [name, setName] = createSignal('')
  const [surname, setSurname] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')
  const [error, setError] = createSignal('')
  const [success, setSuccess] = createSignal('')
  const [loading, setLoading] = createSignal(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password() !== confirmPassword()) {
      setError('Passwords do not match')
      return
    }

    if (password().length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const result = await register({
      registrationToken: registrationToken(),
      name: name(),
      surname: surname(),
      email: email(),
      password: password(),
    })

    if (result.data) {
      setSuccess('Registration successful! Redirecting to login...')
      setTimeout(() => navigate('/game/login'), 2000)
    } else {
      setError(result.error || 'Registration failed')
    }

    setLoading(false)
  }

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
        <form class="w-full max-w-110 flex flex-col gap-4" onSubmit={handleSubmit}>
          <FormField
            label="Registration Token"
            type="password"
            id="registration-token"
            placeholder="Enter token from WhatsApp"
            value={registrationToken()}
            onInput={setRegistrationToken}
            disabled={loading()}
            hint="Get this from the WhatsApp group"
          />

          <div class="flex flex-col sm:flex-row gap-3">
            <FormField
              label="Name"
              type="text"
              id="name"
              placeholder="Your name"
              value={name()}
              onInput={setName}
              disabled={loading()}
              autocomplete="given-name"
            />
            <FormField
              label="Surname"
              type="text"
              id="surname"
              placeholder="Your surname"
              value={surname()}
              onInput={setSurname}
              disabled={loading()}
              autocomplete="family-name"
            />
          </div>

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
            placeholder="Create a password (min 8 chars)"
            value={password()}
            onInput={setPassword}
            disabled={loading()}
            autocomplete="new-password"
          />

          <FormField
            label="Confirm Password"
            type="password"
            id="confirm-password"
            placeholder="Confirm your password"
            value={confirmPassword()}
            onInput={setConfirmPassword}
            disabled={loading()}
            autocomplete="new-password"
          />

          {error() && (
            <div class="bg-blood-red/30 border border-blood-red text-neon-red py-2.5 px-3.5 text-[0.9rem] text-center">
              {error()}
            </div>
          )}

          {success() && (
            <div class="bg-[rgba(0,100,0,0.3)] border border-[#228B22] text-[#90EE90] py-2.5 px-3.5 text-[0.9rem] text-center">
              {success()}
            </div>
          )}

          <button
            type="submit"
            disabled={loading()}
            class="group relative mt-4 py-4 px-8 font-orbitron text-[0.9rem] text-white uppercase tracking-[0.2em] cursor-pointer overflow-hidden transition-all duration-300 bg-gradient-to-b from-crimson to-blood-red border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Corner accents */}
            <span class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-pale-gold" />
            <span class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-pale-gold" />
            <span class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-pale-gold" />
            <span class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-pale-gold" />

            {/* Glow effect */}
            <span class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 [box-shadow:inset_0_0_20px_rgba(220,20,60,0.5),0_0_30px_rgba(220,20,60,0.4)]" />

            {/* Scan line on hover */}
            <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            {/* Text */}
            <span class="relative z-10 [text-shadow:0_0_10px_rgba(255,255,255,0.5)]">
              {loading() ? 'Registering...' : 'Register'}
            </span>
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
  id: string
  placeholder: string
  value: string
  onInput: (val: string) => void
  disabled: boolean
  hint?: string
  autocomplete?: string
}) {
  const hintId = props.hint ? `${props.id}-hint` : undefined

  return (
    <div class="flex flex-col gap-1 flex-1">
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
        aria-describedby={hintId}
        class="bg-dark-bg/90 border border-crimson/40 py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {props.hint && <span id={hintId} class="text-[0.75rem] text-white/40">{props.hint}</span>}
    </div>
  )
}
