import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

export type PaymentRegisterPayload = {
    fromDate?: string;
    toDate?: string;
    accountCode?: string;

    customCodes?: string[];

    offset?: number;
    limit?: number;

    exportType?: "pdf" | "excel" | "";
    selectedColumns?: string[];
};

type PaymentRegisterState = {
    addLoader: boolean;
    deleteLoader: boolean;
    listingLoader: boolean;
    exportLoader: boolean;
    paymentRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   ADD / GET PAYMENT REGISTER
=================================================== */

export const addPaymentRegister = createAsyncThunk<
    any,
    PaymentRegisterPayload,
    { rejectValue: RejectValue }
>(
    "paymentRegister/addPaymentRegister",
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
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/paymentRegister",
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
                        "Failed to fetch payment register",
                });
            }

            return {
                records:
                    res?.data?.data?.payments || [],
                pagination:
                    res?.data?.data?.pagination || {},
            };
        } catch (error: any) {
            let errorMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch payment register";

            /*
             * Export errors may be returned as Blob because
             * responseType is set to "blob".
             */
            if (error?.response?.data instanceof Blob) {
                try {
                    const errorText =
                        await error.response.data.text();

                    const parsedError = JSON.parse(errorText);

                    errorMessage =
                        parsedError?.message ||
                        parsedError?.error ||
                        errorMessage;
                } catch {
                    // Keep the existing fallback message.
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

const initialState: PaymentRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    paymentRegisterData: [],
    error: null,
    pagination: {},
};

/* ===================================================
   SLICE
=================================================== */

const paymentRegisterSlice = createSlice({
    name: "paymentRegister",

    initialState,

    reducers: {
        clearPaymentRegisterError: (state) => {
            state.error = null;
        },

        clearPaymentRegisterData: (state) => {
            state.paymentRegisterData = [];
            state.pagination = {};
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(addPaymentRegister.pending, (state, action) => {
                const isExport = Boolean(
                    action.meta.arg?.exportType
                );

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                    state.listingLoader = true;
                }

                state.error = null;
            })

            .addCase(addPaymentRegister.fulfilled, (state, action) => {
                const isExport = Boolean(
                    action.meta.arg?.exportType
                );

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.listingLoader = false;

                state.paymentRegisterData =
                    action.payload?.records || [];

                state.pagination =
                    action.payload?.pagination || {};

                state.error = null;
            })

            .addCase(addPaymentRegister.rejected, (state, action) => {
                const isExport = Boolean(
                    action.meta.arg?.exportType
                );

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                    state.listingLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch payment register";
            });
    },
});

/* ===================================================
   EXPORTS
=================================================== */

export const {
    clearPaymentRegisterError,
    clearPaymentRegisterData,
} = paymentRegisterSlice.actions;

export default paymentRegisterSlice.reducer;