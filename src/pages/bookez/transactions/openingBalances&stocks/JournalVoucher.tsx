
// import { useEffect, useMemo, useState } from "react";
// import Badge from "../../../../components/badge";
// import { DataCreateButton } from "../../../../components/buttons";
// import DataTable from "../../../../components/DataTable";
// import Permission from "../../../../components/PermissionGuard";
// import SearchInput from "../../../../components/searchInput";
// import Toggle from "../../../../components/toggle";
// import { useDispatch, useSelector } from "react-redux";
// import { Edit, Trash2 } from "lucide-react";
// import Pagination from "../../../../components/pagination";
// import { getJournalVoucherList } from "../../../../redux/slices/professionalSlice/openingBalancesStocks/journalVoucherSlice";
// import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
// import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";

// const emptyEntryRow = {

//     accountCode: "",
//     account: "",
//     accountName: "",
//     debit: "",
//     credit: "",

// };

// const mainColumns = [
//     {
//         key: "voucherNumber",
//         title: "Voucher",
//     },
//     {
//         key: "voucherDate",
//         title: "Date",
//         type: "date",
//         render: (row: any) => row?.voucherDate || row?.createdOn || "-",
//     },
//     {
//         key: "referenceNumber",
//         title: "Reference",

//     },
//     {
//         key: "totalDebit",
//         title: "Total Debit",
//         render: (row: any) => (
//             <>₹{Number(row?.totalDebit || 0).toFixed(2)}</>
//         ),
//     },
//     {
//         key: "totalCredit",
//         title: "Total Credit",
//         render: (row: any) => (
//             <>₹{Number(row?.totalCredit || 0).toFixed(2)}</>
//         ),
//     },
//     {
//         key: "status",
//         title: "Status",
//     },
// ];




// const JournalVoucher = () => {

//     const [status, setStatus] = useState("")
//     const [search, setSearch] = useState("")
//     const [showModal, setShowModal] = useState(false)
//     const [form, setForm] = useState(false)
//     const [errors, setErrors] = useState(false)
//     const [edit, setEdit] = useState(false)
//     const [localLimit, setLocalLimit] = useState(10)
//     const [localOffset, setLocalOffset] = useState(0)
//     const [confirmTooltip, setConfirmTooltip] = useState(false)
//     const dispatch = useDispatch<any>()
//     const { journalVouchers, pagination, listingLoader, addLoader } = useSelector((s: any) => s.journalVoucher)
//     const { accounts } = useSelector((s: any) => s.accountMaster)

//     const accountOptions = useMemo(() => {
//         return (
//             accounts?.map((item: any) => ({
//                 label: item.accountName,
//                 value: item.accountCode
//             })) || []
//         )
//     }, [accounts])


//     const inputData = {
//         headers: [
//             {
//                 key: "voucherno",
//                 label: "Voucher No",
//                 type: "text",
//                 disabled: true,
//             },
//             {
//                 key: "voucherDate",
//                 label: "Date",
//                 type: "date",
//                 disabled: false,
//             },
//             {
//                 key: "status",
//                 label: "Satus",
//                 type: "text",
//                 disabled: false,
//             },
//             {
//                 key: "referenceNumber",
//                 label: "Reference Number",
//                 type: "text",
//                 disabled: false,
//             },
//             {
//                 key: "remark",
//                 label: "Remark",
//                 type: "textarea",
//                 required: false,
//                 placeholder: "Enter Remark",
//                 colSpan: "full",
//             },
//         ],

//         body: [
//             {
//                 key: "accountCode",
//                 title: "Account",
//                 type: "select",
//                 width: "260px",
//                 required: true,
//                 options: accountOptions,
//             },
//             {
//                 key: "debit",
//                 title: "Debit",
//                 type: "number",
//                 width: "150px",
//                 align: "right",
//             },
//             {
//                 key: "credit",
//                 title: "Credit",
//                 type: "number",
//                 width: "150px",
//                 align: "right",
//             },
//         ],

//         footer: [
//              {
//                 key: "debit",
//                 title: "Total Debit",
//                 type: "number",
//                 width: "150px",
//                 align: "right",
//             },
//         ]
//     }

//     useEffect(() => {
//         dispatch(getAllAccounts({
//             limit: localLimit,
//             offset: localOffset
//         }))
//         dispatch(getJournalVoucherList({
//             limit: localLimit,
//             offset: localOffset
//         }))
//     }, [dispatch])

//     const resetForm = () => {

//     }


//     const handleSubmit = () => {

//     }

//     const handleAddRow = () => {

//     }

//     const handleDeleteRow = () => {

//     }

//     const handleRowChange = () => {

//     }

//     const handleChange = () => {

//     }

