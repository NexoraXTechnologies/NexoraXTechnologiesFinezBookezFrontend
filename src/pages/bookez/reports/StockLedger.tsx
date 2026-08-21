import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import DataTable from "../../../components/DataTable";
import ReportFilterCard from "./components/ReportFilterCard";
import AccountSummaryCard from "./components/AccountSummaryCard";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";
import {
    createStockLedger,
    clearStockLedgerData,
} from "../../../redux/slices/professionalSlice/ledgerReports/stockLedgerSlice";

import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberSalesInvoice } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import { getByVoucherNumberSalesInvoiceReturn } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceReturn";
import {
    formatDateWithCurrentTime,
    formatProductType,
    getFirstDateOfCurrentMonth,
    loadAllTemplateOptions,
    todayYMD,
} from "../../../utils/helperFunctions";
import { getByVoucherNumberPurchaseInvoiceList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";
import { getByVoucherNumberPurchaseReturnList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseReturnSlice";
import { getByVoucharNumberGrnList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/grnSlice";
import { getOpeningStockList } from "../../../redux/slices/professionalSlice/openingBalancesStocks/openingStockSlice";
import {
    getCustomMasterListing,
    getCustomMasterModules,
} from "../../../redux/slices/professionalSlice/customMasterModuleSlice";
import { toast } from "react-toastify";

type StockLedgerProps = {
    show?: boolean;
};


const openingStockViewInputData = {
    header: [
        {
            key: "openingStockVoucherNumber",
            label: "Voucher No",
            type: "text",
            disabled: true,
        },
        {
            key: "openingStockDate",
            label: "Date",
            type: "date",
            disabled: true,
        },
        {
            key: "remark",
            label: "Remark",
            type: "textarea",
            required: false,
            disabled: true,
            placeholder: "Remark",
            colSpan: "full",
        },
    ],

    body: [
        {
            key: "productCode",
            title: "Product",
            type: "text",
            width: "240px",
            disabled: true,
        },
        {
            key: "description",
            title: "Description",
            type: "text",
            width: "220px",
            disabled: true,
        },
        {
            key: "remarks",
            title: "Remarks",
            type: "text",
            width: "180px",
            disabled: true,
        },
        {
            key: "quantity",
            title: "Qty",
            type: "number",
            width: "120px",
            disabled: true,
            align: "right",
        },
        {
            key: "unit",
            title: "Unit",
            type: "text",
            width: "150px",
            disabled: true,
        },
        {
            key: "rate",
            title: "Rate",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
        {
            key: "grossAmount",
            title: "Gross",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
        {
            key: "discountPercentage",
            title: "Disc %",
            type: "number",
            width: "110px",
            disabled: true,
            align: "right",
        },
        {
            key: "discountAmount",
            title: "Disc Amt",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
        {
            key: "cgstPercentage",
            title: "CGST %",
            type: "number",
            width: "110px",
            disabled: true,
            align: "right",
        },
        {
            key: "cgstAmount",
            title: "CGST Amt",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
        {
            key: "sgstPercentage",
            title: "SGST %",
            type: "number",
            width: "110px",
            disabled: true,
            align: "right",
        },
        {
            key: "sgstAmount",
            title: "SGST Amt",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
        {
            key: "igstPercentage",
            title: "IGST %",
            type: "number",
            width: "110px",
            disabled: true,
            align: "right",
        },
        {
            key: "igstAmount",
            title: "IGST Amt",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
        {
            key: "otherAmount",
            title: "Other",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
        {
            key: "taxAmount",
            title: "Tax",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
        {
            key: "netTotal",
            title: "Net",
            type: "number",
            width: "130px",
            disabled: true,
            align: "right",
        },
    ],

    footer: [
        {
            key: "totalQuantity",
            label: "Total Quantity",
            value: "0",
            rawValue: "0",
        },
        {
            key: "totalGrossAmount",
            label: "Gross Amount",
            value: "0.00",
            rawValue: "0.00",
        },
        {
            key: "totalTaxAmount",
            label: "Tax Amount",
            value: "0.00",
            rawValue: "0.00",
        },
        {
            key: "totalNetAmount",
            label: "Net Amount",
            value: "0.00",
            rawValue: "0.00",
        },
    ],
};


const mainColumns = [
    {
        key: "voucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.voucherNumber || row?.voucherNo || "-"}
            </span>
        ),
    },
    {
        key: "voucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate = row?.voucherDate || row?.date || row?.createdOn;

            const date = rawDate
                ? new Date(rawDate).toLocaleDateString("en-IN")
                : "-";

            return (
                <span className="font-medium text-muted-foreground">
                    {date}
                </span>
            );
        },
    },
    {
        key: "party",
        title: "Party",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.party || row?.party || "-"}
            </span>
        ),
    },
    {
        key: "inwardQty",
        title: "Inward Qty",
        render: (row: any) => (
            <span className="font-semibold text-success">
                {Number(row?.inwardQty || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "outwardQty",
        title: "Outward Qty",
        render: (row: any) => (
            <span className="font-semibold text-danger">
                {Number(row?.outwardQty || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) => {
            const inwardQty = Number(
                row?.inwardQty ||
                row?.inQty ||
                row?.purchaseQty ||
                row?.receivedQty ||
                0
            );

            const outwardQty = Number(
                row?.outwardQty ||
                row?.outQty ||
                row?.salesQty ||
                row?.issuedQty ||
                0
            );

            if (inwardQty > 0) {
                return (
                    <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                        Inward
                    </span>
                );
            }

            if (outwardQty > 0) {
                return (
                    <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
                        Outward
                    </span>
                );
            }

            return (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                    -
                </span>
            );
        },
    },
];

const getLedgerDetails = (data: any) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.details)) return data.details;
    if (Array.isArray(data?.transactions)) return data.transactions;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const INVENTORY_MASTER_NAMES = {
    warehouse: "Warehouse",
    location: "Location",
    bin: "Bin",
    batch: "Batch",
} as const;

type InventoryFilterKey = keyof typeof INVENTORY_MASTER_NAMES;

type InventoryFilterOption = {
    label: string;
    value: string;
    raw?: any;
};

const getArrayRecords = (response: any): any[] => {
    const roots = [
        response,
        response?.data,
        response?.data?.data,
        response?.result,
        response?.payload,
    ];

    for (const root of roots) {
        if (Array.isArray(root)) return root;
        if (Array.isArray(root?.records)) return root.records;
        if (Array.isArray(root?.items)) return root.items;
        if (Array.isArray(root?.docs)) return root.docs;
        if (Array.isArray(root?.modules)) return root.modules;
    }

    return [];
};

const normalizeInventoryMasterName = (value: any) =>
    String(value || "").trim().toLowerCase();

const getInventoryRecordValue = (record: any, keys: string[]) => {
    const nested =
        record?.data && typeof record.data === "object"
            ? record.data
            : record?.dynamicFields && typeof record.dynamicFields === "object"
                ? record.dynamicFields
                : record?.customFields && typeof record.customFields === "object"
                    ? record.customFields
                    : {};

    const source = { ...record, ...nested };

    for (const key of keys) {
        const value = source?.[key];

        if (value !== undefined && value !== null && String(value).trim() !== "") {
            return String(value).trim();
        }
    }

    return "";
};

const buildInventoryMasterOptions = (records: any[], key: InventoryFilterKey): InventoryFilterOption[] => {
    const valueKeys: Record<InventoryFilterKey, string[]> = {
        warehouse: ["warehouseCode", "code", "warehouse", "warehouseName"],
        location: ["locationCode", "code", "location", "locationName"],
        bin: ["binCode", "code", "bin", "binName"],
        batch: ["batchNumber", "batchCode", "code", "batch", "batchName"],
    };

    const labelKeys: Record<InventoryFilterKey, string[]> = {
        warehouse: ["name", "warehouseName", "warehouse", "warehouseCode", "code"],
        location: ["name", "locationName", "location", "locationCode", "code"],
        bin: ["name", "binName", "bin", "binCode", "code"],
        batch: ["name", "batchName", "batch", "batchNumber", "batchCode", "code"],
    };

    const seen = new Set<string>();

    return (records || []).reduce((options: InventoryFilterOption[], record: any) => {
        const value = getInventoryRecordValue(record, valueKeys[key]);
        if (!value || seen.has(value)) return options;

        const label = getInventoryRecordValue(record, labelKeys[key]) || value;
        seen.add(value);
        options.push({ label, value, raw: record });
        return options;
    }, []);
};

const StockLedger = ({ show = true }: StockLedgerProps) => {
    const dispatch = useDispatch<any>();

    const { stockLedgerData = null, listingLoader = false } = useSelector(
        (s: any) => s.stockLedger
    );

    const { products = [], loading: productLoading = false } = useSelector(
        (s: any) => s.productMaster
    );

    const [inventoryModules, setInventoryModules] = useState<Partial<Record<InventoryFilterKey, any>>>({});

    const showWarehouse = Boolean(inventoryModules.warehouse);
    const showLocation = Boolean(inventoryModules.location);
    const showBin = Boolean(inventoryModules.bin);
    const showBatch = Boolean(inventoryModules.batch);

    const [fromDate, setFromDate] = useState<string>(
        getFirstDateOfCurrentMonth()
    );
    const [toDate, setToDate] = useState<string>(todayYMD());
    const [productCode, setProductCode] = useState<string>("");
    const [warehouseCode, setWarehouseCode] = useState<string>("");
    const [locationCode, setLocationCode] = useState<string>("");
    const [binCode, setBinCode] = useState<string>("");
    const [batchNumber, setBatchNumber] = useState<string>("");
    const [inventoryFiltersLoading, setInventoryFiltersLoading] = useState(false);
    const [inventoryFilterOptions, setInventoryFilterOptions] = useState<Record<InventoryFilterKey, InventoryFilterOption[]>>({
        warehouse: [],
        location: [],
        bin: [],
        batch: [],
    });

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewTitle, setViewTitle] = useState("");
    const [viewForm, setViewForm] = useState<any>({});
    const [viewErrors, setViewErrors] = useState<any>({});

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const [viewTemplateFields, setViewTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    const [viewBodyKey, setViewBodyKey] = useState("products");


    const getVoucherRecordFromResponse = (
        res: any,
        voucherNumber: string,
        voucherKeys: string[]
    ) => {
        const normalizedVoucher = normalizeVoucherNo(voucherNumber);

        const isSameVoucher = (item: any) => {
            if (!item || typeof item !== "object") return false;

            return voucherKeys.some((key) => {
                return normalizeVoucherNo(item?.[key]) === normalizedVoucher;
            });
        };

        if (isSameVoucher(res?.invoice)) return res.invoice;
        if (isSameVoucher(res?.data?.invoice)) return res.data.invoice;

        if (isSameVoucher(res?.openingStock)) return res.openingStock;
        if (isSameVoucher(res?.data?.openingStock)) return res.data.openingStock;

        if (isSameVoucher(res?.voucher)) return res.voucher;
        if (isSameVoucher(res?.data?.voucher)) return res.data.voucher;

        if (isSameVoucher(res?.grn)) return res.grn;
        if (isSameVoucher(res?.data?.grn)) return res.data.grn;

        if (isSameVoucher(res)) return res;
        if (isSameVoucher(res?.data)) return res.data;

        const records = Array.isArray(res)
            ? res
            : Array.isArray(res?.items)
                ? res.items
                : Array.isArray(res?.records)
                    ? res.records
                    : Array.isArray(res?.openingStock)
                        ? res.openingStock
                        : Array.isArray(res?.docs)
                            ? res.docs
                            : Array.isArray(res?.data)
                                ? res.data
                                : Array.isArray(res?.data?.items)
                                    ? res.data.items
                                    : Array.isArray(res?.data?.records)
                                        ? res.data.records
                                        : Array.isArray(res?.data?.openingStock)
                                            ? res.data.openingStock
                                            : Array.isArray(res?.data?.docs)
                                                ? res.data.docs
                                                : [];

        // ✅ Important: only return exact matched voucher
        return records.find(isSameVoucher) || null;
    };


    const normalizeInvoiceForView = (record: any) => {
        const footer = record?.sInvFooter || {};

        const products = (record?.sInvBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription: item?.productDescription || item?.description || "",
            description: item?.description || item?.productDescription || "",
            productHSNCode: item?.productHSNCode || "",

            quantity: item?.quantity || "",
            uom: item?.uom || item?.unit || "",
            unit: item?.unit || item?.uom || "",

            rate: item?.rate || "",
            gross: item?.gross || item?.grossAmount || "",
            grossAmount: item?.grossAmount || item?.gross || "",

            discount: item?.discount || item?.discountPercentage || "",
            discountAmount: item?.discountAmount || "",

            cgst: item?.cgst || item?.cgstPercentage || "",
            cgstAmount: item?.cgstAmount || "",

            sgst: item?.sgst || item?.sgstPercentage || "",
            sgstAmount: item?.sgstAmount || "",

            igst: item?.igst || item?.igstPercentage || "",
            igstAmount: item?.igstAmount || "",

            netAmount: item?.netAmount || item?.netTotal || "",
            netTotal: item?.netTotal || item?.netAmount || "",
        }));

        return {
            ...record,

            sInvVoucherNumber:
                record?.sInvVoucherNumber || record?.voucherNumber || "",
            sInvVoucherDate: record?.sInvVoucherDate || record?.voucherDate || "",
            sInvCustomerName: record?.sInvCustomerName || record?.customerName || "",
            sInvCustomerCode: record?.sInvCustomerCode || record?.customerCode || "",
            sInvRemark: record?.sInvRemark || record?.sInvRemarks || "",
            sInvStatus: record?.sInvStatus || record?.sInvDocStatus || "open",
            sInvSalesAccount: record?.sInvSalesAccount || "",

            products,

            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount:
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount:
                footer?.balanceAmount ||
                footer?.netAmount ||
                footer?.totalNetAmount ||
                "0.00",
        };
    };

    const normalizeSalesReturnForView = (record: any) => {
        const footer = record?.sInvReturnFooter || {};

        const products = (record?.sInvReturnBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription: item?.productDescription || item?.description || "",
            description: item?.description || item?.productDescription || "",
            productHSNCode: item?.productHSNCode || "",

            quantity: item?.quantity || "",
            uom: item?.uom || item?.unit || "",
            unit: item?.unit || item?.uom || "",

            rate: item?.rate || "",
            gross: item?.gross || item?.grossAmount || "",
            grossAmount: item?.grossAmount || item?.gross || "",

            discount: item?.discount || item?.discountPercentage || "",
            discountAmount: item?.discountAmount || "",

            cgst: item?.cgst || item?.cgstPercentage || "",
            cgstAmount: item?.cgstAmount || "",

            sgst: item?.sgst || item?.sgstPercentage || "",
            sgstAmount: item?.sgstAmount || "",

            igst: item?.igst || item?.igstPercentage || "",
            igstAmount: item?.igstAmount || "",

            netAmount: item?.netAmount || item?.netTotal || "",
            netTotal: item?.netTotal || item?.netAmount || "",
        }));

        return {
            ...record,

            sInvReturnVoucherNumber:
                record?.sInvReturnVoucherNumber || record?.voucherNumber || "",
            sInvReturnVoucherDate:
                record?.sInvReturnVoucherDate || record?.voucherDate || "",
            sInvVoucherNumber: record?.sInvVoucherNumber || "",
            sInvReturnCustomerName:
                record?.sInvReturnCustomerName || record?.customerName || "",
            sInvReturnCustomerCode:
                record?.sInvReturnCustomerCode || record?.sInvCustomerCode || "",
            sInvReturnRemark:
                record?.sInvReturnRemark || record?.sInvRemark || record?.remark || "",
            sInvReturnStatus:
                record?.sInvReturnStatus || record?.sInvStatus || "open",

            products,

            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount:
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount:
                footer?.balanceAmount ||
                footer?.netAmount ||
                footer?.totalNetAmount ||
                "0.00",
        };
    };

    const normalizePurchaseInvoiceForView = (record: any) => {
        const footer = record?.pInvFooter || {};

        const products = (record?.pInvBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription: item?.productDescription || item?.description || "",
            description: item?.description || item?.productDescription || "",
            productHSNCode: item?.productHSNCode || "",

            quantity: item?.quantity || "",
            uom: item?.uom || item?.unit || "",
            unit: item?.unit || item?.uom || "",

            rate: item?.rate || "",
            gross: item?.gross || item?.grossAmount || "",
            grossAmount: item?.grossAmount || item?.gross || "",

            discount: item?.discount || item?.discountPercentage || "",
            discountAmount: item?.discountAmount || "",

            cgst: item?.cgst || item?.cgstPercentage || "",
            cgstAmount: item?.cgstAmount || "",

            sgst: item?.sgst || item?.sgstPercentage || "",
            sgstAmount: item?.sgstAmount || "",

            igst: item?.igst || item?.igstPercentage || "",
            igstAmount: item?.igstAmount || "",

            netAmount: item?.netAmount || item?.netTotal || "",
            netTotal: item?.netTotal || item?.netAmount || "",
        }));

        return {
            ...record,

            pInvVoucherNumber:
                record?.pInvVoucherNumber || record?.voucherNumber || "",

            pInvVoucherDate: record?.pInvVoucherDate || record?.voucherDate || "",

            pInvVendorCode:
                record?.pInvVendorCode ||
                record?.vendorCode ||
                record?.accountCode ||
                "",

            pInvVendorName:
                record?.pInvVendorName ||
                record?.vendorName ||
                record?.accountName ||
                "",

            pInvStatus: record?.pInvStatus || "open",

            pInvRemark: record?.pInvRemark || record?.remark || "",

            products,

            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount:
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount:
                footer?.balanceAmount ||
                footer?.netAmount ||
                footer?.totalNetAmount ||
                "0.00",
        };
    };

    const normalizePurchaseReturnForView = (record: any) => {
        const footer = record?.pRetFooter || {};

        const products = (record?.pRetBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productId: item?.productId || "",

            productDescription: item?.productDescription || item?.description || "",
            description: item?.description || item?.productDescription || "",
            productHSNCode: item?.productHSNCode || "",

            quantity: item?.quantity || "",
            uom: item?.uom || item?.unit || "",
            unit: item?.unit || item?.uom || "",

            rate: item?.rate || "",

            gross: item?.gross || item?.grossAmount || "",
            grossAmount: item?.grossAmount || item?.gross || "",

            discount: item?.discount || item?.discountPercentage || "",
            discountAmount: item?.discountAmount || "",

            taxableAmount: item?.taxableAmount || "",

            cgst: item?.cgst || item?.cgstPercentage || "",
            cgstAmount: item?.cgstAmount || "",

            sgst: item?.sgst || item?.sgstPercentage || "",
            sgstAmount: item?.sgstAmount || "",

            igst: item?.igst || item?.igstPercentage || "",
            igstAmount: item?.igstAmount || "",

            taxAmount: item?.taxAmount || "",
            otherAmount: item?.otherAmount || "",

            netAmount: item?.netAmount || item?.netTotal || "",
            netTotal: item?.netTotal || item?.netAmount || "",
        }));

        return {
            ...record,

            pRetVoucherNumber:
                record?.pRetVoucherNumber || record?.voucherNumber || "",

            pRetVoucherDate: record?.pRetVoucherDate || record?.voucherDate || "",

            grnVoucherNumber: record?.grnVoucherNumber || "",

            pOrdVoucherNumber: record?.pOrdVoucherNumber || "",

            pRetVendorCode:
                record?.pRetVendorCode ||
                record?.vendorCode ||
                record?.accountCode ||
                "",

            pRetVendorName:
                record?.pRetVendorName ||
                record?.vendorName ||
                record?.accountName ||
                "",

            pRetPurAccount: record?.pRetPurAccount || "",

            pRetStatus: record?.pRetStatus || "open",

            pRetRemark: record?.pRetRemark || record?.remark || "",

            products,

            pRetBody: products,

            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",

            discountAmount:
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",

            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",

            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",

            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",

            taxAmount: footer?.taxAmount || footer?.totalTaxAmount || "0.00",

            otherAmount: footer?.otherAmount || footer?.totalOtherAmount || "0.00",

            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",

            adjustedAmount: footer?.adjustedAmount || "0.00",

            balanceAmount:
                footer?.balanceAmount ||
                footer?.netAmount ||
                footer?.totalNetAmount ||
                "0.00",

            totalQuantity: footer?.totalQuantity || "0",
        };
    };

    const normalizeGrnForView = (record: any) => {
        const footer = record?.grnFooter || {};

        const products = (
            record?.grnBody ||
            record?.products ||
            record?.body ||
            []
        ).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productId: item?.productId || "",

            productDescription: item?.productDescription || item?.description || "",
            description: item?.description || item?.productDescription || "",
            productHSNCode: item?.productHSNCode || "",

            quantity:
                item?.quantity ||
                Number(item?.acceptedQuantity || 0) +
                Number(item?.rejectedQuantity || 0) ||
                "",

            acceptedQuantity: item?.acceptedQuantity || "0",
            rejectedQuantity: item?.rejectedQuantity || "0",
            rejectedReason: item?.rejectedReason || "",

            uom: item?.uom || item?.unit || "",
            unit: item?.unit || item?.uom || "",

            rate: item?.rate || "",

            gross: item?.gross || item?.grossAmount || "",
            grossAmount: item?.grossAmount || item?.gross || "",

            discount: item?.discount || item?.discountPercentage || "",
            discountAmount: item?.discountAmount || "",

            taxableAmount: item?.taxableAmount || "",

            cgst: item?.cgst || item?.cgstPercentage || "",
            cgstAmount: item?.cgstAmount || "",

            sgst: item?.sgst || item?.sgstPercentage || "",
            sgstAmount: item?.sgstAmount || "",

            igst: item?.igst || item?.igstPercentage || "",
            igstAmount: item?.igstAmount || "",

            taxAmount: item?.taxAmount || "",
            otherAmount: item?.otherAmount || "",

            netAmount: item?.netAmount || item?.netTotal || "",
            netTotal: item?.netTotal || item?.netAmount || "",
        }));

        return {
            ...record,

            grnVoucherNumber:
                record?.grnVoucherNumber ||
                record?.voucherNumber ||
                record?.voucherNo ||
                "",

            grnVoucherDate:
                record?.grnVoucherDate || record?.voucherDate || record?.date || "",

            pOrdVoucherNumber:
                record?.pOrdVoucherNumber || record?.purchaseOrderVoucherNumber || "",

            grnVendorCode:
                record?.grnVendorCode ||
                record?.vendorCode ||
                record?.accountCode ||
                "",

            grnVendorName:
                record?.grnVendorName ||
                record?.vendorName ||
                record?.accountName ||
                record?.party ||
                "",

            grnStatus: record?.grnStatus || record?.status || "open",

            grnRemark: record?.grnRemark || record?.remark || "",

            products,

            grnBody: products,

            grossAmount:
                footer?.grossAmount || footer?.totalGrossAmount || record?.grossAmount || "0.00",

            discountAmount:
                footer?.discountAmount ||
                footer?.totalDiscountAmount ||
                record?.discountAmount ||
                "0.00",

            cgstAmount:
                footer?.cgstAmount || footer?.totalCgstAmount || record?.cgstAmount || "0.00",

            sgstAmount:
                footer?.sgstAmount || footer?.totalSgstAmount || record?.sgstAmount || "0.00",

            igstAmount:
                footer?.igstAmount || footer?.totalIgstAmount || record?.igstAmount || "0.00",

            taxAmount:
                footer?.taxAmount || footer?.totalTaxAmount || record?.taxAmount || "0.00",

            otherAmount:
                footer?.otherAmount || footer?.totalOtherAmount || record?.otherAmount || "0.00",

            netAmount:
                footer?.netAmount || footer?.totalNetAmount || record?.netAmount || "0.00",

            adjustedAmount:
                footer?.adjustedAmount || record?.adjustedAmount || "0.00",

            balanceAmount:
                footer?.balanceAmount ||
                footer?.netAmount ||
                footer?.totalNetAmount ||
                record?.balanceAmount ||
                "0.00",

            totalQuantity:
                footer?.totalQuantity ||
                record?.totalQuantity ||
                products.reduce(
                    (sum: number, item: any) => sum + Number(item?.quantity || 0),
                    0
                ),
        };
    };

    const normalizeOpeningStockForView = (record: any) => {
        const footer = record?.openingStockFooter || {};

        const products = (
            record?.openingStockBody ||
            record?.products ||
            record?.body ||
            []
        ).map((item: any) => ({
            ...item,

            productCode: item?.productCode || item?.product || "",
            productName: item?.productName || "",
            productId: item?.productId || "",

            description:
                item?.description ||
                item?.productDescription ||
                item?.productDescription ||
                "",

            remarks: item?.remarks || item?.remark || "",

            quantity: item?.quantity || "",
            unit: item?.unit || item?.uom || "",
            unitName: item?.unitName || item?.unit || item?.uom || "",

            rate: item?.rate || "",

            grossAmount: item?.grossAmount || item?.gross || "",

            discountPercentage:
                item?.discountPercentage ||
                item?.discount ||
                "",

            discountAmount: item?.discountAmount || "",

            taxableAmount: item?.taxableAmount || "",

            cgstPercentage:
                item?.cgstPercentage ||
                item?.cgst ||
                "",

            cgstAmount: item?.cgstAmount || "",

            sgstPercentage:
                item?.sgstPercentage ||
                item?.sgst ||
                "",

            sgstAmount: item?.sgstAmount || "",

            igstPercentage:
                item?.igstPercentage ||
                item?.igst ||
                "",

            igstAmount: item?.igstAmount || "",

            taxAmount: item?.taxAmount || "",
            otherAmount: item?.otherAmount || "",

            netAmount: item?.netAmount || item?.netTotal || "",
            netTotal: item?.netTotal || item?.netAmount || "",
        }));

        return {
            ...record,

            openingStockVoucherNumber:
                record?.openingStockVoucherNumber ||
                record?.voucherNumber ||
                record?.voucherNo ||
                "",

            openingStockDate:
                record?.openingStockDate ||
                record?.voucherDate ||
                record?.date ||
                "",

            openingStockStatus:
                record?.openingStockStatus ||
                record?.status ||
                "open",

            openingStockRemark:
                record?.openingStockRemark ||
                record?.remark ||
                "",

            remark:
                record?.remark ||
                record?.openingStockRemark ||
                "",

            openingStockBody: products,
            products,

            totalQuantity:
                footer?.totalQuantity ||
                record?.totalQuantity ||
                products.reduce(
                    (sum: number, item: any) => sum + Number(item?.quantity || 0),
                    0
                ),

            grossAmount:
                footer?.grossAmount ||
                footer?.totalGrossAmount ||
                "0.00",

            discountAmount:
                footer?.discountAmount ||
                footer?.totalDiscountAmount ||
                "0.00",

            cgstAmount:
                footer?.cgstAmount ||
                footer?.totalCgstAmount ||
                footer?.totalCGSTAmount ||
                "0.00",

            sgstAmount:
                footer?.sgstAmount ||
                footer?.totalSgstAmount ||
                footer?.totalSGSTAmount ||
                "0.00",

            igstAmount:
                footer?.igstAmount ||
                footer?.totalIgstAmount ||
                footer?.totalIGSTAmount ||
                "0.00",

            taxAmount:
                footer?.taxAmount ||
                footer?.totalTaxAmount ||
                "0.00",

            otherAmount:
                footer?.otherAmount ||
                footer?.totalOtherAmount ||
                "0.00",

            netAmount:
                footer?.netAmount ||
                footer?.totalNetAmount ||
                "0.00",

            totalGrossAmount: footer?.totalGrossAmount || "0.00",
            totalTaxAmount: footer?.totalTaxAmount || "0.00",
            totalNetAmount: footer?.totalNetAmount || "0.00",
        };
    };

    const normalizeVoucherNo = (value: any) => {
        return String(value || "").trim().toUpperCase();
    };

    const resolveStockVoucherKind = (voucherNumber: any) => {
        const vn = normalizeVoucherNo(voucherNumber);

        if (vn.startsWith("SINVRET-")) return "SALES_RETURN";
        if (vn.startsWith("OPSTOCK-")) return "OPENING_STOCK";
        if (vn.startsWith("GRN-")) return "GRN";
        if (vn.startsWith("PRET-")) return "PURCHASE_RETURN";
        if (vn.startsWith("PINV-")) return "PURCHASE_INVOICE";
        if (vn.startsWith("SINV-")) return "SALES_INVOICE";

        return "";
    };

    const getStockVoucherNumber = (row: any) => {
        return (
            row?.voucherNumber ||
            row?.voucherNo ||
            row?.sInvVoucherNumber ||
            row?.sInvReturnVoucherNumber ||
            row?.pInvVoucherNumber ||
            row?.pRetVoucherNumber ||
            row?.grnVoucherNumber ||
            row?.openingStockVoucherNumber ||
            ""
        );
    };

    const stockViewConfig: any = {
        OPENING_STOCK: {
            title: "View Opening Stock",
            notFoundMessage: "Opening stock not found",
            manualSchema: true,
            inputData: openingStockViewInputData,
            bodyKey: "openingStockBody",
            action: getOpeningStockList,
            params: (voucherNumber: string) => ({
                offset: 0,
                limit: 10,
                search: voucherNumber,
                status: "",
            }),
            voucherKeys: [
                "openingStockVoucherNumber",
                "voucherNumber",
                "voucherNo",
            ],
            normalize: normalizeOpeningStockForView,
        },

        SALES_RETURN: {
            title: "View Sales Return",
            notFoundMessage: "Sales return not found",
            schemaKey: "salesReturn",
            bodyKey: "products",
            action: getByVoucherNumberSalesInvoiceReturn,
            params: (voucherNumber: string) => ({
                voucherNumber,
            }),
            voucherKeys: ["sInvReturnVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizeSalesReturnForView,
        },

        SALES_INVOICE: {
            title: "View Sales Invoice",
            notFoundMessage: "Sales invoice not found",
            schemaKey: "salesInvoice",
            bodyKey: "products",
            action: getByVoucherNumberSalesInvoice,
            params: (voucherNumber: string) => ({
                voucherNumber,
            }),
            voucherKeys: ["sInvVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizeInvoiceForView,
        },

        PURCHASE_INVOICE: {
            title: "View Purchase Invoice",
            notFoundMessage: "Purchase invoice not found",
            schemaKey: "purchaseInvoice",
            bodyKey: "products",
            action: getByVoucherNumberPurchaseInvoiceList,
            params: (voucherNumber: string) => voucherNumber,
            voucherKeys: ["pInvVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizePurchaseInvoiceForView,
        },

        PURCHASE_RETURN: {
            title: "View Purchase Return",
            notFoundMessage: "Purchase return not found",
            schemaKey: "purchaseReturn",
            bodyKey: "products",
            action: getByVoucherNumberPurchaseReturnList,
            params: (voucherNumber: string) => ({
                voucherNumber,
            }),
            voucherKeys: ["pRetVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizePurchaseReturnForView,
        },

        GRN: {
            title: "View GRN",
            notFoundMessage: "GRN not found",
            schemaKey: "grn",
            bodyKey: "products",
            action: getByVoucharNumberGrnList,
            params: (voucherNumber: string) => ({
                voucherNumber,
            }),
            voucherKeys: ["grnVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizeGrnForView,
        },
    };

    const handleViewVoucher = async (row: any) => {
        const voucherNumber = getStockVoucherNumber(row);
        const voucherKind = resolveStockVoucherKind(voucherNumber);

        if (!voucherNumber) {
            toast.error("Voucher number not found");
            return;
        }

        const config = stockViewConfig[voucherKind];

        if (!config) {
            toast.error("Voucher type not supported");
            return;
        }

        try {
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});
            setViewTitle(config.title);
            setViewBodyKey(config.bodyKey);

            if (config.manualSchema) {
                setViewTemplateFields(config.inputData);
            } else {
                await dispatch(getAllTransactionSchema(config.schemaKey) as any);
            }

            const res = await dispatch(
                config.action(config.params(voucherNumber)) as any
            ).unwrap();

            const record = getVoucherRecordFromResponse(
                res,
                voucherNumber,
                config.voucherKeys
            );

            // ✅ Do not open view modal if voucher not found
            if (!record) {
                toast.error(config.notFoundMessage || "Voucher not found");
                setViewModal(false);
                setViewForm({});
                return;
            }

            // ✅ Open modal only after record exists
            setViewForm(config.normalize(record));
            setViewModal(true);
        } catch (error: any) {
            console.log("Stock ledger view voucher failed", error);

            const errorMessage =
                error?.message ||
                error?.payload?.message ||
                config.notFoundMessage ||
                "Voucher not found";

            toast.error(errorMessage);
            setViewModal(false);
            setViewForm({});
        } finally {
            setViewLoading(false);
        }
    };

    useEffect(() => {
        const prepareViewFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema =
                Array.isArray(transactionsSchema?.header) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                const updatedData = await loadAllTemplateOptions(transactionsSchema);
                setViewTemplateFields(updatedData);
            } catch (error) {
                console.log("Failed to prepare view template fields", error);
            }
        };

        prepareViewFields();
    }, [transactionsSchema]);

    const productOptions = useMemo(() => {
        return (products || [])
            .map((item: any) => ({
                label:
                    item?.productName ||
                    item?.productDescription ||
                    item?.name ||
                    "",
                value: item?.productCode || item?._id || "",
            }))
            .filter((item: any) => item.label && item.value);
    }, [products]);

    const resetStockLedger = () => {
        setFromDate(getFirstDateOfCurrentMonth());
        setToDate(todayYMD());
        setProductCode("");
        setWarehouseCode("");
        setLocationCode("");
        setBinCode("");
        setBatchNumber("");
        dispatch(clearStockLedgerData());
    };

    useEffect(() => {
        dispatch(
            getAllProducts({
                offset: 0,
                limit: 100,
                search: "",
            }) as any
        );
    }, [dispatch]);

    useEffect(() => {
        const loadInventoryMasters = async () => {
            try {
                setInventoryFiltersLoading(true);

                const moduleResponse = await dispatch(
                    getCustomMasterModules({
                        offset: 0,
                        limit: 1000,
                        search: "",
                        status:"active"
                    })
                ).unwrap();

                const modules = getArrayRecords(moduleResponse);
                const foundModules: Partial<Record<InventoryFilterKey, any>> = {};

                (Object.keys(INVENTORY_MASTER_NAMES) as InventoryFilterKey[]).forEach((key) => {
                    const expectedName = normalizeInventoryMasterName(INVENTORY_MASTER_NAMES[key]);
                    const module = modules.find((item: any) => {
                        const moduleKey = normalizeInventoryMasterName(item?.key);
                        const moduleName = normalizeInventoryMasterName(item?.moduleName);
                        return moduleKey === key || moduleName === expectedName;
                    });

                    if (module?.moduleCode) foundModules[key] = module;
                });

                setInventoryModules(foundModules);

                const loadedEntries = await Promise.all(
                    (Object.keys(foundModules) as InventoryFilterKey[]).map(async (key) => {
                        const moduleCode = String(foundModules[key]?.moduleCode || "").trim();
                        if (!moduleCode) return [key, []] as const;

                        try {
                            const listingResponse = await dispatch(
                                getCustomMasterListing({
                                    moduleCode,
                                    offset: 0,
                                    limit: 1000,
                                    search: "",
                                })
                            ).unwrap();

                            return [
                                key,
                                buildInventoryMasterOptions(getArrayRecords(listingResponse), key),
                            ] as const;
                        } catch (error) {
                            console.log(`Failed to load ${key} master data`, error);
                            return [key, []] as const;
                        }
                    })
                );

                const nextOptions:any = {
                    warehouse: [],
                    location: [],
                    bin: [],
                    batch: [],
                };

                loadedEntries.forEach(([key, options]) => {
                    nextOptions[key] = options;
                });

                setInventoryFilterOptions(nextOptions);

                if (!foundModules.warehouse) setWarehouseCode("");
                if (!foundModules.location) setLocationCode("");
                if (!foundModules.bin) setBinCode("");
                if (!foundModules.batch) setBatchNumber("");
            } catch (error) {
                console.log("Failed to load stock ledger inventory masters", error);
                setInventoryModules({});
                setInventoryFilterOptions({ warehouse: [], location: [], bin: [], batch: [] });
                setWarehouseCode("");
                setLocationCode("");
                setBinCode("");
                setBatchNumber("");
            } finally {
                setInventoryFiltersLoading(false);
            }
        };

        loadInventoryMasters();
    }, [dispatch]);

    useEffect(() => {
        if (!show) {
            resetStockLedger();
        }
    }, [show]);

    useEffect(() => {
        return () => {
            dispatch(clearStockLedgerData());
        };
    }, [dispatch]);


    useEffect(() => {
        if (!productCode) return;

        dispatch(
            createStockLedger({
                productCode,
                fromDate: formatDateWithCurrentTime(fromDate),
                toDate: formatDateWithCurrentTime(toDate),
                warehouseCode,
                locationCode,
                batchNumber,
                binCode,
            }) as any
        );
    }, [dispatch, productCode, fromDate, toDate, warehouseCode, locationCode, batchNumber, binCode]);

    const downloadBlobFile = (blob: Blob, fileName: string) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = async () => {
        if (!productCode || pdfLoading) return;

        try {
            setPdfLoading(true);

            const res = await dispatch(
                createStockLedger({
                    productCode,
                    fromDate,
                    toDate,
                    warehouseCode,
                    locationCode,
                    batchNumber,
                    binCode,
                    exportType: "pdf",
                }) as any
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(res.blob, `stock-ledger-${productCode}.pdf`);
            }
        } catch (error) {
            console.log("Stock ledger PDF download failed", error);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!productCode || excelLoading) return;

        try {
            setExcelLoading(true);

            const res = await dispatch(
                createStockLedger({
                    productCode,
                    fromDate,
                    toDate,
                    warehouseCode,
                    locationCode,
                    batchNumber,
                    binCode,
                    exportType: "excel",
                }) as any
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(res.blob, `stock-ledger-${productCode}.xlsx`);
            }
        } catch (error) {
            console.log("Stock ledger Excel download failed", error);
        } finally {
            setExcelLoading(false);
        }
    };

    const selectedProductName =
        productOptions.find((item: any) => item.value === productCode)?.label ||
        "-";

    const tableData = getLedgerDetails(stockLedgerData);

    const summaryItems = [
        {
            label: "Product Code",
            value: stockLedgerData?.productCode || productCode || "-",
        },
        {
            label: "Product Type",
            value: formatProductType(stockLedgerData?.productType) || "-",
        },
        {
            label: "UOM",
            value: stockLedgerData?.uom || "-",
        },
    ];

    const closingStock = Number(
        stockLedgerData?.balanceQuantity ||
        stockLedgerData?.closingStock ||
        stockLedgerData?.closingQty ||
        0
    ).toFixed(2);

    // const viewFooterTotals = useMemo(() => {
    //     return {
    //         grossAmount: viewForm?.grossAmount || "0.00",
    //         discountAmount: viewForm?.discountAmount || "0.00",
    //         cgstAmount: viewForm?.cgstAmount || "0.00",
    //         sgstAmount: viewForm?.sgstAmount || "0.00",
    //         igstAmount: viewForm?.igstAmount || "0.00",
    //         netAmount: viewForm?.netAmount || "0.00",
    //         adjustedAmount: viewForm?.adjustedAmount || "0.00",
    //         balanceAmount: viewForm?.balanceAmount || "0.00",
    //     };
    // }, [viewForm]);

    const viewFooterTotals = useMemo(() => {
        return {
            grossAmount: viewForm?.grossAmount || "0.00",
            discountAmount: viewForm?.discountAmount || "0.00",
            cgstAmount: viewForm?.cgstAmount || "0.00",
            sgstAmount: viewForm?.sgstAmount || "0.00",
            igstAmount: viewForm?.igstAmount || "0.00",
            netAmount: viewForm?.netAmount || "0.00",
            adjustedAmount: viewForm?.adjustedAmount || "0.00",
            balanceAmount: viewForm?.balanceAmount || "0.00",

            totalQuantity: viewForm?.totalQuantity || "0",
            totalGrossAmount:
                viewForm?.totalGrossAmount ||
                viewForm?.grossAmount ||
                "0.00",
            totalTaxAmount:
                viewForm?.totalTaxAmount ||
                viewForm?.taxAmount ||
                "0.00",
            totalNetAmount:
                viewForm?.totalNetAmount ||
                viewForm?.netAmount ||
                "0.00",
        };
    }, [viewForm]);

    const viewFooterArray = useMemo(() => {
        return (viewTemplateFields?.footer || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => {
                const rawValue = viewFooterTotals?.[field.key as keyof typeof viewFooterTotals] ?? field?.rawValue ?? field?.value ?? "0.00";

                return {
                    ...field,
                    value: rawValue,
                    rawValue,
                };
            });
    }, [viewTemplateFields?.footer, viewFooterTotals]);

    const viewInputData = useMemo(() => {
        return {
            ...viewTemplateFields,
            footer: viewFooterArray,
        };
    }, [viewTemplateFields, viewFooterArray]);

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <div
                className="
          grid w-full grid-cols-1 gap-4 xl:grid-cols-2
          [&>*]:rounded-xl
          [&>*]:!p-4
          [&_h3]:!text-base
          [&_h2]:!text-base
          [&_p]:!text-sm
          [&_label]:!text-xs
          [&_input]:!h-10
          [&_input]:!text-sm
          [&_select]:!h-10
          [&_select]:!text-sm
          [&_.text-xl]:!text-lg
          [&_.text-lg]:!text-base
        "
            >
                <ReportFilterCard
                    title="Stock Ledger Filters"
                    fields={[
                        {
                            key: "fromDate",
                            type: "date",
                            label: "From Date",
                            value: fromDate,
                            onChange: (value) => {
                                setFromDate(value);
                            },
                            required: true,
                        },
                        {
                            key: "toDate",
                            type: "date",
                            label: "To Date",
                            value: toDate,
                            onChange: (value) => {
                                setToDate(value);
                            },
                            required: true,
                        },
                        {
                            key: "productCode",
                            type: "select",
                            label: "Product",
                            placeholder: productLoading ? "Loading products..." : "Select Product",
                            value: productCode,
                            options: productOptions,
                            disabled: productLoading,
                            onChange: (value) => {
                                setProductCode(value);
                            },
                            required: true,
                            colSpan: "full",
                        },
                        // @ts-ignore
                        ...(showWarehouse ? [{
                            key: "warehouseCode",
                            type: "select",
                            label: "Warehouse",
                            placeholder: inventoryFiltersLoading ? "Loading warehouses..." : "All Warehouses",
                            value: warehouseCode,
                            options: inventoryFilterOptions.warehouse,
                            disabled: inventoryFiltersLoading,
                            onChange: (value: string) => {
                                setWarehouseCode(value);
                            },
                            required: false,
                        }] : []),
                        // @ts-ignore
                        ...(showLocation ? [{
                            key: "locationCode",
                            type: "select",
                            label: "Location",
                            placeholder: inventoryFiltersLoading ? "Loading locations..." : "All Locations",
                            value: locationCode,
                            options: inventoryFilterOptions.location,
                            disabled: inventoryFiltersLoading,
                            onChange: (value: string) => {
                                setLocationCode(value);
                            },
                            required: false,
                        }] : []),
                        // @ts-ignore
                        ...(showBin ? [{
                            key: "binCode",
                            type: "select",
                            label: "Bin",
                            placeholder: inventoryFiltersLoading ? "Loading bins..." : "All Bins",
                            value: binCode,
                            options: inventoryFilterOptions.bin,
                            disabled: inventoryFiltersLoading,
                            onChange: (value: string) => {
                                setBinCode(value);
                            },
                            required: false,
                        }] : []),
                        // @ts-ignore
                        ...(showBatch ? [{
                            key: "batchNumber",
                            type: "select",
                            label: "Batch",
                            placeholder: inventoryFiltersLoading ? "Loading batches..." : "All Batches",
                            value: batchNumber,
                            options: inventoryFilterOptions.batch,
                            disabled: inventoryFiltersLoading,
                            onChange: (value: string) => {
                                setBatchNumber(value);
                            },
                            required: false,
                        }] : []),
                    ]}
                    gridCols="2"
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadExcel={handleDownloadExcel}
                    pdfDisabled={!productCode || pdfLoading}
                    excelDisabled={!productCode || excelLoading}
                    pdfLoading={pdfLoading}
                    excelLoading={excelLoading}
                    downloadDisabledMessage="Please select product to download stock ledger."
                />

                <AccountSummaryCard
                    title="Product"
                    accountName={selectedProductName}
                    summaryItems={summaryItems}
                    finalLabel="Available Quantity"
                    finalValue={closingStock}
                />
            </div>

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={listingLoader}
                emptyMessage={
                    productCode ? "No stock ledger data found" : "Please select product"
                }
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewVoucher(row);
                        }}
                        className="
              inline-flex items-center gap-1 rounded-lg
              bg-primary/10 px-3 py-1.5 text-xs font-bold
              text-primary transition hover:bg-primary/20
              cursor-pointer
            "
                    >
                        <Eye size={15} />
                    </button>
                )}
            />

            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={true}
                title={viewTitle}
                subtitle="View voucher details"
                loading={viewLoading}
                onClose={() => {
                    setViewModal(false);
                    setViewForm({});
                    setViewErrors({});
                }}
                onSubmit={() => { }}
                form={viewForm}
                errors={viewErrors}
                handleAddRow={() => { }}
                handleDeleteRow={() => { }}
                handleRowChange={() => { }}
                inputData={viewInputData}
                bodyKey={viewBodyKey}
                handleChange={() => { }}
                footerTotals={viewFooterTotals}
                contentLoading={viewLoading}
            />
        </div>
    );
};

export default StockLedger;