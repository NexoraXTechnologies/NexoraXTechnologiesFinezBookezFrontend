import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Edit, Square, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DataTable from "../../../../../components/DataTable";
import { DataCreateButton, DataREfreshButton } from "../../../../../components/buttons";
import Toggle from "../../../../../components/toggle";
import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import Modal from "../../../../../components/modal";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import { SelectInput } from "../../../../../components/inputs";
import { formatDateForInput, formatDateForList, isTrueValue, loadFieldOptions, money, num, todayYMD } from "../../../../../utils/helperFunctions";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import { MultiInvoiceEditableTable } from "../../../../../components/voucher/EditableLineTable";
import professionalAxios from "../../../../../services/professionalAxios";
import {
    createMultiPurchaseInvoice,
    deleteMultiPurchaseInvoice,
    getAllMultiPurchaseInvoice,
    getMultiPurchaseInvoiceByVoucherNumber,
    updateMultiPurchaseInvoice
} from "../../../../../redux/slices/professionalSlice/purchaseWorkflow/multiInvoice";
import Permission from "../../../../../components/PermissionGuard";

const defaultPagination = { offset: 0, limit: 10, totalDocs: 0, totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };

const getDefaultFooter = () => ({
    totalGRNs: 0,
    grossAmount: "0.00",
    discountAmount: "0.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    igstAmount: "0.00",
    taxAmount: "0.00",
    netAmount: "0.00",
    adjustedAmount: "0.00",
    balanceAmount: "0.00",
});

const getDefaultForm = () => ({
    pMultiInvVoucherNumber: "AUTO",
    pMultiInvVendorCode: "",
    pMultiInvVendorName: "",
    pMultiInvVoucherDate: todayYMD(),
    pMultiInvStatus: "open",
    pMultiInvRemark: "",
    customMasters: {},
    pMultiInvGRNs: [],
    pMultiInvFooter: getDefaultFooter(),
});

const getGrnVoucherNumber = (grn: any) => String(grn?.grnVoucherNumber || "").trim();

const getSingleMultiPurchaseRecord = (response: any) => {
    const source = response?.data?.data ?? response?.data ?? response ?? {};
    if (Array.isArray(source)) return source[0] || null;
    return source?.item || source?.record || source?.multiPurchaseInvoice || source?.data || source || null;
};

const getGrnDetailRecord = (response: any) => {
    return response?.data?.data?.grn || response?.data?.grn || response?.data?.data?.record || response?.data?.record || response?.data?.data || response?.data || null;
};

const getVendorGrnRecords = (response: any) => {
    const candidates = [
        response?.data?.data?.data,
        response?.data?.data?.records,
        response?.data?.records,
        response?.data?.data,
        response?.data,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
    }

    return [];
};

const toIsoDate = (value: any) => {
    if (!value) return "";
    const stringValue = String(value).trim();
    if (!stringValue) return "";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(stringValue) ? new Date(`${stringValue}T00:00:00.000Z`) : new Date(stringValue);
    return Number.isNaN(date.getTime()) ? stringValue : date.toISOString();
};

const calculateMultiPurchaseFooter = (grns: any[]) => {
    const total = (grns || []).reduce((acc: any, grn: any) => {
        const footer = grn?.grnFooter || {};

        acc.grossAmount += num(footer?.grossAmount || footer?.totalGrossAmount);
        acc.discountAmount += num(footer?.discountAmount || footer?.totalDiscountAmount);
        acc.cgstAmount += num(footer?.cgstAmount || footer?.totalCgstAmount);
        acc.sgstAmount += num(footer?.sgstAmount || footer?.totalSgstAmount);
        acc.igstAmount += num(footer?.igstAmount || footer?.totalIgstAmount);
        acc.taxAmount += num(footer?.taxAmount || footer?.totalTaxAmount);
        acc.netAmount += num(footer?.netAmount || footer?.totalNetAmount);
        acc.adjustedAmount += num(footer?.adjustedAmount);
        acc.balanceAmount += num(footer?.balanceAmount ?? footer?.netAmount ?? footer?.totalNetAmount);

        return acc;
    }, {
        grossAmount: 0,
        discountAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        taxAmount: 0,
        netAmount: 0,
        adjustedAmount: 0,
        balanceAmount: 0,
    });

    return {
        totalGRNs: grns?.length || 0,
        grossAmount: total.grossAmount.toFixed(2),
        discountAmount: total.discountAmount.toFixed(2),
        cgstAmount: total.cgstAmount.toFixed(2),
        sgstAmount: total.sgstAmount.toFixed(2),
        igstAmount: total.igstAmount.toFixed(2),
        taxAmount: total.taxAmount.toFixed(2),
        netAmount: total.netAmount.toFixed(2),
        adjustedAmount: total.adjustedAmount.toFixed(2),
        balanceAmount: total.balanceAmount.toFixed(2),
    };
};

