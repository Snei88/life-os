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

const scheduleShape = (r: Record<string, unknown>) => ({
  id: String(r.id),
  dayOfWeek: r.day_of_week,
  time: r.time,
  endTime: r.end_time || "",
  title: r.title,
  type: r.type,
  color: r.color,
  isFixed: r.is_fixed,
  description: r.description || "",
});

const routineShape = (r: Record<string, unknown>) => ({
  id: String(r.id),
  name: r.name,
  type: r.type,
  exercises: r.exercises || [],
  isActive: r.is_active,
});

const profileFieldMap: Record<string, string> = {
  name: "name",
  age: "age",
  birthDate: "birth_date",
  gender: "gender",
  weight: "weight",
  height: "height",
  bodyGoal: "body_goal",
  activityLevel: "activity_level",
  calorieTarget: "calorie_target",
  waterTargetLiters: "water_target_liters",
  monthlyIncome: "monthly_income",
  monthlyExpenses: "monthly_expenses",
  currentSavings: "current_savings",
  debtType: "debt_type",
  debtBalance: "debt_balance",
  debtMonthlyPayment: "debt_monthly_payment",
  financialGoal: "financial_goal",
  financialGoalCost: "financial_goal_cost",
  financialGoalMonthlySaving: "financial_goal_monthly_saving",
  financialGoalHorizon: "financial_goal_horizon",
  riskProfile: "risk_profile",
  sleepBedtime: "sleep_bedtime",
  sleepWakeTime: "sleep_wake_time",
  workType: "work_type",
  workStartTime: "work_start_time",
  workEndTime: "work_end_time",
  workDays: "work_days",
  workoutTimePreference: "workout_time_preference",
  dailyFreeTime: "daily_free_time",
  gymTargetKcal: "gym_target_kcal",
  restTargetKcal: "rest_target_kcal",
  proteinTarget: "protein_target",
  savingsGoal: "savings_goal",
  emergencyFundGoal: "emergency_fund_goal",
  mainGoal: "main_goal",
};

