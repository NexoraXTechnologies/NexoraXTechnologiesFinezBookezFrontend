import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

const BASE_URL = "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/multiPurchaseInvoice";

const defaultPagination = {
    offset: 0,
    limit: 200,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const getErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const getResponseSource = (response: any) => response?.data?.data ?? response?.data ?? response ?? {};

const getRecords = (response: any) => {
    const source = getResponseSource(response);

    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.items)) return source.items;
    if (Array.isArray(source?.records)) return source.records;
    if (Array.isArray(source?.docs)) return source.docs;
    if (Array.isArray(source?.multiPurchaseInvoices)) return source.multiPurchaseInvoices;
    if (Array.isArray(source?.purchaseInvoices)) return source.purchaseInvoices;
    if (Array.isArray(source?.data)) return source.data;

    return [];
};

const getSingleRecord = (response: any) => {
    const source = getResponseSource(response);

    if (Array.isArray(source)) return source[0] || null;

    return source?.item || source?.record || source?.multiPurchaseInvoice || source?.data || source || null;
};

const getPagination = (response: any, records: any[]) => {
    const source = getResponseSource(response);

    const pagination =
        source?.pagination ||
        response?.data?.pagination ||
        response?.pagination;

    if (pagination) {
        return {
            ...defaultPagination,
            ...pagination,
        };
    }

    return {
        ...defaultPagination,
        totalDocs: records.length,
        totalPages: records.length ? 1 : 0,
        currentPage: records.length ? 1 : 0,
        hasNextPage: false,
        hasPrevPage: false,
    };
};

// SAVE MULTI PURCHASE INVOICE
export const createMultiPurchaseInvoice = createAsyncThunk(
    "multiPurchaseInvoice/create",
    async ({ payload }: { payload: any }, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(`${BASE_URL}/save`, payload);
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to create Multi Purchase Invoice"));
        }
    }
);

// GET ALL MULTI PURCHASE INVOICES
export const getAllMultiPurchaseInvoice = createAsyncThunk(
    "multiPurchaseInvoice/getAll",
    async (
        {
            status = "",
            vendorCode = "",
            limit = 200,
            offset = 0,
        }: {
            status?: string;
            vendorCode?: string;
            limit?: number;
            offset?: number;
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get(`${BASE_URL}/getAll`, {
                params: {
                    status,
                    vendorCode,
                    limit,
                    offset,
                },
            });

            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to fetch Multi Purchase Invoices"));
        }
    }
);

// GET MULTI PURCHASE INVOICE BY VOUCHER NUMBER
export const getMultiPurchaseInvoiceByVoucherNumber = createAsyncThunk(
    "multiPurchaseInvoice/getByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(
                `${BASE_URL}/getByVoucherNumber/${encodeURIComponent(voucherNumber)}`
            );

            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to fetch Multi Purchase Invoice"));
        }
    }
);

// UPDATE MULTI PURCHASE INVOICE
export const updateMultiPurchaseInvoice = createAsyncThunk(
    "multiPurchaseInvoice/update",
    async (
        {
            pMultiInvVoucherNumber,
            payload,
        }: {
            pMultiInvVoucherNumber: string;
            payload: any;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.put(
                `${BASE_URL}/update/${encodeURIComponent(pMultiInvVoucherNumber)}`,
                payload
            );

            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to update Multi Purchase Invoice"));
        }
    }
);

// DELETE MULTI PURCHASE INVOICE
export const deleteMultiPurchaseInvoice = createAsyncThunk(
    "multiPurchaseInvoice/delete",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(
                `${BASE_URL}/delete/${encodeURIComponent(voucherNumber)}`
            );

            return {
                response: response.data,
                voucherNumber,
            };
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to delete Multi Purchase Invoice"));
        }
    }
);

const initialState: any = {
    multiPurchaseInvoices: [],
    selectedMultiPurchaseInvoice: null,
    pagination: defaultPagination,

    loading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
    detailLoading: false,

    error: null,
};

