import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
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
import {
    addSalesQuotation,
    deleteSalesQuotation,
    getSalesQuotationList,
    updateSalesQuotation,
} from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesQuationsSlice";
import {
    fmtMoney,
    formatDateForInput,
    formatDateForList,
    loadAllTemplateOptions,
    money,
    num,
    safePercent,
    todayYMD,
} from "../../../../../utils/helperFunctions";
import type { ConfirmTooltipState } from "../salesWorkflowTypes";
import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import { getAllReportMapping } from "../../../../../redux/slices/professionalSlice/reportMappingSlice";
import { ListingModel } from "../../../../../components/modal";
import Permission from "../../../../../components/PermissionGuard";

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
    sQuoteVoucherNumber: "AUTO",
    sQuoteVoucherDate: todayYMD(),
    sQuoteSalesAccount: "SA021",
    sQuoteCustomerCode: "",
    sQuoteCustomerName: "",
    sQuoteStatus: "draft",
    sQuoteDocStatus: "open",
    sQuoteRemark: "",
    sQuoteStatusRemark: "",
    sQuoteStatusHistory: [],
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

const SalesQuotations = () => {
    const dispatch = useDispatch();

    const {
        salesQuotations = [],
        pagination = defaultPagination,
        loading = false,
        createLoading = false,
        updateLoading = false,
        deleteLoading = false,
    } = useSelector((state: any) => state.salesQuotation);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

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

    const [confirmTooltip, setConfirmTooltip]: any =
        useState<ConfirmTooltipState>({
            show: false,
            x: null,
            y: null,
            voucherNumber: null,
        });

    const [downlaodPDF, setDownlaodPDF]: any = useState({
        show: false,
        type: "",
    });

    const { report } = useSelector((s: any) => s.reportMapping);

    const getHeaderFieldByKey = (key: string) =>
        templateFields?.header?.find((field: any) => field.key === key);

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

        return {
            ...row,
            quantity: row.quantity,
            rate: row.rate,
            discount: row.discount,
            cgst: row.cgst,
            sgst: row.sgst,
            igst: row.igst,
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
        await dispatch(
            getSalesQuotationList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                docStatus: status,
            }) as any
        );
    };

    const columns = [
        { key: "sQuoteVoucherNumber", title: "Voucher No" },
        {
            key: "sQuoteVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.sQuoteVoucherDate ? formatDateForList(row.sQuoteVoucherDate) : "-",
        },
        {
            key: "sQuoteCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.sQuoteCustomerName || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.sQuoteCustomerCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "sQuoteBody",
            title: "Items",
            render: (row: any) => row?.sQuoteBody?.length || 0,
        },
        {
            key: "sQuoteFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.sQuoteFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "sQuoteDocStatus",
            title: "Doc Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.sQuoteDocStatus === "open"
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-danger/20 bg-danger/10 text-danger"
                        }`}
                >
                    {row?.sQuoteDocStatus || "-"}
                </span>
            ),
        },
        {
            key: "sQuoteStatus",
            title: "Quote Status",
            render: (row: any) => (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {row?.sQuoteStatus || "-"}
                </span>
            ),
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

        const products =
            record?.sQuoteBody?.length > 0
                ? record.sQuoteBody.map((item: any) => {
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
                })
                : [{ ...emptyProductRow, id: Date.now() }];

        setEditingRecord(true);
        setErrors({});

        setForm({
            sQuoteVoucherNumber: record?.sQuoteVoucherNumber || "AUTO",
            sQuoteVoucherDate: formatDateForInput(record?.sQuoteVoucherDate),
            sQuoteCustomerCode: record?.sQuoteCustomerCode || "",
            sQuoteCustomerName: record?.sQuoteCustomerName || "",
            sQuoteSalesAccount: record?.sQuoteSalesAccount || "SA021",
            sQuoteDocStatus: record?.sQuoteDocStatus || "open",
            sQuoteStatus: record?.sQuoteStatus || "draft",
            sQuoteRemark: record?.sQuoteRemark || "",
            sQuoteStatusRemark: record?.sQuoteStatusRemark || "",
            sQuoteStatusHistory: record?.sQuoteStatusHistory || [],
            isAutoPost: record?.isAutoPost || false,
            products,
            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount:
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
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
            products: [...(prev.products || []), { ...emptyProductRow, id: Date.now() }],
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
        const duplicate = Boolean(
            form?.products?.filter((e: any) => e?.productCode == value)?.length
        );

        if (duplicate) {
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

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(currentField, value, updatedRow);
            }

            const selectedOption = getOptionByValue(currentField, value);

            if (selectedOption?.raw?._id && !updatedRow.productId) {
                updatedRow.productId = selectedOption.raw._id;
            }

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
        }));
    };

    const getFilledRows = () => {
        const bodyKeys = (templateFields?.body || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => field.key);

        return (form.products || []).filter((row: any) =>
            bodyKeys.some((key: string) => {
                const value = row?.[key];
                return value !== undefined && value !== null && value !== "";
            })
        );
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
            const hasAnyValue = (templateFields?.body || []).some((field: any) => {
                const value = row?.[field.key];
                return value !== undefined && value !== null && value !== "";
            });

            if (!hasAnyValue) return;

            (templateFields?.body || []).forEach((field: any) => {
                if (field.isHidden) return;
                if (!field.isRequired) return;

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
            sQuoteVoucherDate: form.sQuoteVoucherDate,
            sQuoteCustomerCode: form.sQuoteCustomerCode,
            sQuoteCustomerName: form.sQuoteCustomerName,
            sQuoteSalesAccount: form.sQuoteSalesAccount || "SA021",
            sQuoteStatus: form.sQuoteStatus || "draft",
            sQuoteDocStatus: form.sQuoteDocStatus || "open",
            sQuoteRemark: form.sQuoteRemark,
            sQuoteBody: products.map((item: any) => ({
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,
                productDescription: item.productDescription || item.description,
                description: item.description || item.productDescription,
                productHSNCode: item.productHSNCode,
                remarks: item.remarks,
                quantity: String(item.quantity),
                unit: item.unit || item.uom,
                uom: item.uom || item.unit,
                rate: String(item.rate),
                gross: fmtMoney(item.grossAmount),
                grossAmount: fmtMoney(item.grossAmount),
                discount: String(item.discountPercentage || item.discount || ""),
                discountPercentage: String(
                    item.discountPercentage || item.discount || ""
                ),
                discountAmount: fmtMoney(item.discountAmount),
                taxableAmount: fmtMoney(item.taxableAmount),
                cgst: String(item.cgstPercentage || item.cgst || ""),
                cgstPercentage: String(item.cgstPercentage || item.cgst || ""),
                cgstAmount: fmtMoney(item.cgstAmount),
                sgst: String(item.sgstPercentage || item.sgst || ""),
                sgstPercentage: String(item.sgstPercentage || item.sgst || ""),
                sgstAmount: fmtMoney(item.sgstAmount),
                igst: String(item.igstPercentage || item.igst || ""),
                igstPercentage: String(item.igstPercentage || item.igst || ""),
                igstAmount: fmtMoney(item.igstAmount),
                taxAmount: fmtMoney(item.taxAmount),
                otherAmount: fmtMoney(item.otherAmount),
                netAmount: fmtMoney(item.netAmount || item.netTotal),
                netTotal: fmtMoney(item.netTotal || item.netAmount),
            })),
            sQuoteFooter: {
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
                    updateSalesQuotation({
                        sQuoteVoucherNumber: form?.sQuoteVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

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

            await dispatch(
                deleteSalesQuotation({
                    sQuoteVoucherNumber: confirmTooltip.voucherNumber,
                }) as any
            ).unwrap();

            toast.success("Sales quotation deleted");
            fetchSalesQuotations();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete sales quotation");
        } finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
            });
        }
    };

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
                const rawValue = footerValues[field.key as keyof typeof footerValues] ?? 0;

                return {
                    ...field,
                    value: money(rawValue),
                    rawValue,
                };
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

    useEffect(() => {
        {
            /* @ts-ignore  */
        }
        dispatch(getAllReportMapping({ moduleType: "salesQuotation" }));
    }, []);

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="sales-quotation-header" className="mb-3 flex items-center">
                <div id="sales-quotation-summary" className="flex items-start gap-3">
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Sales Quotations:",
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

                    <Permission
                        module="bookez"
                        permissionKey="salesQuotation"
                        action="create"
                    >
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openAddModal,
                                text: "Add Sales Quotation",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesQuotations}
                loading={loading}
                emptyMessage={`No ${status} sales quotation found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "salesQuotation",
                                    record,
                                    CustomerCode: record?.sQuoteCustomerCode,
                                    voucherNumber: record?.sQuoteVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>

                        <Permission
                            module="bookez"
                            permissionKey="salesQuotation"
                            action="update"
                        >
                            <button
                                id="sales-quotation-edit-button"
                                onClick={() => openEditModal(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission
                            module="bookez"
                            permissionKey="salesQuotation"
                            action="delete"
                        >
                            <button
                                id="sales-quotation-delete-button"
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
                                    });
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
                    message="Are you sure you want to delete this sales quotation?"
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

            {downlaodPDF.show && (
                <ConfirmTooltip
                    x={downlaodPDF.x}
                    y={downlaodPDF.y}
                    message="Are you sure you want to delete this sales quotation?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    // onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setDownlaodPDF({
                            show: false,
                            x: null,
                            y: null,
                        })
                    }
                />
            )}

            {/* @ts-ignore  */}
            <ListingModel
                {...{
                    show: downlaodPDF?.show,
                    downlaodPDF,
                    entryType: "sales-quotation",
                    setShow: () =>
                        setDownlaodPDF(() => ({
                            show: !downlaodPDF?.show,
                        })),
                    rowData: downlaodPDF?.record,
                    report,
                    title: "Download Sales Quotation PDF",
                    cancelText: "Cancel",
                    confirmText: "Confirm",
                }}
            />

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

export default SalesQuotations;