import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import RegisterFilterCard from "./RegisterFilterCard";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import Modal from "../../../components/modal";


import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";

import {
    addPurchaseRegister,
} from "../../../redux/slices/professionalSlice/bookEzRegister/purchaseRegisterSlice";


import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberPurchaseInvoiceList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";

import { loadAllTemplateOptions } from "../../../utils/helperFunctions";
import professionalAxios from "../../../services/professionalAxios";
import { Checkbox } from "../../../components/inputs";
import { clearRegisterFilterDropdowns, getRegisterFilterDropdowns } from "../../../redux/slices/professionalSlice/registerModule";

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "pInvVoucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.pInvVoucherNumber || row?.voucherNumber || "-"}
            </span>
        ),
    },
    {
        key: "pInvVoucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate =
                row?.pInvVoucherDate ||
                row?.voucherDate ||
                row?.date;

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
        key: "pInvVendorName",
        title: "Vendor",
        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {row?.pInvVendorName || row?.vendorName || "-"}
                </span>
                <span className="text-xs text-muted-foreground">
                    {row?.pInvVendorCode || row?.vendorCode || "-"}
                </span>
            </div>
        ),
    },
    {
        key: "grnVoucherNumber",
        title: "GRN",
        render: (row: any) => {
            const grnNumber =
                row?.grnVoucherNumber ||
                row?.grnNumber ||
                row?.pInvBody?.[0]?.grnVoucherNumber ||
                row?.products?.[0]?.grnVoucherNumber ||
                "-";

            return (
                <span className="font-medium text-card-foreground">
                    {grnNumber}
                </span>
            );
        },
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) => (
            <span className="font-bold text-foreground">
                ₹{Number(
                    row?.pInvFooter?.netAmount ||
                    row?.pInvFooter?.totalNetAmount ||
                    row?.netAmount ||
                    0
                ).toFixed(2)}
            </span>
        ),
    },
    {
        key: "pInvStatus",
        title: "Status",
        render: (row: any) => {
            const status = row?.pInvStatus || row?.status || "-";
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

    if (res?.purchaseInvoice) return res.purchaseInvoice;
    if (res?.data?.purchaseInvoice) return res.data.purchaseInvoice;

    if (
        res &&
        typeof res === "object" &&
        res?.pInvVoucherNumber === voucherNumber
    ) {
        return res;
    }

    if (
        res?.data &&
        typeof res.data === "object" &&
        res.data?.pInvVoucherNumber === voucherNumber
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
                item?.pInvVoucherNumber === voucherNumber ||
                item?.voucherNumber === voucherNumber
        ) ||
        records[0] ||
        null
    );
};

