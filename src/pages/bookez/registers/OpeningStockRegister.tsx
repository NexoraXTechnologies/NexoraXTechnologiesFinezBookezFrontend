// import { useEffect, useMemo, useState } from "react";
// import { Eye } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";

// import RegisterFilterCard from "./RegisterFilterCard";
// import DataTable from "../../../components/DataTable";
// import Pagination from "../../../components/pagination";
// import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
// import Modal from "../../../components/modal";
// import { Checkbox } from "../../../components/inputs";

// import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";


// import {
//     clearRegisterFilterDropdowns,
//     getRegisterFilterDropdowns,
// } from "../../../redux/slices/professionalSlice/registerModule";

// import professionalAxios from "../../../services/professionalAxios";
// import {
   
//     toDateInputValue,
//     toLocalEndOfDayUtc,
//     toLocalStartOfDayUtc,
// } from "../../../utils/helperFunctions";
// import { getOpeningStockRegister } from "../../../redux/slices/professionalSlice/register";

// /* ===================================================
//    TYPES
// =================================================== */

// type DropdownOption = {
//     label: string;
//     value: string;
// };

// type CustomFilterDefinition = {
//     key: string;
//     label?: string;
//     type?: string;
//     api?: string;
//     customMasterCode?: string;
// };

// type ExportType = "pdf" | "excel";

// /* ===================================================
//    CONSTANTS
// =================================================== */

// const BOOKEZ_API_PREFIX = "/eTaxSolnMongoApiBackend";
// const REGISTER_MODULE = "openingStock";

// /* ===================================================
//    COMMON HELPERS
// =================================================== */

// const formatDate = (value: any): string => {
//     if (!value) {
//         return "-";
//     }

//     const date = new Date(value);

//     if (Number.isNaN(date.getTime())) {
//         return String(value);
//     }

//     return date.toLocaleDateString("en-IN");
// };

// const toNumber = (value: any): number => {
//     if (
//         value === null ||
//         value === undefined ||
//         value === ""
//     ) {
//         return 0;
//     }

//     const parsedValue = Number(
//         String(value)
//             .replace(/,/g, "")
//             .replace(/[₹\s]/g, "")
//             .trim()
//     );

//     return Number.isFinite(parsedValue)
//         ? parsedValue
//         : 0;
// };

// const formatAmount = (value: any): string => {
//     return toNumber(value).toLocaleString("en-IN", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//     });
// };

// const formatQuantity = (value: any): string => {
//     return toNumber(value).toLocaleString("en-IN", {
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 3,
//     });
// };

// const normalizeStatus = (value: any): string => {
//     return String(value || "")
//         .trim()
//         .toLowerCase();
// };

// const resolveProfessionalApiPath = (
//     apiPath: string
// ): string => {
//     const normalizedPath = String(apiPath || "").trim();

//     if (!normalizedPath) {
//         return "";
//     }

//     if (normalizedPath.startsWith(BOOKEZ_API_PREFIX)) {
//         return normalizedPath;
//     }

//     return `${BOOKEZ_API_PREFIX}${normalizedPath.startsWith("/")
//         ? normalizedPath
//         : `/${normalizedPath}`
//         }`;
// };

// const dedupeColumns = (columns: any[] = []) => {
//     const seen = new Set<string>();

//     return columns.filter((column: any) => {
//         const key = String(column?.key || "").trim();

//         if (!key || seen.has(key)) {
//             return false;
//         }

//         seen.add(key);

//         return true;
//     });
// };

// const mapCustomMasterOptions = (
//     items: any[]
// ): DropdownOption[] => {
//     return (items || [])
//         .map((item: any) => ({
//             label: String(
//                 item?.name ||
//                 item?.label ||
//                 item?.productName ||
//                 item?.warehouseName ||
//                 item?.godownName ||
//                 item?.code ||
//                 ""
//             ).trim(),

//             value: String(
//                 item?.code ||
//                 item?.value ||
//                 item?.productCode ||
//                 item?.warehouseCode ||
//                 item?.godownCode ||
//                 item?._id ||
//                 ""
//             ).trim(),
//         }))
//         .filter(
//             (item: DropdownOption) =>
//                 Boolean(item.label && item.value)
//         );
// };

// /* ===================================================
//    OPENING STOCK FIELD HELPERS
// =================================================== */

// const getVoucherNumber = (row: any): string => {
//     return String(
//         row?.opStockVoucherNumber ||
//         row?.openingStockVoucherNumber ||
//         row?.oStockVoucherNumber ||
//         row?.voucherNumber ||
//         row?.voucher ||
//         ""
//     ).trim();
// };

// const getVoucherDate = (row: any): any => {
//     return (
//         row?.openingStockDate ||
//         row?.opStockVoucherDate ||
//         row?.openingStockVoucherDate ||
//         row?.oStockVoucherDate ||
//         row?.voucherDate ||
//         row?.openingDate ||
//         row?.date ||
//         ""
//     );
// };

// const getBodyRows = (row: any): any[] => {
//     if (Array.isArray(row?.openingStockBody)) {
//         return row.openingStockBody;
//     }

//     if (Array.isArray(row?.opStockBody)) {
//         return row.opStockBody;
//     }

//     if (Array.isArray(row?.oStockBody)) {
//         return row.oStockBody;
//     }

//     if (Array.isArray(row?.products)) {
//         return row.products;
//     }

//     if (Array.isArray(row?.items)) {
//         return row.items;
//     }

//     if (
//         row?.productCode ||
//         row?.productName
//     ) {
//         return [row];
//     }

//     return [];
// };

// const getFooter = (row: any): any => {
//     return (
//         row?.openingStockFooter ||
//         row?.opStockFooter ||
//         row?.oStockFooter ||
//         row?.footer ||
//         {}
//     );
// };




// const getQuantity = (row: any): number => {
//     const footer = getFooter(row);

//     if (footer?.totalQuantity !== undefined) {
//         return toNumber(footer.totalQuantity);
//     }

//     if (
//         row?.openingQuantity !== undefined
//     ) {
//         return toNumber(row.openingQuantity);
//     }

//     if (
//         row?.stockQuantity !== undefined
//     ) {
//         return toNumber(row.stockQuantity);
//     }

//     if (row?.quantity !== undefined) {
//         return toNumber(row.quantity);
//     }

//     return getBodyRows(row).reduce(
//         (total: number, item: any) =>
//             total +
//             toNumber(
//                 item?.openingQuantity ??
//                 item?.stockQuantity ??
//                 item?.quantity ??
//                 0
//             ),
//         0
//     );
// };

// const getRate = (row: any): number => {
//     return toNumber(
//         row?.openingRate ??
//         row?.stockRate ??
//         row?.rate ??
//         row?.valuationRate ??
//         getBodyRows(row)?.[0]?.openingRate ??
//         getBodyRows(row)?.[0]?.stockRate ??
//         getBodyRows(row)?.[0]?.rate ??
//         getBodyRows(row)?.[0]?.valuationRate ??
//         0
//     );
// };

// const getStockValue = (row: any): number => {
//     const footer = getFooter(row);

//     const directValue =
//         footer?.netAmount ??
//         footer?.totalNetAmount ??
//         footer?.stockValue ??
//         footer?.totalStockValue ??
//         row?.stockValue ??
//         row?.openingStockValue ??
//         row?.openingValue ??
//         row?.netAmount ??
//         row?.amount;

//     if (
//         directValue !== undefined &&
//         directValue !== null &&
//         directValue !== ""
//     ) {
//         return toNumber(directValue);
//     }

//     const body = getBodyRows(row);

//     if (body.length) {
//         return body.reduce(
//             (total: number, item: any) => {
//                 const itemValue =
//                     item?.stockValue ??
//                     item?.openingStockValue ??
//                     item?.openingValue ??
//                     item?.netAmount ??
//                     item?.amount;

//                 if (
//                     itemValue !== undefined &&
//                     itemValue !== null &&
//                     itemValue !== ""
//                 ) {
//                     return total + toNumber(itemValue);
//                 }

//                 const quantity = toNumber(
//                     item?.openingQuantity ??
//                     item?.stockQuantity ??
//                     item?.quantity ??
//                     0
//                 );

//                 const rate = toNumber(
//                     item?.openingRate ??
//                     item?.stockRate ??
//                     item?.rate ??
//                     item?.valuationRate ??
//                     0
//                 );

//                 return total + quantity * rate;
//             },
//             0
//         );
//     }

//     return getQuantity(row) * getRate(row);
// };

// // const getBatchNumber = (row: any): string => {
// //     return String(
// //         row?.batchNumber ||
// //         row?.batchNo ||
// //         getBodyRows(row)?.[0]?.batchNumber ||
// //         getBodyRows(row)?.[0]?.batchNo ||
// //         "-"
// //     ).trim();
// // };

// const getStatus = (row: any): string => {
//     return String(
//         row?.opStockStatus ||
//         row?.openingStockStatus ||
//         row?.oStockStatus ||
//         row?.status ||
//         "-"
//     );
// };



// const getStatusClass = (value: any): string => {
//     const status = normalizeStatus(value);

//     if (
//         status === "approved" ||
//         status === "active" ||
//         status === "completed"
//     ) {
//         return "bg-success/10 text-success";
//     }

//     if (
//         status === "rejected" ||
//         status === "cancelled" ||
//         status === "canceled"
//     ) {
//         return "bg-destructive/10 text-destructive";
//     }

//     if (
//         status === "draft" ||
//         status === "pending"
//     ) {
//         return "bg-warning/10 text-warning";
//     }

