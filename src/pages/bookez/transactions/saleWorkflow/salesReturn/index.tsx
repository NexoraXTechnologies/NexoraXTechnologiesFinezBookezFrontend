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
import { fmtMoney, formatDateForList, loadAllTemplateOptions, money, num, safePercent, todayYMD } from "../../../../../utils/helperFunctions";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import type { ConfirmTooltipState } from "../salesWorkflowTypes";
import { deleteSalesInvoiceReturn, getAllSalesInvoiceReturn, updateSalesInvoiceReturn, createSalesInvoiceReturn } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceReturn";
import Modal, { ListingModel } from "../../../../../components/modal";
import { getAllSalesInvoice, updateSalesInvoice } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import professionalAxios from "../../../../../services/professionalAxios";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import Permission from "../../../../../components/PermissionGuard";

const emptyProductRow = { id: Date.now(), productCode: "", productName: "", productId: "", productDescription: "", description: "", productHSNCode: "", remarks: "", quantity: "", uom: "", unit: "", unitName: "", rate: "", gross: 0, grossAmount: 0, discount: "", discountPercentage: "", discountAmount: 0, taxableAmount: 0, cgst: "", cgstPercentage: "", cgstAmount: 0, sgst: "", sgstPercentage: "", sgstAmount: 0, igst: "", igstPercentage: "", igstAmount: 0, taxAmount: 0, otherAmount: "", netAmount: 0, netTotal: 0 };
const getDefaultForm = () => ({ sInvReturnVoucherNumber: "AUTO", sInvReturnVoucherDate: todayYMD(), sInvCustomerCode: "", sInvReturnCustomerName: "", sInvSalesAccount: "SA021", sInvStatus: "open", sInvReturnStatus: "open", sInvRemark: "", sInvRemarks: "", isAutoPost: false, products: [{ ...emptyProductRow, id: Date.now() }], grossAmount: "0.00", discountAmount: "0.00", cgstAmount: "0.00", sgstAmount: "0.00", igstAmount: "0.00", taxAmount: "0.00", otherAmount: "0.00", netAmount: "0.00" });

