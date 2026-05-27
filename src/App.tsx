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
import { Sun, Moon, LogOut, Settings, ScanLine } from 'lucide-react'
import { LoginPage } from './pages/LoginPage'
import { SettingsModal } from './components/SettingsModal'
import { useToast } from './hooks/useToast'

// Carga diferida (lazy) del escáner para no aumentar el bundle principal
// ZXing añade ~500KB — se descarga solo cuando el usuario abre el escáner
const BarcodeScanner = lazy(() =>
  import('./components/BarcodeScanner').then(m => ({ default: m.BarcodeScanner }))
)

interface AppContentProps {
  onLogout: () => void
}

function AppContent({ onLogout }: AppContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  // Profile data & Settings Modal state
  const [profile, setProfile] = useState(() => {
    const savedName = localStorage.getItem('adminNombre') || 'Admin'
    const savedEmail = localStorage.getItem('adminEmail') || 'admin@instituto.es'
    const savedAvatar = localStorage.getItem('adminAvatar') || ''
    return { nombre: savedName, email: savedEmail, avatar: savedAvatar }
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const { addToast } = useToast()

  const handleScanSuccess = (text: string, format: string) => {
    addToast(`✅ Código leído (${format}): ${text}`, 'success')
    setIsScannerOpen(false)
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

  const { data: productos, loading: loadingProd } = useFetch(productosApi.getAll, [], [])
  const { data: categorias } = useFetch(categoriasApi.getAll, [], [])
  const { data: usuarios } = useFetch(usuariosApi.getAll, [], [])
  const { data: movimientos } = useFetch(movimientosApi.getAll, [], [])
  const { data: prestamos } = useFetch(prestamosApi.getAll, [], [])

  return (
    <div className="bg-gradient-mesh flex min-h-screen relative">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profile}
      />

      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-20 pb-28 lg:pb-8 overflow-y-auto max-w-[1600px] relative">
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
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md text-text-secondary hover:text-text-primary hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center"
            title="Ajustes de perfil"
          >
            <Settings size={20} />
          </button>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-3 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md text-text-secondary hover:text-[#7c3aed] hover:border-[#7c3aed]/30 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center"
            title="Escanear código QR o de barras"
          >
            <ScanLine size={20} />
          </button>

          <button
            onClick={onLogout}
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
              />
            )}
            {activeTab === 'productos' && <ProductosPage />}
            {activeTab === 'categorias' && <CategoriasPage />}
            {activeTab === 'usuarios' && <UsuariosPage />}
            {activeTab === 'movimientos' && <MovimientosPage />}
            {activeTab === 'prestamos' && <PrestamosPage />}
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
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true'
  })

  const handleLoginSuccess = () => {
    localStorage.setItem('isAuthenticated', 'true')
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    setIsAuthenticated(false)
  }

  return (
    <ToastProvider>
      {isAuthenticated ? (
        <AppContent onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </ToastProvider>
  )
}
