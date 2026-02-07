import { createSignal, onMount, onCleanup, For, Show } from 'solid-js'
import { Timeline, animate, splitText, stagger } from 'animejs'
import { useNavigate, A } from '@solidjs/router'
import { fetchProfiles, fetchTeams, fetchBattles, fetchLeaderboard, setBattleResult, lockBattleResult, isAuthenticated, getCurrentUserId, isAdmin, adminSetPassword, adminFetchEmails, adminDeleteUser, adminDeleteTeam, Profile, Team, Battle, LeaderboardEntry } from '../../lib/api'
import ConfirmDialog from '../../components/ConfirmDialog'
import Countdown from '../../components/Countdown'

const EVENT_TIME = new Date('2026-02-07T20:30:00').getTime()
const RESULTS_TIME = new Date('2026-02-07T22:30:00').getTime()

type ViewMode = 'participants' | 'teams' | 'battles' | 'leaderboard'

export default function Dashboard() {
  const navigate = useNavigate()
  const admin = isAdmin()

  const [profiles, setProfiles] = createSignal<Profile[]>([])
  const [teams, setTeams] = createSignal<Team[]>([])
  const [viewMode, setViewMode] = createSignal<ViewMode>('battles')
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [teammateId, setTeammateId] = createSignal<string | null>(null)

  // Admin state
  const [emailMap, setEmailMap] = createSignal<Record<string, string>>({})
  const [setPasswordUser, setSetPasswordUser] = createSignal<Profile | null>(null)
  const [newPassword, setNewPassword] = createSignal('')
  const [passwordSuccess, setPasswordSuccess] = createSignal<string | null>(null)
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

      // Fetch emails for admin view
      if (admin) {
        const emailResult = await adminFetchEmails()
        if (emailResult.data) setEmailMap(emailResult.data.emails)
      }
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
  const handleSetPassword = async () => {
    const user = setPasswordUser()
    const pw = newPassword().trim()
    if (!user || !pw) return
    setAdminLoading(true)
    const result = await adminSetPassword(user.id, pw)
    setAdminLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSetPasswordUser(null)
    setNewPassword('')
    setPasswordSuccess(user.id)
    setTimeout(() => setPasswordSuccess(null), 2000)
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
        <div class="flex gap-4 sm:gap-6 overflow-x-auto w-full justify-center">
          <button
            onClick={() => setViewMode('battles')}
            class={`relative font-orbitron text-[0.6rem] sm:text-[0.75rem] uppercase tracking-[0.1em] sm:tracking-[0.15em] pb-2.5 whitespace-nowrap transition-all duration-300 ${
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
            class={`relative font-orbitron text-[0.6rem] sm:text-[0.75rem] uppercase tracking-[0.1em] sm:tracking-[0.15em] pb-2.5 whitespace-nowrap transition-all duration-300 ${
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
          <Show when={admin}>
            <button
              onClick={() => setViewMode('leaderboard')}
              class={`relative font-orbitron text-[0.6rem] sm:text-[0.75rem] uppercase tracking-[0.1em] sm:tracking-[0.15em] pb-2.5 whitespace-nowrap transition-all duration-300 ${
                viewMode() === 'leaderboard'
                  ? 'text-crimson [text-shadow:0_0_8px_var(--color-crimson)]'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Leaderboard
              <span class={`absolute bottom-0 left-0 right-0 h-0.5 bg-crimson transition-all duration-300 [box-shadow:0_0_10px_rgba(220,20,60,0.5)] ${
                viewMode() === 'leaderboard' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
              }`} />
            </button>
            <button
              onClick={() => setViewMode('participants')}
              class={`relative font-orbitron text-[0.6rem] sm:text-[0.75rem] uppercase tracking-[0.1em] sm:tracking-[0.15em] pb-2.5 whitespace-nowrap transition-all duration-300 ${
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
          </Show>
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
          {/* Participants View (admin only) */}
          <Show when={admin && viewMode() === 'participants'}>
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
                    Email
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
                        <td class="font-rajdhani text-[0.7rem] sm:text-sm py-2 px-2 sm:py-3 sm:px-4 text-left max-w-40 sm:max-w-52">
                          <span class="block truncate text-white/50">
                            {emailMap()[profile.id] ?? '—'}
                          </span>
                        </td>
                        <Show when={admin}>
                          <td class="py-2 px-2 sm:py-3 sm:px-4 text-right">
                            <Show when={!isMe}>
                              <div class="flex items-center justify-end gap-4">
                                {/* Set password */}
                                <button
                                  onClick={() => { setSetPasswordUser(profile); setNewPassword('') }}
                                  title="Set password"
                                  class="text-white/30 hover:text-pale-gold transition-colors duration-200"
                                >
                                  <Show when={passwordSuccess() === profile.id} fallback={
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

          {/* Leaderboard View (admin only) */}
          <Show when={admin && viewMode() === 'leaderboard'}>
            <LeaderboardView />
          </Show>

          {/* Battles View */}
          <Show when={viewMode() === 'battles'}>
            <BattlesContent />
          </Show>
        </Show>

        {/* Set password dialog */}
        <Show when={setPasswordUser()}>
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSetPasswordUser(null)} />
            <div class="relative w-full max-w-sm bg-dark-bg border border-pale-gold/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div class="p-5 border-b border-pale-gold/20">
                <h2 class="font-orbitron text-[0.85rem] text-pale-gold uppercase tracking-[0.15em]">
                  Set Password
                </h2>
                <p class="font-rajdhani text-white/50 text-sm mt-1">
                  {setPasswordUser()!.name} {setPasswordUser()!.surname}
                </p>
              </div>
              <div class="p-5">
                <input
                  type="text"
                  value={newPassword()}
                  onInput={(e) => setNewPassword(e.currentTarget.value)}
                  placeholder="New password"
                  class="w-full h-10 px-3 bg-white/5 border border-white/10 text-white font-rajdhani text-base focus:outline-none focus:border-pale-gold/50 transition-colors"
                />
              </div>
              <div class="flex h-12 border-t border-pale-gold/20">
                <button
                  onClick={() => setSetPasswordUser(null)}
                  disabled={adminLoading()}
                  class="flex-1 font-orbitron text-[0.7rem] text-white/40 uppercase tracking-[0.2em] hover:text-white/70 hover:bg-white/5 transition-all duration-200 disabled:opacity-50 border-r border-pale-gold/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetPassword}
                  disabled={adminLoading() || !newPassword().trim()}
                  class="flex-1 font-orbitron text-[0.7rem] text-pale-gold uppercase tracking-[0.2em] hover:bg-pale-gold/10 hover:[text-shadow:0_0_8px_rgba(212,175,55,0.5)] transition-all duration-200 disabled:opacity-50"
                >
                  {adminLoading() ? '...' : 'Set'}
                </button>
              </div>
            </div>
          </div>
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
  // If already past event time, skip animation entirely
  if (Date.now() >= EVENT_TIME) {
    return <BattlesList />
  }

  const [showBattles, setShowBattles] = createSignal(false)

  let triggerTextAnimation: (() => void) | undefined

  const handleCountdownComplete = () => {
    setShowBattles(true)
  }

  return (
    <Show when={showBattles()} fallback={
      <div class="w-full flex flex-col items-center justify-center py-16">
        <AnimatedLock onComplete={() => triggerTextAnimation?.()} />
        <AnimatedText onReady={(trigger) => { triggerTextAnimation = trigger }} onComplete={handleCountdownComplete} />
      </div>
    }>
      <BattlesList />
    </Show>
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

function AnimatedText(props: { onReady?: (trigger: () => void) => void; onComplete?: () => void }) {
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
          Matchups revealed in
        </span>
        <div class="countdown-timer" style={{ opacity: 0 }}>
          <Countdown label="" size="large" onComplete={props.onComplete} />
        </div>
      </div>
    </div>
  )
}

function BattlesList() {
  const [battles, setBattles] = createSignal<Battle[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [actionLoading, setActionLoading] = createSignal<string | null>(null)
  const [confirmLock, setConfirmLock] = createSignal<Battle | null>(null)
  const [resultsOpen, setResultsOpen] = createSignal(Date.now() >= RESULTS_TIME)

  onMount(async () => {
    // Poll until results time if not yet open
    if (!resultsOpen()) {
      const interval = setInterval(() => {
        if (Date.now() >= RESULTS_TIME) {
          setResultsOpen(true)
          clearInterval(interval)
        }
      }, 1000)
      onCleanup(() => clearInterval(interval))
    }
    const result = await fetchBattles()
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setBattles(result.data.battles)
    }
    setLoading(false)
  })

  const handleSetResult = async (battleId: string, result: 'won' | 'lost') => {
    setActionLoading(battleId)
    const res = await setBattleResult(battleId, result)
    setActionLoading(null)
    if (res.error) {
      setError(res.error)
      return
    }
    const refreshed = await fetchBattles()
    if (refreshed.data) setBattles(refreshed.data.battles)
  }

  const handleLockResult = async () => {
    const battle = confirmLock()
    if (!battle) return
    setActionLoading(battle.id)
    setConfirmLock(null)
    const res = await lockBattleResult(battle.id)
    setActionLoading(null)
    if (res.error) {
      setError(res.error)
      return
    }
    const refreshed = await fetchBattles()
    if (refreshed.data) setBattles(refreshed.data.battles)
  }

  const gameIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('flip cup')) return '🥤'
    if (lower.includes('jenga')) return '🧱'
    if (lower.includes('4 in a row') || lower.includes('four')) return '🔴'
    if (lower.includes('beer pong')) return '🏓'
    if (lower.includes('bounce')) return '🏀'
    return '🎮'
  }

  const stateLabel = (state: string) => {
    if (state === 'won') return 'WON'
    if (state === 'lost') return 'LOST'
    return 'PENDING'
  }

  const stateColor = (state: string) => {
    if (state === 'won') return 'text-[#90EE90]'
    if (state === 'lost') return 'text-neon-red'
    return 'text-white/40'
  }

  return (
    <div class="w-full flex flex-col gap-2">
      <Show when={loading()}>
        <div class="text-white/50 font-rajdhani text-center py-8">Loading battles...</div>
      </Show>

      <Show when={error()}>
        <div class="bg-blood-red/30 border border-blood-red text-neon-red py-2.5 px-3.5 text-[0.9rem] text-center">
          {error()}
        </div>
      </Show>

      <Show when={!loading() && !error() && battles().length === 0}>
        <div class="text-white/50 font-rajdhani text-center py-8">
          No battles assigned yet
        </div>
      </Show>

      <For each={[...battles()].sort((a, b) => {
        const priority = (battle: Battle) => {
          const myState = battle.my_team.state
          const myLocked = battle.my_team.result_locked
          const oppLocked = battle.opponent.result_locked
          if (myState !== 'pending' && !myLocked) return 0
          if (myState === 'pending') return 1
          if (myLocked && !oppLocked) return 2
          return 3
        }
        return priority(a) - priority(b)
      })}>
        {(battle, index) => {
          const myState = () => battle.my_team.state
          const myLocked = () => battle.my_team.result_locked
          const oppLocked = () => battle.opponent.result_locked
          const isLoading = () => actionLoading() === battle.id
          const isFinal = () => myLocked() && oppLocked()

          return (
            <div
              class={`bg-black/70 border-l-[3px] w-full row-stagger ${isFinal() ? 'border-l-pale-gold/50' : 'border-l-crimson/50'}`}
              style={{ 'animation-delay': `${index() * 60}ms` }}
            >
              <div class="px-3.5 py-2.5 flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  {/* Game name + opponent */}
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-orbitron text-[0.85rem] text-pale-gold tracking-[0.08em] uppercase">
                        {gameIcon(battle.battle)} {battle.battle}
                      </span>
                      <Show when={isFinal()}>
                        <span class="font-orbitron text-[0.5rem] text-pale-gold/70 tracking-[0.05em] uppercase">locked</span>
                      </Show>
                    </div>
                    <div class="font-rajdhani text-[0.85rem] text-white/50 truncate mt-0.5">
                      vs <span class="text-white/70">{battle.opponent.name}</span>
                      <span class="text-white/25 ml-1.5">({battle.opponent.members.map(m => m.name).join(' & ')})</span>
                    </div>
                  </div>

                  <Show when={myLocked()}>
                    <div class="flex flex-col items-end shrink-0">
                      <span class={`font-orbitron text-[0.65rem] tracking-[0.08em] ${stateColor(myState())}`}>
                        {stateLabel(myState())}
                      </span>
                      <Show when={!oppLocked()}>
                        <span class="font-rajdhani text-[0.7rem] text-white/25">opponents didn't lock</span>
                      </Show>
                    </div>
                  </Show>
                </div>

                {/* Result controls */}
                <Show when={!myLocked()}>
                  <Show when={resultsOpen()} fallback={
                    <div class="font-orbitron text-[0.5rem] text-white/25 uppercase tracking-[0.1em]">
                      Battles unlock at 22:30
                    </div>
                  }>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2.5">
                        <button
                          onClick={() => handleSetResult(battle.id, 'won')}
                          disabled={isLoading()}
                          class={`px-2.5 py-1 rounded font-orbitron text-[0.6rem] uppercase tracking-[0.05em] border transition-all duration-200 disabled:opacity-40 ${
                            myState() === 'won'
                              ? 'bg-[rgba(0,100,0,0.3)] border-[#228B22] text-[#90EE90]'
                              : 'bg-transparent border-white/10 text-white/30 hover:border-[#228B22] hover:text-[#90EE90]'
                          }`}
                        >
                          Win
                        </button>
                        <button
                          onClick={() => handleSetResult(battle.id, 'lost')}
                          disabled={isLoading()}
                          class={`px-2.5 py-1 rounded font-orbitron text-[0.6rem] uppercase tracking-[0.05em] border transition-all duration-200 disabled:opacity-40 ${
                            myState() === 'lost'
                              ? 'bg-blood-red/30 border-blood-red text-neon-red'
                              : 'bg-transparent border-white/10 text-white/30 hover:border-blood-red hover:text-neon-red'
                          }`}
                        >
                          Lose
                        </button>
                      </div>
                      <Show when={myState() !== 'pending'}>
                        <button
                          onClick={() => setConfirmLock(battle)}
                          disabled={isLoading()}
                          class="lock-glow px-2 py-1 rounded font-orbitron text-[0.55rem] uppercase tracking-[0.05em] text-pale-gold/70 hover:text-pale-gold transition-all duration-200 disabled:opacity-40"
                        >
                          Lock
                        </button>
                      </Show>
                    </div>
                  </Show>
                </Show>
              </div>
            </div>
          )
        }}
      </For>

      <ConfirmDialog
        open={!!confirmLock()}
        title="Lock Result"
        message={`Lock your result as "${confirmLock()?.my_team.state?.toUpperCase()}" for ${confirmLock()?.battle}? This cannot be undone.`}
        confirmText="Lock"
        variant="warning"
        loading={!!actionLoading()}
        onConfirm={handleLockResult}
        onCancel={() => setConfirmLock(null)}
      />
    </div>
  )
}

function LeaderboardView() {
  const [leaderboard, setLeaderboard] = createSignal<LeaderboardEntry[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')

  onMount(async () => {
    const result = await fetchLeaderboard()
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setLeaderboard(result.data.leaderboard)
    }
    setLoading(false)
  })

  return (
    <div class="w-full">
      <Show when={loading()}>
        <div class="text-white/50 font-rajdhani text-center py-8">Loading leaderboard...</div>
      </Show>

      <Show when={error()}>
        <div class="bg-blood-red/30 border border-blood-red text-neon-red py-2.5 px-3.5 text-[0.9rem] text-center">
          {error()}
        </div>
      </Show>

      <Show when={!loading() && !error()}>
        <Show when={leaderboard().length === 0}>
          <div class="text-white/50 font-rajdhani text-center py-8">
            No results yet
          </div>
        </Show>

        <table class="w-full border-collapse">
          <Show when={leaderboard().length > 0}>
            <thead>
              <tr class="border-b border-crimson/40">
                <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-left py-2 px-2 sm:py-3 sm:px-4">
                  #
                </th>
                <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-left py-2 px-2 sm:py-3 sm:px-4">
                  Team
                </th>
                <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-right py-2 px-2 sm:py-3 sm:px-4">
                  W
                </th>
                <th class="font-orbitron text-[0.55rem] sm:text-[0.7rem] text-crimson uppercase tracking-[0.1em] sm:tracking-[0.15em] text-right py-2 px-2 sm:py-3 sm:px-4">
                  L
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={leaderboard()}>
                {(entry, index) => {
                  const rank = index() + 1

                  return (
                    <tr
                      class={`border-b border-crimson/20 hover:bg-crimson/5 transition-colors duration-200 row-stagger ${
                        rank <= 3 ? 'bg-crimson/5' : ''
                      }`}
                      style={{ "animation-delay": `${index() * 50}ms` }}
                    >
                      <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 ${
                        rank === 1 ? 'text-pale-gold font-bold' : rank <= 3 ? 'text-pale-gold/70' : 'text-white/40'
                      }`}>
                        {String(rank).padStart(2, '0')}
                      </td>
                      <td class={`font-rajdhani text-[0.8rem] sm:text-base py-2 px-2 sm:py-3 sm:px-4 max-w-40 sm:max-w-52 truncate ${
                        rank === 1 ? 'text-pale-gold font-semibold [text-shadow:0_0_6px_rgba(212,175,55,0.4)]' : 'text-white/90'
                      }`}>
                        {entry.team}
                      </td>
                      <td class="font-rajdhani text-[0.8rem] sm:text-base text-[#90EE90] py-2 px-2 sm:py-3 sm:px-4 text-right">
                        {entry.wins}
                      </td>
                      <td class="font-rajdhani text-[0.8rem] sm:text-base text-neon-red py-2 px-2 sm:py-3 sm:px-4 text-right">
                        {entry.losses}
                      </td>
                    </tr>
                  )
                }}
              </For>
            </tbody>
          </Show>
        </table>
      </Show>
    </div>
  )
}
