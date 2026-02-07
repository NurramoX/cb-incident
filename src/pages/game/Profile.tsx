import { createSignal, onMount, Show } from 'solid-js'
import { useNavigate, A } from '@solidjs/router'
import { isAuthenticated, fetchCurrentProfile, updateProfile, logout, Profile as ProfileType } from '../../lib/api'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function Profile() {
  const navigate = useNavigate()

  const [profile, setProfile] = createSignal<ProfileType | null>(null)
  const [name, setName] = createSignal('')
  const [surname, setSurname] = createSignal('')
  const [loading, setLoading] = createSignal(true)
  const [saving, setSaving] = createSignal(false)
  const [error, setError] = createSignal('')
  const [success, setSuccess] = createSignal('')
  const [showLogoutDialog, setShowLogoutDialog] = createSignal(false)

  onMount(async () => {
    if (!isAuthenticated()) {
      navigate('/game/login')
      return
    }

    const profileResult = await fetchCurrentProfile()

    if (profileResult.error) {
      setError(profileResult.error)
    } else if (profileResult.data) {
      setProfile(profileResult.data)
      setName(profileResult.data.name)
      setSurname(profileResult.data.surname)
    }

    setLoading(false)
  })

  const handleSave = async () => {
    setError('')
    setSuccess('')

    const trimmedName = name().trim()
    const trimmedSurname = surname().trim()

    if (!trimmedName || !trimmedSurname) {
      setError('Name and surname are required')
      return
    }

    setSaving(true)
    const result = await updateProfile({ name: trimmedName, surname: trimmedSurname })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setProfile(result.data)
      setName(result.data.name)
      setSurname(result.data.surname)
      setSuccess('Profile updated')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/game/login')
  }

  const hasChanges = () => {
    const p = profile()
    if (!p) return false
    return name().trim() !== p.name || surname().trim() !== p.surname
  }

  return (
    <div class="relative w-full min-h-screen flex flex-col items-center p-4 pt-8">
      <div class="relative z-10 w-full max-w-3xl flex flex-col items-center gap-8">
        {/* Header */}
        <div class="w-full flex items-center justify-between">
          <h1 class="font-orbitron font-black text-[1.5rem] text-transparent [-webkit-text-stroke:1px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5)] tracking-[0.1em]">
            <span class="md:hidden">CBI<span class="text-[0.55rem] tracking-[0.05em] text-pale-gold [-webkit-text-stroke:0]">ncident</span></span>
            <span class="hidden md:inline">CB INCIDENT</span>
          </h1>
          <A
            href="/game/dashboard"
            class="font-orbitron text-[0.7rem] text-crimson uppercase tracking-[0.15em] hover:[text-shadow:0_0_8px_var(--color-crimson)] transition-all duration-200"
          >
            Back
          </A>
        </div>

        <div class="font-orbitron text-[0.85rem] text-crimson uppercase tracking-[0.25em] [text-shadow:0_0_8px_var(--color-crimson)]">
          // Profile Management //
        </div>

        <Show when={loading()}>
          <div class="text-white/50 font-rajdhani">Loading...</div>
        </Show>

        <Show when={!loading()}>
          {/* Edit Name Section */}
          <div class="w-full flex flex-col gap-6">
            <div class="flex flex-col sm:flex-row gap-6">
              <div class="flex flex-col gap-1 flex-1">
                <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]" for="name">
                  Name
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="name"
                    value={name()}
                    onInput={(e) => { setName(e.currentTarget.value); setError(''); setSuccess('') }}
                    class={`w-full bg-dark-bg/90 border py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] ${
                      error() ? 'border-neon-red' : 'border-crimson/40'
                    }`}
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1 flex-1">
                <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]" for="surname">
                  Surname
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="surname"
                    value={surname()}
                    onInput={(e) => { setSurname(e.currentTarget.value); setError(''); setSuccess('') }}
                    class={`w-full bg-dark-bg/90 border py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] ${
                      error() ? 'border-neon-red' : 'border-crimson/40'
                    }`}
                  />
                </div>
              </div>
            </div>

            <Show when={error()}>
              <span class="text-[0.75rem] text-neon-red">{error()}</span>
            </Show>

            <Show when={success()}>
              <div class="bg-[rgba(0,100,0,0.3)] border border-[#228B22] text-[#90EE90] py-2.5 px-3.5 text-[0.9rem] text-center">
                {success()}
              </div>
            </Show>

            <button
              onClick={handleSave}
              disabled={saving() || !hasChanges()}
              class="glow-btn mt-2 h-11 px-8 rounded-full flex items-center justify-center font-orbitron text-[0.8rem] text-white uppercase tracking-[0.2em] self-center"
            >
              {saving() ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>

          {/* Divider */}
          <div class="w-full h-px bg-crimson/20" />

          {/* Actions */}
          <div class="w-full flex flex-col gap-4 items-center">
            <button
              onClick={() => setShowLogoutDialog(true)}
              class="h-11 px-8 rounded-full flex items-center justify-center font-orbitron text-[0.8rem] uppercase tracking-[0.2em] bg-crimson/15 border border-crimson/30 text-crimson/80 hover:bg-crimson/25 hover:border-crimson/50 transition-all duration-200"
            >
              LOGOUT
            </button>

          </div>
        </Show>

        <ConfirmDialog
          open={showLogoutDialog()}
          title="Logout"
          message="Are you sure you want to log out?"
          confirmText="Logout"
          variant="danger"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutDialog(false)}
        />

      </div>
    </div>
  )
}
