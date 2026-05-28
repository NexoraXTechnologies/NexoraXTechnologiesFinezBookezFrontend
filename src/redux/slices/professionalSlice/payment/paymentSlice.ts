import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import professionalAxios from '../../../../services/professionalAxios';

// CREATE ORDER (RAZORPAY)
export const createOrderRazorPay = createAsyncThunk('payment/createOrderRazorPay', async ({ planPublicId, pan, mobile, email, firstName, middleName, lastName }, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post(`/eTaxSolnMongoApiBackend/users/plansAndSubScriptions/razorpay/createOrderRazorPay`, {
      planPublicId,
      pan,
      mobile,
      email,
      firstName,
      middleName,
      lastName,
    });

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Unable to create Razorpay order',
      });
    }

    // expected: { key, orderId, amount, currency, planPublicId, ... }
    return res.data?.data;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || err.message || 'Order creation failed',
    });
  }
});

// VERIFY PAYMENT (RAZORPAY)
export const verifyRazorPayPayment = createAsyncThunk('payment/verifyRazorPayPayment', async ({ orderId, paymentId, signature, planPublicId }, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post(`/eTaxSolnMongoApiBackend/users/plansAndSubScriptions/razorpay/verifyPayment`, {
      orderId,
      paymentId,
      signature,
      planPublicId,
    });

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Payment verification failed',
      });
    }

    return res.data?.data; // can be receipt/txn info
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || err.message || 'Payment verification failed',
    });
  }
});

// SLICE
const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    order: null, // last created order
    verified: null, // verification response
    loading: false,
    error: null,

    createOrderSuccess: false,
    verifySuccess: false,
  },
  reducers: {
    clearPaymentState: (state) => {
      state.loading = false;
      state.error = null;
      state.createOrderSuccess = false;
      state.verifySuccess = false;
    },
    clearPaymentData: (state) => {
      state.order = null;
      state.verified = null;
    },
  },
  extraReducers: (builder) => {
    // CREATE ORDER
    builder
      .addCase(createOrderRazorPay.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createOrderSuccess = false;
      })
      .addCase(createOrderRazorPay.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
        state.createOrderSuccess = true;
      })
      .addCase(createOrderRazorPay.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.createOrderSuccess = false;
      });

    // VERIFY PAYMENT
    builder
      .addCase(verifyRazorPayPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.verifySuccess = false;
      })
      .addCase(verifyRazorPayPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.verified = action.payload;
        state.verifySuccess = true;
      })
      .addCase(verifyRazorPayPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.verifySuccess = false;
      });
  },
});

export const { clearPaymentState, clearPaymentData } = paymentSlice.actions;
export default paymentSlice.reducer;