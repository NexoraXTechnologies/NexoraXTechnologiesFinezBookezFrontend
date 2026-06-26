import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

export const savePosting = createAsyncThunk(
    "posting/savePosting",
    async (payload: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/autoPost/create`,
                { ...payload }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch product",
                });

            return res.data?.data?.product ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch product",
            });
        }
    }
);

const autoPostingSlice = createSlice({
    name: "savePosting",
    initialState: {
        posting: [],
        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },

        loading: false,
        error: null,

        createLoading: false,
        updateLoading: false,
        deleteLoading: false,
    },

    reducers: {
        clearProductMasterState: (state) => {
            state.error = null;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
        },
    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(savePosting.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(savePosting.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload; // <-- { pagination, items }
                state.pagination = data?.pagination ?? state.pagination;
            })
            .addCase(savePosting.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
            });
    },
});

export default autoPostingSlice.reducer;