const SalesReturn = () => {
    const dispatch = useDispatch<any>();
    const { salesInvoiceReturns, pagination, loading, createLoading, updateLoading, deleteLoading } = useSelector((state: any) => state.salesInvoiceReturn);
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema);
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(false);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false);
    const [purchaseOrderSearch, setPurchaseOrderSearch] = useState("");
    const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<any>(null);
    const { salesInvoices, loading: invoiceLoader } = useSelector((state: any) => state.salesInvoice);
    const [templateFields, setTemplateFields] = useState<any>({ header: [], body: [], footer: [] });
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
        await dispatch(getAllSalesInvoiceReturn({ offset: 0, limit: 100, search: purchaseOrderSearch }) as any);
    };

    const columns = [
        { key: "sInvReturnVoucherNumber", title: "Voucher" },
        { key: "sInvReturnVoucherDate", title: "Date", render: (row: any) => row?.sInvReturnVoucherDate ? formatDateForList(row.sInvReturnVoucherDate) : "-" },
        {
            key: "sInvReturnCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">{row?.sInvReturnCustomerName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{row?.sInvCustomerCode || "-"}</div>
                </div>
            ),
        },
        { key: "sInvReturnBody", title: "Items", render: (row: any) => row?.sInvReturnBody?.length || 0 },
        {
            key: "sInvReturnFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.sInvReturnFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "sInvReturnStatus",
            title: "Doc Status",
            render: (row: any) => (
                <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${(row?.sInvReturnStatus || row?.sInvStatus) === "open" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger"}`}>
                    {row?.sInvReturnStatus || row?.sInvStatus || "-"}
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
        const footer = record?.sInvReturnFooter || {};
        const products = record?.sInvReturnBody?.length > 0 ? record.sInvReturnBody.map((item: any) => {
            const unitCode = item?.unit || item?.uom || "";
            return calculateRow(normalizeRowKeys({ id: item?.id || Date.now() + Math.random(), productCode: item?.productCode || "", productName: item?.productName || "", productId: item?.productId || "", productDescription: item?.productDescription || item?.description || "", description: item?.description || item?.productDescription || "", productHSNCode: item?.productHSNCode || "", remarks: item?.remarks || "", quantity: item?.quantity || "", unit: unitCode, uom: unitCode, unitName: item?.unitName || getUnitLabelFromSchema(unitCode), rate: item?.rate || "", gross: item?.gross || item?.grossAmount || 0, grossAmount: item?.grossAmount || item?.gross || 0, discount: item?.discount || item?.discountPercentage || "", discountPercentage: item?.discountPercentage || item?.discount || "", discountAmount: item?.discountAmount || 0, taxableAmount: item?.taxableAmount || 0, cgst: item?.cgst || item?.cgstPercentage || "", cgstPercentage: item?.cgstPercentage || item?.cgst || "", cgstAmount: item?.cgstAmount || 0, sgst: item?.sgst || item?.sgstPercentage || "", sgstPercentage: item?.sgstPercentage || item?.sgst || "", sgstAmount: item?.sgstAmount || 0, igst: item?.igst || item?.igstPercentage || "", igstPercentage: item?.igstPercentage || item?.igst || "", igstAmount: item?.igstAmount || 0, taxAmount: item?.taxAmount || 0, otherAmount: item?.otherAmount || 0, netAmount: item?.netAmount || item?.netTotal || 0, netTotal: item?.netTotal || item?.netAmount || 0 }));
        }) : [{ ...emptyProductRow, id: Date.now() }];

        setEditingRecord(true);
        setErrors({});
        setForm({ sInvReturnVoucherNumber: record?.sInvReturnVoucherNumber, sInvVoucherNumber: record?.sInvVoucherNumber, sInvReturnCustomerCode: record?.sInvReturnCustomerCode, sInvCustomerCode: record.sInvCustomerCode, sInvReturnCustomerName: record.sInvReturnCustomerName, sInvReturnVoucherDate: record.sInvReturnVoucherDate, sInvStatus: record.sInvStatus || record.sInvReturnStatus || "open", sInvReturnRemark: record.sInvReturnRemark || record.sInvRemark || "", sInvReturnSalesAccount: record.sInvReturnSalesAccount || "SA021", sInvReturnStatus: record.sInvReturnStatus || record.sInvStatus || "open", products, grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00", discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00", cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00", sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00", igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00", taxAmount: footer?.taxAmount || footer?.totalTaxAmount || "0.00", otherAmount: footer?.otherAmount || footer?.totalOtherAmount || "0.00", netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00" });
        setShowModal(true);
    };

    const syncPurchaseOrderStatusAfterGrn = async (pOrdVoucherNumber: string) => {
        if (!pOrdVoucherNumber) return "";
        try {
            const summaryRes = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookez/salesFlow/salesInvoiceReturn/analysis/byInvoiceVoucharNumber/${pOrdVoucherNumber}`);
            const summary = summaryRes?.data?.data || {};
            const pendingRaw = summary?.pendingReturnQuantity?.totalPendingQty;
            if (pendingRaw === undefined || pendingRaw === null || pendingRaw === "") {
                console.log("GRN analysis summary missing totalPendingGrnQuantity", summaryRes?.data);
                return "";
            }
            const totalPendingGrnQuantity = num(pendingRaw);
            const nextPoStatus = totalPendingGrnQuantity === 0 ? "close" : "open";
            dispatch(updateSalesInvoice({ sInvVoucherNumber: pOrdVoucherNumber, payload: { sInvStatus: nextPoStatus } }));
            return nextPoStatus;
        } catch (error) {
            console.log("Failed to sync Purchase Order status after GRN", error);
            toast.error("GRN saved but failed to update purchase order status");
            return "";
        }
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
            return;
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
            sInvReturnVoucherDate: form.sInvReturnVoucherDate,
            sInvReturnCustomerCode: form?.sInvReturnCustomerCode,
            sInvVoucherNumber: form?.sInvVoucherNumber,
            sInvReturnCustomerName: form.sInvReturnCustomerName,
            sInvReturnRemark: form.sInvReturnRemark || form.sInvRemark || "",
            sInvReturnSalesAccount: form.sInvReturnSalesAccount || "SA021",
            sInvReturnStatus: form.sInvReturnStatus || form.sInvStatus || "open",
            sInvReturnBody: products.map((item: any) => ({ productCode: item.productCode, productName: item.productName, productId: item.productId, productDescription: item.productDescription || item.description, description: item.description || item.productDescription, productHSNCode: item.productHSNCode, remarks: item.remarks, quantity: String(item.quantity), unit: item.unit || item.uom, uom: item.uom || item.unit, unitName: item.unitName, rate: String(item.rate), gross: fmtMoney(item.grossAmount), grossAmount: fmtMoney(item.grossAmount), discount: String(item.discountPercentage || item.discount || ""), discountPercentage: String(item.discountPercentage || item.discount || ""), discountAmount: fmtMoney(item.discountAmount), taxableAmount: fmtMoney(item.taxableAmount), cgst: String(item.cgstPercentage || item.cgst || ""), cgstPercentage: String(item.cgstPercentage || item.cgst || ""), cgstAmount: fmtMoney(item.cgstAmount), sgst: String(item.sgstPercentage || item.sgst || ""), sgstPercentage: String(item.sgstPercentage || item.sgst || ""), sgstAmount: fmtMoney(item.sgstAmount), igst: String(item.igstPercentage || item.igst || ""), igstPercentage: String(item.igstPercentage || item.igst || ""), igstAmount: fmtMoney(item.igstAmount), taxAmount: fmtMoney(item.taxAmount), otherAmount: fmtMoney(item.otherAmount), netAmount: fmtMoney(item.netAmount || item.netTotal), netTotal: fmtMoney(item.netTotal || item.netAmount) })),
            sInvReturnFooter: { grossAmount: fmtMoney(footer.totalGrossAmount), discountAmount: fmtMoney(footer.totalDiscountAmount), cgstAmount: fmtMoney(footer.totalCgstAmount), sgstAmount: fmtMoney(footer.totalSgstAmount), igstAmount: fmtMoney(footer.totalIgstAmount), taxAmount: fmtMoney(footer.totalTaxAmount), otherAmount: fmtMoney(footer.totalOtherAmount), netAmount: fmtMoney(footer.totalNetAmount), adjustedAmount: "0", balanceAmount: fmtMoney(footer.totalNetAmount), totalQuantity: footer.totalQuantity, totalGrossAmount: fmtMoney(footer.totalGrossAmount), totalDiscountAmount: fmtMoney(footer.totalDiscountAmount), totalCgstAmount: fmtMoney(footer.totalCgstAmount), totalSgstAmount: fmtMoney(footer.totalSgstAmount), totalIgstAmount: fmtMoney(footer.totalIgstAmount), totalTaxAmount: fmtMoney(footer.totalTaxAmount), totalOtherAmount: fmtMoney(footer.totalOtherAmount), totalNetAmount: fmtMoney(footer.totalNetAmount) },
        };

        try {
            if (editingRecord) {
                await dispatch(updateSalesInvoiceReturn({ sInvReturnVoucherNumber: form?.sInvReturnVoucherNumber, payload }) as any).unwrap();
                toast.success("Sales invoice updated successfully");
            } else {
                await dispatch(createSalesInvoiceReturn({ payload }) as any).unwrap();
                if (form?.sInvVoucherNumber) {
                    const poStatus = await syncPurchaseOrderStatusAfterGrn(form?.sInvVoucherNumber);
                    await fetchSalesInvoices();
                    if (poStatus === "close") toast.success("GRN created successfully and Purchase Order closed");
                    else toast.success("GRN created successfully");
                } else {
                    toast.success("GRN created successfully");
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
            if (!confirmTooltip.voucherNumber) return;
            await dispatch(deleteSalesInvoiceReturn(confirmTooltip.voucherNumber) as any).unwrap();
            toast.success("Sales invoice deleted successfully");
            fetchSalesInvoices();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete sales invoice");
        } finally {
            setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null });
        }
    };

    const handlePurchaseOrderSelect = (purchaseOrder: any) => setSelectedPurchaseOrder(purchaseOrder);

    const handlePurchaseOrderConfirm = () => {
        if (!selectedPurchaseOrder) {
            toast.error("Please select purchase order");
            return;
        }

        const poBody = selectedPurchaseOrder?.sInvBody || [];
        const products = poBody.length > 0 ? poBody.map((item: any) => {
            const unitCode = item?.unit || item?.uom || "";
            return calculateRow(normalizeRowKeys({ id: Date.now() + Math.random(), productCode: item?.productCode || "", productName: item?.productName || "", productId: item?.productId || "", productDescription: item?.productDescription || item?.description || "", productHSNCode: item?.productHSNCode || "", remarks: item?.remarks || "", quantity: item?.quantity || "", unit: unitCode, uom: item?.uom, unitName: item?.unitName || getUnitLabelFromSchema(unitCode), rate: item?.rate || "", gross: item?.gross || item?.grossAmount || 0, grossAmount: item?.grossAmount || item?.gross || 0, discount: item?.discount || item?.discountPercentage || "", discountPercentage: item?.discountPercentage || item?.discount || "", discountAmount: item?.discountAmount || 0, taxableAmount: item?.taxableAmount || 0, cgst: item?.cgst || item?.cgstPercentage || "", cgstPercentage: item?.cgstPercentage || item?.cgst || "", cgstAmount: item?.cgstAmount || 0, sgst: item?.sgst || item?.sgstPercentage || "", sgstPercentage: item?.sgstPercentage || item?.sgst || "", sgstAmount: item?.sgstAmount || 0, igst: item?.igst || item?.igstPercentage || "", igstPercentage: item?.igstPercentage || item?.igst || "", igstAmount: item?.igstAmount || 0, taxAmount: item?.taxAmount || 0, otherAmount: item?.otherAmount || 0, netAmount: item?.netAmount || item?.netTotal || 0, netTotal: item?.netTotal || item?.netAmount || 0 }));
        }) : [{ ...emptyProductRow, id: Date.now() }];

        setForm({ ...getDefaultForm(), sInvReturnSalesAccount: selectedPurchaseOrder.sInvSalesAccount || "SA021", sInvReturnRemark: selectedPurchaseOrder.sInvRemark || selectedPurchaseOrder.sInvRemark || "", sInvReturnCustomerCode: selectedPurchaseOrder.sInvCustomerCode, sInvReturnCustomerName: selectedPurchaseOrder.sInvCustomerName, sInvReturnVoucherDate: selectedPurchaseOrder.sInvVoucherDate, sInvStatus: selectedPurchaseOrder.sInvStatus || selectedPurchaseOrder.sInvReturnStatus || "open", sInvReturnStatus: selectedPurchaseOrder.sInvStatus || selectedPurchaseOrder.sInvStatus || "open", sInvVoucherNumber: selectedPurchaseOrder?.sInvVoucherNumber, products });
        setErrors({});
        setEditingRecord(null);
        setShowPurchaseOrderModal(false);
        setShowModal(true);
    };

    const footerValues = useMemo(() => ({ grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount, adjustedAmount: 0, balanceAmount: netAmount }), [grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || []).filter((field: any) => !field.isHidden).map((field: any) => {
            const rawValue = footerValues[field.key as keyof typeof footerValues] ?? 0;
            return { ...field, value: money(rawValue), rawValue };
        });
    }, [templateFields?.footer, footerValues]);

    useEffect(() => { fetchSalesInvoices(); }, []);

    useEffect(() => { dispatch(getAllTransactionSchema("salesReturn") as any); }, [dispatch]);

    useEffect(() => {
        (async () => {
            await dispatch(getAllSalesInvoice({ offset: localOffset, limit: localLimit, search: debouncedSearch, status }) as any);
        })();
    }, []);

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
        dispatch(getAllReportMapping({ moduleType: "salesReturn" }));
    }, []);

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="sales-invoice-header" className="mb-3 flex items-center">
                <div id="sales-invoice-summary" className="flex items-start gap-3">
                    <Badge {...{ count: pagination?.totalDocs ?? salesInvoiceReturns?.length ?? 0, text: "Total Sales Invoices:", varient: "primary" }} />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle {...{ arr: ["open", "close"], state: status, setState: handleStatusChange }} />
                    <SearchInput {...{ search, setSearch }} />
                    <DataREfreshButton {...{ callBackFn: handleRefresh, loading: refreshing }} />

                    <Permission module="bookez" permissionKey="salesReturn" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton {...{ callBackFn: openAddModal, text: "Add Sales Return" }} />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesInvoiceReturns}
                loading={loading}
                emptyMessage={`No ${status} sales invoice found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre) => ({ ...pre, show: true, moduleType: "salesQuotation", record, CustomerCode: record?.sQuoteCustomerCode, voucherNumber: record?.sQuoteVoucherNumber }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>

                        <Permission module="bookez" permissionKey="salesReturn" action="update">
                            <button
                                id="sales-invoice-edit-button"
                                onClick={() => openEditModal(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="salesReturn" action="delete">
                            <button
                                id="sales-invoice-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    let x = rect.left - 150;
                                    if (x < 10) x = 10;
                                    const y = rect.top + window.scrollY - 5;
                                    setConfirmTooltip({ show: true, x, y, voucherNumber: record?.sInvReturnVoucherNumber });
                                }}
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
                    onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null })}
                />
            )}

            {!fieldsLoading && (
                <DynamicAddForm
                    {...{
                        show: showModal,
                        setShow: setShowModal,
                        edit: Boolean(editingRecord),
                        title: "Sales Return",
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
                title="Select Invoice Order"
                state={false}
                handleSubmit={handlePurchaseOrderConfirm}
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
                                placeholder="Search Purchase Order code..."
                                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {invoiceLoader ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                    Loading purchase orders...
                                </div>
                            ) : salesInvoices.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                                        No purchase order found
                                    </div>
                            ) : (
                                <div className="space-y-3">
                                    {salesInvoices.map((e: any, index: number) => {
                                        const poNumber = e?.pOrdVoucherNumber || "-";
                                        const isSelected = selectedPurchaseOrder?.sInvVoucherNumber == e?.sInvVoucherNumber;
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
                                                            {e?.sInvVoucherNumber || "NA"} - {e?.sInvCustomerName || "NA"}
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                            Items: {e?.sInvBody?.length || 0}
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
            <ListingModel {...{ show: downlaodPDF?.show, downlaodPDF, entryType: "sales-return", setShow: () => setDownlaodPDF(() => ({ show: !downlaodPDF?.show })), rowData: downlaodPDF?.record, report, title: "Download Sales Return PDF" }} />
        </div>
    );
};

export default SalesReturn;