import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, LoaderCircle } from "lucide-react";

import RegisterFilterCard from "../RegisterFilterCard";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import PageComponentModal from "../../../../components/mainPage/PageComponentModal";

import {
    toDateInputValue,
    toLocalEndOfDayUtc,
    toLocalStartOfDayUtc,
} from "../../../../utils/helperFunctions";

import { addTripLrEntry } from "../../../../redux/slices/professionalSlice/bookEzRegister/tripLrEntryRegister";

import {
    getTripLRCollectionByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/tripLRCollectionSlice";

import CreateViewTripLREntry from "./CreateViewTripLREntry";

type ExportType = "pdf" | "excel" | "";

type RegisterPayload = {
    fromDate: string;
    toDate: string;
    customerCode?: string;
    productCode?: string;
    customCodes?: string[];
    selectedColumns?: string[];
    offset: number;
    limit: number;
    exportType: ExportType;
};

const getLRVoucher = (row: any): string =>
    row?.lrNumber ||
    row?.voucherNumber ||
    row?.lrVoucherNumber ||
    row?.tripLRVoucherNumber ||
    "";

const getLRFromResponse = (
    response: any,
    voucherNumber: string
): any | null => {
    const candidates = [
        response?.lr,
        response?.data?.lr,
        response?.tripLR,
        response?.data?.tripLR,
        response?.tripLRCollection,
        response?.data?.tripLRCollection,
        response?.record,
        response?.data?.record,
        response?.data?.data,
        response?.data,
        response,
    ];

    for (const candidate of candidates) {
        if (
            !candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate)
        ) {
            continue;
        }

        const foundVoucher = getLRVoucher(candidate);

        if (
            !foundVoucher ||
            foundVoucher === voucherNumber
        ) {
            return candidate;
        }
    }

    const records = Array.isArray(response)
        ? response
        : Array.isArray(response?.lrs)
            ? response.lrs
            : Array.isArray(response?.data?.lrs)
                ? response.data.lrs
                : Array.isArray(response?.records)
                    ? response.records
                    : Array.isArray(response?.data?.records)
                        ? response.data.records
                        : [];

    return (
        records.find(
            (item: any) =>
                getLRVoucher(item) === voucherNumber
        ) ||
        records[0] ||
        null
    );
};

const getBlobFromResponse = (
    response: any
): Blob | null => {
    if (response instanceof Blob) {
        return response;
    }

    if (response?.blob instanceof Blob) {
        return response.blob;
    }

    if (response?.data instanceof Blob) {
        return response.data;
    }

    if (response?.data?.blob instanceof Blob) {
        return response.data.blob;
    }

    return null;
};

const downloadBlobFile = (
    blob: Blob,
    fileName: string
) => {
    const url =
        window.URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
};

const mainColumns = [
    {
        key: "lrNumber",
        title: "LR No.",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.lrNumber || "-"}
            </span>
        ),
    },
    {
        key: "lrDate",
        title: "Date",
        render: (row: any) => (
            <span className="whitespace-nowrap">
                {row?.lrDate
                    ? new Date(row.lrDate).toLocaleDateString("en-IN")
                    : "-"}
            </span>
        ),
    },
    {
        key: "customerName",
        title: "Customer",
        render: (row: any) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row?.customer?.customerName || "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row?.customer?.customerCode || "-"}
                </div>
            </div>
        ),
    },
    {
        key: "vehicleNumber",
        title: "Vehicle",
        render: (row: any) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row?.vehicle?.vehicleNumber || "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row?.vehicle?.vehicleType || "-"}
                </div>
            </div>
        ),
    },
    {
        key: "source",
        title: "Source",
        render: (row: any) => (
            <div>
                <div>
                    {row?.consignor?.location?.city ||
                        row?.route?.source ||
                        "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row?.consignor?.location?.state || "-"}
                </div>
            </div>
        ),
    },
    {
        key: "destination",
        title: "Destination",
        render: (row: any) => (
            <div>
                <div>
                    {row?.consignee?.location?.city ||
                        row?.route?.destination ||
                        "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row?.consignee?.location?.state || "-"}
                </div>
            </div>
        ),
    },
    {
        key: "driver",
        title: "Driver",
        render: (row: any) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row?.driver?.driverName || "-"}
                </div>

                <div className="text-xs text-muted-foreground">
                    {row?.driver?.driverCode || "-"}
                </div>
            </div>
        ),
    },
];

