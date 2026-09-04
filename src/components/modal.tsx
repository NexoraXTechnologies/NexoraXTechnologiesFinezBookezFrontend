import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "./buttons";
import { LogOut, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { reportGeneratePdf } from "../redux/slices/professionalSlice/reportMappingSlice";
import { getCompany } from "../redux/slices/professionalSlice/professionalCompanyMaster.slice";
import { createAccount, getAccountByCode, getAllAccountMasterSchema, updateAccount } from "../redux/slices/professionalSlice/accountMasterSlice";
import { downloadBlobPdf, printHtmlUsingIframe } from "../utils/pdf/pdfPrint";
import { buildPdfHtml } from "../utils/pdf/pdfTemplate";
import { toast } from "react-toastify";
import { buildUpiLink, generateQrDataUrl } from "../utils/pdf/upiQr";
import { normalizeDoc } from "../utils/pdf/pdfNormalizer";
import { getCitiesByState, getStates } from "../redux/slices/professionalSlice/stateCitySlice";
import { SelectInput, TextArea, TextInput, ToggleInput } from "./inputs";
import professionalAxios from "../services/professionalAxios";
import { getGSTNumberDetails } from "../redux/slices/professionalSlice/gstVerify";

type ModalProps = {
    show: boolean;
    setShow?: (value: boolean) => void;
    handleSubmit?: () => void;
    handleClose?: () => void;
    state?: boolean;
    body?: React.ReactNode;
    title?: string | any;
    loader?: boolean;
    gridCols?: 1 | 2 | 3 | 4 | 12;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;
    modalClassName?: string;
    overlayClassName?: string;
    hideFooter?: boolean;
    submitText?: string;
    submitDisabled?: boolean;
};

const gridColsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    12: "grid-cols-1",
};

const maxWidthClass: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "w-[98vw] max-w-[98vw]",
};

