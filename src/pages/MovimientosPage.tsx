import { useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { movimientosApi, productosApi, usuariosApi } from '../api/inventory'
import { DataTable } from '../components/DataTable'
import type { Movimiento } from '../types/inventory'
import { twMerge } from 'tailwind-merge'
import { ArrowDownRight, ArrowUpRight, Wrench, Ban } from 'lucide-react'

const TIPO_BADGE: Record<string, string> = {
  entrada: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
  salida: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
  transferencia: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
  baja: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
  mantenimiento: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20',
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  entrada: <ArrowDownRight size={12} />,
  salida: <ArrowUpRight size={12} />,
  transferencia: <ArrowUpRight size={12} />,
  baja: <Ban size={12} />,
  mantenimiento: <Wrench size={12} />,
}

export function MovimientosPage() {
  const { data: movimientos, loading, error, refetch } = useFetch(movimientosApi.getAll, [], [])
  const { data: productos } = useFetch(productosApi.getAll, [], [])
  const { data: usuarios } = useFetch(usuariosApi.getAll, [], [])

  const handleCreate = useCallback(async (data: Record<string, unknown>) => {
    await movimientosApi.create(data)
  }, [])

  const handleUpdate = useCallback(async (id: number, data: Record<string, unknown>) => {
    await movimientosApi.update(id, data)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    await movimientosApi.remove(id)
  }, [])

  return (
    <DataTable<Movimiento>
      title="Movimientos"
      subtitle={`${movimientos.length} movimientos registrados`}
      loading={loading}
      error={error}
      data={movimientos}
      onRefresh={refetch}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      columns={[
        { key: 'tipo', label: 'Tipo', render: m => (
          <span className={twMerge(TIPO_BADGE[m.tipo])}>
            {TIPO_ICONS[m.tipo]}
            <span className="capitalize">{m.tipo}</span>
          </span>
        )},
        { key: 'producto', label: 'Producto', render: m => (
          <span className="text-[#a1a1aa]">{m.producto?.nombre || `#${m.productoId}`}</span>
        )},
        { key: 'usuario', label: 'Usuario', render: m => (
          m.usuario ? (
            <span className="text-[#a1a1aa]">{m.usuario.nombre}</span>
          ) : (
            <span className="text-[#71717a] text-xs">—</span>
          )
        )},
        { key: 'fecha', label: 'Fecha', render: m => (
          <span className="font-mono text-xs text-[#71717a]">
            {new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )},
        { key: 'observaciones', label: 'Observaciones' },
      ]}
      formFields={[
        { key: 'productoId', label: 'Producto', options: productos.map(p => ({ value: String(p.id), label: p.nombre })), required: true },
        { key: 'tipo', label: 'Tipo', options: [
          { value: 'entrada', label: 'Entrada' },
          { value: 'salida', label: 'Salida' },
          { value: 'transferencia', label: 'Transferencia' },
          { value: 'baja', label: 'Baja' },
          { value: 'mantenimiento', label: 'Mantenimiento' },
        ], required: true },
        { key: 'usuarioId', label: 'Usuario', options: usuarios.map(u => ({ value: String(u.id), label: u.nombre })) },
        { key: 'fecha', label: 'Fecha', type: 'datetime-local', required: true },
        { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
      ]}
    />
  )
}
