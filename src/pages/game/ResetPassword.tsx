import { createSignal, createEffect, onMount, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')
  const [passwordError, setPasswordError] = createSignal('')
  const [confirmError, setConfirmError] = createSignal('')
  const [saving, setSaving] = createSignal(false)
  const [error, setError] = createSignal('')
  const [success, setSuccess] = createSignal(false)
  const [sessionReady, setSessionReady] = createSignal(false)
  const [tokenError, setTokenError] = createSignal(false)

  onMount(async () => {
    // Supabase recovery links redirect with hash params: #access_token=...&refresh_token=...&type=recovery
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (!accessToken || !refreshToken || type !== 'recovery') {
      setTokenError(true)
      return
    }

    // Set session from the recovery tokens
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      setTokenError(true)
      return
    }

    // Store client for password update
    ;(window as any).__resetSupabase = supabase
    setSessionReady(true)
  })

  const handlePasswordBlur = () => {
    if (password().length > 0 && password().length < 8) {
      setPasswordError('Password must be at least 8 characters')
    }
  }

  const handleConfirmBlur = () => {
    if (password().length > 0 && confirmPassword().length > 0 && password() !== confirmPassword()) {
      setConfirmError('Passwords do not match')
    }
  }

  const isValid = () => password().length >= 8 && password() === confirmPassword()

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')

    if (password().length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (password() !== confirmPassword()) {
      setConfirmError('Passwords do not match')
      return
    }

    setSaving(true)
    const supabase = (window as any).__resetSupabase
    if (!supabase) {
      setError('Session expired. Please use the reset link again.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: password() })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Clean up
    delete (window as any).__resetSupabase
    setSuccess(true)
    setTimeout(() => navigate('/game/login'), 3000)
  }

  // Keep track of last error to show during fade-out
  const [displayedPasswordError, setDisplayedPasswordError] = createSignal('')
  const [displayedConfirmError, setDisplayedConfirmError] = createSignal('')

  createEffect(() => { if (passwordError()) setDisplayedPasswordError(passwordError()) })
  createEffect(() => { if (confirmError()) setDisplayedConfirmError(confirmError()) })

  return (
    <div class="relative w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div class="relative z-10 w-full max-w-120 flex flex-col items-center gap-6">
        <h1 class="font-orbitron font-black text-[2rem] text-center text-transparent [-webkit-text-stroke:1.5px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5),0_0_24px_rgba(212,175,55,0.3)] tracking-[0.1em] mb-0.5">
          CB INCIDENT
        </h1>
        <div class="font-orbitron text-[0.85rem] text-crimson uppercase tracking-[0.25em] [text-shadow:0_0_8px_var(--color-crimson)] mb-1.5">
          // Reset Password //
        </div>

        <Show when={tokenError()}>
          <div class="text-center flex flex-col gap-4 items-center">
            <span class="text-[0.85rem] text-neon-red">Invalid or expired reset link.</span>
            <a
              href="/game/login"
              class="text-pale-gold no-underline text-[0.9rem] transition-all duration-200 hover:[text-shadow:0_0_10px_rgba(212,175,55,0.5)]"
            >
              Back to Login
            </a>
          </div>
        </Show>

        <Show when={success()}>
          <div class="bg-[rgba(0,100,0,0.3)] border border-[#228B22] text-[#90EE90] py-2.5 px-3.5 text-[0.9rem] text-center">
            Password updated! Redirecting to login...
          </div>
        </Show>

        <Show when={sessionReady() && !success()}>
          <form onSubmit={handleSubmit} class="w-full max-w-[320px] flex flex-col gap-6">
            <div class="flex flex-col gap-1">
              <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]" for="password">
                New Password
              </label>
              <div class="relative">
                <input
                  type="password"
                  id="password"
                  placeholder="Create a password (min 8 chars)"
                  autocomplete="new-password"
                  onInput={(e) => { setPassword(e.currentTarget.value); setPasswordError(''); setConfirmError(''); setError('') }}
                  onBlur={handlePasswordBlur}
                  class={`w-full bg-dark-bg/90 border py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] ${
                    passwordError() ? 'border-neon-red' : 'border-crimson/40'
                  }`}
                />
                <span
                  class={`absolute left-0 top-full mt-0.5 text-[0.75rem] text-neon-red transition-opacity duration-200 ${
                    passwordError() ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {displayedPasswordError() || '\u00A0'}
                </span>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]" for="confirm-password">
                Confirm Password
              </label>
              <div class="relative">
                <input
                  type="password"
                  id="confirm-password"
                  placeholder="Confirm your password"
                  autocomplete="new-password"
                  onInput={(e) => { setConfirmPassword(e.currentTarget.value); setConfirmError(''); setError('') }}
                  onBlur={handleConfirmBlur}
                  class={`w-full bg-dark-bg/90 border py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] ${
                    confirmError() ? 'border-neon-red' : 'border-crimson/40'
                  }`}
                />
                <span
                  class={`absolute left-0 top-full mt-0.5 text-[0.75rem] text-neon-red transition-opacity duration-200 ${
                    confirmError() ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {displayedConfirmError() || '\u00A0'}
                </span>
              </div>
            </div>

            <Show when={error()}>
              <span class="text-[0.75rem] text-neon-red">{error()}</span>
            </Show>

            <button
              type="submit"
              disabled={!isValid() || saving()}
              class="glow-btn mt-4 h-11 px-8 rounded-full flex items-center justify-center font-orbitron text-[0.8rem] text-white uppercase tracking-[0.2em] self-center"
            >
              {saving() ? 'UPDATING...' : 'SET NEW PASSWORD'}
            </button>
          </form>
        </Show>
      </div>
    </div>
  )
}
