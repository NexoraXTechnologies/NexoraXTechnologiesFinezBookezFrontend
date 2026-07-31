// import { useEffect, useMemo, useState } from "react";
// import { ArrowLeft, Ban, CalendarClock, Download, Edit, Eye, Loader2, MoreVertical, XCircle, } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";


// import DataTable from "../../../../components/DataTable";
// import Permission from "../../../../components/PermissionGuard";
// import SearchInput from "../../../../components/searchInput";
// import {
//     DataREfreshButton,
// } from "../../../../components/buttons";
// import Badge from "../../../../components/badge";
// import Pagination from "../../../../components/pagination";
// import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

// import { useLocation, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";

// import {
//     cancelEWayBill,
//     extendEWayBillValidity,
//     getAllEWayBill,
//     getEWayBillAccessToken,
//     getEWayBillFromGst,
//     printDetailEWayBill,
//     rejectEWayBill,

// } from "../../../../redux/slices/professionalSlice/transportation/eWayBillSlice";

// /* ===================================================
//    E-WAY BILL LIST
// =================================================== */

// const unwrapThunk = async (
//     dispatch: any,
//     action: any
// ) => {
//     const result = await dispatch(action);

//     if (typeof result?.unwrap === "function") {
//         return result.unwrap();
//     }

//     if (result?.error) {
//         throw result.error;
//     }

//     return result?.payload ?? result;
// };


// const EWayBillList = () => {
//     const dispatch = useDispatch<any>();
//     const location = useLocation();
//     const navigate = useNavigate();

//     const {
//         eWayBill = [],
//         pagination = {},
//         listingLoader = false,

//     } = useSelector((state: any) => state.eWayBill);

//     const [search, setSearch] = useState("");

//     const [refreshing, setRefreshing] = useState(false);

//     const [localOffset, setLocalOffset] = useState(0);

//     const [localLimit, setLocalLimit] = useState(20);

//     const [activeStatus, setActiveStatus] = useState<
//         "open" | "close"
//     >("open");

//     const [confirmTooltip, setConfirmTooltip] = useState<any>({
//         show: false,
//         x: null,
//         y: null,
//         ewayBillNumber: null,
//     });

//     // ⭐ YELLOW STAR: ADDED — ROW ACTION MENU
//     const [openActionMenu, setOpenActionMenu] =
//         useState<string>("");

//     // ⭐ YELLOW STAR: ADDED — ACTION CONFIRMATION MODAL
//     const [ewayActionConfirm, setEwayActionConfirm] =
//         useState<any>({
//             show: false,
//             action: "",
//             record: null,
//         });

//     // ⭐ YELLOW STAR: ADDED — ACTION AND DOWNLOAD LOADER
//     const [ewayActionLoading, setEwayActionLoading] =
//         useState(false);

//     const [ewayDownloadLoading, setEwayDownloadLoading] =
//         useState<string>("");
//     // ⭐ YELLOW STAR: ADDED — ACTION API BODY
//     const [ewayActionPayload, setEwayActionPayload] =
//         useState<any>({});

//     // ⭐ YELLOW STAR: ADDED — ACTION REMARK
//     const [ewayActionRemark, setEwayActionRemark] =
//         useState("");
//     const pageTitle =
//         location.state?.title || "E-Way Bill";

//     const fetchEWayBills = ({
//         offset = localOffset,
//         limit = localLimit,
//         searchValue = search,
//     }: any = {}) => {
//         dispatch(
//             getAllEWayBill({
//                 limit,
//                 offset,
//                 search: searchValue,
//             })
//         );
//     };

//     const normalizeStatus = (value: any) =>
//         String(value || "active")
//             .trim()
//             .toLowerCase()
//             .replace(/[\s-]+/g, "_");

//     const getRowStatus = (row: any) =>
//         normalizeStatus(
//             row?.ewayBillStatus ||
//             row?.docStatus ||
//             row?.status ||
//             "active"
//         );

//     const isClosedEWayBill = (row: any) => {
//         const status = getRowStatus(row);

//         return (
//             status === "close" ||
//             status === "closed" ||
//             status === "cancelled" ||
//             status === "inactive"
//         );
//     };

//     const openCount = useMemo(
//         () =>
//             eWayBill.filter(
//                 (item: any) =>
//                     !isClosedEWayBill(item)
//             ).length,
//         [eWayBill]
//     );

//     const closeCount = useMemo(
//         () =>
//             eWayBill.filter((item: any) =>
//                 isClosedEWayBill(item)
//             ).length,
//         [eWayBill]
//     );

//     const filteredEWayBills = useMemo(() => {
//         return eWayBill.filter((item: any) => {
//             const closed =
//                 isClosedEWayBill(item);

//             if (
//                 activeStatus === "open" &&
//                 closed
//             )
//                 return false;

//             if (
//                 activeStatus === "close" &&
//                 !closed
//             )
//                 return false;

//             return true;
//         });
//     }, [eWayBill, activeStatus]);


//     const openEWayBillActionConfirm = (
//         action: "cancel" | "reject" | "extendValidity",
//         record: any
//     ) => {
//         setOpenActionMenu("");
//         setEwayActionRemark("");

//         const initialPayload =
//             action === "cancel"
//                 ? record?.cancelPayload || {}
//                 : action === "reject"
//                     ? record?.rejectPayload || {}
//                     : record?.extendValidityPayload || {};

//         setEwayActionPayload(initialPayload);

//         setEwayActionConfirm({
//             show: true,
//             action,
//             record,
//         });
//     };

//     const closeEWayBillActionConfirm = () => {
//         if (ewayActionLoading) return;

//         setEwayActionConfirm({
//             show: false,
//             action: "",
//             record: null,
//         });

//         setEwayActionPayload({});
//         setEwayActionRemark("");
//     };

//     const getActionTitle = () => {
//         switch (ewayActionConfirm.action) {
//             case "cancel":
//                 return "Cancel E-Way Bill";

//             case "reject":
//                 return "Reject E-Way Bill";

//             case "extendValidity":
//                 return "Extend E-Way Bill Validity";

//             default:
//                 return "Confirm Action";
//         }
//     };

//     const getActionMessage = () => {
//         const ewayBillNo =
//             ewayActionConfirm.record?.ewayBillNo ||
//             "";

//         switch (ewayActionConfirm.action) {
//             case "cancel":
//                 return `Are you sure you want to cancel E-Way Bill ${ewayBillNo}?`;

//             case "reject":
//                 return `Are you sure you want to reject E-Way Bill ${ewayBillNo}?`;

//             case "extendValidity":
//                 return `Are you sure you want to extend the validity of E-Way Bill ${ewayBillNo}?`;

//             default:
//                 return "Are you sure you want to continue?";
//         }
//     };

//     /* ===================================================
//    FETCH DATA
// =================================================== */

//     useEffect(() => {
//         fetchEWayBills();
//     }, [dispatch, localOffset, localLimit]);

//     /* ===================================================
//        SEARCH
//     =================================================== */

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             setLocalOffset(0);

//             dispatch(
//                 getAllEWayBill({
//                     limit: localLimit,
//                     offset: 0,
//                     search,
//                 })
//             );
//         }, 400);

//         return () => clearTimeout(timer);
//     }, [search, dispatch, localLimit]);

//     /* ===================================================
//        REFRESH
//     =================================================== */

//     const handleRefresh = () => {
//         setRefreshing(true);

//         dispatch(
//             getAllEWayBill({
//                 limit: localLimit,
//                 offset: localOffset,
//                 search,
//             })
//         ).finally(() => {
//             setRefreshing(false);
//         });
//     };



//     /* ===================================================
//        EDIT
//     =================================================== */


//     const handleEditEWayBill = (record: any) => {
//         if (!record?.ewayBillNo) {
//             toast.warn("E-Way Bill Number not found");
//             return;
//         }

//         navigate(
//             `/bookEz/transportation/e-way-bill/edit/${record.ewayBillNo}`,
//             {
//                 state: {
//                     title: "Edit E-Way Bill",
//                     description: "Update E-Way Bill details.",
//                     mode: "edit",
//                     ewayBillNo: record.ewayBillNo,
//                     ewayBillData: record,
//                 },
//             }
//         );
//     };

//     const handleDownload = async (record: any) => {
//         const ewayBillNo = String(
//             record?.ewayBillNo || ""
//         ).trim();

