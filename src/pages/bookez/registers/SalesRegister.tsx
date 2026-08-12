import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";
import { addSalesRegister } from "../../../redux/slices/professionalSlice/bookEzRegister/salesRegisterSlice";
import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberSalesInvoice } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import {
    loadAllTemplateOptions,
    toDateInputValue,
    toLocalEndOfDayUtc,
    toLocalStartOfDayUtc,
} from "../../../utils/helperFunctions";
import professionalAxios from "../../../services/professionalAxios";
import { clearRegisterFilterDropdowns, getRegisterFilterDropdowns } from "../../../redux/slices/professionalSlice/registerModule";
import { toast } from "react-toastify";
import ExportColumnsModal from "./components/ExportColumnsModal";

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "sInvVoucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.sInvVoucherNumber || "-"}
            </span>
        ),
    },
    {
        key: "sInvVoucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate = row?.sInvVoucherDate;

            const date = rawDate
                ? new Date(rawDate).toLocaleDateString("en-IN")
                : "-";

            return (
                <span className="font-medium text-card-foreground">
                    {date}
                </span>
            );
        },
    },
    {
        key: "sInvCustomerName",
        title: "Customer",
        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {row?.sInvCustomerName || "-"}
                </span>
                <span className="text-xs text-muted-foreground">
                    {row?.sInvCustomerCode || "-"}
                </span>
            </div>
        ),
    },
    {
        key: "sOrderNumber",
        title: "Order",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.sInvBody?.[0]?.sOrderNumber || "-"}
            </span>
        ),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) => (
            <span className="font-bold text-foreground">
                ₹{Number(row?.sInvFooter?.netAmount || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "sInvStatus",
        title: "Status",
        render: (row: any) => {
            const status = row?.sInvStatus || "-";
            const isOpen = String(status).toLowerCase() === "open";

            return (
                <span
                    className={`
                        rounded-full px-3 py-1 text-xs font-bold uppercase
                        ${isOpen
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }
                    `}
                >
                    {status}
                </span>
            );
        },
    },
];

/* ===================================================
   HELPERS
=================================================== */

const getVoucherRecordFromResponse = (res: any, voucherNumber: string) => {
    if (res?.invoice) return res.invoice;
    if (res?.data?.invoice) return res.data.invoice;

    if (res?.salesInvoice) return res.salesInvoice;
    if (res?.data?.salesInvoice) return res.data.salesInvoice;

    if (
        res &&
        typeof res === "object" &&
        res?.sInvVoucherNumber === voucherNumber
    ) {
        return res;
    }

    if (
        res?.data &&
        typeof res.data === "object" &&
        res.data?.sInvVoucherNumber === voucherNumber
    ) {
        return res.data;
    }

    const records =
        Array.isArray(res)
            ? res
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.invoices)
                    ? res.invoices
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.data?.records)
                            ? res.data.records
                            : Array.isArray(res?.data?.invoices)
                                ? res.data.invoices
                                : [];

    return (
        records.find(
            (item: any) =>
                item?.sInvVoucherNumber === voucherNumber
        ) ||
        records[0] ||
        null
    );
};

