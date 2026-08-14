import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    useDispatch,
    useSelector,
} from "react-redux";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";

import {
    createUnit,
    getAllUnitMasterSchema,
    getAllUnits,
    updateUnit,
} from "../../../redux/slices/professionalSlice/unitMasterSlice";

import {
    SelectInput,
    TextInput,
    ToggleInput,
} from "../../../components/inputs";

import Modal from "../../../components/modal";
import professionalAxios from "../../../services/professionalAxios";

type UnitMasterModalProps = {
    show: boolean;
    setShow: (value: boolean) => void;
    editingUnit?: any;
    onSaved?: (savedUnit: any) => void | Promise<void>;
    title?: string;
    initialSearchValue?: string;
};

type ReferenceOption = {
    label: string;
    value: string;
    raw: any;
};

const MASTER_REFERENCE_FIELD_TYPES = new Set([
    "accountmaster",
    "productmaster",
    "unitmaster",
    "employeemaster",
    "customemployeemaster",
    "teamemployeemaster",
    "custommaster",
]);

const DYNAMIC_MASTER_FIELD_TYPES = new Set([
    "accountmaster",
    "productmaster",
    "unitmaster",
    "employeemaster",
    "customemployeemaster",
    "teamemployeemaster",
]);

const EMPLOYEE_REFERENCE_FIELD_TYPES = new Set([
    "employeemaster",
    "customemployeemaster",
    "teamemployeemaster",
]);

const getDataSource = (field: any) => {
    const source = field?.dataSource;

    if (
        source &&
        typeof source === "object"
    ) {
        return source;
    }

    if (
        typeof source === "string"
    ) {
        const trimmed =
            source.trim();

        if (!trimmed) {
            return {};
        }

        try {
            const parsed =
                JSON.parse(
                    trimmed
                );

            return parsed &&
                typeof parsed === "object"
                ? parsed
                : {
                    api: trimmed,
                };
        } catch {
            return {
                api: trimmed,
            };
        }
    }

    return {};
};

const getFieldType = (
    field: any
) => {
    const dataSource =
        getDataSource(
            field
        );

    return String(
        field?.type ||
        dataSource?.type ||
        ""
    )
        .trim()
        .toLowerCase();
};

const isMasterReferenceField = (
    field: any
) =>
    MASTER_REFERENCE_FIELD_TYPES.has(
        getFieldType(
            field
        )
    );

const getTextValue = (
    value: any
) => {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return String(
            value
        );
    }

    if (
        typeof value === "object"
    ) {
        return String(
            value.en ||
            value.name ||
            value.label ||
            value.productName ||
            value.unitName ||
            value.accountName ||
            value.code ||
            Object.values(
                value
            ).find(
                (
                    itemValue
                ) =>
                    typeof itemValue ===
                    "string"
            ) ||
            ""
        );
    }

    return "";
};

const getBooleanValue = (
    value: any
) => {
    if (
        typeof value === "boolean"
    ) {
        return value;
    }

    if (
        typeof value === "number"
    ) {
        return value === 1;
    }

    const normalizedValue =
        String(
            value ?? ""
        )
            .trim()
            .toLowerCase();

    return [
        "true",
        "1",
        "yes",
        "active",
    ].includes(
        normalizedValue
    );
};

/* =====================================================
   SCHEMA isDefault FALSE

   Supports:
   false
   "false"
   0
   "0"
===================================================== */

const isSchemaDefaultFalse = (
    field: any
) => {
    const value =
        field?.isDefault;

    if (
        value === false ||
        value === 0 ||
        value === "0"
    ) {
        return true;
    }

    return (
        typeof value ===
        "string" &&
        value
            .trim()
            .toLowerCase() ===
        "false"
    );
};

/* =====================================================
   SCHEMA isDefault TRUE

   Supports:
   true
   "true"
   1
   "1"
===================================================== */

const isSchemaDefaultTrue = (
    field: any
) => {
    const value =
        field?.isDefault;

    if (
        value === true ||
        value === 1 ||
        value === "1"
    ) {
        return true;
    }

    return (
        typeof value ===
        "string" &&
        value
            .trim()
            .toLowerCase() ===
        "true"
    );
};

const normalizeUnit = (
    value: any
) => {
    if (
        typeof value === "object" &&
        value !== null
    ) {
        return (
            value.unitCode ??
            value.code ??
            value.value ??
            value.name ??
            value.unitName ??
            ""
        );
    }

    return value ?? "";
};

const getSavedUnitFromResponse = (
    response: any
) =>
    response?.data?.unit ||
    response?.data?.data?.unit ||
    response?.data?.data ||
    response?.data ||
    response?.unit ||
    response;

const areValuesEqual = (
    firstValue: any,
    secondValue: any
) => {
    if (
        typeof firstValue ===
        "object" ||
        typeof secondValue ===
        "object"
    ) {
        return (
            JSON.stringify(
                firstValue ?? null
            ) ===
            JSON.stringify(
                secondValue ?? null
            )
        );
    }

    return (
        firstValue ===
        secondValue
    );
};

