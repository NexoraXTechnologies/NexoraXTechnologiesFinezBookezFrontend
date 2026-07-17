import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   SEND WHATSAPP
=================================================== */

export const sendWhatsAppMessage = createAsyncThunk(
    "whatsapp/sendWhatsAppMessage",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/whatsapp/send",
                payload
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message:
                        response?.data?.message ||
                        "Failed to send WhatsApp message",
                });
            }

            return response.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to send WhatsApp message",
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const initialState = {
    response: null,
    createLoader: false,
    error: null,
};

const whatsappSlice = createSlice({
    name: "whatsapp",
    initialState,
    reducers: {
        clearWhatsappError(state) {
            state.error = null;
        },

        clearWhatsappState(state) {
            state.response = null;
            state.createLoader = false;
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(sendWhatsAppMessage.pending, (state) => {
                state.createLoader = true;
                state.error = null;
            })

            .addCase(sendWhatsAppMessage.fulfilled, (state, action) => {
                state.createLoader = false;
                state.response = action.payload;
                state.error = null;
            })

            .addCase(sendWhatsAppMessage.rejected, (state, action) => {
                state.createLoader = false;
                state.error =
                    (action.payload as any)?.message ||
                    "Failed to send WhatsApp message";
            });
    },
});

export const {
    clearWhatsappError,
    clearWhatsappState,
} = whatsappSlice.actions;

export default whatsappSlice.reducer;