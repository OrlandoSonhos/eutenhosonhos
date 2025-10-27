'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
  showCloseButton?: boolean
}

export default function Toast({ 
  message, 
  type = 'success', 
  duration = 5000, 
  onClose,
  showCloseButton = true 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Iniciar animação de entrada
    setIsAnimating(true)
    
    // Auto-close após a duração especificada
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300) // Tempo da animação de saída
  }

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transition-all duration-300 transform"
    
    const typeStyles = {
      success: "border-green-500",
      error: "border-red-500", 
      warning: "border-yellow-500",
      info: "border-blue-500"
    }

    const animationStyles = isAnimating 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0"

    return `${baseStyles} ${typeStyles[type]} ${animationStyles}`
  }

  const getIconColor = () => {
    const colors = {
      success: "text-green-500",
      error: "text-red-500",
      warning: "text-yellow-500", 
      info: "text-blue-500"
    }
    return colors[type]
  }

  if (!isVisible) return null

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {message}
          </p>
        </div>
        {showCloseButton && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Fechar</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Botão OK adicional */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={handleClose}
          className="text-sm font-medium text-brand-primary hover:text-brand-primary-dark focus:outline-none focus:underline"
        >
          OK
        </button>
      </div>
    </div>
  )
}