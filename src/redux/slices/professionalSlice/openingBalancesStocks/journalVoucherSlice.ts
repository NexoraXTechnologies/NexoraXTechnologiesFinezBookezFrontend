import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type JournalVoucherParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
};

type JournalVoucherPayload = {
  payload: any;
};

type UpdateJournalVoucherPayload = {
  payload: any;
  journalVoucherNumber: string;
};

type DeleteJournalVoucherPayload = {
  journalVoucherNumber: string;
};

/* ===================================================
   ADD JOURNAL VOUCHER
=================================================== */

export const addJournalVoucher = createAsyncThunk<
  any,
  JournalVoucherPayload,
  { rejectValue: RejectValue }
>(
  "journalVoucher/addJournalVoucher",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/journalVoucher/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create journal voucher",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create journal voucher",
      });
    }
  }
);

/* ===================================================
   UPDATE JOURNAL VOUCHER
=================================================== */

export const updateJournalVoucher = createAsyncThunk<
  any,
  UpdateJournalVoucherPayload,
  { rejectValue: RejectValue }
>(
  "journalVoucher/updateJournalVoucher",
  async ({ payload, journalVoucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/journalVoucher/update/${journalVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update journal voucher",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update journal voucher",
      });
    }
  }
);

/* ===================================================
   DELETE JOURNAL VOUCHER
=================================================== */

export const deleteJournalVoucher = createAsyncThunk<
  any,
  DeleteJournalVoucherPayload,
  { rejectValue: RejectValue }
>(
  "journalVoucher/deleteJournalVoucher",
  async ({ journalVoucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/journalVoucher/delete/${journalVoucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete journal voucher",
        });
      }

      return journalVoucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete journal voucher",
      });
    }
  }
);

/* ===================================================
   GET JOURNAL VOUCHER LIST
=================================================== */

export const getJournalVoucherList = createAsyncThunk<
  any,
  JournalVoucherParams | undefined,
  { rejectValue: RejectValue }
>(
  "journalVoucher/getJournalVoucherList",
  async (
    { offset = 0, limit = 10, status = "", search = "" } = {},
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
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/journalVoucher/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch journal vouchers",
        });
      }

      return (
        res.data?.data ?? {
          records: [],
          pagination: null,
        }
      );
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch journal vouchers",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const journalVoucherSlice = createSlice({
  name: "journalVoucher",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    journalVouchers: [] as any[],
    selectedJournalVoucher: null as any,

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
    clearJournalVoucherState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedJournalVoucher: (state) => {
      state.selectedJournalVoucher = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD JOURNAL VOUCHER ---------- */
      .addCase(addJournalVoucher.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addJournalVoucher.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addJournalVoucher.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create journal voucher";
      })

      /* ---------- JOURNAL VOUCHER LISTING ---------- */
      .addCase(getJournalVoucherList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getJournalVoucherList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.journalVouchers = action.payload?.records ?? [];
      })
      .addCase(getJournalVoucherList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch journal vouchers";
        state.journalVouchers = [];
      })

      /* ---------- UPDATE JOURNAL VOUCHER ---------- */
      .addCase(updateJournalVoucher.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateJournalVoucher.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateJournalVoucher.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update journal voucher";
      })

      /* ---------- DELETE JOURNAL VOUCHER ---------- */
      .addCase(deleteJournalVoucher.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteJournalVoucher.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.journalVouchers = state.journalVouchers.filter(
          (item: any) =>
            item?.journalVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteJournalVoucher.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete journal voucher";
      });
  },
});

export const {
  clearJournalVoucherState,
  clearSelectedJournalVoucher,
} = journalVoucherSlice.actions;

export default journalVoucherSlice.reducer;