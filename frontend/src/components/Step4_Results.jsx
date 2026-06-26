import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store'

export default function Step4_Results() {
  const store = useStore()
  const { title, result, criteria, resetApp, extractedData, framingAnalysis } = store
  const [activeTab, setActiveTab] = useState(0)
  
  // Simulation weights
  const [simWeights, setSimWeights] = useState({ ...criteria })

  useEffect(() => {
    setSimWeights({ ...criteria })
  }, [criteria])

  const simTotal = Object.values(simWeights).reduce((a, b) => a + b, 0)
  
  const resetSim = () => {
    setSimWeights({ ...criteria })
  }

  // Recalculate rankings based on sim weights
  const recalcedScores = useMemo(() => {
    if (!result || !result.scores) return []
    if (simTotal !== 100) return [] // wait until balanced
    
    const newScores = result.scores.map(s => {
      let ws = 0
      Object.keys(simWeights).forEach(k => {
        const sc = s.criteriaScores && s.criteriaScores[k] != null ? s.criteriaScores[k] : 0
        ws += sc * (simWeights[k] / 100)
      })
      return { ...s, weightedScore: ws }
    })
    
    newScores.sort((a, b) => b.weightedScore - a.weightedScore)
    newScores.forEach((s, i) => { s.rank = i + 1 })
    return newScores
  }, [result, simWeights, simTotal])

  if (!result || !result.scores) return null

  const displayScores = recalcedScores.length > 0 ? recalcedScores : [...result.scores].sort((a, b) => a.rank - b.rank)
  const maxScore = Math.max(...displayScores.map(s => s.weightedScore))
  const bestOption = displayScores[0]
  
  const origBestOption = result.insights && result.insights.bestOption ? result.insights.bestOption : result.scores.find(s => s.rank === 1)?.option
  const isChanged = recalcedScores.length > 0 && bestOption.option !== origBestOption

  const ckeys = Object.keys(criteria)

  const downloadReport = () => {
    window.print() // simplified for this migration
  }

  // --- Executive Decision Summary Calculations ---
  
  // 1. Readiness Score
  const hasReadiness = framingAnalysis && framingAnalysis.decisionReadinessScore !== undefined;
  const readinessScore = hasReadiness ? framingAnalysis.decisionReadinessScore : null;
  const readinessDisplay = hasReadiness ? readinessScore : 'N/A';
  const readinessText = hasReadiness 
    ? (readinessScore >= 80 ? "High Readiness" : readinessScore >= 50 ? "Moderate Readiness" : "Low Readiness")
    : "Not Analyzed";
  const readinessColor = hasReadiness
    ? (readinessScore >= 80 ? 'var(--success)' : readinessScore >= 50 ? 'var(--warning)' : 'var(--error)')
    : 'var(--t2)';
  
  // 2. Confidence Score
  let evidenceScore = 0;
  if (extractedData) {
    const categories = [
      'strategicOpportunities',
      'strategicRisks',
      'quantitativeMetrics',
      'marketTrends',
      'customerInsights',
      'competitiveIntelligence',
      'operationalConstraints',
      'decisionRelevantFacts'
    ];
    let categoriesPresent = 0;
    categories.forEach(cat => {
      if (extractedData[cat] && extractedData[cat].length > 0) {
        categoriesPresent++;
      }
    });
    evidenceScore = (categoriesPresent / 8) * 100;
  }
  
  let optionSeparationScore = 0;
  let gap = 0;
  if (displayScores.length > 1) {
    gap = displayScores[0].weightedScore - displayScores[1].weightedScore;
    optionSeparationScore = Math.min(100, Math.max(0, (gap / 1.5) * 100));
  } else {
    optionSeparationScore = 100;
    gap = 100; // arbitrary large gap
  }
  
  const rWeight = hasReadiness ? 0.35 : 0;
  const eWeight = hasReadiness ? 0.35 : 0.50; // adjust weights if no readiness
  const oWeight = hasReadiness ? 0.30 : 0.50;

  let baseConfidence = Math.round(
    ((hasReadiness ? readinessScore : 0) * rWeight) + 
    (evidenceScore * eWeight) + 
    (optionSeparationScore * oWeight)
  );

  let decisionAmbiguityPenalty = 0;
  if (displayScores.length > 1) {
    if (gap < 0.25) decisionAmbiguityPenalty = 20;
    else if (gap < 0.5) decisionAmbiguityPenalty = 10;
  }

  const confidence = Math.max(0, baseConfidence - decisionAmbiguityPenalty);
  
  const confColor = confidence >= 80 ? "var(--success)" : confidence >= 50 ? "var(--warning)" : "var(--error)";
  const confText = confidence >= 80 ? "High Confidence" : confidence >= 50 ? "Medium Confidence" : "Low Confidence";

  // 3. Top Risk
  const bestOptionRisks = result.risks?.find(r => r.option === bestOption.option);
  const topRiskText = bestOptionRisks?.topRisk?.description || "No major risks identified";

  // 4. Expected Outcome
  const eo = result.expectedOutcome;

  // 5. Why This Recommendation Won
  const whyWon = result.insights?.whyRecommendationWon || [];

  // 6. Recommended Next Action
  const recommendedNextAction = result.recommendedNextAction || "";

  return (
    <>
      <h1>Analysis results</h1>
      <div className="hint" style={{ marginBottom: '24px' }}>Evaluation complete.</div>
      
      {/* --- Executive Decision Summary --- */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.4rem' }}>Executive Decision Summary</h2>
        
        {/* Top Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Readiness</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              {readinessDisplay} {hasReadiness && <span style={{fontSize: '1rem', opacity: 0.5, fontWeight: 400}}>/ 100</span>}
            </div>
            <div style={{ fontSize: '0.9rem', color: readinessColor }}>
              {readinessText}
            </div>
          </div>
          
          <div style={{ padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Confidence</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{confidence}%</div>
            <div style={{ fontSize: '0.9rem', color: confColor }}>{confText}</div>
          </div>
          
          <div style={{ padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Top Risk</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.3, color: 'var(--error)' }}>{topRiskText}</div>
          </div>
        </div>
        
        {/* Middle Row */}
        <div style={{ padding: '20px', background: 'var(--p-dark)', color: 'white', borderRadius: '8px', marginBottom: whyWon.length > 0 ? '16px' : '24px' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Recommended Option</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--ac)' }}>{bestOption.option}</div>
          {isChanged && <div style={{ fontSize: '0.9rem', marginTop: '8px', opacity: 0.8 }}>(Updated via Simulation)</div>}
        </div>
        
        {/* Why This Recommendation Won */}
        {whyWon.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '0 8px' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px' }}>Why This Recommendation Won</div>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {whyWon.map((reason, idx) => (
                <li key={idx} style={{ fontSize: '0.95rem', lineHeight: 1.4 }}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Bottom Row: Expected Outcome */}
        {eo && (
          <div style={{ padding: '16px 20px', background: 'var(--bg-card-hover)', borderRadius: '8px', borderLeft: '4px solid var(--ac)', marginBottom: recommendedNextAction ? '24px' : '0' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Expected Outcome</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px' }}>{eo.summary}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', fontSize: '0.9rem' }}>
              <div><strong style={{ opacity: 0.7 }}>Growth:</strong> {eo.growthPotential}</div>
              <div><strong style={{ opacity: 0.7 }}>Risk:</strong> {eo.riskLevel}</div>
              <div><strong style={{ opacity: 0.7 }}>Time to Value:</strong> {eo.timeToValue}</div>
            </div>
          </div>
        )}

        {/* Recommended Next Action */}
        {recommendedNextAction && (
          <div style={{ padding: '20px', background: 'var(--p-dark)', color: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Recommended Next Action</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.4 }}>{recommendedNextAction}</div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem' }}>Detailed Analysis</h2>
        <div className="bestbox" style={{ marginTop: 0, border: 'none', background: 'var(--bg-card-hover)' }}>
          <div className="blbl">AI Reasoning</div>
          <div className="btxt">
            {isChanged 
              ? `With adjusted weights, ${bestOption.option} now ranks #1. Original: ${origBestOption}` 
              : (result.insights?.reasoning || "")}
          </div>
          {!isChanged && result.insights?.tradeoffs && (
            <div className="btxt" style={{marginTop:'12px', opacity: 0.8}}><strong>Trade-offs:</strong> {result.insights.tradeoffs}</div>
          )}
        </div>
      </div>
      
      <div className="rgrid">
        <div>
          <div className="clabel">Rankings</div>
          <div id="ranklist">
            {displayScores.map((s, i) => {
              const rkc = ["rk1", "rk2", "rk3", "", "", ""][i] || ""
              return (
                <div className={`ritem ${rkc}`} key={i}>
                  <div className="rmed">#{i + 1}</div>
                  <div className="rnm">{s.option}</div>
                  <div className="rsc">{parseFloat(s.weightedScore).toFixed(1)}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="chcard">
          <div className="chtit">Weighted scores</div>
          <div id="barchart">
            {displayScores.map((s, i) => (
              <div className="barrow" key={i}>
                <div className="barlbl">{s.option}</div>
                <div className="bartr">
                  <div className={`barfill ${i === 0 ? 'top' : ''}`} style={{ width: `${(s.weightedScore / maxScore) * 100}%` }}></div>
                </div>
                <div className="barval">{parseFloat(s.weightedScore).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="card" style={{overflow:'auto', padding:'20px 24px'}}>
        <div className="clabel">Full scorecard</div>
        <table className="stbl">
          <thead>
            <tr>
              <th>Option</th>
              {ckeys.map(c => <th key={c}>{c}</th>)}
              <th>Score</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {displayScores.map((s, i) => (
              <tr key={i}>
                <td style={{color:'var(--t1)', fontWeight:500}}>{s.option}</td>
                {ckeys.map(c => {
                  const sc = s.criteriaScores && s.criteriaScores[c] != null ? s.criteriaScores[c] : "-"
                  const cls = sc >= 8 ? "bhi" : (sc >= 5 ? "bmi" : "blo")
                  return <td key={c}><span className={`badge ${cls}`}>{sc}</span></td>
                })}
                <td style={{color:'var(--ac)', fontWeight:700}}>{parseFloat(s.weightedScore).toFixed(1)}</td>
                <td>{s.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* SCENARIO SIMULATION */}
      <div className="sim-panel">
        <div className="sim-header">
          <div>
            <div className="sim-title">Scenario Simulation</div>
            <div className="sim-note">Drag sliders to change weights - rankings update instantly</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <div className="sim-badge">Total: {simTotal}%</div>
            <button className="sim-reset" onClick={resetSim}>Reset</button>
          </div>
        </div>
        <div className="sim-grid">
          {Object.entries(simWeights).map(([n, v]) => (
            <div className="sim-item" key={n}>
              <div className="sim-name">{n}</div>
              <div className="sim-row">
                <input 
                  type="range" 
                  className="sim-slider" 
                  min="0" max="100" 
                  value={v} 
                  onChange={(e) => setSimWeights({...simWeights, [n]: parseInt(e.target.value)})}
                />
                <div className="sim-val">{v}%</div>
              </div>
            </div>
          ))}
        </div>
        <div className={`sim-wtot ${simTotal === 100 ? 'wok' : (simTotal < 100 ? 'wwarn' : 'werr')}`}>
          <span>
            {simTotal === 100 ? "Weights balanced - rankings are live" :
             simTotal < 100 ? `Need ${100 - simTotal}% more to rebalance` :
             `Over by ${simTotal - 100}% - reduce some weights`}
          </span>
          <span>{simTotal}%</span>
        </div>
      </div>
      
      <div className="tabs">
        <div className="tabnav">
          {['Risks', 'Missing info', 'Bias alerts', 'Recommendation', 'Next steps'].map((tab, i) => (
            <button 
              key={i} 
              className={`tabbt ${activeTab === i ? 'on' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className={`tabpn ${activeTab === 0 ? 'on' : ''}`}>
          {(result.risks || []).map((rk, i) => (
            <div className="rcard" key={i}>
              <h4>{rk.option}</h4>
              <div className="pills">
                {(rk.risks || []).map((r, j) => <span className="pill" key={j}>{r}</span>)}
              </div>
              {rk.worstCase && <div className="rmeta"><strong>Worst case:</strong> {rk.worstCase}</div>}
              {rk.mitigation && <div className="rmeta"><strong>Mitigation:</strong> {rk.mitigation}</div>}
            </div>
          ))}
        </div>
        
        <div className={`tabpn ${activeTab === 1 ? 'on' : ''}`}>
          <ul className="ilist">
            {(result.missingInfo || []).map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
        
        <div className={`tabpn ${activeTab === 2 ? 'on' : ''}`}>
          <table className="btbl">
            <thead>
              <tr><th>Bias</th><th>Description</th><th>Impact</th></tr>
            </thead>
            <tbody>
              {(result.biases || []).map((b, i) => (
                <tr key={i}><td>{b.bias}</td><td>{b.description}</td><td>{b.impact}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={`tabpn ${activeTab === 3 ? 'on' : ''}`}>
          <div className="recbox">{result.recommendation}</div>
        </div>
        
        <div className={`tabpn ${activeTab === 4 ? 'on' : ''}`}>
          <ol className="nslist">
            {(result.nextSteps || []).map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      </div>
      
      <div className="brow">
        <button className="btn btn-g" onClick={() => resetApp()}>Start over</button>
        <button className="btn btn-gold" onClick={downloadReport}>Download report</button>
      </div>
    </>
  )
}
