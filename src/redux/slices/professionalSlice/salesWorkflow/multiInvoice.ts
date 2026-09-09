import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

const BASE_URL = "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/multiSalesInvoice";

const defaultPagination = { offset: 0, limit: 10, totalDocs: 0, totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };

const getErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const getResponseSource = (response: any) => response?.data?.data ?? response?.data ?? response ?? {};

const getRecords = (response: any) => {
    const source = getResponseSource(response);
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.items)) return source.items;
    if (Array.isArray(source?.records)) return source.records;
    if (Array.isArray(source?.docs)) return source.docs;
    if (Array.isArray(source?.multiSalesInvoices)) return source.multiSalesInvoices;
    if (Array.isArray(source?.salesInvoices)) return source.salesInvoices;
    if (Array.isArray(source?.data)) return source.data;
    return [];
};

const getSingleRecord = (response: any) => {
    const source = getResponseSource(response);
    if (Array.isArray(source)) return source[0] || null;
    return source?.item || source?.record || source?.multiSalesInvoice || source?.data || source || null;
};

const getPagination = (response: any, records: any[]) => {
    const source = getResponseSource(response);
    const pagination = source?.pagination || response?.data?.pagination || response?.pagination;

    if (pagination) return { ...defaultPagination, ...pagination };

    return {
        ...defaultPagination,
        totalDocs: records.length,
        totalPages: records.length ? 1 : 0,
        currentPage: records.length ? 1 : 0,
    };
};

// SAVE MULTI SALES INVOICE
export const createMultiSalesInvoice = createAsyncThunk(
    "multiSalesInvoice/create",
    async ({ payload }: { payload: any }, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(`${BASE_URL}/save`, payload);
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to create Multi Sales Invoice"));
        }
    }
);

// GET ALL MULTI SALES INVOICES
export const getAllMultiSalesInvoice = createAsyncThunk(
    "multiSalesInvoice/getAll",
    async ({ status = "", customerCode = "", search = "" }: { status?: string; customerCode?: string; search?: string } = {}, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`${BASE_URL}/getAll`, { params: { status, customerCode, search } });
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to fetch Multi Sales Invoices"));
        }
    }
);

// GET MULTI SALES INVOICE BY VOUCHER NUMBER
export const getMultiSalesInvoiceByVoucherNumber = createAsyncThunk(
    "multiSalesInvoice/getByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`${BASE_URL}/getByVoucherNumber/${encodeURIComponent(voucherNumber)}`);
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to fetch Multi Sales Invoice"));
        }
    }
);

// UPDATE MULTI SALES INVOICE
export const updateMultiSalesInvoice = createAsyncThunk(
    "multiSalesInvoice/update",
    async ({ sMultiInvVoucherNumber, payload }: { sMultiInvVoucherNumber: string; payload: any }, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.put(`${BASE_URL}/update/${encodeURIComponent(sMultiInvVoucherNumber)}`, payload);
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to update Multi Sales Invoice"));
        }
    }
);

// DELETE MULTI SALES INVOICE
export const deleteMultiSalesInvoice = createAsyncThunk(
    "multiSalesInvoice/delete",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(`${BASE_URL}/delete/${encodeURIComponent(voucherNumber)}`);
            return { response: response.data, voucherNumber };
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to delete Multi Sales Invoice"));
        }
    }
);

// GET SALES INVOICES BY CUSTOMER CODE
export const getSalesInvoicesByCustomerCode = createAsyncThunk(
    "multiSalesInvoice/getSalesInvoicesByCustomerCode",
    async (customerCode: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesOrder/getAllByCustomerCode", { params: { customerCode } });
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to fetch Sales Invoices for customer"));
        }
    }
);

const initialState: any = {
    multiSalesInvoices: [],
    selectedMultiSalesInvoice: null,
    customerSalesInvoices: [],
    pagination: defaultPagination,
    loading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
    detailLoading: false,
    customerInvoicesLoading: false,
    error: null,
};

