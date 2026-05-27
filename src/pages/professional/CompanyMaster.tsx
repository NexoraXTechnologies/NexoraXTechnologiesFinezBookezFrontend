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
import { SelectInput, TextArea, TextInput } from "../../components/inputs";
import Modal from "../../components/modal";
import { getCitiesByState, getStates } from "../../redux/slices/professionalSlice/stateCitySlice";

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

  const {
    states,
    cities,
    loading: stateCityLoading,
  } = useSelector((s: any) => s.stateCity);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [verifiedIfscCode, setVerifiedIfscCode] = useState("");


  console.log("company", company)
  useEffect(() => {
    dispatch(getStates(""));
  }, [dispatch]);

  const hasCompany =
    company &&
    !Array.isArray(company) &&
    Object.keys(company).length > 0;

  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    companyMobile: "",
    companyAddress: "",
    bankName: "",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",
    state: "",
    city: "",
    gstNumber: "",
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
    if (hasCompany) {
      setForm({
        companyName: company.companyName || "",
        companyEmail: company.companyEmail || "",
        companyMobile: company.companyMobile || "",
        upiId: company.upiId || "",
        gstNumber: company.gstNumber || "",
        companyAddress: company.companyAddress || "",
        state: company.state || "",
        city: company.city || "",
        bankName: company.bankName || "",
        bankAccountNumber: company.bankAccountNumber || "",
        ifscCode: company.ifscCode || "",
        bankAddress: company.bankAddress || "",
        logoUri: company.logoUri || null,
        signatureUri: company.signatureUri || null,
      });

      // if (company.state) {
      //   dispatch(
      //     getCitiesByState({
      //       stateCode: company.state,
      //       searchText: "",
      //     })
      //   );
      // }
    }
  }, [company, hasCompany, dispatch]);

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

  // const validateForm = () => {
  //   const e = {};
  //   if (!form.companyName.trim()) e.companyName = 'Company name required';
  //   if (!form.companyEmail.trim()) e.companyEmail = 'Email required';
  //   if (!form.companyMobile.trim()) e.companyMobile = 'Mobile required';
  //   if (!form.ifscCode.trim()) e.ifscCode = 'IFSC required';
  //   setErrors(e);
  //   return Object.keys(e).length === 0;
  // };

  const validateForm = () => {
    const e: any = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!form.upiId?.trim()) {
      e.upiId = "UPI ID is required";
    } else if (!upiRegex.test(form.upiId)) {
      e.upiId = "Enter valid UPI ID";
    }

    if (!form.gstNumber?.trim()) {
      e.gstNumber = "GST number is required";
    } else if (!gstRegex.test(form.gstNumber)) {
      e.gstNumber = "Enter valid GST number";
    }

    if (!form.companyName?.trim()) {
      e.companyName = "Company name is required";
    }

    if (!form.companyEmail?.trim()) {
      e.companyEmail = "Email is required";
    } else if (!emailRegex.test(form.companyEmail)) {
      e.companyEmail = "Enter valid email address";
    }

    if (!form.companyMobile?.trim()) {
      e.companyMobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.companyMobile)) {
      e.companyMobile = "Enter valid 10 digit mobile number";
    }

    if (!form.ifscCode?.trim()) {
      e.ifscCode = "IFSC code is required";
    } else if (!ifscRegex.test(form.ifscCode)) {
      e.ifscCode = "Enter valid IFSC code";
    }

    if (!form.bankName?.trim()) {
      e.bankName = "Bank name is required";
    }

    if (!form.bankAccountNumber?.trim()) {
      e.bankAccountNumber = "Bank account number is required";
    } else if (!/^\d{9,18}$/.test(form.bankAccountNumber)) {
      e.bankAccountNumber = "Account number must be 9 to 18 digits";
    }

    if (!form.companyAddress?.trim()) {
      e.companyAddress = "Company address is required";
    }

    // if (!form.logoUri) {
    //   e.logoUri = "Company logo is required";
    // }

    // if (!form.signatureUri) {
    //   e.signatureUri = "Signature is required";
    // }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // const handleIFSCVerify = async () => {
  //   if (!form.ifscCode.trim()) {
  //     toast.error('Enter IFSC code first');
  //     return;
  //   }

  //   try {
  //     const res = await dispatch(verifyIFSC(form.ifscCode)).unwrap();
  //     setForm((prev) => ({
  //       ...prev,
  //       bankName: res.details.BANK || prev.bankName,
  //       bankAddress: res.details.ADDRESS || prev.bankAddress,
  //     }));

  //     toast.success('IFSC Verified');
  //   } catch (err) {
  //     toast.error(err.message);
  //   }
  // };



  const handleIFSCVerify = async () => {
    const ifsc = form.ifscCode.trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    // reset verified status before checking
    setVerifiedIfscCode("");

    if (!ifsc) {
      setErrors((prev: any) => ({
        ...prev,
        ifscCode: "IFSC code is required",
      }));
      toast.error("Enter IFSC code first");
      return;
    }

    if (!ifscRegex.test(ifsc)) {
      setErrors((prev: any) => ({
        ...prev,
        ifscCode: "Enter valid IFSC code",
      }));
      toast.error("Enter valid IFSC code");
      return;
    }

    try {
      const res = await dispatch(verifyIFSC(ifsc)).unwrap();

      setForm((prev) => ({
        ...prev,
        ifscCode: ifsc,
        bankName: res?.details?.BANK || prev.bankName,
        bankAddress: res?.details?.ADDRESS || prev.bankAddress,
      }));

      setErrors((prev: any) => ({
        ...prev,
        ifscCode: "",
        bankName: "",
      }));

      // this makes check icon show in place of Verify button
      setVerifiedIfscCode(ifsc);

      toast.success("IFSC Verified");
    } catch (err: any) {
      setVerifiedIfscCode("");

      setErrors((prev: any) => ({
        ...prev,
        ifscCode: err?.message || "Invalid IFSC code",
      }));

      toast.error(err?.message || "Invalid IFSC code");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (hasCompany) {
        await dispatch(replaceCompany(form)).unwrap();
        toast.success("Company updated");
      } else {
        await dispatch(createCompany(form)).unwrap();
        toast.success("Company created");
      }

      setShowModal(false);
      setEditing(false);
      dispatch(getCompany());
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    }
  };

  // const handleSubmit = async () => {
  //   if (!validateForm()) return;

  //   try {
  //     if (editing) {
  //       await dispatch(replaceCompany(form)).unwrap();
  //       toast.success('Company updated');
  //     } else {
  //       await dispatch(createCompany(form)).unwrap();
  //       toast.success('Company created');
  //     }

  //     setShowModal(false);
  //     dispatch(getCompany());
  //   } catch (err) {
  //     toast.error(err.message);
  //   }
  // };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(getCompany());
    setRefreshing(false);
    toast.success('Company Detail refreshed');
  };


  const updateField = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev: any) => ({
      ...prev,
      [key]: "",
    }));
  };

  const isIfscVerified =
    verifiedIfscCode === form.ifscCode?.trim().toUpperCase() && !errors.ifscCode;


  const getDisplayName = (name: any) => {
    if (!name) return "";

    if (typeof name === "string") return name;

    if (typeof name === "object") {
      return (
        name.en ||
        name.mr ||
        name.hi ||
        name.gu ||
        name.ta ||
        name.te ||
        name.kn ||
        name.ml ||
        name.pa ||
        ""
      );
    }

    return String(name);
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
            // onClick={() => {
            //   setEditing(!!company);
            //   setShowModal(true);
            // }}>
            onClick={() => {
              setEditing(Boolean(hasCompany));
              setShowModal(true);
            }}>
            <Edit size={16} className="mr-1" />
            {hasCompany ? 'Edit Company' : 'Create Company'}
          </button>
        </div>
      </div>

      {/* Display Company */}
      {
        !hasCompany ? (
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
        )
      }



      <Modal
        {...{
          show: showModal,
          setShow: setShowModal,
          handleSubmit,
          state: editing,
          title: "Company",
          gridCols: 3,
          maxWidth: "4xl",
          bodyClassName: "p-5 gap-3",
          body: (
            <>
              <TextInput
                label="Company Name"
                mandatory={true}
                value={form.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                placeholder="Enter company name"
                error={errors.companyName}
              />

              <TextInput
                label="Email"
                mandatory={true}
                value={form.companyEmail}
                onChange={(e) => updateField("companyEmail", e.target.value)}
                placeholder="Enter email address"
                error={errors.companyEmail}
                type="email"
              />

              <TextInput
                label="Mobile"
                mandatory={true}
                value={form.companyMobile}
                onChange={(e) =>
                  updateField(
                    "companyMobile",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="Enter mobile number"
                error={errors.companyMobile}
                type="tel"
              />
              <TextInput
                label="UPI ID"
                mandatory={true}
                value={form.upiId}
                onChange={(e) =>
                  updateField(
                    "upiId",
                    e.target.value.toLowerCase().replace(/\s/g, "").slice(0, 50)
                  )
                }
                placeholder="Enter UPI ID"
                error={errors.upiId}
                type="text"
              />


              <TextInput
                label="GST Number"
                mandatory={true}
                value={form.gstNumber}
                onChange={(e) =>
                  updateField(
                    "gstNumber",
                    e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 15)
                  )
                }
                placeholder="Enter GST number"
                error={errors.gstNumber}
                type="text"
              />



              <div className="relative [&_input]:pr-24">
                <TextInput
                  label="IFSC Code"
                  mandatory={true}
                  value={form.ifscCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().slice(0, 11);
                    updateField("ifscCode", value);
                    setVerifiedIfscCode("");
                  }}
                  placeholder="Enter IFSC code"
                  error={errors.ifscCode}
                  type="text"
                />

                <div className="absolute right-2 top-[31px]">
                  {isIfscVerified ? (
                    <div className="h-[20px] w-[34px] text-green-600 rounded-md flex items-center justify-center">
                      <CheckCircle2 size={21} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleIFSCVerify}
                      disabled={verifyLoading}
                      className="h-[20px] px-3 text-xs border rounded-md bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {verifyLoading ? (
                        <RefreshCcw size={14} className="animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </button>
                  )}
                </div>
              </div>

              <TextInput
                label="Bank Name"
                mandatory={true}
                value={form.bankName}
                onChange={(e) => updateField("bankName", e.target.value)}
                placeholder="Enter bank name"
                error={errors.bankName}
                type="text"
              />

              <TextInput
                label="Bank Account Number"
                mandatory={true}
                value={form.bankAccountNumber}
                onChange={(e) =>
                  updateField(
                    "bankAccountNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 18)
                  )
                }
                placeholder="Enter bank account number"
                error={errors.bankAccountNumber}
                type="text"
              />


              <SelectInput
                label="State"
                mandatory={true}
                value={form.state}
                onChange={(e) => {
                  const selectedStateCode = e?.target?.value || "";

                  setForm((prev) => ({
                    ...prev,
                    state: selectedStateCode,
                    city: "",
                  }));

                  setErrors((prev: any) => ({
                    ...prev,
                    state: "",
                    city: "",
                  }));

                  if (selectedStateCode) {
                    dispatch(
                      getCitiesByState({
                        stateCode: selectedStateCode,
                        searchText: "",
                      })
                    );
                  }
                }}
                placeholder="Select state"
                error={errors.state}
                options={[
                  { value: "", label: "Select state" },
                  ...(states?.map((item: any) => ({
                    value: item.isoCode || item.stateCode || item.code || item._id,
                    label: getDisplayName(item.name || item.stateName) || item.isoCode,
                  })) || []),
                ]}
              />



              <SelectInput
                label="City"
                mandatory={true}
                value={form.city}
                onChange={(e) => updateField("city", e?.target?.value || "")}
                placeholder="Select city"
                error={errors.city}
                options={[
                  { value: "", label: "Select city" },
                  ...(cities?.map((item: any) => ({
                    value: item.cityName || item.name || item._id,
                    label: getDisplayName(item.cityName || item.name),
                  })) || []),
                ]}
              />

              <TextArea
                label="Address"
                mandatory={true}
                value={form.companyAddress}
                onChange={(e) => updateField("companyAddress", e.target.value)}
                placeholder="Enter company address"
                error={errors.companyAddress}
              />

              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Logo */}
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-medium">
                    Company Logo <span className="text-red-500">*</span>
                  </label>

                  <div
                    className={`border-2 border-dashed rounded-md p-3 flex items-center justify-center cursor-pointer hover:border-blue-400 transition relative h-[110px] w-full ${errors.logoUri ? "border-red-500" : "border-gray-300"
                      }`}
                    onClick={() => document.getElementById("companyLogoInput")?.click()}
                  >
                    {form.logoUri ? (
                      <>
                        <img
                          src={form.logoUri}
                          alt="Company Logo"
                          className="max-w-[180px] h-24 object-contain rounded"
                        />

                        <button
                          type="button"
                          className="absolute top-2 right-3 text-red-600 text-sm font-medium hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateField("logoUri", null);
                          }}
                        >
                          × Remove
                        </button>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">Click to upload company logo</p>
                    )}
                  </div>

                  {errors.logoUri && (
                    <p className="text-xs text-red-500">{errors.logoUri}</p>
                  )}

                  <input
                    id="companyLogoInput"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!validateImage(file)) {
                        e.target.value = "";
                        return;
                      }

                      const base64 = await fileToBase64(file);
                      updateField("logoUri", base64);
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Signature */}
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-medium">
                    Signature <span className="text-red-500">*</span>
                  </label>

                  <div
                    className={`border-2 border-dashed rounded-md p-3 flex items-center justify-center cursor-pointer hover:border-blue-400 transition relative h-[110px] w-full ${errors.signatureUri ? "border-red-500" : "border-gray-300"
                      }`}
                    onClick={() => document.getElementById("signatureInput")?.click()}
                  >
                    {form.signatureUri ? (
                      <>
                        <img
                          src={form.signatureUri}
                          alt="Signature"
                          className="max-w-[180px] h-24 object-contain rounded"
                        />

                        <button
                          type="button"
                          className="absolute top-2 right-3 text-red-600 text-sm font-medium hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateField("signatureUri", null);
                          }}
                        >
                          × Remove
                        </button>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">Click to upload signature</p>
                    )}
                  </div>

                  {errors.signatureUri && (
                    <p className="text-xs text-red-500">{errors.signatureUri}</p>
                  )}

                  <input
                    id="signatureInput"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!validateImage(file)) {
                        e.target.value = "";
                        return;
                      }

                      const base64 = await fileToBase64(file);
                      updateField("signatureUri", base64);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </>
          ),
        }}
      />


    </div >
  );
};

export default CompanyMaster;
