import { api } from './client'
import type { Producto, Categoria, Usuario, Movimiento, Prestamo, AuthResponse } from '../types/inventory'

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data),
  getProfile: () =>
    api.get<Omit<Usuario, 'password'>>('/auth/profile').then(r => r.data),
  updateProfile: (data: { nombre?: string; password?: string }) =>
    api.patch<Omit<Usuario, 'password'>>('/usuarios/profile', data).then(r => r.data),
}

// Productos
export const productosApi = {
  getAll: () => api.get<Producto[]>('/productos').then(r => r.data),
  getById: (id: number) => api.get<Producto>(`/productos/${id}`).then(r => r.data),
  create: (data: Partial<Producto>) => api.post<Producto>('/productos', data).then(r => r.data),
  update: (id: number, data: Partial<Producto>) => api.patch<Producto>(`/productos/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/productos/${id}`),
  findByEstado: (estado: string) => api.get<Producto[]>(`/productos/estado/${estado}`).then(r => r.data),
  findByCategoria: (categoriaId: number) => api.get<Producto[]>(`/productos/categoria/${categoriaId}`).then(r => r.data),
}

// Categorias
export const categoriasApi = {
  getAll: () => api.get<Categoria[]>('/categoria').then(r => r.data),
  getById: (id: number) => api.get<Categoria>(`/categoria/${id}`).then(r => r.data),
  create: (data: Partial<Categoria>) => api.post<Categoria>('/categoria', data).then(r => r.data),
  update: (id: number, data: Partial<Categoria>) => api.patch<Categoria>(`/categoria/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/categoria/${id}`),
}

// Usuarios
export const usuariosApi = {
  getAll: () => api.get<Usuario[]>('/usuarios').then(r => r.data),
  getById: (id: number) => api.get<Usuario>(`/usuarios/${id}`).then(r => r.data),
  create: (data: Partial<Usuario>) => api.post<Usuario>('/usuarios', data).then(r => r.data),
  update: (id: number, data: Partial<Usuario>) => api.patch<Usuario>(`/usuarios/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/usuarios/${id}`),
}

// Movimientos
export const movimientosApi = {
  getAll: () => api.get<Movimiento[]>('/movimientos').then(r => r.data),
  getById: (id: number) => api.get<Movimiento>(`/movimientos/${id}`).then(r => r.data),
  create: (data: Partial<Movimiento>) => api.post<Movimiento>('/movimientos', data).then(r => r.data),
  update: (id: number, data: Partial<Movimiento>) => api.patch<Movimiento>(`/movimientos/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/movimientos/${id}`),
  findByProducto: (productoId: number) => api.get<Movimiento[]>(`/movimientos/producto/${productoId}`).then(r => r.data),
  findByUsuario: (usuarioId: number) => api.get<Movimiento[]>(`/movimientos/usuario/${usuarioId}`).then(r => r.data),
}

// Prestamos
export const prestamosApi = {
  getAll: () => api.get<Prestamo[]>('/prestamos').then(r => r.data),
  getById: (id: number) => api.get<Prestamo>(`/prestamos/${id}`).then(r => r.data),
  create: (data: Partial<Prestamo>) => api.post<Prestamo>('/prestamos', data).then(r => r.data),
  update: (id: number, data: Partial<Prestamo>) => api.patch<Prestamo>(`/prestamos/${id}`, data).then(r => r.data),
  remove: (id: number) => api.delete(`/prestamos/${id}`),
  findActivos: () => api.get<Prestamo[]>('/prestamos/activos').then(r => r.data),
  findByUsuario: (usuarioId: number) => api.get<Prestamo[]>(`/prestamos/usuario/${usuarioId}`).then(r => r.data),
}
