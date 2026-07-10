import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type GetTransportOrdersParams = {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    priority?: string;
};

type TransportOrderState = {
    transportOrders: any[];
    transportOrder: any | null;
    pagination: {
        offset: number;
        limit: number;
        totalDocs: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    createLoader: boolean;
    listingLoader: boolean;
    detailLoader: boolean;
    deleteLoader: boolean;
    updateLoader: boolean;
    error: any | null;
};

const initialState: TransportOrderState = {
    transportOrders: [],
    transportOrder: null,

    pagination: {
        offset: 0,
        limit: 20,
        totalDocs: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },

    createLoader: false,
    listingLoader: false,
    detailLoader: false,
    deleteLoader: false,
    updateLoader: false,
    error: null,
};

/* ===================================================
    CREATE TRANSPORT ORDER
=================================================== */

export const createTransportOrder = createAsyncThunk(
    "transportationOrder/createTransportOrder",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/transportOrder/save",
                payload
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message:
                        response?.data?.message || "Failed to create transport order",
                });
            }

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to create transport order",
            });
        }
    }
);

/* ===================================================
    GET ALL TRANSPORT ORDERS
=================================================== */

export const getTransportOrders = createAsyncThunk(
    "transportationOrder/getTransportOrders",
    async (
        {
            limit = 10,
            offset = 0,
            search = "",
            status = "",
            priority = "",
        }: GetTransportOrdersParams = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookEZ/transportOrder/getAll",
                {
                    params: {
                        limit,
                        offset,
                        search,
                        status,
                        priority,
                    },
                }
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get transport orders",
            });
        }
    }
);

/* ===================================================
    GET TRANSPORT ORDER BY VOUCHER NUMBER
=================================================== */

export const getTransportOrderByVoucherNumber = createAsyncThunk(
    "transportationOrder/getTransportOrderByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookEZ/transportOrder/getByVoucherNumber/${voucherNumber}`
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get transport order by voucher number",
            });
        }
    }
);

/* ===================================================
    DELETE TRANSPORT ORDER BY VOUCHER NUMBER
=================================================== */

export const deleteTransportOrderByVoucherNumber = createAsyncThunk(
    "transportationOrder/deleteTransportOrderByVoucherNumber",
    async (voucherNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookEZ/transportOrder/delete/${voucherNumber}`
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to delete transport order by voucher number",
            });
        }
    }
);

/* ===================================================
    UPDATE TRANSPORT ORDER BY VOUCHER NUMBER
=================================================== */

export const updateTransportOrderByVoucherNumber = createAsyncThunk(
    "transportationOrder/updateTransportOrderByVoucherNumber",
    async (
        {
            voucherNumber,
            payload,
        }: {
            voucherNumber: string;
            payload: any;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookEZ/transportOrder/update/${voucherNumber}`,
                payload
            );

            if (!response?.data?.success) {
                return rejectWithValue({
                    message:
                        response?.data?.message || "Failed to update transport order",
                });
            }

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to update transport order by voucher number",
            });
        }
    }
);

/* ===================================================
    SLICE
=================================================== */

const transportOrderSlice = createSlice({
    name: "transportationOrder",
    initialState,
    reducers: {
        clearTransportOrder: (state) => {
            state.transportOrder = null;
        },
        clearTransportOrderError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder

            /* ================= CREATE ================= */

            .addCase(createTransportOrder.pending, (state) => {
                state.createLoader = true;
                state.error = null;
            })
            .addCase(createTransportOrder.fulfilled, (state, action) => {
                state.createLoader = false;

                const createdOrder =
                    action.payload?.data || action.payload;

                if (createdOrder) {
                    state.transportOrders.push(createdOrder);
                }

                state.error = null;
            })
            .addCase(createTransportOrder.rejected, (state, action) => {
                state.createLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to create transport order";
            })

            /* ================= GET ALL ================= */

            .addCase(getTransportOrders.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getTransportOrders.fulfilled, (state, action) => {
                state.listingLoader = false;

                const payload = action.payload;
                const responseData = payload?.data || {};

                state.transportOrders = Array.isArray(responseData?.records)
                    ? responseData.records
                    : [];

                state.pagination = {
                    offset: Number(responseData?.pagination?.offset ?? 0),
                    limit: Number(responseData?.pagination?.limit ?? 20),
                    totalDocs: Number(responseData?.pagination?.totalDocs ?? 0),
                    totalPages: Number(responseData?.pagination?.totalPages ?? 0),
                    currentPage: Number(responseData?.pagination?.currentPage ?? 1),
                    hasNextPage: Boolean(responseData?.pagination?.hasNextPage),
                    hasPrevPage: Boolean(responseData?.pagination?.hasPrevPage),
                };

                state.error = null;
            })
            .addCase(getTransportOrders.rejected, (state, action) => {
                state.listingLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get transport orders";
                state.transportOrders = [];
            })

            /* ================= GET BY VOUCHER ================= */

            .addCase(getTransportOrderByVoucherNumber.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
                state.transportOrder = null;
            })
            .addCase(getTransportOrderByVoucherNumber.fulfilled, (state, action) => {
                state.detailLoader = false;

                state.transportOrder =
                    action.payload?.data || null;

                state.error = null;
            })
            .addCase(getTransportOrderByVoucherNumber.rejected, (state, action) => {
                state.detailLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to get transport order ";
                state.transportOrder = null;
            })

            /* ================= DELETE ================= */

            .addCase(deleteTransportOrderByVoucherNumber.pending, (state) => {
                state.deleteLoader = true;
                state.error = null;
            })
            .addCase(deleteTransportOrderByVoucherNumber.fulfilled, (state, action) => {
                state.deleteLoader = false;

                const deletedVoucherNumber = action.payload?.data?.voucherNumber || action.payload?.voucherNumber;

                state.transportOrders = state.transportOrders.filter((order: any) => {
                    const orderVoucherNumber =
                        order?.transportOrderVoucherNumber || order?.voucherNumber;

                    return orderVoucherNumber !== deletedVoucherNumber;
                });

                state.error = null;
            })
            .addCase(deleteTransportOrderByVoucherNumber.rejected, (state, action) => {
                state.deleteLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to delete transport order ";
            })

            /* ================= UPDATE ================= */

            .addCase(updateTransportOrderByVoucherNumber.pending, (state) => {
                state.updateLoader = true;
                state.error = null;
            })
            .addCase(updateTransportOrderByVoucherNumber.fulfilled, (state, action) => {
                state.updateLoader = false;

                const updatedOrder =
                    action.payload?.data || action.payload;

                if (updatedOrder) {
                    const updatedVoucherNumber =
                        updatedOrder?.transportOrderVoucherNumber || updatedOrder?.voucherNumber;

                    state.transportOrders = state.transportOrders.map((order: any) => {
                        const orderVoucherNumber =
                            order?.transportOrderVoucherNumber || order?.voucherNumber;
                        return orderVoucherNumber === updatedVoucherNumber
                            ? updatedOrder
                            : order;
                    });

                    state.transportOrder = updatedOrder;
                }

                state.error = null;
            })
            .addCase(updateTransportOrderByVoucherNumber.rejected, (state, action) => {
                state.updateLoader = false;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to update transport order";
            });
    },
});

export const { clearTransportOrder, clearTransportOrderError } =
    transportOrderSlice.actions;

export default transportOrderSlice.reducer;