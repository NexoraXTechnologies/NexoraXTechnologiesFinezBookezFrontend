import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
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
    any,
    { rejectValue: RejectValue }
>(
    "purchaseRegister/addPurchaseRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/purchaseRegister",
                {
                    ...payload,
                },
                payload?.exportType
                    ? {
                          responseType: "blob",
                      }
                    : undefined
            );

            /*
               PDF / Excel response
            */
            if (payload?.exportType) {
                return {
                    blob: res.data,
                    exportType: payload.exportType,
                };
            }

            /*
               Normal list response
            */
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
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch purchase register",
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
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addPurchaseRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                }

                state.error = null;
            })

            .addCase(addPurchaseRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.purchaseRegisterData =
                    action.payload?.records || [];
                state.pagination =
                    action.payload?.pagination || {};
            })

            .addCase(addPurchaseRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch purchase register";
            });
    },
});

export const {
    clearPurchaseRegisterError,
    clearPurchaseRegisterData,
} = purchaseRegisterSlice.actions;

export default purchaseRegisterSlice.reducer;