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
import { fmtMoney, formatDateForInput, formatDateForList, money, num, safePercent, todayYMD } from "../../../../../utils/helperFunctions";
import professionalAxios from "../../../../../services/professionalAxios";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import { createSalesInvoice, deleteSalesInvoice, getAllSalesInvoice, updateSalesInvoice } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import type { ConfirmTooltipState } from "../salesWorkflowTypes";
import Modal, { ListingModel } from "../../../../../components/modal";
import { getAllSalesOrder, updateSalesOrder } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesOrderSlice";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import Permission from "../../../../../components/PermissionGuard";

const defaultPagination = { offset: 0, limit: 10, totalDocs: 0, totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };
const emptyProductRow = { id: Date.now(), productCode: "", productName: "", productId: "", productDescription: "", description: "", productHSNCode: "", remarks: "", quantity: "", uom: "", unit: "", unitName: "", rate: "", gross: 0, grossAmount: 0, discount: "", discountPercentage: "", discountAmount: 0, taxableAmount: 0, cgst: "", cgstPercentage: "", cgstAmount: 0, sgst: "", sgstPercentage: "", sgstAmount: 0, igst: "", igstPercentage: "", igstAmount: 0, taxAmount: 0, otherAmount: "", netAmount: 0, netTotal: 0 };
const getDefaultForm = () => ({ sInvVoucherNumber: "AUTO", sInvVoucherDate: todayYMD(), sInvCustomerCode: "", sInvCustomerName: "", sInvSalesAccount: "SA021", sInvStatus: "open", sInvDocStatus: "open", sInvRemark: "", sInvRemarks: "", isAutoPost: false, products: [{ ...emptyProductRow, id: Date.now() }], grossAmount: "0.00", discountAmount: "0.00", cgstAmount: "0.00", sgstAmount: "0.00", igstAmount: "0.00", taxAmount: "0.00", otherAmount: "0.00", netAmount: "0.00" });

const getRecords = (res: any) => {
    return Array.isArray(res?.items) ? res.items : Array.isArray(res?.records) ? res.records : Array.isArray(res?.docs) ? res.docs : Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.data?.records) ? res.data.records : Array.isArray(res?.data?.docs) ? res.data.docs : Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

