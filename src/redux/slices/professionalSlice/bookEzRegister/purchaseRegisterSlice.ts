import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

export type PurchaseRegisterPayload = {
    fromDate?: string;
    toDate?: string;
    vendorCode?: string;

    customCodes?: string[];

    offset?: number;
    limit?: number;

    exportType?: "pdf" | "excel" | "";

    selectedColumns?: string[];
};

type PurchaseRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    purchaseRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   CREATE / GET PURCHASE REGISTER
=================================================== */

export const addPurchaseRegister = createAsyncThunk<
    any,
    PurchaseRegisterPayload,
    { rejectValue: RejectValue }
>(
    "purchaseRegister/addPurchaseRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const requestPayload = {
                ...payload,

                /*
                 * Backend expects customCodes as an array.
                 * Send [""] when no custom filter is selected.
                 */
                customCodes:
                    Array.isArray(payload?.customCodes) &&
                        payload.customCodes.length > 0
                        ? payload.customCodes
                        : [""],

                /*
                 * selectedColumns should be sent only
                 * during PDF or Excel export.
                 */
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
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/purchaseRegister",
                requestPayload,
                payload?.exportType
                    ? {
                        responseType: "blob",
                    }
                    : undefined
            );

            /* ===========================================
               PDF / EXCEL RESPONSE
            =========================================== */

            if (payload?.exportType) {
                return {
                    blob: res.data,
                    exportType: payload.exportType,
                };
            }

            /* ===========================================
               NORMAL LIST RESPONSE
            =========================================== */

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res?.data?.message ||
                        "Failed to fetch purchase register",
                });
            }

            return {
                records: res.data?.data?.invoices || [],
                pagination: res.data?.data?.pagination || {},
            };
        } catch (error: any) {
            let errorMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to fetch purchase register";

            /*
             * Export validation errors may be returned
             * as Blob because responseType is "blob".
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

const initialState: PurchaseRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    purchaseRegisterData: [],
    pagination: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const purchaseRegisterSlice = createSlice({
    name: "purchaseRegister",

    initialState,

    reducers: {
        clearPurchaseRegisterError: (state) => {
            state.error = null;
        },

        clearPurchaseRegisterData: (state) => {
            state.purchaseRegisterData = [];
            state.pagination = {};
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            /* ===========================================
               PENDING
            =========================================== */

            .addCase(addPurchaseRegister.pending, (state, action) => {
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

            /* ===========================================
               FULFILLED
            =========================================== */

            .addCase(addPurchaseRegister.fulfilled, (state, action) => {
                const isExport = Boolean(
                    action.meta.arg?.exportType
                );

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.listingLoader = false;

                state.purchaseRegisterData =
                    action.payload?.records || [];

                state.pagination =
                    action.payload?.pagination || {};

                state.error = null;
            })

            /* ===========================================
               REJECTED
            =========================================== */

            .addCase(addPurchaseRegister.rejected, (state, action) => {
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
                    "Failed to fetch purchase register";
            });
    },
});

/* ===================================================
   EXPORTS
=================================================== */

export const {
    clearPurchaseRegisterError,
    clearPurchaseRegisterData,
} = purchaseRegisterSlice.actions;

export default purchaseRegisterSlice.reducer;