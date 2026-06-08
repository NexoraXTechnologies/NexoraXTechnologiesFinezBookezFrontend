import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import Badge from "../../../../../components/badge";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../../components/buttons";
import SearchInput from "../../../../../components/searchInput";
import Toggle from "../../../../../components/toggle";
import DataTable from "../../../../../components/DataTable";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";

import {
    money,
    num,
    safePercent,
    todayYMD,
} from "../../../../../utils/helperFunctions";

import type { OptionType, ProductLine } from "../salesWorkflowTypes";

import { getAllProducts } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllUnits } from "../../../../../redux/slices/professionalSlice/unitMasterSlice";
import { getAllSalesOrder } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesOrderSlice";

/* ===================================================
   DEFAULT STATES
=================================================== */

const emptyProductRow = {
    id: Date.now(),
    productCode: "",
    productName: "",
    productId: "",
    description: "",
    remarks: "",
    quantity: "",
    unit: "",
    unitName: "",
    rate: "",
    grossAmount: 0,
    discountPercentage: "",
    discountAmount: 0,
    taxableAmount: 0,
    cgstPercentage: "",
    cgstAmount: 0,
    sgstPercentage: "",
    sgstAmount: 0,
    igstPercentage: "",
    igstAmount: 0,
    taxAmount: 0,
    otherAmount: "",
    netTotal: 0,
};

const getDefaultForm = () => ({
    voucherNumber: "SO",
    voucherDate: todayYMD(),

    customerCode: "",
    customerName: "",

    status: "open",
    remarks: "",

    products: [{ ...emptyProductRow, id: Date.now() }] as ProductLine[],

    grossAmount: "0.00",
    discountAmount: "0.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    igstAmount: "0.00",
    taxAmount: "0.00",
    otherAmount: "0.00",
    netAmount: "0.00",
});

/* ===================================================
   NORMALIZERS
=================================================== */

const normalizeRecords = (res: any) => {
    const records =
        res?.items ||
        res?.records ||
        res?.data?.items ||
        res?.data?.records ||
        res?.data ||
        [];

    return Array.isArray(records) ? records : [];
};

const makeCustomerOptions = (res: any): OptionType[] => {
    return normalizeRecords(res)
        .map((item: any) => {
            const label =
                item?.accountName ||
                item?.accountLedgerName ||
                item?.ledgerName ||
                item?.name ||
                item?.partyName ||
                item?.customerName ||
                item?.accountCode ||
                "";

            const value =
                item?.accountCode ||
                item?.code ||
                item?.customerCode ||
                item?._id ||
                "";

            return {
                label,
                value,
                raw: item,
            };
        })
        .filter((item: any) => item.label && item.value);
};

const makeProductOptions = (res: any): OptionType[] => {
    return normalizeRecords(res)
        .map((item: any) => {
            const label =
                item?.productName ||
                item?.name ||
                item?.itemName ||
                item?.productCode ||
                "";

            const value =
                item?.productCode ||
                item?.code ||
                item?.itemCode ||
                item?._id ||
                "";

            return {
                label,
                value,
                raw: item,
            };
        })
        .filter((item: any) => item.label && item.value);
};

const makeUnitOptions = (res: any): OptionType[] => {
    return normalizeRecords(res)
        .map((item: any) => {
            const label =
                item?.unitName ||
                item?.unit ||
                item?.name ||
                item?.label ||
                item?.unitCode ||
                "";

            const value =
                item?.unitCode ||
                item?.code ||
                item?.value ||
                item?._id ||
                item?.unitName ||
                "";

            return {
                label,
                value,
                raw: item,
            };
        })
        .filter((item: any) => item.label && item.value);
};

