import React, { useState, useEffect } from 'react'
import { TextField } from '@mui/material'

const MaskedPhoneInput = ({ value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = useState('')

  // Apply Brazilian phone mask: (xx) xxxxx-xxxx
  const applyMask = (digits) => {
    if (!digits) return ''
    
    // Remove all non-digits and limit to 11
    const cleaned = digits.replace(/\D/g, '').substring(0, 11)
    
    // Apply mask progressively
    if (cleaned.length === 0) return ''
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }

  // Remove mask to get only digits
  const removeMask = (maskedValue) => {
    return maskedValue.replace(/\D/g, '')
  }



  // Update display value when prop value changes
  useEffect(() => {
    if (value !== undefined) {
      const masked = applyMask(value)
      setDisplayValue(masked)
    }
  }, [value])

  const handleChange = (e) => {
    const inputValue = e.target.value
    
    // Get only digits from input
    const digits = removeMask(inputValue)
    
    // Apply mask
    const masked = applyMask(digits)
    
    // Update display
    setDisplayValue(masked)
    
    // Call parent onChange with raw digits
    if (onChange) {
      console.log('🔍 MaskedPhoneInput DEBUG:')
      console.log('  - Input Value:', inputValue)
      console.log('  - Extracted Digits:', digits)
      console.log('  - Digits Length:', digits.length)
      console.log('  - Masked Display:', masked)
      console.log('  - Calling onChange with:', digits)
      onChange(digits)
    }
  }

  // Simplified key handling - let the default behavior work
  const handleKeyDown = (e) => {
    // Allow normal backspace and delete behavior
    // The handleChange will reformat the result
  }

  return (
    <TextField
      {...props}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      inputProps={{
        ...props.inputProps,
        inputMode: 'tel',
        pattern: '[0-9]*'
      }}
    />
  )
}

export default MaskedPhoneInput
