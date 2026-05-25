import React, { useMemo, useState } from "react";
import { X, IndianRupee } from "lucide-react";
import { formatIndianNumber, indianInputToRaw } from '../../../../components/common/DateFormator';

/* ================== RUPEE INPUT ================== */
const RupeeInput = ({ value, onChange, disabled = false }) => {
  const displayValue = formatIndianNumber(value);

  return (
    <div className="relative w-52">
      <IndianRupee size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        disabled={disabled}
        placeholder="0"
        onChange={(e) => onChange?.(indianInputToRaw(e.target.value))}
        className={`border rounded-md pl-7 pr-3 py-2 w-full text-right ${disabled ? 'bg-gray-100' : ''}`}
      />
    </div>
  );
};

const TotalDeductions = ({ value, onClose, onSave }) => {
  const [data, setData] = useState(value?.data ?? {});
  const [enabled, setEnabled] = useState(() => {
    if (value?.enabled) return value.enabled;
    const d = value?.data ?? {};
    const e = {};
    Object.keys(d).forEach((k) => (e[k] = true));
    return e;
  });

  const computeTotalDeduction = (data) => {
    const toNum = (v) => {
      if (!v) return 0;
      const cleaned = String(v).replace(/,/g, '');
      return parseFloat(cleaned) || 0;
    };

    let total = 0;

    for (const key in data) {
      // RN skips TotalChapVIADeductions
      if (key === 'TotalChapVIADeductions') continue;

      if (key === 'Section80C' || key === 'Section80CCC' || key === 'Section80CCDEmployeeOrSE' || key === 'Section80EEA' || key === 'Section80EEB') {
        total += Math.min(toNum(data[key]), 150000);
      } else if (key === 'Section80CCD1B' || key === 'Section80EE' || key === 'Section80TTB') {
        total += Math.min(toNum(data[key]), 50000);
      } else if (key === 'Section80CCDEmployer' || key === 'Section80E' || key === 'Section80G' || key === 'Section80GGA' || key === 'Section80GGC') {
        total += Math.min(toNum(data[key]), 99999999999999);
      } else if (key === 'Section80D' || key === 'Section80DDB') {
        total += Math.min(toNum(data[key]), 100000);
      } else if (key === 'Section80DD' || key === 'Section80U') {
        total += Math.min(toNum(data[key]), 125000);
      } else if (key === 'Section80GG') {
        total += Math.min(toNum(data[key]), 60000);
      } else if (key === 'Section80TTA') {
        total += Math.min(toNum(data[key]), 10000);
      } else if (key === 'AnyOthSec80CCH') {
        total += Math.min(toNum(data[key]), 288000);
      } else {
        total += toNum(data[key]);
      }
    }

    return total;
  };

  const toggleRow = (key) => {
    setEnabled((prev) => {
      const nextEnabled = !prev[key];

      if (!nextEnabled) {
        setData((p) => {
          const copy = { ...p };
          delete copy[key];
          return copy;
        });
      }

      return { ...prev, [key]: nextEnabled };
    });
  };

  const renderRow = (key, label, msg) => (
    <div key={key} className="py-3">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800">{label}</div>
          <div className="text-xs text-gray-500">{msg}</div>
        </div>

        {/* TOGGLE SWITCH */}
        <button
          type="button"
          onClick={() => toggleRow(key)}
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200
    ${enabled[key] ? 'bg-blue-600' : 'bg-gray-300'}`}
          aria-pressed={!!enabled[key]}>
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200
      ${enabled[key] ? 'translate-x-4' : 'translate-x-1'}`}
          />
        </button>
      </div>

      {enabled[key] && (
        <div className="mt-3 pl-1">
          <RupeeInput value={data[key]} onChange={(v) => setData((p) => ({ ...p, [key]: v }))} />
        </div>
      )}
    </div>
  );
  const totalDeduction = useMemo(() => computeTotalDeduction(data), [data]);

  const payload = {
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Number(String(v ?? '').replace(/,/g, '')) || 0])),
    enabled,
    totalDeduction,
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-6">
      <div className="bg-white w-[92%] max-w-[1300px] rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Total Deductions</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-3 gap-6">
            {/* ================= LEFT COLUMN ================= */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Deductable Investment</h3>

              {renderRow('Section80C', 'Section80C:Life insurance premium, PPF, ELSS, NSC, tuition fees, etc.', 'Maximum exemption ₹1,50,000')}
              {renderRow('Section80CCC', 'Section80CCC: Contribution to pension funds (LIC / annuity plans)', 'Maximum exemption ₹1,50,000')}
              {renderRow('Section80CCDEmployeeOrSE', 'Section80CCDEmployeeOrSE:Employee’s contribution to NPS (up to 10% of salary)', 'Maximum exemption ₹1,50,000')}
              {renderRow('Section80CCD1B', 'Section80CCD1B: Additional contribution to NPS (up to ₹50,000)', 'Maximum exemption ₹50,000')}
              {renderRow('Section80CCDEmployer', 'Section80CCDEmployer: Employer’s contribution to NPS', 'No limit')}
            </div>

            {/* ================= MIDDLE COLUMN ================= */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Deductable Expenses</h3>

              {renderRow('Section80D', 'Section80D: Medical insurance premium (self, family, parents)', 'Maximum exemption ₹1,00,000')}
              {renderRow('Section80DD', 'Section80DD: Maintenance / medical treatment of dependent with disability', 'Maximum exemption ₹1,25,000')}
              {renderRow('Section80DDB', 'Section80DDB: Medical treatment of specified diseases', 'Maximum exemption ₹1,00,000')}
              {renderRow('Section80E', 'Section80E: Interest on education loan', 'Maximum exemption 9,99,99,99,99,99,999')}
              {renderRow('Section80EE', 'Section80EE: Interest on housing loan (first-time buyer)', 'Maximum exemption 50,000')}
              {renderRow('Section80EEA', 'Section80EEA: Interest on housing loan (affordable housing)', 'Maximum exemption 1,50,000')}
              {renderRow('Section80EEB', 'Section80EEB: Interest on loan for electric vehicle', 'Maximum exemption 1,50,000')}
              {renderRow('Section80GG', 'Section80GG: Rent paid (no HRA received)', 'Maximum exemption ₹60,000')}
              {renderRow('Section80TTA', 'Section80TTA: Interest on savings account (non-senior citizen)', 'Maximum exemption 10,000')}
              {renderRow('Section80TTB', 'Section80TTB: Interest on deposits (senior citizen)', 'Maximum exemption ₹50,000')}
              {renderRow('Section80U', 'Section80U: Deduction for taxpayer with disability', 'Maximum exemption 1,25,000')}
            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="bg-gray-50 rounded-xl p-5 flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-4">Donation & Other</h3>

              {renderRow('Section80G', 'Section80G: Donations to charitable institutions', 'Maximum exemption 9,99,99,99,99,99,999')}
              {renderRow('Section80GGA', 'Section80GGA: Donations for scientific research or rural development', 'Maximum exemption 9,99,99,99,99,99,999')}
              {renderRow('Section80GGC', 'Section80GGC: Contributions to political parties', 'Maximum exemption 9,99,99,99,99,99,999')}
              {renderRow('AnyOthSec80CCH', 'AnyOthSec80CCH:Any Other/Sec80CCH: Residual category', 'Maximum exemption 2,88,000')}

              {/* Sticky Total */}
              <div className="mt-auto pt-4 sticky bottom-0 bg-gray-50">
                <label className="text-xs font-semibold text-gray-600">Total Deduction Amount</label>
                <RupeeInput value={String(totalDeduction)} disabled />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 z-10 flex justify-end gap-3 px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50 bg-white text-black">
            Cancel
          </button>
          <button onClick={() => onSave?.(payload)} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TotalDeductions;
