
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";


type VehicleMaintenanceState = {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    maintenanceType?: string;
    fields?: string;
}


/* ===================================================
    CREATE Vehicle Maintenance 
=================================================== */

export const createVehicleMaintenance = createAsyncThunk(
    "vehicleMaintenanceEntry/createVehicleMaintenance",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/save", { payload }
            );
            if (!response?.data?.success) {
                return rejectWithValue({
                    message: response?.data?.message || "Failed to create Vehicle Maintenance Entry"
                })
            }
            return response?.data || null
        } catch (error: any) {
            return rejectWithValue({
                message: error?.data?.message || error?.message || "Failed to create  Vehicle Maintenance Entry"
            })
        }
    }
)

/* ===================================================
    GET ALL Vehicle Maintenance entry
=================================================== */

export const getAllVehicleMaintenanceEntry = createAsyncThunk(
    "vehicleMaintenanceEntry/getAllVehicleMaintenanceEntry",
    async ({
        limit = 10,
        offset = 0,
        search = "",
        status = "",
        maintenanceType = "",
        fields=""

    }: VehicleMaintenanceState = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/getAll", {
                params: {
                    limit,
                    offset,
                    search,
                    status,
                    maintenanceType,
                    fields
                }
            })

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
)


/* ===================================================
    GET Vehicle Maintenance Entry  BY VOUCHER NUMBER
=================================================== */

export const getVehicleMaintenanceByVoucherNumber = createAsyncThunk(
    "vehicleMaintenanceEntry/getVehicleMaintenanceByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/getByVoucherNumber/${voucherNumber}`)
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message || error?.message || "Failed to get Vehicle Maintenance Entry"
            })
        }
    }
)



/* ===================================================
    DELETE Vehicle Maintenance Entry BY VOUCHER NUMBER
=================================================== */

export const deleteVehicleMaintenance = createAsyncThunk(
    "vehicleMaintenanceEntry/deleteVehicleMaintenance",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/delete/${voucherNumber}`)
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || error?.message || "Failed to delete Vehicle Maintenance Entry"
            })
        }
    }
)

/* ===================================================
    UPDATE Vehicle Maintenance Entry BY VOUCHER NUMBER
=================================================== */

export const updateVehicleMaintenance = createAsyncThunk(
    "vehicleMaintenanceEntry/updateVehicleMaintenance",
    async ({ voucherNumber, payload }: { voucherNumber: string, payload: any }, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookEZ/vehicleMaintenanceEntry/update/${voucherNumber}`, {
                payload
            })
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || error?.message || "Failed to Update Vehicle Maintenance entry"
            })
        }
    }
)

/* ===================================================
    SLICE
=================================================== */

const initialState: any = {
    vehicleMaintenance: [],
    createLoader: false,
    updateLoader: false,
    deleteLoader: false,
    listingLoader: false,
    detailLoader: false,
    error: null
}


const vehicleMaintenanceSlice = createSlice({
    name: "vehicleMaintenance",
    initialState,
    reducers: {
        clearVehicleMaintenanceError: (state) => {
            state.error = null;
        },
        clearVehicleMaintenanceState: (state) => {
            state.vehicleMaintenance = [];
            state.createLoader = false;
            state.updateLoader = false;
            state.deleteLoader = false;
            state.listingLoader = false;
            state.detailloader = false;
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            //  create Vehicle Maintenance
            .addCase(createVehicleMaintenance.pending, (state) => {
                state.createLoader = true;
                state.error = null;
            })
            .addCase(createVehicleMaintenance.fulfilled, (state, action) => {
                state.createLoader = false;
                const createVehicle = action.payload?.data;
                if (createVehicle) {
                    state.vehicleMaintenance.push(createVehicle)
                }
                state.error = null;
            })
            .addCase(createVehicleMaintenance.rejected, (state, action) => {
                state.createLoader = false;
                state.error = (action.payload as { message?: string })?.message || "Failed to create Vehicle Maintenance Entry";
            })


            // get Vehicle Maintenance

            .addCase(getAllVehicleMaintenanceEntry.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getAllVehicleMaintenanceEntry.fulfilled, (state, action) => {
                state.listingLoader = false;
                state.vehicleMaintenance = action.payload?.data || [];
                state.error = null;
            })
            .addCase(getAllVehicleMaintenanceEntry.rejected, (state, action) => {
                state.listingLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get Vehicle Maintenance Entry";
            })


            // get Vehicle Maintenance  BY voucher number

            .addCase(getVehicleMaintenanceByVoucherNumber.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
            })
            .addCase(getVehicleMaintenanceByVoucherNumber.fulfilled, (state, action) => {
                state.detailLoader = false;
                state.vehicleMaintenance = action.payload?.data || null;
                state.error = null;
            })
            .addCase(getVehicleMaintenanceByVoucherNumber.rejected, (state, action) => {
                state.detailLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get Vehicle MaintenanceR Entry";
            })


            // delete Vehicle Maintenance

            .addCase(deleteVehicleMaintenance.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteVehicleMaintenance.fulfilled, (state, action) => {
                state.deleteLoader = false;
                const deletedVM = action.payload?.data;
                if (deletedVM) {
                    state.vehicleMaintenance = state.vehicleMaintenance.filter((t: any) => t.voucherNumber !== deletedVM.voucherNumber);
                }
                state.error = null;
            })
            .addCase(deleteVehicleMaintenance.rejected, (state, action) => {
                state.deleteLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to delete Vehicle Maintenance Entry ";
            })


            // update Vehicle Maintenance
            .addCase(updateVehicleMaintenance.pending, (state) => {
                state.updateLoader = true;
                state.error = null;
            })
            .addCase(updateVehicleMaintenance.fulfilled, (state, action) => {
                state.updateLoader = false;
                const updatedVM = action.payload?.data;
                if (updatedVM) {
                    state.vehicleMaintenance = state.vehicleMaintenance.map((t: any) => t.voucherNumber === updatedVM.voucherNumber ? updatedVM : t);
                }
                state.error = null;
            })
            .addCase(updateVehicleMaintenance.rejected, (state, action) => {
                state.updateLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to update Vehicle Maintenance Entry ";
            })


    }
})


export const {clearVehicleMaintenanceError , clearVehicleMaintenanceState}=vehicleMaintenanceSlice.actions;
export default vehicleMaintenanceSlice.reducer;