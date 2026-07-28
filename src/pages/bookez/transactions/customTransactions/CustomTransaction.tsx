import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Edit,
    Trash2,
} from "lucide-react";

import {
    useDispatch,
    useSelector,
} from "react-redux";

import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
    formatDateForInput,
    formatDateForList,
    loadAllTemplateOptions,
    money,
    num,
    safePercent,
    todayYMD,
} from "../../../../utils/helperFunctions";

import { getAllTransactionSchema } from "../../../../redux/slices/professionalSlice/transactionSchema";

import Badge from "../../../../components/badge";
import SearchInput from "../../../../components/searchInput";

import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../components/buttons";

import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";

import {
    deleteCustomTransactionData,
    getAllCustomTransactionData,
    saveCustomTransactionData,
    updateCustomTransactionData,
} from "../../../../redux/slices/professionalSlice/customTransaction/customTransactionSlice";

/* ===================================================
   TYPES
=================================================== */

type CustomTransactionProps = {
    moduleCode?: string;
    moduleName?: string;
};

/* ===================================================
   CONSTANTS
=================================================== */

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const EMPTY_TEMPLATE_FIELDS = {
    header: [],
    body: [],
    footer: [],
};

const hasValue = (value: any) =>
    value !== undefined &&
    value !== null &&
    value !== "";

const cloneValue = (value: any) => {
    if (Array.isArray(value)) {
        return [...value];
    }

    if (
        value &&
        typeof value === "object"
    ) {
        return {
            ...value,
        };
    }

    return value;
};

