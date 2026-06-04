import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

export const getAllSalesOrder = createAsyncThunk(
    "salesOrder/getAllSalesOrder",
    async ({ limit = 200, offset = 0, search = "" }, { rejectWithValue }) => {
        try {
            const params = {
                limit,
                offset,
                search
            }

            const res = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesOrder/getAll", { params })
            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch sales quotations",
                });
            }

            return res?.data?.data ?? []
        }
        catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    "Failed to fetch sales quotations",
            });
        }
    }
)



// Slice 

const salesOrderSlice=createSlice({
    name:"salesOrder",
    initialState:{
        salesOrders:[],
        loading:false,
        error:null
    },
    reducers:{
        clearSalesOrderState:(state)=>{
            state.loading=true;
            state.error=null;

        },
        clearSalesOrderError:(state)=>{
            state.error=null;
        }

    },


    extraReducers:(builder)=>{


        builder
        .addCase(getAllSalesOrder.pending,(state)=>{
            state.loading=true;
            state.error=null;
            
        })
        .addCase(getAllSalesOrder.fulfilled,(state,action)=>{
            state.loading=false;
            const data=action.payload;
            state.salesOrders=data.records??[];
            state.pagination=data.pagination || state.pagination


        })
        .addCase(getAllSalesOrder.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload.message || "failed to fetch sales orders";
            state.salesOrders=[];
        })
    }
})

export const {clearSalesOrderState,clearSalesOrderError}=salesOrderSlice.actions;
export default salesOrderSlice.reducer;