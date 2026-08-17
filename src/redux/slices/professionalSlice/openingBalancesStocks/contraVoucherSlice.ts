import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type ContraVoucherParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
};

type ContraVoucherPayload = {
  payload: any;
};

type UpdateContraVoucherPayload = {
  payload: any;
  contraVoucherNumber: string;
};

type DeleteContraVoucherPayload = {
  contraVoucherNumber: string;
};

type GetContraVoucherByVoucherPayload = {
  voucherNumber: string;
}
/* ===================================================
   ADD CONTRA VOUCHER
=================================================== */

export const addContraVoucher = createAsyncThunk<
  any,
  ContraVoucherPayload,
  { rejectValue: RejectValue }
>(
  "contraVoucher/addContraVoucher",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/contraVoucher/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create contra voucher",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create contra voucher",
      });
    }
  }
);

/* ===================================================
   UPDATE CONTRA VOUCHER
=================================================== */

export const updateContraVoucher = createAsyncThunk<
  any,
  UpdateContraVoucherPayload,
  { rejectValue: RejectValue }
>(
  "contraVoucher/updateContraVoucher",
  async ({ payload, contraVoucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/contraVoucher/update/${contraVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update contra voucher",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update contra voucher",
      });
    }
  }
);

/* ===================================================
   DELETE CONTRA VOUCHER
=================================================== */

export const deleteContraVoucher = createAsyncThunk<
  any,
  DeleteContraVoucherPayload,
  { rejectValue: RejectValue }
>(
  "contraVoucher/deleteContraVoucher",
  async ({ contraVoucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/contraVoucher/delete/${contraVoucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete contra voucher",
        });
      }

      return contraVoucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete contra voucher",
      });
    }
  }
);

/* ===================================================
   GET CONTRA VOUCHER LIST
=================================================== */

export const getContraVoucherList = createAsyncThunk<
  any,
  ContraVoucherParams | undefined,
  { rejectValue: RejectValue }
>(
  "contraVoucher/getContraVoucherList",
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
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/contraVoucher/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch contra vouchers",
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
          err?.response?.data?.message || "Failed to fetch contra vouchers",
      });
    }
  }
);



/* ===================================================
   GET DEBIT NOTE BY VOUCHER NUMBER
=================================================== */

export const getContraVoucherByVoucherNumber = createAsyncThunk<
  any,
  GetContraVoucherByVoucherPayload,
  { rejectValue: RejectValue }
>(
  "contraVoucherSlice/getContraVoucherByVoucherNumber",
  async ({ voucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/contraVoucher/getByVoucherNo/${encodeURIComponent(
          voucherNumber
        )}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to fetch debit note",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch debit note",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const contraVoucherSlice = createSlice({
  name: "contraVoucher",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    contraVouchers: [] as any[],
    selectedContraVoucher: null as any,

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
    clearContraVoucherState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedContraVoucher: (state) => {
      state.selectedContraVoucher = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD CONTRA VOUCHER ---------- */
      .addCase(addContraVoucher.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addContraVoucher.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addContraVoucher.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create contra voucher";
      })


      /* ---------- GET CREDIT NOTE BY VOUCHER ---------- */
      .addCase(getContraVoucherByVoucherNumber.pending, (state) => {
        state.error = null;
        state.selectedContraVoucher = null;
      })
      .addCase(getContraVoucherByVoucherNumber.fulfilled, (state, action) => {
        state.selectedContraVoucher =
          action.payload || null;

        state.error = null;
      })
      .addCase(getContraVoucherByVoucherNumber.rejected, (state, action) => {
        state.selectedContraVoucher = null;

        state.error =
          action.payload?.message ||
          "Failed to fetch contra voucher";
      })



      /* ---------- CONTRA VOUCHER LISTING ---------- */
      .addCase(getContraVoucherList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getContraVoucherList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.contraVouchers = action.payload?.records ?? [];
      })
      .addCase(getContraVoucherList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch contra vouchers";
        state.contraVouchers = [];
      })

      /* ---------- UPDATE CONTRA VOUCHER ---------- */
      .addCase(updateContraVoucher.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateContraVoucher.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateContraVoucher.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update contra voucher";
      })

      /* ---------- DELETE CONTRA VOUCHER ---------- */
      .addCase(deleteContraVoucher.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteContraVoucher.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.contraVouchers = state.contraVouchers.filter(
          (item: any) =>
            item?.contraVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteContraVoucher.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete contra voucher";
      });
  },
});

export const {
  clearContraVoucherState,
  clearSelectedContraVoucher,
} = contraVoucherSlice.actions;

export default contraVoucherSlice.reducer;