import { useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { prestamosApi, productosApi, usuariosApi } from '../api/inventory'
import { DataTable } from '../components/DataTable'
import type { Prestamo } from '../types/inventory'
import { twMerge } from 'tailwind-merge'

const ESTADO_BADGE: Record<string, string> = {
  activo: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
  devuelto: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
  vencido: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
}

export function PrestamosPage() {
  const { data: prestamos, loading, error, refetch } = useFetch(prestamosApi.getAll, [], [])
  const { data: productos } = useFetch(productosApi.getAll, [], [])
  const { data: usuarios } = useFetch(usuariosApi.getAll, [], [])

  const handleCreate = useCallback(async (data: Record<string, unknown>) => {
    await prestamosApi.create(data)
  }, [])

  const handleUpdate = useCallback(async (id: number, data: Record<string, unknown>) => {
    await prestamosApi.update(id, data)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    await prestamosApi.remove(id)
  }, [])

  return (
    <DataTable<Prestamo>
      title="Préstamos"
      subtitle={`${prestamos.length} préstamos registrados`}
      loading={loading}
      error={error}
      data={prestamos}
      onRefresh={refetch}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      exportFilename="inventario_prestamos"
      exportColumns={[
        { key: 'id',              label: 'ID' },
        { key: 'producto',        label: 'Producto',      format: (_v, row) => {
          const p = row.producto as { nombre?: string } | null | undefined
          return p?.nombre ?? `#${row.productoId}`
        }},
        { key: 'usuario',         label: 'Usuario',       format: (_v, row) => {
          const u = row.usuario as { nombre?: string } | null | undefined
          return u?.nombre ?? `#${row.usuarioId}`
        }},
        { key: 'fechaPrestamo',   label: 'Fecha Préstamo',   format: v => new Date(String(v)).toLocaleDateString('es-ES') },
        { key: 'fechaDevolucion', label: 'Fecha Devolución',  format: v => v ? new Date(String(v)).toLocaleDateString('es-ES') : 'Pendiente' },
        { key: 'estado',          label: 'Estado' },
        { key: 'observaciones',   label: 'Observaciones',  format: v => v ? String(v) : '—' },
      ]}
      columns={[
        { key: 'producto', label: 'Producto', render: p => (
          <span className="font-medium text-[#fafafa]">{p.producto?.nombre || `#${p.productoId}`}</span>
        )},
        { key: 'usuario', label: 'Usuario', render: p => (
          <span className="text-[#a1a1aa]">{p.usuario?.nombre || `#${p.usuarioId}`}</span>
        )},
        { key: 'fechaPrestamo', label: 'Fecha Préstamo', render: p => (
          <span className="font-mono text-xs text-[#71717a]">
            {new Date(p.fechaPrestamo).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )},
        { key: 'fechaDevolucion', label: 'Devolución', render: p => (
          p.fechaDevolucion ? (
            <span className="font-mono text-xs text-[#71717a]">
              {new Date(p.fechaDevolucion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          ) : (
            <span className="text-[#f59e0b] text-xs italic">Pendiente</span>
          )
        )},
        { key: 'estado', label: 'Estado', render: p => (
          <span className={twMerge(ESTADO_BADGE[p.estado])}>{p.estado}</span>
        )},
      ]}
      formFields={[
        { key: 'productoId', label: 'Producto', options: productos.map(p => ({ value: String(p.id), label: p.nombre })), required: true },
        { key: 'usuarioId', label: 'Usuario', options: usuarios.map(u => ({ value: String(u.id), label: u.nombre })), required: true },
        { key: 'fechaPrestamo', label: 'Fecha Préstamo', type: 'datetime-local', required: true },
        { key: 'fechaDevolucion', label: 'Fecha Devolución', type: 'datetime-local' },
        { key: 'estado', label: 'Estado', options: [
          { value: 'activo', label: 'Activo' },
          { value: 'devuelto', label: 'Devuelto' },
          { value: 'vencido', label: 'Vencido' },
        ]},
        { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
      ]}
    />
  )
}
