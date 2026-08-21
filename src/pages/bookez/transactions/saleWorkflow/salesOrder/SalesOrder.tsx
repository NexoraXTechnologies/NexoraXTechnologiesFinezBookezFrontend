import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../../components/buttons";
import DataTable from "../../../../../components/DataTable";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import Toggle from "../../../../../components/toggle";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import { createSalesOrder, deleteSalesOrder, getAllSalesOrder, updateSalesOrder } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesOrderSlice";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import professionalAxios from "../../../../../services/professionalAxios";
import { fmtMoney, formatDateForInput, formatDateForList, money, num, safePercent, todayYMD } from "../../../../../utils/helperFunctions";
import type { ConfirmTooltipState } from "../salesWorkflowTypes";
import Modal, { ListingModel } from "../../../../../components/modal";
import { clearSelectedSalesQuotation, getSalesQuotationList, updateSalesQuotation } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesQuationsSlice";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import Permission from "../../../../../components/PermissionGuard";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllSystemConfigurations } from "../../../../../redux/slices/systemConf";
import ProductMasterModal from "../../../master/productMaster/ProductMasterFormModal";
import { getProductBalance } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";
import { getCompany } from "../../../../../redux/slices/professionalSlice/professionalCompanyMaster.slice";

const CUSTOMER_FIELD_KEYS = new Set([
    "sOrderCustomerCode",
    "sOrderCustomerName",
]);