const multiSalesInvoiceSlice = createSlice({
    name: "multiSalesInvoice",
    initialState,
    reducers: {
        clearSelectedMultiSalesInvoice: (state) => {
            state.selectedMultiSalesInvoice = null;
        },
        clearCustomerSalesInvoices: (state) => {
            state.customerSalesInvoices = [];
        },
        clearMultiSalesInvoiceError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // GET ALL
            .addCase(getAllMultiSalesInvoice.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllMultiSalesInvoice.fulfilled, (state, action) => {
                state.loading = false;
                const records = getRecords(action.payload);
                state.multiSalesInvoices = records;
                state.pagination = getPagination(action.payload, records);
            })
            .addCase(getAllMultiSalesInvoice.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload || "Failed to fetch Multi Sales Invoices";
            })

            // CREATE
            .addCase(createMultiSalesInvoice.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createMultiSalesInvoice.fulfilled, (state) => {
                state.createLoading = false;
            })
            .addCase(createMultiSalesInvoice.rejected, (state, action: any) => {
                state.createLoading = false;
                state.error = action.payload || "Failed to create Multi Sales Invoice";
            })

            // GET BY VOUCHER NUMBER
            .addCase(getMultiSalesInvoiceByVoucherNumber.pending, (state) => {
                state.detailLoading = true;
                state.error = null;
            })
            .addCase(getMultiSalesInvoiceByVoucherNumber.fulfilled, (state, action) => {
                state.detailLoading = false;
                state.selectedMultiSalesInvoice = getSingleRecord(action.payload);
            })
            .addCase(getMultiSalesInvoiceByVoucherNumber.rejected, (state, action: any) => {
                state.detailLoading = false;
                state.selectedMultiSalesInvoice = null;
                state.error = action.payload || "Failed to fetch Multi Sales Invoice";
            })

            // UPDATE
            .addCase(updateMultiSalesInvoice.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateMultiSalesInvoice.fulfilled, (state, action) => {
                state.updateLoading = false;

                const updatedRecord = getSingleRecord(action.payload);

                if (updatedRecord?.sMultiInvVoucherNumber) {
                    const index = state.multiSalesInvoices.findIndex((item: any) => String(item?.sMultiInvVoucherNumber) === String(updatedRecord.sMultiInvVoucherNumber));
                    if (index !== -1) state.multiSalesInvoices[index] = updatedRecord;
                    state.selectedMultiSalesInvoice = updatedRecord;
                }
            })
            .addCase(updateMultiSalesInvoice.rejected, (state, action: any) => {
                state.updateLoading = false;
                state.error = action.payload || "Failed to update Multi Sales Invoice";
            })

            // DELETE
            .addCase(deleteMultiSalesInvoice.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(deleteMultiSalesInvoice.fulfilled, (state, action) => {
                state.deleteLoading = false;

                state.multiSalesInvoices = state.multiSalesInvoices.filter((item: any) => String(item?.sMultiInvVoucherNumber) !== String(action.payload.voucherNumber));

                if (String(state.selectedMultiSalesInvoice?.sMultiInvVoucherNumber || "") === String(action.payload.voucherNumber)) {
                    state.selectedMultiSalesInvoice = null;
                }

                state.pagination = {
                    ...state.pagination,
                    totalDocs: Math.max(Number(state.pagination?.totalDocs || 0) - 1, 0),
                };
            })
            .addCase(deleteMultiSalesInvoice.rejected, (state, action: any) => {
                state.deleteLoading = false;
                state.error = action.payload || "Failed to delete Multi Sales Invoice";
            })

            // SALES INVOICES BY CUSTOMER
            .addCase(getSalesInvoicesByCustomerCode.pending, (state) => {
                state.customerInvoicesLoading = true;
                state.customerSalesInvoices = [];
                state.error = null;
            })
            .addCase(getSalesInvoicesByCustomerCode.fulfilled, (state, action) => {
                state.customerInvoicesLoading = false;
                state.customerSalesInvoices = getRecords(action.payload);
            })
            .addCase(getSalesInvoicesByCustomerCode.rejected, (state, action: any) => {
                state.customerInvoicesLoading = false;
                state.customerSalesInvoices = [];
                state.error = action.payload || "Failed to fetch Sales Invoices for customer";
            });
    },
});

export const { clearSelectedMultiSalesInvoice, clearCustomerSalesInvoices, clearMultiSalesInvoiceError } = multiSalesInvoiceSlice.actions;

export default multiSalesInvoiceSlice.reducer;