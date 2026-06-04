import { useEffect, useState } from "react";
import Badge from "../../../../../components/badge";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../../components/buttons";
import SearchInput from "../../../../../components/searchInput";
import Toggle from "../../../../../components/toggle";
import DataTable from "../../../../../components/DataTable";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getAllSalesOrder } from "../../../../../redux/slices/professionalSlice/salesOrderSlice";

const SalesOrder = () => {
    const dispatch = useDispatch<any>();

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState<"open" | "close">("open");

    const { salesOrders, loading, pagination } = useSelector(
        (state: any) => state.salesOrder
    );

    useEffect(() => {
        dispatch(
            getAllSalesOrder({
                limit: 10,
                offset: 0,
                search: "",
                status,
            })
        );
    }, [dispatch, status]);

    const columns = [
        {
            key: "sOrderVoucherNumber",
            title: "Voucher Number",
        },
        {
            key: "sOrderVoucherDate",
            title: "Voucher Date",
            render: (row: any) => (
                <span>
                    {row?.sOrderVoucherDate
                        ? new Date(row.sOrderVoucherDate).toLocaleDateString("en-IN")
                        : "-"}
                </span>
            ),
        },
       
        {
            key: "sOrderCustomerName",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">
                        {row?.sOrderCustomerName || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                        {row?.sOrderCustomerCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "netAmount",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-slate-900">
                    ₹{Number(row?.sOrderFooter?.netAmount ?? 0).toFixed(2)}
                </span>
            ),
        },
        {
            key: "sOrderStatus",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${row?.sOrderStatus === "close"
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                        }`}
                >
                    {row?.sOrderStatus || "-"}
                </span>
            ),
        },
    ];

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await dispatch(
                getAllSalesOrder({
                    limit: 10,
                    offset: 0,
                    search,
                    status,
                })
            );
        } finally {
            setRefreshing(false);
        }
    };

    const openAddModal = () => {
        // Add sales order logic here
    };

    const openEditModal = (record: any) => {
        console.log("Edit Sales Order:", record);
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {/* ================= HEADER ================= */}
            <div id="sales-order-header" className="mb-3 flex items-center">
                <div id="sales-order-summary" className="flex items-start gap-3">
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? salesOrders?.length ?? 0,
                            text: "Total Sales Orders:",
                            varient: "primary",
                        }}
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        {...{
                            arr: ["open", "close"],
                            state: status,
                            setState: setStatus,
                        }}
                    />

                    <SearchInput {...{ search, setSearch }} />

                    <DataREfreshButton
                        {...{
                            callBackFn: handleRefresh,
                            loading: refreshing,
                        }}
                    />

                    <DataCreateButton
                        {...{
                            callBackFn: openAddModal,
                            text: "Add Sales Order",
                        }}
                    />
                </div>
            </div>

            {/* ================= LIST ================= */}
            <DataTable
                columns={columns}
                data={salesOrders}
                loading={loading}
                emptyMessage={`No ${status} sales Orders found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="sales-order-edit-button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            id="sales-order-delete-button"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();

                                let x = rect.left - 150;
                                if (x < 10) x = 10;

                                const y = rect.top + window.scrollY - 5;

                                console.log("Delete tooltip position:", {
                                    x,
                                    y,
                                    record,
                                });

                                // setConfirmTooltip({
                                //     show: true,
                                //     x,
                                //     y,
                                //     voucherNumber: record?.sOrderVoucherNumber,
                                // });
                            }}
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

export default SalesOrder;