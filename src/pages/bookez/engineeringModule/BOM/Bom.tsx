import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import {
    fmtMoney,
    formatDateForInput,
    formatDateForList,
    money,
    num,
    todayYMD,
} from "../../../../utils/helperFunctions";

import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";

import Badge from "../../../../components/badge";
import Toggle from "../../../../components/toggle";
import SearchInput from "../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../components/buttons";
import Permission from "../../../../components/PermissionGuard";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

import VoucherFormModal from "../../../../components/voucher/VoucherFormModal";
import EditableLineTable from "../../../../components/voucher/EditableLineTable";
import SummaryCards from "../../../../components/voucher/SummaryCards";
import { SelectInput, TextArea, TextInput } from "../../../../components/inputs";

import {
    deleteBomRecord,
    loadBomRecords,
    nextBomNumber,
    upsertBomRecord,
} from "./bomStorage";

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

    return str
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1");
};

const isNumericField = (key: string) => {
    return ["quantity", "rate", "amount", "totalBomCost"].includes(key);
};

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

const getSelectedValue = (value: any) => {
    if (value && typeof value === "object") {
        return (
            value.value ||
            value.productCode ||
            value.code ||
            value._id ||
            ""
        );
    }

    return value;
};

const getProductRate = (product: any, lineType: "finishedGoods" | "rawMaterials") => {
    if (lineType === "finishedGoods") {
        return String(
            product?.sellingPrice ||
            product?.productSellingPrice ||
            product?.salesRate ||
            product?.saleRate ||
            product?.purchasePrice ||
            product?.productPurchasePrice ||
            product?.rate ||
            ""
        );
    }

    return String(
        product?.purchasePrice ||
        product?.productPurchasePrice ||
        product?.purchaseRate ||
        product?.rate ||
        product?.sellingPrice ||
        product?.productSellingPrice ||
        ""
    );
};

const getProductId = (product: any) => {
    return product?._id || product?.productId || product?.id || "";
};

const getProductName = (selectedOption: any, product: any) => {
    return (
        selectedOption?.label ||
        product?.productName ||
        product?.name ||
        product?.productCode ||
        ""
    );
};

const calculateAmount = (quantity: any, rate: any) => {
    return num(quantity) * num(rate);
};

const emptyBomLine = {
    id: Date.now(),
    productCode: "",
    productName: "",
    productId: "",
    unit: "",
    quantity: "",
    rate: "",
    amount: 0,
    remarks: "",
};

const getDefaultForm = () => ({
    id: "",
    bomNo: "BOM",
    voucherDate: todayYMD(),
    status: "open",
    projectName: "",
    remarks: "",

    finishedGoods: [{ ...emptyBomLine, id: Date.now() }],
    rawMaterials: [{ ...emptyBomLine, id: Date.now() + 1 }],

    totalFinishedCost: "0.00",
    totalRawMaterialCost: "0.00",
    totalBomCost: "0.00",
});

/* ===================================================
   BOM FORM MODAL
=================================================== */

