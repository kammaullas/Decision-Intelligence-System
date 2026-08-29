import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Fingerprint, User, Briefcase, Building2, Layers, Compass, Award, AlertTriangle, Lightbulb, Bell } from 'lucide-react'

const ScoreBar = ({ label, score }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
      <span style={{ fontWeight: 500 }}>{label}</span>
      <span style={{ opacity: 0.8 }}>{score} / 10</span>
    </div>
    <div style={{ height: '8px', background: 'var(--b1)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ 
        height: '100%', 
        width: `${(score/10)*100}%`, 
        background: 'var(--ac)', 
        borderRadius: '4px',
        transition: 'width 1s ease-in-out'
      }}></div>
    </div>
  </div>
)

export default function DecisionDNA() {
  const navigate = useNavigate()
  const { token } = useStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return

    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/profile/decision-dna`, {
      headers: { 'X-Auth-Token': token }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile data.')
        return res.json()
      })
      .then(data => {
        setProfile(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [token])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', opacity: 0.7 }}>Loading Decision DNA...</div>
  if (error) return <div className="card" style={{ borderColor: 'var(--error)' }}>Error: {error}</div>
  if (!profile || !profile.user) return null

  const { user, decisionDNA } = profile

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Fingerprint size={28} style={{ color: 'var(--ac)' }} /> My Decision DNA
          </h1>
          <div style={{ opacity: 0.7 }}>Executive Decision Intelligence Profile</div>
        </div>
      </div>

      {/* Executive Information */}
      <div className="card fade-in" style={{ marginBottom: '32px', animationDelay: '0.1s' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', marginTop: 0, marginBottom: '20px' }}>
          <User size={20} /> Executive Profile
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}><User size={14} /> Name</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.name}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}><Briefcase size={14} /> Designation</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.designation}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}><Building2 size={14} /> Organisation</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.organisation}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}><Layers size={14} /> Industry</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.industry}</div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '4px' }}><Compass size={14} /> Batch</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user.batch}</div>
          </div>
        </div>
      </div>

      {!decisionDNA ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ marginBottom: '16px' }}>Decision DNA Not Generated</h2>
          <p style={{ opacity: 0.8, marginBottom: '24px' }}>You have not completed your initial assessment. Your Decision DNA profile will appear here once the assessment is processed.</p>
        </div>
      ) : (
        <>
          {/* Decision Style */}
          <div className="card fade-in" style={{ marginBottom: '32px', borderLeft: '4px solid var(--ac)', animationDelay: '0.2s' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '8px' }}>Primary Decision Style</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ac)' }}>
              {decisionDNA.decisionStyle}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Core Decision Scores */}
            <div className="card fade-in" style={{ animationDelay: '0.3s' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', marginTop: 0, marginBottom: '24px' }}>
                <Layers size={20} /> Core Decision Scores
              </h2>
              <ScoreBar label="Strategic Thinking" score={decisionDNA.traits?.strategicHorizon || 7} />
              <ScoreBar label="Analytical Thinking" score={decisionDNA.traits?.dataReliance || 8} />
              <ScoreBar label="Risk Tolerance" score={decisionDNA.traits?.riskTolerance || 6} />
              <ScoreBar label="Stakeholder Orientation" score={decisionDNA.traits?.stakeholderOrientation || 8} />
              <ScoreBar label="Speed vs Accuracy" score={decisionDNA.traits?.speedVsAccuracy || 6} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Strengths */}
              <div className="card fade-in" style={{ borderLeft: '4px solid var(--gr)', animationDelay: '0.4s' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', marginTop: 0, marginBottom: '16px', color: 'var(--gr)' }}>
                  <Award size={20} /> Strengths
                </h2>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {decisionDNA.strengths?.map((item, idx) => (
                    <li key={idx} style={{ opacity: 0.9 }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Blind Spots */}
              <div className="card fade-in" style={{ borderLeft: '4px solid var(--rd)', animationDelay: '0.5s' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', marginTop: 0, marginBottom: '16px', color: 'var(--rd)' }}>
                  <AlertTriangle size={20} /> Development Areas / Blind Spots
                </h2>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {decisionDNA.blindSpots?.map((item, idx) => (
                    <li key={idx} style={{ opacity: 0.9 }}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Leadership Advice */}
              <div className="card fade-in" style={{ borderLeft: '4px solid var(--ac2)', animationDelay: '0.6s' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', marginTop: 0, marginBottom: '16px', color: 'var(--ac2)' }}>
                  <Lightbulb size={20} /> Leadership Advice
                </h2>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {decisionDNA.coachingAdvice?.map((item, idx) => (
                    <li key={idx} style={{ opacity: 0.9 }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Today's Leadership Reminder */}
          {decisionDNA.coachingAdvice && decisionDNA.coachingAdvice.length > 0 && (
            <div className="card" style={{ background: 'var(--s2)', border: '1px solid var(--b2)' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', marginBottom: '12px', fontWeight: 600 }}>Today's Leadership Reminder</div>
              <div style={{ fontSize: '1.2rem', fontStyle: 'italic', fontWeight: 500 }}>
                "{decisionDNA.coachingAdvice[Math.floor(Math.random() * decisionDNA.coachingAdvice.length)]}"
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
