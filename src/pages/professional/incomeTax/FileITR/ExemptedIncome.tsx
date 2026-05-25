import React, { useState, useEffect } from "react";
import { Trash2, Plus, X, IndianRupee } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReportingPurposeDropdown } from "../../../../redux/slices/professionalSlice/allDropDowns/alldropdownSlice";
import { toast } from 'react-toastify';
import { formatIndianNumber, indianInputToRaw } from '../../../../components/common/DateFormator';

/* ================== CONSTANTS ================== */

const inputClass = 'border rounded-md pl-7 pr-3 py-2 w-full text-right appearance-none';

/* ================== RUPEE INPUT ================== */

const RupeeInput = ({ value, onChange, disabled = false }) => {
  const displayValue = formatIndianNumber(value);

  return (
    <div className="relative">
      <IndianRupee size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
      <input type="text" inputMode="numeric" value={displayValue} disabled={disabled} placeholder="0" onChange={(e) => onChange?.(indianInputToRaw(e.target.value))} className={`${inputClass} ${disabled ? 'bg-gray-100' : ''}`} />
    </div>
  );
};

/* ================== MAIN COMPONENT ================== */

const ExemptedIncome = ({ value, onClose, onSave }) => {
  const dispatch = useDispatch();
  const { reportingPurposes } = useSelector((state) => state.alldropdown);

  useEffect(() => {
    dispatch(fetchReportingPurposeDropdown({ offset: 0, limit: 100 }));
  }, [dispatch]);
  /* -------- Exempted Income Rows -------- */
  const [rows, setRows] = useState(value?.rows ?? [{ type: '', amount: '' }]);

  const [ltcg112a, setLtcg112a] = useState(value?.ltcg112a ?? { sale: '', cost: '' });
  const toNum = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;

  const sale = toNum(ltcg112a.sale);
  const cost = toNum(ltcg112a.cost);
  const ltcg = sale - cost; // ✅ RN logic

  const totalExemptIncome = rows.reduce((sum, r) => sum + toNum(r.amount), 0);

  const payload = {
    rows: rows.filter((r) => r.type || r.amount).map((r) => ({ type: r.type, amount: toNum(r.amount) })),

    totalExemptIncome,

    ltcg112a: { sale, cost, ltcg }, // ✅ derived
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-3">
      <div className="bg-white w-[80%] max-w-[1100px] rounded-xl shadow-xl max-h-[88vh] overflow-y-auto p-5">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Exempted Income</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ================= Exempted Income ================= */}
        <h3 className="font-semibold mb-3">Exempted Income</h3>
        {/* COLUMN LABELS */}
        <div className="grid grid-cols-[3fr_2fr_40px] gap-4 mb-1">
          <label className="text-xs text-gray-600">Reporting Purpose</label>
          <label className="text-xs text-gray-600 text-right">Total Exempt Income</label>
          <span />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[3fr_2fr_40px] gap-4 mb-3">
            <select
              className="border rounded-md px-3 py-2  w-full max-w-full"
              value={row.type}
              onChange={(e) => {
                const r = [...rows];
                r[i].type = e.target.value; // <-- code
                setRows(r);
              }}>
              <option value="">Reporting Purpose</option>

              {reportingPurposes.map((item) => (
                <option key={item.reportingPurposeId} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>

            <RupeeInput
              value={row.amount}
              onChange={(v) => {
                const r = [...rows];
                const next = toNum(v);

                if (r[i].type === 'AGRI' && next > 5000) {
                  toast.error('If agriculture income is more than ₹5,000, then ITR-II filing is required.');
                  r[i].amount = '5000';
                } else {
                  r[i].amount = v;
                }

                setRows(r);
              }}
            />

            <button
              onClick={() => {
                if (rows.length === 1) {
                  setRows([{ type: '', amount: '' }]);
                } else {
                  setRows(rows.filter((_, idx) => idx !== i));
                }
              }}
              className="text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {/* ADD MORE */}
        <button onClick={() => setRows([...rows, { type: '', amount: '' }])} className="inline-flex items-center gap-2 text-sm mb-6 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
          <Plus size={14} /> Add More
        </button>

        {/* ================= LTCG 112A ================= */}
        <h3 className="font-semibold mb-3">Long Term Capital Gain u/s 112A (No tax payable)</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs">Total Sale Consideration</label>
            <RupeeInput value={ltcg112a.sale} onChange={(v) => setLtcg112a((p) => ({ ...p, sale: v }))} />
          </div>

          <div>
            <label className="text-xs">Total Cost of Acquisition</label>
            <RupeeInput value={ltcg112a.cost} onChange={(v) => setLtcg112a((p) => ({ ...p, cost: v }))} />
          </div>

          <div>
            <label className="text-xs">LTCG u/s 112A</label>
            <RupeeInput
              value={String(ltcg)} // ✅ derived
              disabled // ✅ read-only like RN
            />
          </div>
        </div>
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

export default ExemptedIncome;
