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
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import Permission from "../../../../../components/PermissionGuard";
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";

import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import { getProductBalance } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import {
    addReceiptFromProduction,
    deleteReceiptFromProduction,
    getReceiptFromProductionList,
    updateReceiptFromProduction,
} from "../../../../../redux/slices/professionalSlice/production/receiptFromProductionSlice";
import professionalAxios from "../../../../../services/professionalAxios";
import {
    formatDateForInput,
    formatDateForList,
    loadAllTemplateOptions,
    money,
    num,
    todayYMD,
} from "../../../../../utils/helperFunctions";

const MODULE_CODE = "receiptFromProduction";
const MODULE_NAME = "Receipt From Production";
const API_BASE = "/eTaxSolnMongoApiBackend/users/bookez/otherApi/receiptFromProduction";
const PRODUCT_FIELD_KEYS = new Set(["productCode", "productName", "productId", "product"]);

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

const isTrueValue = (value: any) => value === true || String(value ?? "").trim().toLowerCase() === "true";

const getFieldDefaultValue = (field: any) => {
    const type = String(field?.type || "").trim().toLowerCase();

    if (type === "boolean") return false;
    if (type === "number" || type === "amount" || type === "currency") return "";
    if (field?.defaultValue !== undefined && field?.defaultValue !== null) return field.defaultValue;

    return "";
};

const getFinancialYearRange = (dateValue?: string) => {
    const selectedDate = dateValue ? new Date(`${dateValue}T23:59:59.999`) : new Date();
    const financialYear = selectedDate.getMonth() >= 3 ? selectedDate.getFullYear() : selectedDate.getFullYear() - 1;

    return {
        fromDate: new Date(financialYear, 3, 1, 0, 0, 0, 0).toISOString(),
        toDate: selectedDate.toISOString(),
    };
};

