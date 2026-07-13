import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type tripExpenseRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    tripExpenseRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   CREATE / GET trip expense REGISTER
=================================================== */

export const addTripExpenseRegister = createAsyncThunk<
    any,
    any,
    { rejectValue: RejectValue }
>(
    "tripExpenseRegister/addTripExpenseRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/tripExpenseRegister",
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
                        "Failed to fetch trip expense register",
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
                    "Failed to fetch trip expense register",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: tripExpenseRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    tripExpenseRegisterData: [],
    pagination: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const tripExpenseRegisterSlice = createSlice({
    name: "tripExpenseRegister",
    initialState,
    reducers: {
        clearTripExpenseRegisterError: (state) => {
            state.error = null;
        },

        clearTripExpenseRegisterData: (state) => {
            state.tripExpenseRegisterData = [];
            state.pagination = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addTripExpenseRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                }

                state.error = null;
            })

            .addCase(addTripExpenseRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.tripExpenseRegisterData =
                    action.payload?.records || [];
                state.pagination =
                    action.payload?.pagination || {};
            })

            .addCase(addTripExpenseRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch trip expense register";
            });
    },
});

export const {
    clearTripExpenseRegisterError,
    clearTripExpenseRegisterData,
} = tripExpenseRegisterSlice.actions;

export default tripExpenseRegisterSlice.reducer;