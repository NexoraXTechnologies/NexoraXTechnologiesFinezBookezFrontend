import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   ⭐ NEW: ACCOUNT MASTER SCHEMA TYPES
=================================================== */

export type AccountMasterSchemaField = {
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

type AccountMasterSchemaListParams = {
  offset?: number;
  limit?: number;
  isSearchable?: string;
  isRequired?: string;
  isFilterable?: string;
};

type SaveAccountMasterSchemaPayload = {
  fields: AccountMasterSchemaField[];
};

export type AccountMasterSchemaUpdateItem = {
  key: string;
  updateData: Partial<AccountMasterSchemaField>;
};

type UpdateAccountMasterSchemaPayload = {
  updates: AccountMasterSchemaUpdateItem[];
};

/* ===================================================
   ⭐ NEW: GET ACCOUNT MASTER SCHEMA
=================================================== */

export const getAccountMasterSchema = createAsyncThunk(
  "accountMasterSchema/getAccountMasterSchema",
  async (
    {
      offset = 0,
      limit = 20,
      isSearchable = "",
      isRequired = "",
      isFilterable = "",
    }: AccountMasterSchemaListParams = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/masters/accountMaster/schema/getAll",
        {
          params: {
            offset,
            limit,
            isSearchable,
            isRequired,
            isFilterable,
          },
        }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to fetch account master schema.",
        });
      }

      return response.data?.data ?? null;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch account master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: SAVE ACCOUNT MASTER SCHEMA
=================================================== */

export const saveAccountMasterSchema = createAsyncThunk(
  "accountMasterSchema/saveAccountMasterSchema",
  async (
    { fields }: SaveAccountMasterSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!Array.isArray(fields) || fields.length === 0) {
        return rejectWithValue({
          message: "At least one account master field is required.",
        });
      }

      const response = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/masters/accountMaster/schema/save",
        { fields }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to save account master schema.",
        });
      }

      return response.data?.data ?? { fields };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to save account master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: UPDATE ACCOUNT MASTER SCHEMA
=================================================== */

export const updateAccountMasterSchema = createAsyncThunk(
  "accountMasterSchema/updateAccountMasterSchema",
  async (
    { updates }: UpdateAccountMasterSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!Array.isArray(updates) || updates.length === 0) {
        return rejectWithValue({
          message: "At least one account master update is required.",
        });
      }

      const response = await professionalAxios.put(
        "/eTaxSolnMongoApiBackend/users/masters/accountMaster/schema/update",
        { updates }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to update account master schema.",
        });
      }

      return response.data?.data ?? { updates };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to update account master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: ACCOUNT MASTER SCHEMA SLICE
=================================================== */

const initialState = {
  fields: [] as AccountMasterSchemaField[],
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

const accountMasterSchemaSlice = createSlice({
  name: "accountMasterSchema",
  initialState,
  reducers: {
    clearAccountMasterSchemaError: (state) => {
      state.error = null;
    },
    clearAccountMasterSchemaState: (state) => {
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
      .addCase(getAccountMasterSchema.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAccountMasterSchema.fulfilled, (state, action: any) => {
        state.loading = false;
        const data = action.payload || {};
        state.fields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields ??
          [];
        state.pagination = data?.pagination ?? state.pagination;
      })
      .addCase(getAccountMasterSchema.rejected, (state, action: any) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch account master schema.";
        state.fields = [];
      });

    builder
      .addCase(saveAccountMasterSchema.pending, (state) => {
        state.saveLoading = true;
        state.error = null;
      })
      .addCase(saveAccountMasterSchema.fulfilled, (state, action: any) => {
        state.saveLoading = false;
        const fields =
          action.payload?.fields ??
          action.payload?.items ??
          action.payload?.schema?.fields;
        if (Array.isArray(fields)) state.fields = fields;
      })
      .addCase(saveAccountMasterSchema.rejected, (state, action: any) => {
        state.saveLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to save account master schema.";
      });

    builder
      .addCase(updateAccountMasterSchema.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateAccountMasterSchema.fulfilled, (state, action: any) => {
        state.updateLoading = false;
        const data = action.payload || {};
        const fields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields;

        if (Array.isArray(fields)) {
          state.fields = fields;
        } else if (Array.isArray(data?.updates)) {
          data.updates.forEach((item: AccountMasterSchemaUpdateItem) => {
            state.fields = state.fields.map((field) =>
              field.key === item.key
                ? { ...field, ...item.updateData }
                : field
            );
          });
        }
      })
      .addCase(updateAccountMasterSchema.rejected, (state, action: any) => {
        state.updateLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to update account master schema.";
      });
  },
});

export const {
  clearAccountMasterSchemaError,
  clearAccountMasterSchemaState,
} = accountMasterSchemaSlice.actions;

export default accountMasterSchemaSlice.reducer;