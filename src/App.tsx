import { useState, useEffect, lazy, Suspense } from 'react'
import { Sidebar, type TabKey } from './components/Sidebar'
import { ToastProvider } from './hooks/useToast'
import { Dashboard } from './pages/Dashboard'
import { ProductosPage } from './pages/ProductosPage'
import { CategoriasPage } from './pages/CategoriasPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { MovimientosPage } from './pages/MovimientosPage'
import { PrestamosPage } from './pages/PrestamosPage'
import { useFetch } from './hooks/useFetch'
import { productosApi, categoriasApi, usuariosApi, movimientosApi, prestamosApi } from './api/inventory'
import { Sun, Moon, LogOut, ScanLine, Check, AlertTriangle, Eye, Plus } from 'lucide-react'
import { LoginPage } from './pages/LoginPage'
import { SettingsModal } from './components/SettingsModal'
import { NotFoundPage } from './pages/NotFoundPage'
import { Modal } from './components/Modal'
import type { Producto } from './types/inventory'
import { twMerge } from 'tailwind-merge'

const BarcodeScanner = lazy(() =>
  import('./components/BarcodeScanner').then(m => ({ default: m.BarcodeScanner }))
)

interface AppContentProps {
  onLogout: () => void
  user: { nombre: string; email: string; rol: string; fotoPerfil?: string }
}

