import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
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
import InputBorderLabel from "../../../../../components/common/InputBorderLabel";

import { getAllTransactionSchema } from "../../../../../redux/slices/professionalSlice/transactionSchema";
import { getProductBalance } from "../../../../../redux/slices/professionalSlice/productMasterSlice";
import professionalAxios from "../../../../../services/professionalAxios";
import { formatDateForInput, formatDateForList, loadAllTemplateOptions, money, num, todayYMD } from "../../../../../utils/helperFunctions";

const MODULE_CODE = "issueToProduction";
const MODULE_NAME = "Issue to Production";
const API_BASE = "/eTaxSolnMongoApiBackend/users/bookez/otherApi/issuesToProduction";
const PRODUCT_FIELD_KEYS = new Set(["productCode", "productName", "productId", "product"]);

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const getFinancialYearRange = (dateValue?: string) => {
    const selectedDate = dateValue ? new Date(`${dateValue}T23:59:59.999`) : new Date();
    const financialYear = selectedDate.getMonth() >= 3 ? selectedDate.getFullYear() : selectedDate.getFullYear() - 1;
    return {
        fromDate: new Date(financialYear, 3, 1, 0, 0, 0, 0).toISOString(),
        toDate: selectedDate.toISOString(),
    };
};

const isTrueValue = (value: any) => value === true || String(value ?? "").trim().toLowerCase() === "true";

const getFieldDefaultValue = (field: any) => {
    if (field?.defaultValue !== undefined && field?.defaultValue !== null) return field.defaultValue;

    const type = String(field?.type || "").trim().toLowerCase();
    if (type === "boolean") return false;
    if (type === "number" || type === "amount" || type === "currency") return "";
    return "";
};

