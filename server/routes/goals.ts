// server/routes/goals.ts
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const fmt = (r: Record<string, unknown>) => ({
  id: String(r.id),
  userId: String(r.user_id),
  title: r.title,
  description: r.description,
  deadline: r.deadline ? String(r.deadline) : "",
  progress: r.progress,
  level: r.level,
  category: r.category || "Personal",
  priority: r.priority || "Media",
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: true });
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json((data || []).map(fmt));
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const {
    title,
    description = "",
    deadline,
    level,
    progress = 0,
    category = "Personal",
    priority = "Media",
  } = req.body;
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: req.userId,
      title,
      description,
      deadline: deadline || null,
      level,
      progress,
      category,
      priority,
    })
    .select()
    .single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(fmt(data));
});

router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { progress, title, description, deadline, level, category, priority } = req.body;
  const patch: Record<string, unknown> = {};
  if (progress !== undefined) patch.progress = progress;
  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;
  if (deadline !== undefined) patch.deadline = deadline || null;
  if (level !== undefined) patch.level = level;
  if (category !== undefined) patch.category = category;
  if (priority !== undefined) patch.priority = priority;

  const { data, error } = await supabase
    .from("goals")
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
    .from("goals")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ ok: true });
});

export default router;