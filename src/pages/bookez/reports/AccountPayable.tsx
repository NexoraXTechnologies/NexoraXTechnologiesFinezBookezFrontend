import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import ReportsOverviewCards from "./components/ReportsOverviewCards";

import { getAccountPayable } from "../../../redux/slices/professionalSlice/ledgerReports/accountsPayableSlice";
import { IndianRupee, Users } from "lucide-react";

const mainColumns = [
    {
        key: "pInvVendorName",
        title: "Vendor Name",
    },
    {
        key: "pInvVendorCode",
        title: "Vendor Code",
    },
    {
        key: "totalBalanceAmount",
        title: "Total Amount",
        render: (row: any) => (
            <>₹{Number(row?.totalBalanceAmount || 0).toFixed(2)}</>
        ),
    },
];

const AccountPayable = () => {
    const dispatch = useDispatch<any>();

    const {
        accountPayable = [],
        listingLoader,
        pagination,
        summary = {},
        count,
    } = useSelector((s: any) => s.accountPayable);

    const [search, setSearch] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    useEffect(() => {
        dispatch(
            (getAccountPayable as any)({
                offset: localOffset,
                limit: localLimit,
                search,
            })
        );
    }, [dispatch, localOffset, localLimit, search]);

    const handleExport = async (exportType: "pdf" | "xlsx") => {
        try {
            if (exportType === "pdf") {
                setPdfLoading(true);
            } else {
                setExcelLoading(true);
            }

            await dispatch(
                (getAccountPayable as any)({
                    offset: localOffset,
                    limit: localLimit,
                    search,
                    exportType,
                })
            );
        } finally {
            setPdfLoading(false);
            setExcelLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
            <ReportsOverviewCards
                cards={[
                    {
                        title: "Total Payable Amount",
                        value: `₹${Number(summary?.totalPayableAmount || 0).toFixed(2)}`,
                        icon: <IndianRupee size={16} />,
                    },
                    {
                        title: "Total Vendors",
                        value: Number(count || 0),
                        icon: <Users size={16} />,
                    },
                ]}
                search={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setLocalOffset(0);
                }}
                onDownloadPdf={() => handleExport("pdf")}
                onDownloadExcel={() => handleExport("xlsx")}
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
            />

            <DataTable
                columns={mainColumns}
                data={accountPayable}
                loading={listingLoader}
                emptyMessage="No data found"
                showFieldSelector={false}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    }}
                    preDisabled={!pagination.hasPrevPage}
                    nextDisabled={!pagination.hasNextPage}
                    setLocalOffset={setLocalOffset}
                    pagination={pagination}
                />
            )}
        </div>
    );
};

export default AccountPayable;