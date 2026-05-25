import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// =======================================================
// SEND OTP
// =======================================================
export const sendProfessionalOtp = createAsyncThunk(
  "professionalAuth/sendProfessionalOtp",
  async (mobile, { rejectWithValue }) => {
    try {
      if (!mobile || mobile.length !== 10) {
        return rejectWithValue({ message: "Invalid mobile number" });
      }

      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/otp/sendOtp",
        { mobile },
        { headers: { "x-db-name": "NexoraX-RegisteredUsers" } }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to generate OTP",
        });
      }

      return {
        mobile: parseInt(mobile),
        requestID: res.data.RequestID,
        otp: res.data.otp,
      };
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to send OTP",
      });
    }
  }
);

// =======================================================
// VERIFY OTP
// =======================================================
export const verifyProfessionalOtp = createAsyncThunk(
  "professionalAuth/verifyProfessionalOtp",
  async ({ mobile, requestID, otp }, { rejectWithValue }) => {
    try {
      if (!otp || otp.length !== 4) {
        return rejectWithValue({ message: "Invalid OTP" });
      }

      // STEP 1 — Verify OTP
      const verifyRes = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/otpValidation/verify",
        {
          MobileNumber: mobile,
          RequestID: requestID,
          OTP: otp,
        },
        { headers: { "x-db-name": "NexoraX-RegisteredUsers" } }
      );

      if (verifyRes.data.error) {
        return rejectWithValue({ message: "Invalid OTP" });
      }

      // STEP 2 — Check if user exists
      try {
        const checkUserRes = await professionalAxios.get(
          `/eTaxSolnMongoApiBackend/users/${mobile}`,
          { headers: { "x-db-name": "NexoraX-RegisteredUsers" } }
        );

        const exists = checkUserRes.data.success === true;
        const userData = exists ? checkUserRes.data.data.ChildUsers : null;

        return { existingUser: exists, userData };
      } catch (err) {
        if (err.response?.status === 404) {
          return { existingUser: false, userData: null };
        }
        throw err;
      }
    } catch (err) {
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid OTP",
      });
    }
  }
);

// =======================================================
// REGISTER PROFESSIONAL USER (MERGED HERE)
// =======================================================
export const registerProfessional = createAsyncThunk(
  "professionalAuth/registerProfessional",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Registration failed",
      });
    }
  }
);

// =======================================================
// CHECK PARENT USER EXISTS
// =======================================================
export const checkProfessionalParentUser = createAsyncThunk(
  "professionalAuth/checkProfessionalParentUser",
  async (mobile, { rejectWithValue }) => {
    try {
      if (!mobile || mobile.length !== 10) {
        return rejectWithValue({ message: "Invalid mobile number" });
      }

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/${mobile}`,
        { headers: { "x-db-name": "NexoraX-RegisteredUsers" } }
      );

      const exists = res.data.success === true;
      const user = exists ? res.data.data : null;

      return { exists, user };
    } catch (err) {
      if (err.response?.status === 404) {
        return rejectWithValue({ message: "Parent user not found" });
      }

      return rejectWithValue({
        message: err.response?.data?.message || "Failed to fetch parent user",
      });
    }
  }
);

// =======================================================
// REGISTER CHILD USER
// =======================================================
export const registerChildProfessional = createAsyncThunk(
  "professionalAuth/registerChildProfessional",
  async ({ parentMobile, childData }, { rejectWithValue }) => {
    try {
      const response = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/users/${parentMobile}/child`,
        childData,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Child registration failed",
      });
    }
  }
);

