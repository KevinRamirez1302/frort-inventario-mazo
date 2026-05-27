import { useState, useMemo, useCallback } from 'react'
import { Search, Plus, Edit2, Trash2, ChevronDown, Loader2 } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Modal } from './Modal'
import { useToast } from '../hooks/useToast'

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
}

const INPUT_CLS = 'w-full bg-[#111114] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#71717a] transition-all duration-200 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20'
const BTN_PRIMARY = 'inline-flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_SECONDARY = 'inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium px-4 py-2.5 rounded-xl border border-[#27272a] transition-all duration-200 active:scale-[0.98]'

export function DataTable<T extends { id: number }>({
  title, subtitle, columns, data, loading, error,
  onCreate, onUpdate, onDelete, onRefresh, formFields,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()

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
    } catch (err) {
      addToast((err as Error).message, 'error')
    } finally {
      setSubmitting(false)
    }
  }, [editing, formData, onCreate, onUpdate, addToast])

  const handleDelete = useCallback(async (id: number) => {
    try {
      await onDelete(id)
      addToast('Registro eliminado', 'info')
    } catch (err) {
      addToast((err as Error).message, 'error')
    }
  }, [onDelete, addToast])

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#fafafa]">{title}</h1>
          {subtitle && <p className="text-[#71717a] text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className={BTN_SECONDARY} aria-label="Refrescar datos">
            <Loader2 size={16} className={twMerge('transition-transform', loading && 'animate-spin')} />
          </button>
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
          onChange={e => setSearch(e.target.value)}
          className={twMerge(INPUT_CLS, 'pl-10 w-full sm:w-80')}
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

        {/* Footer count */}
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
            <FormField
              key={f.key}
              field={f}
              value={formData[f.key]}
              onChange={val => setFormData(prev => ({ ...prev, [f.key]: val }))}
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
    </div>
  )
}

function FormField({
  field, value, onChange,
}: {
  field: FormField
  value: unknown
  onChange: (val: unknown) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#a1a1aa]">
        {field.label}
        {field.required && <span className="text-[#ef4444] ml-1">*</span>}
      </label>
      {field.options ? (
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
        <textarea
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          className={twMerge(INPUT_CLS, 'w-full resize-none')}
          rows={3}
          required={field.required}
        />
      ) : (
        <input
          type={field.type || 'text'}
          value={String(value ?? '')}
          onChange={e => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
          className={twMerge(INPUT_CLS, 'w-full')}
          required={field.required}
        />
      )}
    </div>
  )
}
