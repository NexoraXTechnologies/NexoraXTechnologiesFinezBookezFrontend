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


import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";

import {
    clearRegisterFilterDropdowns,
} from "../../../redux/slices/professionalSlice/registerModule";

import professionalAxios from "../../../services/professionalAxios";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";
import { getOpeningBalanceRegister } from "../../../redux/slices/professionalSlice/register";

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
const REGISTER_MODULE = "openingBalance";

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
                item?.accountName ||
                item?.code ||
                ""
            ).trim(),

            value: String(
                item?.code ||
                item?.value ||
                item?.accountCode ||
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
   OPENING BALANCE FIELD HELPERS
=================================================== */

const getVoucherNumber = (row: any): string => {
    return String(row?.voucherno || "").trim();
};

const getVoucherDate = (row: any): any => {
    return (
        row?.openingBalDate ||
        row?.openingBalanceVoucherDate ||
        row?.oBalVoucherDate ||
        row?.voucherDate ||
        row?.date ||
        row?.openingDate ||
        ""
    );
};

const getAccountCode = (row: any): string => {
    return String(
        row?.opBalAccountCode ||
        row?.openingBalanceAccountCode ||
        row?.oBalAccountCode ||
        row?.accountCode ||
        row?.ledgerCode ||
        ""
    ).trim();
};

const getAccountName = (row: any): string => {
    return String(
        row?.opBalAccountName ||
        row?.openingBalanceAccountName ||
        row?.oBalAccountName ||
        row?.accountName ||
        row?.ledgerName ||
        "-"
    ).trim();
};

const getBalanceType = (row: any): string => {
    const directType =
        row?.opBalBalanceType ||
        row?.openingBalanceType ||
        row?.oBalBalanceType ||
        row?.balanceType ||
        row?.drCr ||
        row?.debitCredit ||
        row?.type;

    if (directType) {
        return String(directType);
    }

    const debitAmount = getDebitAmount(row);
    const creditAmount = getCreditAmount(row);

    if (debitAmount > 0) {
        return "Debit";
    }

    if (creditAmount > 0) {
        return "Credit";
    }

    return "-";
};

const getOpeningAmount = (row: any): number => {
    return toNumber(
        row?.opBalAmount ??
        row?.openingBalanceAmount ??
        row?.oBalAmount ??
        row?.openingAmount ??
        row?.balanceAmount ??
        row?.amount ??
        0
    );
};

const getDebitAmount = (row: any): number => {
    const directDebit = toNumber(
        row?.opBalDebitAmount ??
        row?.openingBalanceDebitAmount ??
        row?.oBalDebitAmount ??
        row?.debitAmount ??
        row?.debit ??
        0
    );

    if (directDebit > 0) {
        return directDebit;
    }

    const type = normalizeStatus(
        row?.opBalBalanceType ||
        row?.openingBalanceType ||
        row?.oBalBalanceType ||
        row?.balanceType ||
        row?.drCr ||
        row?.debitCredit ||
        ""
    );

    if (
        type === "debit" ||
        type === "dr"
    ) {
        return getOpeningAmount(row);
    }

    return 0;
};

const getCreditAmount = (row: any): number => {
    const directCredit = toNumber(
        row?.opBalCreditAmount ??
        row?.openingBalanceCreditAmount ??
        row?.oBalCreditAmount ??
        row?.creditAmount ??
        row?.credit ??
        0
    );

    if (directCredit > 0) {
        return directCredit;
    }

    const type = normalizeStatus(
        row?.opBalBalanceType ||
        row?.openingBalanceType ||
        row?.oBalBalanceType ||
        row?.balanceType ||
        row?.drCr ||
        row?.debitCredit ||
        ""
    );

    if (
        type === "credit" ||
        type === "cr"
    ) {
        return getOpeningAmount(row);
    }

    return 0;
};

const getNetBalance = (row: any): number => {
    const directBalance = row?.netBalance;

    if (
        directBalance !== undefined &&
        directBalance !== null &&
        directBalance !== ""
    ) {
        return toNumber(directBalance);
    }

    const debitAmount = getDebitAmount(row);
    const creditAmount = getCreditAmount(row);

    return debitAmount - creditAmount;
};

const getRemark = (row: any): string => {
    return String(
        row?.opBalRemark ||
        row?.openingBalanceRemark ||
        row?.oBalRemark ||
        row?.remark ||
        row?.remarks ||
        "-"
    );
};

const getStatus = (row: any): string => {
    return String(row?.openingBalStatus || "-");
};

const getDocumentStatus = (row: any): string => {
    return String(
        row?.opBalDocStatus ||
        row?.openingBalanceDocStatus ||
        row?.oBalDocStatus ||
        row?.documentStatus ||
        row?.docStatus ||
        "-"
    );
};

const getEntries = (row: any): any[] => {
    if (Array.isArray(row?.opBalBody)) {
        return row.opBalBody;
    }

    if (Array.isArray(row?.openingBalanceBody)) {
        return row.openingBalanceBody;
    }

    if (Array.isArray(row?.oBalBody)) {
        return row.oBalBody;
    }

    if (Array.isArray(row?.entries)) {
        return row.entries;
    }

    if (Array.isArray(row?.items)) {
        return row.items;
    }

    if (getAccountCode(row) || getAccountName(row) !== "-") {
        return [row];
    }

    return [];
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

// const getDocumentStatusClass = (
//     value: any
// ): string => {
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

// const getBalanceTypeClass = (
//     value: any
// ): string => {
//     const type = normalizeStatus(value);

//     if (
//         type === "debit" ||
//         type === "dr"
//     ) {
//         return "bg-primary/10 text-primary";
//     }

//     if (
//         type === "credit" ||
//         type === "cr"
//     ) {
//         return "bg-success/10 text-success";
//     }

//     return "bg-muted text-muted-foreground";
// };

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "voucherno",
        title: "Voucher Number",

        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getVoucherNumber(row) || "-"}
            </span>
        ),
    },
    {
        key: "openingBalDate",
        title: "Opening Balance Date",

        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {formatDate(getVoucherDate(row))}
            </span>
        ),
    },
    // {
    //     key: "accountName",
    //     title: "Account",

    //     render: (row: any) => (
    //         <div className="flex flex-col">
    //             <span className="font-semibold text-card-foreground">
    //                 {getAccountName(row)}
    //             </span>

    //             <span className="text-xs text-muted-foreground">
    //                 {getAccountCode(row) || "-"}
    //             </span>
    //         </div>
    //     ),
    // },
    // {
    //     key: "balanceType",
    //     title: "Balance Type",

    //     render: (row: any) => {
    //         const balanceType = getBalanceType(row);

    //         return (
    //             <span
    //                 className={`
    //                     inline-flex rounded-full px-3 py-1
    //                     text-xs font-bold uppercase
    //                     ${getBalanceTypeClass(balanceType)}
    //                 `}
    //             >
    //                 {balanceType}
    //             </span>
    //         );
    //     },
    // },
    {
        key: "debitAmount",
        title: "Debit Amount",

        render: (row: any) => (
            <span className="whitespace-nowrap font-semibold text-card-foreground">
                ₹{formatAmount(getDebitAmount(row))}
            </span>
        ),
    },
    {
        key: "creditAmount",
        title: "Credit Amount",

        render: (row: any) => (
            <span className="whitespace-nowrap font-semibold text-card-foreground">
                ₹{formatAmount(getCreditAmount(row))}
            </span>
        ),
    },
    {
        key: "netBalance",
        title: "Net Balance",

        render: (row: any) => {
            const netBalance = getNetBalance(row);

            return (
                <span
                    className={`
                        whitespace-nowrap font-bold
                        ${netBalance < 0
                            ? "text-destructive"
                            : "text-foreground"
                        }
                    `}
                >
                    ₹{formatAmount(Math.abs(netBalance))}
                </span>
            );
        },
    },
    {
        key: "openingBalStatus",
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
    }
];

