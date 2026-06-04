import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";



/* ===================================================
    CREATE ASSEMBLY PRODUCTION
=================================================== */
export const createAssemblyProduction = createAsyncThunk(
    "assemblyProduction/createAssemblyProduction",
    async (payload: any, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/save",
                payload
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to create assembly production",
                });

            return res.data?.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.error || "Failed to create assembly production",
            });
        }
    }
);


/* ===================================================
    GET ALL ASSEMBLY PRODUCTIONS
=================================================== */
export const getAllAssemblyProductions = createAsyncThunk(
    "assemblyProduction/getAllAssemblyProductions",
    async ({ offset = 0, limit = 10, search = "" }: { offset?: number; limit?: number; search?: string }, { rejectWithValue }) => {
        try {
            const params: { offset?: number; limit?: number; search?: string } = { offset, limit };
            if (search.trim()) params.search = search.trim();
            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/getAll",
                { params }
            );



            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch assembly productions",
                });

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch assembly productions",
            });
        }
    }
);




/* ===================================================
    GET ASSEMBLY PRODUCTION BY voucherNumber
=================================================== */
export const getAssemblyProductionByVoucherNumber = createAsyncThunk(
    "assemblyProduction/getAssemblyProductionByVoucherNumber",
    async (voucherNumber, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/getByVoucherNo/${voucherNumber}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch assembly production",
                });

            return res.data?.data?.assemblyProduction ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch assembly production",
            });
        }
    }
);

/* ===================================================
    UPDATE ASSEMBLY PRODUCTION
=================================================== */
export const updateAssemblyProduction = createAsyncThunk(
    "assemblyProduction/updateAssemblyProduction",
    async ({ voucherNumber, data }: { voucherNumber: string; data: any }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/update/${voucherNumber}`,
                data
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to update assembly production",
                });

            return res.data?.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to update assembly production",
            });
        }
    }
);

/* ===================================================
    DELETE ASSEMBLY PRODUCTION
=================================================== */
export const deleteAssemblyProduction = createAsyncThunk(
    "assemblyProduction/deleteAssemblyProduction",
    async (voucherNumber, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookez/otherApi/assemblyProduction/delete/${voucherNumber}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to delete assembly production",
                });

            return voucherNumber;
        } catch (err: any) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to delete assembly production",
            });
        }
    }
);



/* ===================================================
    SLICE
=================================================== */
const assemblyProductionSlice = createSlice({
    name: "assemblyProduction",
    initialState: {
        assemblyProductions: [],
        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },

        assemblyProductionSchemaFields: [],
        schemaLoading: false,

        selectedAssemblyProduction: null,

        loading: false,
        error: null,

        createLoading: false,
        updateLoading: false,
        deleteLoading: false,
    },

    reducers: {
        clearAssemblyProductionState: (state: any) => {
            state.error = null;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
        },
    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getAllAssemblyProductions.pending, (state: any) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllAssemblyProductions.fulfilled, (state: any, action: any) => {
                state.loading = false;

                const data = action.payload; // <-- { pagination, items }

                state.assemblyProductions = data?.records ?? [];
                state.pagination = data?.pagination ?? state.pagination;
            })
            .addCase(getAllAssemblyProductions.rejected, (state: any, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.assemblyProductions = [];
            });
        /* ---------- GET BY ASSEMBLY PRODUCTION ID ---------- */
        builder
            .addCase(getAssemblyProductionByVoucherNumber.pending, (state: any) => {
                state.loading = true;
            })
            .addCase(getAssemblyProductionByVoucherNumber.fulfilled, (state: any, action: any) => {
                state.loading = false;
                state.selectedAssemblyProduction = action.payload ?? null;
            })
            .addCase(getAssemblyProductionByVoucherNumber.rejected, (state: any, action: any) => {
                state.loading = false;
                state.error = action.payload?.message;
            });



        /* ---------- CREATE ASSEMBLY PRODUCTION ---------- */
        builder
            .addCase(createAssemblyProduction.pending, (state: any) => {
                state.createLoading = true;
            })
            .addCase(createAssemblyProduction.fulfilled, (state: any, action: any) => {
                state.createLoading = false;

                if (action.payload) {
                    state.assemblyProductions.unshift(action.payload);
                    state.pagination.totalDocs += 1;
                }
            })
            .addCase(createAssemblyProduction.rejected, (state: any, action: any) => {
                state.createLoading = false;
                state.error = action.payload?.message;
            });


        /* ---------- UPDATE ASSEMBLY PRODUCTION ---------- */
        builder
            .addCase(updateAssemblyProduction.pending, (state) => {
                state.updateLoading = true;
            })
            .addCase(updateAssemblyProduction.fulfilled, (state: any, action: any) => {
                state.updateLoading = false;

                const updated = action.payload;
                if (!updated?.voucherNumber) return;

                state.assemblyProductions = state.assemblyProductions.map((assemblyProduction: any) =>
                    assemblyProduction.voucherNumber === updated.voucherNumber ? updated : assemblyProduction
                );
            })
            .addCase(updateAssemblyProduction.rejected, (state: any, action: any) => {
                state.updateLoading = false;
                state.error = action.payload?.message;
            });

        /* ---------- DELETE ASSEMBLY PRODUCTION ---------- */
        builder
            .addCase(deleteAssemblyProduction.pending, (state) => {
                state.deleteLoading = true;
            })
            .addCase(deleteAssemblyProduction.fulfilled, (state, action) => {
                state.deleteLoading = false;

                const removedId = action.payload;
                state.assemblyProductions = state.assemblyProductions.filter(
                    (assemblyProduction: any) => assemblyProduction.voucherNumber !== removedId
                );

                state.pagination.totalDocs = Math.max(0, state.pagination.totalDocs - 1);
            })
            .addCase(deleteAssemblyProduction.rejected, (state:any, action:any) => {
                state.deleteLoading = false;
                state.error = action.payload?.message;
            });


    }
});



export const { clearAssemblyProductionState } = assemblyProductionSlice.actions;
export default assemblyProductionSlice.reducer;