function AppContent({ onLogout, user }: AppContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  const role = user.rol

  const [profile, setProfile] = useState({
    nombre: user.nombre,
    email: user.email,
    avatar: user.fotoPerfil || '',
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [lastScannedProduct, setLastScannedProduct] = useState<Producto | null>(null)
  const [isScanResultOpen, setIsScanResultOpen] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [initialNewProductData, setInitialNewProductData] = useState<Record<string, unknown> | null>(null)

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  const handleScanSuccess = (text: string, _format: string) => {
    setIsScannerOpen(false)
    const scannedCode = text.trim()
    setLastScannedCode(scannedCode)

    const found = productos.find(p =>
      (p.numeroSerie && p.numeroSerie.trim().toLowerCase() === scannedCode.toLowerCase()) ||
      String(p.id) === scannedCode ||
      (p.nombre && p.nombre.trim().toLowerCase() === scannedCode.toLowerCase())
    )

    setLastScannedProduct(found || null)
    setIsScanResultOpen(true)
  }

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleTabChange = (tab: TabKey) => {
    if (tab !== 'productos') {
      setProductSearchQuery('')
      setInitialNewProductData(null)
    }
    if (tab === 'usuarios' && role !== 'profesor' && role !== 'desarrollador') {
      setActiveTab('404')
    } else {
      setActiveTab(tab)
    }
  }

  const { data: productos, loading: loadingProd } = useFetch(productosApi.getAll, [], [])
  const { data: categorias } = useFetch(categoriasApi.getAll, [], [])
  const { data: usuarios } = useFetch(usuariosApi.getAll, [], [])
  const { data: movimientos } = useFetch(movimientosApi.getAll, [], [])
  const { data: prestamos } = useFetch(prestamosApi.getAll, [], [])

  return (
    <div className="bg-gradient-mesh flex min-h-screen relative">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        profile={profile}
        onSettingsClick={() => setIsSettingsOpen(true)}
        role={role === 'desarrollador' ? 'admin' : role === 'profesor' ? 'admin' : 'user'}
      />

      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-20 pb-28 lg:pb-8 overflow-y-auto max-w-[1600px] mx-auto w-full relative">
        {/* Floating Theme Toggle and Logout Buttons */}
        <div className="absolute top-4 right-4 lg:top-8 lg:right-8 z-30 flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md text-text-secondary hover:text-text-primary hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? (
              <Moon size={20} className="transition-transform duration-300" />
            ) : (
              <Sun size={20} className="transition-transform duration-300 text-[#f59e0b]" />
            )}
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-3 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md text-text-secondary hover:text-[#7c3aed] hover:border-[#7c3aed]/30 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center"
            title="Escanear código QR o de barras"
          >
            <ScanLine size={20} />
          </button>

          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="p-3 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md text-text-secondary hover:text-[#ef4444] hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>

        {loadingProd ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-10 h-10 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[#71717a] text-sm">Cargando inventario...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                productos={productos}
                categorias={categorias}
                usuarios={usuarios}
                movimientos={movimientos}
                prestamos={prestamos}
                role={role === 'desarrollador' ? 'admin' : role === 'profesor' ? 'admin' : 'user'}
              />
            )}
            {activeTab === 'productos' && (
              <ProductosPage
                initialSearch={productSearchQuery}
                onSearchChange={setProductSearchQuery}
                initialNewProductData={initialNewProductData}
                onClearNewProductData={() => setInitialNewProductData(null)}
              />
            )}
            {activeTab === 'categorias' && <CategoriasPage />}
            {activeTab === 'usuarios' && (role === 'profesor' || role === 'desarrollador') && <UsuariosPage />}
            {activeTab === 'movimientos' && <MovimientosPage />}
            {activeTab === 'prestamos' && <PrestamosPage />}
            {activeTab === '404' && <NotFoundPage onGoBack={() => setActiveTab('dashboard')} />}
          </>
        )}
      </main>

      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onProfileUpdate={setProfile}
      />

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setIsScannerOpen(false) }}
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        >
          <div className="w-full max-w-sm animate-scale-in">
            <Suspense fallback={
              <div className="flex items-center justify-center gap-3 py-16 px-6 bg-bg-surface/95 backdrop-blur-2xl rounded-3xl border border-border-subtle">
                <div className="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[#71717a]">Cargando escáner...</span>
              </div>
            }>
              <BarcodeScanner
                onScanSuccess={handleScanSuccess}
                onClose={() => setIsScannerOpen(false)}
                title="Escanear Código"
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Scan Result Modal */}
      <Modal
        open={isScanResultOpen}
        onClose={() => setIsScanResultOpen(false)}
        title={lastScannedProduct ? "Producto Encontrado" : "Código Escaneado"}
        size="md"
      >
        {lastScannedProduct ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <Check size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">¡Coincidencia Encontrada!</p>
                <p className="text-xs text-[#71717a]">Este código corresponde a un producto registrado en el sistema.</p>
              </div>
            </div>

            <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-5 space-y-4">
              <div className="border-b border-[#27272a]/60 pb-3">
                <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Nombre del Producto</p>
                <p className="text-lg font-bold text-[#fafafa] mt-0.5">{lastScannedProduct.nombre}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Estado</p>
                  <span className={twMerge("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border mt-1.5 capitalize",
                    lastScannedProduct.estado === 'disponible' && 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
                    lastScannedProduct.estado === 'asignado' && 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
                    lastScannedProduct.estado === 'en_mantenimiento' && 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
                    lastScannedProduct.estado === 'baja' && 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20'
                  )}>
                    {lastScannedProduct.estado.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Categoría</p>
                  <p className="text-sm font-medium text-[#a1a1aa] mt-1">{lastScannedProduct.categoria?.nombre || '—'}</p>
                </div>

                <div>
                  <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Marca / Modelo</p>
                  <p className="text-sm font-medium text-[#a1a1aa] mt-1">
                    {[lastScannedProduct.marca, lastScannedProduct.modelo].filter(Boolean).join(' ') || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Número de Serie</p>
                  <p className="text-xs font-mono text-emerald-400 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                    {lastScannedProduct.numeroSerie || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Ubicación</p>
                  <p className="text-sm font-medium text-[#a1a1aa] mt-1">{lastScannedProduct.ubicacion || '—'}</p>
                </div>

                <div>
                  <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Precio (€)</p>
                  <p className="text-sm font-medium text-[#a1a1aa] mt-1">
                    {lastScannedProduct.precio !== null && lastScannedProduct.precio !== undefined ? `${lastScannedProduct.precio} €` : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
              <button
                onClick={() => setIsScanResultOpen(false)}
                className="inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium px-4 py-2.5 rounded-xl border border-[#27272a] transition-all cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setIsScanResultOpen(false)
                  setProductSearchQuery(lastScannedProduct.numeroSerie || lastScannedProduct.nombre)
                  setActiveTab('productos')
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Eye size={15} />
                Ver en Inventario
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Producto No Encontrado</p>
                <p className="text-xs text-[#71717a]">El código escaneado no coincide con ningún producto registrado.</p>
              </div>
            </div>

            <div className="bg-[#18181b]/55 border border-[#27272a] rounded-2xl p-5 space-y-2">
              <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Código Escaneado</p>
              <p className="text-lg font-mono font-bold text-[#fafafa] break-all bg-black/35 px-4 py-2.5 rounded-xl border border-[#27272a]">
                {lastScannedCode}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
              <button
                onClick={() => {
                  setIsScanResultOpen(false)
                  setProductSearchQuery(lastScannedCode || '')
                  setActiveTab('productos')
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium px-4 py-2.5 rounded-xl border border-[#27272a] transition-all cursor-pointer"
              >
                Buscar en Inventario
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScanResultOpen(false)}
                  className="inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium px-4 py-2.5 rounded-xl border border-[#27272a] transition-all cursor-pointer"
                >
                  Cerrar
                </button>
                {(role === 'profesor' || role === 'desarrollador') && (
                  <button
                    onClick={() => {
                      setIsScanResultOpen(false)
                      setInitialNewProductData({ numeroSerie: lastScannedCode })
                      setActiveTab('productos')
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                    Registrar Producto
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        open={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        title="Cerrar sesión"
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 text-red-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="font-bold text-sm text-[#fafafa]">¿Estás seguro?</p>
              <p className="text-xs text-[#71717a] mt-0.5">¿Realmente deseas cerrar tu sesión actual?</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
            <button
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium px-4 py-2.5 rounded-xl border border-[#27272a] transition-all cursor-pointer"
            >
              No
            </button>
            <button
              onClick={() => {
                setIsLogoutConfirmOpen(false)
                onLogout()
              }}
              className="inline-flex items-center justify-center gap-2 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Sí, salir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<{ nombre: string; email: string; rol: string; fotoPerfil?: string } | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const handleLoginSuccess = (newToken: string, newUser: { nombre: string; email: string; rol: string; fotoPerfil?: string }) => {
    setToken(newToken)
    setUser(newUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  if (!token || !user) {
    return (
      <ToastProvider>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <AppContent onLogout={handleLogout} user={user} />
    </ToastProvider>
  )
}
