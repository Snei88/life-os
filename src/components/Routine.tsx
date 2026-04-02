// src/components/Routine.tsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Clock, Pencil, Trash2, CalendarDays, LayoutGrid } from "lucide-react";
import { api } from "../api";
import { useData } from "../hooks/useData";
import { cn, getDayName } from "../lib/utils";
import { ScheduleEvent } from "../types";

// ─── constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun

const PALETTE = [
  { id: "blue",   label: "Clases",     hex: "#3b82f6" },
  { id: "green",  label: "Gym",        hex: "#22c55e" },
  { id: "purple", label: "Deporte",    hex: "#a855f7" },
  { id: "yellow", label: "Hobby",      hex: "#eab308" },
  { id: "orange", label: "Arte",       hex: "#f97316" },
  { id: "pink",   label: "Personal",   hex: "#ec4899" },
  { id: "cyan",   label: "Estudio",    hex: "#06b6d4" },
  { id: "red",    label: "Importante", hex: "#ef4444" },
  { id: "slate",  label: "Otro",       hex: "#94a3b8" },
] as const;

const COLOR_HEX: Record<string, string> = Object.fromEntries(PALETTE.map((p) => [p.id, p.hex]));

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function hasConflict(events: ScheduleEvent[], day: number, time: string, endTime: string, excludeId?: string): boolean {
  if (!endTime) return false;
  const start = timeToMin(time);
  const end   = timeToMin(endTime);
  return events
    .filter((e) => e.dayOfWeek === day && e.id !== excludeId && e.endTime)
    .some((e) => {
      const s = timeToMin(e.time);
      const en = timeToMin(e.endTime!);
      return start < en && end > s;
    });
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function isCurrentBlock(event: ScheduleEvent): boolean {
  const now = nowMinutes();
  const start = timeToMin(event.time);
  if (!event.endTime) return false;
  const end = timeToMin(event.endTime);
  return now >= start && now < end;
}

function formatDuration(time: string, endTime: string): string {
  if (!endTime) return "";
  const mins = timeToMin(endTime) - timeToMin(time);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ─── empty form ───────────────────────────────────────────────────────────────

const emptyForm = (day?: number) => ({
  title:      "",
  time:       "08:00",
  endTime:    "09:00",
  type:       "clase",
  color:      "blue",
  description:"",
  dayOfWeek:  day ?? 1,
  isFixed:    true,
});

// ─── EventModal ───────────────────────────────────────────────────────────────

interface EventModalProps {
  event?: ScheduleEvent | null;
  defaultDay?: number;
  allEvents: ScheduleEvent[];
  onClose: () => void;
  onSave: (data: ReturnType<typeof emptyForm>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const EventModal: React.FC<EventModalProps> = ({ event, defaultDay, allEvents, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(
    event
      ? {
          title:       event.title,
          time:        event.time,
          endTime:     event.endTime || "",
          type:        event.type,
          color:       event.color,
          description: event.description || "",
          dayOfWeek:   Number(event.dayOfWeek),
          isFixed:     Boolean(event.isFixed),
        }
      : emptyForm(defaultDay)
  );
  const [saving, setSaving] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const conflict = form.endTime
    ? hasConflict(allEvents, form.dayOfWeek, form.time, form.endTime, event?.id)
    : false;

  const duration = form.endTime ? formatDuration(form.time, form.endTime) : "";

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center gap-8 p-4 flex-wrap overflow-y-auto">
      {/* Modal Principal */}
      <motion.div
        layout
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ layout: { duration: 0.35, ease: "easeInOut" } }}
        className="bg-[#111] border border-white/10 p-8 rounded-3xl w-full max-w-md space-y-5 shrink-0 my-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{event ? "Editar actividad" : "Nueva actividad"}</h2>
          {event && onDelete && (
            <button onClick={onDelete} className="p-2 rounded-xl text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all">
              <Trash2 size={17} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nombre de la actividad *"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors placeholder:text-white/20 font-medium"
          />

          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors placeholder:text-white/20 text-sm"
          />

          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Día</label>
            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => set("dayOfWeek", d)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold transition-all",
                    form.dayOfWeek === d
                      ? "bg-orange-600 text-white"
                      : "bg-white/5 text-white/30 hover:bg-white/10"
                  )}
                >
                  {getDayName(d).slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Inicio</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40 uppercase tracking-widest font-bold">
                Fin {duration && <span className="text-orange-400 ml-1 normal-case">{duration}</span>}
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors text-sm"
              />
            </div>
          </div>

          {conflict && (
            <p className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
              ⚠️ Conflicto de horario detectado en ese día y franja.
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest font-bold">Categoría / Color</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { set("color", p.id); set("type", p.label.toLowerCase()); }}
                  title={p.label}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    form.color === p.id ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>
            {form.color && (
              <p className="text-xs text-white/30">
                {PALETTE.find((p) => p.id === form.color)?.label || form.type}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-white/40 hover:bg-white/5 transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim() || conflict}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 py-3 rounded-xl font-bold transition-colors"
          >
            {saving ? "Guardando…" : event ? "Guardar" : "Crear"}
          </button>
        </div>
      </motion.div>

      {/* Bloque Informativo ACSM - A la derecha */}
      <div className="hidden lg:flex flex-col w-[440px] shrink-0 my-auto">
        <AnimatePresence mode="wait">
          {!infoExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              <p className="!text-white text-sm italic leading-snug">
                "¿Entrenar todos los días es mejor para progresar?"
              </p>
              <p className="!text-white text-xs">
                — American College of Sports Medicine (ACSM)
              </p>
              <button
                onClick={() => setInfoExpanded(true)}
                className="text-orange-400 hover:text-orange-300 text-xs transition-colors mt-1"
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
              className="!bg-[#0d0d0d] !border !border-white/10 rounded-2xl p-6 space-y-3 text-sm !text-white leading-relaxed"
            >
              <p>
                Entrenar todos los días no necesariamente produce mejores resultados. De hecho, el progreso físico ocurre durante el descanso, cuando el cuerpo se recupera y se adapta al estímulo del entrenamiento.
              </p>

              <p className="!text-white text-xs font-semibold uppercase tracking-wider mt-4">
                Entrenar sin suficiente recuperación puede generar:
              </p>
              
              <ul className="space-y-1.5 !text-white">
                {[
                  "Fatiga acumulada",
                  "Disminución del rendimiento",
                  "Mayor riesgo de lesiones",
                  "Estancamiento en el progreso"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5 shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>

              <p>
                La mayoría de las personas obtiene mejores resultados entrenando entre 3 y 5 días por semana, dependiendo de su nivel, intensidad y objetivos.
              </p>

              <p>
                Además, es recomendable alternar grupos musculares o incluir días de descanso activo para permitir una recuperación adecuada.
              </p>

              <div className="pt-4 border-t border-white/10">
                <p className="!text-white font-semibold text-xs">En resumen:</p>
                <p className="!text-white text-xs mt-0.5">
                  Más entrenamiento no siempre es mejor. <span className="text-orange-400">Mejor recuperación = mejor progreso</span>.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl px-4 py-3">
                <p className="!text-white text-[10px] uppercase tracking-widest font-bold mb-1">Fuente</p>
                <a
                  href="https://www.acsm.org/docs/default-source/files-for-resource-library/acsm-guidelines-for-exercise-testing-and-prescription.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 text-xs transition-colors"
                >
                  ACSM — Guidelines for Exercise Testing and Prescription
                </a>
              </div>

              <button
                onClick={() => setInfoExpanded(false)}
                className="text-orange-400 hover:text-orange-300 text-xs transition-colors"
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

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: ScheduleEvent;
  onEdit: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
  const hex = COLOR_HEX[event.color] || COLOR_HEX.blue;
  const active = isCurrentBlock(event);
  const duration = event.endTime ? formatDuration(event.time, event.endTime) : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onEdit}
      className={cn(
        "p-3 rounded-xl border-l-[3px] cursor-pointer group transition-all",
        "bg-[#0d0d0d] border border-white/5 hover:border-white/15",
        active && "ring-1 ring-white/20 shadow-lg"
      )}
      style={{ borderLeftColor: hex }}
    >
      <div className="flex items-center gap-1 text-[10px] text-white/35 font-bold mb-0.5">
        <Clock size={9} />
        {event.time}{event.endTime ? `–${event.endTime}` : ""}
        {duration && <span className="text-white/20 ml-1">({duration})</span>}
        {active && <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${hex}25`, color: hex }}>AHORA</span>}
      </div>
      <p className="text-xs font-bold leading-tight truncate">{event.title}</p>
      {event.description && <p className="text-[10px] text-white/30 mt-0.5 truncate">{event.description}</p>}
      <div className="flex items-center gap-1 mt-1.5">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${hex}20`, color: hex }}>
          {PALETTE.find((p) => p.id === event.color)?.label || event.type}
        </span>
        <Pencil size={9} className="ml-auto text-white/0 group-hover:text-white/30 transition-colors" />
      </div>
    </motion.div>
  );
};

// ─── Today Timeline ───────────────────────────────────────────────────────────

const TodayTimeline: React.FC<{ events: ScheduleEvent[]; onEdit: (e: ScheduleEvent) => void; onAdd: () => void }> = ({ events, onEdit, onAdd }) => {
  const now = nowMinutes();
  const sorted = [...events].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  const nextIdx = sorted.findIndex((e) => timeToMin(e.time) > now);
  const next = nextIdx !== -1 ? sorted[nextIdx] : null;

  return (
    <div className="space-y-6">
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Hoy</p>
          <p className="text-2xl font-black">{sorted.length} actividades</p>
        </div>
        {next && (
          <div className="ml-auto text-right">
            <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Próxima</p>
            <p className="text-sm font-bold text-orange-400">{next.title}</p>
            <p className="text-xs text-white/40">{next.time}</p>
          </div>
        )}
        {sorted.length === 0 && (
          <p className="ml-auto text-sm text-white/20 font-bold">Día libre 🎉</p>
        )}
      </div>

      <div className="space-y-2 relative">
        {sorted.length === 0 && (
          <button
            onClick={onAdd}
            className="w-full py-10 border-2 border-dashed border-white/5 rounded-2xl text-white/15 text-xs font-bold uppercase tracking-widest hover:border-orange-600/30 hover:text-orange-500/40 transition-all"
          >
            + Agregar actividad para hoy
          </button>
        )}
        {sorted.map((event, i) => {
          const hex = COLOR_HEX[event.color] || COLOR_HEX.blue;
          const active = isCurrentBlock(event);
          const past = event.endTime ? timeToMin(event.endTime) < now : timeToMin(event.time) < now;
          const duration = event.endTime ? formatDuration(event.time, event.endTime) : "";

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onEdit(event)}
              className={cn(
                "flex gap-4 p-4 rounded-2xl border cursor-pointer group transition-all",
                active
                  ? "border-white/15 bg-white/5 shadow-lg"
                  : past
                  ? "border-white/5 bg-transparent opacity-40"
                  : "border-white/8 bg-[#0d0d0d] hover:border-white/15"
              )}
            >
              <div className="text-right shrink-0 w-14">
                <p className="text-xs font-black text-white/50">{event.time}</p>
                {event.endTime && <p className="text-[10px] text-white/20">{event.endTime}</p>}
              </div>

              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: hex }} />
                <div className="w-px flex-1 mt-1" style={{ backgroundColor: `${hex}30` }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("font-bold text-sm", past && "line-through")}>{event.title}</p>
                  {active && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: `${hex}25`, color: hex }}>
                      EN CURSO
                    </span>
                  )}
                </div>
                {event.description && <p className="text-xs text-white/30 mt-0.5">{event.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${hex}15`, color: hex }}>
                    {PALETTE.find((p) => p.id === event.color)?.label || event.type}
                  </span>
                  {duration && <span className="text-[10px] text-white/20">{duration}</span>}
                </div>
              </div>

              <Pencil size={13} className="shrink-0 text-white/0 group-hover:text-white/30 transition-colors self-start mt-1" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Routine (main) ───────────────────────────────────────────────────────────

const Routine: React.FC = () => {
  const { scheduleEvents, refresh } = useData();
  const todayIndex = new Date().getDay();

  const [view, setView]           = useState<"week" | "today">("today");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  const legend = useMemo(() => {
    const seen = new Map<string, string>();
    scheduleEvents.forEach((e) => {
      if (!seen.has(e.color)) seen.set(e.color, PALETTE.find((p) => p.id === e.color)?.label || e.type);
    });
    return Array.from(seen.entries()).map(([color, label]) => ({ color, label }));
  }, [scheduleEvents]);

  const todayEvents = scheduleEvents.filter((e) => e.dayOfWeek === todayIndex);

  const openCreate = (day?: number) => {
    setSelectedEvent(null);
    setSelectedDay(day ?? null);
    setModalMode("create");
  };

  const openEdit = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedEvent(null);
    setSelectedDay(null);
  };

  const handleSave = async (form: ReturnType<typeof emptyForm>) => {
    if (modalMode === "create") {
      await api.addScheduleEvent({
        dayOfWeek: form.dayOfWeek,
        time: form.time,
        endTime: form.endTime,
        title: form.title,
        type: form.type,
        color: form.color,
        isFixed: form.isFixed,
        description: form.description,
      });
    } else if (selectedEvent) {
      await api.updateScheduleEvent(selectedEvent.id, {
        dayOfWeek: form.dayOfWeek,
        time: form.time,
        endTime: form.endTime,
        title: form.title,
        type: form.type,
        color: form.color,
        isFixed: form.isFixed,
        description: form.description,
      });
    }
    refresh();
    closeModal();
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    await api.deleteScheduleEvent(selectedEvent.id);
    refresh();
    closeModal();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rutina Semanal</h1>
          <p className="text-white/40 text-sm mt-1">Estructura tu tiempo para maximizar el enfoque.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView("week")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", view === "week" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60")}
            >
              <LayoutGrid size={14} />Semana
            </button>
            <button
              onClick={() => setView("today")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all", view === "today" ? "bg-orange-600 text-white" : "text-white/30 hover:text-white/60")}
            >
              <CalendarDays size={14} />Hoy
            </button>
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-600/25 text-sm"
          >
            <Plus size={16} />Nueva
          </button>
        </div>
      </div>

      {view === "today" && (
        <TodayTimeline
          events={todayEvents}
          onEdit={openEdit}
          onAdd={() => openCreate(todayIndex)}
        />
      )}

      {view === "week" && (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-3 min-w-[900px]">
            {WEEK_DAYS.map((day) => {
              const dayEvents = scheduleEvents
                .filter((e) => e.dayOfWeek === day)
                .sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
              const isToday = day === todayIndex;

              return (
                <div key={day} className="flex flex-col gap-3">
                  <div className={cn(
                    "p-3 rounded-2xl text-center transition-all border",
                    isToday
                      ? "bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/20"
                      : "bg-white/3 text-white/40 border-white/5"
                  )}>
                    <p className="text-[10px] uppercase tracking-widest font-black">
                      {isToday ? "Hoy" : getDayName(day).slice(0, 3)}
                    </p>
                    <p className="text-sm font-bold mt-0.5">{getDayName(day)}</p>
                    <p className="text-[10px] mt-0.5 opacity-60">{dayEvents.length} act.</p>
                  </div>

                  <div className="space-y-2 flex-1">
                    <AnimatePresence>
                      {dayEvents.map((event) => (
                        <EventCard key={event.id} event={event} onEdit={() => openEdit(event)} />
                      ))}
                    </AnimatePresence>

                    <button
                      onClick={() => openCreate(day)}
                      className="w-full py-5 border border-dashed border-white/5 rounded-xl text-white/10 text-[10px] font-bold uppercase tracking-widest hover:border-orange-600/30 hover:text-orange-500/40 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {legend.length > 0 && (
        <div className="flex flex-wrap gap-3 p-5 bg-[#0d0d0d] border border-white/8 rounded-2xl">
          {legend.map(({ color, label }) => (
            <div key={color} className="flex items-center gap-2 text-xs font-bold text-white/40">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_HEX[color] }} />
              {label}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalMode && (
          <EventModal
            event={selectedEvent}
            defaultDay={selectedDay ?? todayIndex}
            allEvents={scheduleEvents}
            onClose={closeModal}
            onSave={handleSave}
            onDelete={modalMode === "edit" ? handleDelete : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Routine;
