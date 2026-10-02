import { useEffect } from 'react'
import { useStore } from '../store'
import { SlidersHorizontal, ArrowLeft, Activity, CheckCircle2, TrendingUp, ShieldCheck, Zap, Scale } from 'lucide-react'

const EVALUATION_MODES = [
  {
    key: 'Balanced',
    name: 'Balanced Approach',
    tagline: 'Holistic & Measured',
    badge: 'Recommended',
    badgeColor: 'var(--ac, #d4af37)',
    icon: Scale,
    description: 'Evenly distributes focus across strategic alignment, financial returns, risk mitigation, and feasibility.',
    backendFocus: '25% Strategy · 20% ROI · 20% Risk · 15% Feasibility · 20% Speed & Stakeholders'
  },
  {
    key: 'Growth Focused',
    name: 'Growth Focused',
    tagline: 'Upside & Market Expansion',
    badge: 'High Upside',
    badgeColor: 'var(--success, #10b981)',
    icon: TrendingUp,
    description: 'Prioritizes maximum revenue potential, market capture, and high-impact strategic differentiation.',
    backendFocus: '35% Strategy · 25% Financial Impact · 10% Risk · 30% Execution'
  },
  {
    key: 'Risk Averse',
    name: 'Risk Averse',
    tagline: 'Downside Protection & Safety',
    badge: 'Defensive',
    badgeColor: 'var(--accent-blue, #38bdf8)',
    icon: ShieldCheck,
    description: 'Maximizes organizational safety, compliance, capital preservation, and downside risk containment.',
    backendFocus: '35% Risk & Safety · 20% Financial Impact · 15% Strategy · 30% Feasibility'
  },
  {
    key: 'Fast Expansion',
    name: 'Fast Expansion',
    tagline: 'Velocity & Speed-to-Market',
    badge: 'Rapid Velocity',
    badgeColor: 'var(--warning, #f59e0b)',
    icon: Zap,
    description: 'Prioritizes immediate execution speed, quick time-to-value, and seizing short-term market opportunities.',
    backendFocus: '25% Time to Impact · 20% Strategy · 20% Financial Impact · 35% Risk & Feasibility'
  }
]

export default function Step3_Criteria() {
  const store = useStore()
  const { 
    criteria, 
    evaluationStyle, 
    setEvaluationStyle, 
    setStep, 
    setLoading, 
    token, 
    title, 
    desc, 
    options, 
    industry, 
    stake, 
    extractedData, 
    framingAnalysis 
  } = store

  // Ensure an active valid mode is always selected
  useEffect(() => {
    if (!evaluationStyle || evaluationStyle === 'Custom') {
      setEvaluationStyle('Balanced')
    }
  }, [evaluationStyle, setEvaluationStyle])

  const handleNext = async () => {
    setLoading(true, "Running AI analysis...")
    try {
      let payloadContext = desc || "";
      if (extractedData) {
        payloadContext += `\n\n--- EXTRACTED DOCUMENT CONTEXT ---\n${JSON.stringify(extractedData)}`;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/evaluate`, { 
        credentials: 'include',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ 
          decision: title, 
          options, 
          criteria, 
          industry, 
          stakes: stake, 
          context: payloadContext, 
          framingAnalysis, 
          documentInsights: extractedData 
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      store.setResult(data)
      setStep(4)
    } catch (e) {
      alert("Analysis failed: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedMode = EVALUATION_MODES.find(m => m.key === evaluationStyle) || EVALUATION_MODES[0]

  return (
    <div className="fade-in">
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <SlidersHorizontal size={24} style={{ color: 'var(--ac)' }} /> Strategic Evaluation Mode
      </h1>
      <div className="hint">
        Select the strategic lens for your decision. DIA applies the optimal criteria weights automatically in the background.
      </div>
      
      <div className="card" style={{ padding: '28px' }}>
        <div className="clabel" style={{ marginBottom: '18px' }}>
          Select Strategic Mode
        </div>

        {/* 4 Clean Strategic Mode Selection Cards (No Sliders) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {EVALUATION_MODES.map((mode) => {
            const isSelected = evaluationStyle === mode.key
            const Icon = mode.icon

            return (
              <div
                key={mode.key}
                onClick={() => setEvaluationStyle(mode.key)}
                style={{
                  background: isSelected ? 'var(--leadership-bg, rgba(30, 58, 138, 0.25))' : 'var(--s2, #1f2937)',
                  border: isSelected ? '2px solid var(--ac, #d4af37)' : '1px solid var(--b1, #374151)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 0 20px rgba(212, 175, 55, 0.18)' : 'none',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--ac, #d4af37)' : 'var(--s1, #111827)',
                      color: isSelected ? '#000' : 'var(--ac, #d4af37)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={20} />
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: `${mode.badgeColor}22`,
                      color: mode.badgeColor,
                      border: `1px solid ${mode.badgeColor}44`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {mode.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--t1)', marginBottom: '4px' }}>
                    {mode.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ac, #d4af37)', marginBottom: '8px' }}>
                    {mode.tagline}
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--t2)', lineHeight: 1.5, margin: 0 }}>
                    {mode.description}
                  </p>
                </div>

                <div style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--b1, #374151)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--t3)', fontStyle: 'italic' }}>
                    Backend Multi-Criteria Weighted
                  </span>
                  {isSelected && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--success, #10b981)'
                    }}>
                      <CheckCircle2 size={15} /> Active
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Backend Confirmation Banner (Shows mode is active and locked) */}
        <div style={{ 
          padding: '16px 20px', 
          borderRadius: '12px', 
          background: 'var(--s2, #1f2937)', 
          border: '1px solid var(--b1, #374151)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--success, #10b981)' }}>
              <CheckCircle2 size={18} />
              <span>Active Lens: {selectedMode.name}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--t3)', marginTop: '4px' }}>
              Optimized weights: {selectedMode.backendFocus}
            </div>
          </div>

          <div style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--success, #10b981)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            100% Balanced Behind the Scenes
          </div>
        </div>
      </div>
      
      <div className="brow" style={{ marginTop: '24px' }}>
        <button className="btn btn-g" onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn btn-p" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={16} className="icon-pulse" /> Run analysis
        </button>
      </div>
    </div>
  )
}
