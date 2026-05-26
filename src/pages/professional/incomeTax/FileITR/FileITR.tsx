import React, { useEffect, useMemo, useRef, useState } from 'react';
import Popup from './Popup';
import { Download, FileText, Calculator, Database, Layers, Shuffle } from 'lucide-react';
import IncomeFromSalary from './IncomeFromSalary';
import HouseProperty from './HouseProperty';
import IncomeOtherSource from './IncomeOtherSource';
import TotalDeductions from './TotalDeductions';
import ExemptedIncome from './ExemptedIncome';
import TaxesPaid from './TaxesPaid';
import Computations from './Computations';
import UnderSec44 from './UnderSec44';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';

import { getAllTaxPayers } from '../../../../redux/slices/professionalSlice/incomeTaxSlice/AddTaxpayerSlice';
import { fetchAssessmentYearDropdown, fetchNatureOfEmploymentDropdown, fetchRegimeDropdown } from '../../../../redux/slices/professionalSlice/allDropDowns/alldropdownSlice';

//your API thunks (keep in slice)
import { getItrFilingWebById, saveItrFilingWeb, updateItrFilingWeb } from '../../../../redux/slices/professionalSlice/fileITRweb/itrFilingWebMgtSlice';
import { formatIndianNumber } from '../../../../components/common/DateFormator';
import { createOrderRazorPay, verifyRazorPayPayment } from '../../../../redux/slices/professionalSlice/payment/paymentSlice';
import { buildITRJsonFromMyJson } from './IncomeTaxJsonBuilder/ITRJson';

import { getMonthValue } from './interestCalculations';
const INITIAL_META = {
  pan: null,
  assessmentYearId: null,
  assessmentYear: null,

  // you said you will add everything (address/bank/etc) here
  taxpayer: null,
  address: null,
  bank: null,

  regime: null,
  itrForm: null,
  natureOfEmployment: null,
};

const INITIAL_SECTIONS = {
  incomeFromSalary: null,
  houseProperty: null,
  underSec44: null,
  incomeOtherSources: null,
  totalDeductions: null,
  exemptedIncome: null,
  taxesPaid: null,
  computations: null,
  taxLiability: null,
};