const CustomTransaction = ({
    moduleCode: moduleCodeFromProps = "",
    moduleName: moduleNameFromProps = "",
}: CustomTransactionProps) => {
    const dispatch = useDispatch<any>();

    const {
        moduleCode: moduleCodeFromRoute = "",
    } = useParams<{
        moduleCode: string;
    }>();

    const moduleCode =
        moduleCodeFromProps ||
        moduleCodeFromRoute;

    const customTransactionState =
        useSelector(
            (state: any) =>
                state.customTransaction ||
                state.customTransactionData ||
                {}
        );

    const {
        transactionsSchema,
    } = useSelector(
        (state: any) =>
            state.getAllTransactionSchema ||
            {}
    );

    const transactionItems =
        customTransactionState?.customTransactiondata ||
        customTransactionState?.customTransactionData ||
        [];

    const pagination =
        customTransactionState?.pagination ||
        defaultPagination;

    const loading =
        customTransactionState?.loading ||
        false;

    const createLoading =
        customTransactionState?.createLoading ||
        false;

    const updateLoading =
        customTransactionState?.updateLoading ||
        false;

    const deleteLoading =
        customTransactionState?.deleteLoading ||
        false;

    const [
        localOffset,
        setLocalOffset,
    ] = useState(0);

    const [
        localLimit,
        setLocalLimit,
    ] = useState(10);

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        debouncedSearch,
        setDebouncedSearch,
    ] = useState("");

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        showModal,
        setShowModal,
    ] = useState(false);

    const [
        editingVoucherNumber,
        setEditingVoucherNumber,
    ] = useState<string | null>(
        null
    );

    const [
        form,
        setForm,
    ] = useState<any>({
        body: [],
    });

    const [
        errors,
        setErrors,
    ] = useState<
        Record<string, string>
    >({});

    const [
        templateFields,
        setTemplateFields,
    ] = useState<any>(
        EMPTY_TEMPLATE_FIELDS
    );

    const [
        fieldsLoading,
        setFieldsLoading,
    ] = useState(false);

    const [
        confirmTooltip,
        setConfirmTooltip,
    ] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });

    /* ===================================================
       FIELD DEFAULTS
    =================================================== */

    const getFieldDefaultValue = (
        field: any
    ) => {
        if (
            field?.defaultValue !==
            undefined
        ) {
            return cloneValue(
                field.defaultValue
            );
        }

        const fieldType = String(
            field?.type || ""
        ).toLowerCase();

        const fieldKey = String(
            field?.key || ""
        ).toLowerCase();

        if (
            fieldType === "checkbox" ||
            fieldType === "boolean" ||
            fieldType === "switch"
        ) {
            return false;
        }

        if (
            fieldType === "multiselect" ||
            fieldType === "multi-select"
        ) {
            return [];
        }

        if (
            fieldType === "date" &&
            fieldKey.includes("date")
        ) {
            return todayYMD();
        }

        return "";
    };

    const buildSectionDefaults = (
        fields: any[] = []
    ) => {
        return fields.reduce(
            (
                accumulator: any,
                field: any
            ) => {
                if (!field?.key) {
                    return accumulator;
                }

                accumulator[field.key] =
                    getFieldDefaultValue(
                        field
                    );

                return accumulator;
            },
            {}
        );
    };

    const buildEmptyBodyRow = (
        fields =
            templateFields?.body ||
            []
    ) => ({
        id: `${Date.now()}-${Math.random()}`,

        ...buildSectionDefaults(
            fields
        ),
    });

    const buildBlankForm = (
        fields = templateFields
    ) => {
        const headerDefaults =
            buildSectionDefaults(
                fields?.header || []
            );

        const footerDefaults =
            buildSectionDefaults(
                fields?.footer || []
            );

        return {
            ...headerDefaults,
            ...footerDefaults,

            body:
                (
                    fields?.body ||
                    []
                ).length > 0
                    ? [
                        buildEmptyBodyRow(
                            fields.body
                        ),
                    ]
                    : [],
        };
    };

    /* ===================================================
       FIELD HELPERS
    =================================================== */

    const getHeaderFieldByKey = (
        key: string
    ) => {
        return templateFields?.header?.find(
            (field: any) =>
                field?.key === key
        );
    };

    const getBodyFieldByKey = (
        key: string
    ) => {
        return templateFields?.body?.find(
            (field: any) =>
                field?.key === key
        );
    };

    const getOptionByValue = (
        field: any,
        selectedValue: any
    ) => {
        return field?.options?.find(
            (option: any) =>
                String(option?.value) ===
                String(selectedValue)
        );
    };

    const applyMappedFields = (
        field: any,
        selectedValue: any,
        oldData: any
    ) => {
        if (!field) {
            return oldData;
        }

        const selectedOption =
            getOptionByValue(
                field,
                selectedValue
            );

        const updated = {
            ...oldData,

            [field.key]:
                selectedValue,
        };

        if (
            field?.mapFields &&
            selectedOption?.raw
        ) {
            Object.entries(
                field.mapFields
            ).forEach(
                ([
                    targetKey,
                    sourceKey,
                ]) => {
                    updated[targetKey] =
                        selectedOption
                            .raw?.[
                        sourceKey as string
                        ] ?? "";
                }
            );
        }

        return updated;
    };

    const normalizeDateValue = (
        field: any,
        value: any
    ) => {
        const fieldType = String(
            field?.type || ""
        ).toLowerCase();

        if (
            fieldType === "date" &&
            value
        ) {
            return formatDateForInput(
                value
            );
        }

        return value;
    };

    /* ===================================================
       GENERIC BODY CALCULATION
    =================================================== */

    const calculateRow = (
        row: any
    ) => {
        const bodyKeys = new Set(
            (
                templateFields?.body ||
                []
            ).map(
                (field: any) =>
                    field?.key
            )
        );

        const canCalculateGross =
            bodyKeys.has("quantity") &&
            bodyKeys.has("rate");

        if (!canCalculateGross) {
            return row;
        }

        const quantity = num(
            row?.quantity
        );

        const rate = num(
            row?.rate
        );

        const grossAmount =
            quantity * rate;

        const discountPercentage =
            safePercent(
                hasValue(
                    row?.discountPercentage
                )
                    ? row
                        .discountPercentage
                    : row?.discount
            );

        const cgstPercentage =
            safePercent(
                hasValue(
                    row?.cgstPercentage
                )
                    ? row
                        .cgstPercentage
                    : row?.cgst
            );

        const sgstPercentage =
            safePercent(
                hasValue(
                    row?.sgstPercentage
                )
                    ? row
                        .sgstPercentage
                    : row?.sgst
            );

        const igstPercentage =
            safePercent(
                hasValue(
                    row?.igstPercentage
                )
                    ? row
                        .igstPercentage
                    : row?.igst
            );

        const discountAmount =
            (grossAmount *
                discountPercentage) /
            100;

        const taxableAmount =
            grossAmount -
            discountAmount;

        const cgstAmount =
            (taxableAmount *
                cgstPercentage) /
            100;

        const sgstAmount =
            (taxableAmount *
                sgstPercentage) /
            100;

        const igstAmount =
            (taxableAmount *
                igstPercentage) /
            100;

        const taxAmount =
            cgstAmount +
            sgstAmount +
            igstAmount;

        const otherAmount = num(
            row?.otherAmount
        );

        const netAmount =
            taxableAmount +
            taxAmount +
            otherAmount;

        return {
            ...row,

            gross:
                grossAmount,

            grossAmount,

            discountAmount,

            taxableAmount,

            cgstAmount,

            sgstAmount,

            igstAmount,

            taxAmount,

            netAmount,

            netTotal:
                netAmount,
        };
    };

    /* ===================================================
       FOOTER CALCULATION
    =================================================== */

    const calculatedFooterValues =
        useMemo(() => {
            const rows =
                form?.body || [];

            const standardTotals =
                rows.reduce(
                    (
                        accumulator: any,
                        row: any
                    ) => {
                        accumulator.totalQuantity +=
                            num(
                                row?.quantity
                            );

                        accumulator.grossAmount +=
                            num(
                                row?.grossAmount ??
                                row?.gross
                            );

                        accumulator.discountAmount +=
                            num(
                                row?.discountAmount
                            );

                        accumulator.taxableAmount +=
                            num(
                                row?.taxableAmount
                            );

                        accumulator.cgstAmount +=
                            num(
                                row?.cgstAmount
                            );

                        accumulator.sgstAmount +=
                            num(
                                row?.sgstAmount
                            );

                        accumulator.igstAmount +=
                            num(
                                row?.igstAmount
                            );

                        accumulator.taxAmount +=
                            num(
                                row?.taxAmount
                            );

                        accumulator.otherAmount +=
                            num(
                                row?.otherAmount
                            );

                        accumulator.netAmount +=
                            num(
                                row?.netAmount ??
                                row?.netTotal
                            );

                        return accumulator;
                    },
                    {
                        totalQuantity:
                            0,

                        grossAmount:
                            0,

                        discountAmount:
                            0,

                        taxableAmount:
                            0,

                        cgstAmount:
                            0,

                        sgstAmount:
                            0,

                        igstAmount:
                            0,

                        taxAmount:
                            0,

                        otherAmount:
                            0,

                        netAmount:
                            0,
                    }
                );

            const footer: Record<
                string,
                any
            > = {};

            (
                templateFields?.footer ||
                []
            ).forEach(
                (field: any) => {
                    const key =
                        field?.key;

                    if (!key) {
                        return;
                    }

                    const standardMap: Record<
                        string,
                        any
                    > = {
                        totalQuantity:
                            standardTotals.totalQuantity,

                        grossAmount:
                            standardTotals.grossAmount,

                        totalGrossAmount:
                            standardTotals.grossAmount,

                        discountAmount:
                            standardTotals.discountAmount,

                        totalDiscountAmount:
                            standardTotals.discountAmount,

                        taxableAmount:
                            standardTotals.taxableAmount,

                        totalTaxableAmount:
                            standardTotals.taxableAmount,

                        cgstAmount:
                            standardTotals.cgstAmount,

                        totalCgstAmount:
                            standardTotals.cgstAmount,

                        sgstAmount:
                            standardTotals.sgstAmount,

                        totalSgstAmount:
                            standardTotals.sgstAmount,

                        igstAmount:
                            standardTotals.igstAmount,

                        totalIgstAmount:
                            standardTotals.igstAmount,

                        taxAmount:
                            standardTotals.taxAmount,

                        totalTaxAmount:
                            standardTotals.taxAmount,

                        otherAmount:
                            standardTotals.otherAmount,

                        totalOtherAmount:
                            standardTotals.otherAmount,

                        netAmount:
                            standardTotals.netAmount,

                        totalNetAmount:
                            standardTotals.netAmount,
                    };

                    if (
                        standardMap[
                        key
                        ] !== undefined
                    ) {
                        footer[key] =
                            standardMap[
                            key
                            ];

                        return;
                    }

                    if (
                        key ===
                        "adjustedAmount"
                    ) {
                        footer[key] =
                            num(
                                form?.[
                                key
                                ]
                            );

                        return;
                    }

                    if (
                        key ===
                        "balanceAmount"
                    ) {
                        footer[key] =
                            standardTotals.netAmount -
                            num(
                                form?.adjustedAmount
                            );

                        return;
                    }

                    const bodyHasSameField =
                        (
                            templateFields?.body ||
                            []
                        ).some(
                            (
                                bodyField: any
                            ) =>
                                bodyField?.key ===
                                key
                        );

                    if (
                        bodyHasSameField
                    ) {
                        footer[key] =
                            rows.reduce(
                                (
                                    sum: number,
                                    row: any
                                ) =>
                                    sum +
                                    num(
                                        row?.[
                                        key
                                        ]
                                    ),
                                0
                            );

                        return;
                    }

                    footer[key] =
                        form?.[key] ??
                        getFieldDefaultValue(
                            field
                        );
                }
            );

            return footer;
        }, [
            form,
            templateFields,
        ]);

    const footerTotals =
        useMemo(() => {
            return {
                ...calculatedFooterValues,

                totalGrossAmount:
                    calculatedFooterValues
                        ?.totalGrossAmount ??
                    calculatedFooterValues
                        ?.grossAmount ??
                    0,

                totalDiscountAmount:
                    calculatedFooterValues
                        ?.totalDiscountAmount ??
                    calculatedFooterValues
                        ?.discountAmount ??
                    0,

                totalCgstAmount:
                    calculatedFooterValues
                        ?.totalCgstAmount ??
                    calculatedFooterValues
                        ?.cgstAmount ??
                    0,

                totalSgstAmount:
                    calculatedFooterValues
                        ?.totalSgstAmount ??
                    calculatedFooterValues
                        ?.sgstAmount ??
                    0,

                totalIgstAmount:
                    calculatedFooterValues
                        ?.totalIgstAmount ??
                    calculatedFooterValues
                        ?.igstAmount ??
                    0,

                totalTaxAmount:
                    calculatedFooterValues
                        ?.totalTaxAmount ??
                    calculatedFooterValues
                        ?.taxAmount ??
                    0,

                totalOtherAmount:
                    calculatedFooterValues
                        ?.totalOtherAmount ??
                    calculatedFooterValues
                        ?.otherAmount ??
                    0,

                totalNetAmount:
                    calculatedFooterValues
                        ?.totalNetAmount ??
                    calculatedFooterValues
                        ?.netAmount ??
                    0,
            };
        }, [
            calculatedFooterValues,
        ]);

    const dynamicFooterArray =
        useMemo(() => {
            return (
                templateFields?.footer ||
                []
            )
                .filter(
                    (field: any) =>
                        !field?.isHidden
                )
                .map(
                    (field: any) => {
                        const rawValue =
                            calculatedFooterValues?.[
                            field
                                .key
                            ] ?? "";

                        const fieldType =
                            String(
                                field?.type ||
                                ""
                            ).toLowerCase();

                        const isMoneyField =
                            fieldType ===
                            "currency" ||
                            fieldType ===
                            "amount" ||
                            String(
                                field?.key ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    "amount"
                                );

                        return {
                            ...field,

                            rawValue,

                            value:
                                isMoneyField
                                    ? money(
                                        rawValue ||
                                        0
                                    )
                                    : rawValue,
                        };
                    }
                );
        }, [
            templateFields?.footer,
            calculatedFooterValues,
        ]);

    /* ===================================================
       API CALLS
    =================================================== */

    const fetchTransactions =
        async () => {
            if (!moduleCode) {
                return;
            }

            await dispatch(
                getAllCustomTransactionData(
                    {
                        offset:
                            localOffset,

                        limit:
                            localLimit,

                        search:
                            debouncedSearch,

                        status:
                            "active",

                        moduleCode,
                    }
                )
            );
        };

    useEffect(() => {
        if (!moduleCode) {
            return;
        }

        /*
         * When module changes, reset listing state.
         */
        setLocalOffset(0);
        setSearch("");
        setDebouncedSearch("");
        setShowModal(false);
        setEditingVoucherNumber(
            null
        );

        dispatch(
            getAllTransactionSchema(
                moduleCode
            )
        );
    }, [
        dispatch,
        moduleCode,
    ]);

    useEffect(() => {
        fetchTransactions();
    }, [
        moduleCode,
        localOffset,
        localLimit,
        debouncedSearch,
    ]);

    useEffect(() => {
        const timer = setTimeout(
            () => {
                setDebouncedSearch(
                    search.trim()
                );

                setLocalOffset(0);
            },
            400
        );

        return () =>
            clearTimeout(timer);
    }, [search]);

    /* ===================================================
       LOAD SCHEMA OPTIONS
    =================================================== */

    useEffect(() => {
        const prepareFields =
            async () => {
                if (
                    !transactionsSchema
                ) {
                    return;
                }

                const hasSchema =
                    Array.isArray(
                        transactionsSchema?.header
                    ) ||
                    Array.isArray(
                        transactionsSchema?.body
                    ) ||
                    Array.isArray(
                        transactionsSchema?.footer
                    );

                if (!hasSchema) {
                    return;
                }

                try {
                    setFieldsLoading(
                        true
                    );

                    const updatedFields =
                        await loadAllTemplateOptions(
                            transactionsSchema
                        );

                    setTemplateFields(
                        updatedFields
                    );

                    setForm(
                        buildBlankForm(
                            updatedFields
                        )
                    );

                    setErrors({});

                    setEditingVoucherNumber(
                        null
                    );
                } catch (error) {
                    console.error(
                        "Failed to prepare custom transaction fields",
                        error
                    );

                    toast.error(
                        "Failed to load custom transaction fields"
                    );
                } finally {
                    setFieldsLoading(
                        false
                    );
                }
            };

        prepareFields();
    }, [
        transactionsSchema,
        moduleCode,
    ]);

    /* ===================================================
       MODULE NAME
    =================================================== */

    const resolvedModuleName =
        useMemo(() => {
            const moduleNameField =
                templateFields?.header?.find(
                    (field: any) =>
                        field?.key ===
                        "moduleName"
                );

            return (
                moduleNameFromProps ||
                transactionsSchema?.moduleName ||
                moduleNameField?.defaultValue ||
                moduleCode ||
                "Custom Transaction"
            );
        }, [
            moduleNameFromProps,
            templateFields,
            transactionsSchema,
            moduleCode,
        ]);

    /* ===================================================
       LIST COLUMNS
    =================================================== */

    const displayFieldValue = (
        field: any,
        value: any
    ) => {
        if (!hasValue(value)) {
            return "-";
        }

        if (Array.isArray(value)) {
            return value.join(", ");
        }

        if (
            typeof value ===
            "boolean"
        ) {
            return value
                ? "Yes"
                : "No";
        }

        const fieldType = String(
            field?.type || ""
        ).toLowerCase();

        if (fieldType === "date") {
            return formatDateForList(
                value
            );
        }

        const option =
            getOptionByValue(
                field,
                value
            );

        if (option?.label) {
            return option.label;
        }

        return String(value);
    };

    const columns = useMemo(() => {
        const excludedHeaderKeys =
            new Set([
                "moduleCode",
                "moduleName",
                "voucherNumber",
                "status",
                "ownerUser",
            ]);

        const dynamicColumns = (
            templateFields?.header ||
            []
        )
            .filter(
                (field: any) =>
                    !field?.isHidden &&
                    !excludedHeaderKeys.has(
                        field?.key
                    )
            )
            .slice(0, 4)
            .map(
                (field: any) => ({
                    key:
                        field.key,

                    title:
                        field.label ||
                        field.key,

                    render: (
                        record: any
                    ) =>
                        displayFieldValue(
                            field,

                            record
                                ?.data
                                ?.header?.[
                            field
                                .key
                            ] ??
                            record
                                ?.header?.[
                            field
                                .key
                            ] ??
                            record?.[
                            field
                                .key
                            ]
                        ),
                })
            );

        return [
            {
                key:
                    "voucherNumber",

                title:
                    "Voucher No",

                render: (
                    record: any
                ) => (
                    <span className="font-medium text-card-foreground">
                        {record?.voucherNumber ||
                            "-"}
                    </span>
                ),
            },

            ...dynamicColumns,

            {
                key: "body",

                title: "Items",

                render: (
                    record: any
                ) =>
                    record?.data
                        ?.body
                        ?.length ||
                    record?.body
                        ?.length ||
                    0,
            },

            {
                key: "status",

                title: "Status",

                render: (
                    record: any
                ) => (
                    <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                        {record?.status ||
                            "active"}
                    </span>
                ),
            },
        ];
    }, [
        templateFields,
    ]);

    /* ===================================================
       FORM RESET / OPEN
    =================================================== */

    const resetForm = () => {
        setEditingVoucherNumber(
            null
        );

        setErrors({});

        setForm(
            buildBlankForm()
        );
    };

    const openAddModal = () => {
        resetForm();

        setShowModal(true);
    };

    const openEditModal = (
        record: any
    ) => {
        /*
         * The complete selected record from the listing
         * is passed directly into this function.
         *
         * No get-single API is called.
         */
        const transactionData =
            record?.data ||
            record?.transactionData ||
            record ||
            {};

        const headerData =
            transactionData?.header ||
            record?.header ||
            {};

        const footerData =
            transactionData?.footer ||
            record?.footer ||
            {};

        const bodyData =
            Array.isArray(
                transactionData?.body
            )
                ? transactionData.body
                : Array.isArray(
                    record?.body
                )
                    ? record.body
                    : [];

        const normalizedHeader =
            (
                templateFields?.header ||
                []
            ).reduce(
                (
                    accumulator: any,
                    field: any
                ) => {
                    const value =
                        headerData?.[
                        field
                            .key
                        ] ??
                        getFieldDefaultValue(
                            field
                        );

                    accumulator[
                        field.key
                    ] =
                        normalizeDateValue(
                            field,
                            value
                        );

                    return accumulator;
                },
                {}
            );

        const normalizedFooter =
            (
                templateFields?.footer ||
                []
            ).reduce(
                (
                    accumulator: any,
                    field: any
                ) => {
                    accumulator[
                        field.key
                    ] =
                        footerData?.[
                        field
                            .key
                        ] ??
                        getFieldDefaultValue(
                            field
                        );

                    return accumulator;
                },
                {}
            );

        const normalizedBody =
            bodyData.length > 0
                ? bodyData.map(
                    (
                        row: any
                    ) => {
                        const normalizedRow =
                            (
                                templateFields?.body ||
                                []
                            ).reduce(
                                (
                                    accumulator: any,
                                    field: any
                                ) => {
                                    const value =
                                        row?.[
                                        field
                                            .key
                                        ] ??
                                        getFieldDefaultValue(
                                            field
                                        );

                                    accumulator[
                                        field.key
                                    ] =
                                        normalizeDateValue(
                                            field,
                                            value
                                        );

                                    return accumulator;
                                },
                                {}
                            );

                        /*
                         * Support direct API field names.
                         */
                        if (
                            normalizedRow.grossAmount ===
                            undefined ||
                            normalizedRow.grossAmount ===
                            ""
                        ) {
                            normalizedRow.grossAmount =
                                row?.grossAmount ??
                                row?.gross ??
                                "";
                        }

                        if (
                            normalizedRow.gross ===
                            undefined ||
                            normalizedRow.gross ===
                            ""
                        ) {
                            normalizedRow.gross =
                                row?.gross ??
                                row?.grossAmount ??
                                "";
                        }

                        if (
                            normalizedRow.netAmount ===
                            undefined ||
                            normalizedRow.netAmount ===
                            ""
                        ) {
                            normalizedRow.netAmount =
                                row?.netAmount ??
                                row?.netTotal ??
                                "";
                        }

                        if (
                            normalizedRow.netTotal ===
                            undefined ||
                            normalizedRow.netTotal ===
                            ""
                        ) {
                            normalizedRow.netTotal =
                                row?.netTotal ??
                                row?.netAmount ??
                                "";
                        }

                        return calculateRow(
                            {
                                id: `${Date.now()}-${Math.random()}`,

                                ...normalizedRow,
                            }
                        );
                    }
                )
                : (
                    templateFields?.body ||
                    []
                ).length > 0
                    ? [
                        buildEmptyBodyRow(),
                    ]
                    : [];

        setEditingVoucherNumber(
            record?.voucherNumber ||
            transactionData?.voucherNumber ||
            null
        );

        setErrors({});

        setForm({
            ...normalizedHeader,

            ...normalizedFooter,

            body:
                normalizedBody,
        });

        setShowModal(true);
    };

    /* ===================================================
       HEADER CHANGE
    =================================================== */

    const handleMainChange = (
        key: string,
        value: any
    ) => {
        setForm(
            (
                previous: any
            ) => {
                const field =
                    getHeaderFieldByKey(
                        key
                    );

                if (
                    field?.mapFields
                ) {
                    return applyMappedFields(
                        field,
                        value,
                        previous
                    );
                }

                return {
                    ...previous,

                    [key]:
                        value,
                };
            }
        );

        setErrors(
            (previous) => ({
                ...previous,

                [key]: "",
            })
        );
    };

    /* ===================================================
       BODY CHANGE
    =================================================== */

    const handleAddRow = () => {
        setForm(
            (
                previous: any
            ) => ({
                ...previous,

                body: [
                    ...(previous?.body ||
                        []),

                    buildEmptyBodyRow(),
                ],
            })
        );
    };

    const handleDeleteRow = (
        index: number
    ) => {
        setForm(
            (
                previous: any
            ) => {
                const rows = (
                    previous?.body ||
                    []
                ).filter(
                    (
                        _row: any,
                        rowIndex: number
                    ) =>
                        rowIndex !==
                        index
                );

                return {
                    ...previous,

                    body:
                        rows.length >
                            0
                            ? rows
                            : (
                                templateFields?.body ||
                                []
                            ).length >
                                0
                                ? [
                                    buildEmptyBodyRow(),
                                ]
                                : [],
                };
            }
        );
    };

    const handleRowChange = (
        index: number,
        key: string,
        value: any
    ) => {
        setForm(
            (
                previous: any
            ) => {
                const rows = [
                    ...(previous?.body ||
                        []),
                ];

                const currentRow =
                    rows[index] ||
                    {};

                const field =
                    getBodyFieldByKey(
                        key
                    );

                let updatedRow = {
                    ...currentRow,

                    [key]:
                        value,
                };

                if (
                    field?.mapFields
                ) {
                    updatedRow =
                        applyMappedFields(
                            field,
                            value,
                            updatedRow
                        );
                }

                const lowerKey =
                    String(
                        key
                    ).toLowerCase();

                if (
                    (lowerKey === "cgst" || lowerKey === "cgstpercentage" || lowerKey === "sgst" || lowerKey === "sgstpercentage") && num(value) > 0) {
                    updatedRow.igst = "";
                    updatedRow.igstPercentage = "";
                    updatedRow.igstAmount = 0;
                }

                if (
                    (
                        lowerKey ===
                        "igst" ||
                        lowerKey ===
                        "igstpercentage"
                    ) &&
                    num(value) > 0
                ) {
                    updatedRow.cgst =
                        "";

                    updatedRow.cgstPercentage =
                        "";

                    updatedRow.cgstAmount =
                        0;

                    updatedRow.sgst =
                        "";

                    updatedRow.sgstPercentage =
                        "";

                    updatedRow.sgstAmount =
                        0;
                }

                rows[index] =
                    calculateRow(
                        updatedRow
                    );

                return {
                    ...previous,

                    body:
                        rows,
                };
            }
        );

        setErrors(
            (previous) => ({
                ...previous,

                [`row_${index}_${key}`]:
                    "",

                [`row_${index}_tax`]:
                    "",

                body: "",
            })
        );
    };

    const fieldIsEmpty = (
        value: any
    ) => {
        if (Array.isArray(value)) {
            return (
                value.length === 0
            );
        }

        return !hasValue(value);
    };

    const getFilledBodyRows =
        () => {
            const bodyKeys = (
                templateFields?.body ||
                []
            )
                .filter(
                    (field: any) =>
                        !field?.isHidden
                )
                .map(
                    (field: any) =>
                        field?.key
                );

            return (
                form?.body ||
                []
            ).filter(
                (row: any) =>
                    bodyKeys.some(
                        (
                            key: string
                        ) =>
                            hasValue(
                                row?.[
                                key
                                ]
                            )
                    )
            );
        };

    const validateForm = () => {
        const nextErrors: Record<
            string,
            string
        > = {};

        (
            templateFields?.header ||
            []
        ).forEach(
            (field: any) => {
                if (
                    field?.isHidden ||
                    !field?.isRequired
                ) {
                    return;
                }

                if (
                    fieldIsEmpty(
                        form?.[
                        field.key
                        ]
                    )
                ) {
                    nextErrors[
                        field.key
                    ] = `${field.label ||
                    field.key
                    } is required`;
                }
            }
        );

        const filledRows =
            getFilledBodyRows();

        if (
            (
                templateFields?.body ||
                []
            ).length > 0 &&
            filledRows.length === 0
        ) {
            nextErrors.body =
                "Please add at least one item";
        }

        (
            form?.body ||
            []
        ).forEach(
            (
                row: any,
                index: number
            ) => {
                const hasAnyValue =
                    (
                        templateFields?.body ||
                        []
                    ).some(
                        (
                            field: any
                        ) =>
                            hasValue(
                                row?.[
                                field
                                    .key
                                ]
                            )
                    );

                if (!hasAnyValue) {
                    return;
                }

                (
                    templateFields?.body ||
                    []
                ).forEach(
                    (
                        field: any
                    ) => {
                        if (
                            field?.isHidden ||
                            !field?.isRequired
                        ) {
                            return;
                        }

                        if (
                            fieldIsEmpty(
                                row?.[
                                field
                                    .key
                                ]
                            )
                        ) {
                            nextErrors[
                                `row_${index}_${field.key}`
                            ] = `${field.label ||
                            field.key
                            } is required`;
                        }
                    }
                );

                const cgst = num(
                    row?.cgstPercentage ??
                    row?.cgst
                );

                const sgst = num(
                    row?.sgstPercentage ??
                    row?.sgst
                );

                const igst = num(
                    row?.igstPercentage ??
                    row?.igst
                );

                if (
                    igst > 0 &&
                    (
                        cgst > 0 ||
                        sgst > 0
                    )
                ) {
                    nextErrors[
                        `row_${index}_tax`
                    ] =
                        "You can enter either IGST or CGST/SGST";
                }
            }
        );

        setErrors(
            nextErrors
        );

        if (
            nextErrors.body
        ) {
            toast.error(
                nextErrors.body
            );
        }

        return (
            Object.keys(
                nextErrors
            ).length === 0
        );
    };

    const pickSchemaFields = (
        fields: any[] = [],
        source: any = {}
    ) => {
        return fields.reduce(
            (
                accumulator: any,
                field: any
            ) => {
                if (!field?.key) {
                    return accumulator;
                }

                accumulator[field.key] =
                    source?.[
                    field.key
                    ];

                return accumulator;
            },
            {}
        );
    };

    const cleanBodyRows = () => {
        const bodyFields = templateFields?.body || [];
        const bodyKeys = bodyFields.map((field: any) => field?.key);

        return (form?.body || []).filter((row: any) => bodyKeys.some((key: string) =>
            hasValue(
                row?.[
                key
                ]
            )
        )
        )
            .map(
                (row: any) =>
                    pickSchemaFields(
                        bodyFields,

                        calculateRow(
                            row
                        )
                    )
            );
    };

    const buildTransactionData =
        () => {
            return {
                header:
                    pickSchemaFields(
                        templateFields?.header ||
                        [],

                        form
                    ),

                body:
                    cleanBodyRows(),

                footer:
                    pickSchemaFields(
                        templateFields?.footer ||
                        [],

                        calculatedFooterValues
                    ),
            };
        };

    const handleSubmit = async () => {
        if (!moduleCode || !validateForm()) {
            return;
        }
        const data = buildTransactionData();
        try {
            if (editingVoucherNumber) {
                await dispatch(
                    updateCustomTransactionData(
                        {
                            voucherNumber:
                                editingVoucherNumber,

                            payload: {
                                data,

                                status:
                                    "active",
                            },
                        }
                    )
                ).unwrap();

                toast.success(
                    "Custom transaction updated successfully"
                );
            } else {
                await dispatch(
                    saveCustomTransactionData(
                        {
                            moduleCode,
                            status: "active",
                            data,
                        }
                    )
                ).unwrap();

                toast.success(
                    "Custom transaction created successfully"
                );
            }

            setShowModal(
                false
            );

            resetForm();

            await fetchTransactions();
        } catch (
        error: any
        ) {
            toast.error(
                error?.message ||
                "Custom transaction operation failed"
            );
        }
        };

    /* ===================================================
       DELETE
    =================================================== */

    const handleDeleteClick = (
        event: any,
        record: any
    ) => {
        const voucherNumber =
            record?.voucherNumber;

        if (!voucherNumber) {
            toast.error(
                "Voucher number not found"
            );

            return;
        }

        const rect =
            event.currentTarget.getBoundingClientRect();

        let x =
            rect.left -
            150;

        if (x < 10) {
            x = 10;
        }

        const y =
            rect.top +
            window.scrollY -
            5;

        setConfirmTooltip({
            show: true,

            x,

            y,

            voucherNumber,
        });
    };

    const handleDeleteConfirm =
        async () => {
            const voucherNumber =
                confirmTooltip?.voucherNumber;

            if (!voucherNumber) {
                toast.error(
                    "Voucher number not found"
                );

                return;
            }

            try {
                await dispatch(
                    deleteCustomTransactionData(
                        voucherNumber
                    )
                ).unwrap();

                toast.success(
                    "Custom transaction deleted successfully"
                );

                await fetchTransactions();
            } catch (
            error: any
            ) {
                toast.error(
                    error?.message ||
                    "Failed to delete custom transaction"
                );
            } finally {
                setConfirmTooltip({
                    show: false,

                    x: null,

                    y: null,

                    voucherNumber:
                        null,
                });
            }
        };

    /* ===================================================
       REFRESH
    =================================================== */

    const handleRefresh =
        async () => {
            setRefreshing(
                true
            );

            try {
                await fetchTransactions();

                toast.success(
                    "Custom transaction list refreshed"
                );
            } finally {
                setRefreshing(
                    false
                );
            }
        };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                    <Badge
                        count={
                            pagination?.totalDocs ??
                            0
                        }
                        text={`Total ${resolvedModuleName}:`}
                        varient="primary"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <SearchInput
                        search={
                            search
                        }
                        setSearch={
                            setSearch
                        }
                    />

                    <DataREfreshButton
                        callBackFn={
                            handleRefresh
                        }
                        loading={
                            refreshing
                        }
                    />

                    <DataCreateButton
                        callBackFn={
                            openAddModal
                        }
                        text={`Add ${resolvedModuleName}`}
                    />
                </div>
            </div>

            <DataTable
                columns={
                    columns
                }
                data={
                    transactionItems
                }
                loading={
                    loading ||
                    fieldsLoading
                }
                emptyMessage={`No ${resolvedModuleName} transaction found`}
                actions={(
                    record: any
                ) => (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"

                            /*
                             * Sends the selected list row
                             * directly to the edit modal.
                             */
                            onClick={() =>
                                openEditModal(
                                    record
                                )
                            }
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Edit
                                size={
                                    16
                                }
                            />
                        </button>

                        <button
                            type="button"
                            disabled={
                                deleteLoading
                            }
                            onClick={(
                                event
                            ) =>
                                handleDeleteClick(
                                    event,

                                    record
                                )
                            }
                            className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                        >
                            <Trash2
                                size={
                                    16
                                }
                            />
                        </button>
                    </div>
                )}
            />

            {pagination?.totalDocs >
                0 && (
                    <Pagination
                    localLimit={
                        localLimit
                    }
                    selectCb={(
                        event: any
                    ) => {
                        setLocalLimit(
                            Number(
                                event
                                    .target
                                    .value
                            )
                        );

                        setLocalOffset(
                            0
                        );
                    }}
                    preDisabled={
                        !pagination?.hasPrevPage
                    }
                    nextDisabled={
                        !pagination?.hasNextPage
                    }
                    setLocalOffset={
                        setLocalOffset
                    }
                    pagination={
                        pagination
                    }
                    />
                )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={
                        confirmTooltip.x
                    }
                    y={
                        confirmTooltip.y
                    }
                    message="Are you sure you want to delete this custom transaction?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={
                        handleDeleteConfirm
                    }
                    onCancel={() =>
                        setConfirmTooltip(
                            {
                                show: false,

                                x: null,

                                y: null,

                                voucherNumber:
                                    null,
                            }
                        )
                    }
                />
            )}

            {!fieldsLoading && (
                <DynamicAddForm
                    show={
                        showModal
                    }
                    setShow={
                        setShowModal
                    }
                    edit={Boolean(
                        editingVoucherNumber
                    )}
                    title={
                        resolvedModuleName
                    }
                    subtitle={`Fill in the ${resolvedModuleName} details below`}
                    loading={
                        createLoading ||
                        updateLoading
                    }
                    onClose={() => {
                        setShowModal(
                            false
                        );

                        resetForm();
                    }}
                    onSubmit={
                        handleSubmit
                    }
                    form={
                        form
                    }
                    errors={
                        errors
                    }
                    handleAddRow={
                        handleAddRow
                    }
                    handleDeleteRow={
                        handleDeleteRow
                    }
                    handleRowChange={
                        handleRowChange
                    }
                    footerTotals={
                        footerTotals
                    }
                    inputData={{
                        ...templateFields,

                        footer:
                            dynamicFooterArray,
                    }}
                    bodyKey="body"
                    handleChange={
                        handleMainChange
                    }
                />
            )}
        </div>
    );
};

export default CustomTransaction;