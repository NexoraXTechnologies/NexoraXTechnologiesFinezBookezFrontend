import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "./buttons";
import { LogOut, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { reportGeneratePdf } from "../redux/slices/professionalSlice/reportMappingSlice";
import { getCompany } from "../redux/slices/professionalSlice/professionalCompanyMaster.slice";
import { getAccountByCode } from "../redux/slices/professionalSlice/accountMasterSlice";
import { gstStateCodes } from "../utils/constant";
import { formatDateForInput } from "../utils/helperFunctions";
import { formatIndianNumber } from "./common/DateFormator";

type ModalProps = {
    show: boolean;
    setShow?: (value: boolean) => void;
    handleSubmit?: () => void;
    handleClose?: () => void;
    state?: boolean;
    body?: React.ReactNode;
    title?: string | any;
    loader?: boolean;

    // Optional dynamic props
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

    // New optional props, safe for existing usage
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

    // Only used when you pass maxWidth="full"
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

    // Default old values, so other components stay same
    gridCols = 2,
    maxWidth = "3xl",
    bodyClassName = "",
    headerClassName = "",
    footerClassName = "",

    // New optional values
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
                            rounded-md border border-gray-100 bg-white shadow-2xl
                            ${maxWidthClass[maxWidth] || maxWidthClass["3xl"]}
                            ${modalClassName}
                        `}
                    >
                        {/* Header */}
                        <div
                            className={`flex shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-6 py-3 ${headerClassName}`}
                        >
                            <div>
                                <h2 className="mb-0 text-xl font-semibold text-gray-800">
                                    {state ? `Edit ${title}` : `${title}`}
                                </h2>

                                <p className="text-sm text-gray-500">
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
                                className="cursor-pointer rounded-full p-2 transition hover:bg-gray-200"
                            >
                                <X size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Body */}
                        <div
                            className={`
                                grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden
                                p-6 text-sm
                                ${gridColsClass[gridCols] || gridColsClass[2]}
                                ${bodyClassName}
                            `}
                        >
                            {body}
                        </div>

                        {/* Footer */}
                        {!hideFooter && (
                            <div
                                className={`flex shrink-0 justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4 ${footerClassName}`}
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
                        className="relative w-full max-w-md overflow-hidden rounded-md border border-gray-100 bg-white shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-300 bg-gray-50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                                    <LogOut size={20} className="text-red-600" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        Logout
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Confirm logout action
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShow(false)}
                                className="rounded-full p-2 transition hover:bg-gray-200"
                            >
                                <X size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5">
                            <p className="text-sm text-gray-600">
                                Are you sure you want to logout from your account?
                                You will need to sign in again to access the
                                dashboard.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4">
                            <button
                                onClick={() => setShow(false)}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                            >
                                Cancel
                            </button>

                            <button
                                disabled={loading}
                                onClick={handleSubmit}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Logging out..." : "Logout"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 

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

const WarningModel = ({
    show,
    title = "No Data Found",
    message = "Please create at least one record to proceed.",
    cancelText = "Cancel",
    confirmText = "Yes",
    onCancel,
    onConfirm,
}: NoDataConfirmAlertProps) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-md bg-white p-6 text-center shadow-2xl">
                <h2 className="text-2xl font-bold text-slate-900">
                    {title}
                </h2>

                <p className="mt-4 text-base leading-7 text-slate-600">
                    {message}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ListingModel = ({
    show,
    title = "No Data Found",
    report,
    rowData,
    downlaodPDF
}: any) => {
    const [data, setData] = useState();
    const [gstType, setGstType] = useState("With GST");
    const isReportDownload = report?.length
    const dispatch = useDispatch()
    const { company } = useSelector((s: any) => s.professionalCompanyMaster);
    const { selectedAccount } = useSelector((e: any) => e?.accountMaster)
    console.log({ selectedAccount, company })

    const downloadPdfWithoutLibrary = async () => {
        try {
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.right = "0";
            iframe.style.bottom = "0";
            iframe.style.width = "0";
            iframe.style.height = "0";
            iframe.style.border = "0";
            document.body.appendChild(iframe);
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

            if (!iframeDoc) {
                console.log("Unable to create PDF iframe");
                return;
            }
            iframeDoc.open();
            iframeDoc.write(html({ ...company, CustomerCode: rowData?.CustomerCode, selectedAccount, rowData })); // ✅ your full HTML string
            iframeDoc.close();
            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();

                    // cleanup after print dialog opens
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                }, 500);
            };
        } catch (error) {
            console.log("PDF print failed:", error);
        }
    };

    const handleConfirm = async () => {
        if (isReportDownload) {
            try {
                // @ts-ignore 
                const blobData = await dispatch(reportGeneratePdf({
                    moduleType: rowData?.moduleType,
                    templateFileId: data?.templateFileId,
                    CustomerCode: rowData?.CustomerCode,
                    voucherNumber: rowData?.voucherNumber,
                })
                ).unwrap();

                const blob = new Blob([blobData], {
                    type: "application/pdf",
                });

                const url = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = `${rowData?.voucherNumber || "report"}.pdf`;

                document.body.appendChild(link);
                link.click();

                link.remove();
                window.URL.revokeObjectURL(url);
            } catch (error: any) {
                console.log("PDF download failed:", error);
            }
        } else {
            downloadPdfWithoutLibrary()
        }
    };
    console.log({ rowData, downlaodPDF })
    useEffect(() => {
        dispatch(getCompany(""));
        dispatch(getAccountByCode(downlaodPDF?.CustomerCode));
    }, [downlaodPDF]);

    if (!show) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm `}
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
                            rounded-md border border-gray-100 bg-white shadow-2xl
                            ${maxWidthClass["lg"]}
                        `}
                    >
                        <div
                            className={`flex shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-6 py-3 `}
                        >
                            <div>
                                <h2 className="mb-0 text-xl font-semibold text-gray-800">
                                    {title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    // handleClose();
                                    // @ts-ignore 
                                    setShow(false);
                                }}
                                className="cursor-pointer rounded-full p-2 transition hover:bg-gray-200"
                            >
                                <X size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Body */}
                        <div
                            className={`
                                grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden
                                p-6 text-sm
                            `}
                        >
                            {isReportDownload ? <ul className="space-y-3">
                                {report?.map((e: any, index: number) => (
                                    <li
                                        key={index}
                                        onClick={() => setData(e)}
                                        className={`p-4 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${e?.id === data?.id ? "border-2 border-blue-500 bg-blue-50 text-blue-700 shadow-md" : "bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md"} `}
                                    >
                                        {e?.templateName}
                                    </li>
                                ))}
                            </ul> :
                                <>
                                    <div className="flex gap-3">
                                        {["With GST", "Without GST"].map((option) => (
                                            <div
                                                key={option}
                                                onClick={() => setGstType(option)}
                                                className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${gstType === option
                                                    ? "bg-blue-500 text-white border-blue-500"
                                                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"}`}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            }
                        </div>
                        <div
                            className={`flex shrink-0 justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4`}
                        >

                            <PrimaryButton
                                // disabled={loader}
                                callBackFn={handleConfirm}
                                text={"Confirm"}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
