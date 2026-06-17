import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import { PrimaryButton } from "../../../../components/buttons";
import SearchInput from "../../../../components/searchInput";
import DataTable from "../../../../components/DataTable";
import Toggle from "../../../../components/toggle";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";

import { money, num, safePercent, todayYMD } from "../../../../utils/helperFunctions";
import { addOpeningStock, deleteOpeningStock, getOpeningStockList, updateOpeningStock } from "../../../../redux/slices/professionalSlice/openingBalancesStocks/openingStockSlice";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";

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

const emptyForm = {
    openingStockVoucherNumber: "OPSTOCK",
    openingStockDate: todayYMD(),
    remark: "",
    openingStockBody: [{ ...emptyProductRow, id: Date.now() }],
};

const mainColumns = [
    {
        key: "openingStockVoucherNumber",
        title: "Voucher",
    },
    {
        key: "openingStockDate",
        title: "Date",
        type: "date",
    },
    {
        key: "totalQuantity",
        title: "Total Qty",
        render: (row: any) => (
            <span>{row?.openingStockFooter?.totalQuantity || 0}</span>
        ),
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
    const [edit, setEdit] = useState(false);

    const [errors, setErrors] = useState<any>({});

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        openingStockVoucherNumber: null,
    });

    const [form, setForm] = useState<any>(emptyForm);

    const productOptions = useMemo(() => {
        return (products || []).map((item: any) => ({
            label: item?.productName || item?.name || item?.productCode,
            value: item?.productCode,
            raw: item,
        }));
    }, [products]);

    const unitOptions = useMemo(() => {
        const unitMap = new Map();

        (products || []).forEach((item: any) => {
            const unitValue = item?.unit || item?.uom || item?.unitCode;

            if (unitValue && !unitMap.has(unitValue)) {
                unitMap.set(unitValue, {
                    label: item?.unit || item?.uom || item?.unitName || unitValue,
                    value: unitValue,
                    raw: item,
                });
            }
        });

        return Array.from(unitMap.values());
    }, [products]);

    const calculateRow = (row: any) => {
        const quantity = num(row.quantity);
        const rate = num(row.rate);

        const grossAmount = quantity * rate;

        const discountPercentage = safePercent(row.discountPercentage);
        const cgstPercentage = safePercent(row.cgstPercentage);
        const sgstPercentage = safePercent(row.sgstPercentage);
        const igstPercentage = safePercent(row.igstPercentage);

        const discountAmount = (grossAmount * discountPercentage) / 100;
        const taxableAmount = grossAmount - discountAmount;

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
    }, [form.openingStockBody]);

    const resetMainForm = () => {
        setForm({
            ...emptyForm,
            openingStockBody: [{ ...emptyProductRow, id: Date.now() }],
        });
        setEdit(false);
        setErrors({});
    };

    const handleChange = (key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [key]: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const updatedBody = [...(prev.openingStockBody || [])];

            let updatedRow = {
                ...updatedBody[index],
                [key]: value,
            };

            if (key === "productCode") {
                const selectedProduct = productOptions.find((item: any) => item.value === value);
                const product = selectedProduct?.raw;
                updatedRow.productCode = value;
                updatedRow.productName = selectedProduct?.label || "";
                updatedRow.productId = product?._id || "";
                updatedRow.description = product?.productDescription || product?.description || "";
                updatedRow.rate = product?.sellingPrice || product?.saleRate || product?.rate || "";
                updatedRow.unit = product?.unit || product?.uom || product?.unitCode || "";
                updatedRow.unitName = product?.unit || product?.uom || product?.unitName || "";
            }

            if (key === "unit") {
                const selectedUnit = unitOptions.find((item: any) => item.value === value);
                updatedRow.unit = value;
                updatedRow.unitName = selectedUnit?.label || "";
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
            updatedBody[index] = updatedRow;
            return { ...prev, openingStockBody: updatedBody, };
        });

        setErrors((prev: any) => ({
            ...prev,
            openingStockBody: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_tax`]: "",
        }));
    };

    const handleAddRow = () => {
        setForm((prev: any) => ({
            ...prev,
            openingStockBody: [
                ...(prev.openingStockBody || []),
                {
                    ...emptyProductRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedBody = prev.openingStockBody.filter((_: any, i: number) => i !== index);
            return { ...prev, openingStockBody: updatedBody.length > 0 ? updatedBody : [{ ...emptyProductRow, id: Date.now() }], };
        });
    };

    const getFilledRows = () => {
        return form.openingStockBody.filter((row: any) => {
            return (row.productCode || row.description || row.remarks || row.quantity || row.unit || row.rate || row.discountPercentage || row.cgstPercentage || row.sgstPercentage || row.igstPercentage || row.otherAmount
            );
        });
    };

    const validateMainForm = () => {
        const err: any = {};

        if (!form.openingStockDate) err.openingStockDate = "Date is required";
        const filledRows = getFilledRows();

        if (filledRows.length === 0) err.openingStockBody = "Please add at least one product";

        form.openingStockBody.forEach((row: any, index: number) => {
            const hasAnyValue = row.productCode || row.description || row.remarks || row.quantity || row.unit || row.rate || row.discountPercentage || row.cgstPercentage || row.sgstPercentage || row.igstPercentage || row.otherAmount;

            if (!hasAnyValue) return;

            if (!row.productCode) err[`row_${index}_productCode`] = "Product is required";
            if (!row.quantity || num(row.quantity) <= 0) err[`row_${index}_quantity`] = "Quantity is required";
            if (!row.unit) err[`row_${index}_unit`] = "Unit is required";
            if (!row.rate || num(row.rate) <= 0) err[`row_${index}_rate`] = "Rate is required";

            const cgst = num(row.cgstPercentage);
            const sgst = num(row.sgstPercentage);
            const igst = num(row.igstPercentage);

            if (igst > 0 && (cgst > 0 || sgst > 0)) {
                err[`row_${index}_tax`] = "You can enter either IGST or CGST/SGST";
                err[`row_${index}_igstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_cgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_sgstPercentage`] = "Only one tax type allowed";
            }
        });

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        return form.openingStockBody.filter((row: any) => {
            return (
                row.productCode || row.description || row.remarks || row.quantity || row.unit || row.rate || row.discountPercentage || row.cgstPercentage || row.sgstPercentage || row.igstPercentage || row.otherAmount
            );
        }).map((row: any) => calculateRow(row));
    };

    const refreshList = async () => {
        await dispatch(
            getOpeningStockList({
                limit: localLimit,
                offset: localOffset,
                status,
                search: debouncedSearch,
            }) as any
        );
    };

    const handleSubmit = async () => {
        if (!validateMainForm()) return;
        const openingStockBody = cleanRows();

        const payload = {
            openingStockDate: form.openingStockDate,
            remark: form.remark || "",
            openingStockStatus: form.openingStockStatus || status || "open",
            openingStockBody,
            openingStockFooter: footerTotals,
        };

        try {
            if (edit) {
                await dispatch(updateOpeningStock({ payload, openingStockVoucherNumber: form?.openingStockVoucherNumber, }) as any);
            } else {
                await dispatch(addOpeningStock({ payload }) as any);
            }
            await refreshList();
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
            await refreshList();
            toast.success("Opening stock deleted successfully");
        } catch (error: any) {
            toast.error(error?.message || "Delete failed");
        } finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                openingStockVoucherNumber: null,
            });
        }
    };

    useEffect(() => {
        refreshList();
    }, [localLimit, localOffset, status, debouncedSearch]);

    useEffect(() => {
        dispatch(getAllProducts({ limit: 200, offset: 0 }) as any);
    }, [dispatch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);


    const inputData = {
        header: [
            {
                key: "openingStockVoucherNumber",
                label: "Voucher No",
                type: "text",
                disabled: true,
            },
            {
                key: "openingStockDate",
                label: "Date",
                type: "date",
                disabled: false,
            },
            {
                key: "remark",
                label: "Remark",
                type: "textarea",
                required: false,
                placeholder: "Enter Remark",
                colSpan: "full",
            },
        ],

        body: [
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

        footer: [
            {
                key: "totalQuantity",
                label: "Total Quantity",
                value: footerTotals.totalQuantity,
                rawValue: footerTotals.totalQuantity,
            },
            {
                key: "totalGrossAmount",
                label: "Gross Amount",
                value: money(footerTotals.totalGrossAmount),
                rawValue: footerTotals.totalGrossAmount,
            },
            {
                key: "totalTaxAmount",
                label: "Tax Amount",
                value: money(footerTotals.totalTaxAmount),
                rawValue: footerTotals.totalTaxAmount,
            },
            {
                key: "totalNetAmount",
                label: "Net Amount",
                value: money(footerTotals.totalNetAmount),
                rawValue: footerTotals.totalNetAmount,
            },
        ],
    };

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
                                    const body =
                                        row?.openingStockBody?.length > 0
                                            ? row.openingStockBody.map((item: any) =>
                                                calculateRow({
                                                    ...item,
                                                    id: item.id || Date.now() + Math.random(),
                                                    productCode: item.productCode || "",
                                                    productName: item.productName || "",
                                                    productId: item.productId || "",
                                                    description: item.description || "",
                                                    remarks: item.remarks || "",
                                                    quantity: item.quantity || "",
                                                    unit: item.unit || "",
                                                    unitName: item.unitName || "",
                                                    rate: item.rate || "",
                                                    discountPercentage: item.discountPercentage || "",
                                                    cgstPercentage: item.cgstPercentage || "",
                                                    sgstPercentage: item.sgstPercentage || "",
                                                    igstPercentage: item.igstPercentage || "",
                                                    otherAmount: item.otherAmount || "",
                                                })
                                            )
                                            : [
                                                {
                                                    ...emptyProductRow,
                                                    id: Date.now(),
                                                },
                                            ];

                                    setForm({
                                        ...row,
                                        openingStockVoucherNumber: row?.openingStockVoucherNumber || "OPSTOCK",
                                        openingStockDate: row?.openingStockDate || todayYMD(),
                                        remark: row?.remark || "",
                                        openingStockBody: body,
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
                                        openingStockVoucherNumber:
                                            row?.openingStockVoucherNumber,
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
                        handleDeleteOpeningStock(
                            confirmTooltip?.openingStockVoucherNumber
                        )
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


            <DynamicAddForm
                show={showModal}
                setShow={setShowModal}
                edit={edit}
                title="Opening Stock"
                subtitle="Fill in the opening stock details below"
                loading={addLoader}
                onClose={() => {
                    setShowModal(false);
                    resetMainForm();
                }}
                onSubmit={handleSubmit}
                form={form}
                errors={errors}
                handleAddRow={handleAddRow}
                handleDeleteRow={handleDeleteRow}
                handleRowChange={handleRowChange}
                inputData={inputData}
                bodyKey="openingStockBody"
                handleChange={handleChange}
            />


        </>
    );
};

export default OpeningStock;