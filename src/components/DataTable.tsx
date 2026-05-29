import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search, Plus, Edit2, Trash2, ChevronDown, Loader2,
  ScanLine, Flashlight, FlashlightOff, X, QrCode,
  CheckCircle2, CameraOff, RefreshCw,
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Modal } from './Modal'
import { useToast } from '../hooks/useToast'
import { useScanner } from '../hooks/useScanner'
import { ExportMenu } from './ExportMenu'
import type { ExportColumn } from '../utils/exportUtils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
}

interface FormField {
  key: string
  label: string
  type?: string
  required?: boolean
  options?: { value: string; label: string }[]
  /**
   * Si es true, muestra un botón de escáner dentro del input.
   * Al leer el código, se intenta poblar todos los campos del formulario
   * mediante el parser inteligente.
   */
  scannable?: boolean
}

interface DataTableProps<T extends { id: number }> {
  title: string
  subtitle?: string
  columns: Column<T>[]
  data: T[]
  loading: boolean
  error: string | null
  onCreate: (data: Record<string, unknown>) => Promise<void>
  onUpdate: (id: number, data: Record<string, unknown>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onRefresh: () => void
  formFields: FormField[]
  /** Columnas de exportación (si no se pasan, se usan las columnas visibles) */
  exportColumns?: ExportColumn[]
  /** Nombre base del archivo exportado (sin extensión) */
  exportFilename?: string
  initialSearch?: string
  onSearchChange?: (val: string) => void
  initialNewProductData?: Record<string, unknown> | null
  onClearNewProductData?: () => void
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const INPUT_CLS = 'w-full bg-[#111114] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#71717a] transition-all duration-200 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20'
const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium px-4 py-2.5 rounded-xl border border-[#27272a] transition-all duration-200 active:scale-[0.98]'

// ---------------------------------------------------------------------------
// Smart scan-result parser
//
// Intenta extraer datos estructurados del texto escaneado y los mapea a los
// campos conocidos del formulario de productos.
// ---------------------------------------------------------------------------

/** Alias de nombres de campo → clave canónica del formulario */
const FIELD_ALIASES: Record<string, string> = {
  // nombre
  nombre: 'nombre', name: 'nombre',
  // descripcion
  descripcion: 'descripcion', description: 'descripcion', desc: 'descripcion',
  // marca
  marca: 'marca', brand: 'marca', manufacturer: 'marca', fabricante: 'marca', mfr: 'marca',
  // modelo
  modelo: 'modelo', model: 'modelo', mdl: 'modelo',
  // numero de serie
  numeroserie: 'numeroSerie', serial: 'numeroSerie', sn: 'numeroSerie',
  serialnumber: 'numeroSerie', seriennummer: 'numeroSerie', nserie: 'numeroSerie',
  // ubicacion
  ubicacion: 'ubicacion', location: 'ubicacion', loc: 'ubicacion', lugar: 'ubicacion',
  // precio
  precio: 'precio', price: 'precio', coste: 'precio', cost: 'precio',
  // fecha
  fechaadquisicion: 'fechaAdquisicion', fecha: 'fechaAdquisicion', date: 'fechaAdquisicion',
}

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s_\-]/g, '').replace(/[^a-z]/g, '')
}

function mapKey(raw: string): string {
  const norm = normalizeKey(raw)
  return FIELD_ALIASES[norm] ?? raw
}

/**
 * Parsea el texto de un código escaneado e intenta extraer tantos campos
 * del formulario como sea posible.
 *
 * Soporta tres formatos en este orden:
 *  1. JSON: `{"nombre":"Laptop","marca":"Dell","numeroSerie":"SN123"}`
 *  2. Pares clave:valor separados por `|` `\n` o `;`:
 *     `marca:Dell|modelo:XPS 15|sn:SN123`
 *  3. Texto plano → se asigna directamente a `numeroSerie`
 */
function parseScanToFields(rawText: string): Record<string, unknown> {
  const text = rawText.trim()

  // 1) JSON
  try {
    const obj = JSON.parse(text)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const result: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(obj)) {
        result[mapKey(k)] = v
      }
      return result
    }
  } catch { /* not JSON */ }

  // 2) Pares clave=valor o clave:valor
  const pairs = text.split(/[|\n;]/).map(s => s.trim()).filter(Boolean)
  const mapped: Record<string, unknown> = {}
  let hits = 0
  for (const pair of pairs) {
    const m = pair.match(/^([^:=]+)[=:](.*)$/)
    if (m) {
      const fieldKey = mapKey(m[1].trim())
      mapped[fieldKey] = m[2].trim()
      hits++
    }
  }
  if (hits > 0) return mapped

  // 3) Texto plano → numeroSerie
  return { numeroSerie: text }
}

