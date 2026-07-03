import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type AreaDashboardPayload = {
    dbNumbers?: string[];
    cities?: string[];
    states?: string[];
    period?: string;
    modules?: string[];
};

type AreaDashboardState = {
    registerDashboardData: any | null;
    registerDashboardLoading: boolean;
    error: any | null;
};

const initialState: AreaDashboardState = {
    registerDashboardData: null,
    registerDashboardLoading: false,
    error: null,
};

/* ===================================================
   AREA DASHBOARD
=================================================== */

export const getAreaDashboard = createAsyncThunk(
    "areaDashboard/getAreaDashboard",
    async (payload: AreaDashboardPayload = {}, { rejectWithValue }) => {
        try {
            const body = {
                dbNumbers: payload.dbNumbers || [],
                cities: payload.cities || [],
                states: payload.states || [],
                period: payload.period || "",
                modules: payload.modules || [],
            };

            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/admin/analytics/areaDashboard",
                body
            );

            if (res.data?.success === false) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch area dashboard",
                });
            }

            return res.data?.data || res.data || {};
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to fetch area dashboard",
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const areaDashboardSlice = createSlice({
    name: "areaDashboard",

    initialState,

    reducers: {
        clearAreaDashboardState: (state) => {
            state.registerDashboardLoading = false;
            state.error = null;
        },

        clearAreaDashboardData: (state) => {
            state.registerDashboardData = null;
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(getAreaDashboard.pending, (state) => {
                state.registerDashboardLoading = true;
                state.error = null;
            })
            .addCase(getAreaDashboard.fulfilled, (state, action) => {
                state.registerDashboardLoading = false;
                state.registerDashboardData = action.payload;
                state.error = null;
            })
            .addCase(getAreaDashboard.rejected, (state: any, action: any) => {
                state.registerDashboardLoading = false;
                state.registerDashboardData = null;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch area dashboard";
            });
    },
});

export const {
    clearAreaDashboardState,
    clearAreaDashboardData,
} = areaDashboardSlice.actions;

export default areaDashboardSlice.reducer;