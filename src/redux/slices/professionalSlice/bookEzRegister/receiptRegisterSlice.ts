import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
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
    any,
    { rejectValue: RejectValue }
>(
    "receiptRegister/addReceiptRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/receiptRegister",
                {
                    ...payload,
                },
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
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    error?.message ||
                    "Failed to fetch receipt register",
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