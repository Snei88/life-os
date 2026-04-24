//src/components/Mindset.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Quote, PenTool, Heart, CheckCircle2, Target, Sparkles,
  ChevronRight, Save, RotateCcw, Eye, X, CheckCircle,
  Circle, BookOpen
} from "lucide-react";
import { api } from "../api";
import { useData } from "../hooks/useData";
import { cn } from "../lib/utils";
import { getLogicalDate } from "../lib/dateUtils";
import { JournalEntry } from "../types";
import { AIModuleStrip } from "./AIModuleStrip";

interface HistoryRecord {
  date: string;
  affirmation: string;
  gratitude: string[];
  journalText: string;
  goal: string;
  btCompleted: boolean;
}

// ── Indicador de práctica completa ──────────────────────────────────────────
function PracticeIndicator({
  affirmation, gratitude, journalText, btCount,
}: { affirmation: string; gratitude: string[]; journalText: string; btCount: number }) {
  const steps = [
    { label: "Afirmación",  done: affirmation.trim() !== "" },
    { label: "Gratitud",    done: gratitude.every((g) => g.trim() !== "") },
    { label: "Journaling",  done: journalText.trim() !== "" },
    { label: "Meta x10",    done: btCount === 10 },
  ];
  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-3xl border transition-all duration-500",
        allDone
          ? "bg-orange-600/10 border-orange-600/40"
          : "bg-[#0d0d0d] border-white/10"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Sparkles size={18} className={allDone ? "text-orange-500" : "text-white/30"} />
          Práctica Diaria
        </h3>
        <span className={cn("text-xs font-black uppercase tracking-widest", allDone ? "text-orange-500" : "text-white/30")}>
          {completed}/4
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            {s.done
              ? <CheckCircle size={16} className="text-orange-500 shrink-0" />
              : <Circle size={16} className="text-white/20 shrink-0" />}
            <span className={cn("text-xs font-bold", s.done ? "text-white" : "text-white/30")}>{s.label}</span>
          </div>
        ))}
      </div>

      {allDone && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-sm font-bold text-orange-400"
        >
          ¡Práctica completa del día! 🔥
        </motion.p>
      )}
    </motion.div>
  );
}

