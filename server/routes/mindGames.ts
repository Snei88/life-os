import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const fmtScore = (r: any) => ({
  id: String(r.id),
  userId: String(r.user_id),
  gameKey: r.game_key,
  result: r.result,
  score: Number(r.score || 0),
  durationSeconds: Number(r.duration_seconds || 0),
  moves: Number(r.moves || 0),
  difficulty: r.difficulty || "normal",
  metadata: r.metadata || {},
  playedAt: r.played_at,
  createdAt: r.created_at,
});

router.get("/scores", requireAuth, async (req: AuthRequest, res: Response) => {
  const gameKey = typeof req.query.gameKey === "string" ? req.query.gameKey : null;
  const limit = Math.min(Number(req.query.limit || 20), 100);

  let q = supabase
    .from("mind_game_scores")
    .select("*")
    .eq("user_id", req.userId)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (gameKey) q = q.eq("game_key", gameKey);

  const { data, error } = await q;
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json((data || []).map(fmtScore));
});

router.post("/scores", requireAuth, async (req: AuthRequest, res: Response) => {
  const {
    gameKey,
    result,
    score = 0,
    durationSeconds = 0,
    moves = 0,
    difficulty = "normal",
    metadata = {},
    playedAt = new Date().toISOString(),
  } = req.body;

  if (!gameKey || !result) {
    res.status(400).json({ message: "gameKey y result son requeridos" });
    return;
  }

  const { data, error } = await supabase
    .from("mind_game_scores")
    .insert({
      user_id: req.userId,
      game_key: String(gameKey),
      result: String(result),
      score: Math.max(0, Math.round(Number(score) || 0)),
      duration_seconds: Math.max(0, Math.round(Number(durationSeconds) || 0)),
      moves: Math.max(0, Math.round(Number(moves) || 0)),
      difficulty: String(difficulty || "normal"),
      metadata: metadata && typeof metadata === "object" ? metadata : {},
      played_at: playedAt,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.status(201).json(fmtScore(data));
});

export default router;