//     return "bg-muted text-muted-foreground";
// };



// /* ===================================================
//    TABLE COLUMNS
// =================================================== */


// const mainColumns = [
//     {
//         key: "openingStockVoucherNumber",
//         title: "Voucher Number",
//         render: (row: any) => (
//             <span className="font-semibold text-card-foreground">
//                 {getVoucherNumber(row) || "-"}
//             </span>
//         ),
//     },
//     {
//         key: "openingStockDate",
//         title: "Date",
//         render: (row: any) => (
//             <span className="font-medium text-card-foreground">
//                 {formatDate(getVoucherDate(row))}
//             </span>
//         ),
//     },
   
   
   
//     {
//         key: "totalQuantity",
//         title: "Total Qty",
//         render: (row: any) => (
//             <span className="font-semibold">
//                 {formatQuantity(
//                     getFooter(row)?.totalQuantity ??
//                     getQuantity(row)
//                 )}
//             </span>
//         ),
//     },
//     {
//         key: "totalNetAmount",
//         title: "Total Net",
//         render: (row: any) => (
//             <span className="whitespace-nowrap font-bold">
//                 ₹{formatAmount(
//                     getFooter(row)?.totalNetAmount ??
//                     getStockValue(row)
//                 )}
//             </span>
//         ),
//     },
//     {
//         key: "openingStockStatus",
//         title: "Status",
//         render: (row: any) => {
//             const status = getStatus(row);

//             return (
//                 <span
//                     className={`
//                         inline-flex rounded-full px-3 py-1
//                         text-xs font-bold uppercase
//                         ${getStatusClass(status)}
//                     `}
//                 >
//                     {status}
//                 </span>
//             );
//         },
//     },
// ];



// /* ===================================================
//    COMPONENT
// =================================================== */

// const OpeningStockRegister = () => {
//     const dispatch = useDispatch<any>();

//     /* ===================================================
//        FILTER STATES
//     =================================================== */

//     const [fromDate, setFromDate] =
//         useState("");

//     const [toDate, setToDate] =
//         useState("");

//     const [dateError, setDateError] =
//         useState("");

//     const [product, setProduct] =
//         useState("");

//     const [
//         selectedCustomFilters,
//         setSelectedCustomFilters,
//     ] = useState<Record<string, string>>({});

//     const [
//         customFilterOptions,
//         setCustomFilterOptions,
//     ] = useState<
//         Record<string, DropdownOption[]>
//     >({});

//     /* ===================================================
//        PAGINATION STATES
//     =================================================== */

//     const [localOffset, setLocalOffset] =
//         useState(0);

//     const [localLimit, setLocalLimit] =
//         useState(20);

//     const [refreshKey, setRefreshKey] =
//         useState(0);

//     /* ===================================================
//        EXPORT STATES
//     =================================================== */

//     const [pdfLoading, setPdfLoading] =
//         useState(false);

//     const [excelLoading, setExcelLoading] =
//         useState(false);

//     const [
//         exportModalVisible,
//         setExportModalVisible,
//     ] = useState(false);

//     const [exportType, setExportType] =
//         useState<ExportType | null>(null);

//     const [
//         exportColumnsLoading,
//         setExportColumnsLoading,
//     ] = useState(false);

//     const [systemColumns, setSystemColumns] =
//         useState<any[]>([]);

//     const [customColumns, setCustomColumns] =
//         useState<any[]>([]);

//     const [
//         selectedExportColumns,
//         setSelectedExportColumns,
//     ] = useState<string[]>([]);

//     /* ===================================================
//        VIEW STATES
//     =================================================== */

//     const [viewModal, setViewModal] =
//         useState(false);

//     const [viewLoading, setViewLoading] =
//         useState(false);

//     const [viewForm, setViewForm] =
//         useState<any>({});

//     const [viewErrors, setViewErrors] =
//         useState<any>({});


//     /* ===================================================
//        REDUX SELECTORS
//     =================================================== */

//     const { products = [] } = useSelector(
//         (state: any) =>
//             state.productMaster || {}
//     );

//     const {
//         openingStockData = [],
//         openingStocks = [],
//         openingStockLoading = false,
//         openingStockPagination = {},
//         pagination: openingStockPaginationFallback = {},
//     } = useSelector(
//         (state: any) =>
//             state.allRegisters || {}
//     );

//     const {
//         filters: registerFilterDropdowns = [],
//         loading:
//         registerFilterDropdownLoading = false,
//     } = useSelector(
//         (state: any) =>
//             state.registerFilterDropdown || {}
//     );

//     /* ===================================================
//        CUSTOM FILTERS
//     =================================================== */

//     const customFilters:any = useMemo<
//         CustomFilterDefinition[]
//     >(() => {
//         return Array.isArray(
//             registerFilterDropdowns
//         )
//             ? registerFilterDropdowns
//             : [];
//     }, [registerFilterDropdowns]);

//     const selectedCustomCodes = useMemo(() => {
//         return customFilters
//             .map(
//                 (filter: CustomFilterDefinition) =>
//                     selectedCustomFilters[
//                     filter.key
//                     ] || ""
//             )
//             .filter(Boolean);
//     }, [
//         customFilters,
//         selectedCustomFilters,
//     ]);

//     const selectedCustomCodesKey = useMemo(
//         () => selectedCustomCodes.join("|"),
//         [selectedCustomCodes]
//     );

//     /* ===================================================
//        FILTER CHECK
//     =================================================== */



//     /* ===================================================
//        PRODUCT OPTIONS
//     =================================================== */

//     const productOptions = useMemo(() => {
//         return (products || [])
//             .map((item: any) => ({
//                 label:
//                     item?.productName || "",

//                 value:
//                     item?.productCode || "",
//             }))
//             .filter(
//                 (item: DropdownOption) =>
//                     Boolean(
//                         item.label &&
//                         item.value
//                     )
//             );
//     }, [products]);

  
//     /* ===================================================
//        TABLE DATA
//     =================================================== */

//     const tableData = useMemo(() => {
//         if (Array.isArray(openingStockData)) {
//             return openingStockData;
//         }

//         if (Array.isArray(openingStockData?.openingStocks)) {
//             return openingStockData.openingStocks;
//         }

//         if (Array.isArray(openingStocks)) {
//             return openingStocks;
//         }

//         return [];
//     }, [
//         openingStockData,
//         openingStocks,
//     ]);

//     const currentPagination = useMemo(() => {
//         return (
//             openingStockPagination ||
//             openingStockData?.pagination ||
//             openingStockPaginationFallback ||
//             {}
//         );
//     }, [
//         openingStockPagination,
//         openingStockData,
//         openingStockPaginationFallback,
//     ]);

//     const hasRegisterData = tableData.length > 0;

//     const validateDates = (): boolean => {
//         if (!fromDate && !toDate) {
//             setDateError("");
//             return true;
//         }

//         if (!fromDate || !toDate) {
//             setDateError("Please select both From Date and To Date.");
//             return false;
//         }

//         if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
//             setDateError("From Date cannot be greater than To Date.");
//             return false;
//         }

//         setDateError("");
//         return true;
//     };

//     /* ===================================================
//        API PAYLOAD
//     =================================================== */

//     const getPayload = (
//         requestedExportType:
//             | "pdf"
//             | "excel"
//             | "" = "",
//         selectedColumns: string[] = []
//     ) => {
//         const isExport = Boolean(
//             requestedExportType
//         );

//         return {
//             productCode: product,

//             fromDate: fromDate || "",
//             toDate: toDate || "",

//             customCodes:
//                 selectedCustomCodes.length
//                     ? selectedCustomCodes
//                     : [""],

//             offset: isExport
//                 ? 0
//                 : localOffset,

//             limit: isExport
//                 ? 120000
//                 : localLimit,

//             ...(isExport
//                 ? {
//                     exportType:
//                         requestedExportType,

//                     selectedColumns,
//                 }
//                 : {
//                     exportType:
//                         "" as const,
//                 }),
//         };
//     };

//     /* ===================================================
//        LOAD PRODUCT MASTER
//     =================================================== */

//     useEffect(() => {
//         dispatch(
//             getAllProducts({
//                 offset: 0,
//                 limit: 500,
//                 search: "",
//             })
//         );
//     }, [dispatch]);

//     /* ===================================================
//        LOAD REGISTER FILTERS
//     =================================================== */

//     useEffect(() => {
//         dispatch(
//             getRegisterFilterDropdowns(
//                 REGISTER_MODULE
//             )
//         );

//         return () => {
//             dispatch(
//                 clearRegisterFilterDropdowns()
//             );
//         };
//     }, [dispatch]);

//     /* ===================================================
//        LOAD CUSTOM FILTER OPTIONS
//     =================================================== */

//     useEffect(() => {
//         let isMounted = true;

//         const loadOptions = async () => {
//             if (!customFilters.length) {
//                 setCustomFilterOptions({});
//                 setSelectedCustomFilters({});

//                 return;
//             }

//             const optionEntries =
//                 await Promise.all(
//                     customFilters.map(
//                         async (
//                             filter: CustomFilterDefinition
//                         ) => {
//                             const apiPath =
//                                 resolveProfessionalApiPath(
//                                     filter?.api || ""
//                                 );

//                             if (
//                                 !filter?.key ||
//                                 !apiPath
//                             ) {
//                                 return [
//                                     filter?.key || "",
//                                     [],
//                                 ] as const;
//                             }

//                             try {
//                                 const response =
//                                     await professionalAxios.get(
//                                         apiPath
//                                     );

