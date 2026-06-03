import React, { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createAssemblyProduction, deleteAssemblyProduction, getAllAssemblyProductions, updateAssemblyProduction } from "../../../../redux/slices/professionalSlice/assemblyProductionSlice";
import Badge from "../../../../components/badge";
import SearchInput from "../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../components/buttons";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import Modal from "../../../../components/modal";
import { SelectInput, TextInput } from "../../../../components/inputs";
import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";



/* ===================================================
    EMPTY PRODUCT STRUCTURE
=================================================== */
const emptyProduct = {
    productCode: "",
    productName: "",
    quantity: "",
    rate: "",
    amount: "",
};


/* ===================================================
    DEFAULT FORM STRUCTURE
=================================================== */
const getDefaultForm = () => ({
    voucherNumber: "ASP",
    voucherDate: new Date().toISOString().split("T")[0],
    status: "open",
    remarks: "",

    finishedGood: { ...emptyProduct },

    rawMaterials: [],

    totalRawMaterialCost: "0",
    productionCost: "0",
    totalFinishedCost: "0",

    warehouseCode: "",
    locationCode: "",
});


const AssemblyProduction = () => {
    const dispatch = useDispatch();

    /* ===================================================
        REDUX STATE
    =================================================== */
    const {
        assemblyProductions,
        pagination,
        loading,
        createLoading,
        updateLoading,
        deleteLoading,
    } = useSelector((s: any) => s.assemblyProduction);


    /* ===================================================
        PAGINATION STATE
    =================================================== */
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);


    /* ===================================================
        SEARCH STATE
    =================================================== */
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");


    /* ===================================================
        MODAL STATE
    =================================================== */
    const [showModal, setShowModal] = useState(false);
    const [showRawMaterialModal, setShowRawMaterialModal] = useState(false);


    /* ===================================================
        EDIT / FORM STATE
    =================================================== */
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [rawMaterialForm, setRawMaterialForm] = useState<any>({ ...emptyProduct });


    /* ===================================================
        ERROR STATE
    =================================================== */
    const [errors, setErrors] = useState<any>({});
    const [rawErrors, setRawErrors] = useState<any>({});
    const [finishedGoodOptions, setFinishedGoodOptions] = useState<any[]>([]);
    const [rawMaterialOptions, setRawMaterialOptions] = useState<any[]>([]);

    /* ===================================================
        REFRESH STATE
    =================================================== */
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const fetchProductDropdowns = async () => {
            try {
                const [finishedGoodRes, rawMaterialRes]: any = await Promise.all([
                    dispatch(
                        getAllProducts({
                            offset: 0,
                            limit: 200,
                            search: "",
                            productType: "finishedgoods",
                        }) as any
                    ).unwrap(),

                    dispatch(
                        getAllProducts({
                            offset: 0,
                            limit: 200,
                            search: "",
                            productType: "rawmaterial",
                        }) as any
                    ).unwrap(),
                ]);

                setFinishedGoodOptions(makeProductOptions(finishedGoodRes));
                setRawMaterialOptions(makeProductOptions(rawMaterialRes));
            } catch (err: any) {
                toast.error(err?.message || "Failed to load products");
            }
        };

        fetchProductDropdowns();
    }, [dispatch]);
    /* ===================================================
        DELETE CONFIRM TOOLTIP STATE
    =================================================== */
    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });


    /* ===================================================
        COMMON AMOUNT CALCULATION
    =================================================== */
    const calculateAmount = (quantity: any, rate: any) => {
        const qty = Number(quantity || 0);
        const price = Number(rate || 0);

        return qty && price ? String(qty * price) : "0";
    };


    /* ===================================================
        TOTAL RAW MATERIAL COST
    =================================================== */
    const totalRawMaterialCost = useMemo(() => {
        return form.rawMaterials.reduce((sum: number, item: any) => {
            return sum + Number(item.amount || 0);
        }, 0);
    }, [form.rawMaterials]);


    /* ===================================================
        TOTAL FINISHED COST
        Formula: Raw Material Cost + Production Cost
    =================================================== */
    const totalFinishedCost = useMemo(() => {
        return totalRawMaterialCost + Number(form.productionCost || 0);
    }, [totalRawMaterialCost, form.productionCost]);


    /* ===================================================
        MAIN LIST TABLE COLUMNS
    =================================================== */
    const columns = [
        {
            key: "voucherNumber",
            title: "Voucher No",
        },
        {
            key: "voucherDate",
            title: "Date",
            render: (row: any) => row?.voucherDate || "-",
        },
        {
            key: "finishedGood",
            title: "Finished Good",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">
                        {row?.finishedGood?.productName || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                        {row?.finishedGood?.productCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "finishedQty",
            title: "FG Qty",
            render: (row: any) => row?.finishedGood?.quantity || "0",
        },
        {
            key: "totalRawMaterialCost",
            title: "Raw Cost",
            render: (row: any) => (
                <span className="font-medium text-slate-700">
                    ₹{Number(row?.totalRawMaterialCost || 0).toFixed(2)}
                </span>
            ),
        },
        {
            key: "productionCost",
            title: "Production Cost",
            render: (row: any) => (
                <span className="font-medium text-slate-700">
                    ₹{Number(row?.productionCost || 0).toFixed(2)}
                </span>
            ),
        },
        {
            key: "totalFinishedCost",
            title: "Finished Cost",
            render: (row: any) => (
                <span className="font-semibold text-indigo-700">
                    ₹{Number(row?.totalFinishedCost || 0).toFixed(2)}
                </span>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${row?.status === "open"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-slate-50 text-slate-700 border border-slate-200"
                        }`}
                >
                    {row?.status || "-"}
                </span>
            ),
        },
    ];


    /* ===================================================
        FETCH ASSEMBLY PRODUCTION LIST
    =================================================== */
    const fetchAssemblyProductions = async () => {
        await dispatch(
            getAllAssemblyProductions({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
            }) as any
        );
    };


    /* ===================================================
        FETCH LIST WHEN PAGINATION OR SEARCH CHANGES
    =================================================== */
    useEffect(() => {
        fetchAssemblyProductions();
    }, [localOffset, localLimit, debouncedSearch]);


    /* ===================================================
        SEARCH DEBOUNCE
    =================================================== */
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);


    /* ===================================================
        REFRESH LIST
    =================================================== */
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAssemblyProductions();
        toast.success("Assembly production list refreshed");
        setRefreshing(false);
    };


    /* ===================================================
        OPEN ADD MODAL
    =================================================== */
    const openAddModal = () => {
        setEditingRecord(null);
        setErrors({});
        setRawErrors({});
        setForm(getDefaultForm());
        setRawMaterialForm({ ...emptyProduct });
        setShowModal(true);
    };


    /* ===================================================
        OPEN EDIT MODAL
    =================================================== */
    const openEditModal = (record: any) => {
        setEditingRecord(record);
        setErrors({});
        setRawErrors({});

        setForm({
            voucherNumber: record?.voucherNumber || "ASP",
            voucherDate: record?.voucherDate || new Date().toISOString().split("T")[0],
            status: record?.status || "open",
            remarks: record?.remarks || "",

            finishedGood: {
                productCode: record?.finishedGood?.productCode || "",
                productName: record?.finishedGood?.productName || "",
                quantity: record?.finishedGood?.quantity || "",
                rate: record?.finishedGood?.rate || "",
                amount: record?.finishedGood?.amount || "",
            },

            rawMaterials: record?.rawMaterials || [],

            totalRawMaterialCost: record?.totalRawMaterialCost || "0",
            productionCost: record?.productionCost || "0",
            totalFinishedCost: record?.totalFinishedCost || "0",

            warehouseCode: record?.warehouseCode || "",
            locationCode: record?.locationCode || "",
        });

        setShowModal(true);
    };


    /* ===================================================
        MAIN FORM CHANGE HANDLER
    =================================================== */
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


    /* ===================================================
        FINISHED GOOD CHANGE HANDLER
    =================================================== */
    const handleFinishedGoodChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const finishedGood = {
                ...prev.finishedGood,
                [key]: value,
            };

            finishedGood.amount = calculateAmount(
                finishedGood.quantity,
                finishedGood.rate
            );

            return {
                ...prev,
                finishedGood,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            [`finishedGood.${key}`]: "",
        }));
    };


    /* ===================================================
        FINISHED GOOD PRODUCT CHANGE
        Replace this with SelectInput when product dropdown is ready
    =================================================== */
    const handleFinishedGoodProductChange = (productCode: string) => {
        const selectedProduct = finishedGoodOptions.find(
            (item: any) => item.value === productCode
        );

        setForm((prev: any) => ({
            ...prev,
            finishedGood: {
                ...prev.finishedGood,
                productCode,
                productName: selectedProduct?.label || "",
                rate:
                    selectedProduct?.raw?.sellingPrice ||
                    selectedProduct?.raw?.productSellingPrice ||
                    selectedProduct?.raw?.rate ||
                    prev.finishedGood.rate,
            },
        }));

        setErrors((prev: any) => ({
            ...prev,
            "finishedGood.productCode": "",
        }));
    };


   

    /* ===================================================
        RAW MATERIAL PRODUCT CHANGE
        Replace this with SelectInput when product dropdown is ready
    =================================================== */
    const handleRawMaterialProductChange = (productCode: string) => {
        const selectedProduct = productOptions.find(
            (item: any) => item.value === productCode
        );

        setRawMaterialForm((prev: any) => ({
            ...prev,
            productCode,
            productName: selectedProduct?.label || "",
            rate:
                selectedProduct?.raw?.sellingPrice ||
                selectedProduct?.raw?.purchasePrice ||
                selectedProduct?.raw?.rate ||
                prev.rate,
        }));

        setRawErrors((prev: any) => ({
            ...prev,
            productCode: "",
        }));
    };

    /* ===================================================
        VALIDATE RAW MATERIAL MODAL
    =================================================== */
    const validateRawMaterial = () => {
        const err: any = {};

        if (!rawMaterialForm.productCode) {
            err.productCode = "Product is required";
        }

        if (!rawMaterialForm.quantity) {
            err.quantity = "Quantity is required";
        }

        if (!rawMaterialForm.rate) {
            err.rate = "Rate is required";
        }

        setRawErrors(err);
        return Object.keys(err).length === 0;
    };


    /* ===================================================
        ADD RAW MATERIAL TO MAIN FORM
    =================================================== */
    const handleAddRawMaterial = () => {
        if (!validateRawMaterial()) return;

        const newRawMaterial = {
            ...rawMaterialForm,
            amount: calculateAmount(rawMaterialForm.quantity, rawMaterialForm.rate),
        };

        setForm((prev: any) => ({
            ...prev,
            rawMaterials: [...prev.rawMaterials, newRawMaterial],
        }));

        setErrors((prev: any) => ({
            ...prev,
            rawMaterials: "",
        }));

        setRawMaterialForm({ ...emptyProduct });
        setRawErrors({});
        setShowRawMaterialModal(false);
    };


    /* ===================================================
        DELETE RAW MATERIAL FROM MAIN FORM
    =================================================== */
    const handleDeleteRawMaterial = (index: number) => {
        setForm((prev: any) => ({
            ...prev,
            rawMaterials: prev.rawMaterials.filter((_: any, i: number) => i !== index),
        }));
    };


    /* ===================================================
        CLEAR FINISHED GOOD FORM
    =================================================== */
    const handleClearFinishedGood = () => {
        setForm((prev: any) => ({
            ...prev,
            finishedGood: { ...emptyProduct },
        }));
    };


    /* ===================================================
        VALIDATE MAIN FORM
    =================================================== */
    const validateForm = () => {
        const err: any = {};

        if (!form.voucherDate) {
            err.voucherDate = "Date is required";
        }

        if (!form.status) {
            err.status = "Status is required";
        }

        if (!form.finishedGood.productCode) {
            err["finishedGood.productCode"] = "Finished good is required";
        }

        if (!form.finishedGood.quantity) {
            err["finishedGood.quantity"] = "Quantity is required";
        }

        if (!form.finishedGood.rate) {
            err["finishedGood.rate"] = "Rate is required";
        }

        if (!form.rawMaterials || form.rawMaterials.length === 0) {
            err.rawMaterials = "Please add at least one raw material";
        }

        setErrors(err);
        return Object.keys(err).length === 0;
    };


    /* ===================================================
        SAVE / UPDATE ASSEMBLY PRODUCTION
    =================================================== */
    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = {
            ...form,

            finishedGood: {
                ...form.finishedGood,
                amount: calculateAmount(
                    form.finishedGood.quantity,
                    form.finishedGood.rate
                ),
            },

            rawMaterials: form.rawMaterials,

            totalRawMaterialCost: String(totalRawMaterialCost),
            productionCost: String(Number(form.productionCost || 0)),
            totalFinishedCost: String(totalFinishedCost),
        };

        try {
            if (editingRecord) {
                await dispatch(
                    updateAssemblyProduction({
                        voucherNumber: editingRecord.voucherNumber,
                        data: payload,
                    }) as any
                ).unwrap();

                toast.success("Assembly production updated successfully");
            } else {
                await dispatch(createAssemblyProduction(payload) as any).unwrap();

                toast.success("Assembly production created successfully");
            }

            setShowModal(false);
            setEditingRecord(null);
            setForm(getDefaultForm());
            setRawMaterialForm({ ...emptyProduct });
            fetchAssemblyProductions();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };


    /* ===================================================
        DELETE ASSEMBLY PRODUCTION
    =================================================== */
    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip.voucherNumber) return;

            await dispatch(
                deleteAssemblyProduction(confirmTooltip.voucherNumber) as any
            ).unwrap();

            toast.success("Assembly production deleted");
            fetchAssemblyProductions();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete assembly production");
        } finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
            });
        }
    };


    return (
        <div className="w-full bg-white border border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-[100%]">

            {/* ================= HEADER ================= */}
            <div id="assembly-production-header" className="flex items-center mb-3">
                <div id="assembly-production-summary" className="flex items-start gap-3">
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Assembly Productions:",
                            varient: "primary",
                        }}
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
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
                            text: "Add Assembly Production",
                        }}
                    />
                </div>
            </div>


            {/* ================= LIST TABLE ================= */}
            <DataTable
                columns={columns}
                data={assemblyProductions}
                loading={loading}
                emptyMessage="No assembly production found"
                actions={(record: any) => (
                    <div className="flex items-center gap-2">

                        {/* Edit */}
                        <button
                            id="assembly-production-edit-button"
                            onClick={() => openEditModal(record)}
                            className="p-2 rounded-md text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer"
                        >
                            <Edit size={16} />
                        </button>

                        {/* Delete */}
                        <button
                            id="assembly-production-delete-button"
                            disabled={deleteLoading}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();

                                let x = rect.left - 150;
                                if (x < 10) x = 10;

                                const y = rect.top + window.scrollY - 5;

                                setConfirmTooltip({
                                    show: true,
                                    x,
                                    y,
                                    voucherNumber: record.voucherNumber,
                                });
                            }}
                            className="p-2 rounded-md text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer disabled:opacity-50"
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


            {/* ================= DELETE CONFIRM TOOLTIP ================= */}
            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this assembly production?"
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


            {/* ================= ADD / UPDATE MODAL ================= */}
            <Modal
                {...{
                    show: showModal,
                    setShow: setShowModal,
                    handleSubmit,
                    loader: editingRecord ? updateLoading : createLoading,
                    state: editingRecord,
                    title: editingRecord
                        ? "Update Assembly Production"
                        : "Add New Assembly Production",

                    body: (
                        <div className="col-span-2 w-full space-y-5">

                            {/* ================= BASIC DETAILS CARD ================= */}
                            <div className="w-full rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <TextInput
                                        label="Voucher no."
                                        value={form.voucherNumber}
                                        placeholder="Voucher no."
                                        disabled
                                        error={errors.voucherNumber}
                                        onChange={(e: any) =>
                                            handleMainChange("voucherNumber", e.target.value)
                                        }
                                    />

                                    <TextInput
                                        label="Date"
                                        mandatory
                                        type="date"
                                        value={form.voucherDate}
                                        placeholder="Date"
                                        error={errors.voucherDate}
                                        onChange={(e: any) =>
                                            handleMainChange("voucherDate", e.target.value)
                                        }
                                    />

                                    <TextInput
                                        label="Status"
                                        value={form.status}
                                        placeholder="Status"
                                        disabled
                                        error={errors.status}
                                        onChange={(e: any) =>
                                            handleMainChange("status", e.target.value)
                                        }
                                    />

                                    <div className="md:col-span-3">
                                        <TextInput
                                            label="Remarks"
                                            value={form.remarks}
                                            placeholder="Remarks"
                                            error={errors.remarks}
                                            onChange={(e: any) =>
                                                handleMainChange("remarks", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ================= FINISHED GOOD CARD ================= */}
                            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="mb-4 text-lg font-bold text-slate-900">
                                    Finished good
                                </h3>

                                <div className="rounded-md border border-slate-200 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-4">
                                            <SelectInput
                                                label="Select Product"
                                                mandatory
                                                value={form.finishedGood.productCode}
                                                placeholder="Select Product"
                                                error={errors["finishedGood.productCode"]}
                                                onChange={(e: any) =>
                                                    handleFinishedGoodProductChange(e.target.value)
                                                }
                                                options={[
                                                    { label: "Select Product", value: "" },
                                                    ...finishedGoodOptions,
                                                ]}
                                            />
                                        </div>

                                        <TextInput
                                            label="Quantity"
                                            mandatory
                                            type="number"
                                            value={form.finishedGood.quantity}
                                            placeholder="Quantity"
                                            error={errors["finishedGood.quantity"]}
                                            onChange={(e: any) =>
                                                handleFinishedGoodChange("quantity", e.target.value)
                                            }
                                        />

                                        <TextInput
                                            label="Rate"
                                            mandatory
                                            type="number"
                                            value={form.finishedGood.rate}
                                            placeholder="Rate"
                                            error={errors["finishedGood.rate"]}
                                            onChange={(e: any) =>
                                                handleFinishedGoodChange("rate", e.target.value)
                                            }
                                        />

                                        <div className="md:col-span-2">
                                            <TextInput
                                                label="Amount"
                                                type="number"
                                                value={form.finishedGood.amount}
                                                placeholder="Amount"
                                                disabled
                                                onChange={(e: any) =>
                                                    handleFinishedGoodChange("amount", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 text-sm font-bold text-slate-600">
                                        Gross: ₹{Number(form.finishedGood.amount || 0).toFixed(2)}
                                    </div>

                                    <div className="mt-3 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleClearFinishedGood}
                                            className="rounded-md border border-slate-300 px-6 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => toast.success("Finished good applied")}
                                            className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ================= RAW MATERIALS CARD ================= */}
                            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Raw materials
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRawMaterialForm({ ...emptyProduct });
                                            setRawErrors({});
                                            setShowRawMaterialModal(true);
                                        }}
                                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                                    >
                                        <Plus size={18} />
                                        Add Input Product
                                    </button>
                                </div>

                                {errors.rawMaterials && (
                                    <p className="mb-2 text-sm text-red-500">
                                        {errors.rawMaterials}
                                    </p>
                                )}

                                {form.rawMaterials.length === 0 ? (
                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                                        No data
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {form.rawMaterials.map((item: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 p-4"
                                            >
                                                <div>
                                                    <div className="font-semibold text-slate-800">
                                                        {item.productName}
                                                    </div>

                                                    <div className="text-sm text-slate-500">
                                                        Code: {item.productCode} | Qty: {item.quantity} | Rate: ₹{item.rate}
                                                    </div>

                                                    <div className="text-sm font-semibold text-slate-700">
                                                        Amount: ₹{Number(item.amount || 0).toFixed(2)}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRawMaterial(index)}
                                                    className="rounded-md p-2 text-red-600 hover:bg-red-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>


                            {/* ================= COST CARD ================= */}
                            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <TextInput
                                        label="Total raw material cost"
                                        value={String(totalRawMaterialCost)}
                                        placeholder="0"
                                        disabled
                                        onChange={(e: any) =>
                                            handleMainChange("totalRawMaterialCost", e.target.value)
                                        }
                                    />

                                    <TextInput
                                        label="Production cost"
                                        type="number"
                                        value={form.productionCost}
                                        placeholder="0"
                                        error={errors.productionCost}
                                        onChange={(e: any) =>
                                            handleMainChange("productionCost", e.target.value)
                                        }
                                    />

                                    <TextInput
                                        label="Total finished cost"
                                        value={String(totalFinishedCost)}
                                        placeholder="0"
                                        disabled
                                        onChange={(e: any) =>
                                            handleMainChange("totalFinishedCost", e.target.value)
                                        }
                                    />


                                </div>
                            </div>
                        </div>
                    ),
                }}
            />


            {/* ================= ADD RAW MATERIAL MODAL ================= */}
            <Modal
                {...{
                    show: showRawMaterialModal,
                    setShow: setShowRawMaterialModal,
                    handleSubmit: handleAddRawMaterial,
                    loader: false,
                    title: "Add raw material",
                    // maxWidth: "lg",
                    body: (
                        <div className=" col-span-2  rounded-md border border-slate-200 bg-white p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <SelectInput
                                        label="Select Product"
                                        mandatory
                                        value={rawMaterialForm.productCode}
                                        placeholder="Select Product"
                                        error={rawErrors.productCode}
                                        onChange={(e: any) =>
                                            handleRawMaterialProductChange(e.target.value)
                                        }
                                        options={[
                                            { label: "Select Product", value: "" },
                                            ...rawMaterialOptions,
                                        ]}
                                    />
                                </div>

                                <TextInput
                                    label="Quantity"
                                    mandatory
                                    type="number"
                                    value={rawMaterialForm.quantity}
                                    placeholder="Quantity"
                                    error={rawErrors.quantity}
                                    onChange={(e: any) =>
                                        handleRawMaterialChange("quantity", e.target.value)
                                    }
                                />

                                <TextInput
                                    label="Rate"
                                    mandatory
                                    type="number"
                                    value={rawMaterialForm.rate}
                                    placeholder="Rate"
                                    error={rawErrors.rate}
                                    onChange={(e: any) =>
                                        handleRawMaterialChange("rate", e.target.value)
                                    }
                                />

                                <div className="md:col-span-2">
                                    <TextInput
                                        label="Net Total"
                                        value={rawMaterialForm.amount}
                                        placeholder="Net Total"
                                        disabled
                                        onChange={(e: any) =>
                                            handleRawMaterialChange("amount", e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="mt-4 text-sm font-bold text-slate-600">
                                Gross: ₹{Number(rawMaterialForm.amount || 0).toFixed(2)}
                            </div>
                        </div>
                    ),
                }}
            />
        </div>
    );
};

export default AssemblyProduction;