//         if (!ewayBillNo) {
//             toast.warn("E-Way Bill not found");
//             return;
//         }

//         try {
//             setEwayDownloadLoading(ewayBillNo);

//             // ⭐ YELLOW STAR: GET FRESH GST ACCESS TOKEN
//             const tokenResult = await unwrapThunk(
//                 dispatch,
//                 getEWayBillAccessToken()
//             );

//             const gstAuthToken = String(
//                 tokenResult?.authtoken ||
//                 tokenResult?.data?.authtoken ||
//                 tokenResult?.data?.data?.authtoken ||
//                 ""
//             ).trim();

//             if (!gstAuthToken) {
//                 throw new Error(
//                     "E-Way Bill access token was not received"
//                 );
//             }

//             // ⭐ YELLOW STAR: GET COMPLETE E-WAY BILL
//             const detailsResult = await unwrapThunk(
//                 dispatch,
//                 getEWayBillFromGst({
//                     authtoken: gstAuthToken,
//                     ewbNo: ewayBillNo,
//                 })
//             );

//             const ewayBillDetails =
//                 detailsResult?.data?.data ||
//                 detailsResult?.data ||
//                 detailsResult;

//             if (!ewayBillDetails) {
//                 throw new Error(
//                     "E-Way Bill details were not received"
//                 );
//             }

//             // ⭐ YELLOW STAR: GENERATE PDF
//             const pdfBlob = await unwrapThunk(
//                 dispatch,
//                 printDetailEWayBill({
//                     payload: ewayBillDetails,
//                 })
//             );

//             if (!(pdfBlob instanceof Blob)) {
//                 throw new Error(
//                     "Invalid E-Way Bill PDF response"
//                 );
//             }

//             const objectUrl =
//                 URL.createObjectURL(pdfBlob);

//             const link =
//                 document.createElement("a");

//             link.href = objectUrl;

//             link.download =
//                 `EWayBill_${ewayBillNo.replace(
//                     /[^a-zA-Z0-9_-]/g,
//                     ""
//                 )}.pdf`;

//             document.body.appendChild(link);
//             link.click();
//             link.remove();

//             setTimeout(() => {
//                 URL.revokeObjectURL(objectUrl);
//             }, 1000);
//         } catch (error: any) {
//             toast.error(
//                 error?.message ||
//                 error?.data?.message ||
//                 error?.payload?.message ||
//                 "Unable to download E-Way Bill"
//             );
//         } finally {
//             setEwayDownloadLoading("");
//         }
//     };


//     const handleDeleteConfirm = async () => {
//         try {
//             if (!confirmTooltip?.ewayBillNumber) {
//                 toast.warn("E-Way Bill Number not found");
//                 return;
//             }

//             // await dispatch(
//             //     deleteEWayBill(confirmTooltip.ewayBillNumber)
//             // ).unwrap();

//             toast.success("E-Way Bill deleted successfully.");

//             setConfirmTooltip({
//                 show: false,
//                 x: null,
//                 y: null,
//                 ewayBillNumber: null,
//             });

//             fetchEWayBills();
//         } catch (error: any) {
//             toast.error(
//                 error?.message ||
//                 "Failed to delete E-Way Bill."
//             );
//         }
//     };


//     const handleConfirmEWayBillAction = async () => {
//         const record =
//             ewayActionConfirm.record;

//         const ewayBillNo = String(
//             record?.ewayBillNo || ""
//         ).trim();

//         if (!ewayBillNo) {
//             toast.warn(
//                 "E-Way Bill number not found"
//             );

//             return;
//         }

//         try {
//             setEwayActionLoading(true);

//             /* ===================================================
//                STEP 1: GET FRESH GST ACCESS TOKEN
//             =================================================== */

//             const tokenResult = await unwrapThunk(
//                 dispatch,
//                 getEWayBillAccessToken()
//             );

//             const gstAuthToken = String(
//                 tokenResult?.authtoken ||
//                 tokenResult?.data?.authtoken ||
//                 tokenResult?.data?.data?.authtoken ||
//                 ""
//             ).trim();

//             if (!gstAuthToken) {
//                 throw new Error(
//                     "E-Way Bill access token was not received"
//                 );
//             }

//             /* ===================================================
//                STEP 2: PREPARE ACTION BODY
//             =================================================== */

//             const requestPayload = {
//                 ...ewayActionPayload,

//                 // Keep an existing body E-Way Bill number unchanged.
//                 ewbNo:
//                     ewayActionPayload?.ewbNo ??
//                     ewayActionPayload?.ewayBillNo ??
//                     ewayBillNo,

//                 // Add remark only when entered.
//                 ...(ewayActionRemark.trim()
//                     ? {
//                         remarks:
//                             ewayActionRemark.trim(),
//                     }
//                     : {}),
//             };

//             let result: any = null;

//             /* ===================================================
//                STEP 3: CALL SELECTED ACTION API
//             =================================================== */

//             if (
//                 ewayActionConfirm.action ===
//                 "cancel"
//             ) {
//                 result = await unwrapThunk(
//                     dispatch,
//                     cancelEWayBill({
//                         authtoken:
//                             gstAuthToken,

//                         payload:
//                             requestPayload,
//                     })
//                 );
//             } else if (
//                 ewayActionConfirm.action ===
//                 "reject"
//             ) {
//                 result = await unwrapThunk(
//                     dispatch,
//                     rejectEWayBill({
//                         authtoken:
//                             gstAuthToken,

//                         payload:
//                             requestPayload,
//                     })
//                 );
//             } else if (
//                 ewayActionConfirm.action ===
//                 "extendValidity"
//             ) {
//                 result = await unwrapThunk(
//                     dispatch,
//                     extendEWayBillValidity({
//                         authtoken:
//                             gstAuthToken,

//                         payload:
//                             requestPayload,
//                     })
//                 );
//             } else {
//                 throw new Error(
//                     "Invalid E-Way Bill action"
//                 );
//             }

//             const resultData =
//                 result?.data?.data ||
//                 result?.data ||
//                 result ||
//                 {};

//             const apiMessage =
//                 result?.message ||
//                 resultData?.message ||
//                 resultData?.status_desc ||
//                 resultData?.statusDesc ||
//                 "";

//             if (
//                 ewayActionConfirm.action ===
//                 "cancel"
//             ) {
//                 toast.success(
//                     apiMessage ||
//                     "E-Way Bill cancelled successfully."
//                 );
//             } else if (
//                 ewayActionConfirm.action ===
//                 "reject"
//             ) {
//                 toast.success(
//                     apiMessage ||
//                     "E-Way Bill rejected successfully."
//                 );
//             } else {
//                 toast.success(
//                     apiMessage ||
//                     "E-Way Bill validity extended successfully."
//                 );
//             }

//             setEwayActionConfirm({
//                 show: false,
//                 action: "",
//                 record: null,
//             });

//             setEwayActionPayload({});
//             setEwayActionRemark("");

//             await dispatch(
//                 getAllEWayBill({
//                     limit:
//                         localLimit,

//                     offset:
//                         localOffset,

//                     search,
//                 })
//             );
//         } catch (error: any) {
//             toast.error(
//                 error?.message ||
//                 error?.data?.message ||
//                 error?.payload?.message ||
//                 `Failed to ${getActionTitle().toLowerCase()}`
//             );
//         } finally {
//             setEwayActionLoading(false);
//         }
//     };

//     /* ===================================================
//        TABLE COLUMNS
//     =================================================== */


//     const columns = [
//         {
//             key: "ewayBillNo",
//             title: "E-Way Bill No",
//             render: (row: any) => row?.ewayBillNo || "-",
//         },

//         {
//             key: "docNo",
//             title: "Invoice No",
//             render: (row: any) =>
//                 row?.ewayPayload?.docNo || "-",
//         },

//         // {
//         //     key: "docDate",
//         //     title: "Invoice Date",
//         //     render: (row: any) =>
//         //         row?.ewayPayload?.docDate || "-",
//         // },

//         {
//             key: "ewayBillDate",
//             title: "E-Way Bill Date",
//             render: (row: any) =>
//                 row?.rawResponse?.ewayBillDate || "-",
//         },

//         {
//             key: "from",
//             title: "From Party",
//             render: (row: any) => (
//                 <div>
//                     <div className="font-medium">
//                         {row?.ewayPayload?.fromTrdName || "-"}
//                     </div>

