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
    { key: 'name', label: 'Nome do Serviço' },
    { key: 'service_type', label: 'Tipo', type: 'badge', badgeColor: (value) => {
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
      fullWidth: true,
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
      const response = await apiService.get('/api/services/')
      console.log('Loaded services from backend:', response)
      // Handle paginated response from Django REST framework
      const servicesData = response.results || response || []
      setServices(servicesData)
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
    if (window.confirm(`Tem certeza que deseja excluir ${service.name}?`)) {
      try {
        await apiService.delete(`/api/services/${service.id}/`)
        setServices(prev => prev.filter(s => s.id !== service.id))
        alert('Serviço excluído com sucesso!')
      } catch (error) {
        console.error('Error deleting service:', error)
        alert('Erro ao excluir serviço. Tente novamente.')
      }
    }
  }

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true)
      
      // Clean up empty string fields - convert to null for optional fields
      const apiData = { ...formData }
      if (apiData.description === '') apiData.description = null
      
      // Debug: Log the data being sent to API
      console.log('Sending service data to API:', apiData)
      
      if (editingService) {
        // Update existing service
        const updatedService = await apiService.put(`/api/services/${editingService.id}/`, apiData)
        setServices(prev => prev.map(s => s.id === editingService.id ? updatedService : s))
        alert('Serviço atualizado com sucesso!')
      } else {
        // Create new service
        const newService = await apiService.post('/api/services/', apiData)
        setServices(prev => [...prev, newService])
        alert('Serviço criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingService(null)
    } catch (error) {
      console.error('Error saving service:', error)
      console.error('Error details:', error.response?.data || error.message)
      alert('Erro ao salvar serviço. Tente novamente.')
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
        title="Serviços"
        columns={columns}
        data={services}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="Nenhum serviço cadastrado ainda. Adicione seu primeiro serviço para começar!"
      />

      {showForm && (
        <MuiCrudForm
          title="Serviço"
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