const getProfessionalUserFromStorage =
    () => {
        try {
            const rawUser =
                localStorage.getItem(
                    "professionalUser"
                );

            return rawUser
                ? JSON.parse(
                    rawUser
                )
                : null;
        } catch (
        error
        ) {
            console.error(
                "Unable to read professionalUser from localStorage:",
                error
            );

            return null;
        }
    };

const resolveDataSourceApi = (
    rawApi: string
) => {
    const storedUser =
        getProfessionalUserFromStorage();

    const userMobileNumberHash =
        String(
            storedUser
                ?.userMobileNumberHash ||
            ""
        ).trim();

    const parentUserMobileNumber =
        String(
            storedUser
                ?.parentUserMobileNumber ||
            userMobileNumberHash ||
            ""
        ).trim();

    let resolvedApi =
        String(
            rawApi || ""
        ).trim();

    if (
        userMobileNumberHash
    ) {
        resolvedApi =
            resolvedApi.replace(
                /\{userMobileNumberHash\}/g,

                encodeURIComponent(
                    userMobileNumberHash
                )
            );
    }

    if (
        parentUserMobileNumber
    ) {
        resolvedApi =
            resolvedApi.replace(
                /\{parentUserMobileNumber\}/g,

                encodeURIComponent(
                    parentUserMobileNumber
                )
            );
    }

    return resolvedApi;
};

const buildDataSourceRequestUrl = (
    rawApi: string
) => {
    const resolvedApi =
        resolveDataSourceApi(
            rawApi
        );

    if (!resolvedApi) {
        return "";
    }

    if (
        /^https?:\/\//i.test(
            resolvedApi
        )
    ) {
        return resolvedApi;
    }

    const backendPrefix =
        "eTaxSolnMongoApiBackend";

    const axiosBaseUrl =
        String(
            professionalAxios
                ?.defaults
                ?.baseURL ||
            ""
        ).trim();

    const baseHasBackendPrefix =
        /\/eTaxSolnMongoApiBackend\/?$/i.test(
            axiosBaseUrl
        );

    let relativeApi =
        resolvedApi
            .replace(
                /^\/+/,
                ""
            )
            .replace(
                /^SandBox\//i,
                ""
            );

    if (
        baseHasBackendPrefix
    ) {
        return relativeApi.replace(
            /^eTaxSolnMongoApiBackend\/?/i,
            ""
        );
    }

    if (
        !relativeApi
            .toLowerCase()
            .startsWith(
                backendPrefix.toLowerCase()
            )
    ) {
        relativeApi =
            `${backendPrefix}/${relativeApi}`;
    }

    return relativeApi;
};

const extractGenericRecords = (
    responseData: any
): any[] => {
    const roots = [
        responseData,
        responseData?.data,
        responseData?.result,
        responseData?.payload,
        responseData?.data?.data,
    ];

    const keys = [
        "items",
        "records",
        "users",
        "accounts",
        "products",
        "units",
        "docs",
        "result",
    ];

    for (
        const root of roots
    ) {
        if (
            Array.isArray(
                root
            )
        ) {
            return root;
        }

        if (
            root &&
            typeof root ===
            "object"
        ) {
            for (
                const key of keys
            ) {
                if (
                    Array.isArray(
                        root?.[key]
                    )
                ) {
                    return root[
                        key
                    ];
                }
            }
        }
    }

    return [];
};

const extractEmployeeChildUsers = (
    responseData: any
): any[] => {
    const result =
        Array.isArray(
            responseData?.result
        )
            ? responseData.result
            : Array.isArray(
                responseData
                    ?.data
                    ?.result
            )
                ? responseData
                    .data
                    .result
                : [];

    return result.flatMap(
        (
            record: any
        ) =>
            Array.isArray(
                record?.ChildUsers
            )
                ? record.ChildUsers
                : []
    );
};

