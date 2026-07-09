import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type VehicleMaintenanceState = {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    maintenanceType?: string;
    fields?: string;
};

/* ===================================================
   HELPERS
=================================================== */

const getApiRecords = (payload: any) => {
    const data = payload?.data || payload || {};

    const records =
        data?.records ||
        data?.data?.records ||
        data?.items ||
        data?.data?.items ||
        [];

    return Array.isArray(records) ? records : [];
};

const getApiPagination = (payload: any) => {
    const data = payload?.data || payload || {};

    return data?.pagination || data?.data?.pagination || {};
};

const getApiRecord = (payload: any) => {
    const data = payload?.data || payload || {};

    if (Array.isArray(data)) return data[0] || null;
    if (Array.isArray(data?.records)) return data.records[0] || null;
    if (Array.isArray(data?.data?.records)) return data.data.records[0] || null;

    return data?.record || data?.data?.record || data?.data || data || null;
};

const getVoucherNumber = (record: any) =>
    record?.voucherNumber ||
    record?.vehicleMaintenanceVoucherNumber ||
    record?.maintenanceVoucherNumber ||
    record?.maintenanceNumber ||
    record?.vehicleMaintenanceNumber ||
    "";

/* ===================================================
   CREATE VEHICLE MAINTENANCE
=================================================== */

export const createVehicleMaintenance = createAsyncThunk(
    "vehicleMaintenanceEntry/createVehicleMaintenance",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/save",
                payload
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message:
                        response?.data?.message ||
                        "Failed to create Vehicle Maintenance Entry",
                });
            }

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.data?.message ||
                    error?.message ||
                    "Failed to create Vehicle Maintenance Entry",
            });
        }
    }
);

/* ===================================================
   GET ALL VEHICLE MAINTENANCE ENTRY
=================================================== */

export const getAllVehicleMaintenanceEntry = createAsyncThunk(
    "vehicleMaintenanceEntry/getAllVehicleMaintenanceEntry",
    async (
        {
            limit = 10,
            offset = 0,
            search = "",
            status = "",
            maintenanceType = "",
            fields = "",
        }: VehicleMaintenanceState = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/getAll",
                {
                    params: {
                        limit,
                        offset,
                        search,
                        status,
                        maintenanceType,
                        fields,
                    },
                }
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get all Vehicle Maintenance Entry",
            });
        }
    }
);

/* ===================================================
   GET VEHICLE MAINTENANCE ENTRY BY VOUCHER NUMBER
=================================================== */

export const getVehicleMaintenanceByVoucherNumber = createAsyncThunk(
    "vehicleMaintenanceEntry/getVehicleMaintenanceByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/getByVoucherNumber/${voucherNumber}`
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get Vehicle Maintenance Entry",
            });
        }
    }
);

/* ===================================================
   DELETE VEHICLE MAINTENANCE ENTRY BY VOUCHER NUMBER
=================================================== */

