import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string
}

type AccountParams = {
    offset?: number,
    limit?: number,
    accountCode?: string,
    fromDate?: string,
    toDate?: string
}

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
        }: AccountParams = {},

        { rejectWithValue }) => {
        try {
            const params: any = { offset, limit, accountCode, fromDate, toDate }

            const res = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/reporting/ledger/transactions", { params })
            if (!res.data?.success) {
                return rejectWithValue({
                    message: res?.data?.message || "failed to fetch data"
                })
            }
            return res?.data
        } catch (error) {
            return rejectWithValue({
                message: (error as Error).message || "Failed to get account ledger"
            })
        }
    }

)
// Slice 

const accountLedgerSlice = createSlice({
    name: "accountLedger",
    initialState: {
        addLoader: false,
        listingLoader: false,
        deleteLoader: false,

        accountLedger: [] as any[],
        error: null as string | null,
        pagination: {
            offset: 0,
            limit: 20,
            totalDocs: 6,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        }
    },
    reducers: {
        clearAccountLedgerState: (state) => {
            state.error = null;
            state.addLoader = false;
            state.listingLoader = false;
            state.deleteLoader = false;
        }
    },

    extraReducers: (builder) => {
        builder


            .addCase(getAccountLedger.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getAccountLedger.fulfilled, (state, action) => {
                state.listingLoader = false;
                state.pagination = action.payload?.pagination ?? state.pagination;
                state.accountLedger = action.payload?.records ?? [];
            })
            .addCase(getAccountLedger.rejected, (state, action) => {
                state.listingLoader = false;
                state.error = action.payload?.message || "failed to fetch account receivable";
                state.accountLedger = []
            })
    }
})



export const {clearAccountLedgerState}=accountLedgerSlice.actions;
export default accountLedgerSlice.reducer;