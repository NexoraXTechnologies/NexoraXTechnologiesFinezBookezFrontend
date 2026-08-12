import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import professionalAxios from "../../../services/professionalAxios";
import { formatDateForInput, formatDateForList, money, num, safePercent, todayYMD } from "../../../utils/helperFunctions";
import { deleteKitCollection, getAllKitCollections, saveKitCollection, updateKitCollection } from "../../../redux/slices/professionalSlice/kitCollection";
import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import Toggle from "../../../components/toggle";
import Badge from "../../../components/badge";
import SearchInput from "../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../components/buttons";
import Permission from "../../../components/PermissionGuard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import ProductMasterModal from "./productMaster/ProductMasterFormModal";

type KitStatus = "open" | "close" | undefined;

type ConfirmTooltipState = {
    show: boolean;
    x: number | null;
    y: number | null;
    voucherNumber: string | null;
};

const PRODUCT_FIELD_KEYS = new Set([
    "productCode",
    "productName",
    "productId",
    "product",
]);

const HEADER_SYSTEM_KEYS = new Set([
    "kitVoucherNumber",
    "kitName",
    "kitDocDate",
    "kitRemark",
    "kitStatus",
]);

const BODY_SYSTEM_KEYS = new Set([
    "id",
    "productCode",
    "productName",
    "productId",
    "product",
    "productDescription",
    "description",
    "productHSNCode",
    "quantity",
    "uom",
    "unit",
    "unitName",
    "rate",
    "gross",
    "grossAmount",
    "discount",
    "discountPercentage",
    "discountAmount",
    "taxableAmount",
    "cgst",
    "cgstPercentage",
    "cgstAmount",
    "sgst",
    "sgstPercentage",
    "sgstAmount",
    "igst",
    "igstPercentage",
    "igstAmount",
    "taxAmount",
    "netAmount",
    "netTotal",
]);

const CALCULATED_BODY_FIELDS = new Set([
    "gross",
    "grossAmount",
    "discountAmount",
    "taxableAmount",
    "cgstAmount",
    "sgstAmount",
    "igstAmount",
    "taxAmount",
    "netAmount",
    "netTotal",
]);

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const getEmptyProductRow = () => ({
    id: Date.now() + Math.random(),
    productCode: "",
    productName: "",
    productId: "",
    productDescription: "",
    description: "",
    productHSNCode: "",
    quantity: "",
    uom: "",
    unit: "",
    unitName: "",
    rate: "",
    gross: 0,
    grossAmount: 0,
    discount: "",
    discountPercentage: "",
    discountAmount: 0,
    taxableAmount: 0,
    cgst: "",
    cgstPercentage: "",
    cgstAmount: 0,
    sgst: "",
    sgstPercentage: "",
    sgstAmount: 0,
    igst: "",
    igstPercentage: "",
    igstAmount: 0,
    taxAmount: 0,
    netAmount: 0,
    netTotal: 0,
});

const getDefaultForm = () => ({
    kitVoucherNumber: "AUTO",
    kitName: "",
    kitDocDate: todayYMD(),
    kitRemark: "",
    kitStatus: "open",
    products: [getEmptyProductRow()],
});

const isTrueValue = (value: any) =>
    value === true ||
    String(value ?? "").toLowerCase() === "true";

const isEmptyValue = (value: any) =>
    value === undefined ||
    value === null ||
    value === "";

const roundNumber = (value: any) => {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
        ? Number(parsedValue.toFixed(2))
        : 0;
};

const getRecords = (response: any) => {
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.records)) return response.records;
    if (Array.isArray(response?.docs)) return response.docs;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.records)) return response.data.records;
    if (Array.isArray(response?.data?.docs)) return response.data.docs;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response)) return response;

    return [];
};

export const loadFieldOptions = async (fields: any[]) => {
    return Promise.all(
        (fields || []).map(async (field: any) => {
            const fieldType = String(
                field?.type ||
                field?.dataSource?.type ||
                ""
            ).toLowerCase();

            const api =
                field?.api ||
                field?.dataSource?.api ||
                "";

            if (!api) {
                return field;
            }

            try {
                const labelField =
                    field?.labelField ||
                    field?.dataSource?.labelField ||
                    (fieldType === "productmaster"
                        ? "productName"
                        : "name");

                const valueField =
                    field?.valueField ||
                    field?.dataSource?.valueField ||
                    (fieldType === "productmaster"
                        ? "productCode"
                        : "code");

                const apiUrl = String(api).startsWith(
                    "/eTaxSolnMongoApiBackend"
                )
                    ? String(api)
                    : `/eTaxSolnMongoApiBackend${String(api).startsWith("/")
                        ? api
                        : `/${api}`
                    }`;

                const response = await professionalAxios.get(
                    apiUrl,
                    {
                        params:
                            field?.queryParams ||
                            field?.dataSource?.queryParams ||
                            {},
                    }
                );

                const options = getRecords(response.data)
                    .map((item: any) => {
                        const value =
                            item?.[valueField] ??
                            item?.productCode ??
                            item?.code ??
                            item?._id ??
                            "";

                        const label =
                            item?.[labelField] ??
                            item?.productName ??
                            item?.name ??
                            value;

                        return {
                            label: String(label || ""),
                            value: String(value || ""),
                            raw: item,
                        };
                    })
                    .filter((option: any) => option.value);

                return {
                    ...field,
                    options,
                };
            } catch (error) {
                console.log(
                    `Failed to load options for ${field?.key}`,
                    error
                );

                return {
                    ...field,
                    options: field?.options || [],
                };
            }
        })
    );
};

