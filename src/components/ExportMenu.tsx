import { useState, useRef, useEffect, useCallback } from 'react'
import { FileDown, FileText, Sheet, ChevronDown, Loader2 } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { exportToPDF, exportToXLSX, type ExportOptions } from '../utils/exportUtils'
import { useToast } from '../hooks/ToastContext'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ExportMenuProps extends Omit<ExportOptions, 'data'> {
  data: Record<string, unknown>[]
  disabled?: boolean
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl'

const MENU_ITEM =
  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#1e1e22] transition-all duration-150 first:rounded-t-xl last:rounded-b-xl'

// ─── Componente ───────────────────────────────────────────────────────────────

export function ExportMenu({ data, disabled, ...exportOpts }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<'pdf' | 'xlsx' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleExport = useCallback(
    async (type: 'pdf' | 'xlsx') => {
      setOpen(false)
      setLoading(type)
      try {
        if (type === 'pdf') {
          exportToPDF({ ...exportOpts, data })
          addToast('PDF generado correctamente', 'success')
        } else {
          exportToXLSX({ ...exportOpts, data })
          addToast('Excel generado correctamente', 'success')
        }
      } catch (err) {
        addToast(`Error al exportar: ${(err as Error).message}`, 'error')
      } finally {
        setLoading(null)
      }
    },
    [exportOpts, data, addToast],
  )

  const isLoading = loading !== null

  return (
    <div ref={menuRef} className="relative" id="export-menu">
      {/* Trigger button */}
      <button
        type="button"
        id="export-trigger-btn"
        disabled={disabled || isLoading || data.length === 0}
        onClick={() => setOpen(v => !v)}
        className={twMerge(
          BTN_BASE,
          'bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa]',
          'border border-[#27272a] hover:border-[#3f3f46]',
          'px-4 py-2.5 gap-2',
          open && 'bg-[#1e1e22] border-[#3f3f46] text-[#fafafa]',
        )}
        aria-haspopup="true"
        aria-expanded={open}
        title={data.length === 0 ? 'No hay datos para exportar' : 'Exportar datos'}
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin text-[#7c3aed]" />
        ) : (
          <FileDown size={15} />
        )}
        <span className="hidden sm:inline">Exportar</span>
        <ChevronDown
          size={13}
          className={twMerge(
            'transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className={twMerge(
            'absolute right-0 top-full mt-2 w-52 z-50',
            'bg-[#111114] border border-[#27272a] rounded-xl shadow-2xl',
            'overflow-hidden',
            'animate-fade-up',
          )}
          role="menu"
          aria-label="Opciones de exportación"
        >
          {/* Header del menu */}
          <div className="px-4 py-2.5 border-b border-[#27272a]">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#71717a]">
              Exportar {data.length} registro{data.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Opciones */}
          <button
            id="export-pdf-btn"
            type="button"
            role="menuitem"
            onClick={() => handleExport('pdf')}
            className={MENU_ITEM}
          >
            <div className="w-7 h-7 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center flex-shrink-0">
              <FileText size={13} className="text-[#ef4444]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium leading-tight">Exportar PDF</p>
              <p className="text-[10px] text-[#71717a]">Documento imprimible</p>
            </div>
          </button>

          <button
            id="export-xlsx-btn"
            type="button"
            role="menuitem"
            onClick={() => handleExport('xlsx')}
            className={MENU_ITEM}
          >
            <div className="w-7 h-7 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center flex-shrink-0">
              <Sheet size={13} className="text-[#10b981]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium leading-tight">Exportar Excel</p>
              <p className="text-[10px] text-[#71717a]">Hoja de cálculo .xlsx</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
