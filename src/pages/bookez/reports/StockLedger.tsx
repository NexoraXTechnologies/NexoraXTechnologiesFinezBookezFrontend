import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import DataTable from "../../../components/DataTable";
import ReportFilterCard from "./ReportFilterCard";
import AccountSummaryCard from "./AccountSummaryCard";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";
import {
    createStockLedger,
    clearStockLedgerData,
} from "../../../redux/slices/professionalSlice/ledgerReports/stockLedgerSlice";

import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberSalesInvoice } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import { getByVoucherNumberSalesInvoiceReturn } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceReturn";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";
import { getByVoucherNumberPurchaseInvoiceList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";
import { getByVoucherNumberPurchaseReturnList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseReturnSlice";
import { getByVoucharNumberGrnList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/grnSlice";

type StockLedgerProps = {
    show?: boolean;
};

const mainColumns = [
    {
        key: "voucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-slate-800">
                {row?.voucherNumber || row?.voucherNo || "-"}
            </span>
        ),
    },
    {
        key: "voucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate =
                row?.voucherDate ||
                row?.date ||
                row?.createdOn;

            const date = rawDate
                ? new Date(rawDate).toLocaleDateString("en-IN")
                : "-";

            return (
                <span className="font-medium text-slate-700">
                    {date}
                </span>
            );
        },
    },

    {
        key: "party",
        title: "Party",
        render: (row: any) => (
            <span className="font-medium text-slate-800">
                {row?.party || row?.party || "-"}
            </span>
        ),
    },
    {
        key: "inwardQty",
        title: "Inward Qty",
        render: (row: any) => (
            <span className="font-semibold text-emerald-700">
                {Number(
                    row?.inwardQty || 0
                ).toFixed(2)}
            </span>
        ),
    },
    {
        key: "outwardQty",
        title: "Outward Qty",
        render: (row: any) => (
            <span className="font-semibold text-red-700">
                {Number(
                    row?.outwardQty || 0
                ).toFixed(2)}
            </span>
        ),
    },
    // {
    //     key: "balanceQty",
    //     title: "Balance Qty",
    //     render: (row: any) => (
    //         <span className="font-semibold text-slate-900">
    //             {Number(
    //                 row?.balanceQty || 0
    //             ).toFixed(2)}
    //         </span>
    //     ),
    // },

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
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Inward
                    </span>
                );
            }

            if (outwardQty > 0) {
                return (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                        Outward
                    </span>
                );
            }

            return (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    -
                </span>
            );
        },
    },
];

const todayYMD = () => {
    return new Date().toISOString().split("T")[0];
};

