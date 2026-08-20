import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";


import {
    clearRegisterFilterDropdowns,
} from "../../../redux/slices/professionalSlice/registerModule";

import professionalAxios from "../../../services/professionalAxios";
import {
    toLocalEndOfDayUtc,
    toLocalStartOfDayUtc,
} from "../../../utils/helperFunctions";
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
// const REGISTER_MODULE = "openingBalance";

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
    return String(
        row?.openingBalVoucherNumber ||
        row?.voucherno ||
        ""
    ).trim();
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





const getRemark = (row: any): string => {
    return String(
        row?.openingBalRemark ??
        row?.opBalRemark ??
        row?.openingBalanceRemark ??
        row?.oBalRemark ??
        row?.remark ??
        row?.remarks ??
        "-"
    );
};

const getStatus = (row: any): string => {
    return String(row?.openingBalStatus || "-");
};



const getEntries = (row: any): any[] => {
    if (Array.isArray(row?.openingBalBody)) {
        return row.openingBalBody;
    }

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


/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "openingBalVoucherNumber",
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

    {
        key: "accountName",
        title: "Account Name",
        render: (row: any) => {
            const entries = getEntries(row);

            if (!entries.length) {
                return "-";
            }

            return (
                <div className="flex flex-col gap-1">
                    {entries.map((item: any, index: number) => (
                        <div key={`${item?.id || index}-account`}>
                            <span className="font-medium text-card-foreground">
                                {item?.accountName || "-"}
                            </span>

                            <br />

                            <span className="text-sm text-muted-foreground">
                                {item?.accountCode || item?.account || "-"}
                            </span>
                        </div>
                    ))}
                </div>
            );
        },
    },
    {
        key: "debit",
        title: "Debit",
        render: (row: any) => {
            const entries = getEntries(row);

            if (!entries.length) {
                return "₹0.00";
            }

            return (
                <div className="flex flex-col gap-1">
                    {entries.map((item: any, index: number) => (
                        <span
                            key={`${item?.id || index}-debit`}
                            className="whitespace-nowrap font-semibold text-card-foreground"
                        >
                            ₹{formatAmount(item?.debit || 0)}
                        </span>
                    ))}
                </div>
            );
        },
    },
    {
        key: "credit",
        title: "Credit",
        render: (row: any) => {
            const entries = getEntries(row);

            if (!entries.length) {
                return "₹0.00";
            }

            return (
                <div className="flex flex-col gap-1">
                    {entries.map((item: any, index: number) => (
                        <span
                            key={`${item?.id || index}-credit`}
                            className="whitespace-nowrap font-semibold text-card-foreground"
                        >
                            ₹{formatAmount(item?.credit || 0)}
                        </span>
                    ))}
                </div>
            );
        },
    },
    // {
    //     key: "reference",
    //     title: "Reference",
    //     render: (row: any) => {
    //         const entries = getEntries(row);

    //         if (!entries.length) {
    //             return "-";
    //         }

    //         return (
    //             <div className="flex flex-col gap-1">
    //                 {entries.map((item: any, index: number) => (
    //                     <span
    //                         key={`${item?.id || index}-reference`}
    //                         className="font-medium text-card-foreground"
    //                     >
    //                         {item?.reference ?? "-"}
    //                     </span>
    //                 ))}
    //             </div>
    //         );
    //     },
    // },
    // {
    //     key: "remarks",
    //     title: "Remarks",
    //     render: (row: any) => {
    //         const entries = getEntries(row);

    //         if (!entries.length) {
    //             return "-";
    //         }

    //         return (
    //             <div className="flex flex-col gap-1">
    //                 {entries.map((item: any, index: number) => (
    //                     <span
    //                         key={`${item?.id || index}-remarks`}
    //                         className="font-medium text-card-foreground"
    //                     >
    //                         {item?.remarks ?? item?.remark ?? "-"}
    //                     </span>
    //                 ))}
    //             </div>
    //         );
    //     },
    // },

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
    },
];


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

    const [dateError, setDateError] =
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


    /* ===================================================
       REDUX SELECTORS
    =================================================== */

    const { accounts = [] } = useSelector(
        (state: any) =>
            state.accountMaster || {}
    );

    const {
        openingBalanceData = [],
        openingBalances = [],
        openingBalanceLoading = false,
        openingBalancePagination = {},
        pagination: openingBalancePaginationFallback = {},
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
        if (Array.isArray(openingBalanceData)) {
            return openingBalanceData;
        }

        if (Array.isArray(openingBalanceData?.openingBalances)) {
            return openingBalanceData.openingBalances;
        }

        if (Array.isArray(openingBalances)) {
            return openingBalances;
        }

        return [];
    }, [
        openingBalanceData,
        openingBalances,
    ]);

    const currentPagination = useMemo(() => {
        return (
            openingBalancePagination ||
            openingBalanceData?.pagination ||
            openingBalancePaginationFallback ||
            {}
        );
    }, [
        openingBalancePagination,
        openingBalanceData,
        openingBalancePaginationFallback,
    ]);

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
            | "" = ""
    ) => {
        const isExport = Boolean(
            requestedExportType
        );

        return {
            accountCode: account,

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

            exportType:
                requestedExportType,
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
        if ((fromDate && !toDate) || (!fromDate && toDate)) return;

        if (
            fromDate &&
            toDate &&
            new Date(fromDate).getTime() > new Date(toDate).getTime()
        ) {
            return;
        }

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
       VIEW DATA
    =================================================== */

    const viewTotalDebit = useMemo(() => {
        return (viewForm?.openingBalBody || []).reduce(
            (sum: number, item: any) => sum + Number(item?.debit || 0),
            0
        );
    }, [viewForm?.openingBalBody]);

    const viewTotalCredit = useMemo(() => {
        return (viewForm?.openingBalBody || []).reduce(
            (sum: number, item: any) => sum + Number(item?.credit || 0),
            0
        );
    }, [viewForm?.openingBalBody]);

    const viewInputData = useMemo(() => ({
        header: [
            { key: "voucherno", label: "Voucher No", type: "text", disabled: true },
            { key: "openingBalDate", label: "Date", type: "date", disabled: true },
            { key: "remark", label: "Remark", type: "textarea", required: false, colSpan: "full", disabled: true },
        ],
        body: [
            { key: "accountCode", title: "Account", type: "select", width: "260px", required: true, options: accountOptions, disabled: true },
            { key: "debit", title: "Debit", type: "number", width: "150px", align: "right", disabled: true },
            { key: "credit", title: "Credit", type: "number", width: "150px", align: "right", disabled: true },
            { key: "reference", title: "Reference", type: "text", width: "200px", disabled: true },
            { key: "remarks", title: "Remarks", type: "text", width: "250px", disabled: true },
        ],
        footer: [
            { key: "totalDebit", label: "Total Debit", value: `₹${viewTotalDebit.toFixed(2)}`, rawValue: viewTotalDebit, align: "right" },
            { key: "totalCredit", label: "Total Credit", value: `₹${viewTotalCredit.toFixed(2)}`, rawValue: viewTotalCredit, align: "right" },
        ],
    }), [accountOptions, viewTotalDebit, viewTotalCredit]);

    /* ===================================================
       FILTER HANDLERS
    =================================================== */

    const handleRefresh = () => {
        if (!validateDates()) return;

        setLocalOffset(0);

        setRefreshKey(
            (previous) => previous + 1
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
            (previous) => previous + 1
        );
    };

    /* ===================================================
       VIEW HANDLER
    =================================================== */

    const handleViewVoucher = (row: any) => {
        const body =
            Array.isArray(row?.openingBalBody) && row.openingBalBody.length > 0
                ? row.openingBalBody.map((item: any, index: number) => ({
                    ...item,
                    id: item?.id || `${Date.now()}-${index}`,
                    accountCode: item?.accountCode || item?.account || "",
                    account: item?.accountCode || item?.account || "",
                    accountName: item?.accountName || "",
                    debit:
                        item?.debit ?? "",
                    credit:
                        item?.credit ?? "",
                    reference:
                        item?.reference ?? "",
                    remarks:
                        item?.remarks ??
                        item?.remark ??
                        "",
                }))
                : getEntries(row).map((item: any, index: number) => ({
                    ...item,
                    id: item?.id || `${Date.now()}-${index}`,
                    accountCode: getAccountCode(item),
                    account: getAccountCode(item),
                    accountName: getAccountName(item) === "-" ? "" : getAccountName(item),
                    debit: getDebitAmount(item) || "",
                    credit: getCreditAmount(item) || "",
                    reference: item?.reference || "",
                    remarks: getRemark(item) === "-" ? "" : getRemark(item),
                }));

        setViewErrors({});
        setViewForm({
            ...row,
            voucherno:
                row?.openingBalVoucherNumber ||
                getVoucherNumber(row) ||
                row?.voucherno ||
                "OPBAL",
            openingBalVoucherNumber:
                row?.openingBalVoucherNumber ||
                getVoucherNumber(row) ||
                "",
            openingBalDate:
                row?.openingBalDate ||
                getVoucherDate(row) ||
                "",
            remark:
                row?.openingBalRemark ??
                row?.remark ??
                row?.remarks ??
                "",
            openingBalRemark:
                row?.openingBalRemark ??
                row?.remark ??
                row?.remarks ??
                "",
            openingBalStatus: row?.openingBalStatus || getStatus(row) || "",
            openingBalBody: body,
            openingBalFooter: {
                ...(row?.openingBalFooter || {}),
                totalDebit:
                    row?.openingBalFooter?.totalDebit ??
                    body.reduce(
                        (sum: number, item: any) =>
                            sum + Number(item?.debit || 0),
                        0
                    ),
                totalCredit:
                    row?.openingBalFooter?.totalCredit ??
                    body.reduce(
                        (sum: number, item: any) =>
                            sum + Number(item?.credit || 0),
                        0
                    ),
            },
        });
        setViewLoading(false);
        setViewModal(true);
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

    const handleExportDownload = async (
        requestedType: ExportType
    ) => {
        if (
            !hasRegisterData ||
            pdfLoading ||
            excelLoading ||
            !validateDates()
        ) {
            return;
        }

        try {
            if (requestedType === "pdf") {
                setPdfLoading(true);
            } else {
                setExcelLoading(true);
            }

            const response =
                await dispatch(
                    getOpeningBalanceRegister(
                        getPayload(
                            requestedType
                        )
                    )
                ).unwrap();

            if (response?.blob) {
                downloadBlobFile(
                    response.blob,
                    requestedType === "pdf"
                        ? "opening-balance-register.pdf"
                        : "opening-balance-register.xlsx"
                );
            }
        } catch (error: any) {
            console.log(
                `Opening balance register ${requestedType.toUpperCase()} download failed:`,
                error
            );

            toast.error(
                error?.message ||
                `Failed to download ${requestedType.toUpperCase()}`
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
                gridCols="3"
                onSearch={handleRefresh}
                onClear={handleClear}
                onDownloadPdf={() =>
                    handleExportDownload("pdf")
                }
                onDownloadExcel={() =>
                    handleExportDownload("excel")
                }
                pdfDisabled={
                    !hasRegisterData ||
                    pdfLoading ||
                    excelLoading
                }
                excelDisabled={
                    !hasRegisterData ||
                    excelLoading ||
                    pdfLoading
                }
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
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
                            handleViewVoucher(row);
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



            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={false}
                title="View Opening Balance"
                subtitle="Opening balance details"
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
                bodyKey="openingBalBody"
                handleChange={() => { }}
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