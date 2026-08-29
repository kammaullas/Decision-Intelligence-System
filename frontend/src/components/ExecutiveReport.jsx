import { forwardRef } from 'react';
import './ExecutiveReport.css';
import { useStore } from '../store';

const ExecutiveReport = forwardRef(({ displayScores, bestOption, readinessDisplay, readinessColor, confidence, confColor, eo, whyWon }, ref) => {
  const store = useStore();
  const { title, desc, result, criteria, framingAnalysis, executiveJudgment } = store;

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const ckeys = Object.keys(criteria || {});

  if (!result || !result.scores) return null;

  const participantName = store.participantName || "Executive";
  const problemStatement = desc || "No description provided.";
  const assumptions = framingAnalysis?.hiddenAssumptions || [];
  
  return (
    <div ref={ref} className="executive-report-container" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      
      {/* PAGE 1: CONTEXT & RECOMMENDATION */}
      <div className="report-page">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #eaeaec', paddingBottom: '20px' }}>
          <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem', margin: '0 0 10px 0', color: '#111418' }}>
            Decision Intelligence Report
          </h1>
          <div style={{ fontSize: '1rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Decision Intelligence Assistant (DIA)<br/>
            Your Executive Decision Companion
          </div>
        </div>

        {/* 1. Decision Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', background: '#f8fafc', padding: '15px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>1. Decision Summary</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{title || 'Untitled Decision'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Prepared By</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{participantName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Date</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{dateStr}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Readiness</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: readinessColor }}>{readinessDisplay}</div>
          </div>
        </div>

        {/* 2. Decision Context */}
        <h2 className="subsection-title">2. Decision Context</h2>
        <p className="body-text" style={{ marginBottom: '30px' }}>{problemStatement}</p>

        {/* 6. Recommendation & 7. Confidence */}
        <h2 className="subsection-title">6. Recommendation & 7. Confidence</h2>
        <div className="recommendation-block" style={{ marginBottom: '30px', padding: '20px', background: '#0f172a', color: 'white', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{bestOption.option}</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{confidence}% Confidence</span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
             {whyWon && whyWon.length > 0 ? whyWon.join(' | ') : result.insights?.reasoning || ''}
          </div>
        </div>

        {/* 10. Executive Judgment */}
        {executiveJudgment?.disagrees && (
          <div style={{ marginBottom: '30px', padding: '15px', background: '#fff0f0', borderLeft: '4px solid #ef4444' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#ef4444', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>10. Executive Judgment Override</h4>
            <div style={{ fontSize: '0.95rem', color: '#111418' }}>The executive formally disagreed based on: <strong>{executiveJudgment.reason}</strong></div>
            {executiveJudgment.explanation && <div style={{ fontStyle: 'italic', marginTop: '5px', fontSize: '0.9rem', color: '#333' }}>"{executiveJudgment.explanation}"</div>}
          </div>
        )}

        {/* 3, 4, 5. Options & Criteria */}
        <h2 className="subsection-title">3. Options Evaluated, 4. Criteria & 5. Scores</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Rank</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Option</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Total</th>
              {ckeys.map(c => <th key={c} style={{ padding: '8px', textAlign: 'center' }}>{c} <br/><span style={{fontWeight:'normal', fontSize:'0.7rem'}}>({criteria[c]}%)</span></th>)}
            </tr>
          </thead>
          <tbody>
            {displayScores.map((s, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>#{i+1}</td>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>{s.option}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' }}>{parseFloat(s.weightedScore).toFixed(1)}</td>
                {ckeys.map(c => (
                  <td key={c} style={{ padding: '8px', textAlign: 'center' }}>
                    {s.criteriaScores?.[c] || 0}/10
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="page-footer">
          <span>Decision Intelligence Assistant (DIA)</span>
          <span>Page 1</span>
        </div>
      </div>

      {/* PAGE 2: RISKS, IMPLEMENTATION, REFLECTION */}
      <div className="report-page">
        
        {/* Header (condensed for p2) */}
        <div style={{ textAlign: 'right', marginBottom: '30px', borderBottom: '2px solid #eaeaec', paddingBottom: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Decision Intelligence Report - Continued
          </div>
        </div>

        {/* 8. Top Risks & 9. Critical Assumptions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div>
            <h2 className="subsection-title">8. Top Risks</h2>
            {result.risks && result.risks.length > 0 ? result.risks.map((rk, i) => (
              <div key={i} style={{ marginBottom: '15px', padding: '10px', background: '#fef3c7', borderLeft: '3px solid #b45309' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{rk.topRisk?.description || rk.risks?.[0]}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>Mitigation: {rk.mitigation}</div>
              </div>
            )) : <div className="empty-state">No significant risks identified.</div>}
          </div>
          <div>
            <h2 className="subsection-title">9. Critical Assumptions</h2>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: '#334155' }}>
              {assumptions.map((a, i) => <li key={i} style={{ marginBottom: '8px' }}>{a}</li>)}
              {assumptions.length === 0 && <li style={{ color: '#64748b' }}>No critical assumptions recorded.</li>}
            </ul>
          </div>
        </div>

        {/* 11. Personalized Executive Coaching */}
        <h2 className="subsection-title">11. Personalized Executive Coaching</h2>
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
          {result.coaching && result.coaching.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: '#111418' }}>
              {result.coaching.map((point, i) => <li key={i} style={{ marginBottom: '10px' }}>{point}</li>)}
            </ul>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#64748b' }}>No personalized coaching available for this decision.</div>
          )}
        </div>

        {/* 12. Implementation Priorities */}
        <h2 className="subsection-title">12. Implementation Priorities</h2>
        <div style={{ marginBottom: '30px' }}>
          {result.nextSteps && result.nextSteps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.nextSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '1.2rem' }}>0{i+1}</div>
                  <div style={{ fontSize: '0.95rem', color: '#334155' }}>{step}</div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No implementation priorities provided.</div>}
        </div>

        {/* 13. Reflection Questions */}
        <h2 className="subsection-title">13. Reflection Questions</h2>
        <div style={{ background: '#fafbfc', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '15px' }}>Use this space to physically document reflections post-decision:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', fontSize: '0.85rem', color: '#94a3b8' }}>What is your biggest concern?</div>
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', fontSize: '0.85rem', color: '#94a3b8' }}>What specific outcome do you expect?</div>
          </div>
        </div>

        <div className="page-footer">
          <span>Decision Intelligence Assistant (DIA)</span>
          <span>Page 2</span>
        </div>
      </div>

    </div>
  );
});

export default ExecutiveReport;
