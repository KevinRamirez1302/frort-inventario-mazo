import {
  LayoutDashboard, Package, Tags, Users, ArrowLeftRight, HandCoins,
  Monitor,
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'

type TabKey = 'dashboard' | 'productos' | 'categorias' | 'usuarios' | 'movimientos' | 'prestamos'

interface TabDef {
  key: TabKey
  label: string
  icon: React.ReactNode
}

export const TABS: TabDef[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'productos', label: 'Productos', icon: <Package size={18} /> },
  { key: 'categorias', label: 'Categorías', icon: <Tags size={18} /> },
  { key: 'usuarios', label: 'Usuarios', icon: <Users size={18} /> },
  { key: 'movimientos', label: 'Movimientos', icon: <ArrowLeftRight size={18} /> },
  { key: 'prestamos', label: 'Préstamos', icon: <HandCoins size={18} /> },
]

export type { TabKey }

interface SidebarProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:flex-shrink-0 border-r border-[#27272a] bg-[#111114]/50">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <Monitor size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#fafafa] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Inventario IT</h1>
              <p className="text-[11px] text-[#71717a] font-mono tracking-wider">INSTITUTO MAZO</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1" role="navigation" aria-label="Navegación principal">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={twMerge(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-[#7c3aed]/10 text-[#7c3aed]'
                  : 'text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b]'
              )}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              <span className={twMerge(
                'transition-colors duration-200',
                activeTab === tab.key ? 'text-[#7c3aed]' : ''
              )}>
                {tab.icon}
              </span>
              {tab.label}
              {activeTab === tab.key && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center text-xs font-bold text-[#71717a]">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#fafafa] truncate">Admin</p>
              <p className="text-xs text-[#71717a] truncate">admin@instituto.es</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#18181b]/85 backdrop-blur-xl border-t border-[#27272a]/60" role="navigation" aria-label="Navegación móvil">
        <div className="flex items-center justify-around py-2 px-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={twMerge(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[10px] font-medium transition-all duration-200 min-w-[56px]',
                activeTab === tab.key
                  ? 'text-[#7c3aed]'
                  : 'text-[#71717a]'
              )}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
