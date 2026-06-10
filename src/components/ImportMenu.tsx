import { useRef, useCallback } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

// ─── Estilos ──────────────────────────────────────────────────────────────────

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl'

// ─── Componente ───────────────────────────────────────────────────────────────

interface ImportMenuProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
  loading?: boolean
}

export function ImportMenu({ onFileSelect, disabled, loading }: ImportMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
    // Reset input para permitir seleccionar el mismo archivo otra vez
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onFileSelect])

  const isLoading = !!loading

  return (
    <div className="relative" id="import-menu">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <button
        type="button"
        id="import-trigger-btn"
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={twMerge(
          BTN_BASE,
          'bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa]',
          'border border-[#27272a] hover:border-[#3f3f46]',
          'px-4 py-2.5 gap-2',
        )}
        aria-label="Importar datos desde Excel"
        title="Importar datos desde Excel"
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin text-[#7c3aed]" />
        ) : (
          <Upload size={15} />
        )}
        <span className="hidden sm:inline">Importar</span>
      </button>
    </div>
  )
}
