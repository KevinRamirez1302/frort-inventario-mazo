import { useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { categoriasApi } from '../api/inventory'
import { DataTable } from '../components/DataTable'
import type { Categoria } from '../types/inventory'

export function CategoriasPage() {
  const { data: categorias, loading, error, refetch } = useFetch(categoriasApi.getAll, [], [])

  const handleCreate = useCallback(async (data: Record<string, unknown>) => {
    await categoriasApi.create(data)
  }, [])

  const handleUpdate = useCallback(async (id: number, data: Record<string, unknown>) => {
    await categoriasApi.update(id, data)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    await categoriasApi.remove(id)
  }, [])

  return (
    <DataTable<Categoria>
      title="Categorías"
      subtitle={`${categorias.length} categorías registradas`}
      loading={loading}
      error={error}
      data={categorias}
      onRefresh={refetch}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      columns={[
        { key: 'nombre', label: 'Nombre', render: c => (
          <span className="font-medium text-[#fafafa]">{c.nombre}</span>
        )},
        { key: 'descripcion', label: 'Descripción' },
      ]}
      formFields={[
        { key: 'nombre', label: 'Nombre', required: true },
        { key: 'descripcion', label: 'Descripción', type: 'textarea' },
      ]}
    />
  )
}
