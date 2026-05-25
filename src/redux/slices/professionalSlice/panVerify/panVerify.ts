import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstanceNoAuth from '../../../../services/axiosInstanceNoAuth';
import professionalAxios from '../../../../services/professionalAxios'; // ✅ add this

// ✅ WITHOUT HEADER (Registration time)
export const verifyPan = createAsyncThunk('verifyPan/post', async ({ pan }, { rejectWithValue }) => {
  try {
    const res = await axiosInstanceNoAuth.post('/eTaxSolnMongoApiBackend/users/taxpayers/verifyPan', { pan });

    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to verify PAN');
  }
});

// ✅ WITH HEADER (Logged-in / protected APIs)
export const verifyPanWithHeader = createAsyncThunk('verifyPan/postWithHeader', async ({ pan }, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post('/eTaxSolnMongoApiBackend/users/taxpayers/verifyPan', { pan });

    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to verify PAN');
  }
});

const verifyPanSlice = createSlice({
  name: 'verifyPan',
  initialState: {
    data: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetVerifyPan: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder

      // 🔹 WITHOUT HEADER
      .addCase(verifyPan.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(verifyPan.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.success = true;
      })
      .addCase(verifyPan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      // 🔹 WITH HEADER
      .addCase(verifyPanWithHeader.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(verifyPanWithHeader.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.success = true;
      })
      .addCase(verifyPanWithHeader.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetVerifyPan } = verifyPanSlice.actions;
export default verifyPanSlice.reducer;
