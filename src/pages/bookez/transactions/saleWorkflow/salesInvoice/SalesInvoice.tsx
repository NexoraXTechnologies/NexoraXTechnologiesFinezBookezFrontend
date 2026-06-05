import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";

import DataTable from "../../../../../components/DataTable";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../../components/buttons";
import Toggle from "../../../../../components/toggle";
import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import { useDispatch, useSelector } from "react-redux";
import { getAllSalesInvoice } from "../../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";

const SalesInVoice = () => {
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");

    // Temporary data until API/Redux is connected
    const salesOrders: any[] = [];

    const dispatch = useDispatch<any>()

    const {
        salesInvoices = [],
        loading = false,
        pagination,
    } = useSelector((state: any) => state.salesInvoice);

    const fetchSalesInvoices = async () => {
        await dispatch(
            getAllSalesInvoice({
                offset: 0,
                limit: 200,
                search,
                status,
            })
        );
    };

    useEffect(() => {
        fetchSalesInvoices();
    }, [status]);

    const columns = [
        {
            key: "sInvVoucherNumber",
            title: "Voucher",
        },
        {
            key: "sInvCustomerName",
            title: "Customer",
        },
        {
            key: "sInvVoucherDate",
            title: "Date",
        },
        {
            key: "sInvStatus",
            title: "Status",
            render: (record: any) => (
                <Badge
                    text={record?.sInvStatus || "-"}
                    varient={record?.sInvStatus === "close" ? "success" : "warning"}
                />
            ),
        },
        {
            key: "netAmount",
            title: "Net Amount",
            render: (record: any) => (
                <span className="font-semibold text-slate-800">
                    ₹{record?.sInvFooter?.netAmount ?? 0}
                </span>
            ),
        },
    ];

    const handleRefresh = () => {
        setRefreshing(true);

        // API call / dispatch will come here
        setTimeout(() => {
            setRefreshing(false);
        }, 300);
    };

    const openAddModal = () => {
        console.log("Open Add Sales Invoice Modal");
    };

    const openEditModal = (record: any) => {
        console.log("Edit Sales Invoice:", record);
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <div id="sales-invoice-header" className="mb-3 flex items-center">
                <div id="sales-invoice-summary" className="flex items-start gap-3">
                    <Badge
                        count={salesOrders.length}
                        text="Total Sales Invoices:"
                        varient="primary"
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle arr={["open", "close"]} state={status} setState={setStatus} />

                    <SearchInput search={search} setSearch={setSearch} />

                    <DataREfreshButton callBackFn={handleRefresh} loading={refreshing} />

                    <DataCreateButton
                        callBackFn={openAddModal}
                        text="Add Sales Invoice"
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={salesInvoices}
                loading={loading}
                emptyMessage={`No ${status} sales invoices found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() => console.log("Delete Sales Invoice:", record)}
                            className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            />
        </div>
    );
};

export default SalesInVoice;