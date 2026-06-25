import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Badge from "../../../../components/badge";
import { DataCreateButton } from "../../../../components/buttons";
import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import { useDispatch, useSelector } from "react-redux";
import { Edit, Trash2 } from "lucide-react";
import Pagination from "../../../../components/pagination";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";

import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";

import { addDebitNote, deleteDebitNote, getDebitNoteList, updateDebitNote } from "../../../../redux/slices/professionalSlice/openingBalancesStocks/debitNoteSlice";
import { getPurchaseInvoiceList } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";
import { getPurchaseReturnList } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseReturnSlice";

const toNum = (value: any) => {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
};

const r2 = (value: any) => {
    return Math.round((toNum(value) + Number.EPSILON) * 100) / 100;
};

const todayYMD = () => new Date().toISOString().split("T")[0];

const emptyItemRow = {
    id: Date.now(),

    productCode: "",
    productName: "",

    quantity: "",
    unit: "",
    uom: "",

    rate: "",

    grossAmount: 0,

    discount: "",
    discountAmount: 0,

    taxableAmount: 0,

    cgstPercent: "",
    cgstAmount: 0,

    sgstPercent: "",
    sgstAmount: 0,

    igstPercent: "",
    igstAmount: 0,

    netAmount: 0,

    remarks: "",
};

const statusOptions = [
    { label: "Draft", value: "draft" },
    { label: "Open", value: "open" },
    { label: "Posted", value: "posted" },
    { label: "Close", value: "close" },
    { label: "Cancelled", value: "cancelled" },
];

const sourceTypeOptions = [
    { label: "Adjustment", value: "Adjustment" },
    { label: "Purchase Invoice", value: "purchaseInvoice" },
    { label: "Purchase Return", value: "purchaseReturn" },
];

const getDefaultForm = () => ({
    voucherNumber: "AUTO",
    voucherno: "AUTO",
    voucherDate: todayYMD(),

    voucherType: "salesDebitNote",

    sourceType: "",
    referenceNumber: "",

    customerCode: "",
    customerName: "",

    reason: "",
    remarks: "",
    remark: "",

    adjustmentOnly: false,
    adjustmentNetAmount: "",

    status: "open",

    items: [
        { ...emptyItemRow, id: Date.now() },
        { ...emptyItemRow, id: Date.now() + Math.random() },
    ],

    totalQty: "0.00",
    grossAmount: "0.00",
    totalCgst: "0.00",
    totalSgst: "0.00",
    totalIgst: "0.00",
    totalDiscount: "0.00",
    netAmount: "0.00",
});

