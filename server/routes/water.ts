// server/routes/water.ts
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const { data } = await supabase
    .from("water_logs")
    .select("*")
    .eq("user_id", req.userId)
    .eq("date", date as string)
    .single();
  res.json({ glasses: data?.glasses || 0 });
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date, glasses } = req.body;
  const { data, error } = await supabase
    .from("water_logs")
    .upsert({ user_id: req.userId, date, glasses }, { onConflict: "user_id,date" })
    .select().single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json(data);
});

export default router;