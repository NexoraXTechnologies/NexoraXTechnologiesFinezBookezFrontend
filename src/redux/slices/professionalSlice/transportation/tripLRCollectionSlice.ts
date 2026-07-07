
// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import professionalAxios from "../../../../services/professionalAxios";


// type TripLRCollectionState = {
//     limit?: number;
//     offset?: number;
//     search?: string;
//     tripStatus?: string;
//     priority?: string;
// }


// /* ===================================================
//     CREATE tripLR Entry
// =================================================== */

// export const createLRCollection = createAsyncThunk(
//     "tripLRCollection/createLRCollection",
//     async (payload: any, { rejectWithValue }) => {
//         try {
//             const response = await professionalAxios.post(
//                 "/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/save", { payload }
//             );
//             if (!response?.data?.success) {
//                 return rejectWithValue({
//                     message: response?.data?.message || "Failed to create trip LR Entry"
//                 })
//             }
//             return response?.data || null
//         } catch (error: any) {
//             return rejectWithValue({
//                 message: error?.data?.message || error?.message || "Failed to create trip LR Entry"
//             })
//         }
//     }
// )

// /* ===================================================
//     GET ALL LR Collection
// =================================================== */

// export const getAllLRCollection = createAsyncThunk(
//     "tripLRCollection/getAllLRCollection",
//     async ({
//         limit = 10,
//         offset = 0,
//         search = "",
//         tripStatus = "",
//         priority = ""
//     }: TripLRCollectionState = {},
//         { rejectWithValue }
//     ) => {
//         try {
//             const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/getAll", {
//                 params: {
//                     limit,
//                     offset,
//                     search,
//                     tripStatus,
//                     priority
//                 }
//             })

//             return response?.data || null;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message ||
//                     error?.message ||
//                     "Failed to get all trip LR Entry",
//             });
//         }
//     }
// )


// /* ===================================================
//     GET trip LR Entry  BY VOUCHER NUMBER
// =================================================== */

// export const getTripLRCollectionByVoucherNumber = createAsyncThunk(
//     "tripLRCollection/getTripLRCollectionByVoucherNumber",
//     async (voucherNumber: string, { rejectWithValue }) => {
//         try {
//             const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/getByVoucherNumber/${voucherNumber}`)
//             return response?.data || null;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message || error?.message || "Failed to get trip LR Entry"
//             })
//         }
//     }
// )



// /* ===================================================
//     DELETE TRIP LR Entry BY VOUCHER NUMBER
// =================================================== */

// export const deleteTripLRCollection = createAsyncThunk(
//     "tripLRCollection/deleteTripLRCollection",
//     async (voucherNumber: string, { rejectWithValue }) => {
//         try {
//             const response = await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/delete/${voucherNumber}`)
//             return response?.data || null;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message: error?.response?.data?.message || error?.message || "Failed to delete LR Entry"
//             })
//         }
//     }
// )

// /* ===================================================
//     UPDATE LR Entry BY VOUCHER NUMBER
// =================================================== */

// export const updateTripLRCollection = createAsyncThunk(
//     "tripLRCollection/updateTripLRCollection",
//     async ({ voucherNumber, payload }: { voucherNumber: string, payload: any }, { rejectWithValue }) => {
//         try {
//             const response = await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/update/${voucherNumber}`, {
//                 payload
//             })
//             return response?.data || null;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message: error?.response?.data?.message || error?.message || "Failed to Update LR entry"
//             })
//         }
//     }
// )

// /* ===================================================
//     SLICE
// =================================================== */

// const initialState: any = {
//     tripLRCollection: [],
//     createLoader: false,
//     updateLoader: false,
//     deleteLoader: false,
//     listingLoader: false,
//     detailLoader: false,
//     error: null
// }


// const tripLRCollectionSlice = createSlice({
//     name: "tripLRCollection",
//     initialState,
//     reducers: {
//         clearTripLRCollectionError: (state) => {
//             state.error = null;
//         },
//         clearTripLRCollectionState: (state) => {
//             state.tripLRCollection = [];
//             state.createLoader = false;
//             state.updateLoader = false;
//             state.deleteLoader = false;
//             state.listingLoader = false;
//             state.detailloader = false;
//             state.error = null;
//         }
//     },

