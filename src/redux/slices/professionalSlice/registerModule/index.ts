/* ===================================================
   REGISTER FILTER DROPDOWN SLICE
=================================================== */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

export type RegisterFilterDropdown = {
    key: string;
    label?: string;
    type?: string;
    api?: string;
    customMasterCode?: string;
    customMasterName?: string;
    [key: string]: any;
};

type RegisterFilterDropdownState = {
    filters: RegisterFilterDropdown[];
    loading: boolean;
    error: string | null;
};

/* ===================================================
   GET REGISTER FILTER DROPDOWNS
=================================================== */

export const getRegisterFilterDropdowns = createAsyncThunk<
    RegisterFilterDropdown[],
    string,
    { rejectValue: RejectValue }
>(
    "registerFilterDropdown/getRegisterFilterDropdowns",
    async (module, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/registers/filterDropdowns",
                {
                    params: {
                        module,
                    },
                }
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to fetch register filter dropdowns.",
                });
            }

            const filters = Array.isArray(response.data?.data)
                ? response.data.data
                : Array.isArray(response.data?.data?.filters)
                    ? response.data.data.filters
                    : Array.isArray(response.data?.filters)
                        ? response.data.filters
                        : [];

            return filters;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    "Failed to fetch register filter dropdowns.",
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: RegisterFilterDropdownState = {
    filters: [],
    loading: false,
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const registerFilterDropdownSlice = createSlice({
    name: "registerFilterDropdown",
    initialState,

    reducers: {
        clearRegisterFilterDropdownError: (state) => {
            state.error = null;
        },

        clearRegisterFilterDropdowns: (state) => {
            state.filters = [];
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(getRegisterFilterDropdowns.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(
                getRegisterFilterDropdowns.fulfilled,
                (state, action) => {
                    state.loading = false;
                    state.filters = action.payload;
                    state.error = null;
                }
            )

            .addCase(
                getRegisterFilterDropdowns.rejected,
                (state, action) => {
                    state.loading = false;
                    state.filters = [];
                    state.error =
                        action.payload?.message ||
                        "Failed to fetch register filter dropdowns.";
                }
            );
    },
});

/* ===================================================
   EXPORTS
=================================================== */

export const {
    clearRegisterFilterDropdownError,
    clearRegisterFilterDropdowns,
} = registerFilterDropdownSlice.actions;

export default registerFilterDropdownSlice.reducer;