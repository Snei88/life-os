import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from "motion/react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Dumbbell,
  Flag,
  HeartPulse,
  LockKeyhole,
  Menu,
  Moon,
  ShieldCheck,
  Smartphone,
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
  Activity,
  Droplets,
  PiggyBank,
  Eye,
  Layers,
  Clock,
  Check,
  ChevronRight,
} from "lucide-react";
import iconLight from "../../assets/icono.png";
import { cn } from "../lib/utils";

type LandingPageProps = {
  onAccess: () => void;
};

const DOWNLOAD_URL =
  "https://download1476.mediafire.com/tde5utof899geU7MuZYIeXNNlRFi4H8K6d9m4RVDHlCvtgHHhpitmUGda3lOI74N0bwvslofGqsI_0WpfEAfJ4lWQyAQvYM1PJ0AwGnfjSFGzen6FfZ5xjhSrWuLsL4YBln3VcBTLkGVkT3aI3eaYPA77wALhiWrp-FvYr2qW4c00g/vrnayutsilmxu3t/LifeOS.apk

// ─── DATA ──────────────────────────────────────────────────────────────────────

const modules = [
  {
    label: "Rutina",
    icon: CalendarDays,
    value: "Semana base",
    iconBg: "#1e3a5f",
    iconColor: "#60a5fa",
  },
  {
    label: "Salud",
    icon: HeartPulse,
    value: "Sueño 7.5h",
    iconBg: "#14532d",
    iconColor: "#4ade80",
  },
  {
    label: "Gym",
    icon: Dumbbell,
    value: "4 sesiones",
    iconBg: "#431407",
    iconColor: "#fb923c",
  },
  {
    label: "Finanzas",
    icon: Wallet,
    value: "22% ahorro",
    iconBg: "#422006",
    iconColor: "#fbbf24",
  },
  {
    label: "Metas",
    icon: Flag,
    value: "3 activas",
    iconBg: "#4c0519",
    iconColor: "#f43f5e",
  },
];

const features = [
  {
    title: "Rutina inteligente",
    text: "Estructura semanal con bloques fijos para trabajo, estudio, entrenamiento y descanso. Tu semana deja de ser caos.",
    icon: CalendarDays,
    stat: "+40%",
    statLabel: "productividad",
  },
  {
    title: "Nutrición profesional",
    text: "Calcula IMC, metabolismo basal, TDEE, proteína diaria y seguimiento de agua. Todo desde el registro inicial.",
    icon: HeartPulse,
    stat: "100%",
    statLabel: "personalizado",
  },
  {
    title: "Finanzas consciente",
    text: "Analiza ingresos, gastos, deudas, fondo de emergencia y tasa de ahorro. Claridad financiera real.",
    icon: Wallet,
    stat: "22%",
    statLabel: "ahorro promedio",
  },
  {
    title: "Metas accionables",
    text: "Convierte objetivos grandes en pasos diarios con seguimiento visible, fechas límite y hábitos conectados.",
    icon: Target,
    stat: "3x",
    statLabel: "más probable",
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

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const num = parseInt(value.replace(/\D/g, ""));
    if (isNaN(num)) {
      setDisplayValue(value);
      return;
    }
    let start = 0;
    const duration = 2000;
    const increment = num / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= num) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start).toString());
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{displayValue}</span>;
}

