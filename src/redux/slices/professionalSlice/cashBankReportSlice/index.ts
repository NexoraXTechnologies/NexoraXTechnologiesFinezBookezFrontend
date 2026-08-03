import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

export type CashBankModule =
    | "receipt"
    | "payment";

export type CashBankExportType =
    | "pdf"
    | "excel";

type RejectValue = {
    message: string;
};

type CashBankReportParams = {
    module: CashBankModule;
    accountCode: string;
    fromDate: string;
    toDate: string;
    offset?: number;
    limit?: number;
};

type ExportCashBankReportParams = {
    module: CashBankModule;
    accountCode: string;
    fromDate: string;
    toDate: string;
    exportType: CashBankExportType;
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

type CashBankReportState = {
    cashBankReport: any[];
    pagination: PaginationState;
    totalNetAmount: number;

    listingLoader: boolean;
    exportLoader: "" | CashBankExportType;

    error: string | null;
};

const defaultPagination: PaginationState = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const initialState: CashBankReportState = {
    cashBankReport: [],
    pagination: defaultPagination,
    totalNetAmount: 0,

    listingLoader: false,
    exportLoader: "",

    error: null,
};

/* ===================================================
   HELPERS
=================================================== */

const toNumber = (value: any) => {
    if (
        value === null ||
        value === undefined
    ) {
        return 0;
    }

    const normalizedValue = String(value)
        .replace(/,/g, "")
        .trim();

    const number = Number(normalizedValue);

    return Number.isFinite(number)
        ? number
        : 0;
};

const getDateRange = (
    fromDate: string,
    toDate: string
) => {
    const startOfDay = new Date(
        `${fromDate}T00:00:00`
    );

    const endOfDay = new Date(
        `${toDate}T23:59:59.999`
    );

    return {
        startOfDay:
            startOfDay.toISOString(),
        endOfDay:
            endOfDay.toISOString(),
    };
};

const getBlobErrorMessage =
    async (
        error: any,
        fallbackMessage: string
    ) => {
        const responseData =
            error?.response?.data;

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
                            JSON.parse(
                                errorText
                            );

                        return (
                            parsed?.message ||
                            parsed?.error ||
                            fallbackMessage
                        );
                    } catch {
                        return errorText;
                    }
                }
            } catch {
                return fallbackMessage;
            }
        }

        return (
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            fallbackMessage
        );
    };

/* ===================================================
   GET CASH BANK REPORT
=================================================== */

export const getCashBankReport =
    createAsyncThunk<
        any,
        CashBankReportParams,
        {
            rejectValue: RejectValue;
        }
    >(
        "cashBankReport/getCashBankReport",

        async (
            {
                module,
                accountCode,
                fromDate,
                toDate,
                offset = 0,
                limit = 10,
            },
            {
                rejectWithValue,
            }
        ) => {
            try {
                const normalizedAccountCode =
                    String(
                        accountCode || ""
                    ).trim();

                if (
                    !normalizedAccountCode
                ) {
                    return rejectWithValue({
                        message:
                            "Cash/Bank account is required",
                    });
                }

                if (
                    !fromDate ||
                    !toDate
                ) {
                    return rejectWithValue({
                        message:
                            "From Date and To Date are required",
                    });
                }

                const {
                    startOfDay,
                    endOfDay,
                } = getDateRange(
                    fromDate,
                    toDate
                );

                const payload = {
                    module,
                    accountCode:
                        normalizedAccountCode,
                    fromDate:
                        startOfDay,
                    toDate:
                        endOfDay,
                    offset:
                        String(offset),
                    limit:
                        String(limit),
                };

                const res =
                    await professionalAxios.post(
                        "/eTaxSolnMongoApiBackend/users/bookEZ/registers/outstanding",
                        payload
                    );

                if (
                    res.data?.success ===
                    false
                ) {
                    return rejectWithValue({
                        message:
                            res.data?.message ||
                            "Failed to fetch Cash/Bank report",
                    });
                }

                const data =
                    res.data?.data ??
                    res.data ??
                    {};

                return {
                    records:
                        Array.isArray(
                            data?.outstanding
                        )
                            ? data.outstanding
                            : [],

                    pagination:
                        data?.pagination ??
                        defaultPagination,

                    totalNetAmount:
                        toNumber(
                            data?.totalNetAmount
                        ),
                };
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.response?.data
                            ?.error ||
                        "Failed to fetch Cash/Bank report",
                });
            }
        }
    );

/* ===================================================
   EXPORT CASH BANK REPORT
=================================================== */