//     extraReducers: (builder) => {
//         builder
//             //  create trip LR
//             .addCase(createLRCollection.pending, (state) => {
//                 state.createLoader = true;
//                 state.error = null;
//             })
//             .addCase(createLRCollection.fulfilled, (state, action) => {
//                 state.createLoader = false;
//                 const createTripLR = action.payload?.data;
//                 if (createTripLR) {
//                     state.tripLRCollection.push(createTripLR)
//                 }
//                 state.error = null;
//             })
//             .addCase(createLRCollection.rejected, (state, action) => {
//                 state.createLoader = false;
//                 state.error = (action.payload as { message?: string })?.message || "Failed to create trip LR Entry";
//             })


//             // get Trip LR

//             .addCase(getAllLRCollection.pending, (state) => {
//                 state.listingLoader = true;
//                 state.error = null;
//             })
//             .addCase(getAllLRCollection.fulfilled, (state, action) => {
//                 state.listingLoader = false;
//                 state.tripLRCollection = action.payload?.data || [];
//                 state.error = null;
//             })
//             .addCase(getAllLRCollection.rejected, (state, action) => {
//                 state.listingLoader = false;
//                 state.error =
//                     (action.payload as { message?: string })?.message ||
//                     "Failed to get trip LR Entry";
//             })


//             // get trip LR  BY voucher number

//             .addCase(getTripLRCollectionByVoucherNumber.pending, (state) => {
//                 state.detailLoader = true;
//                 state.error = null;
//             })
//             .addCase(getTripLRCollectionByVoucherNumber.fulfilled, (state, action) => {
//                 state.detailLoader = false;
//                 state.tripLRCollection = action.payload?.data || null;
//                 state.error = null;
//             })
//             .addCase(getTripLRCollectionByVoucherNumber.rejected, (state, action) => {
//                 state.detailLoader = false;
//                 state.error =
//                     (action.payload as { message?: string })?.message ||
//                     "Failed to get trip LR Entry";
//             })


//             // delete trip LR 

//             .addCase(deleteTripLRCollection.pending, (state) => {
//                 state.deleteLoader = true;
//                 state.error = null;
//             })
//             .addCase(deleteTripLRCollection.fulfilled, (state, action) => {
//                 state.deleteLoader = false;
//                 const deletedLR = action.payload?.data;
//                 if (deletedLR) {
//                     state.tripLRCollection = state.tripLRCollection.filter((t: any) => t.voucherNumber !== deletedLR.voucherNumber);
//                 }
//                 state.error = null;
//             })
//             .addCase(deleteTripLRCollection.rejected, (state, action) => {
//                 state.deleteLoader = false;
//                 state.error =
//                     (action.payload as { message?: string })?.message ||
//                     "Failed to delete trip LR Entry ";
//             })


//             // update trip LR

//             .addCase(updateTripLRCollection.pending, (state) => {
//                 state.updateLoader = true;
//                 state.error = null;
//             })
//             .addCase(updateTripLRCollection.fulfilled, (state, action) => {
//                 state.updateLoader = false;
//                 const updatedLR = action.payload?.data;
//                 if (updatedLR) {
//                     state.tripLRCollection = state.tripLRCollection.map((t: any) => t.voucherNumber === updatedLR.voucherNumber ? updatedLR : t);
//                 }
//                 state.error = null;
//             })
//             .addCase(updateTripLRCollection.rejected, (state, action) => {
//                 state.updateLoader = false;
//                 state.error =
//                     (action.payload as { message?: string })?.message ||
//                     "Failed to update trip LR Entry ";
//             })


//     }
// })


// export const {clearTripLRCollectionError , clearTripLRCollectionState}=tripLRCollectionSlice.actions;
// export default tripLRCollectionSlice.reducer;




import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";


type TripLRCollectionState = {
    limit?: number;
    offset?: number;
    search?: string;
    tripStatus?: string;
    priority?: string;
}


/* ===================================================
    HELPERS
=================================================== */

