// src/components/Goals.tsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Calendar, Trash2, Clock, ChevronRight,
  AlertTriangle, CheckCircle2, Flame, Target, Pencil,
} from "lucide-react";
import { api } from "../api";
import { useData } from "../hooks/useData";
import { useIsCompact } from "../hooks/useIsCompact";
import { cn } from "../lib/utils";
import { Goal } from "../types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function daysUntil(deadline: string): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function autoLevel(deadline: string): "90d" | "6m" | "2y" {
  const days = daysUntil(deadline);
  if (days === null) return "2y";
  if (days <= 90) return "90d";
  if (days <= 180) return "6m";
  return "2y";
}

function progressColor(p: number) {
  if (p < 30) return { bar: "bg-red-500", text: "text-red-400" };
  if (p < 70) return { bar: "bg-yellow-500", text: "text-yellow-400" };
  return { bar: "bg-emerald-500", text: "text-emerald-400" };
}

// ─── constants ────────────────────────────────────────────────────────────────

const LEVELS = [
  { id: "90d", label: "90 Días",  color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30"   },
  { id: "6m",  label: "6 Meses", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { id: "2y",  label: "2 Años",  color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
] as const;

const CATEGORIES = ["Personal", "Físico", "Financiero", "Académico", "Mental", "Relaciones", "Profesional"];
const PRIORITIES  = ["Alta", "Media", "Baja"] as const;

const PRIORITY_STYLE: Record<string, string> = {
  Alta:  "bg-red-500/15 text-red-400 border-red-500/30",
  Media: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Baja:  "bg-white/5 text-white/40 border-white/10",
};

const CATEGORY_STYLE: Record<string, string> = {
  Físico:       "bg-emerald-500/10 text-emerald-400",
  Financiero:   "bg-yellow-500/10 text-yellow-400",
  Académico:    "bg-blue-500/10 text-blue-400",
  Mental:       "bg-purple-500/10 text-purple-400",
  Relaciones:   "bg-pink-500/10 text-pink-400",
  Profesional:  "bg-cyan-500/10 text-cyan-400",
  Personal:     "bg-white/5 text-white/50",
};

// ─── empty form ───────────────────────────────────────────────────────────────

const emptyForm = () => ({
  title: "",
  description: "",
  deadline: "",
  level: "90d" as "90d" | "6m" | "2y",
  category: "Personal",
  priority: "Media" as "Alta" | "Media" | "Baja",
  progress: 0,
});

// ─── GoalModal ────────────────────────────────────────────────────────────────

interface GoalModalProps {
  goal?: Goal | null;
  onClose: () => void;
  onSave: (data: ReturnType<typeof emptyForm>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const GoalModal: React.FC<GoalModalProps> = ({ goal, onClose, onSave, onDelete }) => {
  const isCompact = useIsCompact();
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(
    goal
      ? {
          title:       goal.title,
          description: goal.description,
          deadline:    goal.deadline,
          level:       goal.level as "90d" | "6m" | "2y",
          category:    goal.category || "Personal",
          priority:    (goal.priority as "Alta" | "Media" | "Baja") || "Media",
          progress:    goal.progress,
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-assign level when deadline changes (only on create)
  const handleDeadlineChange = (val: string) => {
    set("deadline", val);
    if (!goal && val) set("level", autoLevel(val));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const days = form.deadline ? daysUntil(form.deadline) : null;
  const { text: pText } = progressColor(form.progress);

  return (
    <div className="mobile-modal-shell fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center gap-4 p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: infoExpanded && !isCompact ? -90 : 0 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="mobile-modal-card bg-[#111] border border-white/10 p-5 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl shrink-0 my-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{goal ? "Editar Meta" : "Nueva Meta"}</h2>
          {goal && onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-xl text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={18} />
            </button>
            )}
          </div>

          {!goal && isCompact && (
            <>
              <button
                type="button"
                onClick={() => setInfoExpanded((prev) => !prev)}
                className="w-full text-left text-xs font-bold text-purple-300 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                {infoExpanded ? "Ocultar guía rápida" : "Ver guía rápida"}
              </button>
              {infoExpanded && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 text-sm text-white/75 leading-relaxed">
                  <p>Las metas funcionan mejor cuando son claras, medibles y tienen fecha límite.</p>
                  <p className="text-xs text-white/45">Si dudas, reduce alcance y define el siguiente hito en vez de una meta ambigua.</p>
                </div>
              )}
            </>
          )}

          <div className="space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Título de la meta *"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors placeholder:text-white/20 font-medium text-white"
          />

          {/* Description */}
          <textarea
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors h-20 resize-none placeholder:text-white/20 text-sm text-white"
          />

          {/* Deadline + Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Fecha límite</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors text-white text-sm"
              />
              {days !== null && (
                <p className={cn("text-xs font-bold pl-1", days < 0 ? "text-red-400" : days <= 7 ? "text-yellow-400" : "text-white/30")}>
                  {days < 0 ? `Venció hace ${Math.abs(days)}d` : days === 0 ? "¡Vence hoy!" : `${days} días restantes`}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Horizonte</label>
              <select
                value={form.level}
                onChange={(e) => set("level", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors text-sm text-white"
              >
                {LEVELS.map((l) => <option key={l.id} value={l.id} className="bg-[#111] text-white">{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors text-sm text-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#111] text-white">{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Prioridad</label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => set("priority", p)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold border transition-all",
                      form.priority === p ? PRIORITY_STYLE[p] : "border-white/5 text-white/20 hover:border-white/20"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <label className="text-white/40 uppercase tracking-widest">Progreso</label>
              <span className={pText}>{form.progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={(e) => set("progress", Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${form.progress}%` }}
                className={cn("h-full rounded-full transition-all", progressColor(form.progress).bar)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-white/40 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 py-3 rounded-xl font-bold transition-colors text-white"
          >
            {saving ? "Guardando…" : goal ? "Guardar cambios" : "Crear meta"}
          </button>
        </div>
      </motion.div>

      {/* Panel informativo - Glassmorphism sin fondo sólido, texto siempre blanco */}
      {!goal && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="hidden lg:flex flex-col w-[560px] shrink-0"
        >
          {!infoExpanded ? (
            // Estado colapsado - sin fondo, solo texto blanco con sombra
            <div className="space-y-2 !text-white">
              <p className="text-sm italic leading-tight !text-white drop-shadow-lg">
                "¿Por qué la mayoría de metas fallan?"
              </p>
              <p className="text-xs !text-white drop-shadow-lg">
                — Estudios en psicología del comportamiento
              </p>
              <button
                onClick={() => setInfoExpanded(true)}
                className="mt-2 text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors drop-shadow-lg"
              >
                ver más...
              </button>
            </div>
          ) : (
            // Estado expandido - glassmorphism puro, sin fondo sólido
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="!bg-[#0d0d0d] !border !border-white/10 rounded-2xl p-6"
            >
              <div className="space-y-3 text-sm leading-relaxed !text-white">
                <p className="drop-shadow-md !text-white">
                  La mayoría de las metas no fallan por falta de motivación, sino por falta de claridad y estructura.
                </p>

                <p className="!text-white drop-shadow-md">Algunos de los errores más comunes son:</p>
                
                <ul className="list-disc list-inside space-y-1.5 !text-white drop-shadow-md">
                  <li>Definir metas demasiado generales (ej: "quiero ser más saludable")</li>
                  <li>No establecer una fecha límite clara</li>
                  <li>No medir el progreso</li>
                  <li>Depender únicamente de la motivación</li>
                  <li>Intentar hacer demasiados cambios al mismo tiempo</li>
                </ul>

                <p className="drop-shadow-md !text-white">
                  Cuando una meta no es específica ni medible, es difícil saber qué hacer exactamente o si se está avanzando.
                </p>

                <p className="drop-shadow-md !text-white">
                  Además, sin un plazo definido, es fácil postergar constantemente la acción.
                </p>

                <p className="!text-white drop-shadow-md">Las metas que tienen mayor probabilidad de cumplirse suelen ser:</p>
                
                <ul className="list-disc list-inside space-y-1.5 !text-white drop-shadow-md">
                  <li>Claras y específicas</li>
                  <li>Medibles</li>
                  <li>Realistas</li>
                  <li>Con un plazo definido</li>
                  <li>Acompañadas de seguimiento constante</li>
                </ul>

                <div className="pt-2">
                  <p className="font-semibold !text-white drop-shadow-md">En resumen:</p>
                  <p className="drop-shadow-md !text-white">
                    Las metas no fallan por falta de intención, sino por falta de <span className="text-purple-400 font-medium">estructura</span>.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <a
                    href="https://www.apa.org/topics/goals-motivation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-2 drop-shadow-md"
                  >
                    Fuente: apa.org/topics/goals-motivation
                  </a>
                </div>

                <button
                  onClick={() => setInfoExpanded(false)}
                  className="text-purple-400 hover:text-purple-300 text-xs transition-colors block drop-shadow-md"
                >
                  ver menos
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ─── GoalCard ─────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  levelColor: string;
  onEdit: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, levelColor, onEdit }) => {
  const days = goal.deadline ? daysUntil(goal.deadline) : null;
  const isExpired = days !== null && days < 0 && goal.progress < 100;
  const { bar, text } = progressColor(goal.progress);
  const catStyle = CATEGORY_STYLE[goal.category] || CATEGORY_STYLE.Personal;
  const priStyle = PRIORITY_STYLE[goal.priority] || PRIORITY_STYLE.Media;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onEdit}
      className="bg-[#0d0d0d] border border-white/8 p-5 rounded-2xl group relative cursor-pointer hover:border-white/20 transition-all hover:shadow-lg hover:shadow-black/40"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-bold text-base leading-tight text-white">{goal.title}</h4>
            {isExpired && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                <AlertTriangle size={10} />VENCIDA
              </span>
            )}
            {goal.progress === 100 && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={10} />COMPLETADA
              </span>
            )}
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", catStyle)}>
              {goal.category}
            </span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", priStyle)}>
              {goal.priority}
            </span>
          </div>
        </div>
        <div className="p-1.5 text-white/10 group-hover:text-white/40 transition-colors shrink-0">
          <Pencil size={14} />
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-xs text-white/40 mb-3 line-clamp-2 leading-relaxed">{goal.description}</p>
      )}

      {/* Deadline */}
      {goal.deadline && (
        <div className={cn(
          "flex items-center gap-1 text-xs mb-4 font-medium",
          isExpired ? "text-red-400" : days !== null && days <= 7 ? "text-yellow-400" : "text-white/30"
        )}>
          <Calendar size={11} />
          {isExpired
            ? `Venció hace ${Math.abs(days!)}d`
            : days === 0 ? "¡Vence hoy!"
            : days === 1 ? "Vence mañana"
            : days !== null ? `${days} días restantes`
            : goal.deadline}
        </div>
      )}

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-white/30 uppercase tracking-widest">Progreso</span>
          <span className={text}>{goal.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn("h-full rounded-full", bar)}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Goals (main) ─────────────────────────────────────────────────────────────

interface GoalsProps {
  openGoalModal?: boolean;
  onGoalModalOpened?: () => void;
}

const Goals: React.FC<GoalsProps> = ({ openGoalModal, onGoalModalOpened }) => {
  const { goals, refresh } = useData();
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  React.useEffect(() => {
    if (!openGoalModal) return;
    const t = setTimeout(() => {
      setSelectedGoal(null);
      setModalMode("create");
      onGoalModalOpened?.();
    }, 350);
    return () => clearTimeout(t);
  }, [openGoalModal]);

  const stats = useMemo(() => {
    const total = goals.length;
    const done  = goals.filter((g) => g.progress === 100).length;
    const expired = goals.filter((g) => {
      const d = daysUntil(g.deadline);
      return d !== null && d < 0 && g.progress < 100;
    }).length;
    const avgProgress = total ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / total) : 0;
    return { total, done, expired, avgProgress };
  }, [goals]);

  const openCreate = () => { setSelectedGoal(null); setModalMode("create"); };
  const openEdit   = (g: Goal) => { setSelectedGoal(g); setModalMode("edit"); };
  const closeModal = () => { setModalMode(null); setSelectedGoal(null); };

  const handleSave = async (form: ReturnType<typeof emptyForm>) => {
    if (modalMode === "create") {
      await api.addGoal({ ...form });
    } else if (selectedGoal) {
      await api.updateGoal(selectedGoal.id, { ...form });
    }
    refresh();
    closeModal();
  };

  const handleDelete = async () => {
    if (!selectedGoal) return;
    await api.deleteGoal(selectedGoal.id);
    refresh();
    closeModal();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Metas</h1>
          <p className="text-white/40 text-sm mt-1">Visualiza tu futuro y trabaja por él.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/25 text-sm self-start sm:self-auto"
        >
          <Plus size={18} />Nueva Meta
        </button>
      </div>

      {/* Stats strip */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total",      value: stats.total,       icon: <Target size={16} />,       color: "text-white/60" },
            { label: "Completadas",value: stats.done,         icon: <CheckCircle2 size={16} />, color: "text-emerald-400" },
            { label: "Vencidas",   value: stats.expired,     icon: <AlertTriangle size={16} />,color: "text-red-400" },
            { label: "Progreso avg",value: `${stats.avgProgress}%`, icon: <Flame size={16} />, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
              <span className={cn("shrink-0", s.color)}>{s.icon}</span>
              <div>
                <p className={cn("text-lg font-black leading-none", s.color)}>{s.value}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {LEVELS.map((level) => {
          const levelGoals = goals.filter((g) => g.level === level.id);
          return (
            <div key={level.id} className="space-y-4">
              {/* Column header */}
              <div className="flex items-center justify-between">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest border",
                  level.bg, level.color, level.border
                )}>
                  <Clock size={13} />{level.label}
                </div>
                <span className="text-xs text-white/20 font-bold">{levelGoals.length} meta{levelGoals.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                <AnimatePresence>
                  {levelGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      levelColor={level.color}
                      onEdit={() => openEdit(goal)}
                    />
                  ))}
                </AnimatePresence>

                {levelGoals.length === 0 && (
                  <button
                    onClick={openCreate}
                    className="w-full text-center py-10 border-2 border-dashed border-white/5 rounded-2xl text-white/15 text-xs font-bold uppercase tracking-widest hover:border-purple-600/30 hover:text-purple-500/40 transition-all"
                  >
                    + Agregar meta
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalMode && (
          <GoalModal
            goal={selectedGoal}
            onClose={closeModal}
            onSave={handleSave}
            onDelete={modalMode === "edit" ? handleDelete : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Goals;
