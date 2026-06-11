import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type GetAllSalesInvoiceReturnParams = {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "open" | "close";
};

type UpdateSalesInvoiceReturnPayload = {
  sInvReturnVoucherNumber: string;
  payload: any;
};

type SalesInvoiceReturnState = {
  salesInvoiceReturns: any[];
  selectedSalesInvoiceReturn: any;
  pagination: any;
  loading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  detailsLoading: boolean;
  error: string | null;
};

const initialState: SalesInvoiceReturnState = {
  salesInvoiceReturns: [],
  selectedSalesInvoiceReturn: null,
  pagination: null,

  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  detailsLoading: false,

  error: null,
};

/* ===================================================
   CREATE SALES INVOICE RETURN
=================================================== */

export const createSalesInvoiceReturn = createAsyncThunk<
  any,
  any,
  { rejectValue: RejectValue }
>(
  "salesInvoiceReturn/createSalesInvoiceReturn",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoiceReturn/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create sales invoice return",
        });
      }

      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create sales invoice return",
      });
    }
  }
);

/* ===================================================
   GET ALL SALES INVOICE RETURN
=================================================== */

export const getAllSalesInvoiceReturn = createAsyncThunk<
  any,
  GetAllSalesInvoiceReturnParams | undefined,
  { rejectValue: RejectValue }
>(
  "salesInvoiceReturn/getAllSalesInvoiceReturn",
  async (
    { limit = 200, offset = 0, search = "", status = "open" } = {},
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
        "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoiceReturn/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch sales invoice returns",
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
          "Failed to fetch sales invoice returns",
      });
    }
  }
);

/* ===================================================
   GET SALES INVOICE RETURN BY VOUCHER NUMBER
=================================================== */

export const getSalesInvoiceReturnByVoucherNumber = createAsyncThunk<
  any,
  string,
  { rejectValue: RejectValue }
>(
  "salesInvoiceReturn/getSalesInvoiceReturnByVoucherNumber",
  async (voucherNumber, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoiceReturn/getByVoucherNumber/${voucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch sales invoice return",
        });
      }

      return (
        res.data?.data?.salesInvoiceReturn ||
        res.data?.data?.record ||
        res.data?.data ||
        null
      );
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to fetch sales invoice return",
      });
    }
  }
);

/* ===================================================
   UPDATE SALES INVOICE RETURN
=================================================== */

export const updateSalesInvoiceReturn = createAsyncThunk<
  any,
  UpdateSalesInvoiceReturnPayload,
  { rejectValue: RejectValue }
>(
  "salesInvoiceReturn/updateSalesInvoiceReturn",
  async ({ sInvReturnVoucherNumber, payload }: any, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoiceReturn/update/${sInvReturnVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update sales invoice return",
        });
      }

      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update sales invoice return",
      });
    }
  }
);

/* ===================================================
   DELETE SALES INVOICE RETURN
=================================================== */

export const deleteSalesInvoiceReturn = createAsyncThunk<
  string,
  string,
  { rejectValue: RejectValue }
>(
  "salesInvoiceReturn/deleteSalesInvoiceReturn",
  async (voucherNumber, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoiceReturn/delete/${voucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete sales invoice return",
        });
      }

      return voucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete sales invoice return",
      });
    }
  }
);

/* ===================================================
   SALES INVOICE RETURN SLICE
=================================================== */

const salesInvoiceReturnSlice = createSlice({
  name: "salesInvoiceReturn",
  initialState,
  reducers: {
    clearSalesInvoiceReturnState: (state) => {
      state.salesInvoiceReturns = [];
      state.selectedSalesInvoiceReturn = null;
      state.pagination = null;

      state.loading = false;
      state.createLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;
      state.detailsLoading = false;

      state.error = null;
    },

    clearSelectedSalesInvoiceReturn: (state) => {
      state.selectedSalesInvoiceReturn = null;
    },

    clearSalesInvoiceReturnError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= CREATE ================= */
      .addCase(createSalesInvoiceReturn.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createSalesInvoiceReturn.fulfilled, (state) => {
        state.createLoading = false;
      })
      .addCase(createSalesInvoiceReturn.rejected, (state, action) => {
        state.createLoading = false;
        state.error =
          action.payload?.message || "Failed to create sales invoice return";
      })

      /* ================= GET ALL ================= */
      .addCase(getAllSalesInvoiceReturn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSalesInvoiceReturn.fulfilled, (state, action) => {
        state.loading = false;

        const data: any = action.payload;

        state.salesInvoiceReturns = data?.records ?? [];
        state.pagination = data?.pagination ?? null;
      })
      .addCase(getAllSalesInvoiceReturn.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch sales invoice returns";
        state.salesInvoiceReturns = [];
        state.pagination = null;
      })

      /* ================= GET BY VOUCHER ================= */
      .addCase(getSalesInvoiceReturnByVoucherNumber.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
        state.selectedSalesInvoiceReturn = null;
      })
      .addCase(
        getSalesInvoiceReturnByVoucherNumber.fulfilled,
        (state, action) => {
          state.detailsLoading = false;
          state.selectedSalesInvoiceReturn = action.payload;
        }
      )
      .addCase(
        getSalesInvoiceReturnByVoucherNumber.rejected,
        (state, action) => {
          state.detailsLoading = false;
          state.error =
            action.payload?.message || "Failed to fetch sales invoice return";
          state.selectedSalesInvoiceReturn = null;
        }
      )

      /* ================= UPDATE ================= */
      .addCase(updateSalesInvoiceReturn.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateSalesInvoiceReturn.fulfilled, (state) => {
        state.updateLoading = false;
      })
      .addCase(updateSalesInvoiceReturn.rejected, (state, action) => {
        state.updateLoading = false;
        state.error =
          action.payload?.message || "Failed to update sales invoice return";
      })

      /* ================= DELETE ================= */
      .addCase(deleteSalesInvoiceReturn.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteSalesInvoiceReturn.fulfilled, (state, action) => {
        state.deleteLoading = false;

        state.salesInvoiceReturns = state.salesInvoiceReturns.filter(
          (item: any) => item?.sInvReturnVoucherNumber !== action.payload
        );

        if (
          state.selectedSalesInvoiceReturn?.sInvReturnVoucherNumber ===
          action.payload
        ) {
          state.selectedSalesInvoiceReturn = null;
        }
      })
      .addCase(deleteSalesInvoiceReturn.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error =
          action.payload?.message || "Failed to delete sales invoice return";
      });
  },
});

export const {
  clearSalesInvoiceReturnState,
  clearSelectedSalesInvoiceReturn,
  clearSalesInvoiceReturnError,
} = salesInvoiceReturnSlice.actions;

export default salesInvoiceReturnSlice.reducer;