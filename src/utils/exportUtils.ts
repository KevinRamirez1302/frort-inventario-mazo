import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ExportColumn {
  key: string
  label: string
  /** Función opcional para transformar el valor a texto plano */
  format?: (value: unknown, row: Record<string, unknown>) => string
}

export interface ExportOptions {
  title: string
  subtitle?: string
  filename?: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCellValue(
  col: ExportColumn,
  row: Record<string, unknown>,
): string {
  const raw = row[col.key]
  if (col.format) return col.format(raw, row)
  if (raw === null || raw === undefined) return '—'
  return String(raw)
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

/**
 * Genera y descarga un PDF con los datos del inventario.
 */
export function exportToPDF(options: ExportOptions): void {
  const { title, subtitle, filename = 'inventario', columns, data } = options
  const now = new Date()
  const dateStr = formatDate(now.toISOString())

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // ── Portada / cabecera ────────────────────────────────────────────────────

  // Fondo del encabezado
  doc.setFillColor(15, 15, 18)        // #0f0f12
  doc.rect(0, 0, 297, 297, 'F')

  // Banda superior morada
  doc.setFillColor(124, 58, 237)      // #7c3aed
  doc.rect(0, 0, 297, 22, 'F')

  // Título principal
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(title, 12, 14)

  // Subtítulo / metadata en la banda
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(220, 200, 255)
    doc.text(subtitle, 12, 19.5)
  }

  // Fecha en el lado derecho de la banda
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(220, 200, 255)
  doc.text(`Generado: ${dateStr}`, 285, 14, { align: 'right' })
  doc.text(`Total: ${data.length} registros`, 285, 19.5, { align: 'right' })

  // ── Tabla ─────────────────────────────────────────────────────────────────

  const head = [columns.map(c => c.label)]
  const body = data.map(row => columns.map(col => getCellValue(col, row)))

  autoTable(doc, {
    head,
    body,
    startY: 28,
    margin: { left: 10, right: 10 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: [220, 220, 224],
      lineColor: [39, 39, 42],
      lineWidth: 0.2,
      fillColor: [17, 17, 20],
    },
    headStyles: {
      fillColor: [30, 30, 34],
      textColor: [160, 160, 170],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [20, 20, 24],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
    didDrawPage: (hookData) => {
      // Pie de página
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 110)
      doc.text(
        `Página ${hookData.pageNumber} de ${pageCount}  ·  Instituto Mazo · Sistema de Inventario`,
        148.5,
        205,
        { align: 'center' },
      )
      // Línea separadora del pie
      doc.setDrawColor(39, 39, 42)
      doc.line(10, 202, 287, 202)
    },
  })

  doc.save(`${filename}_${now.toISOString().slice(0, 10)}.pdf`)
}

// ─── Excel (XLSX) ─────────────────────────────────────────────────────────────

/**
 * Genera y descarga un archivo .xlsx con los datos del inventario.
 */
export function exportToXLSX(options: ExportOptions): void {
  const { title, filename = 'inventario', columns, data } = options
  const now = new Date()

  // Construir filas
  const headers = columns.map(c => c.label)
  const rows = data.map(row => columns.map(col => getCellValue(col, row)))

  // Hoja principal con datos
  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Anchos de columna automáticos
  const colWidths = columns.map((col, i) => {
    const maxLen = Math.max(
      col.label.length,
      ...rows.map(r => String(r[i] ?? '').length),
    )
    return { wch: Math.min(maxLen + 4, 40) }
  })
  ws['!cols'] = colWidths

  // Estilos de cabecera (sólo en entornos que soporten estilos, como xlsx-style)
  // xlsx base no soporta estilos directamente pero sí ancho de columnas.

  // Hoja de metadatos
  const metaData = [
    ['Reporte de Inventario', ''],
    ['Sección', title],
    ['Fecha de exportación', new Intl.DateTimeFormat('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(now)],
    ['Total de registros', data.length],
    ['Generado por', 'Sistema de Inventario · Instituto Mazo'],
  ]
  const wsMeta = XLSX.utils.aoa_to_sheet(metaData)
  wsMeta['!cols'] = [{ wch: 28 }, { wch: 40 }]

  // Libro
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31))   // máx 31 chars en nombre de hoja
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Información')

  XLSX.writeFile(wb, `${filename}_${now.toISOString().slice(0, 10)}.xlsx`)
}
