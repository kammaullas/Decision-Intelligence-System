import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { History, Search, Filter, FileDown, PlusCircle, ArrowUpRight, CheckCircle2, Clock, Sparkles } from 'lucide-react'

export default function DecisionHistory() {
  const { decisionHistory, fetchHistory, loading, token } = useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

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

  const filteredDecisions = (decisionHistory || []).filter(d => {
    const matchesSearch = !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.industry?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || (filterStatus === 'RECORDED' && d.status === 'Outcome Recorded') || (filterStatus === 'EVALUATED' && d.status !== 'Outcome Recorded');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <History size={28} style={{ color: 'var(--ac)' }} className="icon-pulse" /> Decision History
          </h1>
          <div className="hint" style={{ margin: '6px 0 0 0' }}>
            Comprehensive institutional archive of strategic evaluations and recorded outcomes
          </div>
        </div>
        <button className="btn btn-p" onClick={() => navigate('/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={16} /> New Strategic Decision
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card fade-in" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input 
            type="text" 
            placeholder="Search by decision title, industry, or keyword..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '40px', margin: 0 }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--t3)', fontWeight: 600, marginRight: '4px' }}>FILTER:</span>
          {['ALL', 'RECORDED', 'EVALUATED'].map(status => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: filterStatus === status ? '1px solid var(--ac)' : '1px solid var(--b1)',
                background: filterStatus === status ? 'var(--ac)' : 'var(--s2)',
                color: filterStatus === status ? '#000000' : 'var(--t1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {status === 'ALL' ? 'All Decisions' : status === 'RECORDED' ? 'Outcome Recorded' : 'Evaluated Only'}
            </button>
          ))}
        </div>
      </div>

      {loading && decisionHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', opacity: 0.7 }}>Loading Decision Archive...</div>
      ) : filteredDecisions.length === 0 ? (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Sparkles size={40} style={{ color: 'var(--ac)', margin: '0 auto 16px auto', opacity: 0.8 }} />
          <h3 style={{ marginBottom: '8px' }}>No Decisions Found</h3>
          <p style={{ color: 'var(--t2)', marginBottom: '20px' }}>
            {search ? 'No decision records match your search criteria.' : 'Begin by documenting and evaluating your first strategic initiative.'}
          </p>
          <button className="btn btn-p" onClick={() => navigate('/new')}>Create New Decision</button>
        </div>
      ) : (
        <div className="card fade-in" style={{ padding: '24px' }}>
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
                {filteredDecisions.map(d => {
                  const rScore = d.decisionReadinessScore || 0;
                  const isScored = rScore > 0;
                  const rBg = !isScored ? 'rgba(148, 163, 184, 0.12)' : rScore >= 75 ? 'var(--badge-green-bg)' : rScore >= 50 ? 'var(--badge-amber-bg)' : 'var(--badge-red-bg)';
                  const rColor = !isScored ? 'var(--t3)' : rScore >= 75 ? 'var(--badge-green-text)' : rScore >= 50 ? 'var(--badge-amber-text)' : 'var(--badge-red-text)';
                  const isRecorded = d.status === 'Outcome Recorded';

                  return (
                    <div 
                      key={d._id} 
                      className="decision-row-grid"
                      onClick={() => navigate(`/history/${d._id}`)}
                    >
                      {/* Column 1: Title & ID */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--t3)', marginTop: '2px', fontFamily: 'monospace' }}>
                          {d.industry ? `${d.industry} · ` : ''}ID: {d._id?.slice(-6) || '---'}
                        </div>
                      </div>

                      {/* Column 2: Date */}
                      <div style={{ fontSize: '0.85rem', color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                      </div>

                      {/* Column 3: Readiness Score Badge */}
                      <div>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px', 
                          borderRadius: '16px', 
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
                          {isRecorded ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {isRecorded ? 'Outcome Recorded' : 'Evaluated'}
                        </span>
                      </div>

                      {/* Column 5: Action */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', justifySelf: 'end', width: '100%' }}>
                        <button 
                          onClick={(e) => downloadReport(e, d._id, d.title)}
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
        </div>
      )}
    </div>
  )
}
