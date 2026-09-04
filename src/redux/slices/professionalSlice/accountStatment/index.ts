import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

// FILTER OPTIONS
export const getProfitLossFilterOptions = createAsyncThunk(
    "profitLoss/getProfitLossFilterOptions",
    async (payload: any = {}, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookEZ/reports/profitLoss/filterOptions",
                { params: payload }
            );

            return res.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch Profit & Loss filter options"
            });
        }
    }
);

// PROFIT LOSS ANALYSIS
export const getProfitLossAnalysis = createAsyncThunk(
    "profitLoss/getProfitLossAnalysis",
    async (payload: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/reports/profitLoss/analysis",
                payload,
                payload?.exportType ? { responseType: "blob" } : {}
            );

            if (payload?.exportType) return { blob: res.data, exportType: payload.exportType };

            return res.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch Profit & Loss analysis"
            });
        }
    }
);

// BALANCE SHEET ANALYSIS
export const getBalanceSheetAnalysis = createAsyncThunk(
    "profitLoss/getBalanceSheetAnalysis",
    async (payload: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/reports/balanceSheet/analysis",
                payload,
                payload?.exportType ? { responseType: "blob" } : {}
            );

            if (payload?.exportType) return { blob: res.data, exportType: payload.exportType };

            return res.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch Balance Sheet analysis"
            });
        }
    }
);

// SLICE
const profitLossSlice = createSlice({
    name: "profitLoss",

    initialState: {
        filterOptions: null,
        analysis: null,
        balanceSheet: null,

        filterOptionsLoading: false,
        analysisLoading: false,
        balanceSheetLoading: false,

        filterOptionsError: null,
        analysisError: null,
        balanceSheetError: null
    },

    reducers: {
        clearProfitLossState: (state) => {
            state.filterOptions = null;
            state.analysis = null;
            state.balanceSheet = null;

            state.filterOptionsLoading = false;
            state.analysisLoading = false;
            state.balanceSheetLoading = false;

            state.filterOptionsError = null;
            state.analysisError = null;
            state.balanceSheetError = null;
        },

        clearProfitLossAnalysis: (state) => {
            state.analysis = null;
            state.analysisError = null;
        },

        clearBalanceSheetAnalysis: (state) => {
            state.balanceSheet = null;
            state.balanceSheetError = null;
        }
    },

    extraReducers: (builder) => {
        // FILTER OPTIONS
        builder
            .addCase(getProfitLossFilterOptions.pending, (state: any) => {
                state.filterOptionsLoading = true;
                state.filterOptionsError = null;
            })
            .addCase(getProfitLossFilterOptions.fulfilled, (state: any, action: any) => {
                state.filterOptionsLoading = false;
                state.filterOptions = action.payload ?? null;
            })
            .addCase(getProfitLossFilterOptions.rejected, (state: any, action: any) => {
                state.filterOptionsLoading = false;
                state.filterOptionsError = action.payload?.message;
                state.filterOptions = null;
            });

        // PROFIT LOSS ANALYSIS
        builder
            .addCase(getProfitLossAnalysis.pending, (state: any) => {
                state.analysisLoading = true;
                state.analysisError = null;
            })
            .addCase(getProfitLossAnalysis.fulfilled, (state: any, action: any) => {
                state.analysisLoading = false;

                if (!action.payload?.exportType) {
                    state.analysis = action.payload ?? null;
                }
            })
            .addCase(getProfitLossAnalysis.rejected, (state: any, action: any) => {
                state.analysisLoading = false;
                state.analysisError = action.payload?.message;
            });

        // BALANCE SHEET ANALYSIS
        builder
            .addCase(getBalanceSheetAnalysis.pending, (state: any) => {
                state.balanceSheetLoading = true;
                state.balanceSheetError = null;
            })
            .addCase(getBalanceSheetAnalysis.fulfilled, (state: any, action: any) => {
                state.balanceSheetLoading = false;

                if (!action.payload?.exportType) {
                    state.balanceSheet = action.payload ?? null;
                }
            })
            .addCase(getBalanceSheetAnalysis.rejected, (state: any, action: any) => {
                state.balanceSheetLoading = false;
                state.balanceSheetError = action.payload?.message;
            });
    }
});

export const {
    clearProfitLossState,
    clearProfitLossAnalysis,
    clearBalanceSheetAnalysis
} = profitLossSlice.actions;

export default profitLossSlice.reducer;