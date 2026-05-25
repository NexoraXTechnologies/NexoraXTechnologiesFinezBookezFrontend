import React, { useState } from "react";
import { useTour } from "./TourContext";
import { Compass } from "lucide-react";

const FloatingTourPanel = () => {
  const { steps, startTour } = useTour();
  const [open, setOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div
      className={`fixed top-1/2 right-0 -translate-y-1/2 z-[9999] 
                  bg-sky-600 text-white shadow-xl rounded-l-lg 
                  transition-all duration-300 overflow-hidden
                   ${open ? 'w-48 ' : 'w-9 h-48'}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      {/* 🚗 Vertical Tab with Car Animation */}
      <div className="relative flex flex-col items-center justify-center h-full cursor-pointer">
        {/* Car Animation */}
        {!open && <div className="car-animation">🚗</div>}

        {/* Compass Icon (optional) */}
        {/* {!open && <Compass size={24} className="mt-12 opacity-90" />} */}

        {/* Vertical Text */}
        {!open && <span className="mt-3 text-[13px] gap-6 font-semibold writing-vertical">TOUR</span>}
      </div>

      {/* Panel Content */}
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <h3 className="font-semibold text-sm mt-2">Need Help?</h3>
          <p className="text-xs opacity-90">Take a guided tour of this page.</p>

          <button className="w-full bg-black/50 text-white text-xs py-1.5 rounded hover:bg-black transition" onClick={startTour}>
            Start Tour
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingTourPanel;