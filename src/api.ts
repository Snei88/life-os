// src/api.ts
import { FoodItem, NutritionRule, Meal, Habit } from "./types.js";
const BASE = "/api";

function getToken() {
  return localStorage.getItem("lifeos_token");
}

async function request(method: string, path: string, body?: unknown) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

const get = (path: string) => request("GET", path);
const post = (path: string, body: unknown) => request("POST", path, body);
const put = (path: string, body: unknown) => request("PUT", path, body);
const del = (path: string) => request("DELETE", path);

export const api = {
  // Auth mejorado
  login: (email: string, password: string) =>
    post("/auth/login", { email, password }),

  register: (data: { name: string; email: string; password: string }) =>
    post("/auth/register", data),

  forgotPassword: (email: string) =>
    post("/auth/forgot-password", { email }),

  resetPasswordConfirm: (token: string, newPassword: string) =>
    post("/auth/reset-password-confirm", { token, newPassword }),

  me: () => get("/auth/me"),

  // Profile
  getProfile: () => get("/users/profile"),
  updateProfile: (data: Record<string, unknown>) => put("/users/profile", data),

  // Habits mejorados
  getHabits: () => get("/habits"),
  
  addHabit: (data: {
    name: string;
    icon?: string;
    color?: string;
    frequency?: { type: string; days?: number[]; date?: string };
    category?: string;
    targetStreak?: number;
    reminderTime?: string; // formato "HH:MM"
  }) => post("/habits", data),

  updateHabit: (id: string, data: {
    name?: string;
    icon?: string;
    color?: string;
    frequency?: { type: string; days?: number[]; date?: string };
    category?: string;
    targetStreak?: number;
    reminderTime?: string;
    isActive?: boolean;
  }) => put(`/habits/${id}`, data),

  deleteHabit: (id: string) => del(`/habits/${id}`),

  getHabitLogs: (params?: { date?: string; startDate?: string; endDate?: string; habitId?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append("date", params.date);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    if (params?.habitId) query.append("habitId", params.habitId);
    return get(`/habits/logs?${query.toString()}`);
  },

  upsertHabitLog: (data: { habitId: string; date: string; completed: boolean }) =>
    post("/habits/logs", data),

  getHabitStats: (year: number, month?: number) => {
    let url = `/habits/stats?year=${year}`;
    if (month) url += `&month=${month}`;
    return get(url);
  },

  // Meals
  getMeals: (date: string) => get(`/meals?date=${date}`),
  addMeal: (data: Record<string, unknown>) => post("/meals", data),
  deleteMeal: (id: string) => del(`/meals/${id}`),

  // Routines
  getRoutines: () => get("/workouts/routines"),
  addRoutine: (data: { name: string; type: string; exercises: any[] }) => post("/workouts/routines", data),
  updateRoutine: (id: string, data: any) => put(`/workouts/routines/${id}`, data),
  deleteRoutine: (id: string) => del(`/workouts/routines/${id}`),

  // Workouts
  getWorkoutSessions: (date?: string, status?: string) => {
    let url = "/workouts";
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (status) params.append("status", status);
    if (params.toString()) url += `?${params.toString()}`;
    return get(url);
  },

  startWorkoutSession: (data: { routineId: string; date: string; notes?: string }) =>
    post("/workouts", data),

  updateSessionExercise: (sessionId: string, exerciseId: string, data: {
    completedSets: any[];
    isCompleted: boolean
  }) => put(`/workouts/${sessionId}/exercises/${exerciseId}`, data),

  finishWorkoutSession: (sessionId: string, data?: { notes?: string }) =>
    post(`/workouts/${sessionId}/finish`, data),

  deleteWorkoutSession: (id: string) => del(`/workouts/${id}`),

  getGymStats: () => get("/workouts/stats"),

  // Finance
  getTransactions: (filters?: { month?: string; year?: string; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (filters?.month) params.append("month", filters.month);
    if (filters?.year) params.append("year", filters.year);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    return get(`/finance${query}`);
  },

  getFinanceStats: (filters?: { month?: string; year?: string }) => {
    const params = new URLSearchParams();
    if (filters?.month) params.append("month", filters.month);
    if (filters?.year) params.append("year", filters.year);
    const query = params.toString() ? `?${params.toString()}` : "";
    return get(`/finance/stats${query}`);
  },

  addTransaction: (data: Record<string, unknown>) => post("/finance", data),
  updateTransaction: (id: string, data: Record<string, unknown>) => put(`/finance/${id}`, data),
  deleteTransaction: (id: string) => del(`/finance/${id}`),
  updateEmergencyFund: (data: { goal?: number; current?: number }) => put("/finance/emergency-goal", data),

  // Goals
  getGoals: () => get("/goals"),
  addGoal: (data: Record<string, unknown>) => post("/goals", data),
  updateGoal: (id: string, data: Record<string, unknown>) => put(`/goals/${id}`, data),
  deleteGoal: (id: string) => del(`/goals/${id}`),

  // Mindset
  getJournal: (date: string) => get(`/mindset/journal?date=${date}`),
  saveJournal: (data: Record<string, unknown>) => post("/mindset/journal", data),
  getBrianTracy: (date: string) => get(`/mindset/brian-tracy?date=${date}`),
  saveBrianTracy: (data: Record<string, unknown>) => post("/mindset/brian-tracy", data),
  getAllJournalEntries: () => get("/mindset/journal/all"),
  getAllBrianTracyLogs: () => get("/mindset/brian-tracy/all"),

  // Schedule
  getSchedule: () => get("/schedule"),
  addScheduleEvent: (data: Record<string, unknown>) => post("/schedule", data),
  deleteScheduleEvent: (id: string) => del(`/schedule/${id}`),
  updateScheduleEvent: (id: string, data: Record<string, unknown>) => put(`/schedule/${id}`, data),

  // Food Items
  getFoodItems: () => get("/food-items"),
  addFoodItem: (item: Omit<FoodItem, "id" | "userId">) => post("/food-items", item),
  deleteFoodItem: (id: string) => del(`/food-items/${id}`),

  // Water
  getWater: (date: string) => get(`/water?date=${date}`),
  setWater: (date: string, glasses: number) => post("/water", { date, glasses }),

  // Nutrition Rules
  getNutritionRules: () => get("/nutrition-rules"),
  addNutritionRule: (rule: string) => post("/nutrition-rules", { rule }),
  deleteNutritionRule: (id: string) => del(`/nutrition-rules/${id}`),

  // Edit meal
  updateMeal: (id: string, meal: Partial<Meal>) => put(`/meals/${id}`, meal),

  // AI Copilot
  aiChat: (data: { messages: Array<{ role: "user" | "assistant"; content: string }>; activeTab?: string }) =>
    post("/ai/chat", data),
  aiExecute: (action: Record<string, unknown>) => post("/ai/execute", { action }),
};
