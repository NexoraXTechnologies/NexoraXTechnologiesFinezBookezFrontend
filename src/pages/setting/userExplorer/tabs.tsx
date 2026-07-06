import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PrimaryButton } from "../../../components/buttons";
import { toast } from "react-toastify";

import {
    receiptColumns,
    salesInvoiceColumns,
    salesReturnColumns,
    purchaseReturnColumns,
    salesQuotationColumns,
    paymentColumns,
    purchaseInvoiceColumns,
    openingBalanceColumns,
    openingStockColumns,
    grnColumns,
    purchaseOrderColumns,
    salesOrderColumns,
} from "./columns";

import {
    getGrnRegister,
    getOpeningBalanceRegister,
    getOpeningStockRegister,
    getPaymentRegister,
    getPurchaseOrderRegister,
    getPurchaseRegister,
    getPurchaseReturnRegister,
    getQuotationRegister,
    getReceiptRegister,
    getSalesOrderRegister,
    getSalesRegister,
    getSalesReturnRegister,
} from "../../../redux/slices/professionalSlice/register";

const Tabs = ({ selectedRequest, setSelectedRequest }: any) => {
    const dispatch = useDispatch<any>();

    const tabsScrollRef = useRef<HTMLDivElement | null>(null);

    const [activeDetailTab, setActiveDetailTab] = useState("salesQuotation");

    const [filters, setFilters] = useState({
        fromDate: "",
        toDate: "",
    });

    const [appliedFilters, setAppliedFilters] = useState({
        fromDate: "",
        toDate: "",
    });

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const {
        quotationRegisterData = [],
        receiptRegisterData = [],
        salesRegisterData = [],
        salesOrderRegisterData = [],
        purchaseRegisterData = [],
        purchaseOrderRegisterData = [],
        grnRegisterData = [],
        salesReturnRegisterData = [],
        purchaseReturnRegisterData = [],
        paymentRegisterData = [],
        openingBalanceData = [],
        openingStockData = [],

        quotationLoading = false,
        receiptLoading = false,
        salesLoading = false,
        salesOrderLoading = false,
        purchaseLoading = false,
        purchaseOrderLoading = false,
        grnLoading = false,
        salesReturnLoading = false,
        purchaseReturnLoading = false,
        paymentLoading = false,
        openingBalanceLoading = false,
        openingStockLoading = false,
        exportLoading = false,

        quotationPagination,
        receiptPagination,
        salesPagination,
        salesOrderPagination,
        purchasePagination,
        purchaseOrderPagination,
        grnPagination,
        salesReturnPagination,
        purchaseReturnPagination,
        paymentPagination,
        openingBalancePagination,
        openingStockPagination,
    } = useSelector((state: any) => state.allRegisters || {});

    const tabs = [
        { key: "salesQuotation", label: "Sales Quotation" },
        { key: "salesOrder", label: "Sales Order" },
        { key: "salesInvoice", label: "Sales Invoice" },
        { key: "salesReturn", label: "Sales Return" },
        { key: "receipt", label: "Receipt" },
        { key: "purchaseOrder", label: "Purchase Order" },
        { key: "grn", label: "GRN" },
        { key: "purchaseReturn", label: "Purchase Return" },
        { key: "purchaseInvoice", label: "Purchase Invoice" },
        { key: "payment", label: "Payment" },
        { key: "openingBalance", label: "Opening Balance" },
        { key: "openingStock", label: "Opening Stock" },
    ];

    const normalizeRecords = (data: any) => {
        if (Array.isArray(data)) return data;

        return (
            data?.records ||
            data?.data ||
            data?.docs ||
            data?.items ||
            data?.quotations ||
            data?.quotation ||
            data?.sales ||
            data?.invoices ||
            data?.orders ||
            data?.salesOrders ||
            data?.purchaseOrders ||
            data?.grns ||
            data?.grn ||
            data?.payments ||
            data?.salesReturns ||
            data?.returns ||
            data?.receipts ||
            data?.purchaseReturns ||
            data?.openingBalances ||
            data?.openingStocks ||
            []
        );
    };

    const tabDataMap: any = {
        salesQuotation: normalizeRecords(quotationRegisterData),
        salesOrder: normalizeRecords(salesOrderRegisterData),
        salesInvoice: normalizeRecords(salesRegisterData),
        purchaseOrder: normalizeRecords(purchaseOrderRegisterData),
        grn: normalizeRecords(grnRegisterData),
        purchaseInvoice: normalizeRecords(purchaseRegisterData),
        salesReturn: normalizeRecords(salesReturnRegisterData),
        purchaseReturn: normalizeRecords(purchaseReturnRegisterData),
        receipt: normalizeRecords(receiptRegisterData),
        payment: normalizeRecords(paymentRegisterData),
        openingBalance: normalizeRecords(openingBalanceData),
        openingStock: normalizeRecords(openingStockData),
    };

    const tabLoadingMap: any = {
        salesQuotation: quotationLoading,
        salesOrder: salesOrderLoading,
        salesInvoice: salesLoading,
        purchaseOrder: purchaseOrderLoading,
        grn: grnLoading,
        purchaseInvoice: purchaseLoading,
        salesReturn: salesReturnLoading,
        purchaseReturn: purchaseReturnLoading,
        receipt: receiptLoading,
        payment: paymentLoading,
        openingBalance: openingBalanceLoading,
        openingStock: openingStockLoading,
    };

    const tabPaginationMap: any = {
        salesQuotation: quotationPagination,
        salesOrder: salesOrderPagination,
        salesInvoice: salesPagination,
        purchaseOrder: purchaseOrderPagination,
        grn: grnPagination,
        purchaseInvoice: purchasePagination,
        salesReturn: salesReturnPagination,
        purchaseReturn: purchaseReturnPagination,
        receipt: receiptPagination,
        payment: paymentPagination,
        openingBalance: openingBalancePagination,
        openingStock: openingStockPagination,
    };

    const columnMap: any = {
        salesQuotation: salesQuotationColumns,
        salesOrder: salesOrderColumns,
        salesInvoice: salesInvoiceColumns,
        purchaseOrder: purchaseOrderColumns,
        grn: grnColumns,
        purchaseInvoice: purchaseInvoiceColumns,
        salesReturn: salesReturnColumns,
        purchaseReturn: purchaseReturnColumns,
        receipt: receiptColumns,
        payment: paymentColumns,
        openingBalance: openingBalanceColumns,
        openingStock: openingStockColumns,
    };

    const currentTabData = Array.isArray(tabDataMap[activeDetailTab])
        ? tabDataMap[activeDetailTab]
        : [];

    const activeTabLabel =
        tabs.find((item) => item.key === activeDetailTab)?.label || "Data";

    const activeLoading = Boolean(tabLoadingMap[activeDetailTab]);

    const pagination = tabPaginationMap[activeDetailTab] || {
        currentPage: 1,
        totalPages: 1,
        totalDocs: 0,
        limit: localLimit,
        offset: localOffset,
        hasNextPage: false,
        hasPrevPage: false,
    };

    const activeColumns = columnMap[activeDetailTab] || salesQuotationColumns;

    const handleSlideTabs = (direction: "left" | "right") => {
        if (!tabsScrollRef.current) return;

        tabsScrollRef.current.scrollBy({
            left: direction === "left" ? -260 : 260,
            behavior: "smooth",
        });
    };

    const fetchActiveTabData = async (
        tabKey: string,
        apiFilters = appliedFilters,
        apiOffset = localOffset,
        apiLimit = localLimit
    ) => {
        try {
            const commonPayload = {
                offset: apiOffset,
                limit: apiLimit,
                accountCode: "",
                productCode: "",
                fromDate: apiFilters.fromDate,
                toDate: apiFilters.toDate,
                customAuthToken: selectedRequest?.authTokenDigest,
                number: selectedRequest?.parentMobileNumber,
            };

            switch (tabKey) {
                case "salesQuotation":
                    await dispatch(getQuotationRegister(commonPayload) as any).unwrap();
                    break;

                case "salesOrder":
                    await dispatch(getSalesOrderRegister(commonPayload) as any).unwrap();
                    break;

                case "salesInvoice":
                    await dispatch(getSalesRegister(commonPayload) as any).unwrap();
                    break;

                case "purchaseOrder":
                    await dispatch(getPurchaseOrderRegister(commonPayload) as any).unwrap();
                    break;

                case "grn":
                    await dispatch(getGrnRegister(commonPayload) as any).unwrap();
                    break;

                case "purchaseInvoice":
                    await dispatch(getPurchaseRegister(commonPayload) as any).unwrap();
                    break;

                case "salesReturn":
                    await dispatch(getSalesReturnRegister(commonPayload) as any).unwrap();
                    break;

                case "purchaseReturn":
                    await dispatch(getPurchaseReturnRegister(commonPayload) as any).unwrap();
                    break;

                case "receipt":
                    await dispatch(getReceiptRegister(commonPayload) as any).unwrap();
                    break;

                case "payment":
                    await dispatch(getPaymentRegister(commonPayload) as any).unwrap();
                    break;

                case "openingBalance":
                    await dispatch(getOpeningBalanceRegister(commonPayload) as any).unwrap();
                    break;

                case "openingStock":
                    await dispatch(getOpeningStockRegister(commonPayload) as any).unwrap();
                    break;

                default:
                    break;
            }
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.data?.message ||
                `Failed to fetch ${activeTabLabel}`
            );
        }
    };

    useEffect(() => {
        fetchActiveTabData(
            activeDetailTab,
            appliedFilters,
            localOffset,
            localLimit
        );
    }, [
        activeDetailTab,
        localOffset,
        localLimit,
        appliedFilters.fromDate,
        appliedFilters.toDate,
    ]);

    const handleApplyFilter = () => {
        if (filters.fromDate && filters.toDate) {
            const from = new Date(filters.fromDate);
            const to = new Date(filters.toDate);

            if (from > to) {
                toast.warn("From date cannot be greater than To date");
                return;
            }
        }

        setLocalOffset(0);
        setAppliedFilters(filters);
    };

    const handleClearFilter = () => {
        const emptyFilters = {
            fromDate: "",
            toDate: "",
        };

        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
        setLocalOffset(0);
    };

    const handleBackToTable = () => {
        setSelectedRequest(null);
    };

    const downloadBlobFile = (blobData: any, fileName: string) => {
        const blob =
            blobData instanceof Blob
                ? blobData
                : new Blob([blobData], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadExcel = async () => {
        try {
            const exportPayload = {
                offset: 0,
                limit: 999999,
                accountCode: "",
                productCode: "",
                fromDate: appliedFilters.fromDate,
                toDate: appliedFilters.toDate,
                exportType: "excel" as const,
                customAuthToken: selectedRequest?.authTokenDigest,
                number: selectedRequest?.parentMobileNumber,
            };

            let res: any;

            switch (activeDetailTab) {
                case "salesQuotation":
                    res = await dispatch(getQuotationRegister(exportPayload) as any).unwrap();
                    break;

                case "salesOrder":
                    res = await dispatch(getSalesOrderRegister(exportPayload) as any).unwrap();
                    break;

                case "salesInvoice":
                    res = await dispatch(getSalesRegister(exportPayload) as any).unwrap();
                    break;

                case "purchaseOrder":
                    res = await dispatch(getPurchaseOrderRegister(exportPayload) as any).unwrap();
                    break;

                case "grn":
                    res = await dispatch(getGrnRegister(exportPayload) as any).unwrap();
                    break;

                case "purchaseInvoice":
                    res = await dispatch(getPurchaseRegister(exportPayload) as any).unwrap();
                    break;

                case "salesReturn":
                    res = await dispatch(getSalesReturnRegister(exportPayload) as any).unwrap();
                    break;

                case "purchaseReturn":
                    res = await dispatch(getPurchaseReturnRegister(exportPayload) as any).unwrap();
                    break;

                case "receipt":
                    res = await dispatch(getReceiptRegister(exportPayload) as any).unwrap();
                    break;

                case "payment":
                    res = await dispatch(getPaymentRegister(exportPayload) as any).unwrap();
                    break;

                case "openingBalance":
                    res = await dispatch(getOpeningBalanceRegister(exportPayload) as any).unwrap();
                    break;

                case "openingStock":
                    res = await dispatch(getOpeningStockRegister(exportPayload) as any).unwrap();
                    break;

                default:
                    toast.warn("Invalid register selected");
                    return;
            }

            if (!res?.blob) {
                toast.error("Excel file not received from API");
                return;
            }

            const safeName = activeTabLabel
                .replace(/\s+/g, "_")
                .replace(/[^\w-]/g, "");

            downloadBlobFile(res.blob, `${safeName}.xlsx`);
            toast.success(`${activeTabLabel} downloaded successfully`);
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.data?.message ||
                `Failed to download ${activeTabLabel}`
            );
        }
    };

    const handlePaginationOffset = (value: any) => {
        setLocalOffset((prevOffset: number) => {
            const rawValue =
                typeof value === "function" ? value(prevOffset) : value;

            const numericValue = Number(rawValue || 0);

            if (!Number.isFinite(numericValue)) {
                return prevOffset;
            }

            const totalPages = Number(pagination?.totalPages || 1);

            if (numericValue > 0 && numericValue <= totalPages) {
                return (numericValue - 1) * localLimit;
            }

            return Math.max(0, numericValue);
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex h-[calc(100vh-70px)] w-full flex-col overflow-hidden border border-border bg-card px-4 py-2 text-card-foreground shadow-sm"
        >
            {/* ================= HEADER ================= */}
            < motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mb-3 flex shrink-0 flex-wrap items-center gap-2 rounded border border-border bg-background/70 px-3 py-2 shadow-sm"
            >
                <motion.button
                    type="button"
                    onClick={handleBackToTable}
                    whileHover={{ x: -3, scale: 1.03 }}
                    whileTap={{ scale: 0.94 }}
                    className="group flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-card-foreground transition hover:bg-muted"
                >
                    <ArrowLeft
                        size={16}
                        className="transition-transform duration-200 group-hover:-translate-x-0.5"
                    />
                </motion.button>

                < div className="min-w-[170px]" >
                    <motion.h1
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="line-clamp-1 text-sm font-black text-card-foreground"
                    >
                        {selectedRequest?.firstName}{" "}
                        {selectedRequest?.middleName} {" "}
                        {selectedRequest?.lastName}
                    </motion.h1>

                    < motion.p
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: 0.08 }}
                        className="text-[11px] font-semibold text-muted-foreground"
                    >
                        {selectedRequest?.parentMobileNumber || "-"}
                    </motion.p>
                </div>

                < div className="ml-auto flex flex-wrap items-center gap-2" >
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: 0.08 }}
                        className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1"
                    >
                        <span className="text-[11px] font-bold text-muted-foreground" >
                            From
                        </span>

                        < input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    fromDate: e.target.value,
                                }))
                            }
                            className="h-7 w-[130px] bg-transparent text-xs font-semibold text-card-foreground outline-none"
                        />
                    </motion.div>

                    < motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: 0.11 }}
                        className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1"
                    >
                        <span className="text-[11px] font-bold text-muted-foreground" >
                            To
                        </span>

                        < input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    toDate: e.target.value,
                                }))
                            }
                            className="h-7 w-[130px] bg-transparent text-xs font-semibold text-card-foreground outline-none"
                        />
                    </motion.div>

                    < motion.button
                        type="button"
                        onClick={handleApplyFilter}
                        whileHover={{ y: -1, scale: 1.03 }}
                        whileTap={{ scale: 0.94 }}
                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-black text-primary-foreground transition hover:bg-primary/90"
                    >
                        <Filter size={14} />
                        Apply
                    </motion.button>

                    < motion.button
                        type="button"
                        onClick={handleClearFilter}
                        whileHover={{ y: -1, scale: 1.03 }}
                        whileTap={{ scale: 0.94 }}
                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-black text-card-foreground transition hover:bg-muted"
                    >
                        <X size={14} />
                        Clear
                    </motion.button>
                    < PrimaryButton
                        {...{
                            text: exportLoading
                                ? "Downloading..."
                                : "Download Excel",
                            callBackFn: handleDownloadExcel,
                            disabled: exportLoading,
                        }
                        }
                    />
                </div>
            </motion.div>

            {/* ================= TABS ================= */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="mb-4 shrink-0 rounded border border-border bg-background/70 p-2 shadow-sm"
            >
                <div className="relative flex w-full items-center gap-2" >
                    <motion.button
                        type="button"
                        onClick={() => handleSlideTabs("left")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.94 }}
                        className="z-10 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-card-foreground shadow-sm transition hover:bg-muted"
                    >
                        <ChevronLeft size={16} />
                    </motion.button>

                    < div
                        ref={tabsScrollRef}
                        className="tabs-no-scrollbar flex w-full min-w-0 items-center gap-2 overflow-x-auto scroll-smooth rounded-lg"
                    >
                        {
                            tabs.map((tab: any) => {
                                const isActive = activeDetailTab === tab.key;
                                return (
                                    <motion.button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => {
                                            setActiveDetailTab(tab.key);
                                            setLocalOffset(0);
                                        }
                                        }
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.96 }}
                                        transition={{ duration: 0.18 }}
                                        className={`
                                        group relative flex shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded px-4 py-2.5
                                        text-sm font-bold transition-colors duration-300
                                        ${isActive
                                                ? "text-primary"
                                                : "text-muted-foreground hover:text-card-foreground"
                                            }
                                    `}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="activeDetailTabBg"
                                                className="absolute inset-0 rounded bg-primary/10 shadow-sm"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 450,
                                                    damping: 35,
                                                }}
                                            />
                                        )}

                                        {
                                            !isActive && (
                                                <span className="absolute inset-0 rounded bg-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                                            )
                                        }

                                        <span className="relative z-10 whitespace-nowrap" >
                                            {tab.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                    </div>

                    < motion.button
                        type="button"
                        onClick={() => handleSlideTabs("right")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.94 }}
                        className="z-10 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-card-foreground shadow-sm transition hover:bg-muted"
                    >
                        <ChevronRight size={16} />
                    </motion.button>
                </div>
            </motion.div>

            {/* ================= TAB TABLE ================= */}
            <AnimatePresence mode="wait" >
                <motion.div
                    key={activeDetailTab}
                    initial={{ opacity: 0, y: 12, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="flex min-h-0 flex-1 flex-col overflow-hidden rounded"
                >

                    < div className="min-h-0 flex-1 overflow-auto" >
                        <DataTable
                            columns={activeColumns}
                            data={currentTabData}
                            loading={activeLoading}
                            emptyMessage={`No ${activeTabLabel} data found`}
                            showFieldSelector={false}
                        />
                    </div>

                    {
                        Number(pagination?.totalDocs || 0) > 0 && (
                            <div className="mx-3" >
                                <Pagination
                                    {
                                    ...{
                                        localLimit,
                                        selectCb: (e: any) => {
                                            setLocalLimit(Number(e.target.value));
                                            setLocalOffset(0);
                                        },
                                        preDisabled: !pagination?.hasPrevPage,
                                        nextDisabled: !pagination?.hasNextPage,
                                        setLocalOffset: handlePaginationOffset,
                                        pagination,
                                    }
                                    }
                                />
                            </div>
                        )
                    }
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export default Tabs;