import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type PaymentParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
  voucherNumber?: string;
};

type PaymentPayload = {
  payload: any;
};

type UpdatePaymentPayload = {
  payload: any;
  paymentVoucherNumber: string;
};

type DeletePaymentPayload = {
  paymentVoucherNumber: string;
};

/* ===================================================
   ADD PAYMENT
=================================================== */

export const addPayment = createAsyncThunk<
  any,
  PaymentPayload,
  { rejectValue: RejectValue }
>(
  "payment/addPayment",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/payment/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create payment",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to create payment",
      });
    }
  }
);

/* ===================================================
   UPDATE PAYMENT
=================================================== */

export const updatePayment = createAsyncThunk<
  any,
  UpdatePaymentPayload,
  { rejectValue: RejectValue }
>(
  "payment/updatePayment",
  async ({ payload, paymentVoucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/payment/update/${paymentVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update payment",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to update payment",
      });
    }
  }
);

/* ===================================================
   DELETE PAYMENT
=================================================== */

export const deletePayment = createAsyncThunk<
  any,
  DeletePaymentPayload,
  { rejectValue: RejectValue }
>(
  "payment/deletePayment",
  async ({ paymentVoucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/payment/delete/${paymentVoucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete payment",
        });
      }

      return paymentVoucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to delete payment",
      });
    }
  }
);

/* ===================================================
   GET PAYMENT LIST
=================================================== */

export const getAllPayment = createAsyncThunk<
  any,
  PaymentParams | undefined,
  { rejectValue: RejectValue }
>(
  "payment/getAllPayment",
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
        "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/payment/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch payments",
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
        message: err?.response?.data?.message || "Failed to fetch payments",
      });
    }
  }
);
/* ===================================================
   GET PAYMENT LIST
=================================================== */

export const getByVoucherNumberPayment = createAsyncThunk<
  any,
  PaymentParams | undefined,
  { rejectValue: RejectValue }
>(
  "payment/getByVoucherNumberPayment",
  async (
    { voucherNumber } = {},
    { rejectWithValue }
  ) => {
    try {


      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/payment/getByVoucherNumber/${voucherNumber}`,

      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch payments",
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
        message: err?.response?.data?.message || "Failed to fetch payments",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const paymentSlice = createSlice({
  name: "payment",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    paymentList: [] as any[],
    selectedPayment: null as any,

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
    clearPaymentState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD PAYMENT ---------- */
      .addCase(addPayment.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addPayment.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addPayment.rejected, (state, action) => {
        state.addLoader = false;
        state.error = action.payload?.message || "Failed to create payment";
      })

      /* ---------- PAYMENT LISTING ---------- */
      .addCase(getAllPayment.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getAllPayment.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.paymentList = action.payload?.records ?? [];
      })
      .addCase(getAllPayment.rejected, (state, action) => {
        state.listingLoader = false;
        state.error = action.payload?.message || "Failed to fetch payments";
        state.paymentList = [];
      })
      /* ---------- PAYMENT getByVoucherNumberPayment LISTING ---------- */
      .addCase(getByVoucherNumberPayment.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getByVoucherNumberPayment.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.paymentList = action.payload?.records ?? [];
      })
      .addCase(getByVoucherNumberPayment.rejected, (state, action) => {
        state.listingLoader = false;
        state.error = action.payload?.message || "Failed to fetch payments";
        state.paymentList = [];
      })

      /* ---------- UPDATE PAYMENT ---------- */
      .addCase(updatePayment.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updatePayment.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.addLoader = false;
        state.error = action.payload?.message || "Failed to update payment";
      })

      /* ---------- DELETE PAYMENT ---------- */
      .addCase(deletePayment.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.paymentList = state.paymentList.filter(
          (item: any) =>
            item?.paymentVoucherNumber !== action.payload &&
            item?.paymentNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error = action.payload?.message || "Failed to delete payment";
      });
  },
});

export const { clearPaymentState, clearSelectedPayment } =
  paymentSlice.actions;

export default paymentSlice.reducer;