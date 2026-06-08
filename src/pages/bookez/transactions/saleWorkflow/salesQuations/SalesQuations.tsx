import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../../components/buttons";
import DataTable from "../../../../../components/DataTable";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import Toggle from "../../../../../components/toggle";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";

import { getAllProducts } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllUnits } from "../../../../../redux/slices/professionalSlice/unitMasterSlice";

import {
    addSalesQuotation,
    deleteSalesQuotation,
    getSalesQuotationList,
    updateSalesQuotation,
} from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesQuationsSlice";

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
    voucherNumber: "SQUOTE",
    voucherDate: todayYMD(),
    sQuoteSalesAccount: "SA021",
    customerCode: "",
    customerName: "",
    status: "open",
    quoteStatus: "draft",
    remarks: "",
    products: [{ ...emptyProductRow, id: Date.now() }],
    grossAmount: "0.00",
    discountAmount: "0.00",
    cgstAmount: "0.00",
    sgstAmount: "0.00",
    igstAmount: "0.00",
    taxAmount: "0.00",
    otherAmount: "0.00",
    netAmount: "0.00",
});

const SalesQuotations = () => {
    const dispatch = useDispatch();

    const salesQuotationState = useSelector(
        (state: any) => state.salesQuotation
    );

    const {
        salesQuotations = [],
        pagination = defaultPagination,
        loading = false,
        createLoading = false,
        updateLoading = false,
        deleteLoading = false,
    } = salesQuotationState || {};

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState("open");

    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(false);

    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});

    const [customerOptions, setCustomerOptions] = useState<OptionType[]>([]);
    const [productOptions, setProductOptions] = useState<OptionType[]>([]);
    const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);
    console.log({ customerOptions })
    const [confirmTooltip, setConfirmTooltip] = useState<ConfirmTooltipState>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });

    const getRecords = (res: any) => {
        return Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.data?.items)
                    ? res.data.items
                    : Array.isArray(res?.data?.records)
                        ? res.data.records
                        : Array.isArray(res?.data)
                            ? res.data
                            : Array.isArray(res)
                                ? res
                                : [];
    };

    const makeProductOptions = (res: any): OptionType[] => {
        return getRecords(res).map((item: any) => ({
            label: item.productName || item.name || item.productCode || "-",
            value: item.productCode || item.code || item._id,
            raw: item,
        }));
    };

    const makeCustomerOptions = (res: any): OptionType[] => {
        return getRecords(res).map((item: any) => ({
            label:
                item.accountName ||
                item.customerName ||
                item.vendorName ||
                item.name ||
                "-",
            value:
                item.accountCode ||
                item.customerCode ||
                item.vendorCode ||
                item.code ||
                item._id,
            raw: item,
        }));
    };

    const makeUnitOptions = (res: any): OptionType[] => {
        return getRecords(res).map((item: any) => ({
            label:
                item.unitName ||
                item.unitCode ||
                item.name ||
                item.label ||
                "-",
            value:
                item.unitCode ||
                item.unitName ||
                item.code ||
                item.value ||
                item._id,
            raw: item,
        }));
    };

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
            unitOptions.find((item) => item.value === unitCode)?.label ||
            unitCode ||
            ""
        );
    };

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

        const otherAmount = num(row.otherAmount);
        const taxAmount = cgstAmount + sgstAmount + igstAmount;

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

            otherAmount,

            taxAmount,
            netTotal,
        };
    };

    const calculateFooter = (products: ProductLine[]) => {
        return products.reduce(
            (acc: any, item: ProductLine) => {
                acc.totalQuantity += num(item.quantity);
                acc.totalGrossAmount += num(item.grossAmount);
                acc.totalDiscountAmount += num(item.discountAmount);
                acc.totalCgstAmount += num(item.cgstAmount);
                acc.totalSgstAmount += num(item.sgstAmount);
                acc.totalIgstAmount += num(item.igstAmount);
                acc.totalTaxAmount += num(item.taxAmount);
                acc.totalOtherAmount += num(item.otherAmount);
                acc.totalNetAmount += num(item.netTotal);

                return acc;
            },
            {
                totalQuantity: 0,
                totalGrossAmount: 0,
                totalDiscountAmount: 0,
                totalCgstAmount: 0,
                totalSgstAmount: 0,
                totalIgstAmount: 0,
                totalTaxAmount: 0,
                totalOtherAmount: 0,
                totalNetAmount: 0,
            }
        );
    };

    const footerTotals = useMemo(() => {
        return calculateFooter(form.products || []);
    }, [form.products]);

    const grossAmount = footerTotals.totalGrossAmount;
    const discountAmount = footerTotals.totalDiscountAmount;
    const cgstAmount = footerTotals.totalCgstAmount;
    const sgstAmount = footerTotals.totalSgstAmount;
    const igstAmount = footerTotals.totalIgstAmount;
    const netAmount = footerTotals.totalNetAmount;

    const fetchSalesQuotations = async () => {
        await dispatch(
            getSalesQuotationList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                docStatus: status,
            }) as any
        );
    };

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

    useEffect(() => {
        fetchSalesQuotations();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const columns = [
        {
            key: "sQuoteVoucherNumber",
            title: "Voucher No",
        },
        {
            key: "sQuoteVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.sQuoteVoucherDate
                    ? formatDateForList(row.sQuoteVoucherDate)
                    : "-",
        },
        {
            key: "sQuoteCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">
                        {row?.sQuoteCustomerName || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                        {row?.sQuoteCustomerCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "sQuoteBody",
            title: "Items",
            render: (row: any) => row?.sQuoteBody?.length || 0,
        },
        {
            key: "sQuoteFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-indigo-700">
                    {money(row?.sQuoteFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "sQuoteDocStatus",
            title: "Doc Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.sQuoteDocStatus === "open"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    {row?.sQuoteDocStatus || "-"}
                </span>
            ),
        },
        {
            key: "sQuoteStatus",
            title: "Quote Status",
            render: (row: any) => (
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700">
                    {row?.sQuoteStatus || "-"}
                </span>
            ),
        },
    ];

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchSalesQuotations();
            toast.success("Sales quotation list refreshed");
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
        const footer = record?.sQuoteFooter || {};

        const products =
            record?.sQuoteBody?.length > 0
                ? record.sQuoteBody.map((item: any) => {
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

        setEditingRecord(true);
        setErrors({});

        setForm({
            voucherNumber: record?.sQuoteVoucherNumber || "SQ",
            voucherDate: formatDateForInput(record?.sQuoteVoucherDate),

            customerCode: record?.sQuoteCustomerCode || "",
            customerName: record?.sQuoteCustomerName || "",

            sQuoteSalesAccount: record?.sQuoteSalesAccount || "SA021",

            status: record?.sQuoteDocStatus || "open",
            quoteStatus: record?.sQuoteStatus || "draft",

            remarks: record?.sQuoteRemark || "",

            products,

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
        });

        setShowModal(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const updated = {
                ...prev,
                [key]: value,
            };

            if (key === "sQuoteCustomerName") {
                const selectedCustomer = customerOptions.find(
                    (item) => item.value === value
                );
                updated.sQuoteCustomerCode = value;
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
                (_: any, i: number) => i !== index
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
                    (item) => item.value === value
                );

                const product = selectedProduct?.raw;

                updatedRow.productCode = value;
                updatedRow.productName = selectedProduct?.label || "";
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

        // if (!form.customerCode) {
        //     err.customerCode = "Customer is required";
        // }

        if (!form.status) {
            err.status = "Document status is required";
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
        console.log({ err })
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

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const footer = calculateFooter(products);

        const payload:any = {
            sQuoteVoucherDate: form.voucherDate,

            sQuoteCustomerCode: form.sQuoteCustomerCode,
            sQuoteCustomerName: form.customerName,
            sQuoteSalesAccount: form.sQuoteSalesAccount || "SA021",

            sQuoteStatus: form.quoteStatus || "draft",
            sQuoteDocStatus: form.status || "open",

            sQuoteRemark: form.remarks,

            sQuoteBody: products.map((item: ProductLine) => ({
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,

                productDescription: item.description,
                description: item.description,
                remarks: item.remarks,

                quantity: String(item.quantity),

                unit: item.unit,

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

            sQuoteFooter: {
                grossAmount: fmtMoney(footer.totalGrossAmount),
                discountAmount: fmtMoney(footer.totalDiscountAmount),
                cgstAmount: fmtMoney(footer.totalCgstAmount),
                sgstAmount: fmtMoney(footer.totalSgstAmount),
                igstAmount: fmtMoney(footer.totalIgstAmount),
                taxAmount: fmtMoney(footer.totalTaxAmount),
                otherAmount: fmtMoney(footer.totalOtherAmount),
                netAmount: fmtMoney(footer.totalNetAmount),

                adjustedAmount: "0",
                balanceAmount: fmtMoney(footer.totalNetAmount),

                totalQuantity: footer.totalQuantity,
                totalGrossAmount: fmtMoney(footer.totalGrossAmount),
                totalDiscountAmount: fmtMoney(footer.totalDiscountAmount),
                totalCgstAmount: fmtMoney(footer.totalCgstAmount),
                totalSgstAmount: fmtMoney(footer.totalSgstAmount),
                totalIgstAmount: fmtMoney(footer.totalIgstAmount),
                totalTaxAmount: fmtMoney(footer.totalTaxAmount),
                totalOtherAmount: fmtMoney(footer.totalOtherAmount),
                totalNetAmount: fmtMoney(footer.totalNetAmount),
            },
        };
        try {
            console.log(form, "form?.sQuoteVoucherNumber", editingRecord)
            if (editingRecord) {
                await dispatch(
                    updateSalesQuotation({
                        sQuoteVoucherNumber: form?.voucherNumber,
                        payload: payload,
                    }) as any
                ).unwrap();

                toast.success("Sales quotation updated successfully");
            } else {
                await dispatch(addSalesQuotation({ payload }) as any).unwrap();

                toast.success("Sales quotation created successfully");
            }

            setShowModal(false);
            resetMainForm();

            fetchSalesQuotations();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip.voucherNumber) return;

            await dispatch(
                deleteSalesQuotation(confirmTooltip.voucherNumber) as any
            ).unwrap();

            toast.success("Sales quotation deleted");
            fetchSalesQuotations();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete sales quotation");
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
                key: "sQuoteCustomerName",
                title: "Customer Account",
                type: "select",
                required: true,
                placeholder: "Select Customer",
                options: customerOptions,
            },
            {
                key: "sQuoteCustomerCode",
                title: "Customer Code",
                type: "text",
                required: false,
                placeholder: "Sales Account",
            },
            // {
            //     key: "status",
            //     title: "Document Status",
            //     type: "select",
            //     required: true,
            //     options: [
            //         { label: "Open", value: "open" },
            //         { label: "Close", value: "close" },
            //     ],
            // },
            {
                key: "quoteStatus",
                title: "Status",
                type: "select",
                required: true,
                options: [
                    { label: "Draft", value: "draft" },
                    { label: "Sent", value: "sent" },
                    { label: "Pending Response", value: "pending_response" },
                    { label: "Negotiation", value: "Negotiation" },
                    { label: "Negotiation", value: "follow_up" },
                    { label: "Won", value: "won" },
                    { label: "Lost", value: "lost" },
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
                value: money(grossAmount),
            },
            {
                label: "Discount Amount",
                value: money(discountAmount),
            },
            {
                label: "CGST Amount",
                value: money(cgstAmount),
            },
            {
                label: "SGST Amount",
                value: money(sgstAmount),
            },
            {
                label: "IGST Amount",
                value: money(igstAmount),
            },
            {
                label: "Net Amount",
                value: money(netAmount),
            },
        ],
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div id="sales-quotation-header" className="mb-3 flex items-center">
                <div
                    id="sales-quotation-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Sales Quotations:",
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

                    <DataCreateButton
                        {...{
                            callBackFn: openAddModal,
                            text: "Add Sales Quotation",
                        }}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesQuotations}
                loading={loading}
                emptyMessage={`No ${status} sales quotation found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            id="sales-quotation-delete-button"
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
                                    voucherNumber: record?.sQuoteVoucherNumber,
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
                    message="Are you sure you want to delete this sales quotation?"
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
                    title: "Sales Quotation",
                    subtitle: "Fill in the sales quotation details below",
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

export default SalesQuotations;