import { useState, useCallback } from 'react'
import { useFetch } from '../hooks/useFetch'
import { productosApi, categoriasApi } from '../api/inventory'
import { DataTable } from '../components/DataTable'
import { ImportPreviewModal } from '../components/ImportPreviewModal'
import type { Producto } from '../types/inventory'
import { twMerge } from 'tailwind-merge'
import { useToast } from '../hooks/ToastContext'
import { readExcelFile, classifyImportRows, type ImportResult, type ImportProduct } from '../utils/importUtils'

const ESTADO_BADGE: Record<string, string> = {
  disponible: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
  asignado: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
  en_mantenimiento: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
  baja: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
}

export function ProductosPage({
  initialSearch,
  onSearchChange,
  initialNewProductData,
  onClearNewProductData,
}: {
  initialSearch?: string
  onSearchChange?: (val: string) => void
  initialNewProductData?: Record<string, unknown> | null
  onClearNewProductData?: () => void
}) {
  const { data: productos, loading, error, refetch } = useFetch(productosApi.getAll, [], [])
  const { data: categorias } = useFetch(categoriasApi.getAll, [], [])
  const { addToast } = useToast()

  // Importación
  const [importPreviewOpen, setImportPreviewOpen] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importFileName, setImportFileName] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importProcessing, setImportProcessing] = useState(false)

  const handleCreate = useCallback(async (data: Record<string, unknown>) => {
    await productosApi.create(data)
  }, [])

  const handleUpdate = useCallback(async (id: number, data: Record<string, unknown>) => {
    await productosApi.update(id, data)
  }, [])

  const handleDelete = useCallback(async (id: number) => {
    await productosApi.remove(id)
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
      await productosApi.update(item.existingProduct.id, item.data)
      return { id: item.existingProduct.id, isNew: false }
    } else {
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

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        const { isNew } = await processProduct(item)
        if (isNew) createdCount++
        else updatedCount++
      } catch (err) {
        errorsCount++
        console.error(`Error importando fila ${item.rowIndex}:`, err)
      }
    }

    refetch()

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
        exportFilename="inventario_productos"
        initialSearch={initialSearch}
        onSearchChange={onSearchChange}
        initialNewProductData={initialNewProductData}
        onClearNewProductData={onClearNewProductData}
        onImport={handleImportFile}
        importLoading={importLoading || importProcessing}
        exportColumns={[
          { key: 'id',              label: 'ID' },
          { key: 'nombre',          label: 'Nombre' },
          { key: 'descripcion',     label: 'Descripción', format: v => v ? String(v) : '—' },
          { key: 'marca',           label: 'Marca',       format: v => v ? String(v) : '—' },
          { key: 'modelo',          label: 'Modelo',      format: v => v ? String(v) : '—' },
          { key: 'numeroSerie',     label: 'Nº Serie',    format: v => v ? String(v) : '—' },
          { key: 'estado',          label: 'Estado',      format: v => String(v).replace(/_/g, ' ') },
          { key: 'ubicacion',       label: 'Ubicación',   format: v => v ? String(v) : '—' },
          { key: 'precio',          label: 'Precio (€)',  format: v => v !== null && v !== undefined ? String(v) : '—' },
          { key: 'fechaAdquisicion',label: 'Fecha Adq.',  format: v => v ? new Date(String(v)).toLocaleDateString('es-ES') : '—' },
          { key: 'categoria',       label: 'Categoría',   format: (_v, row) => {
            const cat = row.categoria as { nombre?: string } | null | undefined
            return cat?.nombre ?? '—'
          }},
          { key: 'createdAt',       label: 'Creado',      format: v => new Date(String(v)).toLocaleDateString('es-ES') },
        ]}
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
          { key: 'fechaAdquisicion', label: 'Fecha Adquisition', type: 'date' },
          { key: 'categoriaId', label: 'Categoría', options: categorias.map(c => ({ value: String(c.id), label: c.nombre })) },
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
