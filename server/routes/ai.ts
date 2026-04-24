import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type CopilotAction =
  | {
      type: "create_habit";
      module: "habits";
      title: string;
      reason?: string;
      payload: {
        name: string;
        category?: string;
        color?: string;
        frequency?: { type: "daily" | "weekly" | "unique"; days?: number[]; date?: string };
        targetStreak?: number;
      };
    }
  | {
      type: "log_habit";
      module: "habits";
      title: string;
      reason?: string;
      payload: { habitId: string; date: string; completed: boolean };
    }
  | {
      type: "add_meal";
      module: "nutrition";
      title: string;
      reason?: string;
      payload: {
        date: string;
        name: string;
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        mealType?: "breakfast" | "lunch" | "dinner" | "snack";
      };
    }
  | {
      type: "set_water";
      module: "nutrition";
      title: string;
      reason?: string;
      payload: { date: string; glasses: number };
    }
  | {
      type: "add_nutrition_rule";
      module: "nutrition";
      title: string;
      reason?: string;
      payload: { rule: string };
    }
  | {
      type: "create_transaction";
      module: "finance";
      title: string;
      reason?: string;
      payload: {
        date: string;
        type: "income" | "expense";
        category: string;
        amount: number;
        description?: string;
      };
    }
  | {
      type: "update_emergency_fund";
      module: "finance";
      title: string;
      reason?: string;
      payload: { goal?: number; current?: number };
    }
  | {
      type: "create_goal";
      module: "goals";
      title: string;
      reason?: string;
      payload: {
        title: string;
        description?: string;
        deadline?: string;
        level?: "90d" | "6m" | "2y";
        category?: string;
        priority?: string;
        progress?: number;
      };
    }
  | {
      type: "update_goal_progress";
      module: "goals";
      title: string;
      reason?: string;
      payload: { goalId: string; progress: number };
    }
  | {
      type: "save_journal";
      module: "mindset";
      title: string;
      reason?: string;
      payload: {
        date: string;
        affirmation?: string;
        journalText?: string;
        gratitude?: string[];
        reflection?: string;
      };
    }
  | {
      type: "save_brian_tracy";
      module: "mindset";
      title: string;
      reason?: string;
      payload: { date: string; goal: string; completed?: boolean };
    }
  | {
      type: "create_schedule_event";
      module: "routine";
      title: string;
      reason?: string;
      payload: {
        dayOfWeek: number;
        time: string;
        endTime?: string;
        title: string;
        type?: string;
        color?: string;
        isFixed?: boolean;
        description?: string;
      };
    }
  | {
      type: "create_routine";
      module: "gym";
      title: string;
      reason?: string;
      payload: {
        name: string;
        type?: "strength" | "cardio" | "swimming";
        exercises: Array<{
          name: string;
          sets?: number;
          reps?: number;
          baseWeight?: number;
          restSeconds?: number;
        }>;
      };
    }
  | {
      type: "update_profile";
      module: "profile";
      title: string;
      reason?: string;
      payload: Record<string, unknown>;
    };

type CopilotInsight = {
  id: string;
  module: string;
  tone: "coach" | "warning" | "opportunity";
  title: string;
  summary: string;
};