const getArrayFromPayload = (payload: any) => {
    const data = payload?.data || payload || {};

    const records =
        data?.records ||
        data?.tripLRCollection ||
        data?.data?.records ||
        data?.data?.tripLRCollection ||
        data?.data ||
        payload?.records ||
        payload?.tripLRCollection ||
        [];

    return Array.isArray(records) ? records : [];
};

const getPaginationFromPayload = (payload: any, records: any[] = []) => {
    const data = payload?.data || payload || {};

    return (
        data?.pagination ||
        data?.data?.pagination || {
            totalDocs: records.length,
            totalRecords: records.length,
            hasPrevPage: false,
            hasNextPage: false,
        }
    );
};

const getSingleLRFromPayload = (payload: any) => {
    const data = payload?.data || payload || {};

    if (Array.isArray(data)) return data[0] || null;
    if (Array.isArray(data?.records)) return data.records[0] || null;
    if (Array.isArray(data?.tripLRCollection)) return data.tripLRCollection[0] || null;

    return data || null;
};

const getLRVoucher = (item: any) =>
    item?.voucherNumber ||
    item?.lrVoucherNumber ||
    item?.tripLRVoucherNumber ||
    item?.lrNumber ||
    "";

/* ===================================================
    CREATE tripLR Entry
=================================================== */

export const createLRCollection = createAsyncThunk(
    "tripLRCollection/createLRCollection",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/save", { payload }
            );
            if (!response?.data?.success) {
                return rejectWithValue({
                    message: response?.data?.message || "Failed to create trip LR Entry"
                })
            }
            return response?.data || null
        } catch (error: any) {
            return rejectWithValue({
                message: error?.data?.message || error?.message || "Failed to create trip LR Entry"
            })
        }
    }
)

/* ===================================================
    GET ALL LR Collection
=================================================== */

export const getAllLRCollection = createAsyncThunk(
    "tripLRCollection/getAllLRCollection",
    async ({
        limit = 10,
        offset = 0,
        search = "",
        tripStatus = "",
        priority = ""
    }: TripLRCollectionState = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/getAll", {
                params: {
                    limit,
                    offset,
                    search,
                    tripStatus,
                    priority
                }
            })

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get all trip LR Entry",
            });
        }
    }
)


/* ===================================================
    GET trip LR Entry  BY VOUCHER NUMBER
=================================================== */

export const getTripLRCollectionByVoucherNumber = createAsyncThunk(
    "tripLRCollection/getTripLRCollectionByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/getByVoucherNumber/${voucherNumber}`)
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message || error?.message || "Failed to get trip LR Entry"
            })
        }
    }
)



/* ===================================================
    DELETE TRIP LR Entry BY VOUCHER NUMBER
=================================================== */

export const deleteTripLRCollection = createAsyncThunk(
    "tripLRCollection/deleteTripLRCollection",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/delete/${voucherNumber}`)
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || error?.message || "Failed to delete LR Entry"
            })
        }
    }
)

/* ===================================================
    UPDATE LR Entry BY VOUCHER NUMBER
=================================================== */

export const updateTripLRCollection = createAsyncThunk(
    "tripLRCollection/updateTripLRCollection",
    async ({ voucherNumber, payload }: { voucherNumber: string, payload: any }, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/update/${voucherNumber}`, {
                payload
            })
            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message || error?.message || "Failed to Update LR entry"
            })
        }
    }
)

/* ===================================================
    SLICE
=================================================== */

const initialState: any = {
    tripLRCollection: [],
    selectedTripLRCollection: null,
    pagination: {
        totalDocs: 0,
        totalRecords: 0,
        hasPrevPage: false,
        hasNextPage: false,
    },
    createLoader: false,
    updateLoader: false,
    deleteLoader: false,
    listingLoader: false,
    detailLoader: false,
    error: null
}


