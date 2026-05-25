import React from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { formatToDDMMYYYY } from "../../../../components/common/DateFormator";
const ViewTaxpayerModal = ({ onClose }) => {
  const { selectedTaxpayer, loading } = useSelector((s) => s.taxpayer);

  const ACCOUNT_TYPE_MAP = {
    SB: "Saving Account",
    CA: "Current Account",
    CC: "Cash Credit Account",
    OD: "Over Draft Account",
    NRO: "Non Resident Account",
    OTH: "Other",
  };

  if (!selectedTaxpayer) return null;

  const p = selectedTaxpayer?.payload?.PersonalDetails || {};
  const c = selectedTaxpayer?.payload?.ContactAddressDetails || {};
  const b = selectedTaxpayer?.payload?.BankDetails?.array || [];

  const safe = (v) => (v && v !== "" ? v : "–");

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-4">
      <div className="bg-white w-[90vw] max-w-[750px] rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Taxpayer Details</h2>
          <button onClick={onClose}>
            <X size={22} className="text-gray-700 hover:text-red-600" />
          </button>
        </div>

        {/* Body Scroll */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-8">
          {/* ================= PERSONAL DETAILS ================= */}
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-3">
              Personal Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="First Name" value={safe(p.firstName)} />
              <Detail label="Middle Name" value={safe(p.middleName)} />
              <Detail label="Last Name" value={safe(p.lastName)} />
              <Detail label="Gender" value={safe(p.gender)} />
              <Detail label="DOB" value={formatToDDMMYYYY(safe(p.dob))} />
              <Detail label="Aadhar Number" value={safe(p.aadharNumber)} />
              <Detail label="PAN" value={safe(p.pan)} />
              <Detail label="Passport Number" value={safe(p.passportNumber)} />
              <Detail label="Type of Taxpayer" value={safe(p.typeOfTaxPayer)} />
              <Detail
                label="Residential Status"
                value={safe(p.residentialStatus)}
              />
              <Detail label="ITL Password" value={safe(p.itlPassword)} />
            </div>
          </div>

          {/* ================= CONTACT DETAILS ================= */}
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-3">
              Contact & Address
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail label="Mobile Number" value={safe(c.mobileNumber)} />
              <Detail label="Email ID" value={safe(c.emailId)} />
              <Detail label="Landline" value={safe(c.landLine)} />
              <Detail
                label="City"
                value={
                  typeof c.city === "object"
                    ? c.city?.name?.en || "–"
                    : safe(c.city)
                }
              />

              <Detail
                label="State"
                value={
                  typeof c.state === "object"
                    ? c.state?.name?.en || "–"
                    : safe(c.state)
                }
              />
              <Detail label="PIN" value={safe(c.pin)} />
              <Detail label="Address Line 1" value={safe(c.address1)} full />
              <Detail label="Address Line 2" value={safe(c.address2)} full />
              <Detail label="Address Line 3" value={safe(c.address3)} full />
            </div>
          </div>

          {/* ================= BANK DETAILS ================= */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 mb-3">
              Bank Details
            </h3>

            {b.length === 0 ? (
              <p className="text-gray-500 italic">No bank records available.</p>
            ) : (
              b.map((bank, index) => (
                <div
                  key={index}
                  className="border rounded-md p-4 mb-4 bg-purple-50"
                >
                  <h4 className="font-semibold mb-2">
                    Bank {index + 1}{" "}
                    {bank.isDefaultACC === "Yes" && "(Default)"}
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <Detail
                      label="Account Number"
                      value={safe(bank.accountNumber)}
                    />
                    <Detail
                      label="Confirm Account Number"
                      value={safe(bank.cnfaccountNumber)}
                    />
                    <Detail label="Bank Name" value={safe(bank.bankName)} />
                    <Detail
                      label="Bank Address"
                      value={safe(bank.bankAddress)}
                    />
                    <Detail label="IFSC Code" value={safe(bank.ifscCode)} />
                    <Detail
                      label="Account Type"
                      value={
                        ACCOUNT_TYPE_MAP[bank.accountType] ||
                        safe(bank.accountType)
                      }
                    />

                    <Detail
                      label="Account Holder Type"
                      value={safe(bank.accountHolderType)}
                    />
                    <Detail label="Nominee" value={safe(bank.nominate)} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple reusable row
const Detail = ({ label, value, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <p className="text-gray-600 text-xs">{label}</p>
    <p className="font-medium text-gray-900">{value}</p>
  </div>
);

export default ViewTaxpayerModal;