const loadAllTemplateOptions = async (template: any) => {
    const [header, body, footer] = await Promise.all([
        loadFieldOptions(template?.header || []),
        loadFieldOptions(template?.body || []),
        loadFieldOptions(template?.footer || []),
    ]);

    return {
        ...template,
        header,
        body,
        footer,
    };
};

const KitCollection = () => {
    const dispatch = useDispatch<any>();

    const kitCollectionState = useSelector(
        (state: any) => state.kitCollection || {}
    );

    const { transactionsSchema } = useSelector(
        (state: any) =>
            state.getAllTransactionSchema || {}
    );

    const {
        kitCollections = [],
        pagination = defaultPagination,
        loading = false,
        saveLoading = false,
        updateLoading = false,
        deleteLoading = false,
    } = kitCollectionState;

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] =
        useState("");
    const [status, setStatus] =
        useState<KitStatus>("open");
    const [refreshing, setRefreshing] =
        useState(false);

    const [showModal, setShowModal] =
        useState(false);
    const [editingRecord, setEditingRecord] =
        useState<any>(null);
    const [form, setForm] =
        useState<any>(getDefaultForm());
    const [errors, setErrors] =
        useState<any>({});

    const [templateFields, setTemplateFields] =
        useState<any>({
            header: [],
            body: [],
            footer: [],
        });

    const [fieldsLoading, setFieldsLoading] =
        useState(false);

    const [checkProduct, setCheckProduct] =
        useState(false);

    const [
        productTargetRowIndex,
        setProductTargetRowIndex,
    ] = useState<number | null>(null);

    const [
        productSearchValue,
        setProductSearchValue,
    ] = useState("");

    const [confirmTooltip, setConfirmTooltip] =
        useState<ConfirmTooltipState>({
            show: false,
            x: null,
            y: null,
            voucherNumber: null,
        });

    const getHeaderFieldByKey = (key: string) =>
        (templateFields?.header || []).find(
            (field: any) => field?.key === key
        );

    const getBodyFieldByKey = (key: string) =>
        (templateFields?.body || []).find(
            (field: any) => field?.key === key
        );

    const getOptionByValue = (
        field: any,
        selectedValue: any
    ) =>
        (field?.options || []).find(
            (option: any) =>
                String(option?.value) ===
                String(selectedValue)
        );

    const applyMappedFields = (
        field: any,
        selectedValue: any,
        previousData: any
    ) => {
        if (!field) {
            return previousData;
        }

        const selectedOption = getOptionByValue(
            field,
            selectedValue
        );

        const raw = selectedOption?.raw || {};

        const updatedData = {
            ...previousData,
            [field.key]: selectedValue,
        };

        if (field?.mapFields) {
            Object.entries(field.mapFields).forEach(
                ([targetKey, sourceKey]) => {
                    updatedData[targetKey] =
                        raw?.[sourceKey as string] ??
                        raw?.[
                        String(
                            sourceKey
                        ).toLowerCase()
                        ] ??
                        raw?.[
                        String(
                            sourceKey
                        ).toUpperCase()
                        ] ??
                        "";
                }
            );
        }

        return updatedData;
    };

    const normalizeRowKeys = (row: any) => {
        const updatedRow = {
            ...row,
        };

        if (updatedRow.uom && !updatedRow.unit) {
            updatedRow.unit = updatedRow.uom;
        }

        if (updatedRow.unit && !updatedRow.uom) {
            updatedRow.uom = updatedRow.unit;
        }

        if (
            updatedRow.productDescription &&
            !updatedRow.description
        ) {
            updatedRow.description =
                updatedRow.productDescription;
        }

        if (
            updatedRow.description &&
            !updatedRow.productDescription
        ) {
            updatedRow.productDescription =
                updatedRow.description;
        }

        if (
            updatedRow.gross &&
            !updatedRow.grossAmount
        ) {
            updatedRow.grossAmount =
                updatedRow.gross;
        }

        if (
            updatedRow.grossAmount &&
            !updatedRow.gross
        ) {
            updatedRow.gross =
                updatedRow.grossAmount;
        }

        if (
            updatedRow.netAmount &&
            !updatedRow.netTotal
        ) {
            updatedRow.netTotal =
                updatedRow.netAmount;
        }

        if (
            updatedRow.netTotal &&
            !updatedRow.netAmount
        ) {
            updatedRow.netAmount =
                updatedRow.netTotal;
        }

        return updatedRow;
    };

    const calculateRow = (row: any) => {
        const quantity = num(row?.quantity);
        const rate = num(row?.rate);
        const gross = quantity * rate;

        const discount = safePercent(
            row?.discountPercentage ||
            row?.discount
        );

        const cgst = safePercent(
            row?.cgstPercentage ||
            row?.cgst
        );

        const sgst = safePercent(
            row?.sgstPercentage ||
            row?.sgst
        );

        const igst = safePercent(
            row?.igstPercentage ||
            row?.igst
        );

        const discountAmount =
            (gross * discount) / 100;

        const taxableAmount =
            gross - discountAmount;

        const cgstAmount =
            (taxableAmount * cgst) / 100;

        const sgstAmount =
            (taxableAmount * sgst) / 100;

        const igstAmount =
            (taxableAmount * igst) / 100;

        const taxAmount =
            cgstAmount +
            sgstAmount +
            igstAmount;

        const netAmount =
            taxableAmount + taxAmount;

        return {
            ...row,
            gross: roundNumber(gross),
            grossAmount: roundNumber(gross),
            discount,
            discountPercentage: discount,
            discountAmount:
                roundNumber(discountAmount),
            taxableAmount:
                roundNumber(taxableAmount),
            cgst,
            cgstPercentage: cgst,
            cgstAmount:
                roundNumber(cgstAmount),
            sgst,
            sgstPercentage: sgst,
            sgstAmount:
                roundNumber(sgstAmount),
            igst,
            igstPercentage: igst,
            igstAmount:
                roundNumber(igstAmount),
            taxAmount:
                roundNumber(taxAmount),
            netAmount:
                roundNumber(netAmount),
            netTotal:
                roundNumber(netAmount),
        };
    };

    const calculateFooter = (products: any[]) => {
        return (products || []).reduce(
            (total: any, product: any) => {
                total.totalQuantity += num(
                    product?.quantity
                );

                total.totalGrossAmount += num(
                    product?.gross
                );

                total.totalDiscountAmount += num(
                    product?.discountAmount
                );

                total.totalCgstAmount += num(
                    product?.cgstAmount
                );

                total.totalSgstAmount += num(
                    product?.sgstAmount
                );

                total.totalIgstAmount += num(
                    product?.igstAmount
                );

                total.totalTaxAmount += num(
                    product?.taxAmount
                );

                total.totalNetAmount += num(
                    product?.netAmount
                );

                return total;
            },
            {
                totalQuantity: 0,
                totalGrossAmount: 0,
                totalDiscountAmount: 0,
                totalCgstAmount: 0,
                totalSgstAmount: 0,
                totalIgstAmount: 0,
                totalTaxAmount: 0,
                totalNetAmount: 0,
            }
        );
    };

    const footerTotals = useMemo(
        () =>
            calculateFooter(
                form?.products || []
            ),
        [form?.products]
    );

    const footerValues = useMemo(
        () => ({
            grossAmount:
                footerTotals.totalGrossAmount,
            discountAmount:
                footerTotals.totalDiscountAmount,
            cgstAmount:
                footerTotals.totalCgstAmount,
            sgstAmount:
                footerTotals.totalSgstAmount,
            igstAmount:
                footerTotals.totalIgstAmount,
            netAmount:
                footerTotals.totalNetAmount,
            adjustedAmount: 0,
            balanceAmount:
                footerTotals.totalNetAmount,
        }),
        [footerTotals]
    );

    const dynamicFooterArray = useMemo(
        () =>
            (templateFields?.footer || [])
                .filter(
                    (field: any) =>
                        !isTrueValue(
                            field?.isHidden
                        )
                )
                .map((field: any) => {
                    const rawValue =
                        footerValues[
                        field.key as keyof typeof footerValues
                        ] ?? 0;

                    return {
                        ...field,
                        value: money(rawValue),
                        rawValue,
                    };
                }),
        [
            templateFields?.footer,
            footerValues,
        ]
    );

    const templateFieldsWithCreateActions =
        useMemo(
            () => ({
                ...templateFields,

                body: (
                    templateFields?.body || []
                ).map((field: any) => {
                    const fieldKey = String(
                        field?.key || ""
                    );

                    if (
                        !PRODUCT_FIELD_KEYS.has(
                            fieldKey
                        )
                    ) {
                        return field;
                    }

                    return {
                        ...field,
                        largeData: true,
                        showCreateOnEmpty: true,

                        onCreateOption: (
                            searchValue: string,
                            rowIndex: number
                        ) => {
                            setProductTargetRowIndex(
                                rowIndex
                            );

                            setProductSearchValue(
                                searchValue
                            );

                            setCheckProduct(true);
                        },

                        createOptionLabel: (
                            searchValue: string
                        ) =>
                            searchValue
                                ? `+ Add "${searchValue}" as New Product`
                                : "+ Add New Product",
                    };
                }),
            }),
            [templateFields]
        );

    const fetchKitCollections = async () => {
        await dispatch(
            getAllKitCollections({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status,
            }) as any
        );
    };

    useEffect(() => {
        dispatch(
            getAllTransactionSchema(
                "kitCollection"
            ) as any
        );
    }, [dispatch]);

    useEffect(() => {
        fetchKitCollections();
    }, [
        localOffset,
        localLimit,
        debouncedSearch,
        status,
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(
                search.trim()
            );

            setLocalOffset(0);
        }, 400);

        return () =>
            clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const prepareTemplateFields =
            async () => {
                const schema =
                    transactionsSchema?.data ||
                    transactionsSchema;

                const hasSchema =
                    Array.isArray(
                        schema?.header
                    ) ||
                    Array.isArray(schema?.body) ||
                    Array.isArray(
                        schema?.footer
                    );

                if (!hasSchema) {
                    return;
                }

                try {
                    setFieldsLoading(true);

                    const loadedFields =
                        await loadAllTemplateOptions(
                            schema
                        );

                    setTemplateFields(
                        loadedFields
                    );
                } catch (error) {
                    console.log(
                        "Failed to prepare Kit Collection fields",
                        error
                    );
                } finally {
                    setFieldsLoading(false);
                }
            };

        prepareTemplateFields();
    }, [transactionsSchema]);

    const columns = [
        {
            key: "kitVoucherNumber",
            title: "Voucher No",
        },
        {
            key: "kitDocDate",
            title: "Date",

            render: (row: any) =>
                row?.kitDocDate
                    ? formatDateForList(
                        row.kitDocDate
                    )
                    : "-",
        },
        {
            key: "kitName",
            title: "Kit Name",

            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.kitName || "-"}
                    </div>

                    {row?.kitRemark && (
                        <div className="max-w-[280px] truncate text-xs text-muted-foreground">
                            {row.kitRemark}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "kitBody",
            title: "Items",

            render: (row: any) =>
                row?.kitBody?.length || 0,
        },
        {
            key: "kitFooter",
            title: "Net Amount",
            type: "amount",

            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(
                        row?.kitFooter
                            ?.netAmount || 0
                    )}
                </span>
            ),
        },
        {
            key: "kitStatus",
            title: "Status",

            render: (row: any) => {
                const isOpen =
                    String(
                        row?.kitStatus || ""
                    ).toLowerCase() === "open";

                return (
                    <span
                        className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${isOpen
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-danger/20 bg-danger/10 text-danger"
                            }`}
                    >
                        {row?.kitStatus || "-"}
                    </span>
                );
            },
        },
    ];

    const handleStatusChange = (
        nextStatus: string
    ) => {
        setStatus(
            nextStatus as KitStatus
        );

        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);

            await fetchKitCollections();

            toast.success(
                "Kit Collection list refreshed"
            );
        } catch {
            toast.error(
                "Failed to refresh Kit Collection list"
            );
        } finally {
            setRefreshing(false);
        }
    };

    const resetForm = () => {
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
        setCheckProduct(false);
        setProductTargetRowIndex(null);
        setProductSearchValue("");
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const getCustomMasterFormValues = (
        customMasters: any
    ) => {
        if (
            !customMasters ||
            typeof customMasters !== "object"
        ) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(customMasters).map(
                ([key, value]) => {
                    const customValue =
                        value as any;

                    return [
                        key,
                        customValue?.code ??
                        customValue?.value ??
                        customValue ??
                        "",
                    ];
                }
            )
        );
    };

    const openEditModal = (record: any) => {
        const products =
            Array.isArray(record?.kitBody) &&
                record.kitBody.length > 0
                ? record.kitBody.map(
                    (item: any) =>
                        calculateRow(
                            normalizeRowKeys({
                                ...getCustomMasterFormValues(
                                    item?.customMasters
                                ),
                                ...item,
                                id:
                                    item?.id ||
                                    Date.now() +
                                    Math.random(),
                                productDescription:
                                    item?.productDescription ||
                                    item?.description ||
                                    "",
                                description:
                                    item?.description ||
                                    item?.productDescription ||
                                    "",
                                uom:
                                    item?.uom ||
                                    item?.unit ||
                                    "",
                                unit:
                                    item?.unit ||
                                    item?.uom ||
                                    "",
                            })
                        )
                )
                : [getEmptyProductRow()];

        setEditingRecord(record);
        setErrors({});

        setForm({
            ...getDefaultForm(),
            ...getCustomMasterFormValues(
                record?.customMasters
            ),

            kitVoucherNumber:
                record?.kitVoucherNumber ||
                "AUTO",

            kitName:
                record?.kitName || "",

            kitDocDate:
                formatDateForInput(
                    record?.kitDocDate
                ),

            kitRemark:
                record?.kitRemark || "",

            kitStatus:
                record?.kitStatus || "open",

            products,
        });

        setShowModal(true);
    };

    const handleMainChange = (
        key: string,
        value: any
    ) => {
        setForm((previous: any) => {
            const field =
                getHeaderFieldByKey(key);

            if (field?.mapFields) {
                return applyMappedFields(
                    field,
                    value,
                    previous
                );
            }

            return {
                ...previous,
                [key]: value,
            };
        });

        setErrors((previous: any) => ({
            ...previous,
            [key]: "",
        }));
    };

    const handleAddRow = () => {
        setForm((previous: any) => ({
            ...previous,

            products: [
                ...(previous?.products || []),
                getEmptyProductRow(),
            ],
        }));
    };

    const handleDeleteRow = (
        index: number
    ) => {
        setForm((previous: any) => {
            const products = (
                previous?.products || []
            ).filter(
                (
                    _: any,
                    rowIndex: number
                ) => rowIndex !== index
            );

            return {
                ...previous,
                products:
                    products.length > 0
                        ? products
                        : [getEmptyProductRow()],
            };
        });
    };

    const handleRowChange = (
        index: number,
        key: string,
        value: any
    ) => {
        setForm((previous: any) => {
            const products = [
                ...(previous?.products || []),
            ];

            const field =
                getBodyFieldByKey(key);

            let updatedRow = {
                ...(products[index] ||
                    getEmptyProductRow()),

                [key]: value,
            };

            if (field?.mapFields) {
                updatedRow =
                    applyMappedFields(
                        field,
                        value,
                        updatedRow
                    );
            }

            const selectedOption =
                getOptionByValue(
                    field,
                    value
                );

            const raw =
                selectedOption?.raw || {};
            console.log({ raw })
            if (
                PRODUCT_FIELD_KEYS.has(key)
            ) {
                updatedRow = {
                    ...updatedRow,

                    productCode:
                        raw?.productCode ||
                        updatedRow?.productCode ||
                        "",

                    productName:
                        raw?.productName ||
                        updatedRow?.productName ||
                        "",

                    productId:
                        raw?._id ||
                        raw?.productId ||
                        updatedRow?.productId ||
                        "",

                    productDescription:
                        raw?.productDescription ||
                        raw?.description ||
                        updatedRow?.productDescription ||
                        "",

                    description:
                        raw?.description ||
                        raw?.productDescription ||
                        updatedRow?.description ||
                        "",

                    productHSNCode:
                        raw?.productHSNCode ||
                        updatedRow?.productHSNCode ||
                        "",

                    uom:
                        raw?.unit ||
                        raw?.uom ||
                        updatedRow?.uom ||
                        "",

                    unit:
                        raw?.unit ||
                        raw?.uom ||
                        updatedRow?.unit ||
                        "",

                    rate:
                        raw?.sellingPrice ??
                        raw?.rate ??
                        updatedRow?.rate ??
                        "",

                    cgst:
                        raw?.csgst ??
                        raw?.cgst ??
                        updatedRow?.cgst ??
                        "",

                    sgst:
                        raw?.csgst ??
                        raw?.sgst ??
                        updatedRow?.sgst ??
                        "",

                    igst:
                        raw?.igst ??
                        updatedRow?.igst ??
                        "",
                };
            }

            if (
                (key === "cgst" ||
                    key === "sgst") &&
                num(value) > 0
            ) {
                updatedRow.igst = "";
                updatedRow.igstPercentage =
                    "";
                updatedRow.igstAmount = 0;
            }

            if (
                key === "igst" &&
                num(value) > 0
            ) {
                updatedRow.cgst = "";
                updatedRow.sgst = "";
                updatedRow.cgstPercentage =
                    "";
                updatedRow.sgstPercentage =
                    "";
                updatedRow.cgstAmount = 0;
                updatedRow.sgstAmount = 0;
            }

            products[index] = calculateRow(
                normalizeRowKeys(updatedRow)
            );

            return {
                ...previous,
                products,
            };
        });

        setErrors((previous: any) => ({
            ...previous,
            products: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_tax`]: "",
        }));
    };

    const getFilledRows = () =>
        (form?.products || []).filter(
            (row: any) =>
                row?.productCode ||
                row?.productName ||
                row?.productId
        );

    const validateForm = () => {
        const validationErrors: any = {};

        (
            templateFields?.header || []
        ).forEach((field: any) => {
            if (
                isTrueValue(field?.isHidden) ||
                !isTrueValue(
                    field?.isRequired
                )
            ) {
                return;
            }

            if (
                isEmptyValue(
                    form?.[field.key]
                )
            ) {
                validationErrors[field.key] =
                    `${field?.label ||
                    field?.title ||
                    field?.key
                    } is required`;
            }
        });

        const filledRows =
            getFilledRows();

        if (filledRows.length === 0) {
            validationErrors.products =
                "Please add at least one product";
        }

        (
            form?.products || []
        ).forEach(
            (row: any, index: number) => {
                const hasProduct =
                    row?.productCode ||
                    row?.productName ||
                    row?.productId;

                if (!hasProduct) {
                    return;
                }

                (
                    templateFields?.body || []
                ).forEach((field: any) => {
                    if (
                        isTrueValue(
                            field?.isHidden
                        ) ||
                        !isTrueValue(
                            field?.isRequired
                        )
                    ) {
                        return;
                    }

                    if (
                        isEmptyValue(
                            row?.[field.key]
                        )
                    ) {
                        validationErrors[
                            `row_${index}_${field.key}`
                        ] = `${field?.label ||
                        field?.title ||
                        field?.key
                        } is required`;
                    }
                });

                const cgst = num(row?.cgst);
                const sgst = num(row?.sgst);
                const igst = num(row?.igst);

                if (
                    igst > 0 &&
                    (cgst > 0 || sgst > 0)
                ) {
                    validationErrors[
                        `row_${index}_tax`
                    ] =
                        "You can enter either IGST or CGST/SGST";

                    validationErrors[
                        `row_${index}_cgst`
                    ] =
                        "Only one tax type is allowed";

                    validationErrors[
                        `row_${index}_sgst`
                    ] =
                        "Only one tax type is allowed";

                    validationErrors[
                        `row_${index}_igst`
                    ] =
                        "Only one tax type is allowed";
                }
            }
        );

        setErrors(validationErrors);

        if (validationErrors.products) {
            toast.error(
                validationErrors.products
            );
        }

        return (
            Object.keys(validationErrors)
                .length === 0
        );
    };

    const getCustomMasterValue = (
        field: any,
        selectedValue: any
    ) => {
        if (isEmptyValue(selectedValue)) {
            return null;
        }

        if (
            typeof selectedValue === "object"
        ) {
            return {
                code: String(
                    selectedValue?.code ||
                    selectedValue?.value ||
                    ""
                ),

                name: String(
                    selectedValue?.name ||
                    selectedValue?.label ||
                    selectedValue?.code ||
                    ""
                ),
            };
        }

        const selectedOption =
            getOptionByValue(
                field,
                selectedValue
            );

        const raw =
            selectedOption?.raw || {};

        const valueField =
            field?.valueField ||
            field?.dataSource?.valueField ||
            "code";

        const labelField =
            field?.labelField ||
            field?.dataSource?.labelField ||
            "name";

        const code =
            raw?.[valueField] ??
            raw?.code ??
            selectedOption?.value ??
            selectedValue;

        const name =
            raw?.[labelField] ??
            raw?.name ??
            selectedOption?.label ??
            selectedValue;

        return {
            code: String(code || ""),
            name: String(name || code || ""),
        };
    };

    const buildCustomMasters = (
        fields: any[],
        source: any,
        systemKeys: Set<string>
    ) => {
        const customMasters: Record<
            string,
            any
        > = {};

        (fields || []).forEach(
            (field: any) => {
                const key = String(
                    field?.key || ""
                );

                if (
                    !key ||
                    systemKeys.has(key) ||
                    isTrueValue(
                        field?.isDefault
                    )
                ) {
                    return;
                }

                const selectedValue =
                    source?.[key];

                const customValue =
                    getCustomMasterValue(
                        field,
                        selectedValue
                    );

                if (
                    customValue?.code ||
                    customValue?.name
                ) {
                    customMasters[key] =
                        customValue;
                }
            }
        );

        return customMasters;
    };

    const cleanRows = () =>
        (form?.products || [])
            .filter(
                (row: any) =>
                    row?.productCode ||
                    row?.productName ||
                    row?.productId
            )
            .map((row: any) =>
                calculateRow(
                    normalizeRowKeys(row)
                )
            );

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        const products = cleanRows();
        const footer =
            calculateFooter(products);

        const customMasters =
            buildCustomMasters(
                templateFields?.header ||
                [],
                form,
                HEADER_SYSTEM_KEYS
            );

        const payload: any = {
            kitName: form?.kitName,
            kitDocDate: form?.kitDocDate,
            kitRemark:
                form?.kitRemark || "",
            kitStatus:
                form?.kitStatus || "open",

            customMasters,

            kitBody: products.map(
                (product: any) => {
                    const productCustomMasters =
                        buildCustomMasters(
                            templateFields?.body ||
                            [],
                            product,
                            BODY_SYSTEM_KEYS
                        );

                    const bodyItem: any = {
                        productCode:
                            product?.productCode ||
                            "",

                        productName:
                            product?.productName ||
                            "",

                        productDescription:
                            product?.productDescription ||
                            product?.description ||
                            "",

                        productHSNCode: String(
                            product?.productHSNCode ||
                            ""
                        ),

                        quantity: roundNumber(
                            product?.quantity
                        ),

                        uom:
                            product?.uom ||
                            product?.unit ||
                            "",

                        rate: roundNumber(
                            product?.rate
                        ),

                        gross: roundNumber(
                            product?.gross
                        ),

                        discount: roundNumber(
                            product?.discount
                        ),

                        discountAmount:
                            roundNumber(
                                product?.discountAmount
                            ),

                        cgst: roundNumber(
                            product?.cgst
                        ),

                        cgstAmount:
                            roundNumber(
                                product?.cgstAmount
                            ),

                        sgst: roundNumber(
                            product?.sgst
                        ),

                        sgstAmount:
                            roundNumber(
                                product?.sgstAmount
                            ),

                        igst: roundNumber(
                            product?.igst
                        ),

                        igstAmount:
                            roundNumber(
                                product?.igstAmount
                            ),

                        netAmount:
                            roundNumber(
                                product?.netAmount
                            ),
                    };

                    if (
                        Object.keys(
                            productCustomMasters
                        ).length > 0
                    ) {
                        bodyItem.customMasters =
                            productCustomMasters;
                    }

                    return bodyItem;
                }
            ),

            kitFooter: {
                grossAmount: roundNumber(
                    footer.totalGrossAmount
                ),

                discountAmount:
                    roundNumber(
                        footer.totalDiscountAmount
                    ),

                cgstAmount: roundNumber(
                    footer.totalCgstAmount
                ),

                sgstAmount: roundNumber(
                    footer.totalSgstAmount
                ),

                igstAmount: roundNumber(
                    footer.totalIgstAmount
                ),

                netAmount: roundNumber(
                    footer.totalNetAmount
                ),

                adjustedAmount: 0,

                balanceAmount: roundNumber(
                    footer.totalNetAmount
                ),
            },
        };

        try {
            if (editingRecord) {
                await dispatch(
                    updateKitCollection({
                        kitVoucherNumber:
                            form?.kitVoucherNumber,

                        data: payload,
                    }) as any
                ).unwrap();

                toast.success(
                    "Kit Collection updated successfully"
                );
            } else {
                await dispatch(
                    saveKitCollection(
                        payload
                    ) as any
                ).unwrap();

                toast.success(
                    "Kit Collection saved successfully"
                );
            }

            setShowModal(false);
            resetForm();

            await fetchKitCollections();
        } catch (error: any) {
            toast.error(
                error?.message ||
                "Kit Collection operation failed"
            );
        }
    };

    const handleProductSaved = async (
        savedResponse: any
    ) => {
        try {
            const schema =
                transactionsSchema?.data ||
                transactionsSchema;

            const updatedTemplate =
                await loadAllTemplateOptions(
                    schema || templateFields
                );

            setTemplateFields(
                updatedTemplate
            );

            const savedProduct =
                savedResponse?.data?.product ||
                savedResponse?.data?.data
                    ?.product ||
                savedResponse?.data?.data ||
                savedResponse?.data ||
                savedResponse?.product ||
                savedResponse ||
                {};

            const savedCode =
                savedProduct?.productCode ||
                "";

            const savedName =
                savedProduct?.productName ||
                "";

            let selectedField: any = null;
            let selectedOption: any = null;

            for (const field of updatedTemplate?.body ||
                []) {
                if (
                    !PRODUCT_FIELD_KEYS.has(
                        String(
                            field?.key || ""
                        )
                    )
                ) {
                    continue;
                }

                const option = (
                    field?.options || []
                ).find((item: any) => {
                    const raw =
                        item?.raw || {};

                    return (
                        (savedCode &&
                            String(
                                raw?.productCode ||
                                item?.value ||
                                ""
                            ) ===
                            String(
                                savedCode
                            )) ||
                        (savedName &&
                            String(
                                raw?.productName ||
                                item?.label ||
                                ""
                            ) ===
                            String(
                                savedName
                            ))
                    );
                });

                if (option) {
                    selectedField = field;
                    selectedOption = option;
                    break;
                }
            }

            const createdProduct =
                selectedOption?.raw ||
                savedProduct;

            setForm((previous: any) => {
                const products = [
                    ...(previous?.products || []),
                ];

                let rowIndex =
                    productTargetRowIndex !==
                        null &&
                        productTargetRowIndex >= 0 &&
                        productTargetRowIndex <
                        products.length
                        ? productTargetRowIndex
                        : products.findIndex(
                            (row: any) =>
                                !row?.productCode &&
                                !row?.productName
                        );

                if (rowIndex < 0) {
                    rowIndex = products.length;
                    products.push(
                        getEmptyProductRow()
                    );
                }

                let updatedRow = {
                    ...(products[rowIndex] ||
                        getEmptyProductRow()),
                };

                if (
                    selectedField &&
                    selectedOption
                ) {
                    updatedRow =
                        applyMappedFields(
                            selectedField,
                            selectedOption.value,
                            updatedRow
                        );
                }

                updatedRow = {
                    ...updatedRow,

                    productCode:
                        createdProduct?.productCode ||
                        savedCode ||
                        updatedRow?.productCode ||
                        "",

                    productName:
                        createdProduct?.productName ||
                        savedName ||
                        updatedRow?.productName ||
                        "",

                    productId:
                        createdProduct?._id ||
                        createdProduct?.productId ||
                        updatedRow?.productId ||
                        "",

                    productDescription:
                        createdProduct?.productDescription ||
                        createdProduct?.description ||
                        updatedRow?.productDescription ||
                        "",

                    description:
                        createdProduct?.description ||
                        createdProduct?.productDescription ||
                        updatedRow?.description ||
                        "",

                    productHSNCode:
                        createdProduct?.productHSNCode ||
                        updatedRow?.productHSNCode ||
                        "",

                    uom:
                        createdProduct?.unit ||
                        createdProduct?.uom ||
                        updatedRow?.uom ||
                        "",

                    unit:
                        createdProduct?.unit ||
                        createdProduct?.uom ||
                        updatedRow?.unit ||
                        "",

                    rate:
                        createdProduct?.sellingPrice ??
                        createdProduct?.rate ??
                        updatedRow?.rate ??
                        "",

                    cgst:
                        createdProduct?.csgst ??
                        createdProduct?.cgst ??
                        updatedRow?.cgst ??
                        "",

                    sgst:
                        createdProduct?.csgst ??
                        createdProduct?.sgst ??
                        updatedRow?.sgst ??
                        "",

                    igst:
                        createdProduct?.igst ??
                        updatedRow?.igst ??
                        "",
                };

                if (num(updatedRow.igst) > 0) {
                    updatedRow.cgst = "";
                    updatedRow.sgst = "";
                } else if (
                    num(updatedRow.cgst) > 0 ||
                    num(updatedRow.sgst) > 0
                ) {
                    updatedRow.igst = "";
                }

                products[rowIndex] =
                    calculateRow(
                        normalizeRowKeys(
                            updatedRow
                        )
                    );

                return {
                    ...previous,
                    products,
                };
            });
        } catch (error: any) {
            toast.error(
                error?.message ||
                "Product created, but product dropdown refresh failed"
            );
        } finally {
            setCheckProduct(false);
            setProductTargetRowIndex(null);
            setProductSearchValue("");
        }
    };

    const isClosedKit = (record: any) => {
        const kitStatus = String(
            record?.kitStatus || ""
        ).toLowerCase();

        return (
            kitStatus === "close" ||
            kitStatus === "closed"
        );
    };

    const handleEditClick = (
        record: any
    ) => {
        if (isClosedKit(record)) {
            toast.error(
                "You can't edit closed Kit Collection"
            );

            return;
        }

        openEditModal(record);
    };

    const handleDeleteClick = (
        event: any,
        record: any
    ) => {
        if (isClosedKit(record)) {
            toast.error(
                "You can't delete closed Kit Collection"
            );

            return;
        }

        const rect =
            event.currentTarget.getBoundingClientRect();

        setConfirmTooltip({
            show: true,
            x: Math.max(
                rect.left - 150,
                10
            ),
            y:
                rect.top +
                window.scrollY -
                5,
            voucherNumber:
                record?.kitVoucherNumber ||
                null,
        });
    };

    const handleDeleteConfirm =
        async () => {
            if (
                !confirmTooltip.voucherNumber
            ) {
                return;
            }

            try {
                await dispatch(
                    deleteKitCollection(
                        confirmTooltip.voucherNumber
                    ) as any
                ).unwrap();

                toast.success(
                    "Kit Collection deleted successfully"
                );

                await fetchKitCollections();
            } catch (error: any) {
                toast.error(
                    error?.message ||
                    "Failed to delete Kit Collection"
                );
            } finally {
                setConfirmTooltip({
                    show: false,
                    x: null,
                    y: null,
                    voucherNumber: null,
                });
            }
        };

    const isBodyColumnVisible = (
        field: any
    ) =>
        !isTrueValue(field?.isHidden);

    const isBodyCellVisible = (
        field: any
    ) =>
        !isTrueValue(field?.isHidden);

    const isBodyCellDisabled = (
        field: any
    ) =>
        CALCULATED_BODY_FIELDS.has(
            field?.key
        ) ||
        isTrueValue(field?.disabled) ||
        isTrueValue(field?.isReadonly);

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Badge
                    count={
                        pagination?.totalDocs ??
                        0
                    }
                    text="Total Kit Collections:"
                    varient="primary"
                />

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Toggle
                        arr={[
                            "open",
                            "close",
                        ]}
                        state={status}
                        setState={
                            handleStatusChange
                        }
                    />

                    <SearchInput
                        search={search}
                        setSearch={setSearch}
                    />

                    <DataREfreshButton
                        callBackFn={
                            handleRefresh
                        }
                        loading={refreshing}
                    />

                    <Permission
                        module="bookez"
                        permissionKey="Pass"
                        action="create"
                    >
                        <DataCreateButton
                            callBackFn={
                                openAddModal
                            }
                            text="Add Kit Collection"
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={kitCollections}
                loading={loading}
                emptyMessage={`No ${status} Kit Collection found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <Permission
                            module="bookez"
                            permissionKey="Pass"
                            action="update"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    handleEditClick(
                                        record
                                    )
                                }
                                className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission
                            module="bookez"
                            permissionKey="Pass"
                            action="delete"
                        >
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
                                className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2
                                    size={16}
                                />
                            </button>
                        </Permission>
                    </div>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(
                        event: any
                    ) => {
                        setLocalLimit(
                            Number(
                                event.target
                                    .value
                            )
                        );

                        setLocalOffset(0);
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
                    pagination={pagination}
                />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this Kit Collection?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={
                        handleDeleteConfirm
                    }
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            voucherNumber:
                                null,
                        })
                    }
                />
            )}

            {!fieldsLoading && (
                <DynamicAddForm
                    isSummaryFooter={false}
                    show={showModal}
                    setShow={setShowModal}
                    edit={Boolean(
                        editingRecord
                    )}
                    title="Kit Collection"
                    subtitle="Fill in the Kit Collection details below"
                    loading={
                        saveLoading ||
                        updateLoading
                    }
                    onClose={() => {
                        setShowModal(false);
                        resetForm();
                    }}
                    onSubmit={handleSubmit}
                    form={form}
                    errors={errors}
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
                        ...templateFieldsWithCreateActions,
                        footer:
                            dynamicFooterArray,
                    }}
                    bodyKey="products"
                    handleChange={
                        handleMainChange
                    }
                    isBodyColumnVisible={
                        isBodyColumnVisible
                    }
                    isBodyCellVisible={
                        isBodyCellVisible
                    }
                    isBodyCellDisabled={
                        isBodyCellDisabled
                    }
                />
            )}

            <ProductMasterModal
                show={checkProduct}
                setShow={(
                    value: boolean
                ) => {
                    setCheckProduct(value);

                    if (!value) {
                        setProductTargetRowIndex(
                            null
                        );

                        setProductSearchValue(
                            ""
                        );
                    }
                }}
                onSaved={
                    handleProductSaved
                }
                title="Add New Product"
                initialProductName={
                    productSearchValue
                }
            />
        </div>
    );
};

export default KitCollection;