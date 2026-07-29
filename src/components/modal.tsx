import React, { useEffect, useRef, useState } from "react";
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
import { SelectInput, TextArea, TextInput } from "./inputs";

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
    maxWidth?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "full";

    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;

    modalClassName?: string;
    overlayClassName?: string;
    hideFooter?: boolean;
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
}: ModalProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm ${overlayClassName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                        }}
                        className={`
                            relative flex w-full max-h-[90vh] flex-col overflow-hidden
                            rounded-md border border-border bg-card text-card-foreground shadow-2xl
                            ${maxWidthClass[maxWidth] || maxWidthClass["3xl"]}
                            ${modalClassName}
                        `}
                    >
                        {/* Header */}
                        <div
                            className={`flex shrink-0 items-center justify-between border-b border-border bg-secondary px-6 py-3 ${headerClassName}`}
                        >
                            <div>
                                <h2 className="mb-0 text-xl font-semibold text-secondary-foreground">
                                    {state ? `Edit ${title}` : `${title}`}
                                </h2>

                                <p className="text-sm text-muted-foreground">
                                    Fill in the {title.toLowerCase()} details below
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    handleClose();
                                    // @ts-ignore
                                    setShow(false);
                                }}
                                className="cursor-pointer rounded-full p-2 transition hover:bg-muted"
                            >
                                <X size={18} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Body */}
                        <div
                            className={`
                                grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden
                                p-6 text-sm bg-card text-card-foreground
                                ${gridColsClass[gridCols] || gridColsClass[2]}
                                ${bodyClassName}
                            `}
                        >
                            {body}
                        </div>

                        {/* Footer */}
                        {!hideFooter && (
                            <div
                                className={`flex shrink-0 justify-end gap-3 border-t border-border bg-secondary px-6 py-4 ${footerClassName}`}
                            >
                                <SecondaryButton
                                    callBackFn={() => {
                                        handleClose();
                                        // @ts-ignore
                                        setShow(false);
                                    }}
                                    text="Cancel"
                                />

                                <PrimaryButton
                                    disabled={loader}
                                    callBackFn={handleSubmit}
                                    text={
                                        loader
                                            ? "Loading.."
                                            : state
                                                ? "Update"
                                                : "Save"
                                    }
                                />
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;

const LogoutModal = ({
    show,
    setShow,
    loading,
    handleSubmit,
}: any) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                        }}
                        className="relative w-full max-w-md overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-secondary px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                                    <LogOut size={20} className="text-danger" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-secondary-foreground">
                                        Logout
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Confirm logout action
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShow(false)}
                                className="rounded-full p-2 transition hover:bg-muted"
                            >
                                <X size={18} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 bg-card">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to logout from your account?
                                You will need to sign in again to access the
                                dashboard.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 border-t border-border bg-secondary px-6 py-4">
                            <button
                                onClick={() => setShow(false)}
                                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:bg-muted"
                            >
                                Cancel
                            </button>

                            <button
                                disabled={loading}
                                onClick={handleSubmit}
                                className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-danger-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Logging out..." : "Logout"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// warning modal

type NoDataConfirmAlertProps = {
    show: boolean;
    title?: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
    onCancel?: () => void;
    onConfirm?: () => void;
};

