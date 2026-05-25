import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosInstance";

// ===========================================
// GOOGLE LOGIN
// ===========================================
export const googleLoginUser = createAsyncThunk(
  "auth/googleLoginUser",
  async (idToken, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/eTaxSolnMongoApiBackend/nexoraUser/auth/googleLogin",
        { idToken },
        {
          headers: {
            "x-db-name": "NexoraX-RegisteredUsers",
          },
        }
      );
      return res.data; // expected: { success, authToken, userProfile }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Google login failed. Please try again.";
      return rejectWithValue({ message: errorMessage });
    }
  }
);

// ===========================================
// LOGIN USER (JSON payload)
// ===========================================
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/eTaxSolnMongoApiBackend/nexoraUser/auth/login",
        credentials,
        {
          headers: {
            "x-db-name": "NexoraX-RegisteredUsers",
          },
        }
      );
      return res.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Try again.";
      return rejectWithValue({ message: errorMessage });
    }
  }
);

// ===========================================
// REGISTER USER (multipart/form-data)
// ===========================================
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/eTaxSolnMongoApiBackend/nexoraUser/auth/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-db-name": "NexoraX-RegisteredUsers",
          },
        }
      );
      return res.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Signup failed. Please try again.";
      return rejectWithValue({ message: errorMessage });
    }
  }
);

// ===========================================
// FORGOT PASSWORD - REQUEST OTP
// ===========================================
export const requestForgotOtp = createAsyncThunk(
  "auth/requestForgotOtp",
  async (email, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/eTaxSolnMongoApiBackend/nexoraUser/auth/forgotPassword/requestOtp",
        { email },
        {
          headers: { "x-db-name": "NexoraX-RegisteredUsers" },
        }
      );
      return res.data; // { success, message }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to send OTP. Try again.";
      return rejectWithValue({ message: errorMessage });
    }
  }
);

// ===========================================
// FORGOT PASSWORD - VERIFY OTP
// ===========================================
export const verifyForgotOtp = createAsyncThunk(
  "auth/verifyForgotOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/eTaxSolnMongoApiBackend/nexoraUser/auth/forgotPassword/verifyOtp",
        { email, otp },
        {
          headers: { "x-db-name": "NexoraX-RegisteredUsers" },
        }
      );
      return res.data; // { success, message }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "OTP verification failed.";
      return rejectWithValue({ message: errorMessage });
    }
  }
);

// ===========================================
// FORGOT PASSWORD - RESET PASSWORD
// ===========================================
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async ({ email, newPassword, confirmPassword,resetToken }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        "/eTaxSolnMongoApiBackend/nexoraUser/auth/forgotPassword/updatePassword",
        { email, newPassword ,confirmPassword},
        {
          headers: {
            "x-db-name": "NexoraX-RegisteredUsers",
            "x-reset-token": resetToken,
          },
        }
      );
      return res.data; // { success, message }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Password update failed.";
      return rejectWithValue({ message: errorMessage });
    }
  }
);



// ===========================================
// SLICE DEFINITION
// ===========================================
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
  },
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.clear(); //clear all localstorage
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const token = action.payload.authToken || null;
        const user = action.payload.userProfile || null;

        state.token = token;
        state.user = user;

        if (token) localStorage.setItem("token", token);
        if (user) localStorage.setItem("user", JSON.stringify(user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed.";
      })

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        const token = action.payload.authToken || null;
        const user = action.payload.userProfile || null;

        state.token = token;
        state.user = user;

        if (token) localStorage.setItem("token", token);
        if (user) localStorage.setItem("user", JSON.stringify(user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Signup failed.";
      })// GOOGLE LOGIN
      .addCase(googleLoginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLoginUser.fulfilled, (state, action) => {
        state.loading = false;
        const token = action.payload.authToken || null;
        const user = action.payload.userProfile || null;
        state.token = token;
        state.user = user;
        if (token) localStorage.setItem("token", token);
        if (user) localStorage.setItem("user", JSON.stringify(user));
      })
      .addCase(googleLoginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Google login failed.";
      })
      .addCase(requestForgotOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
      })
      .addCase(requestForgotOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestForgotOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to send OTP.";
      })

      .addCase(verifyForgotOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyForgotOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(verifyForgotOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "OTP verification failed.";
      })

      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Password update failed.";
      });


  },
});

export const { logoutUser } = authSlice.actions;
export default authSlice.reducer;
