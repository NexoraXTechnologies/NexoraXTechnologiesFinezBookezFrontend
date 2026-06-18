import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type PurchaseInvoiceParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
};
type PurchaseVendorInvoiceParams = {
  vendorCode?: string;

};
type PurchaseVaucherNumberInvoiceParams = {
  voucherNumber?: string;

};

type PurchaseInvoicePayload = {
  payload: any;
};

type UpdatePurchaseInvoicePayload = {
  payload: any;
  purchaseInvoiceNumber: string;
};

type DeletePurchaseInvoicePayload = {
  purchaseInvoiceNumber: string;
};

/* ===================================================
   ADD PURCHASE INVOICE
=================================================== */

export const addPurchaseInvoice = createAsyncThunk<
  any,
  PurchaseInvoicePayload,
  { rejectValue: RejectValue }
>(
  "purchaseInvoice/addPurchaseInvoice",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseInvoice/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create purchase invoice",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create purchase invoice",
      });
    }
  }
);

/* ===================================================
   UPDATE PURCHASE INVOICE
=================================================== */

export const updatePurchaseInvoice = createAsyncThunk<
  any,
  UpdatePurchaseInvoicePayload,
  { rejectValue: RejectValue }
>(
  "purchaseInvoice/updatePurchaseInvoice",
  async ({ payload, purchaseInvoiceNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseInvoice/update/${purchaseInvoiceNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update purchase invoice",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update purchase invoice",
      });
    }
  }
);

/* ===================================================
   DELETE PURCHASE INVOICE
=================================================== */

export const deletePurchaseInvoice = createAsyncThunk<
  any,
  DeletePurchaseInvoicePayload,
  { rejectValue: RejectValue }
>(
  "purchaseInvoice/deletePurchaseInvoice",
  async ({ purchaseInvoiceNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseInvoice/delete/${purchaseInvoiceNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete purchase invoice",
        });
      }

      return purchaseInvoiceNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete purchase invoice",
      });
    }
  }
);

/* ===================================================
   GET PURCHASE INVOICE LIST
=================================================== */

export const getPurchaseInvoiceList = createAsyncThunk<
  any,
  PurchaseInvoiceParams | undefined,
  { rejectValue: RejectValue }
>(
  "purchaseInvoice/getPurchaseInvoiceList",
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
        "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseInvoice/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch purchase invoices",
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
          err?.response?.data?.message || "Failed to fetch purchase invoices",
      });
    }
  }
);
/* ===================================================
   GET Vendor Wise Purchase Invoice
=================================================== */

export const getByVoucherNumberPurchaseInvoiceList = createAsyncThunk<
  any,
  PurchaseVaucherNumberInvoiceParams | undefined,
  { rejectValue: RejectValue }
>(
  "purchaseInvoice/getByVoucherNumberPurchaseInvoiceList",
  async (
    { voucherNumber } = {},
    { rejectWithValue }
  ) => {
    try {


      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseInvoice/getByVoucherNumber/${voucherNumber}`,
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch purchase invoices",
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
          err?.response?.data?.message || "Failed to fetch purchase invoices",
      });
    }
  }
);
/* ===================================================
   GET Vendor Wise Purchase Invoice
=================================================== */

export const GetVendorWisePurchaseInvoiceList = createAsyncThunk<
  any,
  PurchaseVendorInvoiceParams | undefined,
  { rejectValue: RejectValue }
>(
  "purchaseInvoice/GetVendorWisePurchaseInvoiceList",
  async (
    { vendorCode } = {},
    { rejectWithValue }
  ) => {
    try {
      const params: any = {
        vendorCode
      };

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseInvoice/byVendorCode/${vendorCode}`,
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch purchase invoices",
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
          err?.response?.data?.message || "Failed to fetch purchase invoices",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const purchaseInvoiceSlice = createSlice({
  name: "purchaseInvoice",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    purchaseInvoiceList: [] as any[],
    selectedPurchaseInvoice: null as any,

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
    clearPurchaseInvoiceState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedPurchaseInvoice: (state) => {
      state.selectedPurchaseInvoice = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD PURCHASE INVOICE ---------- */
      .addCase(addPurchaseInvoice.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addPurchaseInvoice.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addPurchaseInvoice.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create purchase invoice";
      })

      /* ---------- PURCHASE INVOICE LISTING ---------- */
      .addCase(getPurchaseInvoiceList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getPurchaseInvoiceList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.purchaseInvoiceList = action.payload?.records ?? [];
      })
      .addCase(getPurchaseInvoiceList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch purchase invoices";
        state.purchaseInvoiceList = [];
      })
      /* ---------- PURCHASE INVOICE LISTING vendor wise ---------- */
      .addCase(GetVendorWisePurchaseInvoiceList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(GetVendorWisePurchaseInvoiceList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.purchaseInvoiceList = action.payload?.records ?? [];
      })
      .addCase(GetVendorWisePurchaseInvoiceList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch purchase invoices";
        state.purchaseInvoiceList = [];
      })
      /* ---------- PURCHASE INVOICE LISTING voucher number  wise ---------- */
      .addCase(getByVoucherNumberPurchaseInvoiceList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getByVoucherNumberPurchaseInvoiceList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.purchaseInvoiceList = action.payload?.records ?? [];
      })
      .addCase(getByVoucherNumberPurchaseInvoiceList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch purchase invoices";
        state.purchaseInvoiceList = [];
      })

      /* ---------- UPDATE PURCHASE INVOICE ---------- */
      .addCase(updatePurchaseInvoice.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updatePurchaseInvoice.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updatePurchaseInvoice.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update purchase invoice";
      })

      /* ---------- DELETE PURCHASE INVOICE ---------- */
      .addCase(deletePurchaseInvoice.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deletePurchaseInvoice.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.purchaseInvoiceList = state.purchaseInvoiceList.filter(
          (item: any) =>
            item?.purchaseInvoiceNumber !== action.payload &&
            item?.pInvVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deletePurchaseInvoice.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete purchase invoice";
      });
  },
});

export const {
  clearPurchaseInvoiceState,
  clearSelectedPurchaseInvoice,
} = purchaseInvoiceSlice.actions;

export default purchaseInvoiceSlice.reducer;