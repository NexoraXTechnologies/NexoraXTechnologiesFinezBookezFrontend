import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";


/* ===================================================
    GET Modules wise Key LIST
=================================================== */
export const getAllModulesWiseKey = createAsyncThunk(
    "reportMapping/getAllModulesWiseKey",
    async (
        { moduleType, offset = 0, limit = 10 }: any = {},
        { rejectWithValue }
    ) => {
        try {
            const params = { offset, limit };

            if (!moduleType) {
                return rejectWithValue({
                    message: "Module type is required",
                });
            }

            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/master/reportsmapping/templateKeys/${moduleType}`,
                { params }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch module wise keys",
                });
            }

            return res.data?.data;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message || "Failed to fetch module wise keys",
            });
        }
    }
);







/* ===================================================
    GET Modules LIST
=================================================== */
export const getAllModules = createAsyncThunk(
    "reportMapping/getAllModules",
    async ({ offset = 0, limit = 10 } = {}, { rejectWithValue }) => {
        try {
            const params = { offset, limit };

            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/master/reportsmapping/modules/getAll",
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
    GET ALL REPORTS MAPPING
=================================================== */
export const getAllReportMapping = createAsyncThunk(
    "reportMapping/getAllReportMapping",
    async ({ offset = 0, limit = 10, search = "", moduleType = "" } = {}, { rejectWithValue }) => {
        try {
            const params = { offset, limit };
            if (search.trim()) params.search = search.trim();

            if (moduleType) {
                params.moduleType = moduleType;
            }


            const res = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/master/reportsmapping/getAll",
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
    CREATE PRODUCT
=================================================== */
export const createReportMapping = createAsyncThunk(
    "reportMapping/createReportMapping",
    async (payload: FormData, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/master/reportsmapping/save",
                payload,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (!res.data?.success) {
                return rejectWithValue({
                    message: res.data?.message || "Failed to create report mapping",
                });
            }

            return res.data?.data ?? null;
        } catch (err: any) {
            return rejectWithValue({
                message:
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to create report mapping",
            });
        }
    }
);
/* ===================================================
    GET REPORT MAPPING BY TEMPLATE FILE ID
=================================================== */
export const getReportMappingByTemplateFileId = createAsyncThunk(
    "reportMapping/getReportMappingByTemplateFileId",
    async (templateFileId, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/master/reportsmapping/getByTemplateFileId/${templateFileId}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to fetch report mapping",
                });

            return res.data?.data?.reportMapping ?? null;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to fetch report mapping",
            });
        }
    }
);

/* ===================================================
    UPDATE REPORT MAPPING
=================================================== */
export const updateReportMapping = createAsyncThunk(
    "reportMapping/updateReportMapping",
    async ({ templateFileId, data }, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/master/reportsmapping/getByTemplateFileId/${templateFileId}`,
                data
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to update report mapping",
                });

            return res.data?.data ?? null;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to update report mapping",
            });
        }
    }
);

/* ===================================================
    DELETE REPORT MAPPING
=================================================== */
export const deleteReportMapping = createAsyncThunk(
    "reportMapping/deleteReportMapping",
    async (templateFileId, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.delete(
                `/eTaxSolnMongoApiBackend/users/bookez/master/reportsmapping/delete/${templateFileId}`
            );

            if (!res.data?.success)
                return rejectWithValue({
                    message: res.data?.message || "Failed to delete report mapping",
                });

            return templateFileId;
        } catch (err) {
            return rejectWithValue({
                message: err?.response?.data?.message || "Failed to delete report mapping",
            });
        }
    }
);