const TripLrEntryRegister = () => {
    const dispatch = useDispatch<any>();

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [customerCode, setCustomerCode] =
        useState("");

    const [productCode, setProductCode] =
        useState("");

    const [localOffset, setLocalOffset] =
        useState(0);

    const [localLimit, setLocalLimit] =
        useState(10);

    const [refreshKey, setRefreshKey] =
        useState(0);

    const [pdfLoading, setPdfLoading] =
        useState(false);

    const [excelLoading, setExcelLoading] =
        useState(false);

    const [dateError, setDateError] =
        useState("");

    const [openingVoucher, setOpeningVoucher] =
        useState("");

    const [viewModal, setViewModal] =
        useState(false);

    const [viewLoading, setViewLoading] =
        useState(false);

    const [viewLRData, setViewLRData] =
        useState<any>(null);

    const [viewVoucherNumber, setViewVoucherNumber] =
        useState("");

    const [viewError, setViewError] =
        useState("");

    const {
        tripLrRegisterData = [],
        pagination: registerPagination = {},
        listingLoader = false,
        addLoader = false,
        error: registerError = null,
    } = useSelector(
        (state: any) =>
            state.tripLrEntryRegister || {}
    );

    const {
        detailLoader = false,
    } = useSelector(
        (state: any) =>
            state.tripLRCollection || {}
    );

    const tableData = useMemo(() => {
        return Array.isArray(
            tripLrRegisterData
        )
            ? tripLrRegisterData
            : [];
    }, [tripLrRegisterData]);

    const currentPagination =
        useMemo(() => {
            return registerPagination || {};
        }, [registerPagination]);

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
    ): RegisterPayload => ({
        fromDate: fromDate || "",
        toDate: toDate || "",
        customerCode: customerCode || undefined,
        productCode: productCode || undefined,
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

        dispatch(addTripLrEntry(getPayload()));
    }, [
        dispatch,
        fromDate,
        toDate,
        customerCode,
        productCode,
        localOffset,
        localLimit,
        refreshKey,
    ]);

    const handleSearch = () => {
        if (!validateDates()) {
            return;
        }

        setLocalOffset(0);

        setRefreshKey(
            (previous) =>
                previous + 1
        );
    };

    const handleClear = () => {
        setDateError("");
        setFromDate("");
        setToDate("");
        setCustomerCode("");
        setProductCode("");
        setLocalOffset(0);
        setRefreshKey((previous) => previous + 1);
    };

    const handleDownloadPdf =
        async () => {
            if (
                !hasRegisterData ||
                pdfLoading ||
                !validateDates()
            ) {
                return;
            }

            try {
                setPdfLoading(true);

                const response =
                    await dispatch(
                        addTripLrEntry(
                            getPayload("pdf")
                        )
                    ).unwrap();

                const blob =
                    getBlobFromResponse(
                        response
                    );

                if (blob) {
                    downloadBlobFile(
                        blob,
                        "trip-lr-register.pdf"
                    );
                }
            } catch (error) {
                console.log(
                    "Trip LR Register PDF download failed",
                    error
                );
            } finally {
                setPdfLoading(false);
            }
        };

    const handleDownloadExcel =
        async () => {
            if (
                !hasRegisterData ||
                excelLoading ||
                !validateDates()
            ) {
                return;
            }

            try {
                setExcelLoading(true);

                const response =
                    await dispatch(
                        addTripLrEntry(
                            getPayload("excel")
                        )
                    ).unwrap();

                const blob =
                    getBlobFromResponse(
                        response
                    );

                if (blob) {
                    downloadBlobFile(
                        blob,
                        "trip-lr-register.xlsx"
                    );
                }
            } catch (error) {
                console.log(
                    "Trip LR Register Excel download failed",
                    error
                );
            } finally {
                setExcelLoading(false);
            }
        };

    const closeViewModal = () => {
        setViewModal(false);
        setViewLoading(false);
        setViewLRData(null);
        setViewVoucherNumber("");
        setViewError("");
        setOpeningVoucher("");
    };

    const handleViewVoucher =
        async (row: any) => {
            const voucherNumber =
                getLRVoucher(row);

            if (
                !voucherNumber ||
                openingVoucher
            ) {
                return;
            }

            try {
                setOpeningVoucher(
                    voucherNumber
                );

                setViewModal(true);
                setViewLoading(true);
                setViewLRData(null);

                setViewVoucherNumber(
                    voucherNumber
                );

                setViewError("");

                const response =
                    await dispatch(
                        getTripLRCollectionByVoucherNumber(
                            voucherNumber
                        )
                    ).unwrap();

                const lrData =
                    getLRFromResponse(
                        response,
                        voucherNumber
                    );

                if (!lrData) {
                    setViewError(
                        "Trip LR details were not found."
                    );

                    return;
                }

                setViewLRData(
                    lrData
                );
            } catch (error: any) {
                console.log(
                    "Failed to open Trip LR",
                    error
                );

                setViewError(
                    error?.message ||
                    error?.response?.data?.message ||
                    "Failed to load Trip LR."
                );
            } finally {
                setViewLoading(false);
                setOpeningVoucher("");
            }
        };

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Trip LR Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate ? toDateInputValue(fromDate) : "",
                        onChange: (value) => {
                            setFromDate(
                                toLocalStartOfDayUtc(
                                    value
                                )
                            );

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
                        onChange: (value) => {
                            setToDate(
                                toLocalEndOfDayUtc(
                                    value
                                )
                            );

                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                ]}
                gridCols="2"
                onSearch={handleSearch}
                onClear={handleClear}
                onDownloadPdf={
                    handleDownloadPdf
                }
                onDownloadExcel={
                    handleDownloadExcel
                }
                pdfDisabled={!hasRegisterData || pdfLoading || excelLoading}
                excelDisabled={!hasRegisterData || excelLoading || pdfLoading}
                pdfLoading={
                    pdfLoading
                }
                excelLoading={
                    excelLoading
                }
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

            {registerError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {typeof registerError ===
                    "string"
                        ? registerError
                        : registerError?.message ||
                          "Failed to load Trip LR register."}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={
                    addLoader ||
                    listingLoader
                }
                emptyMessage="No Trip LR entries found"
                showFieldSelector={
                    false
                }
                actions={(row: any) => {
                    const voucherNumber =
                        getLRVoucher(row);

                    const isOpening =
                        openingVoucher ===
                            voucherNumber &&
                        (detailLoader ||
                            viewLoading);

                    return (
                        <button
                            type="button"
                            disabled={Boolean(
                                openingVoucher
                            )}
                            onClick={(
                                event
                            ) => {
                                event.stopPropagation();

                                handleViewVoucher(
                                    row
                                );
                            }}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                            title="View Trip LR"
                        >
                            {isOpening ? (
                                <LoaderCircle
                                    size={
                                        15
                                    }
                                    className="animate-spin"
                                />
                            ) : (
                                <Eye
                                    size={
                                        15
                                    }
                                />
                            )}
                        </button>
                    );
                }}
            />

            {Number(
                currentPagination?.totalDocs ||
                    0
            ) > 0 && (
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
                            !currentPagination?.hasPrevPage
                        }
                        nextDisabled={
                            !currentPagination?.hasNextPage
                        }
                        setLocalOffset={
                            setLocalOffset
                        }
                        pagination={
                            currentPagination
                        }
                    />
                </div>
            )}

            <PageComponentModal
                show={viewModal}
                title={
                    viewVoucherNumber
                        ? ` ${viewVoucherNumber}`
                        : "Trip LR"
                }
                description="View Trip LR details."
                onClose={
                    closeViewModal
                }
            >
                {viewLoading ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-5 py-4 shadow-sm">
                            <LoaderCircle
                                size={20}
                                className="animate-spin text-primary"
                            />

                            <span className="text-sm font-semibold">
                                Loading Trip LR...
                            </span>
                        </div>
                    </div>
                ) : viewError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                        {viewError}
                    </div>
                ) : viewLRData ? (
                    <CreateViewTripLREntry
                        embedded
                        mode="view"
                        voucherNumber={
                            viewVoucherNumber
                        }
                        lrData={
                            viewLRData
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

export default TripLrEntryRegister;