//                                 const items =
//                                     response?.data
//                                         ?.data?.items ||
//                                     response?.data
//                                         ?.items ||
//                                     response?.data
//                                         ?.data?.data
//                                         ?.items ||
//                                     response?.data
//                                         ?.records ||
//                                     [];

//                                 return [
//                                     filter.key,

//                                     mapCustomMasterOptions(
//                                         Array.isArray(
//                                             items
//                                         )
//                                             ? items
//                                             : []
//                                     ),
//                                 ] as const;
//                             } catch (error) {
//                                 console.log(
//                                     "Opening stock custom filter options failed:",
//                                     filter.key,
//                                     error
//                                 );

//                                 return [
//                                     filter.key,
//                                     [],
//                                 ] as const;
//                             }
//                         }
//                     )
//                 );

//             if (!isMounted) {
//                 return;
//             }

//             setCustomFilterOptions(
//                 Object.fromEntries(
//                     optionEntries.filter(
//                         ([key]) =>
//                             Boolean(key)
//                     )
//                 )
//             );

//             setSelectedCustomFilters(
//                 (previous) => {
//                     const nextSelected: Record<
//                         string,
//                         string
//                     > = {};

//                     customFilters.forEach(
//                         (
//                             filter: CustomFilterDefinition
//                         ) => {
//                             if (
//                                 filter.key &&
//                                 previous[
//                                 filter.key
//                                 ]
//                             ) {
//                                 nextSelected[
//                                     filter.key
//                                 ] =
//                                     previous[
//                                     filter.key
//                                     ];
//                             }
//                         }
//                     );

//                     return nextSelected;
//                 }
//             );
//         };

//         loadOptions();

//         return () => {
//             isMounted = false;
//         };
//     }, [customFilters]);

//     useEffect(() => {
//         dispatch(
//             getOpeningStockRegister(
//                 getPayload()
//             )
//         );
//     }, [dispatch, fromDate, toDate, product, selectedCustomCodesKey, localOffset, localLimit, refreshKey]);

   
//     /* ===================================================
//        VIEW DATA
//     =================================================== */

//     const viewFooterTotals = useMemo(() => {
//         return (viewForm?.openingStockBody || []).reduce(
//             (acc: any, item: any) => {
//                 acc.totalQuantity += toNumber(item?.quantity);
//                 acc.totalGrossAmount += toNumber(item?.grossAmount);
//                 acc.totalDiscountAmount += toNumber(item?.discountAmount);
//                 acc.totalCgstAmount += toNumber(item?.cgstAmount);
//                 acc.totalSgstAmount += toNumber(item?.sgstAmount);
//                 acc.totalIgstAmount += toNumber(item?.igstAmount);
//                 acc.totalTaxAmount += toNumber(item?.taxAmount);
//                 acc.totalOtherAmount += toNumber(item?.otherAmount);
//                 acc.totalNetAmount += toNumber(
//                     item?.netTotal ??
//                     item?.netAmount
//                 );

//                 return acc;
//             },
//             {
//                 totalQuantity: 0,
//                 totalGrossAmount: 0,
//                 totalDiscountAmount: 0,
//                 totalCgstAmount: 0,
//                 totalSgstAmount: 0,
//                 totalIgstAmount: 0,
//                 totalTaxAmount: 0,
//                 totalOtherAmount: 0,
//                 totalNetAmount: 0,
//             }
//         );
//     }, [viewForm?.openingStockBody]);

//     const viewInputData = useMemo(() => {
//         return {
//             header: [
//                 {
//                     key: "openingStockVoucherNumber",
//                     label: "Voucher No",
//                     type: "text",
//                     disabled: true,
//                 },
//                 {
//                     key: "openingStockDate",
//                     label: "Date",
//                     type: "date",
//                     disabled: true,
//                 },
//                 {
//                     key: "remark",
//                     label: "Remark",
//                     type: "text",
//                     disabled: true,
//                 },
//             ],

//             body: [
//                 {
//                     key: "productName",
//                     title: "Product",
//                     type: "text",
//                     width: "220px",
//                     disabled: true,
//                 },
//                 {
//                     key: "description",
//                     title: "Description",
//                     type: "text",
//                     width: "220px",
//                     disabled: true,
//                 },
//                 {
//                     key: "quantity",
//                     title: "Qty",
//                     type: "number",
//                     width: "110px",
//                     align: "right",
//                     disabled: true,
//                 },
//                 {
//                     key: "unitName",
//                     title: "Unit",
//                     type: "text",
//                     width: "120px",
//                     disabled: true,
//                 },
//                 {
//                     key: "rate",
//                     title: "Rate",
//                     type: "number",
//                     width: "120px",
//                     align: "right",
//                     disabled: true,
//                 },
//                 {
//                     key: "grossAmount",
//                     title: "Gross",
//                     type: "number",
//                     width: "130px",
//                     align: "right",
//                     disabled: true,
//                 },
//                 {
//                     key: "taxAmount",
//                     title: "Tax",
//                     type: "number",
//                     width: "120px",
//                     align: "right",
//                     disabled: true,
//                 },
//                 {
//                     key: "netTotal",
//                     title: "Net",
//                     type: "number",
//                     width: "130px",
//                     align: "right",
//                     disabled: true,
//                 },
//                 {
//                     key: "remarks",
//                     title: "Remarks",
//                     type: "text",
//                     width: "180px",
//                     disabled: true,
//                 },
//             ],

//             footer: [
//                 {
//                     key: "totalQuantity",
//                     label: "Total Quantity",
//                     value: viewFooterTotals.totalQuantity,
//                     rawValue: viewFooterTotals.totalQuantity,
//                 },
//                 {
//                     key: "totalGrossAmount",
//                     label: "Gross Amount",
//                     value: `₹${formatAmount(viewFooterTotals.totalGrossAmount)}`,
//                     rawValue: viewFooterTotals.totalGrossAmount,
//                 },
//                 {
//                     key: "totalTaxAmount",
//                     label: "Tax Amount",
//                     value: `₹${formatAmount(viewFooterTotals.totalTaxAmount)}`,
//                     rawValue: viewFooterTotals.totalTaxAmount,
//                 },
//                 {
//                     key: "totalNetAmount",
//                     label: "Net Amount",
//                     value: `₹${formatAmount(viewFooterTotals.totalNetAmount)}`,
//                     rawValue: viewFooterTotals.totalNetAmount,
//                 },
//             ],
//         };
//     }, [viewFooterTotals]);

//     /* ===================================================
//        FILTER HANDLERS
//     =================================================== */

//     const handleRefresh = () => {
//         if (!validateDates()) return;

//         setLocalOffset(0);

//         setRefreshKey(
//             (previous) => previous + 1
//         );
//     };

//     const handleClear = () => {
//         setDateError("");
//         setFromDate("");
//         setToDate("");
//         setProduct("");
//         setSelectedCustomFilters({});
//         setLocalOffset(0);

//         setRefreshKey(
//             (previous) => previous + 1
//         );
//     };

//     /* ===================================================
//        VIEW HANDLER
//     =================================================== */

//     const handleViewVoucher = (row: any) => {
//         const body = getBodyRows(row).map(
//             (item: any, index: number) => ({
//                 ...item,
//                 id:
//                     item?.id ||
//                     `${Date.now()}-${index}`,
//                 productCode:
//                     item?.productCode || "",
//                 productName:
//                     item?.productName ||
//                     item?.productCode ||
//                     "",
//                 productId:
//                     item?.productId ||
//                     item?._id ||
//                     "",
//                 description:
//                     item?.description ||
//                     item?.productDescription ||
//                     "",
//                 remarks:
//                     item?.remarks ??
//                     item?.remark ??
//                     "",
//                 quantity:
//                     item?.quantity ?? "",
//                 unit:
//                     item?.unit ||
//                     item?.uom ||
//                     "",
//                 unitName:
//                     item?.unitName ||
//                     item?.unit ||
//                     item?.uom ||
//                     "-",
//                 rate:
//                     item?.rate ?? "",
//                 grossAmount:
//                     item?.grossAmount ??
//                     toNumber(item?.quantity) *
//                     toNumber(item?.rate),
//                 discountPercentage:
//                     item?.discountPercentage ??
//                     item?.discount ??
//                     "",
//                 discountAmount:
//                     item?.discountAmount ?? 0,
//                 taxableAmount:
//                     item?.taxableAmount ?? 0,
//                 cgstPercentage:
//                     item?.cgstPercentage ??
//                     item?.cgst ??
//                     "",
//                 cgstAmount:
//                     item?.cgstAmount ?? 0,
//                 sgstPercentage:
//                     item?.sgstPercentage ??
//                     item?.sgst ??
//                     "",
//                 sgstAmount:
//                     item?.sgstAmount ?? 0,
//                 igstPercentage:
//                     item?.igstPercentage ??
//                     item?.igst ??
//                     "",
//                 igstAmount:
//                     item?.igstAmount ?? 0,
//                 otherAmount:
//                     item?.otherAmount ?? 0,
//                 taxAmount:
//                     item?.taxAmount ?? 0,
//                 netTotal:
//                     item?.netTotal ??
//                     item?.netAmount ??
//                     0,
//             })
//         );

//         setViewErrors({});

