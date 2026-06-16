import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

export const getHSNCode = createAsyncThunk(
    "hsncode/getHSNCode",
    async (
        {
            offset = 0,
            limit = 10,
            search = "",
            productType = "",
        }: any = {},
        { rejectWithValue }
    ) => {
        try {
            const params: any = { offset, limit };
            if (search?.trim()) { params.search = search.trim(); }
            if (productType) { params.productType = productType; }
            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/global/hsn/search",
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch products",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message || "Failed to fetch products",
            });
        }
    }
);

const HSNCodeSlice = createSlice({
    name: "HSNCode",
    initialState: {
        HSNCode: [],
        loading: false,
        error: null,
    },

    reducers: {

    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getHSNCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getHSNCode.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload?.records; // <-- { pagination, items }
                state.HSNCode = data ?? [];
            })
            .addCase(getHSNCode.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.HSNCode = [];
            });
    },
});

export const { } = HSNCodeSlice.actions;
export default HSNCodeSlice.reducer;