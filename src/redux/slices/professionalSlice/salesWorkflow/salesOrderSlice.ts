import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type GetAllSalesOrderParams = {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "open" | "close";
};

type UpdateSalesOrderPayload = {
  voucherNumber: string;
  data: any;
};

type SalesOrderState = {
  salesOrders: any[];
  selectedSalesOrder: any;
  pagination: any;
  loading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  detailsLoading: boolean;
  error: string | null;
};

const initialState: SalesOrderState = {
  salesOrders: [],
  selectedSalesOrder: null,
  pagination: null,

  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  detailsLoading: false,

  error: null,
};

/* ===================================================
   CREATE SALES ORDER
=================================================== */

export const createSalesOrder = createAsyncThunk<
  any,
  any,
  { rejectValue: RejectValue }
>("salesOrder/createSalesOrder", async (payload, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post(
      "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesOrder/save",
      payload
    );

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || "Failed to create sales order",
      });
    }

    return res.data?.data ?? null;
  } catch (err: any) {
    return rejectWithValue({
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create sales order",
    });
  }
});

/* ===================================================
   GET ALL SALES ORDER
=================================================== */

export const getAllSalesOrder = createAsyncThunk<
  any,
  GetAllSalesOrderParams | undefined,
  { rejectValue: RejectValue }
>(
  "salesOrder/getAllSalesOrder",
  async (
    { limit = 200, offset = 0, search = "", status = "" }: any,
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
        "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesOrder/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch sales orders",
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
          "Failed to fetch sales orders",
      });
    }
  }
);

/* ===================================================
   GET SALES ORDER BY VOUCHER NUMBER
=================================================== */

export const getSalesOrderByVoucherNumber = createAsyncThunk<
  any,
  string,
  { rejectValue: RejectValue }
>(
  "salesOrder/getSalesOrderByVoucherNumber",
  async (voucherNumber, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesOrder/getByVoucherNumber/${voucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch sales order",
        });
      }

      return (
        res.data?.data?.salesOrder ||
        res.data?.data?.record ||
        res.data?.data ||
        null
      );
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to fetch sales order",
      });
    }
  }
);

/* ===================================================
   UPDATE SALES ORDER
=================================================== */

export const updateSalesOrder = createAsyncThunk<
  any,
  UpdateSalesOrderPayload,
  { rejectValue: RejectValue }
>(
  "salesOrder/updateSalesOrder",
  async ({ voucherNumber, data }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesOrder/update/${voucherNumber}`,
        data
      );
      console.log("salesorder update payload",data)

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update sales order",
        });
      }

      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update sales order",
      });
    }
  }
);

/* ===================================================
   DELETE SALES ORDER
=================================================== */

export const deleteSalesOrder = createAsyncThunk<
  string,
  string,
  { rejectValue: RejectValue }
>("salesOrder/deleteSalesOrder", async (voucherNumber, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.delete(
      `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesOrder/delete/${voucherNumber}`
    );

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || "Failed to delete sales order",
      });
    }

    return voucherNumber;
  } catch (err: any) {
    return rejectWithValue({
      message:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to delete sales order",
    });
  }
});

/* ===================================================
   SALES ORDER SLICE
=================================================== */

const salesOrderSlice = createSlice({
  name: "salesOrder",
  initialState,
  reducers: {
    clearSalesOrderState: (state) => {
      state.salesOrders = [];
      state.selectedSalesOrder = null;
      state.pagination = null;

      state.loading = false;
      state.createLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;
      state.detailsLoading = false;

      state.error = null;
    },

    clearSelectedSalesOrder: (state) => {
      state.selectedSalesOrder = null;
    },

    clearSalesOrderError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ================= CREATE ================= */
      .addCase(createSalesOrder.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createSalesOrder.fulfilled, (state) => {
        state.createLoading = false;
      })
      .addCase(createSalesOrder.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload?.message || "Failed to create sales order";
      })

      /* ================= GET ALL ================= */
      .addCase(getAllSalesOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllSalesOrder.fulfilled, (state, action) => {
        state.loading = false;

        const data: any = action.payload;

        state.salesOrders = data?.records ?? [];
        state.pagination = data?.pagination ?? null;
      })
      .addCase(getAllSalesOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch sales orders";
        state.salesOrders = [];
        state.pagination = null;
      })

      /* ================= GET BY VOUCHER ================= */
      .addCase(getSalesOrderByVoucherNumber.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
        state.selectedSalesOrder = null;
      })
      .addCase(getSalesOrderByVoucherNumber.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedSalesOrder = action.payload;
      })
      .addCase(getSalesOrderByVoucherNumber.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload?.message || "Failed to fetch sales order";
        state.selectedSalesOrder = null;
      })

      /* ================= UPDATE ================= */
      .addCase(updateSalesOrder.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateSalesOrder.fulfilled, (state) => {
        state.updateLoading = false;
      })
      .addCase(updateSalesOrder.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload?.message || "Failed to update sales order";
      })

      /* ================= DELETE ================= */
      .addCase(deleteSalesOrder.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteSalesOrder.fulfilled, (state, action) => {
        state.deleteLoading = false;

        state.salesOrders = state.salesOrders.filter(
          (item: any) => item?.sOrderVoucherNumber !== action.payload
        );

        if (
          state.selectedSalesOrder?.sOrderVoucherNumber === action.payload
        ) {
          state.selectedSalesOrder = null;
        }
      })
      .addCase(deleteSalesOrder.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload?.message || "Failed to delete sales order";
      });
  },
});

export const {
  clearSalesOrderState,
  clearSelectedSalesOrder,
  clearSalesOrderError,
} = salesOrderSlice.actions;

export default salesOrderSlice.reducer;