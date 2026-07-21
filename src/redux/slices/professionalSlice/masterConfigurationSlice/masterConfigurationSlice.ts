import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   ⭐ NEW: MASTER CONFIGURATION TYPES
=================================================== */

type MasterConfigurationListParams = {
  offset?: number;
  limit?: number;
  search?: string;
  status?: string;
};

type UpdateMasterConfigurationPayload = {
  moduleCode: string;
  data: any;
};

/* ===================================================
   ⭐ NEW: CREATE MASTER CONFIGURATION
=================================================== */
export const createMasterConfiguration = createAsyncThunk(
  "masterConfiguration/createMasterConfiguration",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/customMaster/module/create",
        payload
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to create master configuration",
        });
      }

      return (
        response.data?.data?.module ??
        response.data?.data?.masterConfiguration ??
        response.data?.data ??
        null
      );
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to create master configuration",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: GET ALL MASTER CONFIGURATIONS
=================================================== */
export const getAllMasterConfigurations = createAsyncThunk(
  "masterConfiguration/getAllMasterConfigurations",
  async (
    {
      offset = 0,
      limit = 10,
      search = "",
      status = "",
    }: MasterConfigurationListParams = {},
    { rejectWithValue }
  ) => {
    try {
      const params: MasterConfigurationListParams = {
        offset,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status.trim()) {
        params.status = status.trim();
      }

      const response = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/customMaster/module/getAll",
        { params }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to fetch master configurations",
        });
      }

      return response.data?.data ?? null;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch master configurations",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: GET MASTER CONFIGURATION BY CODE
=================================================== */
export const getMasterConfigurationByCode = createAsyncThunk(
  "masterConfiguration/getMasterConfigurationByCode",
  async (moduleCode: string, { rejectWithValue }) => {
    try {
      const response = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/customMaster/module/getByCode/${moduleCode}`
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to fetch master configuration",
        });
      }

      return (
        response.data?.data?.module ??
        response.data?.data?.masterConfiguration ??
        response.data?.data ??
        null
      );
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch master configuration",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: UPDATE MASTER CONFIGURATION
=================================================== */
export const updateMasterConfiguration = createAsyncThunk(
  "masterConfiguration/updateMasterConfiguration",
  async (
    { moduleCode, data }: UpdateMasterConfigurationPayload,
    { rejectWithValue }
  ) => {
    try {
      const response = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/customMaster/module/update/${moduleCode}`,
        data
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to update master configuration",
        });
      }

      return (
        response.data?.data?.module ??
        response.data?.data?.masterConfiguration ??
        response.data?.data ??
        null
      );
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to update master configuration",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: DELETE MASTER CONFIGURATION
=================================================== */
export const deleteMasterConfiguration = createAsyncThunk(
  "masterConfiguration/deleteMasterConfiguration",
  async (moduleCode: string, { rejectWithValue }) => {
    try {
      const response = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/customMaster/module/delete/${moduleCode}`
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to delete master configuration",
        });
      }

      return moduleCode;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to delete master configuration",
      });
    }
  }
);

/* ===================================================
   ⭐ NEW: MASTER CONFIGURATION SLICE
=================================================== */
const masterConfigurationSlice = createSlice({
  name: "masterConfiguration",

  initialState: {
    masterConfigurations: [] as any[],

    pagination: {
      offset: 0,
      limit: 10,
      totalDocs: 0,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },

    selectedMasterConfiguration: null as any,

    loading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,

    error: null as string | null,
  },

  reducers: {
    /* ⭐ NEW: Clear request status and errors */
    clearMasterConfigurationState: (state) => {
      state.error = null;
      state.createLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;
    },

    /* ⭐ NEW: Clear selected configuration */
    clearSelectedMasterConfiguration: (state) => {
      state.selectedMasterConfiguration = null;
    },
  },

  extraReducers: (builder) => {
    /* ===================================================
       ⭐ NEW: GET ALL
    =================================================== */
    builder
      .addCase(getAllMasterConfigurations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllMasterConfigurations.fulfilled, (state, action: any) => {
        state.loading = false;

        const data = action.payload;

        state.masterConfigurations =
          data?.items ??
          data?.modules ??
          data?.masterConfigurations ??
          [];

        state.pagination = data?.pagination ?? state.pagination;
      })
      .addCase(getAllMasterConfigurations.rejected, (state, action: any) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          "Failed to fetch master configurations";
        state.masterConfigurations = [];
      });

    /* ===================================================
       ⭐ NEW: GET BY CODE
    =================================================== */
    builder
      .addCase(getMasterConfigurationByCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getMasterConfigurationByCode.fulfilled,
        (state, action: any) => {
          state.loading = false;
          state.selectedMasterConfiguration = action.payload ?? null;
        }
      )
      .addCase(
        getMasterConfigurationByCode.rejected,
        (state, action: any) => {
          state.loading = false;
          state.error =
            action.payload?.message ||
            "Failed to fetch master configuration";
        }
      );

    /* ===================================================
       ⭐ NEW: CREATE
    =================================================== */
    builder
      .addCase(createMasterConfiguration.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createMasterConfiguration.fulfilled, (state, action: any) => {
        state.createLoading = false;

        if (action.payload) {
          state.masterConfigurations.unshift(action.payload);
          state.pagination.totalDocs += 1;
        }
      })
      .addCase(createMasterConfiguration.rejected, (state, action: any) => {
        state.createLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to create master configuration";
      });

    /* ===================================================
       ⭐ NEW: UPDATE
    =================================================== */
    builder
      .addCase(updateMasterConfiguration.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateMasterConfiguration.fulfilled, (state, action: any) => {
        state.updateLoading = false;

        const updatedConfiguration = action.payload;
        if (!updatedConfiguration?.moduleCode) return;

        state.masterConfigurations = state.masterConfigurations.map(
          (configuration: any) =>
            configuration.moduleCode === updatedConfiguration.moduleCode
              ? updatedConfiguration
              : configuration
        );

        if (
          state.selectedMasterConfiguration?.moduleCode ===
          updatedConfiguration.moduleCode
        ) {
          state.selectedMasterConfiguration = updatedConfiguration;
        }
      })
      .addCase(updateMasterConfiguration.rejected, (state, action: any) => {
        state.updateLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to update master configuration";
      });

    /* ===================================================
       ⭐ NEW: DELETE
    =================================================== */
    builder
      .addCase(deleteMasterConfiguration.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteMasterConfiguration.fulfilled, (state, action: any) => {
        state.deleteLoading = false;

        const deletedModuleCode = action.payload;

        state.masterConfigurations = state.masterConfigurations.filter(
          (configuration: any) =>
            configuration.moduleCode !== deletedModuleCode
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );

        if (
          state.selectedMasterConfiguration?.moduleCode ===
          deletedModuleCode
        ) {
          state.selectedMasterConfiguration = null;
        }
      })
      .addCase(deleteMasterConfiguration.rejected, (state, action: any) => {
        state.deleteLoading = false;
        state.error =
          action.payload?.message ||
          "Failed to delete master configuration";
      });
  },
});

/* ===================================================
   ⭐ NEW: EXPORT ACTIONS AND REDUCER
=================================================== */
export const {
  clearMasterConfigurationState,
  clearSelectedMasterConfiguration,
} = masterConfigurationSlice.actions;

export default masterConfigurationSlice.reducer;