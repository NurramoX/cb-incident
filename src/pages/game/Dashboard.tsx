import { createSignal, onMount, For, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { fetchProfiles, logout, isAuthenticated, Profile } from '../../lib/api'

export default function Dashboard() {
  const navigate = useNavigate()

  const [profiles, setProfiles] = createSignal<Profile[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')

  onMount(async () => {
    if (!isAuthenticated()) {
      navigate('/game/login')
      return
    }

    const result = await fetchProfiles()

    if (result) {
      setProfiles(result)
    } else {
      setError(result || 'Failed to load participants')
    }

    setLoading(false)
  })

  const handleLogout = () => {
    logout()
    navigate('/game/login')
  }

  return (
    <div class="relative w-full min-h-screen flex flex-col items-center p-4 pt-8">
      <div class="relative z-10 w-full max-w-3xl flex flex-col items-center gap-6">
        {/* Header */}
        <div class="w-full flex items-center justify-between">
          <h1 class="font-orbitron font-black text-[1.5rem] text-transparent [-webkit-text-stroke:1px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5)] tracking-[0.1em]">
            CB INCIDENT
          </h1>
          <button
            onClick={handleLogout}
            class="font-orbitron text-[0.7rem] text-crimson uppercase tracking-[0.15em] hover:[text-shadow:0_0_8px_var(--color-crimson)] transition-all duration-200"
          >
            Logout
          </button>
        </div>

        <div class="font-orbitron text-[0.85rem] text-crimson uppercase tracking-[0.25em] [text-shadow:0_0_8px_var(--color-crimson)]">
          // Participants //
        </div>

        {/* Content */}
        <Show when={loading()}>
          <div class="text-white/50 font-rajdhani">Loading...</div>
        </Show>

        <Show when={error()}>
          <div class="bg-blood-red/30 border border-blood-red text-neon-red py-2.5 px-3.5 text-[0.9rem] text-center">
            {error()}
          </div>
        </Show>

        <Show when={!loading() && !error()}>
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-crimson/40">
                <th class="font-orbitron text-[0.7rem] text-crimson uppercase tracking-[0.15em] text-left py-3 px-4">
                  #
                </th>
                <th class="font-orbitron text-[0.7rem] text-crimson uppercase tracking-[0.15em] text-left py-3 px-4">
                  Name
                </th>
                <th class="font-orbitron text-[0.7rem] text-crimson uppercase tracking-[0.15em] text-left py-3 px-4">
                  Team
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={profiles()}>
                {(profile, index) => (
                  <tr class="border-b border-crimson/20 hover:bg-crimson/5 transition-colors duration-200">
                    <td class="font-rajdhani text-white/50 py-3 px-4">
                      {index() + 1}
                    </td>
                    <td class="font-rajdhani text-white py-3 px-4">
                      {`${profile.name} ${profile.surname}`}
                    </td>
                    <td></td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>

          <Show when={profiles().length === 0}>
            <div class="text-white/50 font-rajdhani text-center py-8">
              No participants yet
            </div>
          </Show>
        </Show>
      </div>
    </div>
  )
}
