import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string;
};

type AccountParams = {
    offset?: number;
    limit?: number;
    accountCode?: string;
    fromDate?: string;
    toDate?: string;
    exportType?: "" | "pdf" | "excel";
};

type AccountLedgerState = {
    addLoader: boolean;
    listingLoader: boolean;
    exportLoader: boolean;
    deleteLoader: boolean;
    totals: any;
    accountLedger: any[];
    error: string | null;
    pagination: {
        offset: number;
        limit: number;
        totalDocs: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
};

export const getAccountLedger = createAsyncThunk<
    any,
    AccountParams | undefined,
    { rejectValue: RejectValue }
>(
    "accountLedger/getAccountLedger",
    async (
        {
            offset = 0,
            limit = 200,
            accountCode = "",
            fromDate = "",
            toDate = "",
            exportType = "",
        }: AccountParams = {},
        { rejectWithValue }
    ) => {
        try {
            const params: any = {
                offset,
                limit,
                accountCode,
                fromDate,
                toDate,
            };

            if (exportType) {
                params.exportType = exportType;
            }

            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/reporting/ledger/transactions",
                {
                    params,
                    responseType: exportType ? "blob" : "json",
                }
            );

            if (exportType) {
                return {
                    exportType,
                    blob: res.data,
                };
            }

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res?.data?.message || "Failed to fetch account ledger",
                });
            }

            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    error?.message ||
                    "Failed to get account ledger",
            });
        }
    }
);

const initialState: AccountLedgerState = {
    addLoader: false,
    listingLoader: false,
    exportLoader: false,
    deleteLoader: false,
    totals: {},
    accountLedger: [],
    error: null,
    pagination: {
        offset: 0,
        limit: 20,
        totalDocs: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },
};

const accountLedgerSlice = createSlice({
    name: "accountLedger",
    initialState,
    reducers: {
        clearAccountLedgerState: (state) => {
            state.error = null;
            state.addLoader = false;
            state.listingLoader = false;
            state.exportLoader = false;
            state.deleteLoader = false;
        },

        clearAccountLedgerData: (state) => {
            state.accountLedger = [];
            state.totals = {};
            state.pagination = initialState.pagination;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(getAccountLedger.pending, (state, action) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoader = true;
                } else {
                    state.listingLoader = true;
                }
            })

            .addCase(getAccountLedger.fulfilled, (state, action) => {
                if (action.payload?.exportType) {
                    state.exportLoader = false;
                    return;
                }

                state.listingLoader = false;
                state.exportLoader = false;

                const data = action.payload?.data || {};

                state.pagination = data?.pagination ?? state.pagination;
                state.accountLedger = data?.transactions ?? [];
                state.totals = data?.totals ?? {};
            })

            .addCase(getAccountLedger.rejected, (state, action) => {
                state.listingLoader = false;
                state.exportLoader = false;

                state.error =
                    action.payload?.message ||
                    "Failed to fetch account ledger";

                state.accountLedger = [];
                state.totals = {};
            });
    },
});

export const {
    clearAccountLedgerState,
    clearAccountLedgerData,
} = accountLedgerSlice.actions;

export default accountLedgerSlice.reducer;