import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DataTable from "../../../../../components/DataTable";
import { DataCreateButton, DataREfreshButton } from "../../../../../components/buttons";
import Toggle from "../../../../../components/toggle";
import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import {
    fmtMoney,
    formatDateForInput,
    formatDateForList,
    money,
    num,
    safePercent,
    todayYMD,
} from "../../../../../utils/helperFunctions";
import professionalAxios from "../../../../../services/professionalAxios";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import {
    createSalesInvoice,
    deleteSalesInvoice,
    getAllSalesInvoice,
    updateSalesInvoice,
} from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import Modal, { ListingModel } from "../../../../../components/modal";
import {
    getAllSalesOrder,
    updateSalesOrder,
} from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesOrderSlice";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import Permission from "../../../../../components/PermissionGuard";
import { getAllSystemConfigurations } from "../../../../../redux/slices/systemConf";

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

    // ✅ Added for Sales Order link
    sOrderNumber: "",

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

    // Margin-product fields
    marginProduct: false,
    taxRate: "",
    nonTaxRate: "",
    taxGross: "",
    nonTaxGross: "",
};

const getDefaultForm = () => ({
    sInvVoucherNumber: "AUTO",

    // ✅ stores selected Sales Order voucher number
    sInvSalesOrderVoucherNumber: "",

    sInvVoucherDate: todayYMD(),
    sInvCustomerCode: "",
    sInvCustomerName: "",
    sInvSalesAccount: "SA021",
    sInvStatus: "open",
    sInvDocStatus: "open",
    sInvRemark: "",
    sInvRemarks: "",
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

const isTrueValue = (value: any) =>
    value === true ||
    String(value ?? "").trim().toLowerCase() === "true";

const CONDITIONAL_MARGIN_FIELD_KEYS = new Set([
    "taxRate",
    "nonTaxRate",
    "taxGross",
    "nonTaxGross",
]);

export const loadFieldOptions = async (fields: any[]) => {
    const updatedFields = await Promise.all(
        (fields || []).map(async (field) => {
            if (!field?.api) return field;

            try {
                const res = await professionalAxios.get(
                    `/eTaxSolnMongoApiBackend${field.api}`,
                    { params: field.queryParams || {} }
                );

                const records = getRecords(res.data);

                const options = Array.isArray(records)
                    ? records.map((item: any) => ({
                        label: item?.[field.labelField] || "",
                        value: item?.[field.valueField] || "",
                        raw: item,
                    }))
                    : [];

                return { ...field, options };
            } catch (error) {
                console.log(`Failed to load options for ${field.key}`, error);
                return { ...field, options: [] };
            }
        })
    );

    return updatedFields;
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
        body: updatedBody,
        footer: updatedFooter,
    };
};

const SalesInVoice = () => {
    const dispatch = useDispatch<any>();

    const salesInvoiceState = useSelector((state: any) => state.salesInvoice);
    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const {
        salesInvoices = [],
        pagination = defaultPagination,
        loading = false,
        createLoading = false,
        updateLoading = false,
        deleteLoading = false,
    } = salesInvoiceState || {};

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(false);
    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const [purchaseOrderSearch, setPurchaseOrderSearch] = useState("");
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const [templateFields, setTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });
    const { configurations } = useSelector((state: any) => state.systemConfiguration);

    const { salesOrders, loading: orderLoader } = useSelector(
        (state: any) => state.salesOrder
    );

    const [fieldsLoading, setFieldsLoading] = useState(false);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
        salesOrderVoucherNumber: null,
    });

    const [downlaodPDF, setDownlaodPDF] = useState<any>({
        show: false,
        x: null,
        y: null,
        type: "",
    });

    const { report } = useSelector((s: any) => s.reportMapping);

    const getHeaderFieldByKey = (key: string) =>
        templateFields?.header?.find((field: any) => field.key === key);

    const getBodyFieldByKey = (key: string) =>
        templateFields?.body?.find((field: any) => field.key === key);

    const getOptionByValue = (field: any, selectedValue: any) =>
        field?.options?.find(
            (opt: any) => String(opt.value) === String(selectedValue)
        );

    const getProductMasterFromRow = (row: any) => {
        if (!row) return null;

        const rowProductValues = [
            row?.productCode,
            row?.productId,
            row?.productName,
        ]
            .filter(
                (value) =>
                    value !== undefined &&
                    value !== null &&
                    value !== ""
            )
            .map((value) => String(value));

        if (!rowProductValues.length) return null;

        const productFields = (templateFields?.body || []).filter(
            (field: any) =>
                ["productCode", "productId", "productName"].includes(
                    field?.key
                )
        );

        for (const field of productFields) {
            const selectedOption = (field?.options || []).find(
                (option: any) => {
                    const optionValues = [
                        option?.value,
                        option?.raw?._id,
                        option?.raw?.productId,
                        option?.raw?.productCode,
                        option?.raw?.productName,
                    ]
                        .filter(
                            (value) =>
                                value !== undefined &&
                                value !== null &&
                                value !== ""
                        )
                        .map((value) => String(value));

                    return optionValues.some((value) =>
                        rowProductValues.includes(value)
                    );
                }
            );

            if (selectedOption?.raw) return selectedOption.raw;
        }

        return null;
    };

    const isMarginProductRow = (row: any) => {
        if (isTrueValue(row?.marginProduct)) return true;

        const productMaster = getProductMasterFromRow(row);
        return isTrueValue(productMaster?.marginProduct);
    };

    const isBodyFieldVisibleForRow = (field: any, row: any) => {
        if (!field?.key) return false;

        if (CONDITIONAL_MARGIN_FIELD_KEYS.has(field.key)) {
            return isMarginProductRow(row);
        }

        return !isTrueValue(field?.isHidden);
    };

    const isBodyColumnVisible = (field: any, rows: any[]) => {
        if (!field?.key) return false;

        if (CONDITIONAL_MARGIN_FIELD_KEYS.has(field.key)) {
            return (rows || []).some((row: any) =>
                isMarginProductRow(row)
            );
        }

        return !isTrueValue(field?.isHidden);
    };

    const isBodyCellVisible = (field: any, row: any) =>
        isBodyFieldVisibleForRow(field, row);

    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
        if (!field) return oldData;

        const selectedOption = getOptionByValue(field, selectedValue);
        const updated = { ...oldData, [field.key]: selectedValue };

        if (field?.mapFields && selectedOption?.raw) {
            Object.entries(field.mapFields).forEach(([targetKey, sourceKey]) => {
                updated[targetKey] = selectedOption.raw?.[sourceKey as string] ?? "";
            });
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

    const calculateRow = (row: any) => {
        const quantity = num(row.quantity);
        const rate = num(row.rate);
        const gross = quantity * rate;

        const marginProduct = isMarginProductRow(row);

        const taxGross = marginProduct
            ? num(row.taxRate) * quantity
            : 0;

        const nonTaxGross = marginProduct
            ? num(row.nonTaxRate) * quantity
            : 0;

        const discountPercent = safePercent(
            row.discountPercentage || row.discount
        );
        const cgstPercent = safePercent(
            row.cgstPercentage || row.cgst
        );
        const sgstPercent = safePercent(
            row.sgstPercentage || row.sgst
        );
        const igstPercent = safePercent(
            row.igstPercentage || row.igst
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
            quantity: row.quantity,
            rate: row.rate,
            discount: row.discount,
            discountPercentage:
                row.discountPercentage || row.discount,
            cgst: row.cgst,
            cgstPercentage: row.cgstPercentage || row.cgst,
            sgst: row.sgst,
            sgstPercentage: row.sgstPercentage || row.sgst,
            igst: row.igst,
            igstPercentage: row.igstPercentage || row.igst,
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

            marginProduct,
            taxRate: marginProduct ? row.taxRate : "",
            nonTaxRate: marginProduct ? row.nonTaxRate : "",
            taxGross: marginProduct ? taxGross.toFixed(2) : "",
            nonTaxGross: marginProduct
                ? nonTaxGross.toFixed(2)
                : "",
        };
    };

    const calculateFooter = (products: any[]) => {
        return (products || []).reduce(
            (acc: any, item: any) => {
                acc.totalQuantity += num(item.quantity);
                acc.totalGrossAmount += num(item.gross);
                acc.totalDiscountAmount += num(item.discountAmount);
                acc.totalCgstAmount += num(item.cgstAmount);
                acc.totalSgstAmount += num(item.sgstAmount);
                acc.totalIgstAmount += num(item.igstAmount);
                acc.totalTaxAmount += num(item.taxAmount);
                acc.totalOtherAmount += num(item.otherAmount);
                acc.totalNetAmount += num(item.netAmount);
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

    const footerTotals = useMemo(
        () => calculateFooter(form.products || []),
        [form.products]
    );

    const grossAmount = footerTotals.totalGrossAmount;
    const discountAmount = footerTotals.totalDiscountAmount;
    const cgstAmount = footerTotals.totalCgstAmount;
    const sgstAmount = footerTotals.totalSgstAmount;
    const igstAmount = footerTotals.totalIgstAmount;
    const netAmount = footerTotals.totalNetAmount;

    const fetchSalesInvoices = async () => {
        await dispatch(
            getAllSalesInvoice({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status,
            }) as any
        );
    };

    const fetchSalesOrders = async () => {
        await dispatch(
            getAllSalesOrder({
                offset: 0,
                limit: 100,
                search: purchaseOrderSearch,
                status: "open",
            }) as any
        );
    };

    const syncSalesOrderStatus = async (voucherNumber: string, nextStatus: "open" | "close") => {
        if (!voucherNumber) return false;
        try {
            await dispatch(updateSalesOrder({ voucherNumber, data: { sOrderStatus: nextStatus, sOrderDocStatus: nextStatus, }, }) as any).unwrap();
            await fetchSalesOrders();
            return true;
        } catch (error) {
            toast.error("Sales invoice updated but failed to update sales order status");
            return false;
        }
    };

    const columns = [
        { key: "sInvVoucherNumber", title: "Voucher" },
        {
            key: "sInvVoucherDate",
            title: "Date",
            render: (row: any) =>
                <>
                    {row?.sInvVoucherDate ? formatDateForList(row.sInvVoucherDate) : "-"}
                    <span className="text-sm block">
                        {row?.createdOn && new Date(row?.createdOn).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                        })}
                    </span>
                </>
        },
        {
            key: "sInvCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">{row?.sInvCustomerName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{row?.sInvCustomerCode || "-"}</div>
                </div>
            ),
        },
        { key: "sInvBody", title: "Items", render: (row: any) => row?.sInvBody?.length || 0 },
        {
            key: "sInvFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.sInvFooter?.netAmount || 0)}
                </span>
            ),
            type: "amount",
        },
        {
            key: "sInvDocStatus",
            title: "Doc Status",
            render: (row: any) => (
                <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${(row?.sInvDocStatus || row?.sInvStatus) === "open" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger"}`}>
                    {row?.sInvDocStatus || row?.sInvStatus || "-"}
                </span>
            ),
        },
    ];

    const handleStatusChange = (nextStatus: "open" | "close") => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchSalesInvoices();
            toast.success("Sales invoice list refreshed");
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
        setShowPurchaseOrderModal(true);
    };

    const openEditModal = (record: any) => {
        const footer = record?.sInvFooter || {};

        const products = record?.sInvBody?.length > 0
            ? record.sInvBody.map((item: any) => {
                const unitCode = item?.unit || item?.uom || "";
                return calculateRow(
                    normalizeRowKeys({
                        id: item?.id || Date.now() + Math.random(),

                        // ✅ Preserve Sales Order number from invoice body
                        sOrderNumber: item?.sOrderNumber || record?.sInvSalesOrderVoucherNumber || "",

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
                        unit: unitCode,
                        uom: unitCode,
                        unitName:
                            item?.unitName || getUnitLabelFromSchema(unitCode),
                        rate: item?.rate || "",
                        gross: item?.gross || item?.grossAmount || 0,
                        grossAmount: item?.grossAmount || item?.gross || 0,
                        discount:
                            item?.discount || item?.discountPercentage || "",
                        discountPercentage:
                            item?.discountPercentage || item?.discount || "",
                        discountAmount: item?.discountAmount || 0,
                        taxableAmount: item?.taxableAmount || 0,
                        cgst: item?.cgst || item?.cgstPercentage || "",
                        cgstPercentage:
                            item?.cgstPercentage || item?.cgst || "",
                        cgstAmount: item?.cgstAmount || 0,
                        sgst: item?.sgst || item?.sgstPercentage || "",
                        sgstPercentage:
                            item?.sgstPercentage || item?.sgst || "",
                        sgstAmount: item?.sgstAmount || 0,
                        igst: item?.igst || item?.igstPercentage || "",
                        igstPercentage:
                            item?.igstPercentage || item?.igst || "",
                        igstAmount: item?.igstAmount || 0,
                        taxAmount: item?.taxAmount || 0,
                        otherAmount: item?.otherAmount || 0,
                        netAmount: item?.netAmount || item?.netTotal || 0,
                        netTotal: item?.netTotal || item?.netAmount || 0,

                        marginProduct: isTrueValue(item?.marginProduct),
                        taxRate:
                            item?.taxRate ??
                            item?.dynamicBodyFields?.taxRate ??
                            "",
                        nonTaxRate:
                            item?.nonTaxRate ??
                            item?.dynamicBodyFields?.nonTaxRate ??
                            "",
                        taxGross:
                            item?.taxGross ??
                            item?.dynamicBodyFields?.taxGross ??
                            "",
                        nonTaxGross:
                            item?.nonTaxGross ??
                            item?.dynamicBodyFields?.nonTaxGross ??
                            "",
                    })
                );
            })
            : [{ ...emptyProductRow, id: Date.now() }];
        setEditingRecord(true);
        setErrors({});

        setForm({
            sInvVoucherNumber: record?.sInvVoucherNumber || "AUTO",
            sInvSalesOrderVoucherNumber: record?.sInvSalesOrderVoucherNumber || record?.sOrderVoucherNumber || record?.sInvOrderVoucherNumber || record?.sInvBody?.[0]?.sOrderNumber || record?.sInvBody?.find((item: any) => item?.sOrderNumber)?.sOrderNumber || "",
            sInvVoucherDate: formatDateForInput(record?.sInvVoucherDate),
            sInvCustomerCode: record?.sInvCustomerCode || "",
            sInvCustomerName: record?.sInvCustomerName || "",
            sInvSalesAccount: record?.sInvSalesAccount || "SA021",
            sInvDocStatus: record?.sInvDocStatus || record?.sInvStatus || "open",
            sInvStatus: record?.sInvStatus || record?.sInvDocStatus || "open",
            sInvRemark: record?.sInvRemark || record?.sInvRemarks || "",
            sInvRemarks: record?.sInvRemarks || record?.sInvRemark || "",
            isAutoPost: record?.isAutoPost || false,
            products,
            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            taxAmount: footer?.taxAmount || footer?.totalTaxAmount || "0.00",
            otherAmount: footer?.otherAmount || footer?.totalOtherAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
        });

        setShowModal(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const currentField = getHeaderFieldByKey(key);
            let updated = { ...prev, [key]: value };

            if (currentField?.mapFields) {
                updated = applyMappedFields(currentField, value, updated);
            }

            return updated;
        });

        setErrors((prev: any) => ({ ...prev, [key]: "" }));
    };

    const handleAddRow = () => {
        setForm((prev: any) => ({
            ...prev,
            products: [
                ...(prev.products || []),
                {
                    ...emptyProductRow,
                    id: Date.now(),

                    // ✅ Keep Sales Order number in newly added rows also
                    sOrderNumber: prev?.sInvSalesOrderVoucherNumber || "",
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
                        : [{ ...emptyProductRow, id: Date.now(), sOrderNumber: prev?.sInvSalesOrderVoucherNumber || "" }],
            };
        });
    };
    const enableDuplicatePro = useMemo(() => {
        const locationConfig = configurations?.[0]?.systemConfiguration?.allowDuplicateProduct
        return locationConfig === true || locationConfig === "true";
    }, [configurations]);

    const handleRowChange = (index: number, key: string, value: any) => {
        const duplicate =
            key === "productCode" &&
            Boolean(
                form?.products?.some(
                    (item: any, rowIndex: number) =>
                        rowIndex !== index &&
                        String(item?.productCode || "") ===
                        String(value || "")
                )
            );

        if (duplicate && !enableDuplicatePro) {
            setErrors((prev: any) => ({
                ...prev,
                products: "",
                [`row_${index}_${key}`]: "This product already added",
                [`row_${index}_tax`]: "",
            }));
            return;
        }

        setForm((prev: any) => {
            const updatedProducts = [...(prev.products || [])];
            const currentRow = updatedProducts[index] || {};
            const currentField = getBodyFieldByKey(key);

            let updatedRow = { ...currentRow, [key]: value };

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(currentField, value, updatedRow);
            }

            const selectedOption = getOptionByValue(currentField, value);
            const raw = selectedOption?.raw || {};
            if (raw?._id && !updatedRow.productId) {
                updatedRow.productId = raw._id;
            }
            updatedRow = normalizeRowKeys(updatedRow);
            if (key === "productCode" || key === "productName" || key === "productId") {
                updatedRow.cgst = raw?.csgst ?? raw?.CGST ?? raw?.cgstRate ?? raw?.cgstPercentage ?? raw?.tax?.cgst ?? updatedRow.cgst ?? "";
                updatedRow.sgst = raw?.csgst ?? raw?.SGST ?? raw?.sgstRate ?? raw?.sgstPercentage ?? raw?.tax?.sgst ?? updatedRow.sgst ?? "";
                updatedRow.igst = raw?.igst ?? raw?.IGST ?? raw?.igstRate ?? raw?.igstPercentage ?? raw?.tax?.igst ?? updatedRow.igst ?? "";

                const marginProduct = isTrueValue(raw?.dynamicFields?.marginProduct);

                updatedRow.marginProduct = marginProduct;

                if (!marginProduct) {
                    updatedRow.taxRate = "";
                    updatedRow.nonTaxRate = "";
                    updatedRow.taxGross = "";
                    updatedRow.nonTaxGross = "";
                }

                if (num(updatedRow.igst) > 0) {
                    updatedRow.cgst = "";
                    updatedRow.sgst = "";
                    updatedRow.cgstAmount = 0;
                    updatedRow.sgstAmount = 0;
                }

                if (num(updatedRow.cgst) > 0 || num(updatedRow.sgst) > 0) {
                    updatedRow.igst = "";
                    updatedRow.igstAmount = 0;
                }
            }

            // ✅ Make sure Sales Order number never gets lost
            updatedRow.sOrderNumber = updatedRow.sOrderNumber || prev?.sInvSalesOrderVoucherNumber || "";

            if ((key === "cgst" || key === "sgst") && num(value) > 0) {
                updatedRow.igst = "";
                updatedRow.igstAmount = 0;
            }

            if (key === "igst" && num(value) > 0) {
                updatedRow.cgst = "";
                updatedRow.sgst = "";
                updatedRow.cgstAmount = 0;
                updatedRow.sgstAmount = 0;
            }

            updatedRow = calculateRow(updatedRow);
            updatedProducts[index] = updatedRow;

            return { ...prev, products: updatedProducts };
        });

        setErrors((prev: any) => ({
            ...prev,
            products: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_tax`]: "",
        }));
    };

    const getFilledRows = () => {
        return (form.products || []).filter((row: any) => {
            const visibleFields = (templateFields?.body || []).filter(
                (field: any) =>
                    isBodyFieldVisibleForRow(field, row)
            );

            return visibleFields.some((field: any) => {
                const value = row?.[field.key];
                return (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                );
            });
        });
    };

    const validateForm = () => {
        const err: any = {};

        (templateFields?.header || []).forEach((field: any) => {
            if (isTrueValue(field?.isHidden)) return;
            if (!isTrueValue(field?.isRequired)) return;

            const value = form?.[field.key];

            if (value === undefined || value === null || value === "") {
                err[field.key] = `${field.label || field.title || field.key} is required`;
            }
        });

        const filledRows = getFilledRows();

        if (filledRows.length === 0) {
            err.products = "Please add at least one product";
        }

        (form.products || []).forEach((row: any, index: number) => {
            const visibleFields = (templateFields?.body || []).filter(
                (field: any) =>
                    isBodyFieldVisibleForRow(field, row)
            );

            const hasAnyValue = visibleFields.some((field: any) => {
                const value = row?.[field.key];
                return (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                );
            });

            if (!hasAnyValue) return;

            visibleFields.forEach((field: any) => {
                if (!isTrueValue(field?.isRequired)) return;

                const value = row?.[field.key];

                if (value === undefined || value === null || value === "") {
                    err[`row_${index}_${field.key}`] =
                        `${field.label || field.title || field.key} is required`;
                }
            });

            const cgst = num(row.cgstPercentage || row.cgst);
            const sgst = num(row.sgstPercentage || row.sgst);
            const igst = num(row.igstPercentage || row.igst);

            if (igst > 0 && (cgst > 0 || sgst > 0)) {
                err[`row_${index}_tax`] = "You can enter either IGST or CGST/SGST";
                err[`row_${index}_igstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_cgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_sgstPercentage`] = "Only one tax type allowed";
                err[`row_${index}_igst`] = "Only one tax type allowed";
                err[`row_${index}_cgst`] = "Only one tax type allowed";
                err[`row_${index}_sgst`] = "Only one tax type allowed";
            }
        });

        setErrors(err);

        if (err.products) toast.error(err.products);

        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        const bodyKeys = (templateFields?.body || []).map((field: any) => field.key);

        return (form.products || [])
            .filter((row: any) =>
                bodyKeys.some((key: string) => {
                    const value = row?.[key];
                    return value !== undefined && value !== null && value !== "";
                })
            )
            .map((row: any) => calculateRow(normalizeRowKeys(row)));
    };
    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const footer = calculateFooter(products);

        const payload: any = {
            sInvSalesOrderVoucherNumber: form?.sInvSalesOrderVoucherNumber || "",
            sInvCustomerCode: form.sInvCustomerCode,
            sInvCustomerName: form.sInvCustomerName,
            sInvVoucherDate: form.sInvVoucherDate,
            sInvStatus: form.sInvStatus || form.sInvDocStatus || "open",
            sInvRemarks: form.sInvRemarks || form.sInvRemark || "",
            sInvSalesAccount: form.sInvSalesAccount || "SA021",
            // sInvDocStatus: form.sInvDocStatus || form.sInvStatus || "open",
            sOrderNumber: products?.[0]?.sOrderNumber || form?.sInvSalesOrderVoucherNumber || "",
            sInvBody: products.map((item: any) => {
                const marginProduct = isMarginProductRow(item);

                return {
            // ✅ Store Sales Order voucher in invoice body also
                    sOrderNumber:
                        item?.sOrderNumber ||
                        form?.sInvSalesOrderVoucherNumber ||
                        "",
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
                    unitName: item.unitName,
                    rate: String(item.rate),
                    gross: fmtMoney(item.grossAmount),
                    grossAmount: fmtMoney(item.grossAmount),
                    discount: String(
                        item.discountPercentage ||
                        item.discount ||
                        ""
                    ),
                    discountPercentage: String(
                        item.discountPercentage ||
                        item.discount ||
                        ""
                    ),
                    discountAmount: fmtMoney(item.discountAmount),
                    taxableAmount: fmtMoney(item.taxableAmount),
                    cgst: String(
                        item.cgstPercentage || item.cgst || ""
                    ),
                    cgstPercentage: String(
                        item.cgstPercentage || item.cgst || ""
                    ),
                    cgstAmount: fmtMoney(item.cgstAmount),
                    sgst: String(
                        item.sgstPercentage || item.sgst || ""
                    ),
                    sgstPercentage: String(
                        item.sgstPercentage || item.sgst || ""
                    ),
                    sgstAmount: fmtMoney(item.sgstAmount),
                    igst: String(
                        item.igstPercentage || item.igst || ""
                    ),
                    igstPercentage: String(
                        item.igstPercentage || item.igst || ""
                    ),
                    igstAmount: fmtMoney(item.igstAmount),
                    taxAmount: fmtMoney(item.taxAmount),
                    otherAmount: fmtMoney(item.otherAmount),
                    netAmount: fmtMoney(
                        item.netAmount || item.netTotal
                    ),
                    netTotal: fmtMoney(
                        item.netTotal || item.netAmount
                    ),

                    marginProduct,
                    taxRate: marginProduct
                        ? String(item.taxRate ?? "")
                        : "",
                    nonTaxRate: marginProduct
                        ? String(item.nonTaxRate ?? "")
                        : "",
                    taxGross: marginProduct
                        ? fmtMoney(item.taxGross)
                        : "",
                    nonTaxGross: marginProduct
                        ? fmtMoney(item.nonTaxGross)
                        : "",

                    dynamicBodyFields: {
                        ...Object.fromEntries(
                            Object.entries(
                                item?.dynamicBodyFields || {}
                            ).filter(
                                ([fieldKey]) =>
                                    !CONDITIONAL_MARGIN_FIELD_KEYS.has(
                                        fieldKey
                                    )
                            )
                        ),
                        ...(marginProduct
                            ? {
                                taxRate: String(
                                    item.taxRate ?? ""
                                ),
                                nonTaxRate: String(
                                    item.nonTaxRate ?? ""
                                ),
                                taxGross: fmtMoney(
                                    item.taxGross
                                ),
                                nonTaxGross: fmtMoney(
                                    item.nonTaxGross
                                ),
                            }
                            : {}),
                    },
                };
            }),

            sInvFooter: {
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
                    updateSalesInvoice({
                        sInvVoucherNumber: form?.sInvVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();
                toast.success("Sales invoice updated successfully");
            } else {
                await dispatch(createSalesInvoice({ payload }) as any).unwrap();
                if (form?.sInvSalesOrderVoucherNumber) {
                    await syncSalesOrderStatus(form.sInvSalesOrderVoucherNumber, "close");
                }
                toast.success("Sales invoice created successfully");
            }
            setShowModal(false);
            resetMainForm();
            fetchSalesInvoices();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.voucherNumber) return toast.warning("Sales invoice deleted, but sales order voucher number not found");
            const salesOrderVoucherNumber = confirmTooltip?.salesOrderVoucherNumber;
            await dispatch(deleteSalesInvoice(confirmTooltip.voucherNumber) as any).unwrap();
            await syncSalesOrderStatus(salesOrderVoucherNumber, "open");
            toast.success("Sales invoice deleted successfully");
            await fetchSalesInvoices();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete sales invoice");
        } finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
                salesOrderVoucherNumber: null,
            });
        }
    };

    const isClosedSalesOrder = (record: any) => {
        const orderStatus = String(record?.sInvStatus || "").toLowerCase();
        return orderStatus === "close" || orderStatus === "closed";
    };

    const handleEditSalesOrder = (record: any) => {
        if (isClosedSalesOrder(record)) {
            toast.error("You can't edit closed order");
            return;
        }
        openEditModal(record);
    };

    const footerValues = useMemo(
        () => ({
            grossAmount,
            discountAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            netAmount,
            adjustedAmount: 0,
            balanceAmount: netAmount,
        }),
        [grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount]
    );

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || []).filter((field: any) => !field.isHidden).map((field: any) => {
            const rawValue = footerValues[field.key as keyof typeof footerValues] ?? 0;
            return {
                ...field,
                value: money(rawValue),
                rawValue,
            };
        });
    }, [templateFields?.footer, footerValues]);

    const handlePurchaseOrderConfirm = () => {
        if (!selectedPurchaseOrder) {
            toast.error("Please select purchase order");
            return;
        }
        const poBody = selectedPurchaseOrder?.sOrderBody || [];
        const products = poBody?.length ? poBody?.map((item: any) =>
            calculateRow(
                normalizeRowKeys({
                    id: Date.now() + Math.random(),

                    // ✅ Store Sales Order voucher in each row
                    sOrderNumber: selectedPurchaseOrder?.sOrderVoucherNumber || "",
                    productCode: item?.productCode || "",
                    productName: item?.productName || "",
                    productId: item?.productId || "",
                    productDescription: item?.productDescription || item?.description || "",
                    description: item?.description || item?.productDescription || "",
                    productHSNCode: item?.productHSNCode || "",
                    remarks: item?.remarks || "",
                    quantity: item?.quantity || "",
                    unit: item?.unit,
                    uom: item?.uom,
                    unitName: item?.unitName || getUnitLabelFromSchema(item?.unitName),
                    rate: item?.rate || "",
                    gross: item?.gross || item?.grossAmount || 0,
                    grossAmount: item?.grossAmount || item?.gross || 0,
                    discount: item?.discount || item?.discountPercentage || "",
                    discountPercentage: item?.discountPercentage || item?.discount || "",
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

                    marginProduct: isTrueValue(
                        item?.marginProduct
                    ),
                    taxRate:
                        item?.taxRate ??
                        item?.dynamicBodyFields?.taxRate ??
                        "",
                    nonTaxRate:
                        item?.nonTaxRate ??
                        item?.dynamicBodyFields?.nonTaxRate ??
                        "",
                    taxGross:
                        item?.taxGross ??
                        item?.dynamicBodyFields?.taxGross ??
                        "",
                    nonTaxGross:
                        item?.nonTaxGross ??
                        item?.dynamicBodyFields?.nonTaxGross ??
                        "",
                })
            )
        )
            : [
                {
                    ...emptyProductRow,
                    id: Date.now(),
                    sOrderNumber: selectedPurchaseOrder?.sOrderVoucherNumber || "",
                },
            ];

        setForm({
            ...getDefaultForm(),
            sInvVoucherNumber: "AUTO",
            sInvSalesOrderVoucherNumber: selectedPurchaseOrder?.sOrderVoucherNumber || "",
            sInvVoucherDate: formatDateForInput(selectedPurchaseOrder?.sOrderVoucherDate),
            sInvCustomerCode: selectedPurchaseOrder?.sOrderCustomerCode || "",
            sInvCustomerName: selectedPurchaseOrder?.sOrderCustomerName || "",
            sInvSalesAccount: selectedPurchaseOrder?.sOrderSalesAccount || "SA021",
            sInvDocStatus: selectedPurchaseOrder?.sOrderDocStatus || "open",
            sInvStatus: selectedPurchaseOrder?.sOrderStatus || "open",
            sInvRemark: selectedPurchaseOrder?.sOrderRemark || "",
            sInvRemarks: selectedPurchaseOrder?.sOrderRemark || "",
            isAutoPost: selectedPurchaseOrder?.isAutoPost || false,
            products,
        });

        setErrors({});
        setEditingRecord(null);
        setShowPurchaseOrderModal(false);
        setShowModal(true);
    };

    const handlePurchaseOrderSelect = (purchaseOrder: any) => {
        setSelectedPurchaseOrder(purchaseOrder);
    };

    const handlePurchaseOrderModalClose = () => {
        setShowPurchaseOrderModal(false);
        setSelectedPurchaseOrder(null);
        setPurchaseOrderSearch("");
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
        setShowModal(true);
    };

    const handleDeleteSalesInvoiceClick = (e: any, record: any) => {
        if (isClosedSalesOrder(record)) {
            toast.error("You can't delete closed order");
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        let x = rect.left - 150;
        if (x < 10) x = 10;
        const y = rect.top + window.scrollY - 5;
        const salesOrderVoucherNumber = record?.sInvBody?.find((item: any) => item?.sOrderNumber)?.sOrderNumber || record?.sInvSalesOrderVoucherNumber || record?.sOrderVoucherNumber || record?.sInvOrderVoucherNumber || record?.sInvBody?.[0]?.sOrderNumber || "";
        setConfirmTooltip({ show: true, x, y, voucherNumber: record?.sInvVoucherNumber, salesOrderVoucherNumber, });
    };

    useEffect(() => {
        fetchSalesOrders();
    }, [purchaseOrderSearch]);

    useEffect(() => {
        dispatch(getAllTransactionSchema("salesInvoice") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchSalesInvoices();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

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

                const updatedData = await loadAllTemplateOptions(
                    transactionsSchema
                );

                /*
                 * Sales Invoice-only read-only normalization.
                 * Shared DynamicAddForm and EditableLineTable remain unchanged.
                 *
                 * Schema may return "false" as a string, which is truthy in
                 * JavaScript. Convert the rate fields to actual editable fields
                 * and keep only the calculated gross fields read-only.
                 */
                const normalizedBody = (
                    updatedData?.body || []
                ).map((field: any) => {
                    if (
                        field?.key === "taxRate" ||
                        field?.key === "nonTaxRate"
                    ) {
                        return {
                            ...field,
                            isReadonly: false,
                            disabled: false,
                        };
                    }

                    if (
                        field?.key === "taxGross" ||
                        field?.key === "nonTaxGross"
                    ) {
                        return {
                            ...field,
                            isReadonly: true,
                            disabled: true,
                        };
                    }

                    return field;
                });

                setTemplateFields({
                    ...updatedData,
                    body: normalizedBody,
                });
            } catch (error) {
                console.log("Failed to prepare template fields", error);
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    useEffect(() => {
        dispatch(getAllReportMapping({ moduleType: "salesInvoice" }));
        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );
    }, []);

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="sales-invoice-header" className="mb-3 flex items-center">
                <div id="sales-invoice-summary" className="flex items-start gap-3">
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? salesInvoices?.length ?? 0,
                            text: "Total Sales Invoices:",
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

                    <Permission module="bookez" permissionKey="salesInvoice" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openAddModal,
                                text: "Add Sales Invoice",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesInvoices}
                loading={loading}
                emptyMessage={`No ${status} sales invoice found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "salesInvoice",
                                    record,
                                    CustomerCode: record?.sInvCustomerCode,
                                    voucherNumber: record?.sInvVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>

                        <Permission module="bookez" permissionKey="salesInvoice" action="update">
                            <button
                                id="sales-invoice-edit-button"
                                onClick={() => handleEditSalesOrder(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="salesInvoice" action="delete">
                            <button
                                id="sales-invoice-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => handleDeleteSalesInvoiceClick(e, record)}
                                className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
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
                    message="Are you sure you want to delete this sales invoice?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            voucherNumber: null,
                            salesOrderVoucherNumber: null,
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
                        title: "Sales Invoice",
                        subtitle: "Fill in the sales invoice details below",
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
                        inputData: { ...templateFields, footer: dynamicFooterArray },
                        bodyKey: "products",
                        handleChange: handleMainChange,
                        isBodyColumnVisible,
                        isBodyCellVisible,
                    }}
                />
            )}

            <Modal
                show={showPurchaseOrderModal}
                setShow={setShowPurchaseOrderModal}
                title="Select Sales Order"
                state={false}
                handleSubmit={handlePurchaseOrderConfirm}
                handleClose={handlePurchaseOrderModalClose}
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
                                onChange={(e) => setPurchaseOrderSearch(e.target.value)}
                                placeholder="Search Sales Order..."
                                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {orderLoader ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Loading Sales Order...
                                </div>
                            ) : !salesOrders?.length ? (
                                    <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                        No Sales Order found
                                    </div>
                            ) : (
                                <div className="space-y-3">
                                    {salesOrders?.map((e: any, index: number) => {
                                        const poNumber = e?.sOrderVoucherNumber || "-";
                                        const isSelected = selectedPurchaseOrder?.sOrderVoucherNumber == e?.sOrderVoucherNumber;
                                        return (
                                            <button
                                                key={poNumber || index}
                                                type="button"
                                                onClick={() => handlePurchaseOrderSelect(e)}
                                                className={`w-full rounded-xl border px-4 py-4 text-left transition ${isSelected
                                                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/10"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-base font-bold text-card-foreground">
                                                            {e?.sOrderVoucherNumber || "NA"} - {e?.sOrderCustomerName || "NA"}
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                            Items: {e?.sOrderBody?.length || 0}
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

            {/* @ts-ignore  */}
            <ListingModel {...{ show: downlaodPDF?.show, setShow: () => setDownlaodPDF(() => ({ show: !downlaodPDF?.show })), downlaodPDF, entryType: "sales-invoice", rowData: downlaodPDF?.record, report, title: "Download Sales Invoice PDF", cancelText: "Cancel", confirmText: "Confirm" }} />
        </div>
    );
};

export default SalesInVoice;