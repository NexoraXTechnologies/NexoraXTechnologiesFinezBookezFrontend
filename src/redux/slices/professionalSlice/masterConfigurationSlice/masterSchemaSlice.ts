import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   ⭐ NEW: MASTER SCHEMA TYPES
=================================================== */

export type MasterSchemaField = {
  key: string;
  label: string;
  type: string;

  isRequired?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  isHidden?: boolean;

  options?: any[];

  customMasterCode?: string;
  customMasterName?: string;

  masterSource?: string;
  dependsOn?: string;

  [key: string]: any;
};

type GetMasterSchemaPayload = {
  moduleCode: string;
  offset?: number;
  limit?: number;
};

type SaveMasterSchemaPayload = {
  moduleCode: string;
  fields: MasterSchemaField[];
};

export type MasterSchemaUpdateItem = {
  key: string;
  updateData: Partial<MasterSchemaField>;
};

type UpdateMasterSchemaPayload = {
  moduleCode: string;
  updates: MasterSchemaUpdateItem[];
};



/* ===================================================
   ⭐ NEW: GET MASTER SCHEMA
   GET /users/customMaster/schema/getAll?moduleCode=...
=================================================== */

export const getMasterSchema = createAsyncThunk(
  "masterSchema/getMasterSchema",
  async (
    { moduleCode, offset = 0, limit = 20 }: GetMasterSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!moduleCode?.trim()) {
        return rejectWithValue({
          message: "moduleCode is required to fetch master schema.",
        });
      }

      const response = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/customMaster/schema/getAll",
        {
          params: {
            moduleCode: moduleCode.trim(),
            offset,
            limit,
          },
        }
      );


      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to fetch master schema.",
        });
      }

      /*
       * ⭐ NEW:
       * Return the full API data object because backend response
       * may contain moduleCode, pagination and fields together.
       */
      return response.data?.data ?? null;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: SAVE MASTER SCHEMA
   POST /users/customMaster/schema/save
=================================================== */

export const saveMasterSchema = createAsyncThunk(
  "masterSchema/saveMasterSchema",
  async (
    { moduleCode, fields }: SaveMasterSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!moduleCode?.trim()) {
        return rejectWithValue({
          message: "moduleCode is required to save master schema.",
        });
      }

      if (!Array.isArray(fields) || fields.length === 0) {
        return rejectWithValue({
          message: "At least one schema field is required.",
        });
      }

      const payload = {
        moduleCode: moduleCode.trim(),
        fields,
      };

      const response = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/customMaster/schema/save",
        payload
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to save master schema.",
        });
      }

      return response.data?.data ?? {
        moduleCode: moduleCode.trim(),
        fields,
      };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to save master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: UPDATE MASTER SCHEMA
   PUT /users/customMaster/schema/update
=================================================== */

