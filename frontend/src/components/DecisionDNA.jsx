import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Fingerprint, User, Briefcase, Building2, Layers, Compass, Award, AlertTriangle, Lightbulb, Bell, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react'
import CircularProgress from './CircularProgress'

const TraitScoreMeter = ({ label, score, description, color = 'var(--ac)' }) => {
  const percentage = Math.round((score / 10) * 100);
  const level = score >= 8 ? 'Dominant' : score >= 6 ? 'Balanced' : 'Emerging';
  const levelColor = score >= 8 ? 'var(--success)' : score >= 6 ? 'var(--ac2)' : 'var(--warning)';

  return (
    <div style={{ marginBottom: '20px', background: 'var(--s2)', padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--b1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.96rem' }}>{label}</span>
          <span style={{ 
            fontSize: '0.72rem', 
            fontWeight: 700, 
            padding: '2px 8px', 
            borderRadius: '10px', 
            background: `${levelColor}20`, 
            color: levelColor, 
            textTransform: 'uppercase',
            letterSpacing: '0.5px' 
          }}>
            {level}
          </span>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.05rem', color }}>{score} <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 500 }}>/ 10</span></span>
      </div>

      <div style={{ height: '9px', background: 'var(--b1)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ 
          height: '100%', 
          width: `${percentage}%`, 
          background: `linear-gradient(90deg, ${color}99, ${color})`, 
          borderRadius: '6px',
          boxShadow: `0 0 10px ${color}66`,
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}></div>
      </div>
      {description && (
        <div style={{ fontSize: '0.8rem', color: 'var(--t3)', marginTop: '6px' }}>{description}</div>
      )}
    </div>
  );
};

export default function DecisionDNA() {
  const navigate = useNavigate()
  const { token } = useStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recalibrating, setRecalibrating] = useState(false)
  const [error, setError] = useState(null)

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/profile/decision-dna`, { 
        credentials: 'include',
        headers: { 'X-Auth-Token': token }
      });
      if (!res.ok) throw new Error('Failed to fetch profile data.');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProfile();
  }, [token]);

  const handleRecalibrate = async () => {
    setRecalibrating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/profile/generate-dna`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Auth-Token': token }
      });
      const data = await res.json();
      if (data.decisionDNA) {
        setProfile(prev => ({ ...prev, decisionDNA: data.decisionDNA }));
      }
    } catch (err) {
      console.error(err);
      alert('Unable to recalibrate Decision DNA. Please try again.');
    } finally {
      setRecalibrating(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', opacity: 0.7 }}>Loading Decision DNA Profile...</div>
  if (error) return <div className="card" style={{ borderColor: 'var(--error)' }}>Error: {error}</div>
  if (!profile || !profile.user) return null

  const { user, decisionDNA } = profile
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'EX'

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <Fingerprint size={32} style={{ color: 'var(--ac)' }} className="icon-pulse" /> My Decision DNA
          </h1>
          <div className="hint" style={{ margin: '6px 0 0 0' }}>
            Executive Cognitive Architecture & Behavioral Profile
          </div>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleRecalibrate}
          disabled={recalibrating}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderColor: 'var(--ac)', color: 'var(--ac)' }}
          title="Recalibrate profile using latest decision outcomes"
        >
          <RefreshCw size={15} className={recalibrating ? 'spin' : ''} /> 
          {recalibrating ? 'Recalibrating DNA...' : 'Recalibrate DNA with AI'}
        </button>
      </div>

      {/* Executive Dossier Information */}
      <div className="card fade-in" style={{ 
        marginBottom: '32px', 
        padding: '24px 28px',
        background: 'linear-gradient(135deg, var(--s1), var(--s2))',
        border: '1px solid var(--b1)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--ac), #1e3a8a)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            flexShrink: 0
          }}>
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{user.name}</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: 600 }}>
                <ShieldCheck size={13} /> Verified Leader
              </span>
            </div>
            <div style={{ color: 'var(--t2)', fontSize: '0.95rem', marginTop: '2px' }}>
              {user.designation} &middot; <strong style={{ color: 'var(--t1)' }}>{user.organisation}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--s2)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>
              <Layers size={13} /> Industry
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{user.industry || 'Enterprise'}</div>
          </div>
          <div style={{ background: 'var(--s2)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>
              <Compass size={13} /> Cohort / Batch
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{user.batch || 'Executive Batch 1'}</div>
          </div>
          <div style={{ background: 'var(--s2)', padding: '12px 16px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}>
              <Sparkles size={13} style={{ color: 'var(--ac)' }} /> Profile Status
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--success)' }}>DNA Active</div>
          </div>
        </div>
      </div>

      {!decisionDNA ? (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Sparkles size={40} style={{ color: 'var(--ac)', margin: '0 auto 16px auto', opacity: 0.8 }} />
          <h2 style={{ marginBottom: '12px' }}>Initialize Decision DNA</h2>
          <p style={{ opacity: 0.8, marginBottom: '24px', maxWidth: '520px', margin: '0 auto 24px auto' }}>
            Your executive behavioral archetype and cognitive traits can be synthesized by AI based on your role, industry governance patterns, and strategic priorities.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-p" onClick={handleRecalibrate} disabled={recalibrating} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} /> {recalibrating ? 'Synthesizing Profile...' : 'Synthesize My Decision DNA Profile'}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/new')}>Start First Decision</button>
          </div>
        </div>
      ) : (
        <>
          {/* Decision Style Hero Banner */}
          <div className="card fade-in" style={{ 
            marginBottom: '32px', 
            padding: '28px 32px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(30, 58, 138, 0.15))', 
            border: '1px solid var(--ac)', 
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ac)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '6px' }}>
                Primary Archetype
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {decisionDNA.decisionStyle || 'Strategic Architect'}
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--t2)', marginTop: '8px', maxWidth: '650px' }}>
                High strategic foresight coupled with deliberate data reliance. Characterized by thorough risk mitigation before capital deployment.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>Archetype Match</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ac)' }}>
                  {decisionDNA.archetypeMatch || (() => {
                    const scores = [
                      decisionDNA.traits?.strategicHorizon || decisionDNA.strategicThinking || 7,
                      decisionDNA.traits?.dataReliance || decisionDNA.analyticalThinking || 8,
                      decisionDNA.traits?.riskTolerance || decisionDNA.riskTolerance || 6,
                      decisionDNA.traits?.stakeholderOrientation || decisionDNA.stakeholderOrientation || 8,
                      decisionDNA.traits?.speedVsAccuracy || decisionDNA.executionUrgency || 6
                    ];
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    return Math.min(98, Math.max(74, Math.round(avg * 10 + 4)));
                  })()}%
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--ac)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Core Decision Scores */}
            <div className="card fade-in" style={{ animationDelay: '0.2s', padding: '24px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginTop: 0, marginBottom: '24px' }}>
                <Layers size={20} style={{ color: 'var(--ac)' }} /> Core Decision Traits
              </h2>
              <TraitScoreMeter label="Strategic Horizon" score={decisionDNA.traits?.strategicHorizon || decisionDNA.strategicThinking || 7} color="#38bdf8" description="Preference for multi-year compound outcomes vs short term" />
              <TraitScoreMeter label="Data & Analytical Reliance" score={decisionDNA.traits?.dataReliance || decisionDNA.analyticalThinking || 8} color="#10b981" description="Weight placed on empirical substantiation before commitment" />
              <TraitScoreMeter label="Risk Tolerance" score={decisionDNA.traits?.riskTolerance || decisionDNA.riskTolerance || 6} color="#f59e0b" description="Comfort navigating high-uncertainty environments" />
              <TraitScoreMeter label="Stakeholder Alignment" score={decisionDNA.traits?.stakeholderOrientation || decisionDNA.stakeholderOrientation || 8} color="#d4af37" description="Focus on cross-functional alignment and organizational consensus" />
              <TraitScoreMeter label="Speed vs Rigor" score={decisionDNA.traits?.speedVsAccuracy || decisionDNA.executionUrgency || 6} color="#a855f7" description="Balance between execution velocity and exhaustive validation" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Strengths */}
              <div className="card fade-in" style={{ borderLeft: '4px solid var(--success)', animationDelay: '0.3s', padding: '22px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', marginTop: 0, marginBottom: '16px', color: 'var(--success)' }}>
                  <Award size={18} /> Validated Strengths
                </h2>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(decisionDNA.strengths || ['High structural clarity during complex resource allocation', 'Strong stakeholder coalition building']).map((item, idx) => (
                    <li key={idx} style={{ fontSize: '0.94rem', lineHeight: 1.45 }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Blind Spots */}
              <div className="card fade-in" style={{ borderLeft: '4px solid var(--error)', animationDelay: '0.4s', padding: '22px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', marginTop: 0, marginBottom: '16px', color: 'var(--error)' }}>
                  <AlertTriangle size={18} /> Cognitive Blind Spots
                </h2>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(decisionDNA.blindSpots || ['Potential over-indexing on historical data during black swan shifts', 'May delay execution in search of perfect consensus']).map((item, idx) => (
                    <li key={idx} style={{ fontSize: '0.94rem', lineHeight: 1.45 }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Leadership Coaching Advice */}
              <div className="card fade-in" style={{ borderLeft: '4px solid var(--ac2)', animationDelay: '0.5s', padding: '22px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', marginTop: 0, marginBottom: '16px', color: 'var(--ac2)' }}>
                  <Lightbulb size={18} className="icon-ai" /> Executive Coaching Directives
                </h2>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(decisionDNA.coachingAdvice || ['Pre-commit explicit kill criteria for experimental initiatives', 'Establish fast-track lanes for reversible two-way door decisions']).map((item, idx) => (
                    <li key={idx} style={{ fontSize: '0.94rem', lineHeight: 1.45 }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
