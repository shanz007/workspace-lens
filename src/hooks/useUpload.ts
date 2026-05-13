import { supabase } from '../lib/supabase'
import type { QuestionnaireResponses } from '../components/Questionnaire/Questionnaire'

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

    // ── upload photo ──────────────────────────────────────────────────────────
    console.log('📷 Uploading photo to:', photoPath)
    const { error: photoError } = await supabase.storage
      .from('workspace-photos')
      .upload(photoPath, blob, { contentType: 'image/jpeg', upsert: false })

    if (photoError) {
      console.error('❌ Photo upload failed:', photoError.message)
      await queueLocally(blob, participantId, 'jpg')
      return { success: false, error: photoError.message, queued: true }
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

