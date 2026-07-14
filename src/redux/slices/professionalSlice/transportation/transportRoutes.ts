import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   THUNKS
=================================================== */

export const createTransportRouteMajorCities = createAsyncThunk(
    "routePlannerApi/createTransportRouteMajorCities",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/transport/routes/majorCities",
                payload
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message:
                        response?.data?.message ||
                        "Failed to fetch major cities",
                });
            }

            return response.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch major cities",
            });
        }
    }
);

export const createTransportRouteCalculate = createAsyncThunk(
    "routePlannerApi/createTransportRouteCalculate",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/transport/routes/calculate",
                payload
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message:
                        response?.data?.message ||
                        "Failed to calculate route",
                });
            }

            return response.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to calculate route",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: any = {
    majorCities: null,
    calculatedRoute: null,

    majorCitiesLoader: false,
    calculateRouteLoader: false,

    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const transportRouteSlice = createSlice({
    name: "transportRoute",

    initialState,

    reducers: {
        clearTransportRouteError: (state) => {
            state.error = null;
        },

        clearTransportRouteState: (state) => {
            state.majorCities = null;
            state.calculatedRoute = null;

            state.majorCitiesLoader = false;
            state.calculateRouteLoader = false;

            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder

            /* ==========================================
               MAJOR CITIES
            ========================================== */

            .addCase(createTransportRouteMajorCities.pending, (state) => {
                state.majorCitiesLoader = true;
                state.error = null;
            })

            .addCase(
                createTransportRouteMajorCities.fulfilled,
                (state, action) => {
                    state.majorCitiesLoader = false;
                    state.majorCities = action.payload?.data || null;
                    state.error = null;
                }
            )

            .addCase(
                createTransportRouteMajorCities.rejected,
                (state, action: any) => {
                    state.majorCitiesLoader = false;
                    state.error =
                        action.payload?.message ||
                        "Failed to fetch major cities";
                }
            )

            /* ==========================================
               CALCULATE ROUTE
            ========================================== */

            .addCase(createTransportRouteCalculate.pending, (state) => {
                state.calculateRouteLoader = true;
                state.error = null;
            })

            .addCase(
                createTransportRouteCalculate.fulfilled,
                (state, action) => {
                    state.calculateRouteLoader = false;
                    state.calculatedRoute = action.payload?.data || null;
                    state.error = null;
                }
            )

            .addCase(
                createTransportRouteCalculate.rejected,
                (state, action: any) => {
                    state.calculateRouteLoader = false;
                    state.error =
                        action.payload?.message ||
                        "Failed to calculate route";
                }
            );
    },
});

/* ===================================================
   EXPORTS
=================================================== */

export const {
    clearTransportRouteError,
    clearTransportRouteState,
} = transportRouteSlice.actions;

export default transportRouteSlice.reducer;