//SERVER/ROUTES/WORKOUTS.TS
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const fmt = (r: Record<string, unknown>) => ({
  id: String(r.id), userId: String(r.user_id), date: String(r.date),
  name: r.name, calories: Number(r.calories), protein: Number(r.protein),
  carbs: Number(r.carbs), fat: Number(r.fat), mealType: r.meal_type,
});

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const { data, error } = await supabase.from("meals").select("*").eq("user_id", req.userId).eq("date", date as string).order("created_at", { ascending: true });
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json((data || []).map(fmt));
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date, name, calories = 0, protein = 0, carbs = 0, fat = 0, mealType = "snack" } = req.body;
  const { data, error } = await supabase.from("meals").insert({ user_id: req.userId, date, name, calories, protein, carbs, fat, meal_type: mealType }).select().single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(fmt(data));
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabase.from("meals").delete().eq("id", req.params.id).eq("user_id", req.userId);
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ ok: true });
});

router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, calories, protein, carbs, fat, mealType } = req.body;
  const { data, error } = await supabase
    .from("meals")
    .update({ name, calories, protein, carbs, fat, meal_type: mealType })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select().single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(fmt(data));
});

export default router;
