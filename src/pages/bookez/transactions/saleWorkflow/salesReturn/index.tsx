import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DataTable from "../../../../../components/DataTable";
import { DataCreateButton, DataREfreshButton } from "../../../../../components/buttons";
import Toggle from "../../../../../components/toggle";
import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import { fmtMoney, formatDateForList, getFinancialYearRange, isTrueValue, loadAllTemplateOptions, money, num, safePercent, todayYMD } from "../../../../../utils/helperFunctions";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import type { ConfirmTooltipState } from "../salesWorkflowTypes";
import { deleteSalesInvoiceReturn, getAllSalesInvoiceReturn, updateSalesInvoiceReturn, createSalesInvoiceReturn } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceReturn";
import Modal, { ListingModel } from "../../../../../components/modal";
import { getAllSalesInvoice, getSalesReturnAnalysisByInvoiceVoucher, updateSalesInvoice } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import Permission from "../../../../../components/PermissionGuard";
import { getAllSystemConfigurations } from "../../../../../redux/slices/systemConf";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import ProductMasterModal from "../../../master/productMaster/ProductMasterFormModal";
import { getProductBalance, saveInventoryBalance, updateInventoryBalance } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";
import professionalAxios from "../../../../../services/professionalAxios";

const CUSTOMER_FIELD_KEYS = new Set([
    "sInvReturnCustomerCode",
    "sInvCustomerCode",
    "sInvReturnCustomerName",
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

const emptyProductRow = { id: Date.now(), productCode: "", productName: "", productId: "", productDescription: "", description: "", productHSNCode: "", remarks: "", quantity: "", availableQuantity: null, productType: "", uom: "", unit: "", unitName: "", rate: "", gross: 0, grossAmount: 0, discount: "", discountPercentage: "", discountAmount: 0, taxableAmount: 0, cgst: "", cgstPercentage: "", cgstAmount: 0, sgst: "", sgstPercentage: "", sgstAmount: 0, igst: "", igstPercentage: "", igstAmount: 0, taxAmount: 0, otherAmount: "", netAmount: 0, netTotal: 0, customMasters: {}, _inventoryBalanceSelections: {}, _inventoryBalanceVoucherId: "" };
const getDefaultForm = () => ({ sInvReturnVoucherNumber: "AUTO", sInvReturnVoucherDate: todayYMD(), sInvCustomerCode: "", sInvReturnCustomerName: "", sInvSalesAccount: "SA021", sInvStatus: "open", sInvReturnStatus: "open", sInvRemark: "", sInvRemarks: "", isAutoPost: false, customMasters: {}, products: [{ ...emptyProductRow, id: Date.now() }], grossAmount: "0.00", discountAmount: "0.00", cgstAmount: "0.00", sgstAmount: "0.00", igstAmount: "0.00", taxAmount: "0.00", otherAmount: "0.00", netAmount: "0.00" });

const renderSalesReturnCellExtra = (
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

const SalesReturn = () => {
    const dispatch = useDispatch<any>();
    const { salesInvoiceReturns, pagination, loading, createLoading, updateLoading, deleteLoading } = useSelector((state: any) => state.salesInvoiceReturn);
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema);
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");
    const [showModal, setShowModal] = useState(false);

    // ★ ADDED: Account Master modal state
    const [checkAccount, setCheckAccount] = useState(false);

    // ⭐ YELLOW STAR: ADDED — PRODUCT MASTER MODAL STATE
    const [checkProduct, setCheckProduct] = useState(false);

    // ⭐ YELLOW STAR: ADDED — PRODUCT ROW THAT OPENED MODAL
    const [productTargetRowIndex, setProductTargetRowIndex] =
        useState<number | null>(null);

    // ⭐ YELLOW STAR: ADDED — PRODUCT SEARCH VALUE
    const [productSearchValue, setProductSearchValue] =
        useState("");

    // ★ ADDED: Wait until Account Master list finishes loading
    const [accountListLoaded, setAccountListLoaded] = useState(false);

    const [editingRecord, setEditingRecord] = useState<any>(false);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const [purchaseOrderSearch, setPurchaseOrderSearch] = useState("");
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);
    const { salesInvoices, loading: invoiceLoader } = useSelector((state: any) => state.salesInvoice);
    const [templateFields, setTemplateFields] = useState<any>({ header: [], body: [], footer: [] });
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [confirmTooltip, setConfirmTooltip] = useState<ConfirmTooltipState>({ show: false, x: null, y: null, voucherNumber: null });
    const [downlaodPDF, setDownlaodPDF] = useState({ show: false, x: null, y: null, type: "" });
    const { report } = useSelector((s: any) => s.reportMapping);
    const { configurations } = useSelector((state: any) => state.systemConfiguration);
    const enableServiceProductInventory = useMemo(() => {
        const value = configurations?.[0]?.inventoryConfiguration?.enableServiceProductInventory;
        return value === true || value === "true";
    }, [configurations]);

    const { accounts = [] } = useSelector(
        (state: any) => state.accountMaster || {}
    );

    // ★ ADDED: Keep only customer accounts
    const filterAccount = useMemo(() => {
        return (accounts || []).filter(
            (account: any) =>
                String(account?.accountType || "").toLowerCase() ===
                "customer"
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

    const getHeaderFieldByKey = (key: string) => templateFields?.header?.find((field: any) => field.key === key);
    const getBodyFieldByKey = (key: string) => templateFields?.body?.find((field: any) => field.key === key);
    const getOptionByValue = (field: any, selectedValue: any) => field?.options?.find((opt: any) => String(opt.value) === String(selectedValue));

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

            const warehouseCode = String(
                getInventoryFieldValue(row, templateFields?.body || [], "warehouseCode") || ""
            );
            const locationCode = String(
                getInventoryFieldValue(row, templateFields?.body || [], "locationCode") || ""
            );
            const batchNumber = String(
                getInventoryFieldValue(row, templateFields?.body || [], "batchNumber") || ""
            );
            const rackCode = String(
                getInventoryFieldValue(row, templateFields?.body || [], "rackCode") || ""
            );
            const binCode = String(
                getInventoryFieldValue(row, templateFields?.body || [], "binCode") || ""
            );

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

    const resolveSavedSalesReturnVoucherNumber = (
        response: any,
        fallback = ""
    ) => {
        const visited = new Set<any>();

        const findVoucherNumber = (value: any, depth = 0): string => {
            if (
                value === null ||
                value === undefined ||
                depth > 6 ||
                typeof value !== "object" ||
                visited.has(value)
            ) {
                return "";
            }

            visited.add(value);

            const directKeys = [
                "sInvReturnVoucherNumber",
                "salesReturnVoucherNumber",
                "salesInvoiceReturnVoucherNumber",
                "voucherNumber",
                "generatedVoucherNumber",
            ];

            for (const key of directKeys) {
                const candidate = value?.[key];

                if (
                    candidate !== undefined &&
                    candidate !== null &&
                    String(candidate).trim() !== "" &&
                    String(candidate).trim().toUpperCase() !== "AUTO"
                ) {
                    return String(candidate).trim();
                }
            }

            for (const nestedValue of Object.values(value)) {
                const found = findVoucherNumber(nestedValue, depth + 1);
                if (found) return found;
            }

            return "";
        };

        const responseVoucherNumber = findVoucherNumber(response);

        if (responseVoucherNumber) return responseVoucherNumber;

        if (
            fallback &&
            String(fallback).trim() &&
            String(fallback).trim().toUpperCase() !== "AUTO"
        ) {
            return String(fallback).trim();
        }

        return "";
    };

    const buildInventoryBalancePayload = (
        row: any,
        voucherNumber: string
    ) => {
        const returnStatus = String(
            form?.sInvReturnStatus ||
            form?.sInvStatus ||
            "open"
        )
            .trim()
            .toLowerCase();

        const inventoryStatus =
            ["close", "closed", "cancelled"].includes(returnStatus)
                ? "inactive"
                : "active";

        return {
            voucherNumber,
            voucherNumberSnapshot:
                form?.sInvReturnVoucherNumber &&
                    form.sInvReturnVoucherNumber !== "AUTO"
                    ? form.sInvReturnVoucherNumber
                    : voucherNumber,
            voucherType: "salesReturn",
            sourceModule: "salesReturn",
            voucherStatus: inventoryStatus,
            voucherDate: toInventoryIsoDate(
                form?.sInvReturnVoucherDate || todayYMD()
            ),
            party:
                form?.sInvReturnCustomerCode ||
                form?.sInvCustomerCode ||
                form?.sInvReturnCustomerName ||
                "customer",
            productCode: String(row?.productCode || ""),
            productName: String(row?.productName || ""),
            productType: String(row?.productType || ""),
            uom: String(
                row?.uom ||
                row?.unit ||
                row?.unitName ||
                ""
            ),
            inwardQty: num(row?.quantity),
            outwardQty: 0,
            reservedQty: num(row?.reservedQty || 0),
            warehouseCode: String(
                getInventoryTransactionValue(row, "warehouseCode") || ""
            ),
            locationCode: String(
                getInventoryTransactionValue(row, "locationCode") || ""
            ),
            batchNumber: String(
                getInventoryTransactionValue(row, "batchNumber") || ""
            ),
            rackCode: String(
                getInventoryTransactionValue(row, "rackCode") || ""
            ),
            binCode: String(
                getInventoryTransactionValue(row, "binCode") || ""
            ),
            mfgOn: toInventoryIsoDate(
                getInventoryTransactionValue(row, "mfgOn")
            ),
            expOn: toInventoryIsoDate(
                getInventoryTransactionValue(row, "expOn")
            ),
            remarks:
                row?.remarks ||
                form?.sInvReturnRemark ||
                form?.sInvRemark ||
                "Sales Return",
            status: inventoryStatus,
        };
    };

    const syncInventoryBalance = async (
        voucherNumber: string,
        isEdit: boolean
    ) => {

        const rows = (form?.products || []).filter((row: any) => {
            const productType = String(row?.productType || "").trim().toLowerCase();

            if (productType === "nonstocks") return false;

            if (
                productType === "serviceproduct" &&
                !enableServiceProductInventory
            ) {
                return false;
            }

            return String(row?.productCode || "").trim() !== "";
        });

        for (const row of rows) {
            const inventoryPayload =
                buildInventoryBalancePayload(
                    row,
                    voucherNumber
                );

            if (!isEdit) {
                console.log(
                    "CALLING SALES RETURN INVENTORY BALANCE SAVE",
                    inventoryPayload
                );

                await dispatch(
                    saveInventoryBalance(
                        inventoryPayload
                    ) as any
                ).unwrap();

                continue;
            }

            const inventoryBalanceVoucherId =
                getInventoryBalanceVoucherId(row);

            if (inventoryBalanceVoucherId) {
                console.log(
                    "CALLING SALES RETURN INVENTORY BALANCE UPDATE",
                    inventoryBalanceVoucherId,
                    inventoryPayload
                );

                await dispatch(
                    updateInventoryBalance({
                        id: inventoryBalanceVoucherId,
                        payload: inventoryPayload,
                    }) as any
                ).unwrap();
            } else {
                console.log(
                    "NO SALES RETURN INVENTORY VID - CALLING SAVE",
                    inventoryPayload
                );

                await dispatch(
                    saveInventoryBalance(
                        inventoryPayload
                    ) as any
                ).unwrap();
            }
        }
    };

    const getProductMasterFromRow = (row: any) => {
        if (!row) return null;

        const rowProductValues = [row?.productCode, row?.productId, row?.productName]
            .filter((value) => value !== undefined && value !== null && value !== "")
            .map((value) => String(value));

        if (!rowProductValues.length) return null;

        const productFields = (templateFields?.body || []).filter((field: any) =>
            ["productCode", "productId", "productName", "product"].includes(String(field?.key || ""))
        );

        for (const field of productFields) {
            const selectedOption = (field?.options || []).find((option: any) => {
                const optionValues = [
                    option?.value,
                    option?.raw?._id,
                    option?.raw?.productId,
                    option?.raw?.productCode,
                    option?.raw?.productName,
                ]
                    .filter((value) => value !== undefined && value !== null && value !== "")
                    .map((value) => String(value));

                return optionValues.some((value) => rowProductValues.includes(value));
            });

            if (selectedOption?.raw) return selectedOption.raw;
        }

        return null;
    };

    const isCustomMasterField = (field: any) => {
        return String(field?.type || "").trim().toLowerCase() === "custommaster";
    };

    const getCustomMasterName = (field: any) => {
        return String(
            field?.customMasterName ||
            field?.label ||
            field?.title ||
            field?.key ||
            ""
        ).trim();
    };

    const getCustomMasterSelection = (field: any, selectedValue: any) => {
        if (
            selectedValue === undefined ||
            selectedValue === null ||
            selectedValue === ""
        ) {
            return null;
        }

        if (
            typeof selectedValue === "object" &&
            selectedValue?.code
        ) {
            return {
                code: String(selectedValue.code || "").trim(),
                name: String(
                    selectedValue.name ||
                    selectedValue.label ||
                    selectedValue.code ||
                    ""
                ).trim(),
            };
        }

        const selectedOption = getOptionByValue(
            field,
            selectedValue
        );

        const raw = selectedOption?.raw || {};

        const code = String(
            raw?.code ||
            raw?.masterCode ||
            selectedOption?.value ||
            selectedValue ||
            ""
        ).trim();

        const name = String(
            raw?.name ||
            raw?.masterName ||
            selectedOption?.label ||
            code
        ).trim();

        if (!code) {
            return null;
        }

        return {
            code,
            name,
        };
    };

    const buildCustomMastersPayload = (
        fields: any[],
        source: any,
        existingCustomMasters: any = {}
    ) => {
        const customMasters: any = {
            ...(existingCustomMasters &&
                typeof existingCustomMasters === "object"
                ? existingCustomMasters
                : {}),
        };

        (fields || []).forEach((field: any) => {
            if (
                field?.isHidden ||
                !isCustomMasterField(field)
            ) {
                return;
            }

            const masterName =
                getCustomMasterName(field);

            if (!masterName) {
                return;
            }

            const selectedValue =
                source?.[field.key];

            const selectedMaster =
                getCustomMasterSelection(
                    field,
                    selectedValue
                );

            if (selectedMaster) {
                customMasters[masterName] =
                    selectedMaster;
            }
        });

        return customMasters;
    };

    const applyCustomMasterValues = (
        fields: any[],
        source: any,
        customMasters: any
    ) => {
        const updated = {
            ...source,
            customMasters:
                customMasters &&
                    typeof customMasters === "object"
                    ? { ...customMasters }
                    : {},
        };

        (fields || []).forEach((field: any) => {
            if (!isCustomMasterField(field)) {
                return;
            }

            const masterName =
                getCustomMasterName(field);

            const savedMaster =
                customMasters?.[masterName];

            if (!savedMaster) {
                return;
            }

            updated[field.key] =
                savedMaster?.code ||
                savedMaster?.value ||
                "";
        });

        return updated;
    };

    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
        if (!field) return oldData;
        const selectedOption = getOptionByValue(field, selectedValue);
        const updated = { ...oldData, [field.key]: selectedValue };
        if (field?.mapFields && selectedOption?.raw) Object.entries(field.mapFields).forEach(([targetKey, sourceKey]) => { updated[targetKey] = selectedOption.raw?.[sourceKey as string] ?? ""; });
        return updated;
    };

    const getUnitLabelFromSchema = (unitCode: string) => {
        const unitField = templateFields?.body?.find((field: any) => field.key === "uom" || field.key === "unit");
        const selectedUnit = unitField?.options?.find((item: any) => String(item.value) === String(unitCode));
        return selectedUnit?.label || unitCode || "";
    };

    const normalizeRowKeys = (row: any) => {
        const updated = { ...row };
        if (updated.uom && !updated.unit) updated.unit = updated.uom;
        if (updated.unit && !updated.uom) updated.uom = updated.unit;
        if (updated.productDescription && !updated.description) updated.description = updated.productDescription;
        if (updated.description && !updated.productDescription) updated.productDescription = updated.description;
        if (updated.netAmount && !updated.netTotal) updated.netTotal = updated.netAmount;
        if (updated.netTotal && !updated.netAmount) updated.netAmount = updated.netTotal;
        if (updated.gross && !updated.grossAmount) updated.grossAmount = updated.gross;
        if (updated.grossAmount && !updated.gross) updated.gross = updated.grossAmount;
        updated.unitName = getUnitLabelFromSchema(updated.unit || updated.uom);
        return updated;
    };

    const calculateRow = (row: any) => {
        const quantity = num(row.quantity);
        const rate = num(row.rate);
        const gross = quantity * rate;
        const discountPercent = safePercent(row.discount);
        const cgstPercent = safePercent(row.cgst);
        const sgstPercent = safePercent(row.sgst);
        const igstPercent = safePercent(row.igst);
        const discountAmount = (gross * discountPercent) / 100;
        const taxableAmount = gross - discountAmount;
        const cgstAmount = (taxableAmount * cgstPercent) / 100;
        const sgstAmount = (taxableAmount * sgstPercent) / 100;
        const igstAmount = (taxableAmount * igstPercent) / 100;
        const otherAmount = num(row.otherAmount);
        const taxAmount = cgstAmount + sgstAmount + igstAmount;
        const netAmount = taxableAmount + taxAmount + otherAmount;
        return { ...row, quantity: row.quantity, rate: row.rate, discount: row.discount, cgst: row.cgst, sgst: row.sgst, igst: row.igst, otherAmount: row.otherAmount, gross, grossAmount: gross, discountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, taxAmount, netAmount, netTotal: netAmount };
    };

    const calculateFooter = (products: any[]) => {
        return (products || []).reduce((acc: any, item: any) => {
            acc.totalQuantity += num(item.quantity);
            acc.totalGrossAmount += num(item.gross);
            acc.totalDiscountAmount += num(item.discountAmount);
            acc.totalCgstAmount += num(item.cgstAmount);
            acc.totalSgstAmount += num(item.sgstAmount);
            acc.totalIgstAmount += num(item.igstAmount);
            acc.totalTaxAmount += num(item.taxAmount);
            acc.totalOtherAmount += num(item.otherAmount);
            acc.totalNetAmount += num(item.netAmount);
            return acc;
        }, { totalQuantity: 0, totalGrossAmount: 0, totalDiscountAmount: 0, totalCgstAmount: 0, totalSgstAmount: 0, totalIgstAmount: 0, totalTaxAmount: 0, totalOtherAmount: 0, totalNetAmount: 0 });
    };

    const footerTotals = useMemo(() => calculateFooter(form.products || []), [form.products]);
    const grossAmount = footerTotals.totalGrossAmount;
    const discountAmount = footerTotals.totalDiscountAmount;
    const cgstAmount = footerTotals.totalCgstAmount;
    const sgstAmount = footerTotals.totalSgstAmount;
    const igstAmount = footerTotals.totalIgstAmount;
    const netAmount = footerTotals.totalNetAmount;

    const fetchSalesInvoices = async () => {
        await dispatch(getAllSalesInvoiceReturn({ offset: localOffset, limit: localLimit, search: purchaseOrderSearch, status }) as any);
    };

    const getPendingReturnQtyFromAnalysis = (summary: any) => {
        const productWiseDetail = Array.isArray(summary?.productWiseDetail) ? summary.productWiseDetail : [];
        if (productWiseDetail.length > 0) return productWiseDetail.reduce((sum: number, item: any) => sum + num(item?.pendingQty || 0), 0);
        return num(summary?.pendingReturnQuantity?.totalPendingQty ?? summary?.pendingReturnQuantity ?? summary?.totalPendingQty ?? 0);
    };

    const syncSalesInvoiceStatusAfterReturnAnalysis = async (sInvVoucherNumber: string) => {
        if (!sInvVoucherNumber) return "";
        try {
            const summary = await dispatch(getSalesReturnAnalysisByInvoiceVoucher({ voucherNumber: sInvVoucherNumber }) as any).unwrap();
            const totalPendingQuantity = getPendingReturnQtyFromAnalysis(summary);
            const nextInvoiceStatus = totalPendingQuantity === 0 ? "close" : "open";
            await dispatch(updateSalesInvoice({ sInvVoucherNumber, payload: { sInvStatus: nextInvoiceStatus } }) as any);
            return nextInvoiceStatus;
        } catch (error: any) {
            console.log("From Sales Return Analysis", error);
            toast.error(error?.response?.data?.message || error?.message || "Sales return analysis failed");
            return "";
        }
    };

    const columns = [
        { key: "sInvReturnVoucherNumber", title: "Voucher" },
        { key: "sInvReturnVoucherDate", title: "Date", render: (row: any) => row?.sInvReturnVoucherDate ? formatDateForList(row.sInvReturnVoucherDate) : "-" },
        {
            key: "sInvReturnCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">{row?.sInvReturnCustomerName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{row?.sInvCustomerCode || "-"}</div>
                </div>
            ),
        },
        { key: "sInvReturnBody", title: "Items", render: (row: any) => row?.sInvReturnBody?.length || 0 },
        {
            key: "sInvReturnFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.sInvReturnFooter?.netAmount || 0)}
                </span>
            ),
            type: "amount",
        },
        {
            key: "sInvReturnStatus",
            title: "Doc Status",
            render: (row: any) => (
                <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${(row?.sInvReturnStatus || row?.sInvStatus) === "open" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger"}`}>
                    {row?.sInvReturnStatus || row?.sInvStatus || "-"}
                </span>
            ),
        },
    ];

    const handleStatusChange = (nextStatus: "open" | "close") => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchSalesInvoices();
            toast.success("Sales invoice list refreshed");
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
        setShowPurchaseOrderModal(true);
    };

    const openEditModal = async (record: any) => {
        const footer = record?.sInvReturnFooter || {};

        const products =
            record?.sInvReturnBody?.length > 0
                ? record.sInvReturnBody.map((item: any) => {
                    const unitCode =
                        item?.unit ||
                        item?.uom ||
                        "";

                    const baseRow = {
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
                            getProductMasterFromRow(item)?.productType ||
                            getProductMasterFromRow(item)?.dynamicFields?.productType ||
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

                        _inventoryBalanceSelections: {},

                        _inventoryBalanceVoucherId:
                            item?._inventoryBalanceVoucherId ||
                            item?.inventoryBalanceVoucherId ||
                            item?.inventoryBalanceId ||
                            "",
                    };

                    return calculateRow(
                        normalizeRowKeys(
                            applyCustomMasterValues(
                                templateFields?.body || [],
                                baseRow,
                                item?.customMasters || {}
                            )
                        )
                    );
                })
                : [
                    {
                        ...emptyProductRow,
                        id: Date.now(),
                    },
                ];

        let inventoryRecords: any[] = [];

        try {
            const inventoryResponse = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/inventoryBalance/getAll",
                {
                    params: {
                        offset: 0,
                        limit: 500,
                        voucherNumber: record?.sInvReturnVoucherNumber || "",
                    },
                }
            );

            inventoryRecords =
                getInventoryBalanceRecords(
                    inventoryResponse
                );
        } catch (error) {
            console.log(
                "Failed to load Sales Return inventory balance records",
                error
            );
        }

        const productsWithInventoryIds =
            attachInventoryBalanceVoucherIds(
                products,
                inventoryRecords
            );

        const baseForm = {
            sInvReturnVoucherNumber:
                record?.sInvReturnVoucherNumber,

            sInvVoucherNumber:
                record?.sInvVoucherNumber,

            sInvReturnCustomerCode:
                record?.sInvReturnCustomerCode,

            sInvCustomerCode:
                record?.sInvCustomerCode,

            sInvReturnCustomerName:
                record?.sInvReturnCustomerName,

            sInvReturnVoucherDate:
                record?.sInvReturnVoucherDate,

            sInvStatus:
                record?.sInvStatus ||
                record?.sInvReturnStatus ||
                "open",

            sInvReturnRemark:
                record?.sInvReturnRemark ||
                record?.sInvRemark ||
                "",

            sInvReturnSalesAccount:
                record?.sInvReturnSalesAccount ||
                "SA021",

            sInvReturnStatus:
                record?.sInvReturnStatus ||
                record?.sInvStatus ||
                "open",

            products: productsWithInventoryIds,

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
        };

        setEditingRecord(true);
        setErrors({});

        setForm(
            applyCustomMasterValues(
                templateFields?.header || [],
                baseForm,
                record?.customMasters || {}
            )
        );

        setShowModal(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const currentField =
                getHeaderFieldByKey(key);

            let updated = {
                ...prev,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updated =
                    applyMappedFields(
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
                const masterName =
                    getCustomMasterName(
                        currentField
                    );

                const customMasters = {
                    ...(
                        prev?.customMasters &&
                            typeof prev.customMasters === "object"
                            ? prev.customMasters
                            : {}
                    ),
                };

                const selectedMaster =
                    getCustomMasterSelection(
                        currentField,
                        value
                    );

                if (
                    selectedMaster
                ) {
                    customMasters[
                        masterName
                    ] =
                        selectedMaster;
                } else {
                    delete customMasters[
                        masterName
                    ];
                }

                updated.customMasters =
                    customMasters;
            }

            return updated;
        });

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    // ★ ADDED: Refresh customer options after Account Master save
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

            // ★ REFRESH SALES RETURN REPORT MAPPING
            await dispatch(
                getAllReportMapping({
                    moduleType: "salesInvoiceReturn",
                }) as any
            );

            // ★ RELOAD ALL DYNAMIC FIELD OPTIONS
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

            const customerAccounts = Array.isArray(refreshedAccounts)
                ? refreshedAccounts.filter(
                    (account: any) =>
                        String(account?.accountType || "").toLowerCase() ===
                        "customer"
                )
                : [];

            const savedCode =
                savedAccount?.accountCode ||
                savedAccount?.sInvReturnCustomerCode ||
                "";

            const savedName =
                savedAccount?.accountName ||
                savedAccount?.sInvReturnCustomerName ||
                "";

            const createdCustomer =
                customerAccounts.find(
                    (account: any) =>
                        (
                            savedCode &&
                            String(account?.accountCode) ===
                            String(savedCode)
                        ) ||
                        (
                            savedName &&
                            String(account?.accountName) ===
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
                customerAccounts.length - 1
                ] ||
                null;

            if (createdCustomer) {
                setForm((prev: any) => ({
                    ...prev,

                    sInvReturnCustomerCode:
                        createdCustomer?.accountCode ||
                        prev?.sInvReturnCustomerCode ||
                        "",

                    sInvCustomerCode:
                        createdCustomer?.accountCode ||
                        prev?.sInvCustomerCode ||
                        "",

                    sInvReturnCustomerName:
                        createdCustomer?.accountName ||
                        prev?.sInvReturnCustomerName ||
                        "",
                }));

                setErrors((prev: any) => ({
                    ...prev,
                    sInvReturnCustomerCode: "",
                    sInvCustomerCode: "",
                    sInvReturnCustomerName: "",
                }));
            }
        } catch (error: any) {
            console.log(
                "Failed to refresh Sales Return customer options:",
                error
            );

            toast.error(
                error?.message ||
                "Account created, but Sales Return customer dropdown refresh failed"
            );
        } finally {
            setCheckAccount(false);
        }
    };

    // ⭐ YELLOW STAR: ADDED — REFRESH PRODUCT OPTIONS AND SELECT NEW PRODUCT
    const handleProductSaved = async (
        savedResponse: any
    ) => {
        try {
            await dispatch(
                getAllReportMapping({
                    moduleType: "salesInvoiceReturn",
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
                savedProduct?.productCode || "";

            const savedName =
                savedProduct?.productName || "";

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
                    const raw = item?.raw || {};

                    return (
                        (
                            savedCode &&
                            String(
                                raw?.productCode ||
                                item?.value ||
                                ""
                            ) === String(savedCode)
                        ) ||
                        (
                            savedName &&
                            String(
                                raw?.productName ||
                                item?.label ||
                                ""
                            ) === String(savedName)
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
                    rowIndex = updatedProducts.length;

                    updatedProducts.push({
                        ...emptyProductRow,
                        id: Date.now(),
                    });
                }

                let updatedRow = {
                    ...(
                        updatedProducts[rowIndex] ||
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

                    unit:
                        createdProduct?.unit ||
                        updatedRow?.unit ||
                        "",

                    uom:
                        createdProduct?.unit ||
                        createdProduct?.uom ||
                        updatedRow?.uom ||
                        "",

                    rate:
                        createdProduct?.sellingPrice ??
                        createdProduct?.rate ??
                        updatedRow?.rate ??
                        "",

                    availableQuantity: null,

                    productType:
                        createdProduct?.productType ||
                        createdProduct?.dynamicFields?.productType ||
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

                updatedRow =
                    calculateRow(
                        normalizeRowKeys(
                            updatedRow
                        )
                    );

                updatedProducts[rowIndex] =
                    updatedRow;

                return {
                    ...prev,
                    products: updatedProducts,
                };
            });

            setErrors((prev: any) => ({
                ...prev,
                products: "",
            }));
        } catch (error: any) {
            console.log(
                "Failed to refresh Sales Return product options:",
                error
            );

            toast.error(
                error?.message ||
                "Product created, but Sales Return product dropdown refresh failed"
            );
        } finally {
            setCheckProduct(false);
            setProductTargetRowIndex(null);
            setProductSearchValue("");
        }
    };

    const handleAddRow = () => {
        setForm((prev: any) => ({ ...prev, products: [...(prev.products || []), { ...emptyProductRow, id: Date.now() }] }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedProducts = (prev.products || []).filter((_: any, i: number) => i !== index);
            return { ...prev, products: updatedProducts.length > 0 ? updatedProducts : [{ ...emptyProductRow, id: Date.now() }] };
        });
    };

    const enableDuplicatePro = useMemo(() => {
        const locationConfig = configurations?.[0]?.systemConfiguration?.allowDuplicateProduct
        return locationConfig === true || locationConfig === "true";
    }, [configurations]);

    const handleRowChange = (index: number, key: string, value: any) => {
        const duplicate = Boolean(
            form?.products?.filter(
                (e: any, i: number) =>
                    i !== index &&
                    e?.productCode == value
            )?.length
        );

        if (
            !enableDuplicatePro &&
            duplicate &&
            (
                key === "productCode" ||
                key === "productName" ||
                key === "productId"
            )
        ) {
            setErrors((prev: any) => ({
                ...prev,
                products: "",
                [`row_${index}_${key}`]:
                    "This product already added",
                [`row_${index}_tax`]:
                    "",
            }));

            return;
        }

        setForm((prev: any) => {
            const updatedProducts = [
                ...(prev.products || []),
            ];

            const currentRow =
                updatedProducts[index] ||
                {};

            const currentField =
                getBodyFieldByKey(key);

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (isInventoryBalanceField(currentField)) {
                const apiKey = getInventoryBalanceApiKey(currentField);
                const selectedOption = getOptionByValue(currentField, value);

                const selectedCode =
                    selectedOption?.value ??
                    selectedOption?.raw?.code ??
                    selectedOption?.raw?.masterCode ??
                    value ??
                    "";

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

            if (
                selectedOption?.raw?._id &&
                !updatedRow.productId
            ) {
                updatedRow.productId =
                    selectedOption.raw._id;
            }

            if (PRODUCT_FIELD_KEYS.has(key)) {
                const productRaw = selectedOption?.raw || {};
                updatedRow.productType =
                    productRaw?.productType ||
                    productRaw?.dynamicFields?.productType ||
                    "";
                updatedRow.availableQuantity = null;
            }

            if (
                isCustomMasterField(
                    currentField
                )
            ) {
                const masterName =
                    getCustomMasterName(
                        currentField
                    );

                const customMasters = {
                    ...(
                        currentRow?.customMasters &&
                            typeof currentRow.customMasters === "object"
                            ? currentRow.customMasters
                            : {}
                    ),
                };

                const selectedMaster =
                    getCustomMasterSelection(
                        currentField,
                        value
                    );

                if (
                    selectedMaster
                ) {
                    customMasters[
                        masterName
                    ] =
                        selectedMaster;
                } else {
                    delete customMasters[
                        masterName
                    ];
                }

                updatedRow.customMasters =
                    customMasters;
            }

            updatedRow =
                normalizeRowKeys(
                    updatedRow
                );

            if (
                (
                    key === "cgst" ||
                    key === "sgst"
                ) &&
                num(value) > 0
            ) {
                updatedRow.igst =
                    "";
                updatedRow.igstAmount =
                    0;
            }

            if (
                key === "igst" &&
                num(value) > 0
            ) {
                updatedRow.cgst =
                    "";
                updatedRow.sgst =
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

            updatedProducts[index] =
                updatedRow;

            return {
                ...prev,
                products:
                    updatedProducts,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            products: "",
            [`row_${index}_${key}`]:
                "",
            [`row_${index}_tax`]:
                "",
        }));
    };

    const getFilledRows = () => {
        const bodyKeys = (templateFields?.body || []).filter((field: any) => !field.isHidden).map((field: any) => field.key);
        return (form.products || []).filter((row: any) => bodyKeys.some((key: string) => {
            const value = row?.[key];
            return value !== undefined && value !== null && value !== "";
        }));
    };

    const validateForm = () => {
        const err: any = {};
        (templateFields?.header || []).forEach((field: any) => {
            if (field.isHidden) return;
            if (!field.isRequired) return;
            const value = form?.[field.key];
            if (value === undefined || value === null || value === "") err[field.key] = `${field.label || field.title || field.key} is required`;
        });

        const filledRows = getFilledRows();
        if (filledRows.length === 0) err.products = "Please add at least one product";

        (form.products || []).forEach((row: any, index: number) => {
            const hasAnyValue = (templateFields?.body || []).some((field: any) => {
                const value = row?.[field.key];
                return value !== undefined && value !== null && value !== "";
            });
            if (!hasAnyValue) return;

            (templateFields?.body || []).forEach((field: any) => {
                if (field.isHidden) return;
                if (!field.isRequired) return;
                const value = row?.[field.key];
                if (value === undefined || value === null || value === "") err[`row_${index}_${field.key}`] = `${field.label || field.title || field.key} is required`;
            });

            const cgst = num(row.cgstPercentage || row.cgst);
            const sgst = num(row.sgstPercentage || row.sgst);
            const igst = num(row.igstPercentage || row.igst);
            if (igst > 0 && (cgst > 0 || sgst > 0)) {
                err[`row_${index}_tax`] = "You can enter either IGST or CGST/SGST";
                err[`row_${index}_igstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_cgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_sgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_igst`] = "Only one tax type allowed";
                err[`row_${index}_cgst`] = "Only one tax type allowed";
                err[`row_${index}_sgst`] = "Only one tax type allowed";
            }
        });

        setErrors(err);
        if (err.products) toast.error(err.products);
        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        const bodyKeys = (templateFields?.body || []).map((field: any) => field.key);
        return (form.products || []).filter((row: any) => bodyKeys.some((key: string) => {
            const value = row?.[key];
            return value !== undefined && value !== null && value !== "";
        })).map((row: any) => calculateRow(normalizeRowKeys(row)));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products =
            cleanRows();

        const footer =
            calculateFooter(
                products
            );

        const headerCustomMasters =
            buildCustomMastersPayload(
                templateFields?.header || [],
                form,
                form?.customMasters || {}
            );

        const payload: any = {
            sInvReturnVoucherDate:
                form.sInvReturnVoucherDate,

            sInvReturnCustomerCode:
                form?.sInvReturnCustomerCode,

            sInvVoucherNumber:
                form?.sInvVoucherNumber,

            sInvReturnCustomerName:
                form.sInvReturnCustomerName,

            sInvReturnRemark:
                form.sInvReturnRemark ||
                form.sInvRemark ||
                "",

            sInvReturnSalesAccount:
                form.sInvReturnSalesAccount ||
                "SA021",

            sInvReturnStatus:
                form.sInvReturnStatus ||
                form.sInvStatus ||
                "open",

            ...(Object.keys(
                headerCustomMasters
            ).length
                ? {
                    customMasters:
                        headerCustomMasters,
                }
                : {}),

            sInvReturnBody:
                products.map(
                    (item: any) => {
                        const bodyCustomMasters =
                            buildCustomMastersPayload(
                                templateFields?.body || [],
                                item,
                                item?.customMasters || {}
                            );

                        return {
                            sInvVoucherNumber:
                                form?.sInvVoucherNumber,

                            productCode:
                                item.productCode,

                            productName:
                                item.productName,

                            productId:
                                item.productId,

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

                            ...(Object.keys(
                                bodyCustomMasters
                            ).length
                                ? {
                                    customMasters:
                                        bodyCustomMasters,
                                }
                                : {}),
                        };
                    }
                ),

            sInvReturnFooter: {
                grossAmount:
                    fmtMoney(
                        footer.totalGrossAmount
                    ),

                discountAmount:
                    fmtMoney(
                        footer.totalDiscountAmount
                    ),

                cgstAmount:
                    fmtMoney(
                        footer.totalCgstAmount
                    ),

                sgstAmount:
                    fmtMoney(
                        footer.totalSgstAmount
                    ),

                igstAmount:
                    fmtMoney(
                        footer.totalIgstAmount
                    ),

                taxAmount:
                    fmtMoney(
                        footer.totalTaxAmount
                    ),

                otherAmount:
                    fmtMoney(
                        footer.totalOtherAmount
                    ),

                netAmount:
                    fmtMoney(
                        footer.totalNetAmount
                    ),

                adjustedAmount:
                    "0",

                balanceAmount:
                    fmtMoney(
                        footer.totalNetAmount
                    ),

                totalQuantity:
                    footer.totalQuantity,

                totalGrossAmount:
                    fmtMoney(
                        footer.totalGrossAmount
                    ),

                totalDiscountAmount:
                    fmtMoney(
                        footer.totalDiscountAmount
                    ),

                totalCgstAmount:
                    fmtMoney(
                        footer.totalCgstAmount
                    ),

                totalSgstAmount:
                    fmtMoney(
                        footer.totalSgstAmount
                    ),

                totalIgstAmount:
                    fmtMoney(
                        footer.totalIgstAmount
                    ),

                totalTaxAmount:
                    fmtMoney(
                        footer.totalTaxAmount
                    ),

                totalOtherAmount:
                    fmtMoney(
                        footer.totalOtherAmount
                    ),

                totalNetAmount:
                    fmtMoney(
                        footer.totalNetAmount
                    ),
            },
        };

        try {
            if (
                editingRecord
            ) {
                const result: any = await dispatch(
                    updateSalesInvoiceReturn({
                        sInvReturnVoucherNumber:
                            form?.sInvReturnVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                const savedSalesReturnVoucherNumber =
                    resolveSavedSalesReturnVoucherNumber(
                        result,
                        form?.sInvReturnVoucherNumber
                    );

                if (!savedSalesReturnVoucherNumber) {
                    throw new Error(
                        "Sales Return updated but voucher number was not found, so Inventory Balance update cannot be called"
                    );
                }

                await syncInventoryBalance(
                    savedSalesReturnVoucherNumber,
                    true
                );

                if (
                    payload?.sInvVoucherNumber
                ) {
                    await syncSalesInvoiceStatusAfterReturnAnalysis(
                        payload?.sInvVoucherNumber
                    );
                }

                toast.success(
                    "Sales Return updated successfully"
                );
            } else {
                const result: any = await dispatch(
                    createSalesInvoiceReturn({
                        payload,
                    }) as any
                ).unwrap();

                const savedSalesReturnVoucherNumber =
                    resolveSavedSalesReturnVoucherNumber(
                        result
                    );

                if (!savedSalesReturnVoucherNumber) {
                    throw new Error(
                        "Sales Return created but voucher number was not found, so Inventory Balance save cannot be called"
                    );
                }

                await syncInventoryBalance(
                    savedSalesReturnVoucherNumber,
                    false
                );

                if (
                    payload?.sInvVoucherNumber
                ) {
                    await syncSalesInvoiceStatusAfterReturnAnalysis(
                        payload?.sInvVoucherNumber
                    );
                }

                toast.success(
                    "Sales Return created successfully"
                );
            }

            setShowModal(
                false
            );

            resetMainForm();

            fetchSalesInvoices();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message ||
                err?.message ||
                "Operation failed"
            );
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip.voucherNumber) return;
            const deletedRecord = salesInvoiceReturns?.find((item: any) => item?.sInvReturnVoucherNumber === confirmTooltip.voucherNumber);
            const linkedInvoiceVoucherNumber = deletedRecord?.sInvVoucherNumber || "";
            await dispatch(deleteSalesInvoiceReturn(confirmTooltip.voucherNumber) as any).unwrap();
            if (linkedInvoiceVoucherNumber) await syncSalesInvoiceStatusAfterReturnAnalysis(linkedInvoiceVoucherNumber);
            toast.success("Sales Return deleted successfully");
            fetchSalesInvoices();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete sales return");
        } finally {
            setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null });
        }
    };

    const handlePurchaseOrderSelect = (purchaseOrder: any) => setSelectedPurchaseOrder(purchaseOrder);

    const handlePurchaseOrderConfirm = () => {
        if (!selectedPurchaseOrder) {
            toast.error(
                "Please select purchase order"
            );

            return;
        }

        const poBody =
            selectedPurchaseOrder
                ?.sInvBody ||
            [];

        const products =
            poBody.length > 0
                ? poBody.map(
                    (item: any) => {
                        const unitCode =
                            item?.unit ||
                            item?.uom ||
                            "";

                        const baseRow = {
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
                                item?.quantity ||
                                "",

                            availableQuantity: null,

                            productType:
                                item?.productType ||
                                getProductMasterFromRow(item)?.productType ||
                                getProductMasterFromRow(item)?.dynamicFields?.productType ||
                                "",

                            unit:
                                unitCode,

                            uom:
                                item?.uom ||
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

                            _inventoryBalanceSelections: {},
                            _inventoryBalanceVoucherId: "",
                        };

                        return calculateRow(
                            normalizeRowKeys(
                                applyCustomMasterValues(
                                    templateFields?.body || [],
                                    baseRow,
                                    item?.customMasters || {}
                                )
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

        const baseForm = {
            ...getDefaultForm(),

            sInvReturnSalesAccount:
                selectedPurchaseOrder
                    .sInvSalesAccount ||
                "SA021",

            sInvReturnRemark:
                selectedPurchaseOrder
                    .sInvRemark ||
                "",

            sInvReturnCustomerCode:
                selectedPurchaseOrder
                    .sInvCustomerCode,

            sInvReturnCustomerName:
                selectedPurchaseOrder
                    .sInvCustomerName,

            sInvReturnVoucherDate:
                selectedPurchaseOrder
                    .sInvVoucherDate,

            sInvStatus:
                selectedPurchaseOrder
                    .sInvStatus ||
                selectedPurchaseOrder
                    .sInvReturnStatus ||
                "open",

            sInvReturnStatus:
                selectedPurchaseOrder
                    .sInvStatus ||
                "open",

            sInvVoucherNumber:
                selectedPurchaseOrder
                    ?.sInvVoucherNumber,

            products,
        };

        setForm(
            applyCustomMasterValues(
                templateFields?.header || [],
                baseForm,
                selectedPurchaseOrder
                    ?.customMasters ||
                {}
            )
        );

        setErrors({});
        setEditingRecord(null);
        setShowPurchaseOrderModal(false);
        setShowModal(true);
    };

    const isClosedSalesOrder = (record: any) => {
        const orderStatus = String(record?.sInvReturnStatus || "").toLowerCase();
        return orderStatus === "close" || orderStatus === "closed";
    };

    const handleEditSalesOrder = (record: any) => {
        if (isClosedSalesOrder(record)) {
            toast.error("You can't edit closed order");
            return;
        }
        openEditModal(record);
    };

    const handleDeleteSalesInvoiceClick = (e: any, record: any) => {
        if (isClosedSalesOrder(record)) {
            toast.error("You can't delete closed order");
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        let x = rect.left - 150;
        if (x < 10) x = 10;
        const y = rect.top + window.scrollY - 5;
        setConfirmTooltip({ show: true, x, y, voucherNumber: record?.sInvReturnVoucherNumber });
    };

    const footerValues = useMemo(() => ({ grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount, adjustedAmount: 0, balanceAmount: netAmount }), [grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || []).filter((field: any) => !field.isHidden).map((field: any) => {
            const rawValue = footerValues[field.key as keyof typeof footerValues] ?? 0;
            return { ...field, value: money(rawValue), rawValue };
        });
    }, [templateFields?.footer, footerValues]);

    useEffect(() => { fetchSalesInvoices(); }, [localOffset, localLimit, debouncedSearch, status]);

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
            const { fromDate, toDate } = getFinancialYearRange(todayYMD());

            const balanceRows = await Promise.all(
                (form?.products || []).map(async (item: any) => {
                    const productCode = String(item?.productCode || "").trim();
                    if (!productCode) {
                        return {
                            productCode,
                            productType: String(item?.productType || "").trim().toLowerCase(),
                            availableQuantity: null,
                        };
                    }

                    const productMaster = getProductMasterFromRow(item) || {};
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
                const currentProducts = [...(prev?.products || [])];

                const updatedProducts = currentProducts.map(
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
                            availableQuantity: balanceRow.availableQuantity,
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
    }, [showModal, productBalanceSignature, templateFields, dispatch, enableServiceProductInventory,]);

    useEffect(() => { dispatch(getAllTransactionSchema("salesReturn") as any); }, [dispatch]);

    useEffect(() => {
        (async () => {
            await dispatch(getAllSalesInvoice({ offset: 0, limit: 100, search: purchaseOrderSearch, status }) as any);
        })();
    }, [purchaseOrderSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const prepareFields = async () => {
            if (!transactionsSchema) return;
            const hasSchema = Array.isArray(transactionsSchema?.header) || Array.isArray(transactionsSchema?.body) || Array.isArray(transactionsSchema?.footer);
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

    useEffect(() => {
        dispatch(getAllReportMapping({ moduleType: "salesInvoiceReturn" }));
        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );
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

    // ★ ADDED: Open Account Master when a new Sales Return form opens
    // and no customer account exists.
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

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="sales-invoice-header" className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div id="sales-invoice-summary" className="flex items-start gap-3">
                    <Badge {...{ count: pagination?.totalDocs ?? salesInvoiceReturns?.length ?? 0, text: "Total Sales Invoices:", varient: "primary" }} />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Toggle {...{ arr: ["open", "close"], state: status, setState: handleStatusChange }} />
                    <SearchInput {...{ search, setSearch }} />
                    <DataREfreshButton {...{ callBackFn: handleRefresh, loading: refreshing }} />

                    <Permission module="bookez" permissionKey="salesReturn" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton {...{ callBackFn: openAddModal, text: "Add Sales Return" }} />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesInvoiceReturns}
                loading={loading}
                emptyMessage={`No ${status} sales invoice found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre) => ({ ...pre, show: true, moduleType: "salesInvoiceReturn", record, CustomerCode: record?.sInvReturnCustomerCode, voucherNumber: record?.sInvReturnVoucherNumber }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>

                        <Permission module="bookez" permissionKey="salesReturn" action="update">
                            <button
                                id="sales-invoice-edit-button"
                                onClick={() => handleEditSalesOrder(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="salesReturn" action="delete">
                            <button
                                id="sales-invoice-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => handleDeleteSalesInvoiceClick(e, record)}
                                className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </Permission>
                    </div>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    {...{
                        localLimit,
                        selectCb: (e: any) => {
                            setLocalLimit(Number(e.target.value));
                            setLocalOffset(0);
                        },
                        preDisabled: !pagination?.hasPrevPage,
                        nextDisabled: !pagination?.hasNextPage,
                        setLocalOffset,
                        pagination,
                    }}
                />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this sales return?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null })}
                />
            )}

            {!fieldsLoading && (
                <DynamicAddForm
                    {...{
                        show: showModal,
                        setShow: setShowModal,
                        edit: Boolean(editingRecord),
                        title: "Sales Return",
                        subtitle: "Fill in the sales invoice details below",
                        loading: createLoading || updateLoading,
                        onClose: () => {
                            setShowModal(false);
                            setCheckAccount(false);
                            setCheckProduct(false);
                            setProductSearchValue("");
                            resetMainForm();
                        },
                        onSubmit: handleSubmit,
                        form,
                        errors,
                        handleAddRow,
                        handleDeleteRow,
                        handleRowChange,
                        footerTotals,
                        inputData: {
                            ...templateFieldsWithCreateActions,
                            footer: dynamicFooterArray,
                        },
                        bodyKey: "products",
                        handleChange: handleMainChange,
                        bodyCellExtraRenderer: (column: any, row: any) =>
                            renderSalesReturnCellExtra(
                                column,
                                row,
                                enableServiceProductInventory
                            ),

                        // ★ ADDED: Common Account Master modal props
                        checkAccount,
                        setCheckAccount,
                        onAccountSaved: handleAccountSaved,
                    }}
                />
            )}

            <Modal
                show={showPurchaseOrderModal}
                setShow={setShowPurchaseOrderModal}
                title="Select Invoice Order"
                state={false}
                handleSubmit={handlePurchaseOrderConfirm}
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
                                onChange={(e) => setPurchaseOrderSearch(e.target.value)}
                                placeholder="Search Invoice code..."
                                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {invoiceLoader ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Loading invoices...
                                </div>
                            ) : salesInvoices.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    No invoice found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {salesInvoices.map((e: any, index: number) => {
                                        const poNumber = e?.sInvVoucherNumber || "-";
                                        const isSelected = selectedPurchaseOrder?.sInvVoucherNumber == e?.sInvVoucherNumber;
                                        return (
                                            <button
                                                key={poNumber || index}
                                                type="button"
                                                onClick={() => handlePurchaseOrderSelect(e)}
                                                className={`w-full rounded-xl border px-4 py-4 text-left transition ${isSelected
                                                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/10"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-base font-bold text-card-foreground">
                                                            {e?.sInvVoucherNumber || "NA"} - {e?.sInvCustomerName || "NA"}
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                            Items: {e?.sInvBody?.length || 0}
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
            <ProductMasterModal
                show={checkProduct}
                setShow={(value: boolean) => {
                    setCheckProduct(value);

                    if (!value) {
                        setProductTargetRowIndex(null);
                        setProductSearchValue("");
                    }
                }}
                onSaved={handleProductSaved}
                title="Add New Product"
                initialProductName={productSearchValue}
            />

            {/* @ts-ignore  */}
            <ListingModel {...{ show: downlaodPDF?.show, downlaodPDF, entryType: "sales-return", setShow: () => setDownlaodPDF(() => ({ show: !downlaodPDF?.show })), rowData: downlaodPDF?.record, report, title: "Download Sales Return PDF" }} />
        </div>
    );
};

export default SalesReturn;