//     return (
//         <>
//             <div className="flex h-full w-full flex-col border border-gray-200 bg-white p-4 shadow-sm">
//                 <div id="account-header" className="flex flex-wrap items-center gap-2 mb-3">
//                     <div id="account-summary" className="flex items-start gap-3">
//                         <Badge {...{ count: pagination.totalDocs ?? 0, text: "Total Journal Voucher:" }} />
//                     </div>
//                     <div className="ml-auto flex flex-wrap items-center gap-2">
//                         <Toggle
//                             {...{
//                                 arr: ["open", "close"],
//                                 state: status,
//                                 setState: setStatus,
//                             }}
//                         />

//                         <div className="me-2">
//                             <SearchInput {...{ search, setSearch }} />
//                         </div>
//                         <Permission module="bookez" permissionKey="journalVouchar" action="create">
//                             <DataCreateButton
//                                 {...{
//                                     text: "Create Journal Voucher",
//                                     callBackFn: () => {
//                                         resetForm();
//                                         setShowModal(true);
//                                     },
//                                 }}
//                             />
//                         </Permission>
//                     </div>
//                 </div>
//                 <DataTable
//                     columns={mainColumns}
//                     data={journalVouchers}
//                     loading={listingLoader}
//                     emptyMessage="No data found"
//                     actions={(item: any) => (
//                         <div className="flex items-center gap-2">
//                             <Permission module="bookez" permissionKey="journalVouchar" action="update">
//                                 <button
//                                     id="journal-voucher-edit-button"
//                                     onClick={() => {
//                                         const body =
//                                             item?.entries?.length > 0
//                                                 ? item.entries.map((row: any) => ({
//                                                     id: row.id || Date.now() + Math.random(),
//                                                     accountCode: row.accountCode || row.account || "",
//                                                     account: row.accountCode || row.account || "",
//                                                     accountName: row.accountName || "",
//                                                     debit: row.debit || "",
//                                                     credit: row.credit || "",
//                                                     reference: row.reference || "",
//                                                     remarks: row.remarks || "",
//                                                 }))
//                                                 : [
//                                                     {
//                                                         ...emptyEntryRow,
//                                                         id: Date.now(),
//                                                     },
//                                                 ];

//                                         setForm({
//                                             ...item,
//                                             voucherno: item?.voucherno || item?.voucherNumber || "JNV",
//                                             voucherDate: item?.voucherDate || new Date().toISOString().split("T")[0],
//                                             remark: item?.remark || "",
//                                             entries: body,
//                                         });

//                                         setErrors(true);
//                                         setEdit(true);
//                                         setShowModal(true);
//                                     }}
//                                     className="cursor-pointer rounded-lg p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
//                                 >
//                                     <Edit size={16} />
//                                 </button>
//                             </Permission>
//                             <Permission module="bookez" permissionKey="journalVouchar" action="delete">
//                                 <button
//                                     type="button"
//                                     onClick={(e: any) => {
//                                         const rect = e.currentTarget.getBoundingClientRect();
//                                         let x: any = rect.left - 150;
//                                         if (x < 10) x = 10;
//                                         const y: any = rect.top + window.scrollY - 5;
//                                         setConfirmTooltip({
//                                             show: true,
//                                             x,
//                                             y,
//                                             voucherNumber: item.voucherNumber,
//                                         });
//                                     }}
//                                     className="text-red-500 hover:text-red-700">
//                                     <Trash2 size={16} />
//                                 </button>
//                             </Permission>
//                         </div>
//                     )}
//                 />

//                 {pagination?.totalDocs > 0 && (
//                     <Pagination
//                         {...{
//                             localLimit,
//                             selectCb: (e: any) => {
//                                 setLocalLimit(Number(e.target.value));
//                                 setLocalOffset(0);
//                             },
//                             preDisabled: !pagination.hasPrevPage,
//                             nextDisabled: !pagination.hasNextPage,
//                             setLocalOffset,
//                             pagination,
//                         }}
//                     />
//                 )}


//                 <DynamicAddForm
//                     show={showModal}
//                     setShow={setShowModal}
//                     edit={edit}
//                     title="Journal voucher"
//                     subtitle="Fill in the opening balance details below"
//                     loading={addLoader}
//                     onClose={() => {
//                         setShowModal(false);
//                         resetForm();
//                     }}
//                     onSubmit={handleSubmit}
//                     form={form}
//                     errors={errors}
//                     handleAddRow={handleAddRow}
//                     handleDeleteRow={handleDeleteRow}
//                     handleRowChange={handleRowChange}
//                     inputData={inputData}
//                     bodyKey="entries"
//                     handleChange={handleChange}
//                 />
//             </div>

//         </>
//     )
// }

// export default JournalVoucher;