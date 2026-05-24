import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'

const ADMIN_PASSWORD  = Deno.env.get('ADMIN_PASSWORD')!
const ADMIN_JWT_SECRET = Deno.env.get('ADMIN_JWT_SECRET')!
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// create crypto key from secret
const getCryptoKey = async () => {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(ADMIN_JWT_SECRET)
  return await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  )
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

Deno.serve(async (req) => {
  // handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.split('/').pop()

  // ── POST /admin-auth/login ────────────────────────────────────────────────
  if (req.method === 'POST' && path === 'login') {
    try {
      const { password } = await req.json()

      if (!password || password !== ADMIN_PASSWORD) {
        return new Response(
          JSON.stringify({ error: 'Invalid password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // issue JWT valid for 8 hours
      const key = await getCryptoKey()
      const token = await create(
        { alg: 'HS256', typ: 'JWT' },
        {
          sub: 'admin',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60)
        },
        key
      )

      console.log('✅ Admin login successful')
      return new Response(
        JSON.stringify({ token }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (err) {
      const error = err as Error
      console.error('Login error:', error.message)
      return new Response(
        JSON.stringify({ error: 'Login failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  // ── GET /admin-auth/data ──────────────────────────────────────────────────
  if (req.method === 'GET' && path === 'data') {
    try {
      // verify JWT from Authorization header
      const authHeader = req.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Missing token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const key = await getCryptoKey()

      try {
        await verify(token, key)
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // token valid — fetch data using service role
      const page = parseInt(url.searchParams.get('page') ?? '0')
      const pageSize = 20
      const locationFilter = url.searchParams.get('location')

      let query = supabase
        .from('submissions')
        .select('*', { count: 'exact' })
        .order('submitted_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (locationFilter && locationFilter !== 'all') {
        query = query.eq('location_type', locationFilter)
      }

      const { data: submissions, error: subError, count } = await query

      if (subError) throw subError

      // fetch analyses for this page only
      const photoPaths = submissions?.map(s => s.photo_path) ?? []
      const { data: analyses } = await supabase
        .from('photo_analysis')
        .select('*')
        .in('photo_path', photoPaths)

      // generate signed URLs for this page only
      const signedUrls: Record<string, string> = {}
      await Promise.all(
        (submissions ?? []).map(async sub => {
          const { data } = await supabase.storage
            .from('workspace-photos')
            .createSignedUrl(sub.photo_path, 3600)
          if (data?.signedUrl) signedUrls[sub.photo_path] = data.signedUrl
        })
      )

      // stats (always full dataset)
      const { data: statsData } = await supabase
        .from('submissions')
        .select('participant_id, location_type')

      const { count: analysisCount } = await supabase
        .from('photo_analysis')
        .select('*', { count: 'exact', head: true })

      const stats = {
        total: count ?? 0,
        participants: new Set(statsData?.map(s => s.participant_id)).size,
        analysed: analysisCount ?? 0,
        outdoor: statsData?.filter(s => s.location_type === 'outdoor').length ?? 0,
      }

      console.log(`✅ Admin data fetched — page ${page}, ${submissions?.length} submissions`)

      return new Response(
        JSON.stringify({ submissions, analyses, signedUrls, stats, page, pageSize, total: count }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (err) {
      const error = err as Error
      console.error('Data fetch error:', error.message)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  return new Response('Not found', { status: 404, headers: corsHeaders })
})
