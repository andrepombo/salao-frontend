import { useState, useEffect } from 'react'
import DataTable from '../DataTable'
import CrudForm from '../CrudForm'
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

  const columns = [
    { key: 'client_name', label: 'Client' },
    { key: 'team_member_name', label: 'Team Member' },
    { key: 'appointment_date', label: 'Date', type: 'date' },
    { key: 'appointment_time', label: 'Time', type: 'time' },
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
    { key: 'services_list', label: 'Services' }
  ]

  const formFields = [
    {
      name: 'client_id',
      label: 'Client',
      type: 'select',
      required: true,
      options: clients.map(client => ({ value: client.id, label: client.name }))
    },
    {
      name: 'team_member_id',
      label: 'Team Member',
      type: 'select',
      required: true,
      options: teamMembers.map(member => ({ value: member.id, label: member.name }))
    },
    {
      name: 'appointment_date',
      label: 'Date',
      type: 'date',
      required: true,
      helpText: 'Select appointment date'
    },
    {
      name: 'appointment_time',
      label: 'Time',
      type: 'time',
      required: true,
      helpText: 'Select appointment time'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'scheduled',
      options: [
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'no_show', label: 'No Show' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      fullWidth: true,
      placeholder: 'Additional notes for the appointment'
    }
  ]

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
        { id: 1, name: 'Ana Costa' },
        { id: 2, name: 'Carlos Mendes' }
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
        { id: 3, name: 'Coloração Completa', price: 120.00 },
        { id: 4, name: 'Manicure', price: 20.00 },
        { id: 5, name: 'Barba Completa', price: 30.00 }
      ]
      setServices(mockServices)
    } catch (error) {
      console.error('Error loading services:', error)
      setServices([])
    }
  }

  const handleAdd = () => {
    setEditingAppointment(null)
    setShowForm(true)
  }

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment)
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
      
      const appointmentData = {
        ...formData,
        client_name: client?.name || '',
        team_member_name: teamMember?.name || '',
        total_price: 0, // This would be calculated based on selected services
        services_list: 'Services to be selected' // This would be based on selected services
      }
      
      if (editingAppointment) {
        // Update existing appointment
        const updatedAppointment = { ...editingAppointment, ...appointmentData }
        setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updatedAppointment : a))
        alert('Appointment updated successfully!')
      } else {
        // Create new appointment
        const newAppointment = { 
          id: Date.now(), 
          ...appointmentData, 
          created_at: new Date().toISOString() 
        }
        setAppointments(prev => [...prev, newAppointment])
        alert('Appointment created successfully!')
      }
      
      setShowForm(false)
      setEditingAppointment(null)
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert('Error saving appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAppointment(null)
  }

  return (
    <div>
      <DataTable
        title="Appointments"
        columns={columns}
        data={appointments}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="No appointments scheduled yet. Create your first appointment to get started!"
      />

      {showForm && (
        <CrudForm
          title="Appointment"
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
