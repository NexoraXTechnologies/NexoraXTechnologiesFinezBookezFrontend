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
import Modal from "../../../../../components/modal";
import { SelectInput, TextArea, TextInput } from "../../../../../components/inputs";

import { getAllProducts } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import { getAllAccounts } from "../../../../../redux/slices/professionalSlice/accountMasterSlice";

import {
    createSalesQuotation,
    deleteSalesQuotation,
    getAllSalesQuotations,
    updateSalesQuotation,
} from "../../../../../redux/slices/professionalSlice/salesQuationsSlice";

import SalesQuotationsFormModal from "./SalesQuationsFormModel";
import Toggle from "../../../../../components/toggle";
import {
    fmtMoney,
    formatDateForInput,
    formatDateForList,
    money,
    num,
    safePercent,
    todayYMD,
} from "../../../../../utils/helperFunctions";
import type { ConfirmTooltipState, OptionType, ProductLine } from "../salesWorkflowTypes";
import { getAllUnits } from "../../../../../redux/slices/professionalSlice/unitMasterSlice";



const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const emptyProductForm = {
    productCode: "",
    description: "",
    remarks: "",
    quantity: "",
    unit: "",
    rate: "",
    discountPercentage: "",
    cgstPercentage: "",
    sgstPercentage: "",
    igstPercentage: "",
    otherAmount: "",
};

