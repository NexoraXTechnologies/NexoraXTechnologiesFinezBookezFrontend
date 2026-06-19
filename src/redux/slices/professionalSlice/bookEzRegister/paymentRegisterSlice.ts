import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";



type RejectValue = {
    message: string
}

type paymentRegisterState = {
    addLoader: boolean;
    deleteLoader: boolean;
    listingLoader: boolean;
    exportLoader: boolean;
    paymentRegisterData: any[];
    pagination: any;
    error: string | null;
}

export const addPaymentRegister = createAsyncThunk<
    any,
    any,
    { rejectValue: RejectValue }
>(
    "paymentRegister/addPaymentRegister", async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post("/eTaxSolnMongoApiBackend/users/bookEZ/registers/paymentRegister", { ...payload }, payload?.exportType
                ? {
                    responseType: "blob",
                }
                : undefined)

            if (payload?.exportType) {
                return {
                    blob: res.data,
                    exportType: payload.exportType,
                };
            }

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res?.data?.message ||
                        "Failed to fetch payment register",
                });
            }

            return {
                records:
                    res?.data?.data?.payments ||
                    [],
                pagination: res?.data?.data?.pagination || {},
            };
        } catch (error: any) {
            return rejectWithValue({
                message: error.response?.data?.message || error.message?.data?.error || "Failed to create payment register"
            })
        }
    }
)


const initialState: paymentRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    paymentRegisterData: [],
    error: null,
    pagination: {},
}


const paymemtRegisterSlice = createSlice({
    name: "paymentRegister",
    initialState,
    reducers: {
        clearPaymentRegisterError: (state) => {
            state.error = null
        },

        clearPaymentRegisterData: (state) => {
            state.paymentRegisterData = []
        }
    },

    extraReducers: (builder) => {
        builder

            .addCase(addPaymentRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                }

                state.error = null;
            })
            .addCase(addPaymentRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.paymentRegisterData = action.payload?.records || [];
                state.pagination = action.payload?.pagination || {};
                state.error = null;
            })

            .addCase(addPaymentRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch payment register";
            })
    }
})

export const { clearPaymentRegisterError, clearPaymentRegisterData } = paymemtRegisterSlice.actions
export default paymemtRegisterSlice.reducer;