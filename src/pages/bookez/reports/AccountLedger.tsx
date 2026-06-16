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

    const [fromDate, setFromDate] = useState("2026-06-15");
    const [toDate, setToDate] = useState("2026-06-15");
    const [account, setAccount] = useState("");

    // Account dropdown API - only once
    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                accountType: "customer",
            })
        );
    }, [dispatch]);

    // Account Ledger API - hit on date/account/pagination change
    useEffect(() => {
        dispatch(
            getAccountLedger({
                fromDate,
                toDate,
                accountCode: account,
                offset: localOffset,
                limit: localLimit,
                exportType: ""
            })
        );
    }, [dispatch, fromDate, toDate, account, localOffset, localLimit]);


    const handleDownloadPdf = () => {
        if (!account) return;

        dispatch(
            getAccountLedger({
                fromDate,
                toDate,
                accountCode: account,
                offset: localOffset,
                limit: localLimit,
                exportType: "pdf",
            })
        );
    };

    const handleDownloadExcel = () => {
        if (!account) return;

        dispatch(
            getAccountLedger({
                fromDate,
                toDate,
                accountCode: account,
                offset: localOffset,
                limit: localLimit,
                exportType: "excel",
            })
        );
    };

    const formatAmount = (amount: any, type: "Dr" | "Cr" = "Dr") => {
    return `₹${Number(amount || 0).toFixed(2)} ${type}`;
};

    const selectedAccountName =
        accountOptions.find((item: any) => item.value === account)?.label || "-";

    const summaryItems = [
        {
            label: "Opening Balance Net Total",
            value: formatAmount(
                totals?.openingBalanceNetTotal,
                totals?.openingBalanceNetType || "Dr"
            ),
        },
        {
            label: "Sales Invoice Total",
            value: formatAmount(
                totals?.salesInvoiceNetTotal,
                totals?.salesInvoiceType || "Dr"
            ),
        },
        {
            label: "Sales Return Total",
            value: formatAmount(
                totals?.salesReturnTotal,
                totals?.salesReturnType || "Cr"
            ),
        },
        {
            label: "Receipt Total",
            value: formatAmount(
                totals?.receiptNetTotal,
                totals?.receiptType || "Cr"
            ),
        },
    ];

    const remainingBalance = formatAmount(
        totals?.remainingBalance,
        totals?.remainingBalanceType || "Dr"
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
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                    onAccountChange={setAccount}
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadExcel={handleDownloadExcel}
                    downloadDisabled={!account}
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