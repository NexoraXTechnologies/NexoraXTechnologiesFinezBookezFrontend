import { UAParser } from 'ua-parser-js';
import { runnerService } from '../../../services/runnerService';

const pad2 = (n) => String(n).padStart(2, '0');

const dobToDDMMYYYY = (dob) => {
  // expects "yyyy-mm-dd"
  if (!dob || typeof dob !== 'string') return '';
  const [yyyy, mm, dd] = dob.split('-');
  if (!yyyy || !mm || !dd) return '';
  return `${dd}${mm}${yyyy}`; // ddmmyyyy
};

const nowCompact = (d = new Date()) => {
  // YYYYMMDDHHmmss
  return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
};

const makeJobId = (jobType) => {
  // ex: AIS-20260305134040-d444
  const ts = nowCompact(new Date());
  const rand = Math.random().toString(16).slice(2, 6); // 4 hex chars
  return `${jobType}-${ts}-${rand}`;
};

const getProfessionalHeader = (key) => {
  const data = JSON.parse(localStorage.getItem('professionalHeaders') || '{}');
  return data?.[key] ?? '';
};

// If you *must* get a "systemUniqueName" like CLIENT-PC-08 from backend,
// you cannot reliably derive it from UAParser alone (UAParser gives device/os/browser).
// We'll create a stable client id from UA + localStorage, and use that as targetAgentId.
const getTargetAgentId = () => {
  const stored = localStorage.getItem('targetAgentId');
  if (stored) return stored;

  const parser = new UAParser();
  const r = parser.getResult();
  const device = r.device?.model || r.device?.type || 'DEVICE';
  const os = r.os?.name || 'OS';
  const browser = r.browser?.name || 'BROWSER';

  const base = `${device}-${os}-${browser}`.replace(/\s+/g, '-').toUpperCase();
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  const target = `${base}-${suffix}`.slice(0, 32); // keep it short-ish

  localStorage.setItem('targetAgentId', target);
  return target;
};


const buildJobQueuePayload = ({ pan, fy, taxpayer, jobType,machineInfo  }) => {
  const dob = taxpayer?.payload?.PersonalDetails?.dob || '';
  const ddmmyyyy = dobToDDMMYYYY(dob);
  const itlPassword = taxpayer?.payload?.PersonalDetails?.itlPassword || '';


  const Authtoken = getProfessionalHeader('authtoken');
  const LoginUser = getProfessionalHeader('loginuser'); // used for cloudUserRef + tenantRef
  const parent = getProfessionalHeader('x-db-name'); // used for cloudUserRef + tenantRef



  // password rules:
  // - Form26: password = ddmmyyyy
  // - AIS/TIS: password = (pan + ddmmyyyy).toLowerCase()
  const password =
    jobType === 'Form26'
      ? ddmmyyyy
      : `${pan || ''}${ddmmyyyy}`.toLowerCase();

  const payload = {
    jobId: makeJobId(jobType),
    jobType, // "AIS" | "TIS" | "Form26"
    status: 'PENDING',
    input: {
      pan,
      password: itlPassword,
      taxPayerPWD: password,
      assessmentYear: fy,
      authToken: Authtoken,
    },
    requestedBy: {
      cloudUserRef: LoginUser,
      tenantRef: LoginUser,
    },
    execution: {
  targetAgentId: machineInfo?.machineId || parent,
  assignedAgentId: machineInfo?.hostname || null,
      assignedOn: null,
      startedOn: null,
      endedOn: null,
    },
    progress: {
      stage: 'QUEUED',
      percent: 0,
      message: 'Waiting for client runner',
      lastUpdatedOn: new Date().toISOString(),
    },
    error: null,
    createdOn: new Date().toISOString(),
    createdBy: LoginUser,
    modifiedOn: new Date().toISOString(),
    modifiedBy: LoginUser,
  };

  return payload;
};

const formatFYShort = (fy) => {
  if (!fy) return "";
  const [start, end] = fy.split("-");
  if (!start || !end) return fy;
  return `${start}-${end.slice(-2)}`;
};

export { buildJobQueuePayload, getTargetAgentId, makeJobId, getProfessionalHeader, dobToDDMMYYYY,formatFYShort };