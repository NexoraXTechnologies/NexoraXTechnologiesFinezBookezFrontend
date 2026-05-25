import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Calendar,
  FileText,
  ReceiptIndianRupee,
  FileSearch,
  Banknote,
  Landmark,
  Hash,
  TrendingUp,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  User2,
  ClipboardList,
  IndianRupee,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { BeatLoader } from 'react-spinners';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { runAutomationAis, getJobQueueAutomationByCommonId } from '../../../redux/slices/professionalSlice/automation/automatioinSlice';
import { getFiledReturnData } from '../../../redux/slices/professionalSlice/preFillTaxPayers/preFillTaxPayersSlice';

import { ensureAppSettings, ensureRunnerRunning } from '../../../services/ensureRunnerRunning';
import { runnerService } from '../../../services/runnerService';
import { getProfessionalHeader, makeJobId } from './AISTISForm26PayloadBuilder';

/* ---------------- YOUR THEME CONSTANTS (kept as-is) ---------------- */
const COLORS = {
  salary: 'bg-[#ecf7f3] border-[#4c9d82]', // green soft
  business: 'bg-[#edf4fe] border-[#3066b6]', // blue soft
  otherSource: 'bg-[#fef3e1] border-[#c97b56]', // orange soft
  taxesPaid: 'bg-[#f7f1fb] border-[#6b489f]', // purple soft
  capitalGain: 'bg-[#ebe4fa] border-[#75649d]',
  sft: 'bg-[#f4e8dd] border-[#98643c]',
};

/* -----------------------------------
   CARD ICONS
----------------------------------- */
const ICONS = {
  salary: <Wallet className="w-5 h-5 text-[#4c9d82]" />,
  business: <ReceiptIndianRupee className="w-5 h-5 text-[#3066b6]" />,
  otherSource: <FileSearch className="w-5 h-5 text-[#c97b56]" />,
  taxesPaid: <Landmark className="w-5 h-5 text-[#6b489f]" />,
  capitalGain: <TrendingUp className="w-5 h-5 text-[#75649d]" />,
  sft: <Banknote className="w-5 h-5 text-[#98643c]" />,
};
/* ------------------------------------------------------------------ */

/* ---------------- helpers ---------------- */
const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
};

const normalizeTimeline = (timeline) => {
  if (!timeline) return [];
  if (Array.isArray(timeline)) return timeline.filter(Boolean);
  if (typeof timeline === 'object') return [timeline];
  return [];
};

const statusTone = (s = '') => {
  const t = String(s).toLowerCase();
  if (t.includes('refund payment failed') || t.includes('failed')) return 'red';
  if (t.includes('refund') || t.includes('reissued')) return 'amber';
  if (t.includes('processed') && t.includes('no demand')) return 'green';
  if (t.includes('success') || t.includes('e-verified') || t.includes('verified')) return 'green';
  if (t.includes('pending')) return 'slate';
  if (t.includes('under processing') || t.includes('processing')) return 'blue';
  return 'slate';
};

const toneClasses = {
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
};

// subtle card tint (professional, very light)
const toneCardTint = {
  green: 'from-green-50/60 to-white',
  red: 'from-red-50/60 to-white',
  amber: 'from-amber-50/60 to-white',
  blue: 'from-blue-50/60 to-white',
  slate: 'from-slate-50/70 to-white',
};

const toneIcon = {
  green: CheckCircle2,
  red: XCircle,
  amber: AlertCircle,
  blue: RefreshCw,
  slate: Clock,
};

const isNotFound = (err) => {
  const status = err?.status || err?.response?.status;
  const msg = String(err?.message || err?.response?.data?.message || '').toLowerCase();
  return status === 404 || msg.includes('not found') || msg.includes('no file') || msg.includes('no data');
};

const makeFiledReturnFileName = (p) => `${String(p || '').toUpperCase()}_FiledReturns.json`;

const isAutomationEnabledLocal = () => localStorage.getItem('nx_enable_automation') === 'true';

/* ---------------- small UI bits ---------------- */
const InfoPill = ({ icon: Icon, label, value }) => (
  <div className="px-3 py-2 rounded-xl bg-white border text-gray-700 inline-flex items-center gap-2 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
    {!!Icon && <Icon size={16} className="text-gray-500" />}
    <span className="text-gray-500">{label}:</span>
    <span className="font-semibold">{value ?? '—'}</span>
  </div>
);

const SectionBadge = ({ tone, text }) => {
  const Icon = toneIcon[tone] || Clock;
  return (
    <span className={`text-xs border rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 ${toneClasses[tone]}`}>
      <Icon size={14} />
      <span className="font-medium">{text}</span>
    </span>
  );
};

