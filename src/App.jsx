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

  return (
    <Router>
      <div className="app">
        <PageTracker />
        <Sidebar 
          connectionStatus={connectionStatus}
          onRetryConnection={testBackendConnection}
        />
        <main className="app-main">
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<ClientsSection />} />
              <Route path="/team" element={<TeamSection />} />
              <Route path="/services" element={<ServicesSection />} />
              <Route path="/appointments" element={<AppointmentsSection />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          
          {error && (
            <div className="error-toast">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <span className="error-message">Backend connection failed</span>
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