/* ===================================================
   VIEW NORMALIZATION
=================================================== */

const normalizeOpeningBalanceForView = (
    record: any
) => {
    const entries = getEntries(record).map(
        (item: any) => {
            const debitAmount =
                getDebitAmount(item);

            const creditAmount =
                getCreditAmount(item);

            return {
                ...item,

                accountCode:
                    getAccountCode(item),

                accountName:
                    getAccountName(item) === "-"
                        ? ""
                        : getAccountName(item),

                balanceType:
                    getBalanceType(item) === "-"
                        ? ""
                        : getBalanceType(item),

                debitAmount:
                    debitAmount.toFixed(2),

                creditAmount:
                    creditAmount.toFixed(2),

                openingAmount:
                    getOpeningAmount(item).toFixed(2),

                balanceAmount:
                    getOpeningAmount(item).toFixed(2),

                remark:
                    getRemark(item) === "-"
                        ? ""
                        : getRemark(item),

                remarks:
                    getRemark(item) === "-"
                        ? ""
                        : getRemark(item),
            };
        }
    );

    const totalDebitAmount = entries.reduce(
        (total: number, item: any) =>
            total + toNumber(item?.debitAmount),
        0
    );

    const totalCreditAmount = entries.reduce(
        (total: number, item: any) =>
            total + toNumber(item?.creditAmount),
        0
    );

    const netBalance =
        totalDebitAmount - totalCreditAmount;

    return {
        ...record,

        opBalVoucherNumber:
            getVoucherNumber(record),

        openingBalanceVoucherNumber:
            getVoucherNumber(record),

        opBalVoucherDate:
            getVoucherDate(record),

        openingBalanceVoucherDate:
            getVoucherDate(record),

        opBalAccountCode:
            getAccountCode(record),

        openingBalanceAccountCode:
            getAccountCode(record),

        opBalAccountName:
            getAccountName(record) === "-"
                ? ""
                : getAccountName(record),

        openingBalanceAccountName:
            getAccountName(record) === "-"
                ? ""
                : getAccountName(record),

        opBalBalanceType:
            getBalanceType(record) === "-"
                ? ""
                : getBalanceType(record),

        openingBalanceType:
            getBalanceType(record) === "-"
                ? ""
                : getBalanceType(record),

        opBalAmount:
            getOpeningAmount(record).toFixed(2),

        openingBalanceAmount:
            getOpeningAmount(record).toFixed(2),

        opBalDebitAmount:
            getDebitAmount(record).toFixed(2),

        openingBalanceDebitAmount:
            getDebitAmount(record).toFixed(2),

        opBalCreditAmount:
            getCreditAmount(record).toFixed(2),

        openingBalanceCreditAmount:
            getCreditAmount(record).toFixed(2),

        opBalRemark:
            getRemark(record) === "-"
                ? ""
                : getRemark(record),

        openingBalanceRemark:
            getRemark(record) === "-"
                ? ""
                : getRemark(record),

        opBalStatus:
            getStatus(record) === "-"
                ? ""
                : getStatus(record),

        openingBalanceStatus:
            getStatus(record) === "-"
                ? ""
                : getStatus(record),

        opBalDocStatus:
            getDocumentStatus(record) === "-"
                ? ""
                : getDocumentStatus(record),

        openingBalanceDocStatus:
            getDocumentStatus(record) === "-"
                ? ""
                : getDocumentStatus(record),

        entries,

        opBalBody: entries,
        openingBalanceBody: entries,

        totalDebitAmount:
            totalDebitAmount.toFixed(2),

        totalCreditAmount:
            totalCreditAmount.toFixed(2),

        netBalance:
            netBalance.toFixed(2),

        grossAmount:
            getOpeningAmount(record).toFixed(2),

        debitAmount:
            totalDebitAmount.toFixed(2),

        creditAmount:
            totalCreditAmount.toFixed(2),

        netAmount:
            Math.abs(netBalance).toFixed(2),

        balanceAmount:
            Math.abs(netBalance).toFixed(2),

        totalQuantity:
            String(entries.length),
    };
};

