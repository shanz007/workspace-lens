import { supabase } from '../lib/supabase'

interface UploadResult {
  success: boolean
  path?: string
  error?: string
}

export function useUpload() {
  const uploadPhoto = async (
    blob: Blob,
    participantId: string
  ): Promise<UploadResult> => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const path = `${participantId}/${timestamp}.jpg`

    const { error } = await supabase.storage
      .from('workspace-photos')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (error) return { success: false, error: error.message }
    return { success: true, path }
  }

  const uploadResponse = async (
    responses: Record<string, unknown>,
    participantId: string
  ): Promise<UploadResult> => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const path = `${participantId}/${timestamp}.json`

    const payload = JSON.stringify({
      participantId,
      studyId: import.meta.env.VITE_STUDY_ID,
      timestamp: new Date().toISOString(),
      responses
    }, null, 2)

    const blob = new Blob([payload], { type: 'application/json' })

    const { error } = await supabase.storage
      .from('workspace-photos')
      .upload(path, blob, {
        contentType: 'application/json',
        upsert: false
      })

    if (error) return { success: false, error: error.message }
    return { success: true, path }
  }

  return { uploadPhoto, uploadResponse }
}
