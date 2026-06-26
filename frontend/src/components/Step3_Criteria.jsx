import { useMemo } from 'react'
import { useStore } from '../store'

export default function Step3_Criteria() {
  const store = useStore()
  const { criteria, evaluationStyle, setEvaluationStyle, setCriteriaWeight, setStep, setLoading, setError, token, title, desc, options, industry, stake, extractedData, framingAnalysis } = store

  const totalWeight = useMemo(() => {
    return Object.values(criteria).reduce((a, b) => a + b, 0)
  }, [criteria])

  const handleNext = async () => {
    if (totalWeight !== 100) return alert(`Weights must total 100%. Currently: ${totalWeight}%`)
    
    setLoading(true, "Running AI analysis...")
    try {
      let payloadContext = desc || "";
      if (extractedData) {
        payloadContext += `\n\n--- EXTRACTED DOCUMENT CONTEXT ---\n${JSON.stringify(extractedData)}`;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/evaluate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({ decision: title, options, criteria, industry, stakes: stake, context: payloadContext, framingAnalysis, documentInsights: extractedData })
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

  return (
    <>
      <h1>Criteria and weights</h1>
      <div className="hint">Adjust how much each factor matters. Must total 100%.</div>
      
      <div className="card">
        <div className="clabel">Evaluation Style</div>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
          {['Balanced', 'Growth Focused', 'Risk Averse', 'Fast Expansion', 'Custom'].map(style => (
            <label key={style} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.95rem', margin: 0 }}>
              <input 
                type="radio" 
                name="evaluationStyle" 
                checked={evaluationStyle === style} 
                onChange={() => setEvaluationStyle(style)} 
              />
              {style}
            </label>
          ))}
        </div>

        <div className="clabel" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
          Evaluation criteria {evaluationStyle !== 'Custom' ? <span style={{fontSize: '0.8rem', opacity: 0.7}}>(Auto-filled)</span> : ''}
        </div>
        <div id="critlist">
          {Object.entries(criteria).map(([name, weight]) => (
            <div className="critem" key={name}>
              <div className="crh">
                <span className="crname">{name}</span>
                <span className="crpct">{weight}%</span>
              </div>
              {evaluationStyle === 'Custom' && (
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={weight} 
                  onChange={(e) => setCriteriaWeight(name, parseInt(e.target.value))}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="wtot wok" style={{ marginTop: '15px' }}>
          <span>Weights balanced</span>
          <span>{totalWeight}%</span>
        </div>
      </div>
      
      <div className="brow">
        <button className="btn btn-g" onClick={() => setStep(2)}>Back</button>
        <button className="btn btn-p" onClick={handleNext}>Run analysis</button>
      </div>
    </>
  )
}
