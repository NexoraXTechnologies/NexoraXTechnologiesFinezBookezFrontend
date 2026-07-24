import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

export type ReceiptRegisterPayload = {
    fromDate?: string;
    toDate?: string;
    accountCode?: string;

    customCodes?: string[];

    offset?: number;
    limit?: number;

    exportType?: "pdf" | "excel" | "";
    selectedColumns?: string[];
};

type ReceiptRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    receiptRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   ADD / GET RECEIPT REGISTER
=================================================== */

export const addReceiptRegister = createAsyncThunk<
    any,
    ReceiptRegisterPayload,
    { rejectValue: RejectValue }
>(
    "receiptRegister/addReceiptRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const requestPayload = {
                ...payload,

                customCodes:
                    Array.isArray(payload?.customCodes) &&
                        payload.customCodes.length > 0
                        ? payload.customCodes
                        : [""],

                ...(payload?.exportType
                    ? {
                        selectedColumns: Array.isArray(
                            payload?.selectedColumns
                        )
                            ? payload.selectedColumns
                            : [],
                    }
                    : {}),
            };

            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/receiptRegister",
                requestPayload,
                payload?.exportType
                    ? {
                        responseType: "blob",
                    }
                    : undefined
            );

            /* ===================================================
               PDF / EXCEL EXPORT RESPONSE
            =================================================== */

            if (payload?.exportType) {
                return {
                    blob: res.data,
                    exportType: payload.exportType,
                };
            }

            /* ===================================================
               NORMAL LIST RESPONSE
            =================================================== */

            if (!res?.data?.success) {
                return rejectWithValue({
                    message:
                        res?.data?.message ||
                        "Failed to fetch receipt register",
                });
            }

            return {
                records: res?.data?.data?.receipts || [],
                pagination: res?.data?.data?.pagination || {},
            };
        } catch (error: any) {
            let errorMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch receipt register";

            /*
             * Export errors can arrive as Blob because responseType is "blob".
             */
            if (error?.response?.data instanceof Blob) {
                try {
                    const errorText = await error.response.data.text();
                    const parsedError = JSON.parse(errorText);

                    errorMessage =
                        parsedError?.message ||
                        parsedError?.error ||
                        errorMessage;
                } catch {
                    // Keep existing fallback error message.
                }
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

const initialState: ReceiptRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    receiptRegisterData: [],
    pagination: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const receiptRegisterSlice = createSlice({
    name: "receiptRegister",

    initialState,

    reducers: {
        clearReceiptRegisterError: (state) => {
            state.error = null;
        },

        clearReceiptRegisterData: (state) => {
            state.receiptRegisterData = [];
            state.pagination = {};
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(addReceiptRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                    state.listingLoader = true;
                }

                state.error = null;
            })

            .addCase(addReceiptRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.listingLoader = false;
                state.receiptRegisterData =
                    action.payload?.records || [];
                state.pagination =
                    action.payload?.pagination || {};
                state.error = null;
            })

            .addCase(addReceiptRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                    state.listingLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch receipt register";
            });
    },
});

export const {
    clearReceiptRegisterError,
    clearReceiptRegisterData,
} = receiptRegisterSlice.actions;

export default receiptRegisterSlice.reducer;