import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { getAllTaxPayers, getTaxPayerDetails, updateTaxpayer } from "../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";
import {
  fetchForm26ASByDocId,
  processForm26ASZip,
  saveForm26AS,
  uploadForm26ASFile,
  downloadForm26ASFile,
} from "../../../redux/slices/professionalSlice/incomeTaxSlice/form26asSlice";

import {
  Receipt,
  FileCheck,
  Upload,
  FolderSync,
  Share2,
  Download,
  ReceiptIndianRupee
} from "lucide-react";
import { fetchAssessmentYearDropdown } from "../../../redux/slices/professionalSlice/allDropDowns/alldropdownSlice";
import { PasswordModal } from "./AIS";
import { useNavigate } from "react-router-dom";
import { getJobQueueAutomationByCommonId, runAutomationAis } from '../../../redux/slices/professionalSlice/automation/automatioinSlice';
import { buildJobQueuePayload, formatFYShort } from "./AISTISForm26PayloadBuilder";
import { runnerService } from '../../../services/runnerService';
import { ensureAppSettings, ensureRunnerRunning } from '../../../services/ensureRunnerRunning';
import { SelectInput } from "../../../components/inputs";
import { BlueButton, DataCreateButton, SecondaryButton, SuccessButton } from "../../../components/buttons";

/* ---------------------------------------------------------
   CONSTANTS
--------------------------------------------------------- */

// Just for UI labels (tabs row)
const PART_TABS = [
  { key: "PART-I", label: "Part-I" },
  { key: "PART-II", label: "Part-II" },
  { key: "PART-III", label: "Part-III" },
  { key: "PART-IV", label: "Part-IV" },
  { key: "PART-V", label: "Part-V" },
  { key: "PART-VI", label: "Part-VI" },
  { key: "PART-VII", label: "Part-VII" },
  { key: "PART-VIII", label: "Part-VIII" },
  { key: "PART-IX", label: "Part-IX" },
  { key: "PART-X", label: "Part-X" },
];

const INR = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ---------------------------------------------------------
   SUMMARY BOX COLORS
--------------------------------------------------------- */
const COLORS = {
  tds: "bg-[#ecf7f3] border-[#4c9d82]",
  tcs: "bg-[#edf4fe] border-[#3066b6]",
};

const ICONS = {
  tds: <ReceiptIndianRupee className="w-5 h-5 text-[#4c9d82]" />,
  tcs: <FileCheck className="w-5 h-5 text-[#3066b6]" />,
};

/* ---------------------------------------------------------
   PRETTY COLUMN LABEL
--------------------------------------------------------- */
const prettyLabel = (key = "") => {
  if (!key) return "";

  let spaced = key.replace(/([A-Z])/g, " $1");
  spaced = spaced.replace(/\b\w/g, (c) => c.toUpperCase());

  spaced = spaced
    .replace(/\bTds\b/gi, "TDS")
    .replace(/\bTcs\b/gi, "TCS")
    .replace(/\bTan\b/gi, "TAN")
    .replace(/\bPan\b/gi, "PAN")
    .replace(/\bSr. No\./gi, "Sr. No.");

  return spaced.trim();
};

