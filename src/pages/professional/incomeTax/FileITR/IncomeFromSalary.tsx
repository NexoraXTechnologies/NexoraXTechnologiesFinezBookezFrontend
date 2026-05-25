import React, { useState, useMemo,useEffect } from "react";
import { Trash2, Plus, X, IndianRupee } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExemptAllowanceDropdown } from "../../../../redux/slices/professionalSlice/allDropDowns/alldropdownSlice";
import { formatIndianNumber, indianInputToRaw } from '../../../../components/common/DateFormator';

const STANDARD_DEDUCTION = 75000;

const inputClass =
  "border rounded-md pl-7 pr-3 py-2 w-full text-right appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

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
          const raw = indianInputToRaw(e.target.value); // "2440000"
          onChange?.(raw);
        }}
        className={`${inputClass} pl-7 ${disabled ? 'bg-gray-100' : ''} ${bold ? 'font-semibold' : ''}`}
      />
    </div>
  );
};

const IncomeFromSalary = ({ value, taxRegime = 'NEW', onClose, onSave }) => {
  const dispatch = useDispatch();
  const { exemptAllowances, loading } = useSelector((state) => state.alldropdown);
  useEffect(() => {
    dispatch(fetchExemptAllowanceDropdown({ offset: 0, limit: 100 }));
  }, [dispatch]);
  const [otherSalary, setOtherSalary] = useState(value?.otherSalary ?? false);

  const [salary, setSalary] = useState(value?.salary?.fields ?? { s1: '', s2: '', s3: '' });

  const [salary89A, setSalary89A] = useState(value?.salary89A?.fields ?? { usa: '', uk: '', canada: '', other: '' });

  const [deductions, setDeductions] = useState(
    value?.deductions?.fields ?? {
      entertainment: '',
      professionalTax: '',
      relief89A: '',
    }
  );
  // ✅ When switching to NEW, clear OLD-only fields to avoid confusion
  useEffect(() => {
    if (taxRegime !== 'OLD') {
      setDeductions((prev) => ({
        ...prev,
        entertainment: '',
        professionalTax: '',
      }));
    }
  }, [taxRegime]);

  const [exemptRows, setExemptRows] = useState(value?.exemptAllowances?.rows ?? [{ allowance: '', amount: '' }]);

  /* ================= CALCULATIONS ================= */

  const totalSalary = Number(salary.s1 || 0) + Number(salary.s2 || 0) + Number(salary.s3 || 0);

  const total89A = otherSalary ? Number(salary89A.usa || 0) + Number(salary89A.uk || 0) + Number(salary89A.canada || 0) + Number(salary89A.other || 0) : 0;

  const totalExempt = useMemo(() => exemptRows.reduce((sum, r) => sum + Number(r.amount || 0), 0), [exemptRows]);

  // ✅ OLD-regime only deductions (same as RN)
  const entertainmentDeduction = taxRegime === 'OLD' ? Number(deductions.entertainment || 0) : 0;

  const professionalTax = taxRegime === 'OLD' ? Number(deductions.professionalTax || 0) : 0;

  const relief89A = Number(deductions.relief89A || 0);

  // ✅ RN-equivalent net salary + clamp (never negative)
  const netSalary = Math.max(0, totalSalary + total89A - totalExempt - STANDARD_DEDUCTION - entertainmentDeduction - professionalTax - relief89A);

  const toNumber = (v) => Number(v || 0);

  const payload = {
    otherSalary,

    salary: {
      fields: {
        s1: toNumber(salary.s1),
        s2: toNumber(salary.s2),
        s3: toNumber(salary.s3),
      },
      totalSalary,
    },

    salary89A: {
      fields: {
        usa: toNumber(salary89A.usa),
        uk: toNumber(salary89A.uk),
        canada: toNumber(salary89A.canada),
        other: toNumber(salary89A.other),
      },
      total89A,
    },

    exemptAllowances: {
      rows: exemptRows
        .filter((r) => r.allowance || r.amount)
        .map((r) => ({
          allowance: r.allowance,
          amount: toNumber(r.amount),
        })),
      totalExempt,
    },

    deductions: {
      standardDeduction: STANDARD_DEDUCTION,
      fields: {
        entertainment: taxRegime === 'OLD' ? toNumber(deductions.entertainment) : 0, // ✅ NEW => 0
        professionalTax: taxRegime === 'OLD' ? toNumber(deductions.professionalTax) : 0, // ✅ NEW => 0
        relief89A: toNumber(deductions.relief89A),
      },
    },

    netSalary,
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-3">
      <div className="bg-white w-[82%] max-w-[1100px] rounded-xl shadow-xl max-h-[88vh] overflow-y-auto p-5">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Income From Salary</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Income From Salary */}
        <h3 className="text-md font-semibold mb-3">Income From Salary</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs">Salary Amount u/s 17(1)</label>
            <RupeeInput value={salary.s1} onChange={(v) => setSalary({ ...salary, s1: v })} />
          </div>
          <div>
            <label className="text-xs">Perquisites u/s 17(2)</label>
            <RupeeInput value={salary.s2} onChange={(v) => setSalary({ ...salary, s2: v })} />
          </div>
          <div>
            <label className="text-xs">Profits in lieu of Salary u/s 17(3)</label>
            <RupeeInput value={salary.s3} onChange={(v) => setSalary({ ...salary, s3: v })} />
          </div>
          <div>
            <label className="text-xs">Total Salary (Auto Calculated)</label>
            <RupeeInput value={String(totalSalary)} disabled bold />
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2 mb-5">
          <input type="checkbox" checked={otherSalary} onChange={() => setOtherSalary(!otherSalary)} />
          <span className="text-sm">Are you getting other salary component?</span>
        </div>

        {/* Other Salary Component */}
        {otherSalary && (
          <>
            <h3 className="text-md font-semibold mb-3">Other Salary Component</h3>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                ['usa', 'Notified u/s 89A(i) (USA)'],
                ['uk', 'Notified u/s 89A(ii) (UK)'],
                ['canada', 'Notified u/s 89A(iii) (Canada)'],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="text-xs">{label}</label>
                  <RupeeInput value={salary89A[k]} onChange={(v) => setSalary89A({ ...salary89A, [k]: v })} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Non-Notified Country</label>
                <RupeeInput value={salary89A.other} onChange={(v) => setSalary89A({ ...salary89A, other: v })} />
              </div>
              <div>
                <label className="text-xs">Income from notified country u/s 89A</label>
                <RupeeInput value={String(total89A)} disabled bold />
              </div>
            </div>
          </>
        )}

        {/* Exempt Allowance */}
        <h3 className="text-md font-semibold mb-3">Exempt Allowance</h3>

        {exemptRows.map((row, i) => (
          <div key={i} className="grid grid-cols-[3fr_2fr_40px] gap-4 mb-3">
            {/* Allowance Type */}
            <div>
              <label className="text-xs mb-1 block">Allowance Type</label>
              <select
                className="border rounded-md px-3 py-2 w-full"
                value={row.allowance}
                onChange={(e) => {
                  const r = [...exemptRows];
                  r[i].allowance = e.target.value;
                  setExemptRows(r);
                }}>
                <option value="">Select Exempt Allowance</option>

                {exemptAllowances.map((item) => (
                  <option key={item.exemptAllowanceId} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exempt Amount */}
            <div>
              <label className="text-xs mb-1 block">Exempt Amount</label>
              <RupeeInput
                value={row.amount}
                onChange={(v) => {
                  const r = [...exemptRows];
                  r[i].amount = v;
                  setExemptRows(r);
                }}
              />
            </div>

            {/* Delete */}
            <button
              className="text-red-600 mt-6"
              onClick={() => {
                const updated = exemptRows.filter((_, idx) => idx !== i);

                // ✅ RN behavior: always keep at least one empty row
                setExemptRows(updated.length ? updated : [{ allowance: '', amount: '' }]);
              }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          onClick={() => setExemptRows([...exemptRows, { allowance: '', amount: '' }])}
          className="inline-flex items-center gap-2 text-sm mb-6 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
          <Plus size={14} /> Add More
        </button>

        {/* Deductions */}
        <h3 className="text-md font-semibold mb-3">Deductions u/s 16</h3>

        <div className="grid grid-cols-3 gap-4">
          {/* Standard Deduction */}
          <div>
            <label className="text-xs mb-1 block">Standard Deduction</label>
            <RupeeInput value={String(STANDARD_DEDUCTION)} disabled />
          </div>

          {/* Entertainment Allowance */}
          {/* Entertainment Allowance + Professional Tax only for OLD regime (RN same) */}
          {taxRegime === 'OLD' && (
            <>
              <div>
                <label className="text-xs mb-1 block">Entertainment Allowance u/s 16 (ii)</label>
                <RupeeInput value={deductions.entertainment} onChange={(v) => setDeductions({ ...deductions, entertainment: v })} />
              </div>

              <div>
                <label className="text-xs mb-1 block">Professional Tax</label>
                <RupeeInput value={deductions.professionalTax} onChange={(v) => setDeductions({ ...deductions, professionalTax: v })} />
              </div>
            </>
          )}
          {/* <div>
            <label className="text-xs mb-1 block">
              Entertainment Allowance u/s 16 (ii)
            </label>
            <RupeeInput
              value={deductions.entertainment}
              onChange={(v) =>
                setDeductions({ ...deductions, entertainment: v })
              }
            />
          </div> */}

          {/* Professional Tax */}
          {/* <div>
            <label className="text-xs mb-1 block">Professional Tax</label>
            <RupeeInput value={deductions.professionalTax} onChange={(v) => setDeductions({ ...deductions, professionalTax: v })} />
          </div> */}

          {/* Relief u/s 89A */}
          <div>
            <label className="text-xs mb-1 block">Relief u/s 89A</label>
            <RupeeInput value={deductions.relief89A} onChange={(v) => setDeductions({ ...deductions, relief89A: v })} />
          </div>

          {/* Net Total Salary */}
          <div>
            <label className="text-xs mb-1 block">Net Total Salary</label>
            <RupeeInput value={String(netSalary)} disabled bold />
          </div>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex justify-end gap-3 mt-6 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md bg-white text-black">
            Cancel
          </button>
          <button onClick={() => onSave(payload)} className="px-5 py-2 bg-blue-600 text-white rounded-md">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomeFromSalary;
