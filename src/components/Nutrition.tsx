// src/components/Nutrition.tsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Utensils, Trash2, Info, Zap, Droplets, Search,
  Pencil, X, ChevronDown, ChevronUp, BookOpen, Check,
  AlertCircle, CalendarDays, Sunrise, Sun, Moon, Cookie,
  Dumbbell, BedDouble, GlassWater,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useData } from "../hooks/useData";
import { useIsCompact } from "../hooks/useIsCompact";
import { cn } from "../lib/utils";
import { getLogicalDate } from "../lib/dateUtils";
import { Meal, FoodItem, NutritionRule } from "../types";

// ─── tipos locales ─────────────────────────────────────────────────────────────
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_GROUPS: { key: MealType; label: string; icon: React.ElementType; color: string }[] = [
  { key: "breakfast", label: "Desayuno", icon: Sunrise, color: "text-amber-400"  },
  { key: "lunch",     label: "Almuerzo", icon: Sun,     color: "text-orange-400" },
  { key: "dinner",    label: "Cena",     icon: Moon,    color: "text-indigo-400" },
  { key: "snack",     label: "Snack",    icon: Cookie,  color: "text-green-400"  },
];

const WATER_GOAL = 8; // vasos por día

// ─── helpers ───────────────────────────────────────────────────────────────────
function calcMacroTargets(kcal: number) {
  // proteína 30 %, carbs 40 %, grasas 30 %
  return {
    protein: Math.round((kcal * 0.30) / 4),
    carbs:   Math.round((kcal * 0.40) / 4),
    fat:     Math.round((kcal * 0.30) / 9),
  };
}

function macroConsistency(cal: number, p: number, c: number, f: number) {
  const estimated = p * 4 + c * 4 + f * 9;
  return Math.abs(estimated - cal) <= cal * 0.15;
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}
const MacroBar: React.FC<MacroBarProps> = ({ label, current, target, color, unit = "g" }) => {
  const pct = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-white/50 font-bold uppercase">
        <span>{label}</span>
        <span className={current > target ? "text-red-400" : "text-white/60"}>
          {current}{unit} / {target}{unit}
        </span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="text-[10px] text-white/30">
        {current >= target ? "✓ Meta alcanzada" : `Faltan ${remaining}${unit}`}
      </p>
    </div>
  );
};

// ─── modal de comida ──────────────────────────────────────────────────────────
interface MealModalProps {
  initial?: Meal | null;
  foodItems: FoodItem[];
  onSave: (data: Omit<Meal, "id" | "userId" | "date">, id?: string) => Promise<void>;
  onClose: () => void;
}