const SalesOrder = () => {
    const dispatch = useDispatch<any>();

    const { salesOrders, loading, pagination } = useSelector(
        (state: any) => state.salesOrder
    );

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});

    const [customerOptions, setCustomerOptions] = useState<OptionType[]>([]);
    const [productOptions, setProductOptions] = useState<OptionType[]>([]);
    const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);

    /* ===================================================
       PRODUCT HELPERS
    =================================================== */

    const getProductRate = (product: any, fallback = "") => {
        return String(
            product?.sellingPrice ||
            product?.productSellingPrice ||
            product?.salesRate ||
            product?.saleRate ||
            product?.rate ||
            product?.purchasePrice ||
            product?.productPurchasePrice ||
            fallback ||
            ""
        );
    };

    const getProductUnit = (product: any) => {
        return String(
            product?.unit ||
            product?.uom ||
            product?.unitName ||
            product?.unitCode ||
            product?.productUnit ||
            product?.unitMeasurement ||
            product?.unitMeasurementCode ||
            ""
        );
    };

    const getUnitLabel = (unitCode: string) => {
        return (
            unitOptions.find((item) => String(item.value) === String(unitCode))
                ?.label ||
            unitCode ||
            ""
        );
    };

    /* ===================================================
       CALCULATIONS
    =================================================== */

    const calculateRow = (row: any) => {
        const quantity = num(row.quantity);
        const rate = num(row.rate);

        const grossAmount = quantity * rate;

        const discountPercentage = safePercent(row.discountPercentage);
        const discountAmount = (grossAmount * discountPercentage) / 100;

        const taxableAmount = grossAmount - discountAmount;

        const cgstPercentage = safePercent(row.cgstPercentage);
        const sgstPercentage = safePercent(row.sgstPercentage);
        const igstPercentage = safePercent(row.igstPercentage);

        const cgstAmount = (taxableAmount * cgstPercentage) / 100;
        const sgstAmount = (taxableAmount * sgstPercentage) / 100;
        const igstAmount = (taxableAmount * igstPercentage) / 100;

        const taxAmount = cgstAmount + sgstAmount + igstAmount;
        const otherAmount = num(row.otherAmount);
        const netTotal = taxableAmount + taxAmount + otherAmount;

        return {
            ...row,
            quantity,
            rate,
            grossAmount,
            discountPercentage,
            discountAmount,
            taxableAmount,
            cgstPercentage,
            cgstAmount,
            sgstPercentage,
            sgstAmount,
            igstPercentage,
            igstAmount,
            taxAmount,
            otherAmount,
            netTotal,
        };
    };

    const calculateTotals = (products: ProductLine[] = []) => {
        return products.reduce(
            (acc: any, item: any) => {
                acc.totalQuantity += num(item.quantity);
                acc.grossAmount += num(item.grossAmount);
                acc.discountAmount += num(item.discountAmount);
                acc.cgstAmount += num(item.cgstAmount);
                acc.sgstAmount += num(item.sgstAmount);
                acc.igstAmount += num(item.igstAmount);
                acc.taxAmount += num(item.taxAmount);
                acc.otherAmount += num(item.otherAmount);
                acc.netAmount += num(item.netTotal);

                return acc;
            },
            {
                totalQuantity: 0,
                grossAmount: 0,
                discountAmount: 0,
                cgstAmount: 0,
                sgstAmount: 0,
                igstAmount: 0,
                taxAmount: 0,
                otherAmount: 0,
                netAmount: 0,
            }
        );
    };

    const totalSummary = useMemo(() => {
        return calculateTotals(form?.products || []);
    }, [form?.products]);

    /* ===================================================
       FETCH DROPDOWNS
    =================================================== */

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [productRes, accountRes, unitRes]: any = await Promise.all([
                    dispatch(
                        getAllProducts({
                            offset: 0,
                            limit: 200,
                            search: "",
                        }) as any
                    ).unwrap(),

                    dispatch(
                        getAllAccounts({
                            offset: 0,
                            limit: 200,
                            search: "",
                        }) as any
                    ).unwrap(),

                    dispatch(
                        getAllUnits({
                            offset: 0,
                            limit: 200,
                            search: "",
                        }) as any
                    ).unwrap(),
                ]);

                setProductOptions(makeProductOptions(productRes));
                setCustomerOptions(makeCustomerOptions(accountRes));
                setUnitOptions(makeUnitOptions(unitRes));
            } catch (err: any) {
                console.log("Failed to load dropdown data:", err);
                toast.error(err?.message || "Failed to load dropdown data");
            }
        };

        fetchDropdowns();
    }, [dispatch]);

    /* ===================================================
       FETCH SALES ORDERS
    =================================================== */

    const fetchSalesOrders = async () => {
        await dispatch(
            getAllSalesOrder({
                limit: localLimit,
                offset: localOffset,
                search: debouncedSearch,
                status,
            })
        );
    };

    useEffect(() => {
        fetchSalesOrders();
    }, [localLimit, localOffset, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const handleStatusChange = (nextStatus: "open" | "close") => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    /* ===================================================
       TABLE COLUMNS
    =================================================== */

    const columns = [
        {
            key: "sOrderVoucherNumber",
            title: "Voucher Number",
        },
        {
            key: "sOrderVoucherDate",
            title: "Voucher Date",
            render: (row: any) => (
                <span>
                    {row?.sOrderVoucherDate
                        ? new Date(row.sOrderVoucherDate).toLocaleDateString(
                            "en-IN"
                        )
                        : "-"}
                </span>
            ),
        },
        {
            key: "sOrderCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">
                        {row?.sOrderCustomerName || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                        {row?.sOrderCustomerCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "netAmount",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-slate-900">
                    ₹{Number(row?.sOrderFooter?.netAmount ?? 0).toFixed(2)}
                </span>
            ),
        },
        {
            key: "sOrderStatus",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${row?.sOrderStatus === "close"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                >
                    {row?.sOrderStatus || "-"}
                </span>
            ),
        },
    ];

    /* ===================================================
       MAIN FORM HANDLERS
    =================================================== */

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
        const products =
            record?.sOrderBody?.length > 0
                ? record.sOrderBody.map((item: any) => {
                    const unitCode = item?.unit || "";

                    return calculateRow({
                        id: item?.id || Date.now() + Math.random(),

                        productCode: item?.productCode || "",
                        productName: item?.productName || "",
                        productId: item?.productId || "",

                        description:
                            item?.description ||
                            item?.productDescription ||
                            "",
                        remarks: item?.remarks || "",

                        quantity: item?.quantity || "",

                        unit: unitCode,
                        unitName: item?.unitName || getUnitLabel(unitCode),

                        rate: item?.rate || "",

                        grossAmount: item?.grossAmount || item?.gross || 0,

                        discountPercentage:
                            item?.discountPercentage || item?.discount || "",
                        discountAmount: item?.discountAmount || 0,

                        taxableAmount: item?.taxableAmount || 0,

                        cgstPercentage:
                            item?.cgstPercentage || item?.cgst || "",
                        cgstAmount: item?.cgstAmount || 0,

                        sgstPercentage:
                            item?.sgstPercentage || item?.sgst || "",
                        sgstAmount: item?.sgstAmount || 0,

                        igstPercentage:
                            item?.igstPercentage || item?.igst || "",
                        igstAmount: item?.igstAmount || 0,

                        taxAmount: item?.taxAmount || 0,

                        otherAmount: item?.otherAmount || 0,

                        netTotal: item?.netTotal || item?.netAmount || 0,
                    });
                })
                : [{ ...emptyProductRow, id: Date.now() }];

        setEditingRecord(record);
        setErrors({});

        setForm({
            voucherNumber: record?.sOrderVoucherNumber || "SO",
            voucherDate: record?.sOrderVoucherDate
                ? String(record.sOrderVoucherDate).split("T")[0]
                : todayYMD(),

            customerCode: record?.sOrderCustomerCode || "",
            customerName: record?.sOrderCustomerName || "",

            status: record?.sOrderStatus || "open",
            remarks: record?.sOrderRemarks || "",

            products,

            grossAmount: String(record?.sOrderFooter?.grossAmount || "0.00"),
            discountAmount: String(
                record?.sOrderFooter?.discountAmount || "0.00"
            ),
            cgstAmount: String(record?.sOrderFooter?.cgstAmount || "0.00"),
            sgstAmount: String(record?.sOrderFooter?.sgstAmount || "0.00"),
            igstAmount: String(record?.sOrderFooter?.igstAmount || "0.00"),
            taxAmount: String(record?.sOrderFooter?.taxAmount || "0.00"),
            otherAmount: String(record?.sOrderFooter?.otherAmount || "0.00"),
            netAmount: String(record?.sOrderFooter?.netAmount || "0.00"),
        });

        setShowModal(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const updated = {
                ...prev,
                [key]: value,
            };

            if (key === "customerCode") {
                const selectedCustomer = customerOptions.find(
                    (item: any) => String(item.value) === String(value)
                );

                updated.customerCode = value;
                updated.customerName = selectedCustomer?.label || "";
            }

            return updated;
        });

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    const handleAddRow = () => {
        if (productOptions.length === 0) {
            toast.error("Please create at least one product first");
            return;
        }

        setForm((prev: any) => ({
            ...prev,
            products: [
                ...(prev.products || []),
                {
                    ...emptyProductRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedProducts = prev.products.filter(
                (_: any, productIndex: number) => productIndex !== index
            );

            return {
                ...prev,
                products:
                    updatedProducts.length > 0
                        ? updatedProducts
                        : [{ ...emptyProductRow, id: Date.now() }],
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const updatedProducts = [...(prev.products || [])];

            let updatedRow = {
                ...updatedProducts[index],
                [key]: value,
            };

            if (key === "productCode") {
                const selectedProduct = productOptions.find(
                    (item) => String(item.value) === String(value)
                );

                const product = selectedProduct?.raw;

                updatedRow.productCode = value;
                updatedRow.productName =
                    selectedProduct?.label || updatedRow.productName || "";
                updatedRow.productId = product?._id || "";

                updatedRow.description =
                    product?.productDescription ||
                    product?.description ||
                    "";

                updatedRow.rate = getProductRate(product, "");
                updatedRow.unit = getProductUnit(product);
                updatedRow.unitName = getUnitLabel(updatedRow.unit);
            }

            if (key === "unit") {
                updatedRow.unit = value;
                updatedRow.unitName = getUnitLabel(value);
            }

            if (key === "cgstPercentage" || key === "sgstPercentage") {
                if (num(value) > 0) {
                    updatedRow.igstPercentage = "";
                    updatedRow.igstAmount = 0;
                }
            }

            if (key === "igstPercentage") {
                if (num(value) > 0) {
                    updatedRow.cgstPercentage = "";
                    updatedRow.sgstPercentage = "";
                    updatedRow.cgstAmount = 0;
                    updatedRow.sgstAmount = 0;
                }
            }

            updatedRow = calculateRow(updatedRow);
            updatedProducts[index] = updatedRow;

            return {
                ...prev,
                products: updatedProducts,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            products: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_tax`]: "",
        }));
    };

    const getFilledRows = () => {
        return form.products.filter((row: any) => {
            return (
                row.productCode ||
                row.description ||
                row.remarks ||
                row.quantity ||
                row.unit ||
                row.rate ||
                row.discountPercentage ||
                row.cgstPercentage ||
                row.sgstPercentage ||
                row.igstPercentage ||
                row.otherAmount
            );
        });
    };

    const validateForm = () => {
        const err: any = {};

        if (!form.voucherDate) {
            err.voucherDate = "Date is required";
        }

        if (!form.customerCode) {
            err.customerCode = "Customer is required";
        }

        if (!form.status) {
            err.status = "Status is required";
        }

        const filledRows = getFilledRows();

        if (filledRows.length === 0) {
            err.products = "Please add at least one product";
        }

        form.products.forEach((row: any, index: number) => {
            const hasAnyValue =
                row.productCode ||
                row.description ||
                row.remarks ||
                row.quantity ||
                row.unit ||
                row.rate ||
                row.discountPercentage ||
                row.cgstPercentage ||
                row.sgstPercentage ||
                row.igstPercentage ||
                row.otherAmount;

            if (!hasAnyValue) return;

            if (!row.productCode) {
                err[`row_${index}_productCode`] = "Product is required";
            }

            if (!row.quantity || num(row.quantity) <= 0) {
                err[`row_${index}_quantity`] = "Quantity is required";
            }

            if (!row.unit) {
                err[`row_${index}_unit`] = "Unit is required";
            }

            if (!row.rate || num(row.rate) <= 0) {
                err[`row_${index}_rate`] = "Rate is required";
            }

            const cgst = num(row.cgstPercentage);
            const sgst = num(row.sgstPercentage);
            const igst = num(row.igstPercentage);

            if (igst > 0 && (cgst > 0 || sgst > 0)) {
                err[`row_${index}_tax`] =
                    "You can enter either IGST or CGST/SGST";

                err[`row_${index}_igstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_cgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_sgstPercentage`] = "Only one tax type allowed";
            }
        });

        setErrors(err);

        if (err.products) {
            toast.error(err.products);
        }

        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        return form.products
            .filter((row: any) => {
                return (
                    row.productCode ||
                    row.description ||
                    row.remarks ||
                    row.quantity ||
                    row.unit ||
                    row.rate ||
                    row.discountPercentage ||
                    row.cgstPercentage ||
                    row.sgstPercentage ||
                    row.igstPercentage ||
                    row.otherAmount
                );
            })
            .map((row: any) => calculateRow(row));
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchSalesOrders();
        } finally {
            setRefreshing(false);
        }
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const totals = calculateTotals(products);

        const payload = {
            sOrderVoucherDate: form.voucherDate,

            sOrderCustomerCode: form.customerCode,
            sOrderCustomerName: form.customerName,

            sOrderStatus: form.status || "open",
            sOrderRemarks: form.remarks || "",

            sOrderBody: products,

            sOrderFooter: {
                grossAmount: totals.grossAmount.toFixed(2),
                discountAmount: totals.discountAmount.toFixed(2),
                cgstAmount: totals.cgstAmount.toFixed(2),
                sgstAmount: totals.sgstAmount.toFixed(2),
                igstAmount: totals.igstAmount.toFixed(2),
                taxAmount: totals.taxAmount.toFixed(2),
                otherAmount: totals.otherAmount.toFixed(2),
                netAmount: totals.netAmount.toFixed(2),

                totalQuantity: totals.totalQuantity,
                totalGrossAmount: totals.grossAmount.toFixed(2),
                totalDiscountAmount: totals.discountAmount.toFixed(2),
                totalCgstAmount: totals.cgstAmount.toFixed(2),
                totalSgstAmount: totals.sgstAmount.toFixed(2),
                totalIgstAmount: totals.igstAmount.toFixed(2),
                totalTaxAmount: totals.taxAmount.toFixed(2),
                totalOtherAmount: totals.otherAmount.toFixed(2),
                totalNetAmount: totals.netAmount.toFixed(2),
            },
        };

        console.log("Sales Order Payload:", payload);

        toast.success(
            editingRecord
                ? "Sales order update payload ready"
                : "Sales order create payload ready"
        );
    };

    const inputData = {
        headerInput: [
            {
                key: "voucherNumber",
                title: "Voucher No",
                type: "text",
                disabled: true,
            },
            {
                key: "voucherDate",
                title: "Date",
                type: "date",
                required: true,
            },
            {
                key: "customerCode",
                title: "Customer",
                type: "select",
                required: true,
                placeholder: "Select Customer",
                options: customerOptions,
            },
            {
                key: "status",
                title: "Status",
                type: "select",
                required: true,
                options: [
                    { label: "Open", value: "open" },
                    { label: "Close", value: "close" },
                ],
            },
            {
                key: "remarks",
                title: "Remark",
                type: "textarea",
                required: false,
                placeholder: "Enter Remark",
            },
        ],

        editTable: [
            {
                key: "productCode",
                title: "Product",
                type: "select",
                width: "240px",
                required: true,
                options: productOptions,
            },
            {
                key: "description",
                title: "Description",
                type: "text",
                width: "220px",
            },
            {
                key: "remarks",
                title: "Remarks",
                type: "text",
                width: "180px",
            },
            {
                key: "quantity",
                title: "Qty",
                type: "number",
                width: "120px",
                required: true,
                align: "right",
            },
            {
                key: "unit",
                title: "Unit",
                type: "select",
                width: "150px",
                required: true,
                options: unitOptions,
            },
            {
                key: "rate",
                title: "Rate",
                type: "number",
                width: "130px",
                required: true,
                align: "right",
            },
            {
                key: "grossAmount",
                title: "Gross",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "discountPercentage",
                title: "Disc %",
                type: "number",
                width: "110px",
                align: "right",
            },
            {
                key: "discountAmount",
                title: "Disc Amt",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "cgstPercentage",
                title: "CGST %",
                type: "number",
                width: "110px",
                align: "right",
            },
            {
                key: "cgstAmount",
                title: "CGST Amt",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "sgstPercentage",
                title: "SGST %",
                type: "number",
                width: "110px",
                align: "right",
            },
            {
                key: "sgstAmount",
                title: "SGST Amt",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "igstPercentage",
                title: "IGST %",
                type: "number",
                width: "110px",
                align: "right",
            },
            {
                key: "igstAmount",
                title: "IGST Amt",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "otherAmount",
                title: "Other",
                type: "number",
                width: "130px",
                align: "right",
            },
            {
                key: "taxAmount",
                title: "Tax",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
            {
                key: "netTotal",
                title: "Net",
                type: "number",
                width: "130px",
                disabled: true,
                align: "right",
            },
        ],

        footerCard: [
            {
                label: "Gross Amount",
                value: money(totalSummary.grossAmount),
            },
            {
                label: "Discount Amount",
                value: money(totalSummary.discountAmount),
            },
            {
                label: "CGST Amount",
                value: money(totalSummary.cgstAmount),
            },
            {
                label: "SGST Amount",
                value: money(totalSummary.sgstAmount),
            },
            {
                label: "IGST Amount",
                value: money(totalSummary.igstAmount),
            },
            {
                label: "Net Amount",
                value: money(totalSummary.netAmount),
            },
        ],
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div id="sales-order-header" className="mb-3 flex items-center">
                <div id="sales-order-summary" className="flex items-start gap-3">
                    <Badge
                        count={pagination?.totalDocs ?? salesOrders?.length ?? 0}
                        text="Total Sales Orders:"
                        varient="primary"
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        arr={["open", "close"]}
                        state={status}
                        setState={handleStatusChange}
                    />

                    <SearchInput search={search} setSearch={setSearch} />

                    <DataREfreshButton
                        callBackFn={handleRefresh}
                        loading={refreshing}
                    />

                    <DataCreateButton
                        callBackFn={openAddModal}
                        text="Add Sales Order"
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesOrders}
                loading={loading}
                emptyMessage={`No ${status} sales orders found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                console.log("Delete Sales Order:", record)
                            }
                            className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            />

            <DynamicAddForm
                {...{
                    show: showModal,
                    setShow: setShowModal,
                    edit: Boolean(editingRecord),
                    title: "Sales Order",
                    subtitle: "Fill in the sales order details below",
                    loading: false,
                    onClose: () => {
                        setShowModal(false);
                        resetMainForm();
                    },
                    onSubmit: handleSubmit,
                    form,
                    errors,
                    handleAddRow,
                    handleDeleteRow,
                    handleRowChange,
                    inputData,
                    bodyKey: "products",
                    handleChange: handleMainChange,
                }}
            />
        </div>
    );
};

export default SalesOrder;