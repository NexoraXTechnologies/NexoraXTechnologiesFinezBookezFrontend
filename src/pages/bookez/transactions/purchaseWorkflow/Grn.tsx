import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
    fmtMoney,
    formatDateForInput,
    formatDateForList,
    isTrueValue,
    money,
    num,
    safePercent,
    todayYMD,
} from "../../../../utils/helperFunctions";

import professionalAxios from "../../../../services/professionalAxios";
import { getAllTransactionSchema } from "../../../../redux/slices/professionalSlice/transactionSchema";

import Badge from "../../../../components/badge";
import Toggle from "../../../../components/toggle";
import SearchInput from "../../../../components/searchInput";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
import Modal, { ListingModel } from "../../../../components/modal";

import {
    addGrn,
    deleteGrn,
    getGrnList,
    updateGrn,
} from "../../../../redux/slices/professionalSlice/purchaseWorkflow/grnSlice";

import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../components/buttons";

import { getPurchaseOrderList } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseOrder";
import ModulePageSkeleton, {
    ModalListSkeleton,
} from "../../../../components/skeleton/SkeletonLoader";
import Permission from "../../../../components/PermissionGuard";
import { getAllReportMapping } from "../../../../redux/slices/professionalSlice/reportMappingSlice";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllSystemConfigurations } from "../../../../redux/slices/systemConf";
import ProductMasterModal from "../../master/productMaster/ProductMasterFormModal";
import { getProductBalance, saveInventoryBalance, updateInventoryBalance } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import InputBorderLabel from "../../../../components/common/InputBorderLabel";
import { getCompany } from "../../../../redux/slices/professionalSlice/professionalCompanyMaster.slice";

const VENDOR_FIELD_KEYS = new Set([
    "grnVendorCode",
    "grnVendorName",
]);

const PRODUCT_FIELD_KEYS = new Set([
    "productCode",
    "productName",
    "productId",
    "product",
]);

const normalizeInventoryFieldName = (value: any) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const getInventoryBalanceApiKey = (field: any) => {
    if (!field) return "";

    const fieldNames = [
        field?.key,
        field?.label,
        field?.title,
        field?.customMasterName,
        field?.dataSource?.customMasterName,
    ].map(normalizeInventoryFieldName);

    if (fieldNames.some((name) => name.includes("warehouse"))) return "warehouseCode";
    if (fieldNames.some((name) => name.includes("location"))) return "locationCode";
    if (fieldNames.some((name) => name.includes("batch"))) return "batchNumber";
    if (fieldNames.some((name) => name.includes("bin"))) return "binCode";

    return "";
};

const getInventoryTransactionApiKey = (field: any) => {
    if (!field) return "";

    const fieldNames = [
        field?.key,
        field?.label,
        field?.title,
        field?.customMasterName,
        field?.dataSource?.customMasterName,
    ].map(normalizeInventoryFieldName);

    if (fieldNames.some((name) => name.includes("warehouse"))) return "warehouseCode";
    if (fieldNames.some((name) => name.includes("location"))) return "locationCode";
    if (fieldNames.some((name) => name.includes("batch"))) return "batchNumber";
    if (fieldNames.some((name) => name.includes("rack"))) return "rackCode";
    if (fieldNames.some((name) => name.includes("bin"))) return "binCode";
    if (fieldNames.some((name) => name.includes("manufacturingdate") || name === "mfgon" || name.includes("mfgdate"))) return "mfgOn";
    if (fieldNames.some((name) => name.includes("expirydate") || name.includes("expirationdate") || name === "expon" || name.includes("expdate"))) return "expOn";

    return "";
};

const toInventoryIsoDate = (value: any) => {
    if (!value) return "";

    const stringValue = String(value).trim();
    if (!stringValue) return "";

    const date = /^\d{4}-\d{2}-\d{2}$/.test(stringValue)
        ? new Date(`${stringValue}T00:00:00.000Z`)
        : new Date(stringValue);

    return Number.isNaN(date.getTime()) ? stringValue : date.toISOString();
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

    // PARTIAL GRN
    purchaseOrderPendingQuantity: null,
    purchaseOrderOrderedQuantity: null,

    availableQuantity: null,
    productType: "",
    acceptedQuantity: "",
    rejectedQuantity: "0",
    rejectedReason: "",

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

    customMasters: {},
    _inventoryBalanceSelections: {},
    _inventoryBalanceVoucherId: "",
};

const getDefaultForm = () => ({
    grnVoucherNumber: "AUTO",
    grnVoucherDate: todayYMD(),

    pOrdVoucherNumber: "",

    grnVendorCode: "",
    grnVendorName: "",

    grnStatus: "open",
    grnRemark: "",

    grnStatusRemark: "",
    grnStatusHistory: [],

    isAutoPost: false,

    customMasters: {},

    products: [{ ...emptyProductRow, id: Date.now() }],

    grossAmount: "0.00",
    discountAmount: "0.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    igstAmount: "0.00",
    taxAmount: "0.00",
    otherAmount: "0.00",
    netAmount: "0.00",
});

const rejectedReasonOptions = [
    { label: "Damaged Product", value: "Damaged Product" },
    { label: "Wrong Item Received", value: "Wrong Item Received" },
    { label: "Quality Mismatch", value: "Quality Mismatch" },
    { label: "Poor Quality / Defective", value: "Poor Quality / Defective" },
    { label: "Expired Product", value: "Expired Product" },
    { label: "Packaging Damaged", value: "Packaging Damaged" },
    { label: "Specification Mismatch", value: "Specification Mismatch" },
    { label: "Duplicate Delivery", value: "Duplicate Delivery" },
    { label: "Other", value: "Other" },
];

const getRecords = (res: any) => {
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.records)) return res.records;
    if (Array.isArray(res?.docs)) return res.docs;

    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.data?.records)) return res.data.records;
    if (Array.isArray(res?.data?.docs)) return res.data.docs;
    if (Array.isArray(res?.data)) return res.data;

    if (Array.isArray(res)) return res;

    return [];
};


const getDynamicFieldType = (field: any) =>
    String(
        field?.type ||
        field?.dataSource?.type ||
        ""
    )
        .trim()
        .toLowerCase()
        .replace(/\s/g, "");

const isCustomMasterField = (field: any) => {
    const fieldType = getDynamicFieldType(field);

    return (
        fieldType === "custommaster" ||
        fieldType === "customemaster" ||
        Boolean(field?.customMasterCode)
    );
};

const getCustomMasterName = (field: any) =>
    String(
        field?.customMasterName ||
        field?.dataSource?.customMasterName ||
        field?.label ||
        field?.key ||
        ""
    ).trim();

export const loadFieldOptions = async (fields: any[]) => {
    const updatedFields = await Promise.all(
        (fields || []).map(async (field) => {
            const fieldType = String(
                field?.type || ""
            )
                .trim()
                .toLowerCase();

            const isCustomMaster =
                fieldType === "custommaster";

            /* ==========================================
               CUSTOM MASTER
               Handle separately so moduleCode is sent
               only once.
            ========================================== */

            if (isCustomMaster) {
                const customMasterCode =
                    field?.customMasterCode ||
                    field?.dataSource?.customMasterCode ||
                    "";

                if (!customMasterCode) {
                    return {
                        ...field,
                        options: [],
                    };
                }

                try {
                    const res = await professionalAxios.get(
                        "/eTaxSolnMongoApiBackend/users/customMaster/data/getAll",
                        {
                            params: {
                                moduleCode:
                                    customMasterCode,
                                status:
                                    "active",
                                offset:
                                    0,
                                limit:
                                    500,
                            },
                        }
                    );

                    const records =
                        getRecords(
                            res.data
                        );

                    const options =
                        records.map(
                            (item: any) => ({
                                label:
                                    item?.name ||
                                    item?.masterName ||
                                    item?.description ||
                                    item?.code ||
                                    "",

                                value:
                                    item?.code ||
                                    item?.masterCode ||
                                    item?._id ||
                                    "",

                                raw:
                                    item,
                            })
                        );

                    return {
                        ...field,
                        options,
                    };
                } catch (error) {
                    console.log(
                        `Failed to load Custom Master options for ${field.key}`,
                        error
                    );

                    return {
                        ...field,
                        options: [],
                    };
                }
            }

            /* ==========================================
               EXISTING LOGIC
               DON'T CHANGE FOR OTHER FIELDS
            ========================================== */

            if (!field?.api) {
                return field;
            }

            try {
                const res = await professionalAxios.get(
                    `/eTaxSolnMongoApiBackend${field.api}`,
                    {
                        params:
                            field.queryParams ||
                            {},
                    }
                );

                const records =
                    getRecords(
                        res.data
                    );

                const options =
                    records.map(
                        (item: any) => ({
                            label:
                                item?.[
                                field.labelField
                                ] || "",

                            value:
                                item?.[
                                field.valueField
                                ] || "",

                            raw:
                                item,
                        })
                    );

                return {
                    ...field,
                    options,
                };
            } catch (error) {
                console.log(
                    `Failed to load options for ${field.key}`,
                    error
                );

                return {
                    ...field,
                    options: [],
                };
            }
        })
    );

    return updatedFields;
};

const injectGrnBodyFields = (bodyFields: any[] = []) => {
    const quantityIndex = bodyFields.findIndex(
        (field: any) => field.key === "quantity"
    );

    if (quantityIndex === -1) return bodyFields;

    const alreadyAdded = bodyFields.some(
        (field: any) => field.key === "acceptedQuantity"
    );

    const bodyWithoutQuantity = bodyFields.filter(
        (field: any) => field.key !== "quantity"
    );

    if (alreadyAdded) return bodyWithoutQuantity;

    const extraFields = [
        {
            key: "acceptedQuantity",
            label: "Accepted Quantity",
            type: "number",
            inputType: "number",
            isRequired: true,
            isHidden: false,
        },
        {
            key: "rejectedQuantity",
            label: "Rejected Quantity",
            type: "number",
            inputType: "number",
            isRequired: false,
            isHidden: false,
        },
        {
            key: "rejectedReason",
            label: "Rejected Reason",
            type: "select",
            inputType: "select",
            isRequired: false,
            isHidden: false,
            options: rejectedReasonOptions,
        },
    ];

    const updatedBody = [...bodyWithoutQuantity];

    updatedBody.splice(Math.max(quantityIndex, 0), 0, ...extraFields);

    return updatedBody;
};

const loadAllTemplateOptions = async (templateData: any) => {
    const [updatedHeader, updatedBody, updatedFooter] = await Promise.all([
        loadFieldOptions(templateData?.header || []),
        loadFieldOptions(templateData?.body || []),
        loadFieldOptions(templateData?.footer || []),
    ]);

    return {
        ...templateData,
        header: updatedHeader,
        body: injectGrnBodyFields(updatedBody),
        footer: updatedFooter,
    };
};

const getTaxValue = (primary: any, fallback: any) => {
    if (primary !== undefined && primary !== null && primary !== "") {
        return primary;
    }

    if (fallback !== undefined && fallback !== null) {
        return fallback;
    }

    return "";
};

const removeEmptyValues = (obj: any) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => {
            return value !== "" && value !== null && value !== undefined;
        })
    );
};

