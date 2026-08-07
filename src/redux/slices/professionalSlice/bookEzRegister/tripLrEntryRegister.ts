/* ===================================================
   TRIP LR REGISTER SLICE
=================================================== */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
  message: string;
};

type TripLrRegisterPayload = {
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

type TripLrRegisterState = {
  addLoader: boolean;
  listingLoader: boolean;
  deleteLoader: boolean;
  exportLoader: boolean;
  tripLrRegisterData: any[];
  pagination: any;
  totals: any;
  error: string | null;
};

/* ===================================================
   GET TRIP LR REGISTER
=================================================== */

export const addTripLrEntry = createAsyncThunk<
  any,
  TripLrRegisterPayload,
  { rejectValue: RejectValue }
>(
  "tripLrEntryRegister/addTripLrEntry",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookEZ/registers/lrRegister",
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
          message: res?.data?.message || "Failed to fetch trip lr register",
        });
      }

      return res?.data?.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to fetch trip lr register",
      });
    }
  }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: TripLrRegisterState = {
  addLoader: false,
  listingLoader: false,
  deleteLoader: false,
  exportLoader: false,
  tripLrRegisterData: [],
  pagination: {},
  totals: {},
  error: null,
};

/* ===================================================
   SLICE
=================================================== */

const tripLrRegisterSlice = createSlice({
  name: "tripLrRegister",
  initialState,

  reducers: {
    clearTripLrRegisterError: (state) => {
      state.error = null;
    },

    clearTripLrRegisterData: (state) => {
      state.tripLrRegisterData = [];
      state.pagination = {};
      state.totals = {};
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(addTripLrEntry.pending, (state, action) => {
        if (action.meta.arg?.exportType) {
          state.exportLoader = true;
        } else {
          state.addLoader = true;
          state.listingLoader = true;
        }

        state.error = null;
      })

      .addCase(addTripLrEntry.fulfilled, (state, action) => {
        state.addLoader = false;
        state.listingLoader = false;
        state.exportLoader = false;

        if (action.payload?.blob) {
          return;
        }

        const data = action.payload || {};

        state.tripLrRegisterData = data?.lrs || [];
        state.pagination = data?.pagination || {};
        state.totals = data?.totals || data?.summary || data?.footer || {};
        state.error = null;
      })

      .addCase(addTripLrEntry.rejected, (state, action) => {
        state.addLoader = false;
        state.listingLoader = false;
        state.exportLoader = false;

        state.error =
          action.payload?.message || "Failed to fetch trip lr entry";
      });
  },
});

/* ===================================================
   EXPORTS
=================================================== */

export const {
  clearTripLrRegisterError,
  clearTripLrRegisterData,
} = tripLrRegisterSlice.actions;

export default tripLrRegisterSlice.reducer;