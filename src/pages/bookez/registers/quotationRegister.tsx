import {
    useEffect,
    useMemo,
    useState,
} from "react";
import { Eye } from "lucide-react";
import {
    useDispatch,
    useSelector,
} from "react-redux";

import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import ExportColumnsModal from "./components/ExportColumnsModal";

import {
    getAllAccounts,
} from "../../../redux/slices/professionalSlice/accountMasterSlice";

import {
    getAllProducts,
} from "../../../redux/slices/professionalSlice/productMasterSlice";

import {
    getAllTransactionSchema,
} from "../../../redux/slices/professionalSlice/transactionSchema";

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
import { getQuotationRegister } from "../../../redux/slices/professionalSlice/register";
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

const BOOKEZ_API_PREFIX =
    "/eTaxSolnMongoApiBackend";

/* ===================================================
   HELPERS
=================================================== */

const formatDate = (value: any) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-IN"
    );
};

const toNumber = (value: any) => {
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

const formatAmount = (value: any) => {
    return toNumber(value).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    );
};

const resolveProfessionalApiPath = (
    apiPath: string
) => {
    const normalizedPath = String(
        apiPath || ""
    ).trim();

    if (!normalizedPath) {
        return "";
    }

    if (
        normalizedPath.startsWith(
            BOOKEZ_API_PREFIX
        )
    ) {
        return normalizedPath;
    }

    return `${BOOKEZ_API_PREFIX}${normalizedPath.startsWith("/")
        ? normalizedPath
        : `/${normalizedPath}`
        }`;
};

const dedupeColumns = (
    columns: any[] = []
) => {
    const seen = new Set<string>();

    return columns.filter(
        (column: any) => {
            const key = String(
                column?.key || ""
            ).trim();

            if (
                !key ||
                seen.has(key)
            ) {
                return false;
            }

            seen.add(key);

            return true;
        }
    );
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
                Boolean(
                    item.label &&
                    item.value
                )
        );
};

const normalizeStatus = (
    value: any
) => {
    return String(value || "")
        .trim()
        .toLowerCase();
};

const getVoucherNumber = (
    row: any
) => {
    return String(
        row?.sQuoteVoucherNumber ||
        row?.voucher ||
        row?.voucherNumber ||
        ""
    ).trim();
};

const getVoucherDate = (
    row: any
) => {
    return (
        row?.sQuoteVoucherDate ||
        row?.date ||
        ""
    );
};

const getCustomerName = (
    row: any
) => {
    return (
        row?.sQuoteCustomerName ||
        row?.customer ||
        row?.customerName ||
        "-"
    );
};

const getCustomerCode = (
    row: any
) => {
    return (
        row?.sQuoteCustomerCode ||
        row?.customerCode ||
        "-"
    );
};

const getQuotationStatus = (
    row: any
) => {
    return String(
        row?.sQuoteStatus ||
        row?.quotationStatus ||
        row?.status ||
        "-"
    );
};

const getDocumentStatus = (
    row: any
) => {
    return String(
        row?.sQuoteDocStatus ||
        row?.documentStatus ||
        row?.docStatus ||
        "-"
    );
};

const getQuotationAmount = (
    row: any
) => {
    return toNumber(
        row?.sQuoteFooter?.netAmount ??
        row?.quotationAmount ??
        row?.netAmount ??
        row?.itemAmount ??
        0
    );
};

const getTotalQuantity = (
    row: any
) => {
    if (
        row?.sQuoteFooter
            ?.totalQuantity !==
        undefined
    ) {
        return toNumber(
            row.sQuoteFooter
                .totalQuantity
        );
    }

    if (
        row?.quantity !== undefined
    ) {
        return toNumber(
            row.quantity
        );
    }

    if (
        Array.isArray(
            row?.sQuoteBody
        )
    ) {
        return row.sQuoteBody.reduce(
            (
                total: number,
                item: any
            ) =>
                total +
                toNumber(
                    item?.quantity
                ),
            0
        );
    }

    return 0;
};

