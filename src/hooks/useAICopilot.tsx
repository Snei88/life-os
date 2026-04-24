import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { AICopilotAction, AICopilotFeedbackEntry, AICopilotInsight, AICopilotMessage } from "../types";

const COPILOT_STORAGE_KEY = "lifeos_copilot_memory_v1";
const COPILOT_LEARNING_KEY = "lifeos_copilot_learning_v1";

type AICopilotContextValue = {
  isOpen: boolean;
  loading: boolean;
  executingAction: string | null;
  messages: AICopilotMessage[];
  insights: AICopilotInsight[];
  actions: AICopilotAction[];
  feedback: AICopilotFeedbackEntry[];
  toggleOpen: () => void;
  setOpen: (value: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  executeAction: (action: AICopilotAction) => Promise<void>;
  postponeAction: (action: AICopilotAction) => void;
  dismissAction: (action: AICopilotAction) => void;
};

const AICopilotContext = createContext<AICopilotContextValue | null>(null);

export function AICopilotProvider({
  activeTab,
  children,
}: {
  activeTab: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [messages, setMessages] = useState<AICopilotMessage[]>([]);
  const [insights, setInsights] = useState<AICopilotInsight[]>([]);
  const [actions, setActions] = useState<AICopilotAction[]>([]);
  const [feedback, setFeedback] = useState<AICopilotFeedbackEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COPILOT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.messages)) setMessages(parsed.messages.slice(-30));
      if (Array.isArray(parsed?.insights)) setInsights(parsed.insights.slice(0, 6));
      if (Array.isArray(parsed?.actions)) setActions(parsed.actions.slice(0, 6));

      const learningRaw = localStorage.getItem(COPILOT_LEARNING_KEY);
      if (learningRaw) {
        const learningParsed = JSON.parse(learningRaw);
        if (Array.isArray(learningParsed)) setFeedback(learningParsed.slice(-40));
      }
    } catch {
      return;
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      COPILOT_STORAGE_KEY,
      JSON.stringify({
        messages: messages.slice(-30),
        insights: insights.slice(0, 6),
        actions: actions.slice(0, 6),
      }),
    );
  }, [messages, insights, actions]);

  useEffect(() => {
    localStorage.setItem(COPILOT_LEARNING_KEY, JSON.stringify(feedback.slice(-40)));
  }, [feedback]);

  const buildLearningMemory = () => ({
    acceptedActions: feedback.filter((entry) => entry.outcome === "accepted").slice(-12),
    postponedActions: feedback.filter((entry) => entry.outcome === "postponed").slice(-12),
    dismissedActions: feedback.filter((entry) => entry.outcome === "dismissed").slice(-12),
  });

  const registerFeedback = (action: AICopilotAction, outcome: AICopilotFeedbackEntry["outcome"]) => {
    setFeedback((current) => [
      ...current.slice(-39),
      {
        actionTitle: action.title,
        actionType: action.type,
        module: action.module,
        outcome,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const applyResponse = (reply: string, nextInsights: AICopilotInsight[], nextActions: AICopilotAction[]) => {
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInsights(nextInsights || []);
    setActions(nextActions || []);
  };

  const refreshAnalysis = async () => {
    setLoading(true);
    try {
      const response = await api.aiChat({ messages: [], activeTab, learningMemory: buildLearningMemory() });
      applyResponse(response.reply, response.insights || [], response.actions || []);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "No pude analizar tu sistema en este momento.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    const nextUserMessage: AICopilotMessage = {
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    const nextConversation = [...messages, nextUserMessage];
    setMessages(nextConversation.slice(-30));
    setLoading(true);

    try {
      const response = await api.aiChat({
        messages: nextConversation.map((message) => ({ role: message.role, content: message.content })),
        activeTab,
        learningMemory: buildLearningMemory(),
      });
      applyResponse(response.reply, response.insights || [], response.actions || []);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "No pude responderte ahora. Reintenta en un momento.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: AICopilotAction) => {
    setExecutingAction(action.title);
    try {
      const response = await api.aiExecute(action as unknown as Record<string, unknown>);
      registerFeedback(action, "accepted");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.message || `${action.title} aplicada.`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setActions((current) => current.filter((candidate) => candidate !== action));
      window.dispatchEvent(new CustomEvent("lifeos:refresh"));
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error?.message || `No pude ejecutar: ${action.title}.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setExecutingAction(null);
    }
  };

  const postponeAction = (action: AICopilotAction) => {
    registerFeedback(action, "postponed");
    setActions((current) => current.filter((candidate) => candidate !== action));
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: `Dejé pendiente "${action.title}". Lo tendré en cuenta para sugerirlo en un mejor momento.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const dismissAction = (action: AICopilotAction) => {
    registerFeedback(action, "dismissed");
    setActions((current) => current.filter((candidate) => candidate !== action));
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: `Entendido. No priorizaré "${action.title}" de la misma forma en las próximas sugerencias.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  useEffect(() => {
    if (hydrated && messages.length === 0) {
      void refreshAnalysis();
    }
  }, [hydrated, messages.length]);

  const value = useMemo<AICopilotContextValue>(
    () => ({
      isOpen,
      loading,
      executingAction,
      messages,
      insights,
      actions,
      feedback,
      toggleOpen: () => setIsOpen((current) => !current),
      setOpen: setIsOpen,
      sendMessage,
      refreshAnalysis,
      executeAction,
      postponeAction,
      dismissAction,
    }),
    [isOpen, loading, executingAction, messages, insights, actions, feedback, activeTab],
  );

  return <AICopilotContext.Provider value={value}>{children}</AICopilotContext.Provider>;
}

export function useAICopilot() {
  const context = useContext(AICopilotContext);
  if (!context) {
    throw new Error("useAICopilot debe usarse dentro de AICopilotProvider");
  }
  return context;
}