export const deleteVehicleMaintenance = createAsyncThunk(
    "vehicleMaintenanceEntry/deleteVehicleMaintenance",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/delete/${voucherNumber}`
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to delete Vehicle Maintenance Entry",
            });
        }
    }
);

/* ===================================================
   UPDATE VEHICLE MAINTENANCE ENTRY BY VOUCHER NUMBER
=================================================== */

export const updateVehicleMaintenance = createAsyncThunk(
    "vehicleMaintenanceEntry/updateVehicleMaintenance",
    async (
        {
            voucherNumber,
            payload,
        }: {
            voucherNumber: string;
            payload: any;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/update/${voucherNumber}`,
                payload
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to Update Vehicle Maintenance entry",
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const initialState: any = {
    vehicleMaintenance: [],
    selectedVehicleMaintenance: null,
    pagination: {},

    createLoader: false,
    updateLoader: false,
    deleteLoader: false,
    listingLoader: false,
    detailLoader: false,

    error: null,
};

const vehicleMaintenanceSlice = createSlice({
    name: "vehicleMaintenance",
    initialState,
    reducers: {
        clearVehicleMaintenanceError: (state) => {
            state.error = null;
        },

        clearVehicleMaintenanceState: (state) => {
            state.vehicleMaintenance = [];
            state.selectedVehicleMaintenance = null;
            state.pagination = {};

            state.createLoader = false;
            state.updateLoader = false;
            state.deleteLoader = false;
            state.listingLoader = false;
            state.detailLoader = false;

            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            /* ===================================================
               CREATE
            =================================================== */

            .addCase(createVehicleMaintenance.pending, (state) => {
                state.createLoader = true;
                state.error = null;
            })

            .addCase(createVehicleMaintenance.fulfilled, (state, action) => {
                state.createLoader = false;

                const createdVM = getApiRecord(action.payload);

                if (!Array.isArray(state.vehicleMaintenance)) {
                    state.vehicleMaintenance = [];
                }

                if (createdVM) {
                    state.vehicleMaintenance.unshift(createdVM);
                    state.selectedVehicleMaintenance = createdVM;
                }

                state.error = null;
            })

            .addCase(createVehicleMaintenance.rejected, (state, action) => {
                state.createLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to create Vehicle Maintenance Entry";
            })

            /* ===================================================
               GET ALL
            =================================================== */

            .addCase(getAllVehicleMaintenanceEntry.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })

            .addCase(getAllVehicleMaintenanceEntry.fulfilled, (state, action) => {
                state.listingLoader = false;

                state.vehicleMaintenance = getApiRecords(action.payload);
                state.pagination = getApiPagination(action.payload);

                state.error = null;
            })

            .addCase(getAllVehicleMaintenanceEntry.rejected, (state, action) => {
                state.listingLoader = false;
                state.vehicleMaintenance = [];
                state.pagination = {};

                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get Vehicle Maintenance Entry";
            })

            /* ===================================================
               GET BY VOUCHER
            =================================================== */

            .addCase(getVehicleMaintenanceByVoucherNumber.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
            })

            .addCase(
                getVehicleMaintenanceByVoucherNumber.fulfilled,
                (state, action) => {
                    state.detailLoader = false;

                    // IMPORTANT:
                    // Do not overwrite vehicleMaintenance list here.
                    // Store detail data separately.
                    state.selectedVehicleMaintenance = getApiRecord(action.payload);

                    state.error = null;
                }
            )

            .addCase(
                getVehicleMaintenanceByVoucherNumber.rejected,
                (state, action) => {
                    state.detailLoader = false;
                    state.selectedVehicleMaintenance = null;

                    state.error =
                        (action.payload as { message?: string })?.message ||
                        "Failed to get Vehicle Maintenance Entry";
                }
            )

            /* ===================================================
               DELETE
            =================================================== */

            .addCase(deleteVehicleMaintenance.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })

            .addCase(deleteVehicleMaintenance.fulfilled, (state, action) => {
                state.deleteLoader = false;

                const deletedVM = getApiRecord(action.payload);
                const deletedVoucher = getVoucherNumber(deletedVM);

                if (!Array.isArray(state.vehicleMaintenance)) {
                    state.vehicleMaintenance = [];
                }

                if (deletedVoucher) {
                    state.vehicleMaintenance = state.vehicleMaintenance.filter(
                        (item: any) => getVoucherNumber(item) !== deletedVoucher
                    );
                }

                if (
                    deletedVoucher &&
                    getVoucherNumber(state.selectedVehicleMaintenance) ===
                        deletedVoucher
                ) {
                    state.selectedVehicleMaintenance = null;
                }

                state.error = null;
            })

            .addCase(deleteVehicleMaintenance.rejected, (state, action) => {
                state.deleteLoader = false;

                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to delete Vehicle Maintenance Entry";
            })

            /* ===================================================
               UPDATE
            =================================================== */

            .addCase(updateVehicleMaintenance.pending, (state) => {
                state.updateLoader = true;
                state.error = null;
            })

            .addCase(updateVehicleMaintenance.fulfilled, (state, action) => {
                state.updateLoader = false;

                const updatedVM = getApiRecord(action.payload);
                const updatedVoucher = getVoucherNumber(updatedVM);

                if (!Array.isArray(state.vehicleMaintenance)) {
                    state.vehicleMaintenance = [];
                }

                if (updatedVM && updatedVoucher) {
                    const exists = state.vehicleMaintenance.some(
                        (item: any) => getVoucherNumber(item) === updatedVoucher
                    );

                    if (exists) {
                        state.vehicleMaintenance = state.vehicleMaintenance.map(
                            (item: any) =>
                                getVoucherNumber(item) === updatedVoucher
                                    ? updatedVM
                                    : item
                        );
                    } else {
                        state.vehicleMaintenance.unshift(updatedVM);
                    }

                    state.selectedVehicleMaintenance = updatedVM;
                }

                state.error = null;
            })

            .addCase(updateVehicleMaintenance.rejected, (state, action) => {
                state.updateLoader = false;

                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to update Vehicle Maintenance Entry";
            });
    },
});

export const {
    clearVehicleMaintenanceError,
    clearVehicleMaintenanceState,
} = vehicleMaintenanceSlice.actions;

export default vehicleMaintenanceSlice.reducer;