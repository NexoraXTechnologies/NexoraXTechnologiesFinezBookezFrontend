import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, IndianRupee, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import { formatIndianNumber, indianInputToRaw } from '../../../../components/common/DateFormator';

/* ================== RUPEE INPUT ================== */

const RupeeInput = ({ label, value, onChange, disabled }) => {
  const displayValue = formatIndianNumber(value);

  return (
    <div>
      {label && <label className="text-xs">{label}</label>}
      <div className="relative">
        <IndianRupee size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={displayValue}
          placeholder="0"
          onChange={(e) => onChange?.(indianInputToRaw(e.target.value))}
          className={`border rounded-md pl-6 pr-3 py-2 w-full text-right ${disabled ? 'bg-gray-100' : ''}`}
        />
      </div>
    </div>
  );
};

/* ================== MAIN COMPONENT ================== */

const TaxesPaid = ({ value, salary, onClose, onSave }) => {
  const [taxesPaid, setTaxesPaid] = useState(
    value ?? {
      tdsData: [{ tan: '', companyName: '', totalSalary: '', amount: '' }],
      tdsSummary: [],
      advanceTaxes: [],
    }
  );

  const [tdsModal, setTdsModal] = useState({
    open: false,
    editIndex: null,
    row: { tan: '', bsr: '', depositDate: '', challan: '', taxPaid: '' },
  });

  const [advanceModal, setAdvanceModal] = useState({
    open: false,
    editIndex: null,
    row: {
      bankName: '',
      bsr: '',
      depositDate: '',
      challan: '',
      taxPaid: '',
    },
  });

  const formatDateDDMMYYYY = (date) => {
    if (!date) return '';
    const [yyyy, mm, dd] = date.split('-');
    return `${dd}-${mm}-${yyyy}`;
  };

  const toNum = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
  const salary17 = toNum(salary?.salary?.totalSalary); // salary u/s 17(1)

  const totalSalaryFromTds = (taxesPaid.tdsData || []).reduce((sum, r) => sum + toNum(r.totalSalary), 0);
  const toastSlow = { autoClose: 7000 }; // 7s
  // simple Indian format for toast (optional)
  const formatINR = (n) => new Intl.NumberFormat('en-IN').format(n);
  const totalTdsTaxPaid = taxesPaid.tdsSummary.reduce((sum, r) => sum + toNum(r.taxPaid), 0);

  const totalAdvanceTaxPaid = taxesPaid.advanceTaxes.reduce((sum, r) => sum + toNum(r.taxPaid), 0);

  const totalTaxesPaid = totalTdsTaxPaid + totalAdvanceTaxPaid;
  const recalculateTdsAmounts = (tdsData, tdsSummary) => {
    return (tdsData || []).map((row) => {
      if (!row.tan) return row;

      const totalTaxPaid = (tdsSummary || []).filter((s) => String(s.tan).toUpperCase() === String(row.tan).toUpperCase()).reduce((sum, s) => sum + toNum(s.taxPaid), 0);

      return {
        ...row,
        amount: totalTaxPaid ? String(totalTaxPaid) : '',
      };
    });
  };
  useEffect(() => {
    const tdsData = taxesPaid.tdsData || [];
    const tdsSummary = taxesPaid.tdsSummary || [];

    if (!tdsData.length) return;

    const recalculated = recalculateTdsAmounts(tdsData, tdsSummary);
    const changed = JSON.stringify(recalculated) !== JSON.stringify(tdsData);

    if (changed) {
      setTaxesPaid((prev) => ({ ...prev, tdsData: recalculated }));
    }
  }, [taxesPaid.tdsSummary]); // ✅ runs when summary changes
  const payload = {
    tdsData: (taxesPaid.tdsData ?? []).map((r) => ({
      tan: (r.tan || '').toUpperCase(),
      companyName: r.companyName || '',
      totalSalary: toNum(r.totalSalary),
      amount: toNum(r.amount), // if you later compute it
    })),

    tdsSummary: (taxesPaid.tdsSummary ?? []).map((r) => ({
      tan: (r.tan || '').toUpperCase(),
      bsr: r.bsr || '',
      depositDate: r.depositDate || '', // keep yyyy-mm-dd (best)
      challan: r.challan || '',
      taxPaid: toNum(r.taxPaid),
    })),

    advanceTaxes: (taxesPaid.advanceTaxes ?? []).map((r) => ({
      bankName: r.bankName || '',
      bsr: r.bsr || '',
      depositDate: r.depositDate || '',
      challan: r.challan || '',
      taxPaid: toNum(r.taxPaid),
    })),

    totals: {
      totalTdsTaxPaid,
      totalAdvanceTaxPaid,
    },

    totalTaxesPaid,
  };
  /* ================== UI ================== */

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-3">
      <div className="bg-white w-[90%] max-w-[1100px] rounded-xl shadow-xl max-h-[88vh] overflow-y-auto p-5">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Taxes Paid</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* ================= TDS TAXES ================= */}
        <h3 className="font-semibold mb-3">TDS Taxes</h3>

        {(taxesPaid.tdsData || []).map((row, idx) => (
          <div key={idx} className="border rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="text-xs">TAN Number</label>
                <input
                  value={row.tan || ''}
                  onChange={(e) => {
                    const next = (e.target.value || '').toUpperCase();

                    // RN: max 10
                    if (next.length > 10) return;

                    // RN: validate when length === 10
                    if (next.length === 10 && !/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(next)) {
                      toast.error('Invalid TAN');
                      return;
                    }

                    const updated = [...(taxesPaid.tdsData || [])];
                    updated[idx] = { ...updated[idx], tan: next };
                    setTaxesPaid({ ...taxesPaid, tdsData: updated });
                  }}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Enter Tan Number"
                />
              </div>

              <div>
                <label className="text-xs">Company Name</label>
                <input
                  value={row.companyName || ''}
                  onChange={(e) => {
                    const updated = [...(taxesPaid.tdsData || [])];
                    updated[idx] = { ...updated[idx], companyName: e.target.value };
                    setTaxesPaid({ ...taxesPaid, tdsData: updated });
                  }}
                  className="border rounded-md px-3 py-2 w-full"
                  placeholder="Enter Company Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <RupeeInput
                label="Total Salary"
                value={row.totalSalary || ''}
                onChange={(v) => {
                  const updated = [...(taxesPaid.tdsData || [])];
                  updated[idx] = { ...updated[idx], totalSalary: v };
                  setTaxesPaid({ ...taxesPaid, tdsData: updated });
                }}
              />

              {/* RN: amount is not editable; it is auto-filled based on TDS Summary */}
              <RupeeInput label="Amount" value={row.amount || ''} disabled />
            </div>

            <button
              onClick={() => {
                const selectedTan = String(taxesPaid.tdsData?.[idx]?.tan || '').toUpperCase();

                // RN prevents delete if TAN used in summary rows
                const tanUsed = (taxesPaid.tdsSummary || []).some((s) => String(s.tan || '').toUpperCase() === selectedTan);

                if (tanUsed) {
                  toast.error('This TAN is already used in Advance Tax challan.');
                  return;
                }

                const updated = [...(taxesPaid.tdsData || [])];
                updated.splice(idx, 1);

                // keep at least 1 TAN row (optional; RN allows list shrink, but safe UX)
                setTaxesPaid({
                  ...taxesPaid,
                  tdsData: updated.length ? updated : [{ tan: '', companyName: '', totalSalary: '', amount: '' }],
                });
              }}
              className="text-red-600 text-sm flex items-center gap-1">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        ))}

        <button
          onClick={() =>
            setTaxesPaid({
              ...taxesPaid,
              tdsData: [...(taxesPaid.tdsData || []), { tan: '', companyName: '', totalSalary: '', amount: '' }],
            })
          }
          className="inline-flex items-center gap-2 text-sm mb-6 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
          <Plus size={14} /> Add New TAN
        </button>

        {/* ================= TDS SUMMARY PREVIEW ================= */}
        <h4 className="font-semibold mb-2">TDS Summary</h4>

        <div className="border rounded-md text-sm mb-3 overflow-hidden">
          {/* HEADER */}
          <div className="grid grid-cols-7 gap-2 p-2 bg-gray-50 font-semibold text-gray-700 border-b">
            <div>#</div>
            <div>TAN</div>
            <div>BSR Code</div>
            <div>Date of Deposit</div>
            <div>Challan No.</div>
            <div className="text-right">Tax Paid</div>
            <div className="text-center">Actions</div>
          </div>

          {/* ROWS */}
          {(taxesPaid.tdsSummary || []).length === 0 ? (
            <div className="p-3 text-gray-500">No TDS entries added yet.</div>
          ) : (
            (taxesPaid.tdsSummary || []).map((r, i) => (
              <div key={i} className="grid grid-cols-7 gap-2 p-2 border-b items-center">
                <div>{i + 1}</div>
                <div className="break-all">{r.tan}</div>
                <div className="break-all">{r.bsr}</div>
                <div>{formatDateDDMMYYYY(r.depositDate)}</div>
                <div className="break-all">{r.challan}</div>
                <div className="text-right">{formatINR(r.taxPaid)}</div>
                <div className="flex gap-2 justify-center">
                  <Pencil size={14} className="cursor-pointer text-blue-600" onClick={() => setTdsModal({ open: true, editIndex: i, row: r })} />
                  <Trash2
                    size={14}
                    className="cursor-pointer text-red-600"
                    onClick={() => {
                      const updated = [...(taxesPaid.tdsSummary || [])];
                      updated.splice(i, 1);
                      setTaxesPaid({ ...taxesPaid, tdsSummary: updated });
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ✅ Only ONE Add TDS by TAN button, with RN check */}
        <button
          onClick={() => {
            const canAddTdsByTan = (taxesPaid.tdsData?.[0]?.tan || '').trim() && (taxesPaid.tdsData?.[0]?.companyName || '').trim();

            if (!canAddTdsByTan) {
              toast.error('Please add tan number and company name');
              return;
            }

            setTdsModal({
              open: true,
              editIndex: null,
              row: {
                tan: '',
                bsr: '',
                depositDate: '',
                challan: '',
                taxPaid: '',
              },
            });
          }}
          className="inline-flex items-center gap-2 text-sm mb-6 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
          <Plus size={14} /> Add TDS by TAN
        </button>

        {/* ================= ADVANCE TAX PREVIEW ================= */}
        <h3 className="font-semibold mb-2">Advance & Self Assessment Taxes</h3>

        <div className="border rounded-md text-sm mb-3 overflow-hidden">
          {/* HEADER */}
          <div className="grid grid-cols-7 gap-2 p-2 bg-gray-50 font-semibold text-gray-700 border-b">
            <div>#</div>
            <div>Bank Name</div>
            <div>BSR Code</div>
            <div>Date of Deposit</div>
            <div>Challan No.</div>
            <div className="text-right">Tax Paid</div>
            <div className="text-center">Actions</div>
          </div>

          {/* ROWS */}
          {(taxesPaid.advanceTaxes || []).length === 0 ? (
            <div className="p-3 text-gray-500">No Advance/Self-Assessment entries added yet.</div>
          ) : (
            (taxesPaid.advanceTaxes || []).map((r, i) => (
              <div key={i} className="grid grid-cols-7 gap-2 p-2 border-b items-center">
                <div>{i + 1}</div>
                <div className="break-all">{r.bankName}</div>
                <div className="break-all">{r.bsr}</div>
                <div>{formatDateDDMMYYYY(r.depositDate)}</div>
                <div className="break-all">{r.challan}</div>
                <div className="text-right">{formatINR(r.taxPaid)}</div>
                <div className="flex gap-2 justify-center">
                  <Pencil size={14} className="cursor-pointer text-blue-600" onClick={() => setAdvanceModal({ open: true, editIndex: i, row: r })} />
                  <Trash2
                    size={14}
                    className="cursor-pointer text-red-600"
                    onClick={() => {
                      const updated = [...(taxesPaid.advanceTaxes || [])];
                      updated.splice(i, 1);
                      setTaxesPaid({ ...taxesPaid, advanceTaxes: updated });
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() =>
            setAdvanceModal({
              open: true,
              editIndex: null,
              row: {
                bankName: '',
                bsr: '',
                depositDate: '',
                challan: '',
                taxPaid: '',
              },
            })
          }
          className="inline-flex items-center gap-2 text-sm mb-6 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
          <Plus size={14} /> Add Advance Tax
        </button>

        {/* ================= TDS MODAL ================= */}
        {tdsModal.open && (
          <Modal
            title={tdsModal.editIndex === null ? 'Add TDS' : 'Edit TDS'}
            onClose={() => setTdsModal({ ...tdsModal, open: false })}
            onSave={() => {
              const row = tdsModal.row || {};

              const tan = (row.tan || '').trim();
              const bsr = (row.bsr || '').trim();
              const depositDate = (row.depositDate || '').trim();
              const challan = (row.challan || '').trim();
              const taxPaid = Number(row.taxPaid || 0);

              if (!tan) return toast.error('TAN is required');
              if (!bsr || bsr.length !== 7) return toast.error('BSR Code must be exactly 7 digits');
              if (!depositDate) return toast.error('Date of Deposit is required');
              if (!challan) return toast.error('Challan Number is required');
              if (!taxPaid || taxPaid <= 0) return toast.error('Tax Paid must be greater than 0');

              const updated = [...(taxesPaid.tdsSummary || [])];

              if (tdsModal.editIndex === null) {
                updated.push(row);
                toast.success('TDS added successfully');
              } else {
                updated[tdsModal.editIndex] = row;
                toast.success('TDS updated successfully');
              }

              setTaxesPaid({ ...taxesPaid, tdsSummary: updated });
              setTdsModal({ ...tdsModal, open: false });
            }}>
            <select
              className="border rounded-md px-3 py-2 w-full mb-2"
              value={tdsModal.row.tan}
              onChange={(e) =>
                setTdsModal({
                  ...tdsModal,
                  row: { ...tdsModal.row, tan: e.target.value },
                })
              }>
              <option value="">Select TAN</option>
              {(taxesPaid.tdsData || []).map((t, i) => (
                <option key={i} value={t.tan}>
                  {t.tan}
                </option>
              ))}
            </select>

            <ModalInputs modal={tdsModal} setModal={setTdsModal} />
          </Modal>
        )}

        {/* ================= ADVANCE MODAL ================= */}
        {advanceModal.open && (
          <Modal
            title={advanceModal.editIndex === null ? 'Add Advance Tax' : 'Edit Advance Tax'}
            onClose={() => setAdvanceModal({ ...advanceModal, open: false })}
            onSave={() => {
              const row = advanceModal.row || {};

              const bankName = (row.bankName || '').trim();
              const bsr = (row.bsr || '').trim();
              const depositDate = (row.depositDate || '').trim();
              const challan = (row.challan || '').trim();
              const taxPaid = Number(row.taxPaid || 0);

              if (!bankName) return toast.error('Bank Name is required');
              if (!bsr || bsr.length !== 7) return toast.error('BSR Code must be exactly 7 digits');
              if (!depositDate) return toast.error('Date of Deposit is required');
              if (!challan) return toast.error('Challan Number is required');
              if (!taxPaid || taxPaid <= 0) return toast.error('Tax Paid must be greater than 0');

              const updated = [...(taxesPaid.advanceTaxes || [])];

              if (advanceModal.editIndex === null) {
                updated.push(row);
                toast.success('Advance tax added successfully');
              } else {
                updated[advanceModal.editIndex] = row;
                toast.success('Advance tax updated successfully');
              }

              setTaxesPaid({ ...taxesPaid, advanceTaxes: updated });
              setAdvanceModal({ ...advanceModal, open: false });
            }}>
            <ModalInputs modal={advanceModal} setModal={setAdvanceModal} />
          </Modal>
        )}

        {/* ===== TOTAL TAXES PAID SUMMARY ===== */}
        <div className="px-6 py-1 text-sm text-right text-gray-700">Total Salary (from TDS): ₹ {formatINR(totalSalaryFromTds)}</div>
        <div className="px-6 py-1 text-sm text-right text-gray-700">Salary u/s 17(1): ₹ {formatINR(salary17)}</div>
        <div className="px-6 py-3 text-sm font-semibold text-right text-gray-700">Total Taxes Paid: ₹ {formatINR(totalTaxesPaid)}</div>

        <div className="sticky bottom-0 z-10 flex justify-end gap-3 px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50 bg-white text-black">
            Cancel
          </button>
          <button
            onClick={() => {
              // block save until salary matches
              if (salary17 && totalSalaryFromTds !== salary17) {
                toast.error(`Total salary from TDS must exactly match with salary u/s 17(1) i.e ${formatINR(salary17)}. Your TDS total is ${formatINR(totalSalaryFromTds)}.`, toastSlow);
                return;
              }

              onSave?.(payload);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================== GENERIC MODAL ================== */

const Modal = ({ title, children, onClose, onSave }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[420px] rounded-lg p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
      <div className="flex justify-end gap-3 mt-3">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onSave} className="bg-blue-600 text-white px-4 py-1 rounded-md">
          Save
        </button>
      </div>
    </div>
  </div>
);

/* ================== MODAL INPUTS ================== */

const ModalInputs = ({ modal, setModal }) => {
  const labelMap = {
    bankName: 'Bank Name',
    bsr: 'BSR Code',
    depositDate: 'Date of Deposit',
    challan: 'Challan Number',
    taxPaid: 'Tax Paid',
  };

  const placeholderMap = {
    bankName: 'Enter bank name',
    bsr: 'Enter 7 digit BSR',
    depositDate: '',
    challan: 'Enter challan number',
    taxPaid: 'Enter amount (e.g. 12000)',
  };

  return (
    <>
      {Object.keys(modal.row).map(
        (k) =>
          k !== 'tan' && (
            <div key={k} className="mb-2">
              <label className="text-xs text-gray-600">{labelMap[k] ?? k}</label>

              <input
                type={k === 'depositDate' ? 'date' : 'text'}
                placeholder={placeholderMap[k] ?? `Enter ${k}`}
                value={k === 'taxPaid' ? formatIndianNumber(modal.row[k]) : modal.row[k] || ''}
                max={k === 'depositDate' ? new Date().toISOString().split('T')[0] : undefined}
                maxLength={k === 'bsr' ? 7 : k === 'challan' ? 5 : undefined}
                inputMode={k === 'bsr' || k === 'taxPaid' || k === 'challan' ? 'numeric' : undefined}
                onChange={(e) => {
                  let value = e.target.value;

                  if (k === 'bsr') value = value.replace(/\D/g, '').slice(0, 7);
                  if (k === 'challan') value = value.replace(/\D/g, '').slice(0, 5);
                  if (k === 'taxPaid') value = indianInputToRaw(value);

                  if (k === 'depositDate') {
                    const today = new Date().toISOString().split('T')[0];
                    if (value > today) {
                      toast.error("Deposit date can't be in the future");
                      value = today;
                    }
                  }

                  setModal({ ...modal, row: { ...modal.row, [k]: value } });
                }}
                className="border rounded-md px-3 py-2 w-full"
              />
            </div>
          ),
      )}
    </>
  );
};

export default TaxesPaid;
