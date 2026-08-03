import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
    type UIEvent,
} from "react";
import {
    CheckCircle2,
    FileSpreadsheet,
    FileText,
    IndianRupee,
    ReceiptText,
    RefreshCcw,
    RotateCcw,
    Search,
    ShoppingCart,
    WalletCards,
} from "lucide-react";
import {
    useDispatch,
    useSelector,
} from "react-redux";
import { toast } from "react-toastify";

import Badge from "../../../components/badge";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/modal";

import {
    getAllSalesOrder,
} from "../../../redux/slices/professionalSlice/salesWorkflow/salesOrderSlice";

import {
    clearDrillDownReport,
    exportDrillDownReport,
    getDrillDownReport,
    type DrillDownExportType,
} from "../../../redux/slices/professionalSlice/drillDownReportSlice";

const SALES_ORDER_PAGE_LIMIT = 20;

type ReportTab =
    | "salesInvoices"
    | "receipts"
    | "salesReturns";

/* ===================================================
   HELPERS
=================================================== */

const toNumber = (
    value: any
) => {
    const number =
        Number(value || 0);

    return Number.isFinite(
        number
    )
        ? number
        : 0;
};

const formatCurrency = (
    value: any
) => {
    return new Intl.NumberFormat(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    ).format(
        toNumber(value)
    );
};

const formatDate = (
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

const capitalize = (
    value: any
) => {
    const text =
        String(
            value || ""
        ).trim();

    if (!text) {
        return "-";
    }

    return (
        text
            .charAt(0)
            .toUpperCase() +
        text.slice(1)
    );
};

const getSalesOrderKey = (
    salesOrder: any,
    index: number
) => {
    return String(
        salesOrder
            ?.sOrderVoucherNumber ||
        salesOrder
            ?.voucherNumber ||
        salesOrder?._id ||
        `sales-order-${index}`
    );
};

const mergeUniqueSalesOrders = (
    previousRecords: any[],
    newRecords: any[]
) => {
    const recordsMap =
        new Map<string, any>();

    [
        ...previousRecords,
        ...newRecords,
    ].forEach(
        (
            salesOrder: any,
            index: number
        ) => {
            recordsMap.set(
                getSalesOrderKey(
                    salesOrder,
                    index
                ),
                salesOrder
            );
        }
    );

    return Array.from(
        recordsMap.values()
    );
};

const getInitialReportTab = (
    reportData: any
): ReportTab => {
    if (
        Array.isArray(
            reportData
                ?.salesInvoices
        ) &&
        reportData
            .salesInvoices
            .length >
        0
    ) {
        return "salesInvoices";
    }

    if (
        Array.isArray(
            reportData?.receipts
        ) &&
        reportData.receipts
            .length >
        0
    ) {
        return "receipts";
    }

    if (
        Array.isArray(
            reportData
                ?.salesReturns
        ) &&
        reportData
            .salesReturns
            .length >
        0
    ) {
        return "salesReturns";
    }

    return "salesInvoices";
};

const renderStatus = (
    status: any
) => {
    return (
        <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
            {capitalize(status)}
        </span>
    );
};

/* ===================================================
   SALES INVOICE COLUMNS
=================================================== */

const salesInvoiceColumns = [
    {
        key:
            "sInvVoucherNumber",
        title:
            "Invoice No.",
        render: (
            row: any
        ) => (
            <span className="font-medium text-card-foreground">
                {row
                    ?.sInvVoucherNumber ||
                    "-"}
            </span>
        ),
    },
    {
        key:
            "sInvVoucherDate",
        title:
            "Date",
        render: (
            row: any
        ) =>
            formatDate(
                row
                    ?.sInvVoucherDate
            ),
    },
    {
        key:
            "sInvCustomerName",
        title:
            "Customer",
        render: (
            row: any
        ) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row
                        ?.sInvCustomerName ||
                        "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row
                        ?.sInvCustomerCode ||
                        "-"}
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
            <span className="font-semibold text-primary">
                ₹
                {formatCurrency(
                    row
                        ?.sInvFooter
                        ?.netAmount ??
                    row?.netAmount
                )}
            </span>
        ),
    },
    {
        key:
            "balanceAmount",
        title:
            "Balance",
        render: (
            row: any
        ) => (
            <span className="font-semibold text-card-foreground">
                ₹
                {formatCurrency(
                    row
                        ?.sInvFooter
                        ?.balanceAmount ??
                    row
                        ?.balanceAmount
                )}
            </span>
        ),
    },
    {
        key:
            "sInvStatus",
        title:
            "Status",
        render: (
            row: any
        ) =>
            renderStatus(
                row?.sInvStatus
            ),
    },
];