type ParsedGroqPayload = {
  reply: string;
  insights?: CopilotInsight[];
  actions?: CopilotAction[];
};

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function clampText(value: unknown, max = 240) {
  if (typeof value !== "string") return "";
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function isGreetingOrCapabilityQuery(message: string) {
  const text = normalizeText(message);
  const friendlyKeywords = [
    "hola",
    "buenas",
    "hey",
    "hello",
    "holi",
    "como vas",
    "como estas",
    "saludos",
    "que haces",
    "que puede hacer",
    "que puedes hacer",
    "en que me puedes ayudar",
    "en que puedes ayudar",
    "ayuda",
    "quien eres",
    "gracias",
  ];

  return friendlyKeywords.some((keyword) => text.includes(keyword));
}

function isClearlyOutsideScope(message: string) {
  const text = normalizeText(message);
  const outsidePatterns = [
    "formula matemat",
    "ecuacion",
    "integral",
    "derivada",
    "matriz",
    "fisica cuantica",
    "quimica organica",
    "programame un juego",
    "escribeme codigo",
    "capital de",
    "traduce al ingles",
    "poema",
    "cancion",
    "astrologia",
    "horoscopo",
  ];

  return outsidePatterns.some((pattern) => text.includes(pattern));
}

function buildScopeReply() {
  return {
    reply:
      "Solo respondo temas relacionados con Life OS: habitos, nutricion, gym, finanzas, rutina, metas, mindset, perfil y crecimiento personal dentro del sistema. No atiendo preguntas fuera de ese contexto.",
    insights: [
      {
        id: "scope-guard",
        module: "dashboard",
        tone: "warning" as const,
        title: "Consulta fuera de contexto",
        summary: "Conecta la pregunta con tus 8 modulos o con una mejora dentro de Life OS.",
      },
    ],
    actions: [],
  };
}

function buildFriendlyReply() {
  return {
    reply:
      "Puedo ayudarte a leer tus datos, detectar patrones entre tus modulos, proponerte mejoras y ejecutar cambios reales dentro de Life OS. Por ejemplo: habitos, nutricion, gym, finanzas, rutina, metas, mindset y perfil.",
    insights: [
      {
        id: "friendly-help",
        module: "dashboard",
        tone: "opportunity" as const,
        title: "Asistencia disponible",
        summary: "Puedes pedirme diagnosticos, mejoras para hoy, acciones automaticas, ajustes por modulo o cambios concretos dentro del sistema.",
      },
    ],
    actions: [],
  };
}

async function getUserContext(userId: number) {
  const today = todayDate();
  const last14 = new Date();
  last14.setDate(last14.getDate() - 14);
  const last60 = new Date();
  last60.setDate(last60.getDate() - 60);
  const start14 = last14.toISOString().split("T")[0];
  const start60 = last60.toISOString().split("T")[0];

  const [
    profileRes,
    habitsRes,
    habitLogsRes,
    mealsRes,
    txRes,
    goalsRes,
    scheduleRes,
    routinesRes,
    sessionsRes,
    waterRes,
    nutritionRulesRes,
    journalRes,
    brianRes,
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase.from("habits").select("*").eq("user_id", userId).eq("is_active", true),
    supabase.from("habit_logs").select("habit_id, date, completed").gte("date", start14),
    supabase.from("meals").select("*").eq("user_id", userId).gte("date", start14).order("date", { ascending: false }),
    supabase.from("transactions").select("*").eq("user_id", userId).gte("date", start60).order("date", { ascending: false }),
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("schedule_events").select("*").eq("user_id", userId).order("day_of_week", { ascending: true }).order("time", { ascending: true }),
    supabase.from("workout_routines").select("*").eq("user_id", userId).eq("is_active", true),
    supabase.from("workout_sessions").select("*").eq("user_id", userId).gte("date", start14).order("date", { ascending: false }),
    supabase.from("water_logs").select("*").eq("user_id", userId).gte("date", start14).order("date", { ascending: false }),
    supabase.from("nutrition_rules").select("*").eq("user_id", userId).eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("journal_entries").select("*").eq("user_id", userId).gte("date", start14).order("date", { ascending: false }),
    supabase.from("brian_tracy_logs").select("*").eq("user_id", userId).gte("date", start14).order("date", { ascending: false }),
  ]);

  const habits = habitsRes.data || [];
  const habitIds = habits.map((habit: any) => habit.id);
  const habitLogs = (habitLogsRes.data || []).filter((log: any) => habitIds.includes(log.habit_id));
  const meals = mealsRes.data || [];
  const transactions = txRes.data || [];
  const goals = goalsRes.data || [];
  const schedule = scheduleRes.data || [];
  const routines = routinesRes.data || [];
  const sessions = sessionsRes.data || [];
  const water = waterRes.data || [];
  const nutritionRules = nutritionRulesRes.data || [];
  const journal = journalRes.data || [];
  const brian = brianRes.data || [];

  const todayMeals = meals.filter((meal: any) => meal.date === today);
  const todayCalories = todayMeals.reduce((sum: number, meal: any) => sum + Number(meal.calories || 0), 0);
  const todayProtein = todayMeals.reduce((sum: number, meal: any) => sum + Number(meal.protein || 0), 0);
  const completedToday = habitLogs.filter((log: any) => log.date === today && log.completed).length;
  const currentMonth = today.slice(0, 7);
  const monthTx = transactions.filter((tx: any) => String(tx.date).startsWith(currentMonth));
  const income = monthTx.filter((tx: any) => tx.type === "income").reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  const expense = monthTx.filter((tx: any) => tx.type === "expense").reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
  const activeGoals = goals.filter((goal: any) => Number(goal.progress || 0) < 100);
  const lastWorkout = sessions[0]?.date || null;
  const lastJournal = journal[0]?.date || null;
  const waterToday = water.find((entry: any) => entry.date === today)?.glasses || 0;

  return {
    generatedAt: new Date().toISOString(),
    today,
    profile: profileRes.data
      ? {
          name: profileRes.data.name,
          mainGoal: profileRes.data.main_goal,
          monthlyIncome: profileRes.data.monthly_income,
          gymTargetKcal: profileRes.data.gym_target_kcal,
          proteinTarget: profileRes.data.protein_target,
          savingsGoal: profileRes.data.savings_goal,
          emergencyFundGoal: profileRes.data.emergency_fund_goal,
          currency: profileRes.data.currency || "COP",
        }
      : null,
    summary: {
      habitsToday: { completed: completedToday, total: habits.length },
      nutritionToday: { calories: todayCalories, protein: todayProtein, meals: todayMeals.length, water: waterToday },
      financeMonth: { income, expense, balance: income - expense },
      goals: { total: goals.length, active: activeGoals.length },
      mindset: { journalEntries14d: journal.length, brianEntries14d: brian.length, lastJournal },
      gym: { sessions14d: sessions.length, routines: routines.length, lastWorkout },
      routine: { events: schedule.length },
    },
    raw: {
      habits: habits.slice(0, 12).map((habit: any) => ({
        id: String(habit.id),
        name: habit.name,
        category: habit.category,
        frequency: habit.frequency,
        targetStreak: habit.target_streak,
      })),
      meals: meals.slice(0, 8).map((meal: any) => ({
        id: String(meal.id),
        date: meal.date,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
      })),
      transactions: transactions.slice(0, 10).map((tx: any) => ({
        id: String(tx.id),
        date: tx.date,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        description: clampText(tx.description, 80),
      })),
      goals: goals.slice(0, 8).map((goal: any) => ({
        id: String(goal.id),
        title: goal.title,
        progress: goal.progress,
        deadline: goal.deadline,
        category: goal.category,
        priority: goal.priority,
      })),
      schedule: schedule.slice(0, 10).map((event: any) => ({
        id: String(event.id),
        dayOfWeek: event.day_of_week,
        time: event.time,
        title: event.title,
        type: event.type,
      })),
      routines: routines.slice(0, 6).map((routine: any) => ({
        id: String(routine.id),
        name: routine.name,
        type: routine.type,
        exercises: Array.isArray(routine.exercises) ? routine.exercises.slice(0, 5) : [],
      })),
      nutritionRules: nutritionRules.slice(0, 8).map((rule: any) => ({
        id: String(rule.id),
        rule: rule.rule,
      })),
      journal: journal.slice(0, 4).map((entry: any) => ({
        id: String(entry.id),
        date: entry.date,
        affirmation: clampText(entry.affirmation, 80),
        reflection: clampText(entry.reflection, 100),
      })),
    },
  };
}

