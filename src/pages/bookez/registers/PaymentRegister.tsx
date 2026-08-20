import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import RegisterFilterCard from "./RegisterFilterCard";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";

import {
    addPaymentRegister,
} from "../../../redux/slices/professionalSlice/bookEzRegister/paymentRegisterSlice";

import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberPayment } from "../../../redux/slices/professionalSlice/purchaseWorkflow/paymentSlice";

import {
    loadAllTemplateOptions,
    toLocalEndOfDayUtc,
    toLocalStartOfDayUtc,
} from "../../../utils/helperFunctions";
import professionalAxios from "../../../services/professionalAxios";
import {
    clearRegisterFilterDropdowns,
    getRegisterFilterDropdowns,
} from "../../../redux/slices/professionalSlice/registerModule";
import { toast } from "react-toastify";
import ExportColumnsModal from "./components/ExportColumnsModal";

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "payVoucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.payVoucherNumber || row?.paymentVoucherNumber || "-"}
            </span>
        ),
    },
    {
        key: "payVoucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate =
                row?.payVoucherDate ||
                row?.paymentVoucherDate ||
                row?.voucherDate;

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
        key: "payAccountName",
        title: "Account",
        render: (row: any) => (
            <div>
                <div className="font-semibold text-card-foreground">
                    {row?.payAccountName || row?.accountName || "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                    {row?.payAccountCode || row?.accountCode || "-"}
                </div>
            </div>
        ),
    },
    {
        key: "adjustedAmount",
        title: "Adjusted Amount",
        render: (row: any) => (
            <span className="font-bold text-foreground">
                ₹{Number(
                    row?.payFooter?.adjustedAmount ||
                    row?.adjustedAmount ||
                    0
                ).toFixed(2)}
            </span>
        ),
    },
    {
        key: "balanceAmount",
        title: "Balance Amount",
        render: (row: any) => (
            <span className="font-bold text-foreground">
                ₹{Number(
                    row?.payFooter?.balanceAmount ||
                    row?.balanceAmount ||
                    0
                ).toFixed(2)}
            </span>
        ),
    },
];

/* ===================================================
   HELPERS
=================================================== */

const getVoucherRecordFromResponse = (
    res: any,
    voucherNumber: string
) => {
    if (res?.payment) return res.payment;
    if (res?.data?.payment) return res.data.payment;

    if (res?.record) return res.record;
    if (res?.data?.record) return res.data.record;

    if (
        res &&
        typeof res === "object" &&
        res?.payVoucherNumber === voucherNumber
    ) {
        return res;
    }

    if (
        res?.data &&
        typeof res.data === "object" &&
        res.data?.payVoucherNumber === voucherNumber
    ) {
        return res.data;
    }

    const records =
        Array.isArray(res)
            ? res
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.payments)
                    ? res.payments
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.data?.records)
                            ? res.data.records
                            : Array.isArray(res?.data?.payments)
                                ? res.data.payments
                                : [];

    return (
        records.find(
            (item: any) =>
                item?.payVoucherNumber === voucherNumber ||
                item?.voucherNumber === voucherNumber
        ) ||
        records[0] ||
        null
    );
};

