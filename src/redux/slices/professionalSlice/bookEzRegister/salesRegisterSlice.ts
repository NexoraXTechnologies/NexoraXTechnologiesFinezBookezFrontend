/* ===================================================
   SALES REGISTER SLICE
=================================================== */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
  message: string;
};

type SalesRegisterPayload = {
  fromDate: string;
  toDate: string;
  customerCode?: string;
  productCode?: string;
  customCodes?: string[];
  selectedColumns?: string[];
  offset?: number;
  limit?: number;
  exportType?: "pdf" | "excel" | "";
};

type SalesRegisterState = {
  addLoader: boolean;
  listingLoader: boolean;
  deleteLoader: boolean;
  exportLoader: boolean;
  salesRegisterData: any[];
  pagination: any;
  totals: any;
  error: string | null;
};

/* ===================================================
   GET SALES REGISTER
=================================================== */

export const addSalesRegister = createAsyncThunk<
  any,
  SalesRegisterPayload,
  { rejectValue: RejectValue }
>(
  "salesRegister/addSalesRegister",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookEZ/registers/salesRegister",
        { ...payload },
        payload?.exportType
          ? {
            responseType: "blob",
          }
          : undefined
      );

      if (payload?.exportType) {
        return {
          blob: res.data,
          exportType: payload.exportType,
        };
      }

      if (!res.data?.success) {
        return rejectWithValue({
          message: res?.data?.message || "Failed to fetch sales register",
        });
      }

      return res?.data?.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to fetch sales register",
      });
    }
  }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: SalesRegisterState = {
  addLoader: false,
  listingLoader: false,
  deleteLoader: false,
  exportLoader: false,
  salesRegisterData: [],
  pagination: {},
  totals: {},
  error: null,
};

/* ===================================================
   SLICE
=================================================== */

const salesRegisterSlice = createSlice({
  name: "salesRegister",
  initialState,
  reducers: {
    clearSalesRegisterError: (state) => {
      state.error = null;
    },

    clearSalesRegisterData: (state) => {
      state.salesRegisterData = [];
      state.pagination = {};
      state.totals = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addSalesRegister.pending, (state, action) => {
        if (action.meta.arg?.exportType) {
          state.exportLoader = true;
        } else {
          state.addLoader = true;
          state.listingLoader = true;
        }

        state.error = null;
      })

      .addCase(addSalesRegister.fulfilled, (state, action) => {
        state.addLoader = false;
        state.listingLoader = false;
        state.exportLoader = false;

        if (action.payload?.blob) {
          return;
        }

        const data = action.payload || {};

        state.salesRegisterData =
          data?.invoices ||
          data?.records ||
          data?.details ||
          data?.transactions ||
          data?.data ||
          [];

        state.pagination = data?.pagination || {};
        state.totals = data?.totals || data?.summary || data?.footer || {};
        state.error = null;
      })

      .addCase(addSalesRegister.rejected, (state, action) => {
        state.addLoader = false;
        state.listingLoader = false;
        state.exportLoader = false;

        state.error =
          action.payload?.message || "Failed to fetch sales register";
      });
  },
});

/* ===================================================
   EXPORTS
=================================================== */

export const { clearSalesRegisterError, clearSalesRegisterData } =
  salesRegisterSlice.actions;

export default salesRegisterSlice.reducer;