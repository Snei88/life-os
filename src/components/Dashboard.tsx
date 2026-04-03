// src/components/Dashboard.tsx
import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Activity, CheckCircle2, Flame, TrendingUp, Calendar as CalendarIcon,
  Utensils, Dumbbell, Target, Plus, Droplets, Brain, Wallet,
  Clock, ChevronRight, Trophy, Zap, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, CartesianGrid
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useData } from "../hooks/useData";
import { cn, formatCurrency } from "../lib/utils";
import { getLogicalDate } from "../lib/dateUtils";
import type { Habit, Meal, Transaction, Goal, ScheduleEvent, WorkoutSession } from "../types";

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const Dashboard: React.FC<{ onNavigate?: (tab: string, action?: string) => void }> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';
  const tooltipStyle = resolvedTheme === 'light'
    ? { backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '12px', color: '#111827' }
    : { backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' };
  const { 
    habits, habitLogs, 
    meals, 
    transactions, 
    goals, 
    scheduleEvents,
    workoutSessions,
    gymStats,
    brianTracyLogs,
    journalEntries
  } = useData();

  const today = getLogicalDate();
  const todayObj = new Date();
  const todayIndex = todayObj.getDay();

  // ─── SECCIÓN 1: ESTADO DEL DÍA (Cálculos) ─────────────────────────────────
  
  // Hábitos hoy
  const todayHabits = habits.filter(h => h.appliesToday !== false);
  const completedHabitsToday = habitLogs.filter(l => 
    l.date === today && l.completed
  ).length;
  const habitsProgress = todayHabits.length > 0 
    ? (completedHabitsToday / todayHabits.length) * 100 
    : 0;

  // Nutrición hoy
  const todayMeals = meals.filter(m => m.date === today);
  const totalCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
  const targetCalories = profile?.gymTargetKcal || 1950;
  const targetProtein = profile?.proteinTarget || 126;

  // Gym hoy
  const todayWorkout = workoutSessions.find(s => s.date === today);
  const hasWorkoutToday = !!todayWorkout;
  const workoutStatus = todayWorkout?.status === 'completed' ? 'completed' : 
                       todayWorkout?.status === 'active' ? 'active' : 'pending';

  // Mindset hoy
  const todayJournal = journalEntries[0];
  const todayBrian = brianTracyLogs[0];
  const mindsetCompleted = !!(todayJournal?.affirmation && 
    todayJournal.gratitude?.every(g => g.trim() !== "") && 
    todayBrian?.completed);

  // Próxima actividad (Rutina)
  const nowMinutes = todayObj.getHours() * 60 + todayObj.getMinutes();
  const todayEvents = scheduleEvents
    .filter(e => e.dayOfWeek === todayIndex)
    .sort((a, b) => {
      const timeA = parseInt(a.time.replace(':', ''));
      const timeB = parseInt(b.time.replace(':', ''));
      return timeA - timeB;
    });
  
  const nextEvent = todayEvents.find(e => {
    const [h, m] = e.time.split(':').map(Number);
    return (h * 60 + m) > nowMinutes;
  });

  const timeUntilEvent = nextEvent ? (() => {
    const [h, m] = nextEvent.time.split(':').map(Number);
    const eventMinutes = h * 60 + m;
    const diff = eventMinutes - nowMinutes;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `en ${hours}h ${mins}m` : `en ${mins}m`;
  })() : null;

  // ─── SECCIÓN 2: MÉTRICAS SEMANALES ───────────────────────────────────────

  // Datos de hábitos semanales (heatmap)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const weeklyHabitsData = last7Days.map(date => {
    const dayHabits = habits.filter(h => {
      // Simplificación: asumimos que si aplica hoy, aplica ese día de la semana
      if (h.frequency.type === 'daily') return true;
      if (h.frequency.type === 'weekly') {
        const dayOfWeek = new Date(date).getDay();
        return h.frequency.days?.includes(dayOfWeek);
      }
      return false;
    });
    
    const completed = habitLogs.filter(l => 
      l.date === date && l.completed
    ).length;
    
    return {
      day: WEEK_DAYS[new Date(date).getDay()],
      date,
      total: dayHabits.length,
      completed,
      percentage: dayHabits.length > 0 ? (completed / dayHabits.length) * 100 : 0
    };
  });

  // Datos de nutrición semanal
  const weeklyNutritionData = last7Days.map(date => {
    const dayMeals = meals.filter(m => m.date === date);
    const cals = dayMeals.reduce((a, m) => a + m.calories, 0);
    const prot = dayMeals.reduce((a, m) => a + m.protein, 0);
    return {
      day: WEEK_DAYS[new Date(date).getDay()],
      calories: cals,
      protein: prot,
      target: targetCalories
    };
  });

  // Datos de gym semanal (volumen)
  const weeklyGymData = last7Days.map(date => {
    const session = workoutSessions.find(s => s.date === date);
    return {
      day: WEEK_DAYS[new Date(date).getDay()],
      volume: session?.totalVolume || 0,
      duration: session?.durationSeconds ? Math.floor(session.durationSeconds / 60) : 0
    };
  });

  // Datos financieros mensuales (por semanas)
  const currentMonth = todayObj.getMonth();
  const currentYear = todayObj.getFullYear();
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const monthlyFinanceData = Array.from({ length: 4 }, (_, week) => {
    const weekStart = week * 7 + 1;
    const weekEnd = weekStart + 7;
    const weekTx = monthTx.filter(t => {
      const day = new Date(t.date).getDate();
      return day >= weekStart && day < weekEnd;
    });
    const income = weekTx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
    const expense = weekTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    return {
      week: `S${week + 1}`,
      income: income / 1000, // en miles
      expense: expense / 1000,
      balance: (income - expense) / 1000
    };
  });

  // ─── SECCIÓN 3 & 4: METAS Y RACHAS ───────────────────────────────────────

  // Metas activas (top 3 por progreso)
  const activeGoals = goals
    .filter(g => g.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  // Rachas
  const habitStreak = Math.max(...habits.map(h => h.streak?.current || 0), 0);
  const gymStreak = gymStats?.currentStreak || 0;
  const mindsetStreak = (() => {
    // Calcular días consecutivos con mindset completo
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasJournal = journalEntries.some(j => j.date === dateStr && j.affirmation);
      const hasBrian = brianTracyLogs.some(b => b.date === dateStr && b.completed);
      if (hasJournal && hasBrian) streak++;
      else if (i === 0) continue; // Hoy puede estar en progreso
      else break;
    }
    return streak;
  })();

  // Calcular nivel del usuario
  const userLevel = (() => {
    const totalScore = (habitStreak * 10) + (gymStreak * 15) + ((gymStats?.totalWorkouts || 0) * 5);
    if (totalScore > 500) return { name: "Gold", color: "text-yellow-400", bg: "bg-yellow-500/10" };
    if (totalScore > 200) return { name: "Silver", color: "text-gray-300", bg: "bg-gray-500/10" };
    return { name: "Bronze", color: "text-orange-600", bg: "bg-orange-600/10" };
  })();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className={isLight ? "text-gray-500" : "text-white/60"}>Centro de comando de tu Life OS.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("px-4 py-2 rounded-2xl border", userLevel.bg, isLight ? "border-black/10" : "border-white/10")}>
            <span className={cn("text-xs uppercase font-bold block", isLight ? "text-black/40" : "text-white/40")}>Nivel</span>
            <span className={cn("font-bold", userLevel.color)}>{userLevel.name}</span>
          </div>
          <div className={cn("px-4 py-2 rounded-2xl border", isLight ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10")}>
            <span className={cn("text-xs uppercase font-bold block", isLight ? "text-black/40" : "text-white/40")}>Hoy</span>
            <span className="font-bold">{todayObj.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: ESTADO DEL DÍA - KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Hábitos */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-4 sm:p-5 rounded-3xl space-y-3")}>
          <div className="flex items-center justify-between">
            <CheckCircle2 size={20} className="text-green-500" />
            <span className={cn("text-xs font-bold", isLight ? "text-black/40" : "text-white/40")}>HÁBITOS</span>
          </div>
          <div>
            <p className="text-2xl font-black">{completedHabitsToday}<span className="text-white/30 text-lg">/{todayHabits.length}</span></p>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${habitsProgress}%` }}
                className="h-full bg-green-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Calorías */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-4 sm:p-5 rounded-3xl space-y-3")}>
          <div className="flex items-center justify-between">
            <Utensils size={20} className="text-orange-500" />
            <span className={cn("text-xs font-bold", isLight ? "text-black/40" : "text-white/40")}>CALORÍAS</span>
          </div>
          <div>
            <p className="text-2xl font-black">{totalCalories}<span className="text-white/30 text-sm">kcal</span></p>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalCalories / targetCalories) * 100, 100)}%` }}
                className={cn("h-full rounded-full", totalCalories > targetCalories ? "bg-red-500" : "bg-orange-500")}
              />
            </div>
          </div>
        </motion.div>

        {/* Proteína */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-4 sm:p-5 rounded-3xl space-y-3")}>
          <div className="flex items-center justify-between">
            <Activity size={20} className="text-blue-500" />
            <span className={cn("text-xs font-bold", isLight ? "text-black/40" : "text-white/40")}>PROTEÍNA</span>
          </div>
          <div>
            <p className="text-2xl font-black">{Math.round(totalProtein)}<span className="text-white/30 text-sm">g</span></p>
            <p className="text-xs text-white/40 mt-1">Meta: {targetProtein}g</p>
          </div>
        </motion.div>

        {/* Gym */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-4 sm:p-5 rounded-3xl space-y-3")}>
          <div className="flex items-center justify-between">
            <Dumbbell size={20} className={cn(
              workoutStatus === 'completed' ? "text-green-500" : 
              workoutStatus === 'active' ? "text-yellow-500" : "text-white/20"
            )} />
            <span className={cn("text-xs font-bold", isLight ? "text-black/40" : "text-white/40")}>GYM</span>
          </div>
          <div>
            <p className="text-lg font-bold">
              {workoutStatus === 'completed' ? "Completado" : 
               workoutStatus === 'active' ? "En progreso" : 
               todayEvents.some(e => e.type === 'gym') ? "Pendiente" : "No aplica"}
            </p>
            {todayWorkout?.totalVolume && (
              <p className="text-xs text-white/40">{todayWorkout.totalVolume}kg movidos</p>
            )}
          </div>
        </motion.div>

        {/* Mindset */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-4 sm:p-5 rounded-3xl space-y-3")}>
          <div className="flex items-center justify-between">
            <Brain size={20} className={mindsetCompleted ? "text-purple-500" : "text-white/20"} />
            <span className={cn("text-xs font-bold", isLight ? "text-black/40" : "text-white/40")}>MINDSET</span>
          </div>
          <div>
            <p className="text-lg font-bold">{mindsetCompleted ? "Completado" : "Pendiente"}</p>
            <p className="text-xs text-white/40">
              {todayBrian?.completed ? "Meta x10 ✓" : "Meta x10"}
            </p>
          </div>
        </motion.div>

        {/* Próxima Actividad */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-4 sm:p-5 rounded-3xl space-y-3")}>
          <div className="flex items-center justify-between">
            <Clock size={20} className={nextEvent ? "text-blue-400" : "text-white/20"} />
            <span className={cn("text-xs font-bold", isLight ? "text-black/40" : "text-white/40")}>AGENDA</span>
          </div>
          <div>
            {nextEvent ? (
              <>
                <p className="text-lg font-bold truncate">{nextEvent.title}</p>
                <p className="text-xs text-blue-400">{nextEvent.time} — {timeUntilEvent}</p>
              </>
            ) : (
              <p className="text-lg font-bold text-white/40">Sin más actividades</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* SECCIÓN 2: GRÁFICAS SEMANALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Consistencia de Hábitos (Heatmap visual) */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-5 sm:p-6 rounded-3xl")}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-500" />
            Consistencia Hábitos (7 días)
          </h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyHabitsData.map((day, idx) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-white/5 rounded-t-lg relative overflow-hidden" style={{ height: '80%' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${day.percentage}%` }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "absolute bottom-0 w-full rounded-t-lg transition-colors",
                      day.percentage === 100 ? "bg-green-500" : 
                      day.percentage > 50 ? "bg-green-500/50" : "bg-green-500/20"
                    )}
                  />
                </div>
                <span className="text-xs text-white/40 font-bold">{day.day}</span>
                <span className="text-[10px] text-white/30">{day.completed}/{day.total}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Nutrición Semanal */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-5 sm:p-6 rounded-3xl")}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Utensils size={18} className="text-orange-500" />
            Nutrición Semanal
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyNutritionData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontSize: 11}} />
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} kcal`, 'Calorías']}
              />
              <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                {weeklyNutritionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.calories >= targetCalories ? '#f97316' : '#f9731660'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Volumen Gym */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-5 sm:p-6 rounded-3xl")}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Dumbbell size={18} className="text-blue-500" />
            Volumen de Entrenamiento (kg)
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={weeklyGymData}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontSize: 11}} />
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} kg`, 'Volumen']}
              />
              <Area type="monotone" dataKey="volume" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVolume)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Finanzas Mensual */}
        <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-5 sm:p-6 rounded-3xl")}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-emerald-500" />
            Balance Financiero (miles $)
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={monthlyFinanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)', fontSize: 11}} />
              <Tooltip 
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [`$${(value * 1000).toLocaleString()}`, name === 'income' ? 'Ingresos' : name === 'expense' ? 'Gastos' : 'Balance']}
              />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* SECCIÓN 3 & 4: METAS Y RACHAS (Side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metas Activas */}
        <motion.div variants={item} className="lg:col-span-2 bg-[#0d0d0d] border border-white/10 p-6 rounded-3xl">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Target size={18} className="text-purple-500" />
            Metas Activas
          </h3>
          <div className="space-y-3">
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl">
                <p className="text-white/40 text-sm">No tienes metas activas</p>
                <button onClick={() => onNavigate?.("goals", "open-goal-modal")} className="mt-2 text-purple-500 text-sm font-bold">Crear primera meta</button>
              </div>
            ) : (
              activeGoals.map(goal => {
                const level = goal.level === '90d' ? { color: 'bg-blue-500', text: 'text-blue-400', label: '90D' } :
                             goal.level === '6m' ? { color: 'bg-purple-500', text: 'text-purple-400', label: '6M' } :
                             { color: 'bg-orange-500', text: 'text-orange-400', label: '2Y' };
                
                return (
                  <div key={goal.id} className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-colors">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black", level.color + "20", level.text)}>
                      {level.label}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold">{goal.title}</h4>
                        <span className={cn("text-sm font-bold", level.text)}>{goal.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          className={cn("h-full rounded-full", level.color)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Rachas y Logros */}
        <motion.div variants={item} className="space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            Rachas
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gradient-to-br from-orange-600/20 to-[#0d0d0d] border border-orange-600/30 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Flame size={24} className="text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{habitStreak}</p>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Días Hábitos</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-[#0d0d0d] border border-blue-600/30 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Dumbbell size={24} className="text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{gymStreak}</p>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Días Gym</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-[#0d0d0d] border border-purple-600/30 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Brain size={24} className="text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-black">{mindsetStreak}</p>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Días Mindset</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECCIÓN 5: AGENDA DEL DÍA (Timeline) */}
      <motion.div variants={item} className={cn(isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10", "border p-5 sm:p-6 rounded-3xl")}>
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <CalendarIcon size={18} className="text-blue-400" />
          Tu Día
        </h3>
        
        <div className="relative">
          {/* Línea central */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
          
          <div className="space-y-4">
            {todayEvents.length === 0 ? (
              <p className="text-white/40 text-center py-8">No hay actividades programadas para hoy</p>
            ) : (
              todayEvents.map((event, idx) => {
                const [h, m] = event.time.split(':').map(Number);
                const eventMinutes = h * 60 + m;
                const isPast = eventMinutes < nowMinutes;
                const isCurrent = Math.abs(eventMinutes - nowMinutes) < 30; // 30 min margen
                const isGym = event.type === 'gym' || event.color === 'green';
                
                return (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "relative flex items-center gap-4 pl-12 py-2",
                      isPast && "opacity-40",
                      isCurrent && "scale-105"
                    )}
                  >
                    {/* Punto en la línea */}
                    <div className={cn(
                      "absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10",
                      isPast ? "bg-white/10 border-white/20" : 
                      isCurrent ? "bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50" :
                      "bg-[#0d0d0d] border-white/40"
                    )}>
                      {isPast && <CheckCircle2 size={12} className="text-white/40" />}
                      {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                    </div>
                    
                    {/* Hora */}
                    <div className="w-16 text-sm font-bold text-white/60">{event.time}</div>
                    
                    {/* Contenido */}
                    <div className={cn(
                      "flex-1 p-3 rounded-xl border",
                      isGym ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/10",
                      isCurrent && "bg-blue-500/10 border-blue-500/30"
                    )}>
                      <div className="flex items-center justify-between">
                        <h4 className={cn("font-bold", isCurrent && "text-blue-400")}>{event.title}</h4>
                        {isCurrent && <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">AHORA</span>}
                      </div>
                      {event.description && (
                        <p className="text-xs text-white/40 mt-1">{event.description}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;