const getDefaultForm = () => ({
    voucherNumber: "SQ",
    voucherDate: todayYMD(),
    sQuoteSalesAccount: "SA021",

    customerCode: "",
    customerName: "",

    // Document status: open / close
    status: "open",

    // Quotation workflow status: draft / sent / accepted
    quoteStatus: "draft",

    remarks: "",

    products: [] as ProductLine[],

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
    COMPONENT
=================================================== */

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

    /* ===================================================
        LIST STATES
    =================================================== */

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [refreshing, setRefreshing] = useState(false);

    // Toggle for API docStatus=open / docStatus=close
    const [status, setStatus] = useState("open");

    /* ===================================================
        MODAL STATES
    =================================================== */

    const [showModal, setShowModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);

    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [editingProductId, setEditingProductId] = useState<any>(null);

    const [form, setForm] = useState<any>(getDefaultForm());
    const [productForm, setProductForm] = useState<any>({
        ...emptyProductForm,
    });

    const [errors, setErrors] = useState<any>({});
    const [productErrors, setProductErrors] = useState<any>({});

    /* ===================================================
        DROPDOWNS
    =================================================== */

    const [customerOptions, setCustomerOptions] = useState<OptionType[]>([]);
    const [productOptions, setProductOptions] = useState<OptionType[]>([]);
    const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);

    /* ===================================================
        DELETE TOOLTIP
    =================================================== */

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
            unitOptions.find((item) => item.value === unitCode)?.label ||
            unitCode ||
            ""
        );
    };

    /* ===================================================
        OPTION MAPPERS
    =================================================== */

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

    /* ===================================================
        PRODUCT CALCULATION
    =================================================== */

    const productCalc = useMemo(() => {
        const quantity = num(productForm.quantity);
        const rate = num(productForm.rate);

        const grossAmount = quantity * rate;

        const discountPercentage = safePercent(productForm.discountPercentage);
        const cgstPercentage = safePercent(productForm.cgstPercentage);
        const sgstPercentage = safePercent(productForm.sgstPercentage);
        const igstPercentage = safePercent(productForm.igstPercentage);

        const discountAmount = (grossAmount * discountPercentage) / 100;
        const taxableAmount = grossAmount - discountAmount;

        const cgstAmount = (taxableAmount * cgstPercentage) / 100;
        const sgstAmount = (taxableAmount * sgstPercentage) / 100;
        const igstAmount = (taxableAmount * igstPercentage) / 100;

        const otherAmount = num(productForm.otherAmount);
        const taxAmount = cgstAmount + sgstAmount + igstAmount;

        const netTotal = taxableAmount + taxAmount + otherAmount;

        return {
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
    }, [productForm]);

    /* ===================================================
        FOOTER TOTALS
    =================================================== */

    const footerTotals = useMemo(() => {
        return form.products.reduce(
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
    }, [form.products]);

    const grossAmount = footerTotals.totalGrossAmount;
    const discountAmount = footerTotals.totalDiscountAmount;
    const cgstAmount = footerTotals.totalCgstAmount;
    const sgstAmount = footerTotals.totalSgstAmount;
    const igstAmount = footerTotals.totalIgstAmount;
    const netAmount = footerTotals.totalNetAmount;

    /* ===================================================
        PRODUCT MODAL CONFIGS
    =================================================== */

    const productInputData = [
        {
            key: "productCode",
            label: "Product",
            type: "select",
            isRequired: true,
            placeholder: "Select Product",
            options: productOptions,
        },
        {
            key: "description",
            label: "Description",
            type: "text",
            isRequired: false,
            placeholder: "Description",
        },
        {
            key: "remarks",
            label: "Remarks",
            type: "text",
            isRequired: false,
            placeholder: "Remarks",
        },
        {
            grid: 2,
            child: [
                {
                    key: "quantity",
                    label: "Quantity",
                    type: "number",
                    isRequired: true,
                    placeholder: "Quantity",
                },
                {
                    key: "unit",
                    label: "Unit",
                    type: "select",
                    isRequired: true,
                    placeholder: "Unit",
                    options: unitOptions,
                },
            ],
        },
        {
            key: "rate",
            label: "Rate",
            type: "number",
            isRequired: true,
            placeholder: "Rate",
        },
    ];

    const percentAmountRows = [
        {
            label: "Discount",
            percentKey: "discountPercentage",
            amount: productCalc.discountAmount,
        },
        {
            label: "CGST",
            percentKey: "cgstPercentage",
            amount: productCalc.cgstAmount,
        },
        {
            label: "SGST",
            percentKey: "sgstPercentage",
            amount: productCalc.sgstAmount,
        },
        {
            label: "IGST",
            percentKey: "igstPercentage",
            amount: productCalc.igstAmount,
        },
        {
            label: "Other Amount",
            percentKey: "otherAmount",
            amount: productCalc.otherAmount,
            isAmountInput: true,
        },
    ];

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
        FETCH LIST BASIS ON DOCUMENT STATUS
    =================================================== */

    const fetchSalesQuotations = async () => {
        await dispatch(
            getAllSalesQuotations({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                docStatus: status,
            }) as any
        );
    };

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

    /* ===================================================
        MAIN TABLE COLUMNS - DIRECT API KEYS
    =================================================== */

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
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${
                        row?.sQuoteDocStatus === "open"
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

    const productTableFields = [
        {
            title: "Product",
            key: "productName",
        },
        {
            title: "Qty",
            key: "quantity",
        },
        {
            title: "Unit",
            key: "unitName",
        },
        {
            title: "Rate",
            key: "rate",
            render: (item: ProductLine) => money(item?.rate),
        },
        {
            title: "Net Amount",
            key: "netTotal",
            render: (item: ProductLine) => (
                <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs text-indigo-700">
                    {money(item?.netTotal)}
                </span>
            ),
        },
    ];

    /* ===================================================
        FORM HANDLERS
    =================================================== */

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchSalesQuotations();
            toast.success("Sales quotation list refreshed");
        } finally {
            setRefreshing(false);
        }
    };

    const resetProductForm = () => {
        setProductForm({ ...emptyProductForm });
        setEditingProductId(null);
        setProductErrors({});
    };

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        resetProductForm();
        setForm(getDefaultForm());
    };

    const openAddModal = () => {
        resetMainForm();
        setShowModal(true);
    };

    const openEditModal = (record: any) => {
        const footer = record?.sQuoteFooter || {};

        const products = (record?.sQuoteBody || []).map((item: any) => {
            const unitCode = item?.unit || "";

            return {
                id: item?.id || Date.now() + Math.random(),

                productCode: item?.productCode || "",
                productName: item?.productName || "",
                productId: item?.productId || "",

                description: item?.description || item?.productDescription || "",
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

                cgstPercentage: item?.cgstPercentage || item?.cgst || "",
                cgstAmount: item?.cgstAmount || 0,

                sgstPercentage: item?.sgstPercentage || item?.sgst || "",
                sgstAmount: item?.sgstAmount || 0,

                igstPercentage: item?.igstPercentage || item?.igst || "",
                igstAmount: item?.igstAmount || 0,

                taxAmount: item?.taxAmount || 0,

                otherAmount: item?.otherAmount || 0,

                netTotal: item?.netTotal || item?.netAmount || 0,
            };
        });

        setEditingRecord(record);
        setErrors({});
        setProductErrors({});

        setForm({
            voucherNumber: record?.sQuoteVoucherNumber || "SQ",
            voucherDate: formatDateForInput(record?.sQuoteVoucherDate),

            customerCode: record?.sQuoteCustomerCode || "",
            customerName: record?.sQuoteCustomerName || "",

            sQuoteSalesAccount: record?.sQuoteSalesAccount || "SA021",

            // form.status is document status
            status: record?.sQuoteDocStatus || "open",

            // form.quoteStatus is quotation workflow status
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

        resetProductForm();
        setShowModal(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [key]: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    const handleCustomerChange = (customerCode: string) => {
        const selectedCustomer = customerOptions.find(
            (item) => item.value === customerCode
        );

        setForm((prev: any) => ({
            ...prev,
            customerCode,
            customerName: selectedCustomer?.label || "",
        }));

        setErrors((prev: any) => ({
            ...prev,
            customerCode: "",
        }));
    };

    const handleProductChange = (key: string, value: any) => {
        setProductForm((prev: any) => {
            const updated = {
                ...prev,
                [key]: value,
            };

            if (key === "productCode") {
                const selectedProduct = productOptions.find(
                    (item) => item.value === value
                )?.raw;

                updated.description =
                    selectedProduct?.productDescription ||
                    selectedProduct?.description ||
                    "";

                updated.rate = getProductRate(selectedProduct, "");
                updated.unit = getProductUnit(selectedProduct);
            }

            if (key === "cgstPercentage" || key === "sgstPercentage") {
                if (num(value) > 0) {
                    updated.igstPercentage = "";
                }
            }

            if (key === "igstPercentage") {
                if (num(value) > 0) {
                    updated.cgstPercentage = "";
                    updated.sgstPercentage = "";
                }
            }

            return updated;
        });

        setProductErrors((prev: any) => ({
            ...prev,
            [key]: "",
            tax: "",
        }));
    };

    /* ===================================================
        VALIDATIONS
    =================================================== */

    const validateProductForm = () => {
        const err: any = {};

        if (!productForm.productCode) {
            err.productCode = "Product is required";
        }

        if (!productForm.quantity || num(productForm.quantity) <= 0) {
            err.quantity = "Quantity is required";
        }

        if (!productForm.unit) {
            err.unit = "Unit is required";
        }

        if (!productForm.rate || num(productForm.rate) <= 0) {
            err.rate = "Rate is required";
        }

        const cgst = num(productForm.cgstPercentage);
        const sgst = num(productForm.sgstPercentage);
        const igst = num(productForm.igstPercentage);

        if (igst > 0 && (cgst > 0 || sgst > 0)) {
            err.tax = "You can enter either IGST or CGST/SGST";
            err.igstPercentage = "Only one tax type allowed";
            err.cgstPercentage = "Only one tax type allowed";
            err.sgstPercentage = "Only one tax type allowed";
        }

        setProductErrors(err);
        return Object.keys(err).length === 0;
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
            err.status = "Document status is required";
        }

        if (!form.products || form.products.length === 0) {
            err.products = "Please add at least one product";
        }

        setErrors(err);

        if (err.products) {
            toast.error(err.products);
        }

        return Object.keys(err).length === 0;
    };

    /* ===================================================
        PRODUCT ADD / EDIT / DELETE
    =================================================== */

    const openAddProductModal = () => {
        if (productOptions.length === 0) {
            toast.error("Please create at least one product first");
            return;
        }

        resetProductForm();
        setShowProductModal(true);
    };

    const handleAddProduct = () => {
        if (!validateProductForm()) return;

        const selectedProduct = productOptions.find(
            (item) => item.value === productForm.productCode
        );

        const selectedUnit = unitOptions.find(
            (item) => item.value === productForm.unit
        );

        const newProduct: ProductLine = {
            id: editingProductId || Date.now(),

            productCode: productForm.productCode,
            productName: selectedProduct?.label || "",
            productId: selectedProduct?.raw?._id || "",

            description: productForm.description || "",
            remarks: productForm.remarks || "",

            quantity: productCalc.quantity,

            unit: productForm.unit,
            unitName: selectedUnit?.label || productForm.unit,

            rate: productCalc.rate,

            grossAmount: productCalc.grossAmount,

            discountPercentage: productCalc.discountPercentage,
            discountAmount: productCalc.discountAmount,

            taxableAmount: productCalc.taxableAmount,

            cgstPercentage: productCalc.cgstPercentage,
            cgstAmount: productCalc.cgstAmount,

            sgstPercentage: productCalc.sgstPercentage,
            sgstAmount: productCalc.sgstAmount,

            igstPercentage: productCalc.igstPercentage,
            igstAmount: productCalc.igstAmount,

            taxAmount: productCalc.taxAmount,

            otherAmount: productCalc.otherAmount,

            netTotal: productCalc.netTotal,
        };

        setForm((prev: any) => {
            const alreadyExists = prev.products.some(
                (item: ProductLine) =>
                    item.productCode === newProduct.productCode &&
                    item.id !== editingProductId
            );

            if (alreadyExists) {
                toast.error("This product is already added");
                return prev;
            }

            const updatedProducts = editingProductId
                ? prev.products.map((item: ProductLine) =>
                      item.id === editingProductId ? newProduct : item
                  )
                : [...prev.products, newProduct];

            return {
                ...prev,
                products: updatedProducts,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            products: "",
        }));

        resetProductForm();
        setShowProductModal(false);
    };

    const handleEditProduct = (row: any) => {
        setEditingProductId(row.id);

        setProductForm({
            productCode: row.productCode || "",
            description: row.description || "",
            remarks: row.remarks || "",
            quantity: row.quantity || "",
            unit: row.unit || "",
            rate: row.rate || "",
            discountPercentage: row.discountPercentage || "",
            cgstPercentage: row.cgstPercentage || "",
            sgstPercentage: row.sgstPercentage || "",
            igstPercentage: row.igstPercentage || "",
            otherAmount: row.otherAmount || "",
        });

        setProductErrors({});
        setShowProductModal(true);
    };

    const handleDeleteProduct = (id: any) => {
        setForm((prev: any) => ({
            ...prev,
            products: prev.products.filter((item: ProductLine) => item.id !== id),
        }));
    };

    /* ===================================================
        SUBMIT / DELETE
    =================================================== */

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = {
            sQuoteVoucherDate: form.voucherDate,

            sQuoteCustomerCode: form.customerCode,
            sQuoteCustomerName: form.customerName,
            sQuoteSalesAccount: form.sQuoteSalesAccount || "SA021",

            // workflow status
            sQuoteStatus: form.quoteStatus || "draft",

            // document status
            sQuoteDocStatus: form.status || "open",

            sQuoteRemark: form.remarks,

            sQuoteBody: form.products.map((item: ProductLine) => ({
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
                grossAmount: fmtMoney(footerTotals.totalGrossAmount),
                discountAmount: fmtMoney(footerTotals.totalDiscountAmount),
                cgstAmount: fmtMoney(footerTotals.totalCgstAmount),
                sgstAmount: fmtMoney(footerTotals.totalSgstAmount),
                igstAmount: fmtMoney(footerTotals.totalIgstAmount),
                taxAmount: fmtMoney(footerTotals.totalTaxAmount),
                otherAmount: fmtMoney(footerTotals.totalOtherAmount),
                netAmount: fmtMoney(footerTotals.totalNetAmount),

                adjustedAmount: "0",
                balanceAmount: fmtMoney(footerTotals.totalNetAmount),

                totalQuantity: footerTotals.totalQuantity,
                totalGrossAmount: fmtMoney(footerTotals.totalGrossAmount),
                totalDiscountAmount: fmtMoney(footerTotals.totalDiscountAmount),
                totalCgstAmount: fmtMoney(footerTotals.totalCgstAmount),
                totalSgstAmount: fmtMoney(footerTotals.totalSgstAmount),
                totalIgstAmount: fmtMoney(footerTotals.totalIgstAmount),
                totalTaxAmount: fmtMoney(footerTotals.totalTaxAmount),
                totalOtherAmount: fmtMoney(footerTotals.totalOtherAmount),
                totalNetAmount: fmtMoney(footerTotals.totalNetAmount),
            },
        };

        try {
            if (editingRecord) {
                await dispatch(
                    updateSalesQuotation({
                        voucherNumber: editingRecord?.sQuoteVoucherNumber,
                        data: payload,
                    }) as any
                ).unwrap();

                toast.success("Sales quotation updated successfully");
            } else {
                await dispatch(createSalesQuotation(payload) as any).unwrap();

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

            await dispatch(deleteSalesQuotation(confirmTooltip.voucherNumber) as any)
                .unwrap();

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

    /* ===================================================
        RENDER PRODUCT FIELD
    =================================================== */

    const renderProductField = (field: any) => {
        const value = productForm?.[field.key] ?? "";

        const commonProps = {
            label: field.label,
            mandatory: field.isRequired,
            value,
            placeholder: field.placeholder || `Enter ${field.label}`,
            error: productErrors?.[field.key],
        };

        if (field.type === "select") {
            return (
                <SelectInput
                    key={field.key}
                    label={field.label}
                    mandatory={field.isRequired}
                    value={value}
                    placeholder={field.placeholder || `Select ${field.label}`}
                    error={productErrors?.[field.key]}
                    onChange={(e: any) =>
                        handleProductChange(field.key, e?.target?.value)
                    }
                    options={[
                        {
                            label: field.placeholder || `Select ${field.label}`,
                            value: "",
                        },
                        ...(field.options || []),
                    ]}
                />
            );
        }

        if (field.type === "textarea") {
            return (
                <TextArea
                    key={field.key}
                    {...commonProps}
                    onChange={(e: any) =>
                        handleProductChange(field.key, e.target.value)
                    }
                />
            );
        }

        return (
            <TextInput
                key={field.key}
                {...commonProps}
                type={field.type || "text"}
                onChange={(e: any) =>
                    handleProductChange(field.key, e.target.value)
                }
            />
        );
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {/* ================= HEADER ================= */}
            <div id="sales-quotation-header" className="mb-3 flex items-center">
                <div id="sales-quotation-summary" className="flex items-start gap-3">
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
                    {/* @ts-ignore  */}
                    <DataCreateButton
                        {...{
                            callBackFn: openAddModal,
                            text: "Add Sales Quotation",
                        }}
                    />
                </div>
            </div>

            {/* ================= LIST ================= */}
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

            {/* ================= PAGINATION ================= */}
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

            {/* ================= DELETE TOOLTIP ================= */}
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

            {/* ================= SALES QUOTATION MAIN MODAL ================= */}
            <SalesQuotationsFormModal
                showModal={showModal}
                setShowModal={setShowModal}
                editingRecord={editingRecord}
                createLoading={createLoading}
                updateLoading={updateLoading}
                form={form}
                errors={errors}
                customerOptions={customerOptions}
                productTableFields={productTableFields}
                grossAmount={grossAmount}
                discountAmount={discountAmount}
                cgstAmount={cgstAmount}
                sgstAmount={sgstAmount}
                igstAmount={igstAmount}
                netAmount={netAmount}
                handleSubmit={handleSubmit}
                handleMainChange={handleMainChange}
                handleCustomerChange={handleCustomerChange}
                openAddProductModal={openAddProductModal}
                handleEditProduct={(row: any) => handleEditProduct(row)}
                handleDeleteProduct={(row: any) =>
                    handleDeleteProduct(row?.id || row)
                }
            />

            {/* ================= ADD / EDIT PRODUCT MODAL ================= */}
            <Modal
                {...{
                    show: showProductModal,
                    setShow: setShowProductModal,
                    handleClose: resetProductForm,
                    handleSubmit: handleAddProduct,
                    loader: false,
                    maxWidth: "lg",
                    state: Boolean(editingProductId),
                    gridCols: 1,
                    title: editingProductId ? "Edit Product" : "Add Product",
                    body: (
                        <>
                            <div>
                                {productInputData.map((field: any, index: number) => (
                                    <div
                                        key={field.key || index}
                                        className={`mb-3 grid gap-3 ${
                                            field?.grid === 2
                                                ? "grid-cols-2"
                                                : "grid-cols-1"
                                        }`}
                                    >
                                        {field?.child?.length
                                            ? field.child.map((child: any) =>
                                                  renderProductField(child)
                                              )
                                            : renderProductField(field)}
                                    </div>
                                ))}

                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800">
                                        <span>Gross Amount</span>
                                        <span>{money(productCalc.grossAmount)}</span>
                                    </div>

                                    <div className="mb-2 grid grid-cols-2 gap-3 px-1 text-center text-sm font-semibold text-slate-800">
                                        <span>Percentage / Amount</span>
                                        <span>Amount</span>
                                    </div>

                                    {percentAmountRows.map((row: any) => (
                                        <div
                                            key={row.label}
                                            className="mb-3 grid grid-cols-2 gap-3"
                                        >
                                            <TextInput
                                                label={row.label}
                                                value={
                                                    productForm?.[
                                                        row.percentKey
                                                    ] ?? ""
                                                }
                                                placeholder={
                                                    row.isAmountInput
                                                        ? "Amount"
                                                        : "0"
                                                }
                                                type="number"
                                                error={
                                                    productErrors?.[
                                                        row.percentKey
                                                    ]
                                                }
                                                onChange={(e: any) =>
                                                    handleProductChange(
                                                        row.percentKey,
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <div className="flex min-h-[42px] items-center justify-end rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                                                {money(row.amount)}
                                            </div>
                                        </div>
                                    ))}

                                    {productErrors?.tax && (
                                        <p className="mb-3 text-sm text-red-500">
                                            {productErrors.tax}
                                        </p>
                                    )}

                                    <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-base font-semibold">
                                        <span className="text-secondary">
                                            Net Total
                                        </span>
                                        <span className="text-primary">
                                            {money(productCalc.netTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ),
                }}
            />
        </div>
    );
};

export default SalesQuotations;