import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type TransportOrderRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    transportOrderRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   CREATE / GET TRASPORT ORDER REGISTER
=================================================== */

export const addTransportOrderRegister = createAsyncThunk<
    any,
    any,
    { rejectValue: RejectValue }
>(
    "transportOrderRegister/addTransportOrderRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/transportOrderRegister",
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
                        "Failed to fetch transport order register",
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
                    "Failed to fetch transport order register",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: TransportOrderRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    transportOrderRegisterData: [],
    pagination: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const transportOrderRegisterSlice = createSlice({
    name: "transportOrderRegister",
    initialState,
    reducers: {
        clearTransportOrderRegisterError: (state) => {
            state.error = null;
        },

        clearTransportOrderRegisterData: (state) => {
            state.transportOrderRegisterData = [];
            state.pagination = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addTransportOrderRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                }

                state.error = null;
            })

            .addCase(addTransportOrderRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.transportOrderRegisterData =
                    action.payload?.records || [];
                state.pagination =
                    action.payload?.pagination || {};
            })

            .addCase(addTransportOrderRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch transport order register";
            });
    },
});

export const {
    clearTransportOrderRegisterError,
    clearTransportOrderRegisterData,
} = transportOrderRegisterSlice.actions;

export default transportOrderRegisterSlice.reducer;