import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// --- Utilities ---

function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...meta }))
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function authenticateUser(req: Request, requestId: string) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user) {
    log('warn', 'Unauthorized access attempt', { requestId })
    return null
  }
  return user
}

// --- Route Handlers ---

/**
 * GET: Fetch all teams with member names
 * Joins profiles table twice (once for each member)
 */
async function handleListTeams(requestId: string) {
  const { data, error } = await supabaseAdmin
    .from('team')
    .select(`
      name,
      created_at,
      member_1_info:profiles!member_1(name, surname),
      member_2_info:profiles!member_2(name, surname)
    `)

  if (error) {
    log('error', 'Fetch teams failed', { requestId, error: error.message })
    return jsonResponse({ error: 'Failed to fetch teams' }, 500)
  }

  // Optional: Flatten the response so the frontend gets "member_1_name" directly
  const formattedTeams = data.map(team => ({
    team_name: team.name,
    created_at: team.created_at,
    member_1: `${team.member_1_info?.name} ${team.member_1_info?.surname}`,
    member_2: `${team.member_2_info?.name} ${team.member_2_info?.surname}`
  }))

  return jsonResponse(formattedTeams, 200)
}

async function handleCreateTeam(req: Request, userId: string, requestId: string) {
  const body = await req.json().catch(() => null)
  const { name, other_member_id } = body ?? {}

  if (!name?.trim() || !other_member_id) return jsonResponse({ error: 'Missing fields' }, 400)
  if (userId === other_member_id) return jsonResponse({ error: 'Self-teaming not allowed' }, 400)

  const [m1, m2] = [userId, other_member_id].sort()

  const { data, error } = await supabaseAdmin
    .from('team')
    .insert({ name: name.trim(), member_1: m1, member_2: m2 })
    .select().single()

  if (error) return jsonResponse({ error: error.code === '23505' ? 'Team exists or name taken' : error.message }, 409)
  return jsonResponse(data, 201)
}

async function handleUpdateTeam(req: Request, userId: string, requestId: string) {
  const body = await req.json().catch(() => null)
  const { name } = body ?? {}

  if (!name?.trim()) return jsonResponse({ error: 'Name is required' }, 400)

  const { data, error } = await supabaseAdmin
    .from('team')
    .update({ name: name.trim() })
    .or(`member_1.eq.${userId},member_2.eq.${userId}`)
    .select().single()

  if (error) return jsonResponse({ error: 'Update failed' }, 404)
  return jsonResponse(data, 200)
}

async function handleDeleteTeam(userId: string, requestId: string) {
  const { data, error } = await supabaseAdmin
    .from('team')
    .delete()
    .or(`member_1.eq.${userId},member_2.eq.${userId}`)
    .select()

  if (error || !data?.length) return jsonResponse({ error: 'No team found' }, 404)
  return jsonResponse({ message: 'Team disbanded' }, 200)
}

// --- Main Server ---

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = performance.now()

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const user = await authenticateUser(req, requestId)
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)

    let response: Response
    switch (req.method) {
      case 'GET':    response = await handleListTeams(requestId); break
      case 'POST':   response = await handleCreateTeam(req, user.id, requestId); break
      case 'PUT':    response = await handleUpdateTeam(req, user.id, requestId); break
      case 'DELETE': response = await handleDeleteTeam(user.id, requestId); break
      default:       response = jsonResponse({ error: 'Method not allowed' }, 405)
    }

    log('info', `${req.method} processed`, { requestId, duration: Math.round(performance.now() - startTime) })
    return response

  } catch (error) {
    log('error', 'Server Error', { requestId, error: error.message })
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
