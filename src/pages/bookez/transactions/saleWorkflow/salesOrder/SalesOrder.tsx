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
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";

import {
    fmtMoney,
    formatDateForInput,
    formatDateForList,
    money,
    num,
    safePercent,
    todayYMD,
} from "../../../../../utils/helperFunctions";

import type {
    ConfirmTooltipState,
    OptionType,
    ProductLine,
} from "../salesWorkflowTypes";

import { getAllProducts } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllUnits } from "../../../../../redux/slices/professionalSlice/unitMasterSlice";

import {
    createSalesOrder,
    deleteSalesOrder,
    getAllSalesOrder,
    updateSalesOrder,
} from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesOrderSlice";

/* ===================================================
   DEFAULT STATES
=================================================== */

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

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

    const salesOrderState = useSelector((state: any) => state.salesOrder);

    const {
        salesOrders = [],
        pagination = defaultPagination,
        loading = false,
        createLoading = false,
        updateLoading = false,
        deleteLoading = false,
    } = salesOrderState || {};

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

    const [confirmTooltip, setConfirmTooltip] = useState<ConfirmTooltipState>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });

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
                const [productRes, accountRes, unitRes]: any =
                    await Promise.all([
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
                        ? formatDateForList(row.sOrderVoucherDate)
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
            key: "sOrderBody",
            title: "Items",
            render: (row: any) => row?.sOrderBody?.length || 0,
        },
        {
            key: "sOrderFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-indigo-700">
                    {money(row?.sOrderFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "sOrderStatus",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        (row?.sOrderDocStatus || row?.sOrderStatus) === "close"
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                    }`}
                >
                    {row?.sOrderDocStatus || row?.sOrderStatus || "-"}
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
            voucherDate:
                formatDateForInput(record?.sOrderVoucherDate) || todayYMD(),

            customerCode: record?.sOrderCustomerCode || "",
            customerName: record?.sOrderCustomerName || "",

            status: record?.sOrderDocStatus || record?.sOrderStatus || "open",
            remarks: record?.sOrderRemarks || record?.sOrderRemark || "",

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
                    product?.productDescription || product?.description || "";

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

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const totals = calculateTotals(products);

        const payload: any = {
            sOrderVoucherDate: form.voucherDate,

            sOrderCustomerCode: form.customerCode,
            sOrderCustomerName: form.customerName,

            sOrderStatus: form.status || "open",
            sOrderDocStatus: form.status || "open",
            sOrderRemarks: form.remarks || "",
            sOrderRemark: form.remarks || "",

            sOrderBody: products.map((item: ProductLine) => ({
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,

                productDescription: item.description,
                description: item.description,
                remarks: item.remarks,

                quantity: String(item.quantity),

                unit: item.unit,
                unitName: item.unitName,

                rate: String(item.rate),

                gross: fmtMoney(item.grossAmount),
                grossAmount: fmtMoney(item.grossAmount),

                discount: String(item.discountPercentage),
                discountPercentage: String(item.discountPercentage),
                discountAmount: fmtMoney(item.discountAmount),

                taxableAmount: fmtMoney(item.taxableAmount),

                cgst: String(item.cgstPercentage),
                cgstPercentage: String(item.cgstPercentage),
                cgstAmount: fmtMoney(item.cgstAmount),

                sgst: String(item.sgstPercentage),
                sgstPercentage: String(item.sgstPercentage),
                sgstAmount: fmtMoney(item.sgstAmount),

                igst: String(item.igstPercentage),
                igstPercentage: String(item.igstPercentage),
                igstAmount: fmtMoney(item.igstAmount),

                taxAmount: fmtMoney(item.taxAmount),

                otherAmount: fmtMoney(item.otherAmount),

                netAmount: fmtMoney(item.netTotal),
                netTotal: fmtMoney(item.netTotal),
            })),

            sOrderFooter: {
                grossAmount: fmtMoney(totals.grossAmount),
                discountAmount: fmtMoney(totals.discountAmount),
                cgstAmount: fmtMoney(totals.cgstAmount),
                sgstAmount: fmtMoney(totals.sgstAmount),
                igstAmount: fmtMoney(totals.igstAmount),
                taxAmount: fmtMoney(totals.taxAmount),
                otherAmount: fmtMoney(totals.otherAmount),
                netAmount: fmtMoney(totals.netAmount),

                adjustedAmount: "0",
                balanceAmount: fmtMoney(totals.netAmount),

                totalQuantity: totals.totalQuantity,
                totalGrossAmount: fmtMoney(totals.grossAmount),
                totalDiscountAmount: fmtMoney(totals.discountAmount),
                totalCgstAmount: fmtMoney(totals.cgstAmount),
                totalSgstAmount: fmtMoney(totals.sgstAmount),
                totalIgstAmount: fmtMoney(totals.igstAmount),
                totalTaxAmount: fmtMoney(totals.taxAmount),
                totalOtherAmount: fmtMoney(totals.otherAmount),
                totalNetAmount: fmtMoney(totals.netAmount),
            },
        };

        try {
            if (editingRecord) {
                await dispatch(
                    updateSalesOrder({
                        voucherNumber: form?.voucherNumber,
                        data: payload,
                    }) as any
                ).unwrap();

                toast.success("Sales order updated successfully");
            } else {
                await dispatch(createSalesOrder(payload) as any).unwrap();

                toast.success("Sales order created successfully");
            }

            setShowModal(false);
            resetMainForm();
            fetchSalesOrders();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip.voucherNumber) return;

            await dispatch(
                deleteSalesOrder(confirmTooltip.voucherNumber) as any
            ).unwrap();

            toast.success("Sales order deleted successfully");
            fetchSalesOrders();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete sales order");
        } finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
            });
        }
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
                            id="sales-order-edit-button"
                            type="button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            id="sales-order-delete-button"
                            type="button"
                            disabled={deleteLoading}
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
                                    voucherNumber: record?.sOrderVoucherNumber,
                                });
                            }}
                            className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                        </button>
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
                    message="Are you sure you want to delete this sales order?"
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

            <DynamicAddForm
                {...{
                    show: showModal,
                    setShow: setShowModal,
                    edit: Boolean(editingRecord),
                    title: "Sales Order",
                    subtitle: "Fill in the sales order details below",
                    loading: createLoading || updateLoading,
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