const multiPurchaseInvoiceSlice = createSlice({
    name: "multiPurchaseInvoice",

    initialState,

    reducers: {
        clearSelectedMultiPurchaseInvoice: (state) => {
            state.selectedMultiPurchaseInvoice = null;
        },

        clearMultiPurchaseInvoiceError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            // GET ALL
            .addCase(getAllMultiPurchaseInvoice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllMultiPurchaseInvoice.fulfilled, (state, action) => {
                state.loading = false;

                const records = getRecords(action.payload);

                state.multiPurchaseInvoices = records;
                state.pagination = getPagination(action.payload, records);
            })
            .addCase(getAllMultiPurchaseInvoice.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch Multi Purchase Invoices";
            })

            // CREATE
            .addCase(createMultiPurchaseInvoice.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createMultiPurchaseInvoice.fulfilled, (state) => {
                state.createLoading = false;
            })
            .addCase(createMultiPurchaseInvoice.rejected, (state, action: any) => {
                state.createLoading = false;
                state.error = action.payload || "Failed to create Multi Purchase Invoice";
            })

            // GET BY VOUCHER NUMBER
            .addCase(getMultiPurchaseInvoiceByVoucherNumber.pending, (state) => {
                state.detailLoading = true;
                state.error = null;
            })
            .addCase(getMultiPurchaseInvoiceByVoucherNumber.fulfilled, (state, action) => {
                state.detailLoading = false;
                state.selectedMultiPurchaseInvoice = getSingleRecord(action.payload);
            })
            .addCase(getMultiPurchaseInvoiceByVoucherNumber.rejected, (state, action: any) => {
                state.detailLoading = false;
                state.selectedMultiPurchaseInvoice = null;
                state.error = action.payload || "Failed to fetch Multi Purchase Invoice";
            })

            // UPDATE
            .addCase(updateMultiPurchaseInvoice.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateMultiPurchaseInvoice.fulfilled, (state, action) => {
                state.updateLoading = false;

                const updatedRecord = getSingleRecord(action.payload);

                if (updatedRecord?.pMultiInvVoucherNumber) {
                    const index = state.multiPurchaseInvoices.findIndex(
                        (item: any) =>
                            String(item?.pMultiInvVoucherNumber) ===
                            String(updatedRecord.pMultiInvVoucherNumber)
                    );

                    if (index !== -1) {
                        state.multiPurchaseInvoices[index] = updatedRecord;
                    }

                    state.selectedMultiPurchaseInvoice = updatedRecord;
                }
            })
            .addCase(updateMultiPurchaseInvoice.rejected, (state, action: any) => {
                state.updateLoading = false;
                state.error = action.payload || "Failed to update Multi Purchase Invoice";
            })

            // DELETE
            .addCase(deleteMultiPurchaseInvoice.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(deleteMultiPurchaseInvoice.fulfilled, (state, action) => {
                state.deleteLoading = false;

                state.multiPurchaseInvoices = state.multiPurchaseInvoices.filter(
                    (item: any) =>
                        String(item?.pMultiInvVoucherNumber) !==
                        String(action.payload.voucherNumber)
                );

                if (
                    String(
                        state.selectedMultiPurchaseInvoice
                            ?.pMultiInvVoucherNumber || ""
                    ) === String(action.payload.voucherNumber)
                ) {
                    state.selectedMultiPurchaseInvoice = null;
                }

                state.pagination = {
                    ...state.pagination,
                    totalDocs: Math.max(
                        Number(state.pagination?.totalDocs || 0) - 1,
                        0
                    ),
                };
            })
            .addCase(deleteMultiPurchaseInvoice.rejected, (state, action: any) => {
                state.deleteLoading = false;
                state.error = action.payload || "Failed to delete Multi Purchase Invoice";
            });
    },
});

export const {
    clearSelectedMultiPurchaseInvoice,
    clearMultiPurchaseInvoiceError,
} = multiPurchaseInvoiceSlice.actions;

export default multiPurchaseInvoiceSlice.reducer;