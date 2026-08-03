import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string;
};

export type DrillDownExportType = "pdf" | "excel";

type SalesOrderListParams = {
    offset?: number;
    limit?: number;
    status?: string;
    search?: string;
};

type DrillDownReportParams = {
    salesOrderNumber: string;
};

type ExportDrillDownReportParams = {
    salesOrderNumber: string;
    exportType: DrillDownExportType;
};

export type DrillDownSummary = {
    invoiceNetTotal?: number;
    invoiceBalance?: number;
    receiptTotal?: number;
    returnTotal?: number;
};

export type DrillDownSalesInvoice = {
    sInvVoucherNumber?: string;
    sInvVoucherDate?: string;
    sInvCustomerName?: string;
    sInvCustomerCode?: string;
    sInvStatus?: string;
    sInvFooter?: {
        grossAmount?: number;
        discountAmount?: number;
        cgstAmount?: number;
        sgstAmount?: number;
        igstAmount?: number;
        netAmount?: number;
        adjustedAmount?: number;
        balanceAmount?: number;
        [key: string]: any;
    };
    sInvBody?: any[];
    [key: string]: any;
};

export type DrillDownReceipt = {
    recVoucherNumber?: string;
    recVoucherDate?: string;
    recAccountName?: string;
    recAccountCode?: string;
    recStatus?: string;
    recFooter?: {
        netAmount?: number;
        adjustedAmount?: number;
        balanceAmount?: number;
        [key: string]: any;
    };
    recBody?: Array<{
        references?: Array<{
            salesInvoice?: string;
            adjustedAmount?: number;
            [key: string]: any;
        }>;
        [key: string]: any;
    }>;
    [key: string]: any;
};

export type DrillDownSalesReturn = {
    sInvReturnVoucherNumber?: string;
    sInvReturnVoucherDate?: string;
    sInvVoucherNumber?: string;
    sInvReturnCustomerName?: string;
    sInvReturnCustomerCode?: string;
    sInvReturnStatus?: string;
    sInvReturnFooter?: {
        netAmount?: number;
        [key: string]: any;
    };
    sInvReturnBody?: any[];
    [key: string]: any;
};

export type DrillDownReportData = {
    salesOrderNumber?: string;
    summary?: DrillDownSummary;
    salesInvoices?: DrillDownSalesInvoice[];
    receipts?: DrillDownReceipt[];
    salesReturns?: DrillDownSalesReturn[];
    [key: string]: any;
};

type PaginationState = {
    offset: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

type DrillDownReportState = {
    salesOrderListingLoader: boolean;
    reportLoader: boolean;
    exportLoader: "" | DrillDownExportType;

    salesOrderList: any[];
    report: DrillDownReportData | null;

    error: string | null;

    pagination: PaginationState;
};

const initialPagination: PaginationState = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const initialState: DrillDownReportState = {
    salesOrderListingLoader: false,
    reportLoader: false,
    exportLoader: "",

    salesOrderList: [],
    report: null,

    error: null,

    pagination: initialPagination,
};

/* ===================================================
   GET SALES ORDER LIST
=================================================== */

export const getDrillDownSalesOrders = createAsyncThunk<
    any,
    SalesOrderListParams | undefined,
    { rejectValue: RejectValue }
>(
    "drillDownReport/getDrillDownSalesOrders",
    async (
        {
            offset = 0,
            limit = 10,
            status = "",
            search = "",
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const params: Record<string, any> = {
                offset,
                limit,
            };

            if (status) {
                params.status = status;
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesOrder/getAll",
                {
                    params,
                }
            );

            if (res.data?.success === false) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch sales orders",
                });
            }

            return (
                res.data?.data ?? {
                    records: [],
                    pagination: initialPagination,
                }
            );
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    "Failed to fetch sales orders",
            });
        }
    }
);

/* ===================================================
   GET DRILL DOWN REPORT
=================================================== */

export const getDrillDownReport = createAsyncThunk<
    DrillDownReportData,
    DrillDownReportParams,
    { rejectValue: RejectValue }
