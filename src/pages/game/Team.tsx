import { createSignal, onMount, createMemo, Show } from 'solid-js'
import { useNavigate, A } from '@solidjs/router'
import {
  fetchProfiles,
  fetchTeams,
  createTeam,
  updateTeam,
  disbandTeam,
  isAuthenticated,
  getCurrentUserId,
  Profile,
  Team,
} from '../../lib/api'
import Combobox, { ComboboxOption } from '../../components/Combobox'

export default function TeamPage() {
  const navigate = useNavigate()

  const [profiles, setProfiles] = createSignal<Profile[]>([])
  const [takenIds, setTakenIds] = createSignal<Set<string>>(new Set())
  const [myTeam, setMyTeam] = createSignal<Team | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)

  // Form state
  const [teamName, setTeamName] = createSignal('')
  const [selectedPartner, setSelectedPartner] = createSignal('')
  const [editMode, setEditMode] = createSignal(false)

  const userId = getCurrentUserId()

  // Get available partners (not current user, not already in a team)
  const partnerOptions = createMemo<ComboboxOption[]>(() => {
    const taken = takenIds()
    return profiles()
      .filter((p) => p.id !== userId && !taken.has(p.id))
      .map((p) => ({
        id: p.id,
        label: formatName(p.name, p.surname),
      }))
  })

  const loadData = async () => {
    try {
      const [profilesResult, teamsResult] = await Promise.all([fetchProfiles(), fetchTeams()])

      setProfiles(profilesResult)

      // Build set of profile IDs already in teams
      const taken = new Set<string>()
      for (const t of teamsResult) {
        taken.add(t.member_1)
        taken.add(t.member_2)
      }
      setTakenIds(taken)

      // Find current user's team
      const userTeam = teamsResult.find((t) => t.member_1 === userId || t.member_2 === userId)
      setMyTeam(userTeam || null)

      if (userTeam) {
        setTeamName(userTeam.name)
      } else {
        // Reset form state if no team
        setTeamName('')
        setSelectedPartner('')
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

  const handleCreate = async (e: Event) => {
    e.preventDefault()
    if (!teamName().trim() || !selectedPartner()) return

    setSubmitting(true)
    setError('')

    const result = await createTeam({
      name: teamName().trim(),
      partnerId: selectedPartner(),
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    await loadData()
    setSubmitting(false)
  }

  const handleUpdate = async (e: Event) => {
    e.preventDefault()
    if (!teamName().trim()) return

    setSubmitting(true)
    setError('')

    const result = await updateTeam({ name: teamName().trim() })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    setEditMode(false)
    await loadData()
    setSubmitting(false)
  }

  const handleDisband = async () => {
    if (!confirm('Are you sure you want to disband your team?')) return

    setSubmitting(true)
    setError('')

    const result = await disbandTeam()

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    setTeamName('')
    setSelectedPartner('')
    await loadData()
    setSubmitting(false)
  }

  const formatName = (name: string, surname: string) => `${name} ${surname.charAt(0)}.`

  return (
    <div class="relative w-full min-h-screen flex flex-col items-center p-4 pt-8">
      <div class="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Header */}
        <div class="w-full flex items-center justify-between">
          <h1 class="font-orbitron font-black text-[1.5rem] text-transparent [-webkit-text-stroke:1px_var(--color-pale-gold)] [text-shadow:0_0_12px_rgba(212,175,55,0.5)] tracking-[0.1em]">
            CB INCIDENT
          </h1>
          <A
            href="/game/dashboard"
            class="font-orbitron text-[0.7rem] text-crimson uppercase tracking-[0.15em] hover:[text-shadow:0_0_8px_var(--color-crimson)] transition-all duration-200"
          >
            Back
          </A>
        </div>

        <div class="font-orbitron text-[0.85rem] text-crimson uppercase tracking-[0.25em] [text-shadow:0_0_8px_var(--color-crimson)]">
          // Team Management //
        </div>

        {/* Loading */}
        <Show when={loading()}>
          <div class="text-white/50 font-rajdhani">Loading...</div>
        </Show>

        {/* Error */}
        <Show when={error()}>
          <div class="w-full bg-blood-red/30 border border-blood-red text-neon-red py-2.5 px-3.5 text-[0.9rem] text-center">
            {error()}
          </div>
        </Show>

        <Show when={!loading()}>
          {/* No Team - Create Form */}
          <Show when={!myTeam()}>
            <form onSubmit={handleCreate} class="w-full flex flex-col gap-4">
              <div class="text-white/70 font-rajdhani text-center">
                You don't have a team yet. Create one!
              </div>

              <div class="flex flex-col gap-1">
                <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName()}
                  onInput={(e) => setTeamName(e.currentTarget.value)}
                  placeholder="Enter team name"
                  disabled={submitting()}
                  required
                  class="bg-dark-bg/90 border border-crimson/40 py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]">
                  Select Partner
                </label>
                <Combobox
                  options={partnerOptions()}
                  value={selectedPartner()}
                  onChange={setSelectedPartner}
                  placeholder="Type to search..."
                  disabled={submitting()}
                />
              </div>

              <button
                type="submit"
                disabled={submitting() || !teamName().trim() || !selectedPartner()}
                class="glow-btn mt-4 w-full h-14 flex items-center justify-center font-orbitron text-[0.9rem] text-white uppercase tracking-[0.2em]"
              >
                {submitting() ? 'CREATING...' : 'CREATE TEAM'}
              </button>
            </form>
          </Show>

          {/* Has Team - View/Edit */}
          <Show when={myTeam()}>
            <div class="w-full flex flex-col gap-4">
              <Show when={!editMode()}>
                {/* View Mode */}
                <div class="border border-crimson/40 p-4 flex flex-col gap-3">
                  <div class="flex flex-col gap-1">
                    <span class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]">
                      Team Name
                    </span>
                    <span class="font-rajdhani text-lg text-white">{myTeam()?.name}</span>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]">
                      Members
                    </span>
                    <span class="font-rajdhani text-white/70">
                      {myTeam()?.member_1_name} & {myTeam()?.member_2_name}
                    </span>
                  </div>
                </div>

                <div class="flex gap-16">
                  <button
                    onClick={() => setEditMode(true)}
                    class="flex-1 py-3 border border-pale-gold/40 font-orbitron text-[0.75rem] text-pale-gold uppercase tracking-[0.15em] hover:border-pale-gold hover:[text-shadow:0_0_8px_rgba(212,175,55,0.5)] transition-all duration-200"
                  >
                    Edit Name
                  </button>
                  <button
                    onClick={handleDisband}
                    disabled={submitting()}
                    class="flex-1 py-3 border border-blood-red/40 font-orbitron text-[0.75rem] text-neon-red uppercase tracking-[0.15em] hover:border-blood-red hover:[text-shadow:0_0_8px_var(--color-neon-red)] transition-all duration-200 disabled:opacity-50"
                  >
                    {submitting() ? 'DISBANDING...' : 'DISBAND'}
                  </button>
                </div>
              </Show>

              <Show when={editMode()}>
                {/* Edit Mode */}
                <form onSubmit={handleUpdate} class="flex flex-col gap-4">
                  <div class="flex flex-col gap-1">
                    <label class="font-orbitron text-[0.65rem] text-crimson uppercase tracking-[0.15em]">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={teamName()}
                      onInput={(e) => setTeamName(e.currentTarget.value)}
                      placeholder="Enter team name"
                      disabled={submitting()}
                      required
                      class="bg-dark-bg/90 border border-crimson/40 py-3 px-3.5 font-rajdhani text-base text-white outline-none transition-all duration-200 placeholder:text-white/30 focus:border-crimson focus:shadow-[0_0_15px_rgba(220,20,60,0.3)] disabled:opacity-50"
                    />
                  </div>

                  <div class="flex gap-16">
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false)
                        setTeamName(myTeam()?.name || '')
                      }}
                      class="flex-1 py-3 border border-white/20 font-orbitron text-[0.75rem] text-white/50 uppercase tracking-[0.15em] hover:border-white/40 hover:text-white/70 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting() || !teamName().trim()}
                      class="flex-1 py-3 border border-pale-gold/40 font-orbitron text-[0.75rem] text-pale-gold uppercase tracking-[0.15em] hover:border-pale-gold hover:[text-shadow:0_0_8px_rgba(212,175,55,0.5)] transition-all duration-200 disabled:opacity-50"
                    >
                      {submitting() ? 'SAVING...' : 'SAVE'}
                    </button>
                  </div>
                </form>
              </Show>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  )
}
