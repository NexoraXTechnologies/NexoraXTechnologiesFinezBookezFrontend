import { runnerService } from './runnerService';
import { toast } from 'react-toastify';


export const ensureRunnerRunning = async () => {
  try {
    const st = await runnerService.status();
    const status = st?.data?.status || 'UNKNOWN';

    if (status === 'RUNNING') return { ok: true, status: 'RUNNING' };

    await runnerService.start();

    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const st2 = await runnerService.status();
      const status2 = st2?.data?.status || 'UNKNOWN';
      if (status2 === 'RUNNING') return { ok: true, status: 'RUNNING' };
    }

    return { ok: false, status: 'NOT_RUNNING' };
  } catch (e) {
    return { ok: false, status: 'NOT_DETECTED', error: e };
  }
};

const buildAppSettingsJson = () => {
  const getProfessionalHeader = (key) => {
    const data = JSON.parse(localStorage.getItem('professionalHeaders') || '{}');
    return data?.[key] ?? '';
  };

  const RunnerAuthToken = getProfessionalHeader('authtoken');
  const RunnerLoginUser = getProfessionalHeader('loginuser');
  const RunnerDbName = getProfessionalHeader('x-db-name'); // dbname

  return {
    Server: {
      PullUrl: 'https://api.e-taxsolutions.in/eTaxSolnMongoApiBackend/users/jobQueueAutomation/pull',
      UpdateByCommonIdBaseUrl: 'https://api.e-taxsolutions.in/eTaxSolnMongoApiBackend/users/jobQueueAutomation/updateByCommonId',
      RunnerDbName,
      RunnerLoginUser,
      RunnerAuthToken,
    },
    Automation: {
      PollingIntervalSeconds: 5,
    },
  };
};

export const ensureAppSettings = async () => {
  try {
    // Just build fresh JSON
    const obj = buildAppSettingsJson();

    // Always call write API
    await runnerService.writeAppsettings(obj);

    return { ok: true };
  } catch (e) {
    const data = e?.response?.data || null;
    const code = data?.code;

    if (code === "NO_PERMISSION") {
      toast.error(
        "No permission to write appsettings.json. Please reinstall Runner.",
        { autoClose: 7000 }
      );
      return { ok: false };
    }

    toast.error(data?.message || "Runner setup failed", {
      autoClose: 7000,
    });

    return { ok: false };
  }
};