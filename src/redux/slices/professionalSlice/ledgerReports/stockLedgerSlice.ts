import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string;
};

type ExportType = "" | "pdf" | "excel";

type StockLedgerPayload = {
    fromDate?: string;
    toDate?: string;
    productCode?: string;
    exportType?: ExportType;
};

type StockLedgerState = {
    listingLoader: boolean;
    exportLoader: boolean;
    stockLedgerData: any;
    error: string | null;
};

/* ===================================================
   CREATE / GET STOCK LEDGER
=================================================== */

export const createStockLedger = createAsyncThunk<
    any,
    StockLedgerPayload | undefined,
    { rejectValue: RejectValue }
>(
    "stockLedger/createStockLedger",
    async (
        {
            fromDate = "",
            toDate = "",
            productCode = "",
            exportType = "",
        }: StockLedgerPayload = {},
        { rejectWithValue }
    ) => {
        try {
            const payload: any = {
                productCode,
                fromDate,
                toDate,
            };

            if (exportType) {
                payload.exportType = exportType;
            }

            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/inventoryBalance/details/getProductBalance",
                payload,
                {
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
                    message:
                        res?.data?.message ||
                        "Failed to fetch stock ledger",
                });
            }

            return res?.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    error?.message ||
                    "Failed to fetch stock ledger",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: StockLedgerState = {
    listingLoader: false,
    exportLoader: false,
    stockLedgerData: null,
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const stockLedgerSlice = createSlice({
    name: "stockLedger",
    initialState,
    reducers: {
        clearStockLedgerError: (state) => {
            state.error = null;
        },

        clearStockLedgerData: (state) => {
            state.stockLedgerData = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createStockLedger.pending, (state, action) => {
                state.error = null;

                if (action.meta.arg?.exportType) {
                    state.exportLoader = true;
                } else {
                    state.listingLoader = true;
                }
            })

            .addCase(createStockLedger.fulfilled, (state, action) => {
                if (action.payload?.exportType) {
                    state.exportLoader = false;
                    return;
                }

                state.listingLoader = false;
                state.exportLoader = false;
                state.stockLedgerData = action.payload;
                state.error = null;
            })

            .addCase(createStockLedger.rejected, (state, action) => {
                state.listingLoader = false;
                state.exportLoader = false;
                state.stockLedgerData = null;

                state.error =
                    action.payload?.message ||
                    "Failed to fetch stock ledger";
            });
    },
});

export const {
    clearStockLedgerError,
    clearStockLedgerData,
} = stockLedgerSlice.actions;

export default stockLedgerSlice.reducer;