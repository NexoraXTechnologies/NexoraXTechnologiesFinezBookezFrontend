import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createCompany,
  getCompany,
  replaceCompany,
  verifyIFSC,

} from "../../redux/slices/professionalSlice/professionalCompanyMaster.slice";

import { toast } from "react-toastify";
import { Edit, RefreshCcw, CheckCircle2, Trash2 } from "lucide-react";
import { SelectInput, TextArea, TextInput } from "../../components/inputs";
import Modal from "../../components/modal";
import {
  getCitiesByState,
  getStates,
} from "../../redux/slices/professionalSlice/stateCitySlice";
import Badge from "../../components/badge";
import { DataCreateButton, DataREfreshButton } from "../../components/buttons";
import DataTable from "../../components/DataTable";
import SearchInput from "../../components/searchInput";
import ConfirmTooltip from "../../components/common/ConfirmTooltip";
import Pagination from "../../components/pagination";

const initialForm = {
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
};

const CompanyMaster = () => {
  const dispatch = useDispatch();

  const {
    company,
    loading,
    createLoading,
    updateLoading,
    verifyLoading,
    pagination,
  } = useSelector((s: any) => s.professionalCompanyMaster);

  const {
    states,
    cities,
    loading: stateCityLoading,
  } = useSelector((s: any) => s.stateCity);

  const [localOffset, setLocalOffset] = useState(0);
  const [localLimit, setLocalLimit] = useState(10);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [form, setForm] = useState<any>(initialForm);
  const [errors, setErrors] = useState<any>({});

  const [pendingCity, setPendingCity] = useState("");
  const [verifiedIfscCode, setVerifiedIfscCode] = useState("");

  const [confirmTooltip, setConfirmTooltip] = useState<any>({
    show: false,
    x: null,
    y: null,
    companyCode: null,
  });

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

  const companyTableData = Array.isArray(company)
    ? company
    : company?.data && Array.isArray(company.data)
      ? company.data
      : company?.docs && Array.isArray(company.docs)
        ? company.docs
        : company?.companies && Array.isArray(company.companies)
          ? company.companies
          : company
            ? [company]
            : [];

  const fetchCompanies = () => {
    dispatch(
      getCompany({
        offset: localOffset,
        limit: localLimit,
        search: debouncedSearch,
      }) as any
    );
  };

  useEffect(() => {
    dispatch(getStates("") as any);
  }, [dispatch]);

  useEffect(() => {
    fetchCompanies();
  }, [localOffset, localLimit, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setLocalOffset(0);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const findSelectedState = () => {
    return states?.find((item: any) => {
      const stateCode = item.isoCode || item.stateCode || item.code || "";
      return stateCode === form.state;
    });
  };

  const findSelectedCity = () => {
    return cities?.find((item: any) => {
      const cityName = getDisplayName(item.name || item.cityName);
      return cityName === form.city;
    });
  };

  const hydrateForm = (data: any) => {
    if (!data) return;

    const stateCode =
      typeof data.state === "object"
        ? data.state?.isoCode || data.state?.stateCode || data.state?.code || ""
        : data.state || "";

    const cityName =
      typeof data.city === "object"
        ? getDisplayName(data.city?.name || data.city?.cityName)
        : data.city || "";

    setForm({
      companyName: data.companyName || "",
      companyEmail: data.companyEmail || "",
      companyMobile: data.companyMobile || "",
      companyAddress: data.companyAddress || "",
      bankName: data.bankName || "",
      bankAccountNumber: data.bankAccountNumber || "",
      ifscCode: data.ifscCode || "",
      upiId: data.upiId || "",
      state: stateCode,
      city: "",
      gstNumber: data.gstNumber || "",
      bankAddress: data.bankAddress || "",
      logoUri: data.logoUri || null,
      signatureUri: data.signatureUri || null,
    });

    setVerifiedIfscCode(data.ifscCode || "");
    setPendingCity(cityName);

    if (stateCode) {
      dispatch(
        getCitiesByState({
          stateCode,
          searchText: "",
        }) as any
      );
    }
  };

  useEffect(() => {
    if (!pendingCity || !cities?.length) return;

    const matchedCity = cities.find((item: any) => {
      const cityName = getDisplayName(item.name || item.cityName);
      return cityName === pendingCity;
    });

    if (matchedCity) {
      setForm((prev: any) => ({
        ...prev,
        city: pendingCity,
      }));

      setPendingCity("");
    }
  }, [cities, pendingCity]);

  const openAddModal = () => {
    setEditingCompany(null);
    setForm(initialForm);
    setErrors({});
    setVerifiedIfscCode("");
    setPendingCity("");
    setShowModal(true);
  };

  const openEditModal = (companyRow: any) => {
    setEditingCompany(companyRow);
    setErrors({});
    hydrateForm(companyRow);
    setShowModal(true);
  };

  const updateField = (key: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev: any) => ({
      ...prev,
      [key]: "",
    }));
  };

  const fileToBase64 = (file: File) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const ALLOWED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  const validateImage = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, JPEG, or WEBP images are allowed");
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size must be less than 2MB");
      return false;
    }

    return true;
  };

  const validateForm = () => {
    const e: any = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

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

    if (!form.state) {
      e.state = "State is required";
    }

    if (!form.city) {
      e.city = "City is required";
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

  const handleIFSCVerify = async () => {
    const ifsc = form.ifscCode.trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

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
      const res = await dispatch(verifyIFSC(ifsc) as any).unwrap();

      setForm((prev: any) => ({
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

    const selectedState = findSelectedState();
    const selectedCity = findSelectedCity();

    const payload = {
      ...form,
      ifscCode: form.ifscCode?.toUpperCase(),
      gstNumber: form.gstNumber?.toUpperCase(),
      upiId: form.upiId?.toLowerCase(),
      state: selectedState || form.state,
      city: selectedCity || form.city,
    };

    try {
      if (editingCompany) {
        const companyCode =
          editingCompany.companyCode ||
          editingCompany.companyPublicId ||
          editingCompany.code ||
          editingCompany._id;

        await dispatch(
          replaceCompany({
            companyCode,
            data: payload,
          }) as any
        ).unwrap();

        toast.success("Company updated successfully");
      } else {
        await dispatch(createCompany(payload) as any).unwrap();
        toast.success("Company created");
      }

      setShowModal(false);
      setEditingCompany(null);
      setForm(initialForm);
      setErrors({});
      setVerifiedIfscCode("");
      setPendingCity("");
      fetchCompanies();
    } catch (err: any) {
      toast.error(err?.message || "Operation failed");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await dispatch(
        getCompany({
          offset: 0,
          limit: localLimit,
          search: debouncedSearch,
        }) as any
      ).unwrap();

      setLocalOffset(0);
      toast.success("Company list refreshed");
    } catch (err: any) {
      toast.error(err?.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!confirmTooltip.companyCode) {
        toast.error("Company code not found");
        return;
      }

      await dispatch(deleteCompany(confirmTooltip.companyCode) as any).unwrap();

      toast.success("Company deleted");
      fetchCompanies();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setConfirmTooltip({
        show: false,
        x: null,
        y: null,
        companyCode: null,
      });
    }
  };

  const isIfscVerified =
    verifiedIfscCode === form.ifscCode?.trim().toUpperCase() &&
    !errors.ifscCode;

  const companyColumns = [
    {
      key: "companyName",
      title: "Company Name",
      render: (row: any) => (
        <span className="font-semibold text-gray-900">
          {row.companyName || "-"}
        </span>
      ),
    },
    {
      key: "companyEmail",
      title: "Email",
      render: (row: any) => row.companyEmail || "-",
    },
    {
      key: "companyMobile",
      title: "Mobile",
      render: (row: any) => row.companyMobile || "-",
    },
    {
      key: "gstNumber",
      title: "GST Number",
      render: (row: any) => row.gstNumber || "-",
    },
    {
      key: "upiId",
      title: "UPI ID",
      render: (row: any) => row.upiId || "-",
    },
    {
      key: "ifscCode",
      title: "IFSC",
      render: (row: any) => row.ifscCode || "-",
    },
    {
      key: "bankName",
      title: "Bank",
      render: (row: any) => row.bankName || "-",
    },
    {
      key: "state",
      title: "State",
      render: (row: any) =>
        getDisplayName(row?.state?.name || row?.state?.stateName || row?.state) ||
        "-",
    },
    {
      key: "city",
      title: "City",
      render: (row: any) =>
        getDisplayName(row?.city?.name || row?.city?.cityName || row?.city) ||
        "-",
    },
  ];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-[100%]">
      {/* ================= HEADER ================= */}
      <div id="company-header" className="flex flex-wrap items-center gap-2 mb-3">
        <div id="company-summary" className="flex items-start gap-3">
          <Badge
            {...{
              count: pagination?.totalDocs ?? companyTableData.length ?? 0,
              text: "Total Companies:",
            }}
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchInput {...{ search, setSearch }} />

          <DataREfreshButton
            {...{
              callBackFn: handleRefresh,
              loading: refreshing,
            }}
          />

          <DataCreateButton
            {...{
              callBackFn: openAddModal,
              text: "Add Company",
            }}
          />
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <DataTable
        columns={companyColumns}
        data={companyTableData}
        loading={loading}
        emptyMessage="No company data found"
        actions={(companyRow: any) => {
          const companyCode =
            companyRow.companyCode ||
            companyRow.companyPublicId ||
            companyRow.code ||
            companyRow._id;

          return (
            <div className="flex items-center gap-2">
              {/* EDIT */}
              <button
                id="company-edit-button"
                onClick={() => openEditModal(companyRow)}
                className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer"
              >
                <Edit size={16} />
              </button>

              {/* DELETE */}
              <button
                id="company-delete-button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();

                  let x = rect.left - 150;
                  if (x < 10) x = 10;

                  const y = rect.top + window.scrollY - 5;

                  setConfirmTooltip({
                    show: true,
                    x,
                    y,
                    companyCode,
                  });
                }}
                className="p-2 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        }}
      />

      {/* ================= PAGINATION ================= */}
      {/* {pagination?.totalDocs > 0 && (
        <Pagination
          {...{
            localLimit,
            selectCb: (e: any) => {
              setLocalLimit(Number(e.target.value));
              setLocalOffset(0);
            },
            preDisabled: !pagination?.hasPrevPage,
            nextDisabled: !pagination?.hasNextPage,
            setLocalOffset,
            pagination,
          }}
        />
      )} */}

      {/* ================= DELETE TOOLTIP ================= */}
      {confirmTooltip.show && (
        <ConfirmTooltip
          x={confirmTooltip.x}
          y={confirmTooltip.y}
          message="Are you sure you want to delete this company?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() =>
            setConfirmTooltip({
              show: false,
              x: null,
              y: null,
              companyCode: null,
            })
          }
        />
      )}

      {/* ================= ADD / UPDATE MODAL ================= */}
      <Modal
        {...{
          show: showModal,
          setShow: setShowModal,
          handleSubmit,
          state: editingCompany,
          title: "Company",
          gridCols: 3,
          maxWidth: "4xl",
          bodyClassName: "p-5 gap-3",
          loading: createLoading || updateLoading,
          body: (
            <>
              <TextInput
                label="Company Name"
                mandatory={true}
                value={form.companyName}
                onChange={(e: any) => updateField("companyName", e.target.value)}
                placeholder="Enter company name"
                error={errors.companyName}
              />

              <TextInput
                label="Email"
                mandatory={true}
                value={form.companyEmail}
                onChange={(e: any) => updateField("companyEmail", e.target.value)}
                placeholder="Enter email address"
                error={errors.companyEmail}
                type="email"
              />

              <TextInput
                label="Mobile"
                mandatory={true}
                value={form.companyMobile}
                onChange={(e: any) =>
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
                onChange={(e: any) =>
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
                onChange={(e: any) =>
                  updateField(
                    "gstNumber",
                    e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 15)
                  )
                }
                placeholder="Enter GST number"
                error={errors.gstNumber}
                type="text"
              />

              {/* IFSC */}
              <div className="relative [&_input]:pr-24">
                <TextInput
                  label="IFSC Code"
                  mandatory={true}
                  value={form.ifscCode}
                  onChange={(e: any) => {
                    const value = e.target.value
                      .toUpperCase()
                      .replace(/\s/g, "")
                      .slice(0, 11);

                    updateField("ifscCode", value);
                    setVerifiedIfscCode("");
                  }}
                  placeholder="Enter IFSC code"
                  error={errors.ifscCode}
                  type="text"
                />

                <div className="absolute right-2 top-[31px]">
                  {isIfscVerified ? (
                    <div className="h-[24px] w-[38px] text-green-600 rounded-md flex items-center justify-center">
                      <CheckCircle2 size={21} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleIFSCVerify}
                      disabled={verifyLoading}
                      className="h-[24px] px-3 text-xs border rounded-md bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
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
                onChange={(e: any) => updateField("bankName", e.target.value)}
                placeholder="Enter bank name"
                error={errors.bankName}
                type="text"
              />

              <TextInput
                label="Bank Account Number"
                mandatory={true}
                value={form.bankAccountNumber}
                onChange={(e: any) =>
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
                onChange={(e: any) => {
                  const selectedStateCode = e?.target?.value || "";

                  setForm((prev: any) => ({
                    ...prev,
                    state: selectedStateCode,
                    city: "",
                  }));

                  setErrors((prev: any) => ({
                    ...prev,
                    state: "",
                    city: "",
                  }));

                  setPendingCity("");

                  if (selectedStateCode) {
                    dispatch(
                      getCitiesByState({
                        stateCode: selectedStateCode,
                        searchText: "",
                      }) as any
                    );
                  }
                }}
                placeholder="Select state"
                error={errors.state}
                options={[
                  { value: "", label: "Select state" },
                  ...(states?.map((item: any) => {
                    const stateCode =
                      item.isoCode || item.stateCode || item.code || "";

                    const stateName = getDisplayName(item.name || item.stateName);

                    return {
                      value: stateCode,
                      label: stateName || stateCode,
                    };
                  }) || []),
                ]}
              />

              <SelectInput
                label="City"
                mandatory={true}
                value={form.city}
                onChange={(e: any) => {
                  const selectedCity = e?.target?.value || "";
                  updateField("city", selectedCity);
                }}
                placeholder="Select city"
                error={errors.city}
                disabled={!form.state || stateCityLoading}
                options={[
                  {
                    value: "",
                    label: stateCityLoading ? "Loading..." : "Select city",
                  },
                  ...(cities?.map((item: any) => {
                    const cityName = getDisplayName(item.name || item.cityName);

                    return {
                      value: cityName,
                      label: cityName,
                    };
                  }) || []),
                ]}
              />

              <TextArea
                label="Address"
                mandatory={true}
                value={form.companyAddress}
                onChange={(e: any) =>
                  updateField("companyAddress", e.target.value)
                }
                placeholder="Enter company address"
                error={errors.companyAddress}
              />

              {/* Logo + Signature */}
              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Company Logo */}
                <div className="flex flex-col gap-1 w-full min-w-0">
                  <label className="text-sm font-medium">
                    Company Logo <span className="text-red-500">*</span>
                  </label>

                  <div
                    className={`border-2 border-dashed rounded-md p-3 flex items-center justify-center cursor-pointer hover:border-blue-400 transition relative h-[100px] sm:h-[110px] w-full min-w-0 ${errors.logoUri ? "border-red-500" : "border-gray-300"
                      }`}
                    onClick={() =>
                      document.getElementById("companyLogoInput")?.click()
                    }
                  >
                    {form.logoUri ? (
                      <>
                        <img
                          src={form.logoUri}
                          alt="Company Logo"
                          className="max-w-full sm:max-w-[180px] max-h-[80px] sm:max-h-[90px] object-contain rounded"
                        />

                        <button
                          type="button"
                          className="absolute top-1.5 right-2 text-red-600 text-xs sm:text-sm font-medium hover:underline bg-white/80 px-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateField("logoUri", null);
                          }}
                        >
                          × Remove
                        </button>
                      </>
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm text-center">
                        Click to upload company logo
                      </p>
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
                    onChange={async (e: any) => {
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
                <div className="flex flex-col gap-1 w-full min-w-0">
                  <label className="text-sm font-medium">
                    Signature <span className="text-red-500">*</span>
                  </label>

                  <div
                    className={`border-2 border-dashed rounded-md p-3 flex items-center justify-center cursor-pointer hover:border-blue-400 transition relative h-[100px] sm:h-[110px] w-full min-w-0 ${errors.signatureUri ? "border-red-500" : "border-gray-300"
                      }`}
                    onClick={() =>
                      document.getElementById("signatureInput")?.click()
                    }
                  >
                    {form.signatureUri ? (
                      <>
                        <img
                          src={form.signatureUri}
                          alt="Signature"
                          className="max-w-full sm:max-w-[180px] max-h-[80px] sm:max-h-[90px] object-contain rounded"
                        />

                        <button
                          type="button"
                          className="absolute top-1.5 right-2 text-red-600 text-xs sm:text-sm font-medium hover:underline bg-white/80 px-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateField("signatureUri", null);
                          }}
                        >
                          × Remove
                        </button>
                      </>
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm text-center">
                        Click to upload signature
                      </p>
                    )}
                  </div>

                  {errors.signatureUri && (
                    <p className="text-xs text-red-500">
                      {errors.signatureUri}
                    </p>
                  )}

                  <input
                    id="signatureInput"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={async (e: any) => {
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
    </div>
  );
};

export default CompanyMaster;