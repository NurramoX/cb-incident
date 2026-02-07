import { createSignal, onMount, createMemo, Show } from 'solid-js'
import { useNavigate, A } from '@solidjs/router'
import {
  fetchProfiles,
  fetchTeams,
  createTeam,
  updateTeam,
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


  const formatName = (name: string, surname: string) => `${name} ${surname.charAt(0)}.`

  return (
    <div class="relative w-full min-h-screen flex flex-col items-center p-4 pt-8">
      <div class="relative z-10 w-full max-w-3xl flex flex-col items-center gap-6">
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
                class="glow-btn mt-4 h-11 px-8 rounded-full flex items-center justify-center font-orbitron text-[0.8rem] text-white uppercase tracking-[0.2em] self-center"
              >
                {submitting() ? 'CREATING...' : 'CREATE TEAM'}
              </button>
            </form>
          </Show>


<Show when={myTeam()}>
  <div class="w-full animate-in fade-in duration-500">
    
    <Show when={!editMode()}>
      {/* --- VIEW MODE: CRIMSON PULSE --- */}
      <div class="animate-pulse-crimson border bg-dark-bg/80 backdrop-blur-md overflow-hidden">
        
        {/* Header */}
        <div class="p-5 border-b border-crimson/20">
          <label class="font-orbitron text-[0.6rem] text-crimson uppercase tracking-[0.2em] block mb-1">
            My Team
          </label>
          <h2 class="font-orbitron text-[1.3rem] text-white uppercase tracking-[0.1em] [text-shadow:0_0_10px_rgba(255,255,255,0.2)]">
            {myTeam()?.name}
          </h2>
        </div>

        {/* Members (Horizontal Rows) */}
        <div class="flex flex-col">
          <div class="px-5 py-3.5 flex items-center justify-between border-b border-crimson/10 bg-white/[0.02]">
            <span class="font-orbitron text-[0.55rem] text-white/40 uppercase tracking-[0.15em]">Member 01</span>
            <span class="font-rajdhani text-[1.1rem] text-white font-medium">
              {myTeam()?.member_1 === userId ? myTeam()?.member_1_name : myTeam()?.member_2_name}
            </span>
          </div>
          <div class="px-5 py-3.5 flex items-center justify-between bg-white/[0.02]">
            <span class="font-orbitron text-[0.55rem] text-white/40 uppercase tracking-[0.15em]">Member 02</span>
            <span class="font-rajdhani text-[1.1rem] text-white font-medium">
              {myTeam()?.member_1 === userId ? myTeam()?.member_2_name : myTeam()?.member_1_name}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div class="flex h-12 border-t border-crimson/20">
          <button
            onClick={() => setEditMode(true)}
            class="flex-1 font-orbitron text-[0.7rem] text-pale-gold uppercase tracking-[0.2em] hover:bg-pale-gold/10 hover:[text-shadow:0_0_8px_rgba(212,175,55,0.5)] transition-all duration-200"
          >
            Modify
          </button>
        </div>
      </div>
    </Show>

    <Show when={editMode()}>
      {/* --- EDIT MODE: GOLD PULSE --- */}
      <div class="animate-pulse-gold border bg-dark-bg/80 backdrop-blur-md p-5">
        <label class="font-orbitron text-[0.6rem] text-pale-gold uppercase tracking-[0.2em] block mb-3">
          Modify Team Name
        </label>

        <input
          type="text"
          value={teamName()}
          onInput={(e) => setTeamName(e.currentTarget.value)}
          class="w-full bg-black/40 border border-pale-gold/20 py-3 px-4 font-rajdhani text-lg text-white outline-none focus:border-pale-gold/60 transition-all"
        />

        <div class="flex h-12 border-t border-pale-gold/20 mt-6 -mx-5 -mb-5">
          <button
            onClick={() => {
              setEditMode(false)
              setTeamName(myTeam()?.name || '')
            }}
            class="flex-1 font-orbitron text-[0.7rem] text-white/40 uppercase tracking-[0.2em] hover:text-white transition-all border-r border-pale-gold/20"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={submitting() || !teamName().trim()}
            class="flex-1 font-orbitron text-[0.7rem] text-pale-gold uppercase tracking-[0.2em] hover:bg-pale-gold/10 transition-all disabled:opacity-50"
          >
            {submitting() ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Show>

  </div>
</Show>




        </Show>
      </div>
    </div>
  )
}
