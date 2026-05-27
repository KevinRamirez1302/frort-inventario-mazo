import { useState } from 'react'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import logoMazito from '../assets/mazito.png'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { addToast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      addToast('Por favor, introduce tu usuario y contraseña.', 'error')
      return
    }

    setIsLoading(true)

    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false)
      // Check credentials dynamically
      const savedPassword = localStorage.getItem('adminPassword') || 'admin'
      
      if (username.toLowerCase() === 'admin' && password === savedPassword) {
        addToast('Sesión iniciada correctamente.', 'success')
        onLoginSuccess()
      } else {
        addToast('Usuario o contraseña incorrectos.', 'error')
      }
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-mesh">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7c3aed]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3b82f6]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md animate-scale-in z-10">
        {/* Card wrapper with shadow/border */}
        <div className="glass-strong rounded-3xl p-8 lg:p-10 shadow-2xl relative">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 mb-4 flex items-center justify-center hover:scale-105 transition-transform duration-300">
              <img src={logoMazito} alt="Logo Mazito" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#fafafa] tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Inventario IT
            </h1>
            <p className="text-xs text-[#71717a] font-mono tracking-widest mt-1">
              INSTITUTO MAZO
            </p>
            <p className="text-sm text-[#a1a1aa] mt-3">
              Inicia sesión para acceder al panel de control
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block">
                Usuario
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#71717a] pointer-events-none">
                  <User size={18} />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="Introduce tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-bg-surface/50 border border-border-subtle rounded-xl pl-11 pr-4 py-3 text-sm text-[#fafafa] placeholder-[#71717a] transition-all duration-200 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#71717a] pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Introduce tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-surface/50 border border-border-subtle rounded-xl pl-11 pr-11 py-3 text-sm text-[#fafafa] placeholder-[#71717a] transition-all duration-200 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#71717a] hover:text-[#fafafa] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#7c3aed]/50 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#7c3aed]/20 cursor-pointer text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
