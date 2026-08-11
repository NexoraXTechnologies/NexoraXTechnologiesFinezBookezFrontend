import professionalAxios from "../../../services/professionalAxios";

const BOOKEZ_API_PREFIX = "eTaxSolnMongoApiBackend";
const CUSTOM_MASTER_MODULE_API = `${BOOKEZ_API_PREFIX}/users/customMaster/module`;
const TRANSACTION_SCHEMA_API = `${BOOKEZ_API_PREFIX}/users/bookez/transactionSchema`;

export const INVENTORY_TAG_LEVEL = {
    WAREHOUSE: "WAREHOUSE",
    WAREHOUSE_LOCATION: "WAREHOUSE_LOCATION",
    WAREHOUSE_LOCATION_BIN: "WAREHOUSE_LOCATION_BIN",
    WAREHOUSE_LOCATION_BIN_BATCH: "WAREHOUSE_LOCATION_BIN_BATCH",
    FULL_TRACKING: "FULL_TRACKING_WITH_WAREHOUSE_LOCATION_BATCH_BIN_SERIAL",
} as const;

type InventoryMasterDefinition = {
    key: string;
    fieldKey: string;
    moduleName: string;
    description: string;
};

type TransactionSection = "header" | "body";

type DesiredTransactionField = {
    key: string;
    section: TransactionSection;
    field: any;
};

const INVENTORY_TRANSACTION_MODULES = [
    "grn",
    "purchaseReturn",
    "salesInvoice",
    "salesReturn",
    "openingStock",
];

const INVENTORY_MASTERS: Record<
    string,
    InventoryMasterDefinition
> = {
    warehouse: {
        key: "warehouse",
        fieldKey: "WarehouseMaster",
        moduleName: "Warehouse",
        description: "Warehouse inventory tracking for BookEZ.",
    },

    location: {
        key: "location",
        fieldKey: "LocationMaster",
        moduleName: "Location",
        description: "Location inventory tracking for BookEZ.",
    },

    bin: {
        key: "bin",
        fieldKey: "BinMaster",
        moduleName: "Bin",
        description: "Bin inventory tracking for BookEZ.",
    },

    batch: {
        key: "batch",
        fieldKey: "BatchMaster",
        moduleName: "Batch",
        description: "Batch inventory tracking for BookEZ.",
    },
};

const FULL_TRACKING_DATE_FIELDS = [
    {
        key: "manufacturingDate",
        label: "Manufacturing Date",
        type: "date",
        isRequired: false,
        isSearchable: false,
        isFilterable: true,
        isHidden: false,
    },
    {
        key: "expiryDate",
        label: "Expiry Date",
        type: "date",
        isRequired: false,
        isSearchable: false,
        isFilterable: true,
        isHidden: false,
    },
];

const INVENTORY_TRANSACTION_FIELD_KEYS = [
    "WarehouseMaster",
    "LocationMaster",
    "BinMaster",
    "BatchMaster",
    "manufacturingDate",
    "expiryDate",
];

const normalizeText = (value: any) =>
    String(value || "").trim();

const normalizeMasterName = (value: any) =>
    normalizeText(value).toLowerCase();

const normalizeMasterKey = (value: any) =>
    normalizeText(value).toLowerCase();

const normalizeFieldKey = (value: any) =>
    normalizeText(value).toLowerCase();

const normalizeStatus = (value: any) =>
    normalizeText(value).toLowerCase();

const isTrue = (value: any) =>
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1";

const extractModuleItems = (apiData: any): any[] => {
    const roots = [
        apiData,
        apiData?.data,
        apiData?.result,
        apiData?.payload,
        apiData?.data?.data,
    ];

    for (const root of roots) {
        if (Array.isArray(root)) return root;
        if (Array.isArray(root?.items)) return root.items;
        if (Array.isArray(root?.records)) return root.records;
        if (Array.isArray(root?.modules)) return root.modules;
    }

    return [];
};

const extractCreatedModule = (apiData: any) => {
    return (
        apiData?.data?.module ||
        apiData?.data?.masterConfiguration ||
        apiData?.data ||
        apiData?.module ||
        apiData?.masterConfiguration ||
        null
    );
};