const normalizeInvoiceForView = (record: any) => {
    const footer = record?.sInvFooter || {};

    const products = (record?.sInvBody || []).map((item: any) => ({
        ...item,

        productCode: item?.productCode || "",
        productName: item?.productName || "",
        productId: item?.productId || "",

        productDescription:
            item?.productDescription || item?.description || "",

        description:
            item?.description || item?.productDescription || "",

        productHSNCode: item?.productHSNCode || "",

        quantity: item?.quantity || "",

        uom: item?.uom || item?.unit || "",

        unit: item?.unit || item?.uom || "",

        unitName: item?.unitName || "",

        rate: item?.rate || "",

        gross:
            item?.gross ||
            item?.grossAmount ||
            "",

        grossAmount:
            item?.grossAmount ||
            item?.gross ||
            "",

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
            "0.00",

        taxableAmount:
            item?.taxableAmount ||
            "0.00",

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
            "0.00",

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
            "0.00",

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

    return {
        ...record,

        sInvVoucherNumber:
            record?.sInvVoucherNumber ||
            record?.voucherNumber ||
            "",

        sInvVoucherDate:
            record?.sInvVoucherDate ||
            record?.voucherDate ||
            "",

        sInvCustomerCode:
            record?.sInvCustomerCode ||
            record?.customerCode ||
            "",

        sInvCustomerName:
            record?.sInvCustomerName ||
            record?.customerName ||
            "",

        sInvStatus:
            record?.sInvStatus ||
            record?.sInvDocStatus ||
            "open",

        sInvRemark:
            record?.sInvRemark ||
            record?.remark ||
            "",

        products,

        sInvBody: products,

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

        adjustedAmount:
            footer?.adjustedAmount ||
            "0.00",

        balanceAmount:
            footer?.balanceAmount ||
            footer?.netAmount ||
            footer?.totalNetAmount ||
            "0.00",

        totalQuantity:
            footer?.totalQuantity ||
            "0",
    };
};

type CustomFilterDefinition = {
    key: string;
    label?: string;
    type?: string;
    api?: string;
    customMasterCode?: string;
};

type DropdownOption = {
    label: string;
    value: string;
};

const BOOKEZ_API_PREFIX =
    "/eTaxSolnMongoApiBackend";

const resolveProfessionalApiPath = (
    apiPath: string
) => {
    const normalizedPath =
        String(apiPath || "").trim();

    if (!normalizedPath) return "";

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
    const seen =
        new Set<string>();

    return columns.filter(
        (column: any) => {
            const key =
                String(
                    column?.key ||
                    ""
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
                item.label &&
                item.value
        );
};

/* ===================================================
   COMPONENT
=================================================== */

const SalesRegister = () => {
    const dispatch =
        useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [fromDate, setFromDate] =
        useState<string>("");

    const [toDate, setToDate] =
        useState<string>("");

    const [dateError, setDateError] =
        useState<string>("");

    const [customer, setCustomer] =
        useState<string>("");

    const [product, setProduct] =
        useState<string>("");

    const [
        customFilterOptions,
        setCustomFilterOptions,
    ] = useState<
        Record<string, DropdownOption[]>
    >({});

    const [
        selectedCustomFilters,
        setSelectedCustomFilters,
    ] = useState<
        Record<string, string>
    >({});

    const [
        localOffset,
        setLocalOffset,
    ] = useState(0);

    const [
        localLimit,
        setLocalLimit,
    ] = useState(10);

    const [
        refreshKey,
        setRefreshKey,
    ] = useState(0);

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
        "pdf" |
        "excel" |
        null
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
       VIEW MODAL STATES
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
            state.accountMaster
    );

    const {
        products = [],
    } = useSelector(
        (state: any) =>
            state.productMaster
    );

    const {
        salesRegisterData = [],
        addLoader = false,
        pagination = {},
    } = useSelector(
        (state: any) =>
            state.salesRegister
    );

    // @ts-ignore
    const {
        filters:
        registerFilterDropdowns = [],
        loading:
        registerFilterDropdownLoading = false,
    } = useSelector(
        (state: any) =>
            state.registerFilterDropdown ||
            {}
    );

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

    const {
        transactionsSchema,
    } = useSelector(
        (state: any) =>
            state.getAllTransactionSchema
    );

    /* ===================================================
       FILTER ACTIVE CHECK
    =================================================== */

    const selectedCustomCodes =
        useMemo(() => {
            return customFilters
                .map(
                    (filter: any) =>
                        selectedCustomFilters[
                            filter.key
                        ] ||
                        ""
                )
                .filter(Boolean);
        }, [
            customFilters,
            selectedCustomFilters,
        ]);

    /* ===================================================
       OPTIONS
    =================================================== */

    const customerOptions =
        useMemo(() => {
            return (accounts || [])
                .map(
                    (item: any) => ({
                        label:
                            item?.accountName ||
                            "",

                        value:
                            item?.accountCode ||
                            "",
                    })
                )
                .filter(
                    (item: any) =>
                        item.label &&
                        item.value
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
                            item?.productName ||
                            "",

                        value:
                            item?.productCode ||
                            "",
                    })
                )
                .filter(
                    (item: any) =>
                        item.label &&
                        item.value
                );
        }, [
            products,
        ]);

    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData =
        useMemo(() => {
            return Array.isArray(
                salesRegisterData
            )
                ? salesRegisterData
                : [];
        }, [
            salesRegisterData,
        ]);

    const currentPagination =
        useMemo(() => {
            return pagination || {};
        }, [
            pagination,
        ]);

    const hasRegisterData =
        tableData.length > 0;

    const validateDates =
        (): boolean => {
            if (
                !fromDate &&
                !toDate
            ) {
                setDateError("");

                return true;
            }

            if (
                !fromDate ||
                !toDate
            ) {
                setDateError(
                    "Please select both From Date and To Date."
                );

                return false;
            }

            if (
                new Date(
                    fromDate
                ).getTime() >
                new Date(
                    toDate
                ).getTime()
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
        exportType:
            | "pdf"
            | "excel"
            | "" = "",
        selectedColumns:
            string[] = []
    ) => {
        const isExport =
            Boolean(
                exportType
            );

        return {
            fromDate:
                fromDate ||
                "",

            toDate:
                toDate ||
                "",

            offset:
                isExport
                    ? 0
                    : localOffset,

            limit:
                isExport
                    ? 120000
                    : localLimit,

            customerCode:
                customer,

            productCode:
                product,

            customCodes:
                selectedCustomCodes.length
                    ? selectedCustomCodes
                    : [""],

            ...(isExport
                ? {
                    exportType,
                    selectedColumns,
                }
                : {
                    exportType:
                        "" as const,
                }),
        };
    };

    /* ===================================================
       LOAD MASTER DATA
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
                limit: 200,
                offset: 0,
                search: "",
            })
        );
    }, [
        dispatch,
    ]);

    useEffect(() => {
        dispatch(
            getRegisterFilterDropdowns(
                "salesInvoice"
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

    useEffect(() => {
        let isMounted =
            true;

        const loadCustomFilterOptions =
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
                                filter:
                                    CustomFilterDefinition
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
                                    const customResponse =
                                        await professionalAxios.get(
                                            apiPath
                                        );

                                    const items =
                                        customResponse
                                            ?.data
                                            ?.data
                                            ?.items ||
                                        customResponse
                                            ?.data
                                            ?.items ||
                                        customResponse
                                            ?.data
                                            ?.data
                                            ?.data
                                            ?.items ||
                                        customResponse
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
                                } catch (
                                    error
                                ) {
                                    console.log(
                                        "Custom register filter options failed:",
                                        filter?.key,
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

                if (
                    !isMounted
                ) {
                    return;
                }

                setCustomFilterOptions(
                    Object.fromEntries(
                        optionEntries.filter(
                            ([key]) =>
                                Boolean(
                                    key
                                )
                        )
                    )
                );

                setSelectedCustomFilters(
                    (
                        previous
                    ) => {
                        const nextSelected:
                            Record<
                                string,
                                string
                            > = {};

                        customFilters.forEach(
                            (
                                filter:
                                    any
                            ) => {
                                if (
                                    filter?.key &&
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

        loadCustomFilterOptions();

        return () => {
            isMounted =
                false;
        };
    }, [
        customFilters,
    ]);

    useEffect(() => {
        if (
            (
                fromDate &&
                !toDate
            ) ||
            (
                !fromDate &&
                toDate
            )
        ) {
            return;
        }

        if (
            fromDate &&
            toDate &&
            new Date(
                fromDate
            ).getTime() >
            new Date(
                toDate
            ).getTime()
        ) {
            return;
        }

        dispatch(
            addSalesRegister(
                getPayload()
            )
        );
    }, [
        dispatch,
        fromDate,
        toDate,
        customer,
        product,
        selectedCustomCodes,
        localOffset,
        localLimit,
        refreshKey,
    ]);

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

                if (
                    !hasSchema
                ) {
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
                } catch (
                    error
                ) {
                    console.log(
                        "Failed to prepare sales invoice view fields",
                        error
                    );
                }
            };

        prepareViewFields();
    }, [
        transactionsSchema,
    ]);

    const viewFooterTotals =
        useMemo(() => ({
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
        }), [
            viewForm,
        ]);

    const viewFooterArray =
        useMemo(() => {
            return (
                viewTemplateFields
                    ?.footer ||
                []
            )
                .filter(
                    (
                        field:
                            any
                    ) =>
                        !field
                            .isHidden
                )
                .map(
                    (
                        field:
                            any
                    ) => {
                        const rawValue =
                            viewFooterTotals?.[
                                field.key as keyof typeof viewFooterTotals
                            ] ??
                            "0.00";

                        return {
                            ...field,
                            value:
                                rawValue,
                            rawValue,
                        };
                    }
                );
        }, [
            viewTemplateFields
                ?.footer,
            viewFooterTotals,
        ]);

    const viewInputData =
        useMemo(() => ({
            ...viewTemplateFields,
            footer:
                viewFooterArray,
        }), [
            viewTemplateFields,
            viewFooterArray,
        ]);

    /* ===================================================
       HANDLERS
    =================================================== */

    const handleRefresh =
        () => {
            if (
                !validateDates()
            ) {
                return;
            }

            setLocalOffset(
                0
            );

            setRefreshKey(
                (
                    prev
                ) =>
                    prev + 1
            );
        };

    const handleClear =
        () => {
            setDateError(
                ""
            );

            setFromDate(
                ""
            );

            setToDate(
                ""
            );

            setCustomer(
                ""
            );

            setProduct(
                ""
            );

            setSelectedCustomFilters(
                {}
            );

            setLocalOffset(
                0
            );

            setRefreshKey(
                (
                    prev
                ) =>
                    prev + 1
            );
        };

    const handleViewVoucher =
        async (
            row: any
        ) => {
            const voucherNumber =
                row
                    ?.sInvVoucherNumber ||
                row
                    ?.voucherNumber ||
                "";

            if (
                !voucherNumber
            ) {
                console.log(
                    "Sales invoice voucher number missing:",
                    row
                );

                return;
            }

            try {
                setViewModal(
                    true
                );

                setViewLoading(
                    true
                );

                setViewErrors(
                    {}
                );

                setViewForm(
                    {}
                );

                await dispatch(
                    getAllTransactionSchema(
                        "salesInvoice"
                    ) as any
                );

                const res =
                    await dispatch(
                        getByVoucherNumberSalesInvoice({
                            voucherNumber,
                        }) as any
                    ).unwrap();

                const record =
                    getVoucherRecordFromResponse(
                        res,
                        voucherNumber
                    );

                if (
                    !record
                ) {
                    console.log(
                        "Sales invoice not found:",
                        voucherNumber,
                        res
                    );

                    setViewForm(
                        {}
                    );

                    return;
                }

                setViewForm(
                    normalizeInvoiceForView(
                        record
                    )
                );
            } catch (
                error
            ) {
                console.log(
                    "Sales register view invoice failed",
                    error
                );

                setViewForm(
                    {}
                );
            } finally {
                setViewLoading(
                    false
                );
            }
        };

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

        link.href =
            url;

        link.download =
            fileName;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
            url
        );
    };

    const closeExportModal =
        () => {
            setExportModalVisible(
                false
            );

            setExportType(
                null
            );

            setSystemColumns(
                []
            );

            setCustomColumns(
                []
            );

            setSelectedExportColumns(
                []
            );
        };

    const openExportPicker =
        async (
            type:
                | "pdf"
                | "excel"
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
                    type
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
                                    "salesInvoice",
                            },
                        }
                    );

                const data =
                    response
                        ?.data
                        ?.data ??
                    response
                        ?.data ??
                    {};

                const system =
                    dedupeColumns(
                        data
                            ?.systemColumns ||
                        []
                    );

                const custom =
                    dedupeColumns(
                        (
                            data
                                ?.customColumns ||
                            []
                        ).filter(
                            (
                                column:
                                    any
                            ) =>
                                !system.some(
                                    (
                                        systemColumn:
                                            any
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

                // Default selected columns = all system columns.
                // Custom columns are selected only if the user selects them.
                setSelectedExportColumns(
                    system.map(
                        (
                            column:
                                any
                        ) =>
                            column.key
                    )
                );

                setExportModalVisible(
                    true
                );
            } catch (
                error
            ) {
                console.log(
                    "Sales register export columns failed",
                    error
                );

                setExportType(
                    null
                );
            } finally {
                setExportColumnsLoading(
                    false
                );
            }
        };

    const performExportDownload =
        async (
            columns:
                string[]
        ) => {
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

            // Make a separate copy before closing/resetting modal state.
            const selectedColumns =
                [...columns];

            closeExportModal();

            try {
                if (
                    currentExportType ===
                    "pdf"
                ) {
                    setPdfLoading(
                        true
                    );
                } else {
                    setExcelLoading(
                        true
                    );
                }

                const res =
                    await dispatch(
                        addSalesRegister(
                            getPayload(
                                currentExportType,
                                selectedColumns
                            )
                        )
                    ).unwrap();

                if (
                    res?.blob
                ) {
                    downloadBlobFile(
                        res.blob,

                        currentExportType ===
                            "pdf"
                            ? "sales-register.pdf"
                            : "sales-register.xlsx"
                    );
                }
            } catch (
                error:
                    any
            ) {
                console.log(
                    `Sales register ${currentExportType.toUpperCase()} download failed`,
                    error
                );

                toast.error(
                    error
                        ?.response
                        ?.data
                        ?.message ||
                    error
                        ?.response
                        ?.data
                        ?.error ||
                    error
                        ?.message ||
                    `Failed to download ${currentExportType.toUpperCase()}`
                );
            } finally {
                setPdfLoading(
                    false
                );

                setExcelLoading(
                    false
                );
            }
        };

    const handleDownloadPdf =
        () =>
            openExportPicker(
                "pdf"
            );

    const handleDownloadExcel =
        () =>
            openExportPicker(
                "excel"
            );

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Sales Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value:
                            fromDate
                                ? toDateInputValue(
                                    fromDate
                                )
                                : "",
                        onChange: (
                            value
                        ) => {
                            setFromDate(
                                value
                                    ? toLocalStartOfDayUtc(
                                        value
                                    )
                                    : ""
                            );

                            setLocalOffset(
                                0
                            );

                            setDateError(
                                ""
                            );
                        },
                        required:
                            false,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value:
                            toDate
                                ? toDateInputValue(
                                    toDate
                                )
                                : "",
                        onChange: (
                            value
                        ) => {
                            setToDate(
                                value
                                    ? toLocalEndOfDayUtc(
                                        value
                                    )
                                    : ""
                            );

                            setLocalOffset(
                                0
                            );

                            setDateError(
                                ""
                            );
                        },
                        required:
                            false,
                    },
                    {
                        key: "customer",
                        type: "select",
                        label: "Customer",
                        placeholder:
                            "Customer",
                        value:
                            customer,
                        options:
                            customerOptions,
                        onChange: (
                            value
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
                            "Product",
                        value:
                            product,
                        options:
                            productOptions,
                        onChange: (
                            value
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
                            filter:
                                any
                        ) => ({
                            key:
                                filter.key,

                            type:
                                "select",

                            label:
                                filter.label ||
                                filter.key,

                            placeholder:
                                filter.label ||
                                filter.key,

                            value:
                                selectedCustomFilters[
                                    filter.key
                                ] ||
                                "",

                            options:
                                customFilterOptions[
                                    filter.key
                                ] ||
                                [],

                            onChange:
                                (
                                    value:
                                        string
                                ) => {
                                    setSelectedCustomFilters(
                                        (
                                            prev
                                        ) => ({
                                            ...prev,

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
                onClear={
                    handleClear
                }
                onDownloadPdf={
                    handleDownloadPdf
                }
                onDownloadExcel={
                    handleDownloadExcel
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
                    (
                        exportColumnsLoading &&
                        exportType ===
                        "pdf"
                    )
                }
                excelLoading={
                    excelLoading ||
                    (
                        exportColumnsLoading &&
                        exportType ===
                        "excel"
                    )
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
                columns={
                    mainColumns
                }
                data={
                    tableData
                }
                loading={
                    addLoader ||
                    registerFilterDropdownLoading
                }
                emptyMessage="No sales register data found"
                showFieldSelector={
                    false
                }
                actions={(
                    row:
                        any
                ) => (
                    <button
                        type="button"
                        onClick={(
                            e
                        ) => {
                            e.stopPropagation();

                            handleViewVoucher(
                                row
                            );
                        }}
                        className="
                            inline-flex cursor-pointer items-center gap-1 rounded-lg
                            bg-primary/10 px-3 py-1.5 text-xs font-bold
                            text-primary transition hover:bg-primary/20
                        "
                    >
                        <Eye
                            size={
                                15
                            }
                        />
                    </button>
                )}
            />

            <ExportColumnsModal
                show={
                    exportModalVisible
                }
                setShow={
                    setExportModalVisible
                }
                exportType={
                    exportType
                }
                systemColumns={
                    systemColumns
                }
                customColumns={
                    customColumns
                }
                selectedColumns={
                    selectedExportColumns
                }
                loading={
                    pdfLoading ||
                    excelLoading
                }
                onClose={
                    closeExportModal
                }
                onDownload={
                    performExportDownload
                }
            />

            <DynamicAddForm
                isView={
                    true
                }
                show={
                    viewModal
                }
                setShow={
                    setViewModal
                }
                edit={
                    true
                }
                title="View Sales Invoice"
                subtitle="View sales invoice details"
                loading={
                    viewLoading
                }
                contentLoading={
                    viewLoading
                }
                onClose={() => {
                    setViewModal(
                        false
                    );

                    setViewForm(
                        {}
                    );

                    setViewErrors(
                        {}
                    );
                }}
                onSubmit={() => { }}
                form={
                    viewForm
                }
                errors={
                    viewErrors
                }
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

            {currentPagination?.totalDocs > 0 && (
                <div className="mt-2">
                    <Pagination
                        localLimit={
                            localLimit
                        }
                        selectCb={(
                            e:
                                any
                        ) => {
                            setLocalLimit(
                                Number(
                                    e.target.value
                                )
                            );

                            setLocalOffset(
                                0
                            );
                        }}
                        preDisabled={
                            !currentPagination
                                ?.hasPrevPage
                        }
                        nextDisabled={
                            !currentPagination
                                ?.hasNextPage
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

export default SalesRegister;