/* ===================================================
   RECEIPT COLUMNS
=================================================== */

const receiptColumns = [
    {
        key:
            "recVoucherNumber",
        title:
            "Receipt No.",
        render: (
            row: any
        ) => (
            <span className="font-medium text-card-foreground">
                {row
                    ?.recVoucherNumber ||
                    "-"}
            </span>
        ),
    },
    {
        key:
            "recVoucherDate",
        title:
            "Date",
        render: (
            row: any
        ) =>
            formatDate(
                row
                    ?.recVoucherDate
            ),
    },
    {
        key:
            "recAccountName",
        title:
            "Account",
        render: (
            row: any
        ) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row
                        ?.recAccountName ||
                        "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row
                        ?.recAccountCode ||
                        "-"}
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
            <span className="font-semibold text-primary">
                ₹
                {formatCurrency(
                    row
                        ?.recFooter
                        ?.netAmount ??
                    row?.netAmount
                )}
            </span>
        ),
    },
    {
        key:
            "adjustedAmount",
        title:
            "Adjusted",
        render: (
            row: any
        ) => (
            <span className="font-semibold text-card-foreground">
                ₹
                {formatCurrency(
                    row
                        ?.recFooter
                        ?.adjustedAmount ??
                    row
                        ?.adjustedAmount
                )}
            </span>
        ),
    },
    {
        key:
            "references",
        title:
            "References",
        render: (
            row: any
        ) => {
            const references =
                row
                    ?.recBody
                    ?.[0]
                    ?.references;

            if (
                !Array.isArray(
                    references
                ) ||
                references
                    .length ===
                0
            ) {
                return (
                    <span className="text-muted-foreground">
                        -
                    </span>
                );
            }

            return (
                <div className="flex min-w-[170px] flex-col gap-1">
                    {references.map(
                        (
                            reference: any,
                            index: number
                        ) => (
                            <div
                                key={`${reference?.salesInvoice || index}`}
                                className="flex items-center justify-between gap-3 text-xs"
                            >
                                <span className="font-medium text-card-foreground">
                                    {reference
                                        ?.salesInvoice ||
                                        "-"}
                                </span>

                                <span className="font-semibold text-primary">
                                    ₹
                                    {formatCurrency(
                                        reference
                                            ?.adjustedAmount
                                    )}
                                </span>
                            </div>
                        )
                    )}
                </div>
            );
        },
    },
    {
        key:
            "recStatus",
        title:
            "Status",
        render: (
            row: any
        ) =>
            renderStatus(
                row?.recStatus
            ),
    },
];

/* ===================================================
   SALES RETURN COLUMNS
=================================================== */

