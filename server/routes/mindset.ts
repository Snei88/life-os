//SERVER/ROUTES/MINDSET.TS
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/journal", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const { data } = await supabase.from("journal_entries").select("*").eq("user_id", req.userId).eq("date", date as string).maybeSingle();
  if (!data) { res.json(null); return; }
  res.json({ id: String(data.id), userId: String(data.user_id), date: String(data.date), affirmation: data.affirmation, journalText: data.journal_text, gratitude: data.gratitude, reflection: data.reflection });
});

router.post("/journal", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date, affirmation = "", journalText = "", gratitude = [], reflection = "" } = req.body;
  const { data, error } = await supabase.from("journal_entries").upsert(
    { user_id: req.userId, date, affirmation, journal_text: journalText, gratitude, reflection },
    { onConflict: "user_id,date" }
  ).select().single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ id: String(data.id), userId: String(data.user_id), date: String(data.date), affirmation: data.affirmation, journalText: data.journal_text, gratitude: data.gratitude, reflection: data.reflection });
});

router.get("/brian-tracy", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const { data } = await supabase.from("brian_tracy_logs").select("*").eq("user_id", req.userId).eq("date", date as string).maybeSingle();
  if (!data) { res.json(null); return; }
  res.json({ id: String(data.id), userId: String(data.user_id), date: String(data.date), goal: data.goal, completed: data.completed });
});

router.post("/brian-tracy", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date, goal = "", completed = false } = req.body;
  const { data, error } = await supabase.from("brian_tracy_logs").upsert(
    { user_id: req.userId, date, goal, completed },
    { onConflict: "user_id,date" }
  ).select().single();
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json({ id: String(data.id), userId: String(data.user_id), date: String(data.date), goal: data.goal, completed: data.completed });
});

// --- Historial completo ---
router.get("/journal/all", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", req.userId)
    .order("date", { ascending: false });
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json((data || []).map((r) => ({
    id: String(r.id), userId: String(r.user_id), date: String(r.date),
    affirmation: r.affirmation, journalText: r.journal_text,
    gratitude: r.gratitude, reflection: r.reflection,
  })));
});

router.get("/brian-tracy/all", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from("brian_tracy_logs")
    .select("*")
    .eq("user_id", req.userId)
    .order("date", { ascending: false });
  if (error) { res.status(500).json({ message: error.message }); return; }
  res.json((data || []).map((r) => ({
    id: String(r.id), userId: String(r.user_id), date: String(r.date),
    goal: r.goal, completed: r.completed,
  })));
});

export default router;
