import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

// COMPANY MASTER SCHEMA TYPES
export type CompanyMasterSchemaField = {
    key: string;
    label: string;
    type: string;
    ref?: string;
    isRequired?: boolean;
    isSearchable?: boolean;
    isFilterable?: boolean;
    isHidden?: boolean;
    options?: any[];
    [key: string]: any;
};

type CompanyMasterSchemaListParams = {
    offset?: number;
    limit?: number;
    isSearchable?: string;
    isRequired?: string;
    isFilterable?: string;
};

type SaveCompanyMasterSchemaPayload = {
    fields: CompanyMasterSchemaField[];
};

export type CompanyMasterSchemaUpdateItem = {
    key: string;
    updateData: Partial<CompanyMasterSchemaField>;
};

type UpdateCompanyMasterSchemaPayload = {
    updates: CompanyMasterSchemaUpdateItem[];
};

// ⭐ UPDATED
export const getCompanyMasterSchema = createAsyncThunk(
    "companyMasterSchema/getCompanyMasterSchema",
    async ({ offset = 0, limit = 20, isSearchable = "", isRequired = "", isFilterable = "" }: CompanyMasterSchemaListParams = {}, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/masters/companyMaster/schema/getAll", { params: { offset, limit, isSearchable, isRequired, isFilterable } });

            if (!response.data?.success) {
                return rejectWithValue({ message: response.data?.message || "Failed to fetch company master schema." });
            }

            return response.data?.data ?? null;
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || "Failed to fetch company master schema." });
        }
    }
);

// ⭐ UPDATED
export const saveCompanyMasterSchema = createAsyncThunk(
    "companyMasterSchema/saveCompanyMasterSchema",
    async ({ fields }: SaveCompanyMasterSchemaPayload, { rejectWithValue }) => {
        try {
            if (!Array.isArray(fields) || fields.length === 0) {
                return rejectWithValue({ message: "At least one company master field is required." });
            }

            const response = await professionalAxios.post("/eTaxSolnMongoApiBackend/users/masters/companyMaster/schema/save", { fields });

            if (!response.data?.success) {
                return rejectWithValue({ message: response.data?.message || "Failed to save company master schema." });
            }

            return response.data?.data ?? { fields };
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || "Failed to save company master schema." });
        }
    }
);

// ⭐ UPDATED
export const updateCompanyMasterSchema = createAsyncThunk(
    "companyMasterSchema/updateCompanyMasterSchema",
    async ({ updates }: UpdateCompanyMasterSchemaPayload, { rejectWithValue }) => {
        try {
            if (!Array.isArray(updates) || updates.length === 0) {
                return rejectWithValue({ message: "At least one company master update is required." });
            }

            const response = await professionalAxios.put("/eTaxSolnMongoApiBackend/users/masters/companyMaster/schema/update", { updates });

            if (!response.data?.success) {
                return rejectWithValue({ message: response.data?.message || "Failed to update company master schema." });
            }

            return response.data?.data ?? { updates };
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || "Failed to update company master schema." });
        }
    }
);

// COMPANY MASTER SCHEMA SLICE
const initialState = {
    fields: [] as CompanyMasterSchemaField[],
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
    saveLoading: false,
    updateLoading: false,
    error: null as string | null,
};

const companyMasterSchemaSlice = createSlice({
    name: "companyMasterSchema",
    initialState,
    reducers: {
        clearCompanyMasterSchemaError: (state) => {
            state.error = null;
        },
        clearCompanyMasterSchemaState: (state) => {
            state.fields = [];
            state.pagination = initialState.pagination;
            state.loading = false;
            state.saveLoading = false;
            state.updateLoading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCompanyMasterSchema.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getCompanyMasterSchema.fulfilled, (state, action: any) => {
                state.loading = false;
                const data = action.payload || {};
                state.fields = data?.fields ?? data?.items ?? data?.schema?.fields ?? [];
                state.pagination = data?.pagination ?? state.pagination;
            })
            .addCase(getCompanyMasterSchema.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to fetch company master schema.";
                state.fields = [];
            });

        builder
            .addCase(saveCompanyMasterSchema.pending, (state) => {
                state.saveLoading = true;
                state.error = null;
            })
            .addCase(saveCompanyMasterSchema.fulfilled, (state, action: any) => {
                state.saveLoading = false;
                const fields = action.payload?.fields ?? action.payload?.items ?? action.payload?.schema?.fields;
                if (Array.isArray(fields)) state.fields = fields;
            })
            .addCase(saveCompanyMasterSchema.rejected, (state, action: any) => {
                state.saveLoading = false;
                state.error = action.payload?.message || "Failed to save company master schema.";
            });

        builder
            .addCase(updateCompanyMasterSchema.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateCompanyMasterSchema.fulfilled, (state, action: any) => {
                state.updateLoading = false;
                const data = action.payload || {};
                const fields = data?.fields ?? data?.items ?? data?.schema?.fields;

                if (Array.isArray(fields)) {
                    state.fields = fields;
                } else if (Array.isArray(data?.updates)) {
                    data.updates.forEach((item: CompanyMasterSchemaUpdateItem) => {
                        state.fields = state.fields.map((field) => field.key === item.key ? { ...field, ...item.updateData } : field);
                    });
                }
            })
            .addCase(updateCompanyMasterSchema.rejected, (state, action: any) => {
                state.updateLoading = false;
                state.error = action.payload?.message || "Failed to update company master schema.";
            });
    },
});

export const { clearCompanyMasterSchemaError, clearCompanyMasterSchemaState } = companyMasterSchemaSlice.actions;

export default companyMasterSchemaSlice.reducer;
