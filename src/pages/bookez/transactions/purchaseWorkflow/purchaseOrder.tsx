import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fmtMoney, formatDateForInput, formatDateForList, loadAllTemplateOptions, money, num, safePercent, todayYMD } from "../../../../utils/helperFunctions";
import { addPurchaseOrder, deletePurchaseOrder, getPurchaseOrderList, updatePurchaseOrder } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseOrder";
import { getAllTransactionSchema } from "../../../../redux/slices/professionalSlice/transactionSchema";
import Badge from "../../../../components/badge";
import Toggle from "../../../../components/toggle";
import SearchInput from "../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../components/buttons";
import DataTable from "../../../../components/DataTable";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
import Permission from "../../../../components/PermissionGuard";
import { ListingModel } from "../../../../components/modal";
import { getAllReportMapping } from "../../../../redux/slices/professionalSlice/reportMappingSlice";
import { getAllSystemConfigurations } from "../../../../redux/slices/systemConf";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import ProductMasterModal from "../../master/productMaster/ProductMasterFormModal";
import { getProductBalance } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import InputBorderLabel from "../../../../components/common/InputBorderLabel";

const VENDOR_FIELD_KEYS = new Set([
    "pOrdVendorCode",
    "pOrdVendorName",
]);

const PRODUCT_FIELD_KEYS = new Set([
    "productCode",
    "productName",
    "productId",
    "product",
]);

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
    availableQuantity: null,
    productType: "",

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
    pOrdVoucherNumber: "AUTO",
    pOrdVoucherDate: todayYMD(),

    pOrdPurchaseAccount: "",

    pOrdVendorCode: "",
    pOrdVendorName: "",

    pOrdStatus: "open",

    pOrdRemark: "",
    pOrdStatusRemark: "",
    pOrdStatusHistory: [],
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

