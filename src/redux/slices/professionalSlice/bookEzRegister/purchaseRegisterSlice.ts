import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string
}

type PurchaseRegisterPayload = {
    payload: any;
}

type PurchaseRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    PurchaseRegisterData: any;
    error: string | null;
}

export const addPurchaseRegister = createAsyncThunk<
    any,
    PurchaseRegisterPayload,
    { rejectValue: RejectValue }

>(
    "purchaseRegister/addPurchaseRegister", async ({ payload }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post("/eTaxSolnMongoApiBackend/users/bookEZ/registers/purchaseRegister", { ...payload });
            if (!res.data?.success) {
                return rejectWithValue({
                    message: res?.data?.message || "failed to create purchase register"
                })
            }
            return res?.data?.data
        } catch (error:any) {
            return rejectWithValue({
                message: error?.response?.data?.message ||
                    error?.message?.data?.error || "Failed to create purchase register"
            })
        }
    }
)



/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: PurchaseRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    PurchaseRegisterData: null,
    error: null,
}


/* ===================================================
   SLICE
=================================================== */

const purchaseRegisterSlice = createSlice({
    name: "purchaseRegiste",
    initialState,
    reducers: {
        clearPurchaseRegisterError: (state) => {
            state.error = null;
        },

        clearPurchaseRegisterData: (state) => {
            state.PurchaseRegisterData = null;
        }
    },
    extraReducers: (builder) => {
        builder
        /* ADD / GET SALES REGISTER */

        .addCase(addPurchaseRegister.pending,(state)=>{
            state.addLoader=true;
            state.error=null;
        })

        .addCase(addPurchaseRegister.fulfilled,(state,action)=>{
            state.addLoader=false;
            state.PurchaseRegisterData=action.payload;
            state.error=null;
        })

        .addCase(addPurchaseRegister.rejected,(state,action)=>{
            
            state.addLoader=false;
            state.error=action.payload?.message || "Failed to create purchase register"

        })

    }


})


export const { clearPurchaseRegisterError , clearPurchaseRegisterData }=purchaseRegisterSlice.actions;

export default purchaseRegisterSlice.reducer;
