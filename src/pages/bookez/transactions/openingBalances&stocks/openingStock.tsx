import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { DataCreateButton } from "../../../../components/buttons";
import SearchInput from "../../../../components/searchInput";
import DataTable from "../../../../components/DataTable";
import Toggle from "../../../../components/toggle";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import { getAllProducts, getProductBalance, saveInventoryBalance, updateInventoryBalance } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import { getAllTransactionSchema } from "../../../../redux/slices/professionalSlice/transactionSchema";
import { loadAllTemplateOptions, money, num, safePercent, todayYMD, } from "../../../../utils/helperFunctions";
import { addOpeningStock, deleteOpeningStock, getOpeningStockList, updateOpeningStock, } from "../../../../redux/slices/professionalSlice/openingBalancesStocks/openingStockSlice";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
import Permission from "../../../../components/PermissionGuard";
import Badge from "../../../../components/badge";
import InputBorderLabel from "../../../../components/common/InputBorderLabel";
import professionalAxios from "../../../../services/professionalAxios";
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
const BODY_STANDARD_FIELD_KEYS = new Set([
    "productCode",
    "productName",
    "productId",
    "productDescription",
    "description",
    "productHSNCode",
    "remarks",
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
    "otherAmount",
    "netAmount",
    "netTotal",
]);
const HEADER_STANDARD_FIELD_KEYS = new Set([
    "openingStockVoucherNumber",
    "openingStockDate",
    "remark",
    "openingStockStatus",
]);
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
    customMasters: {},
    _inventoryBalanceSelections: {},
    _inventoryBalanceVoucherId: "",
};
const getDefaultForm = () => ({
    openingStockVoucherNumber: "OPSTOCK",
    openingStockDate: todayYMD(),
    remark: "",
    openingStockStatus: "open",
    customMasters: {},
    openingStockBody: [{ ...emptyProductRow, id: Date.now() }],
});
const mainColumns = [
    {
        key: "openingStockVoucherNumber",
        title: "Voucher",
    },
    {
        key: "openingStockDate",
        title: "Date",
        type: "date",
    },
    {
        key: "totalQuantity",
        title: "Total Qty",
        render: (row: any) => (<span>{row?.openingStockFooter?.totalQuantity || 0}</span>),
    },
    {
        key: "totalNetAmount",
        title: "Net Amount",
        render: (row: any) => (<span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
            {money(row?.openingStockFooter?.totalNetAmount)}
        </span>),
        type: "amount",
    },
    {
        key: "openingStockStatus",
        title: "Status",
        render: (row: any) => (<span className={`rounded-md px-2 py-1 text-xs capitalize ${row?.openingStockStatus === "close"
            ? "bg-success/10 text-success"
            : "bg-primary/10 text-primary"}`}>
            {row?.openingStockStatus || "open"}
        </span>),
    },
];
const isTrueValue = (value: any) => {
    return (value === true ||
        String(value ?? "").trim().toLowerCase() === "true");
};
const getDynamicFieldType = (field: any) => {
    return String(field?.type ||
        field?.dataSource?.type ||
        "")
        .trim()
        .toLowerCase()
        .replace(/\s/g, "");
};
const isCustomMasterField = (field: any) => {
    const fieldType = getDynamicFieldType(field);
    return (fieldType === "custommaster" ||
        fieldType === "customemaster" ||
        Boolean(field?.customMasterCode));
};
const getCustomMasterName = (field: any) => {
    return String(field?.customMasterName ||
        field?.dataSource?.customMasterName ||
        field?.label ||
        field?.title ||
        field?.key ||
        "").trim();
};
const normalizeCustomMasterValue = (value: any) => {
    if (!value || typeof value !== "object")
        return null;
    const code = String(value?.code ||
        value?.value ||
        "").trim();
    const name = String(value?.name ||
        value?.label ||
        "").trim();
    if (!code)
        return null;
    return {
        code,
        name,
    };
};


