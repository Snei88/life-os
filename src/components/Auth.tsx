// src/components/Auth.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LogIn, Lock, Mail, User, RotateCw, ArrowLeft,
  CheckCircle2, Eye, EyeOff,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import iconLight from "../../assets/icono.png";
import iconDark from "../../assets/icono_white.png";

type AuthView = "login" | "register" | "forgot" | "reset-confirm";

const Auth: React.FC = () => {
  const { login } = useAuth();
  const { resolvedTheme } = useTheme();
  const [view, setView] = useState<AuthView>("login");
  const logoSrc = resolvedTheme === "light" ? iconLight : iconDark;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    resetToken: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Email y contraseña son requeridos");
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email || !formData.password) {
      setError("Todos los campos son requeridos");
      return;
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.register({ name: formData.name, email: formData.email, password: formData.password });
      await login(formData.email, formData.password);
    } catch (err: any) {
      console.error("Error registro:", err);
      setError(err.message || "Error al crear la cuenta");
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Ingresa tu email");
      return;
    }
    setLoading(true);
    try {
      const res = await api.forgotPassword(formData.email);
      setSuccess(res.message);
      if (res.resetToken) {
        setFormData((prev) => ({ ...prev, resetToken: res.resetToken }));
        setTimeout(() => setView("reset-confirm"), 1500);
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resetToken || !formData.password) {
      setError("Token y nueva contraseña requeridos");
      return;
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await api.resetPasswordConfirm(formData.resetToken, formData.password);
      setSuccess("Contraseña actualizada correctamente");
      setTimeout(() => {
        setView("login");
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "", resetToken: "" }));
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    setError("");
    setSuccess("");
    setFormData({ name: "", email: "", password: "", confirmPassword: "", resetToken: "" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <motion.div
            className="mb-6"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src={logoSrc} alt="Life OS" className="h-16 w-16 object-contain" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Life OS</h1>
          <p className="text-white/60 text-sm">
            {view === "login" && "Bienvenido de vuelta"}
            {view === "register" && "Crea tu cuenta"}
            {view === "forgot" && "Recupera tu acceso"}
            {view === "reset-confirm" && "Nueva contraseña"}
          </p>
        </div>

        {/* Error / Success */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {view === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  data-gramm="false"
                  data-gramm_editor="false"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                  autoFocus
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Contraseña"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white font-bold py-4 rounded-2xl transition-all duration-200 active:scale-95 mt-6"
              >
                <LogIn size={20} />
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <div className="flex flex-col gap-2 text-center mt-4">
                <button
                  type="button"
                  onClick={() => switchView("forgot")}
                  className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <p className="text-white/40 text-sm">
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => switchView("register")}
                    className="text-white hover:text-orange-400 font-bold transition-colors"
                  >
                    Regístrate
                  </button>
                </p>
              </div>
            </motion.form>
          )}

          {view === "register" && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                  autoFocus
                />
              </div>

              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="Confirmar contraseña"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white font-bold py-4 rounded-2xl transition-all duration-200 active:scale-95 mt-6"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>

              <p className="text-white/40 text-sm text-center mt-4">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-white hover:text-orange-400 font-bold transition-colors"
                >
                  Inicia sesión
                </button>
              </p>
            </motion.form>
          )}

          {view === "forgot" && (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleForgot}
              className="space-y-4"
            >
              <p className="text-white/60 text-sm text-center mb-4">
                Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
              </p>

              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="Email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white font-bold py-4 rounded-2xl transition-all duration-200 active:scale-95 mt-6"
              >
                <RotateCw size={20} className={loading ? "animate-spin" : ""} />
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </button>

              <button
                type="button"
                onClick={() => switchView("login")}
                className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-white text-sm font-medium py-2 transition-colors mt-4"
              >
                <ArrowLeft size={16} />
                Volver al login
              </button>
            </motion.form>
          )}

          {view === "reset-confirm" && (
            <motion.form
              key="reset-confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleResetConfirm}
              className="space-y-4"
            >
              <p className="text-white/60 text-sm text-center mb-4">
                Ingresa tu nueva contraseña.
              </p>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Nueva contraseña"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="Confirmar nueva contraseña"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 outline-none focus:border-orange-600 focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white font-bold py-4 rounded-2xl transition-all duration-200 active:scale-95 mt-6"
              >
                <CheckCircle2 size={20} />
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-xs text-white/20">
          Life OS v1.0 • Sistema de Gestión Personal
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