/* ---------------- UI components ---------------- */
const SkeletonCard = () => (
  <div className="border rounded-2xl p-5 bg-white shadow-sm">
    <div className="h-4 w-40 bg-gray-100 rounded mb-3" />
    <div className="h-3 w-64 bg-gray-100 rounded mb-2" />
    <div className="h-3 w-48 bg-gray-100 rounded mb-5" />
    <div className="h-10 w-full bg-gray-100 rounded-xl" />
  </div>
);

const TimelineItem = ({ item, idx, isLast }) => {
  const tone = statusTone(item?.status);
  const Icon = toneIcon[tone] || Clock;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: idx * 0.04 }} className="relative pl-10 pb-5 last:pb-0">
      {/* left status icon */}
      <div className="absolute left-2 top-[2px]">
        <div className={`h-6 w-6 rounded-full border flex items-center justify-center ${toneClasses[tone]} shadow-[0_1px_0_rgba(0,0,0,0.03)]`}>
          <Icon size={16} />
        </div>
      </div>

      {/* vertical connector */}
      {!isLast && <div className="absolute left-[20px] top-7 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />}

      <div className="flex flex-col">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${toneClasses[tone]}`}>
          <span className="font-semibold tracking-tight">{item?.status || '—'}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">{item?.date || '—'}</div>
      </div>
    </motion.div>
  );
};

const ReturnCard = ({ r, index, open, onToggle }) => {
  const timeline = useMemo(() => normalizeTimeline(r?.timeline), [r?.timeline]);
  const headStatus = timeline?.[0]?.status || 'Status unavailable';
  const headTone = statusTone(headStatus);
  const HeaderIcon = toneIcon[headTone] || BadgeCheck;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.04 }} className="border rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* tinted header area */}
      <div className={`bg-gradient-to-b ${toneCardTint[headTone]} border-b`}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl border bg-white/80 flex items-center justify-center shadow-sm">
                    <HeaderIcon size={18} className="text-gray-700" />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-gray-900 leading-tight">AY {r?.fetchassessmentYear || '—'}</span>
                    <span className="text-xs text-gray-500 -mt-0.5">Filed return details</span>
                  </div>
                </div>

                <SectionBadge tone={headTone} text={headStatus} />
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <ClipboardList size={16} className="text-gray-400" />
                  <span className="font-medium">{r?.itrType || '—'}</span>
                  <span className="text-gray-300">•</span>
                  <span>{r?.filingSection || '—'}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Hash size={16} className="text-gray-400" />
                  <span className="truncate">{r?.acknowledgementNo || '—'}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{r?.filingDate || '—'}</span>
                  <span className="text-gray-300">•</span>
                  <span className="capitalize inline-flex items-center gap-1">
                    <User2 size={14} className="text-gray-400" />
                    {r?.filedBy || '—'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <ShieldCheck size={16} className="text-gray-400" />
                  <span className="font-medium">Intimation:</span>
                  <span className="text-gray-600 truncate">{r?.intimationOrder || '—'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-white/70 border border-transparent hover:border-slate-200">
              Timeline
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={18} />
              </motion.span>
            </button>
          </div>
        </div>
      </div>

      {/* timeline */}
      <div className="p-5">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div key="timeline" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.26 }} className="border-t pt-4">
              {timeline.length === 0 ? (
                <div className="text-sm text-gray-500">No timeline data</div>
              ) : (
                <div className="relative">
                  {timeline.map((t, idx) => (
                    <TimelineItem key={`${t?.status || 's'}-${t?.date || 'd'}-${idx}`} item={t} idx={idx} isLast={idx === timeline.length - 1} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ---------------- main screen ---------------- */
const Refund = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const aliveRef = useRef(true);

  const [pan, setPan] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [refundData, setRefundData] = useState(null);
  const [openKeys, setOpenKeys] = useState(() => new Set());

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const toggleOpen = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const panRegex = useMemo(() => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, []);

  const panError = useMemo(() => {
    if (!pan) return '';
    if (pan.length !== 10) return 'PAN must be 10 characters.';
    if (!panRegex.test(pan)) return 'Enter a valid PAN (e.g. ABCDE1234F).';
    return '';
  }, [pan, panRegex]);

  const passwordError = useMemo(() => {
    if (!password) return '';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  }, [password]);

  const canSubmit = useMemo(() => {
    return pan && password && !panError && !passwordError && !loading;
  }, [pan, password, panError, passwordError, loading]);

  const fetchRefund = useCallback(
    async (fileName) => {
      const filedRes = await dispatch(getFiledReturnData(fileName)).unwrap();
      return filedRes;
    },
    [dispatch],
  );
  const buildFiledReturnsJobQueuePayload = ({ panValue, itlPassword, machineInfo }) => {
    const Authtoken = getProfessionalHeader('authtoken');
    const LoginUser = getProfessionalHeader('loginuser');
    const parent = getProfessionalHeader('x-db-name');

    return {
      jobId: makeJobId('FILEDRETURNS'),
      jobType: 'FILEDRETURNS',
      status: 'PENDING',
      input: {
        pan: panValue,
        password: String(itlPassword || '').trim(),
        taxPayerPWD: null,
        assessmentYear: '2024-25',
        authToken: Authtoken,
      },
      requestedBy: { cloudUserRef: LoginUser, tenantRef: LoginUser },
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
  };
  const handleSyncRefund = async () => {
    const cleanPan = String(pan || '')
      .toUpperCase()
      .trim();

    const cleanPwd = String(password || '').trim();

    const fileName = makeFiledReturnFileName(cleanPan);

    if (!cleanPan) return toast.error('PAN is required');
    if (panError) return toast.error(panError);
    if (!cleanPwd) return toast.error('Password is required');
    if (passwordError) return toast.error(passwordError);

    try {
      setLoading(true);
      setRefundData(null);

      if (!isAutomationEnabledLocal()) {
        toast.error('Please enable Automation by navigating in Settings tab');
        navigate('/professional/configuration');
        return;
      }

      const cfg = await ensureAppSettings();
      if (!cfg.ok) {
        toast.error('Runner not started. Please open NexoraX Runner.');
        return;
      }

      const rr = await ensureRunnerRunning();
      if (!rr.ok) {
        toast.error('Runner not detected. Please start NexoraX Runner.');
        return;
      }

      let machineInfo = null;

      try {
        const mi = await runnerService.getMachineInfo();
        machineInfo = mi?.data || null;
      } catch {
        toast.error('Unable to get Runner machine info');
        return;
      }

      const payload = buildFiledReturnsJobQueuePayload({
        panValue: cleanPan,
        itlPassword: cleanPwd,
        machineInfo,
      });

      const runRes = await dispatch(runAutomationAis(payload)).unwrap();

      const commonId = runRes?.data?.commonId;

      if (!commonId) throw new Error('Job ID not received');

      toast.info('Syncing latest filed return data...');

      await pollJob(commonId);

      const finalJson = await fetchRefund(fileName);

      if (!aliveRef.current) return;

      setRefundData(finalJson);

      toast.success('Filed Return data synced successfully');

    } catch (err) {
      toast.error(err?.message || 'Sync failed');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  };
  const pollJob = async (commonId) => {
    const MAX_TRIES = 60;
    const INTERVAL = 5000;

    let tries = 0;

    while (tries < MAX_TRIES) {
      tries++;

      try {
        const res = await dispatch(
          getJobQueueAutomationByCommonId({ commonId })
        ).unwrap();

        const job = res?.data;

        if (!job) throw new Error('Invalid job response');

        if (job.status === 'FAILED') {
          toast.error('Automation failed');
          return;
        }

        if (job.status === 'COMPLETED') {
          return;
        }

        await new Promise((r) => setTimeout(r, INTERVAL));
      } catch (err) {
        toast.error(err?.message || 'Job status check failed');
        return;
      }
    }

    toast.error('Job timeout. Please try again.');
  };

  const handleGetRefundDetails = async () => {
    const cleanPan = String(pan || '')
      .toUpperCase()
      .trim();
    const cleanPwd = String(password || '').trim();
    const fileName = makeFiledReturnFileName(cleanPan);

    if (!cleanPan) return toast.error('PAN is required');
    if (panError) return toast.error(panError);
    if (!cleanPwd) return toast.error('Password is required');
    if (passwordError) return toast.error(passwordError);

    try {
      setLoading(true);
      setRefundData(null);
      setOpenKeys(new Set());

      // 1) try already existing JSON
      try {
        const existing = await fetchRefund(fileName);
        toast.info('Filed Return data already exists');
        if (!aliveRef.current) return;

        setRefundData(existing);

        const firstKey = existing?.filedReturns?.[0]?.acknowledgementNo || '0';
        setOpenKeys(new Set([firstKey]));
        return;
      } catch (err) {
        if (!isNotFound(err)) {
          toast.error(err?.message || 'Filed Return check failed');
          return;
        }
      }

      // 2) run automation (keep your commented code as-is)
      if (!isAutomationEnabledLocal()) {
        toast.error('Please enable Automation by navigating in Settings tab', { autoClose: 5000 });
        navigate('/professional/configuration');
        return;
      }
      const cfg = await ensureAppSettings();
      if (!cfg.ok) {
        toast.error('Runner is may not started for appsettings. Please install/open NexoraX Runner.');
        return;
      }
      const rr = await ensureRunnerRunning();
      if (!rr.ok) {
        toast.error(rr.status === 'NOT_DETECTED'
          ? 'Runner not detected. Please install/open NexoraX Runner.'
          : 'Runner could not be started. Please open NexoraX Runner and try again.');
        return;
      }
      let machineInfo = null;
      try {
        const mi = await runnerService.getMachineInfo();
        machineInfo = mi?.data || null;
      } catch {
        toast.error('Unable to get Runner machine info');
        return;
      }
      const payload = buildFiledReturnsJobQueuePayload({
        panValue: cleanPan,
        itlPassword: cleanPwd,
        machineInfo,
      });
      const runRes = await dispatch(runAutomationAis(payload)).unwrap();
      const commonId = runRes?.data?.commonId;
      if (!commonId) throw new Error('Job ID not received');
      toast.info('Fetching Filed Return data…');
      await pollJob(commonId);

      const finalJson = await fetchRefund(fileName);

      if (!aliveRef.current) return;
      toast.success('Refund details ready');
      setRefundData(finalJson);

      const firstKey = finalJson?.filedReturns?.[0]?.acknowledgementNo || '0';
      setOpenKeys(new Set([firstKey]));
    } catch (err) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  };

  const filedReturns = useMemo(() => {
    const arr = refundData?.filedReturns;
    return Array.isArray(arr) ? arr : [];
  }, [refundData]);

  const InfoPill = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-md bg-white text-gray-700">
      <Icon size={12} className="text-gray-500" />
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 via-white to-white rounded-b-md">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-2">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full border rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-3 py-1.5 border-b bg-slate-50 flex items-center gap-2">
            <ClipboardList size={14} className="text-blue-600" />
            <span className="text-xs font-medium text-gray-700">Fetch Filed Return Details</span>
            <span className="text-[11px] text-gray-500 ml-2">Enter PAN & password to retrieve filed return timeline</span>
          </div>

          {/* Body */}
          <div className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              {/* PAN */}
              {/* PAN */}
              <div className="relative">
                <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-gray-600">PAN</span>

                <input
                  maxLength={10}
                  value={pan}
                  autoComplete="off"
                  name="pan_number"
                  onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="Enter PAN"
                  disabled={loading}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md outline-none
    focus:border-blue-600 ${panError ? 'border-red-400' : 'border-gray-300'}`}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-gray-600">Password</span>

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  name="refund_password"
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  disabled={loading}
                  className={`w-full px-3 py-1.5 pr-9 text-sm border rounded-md outline-none
    focus:border-blue-600 ${passwordError ? 'border-red-400' : 'border-gray-300'}`}
                />

                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleGetRefundDetails}
                  disabled={!canSubmit}
                  className={`flex-1 h-[32px] text-sm rounded-md flex justify-center items-center font-medium transition ${canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-200 text-white cursor-not-allowed'}`}>
                  {loading ? <BeatLoader size={6} color="#ffffff" /> : 'Get Refund Details'}
                </button>

                <button type="button" onClick={handleSyncRefund} disabled={!canSubmit} className="bg-green-600 text-white px-3 h-[32px] text-sm rounded-md flex items-center gap-1 hover:bg-green-700 disabled:opacity-60">
                  <RefreshCw size={14} />
                  Sync Latest Status
                </button>
              </div>
            </div>
          </div>
          {/* Summary strip */}
          <AnimatePresence>
            {!!refundData && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="border-t bg-gradient-to-b from-blue-50/60 via-slate-50/70 to-white">
                <div className="p-2">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] bg-white/80 border border-blue-100 rounded-md px-2 py-1 shadow-sm">
                    <InfoPill icon={BadgeCheck} label="PAN" value={refundData?.pan || '—'} />
                    <InfoPill icon={Calendar} label="AY" value={refundData?.assessmentYearRequested || '—'} />
                    <InfoPill icon={Clock} label="Generated" value={fmtDateTime(refundData?.generatedOn)} />
                    <InfoPill icon={FileText} label="Returns" value={filedReturns.length} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <div className="mt-6 w-full">
          {loading && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {!loading && refundData && filedReturns.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-600">
              No filed returns found.
            </motion.div>
          )}

          {!loading && filedReturns.length > 0 && (
            <motion.div layout className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filedReturns.map((r, idx) => {
                const k = r?.acknowledgementNo || String(idx);
                return <ReturnCard key={k} r={r} index={idx} open={openKeys.has(k)} onToggle={() => toggleOpen(k)} />;
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Refund;
