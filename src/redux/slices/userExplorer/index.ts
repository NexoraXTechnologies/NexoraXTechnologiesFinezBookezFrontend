import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

const DB_ACCESS_HEADERS = {
    "x-db-name": "NexoraX-RegisteredUsers",
};

/* ===================================================
   REQUEST DB ACCESS
=================================================== */

export const requestDbAccess = createAsyncThunk(
    "dbAccess/requestDbAccess",
    async (
        {
            parentMobileNumber,
            requestMessage,
            firstName,
            middleName,
            lastName,
            userEmail,
            userAddress,
            authTokenDigest,
            state,
            city
        }: {
            parentMobileNumber: string;
            requestMessage: string;
            firstName: string;
            middleName: string;
            lastName: string;
            userEmail: string;
                userAddress: string;
                authTokenDigest: string;
                state: any;
                city: any;
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await professionalAxios.post(
                `eTaxSolnMongoApiBackend/users/admin/dbAccess/request`,
                {
                    parentMobileNumber,
                    requestMessage,
                    firstName,
                    middleName,
                    lastName,
                    userEmail,
                    userAddress,
                    authTokenDigest,
                    state,
                    city
                },
                {
                    headers: DB_ACCESS_HEADERS,
                }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message || "Failed to request database access",
                    status: res?.status,
                });
            }

            return {
                message: res.data?.message,
                data: res.data?.data,
            };
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    "Failed to request database access",
                status: err?.response?.status,
            });
        }
    }
);

/* ===================================================
   GET DATABASE LIST
=================================================== */

export const getDatabaseList = createAsyncThunk(
    "dbAccess/getDatabaseList",
    async (
        {
            offset = 0,
            limit = 10,
            search = "",
        }: {
            offset?: number;
            limit?: number;
            search?: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const params: {
                offset: number;
                limit: number;
                search?: string;
            } = {
                offset,
                limit,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            const res = await professionalAxios.get(
                `eTaxSolnMongoApiBackend/users/admin/dbAccess/getAll`,
                {
                    params,
                    headers: DB_ACCESS_HEADERS,
                }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message || "Failed to fetch database list",
                    status: res?.status,
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    "Failed to fetch database list",
                status: err?.response?.status,
            });
        }
    }
);

/* ===================================================
   GET DB ACCESS REQUESTS
=================================================== */

export const getDbAccessRequests = createAsyncThunk(
    "dbAccess/getDbAccessRequests",
    async (
        {
            offset = 0,
            limit = 100,
            status = "",
            search = "",
        }: {
            offset?: number;
            limit?: number;
            status?: string;
            search?: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const params: {
                offset: number;
                limit: number;
                status?: string;
                search?: string;
            } = {
                offset,
                limit,
            };

            if (status.trim()) {
                params.status = status.trim();
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const res = await professionalAxios.get(
                `eTaxSolnMongoApiBackend/users/admin/dbAccess/requests`,
                {
                    params,
                    headers: DB_ACCESS_HEADERS,
                }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch DB access requests",
                    status: res?.status,
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    "Failed to fetch DB access requests",
                status: err?.response?.status,
            });
        }
    }
);

export const getDbAccessRequestsUser = createAsyncThunk(
    "dbAccess/getDbAccessRequestsUser",
    async (
        {
            offset = 0,
            limit = 100,
            status = "",
            search = "",
        }: {
            offset?: number;
            limit?: number;
            status?: string;
            search?: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const params: {
                offset: number;
                limit: number;
                status?: string;
                search?: string;
            } = {
                offset,
                limit,
            };

            if (status.trim()) {
                params.status = status.trim();
            }

            if (search.trim()) {
                params.search = search.trim();
            }

            const res = await professionalAxios.get(
                `eTaxSolnMongoApiBackend/users/parent/dbAccess/requests`,
                {
                    params,
                    headers: DB_ACCESS_HEADERS,
                }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch DB access requests",
                    status: res?.status,
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    "Failed to fetch DB access requests",
                status: err?.response?.status,
            });
        }
    }
);

export const acceptRequestsUser = createAsyncThunk(
    "dbAccess/acceptRequestsUser",
    async ({ requestId, action=""}: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.patch(
                `eTaxSolnMongoApiBackend/users/parent/dbAccess/request/action/${requestId}`,
                {
                    action
                }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch DB access requests",
                    status: res?.status,
                });
            }

            return res.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    "Failed to fetch DB access requests",
                status: err?.response?.status,
            });
        }
    }
);

