import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// =======================================================
// GET PROFESSIONAL USERS
// =======================================================
export const getProfessionalUsers = createAsyncThunk('professionalUser/getProfessionalUsers', async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
  try {
    const professionalHeaders = JSON.parse(localStorage.getItem('professionalHeaders'));
    const parentMobile = professionalHeaders?.['x-db-name'];

    if (!parentMobile) {
      return rejectWithValue({ message: 'Parent user mobile number not found in localStorage' });
    }

    const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users`, {
      params: {
        userMobileNumberHash: parentMobile,
        page,
        limit,
      },
    });

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to fetch users',
      });
    }

    // data
    const allData = res.data.data?.result || [];
    const childUsers = allData[0]?.ChildUsers || [];
    const filtered = childUsers.slice(1);

    const pagination = res.data.data?.pagination || null;

    return { users: filtered, pagination };
  } catch (err) {
    return rejectWithValue({
      message: err.response?.data?.message || 'Failed to fetch users',
    });
  }
});

// =======================================================
// ADD NEW PROFESSIONAL USER
// =======================================================
export const addProfessionalUser = createAsyncThunk(
  "professionalUser/addProfessionalUser",
  async (userData, { rejectWithValue }) => {
    try {
      
      const professionalHeaders = JSON.parse(localStorage.getItem("professionalHeaders"));
      const parentMobile = professionalHeaders?.["x-db-name"];
      if (!parentMobile) {
        return rejectWithValue({ message: "Parent user mobile number not found in localStorage" });
      }

      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/users/${parentMobile}/child`,
        userData,
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to add user",
        });
      }

      return res.data.data?.ChildUser || userData;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to add user",
      });
    }
  }
);

// =======================================================
// DELETE PROFESSIONAL USER
// =======================================================
export const deleteProfessionalUser = createAsyncThunk(
  "professionalUser/deleteProfessionalUser",
  async (mobile, { rejectWithValue }) => {
    try {
      if (!mobile) {
        return rejectWithValue({ message: "Invalid mobile number" });
      }

      const professionalHeaders = JSON.parse(localStorage.getItem("professionalHeaders"));
      const parentMobile = professionalHeaders?.["x-db-name"];
      const professionalUser = JSON.parse(localStorage.getItem("professionalUser"));
      const parentName = professionalUser?.name;
      
      const payload = {
        parentMobileNumber: parentMobile,  // from localStorage
        parentName:parentName             // hard-coded value
      };
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/${mobile}`,{
          data: payload  // axios DELETE body
        }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete user",
        });
      }

      return mobile;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to delete user",
      });
    }
  }
);

// =======================================================
// SLICE
// =======================================================
const professionalUserSlice = createSlice({
  name: 'professionalUser',
  initialState: {
    users: [],
    loading: false,
    error: null,
    deleteSuccess: false,
    addSuccess: false,

    // ✅ pagination state
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalDocs: 0,
      limit: 10,
      offset: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  },
  reducers: {
    clearProfessionalUserState: (state) => {
      state.loading = false;
      state.error = null;
      state.deleteSuccess = false;
      state.addSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // GET USERS
    builder
      .addCase(getProfessionalUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfessionalUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getProfessionalUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });

    // ADD USER
    builder
      .addCase(addProfessionalUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.addSuccess = false;
      })
      .addCase(addProfessionalUser.fulfilled, (state, action) => {
        state.loading = false;
        state.addSuccess = true;
        state.users.push(action.payload);
      })
      .addCase(addProfessionalUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to add user';
      });

    // DELETE USER
    builder
      .addCase(deleteProfessionalUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteProfessionalUser.fulfilled, (state, action) => {
        state.loading = false;
        state.deleteSuccess = true;
        state.users = state.users.filter((user) => user.userMobileNumberHash !== action.payload);
      })
      .addCase(deleteProfessionalUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete user';
      });
  },
});

export const { clearProfessionalUserState } = professionalUserSlice.actions;
export default professionalUserSlice.reducer;