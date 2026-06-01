import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

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

const initialState = {
  customMasterModules: [],
  pagination: null,
  loading: false,
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
      });
  },
});

export const { clearCustomMasterModuleState } =
  customMasterModules.actions;

export default customMasterModules.reducer;