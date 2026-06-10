import * as XLSX from 'xlsx'
import type { Producto, Categoria, EstadoProducto } from '../types/inventory'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ExcelRow {
  nombre?: string
  descripcion?: string
  marca?: string
  modelo?: string
  numeroSerie?: string
  estado?: string
  ubicacion?: string
  precio?: string | number
  fechaAdquisicion?: string
  categoria?: string
  [key: string]: unknown
}

export interface ImportError {
  rowIndex: number
  field: string
  message: string
  rawValue: unknown
}

export interface ImportProduct {
  rowIndex: number
  data: Partial<Producto>
  original: ExcelRow
  existingProduct?: Producto
}

export interface ImportResult {
  toCreate: ImportProduct[]
  toUpdate: ImportProduct[]
  errors: ImportError[]
  warnings: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_ESTADOS: EstadoProducto[] = ['disponible', 'asignado', 'en_mantenimiento', 'baja']

function normalizeString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined
  const s = String(v).trim()
  return s.length > 0 ? s : undefined
}

function normalizeNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  if (Number.isNaN(n)) return null
  return n
}

function normalizeDate(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  const s = String(v).trim()
  // Si ya es ISO-like YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    try {
      const d = new Date(s)
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    } catch { /* noop */ }
  }
  // Intentar parsear fechas españolas DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\-/](\d{1,2})[\-/](\d{4})$/)
  if (m) {
    const [, d, mon, y] = m
    const iso = `${y}-${mon.padStart(2, '0')}-${d.padStart(2, '0')}`
    const date = new Date(iso)
    if (!Number.isNaN(date.getTime())) return iso
  }
  return null
}

function normalizeEstado(v: unknown): EstadoProducto | null {
  const s = normalizeString(v)
  if (!s) return null
  const norm = s.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  if (VALID_ESTADOS.includes(norm as EstadoProducto)) return norm as EstadoProducto
  // Alias comunes
  const aliases: Record<string, EstadoProducto> = {
    disponible: 'disponible',
    asignado: 'asignado',
    asignada: 'asignado',
    en_mantenimiento: 'en_mantenimiento',
    mantenimiento: 'en_mantenimiento',
    baja: 'baja',
    de_baja: 'baja',
  }
  return aliases[norm] ?? null
}

function resolveCategoriaId(nombreCategoria: string | undefined, categorias: Categoria[]): number | null {
  if (!nombreCategoria) return null
  const norm = nombreCategoria.trim().toLowerCase()
  const found = categorias.find(c => c.nombre.toLowerCase() === norm)
  return found ? found.id : null
}

// ─── Leer Excel ───────────────────────────────────────────────────────────────

export function readExcelFile(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('No se pudo leer el archivo'))
          return
        }
        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        if (!firstSheet) {
          reject(new Error('El archivo Excel no tiene hojas'))
          return
        }
        const json = XLSX.utils.sheet_to_json<ExcelRow>(firstSheet, { defval: '' })
        resolve(json)
      } catch (err) {
        reject(new Error(`Error al leer Excel: ${(err as Error).message}`))
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsBinaryString(file)
  })
}

// ─── Validar y mapear filas ───────────────────────────────────────────────────

export function classifyImportRows(
  rows: ExcelRow[],
  existingProducts: Producto[],
  categorias: Categoria[],
): ImportResult {
  const toCreate: ImportProduct[] = []
  const toUpdate: ImportProduct[] = []
  const errors: ImportError[] = []
  const missingCategorias = new Set<string>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowIndex = i + 2 // +1 por header, +1 por 1-based

    // Validar nombre obligatorio
    const nombre = normalizeString(row.nombre)
    if (!nombre) {
      errors.push({ rowIndex, field: 'nombre', message: 'El nombre es obligatorio', rawValue: row.nombre })
      continue
    }

    // Validar estado si se proporciona
    let estado: EstadoProducto | null = null
    if (row.estado !== undefined && row.estado !== '') {
      estado = normalizeEstado(row.estado)
      if (!estado) {
        errors.push({ rowIndex, field: 'estado', message: `Estado inválido: "${row.estado}"`, rawValue: row.estado })
        continue
      }
    }

    // Validar precio
    let precio: number | null = null
    if (row.precio !== undefined && row.precio !== '') {
      precio = normalizeNumber(row.precio)
      if (precio === null) {
        errors.push({ rowIndex, field: 'precio', message: `Precio inválido: "${row.precio}"`, rawValue: row.precio })
        continue
      }
    }

    // Validar fecha
    let fechaAdquisicion: string | null = null
    if (row.fechaAdquisicion !== undefined && row.fechaAdquisicion !== '') {
      fechaAdquisicion = normalizeDate(row.fechaAdquisicion)
      if (!fechaAdquisicion) {
        errors.push({ rowIndex, field: 'fechaAdquisicion', message: `Fecha inválida: "${row.fechaAdquisicion}"`, rawValue: row.fechaAdquisicion })
        continue
      }
    }

    // Resolver categoría
    const categoriaNombre = normalizeString(row.categoria)
    const categoriaId = resolveCategoriaId(categoriaNombre, categorias)
    if (categoriaNombre && categoriaId === null) {
      missingCategorias.add(categoriaNombre)
    }

    // Construir producto
    const producto: Partial<Producto> = {
      nombre,
      descripcion: normalizeString(row.descripcion) ?? null,
      marca: normalizeString(row.marca) ?? null,
      modelo: normalizeString(row.modelo) ?? null,
      numeroSerie: normalizeString(row.numeroSerie) ?? null,
      estado: estado ?? 'disponible',
      ubicacion: normalizeString(row.ubicacion) ?? null,
      precio,
      fechaAdquisicion,
      categoriaId,
    }

    // Detectar duplicado por número de serie
    const numeroSerie = producto.numeroSerie
    const existing = numeroSerie
      ? existingProducts.find(p => p.numeroSerie && p.numeroSerie.toLowerCase() === numeroSerie.toLowerCase())
      : undefined

    const importProduct: ImportProduct = {
      rowIndex,
      data: producto,
      original: row,
      existingProduct: existing,
    }

    if (existing) {
      toUpdate.push(importProduct)
    } else {
      toCreate.push(importProduct)
    }
  }

  const warnings: string[] = []
  if (missingCategorias.size > 0) {
    warnings.push(`Categorías no encontradas (se asignarán sin categoría): ${Array.from(missingCategorias).join(', ')}`)
  }

  return { toCreate, toUpdate, errors, warnings }
}

// ─── Formato de preview ───────────────────────────────────────────────────────

export function formatPreviewText(producto: Partial<Producto>): string {
  const parts: string[] = [producto.nombre ?? 'Sin nombre']
  if (producto.marca) parts.push(producto.marca)
  if (producto.modelo) parts.push(producto.modelo)
  if (producto.numeroSerie) parts.push(`S/N: ${producto.numeroSerie}`)
  return parts.join(' · ')
}
