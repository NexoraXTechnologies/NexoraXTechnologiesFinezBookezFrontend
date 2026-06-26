import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import DataTable from "../../../../../components/DataTable";
import Pagination from "../../../../../components/pagination";
import SearchInput from "../../../../../components/searchInput";
import Badge from "../../../../../components/badge";
import Toggle from "../../../../../components/toggle";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../../components/buttons";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import ModulePageSkeleton from "../../../../../components/skeleton/SkeletonLoader";

import {
    formatDateForInput,
    formatDateForList,
    loadAllTemplateOptions,
    money,
    num,
    todayYMD,
} from "../../../../../utils/helperFunctions";

import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";

import type { ConfirmTooltipState } from "../salesWorkflowTypes";

import {
    addSalesReceipt,
    updateSalesReceipt,
    deleteSalesReceipt,
    getSalesReceiptList,
    clearSalesReceiptReferences,
    getByVoucherNumberSalesReceiptList,
} from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesReceipt";

import {
    getAllSalesInvoice,
    getByVoucherNumberSalesInvoice,
    updateSalesInvoice,
} from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";

import { ListingModel } from "../../../../../components/modal";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import Permission from "../../../../../components/PermissionGuard";

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const emptyReceiptRow = {
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
    saleInvoice: "",
    salesInvoice: "",
    docDate: "",
    netBillAmount: "",
    netReturnAmount: "",
    remainingBillAmount: "",
    adjustedAmount: "",
};

const getDefaultForm = () => ({
    recVoucherNumber: "AUTO",
    recVoucherDate: todayYMD(),

    recAccountCode: "",
    recAccountName: "",

    recStatus: "open",
    recRemark: "",

    paymentMode: "",
    bankReferenceNumber: "",
    receivedBy: "",

    recBody: [{ ...emptyReceiptRow, id: Date.now() }],

    netAmount: "0.00",
    adjustedAmount: "0.00",
    balanceAmount: "0.00",
});

