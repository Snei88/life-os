import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const fmt = (r: Record<string, unknown>) => ({
  id: String(r.id), 
  userId: String(r.user_id), 
  date: String(r.date),
  type: r.type, 
  category: r.category, 
  amount: Number(r.amount), 
  description: r.description,
  createdAt: r.created_at,
});

// GET /finance - Listar transacciones con filtros opcionales
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { month, year, startDate, endDate } = req.query;
  
  let q = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", req.userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  // Filtro por mes específico (YYYY-MM)
  if (month) {
    const [y, m] = (month as string).split('-');
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    const start = `${y}-${m}-01`;
    const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    q = q.gte("date", start).lte("date", end);
  }
  
  // Filtro por año
  if (year) {
    q = q.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
  }

  // Rango de fechas personalizado
  if (startDate && endDate) {
    q = q.gte("date", startDate as string).lte("date", endDate as string);
  }

  const { data, error } = await q;
  
  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }
  
  res.json((data || []).map(fmt));
});

// GET /finance/stats - Estadísticas calculadas
router.get("/stats", requireAuth, async (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  
  // Base query para transacciones del período
  let baseQuery = supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", req.userId);
  
  if (month) {
    const [y, m] = (month as string).split('-');
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    baseQuery = baseQuery.gte("date", `${y}-${m}-01`).lte("date", `${y}-${m}-${String(lastDay).padStart(2, '0')}`);
  } else if (year) {
    baseQuery = baseQuery.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
  }

  const { data: txs, error } = await baseQuery;
  
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  const income = txs?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const expense = txs?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
  const balance = income - expense;
  const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

  // Calcular fondo de emergencia (suma de transacciones categoría "Ahorro" + fondo manual)
  const { data: userData } = await supabase
    .from("users")
    .select("emergency_fund_current, emergency_fund_goal")
    .eq("id", req.userId)
    .single();

  // Datos históricos para gráfica (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const { data: history } = await supabase
    .from("transactions")
    .select("date, type, amount")
    .eq("user_id", req.userId)
    .gte("date", sixMonthsAgo.toISOString().split('T')[0])
    .order("date", { ascending: true });

  // Agrupar por mes
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  history?.forEach((t: any) => {
    const monthKey = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0 };
    if (t.type === 'income') monthlyData[monthKey].income += Number(t.amount);
    else monthlyData[monthKey].expense += Number(t.amount);
  });

  res.json({
    income,
    expense,
    balance,
    savingsRate: Number(savingsRate),
    emergencyFund: {
      current: userData?.emergency_fund_current || 0,
      goal: userData?.emergency_fund_goal || 5000000,
    },
    monthlyHistory: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    })).slice(-6),
  });
});

// POST /finance - Crear transacción
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date, type, category, amount, description = "" } = req.body;
  
  const { data, error } = await supabase
    .from("transactions")
    .insert({ 
      user_id: req.userId, 
      date, 
      type, 
      category, 
      amount: Number(amount), 
      description 
    })
    .select()
    .single();
    
  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }

  // Si es categoría "Ahorro", actualizar fondo de emergencia automáticamente
  if (category === "Ahorro" || category === "Fondo de Emergencia") {
    const increment = type === 'income' ? Number(amount) : -Number(amount);
    await supabase.rpc('increment_emergency_fund', {
      user_id: req.userId,
      amount: increment,
    });
  }
  
  res.json(fmt(data));
});

// PUT /finance/:id - Actualizar transacción
router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { date, type, category, amount, description } = req.body;
  
  // Obtener transacción anterior para revertir cálculo de emergencia fund si aplica
  const { data: oldTx } = await supabase
    .from("transactions")
    .select("category, type, amount")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .single();

  const { data, error } = await supabase
    .from("transactions")
    .update({ date, type, category, amount: Number(amount), description })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();
    
  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }

  // Recalcular fondo de emergencia si cambió una transacción de ahorro
  if (oldTx?.category === "Ahorro" || category === "Ahorro") {
    // Recalcular todo el fondo desde cero (más seguro que incrementos/descuentos)
    const { data: savingsTxs } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", req.userId)
      .eq("category", "Ahorro");
    
    const totalSavings = savingsTxs?.reduce((acc, t) => {
      return acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    }, 0) || 0;

    await supabase
      .from("users")
      .update({ emergency_fund_current: Math.max(0, totalSavings) })
      .eq("id", req.userId);
  }
  
  res.json(fmt(data));
});

// DELETE /finance/:id - Eliminar transacción
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  // Verificar si es ahorro para recalcular después
  const { data: tx } = await supabase
    .from("transactions")
    .select("category, type, amount")
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .single();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId);
    
  if (error) { 
    res.status(500).json({ message: error.message }); 
    return; 
  }

  // Recalcular fondo si era ahorro
  if (tx?.category === "Ahorro") {
    const { data: savingsTxs } = await supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", req.userId)
      .eq("category", "Ahorro");
    
    const totalSavings = savingsTxs?.reduce((acc, t) => {
      return acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    }, 0) || 0;

    await supabase
      .from("users")
      .update({ emergency_fund_current: Math.max(0, totalSavings) })
      .eq("id", req.userId);
  }
  
  res.json({ ok: true });
});

// PUT /finance/emergency-goal - Actualizar meta de emergencia
router.put("/emergency-goal", requireAuth, async (req: AuthRequest, res: Response) => {
  const { goal, current } = req.body;
  
  const updates: any = {};
  if (goal !== undefined) updates.emergency_fund_goal = Number(goal);
  if (current !== undefined) updates.emergency_fund_current = Number(current);
  
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", req.userId)
    .select("emergency_fund_goal, emergency_fund_current")
    .single();
    
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  
  res.json({
    goal: data.emergency_fund_goal,
    current: data.emergency_fund_current,
  });
});

export default router;