const getLedgerDetails = (data: any) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.details)) return data.details;
    if (Array.isArray(data?.transactions)) return data.transactions;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const StockLedger = ({ show = true }: StockLedgerProps) => {
    const dispatch = useDispatch<any>();


    const {
        stockLedgerData = null,
        listingLoader = false,
        exportLoader = false,
    } = useSelector((s: any) => s.stockLedger);

    const {
        products = [],
        loading: productLoading = false,
    } = useSelector((s: any) => s.productMaster);

    const [fromDate, setFromDate] = useState(todayYMD());
    const [toDate, setToDate] = useState(todayYMD());
    const [productCode, setProductCode] = useState("");
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
        // ✅ Purchase invoice response: { invoice: {...} }
        if (res?.invoice) return res.invoice;
        if (res?.data?.invoice) return res.data.invoice;

        // ✅ Direct voucher object
        if (
            res &&
            typeof res === "object" &&
            voucherKeys.some((key) => res?.[key] === voucherNumber)
        ) {
            return res;
        }

        // ✅ Direct voucher inside data
        if (
            res?.data &&
            typeof res.data === "object" &&
            voucherKeys.some((key) => res.data?.[key] === voucherNumber)
        ) {
            return res.data;
        }

        // ✅ Other possible nested names
        if (res?.voucher) return res.voucher;
        if (res?.data?.voucher) return res.data.voucher;

        if (res?.grn) return res.grn;
        if (res?.data?.grn) return res.data.grn;

        // ✅ Array fallback
        const records =
            Array.isArray(res) ? res :
                Array.isArray(res?.items) ? res.items :
                    Array.isArray(res?.records) ? res.records :
                        Array.isArray(res?.docs) ? res.docs :
                            Array.isArray(res?.data) ? res.data :
                                Array.isArray(res?.data?.items) ? res.data.items :
                                    Array.isArray(res?.data?.records) ? res.data.records :
                                        Array.isArray(res?.data?.docs) ? res.data.docs :
                                            [];

        return (
            records.find((item: any) =>
                voucherKeys.some((key) => item?.[key] === voucherNumber)
            ) || records[0]
        );
    };

    const normalizeInvoiceForView = (record: any) => {
        const footer = record?.sInvFooter || {};

        const products = (record?.sInvBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription:
                item?.productDescription || item?.description || "",
            description:
                item?.description || item?.productDescription || "",
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

            // ✅ Header fields
            sInvVoucherNumber: record?.sInvVoucherNumber || record?.voucherNumber || "",
            sInvVoucherDate: record?.sInvVoucherDate || record?.voucherDate || "",
            sInvCustomerName: record?.sInvCustomerName || record?.customerName || "",
            sInvCustomerCode: record?.sInvCustomerCode || record?.customerCode || "",
            sInvRemark: record?.sInvRemark || record?.sInvRemarks || "",
            sInvStatus: record?.sInvStatus || record?.sInvDocStatus || "open",
            sInvSalesAccount: record?.sInvSalesAccount || "",

            // ✅ Body key used by DynamicAddForm
            products,

            // ✅ Footer fields based on schema keys
            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount: footer?.balanceAmount || footer?.netAmount || footer?.totalNetAmount || "0.00",
        };
    };
    const normalizeSalesReturnForView = (record: any) => {
        const footer = record?.sInvReturnFooter || {};

        const products = (record?.sInvReturnBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription:
                item?.productDescription || item?.description || "",
            description:
                item?.description || item?.productDescription || "",
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

            // ✅ Header fields
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

            // ✅ Body key used by DynamicAddForm
            products,

            // ✅ Footer fields based on schema keys
            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount: footer?.balanceAmount || footer?.netAmount || footer?.totalNetAmount || "0.00",
        };
    };

    const normalizePurchaseInvoiceForView = (record: any) => {
        const footer = record?.pInvFooter || {};

        const products = (record?.pInvBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription:
                item?.productDescription || item?.description || "",
            description:
                item?.description || item?.productDescription || "",
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

            pInvVoucherDate:
                record?.pInvVoucherDate || record?.voucherDate || "",

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

            pInvStatus:
                record?.pInvStatus || "open",

            pInvRemark:
                record?.pInvRemark || record?.remark || "",

            products,

            grossAmount:
                footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount:
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount:
                footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount:
                footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount:
                footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount:
                footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount:
                footer?.adjustedAmount || "0.00",
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

            productDescription:
                item?.productDescription || item?.description || "",
            description:
                item?.description || item?.productDescription || "",
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

            // ✅ Important: use pRet keys because schema/API has pRet keys
            pRetVoucherNumber:
                record?.pRetVoucherNumber || record?.voucherNumber || "",

            pRetVoucherDate:
                record?.pRetVoucherDate || record?.voucherDate || "",

            grnVoucherNumber:
                record?.grnVoucherNumber || "",

            pOrdVoucherNumber:
                record?.pOrdVoucherNumber || "",

            pRetVendorCode:
                record?.pRetVendorCode || record?.vendorCode || record?.accountCode || "",

            pRetVendorName:
                record?.pRetVendorName || record?.vendorName || record?.accountName || "",

            pRetPurAccount:
                record?.pRetPurAccount || "",

            pRetStatus:
                record?.pRetStatus || "open",

            pRetRemark:
                record?.pRetRemark || record?.remark || "",

            // ✅ Body key data
            products,

            // ✅ Also keep original key, in case schema bodyKey is pRetBody
            pRetBody: products,

            grossAmount:
                footer?.grossAmount || footer?.totalGrossAmount || "0.00",

            discountAmount:
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",

            cgstAmount:
                footer?.cgstAmount || footer?.totalCgstAmount || "0.00",

            sgstAmount:
                footer?.sgstAmount || footer?.totalSgstAmount || "0.00",

            igstAmount:
                footer?.igstAmount || footer?.totalIgstAmount || "0.00",

            taxAmount:
                footer?.taxAmount || footer?.totalTaxAmount || "0.00",

            otherAmount:
                footer?.otherAmount || footer?.totalOtherAmount || "0.00",

            netAmount:
                footer?.netAmount || footer?.totalNetAmount || "0.00",

            adjustedAmount:
                footer?.adjustedAmount || "0.00",

            balanceAmount:
                footer?.balanceAmount ||
                footer?.netAmount ||
                footer?.totalNetAmount ||
                "0.00",

            totalQuantity:
                footer?.totalQuantity || "0",
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

            productDescription:
                item?.productDescription || item?.description || "",
            description:
                item?.description || item?.productDescription || "",
            productHSNCode: item?.productHSNCode || "",

            quantity:
                item?.quantity ||
                Number(item?.acceptedQuantity || 0) + Number(item?.rejectedQuantity || 0) ||
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
                record?.grnVoucherDate ||
                record?.voucherDate ||
                record?.date ||
                "",

            pOrdVoucherNumber:
                record?.pOrdVoucherNumber ||
                record?.purchaseOrderVoucherNumber ||
                "",

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

            grnStatus:
                record?.grnStatus ||
                record?.status ||
                "open",

            grnRemark:
                record?.grnRemark ||
                record?.remark ||
                "",

            products,

            // keep original key also, if schema body key is grnBody
            grnBody: products,

            grossAmount:
                footer?.grossAmount ||
                footer?.totalGrossAmount ||
                record?.grossAmount ||
                "0.00",

            discountAmount:
                footer?.discountAmount ||
                footer?.totalDiscountAmount ||
                record?.discountAmount ||
                "0.00",

            cgstAmount:
                footer?.cgstAmount ||
                footer?.totalCgstAmount ||
                record?.cgstAmount ||
                "0.00",

            sgstAmount:
                footer?.sgstAmount ||
                footer?.totalSgstAmount ||
                record?.sgstAmount ||
                "0.00",

            igstAmount:
                footer?.igstAmount ||
                footer?.totalIgstAmount ||
                record?.igstAmount ||
                "0.00",

            taxAmount:
                footer?.taxAmount ||
                footer?.totalTaxAmount ||
                record?.taxAmount ||
                "0.00",

            otherAmount:
                footer?.otherAmount ||
                footer?.totalOtherAmount ||
                record?.otherAmount ||
                "0.00",

            netAmount:
                footer?.netAmount ||
                footer?.totalNetAmount ||
                record?.netAmount ||
                "0.00",

            adjustedAmount:
                footer?.adjustedAmount ||
                record?.adjustedAmount ||
                "0.00",

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

    const normalizeVoucherNo = (value: any) => {
        return String(value || "").trim().toUpperCase();
    };

    const resolveStockVoucherKind = (voucherNumber: any) => {
        const vn = normalizeVoucherNo(voucherNumber);

        // ✅ Longer prefixes first
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
        SALES_RETURN: {
            title: "View Sales Return",
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
            schemaKey: "purchaseInvoice",
            bodyKey: "products",
            action: getByVoucherNumberPurchaseInvoiceList,

            // ✅ If your thunk accepts string
            params: (voucherNumber: string) => voucherNumber,

            // ✅ If your thunk accepts object, use this instead:
            // params: (voucherNumber: string) => ({ voucherNumber }),

            voucherKeys: ["pInvVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizePurchaseInvoiceForView,
        },

        PURCHASE_RETURN: {
            title: "View Purchase Return",
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
            schemaKey: "grn",
            bodyKey: "products",
            action: getByVoucharNumberGrnList,
            params: (voucherNumber: string) => ({
                offset: 0,
                limit: 10,
                search: voucherNumber,
                status: "",
            }),
            voucherKeys: ["grnVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizeGrnForView,
        },
    };
    const handleViewVoucher = async (row: any) => {
        const voucherNumber = getStockVoucherNumber(row);
        const voucherKind = resolveStockVoucherKind(voucherNumber);

        if (!voucherNumber) {
            console.log("Voucher number missing in stock ledger row:", row);
            return;
        }

        const config = stockViewConfig[voucherKind];

        if (!config) {
            console.log("Unsupported stock ledger voucher:", {
                row,
                voucherNumber,
                voucherKind,
            });
            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});
            setViewTitle(config.title);
            setViewBodyKey(config.bodyKey);

            await dispatch(getAllTransactionSchema(config.schemaKey) as any);

            const res = await dispatch(
                config.action(config.params(voucherNumber)) as any
            ).unwrap();

            const record = getVoucherRecordFromResponse(
                res,
                voucherNumber,
                config.voucherKeys
            );

            if (!record) {
                console.log(`${config.title} not found:`, voucherNumber, res);
                setViewForm({});
                return;
            }

            setViewForm(config.normalize(record));
        } catch (error) {
            console.log("Stock ledger view voucher failed", error);
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
                value:
                    item?.productCode ||
                    item?._id ||
                    "",
            }))
            .filter((item: any) => item.label && item.value);
    }, [products]);

    const resetStockLedger = () => {
        setFromDate(todayYMD());
        setToDate(todayYMD());
        setProductCode("");
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

    /*
        ✅ If modal is only hidden and not unmounted,
        this will clear data when show becomes false.
    */
    useEffect(() => {
        if (!show) {
            resetStockLedger();
        }
    }, [show]);

    /*
        ✅ If modal unmounts component on close,
        this will clear redux data on unmount.
    */
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
                fromDate,
                toDate,
            }) as any
        );
    }, [dispatch, productCode, fromDate, toDate]);

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
        if (!productCode) return;

        try {
            const res = await dispatch(
                createStockLedger({
                    productCode,
                    fromDate,
                    toDate,
                    exportType: "pdf",
                }) as any
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    `stock-ledger-${productCode}.pdf`
                );
            }
        } catch (error) {
            console.log("Stock ledger PDF download failed", error);
        }
    };

    const handleDownloadExcel = async () => {
        if (!productCode) return;

        try {
            const res = await dispatch(
                createStockLedger({
                    productCode,
                    fromDate,
                    toDate,
                    exportType: "excel",
                }) as any
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    `stock-ledger-${productCode}.xlsx`
                );
            }
        } catch (error) {
            console.log("Stock ledger Excel download failed", error);
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
            value: stockLedgerData?.productType || "-",
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
        };
    }, [viewForm]);

    const viewFooterArray = useMemo(() => {
        return (viewTemplateFields?.footer || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => {
                const rawValue = viewFooterTotals?.[field.key as keyof typeof viewFooterTotals] ?? "0.00";

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
        <div className="flex h-full w-full flex-col gap-4 bg-slate-50 p-4">
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
                            placeholder: productLoading
                                ? "Loading products..."
                                : "Select Product",
                            value: productCode,
                            options: productOptions,
                            disabled: productLoading,
                            onChange: (value) => {
                                setProductCode(value);
                            },
                            required: true,
                            colSpan: "full",
                        },
                    ]}
                    gridCols="2"
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadExcel={handleDownloadExcel}
                    downloadDisabled={!productCode || exportLoader}
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
                    productCode
                        ? "No stock ledger data found"
                        : "Please select product"
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
                bg-indigo-50 px-3 py-1.5 text-xs font-bold
                text-indigo-700 transition hover:bg-indigo-100
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