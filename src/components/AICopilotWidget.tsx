import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, Sparkles, Send, Wand2, ArrowRight, LoaderCircle } from "lucide-react";
import { cn } from "../lib/utils";
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

export function AICopilotWidget({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const { isOpen, toggleOpen, loading, executingAction, messages, insights, actions, sendMessage, executeAction, postponeAction, dismissAction, refreshAnalysis } =
    useAICopilot();
  const [input, setInput] = useState("");
  const [showInsights, setShowInsights] = useState(false);
  const [showActions, setShowActions] = useState(true);

  const quickPrompts = useMemo(
    () => [
      "Analiza mis 8 modulos y dime que patron ves.",
      "Propon 3 mejoras automaticas para hoy.",
      "Dime donde estoy perdiendo disciplina y dinero.",
    ],
    [],
  );

  const handleSend = async () => {
    const value = input.trim();
    if (!value || loading) return;
    setInput("");
    await sendMessage(value);
  };

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-[60] flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 via-red-500 to-yellow-400 text-white shadow-2xl shadow-orange-900/40 transition-transform hover:scale-105"
      >
        <Bot size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="fixed bottom-24 right-2 z-[60] flex h-[min(88vh,860px)] w-[min(540px,calc(100vw-1rem))] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0b] shadow-2xl md:right-4"
          >
            <div className="shrink-0 border-b border-white/10 bg-linear-to-r from-orange-500/15 via-red-500/10 to-transparent p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-orange-300">
                    <Sparkles size={14} />
                    Life Copilot
                  </p>
                  <h3 className="mt-2 text-lg font-black text-white md:text-xl">IA conectada al sistema</h3>
                  <p className="mt-1 text-xs text-white/50 md:text-sm">Analiza, conversa y ejecuta cambios dentro de la app.</p>
                </div>
                <button onClick={refreshAnalysis} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/5">
                  Reanalizar
                </button>
              </div>
            </div>

            <div className="shrink-0 border-b border-white/10 px-4 py-3">
              <button onClick={() => setShowInsights((current) => !current)} className="flex w-full items-center justify-between text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/35">Insights del sistema</p>
                <span className="text-xs text-orange-400">{showInsights ? "Ocultar" : `Ver ${Math.min(insights.length, 2)}`}</span>
              </button>
              {showInsights && (
                <div className="mt-3 grid max-h-40 gap-3 overflow-y-auto pr-1">
                  {insights.slice(0, 2).map((insight) => (
                    <button
                      key={insight.id}
                      onClick={() => {
                        const target = moduleTabMap[insight.module];
                        if (target) onNavigate(target);
                      }}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition-colors",
                        insight.tone === "warning"
                          ? "border-red-500/30 bg-red-500/10"
                          : insight.tone === "opportunity"
                            ? "border-emerald-500/20 bg-emerald-500/10"
                            : "border-orange-500/20 bg-orange-500/10",
                      )}
                    >
                      <p className="text-sm font-bold text-white">{insight.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/60">{insight.summary}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.createdAt}-${index}`}
                    className={cn(
                      "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "assistant" ? "bg-white/5 text-white" : "ml-auto bg-orange-600 text-white",
                    )}
                  >
                    {message.content}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
                    <LoaderCircle className="animate-spin" size={16} />
                    Pensando y cruzando modulos...
                  </div>
                )}
              </div>
            </div>

            {actions.length > 0 && (
              <div className="shrink-0 border-t border-white/10 px-4 py-3">
                <button onClick={() => setShowActions((current) => !current)} className="flex w-full items-center justify-between text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/35">Acciones que puedo aplicar</p>
                  <span className="text-xs text-orange-400">{showActions ? "Ocultar" : `Ver ${Math.min(actions.length, 3)}`}</span>
                </button>
                {showActions && (
                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
                    {actions.slice(0, 3).map((action) => (
                      <div key={`${action.type}-${action.title}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-white">{action.title}</p>
                            {action.reason && <p className="mt-1 text-xs text-white/50">{action.reason}</p>}
                          </div>
                          <button
                            disabled={!!executingAction}
                            onClick={() => executeAction(action)}
                            className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700 disabled:opacity-50"
                          >
                            {executingAction === action.title ? "Aplicando..." : "Aplicar"}
                          </button>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => postponeAction(action)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold text-white/60 hover:bg-white/5"
                          >
                            Posponer
                          </button>
                          <button
                            onClick={() => dismissAction(action)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-bold text-white/60 hover:bg-white/5"
                          >
                            Descartar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="shrink-0 border-t border-white/10 p-4">
              <div className="mb-3 flex max-h-20 flex-wrap gap-2 overflow-y-auto pr-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
                  >
                    <span className="mr-1 inline-block align-middle text-orange-400">
                      <Wand2 size={12} />
                    </span>
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Pideme analizar, corregir o ejecutar cambios..."
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-white px-3 py-2 text-black disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                Solo responde temas de Life OS y de tus 8 modulos. No atiende consultas fuera del sistema.
              </p>
              {actions.length > 0 && (
                <button
                  onClick={() => {
                    const target = moduleTabMap[actions[0].module];
                    if (target) onNavigate(target);
                  }}
                  className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-400"
                >
                  Ir al modulo sugerido
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
