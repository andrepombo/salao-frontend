import { useState, useEffect, useMemo } from 'react'
import DataTable from '../DataTable'
import MuiCrudForm from '../MuiCrudForm'
import { apiService } from '../../services/api'

const AppointmentsSection = () => {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState(null)

  // Function to get available services for a selected team member
  const getAvailableServices = (teamMemberId) => {
    if (!teamMemberId) return []
    
    const teamMember = teamMembers.find(member => member.id === parseInt(teamMemberId))
    if (!teamMember || !teamMember.specialties) return []
    
    return services
      .filter(service => teamMember.specialties.includes(service.id))
      .map(service => ({ value: service.id, label: `${service.name} - R$ ${service.price.toFixed(2)}` }))
  }

  // Function to get Portuguese status label from English key
  const getStatusLabel = (statusKey) => {
    const statusMap = {
      'scheduled': 'Agendado',
      'confirmed': 'Confirmado', 
      'in_progress': 'Em Andamento',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'no_show': 'Não Compareceu'
    }
    return statusMap[statusKey] || statusKey
  }

  const columns = [
    { key: 'client_name', label: 'Cliente' },
    { key: 'team_member_name', label: 'Profissional' },
    { key: 'appointment_date', label: 'Data', type: 'date' },
    { key: 'appointment_time', label: 'Horário', type: 'time' },
    { key: 'status', label: 'Status', type: 'badge', 
      render: (value) => getStatusLabel(value),
      badgeColor: (value) => {
        const colors = {
          'scheduled': 'info',
          'confirmed': 'success', 
          'in_progress': 'warning',
          'completed': 'success',
          'cancelled': 'danger',
          'no_show': 'danger'
        }
        return colors[value] || 'default'
      }
    },
    { key: 'total_price', label: 'Total', type: 'currency' },
    { key: 'services_list', label: 'Serviços' }
  ]

  const formFields = useMemo(() => [
    {
      name: 'client_id',
      label: 'Cliente',
      type: 'select',
      required: true,
      fullWidth: true,
      minWidth: 350,
      menuProps: {
        PaperProps: {
          style: {
            maxHeight: 200
          }
        }
      },
      options: clients.map(client => ({ value: client.id, label: client.name }))
    },
    {
      name: 'team_member_id',
      label: 'Profissional',
      type: 'select',
      required: true,
      fullWidth: true,
      minWidth: 350,
      menuProps: {
        PaperProps: {
          style: {
            maxHeight: 200
          }
        }
      },
      options: teamMembers.map(member => ({ value: member.id, label: member.name })),
      onChange: (value) => {
        setSelectedTeamMember(value)
      }
    },
    {
      name: 'services',
      label: 'Serviços',
      type: 'multiselect',
      required: true,
      fullWidth: true,
      options: getAvailableServices(selectedTeamMember),
      placeholder: selectedTeamMember ? 'Selecione os serviços' : 'Selecione primeiro um profissional',
      helpText: 'Serviços que serão realizados no agendamento',
      disabled: !selectedTeamMember
    },
    {
      name: 'appointment_date',
      label: 'Data',
      type: 'date',
      required: true,
      fullWidth: true,
      helpText: 'Selecione a data do agendamento'
    },
    {
      name: 'appointment_time',
      label: 'Horário',
      type: 'time',
      required: true,
      fullWidth: true,
      helpText: 'Selecione o horário do agendamento'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'scheduled',
      options: [
        { value: 'scheduled', label: 'Agendado' },
        { value: 'confirmed', label: 'Confirmado' },
        { value: 'in_progress', label: 'Em Andamento' },
        { value: 'completed', label: 'Concluído' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'no_show', label: 'Não Compareceu' }
      ]
    },
    {
      name: 'notes',
      label: 'Observações',
      type: 'textarea',
      fullWidth: true,
      placeholder: 'Observações adicionais para o agendamento'
    }
  ], [clients, teamMembers, services, selectedTeamMember])

  useEffect(() => {
    loadAppointments()
    loadClients()
    loadTeamMembers()
    loadServices()
  }, [])

  const loadAppointments = async () => {
    try {
      setIsLoading(true)
      
      // Try to fetch real data from backend first
      try {
        const response = await apiService.get('/api/appointments/')
        console.log('AppointmentsSection - API Response:', response)
        
        // Handle both paginated and direct array responses safely
        let appointmentsData = []
        
        if (Array.isArray(response)) {
          appointmentsData = response
        } else if (response && Array.isArray(response.results)) {
          appointmentsData = response.results
        } else if (response && response.data && Array.isArray(response.data)) {
          appointmentsData = response.data
        }
        
        console.log('AppointmentsSection - Using real data:', appointmentsData.length, 'appointments')
        setAppointments(appointmentsData)
      } catch (apiError) {
        console.error('AppointmentsSection - Failed to load appointments from backend:', apiError)
        setAppointments([])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const mockClients = [
        { id: 1, name: 'Maria Silva' },
        { id: 2, name: 'João Santos' }
      ]
      setClients(mockClients)
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([])
    }
  }

  const loadTeamMembers = async () => {
    try {
      const mockTeamMembers = [
        { 
          id: 1, 
          name: 'Ana Costa',
          specialties: [1, 2, 3] // Corte Feminino, Corte Masculino, Coloração
        },
        { 
          id: 2, 
          name: 'Carlos Mendes',
          specialties: [4, 5] // Manicure, Barba Completa
        }
      ]
      setTeamMembers(mockTeamMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
      setTeamMembers([])
    }
  }

  const loadServices = async () => {
    try {
      const mockServices = [
        { id: 1, name: 'Corte Feminino', price: 45.00 },
        { id: 2, name: 'Corte Masculino', price: 25.00 },
        { id: 3, name: 'Coloração', price: 120.00 },
        { id: 4, name: 'Manicure', price: 20.00 },
        { id: 5, name: 'Pedicure', price: 25.00 }
      ]
      setServices(mockServices)
    } catch (error) {
      console.error('Error loading services:', error)
      setServices([])
    }
  }

  const handleAdd = () => {
    setEditingAppointment(null)
    setSelectedTeamMember(null) // Reset selected team member for new appointment
    setShowForm(true)
  }

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment)
    setSelectedTeamMember(appointment.team_member_id) // Set selected team member for editing
    setShowForm(true)
  }

  const handleDelete = async (appointment) => {
    if (window.confirm(`Tem certeza que deseja excluir este agendamento para ${appointment.client_name}?`)) {
      try {
        // Try to delete from backend first
        try {
          await apiService.delete(`/api/appointments/${appointment.id}/`)
          setAppointments(prev => prev.filter(a => a.id !== appointment.id))
          alert('Agendamento excluído com sucesso!')
        } catch (apiError) {
          console.warn('Failed to delete appointment from backend, deleting locally:', apiError)
          setAppointments(prev => prev.filter(a => a.id !== appointment.id))
          alert('Agendamento excluído localmente (backend indisponível)')
        }
      } catch (error) {
        console.error('Error deleting appointment:', error)
        alert('Erro ao excluir agendamento. Tente novamente.')
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      
      // Find client and team member names for display
      const client = clients.find(c => c.id === parseInt(formData.client_id))
      const teamMember = teamMembers.find(t => t.id === parseInt(formData.team_member_id))
      
      // Calculate total price and services list based on selected services
      const selectedServices = formData.services || []
      let totalPrice = 0
      const serviceNames = []
      
      selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === parseInt(serviceId))
        if (service) {
          totalPrice += service.price
          serviceNames.push(service.name)
        }
      })
      
      // Prepare data for backend API (Django expects specific field names)
      const appointmentData = {
        client: parseInt(formData.client_id),
        team_member: parseInt(formData.team_member_id),
        services: selectedServices.map(id => parseInt(id)),
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        status: formData.status || 'scheduled',
        notes: formData.notes || ''
      }
      
      // For local state management, also include display names
      const appointmentDataWithNames = {
        ...appointmentData,
        client_id: parseInt(formData.client_id),
        team_member_id: parseInt(formData.team_member_id),
        client_name: client?.name || '',
        team_member_name: teamMember?.name || '',
        total_price: totalPrice,
        services_list: serviceNames.length > 0 ? serviceNames.join(', ') : 'Nenhum serviço selecionado'
      }
      
      if (editingAppointment) {
        // Update existing appointment in backend
        try {
          const updatedAppointment = await apiService.put(`/api/appointments/${editingAppointment.id}/`, appointmentData)
          // Backend returns the appointment, but we need to add display names for frontend
          const updatedWithNames = {
            ...updatedAppointment,
            client_id: appointmentDataWithNames.client_id,
            team_member_id: appointmentDataWithNames.team_member_id,
            client_name: appointmentDataWithNames.client_name,
            team_member_name: appointmentDataWithNames.team_member_name,
            services_list: appointmentDataWithNames.services_list
          }
          setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updatedWithNames : a))
          alert('Agendamento atualizado com sucesso!')
        } catch (apiError) {
          console.warn('Failed to update appointment in backend, updating locally:', apiError)
          const updatedAppointment = { ...editingAppointment, ...appointmentDataWithNames }
          setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updatedAppointment : a))
          alert('Agendamento atualizado localmente (backend indisponível)')
        }
      } else {
        // Create new appointment in backend
        try {
          const newAppointment = await apiService.post('/api/appointments/', appointmentData)
          // Backend returns the appointment, but we need to add display names for frontend
          const newWithNames = {
            ...newAppointment,
            client_id: appointmentDataWithNames.client_id,
            team_member_id: appointmentDataWithNames.team_member_id,
            client_name: appointmentDataWithNames.client_name,
            team_member_name: appointmentDataWithNames.team_member_name,
            services_list: appointmentDataWithNames.services_list
          }
          setAppointments(prev => [...prev, newWithNames])
          alert('Agendamento criado com sucesso!')
        } catch (apiError) {
          console.warn('Failed to create appointment in backend, creating locally:', apiError)
          const newAppointment = { 
            id: Date.now(), 
            ...appointmentDataWithNames, 
            created_at: new Date().toISOString() 
          }
          setAppointments(prev => [...prev, newAppointment])
          alert('Agendamento criado localmente (backend indisponível)')
        }
      }
      
      setShowForm(false)
      setEditingAppointment(null)
      setSelectedTeamMember(null) // Reset selected team member
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert('Erro ao salvar agendamento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAppointment(null)
    setSelectedTeamMember(null) // Reset selected team member
  }

  return (
    <div>
      <DataTable
        title="Agendamentos"
        columns={columns}
        data={appointments}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="Nenhum agendamento encontrado. Crie seu primeiro agendamento para começar!"
      />

      {showForm && (
        <MuiCrudForm
          title="Agendamento"
          fields={formFields}
          data={editingAppointment}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={!!editingAppointment}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}

export default AppointmentsSection
