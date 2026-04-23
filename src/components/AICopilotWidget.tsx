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
  const { isOpen, toggleOpen, loading, executingAction, messages, insights, actions, sendMessage, executeAction, refreshAnalysis } =
    useAICopilot();
  const [input, setInput] = useState("");

  const quickPrompts = useMemo(
    () => [
      "Analiza mis 8 módulos y dime qué patrón ves.",
      "Propón 3 mejoras automáticas para hoy.",
      "Dime dónde estoy perdiendo disciplina y dinero.",
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
            className="fixed bottom-24 right-4 z-[60] flex h-[80vh] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0b] shadow-2xl"
          >
            <div className="border-b border-white/10 bg-linear-to-r from-orange-500/15 via-red-500/10 to-transparent p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-orange-300">
                    <Sparkles size={14} />
                    Life Copilot
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">IA conectada al sistema</h3>
                  <p className="mt-1 text-sm text-white/50">Analiza, conversa y ejecuta cambios dentro de la app.</p>
                </div>
                <button onClick={refreshAnalysis} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/5">
                  Reanalizar
                </button>
              </div>
            </div>

            <div className="grid gap-3 border-b border-white/10 p-4">
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

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
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
                  Pensando y cruzando módulos...
                </div>
              )}
            </div>

            {actions.length > 0 && (
              <div className="space-y-3 border-t border-white/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-white/35">Acciones que puedo aplicar</p>
                <div className="space-y-2">
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-white/10 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
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
                  placeholder="Pídeme analizar, corregir o ejecutar cambios..."
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
              {actions.length > 0 && (
                <button
                  onClick={() => {
                    const target = moduleTabMap[actions[0].module];
                    if (target) onNavigate(target);
                  }}
                  className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-400"
                >
                  Ir al módulo sugerido
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