const renderPurchaseOrderCellExtra = (column: any, row: any) => {
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

/* ===================================================
   PURCHASE ORDER
=================================================== */

const PurchaseOrder = () => {
    const dispatch = useDispatch<any>();

    const purchaseOrderState = useSelector(
        (state: any) => state.purchaseOrder
    );
    const { report } = useSelector((s: any) => s.reportMapping);
    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const purchaseOrders =
        purchaseOrderState?.purchaseOrders ||
        purchaseOrderState?.purchaseOrderList ||
        [];

    const pagination =
        purchaseOrderState?.pagination || defaultPagination;

    const loading =
        purchaseOrderState?.loading ||
        purchaseOrderState?.listingLoader ||
        false;

    const createLoading =
        purchaseOrderState?.createLoading ||
        purchaseOrderState?.addLoader ||
        false;

    const updateLoading =
        purchaseOrderState?.updateLoading || false;

    const deleteLoading =
        purchaseOrderState?.deleteLoading ||
        purchaseOrderState?.deleteLoader ||
        false;

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState("open");
    const [showModal, setShowModal] = useState(false);

    // ★ ADDED: Common Account Master modal state
    const [checkAccount, setCheckAccount] = useState(false);

    // ⭐ YELLOW STAR: ADDED — PRODUCT MASTER MODAL STATE
    const [checkProduct, setCheckProduct] = useState(false);

    // ⭐ YELLOW STAR: ADDED — REMEMBER PRODUCT ROW THAT OPENED MODAL
    const [
        productTargetRowIndex,
        setProductTargetRowIndex,
    ] = useState<number | null>(null);

    // ⭐ YELLOW STAR: ADDED — SEARCH TEXT FOR PRODUCT MODAL
    const [
        productSearchValue,
        setProductSearchValue,
    ] = useState("");

    // ★ ADDED: Prevent modal check before Account Master API completes
    const [accountListLoaded, setAccountListLoaded] = useState(false);

    const [editingRecord, setEditingRecord] = useState<any>(false);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const [downlaodPDF, setDownlaodPDF]: any = useState({ show: false, type: "" });
    const { configurations } = useSelector((state: any) => state.systemConfiguration);

    // ★ ADDED: Account Master data
    const { accounts = [] } = useSelector(
        (state: any) => state.accountMaster || {}
    );

    // ★ ADDED: Purchase Order needs vendor accounts
    const filterVendorAccount = useMemo(() => {
        return (accounts || []).filter(
            (account: any) =>
                String(account?.accountType || "").toLowerCase() === "vendor"
        );
    }, [accounts]);

    const [templateFields, setTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    // ⭐ YELLOW STAR: ADDED — VENDOR AND PRODUCT CREATE ACTIONS
    const templateFieldsWithCreateActions = useMemo(() => {
        return {
            ...templateFields,

            header: (templateFields?.header || []).map(
                (field: any) => {
                    const fieldKey = String(
                        field?.key || ""
                    );

                    if (!VENDOR_FIELD_KEYS.has(fieldKey)) {
                        return field;
                    }

                    return {
                        ...field,
                        largeData: true,
                        showCreateOnEmpty: true,
                        onCreateOption: (
                            _searchValue: string
                        ) => {
                            setCheckAccount(true);
                        },
                        createOptionLabel: (
                            searchValue: string
                        ) =>
                            searchValue
                                ? `+ Add "${searchValue}" as New Vendor`
                                : "+ Add New Vendor",
                    };
                }
            ),

            body: (templateFields?.body || []).map(
                (field: any) => {
                    const fieldKey = String(
                        field?.key || ""
                    );

                    if (!PRODUCT_FIELD_KEYS.has(fieldKey)) {
                        return field;
                    }

                    return {
                        ...field,
                        largeData: true,
                        showCreateOnEmpty: true,
                        onCreateOption: (
                            searchValue: string,
                            rowIndex: number
                        ) => {
                            setProductTargetRowIndex(rowIndex);
                            setProductSearchValue(searchValue);
                            setCheckProduct(true);
                        },
                        createOptionLabel: (
                            searchValue: string
                        ) =>
                            searchValue
                                ? `+ Add "${searchValue}" as New Product`
                                : "+ Add New Product",
                    };
                }
            ),
        };
    }, [templateFields]);

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
                ["productCode", "productId", "productName", "product"].includes(
                    String(field?.key || "")
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

    const hasValue = (value: any) => value !== undefined && value !== null && value !== "";

    const fillProductDetailsFromSelectedOption = (row: any, selectedOption: any) => {
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

            productType:
                product?.productType ||
                product?.dynamicFields?.productType ||
                row.productType ||
                "",

            availableQuantity: null,

            productDescription:
                product?.productDescription || row.productDescription || "",

            description:
                product?.productDescription || row.description || "",

            productHSNCode:
                product?.productHSNCode || row.productHSNCode || "",

            unit: unitCode,
            uom: unitCode,
            unitName: getUnitLabelFromSchema(unitCode),

            rate: hasValue(product?.purchasePrice)
                ? String(product.purchasePrice)
                : row.rate || "",

            cgst: csgst || row.cgst || "",
            cgstPercentage: csgst || row.cgstPercentage || "",

            igst: igst || row.igst || "",
            igstPercentage: igst || row.igstPercentage || "",
        };
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

            // ✅ keep typed/input values as it is
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

            // ✅ calculated values
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

    const fetchPurchaseOrders = async () => {
        await dispatch(
            getPurchaseOrderList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status: status,
            }) as any
        );
    };

    const productBalanceSignature = useMemo(
        () =>
            (form?.products || [])
                .map((item: any) =>
                    [
                        item?.productCode || "",
                        item?.productId || "",
                        item?.productName || "",
                    ].join("|")
                )
                .join("||"),
        [form?.products]
    );

    useEffect(() => {
        if (!showModal || !productBalanceSignature) return;

        let cancelled = false;

        const fetchAvailableQuantities = async () => {
            const now = new Date();
            const financialYear =
                now.getMonth() >= 3
                    ? now.getFullYear()
                    : now.getFullYear() - 1;

            const fromDate = new Date(
                financialYear,
                3,
                1,
                0,
                0,
                0,
                0
            ).toISOString();

            const toDate = now.toISOString();

            const balanceRows = await Promise.all(
                (form?.products || []).map(async (item: any) => {
                    const productCode = String(
                        item?.productCode || ""
                    ).trim();

                    if (!productCode) {
                        return {
                            productCode,
                            productType: String(
                                item?.productType || ""
                            )
                                .trim()
                                .toLowerCase(),
                            availableQuantity: null,
                        };
                    }

                    const productMaster =
                        getProductMasterFromRow(item) || {};

                    const productType = String(
                        item?.productType ||
                        productMaster?.productType ||
                        productMaster?.dynamicFields?.productType ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                    if (
                        ["serviceproduct", "nonstocks"].includes(
                            productType
                        )
                    ) {
                        return {
                            productCode,
                            productType,
                            availableQuantity: null,
                        };
                    }

                    try {
                        const balance: any = await dispatch(
                            getProductBalance({
                                productCode,
                                fromDate,
                                toDate,
                            }) as any
                        ).unwrap();

                        return {
                            productCode,
                            productType,
                            availableQuantity:
                                balance?.balanceQuantity !== undefined &&
                                balance?.balanceQuantity !== null
                                    ? balance.balanceQuantity
                                    : null,
                        };
                    } catch (error) {
                        console.log(
                            `Failed to fetch available quantity for ${productCode}`,
                            error
                        );

                        return {
                            productCode,
                            productType,
                            availableQuantity: null,
                        };
                    }
                })
            );

            if (cancelled) return;

            setForm((prev: any) => {
                const updatedProducts = (prev?.products || []).map(
                    (currentRow: any, index: number) => {
                        const balanceRow = balanceRows[index];

                        if (
                            !balanceRow ||
                            String(currentRow?.productCode || "") !==
                                String(balanceRow?.productCode || "")
                        ) {
                            return currentRow;
                        }

                        return {
                            ...currentRow,
                            productType: balanceRow.productType,
                            availableQuantity:
                                balanceRow.availableQuantity,
                        };
                    }
                );

                return {
                    ...prev,
                    products: updatedProducts,
                };
            });
        };

        void fetchAvailableQuantities();

        return () => {
            cancelled = true;
        };
    }, [
        showModal,
        productBalanceSignature,
        templateFields,
        dispatch,
    ]);

    useEffect(() => {
        dispatch(getAllTransactionSchema("purchaseOrder") as any);
    }, [dispatch]);

    useEffect(() => {
        fetchPurchaseOrders();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        /* @ts-ignore  */
        dispatch(getAllReportMapping({ moduleType: "purchaseOrder" }));
        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );
    }, []);

    // ★ ADDED: Load Account Master data for vendor availability check
    useEffect(() => {
        const loadAccounts = async () => {
            try {
                await dispatch(
                    getAllAccounts({
                        offset: 0,
                        limit: 100,
                        search: "",
                    }) as any
                ).unwrap();
            } catch (error) {
                console.log(
                    "Failed to load Account Master records",
                    error
                );
            } finally {
                setAccountListLoaded(true);
            }
        };

        loadAccounts();
    }, [dispatch]);

    // ★ ADDED: Open Account Master modal when no vendor account exists
    useEffect(() => {
        if (!showModal) return;
        if (editingRecord) return;
        if (!accountListLoaded) return;

        if (filterVendorAccount.length === 0) {
            setCheckAccount(true);
        }
    }, [
        showModal,
        editingRecord,
        accountListLoaded,
        filterVendorAccount.length,
    ]);

    /* ===================================================
       LOAD TRANSACTION SCHEMA WITH API OPTIONS
    =================================================== */

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

    /* ===================================================
       LIST COLUMNS
    =================================================== */

    const columns = [
        {
            key: "pOrdVoucherNumber",
            title: "Voucher No",
        },
        {
            key: "pOrdVoucherDate",
            title: "Date",
            render: (row: any) =>
                row?.pOrdVoucherDate
                    ? formatDateForList(row.pOrdVoucherDate)
                    : "-",
        },
        {
            key: "pOrdVendorName",
            title: "Vendor",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.pOrdVendorName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {row?.pOrdVendorCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "pOrdBody",
            title: "Items",
            render: (row: any) => row?.pOrdBody?.length || 0,
        },

        {
            key: "pOrdFooter",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {money(row?.pOrdFooter?.netAmount || 0)}
                </span>
            ),
        },

        {
            key: "pOrdStatus",
            title: "Order Status",
            render: (row: any) => (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {row?.pOrdStatus || "-"}
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
            await fetchPurchaseOrders();
            toast.success("Purchase order list refreshed");
        } finally {
            setRefreshing(false);
        }
    };

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        setCheckAccount(false);
        setCheckProduct(false);
        setProductTargetRowIndex(null);
        setProductSearchValue("");
        setForm(getDefaultForm());
    };

    const openAddModal = () => {
        resetMainForm();
        setShowModal(true);
    };

    const openEditModal = (record: any) => {
        const footer = record?.pOrdFooter || {};

        const products =
            record?.pOrdBody?.length > 0
                ? record.pOrdBody.map((item: any) => {
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

                            availableQuantity: null,

                            productType:
                                item?.productType ||
                                getProductMasterFromRow(item)?.productType ||
                                getProductMasterFromRow(item)?.dynamicFields?.productType ||
                                "",

                            unit: unitCode,
                            uom: unitCode,
                            unitName:
                                item?.unitName ||
                                getUnitLabelFromSchema(unitCode),

                            rate: item?.rate || "",

                            gross: item?.gross || item?.grossAmount || 0,
                            grossAmount:
                                item?.grossAmount || item?.gross || 0,

                            discount:
                                item?.discount ||
                                item?.discountPercentage ||
                                "",

                            discountPercentage:
                                item?.discountPercentage ||
                                item?.discount ||
                                "",

                            discountAmount: item?.discountAmount || 0,

                            taxableAmount: item?.taxableAmount || 0,

                            cgst:
                                item?.csgst ||
                                item?.cgstPercentage ||
                                "",

                            cgstPercentage:
                                item?.cgstPercentage ||
                                item?.cgst ||
                                "",

                            cgstAmount: item?.cgstAmount || 0,

                            sgst:
                                item?.sgst ||
                                item?.sgstPercentage ||
                                "",

                            sgstPercentage:
                                item?.sgstPercentage ||
                                item?.sgst ||
                                "",

                            sgstAmount: item?.sgstAmount || 0,

                            igst:
                                item?.igst ||
                                item?.igstPercentage ||
                                "",

                            igstPercentage:
                                item?.igstPercentage ||
                                item?.igst ||
                                "",

                            igstAmount: item?.igstAmount || 0,

                            taxAmount: item?.taxAmount || 0,

                            otherAmount: item?.otherAmount || 0,

                            netAmount:
                                item?.netAmount ||
                                item?.netTotal ||
                                0,

                            netTotal:
                                item?.netTotal ||
                                item?.netAmount ||
                                0,
                        })
                    );
                })
                : [{ ...emptyProductRow, id: Date.now() }];

        setEditingRecord(true);
        setErrors({});

        setForm({
            pOrdVoucherNumber: record?.pOrdVoucherNumber || "AUTO",

            pOrdVoucherDate: formatDateForInput(
                record?.pOrdVoucherDate
            ),

            pOrdVendorCode: record?.pOrdVendorCode || "",
            pOrdVendorName: record?.pOrdVendorName || "",

            pOrdPurchaseAccount: record?.pOrdPurchaseAccount || "",

            pOrdStatus: record?.pOrdStatus || "open",

            pOrdRemark: record?.pOrdRemark || "",
            pOrdStatusRemark: record?.pOrdStatusRemark || "",
            pOrdStatusHistory: record?.pOrdStatusHistory || [],

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

    // ★ ADDED: Refresh Purchase Order vendor dropdown after account creation
    const handleAccountSaved = async (savedResponse: any) => {
        try {
            const accountResponse = await dispatch(
                getAllAccounts({
                    offset: 0,
                    limit: 100,
                    search: "",
                }) as any
            ).unwrap();

            setAccountListLoaded(true);

            // ★ ADDED: Refresh Purchase Order report mapping
            await dispatch(
                getAllReportMapping({
                    moduleType: "purchaseOrder",
                }) as any
            ).unwrap();

            // ★ ADDED: Reload all dynamic dropdown options
            if (transactionsSchema) {
                const updatedData = await loadAllTemplateOptions(
                    transactionsSchema
                );

                setTemplateFields(updatedData);
            }

            const savedAccount =
                savedResponse?.data?.account ||
                savedResponse?.data?.data ||
                savedResponse?.data ||
                savedResponse?.account ||
                savedResponse;

            const refreshedAccounts =
                accountResponse?.data?.accounts ||
                accountResponse?.data?.data?.accounts ||
                accountResponse?.accounts ||
                accountResponse?.data?.items ||
                accountResponse?.items ||
                accountResponse?.data ||
                [];

            const vendorAccounts = Array.isArray(refreshedAccounts)
                ? refreshedAccounts.filter(
                    (account: any) =>
                        String(
                            account?.accountType || ""
                        ).toLowerCase() === "vendor"
                )
                : [];

            const savedCode =
                savedAccount?.accountCode ||
                savedAccount?.code ||
                "";

            const savedName =
                savedAccount?.accountName ||
                savedAccount?.name ||
                "";

            const createdVendor =
                vendorAccounts.find(
                    (account: any) =>
                        (
                            savedCode &&
                            String(account?.accountCode || "") ===
                            String(savedCode)
                        ) ||
                        (
                            savedName &&
                            String(account?.accountName || "") ===
                            String(savedName)
                        )
                ) ||
                (
                    savedCode ||
                        savedName
                        ? savedAccount
                        : null
                ) ||
                vendorAccounts[vendorAccounts.length - 1] ||
                null;

            // ★ ADDED: Automatically select the newly created vendor
            if (createdVendor) {
                setForm((prev: any) => ({
                    ...prev,

                    pOrdVendorCode:
                        createdVendor?.accountCode ||
                        createdVendor?.code ||
                        prev?.pOrdVendorCode ||
                        "",

                    pOrdVendorName:
                        createdVendor?.accountName ||
                        createdVendor?.name ||
                        prev?.pOrdVendorName ||
                        "",
                }));

                setErrors((prev: any) => ({
                    ...prev,
                    pOrdVendorCode: "",
                    pOrdVendorName: "",
                }));
            }
        } catch (error: any) {
            console.log(
                "Failed to refresh Purchase Order vendor options:",
                error
            );

            toast.error(
                error?.message ||
                "Account created, but Purchase Order vendor dropdown refresh failed"
            );
        } finally {
            setCheckAccount(false);
        }
    };

    // ⭐ YELLOW STAR: ADDED — REFRESH PRODUCT OPTIONS AND AUTO-SELECT CREATED PRODUCT
    const handleProductSaved = async (
        savedResponse: any
    ) => {
        try {
            await dispatch(
                getAllReportMapping({
                    moduleType: "purchaseOrder",
                }) as any
            ).unwrap();

            let updatedData = templateFields;

            if (transactionsSchema) {
                updatedData =
                    await loadAllTemplateOptions(
                        transactionsSchema
                    );

                setTemplateFields(
                    updatedData
                );
            }

            const savedProduct =
                savedResponse?.data?.product ||
                savedResponse?.data?.data?.product ||
                savedResponse?.data?.data ||
                savedResponse?.data ||
                savedResponse?.product ||
                savedResponse;

            const savedCode =
                savedProduct?.productCode ||
                "";

            const savedName =
                savedProduct?.productName ||
                "";

            const productFields = (
                updatedData?.body || []
            ).filter((field: any) =>
                PRODUCT_FIELD_KEYS.has(
                    String(field?.key || "")
                )
            );

            let selectedField: any = null;
            let selectedOption: any = null;

            for (const field of productFields) {
                const option = (
                    field?.options || []
                ).find((item: any) => {
                    const raw =
                        item?.raw || {};

                    return (
                        (
                            savedCode &&
                            String(
                                raw?.productCode ||
                                item?.value ||
                                ""
                            ) ===
                            String(savedCode)
                        ) ||
                        (
                            savedName &&
                            String(
                                raw?.productName ||
                                item?.label ||
                                ""
                            ) ===
                            String(savedName)
                        )
                    );
                });

                if (option) {
                    selectedField = field;
                    selectedOption = option;
                    break;
                }
            }

            const createdProduct =
                selectedOption?.raw ||
                savedProduct ||
                {};

            setForm((prev: any) => {
                const updatedProducts = [
                    ...(prev.products || []),
                ];

                let rowIndex =
                    productTargetRowIndex !== null &&
                        productTargetRowIndex >= 0 &&
                        productTargetRowIndex <
                        updatedProducts.length
                        ? productTargetRowIndex
                        : updatedProducts.findIndex(
                            (row: any) =>
                                !row?.productCode &&
                                !row?.productName &&
                                !row?.productId
                        );

                if (rowIndex < 0) {
                    rowIndex =
                        updatedProducts.length;

                    updatedProducts.push({
                        ...emptyProductRow,
                        id: Date.now(),
                    });
                }

                let updatedRow = {
                    ...(
                        updatedProducts[
                        rowIndex
                        ] ||
                        emptyProductRow
                    ),
                };

                if (
                    selectedField &&
                    selectedOption
                ) {
                    updatedRow =
                        applyMappedFields(
                            selectedField,
                            selectedOption.value,
                            updatedRow
                        );

                    updatedRow =
                        fillProductDetailsFromSelectedOption(
                            updatedRow,
                            selectedOption
                        );
                }

                const unitCode =
                    createdProduct?.unit ||
                    createdProduct?.uom ||
                    updatedRow?.unit ||
                    updatedRow?.uom ||
                    "";

                const cgstValue =
                    createdProduct?.cgstPercentage ??
                    createdProduct?.cgst ??
                    createdProduct?.csgst ??
                    createdProduct?.cgstRate ??
                    createdProduct?.tax?.cgstPercentage ??
                    createdProduct?.tax?.cgst ??
                    updatedRow?.cgst ??
                    "";

                const sgstValue =
                    createdProduct?.sgstPercentage ??
                    createdProduct?.sgst ??
                    createdProduct?.csgst ??
                    createdProduct?.sgstRate ??
                    createdProduct?.tax?.sgstPercentage ??
                    createdProduct?.tax?.sgst ??
                    updatedRow?.sgst ??
                    "";

                const igstValue =
                    createdProduct?.igstPercentage ??
                    createdProduct?.igst ??
                    createdProduct?.igstRate ??
                    createdProduct?.tax?.igstPercentage ??
                    createdProduct?.tax?.igst ??
                    updatedRow?.igst ??
                    "";

                updatedRow = {
                    ...updatedRow,

                    productCode:
                        createdProduct?.productCode ||
                        savedCode ||
                        updatedRow?.productCode ||
                        "",

                    productName:
                        createdProduct?.productName ||
                        savedName ||
                        updatedRow?.productName ||
                        "",

                    productId:
                        createdProduct?._id ||
                        createdProduct?.productId ||
                        updatedRow?.productId ||
                        "",

                    productDescription:
                        createdProduct?.productDescription ||
                        updatedRow?.productDescription ||
                        "",

                    description:
                        createdProduct?.productDescription ||
                        createdProduct?.description ||
                        updatedRow?.description ||
                        "",

                    productHSNCode:
                        createdProduct?.productHSNCode ||
                        updatedRow?.productHSNCode ||
                        "",

                    unit: unitCode,
                    uom: unitCode,

                    unitName:
                        getUnitLabelFromSchema(
                            unitCode
                        ),

                    rate:
                        createdProduct?.purchasePrice ??
                        createdProduct?.rate ??
                        updatedRow?.rate ??
                        "",

                    availableQuantity: null,

                    productType:
                        createdProduct?.productType ||
                        createdProduct?.dynamicFields?.productType ||
                        "",

                    cgst: cgstValue,
                    cgstPercentage: cgstValue,

                    sgst: sgstValue,
                    sgstPercentage: sgstValue,

                    igst: igstValue,
                    igstPercentage: igstValue,
                };

                if (num(igstValue) > 0) {
                    updatedRow.cgst = "";
                    updatedRow.sgst = "";
                    updatedRow.cgstPercentage = "";
                    updatedRow.sgstPercentage = "";
                    updatedRow.cgstAmount = 0;
                    updatedRow.sgstAmount = 0;
                }

                if (
                    num(cgstValue) > 0 ||
                    num(sgstValue) > 0
                ) {
                    updatedRow.igst = "";
                    updatedRow.igstPercentage = "";
                    updatedRow.igstAmount = 0;
                }

                updatedRow =
                    calculateRow(
                        normalizeRowKeys(
                            updatedRow
                        )
                    );

                updatedProducts[
                    rowIndex
                ] = updatedRow;

                return {
                    ...prev,
                    products:
                        updatedProducts,
                };
            });

            setErrors((prev: any) => ({
                ...prev,
                products: "",
            }));
        } catch (error: any) {
            console.log(
                "Failed to refresh Purchase Order product options:",
                error
            );

            toast.error(
                error?.message ||
                "Product created, but Purchase Order product dropdown refresh failed"
            );
        } finally {
            setCheckProduct(false);
            setProductTargetRowIndex(null);
            setProductSearchValue("");
        }
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
    const enableDuplicatePro = useMemo(() => {
        const locationConfig = configurations?.[0]?.systemConfiguration?.allowDuplicateProduct
        return locationConfig === true || locationConfig === "true";
    }, [configurations]);

    const handleRowChange = (index: number, key: string, value: any) => {
        const duplicate = Boolean(form?.products?.filter((e: any) => e?.productCode == value)?.length);
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

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(currentField, value, updatedRow);
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
                updatedRow.productType = raw?.productType || raw?.dynamicFields?.productType || "";
                updatedRow.availableQuantity = null;
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
        if (filledRows.length === 0) { err.products = "Please add at least one product"; }

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
                if (value === undefined || value === null || value === "") {
                    err[`row_${index}_${field.key}`] = `${field.label || field.key} is required`;
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
        if (err.products) { toast.error(err.products); }
        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        const bodyKeys = (templateFields?.body || []).map((field: any) => field.key);
        return (form.products || [])
            .filter((row: any) => {
                return bodyKeys.some((key: string) => {
                    const value = row?.[key];
                    return (value !== undefined && value !== null && value !== "");
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

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const products = cleanRows();
        const footer = calculateFooter(products);

        const payload: any = {
            pOrdVoucherDate: form.pOrdVoucherDate,

            pOrdVendorCode: form.pOrdVendorCode,
            pOrdVendorName: form.pOrdVendorName,

            pOrdPurchaseAccount: form.pOrdPurchaseAccount,

            pOrdStatus: form.pOrdStatus || "open",

            pOrdRemark: form.pOrdRemark,

            pOrdBody: products.map((item: any) => ({
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

                rate: String(item.rate),

                gross: fmtMoney(item.grossAmount),
                grossAmount: fmtMoney(item.grossAmount),

                discount: String(
                    item.discountPercentage || item.discount || ""
                ),

                discountPercentage: String(
                    item.discountPercentage || item.discount || ""
                ),

                discountAmount: fmtMoney(item.discountAmount),

                taxableAmount: fmtMoney(item.taxableAmount),

                cgst: String(getTaxValue(item.cgst, item.cgstPercentage)),
                cgstPercentage: String(getTaxValue(item.cgstPercentage, item.cgst)),

                sgst: String(getTaxValue(item.sgst, item.sgstPercentage)),
                sgstPercentage: String(getTaxValue(item.sgstPercentage, item.sgst)),

                igst: String(getTaxValue(item.igst, item.igstPercentage)),
                igstPercentage: String(getTaxValue(item.igstPercentage, item.igst)),
                igstAmount: fmtMoney(item.igstAmount),

                taxAmount: fmtMoney(item.taxAmount),

                otherAmount: fmtMoney(item.otherAmount),

                netAmount: fmtMoney(item.netAmount || item.netTotal),
                netTotal: fmtMoney(item.netTotal || item.netAmount),
            })),

            pOrdFooter: {
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
                totalDiscountAmount: fmtMoney(
                    footer.totalDiscountAmount
                ),
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
                    updatePurchaseOrder({
                        pOrdVoucherNumber: form?.pOrdVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                toast.success("Purchase order updated successfully");
            } else {
                await dispatch(addPurchaseOrder({ payload }) as any).unwrap();

                toast.success("Purchase order created successfully");
            }

            setShowModal(false);
            setCheckAccount(false);
            resetMainForm();

            fetchPurchaseOrders();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;

            if (!voucherNumber) {
                toast.error("Purchase order voucher number not found");
                return;
            }

            await dispatch(
                deletePurchaseOrder({
                    pOrdVoucherNumber: voucherNumber,
                }) as any
            ).unwrap();

            toast.success("Purchase order deleted successfully");

            await fetchPurchaseOrders();
        } catch (err: any) {
            toast.error(
                err?.message ||
                err?.payload?.message ||
                "Failed to delete purchase order"
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


    const isClosedPurchaseOrder = (record: any) => {
        const pOrdStatus = String(
            record?.pOrdStatus || ""
        ).toLowerCase();

        return pOrdStatus === "close" || pOrdStatus === "closed";
    };

    const handleEditPurOrder = (record: any) => {
        if (isClosedPurchaseOrder(record)) {
            toast.error("You can't edit closed Order");
            return;
        }

        openEditModal(record);
    };

    const handleDeletePurOrderClick = (e: any, record: any) => {
        if (isClosedPurchaseOrder(record)) {
            toast.error("You can't delete closed Order");
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        let x = rect.left - 150;

        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({
            show: true,
            x,
            y,
            voucherNumber: record?.pOrdVoucherNumber,
        });
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div
                id="purchase-order-header"
                className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <div
                    id="purchase-order-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Purchase Orders:",
                            varient: "primary",
                        }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
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

                    <Permission module="bookez" permissionKey="purchaseOrder" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openAddModal,
                                text: "Add Purchase Order",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={purchaseOrders}
                loading={loading}
                emptyMessage={`No ${status} purchase order found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "purchaseOrder",
                                    record,
                                    CustomerCode: record?.pOrdVendorCode,
                                    voucherNumber: record?.pOrdVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>
                        <Permission module="bookez" permissionKey="purchaseOrder" action="update">
                            {/* <button
                                id="purchase-order-edit-button"
                                onClick={() => openEditModal(record)}
                                className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button> */}

                            <button id="purchase-order-edit-button"
                                onClick={() => handleEditPurOrder(record)}
                                className={`rounded-md p-2 hover:bg-primary/10 transition-all duration-200 cursor-pointer text-primary hover:bg-primary/10 hover:text-primary ${isClosedPurchaseOrder(record)

                                    }`}
                            >                            <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="purchaseOrder" action="delete">
                            <button
                                id="purchase-order-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => handleDeletePurOrderClick(e, record)}
                                className={`rounded-md p-2 hover:bg-primary/10 transition-all duration-200 disabled:opacity-50 cursor-pointer text-danger hover:bg-danger/10 hover:text-danger ${isClosedPurchaseOrder
                                    (record)
                                    }`}
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
                    message="Are you sure you want to delete this purchase order?"
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

            {!fieldsLoading && (
                <DynamicAddForm
                    {...{
                        show: showModal,
                        setShow: setShowModal,
                        edit: Boolean(editingRecord),
                        title: "Purchase Order",
                        subtitle: "Fill in the purchase order details below",
                        loading: createLoading || updateLoading,
                        onClose: () => {
                            setShowModal(false);
                            setCheckAccount(false);
                            setCheckProduct(false);
                            setProductSearchValue("");
                            resetMainForm();
                        },
                        onSubmit: handleSubmit,
                        form,
                        errors,
                        handleAddRow,
                        handleDeleteRow,
                        handleRowChange,
                        footerTotals,

                        // dynamic schema with options
                        inputData: {
                            ...templateFieldsWithCreateActions,
                            footer: dynamicFooterArray,
                        },

                        bodyKey: "products",
                        handleChange: handleMainChange,
                        bodyCellExtraRenderer: renderPurchaseOrderCellExtra,

                        // ★ ADDED: Shared Account Master modal props
                        checkAccount,
                        setCheckAccount,
                        onAccountSaved: handleAccountSaved,
                    }}
                />
            )}

            <ProductMasterModal
                show={checkProduct}
                setShow={(value: boolean) => {
                    setCheckProduct(value);

                    if (!value) {
                        setProductTargetRowIndex(
                            null
                        );

                        setProductSearchValue(
                            ""
                        );
                    }
                }}
                onSaved={handleProductSaved}
                title="Add New Product"
                initialProductName={
                    productSearchValue
                }
            />

            {/* @ts-ignore  */}
            <ListingModel
                {...{
                    show: downlaodPDF?.show,
                    downlaodPDF,
                    entryType: "purchase-order",
                    setShow: () =>
                        setDownlaodPDF(() => ({
                            show: !downlaodPDF?.show,
                        })),
                    rowData: downlaodPDF?.record,
                    report,
                    title: "Download Purchase Order PDF",
                    cancelText: "Cancel",
                    confirmText: "Confirm",
                }}
            />
        </div>
    );
};

export default PurchaseOrder;