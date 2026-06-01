import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";




/* ===================================================
    Form UNIT Master
=================================================== */

export const getAllUnitMasterSchema = createAsyncThunk(
    "unitMaster/getAllUnitMasterSchema",
    async (
        {
            offset = 0,
            limit = 20,
            isSearchable = "",
            isRequired = "",
            isFilterable = "",
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const params = {
                offset,
                limit,
                isSearchable,
                isRequired,
                isFilterable,
            };

          
            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/masters/unitMeasurement/schema/getAll",
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch unit schema",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message || "Failed to fetch unit schema",
            });
        }
    }
);



/* ===================================================
    CREATE UNIT
=================================================== */
export const createUnit = createAsyncThunk(
    "unitMaster/createUnit",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/unitMeasurement/create",
                payload
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to create unit",
                });

            return res.data?.data ?? null;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.error || "Failed to create unit",
            });
        }
    }
);


/* ===================================================
    GET ALL UNITS
=================================================== */
export const getAllUnits = createAsyncThunk(
    "unitMaster/getAllUnits",
    async ({ offset = 0, limit = 10, search = "" } = {}, { rejectWithValue }) => {
        try {
            const params = { offset, limit };
            if (search.trim()) params.search = search.trim();



            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/unitMeasurement/getAll",
                { params }
            );



            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch units",
                });

            return res.data?.data;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch units",
            });
        }
    }
);




/* ===================================================
    GET UNIT BY ID
=================================================== */
export const getUnitById = createAsyncThunk(
    "unitMaster/getUnitById",
    async (unitId, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/unitMeasurement/getByUnitId/${unitId}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch unit",
                });

            return res.data?.data?.unit ?? null;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch unit",
            });
        }
    }
);

/* ===================================================
    UPDATE UNIT
=================================================== */
export const updateUnit = createAsyncThunk(
    "unitMaster/updateUnit",
    async ({ unitId, data }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/unitMeasurement/update/${unitId}`,
                data
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to update unit",
                });

            return res.data?.data ?? null;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to update unit",
            });
        }
    }
);

/* ===================================================
    DELETE UNIT
=================================================== */
export const deleteUnit = createAsyncThunk(
    "unitMaster/deleteUnit",
    async (unitId, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookez/unitMeasurement/delete/${unitId}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to delete unit",
                });

            return unitId;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to delete unit",
            });
        }
    }
);



/* ===================================================
    SLICE
=================================================== */
const unitMasterSlice = createSlice({
    name: "unitMaster",
    initialState: {
        units: [],
        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },

        unitMasterSchemaFields: [],
        schemaLoading: false,

        selectedUnit: null,

        loading: false,
        error: null,

        createLoading: false,
        updateLoading: false,
        deleteLoading: false,
    },

    reducers: {
        clearUnitMasterState: (state) => {
            state.error = null;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
        },
    },

    extraReducers: (builder) => {
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getAllUnits.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllUnits.fulfilled, (state, action) => {
                state.loading = false;

                const data = action.payload; // <-- { pagination, items }

                state.units = data?.items ?? [];
                state.pagination = data?.pagination ?? state.pagination;
            })
            .addCase(getAllUnits.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.units = [];
            });
        /* ---------- GET BY UNIT ID ---------- */
        builder
            .addCase(getUnitById.pending, (state) => {
                state.loading = true;
            })
            .addCase(getUnitById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedUnit = action.payload ?? null;
            })
            .addCase(getUnitById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
            });



        /* ----------  Form UNIT Master ---------- */
        builder
            .addCase(getAllUnitMasterSchema.pending, (state) => {
                state.schemaLoading = true;
                state.error = null;
            })

            .addCase(getAllUnitMasterSchema.fulfilled, (state, action) => {
                state.schemaLoading = false;
                state.unitMasterSchemaFields = action.payload?.fields || [];
            })

            .addCase(getAllUnitMasterSchema.rejected, (state, action: any) => {
                state.schemaLoading = false;
                state.error =
                    action.payload?.message || "Failed to fetch unit schema";
            })


        /* ---------- CREATE UNIT ---------- */
        builder
            .addCase(createUnit.pending, (state) => {
                state.createLoading = true;
            })
            .addCase(createUnit.fulfilled, (state, action) => {
                state.createLoading = false;

                if (action.payload) {
                    state.units.unshift(action.payload);
                    state.pagination.totalDocs += 1;
                }
            })
            .addCase(createUnit.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload?.message;
            });


        /* ---------- UPDATE UNIT ---------- */
        builder
            .addCase(updateUnit.pending, (state) => {
                state.updateLoading = true;
            })
            .addCase(updateUnit.fulfilled, (state, action) => {
                state.updateLoading = false;

                const updated = action.payload;
                if (!updated?.unitId) return;

                state.units = state.units.map((unit) =>
                    unit.unitId === updated.unitId ? updated : unit
                );
            })
            .addCase(updateUnit.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload?.message;
            });

        /* ---------- DELETE UNIT ---------- */
        builder
            .addCase(deleteUnit.pending, (state) => {
                state.deleteLoading = true;
            })
            .addCase(deleteUnit.fulfilled, (state, action) => {
                state.deleteLoading = false;

                const removedId = action.payload;
                state.units = state.units.filter(
                    (unit) => unit.unitId !== removedId
                );

                state.pagination.totalDocs = Math.max(0, state.pagination.totalDocs - 1);
            })
            .addCase(deleteUnit.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload?.message;
            });


    }
});



export const { clearUnitMasterState } = unitMasterSlice.actions;
export default unitMasterSlice.reducer;