const buildReferenceOption = (
    field: any,
    item: any
): ReferenceOption | null => {
    const fieldType =
        getFieldType(
            field
        );

    const dataSource =
        getDataSource(
            field
        );

    const dynamicData =
        item?.data ||
        item?.dynamicFields ||
        item?.customFields ||
        {};

    let valueField =
        String(
            field?.valueField ||
            dataSource?.valueField ||
            ""
        ).trim();

    let labelField =
        String(
            field?.labelField ||
            dataSource?.labelField ||
            ""
        ).trim();

    let optionValue: any =
        "";

    let optionLabel: any =
        "";

    if (
        fieldType ===
        "accountmaster"
    ) {
        valueField =
            valueField ||
            "accountCode";

        labelField =
            labelField ||
            "accountName";

        optionValue =
            item?.[
            valueField
            ] ||
            item?.accountCode ||
            item?.code;

        optionLabel =
            item?.[
            labelField
            ] ||
            item?.accountName ||
            item?.name;
    } else if (
        fieldType ===
        "productmaster"
    ) {
        valueField =
            valueField ||
            "productCode";

        labelField =
            labelField ||
            "productName";

        optionValue =
            item?.[
            valueField
            ] ||
            item?.productCode ||
            item?.code;

        optionLabel =
            item?.[
            labelField
            ] ||
            item?.productName ||
            item?.name;
    } else if (
        fieldType ===
        "unitmaster"
    ) {
        valueField =
            valueField ||
            "unitCode";

        labelField =
            labelField ||
            "unitName";

        optionValue =
            item?.[
            valueField
            ] ||
            item?.unitCode ||
            item?.code;

        optionLabel =
            item?.[
            labelField
            ] ||
            item?.unitName ||
            item?.name;
    } else if (
        EMPLOYEE_REFERENCE_FIELD_TYPES.has(
            fieldType
        )
    ) {
        optionValue =
            item?.userMobileNumberHash ||
            item?.mobile;

        optionLabel = [
            item?.userFirstName,
            item?.userMiddleName,
            item?.userLastName,
        ]
            .filter(
                Boolean
            )
            .join(
                " "
            )
            .trim();
    } else if (
        fieldType ===
        "custommaster"
    ) {
        valueField =
            valueField ||
            "code";

        labelField =
            labelField ||
            "name";

        optionValue =
            dynamicData?.[
            valueField
            ] ||
            item?.[
            valueField
            ] ||
            dynamicData?.code ||
            item?.code ||
            item?.voucherNumber ||
            item?._id;

        optionLabel =
            dynamicData?.[
            labelField
            ] ||
            item?.[
            labelField
            ] ||
            dynamicData?.name ||
            dynamicData
                ?.vehicle_number ||
            item?.name;
    }

    const finalValue =
        String(
            optionValue ?? ""
        ).trim();

    if (!finalValue) {
        return null;
    }

    return {
        value:
            finalValue,

        label:
            getTextValue(
                optionLabel
            ) ||
            finalValue,

        raw:
            item,
    };
};

const loadSchemaReferenceOptions =
    async (
        fields: any[]
    ) => {
        return Promise.all(
            (
                Array.isArray(
                    fields
                )
                    ? fields
                    : []
            ).map(
                async (
                    field: any
                ) => {
                    if (
                        !isMasterReferenceField(
                            field
                        )
                    ) {
                        return field;
                    }

                    const dataSource =
                        getDataSource(
                            field
                        );

                    const rawApi =
                        String(
                            field?.api ||
                            dataSource?.api ||
                            ""
                        ).trim();

                    if (!rawApi) {
                        return {
                            ...field,

                            options:
                                Array.isArray(
                                    field?.options
                                )
                                    ? field.options
                                    : [],
                        };
                    }

                    const requestUrl =
                        buildDataSourceRequestUrl(
                            rawApi
                        );

                    if (
                        !requestUrl ||
                        /\{[^}]+\}/.test(
                            requestUrl
                        )
                    ) {
                        console.error(
                            `Datasource placeholder is unresolved for unit field "${field.key}":`,
                            requestUrl ||
                            rawApi
                        );

                        return {
                            ...field,

                            options:
                                [],
                        };
                    }

                    try {
                        const response =
                            await professionalAxios.get(
                                requestUrl,
                                {
                                    params:
                                        field
                                            ?.queryParams ||
                                        dataSource
                                            ?.queryParams ||
                                        {},
                                }
                            );

                        const fieldType =
                            getFieldType(
                                field
                            );

                        const records =
                            EMPLOYEE_REFERENCE_FIELD_TYPES.has(
                                fieldType
                            )
                                ? extractEmployeeChildUsers(
                                    response?.data
                                )
                                : extractGenericRecords(
                                    response?.data
                                );

                        const options =
                            records
                                .map(
                                    (
                                        item: any
                                    ) =>
                                        buildReferenceOption(
                                            field,
                                            item
                                        )
                                )
                                .filter(
                                    Boolean
                                );

                        return {
                            ...field,

                            dataSource,

                            api:
                                requestUrl,

                            options,
                        };
                    } catch (
                    error: any
                    ) {
                        console.error(
                            `Failed to load datasource for unit field "${field.key}":`,
                            error
                                ?.response
                                ?.data ||
                            error
                        );

                        return {
                            ...field,

                            dataSource,

                            api:
                                requestUrl,

                            options:
                                [],
                        };
                    }
                }
            )
        );
    };

const normalizeReferenceValue = (
    field: any,
    value: any
) => {
    if (
        !value ||
        typeof value !==
        "object" ||
        Array.isArray(
            value
        )
    ) {
        return null;
    }

    const fieldType =
        getFieldType(
            field
        );

    if (
        EMPLOYEE_REFERENCE_FIELD_TYPES.has(
            fieldType
        )
    ) {
        return {
            userMobileNumberHash:
                value
                    ?.userMobileNumberHash ||
                value?.mobile ||
                value?.value ||
                "",

            userFirstName:
                value?.userFirstName ||
                value?.firstName ||
                "",

            userMiddleName:
                value?.userMiddleName ||
                value?.middleName ||
                "",

            userLastName:
                value?.userLastName ||
                value?.lastName ||
                "",

            userType:
                value?.userType ||
                value?.type ||
                "",

            parentUserMobileNumber:
                value
                    ?.parentUserMobileNumber ||
                value?.parentMobile ||
                "",
        };
    }

    return {
        code:
            value?.code ||
            value?.productCode ||
            value?.unitCode ||
            value?.accountCode ||
            value?.voucherNumber ||
            value?.value ||
            value?._id ||
            "",

        name:
            getTextValue(
                value?.name ||
                value?.productName ||
                value?.unitName ||
                value?.accountName ||
                value
                    ?.vehicle_number ||
                value?.label
            ),
    };
};

