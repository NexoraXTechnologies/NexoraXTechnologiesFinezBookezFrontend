import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { X, IndianRupee, FileText } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTaxSlabsByAssessmentYear, fetchAssessmentYearDropdown } from '../../../../redux/slices/professionalSlice/allDropDowns/alldropdownSlice';

import { toNum, toDateOnly, calculateInterestTableRN, normalizeDepositsRN, calculate234CTableRN } from './interestCalculations';
import { formatIndianNumber, formatIndianNumberSmart, indianInputToRaw } from '../../../../components/common/DateFormator';

/* =====================================================================================
  SMALL HELPERS (non-RN-interest)
===================================================================================== */
const calcAge = (dobStr, refDateStr) => {
  const dob = toDateOnly(dobStr);
  const ref = toDateOnly(refDateStr);
  if (!dob || !ref) return 0;
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--;
  return Math.max(0, age);
};

const roundToNearest10 = (x) => Math.round(toNum(x) / 10) * 10;

const sortSlabs = (arr = []) => [...arr].sort((a, b) => toNum(a.from) - toNum(b.from));
const calculateTaxFromSlabs = (income, slabs = []) => {
  const inc = Math.max(0, toNum(income));
  const slabsSorted = sortSlabs(slabs);
  let tax = 0;

  for (const slab of slabsSorted) {
    const from = toNum(slab.from);
    const to = slab.to == null ? Infinity : toNum(slab.to);
    const rate = toNum(slab.rate);

    if (inc <= from) continue;
    const taxableInSlab = Math.min(inc, to) - from;
    if (taxableInSlab > 0) tax += (taxableInSlab * rate) / 100;
  }
  return Math.ceil(tax);
};

const DEFAULT_SLABS = {
  OLD: [
    { from: 0, to: 250000, rate: 0 },
    { from: 250000, to: 500000, rate: 5 },
    { from: 500000, to: 1000000, rate: 20 },
    { from: 1000000, to: null, rate: 30 },
  ],
  NEW: [
    { from: 0, to: 300000, rate: 0 },
    { from: 300000, to: 600000, rate: 5 },
    { from: 600000, to: 900000, rate: 10 },
    { from: 900000, to: 1200000, rate: 15 },
    { from: 1200000, to: 1500000, rate: 20 },
    { from: 1500000, to: null, rate: 30 },
  ],
};

const getRegime = (sections, value) => {
  const r = value?.regime || sections?.meta?.regime || sections?.payload?.meta?.regime || sections?.step1?.taxRegime || sections?.taxRegime;

  if (!r) return 'NEW';
  const s = String(r).toLowerCase();
  if (s.includes('old')) return 'OLD';
  return 'NEW';
};

const rebate87A = ({ regime, salaryTotal, rawTax }) => {
  const salary = toNum(salaryTotal);
  const raw = toNum(rawTax);

  if (regime === 'NEW') {
    if (salary <= 500000) return Math.min(raw, 12500);
    if (salary <= 700000) return Math.min(raw, 25000);
  }
  return 0;
};

// Port your RN rebate87AB as-is
const rebate87AB_RNPort = ({ regime, taxableIncomePayable, rawTax }) => {
  if (regime !== 'NEW') return 0;
  const a = toNum(taxableIncomePayable) - 700000;
  if (a < 0) return 0;
  const raw = toNum(rawTax);
  const out = raw - a;
  return out > 0 ? out : 0;
};

/* =====================================================================================
  EXTRACTORS
===================================================================================== */
function extractNetSalary(sections) {
  return toNum(sections?.incomeFromSalary?.netSalary ?? sections?.step2?.netSalary);
}
function extractHousePropertyIncome(sections) {
  return toNum(sections?.houseProperty?.totalIncomeFromHouseProperty ?? sections?.step3?.incomeChargable);
}
function extractOtherIncome(sections) {
  return toNum(sections?.incomeOtherSources?.netOtherIncome ?? sections?.incomeOtherSources?.totalIncomeOtherSources ?? sections?.step4?.totalIncomeOtherSources);
}
function extractTotalDividend(sections) {
  return toNum(sections?.incomeOtherSources?.dividend?.totalDividend ?? sections?.step4?.totalDividend);
}
function extractTotalDeductions(sections) {
  return toNum(sections?.totalDeductions?.totalDeduction ?? sections?.step5?.TotalChapVIADeductions);
}

