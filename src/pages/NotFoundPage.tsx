import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

interface NotFoundPageProps {
  onGoBack: () => void
}

export function NotFoundPage({ onGoBack }: NotFoundPageProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-up">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#7c3aed]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#3b82f6]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-md">
        {/* Animated Icon Container */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 animate-ping" style={{ animationDuration: '3s' }} />
          {/* Main icon container */}
          <div className="w-20 h-20 rounded-3xl bg-[#111114] border border-[#27272a] flex items-center justify-center shadow-xl">
            <FileQuestion size={40} className="text-[#7c3aed] animate-pulse" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-7xl lg:text-8xl font-black bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#3b82f6] bg-clip-text text-transparent select-none tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            404
          </h1>
          <h2 className="text-xl lg:text-2xl font-bold text-[#fafafa]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            Página no encontrada
          </h2>
          <p className="text-sm text-[#71717a] max-w-sm mx-auto leading-relaxed">
            La sección o recurso al que intentas acceder no existe, no está disponible o no tienes permisos para verlo.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#1e1e22] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium px-5 py-3 rounded-xl border border-[#27272a] transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft size={16} />
            Atrás
          </button>
          
          <button
            onClick={onGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-5 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#7c3aed]/20 cursor-pointer"
          >
            <Home size={16} />
            Volver al Panel
          </button>
        </div>
      </div>
    </div>
  )
}
