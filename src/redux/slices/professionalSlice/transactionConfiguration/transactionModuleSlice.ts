import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

export type TransactionModule = {
  _id?: string;

  moduleCode?: string;
  moduleName: string;
  description?: string;

  moduleType: string;

  status: "active" | "inactive";

  createdOn?: string;
  createdBy?: string;

  modifiedOn?: string;
  modifiedBy?: string;
};

type PaginationType = {
  offset: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/* ===================================================
   GET ALL
=================================================== */

type GetTransactionModulePayload = {
  offset?: number;
  limit?: number;
  search?: string;
  status?: string;
  moduleType?: string;
};

export const getAllTransactionModules = createAsyncThunk(
  "transactionModule/getAllTransactionModules",
  async (
    {
      offset = 0,
      limit = 20,
      search = "",
      status = "",
      moduleType = "",
    }: GetTransactionModulePayload,
    { rejectWithValue }
  ) => {
    try {
      const response = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/bookez/transactionModule/getAll",
        {
          params: {
            offset,
            limit,
            search,
            status,
            moduleType,
          },
        }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to fetch transaction modules.",
        });
      }

      return response.data?.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch transaction modules.",
      });
    }
  }
);

/* ===================================================
   GET BY CODE
=================================================== */

export const getTransactionModuleByCode = createAsyncThunk(
  "transactionModule/getTransactionModuleByCode",
  async (moduleCode: string, { rejectWithValue }) => {
    try {
      const response = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/transactionModule/getByCode/${moduleCode}`,
        {
          params: {
            moduleCode,
          },
        }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to fetch transaction module.",
        });
      }

      return response.data?.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to fetch transaction module.",
      });
    }
  }
);

/* ===================================================
   SAVE
=================================================== */

type SaveTransactionModulePayload = {
  moduleName: string;
  description?: string;
  moduleType: string;
  status: "active" | "inactive";
};

export const saveTransactionModule = createAsyncThunk(
  "transactionModule/saveTransactionModule",
  async (
    payload: SaveTransactionModulePayload,
    { rejectWithValue }
  ) => {
    try {
      const response = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/transactionModule/create",
        payload
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to save transaction module.",
        });
      }

      return response.data?.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to save transaction module.",
      });
    }
  }
);

/* ===================================================
   UPDATE
=================================================== */

type UpdateTransactionModulePayload = {
  moduleCode: string;
  moduleName: string;
  description?: string;
  moduleType: string;
  status: "active" | "inactive";
};

export const updateTransactionModule = createAsyncThunk(
  "transactionModule/updateTransactionModule",
  async (
    {
      moduleCode,
      payload,
    }: {
      moduleCode: string;
      payload: UpdateTransactionModulePayload;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/transactionModule/update/${moduleCode}`,
        payload
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to update transaction module.",
        });
      }

      return response.data?.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to update transaction module.",
      });
    }
  }
);

/* ===================================================
   DELETE
=================================================== */

export const deleteTransactionModule = createAsyncThunk(
  "transactionModule/deleteTransactionModule",
  async (moduleCode: string, { rejectWithValue }) => {
    try {
      const response = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/transactionModule/delete/${moduleCode}`,
        {
          data: {
            moduleCode,
          },
        }
      );

      if (!response.data?.success) {
        return rejectWithValue({
          message:
            response.data?.message ||
            "Failed to delete transaction module.",
        });
      }

      return {
        moduleCode,
      };
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          "Failed to delete transaction module.",
      });
    }
  }
);




/* ===================================================
   INITIAL STATE
=================================================== */

type TransactionModuleState = {
  items: TransactionModule[];
  selectedTransactionModule: TransactionModule | null;

  pagination: PaginationType;

  loading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;

  error: string | null;
  successMessage: string | null;
};

const initialState: TransactionModuleState = {
  items: [],
  selectedTransactionModule: null,

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

const transactionModuleSlice = createSlice({
  name: "transactionModule",

  initialState,

  reducers: {
    clearTransactionModuleError: (state) => {
      state.error = null;
    },

    clearTransactionModuleSuccessMessage: (state) => {
      state.successMessage = null;
    },

    clearSelectedTransactionModule: (state) => {
      state.selectedTransactionModule = null;
    },

    clearTransactionModuleState: (state) => {
      state.loading = false;
      state.createLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;

      state.error = null;
      state.successMessage = null;

      state.selectedTransactionModule = null;
    },
  },

  extraReducers: (builder) => {
    /* ===================================================
       GET ALL
    =================================================== */

    builder
      .addCase(getAllTransactionModules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAllTransactionModules.fulfilled, (state, action: any) => {
        state.loading = false;

        state.items = action.payload?.items ?? [];

        state.pagination =
          action.payload?.pagination ??
          state.pagination;
      })

      .addCase(getAllTransactionModules.rejected, (state, action: any) => {
        state.loading = false;

        state.error =
          action.payload?.message ??
          "Failed to fetch transaction modules.";
      });

    /* ===================================================
       GET BY CODE
    =================================================== */

    builder
      .addCase(getTransactionModuleByCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        getTransactionModuleByCode.fulfilled,
        (state, action: any) => {
          state.loading = false;

          state.selectedTransactionModule =
            action.payload ?? null;
        }
      )

      .addCase(
        getTransactionModuleByCode.rejected,
        (state, action: any) => {
          state.loading = false;

          state.error =
            action.payload?.message ??
            "Failed to fetch transaction module.";
        }
      );

    /* ===================================================
       SAVE
    =================================================== */

    builder
      .addCase(saveTransactionModule.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })

      .addCase(
        saveTransactionModule.fulfilled,
        (state, action: any) => {
          state.createLoading = false;

          if (action.payload) {
            state.items.unshift(action.payload);
          }

          state.successMessage =
            "Transaction module created successfully.";
        }
      )

      .addCase(
        saveTransactionModule.rejected,
        (state, action: any) => {
          state.createLoading = false;

          state.error =
            action.payload?.message ??
            "Failed to create transaction module.";
        }
      );

    /* ===================================================
       UPDATE
    =================================================== */

    builder
      .addCase(updateTransactionModule.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })

      .addCase(
        updateTransactionModule.fulfilled,
        (state, action: any) => {
          state.updateLoading = false;

          const updated = action.payload;

          state.items = state.items.map((item) =>
            item.moduleCode === updated.moduleCode
              ? updated
              : item
          );

          state.selectedTransactionModule = updated;

          state.successMessage =
            "Transaction module updated successfully.";
        }
      )

      .addCase(
        updateTransactionModule.rejected,
        (state, action: any) => {
          state.updateLoading = false;

          state.error =
            action.payload?.message ??
            "Failed to update transaction module.";
        }
      );

    /* ===================================================
       DELETE
    =================================================== */

    builder
      .addCase(deleteTransactionModule.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })

      .addCase(
        deleteTransactionModule.fulfilled,
        (state, action: any) => {
          state.deleteLoading = false;

          state.items = state.items.filter(
            (item) =>
              item.moduleCode !== action.payload.moduleCode
          );

          state.successMessage =
            "Transaction module deleted successfully.";
        }
      )

      .addCase(
        deleteTransactionModule.rejected,
        (state, action: any) => {
          state.deleteLoading = false;

          state.error =
            action.payload?.message ??
            "Failed to delete transaction module.";
        }
      );
  },
});

/* ===================================================
   EXPORTS
=================================================== */

export const {
  clearTransactionModuleError,
  clearTransactionModuleSuccessMessage,
  clearTransactionModuleState,
  clearSelectedTransactionModule,
} = transactionModuleSlice.actions;

export default transactionModuleSlice.reducer;