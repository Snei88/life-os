//src/components/Finance.tsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, TrendingUp, TrendingDown, Wallet, PieChart, 
  ArrowUpRight, ArrowDownRight, Trash2, Edit2, 
  ChevronLeft, ChevronRight, AlertCircle, Target,
  Calendar, DollarSign, Save
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../hooks/useAuth";
import { useData } from "../hooks/useData";
import { cn, formatCurrency } from "../lib/utils";
import { getLogicalDate } from "../lib/dateUtils";
import type { Transaction, FinanceStats } from "../types";

// Categorías predefinidas por tipo
const INCOME_CATEGORIES = ["Freelance", "Salario", "Inversiones", "Bonos", "Otros"];
const EXPENSE_CATEGORIES = [
  "Nutrición", "Transporte", "Gym", "Educación", "Entretenimiento", 
  "Vivienda", "Servicios", "Salud", "Ahorro", "Ropa", "Tecnología", "Otros"
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const Finance: React.FC = () => {
  const { profile, refresh: refreshProfile } = useAuth();
  const { refresh: refreshData } = useData();
  
  // Estado temporal
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal estado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [infoExpanded, setInfoExpanded] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    category: "",
    amount: "",
    description: "",
    date: getLogicalDate(),
  });

  // Edición de fondo de emergencia
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    goal: 5000000,
    current: 0,
  });

  // Calcular mes/año actual para filtros
  const currentMonth = useMemo(() => {
    const m = currentDate.getMonth() + 1;
    const y = currentDate.getFullYear();
    return `${y}-${m.toString().padStart(2, '0')}`;
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  useEffect(() => {
    if (stats?.emergencyFund) {
      setEmergencyForm({
        goal: stats.emergencyFund.goal,
        current: stats.emergencyFund.current,
      });
    }
  }, [stats]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txData, statsData] = await Promise.all([
        api.getTransactions({ month: currentMonth }),
        api.getFinanceStats({ month: currentMonth }),
      ]);
      setTransactions(txData);
      setStats(statsData);
    } catch (err) {
      console.error("Error cargando finanzas:", err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.push("El monto debe ser mayor a 0");
    }
    if (!formData.category) {
      errors.push("Selecciona una categoría");
    }
    if (!formData.date) {
      errors.push("La fecha es requerida");
    }
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (editingId) {
        await api.updateTransaction(editingId, payload);
      } else {
        await api.addTransaction(payload);
      }
      
      closeModal();
      loadData();
      refreshData();
    } catch (err) {
      console.error("Error guardando transacción:", err);
      setFormErrors(["Error al guardar la transacción"]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta transacción?")) return;
    try {
      await api.deleteTransaction(id);
      loadData();
      refreshData();
    } catch (err) {
      alert("Error eliminando transacción");
    }
  };

  const openModal = (tx?: Transaction) => {
    if (tx) {
      setEditingId(tx.id);
      setFormData({
        type: tx.type as "income" | "expense",
        category: tx.category,
        amount: String(tx.amount),
        description: tx.description || "",
        date: tx.date,
      });
    } else {
      setEditingId(null);
      setFormData({
        type: "expense",
        category: "",
        amount: "",
        description: "",
        date: getLogicalDate(),
      });
    }
    setFormErrors([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormErrors([]);
    setInfoExpanded(false);
  };

  const handleUpdateEmergency = async () => {
    try {
      await api.updateEmergencyFund({
        goal: emergencyForm.goal,
        current: emergencyForm.current,
      });
      setEditingEmergency(false);
      loadData();
      refreshProfile();
    } catch (err) {
      alert("Error actualizando fondo de emergencia");
    }
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const savingsRate = stats?.savingsRate || 0;
  const savingsGoal = profile?.savingsGoal || 25;
  const emergencyProgress = stats?.emergencyFund ? 
    Math.min((stats.emergencyFund.current / stats.emergencyFund.goal) * 100, 100) : 0;

  // Gráfica simple de barras
  const maxMonthly = Math.max(
    ...(stats?.monthlyHistory.map(m => Math.max(m.income, m.expense)) || [1])
  );

  return (
    <div className="space-y-8">
      {/* Header con navegación de mes */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Finanzas</h1>
          <p className="text-white/60">Gestiona tu capital y construye libertad.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#0d0d0d] border border-white/10 rounded-2xl p-2">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-4">
            <Calendar size={16} className="text-white/40" />
            <span className="font-bold min-w-[140px] text-center text-white">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
          </div>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={() => openModal()} 
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20"
        >
          <Plus size={20} />Nueva Transacción
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d0d0d] border border-white/10 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats?.income || 0)}</p>
          <p className="text-xs text-white/40 mt-1">{MONTHS[currentDate.getMonth()]}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0d0d0d] border border-white/10 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
              <TrendingDown size={20} />
            </div>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Gastos</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats?.expense || 0)}</p>
          <p className="text-xs text-white/40 mt-1">{MONTHS[currentDate.getMonth()]}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "bg-[#0d0d0d] border p-6 rounded-3xl",
            (stats?.balance || 0) >= 0 ? "border-green-500/30" : "border-red-500/30"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              (stats?.balance || 0) >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Balance</span>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            (stats?.balance || 0) >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {formatCurrency(stats?.balance || 0)}
          </p>
          <p className="text-xs text-white/40 mt-1">Diferencia mes</p>
        </motion.div>
      </div>

      {/* Segunda fila: Tasa de ahorro y Fondo de Emergencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasa de Ahorro */}
        <div className="bg-[#0d0d0d] border border-white/10 p-5 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <PieChart size={18} className="text-orange-500" />
              Tasa de Ahorro
            </h3>
            <span className={cn(
              "text-sm font-bold",
              savingsRate >= savingsGoal ? "text-green-500" : "text-orange-500"
            )}>
              {savingsRate.toFixed(1)}% / {savingsGoal}%
            </span>
          </div>
          
          <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.abs(savingsRate), 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                savingsRate >= savingsGoal ? "bg-green-500" : 
                savingsRate > 0 ? "bg-orange-500" : "bg-red-500"
              )} 
            />
          </div>
          
          <p className="text-xs text-white/40">
            {savingsRate >= savingsGoal 
              ? "¡Excelente! Estás cumpliendo tu meta de ahorro." 
              : savingsRate > 0 
                ? `Te falta ${(savingsGoal - savingsRate).toFixed(1)}% para cumplir tu meta mensual.`
                : "Estás gastando más de lo que ingresa. ¡Cuidado!"}
          </p>
        </div>

        {/* Fondo de Emergencia */}
        <div className="bg-[#0d0d0d] border border-white/10 p-5 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <Target size={18} className="text-yellow-500" />
              Fondo de Emergencia
            </h3>
            <button 
              onClick={() => setEditingEmergency(!editingEmergency)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
            >
              <Edit2 size={16} />
            </button>
          </div>

          {editingEmergency ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 block mb-1">Meta ($)</label>
                  <input
                    type="number"
                    value={emergencyForm.goal}
                    onChange={(e) => setEmergencyForm({...emergencyForm, goal: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Actual ($)</label>
                  <input
                    type="number"
                    value={emergencyForm.current}
                    onChange={(e) => setEmergencyForm({...emergencyForm, current: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleUpdateEmergency}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold text-sm transition-colors text-white"
              >
                Guardar Cambios
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">
                  {formatCurrency(stats?.emergencyFund.current || 0)}
                </span>
                <span className="text-white/40">
                  Meta: {formatCurrency(stats?.emergencyFund.goal || 5000000)}
                </span>
              </div>
              
              <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${emergencyProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-yellow-500 rounded-full" 
                />
              </div>
              
              <p className="text-xs text-white/40">
                {emergencyProgress >= 100 
                  ? "¡Meta alcanzada! Tienes 6 meses de gastos cubiertos."
                  : `Progreso: ${emergencyProgress.toFixed(1)}% — Te falta ${formatCurrency((stats?.emergencyFund.goal || 5000000) - (stats?.emergencyFund.current || 0))}`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Gráfica Historial */}
      <div className="bg-[#0d0d0d] border border-white/10 p-5 sm:p-8 rounded-3xl">
        <h3 className="font-bold mb-6 flex items-center gap-2 text-white">
          <TrendingUp size={18} className="text-blue-500" />
          Historial (Últimos 6 meses)
        </h3>
        
        <div className="h-48 flex items-end justify-between gap-4">
          {stats?.monthlyHistory.map((month, idx) => {
            const incomeHeight = maxMonthly > 0 ? (month.income / maxMonthly) * 100 : 0;
            const expenseHeight = maxMonthly > 0 ? (month.expense / maxMonthly) * 100 : 0;
            
            return (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${incomeHeight}%` }}
                    transition={{ delay: idx * 0.1 }}
                    className="w-3 bg-green-500/80 rounded-t-sm relative group"
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {formatCurrency(month.income)}
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${expenseHeight}%` }}
                    transition={{ delay: idx * 0.1 + 0.05 }}
                    className="w-3 bg-red-500/80 rounded-t-sm relative group"
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {formatCurrency(month.expense)}
                    </div>
                  </motion.div>
                </div>
                <span className="text-xs text-white/40">
                  {MONTHS[parseInt(month.month.split('-')[1]) - 1].substring(0, 3)}
                </span>
              </div>
            );
          })}
          
          {(!stats?.monthlyHistory || stats.monthlyHistory.length === 0) && (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
              Sin datos históricos disponibles
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/80 rounded-sm"></div>
            <span className="text-white/60">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/80 rounded-sm"></div>
            <span className="text-white/60">Gastos</span>
          </div>
        </div>
      </div>

      {/* Lista de Transacciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl text-white">Transacciones del Mes</h3>
          <span className="text-sm text-white/40">{transactions.length} registros</span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"
            />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-[#0d0d0d] border border-white/10 rounded-3xl border-dashed">
            <DollarSign size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/60">No hay transacciones este mes</p>
            <button 
              onClick={() => openModal()}
              className="mt-4 text-orange-500 hover:text-orange-400 font-bold text-sm"
            >
              Registrar primera transacción
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence>
              {transactions.map((tx) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-[#0d0d0d] border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center",
                      tx.type === "income" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {tx.type === "income" ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white truncate">{tx.description || tx.category}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-white/40">
                        <span className="shrink-0">{new Date(tx.date).toLocaleDateString('es-CO')}</span>
                        <span>•</span>
                        <span className="capitalize truncate">{tx.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <p className={cn(
                      "font-bold text-sm sm:text-base",
                      tx.type === "income" ? "text-green-500" : "text-red-500"
                    )}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(tx)}
                        className="p-1.5 text-white/40 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 text-white/40 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal de Transacción - SIEMPRE TEXTO BLANCO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center gap-5 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, x: infoExpanded ? -30 : 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="bg-[#0d0d0d] border border-white/10 p-5 sm:p-8 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto text-white shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-2 text-white">
                {editingId ? "Editar Transacción" : "Nueva Transacción"}
              </h2>
              <p className="text-white/40 text-sm mb-6">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </p>

              {/* Errores de validación */}
              {formErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
                  {formErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-red-400 text-xs">
                      <AlertCircle size={12} />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {/* Toggle Tipo */}
                <div className="flex p-1 bg-white/5 rounded-xl">
                  <button 
                    onClick={() => setFormData({ ...formData, type: "income", category: "" })}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                      formData.type === "income" 
                        ? "bg-white text-black" 
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    <ArrowUpRight size={14} />
                    INGRESO
                  </button>
                  <button 
                    onClick={() => setFormData({ ...formData, type: "expense", category: "" })}
                    className={cn(
                      "flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                      formData.type === "expense" 
                        ? "bg-white text-black" 
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    <ArrowDownRight size={14} />
                    GASTO
                  </button>
                </div>

                {/* Monto */}
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                    Monto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <input 
                      type="number" 
                      placeholder="0"
                      min="0"
                      step="100"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-orange-600 transition-colors text-lg font-bold text-white placeholder:text-white/20"
                    />
                  </div>
                  <p className="text-xs text-white/30 mt-1">Solo números enteros, sin puntos ni comas</p>
                </div>

                {/* Fecha */}
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                    Fecha *
                  </label>
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-600 transition-colors text-white"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                    Categoría *
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-600 transition-colors text-white"
                  >
                    <option value="" className="bg-[#0d0d0d] text-white">Selecciona una categoría</option>
                    <optgroup label="Ingresos" className="bg-[#0d0d0d] text-white">
                      {INCOME_CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#0d0d0d] text-white">{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Gastos" className="bg-[#0d0d0d] text-white">
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#0d0d0d] text-white">{c}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                    Descripción (opcional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: Mercado semanal, Pago cliente X..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-600 transition-colors text-white placeholder:text-white/30"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-xl font-bold text-white/60 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSubmit}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-white"
                  >
                    <Save size={16} />
                    {editingId ? "Actualizar" : "Guardar"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Panel informativo - Glassmorphism SIEMPRE BLANCO */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.35 }}
              className="hidden lg:flex flex-col w-[440px]"
            >
              {!infoExpanded ? (
                // Estado colapsado - sin fondo, solo texto blanco
                <div className="space-y-2 !text-white">
                  <p className="text-sm italic leading-tight !text-white drop-shadow-md">
                    "El error de no registrar pequeños gastos"
                  </p>
                  <p className="text-xs !text-white drop-shadow-md">
                    — Behavioral Economics / Finanzas personales
                  </p>
                  <button
                    onClick={() => setInfoExpanded(true)}
                    className="text-orange-500 hover:text-orange-400 text-xs font-medium transition-colors drop-shadow-md"
                  >
                    ver más...
                  </button>
                </div>
              ) : (
                // Estado expandido - glassmorphism con texto blanco
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl"
                >
                  <div className="space-y-3 text-sm leading-relaxed !text-white">
                    <p className="!text-white">
                      Uno de los errores más comunes en las finanzas personales es ignorar los pequeños gastos diarios.
                    </p>
                    <p className="!text-white">
                      Compras como café, snacks, transporte o suscripciones pueden parecer insignificantes de forma individual, pero acumuladas representan una parte importante del dinero que se gasta cada mes.
                    </p>
                    <p className="!text-white">Este fenómeno ocurre porque:</p>
                    <ul className="list-disc list-inside space-y-1 !text-white">
                      <li>Los gastos pequeños no generan sensación de impacto inmediato</li>
                      <li>Son difíciles de recordar sin registrarlos</li>
                      <li>Se repiten con alta frecuencia</li>
                      <li>Suelen hacerse de forma automática</li>
                    </ul>
                    <p className="!text-white">
                      Con el tiempo, estos gastos pueden representar una "fuga de dinero" silenciosa.
                    </p>
                    <p className="!text-white">Registrar cada gasto, por pequeño que sea, permite:</p>
                    <ul className="list-disc list-inside space-y-1 !text-white">
                      <li>Tener claridad real de en qué se va el dinero</li>
                      <li>Detectar patrones de consumo</li>
                      <li>Identificar oportunidades de ahorro</li>
                      <li>Tomar decisiones financieras más conscientes</li>
                    </ul>
                    <p className="font-semibold !text-white">
                      En resumen:
                    </p>
                    <p className="!text-white">
                      No son los grandes gastos los que más afectan tus finanzas, sino los pequeños que no ves.
                    </p>

                    <div className="pt-3 border-t border-white/20" />

                    <a
                      href="https://www.consumerfinance.gov/consumer-tools/budgeting/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-500 hover:text-orange-400 transition-colors underline underline-offset-2"
                    >
                      Fuente: consumerfinance.gov/budgeting
                    </a>

                    <button
                      onClick={() => setInfoExpanded(false)}
                      className="text-orange-500 hover:text-orange-400 text-xs transition-colors block"
                    >
                      ver menos
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Finance;
