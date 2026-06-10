import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
    fmtMoney,
    formatDateForInput,
    formatDateForList,
    money,
    num,
    safePercent,
    todayYMD,
} from "../../../../utils/helperFunctions";

import professionalAxios from "../../../../services/professionalAxios";
import { getAllTransactionSchema } from "../../../../redux/slices/professionalSlice/transactionSchema";

import Badge from "../../../../components/badge";
import Toggle from "../../../../components/toggle";
import SearchInput from "../../../../components/searchInput";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
import Modal from "../../../../components/modal";

import {
    addGrn,
    deleteGrn,
    getGrnList,
    updateGrn,
} from "../../../../redux/slices/professionalSlice/purchaseWorkflow/grnSlice";

import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../components/buttons";

import { getPurchaseOrderList } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseOrder";
import ModulePageSkeleton, {
    ModalListSkeleton,
} from "../../../../components/skeleton/SkeletonLoader";

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

    acceptedQuantity: "",
    rejectedQuantity: "0",
    rejectedReason: "",

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
    grnVoucherNumber: "AUTO",
    grnVoucherDate: todayYMD(),

    pOrdVoucherNumber: "",

    grnVendorCode: "",
    grnVendorName: "",

    grnStatus: "open",

    grnRemark: "",
    grnStatusRemark: "",
    grnStatusHistory: [],
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
   COMMON RECORD EXTRACTOR
=================================================== */

const getRecords = (res: any) => {
    return Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.records)
            ? res.records
            : Array.isArray(res?.docs)
                ? res.docs
                : Array.isArray(res?.data?.items)
                    ? res.data.items
                    : Array.isArray(res?.data?.records)
                        ? res.data.records
                        : Array.isArray(res?.data?.docs)
                            ? res.data.docs
                            : Array.isArray(res?.data)
                                ? res.data
                                : Array.isArray(res)
                                    ? res
                                    : [];
};

/* ===================================================
   LOAD OPTIONS FOR FIELDS HAVING api KEY
=================================================== */

export const loadFieldOptions = async (fields: any[]) => {
    const updatedFields = await Promise.all(
        (fields || []).map(async (field) => {
            if (!field?.api) return field;

            try {
                const res = await professionalAxios.get(
                    `/eTaxSolnMongoApiBackend${field.api}`,
                    {
                        params: field.queryParams || {},
                    }
                );

                const records = getRecords(res.data);

                const options = Array.isArray(records)
                    ? records.map((item: any) => ({
                        label: item?.[field.labelField] || "",
                        value: item?.[field.valueField] || "",
                        raw: item,
                    }))
                    : [];

                return {
                    ...field,
                    options,
                };
            } catch (error) {
                console.log(`Failed to load options for ${field.key}`, error);

                return {
                    ...field,
                    options: [],
                };
            }
        })
    );

    return updatedFields;
};

const rejectedReasonOptions = [
    { label: "Damaged Product", value: "Damaged Product" },
    { label: "Wrong Item Received", value: "Wrong Item Received" },
    { label: "Quality Mismatch", value: "Quality Mismatch" },
    { label: "Poor Quality / Defective", value: "Poor Quality / Defective" },
    { label: "Expired Product", value: "Expired Product" },
    { label: "Packaging Damaged", value: "Packaging Damaged" },
    { label: "Specification Mismatch", value: "Specification Mismatch" },
    { label: "Duplicate Delivery", value: "Duplicate Delivery" },
    { label: "Other", value: "Other" },
];

