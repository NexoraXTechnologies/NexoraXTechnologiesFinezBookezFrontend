import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Square, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DataTable from "../../../../../components/DataTable";
import { DataREfreshButton } from "../../../../../components/buttons";
import Toggle from "../../../../../components/toggle";
import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import Permission from "../../../../../components/PermissionGuard";
import Modal from "../../../../../components/modal";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import { SelectInput } from "../../../../../components/inputs";
import { formatDateForInput, formatDateForList, isTrueValue, loadFieldOptions, money, num, todayYMD } from "../../../../../utils/helperFunctions";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
// import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import {
    clearCustomerSalesInvoices,
    createMultiSalesInvoice,
    deleteMultiSalesInvoice,
    getAllMultiSalesInvoice,
    getSalesInvoicesByCustomerCode
} from "../../../../../redux/slices/professionalSlice/salesWorkflow/multiInvoice";
import { MultiInvoiceEditableTable } from "../../../../../components/voucher/EditableLineTable";

const defaultPagination = { offset: 0, limit: 10, totalDocs: 0, totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };

const getDefaultFooter = () => ({
    totalInvoices: 0,
    grossAmount: "0.00",
    discountAmount: "0.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    igstAmount: "0.00",
    taxAmount: "0.00",
    netAmount: "0.00",
    balanceAmount: "0.00",
    loadingCharges: "0.00",
});

const getDefaultForm = () => ({
    sMultiInvVoucherNumber: "AUTO",
    sMultiInvCustomerCode: "",
    sMultiInvCustomerName: "",
    sMultiInvVoucherDate: todayYMD(),
    sMultiInvStatus: "open",
    sMultiInvRemark: "",
    customMasters: {},
    sMultiInvInvoices: [],
    sMultiInvFooter: getDefaultFooter(),
});

const getInvoiceVoucherNumber = (invoice: any) => String(invoice?.sInvVoucherNumber || invoice?.sInvNo || invoice?.voucherNumber || "").trim();

const toIsoDate = (value: any) => {
    if (!value) return "";
    const stringValue = String(value).trim();
    if (!stringValue) return "";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(stringValue) ? new Date(`${stringValue}T00:00:00.000Z`) : new Date(stringValue);
    return Number.isNaN(date.getTime()) ? stringValue : date.toISOString();
};

const calculateMultiInvoiceFooter = (invoices: any[]) => {
    const total = (invoices || []).reduce((acc: any, invoice: any) => {
        const footer = invoice?.sInvFooter || {};

        acc.grossAmount += num(footer?.grossAmount || footer?.totalGrossAmount);
        acc.discountAmount += num(footer?.discountAmount || footer?.totalDiscountAmount);
        acc.cgstAmount += num(footer?.cgstAmount || footer?.totalCgstAmount);
        acc.sgstAmount += num(footer?.sgstAmount || footer?.totalSgstAmount);
        acc.igstAmount += num(footer?.igstAmount || footer?.totalIgstAmount);
        acc.taxAmount += num(footer?.taxAmount || footer?.totalTaxAmount);
        acc.netAmount += num(footer?.netAmount || footer?.totalNetAmount);
        acc.balanceAmount += num(footer?.balanceAmount ?? footer?.netAmount ?? footer?.totalNetAmount);
        acc.loadingCharges += num(footer?.loadingCharges);

        return acc;
    }, {
        grossAmount: 0,
        discountAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        taxAmount: 0,
        netAmount: 0,
        balanceAmount: 0,
        loadingCharges: 0,
    });

    return {
        totalInvoices: invoices?.length || 0,
        grossAmount: total.grossAmount.toFixed(2),
        discountAmount: total.discountAmount.toFixed(2),
        cgstAmount: total.cgstAmount.toFixed(2),
        sgstAmount: total.sgstAmount.toFixed(2),
        igstAmount: total.igstAmount.toFixed(2),
        taxAmount: total.taxAmount.toFixed(2),
        netAmount: total.netAmount.toFixed(2),
        balanceAmount: total.balanceAmount.toFixed(2),
        loadingCharges: total.loadingCharges.toFixed(2),
    };
};

