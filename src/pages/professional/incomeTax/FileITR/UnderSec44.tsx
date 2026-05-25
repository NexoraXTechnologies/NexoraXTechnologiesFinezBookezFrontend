import React, { useMemo, useState } from 'react';
import { X, IndianRupee } from 'lucide-react';
import { formatIndianNumber, indianInputToRaw } from '../../../../components/common/DateFormator';

/* ===================== HELPERS ===================== */

const inputClass = 'border rounded-md pl-7 pr-3 py-2 w-full text-right appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

const RupeeInput = ({ value, onChange, disabled = false, bold = false, placeholder = '0' }) => {
  const displayValue = formatIndianNumber(value);

  return (
    <div className="relative">
      <IndianRupee size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={displayValue}
        placeholder={placeholder}
        onChange={(e) => onChange?.(indianInputToRaw(e.target.value))}
        className={`${inputClass} ${disabled ? 'bg-gray-100' : ''} ${bold ? 'font-semibold' : ''}`}
      />
    </div>
  );
};

const TextInput = ({ value, onChange, disabled = false, placeholder = '' }) => (
  <input type="text" disabled={disabled} value={value} placeholder={placeholder} onChange={(e) => onChange?.(e.target.value)} className={`border rounded-md px-3 py-2 w-full ${disabled ? 'bg-gray-100' : ''}`} />
);

const Select = ({ value, onChange, options = [], placeholder = 'Select', disabled = false }) => (
  <select disabled={disabled} value={value} onChange={(e) => onChange?.(e.target.value)} className={`border rounded-md px-3 py-2 w-full ${disabled ? 'bg-gray-100' : ''}`}>
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value || opt} value={opt.value || opt}>
        {opt.label || opt}
      </option>
    ))}
  </select>
);

const toNum = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;

/* ===================== OPTIONS ===================== */

const SECTION_OPTIONS = [
  { value: '44AD', label: '44AD' },
  { value: '44ADA', label: '44ADA' },
  { value: '44AE', label: '44AE' },
];

const SECTION_TYPE_MAP = {
  '44AD': [
    { value: 'trading', label: 'Trading' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'service', label: 'Service' },
    { value: 'retail', label: 'Retail' },
  ],
  '44ADA': [
    { value: 'legal', label: 'Legal' },
    { value: 'medical', label: 'Medical' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'accountancy', label: 'Accountancy' },
    { value: 'technical_consultancy', label: 'Technical Consultancy' },
    { value: 'interior_decoration', label: 'Interior Decoration' },
    { value: 'other_profession', label: 'Other Profession' },
  ],
  '44AE': [{ value: 'goods_carriage', label: 'Goods carriage' }],
};

const BUSINESS_TYPE_OPTIONS = [
  { value: 'business', label: 'Business' },
  { value: 'profession', label: 'Profession' },
];

/* ===================== POPUP ===================== */

