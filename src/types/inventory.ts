export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  marca: string | null
  modelo: string | null
  numeroSerie: string | null
  estado: 'disponible' | 'asignado' | 'en_mantenimiento' | 'baja'
  ubicacion: string | null
  precio: number | null
  fechaAdquisicion: string | null
  categoriaId: number | null
  categoria?: Categoria
  createdAt: string
  updatedAt: string
}

export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  createdAt: string
  updatedAt: string
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  departamento: string | null
  telefono: string | null
  createdAt: string
  updatedAt: string
}

export interface Movimiento {
  id: number
  productoId: number
  tipo: 'entrada' | 'salida' | 'transferencia' | 'baja' | 'mantenimiento'
  fecha: string
  usuarioId: number | null
  prestamoId: number | null
  observaciones: string | null
  producto?: Producto
  usuario?: Usuario
  createdAt: string
  updatedAt: string
}

export interface Prestamo {
  id: number
  productoId: number
  usuarioId: number
  fechaPrestamo: string
  fechaDevolucion: string | null
  estado: 'activo' | 'devuelto' | 'vencido'
  observaciones: string | null
  producto?: Producto
  usuario?: Usuario
  createdAt: string
  updatedAt: string
}

export type EstadoProducto = Producto['estado']
export type TipoMovimiento = Movimiento['tipo']
export type EstadoPrestamo = Prestamo['estado']