/* ===================================================
   COMPONENT
=================================================== */

const OpeningBalanceRegister = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [account, setAccount] =
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

    const {
        openingBalanceData = [],
        openingBalanceLoading = false,
        openingBalancePagination = {},
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
            account ||
            selectedCustomCodes.length
        );
    }, [
        fromDate,
        toDate,
        account,
        selectedCustomCodesKey,
    ]);

    /* ===================================================
       ACCOUNT OPTIONS
    =================================================== */

    const accountOptions = useMemo(() => {
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

    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData = useMemo(() => {
        return Array.isArray(openingBalanceData)
            ? openingBalanceData
            : [];
    }, [openingBalanceData]);

    const currentPagination = useMemo(() => {
        return openingBalancePagination || {};
    }, [openingBalancePagination]);

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
            accountCode: account,

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
       LOAD REGISTER FILTERS
    =================================================== */

    useEffect(() => {
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
                                    "Opening balance custom filter options failed:",
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

    /* ===================================================
       LOAD OPENING BALANCE REGISTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getOpeningBalanceRegister(
                getPayload()
            )
        );
    }, [
        dispatch,
        fromDate,
        toDate,
        account,
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
                        "Failed to prepare opening balance view fields",
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
            totalDebitAmount:
                viewForm?.totalDebitAmount ||
                "0.00",

            totalCreditAmount:
                viewForm?.totalCreditAmount ||
                "0.00",

            debitAmount:
                viewForm?.debitAmount ||
                "0.00",

            creditAmount:
                viewForm?.creditAmount ||
                "0.00",

            grossAmount:
                viewForm?.grossAmount ||
                "0.00",

            netAmount:
                viewForm?.netAmount ||
                "0.00",

            balanceAmount:
                viewForm?.balanceAmount ||
                "0.00",

            netBalance:
                viewForm?.netBalance ||
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
        setAccount("");
        setSelectedCustomFilters({});
        setLocalOffset(0);

        setRefreshKey(
            (previous) => previous + 1
        );
    };

    /* ===================================================
       VIEW HANDLER
    =================================================== */

    const handleViewVoucher = async (row: any) => {
        const voucherNumber = getVoucherNumber(row);
        if (!voucherNumber) {
            console.log("Opening balance voucher number missing:", row);
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
                normalizeOpeningBalanceForView(
                    row
                )
            );
        } catch (error) {
            console.log(
                "Opening balance view failed:",
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
                "Opening balance export columns failed:",
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
                        getOpeningBalanceRegister(
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
                            ? "opening-balance-register.pdf"
                            : "opening-balance-register.xlsx"
                    );
                }
            } catch (error) {
                console.log(
                    `Opening balance register ${currentExportType.toUpperCase()} download failed:`,
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
                title="Opening Balance Register Filters"
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
                        key: "account",
                        type: "select",
                        label: "Account",
                        placeholder:
                            "Select Account",
                        value: account,
                        options:
                            accountOptions,

                        onChange: (
                            value: string
                        ) => {
                            setAccount(value);
                            setLocalOffset(0);
                        },
                    },

                    ...customFilters.map(
                        (
                            filter: CustomFilterDefinition
                        ) => ({
                            key: filter.key,
                            type: "select",

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
                    openingBalanceLoading ||
                    registerFilterDropdownLoading
                }
                emptyMessage="No opening balance register data found"
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
                title="View Opening Balance"
                subtitle="View opening balance details"
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
                bodyKey="entries"
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

export default OpeningBalanceRegister;