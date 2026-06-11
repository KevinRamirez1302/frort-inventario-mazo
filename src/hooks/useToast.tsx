import { useState, useCallback, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { ToastContext, type Toast, type ToastType } from './ToastContext'

function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, addToast, removeToast } = useToastState()

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: number) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" aria-live="polite">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'border-l-[#10b981]',
  error: 'border-l-[#ef4444]',
  info: 'border-l-[#3b82f6]',
}

const TOAST_ICON_COLORS: Record<ToastType, string> = {
  success: 'text-[#10b981]',
  error: 'text-[#ef4444]',
  info: 'text-[#3b82f6]',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} className={TOAST_ICON_COLORS[toast.type]} />,
    error: <XCircle size={18} className={TOAST_ICON_COLORS[toast.type]} />,
    info: <Info size={18} className={TOAST_ICON_COLORS[toast.type]} />,
  }

  return (
    <div
      className={twMerge(
        'bg-[#18181b]/85 backdrop-blur-xl rounded-xl px-4 py-3 flex items-center gap-3 border-l-4 shadow-xl shadow-black/30 animate-slide-right',
        TOAST_COLORS[toast.type]
      )}
      role="alert"
    >
      {icons[toast.type]}
      <p className="text-sm text-[#fafafa] flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#71717a] hover:text-[#fafafa] transition-colors flex-shrink-0 p-0.5"
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  )
}
