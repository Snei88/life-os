// src/components/OnboardingWizard.tsx
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Calendar, Activity, Target, Wallet, Dumbbell, Brain,
  ChevronRight, ChevronLeft, Check, Sparkles, TrendingUp,
  Scale, Ruler, Flame, Droplets, Moon, Sun, Briefcase,
  Info
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";
import iconLight from "../../assets/icono.png";
import iconDark from "../../assets/icono_white.png";

interface OnboardingData {
  // Paso 1
  name: string;
  birthDate: string;
  gender: "male" | "female" | "other" | "";
  // Paso 2
  weight: number;
  height: number;
  bodyGoal: "lose_fat" | "recomp" | "gain_muscle" | "";
  activityLevel: "sedentary" | "moderate" | "active" | "very_active" | "";
  
  // Paso 3
  currency: "COP" | "USD" | "EUR";
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  debtType: "none" | "credit_card" | "consumer" | "student" | "mortgage";
  debtBalance: number;
  debtMonthlyPayment: number;
  financialGoal: "emergency_fund" | "home" | "vehicle" | "travel" | "business" | "retirement" | "investing" | "financial_freedom" | "";
  financialGoalCost: number;
  financialGoalMonthlySaving: number;
  financialGoalHorizon: "under_1y" | "1_3y" | "3_5y" | "over_5y" | "";
  riskProfile: "conservative" | "moderate" | "aggressive" | "";
  emergencyFundGoal: number;
  
  // Paso 4
  sleepBedtime: string;
  sleepWakeTime: string;
  workType: "work" | "study" | "both" | "";
  workStartTime: string;
  workEndTime: string;
  workDays: number[];
  workoutTimePreference: "morning" | "afternoon" | "night" | "fixed" | "";
  dailyFreeTime: "30m" | "1h" | "2h" | "3h_plus" | "";
  gymDays: number[];
  gymTime: string;
  
  // Paso 5
  mainGoal: string;
}

const initialData: OnboardingData = {
  name: "",
  birthDate: "",
  gender: "",
  weight: 0,
  height: 0,
  bodyGoal: "",
  activityLevel: "",
  currency: "COP",
  monthlyIncome: 0,
  monthlyExpenses: 0,
  currentSavings: 0,
  debtType: "none",
  debtBalance: 0,
  debtMonthlyPayment: 0,
  financialGoal: "",
  financialGoalCost: 0,
  financialGoalMonthlySaving: 0,
  financialGoalHorizon: "",
  riskProfile: "",
  emergencyFundGoal: 0,
  sleepBedtime: "23:00",
  sleepWakeTime: "06:00",
  workType: "work",
  workStartTime: "08:00",
  workEndTime: "17:00",
  workDays: [1, 2, 3, 4, 5],
  workoutTimePreference: "fixed",
  dailyFreeTime: "1h",
  gymDays: [1, 2, 3, 4, 5], // Lunes a Viernes default
  gymTime: "18:00",
  mainGoal: "",
};

// Cálculos de nutrición
function calculateMetrics(data: OnboardingData) {
  if (!data.weight || !data.height || !data.gender || !data.activityLevel) return null;
  
  const age = data.birthDate ? Math.floor((new Date().getTime() - new Date(data.birthDate).getTime()) / 3.15576e+10) : 25;
  
  // BMI
  const heightM = data.height / 100;
  const bmi = data.weight / (heightM * heightM);
  
  // TDEE (Mifflin-St Jeor)
  let bmr = 0;
  if (data.gender === "male") {
    bmr = (10 * data.weight) + (6.25 * data.height) - (5 * age) + 5;
  } else {
    bmr = (10 * data.weight) + (6.25 * data.height) - (5 * age) - 161;
  }
  
  // Multiplicador de actividad
  const multipliers = {
    sedentary: 1.2,
    moderate: 1.375,
    active: 1.55,
    very_active: 1.725
  };
  
  const tdee = Math.round(bmr * multipliers[data.activityLevel]);
  
  // Ajuste por objetivo
  let adjustment = 0;
  let proteinFactor = 2.0;
  
  switch (data.bodyGoal) {
    case "lose_fat":
      adjustment = -500;
      proteinFactor = 2.2;
      break;
    case "recomp":
      adjustment = 0;
      proteinFactor = 2.0;
      break;
    case "gain_muscle":
      adjustment = 300;
      proteinFactor = 1.8;
      break;
  }
  
  const maintenance = tdee + adjustment;
  const gymTarget = maintenance + 300;
  const restTarget = maintenance;
  const proteinTarget = Math.round(data.weight * proteinFactor);
  
  return {
    bmi: bmi.toFixed(1),
    bmiCategory: bmi < 18.5 ? "Bajo peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidad",
    tdee,
    gymTarget,
    restTarget,
    proteinTarget
  };
}

