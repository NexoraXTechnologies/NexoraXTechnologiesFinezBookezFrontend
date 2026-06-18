import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../services/professionalAxios";

type PermissionAction = {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
};  

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
};

type GetPermissionsParams = {
    offset?: number;
    limit?: number;
    parentMobile: string;
    childMobile: string;
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
};

export const getAllPermissions = createAsyncThunk<any, GetPermissionsParams, { rejectValue: RejectValue }>(
    "permissions/getAllPermissions",
    async ({ offset = 0, limit = 100, parentMobile, childMobile, storeInLocal = true }: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/permissions/getAll`,
                { params: { offset, limit, parentMobile, childMobile, }, }
            );

            if (!res.data?.success) {
                return rejectWithValue({ message: res.data?.message || "Failed to fetch permissions", });
            }

            return { ...res.data?.data, storeInLocal: storeInLocal };
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || error?.response?.data?.error || "Failed to fetch permissions", });
        }
    }
);

export const savePermission = createAsyncThunk<any, GetPermissionsParams, { rejectValue: RejectValue }>(
    "permissions/getAllPermissions",
    async ({ offset = 0, limit = 100, parentMobile, childMobile, storeInLocal = true }: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(`/eTaxSolnMongoApiBackend/users/permissions/getAll`,
                { params: { offset, limit, parentMobile, childMobile, }, }
            );

            if (!res.data?.success) {
                return rejectWithValue({ message: res.data?.message || "Failed to fetch permissions", });
            }

            return { ...res.data?.data, storeInLocal: storeInLocal };
        } catch (error: any) {
            return rejectWithValue({ message: error?.response?.data?.message || error?.response?.data?.error || "Failed to fetch permissions", });
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
                action?.payload?.storeInLocal && localStorage.setItem(
                    "permissions",
                    JSON.stringify(action.payload?.permissions || {})
                );
            })

            .addCase(getAllPermissions.rejected, (state, action) => {
                state.loader = false;
                state.error =
                    action.payload?.message ||
                    "Failed to fetch permissions";
            });
    },
});

export const { clearPermissions, setPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;