import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import Modal from "../../../components/modal";
import { Checkbox } from "../../../components/inputs";

import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";


import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";

import {
    clearRegisterFilterDropdowns,
    getRegisterFilterDropdowns,
} from "../../../redux/slices/professionalSlice/registerModule";

import professionalAxios from "../../../services/professionalAxios";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";
import { getOpeningStockRegister } from "../../../redux/slices/professionalSlice/register";

/* ===================================================
   TYPES
=================================================== */

type DropdownOption = {
    label: string;
    value: string;
};

type CustomFilterDefinition = {
    key: string;
    label?: string;
    type?: string;
    api?: string;
    customMasterCode?: string;
};

type ExportType = "pdf" | "excel";

/* ===================================================
   CONSTANTS
=================================================== */

const BOOKEZ_API_PREFIX = "/eTaxSolnMongoApiBackend";
const REGISTER_MODULE = "openingStock";

/* ===================================================
   COMMON HELPERS
=================================================== */

const formatDate = (value: any): string => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN");
};

const toNumber = (value: any): number => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const parsedValue = Number(
        String(value)
            .replace(/,/g, "")
            .replace(/[₹\s]/g, "")
            .trim()
    );

    return Number.isFinite(parsedValue)
        ? parsedValue
        : 0;
};

const formatAmount = (value: any): string => {
    return toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatQuantity = (value: any): string => {
    return toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    });
};

const normalizeStatus = (value: any): string => {
    return String(value || "")
        .trim()
        .toLowerCase();
};

const resolveProfessionalApiPath = (
    apiPath: string
): string => {
    const normalizedPath = String(apiPath || "").trim();

    if (!normalizedPath) {
        return "";
    }

    if (normalizedPath.startsWith(BOOKEZ_API_PREFIX)) {
        return normalizedPath;
    }

    return `${BOOKEZ_API_PREFIX}${normalizedPath.startsWith("/")
        ? normalizedPath
        : `/${normalizedPath}`
        }`;
};

