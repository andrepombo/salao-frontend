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
      case 'tel':
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
          <FormControl key={field.name} {...commonProps}>
            <InputLabel required={field.required}>{field.label}</InputLabel>
            <Select
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
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
          <Box sx={{ mb: 3 }}>
            <Chip 
              label={isEdit ? 'Modo de Edição' : 'Criação de Registro'}
              color={isEdit ? 'secondary' : 'primary'}
              variant="outlined"
              size="small"
              sx={{ 
                fontWeight: 500,
                borderRadius: 2,
                '& .MuiChip-label': {
                  px: 2
                }
              }}
            />
          </Box>
          
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
