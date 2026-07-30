import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import Modal from "../../../components/modal";
import { Checkbox } from "../../../components/inputs";

import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";


import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";

import {
    clearRegisterFilterDropdowns,
    getRegisterFilterDropdowns,
} from "../../../redux/slices/professionalSlice/registerModule";

import professionalAxios from "../../../services/professionalAxios";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";
import { getPurchaseReturnRegister } from "../../../redux/slices/professionalSlice/register";

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
const REGISTER_MODULE = "purchaseReturn";

/* ===================================================
   COMMON HELPERS
=================================================== */

const formatDate = (value: any): string => {
    if (!value) return "-";

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
                item?.code ||
                ""
            ).trim(),

            value: String(
                item?.code ||
                item?.value ||
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
   PURCHASE RETURN FIELD HELPERS
=================================================== */

const getVoucherNumber = (row: any): string => {
    return String(
        row?.pRetVoucherNumber ||
        row?.pReturnVoucherNumber ||
        row?.purchaseReturnVoucherNumber ||
        row?.voucherNumber ||
        row?.voucher ||
        ""
    ).trim();
};

const getVoucherDate = (row: any): any => {
    return (
        row?.pRetVoucherDate ||
        row?.pReturnVoucherDate ||
        row?.purchaseReturnVoucherDate ||
        row?.voucherDate ||
        row?.date ||
        ""
    );
};

const getVendorName = (row: any): string => {
    return (
        row?.pRetVendorName ||
        row?.pRetSupplierName ||
        row?.pReturnVendorName ||
        row?.pReturnSupplierName ||
        row?.purchaseReturnVendorName ||
        row?.purchaseReturnSupplierName ||
        row?.vendorName ||
        row?.supplierName ||
        row?.accountName ||
        row?.vendor ||
        row?.supplier ||
        "-"
    );
};

const getVendorCode = (row: any): string => {
    return (
        row?.pRetVendorCode ||
        row?.pRetSupplierCode ||
        row?.pReturnVendorCode ||
        row?.pReturnSupplierCode ||
        row?.purchaseReturnVendorCode ||
        row?.purchaseReturnSupplierCode ||
        row?.vendorCode ||
        row?.supplierCode ||
        row?.accountCode ||
        "-"
    );
};

const getPurchaseInvoiceNumber = (row: any): string => {
    return (
        row?.grnVoucherNumber ||
        row?.purchaseInvoiceVoucherNumber ||
        row?.referenceVoucherNumber ||
        row?.invoiceNumber ||
        row?.pRetBody?.[0]?.pInvVoucherNumber ||
        row?.pReturnBody?.[0]?.pInvVoucherNumber ||
        row?.purchaseReturnBody?.[0]?.pInvVoucherNumber ||
        row?.products?.[0]?.pInvVoucherNumber ||
        "-"
    );
};

const getBodyRows = (row: any): any[] => {
    if (Array.isArray(row?.pRetBody)) {
        return row.pRetBody;
    }

    if (Array.isArray(row?.pReturnBody)) {
        return row.pReturnBody;
    }

    if (Array.isArray(row?.purchaseReturnBody)) {
        return row.purchaseReturnBody;
    }

    if (Array.isArray(row?.products)) {
        return row.products;
    }

    if (Array.isArray(row?.items)) {
        return row.items;
    }

    return [];
};

const getFooter = (row: any): any => {
    return (
        row?.pRetFooter ||
        row?.pReturnFooter ||
        row?.purchaseReturnFooter ||
        row?.footer ||
        {}
    );
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

const getTotalQuantity = (row: any): number => {
    const footer = getFooter(row);

    if (footer?.totalQuantity !== undefined) {
        return toNumber(footer.totalQuantity);
    }

    if (row?.quantity !== undefined) {
        return toNumber(row.quantity);
    }

    return getBodyRows(row).reduce(
        (total: number, item: any) =>
            total +
            toNumber(
                item?.returnQuantity ||
                item?.returnedQuantity ||
                item?.quantity
            ),
        0
    );
};

const getNetAmount = (row: any): number => {
    const footer = getFooter(row);

    return toNumber(
        footer?.netAmount ??
        footer?.totalNetAmount ??
        row?.netAmount ??
        row?.returnAmount ??
        row?.purchaseReturnAmount ??
        0
    );
};

const getReturnStatus = (row: any): string => {
    return String(
        row?.pRetStatus ||
        row?.pReturnStatus ||
        row?.purchaseReturnStatus ||
        row?.status ||
        "-"
    );
};

const getDocumentStatus = (row: any): string => {
    return String(
        row?.pRetDocStatus ||
        row?.pReturnDocStatus ||
        row?.purchaseReturnDocStatus ||
        row?.documentStatus ||
        row?.docStatus ||
        "-"
    );
};

const getReturnStatusClass = (value: any): string => {
    const status = normalizeStatus(value);

    if (
        status === "approved" ||
        status === "completed" ||
        status === "accepted"
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
        status === "pending" ||
        status === "draft"
    ) {
        return "bg-warning/10 text-warning";
    }

    return "bg-muted text-muted-foreground";
};

// const getDocumentStatusClass = (value: any): string => {
//     const status = normalizeStatus(value);

//     if (status === "open") {
//         return "bg-success/10 text-success";
//     }

//     if (
//         status === "close" ||
//         status === "closed"
//     ) {
//         return "bg-muted text-muted-foreground";
//     }

//     return "bg-primary/10 text-primary";
// };

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "purchaseReturnVoucherNumber",
        title: "Voucher Number",

        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getVoucherNumber(row) || "-"}
            </span>
        ),
    },
    {
        key: "purchaseReturnVoucherDate",
        title: "Voucher Date",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {formatDate(getVoucherDate(row))}
            </span>
        ),
    },
    {
        key: "vendorName",
        title: "Vendor",

        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {getVendorName(row)}
                </span>

                <span className="text-xs text-muted-foreground">
                    {getVendorCode(row)}
                </span>
            </div>
        ),
    },
    {
        key: "grnVoucherNumber",
        title: "Purchase Invoice",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getPurchaseInvoiceNumber(row)}
            </span>
        ),
    },
    {
        key: "productName",
        title: "Product",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getProductSummary(row)}
            </span>
        ),
    },
    {
        key: "totalQuantity",
        title: "Quantity",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getTotalQuantity(row)}
            </span>
        ),
    },
    {
        key: "netAmount",
        title: "Net Amount",

        render: (row: any) => (
            <span className="whitespace-nowrap font-bold text-foreground">
                ₹{formatAmount(getNetAmount(row))}
            </span>
        ),
    },
    {
        key: "pRetStatus",
        title: "Return Status",

        render: (row: any) => {
            const status = getReturnStatus(row);

            return (
                <span
                    className={`
                        inline-flex rounded-full px-3 py-1
                        text-xs font-bold uppercase
                        ${getReturnStatusClass(status)}
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

const normalizePurchaseReturnForView = (
    record: any
) => {
    const footer = getFooter(record);

    const products = getBodyRows(record).map(
        (item: any) => ({
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

            remarks:
                item?.remarks || "",

            quantity:
                item?.quantity || "",

            returnedQuantity:
                item?.returnedQuantity ||
                item?.returnQuantity ||
                item?.quantity ||
                "",

            returnQuantity:
                item?.returnQuantity ||
                item?.returnedQuantity ||
                item?.quantity ||
                "",

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
                item?.rate || "",

            gross:
                item?.gross ||
                item?.grossAmount ||
                "",

            grossAmount:
                item?.grossAmount ||
                item?.gross ||
                "",

            discount:
                item?.discount ??
                item?.discountPercentage ??
                "",

            discountPercentage:
                item?.discountPercentage ??
                item?.discount ??
                "",

            discountAmount:
                item?.discountAmount ||
                "0.00",

            taxableAmount:
                item?.taxableAmount ||
                "0.00",

            cgst:
                item?.cgst ??
                item?.cgstPercentage ??
                "",

            cgstPercentage:
                item?.cgstPercentage ??
                item?.cgst ??
                "",

            cgstAmount:
                item?.cgstAmount ||
                "0.00",

            sgst:
                item?.sgst ??
                item?.sgstPercentage ??
                "",

            sgstPercentage:
                item?.sgstPercentage ??
                item?.sgst ??
                "",

            sgstAmount:
                item?.sgstAmount ||
                "0.00",

            igst:
                item?.igst ??
                item?.igstPercentage ??
                "",

            igstPercentage:
                item?.igstPercentage ??
                item?.igst ??
                "",

            igstAmount:
                item?.igstAmount ||
                "0.00",

            taxAmount:
                item?.taxAmount ||
                "0.00",

            otherAmount:
                item?.otherAmount ||
                "0.00",

            netAmount:
                item?.netAmount ||
                item?.netTotal ||
                "",

            netTotal:
                item?.netTotal ||
                item?.netAmount ||
                "",

            pInvVoucherNumber:
                item?.pInvVoucherNumber ||
                item?.purchaseInvoiceVoucherNumber ||
                "",
        })
    );

    const totalQuantity =
        footer?.totalQuantity ||
        products.reduce(
            (total: number, product: any) =>
                total +
                toNumber(
                    product?.returnQuantity ||
                    product?.returnedQuantity ||
                    product?.quantity
                ),
            0
        );

    return {
        ...record,

        pRetVoucherNumber:
            getVoucherNumber(record),

        pRetVoucherDate:
            getVoucherDate(record),

        pRetVendorCode:
            getVendorCode(record) === "-"
                ? ""
                : getVendorCode(record),

        pRetVendorName:
            getVendorName(record) === "-"
                ? ""
                : getVendorName(record),

        pRetSupplierCode:
            getVendorCode(record) === "-"
                ? ""
                : getVendorCode(record),

        pRetSupplierName:
            getVendorName(record) === "-"
                ? ""
                : getVendorName(record),

        pRetStatus:
            getReturnStatus(record) === "-"
                ? ""
                : getReturnStatus(record),

        pRetDocStatus:
            getDocumentStatus(record) === "-"
                ? ""
                : getDocumentStatus(record),

        pInvVoucherNumber:
            getPurchaseInvoiceNumber(record) === "-"
                ? ""
                : getPurchaseInvoiceNumber(record),

        products,
        pRetBody: products,
        pReturnBody: products,
        purchaseReturnBody: products,

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
            record?.netAmount ||
            record?.returnAmount ||
            record?.purchaseReturnAmount ||
            "0.00",

        adjustedAmount:
            footer?.adjustedAmount ||
            "0.00",

        balanceAmount:
            footer?.balanceAmount ||
            footer?.netAmount ||
            footer?.totalNetAmount ||
            record?.netAmount ||
            record?.returnAmount ||
            record?.purchaseReturnAmount ||
            "0.00",

        totalQuantity,
    };
};

/* ===================================================
   COMPONENT
=================================================== */

const PurchaseReturnRegister = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [vendor, setVendor] =
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

    const { accounts = [] } = useSelector(
        (state: any) =>
            state.accountMaster || {}
    );

    const { products = [] } = useSelector(
        (state: any) =>
            state.productMaster || {}
    );

    const {
        purchaseReturnRegisterData = [],
        purchaseReturnLoading = false,
        purchaseReturnPagination = {},
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

    const customFilters = useMemo<
        CustomFilterDefinition[]
    >(() => {
        return Array.isArray(registerFilterDropdowns)
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
            vendor ||
            product ||
            selectedCustomCodes.length
        );
    }, [
        fromDate,
        toDate,
        vendor,
        product,
        selectedCustomCodesKey,
    ]);

    /* ===================================================
       OPTIONS
    =================================================== */

    const vendorOptions = useMemo(() => {
        return (accounts || [])
            .map((item: any) => ({
                label:
                    item?.accountName ||
                    item?.vendorName ||
                    item?.supplierName ||
                    "",

                value:
                    item?.accountCode ||
                    item?.vendorCode ||
                    item?.supplierCode ||
                    "",
            }))
            .filter(
                (item: DropdownOption) =>
                    Boolean(
                        item.label &&
                        item.value
                    )
            );
    }, [accounts]);

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
        return Array.isArray(
            purchaseReturnRegisterData
        )
            ? purchaseReturnRegisterData
            : [];
    }, [purchaseReturnRegisterData]);

    const currentPagination = useMemo(() => {
        return purchaseReturnPagination || {};
    }, [purchaseReturnPagination]);

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
            accountCode: vendor,
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
       LOAD ACCOUNT MASTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                search: "",
            })
        );
    }, [dispatch]);

    /* ===================================================
       LOAD PRODUCT MASTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllProducts({
                offset: 0,
                limit: 200,
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
                                    filter?.api ||
                                    ""
                                );

                            if (
                                !filter?.key ||
                                !apiPath
                            ) {
                                return [
                                    filter?.key ||
                                    "",
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
                                    "Purchase return custom filter options failed:",
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

            if (!isMounted) return;

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

    /* ===================================================
       LOAD PURCHASE RETURN REGISTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getPurchaseReturnRegister(
                getPayload()
            )
        );
    }, [
        dispatch,
        fromDate,
        toDate,
        vendor,
        product,
        selectedCustomCodesKey,
        localOffset,
        localLimit,
        refreshKey,
    ]);

    /* ===================================================
       PREPARE VIEW SCHEMA
    =================================================== */

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
                        "Failed to prepare purchase return view fields",
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
            grossAmount:
                viewForm?.grossAmount ||
                "0.00",

            discountAmount:
                viewForm?.discountAmount ||
                "0.00",

            cgstAmount:
                viewForm?.cgstAmount ||
                "0.00",

            sgstAmount:
                viewForm?.sgstAmount ||
                "0.00",

            igstAmount:
                viewForm?.igstAmount ||
                "0.00",

            taxAmount:
                viewForm?.taxAmount ||
                "0.00",

            otherAmount:
                viewForm?.otherAmount ||
                "0.00",

            netAmount:
                viewForm?.netAmount ||
                "0.00",

            adjustedAmount:
                viewForm?.adjustedAmount ||
                "0.00",

            balanceAmount:
                viewForm?.balanceAmount ||
                "0.00",

            totalQuantity:
                viewForm?.totalQuantity ||
                "0",
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
        setVendor("");
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
                "Purchase return voucher number missing:",
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
                normalizePurchaseReturnForView(
                    row
                )
            );
        } catch (error) {
            console.log(
                "Purchase return view failed:",
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
                "Purchase return export columns failed:",
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
                            !keys.includes(
                                key
                            )
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
                        getPurchaseReturnRegister(
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
                            ? "purchase-return-register.pdf"
                            : "purchase-return-register.xlsx"
                    );
                }
            } catch (error) {
                console.log(
                    `Purchase return register ${currentExportType.toUpperCase()} download failed:`,
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
                title="Purchase Return Register Filters"
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
                        key: "vendor",
                        type: "select",
                        label: "Vendor",
                        placeholder:
                            "Select Vendor",
                        value: vendor,
                        options: vendorOptions,

                        onChange: (
                            value: string
                        ) => {
                            setVendor(value);
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
                            type: "select" as const,

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
                    purchaseReturnLoading ||
                    registerFilterDropdownLoading
                }
                emptyMessage="No purchase return register data found"
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
                title="View Purchase Return"
                subtitle="View purchase return details"
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

export default PurchaseReturnRegister;