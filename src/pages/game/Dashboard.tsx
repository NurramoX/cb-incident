import { createSignal, onMount, For, Show } from 'solid-js'
import { useNavigate, A } from '@solidjs/router'
import { fetchProfiles, fetchTeams, isAuthenticated, getCurrentUserId, Profile, Team } from '../../lib/api'

type ViewMode = 'participants' | 'teams'

export default function Dashboard() {
  const navigate = useNavigate()

  const [profiles, setProfiles] = createSignal<Profile[]>([])
  const [teams, setTeams] = createSignal<Team[]>([])
  const [teamMap, setTeamMap] = createSignal<Map<string, string>>(new Map())
  const [viewMode, setViewMode] = createSignal<ViewMode>('participants')
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [teammateId, setTeammateId] = createSignal<string | null>(null)

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

      const userId = getCurrentUserId()
      // Sort teams: user's team first
      const sortedTeams = [...(teamsResult ?? [])].sort((a, b) => {
        const aIsMine = a.member_1 === userId || a.member_2 === userId
        const bIsMine = b.member_1 === userId || b.member_2 === userId
        if (aIsMine && !bIsMine) return -1
        if (!aIsMine && bIsMine) return 1
        return 0
      })
      setTeams(sortedTeams)

      // Build a map from profile ID to team name
      const map = new Map<string, string>()
      for (const team of teamsResult ?? []) {
        map.set(team.member_1, team.name)
        map.set(team.member_2, team.name)
      }
      setTeamMap(map)

      // Find user's teammate ID
      if (userId) {
        const userTeam = (teamsResult ?? []).find(
          (t) => t.member_1 === userId || t.member_2 === userId
        )
        if (userTeam) {
          setTeammateId(userTeam.member_1 === userId ? userTeam.member_2 : userTeam.member_1)
        }
      }

      // Sort profiles: current user first, teammate second, then the rest
      const tmId = teammateId()
      const sorted = userId
        ? [...profilesResult].sort((a, b) => {
            if (a.id === userId) return -1
            if (b.id === userId) return 1
            if (a.id === tmId) return -1
            if (b.id === tmId) return 1
            return 0
          })
        : profilesResult
      setProfiles(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }

    setLoading(false)
  })

  return (
    <div class="relative w-full min-h-screen flex flex-col items-center p-4 pt-8">
      <div class="relative z-10 w-full max-w-3xl flex flex-col items-center gap-6">
        {/* Header */}
        <div class="w-full flex items-center justify-between">
          <h1 class="font-orbitron font-black text-[1.5rem] text-transparent [-webkit-text-stroke:1px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5)] tracking-[0.1em]">
            <span class="md:hidden">CBI<span class="text-[0.55rem] tracking-[0.05em] text-pale-gold [-webkit-text-stroke:0]">ncident</span></span>
            <span class="hidden md:inline">CB INCIDENT</span>
          </h1>

          <div class="flex items-center gap-8">
            <A
              href="/game/team"
              class="font-orbitron text-[0.7rem] text-pale-gold uppercase tracking-[0.15em] hover:[text-shadow:0_0_8px_rgba(212,175,55,0.5)] transition-all duration-200"
            >
              My Team
            </A>
            <A
              href="/game/profile"
              class="text-pale-gold hover:[filter:drop-shadow(0_0_6px_rgba(212,175,55,0.5))] transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </A>
          </div>
        </div>

        {/* View Toggle */}
        <div class="flex gap-6">
          <button
            onClick={() => setViewMode('participants')}
            class={`relative font-orbitron text-[0.7rem] sm:text-[0.75rem] uppercase tracking-[0.15em] pb-2.5 transition-all duration-300 ${
              viewMode() === 'participants'
                ? 'text-crimson [text-shadow:0_0_8px_var(--color-crimson)]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Participants
            <span class={`absolute bottom-0 left-0 right-0 h-0.5 bg-crimson transition-all duration-300 [box-shadow:0_0_10px_rgba(220,20,60,0.5)] ${
              viewMode() === 'participants' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`} />
          </button>
          <button
            onClick={() => setViewMode('teams')}
            class={`relative font-orbitron text-[0.7rem] sm:text-[0.75rem] uppercase tracking-[0.15em] pb-2.5 transition-all duration-300 ${
              viewMode() === 'teams'
                ? 'text-crimson [text-shadow:0_0_8px_var(--color-crimson)]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Teams
            <span class={`absolute bottom-0 left-0 right-0 h-0.5 bg-crimson transition-all duration-300 [box-shadow:0_0_10px_rgba(220,20,60,0.5)] ${
              viewMode() === 'teams' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`} />
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
                  <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-right py-2 px-2 sm:py-3 sm:px-4">
                    Team
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={profiles()}>
                  {(profile, index) => {
                    const userId = getCurrentUserId()
                    const isMe = profile.id === userId
                    const isMate = profile.id === teammateId()
                    const isMyTeam = teamMap().get(profile.id) && teamMap().get(profile.id) === teamMap().get(userId ?? '')
                    const teamName = teamMap().get(profile.id)

                    const hasTeam = !!teammateId()

                    return (
                      <tr
                        class={`border-b border-crimson/20 hover:bg-crimson/5 transition-colors duration-200 ${
                          (isMe || isMate) && hasTeam
                            ? 'team-row-glow border-l-2 bg-crimson/5'
                            : 'row-stagger'
                        }`}
                        style={{ "animation-delay": `${index() * 50}ms` }}
                      >
                        <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 ${isMe ? 'text-crimson' : 'text-white/40'}`}>
                          {String(index() + 1).padStart(2, '0')}
                        </td>
                        <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 ${isMe ? 'text-white font-semibold' : 'text-white'}`}>
                          {formatName(profile.name, profile.surname)}
                        </td>
                        <td class="font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 text-right">
                          {teamName ? (
                            <span class={isMyTeam ? 'text-pale-gold [text-shadow:0_0_6px_rgba(212,175,55,0.4)]' : 'text-white/70'}>
                              {teamName}
                            </span>
                          ) : (
                            <span class="text-white/30">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  }}
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
                  {(team, index) => {
                    const userId = getCurrentUserId()
                    const isMyTeam = team.member_1 === userId || team.member_2 === userId

                    return (
                      <tr
                        class={`border-b border-crimson/20 hover:bg-crimson/5 transition-colors duration-200 ${
                          isMyTeam ? 'team-row-glow border-l-2 bg-crimson/5' : 'row-stagger'
                        }`}
                        style={{ "animation-delay": `${index() * 50}ms` }}
                      >
                        <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 ${isMyTeam ? 'text-pale-gold' : 'text-white/40'}`}>
                          {String(index() + 1).padStart(2, '0')}
                        </td>
                        <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 ${
                          isMyTeam ? 'text-pale-gold font-semibold [text-shadow:0_0_6px_rgba(212,175,55,0.4)]' : 'text-white'
                        }`}>
                          {team.name}
                        </td>
                        <td class="font-rajdhani text-[0.8rem] sm:text-base text-white/70 py-2 px-2 sm:py-3 sm:px-4">
                          {team.member_1_name.split(' ')[0]} & {team.member_2_name.split(' ')[0]}
                        </td>
                      </tr>
                    )
                  }}
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
