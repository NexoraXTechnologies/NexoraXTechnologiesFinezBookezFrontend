import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye } from "lucide-react";
import DataTable from "../../../../components/DataTable";
import {
    addVehicleMaintenanceRegister,
} from "../../../../redux/slices/professionalSlice/bookEzRegister/vehicleMaintenanceRegister";
import { getVehicleMaintenanceByVoucherNumber } from "../../../../redux/slices/professionalSlice/transportation/vehicleMaintenanceEntrySlice";
import Pagination from "../../../../components/pagination";
import RegisterFilterCard from "../RegisterFilterCard";
import PageComponentModal from "../../../../components/mainPage/PageComponentModal";
import { toDateInputValue, toLocalEndOfDayUtc, toLocalStartOfDayUtc } from "../../../../utils/helperFunctions";
import CreateEditVehicleMaintenance from "../../transportation/vehicleMaintenance/CreateEditVehicleMaintenance";


type ExportType = "pdf" | "excel" | "";

type VehicleMaintenanceRegisterPayload = {
    fromDate: string;
    toDate: string;
    offset: number;
    limit: number;
    exportType: ExportType;
};

/* ===================================================
   FIELD HELPERS
=================================================== */

const toNum = (value: any): number => {
    if (value === null || value === undefined || value === "") return 0;

    const parsed = Number(
        String(value)
            .replace(/,/g, "")
            .replace(/[₹\s]/g, "")
            .trim()
    );

    return Number.isFinite(parsed) ? parsed : 0;
};

const formatIndianNumber = (value: any): string => {
    return toNum(value).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
};

const getVehicleMaintenanceVoucher = (row: any): string => {
    return String(
        row?.voucherNumber ||
        row?.maintenanceNumber ||
        row?.vehicleMaintenanceVoucherNumber ||
        ""
    ).trim();
};

const getMaintenanceType = (row: any): string => {
    return (
        row?.maintenanceType ||
        row?.lastMaintenance?.maintenanceType ||
        "-"
    );
};

const getVehicleNumber = (row: any): string => {
    return row?.vehicleNumber || row?.vehicle?.vehicleNumber || "-";
};

const getDriverName = (row: any): string => {
    return row?.driverName || row?.vehicle?.driverName || row?.driver?.driverName || "-";
};

const getMaintenanceAmount = (row: any): number => {
    return toNum(
        row?.amount ||
        row?.lastMaintenance?.amount ||
        row?.serviceDetails?.amount ||
        0
    );
};

const getServiceCenter = (row: any): string => {
    return row?.lastMaintenance?.serviceCenter || row?.serviceCenter || "-";
};

const getMaintenanceStatus = (row: any): string => {
    const raw = String(row?.status || row?.maintenanceStatus || "active")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (!raw) return "Active";

    return raw
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusClassName = (status: string): string => {
    const normalized = status.trim().toLowerCase();

    if (normalized === "active") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    }

    if (normalized === "inactive") {
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
    }

    if (normalized === "draft") {
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
   RESPONSE PARSING
   (mirrors getTripExpenseRecordFromResponse from PodRegister,
   adapted for the vehicle maintenance response shape)
=================================================== */

const getVehicleMaintenanceRecordFromResponse = (
    response: any,
    voucherNumber: string
): any | null => {
    const directCandidates = [
        response?.maintenance,
        response?.data?.maintenance,
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

        const candidateVoucher = getVehicleMaintenanceVoucher(candidate);

        if (!candidateVoucher || candidateVoucher === voucherNumber) {
            return candidate;
        }
    }

    const recordLists = [
        response,
        response?.records,
        response?.items,
        response?.data,
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
                (item: any) => getVehicleMaintenanceVoucher(item) === voucherNumber
            ) ||
            records[0] ||
            null
        );
    }

    return null;
};

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "voucherNumber",
        title: "Maintenance Number",
        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getVehicleMaintenanceVoucher(row) || "-"}
            </span>
        ),
    },
    {
        key: "maintenanceType",
        title: "Type",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getMaintenanceType(row)}
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
        key: "serviceCenter",
        title: "Service Center",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getServiceCenter(row)}
            </span>
        ),
    },
    {
        key: "amount",
        title: "Amount",
        render: (row: any) => (
            <span className="whitespace-nowrap font-bold text-card-foreground">
                ₹ {formatIndianNumber(getMaintenanceAmount(row))}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) => {
            const status = getMaintenanceStatus(row);

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
        key: "serviceDate",
        title: "Service Date",
        render: (row: any) => (
            <span className="whitespace-nowrap text-sm font-medium text-card-foreground">
                {formatDateTime(
                    row?.serviceDate ||
                    row?.lastMaintenance?.serviceDate ||
                    row?.maintenanceDate
                )}
            </span>
        ),
    },
];

