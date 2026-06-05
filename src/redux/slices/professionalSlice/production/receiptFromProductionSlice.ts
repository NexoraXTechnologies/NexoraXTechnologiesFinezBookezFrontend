import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   ADD RECEIPT FROM PRODUCTION
=================================================== */

export const addReceiptFromProduction = createAsyncThunk(
  "receiptFromProduction/addReceiptFromProduction",
  async ({ payload }: any, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/receiptFromProduction/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to create receipt from production",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to create receipt from production",
      });
    }
  }
);

/* ===================================================
   UPDATE RECEIPT FROM PRODUCTION
=================================================== */

export const updateReceiptFromProduction = createAsyncThunk(
  "receiptFromProduction/updateReceiptFromProduction",
  async (
    {
      payload,
      receiptFromProductionVoucherNumber,
    }: {
      payload: any;
      receiptFromProductionVoucherNumber: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/receiptFromProduction/update/${receiptFromProductionVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to update receipt from production",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to update receipt from production",
      });
    }
  }
);

/* ===================================================
   DELETE RECEIPT FROM PRODUCTION
=================================================== */

export const deleteReceiptFromProduction = createAsyncThunk(
  "receiptFromProduction/deleteReceiptFromProduction",
  async (
    {
      receiptFromProductionVoucherNumber,
    }: {
      receiptFromProductionVoucherNumber: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/receiptFromProduction/delete/${receiptFromProductionVoucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to delete receipt from production",
        });
      }

      return receiptFromProductionVoucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to delete receipt from production",
      });
    }
  }
);

/* ===================================================
   GET RECEIPT FROM PRODUCTION LIST
=================================================== */

export const getReceiptFromProductionList = createAsyncThunk(
  "receiptFromProduction/getReceiptFromProductionList",
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
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/receiptFromProduction/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to fetch receipt from production",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch receipt from production",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const receiptFromProductionSlice = createSlice({
  name: "receiptFromProduction",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    receiptFromProductions: [] as any[],

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
    clearReceiptFromProductionState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD RECEIPT FROM PRODUCTION ---------- */
      .addCase(addReceiptFromProduction.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addReceiptFromProduction.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addReceiptFromProduction.rejected, (state, action: any) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create receipt from production";
      })

      /* ---------- RECEIPT FROM PRODUCTION LISTING ---------- */
      .addCase(getReceiptFromProductionList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getReceiptFromProductionList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.receiptFromProductions = action.payload?.records ?? [];
      })
      .addCase(getReceiptFromProductionList.rejected, (state, action: any) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch receipt from production";
        state.receiptFromProductions = [];
      })

      /* ---------- UPDATE RECEIPT FROM PRODUCTION ---------- */
      .addCase(updateReceiptFromProduction.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateReceiptFromProduction.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateReceiptFromProduction.rejected, (state, action: any) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update receipt from production";
      })

      /* ---------- DELETE RECEIPT FROM PRODUCTION ---------- */
      .addCase(deleteReceiptFromProduction.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteReceiptFromProduction.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.receiptFromProductions = state.receiptFromProductions.filter(
          (item: any) =>
            item?.receiptFromProductionVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteReceiptFromProduction.rejected, (state, action: any) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete receipt from production";
      });
  },
});

export const { clearReceiptFromProductionState } =
  receiptFromProductionSlice.actions;

export default receiptFromProductionSlice.reducer;