import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  FormHelperText,
  Slide,
  Paper,
  Divider,
  Chip,
  Avatar
} from '@mui/material'
import { 
  Close as CloseIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material'

// Transition component for smooth dialog animation
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />
})

const MuiCrudForm = ({ 
  title, 
  fields, 
  data, 
  onSubmit, 
  onCancel, 
  isEdit = false,
  isLoading = false,
  open = true
}) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Only initialize form data when data prop changes (editing vs creating)
    // Don't reinitialize when fields change (e.g., when options update)
    const initialData = {}
    fields.forEach(field => {
      let value = data?.[field.name] || field.defaultValue
      
      // Set default values based on field type
      if (value === undefined || value === null) {
        if (field.type === 'multiselect') {
          value = []
        } else {
          value = ''
        }
      }
      
      // Format phone numbers for display if editing existing data
      if (field.type === 'tel' && value && field.format) {
        value = field.format(value)
      }
      
      initialData[field.name] = value
    })
    setFormData(initialData)
  }, [data]) // Only depend on data, not fields

  // Handle new fields being added without clearing existing form data
  useEffect(() => {
    setFormData(prevFormData => {
      const newFormData = { ...prevFormData }
      let hasChanges = false
      
      fields.forEach(field => {
        // Only add field if it doesn't exist in current form data
        if (!(field.name in newFormData)) {
          let value = field.defaultValue
          
          // Set default values based on field type
          if (value === undefined || value === null) {
            if (field.type === 'multiselect') {
              value = []
            } else {
              value = ''
            }
          }
          
          newFormData[field.name] = value
          hasChanges = true
        }
      })
      
      return hasChanges ? newFormData : prevFormData
    })
  }, [fields])

  const handleChange = (fieldName, value, field = null) => {
    let processedValue = value
    
    // Special handling for tel fields to improve UX
    if (field && field.type === 'tel' && field.format) {
      // Only apply formatting if the value is getting longer or if it's a complete reformat
      const currentValue = formData[fieldName] || ''
      const currentDigits = currentValue.replace(/\D/g, '')
      const newDigits = value.replace(/\D/g, '')
      
      // If user is deleting (fewer digits), don't reformat immediately
      if (newDigits.length < currentDigits.length) {
        // Just clean the input but don't format until they start typing again
        processedValue = newDigits
      } else {
        // User is typing/adding, apply formatting
        processedValue = field.format(value)
      }
    } else if (field && field.format) {
      processedValue = field.format(value)
    }
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: processedValue
    }))
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }))
    }
    
    // Call field-specific onChange handler if provided
    if (field && field.onChange) {
      field.onChange(processedValue)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} é obrigatório`
      }
      
      if (field.validation && formData[field.name]) {
        // For tel fields, validate against raw digits only
        let valueToValidate = formData[field.name]
        if (field.type === 'tel') {
          valueToValidate = formData[field.name].replace(/\D/g, '')
        }
        
        const validationResult = field.validation(valueToValidate)
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
      // Process form data before submission
      const processedData = { ...formData }
      
      // Convert tel fields to raw digits for backend
      fields.forEach(field => {
        if (field.type === 'tel' && processedData[field.name]) {
          processedData[field.name] = processedData[field.name].replace(/\D/g, '')
        }
      })
      
      onSubmit(processedData)
    }
  }

  const renderField = (field) => {
    const commonProps = {
      fullWidth: true,
      variant: "outlined",
      margin: "normal",
      disabled: isLoading,
      error: !!errors[field.name],
      helperText: errors[field.name] || field.helpText
    }

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <TextField
            key={field.name}
            label={field.label}
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            {...commonProps}
          />
        )
      
      case 'tel':
        return (
          <TextField
            key={field.name}
            label={field.label}
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value, field)}
            placeholder={field.placeholder}
            required={field.required}
            {...commonProps}
          />
        )
      
      case 'textarea':
        return (
          <TextField
            key={field.name}
            label={field.label}
            multiline
            rows={field.rows || 3}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            {...commonProps}
          />
        )
      
      case 'select':
        return (
          <FormControl 
            key={field.name} 
            {...commonProps}
            sx={{
              ...commonProps.sx,
              // Ensure gender, service_type, client_id, and team_member_id fields have enough width for full labels
              ...((field.name === 'gender' || field.name === 'service_type' || field.name === 'client_id' || field.name === 'team_member_id') && {
                minWidth: '250px',
                '& .MuiInputLabel-root': {
                  whiteSpace: 'nowrap'
                },
                '& .MuiSelect-select': {
                  minWidth: '200px'
                }
              })
            }}
          >
            <InputLabel required={field.required}>{field.label}</InputLabel>
            <Select
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value, field)}
              label={field.label}
            >
              {field.options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(errors[field.name] || field.helpText) && (
              <FormHelperText error={!!errors[field.name]}>
                {errors[field.name] || field.helpText}
              </FormHelperText>
            )}
          </FormControl>
        )
      
      case 'multiselect':
        return (
          <FormControl 
            key={field.name} 
            {...commonProps}
            sx={{
              ...commonProps.sx,
              minWidth: '250px'
            }}
          >
            <InputLabel required={field.required}>{field.label}</InputLabel>
            <Select
              multiple
              value={formData[field.name] || []}
              onChange={(e) => handleChange(field.name, e.target.value, field)}
              label={field.label}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const option = field.options.find(opt => opt.value === value)
                    return (
                      <Chip 
                        key={value} 
                        label={option?.label || value} 
                        size="small"
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              color: 'white'
                            }
                          }
                        }}
                      />
                    )
                  })}
                </Box>
              )}
            >
              {field.options.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox 
                    checked={(formData[field.name] || []).indexOf(option.value) > -1}
                    sx={{ mr: 1 }}
                  />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(errors[field.name] || field.helpText) && (
              <FormHelperText error={!!errors[field.name]}>
                {errors[field.name] || field.helpText}
              </FormHelperText>
            )}
          </FormControl>
        )
      
      case 'date':
        return (
          <TextField
            key={field.name}
            label={field.label}
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            InputLabelProps={{ shrink: true }}
            {...commonProps}
          />
        )
      
      case 'time':
        return (
          <TextField
            key={field.name}
            label={field.label}
            type="time"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            InputLabelProps={{ shrink: true }}
            {...commonProps}
          />
        )
      
      case 'number':
        return (
          <TextField
            key={field.name}
            label={field.label}
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            inputProps={{
              step: field.step || 'any',
              min: field.min,
              max: field.max
            }}
            {...commonProps}
          />
        )
      
      case 'checkbox':
        return (
          <Box key={field.name} sx={{ mt: 2, mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData[field.name] || false}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  disabled={isLoading}
                  color="primary"
                />
              }
              label={field.label}
            />
            {(errors[field.name] || field.helpText) && (
              <FormHelperText error={!!errors[field.name]} sx={{ ml: 0 }}>
                {errors[field.name] || field.helpText}
              </FormHelperText>
            )}
          </Box>
        )
      
      default:
        return (
          <TextField
            key={field.name}
            label={field.label}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            {...commonProps}
          />
        )
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      TransitionComponent={Transition}
      keepMounted
      PaperProps={{
        elevation: 24,
        sx: {
          borderRadius: 3,
          minHeight: '500px',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 3,
        px: 3,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.3) 100%)'
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            color: 'white',
            width: 40,
            height: 40
          }}>
            {isEdit ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
              {isEdit ? `Editar ${title}` : `Novo ${title}`}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {isEdit ? 'Atualize as informações abaixo' : 'Preencha os dados para criar'}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={onCancel}
          disabled={isLoading}
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ 
          pt: 4, 
          pb: 2,
          px: 4,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}>

          
          <Grid container spacing={3}>
            {fields.map(field => (
              <Grid 
                item 
                xs={12} 
                sm={field.fullWidth ? 12 : 6}
                key={field.name}
              >
                <Box sx={{
                  '& .MuiTextField-root, & .MuiFormControl-root': {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)'
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.25)'
                      }
                    }
                  }
                }}>
                  {renderField(field)}
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.1)' }} />
        
        <DialogActions sx={{ 
          p: 4, 
          gap: 2,
          background: 'linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%)',
          justifyContent: 'space-between'
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {isEdit ? 'Modificando registro existente' : 'Todos os campos obrigatórios devem ser preenchidos'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              onClick={onCancel}
              disabled={isLoading}
              variant="outlined"
              startIcon={<CancelIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: 'rgba(102, 126, 234, 0.3)',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #ccc 0%, #999 100%)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default MuiCrudForm