const dedupeColumns = (columns: any[] = []) => {
    const seen = new Set<string>();

    return columns.filter((column: any) => {
        const key = String(column?.key || "").trim();

        if (!key || seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
};

const mapCustomMasterOptions = (
    items: any[]
): DropdownOption[] => {
    return (items || [])
        .map((item: any) => ({
            label: String(
                item?.name ||
                item?.label ||
                item?.productName ||
                item?.warehouseName ||
                item?.godownName ||
                item?.code ||
                ""
            ).trim(),

            value: String(
                item?.code ||
                item?.value ||
                item?.productCode ||
                item?.warehouseCode ||
                item?.godownCode ||
                item?._id ||
                ""
            ).trim(),
        }))
        .filter(
            (item: DropdownOption) =>
                Boolean(item.label && item.value)
        );
};

/* ===================================================
   OPENING STOCK FIELD HELPERS
=================================================== */

const getVoucherNumber = (row: any): string => {
    return String(
        row?.opStockVoucherNumber ||
        row?.openingStockVoucherNumber ||
        row?.oStockVoucherNumber ||
        row?.voucherNumber ||
        row?.voucher ||
        ""
    ).trim();
};

const getVoucherDate = (row: any): any => {
    return (
        row?.opStockVoucherDate ||
        row?.openingStockVoucherDate ||
        row?.oStockVoucherDate ||
        row?.voucherDate ||
        row?.openingDate ||
        row?.date ||
        ""
    );
};

const getBodyRows = (row: any): any[] => {
    if (Array.isArray(row?.opStockBody)) {
        return row.opStockBody;
    }

    if (Array.isArray(row?.openingStockBody)) {
        return row.openingStockBody;
    }

    if (Array.isArray(row?.oStockBody)) {
        return row.oStockBody;
    }

    if (Array.isArray(row?.products)) {
        return row.products;
    }

    if (Array.isArray(row?.items)) {
        return row.items;
    }

    if (
        row?.productCode ||
        row?.productName
    ) {
        return [row];
    }

    return [];
};

const getFooter = (row: any): any => {
    return (
        row?.opStockFooter ||
        row?.openingStockFooter ||
        row?.oStockFooter ||
        row?.footer ||
        {}
    );
};

const getProductCode = (row: any): string => {
    return String(
        row?.opStockProductCode ||
        row?.openingStockProductCode ||
        row?.oStockProductCode ||
        row?.productCode ||
        getBodyRows(row)?.[0]?.productCode ||
        ""
    ).trim();
};

const getProductName = (row: any): string => {
    return String(
        row?.opStockProductName ||
        row?.openingStockProductName ||
        row?.oStockProductName ||
        row?.productName ||
        row?.product ||
        getBodyRows(row)?.[0]?.productName ||
        "-"
    ).trim();
};

const getProductSummary = (row: any): string => {
    if (row?.productName || row?.product) {
        return row?.productName || row?.product;
    }

    const body = getBodyRows(row);

    if (!body.length) {
        return "-";
    }

    const firstProduct =
        body[0]?.productName ||
        body[0]?.productCode ||
        "-";

    if (body.length === 1) {
        return firstProduct;
    }

    return `${firstProduct} +${body.length - 1} more`;
};

const getWarehouseCode = (row: any): string => {
    return String(
        row?.opStockWarehouseCode ||
        row?.openingStockWarehouseCode ||
        row?.oStockWarehouseCode ||
        row?.warehouseCode ||
        row?.godownCode ||
        row?.locationCode ||
        getBodyRows(row)?.[0]?.warehouseCode ||
        getBodyRows(row)?.[0]?.godownCode ||
        ""
    ).trim();
};

const getWarehouseName = (row: any): string => {
    return String(
        row?.opStockWarehouseName ||
        row?.openingStockWarehouseName ||
        row?.oStockWarehouseName ||
        row?.warehouseName ||
        row?.godownName ||
        row?.locationName ||
        getBodyRows(row)?.[0]?.warehouseName ||
        getBodyRows(row)?.[0]?.godownName ||
        "-"
    ).trim();
};

const getUnit = (row: any): string => {
    return String(
        row?.unitName ||
        row?.unit ||
        row?.uom ||
        getBodyRows(row)?.[0]?.unitName ||
        getBodyRows(row)?.[0]?.unit ||
        getBodyRows(row)?.[0]?.uom ||
        "-"
    ).trim();
};

const getQuantity = (row: any): number => {
    const footer = getFooter(row);

    if (footer?.totalQuantity !== undefined) {
        return toNumber(footer.totalQuantity);
    }

    if (
        row?.openingQuantity !== undefined
    ) {
        return toNumber(row.openingQuantity);
    }

    if (
        row?.stockQuantity !== undefined
    ) {
        return toNumber(row.stockQuantity);
    }

    if (row?.quantity !== undefined) {
        return toNumber(row.quantity);
    }

    return getBodyRows(row).reduce(
        (total: number, item: any) =>
            total +
            toNumber(
                item?.openingQuantity ??
                item?.stockQuantity ??
                item?.quantity ??
                0
            ),
        0
    );
};

const getRate = (row: any): number => {
    return toNumber(
        row?.openingRate ??
        row?.stockRate ??
        row?.rate ??
        row?.valuationRate ??
        getBodyRows(row)?.[0]?.openingRate ??
        getBodyRows(row)?.[0]?.stockRate ??
        getBodyRows(row)?.[0]?.rate ??
        getBodyRows(row)?.[0]?.valuationRate ??
        0
    );
};

const getStockValue = (row: any): number => {
    const footer = getFooter(row);

    const directValue =
        footer?.netAmount ??
        footer?.totalNetAmount ??
        footer?.stockValue ??
        footer?.totalStockValue ??
        row?.stockValue ??
        row?.openingStockValue ??
        row?.openingValue ??
        row?.netAmount ??
        row?.amount;

    if (
        directValue !== undefined &&
        directValue !== null &&
        directValue !== ""
    ) {
        return toNumber(directValue);
    }

    const body = getBodyRows(row);

    if (body.length) {
        return body.reduce(
            (total: number, item: any) => {
                const itemValue =
                    item?.stockValue ??
                    item?.openingStockValue ??
                    item?.openingValue ??
                    item?.netAmount ??
                    item?.amount;

                if (
                    itemValue !== undefined &&
                    itemValue !== null &&
                    itemValue !== ""
                ) {
                    return total + toNumber(itemValue);
                }

                const quantity = toNumber(
                    item?.openingQuantity ??
                    item?.stockQuantity ??
                    item?.quantity ??
                    0
                );

                const rate = toNumber(
                    item?.openingRate ??
                    item?.stockRate ??
                    item?.rate ??
                    item?.valuationRate ??
                    0
                );

                return total + quantity * rate;
            },
            0
        );
    }

    return getQuantity(row) * getRate(row);
};

// const getBatchNumber = (row: any): string => {
//     return String(
//         row?.batchNumber ||
//         row?.batchNo ||
//         getBodyRows(row)?.[0]?.batchNumber ||
//         getBodyRows(row)?.[0]?.batchNo ||
//         "-"
//     ).trim();
// };

const getStatus = (row: any): string => {
    return String(
        row?.opStockStatus ||
        row?.openingStockStatus ||
        row?.oStockStatus ||
        row?.status ||
        "-"
    );
};

const getDocumentStatus = (row: any): string => {
    return String(
        row?.opStockDocStatus ||
        row?.openingStockDocStatus ||
        row?.oStockDocStatus ||
        row?.documentStatus ||
        row?.docStatus ||
        "-"
    );
};

const getRemark = (row: any): string => {
    return String(
        row?.opStockRemark ||
        row?.openingStockRemark ||
        row?.oStockRemark ||
        row?.remark ||
        row?.remarks ||
        "-"
    );
};

const getStatusClass = (value: any): string => {
    const status = normalizeStatus(value);

    if (
        status === "approved" ||
        status === "active" ||
        status === "completed"
    ) {
        return "bg-success/10 text-success";
    }

    if (
        status === "rejected" ||
        status === "cancelled" ||
        status === "canceled"
    ) {
        return "bg-destructive/10 text-destructive";
    }

    if (
        status === "draft" ||
        status === "pending"
    ) {
        return "bg-warning/10 text-warning";
    }

    return "bg-muted text-muted-foreground";
};

const getDocumentStatusClass = (
    value: any
): string => {
    const status = normalizeStatus(value);

    if (status === "open") {
        return "bg-success/10 text-success";
    }

    if (
        status === "close" ||
        status === "closed"
    ) {
        return "bg-muted text-muted-foreground";
    }

    return "bg-primary/10 text-primary";
};

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "openingStockVoucherNumber",
        title: "Voucher Number",

        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getVoucherNumber(row) || "-"}
            </span>
        ),
    },
    {
        key: "openingStockVoucherDate",
        title: "Voucher Date",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {formatDate(getVoucherDate(row))}
            </span>
        ),
    },
    {
        key: "productName",
        title: "Product",

        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {getProductSummary(row)}
                </span>

                <span className="text-xs text-muted-foreground">
                    {getProductCode(row) || "-"}
                </span>
            </div>
        ),
    },
    {
        key: "warehouseName",
        title: "Warehouse",

        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-medium text-card-foreground">
                    {getWarehouseName(row)}
                </span>

                <span className="text-xs text-muted-foreground">
                    {getWarehouseCode(row) || "-"}
                </span>
            </div>
        ),
    },
    {
        key: "quantity",
        title: "Quantity",

        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {formatQuantity(getQuantity(row))}
                </span>

                <span className="text-xs text-muted-foreground">
                    {getUnit(row)}
                </span>
            </div>
        ),
    },
    {
        key: "rate",
        title: "Rate",

        render: (row: any) => (
            <span className="whitespace-nowrap font-semibold text-card-foreground">
                ₹{formatAmount(getRate(row))}
            </span>
        ),
    },
    {
        key: "stockValue",
        title: "Stock Value",

        render: (row: any) => (
            <span className="whitespace-nowrap font-bold text-foreground">
                ₹{formatAmount(getStockValue(row))}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",

        render: (row: any) => {
            const status = getStatus(row);

            return (
                <span
                    className={`
                        inline-flex rounded-full px-3 py-1
                        text-xs font-bold uppercase
                        ${getStatusClass(status)}
                    `}
                >
                    {status}
                </span>
            );
        },
    },
    {
        key: "documentStatus",
        title: "Document Status",

        render: (row: any) => {
            const status = getDocumentStatus(row);

            return (
                <span
                    className={`
                        inline-flex rounded-full px-3 py-1
                        text-xs font-bold uppercase
                        ${getDocumentStatusClass(status)}
                    `}
                >
                    {status}
                </span>
            );
        },
    },
];

