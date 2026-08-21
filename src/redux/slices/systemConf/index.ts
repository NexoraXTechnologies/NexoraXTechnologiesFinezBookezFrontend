import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";
import {
    syncVehicleMasterCustomMaster,
} from "./syncVehicleMasterCustomMaster";

/* ===================================================
   CONSTANTS
=================================================== */

const WHATSAPP_MODULE_ORDER = [
    "salesQuotation",
    "salesOrder",
    "salesInvoice",
    "salesReturn",
    "receipt",
    "purchaseOrder",
    "grn",
    "purchaseInvoice",
    "purchaseReturn",
    "payment",
];

const BOOKEZ_API_PREFIX = "eTaxSolnMongoApiBackend";
const POS_POSTING_API = `${BOOKEZ_API_PREFIX}/users/bookez/posPosting`;
const ACCOUNT_MASTER_API = `${BOOKEZ_API_PREFIX}/accountMaster/getAllAccounts`;
const TRANSACTION_SCHEMA_ADD_FIELD_API = `${BOOKEZ_API_PREFIX}/users/bookez/transactionSchema/addField`;
const CUSTOM_MASTER_MODULES_API = `${BOOKEZ_API_PREFIX}/users/customMaster/module/getAll`;
const POS_POSTING_KEYS = ["sales", "cash", "upi"] as const;

const toBool = (value: any) => {
    return value === true || value === "true" || value === 1 || value === "1";
};

