import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, LoaderCircle } from "lucide-react";

import RegisterFilterCard from "../RegisterFilterCard";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import {
    getTransportOrderByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";

import ReadMoreText from "../../../../components/common/ReadMoreText";
import PageComponentModal from "../../../../components/mainPage/PageComponentModal";
import CreateEditTransportOrder from "./CreateEditTransportOrder";
import { getTransportOrderRegister } from "../../../../redux/slices/professionalSlice/bookEzRegister/transportOrderRegister";
import { toDateInputValue, toLocalEndOfDayUtc, toLocalStartOfDayUtc } from "../../../../utils/helperFunctions";
import CreateTransportOrder from "../../transportation/transportOrder/CreateTransportOrder";




/* =====================================================
   HELPERS
===================================================== */

const getTodayDate = (): string => {
    const currentDate = new Date();

    const localDate = new Date(
        currentDate.getTime() -
        currentDate.getTimezoneOffset() * 60 * 1000
    );

    return localDate.toISOString().split("T")[0];
};

const toNumber = (value: any): number => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const parsedValue = Number(
        String(value)
            .replace(/,/g, "")
            .replace(/[₹\s]/g, "")
            .trim()
    );

    return Number.isFinite(parsedValue)
        ? parsedValue
        : 0;
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

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    const formattedDate = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    return `${formattedDate} ${formattedTime}`;
};

const getTransportOrderVoucher = (row: any): string => {
    return (
        row?.transportOrderVoucherNumber ||
        row?.transportOrderNumber ||
        row?.voucherNumber ||
        row?.orderNumber ||
        ""
    );
};

const getCustomerName = (row: any): string => {
    return (
        row?.customerDetails?.customerName ||
        row?.customerDetails?.accountName ||
        row?.customerName ||
        row?.accountName ||
        "-"
    );
};

const getCustomerCode = (row: any): string => {
    return (
        row?.customerDetails?.customerCode ||
        row?.customerDetails?.accountCode ||
        row?.customerCode ||
        row?.accountCode ||
        "-"
    );
};

const getPickupLocation = (row: any): string => {
    return (
        row?.pickupDetails?.pickupLocation ||
        row?.pickupDetails?.location ||
        row?.pickupLocation ||
        row?.source ||
        "-"
    );
};

const getDeliveryLocation = (row: any): string => {
    return (
        row?.deliveryDetails?.deliveryLocation ||
        row?.deliveryDetails?.location ||
        row?.deliveryLocation ||
        row?.destination ||
        "-"
    );
};

const getExpectedFreight = (row: any): number => {
    return toNumber(
        row?.freightDetails?.expectedFreight ??
        row?.freightDetails?.totalFreight ??
        row?.expectedFreight ??
        row?.totalFreight ??
        0
    );
};

const getOrderStatus = (row: any): string => {
    const rawStatus = String(
        row?.status ||
        row?.orderStatus ||
        row?.transportOrderStatus ||
        ""
    )
        .trim()
        .toLowerCase();

    const closedStatuses = [
        "close",
        "closed",
        "completed",
        "complete",
    ];

    if (
        row?.isClosed === true ||
        row?.closed === true ||
        closedStatuses.includes(rawStatus)
    ) {
        return "Closed";
    }

    if (!rawStatus) {
        return "Open";
    }

    return rawStatus
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) =>
            character.toUpperCase()
        );
};

const getStatusClassName = (status: string): string => {
    const normalizedStatus = status.toLowerCase();

    if (
        normalizedStatus === "closed" ||
        normalizedStatus === "completed"
    ) {
        return `
            bg-emerald-100 text-emerald-700
            dark:bg-emerald-500/15 dark:text-emerald-400
        `;
    }

    if (
        normalizedStatus === "cancelled" ||
        normalizedStatus === "canceled"
    ) {
        return `
            bg-red-100 text-red-700
            dark:bg-red-500/15 dark:text-red-400
        `;
    }

    if (
        normalizedStatus === "pending" ||
        normalizedStatus === "processing"
    ) {
        return `
            bg-amber-100 text-amber-700
            dark:bg-amber-500/15 dark:text-amber-400
        `;
    }

    return "bg-primary/10 text-primary";
};

