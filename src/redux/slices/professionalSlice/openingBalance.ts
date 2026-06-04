import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// get 
export const addBalance = createAsyncThunk(
    "openingBalance/addBalance",
    async ({ payload }: any, { rejectWithValue }) => {
        try {

            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingBalance/save`,
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

export const updateBalance = createAsyncThunk(
    "openingBalance/updateBalance",
    async ({ payload, openingBalVoucherNumber }: any, { rejectWithValue }) => {
        try {

            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingBalance/update/${openingBalVoucherNumber}`,
                { ...payload }
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

export const deleteBalance = createAsyncThunk(
    "openingBalance/deleteBalance",
    async ({ openingBalVoucherNumber }: any, { rejectWithValue }) => {
        try {

            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingBalance/delete/${openingBalVoucherNumber}`
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

export const getOpeningBalList = createAsyncThunk(
    "openingBalance/getOpeningBalList",
    async ({ offset = 0, limit, status = "", search="" }: any, { rejectWithValue }) => {
        try {
            const params = { offset, limit, status, search }
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingBalance/getAll`,
                { params }
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

// slice 
const openingBalanceSlice = createSlice({
    name: "opening Balance",
    initialState: {
        addLoader: false,
        listingLoader: false,
        deleteLoader: false,
        openingBal: [],
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
            .addCase(addBalance.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(addBalance.fulfilled, (state) => {
                state.addLoader = false;
              
            })
            .addCase(addBalance.rejected, (state) => {
                state.addLoader = false;
            })

            // Open Balance listing
            .addCase(getOpeningBalList.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getOpeningBalList.fulfilled, (state, action) => {
                state.listingLoader = false;
                state.pagination = action.payload.pagination ?? state.pagination;
                state.openingBal = action.payload?.records
            })
            .addCase(getOpeningBalList.rejected, (state: any) => {
                state.listingLoader = false;
            })

            // update bal
            .addCase(updateBalance.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(updateBalance.fulfilled, (state, action) => {
                state.addLoader = false;
                state.openingBal = action.payload?.records
            })
            .addCase(updateBalance.rejected, (state) => {
                state.addLoader = false;
            })

            // delete bal
            .addCase(deleteBalance.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteBalance.fulfilled, (state, action) => {
                state.deleteLoader = false;
                state.openingBal = action.payload?.records
            })
            .addCase(deleteBalance.rejected, (state) => {
                state.deleteLoader = false;
            })
    },
});

export const { } = openingBalanceSlice.actions;
export default openingBalanceSlice.reducer;