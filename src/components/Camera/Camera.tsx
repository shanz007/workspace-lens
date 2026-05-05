import { useState } from 'react'

interface Props {
  participantId: string
  onCapture: (blob: Blob) => void
  onLogout: () => void
}

export default function Camera({ participantId, onCapture, onLogout }: Props) {
  const [showLogout, setShowLogout] = useState(false)

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onCapture(file)
  }

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a2e1a 0%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        height: '56px',
        background: 'rgba(0,0,0,0.2)',
        flexShrink: 0,
        position: 'relative'
      }}>
        <span style={{ fontWeight: 700, fontSize: '17px', color: '#fff' }}>
          🌿 WorkspaceLens
        </span>

        {/* Participant badge — tap to show logout */}
        <button
          onClick={() => setShowLogout(o => !o)}
          style={{
            background: 'rgba(246,201,14,0.2)',
            border: '1px solid rgba(246,201,14,0.4)',
            color: '#f6c90e',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'monospace',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {participantId} ▾
        </button>
      </nav>

      {/* ── LOGOUT DROPDOWN ── */}
      {showLogout && (
        <div style={{
          position: 'fixed',
          top: '56px',
          right: '1.25rem',
          zIndex: 999,
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          minWidth: '200px'
        }}>
          {/* User info */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            background: '#f9f9f9'
          }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#999', letterSpacing: '0.05em' }}>
              LOGGED IN AS
            </p>
            <p style={{
              margin: '2px 0 0',
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '16px',
              color: '#1a2e1a'
            }}>
              {participantId}
            </p>
          </div>

          {/* Logout button */}
          <button
            onClick={() => {
              localStorage.removeItem('participantId')
              onLogout()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#e53e3e',
              fontWeight: 500,
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            Log out
          </button>

          {/* Cancel */}
          <button
            onClick={() => setShowLogout(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              borderTop: '1px solid #eee',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#888',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '16px' }}>✕</span>
            Cancel
          </button>
        </div>
      )}

      {/* Backdrop — tap outside to close dropdown */}
      {showLogout && (
        <div
          onClick={() => setShowLogout(false)}
          style={{
            position: 'fixed', inset: 0,
            zIndex: 998, background: 'transparent'
          }}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem'
      }}>

        <div style={{
          width: '80px', height: '80px',
          background: 'rgba(168,224,99,0.15)',
          border: '2px solid rgba(168,224,99,0.35)',
          borderRadius: '24px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px', marginBottom: '1.25rem'
        }}>
          👁️
        </div>

        <h1 style={{
          color: '#fff', fontSize: '1.4rem',
          fontWeight: 800, margin: '0 0 0.75rem',
          textAlign: 'center', lineHeight: 1.3
        }}>
          Capture Your View
        </h1>

        {/* Key instruction */}
        <div style={{
          background: 'rgba(168,224,99,0.12)',
          border: '1.5px solid rgba(168,224,99,0.3)',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          maxWidth: '340px',
          width: '100%'
        }}>
          <p style={{
            margin: 0, fontSize: '14px',
            color: '#a8e063', lineHeight: 1.7,
            textAlign: 'center'
          }}>
            Point your camera in the <strong>direction you are looking</strong> while
            working — capture your <strong>view and surroundings</strong>, not your desk or laptop.
          </p>
        </div>

        {/* Camera button */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          width: '100%',
          maxWidth: '340px',
          padding: '20px',
          background: '#f6c90e',
          color: '#1a2e1a',
          borderRadius: '16px',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 700,
          boxShadow: '0 6px 24px rgba(246,201,14,0.4)',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          marginBottom: '1.5rem'
        }}>
          📷 Take Photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>

        {/* Checklist 
        <div style={{
          width: '100%', maxWidth: '340px',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            margin: '0 0 10px', fontSize: '11px',
            fontWeight: 700, color: '#7a8a9a',
            letterSpacing: '0.06em'
          }}>
            BEFORE YOU SHOOT
          </p>
          {[
            { icon: '🌿', text: 'You are in an outdoor or semi-outdoor space' },
            { icon: '👁️', text: 'Camera points in your gaze direction' },
            { icon: '🛡️', text: 'You\'ll be able to blur faces after' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px',
              alignItems: 'flex-start',
              marginBottom: i < 2 ? '8px' : 0
            }}>
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '13px', color: '#aab4be', lineHeight: 1.5 }}>
                {item.text}
              </span>
            </div>
          ))}
        </div> */}	

        {/* Info strip */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          {[
            { icon: '🔒', label: 'Secure upload' },
            { icon: '👤', label: 'Anonymous' },
            { icon: '✏️', label: 'Edit before send' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px' }}>{item.icon}</div>
              <div style={{ fontSize: '11px', color: '#5a6a7a', marginTop: '3px' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
