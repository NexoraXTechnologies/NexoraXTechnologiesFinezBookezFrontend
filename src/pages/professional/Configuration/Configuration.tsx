import { useMemo, useState } from 'react';
import { Sliders, Terminal, Settings2 } from 'lucide-react';
import AutomationSetupModal from '../Automation/AutomationSetupModal';

/* ================== SMALL TOGGLE ================== */
const ToggleSwitch = ({ checked, onChange }: any) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${checked ? 'bg-primary' : 'bg-muted'}`}
    aria-pressed={checked}
  >
    <span className={`inline-block h-3 w-3 transform rounded-full bg-primary-foreground transition ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
  </button>
);

const Configuration = () => {
  const [automationModalOpen, setAutomationModalOpen] = useState(false);
  // const [setupCompleted, setSetupCompleted] = useState(false);

  const [enableAutomation, setEnableAutomation] = useState(() => {
    const v = localStorage.getItem('nx_enable_automation');
    return v === 'true';
  });

  const statusText = useMemo(() => (enableAutomation ? 'Enabled' : 'Disabled'), [enableAutomation]);

  // ✅ if modal closes without success -> rollback toggle
  // const rollbackDisable = () => {
  //   setEnableAutomation(false);
  //   localStorage.setItem('nx_enable_automation', 'false');
  // };

  return (
    <div className="min-h-full bg-background p-4 text-foreground">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Configuration</h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage system settings and automation utilities.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ✅ Automation Box */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-start justify-between gap-3 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Terminal size={18} className="text-primary" />
              </div>

              <div>
                <div className="font-semibold text-card-foreground">
                  Automation
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Setup local folders & permissions for Income Tax automation.
                </div>
              </div>
            </div>

            <div className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
              {statusText}
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">
                  Enable Automation
                </div>

                <div className="text-xs text-muted-foreground">
                  When enabled, we’ll guide you through local setup.
                </div>
              </div>

              <div className="ml-3 mt-[2px] flex-shrink-0">
                <ToggleSwitch
                  checked={enableAutomation}
                  onChange={(next: any) => {
                    // ✅ Toggle OFF directly
                    if (!next) {
                      setEnableAutomation(false);
                      localStorage.setItem('nx_enable_automation', 'false');
                      return;
                    }

                    // setSetupCompleted(false);

                    // ✅ Toggle ON should open modal first (do not persist true yet)
                    setAutomationModalOpen(true);
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                onClick={() => setAutomationModalOpen(true)}
              >
                View Setup
              </button>

              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground transition hover:bg-primary/90"
                onClick={() => setAutomationModalOpen(true)}
              >
                Run Setup Guide
              </button>
            </div>
          </div>
        </div>

        {/* Placeholder card */}
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-start gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Settings2 size={18} className="text-primary" />
            </div>

            <div>
              <div className="font-semibold text-card-foreground">
                More Settings
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                Add more configuration cards here.
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 text-sm text-muted-foreground">
            Coming soon…
          </div>
        </div>
      </div>

      {/* ✅ Modal (API will trigger inside modal on open) */}
      <AutomationSetupModal
        open={automationModalOpen}
        onClose={(reason: any) => {
          setAutomationModalOpen(false);

          // ✅ rollback only if user cancelled / error
          if (reason !== 'success') {
            setEnableAutomation(false);
            localStorage.setItem('nx_enable_automation', 'false');
          }

          // setSetupCompleted(false);
        }}
        onSuccess={() => {
          // setSetupCompleted(true);
          setEnableAutomation(true);
          localStorage.setItem('nx_enable_automation', 'true');
          setAutomationModalOpen(false);
        }}
      />
    </div>
  );
};

export default Configuration;