const SalesReceipt = () => {
    const dispatch = useDispatch<any>();

    const salesReceiptState = useSelector(
        (state: any) => state.salesReceipt || state.salesreceipt || {}
    );

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const {
        salesReceipt = [],
        pagination = defaultPagination,
        listingLoader = false,
        addLoader = false,
        deleteLoader = false,
        referenceLoader = false,
    } = salesReceiptState;

    const { report } = useSelector((s: any) => s.reportMapping);

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [status, setStatus] = useState<"open" | "close">("open");
    const [refreshing, setRefreshing] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});

    const [templateFields, setTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    const [fieldsLoading, setFieldsLoading] = useState(false);

    const [showReferenceModal, setShowReferenceModal] = useState(false);
    const [selectedReferenceRowIndex, setSelectedReferenceRowIndex] =
        useState<number | null>(null);

    const [referenceRows, setReferenceRows] = useState<any[]>([]);
    const [referenceError, setReferenceError] = useState("");
    const [referenceLoading, setReferenceLoading] = useState(false);
    const [newReferenceAmount, setNewReferenceAmount] = useState("");

    const [downlaodPDF, setDownlaodPDF] = useState<any>({
        show: false,
        x: null,
        y: null,
        type: "",
    });

    const [confirmTooltip, setConfirmTooltip] =
        useState<ConfirmTooltipState>({
            show: false,
            x: null,
            y: null,
            voucherNumber: null,
        });

    const toNumber = (value: any) => Number(value || 0);

    const sanitizeDecimalValue = (value: any) => {
        const clean = String(value || "").replace(/[^0-9.]/g, "");

        const parts = clean.split(".");
        if (parts.length > 2) {
            return `${parts[0]}.${parts.slice(1).join("")}`;
        }

        return clean;
    };

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

    const bodyFieldsWithoutReference = useMemo(() => {
        return (templateFields?.body || []).filter((field: any) => {
            const key = String(field?.key || "").toLowerCase();

            return ![
                "reference",
                "references",
                "referencebody",
                "referencelist",
                "recsalesinvoicerefs",
            ].includes(key);
        });
    }, [templateFields?.body]);

    const referenceTableFields = useMemo(() => {
        return [
            {
                key: "saleInvoice",
                label: "Sale Invoice",
                type: "text",
                disabled: true,
            },
            {
                key: "docDate",
                label: "Doc Date",
                type: "date",
                disabled: true,
            },
            {
                key: "netBillAmount",
                label: "Net Bill Amount",
                type: "number",
                disabled: true,
            },
            {
                key: "netReturnAmount",
                label: "Net Return Amount",
                type: "number",
                disabled: true,
            },
            {
                key: "remainingBillAmount",
                label: "Remaining Bill Amount",
                type: "number",
                disabled: true,
            },
            {
                key: "adjustedAmount",
                label: "Adjusted Amount",
                type: "number",
                isRequired: false,
            },
        ];
    }, []);

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
        const totals = calculateFooter(form.recBody || []);

        return {
            ...totals,
            balanceAmount: totals.netAmount - totals.adjustedAmount,
        };
    }, [form.recBody]);

    const selectedReferenceRow = useMemo(() => {
        if (selectedReferenceRowIndex === null) return null;

        return form?.recBody?.[selectedReferenceRowIndex] || null;
    }, [form?.recBody, selectedReferenceRowIndex]);

    const selectedReferenceMaxAmount = useMemo(() => {
        return num(
            selectedReferenceRow?.netAmount ||
            selectedReferenceRow?.amount ||
            0
        );
    }, [selectedReferenceRow]);

    const getReferenceRowsAdjustedTotal = (rows: any[] = []) => {
        return rows.reduce((sum: number, row: any) => {
            return sum + num(row?.adjustedAmount);
        }, 0);
    };

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

    const getReferenceActionText = (row: any) => {
        const hasReferences =
            Array.isArray(row?.references) &&
            row.references.some((ref: any) => {
                return (
                    ref?.saleInvoice ||
                    ref?.salesInvoice ||
                    ref?.newReference ||
                    num(ref?.adjustedAmount) > 0
                );
            });

        return hasReferences ? "Edit Reference" : "Add Reference";
    };

    const getReferenceVoucherNumber = (item: any) => {
        return (
            item?.voucherNumber ||
            item?.saleInvoice ||
            item?.salesInvoice ||
            item?.sInvVoucherNumber ||
            item?.sInvReturnVoucherNumber ||
            item?.receiptVoucherNumber ||
            ""
        );
    };

    const getReferenceDate = (item: any) => {
        return (
            item?.docDate ||
            item?.voucherDate ||
            item?.sInvVoucherDate ||
            item?.sInvReturnVoucherDate ||
            ""
        );
    };

    const getReferenceAmount = (item: any) => {
        return num(
            item?.remainingBillAmount ||
            item?.balanceAmount ||
            item?.netAmount ||
            item?.sInvFooter?.balanceAmount ||
            item?.sInvFooter?.netAmount ||
            item?.sInvReturnFooter?.balanceAmount ||
            item?.sInvReturnFooter?.netAmount ||
            0
        );
    };

    const getReceiptVoucherNumberFromResponse = (
        receiptData: any,
        fallbackVoucherNumber?: string
    ) => {
        return (
            receiptData?.data?.receipt?.recVoucherNumber ||
            receiptData?.data?.recVoucherNumber ||
            receiptData?.data?.voucherNumber ||
            receiptData?.recVoucherNumber ||
            fallbackVoucherNumber ||
            ""
        );
    };

    const fetchSalesReceipts = async () => {
        await dispatch(
            getSalesReceiptList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status,
            }) as any
        );
    };

    const fetchReceiptReferences = async (selectedRow: any) => {
        const customerCode = selectedRow?.accountCode;

        if (!customerCode) {
            toast.error("Please select account first");
            return [];
        }

        try {
            setReferenceLoading(true);

            const res: any = await dispatch(
                getAllSalesInvoice({
                    offset: 0,
                    limit: 500,
                    search: customerCode,
                    status: "open",
                }) as any
            ).unwrap();

            const records = getRecords(res);

            const customerInvoices = records.filter((invoice: any) => {
                const invoiceCustomerCode =
                    invoice?.sInvCustomerCode ||
                    invoice?.customerCode ||
                    invoice?.accountCode ||
                    "";

                return String(invoiceCustomerCode) === String(customerCode);
            });

            return customerInvoices;
        } catch (error) {
            console.log("Failed to load sales invoices", error);
            toast.error("Failed to load sales invoices");
            return [];
        } finally {
            setReferenceLoading(false);
        }
    };

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        setReferenceRows([]);
        setReferenceError("");
        setSelectedReferenceRowIndex(null);
        setNewReferenceAmount("");
        setForm(getDefaultForm());
        dispatch(clearSalesReceiptReferences());
    };

    const openAddModal = () => {
        resetMainForm();
        setShowModal(true);
    };

    const openEditModal = (record: any) => {
        const footer = record?.recFooter || {};

        const body =
            record?.recBody?.length > 0
                ? record.recBody.map((row: any) => ({
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
                : [{ ...emptyReceiptRow, id: Date.now() }];

        setEditingRecord(record);
        setErrors({});

        setForm({
            recVoucherNumber:
                record?.recVoucherNumber ||
                record?.receiptVoucherNumber ||
                record?.voucherNumber ||
                "",

            recVoucherDate: formatDateForInput(
                record?.recVoucherDate || record?.receiptVoucherDate
            ),

            recAccountCode: record?.recAccountCode || "",
            recAccountName: record?.recAccountName || "",

            recStatus: record?.recStatus || "open",
            recRemark: record?.recRemark || "",

            paymentMode: record?.paymentMode || "",
            bankReferenceNumber: record?.bankReferenceNumber || "",
            receivedBy: record?.receivedBy || "",

            recBody: body,

            netAmount: footer?.netAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount: footer?.balanceAmount || "0.00",
        });

        setShowModal(true);
    };

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

    const handleAddRow = () => {
        setForm((prev: any) => ({
            ...prev,
            recBody: [
                ...(prev.recBody || []),
                {
                    ...emptyReceiptRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedRows = (prev.recBody || []).filter(
                (_: any, i: number) => i !== index
            );

            return {
                ...prev,
                recBody:
                    updatedRows.length > 0
                        ? updatedRows
                        : [{ ...emptyReceiptRow, id: Date.now() }],
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const updatedRows = [...(prev.recBody || [])];
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

            //  I am here reference getting empty array that's why value not calculating...
            if (key === "accountCode" || key === "accountName") {
                updatedRow.references = [];
                if (!editingRecord) {
                    updatedRow.references = [];
                }
            }

            if (key === "amount") {
                updatedRow.netAmount = value;
                if (!editingRecord) {
                    updatedRow.references = [];
                }
            }

            if (key === "netAmount") {
                updatedRow.amount = value;
                if (!editingRecord) {
                    updatedRow.references = [];
                }
            }
            updatedRows[index] = updatedRow;
            return {
                ...prev,
                recBody: updatedRows,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            recBody: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_references`]: "",
        }));
    };

    const handleNewReferenceChange = (value: any) => {
        const clean = sanitizeDecimalValue(value);
        const parsed = num(clean);

        const adjustedSum = getReferenceRowsAdjustedTotal(referenceRows);
        const maxAmount = selectedReferenceMaxAmount;
        if ((adjustedSum + parsed) > maxAmount) {
            toast.error(`Total reference amount cannot exceed body amount ${money(maxAmount)}`);
            return;
        }
        setNewReferenceAmount(clean);
    };

    console.log({ form })
    const handleOpenReferenceModal = async (rowIndex: number) => {
        const selectedRow = form?.recBody?.[rowIndex];
        console.log({ inside: form })
        if (!selectedRow) {
            toast.error("Receipt row not found");
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
        console.log({ selectedRow })
        const existingReferences = Array.isArray(selectedRow?.references)
            ? selectedRow.references
            : [];

        const existingNewReference = existingReferences.find((ref: any) => {
            return String(ref?.referenceType || "").toUpperCase() === "NEW";
        });

        setNewReferenceAmount(
            existingNewReference
                ? String(existingNewReference?.adjustedAmount || "")
                : ""
        );
        console.log({ existingReferences })
        const existingReferenceMap = new Map<string, any>(existingReferences.filter((ref: any) => {
                    return (
                        String(ref?.referenceType || "SINV").toUpperCase() ===
                        "SINV" &&
                        (ref?.saleInvoice || ref?.salesInvoice)
                    );
                })
            .map((ref: any) => [
                String(ref.saleInvoice || ref.salesInvoice),
                ref,
            ])
        );

        const refs = await fetchReceiptReferences(selectedRow);

        const openRefs = (refs || []).filter((item: any) => {
            const invoiceNo = getReferenceVoucherNumber(item);
            const existingRef = existingReferenceMap.get(String(invoiceNo));

            const remainingAmount =
                getReferenceAmount(item) + num(existingRef?.adjustedAmount || 0);

            return remainingAmount > 0;
        });

        if (!openRefs || openRefs.length === 0) {
            setReferenceRows([]);
            return;
        }

        const getInvoiceNetAmount = (item: any) => {
            return num(
                item?.netAmount ??
                item?.sInvFooter?.netAmount ??
                item?.sInvFooter?.totalNetAmount ??
                getReferenceAmount(item)
            );
        };

        const getNetReturnAmount = (item: any) => {
            return num(
                item?.netReturnAmount ??
                item?.returnAmount ??
                item?.totalReturnAmount ??
                item?.sInvFooter?.returnAmount ??
                0
            );
        };

        // const getAdjustedAmount = (existingRef: any) => {
        //     return num(existingRef?.adjustedAmount || 0);
        // };

        const mappedReferences = openRefs.map((item: any) => {
            const saleInvoice = getReferenceVoucherNumber(item);
            console.log({ existingReferenceMap })
            const existingRef = existingReferenceMap.get(String(saleInvoice));

            const netBillAmount = getInvoiceNetAmount(item);
            const netReturnAmount = getNetReturnAmount(item);
            // const adjustedAmount = getAdjustedAmount(existingRef);

            const remainingBillAmount = getReferenceAmount(item);
            console.log({ existingRef })
            return {
                id: item?._id || Date.now() + Math.random(),
                referenceType: "SINV",
                saleInvoice,
                salesInvoice: saleInvoice,
                docDate: formatDateForInput(getReferenceDate(item)),
                billDueDate: formatDateForInput(getReferenceDate(item)),
                billAmount: String(netBillAmount),
                netBillAmount: String(netBillAmount),
                netAmount: String(netBillAmount),
                netReturnAmount: String(netReturnAmount),
                remainingBillAmount: String(remainingBillAmount),
                adjustedAmount: existingRef?.adjustedAmount !== undefined ? String(existingRef.adjustedAmount) : "",
                oldAdjustmentAmount: existingRef?.adjustedAmount !== undefined ? String(existingRef.adjustedAmount) : "0",
                isSettle: Boolean(existingRef),
            };
        });

        setReferenceRows(mappedReferences);
    };

    const handleReferenceRowChange = (
        index: number,
        key: string,
        value: any
    ) => {
        if (key !== "adjustedAmount") {
            setReferenceRows((prev: any[]) => {
                const updatedRows = [...prev];

                updatedRows[index] = {
                    ...updatedRows[index],
                    [key]: value,
                };

                return updatedRows;
            });

            setReferenceError("");
            return;
        }

        const clean = sanitizeDecimalValue(value);
        const parsed = num(clean);
        const currentRow = referenceRows[index];
        const remainingBillAmount = num(currentRow?.remainingBillAmount);
        const oldAdjustmentAmount = num(currentRow?.oldAdjustmentAmount);
        console.log({
            isEditMode: Boolean(editingRecord),
            remainingBillAmount,
            oldAdjustmentAmount,
            parsed,
        });

        const maxInvoiceAdjustableAmount = editingRecord ? remainingBillAmount + oldAdjustmentAmount : remainingBillAmount;
        if (parsed > maxInvoiceAdjustableAmount) {
            toast.error(`Adjusted amount cannot exceed remaining bill amount ${money(maxInvoiceAdjustableAmount)}`);
            return;
        }
        const otherSum = referenceRows.reduce(
            (sum: number, row: any, i: number) => {
                if (i === index) return sum;
                return sum + num(row?.adjustedAmount);
            },
            0
        );

        const newRefAmount = num(newReferenceAmount);
        const maxAmount = selectedReferenceMaxAmount;

        if (otherSum + parsed + newRefAmount > maxAmount) {
            toast.error(
                `Total reference amount cannot exceed body amount ${money(maxAmount)}`
            );
            return;
        }

        setReferenceRows((prev: any[]) => {
            const updatedRows = [...prev];

            updatedRows[index] = {
                ...updatedRows[index],
                adjustedAmount: clean,
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
        setReferenceRows((prev: any[]) =>
            prev.filter((_: any, i: number) => i !== index)
        );
    };

    const handleCloseReferenceModal = () => {
        setShowReferenceModal(false);
        setSelectedReferenceRowIndex(null);
        setReferenceRows([]);
        setReferenceError("");
        setReferenceLoading(false);
        setNewReferenceAmount("");
    };

    const handleSaveReferences = () => {
        if (selectedReferenceRowIndex === null) {
            toast.error("Receipt row not selected");
            return;
        }

        const maxAmount = selectedReferenceMaxAmount;

        const invoiceRefs = (referenceRows || [])
            .filter((row: any) => num(row?.adjustedAmount) > 0)
            .map((row: any) => ({
                referenceType: "SINV",

                saleInvoice: row?.saleInvoice || row?.salesInvoice || "",
                salesInvoice: row?.salesInvoice || row?.saleInvoice || "",

                docDate: row?.docDate || "",
                billDueDate: row?.billDueDate || row?.docDate || "",

                billAmount: String(row?.billAmount || row?.netAmount || 0),
                netAmount: String(row?.netAmount || row?.billAmount || 0),

                netBillAmount: String(row?.netBillAmount || row?.netAmount || 0),
                netReturnAmount: String(row?.netReturnAmount || 0),
                remainingBillAmount: String(row?.remainingBillAmount || 0),

                returnAmount: Number(row?.netReturnAmount || 0),
                adjustedAmount: String(row?.adjustedAmount || 0),
            }));

        const newRefNum = num(newReferenceAmount);

        const referencesToSave = [
            ...invoiceRefs,

            ...(newRefNum > 0
                ? [
                    {
                        referenceType: "NEW",
                        newReference: "ADV",
                        billDueDate: todayYMD(),
                        billAmount: String(newRefNum),
                        adjustedAmount: String(newRefNum),
                    },
                ]
                : []),
        ];

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
            const updatedRows = [...(prev.recBody || [])];

            updatedRows[selectedReferenceRowIndex] = {
                ...updatedRows[selectedReferenceRowIndex],
                references: referencesToSave,
            };

            return {
                ...prev,
                recBody: updatedRows,
            };
        });

        handleCloseReferenceModal();
    };

    const getFilledRows = () => {
        const bodyKeys = (bodyFieldsWithoutReference || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => field.key);

        return (form.recBody || []).filter((row: any) => {
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
            err.recBody = "Please add at least one receipt row";
        }

        (form.recBody || []).forEach((row: any, index: number) => {
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

        if (err.recBody) {
            toast.error(err.recBody);
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
        return (form.recBody || [])
            .filter((row: any) => {
                return (row?.accountCode || row?.accountName || row?.amount || row?.netAmount);
            })
            .map((row: any) => ({
                accountCode: row?.accountCode || "",
                accountName: row?.accountName || "",

                amount: String(row?.amount || row?.netAmount || 0),
                netAmount: String(row?.netAmount || row?.amount || 0),

                references: Array.isArray(row?.references)
                    ? row.references.map((ref: any) => {
                        const referenceType = String(
                            ref?.referenceType || "SINV"
                        ).toUpperCase();

                        if (referenceType === "NEW") {
                            return {
                                referenceType: "NEW",
                                newReference: ref?.newReference || "ADV",
                                billDueDate: ref?.billDueDate || todayYMD(),
                                billAmount: String(ref?.billAmount || ref?.adjustedAmount || 0),
                                adjustedAmount: String(ref?.adjustedAmount || ref?.billAmount || 0
                                ),
                            };
                        }

                        const saleInvoice = ref?.saleInvoice || ref?.salesInvoice || "";
                        return {
                            referenceType: "SINV",
                            saleInvoice,
                            salesInvoice: saleInvoice,
                            docDate: ref?.docDate || ref?.billDueDate || "",
                            billDueDate: ref?.billDueDate || ref?.docDate || "",
                            billAmount: String(ref?.billAmount || ref?.netAmount || 0),
                            netAmount: String(ref?.netAmount || ref?.billAmount || 0),
                            netBillAmount: String(ref?.netBillAmount || ref?.netAmount || 0),
                            netReturnAmount: String(ref?.netReturnAmount || 0),
                            remainingBillAmount: String(ref?.remainingBillAmount || 0),
                            returnAmount: Number(ref?.returnAmount || ref?.netReturnAmount || 0),
                            adjustedAmount: String(ref?.adjustedAmount || 0),
                        };
                    })
                    : [],

                remarks: row?.remarks || null,
            }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        const rows = cleanRows();
        const totals = calculateFooter(rows);
        const netAmount = totals.netAmount;
        const adjustedAmount = totals.adjustedAmount;
        const balanceAmount = netAmount - adjustedAmount;
        const payload: any = {
            recVoucherNumber: editingRecord ? form.recVoucherNumber : "AUTO",
            recVoucherDate: form.recVoucherDate,
            recAccountCode: form.recAccountCode,
            recAccountName: form.recAccountName,
            recStatus: form.recStatus || "open",
            recRemark: form.recRemark,
            paymentMode: form.paymentMode,
            bankReferenceNumber: form.bankReferenceNumber,
            receivedBy: form.receivedBy,
            recBody: rows.map((row: any) => ({
                ...row,
                references: Array.isArray(row.references)
                    ? row.references.map((ref: any) => ({
                        ...ref,
                        referenceType: String(
                            ref.referenceType || ""
                        ).toUpperCase(),
                        billAmount: String(ref.billAmount ?? 0),
                        adjustedAmount: String(ref.adjustedAmount ?? 0),
                        returnAmount: Number(
                            ref.returnAmount || ref.netReturnAmount || 0
                        ),
                    }))
                    : [],
            })),

            recFooter: {
                netAmount: String(netAmount),
                adjustedAmount: String(adjustedAmount),
                balanceAmount: String(balanceAmount),
            },
        };

        try {
            if (editingRecord) {
                const buildReferenceDiff = (oldReceipt: any, newPayload: any) => {
                    const oldMap: any = {};
                    const newMap: any = {};

                    (
                        oldReceipt?.recBody ||
                        oldReceipt?.data?.recBody ||
                        editingRecord?.recBody ||
                        []
                    ).forEach((body: any) => {
                        (body.references || []).forEach((ref: any) => {
                            const invoiceNo =
                                ref.saleInvoice || ref.salesInvoice;

                            if (invoiceNo) {
                                oldMap[invoiceNo] = {
                                    adjustedAmount:
                                        toNumber(
                                            oldMap[invoiceNo]?.adjustedAmount
                                        ) + toNumber(ref.adjustedAmount),
                                };
                            }
                        });
                    });

                    (newPayload?.recBody || []).forEach((body: any) => {
                        (body.references || []).forEach((ref: any) => {
                            const invoiceNo =
                                ref.saleInvoice || ref.salesInvoice;

                            if (invoiceNo) {
                                newMap[invoiceNo] = {
                                    adjustedAmount:
                                        toNumber(
                                            newMap[invoiceNo]?.adjustedAmount
                                        ) + toNumber(ref.adjustedAmount),

                                    returnAmount:
                                        toNumber(
                                            newMap[invoiceNo]?.returnAmount
                                        ) +
                                        toNumber(
                                            ref.returnAmount ||
                                            ref.netReturnAmount ||
                                            0
                                        ),
                                };
                            }
                        });
                    });

                    const allInvoices = new Set([...Object.keys(oldMap), ...Object.keys(newMap),]);
                    return Array.from(allInvoices).map((invoiceNo: any) => ({
                        saleInvoice: invoiceNo,
                        oldAdjustedAmount: oldMap[invoiceNo]?.adjustedAmount ?? 0,
                        newAdjustedAmount: newMap[invoiceNo]?.adjustedAmount ?? 0,
                        returnAmount: newMap[invoiceNo]?.returnAmount ?? 0,
                    }));
                };

                const diffs = buildReferenceDiff(editingRecord, payload);
                for (const ref of diffs) {
                    // @ts-ignore
                    const invoiceNo = ref.saleInvoice || ref.salesInvoice;
                    if (!invoiceNo) continue;

                    const getSalesInv = await dispatch(
                        getByVoucherNumberSalesInvoice({
                            voucherNumber: invoiceNo,
                        }) as any
                    );

                    const salesInv = getSalesInv?.payload;
                    if (!salesInv) {
                        toast.error("Sales invoice not found");
                        console.warn("Sales invoice not found:", invoiceNo);
                        continue;
                    }

                    const footer = salesInv.sInvFooter || {};
                    const invoiceNetAmount = toNumber(footer.netAmount);
                    const previousAdjusted = toNumber(footer.adjustedAmount);
                    const oldAdj = toNumber(ref.oldAdjustedAmount);
                    const newAdj = toNumber(ref.newAdjustedAmount);
                    const returnAmount = toNumber(ref.returnAmount);

                    const recalculatedAdjusted =
                        previousAdjusted - oldAdj + newAdj;

                    const newBalanceAmount =
                        invoiceNetAmount - recalculatedAdjusted;

                    if (newBalanceAmount < 0) {
                        throw new Error(
                            `Adjusted amount exceeds balance for ${invoiceNo}`
                        );
                    }

                    let referenceCodes = Array.isArray(
                        salesInv.sInvReferenceCodes
                    )
                        ? [...salesInv.sInvReferenceCodes]
                        : [];

                    if (newAdj === 0) {
                        referenceCodes = referenceCodes.filter(
                            (code: string) => code !== form.recVoucherNumber
                        );
                    } else if (oldAdj === 0) {
                        referenceCodes = Array.from(new Set([...referenceCodes, form.recVoucherNumber]));
                    }

                    const updateInvoicePayload: any = {
                        sInvFooter: {
                            ...footer,
                            adjustedAmount: String(recalculatedAdjusted),
                            balanceAmount: String(newBalanceAmount),
                        },
                        sInvStatus: newBalanceAmount - returnAmount < 1 ? "close" : "open",
                        sInvReferenceCodes: referenceCodes,
                    };

                    await dispatch(
                        updateSalesInvoice({
                            sInvVoucherNumber: invoiceNo,
                            payload: updateInvoicePayload,
                        }) as any
                    );
                }

                await dispatch(
                    updateSalesReceipt({
                        receiptVoucherNumber: form.recVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();
                toast.success("Sales receipt updated successfully");
            } else {
                const invoiceAdjustments: any[] = [];
                for (const bodyItem of payload.recBody) {
                    const references = Array.isArray(bodyItem.references)
                        ? bodyItem.references
                        : [];

                    for (const ref of references) {
                        const invoiceNo = ref.saleInvoice || ref.salesInvoice;

                        if (!invoiceNo) continue;

                        const { payload: salesInv } = await dispatch(
                            getByVoucherNumberSalesInvoice({
                                voucherNumber: invoiceNo,
                            }) as any
                        );

                        if (!salesInv) {
                            console.warn("Sales invoice not found:", invoiceNo);
                            continue;
                        }
                        const footer = salesInv.sInvFooter || {};
                        const invoiceNetAmount = toNumber(footer.netAmount);
                        const oldAdjusted = toNumber(footer.adjustedAmount);
                        const receiptAdjusted = toNumber(ref.adjustedAmount);
                        const returnAmount = toNumber(
                            ref.returnAmount || ref.netReturnAmount || 0
                        );

                        const newAdjustedAmount =
                            oldAdjusted + receiptAdjusted;

                        const newBalanceAmount =
                            invoiceNetAmount - newAdjustedAmount;

                        if (newBalanceAmount < 0) {
                            throw new Error(
                                `Adjusted amount exceeds balance for ${invoiceNo}`
                            );
                        }

                        invoiceAdjustments.push({
                            saleInvoice: invoiceNo,
                            salesInvoice: invoiceNo,
                            salesInv,
                            footer,
                            newAdjustedAmount,
                            newBalanceAmount,
                            returnAmount,
                        });
                    }
                }

                const receiptData = await dispatch(
                    addSalesReceipt({ payload }) as any
                ).unwrap();

                const savedReceiptVoucherNumber =
                    getReceiptVoucherNumberFromResponse(receiptData);

                for (const item of invoiceAdjustments) {
                    const oldReferenceCodes = Array.isArray(
                        item.salesInv.sInvReferenceCodes
                    )
                        ? item.salesInv.sInvReferenceCodes
                        : [];

                    const newReferenceCodes = savedReceiptVoucherNumber
                        ? Array.from(
                            new Set([
                                ...oldReferenceCodes,
                                savedReceiptVoucherNumber,
                            ])
                        )
                        : oldReferenceCodes;

                    const updateInvoicePayload: any = {
                        sInvFooter: {
                            ...item.footer,
                            adjustedAmount: String(item.newAdjustedAmount),
                            balanceAmount: String(item.newBalanceAmount),
                        },
                        sInvStatus:
                            item.newBalanceAmount - item.returnAmount < 1
                                ? "close"
                                : "open",
                        sInvReferenceCodes: newReferenceCodes,
                    };

                    await dispatch(
                        updateSalesInvoice({
                            sInvVoucherNumber:
                                item.saleInvoice || item.salesInvoice,
                            payload: updateInvoicePayload,
                        }) as any
                    );
                }
                toast.success("Sales receipt created successfully");
            }
            setShowModal(false);
            resetMainForm();
            await fetchSalesReceipts();
        } catch (error: any) {
            console.error("Sales receipt save error:", error);
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to save sales receipt"
            );
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const receiptVoucherNumber = confirmTooltip.voucherNumber;
            if (!receiptVoucherNumber) return;

            const receiptData = await dispatch(getByVoucherNumberSalesReceiptList({ voucherNumber: receiptVoucherNumber, }) as any).unwrap();
            const recBody = Array.isArray(receiptData?.recBody) ? receiptData.recBody : [];
            for (const bodyItem of recBody) {
                const references = Array.isArray(bodyItem?.references) ? bodyItem.references : [];
                for (const ref of references) {
                    const salesInvoiceNumber = ref?.saleInvoice || ref?.salesInvoice;
                    if (!salesInvoiceNumber) continue;
                    const getSalesInv = await dispatch(getByVoucherNumberSalesInvoice({ voucherNumber: salesInvoiceNumber, }) as any);
                    const salesInvoiceData = getSalesInv?.payload;
                    if (!salesInvoiceData) {
                        console.warn("Sales invoice not found:", salesInvoiceNumber);
                        continue;
                    }

                    const oldFooter = salesInvoiceData?.sInvFooter || {};
                    const oldAdjustedAmount = toNumber(oldFooter.adjustedAmount);
                    const oldBalanceAmount = toNumber(oldFooter.balanceAmount);
                    const receiptAdjustedAmount = toNumber(ref.adjustedAmount);
                    const newAdjustedAmount = oldAdjustedAmount - receiptAdjustedAmount;
                    const newBalanceAmount = oldBalanceAmount + receiptAdjustedAmount;
                    const oldReferenceCodes = Array.isArray(salesInvoiceData?.sInvReferenceCodes) ? salesInvoiceData.sInvReferenceCodes : [];
                    const newReferenceCodes = oldReferenceCodes.filter((id: string) => id !== receiptVoucherNumber);
                    const updateInvoicePayload = {
                        sInvFooter: {
                            ...oldFooter,
                            adjustedAmount: String(newAdjustedAmount < 0 ? 0 : newAdjustedAmount),
                            balanceAmount: String(newBalanceAmount),
                        },
                        sInvStatus: "open",
                        sInvReferenceCodes: newReferenceCodes,
                    };
                    await dispatch(updateSalesInvoice({ sInvVoucherNumber: salesInvoiceNumber, payload: updateInvoicePayload, }) as any
                    );
                }
            }

            await dispatch(deleteSalesReceipt({ receiptVoucherNumber, }) as any).unwrap();
            toast.success("Sales receipt deleted successfully");
            await fetchSalesReceipts();
        } catch (error: any) {
            console.error("Sales receipt delete error:", error);
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete sales receipt"
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

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchSalesReceipts();
            toast.success("Sales receipt list refreshed");
        } finally {
            setRefreshing(false);
        }
    };

    const columns = [
        {
            key: "recVoucherNumber",
            title: "Voucher",
            render: (row: any) =>
                row?.recVoucherNumber || row?.voucherNumber || "-",
        },
        {
            key: "recVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.recVoucherDate
                    ? formatDateForList(row.recVoucherDate)
                    : "-",
        },
        {
            key: "recAccountName",
            title: "Cash/Bank Account",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.recAccountName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {row?.recAccountCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "recBody",
            title: "Accounts",
            render: (row: any) => row?.recBody?.length || 0,
        },
        {
            key: "receiptAmount",
            title: "Receipt Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.recFooter?.netAmount || 0)}
                </span>
            ),
            type: "amount",
        },
        {
            key: "recStatus",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.recStatus === "open"
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-danger/20 bg-danger/10 text-danger"
                        }`}
                >
                    {row?.recStatus || "-"}
                </span>
            ),
        },
    ];

    useEffect(() => {
        dispatch(getAllTransactionSchema("receipt") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchSalesReceipts();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

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
                const updatedData = await loadAllTemplateOptions(
                    transactionsSchema,
                    {
                        header: { accountType: "bank,cash" },
                        body: { accountType: "customer" },
                    }
                );
                const header = updatedData?.header?.filter((e: any) => e?.key !== "isPosPosting");
                setTemplateFields({ ...updatedData, header });
            } catch (error) {
                console.log("Failed to prepare sales receipt fields", error);
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    useEffect(() => {
        dispatch(getAllReportMapping({ moduleType: "receipt" }) as any);
    }, [dispatch]);

    const showInitialSkeleton = !refreshing && salesReceipt.length === 0 && (listingLoader || fieldsLoading);
    if (showInitialSkeleton) return <ModulePageSkeleton rows={8} columns={5} />;   

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-3 flex items-center">
                <Badge
                    count={pagination?.totalDocs ?? salesReceipt?.length ?? 0}
                    text="Total Sales Receipts:"
                    varient="primary"
                />

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        arr={["open", "close"]}
                        state={status}
                        setState={(nextStatus: "open" | "close") => {
                            setStatus(nextStatus);
                            setLocalOffset(0);
                        }}
                    />

                    <SearchInput search={search} setSearch={setSearch} />

                    <DataREfreshButton
                        callBackFn={handleRefresh}
                        loading={refreshing}
                    />

                    <Permission
                        module="bookez"
                        permissionKey="receipt"
                        action="create"
                    >
                        <DataCreateButton
                            callBackFn={openAddModal}
                            text="Add Sales Receipt"
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesReceipt}
                loading={listingLoader}
                emptyMessage={`No ${status} sales receipt found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-receipt-download-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "receipt",
                                    record,
                                    CustomerCode: record?.recAccountCode,
                                    voucherNumber: record?.recVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>

                        <Permission
                            module="bookez"
                            permissionKey="receipt"
                            action="update"
                        >
                            <button
                                onClick={() => openEditModal(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission
                            module="bookez"
                            permissionKey="receipt"
                            action="delete"
                        >
                            <button
                                disabled={deleteLoader}
                                onClick={(e) => {
                                    const rect =
                                        e.currentTarget.getBoundingClientRect();
                                    let x = rect.left - 150;
                                    if (x < 10) x = 10;
                                    const y = rect.top + window.scrollY - 5;
                                    setConfirmTooltip({
                                        show: true,
                                        x,
                                        y,
                                        voucherNumber:
                                            record?.recVoucherNumber ||
                                            record?.receiptVoucherNumber ||
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
                    localLimit={localLimit}
                    selectCb={(e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    }}
                    preDisabled={!pagination?.hasPrevPage}
                    nextDisabled={!pagination?.hasNextPage}
                    setLocalOffset={setLocalOffset}
                    pagination={pagination}
                />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this sales receipt?"
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
                        title: "Receipt",
                        bodyTitle: "Accounts",
                        subtitle: "Fill in the receipt details below",
                        loading: addLoader,
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
                        isSummaryFooter:false,
                        inputData: {
                            ...templateFields,
                            body: bodyFieldsWithoutReference,
                            footer: dynamicFooterArray,
                        },
                        bodyKey: "recBody",
                        handleChange: handleMainChange,
                    }}
                />
            )}

            {showReferenceModal && (
                <DynamicAddForm
                    {...{
                        show: showReferenceModal,
                        setShow: setShowReferenceModal,
                        bodyTitle:"Reference",
                        edit: false,
                        title: "Reference",
                        subtitle: selectedReferenceRow?.accountName
                            ? `Sales invoices for ${selectedReferenceRow.accountCode}`
                            : "",
                        loading: referenceLoading || referenceLoader,
                        onClose: handleCloseReferenceModal,
                        onSubmit: handleSaveReferences,
                        addButtonText: "Add Reference",
                        isAddButton: false,
                        Addbutton: false,
                        form: {
                            newReference: newReferenceAmount,
                            referenceBody: referenceRows,
                        },
                        errors: {
                            referenceBody: referenceError,
                        },
                        handleAddRow: handleAddReferenceRow,
                        handleDeleteRow: handleDeleteReferenceRow,
                        handleRowChange: handleReferenceRowChange,
                        footerTotals: {},
                        inputData: {
                            header: [
                                // {
                                //     key: "newReference",
                                //     label: "New Reference",
                                //     type: "text",
                                //     disabled: true,
                                // },
                            ],
                            body: referenceTableFields,
                            footer: [],
                        },
                        bodyKey: "referenceBody",
                        handleChange: (key: string, value: any) => {
                            if (key === "newReference") {
                                handleNewReferenceChange(value);
                            }
                        },
                    }}
                />
            )}

            <ListingModel
                {...{
                    show: downlaodPDF?.show,
                    downlaodPDF,
                    entryType: "receipt",
                    setShow: () =>
                        setDownlaodPDF(() => ({
                            show: !downlaodPDF?.show,
                        })),
                    rowData: downlaodPDF?.record,
                    report,
                    title: "Download Sales Receipt PDF",
                }}
            />
        </div>
    );
};

export default SalesReceipt;