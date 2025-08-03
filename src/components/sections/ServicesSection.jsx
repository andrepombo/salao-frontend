import { useState, useEffect } from 'react'
import DataTable from '../DataTable'
import MuiCrudForm from '../MuiCrudForm'
import { apiService } from '../../services/api'

const ServicesSection = () => {
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const columns = [
    { key: 'name', label: 'Service Name' },
    { key: 'service_type', label: 'Type', type: 'badge', badgeColor: (value) => {
      const colors = {
        'cabelo': 'info',
        'unhas': 'success',
        'barba': 'warning',
        'maquiagem': 'danger',
        'pele': 'default'
      }
      return colors[value] || 'default'
    }},
    { key: 'duration_minutes', label: 'Duração (min)' },
    { key: 'price', label: 'Preço', type: 'currency' },
    { key: 'is_active', label: 'Ativo', type: 'boolean' },
    { key: 'created_at', label: 'Criado em', type: 'date' }
  ]

  const formFields = [
    {
      name: 'name',
      label: 'Nome do Serviço',
      type: 'text',
      required: true,
      placeholder: 'Digite o nome do serviço'
    },
    {
      name: 'service_type',
      label: 'Tipo de Serviço',
      type: 'select',
      required: true,
      options: [
        { value: 'cabelo', label: 'Cabelo' },
        { value: 'unhas', label: 'Unhas' },
        { value: 'barba', label: 'Barba' },
        { value: 'maquiagem', label: 'Maquiagem' },
        { value: 'pele', label: 'Pele' }
      ]
    },
    {
      name: 'description',
      label: 'Descrição',
      type: 'textarea',
      fullWidth: true,
      placeholder: 'Descreva os detalhes do serviço'
    },
    {
      name: 'duration_minutes',
      label: 'Duração (minutos)',
      type: 'number',
      required: true,
      min: 1,
      max: 480,
      placeholder: '60',
      helpText: 'Duração do serviço em minutos'
    },
    {
      name: 'price',
      label: 'Preço',
      type: 'number',
      required: true,
      min: 0,
      step: 0.01,
      placeholder: '50.00',
      helpText: 'Preço do serviço em reais'
    },
    {
      name: 'is_active',
      label: 'Serviço Ativo',
      type: 'checkbox',
      defaultValue: true,
      helpText: 'Se este serviço está disponível atualmente'
    }
  ]

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      // Mock data for development
      const mockServices = [
        {
          id: 1,
          name: 'Corte Feminino',
          service_type: 'cabelo',
          description: 'Corte de cabelo feminino com lavagem e finalização',
          duration_minutes: 60,
          price: 45.00,
          is_active: true,
          created_at: '2024-01-10T08:00:00Z'
        },
        {
          id: 2,
          name: 'Corte Masculino',
          service_type: 'cabelo',
          description: 'Corte de cabelo masculino tradicional',
          duration_minutes: 30,
          price: 25.00,
          is_active: true,
          created_at: '2024-01-10T08:30:00Z'
        },
        {
          id: 3,
          name: 'Coloração Completa',
          service_type: 'cabelo',
          description: 'Coloração completa do cabelo com produtos premium',
          duration_minutes: 180,
          price: 120.00,
          is_active: true,
          created_at: '2024-01-10T09:00:00Z'
        },
        {
          id: 4,
          name: 'Manicure',
          service_type: 'unhas',
          description: 'Cuidados completos para as unhas das mãos',
          duration_minutes: 45,
          price: 20.00,
          is_active: true,
          created_at: '2024-01-10T09:30:00Z'
        },
        {
          id: 5,
          name: 'Barba Completa',
          service_type: 'barba',
          description: 'Aparar e modelar barba com produtos especializados',
          duration_minutes: 40,
          price: 30.00,
          is_active: true,
          created_at: '2024-01-10T10:00:00Z'
        }
      ]
      setServices(mockServices)
    } catch (error) {
      console.error('Error loading services:', error)
      setServices([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingService(null)
    setShowForm(true)
  }

  const handleEdit = (service) => {
    setEditingService(service)
    setShowForm(true)
  }

  const handleDelete = async (service) => {
    if (window.confirm(`Are you sure you want to delete ${service.name}?`)) {
      try {
        // await apiService.delete(`/api/services/${service.id}/`)
        setServices(prev => prev.filter(s => s.id !== service.id))
        alert('Service deleted successfully!')
      } catch (error) {
        console.error('Error deleting service:', error)
        alert('Error deleting service. Please try again.')
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      
      if (editingService) {
        // Update existing service
        const updatedService = { ...editingService, ...formData }
        setServices(prev => prev.map(s => s.id === editingService.id ? updatedService : s))
        alert('Service updated successfully!')
      } else {
        // Create new service
        const newService = { 
          id: Date.now(), 
          ...formData, 
          created_at: new Date().toISOString() 
        }
        setServices(prev => [...prev, newService])
        alert('Service created successfully!')
      }
      
      setShowForm(false)
      setEditingService(null)
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Error saving service. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingService(null)
  }

  return (
    <div>
      <DataTable
        title="Services"
        columns={columns}
        data={services}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="No services registered yet. Add your first service to get started!"
      />

      {showForm && (
        <MuiCrudForm
          title="Service"
          fields={formFields}
          data={editingService}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={!!editingService}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}

export default ServicesSection
