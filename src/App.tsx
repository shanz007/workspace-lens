import { useState, useEffect } from 'react'
import HomePage from './components/Home/HomePage'
import Login from './components/Login/Login'
import Camera from './components/Camera/Camera'
import PrivacyEditor from './components/PrivacyEditor/PrivacyEditor'
import { useUpload } from './hooks/useUpload'

type Screen = 'home' | 'login' | 'camera' | 'editor' | 'uploading' | 'done' | 'error'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [participantId, setParticipantId] = useState('')
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const { uploadPhoto } = useUpload()
  const [, setLogs] = useState<string[]>([])

  
  useEffect(() => {
    const saved = localStorage.getItem('participantId')
    if (saved) {
      setParticipantId(saved)
      setScreen('camera')  // returning participant — skip home and login
    }
    // new participant starts at home
  }, [])

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 20))
    console.log(msg)
  }
  const handleLogin = (id: string) => {
    setParticipantId(id)
    setScreen('camera')
    log(`Logged in as ${id}`)
  }

  const handleCapture = (blob: Blob) => {
    setCapturedBlob(blob)
    setScreen('editor')
    log(`Photo captured — ${(blob.size / 1024).toFixed(0)} KB`)
  }

  const handleConfirm = async (censored: Blob) => {
    setScreen('uploading')
    log(`Uploading ${(censored.size / 1024).toFixed(0)} KB...`)
    setStatusMsg('Uploading...')
    const result = await uploadPhoto(censored, participantId)
    if (result.success) {
      log(`✓ Uploaded to: ${result.path}`)
      setStatusMsg('✓ Photo uploaded successfully!')
      setScreen('done')
    } else {
      log(`✗ Upload failed: ${result.error}`)
      setStatusMsg(`Upload failed: ${result.error}`)
      setScreen('error')
    }
  }

  const handleRetake = () => {
    setCapturedBlob(null)
    setScreen('camera')
  }

  if (screen === 'home') return (
    <><HomePage onGetStarted={() => setScreen('login')} />
    </>
  )  

  if (screen === 'login') return (
    <><Login onLogin={handleLogin} onBack={() => setScreen('home')} />
    </>
  )
 
  if (screen === 'camera') return (
  <>
    <Camera
      participantId={participantId}
      onCapture={handleCapture}
      onLogout={() => setScreen('home')}
    />
  </> 
  )

  if (screen === 'editor' && capturedBlob) return (
  <>
    <PrivacyEditor
      imageBlob={capturedBlob}
      participantId={participantId}
      onConfirm={handleConfirm}
      onRetake={handleRetake}
      onLogout={() => {
        localStorage.removeItem('participantId')
        setScreen('home')
      }}
    />
  </> 
  )

  if (screen === 'uploading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ fontSize: '16px', color: '#666' }}>{statusMsg}</p>
      </div>
    )
  }

  if (screen === 'done') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>Photo submitted!</h2>
        <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>
          Thank you. Your workspace photo has been uploaded successfully.
        </p>
        <button
          onClick={() => setScreen('camera')}
          style={{
            padding: '13px 32px',
            background: '#1a1a2e',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          Take another photo
        </button>
        <button
          onClick={() => { localStorage.removeItem('participantId'); setScreen('home') }}
          style={{
            marginTop: '12px',
            padding: '10px 24px',
            background: 'transparent',
            color: '#999',
            border: '1.5px solid #ddd',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Log out
        </button>
      </div>
    )
  }

  if (screen === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ color: '#e53e3e', marginBottom: '0.5rem' }}>Upload failed</h2>
        <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>{statusMsg}</p>
        <button
          onClick={() => capturedBlob && handleConfirm(capturedBlob)}
          style={{ padding: '13px 32px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', marginBottom: '12px' }}
        >
          Retry upload
        </button>
        <button
          onClick={handleRetake}
          style={{ padding: '10px 24px', background: 'transparent', color: '#999', border: '1.5px solid #ddd', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}
        >
          Retake photo
        </button>
      </div>
    )
  }
  
  return null
}
