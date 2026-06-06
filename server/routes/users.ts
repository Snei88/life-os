//SERVER/ROUTES/USERS.TS
import { Router, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

function calculateRoutineProfile(input: {
  sleepBedtime?: string;
  sleepWakeTime?: string;
}) {
  const toMinutes = (value?: string) => {
    if (!value) return null;
    const [hours, minutes] = value.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };
  const bedtime = toMinutes(input.sleepBedtime);
  const wakeTime = toMinutes(input.sleepWakeTime);
  if (bedtime === null || wakeTime === null) {
    return {
      sleepHours: null,
      sleepQualityScore: null,
      muscleRecovery: null,
      cognitiveRecovery: null,
      sleepRecommendation: null,
    };
  }

  const minutes = wakeTime > bedtime ? wakeTime - bedtime : 1440 - bedtime + wakeTime;
  const sleepHours = Number((minutes / 60).toFixed(1));
  const sleepQualityScore =
    sleepHours >= 7 && sleepHours <= 9 ? 10 :
    sleepHours >= 6 && sleepHours < 7 ? 7 :
    sleepHours >= 5 && sleepHours < 6 ? 4 : 3;
  const recovery =
    sleepHours >= 7 ? "buena" : sleepHours >= 6 ? "moderada" : "baja";
  const sleepRecommendation =
    sleepHours >= 7 && sleepHours <= 9
      ? "Sueno dentro del rango recomendado para recuperacion fisica y cognitiva"
      : "Estas por debajo de las 7-9 horas recomendadas para recuperacion fisica y cognitiva";

  return {
    sleepHours,
    sleepQualityScore,
    muscleRecovery: recovery,
    cognitiveRecovery: recovery,
    sleepRecommendation,
  };
}

function calculateFinancialProfile(input: {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  currentSavings?: number;
  debtBalance?: number;
  debtMonthlyPayment?: number;
  debtType?: string;
}) {
  const income = Number(input.monthlyIncome) || 0;
  const expenses = Number(input.monthlyExpenses) || 0;
  const currentSavings = Number(input.currentSavings) || 0;
  const debtBalance = Number(input.debtBalance) || 0;
  const debtMonthlyPayment = Number(input.debtMonthlyPayment) || 0;
  const freeCashflow = income - expenses;
  const savingsRate = income > 0 ? (freeCashflow / income) * 100 : 0;
  const recommendedEmergencyFund = expenses * 6;
  const emergencyProgress =
    recommendedEmergencyFund > 0 ? Math.min((currentSavings / recommendedEmergencyFund) * 100, 100) : 0;
  const debtPaymentRate = income > 0 ? (debtMonthlyPayment / income) * 100 : 0;
  const hasCreditCardDebt = input.debtType === "credit_card" && debtBalance > 0;

  const healthStatus =
    freeCashflow < 0 ? "critica" : savingsRate < 10 ? "riesgosa" : savingsRate < 20 ? "buena" : "excelente";
  const debtLevel =
    debtBalance <= 0 ? "ninguno" : debtPaymentRate < 10 ? "bajo" : debtPaymentRate < 25 ? "medio" : "alto";
  const financialHealthScore = Math.max(
    0,
    Math.min(
      10,
      Number(
        (
          5 +
          Math.min(savingsRate, 30) / 6 +
          Math.min(emergencyProgress, 100) / 25 -
          (debtLevel === "alto" ? 3 : debtLevel === "medio" ? 1.5 : hasCreditCardDebt ? 2 : 0)
        ).toFixed(1),
      ),
    ),
  );
  const financialPriority = hasCreditCardDebt
    ? "Eliminar deuda de tarjeta de credito"
    : emergencyProgress < 100
      ? "Completar fondo de emergencia"
      : debtBalance > 0
        ? "Reducir deudas pendientes"
        : "Comenzar o aumentar inversiones";

  return {
    freeCashflow,
    savingsRate: Number(savingsRate.toFixed(1)),
    recommendedEmergencyFund,
    emergencyProgress: Number(emergencyProgress.toFixed(1)),
    debtLevel,
    healthStatus,
    financialHealthScore,
    financialPriority,
  };
}

const fmt = (r: Record<string, unknown>) => ({
  id: String(r.id), name: r.name, email: r.email,
  age: r.age,
  birthDate: r.birth_date,
  gender: r.gender,
  weight: r.weight,
  height: r.height,
  bodyGoal: r.body_goal,
  activityLevel: r.activity_level,
  bmi: r.bmi,
  bmiStatus: r.bmi_status,
  basalMetabolicRate: r.basal_metabolic_rate,
  dailyEnergyExpenditure: r.daily_energy_expenditure,
  calorieTarget: r.calorie_target,
  waterTargetLiters: r.water_target_liters,
  currency: r.currency,
  monthlyIncome: r.monthly_income,
  monthlyExpenses: r.monthly_expenses,
  currentSavings: r.current_savings,
  debtType: r.debt_type,
  debtBalance: r.debt_balance,
  debtMonthlyPayment: r.debt_monthly_payment,
  financialGoal: r.financial_goal,
  financialGoalCost: r.financial_goal_cost,
  financialGoalMonthlySaving: r.financial_goal_monthly_saving,
  financialGoalHorizon: r.financial_goal_horizon,
  riskProfile: r.risk_profile,
  financialFreeCashflow: r.financial_free_cashflow,
  financialSavingsRate: r.financial_savings_rate,
  recommendedEmergencyFund: r.recommended_emergency_fund,
  emergencyFundProgress: r.emergency_fund_progress,
  debtLevel: r.debt_level,
  financialHealthStatus: r.financial_health_status,
  financialHealthScore: r.financial_health_score,
  financialPriority: r.financial_priority,
  sleepBedtime: r.sleep_bedtime,
  sleepWakeTime: r.sleep_wake_time,
  sleepHours: r.sleep_hours,
  sleepQualityScore: r.sleep_quality_score,
  muscleRecovery: r.muscle_recovery,
  cognitiveRecovery: r.cognitive_recovery,
  sleepRecommendation: r.sleep_recommendation,
  workType: r.work_type,
  workStartTime: r.work_start_time,
  workEndTime: r.work_end_time,
  workDays: r.work_days,
  workoutTimePreference: r.workout_time_preference,
  dailyFreeTime: r.daily_free_time,
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
    name, age, birthDate, gender, weight, height, bodyGoal, activityLevel,
    bmi, bmiStatus, basalMetabolicRate, dailyEnergyExpenditure,
    calorieTarget, waterTargetLiters,
    currency, monthlyIncome, monthlyExpenses, currentSavings,
    debtType, debtBalance, debtMonthlyPayment,
    financialGoal, financialGoalCost, financialGoalMonthlySaving,
    financialGoalHorizon, riskProfile,
    sleepBedtime, sleepWakeTime, workType, workStartTime, workEndTime,
    workDays, workoutTimePreference, dailyFreeTime,
    gymTargetKcal, restTargetKcal, proteinTarget,
    savingsGoal, emergencyFundGoal, mainGoal
  } = req.body;

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (age !== undefined) patch.age = Number(age);
  if (birthDate !== undefined) patch.birth_date = birthDate;
  if (gender !== undefined) patch.gender = gender;
  if (weight !== undefined) patch.weight = Number(weight);
  if (height !== undefined) patch.height = Number(height);
  if (bodyGoal !== undefined) patch.body_goal = bodyGoal;
  if (activityLevel !== undefined) patch.activity_level = activityLevel;
  if (bmi !== undefined) patch.bmi = Number(bmi);
  if (bmiStatus !== undefined) patch.bmi_status = bmiStatus;
  if (basalMetabolicRate !== undefined) patch.basal_metabolic_rate = Number(basalMetabolicRate);
  if (dailyEnergyExpenditure !== undefined) patch.daily_energy_expenditure = Number(dailyEnergyExpenditure);
  if (calorieTarget !== undefined) patch.calorie_target = Number(calorieTarget);
  if (waterTargetLiters !== undefined) patch.water_target_liters = Number(waterTargetLiters);
  if (currency !== undefined) patch.currency = currency;
  if (monthlyIncome !== undefined) patch.monthly_income = Number(monthlyIncome);
  if (monthlyExpenses !== undefined) patch.monthly_expenses = Number(monthlyExpenses);
  if (currentSavings !== undefined) patch.current_savings = Number(currentSavings);
  if (debtType !== undefined) patch.debt_type = debtType;
  if (debtBalance !== undefined) patch.debt_balance = Number(debtBalance);
  if (debtMonthlyPayment !== undefined) patch.debt_monthly_payment = Number(debtMonthlyPayment);
  if (financialGoal !== undefined) patch.financial_goal = financialGoal;
  if (financialGoalCost !== undefined) patch.financial_goal_cost = Number(financialGoalCost);
  if (financialGoalMonthlySaving !== undefined) patch.financial_goal_monthly_saving = Number(financialGoalMonthlySaving);
  if (financialGoalHorizon !== undefined) patch.financial_goal_horizon = financialGoalHorizon;
  if (riskProfile !== undefined) patch.risk_profile = riskProfile;
  if (sleepBedtime !== undefined) patch.sleep_bedtime = sleepBedtime;
  if (sleepWakeTime !== undefined) patch.sleep_wake_time = sleepWakeTime;
  if (workType !== undefined) patch.work_type = workType;
  if (workStartTime !== undefined) patch.work_start_time = workStartTime;
  if (workEndTime !== undefined) patch.work_end_time = workEndTime;
  if (workDays !== undefined) patch.work_days = Array.isArray(workDays) ? workDays : [];
  if (workoutTimePreference !== undefined) patch.workout_time_preference = workoutTimePreference;
  if (dailyFreeTime !== undefined) patch.daily_free_time = dailyFreeTime;

  if (sleepBedtime !== undefined || sleepWakeTime !== undefined) {
    const routine = calculateRoutineProfile({ sleepBedtime, sleepWakeTime });
    patch.sleep_hours = routine.sleepHours;
    patch.sleep_quality_score = routine.sleepQualityScore;
    patch.muscle_recovery = routine.muscleRecovery;
    patch.cognitive_recovery = routine.cognitiveRecovery;
    patch.sleep_recommendation = routine.sleepRecommendation;
  }

  if (
    monthlyIncome !== undefined ||
    monthlyExpenses !== undefined ||
    currentSavings !== undefined ||
    debtType !== undefined ||
    debtBalance !== undefined ||
    debtMonthlyPayment !== undefined
  ) {
    const financial = calculateFinancialProfile({
      monthlyIncome: monthlyIncome ?? undefined,
      monthlyExpenses: monthlyExpenses ?? undefined,
      currentSavings: currentSavings ?? undefined,
      debtType: debtType ?? undefined,
      debtBalance: debtBalance ?? undefined,
      debtMonthlyPayment: debtMonthlyPayment ?? undefined,
    });
    patch.financial_free_cashflow = financial.freeCashflow;
    patch.financial_savings_rate = financial.savingsRate;
    patch.recommended_emergency_fund = financial.recommendedEmergencyFund;
    patch.emergency_fund_progress = financial.emergencyProgress;
    patch.debt_level = financial.debtLevel;
    patch.financial_health_status = financial.healthStatus;
    patch.financial_health_score = financial.financialHealthScore;
    patch.financial_priority = financial.financialPriority;
    if (emergencyFundGoal === undefined && financial.recommendedEmergencyFund > 0) {
      patch.emergency_fund_goal = financial.recommendedEmergencyFund;
    }
  }
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
