/* ===================================================
   SALES ORDER REGISTER SLICE
=================================================== */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type SalesOrderRegisterPayload = {
    fromDate: string;
    toDate: string;
    customerCode?: string;
    productCode?: string;
    customCodes?: string[];
    selectedColumns?: string[];
    offset?: number;
    limit?: number;
    exportType?: "pdf" | "excel" | "";
};

type SalesOrderRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    salesOrderRegisterData: any[];
    pagination: any;
    totals: any;
    error: string | null;
};

/* ===================================================
   GET SALES ORDER REGISTER
=================================================== */

export const addSalesOrderRegister = createAsyncThunk<
    any,
    SalesOrderRegisterPayload,
    { rejectValue: RejectValue }
>(
    "salesOrderRegisterSlice/addSalesOrderRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/salesOrderRegister",
                { ...payload },
                payload?.exportType
                    ? {
                        responseType: "blob",
                    }
                    : undefined
            );

            if (payload?.exportType) {
                const contentType = String(res?.headers?.["content-type"] || "");

                if (
                    contentType.includes("application/json") &&
                    res.data instanceof Blob
                ) {
                    const text = await res.data.text();

                    try {
                        const json = JSON.parse(text);

                        if (json?.success === false) {
                            return rejectWithValue({
                                message:
                                    json?.message ||
                                    json?.error ||
                                    "Failed to generate report",
                            });
                        }
                    } catch {
                        return rejectWithValue({
                            message: "Failed to generate report",
                        });
                    }
                }

                return {
                    blob: res.data,
                    exportType: payload.exportType,
                };
            }

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res?.data?.message ||
                        "Failed to fetch sales order register",
                });
            }

            return res?.data?.data;
        } catch (error: any) {
            let errorMessage = "Failed to fetch sales order register";

            const responseData = error?.response?.data;

            if (responseData instanceof Blob) {
                try {
                    const text = await responseData.text();
                    const json = JSON.parse(text);

                    errorMessage =
                        json?.message ||
                        json?.error ||
                        errorMessage;
                } catch {
                    errorMessage =
                        error?.message ||
                        errorMessage;
                }
            } else {
                errorMessage =
                    responseData?.message ||
                    responseData?.error ||
                    error?.message ||
                    errorMessage;
            }

            return rejectWithValue({
                message: errorMessage,
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: SalesOrderRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    salesOrderRegisterData: [],
    pagination: {},
    totals: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const salesOrderRegisterSlice = createSlice({
    name: "salesOrderRegisterSlice",

    initialState,

    reducers: {
        clearSalesOrderRegisterError: (state) => {
            state.error = null;
        },

        clearSalesOrderRegisterData: (state) => {
            state.salesOrderRegisterData = [];
            state.pagination = {};
            state.totals = {};
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(
                addSalesOrderRegister.pending,
                (state, action) => {
                    if (action.meta.arg?.exportType) {
                        state.exportLoader = true;
                    } else {
                        state.addLoader = true;
                        state.listingLoader = true;
                    }

                    state.error = null;
                }
            )

            .addCase(
                addSalesOrderRegister.fulfilled,
                (state, action) => {
                    state.addLoader = false;
                    state.listingLoader = false;
                    state.exportLoader = false;

                    if (action.payload?.blob) {
                        return;
                    }

                    const data =
                        action.payload || {};

                    state.salesOrderRegisterData =
                        data?.orders ||
                        data?.salesOrders ||
                        data?.records ||
                        data?.details ||
                        data?.transactions ||
                        data?.data ||
                        [];

                    state.pagination =
                        data?.pagination || {};

                    state.totals =
                        data?.totals ||
                        data?.summary ||
                        data?.footer ||
                        {};

                    state.error = null;
                }
            )

            .addCase(
                addSalesOrderRegister.rejected,
                (state, action) => {
                    state.addLoader = false;
                    state.listingLoader = false;
                    state.exportLoader = false;

                    state.error =
                        action.payload?.message ||
                        "Failed to fetch sales order register";
                }
            );
    },
});

/* ===================================================
   EXPORTS
=================================================== */

export const {
    clearSalesOrderRegisterError,
    clearSalesOrderRegisterData,
} = salesOrderRegisterSlice.actions;

export default salesOrderRegisterSlice.reducer;