const normalizeGrnForMultiPurchaseInvoice = (grn: any) => {
    const body = Array.isArray(grn?.grnBody) ? grn.grnBody : [];
    const footer = grn?.grnFooter && typeof grn.grnFooter === "object" ? grn.grnFooter : {};

    return {
        ...grn,
        grnVoucherNumber: grn?.grnVoucherNumber || "",
        pOrdVoucherNumber: grn?.pOrdVoucherNumber || "",
        grnVendorCode: grn?.grnVendorCode || "",
        grnVendorName: grn?.grnVendorName || "",
        grnVoucherDate: grn?.grnVoucherDate || "",
        grnPurAccount: grn?.grnPurAccount || "",
        grnStatus: grn?.grnStatus || grn?.grnDocStatus || "open",
        grnRemark: grn?.grnRemark || grn?.grnRemarks || "",
        grnReferenceCodes: Array.isArray(grn?.grnReferenceCodes) ? grn.grnReferenceCodes : [],
        isAutoPost: grn?.isAutoPost ?? false,
        customMasters: grn?.customMasters && typeof grn.customMasters === "object" ? { ...grn.customMasters } : {},

        grnBody: body.map((item: any) => ({
            ...item,
            acceptedQuantity: String(item?.acceptedQuantity ?? ""),
            rejectedQuantity: String(item?.rejectedQuantity ?? ""),
            rejectedReason: item?.rejectedReason || "",
            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription: item?.productDescription || item?.description || "",
            productHSNCode: item?.productHSNCode || "",
            quantity: String(item?.quantity ?? ""),
            uom: item?.uom || item?.unit || "",
            rate: String(item?.rate ?? ""),
            gross: String(item?.gross ?? item?.grossAmount ?? "0"),
            discount: item?.discount == null ? null : String(item.discount),
            discountAmount: String(item?.discountAmount ?? "0"),
            cgst: item?.cgst == null ? null : String(item.cgst),
            cgstAmount: String(item?.cgstAmount ?? "0"),
            sgst: item?.sgst == null ? null : String(item.sgst),
            sgstAmount: String(item?.sgstAmount ?? "0"),
            igst: item?.igst == null ? null : String(item.igst),
            igstAmount: String(item?.igstAmount ?? "0"),
            taxAmount: String(item?.taxAmount ?? "0"),
            netAmount: String(item?.netAmount ?? item?.netTotal ?? "0"),
            customMasters: item?.customMasters && typeof item.customMasters === "object" ? { ...item.customMasters } : {},
        })),

        grnFooter: {
            ...footer,
            grossAmount: String(footer?.grossAmount ?? footer?.totalGrossAmount ?? "0"),
            discountAmount: String(footer?.discountAmount ?? footer?.totalDiscountAmount ?? "0"),
            cgstAmount: String(footer?.cgstAmount ?? footer?.totalCgstAmount ?? "0"),
            sgstAmount: String(footer?.sgstAmount ?? footer?.totalSgstAmount ?? "0"),
            igstAmount: String(footer?.igstAmount ?? footer?.totalIgstAmount ?? "0"),
            taxAmount: String(footer?.taxAmount ?? footer?.totalTaxAmount ?? "0"),
            netAmount: String(footer?.netAmount ?? footer?.totalNetAmount ?? "0"),
            adjustedAmount: String(footer?.adjustedAmount ?? "0"),
            balanceAmount: String(footer?.balanceAmount ?? footer?.netAmount ?? footer?.totalNetAmount ?? "0"),
        },
    };
};

const getSchemaFieldValue = (source: any, field: any) => {
    if (!source || !field?.key) return undefined;

    const key = field.key;

    const directValues = [
        source?.[key],
        source?.dynamicFields?.[key],
        source?.dynamicHeaderFields?.[key],
        source?.dynamicBodyFields?.[key],
        source?.customFields?.[key],
    ];

    for (const value of directValues) {
        if (value !== undefined && value !== null) return value;
    }

    const customMasterName = String(field?.customMasterName || field?.dataSource?.customMasterName || "").trim();

    if (customMasterName) {
        const selectedMaster = source?.customMasters?.[customMasterName] || source?.customMasters?.[field?.key];

        if (selectedMaster && typeof selectedMaster === "object") {
            return selectedMaster?.code || selectedMaster?.voucherNumber || "";
        }
    }

    return undefined;
};

const mapGrnToSchemaRow = (grn: any, schemaFields: any[]) => {
    const normalizedGrn = normalizeGrnForMultiPurchaseInvoice(grn);
    const schemaValues: any = {};

    (schemaFields || []).forEach((field: any) => {
        if (!field?.key) return;

        const value = getSchemaFieldValue(normalizedGrn, field);

        if (value !== undefined) schemaValues[field.key] = value;
        else if (field?.defaultValue !== undefined && field?.defaultValue !== null) schemaValues[field.key] = field.defaultValue;
        else if (field?.type === "array") schemaValues[field.key] = [];
        else if (field?.type === "object") schemaValues[field.key] = {};
        else schemaValues[field.key] = "";
    });

    return {
        ...schemaValues,
        ...normalizedGrn,
        grnBody: normalizedGrn.grnBody,
        grnFooter: normalizedGrn.grnFooter,
        customMasters: normalizedGrn.customMasters,
    };
};

const getSchemaHeaderDefaults = (header: any[] = []) => {
    const defaults: any = {};

    (header || []).forEach((field: any) => {
        if (!field?.key) return;

        if (field?.defaultValue !== undefined && field?.defaultValue !== null) {
            defaults[field.key] = field.defaultValue;
        }
    });

    return defaults;
};

const loadSchemaSectionOptions = async (fields: any[] = []) => {
    const safeFields = Array.isArray(fields) ? fields : [];
    const loadedFields = await loadFieldOptions(safeFields);

    return Promise.all((loadedFields || []).map(async (field: any) => {
        if (!Array.isArray(field?.fields) || !field.fields.length) return field;

        const nestedFields = await loadFieldOptions(field.fields);

        return { ...field, fields: nestedFields };
    }));
};

