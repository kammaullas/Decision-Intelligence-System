import { useState } from 'react'
import { useStore } from '../store'
import { Shield, UserPlus, ArrowRight, Zap, Brain, BarChart3, Lock, Mail, User } from 'lucide-react'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { setToken, setLoading } = useStore()

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true, "Checking access...")
    setError(false)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/login`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      setLoading(false)
      if (data.success) {
        setToken('cookie', 'live')
      } else {
        setError(true)
        setErrorMsg(data.error || "Incorrect password or connection failed.")
      }
    } catch (e) {
      setLoading(false)
      setError(true)
      setErrorMsg("Connection failed.")
    }
  }

  const handleRegister = async () => {
    if (!name || !email || !password) return
    setLoading(true, "Creating account...")
    setError(false)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/register`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      setLoading(false)
      if (data.success) {
        setToken('cookie', 'live')
      } else {
        setError(true)
        setErrorMsg(data.error || "Registration failed.")
      }
    } catch (e) {
      setLoading(false)
      setError(true)
      setErrorMsg("Connection failed.")
    }
  }

  const handleSubmit = () => {
    if (isRegister) handleRegister()
    else handleLogin()
  }

  const handleDemo = async () => {
    setLoading(true, "Setting up demo...")
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/login`, { credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'demo@executive.com', password: 'demo' })
      })
      const data = await res.json()
      setLoading(false)
      if (data.success) {
        setToken('cookie', 'demo')
      }
    } catch (e) {
      setLoading(false)
      setError(true)
      setErrorMsg("Connection failed.")
    }
  }

  const features = [
    { icon: Brain, text: 'AI-Powered Analysis' },
    { icon: BarChart3, text: 'Data-Driven Insights' },
    { icon: Zap, text: 'Real-Time Scenarios' }
  ]

  return (
    <div id="login-screen" className="login-wrap">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className="login-container">
        {/* Left panel - branding */}
        <div className="login-brand">
          <div className="login-brand-inner">
            <div className="login-logo-ring">
              <Shield size={32} strokeWidth={1.5} />
            </div>
            <h1 className="login-brand-title">DIA</h1>
            <p className="login-brand-subtitle">Decision Intelligence Assistant</p>
            
            <div className="login-features">
              {features.map((f, i) => (
                <div key={i} className="login-feature" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
                  <f.icon size={18} />
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
            
            <div className="login-brand-footer">
              DEEPS Executive Program — SRM AP
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            <h2 className="login-form-title">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="login-form-desc">
              {isRegister 
                ? 'Set up your executive profile to begin' 
                : 'Sign in to your decision workspace'}
            </p>

            <div className="login-fields">
              {isRegister && (
                <div className="login-field fade-in">
                  <User size={16} className="login-field-icon" />
                  <input 
                    type="text" 
                    placeholder="Full name" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
              )}

              <div className="login-field">
                <Mail size={16} className="login-field-icon" />
                <input 
                  type="email" 
                  placeholder="Email address" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              <div className="login-field">
                <Lock size={16} className="login-field-icon" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>

            <div className={`login-err ${error ? 'on' : ''}`}>{errorMsg}</div>
            
            <button className="login-btn" onClick={handleSubmit}>
              {isRegister ? (
                <><UserPlus size={16} /> Create Account</>
              ) : (
                <><ArrowRight size={16} /> Access DIA</>
              )}
            </button>

            <div className="login-switch">
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <span onClick={() => { setIsRegister(!isRegister); setError(false); }}>
                {isRegister ? 'Sign in' : 'Sign up'}
              </span>
            </div>

            {!isRegister && (
              <div className="login-divider">
                <span>or</span>
              </div>
            )}

            {!isRegister && (
              <button className="demo-btn" onClick={handleDemo}>
                <Zap size={14} /> Load EV Demo Scenario
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
