//SERVER/ROUTES/USERS.TS
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const fmt = (r: Record<string, unknown>) => ({
  id: String(r.id), name: r.name, email: r.email,
  birthDate: r.birth_date,
  gender: r.gender,
  weight: r.weight,
  height: r.height,
  bodyGoal: r.body_goal,
  activityLevel: r.activity_level,
  currency: r.currency,
  monthlyIncome: r.monthly_income,
  gymTargetKcal: r.gym_target_kcal, restTargetKcal: r.rest_target_kcal,
  proteinTarget: r.protein_target, savingsGoal: r.savings_goal,
  emergencyFundGoal: r.emergency_fund_goal, mainGoal: r.main_goal, createdAt: r.created_at,
});

router.get("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase.from("users").select("*").eq("id", req.userId).single();
  if (error || !data) { res.status(404).json({ message: "Not found" }); return; }
  res.json(fmt(data));
});

router.put("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const {
    name, birthDate, gender, weight, height, bodyGoal, activityLevel,
    currency, monthlyIncome,
    gymTargetKcal, restTargetKcal, proteinTarget,
    savingsGoal, emergencyFundGoal, mainGoal
  } = req.body;

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (birthDate !== undefined) patch.birth_date = birthDate;
  if (gender !== undefined) patch.gender = gender;
  if (weight !== undefined) patch.weight = Number(weight);
  if (height !== undefined) patch.height = Number(height);
  if (bodyGoal !== undefined) patch.body_goal = bodyGoal;
  if (activityLevel !== undefined) patch.activity_level = activityLevel;
  if (currency !== undefined) patch.currency = currency;
  if (monthlyIncome !== undefined) patch.monthly_income = Number(monthlyIncome);
  if (gymTargetKcal !== undefined) patch.gym_target_kcal = gymTargetKcal;
  if (restTargetKcal !== undefined) patch.rest_target_kcal = restTargetKcal;
  if (proteinTarget !== undefined) patch.protein_target = proteinTarget;
  if (savingsGoal !== undefined) patch.savings_goal = savingsGoal;
  if (emergencyFundGoal !== undefined) patch.emergency_fund_goal = emergencyFundGoal;
  if (mainGoal !== undefined) patch.main_goal = mainGoal;

  const { data, error } = await supabase.from("users").update(patch).eq("id", req.userId).select().single();
  if (error || !data) { res.status(500).json({ message: error?.message || "Error" }); return; }
  res.json(fmt(data));
});

export default router;
