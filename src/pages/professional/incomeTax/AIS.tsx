// src/modules/ais/pages/AIS.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getJobQueueAutomationByCommonId, runAutomationAis } from "../../../redux/slices/professionalSlice/automation/automatioinSlice";
import { updateTaxpayer,getTaxPayerDetails } from "../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";
import { buildJobQueuePayload } from './AISTISForm26PayloadBuilder';
import { getAllTaxPayers } from "../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";
import {
  fetchAISByDocId,
  processAISPdf,
  saveAIS,
} from "../../../redux/slices/professionalSlice/incomeTaxSlice/aisSlice";
import {
  downloadForm26ASFile,
  uploadForm26ASFile,
} from "../../../redux/slices/professionalSlice/incomeTaxSlice/form26asSlice";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import {
  Receipt,
  FileSearch,
  Wallet,
  Undo2,
  TrendingUp,
  SearchCheck,
  Upload,
  FolderSync,
  Download,
  Share2,
  ReceiptIndianRupee,
  X, Lock
} from "lucide-react";
import { fetchAssessmentYearDropdown } from "../../../redux/slices/professionalSlice/allDropDowns/alldropdownSlice";
import { ensureAppSettings, ensureRunnerRunning } from '../../../services/ensureRunnerRunning';
import { runnerService } from "../../../services/runnerService";
import { SelectInput } from "../../../components/inputs";
import { BlueButton, DataCreateButton, SecondaryButton, SuccessButton } from "../../../components/buttons";

const COLORS = {
  tdsTcs: "bg-[#ecf7f3] border-[#4c9d82]", // green soft
  sftInformation: "bg-[#edf4fe] border-[#3066b6]", // blue soft
  taxPayments: "bg-[#fef3e1] border-[#c97b56]", // orange-beige
  demandRefund: "bg-[#f7f1fb] border-[#6b489f]", // purple soft
  // pendingProceeding: "bg-[#ebe4fa] border-[#75649d]",
  // completeProceeding: "bg-[#f4e8dd] border-[#98643c]",
};

const ICONS = {
  tdsTcs: <ReceiptIndianRupee className="w-5 h-5 text-[#4c9d82]" />,
  sftInformation: <FileSearch className="w-5 h-5 text-[#3066b6]" />,
  taxPayments: <Wallet className="w-5 h-5 text-[#c97b56]" />,
  demandRefund: <Undo2 className="w-5 h-5 text-[#6b489f]" />,
  // pendingProceeding: <TrendingUp className="w-5 h-5 text-[#75649d]" />,
  // completeProceeding: <SearchCheck className="w-5 h-5 text-[#98643c]" />,
};

const TITLES = {
  tdsTcs: "TDS/TCS",
  sftInformation: "SFT Information",
  taxPayments: "Tax Payments",
  demandRefund: "Demand & Refund",
  // pendingProceeding: "Pending Proceeding",
  // completeProceeding: "Complete Proceeding",
};

/* -----------------------------------
   SHOW ZERO VALUES ON INITIAL LOAD
----------------------------------- */
const EMPTY_SUMMARY = {
  tdsTcs: { items: [], total: 0 },
  sftInformation: { items: [], total: 0 },
  taxPayments: { items: [], total: 0 },
  demandRefund: { items: [], total: 0 },
  // pendingProceeding: { items: [], total: 0 },
  // completeProceeding: { items: [], total: 0 },
};

/* --------------------------
   INR FORMAT
--------------------------- */
const inr = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* --------------------------
   GROUP AIS DATA
   (TDS/TCS now mimics mobile)
