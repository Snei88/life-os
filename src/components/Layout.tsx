import React from "react";
import { motion } from "motion/react";
import icono from "@/assets/icono.png";
import iconoWhite from "@/assets/icono_white.png";
import {
  LayoutDashboard,
  CheckCircle2,
  Utensils,
  Dumbbell,
  Wallet,
  Calendar,
  Target,
  Brain,
  LogOut,
  Menu,
  X,
  Sparkles,
  Settings
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  forceSidebarOpen?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, forceSidebarOpen = false }) => {
  const { profile, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const isLight = resolvedTheme === "light";
  const sidebarVisible = isSidebarOpen || forceSidebarOpen;

  React.useEffect(() => {
    if (forceSidebarOpen) setIsSidebarOpen(true);
  }, [forceSidebarOpen]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ai-recommendations", label: "IA", icon: Sparkles },
    { id: "habits", label: "Hábitos", icon: CheckCircle2 },
    { id: "nutrition", label: "Nutrición", icon: Utensils },
    { id: "gym", label: "Gym", icon: Dumbbell },
    { id: "finance", label: "Finanzas", icon: Wallet },
    { id: "routine", label: "Rutina", icon: Calendar },
    { id: "goals", label: "Metas", icon: Target },
    { id: "mindset", label: "Mindset", icon: Brain },
  ];

  return (
    // h-screen + overflow-hidden en el wrapper → solo el main hace scroll
    <div className={cn("h-screen overflow-hidden flex flex-col font-sans selection:bg-orange-500/30", isLight ? "bg-gray-50 text-gray-900" : "bg-[#0a0a0a] text-white")}>

      {/* Mobile Header */}
      <header className={cn(
        "lg:hidden flex-none flex items-center justify-between p-4 border-b backdrop-blur-md z-50",
        isLight ? "border-black/10 bg-gray-50/80 text-gray-900" : "border-white/10 bg-[#0a0a0a]/80"
      )}>
        <div className="flex items-center gap-2">
          <img src={isLight ? icono : iconoWhite} alt="Life OS" className="h-8 w-auto object-contain" />
          <span className="font-bold text-xl tracking-tight">
            <span className="text-orange-500">Life</span>
            <span className={isLight ? "text-gray-900" : "text-white"}> OS</span>
          </span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Body = sidebar + main, ambos ocupan el alto restante */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — fijo en altura, no scrollea con el contenido */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r transform transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0 lg:flex-none lg:h-full",
          isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10",
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full p-6">

            {/* Logo */}
            <div className="hidden lg:flex items-center gap-3 mb-10">
              <img src={isLight ? icono : iconoWhite} alt="Life OS" className="h-10 w-auto object-contain" />
              <span className="font-bold text-2xl tracking-tight">
                <span className="text-orange-500">Life</span>
                <span className={isLight ? "text-gray-900" : "text-white"}> OS</span>
              </span>
            </div>

            {/* Nav — scrollea si hay muchos items */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  data-tour-id={`tour-${item.id}`}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    activeTab === item.id
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon size={20} className={cn(
                    "transition-transform duration-200",
                    activeTab === item.id ? "scale-110" : "group-hover:scale-110"
                  )} />
                  <span className="font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </nav>

            {/* Perfil / Tema / Logout — siempre fijo al fondo del sidebar */}
            <div className="flex-none pt-6 border-t border-white/10">
              {/* Avatar + nombre + gear */}
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center font-bold text-lg border-2 border-white/10 shrink-0">
                  {profile?.name?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile?.name}</p>
                  <p className="text-xs text-white/40 truncate">Bronze I</p>
                </div>
                <button
                  onClick={() => { setActiveTab("mi-perfil"); setIsSidebarOpen(false); }}
                  title="Mi Perfil"
                  className={cn(
                    "p-1.5 rounded-lg transition-colors shrink-0",
                    activeTab === "mi-perfil"
                      ? "text-orange-400 bg-orange-500/10"
                      : "text-white/30 hover:text-white/70 hover:bg-white/5"
                  )}
                >
                  <Settings size={16} />
                </button>
              </div>

              {/* Tema */}
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Tema</span>
                <ThemeToggle />
              </div>

              {/* Logout */}
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut size={20} />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content — único elemento que hace scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay móvil */}
      {sidebarVisible && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