function calculateSlabIncome_RNStyle(sections, dividendOverride) {
  const salary = extractNetSalary(sections);
  const hp = extractHousePropertyIncome(sections);
  const other = extractOtherIncome(sections);

  const totalDividend = extractTotalDividend(sections);
  const divOverride = dividendOverride != null ? toNum(dividendOverride) : totalDividend;

  const deductions = extractTotalDeductions(sections);

  // RN: salary + hp + dividendOverride + other - totalDividend - deductions
  return salary + hp + divOverride + other - totalDividend - deductions;
}

function calculateTotalTaxableIncome_RNStyle(sections) {
  const salary = extractNetSalary(sections);
  const hp = extractHousePropertyIncome(sections);
  const other = extractOtherIncome(sections);
  const deductions = extractTotalDeductions(sections);
  return salary + hp + other - deductions;
}

function extractSalaryTotalFor87A_RNStyle(sections) {
  return extractNetSalary(sections) + extractHousePropertyIncome(sections) + extractOtherIncome(sections);
}

function extractTdsTcs(sections) {
  const list = sections?.taxesPaid?.tdsData || sections?.step7?.taxesPaid?.tdsData || [];
  if (!Array.isArray(list)) return 0;
  return list.reduce((sum, row) => sum + toNum(row.amount), 0);
}

function extractAdvanceTaxes(sections) {
  const listA = sections?.taxesPaid?.advanceTaxes;
  if (Array.isArray(listA)) return listA;

  const listB = sections?.step7?.taxesPaid?.['Advance Taxes'];
  if (Array.isArray(listB)) {
    return listB.map((x) => ({ depositDate: x.depositDate, taxPaid: x.taxPaid }));
  }
  return [];
}

function extractAssessmentYear(sections) {
  return (
    sections?.incomeOtherSources?.assessmentYear ||
    sections?.assessmentYear ||
    sections?.meta?.assessmentYear || // ✅ add this (only helps if meta is inside sections)
    sections?.step1?.assessmentYear ||
    ''
  );
}

/* =====================================================================================
  UI
===================================================================================== */
const BigRupeeInput = ({ label, value, disabled = true, onChange }) => (
  <div>
    <label className="text-xs text-gray-600 mb-1 block">{label}</label>
    <div className="relative">
      <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        inputMode="numeric"
        value={formatIndianNumber(value ?? '')}
        disabled={disabled}
        onChange={(e) => onChange?.(indianInputToRaw(e.target.value))}
        className={`border rounded-md pl-9 pr-3 py-3 w-full text-right text-sm ${disabled ? 'bg-gray-100' : ''}`}
      />
    </div>
  </div>
);
const InterestField = ({ label, value, onOpen }) => (
  <div className="flex items-end gap-2">
    <div className="flex-1">
      <BigRupeeInput label={label} value={value} />
    </div>
    <button type="button" onClick={onOpen} className="h-[46px] w-[46px] border rounded-md flex items-center justify-center hover:bg-gray-50" title="View details">
      <FileText size={18} className="text-gray-700" />
    </button>
  </div>
);

