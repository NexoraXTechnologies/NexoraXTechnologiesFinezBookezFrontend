import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type GetAllSalesInvoiceParams = {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "open" | "close";
};

type UpdateSalesInvoicePayload = {
  sInvVoucherNumber: string;
  payload: any;
};

type SalesInvoiceState = {
  salesInvoices: any[];
  selectedSalesInvoice: any;
  pagination: any;
  loading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  detailsLoading: boolean;
  error: string | null;
};

const initialState: SalesInvoiceState = {
  salesInvoices: [],
  selectedSalesInvoice: null,
  pagination: null,

  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  detailsLoading: false,

  error: null,
};

/* ===================================================
   CREATE SALES INVOICE
=================================================== */

export const createSalesInvoice = createAsyncThunk<
  any,
  any,
  { rejectValue: RejectValue }
  >("salesInvoice/createSalesInvoice", async ({ payload }, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post(
      "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/save",
      { ...payload }
    );

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || "Failed to create sales invoice",
      });
    }

    return res.data?.data ?? null;
  } catch (err: any) {
    return rejectWithValue({
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create sales invoice",
    });
  }
});

/* ===================================================
   GET ALL SALES INVOICE
=================================================== */

export const getAllSalesInvoice = createAsyncThunk<
  any,
  GetAllSalesInvoiceParams | undefined,
  { rejectValue: RejectValue }
>(
  "salesInvoice/getAllSalesInvoice",
  async (
    { limit = 200, offset = 0, search = "", status = "open" }: any,
    { rejectWithValue }
  ) => {
    try {
      const params: any = {
        limit,
        offset,
        status,
      };

      if (search?.trim()) {
        params.search = search.trim();
      }

      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch sales invoices",
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
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to fetch sales invoices",
      });
    }
  }
);

/* ===================================================
   GET SALES INVOICE BY VOUCHER NUMBER
=================================================== */

export const getSalesInvoiceByVoucherNumber = createAsyncThunk<
  any,
  string,
  { rejectValue: RejectValue }
>(
  "salesInvoice/getSalesInvoiceByVoucherNumber",
  async (voucherNumber, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/getByVoucherNumber/${voucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch sales invoice",
        });
      }

      return (
        res.data?.data?.salesInvoice ||
        res.data?.data?.record ||
        res.data?.data ||
        null
      );
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to fetch sales invoice",
      });
    }
  }
);

/* ===================================================
   UPDATE SALES INVOICE
=================================================== */

export const updateSalesInvoice = createAsyncThunk<
  any,
  UpdateSalesInvoicePayload,
  { rejectValue: RejectValue }
>(
  "salesInvoice/updateSalesInvoice",
  async ({ sInvVoucherNumber, payload }: any, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/update/${sInvVoucherNumber}`,
        {...payload}
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update sales invoice",
        });
      }

      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update sales invoice",
      });
    }
  }
);

/* ===================================================
   DELETE SALES INVOICE
=================================================== */

export const deleteSalesInvoice = createAsyncThunk<
  string,
  string,
  { rejectValue: RejectValue }
>(
  "salesInvoice/deleteSalesInvoice",
  async (voucherNumber, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/delete/${voucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete sales invoice",
        });
      }

      return voucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete sales invoice",
      });
    }
  }
);

/* ===================================================
   SALES INVOICE SLICE
=================================================== */

const salesInvoiceSlice = createSlice({
  name: "salesInvoice",
  initialState,
  reducers: {
    clearSalesInvoiceState: (state) => {
      state.salesInvoices = [];
      state.selectedSalesInvoice = null;
      state.pagination = null;

      state.loading = false;
      state.createLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;
      state.detailsLoading = false;

      state.error = null;
    },

    clearSelectedSalesInvoice: (state) => {
      state.selectedSalesInvoice = null;
    },

    clearSalesInvoiceError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= CREATE ================= */
      .addCase(createSalesInvoice.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createSalesInvoice.fulfilled, (state) => {
        state.createLoading = false;
      })
      .addCase(createSalesInvoice.rejected, (state, action) => {
        state.createLoading = false;
        state.error =
          action.payload?.message || "Failed to create sales invoice";
      })

      /* ================= GET ALL ================= */
      .addCase(getAllSalesInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSalesInvoice.fulfilled, (state, action) => {
        state.loading = false;

        const data: any = action.payload;

        state.salesInvoices = data?.records ?? [];
        state.pagination = data?.pagination ?? null;
      })
      .addCase(getAllSalesInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch sales invoices";
        state.salesInvoices = [];
        state.pagination = null;
      })

      /* ================= GET BY VOUCHER ================= */
      .addCase(getSalesInvoiceByVoucherNumber.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
        state.selectedSalesInvoice = null;
      })
      .addCase(getSalesInvoiceByVoucherNumber.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedSalesInvoice = action.payload;
      })
      .addCase(getSalesInvoiceByVoucherNumber.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error =
          action.payload?.message || "Failed to fetch sales invoice";
        state.selectedSalesInvoice = null;
      })

      /* ================= UPDATE ================= */
      .addCase(updateSalesInvoice.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateSalesInvoice.fulfilled, (state) => {
        state.updateLoading = false;
      })
      .addCase(updateSalesInvoice.rejected, (state, action) => {
        state.updateLoading = false;
        state.error =
          action.payload?.message || "Failed to update sales invoice";
      })

      /* ================= DELETE ================= */
      .addCase(deleteSalesInvoice.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteSalesInvoice.fulfilled, (state, action) => {
        state.deleteLoading = false;

        state.salesInvoices = state.salesInvoices.filter(
          (item: any) => item?.sInvVoucherNumber !== action.payload
        );

        if (
          state.selectedSalesInvoice?.sInvVoucherNumber === action.payload
        ) {
          state.selectedSalesInvoice = null;
        }
      })
      .addCase(deleteSalesInvoice.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error =
          action.payload?.message || "Failed to delete sales invoice";
      });
  },
});

export const {
  clearSalesInvoiceState,
  clearSelectedSalesInvoice,
  clearSalesInvoiceError,
} = salesInvoiceSlice.actions;

export default salesInvoiceSlice.reducer;