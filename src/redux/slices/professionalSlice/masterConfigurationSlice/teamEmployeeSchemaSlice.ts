import {
    createAsyncThunk,
    createSlice,
} from "@reduxjs/toolkit";

import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

export type TeamEmployeeSchemaField = {
    key: string;
    label: string;
    type: string;

    ref?: string;
    isRequired?: boolean;
    isSearchable?: boolean;
    isFilterable?: boolean;
    isHidden?: boolean;
    isDefault?: boolean;

    customMasterCode?: string;
    customMasterName?: string;

    options?: any[];

    [key: string]: any;
};

type RejectValue = {
    message: string;
    status?: number;
};

type TeamEmployeeSchemaState = {
    fields: TeamEmployeeSchemaField[];

    pagination: {
        offset: number;
        limit: number;
        totalDocs: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };

    loading: boolean;
    saveLoading: boolean;
    updateLoading: boolean;

    error: string | null;
    successMessage: string;
};

/* ===================================================
   API
=================================================== */

const TEAM_EMPLOYEE_SCHEMA_API =
    "/eTaxSolnMongoApiBackend/users/userManagement/childUser/schema";

/* ===================================================
   RESPONSE HELPERS
=================================================== */

const extractFields = (
    apiData: any
): TeamEmployeeSchemaField[] => {
    const roots = [
        apiData,
        apiData?.data,
        apiData?.result,
        apiData?.payload,
        apiData?.data?.data,
    ];

    for (const root of roots) {
        if (Array.isArray(root)) {
            return root;
        }

        if (
            root &&
            typeof root === "object"
        ) {
            if (Array.isArray(root?.fields)) {
                return root.fields;
            }

            if (Array.isArray(root?.items)) {
                return root.items;
            }

            if (Array.isArray(root?.records)) {
                return root.records;
            }
        }
    }

    return [];
};

const extractPagination = (
    apiData: any,
    fallback: any
) => {
    return (
        apiData?.pagination ||
        apiData?.data?.pagination ||
        fallback
    );
};

/* ===================================================
   GET TEAM/EMPLOYEE SCHEMA
=================================================== */

export const getTeamEmployeeSchema =
    createAsyncThunk<
        {
            fields: TeamEmployeeSchemaField[];
            pagination: any;
        },
        {
            offset?: number;
            limit?: number;
            isSearchable?: string;
            isRequired?: string;
            type?: string;
            isFilterable?: string;
        } | undefined,
        {
            rejectValue: RejectValue;
        }
    >(
        "teamEmployeeSchema/getTeamEmployeeSchema",

        async (
            {
                offset = 0,
                limit = 10,
                isSearchable = "",
                isRequired = "",
                type = "",
                isFilterable = "",
            } = {},
            {
                rejectWithValue,
            }
        ) => {
            try {
                const response =
                    await professionalAxios.get(
                        `${TEAM_EMPLOYEE_SCHEMA_API}/getAll`,
                        {
                            params: {
                                offset,
                                limit,
                                isSearchable,
                                isRequired,
                                type,
                                isFilterable,
                            },
                        }
                    );

                if (
                    response?.data?.success ===
                    false
                ) {
                    return rejectWithValue({
                        message:
                            response?.data?.message ||
                            "Failed to fetch Team/Employee schema",

                        status:
                            response?.status,
                    });
                }

                const fields =
                    extractFields(
                        response?.data
                    );

                return {
                    fields,

                    pagination:
                        extractPagination(
                            response?.data,
                            {
                                offset,
                                limit,
                                totalDocs:
                                    fields.length,

                                totalPages:
                                    1,

                                currentPage:
                                    1,

                                hasNextPage:
                                    false,

                                hasPrevPage:
                                    false,
                            }
                        ),
                };
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to fetch Team/Employee schema",

                    status:
                        error?.response?.status,
                });
            }
        }
    );

/* ===================================================
   SAVE TEAM/EMPLOYEE SCHEMA
=================================================== */

export const saveTeamEmployeeSchema =
    createAsyncThunk<
        {
            message: string;
            data: any;
        },
        {
            fields: TeamEmployeeSchemaField[];
        },
        {
            rejectValue: RejectValue;
        }
    >(
        "teamEmployeeSchema/saveTeamEmployeeSchema",

        async (
            {
                fields,
            },
            {
                rejectWithValue,
            }
        ) => {
            try {
                const response =
                    await professionalAxios.post(
                        `${TEAM_EMPLOYEE_SCHEMA_API}/save`,
                        {
                            fields,
                        }
                    );

                if (
                    response?.data?.success ===
                    false
                ) {
                    return rejectWithValue({
                        message:
                            response?.data?.message ||
                            "Failed to save Team/Employee schema",

                        status:
                            response?.status,
                    });
                }

                return {
                    message:
                        response?.data?.message ||
                        "Team/Employee schema field added successfully",

                    data:
                        response?.data?.data ||
                        response?.data,
                };
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to save Team/Employee schema",

                    status:
                        error?.response?.status,
                });
            }
        }
    );

/* ===================================================
   UPDATE TEAM/EMPLOYEE SCHEMA
=================================================== */

