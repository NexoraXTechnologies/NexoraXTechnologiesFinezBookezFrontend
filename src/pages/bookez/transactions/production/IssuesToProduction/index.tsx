import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
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
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";

import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import { getProductBalance, saveInventoryBalance, updateInventoryBalance } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import professionalAxios from "../../../../../services/professionalAxios";
import { formatDateForInput, formatDateForList, loadAllTemplateOptions, money, num, todayYMD } from "../../../../../utils/helperFunctions";

const MODULE_CODE = "issueToProduction";
const MODULE_NAME = "Issue to Production";
const API_BASE = "/eTaxSolnMongoApiBackend/users/bookez/otherApi/issuesToProduction";
const PRODUCT_FIELD_KEYS = new Set(["productCode", "productName", "productId", "product"]);

const getProductHSNCode = (product: any) =>
    String(
        product?.productHSNCode ||
        product?.hsnCode ||
        product?.HSNCode ||
        product?.hsn ||
        product?.dynamicFields?.productHSNCode ||
        product?.dynamicFields?.hsnCode ||
        product?.dynamicFields?.HSNCode ||
        product?.dynamicFields?.hsn ||
        ""
    ).trim();

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

const getDynamicFieldType = (field: any) =>
    String(field?.type || field?.dataSource?.type || "")
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
        field?.title ||
        field?.key ||
        ""
    ).trim();

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const getFinancialYearRange = (dateValue?: string) => {
    const selectedDate = dateValue ? new Date(`${dateValue}T23:59:59.999`) : new Date();
    const financialYear = selectedDate.getMonth() >= 3 ? selectedDate.getFullYear() : selectedDate.getFullYear() - 1;

    return {
        fromDate: new Date(financialYear, 3, 1, 0, 0, 0, 0).toISOString(),
        toDate: selectedDate.toISOString(),
    };
};

const isTrueValue = (value: any) => value === true || String(value ?? "").trim().toLowerCase() === "true";

const getFieldDefaultValue = (field: any) => {
    const type = String(field?.type || "").trim().toLowerCase();

    if (type === "boolean") return false;
    if (type === "number" || type === "amount" || type === "currency") return "";
    if (field?.defaultValue !== undefined && field?.defaultValue !== null) return field.defaultValue;

    return "";
};

const renderIssueToProductionCellExtra = (column: any, row: any) => {
    if (column?.key !== "quantity" || !row?.productCode) return null;

    const productType = String(row?.productType || "").trim().toLowerCase();

    if (["serviceproduct", "nonstocks"].includes(productType)) return null;

    return (
        <InputBorderLabel
            label="Avl Qty"
            value={row?.availableQuantity}
            loading={row?.availableQuantity === null || row?.availableQuantity === undefined}
            successWhenPositive
        />
    );
};

