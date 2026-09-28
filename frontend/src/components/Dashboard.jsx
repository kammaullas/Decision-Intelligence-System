import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { PlusCircle, History, Lightbulb, Target, TrendingUp, CheckCircle, Activity, Bell, AlertTriangle, Building, FileDown, Layers } from 'lucide-react'
import CircularProgress from './CircularProgress'
import BenchmarkMetric from './BenchmarkMetric'

export default function Dashboard() {
  const navigate = useNavigate()
  const { token, resetApp } = useStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reminder, setReminder] = useState(null)
  const [reminderLoading, setReminderLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/dashboard`, { credentials: 'include',
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

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/leadership-reminder`, { credentials: 'include',
      headers: { 'X-Auth-Token': token }
    })
      .then(res => res.json())
      .then(d => {
        if (!d.error) setReminder(d.reminder)
        setReminderLoading(false)
      })
      .catch(() => setReminderLoading(false))
  }, [token])

  const handleNewDecision = () => {
    resetApp()
    navigate('/new')
  }

  const downloadReport = async (e, id, title) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/decisions/${id}/report?token=${token}`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to download report');
      
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const htmlText = await res.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlText);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const safeTitle = (title || 'Report').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        a.download = `Decision_Report_${safeTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert('Unable to generate the report. Please try again.');
    }
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
          <div style={{ opacity: 0.7 }}>Personal Decision Performance</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/history')}>
            <History size={16} /> View History
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/insights')}>
            <Lightbulb size={16} className="icon-ai" /> View Insights
          </button>
          <button className="btn btn-p" onClick={handleNewDecision}>
            <PlusCircle size={16} /> New Decision
          </button>
        </div>
      </div>

      {/* Daily Leadership Reminder */}
      <div className="leadership-banner fade-in">
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', width: '140px', height: '140px', background: 'radial-gradient(circle, var(--leadership-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="leadership-banner-label">
          <span className="pulse-dot" style={{ background: 'var(--leadership-label)' }}></span>
          <Bell size={15} /> Today's Leadership Reminder
        </div>
        <div className="leadership-banner-quote">
          "{reminderLoading ? 'Generating your personalized reminder...' : (reminder || 'Balance data-driven insights with cultural considerations to ensure strategic decisions resonate across the organization.')}"
        </div>
      </div>

      {/* Row 1: KPI Cards - 4-column balanced responsive grid */}
      <div className="fade-in dashboard-kpi-grid" style={{ animationDelay: '0.1s' }}>
        <div className="kpi-card" style={{ alignItems: 'center', textAlign: 'center', padding: '22px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: '14px' }}>
            <Activity size={15} className="icon-pulse" style={{ color: 'var(--ac2)' }} /> Total Decisions
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', width: '100px', position: 'relative' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              border: '3px solid var(--b1)',
              borderTopColor: 'var(--ac2)',
              borderRightColor: 'var(--ac2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, fontFamily: '"DM Sans", sans-serif' }}>
                {data.totalDecisions}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--t3)', fontWeight: 600, marginTop: '2px' }}>logged</span>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '12px', fontWeight: 700, color: 'var(--ac2)', letterSpacing: '0.5px' }}>
            ACTIVE PIPELINE
          </div>
        </div>
        
        <div className="kpi-card" style={{ alignItems: 'center', textAlign: 'center', padding: '22px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: '14px' }}>
            <CheckCircle size={15} style={{ color: 'var(--success)' }} /> Review Rate
          </div>
          <CircularProgress 
            value={data.totalDecisions > 0 ? Math.round((data.totalOutcomes / data.totalDecisions) * 100) : 0} 
            color="var(--success)" 
            size={90} 
            strokeWidth={8}
            label="Outcomes" 
          />
          <div style={{ fontSize: '0.82rem', marginTop: '6px', fontWeight: 500, color: 'var(--t2)' }}>
            {data.totalOutcomes} of {data.totalDecisions} evaluated
          </div>
        </div>

        <div className="kpi-card" style={{ alignItems: 'center', textAlign: 'center', padding: '22px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: '14px' }}>
            <Target size={15} style={{ color: 'var(--ac)' }} /> Avg Readiness
          </div>
          <CircularProgress 
            value={data.averageReadiness} 
            color={data.averageReadiness >= 70 ? 'var(--success)' : data.averageReadiness >= 40 ? 'var(--warning)' : 'var(--error)'} 
            size={90} 
            strokeWidth={8}
            label="Readiness" 
          />
          <div style={{ fontSize: '0.85rem', marginTop: '6px', fontWeight: 600 }}>
            {renderTrend(data.readinessTrend)}
          </div>
        </div>

        <div className="kpi-card" style={{ alignItems: 'center', textAlign: 'center', padding: '22px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: '14px' }}>
            <TrendingUp size={15} style={{ color: 'var(--ac2)' }} /> Avg Quality
          </div>
          <CircularProgress 
            value={data.averageDecisionQuality} 
            color={data.averageDecisionQuality >= 70 ? 'var(--success)' : data.averageDecisionQuality >= 40 ? 'var(--warning)' : 'var(--error)'} 
            size={90} 
            strokeWidth={8}
            label="Quality" 
          />
          <div style={{ fontSize: '0.85rem', marginTop: '6px', fontWeight: 600 }}>
            {renderTrend(data.qualityTrend)}
          </div>
        </div>
      </div>

      {/* Institutional Benchmark Metric */}
      {data.averageReadiness !== undefined && data.averageReadiness !== null && (
        <div className="fade-in" style={{ animationDelay: '0.15s', marginBottom: '28px' }}>
          <BenchmarkMetric 
            score={data.averageReadiness} 
            metricName="Portfolio Decision Readiness" 
            benchmark={70} 
            subtitle="Portfolio Governance Meter: Compares your average decision readiness against the 70 pt executive benchmark."
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Row 2A: Organization Snapshot */}
        <div className="card fade-in" style={{ animationDelay: '0.2s', padding: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem', marginTop: 0, marginBottom: '22px' }}>
            <Building size={18} style={{ color: 'var(--ac)' }} /> Personal Snapshot
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'var(--s2)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid var(--success)' }}>
              <div style={{ fontSize: '0.78rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 600 }}>Strongest Area</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>{data.strongestArea || 'Execution Effectiveness'}</div>
              <div style={{ width: '100%', height: '6px', background: 'var(--b1)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: 'var(--success)', borderRadius: '3px' }}></div>
              </div>
            </div>
            <div style={{ background: 'var(--s2)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid var(--error)' }}>
              <div style={{ fontSize: '0.78rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 600 }}>Focus / Weakest Area</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--error)' }}>{data.weakestArea || 'Evidence Quality'}</div>
              <div style={{ width: '100%', height: '6px', background: 'var(--b1)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ width: '42%', height: '100%', background: 'var(--error)', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2B: Needs Attention */}
        <div className="card fade-in" style={{ borderLeft: '4px solid var(--warning)', animationDelay: '0.3s', padding: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem', marginTop: 0, marginBottom: '20px', color: 'var(--warning)' }}>
            <AlertTriangle size={18} /> Needs Attention
          </h2>
          {data.needsAttention && data.needsAttention.length > 0 ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.needsAttention.map((item, idx) => (
                <li key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px', 
                  fontSize: '0.92rem', 
                  lineHeight: 1.45,
                  padding: '10px 14px',
                  background: 'var(--s2)',
                  borderRadius: '8px',
                  border: '1px solid var(--b1)'
                }}>
                  <span className="pulse-dot" style={{ background: 'var(--warning)', marginTop: '6px', flexShrink: 0 }}></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ opacity: 0.7, padding: '16px', background: 'var(--s2)', borderRadius: '8px' }}>
              ✨ All decision metrics look optimal. No immediate attention required.
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Recent Decisions */}
      <div className="card fade-in" style={{ animationDelay: '0.4s', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', margin: 0 }}>
            <Layers size={18} style={{ color: 'var(--ac)' }} /> Recent Decisions
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--t3)', fontWeight: 500 }}>
            Showing {data.recentDecisions ? data.recentDecisions.length : 0} latest
          </span>
        </div>

        {data.recentDecisions && data.recentDecisions.length > 0 ? (
          <div className="decision-table-scroll">
            <div className="decision-table-inner">
              {/* Mathematical Column Header */}
              <div className="decision-table-header">
                <span>Decision & ID</span>
                <span>Date</span>
                <span>Readiness</span>
                <span>Stage / Status</span>
                <span style={{ textAlign: 'right', justifySelf: 'end', width: '100%' }}>Action</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.recentDecisions.map(dec => {
                  const rScore = dec.readiness !== undefined && dec.readiness !== null ? dec.readiness : 0;
                  const isScored = rScore > 0;
                  const rBg = !isScored ? 'rgba(148, 163, 184, 0.12)' : rScore >= 75 ? 'var(--badge-green-bg)' : rScore >= 50 ? 'var(--badge-amber-bg)' : 'var(--badge-red-bg)';
                  const rColor = !isScored ? 'var(--t3)' : rScore >= 75 ? 'var(--badge-green-text)' : rScore >= 50 ? 'var(--badge-amber-text)' : 'var(--badge-red-text)';
                  const isRecorded = dec.status === 'Outcome Recorded';

                  return (
                    <div 
                      key={dec._id} 
                      className="decision-row-grid"
                      onClick={() => navigate(`/history/${dec._id}`)}
                    >
                      {/* Column 1: Title & ID */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dec.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--t3)', marginTop: '2px', fontFamily: 'monospace' }}>
                          ID: {dec._id?.slice(-6) || '---'}
                        </div>
                      </div>
                      
                      {/* Column 2: Date */}
                      <div style={{ fontSize: '0.85rem', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                        {new Date(dec.date).toLocaleDateString()}
                      </div>

                      {/* Column 3: Readiness Score Badge */}
                      <div>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.78rem', 
                          fontWeight: 700,
                          background: rBg,
                          color: rColor,
                          border: `1px solid ${rColor}35`,
                          whiteSpace: 'nowrap'
                        }}>
                          {isScored && <span className="pulse-dot" style={{ background: rColor, width: '6px', height: '6px' }}></span>}
                          {isScored ? `Readiness: ${rScore}` : 'Readiness: 0'}
                        </span>
                      </div>

                      {/* Column 4: Status Badge */}
                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: isRecorded ? 'var(--badge-green-text)' : 'var(--badge-blue-text)',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          background: isRecorded ? 'var(--badge-green-bg)' : 'var(--badge-blue-bg)',
                          border: `1px solid ${isRecorded ? 'var(--badge-green-text)' : 'var(--badge-blue-text)'}30`,
                          whiteSpace: 'nowrap'
                        }}>
                          {isRecorded ? <CheckCircle size={13} /> : <Activity size={13} />}
                          {dec.status || 'Evaluated'}
                        </span>
                      </div>

                      {/* Column 5: Export Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', justifySelf: 'end', width: '100%' }}>
                        <button 
                          onClick={(e) => downloadReport(e, dec._id, dec.title)}
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            background: 'transparent', 
                            border: '1px solid var(--b1)', 
                            borderRadius: '6px', 
                            padding: '6px 14px', 
                            cursor: 'pointer', 
                            color: 'var(--t1)', 
                            fontSize: '0.82rem', 
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                          }}
                          title="Export Executive Report"
                          onMouseOver={(e) => { 
                            e.currentTarget.style.borderColor = 'var(--ac)'; 
                            e.currentTarget.style.color = 'var(--ac)';
                            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)'; 
                          }}
                          onMouseOut={(e) => { 
                            e.currentTarget.style.borderColor = 'var(--b1)'; 
                            e.currentTarget.style.color = 'var(--t1)';
                            e.currentTarget.style.background = 'transparent'; 
                          }}
                        >
                          <FileDown size={14} /> Export
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.7, padding: '24px', textAlign: 'center', background: 'var(--s2)', borderRadius: '8px' }}>
            No decisions recorded yet. Click "New Decision" above to run an analysis.
          </div>
        )}
      </div>

    </>
  )
}
