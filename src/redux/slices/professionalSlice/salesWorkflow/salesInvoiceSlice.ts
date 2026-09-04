import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type GetAllSalesInvoiceParams = {
  limit?: number;
  offset?: number;
  search?: string;
  voucherNumber?: string;
  customerCode?: string;
  status?: "open" | "close";
};

type UpdateSalesInvoicePayload = {
  sInvVoucherNumber: string;
  payload: any;
};

type SalesReturnAnalysisParams = {
  voucherNumber: string;
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

  // add this
  byCustomerCodeSalesInvoice: any[];
  byCustomerCodeLoader: boolean;
  byCustomerCodeCount: number;

  // sales return analysis
  salesReturnAnalysis: any;
  salesReturnAnalysisLoader: boolean;
};

const initialState: SalesInvoiceState = {
  salesInvoices: [],
  selectedSalesInvoice: null,
  pagination: null,

  byCustomerCodeSalesInvoice: [],
  byCustomerCodeLoader: false,
  byCustomerCodeCount: 0,

  salesReturnAnalysis: null,
  salesReturnAnalysisLoader: false,

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
   getByVoucherNumber ALL SALES INVOICE
=================================================== */

export const getByVoucherNumberSalesInvoice = createAsyncThunk<any, GetAllSalesInvoiceParams | undefined, { rejectValue: RejectValue }>(
  "salesInvoice/getByVoucherNumberSalesInvoice",
  async (
    { voucherNumber }: any,
    { rejectWithValue }
  ) => {
    try {
      const encodedVoucher = encodeURIComponent(
        String(voucherNumber || "")
          .trim()
          .replace(/[\u2013\u2014]/g, "-")
      );

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/getByVoucherNumber/${encodedVoucher}`,
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
      console.log(err)
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
   SALES RETURN ANALYSIS BY SALES INVOICE VOUCHER
=================================================== */

export const getSalesReturnAnalysisByInvoiceVoucher = createAsyncThunk<
  any,
  SalesReturnAnalysisParams,
  { rejectValue: RejectValue }
>(
  "salesInvoice/getSalesReturnAnalysisByInvoiceVoucher",
  async ({ voucherNumber }, { rejectWithValue }) => {
    try {
      const encodedVoucher = encodeURIComponent(
        String(voucherNumber || "")
          .trim()
          .replace(/[\u2013\u2014]/g, "-")
      );

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoiceReturn/analysis/byInvoiceVoucharNumber/${encodedVoucher}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch sales return analysis",
        });
      }

      return res.data?.data ?? null;
    } catch (err: any) {
      console.log(err)
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to fetch sales return analysis",
      });
    }
  }
);

/* ===================================================
   getByCustomerCode ALL SALES INVOICE
=================================================== */

export const getByCustomerCodeSalesInvoice = createAsyncThunk<any, GetAllSalesInvoiceParams | undefined, { rejectValue: RejectValue }>(
  "salesInvoice/getByCustomerCodeSalesInvoice",
  async (
    { customerCode }: any,
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/byCustomerCode?customerCode=${customerCode}`,
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
      console.log(err)
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
      const encodedVoucher = encodeURIComponent(
        String(sInvVoucherNumber || "")
          .trim()
          .replace(/[\u2013\u2014]/g, "-")
      );

      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/update/${encodedVoucher}`,
        { ...payload }
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
      const encodedVoucher = encodeURIComponent(
        String(voucherNumber || "")
          .trim()
          .replace(/[\u2013\u2014]/g, "-")
      );

      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/delete/${encodedVoucher}`
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



// download frieght invoice pdf

// DOWNLOAD FREIGHT INVOICE PDF

export const downloadFrieghtInvoicePdf = createAsyncThunk<
  any,
  { voucherNumber: string; pdfData: any },
  { rejectValue: RejectValue }
>(
  "salesInvoice/downloadFrieghtInvoicePdf",
  async ({ voucherNumber, pdfData }, { rejectWithValue }) => {
    try {
      const encodedVoucher = encodeURIComponent(
        String(voucherNumber || "")
          .trim()
          .replace(/[\u2013\u2014]/g, "-")
      );

      const response = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/users/bookez/BookezReportPdf/download-pdf/TRANSPORTSALEINVOICE_VOUCHER/${encodedVoucher}`,
        { pdfData },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = pdfUrl;
      link.download = `${voucherNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(pdfUrl);

      return { success: true, voucherNumber };
    } catch (error: any) {
      let message = "Failed to download PDF";

      if (error?.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorJson = JSON.parse(errorText);
          message = errorJson?.message || errorJson?.error || message;
        } catch {
          message = error?.message || message;
        }
      } else {
        message = error?.response?.data?.message || error?.response?.data?.error || error?.message || message;
      }

      return rejectWithValue({ message });
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

      state.byCustomerCodeSalesInvoice = [];
      state.byCustomerCodeLoader = false;
      state.byCustomerCodeCount = 0;

      state.salesReturnAnalysis = null;
      state.salesReturnAnalysisLoader = false;

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

    clearSalesReturnAnalysis: (state) => {
      state.salesReturnAnalysis = null;
      state.salesReturnAnalysisLoader = false;
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
      .addCase(getByVoucherNumberSalesInvoice.pending, (state) => {
        state.detailsLoading = true;
        state.selectedSalesInvoice = null;
        state.error = null;
      })
      .addCase(getByVoucherNumberSalesInvoice.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedSalesInvoice = action.payload;
      })
      .addCase(getByVoucherNumberSalesInvoice.rejected, (state, action) => {
        state.detailsLoading = false;
        state.selectedSalesInvoice = null;
        state.error =
          action.payload?.message || "Failed to fetch sales invoice";
      })

      /* ================= SALES RETURN ANALYSIS ================= */
      .addCase(getSalesReturnAnalysisByInvoiceVoucher.pending, (state) => {
        state.salesReturnAnalysisLoader = true;
        state.salesReturnAnalysis = null;
        state.error = null;
      })
      .addCase(getSalesReturnAnalysisByInvoiceVoucher.fulfilled, (state, action) => {
        state.salesReturnAnalysisLoader = false;
        state.salesReturnAnalysis = action.payload;
      })
      .addCase(getSalesReturnAnalysisByInvoiceVoucher.rejected, (state, action) => {
        state.salesReturnAnalysisLoader = false;
        state.salesReturnAnalysis = null;
        state.error =
          action.payload?.message || "Failed to fetch sales return analysis";
      })

      /* ================= GET BY CUSTOMER CODE ================= */
      .addCase(getByCustomerCodeSalesInvoice.pending, (state) => {
        state.byCustomerCodeLoader = true;
        state.byCustomerCodeSalesInvoice = [];
        state.byCustomerCodeCount = 0;
        state.error = null;
      })

      .addCase(getByCustomerCodeSalesInvoice.fulfilled, (state, action) => {
        state.byCustomerCodeLoader = false;

        state.byCustomerCodeSalesInvoice = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];

        state.byCustomerCodeCount =
          action.payload?.count || state.byCustomerCodeSalesInvoice.length;
      })

      .addCase(getByCustomerCodeSalesInvoice.rejected, (state, action) => {
        state.byCustomerCodeLoader = false;
        state.byCustomerCodeSalesInvoice = [];
        state.byCustomerCodeCount = 0;

        state.error =
          action.payload?.message || "Failed to fetch sales invoices by customer";
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
  clearSalesReturnAnalysis,
} = salesInvoiceSlice.actions;

export default salesInvoiceSlice.reducer;