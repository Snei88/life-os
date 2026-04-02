import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GUIDED_TOUR_STEPS } from "../lib/guidedTour";
import { cn } from "../lib/utils";

interface GuidedTourOverlayProps {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

type RectState = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const ACCENT_CLASS: Record<string, string> = {
  orange: "bg-orange-600 hover:bg-orange-700",
  green: "bg-green-600 hover:bg-green-700",
  purple: "bg-purple-600 hover:bg-purple-700",
};

const ACCENT_TEXT_CLASS: Record<string, string> = {
  orange: "text-orange-400 hover:text-orange-300",
  green: "text-green-400 hover:text-green-300",
  purple: "text-purple-400 hover:text-purple-300",
};

export const GuidedTourOverlay: React.FC<GuidedTourOverlayProps> = ({
  currentStep,
  onBack,
  onNext,
  onSkip,
  onFinish,
}) => {
  const step = GUIDED_TOUR_STEPS[currentStep];
  const [targetRect, setTargetRect] = useState<RectState | null>(null);

  useEffect(() => {
    let frame = 0;

    const updateRect = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${step.targetId}"]`);
      if (!target) {
        setTargetRect(null);
        frame = window.requestAnimationFrame(updateRect);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [step.targetId]);

  const tooltipStyle = useMemo(() => {
    const maxWidth = 360;
    const mobile = window.innerWidth < 768;

    if (!targetRect || mobile) {
      return {
        top: Math.max(24, window.innerHeight - 260),
        left: Math.max(16, (window.innerWidth - maxWidth) / 2),
      };
    }

    const preferredLeft = targetRect.left + targetRect.width + 24;
    const fitsRight = preferredLeft + maxWidth <= window.innerWidth - 24;
    const preferredTop = Math.min(
      Math.max(24, targetRect.top),
      window.innerHeight - 260
    );

    if (fitsRight) {
      return { top: preferredTop, left: preferredLeft };
    }

    const fallbackLeft = Math.max(24, targetRect.left - maxWidth - 24);
    return { top: preferredTop, left: fallbackLeft };
  }, [targetRect]);

  const highlightStyle = targetRect
    ? {
        top: targetRect.top - 8,
        left: targetRect.left - 8,
        width: targetRect.width + 16,
        height: targetRect.height + 16,
        boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.72)",
      }
    : null;

  const isLastStep = currentStep === GUIDED_TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] pointer-events-none"
      >
        <div className="absolute inset-0 pointer-events-auto" />
        {highlightStyle ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute rounded-2xl border border-white/40 bg-transparent pointer-events-none"
            style={highlightStyle}
          />
        ) : (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
        )}

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute w-[min(360px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl pointer-events-auto"
          style={tooltipStyle}
          role="dialog"
          aria-modal="true"
          aria-label={`Tour guiado: ${step.title}`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Tour Guiado
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">{step.title}</h3>
            </div>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold text-white/60">
              {currentStep + 1}/{GUIDED_TOUR_STEPS.length}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-white/80">{step.description}</p>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className={cn("h-full rounded-full", ACCENT_CLASS[step.accent])}
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / GUIDED_TOUR_STEPS.length) * 100}%` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={onSkip}
              className={cn("text-sm font-semibold transition-colors", ACCENT_TEXT_CLASS[step.accent])}
            >
              Skip
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                disabled={currentStep === 0}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={isLastStep ? onFinish : onNext}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors",
                  ACCENT_CLASS[step.accent]
                )}
              >
                {isLastStep ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
