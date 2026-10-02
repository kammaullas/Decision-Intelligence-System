import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { CheckCircle, Download, RotateCcw, FileText, ChevronRight, RefreshCw, ArrowRight, BrainCircuit, Save, AlertTriangle, Shield } from 'lucide-react'
import CircularProgress from './CircularProgress'
import BenchmarkMetric from './BenchmarkMetric'

export default function Step4_Results() {
  const navigate = useNavigate()
  const store = useStore()
  const { title, result, criteria, resetApp, extractedData, framingAnalysis, token, setExecutiveJudgment } = store
  const [activeTab, setActiveTab] = useState(0)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfStatusMessage, setPdfStatusMessage] = useState('')
  
  // Judgment State
  const [isJudgmentConfirmed, setIsJudgmentConfirmed] = useState(false)
  const [disagrees, setDisagrees] = useState(null)
  const [judgmentReason, setJudgmentReason] = useState('Experience')
  const [judgmentExplanation, setJudgmentExplanation] = useState('')
  const [isSubmittingJudgment, setIsSubmittingJudgment] = useState(false)
  const [judgmentError, setJudgmentError] = useState('')

  // Reflection State
  const [isReflectionVisible, setIsReflectionVisible] = useState(false);
  const [reflectionDecisionTaken, setReflectionDecisionTaken] = useState('Yes');
  const [reflectionConfidence, setReflectionConfidence] = useState(80);
  const [reflectionBiggestConcern, setReflectionBiggestConcern] = useState('');
  const [reflectionExpectedOutcome, setReflectionExpectedOutcome] = useState('');
  const [reflectionAssumptions, setReflectionAssumptions] = useState([]);
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState('');

  const handleStartOver = () => {
    resetApp();
    navigate('/new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalize = () => {
    setIsReflectionVisible(true);
    setTimeout(() => {
      const el = document.getElementById('reflection-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const submitReflection = async () => {
    setIsSubmittingReflection(true);
    setReflectionError('');
    const payload = {
      decisionTaken: reflectionDecisionTaken,
      confidence: reflectionConfidence,
      biggestConcern: reflectionBiggestConcern,
      expectedOutcome: reflectionExpectedOutcome,
      assumptionsConcerned: reflectionAssumptions
    };
    
    try {
      const decisionId = result?._id || 'latest';
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/decisions/${decisionId}/reflection`, { 
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Reflection sync notice:", e);
    } finally {
      store.setDecisionReflection(payload);
      if (store.fetchHistory) {
        store.fetchHistory().catch(() => {});
      }
      resetApp();
      setIsSubmittingReflection(false);
      navigate('/dashboard');
    }
  };

  const submitJudgment = async () => {
    if (disagrees === null) {
      setJudgmentError('Please indicate whether you disagree with the recommendation.');
      return;
    }
    setIsSubmittingJudgment(true);
    setJudgmentError('');
    const payload = { disagrees, reason: disagrees ? judgmentReason : null, explanation: disagrees ? judgmentExplanation : "" };

    const decisionId = result?._id || 'latest';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/decisions/${decisionId}/judgment`, { 
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
        body: JSON.stringify(payload)
      });
      await res.json().catch(() => ({}));
    } catch (e) {
      console.warn("Judgment sync notice:", e);
    } finally {
      setExecutiveJudgment(payload);
      setIsJudgmentConfirmed(true);
      setIsSubmittingJudgment(false);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };
  
  // Simulation weights
  const [simWeights, setSimWeights] = useState({ ...criteria })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const downloadReport = async () => {
    setIsGeneratingPDF(true);
    setPdfStatusMessage('Preparing Executive Report...');
    const safeTitle = (title || 'Decision_Analysis').replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
    
    try {
      const decisionId = result?._id || 'latest';
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/decisions/${decisionId}/report?token=${token}`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        },
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error(`Report service returned ${res.status}`);
      }
      
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Decision_Report_${safeTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const htmlText = await res.text();
        const blob = new Blob([htmlText], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Decision_Report_${safeTitle}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        try {
          const printWindow = window.open(url, '_blank');
          if (printWindow) {
            setTimeout(() => {
              try { printWindow.print(); } catch (_) {}
            }, 600);
          }
        } catch (_) {}
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      }
      
      setPdfStatusMessage('Report ready');
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfStatusMessage('');
      }, 2500);
    } catch (error) {
      console.warn("Direct report download notice, opening local print view:", error);
      window.print();
      setPdfStatusMessage('Print dialog opened');
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPdfStatusMessage('');
      }, 2500);
    }
  }

  // --- Executive Decision Summary Calculations ---
  
  // 1. Readiness Score
  const hasReadiness = framingAnalysis && framingAnalysis.decisionReadinessScore !== undefined;
  const readinessScore = hasReadiness ? framingAnalysis.decisionReadinessScore : null;
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
    optionSeparationScore = Math.min((gap / (maxScore || 1)) * 100, 100);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }} className="fade-in">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            {isJudgmentConfirmed ? (
              <><CheckCircle size={28} style={{ color: 'var(--ac)' }} /> Decision Evaluation</>
            ) : (
              'Analysis results'
            )}
          </h1>
          <div className="hint" style={{ margin: '4px 0 0 0' }}>
            {isJudgmentConfirmed 
              ? 'Executive judgment confirmed. Board report and action items finalized.' 
              : 'Evaluation complete. Review the scorecard and record your executive judgment below.'}
          </div>
        </div>

        {isJudgmentConfirmed && !isReflectionVisible && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-g" onClick={handleStartOver} disabled={isGeneratingPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={16} /> Start over
            </button>
            <button className="btn btn-gold" onClick={downloadReport} disabled={isGeneratingPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={16} /> {isGeneratingPDF ? (pdfStatusMessage || 'Generating...') : 'Download report'}
            </button>
            <button className="btn btn-gold" onClick={handleFinalize} disabled={isGeneratingPDF} style={{ background: 'var(--ac)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowRight size={16} /> Finalize Decision
            </button>
          </div>
        )}
      </div>
      
      {/* --- Executive Decision Summary --- */}
      <div className="card fade-in" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--border)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.4rem' }}>Executive Decision Summary</h2>
        
        {/* Circular score gauges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {hasReadiness && (
            <CircularProgress 
              value={readinessScore} 
              color={readinessColor} 
              size={110} 
              strokeWidth={9}
              label={readinessText} 
            />
          )}
          <CircularProgress 
            value={confidence} 
            color={confColor} 
            size={110} 
            strokeWidth={9}
            label={confText} 
          />
        </div>

        {/* Point Range Benchmark Metric */}
        <BenchmarkMetric 
          score={hasReadiness ? readinessScore : confidence} 
          metricName={hasReadiness ? "Strategic Decision Readiness" : "Executive Confidence"} 
          benchmark={70} 
          subtitle="Point Range Analysis: Evaluates evidentiary depth and option separation against the 70 pt benchmark."
        />

        {/* Top Risk */}
        <div className="fade-in" style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.15)', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertTriangle size={18} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--error)', marginBottom: '4px' }}>Top Risk</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4, color: 'var(--t1)' }}>{topRiskText}</div>
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
          {['Risks', 'Missing info', 'Bias alerts', 'Recommendation', 'Next steps', 'Executive Coaching'].map((tab, i) => (
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
          <div className="print-only">Risks</div>
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
          <div className="print-only">Missing Information</div>
          <ul className="ilist">
            {(result.missingInfo || []).map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
        
        <div className={`tabpn ${activeTab === 2 ? 'on' : ''}`}>
          <div className="print-only">Bias Alerts</div>
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
          <div className="print-only">Recommendation</div>
          <div className="recbox">{result.recommendation}</div>
        </div>
        
        <div className={`tabpn ${activeTab === 4 ? 'on' : ''}`}>
          <div className="print-only">Next Steps</div>
          <ol className="nslist">
            {(result.nextSteps || []).map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>

        <div className={`tabpn ${activeTab === 5 ? 'on' : ''}`}>
          <div className="print-only">Executive Coaching</div>
          {result.coaching && result.coaching.length > 0 ? (
            <ul className="ilist" style={{ borderLeft: '4px solid var(--ac)', paddingLeft: '20px', background: 'var(--bg-card-hover)', padding: '20px 20px 20px 40px', borderRadius: '8px' }}>
              {result.coaching.map((point, i) => (
                <li key={i} style={{ marginBottom: '12px', fontSize: '1rem', lineHeight: '1.5' }}>{point}</li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: '20px', fontStyle: 'italic', opacity: 0.7 }}>
              No personalized coaching points available for this decision.
            </div>
          )}
        </div>
      </div>
      
      {!isJudgmentConfirmed && (
        <div className="card" style={{ marginBottom: '32px', border: '1px solid var(--ac)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', color: 'var(--ac)' }}>Executive Judgment Check</h2>
          <div style={{ marginBottom: '20px', fontSize: '1.05rem' }}>Does your instinct disagree with this recommendation?</div>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <button 
              className={`btn ${disagrees === true ? 'btn-gold' : 'btn-g'}`} 
              onClick={() => setDisagrees(true)}
            >
              YES
            </button>
            <button 
              className={`btn ${disagrees === false ? 'btn-gold' : 'btn-g'}`} 
              onClick={() => { setDisagrees(false); setJudgmentReason('Experience'); setJudgmentExplanation(''); }}
            >
              NO
            </button>
          </div>

          {disagrees === true && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label className="clabel" style={{ marginBottom: '8px', display: 'block' }}>Why?</label>
                <select className="inp" value={judgmentReason} onChange={e => setJudgmentReason(e.target.value)}>
                  <option value="Experience">Experience</option>
                  <option value="Political reality">Political reality</option>
                  <option value="Market intuition">Market intuition</option>
                  <option value="Ethics">Ethics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="clabel" style={{ marginBottom: '8px', display: 'block' }}>Explanation (Optional)</label>
                <textarea 
                  className="inp" 
                  rows="3" 
                  placeholder="Elaborate on your judgment..."
                  value={judgmentExplanation}
                  onChange={e => setJudgmentExplanation(e.target.value)}
                />
              </div>
            </div>
          )}

          {judgmentError && <div className="err" style={{ marginTop: '16px' }}>{judgmentError}</div>}
          
          <div style={{ marginTop: '24px' }}>
            <button 
              className="btn btn-gold" 
              onClick={submitJudgment} 
              disabled={isSubmittingJudgment || disagrees === null}
            >
              {isSubmittingJudgment ? 'Saving...' : 'Confirm & View Final Report'}
            </button>
          </div>
        </div>
      )}

      {isJudgmentConfirmed && !isReflectionVisible && (
        <div className="card fade-in" style={{ marginBottom: '32px', border: '1px solid var(--ac)', background: 'var(--s2)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ac)', fontWeight: 700, fontSize: '1.15rem' }}>
                <CheckCircle size={22} /> Executive Judgment Recorded
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--t1)', marginTop: '6px' }}>
                {disagrees 
                  ? <span>Override Reason: <strong>{judgmentReason}</strong> {judgmentExplanation ? ` · "${judgmentExplanation}"` : ''}</span>
                  : <span>Aligned with AI Recommendation: <strong>{bestOption.option}</strong></span>}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--t3)', marginTop: '4px' }}>
                Your decision has been logged to your organizational memory and Decision DNA profile.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-g" onClick={handleStartOver} disabled={isGeneratingPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={16} /> Start over
              </button>
              <button className="btn btn-gold" onClick={downloadReport} disabled={isGeneratingPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={16} /> {isGeneratingPDF ? (pdfStatusMessage || 'Generating...') : 'Download report'}
              </button>
              <button className="btn btn-gold" onClick={handleFinalize} disabled={isGeneratingPDF} style={{ background: 'var(--ac)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowRight size={16} /> Finalize Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {isReflectionVisible && (
        <div id="reflection-section" className="card fade-in" style={{ marginBottom: '32px', border: '1px solid var(--ac)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: 'var(--ac)', display: 'flex', alignItems: 'center', gap: '8px' }}><BrainCircuit size={20} className="icon-ai" /> Decision Reflection</h2>
          <p style={{ marginBottom: '24px', opacity: 0.8 }}>Before you finalize, capture your mindset for future outcome tracking.</p>

          <div style={{ marginBottom: '16px' }}>
            <label className="clabel" style={{ display: 'block', marginBottom: '8px' }}>Decision Taken?</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              {['Yes', 'No', 'Modified'].map(opt => (
                <button 
                  key={opt}
                  className={`btn ${reflectionDecisionTaken === opt ? 'btn-gold' : 'btn-g'}`} 
                  onClick={() => setReflectionDecisionTaken(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="clabel" style={{ display: 'block', marginBottom: '8px' }}>Confidence: {reflectionConfidence}%</label>
            <input 
              type="range" 
              min="0" max="100" 
              value={reflectionConfidence} 
              onChange={e => setReflectionConfidence(Number(e.target.value))} 
              style={{ width: '100%', maxWidth: '300px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="clabel" style={{ display: 'block', marginBottom: '8px' }}>Biggest Concern</label>
            <textarea 
              className="inp" rows="2" 
              placeholder="What are you most worried about?" 
              value={reflectionBiggestConcern}
              onChange={e => setReflectionBiggestConcern(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="clabel" style={{ display: 'block', marginBottom: '8px' }}>Expected Outcome</label>
            <textarea 
              className="inp" rows="2" 
              placeholder="What specific outcome do you expect?" 
              value={reflectionExpectedOutcome}
              onChange={e => setReflectionExpectedOutcome(e.target.value)}
            />
          </div>

          {framingAnalysis?.hiddenAssumptions && framingAnalysis.hiddenAssumptions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label className="clabel" style={{ display: 'block', marginBottom: '8px' }}>Which assumptions are you most concerned about?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {framingAnalysis.hiddenAssumptions.map((assump, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={reflectionAssumptions.includes(assump)}
                      onChange={e => {
                        if (e.target.checked) setReflectionAssumptions([...reflectionAssumptions, assump]);
                        else setReflectionAssumptions(reflectionAssumptions.filter(a => a !== assump));
                      }}
                      style={{ marginTop: '4px' }}
                    />
                    <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{assump}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {reflectionError && <div className="err" style={{ marginTop: '16px' }}>{reflectionError}</div>}
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '15px' }}>
            <button className="btn btn-g" onClick={() => setIsReflectionVisible(false)} disabled={isSubmittingReflection}>Back</button>
            <button className="btn btn-gold" onClick={submitReflection} disabled={isSubmittingReflection} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /> {isSubmittingReflection ? 'Saving...' : 'Save & Exit'}
            </button>
          </div>
        </div>
      )}


    </>
  )
}
