import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  Dumbbell,
  Flag,
  HeartPulse,
  LockKeyhole,
  Menu,
  Moon,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TimerReset,
  Wallet,
  X,
  Zap,
  TrendingUp,
  Brain,
  BarChart3,
  ArrowUpRight,
  Star,
  ChevronDown,
  Activity,
  Flame,
  Droplets,
  PiggyBank,
  Eye,
  Layers,
  Clock,
  Check
} from "lucide-react";
import iconLight from "../../assets/icono.png";
import { cn } from "../lib/utils";

type LandingPageProps = {
  onAccess: () => void;
};

const DOWNLOAD_URL = "https://www.mediafire.com/file/vrnayutsilmxu3t/LifeOS.apk/file";

// ─── DATA ─────────────────────────────────────────────────────────────

const modules = [
  { label: "Rutina", icon: CalendarDays, value: "Semana base", color: "text-blue-600", bg: "bg-gradient-to-br from-blue-500 to-blue-600", accent: "from-blue-500/20 to-transparent" },
  { label: "Salud", icon: HeartPulse, value: "Sueño 7.5h", color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", accent: "from-emerald-500/20 to-transparent" },
  { label: "Gym", icon: Dumbbell, value: "4 sesiones", color: "text-orange-600", bg: "bg-gradient-to-br from-orange-500 to-orange-600", accent: "from-orange-500/20 to-transparent" },
  { label: "Finanzas", icon: Wallet, value: "22% ahorro", color: "text-yellow-700", bg: "bg-gradient-to-br from-yellow-500 to-yellow-600", accent: "from-yellow-500/20 to-transparent" },
  { label: "Metas", icon: Flag, value: "3 activas", color: "text-rose-600", bg: "bg-gradient-to-br from-rose-500 to-rose-600", accent: "from-rose-500/20 to-transparent" },
];

const features = [
  {
    title: "Rutina inteligente",
    text: "Estructura semanal con bloques fijos para trabajo, estudio, entrenamiento y descanso. Tu semana deja de ser caos.",
    icon: CalendarDays,
    stat: "+40%",
    statLabel: "productividad",
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
  },
  {
    title: "Nutrición profesional",
    text: "Calcula IMC, metabolismo basal, TDEE, proteína diaria y seguimiento de agua. Todo desde el registro inicial.",
    icon: HeartPulse,
    stat: "100%",
    statLabel: "personalizado",
    gradient: "from-emerald-500 via-emerald-600 to-teal-600",
  },
  {
    title: "Finanzas consciente",
    text: "Analiza ingresos, gastos, deudas, fondo de emergencia y tasa de ahorro. Claridad financiera real.",
    icon: Wallet,
    stat: "22%",
    statLabel: "ahorro promedio",
    gradient: "from-amber-500 via-orange-500 to-orange-600",
  },
  {
    title: "Metas accionables",
    text: "Convierte objetivos grandes en pasos diarios con seguimiento visible, fechas límite y hábitos conectados.",
    icon: Target,
    stat: "3x",
    statLabel: "más probable",
    gradient: "from-rose-500 via-pink-500 to-red-600",
  },
];

const benefits = [
  { icon: Brain, text: "Menos decisiones sueltas cada mañana." },
  { icon: Eye, text: "Más claridad sobre qué mover hoy." },
  { icon: Layers, text: "Una sola vista para hábitos, salud, dinero y metas." },
  { icon: Zap, text: "Diagnósticos iniciales sin hojas de cálculo." },
];

const stats = [
  { value: "6", label: "módulos centrales", icon: Layers },
  { value: "5 min", label: "para configurar tu base", icon: Clock },
  { value: "1", label: "sistema para tu vida", icon: Star },
];

// ─── ANIMATED COMPONENTS ──────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState("0");
  
  useEffect(() => {
    if (!isInView) return;
    const num = parseInt(value.replace(/\D/g, ""));
    if (isNaN(num)) { setDisplayValue(value); return; }
    
    let start = 0;
    const duration = 2000;
    const increment = num / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= num) { setDisplayValue(value); clearInterval(timer); }
      else setDisplayValue(Math.floor(start).toString());
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);
  
  return <span ref={ref}>{displayValue}{suffix}</span>;
}