const FinancialParticularsModal = ({ sectionOpted, value, onClose, onSave }) => {
  const [liab, setLiab] = useState(
    value?.liabilities ?? {
      partnersOwnCapital: '',
      securedLoans: '',
      unsecuredLoans: '',
      advances: '',
      sundryCreditors: '',
      otherLiabilities: '',
    }
  );

  const [assets, setAssets] = useState(
    value?.assets ?? {
      fixedAssets: '',
      inventories: '',
      sundryDebtors: '',
      balanceWithBanks: '',
      cashInHand: '',
      loansAndAdvances: '',
      otherAssets: '',
    }
  );

  const totalLiabilities = useMemo(() => {
    return toNum(liab.partnersOwnCapital) + toNum(liab.securedLoans) + toNum(liab.unsecuredLoans) + toNum(liab.advances) + toNum(liab.sundryCreditors) + toNum(liab.otherLiabilities);
  }, [liab]);

  const totalAssets = useMemo(() => {
    return toNum(assets.fixedAssets) + toNum(assets.inventories) + toNum(assets.sundryDebtors) + toNum(assets.balanceWithBanks) + toNum(assets.cashInHand) + toNum(assets.loansAndAdvances) + toNum(assets.otherAssets);
  }, [assets]);

  const difference = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);
  const modalPayload = {
    sectionOpted,
    liabilities: {
      partnersOwnCapital: toNum(liab.partnersOwnCapital),
      securedLoans: toNum(liab.securedLoans),
      unsecuredLoans: toNum(liab.unsecuredLoans),
      advances: toNum(liab.advances),
      sundryCreditors: toNum(liab.sundryCreditors),
      otherLiabilities: toNum(liab.otherLiabilities),
    },
    assets: {
      fixedAssets: toNum(assets.fixedAssets),
      inventories: toNum(assets.inventories),
      sundryDebtors: toNum(assets.sundryDebtors),
      balanceWithBanks: toNum(assets.balanceWithBanks),
      cashInHand: toNum(assets.cashInHand),
      loansAndAdvances: toNum(assets.loansAndAdvances),
      otherAssets: toNum(assets.otherAssets),
    },
    totalLiabilities,
    totalAssets,
    difference,
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-3">
      <div className="bg-white w-[86%] max-w-[920px] rounded-xl shadow-xl max-h-[88vh] overflow-y-auto p-5">
        {/* Header */}
        <div className="relative mb-5">
          <button className="absolute right-0 top-0" onClick={onClose}>
            <X size={20} />
          </button>
          <h2 className="text-lg font-semibold text-center">Financial Particulars ({sectionOpted || '44AD / 44ADA / 44AE'})</h2>
        </div>

        {/* Capital & Liabilities */}
        <h3 className="text-md font-semibold mb-3">Capital & Liabilities</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs">Partners/ Members Own Capital</label>
            <RupeeInput value={liab.partnersOwnCapital} onChange={(v) => setLiab({ ...liab, partnersOwnCapital: v })} />
          </div>
          <div>
            <label className="text-xs">Secured Loans</label>
            <RupeeInput value={liab.securedLoans} onChange={(v) => setLiab({ ...liab, securedLoans: v })} />
          </div>
          <div>
            <label className="text-xs">Unsecured Loans</label>
            <RupeeInput value={liab.unsecuredLoans} onChange={(v) => setLiab({ ...liab, unsecuredLoans: v })} />
          </div>
          <div>
            <label className="text-xs">Advances</label>
            <RupeeInput value={liab.advances} onChange={(v) => setLiab({ ...liab, advances: v })} />
          </div>
          <div>
            <label className="text-xs">Sundry Creditors</label>
            <RupeeInput value={liab.sundryCreditors} onChange={(v) => setLiab({ ...liab, sundryCreditors: v })} />
          </div>
          <div>
            <label className="text-xs">Other Liabilities</label>
            <RupeeInput value={liab.otherLiabilities} onChange={(v) => setLiab({ ...liab, otherLiabilities: v })} />
          </div>

          <div className="col-span-2">
            <label className="text-xs">Total Capital & Liabilities</label>
            <RupeeInput value={String(totalLiabilities)} disabled bold />
          </div>
        </div>

        {/* Assets */}
        <h3 className="text-md font-semibold mb-3">Assets</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs">Fixed Assets</label>
            <RupeeInput value={assets.fixedAssets} onChange={(v) => setAssets({ ...assets, fixedAssets: v })} />
          </div>
          <div>
            <label className="text-xs">Inventories</label>
            <RupeeInput value={assets.inventories} onChange={(v) => setAssets({ ...assets, inventories: v })} />
          </div>
          <div>
            <label className="text-xs">Sundry Debtors</label>
            <RupeeInput value={assets.sundryDebtors} onChange={(v) => setAssets({ ...assets, sundryDebtors: v })} />
          </div>
          <div>
            <label className="text-xs">Balance with Banks</label>
            <RupeeInput value={assets.balanceWithBanks} onChange={(v) => setAssets({ ...assets, balanceWithBanks: v })} />
          </div>
          <div>
            <label className="text-xs">Cash-in-hand</label>
            <RupeeInput value={assets.cashInHand} onChange={(v) => setAssets({ ...assets, cashInHand: v })} />
          </div>
          <div>
            <label className="text-xs">Loans and Advances</label>
            <RupeeInput value={assets.loansAndAdvances} onChange={(v) => setAssets({ ...assets, loansAndAdvances: v })} />
          </div>
          <div>
            <label className="text-xs">Other Assets</label>
            <RupeeInput value={assets.otherAssets} onChange={(v) => setAssets({ ...assets, otherAssets: v })} />
          </div>

          <div className="col-span-2">
            <label className="text-xs">Total Assets</label>
            <RupeeInput value={String(totalAssets)} disabled bold />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <label className="text-xs">Difference (Assets - Liabilities)</label>
            <RupeeInput value={String(difference)} disabled bold />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
          <button onClick={() => onSave?.(modalPayload)} className="px-5 py-2 bg-blue-600 text-white rounded-md">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===================== MAIN COMPONENT ===================== */

const UnderSec44 = ({ value, onClose, onSave }) => {
  // Group 1
  const [section, setSection] = useState(value?.section ?? '');
  const [sectionType, setSectionType] = useState(value?.sectionType ?? '');
  const [businessType, setBusinessType] = useState(value?.businessType ?? '');
  const [presumptiveOpted, setPresumptiveOpted] = useState(value?.presumptiveOpted ?? '');
  const [noOfVehicles, setNoOfVehicles] = useState(value?.noOfVehicles ?? '');
  const [monthsOwned, setMonthsOwned] = useState(value?.monthsOwned ?? '');
  const INCOME_PER_VEHICLE_PER_MONTH = value?.incomePerVehiclePerMonth ?? 7500;

  // Group 2
  // const [turnover, setTurnover] = useState(String(value?.turnover ?? ''));
  const [cashTurnover, setCashTurnover] = useState(String(value?.cashTurnover ?? ''));
  const [digitalTurnover, setDigitalTurnover] = useState(String(value?.digitalTurnover ?? ''));

  const [pan, setPan] = useState(value?.pan ?? '');
  const [businessName, setBusinessName] = useState(value?.businessName ?? '');

  const [hasGst, setHasGst] = useState(value?.hasGst ?? true);
  const [gstNo, setGstNo] = useState(value?.gstNo ?? '');

  // Higher income
  const [higherIncomeYesNo, setHigherIncomeYesNo] = useState(value?.higherIncomeYesNo ?? '');
  const [declaredPresumptiveIncome, setDeclaredPresumptiveIncome] = useState(String(value?.declaredPresumptiveIncome ?? ''));

  // Financial particulars (for nested modal data)
  const [financials, setFinancials] = useState(value?.financials ?? null);
  // Popup
  const [openModal, setOpenModal] = useState(false);

  // Reset dependent fields when section changes
  const onSectionChange = (val) => {
    setSection(val);
    setSectionType('');
  };

  const sectionTypeOptions = SECTION_TYPE_MAP[section] || [];

  // Conditional: 44AD only summary/rate blocks
  const show44ADBlocks = section === '44AD';
  const show44ADABlocks = section === '44ADA';
  const show44AEBlocks = section === '44AE';
  const sectionOpted = section;

  // ✅ RN exact: Turnover = cashTurnover + digitalTurnover (no manual override)
  const totalTurnoverAuto = useMemo(() => {
    return toNum(cashTurnover) + toNum(digitalTurnover);
  }, [cashTurnover, digitalTurnover]);

  const cashTurnoverAuto = useMemo(() => toNum(cashTurnover), [cashTurnover]);
  const digitalTurnoverAuto = useMemo(() => toNum(digitalTurnover), [digitalTurnover]);

  const incomeOnDigital6 = useMemo(() => (digitalTurnoverAuto * 6) / 100, [digitalTurnoverAuto]);
  const incomeOnCash8 = useMemo(() => (cashTurnoverAuto * 8) / 100, [cashTurnoverAuto]);

  const computedPresumptiveIncome44AE = useMemo(() => {
    return toNum(noOfVehicles) * toNum(monthsOwned) * INCOME_PER_VEHICLE_PER_MONTH;
  }, [noOfVehicles, monthsOwned, INCOME_PER_VEHICLE_PER_MONTH]);

  const presumptiveIncome44ADA = useMemo(() => totalTurnoverAuto * 0.5, [totalTurnoverAuto]);

  const presumptiveIncomeAuto = section === '44ADA' ? presumptiveIncome44ADA : section === '44AD' ? incomeOnDigital6 + incomeOnCash8 : section === '44AE' ? computedPresumptiveIncome44AE : 0;

  const finalPresumptiveIncome = useMemo(() => {
    if (higherIncomeYesNo === 'yes') return toNum(declaredPresumptiveIncome);
    if (higherIncomeYesNo === 'no') return presumptiveIncomeAuto;
    return presumptiveIncomeAuto; // default if not selected
  }, [higherIncomeYesNo, declaredPresumptiveIncome, presumptiveIncomeAuto]);

  const payload = {
    // selections
    section,
    sectionType,
    businessType,
    presumptiveOpted: presumptiveOpted === 'true' ? true : presumptiveOpted === 'false' ? false : null,
    sectionOpted,

    // business details
    turnover: totalTurnoverAuto,
    cashTurnover: toNum(cashTurnover),
    digitalTurnover: toNum(digitalTurnover),
    totalTurnoverAuto,
    pan,
    businessName,
    hasGst,
    gstNo: hasGst ? gstNo : null,

    // 44AE
    noOfVehicles: toNum(noOfVehicles),
    monthsOwned: toNum(monthsOwned),
    incomePerVehiclePerMonth: INCOME_PER_VEHICLE_PER_MONTH,
    computedPresumptiveIncome44AE,

    // 44AD
    incomeOnDigital6,
    incomeOnCash8,

    // 44ADA
    presumptiveIncome44ADA,

    // higher income
    higherIncomeYesNo,
    declaredPresumptiveIncome: toNum(declaredPresumptiveIncome),

    // final
    finalPresumptiveIncome,

    // financial particulars (nested modal)
    financials,
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-3">
      <div className="bg-white w-[82%] max-w-[1100px] rounded-xl shadow-xl max-h-[88vh] overflow-y-auto p-5">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Under Sec 44</h2>

          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition">
            <X size={20} />
          </button>
        </div>

        {/* GROUP 1: Nature of activity */}
        <h3 className="text-md font-semibold mb-3">Nature of Activity</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs">Section</label>
            <Select value={section} onChange={onSectionChange} options={SECTION_OPTIONS} placeholder="Select Section" />
          </div>

          <div>
            <label className="text-xs">Select Section Type</label>
            <Select value={sectionType} onChange={setSectionType} options={sectionTypeOptions} placeholder={section ? 'Select Section Type' : 'Select Section first'} disabled={!section} />
          </div>

          <div>
            <label className="text-xs">Business Type</label>
            <Select value={businessType} onChange={setBusinessType} options={BUSINESS_TYPE_OPTIONS} placeholder="Select Business Type" />
          </div>

          <div>
            <label className="text-xs">Presumptive Taxation Opted</label>
            <Select
              value={presumptiveOpted}
              onChange={setPresumptiveOpted}
              options={[
                { value: 'true', label: 'True' },
                { value: 'false', label: 'False' },
              ]}
              placeholder="Select True/False"
            />
          </div>

          <div>
            <label className="text-xs">Section Opted</label>
            <Select value={sectionOpted} onChange={() => {}} options={SECTION_OPTIONS} placeholder="Section Opted" disabled />
          </div>
        </div>

        {/* GROUP 2 */}
        <h3 className="text-md font-semibold mb-3">Business Details</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs">Turnover / Gross receipts</label>
            <RupeeInput value={String(totalTurnoverAuto)} disabled bold />
          </div>

          <div>
            <label className="text-xs">Cash Turnover</label>
            <RupeeInput value={cashTurnover} onChange={setCashTurnover} />
          </div>

          <div>
            <label className="text-xs">Digital Turnover</label>
            <RupeeInput value={digitalTurnover} onChange={setDigitalTurnover} />
          </div>

          <div>
            <label className="text-xs">PAN of business</label>
            <TextInput value={pan} onChange={setPan} placeholder="Enter PAN of business" />
          </div>

          <div>
            <label className="text-xs">Business Name</label>
            <TextInput value={businessName} onChange={setBusinessName} placeholder="Enter business name" />
          </div>

          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={hasGst} onChange={() => setHasGst(!hasGst)} />
            <span className="text-sm">Do you have GST No?</span>
          </div>

          {hasGst && (
            <div>
              <label className="text-xs">GST No</label>
              <TextInput value={gstNo} onChange={setGstNo} placeholder="Enter GST No" />
            </div>
          )}
        </div>

        {/* CONDITIONAL GROUP: ONLY IF 44AD */}
        {show44ADBlocks && (
          <>
            <h3 className="text-md font-semibold mb-3">Turnover / Receipt Summary</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-xs">Total turnover</label>
                <RupeeInput value={String(totalTurnoverAuto)} disabled bold />
              </div>
              <div>
                <label className="text-xs">Cash turnover</label>
                <RupeeInput value={String(cashTurnoverAuto)} disabled bold />
              </div>
              <div>
                <label className="text-xs">Digital turnover</label>
                <RupeeInput value={String(digitalTurnoverAuto)} disabled bold />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Presumptive Rate Application</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Income on digital turnover @ 6%</label>
                <RupeeInput value={String(incomeOnDigital6)} disabled bold />
              </div>
              <div>
                <label className="text-xs">Income on cash turnover @ 8%</label>
                <RupeeInput value={String(incomeOnCash8)} disabled bold />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Higher Income Declaration</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Income higher than presumptive income</label>
                <Select
                  value={higherIncomeYesNo}
                  onChange={setHigherIncomeYesNo}
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                  placeholder="Select Yes/No"
                />
              </div>

              <div>
                <label className="text-xs">Declared presumptive income</label>
                <RupeeInput value={declaredPresumptiveIncome} onChange={setDeclaredPresumptiveIncome} disabled={higherIncomeYesNo !== 'yes'} />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Final Income From Business / Profession</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Final presumptive income</label>
                <RupeeInput value={String(finalPresumptiveIncome)} disabled bold />
              </div>
            </div>
          </>
        )}

        {show44ADABlocks && (
          <>
            <h3 className="text-md font-semibold mb-3">Turnover / Receipt Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Total turnover</label>
                <RupeeInput value={String(totalTurnoverAuto)} disabled bold />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Presumptive Rate Application</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Presumptive income @ 50%</label>
                <RupeeInput value={String(presumptiveIncome44ADA)} disabled bold />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Higher Income Declaration</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Income higher than presumptive income</label>
                <Select
                  value={higherIncomeYesNo}
                  onChange={setHigherIncomeYesNo}
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs">Declared presumptive income</label>
                <RupeeInput value={declaredPresumptiveIncome} onChange={setDeclaredPresumptiveIncome} disabled={higherIncomeYesNo !== 'yes'} />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Final Income From Business / Profession</h3>
            <RupeeInput value={String(finalPresumptiveIncome)} disabled bold />
          </>
        )}

        {show44AEBlocks && (
          <>
            <h3 className="text-md font-semibold mb-3">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Number of goods carriages</label>
                <TextInput value={noOfVehicles} onChange={setNoOfVehicles} placeholder="Enter number of vehicles" />
              </div>

              <div>
                <label className="text-xs">Number of months owned</label>
                <TextInput value={monthsOwned} onChange={setMonthsOwned} placeholder="Enter months" />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Presumptive Income Calculation</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Income per vehicle per month</label>
                <RupeeInput value={String(INCOME_PER_VEHICLE_PER_MONTH)} disabled />
              </div>

              <div>
                <label className="text-xs">Computed presumptive income</label>
                <RupeeInput value={String(computedPresumptiveIncome44AE)} disabled bold />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Higher Income Declaration</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs">Income higher than presumptive income</label>
                <Select
                  value={higherIncomeYesNo}
                  onChange={setHigherIncomeYesNo}
                  options={[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs">Declared presumptive income</label>
                <RupeeInput value={declaredPresumptiveIncome} onChange={setDeclaredPresumptiveIncome} disabled={higherIncomeYesNo !== 'yes'} />
              </div>
            </div>

            <h3 className="text-md font-semibold mb-3">Final Income From Business / Profession</h3>
            <RupeeInput value={String(finalPresumptiveIncome)} disabled bold />
          </>
        )}

        {/* FLOATING FOOTER */}
        <div className="sticky bottom-0 z-10 pt-4 mt-6">
          <div className="flex items-center justify-between">
            {/* LEFT BUTTON */}
            <button disabled={!section} onClick={() => setOpenModal(true)} className={`px-5 py-2 rounded-md text-white ${section ? 'bg-blue-600' : 'bg-gray-300 cursor-not-allowed'}`}>
              Financial Particular of the Business
            </button>

            {/* RIGHT BUTTONS */}
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 bg-white text-black border rounded-md">
                Cancel
              </button>

              <button onClick={() => onSave?.(payload)} className="px-5 py-2 bg-blue-600 text-white rounded-md">
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Popup */}
        {openModal && (
          <FinancialParticularsModal
            sectionOpted={sectionOpted}
            value={financials}
            onClose={() => setOpenModal(false)}
            onSave={(fp) => {
              setFinancials(fp);
              setOpenModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default UnderSec44;
