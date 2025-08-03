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
        },
        {
          id: 4,
          client_name: 'Pedro Costa',
          team_member_name: 'Carlos Mendes',
          service: 'Manicure',
          time: '11:30',
          status: 'scheduled'
        },
        {
          id: 5,
          client_name: 'Lucia Ferreira',
          team_member_name: 'Ana Costa',
          service: 'Corte + Escova',
          time: '09:00',
          status: 'completed'
        },
        {
          id: 6,
          client_name: 'Roberto Lima',
          team_member_name: 'Carlos Mendes',
          service: 'Corte Masculino',
          time: '15:30',
          status: 'confirmed'
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

  const getStatusLabel = (status) => {
    const labels = {
      'scheduled': 'Agendado',
      'confirmed': 'Confirmado',
      'in_progress': 'Em Andamento',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'no_show': 'Não Compareceu'
    }
    return labels[status] || status
  }

  const groupAppointmentsByStatus = (appointments) => {
    const grouped = appointments.reduce((acc, appointment) => {
      const status = appointment.status
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(appointment)
      return acc
    }, {})
    
    // Sort by workflow order: scheduled, confirmed, in_progress, completed
    const statusOrder = ['scheduled', 'confirmed', 'in_progress', 'completed']
    const sortedGrouped = {}
    statusOrder.forEach(status => {
      if (grouped[status]) {
        sortedGrouped[status] = grouped[status]
      }
    })
    return sortedGrouped
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
        <div className="stat-card revenue-stat">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>R$ {stats.weeklyRevenue.toFixed(2)}</h3>
            <p>Receita Semanal</p>
            <span className="revenue-trend">+12% da semana passada</span>
          </div>
        </div>
        
        <div className="stat-card revenue-stat">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>R$ {stats.monthlyRevenue.toFixed(2)}</h3>
            <p>Receita Mensal</p>
            <span className="revenue-trend">+8% do mês passado</span>
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
        <div className="appointments-by-status">
          <h3>Agendamentos de Hoje</h3>
          <div className="status-columns">
            {Object.entries(groupAppointmentsByStatus(recentAppointments)).map(([status, appointments]) => (
              <div key={status} className="status-group">
                <div className="status-header">
                  <div 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(status) }}
                  ></div>
                  <h4>{getStatusLabel(status)} ({appointments.length})</h4>
                </div>
                <div className="appointments-list">
                  {appointments.map(appointment => (
                    <div key={appointment.id} className="appointment-item">
                      <div className="appointment-time">{appointment.time}</div>
                      <div className="appointment-details">
                        <div className="appointment-client">{appointment.client_name}</div>
                        <div className="appointment-service">{appointment.service}</div>
                        <div className="appointment-staff">com {appointment.team_member_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
