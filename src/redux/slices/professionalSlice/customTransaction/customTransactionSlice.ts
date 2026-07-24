import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type CustomTransactionPayload = {
    offset?: number;
    limit?: number;
    search?: string;
    moduleCode: string;
}
export const getAllCustomTransactionData = createAsyncThunk(
    "customTransaction/getAllCustomTransactionData",
    async ({
        offset = 0,
        limit = 20,
        search = "",
        moduleCode = ""
    }: CustomTransactionPayload,
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookez/transactionData/getAll",
                {
                    params: {
                        offset,
                        limit,
                        search,
                        moduleCode,
                    },
                }
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message: response.data?.message || "Failed to fetch Transaction data."
                })
            }
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || "Failed to fetch transaction data.",
            })
        }
    });


/* ===================================================
   GET BY CODE
=================================================== */

export const getCustomTransactionDataByCode = createAsyncThunk(
    "customTransaction/getCustomTransactionDataByCode",
    async (moduleCode: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookez/transactionData/getByVoucher/${moduleCode}`,
                {
                    params: {
                        moduleCode
                    }
                }
            )
            if (!response.data?.success) {
                return rejectWithValue({
                    message: response.data?.message || "Failed to fetch transaction data.",
                })
            }
            return response?.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || "Failed to fetch transaction data.",
            })
        }
    }
)


/* ===================================================
   SAVE
=================================================== */


export const saveCustomTransactionData = createAsyncThunk(
    "customTransaction/saveCustomTransactionData",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post("/eTaxSolnMongoApiBackend/users/bookez/transactionData/save", payload)
            if (!response.data?.success) {
                return rejectWithValue({
                    message: response.data?.message || "Failed to save custom transaction data."
                })
            }
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || "Failed to save custom transaction data.",
            })

        }
    }
)


/* ===================================================
   UPDATE
=================================================== */

export const updateCustomTransactionData = createAsyncThunk(
    "customTransaction/updateCustomTransactionData",
    async ({
        moduleCode,
        payload
    }: { moduleCode: string, payload: any }, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookez/transactionData/update/${moduleCode}`, payload)
            if (!response.data?.success) {
                return rejectWithValue({
                    message: response?.data?.message || "Failed to update custom transaction data."
                })
            }
            return response.data?.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || "Failed to update custom transaction data."
            })
        }
    }
)


/* ===================================================
   DELETE
=================================================== */
export const deleteCustomTransactionData = createAsyncThunk(
    "customTransaction/deleteCustomTransactionData",
    async (moduleCode: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookez/transactionData/delete/${moduleCode}`)
            if (!response.data?.success) {
                return rejectWithValue({

                    message: response?.data?.message || "Failed to delete custom transaction data."
                })
            }

            return { moduleCode }

        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || "Failed to delete custom transaction data."
            })
        }
    }
)


/* ===================================================
   INITIAL STATE
=================================================== */

interface CustomTransactionState {
    customTransactiondata: any[];
    selectedCustomTransactionData: any;
    pagination: {
        offset: number;
        limit: number;
        totalDocs: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    loading: boolean;
    createLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;
    error: string | null;
    successMessage: string | null;
}

const initialState: CustomTransactionState = {
    customTransactiondata: [],
    selectedCustomTransactionData: null,
    pagination: {
        offset: 0,
        limit: 20,
        totalDocs: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },

    loading: false,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,

    error: null,
    successMessage: null,

}


/* ===================================================
   SLICE
=================================================== */

const customTransactionDataSlice = createSlice({
    name: "customTransaction",
    initialState,
    reducers: {
        clearCustomTransactionError: (state) => {
            state.error = null;
        },

        clearCustomTransactionState: (state) => {
            state.loading = false;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
            state.error = null;
            state.successMessage = null;

            state.selectedCustomTransactionData = null;
        }
    },

    extraReducers: (builder) => {
        /* ===================================================
            GET ALL
        =================================================== */

        builder
            .addCase(getAllCustomTransactionData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getAllCustomTransactionData.fulfilled, (state, action) => {
                state.loading = false;
                state.customTransactiondata = action.payload?.customTransactionData ?? [];
                state.pagination = action.payload?.pagination ?? state.pagination;
            })

            .addCase(getAllCustomTransactionData.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload?.message ?? "Failed to fetch custom transaction data.";
            })

        /* ===================================================
               GET BY CODE
            =================================================== */
        builder
            .addCase(getCustomTransactionDataByCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(getCustomTransactionDataByCode.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedCustomTransactionData = action.payload ?? null;

            })

            .addCase(getCustomTransactionDataByCode.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload?.message ?? "Failed to fetch custom transaction data.";
            });


        /* ===================================================
               SAVE
            =================================================== */

        builder

            .addCase(saveCustomTransactionData.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })

            .addCase(saveCustomTransactionData.fulfilled, (state: any, action) => {
                state.createLoading = false;
                if (action.payload) {
                    state.customTransactiondata.unshift(action.payload);
                }
                state.successMessage = "Custom transaction created successfully.";
            })
            .addCase(saveCustomTransactionData.rejected, (state, action: any) => {
                state.createLoading = false;
                state.error = action.payload?.message ?? "Failed to create custom transaction."
            })


        /* ===================================================
             UPDATE
          =================================================== */

        builder
            .addCase(updateCustomTransactionData.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateCustomTransactionData.fulfilled, (state: any, action) => {
                state.updateLoading = false;
                const updated = action.payload;

                state.customTransactiondata = state.customTransactiondata.map((item: any) => item.moduleCode === updated.moduleCode
                    ? updated
                    : item
                );

                state.selectedCustomTransactionData = updated;

                state.successMessage = "Custom transaction data updated successfully.";
            })
            .addCase(updateCustomTransactionData.rejected, (state, action: any) => {
                state.updateLoading = false;
                state.error = action.payload?.message ?? "Failed to update custom transaction data.";
            })

        /* ===================================================
               DELETE
            =================================================== */

        builder
            .addCase(deleteCustomTransactionData.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(deleteCustomTransactionData.fulfilled, (state: any, action) => {
                state.deleteLoading = false;
                state.customTransactiondata = state.customTransactiondata.filter((item: any) => item.moduleCode !== action.payload.moduleCode);
                state.successMessage = "custom transaction data deleted successfully.";
            })
            .addCase(deleteCustomTransactionData.rejected, (state, action: any) => {
                state.deleteLoading = false;
                state.error = action.payload?.message ?? "Failed to delete custom transaction data.";
            })

    }
})


export const {
    clearCustomTransactionError, clearCustomTransactionState
} = customTransactionDataSlice.actions;

export default customTransactionDataSlice.reducer;