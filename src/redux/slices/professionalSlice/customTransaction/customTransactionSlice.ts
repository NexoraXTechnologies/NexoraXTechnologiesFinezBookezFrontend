import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type Pagination = {
    offset: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

export type GetAllCustomTransactionPayload = {
    offset?: number;
    limit?: number;
    search?: string;
    status?: string;
    moduleCode: string;
};

export type CustomTransactionDataPayload = {
    moduleCode: string;
    status?: string;
    data: {
        header: Record<string, any>;
        body: Record<string, any>[];
        footer: Record<string, any>;
    };
};

export type UpdateCustomTransactionPayload = {
    voucherNumber: string;
    payload: {
        status?: string;
        data?: {
            header: Record<string, any>;
            body: Record<string, any>[];
            footer: Record<string, any>;
        };
    };
};

type RejectValue = {
    message: string;
};

/* ===================================================
   GET ALL
=================================================== */

export const getAllCustomTransactionData = createAsyncThunk<
    any,
    GetAllCustomTransactionPayload,
    { rejectValue: RejectValue }
>(
    "customTransaction/getAllCustomTransactionData",
    async (
        {
            offset = 0,
            limit = 20,
            search = "",
            status = "active",
            moduleCode,
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/transactionData/getAll",
                {
                    params: {
                        offset,
                        limit,
                        search,
                        status,
                        moduleCode,
                    },
                }
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to fetch custom transaction data.",
                });
            }

            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    "Failed to fetch custom transaction data.",
            });
        }
    }
);

/* ===================================================
   GET BY VOUCHER NUMBER
=================================================== */

export const getCustomTransactionDataByVoucher = createAsyncThunk<
    any,
    string,
    { rejectValue: RejectValue }
>(
    "customTransaction/getCustomTransactionDataByVoucher",
    async (voucherNumber, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/transactionData/getByVoucher/${encodeURIComponent(
                    voucherNumber
                )}`
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to fetch custom transaction data.",
                });
            }

            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    "Failed to fetch custom transaction data.",
            });
        }
    }
);

// Backward-compatible export for any old import.
export const getCustomTransactionDataByCode =
    getCustomTransactionDataByVoucher;

/* ===================================================
   SAVE
=================================================== */

export const saveCustomTransactionData = createAsyncThunk<
    any,
    CustomTransactionDataPayload,
    { rejectValue: RejectValue }
>(
    "customTransaction/saveCustomTransactionData",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/transactionData/save",
                payload
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to save custom transaction data.",
                });
            }

            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    "Failed to save custom transaction data.",
            });
        }
    }
);

/* ===================================================
   UPDATE BY VOUCHER NUMBER
=================================================== */

export const updateCustomTransactionData = createAsyncThunk<
    any,
    UpdateCustomTransactionPayload,
    { rejectValue: RejectValue }
>(
    "customTransaction/updateCustomTransactionData",
    async ({ voucherNumber, payload }, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/transactionData/update/${encodeURIComponent(
                    voucherNumber
                )}`,
                payload
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to update custom transaction data.",
                });
            }

            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    "Failed to update custom transaction data.",
            });
        }
    }
);

/* ===================================================
   DELETE BY VOUCHER NUMBER
=================================================== */

export const deleteCustomTransactionData = createAsyncThunk<
    { voucherNumber: string },
    string,
    { rejectValue: RejectValue }