const renderOpeningStockCellExtra = (column: any, row: any) => {
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
const OpeningStock = () => {
    const dispatch = useDispatch<any>();
    const { products } = useSelector((s: any) => s.productMaster);
    const { openingStock, listingLoader, pagination, addLoader, updateLoader, deleteLoader, } = useSelector((s: any) => s.openingStock);
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [status, setStatus] = useState("open");
    const [showModal, setShowModal] = useState(false);
    const [edit, setEdit] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [templateFields, setTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });
    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        openingStockVoucherNumber: null,
    });
    const [form, setForm] = useState<any>(getDefaultForm());
    const productOptions = useMemo(() => {
        return (products || []).map((item: any) => ({
            label: item?.productName ||
                item?.name ||
                item?.productCode,
            value: item?.productCode,
            raw: item,
        }));
    }, [products]);
    const unitOptions = useMemo(() => {
        const unitMap = new Map();
        (products || []).forEach((item: any) => {
            const unitValue = item?.unit ||
                item?.uom ||
                item?.unitCode;
            if (unitValue &&
                !unitMap.has(unitValue)) {
                unitMap.set(unitValue, {
                    label: item?.unit ||
                        item?.uom ||
                        item?.unitName ||
                        unitValue,
                    value: unitValue,
                    raw: item,
                });
            }
        });
        return Array.from(unitMap.values());
    }, [products]);
    const getHeaderFieldByKey = (key: string) => {
        return templateFields?.header?.find((field: any) => String(field?.key) ===
            String(key));
    };
    const getBodyFieldByKey = (key: string) => {
        return templateFields?.body?.find((field: any) => String(field?.key) ===
            String(key));
    };
    const getOptionByValue = (field: any, selectedValue: any) => {
        return (field?.options || []).find((option: any) => String(option?.value) ===
            String(selectedValue));
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

        if (selectedFilters?.warehouseCode) {
            filters.warehouseCode = selectedFilters.warehouseCode;
        }

        if (selectedFilters?.locationCode) {
            filters.locationCode = selectedFilters.locationCode;
        }

        if (selectedFilters?.batchNumber) {
            filters.batchNumber = selectedFilters.batchNumber;
        }

        if (selectedFilters?.binCode) {
            filters.binCode = selectedFilters.binCode;
        }

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
            templateFields?.header || [],
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

            if (voucherId) {
                usedVoucherIds.add(voucherId);
            }

            return {
                ...row,
                _inventoryBalanceVoucherId: voucherId,
            };
        });
    };

    const resolveSavedOpeningStockVoucherNumber = (
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
                "openingStockVoucherNumber",
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
        const openingStatus = String(
            form?.openingStockStatus ||
            status ||
            "open"
        )
            .trim()
            .toLowerCase();

        const inventoryStatus =
            ["close", "closed", "cancelled"].includes(openingStatus)
                ? "inactive"
                : "active";

        return {
            voucherNumber,
            voucherNumberSnapshot:
                form?.openingStockVoucherNumber &&
                    form.openingStockVoucherNumber !== "AUTO"
                    ? form.openingStockVoucherNumber
                    : voucherNumber,
            voucherType: "openingStock",
            sourceModule: "openingStock",
            voucherStatus: inventoryStatus,
            voucherDate: toInventoryIsoDate(
                form?.openingStockDate || todayYMD()
            ),
            party: "openingStock",
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
                form?.remark ||
                "Opening Stock",
            status: inventoryStatus,
        };
    };

    const syncInventoryBalance = async (
        voucherNumber: string,
        isEdit: boolean
    ) => {
        const rows = (form?.openingStockBody || []).filter(
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
                console.log(
                    "CALLING OPENING STOCK INVENTORY BALANCE SAVE",
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
                    "CALLING OPENING STOCK INVENTORY BALANCE UPDATE",
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
                    "NO OPENING STOCK INVENTORY VID - CALLING SAVE",
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
    const getCustomMasterSelection = (field: any, selectedValue: any) => {
        if (selectedValue === undefined ||
            selectedValue === null ||
            String(selectedValue).trim() === "") {
            return null;
        }
        const selectedOption = getOptionByValue(field, selectedValue);
        const raw = selectedOption?.raw || {};
        const nestedData = raw?.data &&
            typeof raw.data === "object"
            ? raw.data
            : raw?.dynamicFields &&
                typeof raw.dynamicFields === "object"
                ? raw.dynamicFields
                : raw?.customFields &&
                    typeof raw.customFields === "object"
                    ? raw.customFields
                    : {};
        const code = String(selectedOption?.value ||
            raw?.code ||
            nestedData?.code ||
            selectedValue ||
            "").trim();
        const name = String(selectedOption?.label ||
            raw?.name ||
            nestedData?.name ||
            "").trim();
        if (!code)
            return null;
        return {
            code,
            name,
        };
    };
    const buildCustomMastersPayload = (fields: any[], data: any, existingCustomMasters: any = {}) => {
        const customMasters: Record<string, {
            code: string;
            name: string;
        }> = {};
        (fields || []).forEach((field: any) => {
            if (isTrueValue(field?.isHidden) ||
                !isCustomMasterField(field)) {
                return;
            }
            const masterName = getCustomMasterName(field);
            if (!masterName) {
                return;
            }
            const selectedValue = data?.[field.key];
            const selectedMaster = getCustomMasterSelection(field, selectedValue);
            const existingMaster = normalizeCustomMasterValue(existingCustomMasters?.[masterName]);
            const finalMaster = selectedMaster ||
                existingMaster;
            if (finalMaster?.code) {
                customMasters[masterName] = finalMaster;
            }
        });
        return customMasters;
    };
    const buildDynamicSectionPayload = (fields: any[], data: any, standardKeys: Set<string>) => {
        const dynamicValues: Record<string, any> = {};
        (fields || []).forEach((field: any) => {
            const key = String(field?.key ||
                "").trim();
            if (!key ||
                isTrueValue(field?.isHidden) ||
                isCustomMasterField(field) ||
                standardKeys.has(key)) {
                return;
            }
            const value = data?.[key];
            if (value !== undefined &&
                value !== null &&
                value !== "") {
                dynamicValues[key] =
                    value;
            }
        });
        return dynamicValues;
    };
    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
        if (!field)
            return oldData;
        const selectedOption = getOptionByValue(field, selectedValue);
        const updated = {
            ...oldData,
            [field.key]: selectedValue,
        };
        if (field?.mapFields &&
            selectedOption?.raw) {
            Object.entries(field.mapFields).forEach(([targetKey, sourceKey,]) => {
                updated[targetKey] =
                    selectedOption
                        .raw?.[sourceKey as string] ?? "";
            });
        }
        return updated;
    };
    const getUnitLabelFromSchema = (unitCode: string) => {
        const unitField = templateFields?.body?.find((field: any) => field.key === "uom" ||
            field.key === "unit");
        const selectedUnit = unitField?.options?.find((item: any) => String(item.value) ===
            String(unitCode));
        if (selectedUnit?.label) {
            return selectedUnit.label;
        }
        const fallbackUnit = unitOptions.find((item: any) => String(item.value) ===
            String(unitCode));
        return (fallbackUnit?.label ||
            unitCode ||
            "");
    };
    const normalizeRowKeys = (row: any) => {
        const updated = {
            ...row,
        };
        if (updated.uom &&
            !updated.unit) {
            updated.unit =
                updated.uom;
        }
        if (updated.unit &&
            !updated.uom) {
            updated.uom =
                updated.unit;
        }
        if (updated.productDescription &&
            !updated.description) {
            updated.description =
                updated.productDescription;
        }
        if (updated.description &&
            !updated.productDescription) {
            updated.productDescription =
                updated.description;
        }
        if (updated.netAmount &&
            !updated.netTotal) {
            updated.netTotal =
                updated.netAmount;
        }
        if (updated.netTotal &&
            !updated.netAmount) {
            updated.netAmount =
                updated.netTotal;
        }
        if (updated.gross &&
            !updated.grossAmount) {
            updated.grossAmount =
                updated.gross;
        }
        if (updated.grossAmount &&
            !updated.gross) {
            updated.gross =
                updated.grossAmount;
        }
        updated.unitName =
            getUnitLabelFromSchema(updated.unit ||
                updated.uom);
        return updated;
    };
    const calculateRow = (row: any) => {
        const getPreferredValue = (primary: any, fallback: any) => primary !== undefined && primary !== null && primary !== "" ? primary : fallback;
        const quantity = num(row.quantity);
        const rate = num(row.rate);
        const grossAmount = quantity * rate;
        const discountPercentage = safePercent(getPreferredValue(row.discountPercentage, row.discount));
        const cgstPercentage = safePercent(getPreferredValue(row.cgstPercentage, row.cgst));
        const sgstPercentage = safePercent(getPreferredValue(row.sgstPercentage, row.sgst));
        const igstPercentage = safePercent(getPreferredValue(row.igstPercentage, row.igst));
        const discountAmount = (grossAmount *
            discountPercentage) / 100;
        const taxableAmount = grossAmount -
            discountAmount;
        const cgstAmount = (taxableAmount *
            cgstPercentage) / 100;
        const sgstAmount = (taxableAmount *
            sgstPercentage) / 100;
        const igstAmount = (taxableAmount *
            igstPercentage) / 100;
        const otherAmount = num(row.otherAmount);
        const taxAmount = cgstAmount +
            sgstAmount +
            igstAmount;
        const netTotal = taxableAmount +
            taxAmount +
            otherAmount;
        return {
            ...row,
            quantity,
            rate,
            gross: grossAmount,
            grossAmount,
            discount: discountPercentage,
            discountPercentage,
            discountAmount,
            taxableAmount,
            cgst: cgstPercentage,
            cgstPercentage,
            cgstAmount,
            sgst: sgstPercentage,
            sgstPercentage,
            sgstAmount,
            igst: igstPercentage,
            igstPercentage,
            igstAmount,
            otherAmount,
            taxAmount,
            netAmount: netTotal,
            netTotal,
            unit: row.unit ||
                row.uom ||
                "",
            uom: row.uom ||
                row.unit ||
                "",
            description: row.description ||
                row.productDescription ||
                "",
            productDescription: row.productDescription ||
                row.description ||
                "",
        };
    };
    const footerTotals = useMemo(() => {
        return (form.openingStockBody ||
            []).reduce((acc: any, item: any) => {
                acc.totalQuantity +=
                    num(item.quantity);
                acc.totalGrossAmount +=
                    num(item.grossAmount);
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
                    num(item.netTotal ||
                        item.netAmount);
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
    }, [
        form.openingStockBody,
    ]);
    const dynamicFooterArray = useMemo(() => {
        const footerKeyMap: Record<string, string> = {
            grossAmount: "totalGrossAmount",
            totalGrossAmount: "totalGrossAmount",

            discountAmount: "totalDiscountAmount",
            totalDiscountAmount: "totalDiscountAmount",

            cgstAmount: "totalCgstAmount",
            totalCgstAmount: "totalCgstAmount",

            sgstAmount: "totalSgstAmount",
            totalSgstAmount: "totalSgstAmount",

            igstAmount: "totalIgstAmount",
            totalIgstAmount: "totalIgstAmount",

            taxAmount: "totalTaxAmount",
            totalTaxAmount: "totalTaxAmount",

            otherAmount: "totalOtherAmount",
            totalOtherAmount: "totalOtherAmount",

            netAmount: "totalNetAmount",
            netTotal: "totalNetAmount",
            totalNetAmount: "totalNetAmount",

            quantity: "totalQuantity",
            totalQuantity: "totalQuantity",
        };

        return (templateFields?.footer || [])
            .filter((field: any) => !isTrueValue(field?.isHidden))
            .map((field: any) => {
                const footerKey = footerKeyMap[String(field?.key || "")] || field?.key;
                const rawValue = footerTotals?.[footerKey] ?? 0;

                return {
                    ...field,
                    value: typeof rawValue === "number" ? money(rawValue) : rawValue,
                    rawValue,
                };
            });
    }, [
        templateFields?.footer,
        footerTotals,
    ]);




    const hasDynamicSchema = useMemo(() => {
        return ((templateFields
            ?.header
            ?.length ||
            0) > 0 ||
            (templateFields
                ?.body
                ?.length ||
                0) > 0 ||
            (templateFields
                ?.footer
                ?.length ||
                0) > 0);
    }, [templateFields]);
    const fallbackInputData = useMemo(() => ({
        header: [
            {
                key: "openingStockVoucherNumber",
                label: "Voucher No",
                type: "text",
                disabled: true,
            },
            {
                key: "openingStockDate",
                label: "Date",
                type: "date",
                disabled: false,
                isRequired: true,
            },
            {
                key: "remark",
                label: "Remark",
                type: "textarea",
                required: false,
                placeholder: "Enter Remark",
                colSpan: "full",
            },
        ],
        body: [
            {
                key: "productCode",
                title: "Product",
                type: "select",
                width: "240px",
                required: true,
                options: productOptions,
            },
            {
                key: "description",
                title: "Description",
                type: "text",
                width: "220px",
            },
            {
                key: "remarks",
                title: "Remarks",
                type: "text",
                width: "180px",
            },
            {
                key: "quantity",
                title: "Qty",
                type: "number",
                width: "120px",
                required: true,
                align: "right",
            },
            {
                key: "unit",
                title: "Unit",
                type: "select",
                width: "150px",
                required: true,
                options: unitOptions,
            },
            {
                key: "rate",
                title: "Rate",
                type: "number",
                width: "130px",
                required: true,
                align: "right",
            },
            {
                key: "grossAmount",
                title: "Gross",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "discountPercentage",
                title: "Disc %",
                type: "number",
                width: "110px",
                align: "right",
            },
            {
                key: "discountAmount",
                title: "Disc Amt",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "cgstPercentage",
                title: "CGST %",
                type: "number",
                width: "110px",
                align: "right",
            },
            {
                key: "cgstAmount",
                title: "CGST Amt",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "sgstPercentage",
                title: "SGST %",
                type: "number",
                width: "110px",
                align: "right",
            },
            {
                key: "sgstAmount",
                title: "SGST Amt",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "igstPercentage",
                title: "IGST %",
                type: "number",
                width: "110px",
                align: "right",
            },
            {
                key: "igstAmount",
                title: "IGST Amt",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "otherAmount",
                title: "Other",
                type: "number",
                width: "130px",
                align: "right",
            },
            {
                key: "taxAmount",
                title: "Tax",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "netTotal",
                title: "Net",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
        ],
        footer: [
            {
                key: "totalQuantity",
                label: "Total Quantity",
                value: footerTotals
                    .totalQuantity,
                rawValue: footerTotals
                    .totalQuantity,
            },
            {
                key: "totalGrossAmount",
                label: "Gross Amount",
                value: money(footerTotals
                    .totalGrossAmount),
                rawValue: footerTotals
                    .totalGrossAmount,
            },
            {
                key: "totalTaxAmount",
                label: "Tax Amount",
                value: money(footerTotals
                    .totalTaxAmount),
                rawValue: footerTotals
                    .totalTaxAmount,
            },
            {
                key: "totalNetAmount",
                label: "Net Amount",
                value: money(footerTotals
                    .totalNetAmount),
                rawValue: footerTotals
                    .totalNetAmount,
            },
        ],
    }), [
        productOptions,
        unitOptions,
        footerTotals,
    ]);
    const dynamicInputData = useMemo(() => {
        if (!hasDynamicSchema) {
            return fallbackInputData;
        }
        return {
            ...templateFields,
            header: (templateFields
                ?.header ||
                []).map((field: any) => {
                    return field;
                }),
            body: (templateFields
                ?.body ||
                []).map((field: any) => {
                    const fieldKey = String(field?.key ||
                        "");
                    if (PRODUCT_FIELD_KEYS.has(fieldKey) &&
                        !(field
                            ?.options ||
                            []).length) {
                        return {
                            ...field,
                            options: productOptions,
                        };
                    }
                    if ((fieldKey ===
                        "unit" ||
                        fieldKey ===
                        "uom") &&
                        !(field
                            ?.options ||
                            []).length) {
                        return {
                            ...field,
                            options: unitOptions,
                        };
                    }
                    return field;
                }),
            footer: dynamicFooterArray,
        };
    }, [
        hasDynamicSchema,
        fallbackInputData,
        templateFields,
        productOptions,
        unitOptions,
        dynamicFooterArray,
    ]);
    const resetMainForm = () => {
        setForm(getDefaultForm());
        setEdit(false);
        setErrors({});
    };
    const handleChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const currentField = getHeaderFieldByKey(key);
            let updated = {
                ...prev,
                [key]: value,
            };
            if (currentField
                ?.mapFields) {
                updated =
                    applyMappedFields(currentField, value, updated);
            }
            if (isCustomMasterField(currentField)) {
                const masterName = getCustomMasterName(currentField);
                const currentCustomMasters = updated
                    ?.customMasters &&
                    typeof updated.customMasters ===
                    "object"
                    ? {
                        ...updated.customMasters,
                    }
                    : {};
                const selectedMaster = getCustomMasterSelection(currentField, value);
                if (selectedMaster) {
                    currentCustomMasters[masterName] =
                        selectedMaster;
                }
                else {
                    delete currentCustomMasters[masterName];
                }
                updated.customMasters =
                    currentCustomMasters;
            }
            return updated;
        });
        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };
    const handleRowChange = async (index: number, key: string, value: any) => {
        const duplicate = Boolean(form
            ?.openingStockBody
            ?.some((item: any, rowIndex: number) => {
                if (rowIndex ===
                    index) {
                    return false;
                }
                if (!PRODUCT_FIELD_KEYS.has(key)) {
                    return false;
                }
                return (String(item
                    ?.productCode ||
                    "") ===
                    String(value ||
                        "") ||
                    String(item
                        ?.productName ||
                        "") ===
                    String(value ||
                        "") ||
                    String(item
                        ?.productId ||
                        "") ===
                    String(value ||
                        ""));
            }));
        if (PRODUCT_FIELD_KEYS.has(key) &&
            duplicate) {
            setErrors((prev: any) => ({
                ...prev,
                openingStockBody: "",
                [`row_${index}_${key}`]: "This product already added",
                [`row_${index}_tax`]: "",
            }));
            return;
        }
        setForm((prev: any) => {
            const updatedBody = [
                ...(prev.openingStockBody ||
                    []),
            ];
            const currentRow = updatedBody[index] ||
                {};
            const currentField = getBodyFieldByKey(key);
            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (isInventoryBalanceField(currentField)) {
                const apiKey = getInventoryBalanceApiKey(currentField);
                const selectedInventoryOption = getOptionByValue(currentField, value);

                const selectedCode =
                    selectedInventoryOption?.value ??
                    selectedInventoryOption?.raw?.code ??
                    selectedInventoryOption?.raw?.masterCode ??
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

            if (key === "discount") updatedRow.discountPercentage = value;
            if (key === "discountPercentage") updatedRow.discount = value;
            if (key === "cgst") updatedRow.cgstPercentage = value;
            if (key === "cgstPercentage") updatedRow.cgst = value;
            if (key === "sgst") updatedRow.sgstPercentage = value;
            if (key === "sgstPercentage") updatedRow.sgst = value;
            if (key === "igst") updatedRow.igstPercentage = value;
            if (key === "igstPercentage") updatedRow.igst = value;
            if (currentField
                ?.mapFields) {
                updatedRow =
                    applyMappedFields(currentField, value, updatedRow);
            }
            const selectedOption = getOptionByValue(currentField, value);
            if (isCustomMasterField(currentField)) {
                const masterName = getCustomMasterName(currentField);
                const currentCustomMasters = updatedRow
                    ?.customMasters &&
                    typeof updatedRow.customMasters ===
                    "object"
                    ? {
                        ...updatedRow.customMasters,
                    }
                    : {};
                const selectedMaster = getCustomMasterSelection(currentField, value);
                if (selectedMaster) {
                    currentCustomMasters[masterName] =
                        selectedMaster;
                }
                else {
                    delete currentCustomMasters[masterName];
                }
                updatedRow.customMasters =
                    currentCustomMasters;
            }
            if (PRODUCT_FIELD_KEYS.has(key)) {
                const fallbackOption = productOptions.find((item: any) => {
                    const raw = item?.raw ||
                        {};
                    return (String(item?.value ||
                        "") ===
                        String(value ||
                            "") ||
                        String(item?.label ||
                            "") ===
                        String(value ||
                            "") ||
                        String(raw?._id ||
                            "") ===
                        String(value ||
                            "") ||
                        String(raw
                            ?.productCode ||
                            "") ===
                        String(value ||
                            "") ||
                        String(raw
                            ?.productName ||
                            "") ===
                        String(value ||
                            ""));
                });
                const product = selectedOption?.raw || fallbackOption?.raw || {};
                updatedRow.productType = product?.productType || "";
                updatedRow.availableQuantity = null;
                updatedRow.productCode =
                    product
                        ?.productCode ||
                    selectedOption
                        ?.value ||
                    fallbackOption
                        ?.value ||
                    updatedRow
                        .productCode ||
                    "";
                updatedRow.productName =
                    product
                        ?.productName ||
                    selectedOption
                        ?.label ||
                    fallbackOption
                        ?.label ||
                    updatedRow
                        .productName ||
                    "";
                updatedRow.productId =
                    product?._id ||
                    product
                        ?.productId ||
                    updatedRow
                        .productId ||
                    "";
                updatedRow.productDescription =
                    product
                        ?.productDescription ||
                    product
                        ?.description ||
                    updatedRow
                        .productDescription ||
                    "";
                updatedRow.description =
                    product
                        ?.productDescription ||
                    product
                        ?.description ||
                    updatedRow
                        .description ||
                    "";
                updatedRow.productHSNCode =
                    product
                        ?.productHSNCode ||
                    updatedRow
                        .productHSNCode ||
                    "";
                updatedRow.rate =
                    product
                        ?.sellingPrice ||
                    product
                        ?.saleRate ||
                    product
                        ?.rate ||
                    updatedRow
                        .rate ||
                    "";
                updatedRow.unit =
                    product
                        ?.unit ||
                    product?.uom ||
                    product
                        ?.unitCode ||
                    updatedRow
                        .unit ||
                    "";
                updatedRow.uom =
                    product?.uom ||
                    product?.unit ||
                    product
                        ?.unitCode ||
                    updatedRow
                        .uom ||
                    "";
                updatedRow.unitName =
                    product
                        ?.unitName ||
                    product?.unit ||
                    product?.uom ||
                    updatedRow
                        .unitName ||
                    "";
                updatedRow.cgstPercentage =
                    product
                        ?.cgstPercentage ||
                    product?.cgst ||
                    product?.csgst ||
                    product
                        ?.cgstRate ||
                    product?.tax
                        ?.cgstPercentage ||
                    product?.tax
                        ?.cgst ||
                    "";
                updatedRow.sgstPercentage =
                    product
                        ?.sgstPercentage ||
                    product?.sgst ||
                    product?.csgst ||
                    product
                        ?.sgstRate ||
                    product?.tax
                        ?.sgstPercentage ||
                    product?.tax
                        ?.sgst ||
                    "";
                updatedRow.igstPercentage =
                    product
                        ?.igstPercentage ||
                    product?.igst ||
                    product
                        ?.igstRate ||
                    product?.tax
                        ?.igstPercentage ||
                    product?.tax
                        ?.igst ||
                    "";
                if (num(updatedRow
                    .igstPercentage) > 0) {
                    updatedRow.cgstPercentage =
                        "";
                    updatedRow.sgstPercentage =
                        "";
                    updatedRow.cgstAmount =
                        0;
                    updatedRow.sgstAmount =
                        0;
                }
                if (num(updatedRow
                    .cgstPercentage) > 0 ||
                    num(updatedRow
                        .sgstPercentage) > 0) {
                    updatedRow.igstPercentage =
                        "";
                    updatedRow.igstAmount =
                        0;
                }
            }
            if (key === "unit" ||
                key === "uom") {
                const selectedUnit = getOptionByValue(currentField, value) ||
                    unitOptions.find((item: any) => String(item.value) ===
                        String(value));
                updatedRow.unit =
                    value;
                updatedRow.uom =
                    value;
                updatedRow.unitName =
                    selectedUnit
                        ?.label ||
                    "";
            }
            if (key ===
                "cgstPercentage" ||
                key ===
                "sgstPercentage" ||
                key === "cgst" ||
                key === "sgst") {
                if (num(value) >
                    0) {
                    updatedRow.igstPercentage =
                        "";
                    updatedRow.igst =
                        "";
                    updatedRow.igstAmount =
                        0;
                }
            }
            if (key ===
                "igstPercentage" ||
                key === "igst") {
                if (num(value) >
                    0) {
                    updatedRow.cgstPercentage =
                        "";
                    updatedRow.sgstPercentage =
                        "";
                    updatedRow.cgst =
                        "";
                    updatedRow.sgst =
                        "";
                    updatedRow.cgstAmount =
                        0;
                    updatedRow.sgstAmount =
                        0;
                }
            }
            updatedRow =
                calculateRow(normalizeRowKeys(updatedRow));
            updatedBody[index] =
                updatedRow;
            return {
                ...prev,
                openingStockBody: updatedBody,
            };
        });


        setErrors((prev: any) => ({
            ...prev,
            openingStockBody: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_tax`]: "",
        }));
    };
    const handleAddRow = () => {
        setForm((prev: any) => ({
            ...prev,
            openingStockBody: [
                ...(prev.openingStockBody ||
                    []),
                {
                    ...emptyProductRow,
                    id: Date.now(),
                    customMasters: {},
                },
            ],
        }));
    };
    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedBody = (prev.openingStockBody ||
                []).filter((_: any, rowIndex: number) => rowIndex !==
                    index);
            return {
                ...prev,
                openingStockBody: updatedBody
                    .length >
                    0
                    ? updatedBody
                    : [
                        {
                            ...emptyProductRow,
                            id: Date.now(),
                            customMasters: {},
                        },
                    ],
            };
        });
    };
    const getVisibleHeaderFields = () => {
        if (hasDynamicSchema) {
            return (templateFields
                ?.header ||
                []).filter((field: any) => !isTrueValue(field
                    ?.isHidden));
        }
        return (fallbackInputData
            .header ||
            []);
    };
    const getVisibleBodyFields = () => {
        if (hasDynamicSchema) {
            return (templateFields
                ?.body ||
                []).filter((field: any) => !isTrueValue(field
                    ?.isHidden));
        }
        return (fallbackInputData
            .body ||
            []);
    };
    const getFilledRows = () => {
        const bodyKeys = getVisibleBodyFields()
            .map((field: any) => field.key);
        return (form.openingStockBody ||
            []).filter((row: any) => bodyKeys.some((key: string) => {
                const value = row?.[key];
                return (value !==
                    undefined &&
                    value !==
                    null &&
                    value !==
                    "");
            }));
    };
    const validateMainForm = () => {
        const err: any = {};
        getVisibleHeaderFields()
            .forEach((field: any) => {
                if (!(isTrueValue(field
                    ?.isRequired) ||
                    isTrueValue(field
                        ?.required))) {
                    return;
                }
                const value = form?.[field.key];
                if (value ===
                    undefined ||
                    value ===
                    null ||
                    value === "") {
                    err[field.key] =
                        `${field
                            .label ||
                        field
                            .title ||
                        field.key} is required`;
                }
            });
        if (!hasDynamicSchema &&
            !form.openingStockDate) {
            err.openingStockDate =
                "Date is required";
        }
        const filledRows = getFilledRows();
        if (filledRows.length ===
            0) {
            err.openingStockBody =
                "Please add at least one product";
        }
        (form.openingStockBody ||
            []).forEach((row: any, index: number) => {
                const visibleBodyFields = getVisibleBodyFields();
                const hasAnyValue = visibleBodyFields.some((field: any) => {
                    const value = row?.[field
                        .key];
                    return (value !==
                        undefined &&
                        value !==
                        null &&
                        value !==
                        "");
                });
                if (!hasAnyValue) {
                    return;
                }
                visibleBodyFields.forEach((field: any) => {
                    if (!(isTrueValue(field
                        ?.isRequired) ||
                        isTrueValue(field
                            ?.required))) {
                        return;
                    }
                    const value = row?.[field
                        .key];
                    if (value ===
                        undefined ||
                        value ===
                        null ||
                        value ===
                        "") {
                        err[`row_${index}_${field.key}`] =
                            `${field
                                .label ||
                            field
                                .title ||
                            field
                                .key} is required`;
                    }
                });
                const cgst = num(row.cgstPercentage ||
                    row.cgst);
                const sgst = num(row.sgstPercentage ||
                    row.sgst);
                const igst = num(row.igstPercentage ||
                    row.igst);
                if (igst > 0 &&
                    (cgst > 0 ||
                        sgst > 0)) {
                    err[`row_${index}_tax`] =
                        "You can enter either IGST or CGST/SGST";
                    err[`row_${index}_igstPercentage`] =
                        "Only one tax type allowed";
                    err[`row_${index}_cgstPercentage`] =
                        "Only one tax type allowed";
                    err[`row_${index}_sgstPercentage`] =
                        "Only one tax type allowed";
                }
            });
        setErrors(err);
        if (err.openingStockBody) {
            toast.error(err.openingStockBody);
        }
        return (Object.keys(err)
            .length === 0);
    };
    const cleanRows = () => {
        const bodyKeys = getVisibleBodyFields()
            .map((field: any) => field.key);
        return (form.openingStockBody ||
            [])
            .filter((row: any) => bodyKeys.some((key: string) => {
                const value = row?.[key];
                return (value !==
                    undefined &&
                    value !==
                    null &&
                    value !==
                    "");
            }))
            .map((row: any) => calculateRow(normalizeRowKeys(row)));
    };
    const refreshList = async () => {
        await dispatch(getOpeningStockList({
            limit: localLimit,
            offset: localOffset,
            status,
            search: debouncedSearch,
        }) as any);
    };
    const buildOpeningStockBodyPayload = (rows: any[]) => {
        return rows.map((row: any) => {
            const customMasters = buildCustomMastersPayload(templateFields
                ?.body ||
                [], row, row?.customMasters ||
            {});
            const dynamicFields = buildDynamicSectionPayload(templateFields
                ?.body ||
                [], row, BODY_STANDARD_FIELD_KEYS);
            return {
                ...dynamicFields,
                productCode: row.productCode ||
                    "",
                productName: row.productName ||
                    "",
                productId: row.productId ||
                    "",
                productDescription: row.productDescription ||
                    row.description ||
                    "",
                description: row.description ||
                    row.productDescription ||
                    "",
                productHSNCode: row.productHSNCode ||
                    "",
                remarks: row.remarks ||
                    "",
                quantity: String(row.quantity ??
                    ""),
                unit: row.unit ||
                    row.uom ||
                    "",
                uom: row.uom ||
                    row.unit ||
                    "",
                unitName: row.unitName ||
                    "",
                rate: String(row.rate ??
                    ""),
                gross: row.grossAmount ??
                    row.gross ??
                    0,
                grossAmount: row.grossAmount ??
                    row.gross ??
                    0,
                discount: row.discountPercentage ??
                    row.discount ??
                    "",
                discountPercentage: row.discountPercentage ??
                    row.discount ??
                    "",
                discountAmount: row.discountAmount ??
                    0,
                taxableAmount: row.taxableAmount ??
                    0,
                cgst: row.cgstPercentage ??
                    row.cgst ??
                    "",
                cgstPercentage: row.cgstPercentage ??
                    row.cgst ??
                    "",
                cgstAmount: row.cgstAmount ??
                    0,
                sgst: row.sgstPercentage ??
                    row.sgst ??
                    "",
                sgstPercentage: row.sgstPercentage ??
                    row.sgst ??
                    "",
                sgstAmount: row.sgstAmount ??
                    0,
                igst: row.igstPercentage ??
                    row.igst ??
                    "",
                igstPercentage: row.igstPercentage ??
                    row.igst ??
                    "",
                igstAmount: row.igstAmount ??
                    0,
                taxAmount: row.taxAmount ??
                    0,
                otherAmount: row.otherAmount ??
                    0,
                netAmount: row.netTotal ??
                    row.netAmount ??
                    0,
                netTotal: row.netTotal ??
                    row.netAmount ??
                    0,
                ...(Object.keys(customMasters).length
                    ? {
                        customMasters,
                    }
                    : {}),
            };
        });
    };
    const handleSubmit = async () => {
        if (!validateMainForm()) {
            return;
        }
        const rows = cleanRows();
        const customMasters = buildCustomMastersPayload(templateFields
            ?.header ||
            [], form, form?.customMasters ||
        {});
        const dynamicHeaderFields = buildDynamicSectionPayload(templateFields
            ?.header ||
            [], form, HEADER_STANDARD_FIELD_KEYS);
        const payload: any = {
            ...dynamicHeaderFields,
            openingStockDate: form.openingStockDate,
            remark: form.remark ||
                "",
            openingStockStatus: form.openingStockStatus ||
                status ||
                "open",
            ...(Object.keys(customMasters).length
                ? {
                    customMasters,
                }
                : {}),
            openingStockBody: buildOpeningStockBodyPayload(rows),
            openingStockFooter: footerTotals,
        };
        console.log({
            payload,
        });
        try {
            if (edit) {
                const result: any = await dispatch(
                    updateOpeningStock({
                        payload,
                        openingStockVoucherNumber:
                            form?.openingStockVoucherNumber,
                    }) as any
                ).unwrap?.();

                const savedOpeningStockVoucherNumber =
                    resolveSavedOpeningStockVoucherNumber(
                        result,
                        form?.openingStockVoucherNumber
                    );

                if (!savedOpeningStockVoucherNumber) {
                    throw new Error(
                        "Opening Stock updated but voucher number was not found, so Inventory Balance update cannot be called"
                    );
                }

                await syncInventoryBalance(
                    savedOpeningStockVoucherNumber,
                    true
                );
            }
            else {
                const result: any = await dispatch(
                    addOpeningStock({
                        payload,
                    }) as any
                ).unwrap?.();

                const savedOpeningStockVoucherNumber =
                    resolveSavedOpeningStockVoucherNumber(
                        result,
                        form?.openingStockVoucherNumber
                    );

                if (!savedOpeningStockVoucherNumber) {
                    throw new Error(
                        "Opening Stock created but voucher number was not found, so Inventory Balance save cannot be called"
                    );
                }

                await syncInventoryBalance(
                    savedOpeningStockVoucherNumber,
                    false
                );
            }
            await refreshList();
            toast.success(`Opening stock ${edit
                ? "updated"
                : "added"} successfully`);
            setShowModal(false);
            resetMainForm();
        }
        catch (error: any) {
            toast.error(error?.message ||
                error?.payload?.message ||
                "Something went wrong");
        }
    };
    const handleDeleteOpeningStock = async (voucherNumber: any) => {
        try {
            await dispatch(deleteOpeningStock({
                openingStockVoucherNumber: voucherNumber,
            }) as any);
            await refreshList();
            toast.success("Opening stock deleted successfully");
        }
        catch (error: any) {
            toast.error(error?.message ||
                "Delete failed");
        }
        finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                openingStockVoucherNumber: null,
            });
        }
    };
    const hydrateHeaderCustomMasterValues = (record: any) => {
        const values: Record<string, any> = {};
        (templateFields
            ?.header ||
            []).forEach((field: any) => {
                if (!isCustomMasterField(field)) {
                    return;
                }
                const masterName = getCustomMasterName(field);
                const selectedMaster = record
                    ?.customMasters?.[masterName];
                if (selectedMaster
                    ?.code) {
                    values[field.key] =
                        selectedMaster
                            .code;
                }
            });
        return values;
    };
    const hydrateBodyRow = (item: any) => {
        const customMasterValues: Record<string, any> = {};
        (templateFields
            ?.body ||
            []).forEach((field: any) => {
                if (!isCustomMasterField(field)) {
                    return;
                }
                const masterName = getCustomMasterName(field);
                const selectedMaster = item
                    ?.customMasters?.[masterName];
                if (selectedMaster
                    ?.code) {
                    customMasterValues[field.key] =
                        selectedMaster
                            .code;
                }
            });
        return calculateRow(normalizeRowKeys({
            ...item,
            ...customMasterValues,
            id: item?.id ||
                Date.now() +
                Math.random(),
            customMasters: item
                ?.customMasters &&
                typeof item.customMasters ===
                "object"
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
            productCode: item
                ?.productCode ||
                "",
            productName: item
                ?.productName ||
                "",
            productId: item
                ?.productId ||
                "",
            productDescription: item
                ?.productDescription ||
                item
                    ?.description ||
                "",
            description: item
                ?.description ||
                item
                    ?.productDescription ||
                "",
            productHSNCode: item
                ?.productHSNCode ||
                "",
            remarks: item
                ?.remarks ||
                "",
            quantity: item
                ?.quantity ||
                "",
            unit: item?.unit ||
                item?.uom ||
                "",
            uom: item?.uom ||
                item?.unit ||
                "",
            unitName: item
                ?.unitName ||
                "",
            rate: item?.rate ||
                "",
            discountPercentage: item
                ?.discountPercentage ||
                item
                    ?.discount ||
                "",
            cgstPercentage: item
                ?.cgstPercentage ||
                item?.cgst ||
                "",
            sgstPercentage: item
                ?.sgstPercentage ||
                item?.sgst ||
                "",
            igstPercentage: item
                ?.igstPercentage ||
                item?.igst ||
                "",
            otherAmount: item
                ?.otherAmount ||
                "",
        }));
    };


    // const openEditModal = (row: any) => {
    //     const body = row?.openingStockBody
    //         ?.length >
    //         0
    //         ? row.openingStockBody.map((item: any) => hydrateBodyRow(item))
    //         : [
    //             {
    //                 ...emptyProductRow,
    //                 id: Date.now(),
    //                 customMasters: {},
    //             },
    //         ];
    //     const headerCustomMasterValues = hydrateHeaderCustomMasterValues(row);
    //     setForm({
    //         ...row,
    //         ...headerCustomMasterValues,
    //         openingStockVoucherNumber: row
    //             ?.openingStockVoucherNumber ||
    //             "OPSTOCK",
    //         openingStockDate: row
    //             ?.openingStockDate
    //             ? String(row.openingStockDate).split("T")[0]
    //             : todayYMD(),
    //         remark: row?.remark ||
    //             "",
    //         openingStockStatus: row
    //             ?.openingStockStatus ||
    //             "open",
    //         customMasters: row
    //             ?.customMasters &&
    //             typeof row.customMasters ===
    //             "object"
    //             ? {
    //                 ...row.customMasters,
    //             }
    //             : {},
    //         openingStockBody: body,
    //     });
    //     setEdit(true);
    //     setErrors({});
    //     setShowModal(true);
    // };


    const openEditModal = async (row: any) => {
        const openingStockDate = row?.openingStockDate
            ? String(row.openingStockDate).split("T")[0]
            : todayYMD();

        const body = row?.openingStockBody?.length > 0
            ? row.openingStockBody.map((item: any) => {
                const hydratedRow = hydrateBodyRow(item);

                const product = productOptions.find(
                    (option: any) =>
                        String(option?.value || "") ===
                        String(item?.productCode || "")
                )?.raw || {};

                return {
                    ...hydratedRow,
                    productType:
                        item?.productType ||
                        product?.productType ||
                        "",
                    availableQuantity: null,
                };
            })
            : [
                {
                    ...emptyProductRow,
                    id: Date.now(),
                    customMasters: {},
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
                        voucherNumber:
                            row?.openingStockVoucherNumber || "",
                    },
                }
            );

            inventoryRecords =
                getInventoryBalanceRecords(
                    inventoryResponse
                );
        } catch (error) {
            console.log(
                "Failed to load Opening Stock inventory balance records",
                error
            );
        }

        const bodyWithInventoryIds =
            attachInventoryBalanceVoucherIds(
                body,
                inventoryRecords
            );

        const headerCustomMasterValues =
            hydrateHeaderCustomMasterValues(row);

        setForm({
            ...row,
            ...headerCustomMasterValues,
            openingStockVoucherNumber:
                row?.openingStockVoucherNumber ||
                "OPSTOCK",
            openingStockDate,
            remark:
                row?.remark ||
                "",
            openingStockStatus:
                row?.openingStockStatus ||
                "open",
            customMasters:
                row?.customMasters &&
                    typeof row.customMasters === "object"
                    ? {
                        ...row.customMasters,
                    }
                    : {},
            openingStockBody: bodyWithInventoryIds,
        });

        setEdit(true);
        setErrors({});
        setShowModal(true);
    };


    const productBalanceSignature = useMemo(
        () =>
            (form?.openingStockBody || [])
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
        [form?.openingStockBody]
    );

    useEffect(() => {
        if (!showModal || !productBalanceSignature) return;

        let cancelled = false;

        const fetchAvailableQuantities = async () => {
            const openingDate = form?.openingStockDate || todayYMD();
            const selectedDate = new Date(`${openingDate}T23:59:59.999`);
            const financialYear =
                selectedDate.getMonth() >= 3
                    ? selectedDate.getFullYear()
                    : selectedDate.getFullYear() - 1;

            const fromDate = new Date(
                financialYear,
                3,
                1,
                0,
                0,
                0,
                0
            ).toISOString();

            const toDate = selectedDate.toISOString();

            const balanceRows = await Promise.all(
                (form?.openingStockBody || []).map(async (item: any) => {
                    const productCode = String(item?.productCode || "").trim();

                    if (!productCode) {
                        return {
                            productCode,
                            productType: String(item?.productType || "").trim().toLowerCase(),
                            availableQuantity: null,
                        };
                    }

                    const product =
                        productOptions.find((option: any) => {
                            const raw = option?.raw || {};

                            return (
                                String(option?.value || "") === String(productCode) ||
                                String(raw?.productCode || "") === String(productCode)
                            );
                        })?.raw || {};

                    const productType = String(
                        item?.productType ||
                        product?.productType ||
                        product?.dynamicFields?.productType ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                    if (["serviceproduct", "nonstocks"].includes(productType)) {
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
                                    : 0,
                        };
                    } catch (error) {
                        console.log(
                            `Failed to fetch available quantity for ${productCode}`,
                            error
                        );

                        return {
                            productCode,
                            productType,
                            availableQuantity: 0,
                        };
                    }
                })
            );

            if (cancelled) return;

            setForm((prev: any) => {
                const updatedBody = (prev?.openingStockBody || []).map(
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
                    openingStockBody: updatedBody,
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
        form?.openingStockDate,
        productOptions,
        dispatch,
    ]);

    useEffect(() => {
        refreshList();
    }, [
        localLimit,
        localOffset,
        status,
        debouncedSearch,
    ]);
    useEffect(() => {
        dispatch(getAllProducts({
            limit: 200,
            offset: 0,
        }) as any);
    }, [dispatch]);
    useEffect(() => {
        dispatch(getAllTransactionSchema("openingStock") as any);
    }, [dispatch]);
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);
    useEffect(() => {
        const prepareFields = async () => {
            if (!transactionsSchema) {
                return;
            }
            const hasSchema = Array.isArray(transactionsSchema
                ?.header) ||
                Array.isArray(transactionsSchema
                    ?.body) ||
                Array.isArray(transactionsSchema
                    ?.footer);
            if (!hasSchema) {
                return;
            }
            try {
                setFieldsLoading(true);
                const updatedData = await loadAllTemplateOptions(transactionsSchema);
                setTemplateFields(updatedData);
            }
            catch (error) {
                console.log("Failed to prepare Opening Stock transaction fields", error);
            }
            finally {
                setFieldsLoading(false);
            }
        };
        prepareFields();
    }, [transactionsSchema]);
    return (<>
        <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <div id="account-summary" className="flex items-start gap-3">
                    <Badge {...{
                        count: pagination
                            ?.totalDocs ??
                            0,
                        text: "Total Opening Stocks:",
                    }} />
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Toggle arr={[
                        "open",
                        "close",
                    ]} state={status} setState={setStatus} />

                    <div className="me-2">
                        <SearchInput search={search} setSearch={setSearch} />
                    </div>

                    <Permission module="bookez" permissionKey="openingStock" action="create">
                        <div className="w-full sm:w-auto">
                            <DataCreateButton text="Create Opening Stocks" icon={<Plus size={16} />} callBackFn={() => {
                                resetMainForm();
                                setShowModal(true);
                            }} />
                        </div>
                    </Permission>
                </div>
            </div>

            <DataTable columns={mainColumns} data={openingStock ||
                []} loading={listingLoader} emptyMessage="No opening stocks found" actions={(row: any) => (<div className="flex items-center gap-2">
                    <Permission module="bookez" permissionKey="openingStock" action="update">
                        <button type="button" onClick={() => openEditModal(row)} className="cursor-pointer rounded-lg p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary">
                            <Edit size={16} />
                        </button>
                    </Permission>

                    <Permission module="bookez" permissionKey="openingStock" action="delete">
                        <button type="button" disabled={deleteLoader} onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            let x = rect.left -
                                150;
                            if (x <
                                10) {
                                x =
                                    10;
                            }
                            const y = rect.top +
                                window.scrollY -
                                5;
                            setConfirmTooltip({
                                show: true,
                                x,
                                y,
                                openingStockVoucherNumber: row?.openingStockVoucherNumber,
                            });
                        }} className="cursor-pointer rounded-lg p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-60">
                            <Trash2 size={16} />
                        </button>
                    </Permission>
                </div>)} />

            {pagination?.totalDocs >
                0 && (<Pagination {...{
                    localLimit,
                    selectCb: (e: any) => {
                        setLocalLimit(Number(e
                            .target
                            .value));
                        setLocalOffset(0);
                    },
                    preDisabled: !pagination
                        ?.hasPrevPage,
                    nextDisabled: !pagination
                        ?.hasNextPage,
                    setLocalOffset,
                    pagination,
                }} />)}
        </div>

        {confirmTooltip.show && (<ConfirmTooltip x={confirmTooltip.x} y={confirmTooltip.y} message="Are you sure you want to delete this opening stock?" confirmText="Delete" cancelText="Cancel" onConfirm={() => handleDeleteOpeningStock(confirmTooltip
            ?.openingStockVoucherNumber)} onCancel={() => setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                openingStockVoucherNumber: null,
            })} />)}

        {!fieldsLoading && (<DynamicAddForm show={showModal} setShow={setShowModal} edit={edit} title="Opening Stock" subtitle="Fill in the opening stock details below" loading={addLoader ||
            updateLoader} onClose={() => {

                setShowModal(false);
                resetMainForm();
            }} onSubmit={handleSubmit} form={form} errors={errors} handleAddRow={handleAddRow} handleDeleteRow={handleDeleteRow} handleRowChange={handleRowChange} inputData={dynamicInputData} bodyKey="openingStockBody" handleChange={handleChange} footerTotals={footerTotals} bodyCellExtraRenderer={renderOpeningStockCellExtra} />)}
    </>);
};
export default OpeningStock;