import { useState, useEffect } from 'react'
import DataTable from '../DataTable'
import MuiCrudForm from '../MuiCrudForm'
import { apiService } from '../../services/api'
import { trackClient } from '../../services/analytics'

const ClientsSection = ({ language = 'pt' }) => {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const columns = [
    { key: 'name', label: language === 'en' ? 'Name' : 'Nome' },
    { 
      key: 'formatted_phone', 
      label: language === 'en' ? 'Phone' : 'Telefone',
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
    { key: 'gender', label: language === 'en' ? 'Gender' : 'Gênero' },
    { key: 'birthday', label: language === 'en' ? 'Birthday' : 'Aniversário', type: 'date' },
    { key: 'created_at', label: language === 'en' ? 'Created at' : 'Criado em', type: 'date' }
  ]

  const formFields = [
    {
      name: 'name',
      label: language === 'en' ? 'Full Name' : 'Nome Completo',
      type: 'text',
      required: true,
      placeholder: 'Digite o nome do cliente'
    },
    {
      name: 'phone',
      label: language === 'en' ? 'Phone Number' : 'Número de Telefone',
      type: 'tel',
      required: true,
      placeholder: '11987654321',
      validation: (value) => {
        const phoneRegex = /^\d{11}$/
        return phoneRegex.test(value) || (language === 'en' ? 'Please enter exactly 11 digits' : 'Por favor, digite exatamente 11 dígitos')
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
      label: language === 'en' ? 'Address' : 'Endereço',
      type: 'textarea',
      fullWidth: true,
      placeholder: 'Digite o endereço do cliente'
    },
    {
      name: 'birthday',
      label: language === 'en' ? 'Birthday' : 'Aniversário',
      type: 'date',
      helpText: 'Data de nascimento do cliente'
    },
    {
      name: 'gender',
      label: language === 'en' ? 'Gender' : 'Gênero',
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
    if (window.confirm(language === 'en' 
      ? `Are you sure you want to delete ${client.name}?` 
      : `Tem certeza que deseja excluir ${client.name}?`)) {
      try {
        await apiService.delete(`/api/clients/${client.id}/`)
        setClients(prev => prev.filter(c => c.id !== client.id))
        
        // Track client deletion
        trackClient('Deleted', client)
        
        alert(language === 'en' ? 'Client deleted successfully!' : 'Cliente excluído com sucesso!')
      } catch (error) {
        console.error('Error deleting client:', error)
        alert(language === 'en' ? 'Error deleting client. Please try again.' : 'Erro ao excluir cliente. Tente novamente.')
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
        
        // Track client update
        trackClient('Updated', updatedClient)
        
        alert('Cliente atualizado com sucesso!')
      } else {
        // Create new client
        const newClient = await apiService.post('/api/clients/', apiData)
        setClients(prev => [...prev, newClient])
        
        // Track client creation
        trackClient('Created', newClient)
        
        alert('Cliente criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingClient(null)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      console.error('Error details:', error.response?.data || error.message)
      alert(language === 'en' ? 'Error saving client. Please try again.' : 'Erro ao salvar cliente. Tente novamente.')
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
        title={language === 'en' ? 'Clients' : 'Clientes'}
        columns={columns}
        data={clients}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        emptyMessage={language === 'en' 
          ? 'No clients yet. Add your first client to get started!'
          : 'Nenhum cliente cadastrado ainda. Adicione seu primeiro cliente para começar!'}
        language={language}
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
