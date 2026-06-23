import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fmtMoney, formatDateForInput, formatDateForList, loadAllTemplateOptions, money, num, safePercent, todayYMD } from "../../../../utils/helperFunctions";
import { addPurchaseOrder, deletePurchaseOrder, getPurchaseOrderList, updatePurchaseOrder } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseOrder";
import { getAllTransactionSchema } from "../../../../redux/slices/professionalSlice/transactionSchema";
import Badge from "../../../../components/badge";
import Toggle from "../../../../components/toggle";
import SearchInput from "../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../components/buttons";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
import Permission from "../../../../components/PermissionGuard";

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

    productDescription: "",
    description: "",
    productHSNCode: "",

    remarks: "",

    quantity: "",

    uom: "",
    unit: "",
    unitName: "",

    rate: "",

    gross: 0,
    grossAmount: 0,

    discount: "",
    discountPercentage: "",
    discountAmount: 0,

    taxableAmount: 0,

    cgst: "",
    cgstPercentage: "",
    cgstAmount: 0,

    sgst: "",
    sgstPercentage: "",
    sgstAmount: 0,

    igst: "",
    igstPercentage: "",
    igstAmount: 0,

    taxAmount: 0,

    otherAmount: "",

    netAmount: 0,
    netTotal: 0,
};

