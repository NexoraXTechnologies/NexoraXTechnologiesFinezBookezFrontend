import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye } from "lucide-react";
import DataTable from "../../../../components/DataTable";
import {
    addTripExpenseRegister,
    getTripExpenseByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/bookEzRegister/tripExpenseRegister";
import Pagination from "../../../../components/pagination";
import RegisterFilterCard from "../RegisterFilterCard";
import PageComponentModal from "../../../../components/mainPage/PageComponentModal";

import {toLocalEndOfDayUtc, toLocalStartOfDayUtc } from "../../../../utils/helperFunctions";
import CreateEditTripExpense from "./CreateEditTripExpense";


type ExportType = "pdf" | "excel" | "";

type TripExpenseRegisterPayload = {
    fromDate: string;
    toDate: string;
    offset: number;
    limit: number;
    exportType: ExportType;
};

const toNumber = (value: any): number => {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    const parsed = Number(
        String(value)
            .replace(/,/g, "")
            .replace(/[₹\s]/g, "")
            .trim()
    );

    return Number.isFinite(parsed) ? parsed : 0;
};

const formatIndianNumber = (value: any): string => {
    return toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
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

const getTripExpenseVoucher = (row: any): string => {
    return String(
        row?.voucherNumber ||
        row?.tripExpenseVoucherNumber ||
        row?.tripExpenseNumber ||
        row?.expenseNumber ||
        ""
    ).trim();
};

const getTripId = (row: any): string => {
    return String(
        row?.tripId ||
        row?.tripNumber ||
        row?.tripAllocationNumber ||
        row?.tripAllocation?.tripNumber ||
        row?.tripAllocation?.voucherNumber ||
        "-"
    );
};

const getVehicleNumber = (row: any): string => {
    return (
        row?.vehicle?.vehicleNumber ||
        row?.vehicleSelection?.vehicleNumber ||
        row?.tripAllocation?.vehicleSelection?.vehicleNumber ||
        "-"
    );
};

const getDriverName = (row: any): string => {
    return (
        row?.driver?.driverName ||
        row?.driverAllocation?.driverName ||
        row?.tripAllocation?.driverAllocation?.driverName ||
        "-"
    );
};

const getTotalTripExpense = (row: any): number => {
    return toNumber(
        row?.summary?.totalTripExpense ??
        row?.summary?.totalExpense ??
        row?.totalTripExpense ??
        row?.totalExpense ??
        0
    );
};

const getBalanceAmount = (row: any): number => {
    return toNumber(
        row?.summary?.balanceAmount ??
        row?.balanceAmount ??
        row?.balance ??
        0
    );
};

const getTripExpenseStatus = (row: any): string => {
    const raw = String(
        row?.tripStatus || row?.status || row?.expenseStatus || "draft"
    )
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (["completed", "complete", "closed", "close"].includes(raw)) {
        return "Closed";
    }

    if (!raw) return "Draft";

    return raw
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusClassName = (status: string): string => {
    const normalized = status.trim().toLowerCase();

    if (normalized === "closed" || normalized === "completed") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    }

    if (normalized === "cancelled" || normalized === "canceled") {
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
    }

    if (normalized === "pending" || normalized === "submitted") {
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
    }

    return "bg-primary/10 text-primary";
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

        const candidateVoucher =
            getTripExpenseVoucher(candidate);

        if (
            !candidateVoucher ||
            candidateVoucher === voucherNumber
        ) {
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
                (item: any) =>
                    getTripExpenseVoucher(item) ===
                    voucherNumber
            ) ||
            records[0] ||
            null
        );
    }

    return null;
};

const mainColumns = [
    {
        key: "tripExpenseVoucher",
        title: "Expense Number",
        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getTripExpenseVoucher(row) || "-"}
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
        key: "vehicleNumber",
        title: "Vehicle",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getVehicleNumber(row)}
            </span>
        ),
    },
    {
        key: "driverName",
        title: "Driver",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getDriverName(row)}
            </span>
        ),
    },
    {
        key: "totalTripExpense",
        title: "Total Expense",
        render: (row: any) => (
            <span className="whitespace-nowrap font-bold text-card-foreground">
                ₹ {formatIndianNumber(getTotalTripExpense(row))}
            </span>
        ),
    },
    {
        key: "balanceAmount",
        title: "Balance",
        render: (row: any) => (
            <span className="whitespace-nowrap font-semibold text-card-foreground">
                ₹ {formatIndianNumber(getBalanceAmount(row))}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) => {
            const status = getTripExpenseStatus(row);

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
        key: "tripDate",
        title: "Trip Date",
        render: (row: any) => (
            <span className="whitespace-nowrap text-sm font-medium text-card-foreground">
                {formatDateTime(
                    row?.tripDate ||
                    row?.expenseDate ||
                    row?.createdOn ||
                    row?.createdAt
                )}
            </span>
        ),
    },
];

