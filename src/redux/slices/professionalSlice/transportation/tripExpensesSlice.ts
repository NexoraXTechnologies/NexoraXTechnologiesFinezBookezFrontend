import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type TripExpenseState = {
    limit?: number;
    offset?: number;
    search?: string;
    tripStatus?: string;
}


export const createTripExpense = createAsyncThunk(
    "tripExpenses/createTripExpense",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend//users/bookEZ/tripExpenses/save", { payload }
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message: response?.data?.message || "Failed to create Trip Expenses"
                })
            }
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || error?.message || "Failed to create trip Expenses"
            })
        }
    }

)


/* ===================================================
    GET ALL TRIP Expenses
=================================================== */

export const getAllTripExpenses = createAsyncThunk(
    "tripExpenses/getAllTripExpenses",
    async ({
        limit = 10,
        offset = 0,
        search = "",
        tripStatus = ""

    }: TripExpenseState = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/getAll", {
                params: {
                    limit,
                    offset,
                    search,
                    tripStatus
                }
            })
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get all trip expenses",
            })

        }
    }
)


/* ===================================================
    GET trip Expenses  BY VOUCHER NUMBER
=================================================== */

export const getTripExpensesByVoucherNumber = createAsyncThunk(
    "tripExpenses/getTripExpensesByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/getByVoucherNumber/${voucherNumber}`)
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get all trip expenses",
            })
        }
    }
)


/* ===================================================
    DELETE TRIP Expenses BY VOUCHER NUMBER
=================================================== */

export const deleteTripExpenses = createAsyncThunk(
    "tripExpenses/deleteTripExpenses",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/delete/${voucherNumber}`)
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to delete trip expenses ",

            });
        }
    }
)

/* ===================================================
    UPDATE TRIP Expenses BY VOUCHER NUMBER
=================================================== */

export const updateTripExpenses = createAsyncThunk(
    "tripExpenses/updateTripExpenses",
    async (
        { voucherNumber, payload }: { voucherNumber: string, payload: any },
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/update/${voucherNumber}`,
                payload
            );
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to update trip expenses ",

            });
        }
    }
)



/* ===================================================
    SLICE
=================================================== */

const initialState: any = {
    tripExpenses: [],
    createLoader: false,
    updateLoader: false,
    deleteLoader: false,
    listingLoader: false,
    detailLoader: false,
    error: null
}


const tripExpensesSlice = createSlice({
    name: "tripExpenses",
    initialState,
    reducers: {
        clearTripExpensesError: (state) => {
            state.error = null;
        },
        clearTripExpensesState: (state) => {
            state.tripExpenses = [],
                state.createLoader = false;
            state.updateLoader = false;
            state.deleteLoader = false;
            state.listingLoader = false;
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            // create trip expenses
            .addCase(createTripExpense.pending, (state) => {
                state.createLoader = true;
                state.error = null;
            })
            .addCase(createTripExpense.fulfilled, (state, action) => {
                state.createLoader = false;
                const createExpense = action.payload?.data;
                if (createExpense) {
                    state.tripExpenses.push(createExpense);
                }
                state.error = null;
            })

            .addCase(createTripExpense.rejected, (state, action) => {
                state.createLoader = false;
                state.error = (action.payload as { message?: string })?.message ||
                    "Failed to create trip expenses";
            })


            // get all trip expenses

            .addCase(getAllTripExpenses.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getAllTripExpenses.fulfilled, (state, action) => {
                state.listingLoader = false;
                state.tripExpenses = action.payload?.data || null;
                state.error = null;
            })
            .addCase(getAllTripExpenses.rejected, (state, action) => {
                state.listingLoader = false;
                state.error = (
                    action.payload as { message?: string }
                )?.message || "Failed to get trip expenses";
            })


            // GET TRIP EXPENSES  BY VOUCHER NUMBER

            .addCase(getTripExpensesByVoucherNumber.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
            })
            .addCase(getTripExpensesByVoucherNumber.fulfilled, (state, action) => {
                state.detailLoader = false;
                state.tripExpenses = action.payload?.data || null;
                state.error = null;
            })
            .addCase(getTripExpensesByVoucherNumber.rejected, (state, action) => {
                state.detailLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get trip expenses ";
            })


        // delete trip expenses
        .addCase(deleteTripExpenses.pending,(state)=>{
            state.deleteLoader=true;
            state.error=null;
        })
        .addCase(deleteTripExpenses.fulfilled,(state,action)=>{
            state.deleteLoader=false;
            const deletedExpense=action.payload?.data;
            if(deletedExpense){
                state.tripExpenses=state.tripExpenses.filter((t:any)=>t.voucherNumber !==deletedExpense.voucherNumber);

            }
            state.error=null;
        })
        .addCase(deleteTripExpenses.rejected,(state,action)=>{
            state.deleteLoader=false;
            state.error=(action.payload as {message?:string})?.message || "Failed to delete trip expenses";
        })

        // update trip expenses

        .addCase(updateTripExpenses.pending,(state)=>{
            state.updateLoader=true;
            state.error=null;
        })
        .addCase(updateTripExpenses.fulfilled,(state,action)=>{
            state.updateLoader=false;
            const updateExpense=action.payload?.data;
            if(updateExpense){
                state.tripExpenses=state.tripExpenses.map((t:any)=>t.voucherNumber ===updateExpense.voucherNumber ? updateExpense:t);
            }
            state.error=null;
        })
        .addCase(updateTripExpenses.rejected,(state,action)=>{
            state.updateLoader=false;
            state.error=(action.payload as {message?:string})?.message || "Failed to update trip expense";
        })

    }
})


export const {clearTripExpensesError , clearTripExpensesState } = tripExpensesSlice.actions;
export default tripExpensesSlice.reducer;