const getProductSummary = (
    row: any
) => {
    if (
        row?.product ||
        row?.productName
    ) {
        return (
            row.product ||
            row.productName
        );
    }

    const body = Array.isArray(
        row?.sQuoteBody
    )
        ? row.sQuoteBody
        : [];

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

    return `${firstProduct} +${body.length - 1
        } more`;
};

const getQuotationStatusClass = (
    value: any
) => {
    const status =
        normalizeStatus(value);

    if (
        status === "won" ||
        status === "accepted"
    ) {
        return "bg-success/10 text-success";
    }

    if (
        status === "lost" ||
        status === "rejected" ||
        status === "cancelled" ||
        status === "canceled"
    ) {
        return "bg-destructive/10 text-destructive";
    }

    if (
        status === "sent" ||
        status === "approved"
    ) {
        return "bg-primary/10 text-primary";
    }

    return "bg-muted text-muted-foreground";
};

const getDocumentStatusClass = (
    value: any
) => {
    const status =
        normalizeStatus(value);

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
        key: "sQuoteVoucherNumber",
        title: "Voucher Number",

        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getVoucherNumber(row) ||
                    "-"}
            </span>
        ),
    },
    {
        key: "sQuoteVoucherDate",
        title: "Voucher Date",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {formatDate(
                    getVoucherDate(row)
                )}
            </span>
        ),
    },
    {
        key: "sQuoteCustomerName",
        title: "Customer",

        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {getCustomerName(
                        row
                    )}
                </span>

                <span className="text-xs text-muted-foreground">
                    {getCustomerCode(
                        row
                    )}
                </span>
            </div>
        ),
    },
    {
        key: "productName",
        title: "Product",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getProductSummary(
                    row
                )}
            </span>
        ),
    },
    {
        key: "totalQuantity",
        title: "Quantity",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {getTotalQuantity(
                    row
                )}
            </span>
        ),
    },
    {
        key: "netAmount",
        title: "Net Amount",

        render: (row: any) => (
            <span className="whitespace-nowrap font-bold text-foreground">
                ₹
                {formatAmount(
                    getQuotationAmount(
                        row
                    )
                )}
            </span>
        ),
    },
    {
        key: "sQuoteStatus",
        title: "Quotation Status",

        render: (row: any) => {
            const status =
                getQuotationStatus(
                    row
                );

            return (
                <span
                    className={`
                        inline-flex rounded-full
                        px-3 py-1 text-xs
                        font-bold uppercase
                        ${getQuotationStatusClass(
                        status
                    )}
                    `}
                >
                    {status}
                </span>
            );
        },
    },
    {
        key: "sQuoteDocStatus",
        title: "Document Status",

        render: (row: any) => {
            const status =
                getDocumentStatus(
                    row
                );

            return (
                <span
                    className={`
                        inline-flex rounded-full
                        px-3 py-1 text-xs
                        font-bold uppercase
                        ${getDocumentStatusClass(
                        status
                    )}
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

const normalizeQuotationForView = (
    record: any
) => {
    const footer =
        record?.sQuoteFooter || {};

    const products = (
        Array.isArray(
            record?.sQuoteBody
        )
            ? record.sQuoteBody
            : []
    ).map((item: any) => ({
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
            item?.productHSNCode ||
            "",

        remarks:
            item?.remarks || "",

        quantity:
            item?.quantity || "",

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
    }));

    const totalQuantity =
        footer?.totalQuantity ||
        products.reduce(
            (
                total: number,
                product: any
            ) =>
                total +
                toNumber(
                    product?.quantity
                ),
            0
        );

    return {
        ...record,

        sQuoteVoucherNumber:
            record
                ?.sQuoteVoucherNumber ||
            record?.voucher ||
            record?.voucherNumber ||
            "",

        sQuoteVoucherDate:
            record
                ?.sQuoteVoucherDate ||
            record?.date ||
            "",

        sQuoteCustomerCode:
            record
                ?.sQuoteCustomerCode ||
            record?.customerCode ||
            "",

        sQuoteCustomerName:
            record
                ?.sQuoteCustomerName ||
            record?.customer ||
            record?.customerName ||
            "",

        sQuoteSalesAccount:
            record
                ?.sQuoteSalesAccount ||
            "",

        sQuoteStatus:
            record?.sQuoteStatus ||
            record?.quotationStatus ||
            "draft",

        sQuoteDocStatus:
            record
                ?.sQuoteDocStatus ||
            record?.documentStatus ||
            "open",

        products,
        sQuoteBody: products,

        grossAmount:
            footer?.grossAmount ||
            footer
                ?.totalGrossAmount ||
            "0.00",

        discountAmount:
            footer
                ?.discountAmount ||
            footer
                ?.totalDiscountAmount ||
            "0.00",

        cgstAmount:
            footer?.cgstAmount ||
            footer
                ?.totalCgstAmount ||
            "0.00",

        sgstAmount:
            footer?.sgstAmount ||
            footer
                ?.totalSgstAmount ||
            "0.00",

        igstAmount:
            footer?.igstAmount ||
            footer
                ?.totalIgstAmount ||
            "0.00",

        taxAmount:
            footer?.taxAmount ||
            footer
                ?.totalTaxAmount ||
            "0.00",

        otherAmount:
            footer?.otherAmount ||
            footer
                ?.totalOtherAmount ||
            "0.00",

        netAmount:
            footer?.netAmount ||
            footer
                ?.totalNetAmount ||
            record
                ?.quotationAmount ||
            "0.00",

        adjustedAmount:
            footer
                ?.adjustedAmount ||
            "0.00",

        balanceAmount:
            footer
                ?.balanceAmount ||
            footer?.netAmount ||
            footer
                ?.totalNetAmount ||
            record
                ?.quotationAmount ||
            "0.00",

        totalQuantity,
    };
};

/* ===================================================
   COMPONENT
=================================================== */

const QuotationRegister = () => {
    const dispatch =
        useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [
        fromDate,
        setFromDate,
    ] = useState("");

    const [
        toDate,
        setToDate,
    ] = useState("");

    const [
        dateError,
        setDateError,
    ] = useState("");

    const [
        customer,
        setCustomer,
    ] = useState("");

    const [
        product,
        setProduct,
    ] = useState("");

    const [
        selectedCustomFilters,
        setSelectedCustomFilters,
    ] = useState<
        Record<string, string>
    >({});

    const [
        customFilterOptions,
        setCustomFilterOptions,
    ] = useState<
        Record<
            string,
            DropdownOption[]
        >
    >({});

    /* ===================================================
       PAGINATION STATES
    =================================================== */

    const [
        localOffset,
        setLocalOffset,
    ] = useState(0);

    const [
        localLimit,
        setLocalLimit,
    ] = useState(20);

    const [
        refreshKey,
        setRefreshKey,
    ] = useState(0);

    /* ===================================================
       EXPORT STATES
    =================================================== */

    const [
        pdfLoading,
        setPdfLoading,
    ] = useState(false);

    const [
        excelLoading,
        setExcelLoading,
    ] = useState(false);

    const [
        exportModalVisible,
        setExportModalVisible,
    ] = useState(false);

    const [
        exportType,
        setExportType,
    ] = useState<
        ExportType | null
    >(null);

    const [
        exportColumnsLoading,
        setExportColumnsLoading,
    ] = useState(false);

    const [
        systemColumns,
        setSystemColumns,
    ] = useState<any[]>([]);

    const [
        customColumns,
        setCustomColumns,
    ] = useState<any[]>([]);

    const [
        selectedExportColumns,
        setSelectedExportColumns,
    ] = useState<string[]>([]);

    /* ===================================================
       VIEW STATES
    =================================================== */

    const [
        viewModal,
        setViewModal,
    ] = useState(false);

    const [
        viewLoading,
        setViewLoading,
    ] = useState(false);

    const [
        viewForm,
        setViewForm,
    ] = useState<any>({});

    const [
        viewErrors,
        setViewErrors,
    ] = useState<any>({});

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

    const {
        accounts = [],
    } = useSelector(
        (state: any) =>
            state.accountMaster ||
            {}
    );

    const {
        products = [],
    } = useSelector(
        (state: any) =>
            state.productMaster ||
            {}
    );

    const {
        quotationRegisterData = [],
        quotationLoading = false,
        quotationPagination = {},
    } = useSelector(
        (state: any) =>
            state.allRegisters ||
            {}
    );

    const {
        filters:
        registerFilterDropdowns = [],
        loading:
        registerFilterDropdownLoading = false,
    } = useSelector(
        (state: any) =>
            state
                .registerFilterDropdown ||
            {}
    );

    const {
        transactionsSchema,
    } = useSelector(
        (state: any) =>
            state
                .getAllTransactionSchema ||
            {}
    );

    /* ===================================================
       CUSTOM FILTERS
    =================================================== */

    const customFilters: any =
        useMemo<
            CustomFilterDefinition[]
        >(() => {
            return Array.isArray(
                registerFilterDropdowns
            )
                ? registerFilterDropdowns
                : [];
        }, [
            registerFilterDropdowns,
        ]);

    const selectedCustomCodes =
        useMemo(() => {
            return customFilters
                .map(
                    (
                        filter: CustomFilterDefinition
                    ) =>
                        selectedCustomFilters[
                        filter.key
                        ] || ""
                )
                .filter(Boolean);
        }, [
            customFilters,
            selectedCustomFilters,
        ]);

    const selectedCustomCodesKey =
        useMemo(() => {
            return selectedCustomCodes.join(
                "|"
            );
        }, [
            selectedCustomCodes,
        ]);

    /* ===================================================
       FILTER ACTIVE CHECK
    =================================================== */



    /* ===================================================
       OPTIONS
    =================================================== */

    const customerOptions =
        useMemo(() => {
            return (accounts || [])
                .map(
                    (item: any) => ({
                        label:
                            item
                                ?.accountName ||
                            "",

                        value:
                            item
                                ?.accountCode ||
                            "",
                    })
                )
                .filter(
                    (
                        item: DropdownOption
                    ) =>
                        Boolean(
                            item.label &&
                            item.value
                        )
                );
        }, [
            accounts,
        ]);

    const productOptions =
        useMemo(() => {
            return (products || [])
                .map(
                    (item: any) => ({
                        label:
                            item
                                ?.productName ||
                            "",

                        value:
                            item
                                ?.productCode ||
                            "",
                    })
                )
                .filter(
                    (
                        item: DropdownOption
                    ) =>
                        Boolean(
                            item.label &&
                            item.value
                        )
                );
        }, [
            products,
        ]);

    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData = useMemo(
        () => {
            return Array.isArray(
                quotationRegisterData
            )
                ? quotationRegisterData
                : [];
        },
        [
            quotationRegisterData,
        ]
    );

    const currentPagination =
        useMemo(() => {
            return (
                quotationPagination ||
                {}
            );
        }, [
            quotationPagination,
        ]);

    const hasRegisterData =
        tableData.length > 0;

    const validateDates = (): boolean => {
        if (!fromDate && !toDate) {
            setDateError("");
            return true;
        }

        if (!fromDate || !toDate) {
            setDateError(
                "Please select both From Date and To Date."
            );
            return false;
        }

        if (
            new Date(fromDate).getTime() >
            new Date(toDate).getTime()
        ) {
            setDateError(
                "From Date cannot be greater than To Date."
            );
            return false;
        }

        setDateError("");
        return true;
    };

    /* ===================================================
       PAYLOAD
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
                selectedCustomCodes
                    .length
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
       LOAD CUSTOMERS
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                search: "",
                accountType:
                    "customer",
            })
        );
    }, [
        dispatch,
    ]);

    useEffect(() => {
        dispatch(
            getAllProducts({
                offset: 0,
                limit: 200,
                search: "",
            })
        );
    }, [dispatch,]);

    useEffect(() => {
        dispatch(
            getRegisterFilterDropdowns(
                "salesQuotation"
            )
        );

        return () => {
            dispatch(
                clearRegisterFilterDropdowns()
            );
        };
    }, [
        dispatch,
    ]);

    /* ===================================================
       LOAD CUSTOM FILTER OPTIONS
    =================================================== */

    useEffect(() => {
        let isMounted = true;

        const loadOptions =
            async () => {
                if (
                    !customFilters.length
                ) {
                    setCustomFilterOptions(
                        {}
                    );

                    setSelectedCustomFilters(
                        {}
                    );

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
                                        response
                                            ?.data
                                            ?.data
                                            ?.items ||
                                        response
                                            ?.data
                                            ?.items ||
                                        response
                                            ?.data
                                            ?.data
                                            ?.data
                                            ?.items ||
                                        response
                                            ?.data
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
                                        "Quotation custom filter options failed:",
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
    }, [
        customFilters,
    ]);

    /* ===================================================
       LOAD QUOTATION REGISTER
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
            getQuotationRegister(
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
       PREPARE VIEW TEMPLATE
    =================================================== */

    useEffect(() => {
        const prepareViewFields =
            async () => {
                if (
                    !transactionsSchema
                ) {
                    return;
                }

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
                        "Failed to prepare quotation view fields",
                        error
                    );
                }
            };

        prepareViewFields();
    }, [
        transactionsSchema,
    ]);

    /* ===================================================
       VIEW FOOTER
    =================================================== */

    const viewFooterTotals =
        useMemo(() => {
            return {
                grossAmount:
                    viewForm
                        ?.grossAmount ||
                    "0.00",

                discountAmount:
                    viewForm
                        ?.discountAmount ||
                    "0.00",

                cgstAmount:
                    viewForm
                        ?.cgstAmount ||
                    "0.00",

                sgstAmount:
                    viewForm
                        ?.sgstAmount ||
                    "0.00",

                igstAmount:
                    viewForm
                        ?.igstAmount ||
                    "0.00",

                taxAmount:
                    viewForm
                        ?.taxAmount ||
                    "0.00",

                otherAmount:
                    viewForm
                        ?.otherAmount ||
                    "0.00",

                netAmount:
                    viewForm
                        ?.netAmount ||
                    "0.00",

                adjustedAmount:
                    viewForm
                        ?.adjustedAmount ||
                    "0.00",

                balanceAmount:
                    viewForm
                        ?.balanceAmount ||
                    "0.00",

                totalQuantity:
                    viewForm
                        ?.totalQuantity ||
                    "0",
            };
        }, [
            viewForm,
        ]);

    const viewFooterArray =
        useMemo(() => {
            return (
                viewTemplateFields
                    ?.footer || []
            )
                .filter(
                    (field: any) =>
                        !field?.isHidden
                )
                .map(
                    (field: any) => {
                        const rawValue =
                            viewFooterTotals[
                            field.key as keyof typeof viewFooterTotals
                            ] ??
                            "0.00";

                        return {
                            ...field,
                            value: rawValue,
                            rawValue,
                        };
                    }
                );
        }, [
            viewTemplateFields?.footer,
            viewFooterTotals,
        ]);

    const viewInputData =
        useMemo(() => {
            return {
                ...viewTemplateFields,
                footer:
                    viewFooterArray,
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
            (previous) =>
                previous + 1
        );
    };

    const handleClear = () => {
        setDateError("");
        setFromDate("");
        setToDate("");
        setCustomer("");
        setProduct("");

        setSelectedCustomFilters(
            {}
        );

        setLocalOffset(0);

        setRefreshKey(
            (previous) =>
                previous + 1
        );
    };

    /* ===================================================
       VIEW HANDLER
    =================================================== */

    const handleViewVoucher =
        async (row: any) => {
            const voucherNumber =
                getVoucherNumber(row);

            if (!voucherNumber) {
                console.log(
                    "Quotation voucher number missing:",
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
                        "salesQuotation"
                    ) as any
                );

                setViewForm(
                    normalizeQuotationForView(
                        row
                    )
                );
            } catch (error) {
                console.log(
                    "Quotation view failed:",
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
            document.createElement(
                "a"
            );

        link.href = url;
        link.download = fileName;

        document.body.appendChild(
            link
        );

        link.click();
        link.remove();

        window.URL.revokeObjectURL(
            url
        );
    };

    /* ===================================================
       EXPORT HANDLERS
    =================================================== */

    const closeExportModal =
        () => {
            setExportModalVisible(
                false
            );
        };

    const openExportPicker =
        async (
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
                setExportType(
                    requestedType
                );

                setExportColumnsLoading(
                    true
                );

                const response =
                    await professionalAxios.get(
                        "/eTaxSolnMongoApiBackend/users/bookez/registers/exportColumns",
                        {
                            params: {
                                module:
                                    "salesQuotation",
                            },
                        }
                    );

                const data =
                    response?.data
                        ?.data ??
                    response?.data ??
                    {};

                const system =
                    dedupeColumns(
                        data?.systemColumns ||
                        []
                    );

                const custom =
                    dedupeColumns(
                        (
                            data?.customColumns ||
                            []
                        ).filter(
                            (
                                column: any
                            ) =>
                                !system.some(
                                    (
                                        systemColumn: any
                                    ) =>
                                        systemColumn
                                            ?.key ===
                                        column
                                            ?.key
                                )
                        )
                    );

                setSystemColumns(
                    system
                );

                setCustomColumns(
                    custom
                );

                setSelectedExportColumns(
                    system.map(
                        (
                            column: any
                        ) =>
                            column.key
                    )
                );

                setExportModalVisible(
                    true
                );
            } catch (error) {
                console.log(
                    "Quotation export columns failed:",
                    error
                );

                setExportType(null);
            } finally {
                setExportColumnsLoading(
                    false
                );
            }
        };

    const performExportDownload = async (
        columns: string[]
    ) => {
        if (
            !hasRegisterData ||
            !exportType ||
            !columns.length ||
            !validateDates()
        ) {
            return;
        }

        const currentExportType = exportType;
        const selectedColumns = [...columns];

        setExportModalVisible(false);

        try {
            if (currentExportType === "pdf") {
                setPdfLoading(true);
            } else {
                setExcelLoading(true);
            }

            const response =
                await professionalAxios.post(
                    "/eTaxSolnMongoApiBackend/users/bookEZ/registers/quotationRegister",
                    getPayload(
                        currentExportType,
                        selectedColumns
                    ),
                    {
                        responseType: "blob",
                    }
                );

            const blob = response?.data;

            if (!(blob instanceof Blob)) {
                toast.error(
                    `Failed to download ${currentExportType.toUpperCase()}`
                );

                return;
            }

            downloadBlobFile(
                blob,
                currentExportType === "pdf"
                    ? "quotation-register.pdf"
                    : "quotation-register.xlsx"
            );
        } catch (error: any) {
            console.log(
                `Quotation register ${currentExportType.toUpperCase()} download failed`,
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
                title="Quotation Register Filters"
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
                            "Select Customer",
                        value: customer,
                        options:
                            customerOptions,

                        onChange: (
                            value: string
                        ) => {
                            setCustomer(
                                value
                            );

                            setLocalOffset(
                                0
                            );
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
                            setProduct(
                                value
                            );

                            setLocalOffset(
                                0
                            );
                        },
                    },

                    ...customFilters.map(
                        (
                            filter: CustomFilterDefinition
                        ) => ({
                            key:
                                filter.key,

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

                                setLocalOffset(
                                    0
                                );
                            },
                        })
                    ),
                ]}
                gridCols="4"
                onSearch={
                    handleRefresh
                }
                onClear={handleClear}
                onDownloadPdf={() =>
                    openExportPicker(
                        "pdf"
                    )
                }
                onDownloadExcel={() =>
                    openExportPicker(
                        "excel"
                    )
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
                        exportType ===
                        "pdf")
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
                    quotationLoading ||
                    registerFilterDropdownLoading
                }
                emptyMessage="No quotation register data found"
                showFieldSelector={
                    false
                }
                actions={(
                    row: any
                ) => (
                    <button
                        type="button"
                        onClick={(
                            event
                        ) => {
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
                            transition hover:bg-primary/20
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
                title="View Sales Quotation"
                subtitle="View sales quotation details"
                loading={viewLoading}
                contentLoading={
                    viewLoading
                }
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
                inputData={
                    viewInputData
                }
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
                                        event
                                            .target
                                            .value
                                    )
                                );

                                setLocalOffset(
                                    0
                                );
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

export default QuotationRegister;