import { createSignal, onMount, For, Show } from 'solid-js'
import { useNavigate, A } from '@solidjs/router'
import { fetchProfiles, fetchTeams, logout, isAuthenticated, getCurrentUserId, Profile, Team } from '../../lib/api'

type ViewMode = 'participants' | 'teams'

export default function Dashboard() {
  const navigate = useNavigate()

  const [profiles, setProfiles] = createSignal<Profile[]>([])
  const [teams, setTeams] = createSignal<Team[]>([])
  const [teamMap, setTeamMap] = createSignal<Map<string, string>>(new Map())
  const [viewMode, setViewMode] = createSignal<ViewMode>('participants')
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')

  // Get set of duplicate first names
  const getDuplicateNames = () => {
    const counts = new Map<string, number>()
    for (const p of profiles()) {
      counts.set(p.name, (counts.get(p.name) || 0) + 1)
    }
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name))
  }

  // Format name: show full surname only if first name is duplicated
  const formatName = (name: string, surname: string) => {
    if (getDuplicateNames().has(name)) {
      return `${name} ${surname}`
    }
    return `${name} ${surname.charAt(0)}.`
  }

  onMount(async () => {
    if (!isAuthenticated()) {
      navigate('/game/login')
      return
    }

    try {
      const [profilesResult, teamsResult] = await Promise.all([
        fetchProfiles(),
        fetchTeams(),
      ])

      // Sort profiles so current user is first
      const userId = getCurrentUserId()
      const sorted = userId
        ? [...profilesResult].sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : 0))
        : profilesResult
      setProfiles(sorted)
      setTeams(teamsResult ?? [])

      // Build a map from profile ID to team name
      const map = new Map<string, string>()
      for (const team of teamsResult ?? []) {
        map.set(team.member_1, team.name)
        map.set(team.member_2, team.name)
      }
      setTeamMap(map)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
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
  {/* Shown on small screens, hidden on medium and up */}
  <span class="md:hidden">CBI</span>
  
  {/* Hidden on small screens, shown on medium and up */}
  <span class="hidden md:inline">CB INCIDENT</span>
</h1>

          <div class="flex items-center gap-4">
            <A
              href="/game/team"
              class="font-orbitron text-[0.7rem] text-pale-gold uppercase tracking-[0.15em] hover:[text-shadow:0_0_8px_rgba(212,175,55,0.5)] transition-all duration-200"
            >
              My Team
            </A>
            <button
              onClick={handleLogout}
              class="font-orbitron text-[0.7rem] text-crimson uppercase tracking-[0.15em] hover:[text-shadow:0_0_8px_var(--color-crimson)] transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div class="flex gap-2">
          <button
            onClick={() => setViewMode('participants')}
            class={`font-orbitron text-[0.75rem] uppercase tracking-[0.15em] px-4 py-2 border transition-all duration-200 ${
              viewMode() === 'participants'
                ? 'text-crimson border-crimson [text-shadow:0_0_8px_var(--color-crimson)]'
                : 'text-white/40 border-white/20 hover:text-white/60 hover:border-white/40'
            }`}
          >
            Participants
          </button>
          <button
            onClick={() => setViewMode('teams')}
            class={`font-orbitron text-[0.75rem] uppercase tracking-[0.15em] px-4 py-2 border transition-all duration-200 ${
              viewMode() === 'teams'
                ? 'text-crimson border-crimson [text-shadow:0_0_8px_var(--color-crimson)]'
                : 'text-white/40 border-white/20 hover:text-white/60 hover:border-white/40'
            }`}
          >
            Teams
          </button>
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
          {/* Participants View */}
          <Show when={viewMode() === 'participants'}>
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-crimson/40">
                  <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-left py-2 px-2 sm:py-3 sm:px-4">
                    #
                  </th>
                  <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-left py-2 px-2 sm:py-3 sm:px-4">
                    Name
                  </th>
                  <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-left py-2 px-2 sm:py-3 sm:px-4">
                    Team
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={profiles()}>
                  {(profile, index) => (
                    <tr class="border-b border-crimson/20 hover:bg-crimson/5 transition-colors duration-200">
                      <td class="font-rajdhani text-[0.8rem] sm:text-base text-white/50 py-2 px-2 sm:py-3 sm:px-4">
                        {index() + 1}
                      </td>
                      <td class="font-rajdhani text-[0.8rem] sm:text-base text-white py-2 px-2 sm:py-3 sm:px-4">
                        {formatName(profile.name, profile.surname)}
                      </td>
                      <td class="font-rajdhani text-[0.8rem] sm:text-base text-white/70 py-2 px-2 sm:py-3 sm:px-4">
                        {teamMap().get(profile.id) || '—'}
                      </td>
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

          {/* Teams View */}
          <Show when={viewMode() === 'teams'}>
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-crimson/40">
                  <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-left py-2 px-2 sm:py-3 sm:px-4">
                    #
                  </th>
                  <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-left py-2 px-2 sm:py-3 sm:px-4">
                    Team Name
                  </th>
                  <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-left py-2 px-2 sm:py-3 sm:px-4">
                    Members
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={teams()}>
                  {(team, index) => (
                    <tr class="border-b border-crimson/20 hover:bg-crimson/5 transition-colors duration-200">
                      <td class="font-rajdhani text-[0.8rem] sm:text-base text-white/50 py-2 px-2 sm:py-3 sm:px-4">
                        {index() + 1}
                      </td>
                      <td class="font-rajdhani text-[0.8rem] sm:text-base text-white py-2 px-2 sm:py-3 sm:px-4">
                        {team.name}
                      </td>
                      <td class="font-rajdhani text-[0.8rem] sm:text-base text-white/70 py-2 px-2 sm:py-3 sm:px-4">
                        {team.member_1_name.split(' ')[0]} & {team.member_2_name.split(' ')[0]}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>

            <Show when={teams().length === 0}>
              <div class="text-white/50 font-rajdhani text-center py-8">
                No teams yet
              </div>
            </Show>
          </Show>
        </Show>
      </div>
    </div>
  )
}
