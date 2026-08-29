import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { ArrowLeft, FileDown, PlusCircle, LayoutList, Target, Lightbulb, Clock, CheckCircle, Upload, PlayCircle, History, Sparkles, AlertTriangle, Briefcase, Camera } from 'lucide-react'

export default function DecisionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, setLoading, setError } = useStore()
  
  const [decision, setDecision] = useState(null)
  const [outcomes, setOutcomes] = useState([])
  const [showOutcomeForm, setShowOutcomeForm] = useState(false)
  
  const [obs, setObs] = useState('')
  const [metrics, setMetrics] = useState('')
  const [outcomeDocText, setOutcomeDocText] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const fileInputRef = useRef(null)

  const fetchDecisionAndOutcomes = async () => {
    setLoading(true, "Loading decision data...")
    try {
      const resD = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/decisions/${id}`, {
        headers: { 'X-Auth-Token': token }
      })
      const dataD = await resD.json()
      if (dataD.error) throw new Error(dataD.error)
      setDecision(dataD)

      const resO = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/decisions/${id}/outcomes`, {
        headers: { 'X-Auth-Token': token }
      })
      const dataO = await resO.json()
      if (dataO.error) throw new Error(dataO.error)
      setOutcomes(dataO)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchDecisionAndOutcomes()
  }, [id, token])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('document', file)
    
    setUploadStatus('Extracting document...')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/extract-document`, {
        method: 'POST',
        headers: { 'X-Auth-Token': token },
        body: formData
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOutcomeDocText(JSON.stringify(data))
      setUploadStatus('Document extracted successfully!')
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`)
    }
  }

  const handleSubmitOutcome = async () => {
    if (!obs && !metrics && !outcomeDocText) {
      return setError("Please provide observations, metrics, or an outcome report.")
    }

    setLoading(true, "Evaluating outcome...")
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/evaluate-outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify({
          decisionId: id,
          observations: obs,
          metrics,
          uploadedOutcomeInsights: outcomeDocText
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      setObs('')
      setMetrics('')
      setOutcomeDocText(null)
      setUploadStatus('')
      setShowOutcomeForm(false)
      
      await fetchDecisionAndOutcomes()
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!decision) return null

  const latestOutcome = outcomes.length > 0 ? outcomes[outcomes.length - 1] : null;

  // 1. Readiness Score
  const readinessScore = decision.decisionReadinessScore || 0;
  const rsColor = readinessScore >= 80 ? "var(--success)" : readinessScore >= 60 ? "var(--warning)" : "var(--error)";
  const rsText = readinessScore >= 80 ? "High Readiness" : readinessScore >= 60 ? "Moderate Readiness" : "Low Readiness";

  // 2. Decision Quality Score
  const qualityScore = latestOutcome?.decisionQualityScore || 0;
  const qsColor = qualityScore >= 80 ? "var(--success)" : qualityScore >= 60 ? "var(--warning)" : "var(--error)";
  const qsText = qualityScore >= 80 ? "Strong Decision Process" : qualityScore >= 60 ? "Moderate Decision Process" : "Weak Decision Process";

  // 4. Outcome Confidence
  const oc = latestOutcome ? Math.round((latestOutcome.assumptionAccuracy + latestOutcome.evidenceQuality + latestOutcome.executionEffectiveness) / 3) : 0;
  const ocColor = oc >= 80 ? "var(--success)" : oc >= 60 ? "var(--warning)" : "var(--error)";
  const ocText = oc >= 80 ? "High Confidence" : oc >= 60 ? "Medium Confidence" : "Low Confidence";

  // Recommended Option
  const recOption = decision.recommendedOption || 'None selected';
  const whyWon = decision.evaluation?.insights?.whyRecommendationWon || [];

  // Biggest Risk
  let biggestRisk = "No major risks identified";
  if (decision.evaluation?.risks) {
    const optionRisk = decision.evaluation.risks.find(r => r.option === recOption);
    if (optionRisk) {
      biggestRisk = optionRisk.topRisk?.description || optionRisk.risks?.[0] || biggestRisk;
    }
  }

  // Biggest Lesson
  const biggestLesson = latestOutcome?.evaluation?.lessonsLearned?.[0] || "No lessons recorded yet";

  // Result String
  const resultString = latestOutcome ? (qualityScore >= 80 ? "Successful Outcome" : qualityScore >= 60 ? "Mixed Outcome" : "Poor Outcome") : "Pending Outcome";

  return (
    <>
      <div className="fade-in" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
          <Briefcase size={32} style={{ color: 'var(--ac)' }} /> 
          <span style={{ lineHeight: 1.2 }}>{decision.title}</span>
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/history')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <button className="btn btn-secondary" onClick={() => window.open(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/decisions/${id}/report?token=${token}`, '_blank')} style={{ borderColor: 'var(--ac)', color: 'var(--ac)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
            <FileDown size={18} /> Export Executive Report
          </button>
          <button className="btn btn-p" onClick={() => setShowOutcomeForm(!showOutcomeForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
            <PlusCircle size={18} /> Record Outcome
          </button>
        </div>
      </div>

      {showOutcomeForm && (
        <div className="card fade-in" style={{ marginBottom: '32px', border: '1px solid var(--ac)', background: 'var(--s2)' }}>
          <div className="clabel" style={{ color: 'var(--ac)', fontSize: '1rem', marginBottom: '20px' }}>Record Outcome & Evaluate</div>
          <div className="inp-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Actual Metrics (Revenue, Growth, etc.)</label>
            <textarea className="inp" placeholder="e.g. Q1 Revenue was $120k vs $150k expected" value={metrics} onChange={e => setMetrics(e.target.value)} rows={3} style={{ fontSize: '1rem' }} />
          </div>
          <div className="inp-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Observations</label>
            <textarea className="inp" placeholder="What happened after implementation?" value={obs} onChange={e => setObs(e.target.value)} rows={4} style={{ fontSize: '1rem' }} />
          </div>
          <div className="inp-group" style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={16} /> Upload Outcome Report (PDF/TXT)</label>
            <input type="file" className="inp" accept=".pdf,.txt" ref={fileInputRef} onChange={handleFileUpload} style={{ padding: '12px' }} />
            {uploadStatus && <div style={{ fontSize: '0.85rem', marginTop: '8px', color: 'var(--ac)', fontWeight: 500 }}>{uploadStatus}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setShowOutcomeForm(false)} style={{ padding: '10px 20px' }}>Cancel</button>
            <button className="btn btn-p" onClick={handleSubmitOutcome} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
              <CheckCircle size={18} /> Evaluate Outcome
            </button>
          </div>
        </div>
      )}
      
      {/* --- NEW EXECUTIVE REVIEW CARD --- */}
      <div className="card" style={{ marginBottom: '32px', padding: '24px', border: '2px solid var(--b1)' }}>
        
        {/* Top Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', background: 'var(--s2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Readiness Score</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              {readinessScore} <span style={{fontSize: '0.9rem', opacity: 0.5, fontWeight: 400}}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: rsColor }}>{rsText}</div>
          </div>
          
          <div style={{ padding: '16px', background: 'var(--s2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Decision Quality</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              {latestOutcome ? qualityScore : '--'} <span style={{fontSize: '0.9rem', opacity: 0.5, fontWeight: 400}}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: qsColor }}>{latestOutcome ? qsText : "Pending"}</div>
          </div>

          <div style={{ padding: '16px', background: 'var(--s2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Outcome Count</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{outcomes.length}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{outcomes.length === 1 ? '1 Outcome Recorded' : `${outcomes.length} Outcome Reviews`}</div>
          </div>

          <div style={{ padding: '16px', background: 'var(--s2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Outcome Confidence</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{latestOutcome ? `${oc}%` : '--'}</div>
            <div style={{ fontSize: '0.85rem', color: latestOutcome ? ocColor : 'inherit' }}>{latestOutcome ? ocText : "Pending"}</div>
          </div>

          <div style={{ padding: '16px', background: 'var(--s2)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Status</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '5px' }}>{decision.status || 'Evaluated'}</div>
          </div>
        </div>

        {/* Recommended Option Section */}
        <div className="fade-in" style={{ padding: '32px', background: 'var(--s2)', borderRadius: '12px', marginBottom: '32px', border: '1px solid var(--b1)', borderLeft: '4px solid var(--ac)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', opacity: 0.8, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            <Sparkles size={18} style={{ color: 'var(--ac)' }} /> Recommended Strategy
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--ac)', marginBottom: '20px' }}>{recOption}</div>
          
          {whyWon.length > 0 && (
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>Why It Was Chosen</div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {whyWon.map((reason, idx) => (
                  <li key={idx} style={{ fontSize: '0.95rem', marginBottom: '6px', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--success)' }}>✓</span> {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>



        {/* Executive Snapshot */}
        <div style={{ background: 'var(--s2)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--t1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
            <Camera size={20} /> Executive Snapshot
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>Recommendation</div>
              <div style={{ fontWeight: 600 }}>{recOption}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>Result</div>
              <div style={{ fontWeight: 600, color: qsColor }}>{resultString}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>Biggest Risk</div>
              <div style={{ fontWeight: 600 }}>{biggestRisk}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>Biggest Lesson</div>
              <div style={{ fontWeight: 600 }}>{biggestLesson}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Timeline */}
      {outcomes.length > 0 && (
        <div className="fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px', marginBottom: '20px' }}>
            <History size={24} /> Outcome Timeline
          </h2>
          {outcomes.map((o, index) => {
            const healthAvg = (o.decisionQualityScore + o.executionEffectiveness) / 2;
            let badgeText = "Needs Review";
            let badgeColor = "var(--error)";
            if (healthAvg >= 80) { badgeText = "Excellent Outcome"; badgeColor = "var(--success)"; }
            else if (healthAvg >= 60) { badgeText = "Good Outcome"; badgeColor = "var(--success)"; }
            else if (healthAvg >= 40) { badgeText = "Mixed Outcome"; badgeColor = "var(--warning)"; }

            const getInterpretation = (score) => {
              if (score >= 80) return { text: "Excellent", color: "var(--success)" };
              if (score >= 60) return { text: "Good", color: "var(--success)" };
              if (score >= 40) return { text: "Moderate", color: "var(--warning)" };
              return { text: "Needs Attention", color: "var(--error)" };
            };

            return (
              <div key={o._id} className="card" style={{ marginBottom: '32px', borderLeft: `4px solid ${badgeColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <span className="clabel" style={{ margin: 0, display: 'block', marginBottom: '4px' }}>Outcome Evaluation #{index + 1}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--t2)' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ background: badgeColor, color: '#fff', padding: '6px 16px', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
                    {badgeText}
                  </div>
                </div>
                
                {/* Progress Bars */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  {[
                    { label: 'Decision Quality', val: o.decisionQualityScore },
                    { label: 'Assumption Accuracy', val: o.assumptionAccuracy },
                    { label: 'Evidence Quality', val: o.evidenceQuality },
                    { label: 'Execution Effectiveness', val: o.executionEffectiveness }
                  ].map(bar => {
                    const interp = getInterpretation(bar.val);
                    return (
                      <div key={bar.label} style={{ background: 'var(--s2)', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem', fontWeight: 500 }}>
                          <span>{bar.label}</span>
                          <span style={{ color: interp.color, fontWeight: 600 }}>{bar.val} <span style={{fontSize: '0.8rem', opacity: 0.7, fontWeight: 400}}>({interp.text})</span></span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--b1)', borderRadius: '4px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
                          <div style={{ 
                            width: `${bar.val}%`, 
                            height: '100%', 
                            background: interp.color,
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {o.evaluation && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    
                    {/* What We Got Right / Wrong Card */}
                    <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--b1)' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', color: 'var(--success)' }}>What We Got Right</div>
                        <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(o.evaluation.correctAssumptions || []).length > 0 ? 
                            o.evaluation.correctAssumptions.map((x, i) => <li key={i} style={{ fontSize: '0.9rem', display: 'flex', gap: '8px' }}><span>✓</span> {x}</li>)
                            : <li style={{ fontSize: '0.9rem', opacity: 0.6 }}>None recorded</li>
                          }
                        </ul>
                      </div>
                      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--b1)' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', color: 'var(--error)' }}>What We Got Wrong</div>
                        <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(o.evaluation.incorrectAssumptions || []).length > 0 ? 
                            o.evaluation.incorrectAssumptions.map((x, i) => <li key={i} style={{ fontSize: '0.9rem', display: 'flex', gap: '8px' }}><span>✗</span> {x}</li>)
                            : <li style={{ fontSize: '0.9rem', opacity: 0.6 }}>None recorded</li>
                          }
                        </ul>
                      </div>
                    </div>

                    {/* Lessons Learned Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--b1)', height: '100%' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--ac)' }}>💡</span> Key Lessons Learned
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(o.evaluation.lessonsLearned || []).length > 0 ? 
                            o.evaluation.lessonsLearned.slice(0,3).map((x, i) => <li key={i} style={{ fontSize: '0.95rem', lineHeight: 1.4 }}>{x}</li>)
                            : <li style={{ fontSize: '0.9rem', opacity: 0.6, listStyle: 'none', marginLeft: '-24px' }}>No lessons recorded.</li>
                          }
                        </ul>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Framing Analysis */}
      {decision.framingAnalysis && (
        <div className="card" style={{ marginBottom: '20px', marginTop: '20px' }}>
          <div className="clabel">Original Framing Analysis (Score: {decision.decisionReadinessScore}/100)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <strong>Hidden Assumptions:</strong>
              <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                {(decision.framingAnalysis.hiddenAssumptions || []).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
            <div>
              <strong>Critical Unknowns:</strong>
              <ul style={{ paddingLeft: '20px', color: 'var(--t2)' }}>
                {(decision.framingAnalysis.criticalUnknowns || []).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
      
    </>
  )
}