const extractTransactionSchema = (apiData: any) => {
    const roots = [
        apiData,
        apiData?.data,
        apiData?.result,
        apiData?.payload,
        apiData?.data?.data,
    ];

    for (const root of roots) {
        if (
            root &&
            typeof root === "object" &&
            (
                Array.isArray(root?.header) ||
                Array.isArray(root?.body) ||
                Array.isArray(root?.footer)
            )
        ) {
            return {
                header: Array.isArray(root?.header)
                    ? root.header
                    : [],
                body: Array.isArray(root?.body)
                    ? root.body
                    : [],
                footer: Array.isArray(root?.footer)
                    ? root.footer
                    : [],
            };
        }
    }

    return {
        header: [],
        body: [],
        footer: [],
    };
};

const getAllCustomMasterModules = async () => {
    const response = await professionalAxios.get(
        `${CUSTOM_MASTER_MODULE_API}/getAll`,
        {
            params: {
                offset: 0,
                limit: 500,
                search: "",
                status: "",
            },
        }
    );

    if (response?.data?.success === false) {
        throw new Error(
            response?.data?.message ||
            "Failed to load custom master modules."
        );
    }

    return extractModuleItems(
        response?.data
    );
};

const findModule = (
    modules: any[],
    definition: InventoryMasterDefinition
) => {
    const normalizedName =
        normalizeMasterName(
            definition.moduleName
        );

    const normalizedKey =
        normalizeMasterKey(
            definition.key
        );

    return modules.find(
        (item) =>
            normalizeMasterKey(
                item?.key
            ) === normalizedKey ||
            normalizeMasterName(
                item?.moduleName
            ) === normalizedName
    );
};

const createInventoryCustomMaster = async (
    definition: InventoryMasterDefinition
) => {
    const response = await professionalAxios.post(
        `${CUSTOM_MASTER_MODULE_API}/create`,
        {
            moduleName: definition.moduleName,
            description: definition.description,
            status: "active",
            key: definition.key,
        }
    );

    if (response?.data?.success === false) {
        throw new Error(
            response?.data?.message ||
            `Failed to create ${definition.moduleName}.`
        );
    }

    return extractCreatedModule(
        response?.data
    );
};

const updateInventoryCustomMasterStatus = async (
    master: any,
    definition: InventoryMasterDefinition,
    status: "active" | "inactive"
) => {
    const moduleCode =
        normalizeText(
            master?.moduleCode
        );

    if (!moduleCode) {
        throw new Error(
            `${definition.moduleName} moduleCode is missing.`
        );
    }

    const response = await professionalAxios.put(
        `${CUSTOM_MASTER_MODULE_API}/update/${moduleCode}`,
        {
            moduleName:
                normalizeText(
                    master?.moduleName
                ) ||
                definition.moduleName,

            description:
                normalizeText(
                    master?.description
                ) ||
                definition.description,

            status,
        }
    );

    if (response?.data?.success === false) {
        throw new Error(
            response?.data?.message ||
            `Failed to update ${definition.moduleName} status.`
        );
    }

    const updatedMaster =
        extractCreatedModule(
            response?.data
        );

    return (
        updatedMaster || {
            ...master,
            moduleCode,
            moduleName:
                master?.moduleName ||
                definition.moduleName,
            description:
                master?.description ||
                definition.description,
            status,
        }
    );
};

const getTransactionSchema = async (
    module: string
) => {
    try {
        const response = await professionalAxios.get(
            `${TRANSACTION_SCHEMA_API}/getAll`,
            {
                params: {
                    module,
                },
            }
        );

        if (response?.data?.success === false) {
            return {
                header: [],
                body: [],
                footer: [],
            };
        }

        return extractTransactionSchema(
            response?.data
        );
    } catch (error: any) {
        if (
            error?.response?.status === 404
        ) {
            return {
                header: [],
                body: [],
                footer: [],
            };
        }

        throw error;
    }
};

const addTransactionSchemaFields = async (
    module: string,
    section: TransactionSection,
    fields: any[]
) => {
    if (!fields.length) {
        return [];
    }

    const response = await professionalAxios.post(
        `${TRANSACTION_SCHEMA_API}/addField`,
        {
            module,
            section,
            fields,
        }
    );

    if (response?.data?.success === false) {
        throw new Error(
            response?.data?.message ||
            `Failed to add fields in ${module}.`
        );
    }

    return fields;
};

