import { useState, useEffect } from 'react'
import { apiService } from './services/api'
import { initializeAnalytics, trackPageView } from './services/analytics'
import Sidebar from './components/Sidebar'
import Dashboard from './components/sections/Dashboard'
import ClientsSection from './components/sections/ClientsSection'
import TeamSection from './components/sections/TeamSection'
import ServicesSection from './components/sections/ServicesSection'
import AppointmentsSection from './components/sections/AppointmentsSection'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')
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

  const renderActiveSection = () => {
    // Track page view when section changes
    useEffect(() => {
      trackPageView(`/${activeSection}`)
    }, [activeSection])
    
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'clients':
        return <ClientsSection />
      case 'team':
        return <TeamSection />
      case 'services':
        return <ServicesSection />
      case 'appointments':
        return <AppointmentsSection />
      default:
        return <Dashboard />
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
    <div className="app">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <main className="app-main">
        <div className="app-content">
          {renderActiveSection()}
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
  )
}

export default App
