import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
    formatDateForInput,
    formatDateForList,
    loadAllTemplateOptions,
    money,
    num,
    todayYMD,
} from "../../../../utils/helperFunctions";

import { getAllTransactionSchema } from "../../../../redux/slices/professionalSlice/transactionSchema";

import Badge from "../../../../components/badge";
import Toggle from "../../../../components/toggle";
import SearchInput from "../../../../components/searchInput";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";

import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../components/buttons";

import ModulePageSkeleton from "../../../../components/skeleton/SkeletonLoader";

import {
    addPayment,
    deletePayment,
    getAllPayment,
    updatePayment,
} from "../../../../redux/slices/professionalSlice/purchaseWorkflow/paymentSlice";

import {
    GetVendorWisePurchaseInvoiceList,
    updatePurchaseInvoice,
} from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";

import Permission from "../../../../components/PermissionGuard";
import professionalAxios from "../../../../services/professionalAxios";
import { ListingModel } from "../../../../components/modal";
import { getAllReportMapping } from "../../../../redux/slices/professionalSlice/reportMappingSlice";

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const emptyPaymentRow = {
    id: Date.now(),
    accountCode: "",
    accountName: "",
    amount: "",
    netAmount: "",
    references: [],
    remarks: "",
};

const emptyReferenceRow = {
    id: Date.now(),
    purchaseInvoice: "",
    docDate: "",
    netAmount: "",
    remainingBillAmount: "",
    adjustedAmount: "",
};

const getDefaultForm = () => ({
    payVoucherNumber: "AUTO",
    payVoucherDate: todayYMD(),

    payAccountCode: "",
    payAccountName: "",

    payStatus: "open",
    payRemark: "",

    paymentMode: "",
    bankReferenceNumber: "",
    paidBy: "",

    payBody: [{ ...emptyPaymentRow, id: Date.now() }],

    netAmount: "0.00",
    adjustedAmount: "0.00",
    balanceAmount: "0.00",
});

/* ===================================================
   PAYMENT
=================================================== */