function GradientText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-[#ff6b35] via-orange-400 to-amber-400 bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}

function SectionLabel({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="mb-8 flex items-center gap-3"
    >
      <span className="h-px w-8 bg-[#ff6b35]/50" />
      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#ff6b35]">
        {number} — {label}
      </span>
    </motion.div>
  );
}

function PrimaryButton({
  children,
  href,
  onClick,
  large = false,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  large?: boolean;
}) {
  const cls = cn(
    "group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-[#ff6b35] font-bold text-white transition-all duration-300 sm:w-auto",
    "shadow-[0_0_0_1px_rgba(255,107,53,0.4),0_16px_40px_rgba(255,107,53,0.3)]",
    "hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,107,53,0.5),0_24px_60px_rgba(255,107,53,0.45)]",
    "before:absolute before:inset-0 before:translate-x-[-110%] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-600 hover:before:translate-x-[110%]",
    large ? "min-h-14 px-8 py-4 text-sm" : "min-h-12 px-7 py-3 text-sm"
  );
  if (href)
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  href,
  large = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  large?: boolean;
}) {
  const cls = cn(
    "group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 font-semibold text-white/75 backdrop-blur-sm transition-all duration-300 sm:w-auto",
    "hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white",
    large ? "min-h-14 px-8 py-4 text-sm" : "min-h-12 px-7 py-3 text-sm"
  );
  if (href) return <a href={href} className={cls}>{children}</a>;
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

// ─── DASHBOARD PREVIEW ─────────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, filter: "blur(16px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 40 }}
      className="relative mx-auto w-full max-w-5xl"
    >
      {/* Glow beneath card */}
      <div className="absolute -inset-1 -bottom-8 rounded-[2rem] bg-[#ff6b35]/10 blur-3xl" />

      {/* Browser chrome */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#1a1410] shadow-[0_60px_120px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
        {/* Topbar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-[#221c17] px-5 py-3.5">
          <div className="flex gap-1.5">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-lg bg-white/[0.05] px-4 py-1.5 text-[11px] text-white/25">
            <LockKeyhole size={9} />
            life-os.app/dashboard
          </div>
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-[200px_1fr]">
          {/* Sidebar */}
          <div className="border-r border-white/[0.06] bg-[#0d0a08] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="relative">
                <img
                  src={iconLight}
                  alt=""
                  className="h-9 w-auto rounded-xl bg-white/5 p-1.5"
                />
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
              </div>
              <div>
                <p className="text-[13px] font-black text-white">Life OS</p>
                <p className="text-[10px] text-white/30">Sistema personal</p>
              </div>
            </div>

            {/* Ring stat */}
            <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/30">
                Sistema alineado
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-black text-white">82%</p>
                  <p className="mt-1 text-[10px] text-white/30">Rutina activa</p>
                </div>
                <svg
                  width="52"
                  height="52"
                  viewBox="0 0 36 36"
                  className="-rotate-90"
                >
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="3.5"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ff6b35"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 100" }}
                    animate={{ strokeDasharray: "82 100" }}
                    transition={{ duration: 1.8, delay: 0.8, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Sueño", value: "7.5h", icon: Moon, color: "#818cf8" },
                { label: "Agua", value: "2.3L", icon: Droplets, color: "#38bdf8" },
                { label: "Ahorro", value: "22%", icon: PiggyBank, color: "#34d399" },
                { label: "Foco", value: "3 bl.", icon: Target, color: "#fb923c" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-2.5"
                >
                  <item.icon size={11} style={{ color: item.color }} className="mb-1" />
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-white/30">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[13px] font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="relative min-h-[360px] bg-[#f5f0eb] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a89588]">
                  Semana base
                </p>
                <p className="text-lg font-black text-[#1a1410]">
                  Plan operativo personal
                </p>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff6b35] text-white shadow-[0_4px_14px_rgba(255,107,53,0.35)]">
                <ArrowUpRight size={15} />
              </button>
            </div>

            {/* Week */}
            <div className="mb-4 grid grid-cols-5 gap-2">
              {[
                { d: "Lun", today: false, blocks: ["#dbeafe", "#d1fae5"] },
                { d: "Mar", today: false, blocks: ["#dbeafe", "#e5e7eb"] },
                { d: "Mié", today: true, blocks: ["#fed7aa", "#fecaca"] },
                { d: "Jue", today: false, blocks: ["#dbeafe", "#d1fae5"] },
                { d: "Vie", today: false, blocks: ["#dbeafe", "#e5e7eb"] },
              ].map((day) => (
                <div
                  key={day.d}
                  className={cn(
                    "rounded-xl border p-2.5",
                    day.today
                      ? "border-orange-300/60 bg-orange-50/60"
                      : "border-black/[0.06] bg-white"
                  )}
                >
                  <p
                    className={cn(
                      "mb-2 text-center text-[9px] font-bold uppercase",
                      day.today ? "text-[#ff6b35]" : "text-[#a89588]"
                    )}
                  >
                    {day.d}
                  </p>
                  <div
                    className="mb-1 h-8 rounded-lg"
                    style={{ background: day.blocks[0] }}
                  />
                  <div
                    className="h-11 rounded-lg"
                    style={{ background: day.blocks[1] }}
                  />
                </div>
              ))}
            </div>

            {/* Module cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {modules.slice(0, 4).map((mod) => (
                <div
                  key={mod.label}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: mod.iconBg }}
                  >
                    <mod.icon size={15} style={{ color: mod.iconColor }} />
                  </span>
                  <div>
                    <p className="text-[12px] font-black text-[#1a1410]">{mod.label}</p>
                    <p className="text-[10px] text-[#a89588]">{mod.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating notif */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-5 right-5 hidden min-w-[160px] rounded-2xl border border-orange-100 bg-white/95 p-3.5 shadow-[0_16px_40px_rgba(255,107,53,0.15)] backdrop-blur-sm sm:block"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b35]" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#a89588]">
                  Próxima acción
                </p>
              </div>
              <p className="text-[13px] font-black text-[#1a1410]">Entrenamiento</p>
              <p className="text-[10px] text-[#a89588]">6:00 PM · Gym Upper Body</p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

function MobileAppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.35, type: "spring", stiffness: 70 }}
      className="relative mx-auto w-full max-w-[330px] md:hidden"
    >
      <div className="absolute -inset-5 rounded-[2.5rem] bg-[#ff6b35]/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#f8f2ec] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <div className="rounded-[1.55rem] bg-[#120d0a] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={iconLight} alt="" className="h-7 w-auto rounded-lg bg-white/5 p-1" />
              <div>
                <p className="text-[11px] font-black text-white">Life OS</p>
                <p className="text-[9px] font-semibold text-white/35">Hoy</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[9px] font-black text-emerald-300">
              82%
            </span>
          </div>

          <div className="rounded-2xl bg-white p-4 text-stone-950">
            <p className="text-[10px] font-black uppercase text-stone-400">
              Siguiente bloque
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff6b35] text-white">
                <Dumbbell size={19} />
              </span>
              <div>
                <p className="text-sm font-black">Gym Upper Body</p>
                <p className="text-xs font-semibold text-stone-500">6:00 PM · 60 min</p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Sueño", value: "7.5h", icon: Moon, color: "text-indigo-300" },
              { label: "Agua", value: "2.3L", icon: Droplets, color: "text-sky-300" },
              { label: "Ahorro", value: "22%", icon: PiggyBank, color: "text-emerald-300" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/[0.06] p-3">
                <item.icon size={15} className={item.color} />
                <p className="mt-2 text-[9px] font-bold uppercase text-white/35">{item.label}</p>
                <p className="text-sm font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {modules.slice(0, 3).map((mod) => (
              <div key={mod.label} className="flex items-center justify-between rounded-2xl bg-white/[0.05] p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: mod.iconBg }}>
                    <mod.icon size={14} style={{ color: mod.iconColor }} />
                  </span>
                  <p className="text-xs font-black text-white">{mod.label}</p>
                </div>
                <p className="text-[10px] font-semibold text-white/35">{mod.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAccess }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const navItems = [
    { href: "#que-es", label: "Qué es" },
    { href: "#funciones", label: "Funciones" },
    { href: "#beneficios", label: "Beneficios" },
    { href: "#demo", label: "Demo" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0a08] text-white selection:bg-orange-500/30">
      {/* Progress bar */}
      <motion.div
        className="fixed left-0 right-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-[#ff6b35] to-amber-400"
        style={{ scaleX }}
      />

      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <motion.header
        className={cn(
          "fixed left-4 right-4 top-4 z-50 transition-all duration-500 md:left-6 md:right-6"
        )}
      >
        <nav
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between rounded-[1.25rem] border px-3 py-2.5 transition-all duration-500 md:rounded-2xl md:px-5 md:py-3",
            scrolled
              ? "border-white/10 bg-[#0d0a08]/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
              : "border-white/10 bg-[#0d0a08]/88 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl md:border-white/[0.06] md:bg-white/[0.04] md:shadow-none"
          )}
        >
          <a href="#" className="flex items-center gap-3">
            <img src={iconLight} alt="Life OS" className="h-8 w-auto" />
            <span className="text-[15px] font-black">Life OS</span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative text-[13px] font-semibold text-white/45 transition-colors hover:text-white"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-[#ff6b35] transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2.5 md:flex">
            <GhostButton onClick={onAccess}>Acceder</GhostButton>
            <PrimaryButton href={DOWNLOAD_URL}>
              <Download size={15} />
              Descargar
            </PrimaryButton>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <a
              href={DOWNLOAD_URL}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#ff6b35] px-3 text-[11px] font-black text-white shadow-[0_10px_26px_rgba(255,107,53,0.28)]"
            >
              <Download size={14} />
              APK
            </a>
            <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
            aria-label="Abrir menú"
          >
            <Menu size={19} />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#0d0a08]/98 p-6 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={iconLight} alt="" className="h-8 w-auto" />
                <span className="font-black">Life OS</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
                aria-label="Cerrar menú"
              >
                <X size={19} />
              </button>
            </div>
            <div className="mt-14 flex flex-col gap-1">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="border-b border-white/[0.06] py-5 text-3xl font-black text-white/80 transition-colors hover:text-[#ff6b35]"
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
            <div className="mt-10 grid gap-3">
              <PrimaryButton href={DOWNLOAD_URL} large>
                <Download size={17} />
                Descargar App
              </PrimaryButton>
              <GhostButton onClick={onAccess} large>
                <LockKeyhole size={15} />
                Acceder
              </GhostButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* ─── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 md:pb-24 md:pt-36 lg:pb-28 lg:pt-48">
          {/* Background layers */}
          <div className="absolute inset-0">
            {/* Grid */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
                maskImage:
                  "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
              }}
            />
            {/* Top glow */}
            <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#ff6b35]/[0.15] blur-[120px]" />
            {/* Side accents */}
            <div className="absolute bottom-1/4 left-[5%] h-[300px] w-[300px] rounded-full bg-blue-600/[0.08] blur-[100px]" />
            <div className="absolute bottom-1/3 right-[8%] h-[250px] w-[250px] rounded-full bg-emerald-500/[0.07] blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-7xl text-left md:text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#ff6b35]/25 bg-[#ff6b35]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#ff8c5a] md:mb-9 md:px-5 md:text-[11px]"
            >
              <span className="relative flex h-[7px] w-[7px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b35] opacity-75" />
                <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#ff6b35]" />
              </span>
              Tu vida, convertida en sistema
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 60 }}
              className="max-w-[12ch] text-balance text-[44px] font-black leading-[0.92] text-white sm:text-[56px] md:mx-auto md:max-w-5xl md:text-[clamp(44px,8vw,92px)]"
            >
              Organiza tu{" "}
              <GradientText>salud</GradientText>,{" "}
              <span className="relative inline-block">
                <GradientText>hábitos</GradientText>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                  className="absolute -bottom-1 left-0 right-0 h-[3px] origin-left rounded-full bg-gradient-to-r from-[#ff6b35] to-amber-400"
                />
              </span>
              ,{" "}
              <GradientText>dinero</GradientText> y{" "}
              <GradientText>metas</GradientText>{" "}
              en un solo sistema.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 max-w-[34rem] text-pretty text-base leading-7 text-white/52 sm:text-lg md:mx-auto md:mt-8 md:max-w-2xl md:text-xl md:leading-8 md:text-white/45"
            >
              Life OS une rutina semanal, nutrición, entrenamiento, finanzas, mindset y
              objetivos para ayudarte a decidir mejor cada día, sin vivir saltando entre apps.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row md:mt-10 md:items-center"
            >
              <PrimaryButton href={DOWNLOAD_URL} large>
                <Download size={17} />
                Descargar App
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </PrimaryButton>
              <GhostButton onClick={onAccess} large>
                <LockKeyhole size={15} className="opacity-50" />
                Acceder a mi cuenta
              </GhostButton>
            </motion.div>

            {/* Trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mt-6 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-white/35 md:mt-7 md:justify-center md:gap-6 md:text-white/30"
            >
              {["Gratis para empezar", "Sin tarjeta", "APK Android"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500/80" />
                  {t}
                </span>
              ))}
            </motion.div>

            {/* Dashboard */}
            <div className="mt-10 md:mt-20">
              <MobileAppPreview />
              <div className="hidden md:block">
                <DashboardPreview />
              </div>
            </div>

            {/* Scroll hint */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="mt-10 hidden flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20 md:flex lg:mt-16"
            >
              <ChevronDown size={20} />
              Explorar
            </motion.div>
          </div>
        </section>

        {/* ─── WHAT IS ───────────────────────────────────────────────────── */}
        <section id="que-es" className="relative px-4 py-16 sm:px-6 md:py-24">
          {/* Divider line */}
          <div className="mx-auto mb-14 max-w-7xl md:mb-24">
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-8 md:gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <SectionLabel number="01" label="Qué es Life OS" />
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-balance text-3xl font-black leading-[1.05] text-white sm:text-4xl md:text-5xl"
              >
                Una capa de orden para las áreas que más{" "}
                <GradientText>pesan</GradientText> en tu vida.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mt-5 text-base leading-7 text-white/50 md:mt-6 md:text-lg md:leading-8 md:text-white/45"
              >
                Life OS no es solo un tracker. Es un tablero operativo personal: primero
                entiende tus datos base, después crea estructura semanal y finalmente
                conecta tus decisiones diarias con progreso visible.
              </motion.p>

              <div className="mt-8 flex snap-x gap-3 overflow-x-auto pb-2 md:mt-10 md:grid md:overflow-visible md:pb-0">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="group flex min-w-[82vw] snap-start items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all hover:border-[#ff6b35]/20 hover:bg-white/[0.05] md:min-w-0"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-transform group-hover:scale-110">
                      <benefit.icon size={18} />
                    </span>
                    <span className="font-semibold text-white/70">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.03] p-3 md:rounded-[2rem] md:p-5">
              {[
                { step: "Datos base", desc: "Peso, sueño, ingresos, gastos, objetivos.", icon: Activity },
                { step: "Diagnóstico", desc: "Calorías, agua, fondo, salud financiera.", icon: BarChart3 },
                { step: "Rutina semanal", desc: "Trabajo, estudio, gym y tiempo libre.", icon: CalendarDays },
                { step: "Ejecución diaria", desc: "Hábitos, comidas, sesiones y metas.", icon: Zap },
                { step: "Progreso", desc: "Rachas, métricas y claridad semanal.", icon: TrendingUp },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a1410] font-mono text-xs font-black text-white ring-1 ring-white/10 transition-transform group-hover:scale-110 group-hover:ring-[#ff6b35]/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white">{item.step}</p>
                      <item.icon
                        size={13}
                        className="text-white/20 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                    <p className="mt-0.5 text-sm text-white/40">{item.desc}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-white/20 transition-all group-hover:translate-x-1 group-hover:text-[#ff6b35]"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ──────────────────────────────────────────────────── */}
        <section id="funciones" className="relative px-4 py-16 sm:px-6 md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,107,53,0.05),transparent)]" />

          <div className="relative mx-auto max-w-7xl">
            <SectionLabel number="02" label="Características principales" />

            <div className="mb-8 flex flex-col justify-between gap-5 md:mb-14 lg:flex-row lg:items-end">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-3xl text-balance text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl"
              >
                Todo lo importante,{" "}
                <span className="text-white/30">conectado</span>{" "}
                por una misma estructura.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="max-w-sm text-sm leading-7 text-white/48 md:text-base md:text-white/40"
              >
                Cada módulo responde una pregunta concreta: qué hago hoy, por qué importa y
                cómo mejora mi sistema.
              </motion.p>
            </div>

            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="group relative min-w-[82vw] snap-start overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-white/[0.03] p-6 transition-all hover:border-[#ff6b35]/20 hover:bg-white/[0.05] md:min-w-0 md:p-7"
                >
                  {/* Top shimmer line */}
                  <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6b35]/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[#ff6b35]/20 bg-[#ff6b35]/10 text-[#ff6b35] transition-transform duration-300 group-hover:scale-110">
                    <feature.icon size={20} />
                  </div>

                  <p className="text-[38px] font-black leading-none text-[#ff6b35]">
                    {feature.stat}
                  </p>
                  <p className="mt-1 mb-4 text-[10px] font-bold uppercase tracking-widest text-white/25">
                    {feature.statLabel}
                  </p>
                  <h3 className="mb-3 text-lg font-black text-white">{feature.title}</h3>
                  <p className="text-sm leading-7 text-white/40">{feature.text}</p>
                </motion.article>
              ))}
            </div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-4 grid grid-cols-1 overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-white/[0.02] sm:grid-cols-3 md:mt-6"
            >
              {stats.map(({ value, label, icon: Icon }, i) => (
                <div
                  key={label}
                  className={cn(
                    "flex flex-row items-center justify-between gap-3 p-5 text-left sm:flex-col sm:justify-center sm:p-8 sm:text-center",
                    i < stats.length - 1 && "border-b border-white/[0.06] sm:border-b-0 sm:border-r"
                  )}
                >
                  <Icon size={20} className="text-[#ff6b35]/60" />
                  <p className="text-3xl font-black text-white">
                    <AnimatedCounter value={value} />
                  </p>
                  <p className="text-xs font-semibold text-white/30">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── BEFORE / AFTER ─────────────────────────────────────────────── */}
        <section id="beneficios" className="px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionLabel number="03" label="Antes / Después" />

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 text-3xl font-black leading-tight text-white sm:text-4xl md:mb-12 md:text-5xl"
            >
              De <span className="text-white/25">caos</span> a sistema.
            </motion.h2>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Before */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] p-5 md:rounded-[2rem] md:p-8"
              >
                <div className="mb-7 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06]">
                    <X size={16} className="text-white/30" />
                  </span>
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/25">
                    Antes
                  </p>
                </div>
                {[
                  "Notas sueltas en apps diferentes",
                  "Apps separadas sin conexión",
                  "Metas sin seguimiento real",
                  "Finanzas sin diagnóstico",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="mb-3 flex items-center gap-3.5 rounded-xl bg-white/[0.03] px-4 py-3.5"
                  >
                    <X size={15} className="shrink-0 text-white/20" />
                    <span className="text-sm font-semibold text-white/40">{item}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* After */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-[1.5rem] border border-[#ff6b35]/20 bg-[#ff6b35]/[0.06] p-5 md:rounded-[2rem] md:p-8"
              >
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ff6b35]/10 blur-3xl" />
                <div className="relative mb-7 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6b35]/15">
                    <CheckCircle2 size={16} className="text-[#ff6b35]" />
                  </span>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#ff8c5a]">
                    Después con Life OS
                  </p>
                </div>
                {[
                  "Semana base visible y ajustable",
                  "Módulos conectados en un flujo",
                  "Objetivos accionables con fechas",
                  "Salud financiera y física en contexto",
                ].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="relative mb-3 flex items-center gap-3.5 rounded-xl bg-white/[0.06] px-4 py-3.5"
                  >
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                    <span className="text-sm font-bold text-white/80">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── DEMO ───────────────────────────────────────────────────────── */}
        <section id="demo" className="px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionLabel number="04" label="Demo interactiva" />

            <div className="grid gap-8 overflow-hidden rounded-[1.5rem] border border-white/[0.07] bg-white/[0.02] p-4 md:rounded-[2rem] md:p-5 lg:grid-cols-[1fr_0.85fr] lg:gap-10 lg:p-10">
              <div className="overflow-hidden rounded-[1.25rem] bg-[#0a0705] p-4 md:rounded-[1.5rem] md:p-5">
                <MobileAppPreview />
                <div className="hidden md:block">
                  <DashboardPreview />
                </div>
              </div>

              <div className="flex flex-col justify-center p-2 lg:p-4">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#ff6b35]/25 bg-[#ff6b35]/10 px-4 py-2 text-[11px] font-bold text-[#ff8c5a]"
                >
                  <span className="relative flex h-[7px] w-[7px]">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b35] opacity-75" />
                    <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#ff6b35]" />
                  </span>
                  Mockup animado
                </motion.span>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl"
                >
                  Una semana que deja de ser una lista y se vuelve un{" "}
                  <GradientText>sistema</GradientText>.
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mt-4 text-sm leading-7 text-white/48 md:mt-5 md:text-base md:leading-8 md:text-white/40"
                >
                  La demo visual muestra el flujo central: rutina base, métricas diarias y
                  módulos que alimentan tu avance semana a semana.
                </motion.p>

                <div className="mt-8 grid gap-3">
                  {[
                    { icon: TimerReset, text: "Bloques fijos para trabajo, estudio y entrenamiento.", color: "bg-blue-500/10 text-blue-400" },
                    { icon: Moon, text: "Diagnóstico de sueño y recuperación personalizado.", color: "bg-indigo-500/10 text-indigo-400" },
                    { icon: ShieldCheck, text: "Finanzas y metas con prioridades claras y visibles.", color: "bg-emerald-500/10 text-emerald-400" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.12 }}
                      className="group flex items-center gap-4 rounded-xl bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.06]"
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                          item.color
                        )}
                      >
                        <item.icon size={17} />
                      </span>
                      <span className="text-sm font-semibold text-white/60">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA ────────────────────────────────────────────────────────── */}
        <section className="px-4 pb-10 pt-4 sm:px-6 md:pb-16 md:pt-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#ff6b35] via-orange-500 to-amber-500 p-6 sm:p-10 md:rounded-[2.5rem] md:p-16 lg:p-20">
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {/* Radial glow */}
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/[0.12] blur-3xl" />

            <div className="relative grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mb-4 text-[11px] font-black uppercase tracking-widest text-white/60"
                >
                  Empieza hoy
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-balance text-4xl font-black leading-[0.95] text-white sm:text-5xl md:text-6xl lg:text-7xl"
                >
                  Descarga.<br />
                  Configura.<br />
                  Avanza.
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mt-5 max-w-md text-base leading-7 text-white/75 md:mt-6 md:text-lg md:leading-8 md:text-white/70"
                >
                  Life OS está diseñado para funcionar como tu centro personal: móvil para
                  capturar, web para revisar y ajustar.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="mt-3 text-sm font-semibold text-white/50"
                >
                  APK disponible para Android. Próximamente en Play Store y iOS.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10"
                >
                  <a
                    href={DOWNLOAD_URL}
                    className="group inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-black text-[#c94c1e] shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                  >
                    <Smartphone size={20} />
                    Descargar APK
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </a>
                  <button
                    onClick={onAccess}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-white/30 px-8 py-4 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
                  >
                    Acceder
                    <ArrowRight size={16} />
                  </button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: 3 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 80 }}
                className="relative rounded-[2rem] bg-white/10 p-5 backdrop-blur-xl"
              >
                <div className="rounded-[1.5rem] bg-white p-7 text-stone-950 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950 text-white shadow-lg">
                      <Smartphone size={26} />
                    </span>
                    <div>
                      <p className="text-lg font-black">Life OS Mobile</p>
                      <p className="text-sm text-stone-500">APK disponible para Android</p>
                    </div>
                  </div>

                  {/* QR pattern */}
                  <div className="mt-6 grid grid-cols-5 gap-2">
                    {Array.from({ length: 25 }).map((_, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.015 }}
                        className={cn(
                          "aspect-square rounded-lg",
                          [0, 2, 4, 6, 7, 10, 12, 13, 16, 18, 19, 20, 22, 24].includes(
                            index
                          )
                            ? "bg-stone-900"
                            : "bg-stone-100"
                        )}
                      />
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-stone-50 p-4">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    <p className="text-sm font-semibold text-stone-600">
                      Descarga directa del APK. Sin Play Store.
                    </p>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-4 -top-4 rounded-xl bg-white p-3 shadow-xl"
                >
                  <Zap size={20} className="text-[#ff6b35]" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-3 left-3 right-3 z-50 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#120d0a]/92 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:hidden">
        <a
          href={DOWNLOAD_URL}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff6b35] px-4 text-sm font-black text-white"
        >
          <Download size={16} />
          Descargar APK
        </a>
        <button
          onClick={onAccess}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-black text-white/75"
        >
          Acceder
        </button>
      </div>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="px-4 pb-28 pt-10 sm:px-6 md:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 border-t border-white/[0.06] pt-10 text-sm text-white/25 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img src={iconLight} alt="" className="h-5 w-auto opacity-30" />
            <p>© 2026 Life OS. Sistema personal para vivir con más claridad.</p>
          </div>
          <div className="flex gap-6">
            <a href="#que-es" className="transition-colors hover:text-white/70">
              Producto
            </a>
            <a href={DOWNLOAD_URL} className="transition-colors hover:text-white/70">
              Descargar
            </a>
            <button
              onClick={onAccess}
              className="transition-colors hover:text-white/70"
            >
              Acceder
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
