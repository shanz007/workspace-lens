import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const POKW2_PROMPT = `
Analyse this outdoor workplace photograph for the pOKW2 research model.
Return ONLY a JSON object with these exact fields, no other text:

{
  "nature_score": 0.0-1.0,
  "built_environment_score": 0.0-1.0,
  "sky_visibility": 0.0-1.0,
  "natural_light_score": 0.0-1.0,
  "shadow_presence": 0.0-1.0,
  "shelter_detected": true/false,
  "people_count": integer,
  "greenness_index": 0.0-1.0,
  "labels": ["list", "of", "detected", "elements"],
  "environment_type": "outdoor|semi-outdoor|indoor",
  "summary": "one sentence description of the environment"
}

Scoring guide:
- nature_score: proportion of natural elements (trees, grass, water, sky)
- built_environment_score: proportion of built elements (buildings, walls, furniture, pavement)
- sky_visibility: how much open sky is visible
- natural_light_score: quality and quantity of natural light reaching the scene
- shadow_presence: presence of shadows indicating direct sunlight
- shelter_detected: is there any overhead structure (roof, canopy, umbrella, trees)
- people_count: number of visible people
- greenness_index: proportion of green vegetation pixels
`

// ── Free vision models to try in order ───────────────────────────────────────
const FREE_VISION_MODELS = [
  'meta-llama/llama-3.2-11b-vision-instruct:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-3-12b-it:free',
  'openrouter/free',
]

Deno.serve(async (req) => {
  try {
    const payload = await req.json()

    // handle both webhook payload formats
    const record = payload.record ?? payload
    const photoPath: string = record?.name ?? record?.object_name ?? ''
    const bucketId: string = record?.bucket_id ?? record?.bucket ?? ''

    console.log('📥 Webhook received:', { photoPath, bucketId })

    // guard 1 — wrong bucket
    if (bucketId !== 'workspace-photos') {
      console.log('⏭️ Wrong bucket, skipping:', bucketId)
      return new Response('Wrong bucket', { status: 200 })
    }

    // guard 2 — not a jpg (prevents recursive triggers)
    if (!photoPath.endsWith('.jpg')) {
      console.log('⏭️ Not a jpg, skipping:', photoPath)
      return new Response('Not a photo', { status: 200 })
    }

    // guard 3 — already analysed
    const { data: existing } = await supabase
      .from('photo_analysis')
      .select('id')
      .eq('photo_path', photoPath)
      .maybeSingle()

    if (existing) {
      console.log('⏭️ Already analysed, skipping:', photoPath)
      return new Response('Already analysed', { status: 200 })
    }

    console.log('🔍 Analysing photo:', photoPath)

    // parse participantId and timestamp from path
    const parts = photoPath.split('/')
    const participantId = parts[0]
    const filename = parts[1]
    const timestamp = filename
      .replace('.jpg', '')
      .replace(/(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3}Z)/, '$1:$2:$3.$4')

    // ── get signed URL instead of base64 ─────────────────────────────────────
    // signed URLs work reliably with all vision models — no size limits
    const { data: signedData, error: signedError } = await supabase.storage
      .from('workspace-photos')
      .createSignedUrl(photoPath, 120) // valid for 2 minutes

    if (signedError || !signedData?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signedError?.message}`)
    }

    const imageUrl = signedData.signedUrl
    console.log('📎 Signed URL created for:', photoPath)

    // ── call OpenRouter with model fallback loop ───────────────────────────────
    let openRouterData: Record<string, unknown> | null = null
    let modelUsed = ''

    for (const model of FREE_VISION_MODELS) {
      console.log(`🤖 Trying model: ${model}`)

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://incredible-sopapillas-4059fb.netlify.app',
          'X-Title': 'WorkspaceLens pOKW2 Analysis'
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              {
                type: 'text',
                text: POKW2_PROMPT
              }
            ]
          }],
          max_tokens: 500
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        console.log(`⚠️ ${model} failed (${res.status}): ${errText}`)
        continue
      }

      const data = await res.json() as Record<string, unknown>
      console.log(`🤖 Response from ${model}:`, JSON.stringify(data))

      const choices = data.choices as Array<{message: {content: string}, finish_reason: string}> | undefined

      if (!choices || choices.length === 0) {
        console.log(`⚠️ ${model} returned no choices`)
        continue
      }

      const content = choices[0].message.content
      if (!content) {
        console.log(`⚠️ ${model} returned null content — finish_reason: ${choices[0].finish_reason}`)
        continue
      }

      // success
      openRouterData = data
      modelUsed = (data.model as string) ?? model
      console.log(`✅ Got response from: ${modelUsed}`)
      break
    }

    if (!openRouterData) {
      throw new Error('All vision models failed or returned empty responses')
    }

    const choices = openRouterData.choices as Array<{message: {content: string}}>
    const rawResponse = choices[0].message.content
    console.log('🤖 Raw response:', rawResponse)

    // ── parse JSON from response ───────────────────────────────────────────────
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`No JSON found in vision response: ${rawResponse}`)

    let scores: Record<string, unknown>
    try {
      scores = JSON.parse(jsonMatch[0])
    } catch {
      throw new Error(`Failed to parse JSON from vision response: ${jsonMatch[0]}`)
    }

    console.log('📊 Parsed scores:', JSON.stringify(scores))

    // ── store results in PostgreSQL ────────────────────────────────────────────
    const { error: insertError } = await supabase
      .from('photo_analysis')
      .insert({
        participant_id: participantId,
        photo_path: photoPath,
        submitted_at: timestamp,
        nature_score: scores.nature_score,
        built_environment_score: scores.built_environment_score,
        sky_visibility: scores.sky_visibility,
        natural_light_score: scores.natural_light_score,
        shadow_presence: scores.shadow_presence,
        shelter_detected: scores.shelter_detected,
        people_count: scores.people_count,
        greenness_index: scores.greenness_index,
        vision_labels: scores.labels,
        vision_raw_response: rawResponse,
        model_used: modelUsed
      })

    if (insertError) throw new Error(`DB insert failed: ${insertError.message}`)

    console.log('✅ Analysis stored for:', photoPath)
    return new Response(
      JSON.stringify({ success: true, path: photoPath, model: modelUsed }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const error = err as Error
    console.error('❌ Edge Function error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
