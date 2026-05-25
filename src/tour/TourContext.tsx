// src/tour/TourContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { professionalTourConfig } from "./professionalTourConfig";

const TourContext = createContext(null);

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
  const location = useLocation();
  const [steps, setSteps] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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

  const value = {
    steps,
    isActive,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    endTour,
  };

  return (
    <TourContext.Provider value={value}>{children}</TourContext.Provider>
  );
};