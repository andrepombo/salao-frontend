import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = ({ connectionStatus, onRetryConnection }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const location = useLocation()
  
  const sections = [
    { id: 'dashboard', path: '/dashboard', name: 'Painel', icon: '📊' },
    { id: 'clients', path: '/clients', name: 'Clientes', icon: '👥' },
    { id: 'team', path: '/team', name: 'Equipe', icon: '💼' },
    { id: 'services', path: '/services', name: 'Serviços', icon: '✂️' },
    { id: 'appointments', path: '/appointments', name: 'Agendamentos', icon: '📅' },
  ]

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">💇‍♀️</span>
          {!isCollapsed && <span className="logo-text">Salão Manager3</span>}
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
          <NavLink
            key={section.id}
            to={section.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={isCollapsed ? section.name : ''}
          >
            <span className="nav-icon">{section.icon}</span>
            {!isCollapsed && <span className="nav-text">{section.name}</span>}
          </NavLink>
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
