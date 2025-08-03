import { useState } from 'react'
import './DataTable.css'

const DataTable = ({ 
  title, 
  columns, 
  data, 
  onAdd, 
  onEdit, 
  onDelete, 
  isLoading = false,
  emptyMessage = "Nenhum dado disponível"
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  // Filter data based on search term
  const filteredData = data.filter(item => {
    if (!searchTerm) return true
    
    return columns.some(column => {
      const value = item[column.key]
      if (value === null || value === undefined) return false
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    const comparison = aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true })
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const renderCellValue = (value, column) => {
    if (value === null || value === undefined) return '-'
    
    switch (column.type) {
      case 'custom':
        return column.render ? column.render(value) : value.toString()
      case 'date':
        return new Date(value).toLocaleDateString()
      case 'time':
        return new Date(`1970-01-01T${value}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      case 'currency':
        return `$${parseFloat(value).toFixed(2)}`
      case 'boolean':
        return value ? '✅' : '❌'
      case 'badge':
        return <span className={`badge badge-${column.badgeColor?.(value) || 'default'}`}>{value}</span>
      default:
        return value.toString()
    }
  }

  return (
    <div className="data-table-container">
      <div className="data-table-header">
        <div className="header-left">
          <h2 className="table-title">{title}</h2>
          <span className="item-count">{filteredData.length} itens</span>
        </div>
        <div className="header-right">
          <div className="search-box">
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button 
            className="btn btn-primary add-btn"
            onClick={onAdd}
            disabled={isLoading}
          >
            <span>+</span>
            Adicionar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Nenhum {title.toLowerCase()} encontrado</h3>
          <p>{searchTerm ? `Nenhum resultado para "${searchTerm}"` : emptyMessage}</p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={onAdd}>
              Adicionar Primeiro {title.slice(0, -1)}
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(column => (
                  <th 
                    key={column.key}
                    className={`table-header ${column.sortable !== false ? 'sortable' : ''} ${sortColumn === column.key ? 'sorted' : ''}`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="header-content">
                      <span>{column.label}</span>
                      {column.sortable !== false && (
                        <span className="sort-icon">
                          {sortColumn === column.key ? (
                            sortDirection === 'asc' ? '↑' : '↓'
                          ) : '↕️'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="table-header actions-header">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={item.id || index} className="table-row">
                  {columns.map(column => (
                    <td key={column.key} className="table-cell">
                      {renderCellValue(item[column.key], column)}
                    </td>
                  ))}
                  <td className="table-cell actions-cell">
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => onEdit(item)}
                        title="Editar"
                        style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold', 
                          color: '#333',
                          backgroundColor: '#ffc107',
                          borderColor: '#ffc107'
                        }}
                      >
                        ↻
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(item)}
                        title="Excluir"
                        style={{ color: 'white', fontSize: '14px' }}
                      >
                        ✖
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DataTable
