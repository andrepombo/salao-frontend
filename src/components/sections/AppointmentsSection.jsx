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

  const columns = [
    { key: 'client_name', label: 'Cliente' },
    { key: 'team_member_name', label: 'Profissional' },
    { key: 'appointment_date', label: 'Data', type: 'date' },
    { key: 'appointment_time', label: 'Horário', type: 'time' },
    { key: 'status', label: 'Status', type: 'badge', badgeColor: (value) => {
      const colors = {
        'scheduled': 'info',
        'confirmed': 'success',
        'in_progress': 'warning',
        'completed': 'success',
        'cancelled': 'danger',
        'no_show': 'danger'
      }
      return colors[value] || 'default'
    }},
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
      // Mock data for development
      const mockAppointments = [
        {
          id: 1,
          client_id: 1,
          client_name: 'Maria Silva',
          team_member_id: 1,
          team_member_name: 'Ana Costa',
          appointment_date: '2024-08-05',
          appointment_time: '10:00',
          status: 'confirmed',
          total_price: 65.00,
          services_list: 'Corte Feminino, Manicure',
          notes: 'Cliente prefere corte em camadas',
          created_at: '2024-08-01T09:00:00Z'
        },
        {
          id: 2,
          client_id: 2,
          client_name: 'João Santos',
          team_member_id: 2,
          team_member_name: 'Carlos Mendes',
          appointment_date: '2024-08-05',
          appointment_time: '14:30',
          status: 'scheduled',
          total_price: 55.00,
          services_list: 'Corte Masculino, Barba Completa',
          notes: '',
          created_at: '2024-08-02T11:15:00Z'
        },
        {
          id: 3,
          client_id: 1,
          client_name: 'Maria Silva',
          team_member_id: 1,
          team_member_name: 'Ana Costa',
          appointment_date: '2024-08-06',
          appointment_time: '15:00',
          status: 'completed',
          total_price: 120.00,
          services_list: 'Coloração Completa',
          notes: 'Coloração loiro mel',
          created_at: '2024-07-30T16:20:00Z'
        }
      ]
      setAppointments(mockAppointments)
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
    if (window.confirm(`Are you sure you want to delete this appointment for ${appointment.client_name}?`)) {
      try {
        // await apiService.delete(`/api/appointments/${appointment.id}/`)
        setAppointments(prev => prev.filter(a => a.id !== appointment.id))
        alert('Appointment deleted successfully!')
      } catch (error) {
        console.error('Error deleting appointment:', error)
        alert('Error deleting appointment. Please try again.')
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
      
      const appointmentData = {
        ...formData,
        client_name: client?.name || '',
        team_member_name: teamMember?.name || '',
        total_price: totalPrice,
        services_list: serviceNames.length > 0 ? serviceNames.join(', ') : 'Nenhum serviço selecionado'
      }
      
      if (editingAppointment) {
        // Update existing appointment
        const updatedAppointment = { ...editingAppointment, ...appointmentData }
        setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updatedAppointment : a))
        alert('Agendamento atualizado com sucesso!')
      } else {
        // Create new appointment
        const newAppointment = { 
          id: Date.now(), 
          ...appointmentData, 
          created_at: new Date().toISOString() 
        }
        setAppointments(prev => [...prev, newAppointment])
        alert('Agendamento criado com sucesso!')
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
