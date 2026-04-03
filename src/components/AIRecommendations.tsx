// src/components/AIRecommendations.tsx
import React, { useMemo } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, Brain, TrendingUp, Target, Zap, 
  AlertCircle, Lightbulb, ChevronRight, Activity,
  Wallet, Dumbbell, CheckCircle2, Calendar
} from "lucide-react";
import { useData } from "../hooks/useData";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";

interface Recommendation {
  id: string;
  type: "nutrition" | "gym" | "finance" | "habits" | "mindset";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  icon: any;
  color: string;
}

interface AIRecommendationsProps {
  onNavigate: (tab: string, action?: string) => void;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { 
    habits, habitLogs, meals, transactions, 
    workoutSessions, gymStats, goals 
  } = useData();

  const today = new Date().toISOString().split('T')[0];
  
  const recommendations = useMemo<Recommendation[]>(() => {
    const recs: Recommendation[] = [];
    
    // 1. Análisis de hábitos
    const todayHabits = habitLogs.filter(l => l.date === today && l.completed).length;
    const totalHabits = habits.filter(h => h.appliesToday !== false).length;
    const completionRate = totalHabits > 0 ? todayHabits / totalHabits : 0;
    
    if (completionRate === 1 && totalHabits > 0) {
      recs.push({
        id: "habits-master",
        type: "habits",
        priority: "medium",
        title: "¡Día perfecto de hábitos!",
        description: "Has completado el 100% de tus hábitos hoy. Considera aumentar la dificultad o añadir nuevos hábitos.",
        action: "Añadir hábito",
        icon: CheckCircle2,
        color: "green"
      });
    } else if (completionRate < 0.5 && totalHabits > 0) {
      recs.push({
        id: "habits-warning",
        type: "habits",
        priority: "high",
        title: "Hábitos pendientes",
        description: `Tienes ${totalHabits - todayHabits} hábitos pendientes hoy. La consistencia es clave para el cambio.`,
        action: "Ver hábitos",
        icon: AlertCircle,
        color: "orange"
      });
    }
    
    // 2. Análisis de nutrición
    const todayMeals = meals.filter(m => m.date === today);
    const totalCals = todayMeals.reduce((a, m) => a + m.calories, 0);
    const targetCals = profile?.gymTargetKcal || 1950;
    const hasAnyMeal = meals.length > 0;

    if (!hasAnyMeal) {
      recs.push({
        id: "nutrition-never",
        type: "nutrition",
        priority: "high",
        title: "Sin registros de comidas",
        description: "Aún no has registrado ninguna comida. Primero registra tu alimentación para obtener análisis nutricional.",
        action: "Registrar comida",
        icon: Zap,
        color: "orange"
      });
    } else if (todayMeals.length === 0) {
      recs.push({
        id: "nutrition-empty",
        type: "nutrition",
        priority: "high",
        title: "Sin comidas registradas hoy",
        description: "No has registrado ninguna comida hoy. El tracking nutricional es fundamental para tu físico.",
        action: "Registrar comida",
        icon: Zap,
        color: "orange"
      });
    } else if (totalCals < targetCals * 0.8) {
      recs.push({
        id: "nutrition-low",
        type: "nutrition",
        priority: "medium",
        title: "Calorías bajas",
        description: `Llevas ${totalCals}kcal de ${targetCals}kcal objetivo. Considera añadir un snack.`,
        action: "Ver nutrición",
        icon: Activity,
        color: "yellow"
      });
    }

    // 3. Análisis de gym
    const hasAnyWorkout = workoutSessions.length > 0;
    const daysSinceRegistration = profile?.createdAt
      ? Math.floor((new Date().getTime() - new Date(profile.createdAt as string).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const lastWorkout = gymStats?.lastWorkoutDate;
    const daysSinceLastWorkout = lastWorkout
      ? Math.floor((new Date().getTime() - new Date(lastWorkout).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (!hasAnyWorkout) {
      recs.push({
        id: "gym-never",
        type: "gym",
        priority: "high",
        title: "Sin entrenamientos registrados",
        description: `Llevas ${daysSinceRegistration} día${daysSinceRegistration !== 1 ? "s" : ""} desde que te registraste sin entrenar. ¡Primero crea tu rutina!`,
        action: "Ir al Gym",
        icon: Dumbbell,
        color: "purple"
      });
    } else if (daysSinceLastWorkout !== null && daysSinceLastWorkout > 3) {
      recs.push({
        id: "gym-rest",
        type: "gym",
        priority: "high",
        title: "Días sin entrenar",
        description: `Han pasado ${daysSinceLastWorkout} día${daysSinceLastWorkout !== 1 ? "s" : ""} desde tu último entrenamiento. ¡Mantén la racha!`,
        action: "Ir al Gym",
        icon: Dumbbell,
        color: "purple"
      });
    } else if (gymStats?.currentStreak && gymStats.currentStreak > 5) {
      recs.push({
        id: "gym-streak",
        type: "gym",
        priority: "low",
        title: "¡Racha impresionante!",
        description: `Llevas ${gymStats.currentStreak} días seguidos. Estás en modo bestia.`,
        action: "Ver progreso",
        icon: TrendingUp,
        color: "green"
      });
    }
    
    // 4. Análisis financiero
    const thisMonth = new Date().getMonth();
    const monthlyIncome = transactions
      .filter(t => new Date(t.date).getMonth() === thisMonth && t.type === 'income')
      .reduce((a, t) => a + t.amount, 0);
    const monthlyExpense = transactions
      .filter(t => new Date(t.date).getMonth() === thisMonth && t.type === 'expense')
      .reduce((a, t) => a + t.amount, 0);
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;
    
    if (savingsRate < 10 && monthlyIncome > 0) {
      recs.push({
        id: "finance-warning",
        type: "finance",
        priority: "high",
        title: "Tasa de ahorro baja",
        description: `Estás ahorrando solo el ${savingsRate.toFixed(1)}%. Intenta reducir gastos innecesarios.`,
        action: "Ver finanzas",
        icon: Wallet,
        color: "red"
      });
    } else if (savingsRate >= 25) {
      recs.push({
        id: "finance-good",
        type: "finance",
        priority: "low",
        title: "Excelente disciplina financiera",
        description: `Estás ahorrando el ${savingsRate.toFixed(1)}% de tus ingresos. ¡Sigue así!`,
        action: "Ver resumen",
        icon: TrendingUp,
        color: "green"
      });
    }
    
    // 5. Metas
    const activeGoals = goals.filter(g => g.progress < 100);
    const nearDeadline = activeGoals.filter(g => {
      if (!g.deadline) return false;
      const daysLeft = Math.floor((new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft < 7 && daysLeft > 0;
    });
    
    if (nearDeadline.length > 0) {
      recs.push({
        id: "goals-urgent",
        type: "mindset",
        priority: "high",
        title: "Metas próximas a vencer",
        description: `Tienes ${nearDeadline.length} meta(s) que vencen esta semana.`,
        action: "Revisar metas",
        icon: Target,
        color: "orange"
      });
    }
    
    // Si todo está bien, dar recomendación de mindset
    if (recs.length === 0) {
      recs.push({
        id: "mindset-optimize",
        type: "mindset",
        priority: "low",
        title: "Momento de reflexión",
        description: "Todo está en orden. Es un buen momento para journaling y planificar la próxima semana.",
        action: "Ir a Mindset",
        icon: Brain,
        color: "blue"
      });
    }
    
    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [habits, habitLogs, meals, transactions, workoutSessions, gymStats, goals, profile, today]);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      default: return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Sparkles className="text-purple-500 shrink-0" size={28} />
            Recomendaciones IA
          </h1>
          <p className="text-white/60 mt-1 text-sm sm:text-base">
            Análisis inteligente de tus datos para optimizar tu rendimiento
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full self-start sm:self-auto">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
            {recommendations.length} insights
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "group bg-[#0d0d0d] border rounded-3xl p-6 hover:border-opacity-50 transition-all cursor-pointer",
              rec.priority === "high" ? "border-red-500/30 hover:border-red-500/60" :
              rec.priority === "medium" ? "border-yellow-500/30 hover:border-yellow-500/60" :
              "border-white/10 hover:border-white/30"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                rec.color === "green" ? "bg-green-500/10 text-green-500" :
                rec.color === "orange" ? "bg-orange-500/10 text-orange-500" :
                rec.color === "red" ? "bg-red-500/10 text-red-500" :
                rec.color === "purple" ? "bg-purple-500/10 text-purple-500" :
                "bg-blue-500/10 text-blue-500"
              )}>
                <rec.icon size={24} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{rec.title}</h3>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border",
                    getPriorityColor(rec.priority)
                  )}>
                    {rec.priority === "high" ? "Alta prioridad" : 
                     rec.priority === "medium" ? "Media" : "Tip"}
                  </span>
                </div>
                
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  {rec.description}
                </p>
                
                <button
                  onClick={() => {
                    const actionMap: Record<string, { tab: string; action?: string }> = {
                      "Registrar comida": { tab: "nutrition", action: "open-meal-modal" },
                      "Ver nutrición": { tab: "nutrition" },
                      "Ir al Gym": { tab: "gym" },
                      "Ver progreso": { tab: "gym" },
                      "Ver hábitos": { tab: "habits" },
                      "Añadir hábito": { tab: "habits" },
                      "Ver finanzas": { tab: "finance" },
                      "Ver resumen": { tab: "finance" },
                      "Revisar metas": { tab: "goals" },
                      "Ir a Mindset": { tab: "mindset" },
                    };
                    const dest = actionMap[rec.action];
                    if (dest) onNavigate(dest.tab, dest.action);
                  }}
                  className={cn(
                  "flex items-center gap-2 text-sm font-bold transition-colors",
                  rec.color === "green" ? "text-green-400 hover:text-green-300" :
                  rec.color === "orange" ? "text-orange-400 hover:text-orange-300" :
                  rec.color === "red" ? "text-red-400 hover:text-red-300" :
                  rec.color === "purple" ? "text-purple-400 hover:text-purple-300" :
                  "text-blue-400 hover:text-blue-300"
                )}>
                  {rec.action}
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { label: "Hábitos hoy", value: `${Math.round((habitLogs.filter(l => l.date === today && l.completed).length / Math.max(habits.filter(h => h.appliesToday !== false).length, 1)) * 100)}%`, icon: CheckCircle2, color: "text-green-400" },
          { label: "Calorías", value: `${meals.filter(m => m.date === today).reduce((a, m) => a + m.calories, 0)}`, icon: Zap, color: "text-orange-400" },
          { label: "Último gym", value: gymStats?.lastWorkoutDate ? `${Math.floor((new Date().getTime() - new Date(gymStats.lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24))}d` : "N/A", icon: Dumbbell, color: "text-purple-400" },
          { label: "Balance mes", value: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
            transactions.filter(t => new Date(t.date).getMonth() === new Date().getMonth() && t.type === 'income').reduce((a, t) => a + t.amount, 0) -
            transactions.filter(t => new Date(t.date).getMonth() === new Date().getMonth() && t.type === 'expense').reduce((a, t) => a + t.amount, 0)
          ), icon: Wallet, color: "text-blue-400" }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="bg-[#0d0d0d] border border-white/10 p-4 rounded-2xl"
          >
            <stat.icon className={cn("mb-2", stat.color)} size={20} />
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};