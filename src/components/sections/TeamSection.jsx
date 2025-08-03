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
    { key: 'phone', label: 'Telefone' },
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
      // Mock data for development
      const mockTeamMembers = [
        {
          id: 1,
          name: 'Ana Costa',
          phone: '11987654321',
          email: 'ana@salon.com',
          hire_date: '2023-03-15',
          is_active: true,
          specialties: [1, 2, 3], // Corte Feminino, Corte Masculino, Coloração
          address: 'Rua Augusta, 789',
          created_at: '2023-03-15T09:00:00Z'
        },
        {
          id: 2,
          name: 'Carlos Mendes',
          phone: '11876543210',
          email: 'carlos@salon.com',
          hire_date: '2023-06-01',
          is_active: true,
          specialties: [4, 5], // Manicure, Pedicure
          address: 'Av. Faria Lima, 321',
          created_at: '2023-06-01T10:30:00Z'
        }
      ]
      
      // Add dynamic specialties_count to each team member
      const processedTeamMembers = mockTeamMembers.map(member => ({
        ...member,
        specialties_count: member.specialties ? member.specialties.length : 0
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
      // Mock services data
      const mockServices = [
        { id: 1, name: 'Corte Feminino', service_type: 'cabelo' },
        { id: 2, name: 'Corte Masculino', service_type: 'cabelo' },
        { id: 3, name: 'Coloração', service_type: 'cabelo' },
        { id: 4, name: 'Manicure', service_type: 'unhas' },
        { id: 5, name: 'Pedicure', service_type: 'unhas' }
      ]
      setServices(mockServices)
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
        // await apiService.delete(`/api/team/${member.id}/`)
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
      
      if (editingMember) {
        // Update existing team member
        const updatedMember = { 
          ...editingMember, 
          ...formData,
          specialties_count: formData.specialties ? formData.specialties.length : 0
        }
        setTeamMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m))
        alert('Profissional atualizado com sucesso!')
      } else {
        // Create new team member
        const newMember = { 
          id: Date.now(), 
          ...formData, 
          specialties_count: formData.specialties ? formData.specialties.length : 0,
          created_at: new Date().toISOString() 
        }
        setTeamMembers(prev => [...prev, newMember])
        alert('Profissional criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingMember(null)
    } catch (error) {
      console.error('Error saving team member:', error)
      alert('Error saving team member. Please try again.')
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
