import { useState } from 'react'
import './Sidebar.css'

const Sidebar = ({ activeSection, onSectionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sections = [
    { id: 'dashboard', name: 'Painel', icon: '📊' },
    { id: 'clients', name: 'Clientes', icon: '👥' },
    { id: 'team', name: 'Equipe', icon: '💼' },
    { id: 'services', name: 'Serviços', icon: '✂️' },
    { id: 'appointments', name: 'Agendamentos', icon: '📅' },
  ]

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">💇‍♀️</span>
          {!isCollapsed && <span className="logo-text">Salão Manager</span>}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => onSectionChange(section.id)}
            title={isCollapsed ? section.name : ''}
          >
            <span className="nav-icon">{section.icon}</span>
            {!isCollapsed && <span className="nav-text">{section.name}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-icon">👤</span>
          {!isCollapsed && <span className="user-name">Administrador</span>}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