const loadAllTemplateOptions = async (templateData: any) => {
    const [header, body, footer] = await Promise.all([
        loadSchemaSectionOptions(templateData?.header || []),
        loadSchemaSectionOptions(templateData?.body || []),
        loadSchemaSectionOptions(templateData?.footer || []),
    ]);

    return { ...templateData, header, body, footer };
};

const MultiPurchaseInvoice = () => {
    const dispatch = useDispatch<any>();

    const multiPurchaseInvoiceState = useSelector((state: any) => state.multiPurchaseInvoice);

    const {
        multiPurchaseInvoices = [],
        pagination: serverPagination = defaultPagination,
        loading = false,
        createLoading = false,
        updateLoading = false,
        deleteLoading = false,
        detailLoading = false,
    } = multiPurchaseInvoiceState || {};

    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema);
    const { accounts = [], loading: accountsLoading = false } = useSelector((state: any) => state.accountMaster || {});

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");

    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingVoucherNumber, setEditingVoucherNumber] = useState("");

    const [selectedVendorCode, setSelectedVendorCode] = useState("");
    const [vendorGrns, setVendorGrns] = useState<any[]>([]);
    const [vendorGrnsLoading, setVendorGrnsLoading] = useState(false);
    const [grnSearch, setGrnSearch] = useState("");
    const [selectedGrnNumbers, setSelectedGrnNumbers] = useState<string[]>([]);

    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [templateFields, setTemplateFields] = useState<any>({ header: [], body: [], footer: [] });

    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });

    const vendorAccounts = useMemo(() => {
        return (accounts || []).filter((account: any) => {
            return String(account?.accountType || "").trim().toLowerCase() === "vendor";
        });
    }, [accounts]);

    const vendorOptions = useMemo(() => {
        return [
            { value: "", label: accountsLoading ? "Loading Vendors..." : "Select Vendor" },
            ...vendorAccounts.map((account: any) => ({
                value: String(account?.accountCode || ""),
                label: `${account?.accountName || "-"}${account?.accountCode ? ` (${account.accountCode})` : ""}`,
                raw: account,
            })),
        ];
    }, [vendorAccounts, accountsLoading]);

    const multiPurchaseBodyFields = useMemo(() => {
        return Array.isArray(templateFields?.body) ? templateFields.body : [];
    }, [templateFields?.body]);

    // TABLE VIEW ADAPTER
    const multiPurchaseTableSchema = useMemo(() => {
        return (templateFields?.body || []).map((field: any) => {
            if (field?.key === "grnBody") return { ...field, key: "sInvBody" };
            if (field?.key === "grnFooter") return { ...field, key: "sInvFooter" };
            return field;
        });
    }, [templateFields?.body]);

    const multiPurchaseTableGrns = useMemo(() => {
        return (form?.pMultiInvGRNs || []).map((grn: any) => ({
            ...grn,
            sInvNo: grn?.grnVoucherNumber || "",
            sInvVoucherNumber: grn?.grnVoucherNumber || "",
            sInvVoucherDate: grn?.grnVoucherDate || "",
            sInvCustomerCode: grn?.grnVendorCode || "",
            sInvCustomerName: grn?.grnVendorName || "",
            sInvStatus: grn?.grnStatus || "open",
            sInvSalesAccount: grn?.grnPurAccount || "",
            sInvBody: Array.isArray(grn?.grnBody) ? grn.grnBody : [],
            sInvFooter: grn?.grnFooter || {},
        }));
    }, [form?.pMultiInvGRNs]);

    const selectedGrnSet = useMemo(() => new Set(selectedGrnNumbers), [selectedGrnNumbers]);

    const filteredVendorGrns = useMemo(() => {
        const searchText = grnSearch.trim().toLowerCase();

        if (!searchText) return vendorGrns;

        return vendorGrns.filter((grn: any) => {
            const values = [
                grn?.grnVoucherNumber,
                grn?.grnVoucherDate,
                grn?.netAmount,
                grn?.balanceAmount,
            ];

            return values.some((value) => String(value ?? "").toLowerCase().includes(searchText));
        });
    }, [vendorGrns, grnSearch]);

    const listingData = useMemo(() => {
        const searchText = debouncedSearch.trim().toLowerCase();

        if (!searchText) return multiPurchaseInvoices || [];

        return (multiPurchaseInvoices || []).filter((record: any) => {
            const values = [
                record?.pMultiInvVoucherNumber,
                record?.pMultiInvVendorCode,
                record?.pMultiInvVendorName,
                record?.pMultiInvRemark,
                record?.pMultiInvStatus,
            ];

            return values.some((value) => String(value || "").toLowerCase().includes(searchText));
        });
    }, [multiPurchaseInvoices, debouncedSearch]);

    const pagination = useMemo(() => {
        return {
            ...defaultPagination,
            ...serverPagination,
            offset: localOffset,
            limit: localLimit,
        };
    }, [serverPagination, localOffset, localLimit]);

    const footerValues = useMemo(() => {
        const footer = form?.pMultiInvFooter || getDefaultFooter();

        return {
            totalGRNs: footer?.totalGRNs || 0,
            grossAmount: num(footer?.grossAmount),
            discountAmount: num(footer?.discountAmount),
            cgstAmount: num(footer?.cgstAmount),
            sgstAmount: num(footer?.sgstAmount),
            igstAmount: num(footer?.igstAmount),
            taxAmount: num(footer?.taxAmount),
            netAmount: num(footer?.netAmount),
            adjustedAmount: num(footer?.adjustedAmount),
            balanceAmount: num(footer?.balanceAmount),
        };
    }, [form?.pMultiInvFooter]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || [])
            .filter((field: any) => !isTrueValue(field?.isHidden))
            .map((field: any) => {
                const schemaValue = form?.pMultiInvFooter?.[field?.key];
                const rawValue = schemaValue ?? footerValues[field?.key as keyof typeof footerValues] ?? field?.defaultValue ?? 0;

                return {
                    ...field,
                    value: field?.key === "totalGRNs" ? rawValue : money(rawValue),
                    rawValue,
                };
            });
    }, [templateFields?.footer, footerValues, form?.pMultiInvFooter]);

    const multiPurchaseInputData = useMemo(() => ({
        ...templateFields,
        body: multiPurchaseBodyFields,
        footer: dynamicFooterArray,
    }), [templateFields, multiPurchaseBodyFields, dynamicFooterArray]);

    const fetchMultiPurchaseInvoices = async () => {
        try {
            await dispatch(getAllMultiPurchaseInvoice({
                status,
                vendorCode: "",
                limit: localLimit,
                offset: localOffset,
            }) as any).unwrap();
        }
        catch (error: any) {
            toast.error(error?.message || error || "Failed to load Multi Purchase Invoices");
        }
    };

    const fetchVendorGrns = async (vendorCode: string) => {
        if (!vendorCode) {
            setVendorGrns([]);
            return;
        }

        setVendorGrnsLoading(true);

        try {
            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/byVendorCode/${encodeURIComponent(vendorCode)}`,
                { params: { limit: 200, skip: 0 } }
            );

            setVendorGrns(getVendorGrnRecords(response));
        }
        catch (error: any) {
            setVendorGrns([]);
            toast.error(error?.response?.data?.message || error?.message || "Failed to load vendor GRNs");
        }
        finally {
            setVendorGrnsLoading(false);
        }
    };

    const fetchGrnDetailByVoucherNumber = async (grnVoucherNumber: string) => {
        const response = await professionalAxios.get(
            `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/getByVoucherNumber/${encodeURIComponent(grnVoucherNumber)}`
        );

        return getGrnDetailRecord(response);
    };

    const columns = [
        {
            key: "pMultiInvVoucherNumber",
            title: "Voucher",
            render: (row: any) => (
                <span className="font-medium text-card-foreground">
                    {row?.pMultiInvVoucherNumber || "-"}
                </span>
            ),
        },
        {
            key: "pMultiInvVoucherDate",
            title: "Date",
            render: (row: any) => (
                <>
                    {row?.pMultiInvVoucherDate ? formatDateForList(row.pMultiInvVoucherDate) : "-"}
                    <span className="block text-sm">
                        {row?.createdOn && new Date(row.createdOn).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                        })}
                    </span>
                </>
            ),
        },
        {
            key: "pMultiInvVendorName",
            title: "Vendor",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.pMultiInvVendorName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {row?.pMultiInvVendorCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "pMultiInvGRNs",
            title: "GRNs",
            render: (row: any) => (
                <span className="font-medium">
                    {row?.pMultiInvFooter?.totalGRNs ?? row?.pMultiInvGRNs?.length ?? 0}
                </span>
            ),
        },
        {
            key: "grossAmount",
            title: "Gross Amount",
            render: (row: any) => <span className="font-medium">{money(row?.pMultiInvFooter?.grossAmount || 0)}</span>,
            type: "amount",
        },
        {
            key: "taxAmount",
            title: "Tax Amount",
            render: (row: any) => <span className="font-medium">{money(row?.pMultiInvFooter?.taxAmount || 0)}</span>,
            type: "amount",
        },
        {
            key: "netAmount",
            title: "Net Amount",
            render: (row: any) => <span className="font-semibold text-primary">{money(row?.pMultiInvFooter?.netAmount || 0)}</span>,
            type: "amount",
        },
        {
            key: "pMultiInvStatus",
            title: "Status",
            render: (row: any) => {
                const rowStatus = String(row?.pMultiInvStatus || "").toLowerCase();

                return (
                    <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${rowStatus === "open" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger"}`}>
                        {row?.pMultiInvStatus || "-"}
                    </span>
                );
            },
        },
    ];

    const handleStatusChange = (nextStatus: "open" | "close") => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchMultiPurchaseInvoices();
            toast.success("Multi Purchase Invoice list refreshed");
        }
        finally {
            setRefreshing(false);
        }
    };

    const resetSelectionModal = () => {
        setSelectedVendorCode("");
        setVendorGrns([]);
        setGrnSearch("");
        setSelectedGrnNumbers([]);
    };

    const resetForm = () => {
        setEditingVoucherNumber("");

        setForm({
            ...getDefaultForm(),
            ...getSchemaHeaderDefaults(templateFields?.header || []),
        });

        setErrors({});
    };

    const openAddModal = async () => {
        resetSelectionModal();
        resetForm();

        try {
            await dispatch(getAllAccounts({
                offset: 0,
                limit: 1000,
                search: "",
                accountType: "vendor",
            }) as any).unwrap();
        }
        catch (error: any) {
            toast.error(error?.message || "Failed to load vendors");
        }

        setShowSelectionModal(true);
    };

    const handleVendorSelect = async (vendorCode: string) => {
        setSelectedVendorCode(vendorCode);
        setSelectedGrnNumbers([]);
        setGrnSearch("");
        setVendorGrns([]);

        if (!vendorCode) return;

        await fetchVendorGrns(vendorCode);
    };

    const handleGrnToggle = (grn: any) => {
        const voucherNumber = getGrnVoucherNumber(grn);

        if (!voucherNumber) return;

        setSelectedGrnNumbers((previous) => {
            if (previous.includes(voucherNumber)) {
                return previous.filter((item) => item !== voucherNumber);
            }

            return [...previous, voucherNumber];
        });
    };

    const handleSelectAllGrns = () => {
        const visibleVoucherNumbers = filteredVendorGrns.map(getGrnVoucherNumber).filter(Boolean);

        const allVisibleSelected =
            visibleVoucherNumbers.length > 0 &&
            visibleVoucherNumbers.every((voucherNumber: string) =>
                selectedGrnSet.has(voucherNumber)
            );

        setSelectedGrnNumbers((previous) => {
            if (allVisibleSelected) {
                return previous.filter((voucherNumber) => !visibleVoucherNumbers.includes(voucherNumber));
            }

            return Array.from(new Set([...previous, ...visibleVoucherNumbers]));
        });
    };

    const handleGrnSelectionConfirm = async () => {
        if (!selectedVendorCode) {
            toast.error("Please select vendor");
            return;
        }

        if (!selectedGrnNumbers.length) {
            toast.error("Please select at least one GRN");
            return;
        }

        setVendorGrnsLoading(true);

        try {
            const fullGrns = await Promise.all(
                selectedGrnNumbers.map(async (voucherNumber) => {
                    return fetchGrnDetailByVoucherNumber(voucherNumber);
                })
            );

            const validGrns = fullGrns.filter(Boolean);

            if (!validGrns.length) {
                toast.error("Selected GRN data not found");
                return;
            }

            const selectedGrns = validGrns.map((grn: any) =>
                mapGrnToSchemaRow(grn, multiPurchaseBodyFields)
            );

            const selectedVendor = vendorAccounts.find(
                (account: any) =>
                    String(account?.accountCode) === String(selectedVendorCode)
            );

            const firstGrn = selectedGrns[0];

            setForm({
                ...getDefaultForm(),
                ...getSchemaHeaderDefaults(templateFields?.header || []),
                pMultiInvVoucherNumber: "AUTO",
                pMultiInvVendorCode: selectedVendorCode,
                pMultiInvVendorName:
                    selectedVendor?.accountName ||
                    firstGrn?.grnVendorName ||
                    "",
                pMultiInvVoucherDate: formatDateForInput(todayYMD()),
                pMultiInvStatus: "open",
                pMultiInvRemark: "",
                customMasters:
                    firstGrn?.customMasters &&
                        typeof firstGrn.customMasters === "object"
                        ? { ...firstGrn.customMasters }
                        : {},
                pMultiInvGRNs: selectedGrns,
                pMultiInvFooter: calculateMultiPurchaseFooter(selectedGrns),
            });

            setErrors({});
            setShowSelectionModal(false);
            setShowForm(true);
        }
        catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load selected GRNs"
            );
        }
        finally {
            setVendorGrnsLoading(false);
        }
    };

    const handleEditClick = async (record: any) => {
        const voucherNumber = String(record?.pMultiInvVoucherNumber || "").trim();

        if (!voucherNumber) {
            toast.error("Multi Purchase Invoice voucher number not found");
            return;
        }

        try {
            const response = await dispatch(
                getMultiPurchaseInvoiceByVoucherNumber(voucherNumber) as any
            ).unwrap();

            const editRecord = getSingleMultiPurchaseRecord(response);

            if (!editRecord) {
                toast.error("Multi Purchase Invoice data not found");
                return;
            }

            const grns = Array.isArray(editRecord?.pMultiInvGRNs)
                ? editRecord.pMultiInvGRNs
                : [];

            const normalizedGrns = grns.map((grn: any) =>
                normalizeGrnForMultiPurchaseInvoice(grn)
            );

            setEditingVoucherNumber(voucherNumber);
            setSelectedVendorCode(String(editRecord?.pMultiInvVendorCode || ""));
            setSelectedGrnNumbers(
                normalizedGrns.map(getGrnVoucherNumber).filter(Boolean)
            );
            setErrors({});

            setForm({
                ...getDefaultForm(),
                ...getSchemaHeaderDefaults(templateFields?.header || []),
                ...editRecord,
                pMultiInvVoucherNumber:
                    editRecord?.pMultiInvVoucherNumber || voucherNumber,
                pMultiInvVendorCode:
                    editRecord?.pMultiInvVendorCode || "",
                pMultiInvVendorName:
                    editRecord?.pMultiInvVendorName || "",
                pMultiInvVoucherDate: formatDateForInput(
                    editRecord?.pMultiInvVoucherDate || todayYMD()
                ),
                pMultiInvStatus:
                    editRecord?.pMultiInvStatus || "open",
                pMultiInvRemark:
                    editRecord?.pMultiInvRemark || "",
                customMasters:
                    editRecord?.customMasters &&
                        typeof editRecord.customMasters === "object"
                        ? { ...editRecord.customMasters }
                        : {},
                pMultiInvGRNs: normalizedGrns,
                pMultiInvFooter:
                    editRecord?.pMultiInvFooter &&
                        typeof editRecord.pMultiInvFooter === "object"
                        ? {
                            ...getDefaultFooter(),
                            ...editRecord.pMultiInvFooter,
                        }
                        : calculateMultiPurchaseFooter(normalizedGrns),
            });

            setShowForm(true);
        }
        catch (error: any) {
            toast.error(
                error?.message ||
                error ||
                "Failed to load Multi Purchase Invoice"
            );
        }
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((previous: any) => ({
            ...previous,
            [key]: value,
        }));

        setErrors((previous: any) => ({
            ...previous,
            [key]: "",
        }));
    };

    const handleDeleteSelectedGrn = (index: number) => {
        setForm((previous: any) => {
            const deletedGrn = previous?.pMultiInvGRNs?.[index];
            const deletedVoucherNumber = getGrnVoucherNumber(deletedGrn);

            if (deletedVoucherNumber) {
                setSelectedGrnNumbers((selectedPrevious) =>
                    selectedPrevious.filter(
                        (voucherNumber) =>
                            voucherNumber !== deletedVoucherNumber
                    )
                );
            }

            const grns = (previous?.pMultiInvGRNs || []).filter(
                (_: any, rowIndex: number) => rowIndex !== index
            );

            return {
                ...previous,
                pMultiInvGRNs: grns,
                pMultiInvFooter: calculateMultiPurchaseFooter(grns),
            };
        });
    };

    const handleGrnRowChange = (
        index: number,
        key: string,
        value: any
    ) => {
        setForm((previous: any) => {
            const grns = [...(previous?.pMultiInvGRNs || [])];

            if (!grns[index]) return previous;

            grns[index] = {
                ...grns[index],
                [key]: value,
            };

            return {
                ...previous,
                pMultiInvGRNs: grns,
                pMultiInvFooter: calculateMultiPurchaseFooter(grns),
            };
        });

        setErrors((previous: any) => ({
            ...previous,
            [`row_${index}_${key}`]: "",
        }));
    };

    const validateForm = () => {
        const validationErrors: any = {};

        (templateFields?.header || []).forEach((field: any) => {
            if (isTrueValue(field?.isHidden)) return;
            if (!isTrueValue(field?.isRequired)) return;

            const value = form?.[field.key];

            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                validationErrors[field.key] =
                    `${field?.label || field?.title || field?.key} is required`;
            }
        });

        if (!form?.pMultiInvVendorCode) {
            validationErrors.pMultiInvVendorCode = "Vendor is required";
        }

        if (!(form?.pMultiInvGRNs || []).length) {
            validationErrors.pMultiInvGRNs =
                "Please select at least one GRN";
        }

        (form?.pMultiInvGRNs || []).forEach(
            (grn: any, rowIndex: number) => {
                (multiPurchaseBodyFields || []).forEach(
                    (field: any) => {
                        if (isTrueValue(field?.isHidden)) return;
                        if (!isTrueValue(field?.isRequired)) return;

                        const value = grn?.[field?.key];

                        if (
                            value === undefined ||
                            value === null ||
                            value === ""
                        ) {
                            validationErrors[
                                `row_${rowIndex}_${field.key}`
                            ] =
                                `${field?.label || field?.title || field?.key} is required`;
                        }
                    }
                );
            }
        );

        setErrors(validationErrors);

        if (validationErrors.pMultiInvGRNs) {
            toast.error(validationErrors.pMultiInvGRNs);
        }

        return Object.keys(validationErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const grns = (form?.pMultiInvGRNs || []).map((grn: any) => ({
            ...grn,
            grnVoucherDate: toIsoDate(grn?.grnVoucherDate),

            grnBody: Array.isArray(grn?.grnBody)
                ? grn.grnBody.map((item: any) => ({
                    ...item,
                    acceptedQuantity: String(item?.acceptedQuantity ?? ""),
                    rejectedQuantity: String(item?.rejectedQuantity ?? ""),
                    rejectedReason: item?.rejectedReason || "",
                    quantity: String(item?.quantity ?? ""),
                    rate: String(item?.rate ?? ""),
                    gross: String(item?.gross ?? item?.grossAmount ?? "0"),
                    discount:
                        item?.discount == null
                            ? null
                            : String(item.discount),
                    discountAmount: String(item?.discountAmount ?? "0"),
                    cgst:
                        item?.cgst == null
                            ? null
                            : String(item.cgst),
                    cgstAmount: String(item?.cgstAmount ?? "0"),
                    sgst:
                        item?.sgst == null
                            ? null
                            : String(item.sgst),
                    sgstAmount: String(item?.sgstAmount ?? "0"),
                    igst:
                        item?.igst == null
                            ? null
                            : String(item.igst),
                    igstAmount: String(item?.igstAmount ?? "0"),
                    taxAmount: String(item?.taxAmount ?? "0"),
                    netAmount: String(
                        item?.netAmount ??
                        item?.netTotal ??
                        "0"
                    ),
                }))
                : [],

            grnFooter:
                grn?.grnFooter &&
                    typeof grn.grnFooter === "object"
                    ? { ...grn.grnFooter }
                    : {},
        }));

        const payload = {
            pMultiInvVendorCode:
                form?.pMultiInvVendorCode || "",
            pMultiInvVendorName:
                form?.pMultiInvVendorName || "",
            pMultiInvVoucherDate:
                toIsoDate(form?.pMultiInvVoucherDate),
            pMultiInvStatus:
                form?.pMultiInvStatus || "open",
            pMultiInvRemark:
                form?.pMultiInvRemark || "",
            customMasters:
                form?.customMasters &&
                    typeof form.customMasters === "object"
                    ? form.customMasters
                    : {},
            pMultiInvGRNs: grns,
            pMultiInvFooter:
                calculateMultiPurchaseFooter(grns),
        };

        console.log(
            "MULTI PURCHASE INVOICE PAYLOAD:",
            payload
        );

        try {
            if (editingVoucherNumber) {
                await dispatch(
                    updateMultiPurchaseInvoice({
                        pMultiInvVoucherNumber:
                            editingVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                toast.success(
                    "Multi Purchase Invoice updated successfully"
                );
            } else {
                await dispatch(
                    createMultiPurchaseInvoice({
                        payload,
                    }) as any
                ).unwrap();

                toast.success(
                    "Multi Purchase Invoice created successfully"
                );
            }

            setShowForm(false);
            resetForm();
            resetSelectionModal();

            await fetchMultiPurchaseInvoices();
        }
        catch (error: any) {
            toast.error(
                error?.message ||
                error ||
                (editingVoucherNumber
                    ? "Failed to update Multi Purchase Invoice"
                    : "Failed to create Multi Purchase Invoice")
            );
        }
    };

    const handleDeleteClick = (
        event: any,
        record: any
    ) => {
        const rect =
            event.currentTarget.getBoundingClientRect();

        let x = rect.left - 150;

        if (x < 10) x = 10;

        const y =
            rect.top +
            window.scrollY -
            5;

        setConfirmTooltip({
            show: true,
            x,
            y,
            voucherNumber:
                record?.pMultiInvVoucherNumber,
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.voucherNumber) {
                toast.error(
                    "Multi Purchase Invoice voucher number not found"
                );
                return;
            }

            await dispatch(
                deleteMultiPurchaseInvoice(
                    confirmTooltip.voucherNumber
                ) as any
            ).unwrap();

            toast.success(
                "Multi Purchase Invoice deleted successfully"
            );

            await fetchMultiPurchaseInvoices();
        }
        catch (error: any) {
            toast.error(
                error?.message ||
                error ||
                "Failed to delete Multi Purchase Invoice"
            );
        }
        finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
            });
        }
    };

    useEffect(() => {
        dispatch(
            getAllTransactionSchema(
                "multiPurchaseInvoice"
            ) as any
        );
    }, [dispatch]);

    useEffect(() => {
        const prepareFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema =
                Array.isArray(transactionsSchema?.header) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                setFieldsLoading(true);

                const updatedFields =
                    await loadAllTemplateOptions(
                        transactionsSchema
                    );

                setTemplateFields(updatedFields);

                setForm((previous: any) => ({
                    ...getSchemaHeaderDefaults(
                        updatedFields?.header || []
                    ),
                    ...previous,
                }));
            }
            catch (error) {
                console.log(
                    "Failed to prepare Multi Purchase Invoice fields",
                    error
                );
            }
            finally {
                setFieldsLoading(false);
            }
        };

        void prepareFields();
    }, [transactionsSchema]);

    useEffect(() => {
        fetchMultiPurchaseInvoices();
    }, [status, localOffset, localLimit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                    <Badge
                        {...{
                            count:
                                pagination?.totalDocs ||
                                multiPurchaseInvoices?.length ||
                                0,
                            text:
                                "Total Multi Purchase Invoices:",
                            varient: "primary",
                        }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Toggle
                        {...{
                            arr: ["open", "close"],
                            state: status,
                            setState:
                                handleStatusChange,
                        }}
                    />

                    <SearchInput
                        {...{
                            search,
                            setSearch,
                        }}
                    />

                    <DataREfreshButton
                        {...{
                            callBackFn:
                                handleRefresh,
                            loading:
                                refreshing,
                        }}
                    />
                    <Permission module="bookez" permissionKey="multiPurchaseInvoice" action="create">
                    {/* @ts-ignore */}
                    <DataCreateButton
                        {...{
                            callBackFn:
                                openAddModal,
                            text:
                                "Add Multi Purchase Invoice",
                        }}
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={listingData}
                loading={loading}
                emptyMessage={`No ${status} Multi Purchase Invoice found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <Permission module="bookez" permissionKey="multiPurchaseInvoice" action="create">
                        <button
                            type="button"
                            disabled={
                                detailLoading ||
                                updateLoading
                            }
                            onClick={() =>
                                handleEditClick(
                                    record
                                )
                            }
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Edit"
                        >
                            <Edit size={16} />
                        </button>
                        </Permission>
                        <Permission module="bookez" permissionKey="multiPurchaseInvoice" action="delete">
                        <button
                            type="button"
                            disabled={
                                deleteLoading
                            }
                            onClick={(event) =>
                                handleDeleteClick(
                                    event,
                                    record
                                )
                            }
                            className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                            </button>
                        </Permission>
                    </div>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    {...{
                        localLimit,
                        selectCb: (
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
                        },
                        preDisabled:
                            !pagination
                                ?.hasPrevPage,
                        nextDisabled:
                            !pagination
                                ?.hasNextPage,
                        setLocalOffset,
                        pagination,
                    }}
                />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this Multi Purchase Invoice?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={
                        handleDeleteConfirm
                    }
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            voucherNumber:
                                null,
                        })
                    }
                />
            )}

            <Modal
                show={showSelectionModal}
                setShow={
                    setShowSelectionModal
                }
                title="Select GRNs"
                state={false}
                handleSubmit={
                    handleGrnSelectionConfirm
                }
                handleClose={() => {
                    setShowSelectionModal(
                        false
                    );

                    resetSelectionModal();
                }}
                gridCols={1}
                modalClassName="rounded-xl"
                headerClassName="bg-card"
                footerClassName="bg-card"
                bodyClassName="!block !p-0 bg-card text-card-foreground"
                // @ts-ignore
                cancelText="Cancel"
                confirmText={`Continue${selectedGrnNumbers.length ? ` (${selectedGrnNumbers.length})` : ""}`}
                body={
                    <div className="flex h-[620px] flex-col bg-card text-card-foreground">
                        <div className="border-b border-border p-4">
                            <SelectInput
                                label="Vendor"
                                mandatory
                                value={
                                    selectedVendorCode
                                }
                                placeholder={
                                    accountsLoading
                                        ? "Loading Vendors..."
                                        : "Select Vendor"
                                }
                                disabled={
                                    accountsLoading
                                }
                                largeData
                                batchSize={100}
                                options={
                                    vendorOptions
                                }
                                onChange={(
                                    event: any
                                ) =>
                                    handleVendorSelect(
                                        event
                                            ?.target
                                            ?.value ||
                                        ""
                                    )
                                }
                            />
                        </div>

                        {selectedVendorCode && (
                            <div className="flex items-center gap-2 border-b border-border p-4">
                                <input
                                    value={
                                        grnSearch
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setGrnSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search GRN..."
                                    className="min-w-0 flex-1 rounded-md border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />

                                <button
                                    type="button"
                                    onClick={
                                        handleSelectAllGrns
                                    }
                                    disabled={
                                        !filteredVendorGrns.length
                                    }
                                    className="cursor-pointer whitespace-nowrap rounded-md border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {filteredVendorGrns.length >
                                        0 &&
                                        filteredVendorGrns.every(
                                            (
                                                grn: any
                                            ) =>
                                                selectedGrnSet.has(
                                                    getGrnVoucherNumber(
                                                        grn
                                                    )
                                                )
                                        )
                                        ? "Unselect All"
                                        : "Select All"}
                                </button>

                                <Badge
                                    {...{
                                        count:
                                            selectedGrnNumbers.length,
                                        text:
                                            "Selected:",
                                        varient:
                                            "primary",
                                    }}
                                />
                            </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            {!selectedVendorCode ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Select a vendor
                                    to load GRNs
                                </div>
                            ) : vendorGrnsLoading ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Loading GRNs...
                                </div>
                            ) : !filteredVendorGrns.length ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    No GRN found
                                    for selected
                                    vendor
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredVendorGrns.map(
                                        (
                                            grn: any,
                                            index: number
                                        ) => {
                                            const voucherNumber =
                                                getGrnVoucherNumber(
                                                    grn
                                                );

                                            const selected =
                                                selectedGrnSet.has(
                                                    voucherNumber
                                                );

                                            return (
                                                <button
                                                    key={
                                                        voucherNumber ||
                                                        index
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        handleGrnToggle(
                                                            grn
                                                        )
                                                    }
                                                    className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-left transition-all duration-200 ${selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"}`}
                                                >
                                                    <span
                                                        className={
                                                            selected
                                                                ? "text-primary"
                                                                : "text-muted-foreground"
                                                        }
                                                    >
                                                        {selected ? (
                                                            <CheckSquare
                                                                size={
                                                                    19
                                                                }
                                                            />
                                                        ) : (
                                                            <Square
                                                                size={
                                                                    19
                                                                }
                                                            />
                                                        )}
                                                    </span>

                                                    <div className="min-w-0 flex-1">
                                                        <div
                                                            className={`text-sm font-semibold ${selected ? "text-primary" : "text-card-foreground"}`}
                                                        >
                                                            {voucherNumber ||
                                                                "-"}
                                                        </div>

                                                        {/* <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                            <span>
                                                                {grn?.grnVoucherDate
                                                                    ? formatDateForList(
                                                                        grn.grnVoucherDate
                                                                    )
                                                                    : "-"}
                                                            </span>

                                                            {grn?.netAmount !==
                                                                undefined && (
                                                                    <span>
                                                                        Net:{" "}
                                                                        {money(
                                                                            grn.netAmount
                                                                        )}
                                                                    </span>
                                                                )}

                                                            {grn?.balanceAmount !==
                                                                undefined && (
                                                                    <span>
                                                                        Balance:{" "}
                                                                        {money(
                                                                            grn.balanceAmount
                                                                        )}
                                                                    </span>
                                                                )}
                                                        </div> */}
                                                    </div>
                                                </button>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                }
            />

            {!fieldsLoading && (
                <DynamicAddForm
                    {...{
                        show: showForm,
                        setShow:
                            setShowForm,
                        edit:
                            !!editingVoucherNumber,
                        title:
                            editingVoucherNumber
                                ? "Edit Multi Purchase Invoice"
                                : "Multi Purchase Invoice",
                        subtitle: `${form?.pMultiInvGRNs?.length || 0} GRN${form?.pMultiInvGRNs?.length === 1 ? "" : "s"} selected`,
                        loading:
                            createLoading ||
                            updateLoading ||
                            detailLoading,

                        onClose: () => {
                            setShowForm(
                                false
                            );

                            resetForm();
                        },

                        onSubmit:
                            handleSubmit,
                        form,
                        errors,
                        inputData:
                            multiPurchaseInputData,
                        bodyKey:
                            "pMultiInvGRNs",
                        handleChange:
                            handleMainChange,

                        customBody: (
                            <MultiInvoiceEditableTable
                                invoices={
                                    multiPurchaseTableGrns
                                }
                                schema={
                                    multiPurchaseTableSchema
                                }
                                errors={
                                    errors
                                }
                                readonly={
                                    true
                                }
                                showDelete={
                                    true
                                }
                                title="GRNs"
                                onDeleteInvoice={
                                    handleDeleteSelectedGrn
                                }
                                onInvoiceChange={
                                    handleGrnRowChange
                                }
                            />
                        ),
                    }}
                />
            )}
        </div>
    );
};

export default MultiPurchaseInvoice;