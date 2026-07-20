import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type podRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    podRegisterData: any[];
    pagination: any;
    error: string | null;
};

/* ===================================================
   CREATE / GET pod REGISTER
=================================================== */

export const addpodRegister = createAsyncThunk<
    any,
    any,
    { rejectValue: RejectValue }
>(
    "podRegister/addpodRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/podRegister",
                {
                    ...payload,
                },
                payload?.exportType
                    ? {
                        responseType: "blob",
                    }
                    : undefined
            );

            /*
               PDF / Excel response
            */
            if (payload?.exportType) {
                return {
                    blob: res.data,
                    exportType: payload.exportType,
                };
            }

            /*
               Normal list response
            */
            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res?.data?.message ||
                        "Failed to fetch POD register",
                });
            }
            console.log({ res })
            return {
                records: res.data?.data?.pods || [],
                pagination: res.data?.data?.pagination || {},
            };
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch POD register",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: podRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    podRegisterData: [],
    pagination: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const podRegisterSlice = createSlice({
    name: "podRegister",
    initialState,
    reducers: {
        clearPodRegisterError: (state) => {
            state.error = null;
        },

        clearPodRegisterData: (state) => {
            state.podRegisterData = [];
            state.pagination = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addpodRegister.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.addLoader = true;
                }

                state.error = null;
            })

            .addCase(addpodRegister.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.addLoader = false;
                state.podRegisterData =
                    action.payload?.records || [];
                state.pagination =
                    action.payload?.pagination || {};
            })

            .addCase(addpodRegister.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.addLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch POD register";
            });
    },
});

export const {
    clearPodRegisterError,
    clearPodRegisterData,
} = podRegisterSlice.actions;

export default podRegisterSlice.reducer;