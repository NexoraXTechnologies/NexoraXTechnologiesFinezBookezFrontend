import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    useDispatch,
    useSelector,
} from "react-redux";
import { toast } from "react-toastify";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import ReportFilterCard from "./components/ReportFilterCard";
import AccountSummaryCard from "./components/AccountSummaryCard";

import {
    clearCashBankReportData,
    exportCashBankReport,
    getCashBankReport,
    type CashBankExportType,
    type CashBankModule,
} from "../../../redux/slices/professionalSlice/cashBankReportSlice";

import {
    getAllAccounts,
} from "../../../redux/slices/professionalSlice/accountMasterSlice";

import {
    getFirstDateOfCurrentMonth,
    todayYMD,
} from "../../../utils/helperFunctions";

const toNumber = (
    value: any
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return 0;
    }

    const normalizedValue =
        String(value)
            .replace(/,/g, "")
            .trim();

    const number =
        Number(normalizedValue);

    return Number.isFinite(
        number
    )
        ? number
        : 0;
};

const formatMoney = (
    value: any
) => {
    return `₹${new Intl.NumberFormat(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    ).format(
        toNumber(value)
    )}`;
};

const formatDisplayDate = (
    value: any
) => {
    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};

const getVoucherNumber = (
    row: any
) => {
    return (
        row?.recVoucherNumber ||
        row?.payVoucherNumber ||
        row?.paymentVoucherNumber ||
        row?.voucherNumber ||
        row?.voucherNo ||
        "-"
    );
};

const getVoucherDate = (
    row: any
) => {
    return (
        row?.recVoucherDate ||
        row?.payVoucherDate ||
        row?.paymentVoucherDate ||
        row?.voucherDate ||
        null
    );
};

const getAccountName = (
    row: any
) => {
    return (
        row?.recAccountName ||
        row?.payAccountName ||
        row?.paymentAccountName ||
        row?.accountName ||
        "-"
    );
};

const getAccountCode = (
    row: any
) => {
    return (
        row?.recAccountCode ||
        row?.payAccountCode ||
        row?.paymentAccountCode ||
        row?.accountCode ||
        "-"
    );
};

const getRowModule = (
    row: any
) => {
    if (row?.module) {
        const moduleName =
            String(row.module);

        return (
            moduleName
                .charAt(0)
                .toUpperCase() +
            moduleName.slice(1)
        );
    }

    if (
        row?.payVoucherNumber ||
        row?.paymentVoucherNumber
    ) {
        return "Payment";
    }

    return "Receipt";
};

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key:
            "voucherNumber",
        title:
            "Voucher Number",

        render: (
            row: any
        ) => (
            <span className="font-semibold text-card-foreground">
                {getVoucherNumber(
                    row
                )}
            </span>
        ),
    },

    {
        key:
            "module",
        title:
            "Module",

        render: (
            row: any
        ) => (
            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {getRowModule(
                    row
                )}
            </span>
        ),
    },

    {
        key:
            "voucherDate",
        title:
            "Voucher Date",

        render: (
            row: any
        ) => (
            <span className="font-medium text-muted-foreground">
                {formatDisplayDate(
                    getVoucherDate(
                        row
                    )
                )}
            </span>
        ),
    },

    {
        key:
            "account",
        title:
            "Account",

        render: (
            row: any
        ) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {getAccountName(
                        row
                    )}
                </div>

                <div className="text-xs text-muted-foreground">
                    {getAccountCode(
                        row
                    )}
                </div>
            </div>
        ),
    },

    {
        key:
            "netAmount",
        title:
            "Net Amount",

        render: (
            row: any
        ) => (
            <span className="font-semibold text-card-foreground">
                {formatMoney(
                    row?.netAmount
                )}
            </span>
        ),
    },

    {
        key:
            "adjustedAmount",
        title:
            "Adjusted Amount",

        render: (
            row: any
        ) => (
            <span className="font-semibold text-success">
                {formatMoney(
                    row?.adjustedAmount
                )}
            </span>
        ),
    },

    {
        key:
            "outstandingAmount",
        title:
            "Outstanding Amount",

        render: (
            row: any
        ) => (
            <span className="font-semibold text-danger">
                {formatMoney(
                    row?.outstandingAmount
                )}
            </span>
        ),
    },
];

