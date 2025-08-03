import { useState, useEffect } from 'react'
import DataTable from '../DataTable'
import MuiCrudForm from '../MuiCrudForm'
import { apiService } from '../../services/api'

const TeamSection = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const columns = [
    { key: 'name', label: 'Nome' },
    { 
      key: 'formatted_phone', 
      label: 'Telefone',
      type: 'custom',
      render: (value, row) => {
        // Use formatted_phone from API if available, otherwise format the raw phone
        if (value) return value
        if (row.phone) {
          const digits = row.phone.replace(/\D/g, '')
          if (digits.length === 11) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
          }
          return row.phone
        }
        return '-'
      }
    },
    { key: 'email', label: 'Email' },
    { key: 'hire_date', label: 'Data de Contratação', type: 'date' },
    { key: 'is_active', label: 'Status', type: 'boolean' },
    { key: 'specialties_count', label: 'Especialidades' }
  ]

  const formFields = [
    {
      name: 'name',
      label: 'Nome Completo',
      type: 'text',
      required: true,
      placeholder: 'Digite o nome do profissional'
    },
    {
      name: 'phone',
      label: 'Telefone',
      type: 'tel',
      required: true,
      placeholder: '11987654321',
      validation: (value) => {
        const phoneRegex = /^\d{11}$/
        return phoneRegex.test(value) || 'Por favor, digite exatamente 11 dígitos'
      },
      format: (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '')
        // Limit to 11 digits
        const limited = digits.substring(0, 11)
        // Format as (xx) xxxxx-xxxx if we have enough digits
        if (limited.length >= 11) {
          return `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7, 11)}`
        } else if (limited.length >= 7) {
          return `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7)}`
        } else if (limited.length >= 2) {
          return `(${limited.substring(0, 2)}) ${limited.substring(2)}`
        }
        return limited
      }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'profissional@salao.com'
    },
    {
      name: 'address',
      label: 'Endereço',
      type: 'textarea',
      fullWidth: true,
      placeholder: 'Digite o endereço do profissional'
    },
    {
      name: 'hire_date',
      label: 'Data de Contratação',
      type: 'date',
      required: true,
      helpText: 'Data em que o profissional foi contratado'
    },
    {
      name: 'is_active',
      label: 'Status Ativo',
      type: 'checkbox',
      defaultValue: true,
      helpText: 'Se este profissional está atualmente ativo'
    },
    {
      name: 'specialties',
      label: 'Especialidades',
      type: 'multiselect',
      required: false,
      options: services.map(service => ({ value: service.id, label: service.name })),
      placeholder: 'Selecione as especialidades do profissional',
      helpText: 'Serviços que este profissional pode realizar'
    }
  ]

  useEffect(() => {
    loadTeamMembers()
    loadServices()
  }, [])

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.get('/api/team/')
      console.log('Loaded team members from backend:', response)
      // Handle paginated response from Django REST framework
      const teamData = response.results || response || []
      
      // Add dynamic specialties_count to each team member if not already present
      const processedTeamMembers = teamData.map(member => ({
        ...member,
        specialties_count: member.specialties_count || (member.specialties ? member.specialties.length : 0)
      }))
      
      setTeamMembers(processedTeamMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
      setTeamMembers([])
    } finally {
      setIsLoading(false)
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
    setEditingMember(null)
    setShowForm(true)
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setShowForm(true)
  }

  const handleDelete = async (member) => {
    if (window.confirm(`Tem certeza que deseja excluir ${member.name}?`)) {
      try {
        await apiService.delete(`/api/team/${member.id}/`)
        setTeamMembers(prev => prev.filter(m => m.id !== member.id))
        alert('Profissional excluído com sucesso!')
      } catch (error) {
        console.error('Error deleting team member:', error)
        alert('Erro ao excluir profissional. Tente novamente.')
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      
      // Extract raw phone digits for API submission and clean up empty fields
      const apiData = { ...formData }
      
      // Clean phone number - remove formatting, keep only digits
      if (apiData.phone) {
        apiData.phone = apiData.phone.replace(/\D/g, '') // Remove formatting, keep only digits
      }
      
      // Clean up empty string fields - convert to null for optional fields
      if (apiData.email === '') apiData.email = null
      if (apiData.address === '') apiData.address = null
      
      // Debug: Log the data being sent to API
      console.log('Sending team data to API:', apiData)
      
      if (editingMember) {
        // Update existing team member
        const updatedMember = await apiService.put(`/api/team/${editingMember.id}/`, apiData)
        setTeamMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m))
        alert('Profissional atualizado com sucesso!')
      } else {
        // Create new team member
        const newMember = await apiService.post('/api/team/', apiData)
        setTeamMembers(prev => [...prev, newMember])
        alert('Profissional criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingMember(null)
    } catch (error) {
      console.error('Error saving team member:', error)
      console.error('Error details:', error.response?.data || error.message)
      alert('Erro ao salvar profissional. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingMember(null)
  }

  return (
    <div>
      <DataTable
        title="Equipe"
        columns={columns}
        data={teamMembers}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="Nenhum profissional cadastrado ainda. Adicione seu primeiro profissional para começar!"
      />

      {showForm && (
        <MuiCrudForm
          title="Profissional"
          fields={formFields}
          data={editingMember}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={!!editingMember}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}

export default TeamSection
