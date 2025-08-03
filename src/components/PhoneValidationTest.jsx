import React, { useState } from 'react'
import { Box, Typography, TextField, Button } from '@mui/material'
import MaskedPhoneInput from './MaskedPhoneInput'

const PhoneValidationTest = () => {
  const [phoneValue, setPhoneValue] = useState('')
  const [validationResult, setValidationResult] = useState('')

  const validatePhone = (value) => {
    console.log('PhoneValidationTest: Validating phone:', value, 'type:', typeof value, 'length:', value?.length)
    
    if (!value || value.length === 0) {
      return 'Telefone é obrigatório'
    }
    
    // Check if it's all digits
    if (!/^\d+$/.test(value)) {
      return 'Telefone deve conter apenas números'
    }
    
    // Check length - Brazilian phones should have 11 digits
    if (value.length < 10) {
      return 'Telefone deve ter pelo menos 10 dígitos'
    }
    
    if (value.length === 10) {
      return 'Telefone deve ter 11 dígitos (inclua o 9 antes do número)'
    }
    
    if (value.length === 11) {
      // Valid 11-digit Brazilian phone
      const isValid = /^\d{11}$/.test(value)
      console.log('PhoneValidationTest: Phone validation result:', isValid)
      return isValid ? true : 'Formato de telefone inválido'
    }
    
    if (value.length > 11) {
      return 'Telefone deve ter no máximo 11 dígitos'
    }
    
    return 'Formato de telefone inválido'
  }

  const handlePhoneChange = (digits) => {
    console.log('PhoneValidationTest: Received digits from MaskedPhoneInput:', digits)
    setPhoneValue(digits)
    
    const validation = validatePhone(digits)
    setValidationResult(validation === true ? 'Valid!' : validation)
  }

  const testDirectInput = (e) => {
    const value = e.target.value
    console.log('PhoneValidationTest: Direct input:', value)
    const validation = validatePhone(value)
    setValidationResult(validation === true ? 'Valid!' : validation)
  }

  return (
    <Box sx={{ p: 3, border: '1px solid #ccc', borderRadius: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Phone Validation Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          MaskedPhoneInput Component:
        </Typography>
        <MaskedPhoneInput
          label="Telefone (Masked)"
          value={phoneValue}
          onChange={handlePhoneChange}
          placeholder="(11) 98765-4321"
          fullWidth
          margin="normal"
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Direct Input (for comparison):
        </Typography>
        <TextField
          label="Telefone (Direct)"
          onChange={testDirectInput}
          placeholder="11987654321"
          fullWidth
          margin="normal"
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Current Phone Value:</strong> "{phoneValue}" (Length: {phoneValue.length})
        </Typography>
        <Typography variant="body2" color={validationResult === 'Valid!' ? 'success.main' : 'error.main'}>
          <strong>Validation Result:</strong> {validationResult}
        </Typography>
      </Box>
      
      <Button 
        variant="contained" 
        onClick={() => {
          console.log('=== Phone Validation Debug ===')
          console.log('Phone Value:', phoneValue)
          console.log('Type:', typeof phoneValue)
          console.log('Length:', phoneValue.length)
          console.log('Is Digits Only:', /^\d+$/.test(phoneValue))
          console.log('Validation Result:', validatePhone(phoneValue))
        }}
      >
        Debug Console Log
      </Button>
    </Box>
  )
}

export default PhoneValidationTest