/* ===================================================
   CASH BANK REPORT
=================================================== */

const CashBankReport = () => {
    const dispatch =
        useDispatch<any>();

    const {
        cashBankReport = [],
        listingLoader = false,
        exportLoader = "",
        pagination = {},
        totalNetAmount = 0,
        error = null,
    } = useSelector(
        (
            state: any
        ) =>
            state.cashBankReport ||
            {}
    );

    const {
        accounts = [],
    } = useSelector(
        (
            state: any
        ) =>
            state.accountMaster ||
            {}
    );

    const [
        localOffset,
        setLocalOffset,
    ] = useState(0);

    const [
        localLimit,
        setLocalLimit,
    ] = useState(10);

    const [
        fromDate,
        setFromDate,
    ] = useState<string>(
        getFirstDateOfCurrentMonth()
    );

    const [
        toDate,
        setToDate,
    ] = useState<string>(
        todayYMD()
    );

    const [
        accountCode,
        setAccountCode,
    ] = useState("");

    const [
        module,
        setModule,
    ] =
        useState<CashBankModule>(
            "receipt"
        );

    /* ===================================================
       ACCOUNT OPTIONS
    =================================================== */

    const cashBankAccounts =
        useMemo(() => {
            return (
                accounts || []
            ).filter(
                (
                    account: any
                ) => {
                    const accountType =
                        String(
                            account
                                ?.accountType ||
                            ""
                        )
                            .trim()
                            .toLowerCase();

                    return (
                        accountType ===
                            "cash" ||
                        accountType ===
                            "bank"
                    );
                }
            );
        }, [
            accounts,
        ]);

    const accountOptions =
        useMemo(() => {
            return cashBankAccounts.map(
                (
                    account: any
                ) => ({
                    label:
                        account
                            ?.accountName ||
                        "",

                    value:
                        account
                            ?.accountCode ||
                        "",

                    type:
                        account
                            ?.accountType ||
                        "",
                })
            );
        }, [
            cashBankAccounts,
        ]);

    const selectedAccount =
        useMemo(() => {
            return (
                cashBankAccounts.find(
                    (
                        account: any
                    ) =>
                        String(
                            account
                                ?.accountCode ||
                            ""
                        ) ===
                        String(
                            accountCode ||
                            ""
                        )
                ) ||
                null
            );
        }, [
            cashBankAccounts,
            accountCode,
        ]);

    /* ===================================================
       LOAD CASH/BANK ACCOUNTS
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset:
                    0,
                limit:
                    500,
                accountType:
                    "cash,bank",
            } as any)
        );
    }, [
        dispatch,
    ]);

    /* ===================================================
       LOAD CASH BANK REPORT
    =================================================== */

    useEffect(() => {
        if (
            !accountCode
        ) {
            dispatch(
                clearCashBankReportData()
            );

            return;
        }

        if (
            !fromDate ||
            !toDate
        ) {
            dispatch(
                clearCashBankReportData()
            );

            return;
        }

        if (
            new Date(fromDate) >
            new Date(toDate)
        ) {
            dispatch(
                clearCashBankReportData()
            );

            return;
        }

        dispatch(
            getCashBankReport({
                module,
                accountCode,
                fromDate,
                toDate,
                offset:
                    localOffset,
                limit:
                    localLimit,
            })
        );
    }, [
        dispatch,
        module,
        accountCode,
        fromDate,
        toDate,
        localOffset,
        localLimit,
    ]);

    /* ===================================================
       DOWNLOAD FILE
    =================================================== */

    const downloadBlobFile = (
        blob: Blob,
        fileName: string
    ) => {
        const url =
            window.URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            fileName;

        document.body.appendChild(
            link
        );

        link.click();
        link.remove();

        window.URL.revokeObjectURL(
            url
        );
    };

    const handleDownload =
        async (
            exportType: CashBankExportType
        ) => {
            if (
                !accountCode
            ) {
                toast.error(
                    "Please select Cash/Bank account"
                );

                return;
            }

            if (
                !fromDate ||
                !toDate
            ) {
                toast.error(
                    "Please select From Date and To Date"
                );

                return;
            }

            if (
                new Date(fromDate) >
                new Date(toDate)
            ) {
                toast.error(
                    "From Date cannot be greater than To Date"
                );

                return;
            }

            try {
                const response =
                    await dispatch(
                        exportCashBankReport({
                            module,
                            accountCode,
                            fromDate,
                            toDate,
                            exportType,
                        })
                    ).unwrap();

                if (
                    !response?.blob
                ) {
                    throw new Error(
                        "Downloaded file is empty"
                    );
                }

                const extension =
                    exportType ===
                    "pdf"
                        ? "pdf"
                        : "xlsx";

                const safeAccountCode =
                    String(
                        accountCode
                    )
                        .replace(
                            /[^a-zA-Z0-9_-]/g,
                            "_"
                        );

                downloadBlobFile(
                    response.blob,
                    `cash-bank-report-${module}-${safeAccountCode}.${extension}`
                );

                toast.success(
                    exportType ===
                        "pdf"
                        ? "PDF downloaded successfully"
                        : "Excel downloaded successfully"
                );
            } catch (
                downloadError: any
            ) {
                toast.error(
                    downloadError
                        ?.message ||
                    downloadError
                        ?.payload
                        ?.message ||
                    "Failed to download Cash/Bank report"
                );
            }
        };

    const handleDownloadPdf =
        () => {
            handleDownload(
                "pdf"
            );
        };

    const handleDownloadExcel =
        () => {
            handleDownload(
                "excel"
            );
        };

    /* ===================================================
       CLEAR FILTERS
    =================================================== */

    const handleClearFilters =
        () => {
            setFromDate(
                getFirstDateOfCurrentMonth()
            );

            setToDate(
                todayYMD()
            );

            setAccountCode(
                ""
            );

            setModule(
                "receipt"
            );

            setLocalOffset(
                0
            );

            setLocalLimit(
                10
            );

            dispatch(
                clearCashBankReportData()
            );
        };

    /* ===================================================
       SUMMARY
    =================================================== */

    const selectedAccountName =
        selectedAccount
            ?.accountName ||
        "-";

    const selectedAccountType =
        selectedAccount
            ?.accountType
            ? String(
                selectedAccount
                    .accountType
            )
                .charAt(0)
                .toUpperCase() +
            String(
                selectedAccount
                    .accountType
            ).slice(1)
            : "-";

    const summaryItems = [
        {
            label:
                "Report Type",

            value:
                module ===
                "payment"
                    ? "Payment"
                    : "Receipt",
        },

        {
            label:
                "Account Type",

            value:
                selectedAccountType,
        },

        {
            label:
                "From Date",

            value:
                formatDisplayDate(
                    fromDate
                ),
        },

        {
            label:
                "To Date",

            value:
                formatDisplayDate(
                    toDate
                ),
        },

        {
            label:
                "Total Records",

            value:
                String(
                    pagination
                        ?.totalDocs ??
                    cashBankReport
                        .length ??
                    0
                ),
        },
    ];

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            {/* ===================================================
                FILTERS AND SUMMARY
            =================================================== */}

            <div
                className="
                    grid w-full grid-cols-1 gap-4 xl:grid-cols-2
                    [&>*]:rounded-xl
                    [&>*]:!p-4
                    [&_h3]:!text-base
                    [&_h2]:!text-base
                    [&_p]:!text-sm
                    [&_label]:!text-xs
                    [&_input]:!h-10
                    [&_input]:!text-sm
                    [&_select]:!h-10
                    [&_select]:!text-sm
                    [&_.text-xl]:!text-lg
                    [&_.text-lg]:!text-base
                "
            >
                <ReportFilterCard
                    title="Cash Bank Report Filters"

                    fields={[
                        {
                            key:
                                "fromDate",

                            type:
                                "date",

                            label:
                                "From Date",

                            value:
                                fromDate,

                            onChange:
                                (
                                    value
                                ) => {
                                    setFromDate(
                                        value
                                    );

                                    setLocalOffset(
                                        0
                                    );
                                },

                            required:
                                false,
                        },

                        {
                            key:
                                "toDate",

                            type:
                                "date",

                            label:
                                "To Date",

                            value:
                                toDate,

                            onChange:
                                (
                                    value
                                ) => {
                                    setToDate(
                                        value
                                    );

                                    setLocalOffset(
                                        0
                                    );
                                },

                            required:
                                false,
                        },

                        {
                            key:
                                "accountCode",

                            type:
                                "select",

                            label:
                                "Cash / Bank Account",

                            placeholder:
                                "Select Cash / Bank Account",

                            value:
                                accountCode,

                            options:
                                accountOptions,

                            onChange:
                                (
                                    value
                                ) => {
                                    setAccountCode(
                                        value
                                    );

                                    setLocalOffset(
                                        0
                                    );
                                },

                            required:
                                false,

                            colSpan:
                                "full",
                        },

                        {
                            key:
                                "module",

                            type:
                                "select",

                            label:
                                "Transaction Type",

                            placeholder:
                                "Select Transaction Type",

                            value:
                                module,

                            options: [
                                {
                                    label:
                                        "Receipt",
                                    value:
                                        "receipt",
                                },
                                {
                                    label:
                                        "Payment",
                                    value:
                                        "payment",
                                },
                            ],

                            onChange:
                                (
                                    value
                                ) => {
                                    setModule(
                                        value as CashBankModule
                                    );

                                    setLocalOffset(
                                        0
                                    );
                                },

                            required:
                                false,

                            colSpan:
                                "full",
                        },
                    ]}

                    gridCols="2"

                    onDownloadPdf={
                        handleDownloadPdf
                    }

                    onDownloadExcel={
                        handleDownloadExcel
                    }

                    pdfDisabled={
                        !accountCode ||
                        exportLoader ===
                        "pdf"
                    }

                    excelDisabled={
                        !accountCode ||
                        exportLoader ===
                        "excel"
                    }

                    pdfLoading={
                        exportLoader ===
                        "pdf"
                    }

                    excelLoading={
                        exportLoader ===
                        "excel"
                    }

                    downloadDisabledMessage="Please select Cash/Bank account to download the report."
                />

                <AccountSummaryCard
                    title="Cash / Bank Account"

                    accountName={
                        selectedAccountName
                    }

                    summaryItems={
                        summaryItems
                    }

                    finalLabel="Total Net Amount"

                    finalValue={
                        formatMoney(
                            totalNetAmount
                        )
                    }
                />
            </div>

            {/* ===================================================
                CLEAR FILTER
            =================================================== */}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={
                        handleClearFilters
                    }
                    className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                    Clear Filters
                </button>
            </div>

            {/* ===================================================
                ERROR
            =================================================== */}

            {error && (
                <div className="rounded-md border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {error}
                </div>
            )}

            {/* ===================================================
                REPORT TABLE
            =================================================== */}

            <DataTable
                columns={
                    mainColumns
                }

                data={
                    cashBankReport
                }

                loading={
                    listingLoader
                }

                emptyMessage={
                    accountCode
                        ? `No ${module} outstanding records found`
                        : "Select Cash/Bank account to view report"
                }

                showFieldSelector={
                    false
                }
            />

            {/* ===================================================
                PAGINATION
            =================================================== */}

            {pagination?.totalDocs >
                0 && (
                <div className="mt-2">
                    <Pagination
                        localLimit={
                            localLimit
                        }

                        selectCb={(
                            event: any
                        ) => {
                            setLocalLimit(
                                Number(
                                    event
                                        .target
                                        .value
                                )
                            );

                            setLocalOffset(
                                0
                            );
                        }}

                        preDisabled={
                            !pagination
                                ?.hasPrevPage
                        }

                        nextDisabled={
                            !pagination
                                ?.hasNextPage
                        }

                        setLocalOffset={
                            setLocalOffset
                        }

                        pagination={
                            pagination
                        }
                    />
                </div>
            )}
        </div>
    );
};

export default CashBankReport;