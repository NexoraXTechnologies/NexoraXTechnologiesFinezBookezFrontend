import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";


export interface TransactionSchemaField {
    key: string;
    label: string;
    type: string;

    reference?: string;

    customMasterCode?: string;
    customMasterName?: string;

    isRequired: boolean;
    isSearchable: boolean;
    isFilterable: boolean;
    isReadonly?: boolean;
    isHidden?: boolean;
}
export interface SaveTransactionSchemaPayload {
    module: string;
    section: string;
    fields: TransactionSchemaField[];
}

export interface TransactionSchemaFieldUpdateData {
    label?: string;
    type?: string;
    reference?: string;

    customMasterCode?: string;
    customMasterName?: string;

    options?: string[];

    isRequired?: boolean;
    isSearchable?: boolean;
    isFilterable?: boolean;
    isReadonly?: boolean;
    isHidden?: boolean;
}

export interface TransactionSchemaUpdatePayload {
    module: string;
    section: string;
    key: string;
    updates: {
        label?: string;
        type?: string;
        reference?: string;
        customMasterCode?: string;
        customMasterName?: string;
        options?: string[];
        isRequired?: boolean;
        isSearchable?: boolean;
        isFilterable?: boolean;
        isReadonly?: boolean;
        isHidden?: boolean;
    };
}

export interface UpdateTransactionSchemaPayload {
    module: string;
    section: string;
    key: string;
    updates: TransactionSchemaFieldUpdateData;
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
        {
            module,
            section,
            fields,
        }: SaveTransactionSchemaPayload,
        { rejectWithValue }
    ) => {
        try {
            if (!module?.trim()) {
                return rejectWithValue({
                    message: "Transaction module is required.",
                });
            }

            if (!section?.trim()) {
                return rejectWithValue({
                    message: "Transaction schema section is required.",
                });
            }

            if (!Array.isArray(fields) || fields.length === 0) {
                return rejectWithValue({
                    message:
                        "At least one transaction schema field is required.",
                });
            }

            const payload: SaveTransactionSchemaPayload = {
                module: module.trim(),
                section: section.trim(),
                fields,
            };

            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/transactionSchema/addField",
                payload
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to save transaction schema.",
                });
            }

            return (
                response.data?.data ?? {
                    module: payload.module,
                    section: payload.section,
                    fields: payload.fields,
                }
            );
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
    "transactionSchema/updateTransactionSchema",
    async (
        payload: TransactionSchemaUpdatePayload,
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.put(
                "/eTaxSolnMongoApiBackend/users/bookez/transactionSchema/updateField",
                payload
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to update transaction schema.",
                });
            }

            return response.data?.data;
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