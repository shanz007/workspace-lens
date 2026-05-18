import { supabase } from '../lib/supabase'
import type { QuestionnaireResponses } from '../components/Questionnaire/Questionnaire'

interface UploadResult {
  success: boolean
  path?: string
  error?: string
  queued?: boolean
}

interface GPSCoords {
  lat: number
  lng: number
  accuracy: number
}

interface QueueItem {
  id: string
  participantId: string
  timestamp: string
  dataUrl: string
  responses: QuestionnaireResponses | null
  gps: GPSCoords | null
}

const QUEUE_KEY = 'pending_uploads'

const queueLocally = async (
  blob: Blob,
  participantId: string,
  timestamp: string,
  responses: QuestionnaireResponses | null,
  gps: GPSCoords | null
) => {
  return new Promise<void>(resolve => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onload = () => {
      const existing: QueueItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
      existing.push({
        id: crypto.randomUUID(),
        participantId,
        timestamp,
        dataUrl: reader.result as string,
        responses,
        gps
      })
      localStorage.setItem(QUEUE_KEY, JSON.stringify(existing))
      console.log(`📦 Queued locally — ${existing.length} item(s) pending`)
      resolve()
    }
  })
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

const insertSubmission = async (
  participantId: string,
  photoPath: string,
  timestamp: string,
  responses: QuestionnaireResponses | null,
  gps: GPSCoords | null
) => {
  if (!responses) {
    console.log('ℹ️ No ESM responses — skipping DB insert')
    return
  }

  console.log('📋 Inserting ESM responses to database...')

  const { error } = await supabase
    .from('submissions')
    .insert({
      participant_id: participantId,
      photo_path: photoPath,
      study_id: import.meta.env.VITE_STUDY_ID,
      submitted_at: timestamp,

      // GPS
      gps_lat: gps?.lat ?? null,
      gps_lng: gps?.lng ?? null,
      gps_accuracy: gps?.accuracy ?? null,

      // ESM fields
      location_type: responses.locationType,
      thermal_comfort: responses.thermalComfort,
      surroundings: responses.surroundings,
      natural_light: responses.naturalLight,
      noise_level: responses.noiseLevel,
      activity: responses.activity,
      shelter: responses.shelter,
      affordance_rating: responses.affordanceRating
    })

  if (error) {
    console.error('❌ DB insert failed:', error.message)
  } else {
    console.log('✅ ESM responses saved to database:', photoPath)
  }
}

export function useUpload() {

  const uploadPhoto = async (
    blob: Blob,
    participantId: string,
    responses?: QuestionnaireResponses
  ): Promise<UploadResult> => {

    // fresh timestamp per upload — supports multiple submissions from same participant
    const now = new Date()
    const timestamp = now.toISOString()
    const fileTimestamp = timestamp.replace(/[:.]/g, '-')
    const photoPath = `${participantId}/${fileTimestamp}.jpg`

    // ── GPS + photo upload in parallel ────────────────────────────────────────
    console.log('📷 Uploading photo:', photoPath)
    console.log('📍 Requesting GPS...')

    const [photoResult, gps] = await Promise.all([
      supabase.storage
        .from('workspace-photos')
        .upload(photoPath, blob, { contentType: 'image/jpeg', upsert: false }),
      getGPS()
    ])

    if (gps) {
      console.log(`📍 GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)} (±${gps.accuracy.toFixed(0)}m)`)
    } else {
      console.log('📍 GPS not available')
    }

    // ── handle photo upload failure ───────────────────────────────────────────
    if (photoResult.error) {
      console.error('❌ Photo upload failed:', photoResult.error.message)
      await queueLocally(blob, participantId, fileTimestamp, responses ?? null, gps)
      return { success: false, error: photoResult.error.message, queued: true }
    }

    console.log('✅ Photo uploaded:', photoPath)

    // ── insert ESM responses to PostgreSQL ────────────────────────────────────
    await insertSubmission(participantId, photoPath, timestamp, responses ?? null, gps)

    return { success: true, path: photoPath }
  }

// ── Retry queued offline uploads ───────────────────────────────────────────
  const retryQueue = async () => {
    const queue: QueueItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    if (queue.length === 0) return

    console.log(`🔄 Retrying ${queue.length} queued upload(s)...`)
    const remaining: QueueItem[] = []

    for (const item of queue) {
      try {
        const res = await fetch(item.dataUrl)
        const blob = await res.blob()
        const photoPath = `${item.participantId}/${item.timestamp}.jpg`

        const { error } = await supabase.storage
          .from('workspace-photos')
          .upload(photoPath, blob, { contentType: 'image/jpeg', upsert: false })

        if (error) {
          console.error('🔄 Retry failed:', error.message)
          remaining.push(item)
          continue
        }

        console.log('🔄 Retry succeeded:', photoPath)

        // also insert ESM responses that were queued
        await insertSubmission(
          item.participantId,
          photoPath,
          item.timestamp,
          item.responses,
          item.gps
        )

      } catch (err) {
        console.error('🔄 Retry error:', err)
        remaining.push(item)
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))

    if (remaining.length === 0) {
      console.log('🔄 All queued uploads complete')
    } else {
      console.log(`🔄 ${remaining.length} item(s) still pending`)
    }
  }

  return { uploadPhoto, retryQueue }
}
