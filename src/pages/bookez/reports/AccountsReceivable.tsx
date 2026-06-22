import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import { getAccountReceivable } from "../../../redux/slices/professionalSlice/ledgerReports/accountsReceivableSlice";
import ReportsOverviewCards from "./ReportsOverviewCards";

const mainColumns = [
    {
        key: "sInvCustomerName",
        title: "Customer Name",
    },
    {
        key: "sInvCustomerCode",
        title: "Customer Code",
    },
    {
        key: "totalBalanceAmount",
        title: "Total Amount",
        render: (row: any) => (
            <>₹{Number(row?.totalBalanceAmount || 0).toFixed(2)}</>
        ),
    },
];

const AccountsReceivable = () => {
    const dispatch = useDispatch<any>();

    const {
        accountReceivable,
        listingLoader,
        pagination,
        summary = {},
        count = 0,
    } = useSelector((s: any) => s.accountReceivable);

    // const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    useEffect(() => {
        dispatch(getAccountReceivable());
    }, [dispatch]);

    return (
        <>
            <div className="flex h-full w-full flex-col border border-border bg-card text-card-foreground p-4 shadow-sm">
                <ReportsOverviewCards
                    totalAmount={summary?.totalReceivableAmount}
                    customerCount={count}
                />

                <DataTable
                    columns={mainColumns}
                    data={accountReceivable}
                    loading={listingLoader}
                    emptyMessage="No data found"
                    showFieldSelector={false}
                />

                {pagination?.totalDocs > 0 && (
                    <Pagination
                        {...{
                            localLimit,
                            selectCb: (e: any) => {
                                setLocalLimit(Number(e.target.value));
                                // setLocalOffset(0);
                            },
                            preDisabled: !pagination.hasPrevPage,
                            nextDisabled: !pagination.hasNextPage,
                            // setLocalOffset,
                            pagination,
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default AccountsReceivable;