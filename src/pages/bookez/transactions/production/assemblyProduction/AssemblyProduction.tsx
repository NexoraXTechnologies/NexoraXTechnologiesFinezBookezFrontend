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
import { fmtMoney, formatDateForInput, formatDateForList, loadAllTemplateOptions, money, num, todayYMD } from "../../../../../utils/helperFunctions";
import Permission from "../../../../../components/PermissionGuard";
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";
import { getAllUnits } from "../../../../../redux/slices/professionalSlice/unitMasterSlice";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";

const MODULE_CODE = "assemblyProduction";

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

const isTrueValue = (value: any) => value === true || String(value ?? "").trim().toLowerCase() === "true";

const getSchemaDefaultValue = (field: any) => {
    if (field?.defaultValue !== undefined && field?.defaultValue !== null) return field.defaultValue;
    if (String(field?.type || "").trim().toLowerCase() === "boolean") return false;
    return "";
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

    customMasters: {},
    finishedGoodCustomMasters: {},

    totalRawMaterialCost: "0.00",
    productionCost: "0.00",
    totalFinishedCost: "0.00",
});

const AssemblyProduction = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
        REDUX STATE
    =================================================== */

    const assemblyProductionState = useSelector((state: any) => state.assemblyProduction);
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema || {});
    const { assemblyProductions = [], pagination = defaultPagination, addLoader = false, updateLoader = false, listingLoader = false, deleteLoader = false, } = assemblyProductionState || {};

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
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [templateFields, setTemplateFields] = useState<any>({ header: [], headerChild: [], body: [], footer: [] });
    const [finishedGoodOptions, setFinishedGoodOptions] = useState<any[]>([]);
    const [rawMaterialOptions, setRawMaterialOptions] = useState<any[]>([]);
    const [confirmTooltip, setConfirmTooltip] = useState<any>({ show: false, x: null, y: null, voucherNumber: null, });
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

    const buildSchemaDefaults = (fields: any[] = []) => {
        const values: any = {};
        (fields || []).forEach((field: any) => {
            if (!field?.key || isTrueValue(field?.isHidden)) return;
            values[field.key] = getSchemaDefaultValue(field);
        });
        return values;
    };

    const buildEmptyRawMaterialRow = () => ({
        ...emptyRawMaterialRow,
        ...buildSchemaDefaults(templateFields?.body || []),
        id: Date.now() + Math.random(),
        availableQuantity: null,
        productType: "",
    });

    const buildDefaultFormFromSchema = () => ({
        ...getDefaultForm(),
        ...buildSchemaDefaults(templateFields?.header || []),
        ...buildSchemaDefaults(templateFields?.headerChild || []),
        voucherNumber: "ASP",
        voucherDate: todayYMD(),
        status: "open",
        rawMaterials: [buildEmptyRawMaterialRow()],
    });

    const getSchemaField = (fields: any[], key: string) =>
        (fields || []).find((field: any) => String(field?.key || "") === String(key));

    const getOptionByValue = (field: any, selectedValue: any) =>
        (field?.options || []).find((option: any) => String(option?.value) === String(selectedValue));

    const isCustomMasterField = (field: any) =>
        String(field?.type || "").trim().toLowerCase() === "custommaster";

    const getCustomMasterName = (field: any) =>
        String(field?.customMasterName || field?.label || field?.title || field?.key || "").trim();

    const getCustomMasterSelection = (field: any, selectedValue: any) => {
        const value = getSelectedValue(selectedValue);
        if (value === undefined || value === null || value === "") return null;

        const selectedOption = getOptionByValue(field, value);
        const raw = selectedOption?.raw || {};
        const code = String(raw?.code || raw?.masterCode || selectedOption?.value || value || "").trim();
        const name = String(raw?.name || raw?.masterName || selectedOption?.label || code || "").trim();

        return code ? { code, name: name || code } : null;
    };

    const getStoredCustomMasterValue = (field: any, source: any) => {
        const masterName = getCustomMasterName(field);
        const stored = source?.customMasters?.[masterName];

        if (stored && typeof stored === "object") {
            return stored?.code || stored?.value || "";
        }

        return source?.[field?.key] ?? getSchemaDefaultValue(field);
    };

    const buildCustomMastersPayload = (fields: any[], source: any, existingCustomMasters: any = {}) => {
        const customMasters: any = {
            ...(existingCustomMasters && typeof existingCustomMasters === "object" ? existingCustomMasters : {}),
        };

        (fields || []).forEach((field: any) => {
            if (!field?.key || isTrueValue(field?.isHidden) || !isCustomMasterField(field)) return;

            const masterName = getCustomMasterName(field);
            if (!masterName) return;

            const selection = getCustomMasterSelection(field, source?.[field.key]);

            if (selection) customMasters[masterName] = selection;
            else delete customMasters[masterName];
        });

        return customMasters;
    };

    const applyMappedFields = (field: any, selectedValue: any, source: any) => {
        if (!field?.mapFields) return source;
        const selectedOption = getOptionByValue(field, selectedValue);
        const raw = selectedOption?.raw || {};
        const updated = { ...source };

        Object.entries(field.mapFields).forEach(([targetKey, sourceKey]) => {
            updated[targetKey] = raw?.[sourceKey as string] ?? raw?.dynamicFields?.[sourceKey as string] ?? raw?.dynamicData?.[sourceKey as string] ?? "";
        });

        return updated;
    };

    const hydrateSchemaValues = (fields: any[], source: any) => {
        const values: any = {};
        (fields || []).forEach((field: any) => {
            if (!field?.key || isTrueValue(field?.isHidden)) return;
            let value = isCustomMasterField(field)
                ? getStoredCustomMasterValue(field, source)
                : source?.[field.key] ?? getSchemaDefaultValue(field);
            if (String(field?.type || "").trim().toLowerCase() === "date" && value) value = formatDateForInput(value);
            values[field.key] = value;
        });
        return values;
    };

    const buildSchemaSectionPayload = (fields: any[], source: any) => {
        const values: any = {};
        (fields || []).forEach((field: any) => {
            const key = String(field?.key || "").trim();
            if (!key || isTrueValue(field?.isHidden) || key === "voucherNumber" || isCustomMasterField(field)) return;
            if (source?.[key] !== undefined) values[key] = source[key];
        });
        return values;
    };

    const getSelectedValue = (value: any) => {
        if (value && typeof value === "object") {
            return (value.value || value.productCode || value.code || value._id || "");
        }

        return value;
    };

    const getProductRate = (product: any, fallback = "") => {
        return String(product?.sellingPrice || product?.productSellingPrice || product?.salesRate || product?.saleRate || product?.purchasePrice || product?.productPurchasePrice || product?.rate || fallback || "");
    };

    const getProductId = (product: any) => {
        return product?._id || product?.productId || product?.id || "";
    };

    const getProductName = (selectedOption: any, product: any) => {
        return (selectedOption?.label || product?.productName || product?.name || product?.productCode || "");
    };

    const getVoucherNumber = (record: any) => {
        return (record?.voucherNumber || record?.assemblyProductionVoucherNumber || record?.assemblyVoucherNumber || "");
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
        return (form.rawMaterials || []).filter((row: any) => row.productCode || row.quantity || row.rate).map((row: any) => calculateRawMaterialRow(row));
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
        FETCH TRANSACTION SCHEMA
    =================================================== */

    useEffect(() => {
        dispatch(getAllTransactionSchema(MODULE_CODE) as any);
    }, [dispatch]);

    useEffect(() => {
        const prepareFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema = Array.isArray(transactionsSchema?.header) || Array.isArray(transactionsSchema?.inishedGood) || Array.isArray(transactionsSchema?.headerChild) || Array.isArray(transactionsSchema?.body) || Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;
            try {
                setFieldsLoading(true);

                const [mainSections, finishedGoodSection] = await Promise.all([
                    loadAllTemplateOptions({
                        header: transactionsSchema?.header || [],
                        body: transactionsSchema?.body || [],
                        footer: transactionsSchema?.footer || [],
                    }),
                    loadAllTemplateOptions({
                        header: transactionsSchema?.finishedGood || transactionsSchema?.headerChild || [],
                        body: [],
                        footer: [],
                    }),
                ]);

                setTemplateFields({
                    ...mainSections,
                    header: mainSections?.header || [],
                    headerChild: finishedGoodSection?.header || [],
                    body: mainSections?.body || [],
                    footer: mainSections?.footer || [],
                });
            } catch (error) {
                console.log("Failed to prepare Assembly Production transaction fields", error);
                toast.error("Failed to load Assembly Production fields");
            } finally {
                setFieldsLoading(false);
            }
        };

        void prepareFields();
    }, [transactionsSchema]);

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
        setForm(buildDefaultFormFromSchema());
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
                        ...buildSchemaDefaults(templateFields?.body || []),
                        ...hydrateSchemaValues(templateFields?.body || [], item),
                        ...item,
                        id: item?.id || Date.now() + Math.random(),
                        productCode: item?.productCode || "",
                        productName: item?.productName || "",
                        productId: item?.productId || "",
                        unit: item?.unit || item?.uom || "",
                        quantity: item?.quantity || "",
                        availableQuantity: null,
                        productType: item?.productType || "rawmaterial",
                        rate: item?.rate || "",
                        amount: item?.amount || 0,
                        remarks: item?.remarks || "",
                    })
                )
                : [buildEmptyRawMaterialRow()];

        const editFinishedGoodAmount =
            finishedGood?.amount ||
            fmtMoney(calculateAmount(finishedGood?.quantity, finishedGood?.rate));

        setEditingRecord(record);
        setErrors({});

        setForm({
            ...getDefaultForm(),
            ...buildSchemaDefaults(templateFields?.header || []),
            ...buildSchemaDefaults(templateFields?.headerChild || []),
            ...hydrateSchemaValues(templateFields?.header || [], record),
            ...hydrateSchemaValues(templateFields?.headerChild || [], finishedGood),
            voucherNumber: getVoucherNumber(record) || "ASP",
            voucherDate: formatDateForInput(record?.voucherDate),
            status: record?.status || "open",
            remarks: record?.remarks || "",
            warehouseCode: record?.warehouseCode || "",
            locationCode: record?.locationCode || "",
            customMasters: record?.customMasters || {},
            finishedGoodCustomMasters: finishedGood?.customMasters || {},

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

            const mainField =
                getSchemaField(templateFields?.headerChild || [], key) ||
                getSchemaField(templateFields?.header || [], key);

            let updated = {
                ...prev,
                [key]: finalValue,
            };

            updated = applyMappedFields(mainField, finalValue, updated);

            if (key === "productCode") {
                const selectedProduct = finishedGoodOptions.find((item: any) => String(item.value) === String(finalValue));
                const product = selectedProduct?.raw;
                const rate = finalValue ? getProductRate(product, "") : "";
                const amount = calculateAmount(updated.quantity, rate);
                updated.productHSNCode = product?.productHSNCode;
                updated.productDescription = product?.productDescription;
                updated.productCode = finalValue;
                updated.productName = finalValue ? getProductName(selectedProduct, product) : "";
                updated.productId = finalValue ? getProductId(product) : "";
                updated.unit = finalValue ? String(product?.unit || product?.uom || "") : "";
                updated.productType = finalValue ? String(product?.productType || product?.dynamicFields?.productType || "finishedgoods") : "";
                updated.availableQuantity = null;
                updated.rate = rate;
                updated.amount = amount;
                updated.productionCost = fmtMoney(amount);
                updated.totalFinishedCost = fmtMoney(amount);
            }

            if (key === "quantity" || key === "rate") {
                const quantity = key === "quantity" ? finalValue : updated.quantity;
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
                buildEmptyRawMaterialRow(),
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
                        : [buildEmptyRawMaterialRow()],
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const rawValue = getSelectedValue(value);
            const finalValue = isNumericField(key) ? sanitizeDecimal(rawValue) : rawValue;
            const updatedRawMaterials = [...(prev.rawMaterials || [])];
            const bodyField = getSchemaField(templateFields?.body || [], key);
            let updatedRow = { ...updatedRawMaterials[index], [key]: finalValue, };
            updatedRow = applyMappedFields(bodyField, finalValue, updatedRow);

            if (key === "productCode") {
                const selectedProduct = rawMaterialOptions.find(
                    (item: any) => String(item.value) === String(finalValue)
                );
                const product = selectedProduct?.raw;
                const rate = finalValue ? getProductRate(product, "") : "";

                updatedRow = {
                    ...updatedRow,
                    productCode: finalValue,
                    productName: finalValue ? getProductName(selectedProduct, product) : "",
                    productId: finalValue ? getProductId(product) : "",
                    unit: finalValue ? String(product?.unit || product?.uom || "") : "",
                    productHSNCode: product?.productHSNCode,
                    productDescription: product?.productDescription,
                    productType: finalValue ? String(product?.productType || product?.dynamicFields?.productType || "rawmaterial") : "",
                    availableQuantity: null,
                    rate,
                    amount: calculateAmount(updatedRow.quantity, rate),
                };
            }

            if (key === "quantity" || key === "rate") {
                const quantity = key === "quantity" ? finalValue : updatedRow.quantity;
                const rate = key === "rate" ? finalValue : updatedRow.rate;
                updatedRow = { ...updatedRow, amount: calculateAmount(quantity, rate), };
            }

            updatedRawMaterials[index] = updatedRow;
            return {
                ...prev,
                rawMaterials: updatedRawMaterials,
            };
        });

        if (key === "productCode") {
            const selectedProduct = rawMaterialOptions.find((item: any) => String(item.value) === String(getSelectedValue(value)));
            const product = selectedProduct?.raw || {};
            const productCode = String(getSelectedValue(value) || "");
            const productType = String(product?.productType || product?.dynamicFields?.productType || "rawmaterial");
            void loadRawMaterialAvailableQuantity(index, productCode, productType);
        }

        setErrors((prev: any) => ({
            ...prev,
            rawMaterials: "",
            [`row_${index}_${key}`]: "",
        }));
    };

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

        [...(templateFields?.header || []), ...(templateFields?.headerChild || [])].forEach((field: any) => {
            if (!field?.key || isTrueValue(field?.isHidden) || !field?.isRequired) return;
            const value = form?.[field.key];
            if ((value === "" || value === null || value === undefined) && !err[field.key]) {
                err[field.key] = `${field?.label || field.key} is required`;
            }
        });

        (form.rawMaterials || []).forEach((row: any, index: number) => {
            const hasAnyValue = row?.productCode || row?.quantity || row?.rate;
            if (!hasAnyValue) return;

            (templateFields?.body || []).forEach((field: any) => {
                if (!field?.key || isTrueValue(field?.isHidden) || !field?.isRequired) return;
                const value = row?.[field.key];
                const errorKey = `row_${index}_${field.key}`;
                if ((value === "" || value === null || value === undefined) && !err[errorKey]) {
                    err[errorKey] = `${field?.label || field.key} is required`;
                }
            });
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
        const dynamicHeaderFields = buildSchemaSectionPayload(templateFields?.header || [], form);
        const dynamicFinishedGoodFields = buildSchemaSectionPayload(templateFields?.headerChild || [], form);
        const headerCustomMasters = buildCustomMastersPayload(templateFields?.header || [], form, form?.customMasters || {});
        const finishedGoodCustomMasters = buildCustomMastersPayload(templateFields?.headerChild || [], form, form?.finishedGoodCustomMasters || {});

        const payload = {
            ...dynamicHeaderFields,
            voucherDate: form.voucherDate,
            status: form.status || "open",
            remarks: form.remarks || "",
            warehouseCode: String(form.warehouseCode || "").trim(),
            locationCode: String(form.locationCode || "").trim(),
            ...(Object.keys(headerCustomMasters).length ? { customMasters: headerCustomMasters } : {}),

            finishedGood: {
                ...dynamicFinishedGoodFields,
                productCode: form.productCode,
                productName: form.productName,
                productId: form.productId,
                unit: String(form.unit || ""),
                quantity: String(form.quantity),
                rate: String(form.rate),
                amount: fmtMoney(fgAmount),
                ...(Object.keys(finishedGoodCustomMasters).length ? { customMasters: finishedGoodCustomMasters } : {}),
            },

            rawMaterials: rawMaterials.map((item: any) => {
                const customMasters = buildCustomMastersPayload(templateFields?.body || [], item, item?.customMasters || {});

                return {
                    ...buildSchemaSectionPayload(templateFields?.body || [], item),
                    productCode: item.productCode,
                    productName: item.productName,
                    productId: item.productId,
                    unit: String(item.unit || ""),
                    quantity: String(item.quantity),
                    rate: String(item.rate),
                    amount: fmtMoney(item.amount),
                    remarks: String(item.remarks || "").trim(),
                    ...(Object.keys(customMasters).length ? { customMasters } : {}),
                };
            }),

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
            await dispatch(deleteAssemblyProduction({ assemblyProductionVoucherNumber: confirmTooltip.voucherNumber, }) as any).unwrap();
            toast.success("Assembly production deleted");
            fetchAssemblyProductions();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete assembly production");
        } finally {
            setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null });
        }
    };

    /* ===================================================
        DYNAMIC FORM STRUCTURE
    =================================================== */

    const fallbackInputData = {
        header: [
            { key: "voucherNumber", label: "Voucher No", type: "text", disabled: true },
            { key: "voucherDate", label: "Date", type: "date", isRequired: true },
            { key: "status", label: "Status", type: "select", isRequired: true, options: [{ label: "Open", value: "open" }, { label: "Close", value: "close" }] },
            { key: "remarks", label: "Remark", type: "textarea", isRequired: false, placeholder: "Enter Remark" },
        ],
        headerChild: [
            { key: "productCode", label: "Finished Good", type: "select", isRequired: true, placeholder: "Select Finished Good", options: finishedGoodOptions },
            { key: "quantity", label: "Finished Qty", type: "number", isRequired: true, placeholder: "Enter Quantity" },
            { key: "unit", label: "Unit", type: "select", isRequired: true, options: unitOptions },
            { key: "rate", label: "Finished Rate", type: "number", isRequired: true, placeholder: "Enter Rate" },
            { key: "amount", label: "Finished Amount", type: "number", disabled: true },
        ],
        body: [
            { key: "productCode", label: "Raw Material", type: "select", width: "260px", isRequired: true, placeholder: "Select Raw Material", options: rawMaterialOptions },
            { key: "unit", label: "Unit", type: "select", width: "120px", isRequired: true, options: unitOptions },
            { key: "quantity", label: "Qty", type: "number", width: "130px", isRequired: true },
            { key: "rate", label: "Rate", type: "number", width: "140px", isRequired: true },
            { key: "amount", label: "Amount", type: "number", width: "150px", disabled: true },
            { key: "remarks", label: "Remarks", type: "text", width: "200px", isRequired: false, placeholder: "Enter Remarks" },
        ],
        footer: [
            { key: "totalRawMaterialCost", label: "Raw Material Cost", value: money(totalRawMaterialCost) },
            { key: "productionCost", label: "Production Cost", value: money(form.productionCost) },
            { key: "finishedGoodAmount", label: "Finished Good Amount", value: money(finishedGoodAmount) },
            { key: "totalFinishedCost", label: "Total Finished Cost", value: money(totalFinishedCost) },
        ],
    };

    const hasApiSchema =
        (templateFields?.header || []).length > 0 ||
        (templateFields?.headerChild || []).length > 0 ||
        (templateFields?.body || []).length > 0 ||
        (templateFields?.footer || []).length > 0;

    const decorateSchemaField = (field: any, section: "header" | "finishedGood" | "body") => {
        const key = String(field?.key || "");

        if (key === "voucherNumber") return { ...field, disabled: true, isReadonly: true };
        if (key === "productCode") {
            return {
                ...field,
                type: "select",
                options: section === "finishedGood" ? finishedGoodOptions : section === "body" ? rawMaterialOptions : field?.options || [],
            };
        }
        if (key === "unit" || key === "uom") return { ...field, type: "select", options: unitOptions };
        if (key === "amount") return { ...field, disabled: true, isReadonly: true };
        if (key === "status" && (!Array.isArray(field?.options) || field.options.length === 0)) {
            return { ...field, options: [{ label: "Open", value: "open" }, { label: "Close", value: "close" }] };
        }

        return field;
    };

    const dynamicFooter = (templateFields?.footer || []).map((field: any) => {
        const key = String(field?.key || "");
        let rawValue = form?.[key] ?? field?.defaultValue ?? "";

        if (["totalRawMaterialCost", "rawMaterialCost"].includes(key)) rawValue = totalRawMaterialCost;
        if (key === "productionCost") rawValue = form.productionCost;
        if (["finishedGoodAmount", "finishedAmount"].includes(key)) rawValue = finishedGoodAmount;
        if (key === "totalFinishedCost") rawValue = totalFinishedCost;

        const fieldType = String(field?.type || "").toLowerCase();
        const isMoneyField =
            fieldType === "currency" ||
            fieldType === "amount" ||
            key.toLowerCase().includes("cost") ||
            key.toLowerCase().includes("amount");

        return { ...field, rawValue, value: isMoneyField ? money(rawValue || 0) : rawValue };
    });

    const inputData = hasApiSchema
        ? {
            header: (templateFields?.header || []).map((field: any) => decorateSchemaField(field, "header")),
            headerChild: (templateFields?.headerChild || []).map((field: any) => decorateSchemaField(field, "finishedGood")),
            body: (templateFields?.body || []).map((field: any) => decorateSchemaField(field, "body")),
            footer: dynamicFooter,
        }
        : fallbackInputData;

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
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
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
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
                                className="cursor-pointer rounded-lg p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-60"
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
                    contentLoading: fieldsLoading,
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