// src/tour/TourContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { professionalTourConfig } from "./professionalTourConfig";

export type TourStep = {
  target: string;
  title?: string;
  content?: string;
  placement?: string;
};

type TourContextType = {
  steps: TourStep[];
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
};

type TourProviderProps = {
  children: ReactNode;
};

const TourContext = createContext<TourContextType | null>(null);

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);

  if (!context) {
    throw new Error("useTour must be used inside TourProvider");
  }

  return context;
};

export const TourProvider = ({ children }: TourProviderProps) => {
  const location = useLocation();

  const [steps, setSteps] = useState<TourStep[]>([]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Load steps when route changes
  useEffect(() => {
    const path = location.pathname;
    const routeSteps = professionalTourConfig[path] || [];

    setSteps(routeSteps);
    // if route changes while tour is active, end it
    setIsActive(false);
    setCurrentStep(0);
  }, [location.pathname]);

  const startTour = () => {
    if (!steps || steps.length === 0) return;

    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    setCurrentStep((prev) => {
      if (!steps) return prev;
      if (prev >= steps.length - 1) return prev;

      return prev + 1;
    });
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev <= 0 ? 0 : prev - 1));
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const value: TourContextType = {
    steps,
    isActive,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    endTour,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};