const Modal = ({
    show,
    setShow,
    handleSubmit,
    state,
    body,
    handleClose = () => null,
    title,
    loader = false,
    gridCols = 2,
    maxWidth = "3xl",
    bodyClassName = "",
    headerClassName = "",
    footerClassName = "",
    modalClassName = "",
    overlayClassName = "",
    hideFooter = false,
    submitText = "",
    submitDisabled = false,
}: ModalProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm ${overlayClassName}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className={`relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-2xl ${maxWidthClass[maxWidth] || maxWidthClass["3xl"]} ${modalClassName}`}
                    >
                        <div className={`flex shrink-0 items-center justify-between border-b border-border bg-secondary px-6 py-3 ${headerClassName}`}>
                            <div>
                                <h2 className="mb-0 text-xl font-semibold text-secondary-foreground">{state ? `Edit ${title}` : `${title}`}</h2>
                                <p className="text-sm text-muted-foreground">Fill in the {title.toLowerCase()} details below</p>
                            </div>

                            <button type="button" onClick={() => { handleClose(); setShow?.(false); }} className="cursor-pointer rounded-full p-2 transition hover:bg-muted">
                                <X size={18} className="text-muted-foreground" />
                            </button>
                        </div>

                        <div className={`grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden p-6 text-sm bg-card text-card-foreground ${gridColsClass[gridCols] || gridColsClass[2]} ${bodyClassName}`}>
                            {body}
                        </div>

                        {!hideFooter && (
                            <div className={`flex shrink-0 justify-end gap-3 border-t border-border bg-secondary px-6 py-4 ${footerClassName}`}>
                                <SecondaryButton callBackFn={() => { handleClose(); setShow?.(false); }} text="Cancel" />
                                <PrimaryButton disabled={loader || submitDisabled} callBackFn={handleSubmit} text={loader ? "Loading.." : submitText || (state ? "Update" : "Save")} />
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;

const LogoutModal = ({ show, setShow, loading, handleSubmit }: any) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="relative w-full max-w-md overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-border bg-secondary px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                                    <LogOut size={20} className="text-danger" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-secondary-foreground">Logout</h2>
                                    <p className="text-sm text-muted-foreground">Confirm logout action</p>
                                </div>
                            </div>

                            <button type="button" onClick={() => setShow(false)} className="rounded-full p-2 transition hover:bg-muted">
                                <X size={18} className="text-muted-foreground" />
                            </button>
                        </div>

                        <div className="px-6 py-5 bg-card">
                            <p className="text-sm text-muted-foreground">Are you sure you want to logout from your account? You will need to sign in again to access the dashboard.</p>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border bg-secondary px-6 py-4">
                            <button onClick={() => setShow(false)} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:bg-muted">Cancel</button>
                            <button disabled={loading} onClick={handleSubmit} className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-danger-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                                {loading ? "Logging out..." : "Logout"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

type NoDataConfirmAlertProps = {
    show: boolean;
    title?: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
    onCancel?: () => void;
    onConfirm?: () => void;
};

const WarningModel = ({ show, title = "No Data Found", message = "Please create at least one record to proceed.", cancelText = "Cancel", confirmText = "Yes", onCancel, onConfirm }: NoDataConfirmAlertProps) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-md border border-border bg-card p-6 text-center text-card-foreground shadow-2xl">
                <h2 className="text-2xl font-bold text-card-foreground">{title}</h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">{message}</p>

                <div className="mt-7 grid grid-cols-2 gap-4">
                    <button type="button" onClick={onCancel} className="rounded-md border border-border bg-card px-5 py-3 font-semibold text-card-foreground hover:bg-muted">{cancelText}</button>
                    <button type="button" onClick={onConfirm} className="rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90">{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

const ListingModel = ({ show, setShow, title = "No Data Found", report, rowData, downlaodPDF, entryType = "sales-invoice", GstToggle = false, externalBody, externalConfirm }: any) => {
    const dispatch = useDispatch<any>();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [selectedExternal, setSelectedExternal] = useState(false);
    const [gstType, setGstType] = useState("");
    const { company } = useSelector((s: any) => s.professionalCompanyMaster);
    const [loader, setLoader] = useState(false);
    const { selectedAccount } = useSelector((s: any) => s.accountMaster);
    const autoPrintDoneRef = useRef(false);
    const isReportDownload = Array.isArray(report) && report.length > 0;

    const handleLocalPdfPrint = async (forcedGstType?: string) => {
        const finalGstType = forcedGstType || gstType;

        if (!finalGstType) return toast.warn("Select With GST Or Without GST");
        if (!Object.keys(company || {})?.length) return toast.error("Add Company Details");

        try {
            const includeGst = finalGstType === "With GST";
            const normalized: any = normalizeDoc(rowData);
            const footer = normalized?.footer || {};
            const invoiceNo = normalized?.docNo || rowData?.voucherNumber || rowData?.sInvVoucherNumber || rowData?.sQuoteVoucherNumber || "";
            const amount = footer?.totalNetAmount || footer?.netAmount || footer?.balanceAmount || rowData?.sInvFooter?.totalNetAmount || rowData?.sInvFooter?.netAmount || rowData?.sQuoteFooter?.totalNetAmount || rowData?.sQuoteFooter?.netAmount || 0;
            const companyUpiId = company?.upiId || company?.upiID || company?.companyUpiId || company?.upi || "";
            let upiUrl = "";
            let upiQrUri = "";

            if (entryType === "sales-invoice" && companyUpiId) {
                upiUrl = buildUpiLink({ upiId: companyUpiId, amount, invoiceNo, name: company?.companyName || company?.businessName || "" });
                upiQrUri = await generateQrDataUrl(upiUrl);
            }

            const htmlContent = buildPdfHtml({ ...company, selectedAccount, rowData, includeGst, primaryColor: "#1E88E5", entryType, gstType: finalGstType, upiId: companyUpiId, upiUrl, upiQrUri });

            printHtmlUsingIframe(htmlContent);
            setShow(false);
            setGstType("");
            setSelectedTemplate(null);
            setSelectedExternal(false);
        } catch (error) {
            console.log("Local PDF print failed:", error);
        }
    };

    const handleServerPdfDownload = async () => {
        try {
            if (!selectedTemplate?.templateFileId) {
                toast.warn("Please select template");
                return;
            }

            setLoader(true);

            const blobData = await dispatch(reportGeneratePdf({
                moduleType: downlaodPDF?.moduleType,
                templateFileId: selectedTemplate?.templateFileId,
                CustomerCode: downlaodPDF?.CustomerCode,
                voucherNumber: downlaodPDF?.voucherNumber,
            })).unwrap();

            downloadBlobPdf({ blobData, fileName: `${rowData?.voucherNumber || "report"}.pdf` });
            setShow(false);
            setSelectedTemplate(null);
            setSelectedExternal(false);
        } catch (error) {
            toast.error("PDF download failed");
            console.error("PDF download failed:", error);
        }

        setLoader(false);
    };

    const handleConfirm = async () => {
        if (selectedExternal && typeof externalConfirm === "function") {
            try {
                setLoader(true);

                await externalConfirm();

                setShow(false);
                setSelectedExternal(false);
                setSelectedTemplate(null);
                setGstType("");
            } catch (error) {
                console.error("External PDF download failed:", error);
            } finally {
                setLoader(false);
            }

            return;
        }

        if (isReportDownload) {
            await handleServerPdfDownload();
            return;
        }

        await handleLocalPdfPrint();
    };

    useEffect(() => {
        if (!show) {
            autoPrintDoneRef.current = false;
            setSelectedExternal(false);
            return;
        }

        dispatch(getCompany(""));

        if (downlaodPDF?.CustomerCode) {
            dispatch(getAccountByCode(downlaodPDF?.CustomerCode));
        }
    }, [show, downlaodPDF?.CustomerCode, dispatch]);

    useEffect(() => {
        if (!show) return;
        if (!GstToggle) return;
        if (isReportDownload) return;
        if (autoPrintDoneRef.current) return;
        if (!Object.keys(company || {})?.length) return;

        autoPrintDoneRef.current = true;
        handleLocalPdfPrint("With GST");
    }, [show, GstToggle, isReportDownload, company]);

    if (!show) return null;
    if (GstToggle && !isReportDownload) return null;

    return (
        <AnimatePresence>
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className={`relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-2xl ${maxWidthClass["lg"]}`}
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-border bg-secondary px-6 py-3">
                        <div>
                            <h2 className="mb-0 text-xl font-semibold text-secondary-foreground">{title}</h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShow();
                                setGstType("");
                                setSelectedTemplate(null);
                                setSelectedExternal(false);
                            }}
                            className="cursor-pointer rounded-full p-2 transition hover:bg-muted"
                        >
                            <X size={18} className="text-muted-foreground" />
                        </button>
                    </div>

                    <div className="grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden bg-card p-6 text-sm text-card-foreground">
                        {isReportDownload ? (
                            <ul className="space-y-3">
                                {report?.map((e: any, index: number) => (
                                    <li
                                        key={e?.id || index}
                                        onClick={() => {
                                            setSelectedTemplate(e);
                                            setSelectedExternal(false);
                                        }}
                                        className={`rounded-lg p-4 shadow-sm cursor-pointer transition-all duration-200 ${e?.id === selectedTemplate?.id && !selectedExternal ? "border-2 border-primary bg-primary/10 text-primary shadow-md" : "border border-border bg-card text-card-foreground hover:bg-muted hover:shadow-md"}`}
                                    >
                                        {e?.templateName}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex gap-3">
                                {["With GST", "Without GST"].map((option) => (
                                    <div
                                        key={option}
                                        onClick={() => {
                                            setGstType(option);
                                            setSelectedExternal(false);
                                        }}
                                        className={`rounded-lg border px-4 py-2 cursor-pointer transition-all ${gstType === option && !selectedExternal ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary hover:bg-muted"}`}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {typeof externalBody === "function"
                        ? externalBody({
                            selected: selectedExternal,
                            onSelect: () => {
                                setSelectedExternal(true);
                                setSelectedTemplate(null);
                                setGstType("");
                            },
                        })
                        : externalBody}

                    <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-secondary px-6 py-4">
                        <PrimaryButton callBackFn={handleConfirm} text="Confirm" loader={loader} />
                        <SecondaryButton
                            disabled={loader}
                            callBackFn={() => {
                                setShow();
                                setGstType("");
                                setSelectedTemplate(null);
                                setSelectedExternal(false);
                            }}
                            text="Cancel"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

type AccountMasterModalProps = {
    show: boolean;
    setShow: (show: boolean) => void;
    editingAccount?: any;
    onSaved?: (account?: any) => void | Promise<void>;
    title?: string;
};

// DISPLAY NAME
export const getDisplayName = (value: any) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);

    if (typeof value === "object") {
        return String(
            value.en ||
            value.mr ||
            value.hi ||
            value.gu ||
            value.ta ||
            value.te ||
            value.kn ||
            value.ml ||
            value.pa ||
            value.name ||
            value.label ||
            value.cityName ||
            value.stateName ||
            ""
        );
    }

    return "";
};

// ACCOUNT SYSTEM FIELDS
const ACCOUNT_SYSTEM_FIELD_KEYS = new Set([
    "accountCode",
    "accountName",
    "accountType",
    "accountMobile",
    "accountEmail",
    "accountCreditLimit",
    "accountAddress",
    "gstNumber",
    "state",
    "city",
]);

// REFERENCE FIELD TYPES
const CODE_NAME_REFERENCE_FIELD_TYPES = new Set(["productmaster", "unitmaster", "accountmaster", "custommaster"]);
const STATE_CITY_REFERENCE_FIELD_TYPES = new Set(["statemaster", "citymaster"]);
const EMPLOYEE_REFERENCE_FIELD_TYPES = new Set(["customemployeemaster", "employeemaster", "teamemployeemaster"]);
const GST_NUMBER_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// BOOLEAN HELPER
const isTrueAccountValue = (value: any) => {
    if (value === true || value === 1) return true;

    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "active";
};

// FIELD TYPE
const getAccountFieldType = (field: any) => {
    return String(field?.type || field?.dataSource?.type || "").trim().toLowerCase();
};

// REFERENCE FIELD HELPERS
const isCodeNameReferenceField = (field: any) => CODE_NAME_REFERENCE_FIELD_TYPES.has(getAccountFieldType(field));
const isStateCityReferenceField = (field: any) => STATE_CITY_REFERENCE_FIELD_TYPES.has(getAccountFieldType(field));
const isEmployeeReferenceField = (field: any) => EMPLOYEE_REFERENCE_FIELD_TYPES.has(getAccountFieldType(field));
const isMasterReferenceField = (field: any) => isCodeNameReferenceField(field) || isStateCityReferenceField(field) || isEmployeeReferenceField(field);

// LOCAL STORAGE USER
const findUserObjectWithMobile = (value: any): any => {
    if (!value || typeof value !== "object") return null;

    if (String(value?.userMobileNumberHash || "").trim()) return value;

    const nestedCandidates = [
        value?.user,
        value?.data,
        value?.result,
        value?.professionalUser,
        value?.loggedInUser,
        value?.currentUser,
        value?.authUser,
        value?.profile,
        value?.data?.user,
        value?.data?.professionalUser,
    ];

    for (const candidate of nestedCandidates) {
        const found = findUserObjectWithMobile(candidate);
        if (found) return found;
    }

    return null;
};

const getProfessionalUserFromStorage = () => {
    if (typeof window === "undefined" || !window.localStorage) return null;

    const preferredKeys = ["professionalUser", "user", "userData", "loggedInUser", "currentUser", "authUser", "profile"];

    for (const key of preferredKeys) {
        const rawValue = localStorage.getItem(key);
        if (!rawValue) continue;

        try {
            const parsedValue = JSON.parse(rawValue);
            const foundUser = findUserObjectWithMobile(parsedValue);
            if (foundUser) return foundUser;
        } catch { }
    }

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key) continue;

        const rawValue = localStorage.getItem(key);
        if (!rawValue) continue;

        try {
            const parsedValue = JSON.parse(rawValue);
            const foundUser = findUserObjectWithMobile(parsedValue);
            if (foundUser) return foundUser;
        } catch { }
    }

    const directMobile = String(localStorage.getItem("userMobileNumberHash") || "").trim();

    if (directMobile) {
        return {
            userMobileNumberHash: directMobile,
            parentUserMobileNumber: directMobile,
        };
    }

    return null;
};

// RESOLVE DATASOURCE PLACEHOLDERS
const resolveAccountDataSourceApi = (rawApi: string) => {
    const storedUser = getProfessionalUserFromStorage();
    const userMobileNumberHash = String(storedUser?.userMobileNumberHash || "").trim();
    const parentUserMobileNumber = String(storedUser?.parentUserMobileNumber || userMobileNumberHash || "").trim();

    let resolvedApi = String(rawApi || "").trim();

    if (userMobileNumberHash) {
        resolvedApi = resolvedApi.replace(/\{userMobileNumberHash\}/g, encodeURIComponent(userMobileNumberHash));
    }

    if (parentUserMobileNumber) {
        resolvedApi = resolvedApi.replace(/\{parentUserMobileNumber\}/g, encodeURIComponent(parentUserMobileNumber));
    }

    return resolvedApi;
};

const buildAccountDataSourceRequestPath = (rawApi: string) => {
    const resolvedApi = resolveAccountDataSourceApi(rawApi);

    if (!resolvedApi) return "";

    const backendPrefix = "eTaxSolnMongoApiBackend";
    const axiosBaseUrl = String(professionalAxios?.defaults?.baseURL || "").trim();
    const baseAlreadyHasBackendPrefix = /\/eTaxSolnMongoApiBackend\/?$/i.test(axiosBaseUrl);

    if (/^https?:\/\//i.test(resolvedApi)) {
        try {
            const parsedUrl = new URL(resolvedApi);
            const cleanPath = parsedUrl.pathname.replace(/^\/+/, "");

            if (cleanPath.includes(backendPrefix)) return resolvedApi;

            const pathParts = cleanPath.split("/");
            const sandboxIndex = pathParts.findIndex((part) => part.toLowerCase() === "sandbox");

            if (sandboxIndex >= 0) {
                pathParts.splice(sandboxIndex + 1, 0, backendPrefix);
            } else {
                pathParts.unshift(backendPrefix);
            }

            parsedUrl.pathname = `/${pathParts.join("/")}`;

            return parsedUrl.toString();
        } catch (error) {
            console.error("Invalid datasource URL:", resolvedApi, error);
            return "";
        }
    }

    let relativeApi = resolvedApi.trim().replace(/^\/+/, "").replace(/^SandBox\//i, "");

    if (baseAlreadyHasBackendPrefix) {
        relativeApi = relativeApi.replace(/^eTaxSolnMongoApiBackend\/?/i, "");
        return relativeApi;
    }

    if (!relativeApi.toLowerCase().startsWith(backendPrefix.toLowerCase())) {
        relativeApi = `${backendPrefix}/${relativeApi}`;
    }

    return relativeApi;
};

// EXTRACT DATASOURCE RECORDS
const getAccountDataSourceRecords = (responseData: any): any[] => {
    const possibleRoots = [responseData, responseData?.data, responseData?.result, responseData?.payload, responseData?.data?.data];
    const possibleArrayKeys = ["items", "records", "users", "accounts", "products", "units", "states", "cities", "docs"];

    for (const root of possibleRoots) {
        if (Array.isArray(root)) return root;

        if (root && typeof root === "object") {
            for (const key of possibleArrayKeys) {
                if (Array.isArray(root?.[key])) return root[key];
            }
        }
    }

    return [];
};

// REFERENCE LABEL / VALUE FIELDS
const getDefaultReferenceFields = (field: any) => {
    const fieldType = getAccountFieldType(field);

    let labelField = String(field?.labelField || field?.dataSource?.labelField || "").trim();
    let valueField = String(field?.valueField || field?.dataSource?.valueField || "").trim();

    if (fieldType === "productmaster") {
        labelField = labelField || "productName";
        valueField = valueField || "productCode";
    }

    if (fieldType === "unitmaster") {
        labelField = labelField || "unitName";
        valueField = valueField || "unitCode";
    }

    if (fieldType === "accountmaster") {
        labelField = labelField || "accountName";
        valueField = valueField || "accountCode";
    }

    if (fieldType === "custommaster") {
        labelField = labelField || "name";
        valueField = valueField || "code";
    }

    if (fieldType === "statemaster") {
        labelField = labelField || "name";
        valueField = valueField || "isoCode";
    }

    if (fieldType === "citymaster") {
        labelField = labelField || "name";
        valueField = valueField || "name";
    }

    if (EMPLOYEE_REFERENCE_FIELD_TYPES.has(fieldType)) {
        labelField = labelField || "userFirstName";
        valueField = valueField || "userMobileNumberHash";
    }

    return {
        labelField: labelField || "name",
        valueField: valueField || "code",
    };
};

// BUILD OPTION FROM DATASOURCE RECORD
const buildAccountReferenceOption = (field: any, item: any) => {
    const fieldType = getAccountFieldType(field);
    const { labelField, valueField } = getDefaultReferenceFields(field);
    const dynamicData = item?.data || item?.dynamicFields || item?.customFields || {};

    let optionLabel = item?.[labelField] ?? dynamicData?.[labelField] ?? "";
    let optionValue = item?.[valueField] ?? dynamicData?.[valueField] ?? "";

    if (fieldType === "productmaster") {
        optionLabel = item?.productName || getDisplayName(item?.name) || optionLabel;
        optionValue = item?.productCode || item?.code || optionValue;
    }

    if (fieldType === "unitmaster") {
        optionLabel = item?.unitName || getDisplayName(item?.name) || optionLabel;
        optionValue = item?.unitCode || item?.code || optionValue;
    }

    if (fieldType === "accountmaster") {
        optionLabel = item?.accountName || getDisplayName(item?.name) || optionLabel;
        optionValue = item?.accountCode || item?.code || optionValue;
    }

    if (fieldType === "custommaster") {
        optionLabel = dynamicData?.name || dynamicData?.vehicle_number || item?.name || item?.moduleName || optionLabel;
        optionValue = dynamicData?.code || item?.code || item?.voucherNumber || item?._id || optionValue;
    }

    if (fieldType === "statemaster") {
        optionLabel = getDisplayName(item?.name || item?.stateName) || optionLabel;
        optionValue = item?.stateCode || item?.isoCode || item?.code || optionValue;
    }

    if (fieldType === "citymaster") {
        optionLabel = getDisplayName(item?.name || item?.cityName) || optionLabel;
        optionValue = optionLabel || optionValue;
    }

    if (EMPLOYEE_REFERENCE_FIELD_TYPES.has(fieldType)) {
        optionLabel = [item?.userFirstName, item?.userMiddleName, item?.userLastName].filter(Boolean).join(" ").trim();
        optionValue = item?.userMobileNumberHash || item?.mobile || optionValue;
    }

    const finalValue = String(optionValue ?? "").trim();

    if (!finalValue) return null;

    return {
        label: String(getDisplayName(optionLabel) || finalValue),
        value: finalValue,
        raw: item,
    };
};

// EXTRACT CHILD USERS FROM EMPLOYEE API RESPONSE
const getEmployeeChildUsers = (responseData: any): any[] => {
    const result = Array.isArray(responseData?.result)
        ? responseData.result
        : Array.isArray(responseData?.data?.result)
            ? responseData.data.result
            : [];

    return result.flatMap((record: any) => Array.isArray(record?.ChildUsers) ? record.ChildUsers : []);
};

// LOAD DATASOURCE OPTIONS FOR SCHEMA FIELDS
const loadAccountSchemaOptions = async (fields: any[]) => {
    return Promise.all(
        (Array.isArray(fields) ? fields : []).map(async (field: any) => {
            const rawApi = String(field?.api || field?.dataSource?.api || "").trim();

            if (!rawApi) {
                return {
                    ...field,
                    options: Array.isArray(field?.options) ? field.options : [],
                };
            }

            const requestPath = buildAccountDataSourceRequestPath(rawApi);

            if (!requestPath) {
                return { ...field, options: [] };
            }

            if (/\{[^}]+\}/.test(requestPath)) {
                console.error(`Datasource placeholder value missing for field "${field.key}":`, requestPath);
                return { ...field, options: [] };
            }

            try {
                console.log("ACCOUNT DATASOURCE REQUEST:", requestPath);

                const response = await professionalAxios.get(requestPath, {
                    params: field?.queryParams || field?.dataSource?.queryParams || {},
                });

                const fieldType = getAccountFieldType(field);

                let records: any[] = [];

                if (EMPLOYEE_REFERENCE_FIELD_TYPES.has(fieldType)) {
                    records = getEmployeeChildUsers(response?.data);
                } else {
                    records = getAccountDataSourceRecords(response?.data);
                }

                console.log(`DATASOURCE RECORDS FOR ${field.key}:`, records);

                const options = records.map((item: any) => buildAccountReferenceOption(field, item)).filter(Boolean);

                return {
                    ...field,
                    api: requestPath,
                    options,
                };
            } catch (error: any) {
                console.error(`Failed to load datasource for field "${field.key}":`, error?.response?.data || error);

                return {
                    ...field,
                    api: requestPath,
                    options: [],
                };
            }
        })
    );
};

// BUILD EMPTY ACCOUNT FORM
const buildEmptyAccountForm = (fields: any[] = []) => {
    return (Array.isArray(fields) ? fields : []).reduce((accumulator: Record<string, any>, field: any) => {
        const fieldType = getAccountFieldType(field);

        if (fieldType === "boolean") {
            accumulator[field.key] = false;
        } else if (isMasterReferenceField(field)) {
            accumulator[field.key] = null;
        } else {
            accumulator[field.key] = "";
        }

        return accumulator;
    }, {});
};

// FORCE MASTER REFERENCE FIELDS INTO dynamicFields
const DYNAMIC_MASTER_FIELD_TYPES = new Set([
    "accountmaster",
    "productmaster",
    "unitmaster",
    "employeemaster",
    "customemployeemaster",
    "teamemployeemaster",
]);

// SCHEMA isDefault HELPER
const isSchemaDefaultFalse = (field: any) => {
    const value = field?.isDefault;

    if (value === false || value === 0 || value === "0") return true;

    return typeof value === "string" && value.trim().toLowerCase() === "false";
};

// DYNAMIC ACCOUNT FIELD CHECK
const isDynamicAccountSchemaField = (field: any) => {
    const fieldType = getAccountFieldType(field);

    if (DYNAMIC_MASTER_FIELD_TYPES.has(fieldType)) return true;
    if (isSchemaDefaultFalse(field)) return true;
    if (field?.isDynamic === true) return true;
    if (field?.isDynamicField === true) return true;
    if (field?.isCustomField === true) return true;
    if (field?.source === "dynamic") return true;
    if (field?.fieldSource === "dynamic") return true;

    if (field?.isDefault === true || String(field?.isDefault ?? "").trim().toLowerCase() === "true") return false;
    if (field?.isDynamic === false) return false;
    if (field?.isSystemField === true) return false;

    return !ACCOUNT_SYSTEM_FIELD_KEYS.has(field?.key);
};

// NORMALIZE ACCOUNT FIELD VALUE
const normalizeAccountFieldValue = (field: any, value: any) => {
    const fieldType = getAccountFieldType(field);

    if (CODE_NAME_REFERENCE_FIELD_TYPES.has(fieldType)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            return {
                code: value?.code || value?.productCode || value?.unitCode || value?.accountCode || value?.voucherNumber || value?.value || value?._id || "",
                name: getDisplayName(value?.name || value?.productName || value?.unitName || value?.accountName || value?.vehicle_number || value?.moduleName || value?.label),
            };
        }

        return null;
    }

    if (fieldType === "statemaster") {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            return {
                stateCode: value?.stateCode || value?.isoCode || value?.code || value?.value || "",
                name: getDisplayName(value?.name || value?.stateName || value?.label),
            };
        }

        return null;
    }

    if (fieldType === "citymaster") {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            return {
                stateCode: value?.stateCode || value?.state?.isoCode || value?.state?.stateCode || "",
                name: getDisplayName(value?.name || value?.cityName || value?.label),
            };
        }

        return null;
    }

    if (EMPLOYEE_REFERENCE_FIELD_TYPES.has(fieldType)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            return {
                userMobileNumberHash: value?.userMobileNumberHash || value?.mobile || value?.value || "",
                userFirstName: value?.userFirstName || value?.firstName || "",
                userMiddleName: value?.userMiddleName || value?.middleName || "",
                userLastName: value?.userLastName || value?.lastName || "",
                userType: value?.userType || value?.type || "",
                parentUserMobileNumber: value?.parentUserMobileNumber || value?.parentMobile || "",
            };
        }

        return null;
    }

    if (fieldType === "number" && value !== "" && value !== null && value !== undefined) return Number(value);
    if (fieldType === "boolean") return isTrueAccountValue(value);

    return value ?? "";
};

// GET FIELD VALUE FROM ACCOUNT
const getAccountSchemaFieldValue = (field: any, account: any) => {
    const key = field.key;
    const hasTopLevelValue = Object.prototype.hasOwnProperty.call(account || {}, key);
    const hasDynamicValue = Object.prototype.hasOwnProperty.call(account?.dynamicFields || {}, key);

    let value: any = "";

    if (hasTopLevelValue) {
        value = account?.[key];
    } else if (hasDynamicValue) {
        value = account?.dynamicFields?.[key];
    }

    return normalizeAccountFieldValue(field, value);
};

// GET REFERENCE SELECT VALUE
const getMasterReferenceSelectValue = (field: any, value: any) => {
    if (!value) return "";
    if (typeof value !== "object") return String(value);

    const fieldType = getAccountFieldType(field);

    if (fieldType === "statemaster") {
        return String(value?.stateCode || value?.isoCode || value?.code || value?.value || "");
    }

    if (fieldType === "citymaster") {
        return String(getDisplayName(value?.name || value?.cityName || value?.value));
    }

    if (EMPLOYEE_REFERENCE_FIELD_TYPES.has(fieldType)) {
        return String(value?.userMobileNumberHash || value?.mobile || value?.value || "");
    }

    return String(value?.code || value?.productCode || value?.unitCode || value?.accountCode || value?.voucherNumber || value?.value || value?._id || "");
};

// BUILD REFERENCE VALUE FOR PAYLOAD
const getMasterReferenceValue = (field: any, option: any, fallbackValue = "") => {
    const fieldType = getAccountFieldType(field);
    const raw = option?.raw || {};

    if (fieldType === "productmaster") {
        return {
            code: raw?.productCode || raw?.code || option?.value || fallbackValue,
            name: getDisplayName(raw?.productName || raw?.name || option?.label),
        };
    }

    if (fieldType === "unitmaster") {
        return {
            code: raw?.unitCode || raw?.code || option?.value || fallbackValue,
            name: getDisplayName(raw?.unitName || raw?.name || option?.label),
        };
    }

    if (fieldType === "accountmaster") {
        return {
            code: raw?.accountCode || raw?.code || option?.value || fallbackValue,
            name: getDisplayName(raw?.accountName || raw?.name || option?.label),
        };
    }

    if (fieldType === "custommaster") {
        const dynamicData = raw?.data || raw?.dynamicFields || raw?.customFields || raw;

        return {
            code: dynamicData?.code || raw?.code || raw?.voucherNumber || raw?._id || option?.value || fallbackValue,
            name: getDisplayName(dynamicData?.name || dynamicData?.vehicle_number || raw?.name || option?.label),
        };
    }

    if (fieldType === "statemaster") {
        return {
            stateCode: raw?.stateCode || raw?.isoCode || raw?.code || option?.value || fallbackValue,
            name: getDisplayName(raw?.name || raw?.stateName || option?.label),
        };
    }

    if (fieldType === "citymaster") {
        return {
            stateCode: raw?.stateCode || raw?.state?.isoCode || raw?.state?.stateCode || "",
            name: getDisplayName(raw?.name || raw?.cityName || option?.label),
        };
    }

    if (EMPLOYEE_REFERENCE_FIELD_TYPES.has(fieldType)) {
        return {
            userMobileNumberHash: raw?.userMobileNumberHash || raw?.mobile || option?.value || fallbackValue,
            userFirstName: raw?.userFirstName || raw?.firstName || "",
            userMiddleName: raw?.userMiddleName || raw?.middleName || "",
            userLastName: raw?.userLastName || raw?.lastName || "",
            userType: raw?.userType || raw?.type || "",
            parentUserMobileNumber: raw?.parentUserMobileNumber || raw?.parentMobile || "",
        };
    }

    return null;
};

// COMPARE VALUES
const areAccountFieldValuesEqual = (firstValue: any, secondValue: any) => {
    if (typeof firstValue === "object" || typeof secondValue === "object") {
        return JSON.stringify(firstValue ?? null) === JSON.stringify(secondValue ?? null);
    }

    return firstValue === secondValue;
};

// ACCOUNT MASTER MODAL
const AccountMasterModal = ({ show, setShow, editingAccount = null, onSaved, title }: AccountMasterModalProps) => {
    const dispatch = useDispatch<any>();

    const { accountMasterSchemaFields = [], schemaLoading } = useSelector((state: any) => state.accountMaster || {});
    const { states = [], cities = [] } = useSelector((state: any) => state.stateCity || {});

    const [form, setForm] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [pendingCity, setPendingCity] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loadedSchemaFields, setLoadedSchemaFields] = useState<any[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsReady, setOptionsReady] = useState(false);

    // GST VERIFY
    const [gstVerifying, setGstVerifying] = useState(false);
    const [verifiedGST, setVerifiedGST] = useState<{ gstin: string; status: string; name: string } | null>(null);
    const lastGSTVerifiedRef = useRef("");

    const schemaFields = useMemo(() => {
        if (optionsReady) return loadedSchemaFields;
        return Array.isArray(accountMasterSchemaFields) ? accountMasterSchemaFields : [];
    }, [optionsReady, loadedSchemaFields, accountMasterSchemaFields]);

    // CUSTOM MASTER MULTI SELECT
    const isCustomMasterMultiSelectField = (field: any) => {
        const fieldType = getAccountFieldType(field);
        const selectionType = String(field?.selectionType || field?.dataSource?.selectionType || "").trim().toLowerCase();

        return fieldType === "custommaster" && selectionType === "multiselect";
    };

    // FETCH ACCOUNT SCHEMA AND STATES
    useEffect(() => {
        if (!show) return;

        dispatch(getAllAccountMasterSchema({ offset: 0, limit: 500 }) as any);
        // @ts-ignore 
        dispatch(getStates() as any);
    }, [dispatch, show]);

    // LOAD SCHEMA DATASOURCE OPTIONS
    useEffect(() => {
        if (!show) {
            setLoadedSchemaFields([]);
            setOptionsLoading(false);
            setOptionsReady(false);
            return;
        }

        if (!Array.isArray(accountMasterSchemaFields) || accountMasterSchemaFields.length === 0) {
            if (!schemaLoading) {
                setLoadedSchemaFields([]);
                setOptionsReady(true);
            }

            return;
        }

        let isMounted = true;

        const loadOptions = async () => {
            setOptionsLoading(true);
            setOptionsReady(false);

            try {
                const fieldsWithOptions = await loadAccountSchemaOptions(accountMasterSchemaFields);

                if (!isMounted) return;

                setLoadedSchemaFields(fieldsWithOptions);
            } catch (error) {
                console.error("Failed to prepare Account Master schema options:", error);

                if (!isMounted) return;

                setLoadedSchemaFields(accountMasterSchemaFields);
            } finally {
                if (isMounted) {
                    setOptionsLoading(false);
                    setOptionsReady(true);
                }
            }
        };

        loadOptions();

        return () => {
            isMounted = false;
        };
    }, [show, schemaLoading, accountMasterSchemaFields]);

    // INITIALIZE CREATE / EDIT FORM
    useEffect(() => {
        if (!show || !optionsReady || schemaFields.length === 0) return;

        setErrors({});
        setPendingCity("");
        setVerifiedGST(null);
        setGstVerifying(false);
        lastGSTVerifiedRef.current = "";

        const nextForm = buildEmptyAccountForm(schemaFields);

        schemaFields.forEach((field: any) => {
            if (isCustomMasterMultiSelectField(field) && !Array.isArray(nextForm[field.key])) {
                nextForm[field.key] = [];
            }
        });

        if (!editingAccount) {
            setForm(nextForm);
            return;
        }

        let existingCity = "";

        schemaFields.forEach((field: any) => {
            const key = field.key;

            if (key === "state") {
                nextForm.state =
                    typeof editingAccount.state === "object"
                        ? editingAccount?.state?.isoCode || editingAccount?.state?.stateCode || editingAccount?.state?.code || ""
                        : editingAccount?.state || "";

                return;
            }

            if (key === "city") {
                existingCity =
                    typeof editingAccount.city === "object"
                        ? getDisplayName(editingAccount?.city?.name || editingAccount?.city?.cityName)
                        : editingAccount?.city || "";

                nextForm.city = "";
                return;
            }

            if (key === "accountType") {
                nextForm.accountType = editingAccount?.accountType ? String(editingAccount.accountType).toLowerCase() : "";
                return;
            }

            const existingValue = getAccountSchemaFieldValue(field, editingAccount);

            if (isCustomMasterMultiSelectField(field)) {
                const dynamicValue = editingAccount?.dynamicFields?.[key];

                if (Array.isArray(existingValue)) {
                    nextForm[key] = existingValue;
                } else if (Array.isArray(dynamicValue)) {
                    nextForm[key] = dynamicValue;
                } else {
                    nextForm[key] = [];
                }

                return;
            }

            nextForm[key] = existingValue;
        });

        setForm(nextForm);
        setPendingCity(existingCity);

        if (nextForm.state) {
            dispatch(getCitiesByState({ stateCode: nextForm.state, searchText: "" }) as any);
        }
    }, [show, editingAccount, optionsReady, schemaFields, dispatch]);

    // FETCH CITIES WHEN SYSTEM STATE CHANGES
    useEffect(() => {
        if (!show || !form.state) return;

        dispatch(getCitiesByState({ stateCode: form.state, searchText: "" }) as any);
    }, [dispatch, show, form.state]);

    // SET EDIT CITY
    useEffect(() => {
        if (!pendingCity || !Array.isArray(cities) || cities.length === 0) return;

        const cityExists = cities.some((item: any) => {
            return getDisplayName(item?.name || item?.cityName) === pendingCity;
        });

        if (!cityExists) return;

        setForm((previous) => ({
            ...previous,
            city: pendingCity,
        }));

        setPendingCity("");
    }, [cities, pendingCity]);

    // AUTO VERIFY GST
    useEffect(() => {
        if (!show) return;

        const gstNumber = String(form?.gstNumber || "").trim().toUpperCase();

        if (!gstNumber) {
            setVerifiedGST(null);
            setGstVerifying(false);
            lastGSTVerifiedRef.current = "";
            return;
        }

        // Do not call API until complete valid GSTIN
        if (!GST_NUMBER_REGEX.test(gstNumber)) {
            setVerifiedGST(null);
            setGstVerifying(false);
            return;
        }

        // Do not call same GST again
        if (lastGSTVerifiedRef.current === gstNumber) return;

        let active = true;

        const timer = setTimeout(async () => {
            setGstVerifying(true);
            setVerifiedGST(null);
            setErrors((previous) => ({ ...previous, gstNumber: "" }));

            try {
                const response = await dispatch(getGSTNumberDetails(gstNumber) as any).unwrap();
                const taxpayerInfo = response?.taxpayerInfo || response?.data?.taxpayerInfo;

                if (!taxpayerInfo?.gstin) {
                    throw new Error("GST details not found");
                }

                if (!active) return;

                const gstInfo = {
                    gstin: String(taxpayerInfo?.gstin || gstNumber).trim().toUpperCase(),
                    status: String(taxpayerInfo?.sts || "").trim(),
                    name: String(taxpayerInfo?.lgnm || taxpayerInfo?.tradeNam || "").trim(),
                };

                setVerifiedGST(gstInfo);
                lastGSTVerifiedRef.current = gstNumber;
            } catch (error: any) {
                if (!active) return;

                const message = error?.message || error?.response?.data?.message || error?.payload?.message || "GST verification failed";

                setVerifiedGST(null);
                lastGSTVerifiedRef.current = "";
                setErrors((previous) => ({ ...previous, gstNumber: message }));
            } finally {
                if (active) setGstVerifying(false);
            }
        }, 500);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [form?.gstNumber, show, dispatch]);

    // GET FIELD OPTIONS
    const getFieldOptions = (field: any) => {
        if (field.key === "state") {
            return (Array.isArray(states) ? states : []).map((item: any) => {
                const stateCode = item?.isoCode || item?.stateCode || item?.code || "";
                const stateName = getDisplayName(item?.name || item?.stateName);

                return {
                    value: String(stateCode),
                    label: stateName || String(stateCode),
                    raw: item,
                };
            });
        }

        if (field.key === "city") {
            return (Array.isArray(cities) ? cities : []).map((item: any) => {
                const cityName = getDisplayName(item?.name || item?.cityName);

                return {
                    value: cityName,
                    label: cityName,
                    raw: item,
                };
            });
        }

        if (field.key === "accountType") {
            return (Array.isArray(field?.options) ? field.options : []).map((option: any) => {
                const label = typeof option === "object" ? option?.label || option?.name || option?.value || "" : option;
                const value = typeof option === "object" ? option?.value || option?.code || option?.name || label : option;

                return {
                    label: String(label),
                    value: String(value).toLowerCase(),
                };
            });
        }

        return (Array.isArray(field?.options) ? field.options : [])
            .map((option: any) => {
                if (typeof option === "object" && option !== null) {
                    return {
                        ...option,
                        value: String(option?.value || option?.code || option?.name || ""),
                        label: String(option?.label || option?.name || option?.value || option?.code || ""),
                        raw: option?.raw || option,
                    };
                }

                return {
                    value: String(option),
                    label: String(option),
                    raw: option,
                };
            })
            .filter((option: any) => option.value);
    };

    // NORMALIZE VALUE FOR PAYLOAD
    const normalizeModalAccountFieldValue = (field: any, value: any) => {
        if (!isCustomMasterMultiSelectField(field)) {
            return normalizeAccountFieldValue(field, value);
        }

        const options = getFieldOptions(field);
        const selectedValues = Array.isArray(value) ? value : [];

        return selectedValues
            .map((item: any) => {
                if (item && typeof item === "object" && !Array.isArray(item)) {
                    const code = String(item?.code || item?.value || item?._id || "").trim();

                    if (!code) return null;

                    const selectedOption = options.find((option: any) => String(option?.value) === code);

                    const name = getDisplayName(
                        item?.name ||
                        item?.label ||
                        selectedOption?.raw?.name ||
                        selectedOption?.raw?.moduleName ||
                        selectedOption?.label ||
                        ""
                    );

                    return { code, name };
                }

                const code = String(item ?? "").trim();

                if (!code) return null;

                const selectedOption = options.find((option: any) => String(option?.value) === code);

                return {
                    code,
                    name: getDisplayName(
                        selectedOption?.raw?.name ||
                        selectedOption?.raw?.moduleName ||
                        selectedOption?.label ||
                        ""
                    ),
                };
            })
            .filter(Boolean);
    };

    // FIELD CHANGE
    const handleFieldChange = (field: any, value: any) => {
        const nextValue =
            field.key === "gstNumber"
                ? String(value ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15)
                : value;

        setForm((previous) => ({
            ...previous,
            [field.key]: nextValue,
            ...(field.key === "state" ? { city: "" } : {}),
        }));

        setErrors((previous) => ({
            ...previous,
            [field.key]: "",
            ...(field.key === "state" ? { city: "" } : {}),
        }));

        if (field.key === "state") {
            setPendingCity("");
        }

        if (field.key === "gstNumber") {
            setVerifiedGST(null);
            lastGSTVerifiedRef.current = "";
        }
    };

    // RENDER FIELD
    const renderSchemaField = (field: any) => {
        const fieldType = getAccountFieldType(field);
        const value = form?.[field.key] ?? "";
        const mandatory = isTrueAccountValue(field?.isRequired) || isTrueAccountValue(field?.required);
        const error = errors?.[field.key];

        const disabled = Boolean(
            field?.disabled ||
            field?.isReadonly ||
            submitting
        );

        if (fieldType === "select") {
            const options = getFieldOptions(field);

            return (
                <SelectInput
                    key={field.key}
                    name={field.key}
                    label={field.label}
                    mandatory={mandatory}
                    value={value}
                    placeholder={`Select ${field.label}`}
                    error={error}
                    disabled={disabled || (field.key === "city" && !form.state)}
                    options={[
                        {
                            value: "",
                            label: field.key === "city" && !form.state ? "Select state first" : `Select ${field.label}`,
                        },
                        ...options,
                    ]}
                    onChange={(event: any) => handleFieldChange(field, event?.target?.value ?? "")}
                />
            );
        }

        if (isMasterReferenceField(field)) {
            const options = getFieldOptions(field);
            const isMultiSelect = isCustomMasterMultiSelectField(field);

            const selectedValue = isMultiSelect
                ? (
                    Array.isArray(form?.[field.key])
                        ? form[field.key]
                            .map((item: any) => {
                                if (item && typeof item === "object") {
                                    return String(item?.code || item?.value || item?._id || "");
                                }

                                return String(item ?? "");
                            })
                            .filter(Boolean)
                        : []
                )
                : getMasterReferenceSelectValue(field, form?.[field.key]);

            const selectOptions = isMultiSelect
                ? options
                : [
                    {
                        value: "",
                        label: optionsLoading
                            ? `Loading ${field.label}...`
                            : options.length > 0
                                ? `Select ${field.label}`
                                : `No ${field.label} found`,
                    },
                    ...options,
                ];

            return (
                <SelectInput
                    key={field.key}
                    name={field.key}
                    label={field.label}
                    mandatory={mandatory}
                    value={selectedValue}
                    placeholder={`Select ${field.label}`}
                    error={error}
                    largeData={true}
                    isMulti={isMultiSelect}
                    disabled={disabled || optionsLoading}
                    options={selectOptions}
                    onChange={(event: any) => {
                        const nextValue = event?.target?.value;

                        if (isMultiSelect) {
                            const selectedCodes = Array.isArray(nextValue) ? nextValue : [];

                            const selectedReferences = selectedCodes
                                .map((selectedCode: any) => {
                                    const selectedOption = options.find((option: any) => String(option?.value) === String(selectedCode));

                                    return getMasterReferenceValue(field, selectedOption, selectedCode);
                                })
                                .filter((item: any) => item && String(item?.code || "").trim());

                            handleFieldChange(field, selectedReferences);
                            return;
                        }

                        const singleValue = nextValue ?? "";

                        if (!singleValue) {
                            handleFieldChange(field, null);
                            return;
                        }

                        const selectedOption = options.find((option: any) => String(option?.value) === String(singleValue));

                        handleFieldChange(
                            field,
                            getMasterReferenceValue(field, selectedOption, singleValue)
                        );
                    }}
                />
            );
        }

        if (fieldType === "boolean") {
            const booleanValue = isTrueAccountValue(form?.[field.key]);

            return (
                <ToggleInput
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    value={booleanValue}
                    checked={booleanValue}
                    mandatory={mandatory}
                    error={error}
                    disabled={disabled}
                    onChange={(event: any) => handleFieldChange(field, event?.target?.checked ?? false)}
                />
            );
        }

        if (fieldType === "textarea") {
            return (
                <TextArea
                    key={field.key}
                    label={field.label}
                    mandatory={mandatory}
                    value={value}
                    placeholder={field?.placeholder || `Enter ${field.label}`}
                    error={error}
                    disabled={disabled}
                    onChange={(event: any) => handleFieldChange(field, event.target.value)}
                />
            );
        }

        if (fieldType === "number") {
            return (
                <TextInput
                    key={field.key}
                    label={field.label}
                    mandatory={mandatory}
                    value={value}
                    placeholder={field?.placeholder || `Enter ${field.label}`}
                    error={error}
                    disabled={disabled}
                    type="number"
                    onChange={(event: any) => handleFieldChange(field, event.target.value)}
                />
            );
        }

        if (fieldType === "date") {
            return (
                <TextInput
                    key={field.key}
                    label={field.label}
                    mandatory={mandatory}
                    value={value}
                    placeholder={field?.placeholder || `Select ${field.label}`}
                    error={error}
                    disabled={disabled}
                    type="date"
                    onChange={(event: any) => handleFieldChange(field, event.target.value)}
                />
            );
        }

        // GST NUMBER AUTO VERIFY
        if (field.key === "gstNumber") {
            const currentGST = String(value || "").trim().toUpperCase();
            const isVerified = verifiedGST?.gstin === currentGST;
            const isActive = String(verifiedGST?.status || "").trim().toLowerCase() === "active";

            return (
                <div key={field.key} className="min-w-0">
                    <TextInput
                        label={field.label}
                        mandatory={mandatory}
                        value={value}
                        placeholder={field?.placeholder || `Enter ${field.label}`}
                        error={error}
                        disabled={disabled}
                        type="text"
                        onChange={(event: any) => handleFieldChange(field, event.target.value)}
                    />

                    {gstVerifying && (
                        <div className="mt-1 text-xs text-muted-foreground">
                            Fetching GST details...
                        </div>
                    )}

                    {!gstVerifying && isVerified && (
                        <div className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
                            <div className="font-medium text-card-foreground">
                                Name: {verifiedGST?.name || "-"}
                            </div>

                            <div className={`mt-1 font-medium ${isActive ? "text-emerald-600" : "text-amber-600"}`}>
                                Status: {verifiedGST?.status || "Unknown"}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (field.key === "accountMobile") {
            return (
                <TextInput
                    key={field.key}
                    label={field.label}
                    mandatory={mandatory}
                    value={value}
                    placeholder={field?.placeholder || `Enter ${field.label}`}
                    error={error}
                    disabled={disabled}
                    type="text"
                    onChange={(event: any) =>
                        handleFieldChange(
                            field,
                            event.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                    }
                />
            );
        }

        return (
            <TextInput
                key={field.key}
                label={field.label}
                mandatory={mandatory}
                value={value}
                placeholder={field?.placeholder || `Enter ${field.label}`}
                error={error}
                disabled={disabled}
                type={field.key === "accountEmail" ? "email" : "text"}
                onChange={(event: any) => handleFieldChange(field, event.target.value)}
            />
        );
    };

    // VALIDATE FORM
    const validateForm = () => {
        const validationErrors: Record<string, string> = {};

        schemaFields.forEach((field: any) => {
            const value = form?.[field.key];
            const fieldType = getAccountFieldType(field);

            const required = isTrueAccountValue(field?.isRequired) || isTrueAccountValue(field?.required);

            if (!required) return;

            if (fieldType === "boolean") {
                if (value === undefined || value === null) {
                    validationErrors[field.key] = `${field.label} required`;
                }

                return;
            }

            if (CODE_NAME_REFERENCE_FIELD_TYPES.has(fieldType)) {
                if (isCustomMasterMultiSelectField(field)) {
                    const selectedItems = Array.isArray(value) ? value : [];

                    const hasInvalidItem =
                        selectedItems.length === 0 ||
                        selectedItems.some((item: any) => {
                            return !String(item?.code || "").trim() || !String(item?.name || "").trim();
                        });

                    if (hasInvalidItem) {
                        validationErrors[field.key] = `${field.label} required`;
                    }

                    return;
                }

                if (!value || !String(value?.code || "").trim() || !String(value?.name || "").trim()) {
                    validationErrors[field.key] = `${field.label} required`;
                }

                return;
            }

            if (fieldType === "statemaster") {
                if (!value || !String(value?.stateCode || "").trim() || !String(value?.name || "").trim()) {
                    validationErrors[field.key] = `${field.label} required`;
                }

                return;
            }

            if (fieldType === "citymaster") {
                if (!value || !String(value?.name || "").trim()) {
                    validationErrors[field.key] = `${field.label} required`;
                }

                return;
            }

            if (EMPLOYEE_REFERENCE_FIELD_TYPES.has(fieldType)) {
                if (!value || !String(value?.userMobileNumberHash || "").trim()) {
                    validationErrors[field.key] = `${field.label} required`;
                }

                return;
            }

            if (value === undefined || value === null || String(value).trim() === "") {
                validationErrors[field.key] = `${field.label} required`;
            }
        });

        const mobile = form?.accountMobile;

        if (mobile && !/^\d{10}$/.test(String(mobile))) {
            validationErrors.accountMobile = "Mobile must be 10 digits";
        }

        const email = form?.accountEmail;

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
            validationErrors.accountEmail = "Invalid email address";
        }

        const gstNumber = String(form?.gstNumber || "").trim().toUpperCase();

        if (gstNumber && !GST_NUMBER_REGEX.test(gstNumber)) {
            validationErrors.gstNumber = "Invalid GST Number";
        }

        schemaFields.forEach((field: any) => {
            if (getAccountFieldType(field) !== "number") return;

            const value = form?.[field.key];

            if (value === "" || value === null || value === undefined) return;

            if (Number.isNaN(Number(value))) {
                validationErrors[field.key] = `${field.label} must be a valid number`;
                return;
            }

            if (Number(value) < 0) {
                validationErrors[field.key] = `${field.label} cannot be negative`;
            }
        });

        setErrors(validationErrors);

        return Object.keys(validationErrors).length === 0;
    };

    // SELECTED SYSTEM STATE / CITY
    const findSelectedState = () => {
        return (Array.isArray(states) ? states : []).find((item: any) => {
            const stateCode = item?.isoCode || item?.stateCode || item?.code || "";
            return String(stateCode) === String(form.state || "");
        });
    };

    const findSelectedCity = () => {
        return (Array.isArray(cities) ? cities : []).find((item: any) => {
            const cityName = getDisplayName(item?.name || item?.cityName);
            return cityName === form.city;
        });
    };

    // RESOLVE FIELD VALUE FOR PAYLOAD
    const resolveAccountPayloadFieldValue = (field: any, selectedState: any, selectedCity: any) => {
        const key = field.key;

        let value: any = form?.[key];

        if (key === "state") value = selectedState || form.state;
        if (key === "city") value = selectedCity || form.city;

        value = normalizeModalAccountFieldValue(field, value);

        if (key === "accountType") {
            value = String(value ?? "").toLowerCase();
        }

        return value;
    };

    // SUBMIT
    const handleSubmit = async () => {
        if (
            submitting ||
            schemaLoading ||
            optionsLoading ||
            !optionsReady ||
            !validateForm()
        ) {
            return;
        }

        const selectedState = findSelectedState();
        const selectedCity = findSelectedCity();

        setSubmitting(true);

        try {
            let savedAccount: any;

            if (editingAccount) {
                const updatePayload: Record<string, any> = {};

                const dynamicFields: Record<string, any> = {
                    ...(editingAccount?.dynamicFields || {}),
                };

                let dynamicFieldsChanged = false;

                schemaFields.forEach((field: any) => {
                    const key = field.key;

                    const currentValue = resolveAccountPayloadFieldValue(
                        field,
                        selectedState,
                        selectedCity
                    );

                    if (isDynamicAccountSchemaField(field)) {
                        const hasExistingDynamicValue = Object.prototype.hasOwnProperty.call(
                            editingAccount?.dynamicFields || {},
                            key
                        );

                        const previousRawValue = hasExistingDynamicValue
                            ? editingAccount?.dynamicFields?.[key]
                            : editingAccount?.[key];

                        const oldValue = normalizeModalAccountFieldValue(field, previousRawValue);

                        dynamicFields[key] = currentValue;

                        if (
                            !hasExistingDynamicValue ||
                            !areAccountFieldValuesEqual(currentValue, oldValue)
                        ) {
                            dynamicFieldsChanged = true;
                        }

                        return;
                    }

                    let oldValue = normalizeModalAccountFieldValue(field, editingAccount?.[key]);

                    if (key === "accountType") {
                        oldValue = String(oldValue ?? "").toLowerCase();
                    }

                    if (!areAccountFieldValuesEqual(currentValue, oldValue)) {
                        updatePayload[key] = currentValue;
                    }
                });

                if (dynamicFieldsChanged) {
                    updatePayload.dynamicFields = dynamicFields;
                }

                if (Object.keys(updatePayload).length === 0) {
                    toast.info("No changes found");
                    return;
                }

                savedAccount = await dispatch(
                    updateAccount({
                        accountCode: editingAccount.accountCode,
                        data: updatePayload,
                    }) as any
                ).unwrap();

                toast.success("Account updated successfully");
            } else {
                const payload: Record<string, any> = {};
                const dynamicFields: Record<string, any> = {};

                schemaFields.forEach((field: any) => {
                    const key = field.key;

                    const value = resolveAccountPayloadFieldValue(
                        field,
                        selectedState,
                        selectedCity
                    );

                    if (isDynamicAccountSchemaField(field)) {
                        dynamicFields[key] = value;
                    } else {
                        payload[key] = value;
                    }
                });

                payload.dynamicFields = dynamicFields;

                savedAccount = await dispatch(createAccount(payload) as any).unwrap();

                toast.success("Account created successfully");
            }

            setShow(false);
            setForm(buildEmptyAccountForm(schemaFields));
            setErrors({});
            setPendingCity("");
            setLoadedSchemaFields([]);
            setOptionsLoading(false);
            setOptionsReady(false);

            setVerifiedGST(null);
            setGstVerifying(false);
            lastGSTVerifiedRef.current = "";

            if (onSaved) {
                await onSaved(savedAccount);
            }
        } catch (error: any) {
            const apiErrors =
                error?.error ||
                error?.errors ||
                error?.response?.data?.error ||
                error?.response?.data?.errors ||
                {};

            if (
                apiErrors &&
                typeof apiErrors === "object" &&
                !Array.isArray(apiErrors)
            ) {
                setErrors(apiErrors);
            }

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                (typeof error === "string" ? error : "") ||
                "Account operation failed"
            );
        } finally {
            setSubmitting(false);
        }
    };

    // MODAL VISIBILITY
    const handleModalVisibility = (value: boolean) => {
        if (submitting) return;

        setShow(value);

        if (!value) {
            setErrors({});
            setPendingCity("");
            setLoadedSchemaFields([]);
            setOptionsLoading(false);
            setOptionsReady(false);

            setVerifiedGST(null);
            setGstVerifying(false);
            lastGSTVerifiedRef.current = "";
        }
    };

    const modalLoading =
        schemaLoading ||
        optionsLoading ||
        !optionsReady;

    return (
        <Modal
            show={show}
            setShow={handleModalVisibility}
            handleSubmit={handleSubmit}
            state={Boolean(editingAccount)}
            loader={submitting}
            title={
                title ||
                (
                    editingAccount
                        ? "Account"
                        : "Add New Account"
                )
            }
            body={
                <>
                    {modalLoading ? (
                        <div className="py-6 text-sm text-muted-foreground">
                            Loading account fields...
                        </div>
                    ) : schemaFields.length === 0 ? (
                        <div className="py-6 text-sm text-muted-foreground">
                            Account Master schema fields not found.
                        </div>
                    ) : (
                        schemaFields
                            .filter((field: any) => !isTrueAccountValue(field?.isHidden))
                            .map((field: any) => renderSchemaField(field))
                    )}
                </>
            }
        />
    );
};

export { WarningModel, ListingModel, LogoutModal, AccountMasterModal };