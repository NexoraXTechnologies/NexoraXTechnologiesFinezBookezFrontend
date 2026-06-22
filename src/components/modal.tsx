import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "./buttons";
import { LogOut, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { reportGeneratePdf } from "../redux/slices/professionalSlice/reportMappingSlice";
import { getCompany } from "../redux/slices/professionalSlice/professionalCompanyMaster.slice";
import { getAccountByCode } from "../redux/slices/professionalSlice/accountMasterSlice";
import { downloadBlobPdf, printHtmlUsingIframe } from "../utils/pdf/pdfPrint";
import { buildPdfHtml } from "../utils/pdf/pdfTemplate";
import { toast } from "react-toastify";
import { buildUpiLink, generateQrDataUrl } from "../utils/pdf/upiQr";
import { normalizeDoc } from "../utils/pdf/pdfNormalizer";

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
    setShow,
    title = "No Data Found",
    report,
    rowData,
    downlaodPDF,
    entryType = "sales-invoice"
}: any) => {
    const dispatch = useDispatch<any>();

    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [gstType, setGstType] = useState("");
    const { company } = useSelector((s: any) => s.professionalCompanyMaster);

    const { selectedAccount } = useSelector(
        (s: any) => s.accountMaster
    );
    const isReportDownload = Boolean(report?.length);

    useEffect(() => {
        if (!show) return;

        dispatch(getCompany(""));
        dispatch(getAccountByCode(downlaodPDF?.CustomerCode));
    }, [show, downlaodPDF?.CustomerCode, dispatch]);

    const handleLocalPdfPrint = async () => {
        if (!gstType) {
            return toast.warn("Select With GST Or Without GST");
        }

        try {
            const includeGst = gstType === "With GST";

            const normalized: any = normalizeDoc(rowData);
            const footer = normalized?.footer || {};
            const invoiceNo =
                normalized?.docNo ||
                rowData?.voucherNumber ||
                rowData?.sInvVoucherNumber ||
                rowData?.sQuoteVoucherNumber ||
                "";

            const amount =
                footer?.totalNetAmount ||
                footer?.netAmount ||
                footer?.balanceAmount ||
                rowData?.sInvFooter?.totalNetAmount ||
                rowData?.sInvFooter?.netAmount ||
                rowData?.sQuoteFooter?.totalNetAmount ||
                rowData?.sQuoteFooter?.netAmount ||
                0;

            const companyUpiId =
                company?.upiId ||
                company?.upiID ||
                company?.companyUpiId ||
                company?.upi ||
                "";

            let upiUrl = "";
            let upiQrUri = "";

            // ✅ QR generate only for sales invoice
            if (entryType === "sales-invoice" && companyUpiId) {
                upiUrl = buildUpiLink({
                    upiId: companyUpiId,
                    amount,
                    invoiceNo,
                    name:
                        company?.companyName ||
                        company?.businessName ||
                        "",
                });

                upiQrUri = await generateQrDataUrl(upiUrl);
            }

            const htmlContent = buildPdfHtml({
                ...company,
                selectedAccount,
                rowData,
                includeGst,
                primaryColor: "#1E88E5",
                entryType,
                gstType,

                upiId: companyUpiId,
                upiUrl,
                upiQrUri,
            });

            printHtmlUsingIframe(htmlContent);
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

            const blobData = await dispatch(
                reportGeneratePdf({
                    moduleType: downlaodPDF?.moduleType,
                    templateFileId: selectedTemplate?.templateFileId,
                    CustomerCode: downlaodPDF?.CustomerCode,
                    voucherNumber: downlaodPDF?.voucherNumber,
                })
            ).unwrap();

            downloadBlobPdf({
                blobData,
                fileName: `${rowData?.voucherNumber || "report"}.pdf`,
            });
        } catch (error) {
            console.log("PDF download failed:", error);
        }
    };

    const handleConfirm = async () => {
        if (isReportDownload) {
            await handleServerPdfDownload();
            return;
        }

        await handleLocalPdfPrint();
    };

    if (!show) return null;

    return (
        <AnimatePresence>
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
                    className={`
                        relative flex w-full max-h-[90vh] flex-col overflow-hidden
                        rounded-md border border-gray-100 bg-white shadow-2xl
                        ${maxWidthClass["lg"]}
                    `}
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-6 py-3">
                        <div>
                            <h2 className="mb-0 text-xl font-semibold text-gray-800">
                                {title}
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={() => { setShow(); setGstType(""); setSelectedTemplate(null) }}
                            className="cursor-pointer rounded-full p-2 transition hover:bg-gray-200"
                        >
                            <X size={18} className="text-gray-600" />
                        </button>
                    </div>

                    <div className="grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden p-6 text-sm">
                        {isReportDownload ? (
                            <ul className="space-y-3">
                                {report?.map((e: any, index: number) => (
                                    <li
                                        key={e?.id || index}
                                        onClick={() => setSelectedTemplate(e)}
                                        className={`
                                            rounded-lg p-4 shadow-sm cursor-pointer transition-all duration-200
                                            ${e?.id === selectedTemplate?.id
                                                ? "border-2 border-blue-500 bg-blue-50 text-blue-700 shadow-md"
                                                : "border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md"
                                            }
                                        `}
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
                                        className={`
                                            rounded-lg border px-4 py-2 cursor-pointer transition-all
                                            ${gstType === option
                                                ? "border-blue-500 bg-blue-500 text-white"
                                                : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                                            }
                                        `}
                                    >
                                        {option}
                                    </div>
                                ))}
                                </div>
                        )}
                    </div>

                    <div className="flex shrink-0 justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4">
                        <PrimaryButton
                            callBackFn={handleConfirm}
                            text="Confirm"
                        />
                        <SecondaryButton
                            callBackFn={() => { setShow(); setGstType(""); setSelectedTemplate(null) }}
                            text="Cancel"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export { WarningModel, ListingModel, LogoutModal };