const getReferenceSelectValue = (
    field: any,
    value: any
) => {
    if (!value) {
        return "";
    }

    if (
        typeof value !==
        "object"
    ) {
        return String(
            value
        );
    }

    const fieldType =
        getFieldType(
            field
        );

    if (
        EMPLOYEE_REFERENCE_FIELD_TYPES.has(
            fieldType
        )
    ) {
        return String(
            value
                ?.userMobileNumberHash ||
            value?.mobile ||
            ""
        );
    }

    return String(
        value?.code ||
        value?.productCode ||
        value?.unitCode ||
        value?.accountCode ||
        value?.voucherNumber ||
        value?.value ||
        value?._id ||
        ""
    );
};

const buildSelectedReferenceValue = (
    field: any,
    option:
        | ReferenceOption
        | undefined,
    fallbackValue: string
) => {
    const raw =
        option?.raw ||
        {};

    const fieldType =
        getFieldType(
            field
        );

    if (
        EMPLOYEE_REFERENCE_FIELD_TYPES.has(
            fieldType
        )
    ) {
        return {
            userMobileNumberHash:
                raw
                    ?.userMobileNumberHash ||
                raw?.mobile ||
                option?.value ||
                fallbackValue,

            userFirstName:
                raw?.userFirstName ||
                raw?.firstName ||
                "",

            userMiddleName:
                raw?.userMiddleName ||
                raw?.middleName ||
                "",

            userLastName:
                raw?.userLastName ||
                raw?.lastName ||
                "",

            userType:
                raw?.userType ||
                raw?.type ||
                "",

            parentUserMobileNumber:
                raw
                    ?.parentUserMobileNumber ||
                raw?.parentMobile ||
                "",
        };
    }

    const dynamicData =
        raw?.data ||
        raw?.dynamicFields ||
        raw?.customFields ||
        raw;

    if (
        fieldType ===
        "accountmaster"
    ) {
        return {
            code:
                raw?.accountCode ||
                raw?.code ||
                option?.value ||
                fallbackValue,

            name:
                getTextValue(
                    raw?.accountName ||
                    raw?.name ||
                    option?.label
                ),
        };
    }

    if (
        fieldType ===
        "productmaster"
    ) {
        return {
            code:
                raw?.productCode ||
                raw?.code ||
                option?.value ||
                fallbackValue,

            name:
                getTextValue(
                    raw?.productName ||
                    raw?.name ||
                    option?.label
                ),
        };
    }

    if (
        fieldType ===
        "unitmaster"
    ) {
        return {
            code:
                raw?.unitCode ||
                raw?.code ||
                option?.value ||
                fallbackValue,

            name:
                getTextValue(
                    raw?.unitName ||
                    raw?.name ||
                    option?.label
                ),
        };
    }

    return {
        code:
            dynamicData?.code ||
            raw?.code ||
            raw?.voucherNumber ||
            raw?._id ||
            option?.value ||
            fallbackValue,

        name:
            getTextValue(
                dynamicData?.name ||
                dynamicData
                    ?.vehicle_number ||
                raw?.name ||
                option?.label
            ),
    };
};