export { WarningModel, ListingModel, LogoutModal };
function ToWords(value: any): string {
    const ones = [
        "", "One", "Two", "Three", "Four", "Five",
        "Six", "Seven", "Eight", "Nine"
    ];

    const teens = [
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
        "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty",
        "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const num = Math.floor(Number(value || 0));

    if (!Number.isFinite(num)) return "";
    if (num === 0) return "Zero";

    function convert(n: number): string {
        n = Math.floor(Number(n || 0));

        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];

        if (n < 100) {
            return (
                tens[Math.floor(n / 10)] +
                (n % 10 ? " " + ones[n % 10] : "")
            );
        }

        if (n < 1000) {
            return (
                ones[Math.floor(n / 100)] +
                " Hundred" +
                (n % 100 ? " " + convert(n % 100) : "")
            );
        }

        if (n < 100000) {
            return (
                convert(Math.floor(n / 1000)) +
                " Thousand" +
                (n % 1000 ? " " + convert(n % 1000) : "")
            );
        }

        if (n < 10000000) {
            return (
                convert(Math.floor(n / 100000)) +
                " Lakh" +
                (n % 100000 ? " " + convert(n % 100000) : "")
            );
        }

        return (
            convert(Math.floor(n / 10000000)) +
            " Crore" +
            (n % 10000000 ? " " + convert(n % 10000000) : "")
        );
    }

    return convert(num).trim();
}

function AmountToWords(amount: any): string {
    const value = Number(amount || 0);

    if (!Number.isFinite(value)) return "";

    const rupees = Math.floor(value);
    const paise = Math.round((value - rupees) * 100);

    let words = `${ToWords(rupees)} Rupees`;

    if (paise > 0) {
        words += ` and ${ToWords(paise)} Paise`;
    }

    return `${words} Only`;
}

