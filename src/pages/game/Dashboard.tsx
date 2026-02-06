import { createSignal, onMount, onCleanup, For, Show } from 'solid-js'
import { Timeline, animate, splitText, stagger } from 'animejs'
import { useNavigate, A } from '@solidjs/router'
import { fetchProfiles, fetchTeams, isAuthenticated, getCurrentUserId, isAdmin, adminGenerateResetLink, adminDeleteUser, adminDeleteTeam, Profile, Team } from '../../lib/api'
import ConfirmDialog from '../../components/ConfirmDialog'
import Countdown from '../../components/Countdown'

type ViewMode = 'participants' | 'teams' | 'battles'

export default function Dashboard() {
  const navigate = useNavigate()
  const admin = isAdmin()

  const [profiles, setProfiles] = createSignal<Profile[]>([])
  const [teams, setTeams] = createSignal<Team[]>([])
  const [teamMap, setTeamMap] = createSignal<Map<string, string>>(new Map())
  const [viewMode, setViewMode] = createSignal<ViewMode>('battles')
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [teammateId, setTeammateId] = createSignal<string | null>(null)

  // Admin state
  const [copiedId, setCopiedId] = createSignal<string | null>(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = createSignal<Profile | null>(null)
  const [confirmDeleteTeam, setConfirmDeleteTeam] = createSignal<Team | null>(null)
  const [adminLoading, setAdminLoading] = createSignal(false)

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

  const loadData = async () => {
    try {
      const [profilesResult, teamsResult] = await Promise.all([
        fetchProfiles(),
        fetchTeams(),
      ])

      // Filter out TEST data in non-DEV environments
      const isDev = import.meta.env.VITE_STAGE === 'DEV'
      const filteredProfiles = isDev
        ? profilesResult
        : profilesResult.filter((p) => !p.name.toUpperCase().startsWith('TEST'))
      const filteredTeams = isDev
        ? teamsResult
        : (teamsResult ?? []).filter((t) => !t.name.toUpperCase().startsWith('TEST'))

      const userId = getCurrentUserId()
      // Sort teams: user's team first
      const sortedTeams = [...(filteredTeams ?? [])].sort((a, b) => {
        const aIsMine = a.member_1 === userId || a.member_2 === userId
        const bIsMine = b.member_1 === userId || b.member_2 === userId
        if (aIsMine && !bIsMine) return -1
        if (!aIsMine && bIsMine) return 1
        return 0
      })
      setTeams(sortedTeams)

      // Build a map from profile ID to team name
      const map = new Map<string, string>()
      for (const team of filteredTeams ?? []) {
        map.set(team.member_1, team.name)
        map.set(team.member_2, team.name)
      }
      setTeamMap(map)

      // Find user's teammate ID
      if (userId) {
        const userTeam = (filteredTeams ?? []).find(
          (t) => t.member_1 === userId || t.member_2 === userId
        )
        if (userTeam) {
          setTeammateId(userTeam.member_1 === userId ? userTeam.member_2 : userTeam.member_1)
        }
      }

      // Sort profiles: current user first, teammate second, then the rest
      const tmId = teammateId()
      const sorted = userId
        ? [...filteredProfiles].sort((a, b) => {
            if (a.id === userId) return -1
            if (b.id === userId) return 1
            if (a.id === tmId) return -1
            if (b.id === tmId) return 1
            return 0
          })
        : filteredProfiles
      setProfiles(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }

    setLoading(false)
  }

  onMount(async () => {
    if (!isAuthenticated()) {
      navigate('/game/login')
      return
    }
    await loadData()
  })

  // Admin actions
  const handleResetPassword = async (userId: string) => {
    const result = await adminGenerateResetLink(userId)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.data?.action_link) {
      await navigator.clipboard.writeText(result.data.action_link)
      setCopiedId(userId)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDeleteUser = async () => {
    const user = confirmDeleteUser()
    if (!user) return
    setAdminLoading(true)
    const result = await adminDeleteUser(user.id)
    setAdminLoading(false)
    setConfirmDeleteUser(null)
    if (result.error) {
      setError(result.error)
      return
    }
    await loadData()
  }

  const handleDeleteTeam = async () => {
    const team = confirmDeleteTeam()
    if (!team) return
    setAdminLoading(true)
    const result = await adminDeleteTeam(team.member_1, team.member_2)
    setAdminLoading(false)
    setConfirmDeleteTeam(null)
    if (result.error) {
      setError(result.error)
      return
    }
    await loadData()
  }

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
            onClick={() => setViewMode('battles')}
            class={`relative font-orbitron text-[0.7rem] sm:text-[0.75rem] uppercase tracking-[0.15em] pb-2.5 transition-all duration-300 ${
              viewMode() === 'battles'
                ? 'text-crimson [text-shadow:0_0_8px_var(--color-crimson)]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Battles
            <span class={`absolute bottom-0 left-0 right-0 h-0.5 bg-crimson transition-all duration-300 [box-shadow:0_0_10px_rgba(220,20,60,0.5)] ${
              viewMode() === 'battles' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
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
                  <th class={`font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] py-2 px-2 sm:py-3 sm:px-4 ${admin ? 'text-left' : 'text-right'}`}>
                    Team
                  </th>
                  <Show when={admin}>
                    <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-right py-2 px-2 sm:py-3 sm:px-4">
                      Actions
                    </th>
                  </Show>
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
                        <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 ${isMe ? 'text-white font-semibold' : 'text-white/90'}`}>
                          {formatName(profile.name, profile.surname)}
                        </td>
                        <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 max-w-40 sm:max-w-52 ${admin ? 'text-left' : 'text-right'}`}>
                          {teamName ? (
                            <span class={`block truncate ${isMyTeam ? 'text-pale-gold [text-shadow:0_0_6px_rgba(212,175,55,0.4)]' : 'text-white/60'}`}>
                              {teamName}
                            </span>
                          ) : (
                            <span class="text-white/25">—</span>
                          )}
                        </td>
                        <Show when={admin}>
                          <td class="py-2 px-2 sm:py-3 sm:px-4 text-right">
                            <Show when={!isMe}>
                              <div class="flex items-center justify-end gap-4">
                                {/* Reset password */}
                                <button
                                  onClick={() => handleResetPassword(profile.id)}
                                  title="Copy password reset link"
                                  class="text-white/30 hover:text-pale-gold transition-colors duration-200"
                                >
                                  <Show when={copiedId() === profile.id} fallback={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 0-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                    </svg>
                                  }>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-pale-gold">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </Show>
                                </button>
                                {/* Delete user */}
                                <button
                                  onClick={() => setConfirmDeleteUser(profile)}
                                  title="Delete user"
                                  class="text-white/30 hover:text-neon-red transition-colors duration-200"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </Show>
                          </td>
                        </Show>
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
                  <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-right py-2 px-2 sm:py-3 sm:px-4">
                    Members
                  </th>
                  <Show when={admin}>
                    <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-right py-2 px-2 sm:py-3 sm:px-4">
                      Actions
                    </th>
                  </Show>
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
                        <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 max-w-40 sm:max-w-52 truncate ${
                          isMyTeam ? 'text-pale-gold font-semibold [text-shadow:0_0_6px_rgba(212,175,55,0.4)]' : 'text-white/90'
                        }`}>
                          {team.name}
                        </td>
                        <td class="font-rajdhani text-[0.8rem] sm:text-base text-white/60 py-2 px-2 sm:py-3 sm:px-4 text-right">
                          {team.member_1_name.split(' ')[0]} & {team.member_2_name.split(' ')[0]}
                        </td>
                        <Show when={admin}>
                          <td class="py-2 px-2 sm:py-3 sm:px-4 text-right">
                            <Show when={!isMyTeam}>
                              <button
                                onClick={() => setConfirmDeleteTeam(team)}
                                title="Delete team"
                                class="text-white/30 hover:text-neon-red transition-colors duration-200"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </Show>
                          </td>
                        </Show>
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

          {/* Battles View */}
          <Show when={viewMode() === 'battles'}>
            <BattlesContent />
          </Show>
        </Show>

        {/* Admin confirm dialogs */}
        <ConfirmDialog
          open={!!confirmDeleteUser()}
          title="Delete User"
          message={`Delete ${confirmDeleteUser()?.name} ${confirmDeleteUser()?.surname}? This will also remove them from any team.`}
          confirmText="Delete"
          variant="danger"
          loading={adminLoading()}
          onConfirm={handleDeleteUser}
          onCancel={() => setConfirmDeleteUser(null)}
        />

        <ConfirmDialog
          open={!!confirmDeleteTeam()}
          title="Delete Team"
          message={`Delete team "${confirmDeleteTeam()?.name}"?`}
          confirmText="Delete"
          variant="danger"
          loading={adminLoading()}
          onConfirm={handleDeleteTeam}
          onCancel={() => setConfirmDeleteTeam(null)}
        />
      </div>
    </div>
  )
}

function BattlesContent() {
  let triggerTextAnimation: (() => void) | undefined

  return (
    <div class="w-full flex flex-col items-center justify-center py-16">
      <AnimatedLock onComplete={() => triggerTextAnimation?.()} />
      <AnimatedText onReady={(trigger) => { triggerTextAnimation = trigger }} />
    </div>
  )
}

function AnimatedLock(props: { onComplete?: () => void }) {
  let svgRef: SVGSVGElement | undefined
  let tl: InstanceType<typeof Timeline> | undefined

  onMount(() => {
    if (!svgRef) return

    const rect = svgRef.querySelector('rect')
    const path = svgRef.querySelector('path')
    if (!rect || !path) return

    tl = new Timeline({
      defaults: { ease: 'inOutExpo' },
      onComplete: () => props.onComplete?.(),
    })

    // Trace the lock shape
    tl.add(rect, {
      strokeDashoffset: [58, 0],
      duration: 1200,
    })

    tl.add(path, {
      strokeDashoffset: [26, 0],
      duration: 800,
    }, '-=400')
  })

  onCleanup(() => {
    tl?.pause()
  })

  return (
    <div class="relative w-20 h-20 flex items-center justify-center">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-pale-gold filter-[drop-shadow(0_0_12px_rgba(212,175,55,0.7))_drop-shadow(0_0_30px_rgba(212,175,55,0.4))]"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" style={{ "stroke-dasharray": "58", "stroke-dashoffset": "58" }} />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" style={{ "stroke-dasharray": "26", "stroke-dashoffset": "26" }} />
      </svg>
    </div>
  )
}

function AnimatedText(props: { onReady?: (trigger: () => void) => void }) {
  let containerRef: HTMLDivElement | undefined
  let labelRef: HTMLSpanElement | undefined

  const startAnimation = () => {
    if (!containerRef || !labelRef) return

    // Make container visible
    containerRef.style.opacity = '1'

    // Split the label text into characters
    const split = splitText(labelRef, { chars: true })

    // Set initial state for chars (hidden)
    split.chars.forEach((char) => {
      ;(char as HTMLElement).style.opacity = '0'
      ;(char as HTMLElement).style.transform = 'translateY(10px)'
    })

    // Animate characters with stagger
    animate(split.chars, {
      opacity: 1,
      translateY: 0,
      delay: stagger(40),
      duration: 400,
      ease: 'outQuad',
    })

    // Fade in the timer
    const timer = containerRef.querySelector('.countdown-timer')
    if (timer) {
      animate(timer, {
        opacity: [0, 1],
        translateY: [15, 0],
        duration: 500,
        delay: 200,
        ease: 'outQuad',
      })
    }
  }

  onMount(() => {
    props.onReady?.(startAnimation)
  })

  return (
    <div ref={containerRef} class="mt-6" style={{ opacity: 0 }}>
      <div class="flex flex-col items-center gap-2 mt-2">
        <span
          ref={labelRef}
          class="font-orbitron text-[0.55rem] text-white/40 tracking-[0.2em] uppercase"
        >
          Coming in
        </span>
        <div class="countdown-timer" style={{ opacity: 0 }}>
          <Countdown label="" size="large" />
        </div>
      </div>
    </div>
  )
}
