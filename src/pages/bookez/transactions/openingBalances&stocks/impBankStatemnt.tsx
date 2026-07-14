// @ts-ignore 
import { ChangeEvent, DragEvent, ReactNode, useEffect, useMemo, useRef, useState, } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    BadgeIndianRupee,
    Building2,
    Check,
    ChevronDown,
    ChevronUp,
    CircleCheckBig,
    FileCheck2,
    FileText,
    Loader2,
    ReceiptIndianRupee,
    Send,
    Sparkles,
    Trash2,
    UploadCloud,
    WalletCards,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";


import {
    clearBankStatementError,
    clearBankStatementParseResult,
    getBankStatementAccounts,
    parseBankStatement,
    postBankStatementVouchers,
} from "../../../../redux/slices/professionalSlice/openingBalancesStocks/bankImpStatement";
import { SelectInput } from "../../../../components/inputs";

/* ===================================================
   TYPES
=================================================== */

type SelectedAccount = {
    code: string;
    name: string;
};

type DropdownOption = {
    label: string;
    value: string;
    raw?: any;
};

type BankTransaction = {
    transactionDate?: string;
    narration?: string;
    referenceNumber?: string;
    paymentMode?: string;
    confidence?: string;
    creditAmount?: number | string;
    debitAmount?: number | string;
    [key: string]: any;
};

type SummaryCardProps = {
    label: string;
    value: string;
    icon: ReactNode;
    valueClassName?: string;
};

type TransactionSectionProps = {
    title: string;
    type: "receipt" | "payment";
    count: number;
    totalAmount: number | string | undefined;
    items: BankTransaction[];
    expanded: boolean;
    onToggle: () => void;
};

/* ===================================================
   MOTION
=================================================== */

const fadeUp: any = {
    hidden: {
        opacity: 0,
        y: 10,
        filter: "blur(4px)",
    },

    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 24,
        },
    },
};

const slideIn: any = {
    hidden: {
        opacity: 0,
        x: 18,
        filter: "blur(4px)",
    },

    show: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 24,
        },
    },
};

const modalMotion: any = {
    hidden: {
        opacity: 0,
        scale: 0.94,
        y: 14,
        filter: "blur(5px)",
    },

    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 280,
            damping: 24,
        },
    },

    exit: {
        opacity: 0,
        scale: 0.94,
        y: 10,
        filter: "blur(4px)",
        transition: {
            duration: 0.16,
        },
    },
};

/* ===================================================
   HELPERS
=================================================== */

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                reject(
                    new Error(
                        "Unable to read selected PDF file"
                    )
                );
                return;
            }

            resolve(reader.result);
        };

        reader.onerror = () => {
            reject(
                new Error(
                    "Unable to read selected PDF file"
                )
            );
        };

        reader.readAsDataURL(file);
    });
};

const formatAmount = (
    value: number | string | undefined
): string => {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "0.00";
    }

    return amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const resolveSelectedAccount = (
    options: DropdownOption[],
    selectedValue: string
): SelectedAccount | null => {
    const selectedOption = options.find(
        (option) => option?.value === selectedValue
    );

    if (!selectedOption) {
        return null;
    }

    return {
        code: selectedOption.value,
        name:
            selectedOption.label ||
            selectedOption.raw?.accountName ||
            selectedOption.value,
    };
};

/* ===================================================
   SUMMARY CARD
=================================================== */

const SummaryCard = ({
    label,
    value,
    icon,
    valueClassName = "text-foreground",
}: SummaryCardProps) => {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="rounded-md border border-border bg-muted p-3"
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-primary">
                    {icon}
                </span>

                <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            </div>

            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p
                className={`mt-1 truncate text-sm font-semibold ${valueClassName}`}
                title={value}
            >
                {value}
            </p>
        </motion.div>
    );
};

/* ===================================================
   TRANSACTION SECTION
=================================================== */

