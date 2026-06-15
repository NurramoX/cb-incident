import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = performance.now()

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    if (typeof body !== 'object' || body === null) {
      return jsonResponse({ error: 'Request body must be an object' }, 400)
    }

    const { name, surname, email, password, registrationToken } = body as Record<string, unknown>

    // Type validation
    if (
      typeof name !== 'string' ||
      typeof surname !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof registrationToken !== 'string'
    ) {
      return jsonResponse({ error: 'All fields must be strings' }, 400)
    }

    // Input validation
    if (!name.trim() || !surname.trim()) {
      return jsonResponse({ error: 'Name and surname are required' }, 400)
    }

    if (name.length > 100 || surname.length > 100) {
      return jsonResponse({ error: 'Name too long' }, 400)
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    if (!emailRegex.test(email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400)
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400)
    }

    log('info', 'Registration attempt', { requestId, email })

    // Step 1: Claim token
    const { data: claimResult, error: claimError } = await supabaseAdmin.rpc(
      'claim_registration_token',
      { p_registration_token: registrationToken }
    )

    if (claimError) {
      log('error', 'Token claim RPC failed', { requestId, error: claimError.message })
      return jsonResponse({ error: 'Registration service unavailable' }, 503)
    }

    if (!claimResult.success) {
      log('warn', 'Invalid token', { requestId })
      return jsonResponse({ error: 'Invalid or expired registration token' }, 403)
    }

    const tokenId = claimResult.token_id

    // Step 2: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
    })

    if (authError) {
      log('error', 'Auth user creation failed', { requestId, error: authError.message })
      
      // Rollback token
      await supabaseAdmin.rpc('restore_registration_token', { p_token_id: tokenId })

      if (authError.message.includes('already been registered')) {
        return jsonResponse({ error: 'Email already registered' }, 409)
      }
      return jsonResponse({ error: 'Failed to create user' }, 400)
    }

    const userId = authData.user.id

    // Step 3: Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name: name.trim(),
        surname: surname.trim(),
      })

    if (profileError) {
      log('error', 'Profile creation failed', { requestId, error: profileError.message })

      // Rollback: delete user and restore token
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.rpc('restore_registration_token', { p_token_id: tokenId })

      return jsonResponse({ error: 'Failed to create profile' }, 500)
    }

    const duration = Math.round(performance.now() - startTime)
    log('info', 'Registration successful', { requestId, userId, duration })

    return jsonResponse({
      message: 'Registration successful',
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        surname: surname.trim(),
      },
    }, 200)

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