const renderReceiptProductionCellExtra = (column: any, row: any) => {
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

const ReceiptFromProduction = () => {
    const dispatch = useDispatch<any>();

    const receiptState = useSelector((state: any) => state.receiptFromProduction || {});
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema || {});

    const receiptFromProductions = receiptState?.receiptFromProductions || [];
    const pagination = receiptState?.pagination || defaultPagination;
    const addLoader = receiptState?.addLoader || false;
    const listingLoader = receiptState?.listingLoader || false;
    const deleteLoader = receiptState?.deleteLoader || false;

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucherNumber, setEditingVoucherNumber] = useState<string | null>(null);
    const [templateFields, setTemplateFields] = useState<any>({
        header: [],
        headerChild: [],
        body: [],
        footer: [],
    });
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
        next.transactionType = next.transactionType || "RECEIPT_FROM_PRODUCTION";
        next.reference = { issueVoucherNumber: "", issueId: "" };
        next.customMasters = {};
        next.finishedGoods = [buildBlankRow(schema?.body || [])];

        return next;
    };

    const getVoucherNumber = (record: any) => {
        return record?.voucherNumber || record?.receiptFromProductionVoucherNumber || record?.receiptVoucherNumber || "";
    };

    const getHeaderFieldByKey = (key: string) => {
        return [...(templateFields?.header || []), ...(templateFields?.headerChild || [])].find(
            (field: any) => String(field?.key || "") === String(key)
        );
    };

    const getBodyFieldByKey = (key: string) => {
        return (templateFields?.body || []).find((field: any) => String(field?.key || "") === String(key));
    };

    const getProductBodyField = () => {
        return (templateFields?.body || []).find((field: any) =>
            PRODUCT_FIELD_KEYS.has(String(field?.key || ""))
        );
    };

    const getOptionByValue = (field: any, selectedValue: any) => {
        return (field?.options || []).find((option: any) => String(option?.value) === String(selectedValue));
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

    const applyMappedFields = (field: any, selectedValue: any, oldData: any, fallbackKey = "") => {
        const fieldKey = field?.key || fallbackKey;
        const selectedOption = getOptionByValue(field, selectedValue);
        const raw = selectedOption?.raw || {};
        const updated = { ...oldData };

        if (fieldKey) updated[fieldKey] = selectedValue;

        if (field?.mapFields && raw) {
            Object.entries(field.mapFields).forEach(([targetKey, sourceKey]) => {
                updated[targetKey] =
                    raw?.[sourceKey as string] ??
                    raw?.dynamicFields?.[sourceKey as string] ??
                    raw?.dynamicData?.[sourceKey as string] ??
                    "";
            });
        }

        return updated;
    };

    const calculateFinishedGoodRow = (row: any) => {
        const amount = num(row?.quantity) * num(row?.rate);
        const updated: any = { ...row };

        if (row?.amount !== undefined) updated.amount = amount;
        if (row?.gross !== undefined) updated.gross = amount;
        if (row?.grossAmount !== undefined) updated.grossAmount = amount;

        return updated;
    };

    const cleanFinishedGoods = (rows: any[] = form?.finishedGoods || []) => {
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
                const calculated = calculateFinishedGoodRow(row);
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
                if (cleanRow.gross !== undefined) cleanRow.gross = String(num(cleanRow.gross).toFixed(2));
                if (cleanRow.grossAmount !== undefined) cleanRow.grossAmount = String(num(cleanRow.grossAmount).toFixed(2));

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
        return (form?.finishedGoods || [])
            .map((row: any) => calculateFinishedGoodRow(row))
            .reduce(
                (acc: any, row: any) => {
                    acc.totalProducedQuantity += num(row?.quantity);
                    acc.totalFinishedCost += num(row?.amount ?? row?.grossAmount ?? row?.gross);
                    return acc;
                },
                { totalProducedQuantity: 0, totalFinishedCost: 0 }
            );
    }, [form?.finishedGoods]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || []).map((field: any) => {
            const key = String(field?.key || "");
            let rawValue = form?.[key] ?? field?.defaultValue ?? "";

            if (["totalProducedQuantity", "totalQuantity", "totalQty"].includes(key)) {
                rawValue = footerTotals.totalProducedQuantity;
            }

            if (["totalFinishedCost", "totalAmount", "grossAmount"].includes(key)) {
                rawValue = footerTotals.totalFinishedCost;
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

    const receiptFormInputData = useMemo(() => {
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

    const fetchReceiptFromProductionList = async () => {
        try {
            await dispatch(
                getReceiptFromProductionList({
                    offset: localOffset,
                    limit: localLimit,
                    search: debouncedSearch,
                }) as any
            ).unwrap();
        } catch (error: any) {
            toast.error(error?.message || "Failed to load Receipt From Production list");
        }
    };

    useEffect(() => {
        dispatch(getAllTransactionSchema(MODULE_CODE) as any);
    }, [dispatch]);

    useEffect(() => {
        fetchReceiptFromProductionList();
    }, [localOffset, localLimit, debouncedSearch]);

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

                const updatedData = await loadAllTemplateOptions(transactionsSchema);

                setTemplateFields(updatedData);

                if (!editingVoucherNumber) {
                    setForm(buildBlankForm(updatedData));
                }
            } catch (error) {
                console.log("Failed to prepare Receipt From Production schema", error);
                toast.error("Failed to load Receipt From Production fields");
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchReceiptFromProductionList();
            toast.success("Receipt From Production list refreshed");
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

        [...(templateFields?.header || []), ...(templateFields?.headerChild || [])].forEach((field: any) => {
            if (!field?.key) return;

            let value =
                record?.[field.key] ??
                field?.defaultValue ??
                next?.[field.key] ??
                "";

            if (field.key === "issueVoucherNumber") {
                value =
                    record?.reference?.issueVoucherNumber ??
                    record?.issueVoucherNumber ??
                    value;
            }

            if (field.key === "issueId") {
                value =
                    record?.reference?.issueId ??
                    record?.issueId ??
                    value;
            }

            if (String(field?.type || "").toLowerCase() === "date" && value) {
                value = formatDateForInput(value);
            }

            next[field.key] = value;
        });

        next.voucherNumber = getVoucherNumber(record) || next.voucherNumber;
        next.voucherDate = record?.voucherDate ? formatDateForInput(record.voucherDate) : next.voucherDate;
        next.status = record?.status || next.status || "open";
        next.transactionType = record?.transactionType || next.transactionType || "RECEIPT_FROM_PRODUCTION";

        next.reference = {
            issueVoucherNumber:
                record?.reference?.issueVoucherNumber ||
                record?.issueVoucherNumber ||
                "",
            issueId:
                record?.reference?.issueId ||
                record?.issueId ||
                record?.reference?.issueVoucherNumber ||
                "",
        };

        next.issueVoucherNumber = next.issueVoucherNumber || next.reference.issueVoucherNumber;
        next.issueId = next.issueId || next.reference.issueId;
        next.headerRemarks = record?.headerRemarks ?? next.headerRemarks ?? "";
        next.warehouseCode = record?.warehouseCode ?? next.warehouseCode ?? "";
        next.locationCode = record?.locationCode ?? next.locationCode ?? "";
        next.remarks = record?.remarks ?? next.remarks ?? "";

        const hydratedHeader = applyCustomMasterValues(
            [
                ...(templateFields?.header || []),
                ...(templateFields?.headerChild || []),
            ],
            next,
            record?.customMasters || {}
        );

        hydratedHeader.finishedGoods =
            Array.isArray(record?.finishedGoods) && record.finishedGoods.length
                ? record.finishedGoods.map((item: any) =>
                    applyCustomMasterValues(
                        templateFields?.body || [],
                        {
                            ...buildBlankRow(templateFields?.body || []),
                            ...item,
                            availableQuantity: null,
                            productType: item?.productType || "finishedgoods",
                            id: item?.id || Date.now() + Math.random(),
                            _inventoryBalanceSelections: {},
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

            const response = await professionalAxios.get(
                `${API_BASE}/getByVoucherNo/${encodeURIComponent(voucherNumber)}`
            );

            const responseData = response?.data?.data ?? response?.data ?? {};
            const detail =
                responseData?.record ||
                responseData?.receiptFromProduction ||
                responseData ||
                record;

            setEditingVoucherNumber(voucherNumber);
            setErrors({});
            setForm(buildFormFromRecord(detail));
            setShowModal(true);
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load Receipt From Production"
            );
        } finally {
            setFieldsLoading(false);
        }
    };

    const loadFinishedGoodAvailableQuantity = async (
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
                const rows = [...(previous?.finishedGoods || [])];

                if (!rows[index]) return previous;

                rows[index] = {
                    ...rows[index],
                    productType: normalizedProductType,
                    availableQuantity: null,
                };

                return {
                    ...previous,
                    finishedGoods: rows,
                };
            });

            return;
        }

        setForm((previous: any) => {
            const rows = [...(previous?.finishedGoods || [])];

            if (
                !rows[index] ||
                String(rows[index]?.productCode || "") !== String(productCode)
            ) {
                return previous;
            }

            rows[index] = {
                ...rows[index],
                productType: normalizedProductType,
                availableQuantity: null,
            };

            return {
                ...previous,
                finishedGoods: rows,
            };
        });

        try {
            const { fromDate, toDate } = getFinancialYearRange(
                voucherDate || form?.voucherDate || todayYMD()
            );

            const balance: any = await dispatch(
                getProductBalance({
                    productCode,
                    fromDate,
                    toDate,
                    ...getInventoryBalanceFilters(
                        rowData ||
                        form?.finishedGoods?.[index]
                    ),
                }) as any
            ).unwrap();

            setForm((previous: any) => {
                const rows = [...(previous?.finishedGoods || [])];

                if (
                    !rows[index] ||
                    String(rows[index]?.productCode || "") !== String(productCode)
                ) {
                    return previous;
                }

                rows[index] = {
                    ...rows[index],
                    productType: normalizedProductType,
                    availableQuantity:
                        balance?.balanceQuantity !== undefined &&
                            balance?.balanceQuantity !== null
                            ? balance.balanceQuantity
                            : null,
                };

                return {
                    ...previous,
                    finishedGoods: rows,
                };
            });
        } catch (error) {
            console.log(
                `Failed to fetch finished good available quantity for ${productCode}`,
                error
            );

            setForm((previous: any) => {
                const rows = [...(previous?.finishedGoods || [])];

                if (
                    !rows[index] ||
                    String(rows[index]?.productCode || "") !== String(productCode)
                ) {
                    return previous;
                }

                rows[index] = {
                    ...rows[index],
                    productType: normalizedProductType,
                    availableQuantity: rows[index]?.availableQuantity ?? null,
                };

                return {
                    ...previous,
                    finishedGoods: rows,
                };
            });
        }
    };

    useEffect(() => {
        if (!showModal || !editingVoucherNumber) return;

        const productField = getProductBodyField();

        (form?.finishedGoods || []).forEach((row: any, index: number) => {
            if (!row?.productCode) return;

            const option = (productField?.options || []).find(
                (item: any) =>
                    String(item?.value) === String(row.productCode)
            );

            const raw = option?.raw || {};

            void loadFinishedGoodAvailableQuantity(
                index,
                String(row.productCode),
                String(
                    raw?.productType ||
                    raw?.dynamicFields?.productType ||
                    row?.productType ||
                    "finishedgoods"
                ),
                form?.voucherDate
            );
        });
    }, [showModal, editingVoucherNumber]);

    const handleMainChange = (key: string, value: any) => {
        const field = getHeaderFieldByKey(key);

        setForm((previous: any) => {
            let updated = applyMappedFields(field, value, previous, key);

            if (isCustomMasterField(field)) {
                const masterName = getCustomMasterName(field);

                const currentCustomMasters =
                    updated?.customMasters &&
                        typeof updated.customMasters === "object"
                        ? { ...updated.customMasters }
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

                updated.customMasters = currentCustomMasters;
            }

            if (key === "issueVoucherNumber") {
                updated = {
                    ...updated,
                    reference: {
                        ...(previous?.reference || {}),
                        issueVoucherNumber: value,
                        issueId:
                            previous?.reference?.issueId ||
                            previous?.issueId ||
                            value,
                    },
                };
            }

            if (key === "issueId") {
                updated = {
                    ...updated,
                    reference: {
                        ...(previous?.reference || {}),
                        issueId: value,
                    },
                };
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
            finishedGoods: [
                ...(previous?.finishedGoods || []),
                buildBlankRow(templateFields?.body || []),
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((previous: any) => {
            const rows = (previous?.finishedGoods || []).filter(
                (_: any, rowIndex: number) => rowIndex !== index
            );

            return {
                ...previous,
                finishedGoods:
                    rows.length
                        ? rows
                        : [buildBlankRow(templateFields?.body || [])],
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        const field = getBodyFieldByKey(key);
        const isProductField = PRODUCT_FIELD_KEYS.has(key);

        const selectedOption = getOptionByValue(field, value);
        const selectedRaw = selectedOption?.raw || {};

        const currentRow = form?.finishedGoods?.[index] || {};

        let balanceRow: any = {
            ...currentRow,
            [key]: value,
        };

        balanceRow = applyMappedFields(
            field,
            value,
            balanceRow,
            key
        );

        if (isInventoryBalanceField(field)) {
            const apiKey = getInventoryBalanceApiKey(field);

            const selectedCode =
                selectedOption?.value ??
                selectedRaw?.code ??
                selectedRaw?.masterCode ??
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

        if (isProductField) {
            balanceRow.productCode =
                selectedRaw?.productCode ||
                balanceRow?.productCode ||
                (key === "productCode" ? value : "");

            balanceRow.productName =
                selectedRaw?.productName ||
                balanceRow?.productName ||
                (
                    key === "productName"
                        ? selectedOption?.label || value
                        : ""
                );

            balanceRow.productId =
                selectedRaw?._id ||
                selectedRaw?.productId ||
                balanceRow?.productId ||
                "";

            balanceRow.unit =
                selectedRaw?.unit ||
                balanceRow?.unit ||
                "";

            balanceRow.uom =
                selectedRaw?.uom ||
                selectedRaw?.unit ||
                balanceRow?.uom ||
                "";

            balanceRow.rate =
                balanceRow?.rate ||
                selectedRaw?.sellingPrice ||
                selectedRaw?.productSellingPrice ||
                selectedRaw?.salesRate ||
                selectedRaw?.saleRate ||
                selectedRaw?.rate ||
                "";

            balanceRow.productType = String(
                selectedRaw?.productType ||
                selectedRaw?.dynamicFields?.productType ||
                "finishedgoods"
            );

            balanceRow.availableQuantity = null;
        }

        setForm((previous: any) => {
            const rows = [...(previous?.finishedGoods || [])];

            let row = {
                ...(rows[index] || buildBlankRow(templateFields?.body || [])),
                [key]: value,
            };

            row = applyMappedFields(
                field,
                value,
                row,
                key
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

            if (isProductField) {
                row.productCode = balanceRow.productCode;
                row.productName = balanceRow.productName;
                row.productId = balanceRow.productId;
                row.unit = balanceRow.unit;
                row.uom = balanceRow.uom;
                row.rate = balanceRow.rate;
                row.productType = balanceRow.productType;
                row.availableQuantity = null;
            }

            if (
                key === "quantity" ||
                key === "rate" ||
                isProductField
            ) {
                row = calculateFinishedGoodRow(row);
            }

            rows[index] = row;

            return {
                ...previous,
                finishedGoods: rows,
            };
        });

        if (
            (isProductField || isInventoryBalanceField(field)) &&
            balanceRow?.productCode
        ) {
            void loadFinishedGoodAvailableQuantity(
                index,
                String(balanceRow.productCode),
                String(balanceRow.productType || "finishedgoods"),
                form?.voucherDate,
                balanceRow
            );
        }

        setErrors((previous: any) => ({
            ...previous,
            finishedGoods: "",
            [`row_${index}_${key}`]: "",
        }));
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

            const isHidden = isTrueValue(field?.isHidden);

            if (!field?.key || isHidden || !isRequired) return;

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

        const rows = cleanFinishedGoods();

        if (!rows.length) {
            nextErrors.finishedGoods =
                "Please add at least one finished good";
        }

        (form?.finishedGoods || []).forEach((row: any, index: number) => {
            const hasData = (templateFields?.body || []).some((field: any) => {
                const value = row?.[field?.key];

                return (
                    value !== "" &&
                    value !== null &&
                    value !== undefined
                );
            });

            if (!hasData) return;

            (templateFields?.body || []).forEach((field: any) => {
                const isRequired =
                    isTrueValue(field?.isRequired) ||
                    isTrueValue(field?.required);

                const isHidden = isTrueValue(field?.isHidden);

                if (!field?.key || isHidden || !isRequired) return;

                const value = row?.[field.key];
                const isEmpty =
                    value === "" ||
                    value === null ||
                    value === undefined;

                if (isEmpty) {
                    nextErrors[`row_${index}_${field.key}`] =
                        `${field?.label || field.key} is required`;
                }
            });
        });

        setErrors(nextErrors);

        const firstError = Object.values(nextErrors)?.[0];

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

            if (
                ["issueVoucherNumber", "issueId"].includes(
                    field.key
                )
            ) {
                return;
            }

            payload[field.key] = form?.[field.key];
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
                [
                    "totalProducedQuantity",
                    "totalQuantity",
                    "totalQty",
                ].includes(field.key)
            ) {
                payload[field.key] = String(
                    footerTotals.totalProducedQuantity
                );
            } else if (
                [
                    "totalFinishedCost",
                    "totalAmount",
                    "grossAmount",
                ].includes(field.key)
            ) {
                payload[field.key] = String(
                    footerTotals.totalFinishedCost.toFixed(2)
                );
            } else if (form?.[field.key] !== undefined) {
                payload[field.key] = form[field.key];
            }
        });

        const issueVoucherNumber =
            form?.reference?.issueVoucherNumber ||
            form?.issueVoucherNumber ||
            "";

        const issueId =
            form?.reference?.issueId ||
            form?.issueId ||
            issueVoucherNumber ||
            "";

        payload.voucherDate = form?.voucherDate || todayYMD();
        payload.status = form?.status || "open";
        payload.transactionType =
            form?.transactionType ||
            "RECEIPT_FROM_PRODUCTION";

        payload.reference = {
            issueVoucherNumber,
            issueId,
        };

        payload.finishedGoods = cleanFinishedGoods();

        payload.totalProducedQuantity = String(
            footerTotals.totalProducedQuantity
        );

        payload.totalFinishedCost = String(
            footerTotals.totalFinishedCost.toFixed(2)
        );

        if (form?.headerRemarks !== undefined) {
            payload.headerRemarks = form.headerRemarks;
        }

        if (form?.warehouseCode !== undefined) {
            payload.warehouseCode = form.warehouseCode;
        }

        if (form?.locationCode !== undefined) {
            payload.locationCode = form.locationCode;
        }

        if (form?.remarks !== undefined) {
            payload.remarks = form.remarks;
        }

        return payload;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = buildPayload();

        try {
            if (editingVoucherNumber) {
                await dispatch(
                    updateReceiptFromProduction({
                        payload,
                        receiptFromProductionVoucherNumber:
                            editingVoucherNumber,
                    }) as any
                ).unwrap();

                toast.success(
                    "Receipt From Production updated successfully"
                );
            } else {
                await dispatch(
                    addReceiptFromProduction({
                        payload,
                    }) as any
                ).unwrap();

                toast.success(
                    "Receipt From Production created successfully"
                );
            }

            setShowModal(false);
            resetForm();
            await fetchReceiptFromProductionList();
        } catch (error: any) {
            toast.error(
                error?.message ||
                "Receipt From Production operation failed"
            );
        }
    };

    const handleDeleteConfirm = async () => {
        if (!confirmTooltip?.voucherNumber) return;

        try {
            await dispatch(
                deleteReceiptFromProduction({
                    receiptFromProductionVoucherNumber:
                        confirmTooltip.voucherNumber,
                }) as any
            ).unwrap();

            toast.success(
                "Receipt From Production deleted successfully"
            );

            await fetchReceiptFromProductionList();
        } catch (error: any) {
            toast.error(
                error?.message ||
                "Failed to delete Receipt From Production"
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

    const columns = [
        {
            key: "voucherNumber",
            title: "Voucher No",
            render: (row: any) =>
                getVoucherNumber(row) || "-",
        },
        {
            key: "voucherDate",
            title: "Date",
            render: (row: any) =>
                row?.voucherDate
                    ? formatDateForList(row.voucherDate)
                    : "-",
        },
        {
            key: "reference",
            title: "Issue Reference",
            render: (row: any) =>
                row?.reference?.issueVoucherNumber ||
                row?.issueVoucherNumber ||
                "-",
        },
        {
            key: "finishedGoods",
            title: "Finished Goods",
            render: (row: any) =>
                row?.finishedGoods?.length || 0,
        },
        {
            key: "totalProducedQuantity",
            title: "Produced Qty",
            render: (row: any) =>
                row?.totalProducedQuantity ?? "0",
        },
        {
            key: "totalFinishedCost",
            title: "Finished Cost",
            render: (row: any) => (
                <span className="font-medium text-card-foreground">
                    {money(row?.totalFinishedCost || 0)}
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
                        text="Total Receipt From Production:"
                        varient="primary"
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <SearchInput
                        search={search}
                        setSearch={setSearch}
                    />

                    <DataREfreshButton
                        callBackFn={handleRefresh}
                        loading={refreshing}
                    />

                    <Permission
                        module="bookez"
                        permissionKey="productions.receiptFromProduction"
                        action="create"
                    >
                        <DataCreateButton
                            callBackFn={openAddModal}
                            text="Add Receipt From Production"
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={receiptFromProductions}
                loading={listingLoader}
                emptyMessage="No Receipt From Production found"
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <Permission
                            module="bookez"
                            permissionKey="productions.receiptFromProduction"
                            action="update"
                        >
                            <button
                                onClick={() =>
                                    openEditModal(record)
                                }
                                className="cursor-pointer rounded-md p-2 text-primary transition hover:bg-primary/10"
                                title="Edit"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission
                            module="bookez"
                            permissionKey="productions.receiptFromProduction"
                            action="delete"
                        >
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
                        </Permission>
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
                    message="Are you sure you want to delete this Receipt From Production?"
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
                loading={addLoader}
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
                inputData={receiptFormInputData}
                bodyKey="finishedGoods"
                bodyTitle="Finished Goods"
                addButtonText="Add Finished Good"
                handleChange={handleMainChange}
                bodyCellExtraRenderer={renderReceiptProductionCellExtra}
            />
        </div>
    );
};

export default ReceiptFromProduction;