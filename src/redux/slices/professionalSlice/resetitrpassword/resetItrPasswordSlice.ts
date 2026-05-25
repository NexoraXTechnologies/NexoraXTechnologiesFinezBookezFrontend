import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import professionalAxios from '../../../../services/professionalAxios';

/* ===================================================
   RESET PASSWORD
=================================================== */
export const resetItrPassword = createAsyncThunk('resetItrPassword/resetPassword', async (payload, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post('/eTaxSolnMongoApiBackend/create/resetPWD', payload);

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to reset password',
      });
    }

    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to reset password',
    });
  }
});

/* ===================================================
   VERIFY RESET PASSWORD OTP
=================================================== */
export const verifyResetItrPasswordOtp = createAsyncThunk('resetItrPassword/verifyOtp', async (payload, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post('/eTaxSolnMongoApiBackend/create/resetPwdOtp', payload);

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to verify OTP',
      });
    }

    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to verify OTP',
    });
  }
});

/* ===================================================
   START RESET PASSWORD AUTOMATION
=================================================== */
export const startResetPasswordAutomation = createAsyncThunk('resetItrPassword/startAutomation', async (payload, { rejectWithValue }) => {
  try {
    const res = await axios.post('https://tvqv0u7ec8.execute-api.ap-south-1.amazonaws.com/api/automation/resetPassword/start', payload);

    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to start reset password automation',
    });
  }
});

/* ===================================================
   GET AUTOMATION STATUS BY ID
=================================================== */
export const fetchResetPasswordStatusById = createAsyncThunk('resetItrPassword/fetchStatusById', async (jobId, { rejectWithValue }) => {
  try {
    const res = await axios.get(`https://tvqv0u7ec8.execute-api.ap-south-1.amazonaws.com/api/automation/status/${jobId}`);

    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to fetch automation status',
    });
  }
});

/* ===================================================
   DELETE AUTOMATION JOB BY ID
=================================================== */
export const deleteResetPasswordJobById = createAsyncThunk('resetItrPassword/deleteJobById', async (jobId, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`https://tvqv0u7ec8.execute-api.ap-south-1.amazonaws.com/api/automation/jobs/${jobId}`);

    return {
      ...(res.data?.data || {}),
      jobId,
      message: res.data?.message || 'Job deleted successfully',
    };
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to delete automation job',
    });
  }
});

/* ===================================================
   INITIAL STATE
=================================================== */
const initialState = {
  resetPasswordResponse: null,
  otpVerificationResponse: null,
  automationStartResponse: null,
  automationStatusResponse: null,
  deleteJobResponse: null,

  loading: false,
  otpLoading: false,
  automationLoading: false,
  statusLoading: false,
  deleteLoading: false,

  error: null,
};

/* ===================================================
   SLICE
=================================================== */
const resetItrPasswordSlice = createSlice({
  name: 'resetItrPassword',
  initialState,
  reducers: {
    resetResetItrPasswordState: (state) => {
      state.resetPasswordResponse = null;
      state.otpVerificationResponse = null;
      state.automationStartResponse = null;
      state.automationStatusResponse = null;
      state.deleteJobResponse = null;

      state.loading = false;
      state.otpLoading = false;
      state.automationLoading = false;
      state.statusLoading = false;
      state.deleteLoading = false;

      state.error = null;
    },

    clearResetItrPasswordError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ================= RESET PASSWORD ================= */
      .addCase(resetItrPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetItrPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.resetPasswordResponse = action.payload;
      })
      .addCase(resetItrPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      })

      /* ================= VERIFY OTP ================= */
      .addCase(verifyResetItrPasswordOtp.pending, (state) => {
        state.otpLoading = true;
        state.error = null;
      })
      .addCase(verifyResetItrPasswordOtp.fulfilled, (state, action) => {
        state.otpLoading = false;
        state.otpVerificationResponse = action.payload;
      })
      .addCase(verifyResetItrPasswordOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.error = action.payload?.message || 'Something went wrong';
      })

      /* ================= START AUTOMATION ================= */
      .addCase(startResetPasswordAutomation.pending, (state) => {
        state.automationLoading = true;
        state.error = null;
      })
      .addCase(startResetPasswordAutomation.fulfilled, (state, action) => {
        state.automationLoading = false;
        state.automationStartResponse = action.payload;
      })
      .addCase(startResetPasswordAutomation.rejected, (state, action) => {
        state.automationLoading = false;
        state.error = action.payload?.message || 'Something went wrong';
      })

      /* ================= FETCH STATUS ================= */
      .addCase(fetchResetPasswordStatusById.pending, (state) => {
        state.statusLoading = true;
        state.error = null;
      })
      .addCase(fetchResetPasswordStatusById.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.automationStatusResponse = action.payload;
      })
      .addCase(fetchResetPasswordStatusById.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = action.payload?.message || 'Something went wrong';
      })

      /* ================= DELETE JOB ================= */
      .addCase(deleteResetPasswordJobById.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteResetPasswordJobById.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteJobResponse = action.payload;
      })
      .addCase(deleteResetPasswordJobById.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

export const { resetResetItrPasswordState, clearResetItrPasswordError } = resetItrPasswordSlice.actions;

export default resetItrPasswordSlice.reducer;
