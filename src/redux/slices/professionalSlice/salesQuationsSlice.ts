import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

/* ===================================================
    TYPES
=================================================== */

export type SalesQuotationProduct = {
    productCode: string;
    productName: string;
    quantity: string | number;
    rate: string | number;
    amount: string | number;
};

export type SalesQuotationFooter = {
    grossAmount: string | number;
    netAmount: string | number;
};

export type SalesQuotation = {
    _id?: string;

    voucherNumber?: string;
    sQuoteVoucherNumber?: string;

    voucherDate?: string;
    sQuoteVoucherDate?: string;

    customerCode?: string;
    customerName?: string;
    sQuoteCustomerCode?: string;
    sQuoteCustomerName?: string;

    status?: string;
    sQuoteStatus?: string;

    remarks?: string;
    sQuoteRemark?: string;

    body?: SalesQuotationProduct[];
    sQuoteBody?: SalesQuotationProduct[];

    footer?: SalesQuotationFooter;
    sQuoteFooter?: SalesQuotationFooter;
};

type Pagination = {
    offset: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

type SalesQuotationState = {
    salesQuotations: SalesQuotation[];
    pagination: Pagination;

    selectedSalesQuotation: SalesQuotation | null;

    loading: boolean;
    error: string | null;

    createLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;
};

type RejectValue = {
    message: string;
};

const initialPagination: Pagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

/* ===================================================
    CREATE SALES QUOTATION
=================================================== */

export const createSalesQuotation = createAsyncThunk<
    SalesQuotation | null,
    any,
    { rejectValue: RejectValue }
>("salesQuotation/createSalesQuotation", async (payload, { rejectWithValue }) => {
    try {
        const res = await professionalAxios.post(
            "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/save",
            payload
        );

        if (!res.data?.success) {
            return rejectWithValue({
                message: res.data?.message || "Failed to create sales quotation",
            });
        }

        return res.data?.data ?? null;
    } catch (err: any) {
        return rejectWithValue({
            message:
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to create sales quotation",
        });
    }
});

/* ===================================================
    GET ALL SALES QUOTATIONS
=================================================== */

export const getAllSalesQuotations = createAsyncThunk<
    any,
    {
        offset?: number;
        limit?: number;
        search?: string;
        status?: string;
        docStatus?: string;
        isAutoPost?: string | boolean;
    } | undefined,
    { rejectValue: RejectValue }
>(
    "salesQuotation/getAllSalesQuotations",
    async (
        {
            offset = 0,
            limit = 10,
            search = "",
            status = "",
            docStatus = "open",
            isAutoPost = "",
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const params: any = {
                offset,
                limit,
                status,
                docStatus,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (isAutoPost !== "" && isAutoPost !== undefined && isAutoPost !== null) {
                params.isAutoPost = isAutoPost;
            }

            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/getAll",
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch sales quotations",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to fetch sales quotations",
            });
        }
    }
);

/* ===================================================
    GET SALES QUOTATION BY VOUCHER NUMBER
=================================================== */

export const getSalesQuotationByVoucherNumber = createAsyncThunk<
    SalesQuotation | null,
    string,
    { rejectValue: RejectValue }
>(
    "salesQuotation/getSalesQuotationByVoucherNumber",
    async (voucherNumber, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/getByVoucherNumber/${voucherNumber}`
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch sales quotation",
                });
            }

            return (
                res.data?.data?.salesQuotation ||
                res.data?.data?.salesQuation ||
                res.data?.data ||
                null
            );
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to fetch sales quotation",
            });
        }
    }
);

/* ===================================================
    UPDATE SALES QUOTATION
=================================================== */

export const updateSalesQuotation = createAsyncThunk<
    SalesQuotation | null,
    { voucherNumber: string; data: any },
    { rejectValue: RejectValue }
>(
    "salesQuotation/updateSalesQuotation",
    async ({ voucherNumber, data }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/update/${voucherNumber}`,
                data
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to update sales quotation",
                });
            }

            return res.data?.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to update sales quotation",
            });
        }
    }
);

/* ===================================================
    DELETE SALES QUOTATION
=================================================== */

export const deleteSalesQuotation = createAsyncThunk<
    string,
    string,
    { rejectValue: RejectValue }
>(
    "salesQuotation/deleteSalesQuotation",
    async (voucherNumber, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/delete/${voucherNumber}`
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to delete sales quotation",
                });
            }

            return voucherNumber;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to delete sales quotation",
            });
        }
    }
);

/* ===================================================
    SLICE
=================================================== */

const salesQuotationSlice = createSlice({
    name: "salesQuotation",

    initialState: {
        salesQuotations: [],
        pagination: initialPagination,

        selectedSalesQuotation: null,

        loading: false,
        error: null,

        createLoading: false,
        updateLoading: false,
        deleteLoading: false,
    } as SalesQuotationState,

    reducers: {
        clearSalesQuotationState: (state) => {
            state.error = null;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
        },

        clearSelectedSalesQuotation: (state) => {
            state.selectedSalesQuotation = null;
        },
    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getAllSalesQuotations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllSalesQuotations.fulfilled, (state, action) => {
                state.loading = false;

                const data = action.payload;

                state.salesQuotations =
                    data?.records || data?.items || data?.salesQuotations || [];

                state.pagination = data?.pagination || state.pagination;
            })
            .addCase(getAllSalesQuotations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to fetch sales quotations";
                state.salesQuotations = [];
            });

        /* ---------- GET BY VOUCHER NUMBER ---------- */
        builder
            .addCase(getSalesQuotationByVoucherNumber.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSalesQuotationByVoucherNumber.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedSalesQuotation = action.payload || null;
            })
            .addCase(getSalesQuotationByVoucherNumber.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to fetch sales quotation";
            });

        /* ---------- CREATE ---------- */
        builder
            .addCase(createSalesQuotation.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createSalesQuotation.fulfilled, (state, action) => {
                state.createLoading = false;

                if (action.payload) {
                    state.salesQuotations.unshift(action.payload);
                    state.pagination.totalDocs += 1;
                }
            })
            .addCase(createSalesQuotation.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload?.message || "Failed to create sales quotation";
            });

        /* ---------- UPDATE ---------- */
        builder
            .addCase(updateSalesQuotation.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateSalesQuotation.fulfilled, (state, action) => {
                state.updateLoading = false;

                const updated = action.payload;
                const updatedVoucher =
                    updated?.sQuoteVoucherNumber || updated?.voucherNumber;

                if (!updated || !updatedVoucher) return;

                state.salesQuotations = state.salesQuotations.map((item) => {
                    const itemVoucher = item.sQuoteVoucherNumber || item.voucherNumber;
                    return itemVoucher === updatedVoucher ? updated : item;
                });
            })
            .addCase(updateSalesQuotation.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload?.message || "Failed to update sales quotation";
            });

        /* ---------- DELETE ---------- */
        builder
            .addCase(deleteSalesQuotation.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(deleteSalesQuotation.fulfilled, (state, action) => {
                state.deleteLoading = false;

                const removedVoucher = action.payload;

                state.salesQuotations = state.salesQuotations.filter((item) => {
                    const itemVoucher = item.sQuoteVoucherNumber || item.voucherNumber;
                    return itemVoucher !== removedVoucher;
                });

                state.pagination.totalDocs = Math.max(
                    0,
                    state.pagination.totalDocs - 1
                );
            })
            .addCase(deleteSalesQuotation.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload?.message || "Failed to delete sales quotation";
            });
    },
});

export const { clearSalesQuotationState, clearSelectedSalesQuotation } =
    salesQuotationSlice.actions;

export default salesQuotationSlice.reducer;