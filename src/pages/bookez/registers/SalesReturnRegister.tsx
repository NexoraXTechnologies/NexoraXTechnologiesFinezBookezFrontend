import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import ExportColumnsModal from "./components/ExportColumnsModal";

import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";


import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";

import {
    clearRegisterFilterDropdowns,
    getRegisterFilterDropdowns,
} from "../../../redux/slices/professionalSlice/registerModule";

import professionalAxios from "../../../services/professionalAxios";
import {
    loadAllTemplateOptions,
    toLocalEndOfDayUtc,
    toLocalStartOfDayUtc,
} from "../../../utils/helperFunctions";
import { getSalesReturnRegister } from "../../../redux/slices/professionalSlice/register";
import { toast } from "react-toastify";

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

/*
    Change only this constant if your transaction
    schema/filter module name is different.
*/
const REGISTER_MODULE = "salesReturn";

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
   SALES RETURN FIELD HELPERS
=================================================== */

const getVoucherNumber = (row: any): string => {
    return String(
        row?.sInvReturnVoucherNumber ||
        row?.sRetVoucherNumber ||
        row?.sReturnVoucherNumber ||
        row?.salesReturnVoucherNumber ||
        row?.voucherNumber ||
        row?.voucher ||
        ""
    ).trim();
};

const getVoucherDate = (row: any): any => {
    return (
        row?.sInvReturnVoucherDate ||
        row?.sRetVoucherDate ||
        row?.sReturnVoucherDate ||
        row?.salesReturnVoucherDate ||
        row?.voucherDate ||
        row?.date ||
        ""
    );
};

const getCustomerName = (row: any): string => {
    return (
        row?.sInvReturnCustomerName ||
        row?.sRetCustomerName ||
        row?.sReturnCustomerName ||
        row?.salesReturnCustomerName ||
        row?.customerName ||
        row?.customer ||
        "-"
    );
};

const getCustomerCode = (row: any): string => {
    return (
        row?.sInvReturnCustomerCode ||
        row?.sInvCustomerCode ||
        row?.sRetCustomerCode ||
        row?.sReturnCustomerCode ||
        row?.salesReturnCustomerCode ||
        row?.customerCode ||
        "-"
    );
};

const getSalesInvoiceNumber = (row: any): string => {
    return (
        row?.sInvVoucherNumber ||
        row?.salesInvoiceVoucherNumber ||
        row?.referenceVoucherNumber ||
        row?.invoiceNumber ||
        row?.sRetBody?.[0]?.sInvVoucherNumber ||
        row?.sReturnBody?.[0]?.sInvVoucherNumber ||
        row?.salesReturnBody?.[0]?.sInvVoucherNumber ||
        "-"
    );
};

const getBodyRows = (row: any): any[] => {
    if (Array.isArray(row?.sInvReturnBody)) {
        return row.sInvReturnBody;
    }

    if (Array.isArray(row?.sRetBody)) {
        return row.sRetBody;
    }

    if (Array.isArray(row?.sReturnBody)) {
        return row.sReturnBody;
    }

    if (Array.isArray(row?.salesReturnBody)) {
        return row.salesReturnBody;
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
        row?.sInvReturnFooter ||
        row?.sRetFooter ||
        row?.sReturnFooter ||
        row?.salesReturnFooter ||
        row?.footer ||
        {}
    );
};

// const getProductSummary = (row: any): string => {
//     if (row?.productName || row?.product) {
//         return row?.productName || row?.product;
//     }

//     const body = getBodyRows(row);

//     if (!body.length) {
//         return "-";
//     }

//     const firstProduct =
//         body[0]?.productName ||
//         body[0]?.productCode ||
//         "-";

//     if (body.length === 1) {
//         return firstProduct;
//     }

//     return `${firstProduct} +${body.length - 1} more`;
// };

// const getTotalQuantity = (row: any): number => {
//     const footer = getFooter(row);

//     if (footer?.totalQuantity !== undefined) {
//         return toNumber(footer.totalQuantity);
//     }

//     if (row?.quantity !== undefined) {
//         return toNumber(row.quantity);
//     }

//     return getBodyRows(row).reduce(
//         (total: number, item: any) =>
//             total + toNumber(item?.quantity),
//         0
//     );
// };

const getNetAmount = (row: any): number => {
    const footer = getFooter(row);

    return toNumber(
        footer?.netAmount ??
        footer?.totalNetAmount ??
        row?.netAmount ??
        row?.returnAmount ??
        row?.salesReturnAmount ??
        0
    );
};

