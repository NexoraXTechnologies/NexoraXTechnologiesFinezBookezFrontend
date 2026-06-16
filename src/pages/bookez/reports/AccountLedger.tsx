import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import ReportFilterCard from "./ReportFilterCard";
import AccountSummaryCard from "./AccountSummaryCard";

import { getAccountLedger } from "../../../redux/slices/professionalSlice/ledgerReports/accountLedgerSlice";
import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";

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
        key: "remark",
        title: "Remark",
        render: (row: any) => (
            <span className="text-slate-700">
                {row?.remark || "-"}
            </span>
        ),
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

    const accountOptions = useMemo(() => {
        return (accounts || []).map((item: any) => ({
            label: item?.accountName || "",
            value: item?.accountCode || "",
        }));
    }, [accounts]);

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
const todayDate = new Date().toISOString().split("T")[0];
    const [fromDate, setFromDate] = useState(todayDate);
    const [toDate, setToDate] = useState(todayDate);
    const [account, setAccount] = useState("");

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

    const downloadBlobFile = (
        blob: Blob,
        fileName: string
    ) => {
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
                    fromDate={fromDate}
                    toDate={toDate}
                    accountValue={account}
                    accountOptions={accountOptions}
                    onFromDateChange={(value: string) => {
                        setFromDate(value);
                        setLocalOffset(0);
                    }}
                    onToDateChange={(value: string) => {
                        setToDate(value);
                        setLocalOffset(0);
                    }}
                    onAccountChange={(value: string) => {
                        setAccount(value);
                        setLocalOffset(0);
                    }}
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadExcel={handleDownloadExcel}
                    downloadDisabled={!account || exportLoader}
                />

                <AccountSummaryCard
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
        </div>
    );
};

export default AccountLedger;