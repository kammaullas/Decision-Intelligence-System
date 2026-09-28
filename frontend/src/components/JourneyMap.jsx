import React from 'react';
import { Map, ArrowRight, CheckCircle2, Play, Info, Fingerprint, Lightbulb, History, Compass, BarChart3, BookOpen } from 'lucide-react';
import '../index.css';

const stepsData = [
  {
    step: 1,
    title: 'Define Context',
    why: 'Ground the AI in your specific business reality and constraints.',
    did: 'Started a new decision process.',
    actions: [
      'Enter a descriptive title for the decision.',
      'Detail the background and context.',
      'Set the industry, timeframe, and stakes.',
      'Optionally upload a document (PDF/TXT) for AI extraction.'
    ],
    next: 'Add available options.'
  },
  {
    step: 2,
    title: 'Options',
    why: 'Explore available paths and potential alternatives.',
    did: 'Defined the decision context and stakes.',
    actions: [
      'Brainstorm and enter 2 to 5 feasible options.',
      'Ensure options are distinct and actionable.',
      'Remove or edit any that overlap.'
    ],
    next: 'Set evaluation criteria.'
  },
  {
    step: 3,
    title: 'Criteria',
    why: 'Establish a fair, objective baseline to evaluate your options.',
    did: 'Listed the available options.',
    actions: [
      'Select a preset evaluation style (e.g. Balanced, Growth).',
      'Manually adjust the exact weights of criteria using the sliders.',
      'Ensure weights add up to 100%.'
    ],
    next: 'Analyze and get results.'
  },
  {
    step: 4,
    title: 'Results & Finalize',
    why: 'Synthesize all inputs into a coherent, actionable recommendation.',
    did: 'Weighted the evaluation criteria.',
    actions: [
      'Scenario Simulation: Drag the weights to see how rankings change live.',
      'Review Deep Analysis: Check the tabs for risks, bias alerts, and missing info.',
      'Executive Judgment: Agree or disagree with the AI\'s recommendation.',
      'Decision Reflection: Capture your mindset and confidence.',
      'Finalize & Download: Save the decision and download the executive PDF report.'
    ],
    next: null // No "next step" in the wizard — we show the features guide instead
  }
];

const postDecisionFeatures = [
  {
    icon: Fingerprint,
    title: 'Decision DNA',
    path: '/dna',
    color: 'var(--ac)',
    desc: 'Your personal decision-making fingerprint. It analyzes patterns across all your past decisions to reveal hidden biases, tendencies, and strengths.',
    whatYouGet: [
      'Bias profile showing your most frequent cognitive biases',
      'Decision style breakdown (risk-averse vs. risk-seeking, etc.)',
      'Personalized coaching advice to improve future decisions'
    ]
  },
  {
    icon: Lightbulb,
    title: 'Organizational Insights',
    path: '/insights',
    color: 'var(--ac2)',
    desc: 'Aggregated intelligence derived from all decisions made across your organization. Spot trends, recurring risks, and strategic patterns.',
    whatYouGet: [
      'Common risk categories and how often they appear',
      'Most-used criteria and evaluation patterns',
      'Industry and time-horizon distribution of decisions'
    ]
  },
  {
    icon: History,
    title: 'Decision History',
    path: '/history',
    color: 'var(--success)',
    desc: 'A timeline of every finalized decision. Revisit past analyses, download reports, and track outcomes over time.',
    whatYouGet: [
      'Full decision details with scores, risks, and recommendations',
      'Download executive PDF reports for any past decision',
      'Track real-world outcomes against your original predictions'
    ]
  }
];

const JourneyMap = ({ onClose, currentStep }) => {
  const currentStepData = stepsData.find((s) => s.step === currentStep) || stepsData[0];
  const isLastStep = currentStep === 4;

  return (
    <div className="journey-overlay fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="journey-modal">
        <div className="jm-header">
          <Map size={24} color="var(--ac)" className="icon-live" />
          <h2>Decision Journey Map</h2>
          <button 
            onClick={onClose} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '18px', padding: '4px 8px', lineHeight: 1 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="jm-body">
          {/* Timeline */}
          <div className="jm-timeline">
            {stepsData.map((s, idx) => {
              const isActive = s.step === currentStep;
              const isPast = s.step < currentStep;
              
              return (
                <div key={s.step} className={`jm-node ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
                  <div className="jm-icon">
                    {isPast ? <CheckCircle2 size={16} /> : isActive ? <Play size={14} fill="currentColor" /> : <span>{s.step}</span>}
                  </div>
                  <div className="jm-label">{s.title}</div>
                  {idx < stepsData.length - 1 && <div className="jm-line"></div>}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div className="jm-content">
            {/* What you did */}
            <div className="jm-box jm-did">
              <div className="jm-box-label">✓ What you completed</div>
              <div className="jm-box-text">{currentStepData.did}</div>
            </div>
            
            {/* Current step */}
            <div className="jm-box jm-here">
              <div className="jm-box-label" style={{ color: 'var(--ac)' }}>
                ● You are here — Step {currentStep}: {currentStepData.title}
              </div>
              <div className="jm-why">
                <Info size={14} />
                <span><strong>Why this matters:</strong> {currentStepData.why}</span>
              </div>
              <div className="jm-actions" style={{ marginTop: '16px' }}>
                <div className="jm-box-label" style={{ color: 'var(--ac)', marginBottom: '8px' }}>What to do here:</div>
                <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentStepData.actions?.map((action, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--t1)' }}>
                      <CheckCircle2 size={14} style={{ color: 'var(--ac2)', marginTop: '2px', flexShrink: 0 }} />
                      <span dangerouslySetInnerHTML={{ __html: action.replace(/^([^:]+):/, '<strong>$1:</strong>') }} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Next step (steps 1-3) */}
            {!isLastStep && (
              <div className="jm-box jm-next">
                <div className="jm-box-label">→ Next Step</div>
                <div className="jm-box-text">{currentStepData.next}</div>
              </div>
            )}

            {/* Post-decision features guide (step 4 only) */}
            {isLastStep && (
              <div className="jm-box" style={{ background: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                <div className="jm-box-label" style={{ color: 'var(--ac2)', marginBottom: '12px', fontSize: '12px' }}>
                  🚀 After You Finalize — Features to Explore
                </div>
                <div style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Once you save your decision, these features unlock on the dashboard. They use your decision data to help you grow as a leader.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {postDecisionFeatures.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <div key={idx} style={{ background: 'var(--bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--b1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Icon size={18} style={{ color: feature.color }} className="icon-pulse" />
                          <div style={{ fontSize: '14px', fontWeight: 700, color: feature.color }}>{feature.title}</div>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--t2)', lineHeight: 1.5, marginBottom: '10px' }}>
                          {feature.desc}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '6px' }}>
                          What you'll find:
                        </div>
                        <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {feature.whatYouGet.map((item, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: 'var(--t1)' }}>
                              <span style={{ color: feature.color, flexShrink: 0, marginTop: '1px' }}>•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="jm-footer">
          <button className="btn btn-p" onClick={onClose} style={{ width: '100%', justifyContent: 'center', fontSize: '15px' }}>
            {isLastStep ? 'Got it — Let\'s Finalize' : `Continue to Step ${currentStep}`} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JourneyMap;
