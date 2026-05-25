import React, { useState, useMemo, useEffect } from "react";
import { X, Home, MapPin, Hash, Building2, Landmark, IndianRupee, Calendar, Banknote } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import ConfirmTooltip from '../../../../components/common/ConfirmTooltip';
import { formatIndianNumber, indianInputToRaw } from '../../../../components/common/DateFormator';

/* ------------------ COMMON INPUT ------------------ */

const inputClass = 'border rounded-md pl-9 pr-3 py-2 w-full text-right appearance-none';

const TextInput = ({ icon: Icon, value, onChange, placeholder }) => (
  <div className="relative">
    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
    <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="border rounded-md pl-9 pr-3 py-2 w-full" />
  </div>
);

const RupeeInput = ({ value, onChange, disabled = false, bold = false }) => {
  const displayValue = formatIndianNumber(value);

  return (
    <div className="relative">
      <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        disabled={disabled}
        placeholder="0"
        onChange={(e) => onChange?.(indianInputToRaw(e.target.value))}
        className={`${inputClass} ${disabled ? 'bg-gray-100' : ''} ${bold ? 'font-semibold' : ''}`}
      />
    </div>
  );
};

/* ------------------ MAIN COMPONENT ------------------ */

const HouseProperty = ({ value, taxpayerAddress, taxRegime = 'NEW', onClose, onSave }) => {
  const [propertyType, setPropertyType] = useState(value?.propertyType ?? '');
  const [copyAddress, setCopyAddress] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPropertyType, setPendingPropertyType] = useState(null);
  const getCenterPosition = () => ({
    x: window.innerWidth / 2 - 88, // half of tooltip width (≈176px)
    y: window.innerHeight / 2 - 60,
  });
  // ✅ User confirms switching to Self Occupied
  const handleConfirmPropertyType = () => {
    // clear rental + loan fields (RN behavior)
    setRent({ received: '', municipalTax: '' });

    setLoan((prev) => ({
      ...prev,
      totalLoan: '',
      outstanding: '',
      interest: '',
      arrears: '',
    }));

    setPropertyType(pendingPropertyType); // apply 'S'
    setPendingPropertyType(null);
    setConfirmOpen(false);
  };

  // ❌ User cancels
  const handleCancelPropertyType = () => {
    setPendingPropertyType(null);
    setConfirmOpen(false);
  };

  const [address, setAddress] = useState(
    value?.address ?? {
      houseName: '',
      address: '',
      pincode: '',
      state: '',
      city: '',
    }
  );

  const [rent, setRent] = useState(
    value?.rent ?? {
      received: '',
      municipalTax: '',
    }
  );

  const [loan, setLoan] = useState(
    value?.loan ?? {
      loanFrom: '',
      bank: '',
      accountNo: '',
      sanctionDate: '',
      totalLoan: '',
      outstanding: '',
      interest: '',
      arrears: '',
    }
  );

  useEffect(() => {
    if (!copyAddress) return;

    const cityName = taxpayerAddress?.city?.name?.en || taxpayerAddress?.city?.name || taxpayerAddress?.city || '';

    const stateName = taxpayerAddress?.state?.name?.en || taxpayerAddress?.state?.name || taxpayerAddress?.state || '';

    // House / Flat Name → address1 + address2
    const houseNameText = [taxpayerAddress?.address1, taxpayerAddress?.address2].filter(Boolean).join(', ');

    // Address → address3 + address4
    const addressText = [taxpayerAddress?.address3, taxpayerAddress?.address4].filter(Boolean).join(', ');

    setAddress((prev) => ({
      ...prev,
      houseName: houseNameText || prev.houseName,
      address: addressText || prev.address,
      pincode: taxpayerAddress?.pin || prev.pincode,
      city: cityName || prev.city,
      state: stateName || prev.state,
    }));
  }, [copyAddress, taxpayerAddress]);

  /* ------------------ CALCULATIONS ------------------ */

  const toNumber = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;

  const annualValue = toNumber(rent.received) - toNumber(rent.municipalTax); // ✅ diff
  const thirtyPercentAnnualValue = annualValue * 0.3; // ✅ 30%

  const arrearsAfter30 = toNumber(loan.arrears) * 0.7; // ✅ RN: aiers * 0.7

  const totalIncomeFromHouseProperty = propertyType === 'S' ? arrearsAfter30 : annualValue - thirtyPercentAnnualValue - toNumber(loan.interest) - arrearsAfter30;

  const payload = {
    propertyType,

    address: {
      houseName: address?.houseName,
      address: address.address,
      pincode: address.pincode,
      state: address.state,
      city: address.city,
      country: 'India',
    },

    rent: {
      received: toNumber(rent.received),
      municipalTax: toNumber(rent.municipalTax),
      annualValue,
      thirtyPercentAnnualValue, // ✅ RN naming
    },

    loan: {
      loanFrom: loan.loanFrom,
      bank: loan.bank,
      accountNo: loan.accountNo,
      sanctionDate: loan.sanctionDate,
      totalLoan: toNumber(loan.totalLoan),
      outstanding: toNumber(loan.outstanding),
      interest: toNumber(loan.interest),
      arrears: toNumber(loan.arrears),
      arrearsAfter30,
    },

    totalIncomeFromHouseProperty,
  };
  // ✅ Hardcoded options to match React Native (S/L/D)
  const PROPERTY_OPTIONS =
    taxRegime === 'OLD'
      ? [
          { label: 'Self Occupied', value: 'S' },
          { label: 'Let out', value: 'L' },
          { label: 'Deemed Layout', value: 'D' },
        ]
      : [
          { label: 'Let out', value: 'L' },
          { label: 'Deemed Layout', value: 'D' },
        ];
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-3">
      <div className="bg-white w-[82%] max-w-[1100px] rounded-xl shadow-xl max-h-[88vh] overflow-y-auto p-5">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">Income From House Property</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* PROPERTY TYPE */}
        <div className="mb-6">
          <label className="text-xs mb-1 block">Type of House Property</label>
          <div className="relative">
            <Home size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <select
              value={propertyType}
              onChange={(e) => {
                const v = e.target.value;

                // ✅ RN behavior: confirm before switching to Self Occupied
                if (v === 'S' && propertyType !== 'S') {
                  setPendingPropertyType(v); // store intended value
                  setConfirmOpen(true); // open confirmation tooltip
                  return;
                }

                // normal change (L / D)
                setPropertyType(v);
              }}
              className="border rounded-md pl-9 pr-3 py-2 w-full">
              <option value="">Select Type</option>

              {PROPERTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ADDRESS */}
        <h3 className="text-md font-semibold mb-3">Address</h3>

        <div className="flex justify-end mb-2">
          <button type="button" onClick={() => setCopyAddress(!copyAddress)} className="text-sm text-blue-600 hover:underline">
            Copy address from taxpayer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs mb-1 block">House / Flat Name</label>
            <TextInput icon={Building2} placeholder="Name of House / Flat" value={address.houseName} onChange={(v) => setAddress({ ...address, houseName: v })} />
          </div>

          <div>
            <label className="text-xs mb-1 block">Address</label>
            <TextInput icon={MapPin} placeholder="Address" value={address.address} onChange={(v) => setAddress({ ...address, address: v })} />
          </div>

          <div>
            <label className="text-xs mb-1 block">Pincode</label>
            <TextInput icon={Hash} placeholder="Pincode" value={address.pincode} onChange={(v) => setAddress({ ...address, pincode: v })} />
          </div>

          <div>
            <label className="text-xs mb-1 block">State</label>
            <TextInput icon={Landmark} placeholder="State" value={address.state} onChange={(v) => setAddress({ ...address, state: v })} />
          </div>

          <div>
            <label className="text-xs mb-1 block">City</label>
            <TextInput icon={Landmark} placeholder="City" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} />
          </div>

          <div>
            <label className="text-xs mb-1 block">Country</label>
            <input disabled value="India" className="border rounded-md px-3 py-2 bg-gray-100 w-full" />
          </div>
        </div>

        {/* RENTAL INCOME */}
        {propertyType !== 'S' && (
          <>
            <h3 className="text-md font-semibold mb-3">Rental Income</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs mb-1 block">Total Rental Received</label>
                <RupeeInput value={rent.received} onChange={(v) => setRent({ ...rent, received: v })} />
              </div>

              <div>
                <label className="text-xs mb-1 block">Municipal Tax Paid</label>
                <RupeeInput value={rent.municipalTax} onChange={(v) => setRent({ ...rent, municipalTax: v })} />
              </div>

              <div>
                <label className="text-xs mb-1 block">Annual Value</label>
                <RupeeInput value={String(annualValue)} disabled bold />
              </div>

              <div>
                <label className="text-xs mb-1 block">30% of Annual Value</label>
                <RupeeInput value={String(thirtyPercentAnnualValue)} disabled />
              </div>
            </div>
          </>
        )}

        {/* HOME LOAN */}
        {propertyType !== 'S' && (
          <>
            <h3 className="text-md font-semibold mb-3">Home Loan Details</h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-xs mb-1 block">Loan taken from</label>
                <div className="relative">
                  <Banknote size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select value={loan.loanFrom || ''} onChange={(e) => setLoan({ ...loan, loanFrom: e.target.value })} className="border rounded-md pl-9 pr-3 py-2 w-full">
                    <option value="">Select</option>
                    <option value="bank">Bank</option>
                    <option value="institution">Institution</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block">Name of Bank / Institution</label>
                <TextInput icon={Building2} placeholder="Enter name" value={loan.bank} onChange={(v) => setLoan({ ...loan, bank: v })} />
              </div>
              <div>
                <label className="text-xs mb-1 block">Loan Account Number</label>
                <TextInput icon={Hash} placeholder="Loan Account Number" value={loan.accountNo} onChange={(v) => setLoan({ ...loan, accountNo: v })} />
              </div>

              <div>
                <label className="text-xs mb-1 block">Date of Sanction</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="date" className="border rounded-md pl-9 pr-3 py-2 w-full" value={loan.sanctionDate} onChange={(e) => setLoan({ ...loan, sanctionDate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs mb-1 block">Total Loan Amount</label>
                <RupeeInput value={loan.totalLoan} onChange={(v) => setLoan({ ...loan, totalLoan: v })} />
              </div>

              <div>
                <label className="text-xs mb-1 block">Loan Outstanding</label>
                <RupeeInput value={loan.outstanding} onChange={(v) => setLoan({ ...loan, outstanding: v })} />
              </div>

              <div>
                <label className="text-xs mb-1 block">Interest Amount</label>
                <RupeeInput value={loan.interest} onChange={(v) => setLoan({ ...loan, interest: v })} />
              </div>

              <div>
                <label className="text-xs mb-1 block">Arrears Received (30% deduction)</label>
                <RupeeInput value={loan.arrears} onChange={(v) => setLoan({ ...loan, arrears: v })} />
              </div>

              <div>
                <label className="text-xs mb-1 block">Total Income from House Property</label>
                <RupeeInput value={String(totalIncomeFromHouseProperty)} disabled bold />
              </div>
            </div>
          </>
        )}
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
      {/* ✅ Confirm Tooltip (centered) */}
      {confirmOpen && (
        <ConfirmTooltip
          {...getCenterPosition()}
          message="Changing property type will clear all entered house property details. Do you want to continue?"
          confirmText="Yes"
          cancelText="Cancel"
          onConfirm={handleConfirmPropertyType}
          onCancel={handleCancelPropertyType}
        />
      )}
    </div>
  );
};

export default HouseProperty;
