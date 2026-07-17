import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

export type TransportOrderRegisterParams = {
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

type TransportOrderRegisterState = {
    listingLoader: boolean;
    exportLoader: boolean;
    transportOrderRegisterData: any[];
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
        root?.transportOrders ||
        root?.transportOrderRegister ||
        root?.orders ||
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
        records: Array.isArray(records) ? records : [],

        pagination: {
            offset: Number(pagination?.offset ?? 0),
            limit: Number(pagination?.limit ?? 10),
            totalDocs: Number(
                pagination?.totalDocs ??
                (Array.isArray(records) ? records.length : 0)
            ),
            totalPages: Number(pagination?.totalPages ?? 0),
            currentPage: Number(pagination?.currentPage ?? 1),
            hasNextPage: Boolean(pagination?.hasNextPage),
            hasPrevPage: Boolean(pagination?.hasPrevPage),
        },
    };
};

/* ===================================================
   GET TRANSPORT ORDER REGISTER
=================================================== */

export const getTransportOrderRegister = createAsyncThunk<
    any,
    TransportOrderRegisterParams,
    { rejectValue: RejectValue }
>(
    "transportOrderRegister/getTransportOrderRegister",
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

            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/transportOrderRegister",
                {
                    fromDate,
                    toDate,
                    offset,
                    limit,
                    exportType,
                },
                isExport
                    ? {
                        responseType: "blob",
                    }
                    : undefined
            );

            if (isExport) {
                return {
                    blob: response.data,
                    exportType,
                };
            }

            if (response?.data?.success === false) {
                return rejectWithValue({
                    message:
                        response?.data?.message ||
                        "Failed to fetch transport order register",
                });
            }

            return extractRegisterResponse(response);
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch transport order register",
            });
        }
    }
);

/*
 * Optional backward-compatible alias.
 * Existing pages using addTransportOrderRegister will continue to work.
 */
export const addTransportOrderRegister =
    getTransportOrderRegister;

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: TransportOrderRegisterState = {
    listingLoader: false,
    exportLoader: false,
    transportOrderRegisterData: [],
    pagination: createEmptyPagination(),
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const transportOrderRegisterSlice = createSlice({
    name: "transportOrderRegister",
    initialState,

    reducers: {
        clearTransportOrderRegisterError: (state) => {
            state.error = null;
        },

        clearTransportOrderRegisterData: (state) => {
            state.transportOrderRegisterData = [];
            state.pagination = createEmptyPagination();
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(
                getTransportOrderRegister.pending,
                (state, action) => {
                    const isExport = Boolean(
                        action.meta.arg?.exportType
                    );

                    if (isExport) {
                        state.exportLoader = true;
                    } else {
                        state.listingLoader = true;
                    }

                    state.error = null;
                }
            )

            .addCase(
                getTransportOrderRegister.fulfilled,
                (state, action) => {
                    const isExport = Boolean(
                        action.meta.arg?.exportType
                    );

                    if (isExport) {
                        state.exportLoader = false;
                        return;
                    }

                    state.listingLoader = false;
                    state.transportOrderRegisterData = action.payload?.records || [];

                    state.pagination =
                        action.payload?.pagination ||
                        createEmptyPagination();

                    state.error = null;
                }
            )

            .addCase(
                getTransportOrderRegister.rejected,
                (state, action) => {
                    const isExport = Boolean(
                        action.meta.arg?.exportType
                    );

                    if (isExport) {
                        state.exportLoader = false;
                    } else {
                        state.listingLoader = false;
                        state.transportOrderRegisterData = [];
                        state.pagination = createEmptyPagination();
                    }

                    state.error =
                        action.payload?.message ||
                        "Failed to fetch transport order register";
                }
            );
    },
});

export const {
    clearTransportOrderRegisterError,
    clearTransportOrderRegisterData,
} = transportOrderRegisterSlice.actions;

export default transportOrderRegisterSlice.reducer;