const tripLRCollectionSlice = createSlice({
    name: "tripLRCollection",
    initialState,
    reducers: {
        clearTripLRCollectionError: (state) => {
            state.error = null;
        },
        clearTripLRCollectionState: (state) => {
            state.tripLRCollection = [];
            state.selectedTripLRCollection = null;
            state.pagination = {
                totalDocs: 0,
                totalRecords: 0,
                hasPrevPage: false,
                hasNextPage: false,
            };
            state.createLoader = false;
            state.updateLoader = false;
            state.deleteLoader = false;
            state.listingLoader = false;
            state.detailLoader = false;
            state.error = null;
        }
    },

    extraReducers: (builder) => {
        builder
            //  create trip LR
            .addCase(createLRCollection.pending, (state) => {
                state.createLoader = true;
                state.error = null;
            })
            .addCase(createLRCollection.fulfilled, (state, action) => {
                state.createLoader = false;
                const createTripLR = getSingleLRFromPayload(action.payload);
                if (createTripLR) {
                    const currentList = Array.isArray(state.tripLRCollection)
                        ? state.tripLRCollection
                        : [];

                    state.tripLRCollection = [createTripLR, ...currentList];
                    state.selectedTripLRCollection = createTripLR;
                }
                state.error = null;
            })
            .addCase(createLRCollection.rejected, (state, action) => {
                state.createLoader = false;
                state.error = (action.payload as { message?: string })?.message || "Failed to create trip LR Entry";
            })


            // get Trip LR

            .addCase(getAllLRCollection.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getAllLRCollection.fulfilled, (state, action) => {
                state.listingLoader = false;

                const records = getArrayFromPayload(action.payload);

                state.tripLRCollection = records;
                state.pagination = getPaginationFromPayload(action.payload, records);
                state.error = null;
            })
            .addCase(getAllLRCollection.rejected, (state, action) => {
                state.listingLoader = false;
                state.tripLRCollection = [];
                state.pagination = {
                    totalDocs: 0,
                    totalRecords: 0,
                    hasPrevPage: false,
                    hasNextPage: false,
                };
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get trip LR Entry";
            })


            // get trip LR  BY voucher number

            .addCase(getTripLRCollectionByVoucherNumber.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
            })
            .addCase(getTripLRCollectionByVoucherNumber.fulfilled, (state, action) => {
                state.detailLoader = false;
                state.selectedTripLRCollection = getSingleLRFromPayload(action.payload);
                state.error = null;
            })
            .addCase(getTripLRCollectionByVoucherNumber.rejected, (state, action) => {
                state.detailLoader = false;
                state.selectedTripLRCollection = null;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get trip LR Entry";
            })


            // delete trip LR 

            .addCase(deleteTripLRCollection.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteTripLRCollection.fulfilled, (state, action) => {
                state.deleteLoader = false;
                const deletedLR = getSingleLRFromPayload(action.payload);
                const deletedVoucher = getLRVoucher(deletedLR);
                const currentList = Array.isArray(state.tripLRCollection)
                    ? state.tripLRCollection
                    : [];

                if (deletedVoucher) {
                    state.tripLRCollection = currentList.filter(
                        (t: any) => getLRVoucher(t) !== deletedVoucher
                    );
                }
                state.error = null;
            })
            .addCase(deleteTripLRCollection.rejected, (state, action) => {
                state.deleteLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to delete trip LR Entry ";
            })


            // update trip LR

            .addCase(updateTripLRCollection.pending, (state) => {
                state.updateLoader = true;
                state.error = null;
            })
            .addCase(updateTripLRCollection.fulfilled, (state, action) => {
                state.updateLoader = false;
                const updatedLR = getSingleLRFromPayload(action.payload);
                const updatedVoucher = getLRVoucher(updatedLR);
                const currentList = Array.isArray(state.tripLRCollection)
                    ? state.tripLRCollection
                    : [];

                if (updatedLR && updatedVoucher) {
                    const exists = currentList.some(
                        (t: any) => getLRVoucher(t) === updatedVoucher
                    );

                    state.tripLRCollection = exists
                        ? currentList.map((t: any) =>
                              getLRVoucher(t) === updatedVoucher ? updatedLR : t
                          )
                        : [updatedLR, ...currentList];

                    state.selectedTripLRCollection = updatedLR;
                }
                state.error = null;
            })
            .addCase(updateTripLRCollection.rejected, (state, action) => {
                state.updateLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to update trip LR Entry ";
            })


    }
})


export const {clearTripLRCollectionError , clearTripLRCollectionState}=tripLRCollectionSlice.actions;
export default tripLRCollectionSlice.reducer;