import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type SalesQuotationParams = {
  offset?: number;
  limit?: number;
  status?: string;
  docStatus?: string;
  search?: string;
  isAutoPost?: string | boolean;
};

type SalesQuotationPayload = {
  payload: any;
};

type UpdateSalesQuotationPayload = {
  payload: any;
  sQuoteVoucherNumber: string;
};

type DeleteSalesQuotationPayload = {
  sQuoteVoucherNumber: string;
};

/* ===================================================
   ADD SALES QUOTATION
=================================================== */

export const addSalesQuotation = createAsyncThunk<
  any,
  SalesQuotationPayload,
  { rejectValue: RejectValue }
>(
  "salesQuotation/addSalesQuotation",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create sales quotation",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create sales quotation",
      });
    }
  }
);

/* ===================================================
   UPDATE SALES QUOTATION
=================================================== */

export const updateSalesQuotation = createAsyncThunk<
  any,
  UpdateSalesQuotationPayload,
  { rejectValue: RejectValue }
>(
  "salesQuotation/updateSalesQuotation",
  async ({ payload, sQuoteVoucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/update/${sQuoteVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update sales quotation",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to update sales quotation",
      });
    }
  }
);

/* ===================================================
   DELETE SALES QUOTATION
=================================================== */

export const deleteSalesQuotation = createAsyncThunk<
  any,
  DeleteSalesQuotationPayload,
  { rejectValue: RejectValue }
>(
  "salesQuotation/deleteSalesQuotation",
  async (sQuoteVoucherNumber , { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/delete/${sQuoteVoucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete sales quotation",
        });
      }

      return sQuoteVoucherNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete sales quotation",
      });
    }
  }
);

/* ===================================================
   GET SALES QUOTATION LIST
=================================================== */

export const getSalesQuotationList = createAsyncThunk<
  any,
  SalesQuotationParams | undefined,
  { rejectValue: RejectValue }
>(
  "salesQuotation/getSalesQuotationList",
  async (
    {
      offset = 0,
      limit = 10,
      status = "",
      docStatus = "",
      search = "",
      isAutoPost = "",
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

      if (docStatus) {
        params.docStatus = docStatus;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      if (
        isAutoPost !== "" &&
        isAutoPost !== undefined &&
        isAutoPost !== null
      ) {
        params.isAutoPost = isAutoPost;
      }

      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesQuotation/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch sales quotations",
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
          "Failed to fetch sales quotations",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const salesQuotationSlice = createSlice({
  name: "salesQuotation",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    salesQuotations: [] as any[],
    selectedSalesQuotation: null as any,

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
    clearSalesQuotationState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedSalesQuotation: (state) => {
      state.selectedSalesQuotation = null;
    },

    setSelectedSalesQuotation: (state, action) => {
      state.selectedSalesQuotation = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD SALES QUOTATION ---------- */
      .addCase(addSalesQuotation.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addSalesQuotation.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addSalesQuotation.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create sales quotation";
      })

      /* ---------- SALES QUOTATION LISTING ---------- */
      .addCase(getSalesQuotationList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getSalesQuotationList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.salesQuotations = action.payload?.records ?? [];
      })
      .addCase(getSalesQuotationList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch sales quotations";
        state.salesQuotations = [];
      })

      /* ---------- UPDATE SALES QUOTATION ---------- */
      .addCase(updateSalesQuotation.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateSalesQuotation.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateSalesQuotation.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update sales quotation";
      })

      /* ---------- DELETE SALES QUOTATION ---------- */
      .addCase(deleteSalesQuotation.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteSalesQuotation.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.salesQuotations = state.salesQuotations.filter(
          (item: any) =>
            item?.sQuoteVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        if (
          state.selectedSalesQuotation?.sQuoteVoucherNumber === action.payload ||
          state.selectedSalesQuotation?.voucherNumber === action.payload
        ) {
          state.selectedSalesQuotation = null;
        }

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteSalesQuotation.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete sales quotation";
      });
  },
});

export const {
  clearSalesQuotationState,
  clearSelectedSalesQuotation,
  setSelectedSalesQuotation,
} = salesQuotationSlice.actions;

export default salesQuotationSlice.reducer;