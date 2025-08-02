import React from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ToggleSwitch({ 
  checked, 
  onChange, 
  disabled = false, 
  size = 'md',
  className = '' 
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: 'h-4 w-7',
    md: 'h-6 w-11',
    lg: 'h-8 w-14'
  }

  const sliderSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  }

  const translateClasses = {
    sm: 'translate-x-3',
    md: 'translate-x-5',
    lg: 'translate-x-6'
  }

  return (
    <label className={`toggle-switch ${sizeClasses[size]} ${disabled ? 'disabled' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className={`slider ${sizeClasses[size]}`}>
        <span className={`slider:before ${sliderSizeClasses[size]} ${checked ? translateClasses[size] : ''}`}></span>
      </span>
    </label>
  )
} 