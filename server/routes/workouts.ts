import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Helpers
const fmtSession = (r: any) => ({
  id: String(r.id),
  userId: String(r.user_id),
  routineId: r.routine_id ? String(r.routine_id) : null,
  date: String(r.date),
  startedAt: r.started_at, // ISO string
  endedAt: r.ended_at,
  durationSeconds: r.duration_seconds,
  totalVolume: r.total_volume,
  notes: r.notes,
  status: r.ended_at ? 'completed' : 'active',
});

const fmtExercise = (r: any) => ({
  id: String(r.id),
  sessionId: String(r.session_id),
  exerciseName: r.name,
  targetSets: r.sets ? r.sets.length : 0,
  targetReps: r.sets?.[0]?.reps || 10,
  completedSets: r.sets || [],
  isCompleted: r.sets?.every((s: any) => s.completed) || false,
  orderIndex: r.id,
});

const fmtRoutine = (r: any) => ({
  id: String(r.id),
  userId: String(r.user_id),
  name: r.name,
  type: r.type,
  exercises: r.exercises || [],
  isActive: r.is_active,
});

// GET /workouts - Obtener sesiones del día o las últimas 10
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;

  let q = supabase
    .from("workout_sessions")
    .select("*, exercises(*)")
    .eq("user_id", req.userId);

  if (date) {
    q = q.eq("date", date as string);
  } else {
    q = q.order("date", { ascending: false }).limit(10);
  }

  if (req.query.status === "active") {
    q = q.is("ended_at", null);
  } else if (req.query.status === "completed") {
    q = q.not("ended_at", "is", null);
  }

  const { data, error } = await q;
  
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  // Formatear respuesta con ejercicios anidados
  const sessions = (data || []).map((s: any) => ({
    ...fmtSession(s),
    exercises: (s.exercises || []).map(fmtExercise).sort((a: any, b: any) => a.orderIndex - b.orderIndex),
  }));

  res.json(sessions);
});

// GET /workouts/routines - Obtener rutinas del usuario
router.get("/routines", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("workout_routines")
    .select("*")
    .eq("user_id", req.userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json((data || []).map(fmtRoutine));
});

// PUT /workouts/routines/:id - Actualizar rutina
router.put("/routines/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, type, exercises } = req.body;

  const { data, error } = await supabase
    .from("workout_routines")
    .update({ name, type, exercises })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json(fmtRoutine(data));
});

// DELETE /workouts/routines/:id - Eliminar rutina (soft delete)
router.delete("/routines/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabase
    .from("workout_routines")
    .update({ is_active: false })
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json({ ok: true });
});

// POST /workouts/routines - Crear nueva rutina
router.post("/routines", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, type, exercises } = req.body;
  
  const { data, error } = await supabase
    .from("workout_routines")
    .insert({ 
      user_id: req.userId, 
      name, 
      type: type || 'strength', 
      exercises: exercises || [] 
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json(fmtRoutine(data));
});

// POST /workouts - Iniciar nueva sesión (solo si no hay activa)
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { routineId, date, notes = "" } = req.body;

  // Verificar si ya hay sesión activa (sin ended_at) para este usuario
  const { data: activeSession } = await supabase
    .from("workout_sessions")
    .select("id, date")
    .eq("user_id", req.userId)
    .is("ended_at", null)
    .maybeSingle();

  if (activeSession) {
    res.status(400).json({
      message: `Ya tienes una sesión activa del día ${activeSession.date}. Finalízala antes de iniciar otra.`,
    });
    return;
  }

  // Obtener rutina para crear ejercicios
  const { data: routine } = await supabase
    .from("workout_routines")
    .select("*")
    .eq("id", routineId)
    .eq("user_id", req.userId)
    .single();

  if (!routine) {
    res.status(404).json({ message: "Rutina no encontrada" });
    return;
  }

  // Crear sesión
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: req.userId,
      routine_id: routineId,
      date,
      notes,
    })
    .select()
    .single();

  if (sessionError) {
    res.status(500).json({ message: sessionError.message });
    return;
  }

  // Crear ejercicios basados en la rutina
  const exercisesToInsert = routine.exercises.map((ex: any) => ({
    session_id: session.id,
    name: ex.name,
    sets: Array(ex.sets || 4).fill(null).map(() => ({
      reps: ex.reps || 10,
      weight: ex.baseWeight || 0,
      completed: false,
    })),
  }));

  const { data: exercises, error: exError } = await supabase
    .from("exercises")
    .insert(exercisesToInsert)
    .select();

  if (exError) {
    // Rollback: eliminar sesión
    await supabase.from("workout_sessions").delete().eq("id", session.id);
    res.status(500).json({ message: exError.message });
    return;
  }

  res.json({
    ...fmtSession(session),
    exercises: (exercises || []).map(fmtExercise),
  });
});