const mainColumns = [
    {
        key: "voucherNumber",
        title: "Voucher",
        render: (row: any) => row?.voucherNumber || row?.debitNoteNumber || "-",
    },
    {
        key: "voucherDate",
        title: "Date",
        type: "date",
        render: (row: any) =>
            row?.voucherDate ? String(row.voucherDate).split("T")[0] : "-",
    },
    {
        key: "vendor",
        title: "Vendor",
        render: (row: any) => (
            <div>
                <div className="font-medium text-card-foreground">
                    {row?.customer?.accountName || row?.customerName || "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                    {row?.customer?.accountCode || row?.customerCode || "-"}
                </div>
            </div>
        ),
    },
    {
        key: "sourceType",
        title: "Source",
        render: (row: any) => row?.sourceType || "-",
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) => (
            <span className="font-semibold text-primary">
                ₹{Number(row?.totals?.netAmount || row?.netAmount || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) => (
            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                {row?.status || "-"}
            </span>
        ),
    },
];

const DebitNote = () => {
    const dispatch = useDispatch<any>();

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const [edit, setEdit] = useState(false);

    const [localLimit, setLocalLimit] = useState(10);
    const [localOffset, setLocalOffset] = useState(0);

    const [confirmTooltip, setConfirmTooltip] = useState<any>(false);
    const debitNoteState = useSelector(
        (s: any) => s.debitNote || s.salesDebitNote || {}
    );

    const {
        salesDebitNotes,
        debitNotes,
        records,
        pagination,
        listingLoader,
        addLoader,
        deleteLoader,
    } = debitNoteState;

    const { accounts } = useSelector((s: any) => s.accountMaster);
    const { products } = useSelector((s: any) => s.productMaster);
    const { purchaseInvoiceList } = useSelector((s: any) => s.purchaseInvoice);
    const { purchaseReturnList } = useSelector((s: any) => s.purchaseReturn)

    const debitNoteList = salesDebitNotes || debitNotes || records || [];
    const hideBodySection = Boolean(form?.adjustmentOnly);
    const showBodySection = form?.sourceType !== "Adjustment" && !hideBodySection;
    const isManualMode = form?.sourceType === "Adjustment" || hideBodySection;

    const purchaseInvoiceOption = useMemo(() => {
        return (
            purchaseInvoiceList?.map((item: any) => ({
                label: item.pInvVoucherNumber,
                value: item.pInvVoucherNumber
            })) || []
        )
    }, [purchaseInvoiceList])

    const purchaseInvoiceReturnOption = useMemo(() => {
        return (
            purchaseReturnList.map((item: any) => ({
                label: item.pRetVoucherNumber,
                value: item.pRetVoucherNumber
            }))
        )
    }, [purchaseReturnList])

    const customerOptions = useMemo(() => {
        return (
            accounts?.map((item: any) => ({
                label: item.accountName,
                value: item.accountCode,
                raw: item,
            })) || []
        );
    }, [accounts]);

    const productOptions = useMemo(() => {
        return (
            products?.map((item: any) => ({
                label: item.productName,
                value: item.productCode,
                raw: item,
            })) || []
        );
    }, [products]);


    const inputData = useMemo(() => {
        const header: any[] = [
            {
                key: "voucherno",
                label: "Voucher No",
                type: "text",
                disabled: true,
            },
            {
                key: "voucherDate",
                label: "Date",
                type: "date",
                disabled: false,
                required: true,
            },
            {
                key: "customerCode",
                label: "Vendor",
                type: "select",
                required: true,
                options: customerOptions,
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                disabled: false,
                options: statusOptions,
            },
            {
                key: "sourceType",
                label: "Source Type",
                type: "select",
                disabled: false,
                options: sourceTypeOptions,
            },

            {
                key: "reason",
                label: "Reason",
                type: "text",
                required: true,
                placeholder: "Enter reason",
            },
        ];

        if (form?.sourceType === "purchaseInvoice") {
            header.push({
                key: "invoiceNumber",
                label: "Reference-Purchase Invoice",
                type: "select",
                required: true,
                placeholder: "Select open purchase invoice",
                options: purchaseInvoiceOption
            });
        }

        if (form?.sourceType === "purchaseReturn") {
            header.push({
                key: "purchaseReturnNumber",
                label: "Reference-Purchase Return",
                type: "select",
                required: true,
                placeholder: "Select open purchase return",
                options: purchaseInvoiceReturnOption
            });
        }




        header.push(

            {
                key: "adjustmentOnly",
                label: "Adjustment Only",
                type: "toggle",
                disabled: false,
            }
        );

        if (form?.adjustmentOnly) {
            header.push({
                key: "adjustmentNetAmount",
                label: "Adjustment Net Amount",
                type: "number",
                required: true,
                placeholder: "Enter adjustment amount",
            });
        }


        header.push({
            key: "remark",
            label: "Remarks",
            type: "textarea",
            required: false,
            placeholder: "Enter remarks",
            colSpan: "full",
        });

        return {
            header,
            body:
                showBodySection
                    ? [
                        {
                            key: "productCode",
                            label: "Product",
                            title: "Product",
                            type: "select",
                            width: "260px",
                            required: true,
                            options: productOptions,
                        },
                        {
                            key: "quantity",
                            label: "Qty",
                            title: "Qty",
                            type: "number",
                            width: "110px",
                            align: "right",
                        },
                        {
                            key: "rate",
                            label: "Rate",
                            title: "Rate",
                            type: "number",
                            width: "140px",
                            align: "right",
                        },
                        {
                            key: "discount",
                            label: "Discount %",
                            title: "Discount %",
                            type: "number",
                            width: "140px",
                            align: "right",
                        },
                        {
                            key: "cgstPercent",
                            label: "CGST %",
                            title: "CGST %",
                            type: "number",
                            width: "120px",
                            align: "right",
                        },
                        {
                            key: "sgstPercent",
                            label: "SGST %",
                            title: "SGST %",
                            type: "number",
                            width: "120px",
                            align: "right",
                        },
                        {
                            key: "igstPercent",
                            label: "IGST %",
                            title: "IGST %",
                            type: "number",
                            width: "120px",
                            align: "right",
                        },
                        {
                            key: "remarks",
                            label: "Line Remarks",
                            title: "Line Remarks",
                            type: "text",
                            width: "220px",
                        },
                    ]
                    : [],
            footer: [
                {
                    key: "totalQty",
                    label: "Total Quantity",
                    type: "number",
                    disabled: true,
                    align: "right",
                },
                {
                    key: "grossAmount",
                    label: "Gross Amount",
                    type: "number",
                    disabled: true,
                    align: "right",
                },
                {
                    key: "totalCgst",
                    label: "CGST",
                    type: "number",
                    disabled: true,
                    align: "right",
                },
                {
                    key: "totalSgst",
                    label: "SGST",
                    type: "number",
                    disabled: true,
                    align: "right",
                },
                {
                    key: "totalIgst",
                    label: "IGST",
                    type: "number",
                    disabled: true,
                    align: "right",
                },
                {
                    key: "totalDiscount",
                    label: "Discount",
                    type: "number",
                    disabled: true,
                    align: "right",
                },
                {
                    key: "netAmount",
                    label: "Net Amount",
                    type: "number",
                    disabled: true,
                    align: "right",
                },
            ],
        };
    }, [
        form?.sourceType,
        form?.adjustmentOnly,
        showBodySection,
        customerOptions,
        productOptions,

    ]);

    const refreshList = () => {
        return dispatch(
            getDebitNoteList({
                limit: localLimit,
                offset: localOffset,
                search,
            })
        );
    };


    useEffect(() => {
        dispatch(getPurchaseInvoiceList({
            limit: 200,
            offset: 0
        }))
    }, [dispatch])


    useEffect(() => {
        dispatch(getPurchaseReturnList({
            limit: 200,
            offset: 0
        }))
    }, [dispatch])

    useEffect(() => {
        dispatch(getAllProducts({
            limit: 200,
            offset: 0,
        }))
    }, [dispatch])

    useEffect(() => {
        dispatch(
            getAllAccounts({
                limit: 200,
                offset: 0,
                accountType: "vendor",
            })
        );

        refreshList();
    }, [dispatch, localLimit, localOffset]);



    const calculateRow = (row: any) => {
        const quantity = toNum(row.quantity);
        const rate = toNum(row.rate);

        const grossAmount = r2(quantity * rate);

        const discountPercent = toNum(row.discount);
        const discountAmount = r2((grossAmount * discountPercent) / 100);

        const taxableAmount = r2(Math.max(0, grossAmount - discountAmount));

        const cgstPercent = toNum(row.cgstPercent);
        const sgstPercent = toNum(row.sgstPercent);
        const igstPercent = toNum(row.igstPercent);

        const cgstAmount = r2((taxableAmount * cgstPercent) / 100);
        const sgstAmount = r2((taxableAmount * sgstPercent) / 100);
        const igstAmount = r2((taxableAmount * igstPercent) / 100);

        const netAmount = r2(
            taxableAmount + cgstAmount + sgstAmount + igstAmount
        );

        return {
            ...row,
            grossAmount,
            discountAmount,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            netAmount,
        };
    };

    const calculateTotals = (items: any[] = []) => {
        return (items || []).reduce(
            (acc: any, item: any) => {
                const row = calculateRow(item);

                const hasProduct = row?.productCode;
                const quantity = toNum(row?.quantity);

                if (!hasProduct || quantity <= 0) return acc;

                acc.totalQty += quantity;
                acc.grossAmount += toNum(row.grossAmount);
                acc.totalCgst += toNum(row.cgstAmount);
                acc.totalSgst += toNum(row.sgstAmount);
                acc.totalIgst += toNum(row.igstAmount);
                acc.totalDiscount += toNum(row.discountAmount);
                acc.netAmount += toNum(row.netAmount);

                return acc;
            },
            {
                totalQty: 0,
                grossAmount: 0,
                totalCgst: 0,
                totalSgst: 0,
                totalIgst: 0,
                totalDiscount: 0,
                netAmount: 0,
            }
        );
    };

    const resetForm = () => {
        setForm(getDefaultForm());
        setErrors({});
        setEdit(false);
    };

    const handleChange = (key: string, value: any) => {
        setForm((prev: any) => {
            let updated = {
                ...prev,
                [key]: value,
            };

            if (key === "customerCode") {
                const customer = customerOptions.find(
                    (item: any) => String(item.value) === String(value)
                );

                updated.customerName = customer?.label || "";
                updated.referenceNumber = "";
            }

            if (key === "sourceType") {
                updated.referenceNumber = "";
                updated.invoiceNumber = "";
                updated.purchaseReturnNumber = "";

                if (value === "Adjustment") {
                    updated.adjustmentOnly = true;
                    updated.netAmount = updated.adjustmentNetAmount || updated.netAmount || "0.00";
                }
            }

            // if (key === "adjustmentOnly") {
            //     const checked =
            //         value === true ||
            //         value === "true" ||
            //         value === 1 ||
            //         value === "1";

            //     updated.adjustmentOnly = checked;

            //     if (!checked) {
            //         updated.adjustmentNetAmount = "";
            //     }
            // }

            if (key === "adjustmentOnly") {
                const checked =
                    value === true ||
                    value === "true" ||
                    value === 1 ||
                    value === "1";

                updated.adjustmentOnly = checked;

                if (checked) {
                    updated.netAmount = updated.adjustmentNetAmount || updated.netAmount || "0.00";
                }

                if (!checked) {
                    const totals = calculateTotals(updated.items || []);

                    updated = {
                        ...updated,
                        ...totals,
                    };
                }
            }

            if (key === "adjustmentNetAmount") {
                updated.netAmount = value || "0.00";
            }


            return updated;
        });

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    const handleAddRow = () => {
        setForm((prev: any) => {
            const updatedItems = [
                ...(prev.items || []),
                { ...emptyItemRow, id: Date.now() + Math.random() },
            ];

            return {
                ...prev,
                items: updatedItems,
                ...calculateTotals(updatedItems),
            };
        });
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedItems = (prev.items || []).filter(
                (_: any, i: number) => i !== index
            );

            const finalItems =
                updatedItems.length > 0
                    ? updatedItems
                    : [{ ...emptyItemRow, id: Date.now() }];

            return {
                ...prev,
                items: finalItems,
                ...calculateTotals(finalItems),
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const updatedItems = [...(prev.items || [])];
            const currentRow = updatedItems[index] || {};

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (key === "productCode") {
                const selectedProductOption = productOptions.find(
                    (item: any) => String(item.value) === String(value)
                );

                const product = selectedProductOption?.raw || {};

                updatedRow = {
                    ...updatedRow,

                    productCode: product?.productCode || value || "",
                    productName: product?.productName || selectedProductOption?.label || "",

                    unit: product?.unit || product?.unitName || product?.uom || "",
                    uom: product?.uom || product?.unit || product?.unitName || "",

                    rate:
                        product?.sellingPrice !== undefined &&
                            product?.sellingPrice !== null
                            ? String(product.sellingPrice)
                            : product?.rate !== undefined && product?.rate !== null
                                ? String(product.rate)
                                : updatedRow.rate || "",

                    cgstPercent:
                        product?.cgst !== undefined && product?.cgst !== null
                            ? String(product.cgst)
                            : product?.csgst !== undefined && product?.csgst !== null
                                ? String(product.csgst)
                                : updatedRow.cgstPercent || "",

                    sgstPercent:
                        product?.sgst !== undefined && product?.sgst !== null
                            ? String(product.sgst)
                            : product?.csgst !== undefined && product?.csgst !== null
                                ? String(product.csgst)
                                : updatedRow.sgstPercent || "",

                    igstPercent:
                        product?.igst !== undefined && product?.igst !== null
                            ? String(product.igst)
                            : updatedRow.igstPercent || "",
                };
            }

            if (
                (key === "cgstPercent" || key === "sgstPercent") &&
                toNum(value) > 0
            ) {
                updatedRow.igstPercent = "";
                updatedRow.igstAmount = 0;
            }

            if (key === "igstPercent" && toNum(value) > 0) {
                updatedRow.cgstPercent = "";
                updatedRow.sgstPercent = "";
                updatedRow.cgstAmount = 0;
                updatedRow.sgstAmount = 0;
            }

            updatedRow = calculateRow(updatedRow);
            updatedItems[index] = updatedRow;

            return {
                ...prev,
                items: updatedItems,
                ...calculateTotals(updatedItems),
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            [`row_${index}_${key}`]: "",
            netAmount: "",
            items: "",
        }));
    };

    const validateForm = () => {
        const err: any = {};

        if (!form?.voucherDate) {
            err.voucherDate = "Voucher date is required";
        }

        if (!form?.sourceType) {
            err.sourceType = "Source type is required";
        }

        if (!form?.customerCode) {
            err.customerCode = "vendor is required";
        }

        if (!form?.reason) {
            err.reason = "Reason is required";
        }

        // if (form?.sourceType !== "manual" && !form?.referenceNumber) {
        //     err.referenceNumber =
        //         form?.sourceType === "invoice"
        //             ? "Invoice number is required"
        //             : "Sales return number is required";
        // }

        if (form?.sourceType === "purchaseInvoice" && !form?.invoiceNumber) {
            err.invoiceNumber = "Purchase invoice number is required";
        }

        if (form?.sourceType === "purchaseReturn" && !form?.purchaseReturnNumber) {
            err.purchaseReturnNumber = "Purchase return number is required";
        }

        if (form?.adjustmentOnly && toNum(form?.adjustmentNetAmount) <= 0) {
            err.adjustmentNetAmount = "Adjustment amount is required";
        }

        if (showBodySection) {
            const activeRows = (form?.items || []).filter((row: any) => {
                return row?.productCode || row?.quantity || row?.rate;
            });

            if (activeRows.length === 0) {
                err.items = "Please add at least one item";
            }

            (form?.items || []).forEach((row: any, index: number) => {
                const hasAnyValue =
                    row?.productCode || row?.quantity || row?.rate;

                if (!hasAnyValue) return;

                if (!row?.productCode) {
                    err[`row_${index}_productCode`] = "Product is required";
                }

                if (toNum(row?.quantity) <= 0) {
                    err[`row_${index}_quantity`] = "Quantity is required";
                }

                if (toNum(row?.rate) <= 0) {
                    err[`row_${index}_rate`] = "Rate is required";
                }

                const cgst = toNum(row?.cgstPercent);
                const sgst = toNum(row?.sgstPercent);
                const igst = toNum(row?.igstPercent);

                if (igst > 0 && (cgst > 0 || sgst > 0)) {
                    err[`row_${index}_igstPercent`] =
                        "Use either IGST or CGST/SGST";
                    err[`row_${index}_cgstPercent`] =
                        "Use either IGST or CGST/SGST";
                    err[`row_${index}_sgstPercent`] =
                        "Use either IGST or CGST/SGST";
                }
            });
        }

        setErrors(err);

        if (Object.keys(err).length > 0) {
            const firstError =
                err.customerCode ||
                err.sourceType ||
                err.reason ||
                err.invoiceNumber ||
                err.purchaseReturnNumber ||
                err.adjustmentNetAmount ||
                err.items ||
                err.voucherDate ||
                Object.values(err)[0] ||
                "Please fix validation errors";

            toast.error(String(firstError));
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const isAdjustmentOnly = Boolean(form?.adjustmentOnly);

        // const calculatedItems =
        //     form?.sourceType !== "manual"
        //         ? (form.items || [])
        //             .map((item: any) => calculateRow(item))
        //             .filter(
        //                 (item: any) =>
        //                     item?.productCode && toNum(item.quantity) > 0
        //             )
        //         : [];


        const calculatedItems =
            showBodySection
                ? (form.items || [])
                    .map((item: any) => calculateRow(item))
                    .filter(
                        (item: any) =>
                            item?.productCode && toNum(item.quantity) > 0
                    )
                : [];

        const totals =
            showBodySection
                ? calculateTotals(calculatedItems)
                : {
                    totalQty: 0,
                    grossAmount: 0,
                    totalCgst: 0,
                    totalSgst: 0,
                    totalIgst: 0,
                    totalDiscount: 0,
                    netAmount: toNum(form.adjustmentNetAmount),
                };

        const payload = {
            voucherNumber: edit
                ? form?.voucherNumber || form?.voucherno
                : "AUTO",

            voucherDate: form.voucherDate,
            voucherType: "salesDebitNote",

            sourceType: form.sourceType || "Adjustment",

            reference: {
                isLinked:
                    form.sourceType !== "Adjustment" &&
                    Boolean(
                        form.sourceType === "purchaseInvoice"
                            ? form.invoiceNumber
                            : form.sourceType === "purchaseReturn"
                                ? form.purchaseReturnNumber
                                : false
                    ),

                purchaseInvoice:
                    form.sourceType === "purchaseInvoice"
                        ? {
                            invoiceNumber: form.invoiceNumber || null,
                            invoiceId: null,
                        }
                        : {
                            invoiceNumber: null,
                            invoiceId: null,
                        },

                purchaseReturn:
                    form.sourceType === "purchaseReturn"
                        ? {
                            purchaseReturnNumber: form.purchaseReturnNumber || null,
                        }
                        : {
                            purchaseReturnNumber: null,
                        },
            },

            customer: {
                accountCode: form.customerCode,
                accountName: form.customerName || "",
            },

            reason: form.reason || "",

            items: calculatedItems.map((row: any) => ({
                productCode: row.productCode,
                productName: row.productName || "",
                quantity: toNum(row.quantity),
                unit: row.unit || row.uom || "",
                rate: toNum(row.rate),

                grossAmount: toNum(row.grossAmount),

                cgstPercent: toNum(row.cgstPercent),
                cgstAmount: toNum(row.cgstAmount),

                sgstPercent: toNum(row.sgstPercent),
                sgstAmount: toNum(row.sgstAmount),

                igstPercent: toNum(row.igstPercent),
                igstAmount: toNum(row.igstAmount),

                discount: toNum(row.discount),
                discountAmount: toNum(row.discountAmount),

                netAmount: toNum(row.netAmount),

                remarks: row.remarks || "",
            })),

            totals,

            adjustmentOnly: isAdjustmentOnly,
            status: form.status || "open",
            remarks: form.remark || form.remarks || "",
        };

        try {
            if (edit) {
                await dispatch(
                    updateDebitNote({
                        payload,
                        debitNoteNumber:
                            form?.voucherNumber || form?.voucherno,
                    })
                ).unwrap();
            } else {
                await dispatch(
                    addDebitNote({
                        payload,
                    })
                ).unwrap();
            }

            await refreshList();

            toast.success(
                `Debit Note ${edit ? "updated" : "added"} successfully`
            );

            setShowModal(false);
            resetForm();
        } catch (error: any) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.payload?.message ||
                error?.message ||
                "Operation failed";

            toast.error(backendMessage);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;

            if (!voucherNumber) {
                toast.error("Debit note number not found");
                return;
            }

            await dispatch(
                deleteDebitNote({
                    debitNoteNumber: voucherNumber,
                })
            ).unwrap();

            toast.success("Debit Note deleted successfully");

            await refreshList();
        } catch (error: any) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.payload?.message ||
                error?.message ||
                "Failed to delete debit note";

            toast.error(backendMessage);
        } finally {
            setConfirmTooltip(false);
        }
    };

    const dynamicFooterArray = useMemo(() => {
        return [
            {
                key: "totalQty",
                label: "Total Quantity",
                type: "number",
                disabled: true,
                align: "right",
                value: Number(form?.totalQty || 0).toFixed(2),
                rawValue: form?.totalQty || "0.00",
            },
            {
                key: "grossAmount",
                label: "Gross Amount",
                type: "number",
                disabled: true,
                align: "right",
                value: Number(form?.grossAmount || 0).toFixed(2),
                rawValue: form?.grossAmount || "0.00",
            },
            {
                key: "totalCgst",
                label: "CGST",
                type: "number",
                disabled: true,
                align: "right",
                value: Number(form?.totalCgst || 0).toFixed(2),
                rawValue: form?.totalCgst || "0.00",
            },
            {
                key: "totalSgst",
                label: "SGST",
                type: "number",
                disabled: true,
                align: "right",
                value: Number(form?.totalSgst || 0).toFixed(2),
                rawValue: form?.totalSgst || "0.00",
            },
            {
                key: "totalIgst",
                label: "IGST",
                type: "number",
                disabled: true,
                align: "right",
                value: Number(form?.totalIgst || 0).toFixed(2),
                rawValue: form?.totalIgst || "0.00",
            },
            {
                key: "totalDiscount",
                label: "Discount",
                type: "number",
                disabled: true,
                align: "right",
                value: Number(form?.totalDiscount || 0).toFixed(2),
                rawValue: form?.totalDiscount || "0.00",
            },
            {
                key: "netAmount",
                label: "Net Amount",
                type: "number",
                disabled: true,
                align: "right",
                value: Number(form?.netAmount || 0).toFixed(2),
                rawValue: form?.netAmount || "0.00",
            },
        ];
    }, [
        form?.totalQty,
        form?.grossAmount,
        form?.totalCgst,
        form?.totalSgst,
        form?.totalIgst,
        form?.totalDiscount,
        form?.netAmount,
    ]);

    const openEdit = (item: any) => {
        const rawItems = Array.isArray(item?.items) ? item.items : [];

        const body =
            rawItems.length > 0
                ? rawItems.map((row: any) =>
                    calculateRow({
                        id: row.id || Date.now() + Math.random(),

                        productCode: row.productCode || "",
                        productName: row.productName || "",

                        quantity: row.quantity || "",
                        unit: row.unit || row.uom || "",
                        uom: row.uom || row.unit || "",

                        rate: row.rate || "",

                        discount: row.discount || "",

                        cgstPercent:
                            row.cgstPercent ?? row.cgst ?? "",
                        sgstPercent:
                            row.sgstPercent ?? row.sgst ?? "",
                        igstPercent:
                            row.igstPercent ?? row.igst ?? "",

                        remarks: row.remarks || "",
                    })
                )
                : [{ ...emptyItemRow, id: Date.now() }];

        const totals = calculateTotals(body);
        const isAdjustmentOnly = Boolean(item?.adjustmentOnly);

        setForm({
            ...getDefaultForm(),
            ...item,

            voucherNumber:
                item?.voucherNumber || item?.debitNoteNumber || "AUTO",

            voucherno:
                item?.voucherNumber || item?.debitNoteNumber || "AUTO",

            voucherDate: item?.voucherDate
                ? String(item.voucherDate).split("T")[0]
                : todayYMD(),

            voucherType: item?.voucherType || "salesDebitNote",

            customerCode:
                item?.customer?.accountCode || item?.customerCode || "",

            customerName:
                item?.customer?.accountName || item?.customerName || "",

            sourceType: item?.sourceType || "Adjustment",
            invoiceNumber:
                item?.reference?.purchaseInvoice?.invoiceNumber ||
                item?.invoiceNumber ||
                "",

            purchaseReturnNumber:
                item?.reference?.purchaseReturn?.purchaseReturnNumber ||
                item?.purchaseReturnNumber ||
                "",

            referenceNumber:
                item?.reference?.purchaseInvoice?.invoiceNumber ||
                item?.reference?.purchaseReturn?.purchaseReturnNumber ||
                item?.referenceNumber ||
                "",

            reason: item?.reason || "",

            adjustmentOnly: isAdjustmentOnly,

            adjustmentNetAmount: isAdjustmentOnly
                ? String(item?.totals?.netAmount || item?.netAmount || "")
                : "",

            remark: item?.remarks || item?.remark || "",
            remarks: item?.remarks || item?.remark || "",

            status: item?.status || "draft",

            // items: isAdjustmentOnly ? [] : body,
            items: body,

            ...(isAdjustmentOnly
                ? {
                    netAmount:
                        item?.totals?.netAmount || item?.netAmount || "0.00",
                }
                : totals),
        });

        setErrors({});
        setEdit(true);
        setShowModal(true);
    };

    return (
        <>
            <div className="flex h-full w-full flex-col border border-gray-200 bg-white p-4 shadow-sm">
                <div
                    id="debit-note-header"
                    className="mb-3 flex flex-wrap items-center gap-2"
                >
                    <div
                        id="debit-note-summary"
                        className="flex items-start gap-3"
                    >
                        <Badge
                            {...{
                                count: pagination?.totalDocs ?? 0,
                                text: "Total Debit Notes:",
                            }}
                        />
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <div className="me-2">
                            <SearchInput {...{ search, setSearch }} />
                        </div>

                        <Permission
                            module="bookez"
                            permissionKey="debitNotes"
                            action="create"
                        >
                            <DataCreateButton
                                {...{
                                    text: "Create Debit Note",
                                    callBackFn: () => {
                                        resetForm();
                                        setShowModal(true);
                                    },
                                }}
                            />
                        </Permission>
                    </div>
                </div>

                <DataTable
                    columns={mainColumns}
                    data={debitNoteList}
                    loading={listingLoader}
                    emptyMessage="No debit note found"
                    actions={(item: any) => (
                        <div className="flex items-center gap-2">
                            <Permission
                                module="bookez"
                                permissionKey="debitNotes"
                                action="update"
                            >
                                <button
                                    id="debit-note-edit-button"
                                    onClick={() => openEdit(item)}
                                    className="cursor-pointer rounded-lg p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                                >
                                    <Edit size={16} />
                                </button>
                            </Permission>

                            <Permission
                                module="bookez"
                                permissionKey="debitNotes"
                                action="delete"
                            >
                                <button
                                    type="button"
                                    disabled={deleteLoader}
                                    onClick={(e: any) => {
                                        const rect =
                                            e.currentTarget.getBoundingClientRect();

                                        let x: any = rect.left - 150;
                                        if (x < 10) x = 10;

                                        const y: any =
                                            rect.top + window.scrollY - 5;

                                        setConfirmTooltip({
                                            show: true,
                                            x,
                                            y,
                                            voucherNumber:
                                                item?.voucherNumber ||
                                                item?.debitNoteNumber,
                                        });
                                    }}
                                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
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

                {confirmTooltip?.show && (
                    <ConfirmTooltip
                        x={confirmTooltip.x}
                        y={confirmTooltip.y}
                        message="Are you sure you want to delete this debit note?"
                        confirmText="Delete"
                        cancelText="Cancel"
                        onConfirm={handleDeleteConfirm}
                        onCancel={() => setConfirmTooltip(false)}
                    />
                )}

                <DynamicAddForm
                    show={showModal}
                    setShow={setShowModal}
                    edit={edit}
                    title="Debit Note"
                    subtitle="Fill in the debit note details below"
                    loading={addLoader}
                    onClose={() => {
                        setShowModal(false);
                        resetForm();
                    }}
                    onSubmit={handleSubmit}
                    addButtonText="Add Item"
                    // manualselected={form?.sourceType === "manual" }
                    manualselected={isManualMode}
                    form={form}
                    errors={errors}
                    handleAddRow={handleAddRow}
                    handleDeleteRow={handleDeleteRow}
                    handleRowChange={handleRowChange}
                    inputData={{
                        ...inputData,
                        footer: dynamicFooterArray,
                    }}
                    bodyKey="items"
                    handleChange={handleChange}
                />
            </div>
        </>
    );
};

export default DebitNote;