const renderGrnCellExtra = (
    column: any,
    row: any,
    enableServiceProductInventory: boolean
) => {
    if (
        !["quantity", "acceptedQuantity"].includes(String(column?.key || "")) ||
        !row?.productCode
    ) {
        return null;
    }

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

const Grn = () => {
    const dispatch = useDispatch<any>();

    const grnState = useSelector((state: any) => state.grn);
    const purchaseOrderState = useSelector((state: any) => state.purchaseOrder);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const grns =
        grnState?.grns ||
        grnState?.grnList ||
        grnState?.grnRecords ||
        grnState?.grnData ||
        [];

    const purchaseOrders =
        purchaseOrderState?.purchaseOrders ||
        purchaseOrderState?.purchaseOrderList ||
        purchaseOrderState?.purchaseOrderRecords ||
        purchaseOrderState?.purchaseOrderData ||
        purchaseOrderState?.purchaseOrdersData ||
        [];

    const purchaseOrderLoading =
        purchaseOrderState?.loading ||
        purchaseOrderState?.listingLoader ||
        purchaseOrderState?.listLoading ||
        false;

    const pagination = grnState?.pagination || defaultPagination;

    const loading = grnState?.loading || grnState?.listingLoader || false;

    const createLoading =
        grnState?.createLoading || grnState?.addLoader || false;

    const updateLoading = grnState?.updateLoading || false;

    const deleteLoading =
        grnState?.deleteLoading || grnState?.deleteLoader || false;

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState("open");

    const [showModal, setShowModal] = useState(false);

    // ★ ADDED: Account Master modal state
    const [checkAccount, setCheckAccount] = useState(false);

    // ⭐ YELLOW STAR: ADDED — PRODUCT MASTER MODAL STATE
    const [checkProduct, setCheckProduct] = useState(false);

    // ⭐ YELLOW STAR: ADDED — REMEMBER PRODUCT ROW THAT OPENED MODAL
    const [
        productTargetRowIndex,
        setProductTargetRowIndex,
    ] = useState<number | null>(null);

    // ⭐ YELLOW STAR: ADDED — SEARCH TEXT FOR PRODUCT MODAL
    const [
        productSearchValue,
        setProductSearchValue,
    ] = useState("");

    // ★ ADDED: Wait until Account Master list API is completed
    const [accountListLoaded, setAccountListLoaded] = useState(false);

    const [editingRecord, setEditingRecord] = useState<any>(false);

    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});

    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const [purchaseOrderSearch, setPurchaseOrderSearch] = useState("");
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);

    const [purchaseOrderModalLoading, setPurchaseOrderModalLoading] =
        useState(false);
    const [purchaseOrderLoaded, setPurchaseOrderLoaded] = useState(false);
    const [downlaodPDF, setDownlaodPDF]: any = useState({ show: false, type: "" });
    const { report } = useSelector((s: any) => s.reportMapping);
    const { configurations } = useSelector((state: any) => state.systemConfiguration);

    const enableServiceProductInventory = useMemo(() => {
        const value = configurations?.[0]?.inventoryConfiguration?.enableServiceProductInventory;
        return value === true || value === "true";
    }, [configurations]);

    const { company } = useSelector((state: any) => state.professionalCompanyMaster);

    // ★ ADDED: Account Master records
    const { accounts = [] } = useSelector(
        (state: any) => state.accountMaster || {}
    );

    // ★ ADDED: Vendor accounts required for GRN
    const filterAccount = useMemo(() => {
        return (accounts || []).filter(
            (account: any) =>
                String(account?.accountType || "").toLowerCase() === "vendor"
        );
    }, [accounts]);

    const [showReturnConfirmModal, setShowReturnConfirmModal] = useState(false);
    const [returnConfirmLoading, setReturnConfirmLoading] = useState(false);
    const [pendingReturnData, setPendingReturnData] = useState<any>(null);

    const [templateFields, setTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    // ⭐ YELLOW STAR: ADDED — VENDOR AND PRODUCT CREATE ACTIONS
    const templateFieldsWithCreateActions = useMemo(() => {
        return {
            ...templateFields,

            header: (templateFields?.header || []).map(
                (field: any) => {
                    const fieldKey = String(
                        field?.key || ""
                    );

                    if (!VENDOR_FIELD_KEYS.has(fieldKey)) {
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
                                ? `+ Add "${searchValue}" as New Vendor`
                                : "+ Add New Vendor",
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
                            if (!String(form?.grnVendorCode || "").trim()) {
                                toast.error("Please select vendor before selecting a product");
                                setErrors((prev: any) => ({
                                    ...prev,
                                    grnVendorCode: "Please select vendor first",
                                }));
                                return;
                            }

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
    }, [templateFields, form?.grnVendorCode]);

    const [fieldsLoading, setFieldsLoading] = useState(false);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
        pOrdVoucherNumber: null,
    });

    const getHeaderFieldByKey = (key: string) => {
        return templateFields?.header?.find((field: any) => field.key === key);
    };

    const getBodyFieldByKey = (key: string) => {
        return templateFields?.body?.find((field: any) => field.key === key);
    };

    const getOptionByValue = (field: any, selectedValue: any) => {
        return field?.options?.find(
            (opt: any) => String(opt.value) === String(selectedValue)
        );
    };

    const isInventoryBalanceField = (field: any) =>
        Boolean(getInventoryBalanceApiKey(field));

    const getInventoryBalanceFilters = (row: any) => {
        const filters: any = {};

        const visibleBodyFields = (templateFields?.body || []).filter(
            (field: any) => !isTrueValue(field?.isHidden)
        );

        const visibleHeaderFields = (templateFields?.header || []).filter(
            (field: any) => !isTrueValue(field?.isHidden)
        );

        const inventoryApiKeys = new Set(
            [
                ...visibleBodyFields,
                ...visibleHeaderFields,
            ]
                .map((field: any) => getInventoryBalanceApiKey(field))
                .filter(Boolean)
        );

        inventoryApiKeys.forEach((apiKey: any) => {
            const bodyField = visibleBodyFields.find(
                (field: any) => getInventoryBalanceApiKey(field) === apiKey
            );

            if (bodyField) {
                const selectedFilters =
                    row?._inventoryBalanceSelections &&
                        typeof row._inventoryBalanceSelections === "object"
                        ? row._inventoryBalanceSelections
                        : {};

                const value =
                    selectedFilters?.[apiKey] ??
                    getInventoryFieldValue(
                        row,
                        visibleBodyFields,
                        apiKey
                    );

                if (
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                ) {
                    filters[apiKey] = value;
                }

                return;
            }

            const headerField = visibleHeaderFields.find(
                (field: any) => getInventoryBalanceApiKey(field) === apiKey
            );

            if (!headerField) return;

            const value = getInventoryFieldValue(
                form,
                visibleHeaderFields,
                apiKey
            );

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                filters[apiKey] = value;
            }
        });

        return filters;
    };


    const getInventoryFieldValue = (source: any, fields: any[], apiKey: string) => {
        const directKeyMap: Record<string, string[]> = {
            warehouseCode: ["warehouseCode", "warehouse"],
            locationCode: ["locationCode", "location"],
            batchNumber: ["batchNumber", "batchNo", "batch"],
            rackCode: ["rackCode", "rack"],
            binCode: ["binCode", "bin"],
            mfgOn: ["mfgOn", "mfgDate", "manufacturingDate", "manufactureDate"],
            expOn: ["expOn", "expDate", "expiryDate", "expirationDate"],
        };

        for (const key of directKeyMap[apiKey] || []) {
            const directValue = source?.[key];

            if (
                directValue !== undefined &&
                directValue !== null &&
                String(directValue).trim() !== ""
            ) {
                return directValue;
            }
        }

        const schemaField = (fields || []).find(
            (field: any) => getInventoryTransactionApiKey(field) === apiKey
        );

        if (!schemaField?.key) return "";

        const masterName = getCustomMasterName(schemaField);

        const selectedMaster =
            source?.customMasters?.[masterName] ||
            source?.customMasters?.[schemaField.key];

        const value =
            selectedMaster?.code ??
            source?.[schemaField.key] ??
            "";

        if (value && typeof value === "object") {
            return value?.code ?? value?.value ?? "";
        }

        return value;
    };

    const getInventoryTransactionValue = (row: any, apiKey: string) => {
        const visibleBodyFields = (templateFields?.body || []).filter(
            (field: any) => !isTrueValue(field?.isHidden)
        );

        const visibleHeaderFields = (templateFields?.header || []).filter(
            (field: any) => !isTrueValue(field?.isHidden)
        );

        const bodyField = visibleBodyFields.find(
            (field: any) => getInventoryTransactionApiKey(field) === apiKey
        );

        if (bodyField) {
            return getInventoryFieldValue(
                row,
                visibleBodyFields,
                apiKey
            );
        }

        const headerField = visibleHeaderFields.find(
            (field: any) => getInventoryTransactionApiKey(field) === apiKey
        );

        if (headerField) {
            return getInventoryFieldValue(
                form,
                visibleHeaderFields,
                apiKey
            );
        }

        return "";
    };

    const getInventoryBalanceVoucherId = (row: any) =>
        String(
            row?._inventoryBalanceVoucherId ||
            row?.inventoryBalanceVoucherId ||
            row?.inventoryBalanceId ||
            row?.inventoryVoucherId ||
            row?.inventoryBalance?.voucherId ||
            ""
        ).trim();

    const getInventoryBalanceRecords = (response: any) => {
        const data =
            response?.data?.data ??
            response?.data ??
            response ??
            {};

        if (Array.isArray(data?.records)) return data.records;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.docs)) return data.docs;
        if (Array.isArray(data)) return data;

        return [];
    };

    const attachInventoryBalanceVoucherIds = (
        rows: any[],
        inventoryRecords: any[]
    ) => {
        const usedVoucherIds = new Set<string>();

        return (rows || []).map((row: any) => {
            const productCode = String(row?.productCode || "").trim();

            const warehouseCode = String(getInventoryFieldValue(row, templateFields?.body || [], "warehouseCode") || "");
            const locationCode = String(getInventoryFieldValue(row, templateFields?.body || [], "locationCode") || "");
            const batchNumber = String(getInventoryFieldValue(row, templateFields?.body || [], "batchNumber") || "");
            const rackCode = String(getInventoryFieldValue(row, templateFields?.body || [], "rackCode") || "");
            const binCode = String(getInventoryFieldValue(row, templateFields?.body || [], "binCode") || "");

            const availableRecords = (inventoryRecords || []).filter((record: any) => {
                const voucherId = String(record?.voucherId || "").trim();

                return (
                    voucherId &&
                    !usedVoucherIds.has(voucherId) &&
                    String(record?.productCode || "").trim() === productCode
                );
            });

            const exactRecord =
                availableRecords.find(
                    (record: any) =>
                        String(record?.warehouseCode || "") === warehouseCode &&
                        String(record?.locationCode || "") === locationCode &&
                        String(record?.batchNumber || "") === batchNumber &&
                        String(record?.rackCode || "") === rackCode &&
                        String(record?.binCode || "") === binCode
                ) ||
                availableRecords[0];

            const voucherId = String(exactRecord?.voucherId || "").trim();

            if (voucherId) usedVoucherIds.add(voucherId);

            return {
                ...row,
                _inventoryBalanceVoucherId: voucherId,
            };
        });
    };

    const buildInventoryBalancePayload = (
        row: any,
        voucherNumber: string
    ) => {
        const inventoryStatus =
            ["close", "closed"].includes(
                String(form?.grnStatus || "").trim().toLowerCase()
            )
                ? "inactive"
                : "active";

        return {
            voucherNumber,
            voucherNumberSnapshot:
                form?.grnVoucherNumber && form.grnVoucherNumber !== "AUTO"
                    ? form.grnVoucherNumber
                    : voucherNumber,
            voucherType: "grn",
            sourceModule: "grn",
            voucherStatus: inventoryStatus,
            voucherDate: toInventoryIsoDate(
                form?.grnVoucherDate || todayYMD()
            ),
            party:
                form?.grnVendorCode ||
                form?.grnVendorName ||
                "vendor",
            productCode: String(row?.productCode || ""),
            productName: String(row?.productName || ""),
            productType: String(row?.productType || ""),
            uom: String(row?.uom || row?.unit || row?.unitName || ""),
            inwardQty: num(
                row?.acceptedQuantity !== undefined &&
                    row?.acceptedQuantity !== null &&
                    row?.acceptedQuantity !== ""
                    ? row.acceptedQuantity
                    : row?.quantity
            ),
            outwardQty: 0,
            reservedQty: num(row?.reservedQty || 0),
            warehouseCode: String(getInventoryTransactionValue(row, "warehouseCode") || ""),
            locationCode: String(getInventoryTransactionValue(row, "locationCode") || ""),
            batchNumber: String(getInventoryTransactionValue(row, "batchNumber") || ""),
            rackCode: String(getInventoryTransactionValue(row, "rackCode") || ""),
            binCode: String(getInventoryTransactionValue(row, "binCode") || ""),
            mfgOn: toInventoryIsoDate(getInventoryTransactionValue(row, "mfgOn")),
            expOn: toInventoryIsoDate(getInventoryTransactionValue(row, "expOn")),
            remarks:
                row?.remarks ||
                form?.grnRemark ||
                "GRN",
            status: inventoryStatus,
        };
    };

    const syncInventoryBalance = async (
        voucherNumber: string,
        isEdit: boolean
    ) => {
        // const rows = (form?.products || []).filter(
        //     (row: any) =>
        //         String(row?.productCode || "").trim() !== "" &&
        //         num(
        //             row?.acceptedQuantity !== undefined &&
        //                 row?.acceptedQuantity !== null &&
        //                 row?.acceptedQuantity !== ""
        //                 ? row.acceptedQuantity
        //                 : row?.quantity
        //         ) > 0
        // );

        const rows = (form?.products || []).filter((row: any) => {
            const productType = String(row?.productType || "").trim().toLowerCase();

            if (productType === "nonstocks") return false;

            if (
                productType === "serviceproduct" &&
                !enableServiceProductInventory
            ) {
                return false;
            }

            return (
                String(row?.productCode || "").trim() !== "" &&
                num(
                    row?.acceptedQuantity !== undefined &&
                        row?.acceptedQuantity !== null &&
                        row?.acceptedQuantity !== ""
                        ? row.acceptedQuantity
                        : row?.quantity
                ) > 0
            );
        });

        for (const row of rows) {
            const inventoryPayload = buildInventoryBalancePayload(
                row,
                voucherNumber
            );

            if (!isEdit) {
                await dispatch(
                    saveInventoryBalance(inventoryPayload) as any
                ).unwrap();
                continue;
            }

            const inventoryBalanceVoucherId =
                getInventoryBalanceVoucherId(row);

            if (inventoryBalanceVoucherId) {
                await dispatch(
                    updateInventoryBalance({
                        id: inventoryBalanceVoucherId,
                        payload: inventoryPayload,
                    }) as any
                ).unwrap();
            } else {
                await dispatch(
                    saveInventoryBalance(inventoryPayload) as any
                ).unwrap();
            }
        }
    };

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

        if (!rowProductValues.length) return null;

        const productFields = (templateFields?.body || []).filter(
            (field: any) =>
                ["productCode", "productId", "productName", "product"].includes(
                    String(field?.key || "")
                )
        );

        for (const field of productFields) {
            const selectedOption = (field?.options || []).find(
                (option: any) => {
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
                }
            );

            if (selectedOption?.raw) return selectedOption.raw;
        }

        return null;
    };

    const getStateCode = (stateValue: any) => {
        if (!stateValue) return "";

        if (typeof stateValue === "string") {
            return stateValue.trim();
        }

        return String(
            stateValue?.isoCode ||
            stateValue?.stateCode ||
            stateValue?.code ||
            stateValue?.value ||
            ""
        ).trim();
    };

    const applyGrnTaxRule = (
        row: any,
        vendorCode: string,
        productSource?: any
    ) => {
        const selectedVendor = filterAccount?.find(
            (account: any) =>
                String(account?.accountCode || "") ===
                String(vendorCode || "")
        );

        const companyStateCode = getStateCode(
            company?.state ||
            company?.companyState ||
            company?.stateCode
        );

        const vendorStateCode = getStateCode(
            selectedVendor?.state ||
            selectedVendor?.vendorState ||
            selectedVendor?.stateCode
        );

        if (!companyStateCode || !vendorStateCode) {
            return row;
        }

        const product =
            productSource ||
            getProductMasterFromRow(row) ||
            {};

        const cgstValue =
            product?.csgst ??
            product?.CGST ??
            product?.cgstPercentage ??
            product?.cgst ??
            product?.cgstRate ??
            product?.tax?.cgstPercentage ??
            product?.tax?.cgst ??
            row?.cgst ??
            row?.cgstPercentage ??
            "";

        const sgstValue =
            product?.csgst ??
            product?.SGST ??
            product?.sgstPercentage ??
            product?.sgst ??
            product?.sgstRate ??
            product?.tax?.sgstPercentage ??
            product?.tax?.sgst ??
            row?.sgst ??
            row?.sgstPercentage ??
            "";

        const igstValue =
            product?.igst ??
            product?.IGST ??
            product?.igstPercentage ??
            product?.igstRate ??
            product?.tax?.igstPercentage ??
            product?.tax?.igst ??
            row?.igst ??
            row?.igstPercentage ??
            "";

        if (companyStateCode === vendorStateCode) {
            return {
                ...row,
                cgst: cgstValue,
                cgstPercentage: cgstValue,
                sgst: sgstValue,
                sgstPercentage: sgstValue,
                igst: "",
                igstPercentage: "",
                igstAmount: 0,
            };
        }

        return {
            ...row,
            cgst: "",
            cgstPercentage: "",
            sgst: "",
            sgstPercentage: "",
            cgstAmount: 0,
            sgstAmount: 0,
            igst: igstValue,
            igstPercentage: igstValue,
        };
    };

    const getCustomMasterSelection = (
        field: any,
        selectedValue: any,
        existingValue?: any
    ) => {
        if (
            selectedValue === undefined ||
            selectedValue === null ||
            String(selectedValue).trim() === ""
        ) {
            if (
                existingValue &&
                typeof existingValue === "object" &&
                existingValue?.code
            ) {
                return {
                    code: String(existingValue.code || ""),
                    name: String(existingValue.name || ""),
                };
            }

            return null;
        }

        const selectedOption = getOptionByValue(
            field,
            selectedValue
        );

        const raw =
            selectedOption?.raw || {};

        const nestedData =
            raw?.data && typeof raw.data === "object"
                ? raw.data
                : raw?.dynamicFields &&
                    typeof raw.dynamicFields === "object"
                    ? raw.dynamicFields
                    : raw?.customFields &&
                        typeof raw.customFields === "object"
                        ? raw.customFields
                        : {};

        return {
            code: String(
                selectedOption?.value ||
                raw?.code ||
                nestedData?.code ||
                selectedValue ||
                ""
            ),
            name: String(
                selectedOption?.label ||
                raw?.name ||
                nestedData?.name ||
                existingValue?.name ||
                ""
            ),
        };
    };

    const buildCustomMastersPayload = (
        fields: any[],
        source: any,
        existingCustomMasters: any = {}
    ) => {
        const customMasters: any = {};

        (fields || []).forEach(
            (field: any) => {
                if (
                    !isCustomMasterField(
                        field
                    ) ||
                    isTrueValue(
                        field?.isHidden
                    )
                ) {
                    return;
                }

                const customMasterName =
                    getCustomMasterName(
                        field
                    );

                if (!customMasterName) {
                    return;
                }

                const existingValue =
                    existingCustomMasters?.[
                    customMasterName
                    ] ||
                    existingCustomMasters?.[
                    field?.key
                    ];

                const selectedValue =
                    source?.[
                    field?.key
                    ] ??
                    existingValue?.code ??
                    "";

                const selectedMaster =
                    getCustomMasterSelection(
                        field,
                        selectedValue,
                        existingValue
                    );

                if (
                    !selectedMaster?.code
                ) {
                    return;
                }

                customMasters[
                    customMasterName
                ] = {
                    code:
                        selectedMaster.code,
                    name:
                        selectedMaster.name,
                };
            }
        );

        return customMasters;
    };

    const getCustomMasterFieldValues = (
        fields: any[],
        customMasters: any
    ) => {
        const values: any = {};

        (fields || []).forEach(
            (field: any) => {
                if (
                    !isCustomMasterField(
                        field
                    )
                ) {
                    return;
                }

                const customMasterName =
                    getCustomMasterName(
                        field
                    );

                const selectedMaster =
                    customMasters?.[
                    customMasterName
                    ] ||
                    customMasters?.[
                    field?.key
                    ];

                if (
                    selectedMaster?.code
                ) {
                    values[
                        field.key
                    ] =
                        selectedMaster.code;
                }
            }
        );

        return values;
    };

    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
        if (!field) return oldData;

        const selectedOption = getOptionByValue(field, selectedValue);

        const updated = {
            ...oldData,
            [field.key]: selectedValue,
        };

        if (field?.mapFields && selectedOption?.raw) {
            Object.entries(field.mapFields).forEach(
                ([targetKey, sourceKey]) => {
                    updated[targetKey] =
                        selectedOption.raw?.[sourceKey as string] ?? "";
                }
            );
        }

        return updated;
    };

    const getUnitLabelFromSchema = (unitCode: string) => {
        const unitField = templateFields?.body?.find(
            (field: any) => field.key === "uom" || field.key === "unit"
        );

        const selectedUnit = unitField?.options?.find(
            (item: any) => String(item.value) === String(unitCode)
        );

        return selectedUnit?.label || unitCode || "";
    };

    const normalizeRowKeys = (row: any) => {
        const updated = { ...row };

        if (updated.uom && !updated.unit) updated.unit = updated.uom;
        if (updated.unit && !updated.uom) updated.uom = updated.unit;

        if (updated.productDescription && !updated.description) {
            updated.description = updated.productDescription;
        }

        if (updated.description && !updated.productDescription) {
            updated.productDescription = updated.description;
        }

        if (updated.netAmount && !updated.netTotal) {
            updated.netTotal = updated.netAmount;
        }

        if (updated.netTotal && !updated.netAmount) {
            updated.netAmount = updated.netTotal;
        }

        if (updated.gross && !updated.grossAmount) {
            updated.grossAmount = updated.gross;
        }

        if (updated.grossAmount && !updated.gross) {
            updated.gross = updated.grossAmount;
        }

        updated.unitName = getUnitLabelFromSchema(updated.unit || updated.uom);

        return updated;
    };

    // const getFinalQuantity = (row: any) => {
    //     const originalQuantity = num(row.quantity);
    //     const acceptedQuantity = num(row.acceptedQuantity);
    //     const rejectedQuantity = num(row.rejectedQuantity);

    //     return originalQuantity > 0
    //         ? originalQuantity
    //         : acceptedQuantity + rejectedQuantity;
    // };

    const getFinalQuantity = (row: any) => {
        return num(row.acceptedQuantity);
    };

    const hasValue = (value: any) =>
        value !== undefined && value !== null && value !== "";

    const fillProductDetailsFromSelectedOption = (
        row: any,
        selectedOption: any
    ) => {
        const product = selectedOption?.raw;
        if (!product) return row;

        const unitCode = product?.unit || row.unit || row.uom || "";
        const csgst = hasValue(product?.csgst) ? String(product.csgst) : "";
        const igst = hasValue(product?.igst) ? String(product.igst) : "";

        return {
            ...row,

            productId: product?._id || row.productId || "",
            productCode: product?.productCode || row.productCode || "",
            productName: product?.productName || row.productName || "",

            productType:
                product?.productType ||
                product?.dynamicFields?.productType ||
                row.productType ||
                "",

            availableQuantity: null,

            productDescription:
                product?.productDescription || row.productDescription || "",

            description:
                product?.productDescription || row.description || "",

            productHSNCode:
                product?.productHSNCode || row.productHSNCode || "",

            unit: unitCode,
            uom: unitCode,
            unitName: getUnitLabelFromSchema(unitCode),

            // GRN is purchase side, so use purchasePrice
            rate: hasValue(product?.purchasePrice)
                ? String(product.purchasePrice)
                : row.rate || "",

            // product master key is csgst, row key is cgst
            cgst: csgst || row.cgst || "",
            cgstPercentage: csgst || row.cgstPercentage || "",

            igst: igst || row.igst || "",
            igstPercentage: igst || row.igstPercentage || "",
        };
    };

    const calculateRow = (row: any) => {
        const finalQuantity = getFinalQuantity(row);
        const rate = num(row.rate);

        const gross = finalQuantity * rate;

        const discountPercent = safePercent(
            row.discount !== undefined && row.discount !== null && row.discount !== ""
                ? row.discount
                : row.discountPercentage
        );

        const cgstPercent = safePercent(
            row.cgst !== undefined && row.cgst !== null && row.cgst !== ""
                ? row.cgst
                : row.cgstPercentage
        );

        const sgstPercent = safePercent(
            row.sgst !== undefined && row.sgst !== null && row.sgst !== ""
                ? row.sgst
                : row.sgstPercentage
        );

        const igstPercent = safePercent(
            row.igst !== undefined && row.igst !== null && row.igst !== ""
                ? row.igst
                : row.igstPercentage
        );

        const discountAmount = (gross * discountPercent) / 100;
        const taxableAmount = gross - discountAmount;

        const cgstAmount = (taxableAmount * cgstPercent) / 100;
        const sgstAmount = (taxableAmount * sgstPercent) / 100;
        const igstAmount = (taxableAmount * igstPercent) / 100;

        const otherAmount = num(row.otherAmount);
        const taxAmount = cgstAmount + sgstAmount + igstAmount;
        const netAmount = taxableAmount + taxAmount + otherAmount;

        return {
            ...row,

            // quantity: finalQuantity ? String(finalQuantity) : row.quantity,/
            quantity: row.quantity,
            rate: row.rate,

            acceptedQuantity:
                row.acceptedQuantity !== undefined &&
                    row.acceptedQuantity !== null &&
                    row.acceptedQuantity !== ""
                    ? row.acceptedQuantity
                    : row.quantity || "",

            rejectedQuantity:
                row.rejectedQuantity !== undefined &&
                    row.rejectedQuantity !== null &&
                    row.rejectedQuantity !== ""
                    ? row.rejectedQuantity
                    : "",

            rejectedReason: row.rejectedReason || "",

            discount: row.discount,
            discountPercentage: row.discountPercentage,

            cgst: row.cgst,
            cgstPercentage: row.cgstPercentage,

            sgst: row.sgst,
            sgstPercentage: row.sgstPercentage,

            igst: row.igst,
            igstPercentage: row.igstPercentage,

            otherAmount: row.otherAmount,

            gross,
            grossAmount: gross,

            discountAmount,
            taxableAmount,

            cgstAmount,
            sgstAmount,
            igstAmount,

            taxAmount,

            netAmount,
            netTotal: netAmount,

            unit: row.unit || row.uom || "",
            uom: row.uom || row.unit || "",

            description: row.description || row.productDescription || "",
            productDescription: row.productDescription || row.description || "",
        };
    };

    const calculateFooter = (products: any[]) => {
        return (products || []).reduce(
            (acc: any, item: any) => {
                acc.totalQuantity += getFinalQuantity(item);

                acc.totalGrossAmount += num(item.grossAmount || item.gross);
                acc.totalDiscountAmount += num(item.discountAmount);

                acc.totalCgstAmount += num(item.cgstAmount);
                acc.totalSgstAmount += num(item.sgstAmount);
                acc.totalIgstAmount += num(item.igstAmount);

                acc.totalTaxAmount += num(item.taxAmount);
                acc.totalOtherAmount += num(item.otherAmount);

                acc.totalNetAmount += num(item.netAmount || item.netTotal);

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

    const footerTotals = useMemo(() => {
        return calculateFooter(form.products || []);
    }, [form.products]);

    const footerValues = useMemo(() => {
        return {
            grossAmount: footerTotals.totalGrossAmount,
            discountAmount: footerTotals.totalDiscountAmount,
            cgstAmount: footerTotals.totalCgstAmount,
            sgstAmount: footerTotals.totalSgstAmount,
            igstAmount: footerTotals.totalIgstAmount,
            netAmount: footerTotals.totalNetAmount,
            adjustedAmount: 0,
            balanceAmount: footerTotals.totalNetAmount,
        };
    }, [footerTotals]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => {
                const rawValue =
                    footerValues[field.key as keyof typeof footerValues] ?? 0;

                return {
                    ...field,
                    value: money(rawValue),
                    rawValue,
                };
            });
    }, [templateFields?.footer, footerValues]);

    const fetchGrns = async () => {
        await dispatch(
            getGrnList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status,
            }) as any
        );
    };

    const fetchPurchaseOrders = async (searchText = "") => {
        setPurchaseOrderModalLoading(true);

        try {
            await dispatch(
                getPurchaseOrderList({
                    offset: 0,
                    limit: 20,
                    search: searchText,
                    status: "open",
                }) as any
            ).unwrap();

            setPurchaseOrderLoaded(true);
        } catch (error) {
            setPurchaseOrderLoaded(true);
            toast.error("Failed to load purchase orders");
        } finally {
            setPurchaseOrderModalLoading(false);
        }
    };

    // PARTIAL GRN
    const getPurchaseOrderGrnSummary = async (purchaseOrder: any) => {
        const pOrdVoucherNumber = String(
            purchaseOrder?.pOrdVoucherNumber || ""
        ).trim();

        const poBody = Array.isArray(
            purchaseOrder?.pOrdBody
        )
            ? purchaseOrder.pOrdBody
            : [];

        if (!pOrdVoucherNumber) {
            return {
                purchaseOrder: {
                    totalOrderedQty: 0,
                    products: [],
                },

                grn: {
                    totalGrnQty: 0,
                    products: [],
                },

                pending: {
                    totalPendingQty: 0,
                    products: [],
                },
            };
        }

        const response = await professionalAxios.get(
            "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/getAll",
            {
                params: {
                    offset: 0,
                    limit: 100000,
                    status: "",
                    search: "",
                },
            }
        );

        const allGrns = getRecords(
            response?.data
        );

        const linkedGrns = (allGrns || []).filter(
            (grn: any) =>
                String(
                    grn?.pOrdVoucherNumber || ""
                ).trim() === pOrdVoucherNumber
        );

        const orderedQtyMap =
            new Map<string, number>();

        const grnQtyMap =
            new Map<string, number>();

        poBody.forEach((item: any) => {
            const productCode = String(
                item?.productCode || ""
            ).trim();

            if (!productCode) return;

            orderedQtyMap.set(
                productCode,
                num(
                    orderedQtyMap.get(
                        productCode
                    )
                ) +
                num(
                    item?.quantity
                )
            );
        });

        linkedGrns.forEach((grn: any) => {
            (grn?.grnBody || []).forEach(
                (item: any) => {
                    const productCode = String(
                        item?.productCode || ""
                    ).trim();

                    if (!productCode) return;

                    const grnQuantity =
                        item?.quantity !== undefined &&
                            item?.quantity !== null &&
                            item?.quantity !== ""
                            ? num(
                                item?.quantity
                            )
                            : num(
                                item?.acceptedQuantity
                            ) +
                            num(
                                item?.rejectedQuantity
                            );

                    grnQtyMap.set(
                        productCode,
                        num(
                            grnQtyMap.get(
                                productCode
                            )
                        ) +
                        grnQuantity
                    );
                }
            );
        });

        const purchaseOrderProducts: any[] = [];
        const grnProducts: any[] = [];
        const pendingProducts: any[] = [];

        let totalOrderedQty = 0;
        let totalGrnQty = 0;
        let totalPendingQty = 0;

        orderedQtyMap.forEach(
            (
                orderedQty,
                productCode
            ) => {
                const grnQty =
                    num(
                        grnQtyMap.get(
                            productCode
                        )
                    );

                const pendingQty =
                    Math.max(
                        orderedQty -
                        grnQty,
                        0
                    );

                purchaseOrderProducts.push({
                    productCode,
                    orderedQty,
                });

                grnProducts.push({
                    productCode,
                    grnQty,
                });

                pendingProducts.push({
                    productCode,
                    pendingQty,
                });

                totalOrderedQty +=
                    orderedQty;

                totalGrnQty +=
                    grnQty;

                totalPendingQty +=
                    pendingQty;
            }
        );

        return {
            purchaseOrder: {
                pOrdVoucherNumber,
                totalOrderedQty,
                products:
                    purchaseOrderProducts,
            },

            grn: {
                totalGrnQty,
                products:
                    grnProducts,
            },

            pending: {
                totalPendingQty,
                products:
                    pendingProducts,
            },
        };
    };

    const syncPurchaseOrderStatusAfterGrn = async (pOrdVoucherNumber: string) => {
        if (!pOrdVoucherNumber) return "";

        try {
            const summaryRes = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/analysis/grn/byPurchaseOrderVoucherNumber/${pOrdVoucherNumber}`
            );

            const summary =
                summaryRes?.data?.data?.summary ||
                summaryRes?.data?.summary ||
                {};

            const pendingRaw = summary?.totalPendingGrnQuantity;

            if (
                pendingRaw === undefined ||
                pendingRaw === null ||
                pendingRaw === ""
            ) {
                console.log(
                    "GRN analysis summary missing totalPendingGrnQuantity",
                    summaryRes?.data
                );
                return "";
            }

            const nextPoStatus = num(pendingRaw) === 0 ? "close" : "open";

            await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseOrder/update/${pOrdVoucherNumber}`,
                {
                    pOrdStatus: nextPoStatus,
                }
            );

            return nextPoStatus;
        } catch (error) {
            console.error("Failed to sync Purchase Order status after GRN", error);
            // toast.error("GRN saved but failed to update purchase order status");
            return "";
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

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchGrns();
            toast.success("GRN list refreshed");
        } finally {
            setRefreshing(false);
        }
    };

    const openAddModal = async () => {
        resetMainForm();
        setSelectedPurchaseOrder(null);
        setPurchaseOrderSearch("");
        setPurchaseOrderLoaded(false);
        setShowPurchaseOrderModal(true);

        await fetchPurchaseOrders("");
    };

    const handlePurchaseOrderSelect = (purchaseOrder: any) => {
        setSelectedPurchaseOrder(purchaseOrder);
    };

    const buildGrnProductRow = (item: any, vendorCode = "") => {
        const unitCode = item?.unit || item?.uom || "";

        const customMasterValues =
            getCustomMasterFieldValues(
                templateFields?.body || [],
                item?.customMasters || {}
            );

        const normalizedRow = normalizeRowKeys({
            id: item?.id || Date.now() + Math.random(),

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productId: item?.productId || "",

            productDescription:
                item?.productDescription || item?.description || "",

            description:
                item?.description || item?.productDescription || "",

            productHSNCode: item?.productHSNCode || "",
            remarks: item?.remarks || "",

            quantity: item?.quantity || "",

            // PARTIAL GRN
            purchaseOrderPendingQuantity:
                item?.purchaseOrderPendingQuantity !== undefined &&
                    item?.purchaseOrderPendingQuantity !== null
                    ? item.purchaseOrderPendingQuantity
                    : null,

            purchaseOrderOrderedQuantity:
                item?.purchaseOrderOrderedQuantity !== undefined &&
                    item?.purchaseOrderOrderedQuantity !== null
                    ? item.purchaseOrderOrderedQuantity
                    : null,

            availableQuantity: null,

            productType:
                item?.productType ||
                getProductMasterFromRow(item)?.productType ||
                getProductMasterFromRow(item)?.dynamicFields?.productType ||
                "",

            acceptedQuantity:
                item?.acceptedQuantity !== undefined &&
                    item?.acceptedQuantity !== null &&
                    item?.acceptedQuantity !== ""
                    ? item.acceptedQuantity
                    : item?.quantity || "",

            rejectedQuantity:
                item?.rejectedQuantity !== undefined &&
                    item?.rejectedQuantity !== null &&
                    item?.rejectedQuantity !== ""
                    ? item.rejectedQuantity
                    : " ",

            rejectedReason: item?.rejectedReason || "",

            unit: unitCode,
            uom: unitCode,
            unitName: item?.unitName || getUnitLabelFromSchema(unitCode),

            rate: item?.rate || "",

            gross: item?.gross || item?.grossAmount || 0,
            grossAmount: item?.grossAmount || item?.gross || 0,

            discount: item?.discount || item?.discountPercentage || "",
            discountPercentage:
                item?.discountPercentage || item?.discount || "",
            discountAmount: item?.discountAmount || 0,

            taxableAmount: item?.taxableAmount || 0,

            cgst: item?.cgst || item?.cgstPercentage || "",
            cgstPercentage: item?.cgstPercentage || item?.cgst || "",
            cgstAmount: item?.cgstAmount || 0,

            sgst: item?.sgst || item?.sgstPercentage || "",
            sgstPercentage: item?.sgstPercentage || item?.sgst || "",
            sgstAmount: item?.sgstAmount || 0,

            igst: item?.igst || item?.igstPercentage || "",
            igstPercentage: item?.igstPercentage || item?.igst || "",
            igstAmount: item?.igstAmount || 0,

            taxAmount: item?.taxAmount || 0,
            otherAmount: item?.otherAmount || 0,

            netAmount: item?.netAmount || item?.netTotal || 0,
            netTotal: item?.netTotal || item?.netAmount || 0,

            customMasters:
                item?.customMasters &&
                    typeof item.customMasters === "object"
                    ? {
                        ...item.customMasters,
                    }
                    : {},

            _inventoryBalanceSelections: {},
            _inventoryBalanceVoucherId:
                item?._inventoryBalanceVoucherId ||
                item?.inventoryBalanceVoucherId ||
                item?.inventoryBalanceId ||
                "",

            ...customMasterValues,
        });

        return calculateRow(
            applyGrnTaxRule(
                normalizedRow,
                vendorCode
            )
        );
    };

    const handlePurchaseOrderModalClose = () => {
        setShowPurchaseOrderModal(false);
        setSelectedPurchaseOrder(null);
        setPurchaseOrderSearch("");
        setPurchaseOrderLoaded(false);
        setPurchaseOrderModalLoading(false);

        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
        setShowModal(true);
    };

    // PARTIAL GRN
    const handlePurchaseOrderConfirm = async () => {
        if (!selectedPurchaseOrder) {
            toast.error("Please select purchase order");
            return;
        }

        try {
            setPurchaseOrderModalLoading(true);

            const summary =
                await getPurchaseOrderGrnSummary(
                    selectedPurchaseOrder
                );

            const pendingProducts =
                Array.isArray(
                    summary?.pending?.products
                )
                    ? summary.pending.products
                    : [];

            const pendingQtyByProduct =
                new Map<string, number>();

            pendingProducts.forEach(
                (item: any) => {
                    const productCode =
                        String(
                            item?.productCode ||
                            ""
                        ).trim();

                    if (!productCode) {
                        return;
                    }

                    pendingQtyByProduct.set(
                        productCode,
                        num(
                            item?.pendingQty
                        )
                    );
                }
            );

            const poBody =
                selectedPurchaseOrder
                    ?.pOrdBody ||
                [];

            const products =
                poBody.length > 0
                    ? poBody
                        .map(
                            (item: any) => {
                                const productCode =
                                    String(
                                        item?.productCode ||
                                        ""
                                    ).trim();

                                const orderedQuantity =
                                    num(
                                        item?.quantity
                                    );

                                const currentPendingQuantity =
                                    pendingQtyByProduct.has(
                                        productCode
                                    )
                                        ? num(
                                            pendingQtyByProduct.get(
                                                productCode
                                            )
                                        )
                                        : 0;

                                const rowPendingQuantity =
                                    Math.min(
                                        Math.max(
                                            orderedQuantity,
                                            0
                                        ),
                                        Math.max(
                                            currentPendingQuantity,
                                            0
                                        )
                                    );

                                if (
                                    productCode
                                ) {
                                    pendingQtyByProduct.set(
                                        productCode,
                                        Math.max(
                                            currentPendingQuantity -
                                            rowPendingQuantity,
                                            0
                                        )
                                    );
                                }

                                return buildGrnProductRow(
                                    {
                                        ...item,

                                        quantity:
                                            String(
                                                rowPendingQuantity
                                            ),

                                        acceptedQuantity:
                                            String(
                                                rowPendingQuantity
                                            ),

                                        rejectedQuantity:
                                            "0",

                                        rejectedReason:
                                            "",

                                        purchaseOrderPendingQuantity:
                                            rowPendingQuantity,

                                        purchaseOrderOrderedQuantity:
                                            orderedQuantity,
                                    },

                                    selectedPurchaseOrder
                                        ?.pOrdVendorCode ||
                                    ""
                                );
                            }
                        )
                        .filter(
                            (item: any) =>
                                !item?.productCode ||
                                num(
                                    item
                                        ?.purchaseOrderPendingQuantity
                                ) > 0
                        )
                    : [
                        {
                            ...emptyProductRow,
                            id: Date.now(),
                        },
                    ];

            if (
                poBody.length > 0 &&
                products.length === 0
            ) {
                await syncPurchaseOrderStatusAfterGrn(
                    selectedPurchaseOrder
                        ?.pOrdVoucherNumber
                );

                toast.info(
                    "This Purchase Order is already fully received in GRN"
                );

                setShowPurchaseOrderModal(
                    false
                );

                setSelectedPurchaseOrder(
                    null
                );

                setPurchaseOrderLoaded(
                    false
                );

                return;
            }

            setForm({
                ...getDefaultForm(),

                pOrdVoucherNumber:
                    selectedPurchaseOrder
                        ?.pOrdVoucherNumber ||
                    "",

                grnVendorCode:
                    selectedPurchaseOrder
                        ?.pOrdVendorCode ||
                    "",

                grnVendorName:
                    selectedPurchaseOrder
                        ?.pOrdVendorName ||
                    "",

                customMasters:
                    selectedPurchaseOrder
                        ?.customMasters &&
                        typeof selectedPurchaseOrder.customMasters ===
                        "object"
                        ? {
                            ...selectedPurchaseOrder.customMasters,
                        }
                        : {},

                ...getCustomMasterFieldValues(
                    templateFields?.header ||
                    [],

                    selectedPurchaseOrder
                        ?.customMasters ||
                    {}
                ),

                products,
            });

            setErrors({});
            setEditingRecord(null);

            setShowPurchaseOrderModal(
                false
            );

            setPurchaseOrderLoaded(
                false
            );

            setShowModal(
                true
            );
        } catch (error: any) {
            console.log(
                "Failed to load pending Purchase Order GRN quantity",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load pending Purchase Order quantity"
            );
        } finally {
            setPurchaseOrderModalLoading(
                false
            );
        }
    };

    const openEditModal = async (record: any) => {
        const footer = record?.grnFooter || {};

        const products =
            record?.grnBody?.length > 0
                ? record.grnBody.map((item: any) =>
                    buildGrnProductRow(
                        item,
                        record?.grnVendorCode || ""
                    )
                )
                : [{ ...emptyProductRow, id: Date.now() }];

        let inventoryRecords: any[] = [];

        try {
            const inventoryResponse = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/inventoryBalance/getAll",
                {
                    params: {
                        offset: 0,
                        limit: 500,
                        voucherNumber: record?.grnVoucherNumber || "",
                    },
                }
            );

            inventoryRecords = getInventoryBalanceRecords(inventoryResponse);
        } catch (error) {
            console.log("Failed to load GRN inventory balance records", error);
        }

        const productsWithInventoryIds =
            attachInventoryBalanceVoucherIds(
                products,
                inventoryRecords
            );

        setEditingRecord(true);
        setErrors({});

        setForm({
            grnVoucherNumber: record?.grnVoucherNumber || "AUTO",
            grnVoucherDate: formatDateForInput(record?.grnVoucherDate),
            pOrdVoucherNumber: record?.pOrdVoucherNumber || "",
            grnVendorCode: record?.grnVendorCode || "",
            grnVendorName: record?.grnVendorName || "",
            grnStatus: record?.grnStatus || "open",
            grnRemark: record?.grnRemark || "",
            grnStatusRemark: record?.grnStatusRemark || "",
            grnStatusHistory: record?.grnStatusHistory || [],
            isAutoPost: record?.isAutoPost || false,
            customMasters:
                record?.customMasters &&
                    typeof record.customMasters === "object"
                    ? { ...record.customMasters }
                    : {},
            ...getCustomMasterFieldValues(
                templateFields?.header || [],
                record?.customMasters || {}
            ),
            products: productsWithInventoryIds,
            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            taxAmount: footer?.taxAmount || footer?.totalTaxAmount || "0.00",
            otherAmount: footer?.otherAmount || footer?.totalOtherAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
        });

        setShowModal(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const currentField = getHeaderFieldByKey(key);

            let updated = {
                ...prev,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updated = applyMappedFields(
                    currentField,
                    value,
                    updated
                );
            }

            if (
                isCustomMasterField(
                    currentField
                )
            ) {
                updated.customMasters =
                    buildCustomMastersPayload(
                        templateFields?.header || [],
                        updated,
                        prev?.customMasters || {}
                    );
            }

            return updated;
        });

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    // ★ ADDED: Refresh vendor dropdown after Account Master save
    const handleAccountSaved = async (savedResponse: any) => {
        try {
            const accountResponse = await dispatch(
                getAllAccounts({
                    offset: 0,
                    limit: 100,
                    search: "",
                }) as any
            ).unwrap();

            setAccountListLoaded(true);

            // ★ REFRESH GRN REPORT MAPPING
            await dispatch(
                getAllReportMapping({
                    moduleType: "grn",
                }) as any
            );

            // ★ RELOAD DYNAMIC FIELD OPTIONS
            if (transactionsSchema) {
                const updatedData = await loadAllTemplateOptions(
                    transactionsSchema
                );

                setTemplateFields(updatedData);
            }

            const savedAccount =
                savedResponse?.data?.account ||
                savedResponse?.data?.data ||
                savedResponse?.data ||
                savedResponse?.account ||
                savedResponse;

            const refreshedAccounts =
                accountResponse?.data?.accounts ||
                accountResponse?.data?.data?.accounts ||
                accountResponse?.accounts ||
                accountResponse?.data?.items ||
                accountResponse?.items ||
                accountResponse?.data ||
                [];

            const vendorAccounts = Array.isArray(refreshedAccounts)
                ? refreshedAccounts.filter(
                    (account: any) =>
                        String(account?.accountType || "").toLowerCase() ===
                        "vendor"
                )
                : [];

            const savedCode = savedAccount?.accountCode || "";
            const savedName = savedAccount?.accountName || "";

            const createdVendor =
                vendorAccounts.find(
                    (account: any) =>
                        (savedCode &&
                            String(account?.accountCode) ===
                            String(savedCode)) ||
                        (savedName &&
                            String(account?.accountName) ===
                            String(savedName))
                ) ||
                (savedCode || savedName ? savedAccount : null) ||
                vendorAccounts[vendorAccounts.length - 1] ||
                null;

            if (createdVendor) {
                setForm((prev: any) => ({
                    ...prev,

                    grnVendorCode:
                        createdVendor?.accountCode ||
                        prev?.grnVendorCode ||
                        "",

                    grnVendorName:
                        createdVendor?.accountName ||
                        prev?.grnVendorName ||
                        "",
                }));

                setErrors((prev: any) => ({
                    ...prev,
                    grnVendorCode: "",
                    grnVendorName: "",
                }));
            }
        } catch (error: any) {
            console.log(
                "Failed to refresh GRN vendor options:",
                error
            );

            toast.error(
                error?.message ||
                "Account created, but GRN vendor dropdown refresh failed"
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
                    moduleType: "grn",
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

            setForm((prev: any) => {
                const updatedProducts = [
                    ...(prev.products || []),
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

                    updatedRow =
                        fillProductDetailsFromSelectedOption(
                            updatedRow,
                            selectedOption
                        );
                }

                const unitCode =
                    createdProduct?.unit ||
                    createdProduct?.uom ||
                    updatedRow?.unit ||
                    updatedRow?.uom ||
                    "";

                const cgstValue =
                    createdProduct?.cgstPercentage ??
                    createdProduct?.cgst ??
                    createdProduct?.csgst ??
                    createdProduct?.cgstRate ??
                    createdProduct?.tax?.cgstPercentage ??
                    createdProduct?.tax?.cgst ??
                    updatedRow?.cgst ??
                    "";

                const sgstValue =
                    createdProduct?.sgstPercentage ??
                    createdProduct?.sgst ??
                    createdProduct?.csgst ??
                    createdProduct?.sgstRate ??
                    createdProduct?.tax?.sgstPercentage ??
                    createdProduct?.tax?.sgst ??
                    updatedRow?.sgst ??
                    "";

                const igstValue =
                    createdProduct?.igstPercentage ??
                    createdProduct?.igst ??
                    createdProduct?.igstRate ??
                    createdProduct?.tax?.igstPercentage ??
                    createdProduct?.tax?.igst ??
                    updatedRow?.igst ??
                    "";

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
                        updatedRow?.productDescription ||
                        "",

                    description:
                        createdProduct?.productDescription ||
                        createdProduct?.description ||
                        updatedRow?.description ||
                        "",

                    productHSNCode:
                        createdProduct?.productHSNCode ||
                        updatedRow?.productHSNCode ||
                        "",

                    unit: unitCode,
                    uom: unitCode,

                    unitName:
                        getUnitLabelFromSchema(
                            unitCode
                        ),

                    rate:
                        createdProduct?.purchasePrice ??
                        createdProduct?.rate ??
                        updatedRow?.rate ??
                        "",

                    availableQuantity: null,

                    productType:
                        createdProduct?.productType ||
                        createdProduct?.dynamicFields?.productType ||
                        "",

                    acceptedQuantity:
                        updatedRow?.acceptedQuantity ??
                        "",

                    rejectedQuantity:
                        updatedRow?.rejectedQuantity ??
                        "0",

                    rejectedReason:
                        updatedRow?.rejectedReason ||
                        "",

                    cgst: cgstValue,
                    cgstPercentage: cgstValue,

                    sgst: sgstValue,
                    sgstPercentage: sgstValue,

                    igst: igstValue,
                    igstPercentage: igstValue,
                };

                updatedRow = applyGrnTaxRule(
                    updatedRow,
                    form?.grnVendorCode || "",
                    createdProduct
                );

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
            });

            setErrors((prev: any) => ({
                ...prev,
                products: "",
            }));
        } catch (error: any) {
            console.log(
                "Failed to refresh GRN product options:",
                error
            );

            toast.error(
                error?.message ||
                "Product created, but GRN product dropdown refresh failed"
            );
        } finally {
            setCheckProduct(false);
            setProductTargetRowIndex(null);
            setProductSearchValue("");
        }
    };

    const handleAddRow = () => {
        setForm((prev: any) => ({
            ...prev,
            products: [
                ...(prev.products || []),
                {
                    ...emptyProductRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedProducts = (prev.products || []).filter(
                (_: any, i: number) => i !== index
            );

            return {
                ...prev,
                products:
                    updatedProducts.length > 0
                        ? updatedProducts
                        : [{ ...emptyProductRow, id: Date.now() }],
            };
        });
    };

    // const handleQuantityFields = (updatedRow: any, key: string, value: any, isPurchaseOrderGrn: boolean) => {
    //     if (key === "acceptedQuantity") {
    //         const originalQuantity = num(updatedRow.quantity);
    //         const acceptedQuantity = num(value);
    //         const rejectedQuantity = num(updatedRow.rejectedQuantity);

    //         if (
    //             isPurchaseOrderGrn &&
    //             originalQuantity > 0 &&
    //             acceptedQuantity > originalQuantity
    //         ) {
    //             updatedRow.acceptedQuantity = updatedRow.quantity || "";
    //             toast.error("Accepted quantity cannot be greater than quantity");
    //         }

    //         if (isPurchaseOrderGrn && originalQuantity > 0) {
    //             updatedRow.rejectedQuantity = Math.max(
    //                 originalQuantity - num(updatedRow.acceptedQuantity),
    //                 0
    //             ).toString();
    //         }

    //         if (!isPurchaseOrderGrn) {
    //             updatedRow.quantity = String(acceptedQuantity + rejectedQuantity);
    //         }

    //         if (num(updatedRow.rejectedQuantity) === 0) {
    //             updatedRow.rejectedReason = "";
    //         }
    //     }

    //     if (key === "rejectedQuantity") {
    //         const originalQuantity = num(updatedRow.quantity);
    //         const rejectedQuantity = num(value);
    //         const acceptedQuantity = num(updatedRow.acceptedQuantity);

    //         if (
    //             isPurchaseOrderGrn &&
    //             originalQuantity > 0 &&
    //             rejectedQuantity > originalQuantity
    //         ) {
    //             updatedRow.rejectedQuantity = "0";
    //             toast.error("Rejected quantity cannot be greater than quantity");
    //         }

    //         if (isPurchaseOrderGrn && originalQuantity > 0) {
    //             updatedRow.acceptedQuantity = Math.max(
    //                 originalQuantity - num(updatedRow.rejectedQuantity),
    //                 0
    //             ).toString();
    //         }

    //         if (!isPurchaseOrderGrn) {
    //             updatedRow.quantity = String(acceptedQuantity + rejectedQuantity);
    //         }

    //         if (num(updatedRow.rejectedQuantity) === 0) {
    //             updatedRow.rejectedReason = "";
    //         }
    //     }

    //     return updatedRow;
    // };

    // PARTIAL GRN
    const handleQuantityFields = (
        updatedRow: any,
        key: string,
        value: any,
        isPurchaseOrderGrn: boolean
    ) => {
        const purchaseOrderPendingQuantity =
            isPurchaseOrderGrn &&
                updatedRow?.purchaseOrderPendingQuantity !== undefined &&
                updatedRow?.purchaseOrderPendingQuantity !== null
                ? num(
                    updatedRow
                        ?.purchaseOrderPendingQuantity
                )
                : 0;

        if (key === "acceptedQuantity") {
            let acceptedQuantity =
                num(value);

            let rejectedQuantity =
                num(
                    updatedRow
                        ?.rejectedQuantity
                );

            if (
                acceptedQuantity <
                0
            ) {
                acceptedQuantity =
                    0;

                toast.error(
                    "Accepted quantity cannot be negative"
                );
            }

            if (
                isPurchaseOrderGrn &&
                purchaseOrderPendingQuantity >
                0 &&
                acceptedQuantity +
                rejectedQuantity >
                purchaseOrderPendingQuantity
            ) {
                acceptedQuantity =
                    Math.max(
                        purchaseOrderPendingQuantity -
                        rejectedQuantity,
                        0
                    );

                toast.error(
                    `Accepted + Rejected quantity cannot exceed pending Purchase Order quantity ${purchaseOrderPendingQuantity}`
                );
            }

            updatedRow.acceptedQuantity =
                String(
                    acceptedQuantity
                );

            updatedRow.quantity =
                String(
                    acceptedQuantity +
                    rejectedQuantity
                );

            if (
                rejectedQuantity ===
                0
            ) {
                updatedRow.rejectedReason =
                    "";
            }
        }

        if (key === "rejectedQuantity") {
            let rejectedQuantity =
                num(value);

            const acceptedQuantity =
                num(
                    updatedRow
                        ?.acceptedQuantity
                );

            if (
                rejectedQuantity <
                0
            ) {
                rejectedQuantity =
                    0;

                toast.error(
                    "Rejected quantity cannot be negative"
                );
            }

            if (
                isPurchaseOrderGrn &&
                purchaseOrderPendingQuantity >
                0 &&
                acceptedQuantity +
                rejectedQuantity >
                purchaseOrderPendingQuantity
            ) {
                rejectedQuantity =
                    Math.max(
                        purchaseOrderPendingQuantity -
                        acceptedQuantity,
                        0
                    );

                toast.error(
                    `Accepted + Rejected quantity cannot exceed pending Purchase Order quantity ${purchaseOrderPendingQuantity}`
                );
            }

            updatedRow.rejectedQuantity =
                String(
                    rejectedQuantity
                );

            updatedRow.quantity =
                String(
                    acceptedQuantity +
                    rejectedQuantity
                );

            if (
                rejectedQuantity ===
                0
            ) {
                updatedRow.rejectedReason =
                    "";
            }
        }

        return updatedRow;
    };

    const handleTaxFields = (updatedRow: any, key: string, value: any) => {
        const lowerKey = String(key).toLowerCase();

        const isCgst = lowerKey === "cgst" || lowerKey === "cgstpercentage";
        const isSgst = lowerKey === "sgst" || lowerKey === "sgstpercentage";
        const isIgst = lowerKey === "igst" || lowerKey === "igstpercentage";

        if ((isCgst || isSgst) && num(value) > 0) {
            updatedRow.igst = "";
            updatedRow.igstPercentage = "";
            updatedRow.igstAmount = 0;
        }

        if (isIgst && num(value) > 0) {
            updatedRow.cgst = "";
            updatedRow.sgst = "";
            updatedRow.cgstPercentage = "";
            updatedRow.sgstPercentage = "";
            updatedRow.cgstAmount = 0;
            updatedRow.sgstAmount = 0;
        }

        return updatedRow;
    };

    const enableDuplicatePro = useMemo(() => {
        const locationConfig = configurations?.[0]?.systemConfiguration?.allowDuplicateProduct
        return locationConfig === true || locationConfig === "true";
    }, [configurations]);

    const handleRowChange = (index: number, key: string, value: any) => {
        const lowerKey = String(key).toLowerCase();
        const isProductField =
            lowerKey === "productcode" ||
            lowerKey === "productname" ||
            lowerKey === "productid" ||
            lowerKey === "product";

        if (
            isProductField &&
            !String(form?.grnVendorCode || "").trim()
        ) {
            toast.error("Please select vendor first");
            setErrors((prev: any) => ({
                ...prev,
                grnVendorCode: "Please select vendor first",
                [`row_${index}_${key}`]: "",
            }));
            return;
        }

        const duplicate = Boolean(form?.products?.filter((e: any) => e?.productCode == value)?.length);

        if (duplicate && !enableDuplicatePro) {
            setErrors((prev: any) => ({
                ...prev,
                products: "",
                [`row_${index}_${key}`]: "This product already added",
                [`row_${index}_tax`]: "",
            }));
            return;
        }

        setForm((prev: any) => {
            const updatedProducts = [...(prev.products || [])];

            const currentRow = updatedProducts[index] || {};
            const currentField = getBodyFieldByKey(key);
            const isPurchaseOrderGrn = Boolean(prev?.pOrdVoucherNumber);

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (isInventoryBalanceField(currentField)) {
                const apiKey = getInventoryBalanceApiKey(currentField);
                const selectedOption = getOptionByValue(currentField, value);
                const selectedCode = selectedOption?.value ?? selectedOption?.raw?.code ?? value ?? "";

                const currentSelections =
                    updatedRow?._inventoryBalanceSelections &&
                        typeof updatedRow._inventoryBalanceSelections === "object"
                        ? { ...updatedRow._inventoryBalanceSelections }
                        : {};

                if (
                    selectedCode !== undefined &&
                    selectedCode !== null &&
                    String(selectedCode).trim() !== ""
                ) {
                    currentSelections[apiKey] = selectedCode;
                } else {
                    delete currentSelections[apiKey];
                }

                updatedRow._inventoryBalanceSelections = currentSelections;
            }

            updatedRow = normalizeRowKeys(updatedRow);

            updatedRow = handleQuantityFields(
                updatedRow,
                key,
                value,
                isPurchaseOrderGrn
            );

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(
                    currentField,
                    value,
                    updatedRow
                );
            }

            const selectedOption = getOptionByValue(currentField, value);
            const raw = selectedOption?.raw || {};

            if (
                isCustomMasterField(
                    currentField
                )
            ) {
                updatedRow.customMasters =
                    buildCustomMastersPayload(
                        templateFields?.body || [],
                        updatedRow,
                        currentRow?.customMasters || {}
                    );
            }

            if (isProductField && selectedOption?.raw) {
                updatedRow = fillProductDetailsFromSelectedOption(updatedRow, selectedOption);
                updatedRow.productCode = raw?.productCode || raw?.code || updatedRow.productCode || "";
                updatedRow.productName = raw?.productName || raw?.name || selectedOption?.label || updatedRow.productName || "";
                updatedRow.productId = raw?._id || raw?.productId || updatedRow.productId || "";
                updatedRow.productType = raw?.productType || raw?.dynamicFields?.productType || "";
                updatedRow.availableQuantity = null;

                updatedRow = applyGrnTaxRule(
                    updatedRow,
                    form?.grnVendorCode || "",
                    raw
                );
            }

            updatedRow = normalizeRowKeys(updatedRow);
            updatedRow = handleTaxFields(updatedRow, key, value);
            updatedRow = calculateRow(updatedRow);
            updatedProducts[index] = updatedRow;

            return {
                ...prev,
                products: updatedProducts,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            products: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_rejectedReason`]: "",
            [`row_${index}_tax`]: "",
            [`row_${index}_igstPercentage`]: "",
            [`row_${index}_cgstPercentage`]: "",
            [`row_${index}_sgstPercentage`]: "",
            [`row_${index}_igst`]: "",
            [`row_${index}_cgst`]: "",
            [`row_${index}_sgst`]: "",
        }));
    };

    const getFilledRows = () => {
        const bodyKeys = (templateFields?.body || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => field.key);

        return (form.products || []).filter((row: any) => {
            return bodyKeys.some((key: string) => {
                const value = row?.[key];

                return value !== undefined && value !== null && value !== "";
            });
        });
    };

    const validateForm = () => {
        const err: any = {};

        (templateFields?.header || []).forEach((field: any) => {
            if (field.isHidden || !field.isRequired) return;

            const value = form?.[field.key];

            if (value === undefined || value === null || value === "") {
                err[field.key] = `${field.label || field.key} is required`;
            }
        });

        if (getFilledRows().length === 0) {
            err.products = "Please add at least one product";
        }

        (form.products || []).forEach((row: any, index: number) => {
            const hasAnyValue = (templateFields?.body || []).some((field: any) => {
                const value = row?.[field.key];

                return value !== undefined && value !== null && value !== "";
            });

            if (!hasAnyValue) return;

            (templateFields?.body || []).forEach((field: any) => {
                if (field.isHidden || !field.isRequired) return;

                const value = row?.[field.key];

                if (value === undefined || value === null || value === "") {
                    err[`row_${index}_${field.key}`] = `${field.label || field.key
                        } is required`;
                }
            });

            // PARTIAL GRN
            if (
                !editingRecord &&
                form?.pOrdVoucherNumber &&
                row?.purchaseOrderPendingQuantity !== null &&
                row?.purchaseOrderPendingQuantity !== undefined
            ) {
                const receivedQuantity =
                    num(
                        row?.acceptedQuantity
                    ) +
                    num(
                        row?.rejectedQuantity
                    );

                if (
                    receivedQuantity >
                    num(
                        row
                            ?.purchaseOrderPendingQuantity
                    )
                ) {
                    err[
                        `row_${index}_acceptedQuantity`
                    ] =
                        `Accepted + Rejected quantity cannot exceed pending Purchase Order quantity ${num(
                            row
                                ?.purchaseOrderPendingQuantity
                        )}`;
                }
            }

            const cgst = num(row.cgstPercentage || row.cgst);
            const sgst = num(row.sgstPercentage || row.sgst);
            const igst = num(row.igstPercentage || row.igst);

            if (igst > 0 && (cgst > 0 || sgst > 0)) {
                err[`row_${index}_tax`] =
                    "You can enter either IGST or CGST/SGST";
                err[`row_${index}_igstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_cgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_sgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_igst`] = "Only one tax type allowed";
                err[`row_${index}_cgst`] = "Only one tax type allowed";
                err[`row_${index}_sgst`] = "Only one tax type allowed";
            }

            if (num(row.rejectedQuantity) > 0 && !row.rejectedReason) {
                err[`row_${index}_rejectedReason`] =
                    "Rejected reason is required";
            }
        });

        setErrors(err);

        if (err.products) {
            toast.error(err.products);
        }

        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        const bodyKeys = (templateFields?.body || []).map(
            (field: any) => field.key
        );

        return (form.products || [])
            .filter((row: any) => {
                return bodyKeys.some((key: string) => {
                    const value = row?.[key];

                    return value !== undefined && value !== null && value !== "";
                });
            })
            .map((row: any) => calculateRow(normalizeRowKeys(row)));
    };

    const buildGrnBodyPayload = (products: any[]) => {
        return products.map((item: any) => {
            const customMasters =
                buildCustomMastersPayload(
                    templateFields?.body || [],
                    item,
                    item?.customMasters || {}
                );

            return removeEmptyValues({
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,

                productDescription: item.productDescription || item.description,
                description: item.description || item.productDescription,

                productHSNCode: item.productHSNCode,
                remarks: item.remarks,

                ...(Object.keys(customMasters).length
                    ? {
                        customMasters,
                    }
                    : {}),

                quantity: String(
                    num(item.acceptedQuantity) + num(item.rejectedQuantity)
                ),

                acceptedQuantity: String(
                    item.acceptedQuantity !== undefined &&
                        item.acceptedQuantity !== null &&
                        item.acceptedQuantity !== ""
                        ? item.acceptedQuantity
                        : item.quantity
                ),

                rejectedQuantity: String(
                    item.rejectedQuantity !== undefined &&
                        item.rejectedQuantity !== null &&
                        item.rejectedQuantity !== ""
                        ? item.rejectedQuantity
                        : "0"
                ),

                rejectedReason: item.rejectedReason,

                unit: item.unit || item.uom,
                uom: item.uom || item.unit,

                rate: String(item.rate),

                gross: fmtMoney(item.grossAmount),
                grossAmount: fmtMoney(item.grossAmount),

                discount: String(
                    getTaxValue(item.discount, item.discountPercentage)
                ),
                discountPercentage: String(
                    getTaxValue(item.discountPercentage, item.discount)
                ),

                discountAmount: fmtMoney(item.discountAmount),
                taxableAmount: fmtMoney(item.taxableAmount),

                cgst: String(getTaxValue(item.cgst, item.cgstPercentage)),
                cgstPercentage: String(
                    getTaxValue(item.cgstPercentage, item.cgst)
                ),
                cgstAmount: fmtMoney(item.cgstAmount),

                sgst: String(getTaxValue(item.sgst, item.sgstPercentage)),
                sgstPercentage: String(
                    getTaxValue(item.sgstPercentage, item.sgst)
                ),
                sgstAmount: fmtMoney(item.sgstAmount),

                igst: String(getTaxValue(item.igst, item.igstPercentage)),
                igstPercentage: String(
                    getTaxValue(item.igstPercentage, item.igst)
                ),
                igstAmount: fmtMoney(item.igstAmount),

                taxAmount: fmtMoney(item.taxAmount),
                otherAmount: fmtMoney(item.otherAmount),

                netAmount: fmtMoney(item.netAmount || item.netTotal),
                netTotal: fmtMoney(item.netTotal || item.netAmount),
            });
        });
    };

    const buildGrnFooterPayload = (footer: any) => {
        return {
            grossAmount: fmtMoney(footer.totalGrossAmount),
            discountAmount: fmtMoney(footer.totalDiscountAmount),
            cgstAmount: fmtMoney(footer.totalCgstAmount),
            sgstAmount: fmtMoney(footer.totalSgstAmount),
            igstAmount: fmtMoney(footer.totalIgstAmount),
            taxAmount: fmtMoney(footer.totalTaxAmount),
            otherAmount: fmtMoney(footer.totalOtherAmount),
            netAmount: fmtMoney(footer.totalNetAmount),

            adjustedAmount: "0",
            balanceAmount: fmtMoney(footer.totalNetAmount),

            totalQuantity: footer.totalQuantity,
            totalGrossAmount: fmtMoney(footer.totalGrossAmount),
            totalDiscountAmount: fmtMoney(footer.totalDiscountAmount),
            totalCgstAmount: fmtMoney(footer.totalCgstAmount),
            totalSgstAmount: fmtMoney(footer.totalSgstAmount),
            totalIgstAmount: fmtMoney(footer.totalIgstAmount),
            totalTaxAmount: fmtMoney(footer.totalTaxAmount),
            totalOtherAmount: fmtMoney(footer.totalOtherAmount),
            totalNetAmount: fmtMoney(footer.totalNetAmount),
        };
    };


    const createPurchaseReturnFromRejectedGrn = async (
        grnVoucherNumber: string,
        payload: any
    ) => {
        if (!grnVoucherNumber) {
            toast.error("GRN voucher number not found for purchase return");
            return;
        }

        const pendingProducts = await getPendingRejectedProductsForGrn(
            grnVoucherNumber,
            payload?.grnBody || []
        );

        if (!pendingProducts.length) {
            toast.info("Purchase Return already created for rejected quantity");
            return;
        }

        const rejectedProducts = pendingProducts
            .map((item: any) => {
                const quantity = num(item?.pendingRejectedQuantity);

                if (quantity <= 0) return null;

                const rate = num(item?.rate);

                const discountPercent = safePercent(
                    item?.discount !== undefined &&
                        item?.discount !== null &&
                        item?.discount !== ""
                        ? item.discount
                        : item?.discountPercentage
                );

                const cgstPercent = safePercent(
                    item?.cgst !== undefined &&
                        item?.cgst !== null &&
                        item?.cgst !== ""
                        ? item.cgst
                        : item?.cgstPercentage
                );

                const sgstPercent = safePercent(
                    item?.sgst !== undefined &&
                        item?.sgst !== null &&
                        item?.sgst !== ""
                        ? item.sgst
                        : item?.sgstPercentage
                );

                const igstPercent = safePercent(
                    item?.igst !== undefined &&
                        item?.igst !== null &&
                        item?.igst !== ""
                        ? item.igst
                        : item?.igstPercentage
                );

                const grossAmount = quantity * rate;
                const discountAmount = (grossAmount * discountPercent) / 100;
                const taxableAmount = grossAmount - discountAmount;

                const cgstAmount = (taxableAmount * cgstPercent) / 100;
                const sgstAmount = (taxableAmount * sgstPercent) / 100;
                const igstAmount = (taxableAmount * igstPercent) / 100;

                const taxAmount = cgstAmount + sgstAmount + igstAmount;
                const otherAmount = num(item?.otherAmount);
                const netAmount = taxableAmount + taxAmount + otherAmount;

                return {
                    grnVoucherNumber,

                    productCode: item?.productCode || "",
                    productName: item?.productName || "",
                    productId: item?.productId || "",
                    productType: item?.productType || "",

                    productDescription:
                        item?.productDescription || item?.description || "",
                    description:
                        item?.description || item?.productDescription || "",

                    productHSNCode: item?.productHSNCode || "",
                    remarks: item?.remarks || "",

                    quantity: String(quantity),

                    uom: item?.uom || item?.unit || "",
                    unit: item?.unit || item?.uom || "",

                    rate: String(rate),

                    gross: fmtMoney(grossAmount),
                    grossAmount: fmtMoney(grossAmount),

                    discount: String(discountPercent),
                    discountPercentage: String(discountPercent),
                    discountAmount: fmtMoney(discountAmount),

                    taxableAmount: fmtMoney(taxableAmount),

                    cgst: String(cgstPercent),
                    cgstPercentage: String(cgstPercent),
                    cgstAmount: fmtMoney(cgstAmount),

                    sgst: String(sgstPercent),
                    sgstPercentage: String(sgstPercent),
                    sgstAmount: fmtMoney(sgstAmount),

                    igst: String(igstPercent),
                    igstPercentage: String(igstPercent),
                    igstAmount: fmtMoney(igstAmount),

                    taxAmount: fmtMoney(taxAmount),
                    otherAmount: fmtMoney(otherAmount),

                    netAmount: fmtMoney(netAmount),
                    netTotal: fmtMoney(netAmount),
                };
            })
            .filter(Boolean);

        if (!rejectedProducts.length) {
            toast.info("Purchase Return already created for rejected quantity");
            return;
        }

        const totals = calculateFooter(rejectedProducts);

        const purchaseReturnPayload = {
            grnVoucherNumber,
            pRetVoucherDate: todayYMD(),

            pRetVendorCode: payload?.grnVendorCode || "",
            pRetVendorName: payload?.grnVendorName || "",

            pRetPurAccount: "SA003",
            pRetStatus: "open",
            pRetRemark: "",

            pRetBody: rejectedProducts,

            pRetFooter: buildGrnFooterPayload(totals),
        };

        const result = await professionalAxios.post(
            `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseReturn/save`,
            purchaseReturnPayload
        );

        toast.success("Purchase Return created for rejected GRN quantity");

        return result?.data;
    };


    const hasRejectedQuantity = (body: any[] = []) => {
        return body.some((item: any) => num(item?.rejectedQuantity) > 0);
    };

    const getPendingRejectedProductsForGrn = async (
        grnVoucherNumber: string,
        grnBody: any[] = []
    ) => {
        if (!grnVoucherNumber) return [];

        const res = await professionalAxios.get(
            `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/analysis/grnPendingPurchaseReturn/byGrn/${grnVoucherNumber}`
        );

        const pendingItems =
            res?.data?.data?.record?.pendingItems ||
            res?.data?.record?.pendingItems ||
            res?.data?.data?.pendingItems ||
            res?.data?.pendingItems ||
            [];

        return (pendingItems || [])
            .map((pendingItem: any) => {
                const bodyItem = (grnBody || []).find((item: any) => {
                    return (
                        String(item?.productCode || "") ===
                        String(pendingItem?.productCode || "")
                    );
                });

                const pendingRejectedQuantity = num(
                    pendingItem?.balanceQuantity ??
                    pendingItem?.pendingQuantity ??
                    pendingItem?.rejectedQuantity ??
                    0
                );

                if (pendingRejectedQuantity <= 0) return null;

                return {
                    ...(bodyItem || pendingItem),
                    ...pendingItem,
                    pendingRejectedQuantity,
                    rejectedQuantity: String(pendingRejectedQuantity),
                    quantity: String(pendingRejectedQuantity),
                };
            })
            .filter(Boolean);
    };

    const openPurchaseReturnConfirm = (grnVoucherNumber: string, payload: any) => {
        setPendingReturnData({
            grnVoucherNumber,
            payload,
        });

        setShowReturnConfirmModal(true);
    };

    const handleConfirmPurchaseReturn = async () => {
        if (!pendingReturnData?.grnVoucherNumber || !pendingReturnData?.payload) {
            toast.error("Purchase return data not found");
            return;
        }

        try {
            setReturnConfirmLoading(true);

            await createPurchaseReturnFromRejectedGrn(
                pendingReturnData.grnVoucherNumber,
                pendingReturnData.payload
            );

            setShowReturnConfirmModal(false);
            setPendingReturnData(null);

            await fetchGrns();
            await fetchPurchaseOrders("");
        } catch (error: any) {
            toast.error(
                error?.message ||
                error?.payload?.message ||
                "Failed to create purchase return"
            );
        } finally {
            setReturnConfirmLoading(false);
        }
    };

    const handleCancelPurchaseReturn = () => {
        setShowReturnConfirmModal(false);
        setPendingReturnData(null);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const footer = calculateFooter(products);

        const customMasters =
            buildCustomMastersPayload(
                templateFields?.header || [],
                form,
                form?.customMasters || {}
            );

        const payload: any = {
            grnVoucherDate: form.grnVoucherDate,

            grnVendorCode: form.grnVendorCode,
            grnVendorName: form.grnVendorName,

            pOrdVoucherNumber: form?.pOrdVoucherNumber || "",

            grnStatus: form.grnStatus || "open",
            grnRemark: form.grnRemark,

            ...(Object.keys(customMasters).length
                ? {
                    customMasters,
                }
                : {}),

            grnBody: buildGrnBodyPayload(products),
            grnFooter: buildGrnFooterPayload(footer),
        };


        try {
            let result: any = null;
            let savedGrnVoucherNumber = form?.grnVoucherNumber;

            if (editingRecord) {
                result = await dispatch(
                    updateGrn({
                        grnVoucherNumber: form?.grnVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                savedGrnVoucherNumber =
                    result?.data?.grn?.grnVoucherNumber ||
                    result?.data?.voucherNumber ||
                    result?.data?.grnVoucherNumber ||
                    result?.grn?.grnVoucherNumber ||
                    result?.voucherNumber ||
                    form?.grnVoucherNumber;

                if (savedGrnVoucherNumber) {
                    try {
                        await syncInventoryBalance(
                            savedGrnVoucherNumber,
                            true
                        );
                    } catch (inventoryError: any) {
                        console.log(
                            "GRN Inventory Balance update failed",
                            inventoryError
                        );

                        toast.error(
                            inventoryError?.message ||
                            inventoryError?.response?.data?.message ||
                            "GRN updated, but Inventory Balance update failed"
                        );
                    }
                }

                if (payload?.pOrdVoucherNumber) {
                    await syncPurchaseOrderStatusAfterGrn(
                        payload.pOrdVoucherNumber
                    );
                }

                toast.success("GRN updated successfully");



            } else {
                result = await dispatch(addGrn({ payload }) as any).unwrap();

                savedGrnVoucherNumber =
                    result?.data?.grn?.grnVoucherNumber ||
                    result?.data?.voucherNumber ||
                    result?.data?.grnVoucherNumber ||
                    result?.grn?.grnVoucherNumber ||
                    result?.voucherNumber ||
                    payload?.grnVoucherNumber;

                if (savedGrnVoucherNumber) {
                    try {
                        await syncInventoryBalance(
                            savedGrnVoucherNumber,
                            false
                        );
                    } catch (inventoryError: any) {
                        console.log(
                            "GRN Inventory Balance save failed",
                            inventoryError
                        );

                        toast.error(
                            inventoryError?.message ||
                            inventoryError?.response?.data?.message ||
                            "GRN created, but Inventory Balance save failed"
                        );
                    }
                }

                if (payload?.pOrdVoucherNumber) {
                    const poStatus = await syncPurchaseOrderStatusAfterGrn(
                        payload.pOrdVoucherNumber
                    );

                    if (poStatus === "close") {
                        toast.success(
                            "GRN created successfully and Purchase Order closed"
                        );
                    } else {
                        toast.success("GRN created successfully");
                    }
                } else {
                    toast.success("GRN created successfully");
                }
            }

            const rejectedQtyFound = hasRejectedQuantity(payload?.grnBody || []);

            setShowModal(false);
            resetMainForm();

            setSelectedPurchaseOrder(null);
            setPurchaseOrderSearch("");
            setPurchaseOrderLoaded(false);

            await fetchGrns();
            await fetchPurchaseOrders("");

            if (rejectedQtyFound && savedGrnVoucherNumber) {
                const pendingRejectedProducts = await getPendingRejectedProductsForGrn(
                    savedGrnVoucherNumber,
                    payload?.grnBody || []
                );

                if (pendingRejectedProducts.length > 0) {
                    openPurchaseReturnConfirm(savedGrnVoucherNumber, {
                        ...payload,
                        grnBody: pendingRejectedProducts,
                    });
                }
            }
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;
            const pOrdVoucherNumber = confirmTooltip?.pOrdVoucherNumber;

            if (!voucherNumber) {
                toast.error("GRN voucher number not found");
                return;
            }

            await dispatch(
                deleteGrn({
                    grnVoucherNumber: voucherNumber,
                }) as any
            ).unwrap();

            // ✅ After deleting GRN, update related Purchase Order status
            if (pOrdVoucherNumber) {
                await syncPurchaseOrderStatusAfterGrn(pOrdVoucherNumber);
            } else {
                toast.warning(
                    "GRN deleted, but purchase order voucher number not found"
                );
            }

            toast.success("GRN deleted successfully");

            await fetchGrns();
            await fetchPurchaseOrders("");
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.payload?.message ||
                "Failed to delete GRN"
            );
        } finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
                pOrdVoucherNumber: null,
            });
        }
    };

    const columns = [
        {
            key: "grnVoucherNumber",
            title: "Voucher No",
        },
        {
            key: "grnVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.grnVoucherDate
                    ? formatDateForList(row.grnVoucherDate)
                    : "-",
        },
        {
            key: "grnVendorName",
            title: "Vendor",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.grnVendorName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {row?.grnVendorCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "grnBody",
            title: "Items",
            render: (row: any) => row?.grnBody?.length || 0,
        },
        {
            key: "grnFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.grnFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "grnStatus",
            title: "GRN Status",
            render: (row: any) => (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {row?.grnStatus || "-"}
                </span>
            ),
        },
    ];

    useEffect(() => {
        /* @ts-ignore  */
        dispatch(getAllReportMapping({ moduleType: "grn" }));
        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );

        if (!Object.keys(company ?? {})?.length) {
            dispatch(
                getCompany({
                    withParent: true,
                    limit: 100,
                }) as any
            );
        }
    }, []);

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
                setAccountListLoaded(true);
            }
        };

        loadAccounts();
    }, [dispatch]);

    const headerInventoryBalanceSignature = useMemo(() => {
        return (templateFields?.header || [])
            .filter(
                (field: any) =>
                    !isTrueValue(field?.isHidden) &&
                    Boolean(getInventoryBalanceApiKey(field))
            )
            .map((field: any) => {
                const apiKey = getInventoryBalanceApiKey(field);
                const value = getInventoryFieldValue(
                    form,
                    templateFields?.header || [],
                    apiKey
                );

                return `${apiKey}:${String(value || "")}`;
            })
            .join("|");
    }, [form, templateFields?.header]);

    const productBalanceSignature = useMemo(
        () =>
            (form?.products || [])
                .map((item: any) => {
                    const inventoryFilters = getInventoryBalanceFilters(item);

                    return [
                        item?.productCode || "",
                        item?.productId || "",
                        item?.productName || "",
                        inventoryFilters?.warehouseCode || "",
                        inventoryFilters?.locationCode || "",
                        inventoryFilters?.batchNumber || "",
                        inventoryFilters?.binCode || "",
                    ].join("|");
                })
                .join("||"),
        [form?.products, headerInventoryBalanceSignature]
    );

    useEffect(() => {
        if (!showModal || !productBalanceSignature) return;

        let cancelled = false;

        const fetchAvailableQuantities = async () => {
            const now = new Date();
            const financialYear =
                now.getMonth() >= 3
                    ? now.getFullYear()
                    : now.getFullYear() - 1;

            const fromDate = new Date(
                financialYear,
                3,
                1,
                0,
                0,
                0,
                0
            ).toISOString();

            const toDate = now.toISOString();

            const balanceRows = await Promise.all(
                (form?.products || []).map(async (item: any) => {
                    const productCode = String(
                        item?.productCode || ""
                    ).trim();

                    if (!productCode) {
                        return {
                            productCode,
                            productType: String(
                                item?.productType || ""
                            )
                                .trim()
                                .toLowerCase(),
                            availableQuantity: null,
                        };
                    }

                    const productMaster =
                        getProductMasterFromRow(item) || {};

                    const productType = String(
                        item?.productType ||
                        productMaster?.productType ||
                        productMaster?.dynamicFields?.productType ||
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
                            productCode,
                            productType,
                            availableQuantity: null,
                        };
                    }

                    try {
                        const balance: any = await dispatch(
                            getProductBalance({
                                productCode,
                                fromDate,
                                toDate,
                                ...getInventoryBalanceFilters(item),
                            }) as any
                        ).unwrap();

                        return {
                            productCode,
                            productType,
                            availableQuantity:
                                balance?.balanceQuantity !== undefined &&
                                    balance?.balanceQuantity !== null
                                    ? balance.balanceQuantity
                                    : null,
                        };
                    } catch (error) {
                        console.log(
                            `Failed to fetch available quantity for ${productCode}`,
                            error
                        );

                        return {
                            productCode,
                            productType,
                            availableQuantity: null,
                        };
                    }
                })
            );

            if (cancelled) return;

            setForm((prev: any) => {
                const updatedProducts = (prev?.products || []).map(
                    (currentRow: any, index: number) => {
                        const balanceRow = balanceRows[index];

                        if (
                            !balanceRow ||
                            String(currentRow?.productCode || "") !==
                            String(balanceRow?.productCode || "")
                        ) {
                            return currentRow;
                        }

                        return {
                            ...currentRow,
                            productType: balanceRow.productType,
                            availableQuantity:
                                balanceRow.availableQuantity,
                        };
                    }
                );

                return {
                    ...prev,
                    products: updatedProducts,
                };
            });
        };

        void fetchAvailableQuantities();

        return () => {
            cancelled = true;
        };
    }, [
        showModal,
        productBalanceSignature,
        templateFields,
        dispatch,
        enableServiceProductInventory,
    ]);

    useEffect(() => {
        dispatch(getAllTransactionSchema("grn") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchGrns();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!showPurchaseOrderModal) return;
        if (!purchaseOrderLoaded) return;

        const timer = setTimeout(() => {
            fetchPurchaseOrders(purchaseOrderSearch.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [purchaseOrderSearch]);

    useEffect(() => {
        const prepareFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema =
                Array.isArray(transactionsSchema?.header) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                setFieldsLoading(true);

                const updatedData = await loadAllTemplateOptions(transactionsSchema);

                setTemplateFields(updatedData);
            } catch (error) {
                console.log("Failed to prepare template fields", error);
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    // ★ ADDED: Open Account Master when GRN form opens
    // and no vendor account exists.
    useEffect(() => {
        if (!showModal) return;
        if (editingRecord) return;
        if (!accountListLoaded) return;

        if (filterAccount.length === 0) {
            setCheckAccount(true);
        }
    }, [
        showModal,
        editingRecord,
        accountListLoaded,
        filterAccount.length,
    ]);

    const showInitialSkeleton =
        !refreshing &&
        grns.length === 0 &&
        (loading || fieldsLoading);

    const showPurchaseOrderSkeleton =
        purchaseOrderModalLoading ||
        purchaseOrderLoading ||
        !purchaseOrderLoaded;

    if (showInitialSkeleton) {
        return <ModulePageSkeleton rows={8} columns={6} />;
    }

    const isClosedGRN = (record: any) => {
        const grnStatus = String(record?.grnStatus || "").toLowerCase();
        return grnStatus === "close" || grnStatus === "closed";
    }


    const handleEditGRN = (record: any) => {
        if (isClosedGRN(record)) {
            toast.error("You can't edit closed GRN")
            return;
        }

        openEditModal(record);
    }


    const handleDeleteGRNClick = (e: any, record: any) => {
        if (isClosedGRN(record)) {
            toast.error("You can't delete closed GRN")
            return;
        }

        const rect =
            e.currentTarget.getBoundingClientRect();

        let x = rect.left - 150;
        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({
            show: true,
            x,
            y,
            voucherNumber: record?.grnVoucherNumber,
            pOrdVoucherNumber: record?.pOrdVoucherNumber || "",
        });
    }


    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="grn-header" className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div id="grn-summary" className="flex items-start gap-3">
                    <Badge
                        count={pagination?.totalDocs ?? 0}
                        text="Total GRNs:"
                        varient="primary"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Toggle
                        arr={["open", "close"]}
                        state={status}
                        setState={handleStatusChange}
                    />

                    <SearchInput search={search} setSearch={setSearch} />

                    <DataREfreshButton
                        callBackFn={handleRefresh}
                        loading={refreshing}
                    />

                    <Permission module="bookez" permissionKey="grn" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            callBackFn={openAddModal}
                            text="Add GRN"
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={grns}
                loading={loading}
                emptyMessage={`No ${status} GRN found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "grn",
                                    record,
                                    CustomerCode: record?.grnVendorCode,
                                    voucherNumber: record?.grnVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>

                        <Permission module="bookez" permissionKey="grn" action="update">
                            <button
                                id="grn-edit-button"
                                onClick={() => handleEditGRN(record)}
                                className={`cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary ${isClosedGRN(record)}`}
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="grn" action="delete">
                            <button
                                id="grn-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => handleDeleteGRNClick(e, record)}
                                className={`cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50 ${isClosedGRN(record)}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </Permission>
                    </div>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    }}
                    preDisabled={!pagination?.hasPrevPage}
                    nextDisabled={!pagination?.hasNextPage}
                    setLocalOffset={setLocalOffset}
                    pagination={pagination}
                />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this GRN?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            voucherNumber: null,
                            pOrdVoucherNumber: null,
                        })
                    }
                />
            )}

            <Modal
                show={showPurchaseOrderModal}
                setShow={setShowPurchaseOrderModal}
                title="Select Purchase Order"
                state={false}
                handleSubmit={handlePurchaseOrderConfirm}
                handleClose={handlePurchaseOrderModalClose}
                loader={purchaseOrderModalLoading || purchaseOrderLoading}
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
                                value={purchaseOrderSearch}
                                onChange={(e) =>
                                    setPurchaseOrderSearch(e.target.value)
                                }
                                placeholder="Search Purchase Order code..."
                                className="
                                    w-full rounded-xl border border-border bg-input
                                    px-4 py-3 text-sm font-medium text-foreground
                                    outline-none transition
                                    placeholder:text-muted-foreground
                                    focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20
                                "
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {showPurchaseOrderSkeleton ? (
                                <ModalListSkeleton rows={3} />
                            ) : purchaseOrders.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    No purchase order found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {purchaseOrders.map((po: any, index: number) => {
                                        const poNumber =
                                            po?.pOrdVoucherNumber || "-";

                                        const vendorName =
                                            po?.pOrdVendorName || "-";

                                        const poBody = po?.pOrdBody || [];

                                        const selectedPoNumber =
                                            selectedPurchaseOrder?.pOrdVoucherNumber || "";

                                        const isSelected =
                                            String(selectedPoNumber) ===
                                            String(poNumber);

                                        return (
                                            <button
                                                key={`${poNumber}-${index}`}
                                                type="button"
                                                onClick={() =>
                                                    handlePurchaseOrderSelect(po)
                                                }
                                                className={`
                                                    w-full rounded-xl border px-4 py-4 text-left transition
                                                    ${isSelected
                                                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/10"
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-base font-bold text-card-foreground">
                                                            {poNumber} - {vendorName}
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                            Items: {poBody?.length || 0}
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
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                }
            />

            {!fieldsLoading && (
                <DynamicAddForm
                    show={showModal}
                    setShow={setShowModal}
                    edit={Boolean(editingRecord)}
                    title="GRN"
                    subtitle="Fill in the GRN details below"
                    loading={createLoading || updateLoading}
                    onClose={() => {
                        setShowModal(false);
                        setCheckAccount(false);
                        setCheckProduct(false);
                        setProductSearchValue("");
                        resetMainForm();
                    }}
                    onSubmit={handleSubmit}
                    form={form}
                    errors={errors}
                    handleAddRow={handleAddRow}
                    handleDeleteRow={handleDeleteRow}
                    handleRowChange={handleRowChange}
                    footerTotals={footerTotals}
                    inputData={{
                        ...templateFieldsWithCreateActions,
                        footer: dynamicFooterArray,
                    }}
                    bodyKey="products"
                    handleChange={handleMainChange}
                    bodyCellExtraRenderer={(column: any, row: any) =>
                        renderGrnCellExtra(
                            column,
                            row,
                            enableServiceProductInventory
                        )
                    }

                    // ★ ADDED: Common Account Master modal props
                    checkAccount={checkAccount}
                    setCheckAccount={setCheckAccount}
                    onAccountSaved={handleAccountSaved}
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

            {/* @ts-ignore  */}
            <ListingModel
                {...{
                    show: downlaodPDF?.show,
                    downlaodPDF,
                    entryType: "grn",
                    setShow: () => setDownlaodPDF(() => ({ show: !downlaodPDF?.show, })),
                    rowData: downlaodPDF?.record,
                    report,
                    title: "Download GRN PDF",
                    cancelText: "Cancel",
                    confirmText: "Confirm",
                }}
            />

            <Modal
                show={showReturnConfirmModal}
                setShow={setShowReturnConfirmModal}
                title="Create Purchase Return?"
                state={false}
                handleSubmit={handleConfirmPurchaseReturn}
                handleClose={handleCancelPurchaseReturn}
                loader={returnConfirmLoading}
                gridCols={1}
                maxWidth="md"
                modalClassName="rounded-xl"
                headerClassName="bg-card"
                footerClassName="bg-card"
                bodyClassName="!block !p-0 bg-card text-card-foreground"
                hideFooter
                body={
                    <div className="space-y-5 p-5">
                        <div className="rounded-lg border border-border bg-card p-4">
                            <h3 className="text-base font-bold text-card-foreground">
                                Rejected quantity found in this GRN
                            </h3>

                            <p className="text-sm font-medium text-muted-foreground">
                                Do you want to create Purchase Return for rejected items?
                            </p>

                            <p className="mt-2 text-sm font-bold text-card-foreground">
                                Quantity:{" "}
                                <span className="text-danger">
                                    {Number(
                                        (pendingReturnData?.payload?.grnBody || []).reduce(
                                            (total: number, item: any) => {
                                                const qty =
                                                    item?.pendingRejectedQuantity ??
                                                    item?.balanceQuantity ??
                                                    item?.rejectedQuantity ??
                                                    item?.quantity ??
                                                    0;

                                                return total + Number(qty || 0);
                                            },
                                            0
                                        )
                                    )}
                                </span>
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={returnConfirmLoading}
                                onClick={handleCancelPurchaseReturn}
                                className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition hover:bg-muted disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={returnConfirmLoading}
                                onClick={handleConfirmPurchaseReturn}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                            >
                                {returnConfirmLoading ? "Creating..." : "OK"}
                            </button>
                        </div>
                    </div>
                }
            />
        </div>
    );
};

export default Grn;