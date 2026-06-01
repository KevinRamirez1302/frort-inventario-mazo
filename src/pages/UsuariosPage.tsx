import { useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { usuariosApi } from '../api/inventory'
import { DataTable } from '../components/DataTable'
import type { Usuario } from '../types/inventory'

const ROL_STYLES: Record<string, string> = {
  alumno:       'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
  profesor:     'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
  desarrollador:'bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20',
}

const ROL_LABEL: Record<string, string> = {
  alumno: 'Alumno',
  profesor: 'Profesor',
  desarrollador: 'Desarrollador',
}

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
        {
          key: 'nombre', label: 'Nombre', render: u => (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed]/30 to-[#3b82f6]/30 flex items-center justify-center text-xs font-bold text-[#fafafa] flex-shrink-0">
                {u.nombre.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-[#fafafa]">{u.nombre}</span>
            </div>
          )
        },
        {
          key: 'email', label: 'Email', render: u => (
            <span className="font-mono text-xs text-[#71717a]">{u.email}</span>
          )
        },
        {
          key: 'rol', label: 'Rol', render: u => (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${ROL_STYLES[u.rol] ?? 'bg-[#27272a] text-[#a1a1aa] border-[#27272a]'}`}>
              {ROL_LABEL[u.rol] ?? u.rol}
            </span>
          )
        },
        { key: 'departamento', label: 'Departamento' },
        {
          key: 'telefono', label: 'Teléfono', render: u => (
            u.telefono ? <span className="font-mono text-xs text-[#71717a]">{u.telefono}</span> : <span className="text-[#71717a] text-xs">—</span>
          )
        },
      ]}
      formFields={[
        { key: 'nombre', label: 'Nombre', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'password', label: 'Contraseña', type: 'password', required: true },
        {
          key: 'rol', label: 'Rol', required: true,
          options: [
            { value: 'alumno', label: '🎓 Alumno' },
            { value: 'profesor', label: '👨‍🏫 Profesor' },
            { value: 'desarrollador', label: '🛠️ Desarrollador' },
          ]
        },
        { key: 'departamento', label: 'Departamento' },
        { key: 'telefono', label: 'Teléfono' },
      ]}
    />
  )
}
