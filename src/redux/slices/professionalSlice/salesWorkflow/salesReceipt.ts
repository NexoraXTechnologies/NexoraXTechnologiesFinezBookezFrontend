import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string;
};

type SalesReceiptParams = {
    offset?: number;
    limit?: number;
    status?: string;
    docStatus?: string;
    search?: string;
    isAutoPost?: string | boolean;
};

type SalesReceiptPayload = {
    payload: any;
};

type UpdateSalesReceiptPayload = {
    payload: any;
    receiptVoucherNumber: string;
};

type DeleteSalesReceiptPayload = {
    receiptVoucherNumber: string;
};

type SalesReceiptReferenceParams = {
    customerCode?: string;
    search?: string;
};

/* ===================================================
   ADD SALES RECEIPT
=================================================== */

export const addSalesReceipt = createAsyncThunk<
    any,
    SalesReceiptPayload,
    { rejectValue: RejectValue }
>(
    "salesReceipt/addSalesReceipt",
    async ({ payload }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/salesFlow/receipt/save",
                { ...payload }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to create sales receipt",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to create sales receipt",
            });
        }
    }
);

/* ===================================================
   UPDATE SALES RECEIPT
=================================================== */

export const updateSalesReceipt = createAsyncThunk<
    any,
    UpdateSalesReceiptPayload,
    { rejectValue: RejectValue }
>(
    "salesReceipt/updateSalesReceipt",
    async ({ payload, receiptVoucherNumber }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookEZ/salesFlow/receipt/update/${receiptVoucherNumber}`,
                { ...payload }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to update sales receipt",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to update sales receipt",
            });
        }
    }
);

/* ===================================================
   DELETE SALES RECEIPT
=================================================== */

export const deleteSalesReceipt = createAsyncThunk<
    string,
    DeleteSalesReceiptPayload,
    { rejectValue: RejectValue }
>(
    "salesReceipt/deleteSalesReceipt",
    async ({ receiptVoucherNumber }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookEZ/salesFlow/receipt/delete/${receiptVoucherNumber}`
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to delete sales receipt",
                });
            }

            return receiptVoucherNumber;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to delete sales receipt",
            });
        }
    }
);

/* ===================================================
   GET SALES RECEIPT LIST
=================================================== */

export const getSalesReceiptList = createAsyncThunk<
    any,
    SalesReceiptParams | undefined,
    { rejectValue: RejectValue }
>(
    "salesReceipt/getSalesReceiptList",
    async (
        {
            offset = 0,
            limit = 10,
            status = "",
            docStatus = "",
            search = "",
            isAutoPost = "",
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const params: any = {
                offset,
                limit,
            };

            if (status) {
                params.status = status;
            }

            if (docStatus) {
                params.docStatus = docStatus;
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            if (
                isAutoPost !== "" &&
                isAutoPost !== undefined &&
                isAutoPost !== null
            ) {
                params.isAutoPost = isAutoPost;
            }

            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookEZ/salesFlow/receipt/getAll",
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch sales receipts",
                });
            }

            return (
                res.data?.data ?? {
                    records: [],
                    pagination: null,
                }
            );
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to fetch sales receipts",
            });
        }
    }
);

/* ===================================================
   GET SALES RECEIPT REFERENCES
   Used for Add Reference modal
=================================================== */

export const getSalesReceiptReferences = createAsyncThunk<
    any,
    SalesReceiptReferenceParams | undefined,
    { rejectValue: RejectValue }
>(
    "salesReceipt/getSalesReceiptReferences",
    async ({ customerCode = "", search = "" } = {}, { rejectWithValue }) => {
        try {
            const params: any = {};

            if (customerCode) {
                params.customerCode = customerCode;
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookEZ/salesFlow/receipt/references",
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch sales receipt references",
                });
            }

            return res.data?.data ?? [];
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to fetch sales receipt references",
            });
        }
    }
);

/* ===================================================
   STATE TYPE
=================================================== */

type SalesReceiptState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    referenceLoader: boolean;

    salesReceipt: any[];
    receiptReferences: any[];

    selectedSalesReceipt: any;

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

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: SalesReceiptState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    referenceLoader: false,

    salesReceipt: [],
    receiptReferences: [],

    selectedSalesReceipt: null,

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
};