//         setViewForm({
//             ...row,
//             openingStockVoucherNumber:
//                 row?.openingStockVoucherNumber ||
//                 getVoucherNumber(row) ||
//                 "OPSTOCK",
//             openingStockDate:
//                 row?.openingStockDate ||
//                 getVoucherDate(row) ||
//                 "",
//             remark:
//                 row?.openingStockRemark ??
//                 row?.remark ??
//                 row?.remarks ??
//                 "-",
//             openingStockRemark:
//                 row?.openingStockRemark ??
//                 row?.remark ??
//                 row?.remarks ??
//                 "",
//             openingStockStatus:
//                 row?.openingStockStatus ||
//                 getStatus(row) ||
//                 "",
//             openingStockBody:
//                 body,
//             openingStockFooter: {
//                 ...(row?.openingStockFooter || {}),
//                 totalQuantity:
//                     row?.openingStockFooter?.totalQuantity ??
//                     body.reduce(
//                         (sum: number, item: any) =>
//                             sum + toNumber(item?.quantity),
//                         0
//                     ),
//                 totalGrossAmount:
//                     row?.openingStockFooter?.totalGrossAmount ??
//                     body.reduce(
//                         (sum: number, item: any) =>
//                             sum + toNumber(item?.grossAmount),
//                         0
//                     ),
//                 totalTaxAmount:
//                     row?.openingStockFooter?.totalTaxAmount ??
//                     body.reduce(
//                         (sum: number, item: any) =>
//                             sum + toNumber(item?.taxAmount),
//                         0
//                     ),
//                 totalNetAmount:
//                     row?.openingStockFooter?.totalNetAmount ??
//                     body.reduce(
//                         (sum: number, item: any) =>
//                             sum + toNumber(
//                                 item?.netTotal ??
//                                 item?.netAmount
//                             ),
//                         0
//                     ),
//             },
//         });

//         setViewLoading(false);
//         setViewModal(true);
//     };

//     /* ===================================================
//        DOWNLOAD HELPER
//     =================================================== */

//     const downloadBlobFile = (
//         blob: Blob,
//         fileName: string
//     ) => {
//         const url =
//             window.URL.createObjectURL(
//                 blob
//             );

//         const link =
//             document.createElement("a");

//         link.href = url;
//         link.download = fileName;

//         document.body.appendChild(link);
//         link.click();
//         link.remove();

//         window.URL.revokeObjectURL(url);
//     };

//     /* ===================================================
//        EXPORT HANDLERS
//     =================================================== */

//     const closeExportModal = () => {
//         setExportModalVisible(false);
//         setExportType(null);
//         setSystemColumns([]);
//         setCustomColumns([]);
//         setSelectedExportColumns([]);
//     };

//     const openExportPicker = async (
//         requestedType: ExportType
//     ) => {
//         if (
//             !hasRegisterData ||
//             exportColumnsLoading ||
//             pdfLoading ||
//             excelLoading ||
//             !validateDates()
//         ) {
//             return;
//         }

//         try {
//             setExportType(requestedType);
//             setExportColumnsLoading(true);

//             const response =
//                 await professionalAxios.get(
//                     "/eTaxSolnMongoApiBackend/users/bookez/registers/exportColumns",
//                     {
//                         params: {
//                             module:
//                                 REGISTER_MODULE,
//                         },
//                     }
//                 );

//             const data =
//                 response?.data?.data ??
//                 response?.data ??
//                 {};

//             const system = dedupeColumns(
//                 data?.systemColumns || []
//             );

//             const custom = dedupeColumns(
//                 (
//                     data?.customColumns || []
//                 ).filter(
//                     (column: any) =>
//                         !system.some(
//                             (
//                                 systemColumn: any
//                             ) =>
//                                 systemColumn?.key ===
//                                 column?.key
//                         )
//                 )
//             );

//             setSystemColumns(system);
//             setCustomColumns(custom);

//             setSelectedExportColumns(
//                 system.map(
//                     (column: any) =>
//                         column.key
//                 )
//             );

//             setExportModalVisible(true);
//         } catch (error) {
//             console.log(
//                 "Opening stock export columns failed:",
//                 error
//             );

//             setExportType(null);
//         } finally {
//             setExportColumnsLoading(false);
//         }
//     };

//     const toggleExportColumn = (
//         key: string
//     ) => {
//         setSelectedExportColumns(
//             (previous) =>
//                 previous.includes(key)
//                     ? previous.filter(
//                         (item) =>
//                             item !== key
//                     )
//                     : [
//                         ...previous,
//                         key,
//                     ]
//         );
//     };

//     const setSectionSelection = (
//         columns: any[],
//         selected: boolean
//     ) => {
//         const keys = columns.map(
//             (column: any) =>
//                 column.key
//         );

//         setSelectedExportColumns(
//             (previous) => {
//                 const withoutSection =
//                     previous.filter(
//                         (key) =>
//                             !keys.includes(key)
//                     );

//                 return selected
//                     ? [
//                         ...withoutSection,
//                         ...keys,
//                     ]
//                     : withoutSection;
//             }
//         );
//     };

//     const performExportDownload =
//         async () => {
//             if (
//                 !hasRegisterData ||
//                 !exportType ||
//                 !selectedExportColumns.length ||
//                 !validateDates()
//             ) {
//                 return;
//             }

//             const currentExportType =
//                 exportType;

//             const columns = [
//                 ...selectedExportColumns,
//             ];

//             closeExportModal();

//             try {
//                 if (
//                     currentExportType ===
//                     "pdf"
//                 ) {
//                     setPdfLoading(true);
//                 } else {
//                     setExcelLoading(true);
//                 }

//                 const response =
//                     await dispatch(
//                         getOpeningStockRegister(
//                             getPayload(
//                                 currentExportType,
//                                 columns
//                             )
//                         )
//                     ).unwrap();

//                 if (response?.blob) {
//                     downloadBlobFile(
//                         response.blob,

//                         currentExportType ===
//                             "pdf"
//                             ? "opening-stock-register.pdf"
//                             : "opening-stock-register.xlsx"
//                     );
//                 }
//             } catch (error) {
//                 console.log(
//                     `Opening stock register ${currentExportType.toUpperCase()} download failed:`,
//                     error
//                 );
//             } finally {
//                 setPdfLoading(false);
//                 setExcelLoading(false);
//             }
//         };

//     /* ===================================================
//        RENDER
//     =================================================== */

//     return (
//         <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
//             <RegisterFilterCard
//                 title="Opening Stock Register Filters"
//                 fields={[
//                     {
//                         key: "fromDate",
//                         type: "date",
//                         label: "From Date",
//                         value: fromDate ? toDateInputValue(fromDate) : "",
//                         required: false,

//                         onChange: (
//                             value: string
//                         ) => {
//                             setFromDate(
//                                 value
//                                     ? toLocalStartOfDayUtc(value)
//                                     : ""
//                             );
//                             setLocalOffset(0);
//                             setDateError("");
//                         },
//                     },
//                     {
//                         key: "toDate",
//                         type: "date",
//                         label: "To Date",
//                         value: toDate ? toDateInputValue(toDate) : "",
//                         required: false,

//                         onChange: (
//                             value: string
//                         ) => {
//                             setToDate(
//                                 value
//                                     ? toLocalEndOfDayUtc(value)
//                                     : ""
//                             );
//                             setLocalOffset(0);
//                             setDateError("");
//                         },
//                     },
//                     {
//                         key: "product",
//                         type: "select",
//                         label: "Product",
//                         placeholder:
//                             "Select Product",
//                         value: product,
//                         options:
//                             productOptions,

//                         onChange: (
//                             value: string
//                         ) => {
//                             setProduct(value);
//                             setLocalOffset(0);
//                         },
//                     },

//                     ...customFilters.map(
//                         (
//                             filter: CustomFilterDefinition
//                         ) => ({
//                             key: filter.key,
//                             type: "select" as const ,

//                             label:
//                                 filter.label ||
//                                 filter.key,

//                             placeholder:
//                                 filter.label ||
//                                 filter.key,

//                             value:
//                                 selectedCustomFilters[
//                                 filter.key
//                                 ] || "",

//                             options:
//                                 customFilterOptions[
//                                 filter.key
//                                 ] || [],

//                             onChange: (
//                                 value: string
//                             ) => {
//                                 setSelectedCustomFilters(
//                                     (
//                                         previous
//                                     ) => ({
//                                         ...previous,

//                                         [filter.key]:
//                                             value,
//                                     })
//                                 );

//                                 setLocalOffset(0);
//                             },
//                         })
//                     ),
//                 ]}
//                 gridCols="4"
//                 onSearch={handleRefresh}
//                 onClear={handleClear}
//                 onDownloadPdf={() =>
//                     openExportPicker("pdf")
//                 }
//                 onDownloadExcel={() =>
//                     openExportPicker("excel")
//                 }
//                 pdfDisabled={
//                     !hasRegisterData ||
//                     pdfLoading ||
//                     excelLoading ||
//                     exportColumnsLoading
//                 }
//                 excelDisabled={
//                     !hasRegisterData ||
//                     excelLoading ||
//                     pdfLoading ||
//                     exportColumnsLoading
//                 }
//                 pdfLoading={
//                     pdfLoading ||
//                     (exportColumnsLoading &&
//                         exportType === "pdf")
//                 }
//                 excelLoading={
//                     excelLoading ||
//                     (exportColumnsLoading &&
//                         exportType ===
//                         "excel")
//                 }
//                 downloadDisabledMessage={
//                     !hasRegisterData
//                         ? "No data available to export."
//                         : "Please wait, export is processing."
//                 }
//             />

//             {dateError && (
//                 <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
//                     {dateError}
//                 </div>
//             )}

