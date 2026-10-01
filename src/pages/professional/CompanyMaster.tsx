import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createCompany,
  getCompany,
  replaceCompany,
  verifyIFSC,
} from "../../redux/slices/professionalSlice/professionalCompanyMaster.slice";
import { toast } from "react-toastify";
import { Edit, RefreshCcw, CheckCircle2, EyeOff, Eye } from "lucide-react";
import { ImageUploadInput, SelectInput, TextArea, TextInput, ToggleInput } from "../../components/inputs"; // ⭐ UPDATED
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
// ⭐ ADDED — E-WAY BILL CONFIGURATION
import { getLatestSystemConfiguration } from "../../redux/slices/systemConf";
// ⭐ UPDATED — COMPANY MASTER SCHEMA
import { clearCompanyMasterSchemaError, getCompanyMasterSchema } from "../../redux/slices/professionalSlice/masterConfigurationSlice/companyMaster";
import professionalAxios from "../../services/professionalAxios";
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
  // ⭐ ADDED — E-WAY BILL CREDENTIALS
  username: "",
  ewbpwd: "",
};
// ⭐ UPDATED — COMPANY MASTER SCHEMA HELPERS
const getSchemaFieldType = (field: any) => String(field?.type || "").trim().toLowerCase();
const isTrueValue = (value: any) => value === true || value === 1 || value === "1" || String(value ?? "").trim().toLowerCase() === "true";
const isFalseValue = (value: any) => value === false || value === 0 || value === "0" || String(value ?? "").trim().toLowerCase() === "false";
const isDynamicSchemaField = (field: any) => isFalseValue(field?.isDefault);
const getSchemaApiConfig = (field: any) => field?.apiConfig && typeof field.apiConfig === "object" ? field.apiConfig : null;
const isApiSchemaField = (field: any) => Boolean(getSchemaApiConfig(field)?.url);
const isReferenceSchemaField = (field: any) => getSchemaFieldType(field) !== "select" && Boolean(field?.ref || isApiSchemaField(field));
const getNestedValue = (source: any, path: string) => {
  if (!source || !path) return undefined;
  return String(path).split(".").reduce((value: any, key: string) => value?.[key], source);
};
const getReferenceCode = (value: any) => value && typeof value === "object" ? String(value?.code || value?.value || value?._id || "") : String(value || "");
const getReferenceName = (value: any) => value && typeof value === "object" ? String(value?.name || value?.label || "") : "";
const getSchemaDefaultValue = (field: any) => getSchemaFieldType(field) === "boolean" ? false : isReferenceSchemaField(field) ? null : field?.defaultValue ?? "";
const buildCompanyDynamicForm = (fields: any[] = [], values: any = {}) => fields.reduce((result: any, field: any) => {
  result[field.key] = Object.prototype.hasOwnProperty.call(values || {}, field.key) ? values[field.key] : getSchemaDefaultValue(field);
  return result;
}, {});
const buildDataSourceRequestUrl = (rawApi: string) => {
  const api = String(rawApi || "").trim();
  if (!api || /^https?:\/\//i.test(api)) return api;
  const axiosBaseUrl = String(professionalAxios?.defaults?.baseURL || "").trim();
  const baseHasBackendPrefix = /\/eTaxSolnMongoApiBackend\/?$/i.test(axiosBaseUrl);
  let relativeApi = api.replace(/^\/+/, "").replace(/^SandBox\//i, "");
  if (baseHasBackendPrefix) return relativeApi.replace(/^eTaxSolnMongoApiBackend\/?/i, "");
  if (!relativeApi.toLowerCase().startsWith("etaxsolnmongoapibackend/")) relativeApi = `eTaxSolnMongoApiBackend/${relativeApi}`;
  return relativeApi;
};
const extractSchemaRecords = (responseData: any): any[] => {
  const roots = [responseData, responseData?.data, responseData?.result, responseData?.payload, responseData?.data?.data];
  const keys = ["items", "records", "accounts", "products", "units", "users", "docs", "result"];
  for (const root of roots) {
    if (Array.isArray(root)) return root;
    if (root && typeof root === "object") {
      for (const key of keys) if (Array.isArray(root?.[key])) return root[key];
    }
  }
  return [];
};
const buildSchemaOption = (field: any, item: any) => {
  const apiConfig = getSchemaApiConfig(field) || {};
  const dynamicData = item?.data || item?.dynamicFields || item?.customFields || {};
  const source = { ...dynamicData, ...item };
  const valueField = String(apiConfig?.valueField || field?.valueField || "").trim();
  const labelField = String(apiConfig?.labelField || field?.labelField || "").trim();
  const value = getNestedValue(source, valueField) ?? source?.value ?? source?.code ?? source?._id ?? "";
  const label = getNestedValue(source, labelField) ?? source?.label ?? source?.name ?? value;
  if (!String(value ?? "").trim()) return null;
  return { value: String(value), label: String(label || value), raw: item };
};
const resolveSchemaApiParams = (field: any, formValues: any = {}) => {
  const apiConfig = getSchemaApiConfig(field) || {};
  const params: Record<string, any> = { ...(apiConfig?.pagination || {}), ...(apiConfig?.queryParams || {}) };
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (typeof value === "string" && value.startsWith("$")) params[key] = formValues?.[value.slice(1)] ?? "";
  });
  return params;
};
const getSchemaDependencyKey = (fields: any[] = [], formValues: any = {}) => fields.map((field: any) => {
  const queryParams = getSchemaApiConfig(field)?.queryParams || {};
  return Object.values(queryParams).filter((value: any) => typeof value === "string" && value.startsWith("$")).map((value: any) => String(formValues?.[value.slice(1)] ?? "")).join("|");
}).join("||");
const loadCompanySchemaOptions = async (fields: any[], formValues: any = {}) => Promise.all((fields || []).map(async (field: any) => {
  const apiConfig = getSchemaApiConfig(field);
  if (!apiConfig?.url) return field;
  try {
    const response = await professionalAxios.get(buildDataSourceRequestUrl(apiConfig.url), { params: resolveSchemaApiParams(field, formValues) });
    const options = extractSchemaRecords(response?.data).map((item: any) => buildSchemaOption(field, item)).filter(Boolean);
    return { ...field, options };
  } catch (error: any) {
    console.error(`Failed to load Company Master options for ${field.key}:`, error?.response?.data || error);
    return { ...field, options: Array.isArray(field?.options) ? field.options : [] };
  }
}));
const normalizeSchemaValue = (field: any, value: any) => {
  const type = getSchemaFieldType(field);
  if (value === "" || value === undefined || value === null) return null;
  if (type === "number") return Number(value);
  if (type === "boolean") return isTrueValue(value);
  if (isReferenceSchemaField(field)) return { code: getReferenceCode(value), name: getReferenceName(value) };
  return value;
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
  // ⭐ UPDATED — COMPANY MASTER SCHEMA STATE
  const { fields: companySchemaFields = [], loading: companySchemaLoading, error: companySchemaError } = useSelector((s: any) => s.companyMasterSchema || {});
  const {
    states,
    cities,
    loading: stateCityLoading,
  } = useSelector((s: any) => s.stateCity);
  // ⭐ ADDED — E-WAY BILL CONFIGURATION
  const {
    configuration,
  } = useSelector((s: any) => s.systemConfiguration);
  // ⭐ ADDED — CHECK WHETHER E-WAY BILL IS ENABLED
  const enableEWayBill =
    !!configuration
      ?.systemConfiguration
      ?.eWayBillConfiguration
      ?.enableEWayBill;
  const [localOffset, setLocalOffset] = useState(0);
  const [localLimit, setLocalLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [form, setForm] = useState<any>(initialForm);
  const [errors, setErrors] = useState<any>({});
  // ⭐ UPDATED — COMPANY MASTER SCHEMA OPTIONS
  const [loadedCompanySchemaFields, setLoadedCompanySchemaFields] = useState<any[]>([]);
  const [companySchemaOptionsLoading, setCompanySchemaOptionsLoading] = useState(false);
  const rawDynamicCompanySchemaFields = (companySchemaFields || []).filter((field: any) => field?.key && isDynamicSchemaField(field) && !isTrueValue(field?.isHidden));
  const companySchemaDependencyKey = getSchemaDependencyKey(rawDynamicCompanySchemaFields, form);
  const dynamicCompanySchemaFields = loadedCompanySchemaFields.length ? loadedCompanySchemaFields : rawDynamicCompanySchemaFields;
  const [pendingCity, setPendingCity] = useState("");
  const [verifiedIfscCode, setVerifiedIfscCode] = useState("");
  // ⭐ ADDED — E-WAY BILL PASSWORD VISIBILITY
  const [showEwbPassword, setShowEwbPassword] = useState(false);
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
    // @ts-ignore
    dispatch(getCompany({
      offset: localOffset,
      limit: localLimit,
      search: debouncedSearch,
    }) as any
    );
  };
  useEffect(() => {
    dispatch(getStates("") as any);
  }, [dispatch]);
  // ⭐ ADDED — LOAD SYSTEM CONFIGURATION FOR E-WAY BILL
  useEffect(() => {
    dispatch(getLatestSystemConfiguration() as any);
  }, [dispatch]);
  // ⭐ UPDATED — LOAD COMPANY MASTER SCHEMA
  useEffect(() => {
    dispatch(getCompanyMasterSchema({ offset: 0, limit: 200, isSearchable: "", isRequired: "", isFilterable: "" }) as any);
  }, [dispatch]);
  // ⭐ UPDATED — LOAD OPTIONS FOR SCHEMA API FIELDS
  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      if (!rawDynamicCompanySchemaFields.length) {
        setLoadedCompanySchemaFields([]);
        setCompanySchemaOptionsLoading(false);
        return;
      }
      setCompanySchemaOptionsLoading(true);
      const fields = await loadCompanySchemaOptions(rawDynamicCompanySchemaFields, form);
      if (active) {
        setLoadedCompanySchemaFields(fields);
        setCompanySchemaOptionsLoading(false);
      }
    };
    loadOptions();
    return () => { active = false; };
  }, [companySchemaFields, companySchemaDependencyKey]);
  // ⭐ UPDATED — COMPANY MASTER SCHEMA ERROR
  useEffect(() => {
    if (!companySchemaError) return;
    toast.error(companySchemaError);
    dispatch(clearCompanyMasterSchemaError() as any);
  }, [companySchemaError, dispatch]);
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
      // ⭐ ADDED — E-WAY BILL CREDENTIALS
      username: data.username || "",
      ewbpwd: data.ewbpwd || "",
      // ⭐ UPDATED — COMPANY MASTER DYNAMIC SCHEMA VALUES
      ...buildCompanyDynamicForm(dynamicCompanySchemaFields, data.dynamicFields || {}),
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
  // ⭐ UPDATED — HYDRATE SCHEMA FIELDS IF SCHEMA FINISHES LOADING AFTER MODAL OPENS
  useEffect(() => {
    if (!showModal || !dynamicCompanySchemaFields.length) return;
    setForm((prev: any) => {
      const source = editingCompany?.dynamicFields || {};
      const next = { ...prev };
      let changed = false;
      dynamicCompanySchemaFields.forEach((field: any) => {
        if (!Object.prototype.hasOwnProperty.call(next, field.key)) {
          next[field.key] = Object.prototype.hasOwnProperty.call(source, field.key) ? source[field.key] : getSchemaDefaultValue(field);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [showModal, editingCompany, loadedCompanySchemaFields, companySchemaFields]);
  const openAddModal = () => {
    setEditingCompany(null);
    // ⭐ UPDATED — INCLUDE COMPANY MASTER SCHEMA DEFAULTS
    setForm({ ...initialForm, ...buildCompanyDynamicForm(dynamicCompanySchemaFields) });
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
  // ⭐ UPDATED — RENDER COMPANY MASTER SCHEMA FIELD
  const renderCompanySchemaField = (field: any) => {
    const type = getSchemaFieldType(field);
    const mandatory = isTrueValue(field?.isRequired);
    const commonProps = { label: field.label || field.key, mandatory, value: form?.[field.key] ?? "", error: errors?.[field.key], placeholder: `Enter ${field.label || field.key}` };
    if (isApiSchemaField(field)) {
      const referenceField = isReferenceSchemaField(field);
      const currentValue = referenceField ? getReferenceCode(form?.[field.key]) : String(form?.[field.key] ?? "");
      const currentName = referenceField ? getReferenceName(form?.[field.key]) : "";
      const apiOptions = (Array.isArray(field?.options) ? field.options : []).map((option: any) => typeof option === "object" ? { value: String(option?.value ?? option?.code ?? ""), label: String(option?.label ?? option?.name ?? option?.value ?? option?.code ?? ""), raw: option?.raw || option } : { value: String(option), label: String(option), raw: option });
      if (currentValue && !apiOptions.some((option: any) => option.value === currentValue)) apiOptions.push({ value: currentValue, label: currentName || currentValue, raw: form?.[field.key] });
      return <SelectInput key={field.key} label={field.label || field.key} mandatory={mandatory} value={currentValue} error={errors?.[field.key]} disabled={companySchemaOptionsLoading} placeholder={`Select ${field.label || field.key}`} options={[{ value: "", label: `Select ${field.label || field.key}` }, ...apiOptions]} onChange={(e: any) => {
        const selectedValue = e?.target?.value || "";
        const selected = apiOptions.find((option: any) => option.value === selectedValue);
        updateField(field.key, referenceField ? (selectedValue ? { code: selectedValue, name: selected?.label || selectedValue } : null) : selectedValue);
      }} />;
    }
    if (type === "select") {
      const options = (Array.isArray(field?.options) ? field.options : []).map((option: any) => typeof option === "object" ? { value: String(option?.value ?? option?.code ?? option?.name ?? option?.label ?? ""), label: String(option?.label ?? option?.name ?? option?.value ?? option?.code ?? "") } : { value: String(option), label: String(option) });
      return <SelectInput key={field.key} label={field.label || field.key} mandatory={mandatory} value={form?.[field.key] ?? ""} error={errors?.[field.key]} placeholder={`Select ${field.label || field.key}`} options={[{ value: "", label: `Select ${field.label || field.key}` }, ...options]} onChange={(e: any) => updateField(field.key, e?.target?.value ?? "")} />;
    }
    // ⭐ UPDATED — BOOLEAN INPUT
    if (type === "boolean") {
      const booleanValue = isTrueValue(form?.[field.key]);
      return <ToggleInput key={field.key} label={field.label || field.key} name={field.key} value={booleanValue} checked={booleanValue} mandatory={mandatory} error={errors?.[field.key]} disabled={field?.disabled || field?.isReadonly} onChange={(e: any) => updateField(field.key, isTrueValue(e?.target?.checked ?? e?.target?.value))} />;
    }
    if (type === "textarea") return <TextArea key={field.key} {...commonProps} onChange={(e: any) => updateField(field.key, e.target.value)} />;
    if (type === "number") return <TextInput key={field.key} {...commonProps} type="number" onChange={(e: any) => updateField(field.key, e.target.value)} />;
    if (type === "date") return <TextInput key={field.key} {...commonProps} type="date" onChange={(e: any) => updateField(field.key, e.target.value)} />;
    return <TextInput key={field.key} {...commonProps} type="text" onChange={(e: any) => updateField(field.key, e.target.value)} />;
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
    // ⭐ ADDED — VALIDATE E-WAY BILL CREDENTIALS ONLY WHEN ENABLED
    if (enableEWayBill) {
      if (!form.username?.trim()) {
        e.username = "E-Way Bill username is required";
      }
      if (!form.ewbpwd?.trim()) {
        e.ewbpwd = "E-Way Bill password is required";
      }
    }
    // ⭐ UPDATED — VALIDATE REQUIRED COMPANY MASTER SCHEMA FIELDS
    dynamicCompanySchemaFields.forEach((field: any) => {
      if (!isTrueValue(field?.isRequired)) return;
      const value = form?.[field.key];
      const missing = isReferenceSchemaField(field) ? !getReferenceCode(value) : getSchemaFieldType(field) === "boolean" ? value === null || value === undefined : value === null || value === undefined || String(value).trim() === "";
      if (missing) e[field.key] = `${field.label || field.key} is required`;
    });
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
    // ⭐ UPDATED — BUILD COMPANY MASTER DYNAMIC FIELDS FROM SCHEMA
    const dynamicFields: Record<string, any> = { ...(editingCompany?.dynamicFields || {}) };
    dynamicCompanySchemaFields.forEach((field: any) => { dynamicFields[field.key] = normalizeSchemaValue(field, form?.[field.key]); });
    const payload: any = {
      ...form,
      ifscCode: form.ifscCode?.toUpperCase(),
      gstNumber: form.gstNumber?.toUpperCase(),
      upiId: form.upiId?.toLowerCase(),
      state: selectedState || form.state,
      city: selectedCity || form.city,
      dynamicFields,
    };
    // ⭐ UPDATED — DYNAMIC VALUES MUST ONLY GO INSIDE dynamicFields
    dynamicCompanySchemaFields.forEach((field: any) => delete payload[field.key]);
    try {
      if (editingCompany) {
        // const companyCode = editingCompany.companyCode || editingCompany.companyPublicId || editingCompany.code || editingCompany._id;
        // console.log({ payload, companyCode })
        // @ts-ignore
        await dispatch(replaceCompany({
          payload,
        }) as any
        ).unwrap();
        toast.success("Company updated successfully");
      } else {
        await dispatch(createCompany(payload) as any).unwrap();
        toast.success("Company created");
      }
      setShowModal(false);
      setEditingCompany(null);
      setForm({ ...initialForm, ...buildCompanyDynamicForm(dynamicCompanySchemaFields) });
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
      // @ts-ignore
      await dispatch(getCompany({
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
  // const handleDeleteConfirm = async () => {
  //   try {
  //     if (!confirmTooltip.companyCode) {
  //       toast.error("Company code not found");
  //       return;
  //     }
  //     // @ts-ignore
  //     await dispatch(deleteCompany(confirmTooltip.companyCode) as any).unwrap();
  //     toast.success("Company deleted");
  //     fetchCompanies();
  //   } catch (err: any) {
  //     toast.error(err?.message || "Delete failed");
  //   } finally {
  //     setConfirmTooltip({
  //       show: false,
  //       x: null,
  //       y: null,
  //       companyCode: null,
  //     });
  //   }
  // };
  // ⭐ UPDATED — SHOW VERIFIED CHECK ONLY AFTER ACTUAL IFSC VERIFICATION
  const isIfscVerified = !!verifiedIfscCode && !!form.ifscCode?.trim() && verifiedIfscCode === form.ifscCode.trim().toUpperCase() && !errors.ifscCode;
  const companyColumns = [
    {
      key: "companyName",
      title: "Company Name",
      render: (row: any) => (
        <span className="font-semibold text-card-foreground">
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
    <div className="w-full bg-card border border-border text-card-foreground shadow-sm p-4 flex flex-col h-[100%]">
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
          {/* @ts-ignore */}
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
          // const companyCode = companyRow.companyCode || companyRow.companyPublicId || companyRow.code || companyRow._id;
          return (
            <div className="flex items-center gap-2">
              {/* EDIT */}
              <button
                id="company-edit-button"
                onClick={() => openEditModal(companyRow)}
                className="p-2 rounded-lg text-primary hover:bg-muted hover:text-primary transition-all duration-200 cursor-pointer"
              >
                <Edit size={16} />
              </button>
              {/* DELETE */}
              {/* <button
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
                className="p-2 rounded-lg text-danger hover:bg-muted hover:text-danger transition-all duration-200 cursor-pointer"
              >
                <Trash2 size={16} />
              </button> */}
            </div>
          );
        }}
      />
      {/* ================= PAGINATION ================= */}
      {pagination?.totalDocs > 0 && (
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
      )}
      {/* ================= DELETE TOOLTIP ================= */}
      {confirmTooltip.show && (
        <ConfirmTooltip
          x={confirmTooltip.x}
          y={confirmTooltip.y}
          message="Are you sure you want to delete this company?"
          confirmText="Delete"
          cancelText="Cancel"
          // onConfirm={handleDeleteConfirm}
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
      {/* @ts-ignore */}
      <Modal
        {...{
          show: showModal,
          setShow: setShowModal,
          handleSubmit,
          state: editingCompany,
          title: editingCompany ? "Company" : "Add New Company",
          gridCols: 3,
          maxWidth: "4xl",
          bodyClassName: "p-5 gap-3 bg-card text-card-foreground",
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
              {/* ⭐ ADDED — E-WAY BILL CREDENTIALS */}
              {enableEWayBill && (
                <>
                  <TextInput
                    label="E-Way Bill Username"
                    mandatory={true}
                    value={form.username}
                    onChange={(e: any) => updateField("username", e.target.value)}
                    placeholder="Enter E-Way Bill username"
                    error={errors.username}
                    type="text"
                  />
                  {/* ⭐ UPDATED — E-WAY BILL PASSWORD WITH SHOW/HIDE */}
                  <div className="relative [&_input]:pr-10">
                    <TextInput
                      label="E-Way Bill Password"
                      mandatory={true}
                      value={form.ewbpwd}
                      onChange={(e: any) => updateField("ewbpwd", e.target.value)}
                      placeholder="Enter E-Way Bill password"
                      error={errors.ewbpwd}
                      type={showEwbPassword ? "text" : "password"}
                    />

                    <button
                      type="button"
                      onClick={() => setShowEwbPassword((prev) => !prev)}
                      className="absolute right-2 top-[28px] flex h-[24px] w-[30px] items-center justify-center rounded-md text-muted-foreground transition  hover:text-card-foreground"
                      title={showEwbPassword ? "Hide password" : "Show password"}
                      aria-label={showEwbPassword ? "Hide password" : "Show password"}
                    >
                      {showEwbPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </>
              )}
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
                <div className="absolute right-2 top-[28px]">
                  {isIfscVerified ? (
                    <div className="h-[24px] w-[38px] text-success rounded-md flex items-center justify-center">
                      <CheckCircle2 size={21} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleIFSCVerify}
                      disabled={verifyLoading}
                      className="h-[24px] px-3 text-xs border border-border rounded-md bg-card text-card-foreground hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
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
              {/* ⭐ UPDATED — COMPANY MASTER SCHEMA FIELDS */}
              {companySchemaLoading || companySchemaOptionsLoading ? (
                <div className="md:col-span-2 lg:col-span-3 py-3 text-sm text-muted-foreground">Loading company schema fields...</div>
              ) : (
                dynamicCompanySchemaFields.map((field: any) => renderCompanySchemaField(field))
              )}
              {/* Logo + Signature */}
              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <ImageUploadInput
                  label="Company Logo"
                  className="sm:col-span-1"
                  value={form.logoUri}
                  error={errors.logoUri}
                  placeholder="Click to upload company logo"
                  alt="Company Logo"
                  // @ts-ignore
                  validateImage={validateImage}
                  fileToBase64={fileToBase64}
                  onChange={(value) => updateField("logoUri", value)}
                />
                <ImageUploadInput
                  label="Signature"
                  className="sm:col-span-1"
                  value={form.signatureUri}
                  error={errors.signatureUri}
                  placeholder="Click to upload signature"
                  alt="Signature"
                  // @ts-ignore
                  validateImage={validateImage}
                  fileToBase64={fileToBase64}
                  onChange={(value) => updateField("signatureUri", value)}
                />
              </div>
            </>
          ),
        }}
      />
    </div>
  );
};
export default CompanyMaster;