//                     <div className="text-xs text-muted-foreground">
//                         {row?.ewayPayload?.fromGstin || "-"}
//                     </div>
//                 </div>
//             ),
//         },

//         {
//             key: "to",
//             title: "To Party",
//             render: (row: any) => (
//                 <div>
//                     <div className="font-medium">
//                         {row?.ewayPayload?.toTrdName || "-"}
//                     </div>

//                     <div className="text-xs text-muted-foreground">
//                         {row?.ewayPayload?.toGstin || "-"}
//                     </div>
//                 </div>
//             ),
//         },

//         {
//             key: "vehicle",
//             title: "Vehicle No",
//             render: (row: any) =>
//                 row?.ewayPayload?.vehicleNo || "-",
//         },

//         {
//             key: "distance",
//             title: "Distance",
//             render: (row: any) =>
//                 row?.ewayPayload?.transDistance
//                     ? `${row.ewayPayload.transDistance} KM`
//                     : "-",
//         },

//         // {
//         //     key: "transportMode",
//         //     title: "Mode",
//         //     render: (row: any) => {
//         //         const mode = row?.ewayPayload?.transMode;

//         //         switch (mode) {
//         //             case "1":
//         //                 return "Road";
//         //             case "2":
//         //                 return "Rail";
//         //             case "3":
//         //                 return "Air";
//         //             case "4":
//         //                 return "Ship";
//         //             default:
//         //                 return "-";
//         //         }
//         //     },
//         // },

//         // {
//         //     key: "invoiceValue",
//         //     title: "Invoice Value",
//         //     render: (row: any) =>
//         //         row?.ewayPayload?.totInvValue ?? "-",
//         // },

//         {
//             key: "validUpto",
//             title: "Valid Upto",
//             render: (row: any) =>
//                 row?.rawResponse?.validUpto || "-",
//         },
//     ];




//     return (
//         <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">

//             {/* ========================= Header ========================= */}

//             <div
//                 id="eway-bill-header"
//                 className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
//             >
//                 <div
//                     id="eway-bill-summary"
//                     className="flex items-center"
//                 >
//                     <button
//                         type="button"
//                         onClick={() => navigate(-1)}
//                         className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
//                         title="Go Back"
//                     >
//                         <ArrowLeft size={18} />
//                     </button>

//                     <div>
//                         <h1 className="truncate text-lg font-bold text-card-foreground">
//                             {pageTitle}
//                         </h1>
//                     </div>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">

//                     <Badge
//                         {...{
//                             count:
//                                 pagination?.totalDocs ??
//                                 pagination?.totalRecords ??
//                                 eWayBill.length ??
//                                 0,
//                             text: "Total E-Way Bills:",
//                             varient: "primary",
//                         }}
//                     />

//                     <div className="flex rounded-md border border-border bg-background p-1">

//                         <button
//                             type="button"
//                             onClick={() => setActiveStatus("open")}
//                             className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "open"
//                                 ? "bg-primary text-primary-foreground"
//                                 : "text-muted-foreground hover:bg-muted"
//                                 }`}
//                         >
//                             Open ({openCount})
//                         </button>

//                         <button
//                             type="button"
//                             onClick={() => setActiveStatus("close")}
//                             className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "close"
//                                 ? "bg-primary text-primary-foreground"
//                                 : "text-muted-foreground hover:bg-muted"
//                                 }`}
//                         >
//                             Close ({closeCount})
//                         </button>

//                     </div>

//                     <DataREfreshButton
//                         {...{
//                             callBackFn: handleRefresh,
//                             loading: refreshing,
//                         }}
//                     />

//                     <SearchInput
//                         {...{
//                             search,
//                             setSearch,
//                         }}
//                     />

//                     {/* <Permission
//                         module="bookez"
//                         permissionKey="Pass"
//                         action="create"
//                     >

//                         <DataCreateButton
//                             {...{
//                                 callBackFn: openCreateEWayBill,
//                                 text: "Create E-Way Bill",
//                             }}
//                         />
//                     </Permission> */}

//                 </div>
//             </div>

//             {/* ========================= Table ========================= */}

//             <div className="min-h-0 flex-1 overflow-hidden">

//                 <DataTable
//                     columns={columns}
//                     data={filteredEWayBills}
//                     loading={listingLoader}
//                     emptyMessage={
//                         activeStatus === "open"
//                             ? "No open E-Way Bill found"
//                             : "No closed E-Way Bill found"
//                     }
//                     actions={(record: any) => {
//                         const recordKey = String(
//                             record?._id ||
//                             record?.ewayBillNo ||
//                             ""
//                         );

//                         const isMenuOpen =
//                             openActionMenu === recordKey;

//                         const isDownloading =
//                             ewayDownloadLoading ===
//                             String(record?.ewayBillNo || "");

//                         return (
//                             <div className="relative flex items-center gap-2">
//                                 <Permission
//                                     module="bookez"
//                                     permissionKey="Pass"
//                                     action={"view" as any}
//                                 >
//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             navigate(
//                                                 `/bookEz/transportation/e-way-bill/view/${record.ewayBillNo}`,
//                                                 {
//                                                     state: {
//                                                         mode: "view",
//                                                         ewayBillData: record,
//                                                     },
//                                                 }
//                                             )
//                                         }
//                                         className="rounded-md p-2 text-primary hover:bg-primary/10"
//                                         title="View"
//                                     >
//                                         <Eye size={16} />
//                                     </button>
//                                 </Permission>

//                                 <Permission
//                                     module="bookez"
//                                     permissionKey="Pass"
//                                     action={"edit" as any}
//                                 >
//                                     <button
//                                         type="button"
//                                         onClick={() =>
//                                             handleEditEWayBill(record)
//                                         }
//                                         className="rounded-md p-2 text-amber-600 hover:bg-amber-100"
//                                         title="Edit"
//                                     >
//                                         <Edit size={16} />
//                                     </button>
//                                 </Permission>

//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         handleDownload(record)
//                                     }
//                                     disabled={isDownloading}
//                                     className="rounded-md p-2 text-success hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-60"
//                                     title="Download"
//                                 >
//                                     {isDownloading ? (
//                                         <Loader2
//                                             size={16}
//                                             className="animate-spin"
//                                         />
//                                     ) : (
//                                         <Download size={16} />
//                                     )}
//                                 </button>

//                                 {/* ⭐ YELLOW STAR: ADDED — THREE DOT MENU */}
//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setOpenActionMenu(
//                                             isMenuOpen
//                                                 ? ""
//                                                 : recordKey
//                                         )
//                                     }
//                                     className="rounded-md p-2 text-muted-foreground hover:bg-muted"
//                                     title="More Actions"
//                                 >
//                                     <MoreVertical size={17} />
//                                 </button>

//                                 {isMenuOpen && (
//                                     <div className="absolute right-0 top-10 z-50 min-w-[190px] overflow-hidden rounded-md border border-border bg-card py-1 shadow-xl">
//                                         <button
//                                             type="button"
//                                             onClick={() =>
//                                                 openEWayBillActionConfirm(
//                                                     "cancel",
//                                                     record
//                                                 )
//                                             }
//                                             className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10"
//                                         >
//                                             <Ban size={15} />
//                                             Cancel E-Way Bill
//                                         </button>

//                                         <button
//                                             type="button"
//                                             onClick={() =>
//                                                 openEWayBillActionConfirm(
//                                                     "reject",
//                                                     record
//                                                 )
//                                             }
//                                             className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-amber-600 hover:bg-amber-500/10"
//                                         >
//                                             <XCircle size={15} />
//                                             Reject E-Way Bill
//                                         </button>

//                                         <button
//                                             type="button"
//                                             onClick={() =>
//                                                 openEWayBillActionConfirm(
//                                                     "extendValidity",
//                                                     record
//                                                 )
//                                             }
//                                             className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10"
//                                         >
//                                             <CalendarClock size={15} />
//                                             Extend Validity
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     }}
//                 />

//             </div>


//             {/* ========================= Pagination ========================= */}

//             {pagination?.totalDocs > 0 && (
//                 <Pagination
//                     localLimit={localLimit}
//                     selectCb={(e: any) => {
//                         setLocalLimit(Number(e.target.value));
//                         setLocalOffset(0);
//                     }}
//                     preDisabled={!pagination?.hasPrevPage}
//                     nextDisabled={!pagination?.hasNextPage}
//                     setLocalOffset={setLocalOffset}
//                     pagination={pagination}
//                 />
//             )}

