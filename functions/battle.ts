import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  }))
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },

  })
}

function getUserSide(uid: string, battle: Record<string, unknown>): 1 | 2 | null {
  if (uid === battle.tid_1_member_1 || uid === battle.tid_1_member_2) return 1
  if (uid === battle.tid_2_member_1 || uid === battle.tid_2_member_2) return 2
  return null
}

function shapeBattle(uid: string, raw: Record<string, unknown>) {
  const side = getUserSide(uid, raw)
  const [my, opp] = side === 1 ? ['1', '2'] : ['2', '1']

  return {
    id: raw.id,
    battle: raw.battle,
    my_team: {
      name: raw[`team_${my}`],
      state: raw[`tid_${my}_state`],
      result_locked: raw[`tid_${my}_result_locked`],
      members: [
        { id: raw[`tid_${my}_member_1`], name: raw[`tid_${my}_member_1_name`] },
        { id: raw[`tid_${my}_member_2`], name: raw[`tid_${my}_member_2_name`] },
      ],
    },
    opponent: {
      name: raw[`team_${opp}`],
      state: raw[`tid_${opp}_state`],
      result_locked: raw[`tid_${opp}_result_locked`],
      members: [
        { id: raw[`tid_${opp}_member_1`], name: raw[`tid_${opp}_member_1_name`] },
        { id: raw[`tid_${opp}_member_2`], name: raw[`tid_${opp}_member_2_name`] },
      ],
    },
  }
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = performance.now()

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401)
    }


    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      log('warn', 'Auth failed', { requestId, error: userError?.message })
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }


    const uid = user.id
    const url = new URL(req.url)
    const view = url.searchParams.get('view')

    // === GET ===
    if (req.method === 'GET') {

      // --- LEADERBOARD ---
      if (view === 'leaderboard') {
        log('info', 'Fetching leaderboard', { requestId, userId: uid })

        const { data, error } = await supabaseAdmin.rpc('get_leaderboard')

        if (error) {
          log('error', 'Failed to fetch leaderboard', { requestId, error: error.message })
          return jsonResponse({ error: 'Failed to fetch leaderboard' }, 500)
        }

        const duration = Math.round(performance.now() - startTime)
        log('info', 'Leaderboard fetched', { requestId, userId: uid, duration })

        return jsonResponse({ leaderboard: data }, 200)
      }

      // --- BATTLES ---
      log('info', 'Fetching battles', { requestId, userId: uid })

      const { data, error } = await supabaseAdmin.rpc('get_user_battles', { uid })

      if (error) {
        log('error', 'Failed to fetch battles', { requestId, error: error.message })
        return jsonResponse({ error: 'Failed to fetch battles' }, 500)
      }

      const battles = data.map((raw: Record<string, unknown>) => shapeBattle(uid, raw))

      const duration = Math.round(performance.now() - startTime)
      log('info', 'Battles fetched', { requestId, userId: uid, count: battles.length, duration })

      return jsonResponse({ battles }, 200)
    }

    // === PUT: set_result or lock_result ===
    if (req.method === 'PUT') {
      let body: Record<string, unknown>
      try {
        body = await req.json()
      } catch {
        return jsonResponse({ error: 'Invalid JSON body' }, 400)
      }

      const action = body.action as string
      const battle_id = body.battle_id as string

      if (!battle_id || typeof battle_id !== 'string') {
        return jsonResponse({ error: 'battle_id is required' }, 400)
      }

      // Fetch battle
      const { data: battle, error: fetchError } = await supabaseAdmin
        .from('teambattle')
        .select('*')
        .eq('id', battle_id)
        .single()

      if (fetchError || !battle) {
        return jsonResponse({ error: 'Battle not found' }, 404)
      }

      const side = getUserSide(uid, battle)
      if (!side) {
        return jsonResponse({ error: 'You are not a participant in this battle' }, 403)
      }

      const stateField = side === 1 ? 'tid_1_state' : 'tid_2_state'
      const lockedField = side === 1 ? 'tid_1_result_locked' : 'tid_2_result_locked'

      // --- SET RESULT ---
      if (action === 'set_result') {
        const result = body.result as string

        if (result !== 'won' && result !== 'lost') {
          return jsonResponse({ error: 'result must be "won" or "lost"' }, 400)
        }

        if (battle[lockedField]) {
          return jsonResponse({ error: 'Result is already locked and cannot be changed' }, 409)
        }

        log('info', 'Setting result', { requestId, userId: uid, battle_id, side, result })

        const { error: updateError } = await supabaseAdmin
          .from('teambattle')
          .update({ [stateField]: result })
          .eq('id', battle_id)

        if (updateError) {
          log('error', 'Failed to set result', { requestId, error: updateError.message })
          return jsonResponse({ error: 'Failed to set result' }, 500)
        }

        const duration = Math.round(performance.now() - startTime)
        log('info', 'Result set', { requestId, userId: uid, battle_id, side, result, duration })

        return jsonResponse({ message: 'Result updated' }, 200)
      }

      // --- LOCK RESULT ---
      if (action === 'lock_result') {
        if (battle[stateField] === 'pending') {
          return jsonResponse({ error: 'Set a result before locking' }, 400)
        }

        if (battle[lockedField]) {
          return jsonResponse({ error: 'Already locked' }, 409)
        }

        log('info', 'Locking result', { requestId, userId: uid, battle_id, side })

        const { error: updateError } = await supabaseAdmin
          .from('teambattle')
          .update({ [lockedField]: true })
          .eq('id', battle_id)

        if (updateError) {
          log('error', 'Failed to lock result', { requestId, error: updateError.message })
          return jsonResponse({ error: 'Failed to lock result' }, 500)
        }

        const duration = Math.round(performance.now() - startTime)
        log('info', 'Result locked', { requestId, userId: uid, battle_id, side, duration })

        return jsonResponse({ message: 'Result locked' }, 200)
      }

      return jsonResponse({ error: 'Unknown action. Use: set_result, lock_result' }, 400)
    }

    return jsonResponse({ error: 'Method not allowed. Use GET or PUT' }, 405)

  } catch (error) {
    const duration = Math.round(performance.now() - startTime)
    log('error', 'Unexpected error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    })

    return jsonResponse({ error: 'Internal server error' }, 500)

  }
})
