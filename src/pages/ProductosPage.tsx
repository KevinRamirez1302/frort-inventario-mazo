import { useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { productosApi, categoriasApi } from '../api/inventory'
import { DataTable } from '../components/DataTable'
import type { Producto } from '../types/inventory'
import { twMerge } from 'tailwind-merge'

const ESTADO_BADGE: Record<string, string> = {
  disponible: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
  asignado: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
  en_mantenimiento: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
  baja: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
}

export function ProductosPage() {
  const { data: productos, loading, error, refetch } = useFetch(productosApi.getAll, [], [])
  const { data: categorias } = useFetch(categoriasApi.getAll, [], [])

  const handleCreate = useCallback(async (data: Record<string, unknown>) => {
    await productosApi.create(data)
  }, [])

  const handleUpdate = useCallback(async (id: number, data: Record<string, unknown>) => {
    await productosApi.update(id, data)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    await productosApi.remove(id)
  }, [])

  return (
    <DataTable<Producto>
      title="Productos"
      subtitle={`${productos.length} productos registrados`}
      loading={loading}
      error={error}
      data={productos}
      onRefresh={refetch}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      columns={[
        { key: 'nombre', label: 'Nombre', render: p => (
          <div>
            <p className="font-medium text-[#fafafa]">{p.nombre}</p>
            {p.descripcion && <p className="text-xs text-[#71717a] mt-0.5 truncate max-w-[200px]">{p.descripcion}</p>}
          </div>
        )},
        { key: 'marca', label: 'Marca / Modelo', render: p => (
          <span className="text-[#a1a1aa]">{[p.marca, p.modelo].filter(Boolean).join(' ') || '—'}</span>
        )},
        { key: 'numeroSerie', label: 'Nº Serie', render: p => (
          p.numeroSerie ? <span className="font-mono text-xs text-[#71717a]">{p.numeroSerie}</span> : <span className="text-[#71717a] text-xs">—</span>
        )},
        { key: 'estado', label: 'Estado', render: p => (
          <span className={twMerge(ESTADO_BADGE[p.estado])}>
            {p.estado.replace(/_/g, ' ')}
          </span>
        )},
        { key: 'categoria', label: 'Categoría', render: p => (
          <span className="text-[#a1a1aa]">{p.categoria?.nombre || '—'}</span>
        )},
        { key: 'ubicacion', label: 'Ubicación' },
      ]}
      formFields={[
        { key: 'nombre', label: 'Nombre', required: true },
        { key: 'descripcion', label: 'Descripción', type: 'textarea' },
        { key: 'marca', label: 'Marca' },
        { key: 'modelo', label: 'Modelo' },
        { key: 'numeroSerie', label: 'Nº Serie', scannable: true },
        { key: 'estado', label: 'Estado', options: [
          { value: 'disponible', label: 'Disponible' },
          { value: 'asignado', label: 'Asignado' },
          { value: 'en_mantenimiento', label: 'En Mantenimiento' },
          { value: 'baja', label: 'Baja' },
        ]},
        { key: 'ubicacion', label: 'Ubicación' },
        { key: 'precio', label: 'Precio (€)', type: 'number' },
        { key: 'fechaAdquisicion', label: 'Fecha Adquisición', type: 'date' },
        { key: 'categoriaId', label: 'Categoría', options: categorias.map(c => ({ value: String(c.id), label: c.nombre })) },
      ]}
    />
  )
}
