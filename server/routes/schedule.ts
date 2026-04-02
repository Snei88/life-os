// server/routes/schedule.ts
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const fmt = (r: Record<string, unknown>) => ({
  id: String(r.id),
  userId: String(r.user_id),
  dayOfWeek: r.day_of_week,
  time: r.time,
  endTime: r.end_time || "",
  title: r.title,
  type: r.type,
  color: r.color,
  isFixed: r.is_fixed,
  description: r.description || "",
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("schedule_events")
    .select("*")
    .eq("user_id", req.userId)
    .order("day_of_week", { ascending: true })
    .order("time", { ascending: true });
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json((data || []).map(fmt));
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { dayOfWeek, time, endTime = "", title, type = "clase", color = "blue", isFixed = true, description = "" } = req.body;
  const { data, error } = await supabase
    .from("schedule_events")
    .insert({
      user_id: req.userId,
      day_of_week: dayOfWeek,
      time,
      end_time: endTime || null,
      title,
      type,
      color,
      is_fixed: isFixed,
      description,
    })
    .select()
    .single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(fmt(data));
});

router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { dayOfWeek, time, endTime, title, type, color, isFixed, description } = req.body;
  const patch: Record<string, unknown> = {};
  if (dayOfWeek !== undefined) patch.day_of_week = dayOfWeek;
  if (time !== undefined) patch.time = time;
  if (endTime !== undefined) patch.end_time = endTime || null;
  if (title !== undefined) patch.title = title;
  if (type !== undefined) patch.type = type;
  if (color !== undefined) patch.color = color;
  if (isFixed !== undefined) patch.is_fixed = isFixed;
  if (description !== undefined) patch.description = description;

  const { data, error } = await supabase
    .from("schedule_events")
    .update(patch)
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(fmt(data));
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabase
    .from("schedule_events")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ ok: true });
});

export default router;