import { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalTeamMembers: 0,
    totalServices: 0,
    todayAppointments: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0
  })
  
  const [recentAppointments, setRecentAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Function to safely parse date strings without timezone issues
  const parseDateSafe = (dateString) => {
    if (!dateString) return null
    const parts = dateString.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1 // Month is 0-indexed
      const day = parseInt(parts[2])
      return new Date(year, month, day)
    }
    return new Date(dateString)
  }

  // Function to check if two dates are the same day (ignoring time)
  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch real data from backend
      const [appointmentsResponse, clientsResponse, teamResponse, servicesResponse] = await Promise.all([
        apiService.get('/api/appointments/'),
        apiService.get('/api/clients/'),
        apiService.get('/api/team/'),
        apiService.get('/api/services/')
      ])
      
      // Handle paginated responses from Django REST framework
      const appointmentsData = appointmentsResponse?.results || appointmentsResponse || []
      const clientsData = clientsResponse?.results || clientsResponse || []
      const teamData = teamResponse?.results || teamResponse || []
      const servicesData = servicesResponse?.results || servicesResponse || []
      
      console.log('Dashboard fetched real data:', {
        appointments: appointmentsData.length,
        clients: clientsData.length,
        team: teamData.length,
        services: servicesData.length
      })
      
      // Calculate revenue from completed appointments
      const completedAppointments = appointmentsData.filter(apt => apt.status === 'completed')
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      // Calculate daily revenue (today only)
      const dailyRevenue = completedAppointments
        .filter(apt => {
          const aptDate = parseDateSafe(apt.appointment_date)
          return aptDate && isSameDay(aptDate, now)
        })
        .reduce((sum, apt) => sum + (parseFloat(apt.total_price) || 0), 0)
      
      // Calculate monthly revenue
      const monthlyRevenue = completedAppointments
        .filter(apt => {
          const aptDate = parseDateSafe(apt.appointment_date)
          return aptDate && aptDate >= monthAgo
        })
        .reduce((sum, apt) => sum + (parseFloat(apt.total_price) || 0), 0)
      
      // Count today's appointments
      const todayAppointments = appointmentsData.filter(apt => {
        const aptDate = parseDateSafe(apt.appointment_date)
        return aptDate && isSameDay(aptDate, now)
      }).length
      
      // Calculate stats from real data
      const stats = {
        totalClients: clientsData.length,
        totalTeamMembers: teamData.length,
        totalServices: servicesData.length,
        todayAppointments: todayAppointments,
        dailyRevenue: dailyRevenue,
        monthlyRevenue: monthlyRevenue
      }
      
      setStats(stats)
      
      // Filter appointments to only show today's appointments
      const todaysAppointments = appointmentsData.filter(apt => {
        const aptDate = parseDateSafe(apt.appointment_date)
        return aptDate && isSameDay(aptDate, now)
      })
      
      setRecentAppointments(todaysAppointments)
      
      console.log('Dashboard data loaded successfully:', {
        totalAppointments: appointmentsData.length,
        todayAppointments: todaysAppointments.length,
        appointmentsByStatus: groupAppointmentsByStatus(todaysAppointments),
        stats
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Set fallback data in case of error
      setStats({
        totalClients: 0,
        totalTeamMembers: 0,
        totalServices: 0,
        todayAppointments: 0,
        dailyRevenue: 0,
        monthlyRevenue: 0
      })
      setRecentAppointments([])
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

  const formatTime = (timeString) => {
    if (!timeString) return ''
    // Remove seconds from time format (HH:MM:SS -> HH:MM)
    return timeString.substring(0, 5)
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
            <h3>R$ {stats.dailyRevenue.toFixed(2)}</h3>
            <p>Receita Diária</p>
            <span className="revenue-trend">Hoje, {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        
        <div className="stat-card revenue-stat">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <h3>R$ {stats.monthlyRevenue.toFixed(2)}</h3>
            <p>Receita Mensal</p>
            <span className="revenue-trend">Últimos 30 dias</span>
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
                      <div className="appointment-time">{formatTime(appointment.appointment_time)}</div>
                      <div className="appointment-details">
                        <div className="appointment-client">{appointment.client_name}</div>
                        <div className="appointment-service">{appointment.services_list}</div>
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
