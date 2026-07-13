import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type driverSettlementRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    driverSettlementRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   CREATE / GET driver Settlement Register 
=================================================== */

export const addDriverSettlementRegister = createAsyncThunk<
    any,
    any,
    { rejectValue: RejectValue }
>(
    "driverSettlementRegister/addDriverSettlementRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/driverSettlementRegister",
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
                        "Failed to fetch driver settlement register",
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
                    "Failed to fetch driver settlement register",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: driverSettlementRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    driverSettlementRegisterData: [],
    pagination: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const driverSettlementRegisterSlice = createSlice({
    name: "driverSettlementRegister",
    initialState,
    reducers: {
        clearDriverSettlementRegisterError: (state) => {
            state.error = null;
        },

        clearDriverSettlementRegisterData: (state) => {
            state.driverSettlementRegisterData = [];
            state.pagination = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addDriverSettlementRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                }

                state.error = null;
            })

            .addCase(addDriverSettlementRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.driverSettlementRegisterData =
                    action.payload?.records || [];
                state.pagination =
                    action.payload?.pagination || {};
            })

            .addCase(addDriverSettlementRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch driver settlement register";
            });
    },
});

export const {
    clearDriverSettlementRegisterError,
    clearDriverSettlementRegisterData,
} = driverSettlementRegisterSlice.actions;

export default driverSettlementRegisterSlice.reducer;