const Payment = () => {
    const dispatch = useDispatch();
    const paymentState = useSelector((state: any) => state.payment);
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema);
    const payments = paymentState?.payments || paymentState?.paymentList || paymentState?.paymentRecords || paymentState?.paymentData || paymentState?.payData || [];
    const pagination = paymentState?.pagination || defaultPagination;
    const loading = paymentState?.loading || paymentState?.listingLoader || false;
    const createLoading = paymentState?.createLoading || paymentState?.addLoader || false;
    const updateLoading = paymentState?.updateLoading || paymentState?.updateLoader || false;
    const deleteLoading = paymentState?.deleteLoading || paymentState?.deleteLoader || false;
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState("open");
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const { report } = useSelector((s: any) => s.reportMapping);
    const [downlaodPDF, setDownlaodPDF]: any = useState({ show: false, type: "" });
    const [templateFields, setTemplateFields] = useState<any>({ header: [], body: [], footer: [], });
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [showReferenceModal, setShowReferenceModal] = useState(false);
    const [selectedReferenceRowIndex, setSelectedReferenceRowIndex] = useState<number | null>(null);
    const [referenceRows, setReferenceRows] = useState<any[]>([]);
    const [referenceError, setReferenceError] = useState("");
    const [referenceLoading, setReferenceLoading] = useState(false);
    const [confirmTooltip, setConfirmTooltip] = useState<any>({ show: false, x: null, y: null, voucherNumber: null, });

    const getRecords = (res: any) => {
        return Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.docs)
                    ? res.docs
                    : Array.isArray(res?.data?.items)
                        ? res.data.items
                        : Array.isArray(res?.data?.records)
                            ? res.data.records
                            : Array.isArray(res?.data?.docs)
                                ? res.data.docs
                                : Array.isArray(res?.data)
                                    ? res.data
                                    : Array.isArray(res)
                                        ? res
                                        : [];
    };

    /* ===================================================
       FIELD HELPERS
    =================================================== */

    const getHeaderFieldByKey = (key: string) => {
        return templateFields?.header?.find((field: any) => field.key === key);
    };

    const getBodyFieldByKey = (key: string) => {
        return templateFields?.body?.find((field: any) => field.key === key);
    };

    const getOptionByValue = (field: any, selectedValue: any) => {
        return field?.options?.find(
            (opt: any) => String(opt.value) === String(selectedValue)
        );
    };

    const applyMappedFields = (
        field: any,
        selectedValue: any,
        oldData: any
    ) => {
        if (!field) return oldData;

        const selectedOption = getOptionByValue(field, selectedValue);

        const updated = {
            ...oldData,
            [field.key]: selectedValue,
        };

        if (field?.mapFields && selectedOption?.raw) {
            Object.entries(field.mapFields).forEach(
                ([targetKey, sourceKey]) => {
                    updated[targetKey] =
                        selectedOption.raw?.[sourceKey as string] ?? "";
                }
            );
        }

        return updated;
    };

    /* ===================================================
       BODY FIELDS WITHOUT REFERENCES
    =================================================== */

    const bodyFieldsWithoutReference = useMemo(() => {
        return (templateFields?.body || []).filter((field: any) => {
            const key = String(field?.key || "").toLowerCase();

            return ![
                "reference",
                "references",
                "referencebody",
                "referencelist",
            ].includes(key);
        });
    }, [templateFields?.body]);

    /* ===================================================
       REFERENCE TABLE FIELDS
    =================================================== */

    const referenceTableFields = useMemo(() => {
        return [
            {
                key: "purchaseInvoice",
                label: "Purchase Invoice",
                type: "text",
                isReadOnly: true,
            },
            {
                key: "docDate",
                label: "Doc Date",
                type: "date",
                isReadOnly: true,
            },
            {
                key: "netAmount",
                label: "Net Bill Amount",
                type: "text",
                isReadOnly: true,
            },
            {
                key: "remainingBillAmount",
                label: "Remaining Bill Amount",
                type: "text",
                isReadOnly: true,
            },
            {
                key: "adjustedAmount",
                label: "Adjusted Amount",
                type: "number",
                isRequired: true,
            },
        ];
    }, []);

    /* ===================================================
       PURCHASE INVOICE NORMALIZERS
    =================================================== */

    const normalizePurchaseInvoiceDoc = (raw: any) => {
        if (!raw || typeof raw !== "object") return {};

        const inner = raw?.invoice || raw?.data || raw?.purchaseInvoice;
        const merged = { ...raw };

        if (inner && typeof inner === "object") {
            Object.assign(merged, inner);
        }

        return merged;
    };

    const getInvoiceNumber = (invoice: any) => {
        const doc = normalizePurchaseInvoiceDoc(invoice);

        return (
            doc?.pInvVoucherNumber ||
            doc?.purchaseInvoice ||
            doc?.purchaseInvoiceNumber ||
            doc?.purchaseInvoiceNo ||
            doc?.voucherNumber ||
            doc?.invoiceNumber ||
            doc?.docNumber ||
            ""
        );
    };

    const getInvoiceDate = (invoice: any) => {
        const doc = normalizePurchaseInvoiceDoc(invoice);

        return (
            doc?.pInvVoucherDate ||
            doc?.purchaseInvoiceDate ||
            doc?.voucherDate ||
            doc?.invoiceDate ||
            doc?.docDate ||
            doc?.billDueDate ||
            ""
        );
    };

    const getInvoiceNetAmount = (invoice: any) => {
        const doc = normalizePurchaseInvoiceDoc(invoice);

        return num(
            doc?.pInvFooter?.netAmount ||
            doc?.purchaseInvoiceFooter?.netAmount ||
            doc?.footer?.netAmount ||
            doc?.netAmount ||
            doc?.billAmount ||
            doc?.amount ||
            0
        );
    };

    const getInvoiceAdjustedAmount = (invoice: any) => {
        const doc = normalizePurchaseInvoiceDoc(invoice);

        return num(
            doc?.pInvFooter?.adjustedAmount ||
            doc?.purchaseInvoiceFooter?.adjustedAmount ||
            doc?.footer?.adjustedAmount ||
            doc?.adjustedAmount ||
            0
        );
    };

    const getInvoiceRemainingAmount = (invoice: any) => {
        const doc = normalizePurchaseInvoiceDoc(invoice);

        const netAmount = getInvoiceNetAmount(doc);
        const adjustedAmount = getInvoiceAdjustedAmount(doc);

        const storedBalance = num(
            doc?.pInvFooter?.balanceAmount ??
            doc?.pInvFooter?.remainingAmount ??
            doc?.pInvFooter?.remainingBillAmount ??
            doc?.purchaseInvoiceFooter?.balanceAmount ??
            doc?.purchaseInvoiceFooter?.remainingAmount ??
            doc?.footer?.balanceAmount ??
            doc?.footer?.remainingAmount ??
            doc?.remainingBillAmount ??
            doc?.remainingAmount ??
            doc?.balanceAmount ??
            doc?.pendingAmount ??
            NaN
        );

        if (Number.isFinite(storedBalance) && storedBalance >= 0) {
            return storedBalance;
        }

        return netAmount - adjustedAmount;
    };

    const hasSavedReferences = (row: any) => {
        return (
            Array.isArray(row?.references) &&
            row.references.some((ref: any) => {
                return (
                    ref?.purchaseInvoice ||
                    ref?.newReference ||
                    num(ref?.adjustedAmount) > 0
                );
            })
        );
    };

    const getReferenceActionText = (row: any) => {
        return hasSavedReferences(row) ? "Edit Reference" : "Add Reference";
    };

    /* ===================================================
       PAYMENT TOTALS
    =================================================== */

    const calculateFooter = (rows: any[]) => {
        return (rows || []).reduce(
            (acc: any, row: any) => {
                const amount = num(row?.amount || row?.netAmount);
                const netAmount = num(row?.netAmount || row?.amount);

                const adjustedAmount = Array.isArray(row?.references)
                    ? row.references.reduce((sum: number, ref: any) => {
                        return sum + num(ref?.adjustedAmount);
                    }, 0)
                    : 0;

                acc.netAmount += netAmount || amount;
                acc.adjustedAmount += adjustedAmount;

                return acc;
            },
            {
                netAmount: 0,
                adjustedAmount: 0,
                balanceAmount: 0,
            }
        );
    };

    const footerTotals = useMemo(() => {
        const totals = calculateFooter(form.payBody || []);

        return {
            ...totals,
            balanceAmount: totals.netAmount - totals.adjustedAmount,
        };
    }, [form.payBody]);

    const selectedReferenceRow = useMemo(() => {
        if (selectedReferenceRowIndex === null) return null;

        return form?.payBody?.[selectedReferenceRowIndex] || null;
    }, [form?.payBody, selectedReferenceRowIndex]);

    const selectedReferenceMaxAmount = useMemo(() => {
        return num(
            selectedReferenceRow?.netAmount ||
            selectedReferenceRow?.amount ||
            0
        );
    }, [selectedReferenceRow]);

    const referenceTotalAdjusted = useMemo(() => {
        return (referenceRows || []).reduce((sum: number, row: any) => {
            return sum + num(row?.adjustedAmount);
        }, 0);
    }, [referenceRows]);

    const newReferenceAmount = useMemo(() => {
        return selectedReferenceMaxAmount - referenceTotalAdjusted;
    }, [selectedReferenceMaxAmount, referenceTotalAdjusted]);

    /* ===================================================
       API CALLS
    =================================================== */

    const fetchPayments = async () => {
        await dispatch(
            getAllPayment({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status,
            }) as any
        );
    };

    const fetchPurchaseInvoicesByAccount = async (selectedRow: any) => {
        const accountCode = selectedRow?.accountCode;

        if (!accountCode) {
            toast.error("Please select account first");
            return [];
        }

        try {
            setReferenceLoading(true);

            const res: any = await dispatch(
                GetVendorWisePurchaseInvoiceList({
                    vendorCode: accountCode,
                } as any) as any
            ).unwrap();

            const records = getRecords(res);

            return Array.isArray(records) ? records : [];
        } catch (error) {
            console.log("Failed to load purchase invoices", error);
            toast.error("Failed to load purchase invoices");
            return [];
        } finally {
            setReferenceLoading(false);
        }
    };

    useEffect(() => {
        dispatch(getAllTransactionSchema("payment") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchPayments();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    /* ===================================================
       LOAD TRANSACTION SCHEMA WITH API OPTIONS
    =================================================== */

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

                const updatedData = await loadAllTemplateOptions(transactionsSchema, {
                    header: { accountType: "bank" },
                    body: { accountType: "vendor" },
                });

                setTemplateFields(updatedData);
            } catch (error) {
                console.log("Failed to prepare payment fields", error);
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    /* ===================================================
       LIST COLUMNS
    =================================================== */

    const columns = [
        {
            key: "payVoucherNumber",
            title: "Voucher No",
        },
        {
            key: "payVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.payVoucherDate
                    ? formatDateForList(row.payVoucherDate)
                    : "-",
        },
        {
            key: "payAccountName",
            title: "Cash/Account Name",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.payAccountName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {row?.payAccountCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "payBody",
            title: "Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.payFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "payStatus",
            title: "Status",
            render: (row: any) => (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {row?.payStatus || "-"}
                </span>
            ),
        },
    ];

    /* ===================================================
       ACTIONS
    =================================================== */

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchPayments();
            toast.success("Payment list refreshed");
        } finally {
            setRefreshing(false);
        }
    };

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
    };

    const openAddModal = () => {
        resetMainForm();
        setShowModal(true);
    };

    const openEditModal = (record: any) => {
        const footer = record?.payFooter || {};

        const body =
            record?.payBody?.length > 0
                ? record.payBody.map((row: any) => ({
                    id: row?._id || Date.now() + Math.random(),

                    accountCode: row?.accountCode || "",
                    accountName: row?.accountName || "",

                    amount: row?.amount || row?.netAmount || "",
                    netAmount: row?.netAmount || row?.amount || "",

                    references: Array.isArray(row?.references)
                        ? row.references
                        : [],

                    remarks: row?.remarks || "",
                }))
                : [{ ...emptyPaymentRow, id: Date.now() }];

        setEditingRecord(record);
        setErrors({});

        setForm({
            payVoucherNumber:
                record?.payVoucherNumber ||
                record?.paymentVoucherNumber ||
                record?.voucherNumber ||
                "",

            payVoucherDate: formatDateForInput(record?.payVoucherDate),

            payAccountCode: record?.payAccountCode || "",
            payAccountName: record?.payAccountName || "",

            payStatus: record?.payStatus || "open",
            payRemark: record?.payRemark || "",

            paymentMode: record?.paymentMode || "",
            bankReferenceNumber: record?.bankReferenceNumber || "",
            paidBy: record?.paidBy || "",

            payBody: body,

            netAmount: footer?.netAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount: footer?.balanceAmount || "0.00",
        });

        setShowModal(true);
    };

    /* ===================================================
       DYNAMIC HEADER CHANGE
    =================================================== */

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const currentField = getHeaderFieldByKey(key);

            let updated = {
                ...prev,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updated = applyMappedFields(currentField, value, updated);
            }

            return updated;
        });

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    /* ===================================================
       BODY ROW CHANGE
    =================================================== */

    const handleAddRow = () => {
        setForm((prev: any) => ({
            ...prev,
            payBody: [
                ...(prev.payBody || []),
                {
                    ...emptyPaymentRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedRows = (prev.payBody || []).filter(
                (_: any, i: number) => i !== index
            );

            return {
                ...prev,
                payBody:
                    updatedRows.length > 0
                        ? updatedRows
                        : [{ ...emptyPaymentRow, id: Date.now() }],
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const updatedRows = [...(prev.payBody || [])];

            const currentRow = updatedRows[index] || {};
            const currentField = getBodyFieldByKey(key);

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(
                    currentField,
                    value,
                    updatedRow
                );
            }

            if (key === "accountCode" || key === "accountName") {
                updatedRow.references = [];
            }

            if (key === "amount") {
                updatedRow.netAmount = value;
                updatedRow.references = [];
            }

            if (key === "netAmount") {
                updatedRow.amount = value;
                updatedRow.references = [];
            }

            updatedRows[index] = updatedRow;

            return {
                ...prev,
                payBody: updatedRows,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            payBody: "",
            [`row_${index}_${key}`]: "",
        }));
    };

    /* ===================================================
       REFERENCE MODAL HANDLERS
    =================================================== */

    const handleOpenReferenceModal = async (rowIndex: number) => {
        const selectedRow = form?.payBody?.[rowIndex];

        if (!selectedRow) {
            toast.error("Payment row not found");
            return;
        }

        if (!selectedRow?.accountCode) {
            toast.error("Please select account first");
            return;
        }

        if (!selectedRow?.amount && !selectedRow?.netAmount) {
            toast.error("Please enter amount first");
            return;
        }

        setSelectedReferenceRowIndex(rowIndex);
        setReferenceError("");
        setReferenceRows([]);
        setShowReferenceModal(true);

        const existingReferences = Array.isArray(selectedRow?.references)
            ? selectedRow.references
            : [];

        const existingReferenceMap = new Map<string, any>(
            existingReferences
                .filter((ref: any) => {
                    return (
                        String(ref?.referenceType || "PINV").toUpperCase() ===
                        "PINV" && ref?.purchaseInvoice
                    );
                })
                .map((ref: any) => [String(ref.purchaseInvoice), ref])
        );

        const purchaseInvoices = await fetchPurchaseInvoicesByAccount(selectedRow);

        const openPurchaseInvoices = (purchaseInvoices || []).filter(
            (invoice: any) => {
                const invoiceNo = getInvoiceNumber(invoice);
                const existingRef = existingReferenceMap.get(String(invoiceNo));

                const remainingAmount =
                    getInvoiceRemainingAmount(invoice) +
                    num(existingRef?.adjustedAmount || 0);

                return remainingAmount > 0;
            }
        );

        if (!openPurchaseInvoices || openPurchaseInvoices.length === 0) {
            setReferenceRows([]);
            return;
        }

        const mappedReferences = openPurchaseInvoices.map((invoice: any) => {
            const purchaseInvoice = getInvoiceNumber(invoice);

            const existingRef = existingReferenceMap.get(String(purchaseInvoice));

            const remainingBillAmount =
                getInvoiceRemainingAmount(invoice) +
                num(existingRef?.adjustedAmount || 0);

            return {
                id: invoice?._id || Date.now() + Math.random(),

                referenceType: "PINV",
                purchaseInvoice,
                docDate: formatDateForInput(getInvoiceDate(invoice)),

                billDueDate: formatDateForInput(getInvoiceDate(invoice)),
                billAmount: String(getInvoiceNetAmount(invoice)),
                netAmount: String(getInvoiceNetAmount(invoice)),

                remainingBillAmount: String(remainingBillAmount),

                adjustedAmount:
                    existingRef?.adjustedAmount !== undefined
                        ? String(existingRef.adjustedAmount)
                        : "",
            };
        });

        setReferenceRows(mappedReferences);
    };

    const handleReferenceRowChange = (
        index: number,
        key: string,
        value: any
    ) => {
        setReferenceRows((prev: any[]) => {
            const updatedRows = [...prev];

            updatedRows[index] = {
                ...updatedRows[index],
                [key]: value,
            };

            return updatedRows;
        });

        setReferenceError("");
    };

    const handleAddReferenceRow = () => {
        setReferenceRows((prev: any[]) => [
            ...prev,
            {
                ...emptyReferenceRow,
                id: Date.now(),
            },
        ]);
    };

    const handleDeleteReferenceRow = (index: number) => {
        setReferenceRows((prev: any[]) => {
            return prev.filter((_row: any, i: number) => i !== index);
        });
    };

    const handleCloseReferenceModal = () => {
        setShowReferenceModal(false);
        setSelectedReferenceRowIndex(null);
        setReferenceRows([]);
        setReferenceError("");
        setReferenceLoading(false);
    };

    const buildNewReferenceRow = (amount: number) => ({
        referenceType: "NEW",
        newReference: "ADV",
        billDueDate: "",
        billAmount: String(amount),
        adjustedAmount: String(amount),
    });

    const handleSaveReferences = () => {
        if (selectedReferenceRowIndex === null) {
            toast.error("Payment row not selected");
            return;
        }

        const maxAmount = selectedReferenceMaxAmount;

        let referencesToSave: any[] = [];

        const hasInvoiceList =
            Array.isArray(referenceRows) &&
            referenceRows.some((row: any) => {
                return (
                    String(row?.referenceType || "PINV").toUpperCase() === "PINV" &&
                    row?.purchaseInvoice
                );
            });

        if (hasInvoiceList) {
            const rowsWithAdjustedAmount = (referenceRows || []).filter(
                (row: any) => num(row?.adjustedAmount) > 0
            );

            if (rowsWithAdjustedAmount.length === 0) {
                toast.error("Please enter adjusted amount in at least one invoice");
                return;
            }

            for (const row of rowsWithAdjustedAmount) {
                const adjustedAmount = num(row?.adjustedAmount);
                const remainingBillAmount = num(row?.remainingBillAmount);

                if (adjustedAmount <= 0) {
                    toast.error("Adjusted amount should be greater than 0");
                    return;
                }

                if (adjustedAmount > remainingBillAmount) {
                    toast.error(
                        `Adjusted amount cannot exceed remaining amount ${money(remainingBillAmount)} for ${row?.purchaseInvoice}`
                    );
                    return;
                }
            }

            referencesToSave = rowsWithAdjustedAmount.map((row: any) => {
                return {
                    referenceType: "PINV",
                    purchaseInvoice: row?.purchaseInvoice || "",
                    docDate: row?.docDate || "",
                    billDueDate: row?.billDueDate || row?.docDate || "",
                    billAmount: String(row?.billAmount || row?.netAmount || 0),
                    netAmount: String(row?.netAmount || row?.billAmount || 0),
                    remainingBillAmount: String(row?.remainingBillAmount || 0),
                    adjustedAmount: String(row?.adjustedAmount || 0),
                };
            });
        } else {
            referencesToSave = [buildNewReferenceRow(maxAmount)];
        }

        const totalAdjusted = referencesToSave.reduce(
            (sum: number, row: any) => sum + num(row?.adjustedAmount),
            0
        );

        if (totalAdjusted <= 0) {
            toast.error("Reference amount should be greater than 0");
            return;
        }

        if (Math.abs(totalAdjusted - maxAmount) > 0.01) {
            const message = `Reference adjusted amount must be same as body amount ${money(maxAmount)}`;
            setReferenceError(message);
            toast.error(message);
            return;
        }

        setForm((prev: any) => {
            const updatedRows = [...(prev.payBody || [])];

            updatedRows[selectedReferenceRowIndex] = {
                ...updatedRows[selectedReferenceRowIndex],
                references: referencesToSave,
            };

            return {
                ...prev,
                payBody: updatedRows,
            };
        });

        handleCloseReferenceModal();
    };

    /* ===================================================
       VALIDATION
    =================================================== */

    const getFilledRows = () => {
        const bodyKeys = (bodyFieldsWithoutReference || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => field.key);

        return (form.payBody || []).filter((row: any) => {
            return bodyKeys.some((key: string) => {
                const value = row?.[key];

                return value !== undefined && value !== null && value !== "";
            });
        });
    };

    const validateForm = () => {
        const err: any = {};

        (templateFields?.header || []).forEach((field: any) => {
            if (field.isHidden) return;
            if (!field.isRequired) return;

            const value = form?.[field.key];

            if (value === undefined || value === null || value === "") {
                err[field.key] = `${field.label || field.key} is required`;
            }
        });

        const filledRows = getFilledRows();

        if (filledRows.length === 0) {
            err.payBody = "Please add at least one payment row";
        }

        (form.payBody || []).forEach((row: any, index: number) => {
            const hasAnyValue = (bodyFieldsWithoutReference || []).some(
                (field: any) => {
                    const value = row?.[field.key];

                    return value !== undefined && value !== null && value !== "";
                }
            );

            if (!hasAnyValue) return;

            (bodyFieldsWithoutReference || []).forEach((field: any) => {
                if (field.isHidden) return;
                if (!field.isRequired) return;

                const value = row?.[field.key];

                if (value === undefined || value === null || value === "") {
                    err[`row_${index}_${field.key}`] =
                        `${field.label || field.key} is required`;
                }
            });

            const rowAmount = num(row?.netAmount || row?.amount || 0);

            const hasReferences =
                Array.isArray(row?.references) && row.references.length > 0;

            const referenceAdjusted = hasReferences
                ? row.references.reduce((sum: number, ref: any) => {
                    return sum + num(ref?.adjustedAmount);
                }, 0)
                : 0;

            if (!hasReferences || referenceAdjusted <= 0) {
                err[`row_${index}_references`] = "Please add reference first";
                return;
            }

            if (referenceAdjusted > rowAmount) {
                err[`row_${index}_references`] =
                    `Reference total cannot exceed ${money(rowAmount)}`;
                return;
            }

            if (Math.abs(referenceAdjusted - rowAmount) > 0.01) {
                err[`row_${index}_references`] =
                    `Reference adjusted amount must be same as body amount ${money(rowAmount)}`;
            }
        });

        setErrors(err);

        if (err.payBody) {
            toast.error(err.payBody);
        }

        const referenceErrorKey = Object.keys(err).find((key) =>
            key.includes("_references")
        );

        if (referenceErrorKey) {
            toast.error(err[referenceErrorKey]);
        }

        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        return (form.payBody || [])
            .filter((row: any) => {
                return (
                    row?.accountCode ||
                    row?.accountName ||
                    row?.amount ||
                    row?.netAmount
                );
            })
            .map((row: any) => ({
                accountCode: row?.accountCode || "",
                accountName: row?.accountName || "",

                amount: String(row?.amount || row?.netAmount || 0),
                netAmount: String(row?.netAmount || row?.amount || 0),

                references: Array.isArray(row?.references)
                    ? row.references.map((ref: any) => {
                        const referenceType = String(
                            ref?.referenceType || "PINV"
                        ).toUpperCase();

                        if (referenceType === "NEW") {
                            return {
                                referenceType: "NEW",
                                newReference: ref?.newReference || "ADV",
                                billDueDate: ref?.billDueDate || "",
                                billAmount: String(
                                    ref?.billAmount || ref?.adjustedAmount || 0
                                ),
                                adjustedAmount: String(
                                    ref?.adjustedAmount || ref?.billAmount || 0
                                ),
                            };
                        }

                        return {
                            referenceType: "PINV",
                            purchaseInvoice: ref?.purchaseInvoice || "",
                            docDate: ref?.docDate || ref?.billDueDate || "",
                            billDueDate: ref?.billDueDate || ref?.docDate || "",
                            billAmount: String(
                                ref?.billAmount || ref?.netAmount || 0
                            ),
                            netAmount: String(
                                ref?.netAmount || ref?.billAmount || 0
                            ),
                            remainingBillAmount: String(
                                ref?.remainingBillAmount || 0
                            ),
                            adjustedAmount: String(ref?.adjustedAmount || 0),
                        };
                    })
                    : [],

                remarks: row?.remarks || null,
            }));
    };

    /* ===================================================
       PURCHASE INVOICE SYNC
    =================================================== */
    const updatePurchaseInvoiceFooter = async (
        voucherNumber: string,
        adjustedDiff: number,
        // @ts-ignore
        vendorCode?: string
    ) => {
        if (!voucherNumber) return;

        if (adjustedDiff === 0) return;

        const res = await professionalAxios.get(
            `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseInvoice/getByVoucherNumber/${voucherNumber}`
        );

        if (!res.data?.success) {
            throw new Error(
                res.data?.message || `Purchase invoice not found: ${voucherNumber}`
            );
        }

        const normalizedInvoice = normalizePurchaseInvoiceDoc(res.data?.data);

        if (!normalizedInvoice || Object.keys(normalizedInvoice).length === 0) {
            throw new Error(`Purchase invoice not found: ${voucherNumber}`);
        }

        const footer = normalizedInvoice?.pInvFooter || {};

        const invoiceNetAmount = num(
            footer?.netAmount ||
            normalizedInvoice?.netAmount ||
            normalizedInvoice?.billAmount ||
            normalizedInvoice?.amount ||
            0
        );

        const previousAdjustedAmount = num(
            footer?.adjustedAmount ??
            normalizedInvoice?.adjustedAmount ??
            0
        );

        const previousBalanceAmount = num(
            footer?.balanceAmount ??
            footer?.remainingAmount ??
            footer?.remainingBillAmount ??
            normalizedInvoice?.balanceAmount ??
            normalizedInvoice?.remainingAmount ??
            normalizedInvoice?.remainingBillAmount ??
            invoiceNetAmount - previousAdjustedAmount
        );

        /*
           ✅ When creating/updating payment:
           adjustedDiff is positive.
           It cannot be more than current remaining amount.
        */
        if (adjustedDiff > 0 && adjustedDiff > previousBalanceAmount) {
            throw new Error(
                `Adjusted amount cannot exceed remaining amount ${money(previousBalanceAmount)} for ${voucherNumber}`
            );
        }

        /*
           ✅ When deleting payment:
           adjustedDiff is negative.
           So adjusted amount decreases and balance increases.
        */
        let nextAdjustedAmount = previousAdjustedAmount + adjustedDiff;

        if (nextAdjustedAmount < 0) {
            nextAdjustedAmount = 0;
        }

        const nextBalanceAmount = invoiceNetAmount - nextAdjustedAmount;

        if (nextBalanceAmount < 0) {
            throw new Error(
                `Adjusted amount cannot exceed invoice amount for ${voucherNumber}`
            );
        }

        await dispatch(
            updatePurchaseInvoice({
                purchaseInvoiceNumber: voucherNumber,
                payload: {
                    pInvFooter: {
                        ...footer,
                        netAmount: String(invoiceNetAmount),
                        adjustedAmount: String(nextAdjustedAmount),
                        balanceAmount: String(nextBalanceAmount),
                    },

                    // ✅ balance 0 means close, otherwise open
                    pInvStatus: nextBalanceAmount <= 0 ? "close" : "open",
                },
            }) as any
        ).unwrap();
    };

    const buildReferenceDiffs = (oldRows: any[] = [], newRows: any[] = []) => {
        const oldMap: Record<string, any> = {};
        const newMap: Record<string, any> = {};

        oldRows.forEach((body: any) => {
            (body?.references || []).forEach((ref: any) => {
                const referenceType = String(
                    ref?.referenceType || "PINV"
                ).toUpperCase();

                if (referenceType !== "PINV") return;

                const invoiceNumber = ref?.purchaseInvoice;
                if (!invoiceNumber) return;

                oldMap[invoiceNumber] = {
                    purchaseInvoice: invoiceNumber,
                    vendorCode: body?.accountCode || "",
                    adjustedAmount:
                        num(oldMap[invoiceNumber]?.adjustedAmount) +
                        num(ref?.adjustedAmount),
                };
            });
        });

        newRows.forEach((body: any) => {
            (body?.references || []).forEach((ref: any) => {
                const referenceType = String(
                    ref?.referenceType || "PINV"
                ).toUpperCase();

                if (referenceType !== "PINV") return;

                const invoiceNumber = ref?.purchaseInvoice;
                if (!invoiceNumber) return;

                newMap[invoiceNumber] = {
                    purchaseInvoice: invoiceNumber,
                    vendorCode: body?.accountCode || "",
                    adjustedAmount:
                        num(newMap[invoiceNumber]?.adjustedAmount) +
                        num(ref?.adjustedAmount),
                };
            });
        });

        return Array.from(
            new Set([...Object.keys(oldMap), ...Object.keys(newMap)])
        )
            .map((purchaseInvoice) => ({
                purchaseInvoice,
                vendorCode:
                    newMap[purchaseInvoice]?.vendorCode ||
                    oldMap[purchaseInvoice]?.vendorCode ||
                    "",
                diffAmount:
                    num(newMap[purchaseInvoice]?.adjustedAmount) -
                    num(oldMap[purchaseInvoice]?.adjustedAmount),
            }))
            .filter((item) => item.diffAmount !== 0);
    };

    const syncPurchaseInvoiceReferences = async (newRows: any[]) => {
        const oldRows = editingRecord?.payBody || [];
        const diffs = buildReferenceDiffs(oldRows, newRows);

        for (const ref of diffs) {
            await updatePurchaseInvoiceFooter(
                ref.purchaseInvoice,
                ref.diffAmount,
                ref.vendorCode
            );
        }
    };

    const reversePaymentReferencesBeforeDelete = async (paymentRecord: any) => {
        const oldRows = paymentRecord?.payBody || [];
        const diffs = buildReferenceDiffs(oldRows, []);

        for (const ref of diffs) {
            await updatePurchaseInvoiceFooter(
                ref.purchaseInvoice,
                ref.diffAmount,
                ref.vendorCode
            );
        }
    };

    /* ===================================================
       SUBMIT
    =================================================== */

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const rows = cleanRows();
        const totals = calculateFooter(rows);

        const netAmount = totals.netAmount;
        const adjustedAmount = totals.adjustedAmount;
        const balanceAmount = netAmount - adjustedAmount;

        const payload: any = {
            payVoucherDate: form.payVoucherDate,

            payAccountCode: form.payAccountCode,
            payAccountName: form.payAccountName,

            payStatus: form.payStatus || "open",
            payRemark: form.payRemark,

            paymentMode: form.paymentMode,
            bankReferenceNumber: form.bankReferenceNumber,
            paidBy: form.paidBy,

            payBody: rows,

            payFooter: {
                netAmount: String(netAmount),
                adjustedAmount: String(adjustedAmount),
                balanceAmount: String(balanceAmount),
            },
        };

        try {
            await syncPurchaseInvoiceReferences(rows);

            if (editingRecord) {
                await dispatch(
                    updatePayment({
                        paymentVoucherNumber: form?.payVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                toast.success("Payment updated successfully");
            } else {
                await dispatch(addPayment({ payload }) as any).unwrap();

                toast.success("Payment created successfully");
            }

            setShowModal(false);
            resetMainForm();

            await fetchPayments();
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.payload?.message ||
                "Operation failed"
            );
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;

            if (!voucherNumber) {
                toast.error("Payment voucher number not found");
                return;
            }

            const paymentRecord = payments?.find((item: any) => {
                const itemVoucherNumber =
                    item?.payVoucherNumber ||
                    item?.paymentVoucherNumber ||
                    item?.paymentNumber ||
                    item?.voucherNumber;

                return String(itemVoucherNumber) === String(voucherNumber);
            });

            if (!paymentRecord) {
                toast.error("Payment record not found");
                return;
            }

            await reversePaymentReferencesBeforeDelete(paymentRecord);

            await dispatch(
                deletePayment({
                    paymentVoucherNumber: voucherNumber,
                }) as any
            ).unwrap();

            toast.success("Payment deleted successfully");

            await fetchPayments();
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.payload?.message ||
                "Failed to delete payment"
            );
        } finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
            });
        }
    };

    /* ===================================================
       DYNAMIC FOOTER
    =================================================== */

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => {
                const rawValue =
                    footerTotals[field.key as keyof typeof footerTotals] ?? 0;

                return {
                    ...field,
                    value: money(rawValue),
                    rawValue,
                };
            });
    }, [templateFields?.footer, footerTotals]);

    const showInitialSkeleton = !refreshing && payments.length === 0 && (loading || fieldsLoading);

    useEffect(() => {
        /* @ts-ignore  */
        dispatch(getAllReportMapping({ moduleType: "purchasePayment" }));
    }, []);

    if (showInitialSkeleton) { return <ModulePageSkeleton rows={8} columns={5} /> }

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div
                id="payment-header"
                className="mb-3 flex items-center"
            >
                <div
                    id="payment-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Payments:",
                            varient: "primary",
                        }}
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        {...{
                            arr: ["open", "close"],
                            state: status,
                            setState: handleStatusChange,
                        }}
                    />

                    <SearchInput {...{ search, setSearch }} />

                    <DataREfreshButton
                        {...{
                            callBackFn: handleRefresh,
                            loading: refreshing,
                        }}
                    />

                    <Permission module="bookez" permissionKey="payment" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openAddModal,
                                text: "Add Payment",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={payments}
                loading={loading}
                emptyMessage={`No ${status} payment found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "purchasePayment",
                                    record,
                                    CustomerCode: record?.payAccountCode,
                                    voucherNumber: record?.payVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>
                        <Permission module="bookez" permissionKey="payment" action="update">
                            <button
                                id="payment-edit-button"
                                onClick={() => openEditModal(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="payment" action="delete">
                            <button
                                id="payment-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    let x = rect.left - 150;
                                    if (x < 10) x = 10;
                                    const y = rect.top + window.scrollY - 5;

                                    setConfirmTooltip({
                                        show: true,
                                        x,
                                        y,
                                        voucherNumber:
                                            record?.payVoucherNumber ||
                                            record?.paymentVoucherNumber ||
                                            record?.voucherNumber,
                                    });
                                }}
                                className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
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
                        selectCb: (e: any) => {
                            setLocalLimit(Number(e.target.value));
                            setLocalOffset(0);
                        },
                        preDisabled: !pagination?.hasPrevPage,
                        nextDisabled: !pagination?.hasNextPage,
                        setLocalOffset,
                        pagination,
                    }}
                />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this payment?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            voucherNumber: null,
                        })
                    }
                />
            )}

            {!fieldsLoading && (
                <DynamicAddForm
                    {...{
                        show: showModal,
                        setShow: setShowModal,
                        edit: Boolean(editingRecord),
                        title: "Payment",
                        bodyTitle: "Accounts",
                        subtitle: "Fill in the payment details below",
                        loading: createLoading || updateLoading,
                        onClose: () => {
                            setShowModal(false);
                            resetMainForm();
                        },
                        onSubmit: handleSubmit,

                        RefrenceBtnText: getReferenceActionText,
                        isRefrenceAction: true,
                        handleRefRow: handleOpenReferenceModal,

                        addButtonText: "Add Account",
                        form,
                        errors,
                        handleAddRow,
                        handleDeleteRow,
                        handleRowChange,
                        footerTotals,
                        inputData: {
                            ...templateFields,
                            body: bodyFieldsWithoutReference,
                            footer: dynamicFooterArray,
                        },
                        bodyKey: "payBody",
                        handleChange: handleMainChange,
                    }}
                />
            )}

            {showReferenceModal && (
                <DynamicAddForm
                    {...{
                        show: showReferenceModal,
                        setShow: setShowReferenceModal,
                        edit: false,
                        title: "Reference",
                        subtitle: selectedReferenceRow?.accountName
                            ? `Purchase invoices for ${selectedReferenceRow.accountCode}`
                            : "",
                        loading: referenceLoading,
                        onClose: handleCloseReferenceModal,
                        onSubmit: handleSaveReferences,

                        addButtonText: "Add Reference",

                        isAddButton: false,
                        Addbutton: false,

                        form: {
                            newReference: money(newReferenceAmount),
                            referenceBody: referenceRows,
                        },
                        errors: { referenceBody: referenceError, },
                        handleAddRow: handleAddReferenceRow,
                        handleDeleteRow: handleDeleteReferenceRow,
                        handleRowChange: handleReferenceRowChange,
                        footerTotals: {},
                        inputData: {
                            header: [
                                {
                                    key: "newReference",
                                    label: "New Reference",
                                    type: "text",
                                    isReadOnly: true,
                                },
                            ],
                            body: referenceTableFields,
                            footer: [],
                        },
                        bodyKey: "referenceBody",
                        handleChange: () => { },
                    }}
                />
            )}

            {/* @ts-ignore  */}
            <ListingModel
                {...{
                    show: downlaodPDF?.show,
                    downlaodPDF,
                    entryType: "purchasePayment",
                    setShow: () => setDownlaodPDF(() => ({ show: !downlaodPDF?.show, })),
                    rowData: downlaodPDF?.record,
                    report,
                    title: "Download Payment PDF",
                    cancelText: "Cancel",
                    confirmText: "Confirm",
                }}
            />
        </div>
    );
};

export default Payment;