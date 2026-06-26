import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useStore } from './store'
import Login from './components/Login'
import Step1_Define from './components/Step1_Define'
import Step2_Options from './components/Step2_Options'
import Step3_Criteria from './components/Step3_Criteria'
import Step4_Results from './components/Step4_Results'
import DecisionHistory from './components/DecisionHistory'
import DecisionDetail from './components/DecisionDetail'
import OrganizationalInsights from './components/OrganizationalInsights'
import Dashboard from './components/Dashboard'
import './index.css'

const Wizard = () => {
  const { currentStep } = useStore()
  return (
    <>
      <div className={`page ${currentStep === 1 ? 'on' : ''}`}>
        <Step1_Define />
      </div>
      <div className={`page ${currentStep === 2 ? 'on' : ''}`}>
        <Step2_Options />
      </div>
      <div className={`page ${currentStep === 3 ? 'on' : ''}`}>
        <Step3_Criteria />
      </div>
      <div className={`page ${currentStep === 4 ? 'on' : ''}`}>
        <Step4_Results />
      </div>
    </>
  )
}

function App() {
  const { currentStep, token, setToken, loading, loadingText, globalError, logout, theme, toggleTheme } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    // Check auth on load
    const savedToken = localStorage.getItem('dia_token')
    if (savedToken) {
      fetch('http://localhost:5000/api/check-auth', {
        headers: { 'X-Auth-Token': savedToken }
      })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setToken(savedToken, localStorage.getItem('dia_mode') || 'live')
        }
      })
      .catch(() => {})
    }
  }, [setToken])

  return (
    <>
      <div className={`loader ${loading ? 'on' : ''}`} id="loader">
        <div className="spin"></div>
        <div className="ltxt">{loadingText}</div>
      </div>

      {!token && <Login />}

      {token && (
        <div id="app-screen">
          <nav>
            <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>DIA <em>·</em> Decision Intelligence</div>
            {location.pathname === '/new' ? (
              <div className="stepper">
                <div className={`dot ${currentStep >= 1 ? 'on' : ''} ${currentStep > 1 ? 'done' : ''}`}>1</div>
                <div className="dline"></div>
                <div className={`dot ${currentStep >= 2 ? 'on' : ''} ${currentStep > 2 ? 'done' : ''}`}>2</div>
                <div className="dline"></div>
                <div className={`dot ${currentStep >= 3 ? 'on' : ''} ${currentStep > 3 ? 'done' : ''}`}>3</div>
                <div className="dline"></div>
                <div className={`dot ${currentStep >= 4 ? 'on' : ''} ${currentStep > 4 ? 'done' : ''}`}>4</div>
              </div>
            ) : <div className="stepper" style={{ opacity: 0 }}></div>}
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.9rem', background: 'transparent', color: 'var(--t1)', border: 'none' }} onClick={() => navigate('/dashboard')}>Dashboard</button>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.9rem', background: 'transparent', color: 'var(--t1)', border: 'none' }} onClick={() => navigate('/insights')}>Insights</button>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.9rem', background: 'transparent', color: 'var(--t1)', border: 'none' }} onClick={() => navigate('/history')}>History</button>
              
              <button className="theme-toggle" onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--t1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </div>
          </nav>
          <main>
            {globalError && (
              <div className="errbox on" style={{ marginBottom: '20px' }}>
                <span>!</span><span>{globalError}</span>
              </div>
            )}
            
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/new" element={<Wizard />} />
              <Route path="/history" element={<DecisionHistory />} />
              <Route path="/history/:id" element={<DecisionDetail />} />
              <Route path="/insights" element={<OrganizationalInsights />} />
            </Routes>
          </main>
        </div>
      )}
    </>
  )
}

export default App
