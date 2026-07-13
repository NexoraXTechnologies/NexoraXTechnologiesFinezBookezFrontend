import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type tripAllocationRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    tripAllocationRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   CREATE / GET Trip Allocation REGISTER
=================================================== */

export const addTripAllocationRegister = createAsyncThunk<
    any,
    any,
    { rejectValue: RejectValue }
>(
    "tripAllocationRegister/addTripAllocationRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/tripAllocationRegister",
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
                        "Failed to fetch trip allocation register",
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
                    "Failed to fetch trip allocation register",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: tripAllocationRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    tripAllocationRegisterData: [],
    pagination: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const tripAllocationRegisterSlice = createSlice({
    name: "tripAllocationRegister",
    initialState,
    reducers: {
        clearTripAllocationRegisterError: (state) => {
            state.error = null;
        },

        clearTripAllocationRegisterData: (state) => {
            state.tripAllocationRegisterData = [];
            state.pagination = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addTripAllocationRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                }

                state.error = null;
            })

            .addCase(addTripAllocationRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.tripAllocationRegisterData =
                    action.payload?.records || [];
                state.pagination =
                    action.payload?.pagination || {};
            })

            .addCase(addTripAllocationRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch trip allocation register";
            });
    },
});

export const {
    clearTripAllocationRegisterError,
    clearTripAllocationRegisterData,
} = tripAllocationRegisterSlice.actions;

export default tripAllocationRegisterSlice.reducer;