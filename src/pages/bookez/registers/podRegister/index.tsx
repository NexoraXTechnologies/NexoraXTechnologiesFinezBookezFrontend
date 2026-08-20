import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import DataTable from "../../../../components/DataTable";
import {
    addpodRegister,
} from "../../../../redux/slices/professionalSlice/bookEzRegister/podRegister";
import { getTripExpenseByVoucherNumber } from "../../../../redux/slices/professionalSlice/bookEzRegister/tripExpenseRegister";
import { getTripLRCollectionByVoucherNumber } from "../../../../redux/slices/professionalSlice/transportation/tripLRCollectionSlice";
import Pagination from "../../../../components/pagination";
import RegisterFilterCard from "../RegisterFilterCard";
import PageComponentModal from "../../../../components/mainPage/PageComponentModal";
import { toLocalEndOfDayUtc, toLocalStartOfDayUtc } from "../../../../utils/helperFunctions";
import CreateEditTripExpense from "../TripExpenseRegister/CreateEditTripExpense";

// TODO: replace with the actual route path registered for CreateEditTripLREntry
const LR_ENTRY_ROUTE = "/transportation/create-edit-trip-lr-entry";

type ExportType = "pdf" | "excel" | "";

type PodRegisterPayload = {
    fromDate: string;
    toDate: string;
    offset: number;
    limit: number;
    exportType: ExportType;
};

/* ===================================================
   VOUCHER / LINKAGE HELPERS
   (mirrors getTripExpenseVoucher / getLRVoucher from RN)
=================================================== */

const getPodTripExpenseVoucher = (row: any): string => {
    const linkedVoucher =
        row?.linkType === "expense" ? row?.voucherNumber : "";

    return String(
        row?.tripExpenseVoucherNumber ||
        row?.expenseVoucherNumber ||
        row?.tripExpenseNumber ||
        linkedVoucher ||
        ""
    ).trim();
};

const getPodLRVoucher = (row: any): string => {
    return String(
        row?.lrNumber ||
        row?.lrVoucherNumber ||
        row?.tripLRVoucherNumber ||
        (row?.linkType === "lr" ? row?.voucherNumber : "") ||
        ""
    ).trim();
};

const getPodVoucher = (row: any): string => {
    return (
        getPodTripExpenseVoucher(row) ||
        getPodLRVoucher(row) ||
        String(row?.podVoucherNumber || row?.voucherNumber || "").trim()
    );
};

const getTripId = (row: any): string => {
    return String(
        row?.tripId ||
        row?.tripNumber ||
        row?.transportOrderNumber ||
        row?.tripAllocation?.tripNumber ||
        "-"
    );
};

const getCustomerName = (row: any): string => {
    return (
        row?.customer?.customerName ||
        row?.customerDetails?.customerName ||
        row?.customerName ||
        "-"
    );
};

const getReceiverName = (row: any): string => {
    return row?.pod?.receiverName || row?.receiverName || "-";
};

const getDeliveryStatus = (row: any): string => {
    const raw = String(
        row?.pod?.deliveryStatus || row?.deliveryStatus || "pending"
    )
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (!raw) return "Pending";

    return raw
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusClassName = (status: string): string => {
    const normalized = status.trim().toLowerCase();

    if (normalized === "delivered" || normalized === "completed") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    }

    if (normalized === "cancelled" || normalized === "canceled") {
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
    }

    if (normalized === "pending" || normalized === "in transit") {
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
    }

    return "bg-primary/10 text-primary";
};

const formatDateTime = (value: any): string => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const getBlobFromResponse = (response: any): Blob | null => {
    if (response instanceof Blob) return response;
    if (response?.blob instanceof Blob) return response.blob;
    if (response?.data instanceof Blob) return response.data;
    if (response?.data?.blob instanceof Blob) return response.data.blob;

    return null;
};

const downloadBlobFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
};

/* ===================================================
   RESPONSE PARSING (trip expense record extraction,
   reused from TripExpenseRegister for the view modal)
=================================================== */

const getTripExpenseRecordFromResponse = (
    response: any,
    voucherNumber: string
): any | null => {
    const directCandidates = [
        response?.tripExpense,
        response?.data?.tripExpense,
        response?.record,
        response?.data?.record,
        response?.data?.data,
        response?.data,
        response,
    ];

    for (const candidate of directCandidates) {
        if (
            !candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate)
        ) {
            continue;
        }

        const candidateVoucher = getPodTripExpenseVoucher(candidate);

        if (!candidateVoucher || candidateVoucher === voucherNumber) {
            return candidate;
        }
    }

    const recordLists = [
        response,
        response?.tripExpenses,
        response?.expenses,
        response?.records,
        response?.items,
        response?.data,
        response?.data?.tripExpenses,
        response?.data?.expenses,
        response?.data?.records,
        response?.data?.items,
        response?.data?.data,
    ];

    for (const records of recordLists) {
        if (!Array.isArray(records)) {
            continue;
        }

        return (
            records.find(
                (item: any) => getPodTripExpenseVoucher(item) === voucherNumber
            ) ||
            records[0] ||
            null
        );
    }

    return null;
};