const BomFormModal = ({
    show,
    setShow,
    edit,
    loading,
    onClose,
    onSubmit,
    form,
    errors,
    handleChange,
    handleAddLine,
    handleDeleteLine,
    handleLineChange,
    finishedGoodColumns,
    rawMaterialColumns,
    totalFinishedCost,
    totalRawMaterialCost,
    totalBomCost,
}: any) => {
    const renderHeaderInput = (field: any) => {
        if (field.type === "date") {
            return (
                <TextInput
                    label={field.label}
                    mandatory={field.isRequired}
                    type="date"
                    value={form?.[field.key] ? String(form?.[field.key]).split("T")[0] : ""}
                    error={errors?.[field.key]}
                    onChange={(event: any) => handleChange(field.key, event.target.value)}
                />
            );
        }

        if (field.type === "select") {
            return (
                <SelectInput
                    label={field.label}
                    mandatory={field.isRequired}
                    value={form?.[field.key] || ""}
                    error={errors?.[field.key]}
                    onChange={(event: any) => handleChange(field.key, event.target.value)}
                    options={field.options || []}
                />
            );
        }

        if (field.type === "textarea") {
            return (
                <TextArea
                    label={field.label}
                    mandatory={field.isRequired}
                    value={form?.[field.key] || ""}
                    placeholder={field.placeholder}
                    error={errors?.[field.key]}
                    onChange={(event: any) => handleChange(field.key, event.target.value)}
                />
            );
        }

        return (
            <TextInput
                label={field.label}
                mandatory={field.isRequired}
                disabled={field.disabled}
                value={form?.[field.key] || ""}
                placeholder={field.placeholder}
                error={errors?.[field.key]}
                onChange={(event: any) => handleChange(field.key, event.target.value)}
            />
        );
    };

    const headerFields = [
        {
            key: "bomNo",
            label: "BOM No",
            type: "text",
            disabled: true,
        },
        {
            key: "voucherDate",
            label: "Date",
            type: "date",
            isRequired: true,
        },
        {
            key: "status",
            label: "Status",
            type: "select",
            isRequired: true,
            options: [
                { label: "Open", value: "open" },
                { label: "Close", value: "close" },
            ],
        },
        {
            key: "projectName",
            label: "Project Name",
            type: "text",
            placeholder: "Enter Project Name",
        },
        {
            key: "remarks",
            label: "Remark",
            type: "textarea",
            placeholder: "Enter Remark",
        },
    ];

    const summaryItems = [
        {
            label: "Finished Goods Cost",
            value: money(totalFinishedCost),
        },
        {
            label: "Raw Material Cost",
            value: money(totalRawMaterialCost),
        },
        {
            label: "Total BOM Cost",
            value: money(totalBomCost),
        },
    ];

    return (
        <>

            {/* @ts-ignore */}
            <VoucherFormModal
                show={show}
                setShow={setShow}
                edit={edit}
                title="Bill of Materials"
                subtitle="Fill in the BOM details below"
                loading={loading}
                onClose={onClose}
                onSubmit={onSubmit}
            >
                <div className="w-full max-w-full text-card-foreground">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-3">
                        {headerFields.map((field: any) => (
                            <div
                                key={field.key}
                                className={field.type === "textarea" ? "md:col-span-3" : ""}
                            >
                                {renderHeaderInput(field)}
                            </div>
                        ))}
                    </div>

                    {errors?.finishedGoods && (
                        <p className="mt-4 text-sm text-danger">
                            {errors.finishedGoods}
                        </p>
                    )}

                    <div className="mt-4 w-full max-w-full">
                        {/* @ts-ignore */}
                        <EditableLineTable
                            bodyTitle="Finished Goods"
                            addButtonText="Add Finished Good"
                            rows={form?.finishedGoods || []}
                            columns={finishedGoodColumns || []}
                            errors={errors}
                            onAddRow={() => handleAddLine("finishedGoods")}
                            onDeleteRow={(index: number) =>
                                handleDeleteLine("finishedGoods", index)
                            }
                            onChange={(index: number, key: string, value: any) =>
                                handleLineChange("finishedGoods", index, key, value)
                            }
                            emptyText="No finished goods added"
                            isAddButton={true}
                        />
                    </div>

                    {errors?.rawMaterials && (
                        <p className="mt-4 text-sm text-danger">
                            {errors.rawMaterials}
                        </p>
                    )}

                    <div className="mt-4 w-full max-w-full">
                        {/* @ts-ignore */}
                        <EditableLineTable
                            bodyTitle="Raw Products"
                            addButtonText="Add Raw Product"
                            rows={form?.rawMaterials || []}
                            columns={rawMaterialColumns || []}
                            errors={errors}
                            onAddRow={() => handleAddLine("rawMaterials")}
                            onDeleteRow={(index: number) =>
                                handleDeleteLine("rawMaterials", index)
                            }
                            onChange={(index: number, key: string, value: any) =>
                                handleLineChange("rawMaterials", index, key, value)
                            }
                            emptyText="No raw products added"
                            isAddButton={true}
                        />
                    </div>

                    <SummaryCards items={summaryItems} isSummaryFooter />
                </div>
            </VoucherFormModal>
        </>
    );
};

