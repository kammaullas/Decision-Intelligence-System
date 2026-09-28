import { useEffect, useState } from 'react'
import { useStore } from '../store'
import CircularProgress from './CircularProgress'
import { Sparkles, TrendingUp, ShieldAlert, Award, AlertTriangle, CheckCircle2, Target, BrainCircuit, RefreshCw, BarChart3 } from 'lucide-react'

export default function OrganizationalInsights() {
  const { token, orgMetrics, setOrgMetrics, orgInsights, setOrgInsights, setLoading, setError } = useStore()
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    if (!token) return

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/personal-metrics`, { credentials: 'include',
          headers: { 'X-Auth-Token': token }
        })
        const data = await res.json()
        if (!data.error) setOrgMetrics(data)
      } catch (err) {
        console.error("Failed to fetch metrics", {
          message: err.message,
          stack: err.stack,
          errorObject: err
        });
      }
    }
    
    fetchMetrics()
  }, [token, setOrgMetrics])

  const handleGenerateInsights = async () => {
    setLoading(true, "Analyzing personal patterns...")
    setLoadingInsights(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/personal-insights`, { credentials: 'include',
        method: 'POST',
        headers: { 'X-Auth-Token': token }
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOrgInsights(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingInsights(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <BrainCircuit size={28} style={{ color: 'var(--ac)' }} /> Personal Learning & Insights
          </h1>
          <div className="hint" style={{ margin: '6px 0 0 0' }}>
            Empirical intelligence derived from historical decisions and recorded outcomes
          </div>
        </div>
        <button 
          className="btn btn-p" 
          onClick={handleGenerateInsights}
          disabled={loadingInsights}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          {loadingInsights ? <RefreshCw size={16} className="icon-spin" /> : <Sparkles size={16} className="icon-ai" />}
          {orgInsights ? "Refresh Insights" : "Generate AI Insights"}
        </button>
      </div>

      {orgMetrics && (
        <div className="card fade-in" style={{ marginBottom: '32px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div className="clabel" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={14} /> Cumulative Decision Performance Gauges
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--t3)', fontWeight: 600 }}>0 - 100 SCALE</span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '18px', 
            textAlign: 'center' 
          }}>
            {/* Total Decisions */}
            <div className="kpi-card" style={{ alignItems: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>Total Decisions</div>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid rgba(56, 189, 248, 0.3)', borderTopColor: 'var(--ac2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{orgMetrics.totalDecisions || 0}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--t3)' }}>cases</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ac2)', fontWeight: 600, marginTop: '8px' }}>EVALUATED</div>
            </div>

            {/* Avg Readiness */}
            <div className="kpi-card" style={{ alignItems: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Avg Readiness</div>
              <CircularProgress 
                value={orgMetrics.averageReadinessScore || 0} 
                color="var(--ac)" 
                size={80} 
                strokeWidth={7} 
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--t3)', fontWeight: 500, marginTop: '6px' }}>Readiness Score</div>
            </div>

            {/* Avg Decision Quality */}
            <div className="kpi-card" style={{ alignItems: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Avg Quality</div>
              <CircularProgress 
                value={orgMetrics.averageDecisionQualityScore || 0} 
                color="var(--success)" 
                size={80} 
                strokeWidth={7} 
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--t3)', fontWeight: 500, marginTop: '6px' }}>Process Rigor</div>
            </div>

            {/* Avg Assumption Accuracy */}
            <div className="kpi-card" style={{ alignItems: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Assumption Acc.</div>
              <CircularProgress 
                value={orgMetrics.averageAssumptionAccuracy || 0} 
                color="#6366f1" 
                size={80} 
                strokeWidth={7} 
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--t3)', fontWeight: 500, marginTop: '6px' }}>Forecasting Accuracy</div>
            </div>

            {/* Avg Evidence Quality */}
            <div className="kpi-card" style={{ alignItems: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Evidence Quality</div>
              <CircularProgress 
                value={orgMetrics.averageEvidenceQuality || 0} 
                color="#ec4899" 
                size={80} 
                strokeWidth={7} 
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--t3)', fontWeight: 500, marginTop: '6px' }}>Data Substantiation</div>
            </div>

            {/* Avg Execution */}
            <div className="kpi-card" style={{ alignItems: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--t2)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Execution Eff.</div>
              <CircularProgress 
                value={orgMetrics.averageExecutionEffectiveness || 0} 
                color="#14b8a6" 
                size={80} 
                strokeWidth={7} 
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--t3)', fontWeight: 500, marginTop: '6px' }}>Delivery Success</div>
            </div>
          </div>
        </div>
      )}

      {orgInsights ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card fade-in" style={{ padding: '28px', borderLeft: '4px solid var(--ac)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} style={{ color: 'var(--ac)' }} className="icon-ai" />
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>AI Empirical Analysis</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--s2)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--b1)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--t2)' }}>Analysis Confidence:</span>
                <span style={{ fontWeight: 800, color: 'var(--success)' }}>{orgInsights.confidence || 88}%</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
              {/* Strengths */}
              <div style={{ background: 'var(--s2)', padding: '20px', borderRadius: '12px', borderLeft: '3px solid var(--success)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 700, fontSize: '0.98rem', marginBottom: '14px' }}>
                  <Award size={18} /> Executive Strengths
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--t1)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
                  {(orgInsights.personalStrengths || []).map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>

              {/* Weaknesses */}
              <div style={{ background: 'var(--s2)', padding: '20px', borderRadius: '12px', borderLeft: '3px solid var(--error)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', fontWeight: 700, fontSize: '0.98rem', marginBottom: '14px' }}>
                  <AlertTriangle size={18} /> Vulnerabilities & Weaknesses
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--t1)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
                  {(orgInsights.personalWeaknesses || []).map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>

              {/* Successful Patterns */}
              <div style={{ background: 'var(--s2)', padding: '20px', borderRadius: '12px', borderLeft: '3px solid var(--ac2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ac2)', fontWeight: 700, fontSize: '0.98rem', marginBottom: '14px' }}>
                  <CheckCircle2 size={18} /> Winning Patterns
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--t1)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
                  {(orgInsights.successfulPatterns || []).map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>

              {/* Failure Patterns */}
              <div style={{ background: 'var(--s2)', padding: '20px', borderRadius: '12px', borderLeft: '3px solid var(--warning)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontWeight: 700, fontSize: '0.98rem', marginBottom: '14px' }}>
                  <ShieldAlert size={18} /> Risk Patterns & Pitfalls
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--t1)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
                  {(orgInsights.failurePatterns || []).map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>
            
            {/* Recommended Improvements */}
            {orgInsights.recommendedImprovements && orgInsights.recommendedImprovements.length > 0 && (
              <div style={{ marginTop: '24px', padding: '22px', background: 'var(--s2)', borderRadius: '12px', border: '1px solid var(--ac)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ac)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '14px' }}>
                  <Target size={18} /> High-Leverage Strategic Recommendations
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--t1)', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.94rem' }}>
                  {orgInsights.recommendedImprovements.map((x, i) => (
                    <li key={i} style={{ lineHeight: 1.5 }}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--s1)' }}>
          <BrainCircuit size={48} style={{ color: 'var(--ac)', opacity: 0.8, marginBottom: '16px' }} className="icon-pulse" />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Synthesize Your Organizational Intelligence</h3>
          <p style={{ color: 'var(--t2)', maxWidth: '500px', margin: '0 auto 24px auto', fontSize: '0.95rem' }}>
            Our neural model will evaluate your past decisions, identify recurring cognitive blindspots, and formulate customized executive recommendations.
          </p>
          <button className="btn btn-p" onClick={handleGenerateInsights} style={{ padding: '10px 24px' }}>
            <Sparkles size={16} /> Run Intelligent Analysis
          </button>
        </div>
      )}
    </div>
  )
}