const getReturnStatus = (row: any): string => {
    return String(
        row?.sInvReturnStatus ||
        row?.sInvStatus ||
        row?.sRetStatus ||
        row?.sReturnStatus ||
        row?.salesReturnStatus ||
        row?.status ||
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



/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "salesReturnVoucherNumber",
        title: "Voucher Number",

        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getVoucherNumber(row) || "-"}
            </span>
        ),
    },
    {
        key: "salesReturnVoucherDate",
        title: "Voucher Date",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {formatDate(getVoucherDate(row))}
            </span>
        ),
    },
    {
        key: "customerName",
        title: "Customer",

        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {getCustomerName(row)}
                </span>

                <span className="text-xs text-muted-foreground">
                    {getCustomerCode(row)}
                </span>
            </div>
        ),
    },
    {
        key: "salesInvoiceVoucherNumber",
        title: "Sales Invoice",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getSalesInvoiceNumber(row)}
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
        key: "returnStatus",
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

const normalizeSalesReturnForView = (record: any) => {
    const footer = getFooter(record);

    const products = getBodyRows(record).map((item: any) => {
        const unitCode = item?.unit || item?.uom || "";

        return {
            ...item,
            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productId: item?.productId || item?._id || "",
            productDescription: item?.productDescription || item?.description || "",
            description: item?.description || item?.productDescription || "",
            productHSNCode: item?.productHSNCode || "",
            remarks: item?.remarks || "",
            quantity: item?.quantity || "",
            returnedQuantity: item?.returnedQuantity || item?.returnQuantity || item?.quantity || "",
            returnQuantity: item?.returnQuantity || item?.returnedQuantity || item?.quantity || "",
            unit: unitCode,
            uom: unitCode,
            unitName: item?.unitName || "",
            rate: item?.rate || "",
            gross: item?.gross || item?.grossAmount || 0,
            grossAmount: item?.grossAmount || item?.gross || 0,
            discount: item?.discount ?? item?.discountPercentage ?? "",
            discountPercentage: item?.discountPercentage ?? item?.discount ?? "",
            discountAmount: item?.discountAmount || 0,
            taxableAmount: item?.taxableAmount || 0,
            cgst: item?.cgst ?? item?.cgstPercentage ?? "",
            cgstPercentage: item?.cgstPercentage ?? item?.cgst ?? "",
            cgstAmount: item?.cgstAmount || 0,
            sgst: item?.sgst ?? item?.sgstPercentage ?? "",
            sgstPercentage: item?.sgstPercentage ?? item?.sgst ?? "",
            sgstAmount: item?.sgstAmount || 0,
            igst: item?.igst ?? item?.igstPercentage ?? "",
            igstPercentage: item?.igstPercentage ?? item?.igst ?? "",
            igstAmount: item?.igstAmount || 0,
            taxAmount: item?.taxAmount || 0,
            otherAmount: item?.otherAmount || 0,
            netAmount: item?.netAmount || item?.netTotal || 0,
            netTotal: item?.netTotal || item?.netAmount || 0,
            sInvVoucherNumber: item?.sInvVoucherNumber || record?.sInvVoucherNumber || "",
        };
    });

    const totalQuantity =
        footer?.totalQuantity ??
        products.reduce(
            (total: number, product: any) =>
                total + toNumber(
                    product?.returnQuantity ||
                    product?.returnedQuantity ||
                    product?.quantity
                ),
            0
        );

    const voucherNumber = getVoucherNumber(record);
    const voucherDate = getVoucherDate(record);
    const customerCode = getCustomerCode(record) === "-" ? "" : getCustomerCode(record);
    const customerName = getCustomerName(record) === "-" ? "" : getCustomerName(record);
    const returnStatus = getReturnStatus(record) === "-" ? "" : getReturnStatus(record);
    const invoiceVoucherNumber =
        getSalesInvoiceNumber(record) === "-" ? "" : getSalesInvoiceNumber(record);

    const grossAmount =
        footer?.grossAmount ||
        footer?.totalGrossAmount ||
        record?.grossAmount ||
        "0.00";

    const discountAmount =
        footer?.discountAmount ||
        footer?.totalDiscountAmount ||
        record?.discountAmount ||
        "0.00";

    const cgstAmount =
        footer?.cgstAmount ||
        footer?.totalCgstAmount ||
        record?.cgstAmount ||
        "0.00";

    const sgstAmount =
        footer?.sgstAmount ||
        footer?.totalSgstAmount ||
        record?.sgstAmount ||
        "0.00";

    const igstAmount =
        footer?.igstAmount ||
        footer?.totalIgstAmount ||
        record?.igstAmount ||
        "0.00";

    const taxAmount =
        footer?.taxAmount ||
        footer?.totalTaxAmount ||
        record?.taxAmount ||
        "0.00";

    const otherAmount =
        footer?.otherAmount ||
        footer?.totalOtherAmount ||
        record?.otherAmount ||
        "0.00";

    const netAmount =
        footer?.netAmount ||
        footer?.totalNetAmount ||
        record?.netAmount ||
        record?.returnAmount ||
        "0.00";

    const adjustedAmount =
        footer?.adjustedAmount ||
        record?.adjustedAmount ||
        "0.00";

    const balanceAmount =
        footer?.balanceAmount ||
        footer?.netAmount ||
        footer?.totalNetAmount ||
        record?.balanceAmount ||
        record?.netAmount ||
        "0.00";

    return {
        ...record,

        // Actual Sales Return field keys used by the Sales Return screen
        sInvReturnVoucherNumber: record?.sInvReturnVoucherNumber || voucherNumber,
        sInvReturnVoucherDate: record?.sInvReturnVoucherDate || voucherDate,
        sInvReturnCustomerCode: record?.sInvReturnCustomerCode || customerCode,
        sInvCustomerCode: record?.sInvCustomerCode || customerCode,
        sInvReturnCustomerName: record?.sInvReturnCustomerName || customerName,
        sInvVoucherNumber: record?.sInvVoucherNumber || invoiceVoucherNumber,
        sInvReturnSalesAccount: record?.sInvReturnSalesAccount || record?.sInvSalesAccount || "SA021",
        sInvReturnStatus: record?.sInvReturnStatus || returnStatus || "open",
        sInvStatus: record?.sInvStatus || record?.sInvReturnStatus || returnStatus || "open",
        sInvReturnRemark: record?.sInvReturnRemark || record?.sInvRemark || record?.remark || "",
        sInvReturnRemarks: record?.sInvReturnRemarks || record?.sInvRemarks || record?.remarks || "",
        isAutoPost: record?.isAutoPost ?? false,

        products,
        sInvReturnBody: products,

        grossAmount,
        discountAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxAmount,
        otherAmount,
        netAmount,
        adjustedAmount,
        balanceAmount,
        totalQuantity,

        sInvReturnFooter: {
            ...footer,
            grossAmount,
            discountAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            taxAmount,
            otherAmount,
            netAmount,
            adjustedAmount,
            balanceAmount,
            totalQuantity,
            totalGrossAmount: footer?.totalGrossAmount || grossAmount,
            totalDiscountAmount: footer?.totalDiscountAmount || discountAmount,
            totalCgstAmount: footer?.totalCgstAmount || cgstAmount,
            totalSgstAmount: footer?.totalSgstAmount || sgstAmount,
            totalIgstAmount: footer?.totalIgstAmount || igstAmount,
            totalTaxAmount: footer?.totalTaxAmount || taxAmount,
            totalOtherAmount: footer?.totalOtherAmount || otherAmount,
            totalNetAmount: footer?.totalNetAmount || netAmount,
        },

        // Keep older aliases too
        sRetVoucherNumber: voucherNumber,
        sRetVoucherDate: voucherDate,
        sRetCustomerCode: customerCode,
        sRetCustomerName: customerName,
        sRetStatus: returnStatus,
        sRetBody: products,
        sReturnBody: products,
        salesReturnBody: products,
    };
};