//             <DataTable
//                 columns={mainColumns}
//                 data={tableData}
//                 loading={
//                     openingStockLoading ||
//                     registerFilterDropdownLoading
//                 }
//                 emptyMessage="No opening stock register data found"
//                 showFieldSelector={false}
//                 actions={(row: any) => (
//                     <button
//                         type="button"
//                         onClick={(event) => {
//                             event.stopPropagation();
//                             handleViewVoucher(row);
//                         }}
//                         className="
//                             inline-flex cursor-pointer
//                             items-center gap-1
//                             rounded-lg bg-primary/10
//                             px-3 py-1.5 text-xs
//                             font-bold text-primary
//                             transition
//                             hover:bg-primary/20
//                         "
//                     >
//                         <Eye size={15} />
//                     </button>
//                 )}
//             />

//             <Modal
//                 show={exportModalVisible}
//                 setShow={
//                     setExportModalVisible
//                 }
//                 handleClose={
//                     closeExportModal
//                 }
//                 title={
//                     exportType === "pdf"
//                         ? "Select PDF Columns"
//                         : "Select Excel Columns"
//                 }
//                 maxWidth="xl"
//                 gridCols={1}
//                 hideFooter={true}
//                 bodyClassName="!block !p-0"
//                 body={
//                     <div className="flex min-h-0 flex-col">
//                         <div className="max-h-[60vh] flex-1 overflow-y-auto p-6">
//                             <p className="mb-5 text-sm text-muted-foreground">
//                                 Select the columns you want to include in the exported file.
//                             </p>

//                             {systemColumns.length >
//                                 0 && (
//                                     <div className="mb-6">
//                                         <div className="mb-2 flex items-center justify-between">
//                                             <h3 className="font-bold text-primary">
//                                                 System Columns
//                                             </h3>

//                                             <div className="flex gap-3 text-xs font-bold text-primary">
//                                                 <button
//                                                     type="button"
//                                                     onClick={() =>
//                                                         setSectionSelection(
//                                                             systemColumns,
//                                                             true
//                                                         )
//                                                     }
//                                                     className="cursor-pointer hover:underline"
//                                                 >
//                                                     Select All
//                                                 </button>

//                                                 <button
//                                                     type="button"
//                                                     onClick={() =>
//                                                         setSectionSelection(
//                                                             systemColumns,
//                                                             false
//                                                         )
//                                                     }
//                                                     className="cursor-pointer hover:underline"
//                                                 >
//                                                     Clear All
//                                                 </button>
//                                             </div>
//                                         </div>

//                                         {systemColumns.map(
//                                             (
//                                                 column: any
//                                             ) => (
//                                                 <Checkbox
//                                                     key={
//                                                         column.key
//                                                     }
//                                                     checked={selectedExportColumns.includes(
//                                                         column.key
//                                                     )}
//                                                     value={
//                                                         column.key
//                                                     }
//                                                     label={
//                                                         column.label ||
//                                                         column.header ||
//                                                         column.key
//                                                     }
//                                                     onChange={() =>
//                                                         toggleExportColumn(
//                                                             column.key
//                                                         )
//                                                     }
//                                                     className="border-b border-border py-3 hover:bg-muted/40"
//                                                 />
//                                             )
//                                         )}
//                                     </div>
//                                 )}

//                             {customColumns.length >
//                                 0 && (
//                                     <div>
//                                         <div className="mb-2 flex items-center justify-between">
//                                             <h3 className="font-bold text-primary">
//                                                 Custom Columns
//                                             </h3>

//                                             <div className="flex gap-3 text-xs font-bold text-primary">
//                                                 <button
//                                                     type="button"
//                                                     onClick={() =>
//                                                         setSectionSelection(
//                                                             customColumns,
//                                                             true
//                                                         )
//                                                     }
//                                                     className="cursor-pointer hover:underline"
//                                                 >
//                                                     Select All
//                                                 </button>

//                                                 <button
//                                                     type="button"
//                                                     onClick={() =>
//                                                         setSectionSelection(
//                                                             customColumns,
//                                                             false
//                                                         )
//                                                     }
//                                                     className="cursor-pointer hover:underline"
//                                                 >
//                                                     Clear All
//                                                 </button>
//                                             </div>
//                                         </div>

//                                         {customColumns.map(
//                                             (
//                                                 column: any
//                                             ) => (
//                                                 <Checkbox
//                                                     key={
//                                                         column.key
//                                                     }
//                                                     checked={selectedExportColumns.includes(
//                                                         column.key
//                                                     )}
//                                                     value={
//                                                         column.key
//                                                     }
//                                                     label={
//                                                         column.label ||
//                                                         column.header ||
//                                                         column.key
//                                                     }
//                                                     onChange={() =>
//                                                         toggleExportColumn(
//                                                             column.key
//                                                         )
//                                                     }
//                                                     className="border-b border-border py-3 hover:bg-muted/40"
//                                                 />
//                                             )
//                                         )}
//                                     </div>
//                                 )}

//                             {!systemColumns.length &&
//                                 !customColumns.length && (
//                                     <div className="py-8 text-center text-sm text-muted-foreground">
//                                         No export columns found.
//                                     </div>
//                                 )}
//                         </div>

//                         <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-secondary px-6 py-4">
//                             <button
//                                 type="button"
//                                 onClick={
//                                     closeExportModal
//                                 }
//                                 disabled={
//                                     pdfLoading ||
//                                     excelLoading
//                                 }
//                                 className="
//                                     cursor-pointer rounded-md
//                                     border border-border bg-card
//                                     px-4 py-2 text-sm
//                                     font-medium text-card-foreground
//                                     transition hover:bg-muted
//                                     disabled:cursor-not-allowed
//                                     disabled:opacity-50
//                                 "
//                             >
//                                 Cancel
//                             </button>

//                             <button
//                                 type="button"
//                                 onClick={
//                                     performExportDownload
//                                 }
//                                 disabled={
//                                     !selectedExportColumns.length ||
//                                     pdfLoading ||
//                                     excelLoading
//                                 }
//                                 className="
//                                     cursor-pointer rounded-md
//                                     bg-primary px-4 py-2
//                                     text-sm font-medium
//                                     text-primary-foreground
//                                     transition hover:opacity-90
//                                     disabled:cursor-not-allowed
//                                     disabled:opacity-50
//                                 "
//                             >
//                                 {pdfLoading ||
//                                     excelLoading
//                                     ? "Downloading..."
//                                     : exportType ===
//                                         "pdf"
//                                         ? "Download PDF"
//                                         : "Download Excel"}
//                             </button>
//                         </div>
//                     </div>
//                 }
//             />

//             <DynamicAddForm
//                 isView={true}
//                 show={viewModal}
//                 setShow={setViewModal}
//                 edit={false}
//                 title="View Opening Stock"
//                 subtitle="Opening stock details"
//                 loading={viewLoading}
//                 contentLoading={viewLoading}
//                 onClose={() => {
//                     setViewModal(false);
//                     setViewForm({});
//                     setViewErrors({});
//                 }}
//                 onSubmit={() => {}}
//                 form={viewForm}
//                 errors={viewErrors}
//                 handleAddRow={() => {}}
//                 handleDeleteRow={() => {}}
//                 handleRowChange={() => {}}
//                 inputData={viewInputData}
//                 bodyKey="openingStockBody"
//                 handleChange={() => {}}
//             />

//             {currentPagination?.totalDocs >
//                 0 && (
//                     <div className="mt-2">
//                         <Pagination
//                             localLimit={
//                                 localLimit
//                             }
//                             selectCb={(
//                                 event: any
//                             ) => {
//                                 setLocalLimit(
//                                     Number(
//                                         event.target
//                                             .value
//                                     )
//                                 );

//                                 setLocalOffset(0);
//                             }}
//                             preDisabled={
//                                 !currentPagination?.hasPrevPage
//                             }
//                             nextDisabled={
//                                 !currentPagination?.hasNextPage
//                             }
//                             setLocalOffset={
//                                 setLocalOffset
//                             }
//                             pagination={
//                                 currentPagination
//                             }
//                         />
//                     </div>
//                 )}
//         </div>
//     );
// };

// export default OpeningStockRegister;






import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";


import {
    clearRegisterFilterDropdowns,
    getRegisterFilterDropdowns,
} from "../../../redux/slices/professionalSlice/registerModule";

import professionalAxios from "../../../services/professionalAxios";
import {
   
    toDateInputValue,
    toLocalEndOfDayUtc,
    toLocalStartOfDayUtc,
} from "../../../utils/helperFunctions";
import { getOpeningStockRegister } from "../../../redux/slices/professionalSlice/register";

/* ===================================================
   TYPES
=================================================== */

type DropdownOption = {
    label: string;
    value: string;
};

type CustomFilterDefinition = {
    key: string;
    label?: string;
    type?: string;
    api?: string;
    customMasterCode?: string;
};

type ExportType = "pdf" | "excel";

/* ===================================================
   CONSTANTS
=================================================== */

const BOOKEZ_API_PREFIX = "/eTaxSolnMongoApiBackend";
const REGISTER_MODULE = "openingStock";

/* ===================================================
   COMMON HELPERS
=================================================== */

const formatDate = (value: any): string => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN");
};

const toNumber = (value: any): number => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    const parsedValue = Number(
        String(value)
            .replace(/,/g, "")
            .replace(/[₹\s]/g, "")
            .trim()
    );

    return Number.isFinite(parsedValue)
        ? parsedValue
        : 0;
};

const formatAmount = (value: any): string => {
    return toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatQuantity = (value: any): string => {
    return toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    });
};

