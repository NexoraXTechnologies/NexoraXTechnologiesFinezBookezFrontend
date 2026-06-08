import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

export const getAllTransactionSchema = createAsyncThunk(
    "transaction/getAllTransactionSchema",
    async (
        module, { rejectWithValue }
    ) => {
        try {
            const params = { module };

            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/transactionSchema/getAll`,
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch account schema",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch account schema",
            });
        }
    }
);

const loadFieldOptions = async (fields: any[]) => {
    const updatedFields = await Promise.all(
        fields.map(async (field) => {
            if (!field?.api) return field;

            try {
                const res = await professionalAxios.get(
                    `/eTaxSolnMongoApiBackend${field.api}`,
                    {
                        params: field.queryParams || {},
                    }
                );

                const records =
                    res.data?.data?.records ||
                    res.data?.data?.docs ||
                    res.data?.data ||
                    [];

                const options = Array.isArray(records)
                    ? records.map((item: any) => ({
                        label: item?.[field.labelField] || "",
                        value: item?.[field.valueField] || "",
                        raw: item,
                    }))
                    : [];

                return {
                    ...field,
                    options,
                };
            } catch (error) {
                console.log(`Failed to load options for ${field.key}`, error);

                return {
                    ...field,
                    options: [],
                };
            }
        })
    );

    return updatedFields;
};

const transationsSchemaSlice = createSlice({
    name: "transactionSchema",
    initialState: {
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

        accountMasterSchemaFields: [],
        schemaLoading: false,
        selectedAccount: null,
        loading: false,
        error: null
    },

    reducers: {

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
            .addCase(loadFieldOptions.pending, (state: any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadFieldOptions.fulfilled, (state: any, action: any) => {
                state.loading = false;
                const data = action.payload;

                state.transactionsSchema = data ?? [];
                state.pagination = data.pagination ?? state.pagination;
            })
            .addCase(loadFieldOptions.rejected, (state: any, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.transactionsSchema = [];
            });
    },
});

export const { } = transationsSchemaSlice.actions;
export default transationsSchemaSlice.reducer;