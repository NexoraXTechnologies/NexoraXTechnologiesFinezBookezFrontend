import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type PaymentRegisterPayload={
    payload:any
}

type RejectValue={
    message:string
}

type paymentRegisterState ={
    addLoader:boolean
    deleteLoader:boolean
    listingLoader:boolean
    paymentRegisterData:any
    error:string|null
}

export const addPaymentRegister=createAsyncThunk<
any,
PaymentRegisterPayload,
{rejectValue:RejectValue}
>(
    "paymentRegister/addPaymentRegister",async({payload},{rejectWithValue})=>{
        try {
            const res=await professionalAxios.post("/eTaxSolnMongoApiBackend/users/bookEZ/registers/paymentRegister",{...payload})
            if(!res.data?.success){
                return rejectWithValue({
                    message:res?.data?.message || "Failed to create payment register"
                })
            }
            return res?.data?.data
        } catch (error:any) {
            return rejectWithValue({
                message: error.response?.data?.message || error.message?.data?.error || "Failed to create payment register"
            })
        }
    }
)


const initialState:paymentRegisterState={
    addLoader:false,
    listingLoader:false,
    deleteLoader:false,
    paymentRegisterData:null,
    error:null
}


const paymemtRegisterSlice=createSlice({
    name:"paymentRegister",
    initialState,
    reducers:{
        clearPaymentRegisterError:(state)=>{
            state.error=null
        },

        clearPaymentRegisterData:(state)=>{
            state.paymentRegisterData=null
        }
    },

    extraReducers:(builder)=>{
        builder

        .addCase(addPaymentRegister.pending, (state)=>{
            state.addLoader=true,
            state.error=null
        })
        .addCase(addPaymentRegister.fulfilled , (state,action)=>{
            state.addLoader=false
            state.paymentRegisterData=action.payload
            state.error=null
        })

        .addCase(addPaymentRegister.rejected,(state,action)=>{
            state.addLoader=false
            state.error=action.payload?.message || "Failed to create payment register"
        })
    }
})

export const {clearPaymentRegisterError , clearPaymentRegisterData}=paymemtRegisterSlice.actions
export default paymemtRegisterSlice.reducer;