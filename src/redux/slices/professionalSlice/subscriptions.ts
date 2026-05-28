import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// get 
export const getAllPlans = createAsyncThunk(
    "plans/getAllPlans",
    async ({ offset = 0, limit = 100, search = "", tagName=""} = {}, { rejectWithValue }) => {
        try {
            const params = { offset, limit };
            if (search.trim()) params.search = search.trim();

            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/plansAndSubScription/plans/getAll`,
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
const plansSlice = createSlice({
    name: "plans",
    initialState: {
        plans: [],
        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },

        selectedAccount: null,

        loading: false,
        error: null,

        createLoading: false,
        updateLoading: false,
        deleteLoading: false,
    },

    reducers: {
        clearAccountMasterState: (state) => {
            state.error = null;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
        },
    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getAllPlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllPlans.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload;
                state.plans = data.records ?? [];
                state.pagination = data.pagination ?? state.pagination;
            })
            .addCase(getAllPlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.plans = [];
            });
    },
});

export const { clearAccountMasterState } = plansSlice.actions;
export default plansSlice.reducer;