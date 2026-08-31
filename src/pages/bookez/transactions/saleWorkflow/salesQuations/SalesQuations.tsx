import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../../components/buttons";
import DataTable from "../../../../../components/DataTable";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip, { ListTooltip } from "../../../../../components/common/ConfirmTooltip";
import Toggle from "../../../../../components/toggle";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import { addSalesQuotation, deleteSalesQuotation, getSalesQuotationList, updateSalesQuotation } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesQuationsSlice";
import { fmtMoney, formatDateForInput, formatDateForList, getFinancialYearRange, isTrueValue, loadAllTemplateOptions, money, num, safePercent, todayYMD } from "../../../../../utils/helperFunctions";
import type { ConfirmTooltipState } from "../salesWorkflowTypes";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import { ListingModel } from "../../../../../components/modal";
import Permission from "../../../../../components/PermissionGuard";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getCompany } from "../../../../../redux/slices/professionalSlice/professionalCompanyMaster.slice";
import { getAllSystemConfigurations } from "../../../../../redux/slices/systemConf";
import ProductMasterModal from "../../../master/productMaster/ProductMasterFormModal";
import { getProductBalance } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";

const CUSTOMER_FIELD_KEYS = new Set([
    "sQuoteCustomerCode",
    "sQuoteCustomerName",
]);

const PRODUCT_FIELD_KEYS = new Set([
    "productCode",
    "productName",
    "productId",
    "product",
]);

const normalizeInventoryFieldName = (value: any) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const getInventoryBalanceApiKey = (field: any) => {
    if (!field) return "";
    const fieldNames = [field?.key, field?.label, field?.title, field?.customMasterName, field?.dataSource?.customMasterName].map(normalizeInventoryFieldName);
    if (fieldNames.some((name) => name.includes("warehouse"))) return "warehouseCode";
    if (fieldNames.some((name) => name.includes("location"))) return "locationCode";
    if (fieldNames.some((name) => name.includes("batch"))) return "batchNumber";
    if (fieldNames.some((name) => name.includes("bin"))) return "binCode";
    return "";
};
const getCustomMasterName = (field: any) => String(field?.customMasterName || field?.dataSource?.customMasterName || field?.label || field?.key || "").trim();
const renderSalesQuotationCellExtra = (column: any, row: any, enableServiceProductInventory: boolean) => {
    if (column?.key !== "quantity" || !row?.productCode) return null;
    const productType = String(row?.productType || "").trim().toLowerCase();
    if (productType === "nonstocks") return null;
    if (productType === "serviceproduct" && !enableServiceProductInventory) return null;
    return <InputBorderLabel label="Avl Qty" value={row?.availableQuantity} loading={row?.availableQuantity === null || row?.availableQuantity === undefined} successWhenPositive />;
};

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
};