//             {/* ========================= Delete Confirmation ========================= */}

//             {confirmTooltip.show && (
//                 <ConfirmTooltip
//                     x={confirmTooltip.x}
//                     y={confirmTooltip.y}
//                     message="Are you sure you want to delete this E-Way Bill?"
//                     confirmText="Delete"
//                     cancelText="Cancel"
//                     onConfirm={handleDeleteConfirm}
//                     onCancel={() =>
//                         setConfirmTooltip({
//                             show: false,
//                             x: null,
//                             y: null,
//                             ewayBillNumber: null,
//                         })
//                     }
//                 />
//             )}




//             {/* ⭐ YELLOW STAR: ADDED — E-WAY BILL ACTION CONFIRMATION MODAL */}
//             {ewayActionConfirm.show && (
//                 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
//                     <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-2xl">
//                         <div className="border-b border-border px-5 py-4">
//                             <h2 className="text-base font-bold text-card-foreground">
//                                 {getActionTitle()}
//                             </h2>
//                         </div>

//                         <div className="space-y-4 px-5 py-5">
//                             <p className="text-sm font-medium text-muted-foreground">
//                                 {getActionMessage()}
//                             </p>

//                             <div>
//                                 <label className="mb-1 block text-sm font-semibold text-card-foreground">
//                                     Remarks
//                                 </label>

//                                 <textarea
//                                     value={ewayActionRemark}
//                                     onChange={(event) =>
//                                         setEwayActionRemark(
//                                             event.target.value
//                                         )
//                                     }
//                                     disabled={ewayActionLoading}
//                                     rows={3}
//                                     className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
//                                     placeholder={
//                                         ewayActionConfirm.action ===
//                                             "extendValidity"
//                                             ? "Enter validity extension reason"
//                                             : ewayActionConfirm.action ===
//                                                 "reject"
//                                                 ? "Enter rejection reason"
//                                                 : "Enter cancellation reason"
//                                     }
//                                 />
//                             </div>
//                         </div>

//                         <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
//                             <button
//                                 type="button"
//                                 onClick={
//                                     closeEWayBillActionConfirm
//                                 }
//                                 disabled={ewayActionLoading}
//                                 className="h-10 rounded-md border border-border px-4 text-sm font-bold text-card-foreground hover:bg-muted disabled:opacity-60"
//                             >
//                                 No
//                             </button>

//                             <button
//                                 type="button"
//                                 onClick={
//                                     handleConfirmEWayBillAction
//                                 }
//                                 disabled={ewayActionLoading}
//                                 className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
//                             >
//                                 {ewayActionLoading && (
//                                     <Loader2
//                                         size={16}
//                                         className="animate-spin"
//                                     />
//                                 )}

//                                 Yes, Continue
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default EWayBillList;






import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Ban, CalendarClock, Download, Edit, Loader2, MoreVertical, XCircle, } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";


import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import {
    DataREfreshButton,
} from "../../../../components/buttons";
import Badge from "../../../../components/badge";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    cancelEWayBill,
    extendEWayBillValidity,
    getAllEWayBill,
    getEWayBillAccessToken,
    getEWayBillFromGst,
    multiVehicleUpdate,
    printDetailEWayBill,
    rejectEWayBill,

} from "../../../../redux/slices/professionalSlice/transportation/eWayBillSlice";

/* ===================================================
   E-WAY BILL LIST
=================================================== */
const unwrapThunk = async (
    dispatch: any,
    action: any
) => {
    const result = await dispatch(action);

    if (result?.meta?.requestStatus === "rejected") {
        throw (
            result?.payload ||
            result?.error || {
                message: "Request failed",
            }
        );
    }

    return result?.payload ?? result;
};


// ⭐ YELLOW STAR: ADDED — EXTEND VALIDITY GOODS CONDITION OPTIONS
const EXTEND_VALIDITY_CONDITION_OPTIONS = [
    {
        value: "moving_by_road",
        label: "Moving by road",
        transMode: "1",
        consignmentStatus: "M",
        transitType: "",
        requiresTransitAddress: false,
    },
    {
        value: "road_transit_point",
        label: "Stopped at road transit point",
        transMode: "5",
        consignmentStatus: "T",
        transitType: "R",
        requiresTransitAddress: true,
    },
    {
        value: "warehouse",
        label: "Stored in warehouse",
        transMode: "5",
        consignmentStatus: "T",
        transitType: "W",
        requiresTransitAddress: true,
    },
    {
        value: "other_location",
        label: "Stopped at another location",
        transMode: "5",
        consignmentStatus: "T",
        transitType: "O",
        requiresTransitAddress: true,
    },
];

// ⭐ YELLOW STAR: ADDED — EXTEND VALIDITY REASON OPTIONS
const EXTENSION_REASON_OPTIONS = [
    {
        value: "1_flood",
        code: 1,
        label: "Flood, Cyclone or Landslide",
        remark:
            "Vehicle movement delayed due to flooding and road closure",
    },
    {
        value: "2_law_order",
        code: 2,
        label: "Curfew, Strike or Blockade",
        remark:
            "Vehicle movement stopped due to local law and order restrictions",
    },
    {
        value: "4_transshipment",
        code: 4,
        label: "Goods Moved to Another Vehicle",
        remark:
            "Goods transferred to a replacement vehicle due to breakdown",
    },
    {
        value: "5_accident",
        code: 5,
        label: "Vehicle Accident",
        remark:
            "Vehicle met with an accident and movement was delayed",
    },
    {
        value: "99_breakdown",
        code: 99,
        label: "Mechanical Breakdown",
        remark:
            "Vehicle delayed due to mechanical breakdown and repair",
    },
    {
        value: "99_traffic",
        code: 99,
        label: "Heavy Traffic or Route Diversion",
        remark:
            "Delivery delayed due to traffic diversion and congestion",
    },
];


// ⭐ YELLOW STAR: ADDED — MULTI VEHICLE UPDATE REASON OPTIONS
const MULTI_VEHICLE_REASON_OPTIONS = [
    {
        value: "1",
        label: "Vehicle Breakdown",
        remark: "Vehicle broke down",
    },
    {
        value: "2",
        label: "Transshipment",
        remark: "Goods transferred to another vehicle",
    },
    {
        value: "3",
        label: "Others",
        remark: "Vehicle updated due to operational requirement",
    },
];