const salesReturnColumns = [
    {
        key:
            "sInvReturnVoucherNumber",
        title:
            "Return No.",
        render: (
            row: any
        ) => (
            <span className="font-medium text-card-foreground">
                {row
                    ?.sInvReturnVoucherNumber ||
                    "-"}
            </span>
        ),
    },
    {
        key:
            "sInvReturnVoucherDate",
        title:
            "Date",
        render: (
            row: any
        ) =>
            formatDate(
                row
                    ?.sInvReturnVoucherDate
            ),
    },
    {
        key:
            "sInvVoucherNumber",
        title:
            "Against Invoice",
        render: (
            row: any
        ) =>
            row
                ?.sInvVoucherNumber ||
            "-",
    },
    {
        key:
            "sInvReturnCustomerName",
        title:
            "Customer",
        render: (
            row: any
        ) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row
                        ?.sInvReturnCustomerName ||
                        "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row
                        ?.sInvReturnCustomerCode ||
                        "-"}
                </div>
            </div>
        ),
    },
    {
        key:
            "netAmount",
        title:
            "Return Amount",
        render: (
            row: any
        ) => (
            <span className="font-semibold text-primary">
                ₹
                {formatCurrency(
                    row
                        ?.sInvReturnFooter
                        ?.netAmount ??
                    row?.netAmount
                )}
            </span>
        ),
    },
    {
        key:
            "products",
        title:
            "Products",
        render: (
            row: any
        ) => {
            const products =
                Array.isArray(
                    row
                        ?.sInvReturnBody
                )
                    ? row
                        .sInvReturnBody
                    : [];

            if (
                products.length ===
                0
            ) {
                return (
                    <span className="text-muted-foreground">
                        -
                    </span>
                );
            }

            return (
                <div className="flex min-w-[180px] flex-col gap-1">
                    {products.map(
                        (
                            product: any,
                            index: number
                        ) => (
                            <div
                                key={`${product?.productCode ||
                                    product?.productName ||
                                    index}`}
                                className="flex items-center justify-between gap-3 text-xs"
                            >
                                <span className="max-w-[120px] truncate font-medium text-card-foreground">
                                    {product
                                        ?.productName ||
                                        product
                                            ?.productCode ||
                                        "-"}
                                </span>

                                <span className="font-semibold text-primary">
                                    ₹
                                    {formatCurrency(
                                        product
                                            ?.netAmount
                                    )}
                                </span>
                            </div>
                        )
                    )}
                </div>
            );
        },
    },
    {
        key:
            "sInvReturnStatus",
        title:
            "Status",
        render: (
            row: any
        ) =>
            renderStatus(
                row
                    ?.sInvReturnStatus
            ),
    },
];

/* ===================================================
   SUMMARY CARD
=================================================== */

type SummaryCardProps = {
    title: string;
    value: string;
    icon: ReactNode;
};

const SummaryCard = ({
    title,
    value,
    icon,
}: SummaryCardProps) => {
    return (
        <div className="rounded-md border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>

                    <p className="mt-1 text-xl font-bold text-card-foreground">
                        {value}
                    </p>
                </div>

                <div className="rounded-md bg-primary/10 p-2 text-primary">
                    {icon}
                </div>
            </div>
        </div>
    );
};

/* ===================================================
   DRILL DOWN REPORT
=================================================== */

