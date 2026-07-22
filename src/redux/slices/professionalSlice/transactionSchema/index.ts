import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";


interface SaveTransactionSchemaPayload {
    fields: any[];
}

interface UpdateTransactionSchemaPayload {
    updates: any[];
}

const initialState = {
    transactionsSchema: [],
    pagination: {
        offset: 0,
        limit: 10,
        totalDocs: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },
    transactionSchemaFields: [],
    selectedTransactionSchema: null,
    schemaLoading: false,
    loading: false,
    error: null,
};

export const getAllTransactionSchema = createAsyncThunk(
    "transaction/getAllTransactionSchema",
    async (
        module: string, { rejectWithValue }
    ) => {
        try {
            const params = { module };

            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/transactionSchema/getAll`,
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch transaction schema",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch transaction schema",
            });
        }
    }
);


/* ===================================================
   ⭐ NEW: SAVE ACCOUNT MASTER SCHEMA
=================================================== */

export const saveTransactionSchema = createAsyncThunk(
    "transaction/saveTransactionSchema",
    async (
        { fields }: SaveTransactionSchemaPayload,
        { rejectWithValue }
    ) => {
        try {
            if (!Array.isArray(fields) || fields.length === 0) {
                return rejectWithValue({
                    message: "At least one transaction schema field is required.",
                });
            }

            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/transactionSchema/addField",
                { fields }
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to save transaction schema.",
                });
            }

            return response.data?.data ?? { fields };
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    "Failed to save transaction schema.",
            });
        }
    }
);


/* ===================================================
   ⭐ NEW: UPDATE ACCOUNT MASTER SCHEMA
=================================================== */

export const updateTransactionSchema = createAsyncThunk(
    "transaction/updateTransactionSchema",
    async (
        { updates }: UpdateTransactionSchemaPayload,
        { rejectWithValue }
    ) => {
        try {
            if (!Array.isArray(updates) || updates.length === 0) {
                return rejectWithValue({
                    message: "At least one transaction schema update is required.",
                });
            }

            const response = await professionalAxios.put(
                "/eTaxSolnMongoApiBackend/users/bookez/transactionSchema/updateField",
                { updates }
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to update transaction schema.",
                });
            }

            return response.data?.data ?? { updates };
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    "Failed to update transaction schema.",
            });
        }
    }
);

const transactionSchemaSlice = createSlice({
    name: "transactionSchema",
    initialState,

    reducers: {
        clearTransactionSchemaError: (state) => {
            state.error = null;
        },
        clearTransactionSchemaState: (state) => {
            state.transactionsSchema = [];
            state.transactionSchemaFields = [];
            state.selectedTransactionSchema = null;
            state.pagination = initialState.pagination;
            state.loading = false;
            state.schemaLoading = false;
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getAllTransactionSchema.pending, (state: any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllTransactionSchema.fulfilled, (state: any, action: any) => {
                state.loading = false;
                const data = action.payload;

                state.transactionsSchema = data ?? [];
                state.pagination = data.pagination ?? state.pagination;
            })
            .addCase(getAllTransactionSchema.rejected, (state: any, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.transactionsSchema = [];
            });

        builder
            .addCase(saveTransactionSchema.pending, (state: any) => {
                state.schemaLoading = true;
                state.error = null;
            })
            .addCase(saveTransactionSchema.fulfilled, (state: any) => {
                state.schemaLoading = false;
            })
            .addCase(saveTransactionSchema.rejected, (state: any, action: any) => {
                state.schemaLoading = false;
                state.error = action.payload?.message;
            })

        builder

            .addCase(updateTransactionSchema.pending, (state: any) => {
                state.schemaLoading = true;
                state.error = null;
            })
            .addCase(updateTransactionSchema.fulfilled, (state: any) => {
                state.schemaLoading = false;
            })
            .addCase(updateTransactionSchema.rejected, (state: any, action: any) => {
                state.schemaLoading = false;
                state.error = action.payload?.message;
            });


    },
});

export const {
    clearTransactionSchemaError,
    clearTransactionSchemaState
} = transactionSchemaSlice.actions;
export default transactionSchemaSlice.reducer;