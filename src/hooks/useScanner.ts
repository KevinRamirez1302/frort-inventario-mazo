/**
 * useScanner — Hook personalizado para escaneo universal de QR y códigos de barras.
 *
 * Gestiona el ciclo de vida completo del escáner:
 *  - Solicitud y validación de permisos de cámara en tiempo real.
 *  - Decodificación de múltiples formatos con @zxing/browser.
 *  - Control del torch (flash) mediante la API de MediaStreamTrack.
 *  - Detención inmediata de la cámara tras una lectura exitosa.
 *  - Estado de error con mensaje descriptivo para el usuario.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat, NotFoundException, Result } from '@zxing/library'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ScannerStatus =
  | 'idle'         // Estado inicial, sin cámara activa
  | 'requesting'   // Solicitando permiso de cámara
  | 'scanning'     // Cámara activa, buscando código
  | 'success'      // Código leído exitosamente
  | 'error'        // Error irrecuperable (permiso denegado, etc.)

export interface ScanResult {
  text: string
  format: string
  timestamp: number
}

export interface UseScannerReturn {
  status: ScannerStatus
  result: ScanResult | null
  errorMessage: string | null
  isTorchOn: boolean
  isTorchAvailable: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  startScanning: () => void
  stopScanning: () => void
  toggleTorch: () => Promise<void>
  reset: () => void
}

// ---------------------------------------------------------------------------
// Formatos soportados — se puede ampliar o reducir según necesidad
// ---------------------------------------------------------------------------
const SUPPORTED_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.ITF,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.PDF_417,
  BarcodeFormat.AZTEC,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScanner(): UseScannerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const activeStreamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isTorchOn, setIsTorchOn] = useState(false)
  const [isTorchAvailable, setIsTorchAvailable] = useState(false)

  // ----- Limpieza total de la cámara -----
  const cleanUp = useCallback(() => {
    // Detener el proceso de decodificación de ZXing
    controlsRef.current?.stop()
    controlsRef.current = null

    // Detener todas las pistas del stream de la cámara para liberar el hardware
    activeStreamRef.current?.getTracks().forEach(track => track.stop())
    activeStreamRef.current = null

    // Apagar el torch si estaba encendido
    setIsTorchOn(false)
  }, [])

  // ----- Detectar si el dispositivo soporta torch -----
  const checkTorchSupport = useCallback((stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return

    // La API de ImageCapture no está disponible en todos los browsers
    // Usamos la API de constraints de la pista de vídeo como alternativa
    const capabilities = videoTrack.getCapabilities?.()
    if (capabilities && 'torch' in capabilities) {
      setIsTorchAvailable(true)
    }
  }, [])

  // ----- Iniciar escaneo -----
  const startScanning = useCallback(() => {
    // No comprobamos videoRef.current aquí porque al llamar a esta función
    // el elemento <video> puede no estar aún en el DOM (status='idle').
    // El stream se asignará al ref una vez React re-renderice con status='scanning'.
    setStatus('requesting')
    setResult(null)
    setErrorMessage(null)

    // Configurar los hints de decodificación
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS)
    // TRY_HARDER activa más variantes de decodificación a costa de algo de CPU
    hints.set(DecodeHintType.TRY_HARDER, true)

    const reader = new BrowserMultiFormatReader(hints)
    readerRef.current = reader

    // Solicitar la cámara trasera preferentemente
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    }

    // Obtener el stream de la cámara primero para verificar permisos
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(stream => {
        activeStreamRef.current = stream
        checkTorchSupport(stream)
        setStatus('scanning')

        // Asignar el stream al elemento de vídeo manualmente
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Iniciar decodificación continua usando el stream activo
        reader
          .decodeFromStream(stream, videoRef.current!, (scanResult: Result | undefined, error: Error | undefined, controls: unknown) => {
            // Guardar la referencia a los controles de ZXing para poder detenerlos
            if (!controlsRef.current) {
              controlsRef.current = controls
            }

            if (scanResult) {
              // ✅ Lectura exitosa — detener inmediatamente para evitar duplicados
              const resultData: ScanResult = {
                text: scanResult.getText(),
                format: scanResult.getBarcodeFormat().toString(),
                timestamp: Date.now(),
              }

              // Detener todo antes de actualizar el estado para garantizar que
              // no llegan más callbacks de decodificación
              cleanUp()
              setResult(resultData)
              setStatus('success')
              return
            }

            if (error && !(error instanceof NotFoundException)) {
              // NotFoundException es el error normal cuando no se detecta ningún código
              // Solo registrar errores reales (no de "código no encontrado aún")
              console.warn('[useScanner] Error de decodificación:', error)
            }
          })
          .catch((err: Error) => {
            console.error('[useScanner] Error al iniciar la decodificación:', err)
            cleanUp()
            setErrorMessage('No se pudo iniciar el escáner. Intenta de nuevo.')
            setStatus('error')
          })
      })
      .catch((err: Error) => {
        console.error('[useScanner] Permiso de cámara denegado o error:', err)
        cleanUp()

        // Mostrar mensajes de error descriptivos según el tipo de error
        if (err.name === 'NotAllowedError') {
          setErrorMessage('Permiso de cámara denegado. Habilita el acceso en la configuración de tu navegador.')
        } else if (err.name === 'NotFoundError') {
          setErrorMessage('No se encontró ninguna cámara en este dispositivo.')
        } else if (err.name === 'NotReadableError') {
          setErrorMessage('La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo.')
        } else {
          setErrorMessage('No se pudo acceder a la cámara. Por favor, inténtalo de nuevo.')
        }

        setStatus('error')
      })
  }, [checkTorchSupport, cleanUp])

  // ----- Detener escaneo manualmente -----
  const stopScanning = useCallback(() => {
    cleanUp()
    setStatus('idle')
  }, [cleanUp])

  // ----- Alternar torch (flash) -----
  const toggleTorch = useCallback(async () => {
    const videoTrack = activeStreamRef.current?.getVideoTracks()[0]
    if (!videoTrack) return

    try {
      const newTorchState = !isTorchOn
      await videoTrack.applyConstraints({
        // @ts-expect-error — La API de torch no está en los tipos estándar de TypeScript
        advanced: [{ torch: newTorchState }],
      })
      setIsTorchOn(newTorchState)
    } catch (err) {
      console.warn('[useScanner] No se pudo cambiar el estado del torch:', err)
    }
  }, [isTorchOn])

  // ----- Resetear al estado inicial -----
  const reset = useCallback(() => {
    cleanUp()
    setStatus('idle')
    setResult(null)
    setErrorMessage(null)
    setIsTorchOn(false)
    setIsTorchAvailable(false)
  }, [cleanUp])

  // ----- Limpieza al desmontar el componente -----
  useEffect(() => {
    return () => {
      cleanUp()
    }
  }, [cleanUp])

  return {
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
  }
}
