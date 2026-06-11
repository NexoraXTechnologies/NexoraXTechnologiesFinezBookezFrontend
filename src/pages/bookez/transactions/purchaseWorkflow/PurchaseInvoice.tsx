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
    addPurchaseInvoice,
    deletePurchaseInvoice,
    getPurchaseInvoiceList,
    updatePurchaseInvoice,
} from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";

import { getGrnList } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/grnSlice";

import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../components/buttons";

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
    pInvVoucherNumber: "AUTO",
    pInvVoucherDate: todayYMD(),

    grnVoucherNumber: "",

    pInvVendorCode: "",
    pInvVendorName: "",

    pInvPurAccount: "SA003",
    pInvStatus: "open",

    pInvRemark: "",
    pInvStatusRemark: "",
    pInvStatusHistory: [],
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
        body: updatedBody,
        footer: updatedFooter,
    };
};

/* ===================================================
   PURCHASE INVOICE
=================================================== */

const PurchaseInvoice = () => {
    const dispatch = useDispatch();

    const purchaseInvoiceState = useSelector((state: any) => state.purchaseInvoice);
    const grnState = useSelector((state: any) => state.grn);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const purchaseInvoices =
        purchaseInvoiceState?.purchaseInvoices ||
        purchaseInvoiceState?.purchaseInvoiceList ||
        purchaseInvoiceState?.purchaseInvoiceRecords ||
        purchaseInvoiceState?.purchaseInvoiceData ||
        purchaseInvoiceState?.pInvData ||
        [];

    const grns =
        grnState?.grns ||
        grnState?.grnList ||
        grnState?.grnRecords ||
        grnState?.grnData ||
        grnState?.data ||
        [];

    const grnLoading =
        grnState?.loading ||
        grnState?.listingLoader ||
        grnState?.listLoading ||
        false;

    const pagination = purchaseInvoiceState?.pagination || defaultPagination;

    const loading =
        purchaseInvoiceState?.loading ||
        purchaseInvoiceState?.listingLoader ||
        false;

    const createLoading =
        purchaseInvoiceState?.createLoading ||
        purchaseInvoiceState?.addLoader ||
        false;

    const updateLoading = purchaseInvoiceState?.updateLoading || false;

    const deleteLoading =
        purchaseInvoiceState?.deleteLoading ||
        purchaseInvoiceState?.deleteLoader ||
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

    const [showGrnModal, setShowGrnModal] = useState(false);
    const [grnSearch, setGrnSearch] = useState("");
    const [selectedGrn, setSelectedGrn] = useState<any>(null);

    // ✅ Local modal loading states to stop blinking
    const [grnModalLoading, setGrnModalLoading] = useState(false);
    const [grnLoaded, setGrnLoaded] = useState(false);

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

    const fetchPurchaseInvoices = async () => {
        await dispatch(
            getPurchaseInvoiceList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status,
            }) as any
        );
    };

    const fetchGrns = async (searchText = "") => {
        setGrnModalLoading(true);

        try {
            await dispatch(
                getGrnList({
                    offset: 0,
                    limit: 20,
                    search: searchText,
                    status: "open",
                }) as any
            ).unwrap();

            setGrnLoaded(true);
        } catch (error) {
            setGrnLoaded(true);
            toast.error("Failed to load GRN list");
        } finally {
            setGrnModalLoading(false);
        }
    };

    /*
       Same as React Native Purchase Invoice flow:
       - After saving invoice, check GRN pending invoice quantity
       - API returns products with pendingInvoiceQuantity
       - If every pendingInvoiceQuantity is 0, close GRN
       - Because GRN modal loads only open GRNs, closed GRN will disappear from list
    */
    const syncGrnStatusAfterPurchaseInvoice = async (grnVoucherNumber: string) => {
        if (!grnVoucherNumber) return "";

        try {
            const summaryRes = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/analysis/purchaseInvoice/byGrnVoucherNumber/${grnVoucherNumber}`
            );

            const products =
                summaryRes?.data?.data?.products ||
                summaryRes?.data?.products ||
                [];

            const allPendingZero =
                Array.isArray(products) &&
                products.length > 0 &&
                products.every(
                    (item: any) => num(item?.pendingInvoiceQuantity || 0) === 0
                );

            const nextGrnStatus = allPendingZero ? "close" : "open";

            await professionalAxios.put(
                `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/update/${grnVoucherNumber}`,
                {
                    grnStatus: nextGrnStatus,
                }
            );

            return nextGrnStatus;
        } catch (error) {
            console.log("Failed to sync GRN status after Purchase Invoice", error);
            toast.error("Purchase invoice saved but failed to update GRN status");
            return "";
        }
    };

    useEffect(() => {
        dispatch(getAllTransactionSchema("purchaseInvoice") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchPurchaseInvoices();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!showGrnModal) return;
        if (!grnLoaded) return;

        const timer = setTimeout(() => {
            fetchGrns(grnSearch.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [grnSearch]);

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
            key: "pInvVoucherNumber",
            title: "Voucher No",
        },
        {
            key: "pInvVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.pInvVoucherDate
                    ? formatDateForList(row.pInvVoucherDate)
                    : "-",
        },
        {
            key: "pInvVendorName",
            title: "Vendor",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">
                        {row?.pInvVendorName || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                        {row?.pInvVendorCode || "-"}
                    </div>
                </div>
            ),
        },
        // {
        //     key: "grnVoucherNumber",
        //     title: "GRN No",
        //     render: (row: any) => row?.grnVoucherNumber || "-",
        // },
       
         {
            key: "pInvBody",
            title: "Items",
            render: (row: any) => row?.pInvBody?.length || 0,
        },
        {
            key: "pInvFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-indigo-700">
                    {money(row?.pInvFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "pInvStatus",
            title: "Status",
            render: (row: any) => (
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700">
                    {row?.pInvStatus || "-"}
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
            await fetchPurchaseInvoices();
            toast.success("Purchase invoice list refreshed");
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

        setSelectedGrn(null);
        setGrnSearch("");
        setGrnLoaded(false);

        setShowGrnModal(true);

        await fetchGrns("");
    };

    const handleGrnSelect = (grn: any) => {
        setSelectedGrn(grn);
    };

    const buildPurchaseInvoiceProductRow = (item: any) => {
        const unitCode = item?.unit || item?.uom || "";

        const quantity =
            item?.acceptedQuantity !== undefined &&
            item?.acceptedQuantity !== null &&
            item?.acceptedQuantity !== ""
                ? item.acceptedQuantity
                : item?.quantity || "";

        return calculateRow(
            normalizeRowKeys({
                id: item?.id || Date.now() + Math.random(),

                productCode: item?.productCode || "",
                productName: item?.productName || "",
                productId: item?.productId || item?.productCode || "",

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

                quantity,

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

    const handleGrnModalClose = () => {
        setShowGrnModal(false);
        setSelectedGrn(null);
        setGrnSearch("");
        setGrnLoaded(false);
        setGrnModalLoading(false);

        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
        setShowModal(true);
    };

    const handleGrnConfirm = async () => {
        if (!selectedGrn) {
            toast.error("Please select GRN");
            return;
        }

        try {
            setGrnModalLoading(true);

            const grnVoucherNumber = selectedGrn?.grnVoucherNumber || "";
            const summaryRes = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/analysis/purchaseInvoice/byGrnVoucherNumber/${grnVoucherNumber}`
            );

            const pendingProducts =
                summaryRes?.data?.data?.products ||
                summaryRes?.data?.products ||
                [];

            const grnBody = selectedGrn?.grnBody || [];

            const pendingProductMap = new Map(
                (Array.isArray(pendingProducts) ? pendingProducts : []).map((item: any) => [
                    String(item?.productCode || ""),
                    item,
                ])
            );

            const pendingRows = (grnBody || [])
                .map((item: any) => {
                    const pending = pendingProductMap.get(
                        String(item?.productCode || "")
                    );

                    const pendingInvoiceQuantity = num(
                        pending?.pendingInvoiceQuantity ??
                        pending?.balanceQuantity ??
                        (num(pending?.acceptedQuantity) - num(pending?.invoicedQuantity))
                    );

                    if (pendingInvoiceQuantity <= 0) return null;

                    return {
                        ...item,
                        quantity: String(pendingInvoiceQuantity),
                        acceptedQuantity: String(pendingInvoiceQuantity),
                    };
                })
                .filter(Boolean);

            if (pendingRows.length === 0) {
                await syncGrnStatusAfterPurchaseInvoice(grnVoucherNumber);
                await fetchGrns(grnSearch.trim());
                toast.error("No pending quantity found for this GRN");
                return;
            }

            const products = pendingRows.map((item: any) =>
                buildPurchaseInvoiceProductRow(item)
            );

            setForm({
                ...getDefaultForm(),

                grnVoucherNumber,

                pInvVendorCode: selectedGrn?.grnVendorCode || "",
                pInvVendorName: selectedGrn?.grnVendorName || "",

                products,
            });

            setErrors({});
            setEditingRecord(null);
            setShowGrnModal(false);
            setGrnLoaded(false);
            setShowModal(true);
        } catch (error) {
            console.log("Failed to prepare GRN for purchase invoice", error);
            toast.error("Failed to load pending GRN quantity");
        } finally {
            setGrnModalLoading(false);
        }
    };

    const openEditModal = (record: any) => {
        const footer = record?.pInvFooter || {};

        const products =
            record?.pInvBody?.length > 0
                ? record.pInvBody.map((item: any) => buildPurchaseInvoiceProductRow(item))
                : [{ ...emptyProductRow, id: Date.now() }];

        setEditingRecord(true);
        setErrors({});

        setForm({
            pInvVoucherNumber: record?.pInvVoucherNumber || "AUTO",

            pInvVoucherDate: formatDateForInput(record?.pInvVoucherDate),

            grnVoucherNumber: record?.grnVoucherNumber || "",

            pInvVendorCode: record?.pInvVendorCode || "",
            pInvVendorName: record?.pInvVendorName || "",

            pInvPurAccount: record?.pInvPurAccount || "SA003",
            pInvStatus: record?.pInvStatus || "open",

            pInvRemark: record?.pInvRemark || "",
            pInvStatusRemark: record?.pInvStatusRemark || "",
            pInvStatusHistory: record?.pInvStatusHistory || [],

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

            updatedRow = normalizeRowKeys(updatedRow);

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
            pInvVoucherDate: form.pInvVoucherDate,

            grnVoucherNumber: form?.grnVoucherNumber || "",

            pInvVendorCode: form.pInvVendorCode,
            pInvVendorName: form.pInvVendorName,

            pInvPurAccount: form.pInvPurAccount || "SA003",
            pInvStatus: form.pInvStatus || "open",

            pInvRemark: form.pInvRemark,

            pInvBody: products.map((item: any) =>
                removeEmptyValues({
                    grnVoucherNumber: form?.grnVoucherNumber || "",

                    productCode: item.productCode,
                    productName: item.productName,
                    productId: item.productId,

                    productDescription:
                        item.productDescription || item.description,

                    description:
                        item.description || item.productDescription,

                    productHSNCode: item.productHSNCode,

                    remarks: item.remarks,

                    quantity: String(item.quantity || 0),

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

            pInvFooter: {
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
                    updatePurchaseInvoice({
                        purchaseInvoiceNumber: form?.pInvVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                if (payload?.grnVoucherNumber) {
                    await syncGrnStatusAfterPurchaseInvoice(
                        payload.grnVoucherNumber
                    );
                }

                toast.success("Purchase invoice updated successfully");
            } else {
                await dispatch(addPurchaseInvoice({ payload }) as any).unwrap();

                if (payload?.grnVoucherNumber) {
                    const grnStatus = await syncGrnStatusAfterPurchaseInvoice(
                        payload.grnVoucherNumber
                    );

                    if (grnStatus === "close") {
                        toast.success(
                            "Purchase invoice created successfully and GRN closed"
                        );
                    } else {
                        toast.success("Purchase invoice created successfully");
                    }
                } else {
                    toast.success("Purchase invoice created successfully");
                }
            }

            setShowModal(false);
            resetMainForm();

            setSelectedGrn(null);
            setGrnSearch("");
            setGrnLoaded(false);

            await fetchPurchaseInvoices();

            // Refresh open GRNs so closed GRN is removed from modal list
            await fetchGrns("");
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;

            if (!voucherNumber) {
                toast.error("Purchase invoice voucher number not found");
                return;
            }

            await dispatch(
                deletePurchaseInvoice({
                    purchaseInvoiceNumber: voucherNumber,
                }) as any
            ).unwrap();

            toast.success("Purchase invoice deleted successfully");

            await fetchPurchaseInvoices();
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.payload?.message ||
                "Failed to delete purchase invoice"
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
        purchaseInvoices.length === 0 &&
        (loading || fieldsLoading);

    if (showInitialSkeleton) {
        return <ModulePageSkeleton rows={8} columns={7} />;
    }

    const showGrnSkeleton =
        grnModalLoading ||
        grnLoading ||
        !grnLoaded;

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div
                id="purchase-invoice-header"
                className="mb-3 flex items-center"
            >
                <div
                    id="purchase-invoice-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Purchase Invoices:",
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
                            text: "Add Purchase Invoice",
                        }}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={purchaseInvoices}
                loading={loading}
                emptyMessage={`No ${status} purchase invoice found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="purchase-invoice-edit-button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            id="purchase-invoice-delete-button"
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
                                    voucherNumber: record?.pInvVoucherNumber,
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
                    message="Are you sure you want to delete this purchase invoice?"
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
                show={showGrnModal}
                setShow={setShowGrnModal}
                title="Select GRN"
                state={false}
                handleSubmit={handleGrnConfirm}
                handleClose={handleGrnModalClose}
                loader={grnModalLoading || grnLoading}
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
                                value={grnSearch}
                                onChange={(e) =>
                                    setGrnSearch(e.target.value)
                                }
                                placeholder="Search GRN code..."
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
                            {showGrnSkeleton ? (
                                <ModalListSkeleton rows={3} />
                            ) : grns.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-gray-500">
                                    No GRN found
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {grns.map((grn: any, index: number) => {
                                        const grnNumber =
                                            grn?.grnVoucherNumber || "-";

                                        const vendorName =
                                            grn?.grnVendorName || "-";

                                        const grnBody = grn?.grnBody || [];

                                        const selectedGrnNumber =
                                            selectedGrn?.grnVoucherNumber || "";

                                        const isSelected =
                                            String(selectedGrnNumber) ===
                                            String(grnNumber);

                                        return (
                                            <button
                                                key={`${grnNumber}-${index}`}
                                                type="button"
                                                onClick={() =>
                                                    handleGrnSelect(grn)
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
                                                            {grnNumber} - {vendorName}
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium text-gray-500">
                                                            Items: {grnBody?.length || 0}
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
                        title: "Purchase Invoice",
                        subtitle: "Fill in the purchase invoice details below",
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

export default PurchaseInvoice;