const updateTransactionSchemaField = async (
    module: string,
    section: TransactionSection,
    key: string,
    updates: any
) => {
    const response = await professionalAxios.put(
        `${TRANSACTION_SCHEMA_API}/updateField`,
        {
            module,
            section,
            key,
            updates,
        }
    );

    if (response?.data?.success === false) {
        throw new Error(
            response?.data?.message ||
            `Failed to update ${key} in ${module}.`
        );
    }

    return response?.data;
};

const findFieldInSection = (
    schema: any,
    section: TransactionSection,
    key: string
) => {
    const normalizedKey =
        normalizeFieldKey(
            key
        );

    return (
        schema?.[section] ||
        []
    ).find(
        (field: any) =>
            normalizeFieldKey(
                field?.key
            ) === normalizedKey
    );
};

const resolveTransactionSection = (
    inventoryTagLevel: string,
    whereToAddInventory: string
): TransactionSection => {
    const level =
        normalizeText(
            inventoryTagLevel
        ).toUpperCase();

    const whereToAdd =
        normalizeText(
            whereToAddInventory
        ).toLowerCase();

    if (
        level ===
        INVENTORY_TAG_LEVEL.WAREHOUSE ||
        level ===
        INVENTORY_TAG_LEVEL.WAREHOUSE_LOCATION
    ) {
        if (
            whereToAdd === "header" ||
            whereToAdd === "body"
        ) {
            return whereToAdd;
        }

        return "body";
    }

    return "body";
};

const buildTransactionCustomMasterField = (
    definition: InventoryMasterDefinition,
    master: any
) => {
    return {
        key: definition.fieldKey,
        label: definition.moduleName,
        type: "custommaster",
        customMasterCode: String(
            master?.moduleCode ||
            ""
        ).trim(),
        customMasterName:
            definition.moduleName,
        isRequired: false,
        isSearchable: true,
        isFilterable: true,
        isHidden: false,
    };
};

const buildDesiredTransactionFields = (
    inventoryTagLevel: string,
    whereToAddInventory: string,
    resolvedMasters: {
        definition: InventoryMasterDefinition;
        master: any;
    }[]
): DesiredTransactionField[] => {
    const level =
        normalizeText(
            inventoryTagLevel
        ).toUpperCase();

    const inventorySection =
        resolveTransactionSection(
            level,
            whereToAddInventory
        );

    const desiredFields:
        DesiredTransactionField[] =
        resolvedMasters.map(
            ({
                definition,
                master,
            }) => ({
                key:
                    definition.fieldKey,

                section:
                    inventorySection,

                field:
                    buildTransactionCustomMasterField(
                        definition,
                        master
                    ),
            })
        );

    if (
        level ===
        INVENTORY_TAG_LEVEL.FULL_TRACKING
    ) {
        FULL_TRACKING_DATE_FIELDS.forEach(
            (field) => {
                desiredFields.push({
                    key:
                        field.key,

                    section:
                        "body",

                    field: {
                        ...field,
                        isHidden: false,
                    },
                });
            }
        );
    }

    return desiredFields;
};

const hideUnusedInventoryFields = async (
    module: string,
    schema: any,
    desiredFields: DesiredTransactionField[]
) => {
    const hiddenFields: any[] =
        [];

    const desiredFieldMap =
        new Map(
            desiredFields.map(
                (item) => [
                    normalizeFieldKey(
                        item.key
                    ),
                    item,
                ]
            )
        );

    for (
        const section of
        ["header", "body"] as TransactionSection[]
    ) {
        const sectionFields =
            schema?.[section] ||
            [];

        for (
            const field of
            sectionFields
        ) {
            const fieldKey =
                normalizeFieldKey(
                    field?.key
                );

            const isInventoryField =
                INVENTORY_TRANSACTION_FIELD_KEYS.some(
                    (key) =>
                        normalizeFieldKey(
                            key
                        ) ===
                        fieldKey
                );

            if (
                !isInventoryField
            ) {
                continue;
            }

            if (
                isTrue(
                    field?.isDefault
                )
            ) {
                continue;
            }

            const desiredField =
                desiredFieldMap.get(
                    fieldKey
                );

            const shouldBeVisible =
                desiredField &&
                desiredField.section ===
                section;

            if (
                shouldBeVisible
            ) {
                continue;
            }

            if (
                isTrue(
                    field?.isHidden
                )
            ) {
                continue;
            }

            await updateTransactionSchemaField(
                module,
                section,
                field.key,
                {
                    isHidden: true,
                }
            );

            hiddenFields.push({
                module,
                section,
                key:
                    field.key,
            });
        }
    }

    return hiddenFields;
};

