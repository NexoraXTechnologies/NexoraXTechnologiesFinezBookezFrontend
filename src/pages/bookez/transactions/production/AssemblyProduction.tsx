import React, { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
    createAssemblyProduction,
    deleteAssemblyProduction,
    getAllAssemblyProductions,
    updateAssemblyProduction,
} from "../../../../redux/slices/professionalSlice/assemblyProductionSlice";

import Badge from "../../../../components/badge";
import SearchInput from "../../../../components/searchInput";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../components/buttons";
import DataTable, { ColumnWiseTable } from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import Modal, { WarningModel } from "../../../../components/modal";
import { SelectInput, TextInput } from "../../../../components/inputs";
import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import { useNavigate } from "react-router-dom";


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
    const navigate = useNavigate();

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
    const [showNoRawMaterialAlert, setShowNoRawMaterialAlert] = useState(false);

    /* ===================================================
        EDIT / FORM STATE
    =================================================== */
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [editingRawMaterialIndex, setEditingRawMaterialIndex] =
        useState<number | null>(null);
    /*
      Finished Good is first stored here.
      It will be copied into form.finishedGood only after Apply click.
    */
    const [finishedGoodForm, setFinishedGoodForm] = useState<any>({
        ...emptyProduct,
    });

    const [isFinishedGoodApplied, setIsFinishedGoodApplied] = useState(false);

    const [rawMaterialForm, setRawMaterialForm] = useState<any>({
        ...emptyProduct,
    });

    /* ===================================================
        ERROR STATE
    =================================================== */
    const [errors, setErrors] = useState<any>({});
    const [rawErrors, setRawErrors] = useState<any>({});

    /* ===================================================
        DROPDOWN OPTIONS
    =================================================== */
    const [finishedGoodOptions, setFinishedGoodOptions] = useState<any[]>([]);
    const [rawMaterialOptions, setRawMaterialOptions] = useState<any[]>([]);

    /* ===================================================
        REFRESH STATE
    =================================================== */
    const [refreshing, setRefreshing] = useState(false);

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
        HELPERS
    =================================================== */
    const getProductRate = (product: any, fallback = "") => {
        return String(
            product?.sellingPrice ||
            product?.purchasePrice ||
            product?.productSellingPrice ||
            product?.productPurchasePrice ||
            product?.rate ||
            fallback ||
            ""
        );
    };

    const makeProductOptions = (res: any) => {
        const records = Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.data?.items)
                    ? res.data.items
                    : Array.isArray(res?.data?.records)
                        ? res.data.records
                        : Array.isArray(res)
                            ? res
                            : [];

        return records.map((item: any) => ({
            label: item.productName || item.name || "-",
            value: item.productCode || item.code || item._id,
            raw: item,
        }));
    };

    const calculateAmount = (quantity: any, rate: any) => {
        const qty = Number(quantity || 0);
        const price = Number(rate || 0);

        return qty && price ? String(qty * price) : "0";
    };

    /* ===================================================
        FETCH PRODUCT DROPDOWNS
    =================================================== */
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
        TOTAL RAW MATERIAL COST
    =================================================== */
    const totalRawMaterialCost = useMemo(() => {
        return form.rawMaterials.reduce((sum: number, item: any) => {
            return sum + Number(item.amount || 0);
        }, 0);
    }, [form.rawMaterials]);

    /* ===================================================
        TOTAL FINISHED COST
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
        setFinishedGoodForm({ ...emptyProduct });
        setIsFinishedGoodApplied(false);
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

        const appliedFinishedGood = {
            productCode: record?.finishedGood?.productCode || "",
            productName: record?.finishedGood?.productName || "",
            quantity: record?.finishedGood?.quantity || "",
            rate: record?.finishedGood?.rate || "",
            amount: record?.finishedGood?.amount || "",
        };

        setForm({
            voucherNumber: record?.voucherNumber || "ASP",
            voucherDate:
                record?.voucherDate || new Date().toISOString().split("T")[0],
            status: record?.status || "open",
            remarks: record?.remarks || "",

            finishedGood: appliedFinishedGood,

            rawMaterials: record?.rawMaterials || [],

            totalRawMaterialCost: record?.totalRawMaterialCost || "0",
            // productionCost: record?.productionCost || "0",
            productionCost:
                record?.productionCost ||
                record?.finishedGood?.rate ||
                "0",
            totalFinishedCost: record?.totalFinishedCost || "0",

            warehouseCode: record?.warehouseCode || "",
            locationCode: record?.locationCode || "",
        });

        setFinishedGoodForm(appliedFinishedGood);
        setIsFinishedGoodApplied(Boolean(appliedFinishedGood.productCode));

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
        FINISHED GOOD TEMP CHANGE HANDLER
    =================================================== */
    const handleFinishedGoodChange = (key: string, value: any) => {
        setFinishedGoodForm((prev: any) => {
            const updated = {
                ...prev,
                [key]: value,
            };

            updated.amount = calculateAmount(updated.quantity, updated.rate);

            return updated;
        });

        /*
          If user changes anything after Apply,
          then they must click Apply again.
        */
        setIsFinishedGoodApplied(false);

        setErrors((prev: any) => ({
            ...prev,
            [`finishedGood.${key}`]: "",
            finishedGoodApply: "",
        }));
    };

    /* ===================================================
        FINISHED GOOD PRODUCT CHANGE
    =================================================== */
    const handleFinishedGoodProductChange = (productCode: string) => {
        const selectedProduct = finishedGoodOptions.find(
            (item: any) => item.value === productCode
        );

        setFinishedGoodForm((prev: any) => {
            const rate = productCode ? getProductRate(selectedProduct?.raw, "") : "";

            const updated = {
                ...prev,
                productCode,
                productName: selectedProduct?.label || "",
                rate,
            };

            updated.amount = calculateAmount(updated.quantity, updated.rate);

            return updated;
        });

        setIsFinishedGoodApplied(false);

        setErrors((prev: any) => ({
            ...prev,
            "finishedGood.productCode": "",
            "finishedGood.rate": "",
            finishedGoodApply: "",
        }));
    };

    /* ===================================================
        VALIDATE FINISHED GOOD BEFORE APPLY
    =================================================== */
    const validateFinishedGood = () => {
        const err: any = {};

        if (!finishedGoodForm.productCode) {
            err["finishedGood.productCode"] = "Finished good is required";
        }

        if (!finishedGoodForm.quantity) {
            err["finishedGood.quantity"] = "Quantity is required";
        }

        if (!finishedGoodForm.rate) {
            err["finishedGood.rate"] = "Rate is required";
        }

        setErrors((prev: any) => ({
            ...prev,
            ...err,
        }));

        return Object.keys(err).length === 0;
    };

    /* ===================================================
        APPLY FINISHED GOOD INTO MAIN PAYLOAD FORM
    =================================================== */
    // const handleApplyFinishedGood = () => {
    //     if (!validateFinishedGood()) return;

    //     const appliedFinishedGood = {
    //         ...finishedGoodForm,
    //         amount: calculateAmount(
    //             finishedGoodForm.quantity,
    //             finishedGoodForm.rate
    //         ),
    //     };

    //     setForm((prev: any) => ({
    //         ...prev,
    //         finishedGood: appliedFinishedGood,
    //     }));

    //     setIsFinishedGoodApplied(true);

    //     setErrors((prev: any) => ({
    //         ...prev,
    //         "finishedGood.productCode": "",
    //         "finishedGood.quantity": "",
    //         "finishedGood.rate": "",
    //         finishedGoodApply: "",
    //     }));

    //     toast.success("Finished good applied");
    // };

    /* ===================================================
        APPLY FINISHED GOOD INTO MAIN PAYLOAD FORM
    =================================================== */
    const handleApplyFinishedGood = () => {
        if (!validateFinishedGood()) return;

        const appliedFinishedGood = {
            ...finishedGoodForm,
            amount: calculateAmount(
                finishedGoodForm.quantity,
                finishedGoodForm.rate
            ),
        };

        const autoProductionCost = String(Number(finishedGoodForm.rate || 0));

        setForm((prev: any) => ({
            ...prev,
            finishedGood: appliedFinishedGood,

            // production cost autofetch from finished good rate
            productionCost: autoProductionCost,
        }));

        setIsFinishedGoodApplied(true);

        setErrors((prev: any) => ({
            ...prev,
            "finishedGood.productCode": "",
            "finishedGood.quantity": "",
            "finishedGood.rate": "",
            productionCost: "",
            finishedGoodApply: "",
        }));

        toast.success("Finished good applied");
    };

    /* ===================================================
        CLEAR FINISHED GOOD FORM
    =================================================== */
    const handleClearFinishedGood = () => {
        setFinishedGoodForm({ ...emptyProduct });
        setIsFinishedGoodApplied(false);

        setForm((prev: any) => ({
            ...prev,
            finishedGood: { ...emptyProduct },
        }));

        setErrors((prev: any) => ({
            ...prev,
            "finishedGood.productCode": "",
            "finishedGood.quantity": "",
            "finishedGood.rate": "",
            finishedGoodApply: "",
        }));
    };

    /* ===================================================
        RAW MATERIAL PRODUCT CHANGE
    =================================================== */
    const handleRawMaterialProductChange = (productCode: string) => {
        const selectedProduct = rawMaterialOptions.find(
            (item: any) => item.value === productCode
        );

        setRawMaterialForm((prev: any) => {
            const updated = {
                ...prev,
                productCode,
                productName: selectedProduct?.label || "",
                rate: productCode
                    ? getProductRate(selectedProduct?.raw, prev.rate)
                    : "",
            };

            updated.amount = calculateAmount(updated.quantity, updated.rate);

            return updated;
        });

        setRawErrors((prev: any) => ({
            ...prev,
            productCode: "",
            rate: "",
        }));
    };

    const handleRawMaterialChange = (key: string, value: any) => {
        setRawMaterialForm((prev: any) => {
            const updated = {
                ...prev,
                [key]: value,
            };

            updated.amount = calculateAmount(updated.quantity, updated.rate);

            return updated;
        });

        setRawErrors((prev: any) => ({
            ...prev,
            [key]: "",
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
        Edit RAW MATERIAL TO MAIN FORM
    =================================================== */
    /* ===================================================
        EDIT RAW MATERIAL
    =================================================== */
    const handleEditRawMaterial = (item: any, index: number) => {
        setEditingRawMaterialIndex(index);

        setRawMaterialForm({
            productCode: item?.productCode || "",
            productName: item?.productName || "",
            quantity: item?.quantity || "",
            rate: item?.rate || "",
            amount: item?.amount || "",
        });

        setRawErrors({});
        setShowRawMaterialModal(true);
    };


    /* ===================================================
        ADD RAW MATERIAL TO MAIN FORM
    =================================================== */
    /* ===================================================
     ADD / UPDATE RAW MATERIAL TO MAIN FORM
 =================================================== */
    const handleAddRawMaterial = () => {
        if (!validateRawMaterial()) return;

        const finalRawMaterial = {
            ...rawMaterialForm,
            amount: calculateAmount(rawMaterialForm.quantity, rawMaterialForm.rate),
        };

        setForm((prev: any) => {
            let updatedRawMaterials = [...prev.rawMaterials];

            if (editingRawMaterialIndex !== null) {
                updatedRawMaterials[editingRawMaterialIndex] = finalRawMaterial;
            } else {
                updatedRawMaterials.push(finalRawMaterial);
            }

            return {
                ...prev,
                rawMaterials: updatedRawMaterials,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            rawMaterials: "",
        }));

        setRawMaterialForm({ ...emptyProduct });
        setRawErrors({});
        setEditingRawMaterialIndex(null);
        setShowRawMaterialModal(false);
    };

    /* ===================================================
        DELETE RAW MATERIAL FROM MAIN FORM
    =================================================== */
    const handleDeleteRawMaterial = (index: number) => {
        setForm((prev: any) => ({
            ...prev,
            rawMaterials: prev.rawMaterials.filter(
                (_: any, i: number) => i !== index
            ),
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

        if (!isFinishedGoodApplied || !form.finishedGood.productCode) {
            err.finishedGoodApply = "Please apply finished good before saving";
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

        if (err.finishedGoodApply) {
            toast.error(err.finishedGoodApply);
        }

        return Object.keys(err).length === 0;
    };

    /* ===================================================
        SAVE / UPDATE ASSEMBLY PRODUCTION
    =================================================== */
    //   const handleSubmit = async () => {
    //     if (!validateForm()) return;

    //     const payload = {
    //       ...form,

    //       finishedGood: {
    //         ...form.finishedGood,
    //         amount: calculateAmount(
    //           form.finishedGood.quantity,
    //           form.finishedGood.rate
    //         ),
    //       },

    //       rawMaterials: form.rawMaterials,

    //       totalRawMaterialCost: String(totalRawMaterialCost),
    //       productionCost: String(Number(form.productionCost || 0)),
    //       totalFinishedCost: String(totalFinishedCost),
    //     };

    //     try {
    //       if (editingRecord) {
    //         await dispatch(
    //           updateAssemblyProduction({
    //             voucherNumber: editingRecord.voucherNumber,
    //             data: payload,
    //           }) as any
    //         ).unwrap();

    //         toast.success("Assembly production updated successfully");
    //       } else {
    //         await dispatch(createAssemblyProduction(payload) as any).unwrap();

    //         toast.success("Assembly production created successfully");
    //       }

    //       setShowModal(false);
    //       setEditingRecord(null);
    //       setForm(getDefaultForm());
    //       setFinishedGoodForm({ ...emptyProduct });
    //       setIsFinishedGoodApplied(false);
    //       setRawMaterialForm({ ...emptyProduct });
    //       fetchAssemblyProductions();
    //     } catch (err: any) {
    //       toast.error(err?.message || "Operation failed");
    //     }
    //   };


    /* ===================================================
        SAVE / UPDATE ASSEMBLY PRODUCTION
    =================================================== */
    const handleSubmit = async () => {
        if (!validateForm()) return;

        /*
          voucherNumber is only for UI display.
          Do not send it in create/update payload.
          Backend will auto-generate it.
        */
        const { voucherNumber, ...formWithoutVoucherNumber } = form;

        const payload = {
            ...formWithoutVoucherNumber,

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
            setFinishedGoodForm({ ...emptyProduct });
            setIsFinishedGoodApplied(false);
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




    const rawMaterialTableFields = [
        {
            label: "Name",
            key: "productName",
            // render: (item: any) => item?.productName || "-",
        },
        {
            label: "Quantity",
            key: "quantity",
            // render: (item: any) => item?.quantity || "0",
        },
        {
            label: "Rate",
            key: "rate",
            render: (item: any) => `₹${item?.rate || "0"}`,
        },
        {
            label: "Amount",
            key: "amount",
            render: (item: any) => `₹${Number(item?.amount || 0).toFixed(2)}`,
        },
    ];


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
                        <button
                            id="assembly-production-edit-button"
                            onClick={() => openEditModal(record)}
                            className="p-2 rounded-md text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer"
                        >
                            <Edit size={16} />
                        </button>

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
                                    {/* <TextInput
                                        label="Voucher no."
                                        value={form.voucherNumber}
                                        placeholder="Voucher no."
                                        disabled
                                        error={errors.voucherNumber}
                                        onChange={(e: any) =>
                                            handleMainChange("voucherNumber", e.target.value)
                                        }
                                    /> */}
                                    <TextInput
                                        label="Voucher no."
                                        value={form.voucherNumber}
                                        placeholder="Voucher no."
                                        disabled
                                        error={errors.voucherNumber}
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

                                    <SelectInput
                                        label="Status"
                                        value={form.status}
                                        placeholder="Status"
                                        disabled
                                        error={errors.status}
                                        onChange={(e: any) =>
                                            handleMainChange("status", e.target.value)
                                        }
                                        options={[
                                            { label: "Open", value: "open" },
                                            { label: "Closed", value: "closed" },
                                        ]}
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
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Finished good
                                    </h3>

                                    {isFinishedGoodApplied && (
                                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                            Applied
                                        </span>
                                    )}
                                </div>

                                {errors.finishedGoodApply && (
                                    <p className="mb-2 text-sm font-medium text-red-500">
                                        {errors.finishedGoodApply}
                                    </p>
                                )}

                                <div className="rounded-md border border-slate-200 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-4">
                                            <SelectInput
                                                label="Select Product"
                                                mandatory
                                                value={finishedGoodForm.productCode}
                                                placeholder="Select Product"
                                                error={errors["finishedGood.productCode"]}
                                                onChange={(e: any) =>
                                                    handleFinishedGoodProductChange(e.target.value)
                                                }
                                                options={
                                                    finishedGoodOptions?.length > 0
                                                        ? [
                                                            { label: "Select Product", value: "" },
                                                            ...finishedGoodOptions,
                                                        ]
                                                        : [{ label: "No Product", value: "" }]
                                                }
                                            />
                                        </div>

                                        <TextInput
                                            label="Quantity"
                                            mandatory
                                            type="number"
                                            value={finishedGoodForm.quantity}
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
                                            value={finishedGoodForm.rate}
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
                                                value={finishedGoodForm.amount}
                                                placeholder="Amount"
                                                disabled
                                                onChange={(e: any) =>
                                                    handleFinishedGoodChange("amount", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 text-sm font-bold text-slate-600">
                                        Gross: ₹{Number(finishedGoodForm.amount || 0).toFixed(2)}
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
                                            onClick={handleApplyFinishedGood}
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
                                            if (rawMaterialOptions.length === 0) {
                                                setShowNoRawMaterialAlert(true);
                                                return;
                                            }

                                            setEditingRawMaterialIndex(null);
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

                                <ColumnWiseTable
                                    data={form.rawMaterials}
                                    fields={rawMaterialTableFields}
                                    emptyMessage="No data"
                                    onEdit={(item, index) => handleEditRawMaterial(item, index)}
                                    onDelete={(_, index) => handleDeleteRawMaterial(index)}
                                />
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
                                        disabled
                                        error={errors.productionCost}
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
                    title: editingRawMaterialIndex !== null ? "Update raw material" : "Add raw material",
                    body: (
                        <div className="col-span-2 rounded-md border border-slate-200 bg-white p-4">
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

            <WarningModel
                show={showNoRawMaterialAlert}
                title="No Product Found"
                message="Please create at least one raw material product to proceed with assembly production."
                cancelText="Cancel"
                confirmText="Yes"
                onCancel={() => setShowNoRawMaterialAlert(false)}
                onConfirm={() => {
                    setShowNoRawMaterialAlert(false);
                    navigate("/professional/master/product");
                }}
            />
        </div>
    );
};

export default AssemblyProduction;