const TransactionSection = ({
    title,
    type,
    count,
    totalAmount,
    items,
    expanded,
    onToggle,
}: TransactionSectionProps) => {
    const isReceipt = type === "receipt";

    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm"
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-muted"
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${isReceipt
                                ? "bg-success/10 text-success"
                                : "bg-danger/10 text-danger"
                            }`}
                    >
                        {isReceipt ? (
                            <ArrowDownLeft size={20} />
                        ) : (
                            <ArrowUpRight size={20} />
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-card-foreground">
                            {title}
                        </p>

                        <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                            {count} entries · Total ₹{" "}
                            {formatAmount(totalAmount)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={`hidden rounded-md px-2.5 py-1 text-xs font-semibold sm:block ${isReceipt
                                ? "bg-success/10 text-success"
                                : "bg-danger/10 text-danger"
                            }`}
                    >
                        ₹ {formatAmount(totalAmount)}
                    </span>

                    {expanded ? (
                        <ChevronUp
                            size={19}
                            className="text-muted-foreground"
                        />
                    ) : (
                        <ChevronDown
                            size={19}
                            className="text-muted-foreground"
                        />
                    )}
                </div>
            </button>

            <AnimatePresence initial={false}>
                {expanded ? (
                    <motion.div
                        initial={{
                            height: 0,
                            opacity: 0,
                        }}
                        animate={{
                            height: "auto",
                            opacity: 1,
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.2,
                        }}
                        className="overflow-hidden border-t border-border"
                    >
                        {!items.length ? (
                            <div className="p-6 text-center">
                                <FileText
                                    size={28}
                                    className="mx-auto mb-2 text-muted-foreground"
                                />

                                <p className="text-sm font-normal text-muted-foreground">
                                    No transactions found
                                </p>
                            </div>
                        ) : (
                            <div className="max-h-[480px] overflow-auto">
                                <div className="hidden grid-cols-[120px_minmax(220px,1fr)_150px_150px] gap-3 border-b border-border bg-muted px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid">
                                    <span>Date</span>
                                    <span>Narration</span>
                                    <span>Reference</span>

                                    <span className="text-right">
                                        Amount
                                    </span>
                                </div>

                                {items.map(
                                    (item, index) => {
                                        const amount =
                                            isReceipt
                                                ? item?.creditAmount ||
                                                0
                                                : item?.debitAmount ||
                                                0;

                                        return (
                                            <motion.div
                                                layout
                                                key={`${type}-${item?.referenceNumber ||
                                                    item?.transactionDate ||
                                                    index
                                                    }`}
                                                className="grid grid-cols-1 gap-2 border-b border-border px-3 py-3 last:border-b-0 hover:bg-muted lg:grid-cols-[120px_minmax(220px,1fr)_150px_150px] lg:items-center lg:gap-3"
                                            >
                                                <div>
                                                    <p className="text-xs font-medium text-card-foreground">
                                                        {item?.transactionDate ||
                                                            "—"}
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] font-normal text-muted-foreground lg:hidden">
                                                        {item?.paymentMode ||
                                                            "Unknown mode"}
                                                    </p>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-sm font-normal leading-5 text-card-foreground">
                                                        {item?.narration ||
                                                            "—"}
                                                    </p>

                                                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                        {item?.paymentMode ? (
                                                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                                                                {
                                                                    item.paymentMode
                                                                }
                                                            </span>
                                                        ) : null}

                                                        {item?.confidence ? (
                                                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                                                                {
                                                                    item.confidence
                                                                }{" "}
                                                                confidence
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <p className="truncate text-xs font-normal text-muted-foreground">
                                                    {item?.referenceNumber ||
                                                        "—"}
                                                </p>

                                                <p
                                                    className={`text-left text-sm font-semibold lg:text-right ${isReceipt
                                                            ? "text-success"
                                                            : "text-danger"
                                                        }`}
                                                >
                                                    {isReceipt
                                                        ? "+"
                                                        : "-"}{" "}
                                                    ₹{" "}
                                                    {formatAmount(
                                                        amount
                                                    )}
                                                </p>
                                            </motion.div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};

/* ===================================================
   MAIN COMPONENT
=================================================== */

const ImportBankStatement = () => {
    const dispatch = useDispatch<any>();

    const fileInputRef =
        useRef<HTMLInputElement | null>(null);

    const {
        bankAccounts = [],
        receiptAccounts = [],
        paymentAccounts = [],

        parseResult,
        summary,
        receipts = [],
        payments = [],

        postResult,

        configLoading,
        accountsLoading,
        parseLoading,
        postLoading,

        progressText,
        error,
    } = useSelector(
        (state: any) =>
            state.importBankStatement
    );

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [selectedBank, setSelectedBank] =
        useState("");

    const [
        selectedReceiptAccount,
        setSelectedReceiptAccount,
    ] = useState("");

    const [
        selectedPaymentAccount,
        setSelectedPaymentAccount,
    ] = useState("");

    const [
        receiptsExpanded,
        setReceiptsExpanded,
    ] = useState(false);

    const [
        paymentsExpanded,
        setPaymentsExpanded,
    ] = useState(false);

    const [confirmOpen, setConfirmOpen] =
        useState(false);

    const isLoading =
        configLoading ||
        accountsLoading ||
        parseLoading ||
        postLoading;

    const loaderMessage =
        progressText ||
        (accountsLoading
            ? "Loading account masters..."
            : parseLoading
                ? "Analysing bank statement..."
                : postLoading
                    ? "Creating receipt and payment vouchers..."
                    : configLoading
                        ? "Loading configuration..."
                        : "Please wait...");

    /* ===================================================
       INITIAL LOAD
    =================================================== */

    useEffect(() => {
        dispatch(getBankStatementAccounts());
    }, [dispatch]);

    /* ===================================================
       ERROR MESSAGE
    =================================================== */

    useEffect(() => {
        if (!error) {
            return;
        }

        toast.error(error);
        dispatch(clearBankStatementError());
    }, [error, dispatch]);

    /* ===================================================
       POST RESULT
    =================================================== */

    useEffect(() => {
        if (!postResult) {
            return;
        }

        if (postResult.totalFailCount > 0) {
            toast.warning(
                `Created ${postResult.totalSuccessCount} voucher(s). ${postResult.totalFailCount} failed.`
            );
            return;
        }

        toast.success(
            `Created ${postResult.receiptSuccessCount} receipt(s) and ${postResult.paymentSuccessCount} payment(s).`
        );
    }, [postResult]);

    /* ===================================================
       SUMMARY
    =================================================== */

    const summaryCards = useMemo(() => {
        if (!summary) {
            return [];
        }

        return [
            {
                label: "Opening Balance",
                value: `₹ ${formatAmount(
                    summary.openingBalance
                )}`,
                icon: <WalletCards size={17} />,
                valueClassName: "text-foreground",
            },
            {
                label: "Closing Balance",
                value: `₹ ${formatAmount(
                    summary.closingBalance
                )}`,
                icon: <Building2 size={17} />,
                valueClassName: "text-foreground",
            },
            {
                label: "Total Receipts",
                value: `₹ ${formatAmount(
                    summary.totalReceipts
                )}`,
                icon: (
                    <ArrowDownLeft size={17} />
                ),
                valueClassName: "text-success",
            },
            {
                label: "Total Payments",
                value: `₹ ${formatAmount(
                    summary.totalPayments
                )}`,
                icon: (
                    <ArrowUpRight size={17} />
                ),
                valueClassName: "text-danger",
            },
            {
                label: "Receipt Count",
                value: String(
                    summary.receiptCount ?? 0
                ),
                icon: (
                    <ReceiptIndianRupee
                        size={17}
                    />
                ),
                valueClassName: "text-foreground",
            },
            {
                label: "Payment Count",
                value: String(
                    summary.paymentCount ?? 0
                ),
                icon: (
                    <BadgeIndianRupee
                        size={17}
                    />
                ),
                valueClassName: "text-foreground",
            },
        ];
    }, [summary]);

    /* ===================================================
       FILE SELECTION
    =================================================== */

    const validateAndSetFile = (
        file: File
    ) => {
        const isPdf =
            file.type === "application/pdf" ||
            file.name
                .toLowerCase()
                .endsWith(".pdf");

        if (!isPdf) {
            toast.error(
                "Please select a valid PDF file"
            );
            return;
        }

        const maximumFileSize =
            20 * 1024 * 1024;

        if (file.size > maximumFileSize) {
            toast.error(
                "PDF file size must not exceed 20 MB"
            );
            return;
        }

        setSelectedFile(file);

        dispatch(
            clearBankStatementParseResult()
        );

        setReceiptsExpanded(false);
        setPaymentsExpanded(false);
    };

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        validateAndSetFile(file);
    };

    const handleDrop = (
        event: DragEvent<HTMLDivElement>
    ) => {
        event.preventDefault();

        const file =
            event.dataTransfer.files?.[0];

        if (!file) {
            return;
        }

        validateAndSetFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);

        setReceiptsExpanded(false);
        setPaymentsExpanded(false);

        dispatch(
            clearBankStatementParseResult()
        );

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    /* ===================================================
       PARSE BANK STATEMENT
    =================================================== */

    const handleFetchData = async () => {
        if (!selectedFile) {
            toast.error(
                "Please attach bank statement PDF"
            );
            return;
        }

        try {
            const pdfBase64 =
                await fileToBase64(selectedFile);

            await dispatch(
                parseBankStatement({
                    pdfBase64,
                })
            ).unwrap();

            setReceiptsExpanded(false);
            setPaymentsExpanded(false);

            toast.success(
                "Bank statement processed successfully"
            );
        } catch (parseError: any) {
            if (
                parseError?.message ===
                "Unable to read selected PDF file"
            ) {
                toast.error(
                    parseError.message
                );
            }
        }
    };

    /* ===================================================
       VALIDATE POST
    =================================================== */

    const validatePostData = () => {
        if (!parseResult) {
            toast.error(
                "Please fetch bank statement data first"
            );
            return false;
        }

        if (!selectedBank) {
            toast.error(
                "Please select Bank Account"
            );
            return false;
        }

        if (!selectedReceiptAccount) {
            toast.error(
                "Please select Receipt Account"
            );
            return false;
        }

        if (!selectedPaymentAccount) {
            toast.error(
                "Please select Payment Account"
            );
            return false;
        }

        if (
            !receipts.length &&
            !payments.length
        ) {
            toast.error(
                "No receipts or payments found to create"
            );
            return false;
        }

        return true;
    };

    const handlePostButton = () => {
        if (!validatePostData()) {
            return;
        }

        setConfirmOpen(true);
    };

    /* ===================================================
       POST VOUCHERS
    =================================================== */

    const confirmPostData = async () => {
        const bankAccount =
            resolveSelectedAccount(
                bankAccounts,
                selectedBank
            );

        const receiptAccount =
            resolveSelectedAccount(
                receiptAccounts,
                selectedReceiptAccount
            );

        const paymentAccount =
            resolveSelectedAccount(
                paymentAccounts,
                selectedPaymentAccount
            );

        if (!bankAccount) {
            toast.error(
                "Invalid bank account selected"
            );
            return;
        }

        if (!receiptAccount) {
            toast.error(
                "Please select a valid Receipt Account"
            );
            return;
        }

        if (!paymentAccount) {
            toast.error(
                "Please select a valid Payment Account"
            );
            return;
        }

        setConfirmOpen(false);

        try {
            await dispatch(
                postBankStatementVouchers({
                    bankAccount,
                    receiptAccount,
                    paymentAccount,
                    receipts,
                    payments,
                })
            ).unwrap();
        } catch {
            // Redux error state handles the message.
        }
    };

    return (
        <div className="bg-background p-3 text-foreground">
            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading ? (
                    <motion.div
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            variants={modalMotion}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="w-full max-w-[360px] rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-2xl"
                        >
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Loader2
                                    size={26}
                                    className="animate-spin"
                                />
                            </div>

                            <p className="text-sm font-semibold text-card-foreground">
                                {loaderMessage}
                            </p>

                            <p className="mt-1 text-xs font-normal text-muted-foreground">
                                Do not close or refresh
                                this page
                            </p>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div
                className={`grid grid-cols-1 gap-3 ${summary
                        ? "xl:grid-cols-[minmax(0,1fr)_380px]"
                        : ""
                    }`}
            >
                {/* Left Section */}
                <div className="space-y-3">
                    {/* Upload Card */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm"
                    >
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <FileText
                                        size={20}
                                    />
                                </div>

                                <div>
                                    <p className="text-base font-semibold text-card-foreground">
                                        Bank Statement PDF
                                    </p>

                                    <p className="text-xs font-normal text-muted-foreground">
                                        Upload one PDF file
                                        up to 20 MB
                                    </p>
                                </div>
                            </div>

                            {parseResult ? (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        scale: 0.9,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    className="flex w-fit items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-xs font-medium text-success"
                                >
                                    <CircleCheckBig
                                        size={16}
                                    />

                                    Statement Analysed
                                </motion.div>
                            ) : (
                                <div className="flex w-fit items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                                    <Sparkles
                                        size={16}
                                    />

                                    AI Bank Import
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={
                                handleFileChange
                            }
                            className="hidden"
                        />

                        {!selectedFile ? (
                            <div
                                onDragOver={(
                                    event
                                ) =>
                                    event.preventDefault()
                                }
                                onDrop={handleDrop}
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                className="group flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-muted p-5 text-center transition hover:border-primary hover:bg-primary/5"
                            >
                                <motion.div
                                    whileHover={{
                                        y: -3,
                                        scale: 1.03,
                                    }}
                                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
                                >
                                    <UploadCloud
                                        size={25}
                                    />
                                </motion.div>

                                <p className="text-sm font-medium text-card-foreground">
                                    Drop bank statement here
                                </p>

                                <p className="mt-1 text-xs font-normal text-muted-foreground">
                                    or click to select
                                    PDF from your
                                    computer
                                </p>

                                <span className="mt-3 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition group-hover:opacity-90">
                                    Browse PDF
                                </span>
                            </div>
                        ) : (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 6,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                className="flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 p-3"
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <FileCheck2
                                        size={22}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-card-foreground">
                                        {
                                            selectedFile.name
                                        }
                                    </p>

                                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                                        {(
                                            selectedFile.size /
                                            (1024 *
                                                1024)
                                        ).toFixed(
                                            2
                                        )}{" "}
                                        MB · PDF
                                        document
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        parseLoading ||
                                        postLoading
                                    }
                                    onClick={
                                        handleRemoveFile
                                    }
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-danger/10 text-danger transition hover:bg-danger hover:text-danger-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Trash2
                                        size={17}
                                    />
                                </button>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Account Mapping */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="relative z-30 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm"
                    >
                        <div className="mb-3 flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Building2
                                    size={20}
                                />
                            </div>

                            <div>
                                <p className="text-base font-semibold text-card-foreground">
                                    Account Mapping
                                </p>

                                <p className="text-xs font-normal text-muted-foreground">
                                    Select accounts used
                                    while posting vouchers
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                            <SelectInput
                                label="Bank Account"
                                name="bankAccount"
                                value={selectedBank}
                                placeholder="Select bank account"
                                options={bankAccounts}
                                mandatory
                                largeData
                                batchSize={100}
                                disabled={
                                    accountsLoading ||
                                    postLoading
                                }
                                onChange={(
                                    event: any
                                ) => {
                                    setSelectedBank(
                                        event.target
                                            .value
                                    );
                                }}
                            />

                            <SelectInput
                                label="Receipt Account"
                                name="receiptAccount"
                                value={
                                    selectedReceiptAccount
                                }
                                placeholder="Select receipt account"
                                options={
                                    receiptAccounts
                                }
                                mandatory
                                largeData
                                batchSize={100}
                                disabled={
                                    accountsLoading ||
                                    postLoading
                                }
                                onChange={(
                                    event: any
                                ) => {
                                    setSelectedReceiptAccount(
                                        event.target
                                            .value
                                    );
                                }}
                            />

                            <SelectInput
                                label="Payment Account"
                                name="paymentAccount"
                                value={
                                    selectedPaymentAccount
                                }
                                placeholder="Select payment account"
                                options={
                                    paymentAccounts
                                }
                                mandatory
                                largeData
                                batchSize={100}
                                disabled={
                                    accountsLoading ||
                                    postLoading
                                }
                                onChange={(
                                    event: any
                                ) => {
                                    setSelectedPaymentAccount(
                                        event.target
                                            .value
                                    );
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex items-start gap-2 text-xs font-normal text-muted-foreground">
                            <AlertCircle
                                size={16}
                                className="mt-0.5 shrink-0 text-primary"
                            />

                            <span>
                                Review all extracted
                                transactions before
                                posting accounting
                                vouchers.
                            </span>
                        </div>

                        <div className="flex shrink-0 gap-2">
                            <motion.button
                                whileTap={{
                                    scale: 0.97,
                                }}
                                type="button"
                                onClick={
                                    handleFetchData
                                }
                                disabled={
                                    !selectedFile ||
                                    parseLoading ||
                                    postLoading
                                }
                                className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-primary bg-card px-4 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground sm:flex-none"
                            >
                                {parseLoading ? (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Sparkles
                                        size={17}
                                    />
                                )}

                                Fetch Data
                            </motion.button>

                            <motion.button
                                whileTap={{
                                    scale: 0.97,
                                }}
                                type="button"
                                onClick={
                                    handlePostButton
                                }
                                disabled={
                                    !parseResult ||
                                    parseLoading ||
                                    postLoading
                                }
                                className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none sm:flex-none"
                            >
                                {postLoading ? (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Send size={17} />
                                )}

                                Post Data
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Transactions */}
                    {summary ? (
                        <div className="space-y-3">
                            <TransactionSection
                                title="Receipts"
                                type="receipt"
                                count={
                                    summary.receiptCount ??
                                    receipts.length
                                }
                                totalAmount={
                                    summary.totalReceipts
                                }
                                items={receipts}
                                expanded={
                                    receiptsExpanded
                                }
                                onToggle={() =>
                                    setReceiptsExpanded(
                                        (
                                            previous
                                        ) =>
                                            !previous
                                    )
                                }
                            />

                            <TransactionSection
                                title="Payments"
                                type="payment"
                                count={
                                    summary.paymentCount ??
                                    payments.length
                                }
                                totalAmount={
                                    summary.totalPayments
                                }
                                items={payments}
                                expanded={
                                    paymentsExpanded
                                }
                                onToggle={() =>
                                    setPaymentsExpanded(
                                        (
                                            previous
                                        ) =>
                                            !previous
                                    )
                                }
                            />
                        </div>
                    ) : null}

                    {/* Failed Transactions */}
                    {postResult?.failures
                        ?.length ? (
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            className="overflow-hidden rounded-md border border-danger/20 bg-card shadow-sm"
                        >
                            <div className="flex items-center gap-3 border-b border-danger/20 bg-danger/10 p-3">
                                <AlertCircle
                                    size={20}
                                    className="text-danger"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-danger">
                                        Failed
                                        Transactions
                                    </p>

                                    <p className="text-xs font-normal text-muted-foreground">
                                        {
                                            postResult.totalFailCount
                                        }{" "}
                                        transaction(s)
                                        failed while
                                        creating
                                        vouchers
                                    </p>
                                </div>
                            </div>

                            <div className="divide-y divide-border">
                                {postResult.failures.map(
                                    (
                                        failure: any,
                                        index: number
                                    ) => (
                                        <div
                                            key={`${failure.type}-${failure.index}-${index}`}
                                            className="flex items-start justify-between gap-3 p-3"
                                        >
                                            <div>
                                                <p className="text-sm font-medium capitalize text-card-foreground">
                                                    {
                                                        failure.type
                                                    }{" "}
                                                    #
                                                    {failure.index +
                                                        1}
                                                </p>

                                                <p className="mt-1 text-xs font-normal text-danger">
                                                    {
                                                        failure.message
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </div>

                {/* Right Summary */}
                {summary ? (
                    <motion.div
                        variants={slideIn}
                        initial="hidden"
                        animate="show"
                        className="xl:sticky xl:top-3 xl:h-fit"
                    >
                        <div className="overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm">
                            <div className="relative overflow-hidden border-b border-border bg-primary p-4 text-primary-foreground">
                                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-foreground/10" />
                                <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-primary-foreground/5" />

                                <div className="relative">
                                    <p className="text-xs font-normal uppercase tracking-wide text-primary-foreground/60">
                                        Statement
                                        Summary
                                    </p>

                                    <h2 className="mt-1 text-2xl font-semibold">
                                        ₹{" "}
                                        {formatAmount(
                                            summary.closingBalance
                                        )}
                                    </h2>

                                    <p className="mt-1 text-xs font-normal text-primary-foreground/70">
                                        Closing balance
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 p-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {summaryCards.map(
                                        (card) => (
                                            <SummaryCard
                                                key={
                                                    card.label
                                                }
                                                label={
                                                    card.label
                                                }
                                                value={
                                                    card.value
                                                }
                                                icon={
                                                    card.icon
                                                }
                                                valueClassName={
                                                    card.valueClassName
                                                }
                                            />
                                        )
                                    )}
                                </div>

                                <div className="rounded-md border border-border bg-muted p-3">
                                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Voucher Creation
                                    </p>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs font-normal text-muted-foreground">
                                                Receipts
                                            </span>

                                            <span className="text-sm font-semibold text-success">
                                                {
                                                    receipts.length
                                                }
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-xs font-normal text-muted-foreground">
                                                Payments
                                            </span>

                                            <span className="text-sm font-semibold text-danger">
                                                {
                                                    payments.length
                                                }
                                            </span>
                                        </div>

                                        <div className="border-t border-border pt-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-medium text-card-foreground">
                                                    Total
                                                    Vouchers
                                                </span>

                                                <span className="text-sm font-semibold text-primary">
                                                    {receipts.length +
                                                        payments.length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmOpen ? (
                    <motion.div
                        initial={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            variants={modalMotion}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
                        >
                            <div className="relative overflow-hidden bg-primary px-5 py-4 text-primary-foreground">
                                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-foreground/10" />

                                <div className="relative flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-normal uppercase tracking-wide text-primary-foreground/60">
                                            Bank
                                            Statement
                                        </p>

                                        <h2 className="mt-1 text-lg font-semibold">
                                            Create
                                            Vouchers?
                                        </h2>
                                    </div>

                                    <div className="rounded-xl bg-primary-foreground/10 px-4 py-2 text-right">
                                        <p className="text-xs font-normal uppercase text-primary-foreground/60">
                                            Total
                                        </p>

                                        <p className="text-base font-semibold">
                                            {receipts.length +
                                                payments.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="mb-3 rounded-md border border-border bg-muted p-3">
                                    <p className="text-sm font-medium text-card-foreground">
                                        Create accounting
                                        vouchers from this
                                        bank statement?
                                    </p>

                                    <p className="mt-2 text-sm font-normal leading-6 text-muted-foreground">
                                        This will create{" "}
                                        <span className="font-medium text-success">
                                            {
                                                receipts.length
                                            }{" "}
                                            receipt
                                            voucher(s)
                                        </span>{" "}
                                        and{" "}
                                        <span className="font-medium text-danger">
                                            {
                                                payments.length
                                            }{" "}
                                            payment
                                            voucher(s)
                                        </span>
                                        .
                                    </p>
                                </div>

                                <div className="mb-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-md border border-success/20 bg-success/10 p-3">
                                        <ArrowDownLeft
                                            size={18}
                                            className="mb-2 text-success"
                                        />

                                        <p className="text-xs font-medium uppercase text-success">
                                            Receipts
                                        </p>

                                        <p className="mt-1 text-lg font-semibold text-card-foreground">
                                            {
                                                receipts.length
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-md border border-danger/20 bg-danger/10 p-3">
                                        <ArrowUpRight
                                            size={18}
                                            className="mb-2 text-danger"
                                        />

                                        <p className="text-xs font-medium uppercase text-danger">
                                            Payments
                                        </p>

                                        <p className="mt-1 text-lg font-semibold text-card-foreground">
                                            {
                                                payments.length
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button
                                        whileTap={{
                                            scale: 0.97,
                                        }}
                                        type="button"
                                        disabled={
                                            postLoading
                                        }
                                        onClick={() =>
                                            setConfirmOpen(
                                                false
                                            )
                                        }
                                        className="h-10 rounded-md border border-border bg-card text-sm font-medium text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Cancel
                                    </motion.button>

                                    <motion.button
                                        whileTap={{
                                            scale: 0.97,
                                        }}
                                        type="button"
                                        disabled={
                                            postLoading
                                        }
                                        onClick={
                                            confirmPostData
                                        }
                                        className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                                    >
                                        {postLoading ? (
                                            <Loader2
                                                size={
                                                    16
                                                }
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Check
                                                size={
                                                    16
                                                }
                                            />
                                        )}

                                        Yes, Create
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default ImportBankStatement;