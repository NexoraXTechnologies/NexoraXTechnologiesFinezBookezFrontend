import { useEffect, useMemo, useState } from "react";

import {
    CreatableSelectInput,
    SelectInput,
    TextArea,
    TextInput,
    ToggleInput,
} from "../inputs";

import EditableLineTable from "./EditableLineTable";
import SummaryCards from "./SummaryCards";
import VoucherFormModal from "./VoucherFormModal";
import { DynamicFormContentSkeleton } from "../skeleton/SkeletonLoader";
import LocationSection from "./LocationSection";
import { AccountMasterModal } from "../modal";

import { loadFieldOptions } from "../../pages/bookez/transactions/purchaseWorkflow/Grn";

/* =====================================================
   FIELD TYPE
===================================================== */

const getDynamicFieldType = (
    field: any
) => {
    return String(
        field?.type ||
        field?.dataSource?.type ||
        ""
    )
        .trim()
        .toLowerCase()
        .replace(/\s/g, "");
};

/* =====================================================
   CUSTOM MASTER CHECK
===================================================== */

const isCustomMasterField = (
    field: any
) => {
    const fieldType =
        getDynamicFieldType(
            field
        );

    const dataSourceType =
        String(
            field?.dataSource?.type ||
            ""
        )
            .trim()
            .toLowerCase()
            .replace(/\s/g, "");

    return (
        fieldType === "custommaster" ||
        fieldType === "customemaster" ||
        dataSourceType === "custommaster" ||
        dataSourceType === "customemaster" ||
        Boolean(
            field?.customMasterCode &&
            field?.dataSource?.api
        )
    );
};

/* =====================================================
   CUSTOM MASTER NAME
===================================================== */

const getCustomMasterName = (
    field: any
) => {
    return String(
        field?.customMasterName ||
        field?.dataSource?.customMasterName ||
        field?.label ||
        field?.key ||
        ""
    ).trim();
};

/* =====================================================
   PREPARE CUSTOM MASTER FIELD FOR loadFieldOptions

   Common loadFieldOptions reads:
       field.api
       field.labelField
       field.valueField
       field.queryParams

   Schema gives:
       field.dataSource.api
===================================================== */

const prepareCustomMasterFieldForOptions = (
    field: any
) => {
    if (
        !isCustomMasterField(
            field
        )
    ) {
        return field;
    }

    const api =
        field?.api ||
        field?.dataSource?.api ||
        "";

    if (!api) {
        return field;
    }

    const labelField =
        field?.labelField ||
        field?.dataSource?.labelField ||
        "name";

    const valueField =
        field?.valueField ||
        field?.dataSource?.valueField ||
        "code";

    return {
        ...field,

        api,

        labelField,

        valueField,

        queryParams:
            field?.queryParams ||
            field?.dataSource?.queryParams ||
            {},
    };
};

/* =====================================================
   LOAD CUSTOM MASTER OPTIONS FOR ONE SECTION

   IMPORTANT:
   Only custom master fields are passed to
   loadFieldOptions, so existing unrelated field APIs
   are not called again.
===================================================== */

const loadCustomMasterSectionOptions =
    async (
        fields: any[] = []
    ) => {
        const safeFields =
            Array.isArray(
                fields
            )
                ? fields
                : [];

        const customMasterFields =
            safeFields
                .filter(
                    (
                        field: any
                    ) =>
                        isCustomMasterField(
                            field
                        )
                )
                .map(
                    (
                        field: any
                    ) =>
                        prepareCustomMasterFieldForOptions(
                            field
                        )
                );

        if (
            customMasterFields.length ===
            0
        ) {
            return safeFields;
        }

        const loadedFields =
            await loadFieldOptions(
                customMasterFields
            );

        const loadedFieldMap =
            new Map<
                string,
                any
            >();

        (
            Array.isArray(
                loadedFields
            )
                ? loadedFields
                : []
        ).forEach(
            (
                field: any
            ) => {
                loadedFieldMap.set(
                    String(
                        field?.key ||
                        ""
                    ),

                    field
                );
            }
        );

        return safeFields.map(
            (
                field: any
            ) => {
                if (
                    !isCustomMasterField(
                        field
                    )
                ) {
                    return field;
                }

                const loadedField =
                    loadedFieldMap.get(
                        String(
                            field?.key ||
                            ""
                        )
                    );

                if (
                    !loadedField
                ) {
                    return field;
                }

                return {
                    ...field,

                    ...loadedField,

                    dataSource:
                        field?.dataSource,
                };
            }
        );
    };