const UnitMasterModal = ({
    show,
    setShow,
    editingUnit = null,
    onSaved,
    title,
    initialSearchValue = "",
}: UnitMasterModalProps) => {
    const dispatch =
        useDispatch<any>();

    const {
        units = [],
        unitMasterSchemaFields:
        rawUnitMasterSchemaFields = [],
        schemaLoading,
    } = useSelector(
        (state: any) =>
            state.unitMaster ||
            {}
    );

    const [
        form,
        setForm,
    ] = useState<
        Record<
            string,
            any
        >
    >({});

    const [
        errors,
        setErrors,
    ] = useState<
        Record<
            string,
            string
        >
    >({});

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        resolvedSchemaFields,
        setResolvedSchemaFields,
    ] = useState<any[]>([]);

    const [
        optionsLoading,
        setOptionsLoading,
    ] = useState(false);

    const [
        optionsReady,
        setOptionsReady,
    ] = useState(false);

    const unitMasterSchemaFields =
        useMemo(
            () =>
                optionsReady
                    ? resolvedSchemaFields
                    : rawUnitMasterSchemaFields,

            [
                optionsReady,
                resolvedSchemaFields,
                rawUnitMasterSchemaFields,
            ]
        );

    /* =====================================================
       DYNAMIC SCHEMA FIELD CHECK

       Rules:

       1. Account/Product/Unit/Employee references always
          go inside dynamicFields.

       2. Any schema field where isDefault is false,
          "false", 0 or "0" goes inside dynamicFields.

       3. Default fields remain at payload root.

       4. Existing dynamic flags remain supported.
    ===================================================== */

    const isDynamicSchemaField = (
        field: any
    ) => {
        const fieldType =
            getFieldType(
                field
            );

        if (
            DYNAMIC_MASTER_FIELD_TYPES.has(
                fieldType
            )
        ) {
            return true;
        }

        if (
            isSchemaDefaultFalse(
                field
            )
        ) {
            return true;
        }

        if (
            field?.isDynamic ===
            true
        ) {
            return true;
        }

        if (
            field?.isDynamicField ===
            true
        ) {
            return true;
        }

        if (
            field?.isCustomField ===
            true
        ) {
            return true;
        }

        if (
            field?.source ===
            "dynamic"
        ) {
            return true;
        }

        if (
            field?.fieldSource ===
            "dynamic"
        ) {
            return true;
        }

        if (
            isSchemaDefaultTrue(
                field
            )
        ) {
            return false;
        }

        if (
            field?.isDynamic ===
            false
        ) {
            return false;
        }

        if (
            field?.isSystemField ===
            true
        ) {
            return false;
        }

        return false;
    };

    const buildEmptyForm = (
        fields: any[] = []
    ) =>
        fields.reduce(
            (
                accumulator:
                    Record<
                        string,
                        any
                    >,

                field: any
            ) => {
                const fieldType =
                    getFieldType(
                        field
                    );

                if (
                    fieldType ===
                    "boolean"
                ) {
                    accumulator[
                        field.key
                    ] = false;
                } else if (
                    isMasterReferenceField(
                        field
                    )
                ) {
                    accumulator[
                        field.key
                    ] = null;
                } else {
                    accumulator[
                        field.key
                    ] = "";
                }

                return accumulator;
            },

            {}
        );

    const getFieldStoredValue = (
        field: any,
        unit: any
    ) => {
        const key =
            field.key;

        const hasTopLevelValue =
            Object.prototype
                .hasOwnProperty
                .call(
                    unit || {},
                    key
                );

        const hasDynamicValue =
            Object.prototype
                .hasOwnProperty
                .call(
                    unit?.dynamicFields ||
                    {},
                    key
                );

        if (
            hasTopLevelValue
        ) {
            return unit?.[
                key
            ];
        }

        if (
            hasDynamicValue
        ) {
            return unit
                ?.dynamicFields?.[
                key
            ];
        }

        return "";
    };

    const normalizeFieldValue = (
        field: any,
        value: any
    ) => {
        const fieldType =
            getFieldType(
                field
            );

        if (
            isMasterReferenceField(
                field
            )
        ) {
            return normalizeReferenceValue(
                field,
                value
            );
        }

        if (
            field.key ===
            "unit"
        ) {
            return normalizeUnit(
                value
            );
        }

        if (
            fieldType ===
            "number" &&
            value !== "" &&
            value !== null &&
            value !==
            undefined
        ) {
            return Number(
                value
            );
        }

        if (
            fieldType ===
            "boolean"
        ) {
            return getBooleanValue(
                value
            );
        }

        return value ?? "";
    };

    useEffect(() => {
        if (!show) {
            return;
        }

        dispatch(
            getAllUnitMasterSchema({
                offset: 0,
                limit: 500,
            }) as any
        );
    }, [
        dispatch,
        show,
    ]);

    useEffect(() => {
        if (!show) {
            setResolvedSchemaFields(
                []
            );

            setOptionsLoading(
                false
            );

            setOptionsReady(
                false
            );

            return;
        }

        if (
            !Array.isArray(
                rawUnitMasterSchemaFields
            ) ||
            rawUnitMasterSchemaFields
                .length === 0
        ) {
            if (
                !schemaLoading
            ) {
                setResolvedSchemaFields(
                    []
                );

                setOptionsReady(
                    true
                );
            }

            return;
        }

        let active =
            true;

        const loadOptions =
            async () => {
                setOptionsLoading(
                    true
                );

                setOptionsReady(
                    false
                );

                try {
                    const fieldsWithOptions =
                        await loadSchemaReferenceOptions(
                            rawUnitMasterSchemaFields
                        );

                    if (
                        active
                    ) {
                        setResolvedSchemaFields(
                            fieldsWithOptions
                        );
                    }
                } catch (
                error
                ) {
                    console.error(
                        "Failed to load Unit Master reference options:",
                        error
                    );

                    if (
                        active
                    ) {
                        setResolvedSchemaFields(
                            rawUnitMasterSchemaFields
                        );
                    }
                } finally {
                    if (
                        active
                    ) {
                        setOptionsLoading(
                            false
                        );

                        setOptionsReady(
                            true
                        );
                    }
                }
            };

        loadOptions();

        return () => {
            active =
                false;
        };
    }, [
        show,
        schemaLoading,
        rawUnitMasterSchemaFields,
    ]);

    useEffect(() => {
        if (
            !show ||
            !optionsReady ||
            unitMasterSchemaFields
                .length === 0
        ) {
            return;
        }

        setErrors({});

        const nextForm =
            buildEmptyForm(
                unitMasterSchemaFields
            );

        if (
            editingUnit
        ) {
            unitMasterSchemaFields.forEach(
                (
                    field: any
                ) => {
                    const storedValue =
                        getFieldStoredValue(
                            field,
                            editingUnit
                        );

                    nextForm[
                        field.key
                    ] =
                        normalizeFieldValue(
                            field,
                            storedValue
                        );
                }
            );
        } else if (
            initialSearchValue
        ) {
            const unitCodeField =
                unitMasterSchemaFields.find(
                    (
                        field: any
                    ) =>
                        field.key ===
                        "unitCode"
                );

            const unitNameField =
                unitMasterSchemaFields.find(
                    (
                        field: any
                    ) =>
                        field.key ===
                        "unitName"
                );

            if (
                unitCodeField
            ) {
                nextForm.unitCode =
                    initialSearchValue;
            } else if (
                unitNameField
            ) {
                nextForm.unitName =
                    initialSearchValue;
            }
        }

        setForm(
            nextForm
        );
    }, [
        show,
        editingUnit,
        optionsReady,
        unitMasterSchemaFields,
        initialSearchValue,
    ]);

    const validateForm =
        () => {
            const validationErrors:
                Record<
                    string,
                    string
                > = {};

            unitMasterSchemaFields.forEach(
                (
                    field: any
                ) => {
                    const value =
                        form?.[
                        field.key
                        ];

                    const fieldType =
                        getFieldType(
                            field
                        );

                    const required =
                        field.isRequired ||
                        field.required;

                    if (
                        required
                    ) {
                        if (
                            fieldType ===
                            "boolean"
                        ) {
                            if (
                                value ===
                                undefined ||
                                value ===
                                null
                            ) {
                                validationErrors[
                                    field.key
                                ] =
                                    `${field.label} required`;
                            }
                        } else if (
                            isMasterReferenceField(
                                field
                            )
                        ) {
                            if (
                                EMPLOYEE_REFERENCE_FIELD_TYPES.has(
                                    fieldType
                                )
                            ) {
                                if (
                                    !String(
                                        value
                                            ?.userMobileNumberHash ||
                                        ""
                                    ).trim()
                                ) {
                                    validationErrors[
                                        field.key
                                    ] =
                                        `${field.label} required`;
                                }
                            } else if (
                                !String(
                                    value?.code ||
                                    ""
                                ).trim() ||
                                !String(
                                    value?.name ||
                                    ""
                                ).trim()
                            ) {
                                validationErrors[
                                    field.key
                                ] =
                                    `${field.label} required`;
                            }
                        } else if (
                            value ===
                            undefined ||
                            value ===
                            null ||
                            String(
                                value
                            ).trim() ===
                            ""
                        ) {
                            validationErrors[
                                field.key
                            ] =
                                `${field.label} required`;
                        }
                    }

                    if (
                        fieldType ===
                        "number" &&
                        value !== "" &&
                        value !== null &&
                        value !==
                        undefined &&
                        Number(
                            value
                        ) < 0
                    ) {
                        validationErrors[
                            field.key
                        ] =
                            `${field.label} cannot be negative`;
                    }

                    if (
                        fieldType ===
                        "number" &&
                        value !== "" &&
                        value !== null &&
                        value !==
                        undefined &&
                        Number.isNaN(
                            Number(
                                value
                            )
                        )
                    ) {
                        validationErrors[
                            field.key
                        ] =
                            `${field.label} must be a valid number`;
                    }
                }
            );

            setErrors(
                validationErrors
            );

            return (
                Object.keys(
                    validationErrors
                ).length === 0
            );
        };

    const getFieldOptions = (
        field: any
    ) => {
        if (
            isMasterReferenceField(
                field
            )
        ) {
            return Array.isArray(
                field?.options
            )
                ? field.options
                : [];
        }

        if (
            field.ref ===
            "unitMeasurement"
        ) {
            return (
                units?.map(
                    (
                        item: any
                    ) => {
                        const value =
                            item?.[
                            field
                                .valueField
                            ] ||
                            item?.unitCode ||
                            item?.code ||
                            "";

                        const label =
                            item?.[
                            field
                                .labelField
                            ] ||
                            item?.unitName ||
                            item?.name ||
                            value;

                        return {
                            value,

                            label:
                                getTextValue(
                                    label
                                ),
                        };
                    }
                ) ||
                []
            );
        }

        return (
            field.options ||
            []
        ).map(
            (
                option: any
            ) => {
                if (
                    typeof option ===
                    "object"
                ) {
                    return {
                        value:
                            option.value ||
                            option.code ||
                            option.name ||
                            "",

                        label:
                            option.label ||
                            option.name ||
                            option.value ||
                            "",
                    };
                }

                return {
                    value:
                        option,

                    label:
                        option,
                };
            }
        );
    };

    const updateField = (
        key: string,
        value: any
    ) => {
        setForm(
            (
                previous
            ) => ({
                ...previous,

                [key]:
                    value,
            })
        );

        setErrors(
            (
                previous
            ) => ({
                ...previous,

                [key]:
                    "",
            })
        );
    };

    const renderSchemaField = (
        field: any
    ) => {
        const fieldType =
            getFieldType(
                field
            );

        const value =
            form?.[
            field.key
            ] ?? "";

        const commonProps = {
            label:
                field.label,

            mandatory:
                field.isRequired ||
                field.required,

            value,

            placeholder:
                field.placeholder ||
                `Enter ${field.label}`,

            error:
                errors?.[
                field.key
                ],

            disabled:
                field?.disabled ||
                field?.isReadonly ||
                submitting,
        };

        if (
            isMasterReferenceField(
                field
            )
        ) {
            const options =
                getFieldOptions(
                    field
                ) as ReferenceOption[];

            const selectedValue =
                getReferenceSelectValue(
                    field,
                    value
                );

            return (
                <SelectInput
                    key={
                        field.key
                    }
                    name={
                        field.key
                    }
                    label={
                        field.label
                    }
                    mandatory={
                        field.isRequired ||
                        field.required
                    }
                    value={
                        selectedValue
                    }
                    placeholder={`Select ${field.label}`}
                    error={
                        errors?.[
                        field.key
                        ]
                    }
                    disabled={
                        field?.disabled ||
                        field?.isReadonly ||
                        submitting ||
                        optionsLoading
                    }
                    largeData={
                        true
                    }
                    styles={{
                        menuPortal:
                            (
                                base: any
                            ) => ({
                                ...base,

                                zIndex:
                                    2147483647,
                            }),

                        menu:
                            (
                                base: any
                            ) => ({
                                ...base,

                                zIndex:
                                    2147483647,
                            }),
                    }}
                    options={[
                        {
                            value:
                                "",

                            label:
                                optionsLoading
                                    ? `Loading ${field.label}...`
                                    : options.length >
                                        0
                                        ? `Select ${field.label}`
                                        : `No ${field.label} found`,
                        },

                        ...options,
                    ]}
                    onChange={(
                        event: any
                    ) => {
                        const nextValue =
                            String(
                                event
                                    ?.target
                                    ?.value ??
                                ""
                            );

                        if (
                            !nextValue
                        ) {
                            updateField(
                                field.key,
                                null
                            );

                            return;
                        }

                        const selectedOption =
                            options.find(
                                (
                                    option
                                ) =>
                                    String(
                                        option.value
                                    ) ===
                                    nextValue
                            );

                        updateField(
                            field.key,

                            buildSelectedReferenceValue(
                                field,
                                selectedOption,
                                nextValue
                            )
                        );
                    }}
                />
            );
        }

        if (
            fieldType ===
            "select"
        ) {
            return (
                <SelectInput
                    key={
                        field.key
                    }
                    name={
                        field.key
                    }
                    label={
                        field.label
                    }
                    mandatory={
                        field.isRequired ||
                        field.required
                    }
                    value={
                        value
                    }
                    placeholder={`Select ${field.label}`}
                    error={
                        errors?.[
                        field.key
                        ]
                    }
                    disabled={
                        field?.disabled ||
                        field?.isReadonly ||
                        submitting
                    }
                    styles={{
                        menuPortal:
                            (
                                base: any
                            ) => ({
                                ...base,

                                zIndex:
                                    2147483647,
                            }),

                        menu:
                            (
                                base: any
                            ) => ({
                                ...base,

                                zIndex:
                                    2147483647,
                            }),
                    }}
                    onChange={(
                        event: any
                    ) => {
                        updateField(
                            field.key,

                            event
                                ?.target
                                ?.value ??
                            ""
                        );
                    }}
                    options={[
                        {
                            value:
                                "",

                            label:
                                `Select ${field.label}`,
                        },

                        ...getFieldOptions(
                            field
                        ),
                    ]}
                />
            );
        }

        if (
            fieldType ===
            "boolean"
        ) {
            const booleanValue =
                getBooleanValue(
                    form?.[
                    field.key
                    ]
                );

            return (
                <ToggleInput
                    key={
                        field.key
                    }
                    label={
                        field.label
                    }
                    name={
                        field.key
                    }
                    value={
                        booleanValue
                    }
                    checked={
                        booleanValue
                    }
                    mandatory={
                        field.isRequired ||
                        field.required
                    }
                    error={
                        errors?.[
                        field.key
                        ]
                    }
                    disabled={
                        field?.disabled ||
                        field?.isReadonly ||
                        submitting
                    }
                    onChange={(
                        event: any
                    ) => {
                        updateField(
                            field.key,

                            getBooleanValue(
                                event
                                    ?.target
                                    ?.checked ??
                                event
                                    ?.target
                                    ?.value
                            )
                        );
                    }}
                />
            );
        }

        if (
            fieldType ===
            "number"
        ) {
            return (
                <TextInput
                    key={
                        field.key
                    }
                    {...commonProps}
                    type="number"
                    onChange={(
                        event: any
                    ) => {
                        updateField(
                            field.key,

                            event
                                .target
                                .value
                        );
                    }}
                />
            );
        }

        return (
            <TextInput
                key={
                    field.key
                }
                {...commonProps}
                type="text"
                onChange={(
                    event: any
                ) => {
                    updateField(
                        field.key,

                        event
                            .target
                            .value
                    );
                }}
            />
        );
    };

    const handleSubmit =
        async () => {
            if (
                submitting ||
                schemaLoading ||
                optionsLoading ||
                !optionsReady ||
                !validateForm()
            ) {
                return;
            }

            const rootPayload:
                Record<
                    string,
                    any
                > = {};

            const nextDynamicFields:
                Record<
                    string,
                    any
                > = {
                ...(
                    editingUnit
                        ?.dynamicFields ||
                    {}
                ),
            };

            unitMasterSchemaFields.forEach(
                (
                    field: any
                ) => {
                    const normalizedValue =
                        normalizeFieldValue(
                            field,

                            form?.[
                            field.key
                            ]
                        );

                    if (
                        isDynamicSchemaField(
                            field
                        )
                    ) {
                        nextDynamicFields[
                            field.key
                        ] =
                            normalizedValue;
                    } else {
                        rootPayload[
                            field.key
                        ] =
                            normalizedValue;
                    }
                }
            );

            setSubmitting(
                true
            );

            try {
                let response: any;

                if (
                    editingUnit
                ) {
                    const updatePayload:
                        Record<
                            string,
                            any
                        > = {};

                    let dynamicFieldsChanged =
                        false;

                    unitMasterSchemaFields.forEach(
                        (
                            field: any
                        ) => {
                            const key =
                                field.key;

                            const currentValue =
                                isDynamicSchemaField(
                                    field
                                )
                                    ? nextDynamicFields[
                                    key
                                    ]
                                    : rootPayload[
                                    key
                                    ];

                            const oldStoredValue =
                                getFieldStoredValue(
                                    field,
                                    editingUnit
                                );

                            const oldValue =
                                normalizeFieldValue(
                                    field,
                                    oldStoredValue
                                );

                            if (
                                isDynamicSchemaField(
                                    field
                                )
                            ) {
                                if (
                                    !areValuesEqual(
                                        currentValue,
                                        oldValue
                                    )
                                ) {
                                    dynamicFieldsChanged =
                                        true;
                                }

                                return;
                            }

                            if (
                                !areValuesEqual(
                                    currentValue,
                                    oldValue
                                )
                            ) {
                                updatePayload[
                                    key
                                ] =
                                    currentValue;
                            }
                        }
                    );

                    if (
                        dynamicFieldsChanged
                    ) {
                        updatePayload
                            .dynamicFields =
                            nextDynamicFields;
                    }

                    if (
                        Object.keys(
                            updatePayload
                        ).length === 0
                    ) {
                        toast.info(
                            "No changes found"
                        );

                        return;
                    }

                    response =
                        await dispatch(
                            updateUnit({
                                unitId:
                                    editingUnit
                                        .unitId,

                                data:
                                    updatePayload,
                            }) as any
                        ).unwrap();

                    toast.success(
                        "Unit updated successfully"
                    );
                } else {
                    const createPayload = {
                        ...rootPayload,

                        dynamicFields:
                            nextDynamicFields,
                    };

                    response =
                        await dispatch(
                            createUnit(
                                createPayload
                            ) as any
                        ).unwrap();

                    toast.success(
                        "Unit created successfully"
                    );
                }

                await dispatch(
                    getAllUnits({
                        offset: 0,
                        limit: 1000,
                        search: "",
                    }) as any
                ).unwrap();

                const savedUnit =
                    getSavedUnitFromResponse(
                        response
                    ) || {
                        ...rootPayload,

                        dynamicFields:
                            nextDynamicFields,
                    };

                if (
                    onSaved
                ) {
                    await onSaved(
                        savedUnit
                    );
                }

                setShow(
                    false
                );

                setErrors({});

                setForm(
                    buildEmptyForm(
                        unitMasterSchemaFields
                    )
                );
            } catch (
            error: any
            ) {
                const apiErrors =
                    error?.error ||
                    error?.errors ||
                    error
                        ?.response
                        ?.data
                        ?.error ||
                    error
                        ?.response
                        ?.data
                        ?.errors ||
                    {};

                if (
                    apiErrors &&
                    typeof apiErrors ===
                    "object" &&
                    !Array.isArray(
                        apiErrors
                    )
                ) {
                    setErrors(
                        apiErrors
                    );
                }

                toast.error(
                    error
                        ?.response
                        ?.data
                        ?.message ||
                    error?.message ||
                    "Unit operation failed"
                );
            } finally {
                setSubmitting(
                    false
                );
            }
        };

    if (
        !show ||
        typeof document ===
        "undefined"
    ) {
        return null;
    }

    const modalLoading =
        schemaLoading ||
        optionsLoading ||
        !optionsReady;

    return createPortal(
        <div className="fixed inset-0 z-[2147483600] isolate pointer-events-none">
            <div className="pointer-events-auto">
                <Modal
                    show={
                        show
                    }
                    setShow={
                        setShow
                    }
                    handleSubmit={
                        handleSubmit
                    }
                    loader={
                        submitting
                    }
                    state={
                        editingUnit
                    }
                    title={
                        title ||
                        (
                            editingUnit
                                ? "Unit"
                                : "Add New Unit"
                        )
                    }
                    body={
                        <>
                            {modalLoading ? (
                                <div className="py-6 text-sm text-muted-foreground">
                                    Loading unit fields...
                                </div>
                            ) : unitMasterSchemaFields
                                .length === 0 ? (
                                <div className="py-6 text-sm text-muted-foreground">
                                    Unit Master schema fields not found.
                                </div>
                            ) : (
                                unitMasterSchemaFields.map(
                                    (
                                        field: any
                                    ) =>
                                        renderSchemaField(
                                            field
                                        )
                                )
                            )}
                        </>
                    }
                />
            </div>
        </div>,
        document.body
    );
};

export default UnitMasterModal;