const normalizeStatus = (value: any): string => {
    return String(value || "")
        .trim()
        .toLowerCase();
};

const resolveProfessionalApiPath = (
    apiPath: string
): string => {
    const normalizedPath = String(apiPath || "").trim();

    if (!normalizedPath) {
        return "";
    }

    if (normalizedPath.startsWith(BOOKEZ_API_PREFIX)) {
        return normalizedPath;
    }

    return `${BOOKEZ_API_PREFIX}${normalizedPath.startsWith("/")
        ? normalizedPath
        : `/${normalizedPath}`
        }`;
};

const mapCustomMasterOptions = (
    items: any[]
): DropdownOption[] => {
    return (items || [])
        .map((item: any) => ({
            label: String(
                item?.name ||
                item?.label ||
                item?.productName ||
                item?.warehouseName ||
                item?.godownName ||
                item?.code ||
                ""
            ).trim(),

            value: String(
                item?.code ||
                item?.value ||
                item?.productCode ||
                item?.warehouseCode ||
                item?.godownCode ||
                item?._id ||
                ""
            ).trim(),
        }))
        .filter(
            (item: DropdownOption) =>
                Boolean(item.label && item.value)
        );
};

/* ===================================================
   OPENING STOCK FIELD HELPERS
=================================================== */

const getVoucherNumber = (row: any): string => {
    return String(
        row?.opStockVoucherNumber ||
        row?.openingStockVoucherNumber ||
        row?.oStockVoucherNumber ||
        row?.voucherNumber ||
        row?.voucher ||
        ""
    ).trim();
};

const getVoucherDate = (row: any): any => {
    return (
        row?.openingStockDate ||
        row?.opStockVoucherDate ||
        row?.openingStockVoucherDate ||
        row?.oStockVoucherDate ||
        row?.voucherDate ||
        row?.openingDate ||
        row?.date ||
        ""
    );
};

const getBodyRows = (row: any): any[] => {
    if (Array.isArray(row?.openingStockBody)) {
        return row.openingStockBody;
    }

    if (Array.isArray(row?.opStockBody)) {
        return row.opStockBody;
    }

    if (Array.isArray(row?.oStockBody)) {
        return row.oStockBody;
    }

    if (Array.isArray(row?.products)) {
        return row.products;
    }

    if (Array.isArray(row?.items)) {
        return row.items;
    }

    if (
        row?.productCode ||
        row?.productName
    ) {
        return [row];
    }

    return [];
};

const getFooter = (row: any): any => {
    return (
        row?.openingStockFooter ||
        row?.opStockFooter ||
        row?.oStockFooter ||
        row?.footer ||
        {}
    );
};




const getQuantity = (row: any): number => {
    const footer = getFooter(row);

    if (footer?.totalQuantity !== undefined) {
        return toNumber(footer.totalQuantity);
    }

    if (
        row?.openingQuantity !== undefined
    ) {
        return toNumber(row.openingQuantity);
    }

    if (
        row?.stockQuantity !== undefined
    ) {
        return toNumber(row.stockQuantity);
    }

    if (row?.quantity !== undefined) {
        return toNumber(row.quantity);
    }

    return getBodyRows(row).reduce(
        (total: number, item: any) =>
            total +
            toNumber(
                item?.openingQuantity ??
                item?.stockQuantity ??
                item?.quantity ??
                0
            ),
        0
    );
};

const getRate = (row: any): number => {
    return toNumber(
        row?.openingRate ??
        row?.stockRate ??
        row?.rate ??
        row?.valuationRate ??
        getBodyRows(row)?.[0]?.openingRate ??
        getBodyRows(row)?.[0]?.stockRate ??
        getBodyRows(row)?.[0]?.rate ??
        getBodyRows(row)?.[0]?.valuationRate ??
        0
    );
};

const getStockValue = (row: any): number => {
    const footer = getFooter(row);

    const directValue =
        footer?.netAmount ??
        footer?.totalNetAmount ??
        footer?.stockValue ??
        footer?.totalStockValue ??
        row?.stockValue ??
        row?.openingStockValue ??
        row?.openingValue ??
        row?.netAmount ??
        row?.amount;

    if (
        directValue !== undefined &&
        directValue !== null &&
        directValue !== ""
    ) {
        return toNumber(directValue);
    }

    const body = getBodyRows(row);

    if (body.length) {
        return body.reduce(
            (total: number, item: any) => {
                const itemValue =
                    item?.stockValue ??
                    item?.openingStockValue ??
                    item?.openingValue ??
                    item?.netAmount ??
                    item?.amount;

                if (
                    itemValue !== undefined &&
                    itemValue !== null &&
                    itemValue !== ""
                ) {
                    return total + toNumber(itemValue);
                }

                const quantity = toNumber(
                    item?.openingQuantity ??
                    item?.stockQuantity ??
                    item?.quantity ??
                    0
                );

                const rate = toNumber(
                    item?.openingRate ??
                    item?.stockRate ??
                    item?.rate ??
                    item?.valuationRate ??
                    0
                );

                return total + quantity * rate;
            },
            0
        );
    }

    return getQuantity(row) * getRate(row);
};

// const getBatchNumber = (row: any): string => {
//     return String(
//         row?.batchNumber ||
//         row?.batchNo ||
//         getBodyRows(row)?.[0]?.batchNumber ||
//         getBodyRows(row)?.[0]?.batchNo ||
//         "-"
//     ).trim();
// };

const getStatus = (row: any): string => {
    return String(
        row?.opStockStatus ||
        row?.openingStockStatus ||
        row?.oStockStatus ||
        row?.status ||
        "-"
    );
};



const getStatusClass = (value: any): string => {
    const status = normalizeStatus(value);

    if (
        status === "approved" ||
        status === "active" ||
        status === "completed"
    ) {
        return "bg-success/10 text-success";
    }

    if (
        status === "rejected" ||
        status === "cancelled" ||
        status === "canceled"
    ) {
        return "bg-destructive/10 text-destructive";
    }

    if (
        status === "draft" ||
        status === "pending"
    ) {
        return "bg-warning/10 text-warning";
    }

    return "bg-muted text-muted-foreground";
};



/* ===================================================
   TABLE COLUMNS
=================================================== */


const mainColumns = [
    {
        key: "openingStockVoucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-semibold text-card-foreground">
                {getVoucherNumber(row) || "-"}
            </span>
        ),
    },
    {
        key: "openingStockDate",
        title: "Date",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {formatDate(getVoucherDate(row))}
            </span>
        ),
    },
   
   
   
    {
        key: "totalQuantity",
        title: "Total Qty",
        render: (row: any) => (
            <span className="font-semibold">
                {formatQuantity(
                    getFooter(row)?.totalQuantity ??
                    getQuantity(row)
                )}
            </span>
        ),
    },
    {
        key: "totalNetAmount",
        title: "Total Net",
        render: (row: any) => (
            <span className="whitespace-nowrap font-bold">
                ₹{formatAmount(
                    getFooter(row)?.totalNetAmount ??
                    getStockValue(row)
                )}
            </span>
        ),
    },
    {
        key: "openingStockStatus",
        title: "Status",
        render: (row: any) => {
            const status = getStatus(row);

            return (
                <span
                    className={`
                        inline-flex rounded-full px-3 py-1
                        text-xs font-bold uppercase
                        ${getStatusClass(status)}
                    `}
                >
                    {status}
                </span>
            );
        },
    },
];



/* ===================================================
   COMPONENT
=================================================== */

