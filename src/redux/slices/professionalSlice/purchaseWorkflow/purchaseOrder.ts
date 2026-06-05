import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

// get 
export const addPurchaseOrder = createAsyncThunk(
    "purchaseOrder/addPurchaseOrder",
    async ({ payload }: any, { rejectWithValue }) => {
        try {

            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseOrder/save`,
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

export const updatePurchaseOrder = createAsyncThunk(
    "purchaseOrder/updatePurchaseOrder",
    async ({ payload, openingStockVoucherNumber }: any, { rejectWithValue }) => {
        try {

            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseOrder/update/${openingStockVoucherNumber}`,
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
    "purchaseOrder/deleteOpeningStock",
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
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

export const getPurchaseOrderList = createAsyncThunk(
    "purchaseOrder/getPurchaseOrderList",
    async ({ offset = 0, limit, status = "", search = "" }: any, { rejectWithValue }) => {
        try {
            const params = { offset, limit, status, search }
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseOrder/getAll`,
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
const purchaseOrder = createSlice({
    name: "opening Stock",
    initialState: {
        addLoader: false,
        listingLoader: false,
        deleteLoader: false,
        purchaseOrderList: [],
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
            .addCase(addPurchaseOrder.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(addPurchaseOrder.fulfilled, (state) => {
                state.addLoader = false;

            })
            .addCase(addPurchaseOrder.rejected, (state) => {
                state.addLoader = false;
            })

            // Open Stock listing
            .addCase(getPurchaseOrderList.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getPurchaseOrderList.fulfilled, (state, action) => {
                state.listingLoader = false;
                state.pagination = action.payload.pagination ?? state.pagination;
                state.purchaseOrderList = action.payload?.records
            })
            .addCase(getPurchaseOrderList.rejected, (state) => {
                state.listingLoader = false;
            })

            // update stock
            .addCase(updatePurchaseOrder.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
                state.addLoader = false;
                state.purchaseOrderList = action.payload?.records
            })
            .addCase(updatePurchaseOrder.rejected, (state) => {
                state.addLoader = false;
            })

            // delete bal
            .addCase(deleteOpeningStock.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteOpeningStock.fulfilled, (state, action) => {
                state.deleteLoader = false;
                state.purchaseOrderList = action.payload?.records
            })
            .addCase(deleteOpeningStock.rejected, (state) => {
                state.deleteLoader = false;
            })
    },
});

export default purchaseOrder.reducer;