const normalizeInvoiceForMultiSalesInvoice = (invoice: any) => {
    const voucherNumber = getInvoiceVoucherNumber(invoice);

    return {
        sInvNo: voucherNumber,
        sInvCustomerCode: invoice?.sInvCustomerCode || "",
        sInvCustomerName: invoice?.sInvCustomerName || "",
        sInvVoucherDate: invoice?.sInvVoucherDate || "",
        sInvStatus: invoice?.sInvStatus || invoice?.sInvDocStatus || "open",
        sOrderNumber: invoice?.sOrderNumber || invoice?.sInvSalesOrderVoucherNumber || invoice?.sInvBody?.find((item: any) => item?.sOrderNumber)?.sOrderNumber || "",
        sInvRemark: invoice?.sInvRemark || invoice?.sInvRemarks || "",
        sInvSalesAccount: invoice?.sInvSalesAccount || "",
        isPosPosting: invoice?.isPosPosting ?? false,
        isAutoPost: invoice?.isAutoPost ?? false,
        customMasters: invoice?.customMasters && typeof invoice.customMasters === "object" ? { ...invoice.customMasters } : {},

        sInvBody: (invoice?.sInvBody || []).map((item: any) => ({
            sOrderNumber: item?.sOrderNumber || "",
            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productType: item?.productType || "",
            productDescription: item?.productDescription || item?.description || "",
            productHSNCode: item?.productHSNCode || "",
            quantity: String(item?.quantity ?? ""),
            uom: item?.uom || item?.unit || "",
            rate: String(item?.rate ?? ""),
            gross: String(item?.gross ?? item?.grossAmount ?? "0"),
            discount: String(item?.discount ?? item?.discountPercentage ?? "0"),
            discountAmount: String(item?.discountAmount ?? "0"),
            cgst: String(item?.cgst ?? item?.cgstPercentage ?? "0"),
            cgstAmount: String(item?.cgstAmount ?? "0"),
            sgst: String(item?.sgst ?? item?.sgstPercentage ?? "0"),
            sgstAmount: String(item?.sgstAmount ?? "0"),
            igst: String(item?.igst ?? item?.igstPercentage ?? "0"),
            igstAmount: String(item?.igstAmount ?? "0"),
            taxAmount: String(item?.taxAmount ?? "0"),
            netAmount: String(item?.netAmount ?? item?.netTotal ?? "0"),
            ...(item?.salesInvoiceBody !== undefined ? { salesInvoiceBody: item.salesInvoiceBody } : {}),
            customMasters: item?.customMasters && typeof item.customMasters === "object" ? { ...item.customMasters } : {},
        })),

        sInvFooter: {
            grossAmount: String(invoice?.sInvFooter?.grossAmount ?? invoice?.sInvFooter?.totalGrossAmount ?? "0"),
            discountAmount: String(invoice?.sInvFooter?.discountAmount ?? invoice?.sInvFooter?.totalDiscountAmount ?? "0"),
            cgstAmount: String(invoice?.sInvFooter?.cgstAmount ?? invoice?.sInvFooter?.totalCgstAmount ?? "0"),
            sgstAmount: String(invoice?.sInvFooter?.sgstAmount ?? invoice?.sInvFooter?.totalSgstAmount ?? "0"),
            igstAmount: String(invoice?.sInvFooter?.igstAmount ?? invoice?.sInvFooter?.totalIgstAmount ?? "0"),
            taxAmount: String(invoice?.sInvFooter?.taxAmount ?? invoice?.sInvFooter?.totalTaxAmount ?? "0"),
            netAmount: String(invoice?.sInvFooter?.netAmount ?? invoice?.sInvFooter?.totalNetAmount ?? "0"),
            balanceAmount: String(invoice?.sInvFooter?.balanceAmount ?? invoice?.sInvFooter?.netAmount ?? invoice?.sInvFooter?.totalNetAmount ?? "0"),
            loadingCharges: String(invoice?.sInvFooter?.loadingCharges ?? "0"),
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

        if (selectedMaster && typeof selectedMaster === "object") return selectedMaster?.code || selectedMaster?.voucherNumber || "";
    }

    return undefined;
};

const mapInvoiceToSchemaRow = (invoice: any, schemaFields: any[]) => {
    const normalizedInvoice = normalizeInvoiceForMultiSalesInvoice(invoice);
    const schemaValues: any = {};

    (schemaFields || []).forEach((field: any) => {
        if (!field?.key) return;

        const value = getSchemaFieldValue(normalizedInvoice, field);

        if (value !== undefined) schemaValues[field.key] = value;
        else if (field?.defaultValue !== undefined && field?.defaultValue !== null) schemaValues[field.key] = field.defaultValue;
        else if (field?.type === "array") schemaValues[field.key] = [];
        else if (field?.type === "object") schemaValues[field.key] = {};
        else schemaValues[field.key] = "";
    });

    return {
        ...schemaValues,
        ...normalizedInvoice,
        sInvBody: normalizedInvoice.sInvBody,
        sInvFooter: normalizedInvoice.sInvFooter,
        customMasters: normalizedInvoice.customMasters,
    };
};

const getSchemaHeaderDefaults = (header: any[] = []) => {
    const defaults: any = {};

    (header || []).forEach((field: any) => {
        if (!field?.key) return;
        if (field?.defaultValue !== undefined && field?.defaultValue !== null) defaults[field.key] = field.defaultValue;
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

const MultiSalesInvoice = () => {
    const dispatch = useDispatch<any>();

    const multiSalesInvoiceState = useSelector((state: any) => state.multiSalesInvoice);
    const { multiSalesInvoices = [], customerSalesInvoices = [], loading = false, createLoading = false, deleteLoading = false, customerInvoicesLoading = false } = multiSalesInvoiceState || {};

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

    const [selectedCustomerCode, setSelectedCustomerCode] = useState("");
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [selectedInvoiceNumbers, setSelectedInvoiceNumbers] = useState<string[]>([]);

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

    const customerAccounts = useMemo(() => {
        return (accounts || []).filter((account: any) => String(account?.accountType || "").trim().toLowerCase() === "customer");
    }, [accounts]);

    const customerOptions = useMemo(() => {
        return [
            { value: "", label: accountsLoading ? "Loading Customers..." : "Select Customer" },
            ...customerAccounts.map((account: any) => ({
                value: String(account?.accountCode || ""),
                label: `${account?.accountName || "-"}${account?.accountCode ? ` (${account.accountCode})` : ""}`,
                raw: account,
            })),
        ];
    }, [customerAccounts, accountsLoading]);

    const multiInvoiceBodyFields = useMemo(() => Array.isArray(templateFields?.body) ? templateFields.body : [], [templateFields?.body]);

    const filteredCustomerInvoices = useMemo(() => {
        const searchText = invoiceSearch.trim().toLowerCase();

        if (!searchText) return customerSalesInvoices || [];

        return (customerSalesInvoices || []).filter((invoice: any) => {
            const values = [
                getInvoiceVoucherNumber(invoice),
                invoice?.sInvCustomerCode,
                invoice?.sInvCustomerName,
                invoice?.sOrderNumber,
                invoice?.sInvSalesOrderVoucherNumber,
                invoice?.sInvRemark,
                invoice?.sInvRemarks,
            ];

            return values.some((value) => String(value || "").toLowerCase().includes(searchText));
        });
    }, [customerSalesInvoices, invoiceSearch]);

    const selectedInvoiceSet = useMemo(() => new Set(selectedInvoiceNumbers), [selectedInvoiceNumbers]);

    const pagination = useMemo(() => {
        const totalDocs = multiSalesInvoices?.length || 0;
        const totalPages = Math.max(Math.ceil(totalDocs / localLimit), 1);
        const currentPage = totalDocs ? Math.floor(localOffset / localLimit) + 1 : 1;

        return {
            ...defaultPagination,
            offset: localOffset,
            limit: localLimit,
            totalDocs,
            totalPages,
            currentPage,
            hasNextPage: localOffset + localLimit < totalDocs,
            hasPrevPage: localOffset > 0,
        };
    }, [multiSalesInvoices, localOffset, localLimit]);

    const listingData = useMemo(() => {
        return (multiSalesInvoices || []).slice(localOffset, localOffset + localLimit);
    }, [multiSalesInvoices, localOffset, localLimit]);

    const footerValues = useMemo(() => {
        const footer = form?.sMultiInvFooter || getDefaultFooter();

        return {
            totalInvoices: footer?.totalInvoices || 0,
            grossAmount: num(footer?.grossAmount),
            discountAmount: num(footer?.discountAmount),
            cgstAmount: num(footer?.cgstAmount),
            sgstAmount: num(footer?.sgstAmount),
            igstAmount: num(footer?.igstAmount),
            taxAmount: num(footer?.taxAmount),
            netAmount: num(footer?.netAmount),
            balanceAmount: num(footer?.balanceAmount),
            loadingCharges: num(footer?.loadingCharges),
        };
    }, [form?.sMultiInvFooter]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || [])
            .filter((field: any) => !isTrueValue(field?.isHidden))
            .map((field: any) => {
                const schemaValue = form?.sMultiInvFooter?.[field?.key];
                const rawValue = schemaValue ?? footerValues[field?.key as keyof typeof footerValues] ?? field?.defaultValue ?? 0;

                return {
                    ...field,
                    value: field?.key === "totalInvoices" ? rawValue : money(rawValue),
                    rawValue,
                };
            });
    }, [templateFields?.footer, footerValues, form?.sMultiInvFooter]);

    const multiInvoiceInputData = useMemo(() => ({
        ...templateFields,
        body: multiInvoiceBodyFields,
        footer: dynamicFooterArray,
    }), [templateFields, multiInvoiceBodyFields, dynamicFooterArray]);

    const fetchMultiSalesInvoices = async () => {
        try {
            await dispatch(getAllMultiSalesInvoice({ status, customerCode: "", search: debouncedSearch }) as any).unwrap();
        }
        catch (error: any) {
            toast.error(error?.message || error || "Failed to load Multi Sales Invoices");
        }
    };

    const columns = [
        {
            key: "sMultiInvVoucherNumber",
            title: "Voucher",
            render: (row: any) => <span className="font-medium text-card-foreground">{row?.sMultiInvVoucherNumber || "-"}</span>,
        },
        {
            key: "sMultiInvVoucherDate",
            title: "Date",
            render: (row: any) => (
                <>
                    {row?.sMultiInvVoucherDate ? formatDateForList(row.sMultiInvVoucherDate) : "-"}
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
            key: "sMultiInvCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">{row?.sMultiInvCustomerName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{row?.sMultiInvCustomerCode || "-"}</div>
                </div>
            ),
        },
        {
            key: "sMultiInvInvoices",
            title: "Invoices",
            render: (row: any) => <span className="font-medium">{row?.sMultiInvFooter?.totalInvoices ?? row?.sMultiInvInvoices?.length ?? 0}</span>,
        },
        {
            key: "grossAmount",
            title: "Gross Amount",
            render: (row: any) => <span className="font-medium">{money(row?.sMultiInvFooter?.grossAmount || 0)}</span>,
            type: "amount",
        },
        {
            key: "taxAmount",
            title: "Tax Amount",
            render: (row: any) => <span className="font-medium">{money(row?.sMultiInvFooter?.taxAmount || 0)}</span>,
            type: "amount",
        },
        {
            key: "netAmount",
            title: "Net Amount",
            render: (row: any) => <span className="font-semibold text-primary">{money(row?.sMultiInvFooter?.netAmount || 0)}</span>,
            type: "amount",
        },
        {
            key: "sMultiInvStatus",
            title: "Status",
            render: (row: any) => {
                const rowStatus = String(row?.sMultiInvStatus || "").toLowerCase();

                return (
                    <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${rowStatus === "open" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger"}`}>
                        {row?.sMultiInvStatus || "-"}
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
            await fetchMultiSalesInvoices();
            toast.success("Multi Sales Invoice list refreshed");
        }
        finally {
            setRefreshing(false);
        }
    };

    const resetSelectionModal = () => {
        setSelectedCustomerCode("");
        setInvoiceSearch("");
        setSelectedInvoiceNumbers([]);
        dispatch(clearCustomerSalesInvoices());
    };

    const resetForm = () => {
        setForm({
            ...getDefaultForm(),
            ...getSchemaHeaderDefaults(templateFields?.header || []),
        });

        setErrors({});
    };

    // const openAddModal = async () => {
    //     resetSelectionModal();
    //     resetForm();

    //     try {
    //         await dispatch(getAllAccounts({ offset: 0, limit: 1000, search: "", accountType: "customer" }) as any).unwrap();
    //     }
    //     catch (error: any) {
    //         toast.error(error?.message || "Failed to load customers");
    //     }

    //     setShowSelectionModal(true);
    // };

    const handleCustomerSelect = async (customerCode: string) => {
        setSelectedCustomerCode(customerCode);
        setSelectedInvoiceNumbers([]);
        setInvoiceSearch("");
        dispatch(clearCustomerSalesInvoices());

        if (!customerCode) return;

        try {
            await dispatch(getSalesInvoicesByCustomerCode(customerCode) as any).unwrap();
        }
        catch (error: any) {
            toast.error(error?.message || error || "Failed to load customer Sales Invoices");
        }
    };

    const handleInvoiceToggle = (invoice: any) => {
        const voucherNumber = getInvoiceVoucherNumber(invoice);
        if (!voucherNumber) return;

        setSelectedInvoiceNumbers((previous) => {
            if (previous.includes(voucherNumber)) return previous.filter((item) => item !== voucherNumber);
            return [...previous, voucherNumber];
        });
    };

    const handleSelectAllInvoices = () => {
        const visibleVoucherNumbers = filteredCustomerInvoices.map(getInvoiceVoucherNumber).filter(Boolean);
        // @ts-ignore
        const allVisibleSelected = visibleVoucherNumbers.length > 0 && visibleVoucherNumbers.every((voucherNumber) => selectedInvoiceSet.has(voucherNumber));

        setSelectedInvoiceNumbers((previous) => {
            if (allVisibleSelected) return previous.filter((voucherNumber) => !visibleVoucherNumbers.includes(voucherNumber));
            return Array.from(new Set([...previous, ...visibleVoucherNumbers]));
        });
    };

    const handleInvoiceSelectionConfirm = () => {
        if (!selectedCustomerCode) {
            toast.error("Please select customer");
            return;
        }

        if (!selectedInvoiceNumbers.length) {
            toast.error("Please select at least one Sales Invoice");
            return;
        }

        const selectedRawInvoices = (customerSalesInvoices || []).filter((invoice: any) => selectedInvoiceSet.has(getInvoiceVoucherNumber(invoice)));

        if (!selectedRawInvoices.length) {
            toast.error("Selected Sales Invoice data not found");
            return;
        }

        const selectedInvoices = selectedRawInvoices.map((invoice: any) => mapInvoiceToSchemaRow(invoice, multiInvoiceBodyFields));
        const selectedCustomer = customerAccounts.find((account: any) => String(account?.accountCode) === String(selectedCustomerCode));
        const firstInvoice = selectedInvoices[0];

        setForm({
            ...getDefaultForm(),
            ...getSchemaHeaderDefaults(templateFields?.header || []),
            sMultiInvVoucherNumber: "AUTO",
            sMultiInvCustomerCode: selectedCustomerCode,
            sMultiInvCustomerName: selectedCustomer?.accountName || firstInvoice?.sInvCustomerName || "",
            sMultiInvVoucherDate: formatDateForInput(todayYMD()),
            sMultiInvStatus: "open",
            sMultiInvRemark: "",
            customMasters: firstInvoice?.customMasters && typeof firstInvoice.customMasters === "object" ? { ...firstInvoice.customMasters } : {},
            sMultiInvInvoices: selectedInvoices,
            sMultiInvFooter: calculateMultiInvoiceFooter(selectedInvoices),
        });

        setErrors({});
        setShowSelectionModal(false);
        setShowForm(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((previous: any) => ({ ...previous, [key]: value }));
        setErrors((previous: any) => ({ ...previous, [key]: "" }));
    };

    const handleDeleteSelectedInvoice = (index: number) => {
        setForm((previous: any) => {
            const deletedInvoice = previous?.sMultiInvInvoices?.[index];
            const deletedVoucherNumber = getInvoiceVoucherNumber(deletedInvoice);

            if (deletedVoucherNumber) {
                setSelectedInvoiceNumbers((selectedPrevious) => selectedPrevious.filter((voucherNumber) => voucherNumber !== deletedVoucherNumber));
            }

            const invoices = (previous?.sMultiInvInvoices || []).filter((_: any, rowIndex: number) => rowIndex !== index);

            return {
                ...previous,
                sMultiInvInvoices: invoices,
                sMultiInvFooter: calculateMultiInvoiceFooter(invoices),
            };
        });
    };

    const handleInvoiceRowChange = (index: number, key: string, value: any) => {
        setForm((previous: any) => {
            const invoices = [...(previous?.sMultiInvInvoices || [])];
            if (!invoices[index]) return previous;

            invoices[index] = { ...invoices[index], [key]: value };

            return {
                ...previous,
                sMultiInvInvoices: invoices,
                sMultiInvFooter: calculateMultiInvoiceFooter(invoices),
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

            if (value === undefined || value === null || value === "") {
                validationErrors[field.key] = `${field?.label || field?.title || field?.key} is required`;
            }
        });

        if (!form?.sMultiInvCustomerCode) validationErrors.sMultiInvCustomerCode = "Customer is required";
        if (!(form?.sMultiInvInvoices || []).length) validationErrors.sMultiInvInvoices = "Please select at least one Sales Invoice";

        (form?.sMultiInvInvoices || []).forEach((invoice: any, rowIndex: number) => {
            (multiInvoiceBodyFields || []).forEach((field: any) => {
                if (isTrueValue(field?.isHidden)) return;
                if (!isTrueValue(field?.isRequired)) return;

                const value = invoice?.[field?.key];

                if (value === undefined || value === null || value === "") {
                    validationErrors[`row_${rowIndex}_${field.key}`] = `${field?.label || field?.title || field?.key} is required`;
                }
            });
        });

        setErrors(validationErrors);

        if (validationErrors.sMultiInvInvoices) toast.error(validationErrors.sMultiInvInvoices);

        return Object.keys(validationErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const invoices = (form?.sMultiInvInvoices || []).map((invoice: any) => ({
            ...invoice,
            sInvVoucherDate: toIsoDate(invoice?.sInvVoucherDate),
        }));

        const payload = {
            sMultiInvCustomerCode: form?.sMultiInvCustomerCode || "",
            sMultiInvCustomerName: form?.sMultiInvCustomerName || "",
            sMultiInvVoucherDate: toIsoDate(form?.sMultiInvVoucherDate),
            sMultiInvStatus: form?.sMultiInvStatus || "open",
            sMultiInvRemark: form?.sMultiInvRemark || "",
            customMasters: form?.customMasters && typeof form.customMasters === "object" ? form.customMasters : {},
            sMultiInvInvoices: invoices,
            sMultiInvFooter: calculateMultiInvoiceFooter(invoices),
        };

        try {
            await dispatch(createMultiSalesInvoice({ payload }) as any).unwrap();

            toast.success("Multi Sales Invoice created successfully");

            setShowForm(false);
            resetForm();
            resetSelectionModal();

            await fetchMultiSalesInvoices();
        }
        catch (error: any) {
            toast.error(error?.message || error || "Failed to create Multi Sales Invoice");
        }
    };

    const handleDeleteClick = (event: any, record: any) => {
        const rect = event.currentTarget.getBoundingClientRect();

        let x = rect.left - 150;
        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({
            show: true,
            x,
            y,
            voucherNumber: record?.sMultiInvVoucherNumber,
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.voucherNumber) {
                toast.error("Multi Sales Invoice voucher number not found");
                return;
            }

            await dispatch(deleteMultiSalesInvoice(confirmTooltip.voucherNumber) as any).unwrap();

            toast.success("Multi Sales Invoice deleted successfully");

            await fetchMultiSalesInvoices();
        }
        catch (error: any) {
            toast.error(error?.message || error || "Failed to delete Multi Sales Invoice");
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
        dispatch(getAllTransactionSchema("multiSalesInvoice") as any);
    }, [dispatch]);

    useEffect(() => {
        const prepareFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema = Array.isArray(transactionsSchema?.header) || Array.isArray(transactionsSchema?.body) || Array.isArray(transactionsSchema?.footer);
            if (!hasSchema) return;

            try {
                setFieldsLoading(true);
  
                const updatedFields = await loadAllTemplateOptions(transactionsSchema);

                setTemplateFields(updatedFields);

                setForm((previous: any) => ({
                    ...getSchemaHeaderDefaults(updatedFields?.header || []),
                    ...previous,
                }));
            }
            catch (error) {
                console.log("Failed to prepare Multi Sales Invoice fields", error);
            }
            finally {
                setFieldsLoading(false);
            }
        };

        void prepareFields();
    }, [transactionsSchema]);

    useEffect(() => {
        fetchMultiSalesInvoices();
    }, [status, debouncedSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const totalDocs = multiSalesInvoices?.length || 0;

        if (localOffset > 0 && localOffset >= totalDocs) {
            setLocalOffset(Math.max(0, Math.floor(Math.max(totalDocs - 1, 0) / localLimit) * localLimit));
        }
    }, [multiSalesInvoices?.length, localLimit]);

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="multi-sales-invoice-header" className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div id="multi-sales-invoice-summary" className="flex items-start gap-3">
                    <Badge {...{
                        count: multiSalesInvoices?.length || 0,
                        text: "Total Multi Sales Invoices:",
                        varient: "primary",
                    }} />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Toggle {...{
                        arr: ["open", "close"],
                        state: status,
                        setState: handleStatusChange,
                    }} />

                    <SearchInput {...{ search, setSearch }} />

                    <DataREfreshButton {...{
                        callBackFn: handleRefresh,
                        loading: refreshing,
                    }} />

                    {/* @ts-ignore */}
                    {/* <DataCreateButton {...{
                        callBackFn: openAddModal,
                        text: "Add Multi Sales Invoice",
                    }} /> */}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={listingData}
                loading={loading}
                emptyMessage={`No ${status} Multi Sales Invoice found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <Permission module="bookez" permissionKey="multiSalesInvoice" action="delete">
                            <button
                                id="multi-sales-invoice-delete-button"
                                disabled={deleteLoading}
                                onClick={(event) => handleDeleteClick(event, record)}
                                className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </Permission>
                    </div>
                )}
            />

            {pagination.totalDocs > 0 && (
                <Pagination {...{
                    localLimit,
                    selectCb: (event: any) => {
                        setLocalLimit(Number(event.target.value));
                        setLocalOffset(0);
                    },
                    preDisabled: !pagination.hasPrevPage,
                    nextDisabled: !pagination.hasNextPage,
                    setLocalOffset,
                    pagination,
                }} />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this Multi Sales Invoice?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmTooltip({
                        show: false,
                        x: null,
                        y: null,
                        voucherNumber: null,
                    })}
                />
            )}

            <Modal
                show={showSelectionModal}
                setShow={setShowSelectionModal}
                title="Select Sales Invoices"
                state={false}
                handleSubmit={handleInvoiceSelectionConfirm}
                handleClose={() => {
                    setShowSelectionModal(false);
                    resetSelectionModal();
                }}
                gridCols={1}
                maxWidth="5xl"
                modalClassName="rounded-xl"
                headerClassName="bg-card"
                footerClassName="bg-card"
                bodyClassName="!block !p-0 bg-card text-card-foreground"
                // @ts-ignore
                cancelText="Cancel"
                confirmText={`Continue${selectedInvoiceNumbers.length ? ` (${selectedInvoiceNumbers.length})` : ""}`}
                body={
                    <div className="flex h-[620px] flex-col bg-card text-card-foreground">
                        <div className="border-b border-border p-4">
                            <SelectInput
                                label="Customer"
                                mandatory
                                value={selectedCustomerCode}
                                placeholder={accountsLoading ? "Loading Customers..." : "Select Customer"}
                                disabled={accountsLoading}
                                largeData
                                batchSize={100}
                                options={customerOptions}
                                onChange={(event: any) => handleCustomerSelect(event?.target?.value || "")}
                            />
                        </div>
 
                        {selectedCustomerCode && (
                            <div className="flex items-center gap-2 border-b border-border p-4">
                                <input
                                    value={invoiceSearch}
                                    onChange={(event) => setInvoiceSearch(event.target.value)}
                                    placeholder="Search Sales Invoice..."
                                    className="min-w-0 flex-1 rounded-md border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />

                                <button
                                    type="button"
                                    onClick={handleSelectAllInvoices}
                                    disabled={!filteredCustomerInvoices.length}
                                    className="cursor-pointer whitespace-nowrap rounded-md border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {filteredCustomerInvoices.length > 0 && filteredCustomerInvoices.every((invoice: any) => selectedInvoiceSet.has(getInvoiceVoucherNumber(invoice))) ? "Unselect All" : "Select All"}
                                </button>

                                <Badge {...{
                                    count: selectedInvoiceNumbers.length,
                                    text: "Selected:",
                                    varient: "primary",
                                }} />
                            </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            {!selectedCustomerCode ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Select a customer to load Sales Invoices
                                </div> 
                            ) : customerInvoicesLoading ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Loading Sales Invoices...
                                </div>
                            ) : !filteredCustomerInvoices.length ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    No Sales Invoice found for selected customer
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredCustomerInvoices.map((invoice: any, index: number) => {
                                        const voucherNumber = getInvoiceVoucherNumber(invoice);
                                        const selected = selectedInvoiceSet.has(voucherNumber);

                                        return (
                                            <button
                                                key={voucherNumber || index}
                                                type="button"
                                                onClick={() => handleInvoiceToggle(invoice)}
                                                className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-left transition-all duration-200 ${selected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"}`}
                                            >
                                                <span className={selected ? "text-primary" : "text-muted-foreground"}>
                                                    {selected ? <CheckSquare size={19} /> : <Square size={19} />}
                                                </span>

                                                <span className={`text-sm font-semibold ${selected ? "text-primary" : "text-card-foreground"}`}>
                                                    {voucherNumber || "-"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                }
            />

            {!fieldsLoading && (
                <DynamicAddForm {...{
                    show: showForm,
                    setShow: setShowForm,
                    edit: false,
                    title: "Multi Sales Invoice",
                    subtitle: `${form?.sMultiInvInvoices?.length || 0} Sales Invoice${form?.sMultiInvInvoices?.length === 1 ? "" : "s"} selected`,
                    loading: createLoading,

                    onClose: () => {
                        setShowForm(false);
                        resetForm();
                    },

                    onSubmit: handleSubmit,
                    form,
                    errors,
                    inputData: multiInvoiceInputData,
                    bodyKey: "sMultiInvInvoices",
                    handleChange: handleMainChange,

                    customBody: (
                        <MultiInvoiceEditableTable
                            invoices={form?.sMultiInvInvoices || []}
                            schema={templateFields?.body || []}
                            errors={errors}
                            readonly={true}
                            showDelete={true}
                            title="Sales Invoices"
                            onDeleteInvoice={handleDeleteSelectedInvoice}
                            onInvoiceChange={handleInvoiceRowChange}
                        />
                    ),
                }} />
            )}
        </div>
    );
};

export default MultiSalesInvoice;