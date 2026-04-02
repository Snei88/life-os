// server/routes/foodItems.ts
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("user_id", req.userId)
    .order("name");
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(data || []);
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, calories, protein, carbs, fat, serving_size } = req.body;
  const { data, error } = await supabase
    .from("food_items")
    .insert({ user_id: req.userId, name, calories, protein, carbs, fat, serving_size })
    .select().single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(data);
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabase
    .from("food_items")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ ok: true });
});

export default router;