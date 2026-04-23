import React, { useState } from "react";
import { Bot, Sparkles, Send, ArrowRight } from "lucide-react";
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

interface AIRecommendationsProps {
  onNavigate: (tab: string, action?: string) => void;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ onNavigate }) => {
  const { messages, insights, actions, sendMessage, executeAction, refreshAnalysis, loading, executingAction } = useAICopilot();
  const [input, setInput] = useState("");

  const handleSend = async () => {
    const value = input.trim();
    if (!value || loading) return;
    setInput("");
    await sendMessage(value);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-orange-500/20 bg-linear-to-br from-[#1a120d] via-[#0d0d0d] to-[#090909] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-orange-300">
              <Sparkles size={14} />
              Life Copilot
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">IA conversacional con acciones reales</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Conversa con tu sistema, detecta patrones entre módulos y ejecuta cambios desde aquí.
            </p>
          </div>
          <button onClick={refreshAnalysis} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/5">
            Reanalizar sistema
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-5">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={`${message.createdAt}-${index}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={message.role === "assistant" ? "rounded-2xl bg-white/5 p-4 text-white" : "ml-auto max-w-[85%] rounded-2xl bg-orange-600 p-4 text-white"}
              >
                {message.content}
              </motion.div>
            ))}
            {loading && <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/60">Pensando y cruzando tus módulos...</div>}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ej: ajusta mis hábitos y mis finanzas para esta semana"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
            <button onClick={() => void handleSend()} disabled={!input.trim() || loading} className="rounded-xl bg-white px-3 py-2 text-black disabled:opacity-40">
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.28em] text-white/35">
              <Bot size={16} className="text-orange-400" />
              Insights
            </h2>
            <div className="mt-4 space-y-3">
              {insights.map((insight) => (
                <button
                  key={insight.id}
                  onClick={() => {
                    const tab = moduleTabMap[insight.module];
                    if (tab) onNavigate(tab);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
                >
                  <p className="text-sm font-bold text-white">{insight.title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/55">{insight.summary}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#0d0d0d] p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.28em] text-white/35">Acciones ejecutables</h2>
            <div className="mt-4 space-y-3">
              {actions.map((action) => (
                <div key={`${action.type}-${action.title}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-bold text-white">{action.title}</p>
                  {action.reason && <p className="mt-2 text-xs text-white/55">{action.reason}</p>}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() => void executeAction(action)}
                      disabled={executingAction === action.title}
                      className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {executingAction === action.title ? "Aplicando..." : "Aplicar cambio"}
                    </button>
                    <button
                      onClick={() => {
                        const tab = moduleTabMap[action.module];
                        if (tab) onNavigate(tab);
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-orange-400"
                    >
                      Ver módulo
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {actions.length === 0 && <p className="text-sm text-white/45">Pídele a la IA que te proponga y ejecute cambios.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
