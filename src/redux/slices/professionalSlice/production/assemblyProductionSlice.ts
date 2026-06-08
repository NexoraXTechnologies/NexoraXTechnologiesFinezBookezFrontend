import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   ADD ASSEMBLY PRODUCTION
=================================================== */

export const addAssemblyProduction = createAsyncThunk(
  "assemblyProduction/addAssemblyProduction",
  async ({ payload }: any, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to create assembly production",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create assembly production",
      });
    }
  }
);

/* ===================================================
   UPDATE ASSEMBLY PRODUCTION
=================================================== */

export const updateAssemblyProduction = createAsyncThunk(
  "assemblyProduction/updateAssemblyProduction",
  async (
    {
      payload,
      assemblyProductionVoucherNumber,
    }: {
      payload: any;
      assemblyProductionVoucherNumber: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/update/${assemblyProductionVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to update assembly production",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update assembly production",
      });
    }
  }
);

/* ===================================================
   DELETE ASSEMBLY PRODUCTION
=================================================== */

export const deleteAssemblyProduction = createAsyncThunk(
  "assemblyProduction/deleteAssemblyProduction",
  async (
    {
      assemblyProductionVoucherNumber,
    }: {
      assemblyProductionVoucherNumber: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/delete/${assemblyProductionVoucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to delete assembly production",
        });
      }

      return assemblyProductionVoucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete assembly production",
      });
    }
  }
);

/* ===================================================
   GET ASSEMBLY PRODUCTION LIST
=================================================== */

export const getAssemblyProductionList = createAsyncThunk(
  "assemblyProduction/getAssemblyProductionList",
  async (
    {
      offset = 0,
      limit = 10,
      search = "",
      status = "",
    }: {
      offset?: number;
      limit?: number;
      search?: string;
      status?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params: any = {
        offset,
        limit,
      };

      if (status) {
        params.status = status;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to fetch assembly productions",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to fetch assembly productions",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const assemblyProductionSlice = createSlice({
  name: "assemblyProduction",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    assemblyProductions: [] as any[],

    error: null as string | null,

    pagination: {
      offset: 0,
      limit: 10,
      totalDocs: 0,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  },

  reducers: {
    clearAssemblyProductionState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD ASSEMBLY PRODUCTION ---------- */
      .addCase(addAssemblyProduction.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addAssemblyProduction.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addAssemblyProduction.rejected, (state, action: any) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create assembly production";
      })

      /* ---------- ASSEMBLY PRODUCTION LISTING ---------- */
      .addCase(getAssemblyProductionList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getAssemblyProductionList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.assemblyProductions = action.payload?.records ?? [];
      })
      .addCase(getAssemblyProductionList.rejected, (state, action: any) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch assembly productions";
        state.assemblyProductions = [];
      })

      /* ---------- UPDATE ASSEMBLY PRODUCTION ---------- */
      .addCase(updateAssemblyProduction.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateAssemblyProduction.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateAssemblyProduction.rejected, (state, action: any) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update assembly production";
      })

      /* ---------- DELETE ASSEMBLY PRODUCTION ---------- */
      .addCase(deleteAssemblyProduction.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteAssemblyProduction.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.assemblyProductions = state.assemblyProductions.filter(
          (item: any) =>
            item?.assemblyProductionVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteAssemblyProduction.rejected, (state, action: any) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete assembly production";
      });
  },
});

export const { clearAssemblyProductionState } =
  assemblyProductionSlice.actions;

export default assemblyProductionSlice.reducer;