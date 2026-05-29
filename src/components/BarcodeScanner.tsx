/**
 * BarcodeScanner — Componente de escáner universal de QR y códigos de barras.
 *
 * Características:
 *  - Vista de cámara en tiempo real con overlay de guía de escaneo.
 *  - Soporte de torch (flash) si el dispositivo lo permite.
 *  - Feedback visual de éxito con animación y copia al portapapeles.
 *  - Manejo de errores con mensajes descriptivos y opción de reintento.
 *  - Accesibilidad: roles ARIA y atributos descriptivos.
 */

import { Flashlight, FlashlightOff, QrCode, X, CheckCircle2, Copy, RefreshCw, CameraOff, Scan } from 'lucide-react'
import { useScanner } from '../hooks/useScanner'
import { useToast } from '../hooks/useToast'
import { useState } from 'react'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BarcodeScannerProps {
  /** Callback que recibe el texto decodificado cuando la lectura es exitosa */
  onScanSuccess: (text: string, format: string) => void
  /** Callback opcional al cerrar el componente */
  onClose?: () => void
  /** Título personalizado del escáner */
  title?: string
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function BarcodeScanner({
  onScanSuccess,
  onClose,
  title = 'Escanear Código',
}: BarcodeScannerProps) {
  const {
    status,
    result,
    errorMessage,
    isTorchOn,
    isTorchAvailable,
    videoRef,
    startScanning,
    stopScanning,
    toggleTorch,
    reset,
  } = useScanner()

  const { addToast } = useToast()
  const [copied, setCopied] = useState(false)

  // Cuando el resultado está disponible, notificar al padre
  const handleAcceptResult = () => {
    if (!result) return
    onScanSuccess(result.text, result.format)
    onClose?.()
  }

  // Copiar resultado al portapapeles
  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)
      addToast('Código copiado al portapapeles', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast('No se pudo copiar al portapapeles', 'error')
    }
  }

  // Reintentar escaneo desde el estado de error o éxito
  const handleRetry = () => {
    reset()
    setCopied(false)
    // Iniciamos en el siguiente tick para dar tiempo al DOM a actualizarse
    setTimeout(() => startScanning(), 100)
  }

  return (
    <div
      className="flex flex-col bg-bg-surface/95 backdrop-blur-2xl rounded-3xl border border-border-subtle overflow-hidden shadow-2xl w-full max-w-sm mx-auto"
      role="dialog"
      aria-label={title}
      aria-modal="true"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Cabecera                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/15 flex items-center justify-center">
            <QrCode size={16} className="text-[#7c3aed]" />
          </div>
          <div>
            <h2
              className="text-sm font-bold text-[#fafafa]"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              {title}
            </h2>
            <p className="text-[10px] text-[#71717a] font-mono">
              QR · Código de Barras
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={() => { stopScanning(); onClose() }}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] transition-all cursor-pointer"
            aria-label="Cerrar escáner"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Cuerpo principal                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative">

        {/* ---- ESTADO IDLE: Pantalla de inicio ---- */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-6 py-14 px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center">
              <Scan size={36} className="text-[#7c3aed]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-[#fafafa]">Listo para escanear</p>
              <p className="text-sm text-[#71717a]">
                Apunta la cámara hacia un código QR, de barras u otro código soportado.
              </p>
            </div>
            <button
              onClick={startScanning}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#7c3aed]/20 cursor-pointer text-sm"
            >
              <QrCode size={16} />
              Activar Cámara
            </button>
          </div>
        )}

        {/* ---- ESTADO REQUESTING: Solicitando permiso ---- */}
        {status === 'requesting' && (
          <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center">
            <div className="w-12 h-12 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#a1a1aa]">Solicitando acceso a la cámara...</p>
          </div>
        )}

        {/* ---- ESTADO SCANNING: Cámara activa ---- */}
        {(status === 'scanning' || status === 'requesting') && (
          <div className={status === 'requesting' ? 'hidden' : 'block'}>
            {/* Elemento de vídeo */}
            <div className="relative aspect-[4/3] bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                aria-label="Vista de la cámara para escaneo"
              />

              {/* Overlay de guía de escaneo — marco animado */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52">
                  {/* Esquinas del marco de guía */}
                  <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#7c3aed] rounded-tl-lg" />
                  <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#7c3aed] rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#7c3aed] rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#7c3aed] rounded-br-lg" />

                  {/* Línea de escaneo animada */}
                  <div
                    className="absolute left-1 right-1 h-0.5 bg-[#7c3aed]/70 rounded-full"
                    style={{ animation: 'scanLine 2s ease-in-out infinite' }}
                  />
                </div>
              </div>

              {/* Oscurecimiento de las zonas fuera del marco */}
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 55% 50% at 50% 50%, transparent 0%, rgba(0,0,0,0.45) 100%)`,
                }}
              />

              {/* Barra de controles de la cámara */}
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-4">
                {/* Botón de torch */}
                <button
                  onClick={toggleTorch}
                  disabled={!isTorchAvailable}
                  className="p-2.5 rounded-xl bg-black/50 backdrop-blur-sm text-white disabled:opacity-30 hover:bg-black/70 transition-all cursor-pointer"
                  aria-label={isTorchOn ? 'Apagar flash' : 'Encender flash'}
                  title={!isTorchAvailable ? 'Flash no disponible en este dispositivo' : undefined}
                >
                  {isTorchOn ? <FlashlightOff size={18} /> : <Flashlight size={18} />}
                </button>

                {/* Indicador de escaneo activo */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-[10px] text-white font-mono">Buscando...</span>
                </div>

                {/* Botón de detener */}
                <button
                  onClick={stopScanning}
                  className="p-2.5 rounded-xl bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all cursor-pointer"
                  aria-label="Detener escaneo"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---- ESTADO SUCCESS: Lectura exitosa ---- */}
        {status === 'success' && result && (
          <div className="flex flex-col gap-5 p-6 animate-fade-up">
            {/* Icono de éxito */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center animate-scale-in">
                <CheckCircle2 size={28} className="text-[#10b981]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#fafafa]">¡Código leído con éxito!</p>
                <p className="text-[10px] text-[#71717a] font-mono mt-0.5">
                  Formato: {result.format}
                </p>
              </div>
            </div>

            {/* Resultado del código */}
            <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-4 space-y-2">
              <p className="text-[10px] text-[#71717a] font-mono uppercase tracking-wider">Contenido</p>
              <p className="text-sm text-[#fafafa] break-all leading-relaxed font-medium">
                {result.text}
              </p>
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 bg-bg-elevated hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium py-2.5 rounded-xl border border-border-subtle transition-all active:scale-[0.98] cursor-pointer"
              >
                <Copy size={14} />
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 bg-bg-elevated hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-sm font-medium py-2.5 rounded-xl border border-border-subtle transition-all active:scale-[0.98] cursor-pointer"
              >
                <RefreshCw size={14} />
                Volver a escanear
              </button>
            </div>

            <button
              onClick={handleAcceptResult}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#7c3aed]/20 cursor-pointer text-sm"
            >
              Usar este código
            </button>
          </div>
        )}

        {/* ---- ESTADO ERROR: Error de permiso o de acceso ---- */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-5 py-12 px-6 text-center animate-fade-up">
            <div className="w-14 h-14 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center">
              <CameraOff size={24} className="text-[#ef4444]" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-[#fafafa]">No se pudo acceder a la cámara</p>
              <p className="text-xs text-[#71717a] leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] font-medium py-3 rounded-xl border border-[#ef4444]/20 transition-all active:scale-[0.98] cursor-pointer text-sm"
            >
              <RefreshCw size={14} />
              Reintentar
            </button>
          </div>
        )}
      </div>

      {/* Keyframe de la línea de escaneo — se puede mover a index.css si se reutiliza */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; opacity: 0.8; }
          50% { top: 85%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
