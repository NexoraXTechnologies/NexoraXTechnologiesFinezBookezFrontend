import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   ⭐ NEW: PRODUCT MASTER SCHEMA TYPES
=================================================== */

export type ProductMasterSchemaField = {
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

type ProductMasterSchemaListParams = {
  offset?: number;
  limit?: number;
  isSearchable?: string;
  isRequired?: string;
};

type SaveProductMasterSchemaPayload = {
  fields: ProductMasterSchemaField[];
};

export type ProductMasterSchemaUpdateItem = {
  key: string;
  updateData: Partial<ProductMasterSchemaField>;
};

type UpdateProductMasterSchemaPayload = {
  updates: ProductMasterSchemaUpdateItem[];
};

/* ===================================================
   ⭐ NEW: GET PRODUCT MASTER SCHEMA
=================================================== */

export const getProductMasterSchema = createAsyncThunk(
  "productMasterSchema/getProductMasterSchema",
  async (
    {
      offset = 0,
      limit = 20,
      isSearchable = "",
      isRequired = "",
    }: ProductMasterSchemaListParams = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/masters/productMaster/schema/getAll",
        {
          params: {
            offset,
            limit,
            isSearchable,
            isRequired,
          },
        }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to fetch product master schema.",
        });
      }

      return response.data?.data ?? null;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch product master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: SAVE PRODUCT MASTER SCHEMA
=================================================== */

export const saveProductMasterSchema = createAsyncThunk(
  "productMasterSchema/saveProductMasterSchema",
  async (
    { fields }: SaveProductMasterSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!Array.isArray(fields) || fields.length === 0) {
        return rejectWithValue({
          message: "At least one product master field is required.",
        });
      }

      const response = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/masters/productMaster/schema/save",
        { fields }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to save product master schema.",
        });
      }

      return response.data?.data ?? { fields };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to save product master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: UPDATE PRODUCT MASTER SCHEMA
=================================================== */

export const updateProductMasterSchema = createAsyncThunk(
  "productMasterSchema/updateProductMasterSchema",
  async (
    { updates }: UpdateProductMasterSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!Array.isArray(updates) || updates.length === 0) {
        return rejectWithValue({
          message: "At least one product master update is required.",
        });
      }

      const response = await professionalAxios.put(
        "/eTaxSolnMongoApiBackend/users/masters/productMaster/schema/update",
        { updates }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to update product master schema.",
        });
      }

      return response.data?.data ?? { updates };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to update product master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: PRODUCT MASTER SCHEMA SLICE
=================================================== */

const initialState = {
  fields: [] as ProductMasterSchemaField[],
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

const productMasterSchemaSlice = createSlice({
  name: "productMasterSchema",
  initialState,
  reducers: {
    clearProductMasterSchemaError: (state) => {
      state.error = null;
    },
    clearProductMasterSchemaState: (state) => {
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
      .addCase(getProductMasterSchema.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductMasterSchema.fulfilled, (state, action: any) => {
        state.loading = false;
        const data = action.payload || {};
        state.fields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields ??
          [];
        state.pagination = data?.pagination ?? state.pagination;
      })
      .addCase(getProductMasterSchema.rejected, (state, action: any) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch product master schema.";
        state.fields = [];
      });

    builder
      .addCase(saveProductMasterSchema.pending, (state) => {
        state.saveLoading = true;
        state.error = null;
      })
      .addCase(saveProductMasterSchema.fulfilled, (state, action: any) => {
        state.saveLoading = false;
        const fields =
          action.payload?.fields ??
          action.payload?.items ??
          action.payload?.schema?.fields;
        if (Array.isArray(fields)) state.fields = fields;
      })
      .addCase(saveProductMasterSchema.rejected, (state, action: any) => {
        state.saveLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to save product master schema.";
      });

    builder
      .addCase(updateProductMasterSchema.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateProductMasterSchema.fulfilled, (state, action: any) => {
        state.updateLoading = false;
        const data = action.payload || {};
        const fields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields;

        if (Array.isArray(fields)) {
          state.fields = fields;
        } else if (Array.isArray(data?.updates)) {
          data.updates.forEach((item: ProductMasterSchemaUpdateItem) => {
            state.fields = state.fields.map((field) =>
              field.key === item.key
                ? { ...field, ...item.updateData }
                : field
            );
          });
        }
      })
      .addCase(updateProductMasterSchema.rejected, (state, action: any) => {
        state.updateLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to update product master schema.";
      });
  },
});

export const {
  clearProductMasterSchemaError,
  clearProductMasterSchemaState,
} = productMasterSchemaSlice.actions;

export default productMasterSchemaSlice.reducer;