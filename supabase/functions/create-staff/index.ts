import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Verify caller is super_admin
    const authHeader = req.headers.get('Authorization')!
    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Not authenticated')

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    
    // Check caller is super_admin
    const { data: callerRole } = await adminClient.from('user_roles').select('role').eq('user_id', caller.id).single()
    if (callerRole?.role !== 'super_admin') throw new Error('Only super admin can create staff')

    const { email, password, full_name, phone, role } = await req.json()
    if (!email || !password || !full_name) throw new Error('Missing required fields')
    if (!['admin', 'sub_admin'].includes(role)) throw new Error('Invalid role')

    // Create user with admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone: phone || '' },
    })
    if (createError) throw createError

    // Update role from default 'client' to specified role
    const { error: roleError } = await adminClient.from('user_roles')
      .update({ role })
      .eq('user_id', newUser.user.id)
    if (roleError) throw roleError

    return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
