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
import { fmtMoney, formatDateForInput, formatDateForList, getFinancialYearRange, isTrueValue, money, num, safePercent, todayYMD } from "../../../../../utils/helperFunctions";
import professionalAxios from "../../../../../services/professionalAxios";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import { createSalesInvoice, deleteSalesInvoice, getAllSalesInvoice, updateSalesInvoice } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import Modal, { ListingModel } from "../../../../../components/modal";
import { getAllSalesOrder, updateSalesOrder } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesOrderSlice";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import Permission from "../../../../../components/PermissionGuard";
import { getAllSystemConfigurations } from "../../../../../redux/slices/systemConf";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import ProductMasterModal from "../../../master/productMaster/ProductMasterFormModal";
import { getProductBalance, saveInventoryBalance, updateInventoryBalance } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";
import { getCompany } from "../../../../../redux/slices/professionalSlice/professionalCompanyMaster.slice";

const CUSTOMER_FIELD_KEYS = new Set(["sInvCustomerCode", "sInvCustomerName"]);
const PRODUCT_FIELD_KEYS = new Set(["productCode", "productName", "productId", "product"]);

const isPosPostingField = (field: any) => {
    const key = String(field?.key || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const label = String(field?.label || field?.title || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    return key === "isautopost" || key === "posposting" || label === "posposting";
};

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

const getInventoryTransactionApiKey = (field: any) => {
    if (!field) return "";
    const fieldNames = [field?.key, field?.label, field?.title, field?.customMasterName, field?.dataSource?.customMasterName].map(normalizeInventoryFieldName);
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
    const date = /^\d{4}-\d{2}-\d{2}$/.test(stringValue) ? new Date(`${stringValue}T00:00:00.000Z`) : new Date(stringValue);
    return Number.isNaN(date.getTime()) ? stringValue : date.toISOString();
};

const defaultPagination = { offset: 0, limit: 10, totalDocs: 0, totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };

// PARTIAL SALES ORDER: salesOrderPendingQuantity and salesOrderOrderedQuantity added only for frontend tracking
const emptyProductRow = { id: Date.now(), sOrderNumber: "", productCode: "", productName: "", productId: "", productDescription: "", description: "", productHSNCode: "", remarks: "", quantity: "", salesOrderPendingQuantity: null, salesOrderOrderedQuantity: null, availableQuantity: null, productType: "", uom: "", unit: "", unitName: "", rate: "", gross: 0, grossAmount: 0, discount: "", discountPercentage: "", discountAmount: "", taxableAmount: 0, cgst: "", cgstPercentage: "", cgstAmount: 0, sgst: "", sgstPercentage: "", sgstAmount: 0, igst: "", igstPercentage: "", igstAmount: 0, taxAmount: 0, otherAmount: "", netAmount: 0, netTotal: 0, marginProduct: false, taxRate: "", nonTaxRate: "", taxGross: "", nonTaxGross: "", customMasters: {}, _inventoryBalanceVoucherId: "" };

const getDefaultForm = () => ({ sInvVoucherNumber: "AUTO", sInvSalesOrderVoucherNumber: "", sInvVoucherDate: todayYMD(), sInvCustomerCode: "", sInvCustomerName: "", sInvSalesAccount: "SA021", sInvStatus: "open", sInvDocStatus: "open", sInvRemark: "", sInvRemarks: "", isAutoPost: false, customMasters: {}, products: [{ ...emptyProductRow, id: Date.now() }], grossAmount: "0.00", discountAmount: "0.00", cgstAmount: "0.00", sgstAmount: "0.00", igstAmount: "0.00", taxAmount: "0.00", otherAmount: "0.00", netAmount: "0.00" });

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

const CONDITIONAL_MARGIN_FIELD_KEYS = new Set(["taxRate", "nonTaxRate", "taxGross", "nonTaxGross"]);

const getDynamicFieldType = (field: any) => String(field?.type || field?.dataSource?.type || "").trim().toLowerCase().replace(/\s/g, "");

const isCustomMasterField = (field: any) => {
    const fieldType = getDynamicFieldType(field);
    return fieldType === "custommaster" || fieldType === "customemaster" || Boolean(field?.customMasterCode);
};

const getCustomMasterName = (field: any) => String(field?.customMasterName || field?.dataSource?.customMasterName || field?.label || field?.key || "").trim();

const getCustomMasterSelection = (field: any, selectedValue: any) => {
    if (selectedValue === undefined || selectedValue === null || String(selectedValue).trim() === "") return null;
    const selectedOption = (field?.options || []).find((option: any) => String(option?.value) === String(selectedValue));
    const raw = selectedOption?.raw || {};
    const nestedData = raw?.data && typeof raw.data === "object"
        ? raw.data
        : raw?.dynamicFields && typeof raw.dynamicFields === "object"
            ? raw.dynamicFields
            : raw?.customFields && typeof raw.customFields === "object"
                ? raw.customFields
                : {};

    return {
        code: String(selectedOption?.value || raw?.code || nestedData?.code || selectedValue || ""),
        name: String(selectedOption?.label || raw?.name || nestedData?.name || ""),
    };
};

export const loadFieldOptions = async (fields: any[]) => {
    const updatedFields = await Promise.all((fields || []).map(async (field) => {
        const apiUrl = field?.api || field?.dataSource?.api || (field?.customMasterCode ? `/users/customMaster/data/getAll?moduleCode=${field.customMasterCode}` : "");
        if (!apiUrl) return field;

        try {
            const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend${apiUrl}`, { params: field?.queryParams || field?.dataSource?.queryParams || {} });
            const records = getRecords(res.data);
            const labelField = field?.labelField || field?.dataSource?.labelField || "name";
            const valueField = field?.valueField || field?.dataSource?.valueField || "code";
            const options = Array.isArray(records)
                ? records.map((item: any) => ({
                    label: item?.[labelField] ?? item?.name ?? item?.productName ?? item?.accountName ?? "",
                    value: item?.[valueField] ?? item?.code ?? item?.productCode ?? item?.accountCode ?? item?._id ?? "",
                    raw: item,
                }))
                : [];
            return { ...field, options };
        }
        catch (error) {
            console.log(`Failed to load options for ${field.key}`, error);
            return { ...field, options: [] };
        }
    }));
    return updatedFields;
};

const loadAllTemplateOptions = async (templateData: any) => {
    const [updatedHeader, updatedBody, updatedFooter] = await Promise.all([
        loadFieldOptions(templateData?.header || []),
        loadFieldOptions(templateData?.body || []),
        loadFieldOptions(templateData?.footer || []),
    ]);

    return { ...templateData, header: updatedHeader, body: updatedBody, footer: updatedFooter };
};

const renderSalesInvoiceCellExtra = (column: any, row: any, enableServiceProductInventory: boolean) => {
    if (column?.key !== "quantity" || !row?.productCode) return null;
    const productType = String(row?.productType || "").trim().toLowerCase();
    if (productType === "nonstocks") return null;
    if (productType === "serviceproduct" && !enableServiceProductInventory) return null;

    return (
        <InputBorderLabel
            label="Avl Qty"
            value={row?.availableQuantity}
            loading={row?.availableQuantity === null || row?.availableQuantity === undefined}
            successWhenPositive
        />
    );
};

const SalesInVoice = () => {
    const dispatch = useDispatch<any>();
    const salesInvoiceState = useSelector((state: any) => state.salesInvoice);
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema);
    const { salesInvoices = [], pagination = defaultPagination, loading = false, createLoading = false, updateLoading = false, deleteLoading = false } = salesInvoiceState || {};

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");
    const [showModal, setShowModal] = useState(false);

    // ★ ADDED: Shared Account Master modal state
    const [checkAccount, setCheckAccount] = useState(false);

    // ⭐ YELLOW STAR: ADDED — PRODUCT MASTER MODAL STATE
    const [checkProduct, setCheckProduct] = useState(false);

    // ⭐ YELLOW STAR: ADDED — PRODUCT ROW THAT OPENED MODAL
    const [productTargetRowIndex, setProductTargetRowIndex] = useState<number | null>(null);

    // ⭐ YELLOW STAR: ADDED — PRODUCT SEARCH VALUE
    const [productSearchValue, setProductSearchValue] = useState("");

    // ★ ADDED: Prevent account modal check before Account Master API finishes
    const [accountListLoaded, setAccountListLoaded] = useState(false);

    const [editingRecord, setEditingRecord] = useState<any>(false);
    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const [purchaseOrderSearch, setPurchaseOrderSearch] = useState("");
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const [templateFields, setTemplateFields] = useState<any>({ header: [], body: [], footer: [] });

    const { configurations } = useSelector((state: any) => state.systemConfiguration);

    const enableServiceProductInventory = useMemo(() => {
        const value = configurations?.[0]?.inventoryConfiguration?.enableServiceProductInventory;
        return value === true || value === "true";
    }, [configurations]);

    const { accounts = [] } = useSelector((state: any) => state.accountMaster || {});

    // ★ ADDED: Keep only customer accounts
    const filterAccount = useMemo(() => {
        return (accounts || []).filter((account: any) => String(account?.accountType || "").toLowerCase() === "customer");
    }, [accounts]);

    // ⭐ YELLOW STAR: ADDED — ACCOUNT AND PRODUCT CREATE ACTIONS
    const templateFieldsWithCreateActions = useMemo(() => {
        return {
            ...templateFields,
            header: (templateFields?.header || []).map((field: any) => {
                const fieldKey = String(field?.key || "");
                if (!CUSTOMER_FIELD_KEYS.has(fieldKey)) return field;

                return {
                    ...field,
                    largeData: true,
                    showCreateOnEmpty: true,
                    onCreateOption: (_searchValue: string) => {
                        setCheckAccount(true);
                    },
                    createOptionLabel: (searchValue: string) => searchValue ? `+ Add "${searchValue}" as New Customer` : "+ Add New Customer",
                };
            }),
            body: (templateFields?.body || []).map((field: any) => {
                const fieldKey = String(field?.key || "");
                if (!PRODUCT_FIELD_KEYS.has(fieldKey)) return field;

                return {
                    ...field,
                    largeData: true,
                    showCreateOnEmpty: true,
                    onCreateOption: (searchValue: string, rowIndex: number) => {
                        setProductTargetRowIndex(rowIndex);
                        setProductSearchValue(searchValue);
                        setCheckProduct(true);
                    },
                    createOptionLabel: (searchValue: string) => searchValue ? `+ Add "${searchValue}" as New Product` : "+ Add New Product",
                };
            }),
        };
    }, [templateFields]);

    const posPostingField = useMemo(() => (templateFieldsWithCreateActions?.header || []).find((field: any) => isPosPostingField(field)), [templateFieldsWithCreateActions]);
    const posPostingFieldKey = String(posPostingField?.key || "isAutoPost");
    const posPostingEnabled = isTrueValue(form?.[posPostingFieldKey] ?? form?.isAutoPost);
    const posPostingDisabled = posPostingField?.disabled == true || posPostingField?.disabled == "true" || posPostingField?.isReadonly == true || posPostingField?.isReadonly == "true";

    const { salesOrders, loading: orderLoader } = useSelector((state: any) => state.salesOrder);
    const [fieldsLoading, setFieldsLoading] = useState(false);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
        salesOrderVoucherNumber: null,
    });

    const [downlaodPDF, setDownlaodPDF] = useState<any>({
        show: false,
        x: null,
        y: null,
        type: "",
    });

    const { report } = useSelector((s: any) => s.reportMapping);
    const { company } = useSelector((state: any) => state.professionalCompanyMaster);

    const getHeaderFieldByKey = (key: string) => templateFields?.header?.find((field: any) => field.key === key);
    const getBodyFieldByKey = (key: string) => templateFields?.body?.find((field: any) => field.key === key);
    const getOptionByValue = (field: any, selectedValue: any) => field?.options?.find((opt: any) => String(opt.value) === String(selectedValue));
    const isInventoryBalanceField = (field: any) => Boolean(getInventoryBalanceApiKey(field));

    const getInventoryBalanceFieldValue = (row: any, field: any) => {
        if (!row || !field) return "";

        const customMasterName = getCustomMasterName(field);
        const selectedMaster = row?.customMasters?.[customMasterName] || row?.customMasters?.[field?.key];
        const rawValue = selectedMaster?.code ?? row?.[field?.key] ?? row?.dynamicBodyFields?.[field?.key] ?? "";

        if (rawValue && typeof rawValue === "object") return rawValue?.code ?? rawValue?.value ?? "";
        return rawValue;
    };

    const getInventoryBalanceFilters = (row: any) => {
        const filters: any = {};
        const visibleBodyFields = (templateFields?.body || []).filter((field: any) => !isTrueValue(field?.isHidden));
        const visibleHeaderFields = (templateFields?.header || []).filter((field: any) => !isTrueValue(field?.isHidden));

        const inventoryApiKeys = new Set([
            ...visibleBodyFields,
            ...visibleHeaderFields,
        ].map((field: any) => getInventoryBalanceApiKey(field)).filter(Boolean));

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
            if (directValue !== undefined && directValue !== null && String(directValue).trim() !== "") return directValue;
        }

        const schemaField = (fields || []).find((field: any) => getInventoryTransactionApiKey(field) === apiKey);
        if (!schemaField?.key) return "";

        const customMasterName = getCustomMasterName(schemaField);
        const selectedMaster = source?.customMasters?.[customMasterName] || source?.customMasters?.[schemaField.key];
        const value = selectedMaster?.code ?? source?.[schemaField.key] ?? source?.dynamicBodyFields?.[schemaField.key] ?? "";

        if (value && typeof value === "object") return value?.code ?? value?.value ?? "";
        return value;
    };

    const getInventoryTransactionValue = (row: any, apiKey: string) => {
        const visibleBodyFields = (templateFields?.body || []).filter((field: any) => !isTrueValue(field?.isHidden));
        const visibleHeaderFields = (templateFields?.header || []).filter((field: any) => !isTrueValue(field?.isHidden));

        const bodyField = visibleBodyFields.find((field: any) => getInventoryTransactionApiKey(field) === apiKey);
        if (bodyField) return getInventoryFieldValue(row, visibleBodyFields, apiKey);

        const headerField = visibleHeaderFields.find((field: any) => getInventoryTransactionApiKey(field) === apiKey);
        if (headerField) return getInventoryFieldValue(form, visibleHeaderFields, apiKey);

        return "";
    };

    const getInventoryBalanceVoucherId = (row: any) => String(
        row?._inventoryBalanceVoucherId ||
        row?.inventoryBalanceVoucherId ||
        row?.inventoryBalanceId ||
        row?.inventoryVoucherId ||
        row?.inventoryBalance?.voucherId ||
        ""
    ).trim();

    const getInventoryBalanceRecords = (response: any) => {
        const data = response?.data?.data ?? response?.data ?? response ?? {};
        if (Array.isArray(data?.records)) return data.records;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.docs)) return data.docs;
        if (Array.isArray(data)) return data;
        return [];
    };

    const attachInventoryBalanceVoucherIds = (rows: any[], inventoryRecords: any[]) => {
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
                return voucherId && !usedVoucherIds.has(voucherId) && String(record?.productCode || "").trim() === productCode;
            });

            const exactRecord = availableRecords.find((record: any) =>
                String(record?.warehouseCode || "") === warehouseCode &&
                String(record?.locationCode || "") === locationCode &&
                String(record?.batchNumber || "") === batchNumber &&
                String(record?.rackCode || "") === rackCode &&
                String(record?.binCode || "") === binCode
            ) || availableRecords[0];

            const voucherId = String(exactRecord?.voucherId || "").trim();
            if (voucherId) usedVoucherIds.add(voucherId);

            return { ...row, _inventoryBalanceVoucherId: voucherId };
        });
    };

    const resolveSavedSalesInvoiceVoucherNumber = (response: any, fallback = "") => {
        const visited = new Set<any>();

        const findVoucherNumber = (value: any, depth = 0): string => {
            if (value === null || value === undefined || depth > 6 || typeof value !== "object" || visited.has(value)) return "";

            visited.add(value);

            const directKeys = [
                "sInvVoucherNumber",
                "salesInvoiceVoucherNumber",
                "invoiceVoucherNumber",
                "voucherNumber",
                "generatedVoucherNumber",
            ];

            for (const key of directKeys) {
                const candidate = value?.[key];
                if (candidate !== undefined && candidate !== null && String(candidate).trim() !== "" && String(candidate).trim().toUpperCase() !== "AUTO") {
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

        if (fallback && String(fallback).trim() && String(fallback).trim().toUpperCase() !== "AUTO") return String(fallback).trim();

        return "";
    };

    const buildInventoryBalancePayload = (row: any, voucherNumber: string) => {
        const invoiceStatus = String(form?.sInvStatus || form?.sInvDocStatus || "open").trim().toLowerCase();
        const inventoryStatus = ["close", "closed", "cancelled"].includes(invoiceStatus) ? "inactive" : "active";

        return {
            voucherNumber,
            voucherNumberSnapshot: form?.sInvVoucherNumber && form.sInvVoucherNumber !== "AUTO" ? form.sInvVoucherNumber : voucherNumber,
            voucherType: "salesInvoice",
            sourceModule: "salesInvoice",
            voucherStatus: inventoryStatus,
            voucherDate: toInventoryIsoDate(form?.sInvVoucherDate || todayYMD()),
            party: form?.sInvCustomerCode || form?.sInvCustomerName || "customer",
            productCode: String(row?.productCode || ""),
            productName: String(row?.productName || ""),
            productType: String(row?.productType || ""),
            uom: String(row?.uom || row?.unit || row?.unitName || ""),
            inwardQty: 0,
            outwardQty: num(row?.quantity),
            reservedQty: num(row?.reservedQty || 0),
            warehouseCode: String(getInventoryTransactionValue(row, "warehouseCode") || ""),
            locationCode: String(getInventoryTransactionValue(row, "locationCode") || ""),
            batchNumber: String(getInventoryTransactionValue(row, "batchNumber") || ""),
            rackCode: String(getInventoryTransactionValue(row, "rackCode") || ""),
            binCode: String(getInventoryTransactionValue(row, "binCode") || ""),
            mfgOn: toInventoryIsoDate(getInventoryTransactionValue(row, "mfgOn")),
            expOn: toInventoryIsoDate(getInventoryTransactionValue(row, "expOn")),
            remarks: row?.remarks || form?.sInvRemarks || form?.sInvRemark || "Sales Invoice",
            status: inventoryStatus,
        };
    };

    const syncInventoryBalance = async (voucherNumber: string, isEdit: boolean) => {
        const rows = (form?.products || []).filter((row: any) => {
            const productType = String(row?.productType || "").trim().toLowerCase();
            if (productType === "nonstocks") return false;
            if (productType === "serviceproduct" && !enableServiceProductInventory) return false;
            return String(row?.productCode || "").trim() !== "";
        });

        for (const row of rows) {
            const inventoryPayload = buildInventoryBalancePayload(row, voucherNumber);

            if (!isEdit) {
                console.log("CALLING SALES INVOICE INVENTORY BALANCE SAVE", inventoryPayload);
                await dispatch(saveInventoryBalance(inventoryPayload) as any).unwrap();
                continue;
            }

            const inventoryBalanceVoucherId = getInventoryBalanceVoucherId(row);

            if (inventoryBalanceVoucherId) {
                console.log("CALLING SALES INVOICE INVENTORY BALANCE UPDATE", inventoryBalanceVoucherId, inventoryPayload);
                await dispatch(updateInventoryBalance({ id: inventoryBalanceVoucherId, payload: inventoryPayload }) as any).unwrap();
            }
            else {
                console.log("NO SALES INVOICE INVENTORY VID - CALLING SAVE", inventoryPayload);
                await dispatch(saveInventoryBalance(inventoryPayload) as any).unwrap();
            }
        }
    };

    // ★ ADDED: Sales Invoice field normalization used on initial load
    // and again after creating a new Account Master record.
    const normalizeSalesInvoiceTemplateFields = (updatedData: any) => {
        const normalizedBody = (updatedData?.body || []).map((field: any) => {
            if (field?.key === "taxRate" || field?.key === "nonTaxRate") {
                return { ...field, isReadonly: false, disabled: false };
            }

            if (field?.key === "taxGross" || field?.key === "nonTaxGross") {
                return { ...field, isReadonly: true, disabled: true };
            }

            return field;
        });

        return { ...updatedData, body: normalizedBody };
    };

    const reloadTemplateFields = async () => {
        if (!transactionsSchema) return;
        const updatedData = await loadAllTemplateOptions(transactionsSchema);
        setTemplateFields(normalizeSalesInvoiceTemplateFields(updatedData));
    };

    const getProductMasterFromRow = (row: any) => {
        if (!row) return null;

        const rowProductValues = [row?.productCode, row?.productId, row?.productName]
            .filter((value) => value !== undefined && value !== null && value !== "")
            .map((value) => String(value));

        if (!rowProductValues.length) return null;

        const productFields = (templateFields?.body || []).filter((field: any) => ["productCode", "productId", "productName"].includes(field?.key));

        for (const field of productFields) {
            const selectedOption = (field?.options || []).find((option: any) => {
                const optionValues = [option?.value, option?.raw?._id, option?.raw?.productId, option?.raw?.productCode, option?.raw?.productName]
                    .filter((value) => value !== undefined && value !== null && value !== "")
                    .map((value) => String(value));

                return optionValues.some((value) => rowProductValues.includes(value));
            });

            if (selectedOption?.raw) return selectedOption.raw;
        }

        return null;
    };

    const isMarginProductRow = (row: any) => {
        if (isTrueValue(row?.marginProduct)) return true;
        const productMaster = getProductMasterFromRow(row);
        return isTrueValue(productMaster?.dynamicFields?.marginProduct ?? productMaster?.marginProduct);
    };

    const isBodyFieldVisibleForRow = (field: any, row: any) => {
        if (!field?.key || isTrueValue(field?.isHidden)) return false;
        if (CONDITIONAL_MARGIN_FIELD_KEYS.has(field.key)) return isMarginProductRow(row);
        return true;
    };

    const isBodyColumnVisible = (field: any, rows: any[]) => {
        if (!field?.key || isTrueValue(field?.isHidden)) return false;
        if (CONDITIONAL_MARGIN_FIELD_KEYS.has(field.key)) return (rows || []).some((row: any) => isMarginProductRow(row));
        return true;
    };

    const isBodyCellVisible = (field: any, row: any) => isBodyFieldVisibleForRow(field, row);

    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
        if (!field) return oldData;

        const selectedOption = getOptionByValue(field, selectedValue);
        const updated = { ...oldData, [field.key]: selectedValue };

        if (field?.mapFields && selectedOption?.raw) {
            Object.entries(field.mapFields).forEach(([targetKey, sourceKey]) => {
                updated[targetKey] = selectedOption.raw?.[sourceKey as string] ?? "";
            });
        }

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

    const calculateRow = (row: any, changedKey = "") => {
        const quantity = num(row.quantity);
        const rate = num(row.rate);
        const gross = quantity * rate;
        const marginProduct = isMarginProductRow(row);
        const taxGross = marginProduct ? num(row.taxRate) * quantity : 0;
        const nonTaxGross = marginProduct ? num(row.nonTaxRate) * quantity : 0;

        const changedDiscountKey = String(changedKey || "").trim().toLowerCase();
        const isDiscountPercentChanged = changedDiscountKey === "discount" || changedDiscountKey === "discountpercentage";
        const isDiscountAmountChanged = changedDiscountKey === "discountamount";

        const discountPercentSource = changedDiscountKey === "discount"
            ? row.discount
            : changedDiscountKey === "discountpercentage"
                ? row.discountPercentage
                : row.discountPercentage !== undefined && row.discountPercentage !== null && row.discountPercentage !== ""
                    ? row.discountPercentage
                    : row.discount;

        const hasDiscountPercent = discountPercentSource !== undefined && discountPercentSource !== null && discountPercentSource !== "";
        const hasDiscountAmount = row.discountAmount !== undefined && row.discountAmount !== null && row.discountAmount !== "";

        let discountPercent = hasDiscountPercent ? safePercent(discountPercentSource) : 0;

        const cgstPercent = safePercent(row.cgstPercentage !== undefined && row.cgstPercentage !== null && row.cgstPercentage !== "" ? row.cgstPercentage : row.cgst);
        const sgstPercent = safePercent(row.sgstPercentage !== undefined && row.sgstPercentage !== null && row.sgstPercentage !== "" ? row.sgstPercentage : row.sgst);
        const igstPercent = safePercent(row.igstPercentage !== undefined && row.igstPercentage !== null && row.igstPercentage !== "" ? row.igstPercentage : row.igst);

        let discountAmountValue: any = "";
        let calculatedDiscountAmount = 0;

        if (isDiscountAmountChanged) {
            if (hasDiscountAmount) {
                calculatedDiscountAmount = num(row.discountAmount);
                discountPercent = gross > 0 ? (calculatedDiscountAmount / gross) * 100 : 0;
                discountAmountValue = row.discountAmount;
            }
            else {
                calculatedDiscountAmount = 0;
                discountPercent = 0;
                discountAmountValue = "";
            }
        }
        else if (isDiscountPercentChanged) {
            if (hasDiscountPercent) {
                calculatedDiscountAmount = (gross * discountPercent) / 100;
                discountAmountValue = calculatedDiscountAmount;
            }
            else {
                calculatedDiscountAmount = 0;
                discountPercent = 0;
                discountAmountValue = "";
            }
        }
        else if (hasDiscountPercent) {
            calculatedDiscountAmount = (gross * discountPercent) / 100;
            discountAmountValue = calculatedDiscountAmount;
        }
        else if (hasDiscountAmount) {
            calculatedDiscountAmount = num(row.discountAmount);
            discountPercent = gross > 0 ? (calculatedDiscountAmount / gross) * 100 : 0;
            discountAmountValue = row.discountAmount;
        }

        const taxableAmount = gross - calculatedDiscountAmount;
        const cgstAmount = (taxableAmount * cgstPercent) / 100;
        const sgstAmount = (taxableAmount * sgstPercent) / 100;
        const igstAmount = (taxableAmount * igstPercent) / 100;
        const otherAmount = num(row.otherAmount);
        const taxAmount = cgstAmount + sgstAmount + igstAmount;
        const netAmount = taxableAmount + taxAmount + otherAmount;

        const discountPercentageValue = hasDiscountPercent || hasDiscountAmount ? discountPercent : "";

        return {
            ...row,
            quantity: row.quantity,
            rate: row.rate,
            discount: discountPercentageValue,
            discountPercentage: discountPercentageValue,
            cgst: cgstPercent,
            cgstPercentage: cgstPercent,
            sgst: sgstPercent,
            sgstPercentage: sgstPercent,
            igst: igstPercent,
            igstPercentage: igstPercent,
            otherAmount: row.otherAmount,
            gross,
            grossAmount: gross,
            discountAmount: discountAmountValue,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            taxAmount,
            netAmount,
            netTotal: netAmount,
            marginProduct,
            taxRate: marginProduct ? row.taxRate : "",
            nonTaxRate: marginProduct ? row.nonTaxRate : "",
            taxGross: marginProduct ? taxGross.toFixed(2) : "",
            nonTaxGross: marginProduct ? nonTaxGross.toFixed(2) : "",
        };
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
        }, {
            totalQuantity: 0,
            totalGrossAmount: 0,
            totalDiscountAmount: 0,
            totalCgstAmount: 0,
            totalSgstAmount: 0,
            totalIgstAmount: 0,
            totalTaxAmount: 0,
            totalOtherAmount: 0,
            totalNetAmount: 0,
        });
    };

    const footerTotals = useMemo(() => calculateFooter(form.products || []), [form.products]);
    const grossAmount = footerTotals.totalGrossAmount;
    const discountAmount = footerTotals.totalDiscountAmount;
    const cgstAmount = footerTotals.totalCgstAmount;
    const sgstAmount = footerTotals.totalSgstAmount;
    const igstAmount = footerTotals.totalIgstAmount;
    const netAmount = footerTotals.totalNetAmount;

    const fetchSalesInvoices = async () => {
        await dispatch(getAllSalesInvoice({
            offset: localOffset,
            limit: localLimit,
            search: debouncedSearch,
            status,
        }) as any);
    };

    const fetchSalesOrders = async () => {
        await dispatch(getAllSalesOrder({
            offset: 0,
            limit: 100,
            search: purchaseOrderSearch,
            status: "open",
        }) as any);
    };

    const syncSalesOrderStatus = async (voucherNumber: string, nextStatus: "open" | "close") => {
        if (!voucherNumber) return false;

        try {
            await dispatch(updateSalesOrder({
                voucherNumber,
                data: {
                    sOrderStatus: nextStatus,
                    sOrderDocStatus: nextStatus,
                },
            }) as any).unwrap();

            await fetchSalesOrders();
            return true;
        }
        catch (error) {
            toast.error("Sales invoice updated but failed to update sales order status");
            return false;
        }
    };

    // PARTIAL SALES ORDER: GET ORDERED / INVOICED / PENDING QUANTITY
    const getSalesOrderInvoiceSummary = async (voucherNumber: string) => {
        if (!voucherNumber) return null;

        const response = await professionalAxios.get(
            `/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoice/bySalesOrderId/summary/${encodeURIComponent(voucherNumber)}`
        );

        return response?.data?.data || response?.data || null;
    };

    // PARTIAL SALES ORDER: CLOSE ONLY WHEN PENDING QUANTITY BECOMES ZERO
    const syncSalesOrderStatusFromInvoiceSummary = async (voucherNumber: string) => {
        if (!voucherNumber) return false;

        try {
            const summary = await getSalesOrderInvoiceSummary(voucherNumber);
            const totalPendingQty = num(summary?.pending?.totalPendingQty);
            return await syncSalesOrderStatus(voucherNumber, totalPendingQty <= 0 ? "close" : "open");
        }
        catch (error: any) {
            console.log("Failed to sync Sales Order status from Sales Invoice summary", error);
            toast.error(error?.response?.data?.message || error?.message || "Failed to update Sales Order status");
            return false;
        }
    };

    const columns = [
        { key: "sInvVoucherNumber", title: "Voucher" },
        {
            key: "sInvVoucherDate",
            title: "Date",
            render: (row: any) => <>
                {row?.sInvVoucherDate ? formatDateForList(row.sInvVoucherDate) : "-"}
                <span className="text-sm block">
                    {row?.createdOn && new Date(row?.createdOn).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                    })}
                </span>
            </>
        },
        {
            key: "sInvCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">{row?.sInvCustomerName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{row?.sInvCustomerCode || "-"}</div>
                </div>
            ),
        },
        { key: "sInvBody", title: "Items", render: (row: any) => row?.sInvBody?.length || 0 },
        {
            key: "sInvFooter",
            title: "Net Amount",
            render: (row: any) => <span className="font-semibold text-primary">{money(row?.sInvFooter?.netAmount || 0)}</span>,
            type: "amount",
        },
        {
            key: "sInvDocStatus",
            title: "Doc Status",
            render: (row: any) => (
                <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${(row?.sInvDocStatus || row?.sInvStatus) === "open" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger"}`}>
                    {row?.sInvDocStatus || row?.sInvStatus || "-"}
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
        }
        finally {
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

    const loadAvailableQuantity = async (index: number, productCode: string, productType: string, rowData?: any) => {
        const normalizedProductType = String(productType || "").trim().toLowerCase();

        if (!productCode || normalizedProductType === "nonstocks" || (normalizedProductType === "serviceproduct" && !enableServiceProductInventory)) {
            setForm((previous: any) => {
                const updatedProducts = [...(previous.products || [])];
                if (!updatedProducts[index]) return previous;

                updatedProducts[index] = {
                    ...updatedProducts[index],
                    productType: normalizedProductType,
                    availableQuantity: null,
                };

                return { ...previous, products: updatedProducts };
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

            return { ...previous, products: updatedProducts };
        });

        try {
            const { fromDate, toDate } = getFinancialYearRange(todayYMD());

            const balance: any = await dispatch(getProductBalance({
                productCode,
                fromDate,
                toDate,
                ...getInventoryBalanceFilters(rowData || form?.products?.[index]),
            }) as any).unwrap();

            setForm((previous: any) => {
                const updatedProducts = [...(previous.products || [])];

                if (!updatedProducts[index] || String(updatedProducts[index]?.productCode || "") !== String(productCode)) return previous;

                updatedProducts[index] = {
                    ...updatedProducts[index],
                    productType: normalizedProductType,
                    availableQuantity: balance?.balanceQuantity !== undefined && balance?.balanceQuantity !== null ? balance.balanceQuantity : null,
                };

                return { ...previous, products: updatedProducts };
            });
        }
        catch (error) {
            console.log(`Failed to fetch available quantity for ${productCode}`, error);
        }
    };

    const openEditModal = async (record: any) => {
        const footer = record?.sInvFooter || {};

        const products = record?.sInvBody?.length > 0
            ? record.sInvBody.map((item: any) => {
                const unitCode = item?.unit || item?.uom || "";
                const productMaster = getProductMasterFromRow(item) || {};

                const bodyCustomMasterValues = Object.fromEntries((templateFields?.body || [])
                    .filter((field: any) => isCustomMasterField(field))
                    .map((field: any) => {
                        const customMasterName = getCustomMasterName(field);
                        const selectedMaster = item?.customMasters?.[customMasterName] || item?.customMasters?.[field?.key] || {};
                        return [field.key, selectedMaster?.code || ""];
                    }));

                return normalizeRowKeys({
                    id: item?.id || Date.now() + Math.random(),
                    ...bodyCustomMasterValues,
                    customMasters: item?.customMasters && typeof item.customMasters === "object" ? { ...item.customMasters } : {},
                    _inventoryBalanceVoucherId: item?._inventoryBalanceVoucherId || item?.inventoryBalanceVoucherId || item?.inventoryBalanceId || "",

                    // ✅ Preserve Sales Order number from invoice body
                    sOrderNumber: item?.sOrderNumber || record?.sInvSalesOrderVoucherNumber || "",

                    productCode: item?.productCode || "",
                    productName: item?.productName || "",
                    productId: item?.productId || "",
                    productDescription: item?.productDescription || item?.description || "",
                    description: item?.description || item?.productDescription || "",
                    productHSNCode: item?.productHSNCode || "",
                    remarks: item?.remarks || "",
                    quantity: item?.quantity || "",
                    availableQuantity: null,
                    productType: item?.productType || productMaster?.productType || productMaster?.dynamicFields?.productType || "",
                    unit: unitCode,
                    uom: unitCode,
                    unitName: item?.unitName || getUnitLabelFromSchema(unitCode),
                    rate: item?.rate || "",
                    gross: item?.gross || item?.grossAmount || 0,
                    grossAmount: item?.grossAmount || item?.gross || 0,
                    discount: item?.discount || item?.discountPercentage || "",
                    discountPercentage: item?.discountPercentage || item?.discount || "",
                    discountAmount: item?.discountAmount ?? "",
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
                    marginProduct: isTrueValue(item?.marginProduct ?? item?.dynamicBodyFields?.marginProduct ?? productMaster?.dynamicFields?.marginProduct ?? productMaster?.marginProduct),
                    taxRate: item?.taxRate ?? item?.dynamicBodyFields?.taxRate ?? "",
                    nonTaxRate: item?.nonTaxRate ?? item?.dynamicBodyFields?.nonTaxRate ?? "",
                    taxGross: item?.taxGross ?? item?.dynamicBodyFields?.taxGross ?? "",
                    nonTaxGross: item?.nonTaxGross ?? item?.dynamicBodyFields?.nonTaxGross ?? "",
                });
            })
            : [{ ...emptyProductRow, id: Date.now() }];

        let inventoryRecords: any[] = [];

        try {
            const inventoryResponse = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookez/inventoryBalance/getAll", {
                params: {
                    offset: 0,
                    limit: 500,
                    voucherNumber: record?.sInvVoucherNumber || "",
                },
            });

            inventoryRecords = getInventoryBalanceRecords(inventoryResponse);
        }
        catch (error) {
            console.log("Failed to load Sales Invoice inventory balance records", error);
        }

        const productsWithInventoryIds = attachInventoryBalanceVoucherIds(products, inventoryRecords);

        setEditingRecord(true);
        setErrors({});

        setForm({
            sInvVoucherNumber: record?.sInvVoucherNumber || "AUTO",
            sInvSalesOrderVoucherNumber: record?.sInvSalesOrderVoucherNumber || record?.sOrderVoucherNumber || record?.sInvOrderVoucherNumber || record?.sInvBody?.[0]?.sOrderNumber || record?.sInvBody?.find((item: any) => item?.sOrderNumber)?.sOrderNumber || "",
            sInvVoucherDate: formatDateForInput(record?.sInvVoucherDate),
            sInvCustomerCode: record?.sInvCustomerCode || "",
            sInvCustomerName: record?.sInvCustomerName || "",
            sInvSalesAccount: record?.sInvSalesAccount || "SA021",
            sInvDocStatus: record?.sInvDocStatus || record?.sInvStatus || "open",
            sInvStatus: record?.sInvStatus || record?.sInvDocStatus || "open",
            sInvRemark: record?.sInvRemark || record?.sInvRemarks || "",
            sInvRemarks: record?.sInvRemarks || record?.sInvRemark || "",
            isAutoPost: record?.isAutoPost || false,
            customMasters: record?.customMasters && typeof record.customMasters === "object" ? { ...record.customMasters } : {},
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

    useEffect(() => {
        if (!showModal || !editingRecord) return;
        if (!form?.products?.length) return;

        let cancelled = false;

        const fetchEditAvailableQuantities = async () => {
            const { fromDate, toDate } = getFinancialYearRange(todayYMD());

            const productsWithBalance = await Promise.all((form.products || []).map(async (item: any) => {
                const productCode = String(item?.productCode || "").trim();
                if (!productCode) return item;

                const productMaster = getProductMasterFromRow(item) || {};
                const productType = String(item?.productType || productMaster?.productType || productMaster?.dynamicFields?.productType || "").trim().toLowerCase();

                if (productType === "nonstocks" || (productType === "serviceproduct" && !enableServiceProductInventory)) {
                    return { ...item, productType, availableQuantity: null };
                }

                try {
                    const balance: any = await dispatch(getProductBalance({
                        productCode,
                        fromDate,
                        toDate,
                        ...getInventoryBalanceFilters(item),
                    }) as any).unwrap();

                    return {
                        ...item,
                        productType,
                        availableQuantity: balance?.balanceQuantity !== undefined && balance?.balanceQuantity !== null ? balance.balanceQuantity : null,
                    };
                }
                catch (error) {
                    console.log(`Failed to fetch available quantity for ${productCode}`, error);

                    return {
                        ...item,
                        productType,
                        availableQuantity: item?.availableQuantity ?? null,
                    };
                }
            }));

            if (cancelled) return;

            setForm((previous: any) => ({
                ...previous,
                products: productsWithBalance,
            }));
        };

        void fetchEditAvailableQuantities();

        return () => {
            cancelled = true;
        };
    }, [
        showModal,
        editingRecord,
        form?.sInvVoucherNumber,
        dispatch,
        enableServiceProductInventory,
    ]);

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const currentField = getHeaderFieldByKey(key);
            let updated = { ...prev, [key]: value };

            if (currentField?.mapFields) updated = applyMappedFields(currentField, value, updated);

            return updated;
        });

        setErrors((prev: any) => ({ ...prev, [key]: "" }));
    };

    const headerInventoryBalanceSignature = useMemo(() => {
        return (templateFields?.header || [])
            .filter((field: any) => !isTrueValue(field?.isHidden) && Boolean(getInventoryBalanceApiKey(field)))
            .map((field: any) => {
                const apiKey = getInventoryBalanceApiKey(field);
                const value = getInventoryBalanceFieldValue(form, field);
                return `${apiKey}:${String(value || "")}`;
            })
            .join("|");
    }, [form, templateFields?.header]);

    useEffect(() => {
        if (!showModal) return;

        const headerInventoryFields = (templateFields?.header || []).filter((field: any) => !isTrueValue(field?.isHidden) && Boolean(getInventoryBalanceApiKey(field)));

        if (!headerInventoryFields.length) return;

        (form?.products || []).forEach((row: any, index: number) => {
            const productCode = String(row?.productCode || "").trim();
            if (!productCode) return;

            const productType = String(row?.productType || "");
            void loadAvailableQuantity(index, productCode, productType, row);
        });
    }, [headerInventoryBalanceSignature]);

    // ★ ADDED: Refresh Sales Invoice customer options after
    // creating a customer from the shared Account Master modal.
    const handleAccountSaved = async (savedResponse: any) => {
        try {
            const accountResponse = await dispatch(getAllAccounts({
                offset: 0,
                limit: 100,
                search: "",
            }) as any).unwrap();

            setAccountListLoaded(true);

            // ★ Refresh module-specific report mapping
            await dispatch(getAllReportMapping({ moduleType: "salesInvoice" }) as any);

            // ★ Reload all schema API options, including Account Master
            await reloadTemplateFields();

            const savedAccount = savedResponse?.data?.account ||
                savedResponse?.data?.data ||
                savedResponse?.data ||
                savedResponse?.account ||
                savedResponse;

            const refreshedAccounts = accountResponse?.data?.accounts ||
                accountResponse?.data?.data?.accounts ||
                accountResponse?.accounts ||
                accountResponse?.data?.items ||
                accountResponse?.items ||
                accountResponse?.data ||
                [];

            const customerAccounts = Array.isArray(refreshedAccounts)
                ? refreshedAccounts.filter((account: any) => String(account?.accountType || "").toLowerCase() === "customer")
                : [];

            const savedCode = savedAccount?.accountCode || "";
            const savedName = savedAccount?.accountName || "";

            const createdCustomer = customerAccounts.find((account: any) =>
                (savedCode && String(account?.accountCode) === String(savedCode)) ||
                (savedName && String(account?.accountName) === String(savedName))
            ) ||
                (savedCode || savedName ? savedAccount : null) ||
                customerAccounts[customerAccounts.length - 1] ||
                null;

            if (createdCustomer) {
                setForm((prev: any) => ({
                    ...prev,
                    sInvCustomerCode: createdCustomer?.accountCode || prev?.sInvCustomerCode || "",
                    sInvCustomerName: createdCustomer?.accountName || prev?.sInvCustomerName || "",
                }));

                setErrors((prev: any) => ({
                    ...prev,
                    sInvCustomerCode: "",
                    sInvCustomerName: "",
                }));
            }
        }
        catch (error: any) {
            console.log("Failed to refresh Sales Invoice customer options:", error);
            toast.error(error?.message || "Account created, but Sales Invoice customer dropdown refresh failed");
        }
        finally {
            setCheckAccount(false);
        }
    };

    // ⭐ YELLOW STAR: ADDED — REFRESH PRODUCT OPTIONS AND SELECT NEW PRODUCT
    const handleProductSaved = async (savedResponse: any) => {
        try {
            await dispatch(getAllReportMapping({ moduleType: "salesInvoice" }) as any).unwrap();

            let updatedData = templateFields;

            if (transactionsSchema) {
                const loadedData = await loadAllTemplateOptions(transactionsSchema);
                updatedData = normalizeSalesInvoiceTemplateFields(loadedData);
                setTemplateFields(updatedData);
            }

            const savedProduct = savedResponse?.data?.product ||
                savedResponse?.data?.data?.product ||
                savedResponse?.data?.data ||
                savedResponse?.data ||
                savedResponse?.product ||
                savedResponse;

            const savedCode = savedProduct?.productCode || "";
            const savedName = savedProduct?.productName || "";

            const productFields = (updatedData?.body || []).filter((field: any) => PRODUCT_FIELD_KEYS.has(String(field?.key || "")));

            let selectedField: any = null;
            let selectedOption: any = null;

            for (const field of productFields) {
                const option = (field?.options || []).find((item: any) => {
                    const raw = item?.raw || {};

                    return (savedCode && String(raw?.productCode || item?.value || "") === String(savedCode)) ||
                        (savedName && String(raw?.productName || item?.label || "") === String(savedName));
                });

                if (option) {
                    selectedField = field;
                    selectedOption = option;
                    break;
                }
            }

            const createdProduct = selectedOption?.raw || savedProduct || {};

            setForm((previous: any) => {
                const updatedProducts = [...(previous.products || [])];

                let rowIndex = productTargetRowIndex !== null &&
                    productTargetRowIndex >= 0 &&
                    productTargetRowIndex < updatedProducts.length
                    ? productTargetRowIndex
                    : updatedProducts.findIndex((row: any) => !row?.productCode && !row?.productName && !row?.productId);

                if (rowIndex < 0) {
                    rowIndex = updatedProducts.length;

                    updatedProducts.push({
                        ...emptyProductRow,
                        id: Date.now(),
                        sOrderNumber: previous?.sInvSalesOrderVoucherNumber || "",
                    });
                }

                let updatedRow = { ...(updatedProducts[rowIndex] || emptyProductRow) };

                if (selectedField && selectedOption) {
                    updatedRow = applyMappedFields(selectedField, selectedOption.value, updatedRow);
                }

                const marginProduct = isTrueValue(createdProduct?.dynamicFields?.marginProduct ?? createdProduct?.marginProduct);

                updatedRow = {
                    ...updatedRow,
                    sOrderNumber: updatedRow?.sOrderNumber || previous?.sInvSalesOrderVoucherNumber || "",
                    productCode: createdProduct?.productCode || savedCode || updatedRow?.productCode || "",
                    productName: createdProduct?.productName || savedName || updatedRow?.productName || "",
                    productId: createdProduct?._id || createdProduct?.productId || updatedRow?.productId || "",
                    productDescription: createdProduct?.productDescription || updatedRow?.productDescription || "",
                    description: createdProduct?.productDescription || createdProduct?.description || updatedRow?.description || "",
                    productHSNCode: createdProduct?.productHSNCode || updatedRow?.productHSNCode || "",
                    unit: createdProduct?.unit || updatedRow?.unit || "",
                    uom: createdProduct?.unit || createdProduct?.uom || updatedRow?.uom || "",
                    rate: createdProduct?.sellingPrice ?? createdProduct?.rate ?? updatedRow?.rate ?? "",
                    marginProduct,
                    productType: createdProduct?.productType || createdProduct?.dynamicFields?.productType || "",
                    availableQuantity: null,
                    taxRate: marginProduct ? (createdProduct?.taxRate ?? createdProduct?.dynamicFields?.taxRate ?? updatedRow?.taxRate ?? "") : "",
                    nonTaxRate: marginProduct ? (createdProduct?.nonTaxRate ?? createdProduct?.dynamicFields?.nonTaxRate ?? updatedRow?.nonTaxRate ?? "") : "",
                };

                const selectedCustomer = filterAccount?.find((account: any) => account?.accountCode == previous?.sInvCustomerCode);

                const cgstValue = createdProduct?.csgst ??
                    createdProduct?.CGST ??
                    createdProduct?.cgst ??
                    createdProduct?.cgstRate ??
                    createdProduct?.cgstPercentage ??
                    createdProduct?.tax?.cgstPercentage ??
                    createdProduct?.tax?.cgst ??
                    "";

                const sgstValue = createdProduct?.csgst ??
                    createdProduct?.SGST ??
                    createdProduct?.sgst ??
                    createdProduct?.sgstRate ??
                    createdProduct?.sgstPercentage ??
                    createdProduct?.tax?.sgstPercentage ??
                    createdProduct?.tax?.sgst ??
                    "";

                const igstValue = createdProduct?.igst ??
                    createdProduct?.IGST ??
                    createdProduct?.igstRate ??
                    createdProduct?.igstPercentage ??
                    createdProduct?.tax?.igstPercentage ??
                    createdProduct?.tax?.igst ??
                    "";

                if (company?.state?.isoCode == selectedCustomer?.state?.isoCode) {
                    updatedRow.cgst = cgstValue;
                    updatedRow.cgstPercentage = cgstValue;
                    updatedRow.sgst = sgstValue;
                    updatedRow.sgstPercentage = sgstValue;
                    updatedRow.igst = "";
                    updatedRow.igstPercentage = "";
                    updatedRow.igstAmount = 0;
                }
                else {
                    updatedRow.igst = igstValue;
                    updatedRow.igstPercentage = igstValue;
                    updatedRow.cgst = "";
                    updatedRow.cgstPercentage = "";
                    updatedRow.sgst = "";
                    updatedRow.sgstPercentage = "";
                    updatedRow.cgstAmount = 0;
                    updatedRow.sgstAmount = 0;
                }

                updatedRow = calculateRow(normalizeRowKeys(updatedRow));
                updatedProducts[rowIndex] = updatedRow;

                return { ...previous, products: updatedProducts };
            });

            setErrors((previous: any) => ({
                ...previous,
                products: "",
            }));
        }
        catch (error: any) {
            console.log("Failed to refresh Sales Invoice product options:", error);
            toast.error(error?.message || "Product created, but Sales Invoice product dropdown refresh failed");
        }
        finally {
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

                    // ✅ Keep Sales Order number in newly added rows also
                    sOrderNumber: prev?.sInvSalesOrderVoucherNumber || "",
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedProducts = (prev.products || []).filter((_: any, i: number) => i !== index);

            return {
                ...prev,
                products: updatedProducts.length > 0
                    ? updatedProducts
                    : [{ ...emptyProductRow, id: Date.now(), sOrderNumber: prev?.sInvSalesOrderVoucherNumber || "" }],
            };
        });
    };

    const enableDuplicatePro = useMemo(() => {
        const locationConfig = configurations?.[0]?.systemConfiguration?.allowDuplicateProduct;
        return locationConfig === true || locationConfig === "true";
    }, [configurations]);

    const handleRowChange = (index: number, key: string, value: any) => {
        if (!form?.sInvCustomerCode) return toast.error("Please select customer first");

        const duplicate = key === "productCode" && Boolean(
            form?.products?.some((item: any, rowIndex: number) =>
                rowIndex !== index &&
                String(item?.productCode || "") === String(value || "")
            )
        );

        if (duplicate && !enableDuplicatePro) {
            setErrors((prev: any) => ({
                ...prev,
                products: "",
                [`row_${index}_${key}`]: "This product already added",
                [`row_${index}_tax`]: "",
            }));

            return;
        }

        const balanceField = getBodyFieldByKey(key);
        const balanceSelectedOption = getOptionByValue(balanceField, value);
        const balanceRaw = balanceSelectedOption?.raw || {};

        let balanceRow = { ...(form?.products?.[index] || {}), [key]: value };

        if (balanceField?.mapFields) balanceRow = applyMappedFields(balanceField, value, balanceRow);

        if (isCustomMasterField(balanceField)) {
            const customMasterName = getCustomMasterName(balanceField);
            const currentCustomMasters = balanceRow?.customMasters && typeof balanceRow.customMasters === "object" ? { ...balanceRow.customMasters } : {};
            const selectedMaster = getCustomMasterSelection(balanceField, value);

            if (!selectedMaster) delete currentCustomMasters[customMasterName];
            else currentCustomMasters[customMasterName] = selectedMaster;

            balanceRow.customMasters = currentCustomMasters;
        }

        if (PRODUCT_FIELD_KEYS.has(key)) {
            balanceRow.productCode = balanceRaw?.productCode || balanceRow?.productCode || balanceSelectedOption?.value || value || "";
            balanceRow.productType = balanceRaw?.productType || balanceRaw?.dynamicFields?.productType || balanceRow?.productType || "";
        }

        setForm((prev: any) => {
            const updatedProducts = [...(prev.products || [])];
            const currentRow = updatedProducts[index] || {};
            const currentField = getBodyFieldByKey(key);

            let updatedRow = { ...currentRow, [key]: value };

            if (currentField?.mapFields) updatedRow = applyMappedFields(currentField, value, updatedRow);

            const selectedOption = getOptionByValue(currentField, value);
            const raw = selectedOption?.raw || {};

            if (isCustomMasterField(currentField)) {
                const customMasterName = getCustomMasterName(currentField);
                const currentCustomMasters = updatedRow?.customMasters && typeof updatedRow.customMasters === "object" ? { ...updatedRow.customMasters } : {};
                const selectedMaster = getCustomMasterSelection(currentField, value);

                if (!selectedMaster) delete currentCustomMasters[customMasterName];
                else currentCustomMasters[customMasterName] = selectedMaster;

                updatedRow.customMasters = currentCustomMasters;
            }

            if (raw?._id && !updatedRow.productId) updatedRow.productId = raw._id;

            updatedRow = normalizeRowKeys(updatedRow);

            if (key === "productCode" || key === "productName" || key === "productId") {
                const getCustomer = filterAccount?.find((e: any) => e.accountCode == prev?.sInvCustomerCode);

                updatedRow.productType = raw?.productType || raw?.dynamicFields?.productType || "";
                updatedRow.availableQuantity = null;

                const cgstValue = raw?.csgst ??
                    raw?.CGST ??
                    raw?.cgst ??
                    raw?.cgstRate ??
                    raw?.cgstPercentage ??
                    raw?.tax?.cgstPercentage ??
                    raw?.tax?.cgst ??
                    "";

                const sgstValue = raw?.csgst ??
                    raw?.SGST ??
                    raw?.sgst ??
                    raw?.sgstRate ??
                    raw?.sgstPercentage ??
                    raw?.tax?.sgstPercentage ??
                    raw?.tax?.sgst ??
                    "";

                const igstValue = raw?.igst ??
                    raw?.IGST ??
                    raw?.igstRate ??
                    raw?.igstPercentage ??
                    raw?.tax?.igstPercentage ??
                    raw?.tax?.igst ??
                    "";

                const marginProduct = isTrueValue(raw?.dynamicFields?.marginProduct);
                updatedRow.marginProduct = marginProduct;

                if (!marginProduct) {
                    updatedRow.taxRate = "";
                    updatedRow.nonTaxRate = "";
                    updatedRow.taxGross = "";
                    updatedRow.nonTaxGross = "";
                }

                if (company?.state?.isoCode == getCustomer?.state?.isoCode) {
                    updatedRow.cgst = cgstValue;
                    updatedRow.cgstPercentage = cgstValue;
                    updatedRow.sgst = sgstValue;
                    updatedRow.sgstPercentage = sgstValue;
                    updatedRow.igst = "";
                    updatedRow.igstPercentage = "";
                    updatedRow.igstAmount = 0;
                }
                else {
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

            // ✅ Make sure Sales Order number never gets lost
            updatedRow.sOrderNumber = updatedRow.sOrderNumber || prev?.sInvSalesOrderVoucherNumber || "";

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

            if ((isCgst || isSgst) && num(value) > 0) {
                updatedRow.igst = "";
                updatedRow.igstPercentage = "";
                updatedRow.igstAmount = 0;
            }

            if (isIgst && num(value) > 0) {
                updatedRow.cgst = "";
                updatedRow.cgstPercentage = "";
                updatedRow.sgst = "";
                updatedRow.sgstPercentage = "";
                updatedRow.cgstAmount = 0;
                updatedRow.sgstAmount = 0;
            }

            updatedRow = calculateRow(updatedRow, key);
            updatedProducts[index] = updatedRow;

            return { ...prev, products: updatedProducts };
        });

        if (PRODUCT_FIELD_KEYS.has(key) || isInventoryBalanceField(balanceField)) {
            const productCode = String(balanceRow?.productCode || "").trim();
            const productType = String(balanceRow?.productType || "");

            if (productCode) void loadAvailableQuantity(index, productCode, productType, balanceRow);
        }

        setErrors((prev: any) => ({
            ...prev,
            products: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_tax`]: "",
        }));
    };

    const getFilledRows = () => {
        return (form.products || []).filter((row: any) => {
            const visibleFields = (templateFields?.body || []).filter((field: any) => isBodyFieldVisibleForRow(field, row));

            return visibleFields.some((field: any) => {
                const value = row?.[field.key];
                return value !== undefined && value !== null && value !== "";
            });
        });
    };

    const validateForm = () => {
        const err: any = {};

        (templateFields?.header || []).forEach((field: any) => {
            if (isTrueValue(field?.isHidden)) return;
            if (!isTrueValue(field?.isRequired)) return;

            const value = form?.[field.key];

            if (value === undefined || value === null || value === "") {
                err[field.key] = `${field.label || field.title || field.key} is required`;
            }
        });

        const filledRows = getFilledRows();

        if (filledRows.length === 0) {
            err.products = "Please add at least one product";
        }

        (form.products || []).forEach((row: any, index: number) => {
            const visibleFields = (templateFields?.body || []).filter((field: any) => isBodyFieldVisibleForRow(field, row));

            const hasAnyValue = visibleFields.some((field: any) => {
                const value = row?.[field.key];
                return value !== undefined && value !== null && value !== "";
            });

            if (!hasAnyValue) return;

            visibleFields.forEach((field: any) => {
                if (!isTrueValue(field?.isRequired)) return;

                const value = row?.[field.key];

                if (value === undefined || value === null || value === "") {
                    err[`row_${index}_${field.key}`] = `${field.label || field.title || field.key} is required`;
                }
            });

            // PARTIAL SALES ORDER: DO NOT ALLOW MORE THAN REMAINING ORDER QUANTITY
            // Edit flow is intentionally untouched.
            if (
                !editingRecord &&
                row?.sOrderNumber &&
                row?.salesOrderPendingQuantity !== null &&
                row?.salesOrderPendingQuantity !== undefined &&
                num(row?.quantity) > num(row?.salesOrderPendingQuantity)
            ) {
                err[`row_${index}_quantity`] = `Quantity cannot exceed pending Sales Order quantity ${num(row.salesOrderPendingQuantity)}`;
            }

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

        return (form.products || [])
            .filter((row: any) => bodyKeys.some((key: string) => {
                const value = row?.[key];
                return value !== undefined && value !== null && value !== "";
            }))
            .map((row: any) => calculateRow(normalizeRowKeys(row)));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const footer = calculateFooter(products);

        const payload: any = {
            sInvSalesOrderVoucherNumber: form?.sInvSalesOrderVoucherNumber || "",
            sInvCustomerCode: form.sInvCustomerCode,
            sInvCustomerName: form.sInvCustomerName,
            sInvVoucherDate: form.sInvVoucherDate,
            sInvStatus: form.sInvStatus || form.sInvDocStatus || "open",
            sInvRemarks: form.sInvRemarks || form.sInvRemark || "",
            sInvSalesAccount: form.sInvSalesAccount || "SA021",
            isAutoPost: isTrueValue(form?.[posPostingFieldKey] ?? form?.isAutoPost),

            // sInvDocStatus: form.sInvDocStatus || form.sInvStatus || "open",
            sOrderNumber: products?.[0]?.sOrderNumber || form?.sInvSalesOrderVoucherNumber || "",

            customMasters: form?.customMasters && typeof form.customMasters === "object"
                ? form.customMasters
                : {},

            sInvBody: products.map((item: any) => {
                const marginProduct = isMarginProductRow(item);

                return {
                    // ✅ Store Sales Order voucher in invoice body also
                    sOrderNumber: item?.sOrderNumber || form?.sInvSalesOrderVoucherNumber || "",

                    productCode: item.productCode,
                    productName: item.productName,

                    // productId: item.productId,

                    productDescription: item.productDescription || item.description,
                    description: item.description || item.productDescription,
                    productHSNCode: item.productHSNCode,
                    remarks: item.remarks,
                    quantity: String(item.quantity),
                    unit: item.unit || item.uom,
                    uom: item.uom || item.unit,
                    unitName: item.unitName,
                    rate: String(item.rate),
                    gross: fmtMoney(item.grossAmount),
                    grossAmount: fmtMoney(item.grossAmount),
                    discount: String(item.discountPercentage || item.discount || ""),
                    discountPercentage: String(item.discountPercentage || item.discount || ""),
                    discountAmount: fmtMoney(item.discountAmount),
                    taxableAmount: fmtMoney(item.taxableAmount),
                    cgst: String(item.cgstPercentage || item.cgst || ""),
                    cgstPercentage: String(item.cgstPercentage || item.cgst || ""),
                    cgstAmount: fmtMoney(item.cgstAmount),
                    sgst: String(item.sgstPercentage || item.sgst || ""),
                    sgstPercentage: String(item.sgstPercentage || item.sgst || ""),
                    sgstAmount: fmtMoney(item.sgstAmount),
                    igst: String(item.igstPercentage || item.igst || ""),
                    igstPercentage: String(item.igstPercentage || item.igst || ""),
                    igstAmount: fmtMoney(item.igstAmount),
                    taxAmount: fmtMoney(item.taxAmount),
                    otherAmount: fmtMoney(item.otherAmount),
                    netAmount: fmtMoney(item.netAmount || item.netTotal),
                    netTotal: fmtMoney(item.netTotal || item.netAmount),

                    marginProduct,

                    taxRate: marginProduct ? String(item.taxRate ?? "") : "",
                    nonTaxRate: marginProduct ? String(item.nonTaxRate ?? "") : "",
                    taxGross: marginProduct ? fmtMoney(item.taxGross) : "",
                    nonTaxGross: marginProduct ? fmtMoney(item.nonTaxGross) : "",

                    customMasters: item?.customMasters && typeof item.customMasters === "object"
                        ? item.customMasters
                        : {},

                    dynamicBodyFields: {
                        ...Object.fromEntries(
                            Object.entries(item?.dynamicBodyFields || {}).filter(
                                ([fieldKey]) => !CONDITIONAL_MARGIN_FIELD_KEYS.has(fieldKey)
                            )
                        ),

                        ...(marginProduct
                            ? {
                                taxRate: String(item.taxRate ?? ""),
                                nonTaxRate: String(item.nonTaxRate ?? ""),
                                taxGross: fmtMoney(item.taxGross),
                                nonTaxGross: fmtMoney(item.nonTaxGross),
                            }
                            : {}),
                    },
                };
            }),

            sInvFooter: {
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
            },
        };

        try {
            if (editingRecord) {
                const result: any = await dispatch(updateSalesInvoice({
                    sInvVoucherNumber: form?.sInvVoucherNumber,
                    payload,
                }) as any).unwrap();

                const savedSalesInvoiceVoucherNumber = resolveSavedSalesInvoiceVoucherNumber(
                    result,
                    form?.sInvVoucherNumber
                );

                if (!savedSalesInvoiceVoucherNumber) {
                    throw new Error(
                        "Sales Invoice updated but voucher number was not found, so Inventory Balance update cannot be called"
                    );
                }

                await syncInventoryBalance(savedSalesInvoiceVoucherNumber, true);

                toast.success("Sales invoice updated successfully");
            }
            else {
                const result: any = await dispatch(createSalesInvoice({
                    payload,
                }) as any).unwrap();

                const savedSalesInvoiceVoucherNumber = resolveSavedSalesInvoiceVoucherNumber(result);

                if (!savedSalesInvoiceVoucherNumber) {
                    throw new Error(
                        "Sales Invoice created but voucher number was not found, so Inventory Balance save cannot be called"
                    );
                }

                await syncInventoryBalance(savedSalesInvoiceVoucherNumber, false);

                // PARTIAL SALES ORDER: DO NOT CLOSE ORDER DIRECTLY.
                // Recheck pending quantity after invoice is created.
                if (form?.sInvSalesOrderVoucherNumber) {
                    await syncSalesOrderStatusFromInvoiceSummary(
                        form.sInvSalesOrderVoucherNumber
                    );
                }

                toast.success("Sales invoice created successfully");
            }

            setShowModal(false);
            setCheckAccount(false);
            resetMainForm();
            fetchSalesInvoices();
        }
        catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.voucherNumber) {
                return toast.warning(
                    "Sales invoice deleted, but sales order voucher number not found"
                );
            }

            const salesOrderVoucherNumber = confirmTooltip?.salesOrderVoucherNumber;

            await dispatch(
                deleteSalesInvoice(confirmTooltip.voucherNumber) as any
            ).unwrap();

            // PARTIAL SALES ORDER: RECALCULATE STATUS AFTER DELETING INVOICE
            if (salesOrderVoucherNumber) {
                await syncSalesOrderStatusFromInvoiceSummary(
                    salesOrderVoucherNumber
                );
            }

            toast.success("Sales invoice deleted successfully");
            await fetchSalesInvoices();
        }
        catch (err: any) {
            toast.error(err?.message || "Failed to delete sales invoice");
        }
        finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
                salesOrderVoucherNumber: null,
            });
        }
    };

    const isClosedSalesOrder = (record: any) => {
        const orderStatus = String(record?.sInvStatus || "").toLowerCase();
        return orderStatus === "close" || orderStatus === "closed";
    };

    const handleEditSalesOrder = (record: any) => {
        if (isClosedSalesOrder(record)) {
            toast.error("You can't edit closed order");
            return;
        }

        openEditModal(record);
    };

    const footerValues = useMemo(() => ({
        grossAmount,
        discountAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        netAmount,
        adjustedAmount: 0,
        balanceAmount: netAmount,
    }), [
        grossAmount,
        discountAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        netAmount,
    ]);

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

    const salesInvoiceInputData = useMemo(() => ({
        ...templateFieldsWithCreateActions,
        header: (templateFieldsWithCreateActions?.header || []).filter(
            (field: any) => !isPosPostingField(field)
        ),
        footer: dynamicFooterArray,
    }), [templateFieldsWithCreateActions, dynamicFooterArray]);

    // PARTIAL SALES ORDER: LOAD ONLY PENDING QUANTITY
    const handlePurchaseOrderConfirm = async () => {
        if (!selectedPurchaseOrder) {
            toast.error("Please select Sales Order");
            return;
        }

        const salesOrderVoucherNumber =
            selectedPurchaseOrder?.sOrderVoucherNumber || "";

        let salesOrderSummary: any = null;

        try {
            salesOrderSummary = await getSalesOrderInvoiceSummary(
                salesOrderVoucherNumber
            );
        }
        catch (error: any) {
            console.log(
                "Failed to load Sales Order pending quantity",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load Sales Order pending quantity"
            );

            return;
        }

        const pendingProducts = Array.isArray(
            salesOrderSummary?.pending?.products
        )
            ? salesOrderSummary.pending.products
            : [];

        const hasPendingSummary = Array.isArray(
            salesOrderSummary?.pending?.products
        );

        const remainingPendingQtyByProduct = new Map<
            string,
            number
        >();

        pendingProducts.forEach((item: any) => {
            const productCode = String(
                item?.productCode || ""
            ).trim();

            if (productCode) {
                remainingPendingQtyByProduct.set(
                    productCode,
                    num(item?.pendingQty)
                );
            }
        });

        const poBody = selectedPurchaseOrder?.sOrderBody || [];

        const products = poBody?.length
            ? poBody
                .map((item: any) => {
                    const productMaster =
                        getProductMasterFromRow(item) || {};

                    const productCode = String(
                        item?.productCode || ""
                    ).trim();

                    const orderedQuantity = num(
                        item?.quantity
                    );

                    // If pending summary exists:
                    // product absent from pending list means fully invoiced = 0.
                    // If pending summary is unavailable:
                    // retain original Sales Order quantity.
                    const currentPendingQuantity =
                        hasPendingSummary
                            ? remainingPendingQtyByProduct.has(
                                productCode
                            )
                                ? num(
                                    remainingPendingQtyByProduct.get(
                                        productCode
                                    )
                                )
                                : 0
                            : orderedQuantity;

                    const rowPendingQuantity = Math.min(
                        Math.max(
                            orderedQuantity,
                            0
                        ),
                        Math.max(
                            currentPendingQuantity,
                            0
                        )
                    );

                    if (productCode) {
                        remainingPendingQtyByProduct.set(
                            productCode,
                            Math.max(
                                currentPendingQuantity -
                                rowPendingQuantity,
                                0
                            )
                        );
                    }

                    const bodyCustomMasterValues =
                        Object.fromEntries(
                            (
                                templateFields?.body ||
                                []
                            )
                                .filter(
                                    (field: any) =>
                                        isCustomMasterField(
                                            field
                                        )
                                )
                                .map(
                                    (field: any) => {
                                        const customMasterName =
                                            getCustomMasterName(
                                                field
                                            );

                                        const selectedMaster =
                                            item
                                                ?.customMasters
                                            ?.[
                                            customMasterName
                                            ] ||
                                            item
                                                ?.customMasters
                                            ?.[
                                            field
                                                ?.key
                                            ] ||
                                            {};

                                        return [
                                            field.key,
                                            selectedMaster
                                                ?.code ||
                                            "",
                                        ];
                                    }
                                )
                        );

                    const productType = String(
                        item?.productType ||
                        productMaster
                            ?.productType ||
                        productMaster
                            ?.dynamicFields
                            ?.productType ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                    return calculateRow(
                        normalizeRowKeys({
                            id:
                                Date.now() +
                                Math.random(),

                            ...bodyCustomMasterValues,

                            customMasters:
                                item
                                    ?.customMasters &&
                                    typeof item.customMasters ===
                                    "object"
                                    ? {
                                        ...item.customMasters,
                                    }
                                    : {},

                            _inventoryBalanceVoucherId:
                                "",

                            sOrderNumber:
                                salesOrderVoucherNumber,

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
                                item
                                    ?.productDescription ||
                                item?.description ||
                                "",

                            description:
                                item?.description ||
                                item
                                    ?.productDescription ||
                                "",

                            productHSNCode:
                                item
                                    ?.productHSNCode ||
                                "",

                            remarks:
                                item?.remarks ||
                                "",

                            // IMPORTANT:
                            // Quantity is now remaining/pending Sales Order quantity.
                            quantity: String(
                                rowPendingQuantity
                            ),

                            // Frontend-only fields.
                            salesOrderPendingQuantity:
                                rowPendingQuantity,

                            salesOrderOrderedQuantity:
                                orderedQuantity,

                            availableQuantity:
                                null,

                            productType,

                            unit:
                                item?.unit,

                            uom:
                                item?.uom,

                            unitName:
                                item?.unitName ||
                                getUnitLabelFromSchema(
                                    item?.unit ||
                                    item?.uom
                                ),

                            rate:
                                item?.rate ||
                                "",

                            gross:
                                item?.gross ||
                                item
                                    ?.grossAmount ||
                                0,

                            grossAmount:
                                item
                                    ?.grossAmount ||
                                item?.gross ||
                                0,

                            discount:
                                item?.discount ||
                                item
                                    ?.discountPercentage ||
                                "",

                            discountPercentage:
                                item
                                    ?.discountPercentage ||
                                item?.discount ||
                                "",

                            discountAmount:
                                item
                                    ?.discountAmount ??
                                "",

                            taxableAmount:
                                item
                                    ?.taxableAmount ||
                                0,

                            cgst:
                                item?.cgst ||
                                item
                                    ?.cgstPercentage ||
                                "",

                            cgstPercentage:
                                item
                                    ?.cgstPercentage ||
                                item?.cgst ||
                                "",

                            cgstAmount:
                                item?.cgstAmount ||
                                0,

                            sgst:
                                item?.sgst ||
                                item
                                    ?.sgstPercentage ||
                                "",

                            sgstPercentage:
                                item
                                    ?.sgstPercentage ||
                                item?.sgst ||
                                "",

                            sgstAmount:
                                item?.sgstAmount ||
                                0,

                            igst:
                                item?.igst ||
                                item
                                    ?.igstPercentage ||
                                "",

                            igstPercentage:
                                item
                                    ?.igstPercentage ||
                                item?.igst ||
                                "",

                            igstAmount:
                                item?.igstAmount ||
                                0,

                            taxAmount:
                                item?.taxAmount ||
                                0,

                            otherAmount:
                                item
                                    ?.otherAmount ||
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

                            taxRate:
                                item?.taxRate ??
                                item
                                    ?.dynamicBodyFields
                                    ?.taxRate ??
                                "",

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
                        })
                    );
                })
                // Fully invoiced products should not load again.
                .filter(
                    (item: any) =>
                        !item?.productCode ||
                        num(
                            item
                                ?.salesOrderPendingQuantity
                        ) > 0
                )
            : [
                {
                    ...emptyProductRow,
                    id: Date.now(),
                    sOrderNumber:
                        salesOrderVoucherNumber,
                },
            ];

        // Sales Order already completely invoiced.
        if (
            poBody?.length &&
            products.length === 0
        ) {
            await syncSalesOrderStatus(
                salesOrderVoucherNumber,
                "close"
            );

            toast.info(
                "This Sales Order is already fully invoiced"
            );

            setShowPurchaseOrderModal(false);
            setSelectedPurchaseOrder(null);

            return;
        }

        const { fromDate, toDate } =
            getFinancialYearRange(
                todayYMD()
            );

        // EXISTING INVENTORY AVAILABLE QUANTITY LOGIC UNCHANGED
        const productsWithBalance =
            await Promise.all(
                products.map(
                    async (item: any) => {
                        const productCode =
                            String(
                                item?.productCode ||
                                ""
                            ).trim();

                        if (!productCode)
                            return item;

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
                            productType ===
                            "nonstocks" ||
                            (productType ===
                                "serviceproduct" &&
                                !enableServiceProductInventory)
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
                                    getProductBalance(
                                        {
                                            productCode,
                                            fromDate,
                                            toDate,
                                            ...getInventoryBalanceFilters(
                                                item
                                            ),
                                        }
                                    ) as any
                                ).unwrap();

                            return {
                                ...item,
                                productType,
                                availableQuantity:
                                    balance
                                        ?.balanceQuantity !==
                                        undefined &&
                                        balance
                                            ?.balanceQuantity !==
                                        null
                                        ? balance
                                            .balanceQuantity
                                        : null,
                            };
                        }
                        catch (error) {
                            console.log(
                                `Failed to fetch available quantity for ${productCode}`,
                                error
                            );

                            return {
                                ...item,
                                productType,
                                availableQuantity:
                                    null,
                            };
                        }
                    }
                )
            );

        setForm({
            ...getDefaultForm(),

            sInvVoucherNumber:
                "AUTO",

            sInvSalesOrderVoucherNumber:
                salesOrderVoucherNumber,

            sInvVoucherDate:
                formatDateForInput(
                    selectedPurchaseOrder
                        ?.sOrderVoucherDate
                ),

            sInvCustomerCode:
                selectedPurchaseOrder
                    ?.sOrderCustomerCode ||
                "",

            sInvCustomerName:
                selectedPurchaseOrder
                    ?.sOrderCustomerName ||
                "",

            sInvSalesAccount:
                selectedPurchaseOrder
                    ?.sOrderSalesAccount ||
                "SA021",

            sInvDocStatus:
                selectedPurchaseOrder
                    ?.sOrderDocStatus ||
                "open",

            sInvStatus:
                selectedPurchaseOrder
                    ?.sOrderStatus ||
                "open",

            sInvRemark:
                selectedPurchaseOrder
                    ?.sOrderRemark ||
                "",

            sInvRemarks:
                selectedPurchaseOrder
                    ?.sOrderRemarks ||
                selectedPurchaseOrder
                    ?.sOrderRemark ||
                "",

            isAutoPost:
                selectedPurchaseOrder
                    ?.isAutoPost ||
                false,

            customMasters:
                selectedPurchaseOrder
                    ?.customMasters &&
                    typeof selectedPurchaseOrder.customMasters ===
                    "object"
                    ? {
                        ...selectedPurchaseOrder.customMasters,
                    }
                    : {},

            products:
                productsWithBalance,
        });

        setErrors({});
        setEditingRecord(null);
        setShowPurchaseOrderModal(false);
        setSelectedPurchaseOrder(null);
        setShowModal(true);
    };

    const handlePurchaseOrderSelect = (purchaseOrder: any) => {
        setSelectedPurchaseOrder(purchaseOrder);
    };

    const handlePurchaseOrderModalClose = () => {
        setShowPurchaseOrderModal(false);
        setSelectedPurchaseOrder(null);
        setPurchaseOrderSearch("");
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
        setCheckAccount(false);
        setShowModal(true);
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

        const salesOrderVoucherNumber =
            record?.sInvBody?.find(
                (item: any) =>
                    item?.sOrderNumber
            )?.sOrderNumber ||
            record?.sInvSalesOrderVoucherNumber ||
            record?.sOrderVoucherNumber ||
            record?.sInvOrderVoucherNumber ||
            record?.sInvBody?.[0]
                ?.sOrderNumber ||
            "";

        setConfirmTooltip({
            show: true,
            x,
            y,
            voucherNumber:
                record?.sInvVoucherNumber,
            salesOrderVoucherNumber,
        });
    };

    useEffect(() => {
        fetchSalesOrders();
    }, [purchaseOrderSearch]);

    useEffect(() => {
        dispatch(
            getAllTransactionSchema(
                "salesInvoice"
            ) as any
        );

        if (!Object.keys(company ?? {})?.length) {
            dispatch(
                getCompany({
                    withParent: true,
                    limit: 100,
                }) as any
            );
        }
    }, [dispatch]);

    useEffect(() => {
        fetchSalesInvoices();
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
            if (!transactionsSchema)
                return;

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

            if (!hasSchema)
                return;

            try {
                setFieldsLoading(true);
                await reloadTemplateFields();
            }
            catch (error) {
                console.log(
                    "Failed to prepare template fields",
                    error
                );
            }
            finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    useEffect(() => {
        dispatch(
            getAllReportMapping({
                moduleType:
                    "salesInvoice",
            }) as any
        );

        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );

        const loadAccounts = async () => {
            try {
                await dispatch(
                    getAllAccounts({
                        offset: 0,
                        limit: 100,
                        search: "",
                    }) as any
                ).unwrap();
            }
            catch (error) {
                console.log(
                    "Failed to load Account Master records",
                    error
                );
            }
            finally {
                setAccountListLoaded(
                    true
                );
            }
        };

        loadAccounts();
    }, [dispatch]);

    // ★ ADDED: Open Account Master only after the Sales Invoice form
    // is visible, the Account Master request has completed, and there
    // is no customer account.
    useEffect(() => {
        if (!showModal)
            return;

        if (editingRecord)
            return;

        if (!accountListLoaded)
            return;

        if (filterAccount.length === 0) {
            setCheckAccount(true);
        }
    }, [
        showModal,
        editingRecord,
        accountListLoaded,
        filterAccount.length,
    ]);


    console.log("frieght invoice", downlaodPDF?.record)

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="sales-invoice-header" className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div id="sales-invoice-summary" className="flex items-start gap-3">
                    <Badge {...{
                        count: pagination?.totalDocs ?? salesInvoices?.length ?? 0,
                        text: "Total Sales Invoices:",
                        varient: "primary",
                    }} />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Toggle {...{
                        arr: ["open", "close"],
                        state: status,
                        setState: handleStatusChange,
                    }} />

                    <SearchInput {...{ search, setSearch }} />

                    <DataREfreshButton {...{
                        callBackFn: handleRefresh,
                        loading: refreshing,
                    }} />

                    <Permission module="bookez" permissionKey="salesInvoice" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton {...{
                            callBackFn: openAddModal,
                            text: "Add Sales Invoice",
                        }} />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesInvoices}
                loading={loading}
                emptyMessage={`No ${status} sales invoice found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "salesInvoice",
                                    record,
                                    CustomerCode: record?.sInvCustomerCode,
                                    voucherNumber: record?.sInvVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>

                        <Permission module="bookez" permissionKey="salesInvoice" action="update">
                            <button
                                id="sales-invoice-edit-button"
                                onClick={() => handleEditSalesOrder(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="salesInvoice" action="delete">
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
                <Pagination {...{
                    localLimit,
                    selectCb: (e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    },
                    preDisabled: !pagination?.hasPrevPage,
                    nextDisabled: !pagination?.hasNextPage,
                    setLocalOffset,
                    pagination,
                }} />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this sales invoice?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmTooltip({
                        show: false,
                        x: null,
                        y: null,
                        voucherNumber: null,
                        salesOrderVoucherNumber: null,
                    })}
                />
            )}

            {!fieldsLoading && (
                <DynamicAddForm {...{
                    show: showModal,
                    setShow: setShowModal,
                    edit: Boolean(editingRecord),
                    title: "Sales Invoice",
                    subtitle: "Fill in the sales invoice details below",
                    loading: createLoading || updateLoading,

                    onClose: () => {
                        setShowModal(false);
                        setCheckAccount(false);
                        setCheckProduct(false);
                        setProductTargetRowIndex(null);
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
                    inputData: salesInvoiceInputData,
                    bodyKey: "products",
                    handleChange: handleMainChange,
                    isBodyColumnVisible,
                    isBodyCellVisible,

                    bodyCellExtraRenderer: (
                        column: any,
                        row: any
                    ) =>
                        renderSalesInvoiceCellExtra(
                            column,
                            row,
                            enableServiceProductInventory
                        ),

                    // ★ ADDED: Shared Account Master modal props
                    checkAccount,
                    setCheckAccount,
                    onAccountSaved:
                        handleAccountSaved,

                    headerRightContent:
                        posPostingField &&
                            !isTrueValue(
                                posPostingField
                                    ?.isHidden
                            )
                            ? (
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-sm font-semibold transition-colors ${posPostingEnabled
                                            ? "text-primary"
                                            : "text-foreground"
                                            }`}
                                    >
                                        {posPostingField
                                            ?.label ||
                                            "POS Posting"}

                                        {isTrueValue(
                                            posPostingField
                                                ?.isRequired
                                        ) && (
                                                <span className="text-danger">
                                                    *
                                                </span>
                                            )}
                                    </span>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-label={
                                            posPostingField
                                                ?.label ||
                                            "POS Posting"
                                        }
                                        aria-checked={
                                            posPostingEnabled
                                        }
                                        disabled={
                                            posPostingDisabled
                                        }
                                        onClick={() => {
                                            const nextValue =
                                                !posPostingEnabled;

                                            handleMainChange(
                                                posPostingFieldKey,
                                                nextValue
                                            );

                                            if (
                                                posPostingFieldKey !==
                                                "isAutoPost"
                                            ) {
                                                handleMainChange(
                                                    "isAutoPost",
                                                    nextValue
                                                );
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${posPostingEnabled
                                            ? "border-primary bg-primary shadow-md ring-2 ring-primary/30"
                                            : "border-border bg-muted-foreground/30 shadow-inner"
                                            }`}
                                    >
                                        <span
                                            className={`h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${posPostingEnabled
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                                }`}
                                        />
                                    </button>
                                </div>
                            )
                            : null,
                }} />
            )}

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

            <Modal
                show={showPurchaseOrderModal}
                setShow={setShowPurchaseOrderModal}
                title="Select Sales Order"
                state={false}
                handleSubmit={handlePurchaseOrderConfirm}
                handleClose={handlePurchaseOrderModalClose}
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
                                    setPurchaseOrderSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search Sales Order..."
                                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {orderLoader ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Loading Sales Order...
                                </div>
                            ) : !salesOrders?.length ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    No Sales Order found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {salesOrders?.map(
                                        (
                                            e: any,
                                            index: number
                                        ) => {
                                            const poNumber =
                                                e
                                                    ?.sOrderVoucherNumber ||
                                                "-";

                                            const isSelected =
                                                selectedPurchaseOrder
                                                    ?.sOrderVoucherNumber ==
                                                e
                                                    ?.sOrderVoucherNumber;

                                            return (
                                                <button
                                                    key={
                                                        poNumber ||
                                                        index
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        handlePurchaseOrderSelect(
                                                            e
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
                                                                {e
                                                                    ?.sOrderVoucherNumber ||
                                                                    "NA"}{" "}
                                                                -{" "}
                                                                {e
                                                                    ?.sOrderCustomerName ||
                                                                    "NA"}
                                                            </p>

                                                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                                Items:{" "}
                                                                {e
                                                                    ?.sOrderBody
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

            {/* @ts-ignore  */}
            <ListingModel {...{
                show: downlaodPDF?.show,

                setShow: () =>
                    setDownlaodPDF(() => ({
                        show: !downlaodPDF?.show,
                    })),

                downlaodPDF,
                externalBody: <><h1>Freight Invoice</h1></>,
                entryType: "sales-invoice",
                rowData: downlaodPDF?.record,
                report,
                title: "Download Sales Invoice PDF",
                cancelText: "Cancel",
                confirmText: "Confirm",
            }} />
        </div>
    );
};

export default SalesInVoice;