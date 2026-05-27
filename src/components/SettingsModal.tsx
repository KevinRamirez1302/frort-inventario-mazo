import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { useToast } from '../hooks/useToast'
import { User, Mail, Lock, Eye, EyeOff, Camera, Trash2 } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  profile: { nombre: string; email: string; avatar: string }
  onProfileUpdate: (newProfile: { nombre: string; email: string; avatar: string }) => void
}

export function SettingsModal({ open, onClose, profile, onProfileUpdate }: SettingsModalProps) {
  const [nombre, setNombre] = useState(profile.nombre)
  const [email, setEmail] = useState(profile.email)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const { addToast } = useToast()

  // Reset inputs when opened
  useEffect(() => {
    if (open) {
      setNombre(profile.nombre)
      setEmail(profile.email)
      setAvatar(profile.avatar)
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [open, profile])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit for localStorage
        addToast('La imagen es demasiado grande. El límite es de 2MB.', 'error')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim() || !email.trim()) {
      addToast('El nombre y el correo electrónico son obligatorios.', 'error')
      return
    }

    if (newPassword) {
      if (newPassword.length < 4) {
        addToast('La nueva contraseña debe tener al menos 4 caracteres.', 'error')
        return
      }
      if (newPassword !== confirmPassword) {
        addToast('Las contraseñas no coinciden.', 'error')
        return
      }
    }

    setIsSaving(true)

    setTimeout(() => {
      setIsSaving(false)
      
      // Update profile
      onProfileUpdate({ nombre, email, avatar })
      localStorage.setItem('adminNombre', nombre)
      localStorage.setItem('adminEmail', email)
      localStorage.setItem('adminAvatar', avatar)
      
      // Update password if typed
      if (newPassword) {
        localStorage.setItem('adminPassword', newPassword)
        addToast('Perfil y contraseña actualizados correctamente.', 'success')
      } else {
        addToast('Perfil actualizado correctamente.', 'success')
      }
      
      onClose()
    }, 600)
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajustes de Perfil" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Avatar Uploader UI */}
        <div className="flex flex-col items-center justify-center gap-3 py-2">
          <div className="relative group w-20 h-20 rounded-full overflow-hidden border border-border-subtle bg-bg-surface flex items-center justify-center shadow-inner">
            {avatar ? (
              <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover animate-fade-in" />
            ) : (
              <span className="text-xl font-extrabold text-[#71717a] uppercase select-none">
                {nombre.split(' ').map(n => n[0]).slice(0, 2).join('') || 'AD'}
              </span>
            )}
            
            <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-medium cursor-pointer transition-opacity duration-200">
              <Camera size={18} className="mb-0.5" />
              <span>Cambiar</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          
          {avatar && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1.5 cursor-pointer font-medium hover:underline transition-colors"
            >
              <Trash2 size={12} />
              Quitar foto
            </button>
          )}
        </div>
        
        {/* Profile Details Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#fafafa] uppercase tracking-wider font-mono">Datos Personales</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#a1a1aa] block">Nombre</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#71717a] pointer-events-none">
                <User size={16} />
              </span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del Administrador"
                className="w-full bg-bg-surface/50 border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#fafafa] placeholder-[#71717a] transition-all duration-200 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#a1a1aa] block">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#71717a] pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@instituto.es"
                className="w-full bg-bg-surface/50 border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#fafafa] placeholder-[#71717a] transition-all duration-200 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                required
              />
            </div>
          </div>
        </div>

        <hr className="border-border-subtle" />

        {/* Change Password Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#fafafa] uppercase tracking-wider font-mono">Seguridad</h3>
            <p className="text-xs text-[#71717a] mt-0.5">Deja los campos en blanco si no deseas cambiar la contraseña actual.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#a1a1aa] block">Nueva Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#71717a] pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full bg-bg-surface/50 border border-border-subtle rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#fafafa] placeholder-[#71717a] transition-all duration-200 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71717a] hover:text-[#fafafa] transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#a1a1aa] block">Confirmar Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#71717a] pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-bg-surface/50 border border-border-subtle rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#fafafa] placeholder-[#71717a] transition-all duration-200 focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71717a] hover:text-[#fafafa] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] rounded-xl border border-border-subtle transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#7c3aed]/50 text-white font-medium px-5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 active:scale-[0.98] cursor-pointer text-sm"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
