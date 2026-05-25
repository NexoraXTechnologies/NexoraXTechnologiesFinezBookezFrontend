import React, { useMemo, useState } from 'react';
import { Sliders, Terminal, Settings2 } from 'lucide-react';
import AutomationSetupModal from '../Automation/AutomationSetupModal';


/* ================== SMALL TOGGLE ================== */
const ToggleSwitch = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${checked ? 'bg-blue-600' : 'bg-gray-300'}`} aria-pressed={checked}>
    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
  </button>
);

const Configuration = () => {
  const [automationModalOpen, setAutomationModalOpen] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);


  const [enableAutomation, setEnableAutomation] = useState(() => {
    const v = localStorage.getItem('nx_enable_automation');
    return v === 'true';
  });

  const statusText = useMemo(() => (enableAutomation ? 'Enabled' : 'Disabled'), [enableAutomation]);

  // ✅ if modal closes without success -> rollback toggle
  const rollbackDisable = () => {
    setEnableAutomation(false);
    localStorage.setItem('nx_enable_automation', 'false');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-gray-700" />
            <h1 className="text-lg font-semibold text-gray-900">Configuration</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Manage system settings and automation utilities.</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ✅ Automation Box */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Terminal size={18} className="text-gray-700" />
              </div>

              <div>
                <div className="font-semibold text-gray-900">Automation</div>
                <div className="text-sm text-gray-500 mt-1">Setup local folders & permissions for Income Tax automation.</div>
              </div>
            </div>

            <div className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600">{statusText}</div>
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-gray-900">Enable Automation</div>
                <div className="text-xs text-gray-500">When enabled, we’ll guide you through local setup.</div>
              </div>

              <div className="ml-3 flex-shrink-0 mt-[2px]">
                <ToggleSwitch
                  checked={enableAutomation}
                  onChange={(next) => {
                    // ✅ Toggle OFF directly
                    if (!next) {
                      setEnableAutomation(false);
                      localStorage.setItem('nx_enable_automation', 'false');
                      return;
                    }
                    setSetupCompleted(false);
                    // ✅ Toggle ON should open modal first (do not persist true yet)
                    setAutomationModalOpen(true);
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm" onClick={() => setAutomationModalOpen(true)}>
                View Setup
              </button>

              <button type="button" className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm" onClick={() => setAutomationModalOpen(true)}>
                Run Setup Guide
              </button>
            </div>
          </div>
        </div>

        {/* Placeholder card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Settings2 size={18} className="text-gray-700" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">More Settings</div>
              <div className="text-sm text-gray-500 mt-1">Add more configuration cards here.</div>
            </div>
          </div>
          <div className="px-5 pb-5 text-sm text-gray-500">Coming soon…</div>
        </div>
      </div>

      {/* ✅ Modal (API will trigger inside modal on open) */}
      <AutomationSetupModal
        open={automationModalOpen}
        onClose={(reason) => {
          setAutomationModalOpen(false);

          // ✅ rollback only if user cancelled / error
          if (reason !== 'success') {
            setEnableAutomation(false);
            localStorage.setItem('nx_enable_automation', 'false');
          }

          setSetupCompleted(false);
        }}
        onSuccess={() => {
          setSetupCompleted(true);
          setEnableAutomation(true);
          localStorage.setItem('nx_enable_automation', 'true');
          setAutomationModalOpen(false);
        }}
      />


    </div>
  );
};

export default Configuration;