const CenterTableModal = ({ title, open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-3">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-auto">{children}</div>
        <div className="px-5 py-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const WebInterestTable = ({ headers = [], rows = [], totalRow }) => (
  <div className="mt-3 border rounded-md bg-white">
    <div className="overflow-x-auto">
      <table className="min-w-[950px] w-full text-sm border-collapse">
        <thead className="bg-gray-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-center font-semibold border">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-b">
              {r.map((cell, i) => (
                <td key={i} className="px-3 py-2 text-center border">
                  {formatIndianNumberSmart(cell)}
                </td>
              ))}
            </tr>
          ))}

          {totalRow != null && (
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={headers.length - 1} className="px-3 py-2 text-right border">
                TOTAL
              </td>
              <td className="px-3 py-2 text-center border">{formatIndianNumberSmart(totalRow)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

/* =====================================================================================
  MAIN COMPONENT
===================================================================================== */
export default function Computations({ value, onClose, onSave, completeDetail, assessmentYear: ayProp, meta }) {
  const dispatch = useDispatch();
  const taxSlabs = useSelector((s) => s?.alldropdown?.taxSlabs);
  const assessmentYearsRaw = useSelector((s) => s?.alldropdown?.assessmentYears);

  const sections = completeDetail || {};
  const assessmentYear = useMemo(() => ayProp || extractAssessmentYear(sections), [ayProp, sections]);

  const assessmentYearList = useMemo(() => {
    if (Array.isArray(assessmentYearsRaw)) return assessmentYearsRaw;
    if (assessmentYearsRaw && Array.isArray(assessmentYearsRaw.data)) return assessmentYearsRaw.data;
    if (assessmentYearsRaw?.data?.data && Array.isArray(assessmentYearsRaw.data.data)) return assessmentYearsRaw.data.data;
    return [];
  }, [assessmentYearsRaw]);

  useEffect(() => {
    if (assessmentYearList?.length) return;
    dispatch(fetchAssessmentYearDropdown({ search: '', offset: 0, limit: 50 }));
  }, [dispatch, assessmentYearList?.length]);

  const ayRow = useMemo(() => {
    return assessmentYearList.find((x) => x.assessmentYear === assessmentYear) || null;
  }, [assessmentYearList, assessmentYear]);

  useEffect(() => {
    if (!assessmentYear) return;
    const alreadyLoaded = taxSlabs?.assessmentYear === assessmentYear && (taxSlabs?.newSlabs?.length || taxSlabs?.oldSlabs?.length);
    if (alreadyLoaded) return;
    dispatch(fetchTaxSlabsByAssessmentYear({ assessmentYear }));
  }, [dispatch, assessmentYear, taxSlabs?.assessmentYear, taxSlabs?.newSlabs?.length, taxSlabs?.oldSlabs?.length]);

  const resolvedSlabs = useMemo(() => {
    const fromApiOk = taxSlabs?.assessmentYear === assessmentYear;
    const apiNew = fromApiOk && Array.isArray(taxSlabs?.newSlabs) ? taxSlabs.newSlabs : [];
    const apiOld = fromApiOk && Array.isArray(taxSlabs?.oldSlabs) ? taxSlabs.oldSlabs : [];
    return {
      NEW: apiNew.length ? apiNew : DEFAULT_SLABS.NEW,
      OLD: apiOld.length ? apiOld : DEFAULT_SLABS.OLD,
      usingApi: apiNew.length || apiOld.length,
    };
  }, [taxSlabs, assessmentYear]);

  const [form, setForm] = useState(() => ({
    totalIncomeTaxPayable: value?.totalIncomeTaxPayable ?? '0',
    taxPayable: value?.taxPayable ?? '0',
    rebate87A: value?.rebate87A ?? '0',
    rebate87AB: value?.rebate87AB ?? '0',
    taxAfterRebate: value?.taxAfterRebate ?? '0',
    cess: value?.cess ?? '0',
    totalTaxAndCess: value?.totalTaxAndCess ?? '0',

    relief89: value?.relief89 ?? '',
    balanceAfterRelief: value?.balanceAfterRelief ?? '0',

    tdsTcs: value?.tdsTcs ?? '0',

    fee234A: value?.fee234A ?? '0',
    fee234B: value?.fee234B ?? '0',
    fee234C: value?.fee234C ?? '0',
    fee234F: value?.fee234F ?? '0',

    totalInterestFeePayable: value?.totalInterestFeePayable ?? '0',
    totalTaxFeeInterest: value?.totalTaxFeeInterest ?? '0',
    roundOffTotalTaxFeeInterest: value?.roundOffTotalTaxFeeInterest ?? '0',

    regime: value?.regime ?? '',

    table234A: value?.table234A ?? [],
    table234B: value?.table234B ?? [],
    table234C: value?.table234C ?? [],
  }));

  useEffect(() => {
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      ...value,
      table234A: value?.table234A ?? prev.table234A ?? [],
      table234B: value?.table234B ?? prev.table234B ?? [],
      table234C: value?.table234C ?? prev.table234C ?? [],
    }));
  }, [value]);

  // Dividend quarters (kept as you had)
  const dividendQuarters = useMemo(() => {
    const div = sections?.incomeOtherSources?.dividend || {};
    const step = sections?.step4 || {};
    return {
      q1: toNum(div?.q1 ?? step?.q1_dividend),
      q2: toNum(div?.q2 ?? step?.q2_dividend),
      q3: toNum(div?.q3 ?? step?.q3_dividend),
      q4: toNum(div?.q4 ?? step?.q4_dividend),
      q5: toNum(div?.q5 ?? step?.q5_dividend),
      total: toNum(div?.totalDividend ?? step?.totalDividend),
    };
  }, [sections]);

  // -------- RN-style block sums for 234C (same as StepEight.calculateBlocks) --------
  const calculateBlocksRN = useCallback(
    (rangeOf234C) => {
      const adv = extractAdvanceTaxes(sections) || [];
      const d1 = toDateOnly(rangeOf234C?.first);
      const d2 = toDateOnly(rangeOf234C?.second);
      const d3 = toDateOnly(rangeOf234C?.third);
      const d4 = toDateOnly(rangeOf234C?.fourth);

      let b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0;

      adv.forEach((item) => {
        const paidDate = toDateOnly(item.depositDate);
        const amount = toNum(item.taxPaid);
        if (!paidDate) return;
        if (d1 && paidDate <= d1) b1 += amount;
        if (d2 && paidDate <= d2) b2 += amount;
        if (d3 && paidDate <= d3) b3 += amount;
        if (d4 && paidDate <= d4) b4 += amount;
      });

      return { b1, b2, b3, b4 };
    },
    [sections],
  );

  const recompute = useCallback(
    (reliefOverride) => {
      const regime = getRegime(sections, value);
      const slabs = regime === 'OLD' ? resolvedSlabs.OLD : resolvedSlabs.NEW;

      // RN total taxable income
      const totalIncomeTaxable = calculateTotalTaxableIncome_RNStyle(sections);

      // RN slab income base
      const slabIncome = calculateSlabIncome_RNStyle(sections);

      const rawTax = calculateTaxFromSlabs(slabIncome, slabs);
      const salaryTotalFor87A = extractSalaryTotalFor87A_RNStyle(sections);

      const r87A = rebate87A({ regime, salaryTotal: salaryTotalFor87A, rawTax });
      const r87AB = rebate87AB_RNPort({ regime, taxableIncomePayable: totalIncomeTaxable, rawTax });

      const taxAfterRebateVal = Math.max(rawTax - (r87A + r87AB), 0);
      const cessVal = taxAfterRebateVal > 0 ? Math.round(taxAfterRebateVal * 0.04) : 0;
      const totalTaxAndCessVal = taxAfterRebateVal + cessVal;

      const reliefStr = reliefOverride != null ? reliefOverride : form.relief89;
      const reliefVal = toNum(reliefStr);
      const balanceAfterReliefVal = Math.max(totalTaxAndCessVal - reliefVal, 0);

      const tdsTcsVal = extractTdsTcs(sections);
      const advanceTaxes = extractAdvanceTaxes(sections);

      // IMPORTANT: match RN totals behavior (RN uses all adv in its final payable math coming from elsewhere)
      // If you want to avoid future-dated challans: filter here.
      const today = toDateOnly(new Date());
      const totalAdvancePaidAll = (advanceTaxes || []).reduce((s, x) => {
        const d = toDateOnly(x.depositDate);
        if (!d || (today && d > today)) return s;
        return s + toNum(x.taxPaid);
      }, 0);

      // 234F (keep your rule)
      // months234A is not used by RN interest table, but used for 234F eligibility
      const dueDate = ayRow?.dueDate || ayRow?.lastFilingItrDate;
      const filingDate = toDateOnly(new Date());
      const due = toDateOnly(dueDate);
      const months234A =
        due && filingDate && filingDate > due
          ? (filingDate.getFullYear() - new Date(due.getFullYear(), due.getMonth(), due.getDate() + 1).getFullYear()) * 12 + (filingDate.getMonth() - new Date(due.getFullYear(), due.getMonth(), due.getDate() + 1).getMonth()) + 1
          : 0;

      const fee234FVal = months234A ? (toNum(totalIncomeTaxable) > 500000 ? 5000 : 1000) : 0;

      // age
      const dob = meta?.taxpayer?.dob || meta?.taxpayer?.personalDetails?.dob || sections?.personalInfo?.dob || sections?.payload?.meta?.taxpayer?.dob || sections?.dob || sections?.personal?.dob || '';
      const age = calcAge(dob, ayRow?.lastDate234B);

      // ---- 234C ---- (match RN StepEight + Interest234CTable)
      const q1 = dividendQuarters.q1;
      const q2 = dividendQuarters.q2;
      const q3 = dividendQuarters.q3;
      const q4 = dividendQuarters.q4;
      const q5 = dividendQuarters.q5;
      const totalDividend = dividendQuarters.total;

      const incomeNoDividendBase = extractNetSalary(sections) + extractHousePropertyIncome(sections) + extractOtherIncome(sections) - extractTotalDeductions(sections) - totalDividend;

      const netBalanceMinusTds = Math.round(toNum(balanceAfterReliefVal)) - Math.round(toNum(tdsTcsVal));

      const isCalculate = {
        first: q1 >= 500000 || (incomeNoDividendBase + q1 > 700000 && netBalanceMinusTds > 0),
        second: q1 + q2 >= 500000 || (incomeNoDividendBase + q1 + q2 > 700000 && netBalanceMinusTds > 0),
        third: q1 + q2 + q3 >= 500000 || (incomeNoDividendBase + q1 + q2 + q3 > 700000 && netBalanceMinusTds > 0),
        fourth: q2 + q3 + q4 + q5 >= 500000 || (incomeNoDividendBase + q1 + q2 + q3 + q4 + q5 > 700000 && netBalanceMinusTds > 0),
      };

      // In RN, Interest234CTable receives totalTax = (totalTaxAndCessX - tdsTcs)
      // and dataOfAdvanceTax = b1..b4 computed from blocks.
      const blocks = calculateBlocksRN(ayRow?.rangeOf234C);

      // totalTaxAndCess First..Fourth (dividend override) like RN StepEight
      const computeTotalTaxAndCessWithDividendOverride = (divOverride) => {
        const slabIncomeX = calculateSlabIncome_RNStyle(sections, divOverride);
        const rawTaxX = calculateTaxFromSlabs(slabIncomeX, slabs);

        const r87AX = rebate87A({ regime, salaryTotal: salaryTotalFor87A, rawTax: rawTaxX });
        const r87ABX = rebate87AB_RNPort({ regime, taxableIncomePayable: totalIncomeTaxable, rawTax: rawTaxX });

        const afterRebateX = Math.max(rawTaxX - (r87AX + r87ABX), 0);
        const cessX = afterRebateX > 0 ? Math.round(afterRebateX * 0.04) : 0;
        return afterRebateX + cessX;
      };

      const tnc1 = computeTotalTaxAndCessWithDividendOverride(q1);
      const tnc2 = computeTotalTaxAndCessWithDividendOverride(q1 + q2);
      const tnc3 = computeTotalTaxAndCessWithDividendOverride(q1 + q2 + q3);
      const tnc4 = computeTotalTaxAndCessWithDividendOverride(q1 + q2 + q3 + q4 + q5);

      const totalTaxFor234C = {
        first: Math.round(toNum(tnc1) - toNum(tdsTcsVal)),
        second: Math.round(toNum(tnc2) - toNum(tdsTcsVal)),
        third: Math.round(toNum(tnc3) - toNum(tdsTcsVal)),
        fourth: Math.round(toNum(tnc4) - toNum(tdsTcsVal)),
      };

      const cTable = calculate234CTableRN({
        calculateAccToAge: age,
        isCalculate,
        totalTax: totalTaxFor234C,
        dataOfAdvanceTax: blocks,
      });

      const fee234CVal = toNum(cTable.totalInterest);

      // ---- Opening balances (same as your RN-inspired logic) ----
      const lastDate234B = ayRow?.lastDate234B;
      const lastDate234BDate = toDateOnly(lastDate234B);

      const totalAdvancePaidTillLastDate234B = (advanceTaxes || []).reduce((sum, item) => {
        const d = toDateOnly(item.depositDate);
        if (!d || !lastDate234BDate) return sum;
        return d <= lastDate234BDate ? sum + toNum(item.taxPaid) : sum;
      }, 0);

      const netAfterTds = Math.floor(balanceAfterReliefVal) - Math.floor(tdsTcsVal);
      const openingBalance234AF = netAfterTds - totalAdvancePaidTillLastDate234B;

      const openingBalance234B = netAfterTds <= 10000 || netAfterTds * 0.9 <= totalAdvancePaidTillLastDate234B ? 0 : netAfterTds - totalAdvancePaidTillLastDate234B;

      // ---- RN-ported 234A/234B monthly table calculation ----
      const depositsForInterest = normalizeDepositsRN(advanceTaxes);

      const rowsRN = calculateInterestTableRN({
        calculateAccToAge: age,
        openingPrincipal234B: openingBalance234B,
        openingPrincipal234AF: openingBalance234AF,
        openingRemainingBalance: fee234CVal, // RN passes remainingBalance = fee234C
        deposits: depositsForInterest,
        today: new Date(),
      });

      const total234B = rowsRN.reduce((s, r) => s + toNum(r.int234B), 0);
      const total234AF = rowsRN.reduce((s, r) => s + toNum(r.int234AF), 0);

      // Build tables shaped like your UI expects
      const table234B = rowsRN.map((r) => ({
        month: r.month,
        principal: String(r.principal234B),
        interest: String(r.int234B),
        deposit: String(r.deposit),
        interestAdjusted: String(r.intAdjusted),
        interestRemaining: String(r.remainingBalance),
        principalAdjusted: String(r.principalAdjusted),
      }));

      const table234A = rowsRN.map((r) => ({
        month: r.month,
        principal: String(r.principal234AF),
        interest: String(r.int234AF),
        deposit: String(r.deposit),
        interestAdjusted: String(r.intAdjusted),
        interestRemaining: String(r.remainingBalance),
        principalAdjusted: String(r.principalAdjusted),
      }));

      const fee234AVal = Math.max(0, Math.round(total234AF));
      const fee234BVal = age > 60 ? 0 : Math.max(0, Math.round(total234B));

      const totalInterestFeePayableVal = fee234AVal + fee234BVal + fee234CVal + fee234FVal;

      const totalTaxFeeInterestVal = Math.round(totalInterestFeePayableVal) + Math.round(balanceAfterReliefVal) - Math.round(tdsTcsVal) - Math.round(totalAdvancePaidAll);

      const roundOffVal = roundToNearest10(totalTaxFeeInterestVal);

      setForm((prev) => ({
        ...prev,
        regime,

        totalIncomeTaxPayable: String(Math.round(Math.max(totalIncomeTaxable, 0))),
        taxPayable: String(Math.round(rawTax)),

        rebate87A: String(Math.round(r87A)),
        rebate87AB: String(Math.round(r87AB)),

        taxAfterRebate: String(Math.round(taxAfterRebateVal)),
        cess: String(Math.round(cessVal)),
        totalTaxAndCess: String(Math.round(totalTaxAndCessVal)),

        relief89: reliefStr ?? '',
        balanceAfterRelief: String(Math.round(balanceAfterReliefVal)),

        tdsTcs: String(Math.round(tdsTcsVal)),

        fee234A: String(fee234AVal),
        fee234B: String(fee234BVal),
        fee234C: String(Math.round(fee234CVal)),
        fee234F: String(Math.round(fee234FVal)),

        totalInterestFeePayable: String(Math.round(totalInterestFeePayableVal)),
        totalTaxFeeInterest: String(Math.round(totalTaxFeeInterestVal)),
        roundOffTotalTaxFeeInterest: String(Math.round(roundOffVal)),

        table234A,
        table234B,
        table234C: cTable.rows,
      }));
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, value, resolvedSlabs, ayRow, assessmentYear, form.relief89, dividendQuarters, calculateBlocksRN],
  );

  // useEffect(() => {
  //   if (!completeDetail) return;
  //   if (!assessmentYear) return;
  //   if (!ayRow) return;
  //   recompute();
  // }, [completeDetail, assessmentYear, resolvedSlabs.NEW, resolvedSlabs.OLD, ayRow, recompute]);
  useEffect(() => {
    if (!completeDetail) return;
    if (!assessmentYear) return;
    recompute();
  }, [completeDetail, assessmentYear, ayRow, recompute]);

  const handleChange = (field, val) => {
    if (field === 'relief89') {
      recompute(val);
      return;
    }
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const view = useMemo(() => form, [form]);
  const [openPopup, setOpenPopup] = useState(null); // "234A" | "234B" | "234C" | null

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-3">
      <div className="bg-white w-[90%] max-w-[1100px] rounded-xl shadow-xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">Computation</h2>
            <div className="text-xs text-gray-500 mt-1">
              AY: {assessmentYear || '-'} • Slabs: {resolvedSlabs.usingApi ? 'API' : 'Fallback'} • AY Master: {assessmentYearList.length ? 'Loaded' : 'Loading...'}
            </div>
          </div>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <BigRupeeInput label="Total Taxable Income" value={view.totalIncomeTaxPayable} />
          <BigRupeeInput label="Tax Payable" value={view.taxPayable} />
          <BigRupeeInput label="Rebate u/s 87A" value={view.rebate87A} />
          <BigRupeeInput label="Rebate u/s 87A(b)" value={view.rebate87AB} />
          <BigRupeeInput label="Tax Payable after Rebate" value={view.taxAfterRebate} />
          <BigRupeeInput label="Health & Education Cess" value={view.cess} />
          <BigRupeeInput label="Total Tax and Cess" value={view.totalTaxAndCess} />

          <BigRupeeInput label="Relief u/s 89" value={view.relief89} disabled={false} onChange={(v) => handleChange('relief89', v)} />

          <BigRupeeInput label="Balance After Relief" value={view.balanceAfterRelief} />
          <BigRupeeInput label="TDS / TCS" value={view.tdsTcs} />

          <InterestField label="Interest u/s 234A" value={view.fee234A} onOpen={() => setOpenPopup('234A')} />
          <InterestField label="Interest u/s 234B" value={view.fee234B} onOpen={() => setOpenPopup('234B')} />
          <InterestField label="Interest u/s 234C" value={view.fee234C} onOpen={() => setOpenPopup('234C')} />

          <BigRupeeInput label="Fee u/s 234F" value={view.fee234F} />
          <BigRupeeInput label="Total Interest + Fee Payable" value={view.totalInterestFeePayable} />
          <BigRupeeInput label="Total Tax + Fee + Interest" value={view.totalTaxFeeInterest} />
          <BigRupeeInput label="Round Off (Total)" value={view.roundOffTotalTaxFeeInterest} />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="px-4 py-2 border rounded-md bg-white text-black" onClick={onClose}>
            Cancel
          </button>

          <button
            className="px-5 py-2 bg-blue-600 text-white rounded-md"
            onClick={() => {
              const payload = {
                totalIncomeTaxPayable: String(form.totalIncomeTaxPayable ?? '0'),
                taxPayable: String(form.taxPayable ?? '0'),
                rebate87A: String(form.rebate87A ?? '0'),
                rebate87AB: String(form.rebate87AB ?? '0'),
                taxAfterRebate: String(form.taxAfterRebate ?? '0'),
                cess: String(form.cess ?? '0'),
                totalTaxAndCess: String(form.totalTaxAndCess ?? '0'),
                relief89: String(form.relief89 ?? ''),
                balanceAfterRelief: String(form.balanceAfterRelief ?? '0'),
                tdsTcs: String(form.tdsTcs ?? '0'),
                fee234A: String(form.fee234A ?? '0'),
                fee234B: String(form.fee234B ?? '0'),
                fee234C: String(form.fee234C ?? '0'),
                fee234F: String(form.fee234F ?? '0'),
                totalInterestFeePayable: String(form.totalInterestFeePayable ?? '0'),
                totalTaxFeeInterest: String(form.totalTaxFeeInterest ?? '0'),
                roundOffTotalTaxFeeInterest: String(form.roundOffTotalTaxFeeInterest ?? '0'),
                totalTaxLiability: String(form.roundOffTotalTaxFeeInterest ?? '0'),
                regime: form.regime ?? 'NEW',
                table234A: Array.isArray(form.table234A) ? form.table234A : [],
                table234B: Array.isArray(form.table234B) ? form.table234B : [],
                table234C: Array.isArray(form.table234C) ? form.table234C : [],
              };
              onSave?.(payload);
            }}>
            Save
          </button>
        </div>

        <CenterTableModal open={!!openPopup} title={openPopup === '234C' ? 'Interest u/s 234C Details' : openPopup === '234A' ? 'Interest u/s 234A Details' : 'Interest u/s 234B Details'} onClose={() => setOpenPopup(null)}>
          {openPopup === '234C' && (
            <WebInterestTable
              headers={['S.No', 'Installment', 'Total Tax', '%', 'Required', 'Paid Till', 'Shortfall (₹100)', 'Months', 'Interest']}
              rows={(view.table234C || []).map((r) => [r.sno, r.period, r.totalTaxDue, r.percent, r.required, r.paidTillDate, r.shortfall, r.months, r.interest])}
              totalRow={(view.table234C || []).reduce((s, r) => s + toNum(r.interest), 0)}
            />
          )}

          {openPopup === '234A' && (
            <WebInterestTable
              headers={['Month', 'Principal', 'Interest', 'Deposit', 'Int Adjusted', 'Int Remain', 'Principal Adjusted']}
              rows={(view.table234A || []).map((r) => [r.month, r.principal, r.interest, r.deposit, r.interestAdjusted, r.interestRemaining, r.principalAdjusted])}
              totalRow={(view.table234A || []).reduce((s, r) => s + toNum(r.interest), 0)}
            />
          )}

          {openPopup === '234B' && (
            <WebInterestTable
              headers={['Month', 'Principal', 'Interest', 'Deposit', 'Int Adjusted', 'Int Remain', 'Principal Adjusted']}
              rows={(view.table234B || []).map((r) => [r.month, r.principal, r.interest, r.deposit, r.interestAdjusted, r.interestRemaining, r.principalAdjusted])}
              totalRow={(view.table234B || []).reduce((s, r) => s + toNum(r.interest), 0)}
            />
          )}
        </CenterTableModal>
      </div>
    </div>
  );
}