function calculateFinancialProfile(data: OnboardingData) {
  const freeCashflow = data.monthlyIncome - data.monthlyExpenses;
  const savingsRate = data.monthlyIncome > 0 ? (freeCashflow / data.monthlyIncome) * 100 : 0;
  const emergencyGoal = data.monthlyExpenses > 0 ? data.monthlyExpenses * 6 : data.emergencyFundGoal;
  const emergencyProgress = emergencyGoal > 0 ? Math.min((data.currentSavings / emergencyGoal) * 100, 100) : 0;
  const debtPaymentRate = data.monthlyIncome > 0 ? (data.debtMonthlyPayment / data.monthlyIncome) * 100 : 0;
  const health =
    freeCashflow < 0 ? "Crítica" : savingsRate < 10 ? "Riesgosa" : savingsRate < 20 ? "Buena" : "Excelente";
  const debtLevel =
    data.debtBalance <= 0 ? "Ninguno" : debtPaymentRate < 10 ? "Bajo" : debtPaymentRate < 25 ? "Medio" : "Alto";
  const priority =
    data.debtType === "credit_card" && data.debtBalance > 0
      ? "Eliminar deuda de tarjeta de crédito"
      : emergencyProgress < 100
        ? "Completar fondo de emergencia"
        : data.debtBalance > 0
          ? "Reducir deudas pendientes"
          : "Comenzar o aumentar inversiones";
  const score = Math.max(
    0,
    Math.min(
      10,
      Number(
        (
          5 +
          Math.min(savingsRate, 30) / 6 +
          Math.min(emergencyProgress, 100) / 25 -
          (debtLevel === "Alto" ? 3 : debtLevel === "Medio" ? 1.5 : 0)
        ).toFixed(1),
      ),
    ),
  );
  const goalMonths =
    data.financialGoalCost > 0 && data.financialGoalMonthlySaving > 0
      ? Math.ceil(data.financialGoalCost / data.financialGoalMonthlySaving)
      : null;

  return {
    freeCashflow,
    savingsRate,
    emergencyGoal,
    emergencyProgress,
    debtLevel,
    health,
    priority,
    score,
    goalMonths,
  };
}

function calculateRoutineProfile(data: OnboardingData) {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const bedtime = toMinutes(data.sleepBedtime || "23:00");
  const wake = toMinutes(data.sleepWakeTime || "06:00");
  const sleepMinutes = wake > bedtime ? wake - bedtime : 1440 - bedtime + wake;
  const sleepHours = Number((sleepMinutes / 60).toFixed(1));
  const score = sleepHours >= 7 && sleepHours <= 9 ? 10 : sleepHours >= 6 ? 7 : sleepHours >= 5 ? 4 : 3;
  const recovery = sleepHours >= 7 ? "Buena" : sleepHours >= 6 ? "Moderada" : "Baja";
  const risks = sleepHours >= 7 ? [] : [
    "Menor recuperacion muscular",
    "Menor concentracion",
    "Mayor fatiga y hambre durante el dia",
  ];

  return { sleepHours, score, recovery, risks };
}