/* ===================================================
    SLICE
=================================================== */
const reportMappingSlice = createSlice({
    name: "reportMapping",
    initialState: {
        report: [],
        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
            moduleType: ""
        },

        modules: [],
        modulesLoading: false,

        moduleWiseKeys: null,
        moduleWiseKeysLoading: false,

        selectedReport: null,

        loading: false,
        error: null,

        createLoading: false,
        updateLoading: false,
        deleteLoading: false,
    },

    reducers: {
        clearReportMappingState: (state) => {
            state.error = null;
            state.createLoading = false;
            state.updateLoading = false;
            state.deleteLoading = false;
        },
    },

    extraReducers: (builder) => {


        /* ---------- GET MODULE WISE KEYS ---------- */
        builder
            .addCase(getAllModulesWiseKey.pending, (state) => {
                state.moduleWiseKeysLoading = true;
                state.error = null;
            })
            .addCase(getAllModulesWiseKey.fulfilled, (state, action) => {
                state.moduleWiseKeysLoading = false;

                state.moduleWiseKeys = action.payload ?? null;
            })
            .addCase(getAllModulesWiseKey.rejected, (state, action) => {
                state.moduleWiseKeysLoading = false;
                state.error = action.payload?.message;
                state.moduleWiseKeys = null;
            });

        /* ---------- GET ALL MODULES ---------- */
        builder
            .addCase(getAllModules.pending, (state) => {
                state.modulesLoading = true;
                state.error = null;
            })
            .addCase(getAllModules.fulfilled, (state, action) => {
                state.modulesLoading = false;

                const data = action.payload;

                state.modules = data?.modules ?? [];
            })
            .addCase(getAllModules.rejected, (state, action) => {
                state.modulesLoading = false;
                state.error = action.payload?.message;
                state.modules = [];
            });
        /* ---------- GET ALL ---------- */
        builder
            .addCase(getAllReportMapping.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllReportMapping.fulfilled, (state, action) => {
                state.loading = false;

                const data = action.payload; // <-- { pagination, items }

                state.report = data?.docs ?? [];
                state.pagination = data?.pagination ?? state.pagination;
            })
            .addCase(getAllReportMapping.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
                state.report = [];
            });
        /* ---------- GET BY UNIT ID ---------- */
        builder
            .addCase(getReportMappingByTemplateFileId.pending, (state) => {
                state.loading = true;
            })
            .addCase(getReportMappingByTemplateFileId.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedReport = action.payload ?? null;
            })
            .addCase(getReportMappingByTemplateFileId.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message;
            });




        /* ---------- CREATE REPORT MAPPING ---------- */
        builder
            .addCase(createReportMapping.pending, (state) => {
                state.createLoading = true;
            })
            .addCase(createReportMapping.fulfilled, (state, action) => {
                state.createLoading = false;

                if (action.payload) {
                    state.report.unshift(action.payload);
                    state.pagination.totalDocs += 1;
                }
            })
            .addCase(createReportMapping.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload?.message;
            });


        /* ---------- UPDATE REPORT MAPPING ---------- */
        builder
            .addCase(updateReportMapping.pending, (state) => {
                state.updateLoading = true;
            })
            .addCase(updateReportMapping.fulfilled, (state, action) => {
                state.updateLoading = false;

                const updated = action.payload;
                if (!updated?.templateFileId) return;

                state.report = state.report.map((report) =>
                    report.templateFileId === updated.templateFileId ? updated : report
                );
            })
            .addCase(updateReportMapping.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload?.message;
            });

        /* ---------- DELETE REPORT MAPPING ---------- */
        builder
            .addCase(deleteReportMapping.pending, (state) => {
                state.deleteLoading = true;
            })
            .addCase(deleteReportMapping.fulfilled, (state, action) => {
                state.deleteLoading = false;

                const removedId = action.payload;
                state.report = state.report.filter(
                    (report) => report.templateFileId !== removedId
                );

                state.pagination.totalDocs = Math.max(0, state.pagination.totalDocs - 1);
            })
            .addCase(deleteReportMapping.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload?.message;
            });


    }
});



export const { clearReportMappingState } = reportMappingSlice.actions;
export default reportMappingSlice.reducer;