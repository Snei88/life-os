// server/routes/habits.ts
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Helpers de formato
const fmtHabit = (r: any) => ({
  id: String(r.id),
  userId: String(r.user_id),
  name: r.name,
  icon: r.icon,
  color: r.color,
  frequency: r.frequency || { type: 'daily' },
  category: r.category || 'otros',
  targetStreak: r.target_streak || 21,
  isActive: r.is_active,
  createdAt: r.created_at,
});

const fmtLog = (r: any) => ({
  id: String(r.id),
  habitId: String(r.habit_id),
  date: String(r.date),
  completed: r.completed,
  completedAt: r.completed_at,
});

const fmtStreak = (r: any) => ({
  habitId: String(r.habit_id),
  current: r.current_streak,
  longest: r.longest_streak,
  lastDate: r.last_completed_date,
});

// Verificar si un hábito aplica hoy según su frecuencia
function appliesToday(frequency: any, date: Date = new Date()): boolean {
  if (!frequency) return true;
  
  const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes...
  const dateStr = date.toISOString().split('T')[0];
  
  switch (frequency.type) {
    case 'daily':
      return true;
    case 'weekly':
      return frequency.days?.includes(dayOfWeek) ?? true;
    case 'unique':
      return frequency.date === dateStr;
    default:
      return true;
  }
}

// Calcular racha desde logs
async function calculateStreak(habitId: number, frequency: any, userId: number): Promise<{current: number, longest: number, lastDate: string | null}> {
  const { data: logs } = await supabase
    .from("habit_logs")
    .select("date, completed")
    .eq("habit_id", habitId)
    .eq("completed", true)
    .order("date", { ascending: false });

  if (!logs || logs.length === 0) {
    return { current: 0, longest: 0, lastDate: null };
  }

  const dates = logs.map(l => l.date).sort();
  const uniqueDates = [...new Set(dates)];
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastCompleted = uniqueDates[uniqueDates.length - 1];

  if (frequency?.type === 'weekly') {
    // Para hábitos semanales, contar semanas consecutivas completadas
    const targetDaysPerWeek = frequency.days?.length || 7;
    const weeklyCompletions: Record<string, number> = {};
    
    dates.forEach(date => {
      const weekStart = getWeekStart(new Date(date));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyCompletions[weekKey] = (weeklyCompletions[weekKey] || 0) + 1;
    });

    const weeks = Object.keys(weeklyCompletions).sort().reverse();
    let prevWeek: Date | null = null;
    
    for (const weekStr of weeks) {
      const weekDate = new Date(weekStr);
      const completions = weeklyCompletions[weekStr];
      
      if (completions >= targetDaysPerWeek) {
        if (!prevWeek || isConsecutiveWeek(prevWeek, weekDate)) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
        prevWeek = weekDate;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 0;
        break;
      }
    }
  } else {
    // Para hábitos diarios o únicos: contar días consecutivos
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Verificar si la racha sigue activa (hoy o ayer completado)
    const lastDate = uniqueDates[uniqueDates.length - 1];
    const isStreakActive = lastDate === today || lastDate === yesterdayStr;

    // Calcular racha actual
    if (isStreakActive) {
      currentStreak = 1;
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const curr = new Date(uniqueDates[i + 1]);
        const prev = new Date(uniqueDates[i]);
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calcular racha más larga
    tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  }

  return { current: currentStreak, longest: longestStreak, lastDate: lastCompleted };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para lunes como inicio
  return new Date(d.setDate(diff));
}

function isConsecutiveWeek(date1: Date, date2: Date): boolean {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.abs(date1.getTime() - date2.getTime()) <= oneWeek + 86400000; // margen de 1 día
}

// GET /habits - Obtener hábitos con rachas calculadas
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", req.userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }

  // Calcular rachas para cada hábito
  const habitsWithStreaks = await Promise.all(
    (habits || []).map(async (h) => {
      const streak = await calculateStreak(h.id, h.frequency, req.userId!);
      return {
        ...fmtHabit(h),
        streak,
        appliesToday: appliesToday(h.frequency),
      };
    })
  );

  res.json(habitsWithStreaks);
});