export const loadFieldOptions = async (fields: any[]) => {
    const updatedFields = await Promise.all(
        (fields || []).map(async (field) => {
            if (!field?.api) return field;
            try {
                const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend${field.api}`, { params: field.queryParams || {} });
                const records = getRecords(res.data);
                const options = Array.isArray(records) ? records.map((item: any) => ({ label: item?.[field.labelField] || "", value: item?.[field.valueField] || "", raw: item })) : [];
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
    const [updatedHeader, updatedBody, updatedFooter] = await Promise.all([loadFieldOptions(templateData?.header || []), loadFieldOptions(templateData?.body || []), loadFieldOptions(templateData?.footer || [])]);
    return { ...templateData, header: updatedHeader, body: updatedBody, footer: updatedFooter };
};

const SalesInVoice = () => {
    const dispatch = useDispatch<any>();
    const salesInvoiceState = useSelector((state: any) => state.salesInvoice);
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema);
    const { salesInvoices = [], pagination = defaultPagination, loading = false, createLoading = false, updateLoading = false, deleteLoading = false } = salesInvoiceState || {};
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
    const [templateFields, setTemplateFields] = useState<any>({ header: [], body: [], footer: [] });
    const { salesOrders, loading: orderLoader } = useSelector((state: any) => state.salesOrder);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [confirmTooltip, setConfirmTooltip] = useState<ConfirmTooltipState>({ show: false, x: null, y: null, voucherNumber: null });
    const [downlaodPDF, setDownlaodPDF] = useState({ show: false, x: null, y: null, type: "" });
    const { report } = useSelector((s: any) => s.reportMapping);

    const getHeaderFieldByKey = (key: string) => templateFields?.header?.find((field: any) => field.key === key);
    const getBodyFieldByKey = (key: string) => templateFields?.body?.find((field: any) => field.key === key);
    const getOptionByValue = (field: any, selectedValue: any) => field?.options?.find((opt: any) => String(opt.value) === String(selectedValue));

    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
        if (!field) return oldData;
        const selectedOption = getOptionByValue(field, selectedValue);
        const updated = { ...oldData, [field.key]: selectedValue };
        if (field?.mapFields && selectedOption?.raw) Object.entries(field.mapFields).forEach(([targetKey, sourceKey]) => { updated[targetKey] = selectedOption.raw?.[sourceKey as string] ?? ""; });
        return updated;
    };

    const getUnitLabelFromSchema = (unitCode: string) => {
        const unitField = templateFields?.body?.find((field: any) => field.key === "uom" || field.key === "unit");
        const selectedUnit = unitField?.options?.find((item: any) => String(item.value) === String(unitCode));
        return selectedUnit?.label || unitCode || "";
    };

    const normalizeRowKeys = (row: any) => {
        const updated = { ...row };
        if (updated.uom && !updated.unit) updated.unit = updated.uom;
        if (updated.unit && !updated.uom) updated.uom = updated.unit;
        if (updated.productDescription && !updated.description) updated.description = updated.productDescription;
        if (updated.description && !updated.productDescription) updated.productDescription = updated.description;
        if (updated.netAmount && !updated.netTotal) updated.netTotal = updated.netAmount;
        if (updated.netTotal && !updated.netAmount) updated.netAmount = updated.netTotal;
        if (updated.gross && !updated.grossAmount) updated.grossAmount = updated.gross;
        if (updated.grossAmount && !updated.gross) updated.gross = updated.grossAmount;
        updated.unitName = getUnitLabelFromSchema(updated.unit || updated.uom);
        return updated;
    };

    const calculateRow = (row: any) => {
        const quantity = num(row.quantity);
        const rate = num(row.rate);
        const gross = quantity * rate;
        const discountPercent = safePercent(row.discount);
        const cgstPercent = safePercent(row.cgst);
        const sgstPercent = safePercent(row.sgst);
        const igstPercent = safePercent(row.igst);
        const discountAmount = (gross * discountPercent) / 100;
        const taxableAmount = gross - discountAmount;
        const cgstAmount = (taxableAmount * cgstPercent) / 100;
        const sgstAmount = (taxableAmount * sgstPercent) / 100;
        const igstAmount = (taxableAmount * igstPercent) / 100;
        const otherAmount = num(row.otherAmount);
        const taxAmount = cgstAmount + sgstAmount + igstAmount;
        const netAmount = taxableAmount + taxAmount + otherAmount;
        return { ...row, quantity: row.quantity, rate: row.rate, discount: row.discount, cgst: row.cgst, sgst: row.sgst, igst: row.igst, otherAmount: row.otherAmount, gross, grossAmount: gross, discountAmount, taxableAmount, cgstAmount, sgstAmount, igstAmount, taxAmount, netAmount, netTotal: netAmount };
    };

    const calculateFooter = (products: any[]) => {
        return (products || []).reduce((acc: any, item: any) => {
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
        }, { totalQuantity: 0, totalGrossAmount: 0, totalDiscountAmount: 0, totalCgstAmount: 0, totalSgstAmount: 0, totalIgstAmount: 0, totalTaxAmount: 0, totalOtherAmount: 0, totalNetAmount: 0 });
    };

    const footerTotals = useMemo(() => calculateFooter(form.products || []), [form.products]);
    const grossAmount = footerTotals.totalGrossAmount;
    const discountAmount = footerTotals.totalDiscountAmount;
    const cgstAmount = footerTotals.totalCgstAmount;
    const sgstAmount = footerTotals.totalSgstAmount;
    const igstAmount = footerTotals.totalIgstAmount;
    const netAmount = footerTotals.totalNetAmount;

    const fetchSalesInvoices = async () => {
        await dispatch(getAllSalesInvoice({ offset: localOffset, limit: localLimit, search: debouncedSearch, status }) as any);
    };

    const columns = [
        { key: "sInvVoucherNumber", title: "Voucher" },
        { key: "sInvVoucherDate", title: "Date", render: (row: any) => row?.sInvVoucherDate ? formatDateForList(row.sInvVoucherDate) : "-" },
        {
            key: "sInvCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">{row?.sInvCustomerName || "-"}</div>
                    <div className="text-xs text-slate-500">{row?.sInvCustomerCode || "-"}</div>
                </div>
            ),
        },
        { key: "sInvBody", title: "Items", render: (row: any) => row?.sInvBody?.length || 0 },
        { key: "sInvFooter", title: "Net Amount", render: (row: any) => <span className="font-semibold text-indigo-700">{money(row?.sInvFooter?.netAmount || 0)}</span> },
        {
            key: "sInvDocStatus",
            title: "Doc Status",
            render: (row: any) => (
                <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${(row?.sInvDocStatus || row?.sInvStatus) === "open" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
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
        const products = record?.sInvBody?.length > 0 ? record.sInvBody.map((item: any) => {
            const unitCode = item?.unit || item?.uom || "";
            return calculateRow(normalizeRowKeys({ id: item?.id || Date.now() + Math.random(), productCode: item?.productCode || "", productName: item?.productName || "", productId: item?.productId || "", productDescription: item?.productDescription || item?.description || "", description: item?.description || item?.productDescription || "", productHSNCode: item?.productHSNCode || "", remarks: item?.remarks || "", quantity: item?.quantity || "", unit: unitCode, uom: unitCode, unitName: item?.unitName || getUnitLabelFromSchema(unitCode), rate: item?.rate || "", gross: item?.gross || item?.grossAmount || 0, grossAmount: item?.grossAmount || item?.gross || 0, discount: item?.discount || item?.discountPercentage || "", discountPercentage: item?.discountPercentage || item?.discount || "", discountAmount: item?.discountAmount || 0, taxableAmount: item?.taxableAmount || 0, cgst: item?.cgst || item?.cgstPercentage || "", cgstPercentage: item?.cgstPercentage || item?.cgst || "", cgstAmount: item?.cgstAmount || 0, sgst: item?.sgst || item?.sgstPercentage || "", sgstPercentage: item?.sgstPercentage || item?.sgst || "", sgstAmount: item?.sgstAmount || 0, igst: item?.igst || item?.igstPercentage || "", igstPercentage: item?.igstPercentage || item?.igst || "", igstAmount: item?.igstAmount || 0, taxAmount: item?.taxAmount || 0, otherAmount: item?.otherAmount || 0, netAmount: item?.netAmount || item?.netTotal || 0, netTotal: item?.netTotal || item?.netAmount || 0 }));
        }) : [{ ...emptyProductRow, id: Date.now() }];
        setEditingRecord(true);
        setErrors({});
        setForm({ sInvVoucherNumber: record?.sInvVoucherNumber || "AUTO", sInvVoucherDate: formatDateForInput(record?.sInvVoucherDate), sInvCustomerCode: record?.sInvCustomerCode || "", sInvCustomerName: record?.sInvCustomerName || "", sInvSalesAccount: record?.sInvSalesAccount || "SA021", sInvDocStatus: record?.sInvDocStatus || record?.sInvStatus || "open", sInvStatus: record?.sInvStatus || record?.sInvDocStatus || "open", sInvRemark: record?.sInvRemark || record?.sInvRemarks || "", sInvRemarks: record?.sInvRemarks || record?.sInvRemark || "", isAutoPost: record?.isAutoPost || false, products, grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00", discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00", cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00", sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00", igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00", taxAmount: footer?.taxAmount || footer?.totalTaxAmount || "0.00", otherAmount: footer?.otherAmount || footer?.totalOtherAmount || "0.00", netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00" });
        setShowModal(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => {
            const currentField = getHeaderFieldByKey(key);
            let updated = { ...prev, [key]: value };
            if (currentField?.mapFields) updated = applyMappedFields(currentField, value, updated);
            return updated;
        });
        setErrors((prev: any) => ({ ...prev, [key]: "" }));
    };

    const handleAddRow = () => {
        setForm((prev: any) => ({ ...prev, products: [...(prev.products || []), { ...emptyProductRow, id: Date.now() }] }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedProducts = (prev.products || []).filter((_: any, i: number) => i !== index);
            return { ...prev, products: updatedProducts.length > 0 ? updatedProducts : [{ ...emptyProductRow, id: Date.now() }] };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        const duplicate = Boolean(form?.products?.filter((e: any) => e?.productCode == value)?.length);
        if (duplicate) {
            setErrors((prev: any) => ({ ...prev, products: "", [`row_${index}_${key}`]: "This product already added", [`row_${index}_tax`]: "" }));
            return
        }
        setForm((prev: any) => {
            const updatedProducts = [...(prev.products || [])];
            const currentRow = updatedProducts[index] || {};
            const currentField = getBodyFieldByKey(key);
            let updatedRow = { ...currentRow, [key]: value };
            if (currentField?.mapFields) updatedRow = applyMappedFields(currentField, value, updatedRow);
            const selectedOption = getOptionByValue(currentField, value);
            if (selectedOption?.raw?._id && !updatedRow.productId) updatedRow.productId = selectedOption.raw._id;
            updatedRow = normalizeRowKeys(updatedRow);
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
        setErrors((prev: any) => ({ ...prev, products: "", [`row_${index}_${key}`]: "", [`row_${index}_tax`]: "" }));
    };

    const getFilledRows = () => {
        const bodyKeys = (templateFields?.body || []).filter((field: any) => !field.isHidden).map((field: any) => field.key);
        return (form.products || []).filter((row: any) => bodyKeys.some((key: string) => {
            const value = row?.[key];
            return value !== undefined && value !== null && value !== "";
        }));
    };

    const validateForm = () => {
        const err: any = {};
        (templateFields?.header || []).forEach((field: any) => {
            if (field.isHidden) return;
            if (!field.isRequired) return;
            const value = form?.[field.key];
            if (value === undefined || value === null || value === "") err[field.key] = `${field.label || field.title || field.key} is required`;
        });
        const filledRows = getFilledRows();
        if (filledRows.length === 0) err.products = "Please add at least one product";
        (form.products || []).forEach((row: any, index: number) => {
            const hasAnyValue = (templateFields?.body || []).some((field: any) => {
                const value = row?.[field.key];
                return value !== undefined && value !== null && value !== "";
            });
            if (!hasAnyValue) return;
            (templateFields?.body || []).forEach((field: any) => {
                if (field.isHidden) return;
                if (!field.isRequired) return;
                const value = row?.[field.key];
                if (value === undefined || value === null || value === "") err[`row_${index}_${field.key}`] = `${field.label || field.title || field.key} is required`;
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
        return (form.products || []).filter((row: any) => bodyKeys.some((key: string) => {
            const value = row?.[key];
            return value !== undefined && value !== null && value !== "";
        })).map((row: any) => calculateRow(normalizeRowKeys(row)));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        const products = cleanRows();
        const footer = calculateFooter(products);
        const payload: any = {
            sInvCustomerCode: form.sInvCustomerCode,
            sInvCustomerName: form.sInvCustomerName,
            sInvVoucherDate: form.sInvVoucherDate,
            sInvStatus: form.sInvStatus || form.sInvDocStatus || "open",
            sInvRemarks: form.sInvRemarks || form.sInvRemark || "",
            sInvSalesAccount: form.sInvSalesAccount || "SA021",
            sInvDocStatus: form.sInvDocStatus || form.sInvStatus || "open",
            sInvBody: products.map((item: any) => ({ productCode: item.productCode, productName: item.productName, productId: item.productId, productDescription: item.productDescription || item.description, description: item.description || item.productDescription, productHSNCode: item.productHSNCode, remarks: item.remarks, quantity: String(item.quantity), unit: item.unit || item.uom, uom: item.uom || item.unit, unitName: item.unitName, rate: String(item.rate), gross: fmtMoney(item.grossAmount), grossAmount: fmtMoney(item.grossAmount), discount: String(item.discountPercentage || item.discount || ""), discountPercentage: String(item.discountPercentage || item.discount || ""), discountAmount: fmtMoney(item.discountAmount), taxableAmount: fmtMoney(item.taxableAmount), cgst: String(item.cgstPercentage || item.cgst || ""), cgstPercentage: String(item.cgstPercentage || item.cgst || ""), cgstAmount: fmtMoney(item.cgstAmount), sgst: String(item.sgstPercentage || item.sgst || ""), sgstPercentage: String(item.sgstPercentage || item.sgst || ""), sgstAmount: fmtMoney(item.sgstAmount), igst: String(item.igstPercentage || item.igst || ""), igstPercentage: String(item.igstPercentage || item.igst || ""), igstAmount: fmtMoney(item.igstAmount), taxAmount: fmtMoney(item.taxAmount), otherAmount: fmtMoney(item.otherAmount), netAmount: fmtMoney(item.netAmount || item.netTotal), netTotal: fmtMoney(item.netTotal || item.netAmount) })),
            sInvFooter: { grossAmount: fmtMoney(footer.totalGrossAmount), discountAmount: fmtMoney(footer.totalDiscountAmount), cgstAmount: fmtMoney(footer.totalCgstAmount), sgstAmount: fmtMoney(footer.totalSgstAmount), igstAmount: fmtMoney(footer.totalIgstAmount), taxAmount: fmtMoney(footer.totalTaxAmount), otherAmount: fmtMoney(footer.totalOtherAmount), netAmount: fmtMoney(footer.totalNetAmount), adjustedAmount: "0", balanceAmount: fmtMoney(footer.totalNetAmount), totalQuantity: footer.totalQuantity, totalGrossAmount: fmtMoney(footer.totalGrossAmount), totalDiscountAmount: fmtMoney(footer.totalDiscountAmount), totalCgstAmount: fmtMoney(footer.totalCgstAmount), totalSgstAmount: fmtMoney(footer.totalSgstAmount), totalIgstAmount: fmtMoney(footer.totalIgstAmount), totalTaxAmount: fmtMoney(footer.totalTaxAmount), totalOtherAmount: fmtMoney(footer.totalOtherAmount), totalNetAmount: fmtMoney(footer.totalNetAmount) },
        };
        try {
            if (editingRecord) {
                await dispatch(updateSalesInvoice({ sInvVoucherNumber: form?.sInvVoucherNumber, payload }) as any).unwrap();
                toast.success("Sales invoice updated successfully");
            } else {
                await dispatch(createSalesInvoice({ payload }) as any).unwrap();
                if (form?.sInvVoucherNumber) await syncPurchaseOrderStatusAfterGrn(form.sInvVoucherNumber);
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
            if (!confirmTooltip.voucherNumber) return;
            await dispatch(deleteSalesInvoice(confirmTooltip.voucherNumber) as any).unwrap();
            toast.success("Sales invoice deleted successfully");
            fetchSalesInvoices();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete sales invoice");
        } finally {
            setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null });
        }
    };

    const syncPurchaseOrderStatusAfterGrn = async (e: string) => {
        if (!e) return "";
        try {
            await dispatch(updateSalesOrder({ data: { sOrderStatus: "close" }, voucherNumber: e }) as any);
            await fetchSalesOrders();
        } catch (error) {
            toast.error("GRN saved but failed to update purchase order status");
            return "";
        }
    };

    const footerValues = useMemo(() => ({ grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount, adjustedAmount: 0, balanceAmount: netAmount }), [grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || []).filter((field: any) => !field.isHidden).map((field: any) => {
            const rawValue = footerValues[field.key as keyof typeof footerValues] ?? 0;
            return { ...field, value: money(rawValue), rawValue };
        });
    }, [templateFields?.footer, footerValues]);

    const handlePurchaseOrderConfirm = () => {
        if (!selectedPurchaseOrder) {
            toast.error("Please select purchase order");
            return;
        }
        const poBody = selectedPurchaseOrder?.sOrderBody || [];
        const products = poBody?.length > 0 ? poBody?.map((item: any) => calculateRow(normalizeRowKeys({ id: Date.now() + Math.random(), productCode: item?.productCode || "", productName: item?.productName || "", productId: item?.productId || "", productDescription: item?.productDescription || item?.description || "", description: item?.description || item?.productDescription || "", productHSNCode: item?.productHSNCode || "", remarks: item?.remarks || "", quantity: item?.quantity || "", unit: item?.unit, uom: item?.uom, unitName: item?.unitName || getUnitLabelFromSchema(item?.unitName), rate: item?.rate || "", gross: item?.gross || item?.grossAmount || 0, grossAmount: item?.grossAmount || item?.gross || 0, discount: item?.discount || item?.discountPercentage || "", discountPercentage: item?.discountPercentage || item?.discount || "", discountAmount: item?.discountAmount || 0, taxableAmount: item?.taxableAmount || 0, cgst: item?.cgst || item?.cgstPercentage || "", cgstPercentage: item?.cgstPercentage || item?.cgst || "", cgstAmount: item?.cgstAmount || 0, sgst: item?.sgst || item?.sgstPercentage || "", sgstPercentage: item?.sgstPercentage || item?.sgst || "", sgstAmount: item?.sgstAmount || 0, igst: item?.igst || item?.igstPercentage || "", igstPercentage: item?.igstPercentage || item?.igst || "", igstAmount: item?.igstAmount || 0, taxAmount: item?.taxAmount || 0, otherAmount: item?.otherAmount || 0, netAmount: item?.netAmount || item?.netTotal || 0, netTotal: item?.netTotal || item?.netAmount || 0 }))) : [{ ...emptyProductRow, id: Date.now() }];
        setForm({ ...getDefaultForm(), sInvVoucherNumber: selectedPurchaseOrder?.sOrderVoucherNumber || "AUTO", sInvVoucherDate: formatDateForInput(selectedPurchaseOrder?.sOrderVoucherDate), sInvCustomerCode: selectedPurchaseOrder?.sOrderCustomerCode || "", sInvCustomerName: selectedPurchaseOrder?.sOrderCustomerName || "", sInvSalesAccount: selectedPurchaseOrder?.sOrderSalesAccount || "SA021", sInvDocStatus: selectedPurchaseOrder?.sOrderDocStatus || selectedPurchaseOrder?.sInvStatus || "open", sInvStatus: selectedPurchaseOrder?.sOrderStatus || selectedPurchaseOrder?.sInvDocStatus || "open", sInvRemark: selectedPurchaseOrder?.sOrderRemark || selectedPurchaseOrder?.sInvRemarks || "", sInvRemarks: selectedPurchaseOrder?.sOrderRemark || selectedPurchaseOrder?.sInvRemark || "", isAutoPost: selectedPurchaseOrder?.isAutoPost || false, products });
        setErrors({});
        setEditingRecord(null);
        setShowPurchaseOrderModal(false);
        setShowModal(true);
    };

    const handlePurchaseOrderSelect = (purchaseOrder: any) => setSelectedPurchaseOrder(purchaseOrder);

    const fetchSalesOrders = async () => {
        await dispatch(getAllSalesOrder({ offset: 0, limit: 100, search: purchaseOrderSearch, status: "open" }) as any);
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
            const hasSchema = Array.isArray(transactionsSchema?.header) || Array.isArray(transactionsSchema?.body) || Array.isArray(transactionsSchema?.footer);
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

    useEffect(() => {
        dispatch(getAllReportMapping({ moduleType: "salesInvoice" }))
    }, [])

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div id="sales-invoice-header" className="mb-3 flex items-center">
                <div id="sales-invoice-summary" className="flex items-start gap-3">
                    <Badge {...{ count: pagination?.totalDocs ?? salesInvoices?.length ?? 0, text: "Total Sales Invoices:", varient: "primary" }} />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Toggle {...{ arr: ["open", "close"], state: status, setState: handleStatusChange }} />
                    <SearchInput {...{ search, setSearch }} />
                    <DataREfreshButton {...{ callBackFn: handleRefresh, loading: refreshing }} />
                    <Permission module="bookez" permissionKey="salesInvoice" action="create">
                    {/* @ts-ignore */}
                        <DataCreateButton {...{ callBackFn: openAddModal, text: "Add Sales Invoice" }} />
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
                        <button id="sales-quotation-edit-button" onClick={() => {
                            setDownlaodPDF((pre) => ({ ...pre, show: true, moduleType: "salesQuotation", record, CustomerCode: record?.sQuoteCustomerCode, voucherNumber: record?.sQuoteVoucherNumber }));
                        }

                        } className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700">
                            <Download size={16} />
                        </button>
                        <Permission module="bookez" permissionKey="salesInvoice" action="update">
                        <button id="sales-invoice-edit-button" onClick={() => openEditModal(record)} className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700">
                            <Edit size={16} />
                            </button>
                        </Permission>
                        <Permission module="bookez" permissionKey="salesInvoice" action="delete">
                        <button
                            id="sales-invoice-delete-button"
                            disabled={deleteLoading}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                let x = rect.left - 150;
                                if (x < 10) x = 10;
                                const y = rect.top + window.scrollY - 5;
                                setConfirmTooltip({ show: true, x, y, voucherNumber: record?.sInvVoucherNumber });
                            }}
                            className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
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
                    onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null })}
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
                headerClassName="bg-white"
                footerClassName="bg-white"
                bodyClassName="!block !p-0"
                body={
                    <div className="flex h-[520px] flex-col">
                        <div className="border-b border-gray-200 p-5">
                            <input
                                value={purchaseOrderSearch}
                                onChange={(e) => setPurchaseOrderSearch(e.target.value)}
                                placeholder="Search Purchase Order code..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {orderLoader ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-gray-500">Loading purchase orders...</div>
                            ) : salesOrders?.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-gray-500">No purchase order found</div>
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
                                                className={`w-full rounded-xl border px-4 py-4 text-left transition ${isSelected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-base font-bold text-gray-900">{e?.sOrderVoucherNumber || "NA"} - {e?.sOrderCustomerName || "NA"}</p>
                                                        <p className="mt-1 text-xs font-medium text-gray-500">Items: {e?.sOrderBody?.length || 0}</p>
                                                    </div>
                                                    {isSelected && <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Selected</span>}
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