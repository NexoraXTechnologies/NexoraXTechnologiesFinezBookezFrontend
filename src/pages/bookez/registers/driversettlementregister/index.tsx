import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye } from "lucide-react";
import DataTable from "../../../../components/DataTable";
import {
    addDriverSettlementRegister,
} from "../../../../redux/slices/professionalSlice/bookEzRegister/driverSettlementRegister";
import Pagination from "../../../../components/pagination";
import RegisterFilterCard from "../RegisterFilterCard";
import PageComponentModal from "../../../../components/mainPage/PageComponentModal";
import { toDateInputValue, toLocalEndOfDayUtc, toLocalStartOfDayUtc } from "../../../../utils/helperFunctions";
import CreateEditDriverSettlement from "../../transportation/driverSettlement/CreateEditDriverSettlement";


type ExportType = "pdf" | "excel" | "";

type DriverSettlementRegisterPayload = {
    fromDate: string;
    toDate: string;
    offset: number;
    limit: number;
    exportType: ExportType;
};

/* ===================================================
   FIELD HELPERS
   No RN reference exists for this register, so these are
   derived directly from the payload shape built in
   CreateEditDriverSettlement's handleSave (settlementNumber,
   driverCode, lrDetails.*, grossAmount, netPayableToDriver,
   paymentMode/paymentDate, accountingStatus). Adjust if the
   actual list response uses different field names.
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

const getSettlementVoucher = (row: any): string => {
    return String(
        row?.settlementNumber || row?.voucherNumber || ""
    ).trim();
};

const getDriverName = (row: any): string => {
    return row?.lrDetails?.driverName || row?.driverName || "-";
};

const getTripNumber = (row: any): string => {
    return (
        row?.lrDetails?.tripNumber ||
        row?.transportOrderNumber ||
        "-"
    );
};

const getVehicleNumber = (row: any): string => {
    return row?.lrDetails?.vehicleNo || row?.vehicleNo || "-";
};

const getGrossAmount = (row: any): number => toNum(row?.grossAmount);

const getNetPayable = (row: any): number => toNum(row?.netPayableToDriver);

const getPaymentMode = (row: any): string => row?.paymentMode || "-";

const getAccountingStatus = (row: any): string => {
    const raw = String(row?.accountingStatus || "pending")
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

    if (normalized === "created") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    }

    if (normalized === "partially created") {
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
    }

    if (normalized === "not required") {
        return "bg-primary/10 text-primary";
    }

    return "bg-muted text-muted-foreground";
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
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "settlementNumber",
        title: "Settlement Number",
        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getSettlementVoucher(row) || "-"}
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
        key: "tripNumber",
        title: "Trip / Order",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getTripNumber(row)}
            </span>
        ),
    },
    {
        key: "vehicleNo",
        title: "Vehicle",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getVehicleNumber(row)}
            </span>
        ),
    },
    {
        key: "grossAmount",
        title: "Gross Amount",
        render: (row: any) => (
            <span className="whitespace-nowrap font-medium text-card-foreground">
                ₹ {formatIndianNumber(getGrossAmount(row))}
            </span>
        ),
    },
    {
        key: "netPayableToDriver",
        title: "Net Payable",
        render: (row: any) => (
            <span className="whitespace-nowrap font-bold text-card-foreground">
                ₹ {formatIndianNumber(getNetPayable(row))}
            </span>
        ),
    },
    {
        key: "paymentMode",
        title: "Payment Mode",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getPaymentMode(row)}
            </span>
        ),
    },
    {
        key: "accountingStatus",
        title: "Accounting Status",
        render: (row: any) => {
            const status = getAccountingStatus(row);

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
        key: "paymentDate",
        title: "Payment Date",
        render: (row: any) => (
            <span className="whitespace-nowrap text-sm font-medium text-card-foreground">
                {formatDateTime(row?.paymentDate || row?.createdAt)}
            </span>
        ),
    },
];

const DriverSettlementRegister = () => {
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
    // CreateEditDriverSettlement fetches its own record by voucherNumber,
    // so no pre-fetch is needed here — just open the modal with the number.
    const [viewModal, setViewModal] = useState(false);
    const [viewVoucherNumber, setViewVoucherNumber] = useState("");

    const driverSettlementState = useSelector(
        (state: any) => state.driverSettlementRegister || {}
    );

    const {
        driverSettlementRegisterData = [],
        pagination = {},
        addLoader = false,
        listingLoader = false,
        error = null,
    } = driverSettlementState;

    const tableData = useMemo(() => {
        return Array.isArray(driverSettlementRegisterData)
            ? driverSettlementRegisterData
            : [];
    }, [driverSettlementRegisterData]);

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
    ): DriverSettlementRegisterPayload => ({
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

        dispatch(addDriverSettlementRegister(getPayload("")));
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
                addDriverSettlementRegister(getPayload("pdf"))
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (!blob) {
                console.log(
                    "Driver Settlement Register PDF blob not returned",
                    response
                );
                return;
            }

            downloadBlobFile(blob, "DriverSettlementRegister.pdf");
        } catch (downloadError) {
            console.log(
                "Driver Settlement Register PDF download failed",
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
                addDriverSettlementRegister(getPayload("excel"))
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (!blob) {
                console.log(
                    "Driver Settlement Register Excel blob not returned",
                    response
                );
                return;
            }

            downloadBlobFile(blob, "DriverSettlementRegister.xlsx");
        } catch (downloadError) {
            console.log(
                "Driver Settlement Register Excel download failed",
                downloadError
            );
        } finally {
            setExcelLoading(false);
        }
    };

    const closeViewModal = () => {
        setViewModal(false);
        setViewVoucherNumber("");

        // Re-run the current search so any edit made in the modal
        // (accounting status, etc.) is reflected in the list.
        setRefreshKey((previous) => previous + 1);
    };

    const handleOpenSettlement = (row: any) => {
        const voucherNumber = getSettlementVoucher(row);

        if (!voucherNumber) {
            console.log("Driver settlement voucher number is missing", row);
            return;
        }

        setViewVoucherNumber(voucherNumber);
        setViewModal(true);
    };

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Driver Settlement Register Filters"
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
                        "Failed to load driver settlement register."}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={addLoader || listingLoader}
                emptyMessage="No driver settlement records found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleOpenSettlement(row);
                        }}
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                        title="Open Driver Settlement"
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
                        ? `Driver Settlement - ${viewVoucherNumber}`
                        : "Driver Settlement"
                }
                description="View driver settlement details."
                onClose={closeViewModal}
            >
                {viewModal && (
                    <CreateEditDriverSettlement
                        embedded
                        mode="view"
                        voucherNumber={viewVoucherNumber}
                        onClose={closeViewModal}
                    />
                )}
            </PageComponentModal>
        </div>
    );
};

export default DriverSettlementRegister;