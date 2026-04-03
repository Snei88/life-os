// src/components/Profile.tsx
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  User, Activity, Wallet, Brain, Save, Check,
  Scale, Ruler, Flame, TrendingUp, Sparkles, Info
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useGuidedTour } from "../hooks/useGuidedTour";
import { cn } from "../lib/utils";

function calcMetrics(w: number, h: number, gender: string, dob: string, activityLevel: string, bodyGoal: string) {
  if (!w || !h || !gender || !activityLevel) return null;
  const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 3.15576e10) : 25;
  const heightM = h / 100;
  const bmi = w / (heightM * heightM);
  let bmr = gender === "male"
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161;
  const mult: Record<string, number> = { sedentary: 1.2, moderate: 1.375, active: 1.55, very_active: 1.725 };
  const tdee = Math.round(bmr * (mult[activityLevel] ?? 1.375));
  const adj = bodyGoal === "lose_fat" ? -500 : bodyGoal === "gain_muscle" ? 300 : 0;
  const pFactor = bodyGoal === "lose_fat" ? 2.2 : bodyGoal === "recomp" ? 2.0 : 1.8;
  return {
    bmi: bmi.toFixed(1),
    bmiCat: bmi < 18.5 ? "Bajo peso" : bmi < 25 ? "Normal" : bmi < 30 ? "Sobrepeso" : "Obesidad",
    gymTarget: tdee + adj + 300,
    restTarget: tdee + adj,
    protein: Math.round(w * pFactor),
  };
}

type Section = "personal" | "fisico" | "finanzas" | "meta";

