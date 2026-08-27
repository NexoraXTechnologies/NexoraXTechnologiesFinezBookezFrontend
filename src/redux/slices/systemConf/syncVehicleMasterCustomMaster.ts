import professionalAxios from "../../../services/professionalAxios";

/* ===================================================
   API PREFIX
=================================================== */

const BOOKEZ_API_PREFIX = "/eTaxSolnMongoApiBackend";

/* ===================================================
   VEHICLE MASTER MODULE DETAILS
=================================================== */

export const VEHICLE_MASTER_MODULE_NAME = "Vehicle Master";

export const VEHICLE_MASTER_MODULE_DESCRIPTION =
    "Fleet vehicles for Book EZ transportation";

/* ===================================================
   DATA SOURCES
=================================================== */

const ACCOUNT_MASTER_DATA_SOURCE = {
    type: "accountMaster",
    api: "/accountMaster/getAllAccounts?offset=0&limit=999999",
};

const buildEmployeeMasterDataSource = () => ({
    type: "employeeMaster",
    api: "/users?offset=0&limit=999999",
});

const buildStateMasterDataSource = () => ({
    type: "stateMaster",
    api: "/users/statesMaster?offset=0&limit=999999",
});

const buildCityMasterDataSource = (dependsOn = "state") => ({
    type: "cityMaster",
    api: "/users/citiesByStateCode?offset=0&limit=600&stateCode={stateCode}",
    dependsOn,
});

/* ===================================================
   COMMON HELPERS
=================================================== */

const normalizeModuleName = (name: any) =>
    String(name || "")
        .trim()
        .toLowerCase();

const assertApiSuccess = (
    response: any,
    fallbackMessage: string
) => {
    if (response?.data?.success === false) {
        throw new Error(
            response?.data?.message ||
            fallbackMessage
        );
    }
};

const extractApiData = (response: any) => {
    return (
        response?.data?.data ??
        response?.data?.record ??
        response?.data?.result ??
        response?.data ??
        response
    );
};

const extractArray = (
    response: any,
    preferredKeys: string[]
) => {
    const responseData = response?.data;
    const extractedData = extractApiData(response);

    const roots = [
        extractedData,
        responseData,
        responseData?.data,
        extractedData?.data,
    ];

    for (const root of roots) {
        if (Array.isArray(root)) {
            return root;
        }

        if (root && typeof root === "object") {
            for (const key of preferredKeys) {
                if (Array.isArray(root?.[key])) {
                    return root[key];
                }
            }
        }
    }

    return [];
};

/* ===================================================
   SELECT OPTION HELPERS
=================================================== */

