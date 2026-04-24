// src/components/Gym.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Dumbbell, TrendingUp, CheckCircle2, Activity, 
  ChevronDown, ChevronUp, Clock, Flame, Trophy,
  Play, RotateCcw, Save, X, Timer, Pencil, Trash2
} from "lucide-react";
import { api } from "../api";
import { useData } from "../hooks/useData";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";
import { getLogicalDate } from "../lib/dateUtils";
import type { WorkoutRoutine, WorkoutSession, SessionExercise, GymStats } from "../types";
import { AIModuleStrip } from "./AIModuleStrip";

const Gym: React.FC = () => {
  const { refresh } = useData();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const today = getLogicalDate();
  
  // Estados
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [stats, setStats] = useState<GymStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI Estados
  const [showNewRoutine, setShowNewRoutine] = useState(false);
  const [showStartSession, setShowStartSession] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [infoExpanded, setInfoExpanded] = useState(false); // Para el texto ACSM
  
  // Estados para edición de rutinas
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Formulario nueva/editar rutina
  const [routineForm, setRoutineForm] = useState({
    name: "",
    type: "strength" as "strength" | "cardio" | "swimming",
    exercises: [{ name: "", sets: 4, reps: 10, baseWeight: 0, restSeconds: 90 }]
  });

  useEffect(() => {
    loadData();
  }, []);

  // Timer para sesión activa
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeSession?.status === 'active' && activeSession?.startedAt) {
      const startTime = new Date(activeSession.startedAt).getTime();

      const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
      setSessionTimer(initialElapsed);

      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSessionTimer(elapsed);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [activeSession?.id, activeSession?.status, activeSession?.startedAt]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [routinesData, activeSessions, statsData] = await Promise.all([
        api.getRoutines(),
        api.getWorkoutSessions(today, 'active'),
        api.getGymStats(),
      ]);
      
      setRoutines(routinesData);
      setStats(statsData);
      
      if (activeSessions.length > 0) {
        setActiveSession(activeSessions[0]);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Resetear formulario
  const resetForm = () => {
    setRoutineForm({
      name: "",
      type: "strength",
      exercises: [{ name: "", sets: 4, reps: 10, baseWeight: 0, restSeconds: 90 }]
    });
  };

  // Abrir modal de edición
  const openEditModal = (routine: WorkoutRoutine) => {
    setEditingRoutine(routine);
    setRoutineForm({
      name: routine.name,
      type: routine.type,
      exercises: routine.exercises.length > 0 ? routine.exercises : [{ name: "", sets: 4, reps: 10, baseWeight: 0, restSeconds: 90 }]
    });
    setShowEditModal(true);
  };

  // Crear rutina
  const handleCreateRoutine = async () => {
    const validExercises = routineForm.exercises.filter(e => e.name.trim());
    if (!routineForm.name.trim() || validExercises.length === 0) return;

    try {
      await api.addRoutine({
        name: routineForm.name,
        type: routineForm.type,
        exercises: validExercises,
      });
      
      setShowNewRoutine(false);
      resetForm();
      loadData();
    } catch (err) {
      alert("Error creando rutina");
    }
  };

  // Actualizar rutina
  const handleUpdateRoutine = async () => {
    if (!editingRoutine) return;
    const validExercises = routineForm.exercises.filter(e => e.name.trim());
    if (!routineForm.name.trim() || validExercises.length === 0) return;

    try {
      // Nota: Necesitarás agregar este endpoint en api.ts
      await api.updateRoutine(editingRoutine.id, {
        name: routineForm.name,
        type: routineForm.type,
        exercises: validExercises,
      });
      
      setShowEditModal(false);
      setEditingRoutine(null);
      resetForm();
      loadData();
    } catch (err) {
      alert("Error actualizando rutina");
    }
  };

  // Eliminar rutina
  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm("¿Eliminar esta rutina permanentemente?")) return;
    
    try {
      await api.deleteRoutine(routineId);
      loadData();
    } catch (err) {
      alert("Error eliminando rutina");
    }
  };

  // Iniciar sesión
  const handleStartSession = async (routineId: string) => {
    try {
      const session = await api.startWorkoutSession({
        routineId,
        date: today,
      });
      setActiveSession(session);
      setShowStartSession(false);
      // Timer inicia automáticamente por el useEffect
      refresh();
    } catch (err: any) {
      alert(err.message || "Error iniciando sesión");
    }
  };

  // Actualizar serie
  const handleSetUpdate = async (
    exercise: SessionExercise, 
    setIndex: number, 
    field: 'reps' | 'weight' | 'completed', 
    value: number | boolean
  ) => {
    const newSets = [...exercise.completedSets];
    newSets[setIndex] = {
      ...newSets[setIndex],
      [field]: value,
      ...(field === 'completed' && value ? { completedAt: new Date().toISOString() } : {})
    };

    const allCompleted = newSets.every(s => s.completed);
    
    try {
      await api.updateSessionExercise(activeSession!.id, exercise.id, {
        completedSets: newSets,
        isCompleted: allCompleted,
      });
      
      setActiveSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises?.map(ex => 
            ex.id === exercise.id 
              ? { ...ex, completedSets: newSets, isCompleted: allCompleted }
              : ex
          )
        };
      });

      // Si todos los ejercicios están completados, ofrecer finalizar
      const updatedExercises = activeSession?.exercises?.map(ex => 
        ex.id === exercise.id ? { ...ex, isCompleted: allCompleted } : ex
      );
      const allExercisesCompleted = updatedExercises?.every(e => e.isCompleted);
      
      if (allExercisesCompleted && field === 'completed' && value) {
        setTimeout(() => {
          if (confirm("¡Has completado todos los ejercicios! ¿Deseas finalizar la sesión?")) {
            handleFinishSession();
          }
        }, 500);
      }
    } catch (err) {
      console.error("Error actualizando ejercicio:", err);
    }
  };

  // Finalizar sesión
  const handleFinishSession = async () => {
    if (!activeSession) return;
    
    const completedCount = activeSession.exercises?.filter(e => e.isCompleted).length || 0;
    const totalExercises = activeSession.exercises?.length || 0;
    
    if (completedCount < totalExercises) {
      if (!confirm(`Has completado ${completedCount} de ${totalExercises} ejercicios. ¿Finalizar de todos modos?`)) {
        return;
      }
    }

    try {
      const finishedSession: any = await api.finishWorkoutSession(activeSession.id);
      const durationSeconds = finishedSession?.durationSeconds ?? sessionTimer;
      const durationText = formatTime(Number(durationSeconds));
      setActiveSession(null);
      setSessionTimer(0);
      refresh();
      loadData();
      alert(`Sesión finalizada. Duración: ${durationText}`);
    } catch (err) {
      alert("Error finalizando sesión");
    }
  };

  // Cancelar sesión
  const handleCancelSession = async () => {
    if (!activeSession) return;
    if (!confirm("¿Cancelar esta sesión? Se perderá el progreso.")) return;

    try {
      await api.deleteWorkoutSession(activeSession.id);
      setActiveSession(null);
      setSessionTimer(0);
      refresh();
    } catch (err) {
      alert("Error cancelando sesión");
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", isLight ? "text-gray-900" : "text-white")}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-8 min-h-screen", isLight ? "text-gray-900" : "text-white")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Entrenamiento</h1>
          <p className={cn("mt-1", isLight ? "text-gray-600" : "text-white/60")}>
            Supera tus límites físicos.
          </p>
        </div>
        {!activeSession && (
          <button 
            onClick={() => setShowStartSession(true)} 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/30"
          >
            <Plus size={20} />Nueva Sesión
          </button>
        )}
      </div>

      <AIModuleStrip
        moduleId="gym"
        title="Gym"
        subtitle="La IA puede leer tus rutinas, sesiones y rachas para proponerte progresion o correccion dentro del sistema."
        prompts={[
          "Analiza mi progreso en gym y dime que patron ves.",
          "Proponme una mejora real para mi rutina.",
          "Detecta si estoy perdiendo consistencia en entrenamiento.",
        ]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Racha Actual", icon: Flame, color: "text-orange-500", value: stats?.currentStreak || 0, unit: "días" },
          { label: "Récord", icon: Trophy, color: "text-yellow-500", value: stats?.longestStreak || 0, unit: "días" },
          { label: "Volumen 7d", icon: TrendingUp, color: "text-green-500", value: ((stats?.recentVolume || 0) / 1000).toFixed(1), unit: "ton" },
          { label: "Total Sesiones", icon: Dumbbell, color: "text-blue-500", value: stats?.totalWorkouts || 0, unit: "" },
        ].map((stat, i) => (
          <div key={i} className={cn(
            "border p-4 sm:p-6 rounded-3xl transition-colors",
            isLight ? "bg-white border-gray-200 shadow-sm" : "bg-[#0d0d0d] border-white/10"
          )}>
            <p className={cn("text-xs font-bold uppercase tracking-widest mb-1 truncate", isLight ? "text-gray-500" : "text-white/40")}>
              {stat.label}
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <stat.icon className={stat.color} size={20} />
              <p className="text-xl sm:text-3xl font-black">{stat.value}</p>
              {stat.unit && <span className={cn("text-xs sm:text-sm font-bold", isLight ? "text-gray-500" : "text-white/40")}>{stat.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Sesión Activa */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "border rounded-3xl overflow-hidden",
              isLight ? "bg-gradient-to-br from-green-50 to-white border-green-200" : "bg-gradient-to-br from-green-900/20 to-[#0d0d0d] border-green-500/30"
            )}
          >
            {/* Header de sesión */}
            <div className={cn("p-4 sm:p-6 border-b flex items-center justify-between gap-3", isLight ? "border-green-200" : "border-green-500/20")}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider", isLight ? "bg-green-100 text-green-700" : "bg-green-500/20 text-green-400")}>
                    <Activity size={12} /> En Progreso
                  </span>
                  <span className={cn("text-sm", isLight ? "text-gray-500" : "text-white/40")}>
                    {routines.find(r => r.id === activeSession.routineId)?.name || "Entrenamiento"}
                  </span>
                </div>
                <div className={cn("flex items-center gap-4 text-sm", isLight ? "text-gray-600" : "text-white/60")}>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock size={14} /> {formatTime(sessionTimer)}
                  </span>
                  <span>
                    {activeSession.exercises?.filter(e => e.isCompleted).length || 0} / {activeSession.exercises?.length || 0} ejercicios
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCancelSession}
                  className={cn("p-2 rounded-xl transition-all", isLight ? "bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600" : "bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400")}
                >
                  <X size={20} />
                </button>
                <button
                  onClick={handleFinishSession}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-lg shadow-green-600/20 text-sm"
                >
                  <CheckCircle2 size={16} /> <span>Finalizar</span>
                </button>
              </div>
            </div>

            {/* Lista de ejercicios */}
            <div className="p-4 sm:p-6 space-y-4">
              {activeSession.exercises?.map((exercise) => (
                <div 
                  key={exercise.id}
                  className={cn(
                    "rounded-2xl border transition-all",
                    exercise.isCompleted 
                      ? (isLight ? 'border-green-400 bg-green-50' : 'border-green-500/50 bg-green-500/10')
                      : (isLight ? 'border-gray-200 bg-white hover:border-gray-300' : 'border-white/10 bg-black/30 hover:border-white/20')
                  )}
                >
                  <button
                    onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", exercise.isCompleted ? 'bg-green-500 text-white' : (isLight ? 'bg-gray-100 text-gray-600' : 'bg-white/10 text-white'))}>
                        {exercise.isCompleted ? <CheckCircle2 size={16} /> : <Dumbbell size={16} />}
                      </div>
                      <div className="text-left">
                        <p className={cn("font-bold", exercise.isCompleted ? 'text-green-600' : '')}>
                          {exercise.exerciseName}
                        </p>
                        <p className={cn("text-xs", isLight ? "text-gray-500" : "text-white/40")}>
                          Objetivo: {exercise.targetSets}×{exercise.targetReps}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs", isLight ? "text-gray-500" : "text-white/40")}>
                        {exercise.completedSets.filter(s => s.completed).length}/{exercise.targetSets} series
                      </span>
                      {expandedExercise === exercise.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedExercise === exercise.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <div className="space-y-2">
                            {exercise.completedSets.map((set, idx) => (
                              <div 
                                key={idx}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl",
                                  set.completed 
                                    ? (isLight ? 'bg-green-100' : 'bg-green-500/20')
                                    : (isLight ? 'bg-gray-50' : 'bg-white/5')
                                )}
                              >
                                <span className={cn("text-xs sm:text-sm font-bold w-10 sm:w-12 shrink-0", isLight ? "text-gray-500" : "text-white/40")}>
                                  S{idx + 1}
                                </span>

                                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 flex-wrap">
                                  <input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) => handleSetUpdate(exercise, idx, 'reps', parseInt(e.target.value) || 0)}
                                    className={cn("w-14 sm:w-16 border rounded-lg px-2 py-1 text-center text-sm", isLight ? "bg-white border-gray-200" : "bg-black/50 border-white/10")}
                                    placeholder="Reps"
                                  />
                                  <span className={cn("text-xs", isLight ? "text-gray-400" : "text-white/40")}>×</span>
                                  <input
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) => handleSetUpdate(exercise, idx, 'weight', parseFloat(e.target.value) || 0)}
                                    className={cn("w-16 sm:w-20 border rounded-lg px-2 py-1 text-center text-sm", isLight ? "bg-white border-gray-200" : "bg-black/50 border-white/10")}
                                    placeholder="Peso"
                                  />
                                  <span className={cn("text-xs", isLight ? "text-gray-400" : "text-white/40")}>kg</span>
                                </div>

                                <button
                                  onClick={() => handleSetUpdate(exercise, idx, 'completed', !set.completed)}
                                  className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", set.completed ? 'bg-green-500 text-white' : (isLight ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-white/10 text-white/40 hover:bg-white/20'))}
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rutinas Disponibles (solo si no hay sesión activa) */}
      {!activeSession && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn("font-bold text-xl flex items-center gap-2", isLight ? "text-gray-900" : "text-white")}>
              <RotateCcw size={20} className="text-green-500" /> Mis Rutinas
            </h3>
            <button 
              onClick={() => { resetForm(); setShowNewRoutine(true); }}
              className="text-sm text-green-600 hover:text-green-700 font-bold"
            >
              + Crear Rutina
            </button>
          </div>

          {routines.length === 0 ? (
            <div className={cn("text-center py-12 border rounded-3xl border-dashed", isLight ? "bg-gray-50 border-gray-200" : "bg-[#0d0d0d] border-white/10")}>
              <Dumbbell size={48} className={cn("mx-auto mb-4", isLight ? "text-gray-300" : "text-white/20")} />
              <p className={cn("mb-4", isLight ? "text-gray-600" : "text-white/60")}>No tienes rutinas creadas</p>
              <button 
                onClick={() => setShowNewRoutine(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-green-600/20"
              >
                Crear Primera Rutina
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routines.map((routine) => (
                <div 
                  key={routine.id}
                  className={cn(
                    "border p-4 sm:p-6 rounded-3xl transition-all group relative",
                    isLight 
                      ? "bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-green-300" 
                      : "bg-[#0d0d0d] border-white/10 hover:border-green-500/30"
                  )}
                >
                  {/* Botones de acción */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(routine); }}
                      className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-gray-100 text-gray-500" : "hover:bg-white/10 text-white/40 hover:text-white")}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteRoutine(routine.id); }}
                      className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-red-50 text-gray-500 hover:text-red-500" : "hover:bg-red-500/20 text-white/40 hover:text-red-400")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-start justify-between mb-4 pr-16">
                    <div>
                      <h4 className={cn("font-bold text-lg transition-colors", isLight ? "group-hover:text-green-600 text-gray-900" : "group-hover:text-green-400 text-white")}>
                        {routine.name}
                      </h4>
                      <p className={cn("text-sm capitalize", isLight ? "text-gray-500" : "text-white/40")}>{routine.type}</p>
                    </div>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isLight ? "bg-gray-100 text-gray-600" : "bg-white/5 text-white")}>
                      {routine.type === 'swimming' ? <Activity size={20} /> : <Dumbbell size={20} />}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {routine.exercises.slice(0, 3).map((ex, i) => (
                      <div key={i} className={cn("flex items-center gap-2 text-sm", isLight ? "text-gray-600" : "text-white/60")}>
                        <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs", isLight ? "bg-gray-100" : "bg-white/5")}>
                          {i + 1}
                        </span>
                        <span className="truncate">{ex.name}</span>
                        <span className={cn("text-xs ml-auto", isLight ? "text-gray-400" : "text-white/30")}>
                          {ex.sets}×{ex.reps}
                        </span>
                      </div>
                    ))}
                    {routine.exercises.length > 3 && (
                      <p className={cn("text-xs pl-7", isLight ? "text-gray-400" : "text-white/30")}>
                        +{routine.exercises.length - 3} ejercicios más
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleStartSession(routine.id)}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                      isLight
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-green-600/20"
                        : "bg-white/5 hover:bg-green-600 text-white hover:shadow-green-600/20"
                    )}
                  >
                    <Play size={16} /> Iniciar Entrenamiento
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Nueva Rutina (con texto ACSM) */}
      <AnimatePresence>
        {showNewRoutine && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center gap-8 p-4">
            {/* Modal Principal */}
            <motion.div 
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ layout: { duration: 0.35, ease: "easeInOut" } }}
              className="border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shrink-0 bg-[#0d0d0d] border-white/10"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-white">Nueva Rutina</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-white/40">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={routineForm.name}
                      onChange={(e) => setRoutineForm({...routineForm, name: e.target.value})}
                      placeholder="Ej: Empuje, Pierna, etc."
                      className="w-full border rounded-xl px-4 py-3 outline-none transition-colors bg-white/5 border-white/10 focus:border-green-600 text-white placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-white/40">
                      Tipo
                    </label>
                    <select
                      value={routineForm.type}
                      onChange={(e) => setRoutineForm({...routineForm, type: e.target.value as any})}
                      className="w-full border rounded-xl px-4 py-3 outline-none transition-colors bg-white/5 border-white/10 focus:border-green-600 text-white"
                    >
                      <option value="strength">Fuerza / Gym</option>
                      <option value="cardio">Cardio / Funcional</option>
                      <option value="swimming">Natación</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="text-xs font-bold uppercase tracking-widest block text-white/40">
                    Ejercicios
                  </label>
                  {routineForm.exercises.map((ex, idx) => (
                    <div key={idx} className="p-4 rounded-xl space-y-3 bg-white/5">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => {
                          const newExercises = [...routineForm.exercises];
                          newExercises[idx].name = e.target.value;
                          setRoutineForm({...routineForm, exercises: newExercises});
                        }}
                        placeholder="Nombre del ejercicio"
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-black/30 border-white/10 text-white placeholder:text-white/30"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs block mb-1 text-white/40">Series</label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => {
                              const newExercises = [...routineForm.exercises];
                              newExercises[idx].sets = parseInt(e.target.value) || 0;
                              setRoutineForm({...routineForm, exercises: newExercises});
                            }}
                            className="w-full border rounded-lg px-3 py-2 text-sm text-center bg-black/30 border-white/10 text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs block mb-1 text-white/40">Reps</label>
                          <input
                            type="number"
                            value={ex.reps}
                            onChange={(e) => {
                              const newExercises = [...routineForm.exercises];
                              newExercises[idx].reps = parseInt(e.target.value) || 0;
                              setRoutineForm({...routineForm, exercises: newExercises});
                            }}
                            className="w-full border rounded-lg px-3 py-2 text-sm text-center bg-black/30 border-white/10 text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs block mb-1 text-white/40">Peso (kg)</label>
                          <input
                            type="number"
                            value={ex.baseWeight}
                            onChange={(e) => {
                              const newExercises = [...routineForm.exercises];
                              newExercises[idx].baseWeight = parseFloat(e.target.value) || 0;
                              setRoutineForm({...routineForm, exercises: newExercises});
                            }}
                            className="w-full border rounded-lg px-3 py-2 text-sm text-center bg-black/30 border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setRoutineForm({
                      ...routineForm, 
                      exercises: [...routineForm.exercises, { name: "", sets: 4, reps: 10, baseWeight: 0, restSeconds: 90 }]
                    })}
                    className="w-full py-2 border border-dashed rounded-xl text-sm transition-all border-white/20 text-white/40 hover:text-white hover:border-white/40"
                  >
                    + Agregar Ejercicio
                  </button>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => { setShowNewRoutine(false); resetForm(); }}
                    className="flex-1 py-3 rounded-xl font-bold transition-colors text-white/60 hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreateRoutine}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-green-600/20"
                  >
                    Crear Rutina
                  </button>
                </div>
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
                    className="space-y-1 text-white"
                  >
                    <p className="text-sm italic leading-snug !text-white">
                      "¿Entrenar todos los días es mejor para progresar?"
                    </p>
                    <p className="text-xs !text-white/80">
                      — American College of Sports Medicine (ACSM)
                    </p>
                    <button
                      onClick={() => setInfoExpanded(true)}
                      className="text-green-500 hover:text-green-400 text-xs transition-colors mt-1 font-medium"
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
                    className="!bg-[#0d0d0d] !border !border-white/10 rounded-2xl p-6 space-y-3 text-sm leading-relaxed !text-white"
                  >
                    <p className="!text-white">
                      Entrenar todos los días no necesariamente produce mejores resultados. De hecho, el progreso físico ocurre durante el descanso, cuando el cuerpo se recupera y se adapta al estímulo del entrenamiento.
                    </p>

                    <p className="text-xs font-semibold uppercase tracking-wider mt-4 !text-white/80">
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
                          <span className="text-green-500 mt-0.5 shrink-0">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    <p className="!text-white">
                      La mayoría de las personas obtiene mejores resultados entrenando entre 3 y 5 días por semana, dependiendo de su nivel, intensidad y objetivos.
                    </p>

                    <p className="!text-white">
                      Además, es recomendable alternar grupos musculares o incluir días de descanso activo para permitir una recuperación adecuada.
                    </p>

                    <div className="pt-4 border-t border-white/10">
                      <p className="font-semibold text-xs !text-white">En resumen:</p>
                      <p className="text-xs mt-0.5 !text-white">
                        Más entrenamiento no siempre es mejor. <span className="text-green-500">Mejor recuperación = mejor progreso</span>.
                      </p>
                    </div>

                    <div className="px-4 py-3 bg-white/5 rounded-xl">
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-1 !text-white/70">Fuente</p>
                      <a
                        href="https://www.acsm.org/docs/default-source/files-for-resource-library/acsm-guidelines-for-exercise-testing-and-prescription.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:text-green-400 text-xs transition-colors"
                      >
                        ACSM — Guidelines for Exercise Testing and Prescription
                      </a>
                    </div>

                    <button
                      onClick={() => setInfoExpanded(false)}
                      className="text-xs transition-colors text-green-500 hover:text-green-400"
                    >
                      ver menos
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Editar Rutina */}
      <AnimatePresence>
        {showEditModal && editingRoutine && (
          <div className={cn("fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4", isLight ? "bg-black/60" : "bg-black/80")}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto",
                isLight ? "bg-white border-gray-200" : "bg-[#0d0d0d] border-white/10"
              )}
            >
              <div className="p-8">
                <h2 className={cn("text-2xl font-bold mb-6", isLight ? "text-gray-900" : "text-white")}>Editar Rutina</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isLight ? "text-gray-500" : "text-white/40")}>
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={routineForm.name}
                      onChange={(e) => setRoutineForm({...routineForm, name: e.target.value})}
                      className={cn(
                        "w-full border rounded-xl px-4 py-3 outline-none transition-colors",
                        isLight 
                          ? "bg-gray-50 border-gray-200 focus:border-green-500 text-gray-900"
                          : "bg-white/5 border-white/10 focus:border-green-600 text-white"
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isLight ? "text-gray-500" : "text-white/40")}>
                      Tipo
                    </label>
                    <select
                      value={routineForm.type}
                      onChange={(e) => setRoutineForm({...routineForm, type: e.target.value as any})}
                      className={cn(
                        "w-full border rounded-xl px-4 py-3 outline-none transition-colors",
                        isLight 
                          ? "bg-gray-50 border-gray-200 focus:border-green-500 text-gray-900"
                          : "bg-white/5 border-white/10 focus:border-green-600 text-white"
                      )}
                    >
                      <option value="strength">Fuerza / Gym</option>
                      <option value="cardio">Cardio / Funcional</option>
                      <option value="swimming">Natación</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <label className={cn("text-xs font-bold uppercase tracking-widest block", isLight ? "text-gray-500" : "text-white/40")}>
                    Ejercicios
                  </label>
                  {routineForm.exercises.map((ex, idx) => (
                    <div key={idx} className={cn("p-4 rounded-xl space-y-3 relative", isLight ? "bg-gray-50" : "bg-white/5")}>
                      <button
                        onClick={() => {
                          const newExercises = routineForm.exercises.filter((_, i) => i !== idx);
                          setRoutineForm({...routineForm, exercises: newExercises});
                        }}
                        className={cn("absolute top-2 right-2 p-1 rounded", isLight ? "hover:bg-gray-200 text-gray-400" : "hover:bg-white/10 text-white/40")}
                      >
                        <X size={14} />
                      </button>
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => {
                          const newExercises = [...routineForm.exercises];
                          newExercises[idx].name = e.target.value;
                          setRoutineForm({...routineForm, exercises: newExercises});
                        }}
                        placeholder="Nombre del ejercicio"
                        className={cn(
                          "w-full border rounded-lg px-3 py-2 text-sm mt-4",
                          isLight ? "bg-white border-gray-200" : "bg-black/30 border-white/10"
                        )}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className={cn("text-xs block mb-1", isLight ? "text-gray-500" : "text-white/40")}>Series</label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => {
                              const newExercises = [...routineForm.exercises];
                              newExercises[idx].sets = parseInt(e.target.value) || 0;
                              setRoutineForm({...routineForm, exercises: newExercises});
                            }}
                            className={cn("w-full border rounded-lg px-3 py-2 text-sm text-center", isLight ? "bg-white border-gray-200" : "bg-black/30 border-white/10")}
                          />
                        </div>
                        <div className="flex-1">
                          <label className={cn("text-xs block mb-1", isLight ? "text-gray-500" : "text-white/40")}>Reps</label>
                          <input
                            type="number"
                            value={ex.reps}
                            onChange={(e) => {
                              const newExercises = [...routineForm.exercises];
                              newExercises[idx].reps = parseInt(e.target.value) || 0;
                              setRoutineForm({...routineForm, exercises: newExercises});
                            }}
                            className={cn("w-full border rounded-lg px-3 py-2 text-sm text-center", isLight ? "bg-white border-gray-200" : "bg-black/30 border-white/10")}
                          />
                        </div>
                        <div className="flex-1">
                          <label className={cn("text-xs block mb-1", isLight ? "text-gray-500" : "text-white/40")}>Peso</label>
                          <input
                            type="number"
                            value={ex.baseWeight}
                            onChange={(e) => {
                              const newExercises = [...routineForm.exercises];
                              newExercises[idx].baseWeight = parseFloat(e.target.value) || 0;
                              setRoutineForm({...routineForm, exercises: newExercises});
                            }}
                            className={cn("w-full border rounded-lg px-3 py-2 text-sm text-center", isLight ? "bg-white border-gray-200" : "bg-black/30 border-white/10")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setRoutineForm({
                      ...routineForm, 
                      exercises: [...routineForm.exercises, { name: "", sets: 4, reps: 10, baseWeight: 0, restSeconds: 90 }]
                    })}
                    className={cn("w-full py-2 border border-dashed rounded-xl text-sm", isLight ? "border-gray-300 text-gray-500" : "border-white/20 text-white/40")}
                  >
                    + Agregar Ejercicio
                  </button>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => { setShowEditModal(false); setEditingRoutine(null); }}
                    className={cn("flex-1 py-3 rounded-xl font-bold", isLight ? "text-gray-600 hover:bg-gray-100" : "text-white/60 hover:bg-white/5")}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleUpdateRoutine}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Iniciar Sesión */}
      <AnimatePresence>
        {showStartSession && (
          <div className={cn("fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4", isLight ? "bg-black/60" : "bg-black/80")}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "border rounded-3xl w-full max-w-md p-5 sm:p-8 max-h-[90vh] overflow-y-auto",
                isLight ? "bg-white border-gray-200" : "bg-[#0d0d0d] border-white/10"
              )}
            >
              <h2 className={cn("text-2xl font-bold mb-6", isLight ? "text-gray-900" : "text-white")}>Iniciar Entrenamiento</h2>
              <p className={cn("mb-6", isLight ? "text-gray-600" : "text-white/60")}>Selecciona una rutina:</p>
              
              <div className="space-y-3 mb-6">
                {routines.map((routine) => (
                  <button
                    key={routine.id}
                    onClick={() => handleStartSession(routine.id)}
                    className={cn(
                      "w-full p-4 border rounded-2xl text-left transition-all group",
                      isLight
                        ? "bg-gray-50 border-gray-200 hover:border-green-500 hover:bg-green-50"
                        : "bg-white/5 border-white/10 hover:border-green-500/50 hover:bg-green-600/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={cn("font-bold", isLight ? "text-gray-900 group-hover:text-green-700" : "group-hover:text-green-400")}>
                          {routine.name}
                        </p>
                        <p className={cn("text-sm", isLight ? "text-gray-500" : "text-white/40")}>
                          {routine.exercises.length} ejercicios
                        </p>
                      </div>
                      <Play size={20} className={isLight ? "text-gray-400 group-hover:text-green-600" : "text-white/20 group-hover:text-green-400"} />
                    </div>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowStartSession(false)}
                className={cn("w-full py-3 rounded-xl font-bold transition-colors", isLight ? "text-gray-600 hover:bg-gray-100" : "text-white/60 hover:bg-white/5")}
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gym;
