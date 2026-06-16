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
import { getAllSalesInvoice } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import { getAllSalesInvoiceReturn } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceReturn";

import { loadAllTemplateOptions } from "../../../utils/helperFunctions";
import { getSalesReceiptList } from "../../../redux/slices/professionalSlice/salesWorkflow/salesReceipt";

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
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Debit
                    </span>
                );
            }

            if (credit > 0) {
                return (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
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
        exportLoader = false,
        pagination = {},
        totals = {},
    } = useSelector((s: any) => s.accountLedger);

    const { accounts = [] } = useSelector((s: any) => s.accountMaster);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const todayDate = new Date().toISOString().split("T")[0];

    const [fromDate, setFromDate] = useState(todayDate);
    const [toDate, setToDate] = useState(todayDate);
    const [account, setAccount] = useState("");

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

    const getRecords = (res: any) => {
        if (Array.isArray(res)) return res;

        if (Array.isArray(res?.items)) return res.items;
        if (Array.isArray(res?.records)) return res.records;
        if (Array.isArray(res?.docs)) return res.docs;
        if (Array.isArray(res?.data)) return res.data;

        if (Array.isArray(res?.data?.items)) return res.data.items;
        if (Array.isArray(res?.data?.records)) return res.data.records;
        if (Array.isArray(res?.data?.docs)) return res.data.docs;
        if (Array.isArray(res?.data?.data)) return res.data.data;

        return [];
    };

    const getVoucherNumber = (row: any) => {
        return (
            row?.voucherNumber ||
            row?.voucherNo ||
            row?.sInvVoucherNumber ||
            row?.sInvReturnVoucherNumber ||
            row?.receiptVoucherNumber ||
            row?.salesReceiptVoucherNumber ||
            row?.sReceiptVoucherNumber ||
            ""
        );
    };

    const getModuleName = (row: any) => {
        return String(
            row?.module ||
            row?.moduleName ||
            row?.voucherType ||
            row?.type ||
            ""
        ).toLowerCase();
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
    const handleViewVoucher = async (row: any) => {
        const voucherNumber = getVoucherNumber(row);
        const moduleName = getModuleName(row);

        const normalizedModule = moduleName
            .replaceAll(" ", "")
            .replaceAll("_", "")
            .replaceAll("-", "")
            .toLowerCase();

        const isReceipt =
            normalizedModule.includes("receipt") ||
            normalizedModule.includes("rec");

        const isSalesReturn =
            normalizedModule.includes("salesinvoicereturns") ||
            normalizedModule.includes("salesinvoicereturn") ||
            normalizedModule.includes("salesreturn") ||
            normalizedModule.includes("invoicereturn");

        const isSalesInvoice =
            !isSalesReturn &&
            !isReceipt &&
            (
                normalizedModule.includes("salesinvoice") ||
                normalizedModule.includes("invoice")
            );


        if (!voucherNumber) {
            console.log("Voucher number missing in ledger row:", row);
            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});

            /*
                ✅ RECEIPT
                API response fields:
                recVoucherNumber
                recVoucherDate
                recAccountCode
                recAccountName
                recBody
                recFooter
            */
            if (isReceipt) {
                setViewTitle("View Receipt");
                setViewBodyKey("recBody");

                await dispatch(getAllTransactionSchema("receipt") as any);

                const res = await dispatch(
                    getSalesReceiptList({
                        offset: 0,
                        limit: 10,
                        search: voucherNumber,
                        status: "",
                    }) as any
                ).unwrap();

                const records = getRecords(res);

                const record =
                    records.find(
                        (item: any) =>
                            item?.recVoucherNumber === voucherNumber ||
                            item?.voucherNumber === voucherNumber ||
                            item?.voucherNo === voucherNumber
                    ) || records[0];

                if (!record) {
                    console.log("Receipt not found:", voucherNumber, res);
                    setViewForm({});
                    return;
                }

                setViewForm(normalizeReceiptForView(record));
                return;
            }

            /*
                ✅ SALES RETURN
            */
            if (isSalesReturn) {
                setViewTitle("View Sales Return");
                setViewBodyKey("products");

                await dispatch(getAllTransactionSchema("salesReturn") as any);

                const res = await dispatch(
                    getAllSalesInvoiceReturn({
                        offset: 0,
                        limit: 10,
                        search: voucherNumber,
                        // status: "",
                    }) as any
                ).unwrap();

                const records = getRecords(res);

                const record =
                    records.find(
                        (item: any) =>
                            item?.sInvReturnVoucherNumber === voucherNumber ||
                            item?.voucherNumber === voucherNumber ||
                            item?.voucherNo === voucherNumber
                    ) || records[0];

                if (!record) {
                    console.log("Sales return not found:", voucherNumber, res);
                    setViewForm({});
                    return;
                }

                setViewForm(normalizeSalesReturnForView(record));
                return;
            }

            /*
                ✅ SALES INVOICE
            */
            if (isSalesInvoice) {
                setViewTitle("View Sales Invoice");
                setViewBodyKey("products");

                await dispatch(getAllTransactionSchema("salesInvoice") as any);

                const res = await dispatch(
                    getAllSalesInvoice({
                        offset: 0,
                        limit: 10,
                       
                        search: voucherNumber,
                        // status: "",
                    }) as any
                ).unwrap();

                const records = getRecords(res);

                const record =
                    records.find(
                        (item: any) =>
                            item?.sInvVoucherNumber === voucherNumber ||
                            item?.voucherNumber === voucherNumber ||
                            item?.voucherNo === voucherNumber
                    ) || records[0];

                if (!record) {
                    console.log("Sales invoice not found:", voucherNumber, res);
                    setViewForm({});
                    return;
                }

                setViewForm(normalizeInvoiceForView(record));
                return;
            }

            console.log("Unsupported account ledger module:", {
                row,
                moduleName,
                normalizedModule,
                voucherNumber,
            });

            setViewForm({});
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
        if (!account) return;

        try {
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
        }
    };

    const handleDownloadExcel = async () => {
        if (!account) return;

        try {
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
                    [&_*]:!text-sm
                    [&_h3]:!text-base
                    [&_h2]:!text-base
                    [&_p]:!text-sm
                    [&_label]:!text-xs
                    [&_button]:!h-10
                    [&_button]:!text-sm
                    [&_input]:!h-10
                    [&_input]:!text-sm
                    [&_select]:!h-10
                    [&_select]:!text-sm
                    [&_.text-xl]:!text-lg
                    [&_.text-lg]:!text-base
                    [&_.text-sm]:!text-xs
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
                            required: true,
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
                            required: true,
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
                            required: true,
                            colSpan: "full",
                        },
                    ]}
                    gridCols="2"
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadExcel={handleDownloadExcel}
                    downloadDisabled={!account || exportLoader}
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