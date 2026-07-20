import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type vehicleMaintenanceRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    vehicleMaintenanceRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   CREATE / GET vehicle maintenance REGISTER
=================================================== */

export const addVehicleMaintenanceRegister = createAsyncThunk<
    any,
    any,
    { rejectValue: RejectValue }
>(
    "vehicleMaintenanceRegister/addVehicleMaintenanceRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/vehicleMaintenanceRegister",
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
                        "Failed to fetch vehicle maintenance register",
                });
            }

            return {
                records: res.data?.data?.maintenance || [],
                pagination: res.data?.data?.pagination || {},
            };
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch vehicle maintenance register",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: vehicleMaintenanceRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    vehicleMaintenanceRegisterData: [],
    pagination: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const vehicleMaintenanceRegisterSlice = createSlice({
    name: "vehicleMaintenanceRegister",
    initialState,
    reducers: {
        clearVehicleMaintenanceRegisterError: (state) => {
            state.error = null;
        },

        clearVehicleMaintenanceRegisterData: (state) => {
            state.vehicleMaintenanceRegisterData = [];
            state.pagination = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addVehicleMaintenanceRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                }

                state.error = null;
            })

            .addCase(addVehicleMaintenanceRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.vehicleMaintenanceRegisterData =
                    action.payload?.records || [];
                state.pagination =
                    action.payload?.pagination || {};
            })

            .addCase(addVehicleMaintenanceRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch vehicle maintenance register";
            });
    },
});

export const {
    clearVehicleMaintenanceRegisterError,
    clearVehicleMaintenanceRegisterData,
} = vehicleMaintenanceRegisterSlice.actions;

export default vehicleMaintenanceRegisterSlice.reducer;