function buildFallbackInsights(context: Awaited<ReturnType<typeof getUserContext>>): CopilotInsight[] {
  const insights: CopilotInsight[] = [];
  const calories = context.summary.nutritionToday.calories;
  const target = Number(context.profile?.gymTargetKcal || 0);
  const balance = context.summary.financeMonth.balance;
  const habits = context.summary.habitsToday;

  if (habits.total > 0 && habits.completed < habits.total) {
    insights.push({
      id: "habits-gap",
      module: "habits",
      tone: "warning",
      title: "Disciplina incompleta hoy",
      summary: `Llevas ${habits.completed} de ${habits.total} habitos. Conviene reducir friccion o reagendar los mas fallados.`,
    });
  }

  if (target > 0 && calories < target * 0.7) {
    insights.push({
      id: "nutrition-gap",
      module: "nutrition",
      tone: "warning",
      title: "Nutricion por debajo del objetivo",
      summary: `Hoy vas en ${calories} kcal frente a una meta de ${target}. Una comida simple o snack alto en proteina ayudaria.`,
    });
  }

  if (balance < 0) {
    insights.push({
      id: "finance-gap",
      module: "finance",
      tone: "warning",
      title: "Mes en rojo",
      summary: "Tus gastos del mes ya superan los ingresos. Conviene recortar y fijar un plan visible de ahorro.",
    });
  }

  if (context.summary.gym.sessions14d === 0) {
    insights.push({
      id: "gym-gap",
      module: "gym",
      tone: "coach",
      title: "Tu sistema fisico no tiene traccion reciente",
      summary: "No hay entrenamientos recientes. Tiene sentido crear una rutina minima y ubicarla en agenda.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "system-ok",
      module: "dashboard",
      tone: "opportunity",
      title: "Sistema estable",
      summary: "Tu base esta relativamente ordenada. Este es el momento para optimizar, no para apagar incendios.",
    });
  }

  return insights.slice(0, 4);
}

