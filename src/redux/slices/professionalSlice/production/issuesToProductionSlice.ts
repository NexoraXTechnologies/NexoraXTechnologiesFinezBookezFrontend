import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   ADD ISSUES TO PRODUCTION
=================================================== */

export const addIssuesToProduction = createAsyncThunk(
  "issuesToProduction/addIssuesToProduction",
  async ({ payload }: any, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/issuesToProduction/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to create issues to production",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to create issues to production",
      });
    }
  }
);

/* ===================================================
   UPDATE ISSUES TO PRODUCTION
=================================================== */

export const updateIssuesToProduction = createAsyncThunk(
  "issuesToProduction/updateIssuesToProduction",
  async (
    {
      payload,
      issuesToProductionVoucherNumber,
    }: {
      payload: any;
      issuesToProductionVoucherNumber: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/issuesToProduction/update/${issuesToProductionVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to update issues to production",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to update issues to production",
      });
    }
  }
);

/* ===================================================
   DELETE ISSUES TO PRODUCTION
=================================================== */

export const deleteIssuesToProduction = createAsyncThunk(
  "issuesToProduction/deleteIssuesToProduction",
  async (
    {
      issuesToProductionVoucherNumber,
    }: {
      issuesToProductionVoucherNumber: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/issuesToProduction/delete/${issuesToProductionVoucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to delete issues to production",
        });
      }

      return issuesToProductionVoucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to delete issues to production",
      });
    }
  }
);

/* ===================================================
   GET ISSUES TO PRODUCTION LIST
=================================================== */

export const getIssuesToProductionList = createAsyncThunk(
  "issuesToProduction/getIssuesToProductionList",
  async (
    {
      offset = 0,
      limit = 10,
      search = "",
    }: {
      offset?: number;
      limit?: number;
      search?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params: any = {
        offset,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/issuesToProduction/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to fetch issues to production",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch issues to production",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const issuesToProductionSlice = createSlice({
  name: "issuesToProduction",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    issuesToProductions: [] as any[],

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
    clearIssuesToProductionState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD ISSUES TO PRODUCTION ---------- */
      .addCase(addIssuesToProduction.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addIssuesToProduction.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addIssuesToProduction.rejected, (state, action: any) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create issues to production";
      })

      /* ---------- ISSUES TO PRODUCTION LISTING ---------- */
      .addCase(getIssuesToProductionList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getIssuesToProductionList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.issuesToProductions = action.payload?.records ?? [];
      })
      .addCase(getIssuesToProductionList.rejected, (state, action: any) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch issues to production";
        state.issuesToProductions = [];
      })

      /* ---------- UPDATE ISSUES TO PRODUCTION ---------- */
      .addCase(updateIssuesToProduction.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateIssuesToProduction.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateIssuesToProduction.rejected, (state, action: any) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update issues to production";
      })

      /* ---------- DELETE ISSUES TO PRODUCTION ---------- */
      .addCase(deleteIssuesToProduction.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteIssuesToProduction.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.issuesToProductions = state.issuesToProductions.filter(
          (item: any) =>
            item?.issuesToProductionVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteIssuesToProduction.rejected, (state, action: any) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete issues to production";
      });
  },
});

export const { clearIssuesToProductionState } =
  issuesToProductionSlice.actions;

export default issuesToProductionSlice.reducer;