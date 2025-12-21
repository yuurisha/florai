"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, toast.duration || 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastComponentProps {
  toast: Toast
  onClose: () => void
}

function ToastComponent({ toast, onClose }: ToastComponentProps) {
  const getVariantStyles = (variant: Toast["variant"]) => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 border-emerald-200 text-emerald-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      default:
        return "bg-white border-gray-200 text-gray-900"
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 shadow-lg animate-in slide-in-from-top-2",
        "min-w-[300px] max-w-[400px]",
        getVariantStyles(toast.variant),
      )}
    >
      <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-sm opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
      {toast.title && <div className="font-semibold mb-1">{toast.title}</div>}
      {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
    </div>
  )
}