function sanitizeAction(action: any): CopilotAction | null {
  if (!action || typeof action !== "object" || typeof action.type !== "string" || typeof action.module !== "string") {
    return null;
  }

  return {
    type: action.type,
    module: action.module,
    title: typeof action.title === "string" ? action.title : "Accion sugerida",
    reason: typeof action.reason === "string" ? action.reason : "",
    payload: action.payload && typeof action.payload === "object" ? action.payload : {},
  } as CopilotAction;
}

function extractJsonBlock(input: string) {
  const direct = input.trim();
  const stripped = direct.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return stripped.slice(start, end + 1);
}

function tryParseGroqPayload(content: unknown): ParsedGroqPayload | null {
  const raw =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((item: any) => (typeof item?.text === "string" ? item.text : "")).join("\n")
        : "";

  if (!raw) return null;

  const candidates = [raw.trim(), extractJsonBlock(raw)];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed.reply === "string") {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function buildFallbackReply(context: Awaited<ReturnType<typeof getUserContext>>, latestMessage: string) {
  const latest = normalizeText(latestMessage);
  const parts: string[] = [];
  const { habitsToday, nutritionToday, financeMonth, goals, gym } = context.summary;
  const target = Number(context.profile?.gymTargetKcal || 0);

  if (!latestMessage.trim()) {
    return {
      reply: "Ya revise tu sistema. Si quieres, te doy un diagnostico, te digo tu modulo mas debil o te propongo cambios automaticos para hoy.",
      insights: buildFallbackInsights(context),
      actions: [],
    };
  }

  if (isGreetingOrCapabilityQuery(latestMessage)) {
    return {
      reply:
        "Puedo analizar tus datos, detectar patrones entre modulos, proponerte mejoras para hoy y ejecutar cambios reales en habitos, nutricion, gym, finanzas, rutina, metas, mindset y perfil. Si quieres, empiezo con un diagnostico general o con el modulo que mas te preocupe.",
      insights: buildFallbackInsights(context),
      actions: [],
    };
  }

  if (latest.includes("mejora") || latest.includes("automatic") || latest.includes("hoy")) {
    const actions: CopilotAction[] = [];
    if (habitsToday.total > 0 && habitsToday.completed < habitsToday.total) {
      actions.push({
        type: "create_goal",
        module: "goals",
        title: "Crear meta de consistencia semanal",
        reason: "Tus habitos de hoy estan flojos y conviene volver la disciplina visible.",
        payload: {
          title: "Subir consistencia de habitos esta semana",
          description: "Meta sugerida por la IA para ordenar tu ejecucion diaria.",
          level: "90d",
          category: "Personal",
          priority: "Alta",
          progress: 0,
        },
      });
    }
    if (nutritionToday.meals === 0) {
      actions.push({
        type: "add_meal",
        module: "nutrition",
        title: "Agregar comida base para hoy",
        reason: "No hay comidas registradas y eso apaga el modulo nutricional.",
        payload: {
          date: context.today,
          name: "Comida base sugerida por IA",
          calories: 550,
          protein: 35,
          carbs: 55,
          fat: 18,
          mealType: "lunch",
        },
      });
    }
    if (financeMonth.balance < 0) {
      actions.push({
        type: "create_goal",
        module: "goals",
        title: "Crear meta de control de gastos",
        reason: "Tu balance mensual necesita una correccion visible.",
        payload: {
          title: "Recuperar balance financiero del mes",
          description: "Meta automatica sugerida para corregir el desorden financiero.",
          level: "90d",
          category: "Financiero",
          priority: "Alta",
          progress: 0,
        },
      });
    }

    return {
      reply:
        "Estas son las mejoras automaticas que tienen mas sentido hoy: reforzar disciplina, reactivar nutricion y volver visible cualquier desorden financiero. Te deje acciones concretas para aplicarlas desde el sistema.",
      insights: buildFallbackInsights(context),
      actions: actions.slice(0, 4),
    };
  }

  if (latest.includes("patron") || latest.includes("analiza") || latest.includes("diagnost")) {
    if (habitsToday.total > 0 && habitsToday.completed < habitsToday.total) {
      parts.push(`estas dejando habitos incompletos (${habitsToday.completed}/${habitsToday.total})`);
    }
    if (nutritionToday.meals === 0 || (target > 0 && nutritionToday.calories < target * 0.7)) {
      parts.push(`tu nutricion va corta hoy (${nutritionToday.calories} kcal)`);
    }
    if (financeMonth.balance < 0) {
      parts.push(`este mes vas en balance negativo (${financeMonth.balance})`);
    }
    if (gym.sessions14d === 0) {
      parts.push("tu sistema fisico no tiene traccion reciente");
    }
    if (goals.active > 0) {
      parts.push(`tienes ${goals.active} metas activas que conviene aterrizar a ejecucion semanal`);
    }
  }

  if (parts.length === 0) {
    parts.push("tu sistema necesita mas acciones conectadas entre modulos para corregirte el rumbo con mas fuerza");
  }

  const actions: CopilotAction[] = [];
  if (habitsToday.total === 0) {
    actions.push({
      type: "create_habit",
      module: "habits",
      title: "Crear habito base de disciplina",
      reason: "Tu sistema necesita un ancla diaria visible.",
      payload: {
        name: "Planificar el dia",
        category: "productividad",
        color: "orange",
        frequency: { type: "daily" },
        targetStreak: 21,
      },
    });
  }
  if (nutritionToday.meals === 0) {
    actions.push({
      type: "add_meal",
      module: "nutrition",
      title: "Agregar snack proteico sugerido",
      reason: "No hay comida registrada hoy y eso rompe el analisis nutricional.",
      payload: {
        date: context.today,
        name: "Snack proteico sugerido",
        calories: 320,
        protein: 28,
        carbs: 24,
        fat: 10,
        mealType: "snack",
      },
    });
  }
  if (financeMonth.balance < 0) {
    actions.push({
      type: "create_goal",
      module: "goals",
      title: "Crear meta de recorte financiero",
      reason: "Tu balance mensual va en rojo y conviene volverlo visible.",
      payload: {
        title: "Reducir gastos impulsivos este mes",
        description: "Meta sugerida por la IA para recuperar balance mensual.",
        level: "90d",
        category: "Financiero",
        priority: "Alta",
        progress: 0,
      },
    });
  }

  return {
    reply: `Veo este patron principal: ${parts.join(", ")}. Eso indica que Life OS ya esta capturando senales, pero todavia no te esta corrigiendo el rumbo con suficiente intensidad. Te deje insights concretos y acciones que puedo aplicar dentro de los modulos.`,
    insights: buildFallbackInsights(context),
    actions: actions.slice(0, 4),
  };
}

async function callGroq(messages: ChatMessage[], context: Awaited<ReturnType<typeof getUserContext>>) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const system = `
Eres Life OS Copilot, una IA integrada al sistema del usuario.
Tu unico dominio de trabajo es Life OS.

Alcance permitido:
- habitos
- nutricion
- gym
- finanzas
- rutina
- metas
- mindset
- perfil
- crecimiento personal dentro del sistema Life OS

Reglas:
- Si el usuario pregunta algo fuera de ese alcance, rechaza la consulta con una frase corta y deja claro que solo trabajas dentro de Life OS.
- Responde en espanol.
- Analiza el contexto real del usuario y detecta patrones cruzados.
- Usa learningMemory para adaptar sugerencias segun acciones aceptadas, pospuestas o descartadas anteriormente.
- Se concreto: patron, consecuencia, mejora.
- Si propones acciones, deben ser seguras y ejecutables dentro del sistema.
- Devuelve JSON puro con esta forma:
{
  "reply": "mensaje conversacional",
  "insights": [
    { "id": "string", "module": "habits|nutrition|gym|finance|routine|goals|mindset|profile|dashboard", "tone": "coach|warning|opportunity", "title": "string", "summary": "string" }
  ],
  "actions": [
    {
      "type": "create_habit|log_habit|add_meal|set_water|add_nutrition_rule|create_transaction|update_emergency_fund|create_goal|update_goal_progress|save_journal|save_brian_tracy|create_schedule_event|create_routine|update_profile",
      "module": "habits|nutrition|gym|finance|routine|goals|mindset|profile",
      "title": "string",
      "reason": "string",
      "payload": {}
    }
  ]
}
- Maximo 4 insights y 4 actions.
`.trim();

  const payload = {
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    temperature: 0.3,
    messages: [
      { role: "system", content: system },
      { role: "system", content: `Contexto del usuario:\n${JSON.stringify(context)}` },
      ...messages,
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq error: ${response.status} ${text}`);
    }

    const data = await response.json();
    return tryParseGroqPayload(data?.choices?.[0]?.message?.content);
  } finally {
    clearTimeout(timeout);
  }
}

async function executeAction(userId: number, action: CopilotAction) {
  switch (action.type) {
    case "create_habit": {
      const payload = action.payload;
      const { data, error } = await supabase
        .from("habits")
        .insert({
          user_id: userId,
          name: payload.name,
          category: payload.category || "otros",
          color: payload.color || "orange",
          frequency: payload.frequency || { type: "daily" },
          target_streak: payload.targetStreak || 21,
          target_days: payload.frequency?.type === "weekly" ? payload.frequency.days : [0, 1, 2, 3, 4, 5, 6],
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "log_habit": {
      const { data, error } = await supabase
        .from("habit_logs")
        .upsert(
          {
            habit_id: Number(action.payload.habitId),
            date: action.payload.date,
            completed: action.payload.completed,
            completed_at: action.payload.completed ? new Date().toISOString() : null,
          },
          { onConflict: "habit_id,date" },
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "add_meal": {
      const { data, error } = await supabase
        .from("meals")
        .insert({
          user_id: userId,
          date: action.payload.date,
          name: action.payload.name,
          calories: Number(action.payload.calories || 0),
          protein: Number(action.payload.protein || 0),
          carbs: Number(action.payload.carbs || 0),
          fat: Number(action.payload.fat || 0),
          meal_type: action.payload.mealType || "snack",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "set_water": {
      const { data, error } = await supabase
        .from("water_logs")
        .upsert(
          {
            user_id: userId,
            date: action.payload.date,
            glasses: Number(action.payload.glasses || 0),
          },
          { onConflict: "user_id,date" },
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "add_nutrition_rule": {
      const { data: lastRule } = await supabase
        .from("nutrition_rules")
        .select("sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data, error } = await supabase
        .from("nutrition_rules")
        .insert({
          user_id: userId,
          rule: action.payload.rule,
          is_active: true,
          sort_order: Number(lastRule?.sort_order || 0) + 1,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "create_transaction": {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          date: action.payload.date,
          type: action.payload.type,
          category: action.payload.category,
          amount: Number(action.payload.amount),
          description: action.payload.description || "",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "update_emergency_fund": {
      const patch: Record<string, unknown> = {};
      if (action.payload.goal !== undefined) patch.emergency_fund_goal = Number(action.payload.goal);
      if (action.payload.current !== undefined) patch.emergency_fund_current = Number(action.payload.current);
      const { data, error } = await supabase.from("users").update(patch).eq("id", userId).select().single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "create_goal": {
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          title: action.payload.title,
          description: action.payload.description || "",
          deadline: action.payload.deadline || null,
          level: action.payload.level || "90d",
          category: action.payload.category || "Personal",
          priority: action.payload.priority || "Media",
          progress: action.payload.progress || 0,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "update_goal_progress": {
      const { data, error } = await supabase
        .from("goals")
        .update({ progress: Number(action.payload.progress) })
        .eq("id", action.payload.goalId)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "save_journal": {
      const { data, error } = await supabase
        .from("journal_entries")
        .upsert(
          {
            user_id: userId,
            date: action.payload.date,
            affirmation: action.payload.affirmation || "",
            journal_text: action.payload.journalText || "",
            gratitude: action.payload.gratitude || [],
            reflection: action.payload.reflection || "",
          },
          { onConflict: "user_id,date" },
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "save_brian_tracy": {
      const { data, error } = await supabase
        .from("brian_tracy_logs")
        .upsert(
          {
            user_id: userId,
            date: action.payload.date,
            goal: action.payload.goal,
            completed: Boolean(action.payload.completed),
          },
          { onConflict: "user_id,date" },
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "create_schedule_event": {
      const { data, error } = await supabase
        .from("schedule_events")
        .insert({
          user_id: userId,
          day_of_week: Number(action.payload.dayOfWeek),
          time: action.payload.time,
          end_time: action.payload.endTime || null,
          title: action.payload.title,
          type: action.payload.type || "bloque",
          color: action.payload.color || "blue",
          is_fixed: action.payload.isFixed ?? true,
          description: action.payload.description || "",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "create_routine": {
      const { data, error } = await supabase
        .from("workout_routines")
        .insert({
          user_id: userId,
          name: action.payload.name,
          type: action.payload.type || "strength",
          exercises: action.payload.exercises || [],
          is_active: true,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    case "update_profile": {
      const { data, error } = await supabase.from("users").update(action.payload).eq("id", userId).select().single();
      if (error) throw new Error(error.message);
      return { ok: true, entity: data };
    }
    default:
      throw new Error("Accion no soportada");
  }
}

router.post("/chat", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const activeTab = typeof req.body?.activeTab === "string" ? req.body.activeTab : "dashboard";
    const learningMemory = req.body?.learningMemory && typeof req.body.learningMemory === "object" ? req.body.learningMemory : {};
    const messages: ChatMessage[] = incomingMessages
      .filter((message: any) => message && typeof message.role === "string" && typeof message.content === "string")
      .map((message: any) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: String(message.content).slice(0, 2000),
      }));

    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
    if (latestUserMessage && isClearlyOutsideScope(latestUserMessage)) {
      res.json(buildScopeReply());
      return;
    }

    if (latestUserMessage && isGreetingOrCapabilityQuery(latestUserMessage)) {
      res.json(buildFriendlyReply());
      return;
    }

    const context = await getUserContext(req.userId!);
    const enhancedContext = {
      ...context,
      activeTab,
      learningMemory,
    };
    let aiPayload: ParsedGroqPayload | null = null;

    try {
      aiPayload = await callGroq(
        messages.length > 0
          ? messages
          : [{ role: "user", content: `Analiza mi sistema en la vista ${activeTab} y dame un diagnostico corto con acciones ejecutables.` }],
        enhancedContext,
      );
    } catch (error) {
      console.error("AI chat error", error);
    }

    const fallback = buildFallbackReply(enhancedContext, latestUserMessage);
    const insights = Array.isArray(aiPayload?.insights)
      ? aiPayload.insights.slice(0, 4).map((insight: any, index: number) => ({
          id: typeof insight.id === "string" ? insight.id : `insight-${index}`,
          module: typeof insight.module === "string" ? insight.module : "dashboard",
          tone: insight.tone === "warning" || insight.tone === "opportunity" ? insight.tone : "coach",
          title: clampText(insight.title || "Insight", 80),
          summary: clampText(insight.summary || "", 220),
        }))
      : fallback.insights;

    const actions = Array.isArray(aiPayload?.actions)
      ? aiPayload.actions.map(sanitizeAction).filter(Boolean).slice(0, 4)
      : fallback.actions;

    const reply = typeof aiPayload?.reply === "string" && aiPayload.reply.trim() ? aiPayload.reply.trim() : fallback.reply;

    res.json({
      reply,
      insights,
      actions,
      contextSummary: context.summary,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "No fue posible generar la respuesta del copiloto" });
  }
});

router.post("/execute", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const action = sanitizeAction(req.body?.action);
    if (!action) {
      res.status(400).json({ message: "Accion invalida" });
      return;
    }

    const result = await executeAction(req.userId!, action);
    res.json({
      ok: true,
      action,
      result,
      message: action.reason || `${action.title} aplicada correctamente.`,
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "No fue posible ejecutar la accion" });
  }
});

export default router;