const WarningModel = ({ show, title = "No Data Found", message = "Please create at least one record to proceed.",
    cancelText = "Cancel",
    confirmText = "Yes",
    onCancel,
    onConfirm,
}: NoDataConfirmAlertProps) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-md border border-border bg-card p-6 text-center text-card-foreground shadow-2xl">
                <h2 className="text-2xl font-bold text-card-foreground">
                    {title}
                </h2>

                <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {message}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border border-border bg-card px-5 py-3 font-semibold text-card-foreground hover:bg-muted"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ListingModel = ({ show, setShow, title = "No Data Found", report, rowData, downlaodPDF, entryType = "sales-invoice", GstToggle = false }: any) => {
    const dispatch = useDispatch<any>();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
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

            const blobData = await dispatch(reportGeneratePdf({ moduleType: downlaodPDF?.moduleType, templateFileId: selectedTemplate?.templateFileId, CustomerCode: downlaodPDF?.CustomerCode, voucherNumber: downlaodPDF?.voucherNumber })).unwrap();

            downloadBlobPdf({ blobData, fileName: `${rowData?.voucherNumber || "report"}.pdf` });
            setShow(false);
        } catch (error) {
            toast.error("PDF download failed");
            console.error("PDF download failed:", error);
        }

        setLoader(false);
    };

    const handleConfirm = async () => {
        if (isReportDownload) {
            await handleServerPdfDownload();
            return;
        }

        await handleLocalPdfPrint();
    };

    useEffect(() => {
        if (!show) {
            autoPrintDoneRef.current = false;
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
                                        onClick={() => setSelectedTemplate(e)}
                                        className={`rounded-lg p-4 shadow-sm cursor-pointer transition-all duration-200 ${e?.id === selectedTemplate?.id ? "border-2 border-primary bg-primary/10 text-primary shadow-md" : "border border-border bg-card text-card-foreground hover:bg-muted hover:shadow-md"}`}
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
                                        onClick={() => setGstType(option)}
                                        className={`rounded-lg border px-4 py-2 cursor-pointer transition-all ${gstType === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary hover:bg-muted"}`}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-secondary px-6 py-4">
                        <PrimaryButton callBackFn={handleConfirm} text="Confirm" loader={loader} />
                        <SecondaryButton
                            disabled={loader}
                            callBackFn={() => {
                                setShow();
                                setGstType("");
                                setSelectedTemplate(null);
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
    onSaved?: (account?: any) => void;
    title?: string;
};

export const getDisplayName = (name: any) => {
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

export const buildEmptyAccountForm = (fields: any[] = []) => {
    return fields.reduce((acc: any, field: any) => {
        acc[field.key] = "";
        return acc;
    }, {});
};

const AccountMasterModal = ({
    show,
    setShow,
    editingAccount = null,
    onSaved,
    title,
}: AccountMasterModalProps) => {
    const dispatch = useDispatch<any>();

    const {
        accountMasterSchemaFields = [],
        schemaLoading,
    } = useSelector((state: any) => state.accountMaster || {});

    const {
        states = [],
        cities = [],
    } = useSelector((state: any) => state.stateCity || {});

    const [form, setForm] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [pendingCity, setPendingCity] = useState("");
    const [submitting, setSubmitting] = useState(false);

    /* ============================================
       FETCH ACCOUNT SCHEMA AND STATES
    ============================================= */

    useEffect(() => {
        dispatch(
            getAllAccountMasterSchema({
                offset: 0,
                limit: 50,
            }) as any
        );

        dispatch(getStates() as any);
    }, [dispatch]);

    /* ============================================
       INITIALIZE ADD / EDIT FORM
    ============================================= */

    useEffect(() => {
        if (!show || accountMasterSchemaFields.length === 0) return;

        setErrors({});
        setPendingCity("");

        if (!editingAccount) {
            setForm(buildEmptyAccountForm(accountMasterSchemaFields));
            return;
        }

        const nextForm = buildEmptyAccountForm(
            accountMasterSchemaFields
        );

        let existingCity = "";

        accountMasterSchemaFields.forEach((field: any) => {
            const key = field.key;

            if (key === "state") {
                nextForm.state =
                    typeof editingAccount.state === "object"
                        ? editingAccount.state?.isoCode ||
                        editingAccount.state?.stateCode ||
                        editingAccount.state?.code ||
                        ""
                        : editingAccount.state || "";

                return;
            }

            if (key === "city") {
                existingCity =
                    typeof editingAccount.city === "object"
                        ? getDisplayName(
                            editingAccount.city?.name ||
                            editingAccount.city?.cityName
                        )
                        : editingAccount.city || "";

                nextForm.city = "";
                return;
            }

            if (key === "accountType") {
                nextForm.accountType = editingAccount?.accountType
                    ? String(
                        editingAccount.accountType
                    ).toLowerCase()
                    : "";

                return;
            }

            nextForm[key] = editingAccount?.[key] ?? "";
        });

        setForm(nextForm);
        setPendingCity(existingCity);

        if (nextForm.state) {
            dispatch(
                getCitiesByState({
                    stateCode: nextForm.state,
                    searchText: "",
                }) as any
            );
        }
    }, [
        show,
        editingAccount,
        accountMasterSchemaFields,
        dispatch,
    ]);

    /* ============================================
       FETCH CITIES WHEN STATE CHANGES
    ============================================= */

    useEffect(() => {
        if (!show || !form.state) return;

        dispatch(
            getCitiesByState({
                stateCode: form.state,
                searchText: "",
            }) as any
        );
    }, [dispatch, show, form.state]);

    /* ============================================
       SET EDIT CITY AFTER CITY API RESPONSE
    ============================================= */

    useEffect(() => {
        if (!pendingCity || !cities?.length) return;

        const matchedCity = cities.find((item: any) => {
            const cityName = getDisplayName(
                item.name || item.cityName
            );

            return cityName === pendingCity;
        });

        if (!matchedCity) return;

        setForm((previous: any) => ({
            ...previous,
            city: pendingCity,
        }));

        setPendingCity("");
    }, [cities, pendingCity]);

    /* ============================================
       FIELD OPTIONS
    ============================================= */

    const getFieldOptions = (field: any) => {
        if (field.key === "state") {
            return states.map((item: any) => {
                const stateCode =
                    item.isoCode ||
                    item.stateCode ||
                    item.code ||
                    "";

                const stateName = getDisplayName(
                    item.name || item.stateName
                );

                return {
                    value: stateCode,
                    label: stateName || stateCode,
                };
            });
        }

        if (field.key === "city") {
            return cities.map((item: any) => {
                const cityName = getDisplayName(
                    item.name || item.cityName
                );

                return {
                    value: cityName,
                    label: cityName,
                };
            });
        }

        if (field.key === "accountType") {
            return (field.options || []).map((option: any) => {
                const label =
                    typeof option === "object"
                        ? option.label ||
                        option.name ||
                        option.value ||
                        ""
                        : option;

                const value =
                    typeof option === "object"
                        ? option.value ||
                        option.code ||
                        option.name ||
                        label
                        : option;

                return {
                    label,
                    value: String(value).toLowerCase(),
                };
            });
        }

        return (field.options || []).map((option: any) => {
            if (typeof option === "object") {
                return {
                    value:
                        option.value ||
                        option.code ||
                        option.name ||
                        "",
                    label:
                        option.label ||
                        option.name ||
                        option.value ||
                        "",
                };
            }

            return {
                value: option,
                label: option,
            };
        });
    };

    /* ============================================
       FIELD CHANGE
    ============================================= */

    const handleFieldChange = (
        field: any,
        value: any
    ) => {
        setForm((previous: any) => ({
            ...previous,
            [field.key]: value,
            ...(field.key === "state"
                ? {
                    city: "",
                }
                : {}),
        }));

        setErrors((previous: any) => ({
            ...previous,
            [field.key]: "",
            ...(field.key === "state"
                ? {
                    city: "",
                }
                : {}),
        }));

        if (field.key === "state") {
            setPendingCity("");
        }
    };

    /* ============================================
       RENDER SCHEMA FIELD
    ============================================= */

    const renderSchemaField = (field: any) => {
        const value = form?.[field.key] ?? "";

        const commonProps = {
            label: field.label,
            mandatory: field.isRequired,
            value,
            placeholder: `Enter ${field.label}`,
            error: errors?.[field.key],
            disabled:
                field.disabled ||
                field.isReadonly ||
                submitting,
        };

        if (field.type === "select") {
            const options = getFieldOptions(field);

            return (
                <SelectInput
                    key={field.key}
                    label={field.label}
                    mandatory={field.isRequired}
                    value={value}
                    placeholder={`Select ${field.label}`}
                    error={errors?.[field.key]}
                    disabled={
                        field.disabled ||
                        field.isReadonly ||
                        submitting ||
                        (field.key === "city" && !form.state)
                    }
                    onChange={(event: any) =>
                        handleFieldChange(
                            field,
                            event?.target?.value ?? ""
                        )
                    }
                    options={[
                        {
                            value: "",
                            label:
                                field.key === "city" &&
                                    !form.state
                                    ? "Select state first"
                                    : `Select ${field.label}`,
                        },
                        ...options,
                    ]}
                />
            );
        }

        if (field.type === "number") {
            return (
                <TextInput
                    key={field.key}
                    {...commonProps}
                    type="number"
                    onChange={(event: any) =>
                        handleFieldChange(
                            field,
                            event.target.value
                        )
                    }
                />
            );
        }

        if (field.type === "textarea") {
            return (
                <TextArea
                    key={field.key}
                    {...commonProps}
                    onChange={(event: any) =>
                        handleFieldChange(
                            field,
                            event.target.value
                        )
                    }
                />
            );
        }

        if (field.key === "accountMobile") {
            return (
                <TextInput
                    key={field.key}
                    {...commonProps}
                    type="text"
                    onChange={(event: any) =>
                        handleFieldChange(
                            field,
                            event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10)
                        )
                    }
                />
            );
        }

        if (field.key === "accountEmail") {
            return (
                <TextInput
                    key={field.key}
                    {...commonProps}
                    type="email"
                    onChange={(event: any) =>
                        handleFieldChange(
                            field,
                            event.target.value
                        )
                    }
                />
            );
        }

        return (
            <TextInput
                key={field.key}
                {...commonProps}
                type="text"
                onChange={(event: any) =>
                    handleFieldChange(
                        field,
                        event.target.value
                    )
                }
            />
        );
    };

    /* ============================================
       VALIDATE FORM
    ============================================= */

    const validateForm = () => {
        const validationErrors: any = {};

        accountMasterSchemaFields.forEach((field: any) => {
            const value = form?.[field.key];

            if (
                field.isRequired &&
                String(value ?? "").trim() === ""
            ) {
                validationErrors[field.key] =
                    `${field.label} required`;
            }

            if (
                field.key === "accountMobile" &&
                value &&
                !/^\d{10}$/.test(String(value))
            ) {
                validationErrors[field.key] =
                    "Mobile must be 10 digits";
            }

            if (
                field.key === "accountEmail" &&
                value &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    String(value)
                )
            ) {
                validationErrors[field.key] =
                    "Invalid email address";
            }

            if (
                field.key === "accountCreditLimit" &&
                value !== "" &&
                value !== null &&
                value !== undefined &&
                Number(value) < 0
            ) {
                validationErrors[field.key] =
                    "Credit limit cannot be negative";
            }
        });

        setErrors(validationErrors);

        return Object.keys(validationErrors).length === 0;
    };

    /* ============================================
       SELECTED STATE / CITY
    ============================================= */

    const findSelectedState = () => {
        return states.find((item: any) => {
            const stateCode =
                item.isoCode ||
                item.stateCode ||
                item.code ||
                "";

            return stateCode === form.state;
        });
    };

    const findSelectedCity = () => {
        return cities.find((item: any) => {
            const cityName = getDisplayName(
                item.name || item.cityName
            );

            return cityName === form.city;
        });
    };

    /* ============================================
       CREATE / UPDATE ACCOUNT
    ============================================= */

    const handleSubmit = async () => {
        if (submitting || !validateForm()) return;

        const selectedState = findSelectedState();
        const selectedCity = findSelectedCity();

        setSubmitting(true);

        try {
            let savedAccount: any;

            if (editingAccount) {
                const updatePayload: any = {};

                accountMasterSchemaFields.forEach(
                    (field: any) => {
                        const key = field.key;

                        if (key === "state") {
                            const oldStateCode =
                                typeof editingAccount.state ===
                                    "object"
                                    ? editingAccount.state
                                        ?.isoCode ||
                                    editingAccount.state
                                        ?.stateCode ||
                                    editingAccount.state
                                        ?.code ||
                                    ""
                                    : editingAccount.state ||
                                    "";

                            if (
                                form.state !== oldStateCode
                            ) {
                                updatePayload.state =
                                    selectedState ||
                                    form.state;
                            }

                            return;
                        }

                        if (key === "city") {
                            const oldCityName =
                                typeof editingAccount.city ===
                                    "object"
                                    ? getDisplayName(
                                        editingAccount.city
                                            ?.name ||
                                        editingAccount
                                            .city
                                            ?.cityName
                                    )
                                    : editingAccount.city ||
                                    "";

                            if (
                                form.city !== oldCityName
                            ) {
                                updatePayload.city =
                                    selectedCity ||
                                    form.city;
                            }

                            return;
                        }

                        const oldValue =
                            key === "accountType"
                                ? String(
                                    editingAccount?.[
                                    key
                                    ] ?? ""
                                ).toLowerCase()
                                : editingAccount?.[
                                key
                                ] ?? "";

                        if (form[key] !== oldValue) {
                            updatePayload[key] =
                                form[key];
                        }
                    }
                );

                if (
                    Object.keys(updatePayload).length === 0
                ) {
                    toast.info("No changes found");
                    return;
                }

                savedAccount = await dispatch(
                    updateAccount({
                        accountCode:
                            editingAccount.accountCode,
                        data: updatePayload,
                    }) as any
                ).unwrap();

                toast.success(
                    "Account updated successfully"
                );
            } else {
                const payload = {
                    ...form,
                    state: selectedState || form.state,
                    city: selectedCity || form.city,
                };

                savedAccount = await dispatch(
                    createAccount(payload) as any
                ).unwrap();

                toast.success(
                    "Account created successfully"
                );
            }

            setShow(false);
            setForm(
                buildEmptyAccountForm(
                    accountMasterSchemaFields
                )
            );
            setErrors({});
            setPendingCity("");

            if (onSaved) {
                onSaved(savedAccount);
            }
        } catch (error: any) {
            toast.error(
                error?.message ||
                error ||
                "Account operation failed"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalVisibility = (value: boolean) => {
        if (submitting) return;

        setShow(value);

        if (!value) {
            setErrors({});
            setPendingCity("");
        }
    };

    return (
        <Modal
            {...{
                show,
                setShow: handleModalVisibility,
                handleSubmit,
                state: editingAccount,
                title:
                    title ||
                    (editingAccount
                        ? "Update Account"
                        : "Add New Account"),
                body: (
                    <>
                        {schemaLoading ? (
                            <div className="py-6 text-sm text-muted-foreground">
                                Loading account fields...
                            </div>
                        ) : accountMasterSchemaFields.length ===
                            0 ? (
                            <div className="py-6 text-sm text-muted-foreground">
                                Account Master schema fields
                                not found.
                            </div>
                        ) : (
                            accountMasterSchemaFields.map(
                                (field: any) =>
                                    renderSchemaField(field)
                            )
                        )}
                    </>
                ),
            }}
        />
    );
};

export { WarningModel, ListingModel, LogoutModal, AccountMasterModal };