const PRODUCT_FIELD_KEYS = new Set([
    "productCode",
    "productName",
    "productId",
    "product",
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

const emptyProductRow = {
    id: Date.now(),
    productCode: "",
    productName: "",
    productId: "",
    productDescription: "",
    description: "",
    productHSNCode: "",
    remarks: "",
    quantity: "",
    availableQuantity: null,
    productType: "",
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
    otherAmount: "",
    netAmount: 0,
    netTotal: 0,

    // Margin-product fields
    marginProduct: false,
    nonTaxRate: "",
    taxGross: "",
    nonTaxGross: "",
};

const getDefaultForm = () => ({
    sOrderVoucherNumber: "AUTO",
    sOrderVoucherDate: todayYMD(),
    sOrderCustomerCode: "",
    sOrderCustomerName: "",
    sOrderSalesAccount: "SA021",
    sOrderStatus: "open",
    sOrderDocStatus: "open",
    sOrderRemark: "",
    sOrderRemarks: "",
    isAutoPost: false,
    products: [
        {
            ...emptyProductRow,
            id: Date.now(),
        },
    ],
    grossAmount: "0.00",
    discountAmount: "0.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    igstAmount: "0.00",
    taxAmount: "0.00",
    otherAmount: "0.00",
    netAmount: "0.00",
});

const getRecords = (res: any) => {
    return Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.records)
            ? res.records
            : Array.isArray(res?.docs)
                ? res.docs
                : Array.isArray(res?.data?.items)
                    ? res.data.items
                    : Array.isArray(res?.data?.records)
                        ? res.data.records
                        : Array.isArray(res?.data?.docs)
                            ? res.data.docs
                            : Array.isArray(res?.data)
                                ? res.data
                                : Array.isArray(res)
                                    ? res
                                    : [];
};

const CONDITIONAL_MARGIN_FIELD_KEYS = new Set([
    "taxRate",
    "nonTaxRate",
    "taxGross",
    "nonTaxGross",
]);

export const loadFieldOptions = async (
    fields: any[]
) => {
    const updatedFields =
        await Promise.all(
            (fields || []).map(
                async (field: any) => {
                    const fieldType =
                        String(
                            field?.type ||
                            field?.dataSource
                                ?.type ||
                            ""
                        ).toLowerCase();

                    /*
                     * Existing pages continue using field.api.
                     * Account Master productmaster uses
                     * field.dataSource.api.
                     */
                    const api =
                        field?.api ||
                        (
                            fieldType ===
                                "productmaster"
                                ? field
                                    ?.dataSource
                                    ?.api
                                : ""
                        );

                    if (!api) {
                        return field;
                    }

                    try {
                        const labelField =
                            field
                                ?.labelField ||
                            field
                                ?.dataSource
                                ?.labelField ||
                            (
                                fieldType ===
                                    "productmaster"
                                    ? "productName"
                                    : ""
                            );

                        const valueField =
                            field
                                ?.valueField ||
                            field
                                ?.dataSource
                                ?.valueField ||
                            (
                                fieldType ===
                                    "productmaster"
                                    ? "productCode"
                                    : ""
                            );

                        const apiUrl =
                            String(api).startsWith(
                                "/eTaxSolnMongoApiBackend"
                            )
                                ? String(api)
                                : `/eTaxSolnMongoApiBackend${String(
                                    api
                                ).startsWith(
                                    "/"
                                )
                                    ? api
                                    : `/${api}`
                                }`;

                        console.log(
                            "[loadFieldOptions] calling:",
                            apiUrl
                        );

                        const res =
                            await professionalAxios.get(
                                apiUrl,
                                {
                                    params:
                                        field
                                            ?.queryParams ||
                                        field
                                            ?.dataSource
                                            ?.queryParams ||
                                        {},
                                }
                            );

                        const records =
                            getRecords(
                                res.data
                            );

                        const options =
                            Array.isArray(
                                records
                            )
                                ? records
                                    .map(
                                        (
                                            item: any
                                        ) => {
                                            const value =
                                                item?.[
                                                valueField
                                                ] ||
                                                item
                                                    ?.productCode ||
                                                item
                                                    ?.code ||
                                                item
                                                    ?._id ||
                                                "";

                                            const label =
                                                item?.[
                                                labelField
                                                ] ||
                                                item
                                                    ?.productName ||
                                                item
                                                    ?.name ||
                                                value;

                                            return {
                                                label:
                                                    String(
                                                        label ||
                                                        ""
                                                    ),

                                                value:
                                                    String(
                                                        value ||
                                                        ""
                                                    ),

                                                raw:
                                                    item,
                                            };
                                        }
                                    )
                                    .filter(
                                        (
                                            option: any
                                        ) =>
                                            option.value
                                    )
                                : [];

                        console.log(
                            `[loadFieldOptions] ${field.key} options:`,
                            options
                        );

                        return {
                            ...field,
                            options,
                        };
                    } catch (
                    error
                    ) {
                        console.log(
                            `Failed to load options for ${field.key}`,
                            error
                        );

                        return {
                            ...field,
                            options: [],
                        };
                    }
                }
            )
        );

    return updatedFields;
};

const loadAllTemplateOptions = async (templateData: any) => {
    const [
        updatedHeader,
        updatedBody,
        updatedFooter,
    ] = await Promise.all([
        loadFieldOptions(templateData?.header || []),
        loadFieldOptions(templateData?.body || []),
        loadFieldOptions(templateData?.footer || []),
    ]);

    return {
        ...templateData,
        header: updatedHeader,
        body: updatedBody,
        footer: updatedFooter,
    };
};

const getFinancialYearRange = (dateValue?: string) => {
    const selectedDate = dateValue ? new Date(`${dateValue}T23:59:59.999`) : new Date();
    const financialYear = selectedDate.getMonth() >= 3 ? selectedDate.getFullYear() : selectedDate.getFullYear() - 1;
    return {
        fromDate: new Date(financialYear, 3, 1, 0, 0, 0, 0).toISOString(),
        toDate: selectedDate.toISOString(),
    };
};

const renderSalesOrderCellExtra = (
    column: any,
    row: any,
    enableServiceProductInventory: boolean
) => {
    if (column?.key !== "quantity" || !row?.productCode) return null;

    const productType = String(row?.productType || "").trim().toLowerCase();

    if (productType === "nonstocks") return null;

    if (
        productType === "serviceproduct" &&
        !enableServiceProductInventory
    ) {
        return null;
    }

    return (
        <InputBorderLabel
            label="Avl Qty"
            value={row?.availableQuantity}
            loading={
                row?.availableQuantity === null ||
                row?.availableQuantity === undefined
            }
            successWhenPositive
        />
    );
};

const SalesOrder = () => {
    const dispatch = useDispatch<any>();

    const salesOrderState = useSelector(
        (state: any) => state.salesOrder
    );

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const {
        salesOrders = [],
        pagination = defaultPagination,
        loading = false,
        createLoading = false,
        updateLoading = false,
        deleteLoading = false,
    } = salesOrderState || {};

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const [status, setStatus] =
        useState<"open" | "close" | undefined>("open");

    const [showModal, setShowModal] = useState(false);

    // ★ ADDED: Account Master modal state
    const [checkAccount, setCheckAccount] = useState(false);

    // ⭐ YELLOW STAR: ADDED — PRODUCT MASTER MODAL STATE
    const [checkProduct, setCheckProduct] = useState(false);

    // ⭐ YELLOW STAR: ADDED — PRODUCT ROW THAT OPENED MODAL
    const [
        productTargetRowIndex,
        setProductTargetRowIndex,
    ] = useState<number | null>(null);

    // ⭐ YELLOW STAR: ADDED — SEARCH VALUE FOR PRODUCT MODAL
    const [
        productSearchValue,
        setProductSearchValue,
    ] = useState("");

    // ★ ADDED: Account Master list loading guard
    const [accountListLoaded, setAccountListLoaded] =
        useState(false);

    const [editingRecord, setEditingRecord] =
        useState<any>(false);

    const [form, setForm] = useState<any>(
        getDefaultForm()
    );
    const { company } = useSelector((state: any) => state.professionalCompanyMaster);

    const [errors, setErrors] = useState<any>({});

    const [
        showPurchaseOrderModal,
        setShowPurchaseOrderModal,
    ] = useState(false);

    const [
        purchaseOrderSearch,
        setPurchaseOrderSearch,
    ] = useState("");

    const [
        selectedPurchaseOrder,
        setSelectedPurchaseOrder,
    ] = useState<any>(null);

    const {
        salesQuotations,
        loading: salesQuatationLoader,
    } = useSelector(
        (state: any) => state.salesQuotation
    );

    const [
        templateFields,
        setTemplateFields,
    ] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    const [fieldsLoading, setFieldsLoading] =
        useState(false);

    const [
        confirmTooltip,
        setConfirmTooltip,
    ] = useState<ConfirmTooltipState>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });

    const [downlaodPDF, setDownlaodPDF]: any = useState({
        show: false,
        x: null,
        y: null,
        type: "",
    });

    const { report } = useSelector((state: any) => state.reportMapping);

    const { configurations } = useSelector((state: any) => state.systemConfiguration);

    const enableServiceProductInventory = useMemo(() => {
        const value = configurations?.[0]?.inventoryConfiguration?.enableServiceProductInventory;
        return value === true || value === "true";
    }, [configurations]);

    const { accounts = [] } = useSelector((state: any) => state.accountMaster || {});

    // ★ ADDED: Customer accounts
    const filterAccount = useMemo(() => {
        return (accounts || []).filter(
            (account: any) =>
                String(
                    account?.accountType || ""
                ).toLowerCase() === "customer"
        );
    }, [accounts]);

    // ⭐ YELLOW STAR: ADDED — ACCOUNT AND PRODUCT CREATE ACTIONS
    const templateFieldsWithCreateActions = useMemo(() => {
        return {
            ...templateFields,

            header: (templateFields?.header || []).map(
                (field: any) => {
                    const fieldKey = String(
                        field?.key || ""
                    );

                    if (!CUSTOMER_FIELD_KEYS.has(fieldKey)) {
                        return field;
                    }

                    return {
                        ...field,
                        largeData: true,
                        showCreateOnEmpty: true,
                        onCreateOption: (
                            _searchValue: string
                        ) => {
                            setCheckAccount(true);
                        },
                        createOptionLabel: (
                            searchValue: string
                        ) =>
                            searchValue
                                ? `+ Add "${searchValue}" as New Customer`
                                : "+ Add New Customer",
                    };
                }
            ),

            body: (templateFields?.body || []).map(
                (field: any) => {
                    const fieldKey = String(
                        field?.key || ""
                    );

                    if (!PRODUCT_FIELD_KEYS.has(fieldKey)) {
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
                            setProductTargetRowIndex(rowIndex);
                            setProductSearchValue(searchValue);
                            setCheckProduct(true);
                        },
                        createOptionLabel: (
                            searchValue: string
                        ) =>
                            searchValue
                                ? `+ Add "${searchValue}" as New Product`
                                : "+ Add New Product",
                    };
                }
            ),
        };
    }, [templateFields]);

    const isTrueValue = (value: any) =>
        value === true ||
        String(value ?? "").toLowerCase() === "true";

    const getHeaderFieldByKey = (key: string) =>
        templateFields?.header?.find(
            (field: any) => field.key === key
        );

    const getBodyFieldByKey = (key: string) =>
        templateFields?.body?.find(
            (field: any) => field.key === key
        );

    const getOptionByValue = (
        field: any,
        selectedValue: any
    ) =>
        field?.options?.find(
            (option: any) =>
                String(option.value) ===
                String(selectedValue)
        );

    const getProductMasterFromRow = (row: any) => {
        if (!row) return null;

        const rowProductValues = [
            row?.productCode,
            row?.productId,
            row?.productName,
        ]
            .filter(
                (value) =>
                    value !== undefined &&
                    value !== null &&
                    value !== ""
            )
            .map((value) => String(value));

        if (!rowProductValues.length) {
            return null;
        }

        const productFields = (
            templateFields?.body || []
        ).filter((field: any) =>
            [
                "productCode",
                "productId",
                "productName",
            ].includes(field?.key)
        );

        for (const field of productFields) {
            const selectedOption = (
                field?.options || []
            ).find((option: any) => {
                const optionValues = [
                    option?.value,
                    option?.raw?._id,
                    option?.raw?.productId,
                    option?.raw?.productCode,
                    option?.raw?.productName,
                ]
                    .filter(
                        (value) =>
                            value !== undefined &&
                            value !== null &&
                            value !== ""
                    )
                    .map((value) => String(value));

                return optionValues.some((value) =>
                    rowProductValues.includes(value)
                );
            });

            if (selectedOption?.raw) {
                return selectedOption.raw;
            }
        }

        return null;
    };

    const isMarginProductRow = (row: any) => {
        if (isTrueValue(row?.marginProduct)) {
            return true;
        }

        const productMaster =
            getProductMasterFromRow(row);

        return isTrueValue(
            productMaster?.marginProduct
        );
    };

    const isBodyFieldVisibleForRow = (
        field: any,
        row: any
    ) => {
        if (!field?.key) return false;

        if (
            CONDITIONAL_MARGIN_FIELD_KEYS.has(
                field.key
            )
        ) {
            return isMarginProductRow(row);
        }

        return !isTrueValue(field?.isHidden);
    };

    const isBodyColumnVisible = (
        field: any,
        rows: any[]
    ) => {
        if (!field?.key) return false;

        if (
            CONDITIONAL_MARGIN_FIELD_KEYS.has(
                field.key
            )
        ) {
            return (rows || []).some(
                (row: any) =>
                    isMarginProductRow(row)
            );
        }

        return !isTrueValue(field?.isHidden);
    };

    const isBodyCellVisible = (
        field: any,
        row: any
    ) => {
        return isBodyFieldVisibleForRow(
            field,
            row
        );
    };

    const applyMappedFields = (
        field: any,
        selectedValue: any,
        oldData: any
    ) => {
        if (!field) return oldData;

        const selectedOption =
            getOptionByValue(
                field,
                selectedValue
            );

        const raw =
            selectedOption?.raw || {};

        const updated = {
            ...oldData,
            [field.key]: selectedValue,
        };

        if (field?.mapFields && raw) {
            Object.entries(
                field.mapFields
            ).forEach(
                ([targetKey, sourceKey]) => {
                    updated[targetKey] =
                        raw?.[
                        sourceKey as string
                        ] ??
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

        return updated;
    };

    const getUnitLabelFromSchema = (
        unitCode: string
    ) => {
        const unitField =
            templateFields?.body?.find(
                (field: any) =>
                    field.key === "uom" ||
                    field.key === "unit"
            );

        const selectedUnit =
            unitField?.options?.find(
                (item: any) =>
                    String(item.value) ===
                    String(unitCode)
            );

        return selectedUnit?.label || unitCode || "";
    };

    const normalizeRowKeys = (row: any) => {
        const updated = {
            ...row,
        };

        if (updated.uom && !updated.unit) {
            updated.unit = updated.uom;
        }

        if (updated.unit && !updated.uom) {
            updated.uom = updated.unit;
        }

        if (
            updated.productDescription &&
            !updated.description
        ) {
            updated.description =
                updated.productDescription;
        }

        if (
            updated.description &&
            !updated.productDescription
        ) {
            updated.productDescription =
                updated.description;
        }

        if (
            updated.netAmount &&
            !updated.netTotal
        ) {
            updated.netTotal =
                updated.netAmount;
        }

        if (
            updated.netTotal &&
            !updated.netAmount
        ) {
            updated.netAmount =
                updated.netTotal;
        }

        if (
            updated.gross &&
            !updated.grossAmount
        ) {
            updated.grossAmount =
                updated.gross;
        }

        if (
            updated.grossAmount &&
            !updated.gross
        ) {
            updated.gross =
                updated.grossAmount;
        }

        updated.unitName =
            getUnitLabelFromSchema(
                updated.unit ||
                updated.uom
            );

        return updated;
    };

    const calculateRow = (row: any) => {
        const quantity = num(row.quantity);
        const rate = num(row.rate);

        const marginProduct =
            row?.marginProduct === true ||
            String(
                row?.marginProduct
            ).toLowerCase() === "true";

        const gross =
            quantity * rate;

        const taxGross = marginProduct
            ? num(row.taxRate) * quantity
            : 0;

        const nonTaxGross = marginProduct
            ? num(row.nonTaxRate) * quantity
            : 0;

        const discountPercent =
            safePercent(
                row.discountPercentage ||
                row.discount
            );

        const cgstPercent =
            safePercent(
                row.cgstPercentage !== undefined &&
                    row.cgstPercentage !== null &&
                    row.cgstPercentage !== ""
                    ? row.cgstPercentage
                    : row.cgst
            );

        const sgstPercent =
            safePercent(
                row.sgstPercentage !== undefined &&
                    row.sgstPercentage !== null &&
                    row.sgstPercentage !== ""
                    ? row.sgstPercentage
                    : row.sgst
            );

        const igstPercent =
            safePercent(
                row.igstPercentage !== undefined &&
                    row.igstPercentage !== null &&
                    row.igstPercentage !== ""
                    ? row.igstPercentage
                    : row.igst
            );

        const discountAmount =
            (gross * discountPercent) /
            100;

        const taxableAmount =
            gross - discountAmount;

        const cgstAmount =
            (taxableAmount *
                cgstPercent) /
            100;

        const sgstAmount =
            (taxableAmount *
                sgstPercent) /
            100;

        const igstAmount =
            (taxableAmount *
                igstPercent) /
            100;

        const otherAmount =
            num(row.otherAmount);

        const taxAmount =
            cgstAmount +
            sgstAmount +
            igstAmount;

        const netAmount =
            taxableAmount +
            taxAmount +
            otherAmount;

        return {
            ...row,

            quantity: row.quantity,
            rate: row.rate,

            gross,
            grossAmount: gross,

            discount: row.discount,

            discountPercentage:
                row.discountPercentage ||
                row.discount,

            discountAmount,
            taxableAmount,

            cgst: cgstPercent,
            cgstPercentage: cgstPercent,
            cgstAmount,

            sgst: sgstPercent,
            sgstPercentage: sgstPercent,
            sgstAmount,

            igst: igstPercent,
            igstPercentage: igstPercent,
            igstAmount,
            taxAmount,

            otherAmount:
                row.otherAmount,

            netAmount,
            netTotal: netAmount,

            marginProduct,

            taxRate: marginProduct
                ? row.taxRate
                : "",

            nonTaxRate: marginProduct
                ? row.nonTaxRate
                : "",

            taxGross: marginProduct
                ? taxGross.toFixed(2)
                : "",

            nonTaxGross: marginProduct
                ? nonTaxGross.toFixed(2)
                : "",
        };
    };

    const calculateFooter = (
        products: any[]
    ) => {
        return (products || []).reduce(
            (acc: any, item: any) => {
                acc.totalQuantity +=
                    num(item.quantity);

                acc.totalGrossAmount +=
                    num(item.gross);

                acc.totalDiscountAmount +=
                    num(item.discountAmount);

                acc.totalCgstAmount +=
                    num(item.cgstAmount);

                acc.totalSgstAmount +=
                    num(item.sgstAmount);

                acc.totalIgstAmount +=
                    num(item.igstAmount);

                acc.totalTaxAmount +=
                    num(item.taxAmount);

                acc.totalOtherAmount +=
                    num(item.otherAmount);

                acc.totalNetAmount +=
                    num(item.netAmount);

                return acc;
            },
            {
                totalQuantity: 0,
                totalGrossAmount: 0,
                totalDiscountAmount: 0,
                totalCgstAmount: 0,
                totalSgstAmount: 0,
                totalIgstAmount: 0,
                totalTaxAmount: 0,
                totalOtherAmount: 0,
                totalNetAmount: 0,
            }
        );
    };

    const footerTotals = useMemo(
        () =>
            calculateFooter(
                form.products || []
            ),
        [form.products]
    );

    const grossAmount =
        footerTotals.totalGrossAmount;

    const discountAmount =
        footerTotals.totalDiscountAmount;

    const cgstAmount =
        footerTotals.totalCgstAmount;

    const sgstAmount =
        footerTotals.totalSgstAmount;

    const igstAmount =
        footerTotals.totalIgstAmount;

    const netAmount =
        footerTotals.totalNetAmount;

    const fetchSalesOrders = async () => {
        await dispatch(
            getAllSalesOrder({
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
                "salesOrder"
            ) as any
        );
    }, [dispatch]);

    useEffect(() => {
        fetchSalesOrders();
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
        const prepareFields = async () => {
            if (!transactionsSchema) return;

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

            if (!hasSchema) return;

            try {
                setFieldsLoading(true);

                const updatedData =
                    await loadAllTemplateOptions(
                        transactionsSchema
                    );

                setTemplateFields(
                    updatedData
                );
            } catch (error) {
                console.log(
                    "Failed to prepare template fields",
                    error
                );
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    const columns = [
        {
            key:
                "sOrderVoucherNumber",
            title: "Voucher No",
        },
        {
            key:
                "sOrderVoucherDate",
            title: "Date",

            render: (row: any) =>
                row?.sOrderVoucherDate
                    ? formatDateForList(
                        row.sOrderVoucherDate
                    )
                    : "-",
        },
        {
            key:
                "sOrderCustomerName",
            title: "Customer",

            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.sOrderCustomerName ||
                            "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.sOrderCustomerCode ||
                            "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "sOrderBody",
            title: "Items",

            render: (row: any) =>
                row?.sOrderBody
                    ?.length || 0,
        },
        {
            key: "sOrderFooter",
            title: "Net Amount",
            type: "amount",

            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(
                        row?.sOrderFooter
                            ?.netAmount ||
                        0
                    )}
                </span>
            ),
        },
        {
            key:
                "sOrderDocStatus",
            title: "Doc Status",

            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${(
                        row?.sOrderDocStatus ||
                        row?.sOrderStatus
                    ) === "open"
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-danger/20 bg-danger/10 text-danger"
                        }`}
                >
                    {row?.sOrderDocStatus ||
                        row?.sOrderStatus ||
                        "-"}
                </span>
            ),
        },
    ];

    const handleStatusChange = (
        nextStatus: string
    ) => {
        setStatus(
            nextStatus as any
        );

        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchSalesOrders();

            toast.success(
                "Sales order list refreshed"
            );
        } finally {
            setRefreshing(false);
        }
    };

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
        setCheckAccount(false);
        setCheckProduct(false);
        setProductTargetRowIndex(null);
        setProductSearchValue("");
    };

    const openAddModal = () => {
        resetMainForm();
        setShowPurchaseOrderModal(
            true
        );
    };

    const loadAvailableQuantity = async (
        index: number,
        productCode: string,
        productType: string,
        // @ts-ignore
        voucherDate: string = form.sOrderVoucherDate
    ) => {
        const normalizedProductType = String(productType || "").trim().toLowerCase();

        if (
            !productCode ||
            normalizedProductType === "nonstocks" ||
            (
                normalizedProductType === "serviceproduct" &&
                !enableServiceProductInventory
            )
        ) {
            setForm((previous: any) => {
                const updatedProducts = [...(previous.products || [])];
                if (!updatedProducts[index]) return previous;

                updatedProducts[index] = {
                    ...updatedProducts[index],
                    productType: normalizedProductType,
                    availableQuantity: null,
                };

                return {
                    ...previous,
                    products: updatedProducts,
                };
            });
            return;
        }

        setForm((previous: any) => {
            const updatedProducts = [...(previous.products || [])];
            if (!updatedProducts[index] || String(updatedProducts[index]?.productCode || "") !== String(productCode)) return previous;

            updatedProducts[index] = {
                ...updatedProducts[index],
                productType: normalizedProductType,
                availableQuantity: null,
            };

            return {
                ...previous,
                products: updatedProducts,
            };
        });

        try {
            const { fromDate, toDate } = getFinancialYearRange(todayYMD());
            const balance: any = await dispatch(
                getProductBalance({
                    productCode,
                    fromDate,
                    toDate,
                }) as any
            ).unwrap();

            setForm((previous: any) => {
                const updatedProducts = [...(previous.products || [])];
                if (!updatedProducts[index] || String(updatedProducts[index]?.productCode || "") !== String(productCode)) return previous;

                updatedProducts[index] = {
                    ...updatedProducts[index],
                    productType: normalizedProductType,
                    availableQuantity: balance?.balanceQuantity !== undefined && balance?.balanceQuantity !== null ? balance.balanceQuantity : null,
                };

                return {
                    ...previous,
                    products: updatedProducts,
                };
            });
        } catch (error) {
            console.log(`Failed to fetch available quantity for ${productCode}`, error);

            setForm((previous: any) => {
                const updatedProducts = [...(previous.products || [])];
                if (!updatedProducts[index] || String(updatedProducts[index]?.productCode || "") !== String(productCode)) return previous;

                updatedProducts[index] = {
                    ...updatedProducts[index],
                    productType: normalizedProductType,
                    availableQuantity: updatedProducts[index]?.availableQuantity ?? null,
                };

                return {
                    ...previous,
                    products: updatedProducts,
                };
            });
        }
    };

    const openEditModal = (
        record: any
    ) => {
        const footer =
            record?.sOrderFooter || {};

        const voucherDate =
            record?.sOrderVoucherDate
                ? formatDateForInput(
                    record.sOrderVoucherDate
                )
                : todayYMD();

        const products =
            record?.sOrderBody
                ?.length > 0
                ? record.sOrderBody.map(
                    (item: any) => {
                        const unitCode =
                            item?.unit ||
                            item?.uom ||
                            "";

                        const productMaster =
                            getProductMasterFromRow(
                                item
                            ) || {};

                        const row =
                            normalizeRowKeys({
                                ...(
                                    item?.dynamicBodyFields ||
                                    {}
                                ),

                                ...item,

                                id:
                                    item?.id ||
                                    Date.now() +
                                    Math.random(),

                                productCode:
                                    item?.productCode ||
                                    "",

                                productName:
                                    item?.productName ||
                                    "",

                                productId:
                                    item?.productId ||
                                    "",

                                productDescription:
                                    item?.productDescription ||
                                    item?.description ||
                                    "",

                                description:
                                    item?.description ||
                                    item?.productDescription ||
                                    "",

                                productHSNCode:
                                    item?.productHSNCode ||
                                    "",

                                remarks:
                                    item?.remarks ||
                                    "",

                                quantity:
                                    item?.quantity ||
                                    "",

                                // ⭐ YELLOW STAR: ADDED — AVAILABLE QTY EDIT INITIAL STATE
                                availableQuantity:
                                    null,

                                productType:
                                    item?.productType ||
                                    productMaster
                                        ?.productType ||
                                    productMaster
                                        ?.dynamicFields
                                        ?.productType ||
                                    "",

                                unit:
                                    unitCode,

                                uom:
                                    unitCode,

                                unitName:
                                    item?.unitName ||
                                    getUnitLabelFromSchema(
                                        unitCode
                                    ),

                                rate:
                                    item?.rate ||
                                    "",

                                gross:
                                    item?.gross ||
                                    item?.grossAmount ||
                                    0,

                                grossAmount:
                                    item?.grossAmount ||
                                    item?.gross ||
                                    0,

                                discount:
                                    item?.discount ||
                                    item?.discountPercentage ||
                                    "",

                                discountPercentage:
                                    item?.discountPercentage ||
                                    item?.discount ||
                                    "",

                                discountAmount:
                                    item?.discountAmount ||
                                    0,

                                taxableAmount:
                                    item?.taxableAmount ||
                                    0,

                                cgst:
                                    item?.cgst ||
                                    item?.cgstPercentage ||
                                    "",

                                cgstPercentage:
                                    item?.cgstPercentage ||
                                    item?.cgst ||
                                    "",

                                cgstAmount:
                                    item?.cgstAmount ||
                                    0,

                                sgst:
                                    item?.sgst ||
                                    item?.sgstPercentage ||
                                    "",

                                sgstPercentage:
                                    item?.sgstPercentage ||
                                    item?.sgst ||
                                    "",

                                sgstAmount:
                                    item?.sgstAmount ||
                                    0,

                                igst:
                                    item?.igst ||
                                    item?.igstPercentage ||
                                    "",

                                igstPercentage:
                                    item?.igstPercentage ||
                                    item?.igst ||
                                    "",

                                igstAmount:
                                    item?.igstAmount ||
                                    0,

                                taxAmount:
                                    item?.taxAmount ||
                                    0,

                                otherAmount:
                                    item?.otherAmount ||
                                    0,

                                netAmount:
                                    item?.netAmount ||
                                    item?.netTotal ||
                                    0,

                                netTotal:
                                    item?.netTotal ||
                                    item?.netAmount ||
                                    0,

                                marginProduct:
                                    isTrueValue(
                                        item?.marginProduct
                                    ),

                                nonTaxRate:
                                    item?.nonTaxRate ??
                                    item
                                        ?.dynamicBodyFields
                                        ?.nonTaxRate ??
                                    "",

                                taxGross:
                                    item?.taxGross ??
                                    item
                                        ?.dynamicBodyFields
                                        ?.taxGross ??
                                    "",

                                nonTaxGross:
                                    item?.nonTaxGross ??
                                    item
                                        ?.dynamicBodyFields
                                        ?.nonTaxGross ??
                                    "",
                            });

                        return calculateRow(
                            row
                        );
                    }
                )
                : [
                    {
                        ...emptyProductRow,
                        id: Date.now(),
                    },
                ];

        setEditingRecord(true);
        setErrors({});

        setForm({
            sOrderVoucherNumber:
                record?.sOrderVoucherNumber ||
                "AUTO",

            sOrderVoucherDate:
                voucherDate,

            sOrderCustomerCode:
                record?.sOrderCustomerCode ||
                "",

            sOrderCustomerName:
                record?.sOrderCustomerName ||
                "",

            sOrderSalesAccount:
                record?.sOrderSalesAccount ||
                "SA021",

            sOrderDocStatus:
                record?.sOrderDocStatus ||
                record?.sOrderStatus ||
                "open",

            sOrderStatus:
                record?.sOrderStatus ||
                record?.sOrderDocStatus ||
                "open",

            sOrderRemark:
                record?.sOrderRemark ||
                record?.sOrderRemarks ||
                "",

            sOrderRemarks:
                record?.sOrderRemarks ||
                record?.sOrderRemark ||
                "",

            isAutoPost:
                record?.isAutoPost ||
                false,

            products,

            grossAmount:
                footer?.grossAmount ||
                footer?.totalGrossAmount ||
                "0.00",

            discountAmount:
                footer?.discountAmount ||
                footer?.totalDiscountAmount ||
                "0.00",

            cgstAmount:
                footer?.cgstAmount ||
                footer?.totalCgstAmount ||
                "0.00",

            sgstAmount:
                footer?.sgstAmount ||
                footer?.totalSgstAmount ||
                "0.00",

            igstAmount:
                footer?.igstAmount ||
                footer?.totalIgstAmount ||
                "0.00",

            taxAmount:
                footer?.taxAmount ||
                footer?.totalTaxAmount ||
                "0.00",

            otherAmount:
                footer?.otherAmount ||
                footer?.totalOtherAmount ||
                "0.00",

            netAmount:
                footer?.netAmount ||
                footer?.totalNetAmount ||
                "0.00",
        });

        setShowModal(true);
    };

    // ⭐ YELLOW STAR: ADDED — LOAD AVAILABLE QTY AFTER EDIT FORM IS HYDRATED
    useEffect(() => {
        if (
            !showModal ||
            !editingRecord
        ) {
            return;
        }

        if (
            !form?.products?.length
        ) {
            return;
        }

        let cancelled = false;

        const fetchEditAvailableQuantities =
            async () => {
                const {
                    fromDate,
                    toDate,
                } = getFinancialYearRange(
                    todayYMD()
                );

                const productsWithBalance =
                    await Promise.all(
                        (
                            form.products ||
                            []
                        ).map(
                            async (
                                item: any
                            ) => {
                                const productCode =
                                    String(
                                        item
                                            ?.productCode ||
                                        ""
                                    ).trim();

                                if (
                                    !productCode
                                ) {
                                    return item;
                                }

                                const productMaster =
                                    getProductMasterFromRow(
                                        item
                                    ) || {};

                                const productType =
                                    String(
                                        item
                                            ?.productType ||
                                        productMaster
                                            ?.productType ||
                                        productMaster
                                            ?.dynamicFields
                                            ?.productType ||
                                        ""
                                    )
                                        .trim()
                                        .toLowerCase();

                                if (
                                    productType === "nonstocks" ||
                                    (
                                        productType === "serviceproduct" &&
                                        !enableServiceProductInventory
                                    )
                                ) {
                                    return {
                                        ...item,
                                        productType,
                                        availableQuantity:
                                            null,
                                    };
                                }

                                try {
                                    const balance: any =
                                        await dispatch(
                                            getProductBalance({
                                                productCode,
                                                fromDate,
                                                toDate,
                                            }) as any
                                        ).unwrap();

                                    return {
                                        ...item,
                                        productType,
                                        availableQuantity:
                                            balance?.balanceQuantity !== undefined &&
                                                balance?.balanceQuantity !== null
                                                ? balance.balanceQuantity
                                                : null,
                                    };
                                } catch (
                                error
                                ) {
                                    console.log(
                                        `Failed to fetch available quantity for ${productCode}`,
                                        error
                                    );

                                    return {
                                        ...item,
                                        productType,
                                        availableQuantity:
                                            item?.availableQuantity ?? null,
                                    };
                                }
                            }
                        )
                    );

                if (cancelled) {
                    return;
                }

                setForm(
                    (
                        previous: any
                    ) => ({
                        ...previous,
                        products:
                            productsWithBalance,
                    })
                );
            };

        void fetchEditAvailableQuantities();

        return () => {
            cancelled = true;
        };
    }, [
        showModal,
        editingRecord,
        form?.sOrderVoucherNumber,
        dispatch,
        enableServiceProductInventory,
    ]);

    const handleMainChange = (
        key: string,
        value: any
    ) => {
        setForm((previous: any) => {
            const currentField =
                getHeaderFieldByKey(key);

            let updated = {
                ...previous,
                [key]: value,
            };

            if (
                currentField?.mapFields
            ) {
                updated =
                    applyMappedFields(
                        currentField,
                        value,
                        updated
                    );
            }

            return updated;
        });

        setErrors((previous: any) => ({
            ...previous,
            [key]: "",
        }));
    };

    // ★ ADDED: Refresh customer dropdown after Account Master save
    const handleAccountSaved = async (
        savedResponse: any
    ) => {
        try {
            const accountResponse =
                await dispatch(
                    getAllAccounts({
                        offset: 0,
                        limit: 100,
                        search: "",
                    }) as any
                ).unwrap();

            setAccountListLoaded(true);

            // ★ REFRESH SALES ORDER REPORT MAPPING
            await dispatch(
                getAllReportMapping({
                    moduleType:
                        "salesOrder",
                }) as any
            );

            // ★ RELOAD ALL DYNAMIC FIELD OPTIONS
            if (transactionsSchema) {
                const updatedData =
                    await loadAllTemplateOptions(
                        transactionsSchema
                    );

                setTemplateFields(
                    updatedData
                );
            }

            const savedAccount =
                savedResponse?.data
                    ?.account ||
                savedResponse?.data
                    ?.data ||
                savedResponse?.data ||
                savedResponse?.account ||
                savedResponse;

            const refreshedAccounts =
                accountResponse?.data
                    ?.accounts ||
                accountResponse?.data
                    ?.data
                    ?.accounts ||
                accountResponse
                    ?.accounts ||
                accountResponse?.data
                    ?.items ||
                accountResponse?.items ||
                accountResponse?.data ||
                [];

            const customerAccounts =
                Array.isArray(
                    refreshedAccounts
                )
                    ? refreshedAccounts.filter(
                        (account: any) =>
                            String(
                                account?.accountType ||
                                ""
                            ).toLowerCase() ===
                            "customer"
                    )
                    : [];

            const savedCode =
                savedAccount?.accountCode ||
                "";

            const savedName =
                savedAccount?.accountName ||
                "";

            const createdCustomer =
                customerAccounts.find(
                    (account: any) =>
                        (
                            savedCode &&
                            String(
                                account?.accountCode
                            ) ===
                            String(savedCode)
                        ) ||
                        (
                            savedName &&
                            String(
                                account?.accountName
                            ) ===
                            String(savedName)
                        )
                ) ||
                (
                    savedCode ||
                        savedName
                        ? savedAccount
                        : null
                ) ||
                customerAccounts[
                customerAccounts.length -
                1
                ] ||
                null;

            if (createdCustomer) {
                setForm(
                    (previous: any) => ({
                        ...previous,

                        sOrderCustomerCode:
                            createdCustomer
                                ?.accountCode ||
                            previous
                                ?.sOrderCustomerCode ||
                            "",

                        sOrderCustomerName:
                            createdCustomer
                                ?.accountName ||
                            previous
                                ?.sOrderCustomerName ||
                            "",
                    })
                );

                setErrors(
                    (previous: any) => ({
                        ...previous,
                        sOrderCustomerCode:
                            "",
                        sOrderCustomerName:
                            "",
                    })
                );
            }
        } catch (error: any) {
            console.log(
                "Failed to refresh Sales Order customer options:",
                error
            );

            toast.error(
                error?.message ||
                "Account created, but Sales Order customer dropdown refresh failed"
            );
        } finally {
            setCheckAccount(false);
        }
    };

    // ⭐ YELLOW STAR: ADDED — REFRESH PRODUCT OPTIONS AND AUTO-SELECT CREATED PRODUCT
    const handleProductSaved = async (
        savedResponse: any
    ) => {
        try {
            await dispatch(
                getAllReportMapping({
                    moduleType: "salesOrder",
                }) as any
            ).unwrap();

            let updatedData = templateFields;

            if (transactionsSchema) {
                updatedData =
                    await loadAllTemplateOptions(
                        transactionsSchema
                    );

                setTemplateFields(
                    updatedData
                );
            }

            const savedProduct =
                savedResponse?.data?.product ||
                savedResponse?.data?.data?.product ||
                savedResponse?.data?.data ||
                savedResponse?.data ||
                savedResponse?.product ||
                savedResponse;

            const savedCode =
                savedProduct?.productCode ||
                "";

            const savedName =
                savedProduct?.productName ||
                "";

            const productFields = (
                updatedData?.body || []
            ).filter((field: any) =>
                PRODUCT_FIELD_KEYS.has(
                    String(field?.key || "")
                )
            );

            let selectedField: any = null;
            let selectedOption: any = null;

            for (const field of productFields) {
                const option = (
                    field?.options || []
                ).find((item: any) => {
                    const raw =
                        item?.raw || {};

                    return (
                        (
                            savedCode &&
                            String(
                                raw?.productCode ||
                                item?.value ||
                                ""
                            ) ===
                            String(savedCode)
                        ) ||
                        (
                            savedName &&
                            String(
                                raw?.productName ||
                                item?.label ||
                                ""
                            ) ===
                            String(savedName)
                        )
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
                savedProduct ||
                {};

            const availableQuantityRowIndex =
                productTargetRowIndex !== null &&
                    productTargetRowIndex >= 0 &&
                    productTargetRowIndex < (form.products || []).length
                    ? productTargetRowIndex
                    : (() => {
                        const emptyRowIndex = (form.products || []).findIndex(
                            (row: any) =>
                                !row?.productCode &&
                                !row?.productName &&
                                !row?.productId
                        );
                        return emptyRowIndex >= 0
                            ? emptyRowIndex
                            : (form.products || []).length;
                    })();

            setForm((previous: any) => {
                const updatedProducts = [
                    ...(previous.products || []),
                ];

                let rowIndex =
                    productTargetRowIndex !== null &&
                        productTargetRowIndex >= 0 &&
                        productTargetRowIndex <
                        updatedProducts.length
                        ? productTargetRowIndex
                        : updatedProducts.findIndex(
                            (row: any) =>
                                !row?.productCode &&
                                !row?.productName &&
                                !row?.productId
                        );

                if (rowIndex < 0) {
                    rowIndex =
                        updatedProducts.length;

                    updatedProducts.push({
                        ...emptyProductRow,
                        id: Date.now(),
                    });
                }

                let updatedRow = {
                    ...(
                        updatedProducts[
                        rowIndex
                        ] ||
                        emptyProductRow
                    ),
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

                const marginProduct =
                    isTrueValue(
                        createdProduct
                            ?.dynamicFields
                            ?.marginProduct ??
                        createdProduct
                            ?.marginProduct
                    );

                updatedRow = {
                    ...updatedRow,

                    productCode:
                        createdProduct
                            ?.productCode ||
                        savedCode ||
                        updatedRow
                            ?.productCode ||
                        "",

                    productName:
                        createdProduct
                            ?.productName ||
                        savedName ||
                        updatedRow
                            ?.productName ||
                        "",

                    productId:
                        createdProduct
                            ?._id ||
                        createdProduct
                            ?.productId ||
                        updatedRow
                            ?.productId ||
                        "",

                    productDescription:
                        createdProduct
                            ?.productDescription ||
                        updatedRow
                            ?.productDescription ||
                        "",

                    description:
                        createdProduct
                            ?.productDescription ||
                        createdProduct
                            ?.description ||
                        updatedRow
                            ?.description ||
                        "",

                    productHSNCode:
                        createdProduct
                            ?.productHSNCode ||
                        updatedRow
                            ?.productHSNCode ||
                        "",

                    unit:
                        createdProduct
                            ?.unit ||
                        updatedRow
                            ?.unit ||
                        "",

                    uom:
                        createdProduct
                            ?.unit ||
                        createdProduct
                            ?.uom ||
                        updatedRow
                            ?.uom ||
                        "",

                    unitName:
                        getUnitLabelFromSchema(
                            createdProduct
                                ?.unit ||
                            createdProduct
                                ?.uom ||
                            updatedRow
                                ?.unit ||
                            updatedRow
                                ?.uom ||
                            ""
                        ),

                    rate:
                        createdProduct
                            ?.sellingPrice ??
                        createdProduct
                            ?.rate ??
                        updatedRow
                            ?.rate ??
                        "",

                    marginProduct,

                    productType:
                        createdProduct?.productType ||
                        createdProduct?.dynamicFields?.productType ||
                        "",
                    availableQuantity: null,

                    nonTaxRate:
                        marginProduct
                            ? (
                                createdProduct
                                    ?.nonTaxRate ??
                                createdProduct
                                    ?.dynamicFields
                                    ?.nonTaxRate ??
                                updatedRow
                                    ?.nonTaxRate ??
                                ""
                            )
                            : "",

                    taxGross:
                        marginProduct
                            ? (
                                createdProduct
                                    ?.taxGross ??
                                createdProduct
                                    ?.dynamicFields
                                    ?.taxGross ??
                                updatedRow
                                    ?.taxGross ??
                                ""
                            )
                            : "",

                    nonTaxGross:
                        marginProduct
                            ? (
                                createdProduct
                                    ?.nonTaxGross ??
                                createdProduct
                                    ?.dynamicFields
                                    ?.nonTaxGross ??
                                updatedRow
                                    ?.nonTaxGross ??
                                ""
                            )
                            : "",
                };

                const selectedCustomer =
                    filterAccount?.find(
                        (account: any) =>
                            account?.accountCode ==
                            previous?.sOrderCustomerCode
                    );

                const cgstValue =
                    createdProduct?.csgst ??
                    createdProduct?.CGST ??
                    createdProduct?.cgst ??
                    createdProduct?.cgstRate ??
                    createdProduct?.cgstPercentage ??
                    createdProduct?.tax?.cgstPercentage ??
                    createdProduct?.tax?.cgst ??
                    "";

                const sgstValue =
                    createdProduct?.csgst ??
                    createdProduct?.SGST ??
                    createdProduct?.sgst ??
                    createdProduct?.sgstRate ??
                    createdProduct?.sgstPercentage ??
                    createdProduct?.tax?.sgstPercentage ??
                    createdProduct?.tax?.sgst ??
                    "";

                const igstValue =
                    createdProduct?.igst ??
                    createdProduct?.IGST ??
                    createdProduct?.igstRate ??
                    createdProduct?.igstPercentage ??
                    createdProduct?.tax?.igstPercentage ??
                    createdProduct?.tax?.igst ??
                    "";

                if (
                    company?.state?.isoCode ==
                    selectedCustomer?.state?.isoCode
                ) {
                    updatedRow.cgst = cgstValue;
                    updatedRow.cgstPercentage = cgstValue;
                    updatedRow.sgst = sgstValue;
                    updatedRow.sgstPercentage = sgstValue;
                    updatedRow.igst = "";
                    updatedRow.igstPercentage = "";
                    updatedRow.igstAmount = 0;
                } else {
                    updatedRow.igst = igstValue;
                    updatedRow.igstPercentage = igstValue;
                    updatedRow.cgst = "";
                    updatedRow.cgstPercentage = "";
                    updatedRow.sgst = "";
                    updatedRow.sgstPercentage = "";
                    updatedRow.cgstAmount = 0;
                    updatedRow.sgstAmount = 0;
                }

                updatedRow =
                    calculateRow(
                        normalizeRowKeys(
                            updatedRow
                        )
                    );

                updatedProducts[
                    rowIndex
                ] = updatedRow;

                return {
                    ...previous,
                    products:
                        updatedProducts,
                };
            });

            const createdProductCode =
                createdProduct?.productCode ||
                savedCode ||
                "";

            const createdProductType =
                createdProduct?.productType ||
                createdProduct?.dynamicFields?.productType ||
                "";

            if (createdProductCode) {
                void loadAvailableQuantity(
                    availableQuantityRowIndex,
                    String(createdProductCode),
                    String(createdProductType),
                    form.sOrderVoucherDate || todayYMD()
                );
            }

            setErrors((previous: any) => ({
                ...previous,
                products: "",
            }));
        } catch (error: any) {
            console.log(
                "Failed to refresh Sales Order product options:",
                error
            );

            toast.error(
                error?.message ||
                "Product created, but Sales Order product dropdown refresh failed"
            );
        } finally {
            setCheckProduct(false);
            setProductTargetRowIndex(null);
            setProductSearchValue("");
        }
    };

    const handleAddRow = () => {
        setForm((previous: any) => ({
            ...previous,

            products: [
                ...(
                    previous.products ||
                    []
                ),

                {
                    ...emptyProductRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (
        index: number
    ) => {
        setForm((previous: any) => {
            const updatedProducts = (
                previous.products || []
            ).filter(
                (
                    _: any,
                    rowIndex: number
                ) =>
                    rowIndex !== index
            );

            return {
                ...previous,

                products:
                    updatedProducts.length >
                        0
                        ? updatedProducts
                        : [
                            {
                                ...emptyProductRow,
                                id: Date.now(),
                            },
                        ],
            };
        });
    };

    const enableDuplicatePro = useMemo(() => {
        const duplicateConfig = configurations?.[0]?.systemConfiguration?.allowDuplicateProduct;
        return (duplicateConfig === true || duplicateConfig === "true");
    }, [configurations]);

    const handleRowChange = (index: number, key: string, value: any) => {
        console.log({ form })
        if (!form?.sOrderCustomerCode) {
            return toast.error(
                "Please select customer first"
            );
        }
        const duplicate = Boolean(
            form?.products?.some(
                (
                    product: any,
                    productIndex: number
                ) => {
                    if (
                        productIndex ===
                        index
                    ) {
                        return false;
                    }

                    return (
                        String(
                            product?.productCode ||
                            ""
                        ) ===
                        String(
                            value || ""
                        ) ||
                        String(
                            product?.productId ||
                            ""
                        ) ===
                        String(
                            value || ""
                        )
                    );
                }
            )
        );

        if (key === "productCode" && duplicate && !enableDuplicatePro) {
            setErrors((previous: any) => ({
                ...previous, products: "", [`row_${index}_${key}`]: "This product already added",
                [`row_${index}_tax`]: "",
            })
            );
            return;
        }

        setForm((previous: any) => {
            const updatedProducts = [...(previous.products || []),];
            const currentRow = updatedProducts[index] || {};
            const currentField = getBodyFieldByKey(key);
            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(currentField, value, updatedRow);
            }
            const selectedOption = getOptionByValue(currentField, value);
            const raw = selectedOption?.raw || {};

            if (raw?._id && !updatedRow.productId) {
                updatedRow.productId = raw._id;
            }

            if (key === "productCode" || key === "productName" || key === "productId") {
                const getCustomer = filterAccount?.find((e: any) => e.accountCode == previous?.sOrderCustomerCode);
                updatedRow.productType = raw?.productType || raw?.dynamicFields?.productType || ""; updatedRow.availableQuantity = null;
                updatedRow.productDescription = raw?.productDescription || "";
                const marginProduct = isTrueValue(raw?.dynamicFields?.marginProduct);

                updatedRow.marginProduct = marginProduct;
                if (!marginProduct) {
                    updatedRow.nonTaxRate = "";
                    updatedRow.taxGross = "";
                    updatedRow.nonTaxGross = "";
                }

                const cgstValue =
                    raw?.csgst ??
                    raw?.CGST ??
                    raw?.cgst ??
                    raw?.cgstRate ??
                    raw?.cgstPercentage ??
                    raw?.tax?.cgstPercentage ??
                    raw?.tax?.cgst ??
                    "";

                const sgstValue =
                    raw?.csgst ??
                    raw?.SGST ??
                    raw?.sgst ??
                    raw?.sgstRate ??
                    raw?.sgstPercentage ??
                    raw?.tax?.sgstPercentage ??
                    raw?.tax?.sgst ??
                    "";

                const igstValue =
                    raw?.igst ??
                    raw?.IGST ??
                    raw?.igstRate ??
                    raw?.igstPercentage ??
                    raw?.tax?.igstPercentage ??
                    raw?.tax?.igst ??
                    "";

                if (company?.state?.isoCode == getCustomer?.state?.isoCode) {
                    updatedRow.cgst = cgstValue;
                    updatedRow.cgstPercentage = cgstValue;
                    updatedRow.sgst = sgstValue;
                    updatedRow.sgstPercentage = sgstValue;
                    updatedRow.igst = "";
                    updatedRow.igstPercentage = "";
                    updatedRow.igstAmount = 0;
                } else {
                    updatedRow.igst = igstValue;
                    updatedRow.igstPercentage = igstValue;
                    updatedRow.cgst = "";
                    updatedRow.cgstPercentage = "";
                    updatedRow.sgst = "";
                    updatedRow.sgstPercentage = "";
                    updatedRow.cgstAmount = 0;
                    updatedRow.sgstAmount = 0;
                }
            }

            updatedRow = normalizeRowKeys(updatedRow);

            const lowerKey = String(key || "").toLowerCase();
            const isCgst = lowerKey === "cgst" || lowerKey === "cgstpercentage";
            const isSgst = lowerKey === "sgst" || lowerKey === "sgstpercentage";
            const isIgst = lowerKey === "igst" || lowerKey === "igstpercentage";

            if (isCgst) {
                updatedRow.cgst = value;
                updatedRow.cgstPercentage = value;
            }

            if (isSgst) {
                updatedRow.sgst = value;
                updatedRow.sgstPercentage = value;
            }

            if (isIgst) {
                updatedRow.igst = value;
                updatedRow.igstPercentage = value;
            }

            if (
                (
                    isCgst ||
                    isSgst
                ) &&
                num(value) > 0
            ) {
                updatedRow.igst = "";
                updatedRow.igstPercentage = "";
                updatedRow.igstAmount = 0;
            }

            if (
                isIgst &&
                num(value) > 0
            ) {
                updatedRow.cgst = "";
                updatedRow.cgstPercentage = "";
                updatedRow.sgst = "";
                updatedRow.sgstPercentage = "";
                updatedRow.cgstAmount = 0;
                updatedRow.sgstAmount = 0;
            }

            updatedRow =
                calculateRow(updatedRow);

            updatedProducts[index] =
                updatedRow;

            return {
                ...previous,
                products:
                    updatedProducts,
            };
        });

        if (PRODUCT_FIELD_KEYS.has(key)) {
            const currentField = getBodyFieldByKey(key);
            const selectedOption = getOptionByValue(currentField, value);
            const raw = selectedOption?.raw || {};
            const productCode =
                raw?.productCode ||
                selectedOption?.value ||
                value ||
                "";
            const productType =
                raw?.productType ||
                raw?.dynamicFields?.productType ||
                "";

            if (productCode) {
                void loadAvailableQuantity(
                    index,
                    String(productCode),
                    String(productType),
                    form.sOrderVoucherDate || todayYMD()
                );
            }
        }

        setErrors((previous: any) => ({
            ...previous,
            products: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_tax`]: "",
        }));
    };

    const getFilledRows = () => {
        return (
            form.products || []
        ).filter((row: any) => {
            const visibleFields = (
                templateFields?.body || []
            ).filter((field: any) =>
                isBodyFieldVisibleForRow(
                    field,
                    row
                )
            );

            return visibleFields.some(
                (field: any) => {
                    const value =
                        row?.[field.key];

                    return (
                        value !==
                        undefined &&
                        value !== null &&
                        value !== ""
                    );
                }
            );
        });
    };

    const validateForm = () => {
        const validationErrors: any =
            {};

        (
            templateFields?.header ||
            []
        ).forEach((field: any) => {
            if (
                isTrueValue(
                    field?.isHidden
                )
            ) {
                return;
            }

            if (
                !isTrueValue(
                    field?.isRequired
                )
            ) {
                return;
            }

            const value =
                form?.[field.key];

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                validationErrors[
                    field.key
                ] = `${field.label ||
                field.title ||
                field.key
                } is required`;
            }
        });

        const filledRows =
            getFilledRows();

        if (
            filledRows.length === 0
        ) {
            validationErrors.products =
                "Please add at least one product";
        }

        (
            form.products || []
        ).forEach(
            (
                row: any,
                index: number
            ) => {
                const visibleFields = (
                    templateFields?.body ||
                    []
                ).filter((field: any) =>
                    isBodyFieldVisibleForRow(
                        field,
                        row
                    )
                );

                const hasAnyValue =
                    visibleFields.some(
                        (field: any) => {
                            const value =
                                row?.[
                                field.key
                                ];

                            return (
                                value !==
                                undefined &&
                                value !==
                                null &&
                                value !==
                                ""
                            );
                        }
                    );

                if (!hasAnyValue) {
                    return;
                }

                visibleFields.forEach(
                    (field: any) => {
                        if (
                            !isTrueValue(
                                field
                                    ?.isRequired
                            )
                        ) {
                            return;
                        }

                        const value =
                            row?.[
                            field.key
                            ];

                        if (
                            value ===
                            undefined ||
                            value === null ||
                            value === ""
                        ) {
                            validationErrors[
                                `row_${index}_${field.key}`
                            ] = `${field.label ||
                            field.title ||
                            field.key
                            } is required`;
                        }
                    }
                );

                const cgst = num(
                    row.cgstPercentage ||
                    row.cgst
                );

                const sgst = num(
                    row.sgstPercentage ||
                    row.sgst
                );

                const igst = num(
                    row.igstPercentage ||
                    row.igst
                );

                if (
                    igst > 0 &&
                    (
                        cgst > 0 ||
                        sgst > 0
                    )
                ) {
                    validationErrors[
                        `row_${index}_tax`
                    ] =
                        "You can enter either IGST or CGST/SGST";

                    validationErrors[
                        `row_${index}_igstPercentage`
                    ] =
                        "Only one tax type allowed";

                    validationErrors[
                        `row_${index}_cgstPercentage`
                    ] =
                        "Only one tax type allowed";

                    validationErrors[
                        `row_${index}_sgstPercentage`
                    ] =
                        "Only one tax type allowed";

                    validationErrors[
                        `row_${index}_igst`
                    ] =
                        "Only one tax type allowed";

                    validationErrors[
                        `row_${index}_cgst`
                    ] =
                        "Only one tax type allowed";

                    validationErrors[
                        `row_${index}_sgst`
                    ] =
                        "Only one tax type allowed";
                }
            }
        );

        setErrors(
            validationErrors
        );

        if (
            validationErrors.products
        ) {
            toast.error(
                validationErrors.products
            );
        }

        return (
            Object.keys(
                validationErrors
            ).length === 0
        );
    };

    const cleanRows = () => {
        const bodyKeys = (
            templateFields?.body || []
        ).map(
            (field: any) =>
                field.key
        );

        return (
            form.products || []
        )
            .filter((row: any) =>
                bodyKeys.some(
                    (key: string) => {
                        const value =
                            row?.[key];

                        return (
                            value !==
                            undefined &&
                            value !==
                            null &&
                            value !== ""
                        );
                    }
                )
            )
            .map((row: any) =>
                calculateRow(
                    normalizeRowKeys(
                        row
                    )
                )
            );
    };

    const fetchSalesQuotations =
        async () => {
            await clearSelectedSalesQuotation();

            await dispatch(
                getSalesQuotationList({
                    offset: 0,
                    limit: 100,
                    search:
                        purchaseOrderSearch,
                    status: "won",
                }) as any
            );
        };

    const syncQuotationStatusAfterSalesOrdr =
        async (voucherNumber: string) => {
            if (!voucherNumber) {
                return "";
            }

            try {
                await dispatch(
                    updateSalesQuotation({
                        payload: {
                            sQuoteDocStatus:
                                "close",

                            sQuoteStatus:
                                "close",
                        },

                        sQuoteVoucherNumber:
                            voucherNumber,
                    }) as any
                );

                await fetchSalesQuotations();
            } catch (error) {
                toast.error(
                    "Sales Order saved but failed to update Sales Quotation status"
                );

                return "";
            }
        };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        const products =
            cleanRows();

        const footer =
            calculateFooter(products);

        const payload: any = {
            sOrderVoucherDate:
                form.sOrderVoucherDate,

            sOrderQuotationVoucherNumber:
                form
                    ?.sOrderQuotationVoucherNumber,

            sOrderCustomerCode:
                form.sOrderCustomerCode,

            sOrderCustomerName:
                form.sOrderCustomerName,

            sOrderSalesAccount:
                form.sOrderSalesAccount ||
                "SA021",

            sOrderStatus: "open",
            sOrderDocStatus: "open",

            sOrderRemark:
                form.sOrderRemark ||
                form.sOrderRemarks ||
                "",

            sOrderRemarks:
                form.sOrderRemarks ||
                form.sOrderRemark ||
                "",

            isAutoPost:
                form.isAutoPost ||
                false,

            sOrderBody: products.map(
                (item: any) => {
                    const marginProduct =
                        isMarginProductRow(
                            item
                        );

                    return {
                        productCode:
                            item.productCode,

                        productName:
                            item.productName,

                        // productId: item.productId,

                        productDescription:
                            item.productDescription ||
                            item.description,

                        description:
                            item.description ||
                            item.productDescription,

                        productHSNCode:
                            item.productHSNCode,

                        remarks:
                            item.remarks,

                        quantity:
                            String(
                                item.quantity
                            ),

                        unit:
                            item.unit ||
                            item.uom,

                        uom:
                            item.uom ||
                            item.unit,

                        unitName:
                            item.unitName,

                        rate:
                            String(
                                item.rate
                            ),

                        gross:
                            fmtMoney(
                                item.grossAmount
                            ),

                        grossAmount:
                            fmtMoney(
                                item.grossAmount
                            ),

                        discount:
                            String(
                                item.discountPercentage ||
                                item.discount ||
                                ""
                            ),

                        discountPercentage:
                            String(
                                item.discountPercentage ||
                                item.discount ||
                                ""
                            ),

                        discountAmount:
                            fmtMoney(
                                item.discountAmount
                            ),

                        taxableAmount:
                            fmtMoney(
                                item.taxableAmount
                            ),

                        cgst:
                            String(
                                item.cgstPercentage ||
                                item.cgst ||
                                ""
                            ),

                        cgstPercentage:
                            String(
                                item.cgstPercentage ||
                                item.cgst ||
                                ""
                            ),

                        cgstAmount:
                            fmtMoney(
                                item.cgstAmount
                            ),

                        sgst:
                            String(
                                item.sgstPercentage ||
                                item.sgst ||
                                ""
                            ),

                        sgstPercentage:
                            String(
                                item.sgstPercentage ||
                                item.sgst ||
                                ""
                            ),

                        sgstAmount:
                            fmtMoney(
                                item.sgstAmount
                            ),

                        igst:
                            String(
                                item.igstPercentage ||
                                item.igst ||
                                ""
                            ),

                        igstPercentage:
                            String(
                                item.igstPercentage ||
                                item.igst ||
                                ""
                            ),

                        igstAmount:
                            fmtMoney(
                                item.igstAmount
                            ),

                        taxAmount:
                            fmtMoney(
                                item.taxAmount
                            ),

                        otherAmount:
                            fmtMoney(
                                item.otherAmount
                            ),

                        netAmount:
                            fmtMoney(
                                item.netAmount ||
                                item.netTotal
                            ),

                        netTotal:
                            fmtMoney(
                                item.netTotal ||
                                item.netAmount
                            ),

                        marginProduct,

                        nonTaxRate:
                            marginProduct
                                ? String(
                                    item.nonTaxRate ??
                                    ""
                                )
                                : "",

                        taxGross:
                            marginProduct
                                ? fmtMoney(
                                    item.taxGross
                                )
                                : "",

                        nonTaxGross:
                            marginProduct
                                ? fmtMoney(
                                    item.nonTaxGross
                                )
                                : "",

                        dynamicBodyFields: {
                            ...Object.fromEntries(
                                Object.entries(
                                    item?.dynamicBodyFields ||
                                    {}
                                ).filter(
                                    ([fieldKey]) =>
                                        !CONDITIONAL_MARGIN_FIELD_KEYS.has(
                                            fieldKey
                                        )
                                )
                            ),

                            ...(
                                marginProduct
                                    ? {
                                        nonTaxRate:
                                            String(
                                                item.nonTaxRate ??
                                                ""
                                            ),

                                        taxGross:
                                            fmtMoney(
                                                item.taxGross
                                            ),

                                        nonTaxGross:
                                            fmtMoney(
                                                item.nonTaxGross
                                            ),
                                    }
                                    : {}
                            ),
                        },
                    };
                }
            ),

            sOrderFooter: {
                grossAmount:
                    fmtMoney(
                        footer
                            .totalGrossAmount
                    ),

                discountAmount:
                    fmtMoney(
                        footer
                            .totalDiscountAmount
                    ),

                cgstAmount:
                    fmtMoney(
                        footer
                            .totalCgstAmount
                    ),

                sgstAmount:
                    fmtMoney(
                        footer
                            .totalSgstAmount
                    ),

                igstAmount:
                    fmtMoney(
                        footer
                            .totalIgstAmount
                    ),

                taxAmount:
                    fmtMoney(
                        footer
                            .totalTaxAmount
                    ),

                otherAmount:
                    fmtMoney(
                        footer
                            .totalOtherAmount
                    ),

                netAmount:
                    fmtMoney(
                        footer
                            .totalNetAmount
                    ),

                adjustedAmount: "0",

                balanceAmount:
                    fmtMoney(
                        footer
                            .totalNetAmount
                    ),

                totalQuantity:
                    footer.totalQuantity,

                totalGrossAmount:
                    fmtMoney(
                        footer
                            .totalGrossAmount
                    ),

                totalDiscountAmount:
                    fmtMoney(
                        footer
                            .totalDiscountAmount
                    ),

                totalCgstAmount:
                    fmtMoney(
                        footer
                            .totalCgstAmount
                    ),

                totalSgstAmount:
                    fmtMoney(
                        footer
                            .totalSgstAmount
                    ),

                totalIgstAmount:
                    fmtMoney(
                        footer
                            .totalIgstAmount
                    ),

                totalTaxAmount:
                    fmtMoney(
                        footer
                            .totalTaxAmount
                    ),

                totalOtherAmount:
                    fmtMoney(
                        footer
                            .totalOtherAmount
                    ),

                totalNetAmount:
                    fmtMoney(
                        footer
                            .totalNetAmount
                    ),
            },
        };

        try {
            if (editingRecord) {
                await dispatch(
                    updateSalesOrder({
                        voucherNumber:
                            form
                                ?.sOrderVoucherNumber,

                        data: payload,
                    }) as any
                ).unwrap();

                toast.success(
                    "Sales order updated successfully"
                );
            } else {
                await dispatch(
                    createSalesOrder(
                        payload
                    ) as any
                ).unwrap();

                if (
                    form
                        ?.sOrderQuotationVoucherNumber
                ) {
                    syncQuotationStatusAfterSalesOrdr(
                        form
                            ?.sOrderQuotationVoucherNumber
                    );
                }

                toast.success(
                    "Sales order created successfully"
                );
            }

            setShowModal(false);
            setCheckAccount(false);
            resetMainForm();

            fetchSalesOrders();

            await fetchSalesQuotations();

            handlePurchaseOrderModalClose(
                false
            );
        } catch (error: any) {
            toast.error(
                error?.message ||
                "Operation failed"
            );
        }
    };

    const handleDeleteConfirm =
        async () => {
            try {
                if (
                    !confirmTooltip
                        .voucherNumber
                ) {
                    return;
                }

                const salesOrderVoucherNumber =
                    confirmTooltip
                        .voucherNumber;

                const salesQuotationVoucherNumber =
                    (
                        confirmTooltip as any
                    )
                        ?.quotationVoucherNumber;

                await dispatch(
                    deleteSalesOrder(
                        salesOrderVoucherNumber
                    ) as any
                ).unwrap();

                if (
                    salesQuotationVoucherNumber
                ) {
                    await dispatch(
                        updateSalesQuotation({
                            sQuoteVoucherNumber:
                                salesQuotationVoucherNumber,

                            payload: {
                                sQuoteDocStatus:
                                    "open",

                                sQuoteStatus:
                                    "won",
                            },
                        }) as any
                    ).unwrap();
                }

                toast.success(
                    "Sales order deleted successfully"
                );

                fetchSalesOrders();
                fetchSalesQuotations();
            } catch (error: any) {
                toast.error(
                    error?.message ||
                    "Failed to delete sales order"
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

    const handlePurchaseOrderConfirm =
        () => {
            if (
                !selectedPurchaseOrder
            ) {
                toast.error(
                    "Please select purchase order"
                );

                return;
            }

            const quotationBody =
                selectedPurchaseOrder
                    ?.sQuoteBody ||
                [];

            const products =
                quotationBody.length >
                    0
                    ? quotationBody.map(
                        (item: any) => {
                            const row =
                                normalizeRowKeys({
                                    ...(
                                        item?.dynamicBodyFields ||
                                        {}
                                    ),

                                    ...item,

                                    id:
                                        Date.now() +
                                        Math.random(),

                                    productCode:
                                        item?.productCode ||
                                        "",

                                    productName:
                                        item?.productName ||
                                        "",

                                    productId:
                                        item?.productId ||
                                        "",

                                    productDescription:
                                        item?.productDescription ||
                                        item?.description ||
                                        "",

                                    description:
                                        item?.description ||
                                        item?.productDescription ||
                                        "",

                                    productHSNCode:
                                        item?.productHSNCode ||
                                        "",

                                    remarks:
                                        item?.remarks ||
                                        "",

                                    quantity:
                                        String(
                                            item?.quantity ??
                                            ""
                                        ),

                                    unit:
                                        item?.unit ||
                                        item?.uom,

                                    uom:
                                        item?.uom ||
                                        item?.unit,

                                    rate:
                                        String(
                                            item?.rate ??
                                            ""
                                        ),

                                    gross:
                                        item?.grossAmount ||
                                        item?.gross ||
                                        0,

                                    grossAmount:
                                        item?.grossAmount ||
                                        item?.gross ||
                                        0,

                                    discount:
                                        item?.discountPercentage ||
                                        item?.discount ||
                                        "",

                                    discountPercentage:
                                        item?.discountPercentage ||
                                        item?.discount ||
                                        "",

                                    discountAmount:
                                        item?.discountAmount ||
                                        0,

                                    taxableAmount:
                                        item?.taxableAmount ||
                                        0,

                                    cgst:
                                        item?.cgstPercentage ||
                                        item?.cgst ||
                                        "",

                                    cgstPercentage:
                                        item?.cgstPercentage ||
                                        item?.cgst ||
                                        "",

                                    cgstAmount:
                                        item?.cgstAmount ||
                                        0,

                                    sgst:
                                        item?.sgstPercentage ||
                                        item?.sgst ||
                                        "",

                                    sgstPercentage:
                                        item?.sgstPercentage ||
                                        item?.sgst ||
                                        "",

                                    sgstAmount:
                                        item?.sgstAmount ||
                                        0,

                                    igst:
                                        item?.igstPercentage ||
                                        item?.igst ||
                                        "",

                                    igstPercentage:
                                        item?.igstPercentage ||
                                        item?.igst ||
                                        "",

                                    igstAmount:
                                        item?.igstAmount ||
                                        0,

                                    taxAmount:
                                        item?.taxAmount ||
                                        0,

                                    otherAmount:
                                        item?.otherAmount ||
                                        0,

                                    netAmount:
                                        item?.netAmount ||
                                        item?.netTotal ||
                                        0,

                                    netTotal:
                                        item?.netTotal ||
                                        item?.netAmount ||
                                        0,

                                    marginProduct:
                                        isTrueValue(
                                            item
                                                ?.marginProduct
                                        ),

                                    nonTaxRate:
                                        item?.nonTaxRate ??
                                        item
                                            ?.dynamicBodyFields
                                            ?.nonTaxRate ??
                                        "",

                                    taxGross:
                                        item?.taxGross ??
                                        item
                                            ?.dynamicBodyFields
                                            ?.taxGross ??
                                        "",

                                    nonTaxGross:
                                        item?.nonTaxGross ??
                                        item
                                            ?.dynamicBodyFields
                                            ?.nonTaxGross ??
                                        "",
                                });

                            return calculateRow(
                                row
                            );
                        }
                    )
                    : [
                        {
                            ...emptyProductRow,
                            id: Date.now(),
                        },
                    ];

            setForm({
                ...getDefaultForm(),

                sOrderQuotationVoucherNumber:
                    selectedPurchaseOrder
                        ?.sQuoteVoucherNumber,

                sOrderVoucherDate:
                    selectedPurchaseOrder
                        .sQuoteVoucherDate,

                sOrderCustomerCode:
                    selectedPurchaseOrder
                        .sQuoteCustomerCode,

                sOrderCustomerName:
                    selectedPurchaseOrder
                        .sQuoteCustomerName,

                sOrderSalesAccount:
                    selectedPurchaseOrder
                        .sQuoteSalesAccount ||
                    "SA021",

                sOrderStatus:
                    selectedPurchaseOrder
                        .sQuoteStatus ||
                    selectedPurchaseOrder
                        .sOrderDocStatus ||
                    "open",

                sOrderDocStatus:
                    selectedPurchaseOrder
                        .sQuoteDocStatus ||
                    selectedPurchaseOrder
                        .sOrderStatus ||
                    "open",

                sOrderRemark:
                    selectedPurchaseOrder
                        .sQuoteRemark ||
                    selectedPurchaseOrder
                        .sOrderRemarks ||
                    "",

                sOrderRemarks:
                    selectedPurchaseOrder
                        .sQuoteRemarks ||
                    selectedPurchaseOrder
                        .sOrderRemark ||
                    "",

                isAutoPost:
                    selectedPurchaseOrder
                        .isAutoPost ||
                    false,

                products,
            });

            setErrors({});
            setEditingRecord(null);

            setShowPurchaseOrderModal(
                false
            );

            setSelectedPurchaseOrder(
                null
            );

            setShowModal(true);
        };

    const handlePurchaseOrderSelect = (
        purchaseOrder: any
    ) =>
        setSelectedPurchaseOrder(
            purchaseOrder
        );

    const handlePurchaseOrderModalClose = (
        isModalFalse = true
    ) => {
        setShowPurchaseOrderModal(false);
        setSelectedPurchaseOrder(null);
        setPurchaseOrderSearch("");
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
        setCheckAccount(false);
        setCheckProduct(false);
        setProductTargetRowIndex(null);
        setProductSearchValue("");
        setShowModal(isModalFalse);
    };

    useEffect(() => {
        fetchSalesQuotations();
    }, [purchaseOrderSearch]);

    const footerValues = useMemo(
        () => ({
            grossAmount,
            discountAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            netAmount,
            adjustedAmount: 0,
            balanceAmount:
                netAmount,
        }),
        [
            grossAmount,
            discountAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            netAmount,
        ]
    );

    const dynamicFooterArray =
        useMemo(() => {
            return (
                templateFields?.footer ||
                []
            )
                .filter(
                    (field: any) =>
                        !field.isHidden
                )
                .map(
                    (field: any) => {
                        const rawValue =
                            footerValues[
                            field.key as keyof typeof footerValues
                            ] ?? 0;

                        return {
                            ...field,
                            value:
                                money(
                                    rawValue
                                ),
                            rawValue,
                        };
                    }
                );
        }, [
            templateFields?.footer,
            footerValues,
        ]);

    useEffect(() => {
        dispatch(
            getAllReportMapping({
                moduleType:
                    "salesOrder",
            }) as any
        );

        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );

        if (!Object.keys(company ?? {})?.length) {
            dispatch(getCompany({ withParent: true, limit: 100, }) as any
            );
        }
    }, [dispatch]);

    // ★ ADDED: Initial Account Master loading
    useEffect(() => {
        const loadAccounts = async () => {
            try {
                await dispatch(
                    getAllAccounts({
                        offset: 0,
                        limit: 100,
                        search: "",
                    }) as any
                ).unwrap();
            } catch (error) {
                console.log(
                    "Failed to load Account Master records",
                    error
                );
            } finally {
                setAccountListLoaded(
                    true
                );
            }
        };

        loadAccounts();
    }, [dispatch]);

    // ★ ADDED: Open Account Master when Sales Order opens
    // and no customer account exists.
    useEffect(() => {
        if (!showModal) return;
        if (editingRecord) return;
        if (!accountListLoaded) return;

        if (
            filterAccount.length === 0
        ) {
            setCheckAccount(true);
        }
    }, [
        showModal,
        editingRecord,
        accountListLoaded,
        filterAccount.length,
    ]);

    const isClosedSalesOrder = (
        record: any
    ) => {
        const orderStatus =
            String(
                record?.sOrderDocStatus ||
                record?.sOrderStatus ||
                ""
            ).toLowerCase();

        return (
            orderStatus === "close" ||
            orderStatus === "closed"
        );
    };

    const handleEditSalesOrder = (
        record: any
    ) => {
        if (
            isClosedSalesOrder(
                record
            )
        ) {
            toast.error(
                "You can't edit closed order"
            );

            return;
        }

        openEditModal(record);
    };

    const handleDeleteSalesOrderClick =
        (
            event: any,
            record: any
        ) => {
            if (
                isClosedSalesOrder(
                    record
                )
            ) {
                toast.error(
                    "You can't delete closed order"
                );

                return;
            }

            const rect =
                event.currentTarget
                    .getBoundingClientRect();

            let x =
                rect.left - 150;

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

                voucherNumber:
                    record
                        ?.sOrderVoucherNumber,

                quotationVoucherNumber:
                    record
                        ?.sOrderQuotationVoucherNumber,
            } as any);
        };

    const isSalesOrderBodyCellDisabled = (
        column: any
    ) => {
        if (
            column?.key ===
            "taxRate" ||
            column?.key ===
            "nonTaxRate"
        ) {
            return false;
        }

        if (
            column?.key ===
            "taxGross" ||
            column?.key ===
            "nonTaxGross"
        ) {
            return true;
        }

        return (
            isTrueValue(
                column?.disabled
            ) ||
            isTrueValue(
                column?.isReadonly
            )
        );
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div
                id="sales-order-header"
                className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <div
                    id="sales-order-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count:
                                pagination
                                    ?.totalDocs ??
                                0,

                            text:
                                "Total Sales Orders:",

                            varient:
                                "primary",
                        }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Toggle
                        {...{
                            arr: [
                                "open",
                                "close",
                            ],

                            state:
                                status,

                            setState:
                                handleStatusChange,
                        }}
                    />

                    <SearchInput
                        {...{
                            search,
                            setSearch,
                        }}
                    />

                    <DataREfreshButton
                        {...{
                            callBackFn:
                                handleRefresh,

                            loading:
                                refreshing,
                        }}
                    />

                    <Permission
                        module="bookez"
                        permissionKey="salesOrder"
                        action="create"
                    >
                        <DataCreateButton
                            {...{
                                callBackFn:
                                    openAddModal,

                                text:
                                    "Add Sales Order",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesOrders}
                loading={loading}
                emptyMessage={`No ${status} sales order found`}
                actions={(
                    record: any
                ) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-order-download-button"
                            type="button"
                            onClick={() => {
                                setDownlaodPDF(
                                    (
                                        previous: any
                                    ) => ({
                                        ...previous,

                                        show:
                                            true,

                                        moduleType:
                                            "salesOrder",

                                        record,

                                        CustomerCode:
                                            record
                                                ?.sOrderCustomerCode,

                                        voucherNumber:
                                            record
                                                ?.sOrderVoucherNumber,
                                    })
                                );
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download
                                size={16}
                            />
                        </button>

                        <Permission
                            module="bookez"
                            permissionKey="salesOrder"
                            action="update"
                        >
                            <button
                                id="sales-order-edit-button"
                                type="button"
                                onClick={() =>
                                    handleEditSalesOrder(
                                        record
                                    )
                                }
                                className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                            >
                                <Edit
                                    size={16}
                                />
                            </button>
                        </Permission>

                        <Permission
                            module="bookez"
                            permissionKey="salesOrder"
                            action="delete"
                        >
                            <button
                                id="sales-order-delete-button"
                                type="button"
                                disabled={
                                    deleteLoading
                                }
                                onClick={(
                                    event
                                ) =>
                                    handleDeleteSalesOrderClick(
                                        event,
                                        record
                                    )
                                }
                                className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                            >
                                <Trash2
                                    size={16}
                                />
                            </button>
                        </Permission>
                    </div>
                )}
            />

            {pagination?.totalDocs >
                0 && (
                    <Pagination
                        {...{
                            localLimit,

                            selectCb: (
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
                            },

                            preDisabled:
                                !pagination
                                    ?.hasPrevPage,

                            nextDisabled:
                                !pagination
                                    ?.hasNextPage,

                            setLocalOffset,

                            pagination,
                        }}
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
                    message="Are you sure you want to delete this sales order?"
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
                    {...{
                        show:
                            showModal,

                        setShow:
                            setShowModal,

                        edit:
                            Boolean(
                                editingRecord
                            ),

                        title:
                            "Sales Orders",

                        subtitle:
                            "Fill in the sales order details below",

                        loading:
                            createLoading ||
                            updateLoading,

                        onClose: () => {
                            setShowModal(
                                false
                            );

                            setCheckAccount(
                                false
                            );

                            setCheckProduct(
                                false
                            );

                            setProductTargetRowIndex(
                                null
                            );

                            setProductSearchValue(
                                ""
                            );

                            resetMainForm();
                        },

                        onSubmit:
                            handleSubmit,

                        form,
                        errors,

                        handleAddRow,
                        handleDeleteRow,
                        handleRowChange,

                        footerTotals,

                        inputData: {
                            ...templateFieldsWithCreateActions,

                            footer:
                                dynamicFooterArray,
                        },

                        bodyKey:
                            "products",

                        handleChange:
                            handleMainChange,

                        isBodyColumnVisible,
                        isBodyCellVisible,

                        isBodyCellDisabled:
                            isSalesOrderBodyCellDisabled,

                        bodyCellExtraRenderer: (column: any, row: any) =>
                            renderSalesOrderCellExtra(
                                column,
                                row,
                                enableServiceProductInventory
                            ),

                        // ★ ADDED: Common Account Master modal props
                        checkAccount,
                        setCheckAccount,

                        onAccountSaved:
                            handleAccountSaved,
                    }}
                />
            )}

            <ProductMasterModal
                show={checkProduct}
                setShow={(value: boolean) => {
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
                onSaved={handleProductSaved}
                title="Add New Product"
                initialProductName={
                    productSearchValue
                }
            />

            <Modal
                show={
                    showPurchaseOrderModal
                }
                setShow={
                    setShowPurchaseOrderModal
                }
                title="Select Sales Quotations"
                state={false}
                handleSubmit={
                    handlePurchaseOrderConfirm
                }
                handleClose={
                    handlePurchaseOrderModalClose
                }
                gridCols={1}
                maxWidth="2xl"
                modalClassName="rounded-xl"
                headerClassName="bg-card"
                footerClassName="bg-card"
                bodyClassName="!block !p-0 bg-card text-card-foreground"
                body={
                    <div className="flex h-[520px] flex-col bg-card text-card-foreground">
                        <div className="border-b border-border p-5">
                            <input
                                value={
                                    purchaseOrderSearch
                                }
                                onChange={(
                                    event
                                ) =>
                                    setPurchaseOrderSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search Sales Quotations..."
                                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {salesQuatationLoader ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Loading Sales Quotations...
                                </div>
                            ) : !salesQuotations
                                ?.length ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    No Sales Quotations found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {salesQuotations?.map(
                                        (
                                            quotation: any,
                                            index: number
                                        ) => {
                                            const quotationNumber =
                                                quotation
                                                    ?.sQuoteVoucherNumber ||
                                                "-";

                                            const isSelected =
                                                selectedPurchaseOrder
                                                    ?.sQuoteVoucherNumber ==
                                                quotation
                                                    ?.sQuoteVoucherNumber;

                                            return (
                                                <button
                                                    key={
                                                        quotationNumber ||
                                                        index
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        handlePurchaseOrderSelect(
                                                            quotation
                                                        )
                                                    }
                                                    className={`w-full rounded-xl border px-4 py-4 text-left transition ${isSelected
                                                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/10"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-base font-bold text-card-foreground">
                                                                {quotation
                                                                    ?.sQuoteVoucherNumber ||
                                                                    "NA"}{" "}
                                                                -{" "}
                                                                {quotation
                                                                    ?.sQuoteCustomerName ||
                                                                    "NA"}
                                                            </p>

                                                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                                Items:{" "}
                                                                {quotation
                                                                    ?.sQuoteBody
                                                                    ?.length ||
                                                                    0}
                                                            </p>
                                                        </div>

                                                        {isSelected && (
                                                            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                }
            />

            <ListingModel
                {...{
                    show:
                        downlaodPDF?.show,

                    downlaodPDF,

                    entryType:
                        "sales-order",

                    setShow: () =>
                        setDownlaodPDF(
                            // @ts-ignore
                            () => ({
                                show:
                                    !downlaodPDF
                                        ?.show,
                            })
                        ),

                    rowData: downlaodPDF?.record,

                    report,

                    title:
                        "Download Sales Order PDF",
                }}
            />
        </div>
    );
};

export default SalesOrder;