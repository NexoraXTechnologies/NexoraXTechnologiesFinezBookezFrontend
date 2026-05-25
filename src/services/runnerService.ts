import axios from 'axios';

const RUNNER_BASE = 'http://127.0.0.1:5150';

export const runnerService = {
  async status() {
    const res = await axios.get(`${RUNNER_BASE}/runner/status`, { timeout: 1500 });
    return res.data; // { success, data: { status: "RUNNING"|"STOPPED" } }
  },

  async start() {
    const res = await axios.post(`${RUNNER_BASE}/runner/start`, {}, { timeout: 5000 });
    return res.data;
  },

  async stop() {
    const res = await axios.post(`${RUNNER_BASE}/runner/stop`, {}, { timeout: 5000 });
    return res.data;
  },

  async appsettingsExists() {
    const res = await axios.get(`${RUNNER_BASE}/runner/appsettings/exists`, { timeout: 2000 });
    return res.data;
  },

  async writeAppsettings(payload) {
    const res = await axios.post(`${RUNNER_BASE}/runner/appsettings/write`, payload, { timeout: 5000 });
    return res.data;
  },

  async getMachineInfo() {
  const res = await axios.get(`${RUNNER_BASE}/runner/machine-info`, { timeout: 2000 });
  console.log("response",res)
  return res.data;
}

};
