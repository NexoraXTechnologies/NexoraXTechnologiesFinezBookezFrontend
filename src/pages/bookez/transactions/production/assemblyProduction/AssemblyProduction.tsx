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

import { getAllProducts, getProductBalance } from "../../../../../redux/slices/professionalSlice/productMasterSlice";

import {
    addAssemblyProduction,
    deleteAssemblyProduction,
    getAssemblyProductionList,
    updateAssemblyProduction,
} from "../../../../../redux/slices/professionalSlice/production/assemblyProductionSlice";
import { fmtMoney, formatDateForInput, formatDateForList, money, num, todayYMD } from "../../../../../utils/helperFunctions";
import Permission from "../../../../../components/PermissionGuard";
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";
import { getAllUnits } from "../../../../../redux/slices/professionalSlice/unitMasterSlice";

/* ===================================================
    COMMON HELPERS
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





const sanitizeDecimal = (value: any) => {
    const str = String(value ?? "");

    const cleaned = str
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1");

    return cleaned;
};

const isNumericField = (key: string) => {
    return ["quantity", "rate", "amount", "productionCost"].includes(key);
};

const getFinancialYearRange = (dateValue?: string) => {
    const selectedDate = dateValue ? new Date(`${dateValue}T23:59:59.999`) : new Date();
    const financialYear = selectedDate.getMonth() >= 3 ? selectedDate.getFullYear() : selectedDate.getFullYear() - 1;
    return {
        fromDate: new Date(financialYear, 3, 1, 0, 0, 0, 0).toISOString(),
        toDate: selectedDate.toISOString(),
    };
};

const renderAssemblyRawMaterialCellExtra = (column: any, row: any) => {
    if (column?.key !== "quantity" || !row?.productCode) return null;

    const productType = String(row?.productType || "").trim().toLowerCase();
    if (["serviceproduct", "nonstocks"].includes(productType)) return null;

    return (
        <InputBorderLabel
            label="Avl Qty"
            value={row?.availableQuantity}
            loading={row?.availableQuantity === null || row?.availableQuantity === undefined}
            successWhenPositive
        />
    );
};

const renderFinishedGoodExtra = (field: any, currentForm: any) => {
    if (field?.key !== "quantity" || !currentForm?.productCode) return null;

    const productType = String(currentForm?.productType || "").trim().toLowerCase();
    if (["serviceproduct", "nonstocks"].includes(productType)) return null;

    const loading = currentForm?.availableQuantity === null || currentForm?.availableQuantity === undefined;
    const availableQuantity = currentForm?.availableQuantity;

    return (
        <span
            className={`pointer-events-none absolute right-2 top-[16px] z-10 bg-card px-1 text-xs font-medium ${loading
                    ? "text-muted-foreground"
                    : Number(availableQuantity) > 0
                        ? "text-success"
                        : "text-danger"
                }`}
        >
            Avl Qty: {loading ? "Loading..." : availableQuantity}
        </span>
    );
};

/* ===================================================
    EMPTY RAW MATERIAL ROW
=================================================== */

const emptyRawMaterialRow = {
    id: Date.now(),
    productCode: "",
    productName: "",
    productId: "",
    unit: "",
    quantity: "",
    availableQuantity: null,
    productType: "",
    rate: "",
    amount: 0,
    remarks: "",
};

/* ===================================================
    DEFAULT FORM STRUCTURE
=================================================== */

const getDefaultForm = () => ({
    voucherNumber: "ASP",
    voucherDate: todayYMD(),
    status: "open",
    remarks: "",
    warehouseCode: "",
    locationCode: "",

    productCode: "",
    productName: "",
    productId: "",
    unit: "",
    quantity: "",
    availableQuantity: null,
    productType: "",
    rate: "",
    amount: 0,

    rawMaterials: [{ ...emptyRawMaterialRow, id: Date.now() }],

    totalRawMaterialCost: "0.00",
    productionCost: "0.00",
    totalFinishedCost: "0.00",
});

