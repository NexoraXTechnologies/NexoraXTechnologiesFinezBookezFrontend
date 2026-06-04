import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { PrimaryButton, SecondaryButton } from "../../../../components/buttons";
import SearchInput from "../../../../components/searchInput";
import Modal from "../../../../components/modal";
import { SelectInput, TextArea, TextInput } from "../../../../components/inputs";
import DataTable, { ColumnWiseTable } from "../../../../components/DataTable";
import Toggle from "../../../../components/toggle";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import {
    addOpeningStock,
    deleteOpeningStock,
    getOpeningStockList,
    updateOpeningStock,
} from "../../../../redux/slices/professionalSlice/openingStockSlice";
import { money, num, safePercent, todayYMD } from "../../../../utils/helperFunctions";



const mainColumns = [
    {
        key: "openingStockVoucherNumber",
        title: "Voucher",
    },
    {
        key: "openingStockDate",
        title: "Date",
        type: "date"
    },
    {
        key: "totalQuantity",
        title: "Total Qty",
        render: (row: any) => <span>{row?.openingStockFooter?.totalQuantity || 0}</span>,
    },
    {
        key: "totalNetAmount",
        title: "Net Amount",
        render: (row: any) => (
            <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs text-indigo-700">
                {money(row?.openingStockFooter?.totalNetAmount)}
            </span>
        ),
    },
    {
        key: "openingStockStatus",
        title: "Status",
        render: (row: any) => (
            <span
                className={`rounded-md px-2 py-1 text-xs capitalize ${row?.openingStockStatus === "close"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                    }`}
            >
                {row?.openingStockStatus || "open"}
            </span>
        ),
    },
];

const productColumns = [
    {
        key: "productName",
        title: "Product",
    },
    {
        key: "quantity",
        title: "Qty",
    },
    {
        key: "unitName",
        title: "Unit",
    },
    {
        key: "rate",
        title: "Rate",
        render: (row: any) => <span>{money(row?.rate)}</span>,
    },
    {
        key: "grossAmount",
        title: "Gross",
        render: (row: any) => <span>{money(row?.grossAmount)}</span>,
    },
    {
        key: "netTotal",
        title: "Net Total",
        render: (row: any) => (
            <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs text-indigo-700">
                {money(row?.netTotal)}
            </span>
        ),
    },
];

const mainInputData = [
    {
        grid: 2,
        child: [
            {
                key: "openingStockVoucherNumber",
                label: "Voucher No",
                type: "text",
                isRequired: false,
                disabled: true,
            },
            {
                key: "openingStockDate",
                label: "Date",
                type: "date",
                isRequired: false,
                disabled: true,
            },
        ],
    },
    {
        key: "remark",
        label: "Remark",
        type: "textarea",
        isRequired: false,
    },
];

