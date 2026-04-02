// server/routes/nutritionRules.ts
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("nutrition_rules")
    .select("*")
    .eq("user_id", req.userId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(data || []);
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { rule } = req.body;
  const { data: existing } = await supabase
    .from("nutrition_rules")
    .select("sort_order")
    .eq("user_id", req.userId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const { data, error } = await supabase
    .from("nutrition_rules")
    .insert({ user_id: req.userId, rule, sort_order: nextOrder })
    .select().single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(data);
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabase
    .from("nutrition_rules")
    .update({ is_active: false })
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ ok: true });
});

// Ruta para editar meals (PUT que falta en el backend actual)
export default router;