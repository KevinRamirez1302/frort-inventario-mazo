import { useState, useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { movimientosApi, productosApi, usuariosApi, categoriasApi } from '../api/inventory'
import { DataTable } from '../components/DataTable'
import { ImportPreviewModal } from '../components/ImportPreviewModal'
import type { Movimiento } from '../types/inventory'
import { twMerge } from 'tailwind-merge'
import { ArrowDownRight, ArrowUpRight, Wrench, Ban } from 'lucide-react'
import { useToast } from '../hooks/ToastContext'
import { readExcelFile, classifyImportRows, type ImportResult, type ImportProduct } from '../utils/importUtils'

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
  const { data: categorias } = useFetch(categoriasApi.getAll, [], [])
  const { addToast } = useToast()

  // Importación
  const [importPreviewOpen, setImportPreviewOpen] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importFileName, setImportFileName] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importProcessing, setImportProcessing] = useState(false)

  const handleCreate = useCallback(async (data: Record<string, unknown>) => {
    await movimientosApi.create(data)
  }, [])

  const handleUpdate = useCallback(async (id: number, data: Record<string, unknown>) => {
    await movimientosApi.update(id, data)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    await movimientosApi.remove(id)
  }, [])

  // ─── Importar Excel ─────────────────────────────────────────────────────────

  const handleImportFile = useCallback(async (file: File) => {
    setImportLoading(true)
    try {
      const rows = await readExcelFile(file)
      if (rows.length === 0) {
        addToast('El archivo Excel está vacío', 'error')
        setImportLoading(false)
        return
      }
      const result = classifyImportRows(rows, productos, categorias)
      setImportResult(result)
      setImportFileName(file.name)
      setImportPreviewOpen(true)
    } catch (err) {
      addToast(`Error al leer archivo: ${(err as Error).message}`, 'error')
    } finally {
      setImportLoading(false)
    }
  }, [productos, categorias, addToast])

  const processProduct = useCallback(async (item: ImportProduct): Promise<{ id: number; isNew: boolean }> => {
    if (item.existingProduct) {
      // Actualizar
      await productosApi.update(item.existingProduct.id, item.data)
      return { id: item.existingProduct.id, isNew: false }
    } else {
      // Crear
      const created = await productosApi.create(item.data)
      return { id: created.id, isNew: true }
    }
  }, [])

  const handleConfirmImport = useCallback(async () => {
    if (!importResult) return
    setImportProcessing(true)
    setImportPreviewOpen(false)

    const { toCreate, toUpdate } = importResult
    const items = [...toCreate, ...toUpdate]
    let createdCount = 0
    let updatedCount = 0
    let errorsCount = 0

    const now = new Date().toISOString()

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const { id, isNew } = await processProduct(item)
        // Registrar movimiento de entrada
        await movimientosApi.create({
          productoId: id,
          tipo: 'entrada',
          fecha: now,
          observaciones: item.existingProduct
            ? 'Producto actualizado e importado desde Excel'
            : 'Producto importado desde Excel',
        })
        if (isNew) createdCount++
        else updatedCount++
      } catch (err) {
        errorsCount++
        console.error(`Error importando fila ${item.rowIndex}:`, err)
      }
    }

    // Refrescar datos
    refetch()
    // Refrescar productos indirectamente (no hay un hook directo, pero refetch de movimientos es suficiente para la UI)
    // El producto recién creado aparecerá en la lista de movimientos

    setImportProcessing(false)
    setImportResult(null)

    if (createdCount > 0 || updatedCount > 0) {
      addToast(
        `Importación completada: ${createdCount} creados, ${updatedCount} actualizados${errorsCount > 0 ? `, ${errorsCount} errores` : ''}`,
        'success',
      )
    } else {
      addToast('No se pudo importar ningún producto', 'error')
    }
  }, [importResult, processProduct, refetch, addToast])

  const handleCancelImport = useCallback(() => {
    setImportPreviewOpen(false)
    setImportResult(null)
    setImportFileName('')
  }, [])

  return (
    <>
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
        exportFilename="inventario_movimientos"
        onImport={handleImportFile}
        importLoading={importLoading || importProcessing}
        exportColumns={[
          { key: 'id',           label: 'ID' },
          { key: 'tipo',         label: 'Tipo',      format: v => String(v) },
          { key: 'producto',     label: 'Producto',  format: (_v, row) => {
            const p = row.producto as { nombre?: string } | null | undefined
            return p?.nombre ?? `#${row.productoId}`
          }},
          { key: 'usuario',      label: 'Usuario',   format: (_v, row) => {
            const u = row.usuario as { nombre?: string } | null | undefined
            return u?.nombre ?? '—'
          }},
          { key: 'fecha',        label: 'Fecha',     format: v => new Date(String(v)).toLocaleString('es-ES') },
          { key: 'observaciones',label: 'Observaciones', format: v => v ? String(v) : '—' },
        ]}
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

      <ImportPreviewModal
        open={importPreviewOpen}
        result={importResult}
        fileName={importFileName}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
        loading={importProcessing}
      />
    </>
  )
}