const OpeningStock = () => {
    const dispatch = useDispatch();
    const { products } = useSelector((s: any) => s.productMaster);
    const {
        openingStock,
        listingLoader,
        pagination,
        addLoader,
        deleteLoader,
    } = useSelector((s: any) => s.openingStock);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [status, setStatus] = useState("open");
    const [showModal, setShowModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [edit, setEdit] = useState(false);
    const [editingProductId, setEditingProductId] = useState<any>(null);
    const [errors, setErrors] = useState<any>({});
    const [productErrors, setProductErrors] = useState<any>({});
    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        openingStockVoucherNumber: null,
    });

    const [form, setForm] = useState<any>({
        openingStockVoucherNumber: "OPSTOCK",
        openingStockDate: todayYMD(),
        remark: "",
        openingStockBody: [],
    });
    const [productForm, setProductForm] = useState<any>({
        productCode: "", description: "", remarks: "", quantity: "", unit: "", rate: "", discountPercentage: "", cgstPercentage: "", sgstPercentage: "", igstPercentage: "", otherAmount: "",
    });

    const productOptions = useMemo(() => {
        return (products || []).map((item: any) => ({
            label: item?.productName || item?.name || item?.productCode,
            value: item?.productCode,
            raw: item,
        }));
    }, [products]);

    const unitOptions = useMemo(() => {
        return (products || []).map((item: any) => ({
            label: item?.unit || item?.name || item?.label,
            value: item?.unit || item?._id || item?.value,
            raw: item,
        }));
    }, [products]);

    // Product calculations
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

        return { quantity, rate, grossAmount, discountPercentage, discountAmount, taxableAmount, cgstPercentage, cgstAmount, sgstPercentage, sgstAmount, igstPercentage, igstAmount, otherAmount, taxAmount, netTotal };
    }, [productForm]);

    // total
    const footerTotals = useMemo(() => {
        return form.openingStockBody.reduce(
            (acc: any, item: any) => {
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
            { totalQuantity: 0, totalGrossAmount: 0, totalDiscountAmount: 0, totalCgstAmount: 0, totalSgstAmount: 0, totalIgstAmount: 0, totalTaxAmount: 0, totalOtherAmount: 0, totalNetAmount: 0 }
        );
    }, [form.openingStockBody]);

    // Handle Change
    const handleChange = (key: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [key]: value, }));
        setErrors((prev: any) => ({ ...prev, [key]: "", }));
    };

    const handleProductChange = (key: string, value: any) => {
        setProductForm((prev: any) => {
            let updated = {
                ...prev,
                [key]: value,
            };

            if (key === "productCode") {
                const selectedProduct = productOptions.find((item: any) => item.value === value)?.raw;
                updated.description = selectedProduct?.productDescription || selectedProduct?.description || "";
                updated.rate = selectedProduct?.sellingPrice || selectedProduct?.saleRate || selectedProduct?.rate || "";
                updated.unit = selectedProduct?.unit || selectedProduct?.uom || selectedProduct?.unitCode || "";
            }

            if (key === "cgstPercentage" || key === "sgstPercentage") {
                if (num(value) > 0) { updated.igstPercentage = ""; }
            }

            if (key === "igstPercentage") {
                if (num(value) > 0) {
                    updated.cgstPercentage = "";
                    updated.sgstPercentage = "";
                }
            }
            return updated;
        });

        setProductErrors((prev: any) => ({ ...prev, [key]: "", tax: "", }));
    };

    // validation
    const validateMainForm = () => {
        const err: any = {};
        if (!form.openingStockDate) err.openingStockDate = "Date is required"
        if (!form.openingStockBody || form.openingStockBody.length === 0) err.openingStockBody = "Please add at least one product";
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const validateProductForm = () => {
        const err: any = {};
        if (!productForm.productCode) { err.productCode = "Product is required"; }
        if (!productForm.quantity || num(productForm.quantity) <= 0) { err.quantity = "Quantity is required"; }
        if (!productForm.unit) { err.unit = "Unit is required"; }
        if (!productForm.rate || num(productForm.rate) <= 0) { err.rate = "Rate is required"; }
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

    // Add Update delete product
    const resetProductForm = () => {
        setProductForm({ productCode: "", description: "", remarks: "", quantity: "", unit: "", rate: "", discountPercentage: "", cgstPercentage: "", sgstPercentage: "", igstPercentage: "", otherAmount: "" });
        setEditingProductId(null);
        setProductErrors({});
    };

    const handleAddProduct = () => {
        if (!validateProductForm()) return;
        const selectedProduct = productOptions.find((item: any) => item.value === productForm.productCode);
        const selectedUnit = unitOptions.find((item: any) => item.value === productForm.unit);

        const newProduct = {
            id: editingProductId || Date.now(),
            productCode: productForm.productCode,
            productName: selectedProduct?.label || "",
            productId: selectedProduct?.raw?._id || "",
            description: productForm.description || "",
            remarks: productForm.remarks || "",
            quantity: productCalc.quantity,
            unit: productForm.unit,
            unitName: selectedUnit?.label || "",
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
            const alreadyExists = prev.openingStockBody.some((item: any) => item.productCode === newProduct.productCode && item.id !== editingProductId);

            if (alreadyExists) {
                toast.error("This product is already added");
                return prev;
            }
            const updatedBody = editingProductId ? prev.openingStockBody.map((item: any) => item.id === editingProductId ? newProduct : item) : [...prev.openingStockBody, newProduct];
            return { ...prev, openingStockBody: updatedBody, };
        });

        setErrors((prev: any) => ({ ...prev, openingStockBody: "", }));
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
        setForm((prev: any) => ({ ...prev, openingStockBody: prev.openingStockBody.filter((item: any) => item.id !== id) }));
    };

    const resetMainForm = () => {
        setForm({
            openingStockVoucherNumber: "OPSTOCK",
            openingStockDate: todayYMD(),
            remark: "",
            openingStockBody: [],
        });
        setEdit(false);
        setErrors({});
        resetProductForm();
    };

    const handleSubmit = async () => {
        if (!validateMainForm()) return;

        const payload = {
            openingStockDate: form.openingStockDate,
            remark: form.remark || "",
            openingStockStatus: form.openingStockStatus || status || "open",
            openingStockBody: form.openingStockBody,
            openingStockFooter: footerTotals,
        };

        try {
            if (edit) {
                await dispatch(
                    updateOpeningStock({
                        payload,
                        openingStockVoucherNumber: form?.openingStockVoucherNumber,
                    }) as any
                );
            } else {
                await dispatch(addOpeningStock({ payload }) as any);
            }

            await dispatch(
                getOpeningStockList({
                    limit: localLimit,
                    offset: localOffset,
                    status,
                    search: debouncedSearch,
                }) as any
            );

            toast.success(`Opening stock ${edit ? "updated" : "added"} successfully`);

            setShowModal(false);
            resetMainForm();
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong");
        }
    };

    const handleDeleteOpeningStock = async (voucherNumber: any) => {
        try {
            await dispatch(deleteOpeningStock({ openingStockVoucherNumber: voucherNumber, }) as any);
            await dispatch(getOpeningStockList({ limit: localLimit, offset: localOffset, status, search: debouncedSearch, }) as any);
            toast.success("Opening stock deleted successfully");
        } catch (error: any) {
            toast.error(error?.message || "Delete failed");
        } finally {
            setConfirmTooltip({ show: false, x: null, y: null, openingStockVoucherNumber: null, });
        }
    };

    const renderMainField = (field: any) => {
        const value = form?.[field.key] ?? "";

        const commonProps = {
            label: field.label,
            mandatory: field.isRequired,
            value: field.type === "date" ? value.split("T")[0] : value,
            placeholder: `Enter ${field.label}`,
            error: errors?.[field.key],
            disabled: field.disabled,
        };

        if (field.type === "date") {
            return (
                <TextInput
                    key={field.key}
                    {...commonProps}
                    type="date"
                    onChange={(e: any) => handleChange(field.key, e.target.value)}
                />
            );
        }

        if (field.type === "textarea") {
            return (
                <TextArea
                    key={field.key}
                    {...commonProps}
                    onChange={(e: any) => handleChange(field.key, e.target.value)}
                />
            );
        }

        return (
            <TextInput
                key={field.key}
                {...commonProps}
                type="text"
                onChange={(e: any) => handleChange(field.key, e.target.value)}
            />
        );
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
                    onChange={(e: any) => handleProductChange(field.key, e?.target?.value)}
                    options={[
                        { label: field.placeholder || `Select ${field.label}`, value: "" },
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
                    onChange={(e: any) => handleProductChange(field.key, e.target.value)}
                />
            );
        }

        return (
            <TextInput
                key={field.key}
                {...commonProps}
                type={field.type || "text"}
                onChange={(e: any) => handleProductChange(field.key, e.target.value)}
            />
        );
    };

    useEffect(() => {
        dispatch(getOpeningStockList({ limit: localLimit, offset: localOffset, status, search: debouncedSearch, }) as any);
    }, [dispatch, localLimit, localOffset, status, debouncedSearch]);

    useEffect(() => {
        dispatch(getAllProducts({ limit: 200, offset: 0 }) as any);
    }, [dispatch]);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(t);
    }, [search]);

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

    return (
        <>
            <div className="flex h-full w-full flex-col border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                    <Toggle
                        {...{
                            arr: ["open", "close"],
                            state: status,
                            setState: setStatus,
                        }}
                    />

                    <div className="me-2">
                        <SearchInput {...{ search, setSearch }} />
                    </div>

                    <PrimaryButton
                        {...{
                            text: "Add",
                            icon: <Plus size={16} />,
                            callBackFn: () => {
                                resetMainForm();
                                setShowModal(true);
                            },
                        }}
                    />
                </div>

                <DataTable
                    columns={mainColumns}
                    data={openingStock || []}
                    loading={listingLoader}
                    emptyMessage="No opening stocks found"
                    actions={(row: any) => (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setForm({
                                        ...row,
                                        openingStockBody: row?.openingStockBody || [],
                                    });
                                    setEdit(true);
                                    setErrors({});
                                    setShowModal(true);
                                }}
                                className="cursor-pointer rounded-lg p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                            >
                                <Edit size={16} />
                            </button>

                            <button
                                type="button"
                                disabled={deleteLoader}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    let x = rect.left - 150;
                                    if (x < 10) x = 10;
                                    const y = rect.top + window.scrollY - 5;
                                    setConfirmTooltip({
                                        show: true,
                                        x,
                                        y,
                                        openingStockVoucherNumber: row?.openingStockVoucherNumber,
                                    });
                                }}
                                className="text-red-500 hover:text-red-700 disabled:opacity-60"
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
            </div>

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this opening stock?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={() =>
                        handleDeleteOpeningStock(confirmTooltip?.openingStockVoucherNumber)
                    }
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            openingStockVoucherNumber: null,
                        })
                    }
                />
            )}

            {/* MAIN OPENING STOCK MODAL */}
            {/* @ts-ignore */}
            <Modal
                {...{
                    show: showModal,
                    setShow: setShowModal,
                    handleClose: resetMainForm,
                    handleSubmit,
                    loader: addLoader,
                    state: edit,
                    gridCols: 12,
                    title: "Opening Stock",
                    body: (
                        <>
                            <div>
                                <div>
                                    {mainInputData.map((field: any, index: number) => (
                                        <div
                                            key={field.key || index}
                                            className={`mb-2 grid gap-2 ${field?.grid === 2 ? "grid-cols-2" : "grid-cols-1"
                                                }`}
                                        >
                                            {field?.child?.length
                                                ? field.child.map((child: any) => renderMainField(child))
                                                : renderMainField(field)}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-slate-800">
                                            Products
                                        </h3>

                                        <SecondaryButton
                                            {...{
                                                text: "Add Product",
                                                icon: <Plus size={16} />,
                                                callBackFn: () => {
                                                    resetProductForm();
                                                    setShowProductModal(true);
                                                },
                                            }}
                                        />
                                    </div>

                                    {errors?.openingStockBody && (
                                        <p className="mb-2 text-sm text-red-500">
                                            {errors.openingStockBody}
                                        </p>
                                    )}

                                    {form.openingStockBody.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 p-5 text-center text-sm text-slate-500">
                                            No products added
                                        </div>
                                    ) : (
                                            <div className="w-full overflow-auto">

                                                <ColumnWiseTable
                                                    data={form.openingStockBody}
                                                    fields={productColumns}
                                                    showRecordNumber={true}
                                                    emptyMessage="No data"
                                                    onEdit={(row: any,) => handleEditProduct(row?.id)}
                                                    onDelete={(row: any,) => handleDeleteProduct(row?.id)}
                                                />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
                                    <div className="grid grid-cols-1 gap-3 text-sm font-semibold text-slate-800 md:grid-cols-2">
                                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                            <span>Total Quantity</span>
                                            <span>{footerTotals.totalQuantity}</span>
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                            <span>Gross Amount</span>
                                            <span>{money(footerTotals.totalGrossAmount)}</span>
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                            <span>Tax Amount</span>
                                            <span>{money(footerTotals.totalTaxAmount)}</span>
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                            <span>Net Amount</span>
                                            <span>{money(footerTotals.totalNetAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ),
                }}
            />

            {/* ADD PRODUCT MODAL */}
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
                                        <span>Percentage</span>
                                        <span>Amount</span>
                                    </div>

                                    {percentAmountRows.map((row) => (
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

                                    <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-base font-semibold text-slate-900">
                                        <span>Net Total</span>
                                        <span>{money(productCalc.netTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ),
                }}
            />
        </>
    );
};

export default OpeningStock;