const activateDesiredInventoryFields = async (
    module: string,
    schema: any,
    desiredFields: DesiredTransactionField[]
) => {
    const addedFields: any[] =
        [];

    const activatedFields: any[] =
        [];

    const headerFields: any[] =
        [];

    const bodyFields: any[] =
        [];

    for (
        const desiredField of
        desiredFields
    ) {
        const existingField =
            findFieldInSection(
                schema,
                desiredField.section,
                desiredField.key
            );

        if (
            existingField
        ) {
            if (
                isTrue(
                    existingField?.isDefault
                )
            ) {
                continue;
            }

            const updates: any = {
                isHidden: false,
            };

            if (
                String(
                    desiredField.field
                        ?.type ||
                    ""
                )
                    .trim()
                    .toLowerCase() ===
                "custommaster"
            ) {
                updates.type =
                    "custommaster";

                updates.label =
                    desiredField.field
                        .label;

                updates.customMasterCode =
                    desiredField.field
                        .customMasterCode;

                updates.customMasterName =
                    desiredField.field
                        .customMasterName;

                updates.isRequired =
                    false;

                updates.isSearchable =
                    true;

                updates.isFilterable =
                    true;
            }

            if (
                String(
                    desiredField.field
                        ?.type ||
                    ""
                )
                    .trim()
                    .toLowerCase() ===
                "date"
            ) {
                updates.type =
                    "date";

                updates.label =
                    desiredField.field
                        .label;

                updates.isRequired =
                    false;

                updates.isSearchable =
                    false;

                updates.isFilterable =
                    true;
            }

            await updateTransactionSchemaField(
                module,
                desiredField.section,
                existingField.key,
                updates
            );

            activatedFields.push({
                module,
                section:
                    desiredField.section,
                key:
                    existingField.key,
            });

            continue;
        }

        if (
            desiredField.section ===
            "header"
        ) {
            headerFields.push({
                ...desiredField.field,
                isHidden: false,
            });
        } else {
            bodyFields.push({
                ...desiredField.field,
                isHidden: false,
            });
        }
    }

    if (
        headerFields.length
    ) {
        await addTransactionSchemaFields(
            module,
            "header",
            headerFields
        );

        addedFields.push(
            ...headerFields.map(
                (field) => ({
                    module,
                    section:
                        "header",
                    key:
                        field.key,
                })
            )
        );
    }

    if (
        bodyFields.length
    ) {
        await addTransactionSchemaFields(
            module,
            "body",
            bodyFields
        );

        addedFields.push(
            ...bodyFields.map(
                (field) => ({
                    module,
                    section:
                        "body",
                    key:
                        field.key,
                })
            )
        );
    }

    return {
        addedFields,
        activatedFields,
    };
};

const syncInventoryMastersToTransactionSchemas =
    async (
        inventoryTagLevel: string,
        whereToAddInventory: string,
        resolvedMasters: {
            definition: InventoryMasterDefinition;
            master: any;
        }[]
    ) => {
        const desiredFields =
            buildDesiredTransactionFields(
                inventoryTagLevel,
                whereToAddInventory,
                resolvedMasters
            );

        const addedTransactionFields:
            any[] = [];

        const activatedTransactionFields:
            any[] = [];

        const hiddenTransactionFields:
            any[] = [];

        for (
            const transactionModule of
            INVENTORY_TRANSACTION_MODULES
        ) {
            const schema =
                await getTransactionSchema(
                    transactionModule
                );

            const hiddenFields =
                await hideUnusedInventoryFields(
                    transactionModule,
                    schema,
                    desiredFields
                );

            hiddenTransactionFields.push(
                ...hiddenFields
            );

            const activationResult =
                await activateDesiredInventoryFields(
                    transactionModule,
                    schema,
                    desiredFields
                );

            addedTransactionFields.push(
                ...activationResult
                    .addedFields
            );

            activatedTransactionFields.push(
                ...activationResult
                    .activatedFields
            );
        }

        return {
            desiredFields,
            addedTransactionFields,
            activatedTransactionFields,
            hiddenTransactionFields,
        };
    };

