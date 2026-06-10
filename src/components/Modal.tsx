import { X } from 'lucide-react'
import { useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-4 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={twMerge('relative w-full max-h-full flex flex-col animate-scale-in', sizeClasses[size])}>
        <div className="bg-[#18181b]/85 backdrop-blur-xl border border-[#3f3f46]/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden flex flex-col max-h-full">
          {/* Header */}
          <div className="shrink-0 sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#18181b]/85 backdrop-blur-xl border-b border-[#27272a]">
            <h2 className="text-lg font-semibold text-[#fafafa]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] transition-all"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
