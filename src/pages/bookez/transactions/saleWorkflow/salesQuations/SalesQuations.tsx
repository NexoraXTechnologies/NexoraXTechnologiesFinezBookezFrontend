import { useEffect, useMemo, useState } from "react";
import { Delete, Download, Edit, Trash, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../../components/buttons";
import DataTable from "../../../../../components/DataTable";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import Toggle from "../../../../../components/toggle";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";
import { addSalesQuotation, deleteSalesQuotation, getSalesQuotationList, updateSalesQuotation } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesQuationsSlice";
import { fmtMoney, formatDateForInput, formatDateForList, loadAllTemplateOptions, money, num, safePercent, todayYMD } from "../../../../../utils/helperFunctions";
import type { ConfirmTooltipState } from "../salesWorkflowTypes";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";

const defaultPagination = { offset: 0, limit: 10, totalDocs: 0, totalPages: 1, currentPage: 1, hasNextPage: false, hasPrevPage: false };
const emptyProductRow = { id: Date.now(), productCode: "", productName: "", productId: "", productDescription: "", description: "", productHSNCode: "", remarks: "", quantity: "", uom: "", unit: "", unitName: "", rate: "", gross: 0, grossAmount: 0, discount: "", discountPercentage: "", discountAmount: 0, taxableAmount: 0, cgst: "", cgstPercentage: "", cgstAmount: 0, sgst: "", sgstPercentage: "", sgstAmount: 0, igst: "", igstPercentage: "", igstAmount: 0, taxAmount: 0, otherAmount: "", netAmount: 0, netTotal: 0 };

const getDefaultForm = () => ({ sQuoteVoucherNumber: "AUTO", sQuoteVoucherDate: todayYMD(), sQuoteSalesAccount: "SA021", sQuoteCustomerCode: "", sQuoteCustomerName: "", sQuoteStatus: "draft", sQuoteDocStatus: "open", sQuoteRemark: "", sQuoteStatusRemark: "", sQuoteStatusHistory: [], isAutoPost: false, products: [{ ...emptyProductRow, id: Date.now() }], grossAmount: "0.00", discountAmount: "0.00", cgstAmount: "0.00", sgstAmount: "0.00", igstAmount: "0.00", taxAmount: "0.00", otherAmount: "0.00", netAmount: "0.00" });

const SalesQuotations = () => {
    const dispatch = useDispatch();
    const { salesQuotations = [], pagination = defaultPagination, loading = false, createLoading = false, updateLoading = false, deleteLoading = false } = useSelector((state: any) => state.salesQuotation);
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema);
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
    const [templateFields, setTemplateFields] = useState<any>({ header: [], body: [], footer: [] });
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [confirmTooltip, setConfirmTooltip] = useState<ConfirmTooltipState>({ show: false, x: null, y: null, voucherNumber: null });

    const getHeaderFieldByKey = (key: string) => templateFields?.header?.find((field: any) => field.key === key);

    const getBodyFieldByKey = (key: string) => {
        return templateFields?.body?.find((field: any) => field.key === key);
    };

    const getOptionByValue = (field: any, selectedValue: any) => {
        return field?.options?.find((opt: any) => String(opt.value) === String(selectedValue));
    };

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
            { totalQuantity: 0, totalGrossAmount: 0, totalDiscountAmount: 0, totalCgstAmount: 0, totalSgstAmount: 0, totalIgstAmount: 0, totalTaxAmount: 0, totalOtherAmount: 0, totalNetAmount: 0 }
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

    const fetchSalesQuotations = async () => {
        await dispatch(getSalesQuotationList({ offset: localOffset, limit: localLimit, search: debouncedSearch, docStatus: status }) as any);
    };

    const columns = [
        { key: "sQuoteVoucherNumber", title: "Voucher No" },
        { key: "sQuoteVoucherDate", title: "Date", render: (row: any) => row?.sQuoteVoucherDate ? formatDateForList(row.sQuoteVoucherDate) : "-" },
        {
            key: "sQuoteCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">{row?.sQuoteCustomerName || "-"}</div>
                    <div className="text-xs text-slate-500">{row?.sQuoteCustomerCode || "-"}</div>
                </div>
            ),
        },
        { key: "sQuoteBody", title: "Items", render: (row: any) => row?.sQuoteBody?.length || 0 },
        {
            key: "sQuoteFooter",
            title: "Net Amount",
            render: (row: any) => <span className="font-semibold text-indigo-700">{money(row?.sQuoteFooter?.netAmount || 0)}</span>,
        },
        {
            key: "sQuoteDocStatus",
            title: "Doc Status",
            render: (row: any) => (
                <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.sQuoteDocStatus === "open" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {row?.sQuoteDocStatus || "-"}
                </span>
            ),
        },
        {
            key: "sQuoteStatus",
            title: "Quote Status",
            render: (row: any) => <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700">{row?.sQuoteStatus || "-"}</span>,
        },
    ];

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchSalesQuotations();
            toast.success("Sales quotation list refreshed");
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
        const footer = record?.sQuoteFooter || {};
        const products = record?.sQuoteBody?.length > 0 ? record.sQuoteBody.map((item: any) => {
            const unitCode = item?.unit || item?.uom || "";
            return calculateRow(normalizeRowKeys({ id: item?.id || Date.now() + Math.random(), productCode: item?.productCode || "", productName: item?.productName || "", productId: item?.productId || "", productDescription: item?.productDescription || item?.description || "", description: item?.description || item?.productDescription || "", productHSNCode: item?.productHSNCode || "", remarks: item?.remarks || "", quantity: item?.quantity || "", unit: unitCode, uom: unitCode, unitName: item?.unitName || getUnitLabelFromSchema(unitCode), rate: item?.rate || "", gross: item?.gross || item?.grossAmount || 0, grossAmount: item?.grossAmount || item?.gross || 0, discount: item?.discount || item?.discountPercentage || "", discountPercentage: item?.discountPercentage || item?.discount || "", discountAmount: item?.discountAmount || 0, taxableAmount: item?.taxableAmount || 0, cgst: item?.cgst || item?.cgstPercentage || "", cgstPercentage: item?.cgstPercentage || item?.cgst || "", cgstAmount: item?.cgstAmount || 0, sgst: item?.sgst || item?.sgstPercentage || "", sgstPercentage: item?.sgstPercentage || item?.sgst || "", sgstAmount: item?.sgstAmount || 0, igst: item?.igst || item?.igstPercentage || "", igstPercentage: item?.igstPercentage || item?.igst || "", igstAmount: item?.igstAmount || 0, taxAmount: item?.taxAmount || 0, otherAmount: item?.otherAmount || 0, netAmount: item?.netAmount || item?.netTotal || 0, netTotal: item?.netTotal || item?.netAmount || 0 }));
        }) : [{ ...emptyProductRow, id: Date.now() }];

        setEditingRecord(true);
        setErrors({});
        setForm({ sQuoteVoucherNumber: record?.sQuoteVoucherNumber || "AUTO", sQuoteVoucherDate: formatDateForInput(record?.sQuoteVoucherDate), sQuoteCustomerCode: record?.sQuoteCustomerCode || "", sQuoteCustomerName: record?.sQuoteCustomerName || "", sQuoteSalesAccount: record?.sQuoteSalesAccount || "SA021", sQuoteDocStatus: record?.sQuoteDocStatus || "open", sQuoteStatus: record?.sQuoteStatus || "draft", sQuoteRemark: record?.sQuoteRemark || "", sQuoteStatusRemark: record?.sQuoteStatusRemark || "", sQuoteStatusHistory: record?.sQuoteStatusHistory || [], isAutoPost: record?.isAutoPost || false, products, grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00", discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00", cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00", sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00", igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00", taxAmount: footer?.taxAmount || footer?.totalTaxAmount || "0.00", otherAmount: footer?.otherAmount || footer?.totalOtherAmount || "0.00", netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00" });
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
            if (value === undefined || value === null || value === "") err[field.key] = `${field.label || field.key} is required`;
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
                if (value === undefined || value === null || value === "") err[`row_${index}_${field.key}`] = `${field.label || field.key} is required`;
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
            sQuoteVoucherDate: form.sQuoteVoucherDate,
            sQuoteCustomerCode: form.sQuoteCustomerCode,
            sQuoteCustomerName: form.sQuoteCustomerName,
            sQuoteSalesAccount: form.sQuoteSalesAccount || "SA021",
            sQuoteStatus: form.sQuoteStatus || "draft",
            sQuoteDocStatus: form.sQuoteDocStatus || "open",
            sQuoteRemark: form.sQuoteRemark,
            sQuoteBody: products.map((item: any) => ({ productCode: item.productCode, productName: item.productName, productId: item.productId, productDescription: item.productDescription || item.description, description: item.description || item.productDescription, productHSNCode: item.productHSNCode, remarks: item.remarks, quantity: String(item.quantity), unit: item.unit || item.uom, uom: item.uom || item.unit, rate: String(item.rate), gross: fmtMoney(item.grossAmount), grossAmount: fmtMoney(item.grossAmount), discount: String(item.discountPercentage || item.discount || ""), discountPercentage: String(item.discountPercentage || item.discount || ""), discountAmount: fmtMoney(item.discountAmount), taxableAmount: fmtMoney(item.taxableAmount), cgst: String(item.cgstPercentage || item.cgst || ""), cgstPercentage: String(item.cgstPercentage || item.cgst || ""), cgstAmount: fmtMoney(item.cgstAmount), sgst: String(item.sgstPercentage || item.sgst || ""), sgstPercentage: String(item.sgstPercentage || item.sgst || ""), sgstAmount: fmtMoney(item.sgstAmount), igst: String(item.igstPercentage || item.igst || ""), igstPercentage: String(item.igstPercentage || item.igst || ""), igstAmount: fmtMoney(item.igstAmount), taxAmount: fmtMoney(item.taxAmount), otherAmount: fmtMoney(item.otherAmount), netAmount: fmtMoney(item.netAmount || item.netTotal), netTotal: fmtMoney(item.netTotal || item.netAmount) })),
            sQuoteFooter: { grossAmount: fmtMoney(footer.totalGrossAmount), discountAmount: fmtMoney(footer.totalDiscountAmount), cgstAmount: fmtMoney(footer.totalCgstAmount), sgstAmount: fmtMoney(footer.totalSgstAmount), igstAmount: fmtMoney(footer.totalIgstAmount), taxAmount: fmtMoney(footer.totalTaxAmount), otherAmount: fmtMoney(footer.totalOtherAmount), netAmount: fmtMoney(footer.totalNetAmount), adjustedAmount: "0", balanceAmount: fmtMoney(footer.totalNetAmount), totalQuantity: footer.totalQuantity, totalGrossAmount: fmtMoney(footer.totalGrossAmount), totalDiscountAmount: fmtMoney(footer.totalDiscountAmount), totalCgstAmount: fmtMoney(footer.totalCgstAmount), totalSgstAmount: fmtMoney(footer.totalSgstAmount), totalIgstAmount: fmtMoney(footer.totalIgstAmount), totalTaxAmount: fmtMoney(footer.totalTaxAmount), totalOtherAmount: fmtMoney(footer.totalOtherAmount), totalNetAmount: fmtMoney(footer.totalNetAmount) },
        };

        try {
            if (editingRecord) {
                await dispatch(updateSalesQuotation({ sQuoteVoucherNumber: form?.sQuoteVoucherNumber, payload }) as any).unwrap();
                toast.success("Sales quotation updated successfully");
            } else {
                await dispatch(addSalesQuotation({ payload }) as any).unwrap();
                toast.success("Sales quotation created successfully");
            }
            setShowModal(false);
            resetMainForm();
            fetchSalesQuotations();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip.voucherNumber) return;
            await dispatch(deleteSalesQuotation({ sQuoteVoucherNumber: confirmTooltip.voucherNumber }) as any).unwrap();
            toast.success("Sales quotation deleted");
            fetchSalesQuotations();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete sales quotation");
        } finally {
            setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null });
        }
    };

    const footerValues = useMemo(() => {
        return { grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount, adjustedAmount: 0, balanceAmount: netAmount };
    }, [grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || []).filter((field: any) => !field.isHidden).map((field: any) => {
            const rawValue = footerValues[field.key as keyof typeof footerValues] ?? 0;
            return { ...field, value: money(rawValue), rawValue };
        });
    }, [templateFields?.footer, footerValues]);

    useEffect(() => {
        dispatch(getAllTransactionSchema("salesQuotation") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchSalesQuotations();
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

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div id="sales-quotation-header" className="mb-3 flex items-center">
                <div id="sales-quotation-summary" className="flex items-start gap-3">
                    <Badge {...{ count: pagination?.totalDocs ?? 0, text: "Total Sales Quotations:", varient: "primary" }} />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Toggle {...{ arr: ["open", "close"], state: status, setState: handleStatusChange }} />
                    <SearchInput {...{ search, setSearch }} />
                    <DataREfreshButton {...{ callBackFn: handleRefresh, loading: refreshing }} />
                    {/* @ts-ignore */}
                    <DataCreateButton {...{ callBackFn: openAddModal, text: "Add Sales Quotation" }} />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesQuotations}
                loading={loading}
                emptyMessage={`No ${status} sales quotation found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        {/* <button id="sales-quotation-edit-button" onClick={downloadPdfWithoutLibrary} className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700">
                            <Download size={16} />
                        </button> */}
                        <button id="sales-quotation-edit-button" onClick={() => openEditModal(record)} className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700">
                            <Edit size={16} />
                        </button>
                        <button
                            id="sales-quotation-delete-button"
                            disabled={deleteLoading}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                let x = rect.left - 150;
                                if (x < 10) x = 10;
                                const y = rect.top + window.scrollY - 5;
                                setConfirmTooltip({ show: true, x, y, voucherNumber: record?.sQuoteVoucherNumber });
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
                    message="Are you sure you want to delete this sales quotation?"
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
                        title: "Sales Quotation",
                        subtitle: "Fill in the sales quotation details below",
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
        </div>
    );
};

export default SalesQuotations;


const downloadPdfWithoutLibrary = () => {
    try {
        const iframe = document.createElement("iframe");

        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";

        document.body.appendChild(iframe);

        const iframeDoc =
            iframe.contentDocument || iframe.contentWindow?.document;

        if (!iframeDoc) {
            console.log("Unable to create PDF iframe");
            return;
        }

        iframeDoc.open();
        iframeDoc.write(html); // ✅ your full HTML string
        iframeDoc.close();

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();

                // cleanup after print dialog opens
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        };
    } catch (error) {
        console.log("PDF print failed:", error);
    }
};
const PRIMARY = ""
const companyName = ""
const companyAddress = ""
const companyGstBlock = ""
const companyLogo = ""
const entryType = ""
const companyMobile = ""
const companyEmail = ""
const billToName = ""
const billGstBlock = ""
const billToAddress =""
const invNo =""
const invDate =""
const gstHeaderTh =""
const includeGst =""
const totalAccQty =""
const items =[]


const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sample PDF Document</title>

<style>
    body {
        font-family: Arial, sans-serif;
        background: #f0f0f0;
        margin: 0;
        padding: 20px;
    }

    .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 20mm;
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        box-sizing: border-box;
    }

    h1 {
        color: #2c3e50;
        margin-bottom: 10px;
    }

    h2 {
        color: #34495e;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
    }

    p {
        line-height: 1.6;
        color: #333;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    table, th, td {
        border: 1px solid #ccc;
    }

    th {
        background: #f5f5f5;
    }

    th, td {
        padding: 10px;
        text-align: left;
    }

    @media print {
        body {
            background: white;
            padding: 0;
        }

        .page {
            box-shadow: none;
            margin: 0;
            width: auto;
            min-height: auto;
        }
    }
</style>
</head>
<body>

<div class="page">
    <h1>Sample PDF Document</h1>
    <p>
        This is a sample HTML document designed for PDF generation.
        You can print this page as PDF using your browser.
    </p>

    <h2>Overview</h2>
    <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </p>

    <h2>Sample Table</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Department</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>001</td>
                <td>John Doe</td>
                <td>Engineering</td>
            </tr>
            <tr>
                <td>002</td>
                <td>Jane Smith</td>
                <td>Marketing</td>
            </tr>
            <tr>
                <td>003</td>
                <td>Michael Brown</td>
                <td>Finance</td>
            </tr>
        </tbody>
    </table>

    <h2>Conclusion</h2>
    <p>
        This document demonstrates headings, paragraphs, and tables
        formatted for PDF export.
    </p>
</div>

</body>
</html>`
// const html = `
//   <html>
//     <head>
//       <meta charset="utf-8" />
//       <style>
//         @page {
//           margin-top: 40px;
//           margin-bottom: 40px;
//           margin-left: 30px;
//           margin-right: 30px;
//         }
//         * { box-sizing: border-box; }
//         body { font-family: Helvetica, Arial, sans-serif; color: #111; font-size: 12px; }
//         .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
//         .company h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
//         .company p { margin: 0; line-height: 1.6; }
//         .logo { width: 90px; height: 90px; object-fit: contain; }
//         .divider { height: 2px; background: ${PRIMARY}; margin: 14px 0 14px; opacity: 0.9; }
//         .title { text-align: center; font-size: 22px; font-weight: 700; color: ${PRIMARY}; margin: 0 0 8px; }
//         .sectionRow { display: flex; justify-content: space-between; margin-top: 10px; }
//         .bill, .details { width: 48%; }
//         .sectionTitle {  font-weight: 700; margin-bottom: 10px; }
//         .bill p { margin: 0 0 8px; }
//         .details .sectionTitle { text-align: right; }
//         .details .kv { text-align: right; margin: 0 0 8px; }
//         table { width: 100%; border-collapse: collapse; margin-top: 18px; border: 0.5px solid #bbb; font-size: 12px; }
//         thead th {
//           background: ${PRIMARY};
//           color: #fff;
//           padding: 9px 6px;
//           text-align: center;
//           border: 0.5px solid #aad;
//         }
//         tbody td {
//           padding: 9px 6px;
//           vertical-align: top;
//           text-align: center;
//           border: 0.5px solid #ccc;
//         }
//         .colNum  { width: 28px; }
//         .colItem { width: 200px; text-align: left; }
//         .colQty  { width: 90px; }
//         .colPrice{ width: 100px; }
//         .colGst  { width: 140px; }
//         .colAmt  { width: 120px; }
//         .gstSmall { display: block; margin-top: 3px; color: #555; font-size: 9px; }
//         .money { white-space: nowrap; }
//         .itemMeta { display: block; margin-top: 3px; font-size: 10px; color: #666; }
//         .dimCell { color: #999; }
//         .tableTotal td {
//           border-top: 1px solid #999;
//           border-bottom: 1px solid #999;
//           font-weight: 700;
//           padding-top: 10px;
//           padding-bottom: 10px;
//         }
//         .belowRow { display:flex; justify-content:space-between; gap: 18px; margin-top: 18px; }
//         .belowLeft { flex: 1; }
//         .belowRight { width: 460px; }
//         .blkTitle { font-weight: 700; margin: 0 0 10px; }
//         .blkText { line-height: 1.6; margin: 0; }
//         .sumTable { width:100%; border-collapse:collapse;  }
//         .sumTable td { padding: 8px 10px; }
//         .sumLabel { width: 55%; }
//         .sumAmt { width: 45%; text-align:right; white-space:nowrap; }
//         .sumTotalRow td { background:${PRIMARY}; color:#fff; font-weight:700; }
//         .payRow { display:flex; justify-content:space-between; align-items:flex-start; gap: 18px; margin-top: 18px; }
//         .payLeft { flex: 1; display:flex; gap: 16px; align-items:flex-start; }
//         /* ✅ bigger QR -> scannable after PDF render */
//         .qr { width: 160px; height: 160px; object-fit: contain; border: 1px solid #ddd; padding: 6px; }
//         .payInfo {  line-height: 1.7; }
//         .payInfo b { font-weight: 700; }
//         .signRight { width: 360px; text-align:right; }
//         .signRight .for {  margin-bottom: 10px; }
//         .signImg { height: 70px; object-fit: contain; margin: 10px 0; }
//         .signText { font-weight: 700; margin-top: 6px; }
//         .upiLink {
//           display:inline-block;
//           margin-top: 8px;
//           font-weight: 700;
//           color: #0b63ff;
//           text-decoration: none;
//         }
//         .upiMeta { color: #555; margin-top: 4px; }
//         .siteNote { text-align:left; margin-top: 10px;  color: #0b63ff; }
//       </style>
//     </head>
//     <body>
//       <div class="row">
//         <div class="company" style="max-width: 50%;">
//           <h1>${escapeHtml(companyName || 'Company Name')}</h1>
//           <p><strong>Address:</strong> ${escapeHtml(companyAddress)}</p>
//           <p><strong>Phone no:</strong> ${escapeHtml(companyMobile)}</p>
//           <p><strong>Email:</strong> ${escapeHtml(companyEmail)}</p>
//           ${companyGstBlock}
//         </div>
//         ${companyLogo
//         ? `<img class="logo" src="${companyLogo}" />`
//         : `<div style="width:90px;height:90px;"></div>`
//     }
//       </div>
//       <div class="divider"></div>
//       <div class="title">${escapeHtml(
//         titleCase(entryType || 'Tax Invoice'),
//     )}</div>
//       <div class="sectionRow">
//         <div class="bill">
//           <div class="sectionTitle">Bill To</div>
//           <p><strong>Name:</strong> ${escapeHtml(billToName)}</p>
//           <p><strong>Address:</strong> ${escapeHtml(billToAddress)}</p>
//           ${billGstBlock}
//         </div>
//         <div class="details">
//           <div class="sectionTitle">Invoice Details</div>
//           <p class="kv"><strong>Invoice No.:</strong> ${escapeHtml(invNo)}</p>
//           <p class="kv"><strong>Date:</strong> ${escapeHtml(
//         formatDate(invDate),
//     )}</p>
//         </div>
//       </div>
//       <table>
//         <thead>
//           <tr>
//             <th class="colNum">#</th>
//             <th class="colItem">Item Name</th>
//             ${entryType === 'GRN'
//         ? `<th class="colQty">Accepted Qty</th><th class="colQty">Rejected Qty</th>`
//         : `<th class="colQty">Quantity</th>`
//     }
//             <th class="colPrice">Rate</th>
//             <th class="colPrice">Discount % </th>
//             ${gstHeaderTh}
//             <th class="colAmt">Amount</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${items
//         .map((it, idx) => {
//             return `
//                 <tr>
//                   <td class="colNum">${idx + 1}</td>
//                   <td class="colItem">
//                     ${escapeHtml(it.productName || '—')}
//                     ${it.productHSNCode
//                     ? `<span class="itemMeta">HSN: ${escapeHtml(
//                         it.productHSNCode,
//                     )}</span>`
//                     : ''
//                 }
//                   </td>
//                   ${entryType === 'GRN'
//                     ? `<td class="colQty">${escapeHtml(
//                         String(it.acceptedQuantity ?? ''),
//                     )}${it.uomLabel && it.uomLabel !== '-'
//                         ? `<span class="itemMeta">${escapeHtml(
//                             it.uomLabel,
//                         )}</span>`
//                         : ''
//                     }</td>
//                          <td class="colQty">${escapeHtml(
//                         String(it.rejectedQuantity ?? ''),
//                     )}${it.uomLabel && it.uomLabel !== '-'
//                         ? `<span class="itemMeta">${escapeHtml(
//                             it.uomLabel,
//                         )}</span>`
//                         : ''
//                     }</td>`
//                     : `<td class="colQty">${escapeHtml(
//                         String(it.qty || ''),
//                     )}${it.uomLabel && it.uomLabel !== '-'
//                         ? `<span class="itemMeta">${escapeHtml(
//                             it.uomLabel,
//                         )}</span>`
//                         : ''
//                     }</td>`
//                 }
//                   <td class="colPrice"><span class="money">₹ ${formatIndianNumber(
//                     it.rate,
//                 )}</span></td>
//                   <td class="colPrice">${toNum(it.discount) > 0
//                     ? `<span class="money">₹ ${formatIndianNumber(
//                         it.discount,
//                     )} % </span>`
//                     : `<span class="dimCell">—</span>`
//                 }</td>
//                   ${includeGst
//                     ? `<td class="colGst">${renderGstHtml(it)}</td>`
//                     : ''
//                 }
//                   <td class="colAmt"><span class="money">₹ ${formatIndianNumber(
//                     includeGst ? it.net : it.taxable,
//                 )}</span></td>
//                 </tr>
//               `;
//         })
//         .join('')}
//           <tr class="tableTotal">
//             <td class="colNum"></td>
//             <td class="colItem"><strong>Total</strong></td>
//             ${entryType === 'GRN'
//         ? `<td class="colQty"><strong>${formatIndianNumber(
//             totalAccQty,
//         )}</strong></td>
//                    <td class="colQty"><strong>${formatIndianNumber(
//             totalRejQty,
//         )}</strong></td>`
//         : `<td class="colQty"><strong>${formatIndianNumber(
//             totalQty,
//         )}</strong></td>`
//     }
//             <td class="colPrice"></td>
//             <td class="colPrice"></td>
//             ${includeGst ? `<td class="colGst"></td>` : ''}
//             <td class="colAmt"><strong>₹ ${formatIndianNumber(
//         pdfGrandTotal,
//     )}</strong></td>
//           </tr>
//         </tbody>
//       </table>
//       <div class="belowRow">
//         <div class="belowLeft">
//           <div class="blkTitle">Invoice Amount In Words</div>
//           <p class="blkText">${escapeHtml(amountWords)}</p>
//           <div style="height:16px;"></div>
//           <div class="blkTitle">Thank you for doing business with us.</div>
//           ${entryType === 'sales-invoice'
//         ? `${upiUrl
//             ? `<a class="upiLink" href="${upiUrl}">Pay with UPI (GPay / PhonePe)</a>
//                  <div class="upiMeta">UPI ID: ${escapeHtml(
//                 upiId,
//             )} • Amount: ₹ ${formatIndianNumber(pdfGrandTotal)}</div>`
//             : `<div class="upiMeta">UPI not configured in Company Master.</div>`
//         }`
//         : ''
//     }
//           <div style="height:16px;"></div>
//           ${normalized.doc.sInvRemark
//         ? ` <div class="blkTitle">
//                 Remark:- ${normalized?.doc?.sInvRemark}
//               </div>`
//         : ''
//     }
//         </div>
//         <div class="belowRight">
//          <table class="sumTable">
//         <tr>
//           <td class="sumLabel">Sub Total</td>
//           <td class="sumAmt">₹ ${formatIndianNumber(sumTableSubTotal)}</td>
//         </tr>
 
//         ${gstSummaryRows}
//          ${discountAmt > 0
//         ? `<tr>
//         <td class="sumLabel">Discount</td>
//         <td class="sumAmt">₹ ${formatIndianNumber(discountAmt)}</td>
//       </tr>`
//         : ''
//     }
//         ${extraFooterRows}
//         <tr class="sumTotalRow">
//           <td class="sumLabel">Total</td>
//           <td class="sumAmt">₹ ${formatIndianNumber(pdfGrandTotal)}</td>
//         </tr>
//       </table>
//         </div>
//       </div>
//       <div class="payRow">
//         ${entryType === 'sales-invoice'
//         ? `<div class="payLeft">
//           ${upiQrUri
//             ? `<img class="qr" src="${upiQrUri}" />`
//             : `<div class="qr" style="display:flex;align-items:center;justify-content:center;color:#888;">
//                    UPI QR not available
//                  </div>`
//         }
//           <div class="payInfo">
//             <div><b>Pay To:</b></div>
//             <div>Bank Name: ${escapeHtml(bankName)}</div>
//             <div>Bank Account No: ${escapeHtml(bankAcc)}</div>
//             <div>Bank IFSC code: ${escapeHtml(bankIfsc)}</div>
//             <div>Account Holder's Name: ${escapeHtml(companyName)}</div>
//           </div>
//         </div>`
//         : `<div class="payLeft"></div>`
//     }
//         <div class="signRight">
//           <div class="for">For: ${escapeHtml(companyName)}</div>
//           ${signatureUri
//         ? `<img class="signImg" src="${signatureUri}" />`
//         : `<div style="height:70px;"></div>`
//     }
//           <div class="signText">Authorized Signatory</div>
//         </div>
//       </div>
//     </body>
//   </html>
//   `;