export const resolveInventoryTagLevel = (
    inventoryConfiguration: any
) => {
    return normalizeText(
        inventoryConfiguration
            ?.inventoryTagLevel
    ).toUpperCase();
};

export const getInventoryMasterDefinitions =
    (
        inventoryTagLevel: string
    ): InventoryMasterDefinition[] => {
        const level =
            normalizeText(
                inventoryTagLevel
            ).toUpperCase();

        if (
            level ===
            INVENTORY_TAG_LEVEL.WAREHOUSE
        ) {
            return [
                INVENTORY_MASTERS.warehouse,
            ];
        }

        if (
            level ===
            INVENTORY_TAG_LEVEL.WAREHOUSE_LOCATION
        ) {
            return [
                INVENTORY_MASTERS.warehouse,
                INVENTORY_MASTERS.location,
            ];
        }

        if (
            level ===
            INVENTORY_TAG_LEVEL.WAREHOUSE_LOCATION_BIN
        ) {
            return [
                INVENTORY_MASTERS.warehouse,
                INVENTORY_MASTERS.location,
                INVENTORY_MASTERS.bin,
            ];
        }

        if (
            level ===
            INVENTORY_TAG_LEVEL.WAREHOUSE_LOCATION_BIN_BATCH
        ) {
            return [
                INVENTORY_MASTERS.warehouse,
                INVENTORY_MASTERS.location,
                INVENTORY_MASTERS.bin,
                INVENTORY_MASTERS.batch,
            ];
        }

        if (
            level ===
            INVENTORY_TAG_LEVEL.FULL_TRACKING
        ) {
            return [
                INVENTORY_MASTERS.warehouse,
                INVENTORY_MASTERS.location,
                INVENTORY_MASTERS.bin,
                INVENTORY_MASTERS.batch,
            ];
        }

        return [];
    };

const syncInventoryMasterStatuses = async (
    modules: any[],
    desiredDefinitions: InventoryMasterDefinition[]
) => {
    const desiredMasterKeys =
        new Set(
            desiredDefinitions.map(
                (definition) =>
                    normalizeMasterKey(
                        definition.key
                    )
            )
        );

    const activatedMasters: any[] =
        [];

    const inactivatedMasters: any[] =
        [];

    for (
        const definition of
        Object.values(
            INVENTORY_MASTERS
        )
    ) {
        const existingMaster =
            findModule(
                modules,
                definition
            );

        if (
            !existingMaster
        ) {
            continue;
        }

        const shouldBeActive =
            desiredMasterKeys.has(
                normalizeMasterKey(
                    definition.key
                )
            );

        const currentStatus =
            normalizeStatus(
                existingMaster?.status
            ) || "active";

        if (
            shouldBeActive &&
            currentStatus !== "active"
        ) {
            const updatedMaster =
                await updateInventoryCustomMasterStatus(
                    existingMaster,
                    definition,
                    "active"
                );

            Object.assign(
                existingMaster,
                updatedMaster,
                {
                    status:
                        "active",
                }
            );

            activatedMasters.push({
                moduleName:
                    definition.moduleName,
                moduleCode:
                    existingMaster
                        ?.moduleCode,
                key:
                    definition.key,
                status:
                    "active",
            });

            continue;
        }

        if (
            !shouldBeActive &&
            currentStatus !== "inactive"
        ) {
            const updatedMaster =
                await updateInventoryCustomMasterStatus(
                    existingMaster,
                    definition,
                    "inactive"
                );

            Object.assign(
                existingMaster,
                updatedMaster,
                {
                    status:
                        "inactive",
                }
            );

            inactivatedMasters.push({
                moduleName:
                    definition.moduleName,
                moduleCode:
                    existingMaster
                        ?.moduleCode,
                key:
                    definition.key,
                status:
                    "inactive",
            });
        }
    }

    return {
        activatedMasters,
        inactivatedMasters,
    };
};

