import React from "react";
import { Bot, Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { motion } from "motion/react";
import { useAICopilot } from "../hooks/useAICopilot";

const moduleTabMap: Record<string, string> = {
  habits: "habits",
  nutrition: "nutrition",
  gym: "gym",
  finance: "finance",
  routine: "routine",
  goals: "goals",
  mindset: "mindset",
  profile: "mi-perfil",
};

export function AICopilotHero({
  onNavigate,
}: {
  onNavigate?: (tab: string, action?: string) => void;
}) {
  const { insights, actions, setOpen, sendMessage, executeAction, executingAction } = useAICopilot();
  const primaryInsight = insights[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-linear-to-br from-[#1a120d] via-[#0d0d0d] to-[#090909] p-6 shadow-xl shadow-orange-950/20"
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-orange-300">
            <Sparkles size={14} />
            OS Brain
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
            Tu IA ya no es una pestaña. Ahora puede leer el sistema y cambiarlo contigo.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
            Cruza hábitos, nutrición, gym, finanzas, rutina, metas y mindset para detectar patrones y ejecutar mejoras reales.
          </p>

          {primaryInsight && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-bold text-white">{primaryInsight.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{primaryInsight.summary}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700"
            >
              Abrir copiloto
            </button>
            <button
              onClick={() => void sendMessage("Hazme un diagnóstico general y propón cambios concretos en el sistema.")}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white/80 transition-colors hover:bg-white/5"
            >
              Diagnóstico completo
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {actions.slice(0, 3).map((action) => (
            <div key={`${action.type}-${action.title}`} className="rounded-3xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-white">
                    <Bot size={16} className="text-orange-400" />
                    {action.title}
                  </p>
                  {action.reason && <p className="mt-2 text-xs leading-relaxed text-white/50">{action.reason}</p>}
                </div>
                <button
                  onClick={() => void executeAction(action)}
                  disabled={executingAction === action.title}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                >
                  {executingAction === action.title ? "Aplicando..." : "Ejecutar"}
                </button>
              </div>
              <button
                onClick={() => {
                  const tab = moduleTabMap[action.module];
                  if (tab) onNavigate?.(tab);
                }}
                className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-400"
              >
                Ir al módulo
                <ArrowRight size={14} />
              </button>
            </div>
          ))}

          {actions.length === 0 && (
            <button
              onClick={() => void sendMessage("Propón tres acciones visibles que puedas ejecutar ahora mismo dentro del sistema.")}
              className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-left text-white/70 transition-colors hover:bg-white/5"
            >
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <Wand2 size={16} className="text-orange-400" />
                Generar acciones automáticas
              </p>
              <p className="mt-2 text-xs text-white/50">Si no hay acciones listas, la IA puede proponértelas en contexto.</p>
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