// =======================================================
// SLICE (ALL STATES + ALL ACTIONS)
// =======================================================
const professionalAuthSlice = createSlice({
  name: "professionalAuth",
  initialState: {
    loading: false,
    error: null,

    // OTP related
    professionalMobile: null,
    professionalRequestID: null,
    professionalOtpVerified: false,
    generatedOtp: null,

    // User related
    isProfessionalExistingUser: false,
    professionalUserData: null,

    // Registration
    registerResponse: null,

    parentUserExists: null,
    parentUserData: null,
  },

  reducers: {
    resetProfessionalAuth: (state) => {
      state.loading = false;
      state.error = null;

      state.professionalMobile = null;
      state.professionalRequestID = null;
      state.professionalOtpVerified = false;
      state.generatedOtp = null;

      state.isProfessionalExistingUser = false;
      state.professionalUserData = null;

      state.registerResponse = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // ================= SEND OTP =================
      .addCase(sendProfessionalOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendProfessionalOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.professionalMobile = action.payload.mobile;
        state.professionalRequestID = action.payload.requestID;
        state.generatedOtp = action.payload.otp;
      })
      .addCase(sendProfessionalOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // ================= VERIFY OTP =================
      .addCase(verifyProfessionalOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyProfessionalOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.professionalOtpVerified = true;
        state.isProfessionalExistingUser = action.payload.existingUser;
        state.professionalUserData = action.payload.userData;
      })
      .addCase(verifyProfessionalOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // ================= REGISTER PROFESSIONAL =================
      .addCase(registerProfessional.fulfilled, (state, action) => {
        state.loading = false;
        state.registerResponse = action.payload;

        // --- From backend response ---
        const userMobileNumberHash = action.payload?.data?.mobile;
        const authTokenDigest = action.payload?.data?.authToken;

        // --- From what you originally sent to the thunk (payload in onSubmit) ---
        const sentParentData = action.meta.arg; // this is `payload` from onSubmit

        if (userMobileNumberHash && authTokenDigest) {
          // ✅ Save headers for API calls
          localStorage.setItem(
            "professionalHeaders",
            JSON.stringify({
              "x-db-name": userMobileNumberHash,
              authtoken: authTokenDigest,
              loginuser: userMobileNumberHash,
            })
          );

          // ✅ Build full name from form data
          const fullName = `${sentParentData.userFirstName || ""} ${
            sentParentData.userLastName || ""
          }`.trim();

          // ✅ Save user profile for UI (similar structure to child)
          localStorage.setItem(
            "professionalUser",
            JSON.stringify({
              name: fullName || "Professional User",
              type: sentParentData.userType || "Tax Expert",
              profilePic:
                sentParentData.profilePic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              // for parent, their own mobile is effectively the root db key
              userMobileNumberHash: userMobileNumberHash,
              userEmail: sentParentData.userEmail,
            })
          );
        }
      })
      .addCase(registerProfessional.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // ================= CHECK PARENT USER =================
      .addCase(checkProfessionalParentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.parentUserExists = null;
        state.parentUserData = null;
      })
      .addCase(checkProfessionalParentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.parentUserExists = action.payload.exists;
        state.parentUserData = action.payload.user;
      })
      .addCase(checkProfessionalParentUser.rejected, (state, action) => {
        state.loading = false;
        state.parentUserExists = false;
        state.error = action.payload?.message;
      })

      // ================= REGISTER CHILD =================
      .addCase(registerChildProfessional.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerChildProfessional.fulfilled, (state, action) => {
        state.loading = false;
        state.registerResponse = action.payload;

        // Backend sends only these 2:
        const childMobile = action.payload?.data?.childMobile;
        const authTokenDigest = action.payload?.data?.authToken;

        // But we need more → use data we already sent to backend
        const sentChildData = action.meta.arg.childData;
        // <-- THIS is the childData you created in onSubmit()

        if (childMobile && authTokenDigest) {
          // Save headers
          localStorage.setItem(
            "professionalHeaders",
            JSON.stringify({
              "x-db-name": sentChildData.parentUserMobileNumber,
              authtoken: authTokenDigest,
              loginuser: childMobile,
            })
          );

          // Build full name
          const fullName = `${sentChildData.userFirstName || ""} ${
            sentChildData.userLastName || ""
          }`.trim();

          // Save user info from our own submitted data
          localStorage.setItem(
            "professionalUser",
            JSON.stringify({
              name: fullName || "Professional User",
              type: sentChildData.userType || "Tax Expert",
              profilePic:
                sentChildData.profilePic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              parentUserMobileNumber: sentChildData.parentUserMobileNumber,
              userEmail: sentChildData.userEmail,
            })
          );
        }
      })
      .addCase(registerChildProfessional.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });
  },
});

// EXPORT ACTION
export const { resetProfessionalAuth } = professionalAuthSlice.actions;

// EXPORT REDUCER
export default professionalAuthSlice.reducer;
