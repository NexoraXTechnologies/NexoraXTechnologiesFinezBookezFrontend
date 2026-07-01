import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// GET PROFESSIONAL USERS
export const getProfessionalUsers = createAsyncThunk(
  'professionalUser/getProfessionalUsers', async ({ page = 1, limit = 20, withParent = false }: { page?: number; limit?: number, withParent?: boolean }, { rejectWithValue }) => {
    try {
    // @ts-ignore
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
      console.log({ res })
    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to fetch users',
      });
    }

    // data
    const allData = res.data.data?.result || [];
    const childUsers = allData[0]?.ChildUsers || [];
      const filtered = withParent ? childUsers : childUsers.slice(1);

    const pagination = res.data.data?.pagination || null;

    return { users: filtered, pagination };
    } catch (err: any) {
    return rejectWithValue({
      message: err.response?.data?.message || 'Failed to fetch users',
    });
  }
});

// ADD NEW PROFESSIONAL USER
export const addProfessionalUser = createAsyncThunk(
  "professionalUser/addProfessionalUser",
  async (userData: any, { rejectWithValue }) => {
    try {
      // @ts-ignore
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
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to add user",
      });
    }
  }
);

// DELETE PROFESSIONAL USER
export const deleteProfessionalUser = createAsyncThunk(
  "professionalUser/deleteProfessionalUser",
  async (mobile: string, { rejectWithValue }) => {
    try {
      if (!mobile) {
        return rejectWithValue({ message: "Invalid mobile number" });
      }
      // @ts-ignore
      const professionalHeaders = JSON.parse(localStorage.getItem("professionalHeaders"));
      const parentMobile = professionalHeaders?.["x-db-name"];
      // @ts-ignore
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
    } catch (err: any) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to delete user",
      });
    }
  }
);

// update
export const updateProfessionalUser = createAsyncThunk(
  "professionalUser/updateUser",
  async ({ parentMobile, data }: { parentMobile: string; data: any }, { rejectWithValue }) => {
    alert("THUNK STARTED");
    console.log("isdsdsdd")
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/${parentMobile}`,
        data
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to update account",
        });

      return res.data?.data ?? null;
    } catch (err: any) {
      console.log(err)
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to update account",
      });
    }
  }
);

// SLICE
const professionalUserSlice = createSlice({
  name: 'professionalUser',
  initialState: {
    users: [],
    loading: false,
    updating:false,
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
      .addCase(getProfessionalUsers.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getProfessionalUsers.rejected, (state: any, action: any) => {
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
      .addCase(addProfessionalUser.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.addSuccess = true;
        state.users.push(action.payload);
      })
      .addCase(addProfessionalUser.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to add user';
      });

    // DELETE USER
    builder
      .addCase(deleteProfessionalUser.pending, (state: any) => {
        state.loading = true;
        state.error = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteProfessionalUser.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.deleteSuccess = true;
        state.users = state.users.filter((user: any) => user.userMobileNumberHash !== action.payload);
      })
      .addCase(deleteProfessionalUser.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete user';
      });

    // update 
    builder
      .addCase(updateProfessionalUser.pending, (state: any) => {
        state.updating = true;
      })
      .addCase(updateProfessionalUser.fulfilled, (state: any, action: any) => {
        state.updating = false;

        const updated = action.payload;
        if (!updated?.accountCode) return;

        state.users = state.users.map((acc: any) =>
          acc.accountCode === updated.accountCode ? updated : acc
        );
      })
      .addCase(updateProfessionalUser.rejected, (state: any, action: any) => {
        state.updating = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearProfessionalUserState } = professionalUserSlice.actions;
export default professionalUserSlice.reducer;