const renderIssueToProductionCellExtra = (column: any, row: any) => {
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

const IssueToProduction = () => {
    const dispatch = useDispatch<any>();
    const { transactionsSchema } = useSelector((state: any) => state.getAllTransactionSchema || {});

    const [records, setRecords] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(defaultPagination);
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [status, setStatus] = useState("open");
    const [listingLoader, setListingLoader] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteLoader, setDeleteLoader] = useState(false);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucherNumber, setEditingVoucherNumber] = useState<string | null>(null);
    const [templateFields, setTemplateFields] = useState<any>({ header: [], headerChild: [], body: [], footer: [] });
    const [form, setForm] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [confirmTooltip, setConfirmTooltip] = useState<any>({ show: false, x: null, y: null, voucherNumber: null });

    const buildBlankRow = (fields: any[] = templateFields?.body || []) => {
        const row: any = { id: Date.now() + Math.random(), availableQuantity: null, productType: "" };
        (fields || []).forEach((field: any) => {
            if (!field?.key) return;
            row[field.key] = getFieldDefaultValue(field);
        });
        return row;
    };

    const buildBlankForm = (schema: any = templateFields) => {
        const next: any = {};

        [...(schema?.header || []), ...(schema?.headerChild || [])].forEach((field: any) => {
            if (!field?.key) return;
            next[field.key] = getFieldDefaultValue(field);
        });

        next.voucherNumber = next.voucherNumber || "AUTO";
        next.voucherDate = next.voucherDate || todayYMD();
        next.status = next.status || "open";
        next.transactionType = next.transactionType || "ISSUE_TO_PRODUCTION";
        next.rawMaterials = [buildBlankRow(schema?.body || [])];

        return next;
    };

    const getOptionByValue = (field: any, value: any) => {
        return (field?.options || []).find((option: any) => String(option?.value) === String(value));
    };

    const getBodyFieldByKey = (key: string) => {
        return (templateFields?.body || []).find((field: any) => String(field?.key) === String(key));
    };

    const applyMappedFields = (field: any, selectedValue: any, oldData: any) => {
        if (!field) return oldData;

        const selectedOption = getOptionByValue(field, selectedValue);
        const raw = selectedOption?.raw || {};
        const updated = { ...oldData, [field.key]: selectedValue };

        if (field?.mapFields && raw) {
            Object.entries(field.mapFields).forEach(([targetKey, sourceKey]) => {
                updated[targetKey] =
                    raw?.[sourceKey as string] ??
                    raw?.dynamicFields?.[sourceKey as string] ??
                    raw?.[String(sourceKey).toLowerCase()] ??
                    raw?.[String(sourceKey).toUpperCase()] ??
                    "";
            });
        }

        return updated;
    };

    const calculateRow = (row: any) => {
        const quantity = num(row?.quantity);
        const rate = num(row?.rate);
        const amount = quantity * rate;

        return { ...row, amount, gross: row?.gross !== undefined ? amount : row?.gross, grossAmount: row?.grossAmount !== undefined ? amount : row?.grossAmount };
    };

    const cleanRawMaterials = (rows: any[] = form?.rawMaterials || []) => {
        const schemaKeys = new Set((templateFields?.body || []).map((field: any) => field?.key).filter(Boolean));

        return (rows || [])
            .filter((row: any) => {
                return Array.from(schemaKeys).some((key: any) => {
                    const value = row?.[key];
                    return value !== "" && value !== null && value !== undefined;
                });
            })
            .map((row: any) => {
                const calculated = calculateRow(row);
                const cleanRow: any = {};

                schemaKeys.forEach((key: any) => {
                    cleanRow[key] = calculated?.[key];
                });

                if (cleanRow.productCode === undefined && calculated?.productCode) cleanRow.productCode = calculated.productCode;
                if (cleanRow.productName === undefined && calculated?.productName) cleanRow.productName = calculated.productName;
                if (cleanRow.productId === undefined && calculated?.productId) cleanRow.productId = calculated.productId;
                if (cleanRow.unit === undefined && calculated?.unit) cleanRow.unit = calculated.unit;
                if (cleanRow.uom === undefined && calculated?.uom) cleanRow.uom = calculated.uom;
                if (cleanRow.quantity !== undefined) cleanRow.quantity = String(cleanRow.quantity ?? "");
                if (cleanRow.rate !== undefined) cleanRow.rate = String(cleanRow.rate ?? "");
                if (cleanRow.amount !== undefined) cleanRow.amount = String(num(cleanRow.amount).toFixed(2));

                return cleanRow;
            });
    };

    const footerTotals = useMemo(() => {
        const rows = (form?.rawMaterials || []).map((row: any) => calculateRow(row));
        return rows.reduce(
            (acc: any, row: any) => {
                acc.totalIssuedQuantity += num(row?.quantity);
                acc.totalRawMaterialCost += num(row?.amount);
                return acc;
            },
            { totalIssuedQuantity: 0, totalRawMaterialCost: 0 }
        );
    }, [form?.rawMaterials]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || []).map((field: any) => {
            const key = String(field?.key || "");
            let rawValue = form?.[key] ?? field?.defaultValue ?? "";

            if (key === "totalIssuedQuantity" || key === "totalQuantity") rawValue = footerTotals.totalIssuedQuantity;
            if (key === "totalRawMaterialCost" || key === "totalAmount" || key === "grossAmount") rawValue = footerTotals.totalRawMaterialCost;

            const fieldType = String(field?.type || "").toLowerCase();
            const isMoneyField = fieldType === "currency" || fieldType === "amount" || key.toLowerCase().includes("cost") || key.toLowerCase().includes("amount");

            return { ...field, rawValue, value: isMoneyField ? money(rawValue || 0) : rawValue };
        });
    }, [templateFields?.footer, form, footerTotals]);

    const getVoucherNumber = (record: any) => {
        return record?.voucherNumber || record?.issuesToProductionVoucherNumber || record?.issueToProductionVoucherNumber || "";
    };

    const fetchIssueToProductionList = async () => {
        try {
            setListingLoader(true);
            const response = await professionalAxios.get(`${API_BASE}/getAll`, {
                params: { status, search: debouncedSearch, limit: localLimit, offset: localOffset },
            });

            const data = response?.data?.data || response?.data || {};
            setRecords(Array.isArray(data?.records) ? data.records : []);
            setPagination(data?.pagination || defaultPagination);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || "Failed to load Issue to Production list");
        } finally {
            setListingLoader(false);
        }
    };

    useEffect(() => {
        dispatch(getAllTransactionSchema(MODULE_CODE) as any);
    }, [dispatch]);

    useEffect(() => {
        fetchIssueToProductionList();
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
                Array.isArray(transactionsSchema?.headerChild) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                setFieldsLoading(true);
                const updated = await loadAllTemplateOptions(transactionsSchema);
                setTemplateFields(updated);

                if (!editingVoucherNumber) {
                    const next: any = {};
                    [...(updated?.header || []), ...(updated?.headerChild || [])].forEach((field: any) => {
                        if (!field?.key) return;
                        next[field.key] = getFieldDefaultValue(field);
                    });
                    next.voucherNumber = next.voucherNumber || "AUTO";
                    next.voucherDate = next.voucherDate || todayYMD();
                    next.status = next.status || "open";
                    next.transactionType = next.transactionType || "ISSUE_TO_PRODUCTION";

                    const row: any = { id: Date.now(), availableQuantity: null, productType: "" };
                    (updated?.body || []).forEach((field: any) => {
                        if (!field?.key) return;
                        row[field.key] = getFieldDefaultValue(field);
                    });
                    next.rawMaterials = [row];
                    setForm(next);
                }
            } catch (error) {
                console.log("Failed to prepare Issue to Production schema", error);
                toast.error("Failed to load Issue to Production fields");
            } finally {
                setFieldsLoading(false);
            }
        };

        prepareFields();
    }, [transactionsSchema]);

    const loadAvailableQuantity = async (index: number, productCode: string, productType: string, voucherDate?: string) => {
        const normalizedProductType = String(productType || "").trim().toLowerCase();

        if (!productCode || ["serviceproduct", "nonstocks"].includes(normalizedProductType)) {
            setForm((previous: any) => {
                const updatedRows = [...(previous?.rawMaterials || [])];
                if (!updatedRows[index]) return previous;
                updatedRows[index] = { ...updatedRows[index], productType: normalizedProductType, availableQuantity: null };
                return { ...previous, rawMaterials: updatedRows };
            });
            return;
        }

        setForm((previous: any) => {
            const updatedRows = [...(previous?.rawMaterials || [])];
            if (!updatedRows[index] || String(updatedRows[index]?.productCode || "") !== String(productCode)) return previous;
            updatedRows[index] = { ...updatedRows[index], productType: normalizedProductType, availableQuantity: null };
            return { ...previous, rawMaterials: updatedRows };
        });

        try {
            const { fromDate, toDate } = getFinancialYearRange(voucherDate || form?.voucherDate || todayYMD());
            const balance: any = await dispatch(getProductBalance({ productCode, fromDate, toDate }) as any).unwrap();

            setForm((previous: any) => {
                const updatedRows = [...(previous?.rawMaterials || [])];
                if (!updatedRows[index] || String(updatedRows[index]?.productCode || "") !== String(productCode)) return previous;
                updatedRows[index] = {
                    ...updatedRows[index],
                    productType: normalizedProductType,
                    availableQuantity: balance?.balanceQuantity !== undefined && balance?.balanceQuantity !== null ? balance.balanceQuantity : null,
                };
                return { ...previous, rawMaterials: updatedRows };
            });
        } catch (error) {
            console.log(`Failed to fetch available quantity for ${productCode}`, error);
        }
    };

    useEffect(() => {
        if (!showModal || !editingVoucherNumber) return;

        (form?.rawMaterials || []).forEach((row: any, index: number) => {
            if (!row?.productCode) return;
            const productField = (templateFields?.body || []).find((field: any) => PRODUCT_FIELD_KEYS.has(String(field?.key || "")));
            const option = (productField?.options || []).find((item: any) => {
                const raw = item?.raw || {};
                return [item?.value, raw?.productCode, raw?._id, raw?.productId].some((value) => String(value || "") === String(row.productCode));
            });
            const productType = option?.raw?.productType || option?.raw?.dynamicFields?.productType || row?.productType || "rawmaterial";
            void loadAvailableQuantity(index, String(row.productCode), String(productType), form?.voucherDate);
        });
    }, [showModal, editingVoucherNumber, form?.voucherNumber]);

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchIssueToProductionList();
            toast.success("Issue to Production list refreshed");
        } finally {
            setRefreshing(false);
        }
    };

    const resetForm = () => {
        setEditingVoucherNumber(null);
        setErrors({});
        setForm(buildBlankForm(templateFields));
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const buildFormFromRecord = (record: any) => {
        const next = buildBlankForm(templateFields);

        [...(templateFields?.header || []), ...(templateFields?.headerChild || [])].forEach((field: any) => {
            if (!field?.key) return;
            let value = record?.[field.key] ?? field?.defaultValue ?? next?.[field.key] ?? "";
            if (String(field?.type || "").toLowerCase() === "date" && value) value = formatDateForInput(value);
            next[field.key] = value;
        });

        next.voucherNumber = getVoucherNumber(record) || next.voucherNumber;
        next.voucherDate = record?.voucherDate ? formatDateForInput(record.voucherDate) : next.voucherDate;
        next.status = record?.status || next.status || "open";
        next.transactionType = record?.transactionType || next.transactionType || "ISSUE_TO_PRODUCTION";
        next.headerRemarks = record?.headerRemarks ?? next.headerRemarks ?? "";
        next.remarks = record?.remarks ?? next.remarks ?? "";

        next.rawMaterials = Array.isArray(record?.rawMaterials) && record.rawMaterials.length
            ? record.rawMaterials.map((item: any) => ({ ...buildBlankRow(templateFields?.body || []), ...item, id: item?.id || Date.now() + Math.random(), availableQuantity: null, productType: item?.productType || "rawmaterial" }))
            : [buildBlankRow(templateFields?.body || [])];

        return next;
    };

    const openEditModal = async (record: any) => {
        const voucherNumber = getVoucherNumber(record);
        if (!voucherNumber) {
            toast.error("Voucher number not found");
            return;
        }

        try {
            setFieldsLoading(true);
            const response = await professionalAxios.get(`${API_BASE}/getByVoucherNo/${encodeURIComponent(voucherNumber)}`);
            const detail = response?.data?.data || response?.data || record;
            setEditingVoucherNumber(voucherNumber);
            setErrors({});
            setForm(buildFormFromRecord(detail));
            setShowModal(true);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || "Failed to load Issue to Production");
        } finally {
            setFieldsLoading(false);
        }
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((previous: any) => ({ ...previous, [key]: value }));
        setErrors((previous: any) => ({ ...previous, [key]: "" }));
    };

    const handleAddRow = () => {
        setForm((previous: any) => ({ ...previous, rawMaterials: [...(previous?.rawMaterials || []), buildBlankRow(templateFields?.body || [])] }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((previous: any) => {
            const rows = (previous?.rawMaterials || []).filter((_: any, rowIndex: number) => rowIndex !== index);
            return { ...previous, rawMaterials: rows.length ? rows : [buildBlankRow(templateFields?.body || [])] };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        const field = getBodyFieldByKey(key);
        let selectedProductCode = "";
        let selectedProductType = "";

        setForm((previous: any) => {
            const rows = [...(previous?.rawMaterials || [])];
            let row = { ...(rows[index] || buildBlankRow(templateFields?.body || [])) };
            row = applyMappedFields(field, value, row);

            if (PRODUCT_FIELD_KEYS.has(key)) {
                const option = getOptionByValue(field, value);
                const raw = option?.raw || {};

                row.productCode = raw?.productCode || row?.productCode || (key === "productCode" ? value : "");
                row.productName = raw?.productName || row?.productName || (key === "productName" ? option?.label || value : "");
                row.productId = raw?._id || raw?.productId || row?.productId || "";
                row.unit = raw?.unit || row?.unit || "";
                row.uom = raw?.uom || raw?.unit || row?.uom || "";
                row.rate = row?.rate || raw?.purchasePrice || raw?.productPurchasePrice || raw?.rate || "";
                row.productType = raw?.productType || raw?.dynamicFields?.productType || "rawmaterial";
                row.availableQuantity = null;
                selectedProductCode = String(row.productCode || "");
                selectedProductType = String(row.productType || "rawmaterial");
            }

            if (key === "quantity" || key === "rate" || PRODUCT_FIELD_KEYS.has(key)) row = calculateRow(row);

            rows[index] = row;
            return { ...previous, rawMaterials: rows };
        });

        setErrors((previous: any) => ({ ...previous, rawMaterials: "", [`row_${index}_${key}`]: "" }));

        if (PRODUCT_FIELD_KEYS.has(key)) {
            const option = getOptionByValue(field, value);
            const raw = option?.raw || {};
            const productCode = selectedProductCode || raw?.productCode || (key === "productCode" ? value : "");
            const productType = selectedProductType || raw?.productType || raw?.dynamicFields?.productType || "rawmaterial";
            if (productCode) void loadAvailableQuantity(index, String(productCode), String(productType), form?.voucherDate);
        }
    };

    const validateForm = () => {
        const nextErrors: any = {};

        [...(templateFields?.header || []), ...(templateFields?.headerChild || [])].forEach((field: any) => {
            if (!field?.key || field?.isHidden || !field?.isRequired) return;
            const value = form?.[field.key];
            if (value === "" || value === null || value === undefined) nextErrors[field.key] = `${field?.label || field.key} is required`;
        });

        const rows = cleanRawMaterials();
        if (!rows.length) nextErrors.rawMaterials = "Please add at least one raw material";

        (form?.rawMaterials || []).forEach((row: any, index: number) => {
            const hasData = (templateFields?.body || []).some((field: any) => {
                const value = row?.[field?.key];
                return value !== "" && value !== null && value !== undefined;
            });
            if (!hasData) return;

            (templateFields?.body || []).forEach((field: any) => {
                if (!field?.key || field?.isHidden || !field?.isRequired) return;
                const value = row?.[field.key];
                if (value === "" || value === null || value === undefined) nextErrors[`row_${index}_${field.key}`] = `${field?.label || field.key} is required`;
            });
        });

        setErrors(nextErrors);
        if (nextErrors.rawMaterials) toast.error(nextErrors.rawMaterials);
        return Object.keys(nextErrors).length === 0;
    };

    const buildPayload = () => {
        const payload: any = {};

        [...(templateFields?.header || []), ...(templateFields?.headerChild || [])].forEach((field: any) => {
            if (!field?.key || field?.key === "voucherNumber") return;
            payload[field.key] = form?.[field.key];
        });

        (templateFields?.footer || []).forEach((field: any) => {
            if (!field?.key) return;
            if (field.key === "totalIssuedQuantity" || field.key === "totalQuantity") payload[field.key] = String(footerTotals.totalIssuedQuantity);
            else if (field.key === "totalRawMaterialCost" || field.key === "totalAmount" || field.key === "grossAmount") payload[field.key] = String(footerTotals.totalRawMaterialCost.toFixed(2));
            else if (form?.[field.key] !== undefined) payload[field.key] = form[field.key];
        });

        payload.voucherDate = form?.voucherDate || todayYMD();
        payload.status = form?.status || "open";
        payload.transactionType = form?.transactionType || "ISSUE_TO_PRODUCTION";
        payload.rawMaterials = cleanRawMaterials();
        payload.totalIssuedQuantity = String(footerTotals.totalIssuedQuantity);
        payload.totalRawMaterialCost = String(footerTotals.totalRawMaterialCost.toFixed(2));
        if (form?.headerRemarks !== undefined) payload.headerRemarks = form.headerRemarks;
        if (form?.remarks !== undefined) payload.remarks = form.remarks;

        return payload;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = buildPayload();

        try {
            setSubmitting(true);

            if (editingVoucherNumber) {
                await professionalAxios.put(`${API_BASE}/update/${encodeURIComponent(editingVoucherNumber)}`, payload);
                toast.success("Issue to Production updated successfully");
            } else {
                await professionalAxios.post(`${API_BASE}/save`, payload);
                toast.success("Issue to Production created successfully");
            }

            setShowModal(false);
            resetForm();
            await fetchIssueToProductionList();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || "Issue to Production operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!confirmTooltip?.voucherNumber) return;

        try {
            setDeleteLoader(true);
            await professionalAxios.delete(`${API_BASE}/delete/${encodeURIComponent(confirmTooltip.voucherNumber)}`);
            toast.success("Issue to Production deleted successfully");
            await fetchIssueToProductionList();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || error?.message || "Failed to delete Issue to Production");
        } finally {
            setDeleteLoader(false);
            setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null });
        }
    };

    const columns = [
        { key: "voucherNumber", title: "Voucher No", render: (row: any) => getVoucherNumber(row) || "-" },
        { key: "voucherDate", title: "Date", render: (row: any) => row?.voucherDate ? formatDateForList(row.voucherDate) : "-" },
        { key: "rawMaterials", title: "Raw Items", render: (row: any) => row?.rawMaterials?.length || 0 },
        { key: "totalIssuedQuantity", title: "Issued Qty", render: (row: any) => row?.totalIssuedQuantity ?? "0" },
        { key: "totalRawMaterialCost", title: "Raw Material Cost", render: (row: any) => <span className="font-medium text-card-foreground">{money(row?.totalRawMaterialCost || 0)}</span> },
        { key: "status", title: "Status", render: (row: any) => <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.status === "open" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger"}`}>{row?.status || "-"}</span> },
    ];

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-3 flex items-center">
                <div className="flex items-start gap-3">
                    <Badge count={pagination?.totalDocs ?? 0} text="Total Issue to Production:" varient="primary" />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle arr={["open", "close"]} state={status} setState={handleStatusChange} />
                    <SearchInput search={search} setSearch={setSearch} />
                    <DataREfreshButton callBackFn={handleRefresh} loading={refreshing} />
                    <DataCreateButton callBackFn={openAddModal} text="Add Issue to Production" />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={records}
                loading={listingLoader}
                emptyMessage={`No ${status} Issue to Production found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(record)} className="cursor-pointer rounded-md p-2 text-primary transition hover:bg-primary/10" title="Edit">
                            <Edit size={16} />
                        </button>
                        <button
                            disabled={deleteLoader}
                            onClick={(event) => {
                                const rect = event.currentTarget.getBoundingClientRect();
                                let x = rect.left - 150;
                                if (x < 10) x = 10;
                                const y = rect.top + window.scrollY - 5;
                                setConfirmTooltip({ show: true, x, y, voucherNumber: getVoucherNumber(record) });
                            }}
                            className="cursor-pointer rounded-md p-2 text-danger transition hover:bg-danger/10 disabled:opacity-50"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(event: any) => {
                        setLocalLimit(Number(event.target.value));
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
                    message="Are you sure you want to delete this Issue to Production?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null })}
                />
            )}

            <DynamicAddForm
                show={showModal}
                setShow={setShowModal}
                edit={Boolean(editingVoucherNumber)}
                title={MODULE_NAME}
                subtitle={`Fill in the ${MODULE_NAME} details below`}
                loading={submitting}
                contentLoading={fieldsLoading}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                form={form}
                errors={errors}
                handleAddRow={handleAddRow}
                handleDeleteRow={handleDeleteRow}
                handleRowChange={handleRowChange}
                inputData={{ ...templateFields, footer: dynamicFooterArray }}
                bodyKey="rawMaterials"
                bodyTitle="Raw Materials"
                addButtonText="Add Raw Material"
                handleChange={handleMainChange}
                bodyCellExtraRenderer={renderIssueToProductionCellExtra}
            />
        </div>
    );
};

export default IssueToProduction;