import {
    createAsyncThunk,
    createSlice,
} from "@reduxjs/toolkit";

import professionalAxios from "../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

export type TeamEmployeeSchemaField = {
    key: string;
    label: string;
    type: string;

    isRequired?: boolean | string | number;
    isSearchable?: boolean | string | number;
    isFilterable?: boolean | string | number;
    isHidden?: boolean | string | number;
    isDefault?: boolean | string | number;

    options?: Array<
        | string
        | {
            label?: string;
            value?: string;
            name?: string;
            code?: string;
            [key: string]: any;
        }
    >;

    customMasterCode?: string | null;
    customMasterName?: string | null;

    masterSource?: string | null;
    dependsOn?: string | null;

    ref?: string | null;
    valueField?: string | null;
    labelField?: string | null;

    dataSource?: {
        type?: string;
        api?: string;
        dependsOn?: string;
        [key: string]: any;
    };

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
   API CONSTANT
=================================================== */

const TEAM_EMPLOYEE_SCHEMA_API =
    "/eTaxSolnMongoApiBackend/users/userManagement/childUser/schema";

/* ===================================================
   HELPERS
=================================================== */

export const isTrue = (value: any) => {
    return (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
    );
};

export const normalizeSelectOptions = (
    options: any
): Array<{
    label: string;
    value: string;
}> => {
    if (!Array.isArray(options)) {
        return [];
    }

    return options
        .map((item: any) => {
            if (
                typeof item === "object" &&
                item !== null
            ) {
                const label = String(
                    item?.label ??
                    item?.name ??
                    item?.value ??
                    item?.code ??
                    ""
                ).trim();

                const value = String(
                    item?.value ??
                    item?.code ??
                    item?.label ??
                    item?.name ??
                    ""
                ).trim();

                if (!label && !value) {
                    return null;
                }

                return {
                    label: label || value,
                    value: value || label,
                };
            }

            const text = String(
                item ?? ""
            ).trim();

            if (!text) {
                return null;
            }

            return {
                label: text,
                value: text,
            };
        })
        .filter(
            (
                item
            ): item is {
                label: string;
                value: string;
            } => item !== null
        );
};

export const isUserStatusField = (
    field: TeamEmployeeSchemaField
) => {
    const key = String(
        field?.key || ""
    )
        .trim()
        .toLowerCase();

    const label = String(
        field?.label || ""
    )
        .trim()
        .toLowerCase();

    return (
        key === "userstatus" ||
        key === "isuseractive" ||
        (
            key === "status" &&
            label.includes("user")
        ) ||
        label.includes("user status")
    );
};

export const normalizeUserStatusValue = (
    value: any,
    {
        defaultActive = true,
    }: {
        defaultActive?: boolean;
    } = {}
) => {
    const normalized = String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

    if (
        normalized === "1" ||
        normalized === "active" ||
        normalized === "true"
    ) {
        return "1";
    }

    if (
        normalized === "0" ||
        normalized === "inactive" ||
        normalized === "false"
    ) {
        return "0";
    }

    if (!normalized) {
        return defaultActive
            ? "1"
            : "";
    }

    return String(value).trim();
};

/* ===================================================
   RESPONSE HELPERS
=================================================== */

const extractSchemaFields = (
    responseData: any
): TeamEmployeeSchemaField[] => {
    const roots = [
        responseData,
        responseData?.data,
        responseData?.result,
        responseData?.payload,
        responseData?.data?.data,
    ];

    for (const root of roots) {
        if (Array.isArray(root)) {
            return root;
        }

        if (
            root &&
            typeof root === "object"
        ) {
            if (
                Array.isArray(
                    root?.fields
                )
            ) {
                return root.fields;
            }

            if (
                Array.isArray(
                    root?.items
                )
            ) {
                return root.items;
            }

            if (
                Array.isArray(
                    root?.records
                )
            ) {
                return root.records;
            }
        }
    }

    return [];
};

const extractPagination = (
    responseData: any,
    fallback: any
) => {
    return (
        responseData?.pagination ||
        responseData?.data?.pagination ||
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
                limit = 100,
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
                            "Failed to load Team/Employee schema",

                        status:
                            response?.status,
                    });
                }

                const fields =
                    extractSchemaFields(
                        response?.data
                    );

                const pagination =
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
                    );

                return {
                    fields,
                    pagination,
                };
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to load Team/Employee schema",

                    status:
                        error?.response?.status,
                });
            }
        }
    );

/* ===================================================
   SAVE TEAM/EMPLOYEE SCHEMA FIELD
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
                            "Failed to save Team/Employee schema field",

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
                        "Failed to save Team/Employee schema field",

                    status:
                        error?.response?.status,
                });
            }
        }
    );

/* ===================================================
   UPDATE TEAM/EMPLOYEE SCHEMA FIELD
=================================================== */

export const updateTeamEmployeeSchema =
    createAsyncThunk<
        {
            message: string;
            updates: Array<{
                key: string;
                updateData: any;
            }>;
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
                            "Failed to update Team/Employee schema field",

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
                        "Failed to update Team/Employee schema field",

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
        limit: 100,
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

            clearTeamEmployeeSchemaSuccess:
                (state) => {
                    state.successMessage =
                        "";
                },

            resetTeamEmployeeSchemaState:
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
                /* =======================================
                   GET
                ======================================= */

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
                                action.payload?.fields ||
                                [];

                            state.pagination =
                                action.payload?.pagination ||
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
                                action.payload?.message ||
                                "Failed to load Team/Employee schema";
                        }
                    );

                /* =======================================
                   SAVE
                ======================================= */

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
                                action.payload?.message ||
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
                                action.payload?.message ||
                                "Failed to save Team/Employee schema field";
                        }
                    );

                /* =======================================
                   UPDATE
                ======================================= */

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
                                action.payload?.message ||
                                "Team/Employee schema field updated successfully";

                            const updates =
                                action.payload?.updates ||
                                [];

                            updates.forEach(
                                (update) => {
                                    const fieldIndex =
                                        state.fields.findIndex(
                                            (field) =>
                                                field.key ===
                                                update.key
                                        );

                                    if (
                                        fieldIndex !==
                                        -1
                                    ) {
                                        state.fields[
                                            fieldIndex
                                        ] = {
                                            ...state.fields[
                                            fieldIndex
                                            ],

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
                                action.payload?.message ||
                                "Failed to update Team/Employee schema field";
                        }
                    );
            },
    });

export const {
    clearTeamEmployeeSchemaError,
    clearTeamEmployeeSchemaSuccess,
    resetTeamEmployeeSchemaState,
    clearTeamEmployeeSchemaState,
} = teamEmployeeSchemaSlice.actions;

export default teamEmployeeSchemaSlice.reducer;