const injectGrnBodyFields = (bodyFields: any[] = []) => {
    const quantityIndex = bodyFields.findIndex(
        (field: any) => field.key === "quantity"
    );

    if (quantityIndex === -1) return bodyFields;

    const alreadyAdded = bodyFields.some(
        (field: any) => field.key === "acceptedQuantity"
    );

    const bodyWithoutQuantity = bodyFields.filter(
        (field: any) => field.key !== "quantity"
    );

    if (alreadyAdded) {
        return bodyWithoutQuantity;
    }

    const extraFields = [
        {
            key: "acceptedQuantity",
            label: "Accepted Quantity",
            type: "number",
            inputType: "number",
            isRequired: true,
            isHidden: false,
        },
        {
            key: "rejectedQuantity",
            label: "Rejected Quantity",
            type: "number",
            inputType: "number",
            isRequired: false,
            isHidden: false,
        },
        {
            key: "rejectedReason",
            label: "Rejected Reason",
            type: "select",
            inputType: "select",
            isRequired: false,
            isHidden: false,
            options: rejectedReasonOptions,
        },
    ];

    const insertIndex = Math.max(quantityIndex, 0);

    const updatedBody = [...bodyWithoutQuantity];

    updatedBody.splice(insertIndex, 0, ...extraFields);

    return updatedBody;
};

/* ===================================================
   LOAD OPTIONS FOR HEADER BODY FOOTER
=================================================== */

const loadAllTemplateOptions = async (templateData: any) => {
    const [updatedHeader, updatedBody, updatedFooter] = await Promise.all([
        loadFieldOptions(templateData?.header || []),
        loadFieldOptions(templateData?.body || []),
        loadFieldOptions(templateData?.footer || []),
    ]);

    return {
        ...templateData,
        header: updatedHeader,
        body: injectGrnBodyFields(updatedBody),
        footer: updatedFooter,
    };
};

/* ===================================================
   GRN
=================================================== */

