import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";


type ReceiptRegisterPayload={
    payload:any;
}

type Rejectvalue={
    message:string;
}

type ReceiptRegisterState={
    addLoader:boolean;
    listingLoader:boolean;
    deleteLoader:boolean;
    receiptRegisterData:any;
    error:string | null;
}
export const addReceiptRegister=createAsyncThunk<
any,
ReceiptRegisterPayload,
{rejectValue:Rejectvalue}
>(
    "receiptRegister/addReceiptRegister",async({payload},{rejectWithValue})=>{
        try {
            const res =await professionalAxios.post("/eTaxSolnMongoApiBackend/users/bookEZ/registers/receiptRegister",{...payload})
            if(!res?.data?.success){
                return rejectWithValue({
                    message:res?.data?.message || "Failed to create receipt register"
                })
            }
            return res?.data?.data;
        } catch (error:any) {
            return rejectWithValue({
                message:error?.response?.data?.message || error?.response?.data?.error || "Failed to create receipt register"
            })
        }
    }
);


/* ===================================================
   INITIAL STATE
=================================================== */

const initialState : ReceiptRegisterState={
    addLoader:false,
    listingLoader:false,
    deleteLoader:false,
    receiptRegisterData:null,
    error:null,
}


const receiptRegisterSlice=createSlice({
    name:"receiptRegister",
    initialState,
    reducers:{
        clearReceiptRegisterError:(state)=>{
            state.error=null
        },

        clearReceiptRegisterData:(state)=>{
            state.receiptRegisterData=null;
        }
    },

    extraReducers:(builder)=>{
        builder 

         /* ADD / GET SALES REGISTER */

         .addCase(addReceiptRegister.pending , (state)=>{
            state.addLoader=true;
            state.error=null;
         })

         .addCase(addReceiptRegister.fulfilled,(state,action)=>{
            state.addLoader=false;
            state.receiptRegisterData=action.payload;
            state.error=null;
         })

         .addCase(addReceiptRegister.rejected,(state,action)=>{
            state.addLoader=false;
            state.error=action.payload?.message || "Failed to create receipt register";

         })



    }
})


export const {clearReceiptRegisterError , clearReceiptRegisterData} =receiptRegisterSlice.actions;

export default receiptRegisterSlice.reducer;