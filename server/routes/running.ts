import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const fmtRun = (r: any) => ({
  id: String(r.id),
  userId: String(r.user_id),
  startedAt: r.started_at,
  endedAt: r.ended_at,
  date: r.date,
  durationSeconds: Number(r.duration_seconds || 0),
  distanceMeters: Number(r.distance_meters || 0),
  calories: Number(r.calories || 0),
  averagePaceSecondsPerKm: Number(r.average_pace_seconds_per_km || 0),
  route: Array.isArray(r.route) ? r.route : [],
  createdAt: r.created_at,
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit || 30), 100);

  const { data, error } = await supabase
    .from("running_sessions")
    .select("*")
    .eq("user_id", req.userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json((data || []).map(fmtRun));
});

router.get("/stats", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("running_sessions")
    .select("duration_seconds,distance_meters,calories,average_pace_seconds_per_km,started_at")
    .eq("user_id", req.userId)
    .order("started_at", { ascending: true });

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  const runs = data || [];
  const totalRuns = runs.length;
  const totalDistanceMeters = runs.reduce((sum, r) => sum + Number(r.distance_meters || 0), 0);
  const totalDurationSeconds = runs.reduce((sum, r) => sum + Number(r.duration_seconds || 0), 0);
  const totalCalories = runs.reduce((sum, r) => sum + Number(r.calories || 0), 0);
  const averagePaceSecondsPerKm =
    totalDistanceMeters > 0 ? totalDurationSeconds / (totalDistanceMeters / 1000) : 0;

  res.json({
    totalRuns,
    totalDistanceMeters,
    totalDurationSeconds,
    totalCalories,
    averagePaceSecondsPerKm,
    recentRuns: runs.slice(-7).reverse().map(fmtRun),
    distanceTrend: runs.slice(-10).map((r) => ({
      date: r.started_at,
      distanceMeters: Number(r.distance_meters || 0),
      durationSeconds: Number(r.duration_seconds || 0),
    })),
  });
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const {
    startedAt,
    endedAt,
    durationSeconds,
    distanceMeters,
    calories,
    averagePaceSecondsPerKm,
    route = [],
  } = req.body;

  if (!startedAt || !endedAt || !durationSeconds) {
    res.status(400).json({ message: "startedAt, endedAt y durationSeconds son requeridos" });
    return;
  }

  const started = new Date(startedAt);
  const safeRoute = Array.isArray(route)
    ? route
        .filter(
          (point) =>
            point &&
            typeof point.latitude === "number" &&
            typeof point.longitude === "number",
        )
        .slice(0, 5000)
    : [];

  const { data, error } = await supabase
    .from("running_sessions")
    .insert({
      user_id: req.userId,
      started_at: startedAt,
      ended_at: endedAt,
      date: started.toISOString().slice(0, 10),
      duration_seconds: Math.max(0, Math.round(Number(durationSeconds) || 0)),
      distance_meters: Math.max(0, Number(distanceMeters) || 0),
      calories: Math.max(0, Math.round(Number(calories) || 0)),
      average_pace_seconds_per_km: Math.max(0, Math.round(Number(averagePaceSecondsPerKm) || 0)),
      route: safeRoute,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.status(201).json(fmtRun(data));
});

export default router;
