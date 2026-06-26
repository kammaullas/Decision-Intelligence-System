import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function OrganizationalInsights() {
  const { token, orgMetrics, setOrgMetrics, orgInsights, setOrgInsights, setLoading, setError } = useStore()
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    if (!token) return

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/organizational-metrics', {
          headers: { 'X-Auth-Token': token }
        })
        const data = await res.json()
        if (!data.error) setOrgMetrics(data)
      } catch (err) {
        console.error("Failed to fetch metrics", err)
      }
    }
    
    fetchMetrics()
  }, [token, setOrgMetrics])

  const handleGenerateInsights = async () => {
    setLoading(true, "Analyzing organizational patterns...")
    setLoadingInsights(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/organizational-insights', {
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
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Organizational Learning</h1>
        <button 
          className="btn btn-p" 
          onClick={handleGenerateInsights}
          disabled={loadingInsights}
        >
          {orgInsights ? "Refresh Insights" : "Generate Insights"}
        </button>
      </div>

      <p className="hint">Discover patterns across historical decisions to continuously improve future outcomes.</p>

      {orgMetrics && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <div className="clabel">Organizational Metrics (Averages)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', textAlign: 'center' }}>
            <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>Total Decisions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{orgMetrics.totalDecisions}</div>
            </div>
            <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>Avg Readiness</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{orgMetrics.averageReadinessScore}/100</div>
            </div>
            <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>Avg Decision Quality</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{orgMetrics.averageDecisionQualityScore}/100</div>
            </div>
            <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>Avg Assumption Accuracy</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{orgMetrics.averageAssumptionAccuracy}/100</div>
            </div>
            <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>Avg Evidence Quality</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{orgMetrics.averageEvidenceQuality}/100</div>
            </div>
            <div style={{ padding: '15px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>Avg Execution</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{orgMetrics.averageExecutionEffectiveness}/100</div>
            </div>
          </div>
        </div>
      )}

      {orgInsights ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ borderColor: 'var(--ac)' }}>
            <div className="clabel" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ac)' }}>
              <span>AI Learning Analysis</span>
              <span>Confidence: {orgInsights.confidence}%</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              <div>
                <h3 style={{ color: 'var(--success)' }}>Organizational Strengths</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                  {orgInsights.organizationalStrengths.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div>
                <h3 style={{ color: 'var(--error)' }}>Organizational Weaknesses</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                  {orgInsights.organizationalWeaknesses.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>

              <div>
                <h3 style={{ color: 'var(--success)' }}>Successful Patterns</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                  {orgInsights.successfulPatterns.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div>
                <h3 style={{ color: 'var(--warning)' }}>Failure Patterns</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                  {orgInsights.failurePatterns.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>

              <div>
                <h3 style={{ color: 'var(--warning)' }}>Forecasting Issues</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                  {orgInsights.forecastingIssues.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div>
                <h3 style={{ color: 'var(--warning)' }}>Execution Issues</h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                  {orgInsights.executionIssues.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--ac)' }}>Recommended Improvements</h3>
              <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                {orgInsights.recommendedImprovements.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--t2)', marginBottom: '15px' }}>No insights generated yet. Click the button above to run the analysis.</p>
        </div>
      )}
    </>
  )
}
