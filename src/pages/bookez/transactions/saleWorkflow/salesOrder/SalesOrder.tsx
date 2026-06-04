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
import Modal from "../../../../../components/modal";
import { SelectInput, TextInput } from "../../../../../components/inputs";



import SalesOrderFormModel from "./SalesOrderFormModel";

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
import { getAllSalesOrder } from "../../../../../redux/slices/professionalSlice/salesOrderSlice";

/* ===================================================
   DEFAULT STATES
=================================================== */

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
    voucherNumber: "SO",
    voucherDate: todayYMD(),

    customerCode: "",
    customerName: "",

    status: "open",
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
   NORMALIZERS
=================================================== */

const normalizeRecords = (res: any) => {
    const records =
        res?.items ||
        res?.records ||
        res?.data?.items ||
        res?.data?.records ||

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

const calculateTotals = (products: ProductLine[] = []) => {
    const grossAmount = products.reduce(
        (sum: number, item: any) => sum + num(item.grossAmount),
        0
    );

    const discountAmount = products.reduce(
        (sum: number, item: any) => sum + num(item.discountAmount),
        0
    );

    const cgstAmount = products.reduce(
        (sum: number, item: any) => sum + num(item.cgstAmount),
        0
    );

    const sgstAmount = products.reduce(
        (sum: number, item: any) => sum + num(item.sgstAmount),
        0
    );

    const igstAmount = products.reduce(
        (sum: number, item: any) => sum + num(item.igstAmount),
        0
    );

    const taxAmount = products.reduce(
        (sum: number, item: any) => sum + num(item.taxAmount),
        0
    );

    const otherAmount = products.reduce(
        (sum: number, item: any) => sum + num(item.otherAmount),
        0
    );

    const netAmount = products.reduce(
        (sum: number, item: any) => sum + num(item.netTotal),
        0
    );

    return {
        grossAmount,
        discountAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxAmount,
        otherAmount,
        netAmount,
    };
};

const SalesOrder = () => {
    const dispatch = useDispatch<any>();

    const { salesOrders, loading, pagination } = useSelector(
        (state: any) => state.salesOrder
    );

    /* ===================================================
       LIST STATES
    =================================================== */

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");

    /* ===================================================
       MODAL STATES
    =================================================== */

    const [showModal, setShowModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);

    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [editingProductId, setEditingProductId] = useState<any>(null);

    /* ===================================================
       FORM STATES
    =================================================== */

    const [form, setForm] = useState<any>(getDefaultForm());
    const [productForm, setProductForm] = useState<any>({ ...emptyProductForm });

    const [errors, setErrors] = useState<any>({});
    const [productErrors, setProductErrors] = useState<any>({});

    const [customerOptions, setCustomerOptions] = useState<OptionType[]>([]);
    const [productOptions, setProductOptions] = useState<OptionType[]>([]);
    const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);

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

    useEffect(() => {
        dispatch(
            getAllSalesOrder({
                limit: 10,
                offset: 0,
                search: "",
                status,
            })
        );
    }, [dispatch, status]);

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
                        ? new Date(row.sOrderVoucherDate).toLocaleDateString("en-IN")
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

    const productTableFields = [
        {
            key: "productName",
            label: "Product",
        },
        {
            key: "quantity",
            label: "Qty",
        },
        {
            key: "unitName",
            label: "Unit",
        },
        {
            key: "rate",
            label: "Rate",
            render: (item: any) => money(item?.rate),
        },
        {
            key: "netTotal",
            label: "Net Total",
            render: (item: any) => money(item?.netTotal),
        },
    ];

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
            placeholder: "Description",
        },
        {
            key: "remarks",
            label: "Remarks",
            type: "text",
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

    /* ===================================================
       CALCULATIONS
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

    const totalSummary = useMemo(() => {
        return calculateTotals(form?.products || []);
    }, [form?.products]);

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
       MAIN FORM HANDLERS
    =================================================== */

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
        setEditingRecord(record);

        setForm({
            voucherNumber: record?.sOrderVoucherNumber || "",
            voucherDate: record?.sOrderVoucherDate || todayYMD(),

            customerCode: record?.sOrderCustomerCode || "",
            customerName: record?.sOrderCustomerName || "",

            status: record?.sOrderStatus || "open",
            remarks: record?.sOrderRemarks || "",

            products: record?.sOrderBody || [],

            grossAmount: String(record?.sOrderFooter?.grossAmount || "0.00"),
            discountAmount: String(record?.sOrderFooter?.discountAmount || "0.00"),
            cgstAmount: String(record?.sOrderFooter?.cgstAmount || "0.00"),
            sgstAmount: String(record?.sOrderFooter?.sgstAmount || "0.00"),
            igstAmount: String(record?.sOrderFooter?.igstAmount || "0.00"),
            taxAmount: String(record?.sOrderFooter?.taxAmount || "0.00"),
            otherAmount: String(record?.sOrderFooter?.otherAmount || "0.00"),
            netAmount: String(record?.sOrderFooter?.netAmount || "0.00"),
        });

        setShowModal(true);
    };

    const openProductModal = () => {
        resetProductForm();
        setShowProductModal(true);
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
            (item: any) => String(item.value) === String(customerCode)
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

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await dispatch(
                getAllSalesOrder({
                    limit: 10,
                    offset: 0,
                    search,
                    status,
                })
            );
        } finally {
            setRefreshing(false);
        }
    };

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

    const handleProductChange = (key: string, value: any) => {
        setProductForm((prev: any) => {
            const updated = {
                ...prev,
                [key]: value,
            };

            if (key === "productCode") {
                const selectedProduct = productOptions.find(
                    (item) => String(item.value) === String(value)
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

    const handleAddProduct = () => {
        if (!validateProductForm()) return;

        const selectedProduct = productOptions.find(
            (item) => String(item.value) === String(productForm.productCode)
        );

        const selectedUnit = unitOptions.find(
            (item) => String(item.value) === String(productForm.unit)
        );

        const newProduct: ProductLine = {
            id: editingProductId || Date.now(),

            productCode: productForm.productCode,
            productName: selectedProduct?.label || productForm.productCode,
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
                    String(item.productCode) === String(newProduct.productCode) &&
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

            const totals = calculateTotals(updatedProducts);

            return {
                ...prev,
                products: updatedProducts,

                grossAmount: totals.grossAmount.toFixed(2),
                discountAmount: totals.discountAmount.toFixed(2),
                cgstAmount: totals.cgstAmount.toFixed(2),
                sgstAmount: totals.sgstAmount.toFixed(2),
                igstAmount: totals.igstAmount.toFixed(2),
                taxAmount: totals.taxAmount.toFixed(2),
                otherAmount: totals.otherAmount.toFixed(2),
                netAmount: totals.netAmount.toFixed(2),
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            products: "",
        }));

        resetProductForm();
        setShowProductModal(false);
    };

    const handleEditProduct = (product: ProductLine) => {
        setEditingProductId(product.id);

        setProductForm({
            productCode: product.productCode || "",
            description: product.description || "",
            remarks: product.remarks || "",
            quantity: String(product.quantity || ""),
            unit: product.unit || "",
            rate: String(product.rate || ""),
            discountPercentage: String(product.discountPercentage || ""),
            cgstPercentage: String(product.cgstPercentage || ""),
            sgstPercentage: String(product.sgstPercentage || ""),
            igstPercentage: String(product.igstPercentage || ""),
            otherAmount: String(product.otherAmount || ""),
        });

        setProductErrors({});
        setShowProductModal(true);
    };

    const handleDeleteProduct = (index: number) => {
        setForm((prev: any) => {
            const updatedProducts = prev.products.filter(
                (_: ProductLine, productIndex: number) => productIndex !== index
            );

            const totals = calculateTotals(updatedProducts);

            return {
                ...prev,
                products: updatedProducts,

                grossAmount: totals.grossAmount.toFixed(2),
                discountAmount: totals.discountAmount.toFixed(2),
                cgstAmount: totals.cgstAmount.toFixed(2),
                sgstAmount: totals.sgstAmount.toFixed(2),
                igstAmount: totals.igstAmount.toFixed(2),
                taxAmount: totals.taxAmount.toFixed(2),
                otherAmount: totals.otherAmount.toFixed(2),
                netAmount: totals.netAmount.toFixed(2),
            };
        });
    };

    const handleSubmit = () => {
        const err: any = {};

        if (!form.voucherDate) {
            err.voucherDate = "Date is required";
        }

        if (!form.customerCode) {
            err.customerCode = "Customer is required";
        }

        if (!form.products?.length) {
            err.products = "At least one product is required";
        }

        setErrors(err);

        if (Object.keys(err).length > 0) return;

        const totals = calculateTotals(form.products || []);

        const payload = {
            ...form,

            grossAmount: totals.grossAmount.toFixed(2),
            discountAmount: totals.discountAmount.toFixed(2),
            cgstAmount: totals.cgstAmount.toFixed(2),
            sgstAmount: totals.sgstAmount.toFixed(2),
            igstAmount: totals.igstAmount.toFixed(2),
            taxAmount: totals.taxAmount.toFixed(2),
            otherAmount: totals.otherAmount.toFixed(2),
            netAmount: totals.netAmount.toFixed(2),
        };

        console.log("Sales Order Payload:", payload);
    };

    const renderProductField = (field: any) => {
        const value = productForm?.[field.key] ?? "";

        const handleChange = (e: any) => {
            const selectedValue = e?.target?.value ?? e?.value ?? e;
            handleProductChange(field.key, selectedValue);
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
                    onChange={handleChange}
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

        return (
            <TextInput
                key={field.key}
                label={field.label}
                mandatory={field.isRequired}
                value={value}
                placeholder={field.placeholder || `Enter ${field.label}`}
                error={productErrors?.[field.key]}
                type={field.type || "text"}
                onChange={(e: any) => handleProductChange(field.key, e.target.value)}
            />
        );
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
                    <Toggle arr={["open", "close"]} state={status} setState={setStatus} />

                    <SearchInput search={search} setSearch={setSearch} />

                    <DataREfreshButton callBackFn={handleRefresh} loading={refreshing} />
                    {/* @ts-ignore  */}
                    <DataCreateButton callBackFn={openAddModal} text="Add Sales Order" />
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
                            onClick={() => console.log("Delete Sales Order:", record)}
                            className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            />

            <SalesOrderFormModel
                showModal={showModal}
                setShowModal={setShowModal}
                editingRecord={editingRecord}
                createLoading={false}
                updateLoading={false}
                form={form}
                errors={errors}
                customerOptions={customerOptions}
                productTableFields={productTableFields}
                grossAmount={totalSummary.grossAmount}
                discountAmount={totalSummary.discountAmount}
                cgstAmount={totalSummary.cgstAmount}
                sgstAmount={totalSummary.sgstAmount}
                igstAmount={totalSummary.igstAmount}
                netAmount={totalSummary.netAmount}
                handleSubmit={handleSubmit}
                handleMainChange={handleMainChange}
                handleCustomerChange={handleCustomerChange}
                openAddProductModal={openProductModal}
                handleEditProduct={handleEditProduct}
                handleDeleteProduct={handleDeleteProduct}
            />

            <Modal
                show={showProductModal}
                setShow={setShowProductModal}
                handleClose={resetProductForm}
                handleSubmit={handleAddProduct}
                loader={false}
                maxWidth="lg"
                state={Boolean(editingProductId)}
                gridCols={1}
                title={editingProductId ? "Edit Product" : "Add Product"}
                body={
                    <div>
                        {productInputData.map((field: any, index: number) => (
                            <div
                                key={field.key || index}
                                className={`mb-3 grid gap-3 ${field?.grid === 2 ? "grid-cols-2" : "grid-cols-1"
                                    }`}
                            >
                                {field?.child?.length
                                    ? field.child.map((child: any) => renderProductField(child))
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
                                <div key={row.label} className="mb-3 grid grid-cols-2 gap-3">
                                    <TextInput
                                        label={row.label}
                                        value={productForm?.[row.percentKey] ?? ""}
                                        placeholder={row.isAmountInput ? "Amount" : "0"}
                                        type="number"
                                        error={productErrors?.[row.percentKey]}
                                        onChange={(e: any) =>
                                            handleProductChange(row.percentKey, e.target.value)
                                        }
                                    />

                                    <div className="flex min-h-[42px] items-center justify-end rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
                                        {money(row.amount)}
                                    </div>
                                </div>
                            ))}

                            {productErrors?.tax && (
                                <p className="mb-3 text-sm text-red-500">{productErrors.tax}</p>
                            )}

                            <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-base font-semibold">
                                <span className="text-secondary">Net Total</span>
                                <span className="text-primary">{money(productCalc.netTotal)}</span>
                            </div>
                        </div>
                    </div>
                }
            />
        </div>
    );
};

export default SalesOrder;