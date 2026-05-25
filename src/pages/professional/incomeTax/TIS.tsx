import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { getItrFilingWebById, saveItrFilingWeb, updateItrFilingWeb } from '../../../redux/slices/professionalSlice/fileITRweb/itrFilingWebMgtSlice';

import { getAllTaxPayers, getTaxPayerDetails, updateTaxpayer } from "../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice";
import {
  fetchTISByDocId,
  saveTIS,
  processTISPdf,
} from "../../../redux/slices/professionalSlice/incomeTaxSlice/tisSlice";

import {
  downloadForm26ASFile,
  uploadForm26ASFile,
} from "../../../redux/slices/professionalSlice/incomeTaxSlice/form26asSlice";

import {
  Wallet,
  Receipt,
  FileSearch,
  Landmark,
  TrendingUp,
  Banknote,
  Upload,
  FolderSync,
  Download,
  Share2,
  ReceiptIndianRupee
} from "lucide-react";
import { fetchAssessmentYearDropdown } from "../../../redux/slices/professionalSlice/allDropDowns/alldropdownSlice";
import { getJobQueueAutomationByCommonId, runAutomationAis } from '../../../redux/slices/professionalSlice/automation/automatioinSlice';
import { useNavigate } from "react-router-dom";
import { PasswordModal } from "./AIS";
import { buildJobQueuePayload } from "./AISTISForm26PayloadBuilder";
import { runnerService } from '../../../services/runnerService';
import { ensureAppSettings, ensureRunnerRunning } from '../../../services/ensureRunnerRunning';
import { buildSectionsFromTIS } from './FileITR/tisAutoMapper/tisAutoMapper';