const FileITR = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const passedTaxpayer = location.state?.taxpayer || null;
  const [fieldErrors, setFieldErrors] = useState({
    regime: false,
    itrForm: false,
    natureOfEmployment: false,
    assessmentYear: false,
  });

  // ---------------------------
  // Local Draft State
  // ---------------------------
  const [draftId, setDraftId] = useState(null);
  const [meta, setMeta] = useState(INITIAL_META);
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const { pan: editPan, ay: editAy } = useParams();
  const isEditMode = Boolean(editPan && editAy);

  // UI state
  const [step, setStep] = useState(1);
  const [selectedPan, setSelectedPan] = useState(null);
  const [selectedAY, setSelectedAY] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState(null);
  const [popupTitle, setPopupTitle] = useState('');

  const { taxpayers = [], loading } = useSelector((s) => s.taxpayer);
  const { regimes, natureOfEmployment, assessmentYears } = useSelector((s) => s.alldropdown);

  // ---------------------------
  // Load dropdowns + taxpayers
  // ---------------------------

  useEffect(() => {
    dispatch(getAllTaxPayers({ search: '', page: 1, limit: 500 }));
    dispatch(fetchRegimeDropdown({ offset: 0, limit: 100 }));
    dispatch(fetchNatureOfEmploymentDropdown({ offset: 0, limit: 100 }));
    dispatch(fetchAssessmentYearDropdown({ offset: 0, limit: 50 }));
  }, [dispatch]);

  // ---------------------------
  // If navigated from list with taxpayer
  // ---------------------------
  useEffect(() => {
    if (!passedTaxpayer) return;

    const p = passedTaxpayer.payload?.PersonalDetails || {};
    const name = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');

    const sp = { pan: passedTaxpayer.pan, name, raw: passedTaxpayer };
    setSelectedPan(sp);

    // NOTE: AY not passed in your state — user will pick AY then Continue
    setStep(1);
  }, [passedTaxpayer]);

  // ---------------------------
  // PAN options for dropdown
  // ---------------------------
  const panOptions = useMemo(() => {
    return taxpayers.map((t) => {
      const p = t.payload?.PersonalDetails || {};
      const name = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
      return { pan: t.pan, name: name || '—', raw: t };
    });
  }, [taxpayers]);

  useEffect(() => {
    if (!isEditMode) return;

    const run = async () => {
      try {
        isHydratingRef.current = true;

        // 1) fetch draft by PAN + AY
        const draft = await dispatch(getItrFilingWebById({ pan: editPan, assessmentYear: editAy })).unwrap();

        // 2) apply to local state (prefill)
        applyDraftFromApi(draft);

        // 3) set dropdown UI selections (optional but nice)
        // selectedAY
        const ayObj = assessmentYears?.find((x) => x.assessmentYear === editAy);
        if (ayObj) setSelectedAY(ayObj);

        // selectedPan (from taxpayer list)
        const t = taxpayers?.find((x) => x.pan === editPan);
        if (t) {
          const p = t.payload?.PersonalDetails || {};
          const name = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
          setSelectedPan({ pan: t.pan, name, raw: t });
        } else {
          // if taxpayer list not loaded, still show PAN from draft meta
          setSelectedPan({
            pan: editPan,
            name: draft?.meta?.taxpayer?.name || '—',
            raw: null,
          });
        }

        // 4) move to step 2 directly
        setStep(2);
      } catch (err) {
        toast.error(err?.message || 'Failed to load draft for edit');
      } finally {
        // allow autosave again
        setTimeout(() => {
          isHydratingRef.current = false;
        }, 0);
      }
    };

    run();
    // important: run again when dropdown data arrives (taxpayers/assessmentYears)
  }, [isEditMode, editPan, editAy, dispatch, taxpayers, assessmentYears]);

  // =========================================================
  // Build meta snapshot (your function) ✅
  // =========================================================
  const buildMetaSnapshotFromTaxpayer = (selectedPan, selectedAY) => {
    const raw = selectedPan?.raw?.payload || {};
    const p = raw?.PersonalDetails || {};
    const addr = raw?.ContactAddressDetails || {};
    const bank = raw?.BankDetails?.array?.[0] || {};
    const name = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
    const fullAddress = [addr?.address1, addr?.address2, addr?.address3, addr?.address4, addr?.city?.name?.en || addr?.city, addr?.state?.name?.en || addr?.state, addr?.pin].filter(Boolean).join(', ');

    return {
      pan: selectedPan?.pan ?? null,
      assessmentYearId: selectedAY?.assYid ?? null,
      assessmentYear: selectedAY?.assessmentYear ?? null,

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
    };
  };

  // =========================================================
  // Helpers: apply API draft -> local state
  // =========================================================
  const applyDraftFromApi = (draft) => {
    // your API returns: data: { id, panCard, assessmentYear, payload: {...} }
    const root = draft?.payload ? draft.payload : draft; // normalize

    const id = draft?.id || draft?._id || root?.id || root?._id || null;
    setDraftId(id);

    // ✅ set meta from correct place
    if (root?.meta) setMeta((prev) => ({ ...prev, ...root.meta }));

    // ✅ set sections from correct place
    if (root?.sections) setSections((prev) => ({ ...prev, ...root.sections }));

    // ✅ set pan/ay if needed (top-level fields)
    setMeta((prev) => ({
      ...prev,
      pan: root?.panCard || root?.meta?.pan || prev.pan,
      assessmentYear: root?.assessmentYear || root?.meta?.assessmentYear || prev.assessmentYear,
    }));
  };

  // =========================================================
  // Continue: Load existing OR Create new (save)
  // =========================================================
  const handleContinue = async () => {
    if (!selectedPan?.pan || !selectedAY?.assessmentYear) return;

    // 1) build meta snapshot from taxpayer + ay
    const metaSnap = buildMetaSnapshotFromTaxpayer(selectedPan, selectedAY);
    setMeta((prev) => ({ ...prev, ...metaSnap }));

    // 2) Try load existing draft by PAN+AY
    try {
      const existing = await dispatch(
        getItrFilingWebById({
          pan: selectedPan.pan,
          assessmentYear: selectedAY.assessmentYear,
        }),
      ).unwrap();

      // if found -> use it
      applyDraftFromApi(existing);
      toast.success('Draft loaded');
      setStep(2);
      return;
    } catch (err) {
      // If backend returns 404 for not found, this will come here — treat as "create new"
      // If you want to differentiate: check err?.message or err?.status
      console.log('Draft not found, creating new...', err);
    }

    // 3) Create new draft (POST /save)
    try {
      const payloadToSave = {
        panCard: metaSnap?.pan ?? meta?.pan ?? selectedPan?.pan ?? null,
        assessmentYear: metaSnap?.assessmentYear ?? meta?.assessmentYear ?? selectedAY?.assessmentYear ?? null,

        meta: { ...meta, ...metaSnap }, // ensure latest
        sections,
        status: 'DRAFT',
      };

      const saved = await dispatch(saveItrFilingWeb(payloadToSave)).unwrap();

      const id = saved?.insertedId || saved?._id || saved?.id || saved?.draftId;

      setDraftId(id || null);
      toast.success('Draft created');
      setStep(2);
    } catch (err) {
      toast.error(err?.message || 'Failed to create draft');
    }
  };

  // =========================================================
  // Auto-save (PUT) with debounce whenever meta/sections change
  // =========================================================
  const isHydratingRef = useRef(false);
  const saveTimerRef = useRef(null);

  const persistDraft = async () => {
    if (!draftId) return; // we can only PUT after POST creates id

    try {
      await dispatch(
        updateItrFilingWeb({
          id: draftId,
          payload: {
            meta,
            sections,
            status: 'DRAFT',
          },
        }),
      ).unwrap();

      // optional: toast on manual save only (not each autosave)
      // toast.success("Draft saved");
    } catch (err) {
      toast.error(err?.message || 'Auto-save failed');
    }
  };

  useEffect(() => {
    if (!draftId) return;
    if (isHydratingRef.current) return;

    // debounce
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistDraft();
    }, 700);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, meta, sections]);

  // =========================================================
  // Change taxpayer (reset everything)
  // =========================================================
  const handleChangeTaxpayer = () => {
    setStep(1);
    setSelectedPan(null);
    setSelectedAY(null);

    setDraftId(null);
    setMeta(INITIAL_META);
    setSections(INITIAL_SECTIONS);
  };

  // =========================================================
  // Popups: Save section -> local state
  // =========================================================
  const openPopup = (type, title) => {
    if (!validateTopFields()) return;
    setPopupType(type);
    setPopupTitle(title);
    setPopupOpen(true);
  };
  const saveSection = async (key, value, options = {}) => {
    const { successMsg = 'Data saved', errorMsg = 'Failed to save data', showToast = true } = options;

    if (!draftId) {
      toast.error('Draft ID not found. Please create draft first.');
      return;
    }

    const nextSections = { ...sections, [key]: value };
    setSections(nextSections);

    try {
      await dispatch(
        updateItrFilingWeb({
          id: draftId,
          payload: {
            panCard: meta?.pan,
            assessmentYear: meta?.assessmentYear,
            meta,
            sections: nextSections,
            status: 'DRAFT',
          },
        }),
      ).unwrap();

      if (showToast) toast.success(successMsg);
    } catch (err) {
      toast.error(err?.message || errorMsg);
    }
  };
  // ✅ Helper: convert regime dropdown code/value into "OLD" or "NEW"
  const getTaxRegime = (regimeValue) => {
    const v = String(regimeValue || '').toUpperCase();

    // adjust these if your dropdown codes differ
    if (v.includes('OLD')) return 'OLD';
    if (v.includes('NEW')) return 'NEW';

    // fallback
    return 'NEW';
  };
  const taxRegime = getTaxRegime(meta?.regime);
  const validateTopFields = () => {
    const nextErrors = {
      regime: !meta?.regime,
      itrForm: !meta?.itrForm,
      natureOfEmployment: !meta?.natureOfEmployment,
      assessmentYear: !meta?.assessmentYear || !meta?.assessmentYearId,
    };

    setFieldErrors(nextErrors);

    if (nextErrors.regime) toast.error('Please select Tax Regime');
    if (nextErrors.itrForm) toast.error('Please select ITR Form');
    if (nextErrors.natureOfEmployment) toast.error('Please select Nature of Employment');
    if (nextErrors.assessmentYear || nextErrors.assessmentYearId) toast.error('Please select Assessment Year');

    return !Object.values(nextErrors).some(Boolean);
  };

  const renderPopupContent = () => {
    switch (popupType) {
      case 'salary':
        return (
          <IncomeFromSalary
            value={sections?.incomeFromSalary}
            taxRegime={taxRegime} // ✅ ADD: pass OLD/NEW to match React Native behavior
            onClose={() => setPopupOpen(false)}
            onSave={async (payload) => {
              await saveSection('incomeFromSalary', payload, { successMsg: 'Income From Salary Saved' });
              setPopupOpen(false);
            }}
          />
        );

      case 'houseProperty':
        return (
          <HouseProperty
            value={sections?.houseProperty}
            taxpayerAddress={meta?.address}
            taxRegime={taxRegime}
            onClose={() => setPopupOpen(false)}
            onSave={async (payload) => {
              await saveSection('houseProperty', payload, { successMsg: 'Income From House Property Saved' });
              setPopupOpen(false);
            }}
          />
        );

      case 'undersec44':
        return (
          <UnderSec44
            value={sections?.underSec44}
            onClose={() => setPopupOpen(false)}
            onSave={async (payload) => {
              await saveSection('underSec44', payload, { successMsg: 'Under Section 44AD/AE/ADA Saved' });
              setPopupOpen(false);
            }}
          />
        );

      case 'otherSources':
        return (
          <IncomeOtherSource
            value={sections?.incomeOtherSources}
            assessmentYear={meta?.assessmentYear || selectedAY?.assessmentYear}
            onClose={() => setPopupOpen(false)}
            onSave={async (payload) => {
              await saveSection('incomeOtherSources', payload, { successMsg: 'Income From Other Sources Saved' });
              setPopupOpen(false);
            }}
          />
        );

      case 'totalDeductions':
        return (
          <TotalDeductions
            value={sections?.totalDeductions}
            onClose={() => setPopupOpen(false)}
            onSave={async (payload) => {
              await saveSection('totalDeductions', payload, { successMsg: 'Total Deductions Saved' });
              setPopupOpen(false);
            }}
          />
        );

      case 'exemptedincome':
        return (
          <ExemptedIncome
            value={sections?.exemptedIncome}
            onClose={() => setPopupOpen(false)}
            onSave={async (payload) => {
              await saveSection('exemptedIncome', payload, { successMsg: 'Exempted Income Saved' });
              setPopupOpen(false);
            }}
          />
        );

      case 'taxespaid':
        return (
          <TaxesPaid
            value={sections?.taxesPaid}
            salary={sections?.incomeFromSalary}
            onClose={() => setPopupOpen(false)}
            onSave={async (payload) => {
              await saveSection('taxesPaid', payload, { successMsg: 'Taxes Paid saved' });
              setPopupOpen(false);
            }}
          />
        );

      case 'computations':
        return (
          <Computations
            value={sections?.computations}
            completeDetail={sections}
            assessmentYear={meta?.assessmentYear}
            meta={meta}
            onClose={() => setPopupOpen(false)}
            onSave={async (payload) => {
              // ✅ DERIVE taxLiability automatically
              const derivedTaxLiability = {
                totalTaxLiability: payload?.totalTaxLiability ?? payload?.roundOffTotalTaxFeeInterest ?? '0',

                roundOffTotalTaxFeeInterest: payload?.roundOffTotalTaxFeeInterest ?? '0',

                regime: payload?.regime ?? taxRegime,
              };

              // ✅ SAVE BOTH IN ONE GO
              const mergedSections = {
                ...sections,
                computations: payload,
                taxLiability: derivedTaxLiability,
              };

              if (!draftId) {
                toast.error('Draft ID not found. Please create draft first.');
                return;
              }

              // 1️⃣ Update UI immediately
              setSections(mergedSections);

              // 2️⃣ Single PUT → single toast
              try {
                await dispatch(
                  updateItrFilingWeb({
                    id: draftId,
                    payload: {
                      panCard: meta?.pan,
                      assessmentYear: meta?.assessmentYear,
                      meta,
                      sections: mergedSections,
                      status: 'DRAFT',
                    },
                  }),
                ).unwrap();

                toast.success('Computation saved');
              } catch (err) {
                toast.error(err?.message || 'Failed to save computation');
              }

              setPopupOpen(false);
            }}
          />
        );

      default:
        return <p className="text-sm text-gray-500">🚧 Coming soon.</p>;
    }
  };

  // computed UI info
  const bank = meta?.bank;
  const fullAddress = meta?.address?.fullAddress;

  // =========================================================
  // STEP 1 UI
  // =========================================================
  if (step === 1) {
    return (
      <div className="h-[500px] overflow-hidden flex justify-center pt-0 sm:pt-24 lg:pt-28 px-4">
        <div className="bg-white/90 backdrop-blur w-full max-w-md rounded-2xl border border-gray-200 shadow-md p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-semibold text-blue-500 text-center">Select Taxpayer</h2>

          <p className="text-xs sm:text-sm text-gray-500 text-center mt-2">Search and select PAN to start building ITR draft</p>

          {loading ? (
            <div className="mt-6 text-center text-sm text-gray-500">Loading PAN list...</div>
          ) : (
            <div className="mt-6 space-y-3">
              <SearchablePanDropdown
                options={panOptions}
                value={selectedPan}
                onChange={(o) => {
                  setSelectedPan(o);
                  // reset AY + draft when PAN changes
                  setSelectedAY(null);
                  setDraftId(null);
                  setMeta(INITIAL_META);
                  setSections(INITIAL_SECTIONS);
                }}
              />

              <select
                className="w-full h-10 bg-gray-50 border border-gray-300 rounded-lg px-3 text-sm
                           focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedAY?.assYid || ''}
                onChange={(e) => {
                  const ay = assessmentYears.find((item) => item.assYid === e.target.value);
                  setSelectedAY(ay);
                }}>
                <option value="">Select Assessment Year</option>
                {assessmentYears.map((item) => (
                  <option key={item.id} value={item.assYid}>
                    {item.assessmentYear}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            disabled={!selectedPan || !selectedAY}
            onClick={handleContinue}
            className={`mt-6 w-full py-2.5 rounded-lg text-sm font-semibold transition ${selectedPan && selectedAY ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // STEP 2 UI
  // =========================================================
  const TableRow = ({ sr, desc, onClick, amount = 0 }) => (
    <tr onClick={onClick} className="cursor-pointer transition hover:bg-blue-50">
      <td className="px-3 py-2 text-center text-gray-600 border-r border-gray-200">{sr}</td>
      <td className="px-2.5 py-1.5 border-r border-gray-200 text-gray-700">{desc}</td>
      <td className="px-3 py-2 text-right">
        <input type="text" value={String(amount ?? 0)} readOnly className="w-40 text-right text-sm bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-gray-700 cursor-default" onClick={(e) => e.stopPropagation()} />
      </td>
    </tr>
  );

  const ActionBtn = ({ label, icon: Icon }) => (
    <button className="w-full flex items-center gap-2 text-left text-xs sm:text-sm px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-gray-700 hover:bg-blue-100 hover:border-blue-200 transition">
      {Icon && <Icon size={16} className="text-blue-600 shrink-0" />}
      <span>{label}</span>
    </button>
  );

  const COLORS = {
    salary: 'bg-[#dff2ec] border-[#3f8f76]',
    business: 'bg-[#e2ecfb] border-[#285aa8]',
    otherSource: 'bg-[#fde9cc] border-[#b86d4a]',
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  const verifyPay = sections?.verifyPay || {};
  const isVerified = !!verifyPay?.isVerify;
  const isPlatformFeePaid = !!verifyPay?.isPlatformFee;

  const handleVerify = async () => {
    try {
      if (!meta?.pan) {
        toast.error('PAN is missing');
        return;
      }
      const ayValue = meta?.assessmentYear || meta?.assessmentYearId;

      if (!ayValue) {
        setFieldErrors((prev) => ({
          ...prev,
          assessmentYear: true,
        }));
        toast.error('Please select Assessment Year');
        return;
      }

      const draft = await dispatch(getItrFilingWebById({ pan: meta?.pan, assessmentYear: meta?.assessmentYear || meta?.assessmentYearId })).unwrap();

      const root = draft?.payload || {};
      const draftMeta = root?.meta || meta || {};
      const draftSections = root?.sections || sections || {};

      // AY row for due date etc
      const ayRow = assessmentYears?.find((x) => x.assessmentYear === draftMeta?.assessmentYear || draftMeta?.assessmentYearId);
      const returnFileSec = getMonthValue(ayRow?.dueDate || ayRow?.lastFilingItrDate);
      // ✅ required field validation before verify
      const missing = {
        itrForm: !draftMeta?.itrForm,
        regime: !draftMeta?.regime,
        natureOfEmployment: !draftMeta?.natureOfEmployment,
        assessmentYear: !draftMeta?.assessmentYear || !draftMeta?.assessmentYearId,
      };

      if (missing.itrForm || missing.regime || missing.natureOfEmployment || missing.assessmentYear || missing?.assessmentYearId) {
        setFieldErrors((prev) => ({
          ...prev,
          itrForm: missing.itrForm,
          regime: missing.regime,
          natureOfEmployment: missing.natureOfEmployment,
          assessmentYear: missing.assessmentYear || missing?.assessmentYearId,
        }));

        if (missing.itrForm) toast.error('Please select ITR Form');
        if (missing.regime) toast.error('Please select Tax Regime');
        if (missing.natureOfEmployment) toast.error('Please select Nature of Employment');
        if (missing.assessmentYear || missing?.assessmentYearId) toast.error('Please select Assessment Year');

        return;
      }

      // Build ITR json from your already-calculated values (no recompute logic)
      const itrJson = buildITRJsonFromMyJson({
        meta: draftMeta,
        sections: draftSections,
        ayRow,
        SWNO: 'SW20011054',
        intermediaryCity: (draftMeta?.address?.city?.name?.en || 'NAGPUR').toUpperCase(),
        digest: '-',
        returnFileSec,
      });

      const prevVerifyPay = draftSections?.verifyPay || sections?.verifyPay || {};
      // console.log('IncomeTaxJson', JSON.stringify(itrJson, null, 2));
      await saveSection(
        'verifyPay',
        {
          ...prevVerifyPay,
          incomeTaxJson: itrJson,
          isVerify: true,
        },
        { successMsg: 'Verified successfully', errorMsg: 'Verify failed' },
      );
    } catch (e) {
      toast.error(e?.message || 'Verify failed');
    }
  };
  const handlePlatformFeePay = async () => {
    if (!isVerified) {
      toast.error('Please verify first');
      return;
    }
    if (isPlatformFeePaid) {
      toast.info('Already platform fee submitted');
      return;
    }

    const ok = await loadRazorpay();
    if (!ok) {
      toast.error('Razorpay SDK failed to load');
      return;
    }

    try {
      // 1) Create order from redux thunk
      const order = await dispatch(
        createOrderRazorPay({
          planPublicId: 'VARHZGX',
          pan: meta?.pan,
          mobile: meta?.taxpayer?.mobileNumber,
          email: meta?.taxpayer?.emailId,
          firstName: meta?.taxpayer?.personalDetails?.firstName,
          middleName: meta?.taxpayer?.personalDetails?.middleName,
          lastName: meta?.taxpayer?.personalDetails?.lastName,
        }),
      ).unwrap();

      // order expected: { key, orderId, amount, currency, planPublicId, ... }
      const options = {
        key: order?.key,
        order_id: order?.orderId,
        amount: order?.amount,
        currency: order?.currency || 'INR',
        name: 'Your App Name',
        description: 'Platform Fee Payment',
        prefill: {
          name: meta?.taxpayer?.name || '',
          email: meta?.taxpayer?.emailId || '',
          contact: meta?.taxpayer?.mobileNumber || '',
        },
        theme: { color: '#2563EB' },

        handler: async (payment) => {
          try {
            // 2) Verify payment
            const verifyRes = await dispatch(
              verifyRazorPayPayment({
                orderId: payment?.razorpay_order_id,
                paymentId: payment?.razorpay_payment_id,
                signature: payment?.razorpay_signature,
                planPublicId: order?.planPublicId || '1QOYFZI',
              }),
            ).unwrap();

            // 3) Mark platform fee paid in draft (single source of truth)
            await saveSection('verifyPay', { ...verifyPay, isVerify: true, isPlatformFee: true, lastPayment: verifyRes || payment }, { successMsg: 'Platform fee paid', errorMsg: 'Failed to save payment status' });
          } catch (e) {
            toast.error(e?.message || 'Payment verification failed');
          }
        },

        modal: {
          ondismiss: () => toast.info('Payment cancelled'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err?.message || 'Unable to create payment order');
    }
  };

  const canSubmit = isVerified && isPlatformFeePaid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    toast.success('Submit triggered (hook API here)');
    // later: call your submit endpoint and update status SUBMITTED
  };

  return (
    <div className="min-h-full">
      <div className="max-w-full mx-auto max-h-full bg-white/80 backdrop-blur-sm border xl:rounded-2xl shadow-md mt-0.5">
        {/* TOP */}
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Name/PAN/Addr */}
            <div className="relative rounded-lg border px-3.5 py-1.5 shadow-sm bg-[#f4f7fb] border-[#9db4d6]">
              <div className="space-y-1">
                <div className="flex gap-1 text-[13px]">
                  <span className="text-gray-600 min-w-[40px]">Name</span>
                  <span className="text-gray-400">:</span>
                  <span className="font-semibold text-gray-800 truncate">{meta?.taxpayer?.name || selectedPan?.name || '—'}</span>
                </div>

                <div className="flex gap-1 text-[13px]">
                  <span className="text-gray-600 min-w-[40px]">PAN</span>
                  <span className="text-gray-400">:</span>
                  <span className="font-semibold text-gray-800">{meta?.pan || selectedPan?.pan || '—'}</span>
                </div>

                <div className="flex gap-1 text-[13px]">
                  <span className="text-gray-600 min-w-[40px]">Addr</span>
                  <span className="text-gray-400">:</span>
                  <span className="text-gray-700 leading-snug line-clamp-2">{fullAddress || '—'}</span>
                </div>
              </div>

              <span onClick={handleChangeTaxpayer} className="absolute top-7 right-2 text-[10px] font-medium text-[#2f7f66] cursor-pointer hover:underline">
                Change
              </span>
            </div>

            {/* Bank */}
            <div className={`rounded-lg border px-3.5 py-2.5 shadow-sm ${COLORS.business}`}>
              <div className="space-y-1 text-[13px]">
                <div className="flex gap-1">
                  <span className="text-gray-600 min-w-[40px]">Bank</span>
                  <span className="text-gray-400">:</span>
                  <span className="font-medium text-gray-800 truncate">{bank?.bankName || '—'}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-600 min-w-[40px]">A/C</span>
                  <span className="text-gray-400">:</span>
                  <span className="font-medium text-gray-800 truncate">{bank?.accountNumber || '—'}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-gray-600 min-w-[40px]">IFSC</span>
                  <span className="text-gray-400">:</span>
                  <span className="font-medium text-gray-800 truncate">{bank?.ifscCode || '—'}</span>
                </div>
              </div>
            </div>

            {/* Regime + ITR form */}
            <div className={`rounded-lg border px-3.5 py-2.5 shadow-sm ${COLORS.salary}`}>
              <div className="space-y-1 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 min-w-[70px]">Tax Regime</span>
                  <span className="text-gray-400">:</span>
                  <select
                    className={`flex-1 h-7 bg-white/70 border rounded px-1 text-[13px] focus:outline-none
                    ${fieldErrors.regime ? 'border-red-500 ring-1 ring-red-400 animate-pulse' : 'border-gray-300'} `}
                    value={meta?.regime ?? ''}
                    onChange={(e) => {
                      setMeta((prev) => ({ ...prev, regime: e.target.value }));
                      setFieldErrors((p) => ({ ...p, regime: false }));
                    }}>
                    <option value="">Select</option>
                    {regimes.map((item) => (
                      <option key={item.id} value={item.code}>
                        {item.value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-600 min-w-[70px]">ITR Form</span>
                  <span className="text-gray-400">:</span>
                  <select
                    className={`flex-1 h-7 bg-white/70 border rounded px-1 text-[13px] focus:outline-none
                     ${fieldErrors.itrForm ? 'border-red-500 ring-1 ring-red-400 animate-pulse' : 'border-gray-300'}`}
                    value={meta?.itrForm ?? ''}
                    onChange={(e) => {
                      setMeta((prev) => ({ ...prev, itrForm: e.target.value }));
                      setFieldErrors((p) => ({ ...p, itrForm: false }));
                    }}>
                    <option value="">Select</option>
                    <option value="ITR-1">ITR-1 (SAHAJ)</option>
                    <option value="ITR-4">ITR-4 (SUGAM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nature + AY */}
            <div className={`rounded-lg border px-3.5 py-2.5 shadow-sm ${COLORS.otherSource}`}>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 min-w-[70px] max-w-[70px]">Nature Of Employment</span>
                  <span className="text-gray-400">:</span>
                  <select
                    className={`flex-1 min-w-0 h-7 bg-white/70 border rounded px-1 text-[13px] truncate
                   ${fieldErrors.natureOfEmployment ? 'border-red-500 ring-1 ring-red-400 animate-pulse' : 'border-gray-300'} `}
                    value={meta?.natureOfEmployment ?? ''}
                    onChange={(e) => {
                      setMeta((prev) => ({ ...prev, natureOfEmployment: e.target.value }));
                      setFieldErrors((p) => ({ ...p, natureOfEmployment: false }));
                    }}>
                    <option value="">Select</option>
                    {natureOfEmployment.map((item) => (
                      <option key={item.id} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-600 min-w-[70px]">A.Y.</span>
                  <span className="text-gray-400">:</span>
                  <select
                    className={`flex-1 h-7 bg-white/70 border rounded px-1 text-[13px]
      ${fieldErrors.assessmentYear ? 'border-red-500 ring-1 ring-red-400 animate-pulse' : 'border-gray-300'}
    `}
                    value={meta?.assessmentYearId ?? ''}
                    onChange={(e) => {
                      const ay = assessmentYears.find((item) => item.assYid === e.target.value);
                      setSelectedAY(ay);

                      // update meta snapshot again (keeps address/bank, updates AY)
                      const snap = buildMetaSnapshotFromTaxpayer(selectedPan, ay);
                      setMeta((prev) => ({ ...prev, ...snap }));
                      setFieldErrors((p) => ({ ...p, assessmentYear: false }));
                    }}>
                    <option value="">Select</option>
                    {assessmentYears.map((item) => (
                      <option key={item.id} value={item.assYid}>
                        {item.assessmentYear}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-white rounded-xl border shadow-sm p-2 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 h-[430px] overflow-hidden">
              {/* TABLE */}
              <div className="h-full overflow-auto rounded-xl bg-white">
                <table className="w-full border-collapse text-sm border border-gray-200">
                  <thead className="sticky top-0 z-10 bg-blue-50">
                    <tr className="border-b border-blue-100">
                      <th className="text-center px-3 py-2 font-medium text-gray-700 w-16 border-r border-gray-200">Sr No</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-700 border-r border-gray-200">Description</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-700 w-48">{meta?.assessmentYear ? `A.Y. ${meta.assessmentYear}` : 'A.Y.'}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    <TableRow sr="1" desc="Income From Salary" amount={formatIndianNumber(sections?.incomeFromSalary?.netSalary) ?? 0} onClick={() => openPopup('salary', 'Income From Salary')} />
                    <TableRow
                      sr="2"
                      desc="Income From House Property"
                      amount={formatIndianNumber(sections?.houseProperty?.totalIncomeFromHouseProperty) ?? 0}
                      onClick={() => openPopup('houseProperty', 'Income From House Property')}
                    />
                    <TableRow
                      sr="3"
                      desc="U/S 44 AD / AE / ADA, LIC Agent"
                      amount={formatIndianNumber(sections?.underSec44?.finalPresumptiveIncome) ?? 0}
                      onClick={() => openPopup('undersec44', 'U/S 44 AD / AE / ADA, LIC Agent')}
                    />
                    <TableRow sr="4" desc="Income From Other Sources" amount={formatIndianNumber(sections?.incomeOtherSources?.netOtherIncome) ?? 0} onClick={() => openPopup('otherSources', 'Income From Other Sources')} />
                    <TableRow sr="5" desc="Total Deductions" amount={formatIndianNumber(sections?.totalDeductions?.totalDeduction) ?? 0} onClick={() => openPopup('totalDeductions', 'Total Deductions')} />
                    <TableRow
                      sr="6"
                      desc="Exempted Income"
                      amount={formatIndianNumber(Number(sections?.exemptedIncome?.totalExemptIncome || 0) + Number(sections?.exemptedIncome?.ltcg112a?.ltcg || 0)) ?? 0}
                      onClick={() => openPopup('exemptedincome', 'Exempted Income')}
                    />
                    <TableRow sr="7" desc="Taxes Paid" amount={formatIndianNumber(sections?.taxesPaid?.totalTaxesPaid) ?? 0} onClick={() => openPopup('taxespaid', 'Taxes Paid')} />
                    <TableRow
                      sr="8"
                      desc="Computation (Click To Preview Computations)"
                      amount={formatIndianNumber(sections?.computations?.totalTaxLiability ?? sections?.computations?.roundOffTotalTaxFeeInterest) ?? 0}
                      onClick={() => openPopup('computations', 'Computation')}
                    />
                  </tbody>
                </table>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col gap-2 overflow-y-auto h-full pr-1">
                <ActionBtn label="Import Form 26AS" icon={Download} />
                <ActionBtn label="Payable" icon={Calculator} />
                {/* <ActionBtn label="Computax" icon={Calculator} /> */}
                <ActionBtn label="Form 26AS" icon={FileText} />
                <ActionBtn label="AIS" icon={Database} />
                <ActionBtn label="TIS" icon={Layers} />
                <ActionBtn label="Form 16E" icon={FileText} />
                <ActionBtn label="Club / Compare" icon={Shuffle} />

                <div className="mt-auto pt-3 border-t border-gray-200 flex flex-col gap-2">
                  {/* VERIFY */}
                  <button
                    onClick={handleVerify}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition
      ${isVerified ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {isVerified ? 'Verified ✓' : 'Verify'}
                  </button>

                  {/* PAY (RAZORPAY) */}
                  <button
                    onClick={handlePlatformFeePay}
                    disabled={!isVerified || isPlatformFeePaid}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition
      ${!isVerified || isPlatformFeePaid ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {isPlatformFeePaid ? 'Platform Fee Paid ✓' : 'Pay Platform Fee ₹1'}
                  </button>

                  {/* SUBMIT */}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition
      ${canSubmit ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (Submit removed for now) */}
        <div className="bottom-0 bg-white border-t px-3 sm:px-5 lg:px-6 py-2 flex justify-end rounded-b-2xl">
          <div className="text-xs text-gray-500">
            Draft ID: <span className="font-medium">{draftId || '—'}</span> (auto-saving)
          </div>
        </div>
      </div>

      <Popup open={popupOpen} title={popupTitle} onClose={() => setPopupOpen(false)}>
        {renderPopupContent()}
      </Popup>
    </div>
  );
}

/* ================= Searchable PAN Dropdown ================= */
const SearchablePanDropdown = ({ options, value, onChange }) => {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const q = query?.toLowerCase() || '';

  const filtered = options.filter((o) => (o?.pan?.toLowerCase() || '').includes(q) || (o?.name?.toLowerCase() || '').includes(q));
  return (
    <div className="relative z-50">
      <input
        type="text"
        value={value ? `${value.pan} - ${value.name}` : query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(null);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search PAN or Name"
        className="w-full border border-gray-300 rounded-lg
              px-3 py-2 text-sm
              bg-gray-50
              focus:bg-white
              focus:outline-none
              focus:ring-2 focus:ring-blue-500"
      />

      {open && (
        <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.map((o) => (
            <div
              key={o.pan}
              onClick={() => {
                onChange(o);
                setOpen(false);
                setQuery('');
              }}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition">
              <p className="text-sm font-medium text-gray-800">{o.pan}</p>
              <p className="text-xs text-gray-500">{o.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default FileITR;
