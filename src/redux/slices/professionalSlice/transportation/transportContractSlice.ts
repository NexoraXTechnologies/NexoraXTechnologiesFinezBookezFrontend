
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";


type TransportContractState = {
    limit?: number;
    offset?: number;
    search?: string;
    tripStatus?: string;
    priority?: string;
}


/* ===================================================
    CREATE Transport Contract
=================================================== */

export const createTransportContract = createAsyncThunk(
    "transportContract/createTransportContract",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/save", { payload }
            );
            if (!response?.data?.success) {
                return rejectWithValue({
                    message: response?.data?.message || "Failed to create Transport Contract"
                })
            }
            return response?.data || null
        } catch (error: any) {
            return rejectWithValue({
                message: error?.data?.message || error?.message || "Failed to create Transport Contract"
            })
        }
    }
)

/* ===================================================
    GET ALL Transport Contract
=================================================== */

export const getAllTransportContract = createAsyncThunk(
    "transportContract/getAllTransportContract",
    async ({
        limit = 10,
        offset = 0,
        search = "",
        tripStatus = "",
        priority = ""
    }: TransportContractState = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/getAll", {
                params: {
                    limit,
                    offset,
                    search,
                    tripStatus,
                    priority
                }
            })

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get all Transport Contract",
            });
        }
    }
)


/* ===================================================
    GET Transport Contract  BY VOUCHER NUMBER
=================================================== */

export const getTransportContractByVoucherNumber = createAsyncThunk(
    "transportContract/getTransportContractByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/getByVoucherNumber/${voucherNumber}`)
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message || error?.message || "Failed to get Transport Contract"
            })
        }
    }
)



/* ===================================================
    DELETE Transport Contract Entry BY VOUCHER NUMBER
=================================================== */

export const deleteTransportContract = createAsyncThunk(
    "transportContract/deleteTransportContract",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/delete/${voucherNumber}`)
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || error?.message || "Failed to delete Transport Contract"
            })
        }
    }
)

/* ===================================================
    UPDATE Transport Contract BY VOUCHER NUMBER
=================================================== */

export const updateTransportContract = createAsyncThunk(
    "transportContract/updateTransportContract",
    async ({ voucherNumber, payload }: { voucherNumber: string, payload: any }, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/update/${voucherNumber}`, {
                payload
            })
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || error?.message || "Failed to Update Transport Contract"
            })
        }
    }
)

/* ===================================================
    SLICE
=================================================== */

const initialState: any = {
    transportContract: [],
    createLoader: false,
    updateLoader: false,
    deleteLoader: false,
    listingLoader: false,
    detailLoader: false,
    error: null
}


const transportContractSlice = createSlice({
    name: "transportContract",
    initialState,
    reducers: {
        clearTransportContractError: (state) => {
            state.error = null;
        },
        clearTransportContractState: (state) => {
            state.transportContract = [];
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
            //  create Transport Contract
            .addCase(createTransportContract.pending, (state) => {
                state.createLoader = true;
                state.error = null;
            })
            .addCase(createTransportContract.fulfilled, (state, action) => {
                state.createLoader = false;
                const createTripLR = action.payload?.data;
                if (createTripLR) {
                    state.transportContract.push(createTripLR)
                }
                state.error = null;
            })
            .addCase(createTransportContract.rejected, (state, action) => {
                state.createLoader = false;
                state.error = (action.payload as { message?: string })?.message || "Failed to create transport contract";
            })


            // get Transport Contract

            .addCase(getAllTransportContract.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getAllTransportContract.fulfilled, (state, action) => {
                state.listingLoader = false;
                state.transportContract = action.payload?.data || [];
                state.error = null;
            })
            .addCase(getAllTransportContract.rejected, (state, action) => {
                state.listingLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get transport contract";
            })


            // get Transport Contract  BY voucher number

            .addCase(getTransportContractByVoucherNumber.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
            })
            .addCase(getTransportContractByVoucherNumber.fulfilled, (state, action) => {
                state.detailLoader = false;
                state.transportContract = action.payload?.data || null;
                state.error = null;
            })
            .addCase(getTransportContractByVoucherNumber.rejected, (state, action) => {
                state.detailLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get transport contract";
            })


            // delete Transport Contract 

            .addCase(deleteTransportContract.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteTransportContract.fulfilled, (state, action) => {
                state.deleteLoader = false;
                const deletedTC = action.payload?.data;
                if (deletedTC) {
                    state.transportContract = state.transportContract.filter((t: any) => t.voucherNumber !== deletedTC.voucherNumber);
                }
                state.error = null;
            })
            .addCase(deleteTransportContract.rejected, (state, action) => {
                state.deleteLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to delete transport contract ";
            })


            // update Transport Contract

            .addCase(updateTransportContract.pending, (state) => {
                state.updateLoader = true;
                state.error = null;
            })
            .addCase(updateTransportContract.fulfilled, (state, action) => {
                state.updateLoader = false;
                const updatedTC = action.payload?.data;
                if (updatedTC) {
                    state.transportContract = state.transportContract.map((t: any) => t.voucherNumber === updatedTC.voucherNumber ? updatedTC : t);
                }
                state.error = null;
            })
            .addCase(updateTransportContract.rejected, (state, action) => {
                state.updateLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to update transport contract ";
            })


    }
})


export const {clearTransportContractError , clearTransportContractState}=transportContractSlice.actions;
export default transportContractSlice.reducer;