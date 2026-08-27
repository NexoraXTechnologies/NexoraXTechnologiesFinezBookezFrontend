import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../services/professionalAxios";

type PermissionModule = {
    enabled: boolean;
    permissions: Record<string, any>;
};

type PermissionsData = Record<string, PermissionModule>;

type PermissionState = {
    loader: boolean;
    permissions: PermissionsData;
    parent: any;
    child: any;
    error: string | null;
    customMasterPermissionOptions: any;
    customTransactionPermissionOptions: any;
    customMasterOptionsLoader: boolean;
    customTransactionOptionsLoader: boolean;
    optionsError: string | null;
};

type GetPermissionsParams = {
    offset?: number;
    limit?: number;
    parentMobile: string;
    childMobile: string;
    storeInLocal: boolean;
};

type RejectValue = {
    message: string;
};

const initialState: PermissionState = {
    loader: false,
    permissions: {},
    parent: null,
    child: null,
    error: null,
    customMasterPermissionOptions: [],
    customTransactionPermissionOptions: [],
    customMasterOptionsLoader: false,
    customTransactionOptionsLoader: false,
    optionsError: null,
};

export const getAllPermissions = createAsyncThunk<any, GetPermissionsParams, { rejectValue: RejectValue }>(
    "permissions/getAllPermissions",
    async ({ offset = 0, limit = 100, parentMobile, childMobile, storeInLocal = true }: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/permissions/getAll`, { params: { offset, limit, parentMobile, childMobile } });

            if (!res.data?.success) return rejectWithValue({ message: res.data?.message || "Failed to fetch permissions" });

            return { ...res.data?.data, storeInLocal };
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || error?.response?.data?.error || "Failed to fetch permissions" });
        }
    }
);

export const updatePermission = createAsyncThunk<any, any, { rejectValue: RejectValue }>(
    "permissions/updatePermission",
    async ({ payload }: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/permissions/update`, { ...payload });

            if (!res.data?.success) return rejectWithValue({ message: res.data?.message || "Failed to update permissions" });

            return { ...res.data?.data };
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || error?.response?.data?.error || "Failed to update permissions" });
        }
    }
);

// CUSTOM MASTER PERMISSION OPTIONS
export const getCustomMasterPermissionOptions = createAsyncThunk<any, void, { rejectValue: RejectValue }>(
    "permissions/getCustomMasterPermissionOptions",
    async (_, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/customMaster/permissionOptions`);

            if (!res.data?.success) return rejectWithValue({ message: res.data?.message || "Failed to fetch custom master permission options" });

            return res.data?.data ?? [];
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || error?.response?.data?.error || "Failed to fetch custom master permission options" });
        }
    }
);

// CUSTOM TRANSACTION PERMISSION OPTIONS
export const getCustomTransactionPermissionOptions = createAsyncThunk<any, void, { rejectValue: RejectValue }>(
    "permissions/getCustomTransactionPermissionOptions",
    async (_, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookez/transactionModule/permissionOptions`);

            if (!res.data?.success) return rejectWithValue({ message: res.data?.message || "Failed to fetch custom transaction permission options" });

            return res.data?.data ?? [];
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || error?.response?.data?.error || "Failed to fetch custom transaction permission options" });
        }
    }
);

const permissionSlice = createSlice({
    name: "permissions",
    initialState,
    reducers: {
        clearPermissions: (state) => {
            state.permissions = {};
            state.parent = null;
            state.child = null;
            state.error = null;
            localStorage.removeItem("permissions");
        },

        setPermissions: (state, action) => {
            state.permissions = action.payload || {};
            localStorage.setItem("permissions", JSON.stringify(action.payload || {}));
        },

        clearPermissionOptions: (state) => {
            state.customMasterPermissionOptions = [];
            state.customTransactionPermissionOptions = [];
            state.optionsError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllPermissions.pending, (state) => {
                state.loader = true;
                state.error = null;
            })
            .addCase(getAllPermissions.fulfilled, (state, action) => {
                state.loader = false;
                state.parent = action.payload?.parent || null;
                state.child = action.payload?.child || null;
                state.permissions = action.payload?.permissions || {};
                action?.payload?.storeInLocal && localStorage.setItem("permissions", JSON.stringify(action.payload?.permissions || {}));
            })
            .addCase(getAllPermissions.rejected, (state, action) => {
                state.loader = false;
                state.error = action.payload?.message || "Failed to fetch permissions";
            })

            .addCase(updatePermission.pending, (state) => {
                state.loader = true;
                state.error = null;
            })
            .addCase(updatePermission.fulfilled, (state, action) => {
                state.loader = false;
                state.parent = action.payload?.parent || null;
                state.child = action.payload?.child || null;
                state.permissions = action.payload?.permissions || {};
            })
            .addCase(updatePermission.rejected, (state, action) => {
                state.loader = false;
                state.error = action.payload?.message || "Failed to update permissions";
            })

            // CUSTOM MASTER OPTIONS
            .addCase(getCustomMasterPermissionOptions.pending, (state) => {
                state.customMasterOptionsLoader = true;
                state.optionsError = null;
            })
            .addCase(getCustomMasterPermissionOptions.fulfilled, (state, action) => {
                state.customMasterOptionsLoader = false;
                state.customMasterPermissionOptions = action.payload || [];
            })
            .addCase(getCustomMasterPermissionOptions.rejected, (state, action) => {
                state.customMasterOptionsLoader = false;
                state.optionsError = action.payload?.message || "Failed to fetch custom master permission options";
            })

            // CUSTOM TRANSACTION OPTIONS
            .addCase(getCustomTransactionPermissionOptions.pending, (state) => {
                state.customTransactionOptionsLoader = true;
                state.optionsError = null;
            })
            .addCase(getCustomTransactionPermissionOptions.fulfilled, (state, action) => {
                state.customTransactionOptionsLoader = false;
                state.customTransactionPermissionOptions = action.payload || [];
            })
            .addCase(getCustomTransactionPermissionOptions.rejected, (state, action) => {
                state.customTransactionOptionsLoader = false;
                state.optionsError = action.payload?.message || "Failed to fetch custom transaction permission options";
            });
    },
});

export const { clearPermissions, setPermissions, clearPermissionOptions } = permissionSlice.actions;
export default permissionSlice.reducer;