>(
    "drillDownReport/getDrillDownReport",
    async (
        { salesOrderNumber },
        { rejectWithValue }
    ) => {
        try {
            const normalizedSalesOrderNumber =
                String(salesOrderNumber || "").trim();

            if (!normalizedSalesOrderNumber) {
                return rejectWithValue({
                    message: "Sales order number is required",
                });
            }

            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookEZ/reporting/drilldown/bySalesOrder/${encodeURIComponent(
                    normalizedSalesOrderNumber
                )}`
            );

            if (res.data?.success === false) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch drill-down report",
                });
            }

            const report =
                res.data?.data ??
                res.data ??
                null;

            if (!report) {
                return rejectWithValue({
                    message: "No drill-down report data found",
                });
            }

            return report;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to fetch drill-down report",
            });
        }
    }
);

/* ===================================================
   EXPORT DRILL DOWN REPORT
=================================================== */

export const exportDrillDownReport = createAsyncThunk<
    {
        exportType: DrillDownExportType;
        fileName: string;
    },
    ExportDrillDownReportParams,
    { rejectValue: RejectValue }
>(
    "drillDownReport/exportDrillDownReport",
    async (
        {
            salesOrderNumber,
            exportType,
        },
        { rejectWithValue }
    ) => {
        try {
            const normalizedSalesOrderNumber =
                String(salesOrderNumber || "").trim();

            if (!normalizedSalesOrderNumber) {
                return rejectWithValue({
                    message: "Sales order number is required",
                });
            }

            const isPdf =
                exportType === "pdf";

            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookEZ/reporting/drilldown/bySalesOrder/${encodeURIComponent(
                    normalizedSalesOrderNumber
                )}`,
                {
                    params: {
                        exportType,
                    },
                    responseType: "blob",
                    headers: {
                        Accept: isPdf
                            ? "application/pdf"
                            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    },
                }
            );

            const fileExtension =
                isPdf ? "pdf" : "xlsx";

            const mimeType =
                isPdf
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            const fileName =
                `DrillDownReport_${normalizedSalesOrderNumber}_${Date.now()}.${fileExtension}`;

            const blob = new Blob(
                [response.data],
                {
                    type: mimeType,
                }
            );

            const blobUrl =
                window.URL.createObjectURL(blob);

            const anchor =
                document.createElement("a");

            anchor.href = blobUrl;
            anchor.download = fileName;

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            window.setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 100);

            return {
                exportType,
                fileName,
            };
        } catch (err: any) {
            let message =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to export drill-down report";

            const responseData =
                err?.response?.data;

            if (
                typeof Blob !== "undefined" &&
                responseData instanceof Blob
            ) {
                try {
                    const errorText =
                        await responseData.text();

                    if (errorText) {
                        try {
                            const parsed =
                                JSON.parse(errorText);

                            message =
                                parsed?.message ||
                                parsed?.error ||
                                message;
                        } catch {
                            message =
                                errorText || message;
                        }
                    }
                } catch {
                    // Keep the fallback error message.
                }
            }

            return rejectWithValue({
                message,
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const drillDownReportSlice = createSlice({
    name: "drillDownReport",

    initialState,

    reducers: {
        clearDrillDownReport: (state) => {
            state.report = null;
            state.error = null;
            state.reportLoader = false;
            state.exportLoader = "";
        },

        clearDrillDownSalesOrders: (state) => {
            state.salesOrderList = [];
            state.pagination = initialPagination;
            state.salesOrderListingLoader = false;
        },

        clearDrillDownReportState: (state) => {
            state.salesOrderListingLoader = false;
            state.reportLoader = false;
            state.exportLoader = "";

            state.salesOrderList = [];
            state.report = null;

            state.error = null;
            state.pagination = initialPagination;
        },
    },

    extraReducers: (builder) => {
        builder

            /* ---------- SALES ORDER LIST ---------- */

            .addCase(
                getDrillDownSalesOrders.pending,
                (state) => {
                    state.salesOrderListingLoader = true;
                    state.error = null;
                }
            )
            .addCase(
                getDrillDownSalesOrders.fulfilled,
                (state, action) => {
                    state.salesOrderListingLoader = false;

                    state.salesOrderList =
                        action.payload?.records ?? [];

                    state.pagination =
                        action.payload?.pagination ??
                        state.pagination;
                }
            )
            .addCase(
                getDrillDownSalesOrders.rejected,
                (state, action) => {
                    state.salesOrderListingLoader = false;

                    state.salesOrderList = [];

                    state.error =
                        action.payload?.message ||
                        "Failed to fetch sales orders";
                }
            )

            /* ---------- DRILL DOWN REPORT ---------- */

            .addCase(
                getDrillDownReport.pending,
                (state) => {
                    state.reportLoader = true;
                    state.error = null;
                    state.report = null;
                }
            )
            .addCase(
                getDrillDownReport.fulfilled,
                (state, action) => {
                    state.reportLoader = false;
                    state.report = action.payload;
                }
            )
            .addCase(
                getDrillDownReport.rejected,
                (state, action) => {
                    state.reportLoader = false;
                    state.report = null;

                    state.error =
                        action.payload?.message ||
                        "Failed to fetch drill-down report";
                }
            )

            /* ---------- EXPORT REPORT ---------- */

            .addCase(
                exportDrillDownReport.pending,
                (state, action) => {
                    state.exportLoader =
                        action.meta.arg.exportType;

                    state.error = null;
                }
            )
            .addCase(
                exportDrillDownReport.fulfilled,
                (state) => {
                    state.exportLoader = "";
                }
            )
            .addCase(
                exportDrillDownReport.rejected,
                (state, action) => {
                    state.exportLoader = "";

                    state.error =
                        action.payload?.message ||
                        "Failed to export drill-down report";
                }
            );
    },
});

export const {
    clearDrillDownReport,
    clearDrillDownSalesOrders,
    clearDrillDownReportState,
} = drillDownReportSlice.actions;

export default drillDownReportSlice.reducer;