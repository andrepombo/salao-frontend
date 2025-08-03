import { useState, useEffect } from 'react'
import DataTable from '../DataTable'
import CrudForm from '../CrudForm'
import { apiService } from '../../services/api'

const ClientsSection = () => {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'phone', label: 'Telefone' },
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
      placeholder: '+5511999887766',
      validation: (value) => {
        const phoneRegex = /^\+?1?\d{9,15}$/
        return phoneRegex.test(value) || 'Por favor, digite um número de telefone válido'
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
          phone: '+5511999887766',
          email: 'maria@email.com',
          gender: 'F',
          birthday: '1990-05-15',
          address: 'Rua das Flores, 123',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'João Santos',
          phone: '+5511888776655',
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
        <CrudForm
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
