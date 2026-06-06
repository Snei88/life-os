// server/routes/nutrition.ts (nuevo archivo o agregar a existente)
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /nutrition/meals/dates - Fechas únicas con registros
router.get("/meals/dates", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Try RPC first; if it fails (UUID vs int mismatch), use direct query
    const { data, error } = await supabase.rpc('get_meal_dates', {
      p_user_id: req.userId
    });

    if (!error && data) {
      res.json(data);
      return;
    }

    // Fallback: direct query
    const { data: meals, error: mealsError } = await supabase
      .from("meals")
      .select("date")
      .eq("user_id", req.userId)
      .order("date", { ascending: true });

    if (!mealsError && meals) {
      const uniqueDates = [...new Set(meals.map((m: any) => m.date))].filter(Boolean);
      res.json(uniqueDates);
      return;
    }

    // Both queries failed — return empty array silently
    res.json([]);
  } catch {
    res.json([]);
  }
});

// GET /nutrition/meals?date=YYYY-MM-DD
router.get("/meals", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  
  let query = supabase
    .from("meals")
    .select("*")
    .eq("user_id", req.userId);
    
  if (date) {
    query = query.eq("date", date);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  
  res.json(data || []);
});

// POST /nutrition/meals
router.post("/meals", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, calories, protein, carbs, fat, mealType, date } = req.body;
  
  const { data, error } = await supabase
    .from("meals")
    .insert({
      user_id: req.userId,
      name,
      calories,
      protein,
      carbs,
      fat,
      meal_type: mealType,
      date: date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();
    
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  
  res.json(data);
});

// PUT /nutrition/meals/:id
router.put("/meals/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, calories, protein, carbs, fat, mealType, date } = req.body;
  
  const { data, error } = await supabase
    .from("meals")
    .update({ 
      name, 
      calories, 
      protein, 
      carbs, 
      fat, 
      meal_type: mealType,
      date,
      updated_at: new Date().toISOString()
    })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();
    
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  
  res.json(data);
});

// DELETE /nutrition/meals/:id
router.delete("/meals/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { error } = await supabase
    .from("meals")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
    
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  
  res.json({ ok: true });
});

export default router;