const normalizePurchaseInvoiceForView = (record: any) => {
    const footer = record?.pInvFooter || {};

    const products = (record?.pInvBody || record?.products || []).map(
        (item: any) => ({
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

            gross: item?.gross || item?.grossAmount || "",
            grossAmount: item?.grossAmount || item?.gross || "",

            discount: item?.discount || item?.discountPercentage || "",
            discountPercentage:
                item?.discountPercentage || item?.discount || "",
            discountAmount: item?.discountAmount || "0.00",

            taxableAmount: item?.taxableAmount || "0.00",

            cgst: item?.cgst || item?.cgstPercentage || "",
            cgstPercentage: item?.cgstPercentage || item?.cgst || "",
            cgstAmount: item?.cgstAmount || "0.00",

            sgst: item?.sgst || item?.sgstPercentage || "",
            sgstPercentage: item?.sgstPercentage || item?.sgst || "",
            sgstAmount: item?.sgstAmount || "0.00",

            igst: item?.igst || item?.igstPercentage || "",
            igstPercentage: item?.igstPercentage || item?.igst || "",
            igstAmount: item?.igstAmount || "0.00",

            taxAmount: item?.taxAmount || "0.00",
            otherAmount: item?.otherAmount || "0.00",

            netAmount: item?.netAmount || item?.netTotal || "",
            netTotal: item?.netTotal || item?.netAmount || "",
        })
    );

    return {
        ...record,

        pInvVoucherNumber:
            record?.pInvVoucherNumber || record?.voucherNumber || "",

        pInvVoucherDate:
            record?.pInvVoucherDate || record?.voucherDate || "",

        pInvVendorCode:
            record?.pInvVendorCode ||
            record?.vendorCode ||
            record?.accountCode ||
            "",

        pInvVendorName:
            record?.pInvVendorName ||
            record?.vendorName ||
            record?.accountName ||
            "",

        pInvStatus:
            record?.pInvStatus || record?.status || "open",

        pInvRemark:
            record?.pInvRemark || record?.remark || "",

        products,
        pInvBody: products,

        grossAmount:
            footer?.grossAmount || footer?.totalGrossAmount || "0.00",

        discountAmount:
            footer?.discountAmount || footer?.totalDiscountAmount || "0.00",

        cgstAmount:
            footer?.cgstAmount || footer?.totalCgstAmount || "0.00",

        sgstAmount:
            footer?.sgstAmount || footer?.totalSgstAmount || "0.00",

        igstAmount:
            footer?.igstAmount || footer?.totalIgstAmount || "0.00",

        taxAmount:
            footer?.taxAmount || footer?.totalTaxAmount || "0.00",

        otherAmount:
            footer?.otherAmount || footer?.totalOtherAmount || "0.00",

        netAmount:
            footer?.netAmount || footer?.totalNetAmount || "0.00",

        adjustedAmount:
            footer?.adjustedAmount || "0.00",

        balanceAmount:
            footer?.balanceAmount ||
            footer?.netAmount ||
            footer?.totalNetAmount ||
            "0.00",

        totalQuantity:
            footer?.totalQuantity || "0",
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

const mapCustomMasterOptions = (items: any[]): DropdownOption[] => {
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
        .filter((item: DropdownOption) => item.label && item.value);
};

/* ===================================================
   COMPONENT
=================================================== */

const PurchaseRegister = () => {
    const dispatch = useDispatch<any>();

    /*
     * Prevents the same register request from being dispatched more than once.
     * This also avoids React Strict Mode's duplicate development-only effect run.
     */
    const lastRegisterRequestKeyRef = useRef<string>("");

    /* ===================================================
       FILTER STATES
       Blank dates = no default filter.
    =================================================== */

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [vendor, setVendor] = useState<string>("");

    const [customFilterOptions, setCustomFilterOptions] = useState<
        Record<string, DropdownOption[]>
    >({});
    const [selectedCustomFilters, setSelectedCustomFilters] = useState<
        Record<string, string>
    >({});

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [refreshKey, setRefreshKey] = useState(0);

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [exportType, setExportType] = useState<"pdf" | "excel" | null>(null);
    const [exportColumnsLoading, setExportColumnsLoading] = useState(false);
    const [systemColumns, setSystemColumns] = useState<any[]>([]);
    const [customColumns, setCustomColumns] = useState<any[]>([]);
    const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([]);

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
        purchaseRegisterData = [],
        addLoader = false,
        pagination = {},
    } = useSelector((state: any) => state.purchaseRegister);

    const {
        filters: registerFilterDropdowns = [],
        loading: registerFilterDropdownLoading = false,
        error: registerFilterDropdownError = null,
    } = useSelector(
        (state: any) => state.registerFilterDropdown || {}
    );

    const customFilters:any = useMemo<CustomFilterDefinition[]>(() => {
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
            .map((filter:any) => selectedCustomFilters[filter.key] || "")
            .filter(Boolean);
    }, [customFilters, selectedCustomFilters]);

    /*
     * Use a primitive dependency instead of the selectedCustomCodes array.
     * When custom-filter definitions load but no value is selected, this
     * remains '[""]', so the register API is not called again unnecessarily.
     */
    const customCodesKey = useMemo(() => {
        return JSON.stringify(
            selectedCustomCodes.length ? selectedCustomCodes : [""]
        );
    }, [selectedCustomCodes]);

    const hasAnyFilter = useMemo(() => {
        return Boolean(
            fromDate ||
            toDate ||
            vendor ||
            selectedCustomCodes.length
        );
    }, [fromDate, toDate, vendor, selectedCustomCodes.length]);

    /* ===================================================
       OPTIONS
    =================================================== */

    const vendorOptions = useMemo(() => {
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
        return Array.isArray(purchaseRegisterData)
            ? purchaseRegisterData
            : [];
    }, [purchaseRegisterData]);

    const currentPagination = useMemo(() => {
        return pagination || {};
    }, [pagination]);

    /* ===================================================
       PAYLOAD
    =================================================== */

    const getPayload = useCallback(
        (
            exportType: "pdf" | "excel" | "" = "",
            selectedColumns: string[] = []
        ) => {
            const isExport = Boolean(exportType);
            const customCodes = JSON.parse(customCodesKey) as string[];

            return {
                fromDate,
                toDate,
                offset: isExport ? 0 : localOffset,
                limit: isExport ? 120000 : localLimit,
                vendorCode: vendor,
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
            vendor,
            customCodesKey,
        ]
    );

    /* ===================================================
       LOAD VENDOR MASTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                search: "",
                accountType: "vendor",
            })
        );
    }, [dispatch]);

    useEffect(() => {
        dispatch(getRegisterFilterDropdowns("purchaseInvoice"));
        return () => {
            dispatch(clearRegisterFilterDropdowns());
        };
    }, [dispatch]);

    useEffect(() => {
        let isMounted = true;
        const loadCustomFilterOptions = async () => {
            if (!customFilters.length) {
                setCustomFilterOptions({});
                setSelectedCustomFilters({});
                return;
            }

            const optionEntries = await Promise.all(
                customFilters.map(
                    async (filter: CustomFilterDefinition) => {
                        const apiPath = resolveProfessionalApiPath(
                            filter?.api || ""
                        );

                        if (!filter?.key || !apiPath) {
                            return [filter?.key || "", []] as const;
                        }

                        try {
                            const customResponse =
                                await professionalAxios.get(apiPath);

                            const items =
                                customResponse?.data?.data?.items ||
                                customResponse?.data?.items ||
                                customResponse?.data?.data?.data?.items ||
                                customResponse?.data?.records ||
                                [];

                            return [
                                filter.key,
                                mapCustomMasterOptions(
                                    Array.isArray(items) ? items : []
                                ),
                            ] as const;
                        } catch (error) {
                            console.log(
                                "Custom purchase register filter options failed:",
                                filter?.key,
                                error
                            );

                            return [filter.key, []] as const;
                        }
                    }
                )
            );

            if (!isMounted) return;

            setCustomFilterOptions(
                Object.fromEntries(
                    optionEntries.filter(([key]) => Boolean(key))
                )
            );

            setSelectedCustomFilters((previous) => {
                const nextSelected: Record<string, string> = {};

                customFilters.forEach((filter:any) => {
                    if (filter?.key && previous[filter.key]) {
                        nextSelected[filter.key] = previous[filter.key];
                    }
                });

                return nextSelected;
            });
        };

        loadCustomFilterOptions();

        return () => {
            isMounted = false;
        };
    }, [customFilters]);

    useEffect(() => {
        if (registerFilterDropdownError) {
            console.log(
                "Purchase register custom filter dropdowns failed:",
                registerFilterDropdownError
            );
        }
    }, [registerFilterDropdownError]);

    useEffect(() => {
        const payload = getPayload();

        /*
         * refreshKey is included so the Search/Refresh button can intentionally
         * repeat the same request. Otherwise identical effect executions are
         * ignored.
         */
        const requestKey = JSON.stringify({
            ...payload,
            refreshKey,
        });

        if (lastRegisterRequestKeyRef.current === requestKey) {
            return;
        }

        lastRegisterRequestKeyRef.current = requestKey;
        dispatch(addPurchaseRegister(payload));
    }, [dispatch, getPayload, refreshKey]);

    useEffect(() => {
        const prepareViewFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema =
                Array.isArray(transactionsSchema?.header) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                const updatedData = await loadAllTemplateOptions(
                    transactionsSchema
                );

                setViewTemplateFields(updatedData);
            } catch (error) {
                console.log("Failed to prepare purchase invoice view fields", error);
            }
        };

        prepareViewFields();
    }, [transactionsSchema]);

    const viewFooterTotals = useMemo(() => {
        return {
            grossAmount: viewForm?.grossAmount || "0.00",
            discountAmount: viewForm?.discountAmount || "0.00",
            cgstAmount: viewForm?.cgstAmount || "0.00",
            sgstAmount: viewForm?.sgstAmount || "0.00",
            igstAmount: viewForm?.igstAmount || "0.00",
            taxAmount: viewForm?.taxAmount || "0.00",
            otherAmount: viewForm?.otherAmount || "0.00",
            netAmount: viewForm?.netAmount || "0.00",
            adjustedAmount: viewForm?.adjustedAmount || "0.00",
            balanceAmount: viewForm?.balanceAmount || "0.00",
            totalQuantity: viewForm?.totalQuantity || "0",
        };
    }, [viewForm]);

    const viewFooterArray = useMemo(() => {
        return (viewTemplateFields?.footer || []).filter((field: any) => !field.isHidden).map((field: any) => {
            const rawValue = viewFooterTotals?.[field.key as keyof typeof viewFooterTotals] ?? "0.00";
            return { ...field, value: rawValue, rawValue, };
        });
    }, [viewTemplateFields?.footer, viewFooterTotals]);

    const viewInputData = useMemo(() => {
        return {
            ...viewTemplateFields,
            footer: viewFooterArray,
        };
    }, [viewTemplateFields, viewFooterArray]);

    /* ===================================================
       HANDLERS
    =================================================== */

    const handleRefresh = () => {
        setLocalOffset(0);
        setRefreshKey((prev) => prev + 1);
    };

    const handleClear = () => {
        setFromDate("");
        setToDate("");
        setVendor("");
        setSelectedCustomFilters({});
        setLocalOffset(0);
        setRefreshKey((prev) => prev + 1);
    };

    const handleViewVoucher = async (row: any) => {
        const voucherNumber =
            row?.pInvVoucherNumber || row?.voucherNumber || "";

        if (!voucherNumber) {
            console.log("Purchase invoice voucher number missing:", row);
            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});

            await dispatch(getAllTransactionSchema("purchaseInvoice") as any);

            const res = await dispatch(
                getByVoucherNumberPurchaseInvoiceList({
                    voucherNumber,
                }) as any
            ).unwrap();

            const record = getVoucherRecordFromResponse(res, voucherNumber);

            if (!record) {
                console.log("Purchase invoice not found:", voucherNumber, res);
                setViewForm({});
                return;
            }

            setViewForm(normalizePurchaseInvoiceForView(record));
        } catch (error) {
            console.log("Purchase register view invoice failed", error);
            setViewForm({});
        } finally {
            setViewLoading(false);
        }
    };

    const downloadBlobFile = (blob: Blob, fileName: string) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const closeExportModal = () => {
        setExportModalVisible(false);
        setExportType(null);
        setSystemColumns([]);
        setCustomColumns([]);
        setSelectedExportColumns([]);
    };

    const openExportPicker = async (type: "pdf" | "excel") => {
        if (!hasAnyFilter || exportColumnsLoading || pdfLoading || excelLoading) {
            return;
        }

        try {
            setExportType(type);
            setExportColumnsLoading(true);

            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/registers/exportColumns",
                {
                    params: {
                        module: "purchaseInvoice",
                    },
                }
            );

            const data = response?.data?.data ?? response?.data ?? {};
            const system = dedupeColumns(data?.systemColumns || []);
            const custom = dedupeColumns(
                (data?.customColumns || []).filter(
                    (column: any) =>
                        !system.some(
                            (systemColumn: any) =>
                                systemColumn?.key === column?.key
                        )
                )
            );

            setSystemColumns(system);
            setCustomColumns(custom);
            setSelectedExportColumns(
                system.map((column: any) => column.key)
            );
            setExportModalVisible(true);
        } catch (error) {
            console.log("Purchase register export columns failed", error);
            setExportType(null);
        } finally {
            setExportColumnsLoading(false);
        }
    };

    const toggleExportColumn = (key: string) => {
        setSelectedExportColumns((previous) =>
            previous.includes(key)
                ? previous.filter((item) => item !== key)
                : [...previous, key]
        );
    };

    const setSectionSelection = (columns: any[], selected: boolean) => {
        const keys = columns.map((column: any) => column.key);

        setSelectedExportColumns((previous) => {
            const withoutSection = previous.filter(
                (key) => !keys.includes(key)
            );

            return selected
                ? [...withoutSection, ...keys]
                : withoutSection;
        });
    };

    const performExportDownload = async () => {
        if (!exportType || !selectedExportColumns.length) return;
        const currentExportType = exportType;
        const columns = [...selectedExportColumns];
        closeExportModal();

        try {
            if (currentExportType === "pdf") {
                setPdfLoading(true);
            } else {
                setExcelLoading(true);
            }

            const res = await dispatch(
                addPurchaseRegister(
                    getPayload(currentExportType, columns)
                )
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    currentExportType === "pdf"
                        ? "purchase-register.pdf"
                        : "purchase-register.xlsx"
                );
            }
        } catch (error) {
            console.log(
                `Purchase register ${currentExportType.toUpperCase()} download failed`,
                error
            );
        } finally {
            setPdfLoading(false);
            setExcelLoading(false);
        }
    };
    const handleDownloadPdf = () => openExportPicker("pdf");
    const handleDownloadExcel = () => openExportPicker("excel");

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Purchase Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate,
                        onChange: (value) => {
                            setFromDate(value);
                            setLocalOffset(0);
                        },
                        required: false,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate,
                        onChange: (value) => {
                            setToDate(value);
                            setLocalOffset(0);
                        },
                        required: false,
                    },
                    {
                        key: "vendor",
                        type: "select",
                        label: "Vendor",
                        placeholder: "Vendor",
                        value: vendor,
                        options: vendorOptions,
                        onChange: (value) => {
                            setVendor(value);
                            setLocalOffset(0);
                        },
                    },
                    ...customFilters.map((filter:any) => ({
                        key: filter.key,
                        type: "select",
                        label: filter.label || filter.key,
                        placeholder: filter.label || filter.key,
                        value: selectedCustomFilters[filter.key] || "",
                        options: customFilterOptions[filter.key] || [],
                        onChange: (value: string) => {
                            setSelectedCustomFilters((previous) => ({
                                ...previous,
                                [filter.key]: value,
                            }));
                            setLocalOffset(0);
                        },
                    })),
                ]}
                gridCols="3"
                onSearch={handleRefresh}
                onClear={handleClear}
                onDownloadPdf={handleDownloadPdf}
                onDownloadExcel={handleDownloadExcel}
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
                    (exportColumnsLoading && exportType === "pdf")
                }
                excelLoading={
                    excelLoading ||
                    (exportColumnsLoading && exportType === "excel")
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
                loading={addLoader || registerFilterDropdownLoading}
                emptyMessage="No purchase register data found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewVoucher(row);
                        }}
                        className="
                            inline-flex cursor-pointer items-center gap-1 rounded-lg
                            bg-primary/10 px-3 py-1.5 text-xs font-bold
                            text-primary transition hover:bg-primary/20
                        "
                    >
                        <Eye size={15} />
                    </button>
                )}
            />

            <Modal
                show={exportModalVisible}
                setShow={setExportModalVisible}
                handleClose={closeExportModal}
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

                            {systemColumns.length > 0 && (
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

                                    {systemColumns.map((column: any) => (
                                        <Checkbox
                                            key={column.key}
                                            checked={selectedExportColumns.includes(
                                                column.key
                                            )}
                                            value={column.key}
                                            label={column.label || column.key}
                                            onChange={() =>
                                                toggleExportColumn(column.key)
                                            }
                                            className="border-b border-border py-3 hover:bg-muted/40"
                                        />
                                    ))}
                                </div>
                            )}

                            {customColumns.length > 0 && (
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

                                    {customColumns.map((column: any) => (
                                        <Checkbox
                                            key={column.key}
                                            checked={selectedExportColumns.includes(
                                                column.key
                                            )}
                                            value={column.key}
                                            label={column.label || column.key}
                                            onChange={() =>
                                                toggleExportColumn(column.key)
                                            }
                                            className="border-b border-border py-3 hover:bg-muted/40"
                                        />
                                    ))}
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
                                onClick={closeExportModal}
                                disabled={pdfLoading || excelLoading}
                                className="cursor-pointer rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={performExportDownload}
                                disabled={
                                    !selectedExportColumns.length ||
                                    pdfLoading ||
                                    excelLoading
                                }
                                className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {pdfLoading || excelLoading
                                    ? "Downloading..."
                                    : exportType === "pdf"
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
                title="View Purchase Invoice"
                subtitle="View purchase invoice details"
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
                footerTotals={viewFooterTotals}
            />

            {currentPagination?.totalDocs > 0 && (
                <div className="mt-2">
                    <Pagination
                        localLimit={localLimit}
                        selectCb={(e: any) => {
                            setLocalLimit(Number(e.target.value));
                            setLocalOffset(0);
                        }}
                        preDisabled={!currentPagination?.hasPrevPage}
                        nextDisabled={!currentPagination?.hasNextPage}
                        setLocalOffset={setLocalOffset}
                        pagination={currentPagination}
                    />
                </div>
            )}
        </div>
    );
};

export default PurchaseRegister;