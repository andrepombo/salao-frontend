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
      key: 'phone', 
      label: 'Telefone',
      type: 'custom',
      render: (value) => {
        // Apply Brazilian phone mask: (xx) xxxxx-xxxx
        if (!value) return '-'
        const digits = value.replace(/\D/g, '')
        if (digits.length === 11) {
          return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
        }
        return value // Return original if not 11 digits
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
      // For now, using mock data since backend endpoints might not be ready
      const mockClients = [
        {
          id: 1,
          name: 'Maria Silva',
          phone: '11999887766',
          email: 'maria@email.com',
          gender: 'F',
          birthday: '1990-05-15',
          address: 'Rua das Flores, 123',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'João Santos',
          phone: '11888776655',
          email: 'joao@email.com',
          gender: 'M',
          birthday: '1985-12-03',
          address: 'Av. Paulista, 456',
          created_at: '2024-01-20T14:15:00Z'
        }
      ]
      setClients(mockClients)
    } catch (error) {
      console.error('Error loading clients:', error)
      // For development, we'll use mock data
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
        // await apiService.delete(`/api/clients/${client.id}/`)
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
      
      if (editingClient) {
        // Update existing client
        // const updatedClient = await apiService.put(`/api/clients/${editingClient.id}/`, formData)
        const updatedClient = { ...editingClient, ...formData }
        setClients(prev => prev.map(c => c.id === editingClient.id ? updatedClient : c))
        alert('Cliente atualizado com sucesso!')
      } else {
        // Create new client
        // const newClient = await apiService.post('/api/clients/', formData)
        const newClient = { 
          id: Date.now(), 
          ...formData, 
          created_at: new Date().toISOString() 
        }
        setClients(prev => [...prev, newClient])
        alert('Cliente criado com sucesso!')
      }
      
      setShowForm(false)
      setEditingClient(null)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
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
