import { useState, useEffect } from 'react'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalTeamMembers: 0,
    totalServices: 0,
    todayAppointments: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0
  })
  
  const [recentAppointments, setRecentAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Mock data for development
      const mockStats = {
        totalClients: 45,
        totalTeamMembers: 8,
        totalServices: 12,
        todayAppointments: 7,
        weeklyRevenue: 1250.00,
        monthlyRevenue: 5400.00
      }
      
      const mockRecentAppointments = [
        {
          id: 1,
          client_name: 'Maria Silva',
          team_member_name: 'Ana Costa',
          service: 'Corte Feminino',
          time: '10:00',
          status: 'confirmed'
        },
        {
          id: 2,
          client_name: 'João Santos',
          team_member_name: 'Carlos Mendes',
          service: 'Corte + Barba',
          time: '14:30',
          status: 'scheduled'
        },
        {
          id: 3,
          client_name: 'Ana Oliveira',
          team_member_name: 'Ana Costa',
          service: 'Coloração',
          time: '16:00',
          status: 'in_progress'
        }
      ]
      
      setStats(mockStats)
      setRecentAppointments(mockRecentAppointments)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': '#3b82f6',
      'confirmed': '#10b981',
      'in_progress': '#f59e0b',
      'completed': '#10b981',
      'cancelled': '#ef4444',
      'no_show': '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando painel...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Painel</h1>
        <p>Bem-vindo ao seu sistema de gerenciamento de salão</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalClients}</h3>
            <p>Total de Clientes</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <h3>{stats.totalTeamMembers}</h3>
            <p>Membros da Equipe</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✂️</div>
          <div className="stat-content">
            <h3>{stats.totalServices}</h3>
            <p>Serviços</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.todayAppointments}</h3>
            <p>Agendamentos de Hoje</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="revenue-cards">
          <div className="revenue-card">
            <h3>Receita Semanal</h3>
            <div className="revenue-amount">R$ {stats.weeklyRevenue.toFixed(2)}</div>
            <div className="revenue-trend">+12% da semana passada</div>
          </div>
          
          <div className="revenue-card">
            <h3>Receita Mensal</h3>
            <div className="revenue-amount">R$ {stats.monthlyRevenue.toFixed(2)}</div>
            <div className="revenue-trend">+8% do mês passado</div>
          </div>
        </div>

        <div className="recent-appointments">
          <h3>Agendamentos de Hoje</h3>
          <div className="appointments-list">
            {recentAppointments.map(appointment => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-time">{appointment.time}</div>
                <div className="appointment-details">
                  <div className="appointment-client">{appointment.client_name}</div>
                  <div className="appointment-service">{appointment.service}</div>
                  <div className="appointment-staff">com {appointment.team_member_name}</div>
                </div>
                <div 
                  className="appointment-status"
                  style={{ backgroundColor: getStatusColor(appointment.status) }}
                >
                  {appointment.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Ações Rápidas</h3>
        <div className="action-buttons">
          <button className="action-btn">
            <span>📅</span>
            Novo Agendamento
          </button>
          <button className="action-btn">
            <span>👤</span>
            Adicionar Cliente
          </button>
          <button className="action-btn">
            <span>✂️</span>
            Novo Serviço
          </button>
          <button className="action-btn">
            <span>💼</span>
            Adicionar Membro
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
