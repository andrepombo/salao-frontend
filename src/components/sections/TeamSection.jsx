import { useState, useEffect } from 'react'
import DataTable from '../DataTable'
import CrudForm from '../CrudForm'
import { apiService } from '../../services/api'

const TeamSection = () => {
  const [teamMembers, setTeamMembers] = useState([])
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'hire_date', label: 'Hire Date', type: 'date' },
    { key: 'is_active', label: 'Status', type: 'boolean' },
    { key: 'specialties_count', label: 'Specialties' }
  ]

  const formFields = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter team member name'
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      placeholder: '+1234567890',
      validation: (value) => {
        const phoneRegex = /^\+?1?\d{9,15}$/
        return phoneRegex.test(value) || 'Please enter a valid phone number'
      }
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'member@salon.com'
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      fullWidth: true,
      placeholder: 'Enter team member address'
    },
    {
      name: 'hire_date',
      label: 'Hire Date',
      type: 'date',
      required: true,
      helpText: 'Date when the team member was hired'
    },
    {
      name: 'is_active',
      label: 'Active Status',
      type: 'checkbox',
      defaultValue: true,
      helpText: 'Whether this team member is currently active'
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
          phone: '+5511987654321',
          email: 'ana@salon.com',
          hire_date: '2023-03-15',
          is_active: true,
          specialties_count: 3,
          address: 'Rua Augusta, 789',
          created_at: '2023-03-15T09:00:00Z'
        },
        {
          id: 2,
          name: 'Carlos Mendes',
          phone: '+5511876543210',
          email: 'carlos@salon.com',
          hire_date: '2023-06-01',
          is_active: true,
          specialties_count: 2,
          address: 'Av. Faria Lima, 321',
          created_at: '2023-06-01T10:30:00Z'
        }
      ]
      setTeamMembers(mockTeamMembers)
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
    if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
      try {
        // await apiService.delete(`/api/team/${member.id}/`)
        setTeamMembers(prev => prev.filter(m => m.id !== member.id))
        alert('Team member deleted successfully!')
      } catch (error) {
        console.error('Error deleting team member:', error)
        alert('Error deleting team member. Please try again.')
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      
      if (editingMember) {
        // Update existing team member
        const updatedMember = { ...editingMember, ...formData }
        setTeamMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m))
        alert('Team member updated successfully!')
      } else {
        // Create new team member
        const newMember = { 
          id: Date.now(), 
          ...formData, 
          specialties_count: 0,
          created_at: new Date().toISOString() 
        }
        setTeamMembers(prev => [...prev, newMember])
        alert('Team member created successfully!')
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
        title="Team Members"
        columns={columns}
        data={teamMembers}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="No team members registered yet. Add your first team member to get started!"
      />

      {showForm && (
        <CrudForm
          title="Team Member"
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
