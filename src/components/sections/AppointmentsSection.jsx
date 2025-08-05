import { useState, useEffect, useMemo } from 'react'
import DataTable from '../DataTable'
import MuiCrudForm from '../MuiCrudForm'
import { apiService } from '../../services/api'
import { Alert } from '@mui/material'

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
  const [conflictError, setConflictError] = useState(null)
  const [isCheckingConflict, setIsCheckingConflict] = useState(false)

  // Function to get available services for a selected team member
  const getAvailableServices = (teamMemberId) => {
    if (!teamMemberId || !teamMembers || !services) return []
    
    const teamMember = (teamMembers || []).find(member => member.id === parseInt(teamMemberId))
    if (!teamMember || !teamMember.specialties) return []
    
    return (services || [])
      .filter(service => teamMember.specialties.includes(service.id))
      .map(service => ({ 
        value: service.id, 
        label: `${service.name} - R$ ${parseFloat(service.price || 0).toFixed(2)}` 
      }))
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
      options: (clients || []).map(client => ({ value: client.id, label: client.name }))
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
      options: (teamMembers || []).map(member => ({ value: member.id, label: member.name })),
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
      helpText: conflictError ? conflictError : 'Selecione o horário do agendamento',
      error: !!conflictError,
onChange: async (value) => {
        // We need to check if we have both a team member and date before checking conflicts
        if (selectedTeamMember) {
          setIsCheckingConflict(true);
          setConflictError(null);
          
          // Format time to HH:MM format
          const formattedTime = value.substring(0, 5);
          
          // Get the current form data for appointment_date
          // We need to access it from the form fields since formData might not be updated yet
          const dateField = document.querySelector('input[name="appointment_date"]');
          const dateValue = dateField ? dateField.value : null;
          
          if (dateValue) {
            // Check for conflicts
            const appointmentId = editingAppointment?.id || null;
            const { hasConflict, message, error } = await apiService.checkAppointmentConflicts(
              dateValue,
              selectedTeamMember,
              formattedTime,
              appointmentId
            );
            
            if (hasConflict) {
              setConflictError(message);
            } else if (error) {
              setConflictError(error);
            } else {
              setConflictError(null);
            }
          }
          
          setIsCheckingConflict(false);
        }
      }
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
        console.log('🔍 AppointmentsSection - Raw API Response:', response)
        console.log('🔍 Response type:', typeof response)
        console.log('🔍 Response keys:', Object.keys(response || {}))
        
        // Handle both paginated and direct array responses safely
        let appointmentsData = []
        
        if (Array.isArray(response)) {
          console.log('📋 Response is direct array')
          appointmentsData = response
        } else if (response && Array.isArray(response.results)) {
          console.log('📋 Response is paginated with results array')
          appointmentsData = response.results
          console.log('📋 Results array:', response.results)
        } else if (response && response.data && Array.isArray(response.data)) {
          console.log('📋 Response has data.results structure')
          appointmentsData = response.data
        } else {
          console.warn('⚠️ Unexpected response structure:', response)
        }
        
        console.log('✅ Final appointments data:', appointmentsData)
        console.log('✅ Appointments count:', appointmentsData.length)
        
        // Debug each appointment object
        appointmentsData.forEach((appointment, index) => {
          console.log(`📋 Appointment ${index + 1}:`, appointment)
          console.log(`📋 Appointment ${index + 1} ID:`, appointment.id)
        })
        
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
      const response = await apiService.get('/api/clients/')
      console.log('Loaded clients from backend:', response)
      // Handle paginated response from Django REST framework
      const clientsData = response.results || response || []
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([])
    }
  }

  const loadTeamMembers = async () => {
    try {
      const response = await apiService.get('/api/team/')
      console.log('Loaded team members from backend:', response)
      // Handle paginated response from Django REST framework
      const teamData = response.results || response || []
      // Ensure we have the specialties data for filtering services
      const processedTeamData = teamData.map(member => ({
        ...member,
        specialties: member.specialties ? member.specialties.map(s => 
          // Handle both cases: s could be an object with id, or just an id
          typeof s === 'object' ? s.id : s
        ) : []
      }))
      setTeamMembers(processedTeamData)
    } catch (error) {
      console.error('Error loading team members:', error)
      setTeamMembers([])
    }
  }

  const loadServices = async () => {
    try {
      const response = await apiService.get('/api/services/')
      console.log('Loaded services from backend:', response)
      // Handle paginated response from Django REST framework
      const servicesData = response.results || response || []
      setServices(servicesData)
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

  const handleEdit = async (appointment) => {
    try {
      // Debug: Check appointment object structure
      console.log('Appointment object for editing:', appointment)
      console.log('Appointment ID:', appointment.id)
      
      // Check if appointment has a valid ID
      if (!appointment.id || appointment.id === 'undefined') {
        console.error('Invalid appointment ID:', appointment.id)
        alert('Erro: ID do agendamento inválido. Não é possível editar este agendamento.')
        return
      }
      
      // Fetch detailed appointment data from backend for editing
      const detailedAppointment = await apiService.get(`/api/appointments/${appointment.id}/`)
      console.log('Detailed appointment data:', detailedAppointment)
      
      // Transform the detailed data to match form field expectations
      const serviceIds = detailedAppointment.services?.map(service => service.id) || []
      console.log('Services from backend:', detailedAppointment.services)
      console.log('Extracted service IDs:', serviceIds)
      
      const transformedAppointment = {
        ...detailedAppointment,
        // Extract IDs from the nested objects
        client_id: detailedAppointment.client?.id,
        team_member_id: detailedAppointment.team_member?.id,
        // Extract service IDs from the services array
        services: serviceIds,
        // Keep other fields as they are
        appointment_date: detailedAppointment.appointment_date,
        appointment_time: detailedAppointment.appointment_time,
        status: detailedAppointment.status,
        notes: detailedAppointment.notes || ''
      }
      
      console.log('Transformed appointment for editing:', transformedAppointment)
      setEditingAppointment(transformedAppointment)
      setSelectedTeamMember(transformedAppointment.team_member_id)
      setShowForm(true)
    } catch (error) {
      console.error('Error fetching appointment details for editing:', error)
      alert('Erro ao carregar detalhes do agendamento para edição.')
    }
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
      
      // Check for conflicts before submitting
      if (selectedTeamMember && formData.appointment_date && formData.appointment_time) {
        const formattedTime = formData.appointment_time.substring(0, 5);
        const appointmentId = editingAppointment?.id || null;
        
        try {
          const { hasConflict, message } = await apiService.checkAppointmentConflicts(
            formData.appointment_date,
            selectedTeamMember,
            formattedTime,
            appointmentId
          );
          
          if (hasConflict) {
            setConflictError(message);
            setIsSubmitting(false);
            return; // Prevent form submission if there's a conflict
          }
        } catch (error) {
          console.error('Error checking conflicts:', error);
          // Continue with submission even if conflict check fails
        }
      }
      
      // Find client and team member names for display
      const client = clients.find(c => c.id === parseInt(formData.client_id))
      const teamMember = teamMembers.find(t => t.id === parseInt(formData.team_member_id))
      
      // Calculate total price and services list based on selected services
      const selectedServices = formData.services || []
      console.log('Selected services for calculation:', selectedServices)
      let totalPrice = 0
      const serviceNames = []
      
      selectedServices.forEach(serviceId => {
        const service = services.find(s => s.id === parseInt(serviceId))
        console.log(`Service ID ${serviceId}:`, service)
        if (service) {
          const servicePrice = parseFloat(service.price || 0)
          console.log(`Adding price: ${servicePrice} (from ${service.price})`)
          totalPrice += servicePrice
          serviceNames.push(service.name)
        }
      })
      
      console.log('Final calculated total price:', totalPrice)
      console.log('Service names:', serviceNames)
      
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
          console.log('🔄 Updating appointment ID:', editingAppointment.id)
          console.log('🔄 Update data being sent:', appointmentData)
          
          const updatedAppointment = await apiService.put(`/api/appointments/${editingAppointment.id}/`, appointmentData)
          console.log('✅ Backend update response:', updatedAppointment)
          
          // Create the complete updated appointment object for frontend state
          const updatedWithNames = {
            // Start with the backend response (this has the most up-to-date data)
            ...updatedAppointment,
            // ENSURE ID is preserved from the editing appointment
            id: editingAppointment.id,
            // Add frontend-specific fields for display
            client_id: appointmentDataWithNames.client_id,
            team_member_id: appointmentDataWithNames.team_member_id,
            client_name: appointmentDataWithNames.client_name,
            team_member_name: appointmentDataWithNames.team_member_name,
            services_list: appointmentDataWithNames.services_list,
            // Use backend calculated total_price if available, otherwise use local calculation
            total_price: updatedAppointment.total_price || appointmentDataWithNames.total_price
          }
          
          console.log('🔄 Final updated appointment for state:', updatedWithNames)
          console.log('🔄 Preserved ID:', updatedWithNames.id)
          
          // Update the appointments state
          setAppointments(prev => {
            const updated = prev.map(a => {
              if (a.id === editingAppointment.id) {
                console.log('🔄 Updating appointment with ID:', a.id, 'to:', updatedWithNames)
                return updatedWithNames
              }
              return a
            })
            console.log('🔄 Updated appointments state:', updated)
            return updated
          })
          
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
          console.log('Sending appointment data to backend:', appointmentData)
          const response = await apiService.post('/api/appointments/', appointmentData)
          // Backend returns the appointment, but we need to add display names for frontend
          const newAppointment = response.data || response
          
          // Calculate total price from services
          const totalPrice = (newAppointment.services || []).reduce((sum, serviceId) => {
            const service = services.find(s => s.id === serviceId)
            return sum + (service ? parseFloat(service.price || 0) : 0)
          }, 0)
          
          const newWithNames = {
            ...newAppointment,
            client_id: appointmentDataWithNames.client_id,
            team_member_id: appointmentDataWithNames.team_member_id,
            client_name: appointmentDataWithNames.client_name,
            team_member_name: appointmentDataWithNames.team_member_name,
            services_list: appointmentDataWithNames.services_list,
            total_price: totalPrice
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
    setConflictError(null) // Reset conflict error
  }

  // Define filters for the DataTable
  const tableFilters = [
    {
      key: 'appointment_date',
      type: 'dateRange',
      placeholder: 'Filtrar por período'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'scheduled', label: 'Agendado' },
        { value: 'confirmed', label: 'Confirmado' },
        { value: 'in_progress', label: 'Em Andamento' },
        { value: 'completed', label: 'Concluído' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'no_show', label: 'Não Compareceu' }
      ]
    }
  ]

  // Handle filter changes
  const handleFilterChange = (filters) => {
    console.log('Filters changed:', filters)
    // You can add additional logic here if needed
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
        filters={tableFilters}
        onFilterChange={handleFilterChange}
      />

      {showForm && (
        <>
          <MuiCrudForm
            title="Agendamento"
            fields={formFields}
            data={editingAppointment}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={!!editingAppointment}
            isLoading={isSubmitting || isCheckingConflict}
          />
          {conflictError && (
            <Alert 
              severity="warning" 
              sx={{ 
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: '80%',
                maxWidth: '500px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                '& .MuiAlert-icon': {
                  color: '#ff9800'
                }
              }}
            >
              {conflictError}
            </Alert>
          )}
        </>
      )}
    </div>
  )
}

export default AppointmentsSection
