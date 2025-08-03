import { useState, useEffect } from 'react'
import './CrudForm.css'

const CrudForm = ({ 
  title, 
  fields, 
  data, 
  onSubmit, 
  onCancel, 
  isEdit = false,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Initialize form data
    const initialData = {}
    fields.forEach(field => {
      initialData[field.name] = data?.[field.name] || field.defaultValue || ''
    })
    setFormData(initialData)
  }, [fields, data])

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} é obrigatório`
      }
      
      if (field.validation && formData[field.name]) {
        const validationResult = field.validation(formData[field.name])
        if (validationResult !== true) {
          newErrors[field.name] = validationResult
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      value: formData[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target.value),
      className: `form-input ${errors[field.name] ? 'error' : ''}`,
      disabled: isLoading
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            {...commonProps}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={field.rows || 3}
            {...commonProps}
          />
        )
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Selecionar {field.label}</option>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'date':
        return (
          <input
            type="date"
            {...commonProps}
          />
        )
      
      case 'time':
        return (
          <input
            type="time"
            {...commonProps}
          />
        )
      
      case 'number':
        return (
          <input
            type="number"
            step={field.step || 'any'}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            {...commonProps}
          />
        )
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={formData[field.name] || false}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className={`form-checkbox ${errors[field.name] ? 'error' : ''}`}
            disabled={isLoading}
          />
        )
      
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            {...commonProps}
          />
        )
    }
  }

  return (
    <div className="crud-form-overlay">
      <div className="crud-form">
        <div className="crud-form-header">
          <h2>{isEdit ? `Editar ${title}` : `Adicionar Novo ${title}`}</h2>
          <button 
            type="button" 
            className="close-btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="crud-form-body">
          <div className="form-grid">
            {fields.map(field => (
              <div key={field.name} className={`form-group ${field.fullWidth ? 'full-width' : ''}`}>
                <label htmlFor={field.name} className="form-label">
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
                {renderField(field)}
                {errors[field.name] && (
                  <span className="error-message">{errors[field.name]}</span>
                )}
                {field.helpText && (
                  <span className="help-text">{field.helpText}</span>
                )}
              </div>
            ))}
          </div>

          <div className="crud-form-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CrudForm