// ── Modal de detalle ─────────────────────────────────────────────────────────
function DetailModal({ record, onClose }: { record: HistoryRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0d0d0d] border border-white/10 p-5 sm:p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{record.date}</h2>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">Afirmación</p>
          <p className="text-white/80 italic bg-white/5 p-4 rounded-2xl">{record.affirmation || "—"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Gratitud</p>
          <ul className="space-y-2">
            {(record.gratitude || []).map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-white/80 bg-white/5 p-3 rounded-xl">
                <span className="text-white/30 font-bold text-xs mt-0.5">{i + 1}</span>
                <span>{g || "—"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Journaling</p>
          <p className="text-white/80 bg-white/5 p-4 rounded-2xl leading-relaxed whitespace-pre-wrap">{record.journalText || "—"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">Meta Principal (Brian Tracy)</p>
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl">
            {record.btCompleted
              ? <CheckCircle size={18} className="text-orange-500 shrink-0" />
              : <Circle size={18} className="text-white/20 shrink-0" />}
            <p className="text-white/80">{record.goal || "—"}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
const Mindset: React.FC = () => {
  const { journalEntries, brianTracyLogs, refresh } = useData();

  const [affirmation, setAffirmation]   = useState("");
  const [journalText, setJournalText]   = useState("");
  const [gratitude, setGratitude]       = useState(["", "", ""]);
  const [brianTracyGoal, setBrianTracyGoal] = useState("");
  const [brianTracyCount, setBrianTracyCount] = useState(0);
  const [isSaved, setIsSaved]           = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [history, setHistory]           = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  const today = getLogicalDate();
  const entry = journalEntries.find((journal) => journal.date === today) || null;
  const brianLog = brianTracyLogs.find((log) => log.date === today) || null;

  // Carga datos de hoy
  useEffect(() => {
    if (entry) {
      setAffirmation(entry.affirmation || "");
      setJournalText(entry.journalText || "");
      setGratitude(entry.gratitude?.length === 3 ? entry.gratitude : ["", "", ""]);
    } else {
      setAffirmation("");
      setJournalText("");
      setGratitude(["", "", ""]);
    }
    if (brianLog) {
      setBrianTracyGoal(brianLog.goal || "");
      setBrianTracyCount(brianLog.completed ? 10 : 0);
    } else {
      setBrianTracyGoal("");
      setBrianTracyCount(0);
    }
  }, [entry, brianLog]);

  // Carga historial
  const loadHistory = useCallback(async () => {
    const [journals, brians] = await Promise.all([
      api.getAllJournalEntries(),
      api.getAllBrianTracyLogs(),
    ]);
    const brianByDate: Record<string, { goal: string; completed: boolean }> =
      Object.fromEntries((brians || []).map((b: { date: string; goal: string; completed: boolean }) => [b.date, b]));
    const records: HistoryRecord[] = (journals || []).map((j: JournalEntry) => ({
      date: j.date,
      affirmation: j.affirmation,
      gratitude: j.gratitude || [],
      journalText: j.journalText,
      goal: brianByDate[j.date]?.goal || "",
      btCompleted: brianByDate[j.date]?.completed || false,
    }));
    setHistory(records);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Reset automático a medianoche (revisa cada minuto)
  useEffect(() => {
    const mounted = getLogicalDate();
    const interval = setInterval(() => {
      if (getLogicalDate() !== mounted) handleResetDailyFocus();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveMindset = async () => {
    setIsSaving(true);
    try {
      const normalizedGratitude = gratitude.map((item) => item.trim());

      await api.saveJournal({
        date: today,
        affirmation: affirmation.trim(),
        journalText: journalText.trim(),
        gratitude: normalizedGratitude,
        reflection: "",
      });
      await api.saveBrianTracy({
        date: today,
        goal: brianTracyGoal.trim(),
        completed: brianTracyCount === 10,
      });

      await Promise.all([refresh(), loadHistory()]);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrianTracyCheck = async (index: number) => {
    const newCount = index + 1;
    setBrianTracyCount(newCount);
    if (newCount === 10) {
      await api.saveBrianTracy({ date: today, goal: brianTracyGoal, completed: true });
      refresh();
    }
  };

  const handleResetDailyFocus = () => {
    setAffirmation("");
    setJournalText("");
    setGratitude(["", "", ""]);
    setBrianTracyGoal("");
    setBrianTracyCount(0);
    setIsSaved(false);
    refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mindset</h1>
          <p className="text-white/60">Domina tu mente, domina tu destino.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={handleResetDailyFocus}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Restablecer foco</span>
            <span className="sm:hidden">Reset</span>
          </button>
          <button
            onClick={handleSaveMindset}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60",
              isSaved
                ? "bg-green-600 text-white"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            )}
          >
            {isSaved ? <CheckCircle size={14} /> : <Save size={14} />}
            <span className="hidden sm:inline">{isSaved ? "¡Guardado!" : isSaving ? "Guardando..." : "Guardar Mindset"}</span>
            <span className="sm:hidden">{isSaved ? "✓" : isSaving ? "..." : "Guardar"}</span>
          </button>
        </div>
      </div>

      {/* Indicador práctica completa */}
      <AIModuleStrip
        moduleId="mindset"
        title="Mindset"
        subtitle="La IA puede detectar bloqueos, leer tu practica diaria y conectar tu estado mental con disciplina, metas y finanzas."
        prompts={[
          "Analiza mi mindset y dime que patron ves.",
          "Ayudame a escribir una reflexion util para hoy.",
          "Conecta mi mindset con los otros modulos y dime que corregir.",
        ]}
      />

      <PracticeIndicator
        affirmation={affirmation}
        gratitude={gratitude}
        journalText={journalText}
        btCount={brianTracyCount}
      />

      {/* Afirmación + Gratitud + Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d0d0d] border border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Quote size={18} className="text-orange-500" />Afirmación del Día</h3>
            <textarea
              value={affirmation}
              onChange={(e) => setAffirmation(e.target.value)}
              placeholder="Yo soy capaz de..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-orange-500 transition-colors h-24 resize-none italic"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0d0d0d] border border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold flex items-center gap-2"><Heart size={18} className="text-red-500" />Gratitud</h3>
            <div className="space-y-3">
              {gratitude.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white/20">{i + 1}</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => { const g = [...gratitude]; g[i] = e.target.value; setGratitude(g); }}
                    placeholder="Hoy agradezco por..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0d0d0d] border border-white/10 p-5 sm:p-8 rounded-3xl space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-2"><PenTool size={20} className="text-blue-500" />Journaling</h3>
              <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{today}</span>
            </div>
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Escribe tus pensamientos, miedos, victorias..."
              className="flex-1 w-full min-h-[200px] bg-transparent border-none outline-none text-white/80 leading-relaxed resize-none text-lg placeholder:text-white/10"
            />
          </motion.div>
        </div>
      </div>

      {/* Brian Tracy */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-linear-to-br from-[#0d0d0d] to-[#1a1a1a] border border-orange-600/20 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><Target size={200} /></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Brian Tracy</span>
                <span className="text-orange-500 font-bold text-sm">Meta x 10</span>
              </div>
              <h3 className="text-xl sm:text-3xl font-bold tracking-tight">Escribe tu meta principal 10 veces</h3>
              <p className="text-white/40 mt-2">Reprograma tu RAS para el éxito absoluto.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center min-w-[140px]">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Completado</p>
              <p className="text-3xl font-black text-orange-500">{brianTracyCount} / 10</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs font-bold text-white/20 w-4">{i + 1}</span>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={brianTracyGoal}
                    onChange={(e) => setBrianTracyGoal(e.target.value)}
                    placeholder="Escribe tu meta aquí..."
                    className={cn(
                      "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none transition-all",
                      i < brianTracyCount ? "border-orange-600/50 text-orange-500/80" : "focus:border-orange-600"
                    )}
                  />
                  {i < brianTracyCount && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500"><CheckCircle2 size={16} /></div>}
                </div>
                <button
                  onClick={() => handleBrianTracyCheck(i)}
                  disabled={i !== brianTracyCount}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    i < brianTracyCount ? "bg-orange-600 text-white" :
                    i === brianTracyCount ? "bg-white/10 text-white hover:bg-orange-600/20" :
                    "bg-white/5 text-white/10 cursor-not-allowed"
                  )}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Historial de registros diarios */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <BookOpen size={20} className="text-purple-500" />
            Registros Diarios
          </h3>
          <div className="overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Fecha</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Afirmación</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Gratitud</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Journal</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Meta x10</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {history.map((rec, i) => (
                  <tr key={rec.date} className={cn("border-b border-white/5 hover:bg-white/5 transition-colors", i === 0 && rec.date === today && "bg-orange-600/5")}>
                    <td className="px-4 py-3 font-bold text-orange-400 whitespace-nowrap">{rec.date}</td>
                    <td className="px-4 py-3 text-white/60 max-w-[180px] truncate">{rec.affirmation || <span className="text-white/20">—</span>}</td>
                    <td className="px-4 py-3 text-white/60">
                      <span className="text-xs">
                        {rec.gratitude?.filter(g => g).length || 0}/3
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 max-w-[200px] truncate">{rec.journalText || <span className="text-white/20">—</span>}</td>
                    <td className="px-4 py-3">
                      {rec.btCompleted
                        ? <CheckCircle size={16} className="text-orange-500" />
                        : <Circle size={16} className="text-white/20" />}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white/60 hover:text-white transition-all"
                      >
                        <Eye size={12} />
                        Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      <AnimatePresence>
        {selectedRecord && (
          <DetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mindset;