const normalizePaymentForView = (record: any) => {
    const footer = record?.payFooter || {};

    const payBody = (record?.payBody || []).map((item: any) => ({
        ...item,

        accountCode: item?.accountCode || "",
        accountName: item?.accountName || "",
        amount: item?.amount || "0",
        netAmount: item?.netAmount || item?.amount || "0",

        references: item?.references || [],
        remarks: item?.remarks || "",
        customMasters: item?.customMasters || {},
    }));

    return {
        ...record,

        payVoucherNumber:
            record?.payVoucherNumber || record?.voucherNumber || "",

        payVoucherDate:
            record?.payVoucherDate || record?.voucherDate || "",

        payAccountCode:
            record?.payAccountCode || record?.accountCode || "",

        payAccountName:
            record?.payAccountName || record?.accountName || "",

        payStatus:
            record?.payStatus || record?.status || "open",

        payRemark:
            record?.payRemark || record?.remark || "",

        payBody,

        grossAmount: "0.00",
        discountAmount: "0.00",
        cgstAmount: "0.00",
        sgstAmount: "0.00",
        igstAmount: "0.00",
        taxAmount: "0.00",
        otherAmount: "0.00",

        netAmount:
            footer?.netAmount || record?.netAmount || "0.00",

        adjustedAmount:
            footer?.adjustedAmount || record?.adjustedAmount || "0.00",

        balanceAmount:
            footer?.balanceAmount || record?.balanceAmount || "0.00",

        totalQuantity: "0",
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

const BOOKEZ_API_PREFIX = "/eTaxSolnMongoApiBackend";

const resolveProfessionalApiPath = (apiPath: string) => {
    const normalizedPath = String(apiPath || "").trim();

    if (!normalizedPath) return "";

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

        if (!key || seen.has(key)) return false;

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
                item?.masterName ||
                item?.customMasterName ||
                item?.description ||
                item?.code ||
                item?.customCode ||
                ""
            ).trim(),

            value: String(
                item?.code ||
                item?.customCode ||
                item?.masterCode ||
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
   COMPONENT
=================================================== */

const PaymentRegister = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [dateError, setDateError] = useState<string>("");
    const [account, setAccount] = useState<string>("");

    const [customFilterOptions, setCustomFilterOptions] = useState<
        Record<string, DropdownOption[]>
    >({});

    const [selectedCustomFilters, setSelectedCustomFilters] = useState<
        Record<string, string>
    >({});

    const lastRegisterRequestKeyRef = useRef<string>("");

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [refreshKey, setRefreshKey] = useState(0);

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportType, setExportType] = useState<
        "pdf" | "excel" | null
    >(null);

    const [exportColumnsLoading, setExportColumnsLoading] =
        useState(false);

    const [systemColumns, setSystemColumns] = useState<any[]>([]);
    const [customColumns, setCustomColumns] = useState<any[]>([]);

    const [selectedExportColumns, setSelectedExportColumns] =
        useState<string[]>([]);

    /* ===================================================
       VIEW MODAL STATES
    =================================================== */

    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewForm, setViewForm] = useState<any>({});
    const [viewErrors, setViewErrors] = useState<any>({});

    const [viewTemplateFields, setViewTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    /* ===================================================
       REDUX SELECTORS
    =================================================== */

    const { accounts = [] } = useSelector(
        (state: any) => state.accountMaster
    );

    const {
        paymentRegisterData = [],
        addLoader = false,
        pagination = {},
    } = useSelector((state: any) => state.paymentRegister);

    const {
        filters: registerFilterDropdowns = [],
        loading: registerFilterDropdownLoading = false,
        error: registerFilterDropdownError = null,
    } = useSelector(
        (state: any) =>
            state.registerFilterDropdown || {}
    );

    const customFilters: any = useMemo<
        CustomFilterDefinition[]
    >(() => {
        return Array.isArray(registerFilterDropdowns)
            ? registerFilterDropdowns
            : [];
    }, [registerFilterDropdowns]);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    /* ===================================================
       FILTER ACTIVE CHECK
    =================================================== */

    const selectedCustomCodes = useMemo(() => {
        return customFilters
            .map(
                (filter: any) =>
                    selectedCustomFilters[filter.key] || ""
            )
            .filter(Boolean);
    }, [customFilters, selectedCustomFilters]);

    const customCodesKey = useMemo(() => {
        return JSON.stringify(
            selectedCustomCodes.length
                ? selectedCustomCodes
                : [""]
        );
    }, [selectedCustomCodes]);

    /* ===================================================
       OPTIONS
    =================================================== */

    const accountOptions = useMemo(() => {
        return (accounts || [])
            .map((item: any) => ({
                label: item?.accountName || "",
                value: item?.accountCode || "",
            }))
            .filter((item: any) => item.label && item.value);
    }, [accounts]);

    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData = useMemo(() => {
        return Array.isArray(paymentRegisterData)
            ? paymentRegisterData
            : [];
    }, [paymentRegisterData]);

    const currentPagination = useMemo(() => {
        return pagination || {};
    }, [pagination]);

    const hasRegisterData = tableData.length > 0;

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

    const getPayload = useCallback(
        (
            exportType: "pdf" | "excel" | "" = "",
            selectedColumns: string[] = []
        ) => {
            const isExport = Boolean(exportType);

            const customCodes = JSON.parse(
                customCodesKey
            ) as string[];

            return {
                fromDate: fromDate ? toLocalStartOfDayUtc(fromDate) : "",
                toDate: toDate ? toLocalEndOfDayUtc(toDate) : "",

                offset: isExport ? 0 : localOffset,
                limit: isExport ? 120000 : localLimit,

                accountCode: account,
                customCodes,

                ...(isExport
                    ? {
                        exportType,
                        selectedColumns,
                    }
                    : {
                        exportType: "" as const,
                    }),
            };
        },
        [
            fromDate,
            toDate,
            localOffset,
            localLimit,
            account,
            customCodesKey,
        ]
    );

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
       LOAD DYNAMIC REGISTER FILTER CONFIGURATION
    =================================================== */

    useEffect(() => {
        dispatch(
            getRegisterFilterDropdowns(
                "payment"
            )
        );

        return () => {
            dispatch(
                clearRegisterFilterDropdowns()
            );
        };
    }, [dispatch]);

    /* ===================================================
       LOAD OPTIONS FOR EACH DYNAMIC FILTER
    =================================================== */

    useEffect(() => {
        let isMounted = true;

        const loadCustomFilterOptions = async () => {
            if (!customFilters.length) {
                if (isMounted) {
                    setCustomFilterOptions({});
                    setSelectedCustomFilters({});
                }

                return;
            }

            const optionEntries = await Promise.all(
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
                            const customResponse =
                                await professionalAxios.get(
                                    apiPath
                                );

                            const items =
                                customResponse?.data?.data?.items ||
                                customResponse?.data?.items ||
                                customResponse?.data?.data?.data?.items ||
                                customResponse?.data?.records ||
                                [];

                            return [
                                filter.key,
                                mapCustomMasterOptions(
                                    Array.isArray(items)
                                        ? items
                                        : []
                                ),
                            ] as const;
                        } catch (error) {
                            console.log(
                                "Custom payment register filter options failed:",
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
                        (filter: any) => {
                            if (
                                filter?.key &&
                                previous[filter.key]
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
            isMounted = false;
        };
    }, [customFilters]);

    useEffect(() => {
        if (registerFilterDropdownError) {
            console.log(
                "Payment register custom filters failed:",
                registerFilterDropdownError
            );
        }
    }, [registerFilterDropdownError]);

    /* ===================================================
       LOAD PAYMENT REGISTER DATA
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

        const payload = getPayload();

        const requestKey = JSON.stringify({
            ...payload,
            refreshKey,
        });

        if (
            lastRegisterRequestKeyRef.current ===
            requestKey
        ) {
            return;
        }

        lastRegisterRequestKeyRef.current =
            requestKey;

        dispatch(
            addPaymentRegister(
                payload
            )
        );
    }, [
        dispatch,
        fromDate,
        toDate,
        getPayload,
        refreshKey,
    ]);

    /* ===================================================
       PREPARE VIEW TEMPLATE FIELDS
    =================================================== */

    useEffect(() => {
        const prepareViewFields = async () => {
            if (!transactionsSchema) return;

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

            if (!hasSchema) return;

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
                    "Failed to prepare payment view fields",
                    error
                );
            }
        };

        prepareViewFields();
    }, [transactionsSchema]);

    /* ===================================================
       VIEW FOOTER DATA
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
            viewTemplateFields?.footer ||
            []
        )
            .filter(
                (field: any) =>
                    !field.isHidden
            )
            .map((field: any) => {
                const rawValue =
                    viewFooterTotals?.[
                    field.key as keyof typeof viewFooterTotals
                    ] ??
                    "0.00";

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
        const hiddenBodyKeys = [
            "references",
            "reference",
            "remarks",
            "remark",
            "payRemark",
        ];

        const filteredBody =
            (
                viewTemplateFields?.body ||
                []
            ).filter(
                (field: any) =>
                    !hiddenBodyKeys.includes(
                        String(
                            field?.key ||
                            ""
                        ).toLowerCase()
                    )
            );

        return {
            ...viewTemplateFields,
            body: filteredBody,
            footer: viewFooterArray,
        };
    }, [
        viewTemplateFields,
        viewFooterArray,
    ]);

    /* ===================================================
       HANDLERS
    =================================================== */

    const handleRefresh = () => {
        if (!validateDates()) return;

        setLocalOffset(0);

        setRefreshKey(
            (prev) =>
                prev + 1
        );
    };

    const handleClear = () => {
        setDateError("");
        setFromDate("");
        setToDate("");
        setAccount("");
        setSelectedCustomFilters({});
        setLocalOffset(0);

        setRefreshKey(
            (prev) =>
                prev + 1
        );
    };

    const handleViewVoucher = async (
        row: any
    ) => {
        const voucherNumber =
            row?.payVoucherNumber ||
            row?.paymentVoucherNumber ||
            row?.voucherNumber ||
            "";

        if (!voucherNumber) {
            console.log(
                "Payment voucher number missing:",
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
                    "payment"
                ) as any
            );

            const res = await dispatch(
                getByVoucherNumberPayment({
                    voucherNumber,
                }) as any
            ).unwrap();

            const record =
                getVoucherRecordFromResponse(
                    res,
                    voucherNumber
                );

            if (!record) {
                console.log(
                    "Payment not found:",
                    voucherNumber,
                    res
                );

                setViewForm({});
                return;
            }

            setViewForm(
                normalizePaymentForView(
                    record
                )
            );
        } catch (error) {
            console.log(
                "Payment register view failed",
                error
            );

            setViewForm({});
        } finally {
            setViewLoading(false);
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

    const closeExportModal = () => {
        setExportModalVisible(false);
    };

    const openExportPicker = async (
        type: "pdf" | "excel"
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
            setExportType(type);
            setExportColumnsLoading(true);

            const response =
                await professionalAxios.get(
                    "/eTaxSolnMongoApiBackend/users/bookez/registers/exportColumns",
                    {
                        params: {
                            module:
                                "payment",
                        },
                    }
                );

            const data =
                response?.data?.data ??
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
                        (column: any) =>
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

            setSelectedExportColumns(
                system.map(
                    (column: any) =>
                        column.key
                )
            );

            setExportModalVisible(
                true
            );
        } catch (error) {
            console.log(
                "Payment register export columns failed",
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

        const currentExportType =
            exportType;

        const selectedColumns =
            [...columns];

        setExportModalVisible(false);

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

            const res = await dispatch(
                addPaymentRegister(
                    getPayload(
                        currentExportType,
                        selectedColumns
                    )
                )
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    currentExportType ===
                        "pdf"
                        ? "payment-register.pdf"
                        : "payment-register.xlsx"
                );
            }
        } catch (error: any) {
            console.log(
                `Payment register ${currentExportType.toUpperCase()} download failed`,
                error
            );

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                `Failed to download ${currentExportType.toUpperCase()}`
            );
        } finally {
            setPdfLoading(false);
            setExcelLoading(false);
        }
    };

    const handleDownloadPdf = () =>
        openExportPicker(
            "pdf"
        );

    const handleDownloadExcel = () =>
        openExportPicker(
            "excel"
        );

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Payment Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate,
                        onChange: (value) => {
                            setFromDate(value || "");
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate,
                        onChange: (value) => {
                            setToDate(value || "");
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                    {
                        key: "account",
                        type: "select",
                        label: "Account",
                        placeholder:
                            "Account",
                        value:
                            account,
                        options:
                            accountOptions,
                        onChange: (
                            value
                        ) => {
                            setAccount(
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
                gridCols="3"
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
                emptyMessage="No payment register data found"
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
                title="View Payment"
                subtitle="View payment details"
                loading={
                    viewLoading
                }
                contentLoading={
                    viewLoading
                }
                onClose={() => {
                    setViewModal(false);
                    setViewForm({});
                    setViewErrors({});
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
                bodyKey="payBody"
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

export default PaymentRegister;