const VehicleMaintenanceRegister = () => {
    const dispatch = useDispatch<any>();

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [localOffset, setLocalOffset] = useState<number>(0);
    const [localLimit, setLocalLimit] = useState<number>(10);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [pdfLoading, setPdfLoading] = useState<boolean>(false);
    const [excelLoading, setExcelLoading] = useState<boolean>(false);
    const [dateError, setDateError] = useState<string>("");

    // View modal replaces the previous navigate()-to-edit-page flow.
    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewMaintenance, setViewMaintenance] = useState<any>(null);
    const [viewVoucherNumber, setViewVoucherNumber] = useState("");
    const [viewError, setViewError] = useState("");

    const vehicleMaintenanceState = useSelector(
        (state: any) => state.vehicleMaintenanceRegister || {}
    );

    const {
        vehicleMaintenanceRegisterData = [],
        pagination = {},
        addLoader = false,
        listingLoader = false,
        error = null,
    } = vehicleMaintenanceState;

    const tableData = useMemo(() => {
        return Array.isArray(vehicleMaintenanceRegisterData)
            ? vehicleMaintenanceRegisterData
            : [];
    }, [vehicleMaintenanceRegisterData]);

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
    ): VehicleMaintenanceRegisterPayload => ({
        fromDate: fromDate || "",
        toDate: toDate || "",
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

        dispatch(addVehicleMaintenanceRegister(getPayload("")));
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
                addVehicleMaintenanceRegister(getPayload("pdf"))
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (!blob) {
                console.log(
                    "Vehicle Maintenance Register PDF blob not returned",
                    response
                );
                return;
            }

            downloadBlobFile(blob, "VehicleMaintenanceRegister.pdf");
        } catch (downloadError) {
            console.log(
                "Vehicle Maintenance Register PDF download failed",
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
                addVehicleMaintenanceRegister(getPayload("excel"))
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (!blob) {
                console.log(
                    "Vehicle Maintenance Register Excel blob not returned",
                    response
                );
                return;
            }

            downloadBlobFile(blob, "VehicleMaintenanceRegister.xlsx");
        } catch (downloadError) {
            console.log(
                "Vehicle Maintenance Register Excel download failed",
                downloadError
            );
        } finally {
            setExcelLoading(false);
        }
    };

    const closeViewModal = () => {
        setViewModal(false);
        setViewLoading(false);
        setViewMaintenance(null);
        setViewVoucherNumber("");
        setViewError("");
    };

    const openMaintenanceView = async (voucherNumber: string) => {
        try {
            setViewModal(true);
            setViewLoading(true);
            setViewMaintenance(null);
            setViewVoucherNumber(voucherNumber);
            setViewError("");

            const response = await dispatch(
                getVehicleMaintenanceByVoucherNumber(voucherNumber)
            ).unwrap();

            const maintenanceRecord = getVehicleMaintenanceRecordFromResponse(
                response,
                voucherNumber
            );

            if (!maintenanceRecord) {
                setViewError("Vehicle maintenance details were not found.");
                return;
            }

            setViewMaintenance(maintenanceRecord);
        } catch (error: any) {
            console.log("Failed to open vehicle maintenance entry", error);
            setViewError(error?.message || "Failed to load vehicle maintenance.");
        } finally {
            setViewLoading(false);
        }
    };

    const handleOpenMaintenance = async (row: any) => {
        const voucherNumber = getVehicleMaintenanceVoucher(row);

        if (!voucherNumber) {
            console.log("Vehicle maintenance voucher number is missing", row);
            return;
        }

        await openMaintenanceView(voucherNumber);
    };

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Vehicle Maintenance Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate ? toDateInputValue(fromDate) : "",
                        onChange: (value: string) => {
                            setFromDate(toLocalStartOfDayUtc(value));
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate ? toDateInputValue(toDate) : "",
                        onChange: (value: string) => {
                            setToDate(toLocalEndOfDayUtc(value));
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
                        "Failed to load vehicle maintenance register."}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={addLoader || listingLoader}
                emptyMessage="No vehicle maintenance records found"
                showFieldSelector={false}
                actions={(row: any) => {
                    const voucherNumber = getVehicleMaintenanceVoucher(row);
                    const isOpening =
                        viewLoading && viewVoucherNumber === voucherNumber;

                    return (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleOpenMaintenance(row);
                            }}
                            disabled={isOpening}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 disabled:opacity-60"
                            title="Open Vehicle Maintenance"
                        >
                            <Eye size={15} />
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
                        ? `Vehicle Maintenance - ${viewVoucherNumber}`
                        : "Vehicle Maintenance"
                }
                description="View vehicle maintenance details."
                onClose={closeViewModal}
            >
                {viewLoading ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-5 py-4 shadow-sm">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

                            <span className="text-sm font-semibold">
                                Loading vehicle maintenance...
                            </span>
                        </div>
                    </div>
                ) : viewError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                        {viewError}
                    </div>
                ) : viewMaintenance ? (
                    <CreateEditVehicleMaintenance
                        embedded
                        mode="view"
                        voucherNumber={viewVoucherNumber}
                        maintenanceData={viewMaintenance}
                        onClose={closeViewModal}
                    />
                ) : null}
            </PageComponentModal>
        </div>
    );
};

export default VehicleMaintenanceRegister;