const MealModal: React.FC<MealModalProps> = ({ initial, foodItems, onSave, onClose }) => {
  const isCompact = useIsCompact();
  const [form, setForm] = useState({
    name:     initial?.name     ?? "",
    calories: initial?.calories ?? 0,
    protein:  initial?.protein  ?? 0,
    carbs:    initial?.carbs    ?? 0,
    fat:      initial?.fat      ?? 0,
    mealType: (initial?.mealType ?? "snack") as MealType,
  });
  const [search, setSearch] = useState("");
  const [showFoods, setShowFoods] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingFood, setSavingFood] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const filtered = foodItems.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const inconsistent = form.name && form.calories > 0 &&
    !macroConsistency(form.calories, form.protein, form.carbs, form.fat);

  function applyFood(f: FoodItem) {
    setForm(prev => ({
      ...prev,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
    }));
    setSearch("");
    setShowFoods(false);
  }

  async function handleSave() {
    if (!form.name || form.calories <= 0) return;
    setSaving(true);
    await onSave(form, initial?.id);
    setSaving(false);
    onClose();
  }

  async function handleSaveAsFood() {
    if (!form.name) return;
    setSavingFood(true);
    await api.addFoodItem({
      name: form.name,
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      servingSize: "1 porción",
    });
    setSavingFood(false);
  }

  return (
    <div className="mobile-modal-shell fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center gap-8 p-4 overflow-y-auto">
      <motion.div
        layout
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ layout: { duration: 0.35, ease: "easeInOut" } }}
        className="mobile-modal-card bg-[#111] border border-white/10 p-5 sm:p-8 rounded-3xl w-full max-w-md space-y-5 shrink-0"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {initial ? "Editar comida" : "Registrar comida"}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/80 transition-colors">
            <X size={20} />
          </button>
        </div>

        {isCompact && (
          <button
            type="button"
            onClick={() => setInfoExpanded((prev) => !prev)}
            className="w-full text-left text-xs font-bold text-orange-300/80 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
          >
            {infoExpanded ? "Ocultar tip nutricional" : "Ver tip nutricional"}
          </button>
        )}

        {isCompact && infoExpanded && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm text-white/75 leading-relaxed">
            <p>La hora de la comida pesa menos que el total diario y la calidad de lo que comes.</p>
            <p className="text-xs text-white/45">Prioriza consistencia, porciones y alimentos fáciles de repetir.</p>
          </div>
        )}

        {/* Búsqueda de alimentos guardados */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-orange-600 transition-colors">
            <Search size={16} className="text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Buscar alimento guardado…"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowFoods(true); }}
              onFocus={() => setShowFoods(true)}
              className="bg-transparent outline-none flex-1 text-sm"
            />
          </div>
          {showFoods && search && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-10 max-h-44 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-white/30 text-sm p-3">Sin resultados</p>
              ) : filtered.map(f => (
                <button
                  key={f.id}
                  onClick={() => applyFood(f)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <p className="text-sm font-bold">{f.name}</p>
                  <p className="text-[11px] text-white/40">
                    {f.calories} kcal · {f.protein}g P · {f.carbs}g C · {f.fat}g G
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nombre */}
        <input
          type="text"
          placeholder="Nombre de la comida"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-600 transition-colors text-sm"
        />

        {/* Tipo de comida */}
        <div className="grid grid-cols-4 gap-2">
          {MEAL_GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setForm({ ...form, mealType: g.key })}
              className={cn(
                "py-2 rounded-xl text-[11px] font-bold transition-all border",
                form.mealType === g.key
                  ? "bg-orange-600/20 border-orange-600/50 text-orange-400"
                  : "bg-white/5 border-white/5 text-white/40 hover:text-white/60"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Macros */}
        <div className="grid grid-cols-2 gap-3">
          {([
            ["Calorías", "calories", "kcal"],
            ["Proteína (g)", "protein", "g"],
            ["Carbs (g)", "carbs", "g"],
            ["Grasas (g)", "fat", "g"],
          ] as [string, keyof typeof form, string][]).map(([label, key]) => (
            <div key={key}>
              <label className="block text-[10px] text-white/40 font-bold uppercase mb-1">{label}</label>
              <input
                type="number"
                min={0}
                value={form[key] as number || ""}
                onChange={e => setForm({ ...form, [key]: Math.max(0, Number(e.target.value)) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-orange-600 transition-colors text-sm"
              />
            </div>
          ))}
        </div>

        {/* Aviso de inconsistencia */}
        {inconsistent && (
          <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 px-3 py-2 rounded-xl">
            <AlertCircle size={14} />
            Las calorías no coinciden con los macros (~
            {Math.round(form.protein * 4 + form.carbs * 4 + form.fat * 9)} kcal estimadas).
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSaveAsFood}
            disabled={savingFood || !form.name}
            title="Guardar en mi base de alimentos"
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30"
          >
            <BookOpen size={16} className="text-white/50" />
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-white/50 hover:bg-white/5 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || form.calories <= 0}
            className="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded-xl font-bold transition-colors text-sm disabled:opacity-40"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </motion.div>

      {/* Bloque informativo */}
      <div className="nutrition-info hidden lg:flex flex-col w-[440px] shrink-0">
        <AnimatePresence mode="wait">
          {!infoExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              <p className="text-white/70 text-sm italic leading-snug">
                "¿Comer de noche engorda?"
              </p>
              <p className="text-white/30 text-xs">
                — Harvard T.H. Chan School of Public Health
              </p>
              <button
                onClick={() => setInfoExpanded(true)}
                className="text-orange-400/60 hover:text-orange-400 text-xs transition-colors mt-1"
              >
                ver más…
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 space-y-3 text-sm text-white/75 leading-relaxed"
            >
              <p>
                Comer de noche <span className="text-white font-semibold">no engorda por sí mismo</span>. El aumento de peso depende principalmente del total de calorías consumidas a lo largo del día, no de la hora en que se comen.
              </p>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Sin embargo…</p>
              <ul className="space-y-1.5 text-white/65">
                {[
                  "Es más común consumir alimentos altos en calorías (snacks, ultraprocesados)",
                  "Se tiende a comer sin hambre real (por aburrimiento o hábito)",
                  "Es más difícil controlar las porciones",
                  "Puede afectar la calidad del sueño en algunas personas",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5 shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-white/55 text-xs">
                Además, algunos estudios sugieren que el cuerpo puede procesar los alimentos de forma ligeramente diferente en la noche, pero este efecto es menor comparado con el total calórico diario.
              </p>
              <div className="pt-1 border-t border-white/10">
                <p className="text-white/80 font-semibold text-xs">En resumen:</p>
                <p className="text-white/60 text-xs mt-0.5">
                  No es la hora lo que importa, sino <span className="text-orange-400">qué y cuánto comes</span>.
                </p>
              </div>
              <div className="backdrop-blur-md bg-white/5 rounded-xl px-4 py-3">
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-1">Fuente</p>
                <a
                  href="https://www.hsph.harvard.edu/nutritionsource/healthy-eating-plate/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400/70 hover:text-orange-400 text-xs transition-colors break-all"
                >
                  Harvard T.H. Chan — The Nutrition Source
                </a>
              </div>
              <button
                onClick={() => setInfoExpanded(false)}
                className="text-white/20 hover:text-white/50 text-xs transition-colors"
              >
                ver menos
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── modal de reglas ──────────────────────────────────────────────────────────
interface RulesModalProps {
  rules: NutritionRule[];
  onAdd: (rule: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}
const RulesModal: React.FC<RulesModalProps> = ({ rules, onAdd, onDelete, onClose }) => {
  const [newRule, setNewRule] = useState("");
  return (
    <div className="mobile-modal-shell fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="mobile-modal-card bg-[#111] border border-white/10 p-5 sm:p-8 rounded-3xl w-full max-w-md space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Reglas de Oro</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/80"><X size={20} /></button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {rules.map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
              <p className="text-sm flex-1 text-white/80">{r.rule}</p>
              <button onClick={() => onDelete(r.id)} className="text-white/20 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Sin reglas aún.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nueva regla…"
            value={newRule}
            onChange={e => setNewRule(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newRule.trim()) {
                onAdd(newRule.trim());
                setNewRule("");
              }
            }}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-600 transition-colors"
          />
          <button
            onClick={() => { if (newRule.trim()) { onAdd(newRule.trim()); setNewRule(""); } }}
            className="p-3 bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── componente principal ─────────────────────────────────────────────────────
interface NutritionProps {
  openMealModal?: boolean;
  onMealModalOpened?: () => void;
}

const Nutrition: React.FC<NutritionProps> = ({ openMealModal, onMealModalOpened }) => {
  const { profile } = useAuth();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const { meals, scheduleEvents, refresh } = useData();

  const today = getLogicalDate();

  // ── auto-detect gym day ──────────────────────────────────────────────────────
  const todayDow = new Date().getDay(); // 0=dom … 6=sáb
  const autoGymDay = useMemo(
    () => scheduleEvents.some(e => e.dayOfWeek === todayDow && e.type === "gym"),
    [scheduleEvents, todayDow]
  );
  const [isGymDay, setIsGymDay] = useState(autoGymDay);
  useEffect(() => setIsGymDay(autoGymDay), [autoGymDay]);

  // ── targets ──────────────────────────────────────────────────────────────────
  const targetKcal = isGymDay
    ? (profile?.gymTargetKcal || 1950)
    : (profile?.restTargetKcal || 1700);
  const macroTargets = useMemo(() => calcMacroTargets(targetKcal), [targetKcal]);
  const proteinTarget = profile?.proteinTarget || macroTargets.protein;

  // ── totales ──────────────────────────────────────────────────────────────────
  const totalCalories = meals.reduce((a, m) => a + m.calories, 0);
  const totalProtein  = meals.reduce((a, m) => a + m.protein,  0);
  const totalCarbs    = meals.reduce((a, m) => a + m.carbs,    0);
  const totalFat      = meals.reduce((a, m) => a + m.fat,      0);

  // ── agrupación ───────────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map: Record<MealType, Meal[]> = {
      breakfast: [], lunch: [], dinner: [], snack: [],
    };
    meals.forEach(m => {
      const t = (m.mealType as MealType) in map ? m.mealType as MealType : "snack";
      map[t].push(m);
    });
    return map;
  }, [meals]);

  // ── colapsados ───────────────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState<Record<MealType, boolean>>({
    breakfast: false, lunch: false, dinner: false, snack: false,
  });

  // ── agua ─────────────────────────────────────────────────────────────────────
  const [glasses, setGlasses] = useState(0);
  const [waterLoading, setWaterLoading] = useState(false);

  useEffect(() => {
    api.getWater(today).then(r => setGlasses(r.glasses));
  }, [today]);

  async function handleWater(n: number) {
    if (waterLoading) return;
    setWaterLoading(true);
    const next = Math.max(0, Math.min(n, WATER_GOAL));
    setGlasses(next);
    await api.setWater(today, next);
    setWaterLoading(false);
  }

  // ── food items ───────────────────────────────────────────────────────────────
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  useEffect(() => {
    api.getFoodItems().then(setFoodItems);
  }, []);

  // ── reglas ───────────────────────────────────────────────────────────────────
  const [rules, setRules] = useState<NutritionRule[]>([]);
  useEffect(() => {
    api.getNutritionRules().then(setRules);
  }, []);

  async function handleAddRule(rule: string) {
    const r = await api.addNutritionRule(rule);
    setRules(prev => [...prev, r]);
  }
  async function handleDeleteRule(id: string) {
    await api.deleteNutritionRule(id);
    setRules(prev => prev.filter(r => r.id !== id));
  }

  // ── modales ───────────────────────────────────────────────────────────────────
  const [showMealModal, setShowMealModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Abrir modal desde navegación externa (ej: IA → "Registrar comida")
  useEffect(() => {
    if (!openMealModal) return;
    const t = setTimeout(() => {
      setEditingMeal(null);
      setShowMealModal(true);
      onMealModalOpened?.();
    }, 350); // espera a que termine la transición de pestaña
    return () => clearTimeout(t);
  }, [openMealModal]);

  async function handleSaveMeal(
    data: Omit<Meal, "id" | "userId" | "date">,
    id?: string
  ) {
    if (id) {
      await api.updateMeal(id, data);
    } else {
      await api.addMeal({ date: today, ...data });
    }
    refresh();
    const items = await api.getFoodItems();
    setFoodItems(items);
  }

  async function handleDeleteMeal(id: string) {
    await api.deleteMeal(id);
    refresh();
  }

  // ─── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nutrición</h1>
          <p className="text-white/50 text-sm flex items-center gap-1 mt-0.5">
            <CalendarDays size={13} />{today}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0d0d0d] border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setIsGymDay(true)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              isGymDay ? "bg-orange-600 text-white" : "text-white/40 hover:text-white"
            )}
          >
            GYM DAY
          </button>
          <button
            onClick={() => setIsGymDay(false)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              !isGymDay ? "bg-blue-600 text-white" : "text-white/40 hover:text-white"
            )}
          >
            REST DAY
          </button>
        </div>
      </div>

      {/* Panel superior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Macros */}
        <div className="bg-[#0d0d0d] border border-white/10 p-5 sm:p-8 rounded-3xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Zap size={18} className="text-orange-500" />Macros del día
            </h3>
            <span className="flex items-center gap-1 text-xs text-white/40">
              {isGymDay
                ? <><Dumbbell size={13} className="text-orange-400" /> Gym</>
                : <><BedDouble size={13} className="text-blue-400" /> Rest</>}
            </span>
          </div>

          <MacroBar
            label="Calorías"
            current={totalCalories}
            target={targetKcal}
            color={totalCalories > targetKcal ? "bg-red-500" : "bg-orange-600"}
            unit=" kcal"
          />
          <MacroBar
            label="Proteína"
            current={Math.round(totalProtein)}
            target={proteinTarget}
            color="bg-blue-500"
          />
          <MacroBar
            label="Carbohidratos"
            current={Math.round(totalCarbs)}
            target={macroTargets.carbs}
            color="bg-green-500"
          />
          <MacroBar
            label="Grasas"
            current={Math.round(totalFat)}
            target={macroTargets.fat}
            color="bg-yellow-400"
          />
        </div>

        {/* Agua + Reglas */}
        <div className="space-y-4">
          {/* Agua */}
          <div className="bg-[#0d0d0d] border border-white/10 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Droplets size={18} className="text-blue-400" />Agua
              </h3>
              <span className="text-sm font-bold text-blue-400">
                {glasses} / {WATER_GOAL} vasos
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: WATER_GOAL }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleWater(i < glasses ? i : i + 1)}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    i < glasses
                      ? "bg-blue-600/80 text-white"
                      : "bg-white/5 text-white/20 hover:bg-white/10"
                  )}
                >
                  <GlassWater size={16} />
                </button>
              ))}
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
              <motion.div
                animate={{ width: `${(glasses / WATER_GOAL) * 100}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>

          {/* Reglas de Oro */}
          <div className="bg-orange-600/5 border border-orange-600/20 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn("font-bold flex items-center gap-2", isLight ? "text-gray-900" : "text-white")}>
                <Info size={18} className="text-orange-500" />Reglas de Oro
              </h3>
              <button
                onClick={() => setShowRulesModal(true)}
                className="text-xs text-orange-400/70 hover:text-orange-400 transition-colors"
              >
                Editar
              </button>
            </div>
            <ul className="space-y-2">
              {rules.slice(0, 4).map(r => (
                <li key={r.id} className="flex items-start gap-2 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                  {r.rule}
                </li>
              ))}
              {rules.length === 0 && (
                <p className="text-white/30 text-sm">
                  Sin reglas — presiona Editar para añadir.
                </p>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Comidas agrupadas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl">Comidas de hoy</h3>
          <button
            onClick={() => { setEditingMeal(null); setShowMealModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus size={16} />Añadir
          </button>
        </div>

        {MEAL_GROUPS.map(group => {
          const groupMeals = grouped[group.key];
          const isCollapsed = collapsed[group.key];
          const groupKcal = groupMeals.reduce((a, m) => a + m.calories, 0);

          return (
            <div key={group.key} className="bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setCollapsed(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                onKeyDown={e => e.key === "Enter" && setCollapsed(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
              >
                <div className="flex items-center gap-3">
                  <group.icon size={18} className={group.color} />
                  <span className="font-bold text-sm">{group.label}</span>
                  {groupMeals.length > 0 && (
                    <span className="text-[11px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      {groupKcal} kcal · {groupMeals.length} item{groupMeals.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setEditingMeal({ mealType: group.key } as Meal);
                      setShowMealModal(true);
                    }}
                    className="p-1.5 text-white/20 hover:text-orange-400 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                  {isCollapsed
                    ? <ChevronDown size={16} className="text-white/30" />
                    : <ChevronUp   size={16} className="text-white/30" />}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pt-2 pb-5 space-y-2">
                      {groupMeals.length === 0 ? (
                        <p className="text-white/20 text-sm text-center py-4 border border-dashed border-white/5 rounded-xl">
                          Sin comidas en {group.label.toLowerCase()}
                        </p>
                      ) : groupMeals.map(meal => (
                        <div
                          key={meal.id}
                          className="flex items-center justify-between group bg-white/3 hover:bg-white/5 rounded-xl px-4 py-3 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 shrink-0 bg-white/5 rounded-lg flex items-center justify-center">
                              <Utensils size={14} className="text-white/30" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{meal.name}</p>
                              <p className="text-[11px] text-white/40 truncate">
                                {meal.calories} kcal · {meal.protein}g P · {meal.carbs}g C · {meal.fat}g G
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingMeal(meal); setShowMealModal(true); }}
                              className="p-1.5 text-white/30 hover:text-blue-400 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMeal(meal.id)}
                              className="p-1.5 text-white/30 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Modales */}
      <AnimatePresence>
        {showMealModal && (
          <MealModal
            key="meal-modal"
            initial={editingMeal}
            foodItems={foodItems}
            onSave={handleSaveMeal}
            onClose={() => { setShowMealModal(false); setEditingMeal(null); }}
          />
        )}
        {showRulesModal && (
          <RulesModal
            key="rules-modal"
            rules={rules}
            onAdd={handleAddRule}
            onDelete={handleDeleteRule}
            onClose={() => setShowRulesModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Nutrition;