export const exportCashBankReport =
    createAsyncThunk<
        {
            blob: Blob;
            exportType: CashBankExportType;
        },
        ExportCashBankReportParams,
        {
            rejectValue: RejectValue;
        }
    >(
        "cashBankReport/exportCashBankReport",

        async (
            {
                module,
                accountCode,
                fromDate,
                toDate,
                exportType,
            },
            {
                rejectWithValue,
            }
        ) => {
            try {
                const normalizedAccountCode =
                    String(
                        accountCode || ""
                    ).trim();

                if (
                    !normalizedAccountCode
                ) {
                    return rejectWithValue({
                        message:
                            "Cash/Bank account is required",
                    });
                }

                if (
                    !fromDate ||
                    !toDate
                ) {
                    return rejectWithValue({
                        message:
                            "From Date and To Date are required",
                    });
                }

                const {
                    startOfDay,
                    endOfDay,
                } = getDateRange(
                    fromDate,
                    toDate
                );

                const isPdf =
                    exportType === "pdf";

                const payload = {
                    module,
                    accountCode:
                        normalizedAccountCode,
                    fromDate:
                        startOfDay,
                    toDate:
                        endOfDay,
                    offset:
                        "0",
                    limit:
                        "200",
                    exportType,
                };

                const res =
                    await professionalAxios.post(
                        "/eTaxSolnMongoApiBackend/users/bookEZ/registers/outstanding",
                        payload,
                        {
                            responseType:
                                "blob",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Accept: isPdf
                                    ? "application/pdf"
                                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            },
                        }
                    );

                return {
                    blob:
                        res.data,
                    exportType,
                };
            } catch (error: any) {
                const message =
                    await getBlobErrorMessage(
                        error,
                        "Failed to export Cash/Bank report"
                    );

                return rejectWithValue({
                    message,
                });
            }
        }
    );

/* ===================================================
   SLICE
=================================================== */

const cashBankReportSlice =
    createSlice({
        name:
            "cashBankReport",

        initialState,

        reducers: {
            clearCashBankReportData:
                (state) => {
                    state.cashBankReport =
                        [];

                    state.pagination =
                        defaultPagination;

                    state.totalNetAmount =
                        0;

                    state.error =
                        null;

                    state.listingLoader =
                        false;
                },

            clearCashBankReportError:
                (state) => {
                    state.error =
                        null;
                },

            clearCashBankReportState:
                (state) => {
                    state.cashBankReport =
                        [];

                    state.pagination =
                        defaultPagination;

                    state.totalNetAmount =
                        0;

                    state.listingLoader =
                        false;

                    state.exportLoader =
                        "";

                    state.error =
                        null;
                },
        },

        extraReducers:
            (builder) => {
                builder

                    /* ---------- REPORT LIST ---------- */

                    .addCase(
                        getCashBankReport.pending,
                        (state) => {
                            state.listingLoader =
                                true;

                            state.error =
                                null;
                        }
                    )

                    .addCase(
                        getCashBankReport.fulfilled,
                        (
                            state,
                            action
                        ) => {
                            state.listingLoader =
                                false;

                            state.cashBankReport =
                                action.payload
                                    ?.records ??
                                [];

                            state.pagination =
                                action.payload
                                    ?.pagination ??
                                defaultPagination;

                            state.totalNetAmount =
                                toNumber(
                                    action.payload
                                        ?.totalNetAmount
                                );
                        }
                    )

                    .addCase(
                        getCashBankReport.rejected,
                        (
                            state,
                            action
                        ) => {
                            state.listingLoader =
                                false;

                            state.cashBankReport =
                                [];

                            state.pagination =
                                defaultPagination;

                            state.totalNetAmount =
                                0;

                            state.error =
                                action.payload
                                    ?.message ||
                                "Failed to fetch Cash/Bank report";
                        }
                    )

                    /* ---------- EXPORT REPORT ---------- */

                    .addCase(
                        exportCashBankReport.pending,
                        (
                            state,
                            action
                        ) => {
                            state.exportLoader =
                                action.meta.arg
                                    .exportType;

                            state.error =
                                null;
                        }
                    )

                    .addCase(
                        exportCashBankReport.fulfilled,
                        (state) => {
                            state.exportLoader =
                                "";
                        }
                    )

                    .addCase(
                        exportCashBankReport.rejected,
                        (
                            state,
                            action
                        ) => {
                            state.exportLoader =
                                "";

                            state.error =
                                action.payload
                                    ?.message ||
                                "Failed to export Cash/Bank report";
                        }
                    );
            },
    });

export const {
    clearCashBankReportData,
    clearCashBankReportError,
    clearCashBankReportState,
} = cashBankReportSlice.actions;

export default cashBankReportSlice.reducer;