/* ===================================================
   COMPONENT
=================================================== */

const SalesReturnRegister = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [dateError, setDateError] = useState("");
    const [customer, setCustomer] = useState("");
    const [product, setProduct] = useState("");

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
        salesReturnRegisterData = [],
        salesReturnLoading = false,
        salesReturnPagination = {},
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

    const customFilters: any = useMemo<
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



    /* ===================================================
       OPTIONS
    =================================================== */

    const customerOptions = useMemo(() => {
        return (accounts || [])
            .map((item: any) => ({
                label:
                    item?.accountName || "",

                value:
                    item?.accountCode || "",
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
            salesReturnRegisterData
        )
            ? salesReturnRegisterData
            : [];
    }, [salesReturnRegisterData]);

    const currentPagination = useMemo(() => {
        return salesReturnPagination || {};
    }, [salesReturnPagination]);

    const hasRegisterData = tableData.length > 0;

    const validateDates = (): boolean => {
        if (!fromDate && !toDate) {
            setDateError("");
            return true;
        }

        if (!fromDate || !toDate) {
            setDateError("Please select both From Date and To Date.");
            return false;
        }

        if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
            setDateError("From Date cannot be greater than To Date.");
            return false;
        }

        setDateError("");
        return true;
    };

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
            accountCode: customer,
            productCode: product,

            fromDate: fromDate ? toLocalStartOfDayUtc(fromDate) : "",
            toDate: toDate ? toLocalEndOfDayUtc(toDate) : "",

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
       LOAD CUSTOMER MASTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                search: "",
                accountType: "customer",
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
                                    "Sales return custom filter options failed:",
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
       LOAD SALES RETURN REGISTER
    =================================================== */

    useEffect(() => {
        if (
            (fromDate && !toDate) ||
            (!fromDate && toDate)
        ) {
            return;
        }

        if (
            fromDate &&
            toDate &&
            new Date(fromDate).getTime() >
            new Date(toDate).getTime()
        ) {
            return;
        }

        dispatch(
            getSalesReturnRegister(
                getPayload()
            )
        );
    }, [
        dispatch,
        fromDate,
        toDate,
        customer,
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
                        "Failed to prepare sales return view fields",
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
        if (!validateDates()) {
            return;
        }

        setLocalOffset(0);

        setRefreshKey(
            (previous) => previous + 1
        );
    };

    const handleClear = () => {
        setDateError("");
        setFromDate("");
        setToDate("");
        setCustomer("");
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
        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});

            setViewForm(
                normalizeSalesReturnForView(
                    row
                )
            );

            await dispatch(
                getAllTransactionSchema(
                    REGISTER_MODULE
                ) as any
            );
        } catch (error) {
            console.log(
                "Sales return view failed:",
                error
            );
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
    };

    const openExportPicker = async (
        requestedType: ExportType
    ) => {
        if (
            !hasRegisterData ||
            exportColumnsLoading ||
            pdfLoading ||
            excelLoading ||
            !validateDates()
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
                "Sales return export columns failed:",
                error
            );

            setExportType(null);
        } finally {
            setExportColumnsLoading(false);
        }
    };

    const performExportDownload =
        async (columns: string[]) => {
            if (
                !hasRegisterData ||
                !exportType ||
                !columns.length ||
                !validateDates()
            ) {
                return;
            }

            const currentExportType =
                exportType;

            const selectedColumns = [
                ...columns,
            ];

            setExportModalVisible(false);

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
                        getSalesReturnRegister(
                            getPayload(
                                currentExportType,
                                selectedColumns
                            )
                        )
                    ).unwrap();

                if (response?.blob) {
                    downloadBlobFile(
                        response.blob,

                        currentExportType ===
                            "pdf"
                            ? "sales-return-register.pdf"
                            : "sales-return-register.xlsx"
                    );
                }
            } catch (error: any) {
                console.log(
                    `Sales return register ${currentExportType.toUpperCase()} download failed:`,
                    error
                );

                let message =
                    `Failed to download ${currentExportType.toUpperCase()}`;

                const responseData =
                    error?.response?.data;

                if (responseData instanceof Blob) {
                    try {
                        const errorText =
                            await responseData.text();

                        const parsedError =
                            JSON.parse(errorText);

                        message =
                            parsedError?.message ||
                            parsedError?.error ||
                            message;
                    } catch {
                        message =
                            error?.message ||
                            message;
                    }
                } else {
                    message =
                        responseData?.message ||
                        responseData?.error ||
                        error?.message ||
                        message;
                }

                toast.error(message);
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
                title="Sales Return Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate,
                        required: false,
                        onChange: (value: string) => {
                            setFromDate(value || "");
                            setLocalOffset(0);
                            setDateError("");
                        },
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate,
                        required: false,
                        onChange: (value: string) => {
                            setToDate(value || "");
                            setLocalOffset(0);
                            setDateError("");
                        },
                    },
                    {
                        key: "customer",
                        type: "select",
                        label: "Customer",
                        placeholder:
                            "--Select Customer--",
                        value: customer,
                        options:
                            customerOptions,

                        onChange: (
                            value: string
                        ) => {
                            setCustomer(value);
                            setLocalOffset(0);
                        },
                    },
                    {
                        key: "product",
                        type: "select",
                        label: "Product",
                        placeholder:
                            "--Select Product--",
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

                            placeholder: `--Select ${filter.label || filter.key}--`,

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
                    !hasRegisterData ||
                    pdfLoading ||
                    excelLoading ||
                    exportColumnsLoading
                }
                excelDisabled={
                    !hasRegisterData ||
                    excelLoading ||
                    pdfLoading ||
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
                    !hasRegisterData
                        ? "No data available to export."
                        : "Please wait, export is processing."
                }
            />

            {dateError && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    {dateError}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={
                    salesReturnLoading ||
                    registerFilterDropdownLoading
                }
                emptyMessage="No sales return register data found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setViewModal(true);
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

            <ExportColumnsModal
                show={exportModalVisible}
                setShow={setExportModalVisible}
                exportType={exportType}
                systemColumns={systemColumns}
                customColumns={customColumns}
                selectedColumns={selectedExportColumns}
                loading={pdfLoading || excelLoading}
                onClose={closeExportModal}
                onDownload={performExportDownload}
            />

            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={true}
                title="View Sales Return"
                subtitle="View sales return details"
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

export default SalesReturnRegister;