/* =====================================================
   GET NESTED CUSTOM MASTER DATA
===================================================== */

const getCustomMasterRawData = (
    raw: any
) => {
    if (
        raw?.data &&
        typeof raw.data ===
        "object" &&
        !Array.isArray(
            raw.data
        )
    ) {
        return raw.data;
    }

    if (
        raw?.dynamicFields &&
        typeof raw.dynamicFields ===
        "object" &&
        !Array.isArray(
            raw.dynamicFields
        )
    ) {
        return raw.dynamicFields;
    }

    if (
        raw?.customFields &&
        typeof raw.customFields ===
        "object" &&
        !Array.isArray(
            raw.customFields
        )
    ) {
        return raw.customFields;
    }

    return raw || {};
};

/* =====================================================
   NORMALIZE CUSTOM MASTER OPTIONS

   Handles both:

   {
       code: "CIT-6",
       name: "computer software"
   }

   and:

   {
       data: {
           code: "CIT-6",
           name: "computer software"
       }
   }
===================================================== */

const getCustomMasterOptions = (
    field: any
) => {
    const options =
        Array.isArray(
            field?.options
        )
            ? field.options
            : [];

    const valueField =
        field?.valueField ||
        field?.dataSource?.valueField ||
        "code";

    const labelField =
        field?.labelField ||
        field?.dataSource?.labelField ||
        "name";

    return options
        .map(
            (
                option: any
            ) => {
                if (
                    typeof option !==
                    "object"
                ) {
                    return {
                        value:
                            String(
                                option
                            ),

                        label:
                            String(
                                option
                            ),

                        raw:
                            option,
                    };
                }

                const raw =
                    option?.raw ||
                    option ||
                    {};

                const nestedData =
                    getCustomMasterRawData(
                        raw
                    );

                const code =
                    option?.value ||
                    raw?.[
                    valueField
                    ] ||
                    nestedData?.[
                    valueField
                    ] ||
                    raw?.code ||
                    nestedData?.code ||
                    raw?._id ||
                    "";

                const name =
                    option?.label ||
                    raw?.[
                    labelField
                    ] ||
                    nestedData?.[
                    labelField
                    ] ||
                    raw?.name ||
                    nestedData?.name ||
                    code;

                if (
                    !String(
                        code ||
                        ""
                    ).trim()
                ) {
                    return null;
                }

                return {
                    ...option,

                    value:
                        String(
                            code
                        ),

                    label:
                        String(
                            name ||
                            code
                        ),

                    raw,
                };
            }
        )
        .filter(
            Boolean
        );
};

/* =====================================================
   GET CUSTOM MASTER SELECTED CODE
===================================================== */

const getCustomMasterSelectedCode = (
    form: any,
    field: any
) => {
    const customMasterName =
        getCustomMasterName(
            field
        );

    const selectedValue =
        form?.customMasters?.[
        customMasterName
        ];

    if (
        selectedValue &&
        typeof selectedValue ===
        "object"
    ) {
        return String(
            selectedValue?.code ||
            ""
        );
    }

    /*
     * Edit / older data fallback.
     */
    const fieldValue =
        form?.[
        field?.key
        ];

    if (
        fieldValue &&
        typeof fieldValue ===
        "object"
    ) {
        return String(
            fieldValue?.code ||
            ""
        );
    }

    return "";
};

/* =====================================================
   DYNAMIC ADD FORM
===================================================== */