export const OnboardingWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "light" ? iconLight : iconDark;

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  const metrics = useMemo(() => calculateMetrics(data), [data]);
  const financialProfile = useMemo(() => calculateFinancialProfile(data), [data]);
  const routineProfile = useMemo(() => calculateRoutineProfile(data), [data]);
  
  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };
  
  const validateStep = () => {
    switch (step) {
      case 1: return data.name.length >= 2;
      case 2: return data.weight > 0 && data.height > 0 && data.bodyGoal && data.activityLevel;
      case 3:
        return (
          !!data.currency &&
          data.monthlyIncome > 0 &&
          data.monthlyExpenses >= 0 &&
          !!data.financialGoal &&
          !!data.financialGoalHorizon &&
          !!data.riskProfile
        );
      case 4:
        return (
          !!data.sleepBedtime &&
          !!data.sleepWakeTime &&
          !!data.workType &&
          !!data.workStartTime &&
          !!data.workEndTime &&
          data.workDays.length > 0 &&
          !!data.workoutTimePreference &&
          !!data.dailyFreeTime &&
          data.gymDays.length > 0 &&
          !!data.gymTime
        );
      case 5: return data.mainGoal.length >= 5;
      default: return true;
    }
  };
  
  const handleNext = () => {
    if (step < 5) {
      setDirection(1);
      setStep(step + 1);
    }
  };
  
  const handlePrev = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Calcular valores finales
      const finalMetrics = calculateMetrics(data);
      const emergencyGoal = data.emergencyFundGoal || financialProfile.emergencyGoal || (data.monthlyIncome * 6);
      
      // 1. Actualizar perfil completo
      await api.updateProfile({
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        bodyGoal: data.bodyGoal,
        activityLevel: data.activityLevel,
        gymTargetKcal: finalMetrics?.gymTarget || 1950,
        restTargetKcal: finalMetrics?.restTarget || 1700,
        proteinTarget: finalMetrics?.proteinTarget || 126,
        currency: data.currency,
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses,
        currentSavings: data.currentSavings,
        debtType: data.debtType,
        debtBalance: data.debtBalance,
        debtMonthlyPayment: data.debtMonthlyPayment,
        financialGoal: data.financialGoal,
        financialGoalCost: data.financialGoalCost,
        financialGoalMonthlySaving: data.financialGoalMonthlySaving,
        financialGoalHorizon: data.financialGoalHorizon,
        riskProfile: data.riskProfile,
        sleepBedtime: data.sleepBedtime,
        sleepWakeTime: data.sleepWakeTime,
        workType: data.workType,
        workStartTime: data.workStartTime,
        workEndTime: data.workEndTime,
        workDays: data.workDays,
        workoutTimePreference: data.workoutTimePreference,
        dailyFreeTime: data.dailyFreeTime,
        savingsGoal: 25,
        emergencyFundGoal: emergencyGoal,
        mainGoal: data.mainGoal,
      });
      
      // 2. Crear bloques fijos de trabajo/estudio
      await Promise.all(data.workDays.map(day =>
        api.addScheduleEvent({
          dayOfWeek: day,
          time: data.workStartTime,
          endTime: data.workEndTime,
          title: data.workType === "study" ? "Estudio / Clases" : data.workType === "both" ? "Trabajo / Estudio" : "Trabajo",
          type: "work",
          color: "blue",
          isFixed: true,
          description: "Bloque base de trabajo o estudio"
        })
      ));

      // 2. Crear eventos de gym en la rutina semanal
      await Promise.all(data.gymDays.map(day => 
        api.addScheduleEvent({
          dayOfWeek: day,
          time: data.gymTime,
          endTime: `${parseInt(data.gymTime.split(':')[0]) + 1}:00`,
          title: "Entrenamiento",
          type: "gym",
          color: "green",
          isFixed: true,
          description: "Sesión de fuerza"
        })
      ));
      
      // 3. Pre-llenar Brian Tracy para hoy
      await api.saveBrianTracy({
        date: new Date().toISOString().split('T')[0],
        goal: data.mainGoal,
        completed: false
      });
      
      onComplete();
    } catch (err) {
      console.error("Error completando onboarding:", err);
      alert("Error guardando datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };
  
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };
  
  const weekDays = [
    { label: "Lun", value: 1 },
    { label: "Mar", value: 2 },
    { label: "Mie", value: 3 },
    { label: "Jue", value: 4 },
    { label: "Vie", value: 5 },
    { label: "Sáb", value: 6 },
    { label: "Dom", value: 0 },
  ];
  
  if (!isMounted) return null;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      {/* Fondos animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" 
        />
      </div>
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Header con progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <img src={logoSrc} alt="Life OS" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Life OS</h1>
                <p className="text-white/50 text-sm">Configura tu sistema de vida</p>
              </div>
            </motion.div>
            <div className="text-right">
              <span className="text-3xl font-black text-orange-500">{step}</span>
              <span className="text-white/30 text-lg">/5</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
        
        {/* Card principal */}
        <div className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl min-h-[500px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6 pb-24"
            >
              {/* PASO 1: Perfil Básico */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 mb-4">
                      <User size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Tu Perfil</h2>
                    <p className="text-white/50">Datos básicos para personalizar tu experiencia</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={data.name}
                        onChange={(e) => updateData("name", e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-orange-600 transition-all text-lg"
                        autoFocus
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                          Fecha de nacimiento
                        </label>
                        <input
                          type="date"
                          value={data.birthDate}
                          onChange={(e) => updateData("birthDate", e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-600 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                          Género
                        </label>
                        <select
                          value={data.gender}
                          onChange={(e) => updateData("gender", e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-600 transition-all"
                        >
                          <option value="">Seleccionar</option>
                          <option value="male">Masculino</option>
                          <option value="female">Femenino</option>
                          <option value="other">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* PASO 2: Datos Físicos */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 mb-4">
                      <Activity size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Tu Físico</h2>
                    <p className="text-white/50">Calcularemos tus necesidades calóricas automáticamente</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Peso actual (kg) *
                      </label>
                      <div className="relative">
                        <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                          type="number"
                          value={data.weight || ""}
                          onChange={(e) => updateData("weight", parseFloat(e.target.value))}
                          placeholder="75"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-green-600 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Altura (cm) *
                      </label>
                      <div className="relative">
                        <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        <input
                          type="number"
                          value={data.height || ""}
                          onChange={(e) => updateData("height", parseFloat(e.target.value))}
                          placeholder="175"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-green-600 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">
                      Objetivo corporal *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "lose_fat", label: "Perder grasa", icon: Flame, color: "orange" },
                        { key: "recomp", label: "Recomposición", icon: Activity, color: "blue" },
                        { key: "gain_muscle", label: "Ganar músculo", icon: TrendingUp, color: "green" }
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => updateData("bodyGoal", opt.key)}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                            data.bodyGoal === opt.key
                              ? `bg-${opt.color}-500/20 border-${opt.color}-500 text-${opt.color}-400`
                              : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                          )}
                        >
                          <opt.icon size={24} />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">
                      Nivel de actividad *
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: "sedentary", label: "Sedentario", desc: "Poco o ningún ejercicio" },
                        { key: "moderate", label: "Moderado", desc: "Ejercicio 3-4 veces/semana" },
                        { key: "active", label: "Activo", desc: "Ejercicio 5-6 veces/semana" },
                        { key: "very_active", label: "Muy Activo", desc: "Ejercicio diario intenso" }
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => updateData("activityLevel", opt.key)}
                          className={cn(
                            "w-full p-3 rounded-xl border transition-all flex items-center justify-between",
                            data.activityLevel === opt.key
                              ? "bg-orange-500/20 border-orange-500 text-white"
                              : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                          )}
                        >
                          <div className="text-left">
                            <p className="font-bold text-sm">{opt.label}</p>
                            <p className="text-xs text-white/40">{opt.desc}</p>
                          </div>
                          {data.activityLevel === opt.key && <Check size={18} className="text-orange-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Preview de cálculos */}
                  {metrics && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl space-y-2"
                    >
                      <p className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} />
                        Cálculos Automáticos
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-black text-white">{metrics.bmi}</p>
                          <p className="text-[10px] text-white/40 uppercase">IMC ({metrics.bmiCategory})</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-orange-400">{metrics.gymTarget}</p>
                          <p className="text-[10px] text-white/40 uppercase">Kcal Gym Day</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-blue-400">{metrics.proteinTarget}g</p>
                          <p className="text-[10px] text-white/40 uppercase">Proteína/día</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              
              {/* PASO 3: Finanzas */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 text-yellow-500 mb-4">
                      <Wallet size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Configuración Financiera</h2>
                    <p className="text-white/50">Gestiona tu capital y construye libertad</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">
                      Moneda principal
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { code: "COP", label: "Peso Colombiano", flag: "🇨🇴" },
                        { code: "USD", label: "Dólar USD", flag: "🇺🇸" },
                        { code: "EUR", label: "Euro", flag: "🇪🇺" }
                      ].map((curr) => (
                        <button
                          key={curr.code}
                          onClick={() => updateData("currency", curr.code)}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex flex-col items-center gap-2",
                            data.currency === curr.code
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                              : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                          )}
                        >
                          <span className="text-2xl">{curr.flag}</span>
                          <span className="text-xs font-bold">{curr.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                        Ingreso mensual *
                      </label>
                      <div className="relative group">
                        <Info size={13} className="text-white/30 hover:text-yellow-400 cursor-help transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white/70 leading-relaxed shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                          Usamos este valor para calcular tu <span className="text-yellow-400 font-bold">meta de ahorro automática (25%)</span> y tu fondo de emergencia recomendado de <span className="text-yellow-400 font-bold">6 meses</span>.
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1a]" />
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">
                        {data.currency === "COP" ? "$" : data.currency === "USD" ? "$" : "€"}
                      </span>
                      <input
                        type="number"
                        value={data.monthlyIncome || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          updateData("monthlyIncome", val);
                          if (val > 0 && data.emergencyFundGoal === 0) {
                            updateData("emergencyFundGoal", val * 6);
                          }
                        }}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-yellow-600 transition-all text-lg"
                      />
                    </div>
                    <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                      <Info size={12} />
                      Se usará para calcular tu meta de ahorro del 25%
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                        Gastos, ahorros y deudas
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="number"
                        value={data.monthlyExpenses || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateData("monthlyExpenses", val);
                          updateData("emergencyFundGoal", val * 6);
                        }}
                        placeholder="Gastos mensuales totales"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-yellow-600 transition-all"
                      />
                      <input
                        type="number"
                        value={data.currentSavings || ""}
                        onChange={(e) => updateData("currentSavings", parseFloat(e.target.value) || 0)}
                        placeholder="Ahorros actuales"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-yellow-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest block">
                      Deudas
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        { key: "none", label: "Ninguna" },
                        { key: "credit_card", label: "Tarjeta" },
                        { key: "consumer", label: "Consumo" },
                        { key: "student", label: "Educativo" },
                        { key: "mortgage", label: "Hipoteca" },
                      ].map((debt) => (
                        <button
                          key={debt.key}
                          onClick={() => updateData("debtType", debt.key)}
                          className={cn(
                            "rounded-xl border px-3 py-3 text-xs font-bold transition-all",
                            data.debtType === debt.key
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                              : "bg-white/5 border-white/10 text-white/45 hover:border-white/30",
                          )}
                        >
                          {debt.label}
                        </button>
                      ))}
                    </div>
                    {data.debtType !== "none" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="number"
                          value={data.debtBalance || ""}
                          onChange={(e) => updateData("debtBalance", parseFloat(e.target.value) || 0)}
                          placeholder="Saldo pendiente"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-yellow-600 transition-all"
                        />
                        <input
                          type="number"
                          value={data.debtMonthlyPayment || ""}
                          onChange={(e) => updateData("debtMonthlyPayment", parseFloat(e.target.value) || 0)}
                          placeholder="Cuota mensual"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-yellow-600 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={data.financialGoal}
                      onChange={(e) => updateData("financialGoal", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-yellow-600 transition-all"
                    >
                      <option value="">Objetivo financiero principal</option>
                      <option value="emergency_fund">Fondo de emergencia</option>
                      <option value="home">Comprar vivienda</option>
                      <option value="vehicle">Comprar vehiculo</option>
                      <option value="travel">Viajar</option>
                      <option value="business">Crear empresa</option>
                      <option value="retirement">Jubilacion</option>
                      <option value="investing">Invertir</option>
                      <option value="financial_freedom">Libertad financiera</option>
                    </select>
                    <select
                      value={data.financialGoalHorizon}
                      onChange={(e) => updateData("financialGoalHorizon", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-yellow-600 transition-all"
                    >
                      <option value="">Horizonte temporal</option>
                      <option value="under_1y">Menos de 1 año</option>
                      <option value="1_3y">1 a 3 años</option>
                      <option value="3_5y">3 a 5 años</option>
                      <option value="over_5y">Más de 5 años</option>
                    </select>
                    <input
                      type="number"
                      value={data.financialGoalCost || ""}
                      onChange={(e) => updateData("financialGoalCost", parseFloat(e.target.value) || 0)}
                      placeholder="Costo de la meta"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-yellow-600 transition-all"
                    />
                    <input
                      type="number"
                      value={data.financialGoalMonthlySaving || ""}
                      onChange={(e) => updateData("financialGoalMonthlySaving", parseFloat(e.target.value) || 0)}
                      placeholder="Ahorro mensual para meta"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-yellow-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">
                      Perfil de riesgo *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: "conservative", label: "Conservador" },
                        { key: "moderate", label: "Moderado" },
                        { key: "aggressive", label: "Agresivo" },
                      ].map((risk) => (
                        <button
                          key={risk.key}
                          onClick={() => updateData("riskProfile", risk.key)}
                          className={cn(
                            "rounded-xl border p-3 text-sm font-bold transition-all",
                            data.riskProfile === risk.key
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                              : "bg-white/5 border-white/10 text-white/45 hover:border-white/30",
                          )}
                        >
                          {risk.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-black text-white">{financialProfile.score}/10</p>
                        <p className="text-[10px] uppercase text-white/40">salud financiera</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-green-400">{financialProfile.savingsRate.toFixed(1)}%</p>
                        <p className="text-[10px] uppercase text-white/40">tasa ahorro</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-yellow-300">{financialProfile.emergencyProgress.toFixed(0)}%</p>
                        <p className="text-[10px] uppercase text-white/40">fondo emergencia</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-blue-300">{financialProfile.debtLevel}</p>
                        <p className="text-[10px] uppercase text-white/40">endeudamiento</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/65">
                      Estado: <strong>{financialProfile.health}</strong>. Prioridad #1: {financialProfile.priority}.
                    </p>
                    {financialProfile.goalMonths ? (
                      <p className="text-xs text-white/45">
                        Con tu ahorro mensual para la meta, la alcanzarías en aprox. {(financialProfile.goalMonths / 12).toFixed(1)} años.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                        Meta Fondo de Emergencia
                      </label>
                      <div className="relative group">
                        <Info size={13} className="text-white/30 hover:text-yellow-400 cursor-help transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs text-white/70 leading-relaxed shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                          Tu red de seguridad financiera. Cubre <span className="text-yellow-400 font-bold">3–6 meses de gastos</span> sin ingresos. Se auto-calcula con tus ingresos × 6, pero puedes ajustarlo.
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1a]" />
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">
                        {data.currency === "COP" ? "$" : data.currency === "USD" ? "$" : "€"}
                      </span>
                      <input
                        type="number"
                        value={data.emergencyFundGoal || ""}
                        onChange={(e) => updateData("emergencyFundGoal", parseFloat(e.target.value))}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-yellow-600 transition-all text-lg"
                      />
                    </div>
                    <p className="text-xs text-white/30 mt-2">
                      Default recomendado: 6 meses de gastos ({data.monthlyIncome ? 
                        `${new Intl.NumberFormat("es-CO").format(data.monthlyIncome * 6)}` : 
                        "ingresa tus ingresos"})
                    </p>
                  </div>
                </div>
              )}
              
              {/* PASO 4: Rutina */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 mb-4">
                      <Dumbbell size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Rutina y Horarios Base</h2>
                    <p className="text-white/50">Define sueño, trabajo, entrenamiento y tiempo libre</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Hora de dormir *
                      </label>
                      <input
                        type="time"
                        value={data.sleepBedtime}
                        onChange={(e) => updateData("sleepBedtime", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-purple-600 transition-all text-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Hora de despertar *
                      </label>
                      <input
                        type="time"
                        value={data.sleepWakeTime}
                        onChange={(e) => updateData("sleepWakeTime", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-purple-600 transition-all text-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                    <div>
                      <p className="text-2xl font-black text-purple-300">{routineProfile.sleepHours}h</p>
                      <p className="text-[10px] uppercase text-white/40">sueño</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-blue-300">{routineProfile.score}/10</p>
                      <p className="text-[10px] uppercase text-white/40">calidad</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-green-300">{routineProfile.recovery}</p>
                      <p className="text-[10px] uppercase text-white/40">recuperación</p>
                    </div>
                    {routineProfile.risks.length > 0 && (
                      <p className="col-span-3 text-xs text-white/50">
                        Alerta: {routineProfile.risks.join(", ")}.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                      Tipo de bloque principal *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Trabajo", value: "work" },
                        { label: "Estudio", value: "study" },
                        { label: "Ambos", value: "both" },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateData("workType", option.value)}
                          className={cn(
                            "rounded-xl border px-3 py-3 text-sm font-bold transition-all",
                            data.workType === option.value
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Inicio trabajo/estudio *
                      </label>
                      <input
                        type="time"
                        value={data.workStartTime}
                        onChange={(e) => updateData("workStartTime", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-blue-600 transition-all text-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Fin trabajo/estudio *
                      </label>
                      <input
                        type="time"
                        value={data.workEndTime}
                        onChange={(e) => updateData("workEndTime", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-blue-600 transition-all text-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">
                      Días laborales / clases *
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((day) => (
                        <button
                          key={day.value}
                          onClick={() => {
                            const updated = data.workDays.includes(day.value)
                              ? data.workDays.filter(d => d !== day.value)
                              : [...data.workDays, day.value].sort();
                            updateData("workDays", updated);
                          }}
                          className={cn(
                            "aspect-square rounded-xl border transition-all flex flex-col items-center justify-center gap-1",
                            data.workDays.includes(day.value)
                              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30"
                              : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                          )}
                        >
                          <span className="text-xs font-bold">{day.label}</span>
                          {data.workDays.includes(day.value) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Preferencia para entrenar *
                      </label>
                      <select
                        value={data.workoutTimePreference}
                        onChange={(e) => updateData("workoutTimePreference", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-purple-600 transition-all text-lg"
                      >
                        <option value="morning">Mañana</option>
                        <option value="afternoon">Tarde</option>
                        <option value="night">Noche</option>
                        <option value="fixed">Hora fija</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        Tiempo libre diario *
                      </label>
                      <select
                        value={data.dailyFreeTime}
                        onChange={(e) => updateData("dailyFreeTime", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-purple-600 transition-all text-lg"
                      >
                        <option value="30m">30 min</option>
                        <option value="1h">1 hora</option>
                        <option value="2h">2 horas</option>
                        <option value="3h_plus">3 horas+</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 block">
                      Días de gym *
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((day) => (
                        <button
                          key={day.value}
                          onClick={() => {
                            const current = data.gymDays;
                            const updated = current.includes(day.value)
                              ? current.filter(d => d !== day.value)
                              : [...current, day.value].sort();
                            updateData("gymDays", updated);
                          }}
                          className={cn(
                            "aspect-square rounded-xl border transition-all flex flex-col items-center justify-center gap-1",
                            data.gymDays.includes(day.value)
                              ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30"
                              : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                          )}
                        >
                          <span className="text-xs font-bold">{day.label}</span>
                          {data.gymDays.includes(day.value) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/30 mt-3 text-center">
                      {data.gymDays.length} días seleccionados
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                      Hora habitual de entrenamiento *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                        <Sun size={18} />
                      </div>
                      <input
                        type="time"
                        value={data.gymTime}
                        onChange={(e) => updateData("gymTime", e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-purple-600 transition-all text-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                    <p className="text-sm text-white/60 flex items-start gap-2">
                      <Info size={16} className="text-purple-400 mt-0.5 shrink-0" />
                      Esto pre-configurará automáticamente tu módulo de Rutina y activará el toggle Gym Day/Rest Day en nutrición.
                    </p>
                  </div>
                </div>
              )}
              
              {/* PASO 5: Meta Principal */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 mb-4">
                      <Brain size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Tu Meta Principal</h2>
                    <p className="text-white/50">Método Brian Tracy: Define tu objetivo #1</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                        ¿Cuál es tu meta principal ahora mismo? *
                      </label>
                      <textarea
                        value={data.mainGoal}
                        onChange={(e) => updateData("mainGoal", e.target.value)}
                        placeholder="Ej: Convertirme en desarrollador senior, ganar 10k USD al mes, correr una maratón..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-orange-600 transition-all h-32 resize-none text-lg"
                        autoFocus
                      />
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl space-y-3">
                      <p className="text-sm font-bold text-orange-400 flex items-center gap-2">
                        <Sparkles size={16} />
                        Método Brian Tracy
                      </p>
                      <p className="text-sm text-white/60 leading-relaxed">
                        Esta meta se escribirá <strong>10 veces</strong> cada día en tu módulo Mindset para reprogramar tu Subconsciente y tu Sistema de Activación Reticular (RAS) hacia el éxito.
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <div className="flex items-center gap-3 text-sm text-white/40">
                        <Check size={16} className="text-green-500" />
                        <span>Pre-llenado automático del módulo Mindset</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/40 mt-2">
                        <Check size={16} className="text-green-500" />
                        <span>Recordatorios diarios de tu objetivo principal</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Botones de navegación */}
          <div className="absolute bottom-4 left-8 right-8 flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                step === 1
                  ? "opacity-0 pointer-events-none"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <ChevronLeft size={20} />
              Anterior
            </button>

            {step === 3 && (
              <button
                onClick={handleNext}
                className="text-white/35 hover:text-white/60 text-sm font-medium transition-colors px-4 py-2 rounded-xl"
              >
                Saltar este paso
              </button>
            )}

            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={!validateStep()}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20",
                  !validateStep() && "opacity-50 cursor-not-allowed"
                )}
              >
                Siguiente
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!validateStep() || loading}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-600/30 min-w-[160px] justify-center",
                  (!validateStep() || loading) && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Finalizar
                    <Sparkles size={20} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <p className="text-center mt-6 text-xs text-white/20">
          Paso {step} de 5 • 
          {step === 1 && " Perfil básico"}
          {step === 2 && " Datos físicos"}
          {step === 3 && " Finanzas"}
          {step === 4 && " Rutina"}
          {step === 5 && " Meta principal"}
        </p>
      </div>
    </div>
  );
};
