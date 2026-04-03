// src/components/Habits.tsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Check, Flame, Trophy, Calendar, Trash2,
  Target, Zap, Brain,
  Heart, Sparkles, X, Info, ExternalLink, ChevronDown,
  ChevronUp, Clock, Edit3, ChevronLeft, ChevronRight
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import confetti from "canvas-confetti";
import { api } from "../api";
import { useData } from "../hooks/useData";
import { cn } from "../lib/utils";
import { getLogicalDate } from "../lib/dateUtils";
import type { Habit, HabitStats, Frequency } from "../types";

const CATEGORIES = {
  salud: { label: 'Salud', icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
  mente: { label: 'Mente', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  productividad: { label: 'Productividad', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  otros: { label: 'Otros', icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

const WEEK_DAYS = [
  { label: 'Lun', value: 1, short: 'L' },
  { label: 'Mar', value: 2, short: 'M' },
  { label: 'Mie', value: 3, short: 'X' },
  { label: 'Jue', value: 4, short: 'J' },
  { label: 'Vie', value: 5, short: 'V' },
  { label: 'Sab', value: 6, short: 'S' },
  { label: 'Dom', value: 0, short: 'D' },
];

const Habits: React.FC = () => {
  const { refresh } = useData();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const today = getLogicalDate();
  const currentDate = new Date();
  
  // Estados
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  // Estados para semana (histórico)
  const [weekOffset, setWeekOffset] = useState(0);
  const [weeklyLogs, setWeeklyLogs] = useState<Record<string, boolean>>({});
  
  // Estados para modal y formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "salud" as keyof typeof CATEGORIES,
    frequencyType: "daily" as "daily" | "weekly" | "unique",
    selectedDays: [1, 2, 3, 4, 5],
    uniqueDate: today,
    targetStreak: 21,
    color: "orange",
    reminderTime: "",
  });

  // Estado para consistencia mensual
  const [monthExpanded, setMonthExpanded] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  // Cargar logs de la semana cuando cambie el offset
  useEffect(() => {
    if (habits.length > 0) {
      loadWeeklyLogs();
    }
  }, [weekOffset, habits]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [habitsData, statsData] = await Promise.all([
        api.getHabits(),
        api.getHabitStats(currentDate.getFullYear(), currentDate.getMonth() + 1),
      ]);
      
      // Ordenar hábitos por hora de recordatorio (los que tienen hora van primero, ordenados por hora)
      const sortedHabits = habitsData.sort((a: Habit, b: Habit) => {
        if (a.reminderTime && b.reminderTime) {
          return a.reminderTime.localeCompare(b.reminderTime);
        }
        if (a.reminderTime) return -1;
        if (b.reminderTime) return 1;
        return 0;
      });
      
      setHabits(sortedHabits);
      setStats(statsData);
      await loadWeeklyLogs(sortedHabits);
    } catch (err) {
      console.error("Error cargando hábitos:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyLogs = async (currentHabits?: Habit[]) => {
    const habitsToUse = currentHabits || habits;
    if (habitsToUse.length === 0) return;

    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;
    
    try {
      const logs = await api.getHabitLogs({ startDate, endDate });
      // Crear mapa de logs por habitId_fecha
      const logMap: Record<string, boolean> = {};
      logs.forEach((log: any) => {
        logMap[`${log.habitId}_${log.date}`] = log.completed;
      });
      setWeeklyLogs(logMap);
    } catch (err) {
      console.error("Error cargando logs semanales:", err);
    }
  };

  // Función para verificar si un hábito aplica en una fecha específica
  const isHabitApplicableOnDate = (habit: Habit, dateStr: string) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    if (habit.frequency.type === 'daily') return true;
    if (habit.frequency.type === 'weekly') {
      return habit.frequency.days?.includes(dayOfWeek) ?? false;
    }
    if (habit.frequency.type === 'unique') {
      return habit.frequency.date === dateStr;
    }
    return false;
  };

  // Toggle genérico para cualquier fecha (usado en tabla semanal y "para hoy")
  const handleToggleHabitForDate = async (habit: Habit, dateStr: string) => {
    const logKey = `${habit.id}_${dateStr}`;
    const currentStatus = weeklyLogs[logKey] || false;
    const newStatus = !currentStatus;
    
    // Actualización optimista del UI
    setWeeklyLogs(prev => ({
      ...prev,
      [logKey]: newStatus
    }));
    
    try {
      await api.upsertHabitLog({ 
        habitId: habit.id, 
        date: dateStr, 
        completed: newStatus 
      });
      
      if (newStatus && dateStr === today) {
        confetti({ 
          particleCount: 100, 
          spread: 70, 
          origin: { y: 0.6 }, 
          colors: ["#ea580c", "#f97316", "#fb923c"] 
        });
      }
      
      // Recargar stats y datos
      await loadData();
      refresh();
    } catch (err) {
      // Revertir en caso de error
      setWeeklyLogs(prev => ({
        ...prev,
        [logKey]: currentStatus
      }));
      console.error("Error actualizando hábito:", err);
    }
  };

  // Wrapper para el toggle de hoy (para compatibilidad con código existente)
  const handleToggleHabit = async (habit: Habit) => {
    await handleToggleHabitForDate(habit, today);
  };

  const handleCreateOrUpdateHabit = async () => {
    if (!formData.name.trim()) return;

    const frequency: Frequency = {
      type: formData.frequencyType,
    };

    if (formData.frequencyType === 'weekly') {
      frequency.days = formData.selectedDays;
    } else if (formData.frequencyType === 'unique') {
      frequency.date = formData.uniqueDate;
    }

    const habitData = {
      name: formData.name,
      category: formData.category,
      frequency,
      targetStreak: formData.targetStreak,
      color: formData.color,
      reminderTime: formData.reminderTime || null,
    };

    try {
      if (editingHabit) {
        await api.updateHabit(editingHabit.id, habitData);
      } else {
        await api.addHabit(habitData);
      }
      
      closeModal();
      // Esperar un poco antes de recargar para evitar duplicados visuales
      setTimeout(() => loadData(), 100);
    } catch (err) {
      alert(editingHabit ? "Error actualizando hábito" : "Error creando hábito");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
    setInfoExpanded(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "salud",
      frequencyType: "daily",
      selectedDays: [1, 2, 3, 4, 5],
      uniqueDate: today,
      targetStreak: 21,
      color: "orange",
      reminderTime: "",
    });
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      category: habit.category as keyof typeof CATEGORIES,
      frequencyType: habit.frequency.type as any,
      selectedDays: habit.frequency.days || [1, 2, 3, 4, 5],
      uniqueDate: habit.frequency.date || today,
      targetStreak: habit.targetStreak || 21,
      color: habit.color || "orange",
      reminderTime: habit.reminderTime || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este hábito? Se perderá todo el historial.")) return;
    try {
      await api.deleteHabit(id);
      loadData();
      refresh();
    } catch (err) {
      alert("Error eliminando hábito");
    }
  };

  // Separar hábitos por aplicabilidad hoy (usando datos de weeklyLogs para hoy)
  const { todayHabits, otherHabits } = useMemo(() => {
    const today_ = habits.filter(h => isHabitApplicableOnDate(h, today));
    const other = habits.filter(h => !isHabitApplicableOnDate(h, today));
    return { todayHabits: today_, otherHabits: other };
  }, [habits, today]);

  // Calcular métricas de hoy usando weeklyLogs
  const todayCompleted = useMemo(() => {
    return todayHabits.filter(h => weeklyLogs[`${h.id}_${today}`]).length;
  }, [todayHabits, weeklyLogs, today]);
  
  const todayTotal = todayHabits.length;
  const todayProgress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  // Generar días de la semana actual (con offset)
  const weekDays = useMemo(() => {
    const curr = new Date();
    const week = [];
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(curr);
      date.setDate(diff + i);
      const dateStr = date.toISOString().split('T')[0];
      week.push({
        date: dateStr,
        dayName: WEEK_DAYS[i].label,
        dayNum: date.getDate(),
        isToday: dateStr === today
      });
    }
    return week;
  }, [weekOffset, today]);

  // Generar días del mes para heatmap
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayStats = stats?.dailyStats.find(d => d.date === dateStr);
    return { day, dateStr, stats: dayStats };
  });

  // Limitar a 5 días si no está expandido
  const visibleMonthDays = monthExpanded ? monthDays : monthDays.slice(0, 5);

  const getBadge = (streak: number) => {
    if (streak >= 66) return { icon: Trophy, label: "Gold", color: "text-yellow-400" };
    if (streak >= 21) return { icon: Trophy, label: "Silver", color: "text-gray-300" };
    if (streak >= 7) return { icon: Trophy, label: "Bronze", color: "text-orange-600" };
    if (streak >= 3) return { icon: Flame, label: "En Racha", color: "text-orange-500" };
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight", isLight ? "text-black" : "text-white")}>
            Hábitos
          </h1>
          <p className={isLight ? "text-black/60" : "text-white/60"}>Construye disciplina, un día a la vez.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold transition-all"
          >
            <Plus size={20} />Nuevo Hábito
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className={cn("border p-4 sm:p-6 rounded-3xl",
          isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10")}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
              <Check size={20} />
            </div>
            <span className={cn("text-xs font-bold uppercase", isLight ? "text-black/40" : "text-white/40")}>Hoy</span>
          </div>
          <p className={cn("text-2xl sm:text-3xl font-bold", isLight ? "text-black" : "text-white")}>{todayCompleted}/{todayTotal}</p>
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
        </div>

        <div className={cn("border p-4 sm:p-6 rounded-3xl",
          isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10")}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
              <Flame size={20} />
            </div>
            <span className={cn("text-xs font-bold uppercase", isLight ? "text-black/40" : "text-white/40")}>Mejor Racha</span>
          </div>
          <p className={cn("text-2xl sm:text-3xl font-bold", isLight ? "text-black" : "text-white")}>{stats?.bestStreak || 0}</p>
          <p className={cn("text-xs mt-1", isLight ? "text-black/40" : "text-white/40")}>días consecutivos</p>
        </div>

        <div className={cn("border p-4 sm:p-6 rounded-3xl",
          isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10")}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
              <Trophy size={20} />
            </div>
            <span className={cn("text-xs font-bold uppercase", isLight ? "text-black/40" : "text-white/40")}>Logros</span>
          </div>
          <p className={cn("text-2xl sm:text-3xl font-bold", isLight ? "text-black" : "text-white")}>
            {habits.filter(h => (h.streak?.current || 0) >= 7).length}
          </p>
          <p className={cn("text-xs mt-1", isLight ? "text-black/40" : "text-white/40")}>hábitos en racha</p>
        </div>

        <div className={cn("border p-4 sm:p-6 rounded-3xl",
          isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10")}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <Target size={20} />
            </div>
            <span className={cn("text-xs font-bold uppercase", isLight ? "text-black/40" : "text-white/40")}>Total</span>
          </div>
          <p className={cn("text-2xl sm:text-3xl font-bold", isLight ? "text-black" : "text-white")}>{stats?.totalCompleted || 0}</p>
          <p className={cn("text-xs mt-1", isLight ? "text-black/40" : "text-white/40")}>completados este mes</p>
        </div>
      </div>

      {/* Hábitos de Hoy - Ordenados por hora */}
      <div className="space-y-4">
        <h3 className={cn("font-bold text-xl flex items-center gap-2", isLight ? "text-black" : "text-white")}>
          <Zap size={20} className="text-orange-500" />
          Para Hoy
          <span className={cn("text-sm font-normal ml-2", isLight ? "text-black/40" : "text-white/40")}>
            {todayCompleted}/{todayTotal} completados
          </span>
        </h3>
        
        {todayHabits.length === 0 ? (
          <div className={cn("text-center py-8 border rounded-3xl border-dashed", 
            isLight ? "bg-gray-50 border-black/10" : "bg-[#0d0d0d] border-white/10")}>
            <p className={isLight ? "text-black/40" : "text-white/40"}>No hay hábitos programados para hoy</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {todayHabits.map((habit) => {
                const isCompleted = weeklyLogs[`${habit.id}_${today}`] || false;
                const category = CATEGORIES[habit.category as keyof typeof CATEGORIES] || CATEGORIES.otros;
                const badge = getBadge(habit.streak?.current || 0);
                
                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "group border p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer",
                      isLight ? "bg-white border-black/10 hover:border-black/20" : "bg-[#0d0d0d] border-white/10 hover:border-white/20",
                      isCompleted && (isLight ? "bg-orange-50 border-orange-200" : "bg-orange-600/5 border-orange-600/30")
                    )}
                    onClick={() => openEditModal(habit)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHabit(habit);
                        }}
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                          isCompleted
                            ? "bg-orange-600 border-orange-600 text-white scale-110 shadow-lg shadow-orange-600/30"
                            : isLight ? "border-black/10 hover:border-orange-600/50 hover:bg-black/5"
                            : "border-white/10 hover:border-orange-600/50 hover:bg-white/5"
                        )}
                      >
                        <Check size={20} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn("font-bold text-base sm:text-lg truncate", isCompleted && "text-orange-500")}>
                            {habit.name}
                          </h3>
                          {badge && (
                            <span className={cn("flex items-center gap-1 text-xs font-bold", badge.color)}>
                              <badge.icon size={12} />
                              {badge.label}
                            </span>
                          )}
                          {habit.reminderTime && (
                            <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500")}>
                              <Clock size={12} />
                              {habit.reminderTime}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", category.bg, category.color)}>
                            {category.label}
                          </span>
                          <span className={cn("text-xs flex items-center gap-1", isLight ? "text-black/40" : "text-white/40")}>
                            <Flame size={12} className="text-orange-500" />
                            Racha: {habit.streak?.current || 0} días
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(habit);
                        }}
                        className={cn("p-2 transition-colors", isLight ? "text-black/20 hover:text-orange-600" : "text-white/20 hover:text-orange-400")}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(habit.id);
                        }}
                        className={cn("p-2 transition-colors sm:opacity-0 sm:group-hover:opacity-100",
                          isLight ? "text-black/20 hover:text-red-500" : "text-white/20 hover:text-red-500")}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Hábitos que no aplican hoy */}
      {otherHabits.length > 0 && (
        <div className="space-y-4 opacity-60">
          <h3 className={cn("font-bold text-lg flex items-center gap-2", isLight ? "text-black/60" : "text-white/60")}>
            <Info size={18} />
            No aplica hoy
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {otherHabits.map((habit) => (
              <div
                key={habit.id}
                onClick={() => openEditModal(habit)}
                className={cn("border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all",
                  isLight ? "bg-gray-50 border-black/5 hover:border-black/10" : "bg-[#0d0d0d] border-white/5 hover:border-white/10")}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", 
                    isLight ? "bg-black/5 text-black/20" : "bg-white/5 text-white/20")}>
                    <Check size={24} />
                  </div>
                  <div>
                    <h3 className={cn("font-bold", isLight ? "text-black/60" : "text-white/60")}>{habit.name}</h3>
                    <p className={cn("text-xs", isLight ? "text-black/30" : "text-white/30")}>
                      {habit.frequency.type === 'weekly' 
                        ? `Días: ${habit.frequency.days?.map(d => WEEK_DAYS.find(w => w.value === d)?.label).join(', ')}`
                        : habit.frequency.type === 'unique'
                          ? `Fecha única: ${habit.frequency.date}`
                          : 'Diario (suspendido)'}
                    </p>
                  </div>
                </div>
                <Edit3 size={18} className={isLight ? "text-black/20" : "text-white/20"} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico Semanal */}
      <div className={cn("border rounded-3xl p-4 sm:p-6", isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10")}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className={cn("font-bold flex items-center gap-2", isLight ? "text-black" : "text-white")}>
            <Calendar size={18} className="text-orange-500" />
            Histórico Semanal
          </h3>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className={cn("p-2 rounded-lg transition-colors", isLight ? "hover:bg-black/5" : "hover:bg-white/10")}
            >
              <ChevronLeft size={18} />
            </button>
            <span className={cn("text-xs sm:text-sm font-medium text-center", isLight ? "text-black/60" : "text-white/60")}>
              {weekDays[0].dayName} {weekDays[0].dayNum} – {weekDays[6].dayName} {weekDays[6].dayNum}
            </span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className={cn("p-2 rounded-lg transition-colors", isLight ? "hover:bg-black/5" : "hover:bg-white/10")}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={cn("text-left text-xs font-bold uppercase tracking-wider pb-4", isLight ? "text-black/40" : "text-white/40")}>
                  Hábito
                </th>
                {weekDays.map((day) => (
                  <th key={day.date} className={cn("text-center text-xs font-bold pb-4 min-w-[60px]",
                    day.isToday ? "text-orange-500" : (isLight ? "text-black/40" : "text-white/40"))}>
                    <div>{day.dayName}</div>
                    <div className="text-lg">{day.dayNum}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="space-y-2">
              {habits.map((habit) => (
                <tr key={habit.id} className="group">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium text-sm truncate max-w-[150px]", isLight ? "text-black" : "text-white")}>
                        {habit.name}
                      </span>
                      {habit.reminderTime && (
                        <span className={cn("text-xs", isLight ? "text-black/30" : "text-white/30")}>
                          {habit.reminderTime}
                        </span>
                      )}
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const isApplicable = isHabitApplicableOnDate(habit, day.date);
                    const logKey = `${habit.id}_${day.date}`;
                    const isCompleted = weeklyLogs[logKey] || false;
                    const isToday = day.date === today; // Verificar si es hoy
                    return (
                      <td key={day.date} className="py-3 text-center">
                        <button
                          onClick={() => isToday && isApplicable && handleToggleHabitForDate(habit, day.date)}
                          disabled={!isToday || !isApplicable} // Deshabilitado si no es hoy o no aplica
                          className={cn(
                            "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 mx-auto",
                            !isApplicable && (isLight ? "bg-black/5 border-transparent opacity-30" : "bg-white/5 border-transparent opacity-30"),
                            isApplicable && !isCompleted && (isLight 
                              ? "border-black/10 hover:border-orange-600/50 hover:bg-black/5" 
                              : "border-white/10 hover:border-orange-600/50 hover:bg-white/5"),
                            isApplicable && isCompleted && "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/30"
                          )}
                        >
                          {isCompleted && <Check size={16} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap Mensual - Colapsable */}
      <div className={cn("border rounded-3xl p-4 sm:p-8", isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10")}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn("font-bold flex items-center gap-2", isLight ? "text-black" : "text-white")}>
            <Calendar size={18} className="text-orange-500" />
            Consistencia Mensual
          </h3>
          <button
            onClick={() => setMonthExpanded(!monthExpanded)}
            className={cn("flex items-center gap-1 text-sm font-medium transition-colors", 
              isLight ? "text-black/60 hover:text-black" : "text-white/60 hover:text-white")}
          >
            {monthExpanded ? (
              <>Ver menos <ChevronUp size={16} /></>
            ) : (
              <>Ver detalle <ChevronDown size={16} /></>
            )}
          </button>
        </div>
        
        <div className={cn("grid gap-2 transition-all duration-500", 
          monthExpanded ? "grid-cols-7" : "grid-cols-5")}>
          {(monthExpanded ? ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] : 
            visibleMonthDays.map((_, i) => `D${i+1}`)).map((d, i) => (
            <div key={i} className={cn("text-center text-xs font-bold mb-2", 
              isLight ? "text-black/20" : "text-white/20")}>
              {monthExpanded ? d : d}
            </div>
          ))}
          
          {visibleMonthDays.map(({ day, dateStr, stats: dayStats }) => {
            let bgColor = isLight ? "bg-black/5" : "bg-white/5";
            if (dayStats) {
              if (dayStats.percentage === 100) bgColor = "bg-orange-500";
              else if (dayStats.percentage > 0) bgColor = "bg-orange-500/30";
            }
            
            const isToday = dateStr === today;
            
            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.1 }}
                onClick={() => dayStats && setSelectedDay(dateStr)}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative",
                  bgColor,
                  isToday && (isLight ? "ring-2 ring-black ring-offset-2 ring-offset-white" 
                    : "ring-2 ring-white ring-offset-2 ring-offset-black"),
                  dayStats && dayStats.total > 0 ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span className={dayStats && dayStats.percentage > 50 ? "text-white" : (isLight ? "text-black/60" : "text-white/60")}>
                  {day}
                </span>
                {dayStats && dayStats.total > 0 && (
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full" />
                )}
              </motion.button>
            );
          })}
        </div>
        
        {!monthExpanded && monthDays.length > 5 && (
          <div className={cn("mt-4 text-center text-xs", isLight ? "text-black/30" : "text-white/30")}>
            Mostrando 5 de {monthDays.length} días
          </div>
        )}
      </div>

      {/* Modal Detalle Día */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("border rounded-3xl p-6 w-full max-w-md", 
              isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10")}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn("text-xl font-bold", isLight ? "text-black" : "text-white")}>
                {new Date(selectedDay).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button 
                onClick={() => setSelectedDay(null)}
                className={cn("p-2 rounded-lg transition-colors", isLight ? "hover:bg-black/5" : "hover:bg-white/10")}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {(() => {
                const dayData = stats?.dailyStats.find(d => d.date === selectedDay);
                if (!dayData || dayData.total === 0) return <p className={isLight ? "text-black/40" : "text-white/40"}>Sin datos</p>;
                
                return (
                  <>
                    <p className={cn("text-sm mb-4", isLight ? "text-black/60" : "text-white/60")}>
                      Completados: {dayData.completed} de {dayData.total} ({dayData.percentage}%)
                    </p>
                    {habits.filter(h => isHabitApplicableOnDate(h, selectedDay)).map(habit => {
                      const logKey = `${habit.id}_${selectedDay}`;
                      const isCompleted = weeklyLogs[logKey] || false;
                      return (
                        <div key={habit.id} className={cn("flex items-center justify-between p-3 rounded-xl border",
                          isLight ? "bg-gray-50 border-black/5" : "bg-white/5 border-white/10")}>
                          <span className={cn("text-sm font-medium", isLight ? "text-black" : "text-white")}>{habit.name}</span>
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", 
                            isCompleted ? "bg-orange-500 text-white" : (isLight ? "bg-black/10" : "bg-white/10"))}>
                            {isCompleted && <Check size={14} />}
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Nuevo/Editar Hábito */}
      <AnimatePresence onExitComplete={() => setInfoExpanded(false)}>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={cn(
              "flex gap-6 w-full max-w-5xl justify-center",
              infoExpanded ? "items-start" : "items-center",
              infoExpanded ? "lg:gap-8" : "lg:gap-12"
            )}>
              
              {/* Modal card */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0, x: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  x: infoExpanded ? -40 : 0 
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn("border rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto flex-shrink-0",
                  isLight ? "bg-white border-black/10" : "bg-[#0d0d0d] border-white/10")}
              >
                <h2 className={cn("text-2xl font-bold mb-6", isLight ? "text-black" : "text-white")}>
                  {editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
                </h2>
                
                <div className="space-y-6">
                  {/* Nombre */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", 
                      isLight ? "text-black/40" : "text-white/40")}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={cn("w-full border rounded-xl px-4 py-3 outline-none transition-colors",
                        isLight 
                          ? "bg-gray-50 border-black/10 focus:border-orange-600 text-black" 
                          : "bg-white/5 border-white/10 focus:border-orange-600 text-white")}
                      placeholder="Ej: Meditar 10 minutos"
                      autoComplete="off"
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", 
                      isLight ? "text-black/40" : "text-white/40")}>
                      Categoría
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <button
                          key={key}
                          onClick={() => setFormData({ ...formData, category: key as any })}
                          className={cn(
                            "p-3 rounded-xl border transition-all flex items-center gap-2",
                            formData.category === key
                              ? "border-orange-600 bg-orange-600/20"
                              : isLight ? "border-black/10 hover:border-black/30" : "border-white/10 hover:border-white/30"
                          )}
                        >
                          <cat.icon size={16} className={cat.color} />
                          <span className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frecuencia */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", 
                      isLight ? "text-black/40" : "text-white/40")}>
                      Frecuencia
                    </label>
                    <div className="space-y-3">
                      <div className={cn("flex p-1 rounded-xl", isLight ? "bg-gray-100" : "bg-white/5")}>
                        {[
                          { key: 'daily', label: 'Diario' },
                          { key: 'weekly', label: 'Días específicos' },
                          { key: 'unique', label: 'Único' },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => setFormData({ ...formData, frequencyType: opt.key as any })}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                              formData.frequencyType === opt.key
                                ? "bg-orange-600 text-white"
                                : isLight ? "text-black/40 hover:text-black" : "text-white/40 hover:text-white"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Selector de días (semanal) */}
                      {formData.frequencyType === 'weekly' && (
                        <div className="flex gap-1 flex-wrap">
                          {WEEK_DAYS.map((day) => (
                            <button
                              key={day.value}
                              onClick={() => {
                                const current = formData.selectedDays;
                                const updated = current.includes(day.value)
                                  ? current.filter(d => d !== day.value)
                                  : [...current, day.value].sort();
                                setFormData({ ...formData, selectedDays: updated });
                              }}
                              className={cn(
                                "flex-1 py-2 rounded-lg text-xs font-bold transition-all min-w-[40px]",
                                formData.selectedDays.includes(day.value)
                                  ? "bg-orange-600 text-white"
                                  : isLight ? "bg-black/5 text-black/40 hover:bg-black/10" : "bg-white/5 text-white/40 hover:bg-white/10"
                              )}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Date picker (único) */}
                      {formData.frequencyType === 'unique' && (
                        <input
                          type="date"
                          value={formData.uniqueDate}
                          onChange={(e) => setFormData({ ...formData, uniqueDate: e.target.value })}
                          className={cn("w-full border rounded-xl px-4 py-3 outline-none",
                            isLight ? "bg-gray-50 border-black/10 text-black" : "bg-white/5 border-white/10 text-white")}
                        />
                      )}
                    </div>
                  </div>

                  {/* Hora de recordatorio */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", 
                      isLight ? "text-black/40" : "text-white/40")}>
                      <span className="flex items-center gap-2">
                        <Clock size={14} />
                        Hora de recordatorio (opcional)
                      </span>
                    </label>
                    <input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      className={cn("w-full border rounded-xl px-4 py-3 outline-none transition-colors",
                        isLight 
                          ? "bg-gray-50 border-black/10 focus:border-orange-600 text-black" 
                          : "bg-white/5 border-white/10 focus:border-orange-600 text-white")}
                    />
                    <p className={cn("text-xs mt-1", isLight ? "text-black/40" : "text-white/40")}>
                      Te notificaremos a esta hora para recordarte tu hábito
                    </p>
                  </div>

                  {/* Meta de racha */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", 
                      isLight ? "text-black/40" : "text-white/40")}>
                      Meta de racha (días)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="7"
                        max="100"
                        value={formData.targetStreak}
                        onChange={(e) => setFormData({ ...formData, targetStreak: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className={cn("w-12 text-right font-bold", isLight ? "text-black" : "text-white")}>
                        {formData.targetStreak}
                      </span>
                    </div>
                    <p className={cn("text-xs mt-1", isLight ? "text-black/40" : "text-white/40")}>
                      {formData.targetStreak >= 66 ? "Formación de hábito real (Gold)" :
                       formData.targetStreak >= 21 ? "Buen hábito (Silver)" :
                       formData.targetStreak >= 7 ? "Principiante (Bronze)" : "Inicio"}
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={closeModal}
                      className={cn("flex-1 py-3 rounded-xl font-bold transition-colors",
                        isLight ? "text-black/60 hover:bg-black/5" : "text-white/60 hover:bg-white/5")}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleCreateOrUpdateHabit}
                      disabled={!formData.name.trim()}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold transition-colors text-white"
                    >
                      {editingHabit ? 'Guardar Cambios' : 'Crear Hábito'}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Bloque informativo — a la derecha del modal */}
              <div
                className={cn(
                  "hidden lg:flex w-[440px] flex-shrink-0",
                  infoExpanded ? "pt-4 items-start" : "items-center"
                )}
              >
                <AnimatePresence mode="wait">
                  {!infoExpanded ? (
                    <motion.div
                      key="collapsed"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 self-center !text-white"
                    >
                      <p className="text-sm font-medium leading-relaxed opacity-90 !text-white">
                        "¿Se requieren mínimo 21 días para generar un hábito?"
                      </p>
                      <p className="text-xs opacity-50 !text-white">
                        — Phillippa Lally (University College London)
                      </p>
                      <button
                        onClick={() => setInfoExpanded(true)}
                        className="text-xs underline underline-offset-2 opacity-40 hover:opacity-100 transition-opacity mt-2 !text-white"
                      >
                        ver más…
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, x: 40, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="backdrop-blur-xl rounded-2xl p-6 space-y-4 text-sm leading-relaxed shadow-2xl bg-white/10 !text-white"
                    >
                      <div className="space-y-3 !text-white">
                        <p className="!text-white">
                          Este dato proviene de un estudio científico realizado por la psicóloga <strong>Phillippa Lally</strong> en University College London.
                        </p>
                        <p className="!text-white">
                          En la investigación, se analizó cuánto tiempo tardaban las personas en convertir una acción en algo automático (es decir, un hábito).
                        </p>
                        <p className="!text-white">
                          El resultado más citado es que el promedio fue de <strong>66 días</strong>, pero lo más importante es que:
                        </p>
                        <ul className="space-y-1.5 opacity-90 list-disc list-inside pl-1 !text-white">
                          <li>El tiempo real varía mucho entre personas</li>
                          <li>Puede tomar desde 18 hasta 254 días</li>
                          <li>No existe un número fijo para todos los hábitos</li>
                        </ul>
                        <p className="text-xs opacity-80 !text-white">
                          De hecho, la propia investigadora ha aclarado que decir "toma 66 días" fuera de contexto es una simplificación excesiva del estudio.
                        </p>
                        <p className="!text-white">
                          Esto desmonta el mito popular de los <strong>"21 días"</strong>, ya que no cuenta con base científica sólida.
                        </p>
                      </div>
                      
                      <a
                        href="https://www.surrey.ac.uk/news/does-it-really-take-66-days-form-habit-we-asked-expert-dr-pippa-lally"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 mt-4 backdrop-blur-md rounded-xl px-4 py-3 text-xs transition-all bg-white/10 hover:bg-white/20 !text-white"
                      >
                        <ExternalLink size={14} />
                        <span className="flex-1">Fuente: University of Surrey</span>
                      </a>

                      <button
                        onClick={() => setInfoExpanded(false)}
                        className="text-xs opacity-40 hover:opacity-80 transition-opacity w-full text-left !text-white"
                      >
                        ver menos
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Habits;