/* ===================================================
   VIEW NORMALIZATION
=================================================== */

const normalizeOpeningStockForView = (
    record: any
) => {
    const products = getBodyRows(record).map(
        (item: any) => {
            const quantity = toNumber(
                item?.openingQuantity ??
                item?.stockQuantity ??
                item?.quantity ??
                0
            );

            const rate = toNumber(
                item?.openingRate ??
                item?.stockRate ??
                item?.rate ??
                item?.valuationRate ??
                0
            );

            const stockValue = toNumber(
                item?.stockValue ??
                item?.openingStockValue ??
                item?.openingValue ??
                item?.netAmount ??
                item?.amount ??
                quantity * rate
            );

            return {
                ...item,

                productCode:
                    item?.productCode || "",

                productName:
                    item?.productName || "",

                productId:
                    item?.productId || "",

                productDescription:
                    item?.productDescription ||
                    item?.description ||
                    "",

                description:
                    item?.description ||
                    item?.productDescription ||
                    "",

                productHSNCode:
                    item?.productHSNCode || "",

                warehouseCode:
                    item?.warehouseCode ||
                    item?.godownCode ||
                    item?.locationCode ||
                    "",

                warehouseName:
                    item?.warehouseName ||
                    item?.godownName ||
                    item?.locationName ||
                    "",

                godownCode:
                    item?.godownCode ||
                    item?.warehouseCode ||
                    item?.locationCode ||
                    "",

                godownName:
                    item?.godownName ||
                    item?.warehouseName ||
                    item?.locationName ||
                    "",

                batchNumber:
                    item?.batchNumber ||
                    item?.batchNo ||
                    "",

                batchNo:
                    item?.batchNo ||
                    item?.batchNumber ||
                    "",

                manufacturingDate:
                    item?.manufacturingDate ||
                    item?.mfgDate ||
                    "",

                expiryDate:
                    item?.expiryDate ||
                    item?.expDate ||
                    "",

                quantity:
                    String(quantity),

                openingQuantity:
                    String(quantity),

                stockQuantity:
                    String(quantity),

                unit:
                    item?.unit ||
                    item?.uom ||
                    "",

                uom:
                    item?.uom ||
                    item?.unit ||
                    "",

                unitName:
                    item?.unitName || "",

                rate:
                    rate.toFixed(2),

                openingRate:
                    rate.toFixed(2),

                stockRate:
                    rate.toFixed(2),

                valuationRate:
                    rate.toFixed(2),

                gross:
                    stockValue.toFixed(2),

                grossAmount:
                    stockValue.toFixed(2),

                taxableAmount:
                    stockValue.toFixed(2),

                stockValue:
                    stockValue.toFixed(2),

                openingStockValue:
                    stockValue.toFixed(2),

                openingValue:
                    stockValue.toFixed(2),

                netAmount:
                    stockValue.toFixed(2),

                netTotal:
                    stockValue.toFixed(2),

                remarks:
                    item?.remarks ||
                    item?.remark ||
                    "",

                remark:
                    item?.remark ||
                    item?.remarks ||
                    "",
            };
        }
    );

    const totalQuantity = products.reduce(
        (total: number, item: any) =>
            total + toNumber(item?.quantity),
        0
    );

    const totalStockValue = products.reduce(
        (total: number, item: any) =>
            total + toNumber(item?.stockValue),
        0
    );

    return {
        ...record,

        opStockVoucherNumber:
            getVoucherNumber(record),

        openingStockVoucherNumber:
            getVoucherNumber(record),

        opStockVoucherDate:
            getVoucherDate(record),

        openingStockVoucherDate:
            getVoucherDate(record),

        opStockProductCode:
            getProductCode(record),

        openingStockProductCode:
            getProductCode(record),

        opStockProductName:
            getProductName(record) === "-"
                ? ""
                : getProductName(record),

        openingStockProductName:
            getProductName(record) === "-"
                ? ""
                : getProductName(record),

        opStockWarehouseCode:
            getWarehouseCode(record),

        openingStockWarehouseCode:
            getWarehouseCode(record),

        opStockWarehouseName:
            getWarehouseName(record) === "-"
                ? ""
                : getWarehouseName(record),

        openingStockWarehouseName:
            getWarehouseName(record) === "-"
                ? ""
                : getWarehouseName(record),

        opStockQuantity:
            String(getQuantity(record)),

        openingStockQuantity:
            String(getQuantity(record)),

        opStockRate:
            getRate(record).toFixed(2),

        openingStockRate:
            getRate(record).toFixed(2),

        opStockValue:
            getStockValue(record).toFixed(2),

        openingStockValue:
            getStockValue(record).toFixed(2),

        opStockStatus:
            getStatus(record) === "-"
                ? ""
                : getStatus(record),

        openingStockStatus:
            getStatus(record) === "-"
                ? ""
                : getStatus(record),

        opStockDocStatus:
            getDocumentStatus(record) === "-"
                ? ""
                : getDocumentStatus(record),

        openingStockDocStatus:
            getDocumentStatus(record) === "-"
                ? ""
                : getDocumentStatus(record),

        opStockRemark:
            getRemark(record) === "-"
                ? ""
                : getRemark(record),

        openingStockRemark:
            getRemark(record) === "-"
                ? ""
                : getRemark(record),

        products,

        opStockBody: products,
        openingStockBody: products,
        oStockBody: products,

        totalQuantity:
            String(totalQuantity),

        totalStockValue:
            totalStockValue.toFixed(2),

        grossAmount:
            totalStockValue.toFixed(2),

        taxableAmount:
            totalStockValue.toFixed(2),

        netAmount:
            totalStockValue.toFixed(2),

        balanceAmount:
            totalStockValue.toFixed(2),
    };
};

