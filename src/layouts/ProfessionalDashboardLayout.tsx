import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import ProfessionalNav from "../components/ProfessionalNav";
import TourOverlay from "../tour/TourOverlay";
import FloatingTourPanel from "../tour/FloatingTourPanel";
import ProfessionalSidebar from "../components/ProfessionalSidebar";

const ProfessionalDashboardLayout = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Mobile backdrop — only rendered when drawer is open ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/*
        ── Sidebar ──
        MOBILE  : fixed, off-screen by default (-translate-x-full),
                  slides in when mobileSidebarOpen = true (translate-x-0)
        DESKTOP : static in the flex row (not fixed), always visible,
                  lg:translate-x-0 ensures it is never hidden
      */}
      <aside
        className={
          // base — fixed on mobile, static on desktop
          "fixed inset-y-0 left-0 z-40 " +
          "lg:static lg:inset-y-auto lg:z-auto " +
          // slide transition
          "transition-transform duration-300 ease-in-out " +
          // open/closed state
          (mobileSidebarOpen ? "translate-x-0 " : "-translate-x-full ") +
          // desktop always visible
          "lg:translate-x-0"
        }
      >
        <ProfessionalSidebar
          onMenuItemsChange={setMenuItems}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </aside>

      {/* ── Main content — takes remaining width ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ProfessionalNav
          menuItems={menuItems}
          onMobileMenuToggle={() => setMobileSidebarOpen((p) => !p)}
        />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>

      <FloatingTourPanel />
      <TourOverlay />
    </div>
  );
};

export default ProfessionalDashboardLayout;