const getOrderFromResponse = (
    response: any,
    voucherNumber: string
) => {
    if (response?.transportOrder) {
        return response.transportOrder;
    }

    if (response?.data?.transportOrder) {
        return response.data.transportOrder;
    }

    if (response?.record) {
        return response.record;
    }

    if (response?.data?.record) {
        return response.data.record;
    }

    if (
        response?.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
    ) {
        return response.data;
    }

    if (
        response &&
        typeof response === "object" &&
        !Array.isArray(response) &&
        getTransportOrderVoucher(response) ===
        voucherNumber
    ) {
        return response;
    }

    return null;
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

    return null;
};

/* =====================================================
   TABLE COLUMNS
===================================================== */

const mainColumns = [
    {
        key: "transportOrderVoucherNumber",
        title: "Order Number",
        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getTransportOrderVoucher(row) || "-"}
            </span>
        ),
    },
    {
        key: "orderDate",
        title: "Order Date",
        render: (row: any) => (
            <span className="whitespace-nowrap font-medium text-card-foreground">
                {formatDateTime(
                    row?.orderDate ||
                    row?.voucherDate ||
                    row?.transportOrderDate ||
                    row?.createdAt
                )}
            </span>
        ),
    },
    {
        key: "customerName",
        title: "Customer",
        render: (row: any) => (
            <div>
                <div className="font-semibold text-card-foreground">
                    {getCustomerName(row)}
                </div>

                {getCustomerCode(row) !== "-" && (
                    <div className="text-xs text-muted-foreground">
                        {getCustomerCode(row)}
                    </div>
                )}
            </div>
        ),
    },
    {
        key: "route",
        title: "Pickup",
        render: (row: any) => (
            <span
                className="font-medium text-card-foreground"
                title={`${getPickupLocation(row)}`}
            >
                <ReadMoreText
                    text={getPickupLocation(row)}
                    charLimit={20}
                />
            </span>
        ),
    },
    {
        key: "route",
        title: "Delivery",
        render: (row: any) => (
            <span
                className="font-medium text-card-foreground"
                title={`${getDeliveryLocation(row)}`}
            >
                <ReadMoreText
                    text={getDeliveryLocation(row)}
                    charLimit={20}
                />
            </span>
        ),
    },
    {
        key: "expectedFreight",
        title: "Expected Freight",
        render: (row: any) => (
            <span className="whitespace-nowrap font-bold text-foreground">
                ₹ {formatIndianNumber(getExpectedFreight(row))}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) => {
            const status = getOrderStatus(row);

            return (
                <span
                    className={`
                        inline-flex rounded-full px-2.5 py-1
                        text-xs font-semibold
                        ${getStatusClassName(status)}
                    `}
                >
                    {status}
                </span>
            );
        },
    },
];

/* =====================================================
   TRANSPORT ORDER REGISTER
===================================================== */