/* ===================================================
   COMPONENT
=================================================== */

const OpeningStockRegister = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [product, setProduct] =
        useState("");

    const [
        selectedCustomFilters,
        setSelectedCustomFilters,
    ] = useState<Record<string, string>>({});

    const [
        customFilterOptions,
        setCustomFilterOptions,
    ] = useState<
        Record<string, DropdownOption[]>
    >({});

    /* ===================================================
       PAGINATION STATES
    =================================================== */

    const [localOffset, setLocalOffset] =
        useState(0);

    const [localLimit, setLocalLimit] =
        useState(20);

    const [refreshKey, setRefreshKey] =
        useState(0);

    /* ===================================================
       EXPORT STATES
    =================================================== */

    const [pdfLoading, setPdfLoading] =
        useState(false);

    const [excelLoading, setExcelLoading] =
        useState(false);

    const [
        exportModalVisible,
        setExportModalVisible,
    ] = useState(false);

    const [exportType, setExportType] =
        useState<ExportType | null>(null);

    const [
        exportColumnsLoading,
        setExportColumnsLoading,
    ] = useState(false);

    const [systemColumns, setSystemColumns] =
        useState<any[]>([]);

    const [customColumns, setCustomColumns] =
        useState<any[]>([]);

    const [
        selectedExportColumns,
        setSelectedExportColumns,
    ] = useState<string[]>([]);

    /* ===================================================
       VIEW STATES
    =================================================== */

    const [viewModal, setViewModal] =
        useState(false);

    const [viewLoading, setViewLoading] =
        useState(false);

    const [viewForm, setViewForm] =
        useState<any>({});

    const [viewErrors, setViewErrors] =
        useState<any>({});

    const [
        viewTemplateFields,
        setViewTemplateFields,
    ] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    /* ===================================================
       REDUX SELECTORS
    =================================================== */

    const { products = [] } = useSelector(
        (state: any) =>
            state.productMaster || {}
    );

    const {
        openingStockData = [],
        openingStockLoading = false,
        openingStockPagination = {},
    } = useSelector(
        (state: any) =>
            state.allRegisters || {}
    );

    const {
        filters: registerFilterDropdowns = [],
        loading:
        registerFilterDropdownLoading = false,
    } = useSelector(
        (state: any) =>
            state.registerFilterDropdown || {}
    );

    const { transactionsSchema } = useSelector(
        (state: any) =>
            state.getAllTransactionSchema || {}
    );

    /* ===================================================
       CUSTOM FILTERS
    =================================================== */

    const customFilters:any = useMemo<
        CustomFilterDefinition[]
    >(() => {
        return Array.isArray(
            registerFilterDropdowns
        )
            ? registerFilterDropdowns
            : [];
    }, [registerFilterDropdowns]);

    const selectedCustomCodes = useMemo(() => {
        return customFilters
            .map(
                (filter: CustomFilterDefinition) =>
                    selectedCustomFilters[
                    filter.key
                    ] || ""
            )
            .filter(Boolean);
    }, [
        customFilters,
        selectedCustomFilters,
    ]);

    const selectedCustomCodesKey = useMemo(
        () => selectedCustomCodes.join("|"),
        [selectedCustomCodes]
    );

    /* ===================================================
       FILTER CHECK
    =================================================== */

    const hasAnyFilter = useMemo(() => {
        return Boolean(
            fromDate ||
            toDate ||
            product ||
            selectedCustomCodes.length
        );
    }, [
        fromDate,
        toDate,
        product,
        selectedCustomCodesKey,
    ]);

    /* ===================================================
       PRODUCT OPTIONS
    =================================================== */

    const productOptions = useMemo(() => {
        return (products || [])
            .map((item: any) => ({
                label:
                    item?.productName || "",

                value:
                    item?.productCode || "",
            }))
            .filter(
                (item: DropdownOption) =>
                    Boolean(
                        item.label &&
                        item.value
                    )
            );
    }, [products]);

    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData = useMemo(() => {
        return Array.isArray(openingStockData)
            ? openingStockData
            : [];
    }, [openingStockData]);

    const currentPagination = useMemo(() => {
        return openingStockPagination || {};
    }, [openingStockPagination]);

    /* ===================================================
       API PAYLOAD
    =================================================== */

    const getPayload = (
        requestedExportType:
            | "pdf"
            | "excel"
            | "" = "",
        selectedColumns: string[] = []
    ) => {
        const isExport = Boolean(
            requestedExportType
        );

        return {
            productCode: product,

            fromDate,
            toDate,

            customCodes:
                selectedCustomCodes.length
                    ? selectedCustomCodes
                    : [""],

            offset: isExport
                ? 0
                : localOffset,

            limit: isExport
                ? 120000
                : localLimit,

            ...(isExport
                ? {
                    exportType:
                        requestedExportType,

                    selectedColumns,
                }
                : {
                    exportType:
                        "" as const,
                }),
        };
    };

    /* ===================================================
       LOAD PRODUCT MASTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllProducts({
                offset: 0,
                limit: 500,
                search: "",
            })
        );
    }, [dispatch]);

    /* ===================================================
       LOAD REGISTER FILTERS
    =================================================== */

    useEffect(() => {
        dispatch(
            getRegisterFilterDropdowns(
                REGISTER_MODULE
            )
        );

        return () => {
            dispatch(
                clearRegisterFilterDropdowns()
            );
        };
    }, [dispatch]);

    /* ===================================================
       LOAD CUSTOM FILTER OPTIONS
    =================================================== */

    useEffect(() => {
        let isMounted = true;

        const loadOptions = async () => {
            if (!customFilters.length) {
                setCustomFilterOptions({});
                setSelectedCustomFilters({});

                return;
            }

            const optionEntries =
                await Promise.all(
                    customFilters.map(
                        async (
                            filter: CustomFilterDefinition
                        ) => {
                            const apiPath =
                                resolveProfessionalApiPath(
                                    filter?.api || ""
                                );

                            if (
                                !filter?.key ||
                                !apiPath
                            ) {
                                return [
                                    filter?.key || "",
                                    [],
                                ] as const;
                            }

                            try {
                                const response =
                                    await professionalAxios.get(
                                        apiPath
                                    );

                                const items =
                                    response?.data
                                        ?.data?.items ||
                                    response?.data
                                        ?.items ||
                                    response?.data
                                        ?.data?.data
                                        ?.items ||
                                    response?.data
                                        ?.records ||
                                    [];

                                return [
                                    filter.key,

                                    mapCustomMasterOptions(
                                        Array.isArray(
                                            items
                                        )
                                            ? items
                                            : []
                                    ),
                                ] as const;
                            } catch (error) {
                                console.log(
                                    "Opening stock custom filter options failed:",
                                    filter.key,
                                    error
                                );

                                return [
                                    filter.key,
                                    [],
                                ] as const;
                            }
                        }
                    )
                );

            if (!isMounted) {
                return;
            }

            setCustomFilterOptions(
                Object.fromEntries(
                    optionEntries.filter(
                        ([key]) =>
                            Boolean(key)
                    )
                )
            );

            setSelectedCustomFilters(
                (previous) => {
                    const nextSelected: Record<
                        string,
                        string
                    > = {};

                    customFilters.forEach(
                        (
                            filter: CustomFilterDefinition
                        ) => {
                            if (
                                filter.key &&
                                previous[
                                filter.key
                                ]
                            ) {
                                nextSelected[
                                    filter.key
                                ] =
                                    previous[
                                    filter.key
                                    ];
                            }
                        }
                    );

                    return nextSelected;
                }
            );
        };

        loadOptions();

        return () => {
            isMounted = false;
        };
    }, [customFilters]);

    useEffect(() => {
        dispatch(
            getOpeningStockRegister(
                getPayload()
            )
        );
    }, [dispatch, fromDate, toDate, product, selectedCustomCodesKey, localOffset, localLimit, refreshKey]);

    useEffect(() => {
        const prepareViewFields =
            async () => {
                if (!transactionsSchema) {
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
                    const updatedData =
                        await loadAllTemplateOptions(
                            transactionsSchema
                        );

                    setViewTemplateFields(
                        updatedData
                    );
                } catch (error) {
                    console.log(
                        "Failed to prepare opening stock view fields",
                        error
                    );
                }
            };

        prepareViewFields();
    }, [transactionsSchema]);

    /* ===================================================
       VIEW FOOTER
    =================================================== */

    const viewFooterTotals = useMemo(() => {
        return {
            totalQuantity:
                viewForm?.totalQuantity ||
                "0",

            totalStockValue:
                viewForm?.totalStockValue ||
                "0.00",

            grossAmount:
                viewForm?.grossAmount ||
                "0.00",

            taxableAmount:
                viewForm?.taxableAmount ||
                "0.00",

            netAmount:
                viewForm?.netAmount ||
                "0.00",

            balanceAmount:
                viewForm?.balanceAmount ||
                "0.00",
        };
    }, [viewForm]);

    const viewFooterArray = useMemo(() => {
        return (
            viewTemplateFields?.footer || []
        )
            .filter(
                (field: any) =>
                    !field?.isHidden
            )
            .map((field: any) => {
                const rawValue =
                    viewFooterTotals[
                    field.key as keyof typeof viewFooterTotals
                    ] ?? "0.00";

                return {
                    ...field,
                    value: rawValue,
                    rawValue,
                };
            });
    }, [
        viewTemplateFields?.footer,
        viewFooterTotals,
    ]);

    const viewInputData = useMemo(() => {
        return {
            ...viewTemplateFields,
            footer: viewFooterArray,
        };
    }, [
        viewTemplateFields,
        viewFooterArray,
    ]);

    /* ===================================================
       FILTER HANDLERS
    =================================================== */

    const handleRefresh = () => {
        setLocalOffset(0);

        setRefreshKey(
            (previous) => previous + 1
        );
    };

    const handleClear = () => {
        setFromDate("");
        setToDate("");
        setProduct("");
        setSelectedCustomFilters({});
        setLocalOffset(0);

        setRefreshKey(
            (previous) => previous + 1
        );
    };

    /* ===================================================
       VIEW HANDLER
    =================================================== */

    const handleViewVoucher = async (
        row: any
    ) => {
        const voucherNumber =
            getVoucherNumber(row);

        if (!voucherNumber) {
            console.log(
                "Opening stock voucher number missing:",
                row
            );

            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});

            await dispatch(
                getAllTransactionSchema(
                    REGISTER_MODULE
                ) as any
            );

            setViewForm(
                normalizeOpeningStockForView(
                    row
                )
            );
        } catch (error) {
            console.log(
                "Opening stock view failed:",
                error
            );

            setViewForm({});
        } finally {
            setViewLoading(false);
        }
    };

    /* ===================================================
       DOWNLOAD HELPER
    =================================================== */

    const downloadBlobFile = (
        blob: Blob,
        fileName: string
    ) => {
        const url =
            window.URL.createObjectURL(
                blob
            );

        const link =
            document.createElement("a");

        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    };

    /* ===================================================
       EXPORT HANDLERS
    =================================================== */

    const closeExportModal = () => {
        setExportModalVisible(false);
        setExportType(null);
        setSystemColumns([]);
        setCustomColumns([]);
        setSelectedExportColumns([]);
    };

    const openExportPicker = async (
        requestedType: ExportType
    ) => {
        if (
            !hasAnyFilter ||
            exportColumnsLoading ||
            pdfLoading ||
            excelLoading
        ) {
            return;
        }

        try {
            setExportType(requestedType);
            setExportColumnsLoading(true);

            const response =
                await professionalAxios.get(
                    "/eTaxSolnMongoApiBackend/users/bookez/registers/exportColumns",
                    {
                        params: {
                            module:
                                REGISTER_MODULE,
                        },
                    }
                );

            const data =
                response?.data?.data ??
                response?.data ??
                {};

            const system = dedupeColumns(
                data?.systemColumns || []
            );

            const custom = dedupeColumns(
                (
                    data?.customColumns || []
                ).filter(
                    (column: any) =>
                        !system.some(
                            (
                                systemColumn: any
                            ) =>
                                systemColumn?.key ===
                                column?.key
                        )
                )
            );

            setSystemColumns(system);
            setCustomColumns(custom);

            setSelectedExportColumns(
                system.map(
                    (column: any) =>
                        column.key
                )
            );

            setExportModalVisible(true);
        } catch (error) {
            console.log(
                "Opening stock export columns failed:",
                error
            );

            setExportType(null);
        } finally {
            setExportColumnsLoading(false);
        }
    };

    const toggleExportColumn = (
        key: string
    ) => {
        setSelectedExportColumns(
            (previous) =>
                previous.includes(key)
                    ? previous.filter(
                        (item) =>
                            item !== key
                    )
                    : [
                        ...previous,
                        key,
                    ]
        );
    };

    const setSectionSelection = (
        columns: any[],
        selected: boolean
    ) => {
        const keys = columns.map(
            (column: any) =>
                column.key
        );

        setSelectedExportColumns(
            (previous) => {
                const withoutSection =
                    previous.filter(
                        (key) =>
                            !keys.includes(key)
                    );

                return selected
                    ? [
                        ...withoutSection,
                        ...keys,
                    ]
                    : withoutSection;
            }
        );
    };

    const performExportDownload =
        async () => {
            if (
                !exportType ||
                !selectedExportColumns.length
            ) {
                return;
            }

            const currentExportType =
                exportType;

            const columns = [
                ...selectedExportColumns,
            ];

            closeExportModal();

            try {
                if (
                    currentExportType ===
                    "pdf"
                ) {
                    setPdfLoading(true);
                } else {
                    setExcelLoading(true);
                }

                const response =
                    await dispatch(
                        getOpeningStockRegister(
                            getPayload(
                                currentExportType,
                                columns
                            )
                        )
                    ).unwrap();

                if (response?.blob) {
                    downloadBlobFile(
                        response.blob,

                        currentExportType ===
                            "pdf"
                            ? "opening-stock-register.pdf"
                            : "opening-stock-register.xlsx"
                    );
                }
            } catch (error) {
                console.log(
                    `Opening stock register ${currentExportType.toUpperCase()} download failed:`,
                    error
                );
            } finally {
                setPdfLoading(false);
                setExcelLoading(false);
            }
        };

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Opening Stock Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate,
                        required: false,

                        onChange: (
                            value: string
                        ) => {
                            setFromDate(value);
                            setLocalOffset(0);
                        },
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate,
                        required: false,

                        onChange: (
                            value: string
                        ) => {
                            setToDate(value);
                            setLocalOffset(0);
                        },
                    },
                    {
                        key: "product",
                        type: "select",
                        label: "Product",
                        placeholder:
                            "Select Product",
                        value: product,
                        options:
                            productOptions,

                        onChange: (
                            value: string
                        ) => {
                            setProduct(value);
                            setLocalOffset(0);
                        },
                    },

                    ...customFilters.map(
                        (
                            filter: CustomFilterDefinition
                        ) => ({
                            key: filter.key,
                            type: "select" as const ,

                            label:
                                filter.label ||
                                filter.key,

                            placeholder:
                                filter.label ||
                                filter.key,

                            value:
                                selectedCustomFilters[
                                filter.key
                                ] || "",

                            options:
                                customFilterOptions[
                                filter.key
                                ] || [],

                            onChange: (
                                value: string
                            ) => {
                                setSelectedCustomFilters(
                                    (
                                        previous
                                    ) => ({
                                        ...previous,

                                        [filter.key]:
                                            value,
                                    })
                                );

                                setLocalOffset(0);
                            },
                        })
                    ),
                ]}
                gridCols="4"
                onSearch={handleRefresh}
                onClear={handleClear}
                onDownloadPdf={() =>
                    openExportPicker("pdf")
                }
                onDownloadExcel={() =>
                    openExportPicker("excel")
                }
                pdfDisabled={
                    !hasAnyFilter ||
                    pdfLoading ||
                    exportColumnsLoading
                }
                excelDisabled={
                    !hasAnyFilter ||
                    excelLoading ||
                    exportColumnsLoading
                }
                pdfLoading={
                    pdfLoading ||
                    (exportColumnsLoading &&
                        exportType === "pdf")
                }
                excelLoading={
                    excelLoading ||
                    (exportColumnsLoading &&
                        exportType ===
                        "excel")
                }
                downloadDisabledMessage={
                    !hasAnyFilter
                        ? "Please select any filter first."
                        : "Please wait, export is processing."
                }
            />

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={
                    openingStockLoading ||
                    registerFilterDropdownLoading
                }
                emptyMessage="No opening stock register data found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();

                            handleViewVoucher(
                                row
                            );
                        }}
                        className="
                            inline-flex cursor-pointer
                            items-center gap-1
                            rounded-lg bg-primary/10
                            px-3 py-1.5 text-xs
                            font-bold text-primary
                            transition
                            hover:bg-primary/20
                        "
                    >
                        <Eye size={15} />
                    </button>
                )}
            />

            <Modal
                show={exportModalVisible}
                setShow={
                    setExportModalVisible
                }
                handleClose={
                    closeExportModal
                }
                title={
                    exportType === "pdf"
                        ? "Select PDF Columns"
                        : "Select Excel Columns"
                }
                maxWidth="xl"
                gridCols={1}
                hideFooter={true}
                bodyClassName="!block !p-0"
                body={
                    <div className="flex min-h-0 flex-col">
                        <div className="max-h-[60vh] flex-1 overflow-y-auto p-6">
                            <p className="mb-5 text-sm text-muted-foreground">
                                Select the columns you want to include in the exported file.
                            </p>

                            {systemColumns.length >
                                0 && (
                                    <div className="mb-6">
                                        <div className="mb-2 flex items-center justify-between">
                                            <h3 className="font-bold text-primary">
                                                System Columns
                                            </h3>

                                            <div className="flex gap-3 text-xs font-bold text-primary">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSectionSelection(
                                                            systemColumns,
                                                            true
                                                        )
                                                    }
                                                    className="cursor-pointer hover:underline"
                                                >
                                                    Select All
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSectionSelection(
                                                            systemColumns,
                                                            false
                                                        )
                                                    }
                                                    className="cursor-pointer hover:underline"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>

                                        {systemColumns.map(
                                            (
                                                column: any
                                            ) => (
                                                <Checkbox
                                                    key={
                                                        column.key
                                                    }
                                                    checked={selectedExportColumns.includes(
                                                        column.key
                                                    )}
                                                    value={
                                                        column.key
                                                    }
                                                    label={
                                                        column.label ||
                                                        column.header ||
                                                        column.key
                                                    }
                                                    onChange={() =>
                                                        toggleExportColumn(
                                                            column.key
                                                        )
                                                    }
                                                    className="border-b border-border py-3 hover:bg-muted/40"
                                                />
                                            )
                                        )}
                                    </div>
                                )}

                            {customColumns.length >
                                0 && (
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <h3 className="font-bold text-primary">
                                                Custom Columns
                                            </h3>

                                            <div className="flex gap-3 text-xs font-bold text-primary">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSectionSelection(
                                                            customColumns,
                                                            true
                                                        )
                                                    }
                                                    className="cursor-pointer hover:underline"
                                                >
                                                    Select All
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSectionSelection(
                                                            customColumns,
                                                            false
                                                        )
                                                    }
                                                    className="cursor-pointer hover:underline"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>

                                        {customColumns.map(
                                            (
                                                column: any
                                            ) => (
                                                <Checkbox
                                                    key={
                                                        column.key
                                                    }
                                                    checked={selectedExportColumns.includes(
                                                        column.key
                                                    )}
                                                    value={
                                                        column.key
                                                    }
                                                    label={
                                                        column.label ||
                                                        column.header ||
                                                        column.key
                                                    }
                                                    onChange={() =>
                                                        toggleExportColumn(
                                                            column.key
                                                        )
                                                    }
                                                    className="border-b border-border py-3 hover:bg-muted/40"
                                                />
                                            )
                                        )}
                                    </div>
                                )}

                            {!systemColumns.length &&
                                !customColumns.length && (
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        No export columns found.
                                    </div>
                                )}
                        </div>

                        <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-secondary px-6 py-4">
                            <button
                                type="button"
                                onClick={
                                    closeExportModal
                                }
                                disabled={
                                    pdfLoading ||
                                    excelLoading
                                }
                                className="
                                    cursor-pointer rounded-md
                                    border border-border bg-card
                                    px-4 py-2 text-sm
                                    font-medium text-card-foreground
                                    transition hover:bg-muted
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    performExportDownload
                                }
                                disabled={
                                    !selectedExportColumns.length ||
                                    pdfLoading ||
                                    excelLoading
                                }
                                className="
                                    cursor-pointer rounded-md
                                    bg-primary px-4 py-2
                                    text-sm font-medium
                                    text-primary-foreground
                                    transition hover:opacity-90
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                {pdfLoading ||
                                    excelLoading
                                    ? "Downloading..."
                                    : exportType ===
                                        "pdf"
                                        ? "Download PDF"
                                        : "Download Excel"}
                            </button>
                        </div>
                    </div>
                }
            />

            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={true}
                title="View Opening Stock"
                subtitle="View opening stock details"
                loading={viewLoading}
                contentLoading={viewLoading}
                onClose={() => {
                    setViewModal(false);
                    setViewForm({});
                    setViewErrors({});
                }}
                onSubmit={() => { }}
                form={viewForm}
                errors={viewErrors}
                handleAddRow={() => { }}
                handleDeleteRow={() => { }}
                handleRowChange={() => { }}
                inputData={viewInputData}
                bodyKey="products"
                handleChange={() => { }}
                footerTotals={
                    viewFooterTotals
                }
            />

            {currentPagination?.totalDocs >
                0 && (
                    <div className="mt-2">
                        <Pagination
                            localLimit={
                                localLimit
                            }
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
                                !currentPagination?.hasPrevPage
                            }
                            nextDisabled={
                                !currentPagination?.hasNextPage
                            }
                            setLocalOffset={
                                setLocalOffset
                            }
                            pagination={
                                currentPagination
                            }
                        />
                    </div>
                )}
        </div>
    );
};

export default OpeningStockRegister;