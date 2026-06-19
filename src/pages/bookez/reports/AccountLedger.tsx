import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import ReportFilterCard from "./ReportFilterCard";
import AccountSummaryCard from "./AccountSummaryCard";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAccountLedger } from "../../../redux/slices/professionalSlice/ledgerReports/accountLedgerSlice";
import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";

import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberSalesInvoice } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import { getByVoucherNumberSalesInvoiceReturn } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceReturn";

import { getFirstDateOfCurrentMonth, loadAllTemplateOptions, todayYMD } from "../../../utils/helperFunctions";
import { getByVoucherNumberSalesReceiptList } from "../../../redux/slices/professionalSlice/salesWorkflow/salesReceipt";
import { getByVoucherNumberPurchaseInvoiceList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";
import { getByVoucherNumberPurchaseReturnList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseReturnSlice";
import { getByVoucherNumberPayment } from "../../../redux/slices/professionalSlice/purchaseWorkflow/paymentSlice";



const mainColumns = [
    {
        key: "voucherNumber",
        title: "Voucher Number",
    },
    {
        key: "module",
        title: "Module",
        render: (row: any) => (
            <span className="font-semibold text-slate-900">
                {row?.module || "-"}
            </span>
        ),
    },
    {
        key: "voucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const date = row?.voucherDate
                ? new Date(row.voucherDate).toLocaleDateString("en-IN")
                : "-";

            return (
                <span className="font-medium text-slate-700">
                    {date}
                </span>
            );
        },
    },
    {
        key: "debit",
        title: "Debit",
        render: (row: any) => (
            <span className="font-semibold text-slate-900">
                ₹{Number(row?.debit || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "credit",
        title: "Credit",
        render: (row: any) => (
            <span className="font-semibold text-slate-900">
                ₹{Number(row?.credit || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) => (
            <span className="font-semibold text-slate-900">
                ₹{Number(row?.netAmount || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) => {
            const debit = Number(row?.debit || 0);
            const credit = Number(row?.credit || 0);

            if (debit > 0) {
                return (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                        Debit
                    </span>
                );
            }

            if (credit > 0) {
                return (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Credit
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

const AccountLedger = () => {
    const dispatch = useDispatch<any>();

    const {
        accountLedger = [],
        listingLoader = false,
        pagination = {},
        totals = {},
    } = useSelector((s: any) => s.accountLedger);

    const { accounts = [] } = useSelector((s: any) => s.accountMaster);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [fromDate, setFromDate] = useState<string>(getFirstDateOfCurrentMonth());
    const [toDate, setToDate] = useState<string>(todayYMD());
    const [account, setAccount] = useState<string>("");

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewTitle, setViewTitle] = useState("");
    const [viewForm, setViewForm] = useState<any>({});
    const [viewErrors, setViewErrors] = useState<any>({});
    const [viewBodyKey, setViewBodyKey] = useState("products");

    const [viewTemplateFields, setViewTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    const accountOptions = useMemo(() => {
        return (accounts || []).map((item: any) => ({
            label: item?.accountName || "",
            value: item?.accountCode || "",
        }));
    }, [accounts]);




    const getVoucherRecordFromResponse = (
        res: any,
        voucherNumber: string,
        voucherKeys: string[]
    ) => {
        // ✅ Purchase invoice API response: { invoice: {...} }
        if (res?.invoice) {
            return res.invoice;
        }

        // ✅ Sometimes response can be: { data: { invoice: {...} } }
        if (res?.data?.invoice) {
            return res.data.invoice;
        }

        // ✅ Direct single voucher object
        if (
            res &&
            typeof res === "object" &&
            voucherKeys.some((key) => res?.[key] === voucherNumber)
        ) {
            return res;
        }

        // ✅ Sometimes response can be: { data: voucherObject }
        if (
            res?.data &&
            typeof res.data === "object" &&
            voucherKeys.some((key) => res.data?.[key] === voucherNumber)
        ) {
            return res.data;
        }

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



    const getVoucherNumber = (row: any) => {
        return (
            row?.voucherNumber ||
            row?.voucherNo ||

            row?.sInvVoucherNumber ||
            row?.sInvReturnVoucherNumber ||

            row?.recVoucherNumber ||
            row?.receiptVoucherNumber ||
            row?.salesReceiptVoucherNumber ||
            row?.sReceiptVoucherNumber ||

            row?.payVoucherNumber ||
            row?.paymentVoucherNumber ||

            row?.pInvVoucherNumber ||

            row?.pRetVoucherNumber ||
            row?.pReturnVoucherNumber ||
            row?.purReturnVoucherNumber ||
            row?.purchaseReturnVoucherNumber ||

            ""
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

            sInvVoucherNumber:
                record?.sInvVoucherNumber || record?.voucherNumber || "",
            sInvVoucherDate:
                record?.sInvVoucherDate || record?.voucherDate || "",
            sInvCustomerName:
                record?.sInvCustomerName || record?.customerName || "",
            sInvCustomerCode:
                record?.sInvCustomerCode || record?.customerCode || "",
            sInvRemark:
                record?.sInvRemark || record?.sInvRemarks || record?.remark || "",
            sInvStatus:
                record?.sInvStatus || record?.sInvDocStatus || "open",
            sInvSalesAccount:
                record?.sInvSalesAccount || "",

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

            sInvReturnVoucherNumber:
                record?.sInvReturnVoucherNumber || record?.voucherNumber || "",
            sInvReturnVoucherDate:
                record?.sInvReturnVoucherDate || record?.voucherDate || "",
            sInvVoucherNumber:
                record?.sInvVoucherNumber || "",
            sInvReturnCustomerName:
                record?.sInvReturnCustomerName || record?.customerName || "",
            sInvReturnCustomerCode:
                record?.sInvReturnCustomerCode ||
                record?.sInvCustomerCode ||
                record?.customerCode ||
                "",
            sInvReturnRemark:
                record?.sInvReturnRemark ||
                record?.sInvRemark ||
                record?.remark ||
                "",
            sInvReturnStatus:
                record?.sInvReturnStatus || record?.sInvStatus || "open",

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

    const normalizeReceiptForView = (record: any) => {
        const footer = record?.recFooter || {};

        const recBody = (record?.recBody || []).map((item: any) => ({
            accountCode: item?.accountCode || "",
            accountName: item?.accountName || "",
            amount: item?.amount || "0",
            netAmount: item?.netAmount || item?.amount || "0",

        }));

        return {
            ...record,

            // ✅ Header fields
            recVoucherNumber:
                record?.recVoucherNumber || record?.voucherNumber || "",

            recVoucherDate:
                record?.recVoucherDate || record?.voucherDate || "",

            recAccountCode:
                record?.recAccountCode || "",

            recAccountName:
                record?.recAccountName || "",

            recStatus:
                record?.recStatus || "open",

            recRemark:
                record?.recRemark || "",

            // ✅ Body key
            recBody,

            // ✅ Footer fields
            netAmount:
                footer?.netAmount || record?.netAmount || "0.00",

            adjustedAmount:
                footer?.adjustedAmount || record?.adjustedAmount || "0.00",

            balanceAmount:
                footer?.balanceAmount || record?.balanceAmount || "0.00",

            grossAmount: "0.00",
            discountAmount: "0.00",
            cgstAmount: "0.00",
            sgstAmount: "0.00",
            igstAmount: "0.00",
        };
    };

    const normalizePaymentForView = (record: any) => {
        const footer = record?.payFooter || record?.paymentFooter || {};

        const payBody = (
            record?.payBody ||
            record?.paymentBody ||
            record?.body ||
            []
        ).map((item: any) => ({
            accountCode: item?.accountCode || "",
            accountName: item?.accountName || "",
            amount: item?.amount || "0",
            netAmount: item?.netAmount || item?.amount || "0",
        }));

        return {
            ...record,

            payVoucherNumber:
                record?.payVoucherNumber ||
                record?.paymentVoucherNumber ||
                record?.voucherNumber ||
                "",

            payVoucherDate:
                record?.payVoucherDate ||
                record?.paymentVoucherDate ||
                record?.voucherDate ||
                "",

            payAccountCode:
                record?.payAccountCode ||
                record?.paymentAccountCode ||
                record?.accountCode ||
                "",

            payAccountName:
                record?.payAccountName ||
                record?.paymentAccountName ||
                record?.accountName ||
                "",

            payStatus:
                record?.payStatus ||
                record?.paymentStatus ||
                "open",

            payRemark:
                record?.payRemark ||
                record?.paymentRemark ||
                record?.remark ||
                "",

            payBody,

            grossAmount: "0.00",
            discountAmount: "0.00",
            cgstAmount: "0.00",
            sgstAmount: "0.00",
            igstAmount: "0.00",

            netAmount:
                footer?.netAmount ||
                record?.netAmount ||
                "0.00",

            adjustedAmount:
                footer?.adjustedAmount ||
                record?.adjustedAmount ||
                "0.00",

            balanceAmount:
                footer?.balanceAmount ||
                record?.balanceAmount ||
                "0.00",
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

    const normalizeModuleKey = (module: any) => {
        return String(module || "")
            .replaceAll(" ", "")
            .replaceAll("_", "")
            .replaceAll("-", "")
            .toLowerCase();
    };



    const moduleViewConfig: any = {
        salesinvoice: {
            title: "View Sales Invoice",
            schemaKey: "salesInvoice",
            bodyKey: "products",
            action: getByVoucherNumberSalesInvoice,
            params: (voucherNumber: string) => ({

                voucherNumber: voucherNumber,
            }),
            voucherKeys: ["sInvVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizeInvoiceForView,
        },

        salesinvoicereturns: {
            title: "View Sales Return",
            schemaKey: "salesReturn",
            bodyKey: "products",
            action: getByVoucherNumberSalesInvoiceReturn,
            params: (voucherNumber: string) => ({

                voucherNumber: voucherNumber,
            }),
            voucherKeys: ["sInvReturnVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizeSalesReturnForView,
        },

        salesinvoicereturn: {
            title: "View Sales Return",
            schemaKey: "salesReturn",
            bodyKey: "products",
            action: getByVoucherNumberSalesInvoiceReturn,
            params: (voucherNumber: string) => ({

                voucherNumber: voucherNumber,
            }),
            voucherKeys: ["sInvReturnVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizeSalesReturnForView,
        },



        receipt: {
            title: "View Receipt",
            schemaKey: "receipt",
            bodyKey: "recBody",
            action: getByVoucherNumberSalesReceiptList,
            params: (voucherNumber: string) => ({

                voucherNumber: voucherNumber,

            }),
            voucherKeys: ["recVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizeReceiptForView,
        },

        payment: {
            title: "View Payment",
            schemaKey: "payment",
            bodyKey: "payBody",
            action: getByVoucherNumberPayment,
            params: (voucherNumber: string) => ({

                voucherNumber: voucherNumber,

            }),
            voucherKeys: [
                "payVoucherNumber",
                "paymentVoucherNumber",
                "voucherNumber",
                "voucherNo",
            ],
            normalize: normalizePaymentForView,
        },

        purchaseinvoice: {
            title: "View Purchase Invoice",
            schemaKey: "purchaseInvoice",
            bodyKey: "products",
            action: getByVoucherNumberPurchaseInvoiceList,
            params: (voucherNumber: string) => ({

                voucherNumber: voucherNumber,

            }),
            voucherKeys: ["pInvVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizePurchaseInvoiceForView,
        },

        purchasereturn: {
            title: "View Purchase Return",
            schemaKey: "purchaseReturn",
            bodyKey: "products",
            action: getByVoucherNumberPurchaseReturnList,
            params: (voucherNumber: string) => ({

                voucherNumber: voucherNumber,

            }),
            voucherKeys: ["pRetVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizePurchaseReturnForView,
        },

        purchasereturns: {
            title: "View Purchase Return",
            schemaKey: "purchaseReturn",
            bodyKey: "products",
            action: getByVoucherNumberPurchaseReturnList,
            params: (voucherNumber: string) => ({

                voucherNumber: voucherNumber,

            }),
            voucherKeys: ["pRetVoucherNumber", "voucherNumber", "voucherNo"],
            normalize: normalizePurchaseReturnForView,
        },
    };

    const handleViewVoucher = async (row: any) => {
        const voucherNumber = getVoucherNumber(row);
        const moduleKey = normalizeModuleKey(row?.module);

        if (!voucherNumber) {
            console.log("Voucher number missing in ledger row:", row);
            return;
        }

        const config = moduleViewConfig[moduleKey];

        if (!config) {
            console.log("Unsupported account ledger module:", {
                row,
                module: row?.module,
                moduleKey,
                voucherNumber,
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
            console.log("View voucher failed", error);
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

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                accountType: "customer , vendor",
            })
        );
    }, [dispatch]);

    useEffect(() => {
        dispatch(
            getAccountLedger({
                fromDate,
                toDate,
                accountCode: account,
                offset: localOffset,
                limit: localLimit,
            })
        );
    }, [dispatch, fromDate, toDate, account, localOffset, localLimit]);

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
        if (!account || pdfLoading) return;

        try {
            setPdfLoading(true);

            const res = await dispatch(
                getAccountLedger({
                    fromDate,
                    toDate,
                    accountCode: account,
                    offset: localOffset,
                    limit: localLimit,
                    exportType: "pdf",
                })
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    `account-ledger-${account}.pdf`
                );
            }
        } catch (error) {
            console.log("PDF download failed", error);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!account || excelLoading) return;

        try {
            setExcelLoading(true);

            const res = await dispatch(
                getAccountLedger({
                    fromDate,
                    toDate,
                    accountCode: account,
                    offset: localOffset,
                    limit: localLimit,
                    exportType: "excel",
                })
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    `account-ledger-${account}.xlsx`
                );
            }
        } catch (error) {
            console.log("Excel download failed", error);
        } finally {
            setExcelLoading(false);
        }
    };

    const normalizeType = (
        type?: string,
        fallback: "Dr" | "Cr" = "Dr"
    ): "Dr" | "Cr" => {
        if (type === "DEBIT") return "Dr";
        if (type === "CREDIT") return "Cr";
        if (type === "Dr" || type === "Cr") return type;

        return fallback;
    };

    const formatAmount = (
        amount: any,
        type: "Dr" | "Cr" = "Dr"
    ) => {
        return `₹${Math.abs(Number(amount || 0)).toFixed(2)} ${type}`;
    };

    const selectedAccountName =
        accountOptions.find((item: any) => item.value === account)?.label || "-";

    const remainingBalanceType: "Dr" | "Cr" =
        totals?.remainingBalanceType
            ? normalizeType(totals?.remainingBalanceType, "Dr")
            : Number(totals?.remainingBalance || 0) >= 0
                ? "Dr"
                : "Cr";

    const summaryItems = [
        {
            label: "Opening Balance Net Total",
            value: formatAmount(
                totals?.openingBalanceNetTotal,
                normalizeType(totals?.openingBalanceType, "Dr")
            ),
        },
        {
            label: "Sales Invoice Total",
            value: formatAmount(
                totals?.salesInvoiceNetTotal,
                "Dr"
            ),
        },
        {
            label: "Sales Return Total",
            value: formatAmount(
                totals?.salesReturnNetTotal,
                "Cr"
            ),
        },
        {
            label: "Receipt Total",
            value: formatAmount(
                totals?.receiptNetTotal,
                "Cr"
            ),
        },
    ];

    const remainingBalance = formatAmount(
        totals?.remainingBalance,
        remainingBalanceType
    );

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
                const rawValue =
                    viewFooterTotals?.[
                    field.key as keyof typeof viewFooterTotals
                    ] ?? "0.00";

                return {
                    ...field,
                    value: rawValue,
                    rawValue,
                };
            });
    }, [viewTemplateFields?.footer, viewFooterTotals]);



    const viewInputData = useMemo(() => {
        const hiddenBodyKeys = [
            "references",
            "reference",
            "remarks",
            "remark",
            "recRemark",
        ];

        const filteredBody = (viewTemplateFields?.body || []).filter(
            (field: any) =>
                !hiddenBodyKeys.includes(String(field?.key || "").toLowerCase())
        );

        return {
            ...viewTemplateFields,
            body: filteredBody,
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
                    title="Account Ledger Filters"
                    fields={[
                        {
                            key: "fromDate",
                            type: "date",
                            label: "From Date",
                            value: fromDate,
                            onChange: (value) => {
                                setFromDate(value);
                                setLocalOffset(0);
                            },
                            required: false,
                        },
                        {
                            key: "toDate",
                            type: "date",
                            label: "To Date",
                            value: toDate,
                            onChange: (value) => {
                                setToDate(value);
                                setLocalOffset(0);
                            },
                            required: false,
                        },
                        {
                            key: "account",
                            type: "select",
                            label: "Customer / Vendor",
                            placeholder: "Select Customer / Vendor",
                            value: account,
                            options: accountOptions,
                            onChange: (value) => {
                                setAccount(value);
                                setLocalOffset(0);
                            },
                            required: false,
                            colSpan: "full",
                        },
                    ]}
                    gridCols="2"
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadExcel={handleDownloadExcel}
                    pdfDisabled={!account || pdfLoading}
                    excelDisabled={!account || excelLoading}
                    pdfLoading={pdfLoading}
                    excelLoading={excelLoading}
                    downloadDisabledMessage="Please select customer/vendor to download report."
                />

                <AccountSummaryCard
                    title="Account"

                    accountName={selectedAccountName}
                    summaryItems={summaryItems}
                    finalLabel="Remaining Balance"
                    finalValue={remainingBalance}
                />
            </div>

            <DataTable
                columns={mainColumns}
                data={accountLedger}
                loading={listingLoader}
                emptyMessage="No data found"
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
                        title="View Details"
                    >
                        <Eye size={15} />
                    </button>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <div className="mt-2">
                    <Pagination
                        localLimit={localLimit}
                        selectCb={(e: any) => {
                            setLocalLimit(Number(e.target.value));
                            setLocalOffset(0);
                        }}
                        preDisabled={!pagination?.hasPrevPage}
                        nextDisabled={!pagination?.hasNextPage}
                        setLocalOffset={setLocalOffset}
                        pagination={pagination}
                    />
                </div>
            )}

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

export default AccountLedger;