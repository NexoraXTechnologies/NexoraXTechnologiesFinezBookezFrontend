import { useEffect, useState } from "react";
import Badge from "../../../../../components/badge";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../../components/buttons";
import SearchInput from "../../../../../components/searchInput";
import Toggle from "../../../../../components/toggle";
import DataTable from "../../../../../components/DataTable";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getAllSalesOrder } from "../../../../../redux/slices/professionalSlice/salesOrderSlice";
import SalesOrderFormModel from "./SalesOrderFormModel";
import { money, num } from "../../../../../utils/helperFunctions";
import { SelectInput, TextArea, TextInput } from "../../../../../components/inputs";


type OptionType = {
    label: string;
    value: string;
    raw?: any;
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



const SalesOrder = () => {
    const dispatch = useDispatch<any>();

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");
    const [showModal, setShowModal] = useState(false);
    const { salesOrders, loading, pagination } = useSelector(
        (state: any) => state.salesOrder
    );

    const [showProductModal, setShowProductModal] = useState(false)
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [editingProductId, setEditingProductId] = useState<any>(null);
    const [productForm, setProductForm] = useState<any>({
        ...emptyProductForm,
    });

    const [customerOptions, setCustomerOptions] = useState<OptionType[]>([]);
    const [productOptions, setProductOptions] = useState<OptionType[]>([]);
    const [unitOptions, setUnitOptions] = useState<OptionType[]>([]);

    const [errors, setErrors] = useState<any>({});
    const [productErrors, setProductErrors] = useState<any>({});

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

    const resetMainForm = () => {
        // setEditingRecord(null);
        // setErrors({});
        // resetProductForm();
        // setForm(getDefaultForm());
    };

    const openAddModal = () => {
        resetMainForm();
        setShowModal(true);
        // Add sales order logic here
    };

    const openEditModal = (record: any) => {
        console.log("Edit Sales Order:", record);
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

    const resetProductForm = () => {
        setProductForm({ ...emptyProductForm });
        setEditingProductId(null);
        setProductErrors({});
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
            <div id="sales-order-header" className="mb-3 flex items-center">
                <div id="sales-order-summary" className="flex items-start gap-3">
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? salesOrders?.length ?? 0,
                            text: "Total Sales Orders:",
                            varient: "primary",
                        }}
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        {...{
                            arr: ["open", "close"],
                            state: status,
                            setState: setStatus,
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
                            text: "Add Sales Order",
                        }}
                    />
                </div>
            </div>

            {/* ================= LIST ================= */}
            <DataTable
                columns={columns}
                data={salesOrders}
                loading={loading}
                emptyMessage={`No ${status} sales Orders found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-order-edit-button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            id="sales-order-delete-button"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();

                                let x = rect.left - 150;
                                if (x < 10) x = 10;

                                const y = rect.top + window.scrollY - 5;

                                console.log("Delete tooltip position:", {
                                    x,
                                    y,
                                    record,
                                });

                                // setConfirmTooltip({
                                //     show: true,
                                //     x,
                                //     y,
                                //     voucherNumber: record?.sOrderVoucherNumber,
                                // });
                            }}
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
            />


            {/* ================= ADD / EDIT PRODUCT MODAL ================= */}
            <Modal
                {...{
                    show: showProductModal,
                    setShow: setShowProductModal,
                    // handleClose: resetProductForm,
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
                                        className={`mb-3 grid gap-3 ${field?.grid === 2
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

export default SalesOrder;