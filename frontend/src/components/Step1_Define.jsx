import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Sparkles, FileText, Upload, Target, CheckCircle2, AlertTriangle, Eye, HelpCircle, RefreshCw, TrendingUp, ArrowRight, Lightbulb, Edit3, PlusCircle } from 'lucide-react'
import CircularProgress from './CircularProgress'
import BenchmarkMetric from './BenchmarkMetric'

const DEMO_DATA = {
  title: "EV Expansion Strategy",
  desc: "Should we invest Rs. 2,000 crore in EV manufacturing and product development over the next 3 years? The company has strong ICE market share but EV adoption in India is accelerating. Infrastructure is still evolving, government incentives may change, and competition is intensifying.",
  industry: "Automotive",
  horizon: "3 years",
  stake: "High"
}

export default function Step1_Define() {
  const store = useStore()
  const { title, desc, industry, horizon, stake, mode, extractedData, framingAnalysis } = store
  const fileInputRef = useRef(null)
  const descTextareaRef = useRef(null)

  const [previousScore, setPreviousScore] = useState(null)
  const [scoreDelta, setScoreDelta] = useState(null)
  const [isModifiedSinceAnalysis, setIsModifiedSinceAnalysis] = useState(false)

  useEffect(() => {
    if (mode === 'demo' && !title) {
      store.setField('title', DEMO_DATA.title)
      store.setField('desc', DEMO_DATA.desc)
      store.setField('industry', DEMO_DATA.industry)
      store.setField('horizon', DEMO_DATA.horizon)
      store.setField('stake', DEMO_DATA.stake)
    }
  }, [mode, title, store])

  const handleFrameDecision = async (isReEval = false) => {
    if (!title) return store.setError("Enter a decision title.")
    if (!desc) return store.setError("Describe your decision.")

    const currentScore = framingAnalysis?.decisionReadinessScore;
    if (isReEval && currentScore !== undefined) {
      setPreviousScore(currentScore);
    }

    store.setLoading(true, isReEval ? "Re-evaluating decision readiness score..." : "Analyzing decision framing...")
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/frame-decision`, { credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': store.token
        },
        body: JSON.stringify({ decision: title, description: desc, industry, timeHorizon: horizon, stakes: stake })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      if (isReEval && currentScore !== undefined && data.decisionReadinessScore !== undefined) {
        setScoreDelta(data.decisionReadinessScore - currentScore);
      }
      store.setFramingAnalysis(data)
      setIsModifiedSinceAnalysis(false)
    } catch (e) {
      store.setError(e.message)
    } finally {
      store.setLoading(false)
    }
  }

  const handleAddressGap = (gapText, category) => {
    const addition = `\n\n[Clarification - ${category}]: ${gapText}\nResolution / Details: `;
    store.setField('desc', (desc || '') + addition);
    setIsModifiedSinceAnalysis(true);
    setTimeout(() => {
      if (descTextareaRef.current) {
        descTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        descTextareaRef.current.focus();
      }
    }, 100);
  };

  const handleGenerate = async () => {
    if (!title) return store.setError("Enter a decision title.")
    if (!desc) return store.setError("Describe your decision.")
    if (!industry) return store.setError("Select an industry.")
    if (!horizon) return store.setError("Select a time horizon.")

    store.setLoading(true, "Generating strategic options...")
    try {
      let payloadDesc = desc;
      if (extractedData) {
        payloadDesc += `\n\n--- EXTRACTED DOCUMENT CONTEXT ---\n${JSON.stringify(extractedData)}`;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/generate-options`, { credentials: 'include',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auth-Token': store.token
        },
        body: JSON.stringify({ decision: title, description: payloadDesc, industry, timeHorizon: horizon, stakes: stake })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      store.setOptions(data.options)
      store.setStep(2)
    } catch (e) {
      store.setError(e.message)
    } finally {
      store.setLoading(false)
    }
  }

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('document', file)

    store.setLoading(true, "Analyzing document...")
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/extract-document`, { credentials: 'include',
        method: 'POST',
        headers: {
          'X-Auth-Token': store.token
        },
        body: formData
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      store.setExtractedData(data)
      
      // Optionally append a note to the description
      const appendText = '\n\n[Context: Document analyzed successfully. Extracted strategic insights will be considered.]'
      store.setField('desc', desc + appendText)
    } catch (err) {
      store.setError(err.message)
    } finally {
      store.setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fade-in">
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Target size={24} style={{ color: 'var(--ac)' }} className="icon-pulse" /> Define your decision
      </h1>
      <div className="hint">
        {mode === 'demo' && <span className="demo-tag" style={{display:'block', marginBottom:'8px'}}>EV Demo - Fields Pre-filled. Click Generate Options to begin.</span>}
        Describe what you are deciding so AI can generate strategic options.
      </div>
      
      <div className="card">
        <div className="clabel">Decision context</div>
        
        <div className="doc-upload" style={{ marginBottom: '15px', padding: '15px', border: '1px dashed var(--b2)', borderRadius: '8px', background: 'var(--s2)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '500' }}>
            <Upload size={14} /> Upload Document (PDF/TXT) to Extract Context
          </label>
          <input 
            type="file" 
            accept=".pdf,.txt" 
            onChange={handleDocumentUpload} 
            ref={fileInputRef}
            style={{ fontSize: '0.9rem' }}
          />
          {extractedData && (
            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <strong>✓ Document analyzed successfully.</strong>
              <span>Opportunities: {extractedData.strategicOpportunities?.length || 0} | Risks: {extractedData.strategicRisks?.length || 0} | Metrics: {extractedData.quantitativeMetrics?.length || 0}</span>
            </div>
          )}
        </div>

        <label>Decision title</label>
        <input 
          type="text" 
          placeholder="e.g. Should we expand into EV segment?" 
          value={title}
          onChange={e => {
            store.setField('title', e.target.value);
            if (framingAnalysis) setIsModifiedSinceAnalysis(true);
          }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', marginBottom: '6px' }}>
          <label style={{ margin: 0 }}>Describe the decision</label>
          {isModifiedSinceAnalysis && (
            <span style={{ fontSize: '0.78rem', color: 'var(--ac)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Edit3 size={13} /> Framing edited · Re-evaluate to see updated score
            </span>
          )}
        </div>
        <textarea 
          ref={descTextareaRef}
          rows={5}
          placeholder="What are you deciding? Background, constraints, desired outcome..."
          value={desc}
          onChange={e => {
            store.setField('desc', e.target.value);
            if (framingAnalysis) setIsModifiedSinceAnalysis(true);
          }}
        />
        
        <div className="g2">
          <div>
            <label>Industry</label>
            <select value={industry} onChange={e => {
              store.setField('industry', e.target.value);
              if (framingAnalysis) setIsModifiedSinceAnalysis(true);
            }}>
              <option value="">Select...</option>
              <option>Automotive</option>
              <option>Finance</option>
              <option>Healthcare</option>
              <option>Technology</option>
              <option>Retail</option>
              <option>Manufacturing</option>
              <option>Energy</option>
              <option>Education</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label>Time horizon</label>
            <select value={horizon} onChange={e => {
              store.setField('horizon', e.target.value);
              if (framingAnalysis) setIsModifiedSinceAnalysis(true);
            }}>
              <option value="">Select...</option>
              <option>6 months</option>
              <option>1 year</option>
              <option>3 years</option>
              <option>5+ years</option>
            </select>
          </div>
        </div>
        
        <label>Stakes</label>
        <div className="stakes-row">
          {['Low', 'Medium', 'High'].map(s => (
            <button 
              key={s}
              className={`stk-btn ${stake === s ? 'active' : ''}`}
              onClick={() => {
                store.setField('stake', s);
                if (framingAnalysis) setIsModifiedSinceAnalysis(true);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      
      <div className="brow" style={{ gap: '15px' }}>
        <button 
          className="btn btn-s" 
          onClick={() => handleFrameDecision(false)} 
          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <FileText size={16} /> {framingAnalysis ? 'Re-Analyze Framing' : 'Check Decision Framing'}
        </button>
        <button 
          className="btn btn-p" 
          onClick={handleGenerate} 
          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Sparkles size={16} className="icon-ai" /> Generate Strategic Options
        </button>
      </div>

      {framingAnalysis && (
        <div className="card fade-in" style={{ marginTop: '28px', border: '1px solid var(--ac)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="clabel" style={{ color: 'var(--ac)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} className="icon-ai" /> Pre-Flight Framing Evaluation
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px' }}>Strategic Problem Diagnostics</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--s2)', padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--b1)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>Framing Readiness</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: framingAnalysis.decisionReadinessScore >= 70 ? 'var(--success)' : 'var(--warning)' }}>
                  {framingAnalysis.decisionReadinessScore >= 70 ? 'High Clarity (Cleared)' : 'Needs Refinement'}
                </div>
              </div>
              <CircularProgress 
                value={framingAnalysis.decisionReadinessScore || 0} 
                color={framingAnalysis.decisionReadinessScore >= 70 ? 'var(--success)' : 'var(--warning)'} 
                size={65} 
                strokeWidth={6} 
              />
            </div>
          </div>

          {/* Score Improvement Notification */}
          {scoreDelta !== null && (
            <div className="fade-in" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: scoreDelta > 0 ? 'var(--badge-green-bg)' : 'var(--s2)',
              color: scoreDelta > 0 ? 'var(--badge-green-text)' : 'var(--t1)',
              border: `1px solid ${scoreDelta > 0 ? 'var(--badge-green-text)' : 'var(--b1)'}40`,
              marginBottom: '20px',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              <TrendingUp size={18} />
              <span>
                {scoreDelta > 0 
                  ? `Score improved from ${previousScore} → ${framingAnalysis.decisionReadinessScore} (+${scoreDelta} pts)! Your refinements strengthened the framing.`
                  : scoreDelta === 0 
                    ? `Score remained at ${framingAnalysis.decisionReadinessScore}. Add more specific constraints or data to cross the 70 pt benchmark.`
                    : `Score adjusted from ${previousScore} to ${framingAnalysis.decisionReadinessScore}. Review your latest changes.`
                }
              </span>
            </div>
          )}

          {/* Framing Modified Banner */}
          {isModifiedSinceAnalysis && (
            <div className="fade-in" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--ac)',
              color: 'var(--t1)',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 600 }}>
                <Edit3 size={16} style={{ color: 'var(--ac)' }} />
                <span>You edited the decision framing. Re-evaluate to see your updated score!</span>
              </div>
              <button 
                className="btn btn-gold" 
                onClick={() => handleFrameDecision(true)}
                style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Re-Evaluate Score
              </button>
            </div>
          )}

          {/* Point Range Benchmark Metric */}
          <BenchmarkMetric 
            score={framingAnalysis.decisionReadinessScore || 0}
            metricName="Decision Framing Readiness"
            benchmark={70}
            subtitle="Strategic Benchmark: Target 70+ points before generating options to minimize cognitive blindspots."
          />

          {/* How to Improve Your Score Guidance Block */}
          <div style={{
            background: 'var(--s2)',
            borderRadius: '10px',
            border: '1px solid var(--b1)',
            padding: '18px 20px',
            marginTop: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Lightbulb size={18} style={{ color: 'var(--ac)' }} />
              <strong style={{ fontSize: '0.95rem', color: 'var(--t1)' }}>How to Improve Your Readiness Score (Reach 70+ Benchmark):</strong>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--t2)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
              The AI evaluates clarity, boundary conditions, and evidentiary depth. Click <strong>"+ Address in Framing"</strong> on any diagnosis below to add targeted clarifications to your description, then re-evaluate to see your score rise.
            </p>

            {framingAnalysis.improvementSuggestions && framingAnalysis.improvementSuggestions.length > 0 && (
              <ul style={{ paddingLeft: '18px', margin: '0 0 14px 0', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem', color: 'var(--t1)' }}>
                {framingAnalysis.improvementSuggestions.map((sug, idx) => (
                  <li key={idx} style={{ lineHeight: 1.4 }}>{sug}</li>
                ))}
              </ul>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-s"
                onClick={() => {
                  if (descTextareaRef.current) {
                    descTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    descTextareaRef.current.focus();
                  }
                }}
                style={{ fontSize: '0.84rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={14} /> Edit Framing Description
              </button>
              <button 
                className="btn btn-gold"
                onClick={() => handleFrameDecision(true)}
                style={{ fontSize: '0.84rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Re-Evaluate Readiness Score
              </button>
            </div>
          </div>
          
          {/* Diagnostic Categories Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Hidden Assumptions */}
            <div style={{ background: 'var(--s2)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid var(--warning)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--warning)', marginBottom: '8px' }}>
                <Eye size={15} /> Hidden Assumptions:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(framingAnalysis.hiddenAssumptions || []).map((v, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', lineHeight: 1.35 }}>
                    <span>• {v}</span>
                    <button 
                      onClick={() => handleAddressGap(v, 'Assumption')}
                      title="Add to description to address"
                      style={{ background: 'transparent', border: '1px solid var(--b1)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.72rem', color: 'var(--ac)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      + Address
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Unknowns */}
            <div style={{ background: 'var(--s2)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid var(--error)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--error)', marginBottom: '8px' }}>
                <AlertTriangle size={15} /> Critical Unknowns:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(framingAnalysis.criticalUnknowns || []).map((v, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', lineHeight: 1.35 }}>
                    <span>• {v}</span>
                    <button 
                      onClick={() => handleAddressGap(v, 'Unknown Factor')}
                      title="Add to description to address"
                      style={{ background: 'transparent', border: '1px solid var(--b1)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.72rem', color: 'var(--ac)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      + Address
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Information Gaps */}
            <div style={{ background: 'var(--s2)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid var(--ac2)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--ac2)', marginBottom: '8px' }}>
                <HelpCircle size={15} /> Information Gaps:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(framingAnalysis.informationGaps || []).map((v, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', lineHeight: 1.35 }}>
                    <span>• {v}</span>
                    <button 
                      onClick={() => handleAddressGap(v, 'Data Gap')}
                      title="Add to description to address"
                      style={{ background: 'transparent', border: '1px solid var(--b1)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.72rem', color: 'var(--ac)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      + Address
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Boundary Constraints */}
            <div style={{ background: 'var(--s2)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid var(--ac)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--ac)', marginBottom: '8px' }}>
                <Target size={15} /> Boundary Constraints:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(framingAnalysis.missingConstraints || []).map((v, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', lineHeight: 1.35 }}>
                    <span>• {v}</span>
                    <button 
                      onClick={() => handleAddressGap(v, 'Constraint')}
                      title="Add to description to address"
                      style={{ background: 'transparent', border: '1px solid var(--b1)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.72rem', color: 'var(--ac)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      + Address
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--b1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ fontSize: '0.88rem', color: framingAnalysis.decisionReadinessScore >= 70 ? 'var(--success)' : 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {framingAnalysis.decisionReadinessScore >= 70 ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Readiness benchmark met ({framingAnalysis.decisionReadinessScore}/100). High confidence to generate options!</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} />
                  <span>Below 70 pt benchmark. You can refine description above or generate options anyway.</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-s" 
                onClick={() => handleFrameDecision(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Re-Evaluate Score
              </button>
              <button 
                className="btn btn-p" 
                onClick={handleGenerate}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={16} /> Generate Strategic Options <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