/* ===================================================
   SLICE
=================================================== */

const salesReceiptSlice = createSlice({
    name: "salesReceipt",

    initialState,

    reducers: {
        clearSalesReceiptState: (state) => {
            state.addLoader = false;
            state.listingLoader = false;
            state.deleteLoader = false;
            state.referenceLoader = false;

            state.salesReceipt = [];
            state.receiptReferences = [];
            state.selectedSalesReceipt = null;

            state.error = null;

            state.pagination = {
                offset: 0,
                limit: 10,
                totalDocs: 0,
                totalPages: 1,
                currentPage: 1,
                hasNextPage: false,
                hasPrevPage: false,
            };
        },

        clearSalesReceiptError: (state) => {
            state.error = null;
        },

        clearSalesReceiptReferences: (state) => {
            state.receiptReferences = [];
        },
    },

    extraReducers: (builder) => {
        builder

            /* ---------- ADD SALES RECEIPT ---------- */
            .addCase(addSalesReceipt.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(addSalesReceipt.fulfilled, (state) => {
                state.addLoader = false;
            })
            .addCase(addSalesReceipt.rejected, (state, action) => {
                state.addLoader = false;
                state.error =
                    action.payload?.message || "Failed to create sales receipt";
            })

            /* ---------- SALES RECEIPT LISTING ---------- */
            .addCase(getSalesReceiptList.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getSalesReceiptList.fulfilled, (state, action) => {
                state.listingLoader = false;

                const data: any = action.payload;

                state.salesReceipt = Array.isArray(data)
                    ? data
                    : data?.records ?? data?.docs ?? [];

                state.pagination =
                    data?.pagination ??
                    state.pagination;
            })
            .addCase(getSalesReceiptList.rejected, (state, action) => {
                state.listingLoader = false;
                state.error =
                    action.payload?.message || "Failed to fetch sales receipts";
                state.salesReceipt = [];
            })

            /* ---------- UPDATE SALES RECEIPT ---------- */
            .addCase(updateSalesReceipt.pending, (state) => {
                state.addLoader = true;
                state.error = null;
            })
            .addCase(updateSalesReceipt.fulfilled, (state) => {
                state.addLoader = false;
            })
            .addCase(updateSalesReceipt.rejected, (state, action) => {
                state.addLoader = false;
                state.error =
                    action.payload?.message || "Failed to update sales receipt";
            })

            /* ---------- DELETE SALES RECEIPT ---------- */
            .addCase(deleteSalesReceipt.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteSalesReceipt.fulfilled, (state, action) => {
                state.deleteLoader = false;

                state.salesReceipt = state.salesReceipt.filter(
                    (item: any) =>
                        item?.receiptVoucherNumber !== action.payload &&
                        item?.voucherNumber !== action.payload
                );

                if (
                    state.selectedSalesReceipt?.receiptVoucherNumber === action.payload ||
                    state.selectedSalesReceipt?.voucherNumber === action.payload
                ) {
                    state.selectedSalesReceipt = null;
                }

                state.pagination.totalDocs = Math.max(
                    0,
                    state.pagination.totalDocs - 1
                );
            })
            .addCase(deleteSalesReceipt.rejected, (state, action) => {
                state.deleteLoader = false;
                state.error =
                    action.payload?.message || "Failed to delete sales receipt";
            })

            /* ---------- SALES RECEIPT REFERENCES ---------- */
            .addCase(getSalesReceiptReferences.pending, (state) => {
                state.referenceLoader = true;
                state.error = null;
            })
            .addCase(getSalesReceiptReferences.fulfilled, (state, action) => {
                state.referenceLoader = false;

                const data: any = action.payload;

                state.receiptReferences = Array.isArray(data)
                    ? data
                    : data?.records ?? data?.docs ?? [];
            })
            .addCase(getSalesReceiptReferences.rejected, (state, action) => {
                state.referenceLoader = false;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch sales receipt references";
                state.receiptReferences = [];
            });
    },
});

export const {
    clearSalesReceiptState,
    clearSalesReceiptError,
    clearSalesReceiptReferences,
} = salesReceiptSlice.actions;

export default salesReceiptSlice.reducer;