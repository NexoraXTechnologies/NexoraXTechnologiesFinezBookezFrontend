import React, { useState, useMemo } from 'react';
import { Trash2, Plus, X, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatIndianNumber, indianInputToRaw } from '../../../../components/common/DateFormator';

/* ================== CONSTANTS ================== */

const OTHER_INCOME_OPTIONS = [
  { label: 'Family pension', value: 'FAP' },
  {
    label: 'Interest accrued on contributions to provident fund taxable u/s 10(11)(i)',
    value: '10(11)(iP)',
  },
  {
    label: 'Interest accrued on contributions to provident fund taxable u/s 10(11)(ii)',
    value: '10(11)(iiP)',
  },
  {
    label: 'Interest accrued on contributions to provident fund taxable u/s 10(12)(i)',
    value: '10(12)(iP)',
  },
  {
    label: 'Interest accrued on contributions to provident fund taxable u/s 10(12)(ii)',
    value: '10(12)(iiP)',
  },
  {
    label: 'Income from retirement benefit account – Notified u/s 89A',
    value: 'NOT89A',
  },
  {
    label: 'Income from retirement benefit account – Non-Notified country',
    value: 'OTHNOT89A',
  },
  { label: 'Any Other', value: 'OTH' },
];

const inputClass = 'border rounded-md pl-7 pr-3 py-2 w-full text-right appearance-none';

/* ================== REUSABLE INPUT ================== */

const RupeeInput = ({ value, onChange, disabled = false, bold = false }) => {
  const displayValue = formatIndianNumber(value);

  return (
    <div className="relative">
      <IndianRupee size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={displayValue}
        placeholder="0"
        onChange={(e) => {
          const raw = indianInputToRaw(e.target.value); // store as "2440000"
          onChange?.(raw);
        }}
        className={`${inputClass} ${disabled ? 'bg-gray-100' : ''} ${bold ? 'font-semibold' : ''}`}
      />
    </div>
  );
};

/* ================== MAIN COMPONENT ================== */

