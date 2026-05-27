import { useState } from 'react'
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

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  const { data: productos, loading: loadingProd } = useFetch(productosApi.getAll, [], [])
  const { data: categorias } = useFetch(categoriasApi.getAll, [], [])
  const { data: usuarios } = useFetch(usuariosApi.getAll, [], [])
  const { data: movimientos } = useFetch(movimientosApi.getAll, [], [])
  const { data: prestamos } = useFetch(prestamosApi.getAll, [], [])

  return (
    <div className="bg-gradient-mesh flex min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 overflow-y-auto max-w-[1600px]">
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
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
