import { useState } from 'react'
import { useStore } from '../store'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const { setToken, setLoading } = useStore()

  const handleLogin = async () => {
    if (!password) return
    setLoading(true, "Checking access...")
    setError(false)
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      setLoading(false)
      if (data.success) {
        setToken(data.token, 'live')
      } else {
        setError(true)
      }
    } catch (e) {
      setLoading(false)
      setError(true)
    }
  }

  const handleDemo = async () => {
    setLoading(true, "Setting up demo...")
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'demo' })
      })
      const data = await res.json()
      setLoading(false)
      if (data.success) {
        setToken(data.token, 'demo')
      }
    } catch (e) {
      setLoading(false)
      setError(true)
    }
  }

  return (
    <div id="login-screen" className="login-wrap">
      <div className="login-box">
        <div className="login-icon">🔐</div>
        <div className="login-title">DIA Access</div>
        <div className="login-sub">Decision Intelligence Assistant<br />Enter your program access password</div>
        <input 
          className="login-input" 
          type="password" 
          placeholder="Enter password" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <div className={`login-err ${error ? 'on' : ''}`}>Incorrect password or connection failed.</div>
        <button className="login-btn" onClick={handleLogin}>Access DIA</button>
        <button className="demo-btn" onClick={handleDemo}>Load EV Demo Scenario</button>
        <div className="login-footer">DEEPS Executive Program - SRM AP</div>
      </div>
    </div>
  )
}