const TransportOrderRegister = () => {
    const dispatch = useDispatch<any>();
    const today = getTodayDate();

    const [fromDate, setFromDate] =
        useState<string>(
            toLocalStartOfDayUtc(today)
        );

    const [toDate, setToDate] =
        useState<string>(
            toLocalEndOfDayUtc(today)
        );

    const [localOffset, setLocalOffset] =
        useState<number>(0);

    const [localLimit, setLocalLimit] =
        useState<number>(10);

    const [refreshKey, setRefreshKey] =
        useState<number>(0);

    const [pdfLoading, setPdfLoading] =
        useState<boolean>(false);

    const [excelLoading, setExcelLoading] =
        useState<boolean>(false);

    const [openingVoucher, setOpeningVoucher] =
        useState<string>("");

    const [viewModal, setViewModal] =
        useState<boolean>(false);

    const [viewLoading, setViewLoading] =
        useState<boolean>(false);

    const [viewOrder, setViewOrder] =
        useState<any>(null);

    const [viewVoucherNumber, setViewVoucherNumber] =
        useState<string>("");

    const [viewError, setViewError] =
        useState<string>("");

    /*
     * This uses the reducer key from:
     *
     * createSlice({
     *     name: "transportationOrder"
     * })
     *
     * If your store reducer key is different,
     * update this selector.
     */

    const {
        transportOrderRegisterData = [],
        listingLoader = false,
        pagination = {},
        error = null,
    } = useSelector(
        (state: any) =>
            state.transportOrderRegister ||
            {}
    );

    const {
        detailLoader = false,
    } = useSelector(
        (state: any) =>
            state.transportationOrder ||
            state.transportOrder ||
            {}
    );

    const hasDateFilter = useMemo(() => {
        return Boolean(fromDate && toDate);
    }, [fromDate, toDate]);

    const tableData = useMemo(() => {
        return Array.isArray(
            transportOrderRegisterData
        )
            ? transportOrderRegisterData
            : [];
    }, [transportOrderRegisterData]);

    const currentPagination = useMemo(() => {
        return pagination || {};
    }, [pagination]);

    const getPayload = (
        exportType: "pdf" | "excel" | "" = ""
    ) => {
        return {
            fromDate,
            toDate,
            offset: localOffset,
            limit: localLimit,
            exportType,
        };
    };

    useEffect(() => {
        if (!fromDate || !toDate) {
            return;
        }

        dispatch(
            getTransportOrderRegister(getPayload())
        );
    }, [
        dispatch,
        fromDate,
        toDate,
        localOffset,
        localLimit,
        refreshKey,
    ]);

    const handleSearch = () => {
        if (!fromDate || !toDate) {
            return;
        }

        setLocalOffset(0);
        setRefreshKey((previousValue) =>
            previousValue + 1
        );
    };

    const handleClear = () => {
        const currentDate = getTodayDate();

        setFromDate(
            toLocalStartOfDayUtc(
                currentDate
            )
        );

        setToDate(
            toLocalEndOfDayUtc(
                currentDate
            )
        );

        setLocalOffset(0);

        setRefreshKey((previousValue) =>
            previousValue + 1
        );
    };

    const downloadBlobFile = (
        blob: Blob,
        fileName: string
    ) => {
        const downloadUrl =
            window.URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(downloadUrl);
    };

    const handleDownloadPdf = async () => {
        if (!hasDateFilter || pdfLoading) {
            return;
        }

        try {
            setPdfLoading(true);

            const response = await dispatch(
                getTransportOrderRegister(
                    getPayload("pdf")
                )
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (blob) {
                downloadBlobFile(
                    blob,
                    "transport-order-register.pdf"
                );
            }
        } catch (downloadError) {
            console.log(
                "Transport Order Register PDF download failed",
                downloadError
            );
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!hasDateFilter || excelLoading) {
            return;
        }

        try {
            setExcelLoading(true);

            const response = await dispatch(
                getTransportOrderRegister(
                    getPayload("excel")
                )
            ).unwrap();

            const blob = getBlobFromResponse(response);

            if (blob) {
                downloadBlobFile(
                    blob,
                    "transport-order-register.xlsx"
                );
            }
        } catch (downloadError) {
            console.log(
                "Transport Order Register Excel download failed",
                downloadError
            );
        } finally {
            setExcelLoading(false);
        }
    };

    const closeViewModal = () => {
        setViewModal(false);
        setViewLoading(false);
        setViewOrder(null);
        setViewVoucherNumber("");
        setViewError("");
        setOpeningVoucher("");
    };

    const handleViewTransportOrder = async (
        row: any
    ) => {
        const voucherNumber =
            getTransportOrderVoucher(row);

        if (!voucherNumber || openingVoucher) {
            if (!voucherNumber) {
                console.log(
                    "Transport order voucher number missing",
                    row
                );
            }

            return;
        }

        try {
            setOpeningVoucher(voucherNumber);
            setViewModal(true);
            setViewLoading(true);
            setViewOrder(null);
            setViewVoucherNumber(voucherNumber);
            setViewError("");

            const response = await dispatch(
                getTransportOrderByVoucherNumber(
                    voucherNumber
                )
            ).unwrap();

            const orderData = getOrderFromResponse(
                response,
                voucherNumber
            );

            if (!orderData) {
                setViewError(
                    "Transport order details were not found."
                );

                return;
            }

            setViewOrder(orderData);
        } catch (viewOrderError: any) {
            console.log(
                "Failed to open transport order",
                viewOrderError
            );

            setViewError(
                viewOrderError?.message ||
                viewOrderError?.response?.data?.message ||
                "Failed to load transport order."
            );
        } finally {
            setViewLoading(false);
            setOpeningVoucher("");
        }
    };

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Transport Order Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: toDateInputValue(
                            fromDate
                        ),
                        onChange: (value) => {
                            setFromDate(
                                toLocalStartOfDayUtc(
                                    value
                                )
                            );
                            setLocalOffset(0);
                        },
                        required: true,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDateInputValue(
                            toDate
                        ),
                        onChange: (value) => {
                            setToDate(
                                toLocalEndOfDayUtc(
                                    value
                                )
                            );
                            setLocalOffset(0);
                        },
                        required: true,
                    },
                ]}
                gridCols="2"
                onSearch={handleSearch}
                onClear={handleClear}
                onDownloadPdf={handleDownloadPdf}
                onDownloadExcel={handleDownloadExcel}
                pdfDisabled={
                    !hasDateFilter || pdfLoading
                }
                excelDisabled={
                    !hasDateFilter || excelLoading
                }
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
                downloadDisabledMessage={
                    !hasDateFilter
                        ? "Please select From Date and To Date."
                        : "Please wait, export is processing."
                }
            />

            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {typeof error === "string"
                        ? error
                        : error?.message ||
                        "Failed to load transport order register."}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={listingLoader}
                emptyMessage="No transport orders found"
                showFieldSelector={false}
                actions={(row: any) => {
                    const voucherNumber =
                        getTransportOrderVoucher(row);

                    const isOpening =
                        openingVoucher ===
                        voucherNumber &&
                        (detailLoader || viewLoading);

                    return (
                        <button
                            type="button"
                            disabled={Boolean(
                                openingVoucher
                            )}
                            onClick={(event) => {
                                event.stopPropagation();

                                handleViewTransportOrder(
                                    row
                                );
                            }}
                            className="
                                inline-flex cursor-pointer items-center
                                justify-center rounded-lg bg-primary/10
                                px-3 py-1.5 text-xs font-bold
                                text-primary transition hover:bg-primary/20
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                            title="View Transport Order"
                        >
                            {isOpening ? (
                                <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                />
                            ) : (
                                <Eye size={15} />
                            )}
                        </button>
                    );
                }}
            />

            {Number(
                currentPagination?.totalDocs || 0
            ) > 0 && (
                    <div className="mt-2">
                        <Pagination
                            localLimit={localLimit}
                            selectCb={(event: any) => {
                                setLocalLimit(
                                    Number(
                                        event.target.value
                                    )
                                );

                                setLocalOffset(0);
                            }}
                            preDisabled={
                                !currentPagination?.hasPrevPage
                            }
                            nextDisabled={
                                !currentPagination?.hasNextPage
                            }
                            setLocalOffset={setLocalOffset}
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
                        ? `Transport Order - ${viewVoucherNumber}`
                        : "Transport Order"
                }
                description="View transport order details."
                onClose={closeViewModal}
            >
                {viewLoading ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-5 py-4 shadow-sm">
                            <LoaderCircle
                                size={20}
                                className="animate-spin text-primary"
                            />

                            <span className="text-sm font-semibold">
                                Loading transport order...
                            </span>
                        </div>
                    </div>
                ) : viewError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                        {viewError}
                    </div>
                ) : viewOrder ? (
                            <CreateTransportOrder
                        embedded
                        mode="view"
                        voucherNumber={
                            viewVoucherNumber
                        }
                        orderData={
                            viewOrder
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

export default TransportOrderRegister;