--------------------------- */
function groupAIS(details) {
  if (!details) return EMPTY_SUMMARY;

  // --------- 1. TDS / TCS (Salary) ----------
  const tdsSummary = details.partB1?.salary?.summary || null;
  const tdsDetails = details.partB1?.salary?.tdsDetails || [];

  const tdsProcessedTotal = tdsDetails.reduce(
    (sum, item) => sum + (item.tdsDeducted || 0),
    0
  );



  const tdsMergedItem = tdsSummary
    ? [
      {
        title: "TDS/TCS",
        tdsProcessedTotal,
        ...tdsSummary, // includes informationSource, infoCode, count, etc.
        transactions: tdsDetails, // quarter-wise rows
      },
    ]
    : [];

  // --------- 2. SFT INFORMATION ----------
  const sftItems = [
    ...(details.partB2?.dividend || []).map((x) => ({
      title: "Dividend",
      ...x,
    })),
    ...(details.partB2?.interest || []).map((x) => ({
      title: "Interest",
      ...x,
    })),
  ];
  const sftTotal = sftItems.reduce((a, b) => a + (b.amount || 0), 0);

  // --------- 3. TAX PAYMENTS ----------
  // --------- 3. TAX PAYMENTS ----------

  // Handle BOTH structures:
  // 1️⃣ partB3 = []
  // 2️⃣ partB3 = { taxPayments: [] }

  let taxPayments = [];

  if (Array.isArray(details.partB3)) {
    taxPayments = details.partB3;
  } else if (details.partB3?.taxPayments) {
    taxPayments = details.partB3.taxPayments;
  }

  const taxTotal = taxPayments.reduce(
    (sum, item) => sum + (item.total || item.amount || 0),
    0
  );



  // --------- 4. DEMAND / REFUND ----------

  const refundsRaw = details.partB4?.refunds || [];

  // Add title: "Refund - <mode>"
  const refunds = refundsRaw.map((item) => ({
    title: `Refund`, // 👈 Add title here
    ...item,
  }));
  const refundTotal = refunds.reduce((a, b) => a + (b.refundAmount || 0), 0);

  return {
    tdsTcs: {
      items: tdsMergedItem, // 1 card, with transactions
      total: tdsProcessedTotal, // for summary card
    },
    sftInformation: {
      items: sftItems,
      total: sftTotal,
    },
    taxPayments: {
      items: taxPayments,
      total: taxTotal ?? null,
    },
    demandRefund: {
      items: refunds,
      total: refundTotal,
    },
  };
}

/* -------------------------------------
   PRETTY LABEL (from RN code idea)
--------------------------------------*/
const prettyLabel = (key = "") => {
  if (!key) return "";

  // Insert space before capital letters → "amountPaid" → "amount Paid"
  let spaced = key.replace(/([A-Z])/g, " $1");

  // Uppercase first letter of each word
  spaced = spaced.replace(/\b\w/g, (c) => c.toUpperCase());

  // Special short-form fixes
  spaced = spaced
    .replace(/\bTds\b/gi, "TDS")
    .replace(/\bTan\b/gi, "TAN")
    .replace(/\bPan\b/gi, "PAN")
    .replace(/\bSb\b/gi, "SB")
    .replace(/\bSr No\b/gi, "SR No");

  return spaced.trim();
};