// PUT /workouts/:id/exercises/:exId - Actualizar ejercicio (completar serie)
router.put("/:id/exercises/:exId", requireAuth, async (req: AuthRequest, res: Response) => {
  const { completedSets } = req.body;

  const { data, error } = await supabase
    .from("exercises")
    .update({ sets: completedSets })
    .eq("id", req.params.exId)
    .eq("session_id", req.params.id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json(fmtExercise(data));
});

// POST /workouts/:id/finish - Finalizar sesión
router.post("/:id/finish", requireAuth, async (req: AuthRequest, res: Response) => {
  const { notes } = req.body;

  // Obtener sesión y ejercicios
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("*, exercises(*)")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .single();

  if (!session) {
    res.status(404).json({ message: "Sesión no encontrada" });
    return;
  }

  // Calcular volumen total y duración
  const now = new Date();
  const startedAt = new Date(session.started_at);
  const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
  
  let totalVolume = 0;
  const completedExercises: any[] = [];

  for (const ex of session.exercises || []) {
    const exVolume = (ex.sets || []).reduce((sum: number, set: any) => {
      if (set.completed) {
        return sum + (set.reps * set.weight);
      }
      return sum;
    }, 0);
    totalVolume += exVolume;

    const allCompleted = (ex.sets || []).every((s: any) => s.completed);
    if (allCompleted) {
      completedExercises.push({
        name: ex.name,
        maxWeight: Math.max(...(ex.sets || []).map((s: any) => s.weight || 0)),
      });
    }
  }

  // Actualizar sesión
  const { data: updatedSession, error } = await supabase
    .from("workout_sessions")
    .update({
      ended_at: now.toISOString(),
      duration_seconds: durationSeconds,
      total_volume: totalVolume,
      notes: notes || session.notes,
      status: 'completed',
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  // Actualizar pesos base si se superaron
  for (const ex of completedExercises) {
    if (ex.maxWeight > 0) {
      await supabase
        .from("exercise_baselines")
        .upsert({
          user_id: req.userId,
          exercise_name: ex.name,
          current_weight: ex.maxWeight,
          last_updated: new Date().toISOString().split('T')[0],
        }, { onConflict: 'user_id,exercise_name' });
    }
  }

  // Actualizar racha
  await updateGymStreak(req.userId!, session.date);

  res.json({
    ...fmtSession(updatedSession),
    message: "Sesión finalizada. Volumen total: " + totalVolume + " kg",
  });
});

// DELETE /workouts/:id - Cancelar sesión
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json({ ok: true });
});

// GET /workouts/stats - Estadísticas y racha
router.get("/stats", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: streak } = await supabase
    .from("gym_streaks")
    .select("*")
    .eq("user_id", req.userId)
    .maybeSingle();

  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("total_volume, date")
    .eq("user_id", req.userId)
    .order("date", { ascending: false })
    .limit(7);

  const totalVolume = recentSessions?.reduce((sum, s) => sum + (s.total_volume || 0), 0) || 0;

  res.json({
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    totalWorkouts: streak?.total_workouts || 0,
    lastWorkoutDate: streak?.last_workout_date,
    recentVolume: totalVolume,
  });
});

// Helper para actualizar racha
async function updateGymStreak(userId: number, workoutDate: string) {
  const { data: existing } = await supabase
    .from("gym_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const today = new Date(workoutDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = 1;
  let longestStreak = 1;

  if (existing) {
    const lastDate = existing.last_workout_date ? new Date(existing.last_workout_date) : null;
    
    if (lastDate) {
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutivo
        newStreak = existing.current_streak + 1;
      } else if (diffDays === 0) {
        // Mismo día, no actualizar streak
        newStreak = existing.current_streak;
      } else {
        // Se rompió la racha
        newStreak = 1;
      }
    }

    longestStreak = Math.max(newStreak, existing.longest_streak || 0);

    await supabase
      .from("gym_streaks")
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_workout_date: workoutDate,
        total_workouts: (existing.total_workouts || 0) + 1,
      })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("gym_streaks")
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_workout_date: workoutDate,
        total_workouts: 1,
      });
  }
}

export default router;