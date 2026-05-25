import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import ProfessionalNav from "../components/ProfessionalNav";
import TourOverlay from "../tour/TourOverlay";
import FloatingTourPanel from "../tour/FloatingTourPanel";
import ProfessionalSidebar from "../components/ProfessionalSidebar";

const ProfessionalDashboardLayout = () => {
  const [menuItems, setMenuItems] = useState([]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <ProfessionalSidebar onMenuItemsChange={setMenuItems} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ProfessionalNav menuItems={menuItems} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
      {/* 🌟 Floating Tour Slider */}
      <FloatingTourPanel />
      <TourOverlay />
    </div>
  );
};

export default ProfessionalDashboardLayout;