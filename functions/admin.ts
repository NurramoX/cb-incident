import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

async function authenticateAdmin(req: Request, requestId: string) {
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

  const { data: { user: fullUser }, error: adminError } = await supabaseAdmin.auth.admin.getUserById(user.id)
  if (adminError || !fullUser || fullUser.app_metadata?.role !== 'admin') {
    log('warn', 'Non-admin access attempt', { requestId, userId: user.id })
    return null
  }

  return fullUser

}

// --- Action Handlers ---

async function handleSetPassword(userId: string, password: string, requestId: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password })

  if (error) {
    log('error', 'Failed to set password', { requestId, error: error.message })
    return jsonResponse({ error: 'Failed to set password' }, 500)
  }


  return jsonResponse({ message: 'Password updated' }, 200)
}

async function handleListEmails(requestId: string) {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    log('error', 'Failed to list users', { requestId, error: error.message })
    return jsonResponse({ error: 'Failed to list users' }, 500)
  }

  const emails: Record<string, string> = {}
  for (const u of users) {
    if (u.email) emails[u.id] = u.email
  }

  return jsonResponse({ emails }, 200)
}

async function handleDeleteUser(userId: string, requestId: string) {
  const { error: teamError } = await supabaseAdmin
    .from('team')
    .delete()
    .or(`member_1.eq.${userId},member_2.eq.${userId}`)

  if (teamError) {
    log('error', 'Failed to remove user from team', { requestId, error: teamError.message })
    return jsonResponse({ error: 'Failed to clean up team data' }, 500)
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (authError) {
    log('error', 'Failed to delete user', { requestId, error: authError.message })
    return jsonResponse({ error: 'Failed to delete user' }, 500)
  }

  return jsonResponse({ message: 'User deleted' }, 200)
}

async function handleDeleteTeam(member1: string, member2: string, requestId: string) {
  const { data, error } = await supabaseAdmin
    .from('team')
    .delete()
    .eq('member_1', member1)
    .eq('member_2', member2)
    .select()

  if (error || !data?.length) {
    log('error', 'Failed to delete team', { requestId, error: error?.message })
    return jsonResponse({ error: 'Team not found' }, 404)
  }

  return jsonResponse({ message: 'Team deleted' }, 200)
}

// --- Main Server ---

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = performance.now()

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const admin = await authenticateAdmin(req, requestId)
    if (!admin) return jsonResponse({ error: 'Forbidden' }, 403)

    const body = await req.json().catch(() => null)
    if (!body?.action) return jsonResponse({ error: 'Missing action' }, 400)

    let response: Response

    switch (body.action) {
      case 'set-password':
        if (!body.userId || !body.password) return jsonResponse({ error: 'Missing userId or password' }, 400)
        response = await handleSetPassword(body.userId, body.password, requestId)
        break
      case 'list-emails':
        response = await handleListEmails(requestId)
        break
      case 'delete-user':
        if (!body.userId) return jsonResponse({ error: 'Missing userId' }, 400)
        response = await handleDeleteUser(body.userId, requestId)
        break
      case 'delete-team':
        if (!body.member1 || !body.member2) return jsonResponse({ error: 'Missing member IDs' }, 400)
        response = await handleDeleteTeam(body.member1, body.member2, requestId)
        break
      default:
        response = jsonResponse({ error: 'Unknown action' }, 400)
    }

    log('info', `admin/${body.action} processed`, { requestId, adminId: admin.id, duration: Math.round(performance.now() - startTime) })
    return response

  } catch (error) {
    log('error', 'Server Error', { requestId, error: error.message })
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