const AssemblyProduction = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
        REDUX STATE
    =================================================== */

    const assemblyProductionState = useSelector(
        (state: any) => state.assemblyProduction
    );

    const {
        assemblyProductions = [],
        pagination = defaultPagination,
        addLoader = false,
        updateLoader = false,
        listingLoader = false,
        deleteLoader = false,
    } = assemblyProductionState || {};

    /* ===================================================
        LOCAL STATES
    =================================================== */

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState("open");

    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});

    const [finishedGoodOptions, setFinishedGoodOptions] = useState<any[]>([]);
    const [rawMaterialOptions, setRawMaterialOptions] = useState<any[]>([]);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });
    const { units = [] } = useSelector((state: any) => state.unitMaster || {});

    /* ===================================================
        OPTION HELPERS
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

    const makeProductOptions = (res: any) => {
        return getRecords(res).map((item: any) => ({
            label: item.productName || item.name || item.productCode || "-",
            value: item.productCode || item.code || item._id,
            raw: item,
        }));
    };

    // const makeOptionsWithPlaceholder = (placeholder: string, options: any[]) => {
    //     return [
    //         {
    //             label: placeholder,
    //             value: "",
    //         },
    //         ...(options || []),
    //     ];
    // };

    const unitOptions = useMemo(() => {
        return (units || [])
            .map((item: any) => ({
                label:
                    typeof item?.unitName === "object"
                        ? item?.unitName?.en || item?.unitName?.name || item?.unitCode || "-"
                        : item?.unitName || item?.name || item?.unitCode || "-",
                value: item?.unitCode || item?.code || item?._id || "",
                raw: item,
            }))
            .filter((item: any) => item.value);
    }, [units]);



    const getSelectedValue = (value: any) => {
        if (value && typeof value === "object") {
            return (
                value.value ||
                value.productCode ||
                value.code ||
                value._id ||
                ""
            );
        }

        return value;
    };

    const getProductRate = (product: any, fallback = "") => {
        return String(
            product?.sellingPrice ||
            product?.productSellingPrice ||
            product?.salesRate ||
            product?.saleRate ||
            product?.purchasePrice ||
            product?.productPurchasePrice ||
            product?.rate ||
            fallback ||
            ""
        );
    };

    const getProductId = (product: any) => {
        return product?._id || product?.productId || product?.id || "";
    };

    const getProductName = (selectedOption: any, product: any) => {
        return (
            selectedOption?.label ||
            product?.productName ||
            product?.name ||
            product?.productCode ||
            ""
        );
    };

    const getVoucherNumber = (record: any) => {
        return (
            record?.voucherNumber ||
            record?.assemblyProductionVoucherNumber ||
            record?.assemblyVoucherNumber ||
            ""
        );
    };

    /* ===================================================
        CALCULATION HELPERS
    =================================================== */

    const calculateAmount = (quantity: any, rate: any) => {
        return num(quantity) * num(rate);
    };

    const calculateRawMaterialRow = (row: any) => {
        return {
            ...row,
            amount: calculateAmount(row.quantity, row.rate),
        };
    };

    const cleanRawMaterials = () => {
        return (form.rawMaterials || [])
            .filter((row: any) => row.productCode || row.quantity || row.rate)
            .map((row: any) => calculateRawMaterialRow(row));
    };

    const totalRawMaterialCost = useMemo(() => {
        return (form.rawMaterials || []).reduce((sum: number, item: any) => {
            return sum + num(item.amount);
        }, 0);
    }, [form.rawMaterials]);

    const finishedGoodAmount = useMemo(() => {
        return calculateAmount(form.quantity, form.rate);
    }, [form.quantity, form.rate]);

    const totalFinishedCost = useMemo(() => {
        return num(form.productionCost);
    }, [form.productionCost]);

    /* ===================================================
        FETCH DROPDOWNS
    =================================================== */

    useEffect(() => {
        dispatch(getAllUnits({
            offset: 0,
            limit: 200
        }))
    }, [dispatch])

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [finishedGoodRes, rawMaterialRes]: any =
                    await Promise.all([
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

        fetchDropdowns();
    }, [dispatch]);

    /* ===================================================
        FETCH LIST
    =================================================== */

    const fetchAssemblyProductions = async () => {
        await dispatch(
            getAssemblyProductionList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status: status
            }) as any
        );
    };

    useEffect(() => {
        fetchAssemblyProductions();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    /* ===================================================
        LIST TABLE COLUMNS
    =================================================== */

    const columns = [
        {
            key: "voucherNumber",
            title: "Voucher No",
            render: (row: any) => getVoucherNumber(row) || "-",
        },
        {
            key: "voucherDate",
            title: "Date",
            render: (row: any) => formatDateForList(row?.voucherDate),
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
            key: "rawMaterials",
            title: "Raw Items",
            render: (row: any) => row?.rawMaterials?.length || 0,
        },
        {
            key: "totalRawMaterialCost",
            title: "Raw Cost",
            render: (row: any) => (
                <span className="font-medium text-slate-700">
                    {money(row?.totalRawMaterialCost || 0)}
                </span>
            ),
        },
        {
            key: "productionCost",
            title: "Production Cost",
            render: (row: any) => (
                <span className="font-medium text-slate-700">
                    {money(row?.productionCost || 0)}
                </span>
            ),
        },
        {
            key: "totalFinishedCost",
            title: "Finished Cost",
            render: (row: any) => (
                <span className="font-semibold text-indigo-700">
                    {money(row?.totalFinishedCost || 0)}
                </span>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.status === "open"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    {row?.status || "-"}
                </span>
            ),
        },
    ];

    /* ===================================================
        BASIC HANDLERS
    =================================================== */

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchAssemblyProductions();
            toast.success("Assembly production list refreshed");
        } catch (err: any) {
            toast.error(err?.message || "Failed to refresh list");
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

    const loadFinishedGoodAvailableQuantity = async (productCode: string, productType: string) => {
        const normalizedProductType = String(productType || "").trim().toLowerCase();

        if (!productCode || ["serviceproduct", "nonstocks"].includes(normalizedProductType)) {
            setForm((previous: any) => ({
                ...previous,
                productType: normalizedProductType,
                availableQuantity: null,
            }));
            return;
        }

        setForm((previous: any) => {
            if (String(previous?.productCode || "") !== String(productCode)) return previous;
            return {
                ...previous,
                productType: normalizedProductType,
                availableQuantity: null,
            };
        });

        try {
            const { fromDate, toDate } = getFinancialYearRange(todayYMD());
            const balance: any = await dispatch(
                getProductBalance({
                    productCode,
                    fromDate,
                    toDate,
                }) as any
            ).unwrap();

            setForm((previous: any) => {
                if (String(previous?.productCode || "") !== String(productCode)) return previous;
                return {
                    ...previous,
                    productType: normalizedProductType,
                    availableQuantity:
                        balance?.balanceQuantity !== undefined &&
                            balance?.balanceQuantity !== null
                            ? balance.balanceQuantity
                            : null,
                };
            });
        } catch (error) {
            console.log(`Failed to fetch finished good available quantity for ${productCode}`, error);

            setForm((previous: any) => {
                if (String(previous?.productCode || "") !== String(productCode)) return previous;
                return {
                    ...previous,
                    productType: normalizedProductType,
                    availableQuantity: previous?.availableQuantity ?? null,
                };
            });
        }
    };

    const loadRawMaterialAvailableQuantity = async (
        index: number,
        productCode: string,
        productType: string
    ) => {
        const normalizedProductType = String(productType || "").trim().toLowerCase();

        if (!productCode || ["serviceproduct", "nonstocks"].includes(normalizedProductType)) {
            setForm((previous: any) => {
                const updatedRawMaterials = [...(previous.rawMaterials || [])];
                if (!updatedRawMaterials[index]) return previous;

                updatedRawMaterials[index] = {
                    ...updatedRawMaterials[index],
                    productType: normalizedProductType,
                    availableQuantity: null,
                };

                return {
                    ...previous,
                    rawMaterials: updatedRawMaterials,
                };
            });
            return;
        }

        setForm((previous: any) => {
            const updatedRawMaterials = [...(previous.rawMaterials || [])];
            if (
                !updatedRawMaterials[index] ||
                String(updatedRawMaterials[index]?.productCode || "") !== String(productCode)
            ) {
                return previous;
            }

            updatedRawMaterials[index] = {
                ...updatedRawMaterials[index],
                productType: normalizedProductType,
                availableQuantity: null,
            };

            return {
                ...previous,
                rawMaterials: updatedRawMaterials,
            };
        });

        try {
            const { fromDate, toDate } = getFinancialYearRange(todayYMD());
            const balance: any = await dispatch(
                getProductBalance({
                    productCode,
                    fromDate,
                    toDate,
                }) as any
            ).unwrap();

            setForm((previous: any) => {
                const updatedRawMaterials = [...(previous.rawMaterials || [])];
                if (
                    !updatedRawMaterials[index] ||
                    String(updatedRawMaterials[index]?.productCode || "") !== String(productCode)
                ) {
                    return previous;
                }

                updatedRawMaterials[index] = {
                    ...updatedRawMaterials[index],
                    productType: normalizedProductType,
                    availableQuantity:
                        balance?.balanceQuantity !== undefined &&
                            balance?.balanceQuantity !== null
                            ? balance.balanceQuantity
                            : null,
                };

                return {
                    ...previous,
                    rawMaterials: updatedRawMaterials,
                };
            });
        } catch (error) {
            console.log(`Failed to fetch raw material available quantity for ${productCode}`, error);

            setForm((previous: any) => {
                const updatedRawMaterials = [...(previous.rawMaterials || [])];
                if (
                    !updatedRawMaterials[index] ||
                    String(updatedRawMaterials[index]?.productCode || "") !== String(productCode)
                ) {
                    return previous;
                }

                updatedRawMaterials[index] = {
                    ...updatedRawMaterials[index],
                    productType: normalizedProductType,
                    availableQuantity: updatedRawMaterials[index]?.availableQuantity ?? null,
                };

                return {
                    ...previous,
                    rawMaterials: updatedRawMaterials,
                };
            });
        }
    };

    const openEditModal = (record: any) => {
        const finishedGood = record?.finishedGood || {};

        const rawMaterials =
            record?.rawMaterials?.length > 0
                ? record.rawMaterials.map((item: any) =>
                    calculateRawMaterialRow({
                        id: item?.id || Date.now() + Math.random(),
                        productCode: item?.productCode || "",
                        productName: item?.productName || "",
                        productId: item?.productId || "",
                        unit: item?.unit || "",
                        quantity: item?.quantity || "",
                        availableQuantity: null,
                        productType: item?.productType || "rawmaterial",
                        rate: item?.rate || "",
                        amount: item?.amount || 0,
                        remarks: item?.remarks || "",
                    })
                )
                : [{ ...emptyRawMaterialRow, id: Date.now() }];

        const editFinishedGoodAmount =
            finishedGood?.amount ||
            fmtMoney(calculateAmount(finishedGood?.quantity, finishedGood?.rate));

        setEditingRecord(record);
        setErrors({});

        setForm({
            voucherNumber: getVoucherNumber(record) || "ASP",
            voucherDate: formatDateForInput(record?.voucherDate),
            status: record?.status || "open",
            remarks: record?.remarks || "",
            warehouseCode: record?.warehouseCode || "",
            locationCode: record?.locationCode || "",

            productCode: finishedGood?.productCode || "",
            productName: finishedGood?.productName || "",
            productId: finishedGood?.productId || "",
            unit: finishedGood?.unit || "",
            quantity: finishedGood?.quantity || "",
            availableQuantity: null,
            productType: finishedGood?.productType || "finishedgoods",
            rate: finishedGood?.rate || "",
            amount: editFinishedGoodAmount,

            rawMaterials,

            totalRawMaterialCost: record?.totalRawMaterialCost || "0.00",
            productionCost:
                record?.productionCost ||
                editFinishedGoodAmount ||
                "0.00",
            totalFinishedCost:
                record?.totalFinishedCost ||
                record?.productionCost ||
                editFinishedGoodAmount ||
                "0.00",
        });

        setShowModal(true);
    };

    useEffect(() => {
        if (!showModal || !editingRecord) return;

        if (form?.productCode) {
            const selectedFinishedGood = finishedGoodOptions.find(
                (item: any) => String(item.value) === String(form.productCode)
            );

            void loadFinishedGoodAvailableQuantity(
                String(form.productCode),
                String(
                    selectedFinishedGood?.raw?.productType ||
                    form?.productType ||
                    "finishedgoods"
                )
            );
        }

        (form?.rawMaterials || []).forEach((item: any, index: number) => {
            if (!item?.productCode) return;

            const selectedRawMaterial = rawMaterialOptions.find(
                (option: any) => String(option.value) === String(item.productCode)
            );

            void loadRawMaterialAvailableQuantity(
                index,
                String(item.productCode),
                String(
                    selectedRawMaterial?.raw?.productType ||
                    item?.productType ||
                    "rawmaterial"
                )
            );
        });
    }, [showModal, editingRecord, form?.voucherNumber]);

    /* ===================================================
        HEADER FORM CHANGE
    =================================================== */

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const rawValue = getSelectedValue(value);
            const finalValue = isNumericField(key)
                ? sanitizeDecimal(rawValue)
                : rawValue;

            const updated = {
                ...prev,
                [key]: finalValue,
            };

            if (key === "productCode") {
                const selectedProduct = finishedGoodOptions.find(
                    (item: any) => String(item.value) === String(finalValue)
                );

                const product = selectedProduct?.raw;
                const rate = finalValue ? getProductRate(product, "") : "";
                const amount = calculateAmount(updated.quantity, rate);

                updated.productCode = finalValue;
                updated.productName = finalValue
                    ? getProductName(selectedProduct, product)
                    : "";
                updated.productId = finalValue ? getProductId(product) : "";
                updated.unit = finalValue ? String(product?.unit || product?.uom || "") : "";
                updated.productType = finalValue
                    ? String(product?.productType || product?.dynamicFields?.productType || "finishedgoods")
                    : "";
                updated.availableQuantity = null;
                updated.rate = rate;
                updated.amount = amount;
                updated.productionCost = fmtMoney(amount);
                updated.totalFinishedCost = fmtMoney(amount);
            }

            if (key === "quantity" || key === "rate") {
                const quantity =
                    key === "quantity" ? finalValue : updated.quantity;

                const rate = key === "rate" ? finalValue : updated.rate;

                const amount = calculateAmount(quantity, rate);

                updated.amount = amount;
                updated.productionCost = fmtMoney(amount);
                updated.totalFinishedCost = fmtMoney(amount);
            }

            return updated;
        });

        if (key === "productCode") {
            const selectedProduct = finishedGoodOptions.find(
                (item: any) => String(item.value) === String(getSelectedValue(value))
            );

            const product = selectedProduct?.raw || {};
            const productCode = String(getSelectedValue(value) || "");
            const productType = String(
                product?.productType ||
                product?.dynamicFields?.productType ||
                "finishedgoods"
            );

            void loadFinishedGoodAvailableQuantity(productCode, productType);
        }

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    /* ===================================================
        RAW MATERIAL ROW HANDLERS
    =================================================== */

    const handleAddRow = () => {
        if (rawMaterialOptions.length === 0) {
            toast.error("Please create at least one raw material first");
            return;
        }

        setForm((prev: any) => ({
            ...prev,
            rawMaterials: [
                ...(prev.rawMaterials || []),
                {
                    ...emptyRawMaterialRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedRawMaterials = prev.rawMaterials.filter(
                (_: any, i: number) => i !== index
            );

            return {
                ...prev,
                rawMaterials:
                    updatedRawMaterials.length > 0
                        ? updatedRawMaterials
                        : [{ ...emptyRawMaterialRow, id: Date.now() }],
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const rawValue = getSelectedValue(value);
            const finalValue = isNumericField(key)
                ? sanitizeDecimal(rawValue)
                : rawValue;

            const updatedRawMaterials = [...(prev.rawMaterials || [])];

            let updatedRow = {
                ...updatedRawMaterials[index],
                [key]: finalValue,
            };

            if (key === "productCode") {
                const selectedProduct = rawMaterialOptions.find(
                    (item: any) => String(item.value) === String(finalValue)
                );

                const product = selectedProduct?.raw;
                const rate = finalValue ? getProductRate(product, "") : "";

                updatedRow = {
                    ...updatedRow,
                    productCode: finalValue,
                    productName: finalValue
                        ? getProductName(selectedProduct, product)
                        : "",
                    productId: finalValue ? getProductId(product) : "",
                    unit: finalValue ? String(product?.unit || product?.uom || "") : "",
                    productType: finalValue
                        ? String(product?.productType || product?.dynamicFields?.productType || "rawmaterial")
                        : "",
                    availableQuantity: null,
                    rate,
                    amount: calculateAmount(updatedRow.quantity, rate),
                };
            }

            if (key === "quantity" || key === "rate") {
                const quantity =
                    key === "quantity" ? finalValue : updatedRow.quantity;

                const rate = key === "rate" ? finalValue : updatedRow.rate;

                updatedRow = {
                    ...updatedRow,
                    amount: calculateAmount(quantity, rate),
                };
            }

            updatedRawMaterials[index] = updatedRow;

            return {
                ...prev,
                rawMaterials: updatedRawMaterials,
            };
        });

        if (key === "productCode") {
            const selectedProduct = rawMaterialOptions.find(
                (item: any) => String(item.value) === String(getSelectedValue(value))
            );

            const product = selectedProduct?.raw || {};
            const productCode = String(getSelectedValue(value) || "");
            const productType = String(
                product?.productType ||
                product?.dynamicFields?.productType ||
                "rawmaterial"
            );

            void loadRawMaterialAvailableQuantity(index, productCode, productType);
        }

        setErrors((prev: any) => ({
            ...prev,
            rawMaterials: "",
            [`row_${index}_${key}`]: "",
        }));
    };

    /* ===================================================
        VALIDATION
    =================================================== */

    const validateForm = () => {
        const err: any = {};

        if (!form.voucherDate) {
            err.voucherDate = "Date is required";
        }

        if (!form.status) {
            err.status = "Status is required";
        }

        if (!form.productCode) {
            err.productCode = "Finished good is required";
        }

        if (!form.quantity || num(form.quantity) <= 0) {
            err.quantity = "Finished good quantity is required";
        }

        if (!form.unit) {
            err.unit = "Finished good unit is required";
        }

        if (!form.rate || num(form.rate) <= 0) {
            err.rate = "Finished good rate is required";
        }

        const filledRows = cleanRawMaterials();

        if (filledRows.length === 0) {
            err.rawMaterials = "Please add at least one raw material";
        }

        form.rawMaterials.forEach((row: any, index: number) => {
            const hasAnyValue = row.productCode || row.quantity || row.rate;

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
        });

        setErrors(err);

        if (err.rawMaterials) {
            toast.error(err.rawMaterials);
        }

        return Object.keys(err).length === 0;
    };

    /* ===================================================
        SAVE / UPDATE
    =================================================== */

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const rawMaterials = cleanRawMaterials();

        const rawTotal = rawMaterials.reduce((sum: number, item: any) => {
            return sum + num(item.amount);
        }, 0);

        const fgAmount = calculateAmount(form.quantity, form.rate);

        const payload = {
            voucherDate: form.voucherDate,
            status: form.status || "open",
            remarks: form.remarks || "",
            warehouseCode: String(form.warehouseCode || "").trim(),
            locationCode: String(form.locationCode || "").trim(),

            finishedGood: {
                productCode: form.productCode,
                productName: form.productName,
                productId: form.productId,
                unit: String(form.unit || ""),
                quantity: String(form.quantity),
                rate: String(form.rate),
                amount: fmtMoney(fgAmount),
            },

            rawMaterials: rawMaterials.map((item: any) => ({
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,
                unit: String(item.unit || ""),
                quantity: String(item.quantity),
                rate: String(item.rate),
                amount: fmtMoney(item.amount),
                remarks: String(item.remarks || "").trim(),
            })),

            totalRawMaterialCost: fmtMoney(rawTotal),
            productionCost: fmtMoney(fgAmount),
            totalFinishedCost: fmtMoney(fgAmount),
        };

        try {
            if (editingRecord) {
                const assemblyProductionVoucherNumber =
                    getVoucherNumber(editingRecord);

                if (!assemblyProductionVoucherNumber) {
                    toast.error("Voucher number not found");
                    return;
                }

                await dispatch(
                    updateAssemblyProduction({
                        assemblyProductionVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                toast.success("Assembly production updated successfully");
            } else {
                await dispatch(
                    addAssemblyProduction({ payload }) as any
                ).unwrap();

                toast.success("Assembly production created successfully");
            }

            setShowModal(false);
            resetMainForm();
            fetchAssemblyProductions();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    /* ===================================================
        DELETE
    =================================================== */

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip.voucherNumber) return;

            await dispatch(
                deleteAssemblyProduction({
                    assemblyProductionVoucherNumber:
                        confirmTooltip.voucherNumber,
                }) as any
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

    /* ===================================================
        DYNAMIC FORM STRUCTURE
    =================================================== */

    const inputData = {
        header: [
            {
                key: "voucherNumber",
                label: "Voucher No",
                type: "text",
                disabled: true,
            },
            {
                key: "voucherDate",
                label: "Date",
                type: "date",
                isRequired: true,
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                isRequired: true,
                options: [
                    { label: "Open", value: "open" },
                    { label: "Close", value: "close" },
                ],
            },
            {
                key: "remarks",
                label: "Remark",
                type: "textarea",
                isRequired: false,
                placeholder: "Enter Remark",
            },
        ],

        headerChild: [
            {
                key: "productCode",
                label: "Finished Good",
                type: "select",
                isRequired: true,
                placeholder: "Select Finished Good",
                options: finishedGoodOptions,
            },
            {
                key: "quantity",
                label: "Finished Qty",
                type: "number",
                isRequired: true,
                placeholder: "Enter Quantity",
            },
            {
                key: "unit",
                label: "Unit",
                type: "select",
                isRequired: true,
                // placeholder: "Enter Unit",
                options: unitOptions
            },
            {
                key: "rate",
                label: "Finished Rate",
                type: "number",
                isRequired: true,
                placeholder: "Enter Rate",
            },
            {
                key: "amount",
                label: "Finished Amount",
                type: "number",
                disabled: true,
            },
        ],

        body: [
            {
                key: "productCode",
                label: "Raw Material",
                type: "select",
                width: "260px",
                isRequired: true,
                placeholder: "Select Raw Material",
                options:

                    rawMaterialOptions

            },
            {
                key: "unit",
                label: "Unit",
                type: "select",
                width: "120px",
                isRequired: true,
                options: unitOptions
            },
            {
                key: "quantity",
                label: "Qty",
                type: "number",
                width: "130px",
                isRequired: true,
            },
            {
                key: "rate",
                label: "Rate",
                type: "number",
                width: "140px",
                isRequired: true,
            },
            {
                key: "amount",
                label: "Amount",
                type: "number",
                width: "150px",
                disabled: true,
            },
            {
                key: "remarks",
                label: "Remarks",
                type: "text",
                width: "200px",
                isRequired: false,
                placeholder: "Enter Remarks",
            },
        ],

        footer: [
            {
                label: "Raw Material Cost",
                value: money(totalRawMaterialCost),
            },
            {
                label: "Production Cost",
                value: money(form.productionCost),
            },
            {
                label: "Finished Good Amount",
                value: money(finishedGoodAmount),
            },
            {
                label: "Total Finished Cost",
                value: money(totalFinishedCost),
            },
        ],
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {/* ================= HEADER ================= */}
            <div
                id="assembly-production-header"
                className="mb-3 flex items-center"
            >
                <div
                    id="assembly-production-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Assembly Productions:",
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
                    <Permission module="bookez" permissionKey="productions.assemblyProduction" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openAddModal,
                                text: "Add Assembly Production",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            {/* ================= LIST TABLE ================= */}
            <DataTable
                columns={columns}
                data={assemblyProductions}
                loading={listingLoader}
                emptyMessage={`No ${status} assembly production found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <Permission module="bookez" permissionKey="productions.assemblyProduction" action="update">
                            <button
                                id="assembly-production-edit-button"
                                onClick={() => openEditModal(record)}
                                className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>
                        <Permission module="bookez" permissionKey="productions.assemblyProduction" action="delete">
                            <button
                                id="assembly-production-delete-button"
                                disabled={deleteLoader}
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
                                        voucherNumber: getVoucherNumber(record),
                                    });
                                }}
                                className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </Permission>
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

            {/* ================= ADD / UPDATE FORM ================= */}
            <DynamicAddForm
                {...{
                    show: showModal,
                    setShow: setShowModal,
                    edit: Boolean(editingRecord),
                    title: "Assembly Production",
                    subtitle: "Fill in the assembly production details below",
                    loading: addLoader || updateLoader,
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
                    headerChildTitle: "Finished Good",
                    headerChildExtraRenderer: renderFinishedGoodExtra,
                    bodyKey: "rawMaterials",
                    handleChange: handleMainChange,
                    bodyCellExtraRenderer: renderAssemblyRawMaterialCellExtra,
                }}
            />
        </div>
    );
};

export default AssemblyProduction;