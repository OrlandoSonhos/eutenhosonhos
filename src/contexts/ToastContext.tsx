'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Toast from '@/components/ui/Toast'

interface ToastData {
  id: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void
  showSuccessToast: (message: string, duration?: number) => void
  showErrorToast: (message: string, duration?: number) => void
  showWarningToast: (message: string, duration?: number) => void
  showInfoToast: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastData = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
  }

  const showSuccessToast = (message: string, duration = 5000) => {
    showToast(message, 'success', duration)
  }

  const showErrorToast = (message: string, duration = 5000) => {
    showToast(message, 'error', duration)
  }

  const showWarningToast = (message: string, duration = 5000) => {
    showToast(message, 'warning', duration)
  }

  const showInfoToast = (message: string, duration = 5000) => {
    showToast(message, 'info', duration)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccessToast,
      showErrorToast,
      showWarningToast,
      showInfoToast
    }}>
      {children}
      
      {/* Renderizar toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ 
              transform: `translateY(${index * 80}px)`,
              zIndex: 1000 - index
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
              showCloseButton={true}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}