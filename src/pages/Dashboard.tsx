import { useMemo } from 'react'
import { CheckCircle2, Users, ArrowUpRight, ArrowDownRight, Wrench, Ban } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import type { Producto, Categoria, Usuario, Movimiento, Prestamo } from '../types/inventory'

// Import custom PNG assets for dashboard cards
import iconInventario from '../assets/inventario.png'
import iconComprobado from '../assets/comprobado.png'
import iconUsuario from '../assets/usuario.png'
import iconPrestado from '../assets/pedir-prestado.png'

interface DashboardProps {
  productos: Producto[]
  categorias: Categoria[]
  usuarios: Usuario[]
  movimientos: Movimiento[]
  prestamos: Prestamo[]
  role?: string
}

const ESTADO_CONFIG: { key: string; label: string; color: string; icon: React.ReactNode }[] = [
  { key: 'disponible', label: 'Disponibles', color: 'bg-[#10b981]', icon: <CheckCircle2 size={14} /> },
  { key: 'asignado', label: 'Asignados', color: 'bg-[#3b82f6]', icon: <Users size={14} /> },
  { key: 'en_mantenimiento', label: 'Mantenimiento', color: 'bg-[#f59e0b]', icon: <Wrench size={14} /> },
  { key: 'baja', label: 'De baja', color: 'bg-[#ef4444]', icon: <Ban size={14} /> },
]

const ACCENT_ICONS: Record<string, string> = {
  disponible: 'text-[#10b981]',
  asignado: 'text-[#3b82f6]',
  en_mantenimiento: 'text-[#f59e0b]',
  baja: 'text-[#ef4444]',
}

