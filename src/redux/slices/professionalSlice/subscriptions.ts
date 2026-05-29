import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// get 
export const getAllPlans = createAsyncThunk(
    "plans/getAllPlans",
    async ({ offset = 0, limit = 100, search = "", tagName=""} = {}, { rejectWithValue }) => {
        try {
            const params = { offset, limit };
            if (search.trim()) params.search = search.trim();

            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/plansAndSubScription/plans/getAll`,
                { params }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

// apply coupon
export const applyCoupon = createAsyncThunk(
    "plans/applyCoupon",
    async ({ planPublicId, couponCode } = {}, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/plansAndSubScriptions/checkout/preview`,
                { planPublicId, couponCode }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

// orderId
export const createOrder = createAsyncThunk(
    "plans/orderId",
    async ({ planPublicId, pan, mobile, email, firstName, middleName, autoRenewEnabled, couponCode, lastName } = {}, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/plansAndSubScriptions/razorpay/createOrderRazorPay`,
                { planPublicId, pan, couponCode, mobile, email, firstName, middleName, autoRenewEnabled, lastName }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

export const verifyPayment = createAsyncThunk(
    "plans/verifyPayment",
    async ({ orderId, paymentId, signature } = {}, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/plansAndSubScriptions/razorpay/verifyPayment`,
                { orderId, paymentId, signature }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

export const subscribePlan = createAsyncThunk(
    "plans/verifyPayment",
    async ({ orderId, paymentId } = {}, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/plansAndSubScriptions/subscription/subscribe`,
                { orderId, paymentId }
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

export const myPlan = createAsyncThunk(
    "plans/mySubscribePlan",
    async (_, { rejectWithValue }) => {
        try {
            console.log("inner")
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/plansAndSubScriptions/subscription/mySubscription`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch accounts",
                });

            return res.data?.data;
        } catch (err) {
            console.log(err)
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch accounts",
            });
        }
    }
);

// slice 
const plansSlice = createSlice({
    name: "plans",
    initialState: {
        plans: [],
        couponData: [],
        orderIdData: [],
        currentPlan: [],
        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },
        selectedAccount: null,
        subscribeLoading: false,
        createIdLoading: false,
        loading: false,
        couponLoading: false,
        error: null,
        createLoading: false,
        updateLoading: false,
        deleteLoading: false,
    },

    reducers: {
        clearPlansState: (state) => {
            state.error = null;
            state.couponData = [];
            state.orderIdData = [];
            state.deleteLoading = false;
        },
        clearCouponState: (state) => {
            state.couponData = [];
        },
    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getAllPlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllPlans.fulfilled, (state, action) => {
                state.loading = false;
                const data = action.payload;
                state.plans = data.records ?? [];
                state.pagination = data.pagination ?? state.pagination;
            })
            .addCase(getAllPlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.plans = [];
            });

        builder
            .addCase(applyCoupon.pending, (state) => {
                state.couponLoading = true;
                state.error = null;
            })
            .addCase(applyCoupon.fulfilled, (state, action) => {
                state.couponLoading = false;
                const data = action.payload;
                state.couponData = data ?? [];
                state.pagination = data.pagination ?? state.pagination;
            })
            .addCase(applyCoupon.rejected, (state, action) => {
                state.couponLoading = false;
                state.error = action.payload?.message;
                state.plans = [];
            });

        builder
            .addCase(createOrder.pending, (state) => {
                state.createIdLoading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.createIdLoading = false;
                const data = action.payload;
                state.orderIdData = data ?? [];
                state.pagination = data.pagination ?? state.pagination;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.createIdLoading = false;
                state.error = action.payload?.message;
                state.plans = [];
            });

        builder
            .addCase(subscribePlan.pending, (state) => {
                state.subscribeLoading = true;
                state.error = null;
            })
            .addCase(subscribePlan.fulfilled, (state, action) => {
                state.subscribeLoading = false;
                const data = action.payload;
                // state.orderIdData = data ?? [];
                state.pagination = data.pagination ?? state.pagination;
            })
            .addCase(subscribePlan.rejected, (state, action) => {
                state.subscribeLoading = false;
                state.error = action.payload?.message;
                state.plans = [];
            });

        builder
            .addCase(myPlan.pending, (state) => {
                state.loading = true;
                state.subscribeLoading = true;
                state.error = null;
            })
            .addCase(myPlan.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPlan = action.payload || [];
            })
            .addCase(myPlan.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.currentPlan = [];
            });
    },
});

export const { clearPlansState, clearCouponState } = plansSlice.actions;
export default plansSlice.reducer;