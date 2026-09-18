import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import professionalAxios from "../../../../services/professionalAxios"


export const getPaymentReminderReport = createAsyncThunk(
    "paymentReminderReport/getPaymentReminderReport",
    async (params: any = {}, { rejectWithValue }) => {
        try {

            // ⭐ YELLOW STAR: CUSTOMER CODE IS OPTIONAL
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/byCustomerCode",
                {
                    params: params?.customerCode
                        ? {
                            customerCode: params.customerCode
                        }
                        : {}
                }
            )

            const data = response.data

            if (!data?.success) {
                return rejectWithValue({
                    message:
                        data?.message ||
                        "Failed to fetch payment reminder report"
                })
            }

            // ⭐ YELLOW STAR: UPDATED ACCORDING TO ACTUAL API RESPONSE
            return data?.data?.data || []

        } catch (error: any) {

            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch payment reminder report"
            })

        }
    }
)


const paymentReminderReportSlice = createSlice({

    name: "paymentReminderReport",

    initialState: {
        paymentReminderReport: [] as any[],
        loading: false,
        error: null as string | null
    },

    reducers: {

        clearPaymentReminderReport: (state) => {
            state.paymentReminderReport = []
            state.error = null
        }

    },

    extraReducers: (builder) => {

        builder

            .addCase(
                getPaymentReminderReport.pending,
                (state) => {

                    state.loading = true
                    state.error = null

                }
            )

            .addCase(
                getPaymentReminderReport.fulfilled,
                (state, action) => {

                    state.loading = false

                    state.paymentReminderReport =
                        Array.isArray(action.payload)
                            ? action.payload
                            : []

                    state.error = null

                }
            )

            .addCase(
                getPaymentReminderReport.rejected,
                (state, action: any) => {

                    state.loading = false
                    state.paymentReminderReport = []

                    state.error =
                        action.payload?.message ||
                        "Failed to fetch payment reminder report"

                }
            )

    }

})


export const {
    clearPaymentReminderReport
} = paymentReminderReportSlice.actions


export default paymentReminderReportSlice.reducer