const TripExpenseRegister = () => {
    const dispatch = useDispatch<any>();

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [localOffset, setLocalOffset] = useState<number>(0);
    const [localLimit, setLocalLimit] = useState<number>(10);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [pdfLoading, setPdfLoading] = useState<boolean>(false);
    const [excelLoading, setExcelLoading] = useState<boolean>(false);
    const [dateError, setDateError] = useState<string>("");

    const [viewModal, setViewModal] =
        useState(false);

    const [viewLoading, setViewLoading] =
        useState(false);

    const [viewExpense, setViewExpense] =
        useState<any>(null);

    const [viewVoucherNumber, setViewVoucherNumber] =
        useState("");

    const [viewError, setViewError] =
        useState("");

    const tripExpenseState = useSelector(
        (state: any) => state.tripExpenseRegister || {}
    );

    const {
        tripExpenseRegisterData = [],
        pagination = {},
        addLoader = false,
        listingLoader = false,
        error = null,
    } = tripExpenseState;

    const tableData = useMemo(() => {
        return Array.isArray(tripExpenseRegisterData)
            ? tripExpenseRegisterData
            : [];
    }, [tripExpenseRegisterData]);

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

    const getPayload = (
        exportType: ExportType = ""
    ): TripExpenseRegisterPayload => ({
        fromDate: fromDate ? toLocalStartOfDayUtc(fromDate) : "",
        toDate: toDate ? toLocalEndOfDayUtc(toDate) : "",
        offset: localOffset,
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

        dispatch(addTripExpenseRegister(getPayload("")));
    }, [
        dispatch,
        fromDate,
        toDate,
        localOffset,
        localLimit,
        refreshKey,
    ]);

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
                addTripExpenseRegister({
                    ...getPayload("pdf"),
                    offset: 0,
                })
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (!blob) {
                console.log("Trip Expense Register PDF blob not returned", response);
                return;
            }

            downloadBlobFile(blob, "TripExpenseRegister.pdf");
        } catch (downloadError) {
            console.log(
                "Trip Expense Register PDF download failed",
                downloadError
            );
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!hasRegisterData || excelLoading || !validateDates()) return;

        try {
            setExcelLoading(true);

            const response = await dispatch(
                addTripExpenseRegister({
                    ...getPayload("excel"),
                    offset: 0,
                })
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (!blob) {
                console.log(
                    "Trip Expense Register Excel blob not returned",
                    response
                );
                return;
            }

            downloadBlobFile(blob, "TripExpenseRegister.xlsx");
        } catch (downloadError) {
            console.log(
                "Trip Expense Register Excel download failed",
                downloadError
            );
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

    const handleOpenExpense = async (
        row: any
    ) => {
        const voucherNumber =
            getTripExpenseVoucher(row);

        if (!voucherNumber) {
            console.log(
                "Trip expense voucher number is missing",
                row
            );

            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewExpense(null);
            setViewVoucherNumber(voucherNumber);
            setViewError("");

            const response = await dispatch(
                getTripExpenseByVoucherNumber(
                    voucherNumber
                )
            ).unwrap();

            const expenseRecord =
                getTripExpenseRecordFromResponse(
                    response,
                    voucherNumber
                );

            if (!expenseRecord) {
                setViewError(
                    "Trip expense details were not found."
                );

                return;
            }

            setViewExpense(expenseRecord);
        } catch (error: any) {
            console.log(
                "Failed to open trip expense",
                error
            );

            setViewError(
                error?.message ||
                "Failed to load trip expense."
            );
        } finally {
            setViewLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Trip Expense Register Filters"
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
                        : error?.message ||
                        "Failed to load trip expense register."}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={addLoader || listingLoader}
                emptyMessage="No trip expenses found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleOpenExpense(row);
                        }}
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                        title="Open Trip Expense"
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

            <PageComponentModal
                show={viewModal}
                title={
                    viewVoucherNumber
                        ? `Trip Expense - ${viewVoucherNumber}`
                        : "Trip Expense"
                }
                description="View trip expense details."
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
                        voucherNumber={
                            viewVoucherNumber
                        }
                        expenseData={
                            viewExpense
                        }
                        onClose={
                            closeViewModal
                        }
                    />
                ) : null}
            </PageComponentModal>
        </div>
    );
};

export default TripExpenseRegister;