const IssueToProduction = () => {
    const dispatch = useDispatch<any>();

    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema || {});

    const [records, setRecords] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(defaultPagination);
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("open");
    const [listingLoader, setListingLoader] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteLoader, setDeleteLoader] = useState(false);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucherNumber, setEditingVoucherNumber] = useState<string | null>(null);
    const [templateFields, setTemplateFields] = useState<any>({ header: [], headerChild: [], body: [], footer: [] });
    const [form, setForm] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });

    const buildBlankRow = (fields: any[] = templateFields?.body || []) => {
        const row: any = {
            id: Date.now() + Math.random(),
            availableQuantity: null,
            productType: "",
            customMasters: {},
            _inventoryBalanceSelections: {},
            _inventoryBalanceVoucherId: "",
        };

        (fields || []).forEach((field: any) => {
            if (!field?.key) return;
            row[field.key] = getFieldDefaultValue(field);
        });

        return row;
    };

    const buildBlankForm = (schema: any = templateFields) => {
        const next: any = {};

        [...(schema?.header || []), ...(schema?.headerChild || [])].forEach((field: any) => {
            if (!field?.key) return;
            next[field.key] = getFieldDefaultValue(field);
        });

        next.voucherNumber = next.voucherNumber || "AUTO";
        next.voucherDate = next.voucherDate || todayYMD();
        next.status = next.status || "open";
        next.transactionType = next.transactionType || "ISSUE_TO_PRODUCTION";
        next.customMasters = {};
        next.rawMaterials = [buildBlankRow(schema?.body || [])];

        return next;
    };

    const getOptionByValue = (field: any, value: any) => {
        return (field?.options || []).find((option: any) => String(option?.value) === String(value));
    };

    const getBodyFieldByKey = (key: string) => {
        return (templateFields?.body || []).find((field: any) => String(field?.key) === String(key));
    };

    const getHeaderFieldByKey = (key: string) => {
        return [
            ...(templateFields?.header || []),
            ...(templateFields?.headerChild || []),
        ].find((field: any) => String(field?.key) === String(key));
    };

    const isInventoryBalanceField = (field: any) =>
        Boolean(getInventoryBalanceApiKey(field));

    const getInventoryBalanceFilters = (row: any) => {
        const filters: any = {};

        const selectedFilters =
            row?._inventoryBalanceSelections &&
                typeof row._inventoryBalanceSelections === "object"
                ? row._inventoryBalanceSelections
                : {};

        if (selectedFilters?.warehouseCode) filters.warehouseCode = selectedFilters.warehouseCode;
        if (selectedFilters?.locationCode) filters.locationCode = selectedFilters.locationCode;
        if (selectedFilters?.batchNumber) filters.batchNumber = selectedFilters.batchNumber;
        if (selectedFilters?.binCode) filters.binCode = selectedFilters.binCode;

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
            (field: any) =>
                getInventoryTransactionApiKey(field) === apiKey
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
        const bodyValue = getInventoryFieldValue(
            row,
            templateFields?.body || [],
            apiKey
        );

        if (
            bodyValue !== undefined &&
            bodyValue !== null &&
            String(bodyValue).trim() !== ""
        ) {
            return bodyValue;
        }

        return getInventoryFieldValue(
            form,
            [
                ...(templateFields?.header || []),
                ...(templateFields?.headerChild || []),
            ],
            apiKey
        );
    };

    const getInventoryBalanceVoucherId = (row: any) =>
        String(
            row?._inventoryBalanceVoucherId ||
            row?.inventoryBalanceVoucherId ||
            row?.inventoryBalanceId ||
            row?.inventoryVoucherId ||
            row?.inventoryBalance?.voucherId ||
            row?.inventoryBalance?.inventoryBalanceVoucherId ||
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

    const attachInventoryBalanceVoucherIds = (
        rows: any[],
        inventoryRecords: any[]
    ) => {
        const usedVoucherIds = new Set<string>();

        return (rows || []).map((row: any) => {
            const productCode = String(row?.productCode || "").trim();

            const warehouseCode = String(
                getInventoryFieldValue(
                    row,
                    templateFields?.body || [],
                    "warehouseCode"
                ) || ""
            );

            const locationCode = String(
                getInventoryFieldValue(
                    row,
                    templateFields?.body || [],
                    "locationCode"
                ) || ""
            );

            const batchNumber = String(
                getInventoryFieldValue(
                    row,
                    templateFields?.body || [],
                    "batchNumber"
                ) || ""
            );

            const rackCode = String(
                getInventoryFieldValue(
                    row,
                    templateFields?.body || [],
                    "rackCode"
                ) || ""
            );

            const binCode = String(
                getInventoryFieldValue(
                    row,
                    templateFields?.body || [],
                    "binCode"
                ) || ""
            );

            const availableRecords = (inventoryRecords || []).filter(
                (record: any) => {
                    const voucherId = String(record?.voucherId || "").trim();

                    return (
                        voucherId &&
                        !usedVoucherIds.has(voucherId) &&
                        String(record?.productCode || "").trim() === productCode
                    );
                }
            );

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

            const voucherId = String(
                exactRecord?.voucherId || ""
            ).trim();

            if (voucherId) {
                usedVoucherIds.add(voucherId);
            }

            return {
                ...row,
                _inventoryBalanceVoucherId: voucherId,
            };
        });
    };

    const getSavedIssueVoucherNumber = (
        response: any,
        fallbackVoucherNumber = ""
    ) => {
        const data =
            response?.data?.data ||
            response?.data ||
            {};

        return String(
            data?.voucherNumber ||
            data?.issuesToProductionVoucherNumber ||
            data?.issueToProductionVoucherNumber ||
            data?.record?.voucherNumber ||
            data?.record?.issuesToProductionVoucherNumber ||
            data?.record?.issueToProductionVoucherNumber ||
            fallbackVoucherNumber ||
            ""
        ).trim();
    };

    const buildInventoryBalancePayload = (
        row: any,
        voucherNumber: string
    ) => {
        const inventoryStatus =
            String(form?.status || "").trim().toLowerCase() === "close"
                ? "inactive"
                : "active";

        const voucherDate =
            toInventoryIsoDate(
                form?.voucherDate ||
                todayYMD()
            );

        return {
            voucherNumber,
            voucherNumberSnapshot:
                form?.voucherNumberSnapshot ||
                voucherNumber,
            voucherType: MODULE_CODE,
            sourceModule: MODULE_CODE,
            voucherStatus: inventoryStatus,
            voucherDate,
            party: form?.party || "production",
            productCode: String(row?.productCode || ""),
            productName: String(row?.productName || ""),
            productType: String(row?.productType || ""),
            uom: String(
                row?.uom ||
                row?.unit ||
                row?.unitName ||
                ""
            ),
            inwardQty: 0,
            outwardQty: num(row?.quantity),
            reservedQty: num(row?.reservedQty || 0),
            warehouseCode: String(
                getInventoryTransactionValue(
                    row,
                    "warehouseCode"
                ) || ""
            ),
            locationCode: String(
                getInventoryTransactionValue(
                    row,
                    "locationCode"
                ) || ""
            ),
            batchNumber: String(
                getInventoryTransactionValue(
                    row,
                    "batchNumber"
                ) || ""
            ),
            rackCode: String(
                getInventoryTransactionValue(
                    row,
                    "rackCode"
                ) || ""
            ),
            binCode: String(
                getInventoryTransactionValue(
                    row,
                    "binCode"
                ) || ""
            ),
            mfgOn: toInventoryIsoDate(
                getInventoryTransactionValue(
                    row,
                    "mfgOn"
                )
            ),
            expOn: toInventoryIsoDate(
                getInventoryTransactionValue(
                    row,
                    "expOn"
                )
            ),
            remarks:
                row?.remarks ||
                form?.remarks ||
                form?.headerRemarks ||
                MODULE_NAME,
            status: inventoryStatus,
        };
    };

    const syncInventoryBalance = async (
        voucherNumber: string,
        isEdit: boolean
    ) => {
        const rows = (form?.rawMaterials || []).filter(
            (row: any) =>
                String(row?.productCode || "").trim() !== ""
        );

        for (const row of rows) {
            const inventoryPayload =
                buildInventoryBalancePayload(
                    row,
                    voucherNumber
                );

            if (!isEdit) {
                await dispatch(
                    saveInventoryBalance(
                        inventoryPayload
                    ) as any
                ).unwrap();

                continue;
            }

            const inventoryBalanceVoucherId =
                getInventoryBalanceVoucherId(
                    row
                );

            if (inventoryBalanceVoucherId) {
                await dispatch(
                    updateInventoryBalance({
                        id: inventoryBalanceVoucherId,
                        payload: inventoryPayload,
                    }) as any
                ).unwrap();
            } else {
                // A row newly added while editing has no existing VID record yet.
                await dispatch(
                    saveInventoryBalance(
                        inventoryPayload
                    ) as any
                ).unwrap();
            }
        }
    };

    const getCustomMasterSelection = (field: any, selectedValue: any) => {
        if (
            selectedValue === undefined ||
            selectedValue === null ||
            String(selectedValue).trim() === ""
        ) {
            return null;
        }

        if (typeof selectedValue === "object" && selectedValue?.code) {
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

        const selectedOption = getOptionByValue(field, selectedValue);
        const raw = selectedOption?.raw || {};

        const nestedData =
            raw?.data && typeof raw.data === "object"
                ? raw.data
                : raw?.dynamicFields && typeof raw.dynamicFields === "object"
                    ? raw.dynamicFields
                    : raw?.customFields && typeof raw.customFields === "object"
                        ? raw.customFields
                        : {};

        const code = String(
            selectedOption?.value ||
            raw?.code ||
            raw?.masterCode ||
            nestedData?.code ||
            selectedValue ||
            ""
        ).trim();

        const name = String(
            selectedOption?.label ||
            raw?.name ||
            raw?.masterName ||
            nestedData?.name ||
            code
        ).trim();

        if (!code) return null;

        return { code, name };
    };

    const buildCustomMastersPayload = (
        fields: any[],
        source: any,
        existingCustomMasters: any = {}
    ) => {
        const customMasters: any = {};

        (fields || []).forEach((field: any) => {
            if (
                !field?.key ||
                isTrueValue(field?.isHidden) ||
                !isCustomMasterField(field)
            ) {
                return;
            }

            const masterName = getCustomMasterName(field);
            if (!masterName) return;

            const existingMaster =
                existingCustomMasters?.[masterName] ||
                existingCustomMasters?.[field?.key];

            const selectedValue =
                source?.[field.key] ??
                existingMaster?.code ??
                "";

            const selectedMaster =
                getCustomMasterSelection(field, selectedValue) ||
                (
                    existingMaster?.code
                        ? {
                            code: String(existingMaster.code || ""),
                            name: String(existingMaster.name || ""),
                        }
                        : null
                );

            if (selectedMaster?.code) {
                customMasters[masterName] = selectedMaster;
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
                customMasters && typeof customMasters === "object"
                    ? { ...customMasters }
                    : {},
        };

        (fields || []).forEach((field: any) => {
            if (!isCustomMasterField(field)) return;

            const masterName = getCustomMasterName(field);

            const savedMaster =
                customMasters?.[masterName] ||
                customMasters?.[field?.key];

            if (savedMaster?.code) {
                updated[field.key] = savedMaster.code;
            }
        });

        return updated;
    };

    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
        if (!field) return oldData;

        const selectedOption = getOptionByValue(field, selectedValue);
        const raw = selectedOption?.raw || {};
        const updated = { ...oldData, [field.key]: selectedValue };

        if (field?.mapFields && raw) {
            Object.entries(field.mapFields).forEach(([targetKey, sourceKey]) => {
                updated[targetKey] =
                    raw?.[sourceKey as string] ??
                    raw?.dynamicFields?.[sourceKey as string] ??
                    raw?.[String(sourceKey).toLowerCase()] ??
                    raw?.[String(sourceKey).toUpperCase()] ??
                    "";
            });
        }

        return updated;
    };

    const calculateRow = (row: any) => {
        const quantity = num(row?.quantity);
        const rate = num(row?.rate);
        const amount = quantity * rate;

        return {
            ...row,
            amount,
            gross: row?.gross !== undefined ? amount : row?.gross,
            grossAmount: row?.grossAmount !== undefined ? amount : row?.grossAmount,
        };
    };

    const cleanRawMaterials = (rows: any[] = form?.rawMaterials || []) => {
        const bodyFields = templateFields?.body || [];
        const schemaKeys = new Set(
            bodyFields
                .map((field: any) => field?.key)
                .filter(Boolean)
        );

        return (rows || [])
            .filter((row: any) =>
                Array.from(schemaKeys).some((key: any) => {
                    const value = row?.[key];
                    return value !== "" && value !== null && value !== undefined;
                })
            )
            .map((row: any) => {
                const calculated = calculateRow(row);
                const cleanRow: any = {};

                bodyFields.forEach((field: any) => {
                    const key = String(field?.key || "").trim();

                    if (
                        !key ||
                        isTrueValue(field?.isHidden) ||
                        isCustomMasterField(field)
                    ) {
                        return;
                    }

                    cleanRow[key] = calculated?.[key];
                });

                if (cleanRow.productCode === undefined && calculated?.productCode) cleanRow.productCode = calculated.productCode;
                if (cleanRow.productName === undefined && calculated?.productName) cleanRow.productName = calculated.productName;
                if (cleanRow.productId === undefined && calculated?.productId) cleanRow.productId = calculated.productId;
                if (cleanRow.unit === undefined && calculated?.unit) cleanRow.unit = calculated.unit;
                if (cleanRow.uom === undefined && calculated?.uom) cleanRow.uom = calculated.uom;

                if (cleanRow.quantity !== undefined) cleanRow.quantity = String(cleanRow.quantity ?? "");
                if (cleanRow.rate !== undefined) cleanRow.rate = String(cleanRow.rate ?? "");
                if (cleanRow.amount !== undefined) cleanRow.amount = String(num(cleanRow.amount).toFixed(2));

                const customMasters = buildCustomMastersPayload(
                    bodyFields,
                    calculated,
                    row?.customMasters || {}
                );

                if (Object.keys(customMasters).length) {
                    cleanRow.customMasters = customMasters;
                }

                return cleanRow;
            });
    };

    const footerTotals = useMemo(() => {
        const rows = (form?.rawMaterials || []).map((row: any) => calculateRow(row));

        return rows.reduce(
            (acc: any, row: any) => {
                acc.totalIssuedQuantity += num(row?.quantity);
                acc.totalRawMaterialCost += num(row?.amount);
                return acc;
            },
            {
                totalIssuedQuantity: 0,
                totalRawMaterialCost: 0,
            }
        );
    }, [form?.rawMaterials]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || []).map((field: any) => {
            const key = String(field?.key || "");
            let rawValue = form?.[key] ?? field?.defaultValue ?? "";

            if (key === "totalIssuedQuantity" || key === "totalQuantity") {
                rawValue = footerTotals.totalIssuedQuantity;
            }

            if (
                key === "totalRawMaterialCost" ||
                key === "totalAmount" ||
                key === "grossAmount"
            ) {
                rawValue = footerTotals.totalRawMaterialCost;
            }

            const fieldType = String(field?.type || "").toLowerCase();

            const isMoneyField =
                fieldType === "currency" ||
                fieldType === "amount" ||
                key.toLowerCase().includes("cost") ||
                key.toLowerCase().includes("amount");

            return {
                ...field,
                rawValue,
                value: isMoneyField ? money(rawValue || 0) : rawValue,
            };
        });
    }, [templateFields?.footer, form, footerTotals]);

    // ⭐ ADDED — KEEP AUTO GENERATED VOUCHER NUMBER DISABLED
    const issueFormInputData = useMemo(() => {
        return {
            ...templateFields,

            header: (templateFields?.header || []).map((field: any) =>
                field?.key === "voucherNumber"
                    ? {
                        ...field,
                        disabled: true,
                        isReadonly: true,
                    }
                    : field
            ),

            headerChild: (templateFields?.headerChild || []).map((field: any) =>
                field?.key === "voucherNumber"
                    ? {
                        ...field,
                        disabled: true,
                        isReadonly: true,
                    }
                    : field
            ),

            body: templateFields?.body || [],
            footer: dynamicFooterArray,
        };
    }, [templateFields, dynamicFooterArray]);

    const getVoucherNumber = (record: any) => {
        return (
            record?.voucherNumber ||
            record?.issuesToProductionVoucherNumber ||
            record?.issueToProductionVoucherNumber ||
            ""
        );
    };

    const fetchIssueToProductionList = async () => {
        try {
            setListingLoader(true);

            const response = await professionalAxios.get(`${API_BASE}/getAll`, {
                params: {
                    status,
                    search: debouncedSearch,
                    limit: localLimit,
                    offset: localOffset,
                },
            });

            const data = response?.data?.data || response?.data || {};

            setRecords(Array.isArray(data?.records) ? data.records : []);
            setPagination(data?.pagination || defaultPagination);
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load Issue to Production list"
            );
        } finally {
            setListingLoader(false);
        }
    };

    useEffect(() => {
        dispatch(getAllTransactionSchema(MODULE_CODE) as any);
    }, [dispatch]);

    useEffect(() => {
        fetchIssueToProductionList();
    }, [localOffset, localLimit, debouncedSearch, status]);

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

            const hasSchema =
                Array.isArray(transactionsSchema?.header) ||
                Array.isArray(transactionsSchema?.headerChild) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                setFieldsLoading(true);

                const updated = await loadAllTemplateOptions(transactionsSchema);

                setTemplateFields(updated);

                if (!editingVoucherNumber) {
                    const next: any = {};

                    [
                        ...(updated?.header || []),
                        ...(updated?.headerChild || []),
                    ].forEach((field: any) => {
                        if (!field?.key) return;
                        next[field.key] = getFieldDefaultValue(field);
                    });

                    next.voucherNumber = next.voucherNumber || "AUTO";
                    next.voucherDate = next.voucherDate || todayYMD();
                    next.status = next.status || "open";
                    next.transactionType = next.transactionType || "ISSUE_TO_PRODUCTION";

                    const row: any = {
                        id: Date.now(),
                        availableQuantity: null,
                        productType: "",
                        customMasters: {},
                        _inventoryBalanceSelections: {},
                        _inventoryBalanceVoucherId: "",
                    };

                    (updated?.body || []).forEach((field: any) => {
                        if (!field?.key) return;
                        row[field.key] = getFieldDefaultValue(field);
                    });

                    next.customMasters = {};
                    next.rawMaterials = [row];

                    setForm(next);
                }
            } catch (error) {
                console.log(
                    "Failed to prepare Issue to Production schema",
                    error
                );

                toast.error("Failed to load Issue to Production fields");
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    const loadAvailableQuantity = async (
        index: number,
        productCode: string,
        productType: string,
        voucherDate?: string,
        rowData?: any
    ) => {
        const normalizedProductType = String(productType || "").trim().toLowerCase();

        if (
            !productCode ||
            ["serviceproduct", "nonstocks"].includes(normalizedProductType)
        ) {
            setForm((previous: any) => {
                const updatedRows = [...(previous?.rawMaterials || [])];

                if (!updatedRows[index]) return previous;

                updatedRows[index] = {
                    ...updatedRows[index],
                    productType: normalizedProductType,
                    availableQuantity: null,
                };

                return {
                    ...previous,
                    rawMaterials: updatedRows,
                };
            });

            return;
        }

        setForm((previous: any) => {
            const updatedRows = [...(previous?.rawMaterials || [])];

            if (
                !updatedRows[index] ||
                String(updatedRows[index]?.productCode || "") !==
                String(productCode)
            ) {
                return previous;
            }

            updatedRows[index] = {
                ...updatedRows[index],
                productType: normalizedProductType,
                availableQuantity: null,
            };

            return {
                ...previous,
                rawMaterials: updatedRows,
            };
        });

        try {
            const { fromDate, toDate } = getFinancialYearRange(
                voucherDate ||
                form?.voucherDate ||
                todayYMD()
            );

            const balance: any = await dispatch(
                getProductBalance({
                    productCode,
                    fromDate,
                    toDate,
                    ...getInventoryBalanceFilters(
                        rowData ||
                        form?.rawMaterials?.[index]
                    ),
                }) as any
            ).unwrap();

            setForm((previous: any) => {
                const updatedRows = [...(previous?.rawMaterials || [])];

                if (
                    !updatedRows[index] ||
                    String(updatedRows[index]?.productCode || "") !==
                    String(productCode)
                ) {
                    return previous;
                }

                updatedRows[index] = {
                    ...updatedRows[index],
                    productType: normalizedProductType,
                    availableQuantity:
                        balance?.balanceQuantity !== undefined &&
                            balance?.balanceQuantity !== null
                            ? balance.balanceQuantity
                            : null,
                };

                return {
                    ...previous,
                    rawMaterials: updatedRows,
                };
            });
        } catch (error) {
            console.log(
                `Failed to fetch available quantity for ${productCode}`,
                error
            );
        }
    };

    useEffect(() => {
        if (!showModal || !editingVoucherNumber) return;

        (form?.rawMaterials || []).forEach((row: any, index: number) => {
            if (!row?.productCode) return;

            const productField = (templateFields?.body || []).find(
                (field: any) =>
                    PRODUCT_FIELD_KEYS.has(
                        String(field?.key || "")
                    )
            );

            const option = (productField?.options || []).find((item: any) => {
                const raw = item?.raw || {};

                return [
                    item?.value,
                    raw?.productCode,
                    raw?._id,
                    raw?.productId,
                ].some(
                    (value) =>
                        String(value || "") ===
                        String(row.productCode)
                );
            });

            const productType =
                option?.raw?.productType ||
                option?.raw?.dynamicFields?.productType ||
                row?.productType ||
                "rawmaterial";

            void loadAvailableQuantity(
                index,
                String(row.productCode),
                String(productType),
                form?.voucherDate
            );
        });
    }, [showModal, editingVoucherNumber, form?.voucherNumber]);

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchIssueToProductionList();
            toast.success("Issue to Production list refreshed");
        } finally {
            setRefreshing(false);
        }
    };

    const resetForm = () => {
        setEditingVoucherNumber(null);
        setErrors({});
        setForm(buildBlankForm(templateFields));
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const buildFormFromRecord = (record: any) => {
        const next = buildBlankForm(templateFields);

        [
            ...(templateFields?.header || []),
            ...(templateFields?.headerChild || []),
        ].forEach((field: any) => {
            if (!field?.key) return;

            let value =
                record?.[field.key] ??
                field?.defaultValue ??
                next?.[field.key] ??
                "";

            if (
                String(field?.type || "").toLowerCase() ===
                "date" &&
                value
            ) {
                value = formatDateForInput(value);
            }

            next[field.key] = value;
        });

        next.voucherNumber = getVoucherNumber(record) || next.voucherNumber;

        next.voucherDate = record?.voucherDate
            ? formatDateForInput(record.voucherDate)
            : next.voucherDate;

        next.status = record?.status || next.status || "open";
        next.transactionType = record?.transactionType || next.transactionType;
        next.headerRemarks = record?.headerRemarks ?? next.headerRemarks ?? "";
        next.remarks = record?.remarks ?? next.remarks ?? "";

        const hydratedHeader = applyCustomMasterValues(
            [
                ...(templateFields?.header || []),
                ...(templateFields?.headerChild || []),
            ],
            next,
            record?.customMasters || {}
        );

        hydratedHeader.rawMaterials =
            Array.isArray(record?.rawMaterials) &&
                record.rawMaterials.length
                ? record.rawMaterials.map((item: any) =>
                    applyCustomMasterValues(
                        templateFields?.body || [],
                        {
                            ...buildBlankRow(templateFields?.body || []),
                            ...item,
                            id: item?.id || Date.now() + Math.random(),
                            availableQuantity: null,
                            productType: item?.productType || "rawmaterial",
                            _inventoryBalanceSelections: {},
                            _inventoryBalanceVoucherId:
                                item?._inventoryBalanceVoucherId ||
                                item?.inventoryBalanceVoucherId ||
                                item?.inventoryBalanceId ||
                                "",
                        },
                        item?.customMasters || {}
                    )
                )
                : [buildBlankRow(templateFields?.body || [])];

        return hydratedHeader;
    };

    const openEditModal = async (record: any) => {
        const voucherNumber = getVoucherNumber(record);

        if (!voucherNumber) {
            toast.error("Voucher number not found");
            return;
        }

        try {
            setFieldsLoading(true);

            const [issueResponse, inventoryBalanceResponse] =
                await Promise.all([
                    professionalAxios.get(
                        `${API_BASE}/getByVoucherNo/${encodeURIComponent(voucherNumber)}`
                    ),
                    professionalAxios.get(
                        "/eTaxSolnMongoApiBackend/users/bookez/inventoryBalance/getAll",
                        {
                            params: {
                                offset: 0,
                                limit: 500,
                                voucherNumber,
                            },
                        }
                    ).catch(() => null),
                ]);

            const detail =
                issueResponse?.data?.data ||
                issueResponse?.data ||
                record;

            const nextForm =
                buildFormFromRecord(
                    detail
                );

            const inventoryRecords =
                getInventoryBalanceRecords(
                    inventoryBalanceResponse
                );

            nextForm.rawMaterials =
                attachInventoryBalanceVoucherIds(
                    nextForm?.rawMaterials || [],
                    inventoryRecords
                );

            setEditingVoucherNumber(voucherNumber);
            setErrors({});
            setForm(nextForm);
            setShowModal(true);
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load Issue to Production"
            );
        } finally {
            setFieldsLoading(false);
        }
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((previous: any) => {
            const currentField = getHeaderFieldByKey(key);

            let updated = {
                ...previous,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updated = applyMappedFields(
                    currentField,
                    value,
                    updated
                );
            }

            if (isCustomMasterField(currentField)) {
                const masterName = getCustomMasterName(currentField);

                const currentCustomMasters =
                    updated?.customMasters &&
                        typeof updated.customMasters === "object"
                        ? { ...updated.customMasters }
                        : {};

                const selectedMaster =
                    getCustomMasterSelection(
                        currentField,
                        value
                    );

                if (selectedMaster) {
                    currentCustomMasters[masterName] = selectedMaster;
                } else {
                    delete currentCustomMasters[masterName];
                }

                updated.customMasters = currentCustomMasters;
            }

            return updated;
        });

        setErrors((previous: any) => ({
            ...previous,
            [key]: "",
        }));
    };

    const handleAddRow = () => {
        setForm((previous: any) => ({
            ...previous,
            rawMaterials: [
                ...(previous?.rawMaterials || []),
                buildBlankRow(templateFields?.body || []),
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((previous: any) => {
            const rows = (previous?.rawMaterials || []).filter(
                (_: any, rowIndex: number) =>
                    rowIndex !== index
            );

            return {
                ...previous,
                rawMaterials:
                    rows.length
                        ? rows
                        : [buildBlankRow(templateFields?.body || [])],
            };
        });
    };

    const handleRowChange = (
        index: number,
        key: string,
        value: any
    ) => {
        const field = getBodyFieldByKey(key);
        const currentRow = form?.rawMaterials?.[index] || {};
        const selectedOption = getOptionByValue(field, value);
        const raw = selectedOption?.raw || {};

        let balanceRow: any = {
            ...currentRow,
            [key]: value,
        };

        balanceRow = applyMappedFields(
            field,
            value,
            balanceRow
        );

        if (isInventoryBalanceField(field)) {
            const apiKey = getInventoryBalanceApiKey(field);

            const selectedCode =
                selectedOption?.value ??
                raw?.code ??
                raw?.masterCode ??
                value ??
                "";

            const currentSelections =
                balanceRow?._inventoryBalanceSelections &&
                    typeof balanceRow._inventoryBalanceSelections === "object"
                    ? { ...balanceRow._inventoryBalanceSelections }
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

            balanceRow._inventoryBalanceSelections = currentSelections;
        }

        if (isCustomMasterField(field)) {
            const masterName = getCustomMasterName(field);

            const currentCustomMasters =
                balanceRow?.customMasters &&
                    typeof balanceRow.customMasters === "object"
                    ? { ...balanceRow.customMasters }
                    : {};

            const selectedMaster =
                getCustomMasterSelection(
                    field,
                    value
                );

            if (selectedMaster) {
                currentCustomMasters[masterName] = selectedMaster;
            } else {
                delete currentCustomMasters[masterName];
            }

            balanceRow.customMasters = currentCustomMasters;
        }

        if (PRODUCT_FIELD_KEYS.has(key)) {
            balanceRow.productCode =
                raw?.productCode ||
                balanceRow?.productCode ||
                (key === "productCode" ? value : "");

            balanceRow.productName =
                raw?.productName ||
                balanceRow?.productName ||
                (
                    key === "productName"
                        ? selectedOption?.label || value
                        : ""
                );

            balanceRow.productId =
                raw?._id ||
                raw?.productId ||
                balanceRow?.productId ||
                "";

            balanceRow.productHSNCode =
                getProductHSNCode(raw) ||
                balanceRow?.productHSNCode ||
                "";

            balanceRow.hsnCode =
                getProductHSNCode(raw) ||
                balanceRow?.hsnCode ||
                "";

            balanceRow.unit =
                raw?.unit ||
                balanceRow?.unit ||
                "";

            balanceRow.uom =
                raw?.uom ||
                raw?.unit ||
                balanceRow?.uom ||
                "";

            balanceRow.rate =
                balanceRow?.rate ||
                raw?.purchasePrice ||
                raw?.productPurchasePrice ||
                raw?.rate ||
                "";

            balanceRow.productType =
                raw?.productType ||
                raw?.dynamicFields?.productType ||
                "rawmaterial";

            balanceRow.availableQuantity = null;
        }

        setForm((previous: any) => {
            const rows = [...(previous?.rawMaterials || [])];

            let row = {
                ...(rows[index] ||
                    buildBlankRow(templateFields?.body || [])),
                [key]: value,
            };

            row = applyMappedFields(
                field,
                value,
                row
            );

            if (isInventoryBalanceField(field)) {
                row._inventoryBalanceSelections = {
                    ...(balanceRow?._inventoryBalanceSelections || {}),
                };
            }

            if (isCustomMasterField(field)) {
                row.customMasters = {
                    ...(balanceRow?.customMasters || {}),
                };
            }

            if (PRODUCT_FIELD_KEYS.has(key)) {
                row.productCode = balanceRow.productCode;
                row.productName = balanceRow.productName;
                row.productId = balanceRow.productId;
                row.productHSNCode = balanceRow.productHSNCode;
                row.hsnCode = balanceRow.hsnCode;
                row.unit = balanceRow.unit;
                row.uom = balanceRow.uom;
                row.rate = balanceRow.rate;
                row.productType = balanceRow.productType;
                row.availableQuantity = null;
            }

            if (
                key === "quantity" ||
                key === "rate" ||
                PRODUCT_FIELD_KEYS.has(key)
            ) {
                row = calculateRow(row);
            }

            rows[index] = row;

            return {
                ...previous,
                rawMaterials: rows,
            };
        });

        setErrors((previous: any) => ({
            ...previous,
            rawMaterials: "",
            [`row_${index}_${key}`]: "",
        }));

        if (
            PRODUCT_FIELD_KEYS.has(key) ||
            isInventoryBalanceField(field)
        ) {
            const productCode = String(
                balanceRow?.productCode ||
                ""
            ).trim();

            const productType = String(
                balanceRow?.productType ||
                "rawmaterial"
            );

            if (productCode) {
                void loadAvailableQuantity(
                    index,
                    productCode,
                    productType,
                    form?.voucherDate,
                    balanceRow
                );
            }
        }
    };

    const validateForm = () => {
        const nextErrors: any = {};

        [
            ...(templateFields?.header || []),
            ...(templateFields?.headerChild || []),
        ].forEach((field: any) => {
            const isRequired =
                isTrueValue(field?.isRequired) ||
                isTrueValue(field?.required);

            const isHidden =
                isTrueValue(field?.isHidden);

            if (
                !field?.key ||
                isHidden ||
                !isRequired
            ) {
                return;
            }

            const value = form?.[field.key];

            const isEmpty =
                value === "" ||
                value === null ||
                value === undefined;

            if (isEmpty) {
                nextErrors[field.key] =
                    `${field?.label || field.key} is required`;
            }
        });

        const rows = cleanRawMaterials();

        if (!rows.length) {
            nextErrors.rawMaterials =
                "Please add at least one raw material";
        }

        (form?.rawMaterials || []).forEach(
            (row: any, index: number) => {
                const hasData = (templateFields?.body || []).some(
                    (field: any) => {
                        const value = row?.[field?.key];

                        return (
                            value !== "" &&
                            value !== null &&
                            value !== undefined
                        );
                    }
                );

                if (!hasData) return;

                (templateFields?.body || []).forEach(
                    (field: any) => {
                        const isRequired =
                            isTrueValue(field?.isRequired) ||
                            isTrueValue(field?.required);

                        const isHidden =
                            isTrueValue(field?.isHidden);

                        if (
                            !field?.key ||
                            isHidden ||
                            !isRequired
                        ) {
                            return;
                        }

                        const value = row?.[field.key];

                        const isEmpty =
                            value === "" ||
                            value === null ||
                            value === undefined;

                        if (isEmpty) {
                            nextErrors[`row_${index}_${field.key}`] =
                                `${field?.label || field.key} is required`;
                        }
                    }
                );
            }
        );

        setErrors(nextErrors);

        const firstError =
            Object.values(nextErrors)?.[0];

        if (firstError) {
            toast.error(String(firstError));
        }

        return Object.keys(nextErrors).length === 0;
    };

    const buildPayload = () => {
        const payload: any = {};

        const headerFields = [
            ...(templateFields?.header || []),
            ...(templateFields?.headerChild || []),
        ];

        headerFields.forEach((field: any) => {
            if (
                !field?.key ||
                field?.key === "voucherNumber" ||
                isTrueValue(field?.isHidden) ||
                isCustomMasterField(field)
            ) {
                return;
            }

            payload[field.key] =
                form?.[field.key];
        });

        const headerCustomMasters =
            buildCustomMastersPayload(
                headerFields,
                form,
                form?.customMasters || {}
            );

        if (Object.keys(headerCustomMasters).length) {
            payload.customMasters =
                headerCustomMasters;
        }

        (templateFields?.footer || []).forEach((field: any) => {
            if (!field?.key) return;

            if (
                field.key === "totalIssuedQuantity" ||
                field.key === "totalQuantity"
            ) {
                payload[field.key] =
                    String(
                        footerTotals.totalIssuedQuantity
                    );
            } else if (
                field.key === "totalRawMaterialCost" ||
                field.key === "totalAmount" ||
                field.key === "grossAmount"
            ) {
                payload[field.key] =
                    String(
                        footerTotals.totalRawMaterialCost.toFixed(2)
                    );
            } else if (
                form?.[field.key] !== undefined
            ) {
                payload[field.key] =
                    form[field.key];
            }
        });

        payload.voucherDate =
            form?.voucherDate ||
            todayYMD();

        payload.status =
            form?.status ||
            "open";

        payload.transactionType =
            form?.transactionType ||
            "ISSUE_TO_PRODUCTION";

        payload.rawMaterials =
            cleanRawMaterials();

        payload.totalIssuedQuantity =
            String(
                footerTotals.totalIssuedQuantity
            );

        payload.totalRawMaterialCost =
            String(
                footerTotals.totalRawMaterialCost.toFixed(2)
            );

        if (
            form?.headerRemarks !== undefined
        ) {
            payload.headerRemarks =
                form.headerRemarks;
        }

        if (
            form?.remarks !== undefined
        ) {
            payload.remarks =
                form.remarks;
        }

        return payload;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = buildPayload();

        try {
            setSubmitting(true);

            let transactionResponse: any = null;
            let savedVoucherNumber = "";

            if (editingVoucherNumber) {
                transactionResponse =
                    await professionalAxios.put(
                        `${API_BASE}/update/${encodeURIComponent(
                            editingVoucherNumber
                        )}`,
                        payload
                    );

                savedVoucherNumber =
                    getSavedIssueVoucherNumber(
                        transactionResponse,
                        editingVoucherNumber
                    );
            } else {
                transactionResponse =
                    await professionalAxios.post(
                        `${API_BASE}/save`,
                        payload
                    );

                savedVoucherNumber =
                    getSavedIssueVoucherNumber(
                        transactionResponse,
                        ""
                    );
            }

            if (!savedVoucherNumber) {
                throw new Error(
                    "Issue to Production voucher number not found for inventory balance"
                );
            }

            try {
                await syncInventoryBalance(
                    savedVoucherNumber,
                    Boolean(editingVoucherNumber)
                );
            } catch (inventoryError: any) {
                console.log(
                    "Inventory Balance sync failed",
                    inventoryError
                );

                toast.error(
                    inventoryError?.message ||
                    inventoryError?.response?.data?.message ||
                    "Issue to Production saved, but Inventory Balance sync failed"
                );

                setShowModal(false);
                resetForm();
                await fetchIssueToProductionList();
                return;
            }

            toast.success(
                editingVoucherNumber
                    ? "Issue to Production updated successfully"
                    : "Issue to Production created successfully"
            );

            setShowModal(false);
            resetForm();

            await fetchIssueToProductionList();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Issue to Production operation failed"
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!confirmTooltip?.voucherNumber) return;

        try {
            setDeleteLoader(true);

            await professionalAxios.delete(
                `${API_BASE}/delete/${encodeURIComponent(
                    confirmTooltip.voucherNumber
                )}`
            );

            toast.success(
                "Issue to Production deleted successfully"
            );

            await fetchIssueToProductionList();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete Issue to Production"
            );
        } finally {
            setDeleteLoader(false);

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
            });
        }
    };

    const columns = [
        {
            key: "voucherNumber",
            title: "Voucher No",
            render: (row: any) =>
                getVoucherNumber(row) ||
                "-",
        },
        {
            key: "voucherDate",
            title: "Date",
            render: (row: any) =>
                row?.voucherDate
                    ? formatDateForList(
                        row.voucherDate
                    )
                    : "-",
        },
        {
            key: "rawMaterials",
            title: "Raw Items",
            render: (row: any) =>
                row?.rawMaterials?.length ||
                0,
        },
        {
            key: "totalIssuedQuantity",
            title: "Issued Qty",
            render: (row: any) =>
                row?.totalIssuedQuantity ??
                "0",
        },
        {
            key: "totalRawMaterialCost",
            title: "Raw Material Cost",
            render: (row: any) => (
                <span className="font-medium text-card-foreground">
                    {money(
                        row?.totalRawMaterialCost ||
                        0
                    )}
                </span>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.status === "open"
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-danger/20 bg-danger/10 text-danger"
                        }`}
                >
                    {row?.status || "-"}
                </span>
            ),
        },
    ];

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-3 flex items-center">
                <div className="flex items-start gap-3">
                    <Badge
                        count={pagination?.totalDocs ?? 0}
                        text="Total Issue to Production:"
                        varient="primary"
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        arr={["open", "close"]}
                        state={status}
                        setState={handleStatusChange}
                    />

                    <SearchInput
                        search={search}
                        setSearch={setSearch}
                    />

                    <DataREfreshButton
                        callBackFn={handleRefresh}
                        loading={refreshing}
                    />

                    <DataCreateButton
                        callBackFn={openAddModal}
                        text="Add Issue to Production"
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={records}
                loading={listingLoader}
                emptyMessage={`No ${status} Issue to Production found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                openEditModal(record)
                            }
                            className="cursor-pointer rounded-md p-2 text-primary transition hover:bg-primary/10"
                            title="Edit"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            disabled={deleteLoader}
                            onClick={(event) => {
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
                                    voucherNumber:
                                        getVoucherNumber(record),
                                });
                            }}
                            className="cursor-pointer rounded-md p-2 text-danger transition hover:bg-danger/10 disabled:opacity-50"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(event: any) => {
                        setLocalLimit(
                            Number(
                                event.target.value
                            )
                        );

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
                    message="Are you sure you want to delete this Issue to Production?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            voucherNumber: null,
                        })
                    }
                />
            )}

            <DynamicAddForm
                show={showModal}
                setShow={setShowModal}
                edit={Boolean(editingVoucherNumber)}
                title={MODULE_NAME}
                subtitle={`Fill in the ${MODULE_NAME} details below`}
                loading={submitting}
                contentLoading={fieldsLoading}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                form={form}
                errors={errors}
                handleAddRow={handleAddRow}
                handleDeleteRow={handleDeleteRow}
                handleRowChange={handleRowChange}
                inputData={issueFormInputData}
                bodyKey="rawMaterials"
                bodyTitle="Raw Materials"
                addButtonText="Add Raw Material"
                handleChange={handleMainChange}
                bodyCellExtraRenderer={renderIssueToProductionCellExtra}
            />
        </div>
    );
};

export default IssueToProduction;