export const updateTeamEmployeeSchema =
    createAsyncThunk<
        {
            message: string;
            updates: any[];
            data: any;
        },
        {
            updates: Array<{
                key: string;
                updateData: any;
            }>;
        },
        {
            rejectValue: RejectValue;
        }
    >(
        "teamEmployeeSchema/updateTeamEmployeeSchema",

        async (
            {
                updates,
            },
            {
                rejectWithValue,
            }
        ) => {
            try {
                const response =
                    await professionalAxios.put(
                        `${TEAM_EMPLOYEE_SCHEMA_API}/update`,
                        {
                            updates,
                        }
                    );

                if (
                    response?.data?.success ===
                    false
                ) {
                    return rejectWithValue({
                        message:
                            response?.data?.message ||
                            "Failed to update Team/Employee schema",

                        status:
                            response?.status,
                    });
                }

                return {
                    message:
                        response?.data?.message ||
                        "Team/Employee schema field updated successfully",

                    updates,

                    data:
                        response?.data?.data ||
                        response?.data,
                };
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to update Team/Employee schema",

                    status:
                        error?.response?.status,
                });
            }
        }
    );

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: TeamEmployeeSchemaState = {
    fields: [],

    pagination: {
        offset: 0,
        limit: 10,
        totalDocs: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },

    loading: false,
    saveLoading: false,
    updateLoading: false,

    error: null,
    successMessage: "",
};

/* ===================================================
   SLICE
=================================================== */

const teamEmployeeSchemaSlice =
    createSlice({
        name:
            "teamEmployeeSchema",

        initialState,

        reducers: {
            clearTeamEmployeeSchemaError:
                (state) => {
                    state.error = null;
                },

            clearTeamEmployeeSchemaState:
                (state) => {
                    state.fields = [];

                    state.pagination = {
                        ...initialState.pagination,
                    };

                    state.loading = false;
                    state.saveLoading = false;
                    state.updateLoading = false;

                    state.error = null;
                    state.successMessage = "";
                },
        },

        extraReducers:
            (builder) => {
                /* ===========================================
                   GET
                =========================================== */

                builder
                    .addCase(
                        getTeamEmployeeSchema.pending,
                        (state) => {
                            state.loading = true;
                            state.error = null;
                        }
                    )

                    .addCase(
                        getTeamEmployeeSchema.fulfilled,
                        (
                            state,
                            action
                        ) => {
                            state.loading = false;

                            state.fields =
                                action.payload
                                    ?.fields || [];

                            state.pagination =
                                action.payload
                                    ?.pagination ||
                                state.pagination;
                        }
                    )

                    .addCase(
                        getTeamEmployeeSchema.rejected,
                        (
                            state,
                            action
                        ) => {
                            state.loading = false;

                            state.fields = [];

                            state.error =
                                action.payload
                                    ?.message ||
                                "Failed to fetch Team/Employee schema";
                        }
                    );

                /* ===========================================
                   SAVE
                =========================================== */

                builder
                    .addCase(
                        saveTeamEmployeeSchema.pending,
                        (state) => {
                            state.saveLoading = true;
                            state.error = null;
                            state.successMessage = "";
                        }
                    )

                    .addCase(
                        saveTeamEmployeeSchema.fulfilled,
                        (
                            state,
                            action
                        ) => {
                            state.saveLoading = false;

                            state.successMessage =
                                action.payload
                                    ?.message ||
                                "Team/Employee schema field added successfully";
                        }
                    )

                    .addCase(
                        saveTeamEmployeeSchema.rejected,
                        (
                            state,
                            action
                        ) => {
                            state.saveLoading = false;

                            state.error =
                                action.payload
                                    ?.message ||
                                "Failed to save Team/Employee schema";
                        }
                    );

                /* ===========================================
                   UPDATE
                =========================================== */

                builder
                    .addCase(
                        updateTeamEmployeeSchema.pending,
                        (state) => {
                            state.updateLoading = true;
                            state.error = null;
                            state.successMessage = "";
                        }
                    )

                    .addCase(
                        updateTeamEmployeeSchema.fulfilled,
                        (
                            state,
                            action
                        ) => {
                            state.updateLoading = false;

                            state.successMessage =
                                action.payload
                                    ?.message ||
                                "Team/Employee schema field updated successfully";

                            const updates =
                                action.payload
                                    ?.updates || [];

                            updates.forEach(
                                (update: any) => {
                                    const index =
                                        state.fields.findIndex(
                                            (field) =>
                                                field.key ===
                                                update.key
                                        );

                                    if (index !== -1) {
                                        state.fields[index] = {
                                            ...state.fields[index],
                                            ...update.updateData,
                                        };
                                    }
                                }
                            );
                        }
                    )

                    .addCase(
                        updateTeamEmployeeSchema.rejected,
                        (
                            state,
                            action
                        ) => {
                            state.updateLoading = false;

                            state.error =
                                action.payload
                                    ?.message ||
                                "Failed to update Team/Employee schema";
                        }
                    );
            },
    });

export const {
    clearTeamEmployeeSchemaError,
    clearTeamEmployeeSchemaState,
} = teamEmployeeSchemaSlice.actions;

export default teamEmployeeSchemaSlice.reducer;