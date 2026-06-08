import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireGptAuth, GptRequest } from "../middleware/gptAuth.js";

const router = Router();

const today = () => new Date().toISOString().split("T")[0];

const publicBaseUrl = () =>
  (process.env.PUBLIC_BASE_URL || "https://life-os-production-74f1.up.railway.app").replace(/\/$/, "");

const goalShape = (r: Record<string, unknown>) => ({
  id: String(r.id),
  title: r.title,
  description: r.description || "",
  deadline: r.deadline ? String(r.deadline) : "",
  progress: Number(r.progress || 0),
  level: r.level,
  category: r.category || "Personal",
  priority: r.priority || "Media",
});

const habitShape = (r: Record<string, unknown>) => ({
  id: String(r.id),
  name: r.name,
  icon: r.icon || "circle",
  color: r.color || "orange",
  frequency: r.frequency || { type: "daily" },
  category: r.category || "otros",
  targetStreak: r.target_streak || 21,
  isActive: r.is_active,
});

const txShape = (r: Record<string, unknown>) => ({
  id: String(r.id),
  date: String(r.date),
  type: r.type,
  category: r.category,
  amount: Number(r.amount),
  description: r.description || "",
});

router.get("/openapi.json", (_req, res) => {
  const baseUrl = publicBaseUrl();
  res.json({
    openapi: "3.1.0",
    info: {
      title: "Life OS GPT Actions",
      version: "1.0.0",
      description: "Acciones seguras para consultar y actualizar Life OS desde ChatGPT.",
    },
    servers: [{ url: `${baseUrl}/api/gpt` }],
    components: {
      securitySchemes: {
        lifeOsApiKey: {
          type: "http",
          scheme: "bearer",
          description: "API key configurada como Bearer token en el GPT Action.",
        },
      },
      schemas: {
        GoalInput: {
          type: "object",
          required: ["title", "level"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            deadline: { type: "string", format: "date" },
            level: { type: "string", enum: ["90d", "6m", "2y"] },
            progress: { type: "integer", minimum: 0, maximum: 100 },
            category: { type: "string" },
            priority: { type: "string", enum: ["Baja", "Media", "Alta"] },
          },
        },
        GoalPatch: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            deadline: { type: "string", format: "date" },
            level: { type: "string", enum: ["90d", "6m", "2y"] },
            progress: { type: "integer", minimum: 0, maximum: 100 },
            category: { type: "string" },
            priority: { type: "string", enum: ["Baja", "Media", "Alta"] },
          },
        },
        HabitInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            icon: { type: "string" },
            color: { type: "string" },
            category: { type: "string" },
            targetStreak: { type: "integer", minimum: 1 },
            frequency: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["daily", "weekly", "unique"] },
                days: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } },
                date: { type: "string", format: "date" },
              },
            },
          },
        },
        TransactionInput: {
          type: "object",
          required: ["date", "type", "category", "amount"],
          properties: {
            date: { type: "string", format: "date" },
            type: { type: "string", enum: ["income", "expense"] },
            category: { type: "string" },
            amount: { type: "number" },
            description: { type: "string" },
          },
        },
      },
    },
    security: [{ lifeOsApiKey: [] }],
    paths: {
      "/summary": {
        get: {
          operationId: "getLifeOsSummary",
          summary: "Obtiene resumen personal de Life OS",
          parameters: [
            { name: "date", in: "query", schema: { type: "string", format: "date" } },
            { name: "month", in: "query", schema: { type: "string", pattern: "^\\d{4}-\\d{2}$" } },
          ],
          responses: { "200": { description: "Resumen de perfil, metas, habitos, finanzas, nutricion y agua." } },
        },
      },
      "/goals": {
        get: {
          operationId: "listGoals",
          summary: "Lista metas",
          responses: { "200": { description: "Metas del usuario." } },
        },
        post: {
          operationId: "createGoal",
          summary: "Crea una meta",
          "x-openai-isConsequential": true,
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/GoalPatch" } } },
          },
          responses: { "200": { description: "Meta creada." } },
        },
      },
      "/goals/{id}": {
        patch: {
          operationId: "updateGoal",
          summary: "Actualiza una meta",
          "x-openai-isConsequential": true,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/GoalInput" } } },
          },
          responses: { "200": { description: "Meta actualizada." } },
        },
      },
      "/habits": {
        get: {
          operationId: "listHabits",
          summary: "Lista habitos activos",
          responses: { "200": { description: "Habitos activos." } },
        },
        post: {
          operationId: "createHabit",
          summary: "Crea un habito",
          "x-openai-isConsequential": true,
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/HabitInput" } } },
          },
          responses: { "200": { description: "Habito creado." } },
        },
      },
      "/habits/{habitId}/log": {
        post: {
          operationId: "logHabit",
          summary: "Marca o desmarca un habito para una fecha",
          "x-openai-isConsequential": true,
          parameters: [{ name: "habitId", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["date", "completed"],
                  properties: {
                    date: { type: "string", format: "date" },
                    completed: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Registro guardado." } },
        },
      },
      "/finance/transactions": {
        get: {
          operationId: "listTransactions",
          summary: "Lista transacciones financieras",
          parameters: [
            { name: "month", in: "query", schema: { type: "string", pattern: "^\\d{4}-\\d{2}$" } },
            { name: "year", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Transacciones." } },
        },
        post: {
          operationId: "createTransaction",
          summary: "Crea una transaccion financiera",
          "x-openai-isConsequential": true,
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/TransactionInput" } } },
          },
          responses: { "200": { description: "Transaccion creada." } },
        },
      },
      "/water": {
        post: {
          operationId: "setWater",
          summary: "Actualiza vasos de agua para una fecha",
          "x-openai-isConsequential": true,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["date", "glasses"],
                  properties: {
                    date: { type: "string", format: "date" },
                    glasses: { type: "integer", minimum: 0 },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Agua actualizada." } },
        },
      },
      "/journal": {
        post: {
          operationId: "saveJournal",
          summary: "Guarda entrada de diario mental",
          "x-openai-isConsequential": true,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["date"],
                  properties: {
                    date: { type: "string", format: "date" },
                    affirmation: { type: "string" },
                    journalText: { type: "string" },
                    gratitude: { type: "array", items: { type: "string" } },
                    reflection: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Diario guardado." } },
        },
      },
    },
  });
});

router.use(requireGptAuth);

router.get("/summary", async (req: GptRequest, res: Response) => {
  const date = String(req.query.date || today());
  const month = String(req.query.month || date.slice(0, 7));
  const [year, monthNumber] = month.split("-");
  const lastDay = new Date(Number(year), Number(monthNumber), 0).getDate();
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(lastDay).padStart(2, "0")}`;

  const [profile, goals, habits, water, meals, transactions] = await Promise.all([
    supabase.from("users").select("*").eq("id", req.userId).single(),
    supabase.from("goals").select("*").eq("user_id", req.userId).order("created_at", { ascending: true }),
    supabase.from("habits").select("*").eq("user_id", req.userId).eq("is_active", true),
    supabase.from("water_logs").select("*").eq("user_id", req.userId).eq("date", date).maybeSingle(),
    supabase.from("meals").select("*").eq("user_id", req.userId).eq("date", date),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", req.userId)
      .gte("date", monthStart)
      .lte("date", monthEnd),
  ]);

  if (profile.error || !profile.data) {
    res.status(404).json({ message: "Life OS user not found" });
    return;
  }

  const txs = transactions.data || [];
  const income = txs.filter((t) => t.type === "income").reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((acc, t) => acc + Number(t.amount), 0);
  const dayMeals = meals.data || [];

  res.json({
    date,
    month,
    profile: {
      name: profile.data.name,
      mainGoal: profile.data.main_goal || "",
      bodyGoal: profile.data.body_goal,
      calorieTarget: profile.data.calorie_target,
      proteinTarget: profile.data.protein_target,
      waterTargetLiters: profile.data.water_target_liters,
      financialPriority: profile.data.financial_priority,
    },
    goals: (goals.data || []).map(goalShape),
    habits: (habits.data || []).map(habitShape),
    water: { glasses: water.data?.glasses || 0 },
    nutrition: {
      meals: dayMeals,
      totals: {
        calories: dayMeals.reduce((acc, meal) => acc + Number(meal.calories || 0), 0),
        protein: dayMeals.reduce((acc, meal) => acc + Number(meal.protein || 0), 0),
        carbs: dayMeals.reduce((acc, meal) => acc + Number(meal.carbs || 0), 0),
        fat: dayMeals.reduce((acc, meal) => acc + Number(meal.fat || 0), 0),
      },
    },
    finance: {
      income,
      expense,
      balance: income - expense,
      transactions: txs.slice(0, 25).map(txShape),
    },
  });
});

router.get("/goals", async (req: GptRequest, res: Response) => {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: true });
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json((data || []).map(goalShape));
});

router.post("/goals", async (req: GptRequest, res: Response) => {
  const { title, description = "", deadline, level, progress = 0, category = "Personal", priority = "Media" } = req.body;
  if (!title || !level) {
    res.status(400).json({ message: "title and level are required" });
    return;
  }
  const { data, error } = await supabase
    .from("goals")
    .insert({ user_id: req.userId, title, description, deadline: deadline || null, level, progress, category, priority })
    .select()
    .single();
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json(goalShape(data));
});

router.patch("/goals/:id", async (req: GptRequest, res: Response) => {
  const allowed = ["title", "description", "deadline", "level", "progress", "category", "priority"];
  const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if ("deadline" in patch && !patch.deadline) patch.deadline = null;
  const { data, error } = await supabase
    .from("goals")
    .update(patch)
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select()
    .single();
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json(goalShape(data));
});

router.get("/habits", async (req: GptRequest, res: Response) => {
  const { data, error } = await supabase.from("habits").select("*").eq("user_id", req.userId).eq("is_active", true);
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json((data || []).map(habitShape));
});

router.post("/habits", async (req: GptRequest, res: Response) => {
  const { name, icon = "circle", color = "orange", frequency, category = "otros", targetStreak = 21 } = req.body;
  if (!name) {
    res.status(400).json({ message: "name is required" });
    return;
  }
  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: req.userId,
      name,
      icon,
      color,
      frequency: frequency || { type: "daily" },
      category,
      target_streak: targetStreak,
      target_days: frequency?.type === "weekly" ? frequency.days : [0, 1, 2, 3, 4, 5, 6],
    })
    .select()
    .single();
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json(habitShape(data));
});

router.post("/habits/:habitId/log", async (req: GptRequest, res: Response) => {
  const { date = today(), completed = true } = req.body;
  const { data: habit } = await supabase
    .from("habits")
    .select("id")
    .eq("id", req.params.habitId)
    .eq("user_id", req.userId)
    .single();
  if (!habit) {
    res.status(404).json({ message: "Habit not found" });
    return;
  }
  const { data, error } = await supabase
    .from("habit_logs")
    .upsert(
      { habit_id: Number(req.params.habitId), date, completed, completed_at: completed ? new Date().toISOString() : null },
      { onConflict: "habit_id,date" },
    )
    .select()
    .single();
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json({ id: String(data.id), habitId: String(data.habit_id), date: String(data.date), completed: data.completed });
});

router.get("/finance/transactions", async (req: GptRequest, res: Response) => {
  const { month, year } = req.query;
  let q = supabase.from("transactions").select("*").eq("user_id", req.userId).order("date", { ascending: false });
  if (month) {
    const [y, m] = String(month).split("-");
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    q = q.gte("date", `${y}-${m}-01`).lte("date", `${y}-${m}-${String(lastDay).padStart(2, "0")}`);
  } else if (year) {
    q = q.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);
  }
  const { data, error } = await q.limit(100);
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json((data || []).map(txShape));
});

router.post("/finance/transactions", async (req: GptRequest, res: Response) => {
  const { date, type, category, amount, description = "" } = req.body;
  if (!date || !type || !category || amount === undefined) {
    res.status(400).json({ message: "date, type, category and amount are required" });
    return;
  }
  const { data, error } = await supabase
    .from("transactions")
    .insert({ user_id: req.userId, date, type, category, amount: Number(amount), description })
    .select()
    .single();
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  if (category === "Ahorro" || category === "Fondo de Emergencia") {
    const increment = type === "income" ? Number(amount) : -Number(amount);
    await supabase.rpc("increment_emergency_fund", {
      user_id: req.userId,
      amount: increment,
    });
  }
  res.json(txShape(data));
});

router.post("/water", async (req: GptRequest, res: Response) => {
  const { date = today(), glasses } = req.body;
  if (glasses === undefined) {
    res.status(400).json({ message: "glasses is required" });
    return;
  }
  const { data, error } = await supabase
    .from("water_logs")
    .upsert({ user_id: req.userId, date, glasses: Number(glasses) }, { onConflict: "user_id,date" })
    .select()
    .single();
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json({ date: String(data.date), glasses: data.glasses });
});

router.post("/journal", async (req: GptRequest, res: Response) => {
  const { date = today(), affirmation = "", journalText = "", gratitude = [], reflection = "" } = req.body;
  const { data, error } = await supabase
    .from("journal_entries")
    .upsert({ user_id: req.userId, date, affirmation, journal_text: journalText, gratitude, reflection }, { onConflict: "user_id,date" })
    .select()
    .single();
  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }
  res.json({
    id: String(data.id),
    date: String(data.date),
    affirmation: data.affirmation,
    journalText: data.journal_text,
    gratitude: data.gratitude,
    reflection: data.reflection,
  });
});

export default router;