/* ---------------------------------------------------------
   DYNAMIC TABLE COMPONENT (like AIS)
--------------------------------------------------------- */
const DynamicTable = ({ rows, noHeader = false }) => {
  if (!rows?.length) return null;

  const columns = Object.keys(rows[0] || {});

  return (
    <div className="mt-3 border rounded-md overflow-hidden border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border-collapse">
          {/* SHOW HEADER ONLY IF noHeader = false */}
          {!noHeader && (
            <thead>
              <tr className="bg-slate-100">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 whitespace-nowrap border border-slate-200 text-[11px] font-semibold text-slate-700 text-center"
                  >
                    {prettyLabel(col)}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-1.5 whitespace-nowrap border border-slate-100 text-[11px] text-center"
                  >
                    {row[col] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
/* ---------------------------------------------------------
   EXTRACT PARTS (same logic as RN)
--------------------------------------------------------- */
const extractParts = (form26Data) => {
  if (!form26Data) return [];

  // 🟢 NEW FORMAT (your current API)
  if (form26Data.parts) {
    return Object.entries(form26Data.parts).map(([key, part]) => ({
      key,
      label: part.title,
      tables: part.tables || [],
      sectionTotals: part.section_totals || {},
    }));
  }

  // 🟡 OLD FORMAT (RN structure)
  if (form26Data.sections) {
    return form26Data.sections.map((section, index) => {
      const partMatch = section.title?.match(/PART-\w+/i);
      const partKey = partMatch
        ? partMatch[0].toUpperCase()
        : `PART-${index + 1}`;

      return {
        key: partKey,
        label: section.title,
        tables: section.tables || [],
        sectionTotals: section.section_totals || {},
      };
    });
  }

  return [];
};
/* ---------------------------------------------------------
   BUILD SUMMARY BOX NUMBERS (like RN)
--------------------------------------------------------- */
const buildSummaryFromData = (form26Data) => {
  if (!form26Data) return EMPTY_NUM_SUMMARY;

  // NEW FORMAT
  if (form26Data.parts) {
    const partI = form26Data.parts["PART-I"];
    const partVI = form26Data.parts["PART-VI"];

    return {
      tdsCredited:
        Number(partI?.section_totals?.["Total Amount Paid / Credited"] || 0),

      tdsDeducted:
        Number(partI?.section_totals?.["Total Tax Deducted"] || 0),

      tdsDeposited:
        Number(partI?.section_totals?.["Total TDS Deposited"] || 0),

      tcsCredited:
        Number(partVI?.section_totals?.["Total Amount Paid / Debited"] || 0),

      tcsDeducted:
        Number(partVI?.section_totals?.["Total Tax Deducted"] || 0),

      tcsDeposited:
        Number(partVI?.section_totals?.["Total TCS Deposited"] || 0),
    };
  }

  // OLD FORMAT
  const sections = form26Data.sections || [];

  const partI = sections.find((s) => s.title?.startsWith("PART-I"));
  const partVI = sections.find((s) => s.title?.startsWith("PART-VI"));

  return {
    tdsCredited:
      Number(partI?.section_totals?.["Total Amount Paid / Credited"] || 0),

    tdsDeducted:
      Number(partI?.section_totals?.["Total Tax Deducted"] || 0),

    tdsDeposited:
      Number(partI?.section_totals?.["Total TDS Deposited"] || 0),

    tcsCredited:
      Number(partVI?.section_totals?.["Total Amount Paid / Debited"] || 0),

    tcsDeducted:
      Number(partVI?.section_totals?.["Total Tax Deducted"] || 0),

    tcsDeposited:
      Number(partVI?.section_totals?.["Total TCS Deposited"] || 0),
  };
};

const EMPTY_NUM_SUMMARY = {
  tdsCredited: 0,
  tdsDeducted: 0,
  tdsDeposited: 0,
  tcsCredited: 0,
  tcsDeducted: 0,
  tcsDeposited: 0,
};

/* ---------------------------------------------------------
   CARD (like AIS EntryCard)
--------------------------------------------------------- */
const EntryCard = ({ title, header = [], rows = [] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition mb-3 border-slate-200 form26as-entry-card">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="text-sm font-semibold text-slate-800 line-clamp-2">
          {title || "Details"}
        </div>
      </button>

      {open && (
        <div className="mt-3 border rounded-md overflow-x-auto border-slate-200">
          <table className="min-w-full text-xs border-collapse">
            {header?.length > 0 && (
              <thead>
                <tr className="bg-slate-100">
                  {header.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 border border-slate-200 text-[11px] font-semibold text-slate-700 text-center"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}

            <tbody>
              {rows?.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
                >
                  {header.map((h) => (
                    <td
                      key={h}
                      className="px-3 py-1.5 border border-slate-100 text-[11px] text-center whitespace-nowrap"
                    >
                      {row[h] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
/* ---------------------------------------------------------
                  MAIN PAGE COMPONENT
--------------------------------------------------------- */

const Form26AS = () => {
  const dispatch = useDispatch();
  const { taxpayers } = useSelector((s) => s.taxpayer);
  const { assessmentYears, loading } = useSelector((state) => state.alldropdown);
  const FY_LIST = assessmentYears?.filter((item) => item.status === 'active')?.map((item) => item.assessmentYear);
  const [fy, setFY] = useState('2025-2026');
  const [selectedPAN, setSelectedPAN] = useState('');
  const [selectedName, setSelectedName] = useState('');

  const [dob, setDob] = useState('');

  // Summary numbers — same style as RN code
  const [summary, setSummary] = useState(EMPTY_NUM_SUMMARY);

  // Holds PART-I, PART-II, ... (from backend)
  const [parts, setParts] = useState([]); // [{ key, label, tables }]
  const [activePart, setActivePart] = useState('PART-I');

  const fileRef = useRef(null);

  useEffect(() => {
    dispatch(getAllTaxPayers({ search: '', page: 1, limit: 500 }));
    dispatch(fetchAssessmentYearDropdown({ offset: 0, limit: 50 }));
  }, [dispatch]);

  /* Handle PAN selection + fetch saved JSON */
  const handleSelectPAN = async (pan) => {
    setSelectedPAN(pan);

    const found = taxpayers.find((t) => t.pan === pan);
    const personal = found?.payload?.PersonalDetails;

    const fullName = [personal?.firstName, personal?.middleName, personal?.lastName]
      .map((x) => (x || '').trim())
      .filter(Boolean)
      .join(' ');
    setSelectedName(fullName || found?.fullName || found?.name || '');
    setDob(personal?.dob || '');

    if (!pan) {
      setSummary(EMPTY_NUM_SUMMARY);
      setParts([]);
      setActivePart('PART-I');
      return;
    }

    const docId = `${pan}${formatFYShort(fy)}`;

    try {
      const res = await dispatch(fetchForm26ASByDocId(docId)).unwrap();
      console.log("res", JSON.stringify(res?.Data?.form26ASJSON?.data, null, 2))
      // ✅ REAL data location
      const form26 = res?.Data?.form26ASJSON?.data;

      if (!form26) {
        toast.info('No Form 26AS data found for this PAN & FY');
        setSummary(EMPTY_NUM_SUMMARY);
        setParts([]);
        setActivePart('PART-I');
        return;
      }

      // ✅ Build parts from sections[]
      const partsArr = extractParts(form26);
      setParts(partsArr);

      // ✅ Active tab = PART-I if exists
      const firstKey = partsArr.find((p) => p.key === 'PART-I')?.key || partsArr[0]?.key || 'PART-I';

      setActivePart(firstKey);

      // ✅ Build summary cards
      setSummary(buildSummaryFromData(form26));
    } catch (err) {
      console.error('❌ Form26AS fetch error:', err);
      toast.error(err?.message || 'Failed to fetch Form 26AS details');

      setSummary(EMPTY_NUM_SUMMARY);
      setParts([]);
      setActivePart('PART-I');
    }
  };
  const handleDownload = async () => {
    try {
      if (!selectedPAN || !fy) return;

      const name = `${selectedPAN.toUpperCase()}_${formatFYShort(fy)}_FORM26.zip`;

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
      toast.error(err?.message || 'Download failed');
    }
  };

  const handleShare = async () => {
    try {
      if (!selectedPAN || !fy) return;

      const name = `${selectedPAN.toLowerCase()}_${fy}_FORM26.pdf`;

      const { blob } = await dispatch(downloadForm26ASFile({ name })).unwrap();

      const file = new File([blob], name, {
        type: blob.type || 'application/octet-stream',
      });

      // Native mobile browser share
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Share Form 26AS',
          text: `Form 26AS for PAN ${selectedPAN}`,
          files: [file],
        });
      } else {
        // Fallback → auto download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);

        toast.info('Sharing not supported. File downloaded instead.');
      }
    } catch (err) {
      toast.error(err?.message || 'Share failed');
    }
  };
  const generatePassword = (dobRaw) => {
    console.log('got dob to check build form 26 passwar dobRaw', dobRaw);
    if (!dobRaw) return '';
    const d = new Date(dobRaw);
    if (isNaN(d)) return '';
    const DD = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const YYYY = d.getFullYear();
    return `${DD}${MM}${YYYY}`;
  };

  /* Upload PDF / ZIP (web equivalent of RN openGallery) */
  const handleFileUpload = async (file, originalFileName) => {
    if (!file) return toast.error('Select file first');
    if (!selectedPAN) return toast.error('Please select PAN first');

    // TEMP: Hardcoded for this test file
    const password = generatePassword(dob);
    if (!password) return toast.error('Invalid DOB / password');

    const uploadDate = new Date().toISOString();

    try {
      // 1) Upload file
      await dispatch(
        uploadForm26ASFile({
          file,
          uploadDate,
          name: originalFileName,
          fileType: 'form26',
        }),
      ).unwrap();

      // 2) Process ZIP/PDF → JSON
      const jsonData = await dispatch(
        processForm26ASZip({
          name: originalFileName,
          password,
        }),
      ).unwrap();

      const parsed = jsonData?.data || jsonData; // this is { statementTitle, assessee, parts, ... }

      // Build parts for UI
      const partsArr = extractParts(parsed);
      setParts(partsArr);

      const firstKey = partsArr.find((p) => p.key === 'PART-I')?.key || partsArr[0]?.key || 'PART-I';
      setActivePart(firstKey);

      // Summary numbers
      setSummary(buildSummaryFromData(parsed));

      // 3) Save to backend (same as RN)
      await dispatch(
        saveForm26AS({
          pan: selectedPAN,
          finYear: formatFYShort(fy),
          lastSyncDateTime: uploadDate,
          form26ASJSON: {
            data: parsed,
          },
        }),
      ).unwrap();

      toast.success('Form 26AS uploaded & processed!');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Upload failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Tables for current active part
  const currentPart = parts.find((p) => p.key === activePart) || null;
  const currentTables = currentPart?.tables || [];

  //**********Sync */
  const navigate = useNavigate();
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pendingSyncPan, setPendingSyncPan] = useState(''); // which pan requested sync

  const [pendingJob, setPendingJob] = useState(null);

  const isAutomationEnabled = () => localStorage.getItem('nx_enable_automation') === 'true';

  const getSelectedTaxpayer = (pan) => taxpayers?.find((t) => t.pan === pan);

  const runAutomationNow = async (pan, taxpayer, jobType, machineInfo) => {
    const payload = buildJobQueuePayload({
      pan,
      fy: formatFYShort(fy),
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
          toast.success('Form26 automation completed!');

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
      const formatedyear = formatFYShort(fy)
      const fileName = `${pan}_${formatedyear}_Form26AS_ZIP.zip`;
      console.log("file name of the form 26 fileName", fileName);
      const uploadDate = new Date().toISOString();

      // 🔑 Generate password
      const password = generatePassword(dob);
      console.log('Generated password', password);
      if (!password) {
        return toast.error('Could not generate Form26 password');
      }

      // 2) Process ZIP/PDF → JSON
      const jsonData = await dispatch(
        processForm26ASZip({
          name: fileName,
          password,
        }),
      ).unwrap();
      console.log('data getting when process api run ', JSON.stringify(jsonData, null, 2));
      const parsed = jsonData?.data || jsonData; // this is { statementTitle, assessee, parts, ... }

      // Build parts for UI
      const partsArr = extractParts(parsed);
      setParts(partsArr);

      const firstKey = partsArr.find((p) => p.key === 'PART-I')?.key || partsArr[0]?.key || 'PART-I';
      setActivePart(firstKey);

      // Summary numbers
      setSummary(buildSummaryFromData(parsed));

      // 3) Save to backend (same as RN)
      await dispatch(
        saveForm26AS({
          pan: selectedPAN,
          finYear: formatFYShort(fy),
          lastSyncDateTime: uploadDate,
          form26ASJSON: {
            data: parsed,
          },
        }),
      ).unwrap();

      toast.success('Form 26AS uploaded & processed!');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to process Form26 PDF');
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
        jobType: 'Form26AS',
        machineInfo,
      });
      setPwdModalOpen(true);
      return;
    }

    // ✅ Start automation (use full so payload has latest data)
    await runAutomationNow(selectedPAN, t || full, 'Form26AS', machineInfo);
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

	const taxPayerv = taxpayers?.map((c) => {
		const p = c?.payload?.PersonalDetails;
		const name = [p?.firstName, p?.middleName, p?.lastName,].filter(Boolean).join(" ");
		return { label: `${c?.pan}${name ? ` (${name})` : ""}`, value: c?.pan, };
	}) || [];

	const summaryCards = [
		{
			title: "TDS",
			icon: ICONS.tds,
			theme: {
				card: "from-emerald-50 via-teal-50 to-white border-emerald-200",
				iconBg: "bg-emerald-100 text-emerald-700",
				badge: "bg-emerald-600",
				glow: "bg-emerald-300",
			},
			rows: [
				{ label: "Credited", value: summary.tdsCredited },
				{ label: "Deposited", value: summary.tdsDeposited },
				{ label: "Deducted", value: summary.tdsDeducted },
			],
		},
		{
			title: "TCS",
			icon: ICONS.tcs,
			theme: {
				card: "from-blue-50 via-sky-50 to-white border-blue-200",
				iconBg: "bg-blue-100 text-blue-700",
				badge: "bg-blue-600",
				glow: "bg-blue-300",
			},
			rows: [
				{ label: "Credited", value: summary.tcsCredited },
				{ label: "Deposited", value: summary.tcsDeposited },
				{ label: "Collected", value: summary.tcsDeducted },
			],
		},
	];

	return (
		<div className="p-4 bg-gray-50 w-full ">
			{/* FY SELECT */}
			<div className="flex justify-between">
				{/* PAN + UPLOAD + DOWNLOAD + SYNC + SHARE */}
				<div className="flex items-center gap-3 mb-4 ">
					<SelectInput {...{ value: selectedPAN, onChange: (e: any) => handleSelectPAN(e.target.value), options: [{ label: "select PAN", value: "" }, ...taxPayerv], }} />
					{/* Upload */}
					<BlueButton {...{
						callBackFn: () => {
							if (!selectedPAN) {
								toast.error('Please select PAN first');
								return;
							}
							fileRef.current.click();
						},
						text: "Upload",
						icon: <Upload size={14} />
					}} />

					<input
						ref={fileRef}
						type="file"
						className="hidden"
						accept=".pdf,.zip"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (!file) return;
							handleFileUpload(file, file.name);
						}}
					/>
					<DataCreateButton {...{ callBackFn: handleDownload, text: "Donwload", icon: <Download size={14} />, disabled: !selectedPAN }} />
					<SuccessButton {...{ callBackFn: handleSyncClick, text: "Sync", icon: <FolderSync size={14} /> }} />
					<SecondaryButton {...{ callBackFn: handleShare, text: "Share", icon: <Share2 size={14} /> }} />
				</div>
				<div id="form26as-fy-buttons" className="flex gap-3 mb-4 flex-wrap">
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
      {/* SUMMARY BOXES (like RN) */}
			<div
				id="form26as-summary-cards"
				className="grid gap-5 my-5 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]"
			>
				{summaryCards.map((card, index) => (
					<motion.div
						key={card.title}
						initial={{ opacity: 0, y: 18, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{
							duration: 0.35,
							delay: index * 0.08,
							ease: "easeOut",
						}}
						whileHover={{
							y: -4,
							scale: 1.01,
						}}
						className={`
        relative overflow-hidden rounded-2xl border bg-gradient-to-br
        ${card.theme.card}
        p-5 shadow-sm transition-all duration-300
        hover:shadow-xl
      `}
					>
						{/* Soft glow */}
						<div
							className={`
          absolute -right-10 -top-10 h-28 w-28 rounded-full
          ${card.theme.glow} opacity-20 blur-2xl
        `}
						/>

						{/* Header */}
						<div className="relative z-10 mb-5 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div
									className={`
              flex h-12 w-12 items-center justify-center rounded-2xl
              ${card.theme.iconBg}
              shadow-sm ring-1 ring-white/70
            `}
								>
									{card.icon}
								</div>

								<div>
									<h3 className="text-lg font-bold text-gray-950">
										{card.title}
									</h3>
									<p className="text-xs font-medium text-gray-500">
										Form 26AS Summary
									</p>
								</div>
							</div>

							<span
								className={`
            h-2.5 w-2.5 rounded-full ${card.theme.badge}
            shadow-[0_0_0_4px_rgba(255,255,255,0.8)]
          `}
							/>
						</div>

						{/* Rows */}
						<div className="relative z-10 space-y-1">
							{card.rows.map((row) => (
								<div
									key={row.label}
									className="flex items-center justify-between px-3" >
									<span className="text-sm font-medium text-gray-600">
										{row.label}
									</span>

									<span className="text-base font-extrabold tracking-tight text-gray-950">
										₹ {INR(row.value)}
									</span>
								</div>
							))}
						</div>
					</motion.div>
				))}
			</div>

      {/* PART TABS (Part-I..X like you wanted) */}
      <div id="form26as-part-tabs" className="flex border-b mb-4 overflow-x-auto">
        {PART_TABS.map((t) => (
          <button key={t.key} onClick={() => setActivePart(t.key)} className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${activePart === t.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* LIST TABLES INSIDE ACTIVE PART (Deductor Summary, Transaction Details, etc.) */}
      {currentTables.length === 0 ? (
        <p className="text-center text-gray-400 py-6 text-sm">No data available for this Part</p>
      ) : (
        <div id="form26as-active-part-container" className="space-y-3">
          {currentTables.map((tbl, i) => (
            <EntryCard
              key={i}
              title={tbl.title}
              header={tbl.header} // ← ADD THIS
              rows={tbl.rows || []}
            />
          ))}
        </div>
      )}
      <PasswordModal open={pwdModalOpen} loading={pwdSaving} taxpayerName={selectedName} onClose={() => (!pwdSaving ? setPwdModalOpen(false) : null)} onSubmit={handleSavePasswordAndSync} />
    </div>
  );
};

export default Form26AS;
