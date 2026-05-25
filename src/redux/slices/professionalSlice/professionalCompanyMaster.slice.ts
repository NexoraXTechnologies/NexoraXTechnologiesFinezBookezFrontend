import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

/* ===================================================
    CREATE COMPANY
=================================================== */
export const createCompany = createAsyncThunk(
  "professionalCompanyMaster/createCompany",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/companyMaster/createCompany",
        payload
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to create company",
        });

      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to create company",
      });
    }
  }
);

/* ===================================================
    GET COMPANY
=================================================== */
export const getCompany = createAsyncThunk(
  "professionalCompanyMaster/getCompany",
  async (_, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/companyMaster/getCompany"
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch company",
        });

      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch company",
      });
    }
  }
);

/* ===================================================
    REPLACE COMPANY (Update whole record)
=================================================== */
export const replaceCompany = createAsyncThunk(
  "professionalCompanyMaster/replaceCompany",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        "/eTaxSolnMongoApiBackend/companyMaster/replaceCompany",
        payload
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to replace company",
        });

      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to replace company",
      });
    }
  }
);

/* ===================================================
    VERIFY IFSC
=================================================== */
export const verifyIFSC = createAsyncThunk(
  "professionalCompanyMaster/verifyIFSC",
  async (ifscCode, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/companyMaster/verifyIFSC",
        { ifsc: ifscCode }
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "IFSC verification failed",
        });

      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "IFSC verification failed",
      });
    }
  }
);

/* ===================================================
    SLICE
=================================================== */
const professionalCompanyMasterSlice = createSlice({
  name: "professionalCompanyMaster",

  initialState: {
    company: null,

    loading: false,
    error: null,

    createLoading: false,
    updateLoading: false,
    verifyLoading: false,
  },

  reducers: {
    clearProfessionalCompanyState: (state) => {
      state.error = null;
      state.createLoading = false;
      state.updateLoading = false;
      state.verifyLoading = false;
    },
  },

  extraReducers: (builder) => {
    /* ---------------- GET COMPANY ---------------- */
    builder
      .addCase(getCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.company = action.payload ?? null;
      })
      .addCase(getCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.company = null; // clear redux when company not found
      });

    /* ---------------- CREATE COMPANY ---------------- */
    builder
      .addCase(createCompany.pending, (state) => {
        state.createLoading = true;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.createLoading = false;
        state.company = action.payload ?? null;
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------------- REPLACE COMPANY ---------------- */
    builder
      .addCase(replaceCompany.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(replaceCompany.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.company = action.payload ?? null;
      })
      .addCase(replaceCompany.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------------- IFSC VERIFY ---------------- */
    builder
      .addCase(verifyIFSC.pending, (state) => {
        state.verifyLoading = true;
      })
      .addCase(verifyIFSC.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.ifscDetails = action.payload ?? null;
      })
      .addCase(verifyIFSC.rejected, (state, action) => {
        state.verifyLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearProfessionalCompanyState } =
  professionalCompanyMasterSlice.actions;

export default professionalCompanyMasterSlice.reducer;
