import { useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { usuariosApi } from '../api/inventory'
import { DataTable } from '../components/DataTable'
import type { Usuario } from '../types/inventory'

export function UsuariosPage() {
  const { data: usuarios, loading, error, refetch } = useFetch(usuariosApi.getAll, [], [])

  const handleCreate = useCallback(async (data: Record<string, unknown>) => {
    await usuariosApi.create(data)
  }, [])

  const handleUpdate = useCallback(async (id: number, data: Record<string, unknown>) => {
    await usuariosApi.update(id, data)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    await usuariosApi.remove(id)
  }, [])

  return (
    <DataTable<Usuario>
      title="Usuarios"
      subtitle={`${usuarios.length} usuarios registrados`}
      loading={loading}
      error={error}
      data={usuarios}
      onRefresh={refetch}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      columns={[
        { key: 'nombre', label: 'Nombre', render: u => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed]/30 to-[#3b82f6]/30 flex items-center justify-center text-xs font-bold text-[#fafafa] flex-shrink-0">
              {u.nombre.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-[#fafafa]">{u.nombre}</span>
          </div>
        )},
        { key: 'email', label: 'Email', render: u => (
          <span className="font-mono text-xs text-[#71717a]">{u.email}</span>
        )},
        { key: 'departamento', label: 'Departamento' },
        { key: 'telefono', label: 'Teléfono', render: u => (
          u.telefono ? <span className="font-mono text-xs text-[#71717a]">{u.telefono}</span> : <span className="text-[#71717a] text-xs">—</span>
        )},
      ]}
      formFields={[
        { key: 'nombre', label: 'Nombre', required: true },
        { key: 'email', label: 'Email', required: true },
        { key: 'departamento', label: 'Departamento' },
        { key: 'telefono', label: 'Teléfono' },
      ]}
    />
  )
}