const EWayBillList = () => {
    const dispatch = useDispatch<any>();
    const location = useLocation();
    const navigate = useNavigate();

    const {
        eWayBill = [],
        pagination = {},
        listingLoader = false,

    } = useSelector((state: any) => state.eWayBill);

    const [search, setSearch] = useState("");

    const [refreshing, setRefreshing] = useState(false);

    const [localOffset, setLocalOffset] = useState(0);

    const [localLimit, setLocalLimit] = useState(20);

    const [activeStatus, setActiveStatus] = useState<
        "open" | "close"
    >("open");

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        ewayBillNumber: null,
    });

    // ⭐ YELLOW STAR: ADDED — ROW ACTION MENU
    const [openActionMenu, setOpenActionMenu] =
        useState<string>("");

    // ⭐ YELLOW STAR: ADDED — ACTION CONFIRMATION MODAL
    const [ewayActionConfirm, setEwayActionConfirm] =
        useState<any>({
            show: false,
            action: "",
            record: null,
        });

    // ⭐ YELLOW STAR: ADDED — ACTION AND DOWNLOAD LOADER
    const [ewayActionLoading, setEwayActionLoading] =
        useState(false);

    const [ewayDownloadLoading, setEwayDownloadLoading] =
        useState<string>("");
    // ⭐ YELLOW STAR: ADDED — ACTION API BODY
    const [ewayActionPayload, setEwayActionPayload] =
        useState<any>({});

    // ⭐ YELLOW STAR: ADDED — ACTION REMARK
    const [ewayActionRemark, setEwayActionRemark] =
        useState("");

    // ⭐ YELLOW STAR: ADDED — EXTEND VALIDITY FORM
    // Only four user inputs:
    // 1. Goods Condition
    // 2. Extension Reason
    // 3. Extension Remarks
    // 4. Transit Address (required only for transit conditions)
    const [extendValidityForm, setExtendValidityForm] =
        useState<any>({
            goodsCondition: "moving_by_road",
            extnReason: "1_flood",
            extnRsnCode: 1,
            extnRemarks:
                "Vehicle movement delayed due to flooding and road closure",
            transitAddress: "",
        });

    // ⭐ YELLOW STAR: ADDED — MULTI VEHICLE UPDATE FORM
    const [multiVehicleForm, setMultiVehicleForm] =
        useState<any>({
            groupNo: 1,
            oldVehicleNo: "",
            newVehicleNo: "",
            oldTranNo: "",
            newTranNo: "",
            fromPlace: "",
            fromState: "",
            reasonCode: "1",
            reasonRem: "Vehicle broke down",
        });

    const pageTitle =
        location.state?.title || "E-Way Bill";

    const fetchEWayBills = ({
        offset = localOffset,
        limit = localLimit,
        searchValue = search,
    }: any = {}) => {
        dispatch(
            getAllEWayBill({
                limit,
                offset,
                search: searchValue,
            })
        );
    };

    const normalizeStatus = (value: any) =>
        String(value || "active")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

    const getRowStatus = (row: any) =>
        normalizeStatus(
            row?.ewayBillStatus ||
            row?.docStatus ||
            row?.status ||
            "active"
        );

    const isClosedEWayBill = (row: any) => {
        const status = getRowStatus(row);

        return (
            status === "close" ||
            status === "closed" ||
            status === "cancelled" ||
            status === "inactive"
        );
    };

    const openCount = useMemo(
        () =>
            eWayBill.filter(
                (item: any) =>
                    !isClosedEWayBill(item)
            ).length,
        [eWayBill]
    );

    const closeCount = useMemo(
        () =>
            eWayBill.filter((item: any) =>
                isClosedEWayBill(item)
            ).length,
        [eWayBill]
    );

    const filteredEWayBills = useMemo(() => {
        return eWayBill.filter((item: any) => {
            const closed =
                isClosedEWayBill(item);

            if (
                activeStatus === "open" &&
                closed
            )
                return false;

            if (
                activeStatus === "close" &&
                !closed
            )
                return false;

            return true;
        });
    }, [eWayBill, activeStatus]);


    const openEWayBillActionConfirm = (
        action: "cancel" | "reject" | "extendValidity" | "updateVehicle",
        record: any
    ) => {
        setOpenActionMenu("");
        setEwayActionRemark("");

        const initialPayload =
            action === "cancel"
                ? record?.cancelPayload || {}
                : action === "reject"
                    ? record?.rejectPayload || {}
                    : action === "extendValidity"
                        ? record?.extendValidityPayload || {}
                        : record?.multiVehicleUpdatePayload || {};

        setEwayActionPayload(initialPayload);

        // ⭐ YELLOW STAR: ADDED — ONLY FOUR EXTEND VALIDITY INPUTS
        if (action === "extendValidity") {
            const initialReason =
                EXTENSION_REASON_OPTIONS.find(
                    (option) =>
                        option.value ===
                        initialPayload?.extnReason
                ) ||
                EXTENSION_REASON_OPTIONS.find(
                    (option) =>
                        Number(option.code) ===
                        Number(initialPayload?.extnRsnCode)
                ) ||
                EXTENSION_REASON_OPTIONS[0];

            setExtendValidityForm({
                goodsCondition:
                    initialPayload?.goodsCondition ||
                    "moving_by_road",

                extnReason:
                    initialReason.value,

                extnRsnCode:
                    initialReason.code,

                extnRemarks:
                    initialPayload?.extnRemarks ||
                    initialReason.remark,

                transitAddress:
                    initialPayload?.addressLine1 ||
                    "",
            });
        }

      
       

        setEwayActionConfirm({
            show: true,
            action,
            record,
        });
    };

    const closeEWayBillActionConfirm = () => {
        if (ewayActionLoading) return;

        setEwayActionConfirm({
            show: false,
            action: "",
            record: null,
        });

        setEwayActionPayload({});
        setEwayActionRemark("");

        setExtendValidityForm({
            goodsCondition: "moving_by_road",
            extnReason: "1_flood",
            extnRsnCode: 1,
            extnRemarks:
                "Vehicle movement delayed due to flooding and road closure",
            transitAddress: "",
        });

        setMultiVehicleForm({
            groupNo: 1,
            oldVehicleNo: "",
            newVehicleNo: "",
            oldTranNo: "",
            newTranNo: "",
            fromPlace: "",
            fromState: "",
            reasonCode: "1",
            reasonRem: "Vehicle broke down",
        });
    };

    const getActionTitle = () => {
        switch (ewayActionConfirm.action) {
            case "cancel":
                return "Cancel E-Way Bill";

            case "reject":
                return "Reject E-Way Bill";

            case "extendValidity":
                return "Extend E-Way Bill Validity";

            case "updateVehicle":
                return "Update E-Way Bill Vehicle";

            default:
                return "Confirm Action";
        }
    };

    const getActionMessage = () => {
        const ewayBillNo =
            ewayActionConfirm.record?.ewayBillNo ||
            "";

        switch (ewayActionConfirm.action) {
            case "cancel":
                return `Are you sure you want to cancel E-Way Bill ${ewayBillNo}?`;

            case "reject":
                return `Are you sure you want to reject E-Way Bill ${ewayBillNo}?`;

            case "extendValidity":
                return `Are you sure you want to extend the validity of E-Way Bill ${ewayBillNo}?`;

            case "updateVehicle":
                return `Update vehicle details for E-Way Bill ${ewayBillNo}.`;

            default:
                return "Are you sure you want to continue?";
        }
    };



    // ⭐ YELLOW STAR: ADDED — SELECTED EXTEND VALIDITY CONDITION
    const selectedExtendCondition =
        EXTEND_VALIDITY_CONDITION_OPTIONS.find(
            (option) =>
                option.value ===
                extendValidityForm.goodsCondition
        ) ||
        EXTEND_VALIDITY_CONDITION_OPTIONS[0];

    const isTransitAddressRequired =
        Boolean(
            selectedExtendCondition
                ?.requiresTransitAddress
        );

    /* ===================================================
   FETCH DATA
=================================================== */

    useEffect(() => {
        fetchEWayBills();
    }, [dispatch, localOffset, localLimit]);

    /* ===================================================
       SEARCH
    =================================================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalOffset(0);

            dispatch(
                getAllEWayBill({
                    limit: localLimit,
                    offset: 0,
                    search,
                })
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [search, dispatch, localLimit]);

    /* ===================================================
       REFRESH
    =================================================== */

    const handleRefresh = () => {
        setRefreshing(true);

        dispatch(
            getAllEWayBill({
                limit: localLimit,
                offset: localOffset,
                search,
            })
        ).finally(() => {
            setRefreshing(false);
        });
    };



    /* ===================================================
       EDIT
    =================================================== */


    const handleEditEWayBill = (record: any) => {
        if (!record?.ewayBillNo) {
            toast.warn("E-Way Bill Number not found");
            return;
        }

        navigate(
            `/bookEz/transportation/e-way-bill/edit/${record.ewayBillNo}`,
            {
                state: {
                    title: "Edit E-Way Bill",
                    description: "Update E-Way Bill details.",
                    mode: "edit",
                    ewayBillNo: record.ewayBillNo,
                    ewayBillData: record,
                },
            }
        );
    };

    const handleDownload = async (record: any) => {
        const ewayBillNo = String(
            record?.ewayBillNo || ""
        ).trim();

        if (!ewayBillNo) {
            toast.warn("E-Way Bill not found");
            return;
        }

        try {
            setEwayDownloadLoading(ewayBillNo);

            // ⭐ YELLOW STAR: GET FRESH GST ACCESS TOKEN
            const tokenResult = await unwrapThunk(
                dispatch,
                getEWayBillAccessToken()
            );

            const gstAuthToken = String(
                tokenResult?.authtoken ||
                tokenResult?.data?.authtoken ||
                tokenResult?.data?.data?.authtoken ||
                ""
            ).trim();

            if (!gstAuthToken) {
                throw new Error(
                    "E-Way Bill access token was not received"
                );
            }

            // ⭐ YELLOW STAR: GET COMPLETE E-WAY BILL
            const detailsResult = await unwrapThunk(
                dispatch,
                getEWayBillFromGst({
                    authtoken: gstAuthToken,
                    ewbNo: ewayBillNo,
                })
            );

            const ewayBillDetails =
                detailsResult?.data?.data ||
                detailsResult?.data ||
                detailsResult;

            if (!ewayBillDetails) {
                throw new Error(
                    "E-Way Bill details were not received"
                );
            }

            // ⭐ YELLOW STAR: GENERATE PDF
            const pdfBlob = await unwrapThunk(
                dispatch,
                printDetailEWayBill({
                    payload: ewayBillDetails,
                })
            );

            if (!(pdfBlob instanceof Blob)) {
                throw new Error(
                    "Invalid E-Way Bill PDF response"
                );
            }

            const objectUrl =
                URL.createObjectURL(pdfBlob);

            const link =
                document.createElement("a");

            link.href = objectUrl;

            link.download =
                `EWayBill_${ewayBillNo.replace(
                    /[^a-zA-Z0-9_-]/g,
                    ""
                )}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => {
                URL.revokeObjectURL(objectUrl);
            }, 1000);
        } catch (error: any) {
            toast.error(
                error?.message ||
                error?.data?.message ||
                error?.payload?.message ||
                "Unable to download E-Way Bill"
            );
        } finally {
            setEwayDownloadLoading("");
        }
    };


    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.ewayBillNumber) {
                toast.warn("E-Way Bill Number not found");
                return;
            }

            // await dispatch(
            //     deleteEWayBill(confirmTooltip.ewayBillNumber)
            // ).unwrap();

            toast.success("E-Way Bill deleted successfully.");

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                ewayBillNumber: null,
            });

            fetchEWayBills();
        } catch (error: any) {
            toast.error(
                error?.message ||
                "Failed to delete E-Way Bill."
            );
        }
    };


    const handleConfirmEWayBillAction = async () => {
        const record =
            ewayActionConfirm.record;

        const ewayBillNo = String(
            record?.ewayBillNo || ""
        ).trim();

        if (!ewayBillNo) {
            toast.warn(
                "E-Way Bill number not found"
            );

            return;
        }

        try {
            setEwayActionLoading(true);

            /* ===================================================
               STEP 1: GET FRESH GST ACCESS TOKEN
            =================================================== */

            const tokenResult = await unwrapThunk(
                dispatch,
                getEWayBillAccessToken()
            );

            const gstAuthToken = String(
                tokenResult?.authtoken ||
                tokenResult?.data?.authtoken ||
                tokenResult?.data?.data?.authtoken ||
                ""
            ).trim();

            if (!gstAuthToken) {
                throw new Error(
                    "E-Way Bill access token was not received"
                );
            }

            /* ===================================================
               STEP 2: PREPARE DEFAULT CANCEL / REJECT BODY
            =================================================== */

            let requestPayload: any = {
                ...ewayActionPayload,

                ewbNo:
                    ewayActionPayload?.ewbNo ??
                    ewayActionPayload?.ewayBillNo ??
                    Number(ewayBillNo),

                ...(ewayActionRemark.trim()
                    ? {
                        remarks:
                            ewayActionRemark.trim(),
                    }
                    : {}),
            };

            /* ===================================================
               STEP 2A: PREPARE EXTEND VALIDITY BODY
               Only four values are selected by user.
               Remaining values are picked internally from record.
            =================================================== */

            if (
                ewayActionConfirm.action ===
                "extendValidity"
            ) {
                if (
                    !String(
                        extendValidityForm.extnRemarks || ""
                    ).trim()
                ) {
                    throw new Error(
                        "Extension remarks are required"
                    );
                }

                if (
                    isTransitAddressRequired &&
                    !String(
                        extendValidityForm.transitAddress || ""
                    ).trim()
                ) {
                    throw new Error(
                        "Transit address is required"
                    );
                }

                const ewayPayload =
                    record?.ewayPayload || {};

                const vehicleNo = String(
                    ewayActionPayload?.vehicleNo ||
                    ewayPayload?.vehicleNo ||
                    ""
                ).trim();

                const fromPlace = String(
                    ewayActionPayload?.fromPlace ||
                    ewayPayload?.fromPlace ||
                    ""
                ).trim();

                const fromState = Number(
                    ewayActionPayload?.fromState ||
                    ewayPayload?.fromStateCode ||
                    ewayPayload?.actFromStateCode ||
                    0
                );

                const fromPincode = Number(
                    ewayActionPayload?.fromPincode ||
                    ewayPayload?.fromPincode ||
                    0
                );

                const remainingDistance = Number(
                    ewayActionPayload?.remainingDistance ||
                    ewayPayload?.transDistance ||
                    0
                );

                if (!vehicleNo) {
                    throw new Error(
                        "Vehicle number is not available in E-Way Bill"
                    );
                }

                if (!fromPlace) {
                    throw new Error(
                        "From place is not available in E-Way Bill"
                    );
                }

                if (!fromState) {
                    throw new Error(
                        "From state code is not available in E-Way Bill"
                    );
                }

                if (!fromPincode) {
                    throw new Error(
                        "From pincode is not available in E-Way Bill"
                    );
                }

                if (!remainingDistance) {
                    throw new Error(
                        "Remaining distance is not available in E-Way Bill"
                    );
                }

                requestPayload = {
                    ewbNo: Number(ewayBillNo),

                    // ⭐ INTERNAL VALUES FROM SELECTED E-WAY BILL
                    vehicleNo,
                    fromPlace,
                    fromState,
                    fromPincode,
                    remainingDistance,

                    transDocNo: String(
                        ewayActionPayload?.transDocNo ||
                        ewayPayload?.transDocNo ||
                        ""
                    ).trim(),

                    transDocDate: String(
                        ewayActionPayload?.transDocDate ||
                        ewayPayload?.transDocDate ||
                        ""
                    ).trim(),

                    // ⭐ INTERNAL VALUES FROM GOODS CONDITION
                    transMode:
                        selectedExtendCondition.transMode,

                    consignmentStatus:
                        selectedExtendCondition
                            .consignmentStatus,

                    transitType:
                        selectedExtendCondition.transitType,

                    // ⭐ USER SELECTED REASON AND REMARK
                    extnRsnCode: Number(
                        extendValidityForm.extnRsnCode
                    ),

                    extnRemarks: String(
                        extendValidityForm.extnRemarks || ""
                    ).trim(),

                    // ⭐ ONLY ONE TRANSIT ADDRESS INPUT
                    addressLine1:
                        isTransitAddressRequired
                            ? String(
                                extendValidityForm
                                    .transitAddress || ""
                            ).trim()
                            : "",

                    addressLine2: "",
                    addressLine3: "",
                };
            }

            /* ===================================================
               STEP 2B: PREPARE MULTI VEHICLE UPDATE BODY
            =================================================== */

            if (
                ewayActionConfirm.action ===
                "updateVehicle"
            ) {
                const groupNo = Number(
                    multiVehicleForm.groupNo
                );

                const oldvehicleNo = String(
                    multiVehicleForm.oldVehicleNo || ""
                ).trim().toUpperCase();

                const newVehicleNo = String(
                    multiVehicleForm.newVehicleNo || ""
                ).trim().toUpperCase();

                const oldTranNo = String(
                    multiVehicleForm.oldTranNo || ""
                ).trim();

                const newTranNo = String(
                    multiVehicleForm.newTranNo || ""
                ).trim();

                const fromPlace = String(
                    multiVehicleForm.fromPlace || ""
                ).trim();

                const fromState = Number(
                    multiVehicleForm.fromState
                );

                const reasonCode = String(
                    multiVehicleForm.reasonCode || ""
                ).trim();

                const reasonRem = String(
                    multiVehicleForm.reasonRem || ""
                ).trim();

                if (!groupNo) {
                    throw new Error(
                        "Multi Vehicle group number is required"
                    );
                }

                if (!oldvehicleNo) {
                    throw new Error(
                        "Old vehicle number is required"
                    );
                }

                if (!newVehicleNo) {
                    throw new Error(
                        "New vehicle number is required"
                    );
                }

                if (
                    oldvehicleNo ===
                    newVehicleNo
                ) {
                    throw new Error(
                        "Old and new vehicle numbers cannot be the same"
                    );
                }

                if (!fromPlace) {
                    throw new Error(
                        "From place is required"
                    );
                }

                if (!fromState) {
                    throw new Error(
                        "From state code is required"
                    );
                }

                if (!reasonCode) {
                    throw new Error(
                        "Vehicle update reason is required"
                    );
                }

                if (!reasonRem) {
                    throw new Error(
                        "Vehicle update reason remark is required"
                    );
                }

                requestPayload = {
                    ewbNo: Number(ewayBillNo),
                    groupNo,
                    oldvehicleNo,
                    newVehicleNo,
                    oldTranNo,
                    newTranNo,
                    fromPlace,
                    fromState,
                    reasonCode,
                    reasonRem,
                };
            }

            let result: any = null;

            /* ===================================================
               STEP 3: CALL SELECTED ACTION API
            =================================================== */

            if (
                ewayActionConfirm.action ===
                "cancel"
            ) {
                result = await unwrapThunk(
                    dispatch,
                    cancelEWayBill({
                        authtoken:
                            gstAuthToken,

                        payload:
                            requestPayload,
                    })
                );
            } else if (
                ewayActionConfirm.action ===
                "reject"
            ) {
                result = await unwrapThunk(
                    dispatch,
                    rejectEWayBill({
                        authtoken:
                            gstAuthToken,

                        payload:
                            requestPayload,
                    })
                );
            } else if (
                ewayActionConfirm.action ===
                "extendValidity"
            ) {
                result = await unwrapThunk(
                    dispatch,
                    extendEWayBillValidity({
                        authtoken:
                            gstAuthToken,

                        payload:
                            requestPayload,
                    })
                );
            } else if (
                ewayActionConfirm.action ===
                "updateVehicle"
            ) {
                result = await unwrapThunk(
                    dispatch,
                    multiVehicleUpdate({
                        authtoken:
                            gstAuthToken,

                        payload:
                            requestPayload,
                    })
                );
            } else {
                throw new Error(
                    "Invalid E-Way Bill action"
                );
            }

            const resultData =
                result?.data?.data ||
                result?.data ||
                result ||
                {};

            const apiMessage =
                result?.message ||
                resultData?.message ||
                resultData?.status_desc ||
                resultData?.statusDesc ||
                "";

            if (
                ewayActionConfirm.action ===
                "cancel"
            ) {
                toast.success(
                    apiMessage ||
                    "E-Way Bill cancelled successfully."
                );
            } else if (
                ewayActionConfirm.action ===
                "reject"
            ) {
                toast.success(
                    apiMessage ||
                    "E-Way Bill rejected successfully."
                );
            } else if (
                ewayActionConfirm.action ===
                "extendValidity"
            ) {
                toast.success(
                    apiMessage ||
                    "E-Way Bill validity extended successfully."
                );
            } else {
                toast.success(
                    apiMessage ||
                    "E-Way Bill vehicle updated successfully."
                );
            }

            setEwayActionConfirm({
                show: false,
                action: "",
                record: null,
            });

            setEwayActionPayload({});
            setEwayActionRemark("");

            setExtendValidityForm({
                goodsCondition: "moving_by_road",
                extnReason: "1_flood",
                extnRsnCode: 1,
                extnRemarks:
                    "Vehicle movement delayed due to flooding and road closure",
                transitAddress: "",
            });

            setMultiVehicleForm({
                groupNo: 1,
                oldVehicleNo: "",
                newVehicleNo: "",
                oldTranNo: "",
                newTranNo: "",
                fromPlace: "",
                fromState: "",
                reasonCode: "1",
                reasonRem: "Vehicle broke down",
            });

            await dispatch(
                getAllEWayBill({
                    limit:
                        localLimit,

                    offset:
                        localOffset,

                    search,
                })
            );
        } catch (error: any) {
            const apiErrorMessage =
                error?.error?.error?.message ||
                error?.error?.message ||
                error?.response?.data?.error?.error?.message ||
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.data?.error?.error?.message ||
                error?.data?.error?.message ||
                error?.data?.message ||
                error?.payload?.error?.error?.message ||
                error?.payload?.error?.message ||
                error?.payload?.message ||
                error?.message ||
                `Failed to ${getActionTitle().toLowerCase()}`;

            toast.error(apiErrorMessage);

        } finally {
            setEwayActionLoading(false);
        }
    };

    /* ===================================================
       TABLE COLUMNS
    =================================================== */


    const columns = [
        {
            key: "ewayBillNo",
            title: "E-Way Bill No",
            render: (row: any) => row?.ewayBillNo || "-",
        },

        {
            key: "docNo",
            title: "Invoice No",
            render: (row: any) =>
                row?.ewayPayload?.docNo || "-",
        },

        // {
        //     key: "docDate",
        //     title: "Invoice Date",
        //     render: (row: any) =>
        //         row?.ewayPayload?.docDate || "-",
        // },

        {
            key: "ewayBillDate",
            title: "E-Way Bill Date",
            render: (row: any) =>
                row?.rawResponse?.ewayBillDate || "-",
        },

        {
            key: "from",
            title: "From Party",
            render: (row: any) => (
                <div>
                    <div className="font-medium">
                        {row?.ewayPayload?.fromTrdName || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.ewayPayload?.fromGstin || "-"}
                    </div>
                </div>
            ),
        },

        {
            key: "to",
            title: "To Party",
            render: (row: any) => (
                <div>
                    <div className="font-medium">
                        {row?.ewayPayload?.toTrdName || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.ewayPayload?.toGstin || "-"}
                    </div>
                </div>
            ),
        },

        {
            key: "vehicle",
            title: "Vehicle No",
            render: (row: any) =>
                row?.ewayPayload?.vehicleNo || "-",
        },

        {
            key: "distance",
            title: "Distance",
            render: (row: any) =>
                row?.ewayPayload?.transDistance
                    ? `${row.ewayPayload.transDistance} KM`
                    : "-",
        },

        // {
        //     key: "transportMode",
        //     title: "Mode",
        //     render: (row: any) => {
        //         const mode = row?.ewayPayload?.transMode;

        //         switch (mode) {
        //             case "1":
        //                 return "Road";
        //             case "2":
        //                 return "Rail";
        //             case "3":
        //                 return "Air";
        //             case "4":
        //                 return "Ship";
        //             default:
        //                 return "-";
        //         }
        //     },
        // },

        // {
        //     key: "invoiceValue",
        //     title: "Invoice Value",
        //     render: (row: any) =>
        //         row?.ewayPayload?.totInvValue ?? "-",
        // },

        {
            key: "validUpto",
            title: "Valid Upto",
            render: (row: any) =>
                row?.rawResponse?.validUpto || "-",
        },
    ];


    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">

            {/* ========================= Header ========================= */}

            <div
                id="eway-bill-header"
                className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <div
                    id="eway-bill-summary"
                    className="flex items-center"
                >
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go Back"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h1 className="truncate text-lg font-bold text-card-foreground">
                            {pageTitle}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">

                    <Badge
                        {...{
                            count:
                                pagination?.totalDocs ??
                                pagination?.totalRecords ??
                                eWayBill.length ??
                                0,
                            text: "Total E-Way Bills:",
                            varient: "primary",
                        }}
                    />

                    <div className="flex rounded-md border border-border bg-background p-1">

                        <button
                            type="button"
                            onClick={() => setActiveStatus("open")}
                            className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "open"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            Open ({openCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveStatus("close")}
                            className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "close"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            Close ({closeCount})
                        </button>

                    </div>

                    <DataREfreshButton
                        {...{
                            callBackFn: handleRefresh,
                            loading: refreshing,
                        }}
                    />

                    <SearchInput
                        {...{
                            search,
                            setSearch,
                        }}
                    />

                    {/* <Permission
                        module="bookez"
                        permissionKey="Pass"
                        action="create"
                    >
                       
                        <DataCreateButton
                            {...{
                                callBackFn: openCreateEWayBill,
                                text: "Create E-Way Bill",
                            }}
                        />
                    </Permission> */}

                </div>
            </div>

            {/* ========================= Table ========================= */}

            <div className="min-h-0 flex-1 overflow-hidden">

                <DataTable
                    columns={columns}
                    data={filteredEWayBills}
                    loading={listingLoader}
                    emptyMessage={
                        activeStatus === "open"
                            ? "No open E-Way Bill found"
                            : "No closed E-Way Bill found"
                    }
                    actions={(record: any) => {
                        const recordKey = String(
                            record?._id ||
                            record?.ewayBillNo ||
                            ""
                        );

                        const isMenuOpen =
                            openActionMenu === recordKey;

                        const isDownloading =
                            ewayDownloadLoading ===
                            String(record?.ewayBillNo || "");

                        return (
                            <div className="relative flex items-center gap-2">
                                {/* <Permission
                                    module="bookez"
                                    permissionKey="Pass"
                                    action={"view" as any}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/bookEz/transportation/e-way-bill/view/${record.ewayBillNo}`,
                                                {
                                                    state: {
                                                        mode: "view",
                                                        ewayBillData: record,
                                                    },
                                                }
                                            )
                                        }
                                        className="rounded-md p-2 text-primary hover:bg-primary/10"
                                        title="View"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </Permission> */}

                                <Permission
                                    module="bookez"
                                    permissionKey="Pass"
                                    action={"edit" as any}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEditEWayBill(record)
                                        }
                                        className="rounded-md p-2 text-amber-600 hover:bg-amber-100"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                </Permission>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownload(record)
                                    }
                                    disabled={isDownloading}
                                    className="rounded-md p-2 text-success hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Download"
                                >
                                    {isDownloading ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                </button>

                                {/* ⭐ YELLOW STAR: ADDED — THREE DOT MENU */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenActionMenu(
                                            isMenuOpen
                                                ? ""
                                                : recordKey
                                        )
                                    }
                                    className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                                    title="More Actions"
                                >
                                    <MoreVertical size={17} />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 top-10 z-50 min-w-[190px] overflow-hidden rounded-md border border-border bg-card py-1 shadow-xl">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEWayBillActionConfirm(
                                                    "cancel",
                                                    record
                                                )
                                            }
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10"
                                        >
                                            <Ban size={15} />
                                            Cancel E-Way Bill
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEWayBillActionConfirm(
                                                    "reject",
                                                    record
                                                )
                                            }
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-amber-600 hover:bg-amber-500/10"
                                        >
                                            <XCircle size={15} />
                                            Reject E-Way Bill
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEWayBillActionConfirm(
                                                    "extendValidity",
                                                    record
                                                )
                                            }
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10"
                                        >
                                            <CalendarClock size={15} />
                                            Extend Validity
                                        </button>


                                      
                                    </div>
                                )}
                            </div>
                        );
                    }}
                />

            </div>


            {/* ========================= Pagination ========================= */}

            {pagination?.totalDocs > 0 && (
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
            )}

            {/* ========================= Delete Confirmation ========================= */}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this E-Way Bill?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            ewayBillNumber: null,
                        })
                    }
                />
            )}




            {/* ⭐ YELLOW STAR: ADDED — E-WAY BILL ACTION CONFIRMATION MODAL */}
            {ewayActionConfirm.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div
                        className={`w-full rounded-lg border border-border bg-card shadow-2xl ${ewayActionConfirm.action === "updateVehicle"
                            ? "max-w-2xl"
                            : "max-w-md"
                            }`}
                    >
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-bold text-card-foreground">
                                {getActionTitle()}
                            </h2>
                        </div>

                        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
                            <p className="text-sm font-medium text-muted-foreground">
                                {getActionMessage()}
                            </p>

                            {ewayActionConfirm.action ===
                                "extendValidity" ? (
                                <>
                                    {/* ⭐ INPUT 1 — GOODS CONDITION */}
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Goods Condition
                                        </label>

                                        <select
                                            value={
                                                extendValidityForm
                                                    .goodsCondition
                                            }
                                            onChange={(event) =>
                                                setExtendValidityForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        goodsCondition:
                                                            event.target.value,
                                                        transitAddress:
                                                            event.target.value ===
                                                                "moving_by_road"
                                                                ? ""
                                                                : prev.transitAddress,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        >
                                            {EXTEND_VALIDITY_CONDITION_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* ⭐ INPUT 2 — EXTENSION REASON */}
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Extension Reason
                                        </label>

                                        <select
                                            value={
                                                extendValidityForm.extnReason
                                            }
                                            onChange={(event) => {
                                                const selectedReason =
                                                    EXTENSION_REASON_OPTIONS.find(
                                                        (option) =>
                                                            option.value ===
                                                            event.target.value
                                                    );

                                                setExtendValidityForm(
                                                    (prev: any) => ({
                                                        ...prev,

                                                        extnReason:
                                                            selectedReason?.value ||
                                                            "1_flood",

                                                        extnRsnCode:
                                                            selectedReason?.code ||
                                                            1,

                                                        extnRemarks:
                                                            selectedReason?.remark ||
                                                            "",
                                                    })
                                                );
                                            }}
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        >
                                            {EXTENSION_REASON_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* ⭐ INPUT 3 — EXTENSION REMARKS */}
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Extension Remarks
                                        </label>

                                        <textarea
                                            value={
                                                extendValidityForm
                                                    .extnRemarks
                                            }
                                            onChange={(event) =>
                                                setExtendValidityForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        extnRemarks:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            rows={3}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        />
                                    </div>

                                    {/* ⭐ INPUT 4 — TRANSIT ADDRESS, CONDITIONAL */}
                                    {isTransitAddressRequired && (
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                Transit Address
                                            </label>

                                            <textarea
                                                value={
                                                    extendValidityForm
                                                        .transitAddress
                                                }
                                                onChange={(event) =>
                                                    setExtendValidityForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            transitAddress:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                rows={3}
                                                placeholder="Enter transit address"
                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>
                                    )}


                                </>
                            ) : ewayActionConfirm.action ===
                                "updateVehicle" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                Group Number
                                            </label>

                                            <input
                                                type="number"
                                                min="1"
                                                value={multiVehicleForm.groupNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            groupNo:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                From State Code
                                            </label>

                                            <input
                                                type="number"
                                                value={multiVehicleForm.fromState}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            fromState:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                Old Vehicle Number
                                            </label>

                                            <input
                                                value={multiVehicleForm.oldVehicleNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            oldVehicleNo:
                                                                event.target.value.toUpperCase(),
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm uppercase text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                New Vehicle Number
                                            </label>

                                            <input
                                                value={multiVehicleForm.newVehicleNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            newVehicleNo:
                                                                event.target.value.toUpperCase(),
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm uppercase text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                Old Transporter Number
                                            </label>

                                            <input
                                                value={multiVehicleForm.oldTranNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            oldTranNo:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                New Transporter Number
                                            </label>

                                            <input
                                                value={multiVehicleForm.newTranNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            newTranNo:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            From Place
                                        </label>

                                        <input
                                            value={multiVehicleForm.fromPlace}
                                            onChange={(event) =>
                                                setMultiVehicleForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        fromPlace:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Update Reason
                                        </label>

                                        <select
                                            value={multiVehicleForm.reasonCode}
                                            onChange={(event) => {
                                                const selectedReason =
                                                    MULTI_VEHICLE_REASON_OPTIONS.find(
                                                        (option) =>
                                                            option.value ===
                                                            event.target.value
                                                    );

                                                setMultiVehicleForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        reasonCode:
                                                            selectedReason?.value ||
                                                            "1",
                                                        reasonRem:
                                                            selectedReason?.remark ||
                                                            "",
                                                    })
                                                );
                                            }}
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        >
                                            {MULTI_VEHICLE_REASON_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Reason Remark
                                        </label>

                                        <textarea
                                            value={multiVehicleForm.reasonRem}
                                            onChange={(event) =>
                                                setMultiVehicleForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        reasonRem:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            rows={3}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        />
                                    </div>

                                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        Multi Vehicle Initiation must already exist for the same E-Way Bill and group number before vehicle update.
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                        Remarks
                                    </label>

                                    <textarea
                                        value={ewayActionRemark}
                                        onChange={(event) =>
                                            setEwayActionRemark(
                                                event.target.value
                                            )
                                        }
                                        disabled={ewayActionLoading}
                                        rows={3}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        placeholder={
                                            ewayActionConfirm.action ===
                                                "reject"
                                                ? "Enter rejection reason"
                                                : "Enter cancellation reason"
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
                            <button
                                type="button"
                                onClick={
                                    closeEWayBillActionConfirm
                                }
                                disabled={ewayActionLoading}
                                className="h-10 rounded-md border border-border px-4 text-sm font-bold text-card-foreground hover:bg-muted disabled:opacity-60"
                            >
                                No
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleConfirmEWayBillAction
                                }
                                disabled={ewayActionLoading}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                            >
                                {ewayActionLoading && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                Yes, Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EWayBillList;