const DrillDownReport = () => {
    const dispatch =
        useDispatch<any>();

    const {
        reportLoader = false,
        exportLoader = "",
        report = null,
    } = useSelector(
        (
            state: any
        ) =>
            state
                .drillDownReport ||
            {}
    );

    const [
        showSalesOrderModal,
        setShowSalesOrderModal,
    ] = useState(true);

    const [
        selectedOrder,
        setSelectedOrder,
    ] = useState("");

    const [
        selectedSalesOrderRecord,
        setSelectedSalesOrderRecord,
    ] = useState<any>(
        null
    );

    const [
        confirmedSalesOrderRecord,
        setConfirmedSalesOrderRecord,
    ] = useState<any>(
        null
    );

    const [
        activeTab,
        setActiveTab,
    ] =
        useState<ReportTab>(
            "salesInvoices"
        );

    /* ===================================================
       LOCAL SALES ORDER SCROLL PAGINATION
    =================================================== */

    const [
        salesOrderList,
        setSalesOrderList,
    ] = useState<any[]>(
        []
    );

    const [
        salesOrderPagination,
        setSalesOrderPagination,
    ] = useState<any>(
        null
    );

    const [
        salesOrderSearch,
        setSalesOrderSearch,
    ] = useState("");

    const [
        debouncedSalesOrderSearch,
        setDebouncedSalesOrderSearch,
    ] = useState("");

    const [
        salesOrderOffset,
        setSalesOrderOffset,
    ] = useState(0);

    const [
        salesOrderInitialLoading,
        setSalesOrderInitialLoading,
    ] = useState(false);

    const [
        salesOrderMoreLoading,
        setSalesOrderMoreLoading,
    ] = useState(false);

    const loadingMoreRef =
        useRef(false);

    const requestIdRef =
        useRef(0);

    /* ===================================================
       REPORT DATA
    =================================================== */

    const salesInvoices =
        useMemo(() => {
            return Array.isArray(
                report
                    ?.salesInvoices
            )
                ? report
                    .salesInvoices
                : [];
        }, [
            report
                ?.salesInvoices,
        ]);

    const receipts =
        useMemo(() => {
            return Array.isArray(
                report?.receipts
            )
                ? report.receipts
                : [];
        }, [
            report?.receipts,
        ]);

    const salesReturns =
        useMemo(() => {
            return Array.isArray(
                report
                    ?.salesReturns
            )
                ? report
                    .salesReturns
                : [];
        }, [
            report
                ?.salesReturns,
        ]);

    const totalRecords =
        salesInvoices.length +
        receipts.length +
        salesReturns.length;

    const hasMoreSalesOrders =
        useMemo(() => {
            if (
                !salesOrderPagination
            ) {
                return false;
            }

            if (
                typeof salesOrderPagination
                    ?.hasNextPage ===
                "boolean"
            ) {
                return salesOrderPagination
                    .hasNextPage;
            }

            const totalDocs =
                Number(
                    salesOrderPagination
                        ?.totalDocs ||
                    0
                );

            return (
                totalDocs >
                0 &&
                salesOrderList
                    .length <
                totalDocs
            );
        }, [
            salesOrderPagination,
            salesOrderList
                .length,
        ]);

    const tabs = [
        {
            key:
                "salesInvoices" as ReportTab,
            label:
                "Sales Invoices",
            count:
                salesInvoices.length,
        },
        {
            key:
                "receipts" as ReportTab,
            label:
                "Receipts",
            count:
                receipts.length,
        },
        {
            key:
                "salesReturns" as ReportTab,
            label:
                "Sales Returns",
            count:
                salesReturns.length,
        },
    ];

    const activeColumns =
        activeTab ===
            "salesInvoices"
            ? salesInvoiceColumns
            : activeTab ===
                "receipts"
                ? receiptColumns
                : salesReturnColumns;

    const activeData =
        activeTab ===
            "salesInvoices"
            ? salesInvoices
            : activeTab ===
                "receipts"
                ? receipts
                : salesReturns;

    const activeEmptyMessage =
        activeTab ===
            "salesInvoices"
            ? "No sales invoices found"
            : activeTab ===
                "receipts"
                ? "No receipts found"
                : "No sales returns found";

    /* ===================================================
       SEARCH DEBOUNCE
    =================================================== */

    useEffect(() => {
        if (
            !showSalesOrderModal
        ) {
            return;
        }

        const normalizedSearch =
            salesOrderSearch.trim();

        if (
            normalizedSearch ===
            debouncedSalesOrderSearch
        ) {
            return;
        }

        const timer =
            setTimeout(() => {
                requestIdRef.current +=
                    1;

                loadingMoreRef.current =
                    false;

                setSalesOrderList(
                    []
                );

                setSalesOrderPagination(
                    null
                );

                setSalesOrderOffset(
                    0
                );

                setSelectedSalesOrderRecord(
                    null
                );

                setDebouncedSalesOrderSearch(
                    normalizedSearch
                );
            }, 400);

        return () =>
            clearTimeout(timer);
    }, [
        showSalesOrderModal,
        salesOrderSearch,
        debouncedSalesOrderSearch,
    ]);

    /* ===================================================
       SALES ORDER PAGINATED API
    =================================================== */

    useEffect(() => {
        if (
            !showSalesOrderModal
        ) {
            return;
        }

        let isActive =
            true;

        const requestId =
            ++requestIdRef.current;

        const isLoadingMore =
            salesOrderOffset >
            0;

        const loadSalesOrders =
            async () => {
                if (
                    isLoadingMore
                ) {
                    setSalesOrderMoreLoading(
                        true
                    );
                } else {
                    setSalesOrderInitialLoading(
                        true
                    );
                }

                try {
                    const response =
                        await dispatch(
                            getAllSalesOrder({
                                offset:
                                    salesOrderOffset,
                                limit:
                                    SALES_ORDER_PAGE_LIMIT,
                                search:
                                    debouncedSalesOrderSearch,
                            })
                        ).unwrap();

                    if (
                        !isActive ||
                        requestId !==
                        requestIdRef.current
                    ) {
                        return;
                    }

                    const records =
                        Array.isArray(
                            response
                                ?.records
                        )
                            ? response
                                .records
                            : [];

                    setSalesOrderPagination(
                        response
                            ?.pagination ||
                        null
                    );

                    setSalesOrderList(
                        (
                            previousRecords
                        ) => {
                            if (
                                salesOrderOffset ===
                                0
                            ) {
                                return mergeUniqueSalesOrders(
                                    [],
                                    records
                                );
                            }

                            return mergeUniqueSalesOrders(
                                previousRecords,
                                records
                            );
                        }
                    );
                } catch (
                error: any
                ) {
                    if (
                        !isActive ||
                        requestId !==
                        requestIdRef.current
                    ) {
                        return;
                    }

                    if (
                        salesOrderOffset ===
                        0
                    ) {
                        setSalesOrderList(
                            []
                        );

                        setSalesOrderPagination(
                            null
                        );
                    }

                    toast.error(
                        error?.message ||
                        error
                            ?.payload
                            ?.message ||
                        "Failed to fetch sales orders"
                    );
                } finally {
                    if (
                        isActive &&
                        requestId ===
                        requestIdRef.current
                    ) {
                        setSalesOrderInitialLoading(
                            false
                        );

                        setSalesOrderMoreLoading(
                            false
                        );

                        loadingMoreRef.current =
                            false;
                    }
                }
            };

        loadSalesOrders();

        return () => {
            isActive =
                false;
        };
    }, [
        dispatch,
        showSalesOrderModal,
        salesOrderOffset,
        debouncedSalesOrderSearch,
    ]);

    /* ===================================================
       MODAL HELPERS
    =================================================== */

    const resetSalesOrderModal =
        () => {
            requestIdRef.current +=
                1;

            loadingMoreRef.current =
                false;

            setSalesOrderList(
                []
            );

            setSalesOrderPagination(
                null
            );

            setSalesOrderOffset(
                0
            );

            setSalesOrderSearch(
                ""
            );

            setDebouncedSalesOrderSearch(
                ""
            );

            setSalesOrderInitialLoading(
                false
            );

            setSalesOrderMoreLoading(
                false
            );
        };

    const handleOpenSalesOrderModal =
        () => {
            resetSalesOrderModal();

            setSelectedSalesOrderRecord(
                confirmedSalesOrderRecord
            );

            setShowSalesOrderModal(
                true
            );
        };

    const handleSalesOrderModalClose =
        () => {
            resetSalesOrderModal();

            setSelectedSalesOrderRecord(
                confirmedSalesOrderRecord
            );

            setShowSalesOrderModal(
                false
            );
        };

    const handleSalesOrderConfirm =
        async () => {
            const voucherNumber =
                selectedSalesOrderRecord
                    ?.sOrderVoucherNumber ||
                selectedSalesOrderRecord
                    ?.voucherNumber;

            if (
                !voucherNumber
            ) {
                toast.error(
                    "Please select a sales order"
                );

                return;
            }

            requestIdRef.current +=
                1;

            loadingMoreRef.current =
                false;

            setConfirmedSalesOrderRecord(
                selectedSalesOrderRecord
            );

            setSelectedOrder(
                voucherNumber
            );

            setShowSalesOrderModal(
                false
            );

            dispatch(
                clearDrillDownReport()
            );

            try {
                const reportData =
                    await dispatch(
                        getDrillDownReport({
                            salesOrderNumber:
                                voucherNumber,
                        })
                    ).unwrap();

                setActiveTab(
                    getInitialReportTab(
                        reportData
                    )
                );
            } catch (
            error: any
            ) {
                toast.error(
                    error?.message ||
                    error
                        ?.payload
                        ?.message ||
                    "Failed to load drill-down report"
                );
            }
        };

    /* ===================================================
       SCROLL PAGINATION
    =================================================== */

    const handleSalesOrderScroll = (
        event: UIEvent<HTMLDivElement>
    ) => {
        const {
            scrollTop,
            scrollHeight,
            clientHeight,
        } =
            event.currentTarget;

        const reachedBottom =
            scrollHeight -
            scrollTop -
            clientHeight <=
            100;

        if (
            !reachedBottom ||
            salesOrderInitialLoading ||
            salesOrderMoreLoading ||
            loadingMoreRef.current ||
            !hasMoreSalesOrders
        ) {
            return;
        }

        loadingMoreRef.current =
            true;

        setSalesOrderOffset(
            (
                previousOffset
            ) =>
                previousOffset +
                SALES_ORDER_PAGE_LIMIT
        );
    };

    /* ===================================================
       EXPORT
    =================================================== */

    const handleExport = async (
        exportType: DrillDownExportType
    ) => {
        if (
            !selectedOrder
        ) {
            toast.error(
                "Please select a sales order"
            );

            return;
        }

        try {
            await dispatch(
                exportDrillDownReport({
                    salesOrderNumber:
                        selectedOrder,
                    exportType,
                })
            ).unwrap();

            toast.success(
                exportType ===
                    "pdf"
                    ? "PDF downloaded successfully"
                    : "Excel downloaded successfully"
            );
        } catch (
        error: any
        ) {
            toast.error(
                error?.message ||
                error
                    ?.payload
                    ?.message ||
                "Failed to download report"
            );
        }
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            {/* ===================================================
                HEADER
            =================================================== */}

            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <Badge
                        {...{
                            count:
                                selectedOrder ||
                                "-",
                            text:
                                "Selected Sales Order:",
                            varient:
                                "primary",
                        }}
                    />

                    {report && (
                        <Badge
                            {...{
                                count:
                                    totalRecords,
                                text:
                                    "Linked Transactions:",
                                varient:
                                    "primary",
                            }}
                        />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <button
                        type="button"
                        onClick={
                            handleOpenSalesOrderModal
                        }
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition hover:bg-primary/10 hover:text-primary"
                    >
                        <RefreshCcw
                            size={
                                16
                            }
                        />

                        {selectedOrder
                            ? "Change Sales Order"
                            : "Select Sales Order"}
                    </button>

                    <button
                        type="button"
                        disabled={
                            !selectedOrder ||
                            !!exportLoader
                        }
                        onClick={() =>
                            handleExport(
                                "pdf"
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-md bg-danger px-3 py-2 text-sm font-medium text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {exportLoader ===
                            "pdf" ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <FileText
                                size={
                                    16
                                }
                            />
                        )}

                        Download PDF
                    </button>

                    <button
                        type="button"
                        disabled={
                            !selectedOrder ||
                            !!exportLoader
                        }
                        onClick={() =>
                            handleExport(
                                "excel"
                            )
                        }
                        className="inline-flex items-center gap-2 rounded-md bg-success px-3 py-2 text-sm font-medium text-white transition hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {exportLoader ===
                            "excel" ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <FileSpreadsheet
                                size={
                                    16
                                }
                            />
                        )}

                        Download Excel
                    </button>
                </div>
            </div>

            {/* ===================================================
                EMPTY STATE
            =================================================== */}

            {!selectedOrder ? (
                <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center rounded-md border border-dashed border-border bg-background/50 p-6 text-center">
                    <div className="rounded-md bg-primary/10 p-3 text-primary">
                        <ShoppingCart
                            size={
                                28
                            }
                        />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-card-foreground">
                        Select Sales Order
                    </h2>

                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        Select a Sales
                        Order to view
                        linked invoices,
                        receipts and
                        returns.
                    </p>

                    <button
                        type="button"
                        onClick={
                            handleOpenSalesOrderModal
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                        <Search
                            size={
                                16
                            }
                        />

                        Select Sales Order
                    </button>
                </div>
            ) : reportLoader ? (
                <div className="flex min-h-[400px] flex-1 items-center justify-center">
                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

                        Loading drill
                        down report...
                    </div>
                </div>
            ) : !report ? (
                <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center rounded-md border border-border bg-background/50 p-6 text-center">
                    <FileText
                        size={28}
                        className="text-muted-foreground"
                    />

                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                        No drill down
                        report data found
                    </p>
                </div>
            ) : (
                <>
                    {/* ===================================================
                        SUMMARY
                    =================================================== */}

                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            title="Invoice Net Total"
                            value={`₹${formatCurrency(
                                report
                                    ?.summary
                                    ?.invoiceNetTotal
                            )}`}
                            icon={
                                <IndianRupee
                                    size={
                                        18
                                    }
                                />
                            }
                        />

                        <SummaryCard
                            title="Invoice Balance"
                            value={`₹${formatCurrency(
                                report
                                    ?.summary
                                    ?.invoiceBalance
                            )}`}
                            icon={
                                <WalletCards
                                    size={
                                        18
                                    }
                                />
                            }
                        />

                        <SummaryCard
                            title="Receipt Total"
                            value={`₹${formatCurrency(
                                report
                                    ?.summary
                                    ?.receiptTotal
                            )}`}
                            icon={
                                <ReceiptText
                                    size={
                                        18
                                    }
                                />
                            }
                        />

                        <SummaryCard
                            title="Return Total"
                            value={`₹${formatCurrency(
                                report
                                    ?.summary
                                    ?.returnTotal
                            )}`}
                            icon={
                                <RotateCcw
                                    size={
                                        18
                                    }
                                />
                            }
                        />
                    </div>

                    {/* ===================================================
                        TRANSACTION TABS
                    =================================================== */}

                    <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-border pb-3">
                        {tabs.map(
                            (
                                tab
                            ) => {
                                const isActive =
                                    activeTab ===
                                    tab.key;

                                return (
                                    <button
                                        key={
                                            tab.key
                                        }
                                        type="button"
                                        onClick={() =>
                                            setActiveTab(
                                                tab.key
                                            )
                                        }
                                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${isActive
                                            ? "border-primary/20 bg-primary/10 text-primary"
                                            : "border-border bg-card text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                            }`}
                                    >
                                        {
                                            tab.label
                                        }

                                        <span
                                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {
                                                tab.count
                                            }
                                        </span>
                                    </button>
                                );
                            }
                        )}
                    </div>

                    {/* ===================================================
                        TABLE
                    =================================================== */}

                    <DataTable
                        columns={
                            activeColumns
                        }
                        data={
                            activeData
                        }
                        loading={
                            false
                        }
                        emptyMessage={
                            activeEmptyMessage
                        }
                        showFieldSelector={
                            false
                        }
                    />
                </>
            )}

            {/* ===================================================
                SALES ORDER MODAL
            =================================================== */}

            <Modal
                show={
                    showSalesOrderModal
                }
                setShow={
                    setShowSalesOrderModal
                }
                title="Select Sales Order"
                state={false}
                handleSubmit={
                    handleSalesOrderConfirm
                }
                handleClose={
                    handleSalesOrderModalClose
                }
                gridCols={1}
                maxWidth="2xl"
                modalClassName="rounded-xl"
                headerClassName="bg-card"
                footerClassName="bg-card"
                bodyClassName="!block !p-0 bg-card text-card-foreground"
                body={
                    <div className="flex h-[520px] flex-col bg-card text-card-foreground">
                        {/* SEARCH */}

                        <div className="border-b border-border p-5">
                            <input
                                value={
                                    salesOrderSearch
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSalesOrderSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search Sales Orders..."
                                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* SCROLLABLE LIST */}

                        <div
                            className="min-h-0 flex-1 overflow-y-auto p-5"
                            onScroll={
                                handleSalesOrderScroll
                            }
                        >
                            {salesOrderInitialLoading &&
                                salesOrderList.length ===
                                0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

                                    Loading Sales
                                    Orders...
                                </div>
                            ) : salesOrderList.length ===
                                0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    No Sales Orders
                                    found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {salesOrderList.map(
                                        (
                                            salesOrder: any,
                                            index: number
                                        ) => {
                                            const salesOrderNumber =
                                                salesOrder
                                                    ?.sOrderVoucherNumber ||
                                                salesOrder
                                                    ?.voucherNumber ||
                                                "-";

                                            const customerName =
                                                salesOrder
                                                    ?.sOrderCustomerName ||
                                                salesOrder
                                                    ?.customerName ||
                                                "NA";

                                            const customerCode =
                                                salesOrder
                                                    ?.sOrderCustomerCode ||
                                                salesOrder
                                                    ?.customerCode ||
                                                "NA";

                                            const items =
                                                Array.isArray(
                                                    salesOrder
                                                        ?.sOrderBody
                                                )
                                                    ? salesOrder
                                                        .sOrderBody
                                                    : [];

                                            const selectedVoucher =
                                                selectedSalesOrderRecord
                                                    ?.sOrderVoucherNumber ||
                                                selectedSalesOrderRecord
                                                    ?.voucherNumber;

                                            const isSelected =
                                                selectedVoucher ===
                                                salesOrderNumber;

                                            return (
                                                <button
                                                    key={`${getSalesOrderKey(
                                                        salesOrder,
                                                        index
                                                    )}-${index}`}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedSalesOrderRecord(
                                                            salesOrder
                                                        )
                                                    }
                                                    className={`w-full rounded-xl border px-4 py-4 text-left transition ${isSelected
                                                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/10"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-base font-bold text-card-foreground">
                                                                {
                                                                    salesOrderNumber
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    customerName
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                                Customer
                                                                Code:{" "}
                                                                {
                                                                    customerCode
                                                                }{" "}
                                                                | Items:{" "}
                                                                {
                                                                    items.length
                                                                }
                                                            </p>
                                                        </div>

                                                        {isSelected && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                                                                <CheckCircle2
                                                                    size={
                                                                        13
                                                                    }
                                                                />

                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        }
                                    )}

                                    {salesOrderMoreLoading && (
                                        <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-muted-foreground">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

                                            Loading more
                                            Sales Orders...
                                        </div>
                                    )}

                                    {!salesOrderInitialLoading &&
                                        !salesOrderMoreLoading &&
                                        !hasMoreSalesOrders &&
                                        salesOrderList.length >
                                        0 && (
                                            <div className="py-4 text-center text-xs font-medium text-muted-foreground">
                                                All Sales
                                                Orders loaded
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                }
            />
        </div>
    );
};

export default DrillDownReport;