const Grn = () => {
    const dispatch = useDispatch();

    const grnState = useSelector((state: any) => state.grn);
    const purchaseOrderState = useSelector((state: any) => state.purchaseOrder);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const grns =
        grnState?.grns ||
        grnState?.grnList ||
        grnState?.grnRecords ||
        grnState?.grnData ||
        [];

    const purchaseOrders =
        purchaseOrderState?.purchaseOrders ||
        purchaseOrderState?.purchaseOrderList ||
        purchaseOrderState?.purchaseOrderRecords ||
        purchaseOrderState?.purchaseOrderData ||
        purchaseOrderState?.purchaseOrdersData ||
        [];

    const purchaseOrderLoading =
        purchaseOrderState?.loading ||
        purchaseOrderState?.listingLoader ||
        purchaseOrderState?.listLoading ||
        false;

    const pagination = grnState?.pagination || defaultPagination;

    const loading =
        grnState?.loading ||
        grnState?.listingLoader ||
        false;

    const createLoading =
        grnState?.createLoading ||
        grnState?.addLoader ||
        false;

    const updateLoading = grnState?.updateLoading || false;

    const deleteLoading =
        grnState?.deleteLoading ||
        grnState?.deleteLoader ||
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

    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const [purchaseOrderSearch, setPurchaseOrderSearch] = useState("");
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);

    // ✅ Local modal loading states to stop blinking
    const [purchaseOrderModalLoading, setPurchaseOrderModalLoading] =
        useState(false);
    const [purchaseOrderLoaded, setPurchaseOrderLoaded] = useState(false);

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

    const getFinalQuantity = (row: any) => {
        const originalQuantity = num(row.quantity);
        const acceptedQuantity = num(row.acceptedQuantity);
        const rejectedQuantity = num(row.rejectedQuantity);

        return originalQuantity > 0
            ? originalQuantity
            : acceptedQuantity + rejectedQuantity;
    };

    const calculateRow = (row: any) => {
        const finalQuantity = getFinalQuantity(row);
        const rate = num(row.rate);

        const gross = finalQuantity * rate;

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

            quantity: finalQuantity ? String(finalQuantity) : row.quantity,
            rate: row.rate,

            acceptedQuantity:
                row.acceptedQuantity !== undefined &&
                    row.acceptedQuantity !== null &&
                    row.acceptedQuantity !== ""
                    ? row.acceptedQuantity
                    : row.quantity || "",

            rejectedQuantity:
                row.rejectedQuantity !== undefined &&
                    row.rejectedQuantity !== null &&
                    row.rejectedQuantity !== ""
                    ? row.rejectedQuantity
                    : "0",

            rejectedReason: row.rejectedReason || "",

            discount: row.discount,
            discountPercentage: row.discountPercentage,

            cgst: row.cgst,
            cgstPercentage: row.cgstPercentage,

            sgst: row.sgst,
            sgstPercentage: row.sgstPercentage,

            igst: row.igst,
            igstPercentage: row.igstPercentage,

            otherAmount: row.otherAmount,

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
                acc.totalQuantity += getFinalQuantity(item);

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

    const fetchGrns = async () => {
        await dispatch(
            getGrnList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status,
            }) as any
        );
    };

    const fetchPurchaseOrders = async (searchText = "") => {
        setPurchaseOrderModalLoading(true);

        try {
            await dispatch(
                getPurchaseOrderList({
                    offset: 0,
                    limit: 20,
                    search: searchText,
                    status: "open",
                }) as any
            ).unwrap();

            setPurchaseOrderLoaded(true);
        } catch (error) {
            setPurchaseOrderLoaded(true);
            toast.error("Failed to load purchase orders");
        } finally {
            setPurchaseOrderModalLoading(false);
        }
    };

    /*
       After creating/updating GRN from Purchase Order:
       - Check pending GRN quantity from analysis API
       - If pending quantity is 0, close Purchase Order
       - If pending quantity is still available, keep Purchase Order open
       - Because PO modal loads only open POs, closed PO will disappear from list
    */
    const syncPurchaseOrderStatusAfterGrn = async (pOrdVoucherNumber: string) => {
        if (!pOrdVoucherNumber) return "";

        try {
            const summaryRes = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/analysis/grn/byPurchaseOrderVoucherNumber/${pOrdVoucherNumber}`
            );

            const summary =
                summaryRes?.data?.data?.summary ||
                summaryRes?.data?.summary ||
                {};

            const pendingRaw = summary?.totalPendingGrnQuantity;

            if (
                pendingRaw === undefined ||
                pendingRaw === null ||
                pendingRaw === ""
            ) {
                console.log(
                    "GRN analysis summary missing totalPendingGrnQuantity",
                    summaryRes?.data
                );
                return "";
            }

            const totalPendingGrnQuantity = num(pendingRaw);

            const nextPoStatus =
                totalPendingGrnQuantity === 0 ? "close" : "open";

            await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseOrder/update/${pOrdVoucherNumber}`,
                {
                    pOrdStatus: nextPoStatus,
                }
            );

            return nextPoStatus;
        } catch (error) {
            console.log("Failed to sync Purchase Order status after GRN", error);
            toast.error("GRN saved but failed to update purchase order status");
            return "";
        }
    };

    useEffect(() => {
        dispatch(getAllTransactionSchema("grn") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchGrns();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!showPurchaseOrderModal) return;
        if (!purchaseOrderLoaded) return;

        const timer = setTimeout(() => {
            fetchPurchaseOrders(purchaseOrderSearch.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [purchaseOrderSearch]);

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
            key: "grnVoucherNumber",
            title: "Voucher No",
        },
        {
            key: "grnVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.grnVoucherDate
                    ? formatDateForList(row.grnVoucherDate)
                    : "-",
        },
        {
            key: "grnVendorName",
            title: "Vendor",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">
                        {row?.grnVendorName || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                        {row?.grnVendorCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "grnBody",
            title: "Items",
            render: (row: any) => row?.grnBody?.length || 0,
        },
        {
            key: "grnFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-indigo-700">
                    {money(row?.grnFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "grnStatus",
            title: "GRN Status",
            render: (row: any) => (
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700">
                    {row?.grnStatus || "-"}
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
            await fetchGrns();
            toast.success("GRN list refreshed");
        } finally {
            setRefreshing(false);
        }
    };

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
    };

    const openAddModal = async () => {
        resetMainForm();
        setSelectedPurchaseOrder(null);
        setPurchaseOrderSearch("");
        setPurchaseOrderLoaded(false);

        setShowPurchaseOrderModal(true);

        await fetchPurchaseOrders("");
    };

    const handlePurchaseOrderSelect = (purchaseOrder: any) => {
        setSelectedPurchaseOrder(purchaseOrder);
    };

    const buildGrnProductRow = (item: any) => {
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

                acceptedQuantity:
                    item?.acceptedQuantity !== undefined &&
                        item?.acceptedQuantity !== null &&
                        item?.acceptedQuantity !== ""
                        ? item.acceptedQuantity
                        : item?.quantity || "",

                rejectedQuantity:
                    item?.rejectedQuantity !== undefined &&
                        item?.rejectedQuantity !== null &&
                        item?.rejectedQuantity !== ""
                        ? item.rejectedQuantity
                        : "0",

                rejectedReason: item?.rejectedReason || "",

                unit: unitCode,
                uom: unitCode,
                unitName:
                    item?.unitName ||
                    getUnitLabelFromSchema(unitCode),

                rate: item?.rate || "",

                gross: item?.gross || item?.grossAmount || 0,
                grossAmount: item?.grossAmount || item?.gross || 0,

                discount: item?.discount || item?.discountPercentage || "",
                discountPercentage:
                    item?.discountPercentage || item?.discount || "",
                discountAmount: item?.discountAmount || 0,

                taxableAmount: item?.taxableAmount || 0,

                cgst: item?.cgst || item?.cgstPercentage || "",
                cgstPercentage: item?.cgstPercentage || item?.cgst || "",
                cgstAmount: item?.cgstAmount || 0,

                sgst: item?.sgst || item?.sgstPercentage || "",
                sgstPercentage: item?.sgstPercentage || item?.sgst || "",
                sgstAmount: item?.sgstAmount || 0,

                igst: item?.igst || item?.igstPercentage || "",
                igstPercentage: item?.igstPercentage || item?.igst || "",
                igstAmount: item?.igstAmount || 0,

                taxAmount: item?.taxAmount || 0,
                otherAmount: item?.otherAmount || 0,

                netAmount: item?.netAmount || item?.netTotal || 0,
                netTotal: item?.netTotal || item?.netAmount || 0,
            })
        );
    };

    const handlePurchaseOrderModalClose = () => {
        setShowPurchaseOrderModal(false);
        setSelectedPurchaseOrder(null);
        setPurchaseOrderSearch("");
        setPurchaseOrderLoaded(false);
        setPurchaseOrderModalLoading(false);

        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
        setShowModal(true);
    };

    const handlePurchaseOrderConfirm = () => {
        if (!selectedPurchaseOrder) {
            toast.error("Please select purchase order");
            return;
        }

        const poBody = selectedPurchaseOrder?.pOrdBody || [];

        const products =
            poBody.length > 0
                ? poBody.map((item: any) => buildGrnProductRow(item))
                : [{ ...emptyProductRow, id: Date.now() }];

        setForm({
            ...getDefaultForm(),

            pOrdVoucherNumber: selectedPurchaseOrder?.pOrdVoucherNumber || "",

            grnVendorCode: selectedPurchaseOrder?.pOrdVendorCode || "",
            grnVendorName: selectedPurchaseOrder?.pOrdVendorName || "",

            products,
        });

        setErrors({});
        setEditingRecord(null);
        setShowPurchaseOrderModal(false);
        setPurchaseOrderLoaded(false);
        setPurchaseOrderModalLoading(false);
        setShowModal(true);
    };

    const openEditModal = (record: any) => {
        const footer = record?.grnFooter || {};

        const products =
            record?.grnBody?.length > 0
                ? record.grnBody.map((item: any) => buildGrnProductRow(item))
                : [{ ...emptyProductRow, id: Date.now() }];

        setEditingRecord(true);
        setErrors({});

        setForm({
            grnVoucherNumber: record?.grnVoucherNumber || "AUTO",

            grnVoucherDate: formatDateForInput(record?.grnVoucherDate),

            pOrdVoucherNumber: record?.pOrdVoucherNumber || "",

            grnVendorCode: record?.grnVendorCode || "",
            grnVendorName: record?.grnVendorName || "",

            grnStatus: record?.grnStatus || "open",

            grnRemark: record?.grnRemark || "",
            grnStatusRemark: record?.grnStatusRemark || "",
            grnStatusHistory: record?.grnStatusHistory || [],

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

            const isPurchaseOrderGrn = Boolean(prev?.pOrdVoucherNumber);

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            updatedRow = normalizeRowKeys(updatedRow);

            if (key === "acceptedQuantity") {
                const originalQuantity = num(updatedRow.quantity);
                const acceptedQuantity = num(value);
                const rejectedQuantity = num(updatedRow.rejectedQuantity);

                if (
                    isPurchaseOrderGrn &&
                    originalQuantity > 0 &&
                    acceptedQuantity > originalQuantity
                ) {
                    updatedRow.acceptedQuantity = updatedRow.quantity || "";
                    toast.error("Accepted quantity cannot be greater than quantity");
                }

                if (isPurchaseOrderGrn && originalQuantity > 0) {
                    updatedRow.rejectedQuantity = Math.max(
                        originalQuantity - num(updatedRow.acceptedQuantity),
                        0
                    ).toString();
                }

                if (!isPurchaseOrderGrn) {
                    updatedRow.quantity = String(acceptedQuantity + rejectedQuantity);
                }

                if (num(updatedRow.rejectedQuantity) === 0) {
                    updatedRow.rejectedReason = "";
                }
            }

            if (key === "rejectedQuantity") {
                const originalQuantity = num(updatedRow.quantity);
                const rejectedQuantity = num(value);
                const acceptedQuantity = num(updatedRow.acceptedQuantity);

                if (
                    isPurchaseOrderGrn &&
                    originalQuantity > 0 &&
                    rejectedQuantity > originalQuantity
                ) {
                    updatedRow.rejectedQuantity = "0";
                    toast.error("Rejected quantity cannot be greater than quantity");
                }

                if (isPurchaseOrderGrn && originalQuantity > 0) {
                    updatedRow.acceptedQuantity = Math.max(
                        originalQuantity - num(updatedRow.rejectedQuantity),
                        0
                    ).toString();
                }

                if (!isPurchaseOrderGrn) {
                    updatedRow.quantity = String(acceptedQuantity + rejectedQuantity);
                }

                if (num(updatedRow.rejectedQuantity) === 0) {
                    updatedRow.rejectedReason = "";
                }
            }

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(
                    currentField,
                    value,
                    updatedRow
                );
            }

            const selectedOption = getOptionByValue(currentField, value);

            if (selectedOption?.raw?._id && !updatedRow.productId) {
                updatedRow.productId = selectedOption.raw._id;
            }

            updatedRow = normalizeRowKeys(updatedRow);

            const lowerKey = String(key).toLowerCase();

            const isCgst = lowerKey === "cgst" || lowerKey === "cgstpercentage";
            const isSgst = lowerKey === "sgst" || lowerKey === "sgstpercentage";
            const isIgst = lowerKey === "igst" || lowerKey === "igstpercentage";

            if ((isCgst || isSgst) && num(value) > 0) {
                updatedRow.igst = "";
                updatedRow.igstPercentage = "";
                updatedRow.igstAmount = 0;
            }

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
            [`row_${index}_rejectedReason`]: "",
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

            const rejectedQuantity = num(row.rejectedQuantity);

            if (rejectedQuantity > 0 && !row.rejectedReason) {
                err[`row_${index}_rejectedReason`] =
                    "Rejected reason is required";
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

    const removeEmptyValues = (obj: any) => {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, value]) => {
                return value !== "" && value !== null && value !== undefined;
            })
        );
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const footer = calculateFooter(products);

        const payload: any = {
            grnVoucherDate: form.grnVoucherDate,

            grnVendorCode: form.grnVendorCode,
            grnVendorName: form.grnVendorName,

            pOrdVoucherNumber: form?.pOrdVoucherNumber || "",

            grnStatus: form.grnStatus || "open",

            grnRemark: form.grnRemark,

            grnBody: products.map((item: any) =>
                removeEmptyValues({
                    productCode: item.productCode,
                    productName: item.productName,
                    productId: item.productId,

                    productDescription:
                        item.productDescription || item.description,

                    description:
                        item.description || item.productDescription,

                    productHSNCode: item.productHSNCode,

                    remarks: item.remarks,

                    quantity: String(
                        num(item.acceptedQuantity) + num(item.rejectedQuantity)
                    ),

                    acceptedQuantity: String(
                        item.acceptedQuantity !== undefined &&
                            item.acceptedQuantity !== null &&
                            item.acceptedQuantity !== ""
                            ? item.acceptedQuantity
                            : item.quantity
                    ),

                    rejectedQuantity: String(
                        item.rejectedQuantity !== undefined &&
                            item.rejectedQuantity !== null &&
                            item.rejectedQuantity !== ""
                            ? item.rejectedQuantity
                            : "0"
                    ),

                    rejectedReason: item.rejectedReason,

                    unit: item.unit || item.uom,
                    uom: item.uom || item.unit,

                    rate: String(item.rate),

                    gross: fmtMoney(item.grossAmount),
                    grossAmount: fmtMoney(item.grossAmount),

                    discount: String(
                        getTaxValue(item.discount, item.discountPercentage)
                    ),
                    discountPercentage: String(
                        getTaxValue(item.discountPercentage, item.discount)
                    ),

                    discountAmount: fmtMoney(item.discountAmount),

                    taxableAmount: fmtMoney(item.taxableAmount),

                    cgst: String(getTaxValue(item.cgst, item.cgstPercentage)),
                    cgstPercentage: String(
                        getTaxValue(item.cgstPercentage, item.cgst)
                    ),
                    cgstAmount: fmtMoney(item.cgstAmount),

                    sgst: String(getTaxValue(item.sgst, item.sgstPercentage)),
                    sgstPercentage: String(
                        getTaxValue(item.sgstPercentage, item.sgst)
                    ),
                    sgstAmount: fmtMoney(item.sgstAmount),

                    igst: String(getTaxValue(item.igst, item.igstPercentage)),
                    igstPercentage: String(
                        getTaxValue(item.igstPercentage, item.igst)
                    ),
                    igstAmount: fmtMoney(item.igstAmount),

                    taxAmount: fmtMoney(item.taxAmount),

                    otherAmount: fmtMoney(item.otherAmount),

                    netAmount: fmtMoney(item.netAmount || item.netTotal),
                    netTotal: fmtMoney(item.netTotal || item.netAmount),
                })
            ),

            grnFooter: {
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
                totalDiscountAmount: fmtMoney(footer.totalDiscountAmount),
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
                    updateGrn({
                        grnVoucherNumber: form?.grnVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                if (payload?.pOrdVoucherNumber) {
                    await syncPurchaseOrderStatusAfterGrn(
                        payload.pOrdVoucherNumber
                    );
                }

                toast.success("GRN updated successfully");
            } else {
                await dispatch(addGrn({ payload }) as any).unwrap();

                if (payload?.pOrdVoucherNumber) {
                    const poStatus = await syncPurchaseOrderStatusAfterGrn(
                        payload.pOrdVoucherNumber
                    );

                    if (poStatus === "close") {
                        toast.success(
                            "GRN created successfully and Purchase Order closed"
                        );
                    } else {
                        toast.success("GRN created successfully");
                    }
                } else {
                    toast.success("GRN created successfully");
                }
            }

            setShowModal(false);
            resetMainForm();

            setSelectedPurchaseOrder(null);
            setPurchaseOrderSearch("");
            setPurchaseOrderLoaded(false);

            await fetchGrns();

            // Refresh open Purchase Orders so closed PO is removed from modal list
            await fetchPurchaseOrders("");
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;

            if (!voucherNumber) {
                toast.error("GRN voucher number not found");
                return;
            }

            await dispatch(
                deleteGrn({
                    grnVoucherNumber: voucherNumber,
                }) as any
            ).unwrap();

            toast.success("GRN deleted successfully");

            await fetchGrns();
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.payload?.message ||
                "Failed to delete GRN"
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

    const showInitialSkeleton =
        !refreshing &&
        grns.length === 0 &&
        (loading || fieldsLoading);

    if (showInitialSkeleton) {
        return <ModulePageSkeleton rows={8} columns={6} />;
    }

    const showPurchaseOrderSkeleton =
        purchaseOrderModalLoading ||
        purchaseOrderLoading ||
        !purchaseOrderLoaded;

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div
                id="grn-header"
                className="mb-3 flex items-center"
            >
                <div
                    id="grn-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total GRNs:",
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

                    {/* @ts-ignore */}
                    <DataCreateButton
                        {...{
                            callBackFn: openAddModal,
                            text: "Add GRN",
                        }}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={grns}
                loading={loading}
                emptyMessage={`No ${status} GRN found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="grn-edit-button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            id="grn-delete-button"
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
                                    voucherNumber: record?.grnVoucherNumber,
                                });
                            }}
                            className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
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

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this GRN?"
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

            <Modal
                show={showPurchaseOrderModal}
                setShow={setShowPurchaseOrderModal}
                title="Select Purchase Order"
                state={false}
                handleSubmit={handlePurchaseOrderConfirm}
                handleClose={handlePurchaseOrderModalClose}
                loader={purchaseOrderModalLoading || purchaseOrderLoading}
                gridCols={1}
                maxWidth="2xl"
                modalClassName="rounded-xl"
                headerClassName="bg-white"
                footerClassName="bg-white"
                bodyClassName="!block !p-0"
                body={
                    <div className="flex h-[520px] flex-col">
                        <div className="border-b border-gray-200 p-5">
                            <input
                                value={purchaseOrderSearch}
                                onChange={(e) =>
                                    setPurchaseOrderSearch(e.target.value)
                                }
                                placeholder="Search Purchase Order code..."
                                className="
                                    w-full rounded-xl border border-gray-200 bg-gray-50
                                    px-4 py-3 text-sm font-medium text-gray-700
                                    outline-none transition
                                    placeholder:text-gray-400
                                    focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100
                                "
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {showPurchaseOrderSkeleton ? (
                                <ModalListSkeleton rows={3} />
                            ) : purchaseOrders.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-gray-500">
                                    No purchase order found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {purchaseOrders.map((po: any, index: number) => {
                                        const poNumber =
                                            po?.pOrdVoucherNumber || "-";

                                        const vendorName =
                                            po?.pOrdVendorName || "-";

                                        const poBody = po?.pOrdBody || [];

                                        const selectedPoNumber =
                                            selectedPurchaseOrder?.pOrdVoucherNumber || "";

                                        const isSelected =
                                            String(selectedPoNumber) ===
                                            String(poNumber);

                                        return (
                                            <button
                                                key={`${poNumber}-${index}`}
                                                type="button"
                                                onClick={() =>
                                                    handlePurchaseOrderSelect(po)
                                                }
                                                className={`
                                                    w-full rounded-xl border px-4 py-4 text-left transition
                                                    ${isSelected
                                                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-base font-bold text-gray-900">
                                                            {poNumber} - {vendorName}
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium text-gray-500">
                                                            Items: {poBody?.length || 0}
                                                        </p>
                                                    </div>

                                                    {isSelected && (
                                                        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                }
            />

            {!fieldsLoading && (
                <DynamicAddForm
                    {...{
                        show: showModal,
                        setShow: setShowModal,
                        edit: Boolean(editingRecord),
                        title: "GRN",
                        subtitle: "Fill in the GRN details below",
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

export default Grn;