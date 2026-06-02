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
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

export const getOpeningBalList = createAsyncThunk(
    "openingBalance/getOpeningBalList",
    async ({ offset = 0, limit, status = "" }: any, { rejectWithValue }) => {
        try {
            const params = { offset, limit, status }
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/openingBalance/getAll`,
                { params }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

// slice 
const openingBalanceSlice = createSlice({
    name: "plans",
    initialState: {
        addLoader: false,
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
            .addCase(addBalance.fulfilled, (state, action) => {
                state.addLoader = false;
            })
            .addCase(addBalance.rejected, (state, action) => {
                state.addLoader = false;
            })
            // Open Balance listing
            .addCase(getOpeningBalList.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(getOpeningBalList.fulfilled, (state, action) => {
                state.addLoader = false;
                state.openingBal = action.payload?.records
            })
            .addCase(getOpeningBalList.rejected, (state, action) => {
                state.addLoader = false;
            });
    },
});

export const { } = openingBalanceSlice.actions;
export default openingBalanceSlice.reducer;