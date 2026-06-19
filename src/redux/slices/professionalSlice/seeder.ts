import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

export const seedDefaultUnits = createAsyncThunk(
    "seedDefaultAccounts/seedDefaultUnits",
    async (_: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/bookez/unitMaster/seedDefaultUnits`,
                {}
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch states",
                });
            }

            return res?.data?.data?.records || [];
        } catch (err: any) {
            return rejectWithValue({
                message: err.response?.data?.message || "Failed to fetch states",
            });
        }
    }
);
export const seedDefaultAccounts = createAsyncThunk(
    "seedDefaultAccounts/seedDefaultAccounts",
    async (_: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/bookez/accounts/seedDefaultAccounts`,
                {}
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch states",
                });
            }

            return res?.data?.data?.records || [];
        } catch (err: any) {
            return rejectWithValue({
                message: err.response?.data?.message || "Failed to fetch states",
            });
        }
    }
);

export const saveSeeder = createAsyncThunk(
    "seedDefaultAccounts/saveSeeder",
    async (_: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/configuration/save`,
                {_}
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch states",
                });
            }

            return res?.data?.data?.records || [];
        } catch (err: any) {
            return rejectWithValue({
                message: err.response?.data?.message || "Failed to fetch states",
            });
        }
    }
);

const seederConfg = createSlice({
    name: "seeder",
    initialState: {
        pincodeLocation: null,
        loading: false,
        error: null,
    },
    reducers: {

    },
    extraReducers: (builder) => {
        // GET STATES
        builder
            .addCase(seedDefaultUnits.pending, (state: any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(seedDefaultUnits.fulfilled, (state: any, action: any) => {
                state.loading = false;
                state.states = action.payload;
            })
            .addCase(seedDefaultUnits.rejected, (state: any, action: any) => {
                state.loading = false;
                state.error = action.payload?.message || "Something went wrong";
            });

        builder
            .addCase(seedDefaultAccounts.pending, (state: any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(seedDefaultAccounts.fulfilled, (state: any, action: any) => {
                state.loading = false;
                state.states = action.payload;
            })
            .addCase(seedDefaultAccounts.rejected, (state: any, action: any) => {
                state.loading = false;
                state.error = action.payload?.message || "Something went wrong";
            });

        builder
            .addCase(saveSeeder.pending, (state: any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveSeeder.fulfilled, (state: any, action: any) => {
                state.loading = false;
                state.states = action.payload;
            })
            .addCase(saveSeeder.rejected, (state: any, action: any) => {
                state.loading = false;
                state.error = action.payload?.message || "Something went wrong";
            });
    },
});

export const { } = seederConfg.actions;
export default seederConfg.reducer;
