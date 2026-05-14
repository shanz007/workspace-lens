import { supabase } from '../lib/supabase'
import type { QuestionnaireResponses } from '../components/Questionnaire/Questionnaire'

interface GPSCoords {
  lat: number
  lng: number
  accuracy: number
}

const getGPS = (): Promise<GPSCoords | null> =>
  new Promise(resolve => {
    if (!navigator.geolocation) {
      console.log('ℹ️ Geolocation not supported')
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      err => {
        console.log('ℹ️ GPS declined or unavailable:', err.message)
        resolve(null)  // graceful — never blocks upload
      },
      { timeout: 8000, maximumAge: 60000 }
    )
})

interface UploadResult {
  success: boolean
  path?: string
  error?: string
  queued?: boolean
}

interface QueueItem {
  id: string
  participantId: string
  timestamp: string
  dataUrl: string
  type: 'jpg' | 'json'
}

const QUEUE_KEY = 'pending_uploads'

const queueLocally = async (blob: Blob, participantId: string, type: 'jpg' | 'json') => {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  reader.onload = () => {
    const existing: QueueItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    existing.push({
      id: crypto.randomUUID(),
      participantId,
      timestamp: new Date().toISOString(),
      dataUrl: reader.result as string,
      type
    })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(existing))
    console.log(`📦 Queued ${type} locally for retry`)
  }
}

export function useUpload() {

  const uploadPhoto = async (
  blob: Blob,
  participantId: string,
  responses?: QuestionnaireResponses
): Promise<UploadResult> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const photoPath = `${participantId}/${timestamp}.jpg`
  const jsonPath  = `${participantId}/${timestamp}.json`

  // ── capture GPS + upload photo in parallel ────────────────────────────────
  console.log('📷 Uploading photo to:', photoPath)
  console.log('📍 Requesting GPS...')

  const [photoResult, gps] = await Promise.all([
    supabase.storage
      .from('workspace-photos')
      .upload(photoPath, blob, { contentType: 'image/jpeg', upsert: false }),
    getGPS()
  ])

  if (gps) {
    console.log(`📍 GPS acquired: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)} (±${gps.accuracy.toFixed(0)}m)`)
  } else {
    console.log('📍 GPS not available — continuing without')
  }

  if (photoResult.error) {
    console.error('❌ Photo upload failed:', photoResult.error.message)
    await queueLocally(blob, participantId, 'jpg')
    return { success: false, error: photoResult.error.message, queued: true }
  }

  console.log('✅ Photo uploaded:', photoPath)

  // ── upload JSON ───────────────────────────────────────────────────────────
  if (responses) {
    console.log('📋 Uploading ESM responses to:', jsonPath)
    console.log('📋 Payload:', JSON.stringify(responses, null, 2))

    const payload = JSON.stringify({
      participantId,
      studyId: import.meta.env.VITE_STUDY_ID,
      timestamp: new Date().toISOString(),
      gps: gps ?? null,
      responses
    }, null, 2)

    const jsonBlob = new Blob([payload], { type: 'application/json' })

    const { error: jsonError } = await supabase.storage
      .from('workspace-photos')
      .upload(jsonPath, jsonBlob, { contentType: 'application/json', upsert: false })

    if (jsonError) {
      console.error('❌ JSON upload failed:', jsonError.message)
    } else {
      console.log('✅ JSON uploaded:', jsonPath)
    }
  } else {
    console.log('ℹ️ No ESM responses — skipping JSON upload')
  }

  return { success: true, path: photoPath }
}

  const retryQueue = async () => {
    const queue: QueueItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    if (queue.length === 0) return
    console.log(`🔄 Retrying ${queue.length} queued uploads...`)
    const remaining: QueueItem[] = []
    for (const item of queue) {
      const res = await fetch(item.dataUrl)
      const blob = await res.blob()
      const path = `${item.participantId}/${item.timestamp.replace(/[:.]/g, '-')}.${item.type}`
      const { error } = await supabase.storage
        .from('workspace-photos')
        .upload(path, blob, { upsert: false })
      if (error) {
        console.error('🔄 Retry failed:', error.message)
        remaining.push(item)
      } else {
        console.log('🔄 Retry succeeded:', path)
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  }

  return { uploadPhoto, retryQueue }
}