// ---------------------------------------------------------------------------
// Inline scanner panel (se muestra como modal sobre el modal del formulario)
// ---------------------------------------------------------------------------

interface ScannerPanelProps {
  onResult: (text: string) => void
  onClose: () => void
}

function ScannerPanel({ onResult, onClose }: ScannerPanelProps) {
  const {
    status, result, errorMessage,
    isTorchOn, isTorchAvailable,
    videoRef, startScanning, stopScanning, toggleTorch, reset,
  } = useScanner()

  // Iniciar cámara en el siguiente tick para que React haya montado el <video>
  useEffect(() => {
    const timer = setTimeout(() => startScanning(), 60)
    return () => {
      clearTimeout(timer)
      stopScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Notificar al padre cuando hay resultado
  useEffect(() => {
    if (status === 'success' && result) {
      onResult(result.text)
    }
  }, [status, result, onResult])

  // ⚠️ Interceptar Escape para que no cierre el Modal de registro que está detrás
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        stopScanning()
        onClose()
      }
    }
    window.addEventListener('keydown', handler, true) // capture=true → va antes que el listener del Modal
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose, stopScanning])

  const handleRetry = () => {
    reset()
    setTimeout(() => startScanning(), 60)
  }

  const isShowingCamera = status === 'scanning' || status === 'requesting'

  return (
    // z-[60] para estar por encima del Modal (z-50)
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) { stopScanning(); onClose() } }}
    >
      <div className="w-full max-w-sm bg-[#111114]/98 backdrop-blur-2xl rounded-3xl border border-[#27272a] overflow-hidden shadow-2xl">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#7c3aed]/15 flex items-center justify-center">
              <QrCode size={14} className="text-[#7c3aed]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#fafafa]">Escanear código</p>
              <p className="text-[10px] text-[#71717a] font-mono">QR · EAN · Code128 · PDF417 · más</p>
            </div>
          </div>
          <button
            onClick={() => { stopScanning(); onClose() }}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] transition-all cursor-pointer"
            aria-label="Cerrar escáner"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── El <video> SIEMPRE está en el DOM para que videoRef.current sea válido ── */}
        <div className={isShowingCamera ? 'block' : 'hidden'}>
          <div className="relative aspect-[4/3] bg-black overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              aria-label="Vista de cámara"
            />

            {/* Marco de guía animado */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-52">
                <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-[#7c3aed] rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-[#7c3aed] rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-[#7c3aed] rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-[#7c3aed] rounded-br-lg" />
                {status === 'scanning' && (
                  <div
                    className="absolute left-1 right-1 h-0.5 bg-[#7c3aed]/80 rounded-full"
                    style={{ animation: 'scanLine 2s ease-in-out infinite' }}
                  />
                )}
              </div>
            </div>

            {/* Vignette radial */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 55% 50% at 50% 50%, transparent 0%, rgba(0,0,0,0.45) 100%)' }}
            />

            {/* Spinner superpuesto mientras se obtiene el stream */}
            {status === 'requesting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Controles: torch y cancel */}
            {status === 'scanning' && (
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-4">
                <button
                  onClick={toggleTorch}
                  disabled={!isTorchAvailable}
                  className="p-2.5 rounded-xl bg-black/50 backdrop-blur-sm text-white disabled:opacity-30 hover:bg-black/70 transition-all cursor-pointer"
                  aria-label={isTorchOn ? 'Apagar flash' : 'Encender flash'}
                >
                  {isTorchOn ? <FlashlightOff size={16} /> : <Flashlight size={16} />}
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-[10px] text-white font-mono">Buscando...</span>
                </div>

                <button
                  onClick={() => { stopScanning(); onClose() }}
                  className="p-2.5 rounded-xl bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all cursor-pointer"
                  aria-label="Cancelar"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-[#71717a] py-3 px-4">
            Apunta al código QR, de barras u otro código del producto
          </p>
        </div>

        {/* Resultado exitoso */}
        {status === 'success' && result && (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-[#10b981]" />
              </div>
              <p className="text-sm font-bold text-[#fafafa]">¡Código detectado!</p>
              <p className="text-[10px] text-[#71717a] font-mono">Formato: {result.format}</p>
            </div>

            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3">
              <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider mb-1">Contenido</p>
              <p className="text-xs text-[#fafafa] break-all font-mono leading-relaxed">{result.text}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#a1a1aa] hover:text-[#fafafa] py-2.5 rounded-xl border border-[#27272a] bg-[#18181b] hover:bg-[#1e1e22] transition-all cursor-pointer"
              >
                <RefreshCw size={13} /> Reintentar
              </button>
              <button
                onClick={() => onResult(result.text)}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-white py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] transition-all cursor-pointer"
              >
                <CheckCircle2 size={13} /> Usar este
              </button>
            </div>
          </div>
        )}

        {/* Error de cámara */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-10 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
              <CameraOff size={20} className="text-[#ef4444]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#fafafa]">Sin acceso a cámara</p>
              <p className="text-xs text-[#71717a] leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 text-xs font-medium text-[#ef4444] py-2.5 px-5 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 transition-all cursor-pointer"
            >
              <RefreshCw size={13} /> Reintentar
            </button>
          </div>
        )}

        <style>{`
          @keyframes scanLine {
            0%, 100% { top: 10%; opacity: 0.8; }
            50%       { top: 85%; opacity: 1;   }
          }
        `}</style>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export function DataTable<T extends { id: number }>({
  title, subtitle, columns, data, loading, error,
  onCreate, onUpdate, onDelete, onRefresh, formFields,
  exportColumns, exportFilename,
  initialSearch, onSearchChange,
  initialNewProductData, onClearNewProductData,
}: DataTableProps<T>) {
  const [search, setSearch] = useState(initialSearch || '')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const { addToast } = useToast()

  // Sync external search updates
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch)
    }
  }, [initialSearch])

  // Sync pre-populated form data from global scanner
  useEffect(() => {
    if (initialNewProductData) {
      setEditing(null)
      setFormData(initialNewProductData)
      setModalOpen(true)
      if (onClearNewProductData) {
        onClearNewProductData()
      }
    }
  }, [initialNewProductData, onClearNewProductData])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (onSearchChange) {
      onSearchChange(val)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const s = search.toLowerCase()
    return data.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(s))
    )
  }, [data, search])

  const openCreate = useCallback(() => {
    setEditing(null)
    setFormData({})
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: T) => {
    setEditing(item)
    setFormData(item as Record<string, unknown>)
    setModalOpen(true)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await onUpdate(editing.id, formData)
        addToast('Registro actualizado correctamente', 'success')
      } else {
        await onCreate(formData)
        addToast('Registro creado correctamente', 'success')
      }
      setModalOpen(false)
      onRefresh()
    } catch (err) {
      addToast((err as Error).message, 'error')
    } finally {
      setSubmitting(false)
    }
  }, [editing, formData, onCreate, onUpdate, addToast, onRefresh])

  const handleDelete = useCallback(async (id: number) => {
    try {
      await onDelete(id)
      addToast('Registro eliminado', 'info')
      onRefresh()
    } catch (err) {
      addToast((err as Error).message, 'error')
    }
  }, [onDelete, addToast, onRefresh])

  /**
   * Recibe el texto crudo del escáner, lo parsea con el parser inteligente
   * y rellena todos los campos del formulario que hayan sido identificados.
   */
  const handleScanResult = useCallback((rawText: string) => {
    const fields = parseScanToFields(rawText)
    setFormData(prev => ({ ...prev, ...fields }))
    setIsScannerOpen(false)

    // Mostrar un resumen de los campos rellenados
    const filled = Object.keys(fields)
      .map(k => formFields.find(f => f.key === k)?.label ?? k)
      .join(', ')
    addToast(`Escáner: campos rellenados → ${filled}`, 'success')
  }, [formFields, addToast])

  // Columnas para exportar: usa exportColumns si se proveen, si no deriva de columns
  const resolvedExportColumns = useMemo<ExportColumn[]>(() => {
    if (exportColumns && exportColumns.length > 0) return exportColumns
    return columns.map(col => ({ key: col.key, label: col.label }))
  }, [exportColumns, columns])

  // Data plana para exportar
  const exportData = useMemo(
    () => filtered.map(item => item as Record<string, unknown>),
    [filtered],
  )

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-[#fafafa] truncate">{title}</h1>
          {subtitle && <p className="text-[#71717a] text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onRefresh} className={BTN_SECONDARY} aria-label="Refrescar datos">
            <Loader2 size={16} className={twMerge('transition-transform', loading && 'animate-spin')} />
          </button>
          <ExportMenu
            title={title}
            subtitle={subtitle}
            filename={exportFilename ?? title.toLowerCase().replace(/\s+/g, '_')}
            columns={resolvedExportColumns}
            data={exportData}
            disabled={loading}
          />
          <button onClick={openCreate} className={BTN_PRIMARY}>
            <Plus size={16} />
            Nuevo
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717a]" />
        <input
          type="text"
          placeholder="Buscar registros..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className={twMerge(INPUT_CLS, 'pl-10 w-full sm:max-w-sm')}
          aria-label="Buscar registros"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-3 text-sm text-[#ef4444]">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111114] border border-[#27272a] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#71717a] text-xs font-mono uppercase tracking-wider bg-[#18181b]/60 border-b border-[#27272a]">
                {columns.map(col => (
                  <th key={col.key} className="text-left py-3.5 px-5 font-medium">{col.label}</th>
                ))}
                <th className="text-right py-3.5 px-5 w-24 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#27272a]/50">
                    {columns.map((_, j) => (
                      <td key={j} className="py-4 px-5">
                        <div className="skeleton h-4 w-24" />
                      </td>
                    ))}
                    <td className="py-4 px-5"><div className="skeleton h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={32} className="text-[#71717a] opacity-40" />
                      <p className="text-[#71717a] text-sm">
                        {search ? 'No se encontraron resultados' : 'Sin registros'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="border-b border-[#27272a]/40 table-row-hover last:border-b-0">
                    {columns.map(col => (
                      <td key={col.key} className="py-3.5 px-5 text-[#a1a1aa]">
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg text-[#71717a] hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-all"
                          aria-label="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg text-[#71717a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[#27272a] text-xs text-[#71717a] font-mono">
            {filtered.length} de {data.length} registros
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar registro' : 'Nuevo registro'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map(f => (
            <FormFieldItem
              key={f.key}
              field={f}
              value={formData[f.key]}
              onChange={val => setFormData(prev => ({ ...prev, [f.key]: val }))}
              onScan={f.scannable ? () => setIsScannerOpen(true) : undefined}
            />
          ))}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
            <button type="button" onClick={() => setModalOpen(false)} className={BTN_SECONDARY}>
              Cancelar
            </button>
            <button type="submit" className={BTN_PRIMARY} disabled={submitting}>
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Scanner panel — se monta solo cuando está abierto */}
      {isScannerOpen && (
        <ScannerPanel
          onResult={handleScanResult}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FormFieldItem — campo de formulario con soporte opcional de botón escáner
// ---------------------------------------------------------------------------

function FormFieldItem({
  field, value, onChange, onScan,
}: {
  field: FormField
  value: unknown
  onChange: (val: unknown) => void
  onScan?: () => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#a1a1aa]">
        {field.label}
        {field.required && <span className="text-[#ef4444] ml-1">*</span>}
      </label>

      {field.options ? (
        /* Select */
        <div className="relative">
          <select
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            className={twMerge(INPUT_CLS, 'w-full appearance-none pr-10')}
            required={field.required}
          >
            <option value="">Seleccionar...</option>
            {field.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] pointer-events-none" />
        </div>

      ) : field.type === 'textarea' ? (
        /* Textarea */
        <textarea
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          className={twMerge(INPUT_CLS, 'w-full resize-none')}
          rows={3}
          required={field.required}
        />

      ) : (
        /* Input de texto con botón escáner opcional */
        <div className="relative">
          <input
            type={field.type || 'text'}
            value={String(value ?? '')}
            onChange={e => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
            className={twMerge(INPUT_CLS, 'w-full', onScan && 'pr-11')}
            required={field.required}
          />
          {onScan && (
            <button
              type="button"
              onClick={onScan}
              title="Escanear código QR / barras"
              aria-label="Escanear código"
              className={twMerge(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'w-7 h-7 flex items-center justify-center rounded-lg',
                'text-[#7c3aed] bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20',
                'border border-[#7c3aed]/30 hover:border-[#7c3aed]/60',
                'transition-all duration-150 active:scale-90 cursor-pointer',
              )}
            >
              <ScanLine size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
