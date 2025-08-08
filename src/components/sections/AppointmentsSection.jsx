import { useState, useEffect, useMemo } from 'react'
import DataTable from '../DataTable'
import MuiCrudForm from '../MuiCrudForm'
import { apiService } from '../../services/api'
import { trackAppointment, trackEvent } from '../../services/analytics'
import { Alert, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'
import './AppointmentsSection.css'

const AppointmentsSection = () => {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(false) // For overall component loading
  const [tableLoading, setTableLoading] = useState(true) // Separate state for table loading
  const [showForm, setShowForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState(null)
  const [conflictError, setConflictError] = useState(null)
  const [isCheckingConflict, setIsCheckingConflict] = useState(false)
  const [stats, setStats] = useState({
    totalAppointments: '...',
    todayAppointments: '...',
    confirmedAppointments: '...',
    totalRevenue: '...'
  }) // Use placeholder values for immediate rendering
  const [activeFilters, setActiveFilters] = useState({})

  // Fetch aggregated stats from backend (cached)
  const fetchSectionStats = async () => {
    try {
      const data = await apiService.getCached('/api/appointments/section_stats/', 60000)
      // Normalize and update stats state
      setStats({
        totalAppointments: data?.total_appointments ?? 0,
        todayAppointments: data?.today_appointments ?? 0,
        confirmedAppointments: data?.confirmed_appointments ?? 0,
        totalRevenue: typeof data?.total_revenue === 'number' ? data.total_revenue : parseFloat(data?.total_revenue || 0)
      })
    } catch (err) {
      console.error('Failed to fetch section stats:', err)
      setStats({ totalAppointments: 0, todayAppointments: 0, confirmedAppointments: 0, totalRevenue: 0 })
    }
  }

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

  // Function to calculate appointment statistics
  const calculateStats = (appointmentsData) => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    const totalAppointments = appointmentsData.length
    
    // Count unique clients
    const uniqueClientIds = new Set()
    appointmentsData.forEach(apt => {
      // Check for client property which could be an ID or name
      if (apt.client) {
        uniqueClientIds.add(apt.client)
      } else if (apt.client_id) {
        uniqueClientIds.add(apt.client_id)
      } else if (apt.client_name) {
        uniqueClientIds.add(apt.client_name)
      }
    })
    const uniqueClientsCount = uniqueClientIds.size
    
    // Count completed appointments
    const completedAppointments = appointmentsData.filter(apt => apt.status === 'completed').length
    
    const totalRevenue = appointmentsData.reduce((sum, apt) => {
      return sum + (parseFloat(apt.total_price) || 0)
    }, 0)
    
    return {
      totalAppointments,
      uniqueClientsCount,
      completedAppointments,
      totalRevenue
    }
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
    { key: 'total_duration', label: 'Duração', 
      render: (value) => {
        if (!value) return '-';
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        if (hours > 0) {
          return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
        }
        return `${minutes}min`;
      }
    },
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
    // Start data loading immediately but don't block rendering
    Promise.all([
      loadAppointments(),
      loadClients(),
      loadTeamMembers(),
      loadServices(),
      fetchSectionStats()
    ])
  }, [])

  const loadAppointments = async () => {
    try {
      // Don't block UI rendering with loading state for the cards
      // But do show loading indicator for the table
      setTableLoading(true)
      
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
        
        // Process appointments to add duration calculation
        const processedAppointments = appointmentsData.map(appointment => {
          // Calculate total duration from services
          let totalDuration = appointment.total_duration;
          if (!totalDuration && appointment.services) {
            totalDuration = appointment.services.reduce((sum, serviceId) => {
              const service = services.find(s => s.id === serviceId)
              return sum + (service ? parseInt(service.duration_minutes || 0) : 0)
            }, 0)
          }
          
          return {
            ...appointment,
            total_duration: totalDuration
          }
        })
        
        setAppointments(processedAppointments)
        
      } catch (apiError) {
        console.error('AppointmentsSection - Failed to load appointments from backend:', apiError)
        setAppointments([])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
    } finally {
      setTableLoading(false)
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
      // Ensure teamData is always an array
      let teamData = [];
      if (Array.isArray(response)) {
        teamData = response;
      } else if (response && Array.isArray(response.results)) {
        teamData = response.results;
      } else if (response && typeof response === 'object') {
        // If it's an object but not with results array, check if it has results property
        teamData = Array.isArray(response.results) ? response.results : [];
      }
      
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
    if (window.confirm(`Tem certeza que deseja excluir o agendamento de ${appointment.client_name}?`)) {
      try {
        await apiService.deleteAppointment(appointment.id)
        
        // Track appointment deletion
        trackAppointment('Deleted', appointment)
        
        // Remove the deleted appointment from the list
        setAppointments(appointments.filter(apt => apt.id !== appointment.id))
        
        // Refresh aggregated stats from backend
        fetchSectionStats()
        
        alert('Agendamento excluído com sucesso!')
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

          // Refresh aggregated stats after update
          fetchSectionStats()
          
          // Track appointment update
          trackAppointment('Updated', {
            ...updatedAppointment,
            client_name: clients.find(c => c.id === parseInt(formData.client_id))?.name || 'Unknown',
            services_list: getSelectedServicesText(formData.services)
          })
          
          alert('Agendamento atualizado com sucesso!')
        } catch (apiError) {
          console.error('Failed to update appointment in backend:', apiError)
          
          // Check if it's a validation error from the backend
          if (apiError.response && apiError.response.data) {
            const errorData = apiError.response.data;
            let errorMessage = 'Ocorreu um erro de validação.';
            
            if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
              errorMessage = errorData.non_field_errors[0];
            } else if (Array.isArray(errorData) && errorData.length > 0) {
              errorMessage = errorData[0];
            } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
              const firstKey = Object.keys(errorData)[0];
              const errorValue = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey];
              errorMessage = `${firstKey}: ${errorValue}`;
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            }
            
            setConflictError(errorMessage);
            setIsSubmitting(false);
            return; // Don't close the form on validation error
          } else {
            // Network or other error - fallback to local update
            console.warn('Network error, updating locally:', apiError)
            const updatedAppointment = { ...editingAppointment, ...appointmentDataWithNames }
            setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updatedAppointment : a))
            alert('Agendamento atualizado localmente (backend indisponível)')
          }
        }
      } else {
        // Create new appointment in backend
        try {
          console.log('Sending appointment data to backend:', appointmentData)
          const response = await apiService.post('/api/appointments/', appointmentData)
          // Backend returns the appointment, but we need to add display names for frontend
          const newAppointment = response.data || response
          
          // Calculate total price and duration from services
          const { totalPrice, totalDuration } = (newAppointment.services || []).reduce((acc, serviceId) => {
            const service = services.find(s => s.id === serviceId)
            return {
              totalPrice: acc.totalPrice + (service ? parseFloat(service.price || 0) : 0),
              totalDuration: acc.totalDuration + (service ? parseInt(service.duration_minutes || 0) : 0)
            }
          }, { totalPrice: 0, totalDuration: 0 })
          
          const newWithNames = {
            ...newAppointment,
            client_id: appointmentDataWithNames.client_id,
            team_member_id: appointmentDataWithNames.team_member_id,
            client_name: appointmentDataWithNames.client_name,
            team_member_name: appointmentDataWithNames.team_member_name,
            services_list: appointmentDataWithNames.services_list,
            total_price: totalPrice,
            total_duration: totalDuration
          }
          setAppointments(prev => [...prev, newWithNames])

          // Refresh aggregated stats after creation
          fetchSectionStats()
          
          // Track appointment creation
          trackAppointment('Created', {
            ...response,
            client_name: clients.find(c => c.id === parseInt(formData.client_id))?.name || 'Unknown',
            services_list: getSelectedServicesText(formData.services)
          })
          
          alert('Agendamento criado com sucesso!')
        } catch (apiError) {
          console.error('Failed to create appointment in backend:', apiError)
          
          // Check if it's a validation error from the backend
          if (apiError.response && apiError.response.data) {
            const errorData = apiError.response.data;
            let errorMessage = 'Ocorreu um erro de validação.';
            
            if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
              errorMessage = errorData.non_field_errors[0];
            } else if (Array.isArray(errorData) && errorData.length > 0) {
              errorMessage = errorData[0];
            } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
              const firstKey = Object.keys(errorData)[0];
              const errorValue = Array.isArray(errorData[firstKey]) ? errorData[firstKey][0] : errorData[firstKey];
              errorMessage = `${firstKey}: ${errorValue}`;
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            }
            
            setConflictError(errorMessage);
            setIsSubmitting(false);
            return; // Don't close the form on validation error
          } else {
            // Network or other error - fallback to local creation
            console.warn('Network error, creating locally:', apiError)
            
            // Calculate duration for local mock data
            const totalDuration = (appointmentData.services || []).reduce((sum, serviceId) => {
              const service = services.find(s => s.id === serviceId)
              return sum + (service ? parseInt(service.duration_minutes || 0) : 0)
            }, 0)
            
            const newAppointment = { 
              id: Date.now(), 
              ...appointmentDataWithNames, 
              created_at: new Date().toISOString(),
              total_duration: totalDuration
            }
            setAppointments(prev => [...prev, newAppointment])
            alert('Agendamento criado localmente (backend indisponível)')
          }
        }
      }
      
      // Track service selections
      if (formData.services && formData.services.length > 0) {
        // Track each selected service
        const selectedServices = getAvailableServices(formData.team_member_id)
          .filter(service => formData.services.includes(service.value))
        
        selectedServices.forEach(service => {
          const serviceName = service.label.split(' - ')[0]
          const priceStr = service.label.split('R$ ')[1]
          const price = priceStr ? parseFloat(priceStr) : 0
          trackEvent('Service', 'Selected', serviceName, price)
        })
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
    setConflictError(null)
    
    // Track form cancellation
    trackEvent('Appointment', 'FormCancelled')
  }
  
  // Helper function to get text representation of selected services
  const getSelectedServicesText = (serviceIds) => {
    if (!serviceIds || !services) return ''
    
    return serviceIds
      .map(id => {
        const service = services.find(s => s.id === parseInt(id))
        return service ? service.name : ''
      })
      .filter(name => name)
      .join(', ')
  }

  // Define filters for the DataTable - wrapped in useMemo to prevent recreation on every render
  const tableFilters = useMemo(() => [
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
  ], [])

  // Initialize filters when component mounts
  useEffect(() => {
    const initialFilters = {
      appointment_date: { start: '', end: '' },
      status: ''
    }
    setActiveFilters(initialFilters)
  }, [])

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    console.log('Filters changed:', newFilters)
  }

  // Apply filters to appointments data - wrapped in useMemo to prevent infinite render loop
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Date range filter (matching original DataTable logic)
      if (activeFilters.appointment_date) {
        const filterValue = activeFilters.appointment_date
        if (filterValue.start || filterValue.end) {
          const itemValue = appointment.appointment_date
          if (!itemValue) return false
          
          // Parse date strings as local dates to avoid timezone issues
          let startDate = null
          let endDate = null
          let itemDate = null
          
          // Parse start date if exists
          if (filterValue.start) {
            const startParts = filterValue.start.split('-')
            if (startParts.length === 3) {
              startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]))
            }
          }
          
          // Parse end date if exists
          if (filterValue.end) {
            const endParts = filterValue.end.split('-')
            if (endParts.length === 3) {
              endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]))
            }
          }
          
          // Parse item date
          const itemParts = itemValue.split('-')
          if (itemParts.length === 3) {
            itemDate = new Date(parseInt(itemParts[0]), parseInt(itemParts[1]) - 1, parseInt(itemParts[2]))
          } else {
            itemDate = new Date(itemValue)
          }
          
          // If we have both start and end dates, check if item is in range
          if (startDate && endDate) {
            // Set end date to end of day for inclusive comparison
            endDate.setHours(23, 59, 59, 999)
            if (!(itemDate >= startDate && itemDate <= endDate)) {
              return false
            }
          }
          // If we only have start date, check if item is after or on start date
          else if (startDate) {
            if (!(itemDate >= startDate)) {
              return false
            }
          }
          // If we only have end date, check if item is before or on end date
          else if (endDate) {
            // Set end date to end of day for inclusive comparison
            endDate.setHours(23, 59, 59, 999)
            if (!(itemDate <= endDate)) {
              return false
            }
          }
        }
      }
      
      // Status filter
      if (activeFilters.status && activeFilters.status !== '') {
        if (appointment.status !== activeFilters.status) {
          return false
        }
      }
      
      return true
    });
  }, [appointments, activeFilters])
  
  // Skeleton component for stat cards
  const StatCardSkeleton = () => (
    <div className="stat-card skeleton-card">
      <div className="stat-icon skeleton"></div>
      <div className="stat-content">
        <div className="skeleton-text skeleton"></div>
        <div className="skeleton-text skeleton-small"></div>
      </div>
    </div>
  )

  // Stats for cards now come from backend via `stats` state

  return (
    <div className="appointments-section">
      {/* Statistics Cards - Always show icons to prevent blinking */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <>
              <h3>{stats.totalAppointments}</h3>
              <p>Total de Agendamentos</p>
            </>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📆</div>
          <div className="stat-content">
            <>
              <h3>{stats.todayAppointments}</h3>
              <p>Agendamentos de Hoje</p>
            </>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <>
              <h3>{stats.confirmedAppointments}</h3>
              <p>Confirmados</p>
            </>
          </div>
        </div>
        
        <div className="stat-card revenue-stat">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <>
              <h3>R$ {typeof stats.totalRevenue === 'number' ? stats.totalRevenue.toFixed(2) : stats.totalRevenue}</h3>
              <p>Receita Total</p>
            </>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        {tableFilters.length > 0 && (
          <div className="data-table-filters">
            {tableFilters.map(filter => (
              <div key={filter.key} className="filter-item">
                {filter.label && <label htmlFor={`filter-${filter.key}`}>{filter.label}:</label>}
                {filter.type === 'select' ? (
                  <FormControl size="small" className="mui-select-container">
                    <Select
                      id={`filter-${filter.key}`}
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      className="mui-select"
                      displayEmpty
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {filter.options.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : filter.type === 'dateRange' ? (
                  <div className="date-range-container">
                    <div className="date-range-field mui-date-field">
                      <span className="mui-date-label">De:</span>
                      <DatePicker
                        value={(activeFilters[filter.key] && activeFilters[filter.key].start) ? 
                          (() => {
                            const parts = activeFilters[filter.key].start.split('-')
                            if (parts.length === 3) {
                              return new Date(
                                parseInt(parts[0]), 
                                parseInt(parts[1]) - 1, 
                                parseInt(parts[2])
                              )
                            }
                            return null
                          })() : null}
                        onChange={(date) => {
                          const currentValue = activeFilters[filter.key] || {}
                          let dateStr = ''
                          if (date) {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            dateStr = `${year}-${month}-${day}`
                          }
                          handleFilterChange(filter.key, { ...currentValue, start: dateStr })
                        }}
                        slotProps={{ 
                          textField: { 
                            size: "small",
                            variant: "outlined",
                            InputProps: {
                              className: "mui-date-input"
                            }
                          } 
                        }}
                      />
                    </div>
                    <div className="date-range-field mui-date-field">
                      <span className="mui-date-label">Até:</span>
                      <DatePicker
                        value={(activeFilters[filter.key] && activeFilters[filter.key].end) ? 
                          (() => {
                            const parts = activeFilters[filter.key].end.split('-')
                            if (parts.length === 3) {
                              return new Date(
                                parseInt(parts[0]), 
                                parseInt(parts[1]) - 1, 
                                parseInt(parts[2])
                              )
                            }
                            return null
                          })() : null}
                        onChange={(date) => {
                          const currentValue = activeFilters[filter.key] || {}
                          let dateStr = ''
                          if (date) {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            dateStr = `${year}-${month}-${day}`
                          }
                          handleFilterChange(filter.key, { ...currentValue, end: dateStr })
                        }}
                        slotProps={{ 
                          textField: { 
                            size: "small",
                            variant: "outlined",
                            InputProps: {
                              className: "mui-date-input"
                            }
                          } 
                        }}
                      />
                    </div>
                  </div>
                ) : filter.type === 'date' ? (
                  <input
                    id={`filter-${filter.key}`}
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="filter-date"
                  />
                ) : (
                  <input
                    id={`filter-${filter.key}`}
                    type="text"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder || `Filtrar por ${filter.label}`}
                    className="filter-input"
                  />
                )}
              </div>
            ))}
            {(Object.entries(activeFilters).some(([key, val]) => {
              if (key === 'appointment_date') {
                return val && (val.start || val.end)
              }
              return val && val !== ''
            })) && (
              <button 
                className="btn-clear-filters"
                onClick={() => {
                  const resetFilters = {
                    appointment_date: { start: '', end: '' },
                    status: ''
                  }
                  setActiveFilters(resetFilters)
                }}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        )}
      </LocalizationProvider>

      <DataTable
        title="Agendamentos"
        columns={columns}
        data={filteredAppointments}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={tableLoading}
        emptyMessage="Nenhum agendamento encontrado. Crie seu primeiro agendamento para começar!"
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
