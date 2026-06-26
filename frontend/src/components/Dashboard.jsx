import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export default function Dashboard() {
  const navigate = useNavigate()
  const { token, resetApp } = useStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    
    fetch('http://localhost:5000/api/dashboard', {
      headers: { 'X-Auth-Token': token }
    })
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [token])

  const handleNewDecision = () => {
    resetApp()
    navigate('/new')
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', opacity: 0.7 }}>Loading Dashboard...</div>
  if (error) return <div className="card" style={{ borderColor: 'var(--error)' }}>Error loading dashboard: {error}</div>
  if (!data) return null

  const renderTrend = (trend) => {
    if (trend === 0) return <span style={{ opacity: 0.5 }}>- No change</span>
    if (trend > 0) return <span style={{ color: 'var(--success)' }}>↑ +{trend} vs prev half</span>
    return <span style={{ color: 'var(--error)' }}>↓ {trend} vs prev half</span>
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Executive Dashboard</h1>
          <div style={{ opacity: 0.7 }}>Organizational Decision Performance</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/history')}>View History</button>
          <button className="btn btn-secondary" onClick={() => navigate('/insights')}>View Insights</button>
          <button className="btn btn-p" onClick={handleNewDecision}>+ New Decision</button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '12px' }}>Total Decisions</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{data.totalDecisions}</div>
        </div>
        
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '12px' }}>Outcomes Recorded</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{data.totalOutcomes}</div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '12px' }}>Avg Readiness</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {data.averageReadiness} <span style={{ fontSize: '1.2rem', fontWeight: 400, opacity: 0.5 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.9rem', marginTop: '8px', fontWeight: 500 }}>
            {renderTrend(data.readinessTrend)}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '12px' }}>Avg Decision Quality</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {data.averageDecisionQuality} <span style={{ fontSize: '1.2rem', fontWeight: 400, opacity: 0.5 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.9rem', marginTop: '8px', fontWeight: 500 }}>
            {renderTrend(data.qualityTrend)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        {/* Row 2A: Organization Snapshot */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '20px' }}>Organization Snapshot</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '8px' }}>Strongest Area</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--success)' }}>{data.strongestArea}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '8px' }}>Weakest Area</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--error)' }}>{data.weakestArea}</div>
            </div>
          </div>
        </div>

        {/* Row 2B: Needs Attention */}
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Needs Attention
          </h2>
          {data.needsAttention && data.needsAttention.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.needsAttention.map((item, idx) => (
                <li key={idx} style={{ fontSize: '1rem', lineHeight: 1.4 }}>{item}</li>
              ))}
            </ul>
          ) : (
            <div style={{ opacity: 0.7 }}>All metrics look good. No immediate attention required.</div>
          )}
        </div>
      </div>

      {/* Row 3: Recent Decisions */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginTop: 0, marginBottom: '20px' }}>Recent Decisions</h2>
        {data.recentDecisions && data.recentDecisions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.recentDecisions.map(dec => (
              <div 
                key={dec._id} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 1fr', 
                  gap: '15px', 
                  padding: '16px', 
                  background: 'var(--bg-card-hover)', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  alignItems: 'center'
                }}
                onClick={() => navigate(`/history/${dec._id}`)}
              >
                <div style={{ fontWeight: 600 }}>{dec.title}</div>
                <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>{new Date(dec.date).toLocaleDateString()}</div>
                <div>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    background: dec.readiness >= 80 ? 'rgba(46, 204, 113, 0.2)' : dec.readiness >= 60 ? 'rgba(241, 196, 15, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                    color: dec.readiness >= 80 ? 'var(--success)' : dec.readiness >= 60 ? 'var(--warning)' : 'var(--error)'
                  }}>
                    Readiness: {dec.readiness}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 500, fontSize: '0.9rem', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                  {dec.status}
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:5000/api/decisions/${dec._id}/report?token=${token}`, '_blank'); }}
                    style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--t1)', fontSize: '0.8rem' }}
                    title="Export Executive Report"
                  >
                    📄 Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ opacity: 0.7 }}>No decisions recorded yet.</div>
        )}
      </div>

    </>
  )
}
