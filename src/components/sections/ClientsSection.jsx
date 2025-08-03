import { useState, useEffect } from 'react'
import DataTable from '../DataTable'
import MuiCrudForm from '../MuiCrudForm'
import { apiService } from '../../services/api'

const ClientsSection = () => {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
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
    { key: 'gender', label: 'Gênero' },
    { key: 'birthday', label: 'Aniversário', type: 'date' },
    { key: 'created_at', label: 'Criado em', type: 'date' }
  ]

  const formFields = [
    {
      name: 'name',
      label: 'Nome Completo',
      type: 'text',
      required: true,
      placeholder: 'Digite o nome do cliente'
    },
    {
      name: 'phone',
      label: 'Número de Telefone',
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
      placeholder: 'cliente@exemplo.com'
    },
    {
      name: 'address',
      label: 'Endereço',
      type: 'textarea',
      fullWidth: true,
      placeholder: 'Digite o endereço do cliente'
    },
    {
      name: 'birthday',
      label: 'Aniversário',
      type: 'date',
      helpText: 'Data de nascimento do cliente'
    },
    {
      name: 'gender',
      label: 'Gênero',
      type: 'select',
      fullWidth: true,
      options: [
        { value: 'M', label: 'Masculino' },
        { value: 'F', label: 'Feminino' },
        { value: 'O', label: 'Outro' }
      ]
    }
  ]

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.get('/api/clients/')
      console.log('Loaded clients from backend:', response)
      // Handle paginated response from Django REST framework
      const clientsData = response.results || response || []
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading clients:', error)
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingClient(null)
    setShowForm(true)
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setShowForm(true)
  }

  const handleDelete = async (client) => {
    if (window.confirm(`Tem certeza que deseja excluir ${client.name}?`)) {
      try {
        await apiService.delete(`/api/clients/${client.id}/`)
        setClients(prev => prev.filter(c => c.id !== client.id))
        alert('Cliente excluído com sucesso!')
      } catch (error) {
        console.error('Error deleting client:', error)
        alert('Erro ao excluir cliente. Tente novamente.')
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
      if (apiData.birthday === '') apiData.birthday = null
      if (apiData.gender === '') apiData.gender = null
      
      // Debug: Log the data being sent to API
      console.log('Sending data to API:', apiData)
      
      if (editingClient) {
        // Update existing client
        const updatedClient = await apiService.put(`/api/clients/${editingClient.id}/`, apiData)
        setClients(prev => prev.map(c => c.id === editingClient.id ? updatedClient : c))
        alert('Cliente atualizado com sucesso!')
      } else {
        // Create new client
        const newClient = await apiService.post('/api/clients/', apiData)
        setClients(prev => [...prev, newClient])
        alert('Cliente criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingClient(null)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      console.error('Error details:', error.response?.data || error.message)
      alert('Erro ao salvar cliente. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingClient(null)
  }

  return (
    <div>
      <DataTable
        title="Clientes"
        columns={columns}
        data={clients}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage="Nenhum cliente cadastrado ainda. Adicione seu primeiro cliente para começar!"
      />

      {showForm && (
        <MuiCrudForm
          title="Cliente"
          fields={formFields}
          data={editingClient}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={!!editingClient}
          isLoading={isSubmitting}
        />
      )}
    </div>
  )
}

export default ClientsSection
