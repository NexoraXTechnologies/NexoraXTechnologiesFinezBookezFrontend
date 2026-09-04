import { useEffect, useMemo, useState } from "react";
import { Download, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
    fmtMoney,
    formatDateForInput,
    formatDateForList,
    loadAllTemplateOptions,
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
import Permission from "../../../../components/PermissionGuard";
import { getAllReportMapping } from "../../../../redux/slices/professionalSlice/reportMappingSlice";
import { getAllSystemConfigurations } from "../../../../redux/slices/systemConf";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import ProductMasterModal from "../../master/productMaster/ProductMasterFormModal";
import { getProductBalance } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import InputBorderLabel from "../../../../components/common/InputBorderLabel";
import { getCompany } from "../../../../redux/slices/professionalSlice/professionalCompanyMaster.slice";

const VENDOR_FIELD_KEYS = new Set([
    "pInvVendorCode",
    "pInvVendorName",
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
    grnPendingInvoiceQuantity: null,
    maxQuantity: null,
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


const renderPurchaseInvoiceCellExtra = (
    column: any,
    row: any,
    enableServiceProductInventory: boolean
) => {
    if (column?.key !== "quantity" || !row?.productCode) return null;

    const productType = String(row?.productType || "").trim().toLowerCase();

    if (productType === "nonstocks") return null;

    if (
        productType === "serviceproduct" &&
        !enableServiceProductInventory
    ) {
        return null;
    }

    return (
        <InputBorderLabel
            label="Avl Qty"
            value={row?.availableQuantity}
            loading={
                row?.availableQuantity === null ||
                row?.availableQuantity === undefined
            }
            successWhenPositive
        />
    );
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

    // ★ ADDED: Account Master modal state
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

    // ★ ADDED: Wait until Account Master API completes
    const [accountListLoaded, setAccountListLoaded] = useState(false);

    const [editingRecord, setEditingRecord] = useState<any>(false);
    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const [showGrnModal, setShowGrnModal] = useState(false);
    const [grnSearch, setGrnSearch] = useState("");
    const [selectedGrn, setSelectedGrn] = useState<any>(null);
    const { report } = useSelector((s: any) => s.reportMapping);
    const [downlaodPDF, setDownlaodPDF]: any = useState({ show: false, type: "" });
    // ✅ Local modal loading states to stop blinking
    const [grnModalLoading, setGrnModalLoading] = useState(false);
    const [grnLoaded, setGrnLoaded] = useState(false);
    const [templateFields, setTemplateFields] = useState<any>({ header: [], body: [], footer: [], });

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
                            if (!String(form?.pInvVendorCode || "").trim()) {
                                toast.error("Please select vendor before selecting a product");
                                setErrors((prev: any) => ({
                                    ...prev,
                                    pInvVendorCode: "Please select vendor first",
                                }));
                                return;
                            }

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
    }, [templateFields, form?.pInvVendorCode]);

    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [confirmTooltip, setConfirmTooltip] = useState<any>({ show: false, x: null, y: null, voucherNumber: null, grnVoucherNumber: null, record: null, });
    const { configurations } = useSelector((state: any) => state.systemConfiguration);

    const enableServiceProductInventory = useMemo(() => {
        const value = configurations?.[0]?.inventoryConfiguration?.enableServiceProductInventory;
        return value === true || value === "true";
    }, [configurations]);

    const { company } = useSelector((state: any) => state.professionalCompanyMaster);

    const { accounts = [] } = useSelector(
        (state: any) => state.accountMaster || {}
    );

    // ★ ADDED: Purchase Invoice requires vendor accounts
    const vendorAccounts = useMemo(() => {
        return (accounts || []).filter(
            (account: any) =>
                String(account?.accountType || "").toLowerCase() === "vendor"
        );
    }, [accounts]);

    const getHeaderFieldByKey = (key: string) => {
        return templateFields?.header?.find((field: any) => field.key === key);
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

    const applyPurchaseInvoiceTaxRule = (row: any, vendorCode: string, productSource?: any) => {
        const selectedVendor = vendorAccounts?.find(
            (e: any) => String(e?.accountCode || "") === String(vendorCode || "")
        );

        const companyState = company?.state?.isoCode;
        const vendorState = selectedVendor?.state?.isoCode;

        if (!companyState || !vendorState) return row;

        const product = productSource || getProductMasterFromRow(row) || {};

        const cgstValue =
            product?.csgst ??
            product?.CGST ??
            product?.cgstRate ??
            product?.cgstPercentage ??
            product?.cgst ??
            product?.tax?.cgstPercentage ??
            product?.tax?.cgst ??
            row?.cgst ??
            row?.cgstPercentage ??
            "";

        const sgstValue =
            product?.csgst ??
            product?.SGST ??
            product?.sgstRate ??
            product?.sgstPercentage ??
            product?.sgst ??
            product?.tax?.sgstPercentage ??
            product?.tax?.sgst ??
            row?.sgst ??
            row?.sgstPercentage ??
            "";

        const igstValue =
            product?.igst ??
            product?.IGST ??
            product?.igstRate ??
            product?.igstPercentage ??
            product?.tax?.igstPercentage ??
            product?.tax?.igst ??
            row?.igst ??
            row?.igstPercentage ??
            "";

        if (companyState == vendorState) {
            return {
                ...row,
                cgst: cgstValue,
                cgstPercentage: cgstValue,
                sgst: sgstValue,
                sgstPercentage: sgstValue,
                igst: "",
                igstPercentage: "",
                igstAmount: 0,
            };
        }

        return {
            ...row,
            cgst: "",
            cgstPercentage: "",
            sgst: "",
            sgstPercentage: "",
            cgstAmount: 0,
            sgstAmount: 0,
            igst: igstValue,
            igstPercentage: igstValue,
        };
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
                        productType === "nonstocks" ||
                        (
                            productType === "serviceproduct" &&
                            !enableServiceProductInventory
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
        enableServiceProductInventory,
    ]);

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
                    <div className="font-medium text-card-foreground">
                        {row?.pInvVendorName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
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
                <span className="font-semibold text-primary">
                    {money(row?.pInvFooter?.netAmount || 0)}
                </span>
            ),
        },
        {
            key: "pInvStatus",
            title: "Status",
            render: (row: any) => (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
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
        setCheckAccount(false);
        setCheckProduct(false);
        setProductTargetRowIndex(null);
        setProductSearchValue("");
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

    const buildPurchaseInvoiceProductRow = (item: any, vendorCode = "") => {
        const unitCode = item?.unit || item?.uom || "";

        const quantity =
            item?.quantity !== undefined &&
                item?.quantity !== null &&
                item?.quantity !== ""
                ? item.quantity
                : item?.acceptedQuantity !== undefined &&
                    item?.acceptedQuantity !== null &&
                    item?.acceptedQuantity !== ""
                    ? item.acceptedQuantity
                    : "";

        const normalizedRow = normalizeRowKeys({
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

            grnPendingInvoiceQuantity:
                item?.grnPendingInvoiceQuantity !== undefined &&
                    item?.grnPendingInvoiceQuantity !== null
                    ? item.grnPendingInvoiceQuantity
                    : null,

            maxQuantity:
                item?.maxQuantity !== undefined &&
                    item?.maxQuantity !== null &&
                    item?.maxQuantity !== ""
                    ? item.maxQuantity
                    : null,

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
        });

        return calculateRow(
            applyPurchaseInvoiceTaxRule(
                normalizedRow,
                vendorCode
            )
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
                        grnPendingInvoiceQuantity: pendingInvoiceQuantity,
                        maxQuantity: pendingInvoiceQuantity,
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
                buildPurchaseInvoiceProductRow(
                    item,
                    selectedGrn?.grnVendorCode || ""
                )
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
            console.error("Failed to prepare GRN for purchase invoice", error);
            toast.error("Failed to load pending GRN quantity");
        } finally {
            setGrnModalLoading(false);
        }
    };



    const getSavedSelectOptionValue = (field: any, savedValue: any) => {
        const saved = String(savedValue ?? "").trim();
        if (!saved) return "";

        const selectedOption = (field?.options || []).find((option: any) => {
            const raw = option?.raw || {};
            const fullName = [raw?.userFirstName, raw?.userMiddleName, raw?.userLastName].filter(Boolean).join(" ").trim();

            return [option?.value, option?.label, option?.name, raw?.code, raw?.name, raw?.userMobileNumberHash, fullName]
                .filter((value) => value !== undefined && value !== null && value !== "")
                .some((value) => String(value).trim().toLowerCase() === saved.toLowerCase());
        });

        return selectedOption?.value ?? saved;
    };

    const openEditModal = async (record: any) => {
    const footer = record?.pInvFooter || {};

    let pendingProducts: any[] = [];

    if (record?.grnVoucherNumber) {
        try {
            const summaryRes = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookez/analysis/purchaseInvoice/byGrnVoucherNumber/${record.grnVoucherNumber}`
            );

            pendingProducts = summaryRes?.data?.data?.products || summaryRes?.data?.products || [];
        } catch (error) {
            console.log("Failed to load pending GRN quantity while editing Purchase Invoice", error);
        }
    }

    const pendingProductMap = new Map(
        (Array.isArray(pendingProducts) ? pendingProducts : []).map((item: any) => [String(item?.productCode || ""), item])
    );

    const products =
        record?.pInvBody?.length > 0
            ? record.pInvBody.map((item: any) => {
                const pending = pendingProductMap.get(String(item?.productCode || ""));
                const currentQuantity = num(item?.quantity);
                const pendingInvoiceQuantity = num(
                    pending?.pendingInvoiceQuantity ??
                    pending?.balanceQuantity ??
                    (num(pending?.acceptedQuantity) - num(pending?.invoicedQuantity))
                );

                return buildPurchaseInvoiceProductRow(
                    {
                        ...item,
                        quantity: String(currentQuantity),
                        grnPendingInvoiceQuantity: pendingInvoiceQuantity,
                        maxQuantity: record?.grnVoucherNumber ? String(currentQuantity + pendingInvoiceQuantity) : null,
                    },
                    record?.pInvVendorCode || ""
                );
            })
            : [{ ...emptyProductRow, id: Date.now() }];

    const headerFields = templateFields?.header || [];

    const driverField = headerFields.find(
        (field: any) => String(field?.key || "").trim().toLowerCase() === "driver"
    );

    const vehicleMasterField = headerFields.find((field: any) => {
        const key = String(field?.key || "").trim().toLowerCase();
        const label = String(field?.label || "").trim().toLowerCase();

        return key === "vehicle_master" || label === "vehicle master";
    });

    const savedDriver = String(record?.driver || "").trim();

    const savedVehicleMaster =
        record?.customMasters?.["Vehicle Master"] ||
        record?.customMasters?.vehicle_master ||
        null;

    const driverValue = getSavedSelectOptionValue(driverField, savedDriver);

    const vehicleMasterValue = getSavedSelectOptionValue(
        vehicleMasterField,
        savedVehicleMaster?.code || savedVehicleMaster?.name || ""
    );

    // Keep saved Select values visible even when the latest option API does not return them.
    setTemplateFields((prev: any) => ({
        ...prev,
        header: (prev?.header || []).map((field: any) => {
            const key = String(field?.key || "").trim().toLowerCase();
            const label = String(field?.label || "").trim().toLowerCase();

            if (key === "driver" && savedDriver) {
                const hasOption = (field?.options || []).some(
                    (option: any) => String(option?.value || "") === String(driverValue)
                );

                if (!hasOption) {
                    return {
                        ...field,
                        options: [
                            ...(field?.options || []),
                            { label: savedDriver, value: driverValue },
                        ],
                    };
                }
            }

            if ((key === "vehicle_master" || label === "vehicle master") && savedVehicleMaster) {
                const hasOption = (field?.options || []).some(
                    (option: any) => String(option?.value || "") === String(vehicleMasterValue)
                );

                if (!hasOption) {
                    return {
                        ...field,
                        options: [
                            ...(field?.options || []),
                            {
                                label: savedVehicleMaster?.name || savedVehicleMaster?.code || "",
                                value: vehicleMasterValue,
                                raw: savedVehicleMaster,
                            },
                        ],
                    };
                }
            }

            return field;
        }),
    }));

    const dynamicEditValues: any = {
        trip_order: record?.trip_order || "",
        lr_no: record?.lr_no || "",
        driver: driverValue || savedDriver,
    };

    if (savedVehicleMaster) {
        dynamicEditValues[String(vehicleMasterField?.key || "vehicle_master")] =
            vehicleMasterValue || savedVehicleMaster?.code || "";
    }

    setEditingRecord(true);
    setErrors({});

    setForm({
        ...record,
        ...dynamicEditValues,

        customMasters: record?.customMasters || {},

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

    // ★ ADDED: Refresh Purchase Invoice vendor options after Account Master save
    const handleAccountSaved = async (savedResponse: any) => {
        try {
            const accountResponse: any = await dispatch(
                getAllAccounts({
                    offset: 0,
                    limit: 100,
                    search: "",
                }) as any
            ).unwrap();

            setAccountListLoaded(true);

            await dispatch(
                getAllReportMapping({
                    moduleType: "purchaseInvoice",
                }) as any
            );

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

            const refreshedVendors = Array.isArray(refreshedAccounts)
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
                refreshedVendors.find(
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
                refreshedVendors[
                refreshedVendors.length - 1
                ] ||
                null;

            if (createdVendor) {
                setForm((prev: any) => ({
                    ...prev,

                    pInvVendorCode:
                        createdVendor?.accountCode ||
                        prev?.pInvVendorCode ||
                        "",

                    pInvVendorName:
                        createdVendor?.accountName ||
                        prev?.pInvVendorName ||
                        "",
                }));

                setErrors((prev: any) => ({
                    ...prev,
                    pInvVendorCode: "",
                    pInvVendorName: "",
                }));
            }
        } catch (error: any) {
            console.error(
                "Failed to refresh Purchase Invoice vendor options:",
                error
            );

            toast.error(
                error?.message ||
                "Account created, but Purchase Invoice vendor dropdown refresh failed"
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
                    moduleType: "purchaseInvoice",
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

                updatedRow = applyPurchaseInvoiceTaxRule(
                    updatedRow,
                    form?.pInvVendorCode || "",
                    createdProduct
                );

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
            console.error(
                "Failed to refresh Purchase Invoice product options:",
                error
            );

            toast.error(
                error?.message ||
                "Product created, but Purchase Invoice product dropdown refresh failed"
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
    const enableDuplicatePro = useMemo(() => {
        const locationConfig = configurations?.[0]?.systemConfiguration?.allowDuplicateProduct
        return locationConfig === true || locationConfig === "true";
    }, [configurations]);

    const handleRowChange = (index: number, key: string, value: any) => {
        const lowerKey = String(key).toLowerCase();
        const isProductField =
            lowerKey === "productcode" ||
            lowerKey === "productname" ||
            lowerKey === "productid" ||
            lowerKey === "product";

        if (isProductField && !String(form?.pInvVendorCode || "").trim()) {
            toast.error("Please select vendor first");
            setErrors((prev: any) => ({
                ...prev,
                pInvVendorCode: "Please select vendor first",
                [`row_${index}_${key}`]: "",
            }));
            return;
        }

        const duplicate = Boolean(form?.products?.filter((e: any, i: number) => i !== index && e?.productCode == value)?.length);
        if (!enableDuplicatePro && duplicate && (key === "productCode" || key === "productName" || key === "productId")) {
            setErrors((prev: any) => ({ ...prev, products: "", [`row_${index}_${key}`]: "This product already added", [`row_${index}_tax`]: "" }));
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

            updatedRow = normalizeRowKeys(updatedRow);

            if (currentField?.mapFields) {
                updatedRow = applyMappedFields(
                    currentField,
                    value,
                    updatedRow
                );
            }

            const selectedOption = getOptionByValue(currentField, value);

            if (isProductField && selectedOption?.raw) {
                updatedRow = fillProductDetailsFromSelectedOption(
                    updatedRow,
                    selectedOption
                );

                const productRaw = selectedOption?.raw || {};
                updatedRow.productType =
                    productRaw?.productType ||
                    productRaw?.dynamicFields?.productType ||
                    "";
                updatedRow.availableQuantity = null;

                updatedRow = applyPurchaseInvoiceTaxRule(
                    updatedRow,
                    form?.pInvVendorCode || "",
                    productRaw
                );
            }

            updatedRow = normalizeRowKeys(updatedRow);

            if (key === "quantity") {
                const maxQuantity = num(updatedRow.maxQuantity);
                const enteredQuantity = num(value);

                if (
                    updatedRow?.maxQuantity !== null &&
                    updatedRow?.maxQuantity !== undefined &&
                    maxQuantity >= 0 &&
                    enteredQuantity > maxQuantity
                ) {
                    updatedRow.quantity = String(maxQuantity);
                    toast.error(
                        "Invoice quantity cannot be greater than pending GRN quantity"
                    );
                }
            }

            updatedRow = handleTaxFields(updatedRow, key, value);
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

            if (
                form?.grnVoucherNumber &&
                row?.maxQuantity !== null &&
                row?.maxQuantity !== undefined &&
                num(row?.quantity) > num(row?.maxQuantity)
            ) {
                err[`row_${index}_quantity`] =
                    `Invoice quantity cannot exceed pending GRN quantity ${num(row?.maxQuantity)}`;
            }

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
                    // productId: item.productId,

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
            setCheckAccount(false);
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

    // const handleDeleteConfirm = async () => {
    //     try {
    //         const voucherNumber = confirmTooltip?.voucherNumber;
    //         const grnVoucherNumber = confirmTooltip?.grnVoucherNumber;

    //         if (!voucherNumber) {
    //             toast.error("Purchase invoice voucher number not found");
    //             return;
    //         }

    //         await dispatch(
    //             deletePurchaseInvoice({
    //                 purchaseInvoiceNumber: voucherNumber,
    //             }) as any
    //         ).unwrap();

    //         if (grnVoucherNumber) {
    //             await syncGrnStatusAfterPurchaseInvoice(grnVoucherNumber);
    //         } else {
    //             toast.warning("Purchase invoice deleted , but grn voucher number not found")
    //         }

    //         toast.success("Purchase invoice deleted successfully");

    //         await fetchPurchaseInvoices();
    //     } catch (err: any) {
    //         toast.error(
    //             err?.message ||
    //             err?.payload?.message ||
    //             "Failed to delete purchase invoice"
    //         );
    //     } finally {
    //         setConfirmTooltip({
    //             show: false,
    //             x: null,
    //             y: null,
    //             voucherNumber: null,
    //             grnVoucherNumber: null,
    //         });
    //     }
    // };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;
            const grnVoucherNumber = confirmTooltip?.grnVoucherNumber;
            const record = confirmTooltip?.record;

            if (!voucherNumber) {
                toast.error("Purchase invoice voucher number not found");
                return;
            }

            if (record && isPurchaseInvoicePaymentAdjusted(record)) {
                toast.error("This invoice has payment entry, so it cannot be deleted");
                return;
            }

            await dispatch(
                deletePurchaseInvoice({
                    purchaseInvoiceNumber: voucherNumber,
                }) as any
            ).unwrap();

            if (grnVoucherNumber) {
                await syncGrnStatusAfterPurchaseInvoice(grnVoucherNumber);
            } else {
                toast.warning("Purchase invoice deleted, but GRN voucher number not found");
            }

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
                grnVoucherNumber: null,
                record: null,
            });
        }
    };
    /* ===================================================
       DYNAMIC FOOTER
    =================================================== */

    const footerValues = useMemo(() => {
        return { grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount, adjustedAmount: 0, balanceAmount: netAmount };
    }, [grossAmount, discountAmount, cgstAmount, sgstAmount, igstAmount, netAmount]);

    const dynamicFooterArray = useMemo(() => {
        return (templateFields?.footer || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => {
                const rawValue = footerValues[field.key as keyof typeof footerValues] ?? 0;
                return { ...field, value: money(rawValue), rawValue };
            });
    }, [templateFields?.footer, footerValues]);
    const showInitialSkeleton = !refreshing && purchaseInvoices.length === 0 && (loading || fieldsLoading);
    const showGrnSkeleton = grnModalLoading || grnLoading || !grnLoaded;

    const isPurchaseInvoicePaymentAdjusted = (record: any) => {
        const footer = record?.pInvFooter || {};

        const netAmount = num(footer?.netAmount || 0);
        const balanceAmount = num(footer?.balanceAmount || 0);
        const adjustedAmount = num(footer?.adjustedAmount || 0);

        return adjustedAmount > 0 || (netAmount > 0 && balanceAmount < netAmount);
    };


    const isClosedPurchaseInvoice = (record: any) => {
        const pInvStatus = String(record?.pInvStatus || "").toLowerCase();
        return pInvStatus === "close" || pInvStatus === "closed"
    }

    const handleEditPurInvoice = (record: any) => {
        if (isClosedPurchaseInvoice(record)) {
            toast.error("you can't edit closed purchase invoice");
            return;
        }
        openEditModal(record);
    }

    // const handleDeletePurInvoiceClick = (e: any, record: any) => {
    //     if (isClosedPurchaseInvoice(record)) {
    //         toast.error("You can't delete closed Invoice")
    //         return;
    //     }
    //     const rect = e.currentTarget.getBoundingClientRect();
    //     let x = rect.left - 150;
    //     if (x < 10) x = 10;
    //     const y = rect.top + window.scrollY - 5;
    //     setConfirmTooltip({
    //         show: true,
    //         x,
    //         y,
    //         voucherNumber: record?.pInvVoucherNumber,
    //         grnVoucherNumber: record?.grnVoucherNumber
    //     });
    // }

    const handleDeletePurInvoiceClick = (e: any, record: any) => {
        if (isClosedPurchaseInvoice(record)) {
            toast.error("You can't delete closed invoice");
            return;
        }

        if (isPurchaseInvoicePaymentAdjusted(record)) {
            toast.error("This invoice has payment entry, so it cannot be deleted");
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
            voucherNumber: record?.pInvVoucherNumber,
            grnVoucherNumber: record?.grnVoucherNumber,
            record,
        });
    };

    useEffect(() => {
        /* @ts-ignore  */
        dispatch(getAllReportMapping({ moduleType: "purchaseInvoice" }));

        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );

        if (!Object.keys(company ?? {})?.length) {
            dispatch(getCompany({ withParent: true, limit: 100 }) as any);
        }
    }, []);

    // ★ ADDED: Initial Account Master loading
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

    // ★ ADDED: Open Account Master when Purchase Invoice opens
    // and no vendor account exists.
    useEffect(() => {
        if (!showModal) return;
        if (editingRecord) return;
        if (!accountListLoaded) return;

        if (vendorAccounts.length === 0) {
            setCheckAccount(true);
        }
    }, [
        showModal,
        editingRecord,
        accountListLoaded,
        vendorAccounts.length,
    ]);

    if (showInitialSkeleton) {
        return <ModulePageSkeleton rows={8} columns={7} />;
    }

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div
                id="purchase-invoice-header"
                className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
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

                    <Permission module="bookez" permissionKey="purchaseInvoice" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openAddModal,
                                text: "Add Purchase Invoice",
                            }}
                        />
                    </Permission>
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
                            id="sales-quotation-edit-button"
                            onClick={() => {
                                setDownlaodPDF((pre: any) => ({
                                    ...pre,
                                    show: true,
                                    moduleType: "purchaseInvoice",
                                    record,
                                    CustomerCode: record?.pInvVendorCode,
                                    voucherNumber: record?.pInvVoucherNumber,
                                }));
                            }}
                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        >
                            <Download size={16} />
                        </button>
                        <Permission module="bookez" permissionKey="purchaseInvoice" action="update">
                            <button
                                id="purchase-invoice-edit-button"
                                onClick={() => handleEditPurInvoice(record)}
                                className={`cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary${isClosedPurchaseInvoice(record)}`}
                            >
                                <Edit size={16} />
                            </button>
                        </Permission>

                        <Permission module="bookez" permissionKey="purchaseInvoice" action="delete">
                            <button
                                id="purchase-invoice-delete-button"
                                disabled={deleteLoading}
                                onClick={(e) => handleDeletePurInvoiceClick(e, record)}
                                className={`cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50 ${isClosedPurchaseInvoice(record)}`}
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
                            grnVoucherNumber: null,
                            record: null,
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
                headerClassName="bg-card"
                footerClassName="bg-card"
                bodyClassName="!block !p-0 bg-card text-card-foreground"
                body={
                    <div className="flex h-[520px] flex-col bg-card text-card-foreground">
                        <div className="border-b border-border p-5">
                            <input
                                value={grnSearch}
                                onChange={(e) =>
                                    setGrnSearch(e.target.value)
                                }
                                placeholder="Search GRN code..."
                                className="
                                    w-full rounded-xl border border-border bg-input
                                    px-4 py-3 text-sm font-medium text-foreground
                                    outline-none transition
                                    placeholder:text-muted-foreground
                                    focus:border-primary focus:bg-input focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {showGrnSkeleton ? (
                                <ModalListSkeleton rows={3} />
                            ) : grns.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
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
                                                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/10"
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-base font-bold text-card-foreground">
                                                            {grnNumber} - {vendorName}
                                                        </p>

                                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                            Items: {grnBody?.length || 0}
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
                    {...{
                        show: showModal,
                        setShow: setShowModal,
                        edit: Boolean(editingRecord),
                        title: "Purchase Invoice",
                        subtitle: "Fill in the purchase invoice details below",
                        loading: createLoading || updateLoading,
                        onClose: () => {
                            setShowModal(false);
                            setCheckAccount(false);
                            setCheckProduct(false);
                            setProductTargetRowIndex(null);
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
                        inputData: {
                            ...templateFieldsWithCreateActions,
                            footer: dynamicFooterArray,
                        },
                        bodyKey: "products",
                        handleChange: handleMainChange,

                        bodyCellExtraRenderer: (column: any, row: any) =>
                            renderPurchaseInvoiceCellExtra(
                                column,
                                row,
                                enableServiceProductInventory
                            ),

                        // ★ ADDED: Common Account Master modal props
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
                        setProductTargetRowIndex(null);
                        setProductSearchValue("");
                    }
                }}
                onSaved={handleProductSaved}
                title="Add New Product"
                initialProductName={productSearchValue}
            />

            {/* @ts-ignore  */}
            <ListingModel
                {...{
                    show: downlaodPDF?.show,
                    downlaodPDF,
                    entryType: "purchaseInvoice",
                    setShow: () => setDownlaodPDF(() => ({ show: !downlaodPDF?.show, })),
                    rowData: downlaodPDF?.record,
                    report,
                    title: "Download Purchase Invoice PDF",
                    cancelText: "Cancel",
                    confirmText: "Confirm",
                }}
            />
        </div>
    );
};

export default PurchaseInvoice;