/* ===================================================
   GET DB ACCESS REQUEST BY REQUEST ID
=================================================== */

export const getDbAccessRequestById = createAsyncThunk(
    "dbAccess/getDbAccessRequestById",
    async (
        {
            requestId,
        }: {
            requestId: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await professionalAxios.get(
                `eTaxSolnMongoApiBackend/users/admin/dbAccess/request/${requestId}`,
                {
                    headers: DB_ACCESS_HEADERS,
                }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch DB access request details",
                    status: res?.status,
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    "Failed to fetch DB access request details",
                status: err?.response?.status,
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const dbAccessSlice = createSlice({
    name: "dbAccess",

    initialState: {
        databaseList: [],
        accessRequestData: null,
        accessRequests: [],
        selectedAccessRequest: null,

        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },

        accessRequestsPagination: {
            offset: 0,
            limit: 100,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },

        requestLoading: false,
        loading: false,
        accessRequestsLoading: false,
        detailLoading: false,
        error: null,
    },

    reducers: {
        clearDbAccessState: (state) => {
            state.error = null;
            state.accessRequestData = null;
            state.selectedAccessRequest = null;
            state.requestLoading = false;
            state.loading = false;
            state.accessRequestsLoading = false;
            state.detailLoading = false;
        },

        clearDbAccessList: (state) => {
            state.databaseList = [];
            state.pagination = {
                offset: 0,
                limit: 10,
                totalDocs: 0,
                totalPages: 1,
                currentPage: 1,
                hasNextPage: false,
                hasPrevPage: false,
            };
        },

        clearDbAccessRequests: (state) => {
            state.accessRequests = [];
            state.accessRequestsPagination = {
                offset: 0,
                limit: 100,
                totalDocs: 0,
                totalPages: 1,
                currentPage: 1,
                hasNextPage: false,
                hasPrevPage: false,
            };
        },

        clearSelectedAccessRequest: (state) => {
            state.selectedAccessRequest = null;
            state.detailLoading = false;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(requestDbAccess.pending, (state) => {
                state.requestLoading = true;
                state.error = null;
            })
            .addCase(requestDbAccess.fulfilled, (state, action: any) => {
                state.requestLoading = false;
                state.accessRequestData = action.payload?.data || null;
            })
            .addCase(requestDbAccess.rejected, (state, action: any) => {
                state.requestLoading = false;
                state.error = action.payload?.message;
                state.accessRequestData = null;
            });

        builder
            .addCase(getDatabaseList.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getDatabaseList.fulfilled, (state, action: any) => {
                state.loading = false;

                const data = action.payload;

                state.databaseList =
                    data?.records ||
                    data?.databases ||
                    data?.databaseList ||
                    [];

                state.pagination = data?.pagination ?? state.pagination;
            })
            .addCase(getDatabaseList.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.databaseList = [];
            });

        builder
            .addCase(getDbAccessRequests.pending, (state) => {
                state.accessRequestsLoading = true;
                state.error = null;
            })
            .addCase(getDbAccessRequests.fulfilled, (state, action: any) => {
                state.accessRequestsLoading = false;

                const data = action.payload;

                state.accessRequests =
                    data?.records ||
                    data?.requests ||
                    data?.accessRequests ||
                    [];

                state.accessRequestsPagination =
                    data?.pagination ?? state.accessRequestsPagination;
            })
            .addCase(getDbAccessRequests.rejected, (state, action: any) => {
                state.accessRequestsLoading = false;
                state.error = action.payload?.message;
                state.accessRequests = [];
            });

        builder
            .addCase(getDbAccessRequestById.pending, (state) => {
                state.detailLoading = true;
                state.error = null;
            })
            .addCase(getDbAccessRequestById.fulfilled, (state, action: any) => {
                state.detailLoading = false;
                state.selectedAccessRequest = action.payload || null;
            })
            .addCase(getDbAccessRequestById.rejected, (state, action: any) => {
                state.detailLoading = false;
                state.error = action.payload?.message;
                state.selectedAccessRequest = null;
            });
    },
});

export const {
    clearDbAccessState,
    clearDbAccessList,
    clearDbAccessRequests,
    clearSelectedAccessRequest,
} = dbAccessSlice.actions;

export default dbAccessSlice.reducer;