export const syncInventoryTagLevelMasters =
    async (
        inventoryTagLevel: string,
        whereToAddInventory: string = ""
    ) => {
        const level =
            normalizeText(
                inventoryTagLevel
            ).toUpperCase();

        const definitions =
            getInventoryMasterDefinitions(
                level
            );

        const modules =
            await getAllCustomMasterModules();

        const createdMasters:
            any[] = [];

        const existingMasters:
            any[] = [];

        const resolvedMasters: {
            definition: InventoryMasterDefinition;
            master: any;
        }[] = [];

        /*
         * First create or reactivate the masters
         * required by the selected Inventory Tag Level.
         */
        for (
            const definition of
            definitions
        ) {
            let inventoryMaster =
                findModule(
                    modules,
                    definition
                );

            let created =
                false;

            if (
                !inventoryMaster
            ) {
                inventoryMaster =
                    await createInventoryCustomMaster(
                        definition
                    );

                created =
                    true;
            }

            if (
                !inventoryMaster
                    ?.moduleCode
            ) {
                const refreshedModules =
                    await getAllCustomMasterModules();

                inventoryMaster =
                    findModule(
                        refreshedModules,
                        definition
                    );
            }

            if (
                !inventoryMaster
                    ?.moduleCode
            ) {
                throw new Error(
                    `${definition.moduleName} was created but moduleCode could not be resolved.`
                );
            }

            if (
                !created &&
                normalizeStatus(
                    inventoryMaster?.status
                ) === "inactive"
            ) {
                const updatedMaster =
                    await updateInventoryCustomMasterStatus(
                        inventoryMaster,
                        definition,
                        "active"
                    );

                inventoryMaster = {
                    ...inventoryMaster,
                    ...updatedMaster,
                    status: "active",
                };
            }

            const moduleCode =
                String(
                    inventoryMaster
                        .moduleCode
                ).trim();

            const normalizedMaster = {
                ...inventoryMaster,
                moduleCode,
                moduleName:
                    inventoryMaster
                        ?.moduleName ||
                    definition
                        .moduleName,
                description:
                    inventoryMaster
                        ?.description ||
                    definition
                        .description,
                key:
                    inventoryMaster
                        ?.key ||
                    definition.key,
                status:
                    "active",
            };

            resolvedMasters.push({
                definition,
                master:
                    normalizedMaster,
            });

            const moduleIndex =
                modules.findIndex(
                    (item) =>
                        normalizeText(
                            item?.moduleCode
                        ) ===
                        moduleCode
                );

            if (
                moduleIndex >= 0
            ) {
                modules[
                    moduleIndex
                ] =
                    normalizedMaster;
            } else {
                modules.push(
                    normalizedMaster
                );
            }

            if (
                created
            ) {
                createdMasters.push({
                    moduleName:
                        definition
                            .moduleName,
                    moduleCode,
                    key:
                        definition.key,
                    status:
                        "active",
                });
            } else {
                existingMasters.push({
                    moduleName:
                        definition
                            .moduleName,
                    moduleCode,
                    key:
                        definition.key,
                    status:
                        "active",
                });
            }
        }

        /*
         * Next make unused inventory masters inactive.
         *
         * Example:
         *
         * FULL_TRACKING -> WAREHOUSE
         *
         * Warehouse Master = active
         * Location Master  = inactive
         * Bin Master       = inactive
         * Batch Master     = inactive
         */
        const masterStatusSync =
            await syncInventoryMasterStatuses(
                modules,
                definitions
            );

        /*
         * Finally update Transaction Configuration.
         *
         * Required fields    -> isHidden false
         * Not required fields -> isHidden true
         */
        const transactionSchemaSync =
            await syncInventoryMastersToTransactionSchemas(
                level,
                whereToAddInventory,
                resolvedMasters
            );

        return {
            skipped:
                definitions.length === 0,

            inventoryTagLevel:
                level,

            whereToAddInventory:
                normalizeText(
                    whereToAddInventory
                ).toLowerCase(),

            requiredMasters:
                definitions.map(
                    (item) =>
                        item.moduleName
                ),

            createdMasters,

            existingMasters,

            activatedMasters:
                masterStatusSync
                    .activatedMasters,

            inactivatedMasters:
                masterStatusSync
                    .inactivatedMasters,

            addedTransactionFields:
                transactionSchemaSync
                    .addedTransactionFields,

            activatedTransactionFields:
                transactionSchemaSync
                    .activatedTransactionFields,

            hiddenTransactionFields:
                transactionSchemaSync
                    .hiddenTransactionFields,
        };
    };