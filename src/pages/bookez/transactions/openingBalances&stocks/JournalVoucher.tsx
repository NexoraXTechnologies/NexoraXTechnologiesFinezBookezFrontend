
import { useState } from "react";
import Badge from "../../../../components/badge";
import { DataCreateButton } from "../../../../components/buttons";
import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import Toggle from "../../../../components/toggle";
import { useSelector } from "react-redux";


const mainColumns=[
    {


    }]

const JournalVoucher = () => {
  
    const[status,setStatus]=useState("")
    const[search,setSearch]=useState("")
    const[showModel,setShowModal]=useState(false)
    const[form,setForm]=useState(false)
    const[error,setErrors]=useState(false)
    // const[edit,setE]
    const{journalVouchers,pagination ,listingLoader}=useSelector((s:any)=>s.journalVoucher)


    const resetForm=()=>{

    }

    return (
        <>
            <div className="flex h-full w-full flex-col border border-gray-200 bg-white p-4 shadow-sm">
                <div id="account-header" className="flex flex-wrap items-center gap-2 mb-3">
                    <div id="account-summary" className="flex items-start gap-3">
                        <Badge {...{ count: pagination.totalDocs ?? 0, text: "Total Opening Balance:" }} />
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Toggle
                            {...{
                                arr: ["open", "close"],
                                state: status,
                                setState: setStatus,
                            }}
                        />

                        <div className="me-2">
                            <SearchInput {...{ search, setSearch }} />
                        </div>
                        <Permission module="bookez" permissionKey="openingBalance" action="create">
                            <DataCreateButton
                                {...{
                                    text: "Create Opening Balance",
                                    callBackFn: () => {
                                        resetForm();
                                        setShowModal(true);
                                    },
                                }}
                            />
                        </Permission>
                    </div>
                </div>
                <DataTable
                    columns={mainColumns}
                    data={journalVouchers}
                    loading={listingLoader}
                    emptyMessage="No data found"
                    actions={(item: any) => (
                        <div className="flex items-center gap-2">
                            <Permission module="bookez" permissionKey="openingBalance" action="update">
                                <button
                                    id="opening-balance-edit-button"
                                    onClick={() => {
                                        const body =
                                            item?.openingBalBody?.length > 0
                                                ? item.openingBalBody.map((row: any) => ({
                                                    id: row.id || Date.now() + Math.random(),
                                                    accountCode: row.accountCode || row.account || "",
                                                    account: row.accountCode || row.account || "",
                                                    accountName: row.accountName || "",
                                                    debit: row.debit || "",
                                                    credit: row.credit || "",
                                                    reference: row.reference || "",
                                                    remarks: row.remarks || "",
                                                }))
                                                : [
                                                    {
                                                        ...emptyEntryRow,
                                                        id: Date.now(),
                                                    },
                                                ];

                                        setForm({
                                            ...item,
                                            voucherno: item?.voucherno || item?.openingBalVoucherNumber || "OPBAL",
                                            openingBalDate: item?.openingBalDate || new Date().toISOString().split("T")[0],
                                            remark: item?.remark || "",
                                            openingBalBody: body,
                                        });

                                        setErrors({});
                                        setEdit(true);
                                        setShowModal(true);
                                    }}
                                    className="cursor-pointer rounded-lg p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                                >
                                    <Edit size={16} />
                                </button>
                            </Permission>
                            <Permission module="bookez" permissionKey="openingBalance" action="delete">
                                <button
                                    type="button"
                                    onClick={(e: any) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        let x: any = rect.left - 150;
                                        if (x < 10) x = 10;
                                        const y: any = rect.top + window.scrollY - 5;
                                        setConfirmTooltip({
                                            show: true,
                                            x,
                                            y,
                                            openingBalVoucherNumber: item.openingBalVoucherNumber,
                                        });
                                    }}
                                    className="text-red-500 hover:text-red-700">
                                    <Trash2 size={16} />
                                </button>
                            </Permission>
                        </div>
                    )}
                />

                {/* {pagination?.totalDocs > 0 && (
                    <Pagination
                        {...{
                            localLimit,
                            selectCb: (e: any) => {
                                setLocalLimit(Number(e.target.value));
                                setLocalOffset(0);
                            },
                            preDisabled: !pagination.hasPrevPage,
                            nextDisabled: !pagination.hasNextPage,
                            setLocalOffset,
                            pagination,
                        }}
                    />
                )} */}
            </div>

        </>
    )
}

export default JournalVoucher;