const IncomeOtherSource = ({ value, assessmentYear, onClose, onSave }) => {
  /* -------- Nature of Income -------- */

  const safeAY = assessmentYear || value?.assessmentYear || '2026-2027';
  const [startYear, endYear] = String(safeAY).split('-');
  const QUARTERS = [
    { key: 'q1', label: `Upto 15 Jun ${startYear}` },
    { key: 'q2', label: `16 Jun – 15 Sep ${startYear}` },
    { key: 'q3', label: `16 Sep – 15 Dec ${startYear}` },
    { key: 'q4', label: `16 Dec – 15 Mar ${endYear}` },
    { key: 'q5', label: `16 Mar – 31 Mar ${endYear}` },
  ];

  /* -------- Any Other Income -------- */

  const [nature, setNature] = useState(value?.nature ?? { saving: '', deposit: '', refund: '' });

  const [otherRows, setOtherRows] = useState(value?.otherRows ?? [{ type: '', amount: '' }]);

  const [isNotified, setIsNotified] = useState(value?.isNotified ?? false);

  const [notified, setNotified] = useState(value?.notified ?? { usa: '', uk: '', canada: '' });

  const [quarters89A, setQuarters89A] = useState(value?.quarters89A ?? { q1: '', q2: '', q3: '', q4: '', q5: '' });

  const [dividend, setDividend] = useState(value?.dividend ?? { q1: '', q2: '', q3: '', q4: '', q5: '' });

  const [deductions, setDeductions] = useState(value?.deductions ?? { relief89A: '', deduction57: '' });

  const [nonNotified89A, setNonNotified89A] = useState(String(value?.nonNotified89A ?? ''));
  /* ================= CALCULATIONS ================= */
  /* ================= CALCULATIONS (MATCH RN) ================= */

  const toNum = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;

  const totalOtherIncome = useMemo(() => otherRows.reduce((sum, r) => sum + toNum(r.amount), 0), [otherRows]);

  const totalNotified = useMemo(() => toNum(notified.usa) + toNum(notified.uk) + toNum(notified.canada), [notified]);

  // Keep this if you want to SHOW it in UI (RN shows totalDividend89A etc),
  // but DO NOT include it in total income calculation.
  const total89AQuarter = useMemo(() => Object.values(quarters89A).reduce((a, b) => a + toNum(b), 0), [quarters89A]);

  const totalDividend = useMemo(() => Object.values(dividend).reduce((a, b) => a + toNum(b), 0), [dividend]);

  // ✅ RN totalIncomeOtherSources equivalent
  const netOtherIncome = useMemo(() => {
    const total = totalOtherIncome + totalDividend + toNum(nature.saving) + toNum(nature.deposit) + toNum(nature.refund) + toNum(nonNotified89A) - toNum(deductions.relief89A) - toNum(deductions.deduction57);

    return total; // number
  }, [totalOtherIncome, totalDividend, nature, nonNotified89A, deductions]);

  // If you still want a "gross" like RN (before minus), keep it separate:
  const grossOtherIncome = useMemo(() => {
    return totalOtherIncome + totalDividend + toNum(nature.saving) + toNum(nature.deposit) + toNum(nature.refund) + toNum(nonNotified89A);
  }, [totalOtherIncome, totalDividend, nature, nonNotified89A]);
  const payload = {
    assessmentYear: safeAY,

    nature: {
      saving: toNum(nature.saving),
      deposit: toNum(nature.deposit),
      refund: toNum(nature.refund),
    },

    otherRows: otherRows.filter((r) => r.type || r.amount).map((r) => ({ type: r.type, amount: toNum(r.amount) })),

    nonNotified89A: toNum(nonNotified89A),

    isNotified,

    notified: {
      usa: toNum(notified.usa),
      uk: toNum(notified.uk),
      canada: toNum(notified.canada),
      totalNotified, // display purpose
    },

    quarters89A: {
      ...Object.fromEntries(Object.entries(quarters89A).map(([k, v]) => [k, toNum(v)])),
      total89AQuarter, // display purpose
    },

    dividend: {
      ...Object.fromEntries(Object.entries(dividend).map(([k, v]) => [k, toNum(v)])),
      totalDividend, // included in RN total
    },

    deductions: {
      relief89A: toNum(deductions.relief89A),
      deduction57: toNum(deductions.deduction57),
    },

    totals: {
      totalOtherIncome,
      grossOtherIncome, // optional
    },

    netOtherIncome, // ✅ matches RN totalIncomeOtherSources
  };
  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-3">
      <div className="bg-white w-[82%] max-w-[1100px] rounded-xl shadow-xl max-h-[88vh] overflow-y-auto p-5">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Income From Other Sources</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Nature of Income */}
        <h3 className="font-semibold mb-3">Nature of Income</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs">Interest from Saving Bank</label>
            <RupeeInput value={nature.saving} onChange={(v) => setNature({ ...nature, saving: v })} />
          </div>
          <div>
            <label className="text-xs">Interest from Deposits</label>
            <RupeeInput value={nature.deposit} onChange={(v) => setNature({ ...nature, deposit: v })} />
          </div>
          <div>
            <label className="text-xs">Interest on Income Tax Refund</label>
            <RupeeInput value={nature.refund} onChange={(v) => setNature({ ...nature, refund: v })} />
          </div>
        </div>

        {/* Any Other Income */}
        <h3 className="font-semibold mb-3">Any Other Income</h3>

        {otherRows.map((row, i) => (
          <div key={i} className="grid grid-cols-[3fr_2fr_40px] gap-4 mb-3">
            <select
              className="border rounded-md px-3 py-2"
              value={row.type}
              onChange={(e) => {
                const r = [...otherRows];
                r[i].type = e.target.value;
                setOtherRows(r);
              }}>
              <option value="">Select Type</option>
              {OTHER_INCOME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <RupeeInput
              value={row.amount}
              onChange={(v) => {
                const r = [...otherRows];
                r[i].amount = v;
                setOtherRows(r);
              }}
            />

            <button
              onClick={() => {
                if (otherRows.length === 1) {
                  setOtherRows([{ type: '', amount: '' }]);
                } else {
                  setOtherRows(otherRows.filter((_, idx) => idx !== i));
                }
              }}
              className="text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button onClick={() => setOtherRows([...otherRows, { type: '', amount: '' }])} className="inline-flex items-center gap-2 text-sm mb-6 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
          <Plus size={14} /> Add More
        </button>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs">Amount (Non-Notified Country)</label>
            <RupeeInput value={nonNotified89A} onChange={setNonNotified89A} />
          </div>
        </div>
        {/* Notified Country */}
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" checked={isNotified} onChange={() => setIsNotified(!isNotified)} />
          <span className="text-sm">Are You Getting Income From Notified Countries?</span>
        </div>

        {isNotified && (
          <>
            <h3 className="font-semibold mb-4">Retirement Benefit from Notified Countries</h3>

            {/* ===== Type of Account ===== */}
            <h4 className="text-sm font-semibold mb-2">Type of Account</h4>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Notified u/s 89A(i) – USA</label>
                <RupeeInput value={notified.usa} onChange={(v) => setNotified({ ...notified, usa: v })} />
              </div>

              <div>
                <label className="text-xs">Notified u/s 89A(ii) – UK</label>
                <RupeeInput value={notified.uk} onChange={(v) => setNotified({ ...notified, uk: v })} />
              </div>

              <div>
                <label className="text-xs">Notified u/s 89A(iii) – Canada</label>
                <RupeeInput value={notified.canada} onChange={(v) => setNotified({ ...notified, canada: v })} />
              </div>

              <div>
                <label className="text-xs">Total Notified u/s 89A</label>
                <RupeeInput value={String(totalNotified)} disabled bold />
              </div>
            </div>

            {/* ===== Quarter-wise breakup ===== */}
            <h4 className="text-sm font-semibold mb-2">Quarter-wise Break-up (u/s 89A)</h4>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {QUARTERS.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs">{label}</label>
                  <RupeeInput value={quarters89A[key]} onChange={(v) => setQuarters89A({ ...quarters89A, [key]: v })} />
                </div>
              ))}

              <div>
                <label className="text-xs">Total 89A (i+ii+iii+iv+v)</label>
                <RupeeInput value={String(total89AQuarter)} disabled bold />
              </div>
            </div>
          </>
        )}

        {/* Dividend Income (Quarter-wise) */}
        <h3 className="font-semibold mb-3">Dividend Income (Quarter-wise)</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {QUARTERS.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs">{label}</label>
              <RupeeInput value={dividend[key]} onChange={(v) => setDividend({ ...dividend, [key]: v })} />
            </div>
          ))}

          <div>
            <label className="text-xs">Total Dividend Income</label>
            <RupeeInput value={String(totalDividend)} disabled bold />
          </div>
        </div>

        {/* Deductions */}
        <h3 className="font-semibold mb-3">Deductions</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs">Income claimed for relief u/s 89A</label>
            <RupeeInput
              value={deductions.relief89A}
              onChange={(v) => {
                const next = toNum(v);
                if (next > totalNotified) {
                  toast.error('Relief u/s 89A cannot be claimed more than income offered in pension accrued in a pension fund maintained in a notified country u/s 89A');
                  return;
                }
                setDeductions({ ...deductions, relief89A: v });
              }}
            />
          </div>
          <div>
            <label className="text-xs">Deduction u/s 57(iia)</label>
            <RupeeInput value={deductions.deduction57} onChange={(v) => setDeductions({ ...deductions, deduction57: v })} />
          </div>
          <div>
            <label className="text-xs">Total Income from Other Sources</label>
            <RupeeInput value={String(netOtherIncome)} disabled bold />
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 z-10 flex justify-end gap-3 mt-6 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md bg-white text-black">
            Cancel
          </button>
          <button onClick={() => onSave?.(payload)} className="px-5 py-2 bg-blue-600 text-white rounded-md">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomeOtherSource;
