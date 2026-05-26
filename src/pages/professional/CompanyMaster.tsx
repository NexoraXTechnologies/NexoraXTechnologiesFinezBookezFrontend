import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createCompany,
  getCompany,
  replaceCompany,
  verifyIFSC,
} from "../../redux/slices/professionalSlice/professionalCompanyMaster.slice";

import { toast } from "react-toastify";
import { Edit, RefreshCcw, Save, CheckCircle2 } from "lucide-react";

const CompanyMaster = () => {
  const dispatch = useDispatch();

  const {
    company,
    loading,
    createLoading,
    updateLoading,
    verifyLoading,
    ifscDetails,
  } = useSelector((s) => s.professionalCompanyMaster);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    companyMobile: "",
    companyAddress: "",
    bankName: "",
    bankAccountNumber: "",
    ifscCode: "",
    bankAddress: "",
    logoUri: null,
    signatureUri: null,
  });

  const [errors, setErrors] = useState({});

  // Load company on mount
  useEffect(() => {
    dispatch(getCompany());
  }, [dispatch]);

  // Fill form with company data when loaded
  useEffect(() => {
    if (company) {
      setForm({
        companyName: company.companyName || "",
        companyEmail: company.companyEmail || "",
        companyMobile: company.companyMobile || "",
        companyAddress: company.companyAddress || "",
        bankName: company.bankName || "",
        bankAccountNumber: company.bankAccountNumber || "",
        ifscCode: company.ifscCode || "",
        bankAddress: company.bankAddress || "",
        logoUri: company.logoUri || null,
        signatureUri: company.signatureUri || null,
      });
    }
  }, [company]);

  // Handle file upload (convert to base64 automatically)
  const fileToBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setForm((prev) => ({ ...prev, [type]: base64 }));
  };
  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  const validateImage = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Only PNG, JPG, JPEG, or WEBP images are allowed');
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image size must be less than 2MB');
      return false;
    }

    return true;
  };

  const validateForm = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Company name required';
    if (!form.companyEmail.trim()) e.companyEmail = 'Email required';
    if (!form.companyMobile.trim()) e.companyMobile = 'Mobile required';
    if (!form.ifscCode.trim()) e.ifscCode = 'IFSC required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleIFSCVerify = async () => {
    if (!form.ifscCode.trim()) {
      toast.error('Enter IFSC code first');
      return;
    }

    try {
      const res = await dispatch(verifyIFSC(form.ifscCode)).unwrap();
      setForm((prev) => ({
        ...prev,
        bankName: res.details.BANK || prev.bankName,
        bankAddress: res.details.ADDRESS || prev.bankAddress,
      }));

      toast.success('IFSC Verified');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editing) {
        await dispatch(replaceCompany(form)).unwrap();
        toast.success('Company updated');
      } else {
        await dispatch(createCompany(form)).unwrap();
        toast.success('Company created');
      }

      setShowModal(false);
      dispatch(getCompany());
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(getCompany());
    setRefreshing(false);
    toast.success('Company Detail refreshed');
  };

  return (
    <div className="w-full bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm h-full min-h-0 flex flex-col">
      {/* Header */}
      <div id="company-header" className="flex items-center mb-4">
        {/* <h1 className="text-xl font-semibold">Company Master</h1> */}

        <div className="ml-auto flex gap-2">
          <button id="company-refresh-button" onClick={handleRefresh} className="border px-3 py-2 rounded-md hover:bg-gray-100">
            <RefreshCcw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>

          <button
            id="company-edit-button"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            onClick={() => {
              setEditing(!!company);
              setShowModal(true);
            }}>
            <Edit size={16} className="mr-1" />
            {company ? 'Edit Company' : 'Create Company'}
          </button>
        </div>
      </div>

      {/* Display Company */}
      {!company ? (
        <div className="text-center text-gray-500 mt-10 italic">No company data found.</div>
      ) : (
        <div id="company-details-box" className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">{company.companyName}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <p>
              <strong>Email:</strong> {company.companyEmail}
            </p>
            <p>
              <strong>Mobile:</strong> {company.companyMobile}
            </p>
            <p>
              <strong>Bank:</strong> {company.bankName}
            </p>
            <p>
              <strong>Bank Account:</strong> {company.bankAccountNumber}
            </p>
            <p>
              <strong>IFSC:</strong> {company.ifscCode}
            </p>
            <p>
              <strong>Address:</strong> {company.companyAddress}
            </p>
          </div>

          <div className="flex gap-10 mt-4">
            {company.logoUri && <img id="company-logo" src={company.logoUri} alt="Company Logo" className="w-28 h-28 object-contain border rounded-md" />}
            {company.signatureUri && <img id="company-signature" src={company.signatureUri} alt="Signature" className="w-28 h-28 object-contain border rounded-md" />}
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-[700px] p-6 rounded-lg shadow-lg max-h-[90vh] overflow-scroll relative">
            <button className="absolute top-3 right-3 text-gray-600 text-xl" onClick={() => setShowModal(false)}>
              ×
            </button>

            <h2 className="text-lg font-semibold mb-4">{editing ? 'Update Company' : 'Create Company'}</h2>

            {/* FORM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* Company Name */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Company Name *</label>
                <input
                  type="text"
                  className={`border rounded px-3 py-2 ${errors.companyName ? 'border-red-500' : ''}`}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Enter Company Name"
                />
                {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
              </div>

              {/* Email */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Email *</label>
                <input
                  type="email"
                  className={`border rounded px-3 py-2 ${errors.companyEmail ? 'border-red-500' : ''}`}
                  value={form.companyEmail}
                  onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
                  placeholder="Enter Email"
                />
              </div>

              {/* Mobile */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Mobile *</label>
                <input
                  type="text"
                  className={`border rounded px-3 py-2 ${errors.companyMobile ? 'border-red-500' : ''}`}
                  value={form.companyMobile}
                  onChange={(e) => setForm({ ...form, companyMobile: e.target.value })}
                  maxLength={10}
                  placeholder="Enter Mobile No."
                />
              </div>

              {/* IFSC + verify */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium flex items-center gap-2">IFSC Code *{ifscDetails && <CheckCircle2 size={18} className="text-green-600" />}</label>
                <div className="flex gap-2">
                  <input type="text" value={form.ifscCode} className="border rounded px-3 py-2 flex-1" onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} placeholder="Enter IFSC Code" />
                  <button onClick={handleIFSCVerify} className="border px-3 rounded-md hover:bg-gray-100">
                    {verifyLoading ? <RefreshCcw size={16} className="animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>

              {/* Bank Name */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Bank Name</label>
                <input className="border rounded px-3 py-2" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Enter Bank Name" />
              </div>

              {/* Bank Account */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Bank Account Number</label>
                <input className="border rounded px-3 py-2" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} placeholder="Enter Bank Account Number" maxLength={12} />
              </div>

              {/* Address */}
              <div className="col-span-2 flex flex-col">
                <label className="mb-1 font-medium">Address</label>
                <textarea className="border rounded px-3 py-2" rows={3} value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} placeholder="Enter Address" />
              </div>

              {/* Company Logo */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Company Logo</label>

                <div
                  className="border-2 border-dashed border-gray-300 rounded-md p-3 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition relative"
                  onClick={() => document.getElementById('companyLogoInput').click()}>
                  {form.logoUri ? (
                    <>
                      <img src={form.logoUri} alt="Logo" className="w-24 h-24 object-contain rounded mb-2" />

                      <button
                        className="absolute top-2 right-2 text-red-600 text-sm font-medium hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ ...form, logoUri: null });
                        }}>
                        × Remove
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">Click to upload Logo</p>
                  )}
                </div>

                <input
                  id="companyLogoInput"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!validateImage(file)) {
                      e.target.value = ''; // reset input
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => setForm((prev) => ({ ...prev, logoUri: reader.result }));
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              {/* Signature */}
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Signature</label>

                <div
                  className="border-2 border-dashed border-gray-300 rounded-md p-3 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition relative"
                  onClick={() => document.getElementById('signatureInput').click()}>
                  {form.signatureUri ? (
                    <>
                      <img src={form.signatureUri} alt="Signature" className="w-24 h-24 object-contain rounded mb-2" />

                      <button
                        className="absolute top-2 right-2 text-red-600 text-sm font-medium hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ ...form, signatureUri: null });
                        }}>
                        × Remove
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">Click to upload Signature</p>
                  )}
                </div>

                <input
                  id="signatureInput"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!validateImage(file)) {
                      e.target.value = '';
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => setForm((prev) => ({ ...prev, signatureUri: reader.result }));
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button onClick={handleSubmit} disabled={createLoading || updateLoading} className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 flex items-center">
                <Save size={16} className="mr-2" />
                {editing ? 'Update Company' : 'Create Company'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyMaster;
