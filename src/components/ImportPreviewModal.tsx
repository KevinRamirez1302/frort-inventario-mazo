import { X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import type { ImportResult } from '../utils/importUtils'
import { formatPreviewText } from '../utils/importUtils'

// ─── Styles ───────────────────────────────────────────────────────────────────

const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium px-4 py-2.5 rounded-xl border border-[#27272a] transition-all duration-200 active:scale-[0.98]'

// ─── Componente ───────────────────────────────────────────────────────────────

interface ImportPreviewModalProps {
  open: boolean
  result: ImportResult | null
  fileName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export function ImportPreviewModal({ open, result, fileName, onConfirm, onCancel, loading }: ImportPreviewModalProps) {
  if (!open || !result) return null

  const { toCreate, toUpdate, errors, warnings } = result
  const total = toCreate.length + toUpdate.length
  const hasErrors = errors.length > 0
  const canProceed = toCreate.length > 0 || toUpdate.length > 0

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#111114]/98 backdrop-blur-2xl rounded-3xl border border-[#27272a] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#fafafa]">Resumen de importación</h2>
            <p className="text-xs text-[#71717a] font-mono mt-0.5">{fileName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] transition-all cursor-pointer"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Totales */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#10b981]">{toCreate.length}</p>
              <p className="text-[10px] text-[#71717a] uppercase tracking-wider mt-1">Nuevos</p>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#3b82f6]">{toUpdate.length}</p>
              <p className="text-[10px] text-[#71717a] uppercase tracking-wider mt-1">Actualizar</p>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
              <p className={twMerge('text-2xl font-bold', hasErrors ? 'text-[#ef4444]' : 'text-[#71717a]')}>{errors.length}</p>
              <p className="text-[10px] text-[#71717a] uppercase tracking-wider mt-1">Errores</p>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl p-3">
              <p className="text-[10px] text-[#f59e0b] uppercase tracking-wider font-medium mb-1.5">Advertencias</p>
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-[#f59e0b]/90 leading-relaxed">{w}</p>
              ))}
            </div>
          )}

          {/* Errors */}
          {hasErrors && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-3">
              <p className="text-[10px] text-[#ef4444] uppercase tracking-wider font-medium mb-1.5">Errores de validación</p>
              <div className="space-y-1">
                {errors.map((err, i) => (
                  <p key={i} className="text-xs text-[#ef4444]/90 leading-relaxed font-mono">
                    Fila {err.rowIndex}: <span className="text-[#ef4444]/70">{err.field}</span> — {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Preview de productos nuevos */}
          {toCreate.length > 0 && (
            <div>
              <p className="text-[10px] text-[#71717a] uppercase tracking-wider font-medium mb-2">Productos nuevos</p>
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {toCreate.map((item, i) => (
                    <div key={i} className="px-3 py-2 text-xs text-[#a1a1aa] border-b border-[#27272a]/40 last:border-b-0">
                      <span className="text-[#10b981] font-mono mr-2">#{item.rowIndex}</span>
                      {formatPreviewText(item.data)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview de productos a actualizar */}
          {toUpdate.length > 0 && (
            <div>
              <p className="text-[10px] text-[#71717a] uppercase tracking-wider font-medium mb-2">Productos a actualizar</p>
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {toUpdate.map((item, i) => (
                    <div key={i} className="px-3 py-2 text-xs text-[#a1a1aa] border-b border-[#27272a]/40 last:border-b-0">
                      <span className="text-[#3b82f6] font-mono mr-2">#{item.rowIndex}</span>
                      {formatPreviewText(item.data)}
                      <span className="text-[#71717a] ml-2">(ID: {item.existingProduct?.id})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sin productos válidos */}
          {!canProceed && (
            <div className="text-center py-4">
              <p className="text-sm text-[#71717a]">No hay productos válidos para importar.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#27272a] flex-shrink-0">
          <p className="text-xs text-[#71717a]">
            {total} producto{total !== 1 ? 's' : ''} para importar
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onCancel} className={BTN_SECONDARY} disabled={loading}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={BTN_PRIMARY}
              disabled={!canProceed || loading}
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Confirmar importación
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
