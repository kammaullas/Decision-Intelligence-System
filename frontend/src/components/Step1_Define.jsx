import { useEffect, useRef } from 'react'
import { useStore } from '../store'

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

  useEffect(() => {
    if (mode === 'demo' && !title) {
      store.setField('title', DEMO_DATA.title)
      store.setField('desc', DEMO_DATA.desc)
      store.setField('industry', DEMO_DATA.industry)
      store.setField('horizon', DEMO_DATA.horizon)
      store.setField('stake', DEMO_DATA.stake)
    }
  }, [mode, title, store])

  const handleFrameDecision = async () => {
    if (!title) return store.setError("Enter a decision title.")
    if (!desc) return store.setError("Describe your decision.")

    store.setLoading(true, "Analyzing decision framing...")
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/frame-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': store.token
        },
        body: JSON.stringify({ decision: title, description: desc, industry, timeHorizon: horizon, stakes: stake })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      store.setFramingAnalysis(data)
    } catch (e) {
      store.setError(e.message)
    } finally {
      store.setLoading(false)
    }
  }

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

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/generate-options', {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/extract-document', {
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
    <>
      <h1>Define your decision</h1>
      <div className="hint">
        {mode === 'demo' && <span className="demo-tag" style={{display:'block', marginBottom:'8px'}}>EV Demo - Fields Pre-filled. Click Generate Options to begin.</span>}
        Describe what you are deciding so AI can generate strategic options.
      </div>
      
      <div className="card">
        <div className="clabel">Decision context</div>
        
        <div className="doc-upload" style={{ marginBottom: '15px', padding: '15px', border: '1px dashed var(--border)', borderRadius: '8px', background: 'var(--bg-card-hover)' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Upload Document (PDF/TXT) to Extract Context</label>
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
          onChange={e => store.setField('title', e.target.value)}
        />
        
        <label>Describe the decision</label>
        <textarea 
          placeholder="What are you deciding? Background, constraints, desired outcome..."
          value={desc}
          onChange={e => store.setField('desc', e.target.value)}
        />
        
        <div className="g2">
          <div>
            <label>Industry</label>
            <select value={industry} onChange={e => store.setField('industry', e.target.value)}>
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
            <select value={horizon} onChange={e => store.setField('horizon', e.target.value)}>
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
              onClick={() => store.setField('stake', s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      
      <div className="brow" style={{ gap: '15px' }}>
        <button className="btn btn-secondary" style={{ background: 'var(--bg-card)', color: 'var(--fg)', border: '1px solid var(--border)' }} onClick={handleFrameDecision}>Analyze framing</button>
        <button className="btn btn-p" onClick={handleGenerate}>Generate options</button>
      </div>

      {framingAnalysis && (
        <div className="card" style={{ marginTop: '20px', borderColor: framingAnalysis.decisionReadinessScore >= 80 ? 'var(--success)' : (framingAnalysis.decisionReadinessScore >= 60 ? 'var(--warning)' : 'var(--error)') }}>
          <div className="clabel" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Framing Analysis Feedback</span>
            <span style={{ fontWeight: 'bold' }}>Readiness Score: {framingAnalysis.decisionReadinessScore}/100</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.9rem', marginTop: '10px' }}>
            <div>
              <strong>Hidden Assumptions:</strong>
              <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                {(framingAnalysis.hiddenAssumptions || []).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
            <div>
              <strong>Critical Unknowns:</strong>
              <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                {(framingAnalysis.criticalUnknowns || []).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
            <div>
              <strong>Missing Constraints:</strong>
              <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                {(framingAnalysis.missingConstraints || []).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
            <div>
              <strong>Information Gaps:</strong>
              <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                {(framingAnalysis.informationGaps || []).map((v, i) => <li key={i}>{v}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