export const Profile: React.FC = () => {
  const { profile } = useAuth();
  const { startTour, resetTourProgress } = useGuidedTour();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Section | null>(null);
  const [saved, setSaved] = useState<Section | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", birthDate: "", gender: "",
    weight: 0, height: 0, bodyGoal: "", activityLevel: "",
    currency: "COP", monthlyIncome: 0, emergencyFundGoal: 0,
    mainGoal: "",
  });

  useEffect(() => {
    api.getProfile().then((p: any) => {
      setForm({
        name: p.name ?? "",
        birthDate: p.birthDate ?? "",
        gender: p.gender ?? "",
        weight: p.weight ?? 0,
        height: p.height ?? 0,
        bodyGoal: p.bodyGoal ?? "",
        activityLevel: p.activityLevel ?? "",
        currency: p.currency ?? "COP",
        monthlyIncome: p.monthlyIncome ?? 0,
        emergencyFundGoal: p.emergencyFundGoal ?? 0,
        mainGoal: p.mainGoal ?? "",
      });
    }).finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(
    () => calcMetrics(form.weight, form.height, form.gender, form.birthDate, form.activityLevel, form.bodyGoal),
    [form.weight, form.height, form.gender, form.birthDate, form.activityLevel, form.bodyGoal]
  );

  const set = (k: keyof typeof form, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async (section: Section) => {
    setSaving(section);
    setError(null);
    try {
      const payload: Record<string, any> = {};
      if (section === "personal") Object.assign(payload, { name: form.name, birthDate: form.birthDate, gender: form.gender });
      if (section === "fisico") {
        const m = metrics;
        Object.assign(payload, {
          weight: form.weight, height: form.height,
          bodyGoal: form.bodyGoal, activityLevel: form.activityLevel,
          gymTargetKcal: m?.gymTarget ?? 1950,
          restTargetKcal: m?.restTarget ?? 1700,
          proteinTarget: m?.protein ?? 126,
        });
      }
      if (section === "finanzas") Object.assign(payload, { currency: form.currency, monthlyIncome: form.monthlyIncome, emergencyFundGoal: form.emergencyFundGoal });
      if (section === "meta") Object.assign(payload, { mainGoal: form.mainGoal });
      await api.updateProfile(payload);
      setSaved(section);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full" />
    </div>
  );

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-all";
  const labelCls = "text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 block";
  const cardCls = "bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 space-y-5";

  const SaveBtn = ({ section }: { section: Section }) => (
    <button
      onClick={() => save(section)}
      disabled={!!saving}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
        saved === section
          ? "bg-green-600 text-white"
          : "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20",
        saving === section && "opacity-60 cursor-not-allowed"
      )}
    >
      {saved === section ? <><Check size={16} />Guardado</> : saving === section ? "Guardando..." : <><Save size={16} />Guardar</>}
    </button>
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center font-black text-2xl shadow-xl shadow-orange-600/20">
          {form.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">{form.name || "Mi Perfil"}</h1>
          <p className="text-white/40 text-sm truncate">{profile?.email}</p>
        </div>
        <button
          onClick={() => {
            resetTourProgress();
            startTour(0);
          }}
          className="ml-auto rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          Repetir Tour
        </button>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

      {/* ── PERSONAL ─────────────────────────────── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><User size={18} className="text-blue-400" /></div>
            <h2 className="font-bold text-lg">Perfil Personal</h2>
          </div>
          <SaveBtn section="personal" />
        </div>

        <div>
          <label className={labelCls}>Nombre completo</label>
          <input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Tu nombre" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fecha de nacimiento</label>
            <input type="date" className={inputCls} value={form.birthDate} onChange={e => set("birthDate", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Género</label>
            <select className={inputCls} value={form.gender} onChange={e => set("gender", e.target.value)}>
              <option value="">Seleccionar</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── FÍSICO ───────────────────────────────── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center"><Activity size={18} className="text-green-400" /></div>
            <h2 className="font-bold text-lg">Datos Físicos</h2>
          </div>
          <SaveBtn section="fisico" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Peso (kg)</label>
            <div className="relative">
              <Scale size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="number" className={cn(inputCls, "pl-9")} value={form.weight || ""} onChange={e => set("weight", parseFloat(e.target.value))} placeholder="75" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Altura (cm)</label>
            <div className="relative">
              <Ruler size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="number" className={cn(inputCls, "pl-9")} value={form.height || ""} onChange={e => set("height", parseFloat(e.target.value))} placeholder="175" />
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Objetivo corporal</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "lose_fat", label: "Perder grasa", icon: Flame, color: "orange" },
              { key: "recomp", label: "Recomposición", icon: Activity, color: "blue" },
              { key: "gain_muscle", label: "Ganar músculo", icon: TrendingUp, color: "green" },
            ].map(opt => (
              <button key={opt.key} onClick={() => set("bodyGoal", opt.key)}
                className={cn("p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 text-xs font-bold",
                  form.bodyGoal === opt.key
                    ? `bg-${opt.color}-500/20 border-${opt.color}-500 text-${opt.color}-400`
                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                )}>
                <opt.icon size={18} />{opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Nivel de actividad</label>
          <div className="space-y-2">
            {[
              { key: "sedentary", label: "Sedentario", desc: "Poco o ningún ejercicio" },
              { key: "moderate", label: "Moderado", desc: "3–4 veces/semana" },
              { key: "active", label: "Activo", desc: "5–6 veces/semana" },
              { key: "very_active", label: "Muy Activo", desc: "Ejercicio diario intenso" },
            ].map(opt => (
              <button key={opt.key} onClick={() => set("activityLevel", opt.key)}
                className={cn("w-full p-3 rounded-xl border transition-all flex items-center justify-between",
                  form.activityLevel === opt.key
                    ? "bg-orange-500/20 border-orange-500 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                )}>
                <div className="text-left">
                  <p className="font-bold text-sm">{opt.label}</p>
                  <p className="text-xs text-white/40">{opt.desc}</p>
                </div>
                {form.activityLevel === opt.key && <Check size={16} className="text-orange-500" />}
              </button>
            ))}
          </div>
        </div>

        {metrics && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl">
            <p className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Sparkles size={13} />Cálculos automáticos
            </p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><p className="text-xl font-black">{metrics.bmi}</p><p className="text-[10px] text-white/40 uppercase">IMC</p></div>
              <div><p className="text-xl font-black text-orange-400">{metrics.gymTarget}</p><p className="text-[10px] text-white/40 uppercase">Kcal Gym</p></div>
              <div><p className="text-xl font-black text-blue-400">{metrics.restTarget}</p><p className="text-[10px] text-white/40 uppercase">Kcal Rest</p></div>
              <div><p className="text-xl font-black text-green-400">{metrics.protein}g</p><p className="text-[10px] text-white/40 uppercase">Proteína</p></div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── FINANZAS ─────────────────────────────── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Wallet size={18} className="text-yellow-400" /></div>
            <h2 className="font-bold text-lg">Finanzas</h2>
          </div>
          <SaveBtn section="finanzas" />
        </div>

        <div>
          <label className={labelCls}>Moneda principal</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ code: "COP", flag: "🇨🇴" }, { code: "USD", flag: "🇺🇸" }, { code: "EUR", flag: "🇪🇺" }].map(c => (
              <button key={c.code} onClick={() => set("currency", c.code)}
                className={cn("p-3 rounded-xl border transition-all flex flex-col items-center gap-1 text-xs font-bold",
                  form.currency === c.code
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                )}>
                <span className="text-xl">{c.flag}</span>{c.code}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ingreso mensual</label>
            <input type="number" className={inputCls} value={form.monthlyIncome || ""}
              onChange={e => {
                const v = parseFloat(e.target.value);
                set("monthlyIncome", v);
                if (v > 0 && !form.emergencyFundGoal) set("emergencyFundGoal", v * 6);
              }}
              placeholder="0" />
          </div>
          <div>
            <label className={cn(labelCls, "flex items-center gap-1.5")}>
              Fondo de emergencia
              <div className="relative group">
                <Info size={11} className="text-white/30 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl text-[11px] text-white/70 leading-relaxed shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Red de seguridad: <span className="text-yellow-400 font-bold">3–6 meses</span> de gastos sin ingresos.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1a]" />
                </div>
              </div>
            </label>
            <input type="number" className={inputCls} value={form.emergencyFundGoal || ""} onChange={e => set("emergencyFundGoal", parseFloat(e.target.value))} placeholder="0" />
          </div>
        </div>
      </div>

      {/* ── META PRINCIPAL ───────────────────────── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center"><Brain size={18} className="text-orange-400" /></div>
            <h2 className="font-bold text-lg">Meta Principal</h2>
          </div>
          <SaveBtn section="meta" />
        </div>

        <p className="text-xs text-white/40 flex items-center gap-1.5">
          <Sparkles size={12} className="text-orange-400" />
          Método Brian Tracy — se escribe 10× al día en Mindset
        </p>

        <textarea
          value={form.mainGoal}
          onChange={e => set("mainGoal", e.target.value)}
          placeholder="Ej: Convertirme en desarrollador senior y ganar 10k USD/mes..."
          className={cn(inputCls, "h-28 resize-none")}
        />
      </div>
    </div>
  );
};