const buildProfilePatch = (profile: Record<string, unknown> = {}) =>
  Object.fromEntries(
    Object.entries(profile)
      .filter(([key, value]) => profileFieldMap[key] && value !== undefined)
      .map(([key, value]) => [profileFieldMap[key], value]),
  );

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
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "Enviar el valor como Bearer <LIFEOS_GPT_API_KEY>.",
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
        ScheduleInput: {
          type: "object",
          required: ["dayOfWeek", "time", "title"],
          properties: {
            dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
            time: { type: "string", example: "07:00" },
            endTime: { type: "string", example: "08:00" },
            title: { type: "string" },
            type: { type: "string", example: "gym" },
            color: { type: "string", example: "blue" },
            isFixed: { type: "boolean" },
            description: { type: "string" },
          },
        },
        WorkoutRoutineInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            type: { type: "string", example: "strength" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  sets: { type: "integer", minimum: 1 },
                  reps: { type: "integer", minimum: 1 },
                  baseWeight: { type: "number", minimum: 0 },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        LifeProfileInput: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "integer" },
            birthDate: { type: "string", format: "date" },
            gender: { type: "string" },
            weight: { type: "number" },
            height: { type: "number" },
            bodyGoal: { type: "string", enum: ["lose_fat", "recomp", "gain_muscle"] },
            activityLevel: { type: "string", enum: ["sedentary", "moderate", "active", "very_active"] },
            calorieTarget: { type: "integer" },
            proteinTarget: { type: "integer" },
            waterTargetLiters: { type: "number" },
            monthlyIncome: { type: "number" },
            monthlyExpenses: { type: "number" },
            currentSavings: { type: "number" },
            debtType: { type: "string" },
            debtBalance: { type: "number" },
            debtMonthlyPayment: { type: "number" },
            financialGoal: { type: "string" },
            financialGoalCost: { type: "number" },
            financialGoalMonthlySaving: { type: "number" },
            financialGoalHorizon: { type: "string" },
            riskProfile: { type: "string" },
            sleepBedtime: { type: "string", example: "22:30" },
            sleepWakeTime: { type: "string", example: "06:30" },
            workType: { type: "string" },
            workStartTime: { type: "string", example: "08:00" },
            workEndTime: { type: "string", example: "17:00" },
            workDays: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } },
            workoutTimePreference: { type: "string" },
            dailyFreeTime: { type: "string" },
            gymTargetKcal: { type: "integer" },
            restTargetKcal: { type: "integer" },
            savingsGoal: { type: "integer" },
            emergencyFundGoal: { type: "number" },
            mainGoal: { type: "string" },
          },
        },
        LifeSetupInput: {
          type: "object",
          properties: {
            sourceSummary: {
              type: "string",
              description: "Resumen breve de la informacion que ChatGPT uso para proponer esta configuracion.",
            },
            profile: { $ref: "#/components/schemas/LifeProfileInput" },
            goals: { type: "array", items: { $ref: "#/components/schemas/GoalInput" } },
            habits: { type: "array", items: { $ref: "#/components/schemas/HabitInput" } },
            schedule: { type: "array", items: { $ref: "#/components/schemas/ScheduleInput" } },
            nutritionRules: { type: "array", items: { type: "string" } },
            workoutRoutines: { type: "array", items: { $ref: "#/components/schemas/WorkoutRoutineInput" } },
            mindset: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                affirmation: { type: "string" },
                journalText: { type: "string" },
                gratitude: { type: "array", items: { type: "string" } },
                reflection: { type: "string" },
                brianTracyGoal: { type: "string" },
              },
            },
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
      "/life-setup": {
        post: {
          operationId: "applyLifeSetup",
          summary: "Guarda una configuracion inicial o redisenada de Life OS",
          description:
            "Usa esta accion despues de que el usuario confirme un plan integral basado en lo que ChatGPT conoce de el.",
          "x-openai-isConsequential": true,
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LifeSetupInput" } } },
          },
          responses: {
            "200": {
              description:
                "Perfil actualizado y elementos creados: metas, habitos, horario, reglas de nutricion, rutinas y mindset.",
            },
          },
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
            content: { "application/json": { schema: { $ref: "#/components/schemas/GoalInput" } } },
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
            content: { "application/json": { schema: { $ref: "#/components/schemas/GoalPatch" } } },
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

router.post("/life-setup", async (req: GptRequest, res: Response) => {
  const {
    sourceSummary = "",
    profile = {},
    goals = [],
    habits = [],
    schedule = [],
    nutritionRules = [],
    workoutRoutines = [],
    mindset,
  } = req.body;

  const result: Record<string, unknown> = {
    sourceSummary,
    updatedProfile: null,
    createdGoals: [],
    createdHabits: [],
    createdSchedule: [],
    createdNutritionRules: [],
    createdWorkoutRoutines: [],
    savedMindset: null,
  };

  const profilePatch = buildProfilePatch(profile);
  if (Object.keys(profilePatch).length > 0) {
    const { data, error } = await supabase
      .from("users")
      .update(profilePatch)
      .eq("id", req.userId)
      .select("id, name, main_goal, body_goal, activity_level, calorie_target, protein_target, water_target_liters")
      .single();
    if (error) {
      res.status(500).json({ message: error.message, step: "profile" });
      return;
    }
    result.updatedProfile = {
      id: String(data.id),
      name: data.name,
      mainGoal: data.main_goal || "",
      bodyGoal: data.body_goal,
      activityLevel: data.activity_level,
      calorieTarget: data.calorie_target,
      proteinTarget: data.protein_target,
      waterTargetLiters: data.water_target_liters,
    };
  }

  if (Array.isArray(goals) && goals.length > 0) {
    const rows = goals
      .filter((goal: any) => goal?.title && goal?.level)
      .map((goal: any) => ({
        user_id: req.userId,
        title: goal.title,
        description: goal.description || "",
        deadline: goal.deadline || null,
        level: goal.level,
        progress: goal.progress ?? 0,
        category: goal.category || "Personal",
        priority: goal.priority || "Media",
      }));
    if (rows.length > 0) {
      const { data, error } = await supabase.from("goals").insert(rows).select();
      if (error) {
        res.status(500).json({ message: error.message, step: "goals" });
        return;
      }
      result.createdGoals = (data || []).map(goalShape);
    }
  }

  if (Array.isArray(habits) && habits.length > 0) {
    const rows = habits
      .filter((habit: any) => habit?.name)
      .map((habit: any) => ({
        user_id: req.userId,
        name: habit.name,
        icon: habit.icon || "circle",
        color: habit.color || "orange",
        frequency: habit.frequency || { type: "daily" },
        category: habit.category || "otros",
        target_streak: habit.targetStreak || 21,
        target_days: habit.frequency?.type === "weekly" ? habit.frequency.days : [0, 1, 2, 3, 4, 5, 6],
      }));
    if (rows.length > 0) {
      const { data, error } = await supabase.from("habits").insert(rows).select();
      if (error) {
        res.status(500).json({ message: error.message, step: "habits" });
        return;
      }
      result.createdHabits = (data || []).map(habitShape);
    }
  }

  if (Array.isArray(schedule) && schedule.length > 0) {
    const rows = schedule
      .filter((event: any) => event?.title && event?.time && event?.dayOfWeek !== undefined)
      .map((event: any) => ({
        user_id: req.userId,
        day_of_week: Number(event.dayOfWeek),
        time: event.time,
        end_time: event.endTime || null,
        title: event.title,
        type: event.type || "vida",
        color: event.color || "blue",
        is_fixed: event.isFixed ?? true,
        description: event.description || "",
      }));
    if (rows.length > 0) {
      const { data, error } = await supabase.from("schedule_events").insert(rows).select();
      if (error) {
        res.status(500).json({ message: error.message, step: "schedule" });
        return;
      }
      result.createdSchedule = (data || []).map(scheduleShape);
    }
  }

  if (Array.isArray(nutritionRules) && nutritionRules.length > 0) {
    const { data: existing } = await supabase
      .from("nutrition_rules")
      .select("sort_order")
      .eq("user_id", req.userId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const startOrder = (existing?.[0]?.sort_order ?? -1) + 1;
    const rows = nutritionRules
      .filter((rule: unknown) => typeof rule === "string" && rule.trim())
      .map((rule: string, index: number) => ({
        user_id: req.userId,
        rule: rule.trim(),
        sort_order: startOrder + index,
      }));
    if (rows.length > 0) {
      const { data, error } = await supabase.from("nutrition_rules").insert(rows).select();
      if (error) {
        res.status(500).json({ message: error.message, step: "nutritionRules" });
        return;
      }
      result.createdNutritionRules = data || [];
    }
  }

  if (Array.isArray(workoutRoutines) && workoutRoutines.length > 0) {
    const rows = workoutRoutines
      .filter((routine: any) => routine?.name)
      .map((routine: any) => ({
        user_id: req.userId,
        name: routine.name,
        type: routine.type || "strength",
        exercises: routine.exercises || [],
      }));
    if (rows.length > 0) {
      const { data, error } = await supabase.from("workout_routines").insert(rows).select();
      if (error) {
        res.status(500).json({ message: error.message, step: "workoutRoutines" });
        return;
      }
      result.createdWorkoutRoutines = (data || []).map(routineShape);
    }
  }

  if (mindset && typeof mindset === "object") {
    const date = mindset.date || today();
    const { data, error } = await supabase
      .from("journal_entries")
      .upsert(
        {
          user_id: req.userId,
          date,
          affirmation: mindset.affirmation || "",
          journal_text: mindset.journalText || "",
          gratitude: Array.isArray(mindset.gratitude) ? mindset.gratitude : [],
          reflection: mindset.reflection || "",
        },
        { onConflict: "user_id,date" },
      )
      .select()
      .single();
    if (error) {
      res.status(500).json({ message: error.message, step: "mindsetJournal" });
      return;
    }

    let brianTracy = null;
    if (mindset.brianTracyGoal) {
      const { data: tracyData, error: tracyError } = await supabase
        .from("brian_tracy_logs")
        .upsert(
          { user_id: req.userId, date, goal: mindset.brianTracyGoal, completed: false },
          { onConflict: "user_id,date" },
        )
        .select()
        .single();
      if (tracyError) {
        res.status(500).json({ message: tracyError.message, step: "brianTracy" });
        return;
      }
      brianTracy = { id: String(tracyData.id), date: String(tracyData.date), goal: tracyData.goal };
    }

    result.savedMindset = {
      journal: {
        id: String(data.id),
        date: String(data.date),
        affirmation: data.affirmation,
        journalText: data.journal_text,
        gratitude: data.gratitude,
        reflection: data.reflection,
      },
      brianTracy,
    };
  }

  res.json({
    ok: true,
    counts: {
      goals: (result.createdGoals as unknown[]).length,
      habits: (result.createdHabits as unknown[]).length,
      schedule: (result.createdSchedule as unknown[]).length,
      nutritionRules: (result.createdNutritionRules as unknown[]).length,
      workoutRoutines: (result.createdWorkoutRoutines as unknown[]).length,
      mindset: result.savedMindset ? 1 : 0,
      profile: result.updatedProfile ? 1 : 0,
    },
    result,
  });
});

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