const DynamicAddForm = ({
    show,
    setShow,
    edit,
    title,
    subtitle,
    loading,
    onClose,
    onSubmit,
    form,
    errors,
    handleAddRow,
    handleRefRow,
    handleDeleteRow,
    handleRowChange,
    inputData,
    bodyKey,
    addButtonText,
    handleChange,
    headerChildTitle,
    isAddButton = true,
    isRefrenceAction = false,
    RefrenceBtnText,
    bodyTitle,
    isView = false,
    contentLoading = false,
    contentSkeleton,
    isSummaryFooter,
    manualselected,
    enableLocation,
    isBodyColumnVisible,
    isBodyCellVisible,
    isBodyCellDisabled,
    checkAccount,
    setCheckAccount,
    onAccountSaved,
}: any) => {

    /* =================================================
       LOADED INPUT DATA

       inputData = original schema
       loadedInputData = schema + datasource options
    ================================================= */

    const [
        loadedInputData,
        setLoadedInputData,
    ] = useState<any>(
        inputData || {}
    );

    const [
        customMasterOptionsLoading,
        setCustomMasterOptionsLoading,
    ] = useState(false);

    /* =================================================
       BUILD CUSTOM MASTER SIGNATURE

       Prevents unnecessary datasource API calls when
       unrelated form values change.
    ================================================= */

    const customMasterSignature =
        useMemo(
            () => {
                const allFields = [
                    ...(
                        Array.isArray(
                            inputData?.header
                        )
                            ? inputData.header
                            : []
                    ),

                    ...(
                        Array.isArray(
                            inputData?.headerChild
                        )
                            ? inputData.headerChild
                            : []
                    ),

                    ...(
                        Array.isArray(
                            inputData?.body
                        )
                            ? inputData.body
                            : []
                    ),

                    ...(
                        Array.isArray(
                            inputData?.footer
                        )
                            ? inputData.footer
                            : []
                    ),
                ];

                return JSON.stringify(
                    allFields
                        .filter(
                            (
                                field: any
                            ) =>
                                isCustomMasterField(
                                    field
                                )
                        )
                        .map(
                            (
                                field: any
                            ) => ({
                                key:
                                    field?.key,

                                type:
                                    field?.type,

                                customMasterCode:
                                    field?.customMasterCode,

                                customMasterName:
                                    field?.customMasterName,

                                api:
                                    field?.api ||
                                    field?.dataSource?.api,

                                labelField:
                                    field?.labelField ||
                                    field?.dataSource?.labelField,

                                valueField:
                                    field?.valueField ||
                                    field?.dataSource?.valueField,

                                queryParams:
                                    field?.queryParams ||
                                    field?.dataSource?.queryParams,
                            })
                        )
                );
            },
            [
                inputData,
            ]
        );

    /* =================================================
       CALL COMMON loadFieldOptions

       This is the missing part from your previous code.
    ================================================= */

    useEffect(
        () => {
            if (
                !show
            ) {
                setLoadedInputData(
                    inputData ||
                    {}
                );

                setCustomMasterOptionsLoading(
                    false
                );

                return;
            }

            let isActive =
                true;

            const loadCustomMasterOptions =
                async () => {
                    try {
                        setCustomMasterOptionsLoading(
                            true
                        );

                        const [
                            updatedHeader,
                            updatedHeaderChild,
                            updatedBody,
                            updatedFooter,
                        ] =
                            await Promise.all([
                                loadCustomMasterSectionOptions(
                                    inputData?.header ||
                                    []
                                ),

                                loadCustomMasterSectionOptions(
                                    inputData?.headerChild ||
                                    []
                                ),

                                loadCustomMasterSectionOptions(
                                    inputData?.body ||
                                    []
                                ),

                                loadCustomMasterSectionOptions(
                                    inputData?.footer ||
                                    []
                                ),
                            ]);

                        if (
                            !isActive
                        ) {
                            return;
                        }

                        setLoadedInputData({
                            ...(
                                inputData ||
                                {}
                            ),

                            header:
                                updatedHeader,

                            headerChild:
                                updatedHeaderChild,

                            body:
                                updatedBody,

                            footer:
                                updatedFooter,
                        });
                    } catch (
                    error
                    ) {
                        console.log(
                            "Failed to load DynamicAddForm Custom Master options",

                            error
                        );

                        if (
                            isActive
                        ) {
                            setLoadedInputData(
                                inputData ||
                                {}
                            );
                        }
                    } finally {
                        if (
                            isActive
                        ) {
                            setCustomMasterOptionsLoading(
                                false
                            );
                        }
                    }
                };

            loadCustomMasterOptions();

            return () => {
                isActive =
                    false;
            };
        },
        [
            show,
            customMasterSignature,
        ]
    );

    /* =================================================
       KEEP NON-CUSTOM DATA UPDATED

       When schema changes but custom master definition
       is the same, retain current loaded options and
       refresh other schema sections.
    ================================================= */

    useEffect(
        () => {
            if (
                !show
            ) {
                return;
            }

            setLoadedInputData(
                (
                    previous:
                        any
                ) => {
                    if (
                        !previous
                    ) {
                        return (
                            inputData ||
                            {}
                        );
                    }

                    return {
                        ...(
                            inputData ||
                            {}
                        ),

                        header:
                            (
                                inputData?.header ||
                                []
                            ).map(
                                (
                                    field:
                                        any
                                ) => {
                                    const loadedField =
                                        (
                                            previous?.header ||
                                            []
                                        ).find(
                                            (
                                                item:
                                                    any
                                            ) =>
                                                item?.key ===
                                                field?.key
                                        );

                                    if (
                                        isCustomMasterField(
                                            field
                                        ) &&
                                        loadedField
                                    ) {
                                        return {
                                            ...field,

                                            options:
                                                loadedField
                                                    ?.options ||
                                                [],
                                        };
                                    }

                                    return field;
                                }
                            ),

                        headerChild:
                            (
                                inputData?.headerChild ||
                                []
                            ).map(
                                (
                                    field:
                                        any
                                ) => {
                                    const loadedField =
                                        (
                                            previous?.headerChild ||
                                            []
                                        ).find(
                                            (
                                                item:
                                                    any
                                            ) =>
                                                item?.key ===
                                                field?.key
                                        );

                                    if (
                                        isCustomMasterField(
                                            field
                                        ) &&
                                        loadedField
                                    ) {
                                        return {
                                            ...field,

                                            options:
                                                loadedField
                                                    ?.options ||
                                                [],
                                        };
                                    }

                                    return field;
                                }
                            ),

                        body:
                            (
                                inputData?.body ||
                                []
                            ).map(
                                (
                                    field:
                                        any
                                ) => {
                                    const loadedField =
                                        (
                                            previous?.body ||
                                            []
                                        ).find(
                                            (
                                                item:
                                                    any
                                            ) =>
                                                item?.key ===
                                                field?.key
                                        );

                                    if (
                                        isCustomMasterField(
                                            field
                                        ) &&
                                        loadedField
                                    ) {
                                        return {
                                            ...field,

                                            options:
                                                loadedField
                                                    ?.options ||
                                                [],
                                        };
                                    }

                                    return field;
                                }
                            ),

                        footer:
                            (
                                inputData?.footer ||
                                []
                            ).map(
                                (
                                    field:
                                        any
                                ) => {
                                    const loadedField =
                                        (
                                            previous?.footer ||
                                            []
                                        ).find(
                                            (
                                                item:
                                                    any
                                            ) =>
                                                item?.key ===
                                                field?.key
                                        );

                                    if (
                                        isCustomMasterField(
                                            field
                                        ) &&
                                        loadedField
                                    ) {
                                        return {
                                            ...field,

                                            options:
                                                loadedField
                                                    ?.options ||
                                                [],
                                        };
                                    }

                                    return field;
                                }
                            ),
                    };
                }
            );
        },
        [
            inputData,
            show,
        ]
    );

    /* =================================================
       CUSTOM MASTER CHANGE

       OUTPUT:

       customMasters: {
           "City Master": {
               code: "CIT-6",
               name: "computer software"
           }
       }
    ================================================= */

    const handleCustomMasterChange = (
        field: any,
        selectedValue: any
    ) => {
        const customMasterName =
            getCustomMasterName(
                field
            );

        if (
            !customMasterName
        ) {
            return;
        }

        const options =
            getCustomMasterOptions(
                field
            );

        const currentCustomMasters =
            form?.customMasters &&
                typeof form.customMasters ===
                "object" &&
                !Array.isArray(
                    form.customMasters
                )
                ? {
                    ...form.customMasters,
                }
                : {};

        /* ============================================
           CLEAR
        ============================================ */

        if (
            selectedValue ===
            undefined ||
            selectedValue ===
            null ||
            String(
                selectedValue
            ).trim() ===
            ""
        ) {
            delete currentCustomMasters[
                customMasterName
            ];

            handleChange(
                "customMasters",
                currentCustomMasters
            );

            return;
        }

        /* ============================================
           FIND SELECTED OPTION
        ============================================ */

        const selectedOption =
            options.find(
                (
                    option: any
                ) =>
                    String(
                        option?.value
                    ) ===
                    String(
                        selectedValue
                    )
            );

        if (
            !selectedOption
        ) {
            return;
        }

        const raw =
            selectedOption?.raw ||
            {};

        const nestedData =
            getCustomMasterRawData(
                raw
            );

        const valueField =
            field?.valueField ||
            field?.dataSource?.valueField ||
            "code";

        const labelField =
            field?.labelField ||
            field?.dataSource?.labelField ||
            "name";

        const code =
            selectedOption?.value ||
            raw?.[
            valueField
            ] ||
            nestedData?.[
            valueField
            ] ||
            raw?.code ||
            nestedData?.code ||
            "";

        const name =
            selectedOption?.label ||
            raw?.[
            labelField
            ] ||
            nestedData?.[
            labelField
            ] ||
            raw?.name ||
            nestedData?.name ||
            "";

        const updatedCustomMasters = {
            ...currentCustomMasters,

            [customMasterName]: {
                code:
                    String(
                        code
                    ),

                name:
                    String(
                        name
                    ),
            },
        };

        /*
         * IMPORTANT:
         *
         * Do not call:
         *
         * handleChange(
         *     field.key,
         *     selectedValue
         * );
         *
         * because that creates an unwanted
         * transaction field.
         *
         * We only store customMasters.
         */

        handleChange(
            "customMasters",
            updatedCustomMasters
        );
    };

    /* =================================================
       RENDER INPUT
    ================================================= */

    const renderInput = (
        field: any
    ) => {
        const fieldType =
            getDynamicFieldType(
                field
            );

        /* ============================================
           DATE
        ============================================ */

        if (
            fieldType ===
            "date"
        ) {
            return (
                <TextInput
                    label={
                        field?.label
                    }
                    mandatory={
                        field?.isRequired
                    }
                    disabled={
                        field?.disabled ==
                        true ||
                        field?.disabled ==
                        "true" ||
                        field?.isReadonly ==
                        true ||
                        field?.isReadonly ==
                        "true"
                    }
                    read
                    type={
                        field.type
                    }
                    value={
                        form?.[
                            field?.key
                        ]
                            ? String(
                                form?.[
                                field?.key
                                ]
                            ).split(
                                "T"
                            )[0]
                            : ""
                    }
                    error={
                        errors?.[
                        field?.key
                        ]
                    }
                    onChange={(
                        event:
                            any
                    ) =>
                        handleChange(
                            field?.key,

                            event
                                .target
                                .value
                        )
                    }
                />
            );
        }

        /* ============================================
           TEXTAREA
        ============================================ */

        if (
            fieldType ===
            "textarea"
        ) {
            return (
                <TextArea
                    label={
                        field?.label
                    }
                    mandatory={
                        field?.isRequired
                    }
                    value={
                        form?.[
                        field?.key
                        ] ||
                        ""
                    }
                    placeholder={
                        field?.placeholder
                    }
                    error={
                        errors?.[
                        field?.key
                        ]
                    }
                    onChange={(
                        event:
                            any
                    ) =>
                        handleChange(
                            field?.key,

                            event
                                .target
                                .value
                        )
                    }
                />
            );
        }

        /* ============================================
           TOGGLE / BOOLEAN
        ============================================ */

        if (
            fieldType ===
            "toggle" ||
            fieldType ===
            "boolean"
        ) {
            const booleanValue =
                form?.[
                field.key
                ] ===
                true ||
                form?.[
                field.key
                ] ===
                "true" ||
                form?.[
                field.key
                ] ===
                1 ||
                form?.[
                field.key
                ] ===
                "1";

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
                        field.isRequired ??
                        field.required
                    }
                    disabled={
                        field?.disabled ==
                        true ||
                        field?.disabled ==
                        "true" ||
                        field?.isReadonly ==
                        true ||
                        field?.isReadonly ==
                        "true"
                    }
                    error={
                        errors?.[
                        field.key
                        ]
                    }
                    onChange={(
                        event:
                            any
                    ) =>
                        handleChange(
                            field.key,

                            event
                                .target
                                .checked
                        )
                    }
                />
            );
        }

        /* ============================================
           CUSTOM MASTER

           Supported:
           custommaster
           customemaster
           dataSource.type = customMaster
        ============================================ */

        if (
            isCustomMasterField(
                field
            )
        ) {
            const options =
                getCustomMasterOptions(
                    field
                );

            const selectedValue =
                getCustomMasterSelectedCode(
                    form,
                    field
                );

            const customMasterName =
                getCustomMasterName(
                    field
                );

            return (
                <SelectInput
                    label={
                        field?.label ||
                        customMasterName
                    }
                    value={
                        selectedValue
                    }
                    mandatory={
                        field?.isRequired ||
                        field?.required
                    }
                    placeholder={`Select ${field?.label ||
                        customMasterName
                        }`}
                    disabled={

                        field?.disabled == "true" || field?.disabled == true ||
                        field?.isReadonly == "true" || field?.isReadonly == true ||
                        customMasterOptionsLoading
                    }
                    error={
                        errors?.[
                        field?.key
                        ]
                    }
                    largeData={
                        true
                    }
                    onChange={(
                        event:
                            any
                    ) => {
                        handleCustomMasterChange(
                            field,

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
                                customMasterOptionsLoading
                                    ? `Loading ${field?.label ||
                                    customMasterName
                                    }...`
                                    : options.length >
                                        0
                                        ? `Select ${field?.label ||
                                        customMasterName
                                        }`
                                        : `No ${field?.label ||
                                        customMasterName
                                        } found`,
                        },

                        ...options,
                    ]}
                />
            );
        }

        /* ============================================
           NORMAL SELECT
        ============================================ */

        if (
            fieldType ===
            "select"
        ) {
            const options =
                (
                    field?.options ||
                    []
                ).map(
                    (
                        option:
                            any
                    ) => {
                        if (
                            typeof option ===
                            "object"
                        ) {
                            return {
                                label:
                                    option
                                        .label ||
                                    option
                                        .name ||
                                    option
                                        .value ||
                                    "",

                                value:
                                    option
                                        .value ||
                                    option
                                        .code ||
                                    option
                                        .name ||
                                    "",
                            };
                        }

                        return {
                            label:
                                option,

                            value:
                                option,
                        };
                    }
                );

            /* ============================================
               CREATABLE SELECT
            ============================================ */

            if (
                typeof field
                    ?.onCreateOption ===
                "function"
            ) {
                return (
                    <CreatableSelectInput
                        label={
                            field?.label
                        }
                        value={
                            form?.[
                            field?.key
                            ] ??
                            ""
                        }
                        mandatory={
                            field?.isRequired
                        }
                        placeholder={
                            field?.placeholder ||
                            `Select ${field?.label}`
                        }
                        disabled={
                            field?.disabled ||
                            field?.isReadonly
                        }
                        error={
                            errors?.[
                            field?.key
                            ]
                        }
                        largeData={
                            field?.largeData ??
                            true
                        }
                        onCreateOption={
                            field?.onCreateOption
                        }
                        createOptionLabel={
                            field?.createOptionLabel
                        }
                        showCreateOnEmpty={
                            field?.showCreateOnEmpty ??
                            true
                        }
                        onChange={(
                            event:
                                any
                        ) =>
                            handleChange(
                                field?.key,

                                event
                                    .target
                                    .value
                            )
                        }
                        options={
                            options
                        }
                    />
                );
            }

            /* ============================================
               NORMAL SELECT
            ============================================ */

            return (
                <SelectInput
                    label={
                        field?.label
                    }
                    value={
                        form?.[
                        field?.key
                        ] ||
                        ""
                    }
                    mandatory={
                        field?.isRequired
                    }
                    placeholder={
                        field?.placeholder
                    }
                    disabled={
                        field?.disabled ||
                        field?.isReadonly
                    }
                    error={
                        errors?.[
                        field?.key
                        ]
                    }
                    onChange={(
                        event:
                            any
                    ) =>
                        handleChange(
                            field?.key,

                            event
                                .target
                                .value
                        )
                    }
                    options={[
                        {
                            label:
                                `Select ${field?.label}`,

                            value:
                                "",
                        },

                        ...options,
                    ]}
                />
            );
        }

        /* ============================================
           NORMAL INPUT
        ============================================ */

        return (
            <TextInput
                label={
                    field?.label
                }
                mandatory={
                    field?.isRequired
                }
                value={
                    form?.[
                    field?.key
                    ] ||
                    ""
                }
                type={
                    field?.type ||
                    "text"
                }
                disabled={
                    field?.disabled ==
                    true ||
                    field?.disabled ==
                    "true" ||
                    field?.isReadonly ==
                    true ||
                    field?.isReadonly ==
                    "true"
                }
                placeholder={
                    field?.placeholder
                }
                error={
                    errors?.[
                    field?.key
                    ]
                }
                onChange={(
                    event:
                        any
                ) =>
                    handleChange(
                        field?.key,

                        event
                            .target
                            .value
                    )
                }
            />
        );
    };

    /* =================================================
       UI
    ================================================= */

    return (
        <VoucherFormModal
            isView={
                isView
            }
            show={
                show
            }
            setShow={
                setShow
            }
            edit={
                edit
            }
            title={
                title
            }
            subtitle={
                subtitle
            }
            loading={
                loading
            }
            onClose={
                onClose
            }
            onSubmit={
                onSubmit
            }
        >
            <div className="w-full max-w-full text-card-foreground h-full">

                {contentLoading ? (
                    contentSkeleton || (
                        <DynamicFormContentSkeleton
                            headerFields={
                                5
                            }
                            bodyRows={
                                2
                            }
                            bodyColumns={
                                7
                            }
                            footerFields={
                                6
                            }
                        />
                    )
                ) : (
                    <>
                            {/* ============================================
                            HEADER
                        ============================================ */}

                        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-3">
                                {loadedInputData?.header?.map(
                                (
                                        field:
                                            any,

                                        index:
                                            number
                                ) => {
                                    if (
                                        field?.isHidden ==
                                        "true" ||
                                        field?.isHidden ==
                                        true ||
                                        field?.isHidden ==
                                        1
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <div
                                            key={
                                                field?.key ||
                                                index
                                            }
                                        >
                                            {renderInput(
                                                field
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>

                            {/* ============================================
                            HEADER CHILD
                        ============================================ */}

                            {loadedInputData
                                ?.headerChild &&
                                loadedInputData
                                    .headerChild
                                    .length >
                                0 && (
                                <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                                    <div className="mb-4 border-b border-border pb-3">
                                        <h1 className="text-lg font-bold text-card-foreground">
                                            {
                                                headerChildTitle
                                            }
                                        </h1>
                                    </div>

                                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
                                        {loadedInputData
                                            .headerChild
                                            .map(
                                                (
                                                    field:
                                                        any,

                                                    index:
                                                        number
                                                ) => {
                                                    if (
                                                        field?.isHidden
                                                    ) {
                                                        return null;
                                                    }

                                                    return (
                                                        <div
                                                            key={
                                                                field?.key ||
                                                                index
                                                            }
                                                        >
                                                            {renderInput(
                                                                field
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            )}
                                    </div>
                                </div>
                            )}

                            {/* ============================================
                            LOCATION
                        ============================================ */}

                        {enableLocation && (
                            <LocationSection
                                    form={
                                        form
                                    }
                                    handleChange={
                                        handleChange
                                    }
                            />
                        )}

                            {/* ============================================
                            BODY ERROR
                        ============================================ */}

                            {errors?.[
                                bodyKey
                            ] && (
                                    <p className="mt-4 text-sm text-danger">
                                        {
                                            errors?.[
                                            bodyKey
                                            ]
                                        }
                                    </p>
                                )}

                            {/* ============================================
                            LINE TABLE
                        ============================================ */}

                        {!manualselected && (
                            <div className="mt-3 w-full max-w-full">
                                <EditableLineTable
                                        isView={
                                            isView
                                        }
                                        bodyTitle={
                                            bodyTitle ||
                                            "Products"
                                        }
                                    addButtonText={
                                        addButtonText ||
                                        "Add Product"
                                    }
                                        rows={
                                            form?.[
                                            bodyKey
                                            ] ||
                                            []
                                        }
                                        columns={
                                            loadedInputData?.body ||
                                            []
                                    }
                                        errors={
                                            errors
                                        }
                                        onAddRow={
                                            handleAddRow
                                        }
                                        onRefrenceRow={
                                            handleRefRow
                                        }
                                        onDeleteRow={
                                            handleDeleteRow
                                        }
                                        onChange={
                                            handleRowChange
                                        }
                                    emptyText="No products added"
                                        isAddButton={
                                            isAddButton
                                        }
                                        RefrenceBtnText={
                                            RefrenceBtnText
                                        }
                                        isRefrenceAction={
                                            isRefrenceAction
                                        }
                                        isColumnVisible={
                                            isBodyColumnVisible
                                        }
                                        isCellVisible={
                                            isBodyCellVisible
                                        }
                                        isCellDisabled={
                                            isBodyCellDisabled
                                        }
                                />
                            </div>
                        )}

                            {/* ============================================
                            TAX ERRORS
                        ============================================ */}

                            {Object.keys(
                                errors ||
                                {}
                            )
                                .filter(
                                    (
                                        key
                                    ) =>
                                        key.includes(
                                            "_tax"
                                        )
                                )
                                .map(
                                    (
                                        key
                                    ) => (
                                        <p
                                            key={
                                                key
                                            }
                                            className="mt-2 text-sm text-danger"
                                        >
                                            {
                                                errors[
                                                key
                                                ]
                                            }
                                        </p>
                                    )
                                )}

                            {/* ============================================
                            SUMMARY
                        ============================================ */}

                        <SummaryCards
                                items={
                                    loadedInputData?.footer ||
                                    []
                                }
                                isSummaryFooter={
                                    isSummaryFooter
                                }
                        />
                    </>
                )}
            </div>

            {/* ============================================
                ACCOUNT MASTER MODAL
            ============================================ */}

            <AccountMasterModal
                show={
                    Boolean(
                        checkAccount
                    )
                }
                setShow={(
                    value:
                        boolean
                ) => {
                    if (
                        typeof setCheckAccount ===
                        "function"
                    ) {
                        setCheckAccount(
                            value
                        );
                    }
                }}
                onSaved={(
                    savedAccount:
                        any
                ) => {
                    if (
                        typeof onAccountSaved ===
                        "function"
                    ) {
                        onAccountSaved(
                            savedAccount
                        );
                    }
                }}
            />
        </VoucherFormModal>
    );
};

export default DynamicAddForm;