const html = ({
    signatureUri,
    upiId,
    ifscCode,
    bankAccountNumber,
    bankName,
    companyName,
    companyAddress,
    companyMobile,
    companyEmail,
    gstNumber,
    CustomerCode,
    selectedAccount,
    rowData,
}: any) => {
    console.log({ rowData });

    let company = {};
    let customerData = {};
    let unitMap = {};

    // Keep false if you don't want GST columns in PDF
    const includeGst = true;

    const toNum = (v: any) => {
        const n = Number(String(v ?? "").replace(/,/g, ""));
        return Number.isFinite(n) ? n : 0;
    };

    const pick = (obj: any, keys: any = []) => {
        for (const k of keys) {
            const v = obj?.[k];
            if (v !== undefined && v !== null && v !== "") return v;
        }
        return undefined;
    };

    const normalizeDoc = (payload: any) => {
        const doc = payload?.data ?? payload;
        if (!doc || typeof doc !== "object") return null;

        const docNo = pick(doc, [
            "sInvVoucherNumber",
            "sOrderVoucherNumber",
            "sInvReturnVoucherNumber",
            "pOrdVoucherNumber",
            "grnVoucherNumber",
            "pRetVoucherNumber",
            "pInvVoucherNumber",
            "sQuoteVoucherNumber",
        ]);

        const docDate = pick(doc, [
            "sInvVoucherDate",
            "sOrderVoucherDate",
            "sInvReturnVoucherDate",
            "pOrdVoucherDate",
            "grnVoucherDate",
            "pRetVoucherDate",
            "pInvVoucherDate",
            "sQuoteVoucherDate",
        ]);

        const customerCode = pick(doc, [
            "sInvCustomerCode",
            "sOrderCustomerCode",
            "sInvReturnCustomerCode",
            "pOrdVendorCode",
            "grnVendorCode",
            "pRetVendorCode",
            "pInvVendorCode",
            "sQuoteCustomerCode",
        ]);

        const body =
            pick(doc, [
                "sInvBody",
                "sOrderBody",
                "sInvReturnBody",
                "pOrdBody",
                "grnBody",
                "pRetBody",
                "pInvBody",
                "sQuoteBody",
            ]) || [];

        const footer =
            pick(doc, [
                "sInvFooter",
                "sOrderFooter",
                "sInvReturnFooter",
                "pOrdFooter",
                "grnFooter",
                "pRetFooter",
                "pInvFooter",
                "sQuoteFooter",
            ]) || {};

        return {
            doc,
            docNo: docNo || "",
            docDate: docDate || "",
            customerCode: customerCode || "",
            body: Array.isArray(body) ? body : [],
            footer: footer && typeof footer === "object" ? footer : {},
        };
    };

    const normalized: any = normalizeDoc(rowData);
    console.log({ normalized });

    if (!normalized) {
        return `
            <html>
                <body>
                    <h3>No PDF data found</h3>
                </body>
            </html>
        `;
    }

    const escapeHtml = (s: any) =>
        String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    const titleCase = (s: any) =>
        String(s ?? "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

    const resolveUnitLabel = (uomId: any, unitMap: any) => {
        if (!uomId) return "-";

        const u = unitMap?.[uomId];

        return u?.unitCode || u?.unitName || uomId;
    };

    const getItemTaxParts = (it: any) => {
        const cgst = toNum(it.cgst);
        const sgst = toNum(it.sgst);
        const igst = toNum(it.igst);
        const taxAmount = toNum(it.taxAmount);

        if (igst > 0) {
            return {
                mode: "IGST",
                cgst: 0,
                sgst: 0,
                igst,
                total: toNum(it.igstAmount) || taxAmount,
            };
        }

        if (cgst > 0 || sgst > 0) {
            return {
                mode: "CGST_SGST",
                cgst,
                sgst,
                igst: 0,
                total: cgst + sgst,
            };
        }

        if (taxAmount > 0) {
            return {
                mode: "TAX",
                cgst: 0,
                sgst: 0,
                igst: 0,
                total: taxAmount,
            };
        }

        return {
            mode: "NONE",
            cgst: 0,
            sgst: 0,
            igst: 0,
            total: 0,
        };
    };

    const pct = (amt: any, base: any) => {
        const a = toNum(amt);
        const b = toNum(base);

        if (!b || b <= 0 || !a) return 0;

        return (a / b) * 100;
    };

    const fmtPct = (n: any) => {
        const x = Number(n || 0);
        const rounded = Math.round(x * 100) / 100;

        return Number.isFinite(rounded) ? rounded.toString() : "0";
    };

    const renderGstHtml = (it: any) => {
        const t = getItemTaxParts(it);

        const qty = toNum(it.quantity ?? it.qty);
        const rate = toNum(it.rate);

        const gross =
            it.gross != null
                ? toNum(it.gross)
                : qty > 0 && rate > 0
                    ? qty * rate
                    : 0;

        const discAmt = toNum(it.discountAmount);
        const taxableBase = Math.max(0, gross - discAmt);

        if (t.mode === "IGST") {
            const igstRate = toNum(it.igst);
            const igstAmt = toNum(it.igstAmount);

            const labelPct =
                igstRate > 0
                    ? igstRate
                    : taxableBase > 0 && igstAmt > 0
                        ? pct(igstAmt, taxableBase)
                        : 0;

            const mainFigure = igstRate > 0 ? igstRate : igstAmt;

            return `
                <span class="money">${fmtPct(mainFigure)}</span>
                <span class="gstSmall">IGST: ${fmtPct(labelPct)}%</span>
            `;
        }

        if (t.mode === "CGST_SGST") {
            const totalPct = toNum(it.cgst) + toNum(it.sgst);

            return `
                <span class="money">${fmtPct(totalPct)}%</span>
                <span class="gstSmall">
                    CGST: ${fmtPct(toNum(it.cgst))}% 
                    SGST: ${fmtPct(toNum(it.sgst))}%
                </span>
            `;
        }

        if (t.mode === "TAX") {
            const taxPct = pct(t.total, taxableBase);

            return `
                <span class="money">${fmtPct(taxPct)}%</span>
                <span class="gstSmall">Tax</span>
            `;
        }

        return `<span class="money">—</span>`;
    };

    const itemsRaw = normalized.body || [];
    const footer = normalized.footer || {};
    const footerLabels = footer?.labels || {};
    console.log({ selectedAccount })
    const billToName = selectedAccount?.accountName || "";
    const billToAddress = selectedAccount?.accountAddress || "";
    const billToGstin = selectedAccount?.gstNumber || "";

    const billToState =
        selectedAccount?.gstNumber?.length >= 2
            ? gstStateCodes?.[selectedAccount.gstNumber.substring(0, 2)] ||
            "Unknown State"
            : "";

    const items = itemsRaw.map((it: any) => {
        const qty = toNum(it.quantity ?? it.qty);
        const rate = toNum(it.rate);

        const gross =
            it.grossAmount != null
                ? toNum(it.grossAmount)
                : it.gross != null
                    ? toNum(it.gross)
                    : qty * rate;

        const discountAmount = toNum(it.discountAmount);
        const taxable =
            it.taxableAmount != null
                ? toNum(it.taxableAmount)
                : Math.max(0, gross - discountAmount);

        const tax = toNum(it.taxAmount);

        const net =
            it.netAmount != null
                ? toNum(it.netAmount)
                : it.netTotal != null
                    ? toNum(it.netTotal)
                    : taxable + tax;

        return {
            ...it,
            qty,
            rate,
            gross,
            discountAmount,
            taxable,
            tax,
            net,
            uomLabel: resolveUnitLabel(it.uom ?? it.unit, unitMap),
        };
    });

    const computedGrossTotal = items.reduce(
        (s: any, it: any) => s + toNum(it.gross),
        0
    );

    const computedDiscountTotal = items.reduce(
        (s: any, it: any) => s + toNum(it.discountAmount),
        0
    );

    const computedTaxTotal = items.reduce(
        (s: any, it: any) => s + toNum(it.tax),
        0
    );

    const computedNetTotal = items.reduce(
        (s: any, it: any) => s + toNum(it.net),
        0
    );

    const totalQty = items.reduce(
        (s: any, it: any) => s + toNum(it.qty),
        0
    );

    const totalRejQty = items.reduce(
        (s: any, it: any) => s + toNum(it.rejectedQuantity),
        0
    );

    const totalAccQty = items.reduce(
        (s: any, it: any) => s + toNum(it.acceptedQuantity),
        0
    );

    const knownFooterKeys = new Set([
        "grossAmount",
        "discountAmount",
        "discount",
        "cgstAmount",
        "sgstAmount",
        "igstAmount",
        "taxAmount",
        "otherAmount",
        "netAmount",
        "adjustedAmount",
        "balanceAmount",

        "totalQuantity",
        "totalGrossAmount",
        "totalDiscountAmount",
        "totalCgstAmount",
        "totalSgstAmount",
        "totalIgstAmount",
        "totalTaxAmount",
        "totalOtherAmount",
        "totalNetAmount",

        "cgst",
        "sgst",
        "igst",

        "labels",
    ]);

    const taxFooterKeys = new Set([
        "cgstAmount",
        "sgstAmount",
        "igstAmount",
        "taxAmount",
        "totalCgstAmount",
        "totalSgstAmount",
        "totalIgstAmount",
        "totalTaxAmount",
        "cgst",
        "sgst",
        "igst",
    ]);

    const formatFooterLabel = (key: any) =>
        titleCase(String(key).replace(/_/g, " "));

    const subTotal =
        footer.totalGrossAmount != null
            ? toNum(footer.totalGrossAmount)
            : footer.grossAmount != null
                ? toNum(footer.grossAmount)
                : computedGrossTotal;

    const discountAmt =
        footer.totalDiscountAmount != null
            ? toNum(footer.totalDiscountAmount)
            : footer.discountAmount != null
                ? toNum(footer.discountAmount)
                : footer.discount != null
                    ? toNum(footer.discount)
                    : computedDiscountTotal;

    const cgstAmt =
        footer.totalCgstAmount != null
            ? toNum(footer.totalCgstAmount)
            : toNum(footer.cgstAmount ?? 0);

    const sgstAmt =
        footer.totalSgstAmount != null
            ? toNum(footer.totalSgstAmount)
            : toNum(footer.sgstAmount ?? 0);

    const igstAmt =
        footer.totalIgstAmount != null
            ? toNum(footer.totalIgstAmount)
            : toNum(footer.igstAmount ?? 0);

    const totalTax =
        footer.totalTaxAmount != null
            ? toNum(footer.totalTaxAmount)
            : footer.taxAmount != null
                ? toNum(footer.taxAmount)
                : cgstAmt + sgstAmt + igstAmt || computedTaxTotal;

    const otherAmount =
        footer.totalOtherAmount != null
            ? toNum(footer.totalOtherAmount)
            : toNum(footer.otherAmount ?? 0);

    const grandTotal =
        footer.totalNetAmount != null
            ? toNum(footer.totalNetAmount)
            : footer.netAmount != null
                ? toNum(footer.netAmount)
                : computedNetTotal;

    const extraFooterTotal = Object.entries(footer || {}).reduce(
        (sum: any, [key, value]: any) => {
            if (knownFooterKeys.has(key)) return sum;

            const num = toNum(value);
            return num !== 0 ? sum + num : sum;
        },
        0
    );

    const sumTableSubTotal = subTotal;

    const pdfGrandTotal = grandTotal + extraFooterTotal;

    const amountWords = AmountToWords(pdfGrandTotal);

    const billGstBlock = billToGstin
        ? `
            <p><strong>GSTIN Number:</strong> ${escapeHtml(billToGstin)}</p>
            <p><strong>State:</strong> ${escapeHtml(billToState)}</p>
        `
        : "";

    const companyGstBlock = gstNumber
        ? `<p><strong>GSTIN:</strong> ${escapeHtml(gstNumber)}</p>`
        : "";

    const gstSummaryRows = includeGst
        ? `
            <tr>
                <td class="sumLabel">IGST</td>
                <td class="sumAmt">₹ ${formatIndianNumber(igstAmt)}</td>
            </tr>

            <tr>
                <td class="sumLabel">SGST</td>
                <td class="sumAmt">₹ ${formatIndianNumber(sgstAmt)}</td>
            </tr>

            <tr>
                <td class="sumLabel">CGST</td>
                <td class="sumAmt">₹ ${formatIndianNumber(cgstAmt)}</td>
            </tr>
        `
        : "";

    const discountRow =
        discountAmt > 0
            ? `
                <tr>
                    <td class="sumLabel">Discount</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(discountAmt)}</td>
                </tr>
            `
            : "";

    const otherAmountRow =
        otherAmount > 0
            ? `
                <tr>
                    <td class="sumLabel">Other Amount</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(otherAmount)}</td>
                </tr>
            `
            : "";

    const totalFooterDisplayRows = `
    ${footer.totalQuantity != null
            ? `
                <tr>
                    <td class="sumLabel">Total Quantity</td>
                    <td class="sumAmt">${formatIndianNumber(footer.totalQuantity)}</td>
                </tr>
            `
            : ""
        }

    ${footer.totalGrossAmount != null
            ? `
                <tr>
                    <td class="sumLabel">Total Gross Amount</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(footer.totalGrossAmount)}</td>
                </tr>
            `
            : ""
        }

    ${footer.totalNetAmount != null
            ? `
                <tr>
                    <td class="sumLabel">Total Net Amount</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(footer.totalNetAmount)}</td>
                </tr>
            `
            : ""
        }
`;

    const extraFooterRows = Object.entries(footer || {})
        .filter(([key, value]: any) => {
            if (knownFooterKeys.has(key)) return false;
            return toNum(value) !== 0;
        })
        .map(
            ([key, value]: any) => `
                <tr>
                    <td class="sumLabel">
                        ${escapeHtml(footerLabels?.[key] || formatFooterLabel(key))}
                    </td>
                    <td class="sumAmt">₹ ${formatIndianNumber(toNum(value))}</td>
                </tr>
            `
        )
        .join("");

    const companyLogo = "";
    const upiUrl = "";
    const upiQrUri = "";

    const gstHeaderTh = includeGst ? `<th class="colGst">GST</th>` : "";

    const invNo = normalized?.docNo || "";
    const invDate = normalized?.docDate || "";

    const entryType: any = "sales-quotation";
    const PRIMARY = "#1E88E5"
    return `
<html>
<head>
    <meta charset="utf-8" />

    <style>
        @page {
            margin-top: 40px;
            margin-bottom: 40px;
            margin-left: 30px;
            margin-right: 30px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #111;
            font-size: 12px;
        }

        .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
        }

        .company h1 {
            margin: 0 0 6px 0;
            font-size: 22px;
            font-weight: 700;
        }

        .company p {
            margin: 0;
            line-height: 1.6;
        }

        .logo {
            width: 90px;
            height: 90px;
            object-fit: contain;
        }

        .divider {
            height: 2px;
            background: ${PRIMARY};
            margin: 14px 0;
            opacity: 0.9;
        }

        .title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            color: ${PRIMARY};
            margin: 0 0 8px;
        }

        .sectionRow {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
        }

        .bill,
        .details {
            width: 48%;
        }

        .sectionTitle {
            font-weight: 700;
            margin-bottom: 10px;
        }

        .bill p {
            margin: 0 0 8px;
        }

        .details .sectionTitle,
        .details .kv {
            text-align: right;
        }

        .details .kv {
            margin: 0 0 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            border: 0.5px solid #bbb;
            font-size: 12px;
        }

        thead th {
            background: ${PRIMARY};
            color: #fff;
            padding: 9px 6px;
            text-align: center;
            border: 0.5px solid #aad;
        }

        tbody td {
            padding: 9px 6px;
            vertical-align: top;
            text-align: center;
            border: 0.5px solid #ccc;
        }

        .colNum {
            width: 28px;
        }

        .colItem {
            width: 200px;
            text-align: left;
        }

        .colQty {
            width: 90px;
        }

        .colPrice {
            width: 100px;
        }

        .colGst {
            width: 140px;
        }

        .colAmt {
            width: 120px;
        }

        .gstSmall {
            display: block;
            margin-top: 3px;
            color: #555;
            font-size: 9px;
        }

        .money {
            white-space: nowrap;
        }

        .itemMeta {
            display: block;
            margin-top: 3px;
            font-size: 10px;
            color: #666;
        }

        .dimCell {
            color: #999;
        }

        .tableTotal td {
            border-top: 1px solid #999;
            border-bottom: 1px solid #999;
            font-weight: 700;
            padding-top: 10px;
            padding-bottom: 10px;
        }

        .belowRow {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            margin-top: 18px;
        }

        .belowLeft {
            flex: 1;
        }

        .belowRight {
            width: 460px;
        }

        .blkTitle {
            font-weight: 700;
            margin: 0 0 10px;
        }

        .blkText {
            line-height: 1.6;
            margin: 0;
        }

        .sumTable {
            width: 100%;
            border-collapse: collapse;
        }

        .sumTable td {
            padding: 8px 10px;
        }

        .sumLabel {
            width: 55%;
        }

        .sumAmt {
            width: 45%;
            text-align: right;
            white-space: nowrap;
        }

        .sumTotalRow td {
            background: ${PRIMARY};
            color: #fff;
            font-weight: 700;
        }

        .payRow {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 18px;
            margin-top: 18px;
        }

        .payLeft {
            flex: 1;
            display: flex;
            gap: 16px;
            align-items: flex-start;
        }

        .qr {
            width: 160px;
            height: 160px;
            object-fit: contain;
            border: 1px solid #ddd;
            padding: 6px;
        }

        .payInfo {
            line-height: 1.7;
        }

        .payInfo b {
            font-weight: 700;
        }

        .signRight {
            width: 360px;
            text-align: right;
        }

        .signRight .for {
            margin-bottom: 10px;
        }

        .signImg {
            height: 70px;
            object-fit: contain;
            margin: 10px 0;
        }

        .signText {
            font-weight: 700;
            margin-top: 6px;
        }

        .upiLink {
            display: inline-block;
            margin-top: 8px;
            font-weight: 700;
            color: #0b63ff;
            text-decoration: none;
        }

        .upiMeta {
            color: #555;
            margin-top: 4px;
        }

        .siteNote {
            text-align: left;
            margin-top: 10px;
            color: #0b63ff;
        }
    </style>
</head>

<body>
    <div class="row">
        <div class="company" style="max-width: 50%;">
            <h1>${escapeHtml(companyName || "Company Name")}</h1>
            <p><strong>Address:</strong> ${escapeHtml(companyAddress)}</p>
            <p><strong>Phone no:</strong> ${escapeHtml(companyMobile)}</p>
            <p><strong>Email:</strong> ${escapeHtml(companyEmail)}</p>
            ${companyGstBlock}
        </div>

        ${companyLogo
            ? `<img class="logo" src="${companyLogo}" />`
            : `<div style="width:90px;height:90px;"></div>`
        }
    </div>

    <div class="divider"></div>

    <div class="title">
        ${escapeHtml(titleCase(entryType || "Tax Invoice"))}
    </div>

    <div class="sectionRow">
        <div class="bill">
            <div class="sectionTitle">Bill To</div>
            <p><strong>Name:</strong> ${escapeHtml(billToName)}</p>
            <p><strong>Address:</strong> ${escapeHtml(billToAddress)}</p>
            ${billGstBlock}
        </div>

        <div class="details">
            <div class="sectionTitle">Invoice Details</div>
            <p class="kv"><strong>Invoice No.:</strong> ${escapeHtml(invNo)}</p>
            <p class="kv"><strong>Date:</strong> ${escapeHtml(formatDateForInput(invDate))}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="colNum">#</th>
                <th class="colItem">Item Name</th>

                ${entryType === "GRN"
            ? `
                            <th class="colQty">Accepted Qty</th>
                            <th class="colQty">Rejected Qty</th>
                        `
            : `<th class="colQty">Quantity</th>`
        }

                <th class="colPrice">Rate</th>
                <th class="colPrice">Discount %</th>
                ${gstHeaderTh}
                <th class="colAmt">Amount</th>
            </tr>
        </thead>

        <tbody>
            ${items
        .map((it: any, idx: any) => {
                return `
                        <tr>
                            <td class="colNum">${idx + 1}</td>

                            <td class="colItem">
                                ${escapeHtml(it.productName || "—")}
                                ${it.productHSNCode
                        ? `<span class="itemMeta">HSN: ${escapeHtml(
                            it.productHSNCode
                        )}</span>`
                    : ""
                    }
                            </td>

                            ${entryType === "GRN"
                        ? `
                                        <td class="colQty">
                                            ${escapeHtml(
                            String(it.acceptedQuantity ?? "")
                        )}
                                            ${it.uomLabel && it.uomLabel !== "-"
                            ? `<span class="itemMeta">${escapeHtml(
                                it.uomLabel
                            )}</span>`
                        : ""
                    }
                                        </td>

                                        <td class="colQty">
                                            ${escapeHtml(
                        String(it.rejectedQuantity ?? "")
                    )}
                                            ${it.uomLabel && it.uomLabel !== "-"
                            ? `<span class="itemMeta">${escapeHtml(
                                it.uomLabel
                            )}</span>`
                        : ""
                    }
                                        </td>
                                    `
                    : `
                                        <td class="colQty">
                                            ${escapeHtml(String(it.qty || ""))}
                                            ${it.uomLabel && it.uomLabel !== "-"
                            ? `<span class="itemMeta">${escapeHtml(
                                it.uomLabel
                            )}</span>`
                        : ""
                    }
                                        </td>
                                    `
                    }

                            <td class="colPrice">
                                <span class="money">₹ ${formatIndianNumber(
                                    it.rate
                                )}</span>
                            </td>

                            <td class="colPrice">
                                ${toNum(it.discount) > 0 ||
                        toNum(it.discountPercentage) > 0
                        ? `<span class="money">${formatIndianNumber(
                            toNum(
                                it.discountPercentage ??
                                it.discount
                            )
                        )} %</span>`
                        : `<span class="dimCell">—</span>`
                    }
                            </td>

                            ${includeGst
                    ? `<td class="colGst">${renderGstHtml(
                        it
                    )}</td>`
                    : ""
                    }

                            <td class="colAmt">
                                <span class="money">
                                    ₹ ${formatIndianNumber(
                                        includeGst ? it.net : it.taxable
                                    )}
                                </span>
                            </td>
                        </tr>
                    `;
            })
        .join("")}

            <tr class="tableTotal">
                <td class="colNum"></td>
                <td class="colItem"><strong>Total</strong></td>

                ${entryType === "GRN"
            ? `
                            <td class="colQty">
                                <strong>${formatIndianNumber(totalAccQty)}</strong>
                            </td>
                            <td class="colQty">
                                <strong>${formatIndianNumber(totalRejQty)}</strong>
                            </td>
                        `
            : `
                            <td class="colQty">
                                <strong>${formatIndianNumber(totalQty)}</strong>
                            </td>
                        `
        }

                <td class="colPrice"></td>
                <td class="colPrice"></td>
                ${includeGst ? `<td class="colGst"></td>` : ""}

                <td class="colAmt">
                    <strong>₹ ${formatIndianNumber(pdfGrandTotal)}</strong>
                </td>
            </tr>
        </tbody>
    </table>

    <div class="belowRow">
        <div class="belowLeft">
            <div class="blkTitle">Invoice Amount In Words</div>
            <p class="blkText">${escapeHtml(amountWords)}</p>

            <div style="height:16px;"></div>

            <div class="blkTitle">
                Thank you for doing business with us.
            </div>

            ${entryType === "sales-invoice"
            ? upiUrl
                ? `
                            <a class="upiLink" href="${upiUrl}">
                                Pay with UPI (GPay / PhonePe)
                            </a>

                            <div class="upiMeta">
                                UPI ID: ${escapeHtml(upiId)} • Amount: ₹ ${formatIndianNumber(
                    pdfGrandTotal
                )}
                            </div>
                        `
                : `<div class="upiMeta">UPI not configured in Company Master.</div>`
        : ""
        }

            <div style="height:16px;"></div>

            ${normalized?.doc?.sInvRemark ||
            normalized?.doc?.sQuoteRemark ||
            normalized?.doc?.remark
            ? `
                        <div class="blkTitle">
                            Remark:- ${escapeHtml(
                normalized?.doc?.sInvRemark ||
                normalized?.doc?.sQuoteRemark ||
                normalized?.doc?.remark
            )}
                        </div>
                    `
            : ""
        }
        </div>

        <div class="belowRight">
            <table class="sumTable">
                <tr>
                    <td class="sumLabel">Sub Total</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(
                        sumTableSubTotal
                    )}</td>
                </tr>

                ${discountRow}
                ${gstSummaryRows}
                ${otherAmountRow}
                ${totalFooterDisplayRows}
                ${extraFooterRows}
                <tr class="sumTotalRow">
                    <td class="sumLabel">Total</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(pdfGrandTotal)}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="payRow">
        ${entryType === "sales-invoice"
            ? `
                    <div class="payLeft">
                        ${upiQrUri
                ? `<img class="qr" src="${upiQrUri}" />`
            : `
                                    <div class="qr" style="display:flex;align-items:center;justify-content:center;color:#888;">
                                        UPI QR not available
                                    </div>
                                `
            }

                        <div class="payInfo">
                            <div><b>Pay To:</b></div>
                            <div>Bank Name: ${escapeHtml(bankName)}</div>
                            <div>Bank Account No: ${escapeHtml(bankAccountNumber)}</div>
                            <div>Bank IFSC code: ${escapeHtml(ifscCode)}</div>
                            <div>Account Holder's Name: ${escapeHtml(
                                companyName
                            )}</div>
                        </div>
                    </div>
                `
            : `<div class="payLeft"></div>`
        }

        <div class="signRight">
            <div class="for">For: ${escapeHtml(companyName)}</div>

            ${signatureUri
            ? `<img class="signImg" src="${signatureUri}" />`
            : `<div style="height:70px;"></div>`
        }

            <div class="signText">Authorized Signatory</div>
        </div>
    </div>
</body>
</html>
`;
};