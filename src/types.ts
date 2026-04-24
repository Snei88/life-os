// src/types.ts
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  birthDate?: string;
  gender?: "male" | "female" | "other" | string;
  weight?: number;
  height?: number;
  bodyGoal?: "lose_fat" | "recomp" | "gain_muscle" | string;
  activityLevel?: "sedentary" | "moderate" | "active" | "very_active" | string;
  currency?: "COP" | "USD" | "EUR" | string;
  monthlyIncome?: number;
  gymTargetKcal: number;
  restTargetKcal: number;
  proteinTarget: number;
  savingsGoal: number;
  emergencyFundGoal: number;
  mainGoal: string;
}

export type FrequencyType = 'daily' | 'weekly' | 'unique';

export interface Frequency {
  type: FrequencyType;
  days?: number[]; // Para weekly: [1,3,5] = Lun/Mie/Vie
  date?: string;   // Para unique: "2026-04-01"
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  reminderTime?: string | null;
  frequency: Frequency;
  category: 'salud' | 'mente' | 'productividad' | 'otros';
  targetStreak: number;
  isActive: boolean;
  createdAt: string;
  streak?: {
    current: number;
    longest: number;
    lastDate: string | null;
  };
  appliesToday?: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  completedAt?: string;
}

export interface HabitStats {
  dailyStats: {
    date: string;
    total: number;
    completed: number;
    percentage: number;
  }[];
  bestStreak: number;
  totalCompleted: number;
}

export interface Meal {
  id: string;
  userId: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string;
  type: string;
  notes: string;
}

export interface Exercise {
  id: string;
  sessionId: string;
  name: string;
  sets: {
    reps: number;
    weight: number;
    done: boolean;
  }[];
}

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  deadline: string;
  progress: number;
  level: "90d" | "6m" | "2y";
  category: string;
  priority: string;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  affirmation: string;
  journalText: string;
  gratitude: string[];
  reflection: string;
}

export interface BrianTracyLog {
  id: string;
  userId: string;
  date: string;
  goal: string;
  completed: boolean;
}

export interface ScheduleEvent {
  id: string;
  userId: string;
  dayOfWeek: number;
  time: string;
  title: string;
  type: string;
  color: string;
  endTime?: string;
  isFixed: boolean;
  description?: string;
}

export interface FoodItem {
  id: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export interface WaterLog {
  date: string;
  glasses: number;
}

export interface NutritionRule {
  id: string;
  userId: string;
  rule: string;
  isActive: boolean;
  sortOrder: number;
}

export interface WorkoutRoutine {
  id: string;
  userId: string;
  name: string;
  type: 'strength' | 'cardio' | 'swimming';
  exercises: RoutineExercise[];
  isActive: boolean;
}

export interface RoutineExercise {
  name: string;
  sets: number;
  reps: number;
  baseWeight: number;
  restSeconds: number;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  routineId: string | null;
  date: string;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  totalVolume: number;
  notes: string;
  exercises?: SessionExercise[];
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  completedSets: CompletedSet[];
  isCompleted: boolean;
  orderIndex: number;
}

export interface CompletedSet {
  reps: number;
  weight: number;
  completed: boolean;
  completedAt?: string;
}

export interface GymStats {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  lastWorkoutDate?: string;
  recentVolume: number;
}

export interface FinanceStats {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  emergencyFund: {
    current: number;
    goal: number;
  };
  monthlyHistory: {
    month: string;
    income: number;
    expense: number;
  }[];
}

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  isActive: boolean;
}

export interface AICopilotInsight {
  id: string;
  module: string;
  tone: "coach" | "warning" | "opportunity";
  title: string;
  summary: string;
}

export interface AICopilotAction {
  type: string;
  module: string;
  title: string;
  reason?: string;
  payload: Record<string, unknown>;
}

export interface AICopilotFeedbackEntry {
  actionTitle: string;
  actionType: string;
  module: string;
  outcome: "accepted" | "postponed" | "dismissed";
  createdAt: string;
}

export interface AICopilotMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AICopilotResponse {
  reply: string;
  insights: AICopilotInsight[];
  actions: AICopilotAction[];
  contextSummary?: Record<string, unknown>;
}
