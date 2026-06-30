import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
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
import Modal, { ListingModel } from "../../../../components/modal";

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
import Permission from "../../../../components/PermissionGuard";
import { getAllReportMapping } from "../../../../redux/slices/professionalSlice/reportMappingSlice";

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

const getRecords = (res: any) => {
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.records)) return res.records;
    if (Array.isArray(res?.docs)) return res.docs;

    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.data?.records)) return res.data.records;
    if (Array.isArray(res?.data?.docs)) return res.data.docs;
    if (Array.isArray(res?.data)) return res.data;

    if (Array.isArray(res)) return res;

    return [];
};

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

                const options = records.map((item: any) => ({
                    label: item?.[field.labelField] || "",
                    value: item?.[field.valueField] || "",
                    raw: item,
                }));

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

    if (alreadyAdded) return bodyWithoutQuantity;

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

    const updatedBody = [...bodyWithoutQuantity];

    updatedBody.splice(Math.max(quantityIndex, 0), 0, ...extraFields);

    return updatedBody;
};

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

const getTaxValue = (primary: any, fallback: any) => {
    if (primary !== undefined && primary !== null && primary !== "") {
        return primary;
    }

    if (fallback !== undefined && fallback !== null) {
        return fallback;
    }

    return "";
};

const removeEmptyValues = (obj: any) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => {
            return value !== "" && value !== null && value !== undefined;
        })
    );
};

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

    const loading = grnState?.loading || grnState?.listingLoader || false;

    const createLoading =
        grnState?.createLoading || grnState?.addLoader || false;

    const updateLoading = grnState?.updateLoading || false;

    const deleteLoading =
        grnState?.deleteLoading || grnState?.deleteLoader || false;

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

    const [purchaseOrderModalLoading, setPurchaseOrderModalLoading] =
        useState(false);
    const [purchaseOrderLoaded, setPurchaseOrderLoaded] = useState(false);
    const [downlaodPDF, setDownlaodPDF]: any = useState({ show: false, type: "" });
    const { report } = useSelector((s: any) => s.reportMapping);

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
        pOrdVoucherNumber: null,
    });

    const getHeaderFieldByKey = (key: string) => {
        return templateFields?.header?.find((field: any) => field.key === key);
    };

    const getBodyFieldByKey = (key: string) => {
        return templateFields?.body?.find((field: any) => field.key === key);
    };

    const getOptionByValue = (field: any, selectedValue: any) => {
        return field?.options?.find(
            (opt: any) => String(opt.value) === String(selectedValue)
        );
    };

    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
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

        if (updated.uom && !updated.unit) updated.unit = updated.uom;
        if (updated.unit && !updated.uom) updated.uom = updated.unit;

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

        updated.unitName = getUnitLabelFromSchema(updated.unit || updated.uom);

        return updated;
    };

    // const getFinalQuantity = (row: any) => {
    //     const originalQuantity = num(row.quantity);
    //     const acceptedQuantity = num(row.acceptedQuantity);
    //     const rejectedQuantity = num(row.rejectedQuantity);

    //     return originalQuantity > 0
    //         ? originalQuantity
    //         : acceptedQuantity + rejectedQuantity;
    // };

    const getFinalQuantity = (row: any) => {
        return num(row.acceptedQuantity);
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

            // GRN is purchase side, so use purchasePrice
            rate: hasValue(product?.purchasePrice)
                ? String(product.purchasePrice)
                : row.rate || "",

            // product master key is csgst, row key is cgst
            cgst: csgst || row.cgst || "",
            cgstPercentage: csgst || row.cgstPercentage || "",

            igst: igst || row.igst || "",
            igstPercentage: igst || row.igstPercentage || "",
        };
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

            // quantity: finalQuantity ? String(finalQuantity) : row.quantity,/
            quantity: row.quantity,
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
                    : "",

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

    const footerValues = useMemo(() => {
        return {
            grossAmount: footerTotals.totalGrossAmount,
            discountAmount: footerTotals.totalDiscountAmount,
            cgstAmount: footerTotals.totalCgstAmount,
            sgstAmount: footerTotals.totalSgstAmount,
            igstAmount: footerTotals.totalIgstAmount,
            netAmount: footerTotals.totalNetAmount,
            adjustedAmount: 0,
            balanceAmount: footerTotals.totalNetAmount,
        };
    }, [footerTotals]);

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

            const nextPoStatus = num(pendingRaw) === 0 ? "close" : "open";

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

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
    };

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
                    item?.productDescription || item?.description || "",

                description:
                    item?.description || item?.productDescription || "",

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
                        : " ",

                rejectedReason: item?.rejectedReason || "",

                unit: unitCode,
                uom: unitCode,
                unitName: item?.unitName || getUnitLabelFromSchema(unitCode),

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
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount:
                footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount:
                footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount:
                footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            taxAmount:
                footer?.taxAmount || footer?.totalTaxAmount || "0.00",
            otherAmount:
                footer?.otherAmount || footer?.totalOtherAmount || "0.00",
            netAmount:
                footer?.netAmount || footer?.totalNetAmount || "0.00",
        });

        setShowModal(true);
    };

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

    // const handleQuantityFields = (updatedRow: any, key: string, value: any, isPurchaseOrderGrn: boolean) => {
    //     if (key === "acceptedQuantity") {
    //         const originalQuantity = num(updatedRow.quantity);
    //         const acceptedQuantity = num(value);
    //         const rejectedQuantity = num(updatedRow.rejectedQuantity);

    //         if (
    //             isPurchaseOrderGrn &&
    //             originalQuantity > 0 &&
    //             acceptedQuantity > originalQuantity
    //         ) {
    //             updatedRow.acceptedQuantity = updatedRow.quantity || "";
    //             toast.error("Accepted quantity cannot be greater than quantity");
    //         }

    //         if (isPurchaseOrderGrn && originalQuantity > 0) {
    //             updatedRow.rejectedQuantity = Math.max(
    //                 originalQuantity - num(updatedRow.acceptedQuantity),
    //                 0
    //             ).toString();
    //         }

    //         if (!isPurchaseOrderGrn) {
    //             updatedRow.quantity = String(acceptedQuantity + rejectedQuantity);
    //         }

    //         if (num(updatedRow.rejectedQuantity) === 0) {
    //             updatedRow.rejectedReason = "";
    //         }
    //     }

    //     if (key === "rejectedQuantity") {
    //         const originalQuantity = num(updatedRow.quantity);
    //         const rejectedQuantity = num(value);
    //         const acceptedQuantity = num(updatedRow.acceptedQuantity);

    //         if (
    //             isPurchaseOrderGrn &&
    //             originalQuantity > 0 &&
    //             rejectedQuantity > originalQuantity
    //         ) {
    //             updatedRow.rejectedQuantity = "0";
    //             toast.error("Rejected quantity cannot be greater than quantity");
    //         }

    //         if (isPurchaseOrderGrn && originalQuantity > 0) {
    //             updatedRow.acceptedQuantity = Math.max(
    //                 originalQuantity - num(updatedRow.rejectedQuantity),
    //                 0
    //             ).toString();
    //         }

    //         if (!isPurchaseOrderGrn) {
    //             updatedRow.quantity = String(acceptedQuantity + rejectedQuantity);
    //         }

    //         if (num(updatedRow.rejectedQuantity) === 0) {
    //             updatedRow.rejectedReason = "";
    //         }
    //     }

    //     return updatedRow;
    // };


    const handleQuantityFields = (
        updatedRow: any,
        key: string,
        value: any,
        isPurchaseOrderGrn: boolean
    ) => {
        const originalQuantity = num(updatedRow.quantity);

        if (key === "acceptedQuantity") {
            let acceptedQuantity = num(value);

            if (acceptedQuantity < 0) {
                acceptedQuantity = 0;
                toast.error("Accepted quantity cannot be negative");
            }

            if (
                isPurchaseOrderGrn &&
                originalQuantity > 0 &&
                acceptedQuantity > originalQuantity
            ) {
                acceptedQuantity = originalQuantity;
                toast.error("Accepted quantity cannot be greater than quantity");
            }

            updatedRow.acceptedQuantity = String(acceptedQuantity);

            if (isPurchaseOrderGrn && originalQuantity > 0) {
                updatedRow.rejectedQuantity = String(
                    Math.max(originalQuantity - acceptedQuantity, 0)
                );
            } else {
                updatedRow.quantity = String(
                    acceptedQuantity + num(updatedRow.rejectedQuantity)
                );
            }

            if (num(updatedRow.rejectedQuantity) === 0) {
                updatedRow.rejectedReason = "";
            }
        }

        if (key === "rejectedQuantity") {
            let rejectedQuantity = num(value);

            if (rejectedQuantity < 0) {
                rejectedQuantity = 0;
                toast.error("Rejected quantity cannot be negative");
            }

            if (
                isPurchaseOrderGrn &&
                originalQuantity > 0 &&
                rejectedQuantity > originalQuantity
            ) {
                rejectedQuantity = originalQuantity;
                toast.error("Rejected quantity cannot be greater than quantity");
            }

            updatedRow.rejectedQuantity = String(rejectedQuantity);

            if (isPurchaseOrderGrn && originalQuantity > 0) {
                updatedRow.acceptedQuantity = String(
                    Math.max(originalQuantity - rejectedQuantity, 0)
                );
            } else {
                updatedRow.quantity = String(
                    num(updatedRow.acceptedQuantity) + rejectedQuantity
                );
            }

            if (rejectedQuantity === 0) {
                updatedRow.rejectedReason = "";
            }
        }

        return updatedRow;
    };

    const handleTaxFields = (updatedRow: any, key: string, value: any) => {
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

        return updatedRow;
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

            updatedRow = handleQuantityFields(
                updatedRow,
                key,
                value,
                isPurchaseOrderGrn
            );

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(
                    currentField,
                    value,
                    updatedRow
                );
            }
            const selectedOption = getOptionByValue(currentField, value);
            const raw = selectedOption?.raw || {};
            const lowerKey = String(key).toLowerCase();
            const isProductField = lowerKey === "productcode" || lowerKey === "productname" || lowerKey === "productid" || lowerKey === "product";
            if (isProductField && selectedOption?.raw) {
                updatedRow = fillProductDetailsFromSelectedOption(updatedRow, selectedOption);
                updatedRow.productCode = raw?.productCode || raw?.code || updatedRow.productCode || "";
                updatedRow.productName = raw?.productName || raw?.name || selectedOption?.label || updatedRow.productName || "";
                updatedRow.productId = raw?._id || raw?.productId || updatedRow.productId || "";
                const cgstValue = raw?.cgstPercentage ?? raw?.cgst ?? raw?.csgst ?? raw?.cgstRate ?? raw?.tax?.cgstPercentage ?? raw?.tax?.cgst ?? "";
                const sgstValue = raw?.sgstPercentage ?? raw?.sgst ?? raw?.csgst ?? raw?.sgstRate ?? raw?.tax?.sgstPercentage ?? raw?.tax?.sgst ?? "";
                const igstValue = raw?.igstPercentage ?? raw?.igst ?? raw?.igstRate ?? raw?.tax?.igstPercentage ?? raw?.tax?.igst ?? "";
                updatedRow.cgst = cgstValue;
                updatedRow.sgst = sgstValue;
                updatedRow.igst = igstValue;
                updatedRow.cgstPercentage = cgstValue;
                updatedRow.sgstPercentage = sgstValue;
                updatedRow.igstPercentage = igstValue;
                if (num(igstValue) > 0) {
                    updatedRow.cgst = "";
                    updatedRow.sgst = "";
                    updatedRow.cgstPercentage = "";
                    updatedRow.sgstPercentage = "";
                    updatedRow.cgstAmount = 0;
                    updatedRow.sgstAmount = 0;
                }

                if (num(cgstValue) > 0 || num(sgstValue) > 0) {
                    updatedRow.igst = "";
                    updatedRow.igstPercentage = "";
                    updatedRow.igstAmount = 0;
                }
            }

            updatedRow = normalizeRowKeys(updatedRow);
            updatedRow = handleTaxFields(updatedRow, key, value);
            updatedRow = calculateRow(updatedRow);
            updatedProducts[index] = updatedRow;
            return { ...prev, products: updatedProducts, };
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
    const getFilledRows = () => {
        const bodyKeys = (templateFields?.body || []).filter((field: any) => !field.isHidden).map((field: any) => field.key);
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
            if (field.isHidden || !field.isRequired) return;
            const value = form?.[field.key];
            if (value === undefined || value === null || value === "") {
                err[field.key] = `${field.label || field.key} is required`;
            }
        });

        if (getFilledRows().length === 0) {
            err.products = "Please add at least one product";
        }

        (form.products || []).forEach((row: any, index: number) => {
            const hasAnyValue = (templateFields?.body || []).some((field: any) => {
                const value = row?.[field.key];

                return value !== undefined && value !== null && value !== "";
            });

            if (!hasAnyValue) return;

            (templateFields?.body || []).forEach((field: any) => {
                if (field.isHidden || !field.isRequired) return;

                const value = row?.[field.key];

                if (value === undefined || value === null || value === "") {
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
                err[`row_${index}_igstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_cgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_sgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_igst`] = "Only one tax type allowed";
                err[`row_${index}_cgst`] = "Only one tax type allowed";
                err[`row_${index}_sgst`] = "Only one tax type allowed";
            }

            if (num(row.rejectedQuantity) > 0 && !row.rejectedReason) {
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

                    return value !== undefined && value !== null && value !== "";
                });
            })
            .map((row: any) => calculateRow(normalizeRowKeys(row)));
    };

    const buildGrnBodyPayload = (products: any[]) => {
        return products.map((item: any) =>
            removeEmptyValues({
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,

                productDescription: item.productDescription || item.description,
                description: item.description || item.productDescription,

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
        );
    };

    const buildGrnFooterPayload = (footer: any) => {
        return {
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
        };
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

            grnBody: buildGrnBodyPayload(products),
            grnFooter: buildGrnFooterPayload(footer),
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
            await fetchPurchaseOrders("");
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;
            const pOrdVoucherNumber = confirmTooltip?.pOrdVoucherNumber;

            if (!voucherNumber) {
                toast.error("GRN voucher number not found");
                return;
            }

            await dispatch(
                deleteGrn({
                    grnVoucherNumber: voucherNumber,
                }) as any
            ).unwrap();

            // ✅ After deleting GRN, update related Purchase Order status
            if (pOrdVoucherNumber) {
                await syncPurchaseOrderStatusAfterGrn(pOrdVoucherNumber);
            } else {
                toast.warning(
                    "GRN deleted, but purchase order voucher number not found"
                );
            }

            toast.success("GRN deleted successfully");

            await fetchGrns();
            await fetchPurchaseOrders("");
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
                pOrdVoucherNumber: null,
            });
        }
    };
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
                    <div className="font-medium text-card-foreground">
                        {row?.grnVendorName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
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
                <span className="font-semibold text-primary">
                    {money(row?.grnFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "grnStatus",
            title: "GRN Status",
            render: (row: any) => (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {row?.grnStatus || "-"}
                </span>
            ),
        },
    ];

    useEffect(() => {
        /* @ts-ignore  */
        dispatch(getAllReportMapping({ moduleType: "grn" }));
    }, []);

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

                const updatedData = await loadAllTemplateOptions(transactionsSchema);

                setTemplateFields(updatedData);
            } catch (error) {
                console.log("Failed to prepare template fields", error);
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    const showInitialSkeleton =
        !refreshing &&
        grns.length === 0 &&
        (loading || fieldsLoading);

    const showPurchaseOrderSkeleton =
        purchaseOrderModalLoading ||
        purchaseOrderLoading ||
        !purchaseOrderLoaded;

    if (showInitialSkeleton) {
        return <ModulePageSkeleton rows={8} columns={6} />;
    }

    const isClosedGRN = (record: any) => {
        const grnStatus = String(record?.grnStatus || "").toLowerCase();
        return grnStatus === "close" || grnStatus === "closed";
    }


    const handleEditGRN = (record: any) => {
        if (isClosedGRN(record)) {
            toast.error("You can't edit closed GRN")
            return;
        }
        openEditModal(record);
    }

    const handleDeleteGRNClick = (e: any, record: any) => {
        if (isClosedGRN(record)) {
            toast.error("You can't delete closed GRN")
            return;
        }
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
            pOrdVoucherNumber: record?.pOrdVoucherNumber || "",
        });
    }

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="grn-header" className="mb-3 flex items-center">
                <div id="grn-summary" className="flex items-start gap-3">
                    <Badge
                        count={pagination?.totalDocs ?? 0}
                        text="Total GRNs:"
                        varient="primary"
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        arr={["open", "close"]}
                        state={status}
                        setState={handleStatusChange}
                    />

                    <SearchInput search={search} setSearch={setSearch} />

                    <DataREfreshButton
                        callBackFn={handleRefresh}
                        loading={refreshing}
                    />

                    <Permission module="bookez" permissionKey="grn" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            callBackFn={openAddModal}
                            text="Add GRN"
                        />
                    </Permission>
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
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "grn",
                                    record,
                                    CustomerCode: record?.grnVendorCode,
                                    voucherNumber: record?.grnVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>
                        <Permission module="bookez" permissionKey="grn" action="update">
                            <button
                                id="grn-edit-button"
                                onClick={() => handleEditGRN(record)}
                                className={`cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary ${isClosedGRN(record)}`}
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="grn" action="delete">
                            <button
                                id="grn-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => handleDeleteGRNClick(e, record)}
                                className={`cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50 ${isClosedGRN(record)}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </Permission>
                    </div>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    }}
                    preDisabled={!pagination?.hasPrevPage}
                    nextDisabled={!pagination?.hasNextPage}
                    setLocalOffset={setLocalOffset}
                    pagination={pagination}
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
                            pOrdVoucherNumber: null,
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
                headerClassName="bg-card"
                footerClassName="bg-card"
                bodyClassName="!block !p-0 bg-card text-card-foreground"
                body={
                    <div className="flex h-[520px] flex-col bg-card text-card-foreground">
                        <div className="border-b border-border p-5">
                            <input
                                value={purchaseOrderSearch}
                                onChange={(e) =>
                                    setPurchaseOrderSearch(e.target.value)
                                }
                                placeholder="Search Purchase Order code..."
                                className="
                                    w-full rounded-xl border border-border bg-input
                                    px-4 py-3 text-sm font-medium text-foreground
                                    outline-none transition
                                    placeholder:text-muted-foreground
                                    focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20
                                "
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {showPurchaseOrderSkeleton ? (
                                <ModalListSkeleton rows={3} />
                            ) : purchaseOrders.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
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
                                                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/10"
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-base font-bold text-card-foreground">
                                                            {poNumber} - {vendorName}
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                            Items: {poBody?.length || 0}
                                                        </p>
                                                    </div>

                                                    {isSelected && (
                                                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
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
                    show={showModal}
                    setShow={setShowModal}
                    edit={Boolean(editingRecord)}
                    title="GRN"
                    subtitle="Fill in the GRN details below"
                    loading={createLoading || updateLoading}
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
                    footerTotals={footerTotals}
                    inputData={{
                        ...templateFields,
                        footer: dynamicFooterArray,
                    }}
                    bodyKey="products"
                    handleChange={handleMainChange}
                />
            )}

            {/* @ts-ignore  */}
            <ListingModel
                {...{
                    show: downlaodPDF?.show,
                    downlaodPDF,
                    entryType: "grn",
                    setShow: () => setDownlaodPDF(() => ({ show: !downlaodPDF?.show, })),
                    rowData: downlaodPDF?.record,
                    report,
                    title: "Download GRN PDF",
                    cancelText: "Cancel",
                    confirmText: "Confirm",
                }}
            />
        </div>
    );
};

export default Grn;