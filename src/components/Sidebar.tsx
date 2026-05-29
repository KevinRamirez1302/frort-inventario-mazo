import { twMerge } from 'tailwind-merge'
import { Settings } from 'lucide-react'
import logoMazito from '../assets/mazito.png'

// Import custom PNG assets for tabs
import iconTablero from '../assets/tablero-de-mandos.png'
import iconInventario from '../assets/inventario.png'
import iconCategorias from '../assets/categorias.png'
import iconUsuario from '../assets/usuario.png'
import iconAsignar from '../assets/asignar.png'
import iconPrestado from '../assets/pedir-prestado.png'

type TabKey = 'dashboard' | 'productos' | 'categorias' | 'usuarios' | 'movimientos' | 'prestamos' | '404'

interface TabDef {
  key: TabKey
  label: string
  iconSrc: string
}

export const TABS: TabDef[] = [
  { key: 'dashboard', label: 'Dashboard', iconSrc: iconTablero },
  { key: 'productos', label: 'Productos', iconSrc: iconInventario },
  { key: 'categorias', label: 'Categorías', iconSrc: iconCategorias },
  { key: 'usuarios', label: 'Usuarios', iconSrc: iconUsuario },
  { key: 'movimientos', label: 'Movimientos', iconSrc: iconAsignar },
  { key: 'prestamos', label: 'Préstamos', iconSrc: iconPrestado },
]

export type { TabKey }

interface SidebarProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  profile: { nombre: string; email: string; avatar: string }
  onSettingsClick: () => void
  role?: string
}

export function Sidebar({ activeTab, onTabChange, profile, onSettingsClick, role = 'admin' }: SidebarProps) {
  const isAdmin = role === 'admin'

  const visibleTabs = TABS.filter(tab => {
    if (tab.key === 'usuarios' && !isAdmin) return false
    return true
  })

  // Get initials for profile avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AD'
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:flex-shrink-0 border-r border-[#27272a] bg-[#111114]/50">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center">
              <img src={logoMazito} alt="Logo Mazito" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#fafafa] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Inventario</h1>
              <p className="text-[11px] text-[#71717a] font-mono tracking-wider">IES VILLA DE MAZO</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1" role="navigation" aria-label="Navegación principal">
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={twMerge(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-[#7c3aed]/10 text-[#7c3aed]'
                    : 'text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <img
                  src={tab.iconSrc}
                  alt=""
                  className={twMerge(
                    'w-[18px] h-[18px] object-contain transition-all duration-250',
                    isActive
                      ? 'opacity-100 brightness-110 filter drop-shadow-[0_0_6px_rgba(124,58,237,0.4)]'
                      : 'opacity-40 grayscale group-hover:opacity-80 group-hover:grayscale-0'
                  )}
                />
                {tab.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#27272a]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-border-subtle" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center text-xs font-bold text-[#71717a] uppercase flex-shrink-0">
                  {getInitials(profile.nombre)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#fafafa] truncate">{profile.nombre}</p>
                <p className="text-xs text-[#71717a] truncate">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={onSettingsClick}
              className="p-2 rounded-xl text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-all duration-200 cursor-pointer flex-shrink-0"
              title="Ajustes de perfil"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#18181b]/85 backdrop-blur-xl border-t border-[#27272a]/60" role="navigation" aria-label="Navegación móvil" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around py-2 px-1">
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={twMerge(
                  'flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl text-[10px] font-medium transition-all duration-200 min-w-[56px]',
                  isActive ? 'text-[#7c3aed]' : 'text-[#71717a]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <img
                  src={tab.iconSrc}
                  alt=""
                  className={twMerge(
                    'w-4.5 h-4.5 object-contain transition-all duration-200',
                    isActive ? 'opacity-100' : 'opacity-40 grayscale'
                  )}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