/* ===================================================
   MAIN COMPONENT
=================================================== */

const Bom = () => {
    const dispatch = useDispatch<any>();

    const [allBomRecords, setAllBomRecords] = useState<any[]>([]);
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

    const [finishedGoodOptions, setFinishedGoodOptions] = useState<any[]>([]);
    const [rawMaterialOptions, setRawMaterialOptions] = useState<any[]>([]);

    const [listingLoader, setListingLoader] = useState(false);
    const [addLoader, setAddLoader] = useState(false);
    const [deleteLoader, setDeleteLoader] = useState(false);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        id: null,
        bomNo: null,
    });

    /* ===================================================
       FETCH PRODUCT DROPDOWNS
    =================================================== */

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [finishedGoodRes, rawMaterialRes]: any = await Promise.all([
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
       FETCH LOCAL STORAGE BOM LIST
    =================================================== */

    const fetchBomRecords = async () => {
        setListingLoader(true);

        try {
            const records = await loadBomRecords();

            const sorted = [...records].sort(
                (a: any, b: any) =>
                    new Date(b.updatedAt || b.createdAt).getTime() -
                    new Date(a.updatedAt || a.createdAt).getTime()
            );

            setAllBomRecords(sorted);
        } catch (err: any) {
            toast.error(err?.message || "Failed to load BOM records");
        } finally {
            setListingLoader(false);
        }
    };

    useEffect(() => {
        fetchBomRecords();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    /* ===================================================
       FILTER + PAGINATION
    =================================================== */

    const filteredBomRecords = useMemo(() => {
        const q = debouncedSearch.toLowerCase();

        return (allBomRecords || []).filter((item: any) => {
            const matchesStatus = !status || item?.status === status;

            const matchesSearch =
                !q ||
                String(item?.bomNo || "").toLowerCase().includes(q) ||
                String(item?.projectName || "").toLowerCase().includes(q) ||
                String(item?.remarks || "").toLowerCase().includes(q);

            return matchesStatus && matchesSearch;
        });
    }, [allBomRecords, debouncedSearch, status]);

    const pagination = useMemo(() => {
        const totalDocs = filteredBomRecords.length;
        const totalPages = Math.max(1, Math.ceil(totalDocs / localLimit));
        const currentPage = Math.floor(localOffset / localLimit) + 1;

        return {
            ...defaultPagination,
            offset: localOffset,
            limit: localLimit,
            totalDocs,
            totalPages,
            currentPage,
            hasPrevPage: localOffset > 0,
            hasNextPage: localOffset + localLimit < totalDocs,
        };
    }, [filteredBomRecords.length, localOffset, localLimit]);

    const paginatedBomRecords = useMemo(() => {
        return filteredBomRecords.slice(localOffset, localOffset + localLimit);
    }, [filteredBomRecords, localOffset, localLimit]);

    /* ===================================================
       CALCULATIONS
    =================================================== */

    const cleanLines = (lines: any[]) => {
        return (lines || [])
            .filter((row: any) => row.productCode || row.quantity || row.rate)
            .map((row: any) => ({
                ...row,
                amount: calculateAmount(row.quantity, row.rate),
            }));
    };

    const totalFinishedCost = useMemo(() => {
        return cleanLines(form.finishedGoods).reduce((sum: number, item: any) => {
            return sum + num(item.amount);
        }, 0);
    }, [form.finishedGoods]);

    const totalRawMaterialCost = useMemo(() => {
        return cleanLines(form.rawMaterials).reduce((sum: number, item: any) => {
            return sum + num(item.amount);
        }, 0);
    }, [form.rawMaterials]);

    const totalBomCost = useMemo(() => {
        return totalFinishedCost + totalRawMaterialCost;
    }, [totalFinishedCost, totalRawMaterialCost]);

    /* ===================================================
       TABLE COLUMNS
    =================================================== */

    const columns = [
        {
            key: "bomNo",
            title: "BOM No",
            render: (row: any) => row?.bomNo || "-",
        },
        {
            key: "voucherDate",
            title: "Date",
            render: (row: any) => formatDateForList(row?.voucherDate),
        },
        {
            key: "projectName",
            title: "Project",
            render: (row: any) => row?.projectName || "-",
        },
        {
            key: "finishedGoods",
            title: "Finished Goods",
            render: (row: any) => row?.finishedGoods?.length || 0,
        },
        {
            key: "rawMaterials",
            title: "Raw Materials",
            render: (row: any) => row?.rawMaterials?.length || 0,
        },
        {
            key: "totalBomCost",
            title: "Total BOM Cost",
            render: (row: any) => (
                <span className="font-semibold text-indigo-700">
                    {money(row?.totalBomCost || 0)}
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
            await fetchBomRecords();
            toast.success("BOM list refreshed");
        } catch (err: any) {
            toast.error(err?.message || "Failed to refresh BOM list");
        } finally {
            setRefreshing(false);
        }
    };

    const resetMainForm = async () => {
        const no = await nextBomNumber();

        setEditingRecord(null);
        setErrors({});
        setForm({
            ...getDefaultForm(),
            bomNo: no,
        });
    };

    const openAddModal = async () => {
        await resetMainForm();
        setShowModal(true);
    };

    const openEditModal = (record: any) => {
        setEditingRecord(record);
        setErrors({});

        setForm({
            id: record?.id || "",
            bomNo: record?.bomNo || "BOM",
            voucherDate: formatDateForInput(record?.voucherDate),
            status: record?.status || "open",
            projectName: record?.projectName || "",
            remarks: record?.remarks || "",
            finishedGoods:
                record?.finishedGoods?.length > 0
                    ? record.finishedGoods.map((item: any) => ({
                        ...emptyBomLine,
                        ...item,
                        id: item?.id || Date.now() + Math.random(),
                    }))
                    : [{ ...emptyBomLine, id: Date.now() }],
            rawMaterials:
                record?.rawMaterials?.length > 0
                    ? record.rawMaterials.map((item: any) => ({
                        ...emptyBomLine,
                        ...item,
                        id: item?.id || Date.now() + Math.random(),
                    }))
                    : [{ ...emptyBomLine, id: Date.now() + 1 }],
            totalFinishedCost: record?.totalFinishedCost || "0.00",
            totalRawMaterialCost: record?.totalRawMaterialCost || "0.00",
            totalBomCost: record?.totalBomCost || "0.00",
        });

        setShowModal(true);
    };

    const handleMainChange = (key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [key]: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    /* ===================================================
       LINE HANDLERS
    =================================================== */

    const handleAddLine = (lineKey: "finishedGoods" | "rawMaterials") => {
        if (lineKey === "finishedGoods" && finishedGoodOptions.length === 0) {
            toast.error("Please create at least one finished good first");
            return;
        }

        if (lineKey === "rawMaterials" && rawMaterialOptions.length === 0) {
            toast.error("Please create at least one raw material first");
            return;
        }

        setForm((prev: any) => ({
            ...prev,
            [lineKey]: [
                ...(prev?.[lineKey] || []),
                {
                    ...emptyBomLine,
                    id: Date.now() + Math.random(),
                },
            ],
        }));
    };

    const handleDeleteLine = (
        lineKey: "finishedGoods" | "rawMaterials",
        index: number
    ) => {
        setForm((prev: any) => {
            const updatedLines = (prev?.[lineKey] || []).filter(
                (_: any, i: number) => i !== index
            );

            return {
                ...prev,
                [lineKey]:
                    updatedLines.length > 0
                        ? updatedLines
                        : [{ ...emptyBomLine, id: Date.now() }],
            };
        });
    };

    const handleLineChange = (
        lineKey: "finishedGoods" | "rawMaterials",
        index: number,
        key: string,
        value: any
    ) => {
        setForm((prev: any) => {
            const rawValue = getSelectedValue(value);
            const finalValue = isNumericField(key)
                ? sanitizeDecimal(rawValue)
                : rawValue;

            const updatedLines = [...(prev?.[lineKey] || [])];

            let updatedRow = {
                ...updatedLines[index],
                [key]: finalValue,
            };

            if (key === "productCode") {
                const options =
                    lineKey === "finishedGoods"
                        ? finishedGoodOptions
                        : rawMaterialOptions;

                const selectedProduct = options.find(
                    (item: any) => String(item.value) === String(finalValue)
                );

                const product = selectedProduct?.raw;
                const rate = finalValue ? getProductRate(product, lineKey) : "";

                updatedRow = {
                    ...updatedRow,
                    productCode: finalValue,
                    productName: finalValue
                        ? getProductName(selectedProduct, product)
                        : "",
                    productId: finalValue ? getProductId(product) : "",
                    unit: product?.unit || product?.unitName || "",
                    rate,
                    amount: calculateAmount(updatedRow.quantity, rate),
                };
            }

            if (key === "quantity" || key === "rate") {
                const quantity =
                    key === "quantity" ? finalValue : updatedRow.quantity;

                const rate = key === "rate" ? finalValue : updatedRow.rate;

                updatedRow = {
                    ...updatedRow,
                    amount: calculateAmount(quantity, rate),
                };
            }

            updatedLines[index] = updatedRow;

            return {
                ...prev,
                [lineKey]: updatedLines,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            [lineKey]: "",
            [`${lineKey}_${index}_${key}`]: "",
        }));
    };

    /* ===================================================
       VALIDATION
    =================================================== */

    const validateLines = (
        lines: any[],
        lineKey: "finishedGoods" | "rawMaterials",
        err: any
    ) => {
        const filledRows = cleanLines(lines);

        if (filledRows.length === 0) {
            err[lineKey] =
                lineKey === "finishedGoods"
                    ? "Please add at least one finished good"
                    : "Please add at least one raw material";
        }

        lines.forEach((row: any, index: number) => {
            const hasAnyValue = row.productCode || row.quantity || row.rate;

            if (!hasAnyValue) return;

            if (!row.productCode) {
                err[`${lineKey}_${index}_productCode`] = "Product is required";
            }

            if (!row.quantity || num(row.quantity) <= 0) {
                err[`${lineKey}_${index}_quantity`] = "Quantity is required";
            }

            if (row.rate === "" || num(row.rate) < 0) {
                err[`${lineKey}_${index}_rate`] = "Rate is required";
            }
        });
    };

    const validateForm = () => {
        const err: any = {};

        if (!form.voucherDate) {
            err.voucherDate = "Date is required";
        }

        if (!form.status) {
            err.status = "Status is required";
        }

        validateLines(form.finishedGoods || [], "finishedGoods", err);
        validateLines(form.rawMaterials || [], "rawMaterials", err);

        setErrors(err);

        if (err.finishedGoods) toast.error(err.finishedGoods);
        if (err.rawMaterials) toast.error(err.rawMaterials);

        return Object.keys(err).length === 0;
    };

    /* ===================================================
       SAVE / UPDATE
    =================================================== */

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const finishedGoods = cleanLines(form.finishedGoods || []);
        const rawMaterials = cleanLines(form.rawMaterials || []);

        const finishedTotal = finishedGoods.reduce((sum: number, item: any) => {
            return sum + num(item.amount);
        }, 0);

        const rawTotal = rawMaterials.reduce((sum: number, item: any) => {
            return sum + num(item.amount);
        }, 0);

        const payload = {
            id: editingRecord?.id || undefined,
            bomNo: form.bomNo,
            voucherDate: form.voucherDate,
            status: form.status || "open",
            projectName: String(form.projectName || "").trim(),
            remarks: String(form.remarks || "").trim(),

            finishedGoods: finishedGoods.map((item: any) => ({
                id: item.id,
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,
                unit: item.unit,
                quantity: String(item.quantity),
                rate: String(item.rate),
                amount: fmtMoney(item.amount),
                remarks: item.remarks || "",
            })),

            rawMaterials: rawMaterials.map((item: any) => ({
                id: item.id,
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,
                unit: item.unit,
                quantity: String(item.quantity),
                rate: String(item.rate),
                amount: fmtMoney(item.amount),
                remarks: item.remarks || "",
            })),

            totalFinishedCost: fmtMoney(finishedTotal),
            totalRawMaterialCost: fmtMoney(rawTotal),
            totalBomCost: fmtMoney(finishedTotal + rawTotal),
        };

        try {
            setAddLoader(true);

            await upsertBomRecord(payload);

            toast.success(
                editingRecord
                    ? "BOM updated successfully"
                    : "BOM created successfully"
            );

            setShowModal(false);
            await resetMainForm();
            await fetchBomRecords();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        } finally {
            setAddLoader(false);
        }
    };

    /* ===================================================
       DELETE
    =================================================== */

    const handleDeleteConfirm = async () => {
        if (!confirmTooltip.id) return;

        try {
            setDeleteLoader(true);

            await deleteBomRecord(confirmTooltip.id);

            toast.success("BOM deleted successfully");
            await fetchBomRecords();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete BOM");
        } finally {
            setDeleteLoader(false);

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                id: null,
                bomNo: null,
            });
        }
    };

    /* ===================================================
       FORM TABLE COLUMNS
    =================================================== */

    const commonLineColumns = (options: any[]) => [
        {
            key: "productCode",
            label: "Product",
            type: "select",
            width: "260px",
            isRequired: true,
            options,
        },
        {
            key: "quantity",
            label: "Qty",
            type: "number",
            width: "130px",
            isRequired: true,
        },
        {
            key: "rate",
            label: "Rate",
            type: "number",
            width: "140px",
            isRequired: true,
        },
        {
            key: "amount",
            label: "Amount",
            type: "number",
            width: "150px",
            disabled: true,
        },
        {
            key: "remarks",
            label: "Remarks",
            type: "text",
            width: "220px",
        },
    ];

    const finishedGoodColumns = commonLineColumns(finishedGoodOptions);
    const rawMaterialColumns = commonLineColumns(rawMaterialOptions);

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {/* ================= HEADER ================= */}
            <div
                id="bom-header"
                className="mb-3 flex items-center"
            >
                <div
                    id="bom-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total BOMs:",
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
                        permissionKey="accountLedger"
                        action="create"
                    >
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openAddModal,
                                text: "Add BOM",
                                icon: <Plus size={16} />,
                            }}
                        />
                    </Permission>
                </div>
            </div>

            {/* ================= LIST TABLE ================= */}
            <DataTable
                columns={columns}
                data={paginatedBomRecords}
                loading={listingLoader}
                emptyMessage={`No ${status} BOM found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <Permission
                            module="bookez"
                            permissionKey="accountLedger"
                            action="update"
                        >
                            <button
                                id="bom-edit-button"
                                onClick={() => openEditModal(record)}
                                className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission
                            module="bookez"
                            permissionKey="accountLedger"
                            action="delete"
                        >
                            <button
                                id="bom-delete-button"
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
                                        id: record?.id,
                                        bomNo: record?.bomNo,
                                    });
                                }}
                                className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
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
                    message={`Are you sure you want to delete ${confirmTooltip.bomNo || "this BOM"
                        }?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            id: null,
                            bomNo: null,
                        })
                    }
                />
            )}

            {/* ================= ADD / UPDATE FORM ================= */}
            <BomFormModal
                show={showModal}
                setShow={setShowModal}
                edit={Boolean(editingRecord)}
                loading={addLoader}
                onClose={async () => {
                    setShowModal(false);
                    await resetMainForm();
                }}
                onSubmit={handleSubmit}
                form={form}
                errors={errors}
                handleChange={handleMainChange}
                handleAddLine={handleAddLine}
                handleDeleteLine={handleDeleteLine}
                handleLineChange={handleLineChange}
                finishedGoodColumns={finishedGoodColumns}
                rawMaterialColumns={rawMaterialColumns}
                totalFinishedCost={totalFinishedCost}
                totalRawMaterialCost={totalRawMaterialCost}
                totalBomCost={totalBomCost}
            />
        </div>
    );
};

export default Bom;