>(
    "customTransaction/deleteCustomTransactionData",
    async (voucherNumber, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookez/transactionData/delete/${encodeURIComponent(
                    voucherNumber
                )}`
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to delete custom transaction data.",
                });
            }

            return { voucherNumber };
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    "Failed to delete custom transaction data.",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

interface CustomTransactionState {
    customTransactiondata: any[];
    selectedCustomTransactionData: any;
    pagination: Pagination;
    loading: boolean;
    createLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;
    error: string | null;
    successMessage: string | null;
}

const initialState: CustomTransactionState = {
    customTransactiondata: [],
    selectedCustomTransactionData: null,

    pagination: {
        offset: 0,
        limit: 20,
        totalDocs: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },

    loading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,

    error: null,
    successMessage: null,
};

/* ===================================================
   SLICE
=================================================== */

const customTransactionDataSlice = createSlice({
    name: "customTransaction",
    initialState,

    reducers: {
        clearCustomTransactionError: (state) => {
            state.error = null;
        },

        clearCustomTransactionState: (state) => {
            state.loading = false;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
            state.error = null;
            state.successMessage = null;
            state.selectedCustomTransactionData = null;
        },
    },

    extraReducers: (builder) => {
        builder

            /* ===================================================
               GET ALL
            =================================================== */

            .addCase(getAllCustomTransactionData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getAllCustomTransactionData.fulfilled, (state, action) => {
                state.loading = false;

                // Backend response uses data.items.
                state.customTransactiondata =
                    action.payload?.items ??
                    action.payload?.customTransactionData ??
                    [];

                state.pagination =
                    action.payload?.pagination ?? state.pagination;
            })

            .addCase(getAllCustomTransactionData.rejected, (state, action) => {
                state.loading = false;

                state.error =
                    action.payload?.message ||
                    "Failed to fetch custom transaction data.";
            })

            /* ===================================================
               GET BY VOUCHER
            =================================================== */

            .addCase(getCustomTransactionDataByVoucher.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(
                getCustomTransactionDataByVoucher.fulfilled,
                (state, action) => {
                    state.loading = false;

                    state.selectedCustomTransactionData =
                        action.payload ?? null;
                }
            )

            .addCase(
                getCustomTransactionDataByVoucher.rejected,
                (state, action) => {
                    state.loading = false;

                    state.error =
                        action.payload?.message ||
                        "Failed to fetch custom transaction data.";
                }
            )

            /* ===================================================
               SAVE
            =================================================== */

            .addCase(saveCustomTransactionData.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })

            .addCase(saveCustomTransactionData.fulfilled, (state, action) => {
                state.createLoading = false;

                if (action.payload) {
                    state.customTransactiondata.unshift(action.payload);
                }

                state.successMessage =
                    "Custom transaction created successfully.";
            })

            .addCase(saveCustomTransactionData.rejected, (state, action) => {
                state.createLoading = false;

                state.error =
                    action.payload?.message ||
                    "Failed to create custom transaction data.";
            })

            /* ===================================================
               UPDATE
            =================================================== */

            .addCase(updateCustomTransactionData.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })

            .addCase(updateCustomTransactionData.fulfilled, (state, action) => {
                state.updateLoading = false;

                const voucherNumber =
                    action.payload?.voucherNumber ||
                    action.meta.arg.voucherNumber;

                state.customTransactiondata =
                    state.customTransactiondata.map((item: any) =>
                        item?.voucherNumber === voucherNumber
                            ? {
                                ...item,
                                ...(action.payload || {}),
                            }
                            : item
                    );

                state.selectedCustomTransactionData =
                    action.payload ?? state.selectedCustomTransactionData;

                state.successMessage =
                    "Custom transaction data updated successfully.";
            })

            .addCase(updateCustomTransactionData.rejected, (state, action) => {
                state.updateLoading = false;

                state.error =
                    action.payload?.message ||
                    "Failed to update custom transaction data.";
            })

            /* ===================================================
               DELETE
            =================================================== */

            .addCase(deleteCustomTransactionData.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })

            .addCase(deleteCustomTransactionData.fulfilled, (state, action) => {
                state.deleteLoading = false;

                state.customTransactiondata =
                    state.customTransactiondata.filter(
                        (item: any) =>
                            item?.voucherNumber !==
                            action.payload.voucherNumber
                    );

                state.successMessage =
                    "Custom transaction data deleted successfully.";
            })

            .addCase(deleteCustomTransactionData.rejected, (state, action) => {
                state.deleteLoading = false;

                state.error =
                    action.payload?.message ||
                    "Failed to delete custom transaction data.";
            });
    },
});

export const {
    clearCustomTransactionError,
    clearCustomTransactionState,
} = customTransactionDataSlice.actions;

export default customTransactionDataSlice.reducer;