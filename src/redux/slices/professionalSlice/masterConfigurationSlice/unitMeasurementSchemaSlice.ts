import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   ⭐ NEW: UNIT MEASUREMENT SCHEMA TYPES
=================================================== */

export type UnitMeasurementSchemaField = {
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

type UnitMeasurementSchemaListParams = {
  offset?: number;
  limit?: number;
  isSearchable?: string;
  isRequired?: string;
  type?: string;
  isFilterable?: string;
};

type SaveUnitMeasurementSchemaPayload = {
  fields: UnitMeasurementSchemaField[];
};

export type UnitMeasurementSchemaUpdateItem = {
  key: string;
  updateData: Partial<UnitMeasurementSchemaField>;
};

type UpdateUnitMeasurementSchemaPayload = {
  updates: UnitMeasurementSchemaUpdateItem[];
};

/* ===================================================
   ⭐ NEW: GET UNIT MEASUREMENT SCHEMA
=================================================== */

export const getUnitMeasurementSchema = createAsyncThunk(
  "unitMeasurementSchema/getUnitMeasurementSchema",
  async (
    {
      offset = 0,
      limit = 20,
      isSearchable = "",
      isRequired = "",
      type = "",
      isFilterable = "",
    }: UnitMeasurementSchemaListParams = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/masters/unitMeasurement/schema/getAll",
        {
          params: {
            offset,
            limit,
            isSearchable,
            isRequired,
            type,
            isFilterable,
          },
        }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to fetch unit measurement schema.",
        });
      }

      return response.data?.data ?? null;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch unit measurement schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: SAVE UNIT MEASUREMENT SCHEMA
=================================================== */

export const saveUnitMeasurementSchema = createAsyncThunk(
  "unitMeasurementSchema/saveUnitMeasurementSchema",
  async (
    { fields }: SaveUnitMeasurementSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!Array.isArray(fields) || fields.length === 0) {
        return rejectWithValue({
          message: "At least one unit measurement field is required.",
        });
      }

      const response = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/masters/unitMeasurement/schema/save",
        { fields }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to save unit measurement schema.",
        });
      }

      return response.data?.data ?? { fields };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to save unit measurement schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: UPDATE UNIT MEASUREMENT SCHEMA
   Assumed API: /users/masters/unitMeasurement/schema/update
=================================================== */

export const updateUnitMeasurementSchema = createAsyncThunk(
  "unitMeasurementSchema/updateUnitMeasurementSchema",
  async (
    { updates }: UpdateUnitMeasurementSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!Array.isArray(updates) || updates.length === 0) {
        return rejectWithValue({
          message: "At least one unit measurement update is required.",
        });
      }

      const response = await professionalAxios.put(
        "/eTaxSolnMongoApiBackend/users/masters/unitMeasurement/schema/update",
        { updates }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to update unit measurement schema.",
        });
      }

      return response.data?.data ?? { updates };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to update unit measurement schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: UNIT MEASUREMENT SCHEMA SLICE
=================================================== */

const initialState = {
  fields: [] as UnitMeasurementSchemaField[],
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

const unitMeasurementSchemaSlice = createSlice({
  name: "unitMeasurementSchema",
  initialState,
  reducers: {
    clearUnitMeasurementSchemaError: (state) => {
      state.error = null;
    },
    clearUnitMeasurementSchemaState: (state) => {
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
      .addCase(getUnitMeasurementSchema.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUnitMeasurementSchema.fulfilled, (state, action: any) => {
        state.loading = false;
        const data = action.payload || {};
        state.fields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields ??
          [];
        state.pagination = data?.pagination ?? state.pagination;
      })
      .addCase(getUnitMeasurementSchema.rejected, (state, action: any) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch unit measurement schema.";
        state.fields = [];
      });

    builder
      .addCase(saveUnitMeasurementSchema.pending, (state) => {
        state.saveLoading = true;
        state.error = null;
      })
      .addCase(saveUnitMeasurementSchema.fulfilled, (state, action: any) => {
        state.saveLoading = false;
        const fields =
          action.payload?.fields ??
          action.payload?.items ??
          action.payload?.schema?.fields;
        if (Array.isArray(fields)) state.fields = fields;
      })
      .addCase(saveUnitMeasurementSchema.rejected, (state, action: any) => {
        state.saveLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to save unit measurement schema.";
      });

    builder
      .addCase(updateUnitMeasurementSchema.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateUnitMeasurementSchema.fulfilled, (state, action: any) => {
        state.updateLoading = false;
        const data = action.payload || {};
        const fields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields;

        if (Array.isArray(fields)) {
          state.fields = fields;
        } else if (Array.isArray(data?.updates)) {
          data.updates.forEach((item: UnitMeasurementSchemaUpdateItem) => {
            state.fields = state.fields.map((field) =>
              field.key === item.key
                ? { ...field, ...item.updateData }
                : field
            );
          });
        }
      })
      .addCase(updateUnitMeasurementSchema.rejected, (state, action: any) => {
        state.updateLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to update unit measurement schema.";
      });
  },
});

export const {
  clearUnitMeasurementSchemaError,
  clearUnitMeasurementSchemaState,
} = unitMeasurementSchemaSlice.actions;

export default unitMeasurementSchemaSlice.reducer;