function FloatingElement({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      animate={{ y: [0, -20, 0], rotate: [0, 2, -2, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("bg-gradient-to-r from-[#ff6b35] via-orange-500 to-amber-500 bg-clip-text text-transparent", className)}>
      {children}
    </span>
  );
}

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="mb-8 flex items-center gap-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b35] to-orange-500 font-mono text-xs font-black text-white shadow-lg shadow-orange-500/30">
        {number}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-orange-300 via-stone-200 to-transparent" />
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">{label}</span>
    </motion.div>
  );
}

function PrimaryButton({ children, href, onClick, icon: Icon }: { children: React.ReactNode; href?: string; onClick?: () => void; icon?: React.ElementType }) {
  const className = cn(
    "group relative inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#ff6b35] via-orange-500 to-orange-600 px-8 py-4 text-sm font-black text-white shadow-[0_20px_60px_rgba(255,107,53,0.4)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(255,107,53,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff6b35]",
    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/30 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000"
  );
  
  if (href) {
    return (
      <a href={href} className={className}>
        {children}
        {Icon && <Icon size={18} className="transition-transform group-hover:translate-x-1" />}
        {!Icon && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {children}
      {Icon && <Icon size={18} className="transition-transform group-hover:translate-x-1" />}
      {!Icon && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
    </button>
  );
}

function SecondaryButton({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const className = "group inline-flex min-h-14 items-center justify-center gap-3 rounded-full border-2 border-stone-200 bg-white/90 px-8 py-4 text-sm font-black text-stone-900 shadow-[0_10px_40px_rgba(28,25,23,0.08)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-stone-300 hover:bg-white hover:shadow-[0_20px_60px_rgba(28,25,23,0.15)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900";
  
  if (href) return <a href={href} className={className}>{children}</a>;
  return <button onClick={onClick} className={className}>{children}</button>;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}

// ─── PRODUCT SCENE (MEJORADO ÉPICAMENTE) ───────────────────────────────

function ProductScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, filter: "blur(20px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1.2, delay: 0.3, type: "spring", stiffness: 40 }}
      className="relative mx-auto w-full max-w-6xl"
    >
      {/* Intense glow effects */}
      <div className="absolute -inset-16 rounded-[4rem] bg-[radial-gradient(circle_at_25%_20%,rgba(255,107,53,0.3),transparent_35%),radial-gradient(circle_at_75%_35%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.2),transparent_35%)] blur-3xl" />
      
      <div className="relative overflow-hidden rounded-[3rem] border border-white/80 bg-white/80 p-5 shadow-[0_60px_150px_rgba(68,47,31,0.25),0_2px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl">
        {/* Browser chrome */}
        <div className="mb-5 flex items-center gap-3 px-3">
          <div className="flex gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-red-400/90 shadow-sm" />
            <span className="h-3.5 w-3.5 rounded-full bg-yellow-400/90 shadow-sm" />
            <span className="h-3.5 w-3.5 rounded-full bg-green-400/90 shadow-sm" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-xl bg-stone-100/90 px-5 py-2 text-xs font-semibold text-stone-500 shadow-inner">
            <LockKeyhole size={11} />
            life-os.app/dashboard
          </div>
        </div>

        <div className="grid gap-5 rounded-[2.5rem] border border-stone-200/70 bg-gradient-to-br from-[#faf7f3] to-[#f5f0ea] p-5 lg:grid-cols-[0.7fr_1.3fr]">
          {/* Sidebar */}
          <div className="space-y-5 rounded-[2rem] bg-gradient-to-br from-[#1a1410] to-[#0f0a07] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={iconLight} alt="" className="h-12 w-auto rounded-2xl bg-white p-2 shadow-lg" />
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-lg" />
                  </span>
                </div>
                <div>
                  <p className="text-base font-black">Life OS</p>
                  <p className="text-xs text-white/40">Sistema personal</p>
                </div>
              </div>
            </div>

            {/* Progress ring */}
            <div className="relative rounded-3xl bg-white/[0.06] p-6 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/30">Sistema alineado</p>
                  <p className="mt-2 text-5xl font-black">82%</p>
                </div>
                <div className="relative h-20 w-20">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <motion.path 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke="url(#progressGradient)" 
                      strokeWidth="3"
                      strokeDasharray="82, 100"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: "82, 100" }}
                      transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff6b35" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/50">Tu rutina base está activa y sincronizada.</p>
            </div>

            {/* Mini stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sueño", value: "7.5h", icon: Moon, color: "text-indigo-300", bg: "bg-indigo-500/10" },
                { label: "Agua", value: "2.3L", icon: Droplets, color: "text-blue-300", bg: "bg-blue-500/10" },
                { label: "Ahorro", value: "22%", icon: PiggyBank, color: "text-emerald-300", bg: "bg-emerald-500/10" },
                { label: "Foco", value: "3 bloques", icon: Target, color: "text-orange-300", bg: "bg-orange-500/10" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="group cursor-pointer rounded-2xl bg-white/[0.06] p-4 transition-all hover:bg-white/[0.1] hover:shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.bg)}>
                      <item.icon size={13} className={item.color} />
                    </div>
                    <p className="text-[11px] font-semibold text-white/40">{item.label}</p>
                  </div>
                  <p className="mt-2 text-lg font-black">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="relative min-h-[600px] overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Semana base</p>
                <h3 className="mt-1 text-2xl font-black text-stone-950">Plan operativo personal</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full border-2 border-stone-200 bg-stone-50 px-5 py-2.5 text-xs font-bold text-stone-600 transition-all hover:border-stone-300 hover:bg-stone-100 hover:shadow-md">
                  Jun 2026
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b35] to-orange-500 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl">
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>

            {/* Calendar strip */}
            <div className="mt-8 grid grid-cols-5 gap-3">
              {["Lun", "Mar", "Mié", "Jue", "Vie"].map((day, index) => (
                <motion.div 
                  key={day} 
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.08, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 p-4 transition-all hover:shadow-xl",
                    index === 2 ? "border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100/50 shadow-lg" : "border-stone-100 bg-stone-50/50"
                  )}
                >
                  <p className={cn("text-center text-[11px] font-bold uppercase", index === 2 ? "text-[#ff6b35]" : "text-stone-400")}>
                    {day}
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200/80 shadow-sm" />
                    <div className={cn("h-16 rounded-xl", index === 2 ? "bg-gradient-to-br from-orange-100 to-orange-200/80 shadow-sm" : "bg-gradient-to-br from-emerald-100 to-emerald-200/80 shadow-sm")} />
                    <div className="h-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200/50 shadow-sm" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Modules grid */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {modules.map((module, index) => (
                <motion.div
                  key={module.label}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="group cursor-pointer rounded-2xl border-2 border-stone-100 bg-white p-5 shadow-[0_10px_40px_rgba(68,47,31,0.08)] transition-all hover:border-orange-200 hover:shadow-[0_20px_60px_rgba(255,107,53,0.15)]"
                >
                  <div className="flex items-center gap-4">
                    <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-all group-hover:scale-110 group-hover:rotate-6", module.bg)}>
                      <module.icon size={20} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-black text-stone-950">{module.label}</p>
                        <ArrowUpRight size={16} className="text-stone-300 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                      </div>
                      <p className="text-sm text-stone-500">{module.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Floating notification */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 1, -1, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-8 right-8 hidden max-w-[220px] rounded-2xl border-2 border-orange-200/80 bg-gradient-to-br from-[#fff8f3] to-orange-50/50 p-5 shadow-[0_30px_80px_rgba(255,107,53,0.25)] backdrop-blur-sm sm:block"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b35] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ff6b35]" />
                </span>
                <p className="text-[11px] font-bold uppercase text-stone-500">Próxima acción</p>
              </div>
              <p className="mt-2 text-base font-black text-stone-950">Entrenamiento</p>
              <p className="text-sm text-stone-600">6:00 PM • Gym Upper Body</p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────

export const LandingPage: React.FC<LandingPageProps> = ({ onAccess }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "#que-es", label: "Qué es" },
    { href: "#funciones", label: "Funciones" },
    { href: "#beneficios", label: "Beneficios" },
    { href: "#demo", label: "Demo" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffaf5] via-[#fef6f0] to-[#fdf2e9] text-stone-950 selection:bg-orange-200/70">
      {/* Progress bar */}
      <motion.div className="fixed left-0 right-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-[#ff6b35] via-orange-500 to-amber-500 shadow-lg shadow-orange-500/50" style={{ scaleX }} />

      {/* Header */}
      <motion.header 
        className={cn(
          "fixed left-4 right-4 top-4 z-50 transition-all duration-500 md:left-8 md:right-8",
          scrolled && "top-3"
        )}
      >
        <nav className={cn(
          "mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-6 py-4 shadow-xl backdrop-blur-2xl transition-all duration-500",
          scrolled 
            ? "border-stone-200/90 bg-white/95 shadow-[0_10px_50px_rgba(68,47,31,0.15)]" 
            : "border-white/80 bg-white/80"
        )} aria-label="Navegación principal">
          <a href="#" className="flex min-h-12 items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff6b35]">
            <img src={iconLight} alt="Life OS" className="h-10 w-auto" />
            <span className="text-lg font-black">Life OS</span>
          </a>
          
          <div className="hidden items-center gap-10 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="group relative text-sm font-bold text-stone-600 transition-colors hover:text-stone-950">
                {item.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-[#ff6b35] to-orange-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
          
          <div className="hidden items-center gap-3 md:flex">
            <SecondaryButton onClick={onAccess}>Acceder</SecondaryButton>
            <PrimaryButton href={DOWNLOAD_URL} icon={Download}>Descargar</PrimaryButton>
          </div>
          
          <button
            onClick={() => setMobileOpen(true)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border-2 border-stone-200 bg-white transition-all hover:border-stone-300 hover:bg-stone-50 hover:shadow-md md:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white/98 p-6 backdrop-blur-xl md:hidden" 
            role="dialog" 
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={iconLight} alt="" className="h-10 w-auto" />
                <span className="text-lg font-black">Life OS</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border-2 border-stone-200 transition-all hover:bg-stone-50 hover:shadow-md" aria-label="Cerrar menú">
                <X size={22} />
              </button>
            </div>
            <div className="mt-14 flex flex-col gap-3">
              {navItems.map((item, i) => (
                <motion.a 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setMobileOpen(false)} 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="border-b border-stone-100 py-6 text-4xl font-black transition-colors hover:text-[#ff6b35]"
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
            <div className="mt-12 grid gap-4">
              <PrimaryButton href={DOWNLOAD_URL} icon={Download}>Descargar App</PrimaryButton>
              <SecondaryButton onClick={onAccess}>Acceder</SecondaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* ─── HERO ─────────────────────────────────────────────── */}
        <section ref={heroRef} className="relative overflow-hidden px-4 pb-32 pt-40 sm:px-6 lg:pb-40 lg:pt-52">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,107,53,0.2),transparent_35%),radial-gradient(circle_at_82%_12%,rgba(59,130,246,0.15),transparent_35%),radial-gradient(circle_at_48%_90%,rgba(16,185,129,0.15),transparent_35%)]" />
            <FloatingElement delay={0} className="absolute left-[10%] top-[20%]">
              <div className="h-32 w-32 rounded-full bg-orange-200/40 blur-2xl" />
            </FloatingElement>
            <FloatingElement delay={2} className="absolute right-[15%] top-[30%]">
              <div className="h-48 w-48 rounded-full bg-blue-200/30 blur-3xl" />
            </FloatingElement>
            <FloatingElement delay={1} className="absolute bottom-[20%] left-[20%]">
              <div className="h-36 w-36 rounded-full bg-emerald-200/30 blur-2xl" />
            </FloatingElement>
            <FloatingElement delay={3} className="absolute right-[30%] top-[60%]">
              <div className="h-24 w-24 rounded-full bg-amber-200/30 blur-xl" />
            </FloatingElement>
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-5xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
                className="mx-auto mb-10 inline-flex items-center gap-3 rounded-full border-2 border-orange-200/80 bg-white/90 px-6 py-3 text-sm font-bold uppercase tracking-wider text-stone-700 shadow-xl backdrop-blur-xl"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b35] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ff6b35]" />
                </span>
                Tu vida, convertida en sistema
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1 }}
                className="text-balance text-6xl font-black leading-[0.95] text-stone-950 sm:text-7xl lg:text-8xl"
              >
                Organiza tu <GradientText>salud</GradientText>, <GradientText>hábitos</GradientText>, <GradientText>dinero</GradientText> y <GradientText>metas</GradientText> en un solo sistema.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.2 }}
                className="mx-auto mt-10 max-w-3xl text-pretty text-xl leading-9 text-stone-600 sm:text-2xl"
              >
                Life OS une rutina semanal, nutrición, entrenamiento, finanzas, mindset y objetivos para ayudarte a decidir mejor cada día, sin vivir saltando entre apps.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3 }}
                className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row"
              >
                <PrimaryButton href={DOWNLOAD_URL} icon={Download}>
                  Descargar App
                </PrimaryButton>
                <SecondaryButton onClick={onAccess}>
                  <LockKeyhole size={18} className="text-stone-500" />
                  Acceder a mi cuenta
                </SecondaryButton>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm font-bold text-stone-500"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Gratis para empezar
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Sin tarjeta
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  APK Android
                </span>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="mt-20"
            >
              <ProductScene />
            </motion.div>

            {/* Scroll indicator */}
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="mt-20 flex justify-center"
            >
              <ChevronDown size={28} className="text-stone-400" />
            </motion.div>
          </div>
        </section>

        {/* ─── WHAT IS ──────────────────────────────────────────── */}
        <section id="que-es" className="relative px-4 py-32 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <SectionLabel number="01" label="Qué es Life OS" />
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="text-balance text-5xl font-black text-stone-950 sm:text-6xl"
              >
                Una capa de orden para las áreas que más <GradientText>pesan</GradientText> en tu vida.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mt-8 text-xl leading-9 text-stone-600"
              >
                Life OS no es solo un tracker. Es un tablero operativo personal: primero entiende tus datos base, después crea estructura semanal y finalmente conecta tus decisiones diarias con progreso visible.
              </motion.p>
              
              <div className="mt-12 grid gap-4">
                {benefits.map((benefit, i) => (
                  <motion.div 
                    key={benefit.text} 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    whileHover={{ x: 8, scale: 1.02 }}
                    className="group flex items-center gap-5 rounded-2xl border-2 border-stone-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(68,47,31,0.06)] transition-all hover:border-emerald-200 hover:shadow-[0_12px_50px_rgba(16,185,129,0.15)]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                      <benefit.icon size={20} />
                    </span>
                    <span className="text-lg font-bold text-stone-800">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-[3rem] border-2 border-stone-200/80 bg-white p-6 shadow-[0_30px_100px_rgba(68,47,31,0.15)]">
              <div className="grid gap-4">
                {[
                  { step: "Datos base", desc: "Peso, sueño, ingresos, gastos, objetivos.", icon: Activity },
                  { step: "Diagnóstico", desc: "Calorías, agua, fondo, salud financiera.", icon: BarChart3 },
                  { step: "Rutina semanal", desc: "Trabajo, estudio, gym y tiempo libre.", icon: CalendarDays },
                  { step: "Ejecución diaria", desc: "Hábitos, comidas, sesiones y metas.", icon: Zap },
                  { step: "Progreso", desc: "Rachas, métricas y claridad semanal.", icon: TrendingUp },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 80 }}
                    whileHover={{ x: 8, scale: 1.02 }}
                    className="group flex items-center gap-5 rounded-2xl bg-gradient-to-br from-[#fbf7f2] to-[#f8f4ef] p-6 transition-all hover:from-orange-50 hover:to-orange-100/50 hover:shadow-lg"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-950 to-stone-800 font-mono text-sm font-black text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-black text-stone-950">{item.step}</p>
                        <item.icon size={16} className="text-stone-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="mt-1 text-base text-stone-600">{item.desc}</p>
                    </div>
                    <ChevronRight className="text-stone-300 transition-all group-hover:translate-x-2 group-hover:text-[#ff6b35]" size={20} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─────────────────────────────────────────── */}
        <section id="funciones" className="relative px-4 py-32 sm:px-6">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,107,53,0.08),transparent_60%)]" />
          
          <div className="relative mx-auto max-w-7xl">
            <SectionLabel number="02" label="Características principales" />
            
            <div className="mb-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl text-balance text-5xl font-black text-stone-950 sm:text-6xl"
              >
                Todo lo importante, <GradientText>conectado</GradientText> por una misma estructura.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="max-w-md text-xl leading-9 text-stone-600"
              >
                Cada módulo responde una pregunta concreta: qué hago hoy, por qué importa y cómo mejora mi sistema.
              </motion.p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  whileHover={{ y: -12, scale: 1.03 }}
                  className="group relative overflow-hidden rounded-[2.5rem] border-2 border-stone-200/80 bg-white p-8 shadow-[0_15px_50px_rgba(68,47,31,0.08)] transition-all hover:border-orange-200 hover:shadow-[0_25px_80px_rgba(255,107,53,0.18)]"
                >
                  {/* Hover gradient */}
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-5", feature.gradient)} />
                  
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between">
                      <span className={cn("flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-6", feature.gradient)}>
                        <feature.icon size={26} />
                      </span>
                      <span className="rounded-full bg-stone-100 px-4 py-1.5 text-xs font-bold text-stone-600">
                        {feature.statLabel}
                      </span>
                    </div>
                    
                    <div className="mt-8">
                      <p className="text-3xl font-black text-[#ff6b35]">{feature.stat}</p>
                      <h3 className="mt-3 text-2xl font-black text-stone-950">{feature.title}</h3>
                      <p className="mt-4 text-base leading-8 text-stone-600">{feature.text}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── BEFORE / AFTER ───────────────────────────────────── */}
        <section id="beneficios" className="px-4 py-32 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <SectionLabel number="03" label="Antes / Después" />
            
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Before */}
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="rounded-[3rem] border-2 border-stone-200/80 bg-white p-10 shadow-[0_25px_80px_rgba(68,47,31,0.1)]"
              >
                <div className="mb-10 flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                    <X size={22} className="text-stone-400" />
                  </span>
                  <p className="text-base font-black uppercase tracking-wider text-stone-500">Antes</p>
                </div>
                {["Notas sueltas en apps diferentes", "Apps separadas sin conexión", "Metas sin seguimiento real", "Finanzas sin diagnóstico"].map((item, i) => (
                  <motion.div 
                    key={item} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="mb-5 flex items-center gap-5 rounded-2xl bg-stone-50/80 p-6 text-stone-600"
                  >
                    <X size={20} className="shrink-0 text-stone-300" />
                    <span className="text-lg font-bold">{item}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* After */}
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="relative overflow-hidden rounded-[3rem] border-2 border-orange-200/80 bg-gradient-to-br from-[#fff6ef] to-orange-50/50 p-10 shadow-[0_30px_100px_rgba(255,107,53,0.2)]"
              >
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ff6b35]/10 blur-3xl" />
                
                <div className="relative mb-10 flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b35] to-orange-500 shadow-lg">
                    <CheckCircle2 size={22} className="text-white" />
                  </span>
                  <p className="text-base font-black uppercase tracking-wider text-[#ff6b35]">Después con Life OS</p>
                </div>
                
                {["Semana base visible y ajustable", "Módulos conectados en un flujo", "Objetivos accionables con fechas", "Salud financiera y física en contexto"].map((item, i) => (
                  <motion.div 
                    key={item} 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="mb-5 flex items-center gap-5 rounded-2xl bg-white/90 p-6 text-stone-900 shadow-lg"
                  >
                    <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
                    <span className="text-lg font-bold">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── DEMO ─────────────────────────────────────────────── */}
        <section id="demo" className="px-4 py-32 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <SectionLabel number="04" label="Demo interactiva" />
            
            <div className="grid gap-12 rounded-[3rem] border-2 border-stone-200/80 bg-white p-6 shadow-[0_30px_120px_rgba(68,47,31,0.15)] lg:grid-cols-[1fr_0.85fr] lg:p-12">
              <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1a1410] to-[#0f0a07] p-8 text-white shadow-2xl">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-red-400/90" />
                    <span className="h-3.5 w-3.5 rounded-full bg-yellow-400/90" />
                    <span className="h-3.5 w-3.5 rounded-full bg-green-400/90" />
                  </div>
                  <span className="text-sm text-white/30">life-os.app</span>
                </div>
                <ProductScene />
              </div>
              
              <div className="flex flex-col justify-center p-6 lg:p-8">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange-50 to-orange-100/50 px-5 py-2.5 text-sm font-bold text-[#ff6b35] shadow-md"
                >
                  <Play size={16} fill="currentColor" />
                  Mockup animado
                </motion.span>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="text-4xl font-black text-stone-950 sm:text-5xl"
                >
                  Mira cómo una semana deja de ser una lista y se vuelve un <GradientText>sistema</GradientText>.
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="mt-8 text-xl leading-9 text-stone-600"
                >
                  La demo visual muestra el flujo central: rutina base, métricas diarias y módulos que alimentan tu avance semana a semana.
                </motion.p>
                
                <div className="mt-10 grid gap-5">
                  {[
                    { icon: TimerReset, text: "Bloques fijos para trabajo, estudio y entrenamiento.", color: "bg-gradient-to-br from-blue-500 to-blue-600" },
                    { icon: Moon, text: "Diagnóstico de sueño y recuperación personalizado.", color: "bg-gradient-to-br from-indigo-500 to-indigo-600" },
                    { icon: ShieldCheck, text: "Finanzas y metas con prioridades claras y visibles.", color: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.text} 
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, duration: 0.6 }}
                      whileHover={{ x: 8, scale: 1.02 }}
                      className="group flex items-center gap-5 rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100/50 p-5 transition-all hover:shadow-lg"
                    >
                      <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6", item.color)}>
                        <item.icon size={22} />
                      </span>
                      <span className="text-lg font-bold text-stone-800">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
        <section className="px-4 py-32 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <SectionLabel number="05" label="Sistema" />
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="grid gap-5 rounded-[3rem] border-2 border-stone-200/80 bg-gradient-to-br from-[#1a1410] to-[#0f0a07] p-10 text-white shadow-[0_30px_100px_rgba(0,0,0,0.3)] sm:grid-cols-3"
            >
              {stats.map(({ value, label, icon: Icon }, i) => (
                <motion.div 
                  key={label} 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="group rounded-3xl bg-white/[0.08] p-8 text-center transition-all hover:bg-white/[0.12] hover:shadow-2xl"
                >
                  <Icon size={28} className="mx-auto mb-4 text-[#ff6b35]" />
                  <p className="text-4xl font-black"><AnimatedCounter value={value} /></p>
                  <p className="mt-2 text-base text-white/60">{label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── CTA ──────────────────────────────────────────────── */}
        <section id="download" className="px-4 pb-20 pt-32 sm:px-6">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-[#ff6b35] via-orange-500 to-amber-500 p-12 text-white shadow-[0_50px_150px_rgba(255,107,53,0.4)] sm:p-20 lg:p-24">
            <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="mb-6 text-base font-black uppercase tracking-wider text-white/80"
                >
                  Empieza hoy
                </motion.p>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="text-balance text-5xl font-black sm:text-6xl lg:text-7xl"
                >
                  Descarga la app o accede a tu cuenta existente.
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="mt-8 max-w-2xl text-xl leading-9 text-white/90"
                >
                  Life OS está diseñado para funcionar como tu centro personal: móvil para capturar, web para revisar y ajustar.
                </motion.p>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mt-5 text-base font-bold text-white/70"
                >
                  APK disponible para Android. Próximamente en Play Store y iOS.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="mt-12 flex flex-col gap-5 sm:flex-row"
                >
                  <a href={DOWNLOAD_URL} className="group inline-flex min-h-16 items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-10 py-5 text-base font-black text-stone-950 shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(0,0,0,0.3)]">
                    <Smartphone size={22} />
                    Descargar APK
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </a>
                  <button onClick={onAccess} className="inline-flex min-h-16 items-center justify-center gap-3 rounded-full border-2 border-white/40 px-10 py-5 text-base font-black text-white transition-all hover:-translate-y-1 hover:bg-white/10 hover:border-white/60 hover:shadow-xl">
                    Acceder
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 80, duration: 0.8 }}
                className="relative rounded-[2.5rem] bg-white/15 p-8 backdrop-blur-xl shadow-2xl"
              >
                <div className="rounded-[2rem] bg-white p-8 text-stone-950 shadow-2xl">
                  <div className="flex items-center gap-5">
                    <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-stone-950 to-stone-800 text-white shadow-xl">
                      <Smartphone size={30} />
                    </span>
                    <div>
                      <p className="text-2xl font-black">Life OS Mobile</p>
                      <p className="text-base text-stone-500">APK disponible para Android</p>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-5 gap-3">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "aspect-square rounded-xl",
                          [0, 2, 4, 6, 7, 10, 12, 13, 16, 18, 19, 20, 22, 24].includes(index) 
                            ? "bg-gradient-to-br from-stone-900 to-stone-700 shadow-md" 
                            : "bg-stone-100"
                        )}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-6 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100/50 p-5 shadow-md">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <p className="text-base font-bold text-stone-700">
                      Descarga directa del APK. Sin Play Store.
                    </p>
                  </div>
                </div>
                
                {/* Floating elements */}
                <FloatingElement delay={0} className="absolute -right-5 -top-5">
                  <div className="rounded-2xl bg-white p-4 shadow-2xl">
                    <Flame size={24} className="text-[#ff6b35]" />
                  </div>
                </FloatingElement>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 border-t-2 border-stone-200/80 pt-12 text-base text-stone-600 sm:flex-row">
          <div className="flex items-center gap-3">
            <img src={iconLight} alt="" className="h-6 w-auto opacity-60" />
            <p className="font-semibold">© 2026 Life OS. Sistema personal para vivir con más claridad.</p>
          </div>
          <div className="flex gap-8">
            <a href="#que-es" className="font-semibold transition-colors hover:text-stone-950">Producto</a>
            <a href={DOWNLOAD_URL} className="font-semibold transition-colors hover:text-stone-950">Descargar</a>
            <button onClick={onAccess} className="font-semibold transition-colors hover:text-stone-950">Acceder</button>
          </div>
        </div>
      </footer>
    </div>
  );
};