const normalizeWhereToAddInventory = (value: any) => {
    const rawValue =
        value && typeof value === "object"
            ? value?.value ?? value?.code ?? value?.key ?? value?.name ?? value?.label ?? ""
            : value;

    const normalized = String(rawValue || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    if (["header", "transaction header", "header level", "transaction level"].includes(normalized)) return "header";
    if (["body", "transaction body", "transaction body (line item)", "line item", "lineitem", "body level"].includes(normalized)) return "body";

    return "";
};

const createModuleConfigurationTemplate = (enabledDefault: boolean) => {
    return Object.fromEntries(
        WHATSAPP_MODULE_ORDER.map((key) => [
            key,
            {
                enabled: !!enabledDefault,
            },
        ])
    );
};

const normalizeWhatsAppModuleConfiguration = (whatsAppSection: any) => {
    const src = whatsAppSection?.moduleConfiguration;

    const hasStructuredConfig =
        src &&
        typeof src === "object" &&
        WHATSAPP_MODULE_ORDER.some((key) => {
            const item = src[key];

            return (
                item != null &&
                typeof item === "object" &&
                "enabled" in item
            );
        });

    if (!hasStructuredConfig) {
        return createModuleConfigurationTemplate(true);
    }

    const out: any = {};

    for (const key of WHATSAPP_MODULE_ORDER) {
        out[key] = {
            enabled: toBool(src?.[key]?.enabled),
        };
    }

    return out;
};

/* ===================================================
   EMPTY CONFIG
=================================================== */

export const getEmptySystemConfiguration = () => ({
    _id: "",
    configurationCode: "",
    configurationName: "Default System Config",
    status: "active",

    systemConfiguration: {
        salesQuotation: {
            enableLocation: false,
        },

        kitConfiguration: {
            enableKit: false,
        },

        bankStatementConfiguration: {
            enableBankStatementImport: false,
        },

        productSettings: {
            allowDuplicateProduct: false,
        },

        posConfiguration: {
            enablePOSModule: false,
        },

        scrapManagement: {
            enableScrapManagement: false,
        },

        transportationModuleConfiguration: {
            enableTransportationModule: false,
        },

        engineeringModuleConfiguration: {
            enableEngineeringModule: false
        },

        whatsAppConfiguration: {
            enableWhatsAppModule: false,
            provider: "META",
            defaultLanguage: "en_US",
            moduleConfiguration: createModuleConfigurationTemplate(false),
        },
    },

    inventoryConfiguration: {
        maintainInventory: false,
        enableQrBarcode: false,
        enableServiceProductInventory: false,
        inventoryTagLevel: "",
        whereToAddInventory: "",
        inventoryPickMethod: "",
        negativeStockPolicy: "",
    },

    financeConfiguration: {
        isActive: false,
    },

    createdOn: "",
    createdBy: "",
    modifiedOn: "",
    modifiedBy: "",
    anyOtherField: "",
});

/* ===================================================
   NORMALIZE CONFIG
=================================================== */

export const normalizeSystemConfiguration = (raw: any) => ({
    _id: raw?._id || "",
    configurationCode: raw?.configurationCode || "",
    configurationName:
        raw?.configurationName || "Default System Config",
    status: raw?.status || "active",

    systemConfiguration: {
        salesQuotation: {
            enableLocation: toBool(
                raw?.systemConfiguration?.salesQuotation?.enableLocation
            ),
        },

        kitConfiguration: {
            enableKit: toBool(
                raw?.systemConfiguration?.kitConfiguration?.enableKit
            ),
        },

        bankStatementConfiguration: {
            enableBankStatementImport: toBool(
                raw?.systemConfiguration?.bankStatementConfiguration
                    ?.enableBankStatementImport
            ),
        },

        productSettings: {
            allowDuplicateProduct: toBool(
                raw?.systemConfiguration?.allowDuplicateProduct
            ),
        },

        posConfiguration: {
            enablePOSModule: toBool(
                raw?.systemConfiguration?.posConfiguration?.enablePOSModule
            ),
        },

        scrapManagement: {
            enableScrapManagement: toBool(
                raw?.systemConfiguration?.scrapManagement
                    ?.enableScrapManagement
            ),
        },

        transportationModuleConfiguration: {
            enableTransportationModule: toBool(
                raw?.systemConfiguration?.transportationModuleConfiguration
                    ?.enableTransportationModule
            ),
            advanceReceive:
                raw?.systemConfiguration?.transportationModuleConfiguration
                    ?.advanceReceive,
            foodCost:
                raw?.systemConfiguration?.transportationModuleConfiguration
                    ?.foodCost,
            petrolCost:
                raw?.systemConfiguration?.transportationModuleConfiguration
                    ?.petrolCost,
            dieselCost:
                raw?.systemConfiguration?.transportationModuleConfiguration
                    ?.dieselCost,
            runningCost:
                raw?.systemConfiguration?.transportationModuleConfiguration
                    ?.runningCost,
            breakdownCost:
                raw?.systemConfiguration?.transportationModuleConfiguration
                    ?.breakdownCost,
            otherCost:
                raw?.systemConfiguration?.transportationModuleConfiguration
                    ?.otherCost,
        },

        engineeringModuleConfiguration: {
            enableEngineeringModule: toBool(
                raw?.systemConfiguration?.engineeringModuleConfiguration
                    ?.enableEngineeringModule
            ),
        },

        whatsAppConfiguration: {
            enableWhatsAppModule: toBool(
                raw?.systemConfiguration?.whatsAppConfiguration
                    ?.enableWhatsAppModule
            ),

            provider: String(
                raw?.systemConfiguration?.whatsAppConfiguration?.provider ||
                "META"
            )
                .trim()
                .toUpperCase(),

            defaultLanguage: String(
                raw?.systemConfiguration?.whatsAppConfiguration
                    ?.defaultLanguage || "en_US"
            ).trim(),

            moduleConfiguration: normalizeWhatsAppModuleConfiguration(
                raw?.systemConfiguration?.whatsAppConfiguration
            ),
        },
    },

    inventoryConfiguration: {
        maintainInventory: toBool(
            raw?.inventoryConfiguration?.maintainInventory
        ),

        enableQrBarcode: toBool(
            raw?.inventoryConfiguration?.enableQrBarcode
        ),

        enableServiceProductInventory: toBool(
            raw?.inventoryConfiguration?.enableServiceProductInventory
        ),

        inventoryTagLevel:
            raw?.inventoryConfiguration?.inventoryTagLevel || "",

        whereToAddInventory: normalizeWhereToAddInventory(
            raw?.inventoryConfiguration?.whereToAddInventory ??
            raw?.inventoryConfiguration?.whereToAdd ??
            raw?.inventoryConfiguration?.inventoryFieldPlacement ??
            raw?.inventoryConfiguration?.inventoryTrackingFieldPlacement ??
            ""
        ),

        inventoryPickMethod:
            raw?.inventoryConfiguration?.inventoryPickMethod || "",

        negativeStockPolicy:
            raw?.inventoryConfiguration?.negativeStockPolicy || "",
    },

    financeConfiguration: {
        isActive: toBool(raw?.financeConfiguration?.isActive),
    },

    createdOn: raw?.createdOn || "",
    createdBy: raw?.createdBy || "",
    modifiedOn: raw?.modifiedOn || "",
    modifiedBy: raw?.modifiedBy || "",
    anyOtherField: raw?.anyOtherField || "",
});

/* ===================================================
   API RESPONSE HELPERS
=================================================== */

const unwrapApiRecord = (res: any) => {
    if (res == null) return null;

    const inner =
        res?.data ??
        res?.record ??
        res?.result ??
        res?.payload ??
        res;

    if (
        inner &&
        typeof inner === "object" &&
        !Array.isArray(inner)
    ) {
        if (inner.success === false) return null;

        if (
            "data" in inner &&
            inner.data != null &&
            typeof inner.data === "object"
        ) {
            return inner.data;
        }
    }

    return inner;
};

const extractConfigurationRecords = (apiData: any) => {
    if (Array.isArray(apiData)) return apiData;

    if (Array.isArray(apiData?.records)) return apiData.records;

    if (Array.isArray(apiData?.data?.records))
        return apiData.data.records;

    if (Array.isArray(apiData?.data)) return apiData.data;

    if (Array.isArray(apiData?.configurations))
        return apiData.configurations;

    if (Array.isArray(apiData?.configuration))
        return apiData.configuration;

    return [];
};

const extractPagination = (apiData: any, fallback: any) => {
    return (
        apiData?.pagination ||
        apiData?.data?.pagination ||
        fallback
    );
};

const extractApiArray = (
    apiData: any,
    preferredKeys: string[]
) => {
    const roots = [
        apiData,
        apiData?.data,
        apiData?.result,
        apiData?.payload,
        apiData?.data?.data,
    ];

    for (const root of roots) {
        if (Array.isArray(root)) return root;

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

const extractPosPostingRecords = (apiData: any) =>
    extractApiArray(apiData, [
        "records",
        "items",
        "posPostings",
    ]);

const extractAccountItems = (apiData: any) =>
    extractApiArray(apiData, [
        "items",
        "records",
        "accounts",
    ]);


/* ===================================================
   TRANSPORTATION -> RECEIPT / PAYMENT FIELDS

   IMPORTANT:
   Vehicle Master creation is NOT handled here.
   Existing syncVehicleMasterCustomMaster remains the
   only Vehicle Master creation/synchronization flow.
=================================================== */

const normalizeTransportMasterName = (value: any) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

const extractCustomMasterModules = (apiData: any) =>
    extractApiArray(apiData, [
        "items",
        "records",
        "modules",
        "masters",
    ]);

const getVehicleMasterCodeFromSyncResult = (syncResult: any) => {
    const candidates = [
        syncResult?.moduleCode,
        syncResult?.customMasterCode,
        syncResult?.data?.moduleCode,
        syncResult?.data?.customMasterCode,
        syncResult?.record?.moduleCode,
        syncResult?.record?.customMasterCode,
        syncResult?.master?.moduleCode,
        syncResult?.master?.customMasterCode,
        syncResult?.module?.moduleCode,
        syncResult?.module?.customMasterCode,
    ];

    return String(
        candidates.find((value) => String(value || "").trim()) || ""
    ).trim();
};

const getVehicleMasterModuleCode = async (vehicleMasterSync?: any) => {
    const codeFromSync = getVehicleMasterCodeFromSyncResult(vehicleMasterSync);
    if (codeFromSync) return codeFromSync;

    /*
       Use the SAME professionalAxios setup already used by the
       working application. Do not replace/mutate tenant headers.
    */
    const res = await professionalAxios.get(CUSTOM_MASTER_MODULES_API, {
        params: {
            offset: 0,
            limit: 500,
            search: "",
            status: "",
        },
    });

    if (res?.data?.success === false) {
        throw new Error(
            res?.data?.message ||
            "Failed to load Vehicle Master configuration."
        );
    }

    const modules = extractCustomMasterModules(res?.data);
    const vehicleMaster = modules.find((item: any) => {
        const moduleName =
            item?.moduleName ||
            item?.customMasterName ||
            item?.name ||
            "";

        return normalizeTransportMasterName(moduleName) === "vehiclemaster";
    });

    const moduleCode = String(
        vehicleMaster?.moduleCode ||
        vehicleMaster?.customMasterCode ||
        ""
    ).trim();

    if (!moduleCode) {
        throw new Error(
            "Vehicle Master module code not found after Vehicle Master synchronization."
        );
    }

    return moduleCode;
};

const buildTransportationAccountingFields = (vehicleMasterCode: string) => [
    {
        key: "trip_order",
        label: "Trip Order",
        type: "string",
        isRequired: false,
        isSearchable: true,
        isFilterable: true,
        isSystemGenerated: true,
    },
    {
        key: "lr_no",
        label: "LR No",
        type: "string",
        isRequired: false,
        isSearchable: true,
        isFilterable: true,
        isSystemGenerated: true,
    },
    {
        key: "driver",
        label: "Driver",
        type: "string",
        isRequired: false,
        isSearchable: true,
        isFilterable: true,
        isSystemGenerated: true,
    },
    {
        key: "vehicle_master",
        label: "Vehicle Master",
        type: "custommaster",
        customMasterCode: vehicleMasterCode,
        customMasterName: "Vehicle Master",
        isRequired: false,
        isSearchable: true,
        isFilterable: true,
        isSystemGenerated: true,
    },
];

const syncTransportationReceiptPaymentFields = async ({
    enabled,
    vehicleMasterSync,
}: {
    enabled: boolean;
    vehicleMasterSync?: any;
}) => {
    if (!enabled) {
        return {
            skipped: true,
            reason: "Maintain Inventory is disabled.",
        };
    }

    const vehicleMasterCode = await getVehicleMasterModuleCode(vehicleMasterSync);
    const fields = buildTransportationAccountingFields(vehicleMasterCode);
    const modules = ["receipt", "payment"] as const;
    const results: any[] = [];

    /*
       addField already merges fields by key in backend, so we do
       not need GET -> compare -> UPDATE. This keeps the new flow
       completely separate from Vehicle Master creation.
    */
    for (const module of modules) {
        const res = await professionalAxios.post(
            TRANSACTION_SCHEMA_ADD_FIELD_API,
            {
                module,
                section: "header",
                fields,
            }
        );

        if (res?.data?.success === false) {
            throw new Error(
                res?.data?.message ||
                `Failed to add transportation fields in ${module}.`
            );
        }

        results.push({
            module,
            success: true,
            response: res?.data?.data || null,
        });
    }

    return {
        skipped: false,
        vehicleMasterCode,
        results,
    };
};

export const whatsAppMetaCredentialsHasData = (
    apiResponse: any
) => {
    const root = unwrapApiRecord(apiResponse);

    if (root == null) return false;

    if (typeof root === "string") {
        return root.trim().length > 0;
    }

    if (Array.isArray(root)) {
        return root.length > 0;
    }

    if (typeof root !== "object") return false;

    const keys = Object.keys(root).filter(
        (key) =>
            root[key] != null &&
            String(root[key]).trim().length > 0 &&
            key !== "message" &&
            key !== "code" &&
            key !== "success"
    );

    return keys.length > 0;
};

/* ===================================================
   PAYLOAD BUILDER
=================================================== */

const buildConfigurationPayload = (
    configuration: any
) => {
    const wa =
        configuration?.systemConfiguration
            ?.whatsAppConfiguration || {};

    const baseMods =
        wa?.moduleConfiguration || {};

    const moduleConfiguration: any = {};

    for (const key of WHATSAPP_MODULE_ORDER) {
        moduleConfiguration[key] = {
            enabled: !!baseMods?.[key]?.enabled,
        };
    }

    console.log({ configuration });

    return {
        configurationName:
            configuration?.configurationName?.trim() ||
            "Default System Config",

        status:
            configuration?.status ||
            "active",

        systemConfiguration: {
            salesQuotation: {
                enableLocation:
                    !!configuration?.systemConfiguration
                        ?.salesQuotation?.enableLocation,
            },

            kitConfiguration: {
                enableKit:
                    !!configuration?.systemConfiguration
                        ?.kitConfiguration?.enableKit,
            },

            bankStatementConfiguration: {
                enableBankStatementImport:
                    !!configuration?.systemConfiguration
                        ?.bankStatementConfiguration
                        ?.enableBankStatementImport,
            },

            allowDuplicateProduct:
                !!configuration?.systemConfiguration
                    ?.productSettings
                    ?.allowDuplicateProduct,

            posConfiguration: {
                enablePOSModule:
                    !!configuration?.systemConfiguration
                        ?.posConfiguration
                        ?.enablePOSModule,
            },

            scrapManagement: {
                enableScrapManagement:
                    !!configuration?.systemConfiguration
                        ?.scrapManagement
                        ?.enableScrapManagement,
            },

            transportationModuleConfiguration: {
                enableTransportationModule:
                    !!configuration?.systemConfiguration
                        ?.transportationModuleConfiguration
                        ?.enableTransportationModule,

                advanceReceive:
                    configuration?.systemConfiguration
                        ?.transportationModuleConfiguration
                        ?.advanceReceive,

                foodCost:
                    configuration?.systemConfiguration
                        ?.transportationModuleConfiguration
                        ?.foodCost,

                petrolCost:
                    configuration?.systemConfiguration
                        ?.transportationModuleConfiguration
                        ?.petrolCost,

                dieselCost:
                    configuration?.systemConfiguration
                        ?.transportationModuleConfiguration
                        ?.dieselCost,

                runningCost:
                    configuration?.systemConfiguration
                        ?.transportationModuleConfiguration
                        ?.runningCost,

                breakdownCost:
                    configuration?.systemConfiguration
                        ?.transportationModuleConfiguration
                        ?.breakdownCost,

                otherCost:
                    configuration?.systemConfiguration
                        ?.transportationModuleConfiguration
                        ?.otherCost,
            },

            engineeringModuleConfiguration: {
                enableEngineeringModule: !!configuration?.systemConfiguration?.engineeringModuleConfiguration?.enableEngineeringModule,
            },

            whatsAppConfiguration: {
                enableWhatsAppModule:
                    !!wa?.enableWhatsAppModule,

                provider:
                    String(
                        wa?.provider ||
                        "META"
                    )
                        .trim()
                        .toUpperCase(),

                defaultLanguage:
                    String(
                        wa?.defaultLanguage ||
                        "en_US"
                    ).trim(),

                moduleConfiguration,
            },
        },

        inventoryConfiguration: {
            maintainInventory:
                !!configuration
                    ?.inventoryConfiguration
                    ?.maintainInventory,

            enableQrBarcode:
                !!configuration
                    ?.inventoryConfiguration
                    ?.enableQrBarcode,

            enableServiceProductInventory:
                !!configuration?.inventoryConfiguration?.enableServiceProductInventory,

            inventoryTagLevel:
                configuration
                    ?.inventoryConfiguration
                    ?.inventoryTagLevel ||
                "",

            whereToAddInventory:
                configuration
                    ?.inventoryConfiguration
                    ?.inventoryTagLevel ===
                    "WAREHOUSE" ||
                    configuration
                        ?.inventoryConfiguration
                        ?.inventoryTagLevel ===
                    "WAREHOUSE_LOCATION"
                    ? normalizeWhereToAddInventory(
                        configuration
                            ?.inventoryConfiguration
                            ?.whereToAddInventory
                    )
                    : "",

            inventoryPickMethod:
                configuration
                    ?.inventoryConfiguration
                    ?.inventoryPickMethod ||
                "",

            negativeStockPolicy:
                configuration
                    ?.inventoryConfiguration
                    ?.negativeStockPolicy ||
                "",
        },

        financeConfiguration: {
            isActive:
                !!configuration
                    ?.financeConfiguration
                    ?.isActive,
        },

        anyOtherField:
            configuration?.anyOtherField || "",
    };
};

/* ===================================================
   GET ALL CONFIGURATIONS
=================================================== */

export const getAllSystemConfigurations =
    createAsyncThunk(
        "systemConfiguration/getAllSystemConfigurations",

        async (
            {
                offset = 0,
                limit = 100000,
                status = "",
            }: {
                offset?: number;
                limit?: number;
                status?: string;
            } = {},

            {
                rejectWithValue,
            }
        ) => {
            try {
                const params: {
                    offset: number;
                    limit: number;
                    status?: string;
                } = {
                    offset,
                    limit,
                };

                if (status?.trim()) {
                    params.status =
                        status.trim();
                }

                const res =
                    await professionalAxios.get(
                        "eTaxSolnMongoApiBackend/users/configuration/getAll",
                        {
                            params,
                        }
                    );

                if (
                    !res.data?.success &&
                    !res.data?.records &&
                    !res.data?.data
                        ?.records &&
                    !Array.isArray(
                        res.data
                    )
                ) {
                    return rejectWithValue({
                        message:
                            res.data
                                ?.message ||
                            "Failed to fetch configurations",

                        status:
                            res?.status,
                    });
                }

                return (
                    res.data?.data ||
                    res.data
                );
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        "Failed to fetch configurations",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

/* ===================================================
   GET LATEST CONFIGURATION
=================================================== */

export const getLatestSystemConfiguration =
    createAsyncThunk(
        "systemConfiguration/getLatestSystemConfiguration",

        async (
            _,
            {
                rejectWithValue,
            }
        ) => {
            try {
                const res =
                    await professionalAxios.get(
                        "eTaxSolnMongoApiBackend/users/configuration/getAll",
                        {
                            params: {
                                offset: 0,
                                limit: 100000,
                                status: "",
                            },
                        }
                    );

                if (
                    !res.data?.success &&
                    !res.data?.records &&
                    !res.data?.data
                        ?.records &&
                    !Array.isArray(
                        res.data
                    )
                ) {
                    return rejectWithValue({
                        message:
                            res.data
                                ?.message ||
                            "Failed to fetch latest configuration",

                        status:
                            res?.status,
                    });
                }

                const data =
                    res.data?.data ||
                    res.data;

                const records =
                    extractConfigurationRecords(
                        data
                    );

                if (!records.length) {
                    return getEmptySystemConfiguration();
                }

                const sortedRecords =
                    [...records].sort(
                        (a, b) => {
                            const aTime =
                                new Date(
                                    a?.modifiedOn ||
                                    a?.createdOn ||
                                    "1970-01-01"
                                ).getTime();

                            const bTime =
                                new Date(
                                    b?.modifiedOn ||
                                    b?.createdOn ||
                                    "1970-01-01"
                                ).getTime();

                            return (
                                bTime -
                                aTime
                            );
                        }
                    );

                console.log({
                    sortedRecords:
                        sortedRecords[0],
                });

                return normalizeSystemConfiguration(
                    sortedRecords[0]
                );
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        "Failed to fetch latest configuration",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

/* ===================================================
   GET CONFIGURATION BY CODE
=================================================== */

export const getSystemConfigurationByCode =
    createAsyncThunk(
        "systemConfiguration/getSystemConfigurationByCode",

        async (
            {
                configurationCode,
            }: {
                configurationCode: string;
            },

            {
                rejectWithValue,
            }
        ) => {
            try {
                const res =
                    await professionalAxios.get(
                        `eTaxSolnMongoApiBackend/users/configuration/getByCode/${configurationCode}`
                    );

                if (
                    !res.data
                        ?.success &&
                    !res.data?.data &&
                    !res.data
                        ?.configurationCode
                ) {
                    return rejectWithValue({
                        message:
                            res.data
                                ?.message ||
                            "Failed to fetch configuration",

                        status:
                            res?.status,
                    });
                }

                const record =
                    res?.data?.data ||
                    res?.data?.record ||
                    res?.data;

                return normalizeSystemConfiguration(
                    record
                );
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        "Failed to fetch configuration",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

/* ===================================================
   SAVE CONFIGURATION
=================================================== */

export const saveSystemConfiguration =
    createAsyncThunk(
        "systemConfiguration/saveSystemConfiguration",

        async (
            {
                configuration,
            }: {
                configuration: any;
            },

            {
                rejectWithValue,
            }
        ) => {
            try {
                const payload =
                    buildConfigurationPayload(
                        configuration
                    );

                const res =
                    await professionalAxios.post(
                        "eTaxSolnMongoApiBackend/users/configuration/save",
                        payload
                    );

                if (
                    !res.data?.success
                ) {
                    return rejectWithValue({
                        message:
                            res.data
                                ?.message ||
                            "Failed to save configuration",

                        status:
                            res?.status,
                    });
                }

                return {
                    message:
                        res.data
                            ?.message,

                    data:
                        res.data
                            ?.data,
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        "Failed to save configuration",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

/* ===================================================
   UPDATE CONFIGURATION
=================================================== */

export const updateSystemConfiguration =
    createAsyncThunk(
        "systemConfiguration/updateSystemConfiguration",

        async (
            {
                configurationCode,
                configuration,
            }: {
                configurationCode: string;
                configuration: any;
            },

            {
                rejectWithValue,
            }
        ) => {
            try {
                const payload =
                    buildConfigurationPayload(
                        configuration
                    );

                const res =
                    await professionalAxios.put(
                        `eTaxSolnMongoApiBackend/users/configuration/update/${configurationCode}`,
                        payload
                    );

                if (
                    !res.data?.success
                ) {
                    return rejectWithValue({
                        message:
                            res.data
                                ?.message ||
                            "Failed to update configuration",

                        status:
                            res?.status,
                    });
                }

                return {
                    message:
                        res.data
                            ?.message,

                    data:
                        res.data
                            ?.data,

                    configurationCode,
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        "Failed to update configuration",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

/* ===================================================
   SAVE OR UPDATE CONFIGURATION
=================================================== */

export const saveOrUpdateSystemConfiguration =
    createAsyncThunk(
        "systemConfiguration/saveOrUpdateSystemConfiguration",

        async (
            {
                configuration,
            }: {
                configuration: any;
            },

            {
                dispatch,
                rejectWithValue,
            }
        ) => {
            try {
                const configurationCode =
                    configuration
                        ?.configurationCode;

                /*
                 * IMPORTANT:
                 * Vehicle Master + Receipt/Payment transportation fields
                 * are controlled by Inventory Configuration -> Maintain Inventory.
                 *
                 * Use the payload being submitted as the source of truth
                 * so the sync runs immediately when Maintain Inventory is enabled.
                 */
                const submittedPayload =
                    buildConfigurationPayload(
                        configuration
                    );

                let result: any;

                let latestConfiguration: any;

                let mode:
                    | "save"
                    | "update";

                /* ==========================================
                   STEP 1: SAVE OR UPDATE CONFIGURATION
                ========================================== */

                if (configurationCode) {
                    mode = "update";

                    result =
                        await dispatch(
                            updateSystemConfiguration(
                                {
                                    configurationCode,
                                    configuration,
                                }
                            ) as any
                        ).unwrap();

                    latestConfiguration =
                        await dispatch(
                            getSystemConfigurationByCode(
                                {
                                    configurationCode,
                                }
                            ) as any
                        ).unwrap();
                } else {
                    mode = "save";

                    result =
                        await dispatch(
                            saveSystemConfiguration(
                                {
                                    configuration,
                                }
                            ) as any
                        ).unwrap();

                    const newCode =
                        result?.data
                            ?.configurationCode;

                    if (newCode) {
                        latestConfiguration =
                            await dispatch(
                                getSystemConfigurationByCode(
                                    {
                                        configurationCode:
                                            newCode,
                                    }
                                ) as any
                            ).unwrap();
                    } else {
                        latestConfiguration =
                            await dispatch(
                                getLatestSystemConfiguration() as any
                            ).unwrap();
                    }
                }

                /* ==========================================
                   ⭐ VEHICLE MASTER SYNCHRONIZATION

                   Trigger:
                   inventoryConfiguration.maintainInventory

                   Configuration save/update remains primary.
                   Vehicle Master failure does not reject the
                   successfully saved configuration.
                ========================================== */

                let vehicleMasterSync: any = {
                    skipped: true,
                };

                try {
                    const maintainInventoryEnabled =
                        toBool(
                            submittedPayload
                                ?.inventoryConfiguration
                                ?.maintainInventory
                        );

                    console.log(
                        "Vehicle Master sync maintainInventoryEnabled:",
                        maintainInventoryEnabled
                    );

                    vehicleMasterSync =
                        await syncVehicleMasterCustomMaster(
                            maintainInventoryEnabled
                        );

                    console.log(
                        "Vehicle Master synchronization result:",
                        vehicleMasterSync
                    );
                } catch (
                syncError: any
                ) {
                    console.log(
                        "syncVehicleMasterCustomMaster error:",
                        syncError
                    );

                    vehicleMasterSync = {
                        failed: true,

                        message:
                            syncError?.message ||
                            "Vehicle Master synchronization failed.",
                    };
                }


                /* ==========================================
                   ⭐ RECEIPT / PAYMENT TRANSPORT FIELDS

                   Trigger:
                   inventoryConfiguration.maintainInventory

                   This runs AFTER Vehicle Master synchronization.
                ========================================== */

                let transportationTransactionFieldSync: any = {
                    skipped: true,
                };

                try {
                    const maintainInventoryEnabled =
                        toBool(
                            submittedPayload
                                ?.inventoryConfiguration
                                ?.maintainInventory
                        );

                    transportationTransactionFieldSync =
                        await syncTransportationReceiptPaymentFields({
                            enabled: maintainInventoryEnabled,
                            vehicleMasterSync,
                        });

                    console.log(
                        "Receipt / Payment transportation field synchronization result:",
                        transportationTransactionFieldSync
                    );
                } catch (syncError: any) {
                    console.log(
                        "syncTransportationReceiptPaymentFields error:",
                        syncError
                    );

                    transportationTransactionFieldSync = {
                        failed: true,
                        message:
                            syncError?.response?.data?.message ||
                            syncError?.message ||
                            "Receipt / Payment transportation field synchronization failed.",
                    };
                }

                /* ==========================================
                   STEP 3: RETURN SUCCESSFUL CONFIGURATION
                ========================================== */

                return {
                    message:
                        result?.message ||
                        (
                            mode ===
                                "update"
                                ? "Configuration updated successfully"
                                : "Configuration saved successfully"
                        ),

                    configuration:
                        latestConfiguration,

                    mode,

                    vehicleMasterSync,

                    transportationTransactionFieldSync,
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.message ||
                        err?.response?.data
                            ?.message ||
                        "Failed to save configuration",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

export const verifyWhatsAppMetaCredentials =
    createAsyncThunk(
        "systemConfiguration/verifyWhatsAppMetaCredentials",

        async (
            {
                loginuser,
            }: {
                loginuser: string;
            },

            {
                rejectWithValue,
            }
        ) => {
            try {
                const encoded =
                    encodeURIComponent(
                        String(
                            loginuser ||
                            ""
                        ).trim()
                    );

                if (!encoded) {
                    return rejectWithValue({
                        message:
                            "Logged-in user identity is missing. Please sign in again.",

                        status: 400,
                    });
                }

                const res =
                    await professionalAxios.get(
                        `eTaxSolnMongoApiBackend/users/whatsapp/metaCredentials/get/${encoded}`
                    );

                const hasCredentials =
                    whatsAppMetaCredentialsHasData(
                        res?.data
                    );

                if (!hasCredentials) {
                    return rejectWithValue({
                        message:
                            "WhatsApp Meta credentials are not configured",

                        status:
                            res?.status,
                    });
                }

                return {
                    hasCredentials,

                    data:
                        res?.data?.data ||
                        res?.data,
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        "Failed to verify WhatsApp Meta credentials",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

/* ===================================================
   POS POSTING APIS
=================================================== */

export const getAllPosPostings =
    createAsyncThunk(
        "systemConfiguration/getAllPosPostings",

        async (
            {
                offset = 0,
                limit = 100,
            }: {
                offset?: number;
                limit?: number;
            } = {},

            {
                rejectWithValue,
            }
        ) => {
            try {
                const res =
                    await professionalAxios.get(
                        `${POS_POSTING_API}/getAll`,
                        {
                            params: {
                                offset,
                                limit,
                            },
                        }
                    );

                if (
                    res?.data
                        ?.success === false
                ) {
                    return rejectWithValue({
                        message:
                            res?.data
                                ?.message ||
                            "Failed to load POS posting configuration",

                        status:
                            res?.status,
                    });
                }

                const records =
                    extractPosPostingRecords(
                        res?.data
                    );

                return {
                    records,

                    pagination:
                        extractPagination(
                            res?.data,
                            {
                                offset,
                                limit,
                                totalDocs:
                                    records.length,
                            }
                        ),
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        err?.message ||
                        "Failed to load POS posting configuration",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

export const getPosPostingAccountOptions =
    createAsyncThunk(
        "systemConfiguration/getPosPostingAccountOptions",

        async (
            _,
            {
                rejectWithValue,
            }
        ) => {
            try {
                const requestAccounts =
                    (
                        accountType:
                            | "sale"
                            | "cash"
                            | "bank"
                    ) =>
                        professionalAxios.get(
                            ACCOUNT_MASTER_API,
                            {
                                params: {
                                    accountType,
                                    offset: 0,
                                    limit: 200,
                                },
                            }
                        );

                const [
                    salesRes,
                    cashRes,
                    bankRes,
                ] =
                    await Promise.all([
                        requestAccounts(
                            "sale"
                        ),
                        requestAccounts(
                            "cash"
                        ),
                        requestAccounts(
                            "bank"
                        ),
                    ]);

                const responses = [
                    salesRes,
                    cashRes,
                    bankRes,
                ];

                const failedResponse =
                    responses.find(
                        (
                            response
                        ) =>
                            response
                                ?.data
                                ?.success ===
                            false
                    );

                if (
                    failedResponse
                ) {
                    return rejectWithValue({
                        message:
                            failedResponse
                                ?.data
                                ?.message ||
                            "Failed to load POS account dropdowns",

                        status:
                            failedResponse
                                ?.status,
                    });
                }

                return {
                    sales:
                        extractAccountItems(
                            salesRes
                                ?.data
                        ),

                    cash:
                        extractAccountItems(
                            cashRes
                                ?.data
                        ),

                    bank:
                        extractAccountItems(
                            bankRes
                                ?.data
                        ),
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        err?.message ||
                        "Failed to load POS account dropdowns",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

export const savePosPosting =
    createAsyncThunk(
        "systemConfiguration/savePosPosting",

        async (
            {
                payload,
            }: {
                payload: any;
            },

            {
                rejectWithValue,
            }
        ) => {
            try {
                const res =
                    await professionalAxios.post(
                        `${POS_POSTING_API}/save`,
                        payload
                    );

                if (
                    res?.data
                        ?.success === false
                ) {
                    return rejectWithValue({
                        message:
                            res?.data
                                ?.message ||
                            "Failed to save POS posting",

                        status:
                            res?.status,
                    });
                }

                return {
                    message:
                        res?.data
                            ?.message ||
                        "POS posting saved successfully",

                    data:
                        res?.data
                            ?.data ||
                        res?.data,
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        err?.message ||
                        "Failed to save POS posting",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

export const updatePosPosting =
    createAsyncThunk(
        "systemConfiguration/updatePosPosting",

        async (
            {
                commonId,
                payload,
            }: {
                commonId: string;
                payload: any;
            },

            {
                rejectWithValue,
            }
        ) => {
            try {
                const safeCommonId =
                    encodeURIComponent(
                        String(
                            commonId ||
                            ""
                        ).trim()
                    );

                if (!safeCommonId) {
                    return rejectWithValue({
                        message:
                            "commonId is required to update POS posting",

                        status: 400,
                    });
                }

                const res =
                    await professionalAxios.put(
                        `${POS_POSTING_API}/update/${safeCommonId}`,
                        payload
                    );

                if (
                    res?.data
                        ?.success === false
                ) {
                    return rejectWithValue({
                        message:
                            res?.data
                                ?.message ||
                            "Failed to update POS posting",

                        status:
                            res?.status,
                    });
                }

                return {
                    message:
                        res?.data
                            ?.message ||
                        "POS posting updated successfully",

                    data:
                        res?.data
                            ?.data ||
                        res?.data,
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.response
                            ?.data
                            ?.message ||
                        err?.message ||
                        "Failed to update POS posting",

                    status:
                        err?.response
                            ?.status,
                });
            }
        }
    );

export const saveOrUpdatePosPostingAccount =
    createAsyncThunk(
        "systemConfiguration/saveOrUpdatePosPostingAccount",

        async (
            {
                key,
                account,
            }: {
                key:
                | "sales"
                | "cash"
                | "upi";

                account: any;
            },

            {
                dispatch,
                getState,
                rejectWithValue,
            }
        ) => {
            try {
                if (
                    !POS_POSTING_KEYS.includes(
                        key
                    )
                ) {
                    return rejectWithValue({
                        message:
                            "Invalid POS posting account type",

                        status: 400,
                    });
                }

                if (
                    !account
                        ?.accountCode
                ) {
                    return rejectWithValue({
                        message:
                            "Please select a valid account",

                        status: 400,
                    });
                }

                const rootState: any =
                    getState();

                const current =
                    rootState
                        ?.systemConfiguration
                        ?.posPosting ||
                    null;

                let result: any;

                let mode:
                    | "save"
                    | "update";

                if (!current) {
                    mode = "save";

                    result =
                        await dispatch(
                            savePosPosting(
                                {
                                    payload: {
                                        [key]:
                                            account,
                                    },
                                }
                            ) as any
                        ).unwrap();
                } else {
                    const commonId =
                        current
                            ?.commonId;

                    if (
                        !commonId
                    ) {
                        return rejectWithValue({
                            message:
                                "commonId missing in saved POS configuration",

                            status: 400,
                        });
                    }

                    mode = "update";

                    result =
                        await dispatch(
                            updatePosPosting(
                                {
                                    commonId,

                                    payload: {
                                        ...current,

                                        [key]:
                                            account,
                                    },
                                }
                            ) as any
                        ).unwrap();
                }

                const refreshed: any =
                    await dispatch(
                        getAllPosPostings(
                            {
                                offset: 0,
                                limit: 100,
                            }
                        ) as any
                    ).unwrap();

                return {
                    mode,
                    key,

                    records:
                        refreshed
                            ?.records ||
                        [],

                    message:
                        result?.message ||
                        (
                            mode ===
                                "save"
                                ? "POS posting saved successfully"
                                : "POS posting updated successfully"
                        ),
                };
            } catch (err: any) {
                return rejectWithValue({
                    message:
                        err?.message ||
                        err?.response
                            ?.data
                            ?.message ||
                        "Failed to save POS posting",

                    status:
                        err?.status ||
                        err?.response
                            ?.status,
                });
            }
        }
    );

/* ===================================================
   SLICE
=================================================== */

const systemConfigurationSlice =
    createSlice({
        name:
            "systemConfiguration",

        initialState: {
            configuration:
                getEmptySystemConfiguration(),

            configurations: [],

            pagination: {
                offset: 0,
                limit: 100000,
                totalDocs: 0,
                totalPages: 1,
                currentPage: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },

            loading: false,
            listLoading: false,
            detailLoading: false,
            saveLoading: false,
            updateLoading: false,
            whatsappVerifyLoading: false,

            whatsappVerified: false,
            whatsappMetaCredentials: null,

            posPosting: null,
            posPostingRecords: [],

            posPostingPagination: {
                offset: 0,
                limit: 100,
                totalDocs: 0,
            },

            posAccountOptions: {
                sales: [],
                cash: [],
                bank: [],
            },

            posPostingLoading: false,
            posAccountsLoading: false,
            posPostingSaveLoading: false,
            posPostingSavingKey: "",
            posPostingError: null,
            posPostingSuccessMessage: "",

            error: null,
            successMessage: "",
        },

        reducers: {
            clearSystemConfigurationState:
                (state) => {
                    state.error =
                        null;

                    state.successMessage =
                        "";

                    state.loading =
                        false;

                    state.listLoading =
                        false;

                    state.detailLoading =
                        false;

                    state.saveLoading =
                        false;

                    state.updateLoading =
                        false;

                    state.whatsappVerifyLoading =
                        false;

                    state.posPostingLoading =
                        false;

                    state.posAccountsLoading =
                        false;

                    state.posPostingSaveLoading =
                        false;

                    state.posPostingSavingKey =
                        "";

                    state.posPostingError =
                        null;

                    state.posPostingSuccessMessage =
                        "";
                },

            clearPosPostingError:
                (state) => {
                    state.posPostingError =
                        null;
                },

            clearPosPostingSuccess:
                (state) => {
                    state.posPostingSuccessMessage =
                        "";
                },

            resetPosPostingState:
                (state) => {
                    state.posPosting =
                        null;

                    state.posPostingRecords =
                        [];

                    state.posPostingPagination =
                    {
                        offset: 0,
                        limit: 100,
                        totalDocs: 0,
                    };

                    state.posAccountOptions =
                    {
                        sales: [],
                        cash: [],
                        bank: [],
                    };

                    state.posPostingLoading =
                        false;

                    state.posAccountsLoading =
                        false;

                    state.posPostingSaveLoading =
                        false;

                    state.posPostingSavingKey =
                        "";

                    state.posPostingError =
                        null;

                    state.posPostingSuccessMessage =
                        "";
                },

            clearSystemConfigurationError:
                (state) => {
                    state.error =
                        null;
                },

            clearSystemConfigurationSuccess:
                (state) => {
                    state.successMessage =
                        "";
                },

            resetSystemConfiguration:
                (state) => {
                    state.configuration =
                        getEmptySystemConfiguration();

                    state.error =
                        null;

                    state.successMessage =
                        "";
                },

            setSystemConfigurationLocal:
                (
                    state,
                    action: any
                ) => {
                    state.configuration =
                        action.payload;
                },

            updateSystemConfigurationLocalField:
                (
                    state,
                    action: any
                ) => {
                    const {
                        key,
                        value,
                    } =
                        action.payload ||
                        {};

                    state.configuration =
                    {
                        ...state.configuration,

                        [key]:
                            value,
                    };
                },

            updateInventoryConfigurationLocalField:
                (
                    state,
                    action: any
                ) => {
                    const {
                        key,
                        value,
                    } =
                        action.payload ||
                        {};

                    state.configuration.inventoryConfiguration =
                    {
                        ...state
                            .configuration
                            .inventoryConfiguration,

                        [key]:
                            value,
                    };
                },

            updateFinanceConfigurationLocalField:
                (
                    state,
                    action: any
                ) => {
                    const {
                        key,
                        value,
                    } =
                        action.payload ||
                        {};

                    state.configuration.financeConfiguration =
                    {
                        ...state
                            .configuration
                            .financeConfiguration,

                        [key]:
                            value,
                    };
                },

            updateSystemConfigurationNestedField:
                (
                    state,
                    action: any
                ) => {
                    const {
                        section,
                        key,
                        value,
                    } =
                        action.payload ||
                        {};

                    state.configuration.systemConfiguration =
                    {
                        ...state
                            .configuration
                            .systemConfiguration,

                        [section]:
                        {
                            // @ts-ignore
                            ...state
                                .configuration
                                .systemConfiguration?.[
                            section
                            ],

                            [key]:
                                value,
                        },
                    };
                },

            updateWhatsAppModuleLocalToggle:
                (
                    state,
                    action: any
                ) => {
                    const {
                        moduleKey,
                        enabled,
                    } =
                        action.payload ||
                        {};

                    const wa =
                        state
                            .configuration
                            .systemConfiguration
                            ?.whatsAppConfiguration ||
                        {};

                    const moduleConfiguration =
                    {
                        ...(wa.moduleConfiguration ||
                            {}),

                        [moduleKey]:
                        {
                            enabled:
                                !!enabled,
                        },
                    };

                    state.configuration.systemConfiguration.whatsAppConfiguration =
                    {
                        ...wa,

                        moduleConfiguration,
                    };
                },

            setWhatsAppModuleEnabledLocal:
                (
                    state,
                    action: any
                ) => {
                    const enabled =
                        !!action.payload;

                    const wa =
                        state
                            .configuration
                            .systemConfiguration
                            ?.whatsAppConfiguration ||
                        {};

                    state.configuration.systemConfiguration.whatsAppConfiguration =
                    {
                        ...wa,

                        enableWhatsAppModule:
                            enabled,
                    };
                },

            enableWhatsAppWithDefaultModulesLocal:
                (state) => {
                    const wa =
                        state
                            .configuration
                            .systemConfiguration
                            ?.whatsAppConfiguration ||
                        {};

                    const oldMods =
                        wa.moduleConfiguration ||
                        {};

                    const noneOn =
                        WHATSAPP_MODULE_ORDER.every(
                            (key) =>
                                !toBool(
                                    oldMods?.[
                                        key
                                    ]
                                        ?.enabled
                                )
                        );

                    const mergedMods: any =
                        createModuleConfigurationTemplate(
                            false
                        );

                    for (
                        const key of
                        WHATSAPP_MODULE_ORDER
                    ) {
                        mergedMods[
                            key
                        ] = {
                            enabled:
                                toBool(
                                    oldMods?.[
                                        key
                                    ]
                                        ?.enabled
                                ),
                        };
                    }

                    state.configuration.systemConfiguration.whatsAppConfiguration =
                    {
                        ...wa,

                        provider:
                            String(
                                wa?.provider ||
                                "META"
                            )
                                .trim()
                                .toUpperCase() ||
                            "META",

                        defaultLanguage:
                            String(
                                wa?.defaultLanguage ||
                                "en_US"
                            ).trim() ||
                            "en_US",

                        enableWhatsAppModule:
                            true,

                        moduleConfiguration:
                            noneOn
                                ? createModuleConfigurationTemplate(
                                    true
                                )
                                : mergedMods,
                    };
                },

            clearWhatsAppVerification:
                (state) => {
                    state.whatsappVerified =
                        false;

                    state.whatsappMetaCredentials =
                        null;

                    state.whatsappVerifyLoading =
                        false;
                },
        },

        extraReducers:
            (builder) => {
                builder
                    .addCase(
                        getAllSystemConfigurations.pending,
                        (
                            state
                        ) => {
                            state.listLoading =
                                true;

                            state.error =
                                null;
                        }
                    )

                    .addCase(
                        getAllSystemConfigurations.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            state.listLoading =
                                false;

                            const data =
                                action.payload;

                            state.configurations =
                                extractConfigurationRecords(
                                    data
                                );

                            state.pagination =
                                extractPagination(
                                    data,
                                    state.pagination
                                );
                        }
                    )

                    .addCase(
                        getAllSystemConfigurations.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.listLoading =
                                false;

                            state.error =
                                action.payload
                                    ?.message;

                            state.configurations =
                                [];
                        }
                    );

                builder
                    .addCase(
                        getLatestSystemConfiguration.pending,
                        (
                            state
                        ) => {
                            state.loading =
                                true;

                            state.error =
                                null;
                        }
                    )

                    .addCase(
                        getLatestSystemConfiguration.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            state.loading =
                                false;

                            state.configuration =
                                action.payload ||
                                getEmptySystemConfiguration();
                        }
                    )

                    .addCase(
                        getLatestSystemConfiguration.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.loading =
                                false;

                            state.error =
                                action.payload
                                    ?.message;

                            state.configuration =
                                getEmptySystemConfiguration();
                        }
                    );

                builder
                    .addCase(
                        getSystemConfigurationByCode.pending,
                        (
                            state
                        ) => {
                            state.detailLoading =
                                true;

                            state.error =
                                null;
                        }
                    )

                    .addCase(
                        getSystemConfigurationByCode.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            state.detailLoading =
                                false;

                            state.configuration =
                                action.payload ||
                                getEmptySystemConfiguration();
                        }
                    )

                    .addCase(
                        getSystemConfigurationByCode.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.detailLoading =
                                false;

                            state.error =
                                action.payload
                                    ?.message;

                            state.configuration =
                                getEmptySystemConfiguration();
                        }
                    );

                builder
                    .addCase(
                        saveSystemConfiguration.pending,
                        (
                            state
                        ) => {
                            state.saveLoading =
                                true;

                            state.error =
                                null;

                            state.successMessage =
                                "";
                        }
                    )

                    .addCase(
                        saveSystemConfiguration.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            state.saveLoading =
                                false;

                            state.successMessage =
                                action.payload
                                    ?.message ||
                                "Configuration saved successfully";
                        }
                    )

                    .addCase(
                        saveSystemConfiguration.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.saveLoading =
                                false;

                            state.error =
                                action.payload
                                    ?.message;
                        }
                    );

                builder
                    .addCase(
                        updateSystemConfiguration.pending,
                        (
                            state
                        ) => {
                            state.updateLoading =
                                true;

                            state.error =
                                null;

                            state.successMessage =
                                "";
                        }
                    )

                    .addCase(
                        updateSystemConfiguration.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            state.updateLoading =
                                false;

                            state.successMessage =
                                action.payload
                                    ?.message ||
                                "Configuration updated successfully";
                        }
                    )

                    .addCase(
                        updateSystemConfiguration.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.updateLoading =
                                false;

                            state.error =
                                action.payload
                                    ?.message;
                        }
                    );

                builder
                    .addCase(
                        saveOrUpdateSystemConfiguration.pending,
                        (
                            state
                        ) => {
                            state.saveLoading =
                                true;

                            state.error =
                                null;

                            state.successMessage =
                                "";
                        }
                    )

                    .addCase(
                        saveOrUpdateSystemConfiguration.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            state.saveLoading =
                                false;

                            state.configuration =
                                action.payload
                                    ?.configuration ||
                                state.configuration ||
                                getEmptySystemConfiguration();

                            state.successMessage =
                                action.payload
                                    ?.message ||
                                "Configuration saved successfully";
                        }
                    )

                    .addCase(
                        saveOrUpdateSystemConfiguration.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.saveLoading =
                                false;

                            state.error =
                                action.payload
                                    ?.message;
                        }
                    );

                builder
                    .addCase(
                        verifyWhatsAppMetaCredentials.pending,
                        (
                            state
                        ) => {
                            state.whatsappVerifyLoading =
                                true;

                            state.whatsappVerified =
                                false;

                            state.whatsappMetaCredentials =
                                null;

                            state.error =
                                null;
                        }
                    )

                    .addCase(
                        verifyWhatsAppMetaCredentials.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            state.whatsappVerifyLoading =
                                false;

                            state.whatsappVerified =
                                true;

                            state.whatsappMetaCredentials =
                                action.payload
                                    ?.data ||
                                null;
                        }
                    )

                    .addCase(
                        verifyWhatsAppMetaCredentials.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.whatsappVerifyLoading =
                                false;

                            state.whatsappVerified =
                                false;

                            state.whatsappMetaCredentials =
                                null;

                            state.error =
                                action.payload
                                    ?.message;
                        }
                    );

                builder
                    .addCase(
                        getAllPosPostings.pending,
                        (
                            state
                        ) => {
                            state.posPostingLoading =
                                true;

                            state.posPostingError =
                                null;
                        }
                    )

                    .addCase(
                        getAllPosPostings.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            const records =
                                action.payload
                                    ?.records ||
                                [];

                            state.posPostingLoading =
                                false;

                            state.posPostingRecords =
                                records;

                            state.posPosting =
                                records[0] ||
                                null;

                            state.posPostingPagination =
                                action.payload
                                    ?.pagination ||
                                state.posPostingPagination;
                        }
                    )

                    .addCase(
                        getAllPosPostings.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.posPostingLoading =
                                false;

                            state.posPosting =
                                null;

                            state.posPostingRecords =
                                [];

                            state.posPostingError =
                                action.payload
                                    ?.message;
                        }
                    );

                builder
                    .addCase(
                        getPosPostingAccountOptions.pending,
                        (
                            state
                        ) => {
                            state.posAccountsLoading =
                                true;

                            state.posPostingError =
                                null;
                        }
                    )

                    .addCase(
                        getPosPostingAccountOptions.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            state.posAccountsLoading =
                                false;

                            state.posAccountOptions =
                            {
                                sales:
                                    action.payload
                                        ?.sales ||
                                    [],

                                cash:
                                    action.payload
                                        ?.cash ||
                                    [],

                                bank:
                                    action.payload
                                        ?.bank ||
                                    [],
                            };
                        }
                    )

                    .addCase(
                        getPosPostingAccountOptions.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.posAccountsLoading =
                                false;

                            state.posAccountOptions =
                            {
                                sales: [],
                                cash: [],
                                bank: [],
                            };

                            state.posPostingError =
                                action.payload
                                    ?.message;
                        }
                    );

                builder
                    .addCase(
                        saveOrUpdatePosPostingAccount.pending,
                        (
                            state,
                            action: any
                        ) => {
                            state.posPostingSaveLoading =
                                true;

                            state.posPostingSavingKey =
                                action.meta
                                    ?.arg
                                    ?.key ||
                                "";

                            state.posPostingError =
                                null;

                            state.posPostingSuccessMessage =
                                "";
                        }
                    )

                    .addCase(
                        saveOrUpdatePosPostingAccount.fulfilled,
                        (
                            state,
                            action: any
                        ) => {
                            const records =
                                action.payload
                                    ?.records ||
                                [];

                            state.posPostingSaveLoading =
                                false;

                            state.posPostingSavingKey =
                                "";

                            state.posPostingRecords =
                                records;

                            state.posPosting =
                                records[0] ||
                                null;

                            state.posPostingSuccessMessage =
                                action.payload
                                    ?.message ||
                                "POS posting saved successfully";
                        }
                    )

                    .addCase(
                        saveOrUpdatePosPostingAccount.rejected,
                        (
                            state,
                            action: any
                        ) => {
                            state.posPostingSaveLoading =
                                false;

                            state.posPostingSavingKey =
                                "";

                            state.posPostingError =
                                action.payload
                                    ?.message;
                        }
                    );
            },
    });

export const {
    clearSystemConfigurationState,
    clearSystemConfigurationError,
    clearSystemConfigurationSuccess,
    resetSystemConfiguration,
    setSystemConfigurationLocal,
    updateSystemConfigurationLocalField,
    updateInventoryConfigurationLocalField,
    updateFinanceConfigurationLocalField,
    updateSystemConfigurationNestedField,
    updateWhatsAppModuleLocalToggle,
    setWhatsAppModuleEnabledLocal,
    enableWhatsAppWithDefaultModulesLocal,
    clearWhatsAppVerification,
    clearPosPostingError,
    clearPosPostingSuccess,
    resetPosPostingState,
} = systemConfigurationSlice.actions;

export default systemConfigurationSlice.reducer;