/* -----------------------------------
   CARD COLORS (same style as AIS)
----------------------------------- */
const COLORS = {
  salary: "bg-[#ecf7f3] border-[#4c9d82]", // green soft
  business: "bg-[#edf4fe] border-[#3066b6]", // blue soft
  otherSource: "bg-[#fef3e1] border-[#c97b56]", // orange soft
  taxesPaid: "bg-[#f7f1fb] border-[#6b489f]", // purple soft
  capitalGain: "bg-[#ebe4fa] border-[#75649d]",
  sft: "bg-[#f4e8dd] border-[#98643c]",
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

/* -----------------------------------
   CARD TITLES
----------------------------------- */
const TITLES = {
  salary: "Salary",
  business: "Business Receipt",
  otherSource: "Other Source",
  taxesPaid: "Taxes Paid",
  capitalGain: "Capital Gain",
  sft: "SFT",
};

/* -----------------------------------
   EMPTY SUMMARY FOR TIS
----------------------------------- */
const EMPTY_SUMMARY = {
  salary: { processed: 0, accepted: 0, items: [] },
  business: { processed: 0, accepted: 0, items: [] },
  otherSource: { processed: 0, accepted: 0, items: [] },
  taxesPaid: { processed: 0, accepted: 0, items: [] },
  capitalGain: { processed: 0, accepted: 0, items: [] },
  sft: { processed: 0, accepted: 0, items: [] },
};

/* -----------------------------------
   INR FORMAT
----------------------------------- */
const inr = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function groupTIS(data) {
  if (!data) return EMPTY_SUMMARY;

  const summaryArr = data.summary || [];
  const details = data.details || {};

  const grouped = JSON.parse(JSON.stringify(EMPTY_SUMMARY));

  /* -------------------------------
   1️⃣ SALARY TAB (Fixed Layout)
      Title: "Salary – (Section 192)"
      Part row: "TDS/TCS"
  --------------------------------*/
  const salarySummary = summaryArr.find((s) => s.category === 'Salary');
  const salaryDetails = details['Salary'] || [];

  grouped.salary.processed = salarySummary?.processedBySystem || 0;
  grouped.salary.accepted = salarySummary?.acceptedByTaxpayer || 0;

  grouped.salary.items = [
    {
      title: 'Salary – (Section 192)',
      part: 'TDS/TCS',
      reported: salaryDetails[0]?.reportedBySource || 0,
      processed: salaryDetails[0]?.processedBySystem || 0,
      derived: salaryDetails[0]?.acceptedByTaxpayer || 0,
    },
  ];

  /* --------------------------------------
   2️⃣ OTHER SOURCE TAB (Detailed per-company rows)
--------------------------------------*/

  const otherCats = ['Dividend', 'Interest from savings bank', 'Interest from deposit', 'Purchase of securities and units of mutual funds'];

  otherCats.forEach((cat) => {
    const detList = details[cat] || [];

    detList.forEach((det) => {
      grouped.otherSource.processed += det.processedBySystem || 0;
      grouped.otherSource.accepted += det.acceptedByTaxpayer || 0;

      grouped.otherSource.items.push({
        title: `${cat} – ${det?.informationSource?.name || ''}`,
        part: det.part || 'SFT',
        reported: det.reportedBySource || 0,
        processed: det.processedBySystem || 0,
        derived: det.acceptedByTaxpayer || 0,
        transactions: [det], // one row per company
      });
    });
  });

  /* --------------------------------------
   3️⃣ BUSINESS RECEIPT TAB
   --------------------------------------*/
  /* --------------------------------------
     3️⃣ BUSINESS RECEIPT TAB (per-source rows)
  --------------------------------------*/
  const busSum = summaryArr.find((s) => s.category === 'Business receipts');
  const busDet = details['Business receipts'] || [];

  if (busSum || busDet.length > 0) {
    // totals: prefer summary if present, else sum from details
    const processedTotal = busSum?.processedBySystem ?? busDet.reduce((a, r) => a + (r.processedBySystem || 0), 0);

    const acceptedTotal = busSum?.acceptedByTaxpayer ?? busDet.reduce((a, r) => a + (r.acceptedByTaxpayer || 0), 0);

    grouped.business.processed = processedTotal || 0;
    grouped.business.accepted = acceptedTotal || 0;

    // one card row per business receipt entry
    grouped.business.items = busDet.map((det, idx) => {
      const nm = det?.informationSource?.name || '';
      return {
        id: `business-${det?.srNo ?? idx}`, // stable key
        title: `Business Receipt${nm ? ` - ${nm}` : ''}`,
        part: det?.part || '',
        reported: det?.reportedBySource || 0,
        processed: det?.processedBySystem || 0,
        derived: det?.acceptedByTaxpayer || 0,
        transactions: [det],
      };
    });
  }

  /* --------------------------------------
   4️⃣ CAPITAL GAIN TAB (if present)
   --------------------------------------*/
  const capSum = summaryArr.find((s) => s.category === 'Capital Gain');
  const capDet = details['Capital Gain'] || [];

  if (capSum || capDet.length > 0) {
    const reported = capDet[0]?.reportedBySource || 0;
    const processed = capDet[0]?.processedBySystem || 0;
    const derived = capDet[0]?.acceptedByTaxpayer || 0;

    grouped.capitalGain.processed = capSum?.processedBySystem || processed || 0;
    grouped.capitalGain.accepted = capSum?.acceptedByTaxpayer || derived || 0;

    grouped.capitalGain.items = [
      {
        title: 'Capital Gain',
        part: capDet[0]?.part || '',
        reported,
        processed,
        derived,
      },
    ];
  }

  /* --------------------------------------
   5️⃣ TAXES PAID TAB
       (currently no data from sample, keep empty or
        later map from some category like "Taxes Paid")
   --------------------------------------*/
  // grouped.taxesPaid = { ... }  // placeholder if backend adds this later

  /* --------------------------------------
   6️⃣ SFT TAB → Only rows with part === "SFT"
   --------------------------------------*/
  const sftRows = [];

  Object.keys(details).forEach((cat) => {
    (details[cat] || []).forEach((row) => {
      if (row.part === 'SFT') {
        const srcName = row?.informationSource?.name || '';
        sftRows.push({
          title: `${cat}${srcName ? ` - ${srcName}` : ''}`,
          part: 'SFT',
          reported: row.reportedBySource || 0,
          processed: row.processedBySystem || 0,
          derived: row.acceptedByTaxpayer || 0,
        });
      }
    });
  });

  grouped.sft.items = sftRows;
  grouped.sft.processed = sftRows.reduce((a, b) => a + (b.processed || 0), 0);
  grouped.sft.accepted = sftRows.reduce((a, b) => a + (b.derived || 0), 0);

  return grouped;
}

/* --------------------------
   ENTRY CARD (NO dynamic table)
   Fixed layout:
   Title
   Header: Part | Reported | Processed | Derived
   Row:    value
--------------------------- */
const TisEntryCard = ({ item }) => {
  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-sm mb-3 tis-entry-card">
      {/* Title */}
      <div className="text-sm font-semibold text-slate-800 mb-3">
        {item.title || "Entry"}
      </div>

      {/* Header row */}
      <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold text-slate-500 border-b border-slate-200 pb-1 mb-1">
        <div className="text-left">Part</div>
        <div className="text-right">Reported</div>
        <div className="text-right">Processed</div>
        <div className="text-right">Derived</div>
      </div>

      {/* Value row */}
      <div className="grid grid-cols-4 gap-2 text-xs text-slate-700">
        <div className="text-left truncate">{item.part || "-"}</div>
        <div className="text-right">₹ {inr(item.reported || 0)}</div>
        <div className="text-right">₹ {inr(item.processed || 0)}</div>
        <div className="text-right">₹ {inr(item.derived || 0)}</div>
      </div>
    </div>
  );
};


