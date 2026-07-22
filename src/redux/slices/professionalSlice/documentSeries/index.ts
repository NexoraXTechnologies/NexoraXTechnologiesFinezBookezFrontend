import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string;
};

type VoucherConfigurationState = {
    loading: boolean;
    saveLoader: boolean;
    voucherConfiguration: any;
    error: string | null;
};

export const getVoucherConfiguration = createAsyncThunk<any, void, { rejectValue: RejectValue }>(
    "voucherConfiguration/getVoucherConfiguration",
    async (_, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/voucherConfiguration/getAll"
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch voucher configuration",
                });
            }

            return res.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch voucher configuration",
            });
        }
    }
);

export const saveVoucherConfiguration = createAsyncThunk<any, any, { rejectValue: RejectValue }>(
    "voucherConfiguration/saveVoucherConfiguration",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/voucherConfiguration/save",
                payload
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to save voucher configuration",
                });
            }

            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to save voucher configuration",
            });
        }
    }
);

export const getVoucherConfigurationByModule = createAsyncThunk<any, string, { rejectValue: RejectValue }>("voucherConfiguration/getVoucherConfigurationByModule", async (module, { rejectWithValue }) => {
    try {
        const res = await professionalAxios.get(
            `/eTaxSolnMongoApiBackend/users/bookez/voucherConfiguration/getByModule?module=${module}`
        );

        if (!res.data?.success) {
            return rejectWithValue({
                message: res.data?.message || "Failed to fetch voucher configuration",
            });
        }

        return res.data?.data;
    } catch (error: any) {
        return rejectWithValue({
            message: error?.response?.data?.message || error?.message || "Failed to fetch voucher configuration",
        });
    }
}
);

const initialState: VoucherConfigurationState = {
    loading: false,
    saveLoader: false,
    voucherConfiguration: null,
    error: null,
};

const voucherConfigurationSlice = createSlice({
    name: "voucherConfiguration",
    initialState,
    reducers: {
        clearVoucherConfigurationError: (state) => {
            state.error = null;
        },

        clearVoucherConfigurationData: (state) => {
            state.voucherConfiguration = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getVoucherConfiguration.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getVoucherConfiguration.fulfilled, (state, action) => {
                state.loading = false;
                state.voucherConfiguration = action.payload;
            })

            .addCase(getVoucherConfiguration.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Failed to fetch voucher configuration";
            });

        builder
            .addCase(saveVoucherConfiguration.pending, (state) => {
                state.saveLoader = true;
                state.error = null;
            })

            .addCase(saveVoucherConfiguration.fulfilled, (state, action) => {
                state.saveLoader = false;

                if (action.payload?.data) {
                    state.voucherConfiguration = action.payload.data;
                }
            })

            .addCase(saveVoucherConfiguration.rejected, (state, action) => {
                state.saveLoader = false;
                state.error = action.payload?.message || "Failed to save voucher configuration";
            });

        builder
            .addCase(getVoucherConfigurationByModule.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(
                getVoucherConfigurationByModule.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.voucherConfiguration = action.payload;
                }
            )

            .addCase(
                getVoucherConfigurationByModule.rejected,
                (state, action) => {
                    state.loading = false;
                    state.error =
                        action.payload?.message ||
                        "Failed to fetch voucher configuration";
                }
            );
    },
});

export const {
    clearVoucherConfigurationError,
    clearVoucherConfigurationData,
} = voucherConfigurationSlice.actions;

export default voucherConfigurationSlice.reducer;