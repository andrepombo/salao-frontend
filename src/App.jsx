import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { apiService } from './services/api'
import { initializeAnalytics, trackPageView } from './services/analytics'
import Sidebar from './components/Sidebar'
import Dashboard from './components/sections/Dashboard'
import ClientsSection from './components/sections/ClientsSection'
import TeamSection from './components/sections/TeamSection'
import ServicesSection from './components/sections/ServicesSection'
import AppointmentsSection from './components/sections/AppointmentsSection'
import './App.css'

// Analytics tracker component
function PageTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Track page view when location changes
    const path = location.pathname || '/';
    trackPageView(path);
    console.log(`Analytics: Tracking page view for: ${path}`);
  }, [location]);
  
  return null;
}

// Main App component
function App() {
  const [connectionStatus, setConnectionStatus] = useState('testing')
  const [backendData, setBackendData] = useState(null)
  const [error, setError] = useState(null)
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('language')
      return stored === 'en' ? 'en' : 'pt'
    }
    return 'pt'
  })

  useEffect(() => {
    testBackendConnection()
    // Initialize Google Analytics
    initializeAnalytics()
  }, [])

  const testBackendConnection = async () => {
    try {
      setConnectionStatus('testing')
      setError(null)
      
      // Try to connect to backend health endpoint
      const data = await apiService.testConnection()
      setBackendData(data)
      setConnectionStatus('connected')
    } catch (err) {
      console.error('Connection failed:', err)
      setError(err.message || 'Failed to connect to backend')
      setConnectionStatus('failed')
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4ade80'
      case 'failed': return '#ef4444'
      default: return '#fbbf24'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'failed': return 'Disconnected'
      default: return 'Connecting...'
    }
  }

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'pt' ? 'en' : 'pt'
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('language', next)
        } catch (e) {}
      }
      return next
    })
  }

  return (
    <Router>
      <div className="app">
        <PageTracker />
        <Sidebar 
          connectionStatus={connectionStatus}
          onRetryConnection={testBackendConnection}
          language={language}
        />
        <main className="app-main">
          <header className="app-header">
            <button
              type="button"
              className="lang-toggle-btn"
              onClick={toggleLanguage}
              aria-label={language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
            >
              {language === 'en' ? (
                <>
                  <span>PT</span>
                  <span>🇧🇷</span>
                </>
              ) : (
                <>
                  <span>EN</span>
                  <span>🇬🇧</span>
                </>
              )}
            </button>
          </header>
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard language={language} />} />
              <Route path="/clients" element={<ClientsSection language={language} />} />
              <Route path="/team" element={<TeamSection language={language} />} />
              <Route path="/services" element={<ServicesSection language={language} />} />
              <Route path="/appointments" element={<AppointmentsSection language={language} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          
          {error && (
            <div className="error-toast">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{language === 'en' ? 'Backend connection failed' : 'Falha na conexão com o backend'}</span>
                <button 
                  className="error-close"
                  onClick={() => setError(null)}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </Router>
  )
}

export default App