/* --------------------------
   DYNAMIC TRANSACTION TABLE
   (web version of RN code)
--------------------------- */
const TransactionTable = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  const columns = Object.keys(rows[0] || {});

  return (
    <div className="mt-3 border border-slate-200 rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        {/* 👇 FULL-WIDTH TABLE SO EMPTY SPACE GETS FILLED */}
        <table className="text-xs border-collapse min-w-full">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {columns.map((col) => {
                const minWidth = Math.max(120, col.length * 10); // wider + cleaner
                return (
                  <th
                    key={col}
                    className="px-3 py-2 border-r border-slate-200 last:border-r-0 text-[11px] font-semibold text-slate-600 text-center whitespace-nowrap"
                    style={{ minWidth, width: minWidth }}
                  >
                    {prettyLabel(col)}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50"
              >
                {columns.map((col) => {
                  const minWidth = Math.max(120, col.length * 10);
                  const value =
                    row[col] !== undefined && row[col] !== null
                      ? String(row[col])
                      : "-";

                  return (
                    <td
                      key={col}
                      className="px-3 py-1.5 border-r last:border-r-0 border-slate-100 text-[11px] text-slate-700 text-center whitespace-nowrap"
                      style={{ minWidth, width: minWidth }}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* --------------------------
   ENTRY CARD with accordion
   (web version of RN EntryCard)
--------------------------- */
const AisEntryCard = ({ item }) => {
  const [open, setOpen] = useState(false);

  const hasTransactions =
    Array.isArray(item?.transactions) && item.transactions.length > 0;

  const mainAmount =
    item?.tdsProcessedTotal ??
    item?.tdsDeducted ??
    item?.amount ??
    item?.refundAmount ??
    0;

  const sourceLabel =
    item?.informationSource?.name ||
    item?.informationSource ||
    item?.natureOfRefund ||
    "";

  const title = `${item?.title || ""}${sourceLabel ? ` - ${sourceLabel}` : ""}`;

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition mb-3 ais-entry-card">
      <button
        type="button"
        onClick={() => hasTransactions && setOpen((p) => !p)}
        className={`w-full text-left ${hasTransactions ? "cursor-pointer" : "cursor-default"
          }`}
      >
        <div className="text-sm font-semibold text-slate-800 line-clamp-2">
          {title || "Entry"}
        </div>

        <div className="mt-1 text-xs text-slate-700">
          Amount: <span className="font-semibold">₹ {inr(mainAmount)}</span>
          {hasTransactions && (
            <span className="text-slate-500">
              {" "}
              | Items: {item.transactions.length}
            </span>
          )}
        </div>
      </button>

      {/* Accordion details */}
      {open && hasTransactions && <TransactionTable rows={item.transactions} />}
    </div>
  );
};

/* --------------------------
   MAIN AIS COMPONENT
--------------------------- */
const AIS = () => {
  const dispatch = useDispatch();

  const { taxpayers } = useSelector((s) => s.taxpayer);
  const { detailLoading, processLoading, saveLoading } = useSelector((s) => s.ais);
  const { assessmentYears, loading: loadingAses } = useSelector((state) => state.alldropdown);
  const FY_LIST = assessmentYears?.filter((item) => item.status === 'active')?.map((item) => item.assessmentYear);

  const loading = detailLoading || processLoading || saveLoading;

  const fileRef = useRef(null);

  const [fy, setFY] = useState('2025-2026');
  const [selectedPAN, setSelectedPAN] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [dob, setDob] = useState('');
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [tab, setTab] = useState('tdsTcs');

  useEffect(() => {
    dispatch(getAllTaxPayers({ search: '', limit: 500, page: 1 }));
    dispatch(fetchAssessmentYearDropdown({ offset: 0, limit: 50 }));
  }, [dispatch]);
  const navigate = useNavigate();

  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pendingSyncPan, setPendingSyncPan] = useState('');
  const [pendingJob, setPendingJob] = useState(null);

  const isAutomationEnabled = () => localStorage.getItem('nx_enable_automation') === 'true';

  const getSelectedTaxpayer = (pan) => taxpayers?.find((t) => t.pan === pan);

  const runAutomationNow = async (pan, taxpayer, jobType, machineInfo) => {
    const payload = buildJobQueuePayload({
      pan,
      fy,
      taxpayer,
      jobType,
      machineInfo,
    });
    if (!payload?.input?.pan) return toast.error('PAN missing');
    if (!payload?.input?.taxPayerPWD) return toast.error('Password missing');
    if (!payload?.input?.authToken) return toast.error('Missing AuthToken');
    console.log('payload for .net', JSON.stringify(payload, null, 2));
    try {
      const res = await dispatch(runAutomationAis(payload)).unwrap();

      const commonId = res?.data?.commonId;

      if (!commonId) {
        toast.error('Job ID not received');
        return;
      }

      toast.success(`${jobType} job started`);

      // 🔥 START POLLING
      pollJobStatus(commonId, pan);
    } catch (err) {
      toast.error(err?.message || 'Job queue failed');
    }
  };
  const handleSyncClick = async () => {
    if (!selectedPAN) {
      toast.error('Select PAN first');
      return;
    }

    if (!isAutomationEnabled()) {
      toast.error('Please enable Automation by navigating in Settings tab', {
        autoClose: 5000,
      });
      navigate('/professional/configuration');
      return;
    }

    const t = getSelectedTaxpayer(selectedPAN);
    if (!t) {
      toast.error('Taxpayer not found');
      return;
    }

    const dob = t?.payload?.PersonalDetails?.dob;
    if (!dob) {
      toast.error('DOB not found for selected taxpayer');
      return;
    }

    // ✅ Ensure appsettings.json exists
    const cfg = await ensureAppSettings();
    if (!cfg.ok) return;

    // ✅ Ensure runner running first
    const rr = await ensureRunnerRunning();
    if (!rr.ok) {
      if (rr.status === 'NOT_DETECTED') {
        toast.error('Runner not detected. Please install/open NexoraX Runner.');
      } else {
        toast.error('Runner could not be started. Please open NexoraX Runner and try again.');
      }
      return;
    }

    // 🔥 Get machine info from runner
    let machineInfo = null;
    try {
      const mi = await runnerService.getMachineInfo();
      machineInfo = mi?.data || null;
    } catch {
      toast.error('Unable to get Runner machine info');
      return;
    }

    // ✅ Fetch FULL taxpayer from API (password may not be present in list)
    let full = null;
    try {
      full = await dispatch(getTaxPayerDetails(selectedPAN)).unwrap();
    } catch (err) {
      toast.error(err?.message || 'Failed to load taxpayer details');
      return;
    }

    const itlPassword = full?.payload?.PersonalDetails?.itlPassword;

    // ✅ If password missing → open modal + store context + STOP
    if (!itlPassword || !String(itlPassword).trim()) {
      setPendingSyncPan(selectedPAN);
      setPendingJob({
        pan: selectedPAN,
        taxpayer: full || t,
        jobType: 'AIS',
        machineInfo,
      });
      setPwdModalOpen(true);
      return;
    }

    // ✅ Start automation (use full so payload has latest data)
    await runAutomationNow(selectedPAN, t || full, 'AIS', machineInfo);
  };
  const handleSavePasswordAndSync = async (password) => {
    const clean = String(password || '').trim();
    if (!clean) {
      toast.error('Password is required');
      return;
    }

    const pan = pendingSyncPan || selectedPAN;
    if (!pan) {
      toast.error('Select PAN first');
      return;
    }

    try {
      setPwdSaving(true);

      // 1) GET full object
      const full = await dispatch(getTaxPayerDetails(pan)).unwrap();
      if (!full) {
        toast.error('Failed to load taxpayer details');
        return;
      }

      // 2) Update password at correct path: payload.PersonalDetails.itlPassword
      const updated = {
        PersonalDetails: {
          ...(full?.payload?.PersonalDetails || {}),
          itlPassword: clean,
        },
        ContactAddressDetails: {
          ...(full?.payload?.ContactAddressDetails || {}),
        },
        BankDetails: {
          ...(full?.payload?.BankDetails || {}),
        },
      };

      const updateRes = await dispatch(updateTaxpayer({ pan, data: updated })).unwrap();
      const after = await dispatch(getTaxPayerDetails(pan)).unwrap();

      // 5) Refresh list so your dropdown/check sees it
      await dispatch(getAllTaxPayers({ search: '', limit: 500, page: 1 })).unwrap?.();
      // unwrap may not exist in your thunk return; safe either way

      toast.success('Password saved. Starting sync…', { autoClose: 2500 });
      setPwdModalOpen(false);

      // ✅ Resume automation using stored context
      const ctx = pendingJob;

      setPendingJob(null);
      setPendingSyncPan('');

      if (!ctx?.pan || !ctx?.jobType || !ctx?.machineInfo) {
        toast.info('Password saved. Please click Sync again.');
        return;
      }

      // Patch taxpayer object locally so payload builder gets password immediately
      const patchedTaxpayer = {
        ...(ctx.taxpayer || {}),
        payload: {
          ...(ctx.taxpayer?.payload || {}),
          PersonalDetails: {
            ...(ctx.taxpayer?.payload?.PersonalDetails || {}),
            itlPassword: clean,
          },
        },
      };
      console.log(JSON.stringify(patchedTaxpayer, null, 2));
      await runAutomationNow(ctx.pan, patchedTaxpayer, ctx.jobType, ctx.machineInfo);
    } catch (err) {
      toast.error(err?.message || 'Failed to save password');
    } finally {
      setPwdSaving(false);
    }
  };

  const pollJobStatus = async (commonId, pan) => {
    const MAX_TRIES = 60; // ~5 minutes (5s interval)
    const INTERVAL = 5000;

    let tries = 0;

    while (tries < MAX_TRIES) {
      tries++;

      try {
        const res = await dispatch(getJobQueueAutomationByCommonId({ commonId })).unwrap();

        const job = res?.data;
        console.log('jobjobjobjob', JSON.stringify(job, null, 2));
        if (!job) {
          throw new Error('Invalid job response');
        }

        const status = job.status;

        console.log('Job status:', status);

        if (status === 'FAILED') {
          toast.error('AIS automation failed');
          return;
        }

        if (status === 'COMPLETED') {
          toast.success('AIS automation completed!');

          // 🔥 IMPORTANT STEP
          await fetchAndSaveAISFromRunner(pan);

          return;
        }

        // still running → wait
        await new Promise((r) => setTimeout(r, INTERVAL));
      } catch (err) {
        toast.error(err?.message || 'Job status check failed');
        return;
      }
    }

    toast.error('Job timeout. Please try again.');
  };

  const fetchAndSaveAISFromRunner = async (pan) => {
    if (!pan) return toast.error('PAN missing');

    try {
      // 🔹 Get taxpayer + DOB internally
      const taxpayer = getSelectedTaxpayer(pan);
      const dob = taxpayer?.payload?.PersonalDetails?.dob;

      if (!dob) {
        toast.error('DOB not found for selected taxpayer');
        return;
      }

      const fileName = `${pan}_${fy}_AIS.pdf`;

      // 🔑 Generate password
      const password = generateAisPassword(pan, dob);

      if (!password) {
        return toast.error('Could not generate AIS password');
      }

      // 🔥 Process PDF → JSON
      const aisData = await dispatch(processAISPdf({ name: fileName, password })).unwrap();

      if (!aisData) {
        toast.error('AIS JSON not found after processing PDF');
        return;
      }

      // ✅ Update UI
      setSummary(groupAIS(aisData));

      // ✅ Save to DB
      await dispatch(
        saveAIS({
          pan,
          finYear: fy,
          lastSyncDateTime: new Date().toISOString(),
          aisJSON: { data: aisData },
        }),
      ).unwrap();

      toast.success('AIS synced successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to process AIS PDF');
    }
  };

  /* --------------------------
     HANDLE PAN SELECTION
  --------------------------- */
  const handleSelectPAN = async (pan) => {
    setSelectedPAN(pan);

    const found = taxpayers.find((t) => t.pan === pan);
    const personal = found?.payload?.PersonalDetails;

    const fullName = [personal?.firstName, personal?.middleName, personal?.lastName]
      .map((x) => (x || '').trim())
      .filter(Boolean)
      .join(' ');

    // Save nicely formatted name for display
    setSelectedName(fullName || found?.fullName || found?.name || '');
    setDob(personal?.dob || '');

    // If PAN is cleared, THEN reset UI
    if (!pan) {
      setSummary(EMPTY_SUMMARY);
      return;
    }

    const docId = `${pan}${fy}`;

    try {
      const res = await dispatch(fetchAISByDocId(docId)).unwrap();

      if (res?.Data?.aisJSON?.data) {
        setSummary(groupAIS(res.Data.aisJSON.data));
      } else {
        toast.info('No AIS data found for this PAN & FY');
        setSummary(EMPTY_SUMMARY);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch AIS details');
      setSummary(EMPTY_SUMMARY);
    }
  };

  /* --------------------------
     PASSWORD GENERATION
  --------------------------- */
  const generateAisPassword = (pan, dobRaw = '') => {
    if (!pan || !dobRaw) return '';

    const panLower = pan.trim().toLowerCase();

    const date = new Date(dobRaw);
    if (isNaN(date)) return ''; // invalid DOB

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${panLower}${dd}${mm}${yyyy}`;
  };

  /* --------------------------
     FILE UPLOAD
  --------------------------- */
  const handleFileUpload = async () => {
    const file = fileRef.current?.files?.[0];

    if (!file) return toast.error('No file selected');
    if (!selectedPAN) return toast.error('Select PAN first');
    if (!dob) return toast.error('DOB missing for this taxpayer');

    const fileName = `${selectedPAN}_${fy}_AIS.pdf`;
    const uploadDate = new Date().toISOString();
    const password = generateAisPassword(selectedPAN, dob);

    if (!password) {
      return toast.error('Could not generate AIS password from DOB');
    }

    try {
      await dispatch(
        uploadForm26ASFile({
          name: fileName,
          uploadDate,
          file,
          fileType: 'ais',
        }),
      ).unwrap();

      const aisData = await dispatch(processAISPdf({ name: fileName, password })).unwrap();

      setSummary(groupAIS(aisData));

      await dispatch(
        saveAIS({
          pan: selectedPAN,
          finYear: fy,
          lastSyncDateTime: uploadDate,
          aisJSON: { data: aisData },
        }),
      ).unwrap();

      toast.success('AIS uploaded successfully!');
    } catch (err) {
      toast.error(err?.message || 'Error uploading AIS');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const items = useMemo(() => summary?.[tab]?.items || [], [summary, tab]);

  const handleAISDownload = async () => {
    try {
      if (!selectedPAN || !fy) return;

      // 🔹 AIS naming (adjust if backend differs)
      const name = `${selectedPAN.toUpperCase()}_${fy}_AIS.pdf`;

      const { blob } = await dispatch(downloadForm26ASFile({ name })).unwrap();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.message || 'AIS download failed');
    }
  };

  const handleAISShare = async () => {
    try {
      if (!selectedPAN || !fy) return;

      const name = `${selectedPAN.toUpperCase()}_${fy}_AIS.pdf`;

      const { blob } = await dispatch(downloadForm26ASFile({ name })).unwrap();

      const file = new File([blob], name, {
        type: blob.type || 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Share AIS PDF',
          text: `AIS for PAN ${selectedPAN}`,
          files: [file],
        });
      } else {
        // fallback → download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);

        toast.info('Sharing not supported. File downloaded instead.');
      }
    } catch (err) {
      toast.error(err?.message || 'AIS share failed');
    }
  };

  const taxPayerv = taxpayers?.map((c) => {
    const p = c?.payload?.PersonalDetails;
    const name = [p?.firstName, p?.middleName, p?.lastName,].filter(Boolean).join(" ");
    return { label: `${c?.pan}${name ? ` (${name})` : ""}`, value: c?.pan, };
  }) || [];

  return (
    <div className="p-4 w-full bg-gray-50">
      <div className="flex justify-between">
    
      {/* PAN SELECT + UPLOAD + DOWNLOAD + SYNC + SHARE */}
      <div className="flex items-center gap-3 mb-4">
        {/* PAN Select */}
          <SelectInput {...{ value: selectedPAN, onChange: (e: any) => handleSelectPAN(e.target.value), options: [{ label: "Select PAN", value: "" }, ...taxPayerv], }} />

        {detailLoading && <p className="text-sm text-gray-500">Syncing AIS data…</p>}
          <BlueButton {...{
            callBackFn: () => {
            if (!selectedPAN) {
              toast.error('Please select PAN first');
              return;
            }
            fileRef.current?.click();
            },
            text: "Upload AIS",
            icon: <Upload size={14} />
          }} />

        <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />

          <DataCreateButton {...{ callBackFn: handleAISDownload, text: "Download", icon: <Download size={14} />, disabled: !selectedPAN }} />
          <SuccessButton {...{ callBackFn: handleSyncClick, text: "Sync", icon: <FolderSync size={14} /> }} />
          <SecondaryButton {...{ callBackFn: handleAISShare, text: "Share", icon: <Share2 size={14} /> }} />
        </div>
        <div id="form26as-fy-buttons" className="flex gap-3 mb-4">
          {loading ? (
            <span className="text-sm text-gray-500">Loading...</span>
          ) : (
            FY_LIST.map((y) => {
              const isActive = fy === y;

              return (
                <button key={y} type="button"
                  onClick={() => {
                    setFY(y);
                    if (selectedPAN) handleSelectPAN(selectedPAN);
                  }}
                  className={`flex items-center cursor-pointer h-10 gap-2 px-4 py-2 rounded-md text-sm font-semibold border transition-all duration-200 ${isActive ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm" : "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50"}`}>
                  <span>{y}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
      {selectedName && <p className="text-sm text-blue-700 mb-4">Name: {selectedName}</p>}

      {/* SUMMARY CARDS */}
      <div
        id="ais-summary-cards"
        className="grid gap-4 my-4
             grid-cols-[repeat(auto-fit,minmax(260px,260px))]">
        {Object.keys(summary).map((key) => (
          <div key={key} className={`p-4 rounded-xl border shadow-sm ${COLORS[key]}`}>
            {/* Top row: icon + title */}
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-full bg-white/60 flex items-center justify-center">{ICONS[key]}</div>
              <span className="text-sm font-semibold text-slate-800">{TITLES[key] || key}</span>
            </div>

            {/* Second row: Amount label + value */}
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Amount</span>
              <span className="text-base font-bold">₹ {inr(summary[key]?.total)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TABS (HORIZONTAL SCROLL) */}
      <div id="ais-tabs" className="flex border-b mb-4 overflow-auto">
        {Object.keys(summary).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition
              ${tab === k ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
            {TITLES[k] || k}
          </button>
        ))}
      </div>

      {/* ITEMS LIST — like RN EntryCard with dynamic table */}
      {items.length === 0 ? (
        <p className="text-slate-400 text-center py-8 text-sm">No data available</p>
      ) : (
        <div id="ais-item-list" className="space-y-3">
          {items.map((it, i) => (
            <AisEntryCard key={it.id || i} item={it} />
          ))}
        </div>
      )}
      <PasswordModal
        open={pwdModalOpen}
        loading={pwdSaving}
        taxpayerName={selectedName}
        onClose={() => {
          if (pwdSaving) return;
          setPwdModalOpen(false);
          setPendingJob(null);
          setPendingSyncPan('');
        }}
        onSubmit={handleSavePasswordAndSync}
      />
    </div>
  );
}



export const PasswordModal = ({ open, onClose, onSubmit, taxpayerName, loading }) => {
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setPwd("");
      setShowPwd(false);
      setConsent(false);
      setTouched(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    return !!pwd.trim() && consent && !loading;
  }, [pwd, consent, loading]);

  const handleSubmit = () => {
    setTouched(true);
    if (!pwd.trim()) return;
    if (!consent) return;
    onSubmit?.(pwd);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" onClick={() => !loading && onClose?.()} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b">
            <div>
              <div className="font-semibold text-gray-900">Enter Taxpayer Password</div>
              <div className="text-xs text-gray-500 mt-0.5">{taxpayerName ? `For: ${taxpayerName}` : 'Password required to continue.'}</div>
            </div>

            <button className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50" onClick={() => onClose?.()} disabled={loading} type="button">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs text-gray-600">Password</label>

              <div className="relative mt-1">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />

                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Enter password"
                  className={[
                    'w-full border rounded-xl pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2',
                    touched && !pwd.trim() ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200',
                    loading ? 'bg-gray-50' : 'bg-white',
                  ].join(' ')}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}>
                  {showPwd ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>

              {touched && !pwd.trim() && <div className="mt-1 text-[11px] text-red-600">Password is required.</div>}

              <div className="mt-1 text-[11px] text-gray-500">This will be saved securely for automation sync.</div>
            </div>

            {/* Consent */}
            <div className={['rounded-xl border p-3', touched && !consent ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'].join(' ')}>
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={loading} className="mt-1 h-4 w-4 rounded border-gray-300" />
                <div>
                  <div className="text-[10px] text-gray-800 font-small">I give consent to save this password for automation sync</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">Required to proceed with automation sync.</div>

                  {touched && !consent && <div className="mt-1 text-[11px] text-red-600">Please provide consent to continue.</div>}
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
            <button type="button" className="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50" onClick={() => onClose?.()} disabled={loading}>
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={['px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2', canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600/60 cursor-not-allowed'].join(' ')}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AIS;