const OpeningStockRegister = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [dateError, setDateError] =
        useState("");

    const [product, setProduct] =
        useState("");

    const [
        selectedCustomFilters,
        setSelectedCustomFilters,
    ] = useState<Record<string, string>>({});

    const [
        customFilterOptions,
        setCustomFilterOptions,
    ] = useState<
        Record<string, DropdownOption[]>
    >({});

    /* ===================================================
       PAGINATION STATES
    =================================================== */

    const [localOffset, setLocalOffset] =
        useState(0);

    const [localLimit, setLocalLimit] =
        useState(20);

    const [refreshKey, setRefreshKey] =
        useState(0);

    /* ===================================================
       EXPORT STATES
    =================================================== */

    const [pdfLoading, setPdfLoading] =
        useState(false);

    const [excelLoading, setExcelLoading] =
        useState(false);

    /* ===================================================
       VIEW STATES
    =================================================== */

    const [viewModal, setViewModal] =
        useState(false);

    const [viewLoading, setViewLoading] =
        useState(false);

    const [viewForm, setViewForm] =
        useState<any>({});

    const [viewErrors, setViewErrors] =
        useState<any>({});


    /* ===================================================
       REDUX SELECTORS
    =================================================== */

    const { products = [] } = useSelector(
        (state: any) =>
            state.productMaster || {}
    );

    const {
        openingStockData = [],
        openingStocks = [],
        openingStockLoading = false,
        openingStockPagination = {},
        pagination: openingStockPaginationFallback = {},
    } = useSelector(
        (state: any) =>
            state.allRegisters || {}
    );

    const {
        filters: registerFilterDropdowns = [],
        loading:
        registerFilterDropdownLoading = false,
    } = useSelector(
        (state: any) =>
            state.registerFilterDropdown || {}
    );

    /* ===================================================
       CUSTOM FILTERS
    =================================================== */

    const customFilters:any = useMemo<
        CustomFilterDefinition[]
    >(() => {
        return Array.isArray(
            registerFilterDropdowns
        )
            ? registerFilterDropdowns
            : [];
    }, [registerFilterDropdowns]);

    const selectedCustomCodes = useMemo(() => {
        return customFilters
            .map(
                (filter: CustomFilterDefinition) =>
                    selectedCustomFilters[
                    filter.key
                    ] || ""
            )
            .filter(Boolean);
    }, [
        customFilters,
        selectedCustomFilters,
    ]);

    const selectedCustomCodesKey = useMemo(
        () => selectedCustomCodes.join("|"),
        [selectedCustomCodes]
    );

    /* ===================================================
       FILTER CHECK
    =================================================== */



    /* ===================================================
       PRODUCT OPTIONS
    =================================================== */

    const productOptions = useMemo(() => {
        return (products || [])
            .map((item: any) => ({
                label:
                    item?.productName || "",

                value:
                    item?.productCode || "",
            }))
            .filter(
                (item: DropdownOption) =>
                    Boolean(
                        item.label &&
                        item.value
                    )
            );
    }, [products]);

  
    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData = useMemo(() => {
        if (Array.isArray(openingStockData)) {
            return openingStockData;
        }

        if (Array.isArray(openingStockData?.openingStocks)) {
            return openingStockData.openingStocks;
        }

        if (Array.isArray(openingStocks)) {
            return openingStocks;
        }

        return [];
    }, [
        openingStockData,
        openingStocks,
    ]);

    const currentPagination = useMemo(() => {
        return (
            openingStockPagination ||
            openingStockData?.pagination ||
            openingStockPaginationFallback ||
            {}
        );
    }, [
        openingStockPagination,
        openingStockData,
        openingStockPaginationFallback,
    ]);

    const hasRegisterData = tableData.length > 0;

    const validateDates = (): boolean => {
        if (!fromDate && !toDate) {
            setDateError("");
            return true;
        }

        if (!fromDate || !toDate) {
            setDateError("Please select both From Date and To Date.");
            return false;
        }

        if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
            setDateError("From Date cannot be greater than To Date.");
            return false;
        }

        setDateError("");
        return true;
    };

    /* ===================================================
       API PAYLOAD
    =================================================== */

    const getPayload = (
        requestedExportType:
            | "pdf"
            | "excel"
            | "" = ""
    ) => {
        const isExport = Boolean(
            requestedExportType
        );

        return {
            productCode: product,

            fromDate: fromDate || "",
            toDate: toDate || "",

            customCodes:
                selectedCustomCodes.length
                    ? selectedCustomCodes
                    : [""],

            offset: isExport
                ? 0
                : localOffset,

            limit: isExport
                ? 120000
                : localLimit,

            exportType:
                requestedExportType,
        };
    };

    /* ===================================================
       LOAD PRODUCT MASTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllProducts({
                offset: 0,
                limit: 500,
                search: "",
            })
        );
    }, [dispatch]);

    /* ===================================================
       LOAD REGISTER FILTERS
    =================================================== */

    useEffect(() => {
        dispatch(
            getRegisterFilterDropdowns(
                REGISTER_MODULE
            )
        );

        return () => {
            dispatch(
                clearRegisterFilterDropdowns()
            );
        };
    }, [dispatch]);

    /* ===================================================
       LOAD CUSTOM FILTER OPTIONS
    =================================================== */

    useEffect(() => {
        let isMounted = true;

        const loadOptions = async () => {
            if (!customFilters.length) {
                setCustomFilterOptions({});
                setSelectedCustomFilters({});

                return;
            }

            const optionEntries =
                await Promise.all(
                    customFilters.map(
                        async (
                            filter: CustomFilterDefinition
                        ) => {
                            const apiPath =
                                resolveProfessionalApiPath(
                                    filter?.api || ""
                                );

                            if (
                                !filter?.key ||
                                !apiPath
                            ) {
                                return [
                                    filter?.key || "",
                                    [],
                                ] as const;
                            }

                            try {
                                const response =
                                    await professionalAxios.get(
                                        apiPath
                                    );

                                const items =
                                    response?.data
                                        ?.data?.items ||
                                    response?.data
                                        ?.items ||
                                    response?.data
                                        ?.data?.data
                                        ?.items ||
                                    response?.data
                                        ?.records ||
                                    [];

                                return [
                                    filter.key,

                                    mapCustomMasterOptions(
                                        Array.isArray(
                                            items
                                        )
                                            ? items
                                            : []
                                    ),
                                ] as const;
                            } catch (error) {
                                console.log(
                                    "Opening stock custom filter options failed:",
                                    filter.key,
                                    error
                                );

                                return [
                                    filter.key,
                                    [],
                                ] as const;
                            }
                        }
                    )
                );

            if (!isMounted) {
                return;
            }

            setCustomFilterOptions(
                Object.fromEntries(
                    optionEntries.filter(
                        ([key]) =>
                            Boolean(key)
                    )
                )
            );

            setSelectedCustomFilters(
                (previous) => {
                    const nextSelected: Record<
                        string,
                        string
                    > = {};

                    customFilters.forEach(
                        (
                            filter: CustomFilterDefinition
                        ) => {
                            if (
                                filter.key &&
                                previous[
                                filter.key
                                ]
                            ) {
                                nextSelected[
                                    filter.key
                                ] =
                                    previous[
                                    filter.key
                                    ];
                            }
                        }
                    );

                    return nextSelected;
                }
            );
        };

        loadOptions();

        return () => {
            isMounted = false;
        };
    }, [customFilters]);

    useEffect(() => {
        dispatch(
            getOpeningStockRegister(
                getPayload()
            )
        );
    }, [dispatch, fromDate, toDate, product, selectedCustomCodesKey, localOffset, localLimit, refreshKey]);

   
    /* ===================================================
       VIEW DATA
    =================================================== */

    const viewFooterTotals = useMemo(() => {
        return (viewForm?.openingStockBody || []).reduce(
            (acc: any, item: any) => {
                acc.totalQuantity += toNumber(item?.quantity);
                acc.totalGrossAmount += toNumber(item?.grossAmount);
                acc.totalDiscountAmount += toNumber(item?.discountAmount);
                acc.totalCgstAmount += toNumber(item?.cgstAmount);
                acc.totalSgstAmount += toNumber(item?.sgstAmount);
                acc.totalIgstAmount += toNumber(item?.igstAmount);
                acc.totalTaxAmount += toNumber(item?.taxAmount);
                acc.totalOtherAmount += toNumber(item?.otherAmount);
                acc.totalNetAmount += toNumber(
                    item?.netTotal ??
                    item?.netAmount
                );

                return acc;
            },
            {
                totalQuantity: 0,
                totalGrossAmount: 0,
                totalDiscountAmount: 0,
                totalCgstAmount: 0,
                totalSgstAmount: 0,
                totalIgstAmount: 0,
                totalTaxAmount: 0,
                totalOtherAmount: 0,
                totalNetAmount: 0,
            }
        );
    }, [viewForm?.openingStockBody]);

    const viewInputData = useMemo(() => {
        return {
            header: [
                {
                    key: "openingStockVoucherNumber",
                    label: "Voucher No",
                    type: "text",
                    disabled: true,
                },
                {
                    key: "openingStockDate",
                    label: "Date",
                    type: "date",
                    disabled: true,
                },
                {
                    key: "remark",
                    label: "Remark",
                    type: "text",
                    disabled: true,
                },
            ],

            body: [
                {
                    key: "productName",
                    title: "Product",
                    type: "text",
                    width: "220px",
                    disabled: true,
                },
                {
                    key: "description",
                    title: "Description",
                    type: "text",
                    width: "220px",
                    disabled: true,
                },
                {
                    key: "quantity",
                    title: "Qty",
                    type: "number",
                    width: "110px",
                    align: "right",
                    disabled: true,
                },
                {
                    key: "unitName",
                    title: "Unit",
                    type: "text",
                    width: "120px",
                    disabled: true,
                },
                {
                    key: "rate",
                    title: "Rate",
                    type: "number",
                    width: "120px",
                    align: "right",
                    disabled: true,
                },
                {
                    key: "grossAmount",
                    title: "Gross",
                    type: "number",
                    width: "130px",
                    align: "right",
                    disabled: true,
                },
                {
                    key: "taxAmount",
                    title: "Tax",
                    type: "number",
                    width: "120px",
                    align: "right",
                    disabled: true,
                },
                {
                    key: "netTotal",
                    title: "Net",
                    type: "number",
                    width: "130px",
                    align: "right",
                    disabled: true,
                },
                {
                    key: "remarks",
                    title: "Remarks",
                    type: "text",
                    width: "180px",
                    disabled: true,
                },
            ],

            footer: [
                {
                    key: "totalQuantity",
                    label: "Total Quantity",
                    value: viewFooterTotals.totalQuantity,
                    rawValue: viewFooterTotals.totalQuantity,
                },
                {
                    key: "totalGrossAmount",
                    label: "Gross Amount",
                    value: `₹${formatAmount(viewFooterTotals.totalGrossAmount)}`,
                    rawValue: viewFooterTotals.totalGrossAmount,
                },
                {
                    key: "totalTaxAmount",
                    label: "Tax Amount",
                    value: `₹${formatAmount(viewFooterTotals.totalTaxAmount)}`,
                    rawValue: viewFooterTotals.totalTaxAmount,
                },
                {
                    key: "totalNetAmount",
                    label: "Net Amount",
                    value: `₹${formatAmount(viewFooterTotals.totalNetAmount)}`,
                    rawValue: viewFooterTotals.totalNetAmount,
                },
            ],
        };
    }, [viewFooterTotals]);

    /* ===================================================
       FILTER HANDLERS
    =================================================== */

    const handleRefresh = () => {
        if (!validateDates()) return;

        setLocalOffset(0);

        setRefreshKey(
            (previous) => previous + 1
        );
    };

    const handleClear = () => {
        setDateError("");
        setFromDate("");
        setToDate("");
        setProduct("");
        setSelectedCustomFilters({});
        setLocalOffset(0);

        setRefreshKey(
            (previous) => previous + 1
        );
    };

    /* ===================================================
       VIEW HANDLER
    =================================================== */

    const handleViewVoucher = (row: any) => {
        const body = getBodyRows(row).map(
            (item: any, index: number) => ({
                ...item,
                id:
                    item?.id ||
                    `${Date.now()}-${index}`,
                productCode:
                    item?.productCode || "",
                productName:
                    item?.productName ||
                    item?.productCode ||
                    "",
                productId:
                    item?.productId ||
                    item?._id ||
                    "",
                description:
                    item?.description ||
                    item?.productDescription ||
                    "",
                remarks:
                    item?.remarks ??
                    item?.remark ??
                    "",
                quantity:
                    item?.quantity ?? "",
                unit:
                    item?.unit ||
                    item?.uom ||
                    "",
                unitName:
                    item?.unitName ||
                    item?.unit ||
                    item?.uom ||
                    "-",
                rate:
                    item?.rate ?? "",
                grossAmount:
                    item?.grossAmount ??
                    toNumber(item?.quantity) *
                    toNumber(item?.rate),
                discountPercentage:
                    item?.discountPercentage ??
                    item?.discount ??
                    "",
                discountAmount:
                    item?.discountAmount ?? 0,
                taxableAmount:
                    item?.taxableAmount ?? 0,
                cgstPercentage:
                    item?.cgstPercentage ??
                    item?.cgst ??
                    "",
                cgstAmount:
                    item?.cgstAmount ?? 0,
                sgstPercentage:
                    item?.sgstPercentage ??
                    item?.sgst ??
                    "",
                sgstAmount:
                    item?.sgstAmount ?? 0,
                igstPercentage:
                    item?.igstPercentage ??
                    item?.igst ??
                    "",
                igstAmount:
                    item?.igstAmount ?? 0,
                otherAmount:
                    item?.otherAmount ?? 0,
                taxAmount:
                    item?.taxAmount ?? 0,
                netTotal:
                    item?.netTotal ??
                    item?.netAmount ??
                    0,
            })
        );

        setViewErrors({});

        setViewForm({
            ...row,
            openingStockVoucherNumber:
                row?.openingStockVoucherNumber ||
                getVoucherNumber(row) ||
                "OPSTOCK",
            openingStockDate:
                row?.openingStockDate ||
                getVoucherDate(row) ||
                "",
            remark:
                row?.openingStockRemark ??
                row?.remark ??
                row?.remarks ??
                "-",
            openingStockRemark:
                row?.openingStockRemark ??
                row?.remark ??
                row?.remarks ??
                "",
            openingStockStatus:
                row?.openingStockStatus ||
                getStatus(row) ||
                "",
            openingStockBody:
                body,
            openingStockFooter: {
                ...(row?.openingStockFooter || {}),
                totalQuantity:
                    row?.openingStockFooter?.totalQuantity ??
                    body.reduce(
                        (sum: number, item: any) =>
                            sum + toNumber(item?.quantity),
                        0
                    ),
                totalGrossAmount:
                    row?.openingStockFooter?.totalGrossAmount ??
                    body.reduce(
                        (sum: number, item: any) =>
                            sum + toNumber(item?.grossAmount),
                        0
                    ),
                totalTaxAmount:
                    row?.openingStockFooter?.totalTaxAmount ??
                    body.reduce(
                        (sum: number, item: any) =>
                            sum + toNumber(item?.taxAmount),
                        0
                    ),
                totalNetAmount:
                    row?.openingStockFooter?.totalNetAmount ??
                    body.reduce(
                        (sum: number, item: any) =>
                            sum + toNumber(
                                item?.netTotal ??
                                item?.netAmount
                            ),
                        0
                    ),
            },
        });

        setViewLoading(false);
        setViewModal(true);
    };

    /* ===================================================
       DOWNLOAD HELPER
    =================================================== */

    const downloadBlobFile = (
        blob: Blob,
        fileName: string
    ) => {
        const url =
            window.URL.createObjectURL(
                blob
            );

        const link =
            document.createElement("a");

        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    };

    /* ===================================================
       EXPORT HANDLERS
    =================================================== */

    const handleExportDownload = async (
        requestedType: ExportType
    ) => {
        if (
            !hasRegisterData ||
            pdfLoading ||
            excelLoading ||
            !validateDates()
        ) {
            return;
        }

        try {
            if (requestedType === "pdf") {
                setPdfLoading(true);
            } else {
                setExcelLoading(true);
            }

            const response =
                await dispatch(
                    getOpeningStockRegister(
                        getPayload(
                            requestedType
                        )
                    )
                ).unwrap();

            if (response?.blob) {
                downloadBlobFile(
                    response.blob,
                    requestedType === "pdf"
                        ? "opening-stock-register.pdf"
                        : "opening-stock-register.xlsx"
                );
            }
        } catch (error: any) {
            console.log(
                `Opening stock register ${requestedType.toUpperCase()} download failed:`,
                error
            );

            toast.error(
                error?.message ||
                `Failed to download ${requestedType.toUpperCase()}`
            );
        } finally {
            setPdfLoading(false);
            setExcelLoading(false);
        }
    };

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Opening Stock Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate ? toDateInputValue(fromDate) : "",
                        required: false,

                        onChange: (
                            value: string
                        ) => {
                            setFromDate(
                                value
                                    ? toLocalStartOfDayUtc(value)
                                    : ""
                            );
                            setLocalOffset(0);
                            setDateError("");
                        },
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate ? toDateInputValue(toDate) : "",
                        required: false,

                        onChange: (
                            value: string
                        ) => {
                            setToDate(
                                value
                                    ? toLocalEndOfDayUtc(value)
                                    : ""
                            );
                            setLocalOffset(0);
                            setDateError("");
                        },
                    },
                    {
                        key: "product",
                        type: "select",
                        label: "Product",
                        placeholder:
                            "Select Product",
                        value: product,
                        options:
                            productOptions,

                        onChange: (
                            value: string
                        ) => {
                            setProduct(value);
                            setLocalOffset(0);
                        },
                    },

                    ...customFilters.map(
                        (
                            filter: CustomFilterDefinition
                        ) => ({
                            key: filter.key,
                            type: "select" as const ,

                            label:
                                filter.label ||
                                filter.key,

                            placeholder:
                                filter.label ||
                                filter.key,

                            value:
                                selectedCustomFilters[
                                filter.key
                                ] || "",

                            options:
                                customFilterOptions[
                                filter.key
                                ] || [],

                            onChange: (
                                value: string
                            ) => {
                                setSelectedCustomFilters(
                                    (
                                        previous
                                    ) => ({
                                        ...previous,

                                        [filter.key]:
                                            value,
                                    })
                                );

                                setLocalOffset(0);
                            },
                        })
                    ),
                ]}
                gridCols="3"
                onSearch={handleRefresh}
                onClear={handleClear}
                onDownloadPdf={() =>
                    handleExportDownload("pdf")
                }
                onDownloadExcel={() =>
                    handleExportDownload("excel")
                }
                pdfDisabled={
                    !hasRegisterData ||
                    pdfLoading ||
                    excelLoading
                }
                excelDisabled={
                    !hasRegisterData ||
                    excelLoading ||
                    pdfLoading
                }
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
                downloadDisabledMessage={
                    !hasRegisterData
                        ? "No data available to export."
                        : "Please wait, export is processing."
                }
            />

            {dateError && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    {dateError}
                </div>
            )}

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={
                    openingStockLoading ||
                    registerFilterDropdownLoading
                }
                emptyMessage="No opening stock register data found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleViewVoucher(row);
                        }}
                        className="
                            inline-flex cursor-pointer
                            items-center gap-1
                            rounded-lg bg-primary/10
                            px-3 py-1.5 text-xs
                            font-bold text-primary
                            transition
                            hover:bg-primary/20
                        "
                    >
                        <Eye size={15} />
                    </button>
                )}
            />



            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={false}
                title="View Opening Stock"
                subtitle="Opening stock details"
                loading={viewLoading}
                contentLoading={viewLoading}
                onClose={() => {
                    setViewModal(false);
                    setViewForm({});
                    setViewErrors({});
                }}
                onSubmit={() => {}}
                form={viewForm}
                errors={viewErrors}
                handleAddRow={() => {}}
                handleDeleteRow={() => {}}
                handleRowChange={() => {}}
                inputData={viewInputData}
                bodyKey="openingStockBody"
                handleChange={() => {}}
            />

            {currentPagination?.totalDocs >
                0 && (
                    <div className="mt-2">
                        <Pagination
                            localLimit={
                                localLimit
                            }
                            selectCb={(
                                event: any
                            ) => {
                                setLocalLimit(
                                    Number(
                                        event.target
                                            .value
                                    )
                                );

                                setLocalOffset(0);
                            }}
                            preDisabled={
                                !currentPagination?.hasPrevPage
                            }
                            nextDisabled={
                                !currentPagination?.hasNextPage
                            }
                            setLocalOffset={
                                setLocalOffset
                            }
                            pagination={
                                currentPagination
                            }
                        />
                    </div>
                )}
        </div>
    );
};

export default OpeningStockRegister;