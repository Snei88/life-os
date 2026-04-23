// src/App.tsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import Layout from "./components/Layout";
import Auth from "./components/Auth";
import { motion, AnimatePresence } from "motion/react";
import { GuidedTourProvider, useGuidedTour } from "./hooks/useGuidedTour";
import { useIsCompact } from "./hooks/useIsCompact";
import { AICopilotProvider } from "./hooks/useAICopilot";
import { AICopilotWidget } from "./components/AICopilotWidget";

const Dashboard = lazy(() => import("./components/Dashboard"));
const Habits = lazy(() => import("./components/Habits"));
const Nutrition = lazy(() => import("./components/Nutrition"));
const Gym = lazy(() => import("./components/Gym"));
const Finance = lazy(() => import("./components/Finance"));
const Routine = lazy(() => import("./components/Routine"));
const Goals = lazy(() => import("./components/Goals"));
const Mindset = lazy(() => import("./components/Mindset"));
const OnboardingWizard = lazy(() => import("./components/OnboardingWizard").then((module) => ({ default: module.OnboardingWizard })));
const AIRecommendations = lazy(() => import("./components/AIRecommendations").then((module) => ({ default: module.AIRecommendations })));
const Profile = lazy(() => import("./components/Profile").then((module) => ({ default: module.Profile })));

function ContentFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-orange-600 border-t-transparent animate-spin" />
    </div>
  );
}

function AppContent() {
  const { profile, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isCompact = useIsCompact();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ tab: string; action?: string } | null>(null);
  const [contentVersion, setContentVersion] = useState(0);

  const handleNavigate = (tab: string, action?: string) => {
    setActiveTab(tab);
    if (action) setPendingAction({ tab, action });
  };

  // Detectar cambios de estado para transiciones suaves
  useEffect(() => {
    if (profile && !isCompact) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
    setIsTransitioning(false);
  }, [isCompact, profile?.id]);

  useEffect(() => {
    const handleRefresh = () => setContentVersion((current) => current + 1);
    window.addEventListener("lifeos:refresh", handleRefresh);
    return () => window.removeEventListener("lifeos:refresh", handleRefresh);
  }, []);

  if (loading || isTransitioning) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full"
          />
          <p className="text-white/40 text-sm font-bold tracking-widest uppercase">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}>
        <Auth />
      </div>
    );
  }

  // Verificar si necesita onboarding (usuario nuevo sin datos físicos)
  const needsOnboarding = !profile.gymTargetKcal;

  if (needsOnboarding) {
    return (
      <div className={resolvedTheme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}>
        <OnboardingWizard
          onComplete={() => window.location.reload()}
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard onNavigate={handleNavigate} />;
      case "habits": return <Habits />;
      case "nutrition": return (
        <Nutrition
          openMealModal={pendingAction?.tab === "nutrition" && pendingAction?.action === "open-meal-modal"}
          onMealModalOpened={() => setPendingAction(null)}
        />
      );
      case "gym": return <Gym />;
      case "finance": return <Finance />;
      case "routine": return <Routine />;
      case "goals": return (
        <Goals
          openGoalModal={pendingAction?.tab === "goals" && pendingAction?.action === "open-goal-modal"}
          onGoalModalOpened={() => setPendingAction(null)}
        />
      );
      case "mindset": return <Mindset />;
      case "ai-recommendations": return <AIRecommendations onNavigate={handleNavigate} />;
      case "mi-perfil": return <Profile />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <GuidedTourProvider userId={profile.id} activeTab={activeTab} setActiveTab={setActiveTab}>
      <AICopilotProvider activeTab={activeTab}>
        <AuthenticatedAppLayout
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleNavigate={handleNavigate}
          renderContent={() => (
            <Suspense fallback={<ContentFallback />}>
              {renderContent()}
            </Suspense>
          )}
          isCompact={isCompact}
          contentVersion={contentVersion}
        />
      </AICopilotProvider>
    </GuidedTourProvider>
  );
}

function AuthenticatedAppLayout({
  activeTab,
  setActiveTab,
  handleNavigate,
  renderContent,
  isCompact,
  contentVersion,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleNavigate: (tab: string, action?: string) => void;
  renderContent: () => React.ReactNode;
  isCompact: boolean;
  contentVersion: number;
}) {
  const { isActive } = useGuidedTour();

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} forceSidebarOpen={isActive}>
        <AnimatePresence mode={isCompact ? "wait" : "popLayout"} initial={false}>
          <motion.div
            key={`${activeTab}-${contentVersion}`}
            initial={isCompact ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={isCompact ? { opacity: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: isCompact ? 0.18 : 0.3, ease: "easeInOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Layout>
      <AICopilotWidget onNavigate={(tab) => handleNavigate(tab)} />
    </>
  );
}

export default function App() {
  return <AppContent />;
}