const getLRRecordFromResponse = (response: any): any | null => {
    const data = response?.data || response || {};

    if (Array.isArray(data)) return data[0] || null;
    if (Array.isArray(data?.records)) return data.records[0] || null;
    if (Array.isArray(data?.data?.records)) return data.data.records[0] || null;

    return data?.data || data || null;
};

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "podVoucher",
        title: "POD Number",
        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getPodVoucher(row) || "-"}
            </span>
        ),
    },
    {
        key: "tripId",
        title: "Trip Number",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getTripId(row)}
            </span>
        ),
    },
    {
        key: "customer",
        title: "Customer",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getCustomerName(row)}
            </span>
        ),
    },
    {
        key: "receiverName",
        title: "Receiver",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getReceiverName(row)}
            </span>
        ),
    },
    {
        key: "deliveryStatus",
        title: "Delivery Status",
        render: (row: any) => {
            const status = getDeliveryStatus(row);

            return (
                <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(
                        status
                    )}`}
                >
                    {status}
                </span>
            );
        },
    },
    {
        key: "submittedAt",
        title: "Date",
        render: (row: any) => (
            <span className="whitespace-nowrap text-sm font-medium text-card-foreground">
                {formatDateTime(
                    row?.pod?.submittedAt ||
                    row?.submittedAt ||
                    row?.tripDate ||
                    row?.createdAt
                )}
            </span>
        ),
    },
];

const PodRegister = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [localOffset, setLocalOffset] = useState<number>(0);
    const [localLimit, setLocalLimit] = useState<number>(10);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [pdfLoading, setPdfLoading] = useState<boolean>(false);
    const [excelLoading, setExcelLoading] = useState<boolean>(false);
    const [dateError, setDateError] = useState<string>("");

    // View modal is only used for the trip-expense-linked branch;
    // LR-linked PODs route to the full CreateEditTripLREntry page.
    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewExpense, setViewExpense] = useState<any>(null);
    const [viewVoucherNumber, setViewVoucherNumber] = useState("");
    const [viewError, setViewError] = useState("");

    const podRegisterState = useSelector(
        (state: any) => state.podRegister || {}
    );

    const {
        podRegisterData = [],
        pagination = {},
        addLoader = false,
        listingLoader = false,
        error = null,
    } = podRegisterState;

    const tableData = useMemo(() => {
        return Array.isArray(podRegisterData) ? podRegisterData : [];
    }, [podRegisterData]);

    const currentPagination = useMemo(() => {
        return pagination || {};
    }, [pagination]);

    const hasRegisterData = tableData.length > 0;

    const validateDates = (): boolean => {
        if (!fromDate && !toDate) {
            setDateError("");
            return true;
        }

        if (!fromDate || !toDate) {
            setDateError("Please select both From Date and To Date.");
            return false;
        }

        if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
            setDateError("From Date cannot be greater than To Date.");
            return false;
        }

        setDateError("");
        return true;
    };

    const getPayload = (exportType: ExportType = ""): PodRegisterPayload => ({
        fromDate: fromDate ? toLocalStartOfDayUtc(fromDate) : "",
        toDate: toDate ? toLocalEndOfDayUtc(toDate) : "",
        offset: exportType ? 0 : localOffset,
        limit: localLimit,
        exportType,
    });

    useEffect(() => {
        if ((fromDate && !toDate) || (!fromDate && toDate)) return;

        if (
            fromDate &&
            toDate &&
            new Date(fromDate).getTime() > new Date(toDate).getTime()
        ) {
            return;
        }

        dispatch(addpodRegister(getPayload("")));
    }, [dispatch, fromDate, toDate, localOffset, localLimit, refreshKey]);

    const handleSearch = () => {
        if (!validateDates()) return;

        setLocalOffset(0);
        setRefreshKey((previous) => previous + 1);
    };

    const handleClear = () => {
        setDateError("");
        setFromDate("");
        setToDate("");
        setLocalOffset(0);
        setRefreshKey((previous) => previous + 1);
    };

    const handleDownloadPdf = async () => {
        if (!hasRegisterData || pdfLoading || !validateDates()) return;

        try {
            setPdfLoading(true);

            const response = await dispatch(
                addpodRegister(getPayload("pdf"))
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (!blob) {
                console.log("POD Register PDF blob not returned", response);
                return;
            }

            downloadBlobFile(blob, "PodRegister.pdf");
        } catch (downloadError) {
            console.log("POD Register PDF download failed", downloadError);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!hasRegisterData || excelLoading || !validateDates()) return;

        try {
            setExcelLoading(true);

            const response = await dispatch(
                addpodRegister(getPayload("excel"))
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (!blob) {
                console.log("POD Register Excel blob not returned", response);
                return;
            }

            downloadBlobFile(blob, "PodRegister.xlsx");
        } catch (downloadError) {
            console.log("POD Register Excel download failed", downloadError);
        } finally {
            setExcelLoading(false);
        }
    };

    const closeViewModal = () => {
        setViewModal(false);
        setViewLoading(false);
        setViewExpense(null);
        setViewVoucherNumber("");
        setViewError("");
    };

    const openTripExpense = async (voucherNumber: string) => {
        try {
            setViewModal(true);
            setViewLoading(true);
            setViewExpense(null);
            setViewVoucherNumber(voucherNumber);
            setViewError("");

            const response = await dispatch(
                getTripExpenseByVoucherNumber(voucherNumber)
            ).unwrap();

            const expenseRecord = getTripExpenseRecordFromResponse(
                response,
                voucherNumber
            );

            if (!expenseRecord) {
                setViewError("Trip expense details were not found.");
                return;
            }

            setViewExpense(expenseRecord);
        } catch (error: any) {
            console.log("Failed to open trip expense", error);
            setViewError(error?.message || "Failed to load trip expense.");
        } finally {
            setViewLoading(false);
        }
    };

    const openLREntry = async (voucherNumber: string) => {
        try {
            const response = await dispatch(
                getTripLRCollectionByVoucherNumber(voucherNumber)
            ).unwrap();

            const lrRecord = getLRRecordFromResponse(response);

            navigate(LR_ENTRY_ROUTE, {
                state: {
                    mode: "edit",
                    voucherNumber,
                    lrData: lrRecord,
                },
            });
        } catch (error: any) {
            console.log("Failed to open trip LR entry", error);
        }
    };

    const handleOpenPod = async (row: any) => {
        const expenseVoucher = getPodTripExpenseVoucher(row);
        const lrVoucher = getPodLRVoucher(row);

        if (expenseVoucher) {
            await openTripExpense(expenseVoucher);
            return;
        }

        if (lrVoucher) {
            await openLREntry(lrVoucher);
            return;
        }

        console.log("Pod row has no linked trip expense or LR voucher", row);
    };

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="POD Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate,
                        onChange: (value: string) => {
                            setFromDate(value || "");
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate,
                        onChange: (value: string) => {
                            setToDate(value || "");
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                ]}
                gridCols="2"
                onSearch={handleSearch}
                onClear={handleClear}
                onDownloadPdf={handleDownloadPdf}
                onDownloadExcel={handleDownloadExcel}
                pdfDisabled={!hasRegisterData || pdfLoading || excelLoading}
                excelDisabled={!hasRegisterData || excelLoading || pdfLoading}
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
                downloadDisabledMessage={
                    !hasRegisterData
                        ? "No data available to export."
                        : "Please wait, export is processing."
                }
            />

            {dateError && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    {dateError}
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {typeof error === "string"
                        ? error
                        : error?.message || "Failed to load POD register."}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={addLoader || listingLoader}
                emptyMessage="No POD records found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleOpenPod(row);
                        }}
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                        title="Open POD"
                    >
                        <Eye size={15} />
                    </button>
                )}
            />

            {Number(currentPagination?.totalDocs || 0) > 0 && (
                <div className="mt-2">
                    <Pagination
                        localLimit={localLimit}
                        selectCb={(event: any) => {
                            setLocalLimit(Number(event.target.value));
                            setLocalOffset(0);
                        }}
                        preDisabled={!currentPagination?.hasPrevPage}
                        nextDisabled={!currentPagination?.hasNextPage}
                        setLocalOffset={setLocalOffset}
                        pagination={currentPagination}
                    />
                </div>
            )}

            {/* View modal only handles the trip-expense-linked branch.
                LR-linked rows navigate to CreateEditTripLREntry instead,
                since that component is a routed page, not an embeddable one. */}
            <PageComponentModal
                show={viewModal}
                title={
                    viewVoucherNumber
                        ? `Trip Expense - ${viewVoucherNumber}`
                        : "Trip Expense"
                }
                description="View trip expense details linked to this POD."
                onClose={closeViewModal}
            >
                {viewLoading ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-5 py-4 shadow-sm">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

                            <span className="text-sm font-semibold">
                                Loading trip expense...
                            </span>
                        </div>
                    </div>
                ) : viewError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                        {viewError}
                    </div>
                ) : viewExpense ? (
                    <CreateEditTripExpense
                        embedded
                        mode="view"
                        voucherNumber={viewVoucherNumber}
                        expenseData={viewExpense}
                        onClose={closeViewModal}
                    />
                ) : null}
            </PageComponentModal>
        </div>
    );
};

export default PodRegister;