const getDefaultForm = () => ({
    sQuoteVoucherNumber: "AUTO",
    sQuoteVoucherDate: todayYMD(),
    sQuoteSalesAccount: "SA021",
    sQuoteCustomerCode: "",
    sQuoteCustomerName: "",
    sQuoteStatus: "draft",
    sQuoteDocStatus: "open",
    sQuoteRemark: "",
    sQuoteStatusRemark: "",
    sQuoteStatusHistory: [],
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

const SalesQuotations = () => {
    const dispatch = useDispatch<any>();

    const {
        salesQuotations = [],
        pagination = defaultPagination,
        loading = false,
        createLoading = false,
        updateLoading = false,
        deleteLoading = false,
    } = useSelector(
        (state: any) =>
            state.salesQuotation
    );

    const {
        transactionsSchema,
    } = useSelector(
        (state: any) =>
            state.getAllTransactionSchema
    );

    const [localOffset, setLocalOffset] =
        useState(0);

    const [localLimit, setLocalLimit] =
        useState(10);

    const [search, setSearch] =
        useState("");

    const [
        debouncedSearch,
        setDebouncedSearch,
    ] = useState("");

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [status, setStatus] =
        useState("open");

    const [
        showModal,
        setShowModal,
    ] = useState(false);

    const [
        checkAccount,
        setCheckAccount,
    ] = useState(false);

    const [
        checkProduct,
        setCheckProduct,
    ] = useState(false);

    const [
        productTargetRowIndex,
        setProductTargetRowIndex,
    ] = useState<number | null>(null);

    const [
        productSearchValue,
        setProductSearchValue,
    ] = useState("");

    const [
        accountListLoaded,
        setAccountListLoaded,
    ] = useState(false);

    const [
        editingRecord,
        setEditingRecord,
    ] = useState<any>(false);

    const [form, setForm] =
        useState<any>(
            getDefaultForm()
        );

    const [errors, setErrors] =
        useState<any>({});

    const [
        templateFields,
        setTemplateFields,
    ] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    const [
        fieldsLoading,
        setFieldsLoading,
    ] = useState(false);

    const [
        confirmTooltip,
        setConfirmTooltip,
    ]: any =
        useState<ConfirmTooltipState>({
            show: false,
            x: null,
            y: null,
            voucherNumber: null,
        });

    const [
        tooltip,
        setTooltip,
    ]: any =
        useState<ConfirmTooltipState>({
            show: false,
            x: null,
            y: null,
            voucherNumber: null,
        });

    const [
        downlaodPDF,
        setDownlaodPDF,
    ]: any = useState({
        show: false,
        type: "",
    });

    const lastSalesQuotationFetchKeyRef =
        useRef("");

    const schemaCalledRef =
        useRef(false);

    const reportMappingCalledRef =
        useRef(false);

    const preparedSchemaRef =
        useRef<any>(null);

    const { report } = useSelector(
        (state: any) =>
            state.reportMapping
    );

    const { company } = useSelector(
        (state: any) =>
            state.professionalCompanyMaster
    );

    const { configurations } =
        useSelector(
            (state: any) =>
                state.systemConfiguration
        );

    const enableServiceProductInventory = useMemo(() => {
        const value = configurations?.[0]?.inventoryConfiguration?.enableServiceProductInventory;
        return value === true || value === "true";
    }, [configurations]);

    const {
        accounts = [],
    } = useSelector(
        (state: any) =>
            state.accountMaster || {}
    );

    const filterAccount =
        useMemo(() => {
            return (
                accounts || []
            ).filter(
                (account: any) =>
                    String(
                        account?.accountType ||
                        ""
                    ).toLowerCase() ===
                    "customer"
            );
        }, [accounts]);

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

    const getHeaderFieldByKey = (
        key: string
    ) =>
        templateFields?.header?.find(
            (field: any) =>
                field.key === key
        );

    const getBodyFieldByKey = (
        key: string
    ) =>
        templateFields?.body?.find(
            (field: any) =>
                field.key === key
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

    const isInventoryBalanceField = (field: any) => Boolean(getInventoryBalanceApiKey(field));
    const getInventoryBalanceFieldValue = (source: any, field: any) => {
        if (!source || !field) return "";
        const customMasterName = getCustomMasterName(field);
        const selectedMaster = source?.customMasters?.[customMasterName] || source?.customMasters?.[field?.key];
        const rawValue = selectedMaster?.code ?? source?.[field?.key] ?? source?.dynamicBodyFields?.[field?.key] ?? "";
        if (rawValue && typeof rawValue === "object") return rawValue?.code ?? rawValue?.value ?? "";
        return rawValue;
    };
    const getInventoryBalanceFilters = (row: any) => {
        const filters: any = {};
        const visibleBodyFields = (templateFields?.body || []).filter((field: any) => !isTrueValue(field?.isHidden));
        const visibleHeaderFields = (templateFields?.header || []).filter((field: any) => !isTrueValue(field?.isHidden));
        const inventoryApiKeys = new Set([...visibleBodyFields, ...visibleHeaderFields].map((field: any) => getInventoryBalanceApiKey(field)).filter(Boolean));
        inventoryApiKeys.forEach((apiKey: any) => {
            const bodyField = visibleBodyFields.find((field: any) => getInventoryBalanceApiKey(field) === apiKey);
            if (bodyField) {
                const value = getInventoryBalanceFieldValue(row, bodyField);
                if (value !== undefined && value !== null && String(value).trim() !== "") filters[apiKey] = value;
                return;
            }
            const headerField = visibleHeaderFields.find((field: any) => getInventoryBalanceApiKey(field) === apiKey);
            if (!headerField) return;
            const value = getInventoryBalanceFieldValue(form, headerField);
            if (value !== undefined && value !== null && String(value).trim() !== "") filters[apiKey] = value;
        });
        return filters;
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
                        selectedOption.raw?.[
                        sourceKey as string
                        ] ?? "";
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
                    field.key ===
                    "uom" ||
                    field.key ===
                    "unit"
            );

        const selectedUnit =
            unitField?.options?.find(
                (item: any) =>
                    String(
                        item.value
                    ) ===
                    String(unitCode)
            );

        return (
            selectedUnit?.label ||
            unitCode ||
            ""
        );
    };

    const getProductMasterFromRow = (row: any) => {
        if (!row) return null;
        const rowProductValues = [row?.productCode, row?.productId, row?.productName].filter((value) => value !== undefined && value !== null && value !== "").map((value) => String(value));
        if (!rowProductValues.length) return null;
        const productFields = (templateFields?.body || []).filter((field: any) => ["productCode", "productId", "productName"].includes(field?.key));
        for (const field of productFields) {
            const selectedOption = (field?.options || []).find((option: any) => {
                const optionValues = [option?.value, option?.raw?._id, option?.raw?.productId, option?.raw?.productCode, option?.raw?.productName].filter((value) => value !== undefined && value !== null && value !== "").map((value) => String(value));
                return optionValues.some((value) => rowProductValues.includes(value));
            });
            if (selectedOption?.raw) return selectedOption.raw;
        }
        return null;
    };

    const normalizeRowKeys = (
        row: any
    ) => {
        const updated = {
            ...row,
        };

        if (
            updated.uom &&
            !updated.unit
        ) {
            updated.unit =
                updated.uom;
        }

        if (
            updated.unit &&
            !updated.uom
        ) {
            updated.uom =
                updated.unit;
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

    const calculateRow = (
        row: any
    ) => {
        const quantity =
            num(row.quantity);

        const rate =
            num(row.rate);

        const gross =
            quantity * rate;

        const discountPercent =
            safePercent(
                row.discountPercentage !== undefined &&
                    row.discountPercentage !== null &&
                    row.discountPercentage !== ""
                    ? row.discountPercentage
                    : row.discount
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
            (
                gross *
                discountPercent
            ) / 100;

        const taxableAmount =
            gross -
            discountAmount;

        const cgstAmount =
            (
                taxableAmount *
                cgstPercent
            ) / 100;

        const sgstAmount =
            (
                taxableAmount *
                sgstPercent
            ) / 100;

        const igstAmount =
            (
                taxableAmount *
                igstPercent
            ) / 100;

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
            quantity:
                row.quantity,
            rate:
                row.rate,
            discount:
                discountPercent,
            discountPercentage:
                discountPercent,
            cgst:
                cgstPercent,
            cgstPercentage:
                cgstPercent,
            sgst:
                sgstPercent,
            sgstPercentage:
                sgstPercent,
            igst:
                igstPercent,
            igstPercentage:
                igstPercent,
            otherAmount:
                row.otherAmount,
            gross,
            grossAmount:
                gross,
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

    const calculateFooter = (
        products: any[]
    ) => {
        return (
            products || []
        ).reduce(
            (
                acc: any,
                item: any
            ) => {
                acc.totalQuantity +=
                    num(
                        item.quantity
                    );

                acc.totalGrossAmount +=
                    num(
                        item.gross
                    );

                acc.totalDiscountAmount +=
                    num(
                        item.discountAmount
                    );

                acc.totalCgstAmount +=
                    num(
                        item.cgstAmount
                    );

                acc.totalSgstAmount +=
                    num(
                        item.sgstAmount
                    );

                acc.totalIgstAmount +=
                    num(
                        item.igstAmount
                    );

                acc.totalTaxAmount +=
                    num(
                        item.taxAmount
                    );

                acc.totalOtherAmount +=
                    num(
                        item.otherAmount
                    );

                acc.totalNetAmount +=
                    num(
                        item.netAmount
                    );

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

    const footerTotals =
        useMemo(
            () =>
                calculateFooter(
                    form.products ||
                    []
                ),
            [form.products]
        );

    const grossAmount =
        footerTotals
            .totalGrossAmount;

    const discountAmount =
        footerTotals
            .totalDiscountAmount;

    const cgstAmount =
        footerTotals
            .totalCgstAmount;

    const sgstAmount =
        footerTotals
            .totalSgstAmount;

    const igstAmount =
        footerTotals
            .totalIgstAmount;

    const netAmount =
        footerTotals
            .totalNetAmount;

    const fetchSalesQuotations =
        async (
            force = false
        ) => {
            const fetchKey =
                `${localOffset}-${localLimit}-${debouncedSearch}-${status}`;

            if (
                !force &&
                lastSalesQuotationFetchKeyRef.current ===
                fetchKey
            ) {
                return;
            }

            lastSalesQuotationFetchKeyRef.current =
                fetchKey;

            await dispatch(
                getSalesQuotationList({
                    offset:
                        localOffset,
                    limit:
                        localLimit,
                    search:
                        debouncedSearch,
                    docStatus:
                        status,
                }) as any
            );
        };

    const columns = [
        {
            key:
                "sQuoteVoucherNumber",
            title:
                "Voucher No",
        },
        {
            key:
                "sQuoteVoucherDate",
            title: "Date",
            render: (
                row: any
            ) =>
                row?.sQuoteVoucherDate
                    ? formatDateForList(
                        row.sQuoteVoucherDate
                    )
                    : "-",
        },
        {
            key:
                "sQuoteCustomerName",
            title:
                "Customer",
            render: (
                row: any
            ) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.sQuoteCustomerName ||
                            "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.sQuoteCustomerCode ||
                            "-"}
                    </div>
                </div>
            ),
        },
        {
            key:
                "sQuoteBody",
            title: "Items",
            render: (
                row: any
            ) =>
                row
                    ?.sQuoteBody
                    ?.length ||
                0,
        },
        {
            key:
                "sQuoteFooter",
            title:
                "Net Amount",
            type: "amount",
            render: (
                row: any
            ) => (
                <span className="font-semibold text-primary">
                    {money(
                        row
                            ?.sQuoteFooter
                            ?.netAmount ||
                        0
                    )}
                </span>
            ),
        },
        {
            key:
                "sQuoteDocStatus",
            title:
                "Doc Status",
            render: (
                row: any
            ) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.sQuoteDocStatus ===
                        "open"
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-danger/20 bg-danger/10 text-danger"
                        }`}
                >
                    {row?.sQuoteDocStatus ||
                        "-"}
                </span>
            ),
        },
        {
            key:
                "sQuoteStatus",
            title:
                "Quote Status",
            render: (
                row: any
            ) => (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {row?.sQuoteStatus ||
                        "-"}
                </span>
            ),
        },
    ];

    const enableLocation =
        useMemo(() => {
            const locationConfig =
                configurations?.[0]
                    ?.systemConfiguration
                    ?.salesQuotation
                    ?.enableLocation;

            return (
                locationConfig ===
                true ||
                locationConfig ===
                "true"
            );
        }, [configurations]);

    const enableDuplicatePro =
        useMemo(() => {
            const duplicateConfig =
                configurations?.[0]
                    ?.systemConfiguration
                    ?.allowDuplicateProduct;

            return (
                duplicateConfig ===
                true ||
                duplicateConfig ===
                "true"
            );
        }, [configurations]);

    const handleStatusChange = (
        nextStatus: string
    ) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh =
        async () => {
            setRefreshing(true);

            try {
                await fetchSalesQuotations(
                    true
                );

                toast.success(
                    "Sales quotation list refreshed"
                );
            } finally {
                setRefreshing(
                    false
                );
            }
        };

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        setForm(
            getDefaultForm()
        );
        setCheckAccount(false);
        setCheckProduct(false);
        setProductTargetRowIndex(null);
    };

    const openAddModal = () => {
        resetMainForm();
        setShowModal(true);
    };

    const loadAvailableQuantity = async (index: number, productCode: string, productType: string, rowData?: any) => {
        const normalizedProductType = String(productType || "").trim().toLowerCase();
        if (!productCode || normalizedProductType === "nonstocks" || (normalizedProductType === "serviceproduct" && !enableServiceProductInventory)) {
            setForm((previous: any) => {
                const updatedProducts = [...(previous.products || [])];
                if (!updatedProducts[index]) return previous;
                updatedProducts[index] = { ...updatedProducts[index], productType: normalizedProductType, availableQuantity: null };
                return { ...previous, products: updatedProducts };
            });
            return;
        }
        setForm((previous: any) => {
            const updatedProducts = [...(previous.products || [])];
            if (!updatedProducts[index] || String(updatedProducts[index]?.productCode || "") !== String(productCode)) return previous;
            updatedProducts[index] = { ...updatedProducts[index], productType: normalizedProductType, availableQuantity: null };
            return { ...previous, products: updatedProducts };
        });
        try {
            const { fromDate, toDate } = getFinancialYearRange(todayYMD());
            const balance: any = await dispatch(getProductBalance({ productCode, fromDate, toDate, ...getInventoryBalanceFilters(rowData || form?.products?.[index]) }) as any).unwrap();
            setForm((previous: any) => {
                const updatedProducts = [...(previous.products || [])];
                if (!updatedProducts[index] || String(updatedProducts[index]?.productCode || "") !== String(productCode)) return previous;
                updatedProducts[index] = { ...updatedProducts[index], productType: normalizedProductType, availableQuantity: balance?.balanceQuantity !== undefined && balance?.balanceQuantity !== null ? balance.balanceQuantity : null };
                return { ...previous, products: updatedProducts };
            });
        } catch (error) {
            console.log(`Failed to fetch available quantity for ${productCode}`, error);
        }
    };

    const openEditModal = (
        record: any
    ) => {
        const footer =
            record?.sQuoteFooter ||
            {};

        const products =
            record?.sQuoteBody
                ?.length > 0
                ? record.sQuoteBody.map(
                    (
                        item: any
                    ) => {
                        const unitCode =
                            item?.unit ||
                            item?.uom ||
                            "";
                        const productMaster = getProductMasterFromRow(item) || {};

                        return calculateRow(
                            normalizeRowKeys(
                                {
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

                                    availableQuantity: null,

                                    productType:
                                        item?.productType ||
                                        productMaster?.productType ||
                                        productMaster?.dynamicFields?.productType ||
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
                                }
                            )
                        );
                    }
                )
                : [
                    {
                        ...emptyProductRow,
                        id:
                            Date.now(),
                    },
                ];

        setEditingRecord(true);
        setErrors({});

        setForm({
            sQuoteVoucherNumber:
                record?.sQuoteVoucherNumber ||
                "AUTO",

            sQuoteVoucherDate:
                formatDateForInput(
                    record?.sQuoteVoucherDate
                ),

            sQuoteCustomerCode:
                record?.sQuoteCustomerCode ||
                "",

            sQuoteCustomerName:
                record?.sQuoteCustomerName ||
                "",

            sQuoteSalesAccount:
                record?.sQuoteSalesAccount ||
                "SA021",

            sQuoteDocStatus:
                record?.sQuoteDocStatus ||
                "open",

            sQuoteStatus:
                record?.sQuoteStatus ||
                "draft",

            sQuoteRemark:
                record?.sQuoteRemark ||
                "",

            sQuoteStatusRemark:
                record?.sQuoteStatusRemark ||
                "",

            sQuoteStatusHistory:
                record?.sQuoteStatusHistory ||
                [],

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

            latitude:
                record
                    ?.sQuoteLocation
                    ?.lat,

            locationAddress:
                record
                    ?.sQuoteLocation
                    ?.address,

            longitude:
                record
                    ?.sQuoteLocation
                    ?.lng,
        });

        setShowModal(true);
    };

    useEffect(() => {
        if (!showModal || !editingRecord || !form?.products?.length) return;
        let cancelled = false;
        const fetchEditAvailableQuantities = async () => {
            const { fromDate, toDate } = getFinancialYearRange(todayYMD());
            const productsWithBalance = await Promise.all((form.products || []).map(async (item: any) => {
                const productCode = String(item?.productCode || "").trim();
                if (!productCode) return item;
                const productMaster = getProductMasterFromRow(item) || {};
                const productType = String(item?.productType || productMaster?.productType || productMaster?.dynamicFields?.productType || "").trim().toLowerCase();
                if (productType === "nonstocks" || (productType === "serviceproduct" && !enableServiceProductInventory)) return { ...item, productType, availableQuantity: null };
                try {
                    const balance: any = await dispatch(getProductBalance({ productCode, fromDate, toDate, ...getInventoryBalanceFilters(item) }) as any).unwrap();
                    return { ...item, productType, availableQuantity: balance?.balanceQuantity !== undefined && balance?.balanceQuantity !== null ? balance.balanceQuantity : null };
                } catch (error) {
                    console.log(`Failed to fetch available quantity for ${productCode}`, error);
                    return { ...item, productType, availableQuantity: item?.availableQuantity ?? null };
                }
            }));
            if (cancelled) return;
            setForm((previous: any) => ({ ...previous, products: productsWithBalance }));
        };
        void fetchEditAvailableQuantities();
        return () => { cancelled = true; };
    }, [showModal, editingRecord, form?.sQuoteVoucherNumber, dispatch, enableServiceProductInventory]);

    const handleMainChange = (
        key: string,
        value: any
    ) => {
        setForm(
            (prev: any) => {
                const currentField =
                    getHeaderFieldByKey(
                        key
                    );

                let updated = {
                    ...prev,
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
            }
        );

        setErrors(
            (prev: any) => ({
                ...prev,
                [key]: "",
            })
        );
    };

    const headerInventoryBalanceSignature = useMemo(() => {
        return (templateFields?.header || []).filter((field: any) => !isTrueValue(field?.isHidden) && Boolean(getInventoryBalanceApiKey(field))).map((field: any) => {
            const apiKey = getInventoryBalanceApiKey(field);
            const value = getInventoryBalanceFieldValue(form, field);
            return `${apiKey}:${String(value || "")}`;
        }).join("|");
    }, [form, templateFields?.header]);

    useEffect(() => {
        if (!showModal) return;
        const headerInventoryFields = (templateFields?.header || []).filter((field: any) => !isTrueValue(field?.isHidden) && Boolean(getInventoryBalanceApiKey(field)));
        if (!headerInventoryFields.length) return;
        (form?.products || []).forEach((row: any, index: number) => {
            const productCode = String(row?.productCode || "").trim();
            if (!productCode) return;
            void loadAvailableQuantity(index, productCode, String(row?.productType || ""), row);
        });
    }, [headerInventoryBalanceSignature]);

    const handleAccountSaved =
        async (
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

                setAccountListLoaded(
                    true
                );

                await dispatch(
                    getAllReportMapping({
                        moduleType:
                            "salesQuotation",
                    }) as any
                ).unwrap();

                if (
                    transactionsSchema
                ) {
                    const updatedData =
                        await loadAllTemplateOptions(
                            transactionsSchema
                        );

                    setTemplateFields(
                        updatedData
                    );
                }

                const savedAccount =
                    savedResponse
                        ?.data
                        ?.account ||
                    savedResponse
                        ?.data
                        ?.data ||
                    savedResponse
                        ?.data ||
                    savedResponse
                        ?.account ||
                    savedResponse;

                const refreshedAccounts =
                    accountResponse
                        ?.data
                        ?.accounts ||
                    accountResponse
                        ?.data
                        ?.data
                        ?.accounts ||
                    accountResponse
                        ?.accounts ||
                    accountResponse
                        ?.data
                        ?.items ||
                    accountResponse
                        ?.items ||
                    [];

                const customerAccounts =
                    Array.isArray(
                        refreshedAccounts
                    )
                        ? refreshedAccounts.filter(
                            (
                                account: any
                            ) =>
                                String(
                                    account?.accountType ||
                                    ""
                                ).toLowerCase() ===
                                "customer"
                        )
                        : [];

                const savedCode =
                    savedAccount
                        ?.accountCode ||
                    "";

                const savedName =
                    savedAccount
                        ?.accountName ||
                    "";

                const createdCustomer =
                    customerAccounts.find(
                        (
                            account: any
                        ) =>
                            (
                                savedCode &&
                                account
                                    ?.accountCode ===
                                savedCode
                            ) ||
                            (
                                savedName &&
                                account
                                    ?.accountName ===
                                savedName
                            )
                    ) ||
                    (
                        savedCode ||
                            savedName
                            ? savedAccount
                            : null
                    );

                if (
                    createdCustomer
                ) {
                    setForm(
                        (
                            prev: any
                        ) => ({
                            ...prev,

                            sQuoteCustomerCode:
                                createdCustomer
                                    ?.accountCode ||
                                prev
                                    ?.sQuoteCustomerCode ||
                                "",

                            sQuoteCustomerName:
                                createdCustomer
                                    ?.accountName ||
                                prev
                                    ?.sQuoteCustomerName ||
                                "",
                        })
                    );

                    setErrors(
                        (
                            prev: any
                        ) => ({
                            ...prev,
                            sQuoteCustomerCode:
                                "",
                            sQuoteCustomerName:
                                "",
                        })
                    );
                }
            } catch (
            error: any
            ) {
                console.log(
                    "Failed to refresh account options:",
                    error
                );

                toast.error(
                    error?.message ||
                    "Account created, but customer dropdown refresh failed"
                );
            } finally {
                setCheckAccount(
                    false
                );
            }
        };

    const handleProductSaved =
        async (
            savedResponse: any
        ) => {
            try {
                await dispatch(
                    getAllReportMapping({
                        moduleType:
                            "salesQuotation",
                    }) as any
                ).unwrap();

                let updatedData =
                    templateFields;

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
                    savedResponse
                        ?.data
                        ?.product ||
                    savedResponse
                        ?.data
                        ?.data
                        ?.product ||
                    savedResponse
                        ?.data
                        ?.data ||
                    savedResponse
                        ?.data ||
                    savedResponse
                        ?.product ||
                    savedResponse;

                const savedCode =
                    savedProduct
                        ?.productCode ||
                    "";

                const savedName =
                    savedProduct
                        ?.productName ||
                    "";

                const productFields = (
                    updatedData?.body || []
                ).filter((field: any) =>
                    [
                        "productCode",
                        "productName",
                        "productId",
                        "product",
                    ].includes(
                        String(
                            field?.key ||
                            ""
                        )
                    )
                );

                let selectedField: any =
                    null;

                let selectedOption: any =
                    null;

                for (
                    const field of productFields
                ) {
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

                setForm(
                    (prev: any) => {
                        const updatedProducts = [
                            ...(
                                prev.products ||
                                []
                            ),
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

                            rate:
                                createdProduct
                                    ?.sellingPrice ??
                                createdProduct
                                    ?.rate ??
                                updatedRow
                                    ?.rate ??
                                "",

                            productType:
                                createdProduct?.productType ||
                                createdProduct?.dynamicFields?.productType ||
                                "",

                            availableQuantity: null,
                        };

                        const selectedCustomer =
                            filterAccount?.find(
                                (account: any) =>
                                    account
                                        ?.accountName ==
                                    prev
                                        ?.sQuoteCustomerName
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
                            company
                                ?.state
                                ?.isoCode ==
                            selectedCustomer
                                ?.state
                                ?.isoCode
                        ) {
                            updatedRow.cgst =
                                cgstValue;

                            updatedRow.cgstPercentage =
                                cgstValue;

                            updatedRow.sgst =
                                sgstValue;

                            updatedRow.sgstPercentage =
                                sgstValue;

                            updatedRow.igst =
                                "";

                            updatedRow.igstPercentage =
                                "";

                            updatedRow.igstAmount =
                                0;
                        } else {
                            updatedRow.igst =
                                igstValue;

                            updatedRow.igstPercentage =
                                igstValue;

                            updatedRow.cgst =
                                "";

                            updatedRow.cgstPercentage =
                                "";

                            updatedRow.sgst =
                                "";

                            updatedRow.sgstPercentage =
                                "";

                            updatedRow.cgstAmount =
                                0;

                            updatedRow.sgstAmount =
                                0;
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
                            ...prev,
                            products:
                                updatedProducts,
                        };
                    }
                );

                setErrors(
                    (prev: any) => ({
                        ...prev,
                        products: "",
                    })
                );
            } catch (
            error: any
            ) {
                console.log(
                    "Failed to refresh product options:",
                    error
                );

                toast.error(
                    error?.message ||
                    "Product created, but product dropdown refresh failed"
                );
            } finally {
                setCheckProduct(false);
                setProductTargetRowIndex(null);
            }
        };

    const handleAddRow = () =>
        setForm(
            (prev: any) => ({
                ...prev,
                products: [
                    ...(
                        prev.products ||
                        []
                    ),
                    {
                        ...emptyProductRow,
                        id:
                            Date.now(),
                    },
                ],
            })
        );

    const handleDeleteRow = (
        index: number
    ) => {
        setForm(
            (prev: any) => {
                const updatedProducts =
                    (
                        prev.products ||
                        []
                    ).filter(
                        (
                            _: any,
                            i: number
                        ) =>
                            i !==
                            index
                    );

                return {
                    ...prev,
                    products:
                        updatedProducts.length >
                            0
                            ? updatedProducts
                            : [
                                {
                                    ...emptyProductRow,
                                    id:
                                        Date.now(),
                                },
                            ],
                };
            }
        );
    };

    const handleRowChange = (
        index: number,
        key: string,
        value: any
    ) => {
        if (
            !form
                ?.sQuoteCustomerName
        ) {
            return toast.error(
                "Please select customer first"
            );
        }

        const lowerKey =
            String(
                key || ""
            ).toLowerCase();

        const isProductField =
            lowerKey ===
            "productcode" ||
            lowerKey ===
            "productname" ||
            lowerKey ===
            "productid" ||
            lowerKey ===
            "product";

        const duplicate =
            isProductField &&
            Boolean(
                form?.products?.filter(
                    (
                        e: any,
                        i: number
                    ) =>
                        i !==
                        index &&
                        String(
                            e?.productCode ||
                            e?.productName ||
                            e?.productId ||
                            ""
                        ) ===
                        String(
                            value ||
                            ""
                        )
                )?.length
            );

        if (
            key ===
            "productCode" &&
            duplicate &&
            !enableDuplicatePro
        ) {
            setErrors(
                (prev: any) => ({
                    ...prev,
                    products: "",
                    [`row_${index}_${key}`]:
                        "This product already added",
                    [`row_${index}_tax`]:
                        "",
                })
            );

            return;
        }

        const balanceField = getBodyFieldByKey(key);
        const balanceSelectedOption = getOptionByValue(balanceField, value);
        const balanceRaw = balanceSelectedOption?.raw || {};
        let balanceRow = { ...(form?.products?.[index] || {}), [key]: value };
        if (balanceField?.mapFields) balanceRow = applyMappedFields(balanceField, value, balanceRow);
        if (PRODUCT_FIELD_KEYS.has(key)) {
            balanceRow.productCode = balanceRaw?.productCode || balanceRow?.productCode || balanceSelectedOption?.value || value || "";
            balanceRow.productType = balanceRaw?.productType || balanceRaw?.dynamicFields?.productType || balanceRow?.productType || "";
        }

        setForm(
            (prev: any) => {
                const updatedProducts = [
                    ...(
                        prev.products ||
                        []
                    ),
                ];

                const currentRow =
                    updatedProducts[
                    index
                    ] || {};

                const currentField =
                    getBodyFieldByKey(
                        key
                    );

                let updatedRow = {
                    ...currentRow,
                    [key]: value,
                };

                if (
                    currentField?.mapFields
                ) {
                    updatedRow =
                        applyMappedFields(
                            currentField,
                            value,
                            updatedRow
                        );
                }

                const selectedOption =
                    getOptionByValue(
                        currentField,
                        value
                    );

                const raw =
                    selectedOption
                        ?.raw || {};

                if (
                    raw?._id &&
                    !updatedRow.productId
                ) {
                    updatedRow.productId =
                        raw._id;
                }

                updatedRow =
                    normalizeRowKeys(
                        updatedRow
                    );

                if (
                    isProductField
                ) {
                    updatedRow.productType = raw?.productType || raw?.dynamicFields?.productType || "";
                    updatedRow.availableQuantity = null;
                    const getCustomer =
                        filterAccount?.find(
                            (e: any) =>
                                e.accountName ==
                                prev?.sQuoteCustomerName
                        );

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

                    if (
                        company
                            ?.state
                            ?.isoCode ==
                        getCustomer
                            ?.state
                            ?.isoCode
                    ) {
                        updatedRow.cgst =
                            cgstValue;

                        updatedRow.cgstPercentage =
                            cgstValue;

                        updatedRow.sgst =
                            sgstValue;

                        updatedRow.sgstPercentage =
                            sgstValue;

                        updatedRow.igst =
                            "";

                        updatedRow.igstPercentage =
                            "";

                        updatedRow.igstAmount =
                            0;
                    } else {
                        updatedRow.igst =
                            igstValue;

                        updatedRow.igstPercentage =
                            igstValue;

                        updatedRow.cgst =
                            "";

                        updatedRow.cgstPercentage =
                            "";

                        updatedRow.sgst =
                            "";

                        updatedRow.sgstPercentage =
                            "";

                        updatedRow.cgstAmount =
                            0;

                        updatedRow.sgstAmount =
                            0;
                    }
                }

                const isCgst =
                    lowerKey ===
                    "cgst" ||
                    lowerKey ===
                    "cgstpercentage";

                const isSgst =
                    lowerKey ===
                    "sgst" ||
                    lowerKey ===
                    "sgstpercentage";

                const isIgst =
                    lowerKey ===
                    "igst" ||
                    lowerKey ===
                    "igstpercentage";

                if (isCgst) {
                    updatedRow.cgst =
                        value;

                    updatedRow.cgstPercentage =
                        value;
                }

                if (isSgst) {
                    updatedRow.sgst =
                        value;

                    updatedRow.sgstPercentage =
                        value;
                }

                if (isIgst) {
                    updatedRow.igst =
                        value;

                    updatedRow.igstPercentage =
                        value;
                }

                if (
                    (
                        isCgst ||
                        isSgst
                    ) &&
                    num(value) >
                    0
                ) {
                    updatedRow.igst =
                        "";

                    updatedRow.igstPercentage =
                        "";

                    updatedRow.igstAmount =
                        0;
                }

                if (
                    isIgst &&
                    num(value) >
                    0
                ) {
                    updatedRow.cgst =
                        "";

                    updatedRow.cgstPercentage =
                        "";

                    updatedRow.sgst =
                        "";

                    updatedRow.sgstPercentage =
                        "";

                    updatedRow.cgstAmount =
                        0;

                    updatedRow.sgstAmount =
                        0;
                }

                updatedRow =
                    calculateRow(
                        updatedRow
                    );

                updatedProducts[
                    index
                ] = updatedRow;

                return {
                    ...prev,
                    products:
                        updatedProducts,
                };
            }
        );

        if (PRODUCT_FIELD_KEYS.has(key) || isInventoryBalanceField(balanceField)) {
            const productCode = String(balanceRow?.productCode || "").trim();
            const productType = String(balanceRow?.productType || "");
            if (productCode) void loadAvailableQuantity(index, productCode, productType, balanceRow);
        }

        setErrors(
            (prev: any) => ({
                ...prev,
                products: "",
                [`row_${index}_${key}`]:
                    "",
                [`row_${index}_tax`]:
                    "",
                [`row_${index}_igstPercentage`]:
                    "",
                [`row_${index}_cgstPercentage`]:
                    "",
                [`row_${index}_sgstPercentage`]:
                    "",
                [`row_${index}_igst`]:
                    "",
                [`row_${index}_cgst`]:
                    "",
                [`row_${index}_sgst`]:
                    "",
            })
        );
    };

    const getFilledRows = () => {
        const bodyKeys =
            (
                templateFields?.body ||
                []
            )
                .filter(
                    (
                        field: any
                    ) =>
                        !field.isHidden
                )
                .map(
                    (
                        field: any
                    ) =>
                        field.key
                );

        return (
            form.products ||
            []
        ).filter(
            (row: any) =>
                bodyKeys.some(
                    (
                        key: string
                    ) => {
                        const value =
                            row?.[
                            key
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
                )
        );
    };

    const validateForm = () => {
        const err: any = {};

        (
            templateFields?.header ||
            []
        ).forEach(
            (field: any) => {
                if (
                    field.isHidden
                ) {
                    return;
                }

                if (
                    !field.isRequired
                ) {
                    return;
                }

                const value =
                    form?.[
                    field.key
                    ];

                if (
                    value ===
                    undefined ||
                    value === null ||
                    value === ""
                ) {
                    err[
                        field.key
                    ] =
                        `${field.label || field.key} is required`;
                }
            }
        );

        const filledRows =
            getFilledRows();

        if (
            filledRows.length ===
            0
        ) {
            err.products =
                "Please add at least one product";
        }

        (
            form.products ||
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
                        ) => {
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

                if (
                    !hasAnyValue
                ) {
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
                            field.isHidden
                        ) {
                            return;
                        }

                        if (
                            !field.isRequired
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
                            value ===
                            null ||
                            value ===
                            ""
                        ) {
                            err[
                                `row_${index}_${field.key}`
                            ] =
                                `${field.label || field.key} is required`;
                        }
                    }
                );

                const cgst =
                    num(
                        row.cgstPercentage ||
                        row.cgst
                    );

                const sgst =
                    num(
                        row.sgstPercentage ||
                        row.sgst
                    );

                const igst =
                    num(
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
                    err[
                        `row_${index}_tax`
                    ] =
                        "You can enter either IGST or CGST/SGST";

                    err[
                        `row_${index}_igstPercentage`
                    ] =
                        "Only one tax type allowed";

                    err[
                        `row_${index}_cgstPercentage`
                    ] =
                        "Only one tax type allowed";

                    err[
                        `row_${index}_sgstPercentage`
                    ] =
                        "Only one tax type allowed";

                    err[
                        `row_${index}_igst`
                    ] =
                        "Only one tax type allowed";

                    err[
                        `row_${index}_cgst`
                    ] =
                        "Only one tax type allowed";

                    err[
                        `row_${index}_sgst`
                    ] =
                        "Only one tax type allowed";
                }
            }
        );

        setErrors(err);

        if (err.products) {
            toast.error(
                err.products
            );
        }

        return (
            Object.keys(err)
                .length === 0
        );
    };

    const cleanRows = () => {
        const bodyKeys =
            (
                templateFields?.body ||
                []
            ).map(
                (
                    field: any
                ) =>
                    field.key
            );

        return (
            form.products ||
            []
        )
            .filter(
                (row: any) =>
                    bodyKeys.some(
                        (
                            key: string
                        ) => {
                            const value =
                                row?.[
                                key
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
                    )
            )
            .map(
                (row: any) =>
                    calculateRow(
                        normalizeRowKeys(
                            row
                        )
                    )
            );
    };

    const handleSubmit =
        async () => {
            if (
                !validateForm()
            ) {
                return;
            }

            const products =
                cleanRows();

            const footer =
                calculateFooter(
                    products
                );

            const payload: any = {
                sQuoteVoucherDate:
                    form
                        .sQuoteVoucherDate,

                sQuoteCustomerCode:
                    form
                        .sQuoteCustomerCode,

                sQuoteCustomerName:
                    form
                        .sQuoteCustomerName,

                sQuoteSalesAccount:
                    form
                        .sQuoteSalesAccount ||
                    "SA021",

                sQuoteStatus:
                    form
                        .sQuoteStatus ||
                    "draft",

                sQuoteDocStatus:
                    form
                        .sQuoteDocStatus ||
                    "open",

                sQuoteRemark:
                    form
                        .sQuoteRemark,

                sQuoteBody:
                    products.map(
                        (
                            item: any
                        ) => ({
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
                        })
                    ),

                sQuoteFooter: {
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

                    adjustedAmount:
                        "0",

                    balanceAmount:
                        fmtMoney(
                            footer
                                .totalNetAmount
                        ),

                    totalQuantity:
                        footer
                            .totalQuantity,

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

                sQuoteLocation: {
                    lat:
                        form?.latitude,

                    lng:
                        form?.longitude,

                    address:
                        form
                            ?.locationAddress,
                },
            };

            try {
                if (
                    editingRecord
                ) {
                    await dispatch(
                        updateSalesQuotation(
                            {
                                sQuoteVoucherNumber:
                                    form
                                        ?.sQuoteVoucherNumber,

                                payload,
                            }
                        ) as any
                    ).unwrap();

                    toast.success(
                        "Sales quotation updated successfully"
                    );
                } else {
                    await dispatch(
                        addSalesQuotation(
                            {
                                payload,
                            }
                        ) as any
                    ).unwrap();

                    toast.success(
                        "Sales quotation created successfully"
                    );
                }

                setShowModal(false);
                setCheckAccount(
                    false
                );

                resetMainForm();

                fetchSalesQuotations(
                    true
                );
            } catch (
            error: any
            ) {
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

                await dispatch(
                    deleteSalesQuotation({
                        sQuoteVoucherNumber:
                            confirmTooltip
                                .voucherNumber,
                    }) as any
                ).unwrap();

                toast.success(
                    "Sales quotation deleted"
                );

                fetchSalesQuotations(
                    true
                );
            } catch (
            error: any
            ) {
                toast.error(
                    error?.message ||
                    "Failed to delete sales quotation"
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

    const footerValues =
        useMemo(
            () => ({
                grossAmount,
                discountAmount,
                cgstAmount,
                sgstAmount,
                igstAmount,
                netAmount,
                adjustedAmount:
                    0,
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
                    (
                        field: any
                    ) =>
                        !field.isHidden
                )
                .map(
                    (
                        field: any
                    ) => {
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
        if (
            schemaCalledRef.current
        ) {
            return;
        }

        schemaCalledRef.current =
            true;

        dispatch(
            getAllTransactionSchema(
                "salesQuotation"
            ) as any
        );
    }, [dispatch]);

    useEffect(() => {
        fetchSalesQuotations();
    }, [
        localOffset,
        localLimit,
        debouncedSearch,
        status,
    ]);

    useEffect(() => {
        const timer =
            setTimeout(
                () => {
                    setDebouncedSearch(
                        search.trim()
                    );

                    setLocalOffset(
                        0
                    );
                },
                400
            );

        return () =>
            clearTimeout(
                timer
            );
    }, [search]);

    useEffect(() => {
        const prepareFields =
            async () => {
                if (
                    !transactionsSchema
                ) {
                    return;
                }

                const schemaKey =
                    JSON.stringify(
                        transactionsSchema
                    );

                if (
                    preparedSchemaRef.current ===
                    schemaKey
                ) {
                    return;
                }

                preparedSchemaRef.current =
                    schemaKey;

                const hasSchema =
                    Array.isArray(
                        transactionsSchema
                            ?.header
                    ) ||
                    Array.isArray(
                        transactionsSchema
                            ?.body
                    ) ||
                    Array.isArray(
                        transactionsSchema
                            ?.footer
                    );

                if (
                    !hasSchema
                ) {
                    return;
                }

                try {
                    setFieldsLoading(
                        true
                    );

                    const updatedData =
                        await loadAllTemplateOptions(
                            transactionsSchema
                        );

                    setTemplateFields(
                        updatedData
                    );
                } catch (
                error
                ) {
                    console.log(
                        "Failed to prepare template fields",
                        error
                    );
                } finally {
                    setFieldsLoading(
                        false
                    );
                }
            };

        prepareFields();
    }, [transactionsSchema]);

    useEffect(() => {
        if (
            reportMappingCalledRef.current
        ) {
            return;
        }

        reportMappingCalledRef.current =
            true;

        dispatch(
            getAllReportMapping({
                moduleType:
                    "salesQuotation",
            }) as any
        );
    }, [dispatch]);

    const isClosedSalesQuations = (
        record: any
    ) => {
        const quotationStatus =
            String(
                record?.sQuoteDocStatus ||
                ""
            ).toLowerCase();

        return (
            quotationStatus ===
            "close" ||
            quotationStatus ===
            "closed"
        );
    };

    const handleEditSalesQuations = (
        record: any
    ) => {
        if (
            isClosedSalesQuations(
                record
            )
        ) {
            toast.error(
                "You can't edit closed Quatations"
            );

            return;
        }

        openEditModal(record);
    };

    const handleDeleteSalesQuationsClick =
        (
            event: any,
            record: any
        ) => {
            if (
                isClosedSalesQuations(
                    record
                )
            ) {
                toast.error(
                    "You can't delete closed Quatations"
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
                        ?.sQuoteVoucherNumber,
            });
        };

    useEffect(() => {
        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );

        const loadAccounts =
            async () => {
                try {
                    await dispatch(
                        getAllAccounts({
                            offset: 0,
                            limit: 100,
                            search: "",
                        }) as any
                    ).unwrap();
                } catch (
                error
                ) {
                    console.log(
                        "Failed to load accounts",
                        error
                    );
                } finally {
                    setAccountListLoaded(
                        true
                    );
                }
            };

        loadAccounts();

        if (!Object.keys(company ?? {})?.length) {
            dispatch(getCompany({ withParent: true, limit: 100, }) as any);
        }
    }, [dispatch]);

    useEffect(() => {
        if (!showModal) {
            setCheckProduct(false);
            return;
        }

        if (editingRecord) {
            return;
        }

        if (
            !accountListLoaded
        ) {
            return;
        }

        if (
            filterAccount.length ===
            0
        ) {
            setCheckAccount(
                true
            );
        }
    }, [
        showModal,
        editingRecord,
        accountListLoaded,
        filterAccount.length,
    ]);

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div
                id="sales-quotation-header"
                className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <div
                    id="sales-quotation-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count:
                                pagination?.totalDocs ??
                                0,

                            text:
                                "Total Sales Quotations:",

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

                    <DataREfreshButton
                        {...{
                            callBackFn:
                                handleRefresh,

                            loading:
                                refreshing,
                        }}
                    />

                    <SearchInput
                        {...{
                            search,
                            setSearch,
                        }}
                    />

                    <Permission
                        module="bookez"
                        permissionKey="salesQuotation"
                        action="create"
                    >
                        <DataCreateButton
                            {...{
                                callBackFn:
                                    openAddModal,

                                text:
                                    "Add Sales Quotation",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={
                    salesQuotations
                }
                loading={loading}
                emptyMessage={`No ${status} sales quotation found`}
                actions={(
                    record: any
                ) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-download-button"
                            type="button"
                            onClick={() =>
                                setDownlaodPDF(
                                    (
                                        prev: any
                                    ) => ({
                                        ...prev,
                                        show:
                                            true,
                                        moduleType:
                                            "salesQuotation",
                                        record,
                                        CustomerCode:
                                            record
                                                ?.sQuoteCustomerCode,
                                        voucherNumber:
                                            record
                                                ?.sQuoteVoucherNumber,
                                    })
                                )
                            }
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download
                                size={16}
                            />
                        </button>

                        <Permission
                            module="bookez"
                            permissionKey="salesQuotation"
                            action="update"
                        >
                            <button
                                id="sales-quotation-edit-button"
                                type="button"
                                onClick={() =>
                                    handleEditSalesQuations(
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
                        </Permission>

                        <Permission
                            module="bookez"
                            permissionKey="salesQuotation"
                            action="delete"
                        >
                            <button
                                id="sales-quotation-delete-button"
                                type="button"
                                disabled={
                                    deleteLoading
                                }
                                onClick={(
                                    event
                                ) =>
                                    handleDeleteSalesQuationsClick(
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
                    message="Are you sure you want to delete this sales quotation?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={
                        handleDeleteConfirm
                    }
                    onCancel={() =>
                        setConfirmTooltip({
                            show:
                                false,
                            x: null,
                            y: null,
                            voucherNumber:
                                null,
                        })
                    }
                />
            )}

            <ListTooltip
                x={tooltip.x}
                y={tooltip.y}
                onClose={() =>
                    setTooltip({
                        x: null,
                        y: null,
                    })
                }
                items={[
                    {
                        label:
                            "Auto Posting",

                        onClick:
                            () =>
                                console.log(
                                    "Duplicate"
                                ),
                    },
                ]}
            />

            <ListingModel
                {...{
                    show:
                        downlaodPDF
                            ?.show,

                    downlaodPDF,

                    entryType:
                        "sales-quotation",

                    setShow: () =>
                        setDownlaodPDF(
                            () => ({
                                show:
                                    !downlaodPDF
                                        ?.show,
                            })
                        ),

                    rowData:
                        downlaodPDF
                            ?.record,

                    report,

                    title:
                        "Download Sales Quotation PDF",

                    cancelText:
                        "Cancel",

                    confirmText:
                        "Confirm",
                }}
            />

            {!fieldsLoading && (
                <DynamicAddForm
                    {...{
                        show: showModal,
                        setShow: setShowModal,
                        edit: Boolean(editingRecord),
                        title: "Sales Quotation",
                        subtitle: "Fill in the sales quotation details below",
                        loading: createLoading || updateLoading,
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

                            setProductSearchValue(
                                ""
                            );

                            resetMainForm();
                        },

                        onSubmit: handleSubmit,
                        form,
                        errors,
                        handleAddRow,
                        handleDeleteRow,
                        handleRowChange,
                        bodyCellExtraRenderer: (column: any, row: any) => renderSalesQuotationCellExtra(column, row, enableServiceProductInventory),
                        footerTotals,

                        inputData: {
                            ...templateFieldsWithCreateActions,

                            footer:
                                dynamicFooterArray,
                        },

                        bodyKey: "products",
                        handleChange: handleMainChange,
                        enableLocation,
                        checkAccount,
                        setCheckAccount,
                        onAccountSaved: handleAccountSaved,
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
                initialProductName={productSearchValue}
            />
        </div>
    );
};

export default SalesQuotations;