export const updateMasterSchema = createAsyncThunk(
  "masterSchema/updateMasterSchema",
  async (
    { moduleCode, updates }: UpdateMasterSchemaPayload,
    { rejectWithValue }
  ) => {
    try {
      if (!moduleCode?.trim()) {
        return rejectWithValue({
          message: "moduleCode is required to update master schema.",
        });
      }

      if (!Array.isArray(updates) || updates.length === 0) {
        return rejectWithValue({
          message: "At least one schema update is required.",
        });
      }

      const payload = {
        moduleCode: moduleCode.trim(),
        updates,
      };

      const response = await professionalAxios.put(
        "/eTaxSolnMongoApiBackend/users/customMaster/schema/update",
        payload
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to update master schema.",
        });
      }

      return response.data?.data ?? payload;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to update master schema.",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: INITIAL STATE
=================================================== */

const initialState = {
  moduleCode: "",

  fields: [] as MasterSchemaField[],

  pagination: {
    offset: 0,
    limit: 50,
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
  successMessage: null as string | null,
};

/* ===================================================
   ⭐ NEW: MASTER SCHEMA SLICE
=================================================== */

const masterSchemaSlice = createSlice({
  name: "masterSchema",
  initialState,

  reducers: {
    /* ⭐ NEW: Clear only API error */
    clearMasterSchemaError: (state) => {
      state.error = null;
    },

    /* ⭐ NEW: Clear success message */
    clearMasterSchemaSuccessMessage: (state) => {
      state.successMessage = null;
    },

    /* ⭐ NEW: Clear complete schema state */
    clearMasterSchemaState: (state) => {
      state.moduleCode = "";
      state.fields = [];
      state.pagination = initialState.pagination;

      state.loading = false;
      state.saveLoading = false;
      state.updateLoading = false;

      state.error = null;
      state.successMessage = null;
    },

    /*
     * ⭐ NEW:
     * Local field replacement is useful after drag/drop,
     * adding a temporary field or editing before API save.
     */
    setMasterSchemaFieldsLocal: (state, action) => {
      state.fields = Array.isArray(action.payload)
        ? action.payload
        : [];
    },

    /* ⭐ NEW: Add one field locally */
    addMasterSchemaFieldLocal: (state, action) => {
      if (action.payload) {
        state.fields.push(action.payload);
      }
    },

    /* ⭐ NEW: Update one field locally by key */
    updateMasterSchemaFieldLocal: (state, action) => {
      const { key, updateData } = action.payload || {};

      if (!key || !updateData) return;

      state.fields = state.fields.map((field) =>
        field.key === key
          ? {
            ...field,
            ...updateData,
          }
          : field
      );
    },

    /* ⭐ NEW: Remove one unsaved field locally */
    removeMasterSchemaFieldLocal: (state, action) => {
      const key = action.payload;

      if (!key) return;

      state.fields = state.fields.filter(
        (field) => field.key !== key
      );
    },
  },

  extraReducers: (builder) => {
    /* ===================================================
       ⭐ NEW: GET MASTER SCHEMA
    =================================================== */

    builder
      .addCase(getMasterSchema.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(getMasterSchema.fulfilled, (state, action: any) => {
        state.loading = false;

        const data = action.payload || {};

        /*
         * ⭐ NEW:
         * Supports the most common backend response shapes:
         *
         * data.fields
         * data.items
         * data.schema.fields
         * data.schemaFields
         */
        state.fields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields ??
          data?.schemaFields ??
          [];

        state.moduleCode =
          data?.moduleCode ??
          data?.schema?.moduleCode ??
          state.moduleCode;

        state.pagination =
          data?.pagination ??
          state.pagination;
      })

      .addCase(getMasterSchema.rejected, (state, action: any) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch master schema.";
        state.fields = [];
      });

    /* ===================================================
       ⭐ NEW: SAVE MASTER SCHEMA
    =================================================== */

    builder
      .addCase(saveMasterSchema.pending, (state) => {
        state.saveLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(saveMasterSchema.fulfilled, (state, action: any) => {
        state.saveLoading = false;

        const data = action.payload || {};

        state.moduleCode =
          data?.moduleCode ??
          data?.schema?.moduleCode ??
          state.moduleCode;

        /*
         * ⭐ NEW:
         * Replace fields when API returns the complete saved schema.
         * If API returns no fields, retain the current local fields.
         */
        const savedFields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields ??
          data?.schemaFields;

        if (Array.isArray(savedFields)) {
          state.fields = savedFields;
        }

        state.pagination =
          data?.pagination ??
          state.pagination;

        state.successMessage =
          "Master schema saved successfully.";
      })

      .addCase(saveMasterSchema.rejected, (state, action: any) => {
        state.saveLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to save master schema.";
      });

    /* ===================================================
       ⭐ NEW: UPDATE MASTER SCHEMA
    =================================================== */

    builder
      .addCase(updateMasterSchema.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
        state.successMessage = null;
      })

      .addCase(updateMasterSchema.fulfilled, (state, action: any) => {
        state.updateLoading = false;

        const data = action.payload || {};

        state.moduleCode =
          data?.moduleCode ??
          data?.schema?.moduleCode ??
          state.moduleCode;

        /*
         * ⭐ NEW:
         * Prefer complete fields returned by backend.
         * Otherwise apply submitted updates locally.
         */
        const updatedFields =
          data?.fields ??
          data?.items ??
          data?.schema?.fields ??
          data?.schemaFields;

        if (Array.isArray(updatedFields)) {
          state.fields = updatedFields;
        } else if (Array.isArray(data?.updates)) {
          data.updates.forEach((updateItem: MasterSchemaUpdateItem) => {
            state.fields = state.fields.map((field) =>
              field.key === updateItem.key
                ? {
                  ...field,
                  ...updateItem.updateData,
                }
                : field
            );
          });
        }

        state.pagination =
          data?.pagination ??
          state.pagination;

        state.successMessage =
          "Master schema updated successfully.";
      })

      .addCase(updateMasterSchema.rejected, (state, action: any) => {
        state.updateLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to update master schema.";
      });
  },
});

/* ===================================================
   ⭐ NEW: EXPORT ACTIONS AND REDUCER
=================================================== */

export const {
  clearMasterSchemaError,
  clearMasterSchemaSuccessMessage,
  clearMasterSchemaState,
  setMasterSchemaFieldsLocal,
  addMasterSchemaFieldLocal,
  updateMasterSchemaFieldLocal,
  removeMasterSchemaFieldLocal,
} = masterSchemaSlice.actions;

export default masterSchemaSlice.reducer;