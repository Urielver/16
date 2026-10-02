import React, { useState } from 'react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedUser?: string;
  expectedPassword?: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedUser = 'uriel',
  expectedPassword = '94909766',
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const targetUser = expectedUser.trim().toLowerCase();
    const targetPass = expectedPassword.trim();

    // Verification according to user specification (uriel and 94909766)
    setTimeout(() => {
      if (
        (cleanUser === targetUser && cleanPass === targetPass) ||
        (cleanPass === targetPass && (cleanUser === targetUser || cleanUser === ''))
      ) {
        setIsSubmitting(false);
        setErrorMsg(null);
        setUsername('');
        setPassword('');
        onSuccess();
      } else {
        setIsSubmitting(false);
        setErrorMsg('Credenciales incorrectas. Verifica tu usuario y contraseña.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-card rounded-3xl p-6 text-center border border-[#7bd0ff]/30 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>

        {/* Lock Icon Emblem */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#00a6e0] flex items-center justify-center text-white shadow-[0_0_24px_rgba(37,99,235,0.5)] mb-3">
            <span className="material-symbols-outlined text-2xl">lock</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2563eb]/20 text-[#7bd0ff] text-[11px] font-bold uppercase tracking-wider border border-[#7bd0ff]/30 mb-1">
            Panel de Control
          </span>
          <h3 className="font-serif-gala text-xl font-bold text-white">
            Acceso Anfitrión / Admin
          </h3>
          <p className="text-xs text-[#8d90a0] mt-1 font-light leading-snug">
            Ingresa las credenciales autorizadas para gestionar el evento, moderar fotos y sincronizar Google Drive.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-base text-rose-400 shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#c3c6d7] block" htmlFor="admin-user">
              Usuario
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </span>
              <input
                id="admin-user"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. uriel"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0b0e15]/90 border border-white/15 text-white text-xs placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/60 transition-all font-sans-ui"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#c3c6d7] block" htmlFor="admin-pass">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#8d90a0]">
                <span className="material-symbols-outlined text-[18px]">key</span>
              </span>
              <input
                id="admin-pass"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#0b0e15]/90 border border-white/15 text-white text-xs placeholder-[#8d90a0] focus:outline-none focus:ring-2 focus:ring-[#7bd0ff]/60 transition-all font-sans-ui"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#8d90a0] hover:text-[#7bd0ff] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7bd0ff] text-[#0b0e15] font-bold text-xs shadow-lg hover:shadow-[#7bd0ff]/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">lock_open</span>
                <span>Ingresar al Panel de Control</span>
              </>
            )}
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-[#8d90a0] hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};
