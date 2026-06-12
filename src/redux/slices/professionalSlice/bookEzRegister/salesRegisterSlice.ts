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
  payload: any;
};

type SalesRegisterState = {
  addLoader: boolean;
  listingLoader: boolean;
  deleteLoader: boolean;
  salesRegisterData: any;
  error: string | null;
};

/* ===================================================
   CREATE / GET SALES REGISTER
=================================================== */

export const addSalesRegister = createAsyncThunk<
  any,
  SalesRegisterPayload,
  { rejectValue: RejectValue }
>(
  "salesRegister/addSalesRegister",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookEZ/registers/salesRegister",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res?.data?.message || "Failed to create sales register",
        });
      }

      return res?.data?.data;
    } catch (error: any) {
      return rejectWithValue({
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to create sales register",
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
  salesRegisterData: null,
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
      state.salesRegisterData = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ADD / GET SALES REGISTER */
      .addCase(addSalesRegister.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })

      .addCase(addSalesRegister.fulfilled, (state, action) => {
        state.addLoader = false;
        state.salesRegisterData = action.payload;
        state.error = null;
      })

      .addCase(addSalesRegister.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create sales register";
      });
  },
});

/* ===================================================
   EXPORTS
=================================================== */

export const { clearSalesRegisterError, clearSalesRegisterData } =
  salesRegisterSlice.actions;

export default salesRegisterSlice.reducer;