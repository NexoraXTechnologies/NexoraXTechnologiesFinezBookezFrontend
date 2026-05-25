import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// =======================================================
// GET PROFILE
// =======================================================
export const getProfessionalProfile = createAsyncThunk(
  "professionalProfile/getProfessionalProfile",
  async (_, { rejectWithValue }) => {
    try {
      // Get mobile number from localStorage
      const professionalHeaders = JSON.parse(localStorage.getItem("professionalHeaders"));
      const mobile = professionalHeaders?.loginuser;

      if (!mobile) {
        return rejectWithValue({ message: "Mobile number not found in localStorage" });
      }

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/${mobile}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch profile",
        });
      }

      return res.data.data?.ChildUsers;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to fetch profile",
      });
    }
  }
);

// =======================================================
// UPDATE PROFILE
// =======================================================
export const updateProfessionalProfile = createAsyncThunk(
  "professionalProfile/updateProfessionalProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const professionalHeaders = JSON.parse(localStorage.getItem("professionalHeaders"));
      const mobile = professionalHeaders?.["x-db-name"];

      if (!mobile) {
        return rejectWithValue({ message: "Mobile number not found in localStorage" });
      }

      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/${mobile}`,
        profileData,
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update profile",
        });
      }

      return res.data.data?.ChildUsers || profileData;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to update profile",
      });
    }
  }
);

// =======================================================
// SLICE
// =======================================================
const professionalProfileSlice = createSlice({
  name: "professionalProfile",
  initialState: {
    profile: null,
    loading: false,
    error: null,
    updateSuccess: false,
  },
  reducers: {
    clearProfileState: (state) => {
      state.loading = false;
      state.error = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // GET PROFILE
    builder
      .addCase(getProfessionalProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfessionalProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getProfessionalProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Something went wrong";
      });

    // UPDATE PROFILE
    builder
      .addCase(updateProfessionalProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateProfessionalProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.updateSuccess = true;
      })
      .addCase(updateProfessionalProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update profile";
      });
  },
});

export const { clearProfileState } = professionalProfileSlice.actions;
export default professionalProfileSlice.reducer;