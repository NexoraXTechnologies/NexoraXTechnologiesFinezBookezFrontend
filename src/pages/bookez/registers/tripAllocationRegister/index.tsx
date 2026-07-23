import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, LoaderCircle } from "lucide-react";

import RegisterFilterCard from "../RegisterFilterCard";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import PageComponentModal from "../../../../components/mainPage/PageComponentModal";
// import CreateEditTripAllocationRegistration from "./CreateEditTripAllocation";

import {
    getTripAllocationByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";
import { getTripAllocationRegister } from "../../../../redux/slices/professionalSlice/bookEzRegister/tripAllocationRegister";
import { formatDateForInput, money, toDateInputValue, toLocalEndOfDayUtc, toLocalStartOfDayUtc, truncate } from "../../../../utils/helperFunctions";
import CreateTripAllocation from "../../transportation/tripAllocation/CreateTripAllocation";



type ExportType = "pdf" | "excel" | "";

type RegisterPayload = {
    fromDate: string;
    toDate: string;
    offset: number;
    limit: number;
    exportType: ExportType;
};

const getTodayDate = (): string => {
    const now = new Date();
    const localDate = new Date(
        now.getTime() - now.getTimezoneOffset() * 60 * 1000,
    );
    return localDate.toISOString().split("T")[0];
};

// const toNumber = (value: any): number => {
//     if (value === null || value === undefined || value === "") return 0;

//     const parsed = Number(
//         String(value).replace(/,/g, "").replace(/[₹\s]/g, "").trim(),
//     );

//     return Number.isFinite(parsed) ? parsed : 0;
// };

// const formatIndianNumber = (value: any): string =>
//     toNumber(value).toLocaleString("en-IN", {
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 2,
//     });

// const formatDateTime = (value: any): string => {
//     if (!value) return "-";

//     const date = new Date(value);
//     if (Number.isNaN(date.getTime())) return "-";

//     return date.toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//     });
// };

const getAllocationVoucher = (row: any): string =>
    row?.voucherNumber ||
    row?.tripAllocationVoucherNumber ||
    row?.tripNumber ||
    row?.allocationNumber ||
    "";

const normalizeAllocationStatus = (status: any): string => {
    const key = String(status || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (key === "complete" || key === "completed") return "completed";
    if (key === "cancelled" || key === "canceled") return "cancelled";
    return key || "pending";
};

// const isAllocationClosed = (row: any): boolean =>
//     normalizeAllocationStatus(
//         row?.tripStatus || row?.allocationStatus || row?.status,
//     ) === "completed";

const getStatusLabel = (row: any): string => {
    const status = normalizeAllocationStatus(
        row?.tripStatus || row?.allocationStatus || row?.status,
    );

    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusClassName = (status: string): string => {
    const key = normalizeAllocationStatus(status);

    if (key === "completed") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    }

    if (key === "cancelled") {
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
    }

    if (key === "in_transit" || key === "loading" || key === "unloading") {
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400";
    }

    return "bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-400";
};

const getAllocationFromResponse = (
    response: any,
    voucherNumber: string,
): any | null => {
    const directCandidates = [
        response?.tripAllocation,
        response?.data?.tripAllocation,
        response?.allocation,
        response?.data?.allocation,
        response?.record,
        response?.data?.record,
        response?.data?.data,
        response?.data,
        response,
    ];

    for (const item of directCandidates) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;

        const foundVoucher = getAllocationVoucher(item);
        if (!foundVoucher || foundVoucher === voucherNumber) return item;
    }

    const records = Array.isArray(response)
        ? response
        : Array.isArray(response?.records)
            ? response.records
            : Array.isArray(response?.allocations)
                ? response.allocations
                : Array.isArray(response?.data?.records)
                    ? response.data.records
                    : Array.isArray(response?.data?.allocations)
                        ? response.data.allocations
                        : [];

    return (
        records.find((item: any) => getAllocationVoucher(item) === voucherNumber) ||
        records[0] ||
        null
    );
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

const mainColumns = [
    {
        key: "tripAllocationVoucherNumber",
        title: "Allocation No.",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getAllocationVoucher(row) || "-"}
            </span>
        ),
    },
    {
        key: "allocationDate",
        title: "Date",
        render: (row: any) => formatDateForInput(row?.allocationDate || row?.createdAt),
    },
    {
        key: "transportOrderNumber",
        title: "Transport Order",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.transportOrder?.transportOrderNumber ||
                    row?.transportOrderNumber ||
                    "-"}
            </span>
        ),
    },
    {
        key: "customerName",
        title: "Customer",
        render: (row: any) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row?.transportOrder?.customerName || row?.customerName || "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row?.transportOrder?.customerCode || row?.customerCode || "-"}
                </div>
            </div>
        ),
    },
    {
        key: "route",
        title: "Route",
        render: (row: any) => {
            const source = row?.transportOrder?.source || row?.source || "-";
            const destination =
                row?.transportOrder?.destination || row?.destination || "-";

            return `${truncate(source, 18)} → ${truncate(destination, 18)}`;
        },
    },
    {
        key: "vehicleNumber",
        title: "Vehicle",
        render: (row: any) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row?.vehicleSelection?.vehicleNumber || "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                  {row?.driverAllocation?.driverName || "-"}
                </div>
            </div>
        ),
    },
  
    {
        key: "expectedFreight",
        title: "Expected Freight",
         type: "amount",
        render: (row: any) => (
            <span className="whitespace-nowrap font-medium text-card-foreground">
                {money(row?.transportOrder?.expectedFreight || 0)}
            </span>
        ),
    },
    {
        key: "tripStatus",
        title: "Status",
        render: (row: any) => {
            const label = getStatusLabel(row);

            return (
                <span
                    className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium capitalize ${getStatusClassName(
                        label,
                    )}`}
                >
                    {label}
                </span>
            );
        },
    },
];

const TripAllocationRegister = () => {
    const dispatch = useDispatch<any>();

    const today = getTodayDate();

    const [fromDate, setFromDate] = useState(
        toLocalStartOfDayUtc(today),
    );

    const [toDate, setToDate] = useState(
        toLocalEndOfDayUtc(today),
    );
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [refreshKey, setRefreshKey] = useState(0);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    const [openingVoucher, setOpeningVoucher] = useState("");
    const [dateError, setDateError] = useState("");

    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewAllocation, setViewAllocation] = useState<any>(null);
    const [viewVoucherNumber, setViewVoucherNumber] = useState("");
    const [viewError, setViewError] = useState("");

    const {
        tripAllocationRegisterData = [],
        pagination: registerPagination = {},
        listingLoader: registerLoader = false,
        error: registerError = null,
    } = useSelector(
        (state: any) =>
            state.tripAllocationRegister ||
            {}
    );

    const {
        detailLoader = false,
    } = useSelector(
        (state: any) =>
            state.tripAllocation || {}
    );

    const tableData = useMemo(() => {
        return Array.isArray(
            tripAllocationRegisterData
        )
            ? tripAllocationRegisterData
            : [];
    }, [tripAllocationRegisterData]);

    const currentPagination = useMemo(() => {
        return registerPagination || {};
    }, [registerPagination]);

    const hasDateFilter = Boolean(fromDate && toDate);

    const validateDates = (): boolean => {
        if (!fromDate || !toDate) {
            setDateError("Please select From Date and To Date.");
            return false;
        }

        if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
            setDateError("From Date cannot be greater than To Date.");
            return false;
        }

        setDateError("");
        return true;
    };

    const getPayload = (exportType: ExportType = ""): RegisterPayload => ({
        fromDate,
        toDate,
        offset: exportType ? 0 : localOffset,
        limit: localLimit,
        exportType,
    });

    useEffect(() => {
        if (!fromDate || !toDate) return;
        if (new Date(fromDate).getTime() > new Date(toDate).getTime()) return;

        dispatch(getTripAllocationRegister(getPayload()));
    }, [dispatch, fromDate, toDate, localOffset, localLimit, refreshKey]);

    const handleSearch = () => {
        if (!validateDates()) return;
        setLocalOffset(0);
        setRefreshKey((previous) => previous + 1);
    };

    const handleClear = () => {
        const currentDate = getTodayDate();
        setDateError("");

        setFromDate(
            toLocalStartOfDayUtc(
                currentDate,
            ),
        );

        setToDate(
            toLocalEndOfDayUtc(
                currentDate,
            ),
        );

        setLocalOffset(0);
        setRefreshKey((previous) => previous + 1);
    };

    const handleDownloadPdf = async () => {
        if (pdfLoading || !validateDates()) return;

        try {
            setPdfLoading(true);
            const response = await dispatch(
                getTripAllocationRegister(getPayload("pdf")),
            ).unwrap();

            const blob = getBlobFromResponse(response);
            if (blob) {
                downloadBlobFile(blob, "trip-allocation-register.pdf");
            }
        } catch (error) {
            console.log("Trip Allocation Register PDF download failed", error);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (excelLoading || !validateDates()) return;

        try {
            setExcelLoading(true);
            const response = await dispatch(
                getTripAllocationRegister(getPayload("excel")),
            ).unwrap();

            const blob = getBlobFromResponse(response);
            if (blob) {
                downloadBlobFile(blob, "trip-allocation-register.xlsx");
            }
        } catch (error) {
            console.log("Trip Allocation Register Excel download failed", error);
        } finally {
            setExcelLoading(false);
        }
    };

    const closeViewModal = () => {
        setViewModal(false);
        setViewLoading(false);
        setViewAllocation(null);
        setViewVoucherNumber("");
        setViewError("");
        setOpeningVoucher("");
    };

    const handleViewAllocation = async (row: any) => {
        const voucherNumber = getAllocationVoucher(row);

        if (!voucherNumber || openingVoucher) return;

        try {
            setOpeningVoucher(voucherNumber);
            setViewModal(true);
            setViewLoading(true);
            setViewAllocation(null);
            setViewVoucherNumber(voucherNumber);
            setViewError("");

            const response = await dispatch(
                getTripAllocationByVoucherNumber(voucherNumber),
            ).unwrap();

            const allocationData = getAllocationFromResponse(
                response,
                voucherNumber,
            );

            if (!allocationData) {
                setViewError("Trip allocation details were not found.");
                return;
            }

            setViewAllocation(allocationData);
        } catch (error: any) {
            console.log("Failed to open trip allocation", error);
            setViewError(
                error?.message || "Failed to load trip allocation.",
            );
        } finally {
            setViewLoading(false);
            setOpeningVoucher("");
        }
    };

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Trip Allocation Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: toDateInputValue(
                            fromDate,
                        ),
                        onChange: (value) => {
                            setFromDate(
                                toLocalStartOfDayUtc(
                                    value,
                                ),
                            );
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: true,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDateInputValue(
                            toDate,
                        ),
                        onChange: (value) => {
                            setToDate(
                                toLocalEndOfDayUtc(
                                    value,
                                ),
                            );
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: true,
                    },
                ]}
                gridCols="2"
                onSearch={handleSearch}
                onClear={handleClear}
                onDownloadPdf={handleDownloadPdf}
                onDownloadExcel={handleDownloadExcel}
                pdfDisabled={!hasDateFilter || pdfLoading || excelLoading}
                excelDisabled={!hasDateFilter || excelLoading || pdfLoading}
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
                downloadDisabledMessage={
                    !hasDateFilter
                        ? "Please select From Date and To Date."
                        : "Please wait, export is processing."
                }
            />

            {dateError && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    {dateError}
                </div>
            )}

            {registerError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {typeof registerError === "string"
                        ? registerError
                        : registerError?.message ||
                        "Failed to load trip allocation register."}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={registerLoader}
                emptyMessage="No trip allocations found"
                showFieldSelector={false}
                actions={(row: any) => {
                    const voucherNumber = getAllocationVoucher(row);
                    const isOpening = openingVoucher === voucherNumber && detailLoader;

                    return (
                        <button
                            type="button"
                            disabled={Boolean(openingVoucher)}
                            onClick={(event) => {
                                event.stopPropagation();
                                handleViewAllocation(row);
                            }}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Open Trip Allocation"
                        >
                            {isOpening ? (
                                <LoaderCircle size={15} className="animate-spin" />
                            ) : (
                                <Eye size={15} />
                            )}
                        </button>
                    );
                }}
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
                        ? `Trip Allocation - ${viewVoucherNumber}`
                        : "Trip Allocation"
                }
                description="View trip allocation details."
                onClose={closeViewModal}
            >
                {viewLoading ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-5 py-4 shadow-sm">
                            <LoaderCircle className="animate-spin text-primary" />
                            <span className="text-sm font-semibold">
                                Loading trip allocation...
                            </span>
                        </div>
                    </div>
                ) : viewError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                        {viewError}
                    </div>
                ) : viewAllocation ? (
                            <CreateTripAllocation
                        embedded
                        mode="view"
                        voucherNumber={viewVoucherNumber}
                        allocationData={viewAllocation}
                        onClose={closeViewModal}
                    />
                ) : null}
            </PageComponentModal>
        </div>
    );
};

export default TripAllocationRegister;