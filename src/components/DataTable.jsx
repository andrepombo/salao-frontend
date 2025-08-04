import { useState, useEffect } from 'react'
import './DataTable.css'
import { TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'

const DataTable = ({ 
  title, 
  columns, 
  data, 
  onAdd, 
  onEdit, 
  onDelete, 
  isLoading = false,
  emptyMessage = "Nenhum dado disponível",
  filters = [],
  onFilterChange = null
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [activeFilters, setActiveFilters] = useState({})

  // Initialize filters when component mounts or filters prop changes
  useEffect(() => {
    const initialFilters = {}
    filters.forEach(filter => {
      initialFilters[filter.key] = filter.defaultValue || ''
    })
    setActiveFilters(initialFilters)
  }, [filters])

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    
    // Call parent component's filter handler if provided
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  // Apply filters to data
  const applyFilters = (data) => {
    return data.filter(item => {
      // Check if item passes all active filters
      return filters.every(filter => {
        const filterValue = activeFilters[filter.key]
        if (!filterValue || filterValue === '') return true
        
        const itemValue = item[filter.key]
        if (itemValue === null || itemValue === undefined) return false
        
        switch (filter.type) {
          case 'date':
            // For date filters, compare YYYY-MM-DD format
            return itemValue.startsWith(filterValue)
          case 'select':
            // For select filters, exact match
            return itemValue === filterValue
          default:
            // Default string contains
            return itemValue.toString().toLowerCase().includes(filterValue.toLowerCase())
        }
      })
    })
  }

  // Filter data based on search term and active filters
  const filteredData = data.filter(item => {
    // First apply custom filters
    const passesCustomFilters = filters.every(filter => {
      const filterValue = activeFilters[filter.key]
      if (!filterValue || filterValue === '') return true
      
      const itemValue = item[filter.key]
      if (itemValue === null || itemValue === undefined) return false
      
      switch (filter.type) {
        case 'dateRange':
          // For date range filters
          if (!filterValue) return true
          
          const startDate = filterValue.start ? new Date(filterValue.start) : null
          const endDate = filterValue.end ? new Date(filterValue.end) : null
          const itemDate = new Date(itemValue)
          
          // If we have both start and end dates, check if item is in range
          if (startDate && endDate) {
            // Set end date to end of day for inclusive comparison
            endDate.setHours(23, 59, 59, 999)
            return itemDate >= startDate && itemDate <= endDate
          }
          // If we only have start date, check if item is after or on start date
          else if (startDate) {
            return itemDate >= startDate
          }
          // If we only have end date, check if item is before or on end date
          else if (endDate) {
            // Set end date to end of day for inclusive comparison
            endDate.setHours(23, 59, 59, 999)
            return itemDate <= endDate
          }
          return true
        case 'date':
          // For date filters, compare YYYY-MM-DD format
          return itemValue.startsWith(filterValue)
        case 'select':
          // For select filters, exact match
          return itemValue === filterValue
        default:
          // Default string contains
          return itemValue.toString().toLowerCase().includes(filterValue.toLowerCase())
      }
    })
    
    if (!passesCustomFilters) return false
    
    // Then apply search term filter
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

  // Function to safely format dates without timezone conversion issues
  const formatDateSafe = (dateString) => {
    if (!dateString) return '-'
    
    // Parse date string as local date to avoid timezone conversion
    const parts = dateString.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0])
      const month = parseInt(parts[1]) - 1 // Month is 0-indexed
      const day = parseInt(parts[2])
      const localDate = new Date(year, month, day)
      return localDate.toLocaleDateString('pt-BR')
    }
    
    // Fallback for other date formats
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const renderCellValue = (value, column) => {
    if (value === null || value === undefined) return '-'
    
    switch (column.type) {
      case 'custom':
        return column.render ? column.render(value) : value.toString()
      case 'date':
        return formatDateSafe(value)
      case 'time':
        return new Date(`1970-01-01T${value}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      case 'currency':
        return `R$ ${parseFloat(value).toFixed(2)}`
      case 'boolean':
        return value ? '✅' : '❌'
      case 'badge':
        const displayValue = column.render ? column.render(value) : value
        return <span className={`badge badge-${column.badgeColor?.(value) || 'default'}`}>{displayValue}</span>
      default:
        return column.render ? column.render(value) : value.toString()
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
      
      {/* Filters section */}
      {filters.length > 0 && (
        <div className="data-table-filters">
          {filters.map(filter => (
            <div key={filter.key} className="filter-item">
              {filter.label && <label htmlFor={`filter-${filter.key}`}>{filter.label}:</label>}
              {filter.type === 'select' ? (
                <select
                  id={`filter-${filter.key}`}
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos</option>
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : filter.type === 'dateRange' ? (
                <div className="date-range-container">
                  <div className="date-range-field mui-date-field">
                    <span className="mui-date-label">De:</span>
                    <DatePicker
                      value={(activeFilters[filter.key] && activeFilters[filter.key].start) ? 
                        new Date(activeFilters[filter.key].start) : null}
                      onChange={(date) => {
                        const currentValue = activeFilters[filter.key] || {}
                        const dateStr = date ? date.toISOString().split('T')[0] : ''
                        handleFilterChange(filter.key, { ...currentValue, start: dateStr })
                      }}
                      slotProps={{ 
                        textField: { 
                          size: "small",
                          variant: "outlined",
                          InputProps: {
                            className: "mui-date-input"
                          }
                        } 
                      }}
                    />
                  </div>
                  <div className="date-range-field mui-date-field">
                    <span className="mui-date-label">Até:</span>
                    <DatePicker
                      value={(activeFilters[filter.key] && activeFilters[filter.key].end) ? 
                        new Date(activeFilters[filter.key].end) : null}
                      onChange={(date) => {
                        const currentValue = activeFilters[filter.key] || {}
                        const dateStr = date ? date.toISOString().split('T')[0] : ''
                        handleFilterChange(filter.key, { ...currentValue, end: dateStr })
                      }}
                      slotProps={{ 
                        textField: { 
                          size: "small",
                          variant: "outlined",
                          InputProps: {
                            className: "mui-date-input"
                          }
                        } 
                      }}
                    />
                  </div>
                </div>
              ) : filter.type === 'date' ? (
                <input
                  id={`filter-${filter.key}`}
                  type="date"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="filter-date"
                />
              ) : (
                <input
                  id={`filter-${filter.key}`}
                  type="text"
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder || `Filtrar por ${filter.label}`}
                  className="filter-input"
                />
              )}
            </div>
          ))}
          {Object.values(activeFilters).some(val => val && val !== '') && (
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                const resetFilters = {}
                filters.forEach(filter => {
                  resetFilters[filter.key] = ''
                })
                setActiveFilters(resetFilters)
                if (onFilterChange) onFilterChange(resetFilters)
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

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
