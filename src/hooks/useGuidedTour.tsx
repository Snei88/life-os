import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GuidedTourOverlay } from "../components/GuidedTourOverlay";
import {
  GUIDED_TOUR_STEPS,
  getGuidedTourCompletedKey,
  getGuidedTourProgressKey,
} from "../lib/guidedTour";

interface GuidedTourContextType {
  isActive: boolean;
  currentStep: number;
  startTour: (startStep?: number) => void;
  skipTour: () => void;
  finishTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  resetTourProgress: () => void;
}

const GuidedTourContext = createContext<GuidedTourContextType>({
  isActive: false,
  currentStep: 0,
  startTour: () => {},
  skipTour: () => {},
  finishTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  resetTourProgress: () => {},
});

interface GuidedTourProviderProps {
  children: React.ReactNode;
  userId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const GuidedTourProvider: React.FC<GuidedTourProviderProps> = ({
  children,
  userId,
  activeTab,
  setActiveTab,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const completedKey = useMemo(() => getGuidedTourCompletedKey(userId), [userId]);
  const progressKey = useMemo(() => getGuidedTourProgressKey(userId), [userId]);

  useEffect(() => {
    if (!userId) return;

    const completed = localStorage.getItem(completedKey) === "true";
    const savedProgress = Number(localStorage.getItem(progressKey) || 0);

    if (!completed) {
      const step = Number.isFinite(savedProgress) ? Math.max(0, Math.min(savedProgress, GUIDED_TOUR_STEPS.length - 1)) : 0;
      const timer = window.setTimeout(() => {
        setCurrentStep(step);
        setIsActive(true);
      }, 350);
      return () => window.clearTimeout(timer);
    }
  }, [completedKey, progressKey, userId]);

  useEffect(() => {
    if (!isActive) return;
    localStorage.setItem(progressKey, String(currentStep));
    const targetTab = GUIDED_TOUR_STEPS[currentStep]?.tab;
    if (targetTab && activeTab !== targetTab) {
      setActiveTab(targetTab);
    }
  }, [activeTab, currentStep, isActive, progressKey, setActiveTab]);

  const startTour = (startStep = 0) => {
    const safeStep = Math.max(0, Math.min(startStep, GUIDED_TOUR_STEPS.length - 1));
    localStorage.removeItem(completedKey);
    localStorage.setItem(progressKey, String(safeStep));
    setCurrentStep(safeStep);
    setIsActive(true);
  };

  const finishTour = () => {
    localStorage.setItem(completedKey, "true");
    localStorage.removeItem(progressKey);
    setIsActive(false);
    setCurrentStep(0);
  };

  const skipTour = () => finishTour();

  const nextStep = () => {
    if (currentStep >= GUIDED_TOUR_STEPS.length - 1) {
      finishTour();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const resetTourProgress = () => {
    localStorage.removeItem(completedKey);
    localStorage.removeItem(progressKey);
  };

  return (
    <GuidedTourContext.Provider
      value={{
        isActive,
        currentStep,
        startTour,
        skipTour,
        finishTour,
        nextStep,
        prevStep,
        resetTourProgress,
      }}
    >
      {children}
      {isActive && (
        <GuidedTourOverlay
          currentStep={currentStep}
          onBack={prevStep}
          onNext={nextStep}
          onSkip={skipTour}
          onFinish={finishTour}
        />
      )}
    </GuidedTourContext.Provider>
  );
};

export const useGuidedTour = () => useContext(GuidedTourContext);