/* --------------------------
   MAIN TIS COMPONENT
--------------------------- */
const TIS = () => {
  const dispatch = useDispatch();

  const { taxpayers } = useSelector((s) => s.taxpayer);
  const { detailLoading, processLoading, saveLoading } = useSelector(
    (s) => s.tis
  );
  const { assessmentYears, loading: loadingAses } = useSelector(
    (state) => state.alldropdown
  );
  const FY_LIST = assessmentYears
    ?.filter((item) => item.status === "active")
    ?.map((item) => item.assessmentYear);

  const loading = detailLoading || processLoading || saveLoading;

  const fileRef = useRef(null);

  const [fy, setFY] = useState("2025-2026");
  const [selectedPAN, setSelectedPAN] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [dob, setDob] = useState("");
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [tab, setTab] = useState("salary");
 

  useEffect(() => {
    dispatch(getAllTaxPayers({ search: '', limit: 500, page: 1 }));
    dispatch(fetchAssessmentYearDropdown({ offset: 0, limit: 50 }));
  }, [dispatch]);

  /* --------------------------
     PASSWORD GENERATION (same logic as AIS)
  --------------------------- */
  const generateTisPassword = (pan, dobRaw = '') => {
    if (!pan || !dobRaw) return '';

    const panLower = pan.trim().toLowerCase();
    const date = new Date(dobRaw);
    if (isNaN(date)) return '';

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    return `${panLower}${dd}${mm}${yyyy}`;
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

   setSelectedName(fullName || found?.fullName || found?.name || '');
   setDob(personal?.dob || '');

   if (!pan) {
     setSummary(EMPTY_SUMMARY);
     setCurrentTisData(null);
     return;
   }

   const docId = `${pan}${fy}`;

   try {
     const res = await dispatch(fetchTISByDocId(docId)).unwrap();

     const tisData = res?.Data?.tisJSON?.data || null;

     if (tisData) {
       setCurrentTisData(tisData);
       setSummary(groupTIS(tisData));
     } else {
       toast.info('No TIS data found for this PAN & FY');
       setCurrentTisData(null);
       setSummary(EMPTY_SUMMARY);
     }
   } catch (err) {
     toast.error(err?.message || 'Failed to fetch TIS details');
     setCurrentTisData(null);
     setSummary(EMPTY_SUMMARY);
   }
 };

 const handleApplyTisToItrTest = async () => {
   try {
     if (!selectedPAN) {
       toast.error('Select PAN first');
       return;
     }

     if (!fy) {
       toast.error('Assessment year missing');
       return;
     }

     if (!currentTisData) {
       toast.error('No TIS data loaded');
       return;
     }

     await upsertItrSectionsFromTIS({
       pan: selectedPAN,
       assessmentYear: fy,
       tisData: currentTisData,
     });
   } catch (err) {
     toast.error(err?.message || 'Failed to apply TIS to ITR');
   }
 };

 const upsertItrSectionsFromTIS = async ({ pan, assessmentYear, tisData }) => {
   if (!pan || !assessmentYear || !tisData) {
     throw new Error('PAN, assessmentYear or TIS data missing');
   }

   const taxpayerMeta = buildItrMetaFromTaxpayer({ pan, assessmentYear });

   try {
     const existing = await dispatch(
       getItrFilingWebById({
         pan,
         assessmentYear,
       }),
     ).unwrap();

     const root = existing?.payload ? existing.payload : existing;

     const itrId = existing?.id || existing?._id || root?.id || root?._id || null;

     if (!itrId) {
       throw new Error('Existing ITR found but ID missing');
     }

     const existingSections = root?.sections || {};
     const existingMeta = root?.meta || {};

     const nextSections = buildSectionsFromTIS({
       tisData,
       assessmentYear,
       existingSections,
       taxRegime: existingMeta?.regime || 'NEW',
     });

     await dispatch(
       updateItrFilingWeb({
         id: itrId,
         payload: {
           panCard: pan,
           assessmentYear,
           meta: {
             ...existingMeta,
             ...taxpayerMeta,
             regime: existingMeta?.regime ?? taxpayerMeta?.regime ?? null,
             itrForm: existingMeta?.itrForm ?? taxpayerMeta?.itrForm ?? null,
             natureOfEmployment: existingMeta?.natureOfEmployment ?? taxpayerMeta?.natureOfEmployment ?? null,
           },
           sections: nextSections,
           status: root?.status || 'DRAFT',
         },
       }),
     ).unwrap();

     toast.success('ITR updated from TIS');
   } catch (err) {
     const freshSections = buildSectionsFromTIS({
       tisData,
       assessmentYear,
       existingSections: {},
       taxRegime: 'NEW',
     });

     await dispatch(
       saveItrFilingWeb({
         panCard: pan,
         assessmentYear,
         meta: taxpayerMeta,
         sections: freshSections,
         status: 'DRAFT',
       }),
     ).unwrap();

     toast.success('ITR created from TIS');
   }
 };

 //build address for taxpayer
 const buildItrMetaFromTaxpayer = ({ pan, assessmentYear }) => {
   const taxpayer = taxpayers.find((t) => t.pan === pan);
   const raw = taxpayer?.payload || {};

   const p = raw?.PersonalDetails || {};
   const addr = raw?.ContactAddressDetails || {};
   const bank = raw?.BankDetails?.array?.[0] || {};

   const name = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');

   const fullAddress = [addr?.address1, addr?.address2, addr?.address3, addr?.address4, addr?.city?.name?.en || addr?.city, addr?.state?.name?.en || addr?.state, addr?.pin].filter(Boolean).join(', ');

   return {
     pan: pan ?? null,
     assessmentYearId: null,
     assessmentYear: assessmentYear ?? null,

     taxpayer: {
       name: name || null,
       mobileNumber: addr?.mobileNumber ?? null,
       emailId: addr?.emailId ?? null,
       dob: p?.dob ?? null,
       gender: p?.gender ?? null,
       residentialStatus: p?.residentialStatus ?? null,
       typeOfTaxPayer: p?.typeOfTaxPayer ?? null,
       personalDetails: p,
     },

     address: {
       address1: addr?.address1 ?? null,
       address2: addr?.address2 ?? null,
       address3: addr?.address3 ?? null,
       address4: addr?.address4 ?? null,
       city: addr?.city ?? null,
       state: addr?.state ?? null,
       pin: addr?.pin ?? null,
       fullAddress: fullAddress || null,
       raw: addr,
     },

     bank: {
       bankName: bank?.bankName ?? null,
       accountNumber: bank?.accountNumber ?? null,
       ifscCode: bank?.ifscCode ?? null,
       accountType: bank?.accountType ?? null,
       accountHolderType: bank?.accountHolderType ?? null,
       branchAddress: bank?.branchAddress ?? null,
       raw: bank,
     },

     regime: null,
     itrForm: null,
     natureOfEmployment: null,
   };
 };

  /* --------------------------
     FILE UPLOAD
  --------------------------- */
  const handleFileUpload = async () => {
    const file = fileRef.current?.files?.[0];

    if (!file) return toast.error('No file selected');
    if (!selectedPAN) return toast.error('Select PAN first');
    if (!dob) return toast.error('DOB missing for this taxpayer');

    const fileName = `${selectedPAN}_${fy}_TIS.pdf`;
    const uploadDate = new Date().toISOString();
    const password = generateTisPassword(selectedPAN, dob);

    if (!password) {
      return toast.error('Could not generate TIS password from DOB');
    }

    try {
      await dispatch(
        uploadForm26ASFile({
          name: fileName,
          uploadDate,
          file,
          fileType: 'tis',
        }),
      ).unwrap();

      const tisData = await dispatch(processTISPdf({ name: fileName, password })).unwrap();
console.log('tisData for when i upload ', JSON.stringify(tisData, null, 2));
      setSummary(groupTIS(tisData));

      await dispatch(
        saveTIS({
          pan: selectedPAN,
          finYear: fy,
          lastSyncDateTime: uploadDate,
          tisJSON: { data: tisData },
        }),
      ).unwrap();

      toast.success('TIS uploaded successfully!');
    } catch (err) {
      toast.error(err?.message || 'Error uploading TIS');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const items = useMemo(() => summary?.[tab]?.items || [], [summary, tab]);

  const handleTISDownload = async () => {
    try {
      if (!selectedPAN || !fy) return;

      const name = `${selectedPAN.toUpperCase()}_${fy}_TIS.pdf`;

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
      toast.error(err?.message || 'TIS download failed');
    }
  };

  const handleTISShare = async () => {
    try {
      if (!selectedPAN || !fy) return;

      const name = `${selectedPAN.toUpperCase()}_${fy}_TIS.pdf`;

      const { blob } = await dispatch(downloadForm26ASFile({ name })).unwrap();

      const file = new File([blob], name, {
        type: blob.type || 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Share TIS PDF',
          text: `TIS for PAN ${selectedPAN}`,
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
      toast.error(err?.message || 'TIS share failed');
    }
  };

  //**********Sync */
  const navigate = useNavigate();
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pendingSyncPan, setPendingSyncPan] = useState(''); // which pan requested sync
  const [pendingJob, setPendingJob] = useState(null);

  const [currentTisData, setCurrentTisData] = useState(null);

  const isAutomationEnabled = () => localStorage.getItem('nx_enable_automation') === 'true';

  const getSelectedTaxpayer = (pan) => taxpayers?.find((t) => t.pan === pan);

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

    // ✅ Now safe to call your API
    await runAutomationNow(selectedPAN, t || full, machineInfo);
  };;

  const runAutomationNow = async (pan, taxpayer, machineInfo) => {
    const jobType = 'TIS';

    const payload = buildJobQueuePayload({
      pan,
      fy,
      taxpayer,
      jobType,
      machineInfo,
    });

    console.log('payload for .net (TIS)', JSON.stringify(payload, null, 2));

    if (!payload?.input?.pan) return toast.error('PAN missing');
    if (!payload?.input?.taxPayerPWD) return toast.error('Password missing');
    if (!payload?.input?.authToken) return toast.error('Missing AuthToken');

    try {
      // ✅ If your backend uses same endpoint for AIS/TIS, keep runAutomationAis(payload)
      // Otherwise use a separate thunk: runAutomationTis(payload)
      const res = await dispatch(runAutomationAis(payload)).unwrap();

      const commonId = res?.data?.commonId;
      if (!commonId) {
        toast.error('Job ID not received');
        return;
      }

      toast.success('TIS job started');

      // 🔥 START POLLING
      pollJobStatusTIS(commonId, pan);
    } catch (err) {
      toast.error(err?.message || 'Job queue failed');
    }
  };

  const pollJobStatusTIS = async (commonId, pan) => {
    const MAX_TRIES = 60;
    const INTERVAL = 5000;

    let tries = 0;

    while (tries < MAX_TRIES) {
      tries++;

      try {
        const res = await dispatch(getJobQueueAutomationByCommonId({ commonId })).unwrap();

        const job = res?.data;
        if (!job) throw new Error('Invalid job response');

        const status = job.status;
        console.log('TIS Job status:', status);

        if (status === 'FAILED') {
          toast.error('TIS automation failed');
          return;
        }

        if (status === 'COMPLETED') {
          toast.success('TIS automation completed!');

          // 🔥 IMPORTANT STEP
          await fetchAndSaveTISFromRunner(pan);
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

  const fetchAndSaveTISFromRunner = async (pan) => {
    if (!pan) return toast.error('PAN missing');

    try {
      // 🔹 Get taxpayer + DOB internally
      const taxpayer = getSelectedTaxpayer(pan);
      const dob = taxpayer?.payload?.PersonalDetails?.dob;

      if (!dob) {
        toast.error('DOB not found for selected taxpayer');
        return;
      }

      const fileName = `${pan}_${fy}_TIS.pdf`;

      // 🔑 Generate password (same as AIS assumption)
      const password = generateTisPassword(pan, dob);
      if (!password) return toast.error('Could not generate TIS password');

      // 🔥 Process PDF → JSON
      const tisData = await dispatch(processTISPdf({ name: fileName, password })).unwrap();

      console.log('TIS data from PDF:', tisData);

      if (!tisData) {
        toast.error('TIS JSON not found after processing PDF');
        return;
      }
      setSummary(groupTIS(tisData));

      // 1️⃣ first save raw TIS
      await dispatch(
        saveTIS({
          pan,
          finYear: fy,
          lastSyncDateTime: new Date().toISOString(),
          tisJSON: { data: tisData },
        }),
      ).unwrap();

      try {
        await upsertItrSectionsFromTIS({
          pan,
          assessmentYear: fy,
          tisData,
        });
      } catch (itrErr) {
        toast.error(itrErr?.message || 'TIS saved, but failed to update ITR');
        return;
      }

      toast.success('TIS synced successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to process TIS PDF');
    }
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
      await runAutomationNow(ctx.pan, patchedTaxpayer, ctx.machineInfo);
    } catch (err) {
      toast.error(err?.message || 'Failed to save password');
    } finally {
      setPwdSaving(false);
    }
  };
      


  return (
    <div className="p-1 w-full bg-gray-50">
      {/* FY SELECT */}
      <div id="form26as-fy-buttons" className="flex gap-2 mb-4 flex-wrap">
        {loadingAses ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : (
          FY_LIST.map((y) => (
            <button
              key={y}
              onClick={() => {
                setFY(y);
                if (selectedPAN) handleSelectPAN(selectedPAN);
              }}
              className={`px-2 py-1 rounded-full text-sm font-semibold ${fy === y ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
              {y}
            </button>
          ))
        )}
      </div>

      {/* PAN SELECT + UPLOAD */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* PAN Select */}
        <select id="tis-pan-select" value={selectedPAN} onChange={(e) => handleSelectPAN(e.target.value)} className="border px-2 py-1 rounded-lg min-w-[260px]">
          <option value="">Select PAN</option>

          {taxpayers.map((t) => {
            const p = t.payload?.PersonalDetails;
            const name = [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(' ');

            return (
              <option key={t.pan} value={t.pan}>
                {t.pan} {name ? `(${name})` : ''}
              </option>
            );
          })}
        </select>

        {detailLoading && <p className="text-sm text-gray-500">Syncing TIS data…</p>}

        {/* Upload */}
        <button
          type="button"
          id="tis-upload-btn"
          onClick={() => {
            if (!selectedPAN) {
              toast.error('Please select PAN first');
              return;
            }
            fileRef.current?.click();
          }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
          <Upload size={14} />
          Upload TIS
        </button>

        <input ref={fileRef} type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />

        {/* Download */}
        <button type="button" onClick={handleTISDownload} disabled={!selectedPAN} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
          <Download size={14} />
          Download
        </button>

        {/* Sync */}
        <button
          type="button"
          id="tis-sync-btn"
          onClick={handleSyncClick}
          //  disabled={!selectedPAN}
          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-60">
          <FolderSync size={14} />
          Sync
        </button>

        {/* Share */}
        <button type="button" onClick={handleTISShare} disabled={!false} className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
          <Share2 size={14} />
          Share
        </button>

        <button type="button" onClick={handleApplyTisToItrTest} disabled={!selectedPAN || !currentTisData} className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 disabled:opacity-60">
          Apply TIS To ITR (Test)
        </button>
      </div>

      {selectedName && <p className="text-sm text-blue-700 mb-4">Name: {selectedName}</p>}

      {/* SUMMARY CARDS */}
      <div
        id="tis-summary-cards"
        className="grid gap-4 my-4
             grid-cols-[repeat(auto-fit,minmax(260px,260px))]">
        {Object.keys(summary).map((key) => (
          <div key={key} className={`p-4 rounded-xl border shadow-sm ${COLORS[key]}`}>
            {/* Top row: icon + title */}
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-full bg-white/60 flex items-center justify-center">{ICONS[key]}</div>
              <span className="text-sm font-semibold text-slate-800">{TITLES[key] || key}</span>
            </div>

            {/* Processed */}
            <div className="flex items-center justify-between text-sm text-slate-700 mb-1">
              <span>Processed</span>
              <span className="text-base font-bold">₹ {inr(summary[key]?.processed)}</span>
            </div>

            {/* Accepted */}
            <div className="flex items-center justify-between text-sm text-slate-700">
              <span>Accepted</span>
              <span className="text-base font-bold">₹ {inr(summary[key]?.accepted)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TABS (HORIZONTAL SCROLL) */}
      <div id="tis-tabs" className="flex border-b mb-4 overflow-auto">
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

      {/* ITEMS LIST */}
      {items.length === 0 ? (
        <p className="text-slate-400 text-center py-8 text-sm">No data available</p>
      ) : (
        <div id="tis-item-list" className="space-y-3">
          {items.map((it, i) => (
            <TisEntryCard key={it.id || i} item={it} />
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
};

export default TIS;
