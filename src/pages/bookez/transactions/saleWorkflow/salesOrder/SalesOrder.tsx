import { useState } from "react"
import Badge from "../../../../../components/badge"
import { DataCreateButton, DataREfreshButton } from "../../../../../components/buttons"
import SearchInput from "../../../../../components/searchInput"
import Toggle from "../../../../../components/toggle"
import DataTable from "../../../../../components/DataTable"
import { Edit, Trash2 } from "lucide-react"
import { useSelector } from "react-redux"

const SalesOrder = () => {

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const{salesOrder,loading}=useSelector((state:any)=>state.salesOrder)




    const columns=[
        {
        key:"sOrderVoucherNumber",
        title:"Voucher Number",
    },
    {
        key:"sOrderVoucherDate",
        title:"Voucher Date"
    },
    {
        key:"sOrderCustomerName",
        title:"Customer Name"
    },
    {
        key:"netAmount",
        title:"Net Amount"
    },
    {
        key:"sOrderStatus",
        title:"Status"
    }


]

    const handleRefresh = () => {
        setRefreshing(true);
    }



    const openAddModal = () => {

    }


    const openEditModal=(record=>{

    })
    return (

        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {/* ================= HEADER ================= */}
            <div id="sales-order-header" className="mb-3 flex items-center">
                <div id="sales-order-summary" className="flex items-start gap-3">
                    <Badge
                        {...{
                            // count: pagination?.totalDocs ?? 0,
                            text: "Total Sales Orders:",
                            varient: "primary",
                        }}
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        {...{
                            arr: ["open", "close"],
                            // state: status,
                            // setState: handleStatusChange,
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
                data={salesOrder}
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
                            // disabled={deleteLoading}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();

                                let x = rect.left - 150;
                                if (x < 10) x = 10;

                                const y = rect.top + window.scrollY - 5;

                                // setConfirmTooltip({
                                //     show: true,
                                //     x,
                                //     y,
                                //     voucherNumber: getVoucherNumber(record),
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

    )
}

export default SalesOrder;