// POST /habits - Crear hábito
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, icon = "circle", color = "orange", frequency, category = "otros", targetStreak = 21 } = req.body;
  
  const { data, error } = await supabase
    .from("habits")
    .insert({ 
      user_id: req.userId, 
      name, 
      icon, 
      color, 
      frequency: frequency || { type: 'daily' },
      category,
      target_streak: targetStreak,
      target_days: frequency?.type === 'weekly' ? frequency.days : [0,1,2,3,4,5,6]
    })
    .select()
    .single();
    
  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }

  res.json({ ...fmtHabit(data), streak: { current: 0, longest: 0, lastDate: null }, appliesToday: appliesToday(data.frequency) });
});

// DELETE /habits/:id
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
    
  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }
  
  res.json({ ok: true });
});

// GET /habits/logs - Obtener logs por fecha o rango
router.get("/logs", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date, startDate, endDate, habitId } = req.query;
  
  let q = supabase
    .from("habit_logs")
    .select("*, habits!inner(user_id)")
    .eq("habits.user_id", req.userId);

  if (habitId) q = q.eq("habit_id", habitId);
  if (date) q = q.eq("date", date);
  if (startDate && endDate) q = q.gte("date", startDate).lte("date", endDate);
  
  const { data, error } = await q.order("date", { ascending: false });
  
  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }
  
  res.json((data || []).map(fmtLog));
});

// POST /habits/logs - Registrar o actualizar log
router.post("/logs", requireAuth, async (req: AuthRequest, res: Response) => {
  const { habitId, date, completed } = req.body;
  const completedAt = completed ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("habit_logs")
    .upsert(
      { 
        habit_id: Number(habitId), 
        date, 
        completed,
        completed_at: completedAt
      }, 
      { onConflict: "habit_id,date" }
    )
    .select()
    .single();
    
  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }

  // Recalcular racha del hábito
  const { data: habit } = await supabase
    .from("habits")
    .select("frequency")
    .eq("id", habitId)
    .single();
    
  const streak = await calculateStreak(Number(habitId), habit?.frequency, req.userId!);
  
  // Actualizar cache de racha
  await supabase
    .from("habit_streaks")
    .upsert({
      habit_id: Number(habitId),
      user_id: req.userId,
      current_streak: streak.current,
      longest_streak: streak.longest,
      last_completed_date: streak.lastDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: "habit_id" });

  res.json({ ...fmtLog(data), streak });
});

// GET /habits/stats - Estadísticas globales y heatmap
router.get("/stats", requireAuth, async (req: AuthRequest, res: Response) => {
  const { year, month } = req.query;
  
  // Rango de fechas para consulta
  let startDate = `${year}-01-01`;
  let endDate = `${year}-12-31`;
  
  if (month) {
    const m = String(month).padStart(2, '0');
    startDate = `${year}-${m}-01`;
    endDate = `${year}-${m}-31`;
  }

  // Obtener IDs de hábitos del usuario
  const { data: userHabits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", req.userId);

  const habitIds = (userHabits ?? []).map((h: any) => h.id);

  // Obtener todos los logs del período
  const { data: logs } = habitIds.length > 0
    ? await supabase
        .from("habit_logs")
        .select("date, completed, habit_id")
        .eq("completed", true)
        .in("habit_id", habitIds)
        .gte("date", startDate)
        .lte("date", endDate)
    : { data: [] };

  // Agrupar por día para heatmap
  const dailyStats: Record<string, { total: number; completed: number }> = {};
  
  logs?.forEach((log: any) => {
    if (!dailyStats[log.date]) {
      dailyStats[log.date] = { total: 0, completed: 0 };
    }
    dailyStats[log.date].completed++;
  });

  // Contar hábitos activos por día (aplican ese día)
  const { data: habits } = await supabase
    .from("habits")
    .select("frequency, created_at")
    .eq("user_id", req.userId)
    .eq("is_active", true);

  // Para cada día del rango, calcular cuántos hábitos aplicaban
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (!dailyStats[dateStr]) dailyStats[dateStr] = { total: 0, completed: 0 };
    
    // Contar hábitos que aplicaban ese día
    const applicable = habits?.filter((h: any) => {
      if (new Date(h.created_at) > d) return false;
      return appliesToday(h.frequency, new Date(d));
    }).length || 0;
    
    dailyStats[dateStr].total = applicable;
  }

  // Rachas actuales
  const { data: streaks } = await supabase
    .from("habit_streaks")
    .select("current_streak")
    .eq("user_id", req.userId);

  const bestStreak = Math.max(...(streaks?.map((s: any) => s.current_streak) || [0]));

  res.json({
    dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
      percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    })),
    bestStreak,
    totalCompleted: logs?.length || 0,
  });
});

export default router;