const TIPO_COLORS: Record<string, string> = {
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

export function Dashboard({ productos, categorias, usuarios, movimientos, prestamos, role = 'admin' }: DashboardProps) {
  const isAdmin = role === 'admin'
  const disponibles = productos.filter(p => p.estado === 'disponible').length
  const asignados = productos.filter(p => p.estado === 'asignado').length
  const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length

  const recentMovs = useMemo(() =>
    [...movimientos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10),
    [movimientos]
  )

  const topCategories = useMemo(() => {
    return categorias
      .map(cat => ({
        ...cat,
        count: productos.filter(p => p.categoriaId === cat.id).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [categorias, productos])

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-[#fafafa] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Panel de Control</h1>
        <p className="text-[#71717a] mt-1.5">Resumen del inventario</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <StatCard
          label="Total Productos"
          value={productos.length}
          icon={<img src={iconInventario} alt="" className="w-5 h-5 object-contain" />}
          accent="from-[#7c3aed]/20 to-[#7c3aed]/5"
          accentIcon=""
        />
        <StatCard
          label="Disponibles"
          value={disponibles}
          icon={<img src={iconComprobado} alt="" className="w-5 h-5 object-contain" />}
          accent="from-[#10b981]/20 to-[#10b981]/5"
          accentIcon=""
        />
        <StatCard
          label="Asignados"
          value={asignados}
          icon={<img src={iconUsuario} alt="" className="w-5 h-5 object-contain" />}
          accent="from-[#3b82f6]/20 to-[#3b82f6]/5"
          accentIcon=""
        />
        <StatCard
          label="Préstamos Activos"
          value={prestamosActivos}
          icon={<img src={iconPrestado} alt="" className="w-5 h-5 object-contain" />}
          accent="from-[#f59e0b]/20 to-[#f59e0b]/5"
          accentIcon=""
        />
      </div>

      {/* Main grid */}
      <div className={twMerge(
        'grid grid-cols-1 gap-6 stagger-children',
        isAdmin ? 'xl:grid-cols-3' : 'xl:grid-cols-2'
      )}>
        {/* Estado breakdown */}
        <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-6 card-hover">
          <h3 className="text-sm font-semibold text-[#fafafa] mb-5" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Estado del Inventario</h3>
          <div className="space-y-4">
            {ESTADO_CONFIG.map(cfg => {
              const count = productos.filter(p => p.estado === cfg.key).length
              const pct = productos.length ? Math.round((count / productos.length) * 100) : 0
              return (
                <div key={cfg.key}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className={twMerge('flex items-center gap-2', ACCENT_ICONS[cfg.key])}>
                      {cfg.icon}
                      {cfg.label}
                    </span>
                    <span className="text-[#71717a] font-mono">{count} <span className="opacity-60">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-[#09090b] rounded-full overflow-hidden">
                    <div
                      className={twMerge('h-full rounded-full transition-all duration-700', cfg.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top categories */}
        <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-6 card-hover">
          <h3 className="text-sm font-semibold text-[#fafafa] mb-5" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Categorías Top</h3>
          <div className="space-y-3">
            {topCategories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#18181b] flex items-center justify-center text-xs font-mono text-[#71717a] flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#a1a1aa] truncate">{cat.nombre}</p>
                  {cat.descripcion && (
                    <p className="text-xs text-[#71717a] truncate">{cat.descripcion}</p>
                  )}
                </div>
                <span className="text-sm font-mono text-[#fafafa] font-medium">{cat.count}</span>
              </div>
            ))}
            {topCategories.length === 0 && (
              <p className="text-[#71717a] text-xs text-center py-4">Sin categorías</p>
            )}
          </div>
        </div>

        {/* Users with loans */}
        {isAdmin && (
          <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-6 card-hover">
            <h3 className="text-sm font-semibold text-[#fafafa] mb-5" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Usuarios con Préstamos</h3>
            <div className="space-y-3">
              {usuarios
                .map(u => ({
                  ...u,
                  activeLoans: prestamos.filter(p => p.usuarioId === u.id && p.estado === 'activo').length,
                }))
                .filter(u => u.activeLoans > 0)
                .sort((a, b) => b.activeLoans - a.activeLoans)
                .slice(0, 6)
                .map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed]/30 to-[#3b82f6]/30 flex items-center justify-center text-xs font-bold text-[#fafafa] flex-shrink-0">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#a1a1aa] truncate">{u.nombre}</p>
                      {u.departamento && (
                        <p className="text-xs text-[#71717a]">{u.departamento}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20">
                      {u.activeLoans}
                    </span>
                  </div>
                ))}
              {usuarios.filter(u => prestamos.some(p => p.usuarioId === u.id && p.estado === 'activo')).length === 0 && (
                <p className="text-[#71717a] text-xs text-center py-4">Sin préstamos activos</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent movements */}
      <div className="bg-[#111114] border border-[#27272a] rounded-2xl card-hover stagger-children">
        <div className="px-6 py-5 border-b border-[#27272a]">
          <h3 className="text-sm font-semibold text-[#fafafa]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Últimos Movimientos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#71717a] text-xs font-mono uppercase tracking-wider">
                <th className="text-left py-3 px-6">Tipo</th>
                <th className="text-left py-3 px-6">Producto</th>
                <th className="text-left py-3 px-6">Usuario</th>
                <th className="text-left py-3 px-6">Fecha</th>
                <th className="text-left py-3 px-6 hidden md:table-cell">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {recentMovs.map(m => (
                <tr key={m.id} className="border-t border-[#27272a]/40 table-row-hover">
                  <td className="py-3 px-6">
                    <span className={twMerge(TIPO_COLORS[m.tipo])}>
                      {TIPO_ICONS[m.tipo]}
                      <span className="capitalize">{m.tipo}</span>
                    </span>
                  </td>
                  <td className="py-3 px-6 text-[#a1a1aa]">
                    {m.producto?.nombre || <span className="text-[#71717a] font-mono">#{m.productoId}</span>}
                  </td>
                  <td className="py-3 px-6 text-[#a1a1aa]">
                    {m.usuario?.nombre || <span className="text-[#71717a] font-mono">#{m.usuarioId}</span>}
                  </td>
                  <td className="py-3 px-6 text-[#71717a] font-mono text-xs">
                    {new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-6 text-[#71717a] text-xs hidden md:table-cell max-w-[240px] truncate">
                    {m.observaciones || '—'}
                  </td>
                </tr>
              ))}
              {recentMovs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#71717a] text-sm">
                    Sin movimientos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent, accentIcon }: {
  label: string; value: number; icon: React.ReactNode; accent: string; accentIcon: string
}) {
  return (
    <div className="bg-[#111114] border border-[#27272a] rounded-2xl p-5 card-hover group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-[#71717a] uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-[#fafafa] mt-2" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{value}</p>
        </div>
        <div className={twMerge('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', accent, accentIcon)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
