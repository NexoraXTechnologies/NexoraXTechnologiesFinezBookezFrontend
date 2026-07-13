import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type DriverSettlementState = {
    limit?: number;
    offset?: number;
    search?: string;
    tripStatus?: string;
    priority?: string;
};

/* ===================================================
    CREATE Driver Settlement
=================================================== */

export const createDriverSettlement = createAsyncThunk(
    "driverSettlement/createDriverSettlement",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/driverSettlement/save",
                payload
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message:
                        response?.data?.message || "Failed to create Driver Settlement",
                });
            }

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to create Driver Settlement",
            });
        }
    }
);

/* ===================================================
    GET ALL Driver Settlement
=================================================== */

export const getAllDriverSettlement = createAsyncThunk(
    "driverSettlement/getAllDriverSettlement",
    async (
        {
            limit = 10,
            offset = 0,
            search = "",
            tripStatus = "",
            priority = "",
        }: DriverSettlementState = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookEZ/driverSettlement/getAll",
                {
                    params: {
                        limit,
                        offset,
                        search,
                        tripStatus,
                        priority,
                    },
                }
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get all Driver Settlement",
            });
        }
    }
);

/* ===================================================
    GET Driver Settlement BY VOUCHER NUMBER
=================================================== */

export const getDriverSettlementByVoucherNumber = createAsyncThunk(
    "driverSettlement/getDriverSettlementByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookEZ/driverSettlement/getByVoucherNumber/${voucherNumber}`
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get Driver Settlement",
            });
        }
    }
);

/* ===================================================
    DELETE Driver Settlement Entry BY VOUCHER NUMBER
=================================================== */

export const deleteDriverSettlement = createAsyncThunk(
    "driverSettlement/deleteDriverSettlement",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookEZ/driverSettlement/delete/${voucherNumber}`
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to delete Driver Settlement",
            });
        }
    }
);

/* ===================================================
    UPDATE Driver Settlement BY VOUCHER NUMBER
=================================================== */

export const updateDriverSettlement = createAsyncThunk(
    "driverSettlement/updateDriverSettlement",
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
                `/eTaxSolnMongoApiBackend/users/bookEZ/driverSettlement/update/${voucherNumber}`,
                payload
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to Update Driver Settlement",
            });
        }
    }
);

/* ===================================================
    SLICE
=================================================== */

const initialState: any = {
    driverSettlement: [],
    selectedDriverSettlement: null,
    pagination: null,

    createLoader: false,
    updateLoader: false,
    deleteLoader: false,
    listingLoader: false,
    detailLoader: false,

    error: null,
};

const driverSettlementSlice = createSlice({
    name: "driverSettlement",
    initialState,
    reducers: {
        clearDriverSettlementError: (state) => {
            state.error = null;
        },

        clearSelectedDriverSettlement: (state) => {
            state.selectedDriverSettlement = null;
            state.detailLoader = false;
            state.error = null;
        },

        clearDriverSettlementState: (state) => {
            state.driverSettlement = [];
            state.selectedDriverSettlement = null;
            state.pagination = null;

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

            .addCase(createDriverSettlement.pending, (state) => {
                state.createLoader = true;
                state.error = null;
            })
            .addCase(createDriverSettlement.fulfilled, (state, action) => {
                state.createLoader = false;

                const createdTC = action.payload?.data;

                if (createdTC && Array.isArray(state.transportContract)) {
                    state.transportContract.unshift(createdTC);
                }

                state.error = null;
            })
            .addCase(createDriverSettlement.rejected, (state, action: any) => {
                state.createLoader = false;
                state.error =
                    action.payload?.message || "Failed to create driver settlement";
            })

            /* ===================================================
               GET ALL
            =================================================== */

            .addCase(getAllDriverSettlement.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getAllDriverSettlement.fulfilled, (state, action) => {
                state.listingLoader = false;

                const records = action.payload?.data?.records || [];

                state.driverSettlement = Array.isArray(records) ? records : [];
                state.pagination = action.payload?.data?.pagination || null;
                state.error = null;
            })
            .addCase(getAllDriverSettlement.rejected, (state, action: any) => {
                state.listingLoader = false;
                state.transportContract = [];
                state.pagination = null;
                state.error =
                    action.payload?.message || "Failed to get driver settlement";
            })

            /* ===================================================
               GET BY VOUCHER NUMBER
            =================================================== */

            .addCase(getDriverSettlementByVoucherNumber.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
            })
            .addCase(getDriverSettlementByVoucherNumber.fulfilled, (state, action) => {
                state.detailLoader = false;

                // ✅ Do not overwrite transportContract array here
                state.selectedTransportContract = action.payload?.data || null;

                state.error = null;
            })
            .addCase(getDriverSettlementByVoucherNumber.rejected, (state, action: any) => {
                state.detailLoader = false;
                state.selectedTransportContract = null;
                state.error =
                    action.payload?.message || "Failed to get driver settlement";
            })

            /* ===================================================
               DELETE
            =================================================== */

            .addCase(deleteDriverSettlement.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteDriverSettlement.fulfilled, (state, action) => {
                state.deleteLoader = false;

                const deletedTC = action.payload?.data;
                const deletedContractNumber =
                    deletedTC?.contractNumber || deletedTC?.voucherNumber;

                if (deletedContractNumber && Array.isArray(state.transportContract)) {
                    state.transportContract = state.transportContract.filter(
                        (t: any) =>
                            t?.contractNumber !== deletedContractNumber &&
                            t?.voucherNumber !== deletedContractNumber
                    );
                }

                state.error = null;
            })
            .addCase(deleteDriverSettlement.rejected, (state, action: any) => {
                state.deleteLoader = false;
                state.error =
                    action.payload?.message || "Failed to delete driver settlement";
            })

            /* ===================================================
               UPDATE
            =================================================== */

            .addCase(updateDriverSettlement.pending, (state) => {
                state.updateLoader = true;
                state.error = null;
            })
            .addCase(updateDriverSettlement.fulfilled, (state, action) => {
                state.updateLoader = false;

                const updatedTC = action.payload?.data;
                const updatedContractNumber =
                    updatedTC?.contractNumber || updatedTC?.voucherNumber;

                state.selectedTransportContract = updatedTC || null;

                if (
                    updatedTC &&
                    updatedContractNumber &&
                    Array.isArray(state.transportContract)
                ) {
                    state.transportContract = state.transportContract.map((t: any) => {
                        const currentContractNumber =
                            t?.contractNumber || t?.voucherNumber;

                        return currentContractNumber === updatedContractNumber
                            ? updatedTC
                            : t;
                    });
                }

                state.error = null;
            })
            .addCase(updateDriverSettlement.rejected, (state, action: any) => {
                state.updateLoader = false;
                state.error =
                    action.payload?.message || "Failed to update driver settlement";
            });
    },
});

export const {
    clearDriverSettlementError,
    clearDriverSettlementState,
    clearSelectedDriverSettlement,
} = driverSettlementSlice.actions;

export default driverSettlementSlice.reducer;