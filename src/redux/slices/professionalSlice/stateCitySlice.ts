import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// =======================================================
// GET LOCATION BY PINCODE
// =======================================================
export const getLocationByPincode = createAsyncThunk(
  "stateCity/getLocationByPincode",
  async (pincode: string, { rejectWithValue }) => {
    try {
      if (!pincode) {
        return rejectWithValue({ message: "Pincode is required" });
      }

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/location/byPincode/${pincode}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch location by pincode",
        });
      }

      return res.data?.data?.data || null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err.response?.data?.message || "Failed to fetch location by pincode",
      });
    }
  }
);

// =======================================================
// GET STATES LIST (with search)
// =======================================================
export const getStates = createAsyncThunk(
  "stateCity/getStates",
  async (searchText: string = "", { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/statesMaster?offset=0&limit=100&search=${searchText}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch states",
        });
      }

      return res?.data?.data?.records || [];
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to fetch states",
      });
    }
  }
);

// =======================================================
// GET CITIES BY STATE (with search)
// =======================================================
export const getCitiesByState = createAsyncThunk(
  "stateCity/getCitiesByState",
  async ({ stateCode, searchText = "" }: { stateCode: string, searchText: string }, { rejectWithValue }) => {
    try {
      if (!stateCode) {
        return rejectWithValue({ message: "State code is required" });
      }

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/citiesByStateCode?offset=0&limit=600&stateCode=${stateCode}&search=${searchText}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch cities",
        });
      }

      return res.data.data?.records || [];
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to fetch cities",
      });
    }
  }
);

// =======================================================
// SLICE
// =======================================================
const stateCitySlice = createSlice({
  name: "stateCity",
  initialState: {
    states: [],
    cities: [],
    pincodeLocation: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearStateCityState: (state) => {
      state.states = [];
      state.cities = [];
      state.pincodeLocation = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // GET STATES
    builder
      .addCase(getStates.pending, (state: any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStates.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.states = action.payload;
      })
      .addCase(getStates.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Something went wrong";
      });

    // GET CITIES
    builder
      .addCase(getCitiesByState.pending, (state: any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCitiesByState.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.cities = action.payload;
      })
      .addCase(getCitiesByState.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Something went wrong";
      });
    // GET LOCATION BY PINCODE
    builder
      .addCase(getLocationByPincode.pending, (state: any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLocationByPincode.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.pincodeLocation = action.payload;
      })
      .addCase(getLocationByPincode.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Something went wrong";
      });
  },
});

export const { clearStateCityState } = stateCitySlice.actions;
export default stateCitySlice.reducer;
