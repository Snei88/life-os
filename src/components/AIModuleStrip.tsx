import React from "react";
import { Bot, Sparkles, ArrowRight } from "lucide-react";
import { useAICopilot } from "../hooks/useAICopilot";

export function AIModuleStrip({
  moduleId,
  title,
  subtitle,
  prompts,
}: {
  moduleId: string;
  title: string;
  subtitle: string;
  prompts: string[];
}) {
  const { setOpen, sendMessage } = useAICopilot();

  const triggerPrompt = async (prompt: string) => {
    setOpen(true);
    await sendMessage(`[${moduleId}] ${prompt}`);
  };

  return (
    <section className="rounded-[1.75rem] border border-orange-500/15 bg-linear-to-r from-orange-500/10 via-white/[0.03] to-transparent p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-orange-300">
            <Sparkles size={13} />
            IA en {title}
          </p>
          <h3 className="mt-2 flex items-center gap-2 text-lg font-black text-white">
            <Bot size={18} className="text-orange-400" />
            Copilot activo en este modulo
          </h3>
          <p className="mt-1 text-sm text-white/55">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {prompts.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              onClick={() => void triggerPrompt(prompt)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => void triggerPrompt(`Analiza este modulo y dame mejoras aplicables ahora mismo.`)}
        className="mt-4 flex items-center gap-2 text-xs font-bold text-orange-400"
      >
        Abrir conversacion contextual
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
