
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type TripAllocationState={
    limit?:number;
    offset?:number;
    search?:string;
    tripStatus?:string;
    priority?:string;
}

/* ===================================================
    CREATE Trip Allocation Slice
=================================================== */


export const createTripAllocation=createAsyncThunk(
    "tripAllocation/createTripAllocation",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/save",
                { payload }
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message:
                        response?.data?.message || "Failed to create trip allocation",
                });
            }

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to create trip allocation",
            });
        }
    }
);


/* ===================================================
    GET ALL TRIP ALLOCATIONS
=================================================== */


export const getAllTripAllocation=createAsyncThunk(
    "tripAllocation/getAllTripAllocation",
    async(
        {
        limit=10,
        offset=0,
        search="",
        tripStatus="",
        priority="",
    }: TripAllocationState = {},
    {rejectWithValue}
)=>{
        try {
            const response=await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/getAll",{
                params:{
                    limit,
                    offset,
                    search,
                    tripStatus,
                    priority
                }
            })

            return response?.data || null;
        } catch (error:any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get all trip allocations",
            });
        }
    }
)


/* ===================================================
    GET trip allocation  BY VOUCHER NUMBER
=================================================== */

export const getTripAllocationByVoucherNumber=createAsyncThunk(
    "tripAllocation/getTripAllocationByVoucherNumber",
    async(voucherNumber:string,{rejectWithValue})=>{
        try {
            const response=await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/getByVoucherNumber/${voucherNumber}`);
            return response?.data || null;
        } catch (error:any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get trip allocation ",
            });
        }
    }
)


/* ===================================================
    DELETE TRIP ALLOCATION BY VOUCHER NUMBER
=================================================== */

export const deleteTripAllocationByVoucherNumber=createAsyncThunk(
    "tripAllocation/deleteTripAllocationByVoucherNumber",
    async(voucherNumber:string,{rejectWithValue})=>{
        try {
            const response=await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/delete/${voucherNumber}`);
            return response?.data || null;
        } catch (error:any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to delete trip allocation ",
            });
        }
    }
)


/* ===================================================
    UPDATE TRIP ALLOCATION BY VOUCHER NUMBER
=================================================== */

export const updateTripAllocationByVoucherNumber=createAsyncThunk(
    "tripAllocation/updateTripAllocationByVoucherNumber",
    async({voucherNumber, updateData}:{voucherNumber:string, updateData:any},{rejectWithValue})=>{
        try {
            const response=await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/update/${voucherNumber}`, updateData);
            return response?.data || null;
        } catch (error:any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to update trip allocation ",
            });
        }
    }
)


/* ===================================================
    SLICE
=================================================== */

const initialState:any={
    tripAllocations:[],
    createLoader:false,
    updateLoader:false,
    deleteLoader:false,
    listingLoader:false,
    detailLoader:false,
    error:null
}


const tripAllocationSlice=createSlice({
    name:"tripAllocation",
    initialState,
    reducers:{
        clearTripAllocationError:(state)=>{
            state.error=null;
        },
        clearTripAllocationState:(state)=>{
            state.tripAllocations=[];
            state.createLoader=false;
            state.updateLoader=false;
            state.deleteLoader=false;
            state.listingLoader=false;
            state.error=null;
        }

    },

    extraReducers:(builder)=>{
        builder

        // CREATE TRIP ALLOCATION
        .addCase(createTripAllocation.pending,(state)=>{
            state.createLoader=true;
            state.error=null;
        })
        .addCase(createTripAllocation.fulfilled,(state,action)=>{
            state.createLoader=false;
            const createtrip=action.payload?.data;
            if(createtrip){
                state.tripAllocations.push(createtrip);
            }
            state.error=null;
        })
        .addCase(createTripAllocation.rejected,(state,action)=>{
            state.createLoader=false;
            state.error=
                (action.payload as { message?: string })?.message ||
                "Failed to create trip allocation";
        })

        // GET ALL TRIP ALLOCATIONS
        .addCase(getAllTripAllocation.pending,(state)=>{
            state.listingLoader=true;
            state.error=null;
        })
        .addCase(getAllTripAllocation.fulfilled,(state,action)=>{
            state.listingLoader=false;
            state.tripAllocations=action.payload?.data || [];
            state.error=null;
        })
        .addCase(getAllTripAllocation.rejected,(state,action)=>{
            state.listingLoader=false;
            state.error=
                (action.payload as { message?: string })?.message ||
                "Failed to get trip allocations";
        })


        // GET TRIP ALLOCATION BY VOUCHER NUMBER
        .addCase(getTripAllocationByVoucherNumber.pending,(state)=>{
            state.detailLoader=true;
            state.error=null;
        })
        .addCase(getTripAllocationByVoucherNumber.fulfilled,(state,action)=>{
            state.detailLoader=false;
            state.tripAllocations=action.payload?.data || null;
            state.error=null;
        })
        .addCase(getTripAllocationByVoucherNumber.rejected,(state,action)=>{
            state.detailLoader=false;
            state.error=
                (action.payload as { message?: string })?.message ||
                "Failed to get trip allocation ";
        })

        // DELETE TRIP ALLOCATION BY VOUCHER NUMBER
        .addCase(deleteTripAllocationByVoucherNumber.pending,(state)=>{
            state.deleteLoader=true;
            state.error=null;
        })
        .addCase(deleteTripAllocationByVoucherNumber.fulfilled,(state,action)=>{
            state.deleteLoader=false;
            const deletedTrip=action.payload?.data;
            if(deletedTrip){
                state.tripAllocations=state.tripAllocations.filter((t:any) => t.voucherNumber !== deletedTrip.voucherNumber);
            }
            state.error=null;
        })
        .addCase(deleteTripAllocationByVoucherNumber.rejected,(state,action)=>{
            state.deleteLoader=false;
            state.error=
                (action.payload as { message?: string })?.message ||
                "Failed to delete trip allocation ";
        })


        // UPDATE TRIP ALLOCATION BY VOUCHER NUMBER

        .addCase(updateTripAllocationByVoucherNumber.pending,(state)=>{
            state.updateLoader=true;
            state.error=null;
        })
        .addCase(updateTripAllocationByVoucherNumber.fulfilled,(state,action)=>{
            state.updateLoader=false;
            const updatedTrip=action.payload?.data;
            if(updatedTrip){
                state.tripAllocations=state.tripAllocations.map((t:any) => t.voucherNumber === updatedTrip.voucherNumber ? updatedTrip : t);
            }
            state.error=null;
        })
        .addCase(updateTripAllocationByVoucherNumber.rejected,(state,action)=>{
            state.updateLoader=false;
            state.error=
                (action.payload as { message?: string })?.message ||
                "Failed to update trip allocation ";
        })

    }
})

export const {clearTripAllocationError , clearTripAllocationState}=tripAllocationSlice.actions;
export default tripAllocationSlice.reducer;