export const normalizeSelectOptions = (
    options: any
): Array<{ label: string; value: string }> => {
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
                    item.label ??
                    item.value ??
                    ""
                ).trim();

                const value = String(
                    item.value ??
                    item.label ??
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

/* ===================================================
   VEHICLE MASTER SCHEMA
=================================================== */

const EMPTY_MASTER_REF = {
    customMasterCode: "",
    customMasterName: "",
    masterSource: "",
    dependsOn: "",
};

const baseVehicleField = (
    overrides: Record<string, any> = {}
) => ({
    isHidden: false,
    options: [],
    ...EMPTY_MASTER_REF,
    ...overrides,
});

const VEHICLE_TYPE_OPTIONS = [
    "Mini Truck",
    "Pick Up",
    "LCV",
    "MCV",
    "HCV",
    "Trailer",
    "Container",
    "Tipper",
];

const CAPACITY_OPTIONS = [
    "1 TON",
    "1.5 TON",
    "7 TON",
    "9 TON",
    "10 TON",
    "14 TON",
    "15 TON",
    "16 TON",
    "20 TON",
    "25 TON",
    "32 TON",
    "35 TON",
    "40 TON",
];

const FUEL_TYPE_OPTIONS = [
    "Petrol",
    "Diesel",
    "Electric",
];

const CURRENT_STATUS_OPTIONS = [
    "Available",
    "Allocated",
    "On-Way To Load",
    "In-Transit",
    "Loading",
    "Unloading",
    "Inactive",
    "Breakdown",
    "Under Maintenance",
];

const BODY_TYPE_OPTIONS = [
    "Open Body",
    "Closed Body",
    "Container",
    "Half Body",
    "Full Body",
    "Flatbed",
    "Trailer Body",
    "Tanker",
    "Refrigerated",
    "High Deck",
    "Low Bed",
    "Semi Low Bed",
    "Platform",
];

const OWNERSHIP_TYPE_OPTIONS = [
    "Owned",
    "Hired",
];

export const VEHICLE_MASTER_SCHEMA_FIELDS = [
    /* ===============================
       Identity
    =============================== */

    baseVehicleField({
        key: "code",
        label: "Code",
        type: "string",
        isRequired: true,
        isSearchable: true,
        isFilterable: true,
    }),

    baseVehicleField({
        key: "name",
        label: "Name",
        type: "string",
        isRequired: true,
        isSearchable: true,
        isFilterable: true,
    }),

    /* ===============================
       Registration and specifications
    =============================== */

    baseVehicleField({
        key: "vehicle_number",
        label: "Vehicle Number",
        type: "string",
        isRequired: true,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "vehicle_type",
        label: "Vehicle Type",
        type: "select",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
        options: VEHICLE_TYPE_OPTIONS,
    }),

    baseVehicleField({
        key: "capacity",
        label: "Capacity",
        type: "select",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
        options: CAPACITY_OPTIONS,
    }),

    baseVehicleField({
        key: "chasis_number",
        label: "Chasis Number",
        type: "string",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "engine_number",
        label: "Engine Number",
        type: "string",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "make",
        label: "Make",
        type: "string",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "model",
        label: "Model",
        type: "string",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "mfg_year",
        label: "Mfg. Year",
        type: "string",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "fuel_type",
        label: "Fuel Type",
        type: "select",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
        options: FUEL_TYPE_OPTIONS,
    }),

    /* ===============================
       Compliance dates
    =============================== */

    baseVehicleField({
        key: "insurance_expiry",
        label: "Insurance Expiry",
        type: "date",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "fitness_expiry",
        label: "Fitness Expiry",
        type: "date",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "permit_expiry",
        label: "Permit Expiry",
        type: "date",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "puc_expiry",
        label: "PUC Expiry",
        type: "date",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    /* ===============================
       Operations
    =============================== */

    baseVehicleField({
        key: "current_odometer",
        label: "Current Odometer",
        type: "string",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),

    baseVehicleField({
        key: "current_status",
        label: "Current Status",
        type: "select",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
        options: CURRENT_STATUS_OPTIONS,
    }),

    baseVehicleField({
        key: "body_type",
        label: "Body Type",
        type: "select",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
        options: BODY_TYPE_OPTIONS,
    }),

    baseVehicleField({
        key: "ownership_type",
        label: "Ownership Type",
        type: "select",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
        options: OWNERSHIP_TYPE_OPTIONS,
    }),

    /* ===============================
       Linked masters
    =============================== */

    baseVehicleField({
        key: "vendor",
        label: "Vendor",
        type: "accountmaster",
        isRequired: true,
        isSearchable: false,
        isFilterable: false,
        dataSource: ACCOUNT_MASTER_DATA_SOURCE,
    }),

    baseVehicleField({
        key: "customemployeemaster",
        label: "Custom Employee Master",
        type: "employeemaster",
        isRequired: true,
        isSearchable: false,
        isFilterable: true,
        dataSource: buildEmployeeMasterDataSource(),
    }),

    baseVehicleField({
        key: "statemaster",
        label: "State Master",
        type: "statemaster",
        isRequired: true,
        isSearchable: false,
        isFilterable: true,
        masterSource: "stateMaster",
        dataSource: buildStateMasterDataSource(),
    }),

    baseVehicleField({
        key: "citymaster",
        label: "City Master",
        type: "citymaster",
        isRequired: true,
        isSearchable: false,
        isFilterable: true,
        masterSource: "cityMaster",
        dependsOn: "state",
        dataSource:
            buildCityMasterDataSource(
                "state"
            ),
    }),

    baseVehicleField({
        key: "available_from",
        label: "Available From",
        type: "date",
        isRequired: false,
        isSearchable: false,
        isFilterable: false,
    }),
];

export const VEHICLE_MASTER_SCHEMA_FIELD_KEYS =
    new Set(
        VEHICLE_MASTER_SCHEMA_FIELDS.map(
            (field:any) => field.key
        )
    );

export const buildVehicleMasterSchemaFields = (
    fields = VEHICLE_MASTER_SCHEMA_FIELDS
) =>
    fields.map((field: any) => {
        const payload: Record<string, any> = {
            key: field.key,
            label: field.label,
            type: field.type,

            isRequired:
                !!field.isRequired,

            isSearchable:
                !!field.isSearchable,

            isFilterable:
                !!field.isFilterable,

            isHidden:
                !!field.isHidden,

            options:
                Array.isArray(field.options)
                    ? field.options
                    : [],

            customMasterCode:
                field.customMasterCode || "",

            customMasterName:
                field.customMasterName || "",

            masterSource:
                field.masterSource || "",

            dependsOn:
                field.dependsOn || "",
        };

        if (field.dataSource) {
            payload.dataSource =
                field.dataSource;
        }

        return payload;
    });

/* ===================================================
   TEAM EMPLOYEE TRANSPORT SCHEMA
=================================================== */

const EMPTY_TEAM_EMPLOYEE_REF_FIELDS = {
    ref: null,
    valueField: null,
    labelField: null,
};

const baseTeamEmployeeField = (
    overrides: Record<string, any> = {}
): Record<string, any> => ({
    isSearchable: false,
    isFilterable: false,
    isHidden: false,
    isDefault: false,
    options: [],
    customMasterCode: null,
    customMasterName: null,
    ...EMPTY_TEAM_EMPLOYEE_REF_FIELDS,
    ...overrides,
});

const BUSINESS_TYPE_OPTIONS = [
    "manufacturing/production",
    "traders/distributors",
    "retail business",
    "fmcg & distribution",
    "service business",
    "construction & projects",
];

const EMPLOYEE_STATUS_OPTIONS =
    normalizeSelectOptions([
        {
            label: "Assigned",
            value: "Assigned",
        },
        {
            label: "Available",
            value: "Available",
        },
        {
            label: "Not Available",
            value: "Not Available",
        },
    ]);

const EMPLOYEE_CATEGORY_OPTIONS =
    normalizeSelectOptions([
        {
            label: "Accountant",
            value: "Accountant",
        },
        {
            label: "Driver",
            value: "Driver",
        },
        {
            label: "Helper",
            value: "Helper",
        },
    ]);

export const TEAM_EMPLOYEE_TRANSPORT_SCHEMA_FIELD_DEFINITIONS =
    [
        baseTeamEmployeeField({
            key: "businessType",
            label: "Business Type",
            type: "select",
            isRequired: false,
            isHidden: true,
            isDefault: true,
            options:
                BUSINESS_TYPE_OPTIONS,
        }),

        baseTeamEmployeeField({
            key: "licenseNumber",
            label: "License Number",
            type: "string",
            isRequired: false,
        }),

        baseTeamEmployeeField({
            key: "licenseExpiry",
            label: "License Expiry",
            type: "date",
            isRequired: false,
        }),

        baseTeamEmployeeField({
            key: "status",
            label: "Status",
            type: "select",
            isRequired: true,
            options:
                EMPLOYEE_STATUS_OPTIONS,
        }),

        baseTeamEmployeeField({
            key: "employeeCategory",
            label: "Employee Category",
            type: "select",
            isRequired: false,
            options:
                EMPLOYEE_CATEGORY_OPTIONS,
        }),
    ];

export const TEAM_EMPLOYEE_TRANSPORT_SCHEMA_FIELD_KEYS =
    new Set([
        ...TEAM_EMPLOYEE_TRANSPORT_SCHEMA_FIELD_DEFINITIONS.map(
            (field) => field.key
        ),
        "vehiclemaster",
    ]);

export const buildVehicleMasterLinkField = (
    vehicleMasterModuleCode: string
) => {
    const moduleCode = String(
        vehicleMasterModuleCode || ""
    ).trim();

    return baseTeamEmployeeField({
        key: "vehiclemaster",
        label: "vehicleMaster",
        type: "custommaster",
        isRequired: true,
        isFilterable: true,

        customMasterCode:
            moduleCode || null,

        customMasterName:
            "Vehicle Master",

        dataSource: moduleCode
            ? {
                type: "customMaster",

                api:
                    `/users/customMaster/data/getAll?moduleCode=${encodeURIComponent(
                        moduleCode
                    )}&status=active`,
            }
            : undefined,
    });
};

export const buildTeamEmployeeTransportSchemaFields =
    (
        vehicleMasterModuleCode: string
    ) => [
            ...TEAM_EMPLOYEE_TRANSPORT_SCHEMA_FIELD_DEFINITIONS,

            buildVehicleMasterLinkField(
                vehicleMasterModuleCode
            ),
        ];

/* ===================================================
   CUSTOM MASTER MODULE API
=================================================== */

const fetchCustomMasterModules =
    async () => {
        const response =
            await professionalAxios.get(
                `${BOOKEZ_API_PREFIX}/users/customMaster/module/getAll`,
                {
                    params: {
                        offset: 0,
                        limit: 500,
                        search: "",
                        status: "active",
                    },
                }
            );

        assertApiSuccess(
            response,
            "Failed to fetch custom master modules."
        );

        return extractArray(
            response,
            [
                "items",
                "records",
                "modules",
                "docs",
            ]
        );
    };

const findVehicleMasterModule = (
    modules: any[]
) =>
    (
        Array.isArray(modules)
            ? modules
            : []
    ).find(
        (item: any) =>
            normalizeModuleName(
                item?.moduleName
            ) ===
            normalizeModuleName(
                VEHICLE_MASTER_MODULE_NAME
            )
    );

const extractCreatedModule = (
    response: any
) => {
    const data =
        extractApiData(response);

    return (
        data?.module ||
        data?.record ||
        data?.customMasterModule ||
        data
    );
};

const ensureVehicleMasterModule =
    async (
        modules: any[]
    ) => {
        const existing =
            findVehicleMasterModule(
                modules
            );

        if (existing?.moduleCode) {
            return existing;
        }

        const response =
            await professionalAxios.post(
                `${BOOKEZ_API_PREFIX}/users/customMaster/module/create`,
                {
                    moduleName:
                        VEHICLE_MASTER_MODULE_NAME,

                    description:
                        VEHICLE_MASTER_MODULE_DESCRIPTION,

                    status: "active",
                }
            );

        assertApiSuccess(
            response,
            "Failed to create Vehicle Master module."
        );

        return extractCreatedModule(
            response
        );
    };

/* ===================================================
   VEHICLE MASTER SCHEMA API
=================================================== */

const fetchModuleSchemaFields =
    async (
        moduleCode: string
    ) => {
        const response =
            await professionalAxios.get(
                `${BOOKEZ_API_PREFIX}/users/customMaster/schema/getAll`,
                {
                    params: {
                        moduleCode,
                        offset: 0,
                        limit: 200,
                    },
                }
            );

        assertApiSuccess(
            response,
            "Failed to fetch Vehicle Master schema."
        );

        return extractArray(
            response,
            [
                "fields",
                "items",
                "records",
            ]
        );
    };

const saveMissingVehicleSchemaFields =
    async (
        moduleCode: string,
        existingFields: any[] = []
    ) => {
        const existingKeys =
            new Set(
                (
                    Array.isArray(
                        existingFields
                    )
                        ? existingFields
                        : []
                ).map((field: any) =>
                    String(
                        field?.key || ""
                    ).trim()
                )
            );

        const missingFields =
            buildVehicleMasterSchemaFields().filter(
                (field: any) =>
                    !existingKeys.has(
                        field.key
                    )
            );

        if (!missingFields.length) {
            return {
                added: 0,
            };
        }

        const response =
            await professionalAxios.post(
                `${BOOKEZ_API_PREFIX}/users/customMaster/schema/save`,
                {
                    moduleCode,
                    fields: missingFields,
                }
            );

        assertApiSuccess(
            response,
            "Failed to save Vehicle Master schema fields."
        );

        return {
            added:
                missingFields.length,
        };
    };

/* ===================================================
   TEAM EMPLOYEE SCHEMA API
=================================================== */

const TEAM_EMPLOYEE_SCHEMA_BASE =
    `${BOOKEZ_API_PREFIX}/users/userManagement/childUser/schema`;

const fetchTeamEmployeeSchemaFields =
    async ({
        pageOffset = 0,
        limit = 500,
    }: {
        pageOffset?: number;
        limit?: number;
    } = {}) => {
        const response =
            await professionalAxios.get(
                `${TEAM_EMPLOYEE_SCHEMA_BASE}/getAll`,
                {
                    params: {
                        offset:
                            pageOffset,

                        limit,

                        isSearchable: "",

                        isRequired: "",

                        type: "",

                        isFilterable: "",
                    },
                }
            );

        assertApiSuccess(
            response,
            "Failed to fetch Team Employee schema."
        );

        return {
            fields: extractArray(
                response,
                [
                    "fields",
                    "items",
                    "records",
                ]
            ),

            pagination:
                extractApiData(
                    response
                )?.pagination ||
                {},
        };
    };

const saveTeamEmployeeSchemaFields =
    async (
        fields: any[]
    ) => {
        const response =
            await professionalAxios.post(
                `${TEAM_EMPLOYEE_SCHEMA_BASE}/save`,
                {
                    fields,
                }
            );

        assertApiSuccess(
            response,
            "Failed to save Team Employee transport fields."
        );
    };

const fetchAllTeamEmployeeSchemaFields =
    async () => {
        const result =
            await fetchTeamEmployeeSchemaFields(
                {
                    pageOffset: 0,
                    limit: 500,
                }
            );

        return Array.isArray(
            result?.fields
        )
            ? result.fields
            : [];
    };

const saveMissingTeamEmployeeTransportFields =
    async (
        vehicleMasterModuleCode: string
    ) => {
        const existingFields =
            await fetchAllTeamEmployeeSchemaFields();

        const existingKeys =
            new Set(
                existingFields.map(
                    (field: any) =>
                        String(
                            field?.key || ""
                        ).trim()
                )
            );

        const missingFields =
            buildTeamEmployeeTransportSchemaFields(
                vehicleMasterModuleCode
            ).filter(
                (field: any) =>
                    !existingKeys.has(
                        field.key
                    )
            );

        if (!missingFields.length) {
            return {
                added: 0,
            };
        }

        await saveTeamEmployeeSchemaFields(
            missingFields
        );

        return {
            added:
                missingFields.length,
        };
    };

/* ===================================================
   PUBLIC SYNCHRONIZATION FUNCTION
=================================================== */

/**
 * When BookEZ transportation is enabled:
 *
 * 1. Check whether Vehicle Master module exists.
 * 2. Create Vehicle Master module when missing.
 * 3. Add only missing Vehicle Master schema fields.
 * 4. Add only missing transport fields to Team Employee schema.
 *
 * This function is idempotent and does not create duplicate
 * modules or duplicate fields.
 */
export const syncVehicleMasterCustomMaster =
    async (
        enabled: boolean | string
    ) => {
        const shouldEnable =
            enabled === true ||
            enabled === "true";

        if (!shouldEnable) {
            return {
                skipped: true,
                reason:
                    "Transportation module is disabled.",
            };
        }

        const modules =
            await fetchCustomMasterModules();

        const vehicleMasterModule =
            await ensureVehicleMasterModule(
                modules
            );

        const moduleCode =
            String(
                vehicleMasterModule?.moduleCode ||
                vehicleMasterModule?.data
                    ?.moduleCode ||
                ""
            ).trim();

        if (!moduleCode) {
            throw new Error(
                "Unable to resolve Vehicle Master module code."
            );
        }

        const existingVehicleFields =
            await fetchModuleSchemaFields(
                moduleCode
            );

        const vehicleSchemaResult =
            await saveMissingVehicleSchemaFields(
                moduleCode,
                existingVehicleFields
            );

        const teamEmployeeSchemaResult =
            await saveMissingTeamEmployeeTransportFields(
                moduleCode
            );

        return {
            skipped: false,
            moduleCode,

            vehicleFieldsAdded:
                vehicleSchemaResult.added,

            teamEmployeeFieldsAdded:
                teamEmployeeSchemaResult.added,

            totalVehicleSchemaFields:
                VEHICLE_MASTER_SCHEMA_FIELD_KEYS.size,

            totalTeamEmployeeTransportFields:
                TEAM_EMPLOYEE_TRANSPORT_SCHEMA_FIELD_KEYS.size,
        };
    };

/* ===================================================
   CONFIGURATION RESOLVER
=================================================== */

export const resolveTransportationEnabled =
    (
        systemConfiguration: any
    ) =>
        systemConfiguration
            ?.transportationModuleConfiguration
            ?.enableTransportationModule ===
        true ||
        systemConfiguration
            ?.transportationModuleConfiguration
            ?.enableTransportationModule ===
        "true";