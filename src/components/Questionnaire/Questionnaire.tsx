import { useState } from 'react'

interface Props {
  onComplete: (responses: QuestionnaireResponses) => void
}

export interface QuestionnaireResponses {
  locationType: 'outdoor' | 'semi-outdoor' | 'indoor' | 'other'
  thermalComfort: 1 | 2 | 3 | 4 | 5
  surroundings: string[]
  naturalLight: 1 | 2 | 3 | 4 | 5
  noiseLevel: 'quiet' | 'moderate' | 'loud'
  activity: 'deep-focus' | 'meeting' | 'admin' | 'break'
  shelter: 'yes' | 'partial' | 'no'
  affordanceRating: 1 | 2 | 3 | 4 | 5
}

const TOTAL = 8

export default function Questionnaire({onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [responses, setResponses] = useState<Partial<QuestionnaireResponses>>({
    surroundings: []
  })
  const [error, setError] = useState('')

  const progress = Math.round((step / TOTAL) * 100)

  const set = (key: keyof QuestionnaireResponses, value: unknown) => {
    setResponses(r => ({ ...r, [key]: value }))
    setError('')
  }

  const toggleSurrounding = (val: string) => {
    setResponses(r => {
      const current = r.surroundings ?? []
      const updated = current.includes(val)
        ? current.filter(s => s !== val)
        : [...current, val]
      return { ...r, surroundings: updated }
    })
    setError('')
  }

  const next = () => {
    // validate current step
    if (step === 1 && !responses.locationType) {
      setError('Please select a location type'); return
    }
    if (step === 2 && !responses.thermalComfort) {
      setError('Please rate your thermal comfort'); return
    }
    if (step === 3 && (!responses.surroundings || responses.surroundings.length === 0)) {
      setError('Please select at least one option'); return
    }
    if (step === 4 && !responses.naturalLight) {
      setError('Please rate the natural light'); return
    }
    if (step === 5 && !responses.noiseLevel) {
      setError('Please select a noise level'); return
    }
    if (step === 6 && !responses.activity) {
      setError('Please select your current activity'); return
    }
    if (step === 7 && !responses.shelter) {
      setError('Please select a shelter option'); return
    }
    if (step === 8 && !responses.affordanceRating) {
      setError('Please rate how well this environment supports your work'); return
    }

    if (step < TOTAL) {
      setStep(s => s + 1)
    } else {
      onComplete(responses as QuestionnaireResponses)
    }
  }

  const back = () => {
    setError('')
    setStep(s => s - 1)
  }

  // ── shared styles ───────────────────────────────────────────────────────────
  const S = {
    screen: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      background: '#f0f4f0',
      display: 'flex',
      flexDirection: 'column' as const
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      height: '52px',
      background: '#1a2e1a',
      flexShrink: 0 as const
    },
    progressBar: {
      height: '3px',
      background: 'rgba(255,255,255,0.15)',
      flexShrink: 0 as const
    },
    progressFill: {
      height: '3px',
      background: '#f6c90e',
      width: `${progress}%`,
      transition: 'width 0.3s'
    },
    body: {
      flex: 1,
      padding: '1.5rem 1.25rem',
      overflowY: 'auto' as const
    },
    stepLabel: {
      fontSize: '11px',
      fontWeight: 600 as const,
      color: '#7a8a9a',
      letterSpacing: '0.06em',
      marginBottom: '4px'
    },
    question: {
      fontSize: '17px',
      fontWeight: 700 as const,
      color: '#1a2e1a',
      margin: '0 0 4px',
      lineHeight: 1.35
    },
    pOKW2hint: {
      fontSize: '11px',
      color: '#aaa',
      fontStyle: 'italic' as const,
      margin: '0 0 1.25rem'
    },
    optGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginBottom: '1.25rem'
    },
    optFull: {
      gridColumn: '1 / -1'
    },
    scaleRow: {
      display: 'flex',
      gap: '6px',
      marginBottom: '6px'
    },
    scaleLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '11px',
      color: '#aaa',
      marginBottom: '1.25rem'
    },
    errorBox: {
      background: '#fff0f0',
      border: '1.5px solid #e53e3e',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '13px',
      color: '#c0392b',
      marginBottom: '12px'
    },
    navRow: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px'
    }
  }

  const optStyle = (selected: boolean): React.CSSProperties => ({
    padding: '12px 8px',
    border: selected ? '2px solid #1a2e1a' : '1.5px solid #ddd',
    borderRadius: '10px',
    background: selected ? '#f0f9e8' : '#fff',
    color: selected ? '#1a2e1a' : '#555',
    fontWeight: selected ? 600 : 400,
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'center' as const,
    lineHeight: 1.4,
    transition: 'all 0.15s'
  })

  const scaleStyle = (val: number, selected: number | undefined): React.CSSProperties => ({
    flex: 1,
    padding: '12px 4px',
    border: selected === val ? 'none' : '1.5px solid #ddd',
    borderRadius: '10px',
    background: selected === val ? '#1a2e1a' : '#fff',
    color: selected === val ? '#fff' : '#555',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '15px',
    textAlign: 'center' as const,
    transition: 'all 0.15s'
  })

  const btnBack: React.CSSProperties = {
    flex: 1,
    padding: '13px',
    border: '1.5px solid #ddd',
    borderRadius: '10px',
    background: '#fff',
    color: '#555',
    cursor: 'pointer',
    fontSize: '14px'
  }

  const btnNext: React.CSSProperties = {
    flex: 2,
    padding: '13px',
    border: 'none',
    borderRadius: '10px',
    background: step === TOTAL ? '#2d7d46' : '#1a2e1a',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700
  }

  const iconStyle: React.CSSProperties = {
    fontSize: '22px',
    display: 'block',
    marginBottom: '4px'
  }

  return (
    <div style={S.screen}>

      {/* ── NAVBAR ── */}
      <nav style={S.nav}>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>
          📋 Quick survey
        </span>
        <span style={{
          background: 'rgba(246,201,14,0.2)',
          border: '1px solid rgba(246,201,14,0.4)',
          color: '#f6c90e',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600
        }}>
          {step} of {TOTAL}
        </span>
      </nav>

      {/* ── PROGRESS BAR ── */}
      <div style={S.progressBar}>
        <div style={S.progressFill} />
      </div>

      <div style={S.body}>

        {/* ── Q1 — Location type ── */}
        {step === 1 && (
          <>
            <p style={S.stepLabel}>QUESTION 1 OF 8</p>
            <p style={S.question}>Where are you working right now?</p>
            <p style={S.pOKW2hint}>pOKW2: location type classification</p>
            <div style={S.optGrid}>
              {([
                { val: 'outdoor', icon: '🌳', label: 'Outdoor' },
                { val: 'semi-outdoor', icon: '⛱️', label: 'Semi-outdoor' },
                { val: 'indoor', icon: '🏢', label: 'Indoor' },
                { val: 'other', icon: '•••', label: 'Other' },
              ] as const).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => set('locationType', opt.val)}
                  style={optStyle(responses.locationType === opt.val)}
                >
                  <span style={iconStyle}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Q2 — Thermal comfort ── */}
        {step === 2 && (
          <>
            <p style={S.stepLabel}>QUESTION 2 OF 8</p>
            <p style={S.question}>How comfortable is the temperature right now?</p>
            <p style={S.pOKW2hint}>pOKW2: thermal comfort rating</p>
            <div style={S.scaleRow}>
              {([1, 2, 3, 4, 5] as const).map(n => (
                <button
                  key={n}
                  onClick={() => set('thermalComfort', n)}
                  style={scaleStyle(n, responses.thermalComfort)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={S.scaleLabels}>
              <span>Too cold</span>
              <span>Comfortable</span>
              <span>Too hot</span>
            </div>
          </>
        )}

        {/* ── Q3 — Surroundings (multi-select) ── */}
        {step === 3 && (
          <>
            <p style={S.stepLabel}>QUESTION 3 OF 8</p>
            <p style={S.question}>What do you see in front of you?</p>
            <p style={S.pOKW2hint}>pOKW2: environment type — select all that apply</p>
            <div style={S.optGrid}>
              {([
                { val: 'nature', icon: '🌿', label: 'Nature / greenery' },
                { val: 'buildings', icon: '🏗️', label: 'Buildings' },
                { val: 'sky', icon: '☁️', label: 'Open sky' },
                { val: 'people', icon: '👥', label: 'People' },
                { val: 'street', icon: '🛣️', label: 'Street / road' },
                { val: 'water', icon: '💧', label: 'Water / lake' },
              ]).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => toggleSurrounding(opt.val)}
                  style={optStyle(responses.surroundings?.includes(opt.val) ?? false)}
                >
                  <span style={iconStyle}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Q4 — Natural light ── */}
        {step === 4 && (
          <>
            <p style={S.stepLabel}>QUESTION 4 OF 8</p>
            <p style={S.question}>How much natural light is reaching you?</p>
            <p style={S.pOKW2hint}>pOKW2: light quality assessment</p>
            <div style={S.scaleRow}>
              {([1, 2, 3, 4, 5] as const).map(n => (
                <button
                  key={n}
                  onClick={() => set('naturalLight', n)}
                  style={scaleStyle(n, responses.naturalLight)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={S.scaleLabels}>
              <span>None / dark</span>
              <span>Moderate</span>
              <span>Very bright</span>
            </div>
          </>
        )}

        {/* ── Q5 — Noise level ── */}
        {step === 5 && (
          <>
            <p style={S.stepLabel}>QUESTION 5 OF 8</p>
            <p style={S.question}>How noisy is your current environment?</p>
            <p style={S.pOKW2hint}>pOKW2: acoustic environment</p>
            <div style={{ ...S.optGrid, gridTemplateColumns: '1fr' }}>
              {([
                { val: 'quiet', icon: '🔇', label: 'Quiet', sub: 'Little to no background noise' },
                { val: 'moderate', icon: '🔉', label: 'Moderate', sub: 'Some background noise, not distracting' },
                { val: 'loud', icon: '🔊', label: 'Loud / distracting', sub: 'Hard to concentrate' },
              ] as const).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => set('noiseLevel', opt.val)}
                  style={{
                    ...optStyle(responses.noiseLevel === opt.val),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left' as const,
                    padding: '14px 16px'
                  }}
                >
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{opt.icon}</span>
                  <span>
                    <span style={{ display: 'block', fontWeight: 600, marginBottom: '2px' }}>{opt.label}</span>
                    <span style={{ fontSize: '11px', color: responses.noiseLevel === opt.val ? '#3a5a2a' : '#aaa' }}>{opt.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Q6 — Activity ── */}
        {step === 6 && (
          <>
            <p style={S.stepLabel}>QUESTION 6 OF 8</p>
            <p style={S.question}>What are you working on right now?</p>
            <p style={S.pOKW2hint}>pOKW2: activity context</p>
            <div style={S.optGrid}>
              {([
                { val: 'deep-focus', icon: '🧠', label: 'Deep focus' },
                { val: 'meeting', icon: '💬', label: 'Meeting / call' },
                { val: 'admin', icon: '📧', label: 'Admin / email' },
                { val: 'break', icon: '☕', label: 'Break' },
              ] as const).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => set('activity', opt.val)}
                  style={optStyle(responses.activity === opt.val)}
                >
                  <span style={iconStyle}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
        {/* ── Q7 — Shelter / wind protection ── */}
{step === 7 && (
  <>
    <p style={S.stepLabel}>QUESTION 7 OF 8</p>
    <p style={S.question}>Are you sheltered from wind or rain?</p>
    <p style={S.pOKW2hint}>pOKW2: semi-outdoor classification — shelter indicator</p>
    <div style={{ ...S.optGrid, gridTemplateColumns: '1fr' }}>
      {([
        {
          val: 'yes',
          icon: '🏠',
          label: 'Yes — fully sheltered',
          sub: 'Roof, canopy, or structure overhead'
        },
        {
          val: 'partial',
          icon: '⛱️',
          label: 'Partially sheltered',
          sub: 'Some protection — umbrella, trees, overhang'
        },
        {
          val: 'no',
          icon: '🌤️',
          label: 'No shelter',
          sub: 'Fully exposed to weather'
        },
      ] as const).map(opt => (
        <button
          key={opt.val}
          onClick={() => set('shelter', opt.val)}
          style={{
            ...optStyle(responses.shelter === opt.val),
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left' as const,
            padding: '14px 16px'
          }}
        >
          <span style={{ fontSize: '24px', flexShrink: 0 }}>{opt.icon}</span>
          <span>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: '2px' }}>
              {opt.label}
            </span>
            <span style={{
              fontSize: '11px',
              color: responses.shelter === opt.val ? '#3a5a2a' : '#aaa'
            }}>
              {opt.sub}
            </span>
          </span>
        </button>
      ))}
    </div>
  </>
)}

{/* ── Q8 — Affordance rating (pOKW2 Additional Question) ── */}
{step === 8 && (
  <>
    <p style={S.stepLabel}>QUESTION 8 OF 8</p>
    <p style={S.question}>
      How well does this environment support your knowledge work right now?
    </p>
    <p style={S.pOKW2hint}>
      pOKW2 Additional Question (AQ) — core analytical output
    </p>

    {/* Visual scale with labels */}
    <div style={{ marginBottom: '8px' }}>
      <div style={S.scaleRow}>
        {([1, 2, 3, 4, 5] as const).map(n => (
          <button
            key={n}
            onClick={() => set('affordanceRating', n)}
            style={{
              ...scaleStyle(n, responses.affordanceRating),
              fontSize: '18px'
            }}
          >
            {['😟', '😕', '😐', '🙂', '😊'][n - 1]}
          </button>
        ))}
      </div>
      <div style={S.scaleLabels}>
        <span>Hinders work</span>
        <span>Neutral</span>
        <span>Supports work</span>
      </div>
    </div>

    {/* Selected value description */}
    {responses.affordanceRating && (
      <div style={{
        background: '#f0f9e8',
        border: '1.5px solid #7dc355',
        borderRadius: '10px',
        padding: '10px 14px',
        marginBottom: '1.25rem',
        fontSize: '13px',
        color: '#1a2e1a',
        textAlign: 'center' as const
      }}>
        {[
          'This environment significantly hinders your ability to work',
          'This environment somewhat hinders your work',
          'This environment neither helps nor hinders your work',
          'This environment somewhat supports your work',
          'This environment strongly supports your ability to work',
        ][responses.affordanceRating - 1]}
      </div>
    )}
  </>
)}

        {/* ── Validation error ── */}
        {error && (
          <div style={S.errorBox}>⚠ {error}</div>
        )}


        {/* ── Navigation buttons ── */}
        <div style={S.navRow}>
          {step > 1 && (
            <button onClick={back} style={btnBack}>← Back</button>
          )}
          <button onClick={next} style={btnNext}>
            {step === TOTAL ? '✓ Submit survey' : 'Next →'}
          </button>
        </div>

      </div>
    </div>
  )
}
