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
                "/eTaxSolnMongoApiBackend/users/bookEZ/tripLRCollection/save", payload
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
    DOWNLOAD BOOKEZ REPORT PDF
=================================================== */

export const downloadBookezReportPdf = createAsyncThunk(
    "tripLRCollection/downloadBookezReportPdf",
    async (
        {
            reportType,
            voucherNumber,
            pdfData
        }: {
            reportType: string;
            voucherNumber: string;
            pdfData: any;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.post(
                `/eTaxSolnMongoApiBackend/users/bookez/BookezReportPdf/download-pdf/${reportType}/${voucherNumber}`,
                {
                    pdfData
                },
                {
                    responseType: "blob"
                }
            );

            const blob = new Blob([response.data], {
                type: "application/pdf"
            });

            const pdfUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = pdfUrl;
            link.download = `${voucherNumber}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(pdfUrl);

            return {
                success: true,
                voucherNumber
            };
        } catch (error: any) {
            let message = "Failed to download PDF";

            if (error?.response?.data instanceof Blob) {
                try {
                    const errorText = await error.response.data.text();
                    const errorJson = JSON.parse(errorText);

                    message =
                        errorJson?.message ||
                        errorJson?.error ||
                        message;
                } catch {
                    message = error?.message || message;
                }
            } else {
                message =
                    error?.response?.data?.message ||
                    error?.message ||
                    message;
            }

            return rejectWithValue({
                message
            });
        }
    }
);




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


            // download BookEZ report PDF
            .addCase(downloadBookezReportPdf.pending, (state) => {
                state.pdfLoader = true;
                state.error = null;
            })

            .addCase(downloadBookezReportPdf.fulfilled, (state) => {
                state.pdfLoader = false;
                state.error = null;
            })

            .addCase(downloadBookezReportPdf.rejected, (state, action) => {
                state.pdfLoader = false;

                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to download PDF";
            });


    }
})


export const { clearTripLRCollectionError, clearTripLRCollectionState } = tripLRCollectionSlice.actions;
export default tripLRCollectionSlice.reducer;