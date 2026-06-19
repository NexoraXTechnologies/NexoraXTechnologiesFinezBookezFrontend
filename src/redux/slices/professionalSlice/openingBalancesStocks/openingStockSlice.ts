import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

// get 
export const addOpeningStock = createAsyncThunk(
    "openingStock/addOpeningStock",
    async ({ payload }: any, { rejectWithValue }) => {
        try {

            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingStock/save`,
                { ...payload }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

export const updateOpeningStock = createAsyncThunk(
    "openingStock/updateOpeningStock",
    async ({ payload, openingStockVoucherNumber }: any, { rejectWithValue }) => {
        try {

            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingStock/update/${openingStockVoucherNumber}`,
                { ...payload }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

export const deleteOpeningStock = createAsyncThunk(
    "openingStock/deleteOpeningStock",
    async ({ openingStockVoucherNumber }: { openingStockVoucherNumber: string }, { rejectWithValue }) => {
        try {

            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingStock/delete/${openingStockVoucherNumber}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err:any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

export const getOpeningStockList = createAsyncThunk(
    "openingStock/getOpeningStockList",
    async ({ offset = 0, limit, status = "", search = "" }: any, { rejectWithValue }) => {
        try {
            const params = { offset, limit, status, search }
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingStock/getAll`,
                { params }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

// slice 
const openingStockSlice = createSlice({
    name: "opening Stock",
    initialState: {
        addLoader: false,
        listingLoader: false,
        deleteLoader: false,
        openingStock: [],
        error: null,
        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },
    },

    reducers: {

    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(addOpeningStock.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(addOpeningStock.fulfilled, (state) => {
                state.addLoader = false;

            })
            .addCase(addOpeningStock.rejected, (state) => {
                state.addLoader = false;
            })

            // Open Stock listing
            .addCase(getOpeningStockList.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getOpeningStockList.fulfilled, (state, action) => {
                state.listingLoader = false;
                state.pagination = action.payload.pagination ?? state.pagination;
                state.openingStock = action.payload?.records
            })
            .addCase(getOpeningStockList.rejected, (state) => {
                state.listingLoader = false;
            })

            // update stock
            .addCase(updateOpeningStock.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(updateOpeningStock.fulfilled, (state, action) => {
                state.addLoader = false;
                state.openingStock = action.payload?.records
            })
            .addCase(updateOpeningStock.rejected, (state) => {
                state.addLoader = false;
            })

            // delete bal
            .addCase(deleteOpeningStock.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteOpeningStock.fulfilled, (state, action) => {
                state.deleteLoader = false;
                state.openingStock = action.payload?.records
            })
            .addCase(deleteOpeningStock.rejected, (state) => {
                state.deleteLoader = false;
            })
    },
});

export const { } = openingStockSlice.actions;
export default openingStockSlice.reducer;