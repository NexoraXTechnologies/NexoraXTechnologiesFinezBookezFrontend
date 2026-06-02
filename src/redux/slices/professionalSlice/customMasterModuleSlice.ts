import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

//  get custome master listing
//  users/customMaster/data/getAll?moduleCode=CSTM-000003&offset=0&limit=50&serviceCode=&status=active

export const getCustomMasterListing = createAsyncThunk(
  "customMasterModule/listing",
  async (
    { moduleCode, offset = 0, limit = 10, search = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = { moduleCode, offset, limit, search };

      console.log("params", params)

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/customMaster/data/getAll`,
        { params }
      );

      console.log("custom master modules", res)

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res?.data?.message || "Failed to fetch custom master modules",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom master modules",
      });
    }
  }
);

export const getCustomMasterSchema = createAsyncThunk(
  "customMasterModule/getCustomMasterSchema",
  async (
    { moduleCode } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = { moduleCode };

      console.log("params", params)

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/customMaster/schema/getAll`,
        { params }
      );

      console.log("custom master modules", res)

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res?.data?.message || "Failed to fetch custom master modules",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom master modules",
      });
    }
  }
);


export const getCustomMasterModules = createAsyncThunk(
  "customMasterModule/getCustomMasterModules",
  async (
    { offset = 0, limit = 10, search = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = { offset, limit, search };

      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/customMaster/module/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res?.data?.message || "Failed to fetch custom master modules",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom master modules",
      });
    }
  }
);

export const updateCustomData = createAsyncThunk(
  "customMasterModule/updateCustomData",
  async ({ data, voucherNumber } = {}, { rejectWithValue }) => {
    try {

      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/customMaster/data/update/${voucherNumber}`,
        { data }
      );

      console.log("custom master modules", res)

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res?.data?.message || "Failed to fetch custom master modules",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom master modules",
      });
    }
  }
);

export const saveCustomData = createAsyncThunk(
  "customMasterModule/saveCustomData",
  async ({ data, moduleCode } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/users/customMaster/data/save`,
        { data, moduleCode }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res?.data?.message || "Failed to fetch custom master modules",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom master modules",
      });
    }
  }
);

export const deleteSingle = createAsyncThunk(
  "customMasterModule/deleteSingle",
  async ({ voucherNumber } = {}, { rejectWithValue }) => {
    try {

      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/customMaster/data/delete/${voucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res?.data?.message || "Failed to fetch custom master modules",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom master modules",
      });
    }
  }
);

export const searchData = createAsyncThunk(
  "customMasterModule/search",
  async ({ voucherNumber } = {}, { rejectWithValue }) => {
    try {

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/customMaster/data/getByVoucher/${voucherNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res?.data?.message || "Failed to fetch custom master modules",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom master modules",
      });
    }
  }
);

const initialState = {
  listing: [],
  customMasterModules: [],
  inputSchema: [],
  pagination: null,
  loading: false,
  submitLoader: false,
  deleteLoader: false,
  error: null,
};

const customMasterModules = createSlice({
  name: "customMasterModule",
  initialState,
  reducers: {
    clearCustomMasterModuleState: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCustomMasterModules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomMasterModules.fulfilled, (state, action) => {
        state.loading = false;

        state.customMasterModules =
          action.payload?.items ||
          action.payload?.docs ||
          action.payload ||
          [];

        state.pagination = action.payload?.pagination || null;
      })
      .addCase(getCustomMasterModules.rejected, (state, action: any) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch custom master modules";
      })

      // listing
      .addCase(getCustomMasterListing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomMasterListing.fulfilled, (state, action) => {
        state.loading = false;

        state.listing = action.payload?.items,
          state.pagination = action.payload?.pagination || null;
      })
      .addCase(getCustomMasterListing.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch custom master modules";
      })

      // single data
      .addCase(getCustomMasterSchema.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomMasterSchema.fulfilled, (state, action) => {
        state.loading = false;

        state.inputSchema = action.payload?.fields,
          state.pagination = action.payload?.pagination || null;
      })
      .addCase(getCustomMasterSchema.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch custom master modules";
      })

      // save data
      .addCase(updateCustomData.pending, (state) => {
        state.submitLoader = true;
        state.error = null;
      })
      .addCase(updateCustomData.fulfilled, (state, action) => {
        state.submitLoader = false;
      })
      .addCase(updateCustomData.rejected, (state, action: any) => {
        state.submitLoader = false;
        state.error = action.payload?.message || "Failed to fetch custom master modules";
      })
      // save data
      .addCase(deleteSingle.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteSingle.fulfilled, (state, action) => {
        state.deleteLoader = false;
      })
      .addCase(deleteSingle.rejected, (state, action: any) => {
        state.deleteLoader = false;
        state.error = action.payload?.message || "Failed to fetch custom master modules";
      })

      // search data
      .addCase(searchData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchData.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(searchData.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch custom master modules";
      })
  },
});

export const { clearCustomMasterModuleState } = customMasterModules.actions;

export default customMasterModules.reducer;