// src/App.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Habits from "./components/Habits";
import Nutrition from "./components/Nutrition";
import Gym from "./components/Gym";
import Finance from "./components/Finance";
import Routine from "./components/Routine";
import Goals from "./components/Goals";
import Mindset from "./components/Mindset";
import Auth from "./components/Auth";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { AIRecommendations } from "./components/AIRecommendations";
import { Profile } from "./components/Profile";
import { motion, AnimatePresence } from "motion/react";
import { GuidedTourProvider, useGuidedTour } from "./hooks/useGuidedTour";

function AppContent() {
  const { profile, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ tab: string; action?: string } | null>(null);

  const handleNavigate = (tab: string, action?: string) => {
    setActiveTab(tab);
    if (action) setPendingAction({ tab, action });
  };

  // Detectar cambios de estado para transiciones suaves
  useEffect(() => {
    if (profile) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
  }, [profile?.id]);

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
      <AuthenticatedAppLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        renderContent={renderContent}
      />
    </GuidedTourProvider>
  );
}

function AuthenticatedAppLayout({
  activeTab,
  setActiveTab,
  renderContent,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  renderContent: () => React.ReactNode;
}) {
  const { isActive } = useGuidedTour();

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} forceSidebarOpen={isActive}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
