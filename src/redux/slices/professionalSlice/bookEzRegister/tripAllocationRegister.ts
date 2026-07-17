import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

export type TripAllocationRegisterParams = {
    fromDate?: string;
    toDate?: string;
    offset?: number;
    limit?: number;
    exportType?: "pdf" | "excel" | "";
};

type PaginationState = {
    offset: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

type TripAllocationRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    exportLoader: boolean;
    tripAllocationRegisterData: any[];
    pagination: PaginationState;
    error: string | null;
};

/* ===================================================
   HELPERS
=================================================== */

const createEmptyPagination = (): PaginationState => ({
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
});

const extractRegisterResponse = (response: any) => {
    const root =
        response?.data?.data ??
        response?.data ??
        response ??
        {};

    const records =
        root?.trips ||
        root?.tripAllocations ||
        root?.tripAllocationRegister ||
        root?.allocations ||
        root?.records ||
        root?.items ||
        root?.invoices ||
        [];

    const pagination =
        root?.pagination ||
        response?.data?.pagination ||
        response?.pagination ||
        {};

    return {
        records: Array.isArray(records)
            ? records
            : [],

        pagination: {
            offset: Number(
                pagination?.offset ?? 0
            ),
            limit: Number(
                pagination?.limit ?? 10
            ),
            totalDocs: Number(
                pagination?.totalDocs ??
                (Array.isArray(records)
                    ? records.length
                    : 0)
            ),
            totalPages: Number(
                pagination?.totalPages ?? 0
            ),
            currentPage: Number(
                pagination?.currentPage ?? 1
            ),
            hasNextPage: Boolean(
                pagination?.hasNextPage
            ),
            hasPrevPage: Boolean(
                pagination?.hasPrevPage
            ),
        },
    };
};

/* ===================================================
   GET TRIP ALLOCATION REGISTER
=================================================== */

export const getTripAllocationRegister =
    createAsyncThunk<
        any,
        TripAllocationRegisterParams,
        { rejectValue: RejectValue }
    >(
        "tripAllocationRegister/getTripAllocationRegister",
        async (
            {
                fromDate = "",
                toDate = "",
                offset = 0,
                limit = 10,
                exportType = "",
            },
            { rejectWithValue }
        ) => {
            try {
                const isExport =
                    exportType === "pdf" ||
                    exportType === "excel";

                const response =
                    await professionalAxios.post(
                        "/eTaxSolnMongoApiBackend/users/bookEZ/registers/tripAllocationRegister",
                        {
                            fromDate,
                            toDate,
                            offset,
                            limit,
                            exportType,
                        },
                        isExport
                            ? {
                                responseType:
                                    "blob",
                            }
                            : undefined
                    );

                if (isExport) {
                    return {
                        blob: response.data,
                        exportType,
                    };
                }

                if (
                    response?.data?.success ===
                    false
                ) {
                    return rejectWithValue({
                        message:
                            response?.data
                                ?.message ||
                            "Failed to fetch trip allocation register",
                    });
                }

                return extractRegisterResponse(
                    response
                );
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to fetch trip allocation register",
                });
            }
        }
    );

/*
 * Backward-compatible alias.
 * Existing pages that still dispatch addTripAllocationRegister
 * will continue to work.
 */
export const addTripAllocationRegister =
    getTripAllocationRegister;

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: TripAllocationRegisterState = {
    addLoader: false,
    listingLoader: false,
    exportLoader: false,
    tripAllocationRegisterData: [],
    pagination: createEmptyPagination(),
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const tripAllocationRegisterSlice =
    createSlice({
        name: "tripAllocationRegister",
        initialState,

        reducers: {
            clearTripAllocationRegisterError:
                (state) => {
                    state.error = null;
                },

            clearTripAllocationRegisterData:
                (state) => {
                    state.tripAllocationRegisterData =
                        [];

                    state.pagination =
                        createEmptyPagination();
                },
        },

        extraReducers: (builder) => {
            builder
                .addCase(
                    getTripAllocationRegister.pending,
                    (state, action) => {
                        const isExport =
                            Boolean(
                                action.meta.arg
                                    ?.exportType
                            );

                        if (isExport) {
                            state.exportLoader =
                                true;
                        } else {
                            state.addLoader = true;
                            state.listingLoader =
                                true;
                        }

                        state.error = null;
                    }
                )

                .addCase(
                    getTripAllocationRegister.fulfilled,
                    (state, action) => {
                        const isExport =
                            Boolean(
                                action.meta.arg
                                    ?.exportType
                            );

                        if (isExport) {
                            state.exportLoader =
                                false;
                            return;
                        }

                        state.addLoader = false;
                        state.listingLoader =
                            false;

                        state.tripAllocationRegisterData =
                            action.payload
                                ?.records || [];

                        state.pagination =
                            action.payload
                                ?.pagination ||
                            createEmptyPagination();

                        state.error = null;
                    }
                )

                .addCase(
                    getTripAllocationRegister.rejected,
                    (state, action) => {
                        const isExport =
                            Boolean(
                                action.meta.arg
                                    ?.exportType
                            );

                        if (isExport) {
                            state.exportLoader =
                                false;
                        } else {
                            state.addLoader = false;
                            state.listingLoader =
                                false;

                            state.tripAllocationRegisterData =
                                [];

                            state.pagination =
                                createEmptyPagination();
                        }

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to fetch trip allocation register";
                    }
                );
        },
    });

export const {
    clearTripAllocationRegisterError,
    clearTripAllocationRegisterData,
} = tripAllocationRegisterSlice.actions;

export default tripAllocationRegisterSlice.reducer;