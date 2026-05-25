// src/tour/TourOverlay.jsx
import React, { useEffect, useState } from "react";
import { useTour } from "./TourContext";

const INITIAL_STYLE = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
};

const TourOverlay = () => {
  const { steps, isActive, currentStep, nextStep, prevStep, endTour } = useTour();

  const [highlightStyle, setHighlightStyle] = useState(INITIAL_STYLE);
  const [tooltipStyle, setTooltipStyle] = useState({});

  const step = steps[currentStep];

  // -------------------------
  // Clamp tooltip inside screen
  // -------------------------
  const clampPosition = (top, left, width, height) => {
    const padding = 16;
    const maxLeft = window.innerWidth - width - padding;
    const maxTop = window.innerHeight - height - padding;

    return {
      top: Math.max(padding, Math.min(top, maxTop)),
      left: Math.max(padding, Math.min(left, maxLeft)),
    };
  };

  // -------------------------
  // Recalculate positions
  // -------------------------
  useEffect(() => {
    if (!isActive || !step) return;

    const updatePositions = () => {
      const target = document.querySelector(step.selector);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Highlight box
      const pad = 8;
      setHighlightStyle({
        top: rect.top + scrollY - pad,
        left: rect.left + scrollX - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      });

      // Tooltip size
      const tooltipWidth = 320;
      const tooltipHeight = 140;

      let top, left;

      // Preferred placement
      switch (step.position) {
        case "top":
          top = rect.top + scrollY - tooltipHeight - 16;
          left = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
          break;

        case "right":
          top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + scrollX + 16;
          break;

        case "left":
          top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
          left = rect.left + scrollX - tooltipWidth - 16;
          break;

        case "bottom":
        default:
          top = rect.bottom + scrollY + 16;
          left = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
          break;
      }

      // Clamp to screen edges
      const { top: finalTop, left: finalLeft } = clampPosition(
        top,
        left,
        tooltipWidth,
        tooltipHeight
      );

      setTooltipStyle({
        top: finalTop,
        left: finalLeft,
        width: tooltipWidth,
      });
    };

    // Wait for smooth scroll
    const target = document.querySelector(step.selector);
    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "center" });
      setTimeout(updatePositions, 50);
    } else {
      updatePositions();
    }

    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions);

    return () => {
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions);
    };
  }, [isActive, step, currentStep]);

  if (!isActive || !step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Dimmed Screen */}
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={endTour} />

      {/* Highlight Box */}
      <div
        className="fixed z-[9999] pointer-events-none tour-highlight"
        style={highlightStyle}
      />

      {/* Tooltip */}
      <div
        className="absolute z-[10000] bg-sky-600 text-white rounded-lg shadow-xl p-4 text-sm"
        style={tooltipStyle}
      >
        <h4 className="font-semibold mb-1">{step.title}</h4>

        <p className="text-xs opacity-90 leading-relaxed mb-3">
          {step.description}
        </p>

        <div className="flex justify-between items-center">
          {/* PREVIOUS BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isFirst) prevStep();
            }}
            disabled={isFirst}
            className={`px-3 py-1 rounded text-xs border border-white/40 ${isFirst
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-white hover:text-sky-700 transition"
              }`}
          >
            ← Previous
          </button>

          {/* NEXT / END BUTTON */}
          <div className="flex gap-2">
            {!isLast ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextStep();
                }}
                className="px-3 py-1 rounded text-xs bg-black/70 hover:bg-black text-white transition"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  endTour();
                }}
                className="px-3 py-1 rounded text-xs bg-rose-500 hover:bg-rose-600 text-white transition"
              >
                End Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TourOverlay;