const getDefaultForm = () => ({
    pOrdVoucherNumber: "AUTO",
    pOrdVoucherDate: todayYMD(),

    pOrdPurchaseAccount: "",

    pOrdVendorCode: "",
    pOrdVendorName: "",

    pOrdStatus: "open",

    pOrdRemark: "",
    pOrdStatusRemark: "",
    pOrdStatusHistory: [],
    isAutoPost: false,

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

/* ===================================================
   PURCHASE ORDER
=================================================== */

const PurchaseOrder = () => {
    const dispatch = useDispatch();

    const purchaseOrderState = useSelector(
        (state: any) => state.purchaseOrder
    );

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const purchaseOrders =
        purchaseOrderState?.purchaseOrders ||
        purchaseOrderState?.purchaseOrderList ||
        [];

    const pagination =
        purchaseOrderState?.pagination || defaultPagination;

    const loading =
        purchaseOrderState?.loading ||
        purchaseOrderState?.listingLoader ||
        false;

    const createLoading =
        purchaseOrderState?.createLoading ||
        purchaseOrderState?.addLoader ||
        false;

    const updateLoading =
        purchaseOrderState?.updateLoading || false;

    const deleteLoading =
        purchaseOrderState?.deleteLoading ||
        purchaseOrderState?.deleteLoader ||
        false;

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

    const [templateFields, setTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    const [fieldsLoading, setFieldsLoading] = useState(false);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });

    /* ===================================================
       FIELD HELPERS
    =================================================== */

    const getHeaderFieldByKey = (key: string) => {
        return templateFields?.header?.find(
            (field: any) => field.key === key
        );
    };

    const getBodyFieldByKey = (key: string) => {
        return templateFields?.body?.find(
            (field: any) => field.key === key
        );
    };

    const getOptionByValue = (field: any, selectedValue: any) => {
        return field?.options?.find(
            (opt: any) => String(opt.value) === String(selectedValue)
        );
    };

    const applyMappedFields = (
        field: any,
        selectedValue: any,
        oldData: any
    ) => {
        if (!field) return oldData;

        const selectedOption = getOptionByValue(field, selectedValue);

        const updated = {
            ...oldData,
            [field.key]: selectedValue,
        };

        if (field?.mapFields && selectedOption?.raw) {
            Object.entries(field.mapFields).forEach(
                ([targetKey, sourceKey]) => {
                    updated[targetKey] =
                        selectedOption.raw?.[sourceKey as string] ?? "";
                }
            );
        }

        return updated;
    };

    const hasValue = (value: any) =>
        value !== undefined && value !== null && value !== "";

    const fillProductDetailsFromSelectedOption = (
        row: any,
        selectedOption: any
    ) => {
        const product = selectedOption?.raw;
        if (!product) return row;

        const unitCode = product?.unit || row.unit || row.uom || "";
        const csgst = hasValue(product?.csgst) ? String(product.csgst) : "";
        const igst = hasValue(product?.igst) ? String(product.igst) : "";

        return {
            ...row,

            productId: product?._id || row.productId || "",
            productCode: product?.productCode || row.productCode || "",
            productName: product?.productName || row.productName || "",

            productDescription:
                product?.productDescription || row.productDescription || "",

            description:
                product?.productDescription || row.description || "",

            productHSNCode:
                product?.productHSNCode || row.productHSNCode || "",

            unit: unitCode,
            uom: unitCode,
            unitName: getUnitLabelFromSchema(unitCode),

            rate: hasValue(product?.purchasePrice)
                ? String(product.purchasePrice)
                : row.rate || "",

            cgst: csgst || row.cgst || "",
            cgstPercentage: csgst || row.cgstPercentage || "",

            igst: igst || row.igst || "",
            igstPercentage: igst || row.igstPercentage || "",
        };
    };



    const getUnitLabelFromSchema = (unitCode: string) => {
        const unitField = templateFields?.body?.find(
            (field: any) => field.key === "uom" || field.key === "unit"
        );

        const selectedUnit = unitField?.options?.find(
            (item: any) => String(item.value) === String(unitCode)
        );

        return selectedUnit?.label || unitCode || "";
    };

    const normalizeRowKeys = (row: any) => {
        const updated = { ...row };

        if (updated.uom && !updated.unit) {
            updated.unit = updated.uom;
        }

        if (updated.unit && !updated.uom) {
            updated.uom = updated.unit;
        }

        if (updated.productDescription && !updated.description) {
            updated.description = updated.productDescription;
        }

        if (updated.description && !updated.productDescription) {
            updated.productDescription = updated.description;
        }

        if (updated.netAmount && !updated.netTotal) {
            updated.netTotal = updated.netAmount;
        }

        if (updated.netTotal && !updated.netAmount) {
            updated.netAmount = updated.netTotal;
        }

        if (updated.gross && !updated.grossAmount) {
            updated.grossAmount = updated.gross;
        }

        if (updated.grossAmount && !updated.gross) {
            updated.gross = updated.grossAmount;
        }

        updated.unitName = getUnitLabelFromSchema(
            updated.unit || updated.uom
        );

        return updated;
    };

    /* ===================================================
       CALCULATIONS
    =================================================== */

    const calculateRow = (row: any) => {
        const quantity = num(row.quantity);
        const rate = num(row.rate);

        const gross = quantity * rate;

        const discountPercent = safePercent(
            row.discount !== undefined && row.discount !== null && row.discount !== ""
                ? row.discount
                : row.discountPercentage
        );

        const cgstPercent = safePercent(
            row.cgst !== undefined && row.cgst !== null && row.cgst !== ""
                ? row.cgst
                : row.cgstPercentage
        );

        const sgstPercent = safePercent(
            row.sgst !== undefined && row.sgst !== null && row.sgst !== ""
                ? row.sgst
                : row.sgstPercentage
        );

        const igstPercent = safePercent(
            row.igst !== undefined && row.igst !== null && row.igst !== ""
                ? row.igst
                : row.igstPercentage
        );

        const discountAmount = (gross * discountPercent) / 100;
        const taxableAmount = gross - discountAmount;

        const cgstAmount = (taxableAmount * cgstPercent) / 100;
        const sgstAmount = (taxableAmount * sgstPercent) / 100;
        const igstAmount = (taxableAmount * igstPercent) / 100;

        const otherAmount = num(row.otherAmount);

        const taxAmount = cgstAmount + sgstAmount + igstAmount;
        const netAmount = taxableAmount + taxAmount + otherAmount;

        return {
            ...row,

            // ✅ keep typed/input values as it is
            quantity: row.quantity,
            rate: row.rate,

            discount: row.discount,
            discountPercentage: row.discountPercentage,

            cgst: row.cgst,
            cgstPercentage: row.cgstPercentage,

            sgst: row.sgst,
            sgstPercentage: row.sgstPercentage,

            igst: row.igst,
            igstPercentage: row.igstPercentage,

            otherAmount: row.otherAmount,

            // ✅ calculated values
            gross,
            grossAmount: gross,

            discountAmount,
            taxableAmount,

            cgstAmount,
            sgstAmount,
            igstAmount,

            taxAmount,

            netAmount,
            netTotal: netAmount,

            unit: row.unit || row.uom || "",
            uom: row.uom || row.unit || "",

            description: row.description || row.productDescription || "",
            productDescription: row.productDescription || row.description || "",
        };
    };

    const calculateFooter = (products: any[]) => {
        return (products || []).reduce(
            (acc: any, item: any) => {
                acc.totalQuantity += num(item.quantity);

                acc.totalGrossAmount += num(item.grossAmount || item.gross);
                acc.totalDiscountAmount += num(item.discountAmount);

                acc.totalCgstAmount += num(item.cgstAmount);
                acc.totalSgstAmount += num(item.sgstAmount);
                acc.totalIgstAmount += num(item.igstAmount);

                acc.totalTaxAmount += num(item.taxAmount);
                acc.totalOtherAmount += num(item.otherAmount);

                acc.totalNetAmount += num(item.netAmount || item.netTotal);

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

    /* ===================================================
       API CALLS
    =================================================== */

    const fetchPurchaseOrders = async () => {
        await dispatch(
            getPurchaseOrderList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status: status,
            }) as any
        );
    };

    useEffect(() => {
        dispatch(getAllTransactionSchema("purchaseOrder") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchPurchaseOrders();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    /* ===================================================
       LOAD TRANSACTION SCHEMA WITH API OPTIONS
    =================================================== */

    useEffect(() => {
        const prepareFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema =
                Array.isArray(transactionsSchema?.header) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                setFieldsLoading(true);

                const updatedData =
                    await loadAllTemplateOptions(transactionsSchema);

                setTemplateFields(updatedData);
            } catch (error) {
                console.log("Failed to prepare template fields", error);
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    /* ===================================================
       LIST COLUMNS
    =================================================== */

    const columns = [
        {
            key: "pOrdVoucherNumber",
            title: "Voucher No",
        },
        {
            key: "pOrdVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.pOrdVoucherDate
                    ? formatDateForList(row.pOrdVoucherDate)
                    : "-",
        },
        {
            key: "pOrdVendorName",
            title: "Vendor",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.pOrdVendorName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {row?.pOrdVendorCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "pOrdBody",
            title: "Items",
            render: (row: any) => row?.pOrdBody?.length || 0,
        },

        {
            key: "pOrdFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.pOrdFooter?.netAmount || 0)}
                </span>
            ),
        },

        {
            key: "pOrdStatus",
            title: "Order Status",
            render: (row: any) => (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {row?.pOrdStatus || "-"}
                </span>
            ),
        },
    ];

    /* ===================================================
       ACTIONS
    =================================================== */

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchPurchaseOrders();
            toast.success("Purchase order list refreshed");
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
        const footer = record?.pOrdFooter || {};

        const products =
            record?.pOrdBody?.length > 0
                ? record.pOrdBody.map((item: any) => {
                    const unitCode = item?.unit || item?.uom || "";

                    return calculateRow(
                        normalizeRowKeys({
                            id: item?.id || Date.now() + Math.random(),

                            productCode: item?.productCode || "",
                            productName: item?.productName || "",
                            productId: item?.productId || "",

                            productDescription:
                                item?.productDescription ||
                                item?.description ||
                                "",

                            description:
                                item?.description ||
                                item?.productDescription ||
                                "",

                            productHSNCode: item?.productHSNCode || "",

                            remarks: item?.remarks || "",

                            quantity: item?.quantity || "",

                            unit: unitCode,
                            uom: unitCode,
                            unitName:
                                item?.unitName ||
                                getUnitLabelFromSchema(unitCode),

                            rate: item?.rate || "",

                            gross: item?.gross || item?.grossAmount || 0,
                            grossAmount:
                                item?.grossAmount || item?.gross || 0,

                            discount:
                                item?.discount ||
                                item?.discountPercentage ||
                                "",

                            discountPercentage:
                                item?.discountPercentage ||
                                item?.discount ||
                                "",

                            discountAmount: item?.discountAmount || 0,

                            taxableAmount: item?.taxableAmount || 0,

                            cgst:
                                item?.csgst ||
                                item?.cgstPercentage ||
                                "",

                            cgstPercentage:
                                item?.cgstPercentage ||
                                item?.cgst ||
                                "",

                            cgstAmount: item?.cgstAmount || 0,

                            sgst:
                                item?.sgst ||
                                item?.sgstPercentage ||
                                "",

                            sgstPercentage:
                                item?.sgstPercentage ||
                                item?.sgst ||
                                "",

                            sgstAmount: item?.sgstAmount || 0,

                            igst:
                                item?.igst ||
                                item?.igstPercentage ||
                                "",

                            igstPercentage:
                                item?.igstPercentage ||
                                item?.igst ||
                                "",

                            igstAmount: item?.igstAmount || 0,

                            taxAmount: item?.taxAmount || 0,

                            otherAmount: item?.otherAmount || 0,

                            netAmount:
                                item?.netAmount ||
                                item?.netTotal ||
                                0,

                            netTotal:
                                item?.netTotal ||
                                item?.netAmount ||
                                0,
                        })
                    );
                })
                : [{ ...emptyProductRow, id: Date.now() }];

        setEditingRecord(true);
        setErrors({});

        setForm({
            pOrdVoucherNumber: record?.pOrdVoucherNumber || "AUTO",

            pOrdVoucherDate: formatDateForInput(
                record?.pOrdVoucherDate
            ),

            pOrdVendorCode: record?.pOrdVendorCode || "",
            pOrdVendorName: record?.pOrdVendorName || "",

            pOrdPurchaseAccount: record?.pOrdPurchaseAccount || "",

            pOrdStatus: record?.pOrdStatus || "open",

            pOrdRemark: record?.pOrdRemark || "",
            pOrdStatusRemark: record?.pOrdStatusRemark || "",
            pOrdStatusHistory: record?.pOrdStatusHistory || [],

            isAutoPost: record?.isAutoPost || false,

            products,

            grossAmount:
                footer?.grossAmount || footer?.totalGrossAmount || "0.00",

            discountAmount:
                footer?.discountAmount ||
                footer?.totalDiscountAmount ||
                "0.00",

            cgstAmount:
                footer?.cgstAmount || footer?.totalCgstAmount || "0.00",

            sgstAmount:
                footer?.sgstAmount || footer?.totalSgstAmount || "0.00",

            igstAmount:
                footer?.igstAmount || footer?.totalIgstAmount || "0.00",

            taxAmount:
                footer?.taxAmount || footer?.totalTaxAmount || "0.00",

            otherAmount:
                footer?.otherAmount ||
                footer?.totalOtherAmount ||
                "0.00",

            netAmount:
                footer?.netAmount || footer?.totalNetAmount || "0.00",
        });

        setShowModal(true);
    };

    /* ===================================================
       DYNAMIC HEADER CHANGE
    =================================================== */

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const currentField = getHeaderFieldByKey(key);

            let updated = {
                ...prev,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updated = applyMappedFields(currentField, value, updated);
            }

            return updated;
        });

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    /* ===================================================
       DYNAMIC BODY ROW CHANGE
    =================================================== */

    const handleAddRow = () => {
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
            const updatedProducts = (prev.products || []).filter(
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

            const currentRow = updatedProducts[index] || {};
            const currentField = getBodyFieldByKey(key);

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            // ✅ Existing dynamic mapFields support
            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(
                    currentField,
                    value,
                    updatedRow
                );
            }

            const selectedOption = getOptionByValue(currentField, value);

            // ✅ When product is selected, prefill all product master details
            const lowerKey = String(key).toLowerCase();

            const isProductField =
                lowerKey === "productcode" ||
                lowerKey === "productname" ||
                lowerKey === "productid" ||
                lowerKey === "product";

            if (isProductField && selectedOption?.raw) {
                updatedRow = fillProductDetailsFromSelectedOption(
                    updatedRow,
                    selectedOption
                );
            }

            updatedRow = normalizeRowKeys(updatedRow);

            const isCgst =
                lowerKey === "cgst" || lowerKey === "cgstpercentage";

            const isSgst =
                lowerKey === "sgst" || lowerKey === "sgstpercentage";

            const isIgst =
                lowerKey === "igst" || lowerKey === "igstpercentage";

            // ✅ CGST/SGST selected manually, so clear IGST
            if ((isCgst || isSgst) && num(value) > 0) {
                updatedRow.igst = "";
                updatedRow.igstPercentage = "";
                updatedRow.igstAmount = 0;
            }

            // ✅ IGST selected manually, so clear CGST/SGST
            if (isIgst && num(value) > 0) {
                updatedRow.cgst = "";
                updatedRow.sgst = "";
                updatedRow.cgstPercentage = "";
                updatedRow.sgstPercentage = "";
                updatedRow.cgstAmount = 0;
                updatedRow.sgstAmount = 0;
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
            [`row_${index}_igstPercentage`]: "",
            [`row_${index}_cgstPercentage`]: "",
            [`row_${index}_sgstPercentage`]: "",
            [`row_${index}_igst`]: "",
            [`row_${index}_cgst`]: "",
            [`row_${index}_sgst`]: "",
        }));
    };

    /* ===================================================
       DYNAMIC VALIDATION
    =================================================== */

    const getFilledRows = () => {
        const bodyKeys = (templateFields?.body || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => field.key);

        return (form.products || []).filter((row: any) => {
            return bodyKeys.some((key: string) => {
                const value = row?.[key];
                return value !== undefined && value !== null && value !== "";
            });
        });
    };

    const validateForm = () => {
        const err: any = {};

        (templateFields?.header || []).forEach((field: any) => {
            if (field.isHidden) return;
            if (!field.isRequired) return;

            const value = form?.[field.key];

            if (value === undefined || value === null || value === "") {
                err[field.key] = `${field.label || field.key} is required`;
            }
        });

        const filledRows = getFilledRows();

        if (filledRows.length === 0) {
            err.products = "Please add at least one product";
        }

        (form.products || []).forEach((row: any, index: number) => {
            const hasAnyValue = (templateFields?.body || []).some(
                (field: any) => {
                    const value = row?.[field.key];

                    return (
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                    );
                }
            );

            if (!hasAnyValue) return;

            (templateFields?.body || []).forEach((field: any) => {
                if (field.isHidden) return;
                if (!field.isRequired) return;

                const value = row?.[field.key];

                if (
                    value === undefined ||
                    value === null ||
                    value === ""
                ) {
                    err[`row_${index}_${field.key}`] = `${field.label || field.key
                        } is required`;
                }
            });

            const cgst = num(row.cgstPercentage || row.cgst);
            const sgst = num(row.sgstPercentage || row.sgst);
            const igst = num(row.igstPercentage || row.igst);

            if (igst > 0 && (cgst > 0 || sgst > 0)) {
                err[`row_${index}_tax`] =
                    "You can enter either IGST or CGST/SGST";

                err[`row_${index}_igstPercentage`] =
                    "Only one tax type allowed";
                err[`row_${index}_cgstPercentage`] =
                    "Only one tax type allowed";
                err[`row_${index}_sgstPercentage`] =
                    "Only one tax type allowed";

                err[`row_${index}_igst`] = "Only one tax type allowed";
                err[`row_${index}_cgst`] = "Only one tax type allowed";
                err[`row_${index}_sgst`] = "Only one tax type allowed";
            }
        });

        setErrors(err);

        if (err.products) {
            toast.error(err.products);
        }

        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        const bodyKeys = (templateFields?.body || []).map(
            (field: any) => field.key
        );

        return (form.products || [])
            .filter((row: any) => {
                return bodyKeys.some((key: string) => {
                    const value = row?.[key];

                    return (
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                    );
                });
            })
            .map((row: any) => calculateRow(normalizeRowKeys(row)));
    };

    /* ===================================================
       SUBMIT
    =================================================== */

    const getTaxValue = (primary: any, fallback: any) => {
        return primary !== undefined && primary !== null && primary !== ""
            ? primary
            : fallback !== undefined && fallback !== null
                ? fallback
                : "";
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const footer = calculateFooter(products);

        const payload: any = {
            pOrdVoucherDate: form.pOrdVoucherDate,

            pOrdVendorCode: form.pOrdVendorCode,
            pOrdVendorName: form.pOrdVendorName,

            pOrdPurchaseAccount: form.pOrdPurchaseAccount,

            pOrdStatus: form.pOrdStatus || "open",

            pOrdRemark: form.pOrdRemark,

            pOrdBody: products.map((item: any) => ({
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,

                productDescription:
                    item.productDescription || item.description,

                description:
                    item.description || item.productDescription,

                productHSNCode: item.productHSNCode,

                remarks: item.remarks,

                quantity: String(item.quantity),

                unit: item.unit || item.uom,
                uom: item.uom || item.unit,

                rate: String(item.rate),

                gross: fmtMoney(item.grossAmount),
                grossAmount: fmtMoney(item.grossAmount),

                discount: String(
                    item.discountPercentage || item.discount || ""
                ),

                discountPercentage: String(
                    item.discountPercentage || item.discount || ""
                ),

                discountAmount: fmtMoney(item.discountAmount),

                taxableAmount: fmtMoney(item.taxableAmount),

                cgst: String(getTaxValue(item.cgst, item.cgstPercentage)),
                cgstPercentage: String(getTaxValue(item.cgstPercentage, item.cgst)),

                sgst: String(getTaxValue(item.sgst, item.sgstPercentage)),
                sgstPercentage: String(getTaxValue(item.sgstPercentage, item.sgst)),

                igst: String(getTaxValue(item.igst, item.igstPercentage)),
                igstPercentage: String(getTaxValue(item.igstPercentage, item.igst)),
                igstAmount: fmtMoney(item.igstAmount),

                taxAmount: fmtMoney(item.taxAmount),

                otherAmount: fmtMoney(item.otherAmount),

                netAmount: fmtMoney(item.netAmount || item.netTotal),
                netTotal: fmtMoney(item.netTotal || item.netAmount),
            })),

            pOrdFooter: {
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
                totalDiscountAmount: fmtMoney(
                    footer.totalDiscountAmount
                ),
                totalCgstAmount: fmtMoney(footer.totalCgstAmount),
                totalSgstAmount: fmtMoney(footer.totalSgstAmount),
                totalIgstAmount: fmtMoney(footer.totalIgstAmount),
                totalTaxAmount: fmtMoney(footer.totalTaxAmount),
                totalOtherAmount: fmtMoney(footer.totalOtherAmount),
                totalNetAmount: fmtMoney(footer.totalNetAmount),
            },
        };

        try {
            if (editingRecord) {
                await dispatch(
                    updatePurchaseOrder({
                        pOrdVoucherNumber: form?.pOrdVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                toast.success("Purchase order updated successfully");
            } else {
                await dispatch(addPurchaseOrder({ payload }) as any).unwrap();

                toast.success("Purchase order created successfully");
            }

            setShowModal(false);
            resetMainForm();

            fetchPurchaseOrders();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;

            if (!voucherNumber) {
                toast.error("Purchase order voucher number not found");
                return;
            }

            await dispatch(
                deletePurchaseOrder({
                    pOrdVoucherNumber: voucherNumber,
                }) as any
            ).unwrap();

            toast.success("Purchase order deleted successfully");

            await fetchPurchaseOrders();
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.payload?.message ||
                "Failed to delete purchase order"
            );
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
       DYNAMIC FOOTER
    =================================================== */

    const footerValues = useMemo(() => {
        return {
            grossAmount,
            discountAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            netAmount,
            adjustedAmount: 0,
            balanceAmount: netAmount,
        };
    }, [
        grossAmount,
        discountAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        netAmount,
    ]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => {
                const rawValue =
                    footerValues[field.key as keyof typeof footerValues] ?? 0;

                return {
                    ...field,
                    value: money(rawValue),
                    rawValue,
                };
            });
    }, [templateFields?.footer, footerValues]);


    const isClosedPurchaseOrder = (record: any) => {
        const pOrdStatus = String(
            record?.pOrdStatus || ""
        ).toLowerCase();

        return pOrdStatus === "close" || pOrdStatus === "closed";
    };

    const handleEditPurOrder = (record: any) => {
        if (isClosedPurchaseOrder(record)) {
            toast.error("You can't edit closed Order");
            return;
        }

        openEditModal(record);
    };

    const handleDeletePurOrderClick = (e: any, record: any) => {
        if (isClosedPurchaseOrder(record)) {
            toast.error("You can't delete closed Order");
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        let x = rect.left - 150;

        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({
            show: true,
            x,
            y,
            voucherNumber: record?.pOrdVoucherNumber,
        });
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div
                id="purchase-order-header"
                className="mb-3 flex items-center"
            >
                <div
                    id="purchase-order-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Purchase Orders:",
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

                    <Permission module="bookez" permissionKey="purchaseOrder" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openAddModal,
                                text: "Add Purchase Order",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={purchaseOrders}
                loading={loading}
                emptyMessage={`No ${status} purchase order found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <Permission module="bookez" permissionKey="purchaseOrder" action="update">
                            {/* <button
                                id="purchase-order-edit-button"
                                onClick={() => openEditModal(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button> */}

                            <button id="purchase-order-edit-button"
                                onClick={() => handleEditPurOrder(record)}
                                className={`rounded-md p-2 hover:bg-primary/10 transition-all duration-200 cursor-pointer text-primary hover:bg-primary/10 hover:text-primary ${isClosedPurchaseOrder(record)

                                    }`}
                            >                            <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="purchaseOrder" action="delete">
                            {/* <button
                                id="purchase-order-delete-button"
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
                                        voucherNumber: record?.pOrdVoucherNumber,
                                    });
                                }}
                                className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                            </button> */}

                            <button
                                id="purchase-order-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => handleDeletePurOrderClick(e, record)}
                                className={`rounded-md p-2 hover:bg-primary/10 transition-all duration-200 disabled:opacity-50 cursor-pointer text-danger hover:bg-danger/10 hover:text-danger ${isClosedPurchaseOrder
                                    (record)
                                    }`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </Permission>
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
                    message="Are you sure you want to delete this purchase order?"
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

            {!fieldsLoading && (
                <DynamicAddForm
                    {...{
                        show: showModal,
                        setShow: setShowModal,
                        edit: Boolean(editingRecord),
                        title: "Purchase Order",
                        subtitle: "Fill in the purchase order details below",
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
                        footerTotals,

                        // dynamic schema with options
                        inputData: {
                            ...templateFields,
                            footer: dynamicFooterArray,
                        },

                        bodyKey: "products",
                        handleChange: handleMainChange,
                    }}
                />
            )}
        </div>
    );
};

export default PurchaseOrder;