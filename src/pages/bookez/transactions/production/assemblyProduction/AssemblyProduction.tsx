// import { useEffect, useMemo, useState } from "react";
// import { Edit, Trash2 } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { toast } from "react-toastify";

// import Badge from "../../../../../components/badge";
// import SearchInput from "../../../../../components/searchInput";
// import {
//     DataCreateButton,
//     DataREfreshButton,
// } from "../../../../../components/buttons";
// import DataTable from "../../../../../components/DataTable";
// import Pagination from "../../../../../components/pagination";
// import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
// import Toggle from "../../../../../components/toggle";
// import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";

// import { getAllProducts } from "../../../../../redux/slices/professionalSlice/productMasterSlice";

// import {
//     addAssemblyProduction,
//     deleteAssemblyProduction,
//     getAssemblyProductionList,
//     updateAssemblyProduction,
// } from "../../../../../redux/slices/professionalSlice/production/assemblyProductionSlice";

// /* ===================================================
//     COMMON HELPERS
// =================================================== */

// const defaultPagination = {
//     offset: 0,
//     limit: 10,
//     totalDocs: 0,
//     totalPages: 1,
//     currentPage: 1,
//     hasNextPage: false,
//     hasPrevPage: false,
// };

// const todayYMD = () => new Date().toISOString().split("T")[0];

// const num = (value: any) => Number(value || 0);

// const fmtMoney = (value: any) => Number(value || 0).toFixed(2);

// const money = (value: any) => `₹${fmtMoney(value)}`;

// const formatDateForInput = (date: any) => {
//     if (!date) return todayYMD();

//     return String(date).split("T")[0];
// };

// const formatDateForList = (date: any) => {
//     if (!date) return "-";

//     return new Date(date).toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//     });
// };

// /* ===================================================
//     EMPTY RAW MATERIAL ROW
// =================================================== */

// const emptyRawMaterialRow = {
//     id: Date.now(),
//     productCode: "",
//     productName: "",
//     productId: "",
//     quantity: "",
//     rate: "",
//     amount: 0,
// };

// /* ===================================================
//     DEFAULT FORM STRUCTURE
// =================================================== */

// const getDefaultForm = () => ({
//     voucherNumber: "ASP",
//     voucherDate: todayYMD(),
//     status: "open",
//     remarks: "",

//     finishedGoodProductCode: "",
//     finishedGoodProductName: "",
//     finishedGoodProductId: "",
//     finishedGoodQuantity: "",
//     finishedGoodRate: "",
//     finishedGoodAmount: 0,

//     rawMaterials: [{ ...emptyRawMaterialRow, id: Date.now() }],

//     totalRawMaterialCost: "0.00",
//     productionCost: "0.00",
//     totalFinishedCost: "0.00",

//     warehouseCode: "",
//     locationCode: "",
// });

// const AssemblyProduction = () => {
//     const dispatch = useDispatch<any>();

//     /* ===================================================
//         REDUX STATE
//     =================================================== */

//     const assemblyProductionState = useSelector(
//         (state: any) => state.assemblyProduction
//     );

//     const {
//         assemblyProductions = [],
//         pagination = defaultPagination,
//         addLoader = false,
//         updateLoader = false,
//         listingLoader = false,
//         deleteLoader = false,
//     } = assemblyProductionState || {};

//     /* ===================================================
//         LOCAL STATES
//     =================================================== */

//     const [localOffset, setLocalOffset] = useState(0);
//     const [localLimit, setLocalLimit] = useState(10);

//     const [search, setSearch] = useState("");
//     const [debouncedSearch, setDebouncedSearch] = useState("");

//     const [refreshing, setRefreshing] = useState(false);
//     const [status, setStatus] = useState("open");

//     const [showModal, setShowModal] = useState(false);
//     const [editingRecord, setEditingRecord] = useState<any>(null);

//     const [form, setForm] = useState<any>(getDefaultForm());
//     const [errors, setErrors] = useState<any>({});

//     const [finishedGoodOptions, setFinishedGoodOptions] = useState<any[]>([]);
//     const [rawMaterialOptions, setRawMaterialOptions] = useState<any[]>([]);

//     const [confirmTooltip, setConfirmTooltip] = useState<any>({
//         show: false,
//         x: null,
//         y: null,
//         voucherNumber: null,
//     });

//     /* ===================================================
//         OPTION HELPERS
//     =================================================== */

//     const getRecords = (res: any) => {
//         return Array.isArray(res?.items)
//             ? res.items
//             : Array.isArray(res?.records)
//                 ? res.records
//                 : Array.isArray(res?.data?.items)
//                     ? res.data.items
//                     : Array.isArray(res?.data?.records)
//                         ? res.data.records
//                         : Array.isArray(res?.data)
//                             ? res.data
//                             : Array.isArray(res)
//                                 ? res
//                                 : [];
//     };

//     const makeProductOptions = (res: any) => {
//         return getRecords(res).map((item: any) => ({
//             label: item.productName || item.name || item.productCode || "-",
//             value: item.productCode || item.code || item._id,
//             raw: item,
//         }));
//     };

//     const getProductRate = (product: any, fallback = "") => {
//         return String(
//             product?.sellingPrice ||
//             product?.productSellingPrice ||
//             product?.salesRate ||
//             product?.saleRate ||
//             product?.purchasePrice ||
//             product?.productPurchasePrice ||
//             product?.rate ||
//             fallback ||
//             ""
//         );
//     };

//     const getVoucherNumber = (record: any) => {
//         return (
//             record?.voucherNumber ||
//             record?.assemblyProductionVoucherNumber ||
//             record?.assemblyVoucherNumber ||
//             ""
//         );
//     };

//     /* ===================================================
//         CALCULATION HELPERS
//     =================================================== */

//     const calculateAmount = (quantity: any, rate: any) => {
//         return num(quantity) * num(rate);
//     };

//     const calculateRawMaterialRow = (row: any) => {
//         return {
//             ...row,
//             quantity: row.quantity,
//             rate: row.rate,
//             amount: calculateAmount(row.quantity, row.rate),
//         };
//     };

//     const cleanRawMaterials = () => {
//         return (form.rawMaterials || [])
//             .filter((row: any) => {
//                 return row.productCode || row.quantity || row.rate;
//             })
//             .map((row: any) => calculateRawMaterialRow(row));
//     };

//     const totalRawMaterialCost = useMemo(() => {
//         return (form.rawMaterials || []).reduce((sum: number, item: any) => {
//             return sum + num(item.amount);
//         }, 0);
//     }, [form.rawMaterials]);

//     const finishedGoodAmount = useMemo(() => {
//         return calculateAmount(form.finishedGoodQuantity, form.finishedGoodRate);
//     }, [form.finishedGoodQuantity, form.finishedGoodRate]);

//     const totalFinishedCost = useMemo(() => {
//         return totalRawMaterialCost + num(form.productionCost);
//     }, [totalRawMaterialCost, form.productionCost]);

//     /* ===================================================
//         FETCH DROPDOWNS
//     =================================================== */

//     useEffect(() => {
//         const fetchDropdowns = async () => {
//             try {
//                 const [finishedGoodRes, rawMaterialRes]: any =
//                     await Promise.all([
//                         dispatch(
//                             getAllProducts({
//                                 offset: 0,
//                                 limit: 200,
//                                 search: "",
//                                 productType: "finishedgoods",
//                             }) as any
//                         ).unwrap(),

//                         dispatch(
//                             getAllProducts({
//                                 offset: 0,
//                                 limit: 200,
//                                 search: "",
//                                 productType: "rawmaterial",
//                             }) as any
//                         ).unwrap(),
//                     ]);

//                 setFinishedGoodOptions(makeProductOptions(finishedGoodRes));
//                 setRawMaterialOptions(makeProductOptions(rawMaterialRes));
//             } catch (err: any) {
//                 toast.error(err?.message || "Failed to load products");
//             }
//         };

//         fetchDropdowns();
//     }, [dispatch]);

//     /* ===================================================
//         FETCH LIST
//     =================================================== */

//     const fetchAssemblyProductions = async () => {
//         await dispatch(
//             getAssemblyProductionList({
//                 offset: localOffset,
//                 limit: localLimit,
//                 search: debouncedSearch,
//                 status,
//             }) as any
//         );
//     };

//     useEffect(() => {
//         fetchAssemblyProductions();
//     }, [localOffset, localLimit, debouncedSearch, status]);

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             setDebouncedSearch(search.trim());
//             setLocalOffset(0);
//         }, 400);

//         return () => clearTimeout(timer);
//     }, [search]);

//     /* ===================================================
//         LIST TABLE COLUMNS
//     =================================================== */

//     const columns = [
//         {
//             key: "voucherNumber",
//             title: "Voucher No",
//             render: (row: any) => getVoucherNumber(row) || "-",
//         },
//         {
//             key: "voucherDate",
//             title: "Date",
//             render: (row: any) => formatDateForList(row?.voucherDate),
//         },
//         {
//             key: "finishedGood",
//             title: "Finished Good",
//             render: (row: any) => (
//                 <div>
//                     <div className="font-medium text-slate-800">
//                         {row?.finishedGood?.productName || "-"}
//                     </div>
//                     <div className="text-xs text-slate-500">
//                         {row?.finishedGood?.productCode || "-"}
//                     </div>
//                 </div>
//             ),
//         },
//         {
//             key: "finishedQty",
//             title: "FG Qty",
//             render: (row: any) => row?.finishedGood?.quantity || "0",
//         },
//         {
//             key: "rawMaterials",
//             title: "Raw Items",
//             render: (row: any) => row?.rawMaterials?.length || 0,
//         },
//         {
//             key: "totalRawMaterialCost",
//             title: "Raw Cost",
//             render: (row: any) => (
//                 <span className="font-medium text-slate-700">
//                     {money(row?.totalRawMaterialCost || 0)}
//                 </span>
//             ),
//         },
//         {
//             key: "productionCost",
//             title: "Production Cost",
//             render: (row: any) => (
//                 <span className="font-medium text-slate-700">
//                     {money(row?.productionCost || 0)}
//                 </span>
//             ),
//         },
//         {
//             key: "totalFinishedCost",
//             title: "Finished Cost",
//             render: (row: any) => (
//                 <span className="font-semibold text-indigo-700">
//                     {money(row?.totalFinishedCost || 0)}
//                 </span>
//             ),
//         },
//         {
//             key: "status",
//             title: "Status",
//             render: (row: any) => (
//                 <span
//                     className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.status === "open"
//                         ? "border-green-200 bg-green-50 text-green-700"
//                         : "border-red-200 bg-red-50 text-red-700"
//                         }`}
//                 >
//                     {row?.status || "-"}
//                 </span>
//             ),
//         },
//     ];

//     /* ===================================================
//         BASIC HANDLERS
//     =================================================== */

//     const handleStatusChange = (nextStatus: string) => {
//         setStatus(nextStatus);
//         setLocalOffset(0);
//     };

//     const handleRefresh = async () => {
//         setRefreshing(true);

//         try {
//             await fetchAssemblyProductions();
//             toast.success("Assembly production list refreshed");
//         } catch (err: any) {
//             toast.error(err?.message || "Failed to refresh list");
//         } finally {
//             setRefreshing(false);
//         }
//     };

//     const resetMainForm = () => {
//         setEditingRecord(null);
//         setErrors({});
//         setForm(getDefaultForm());
//     };

//     const openAddModal = () => {
//         resetMainForm();
//         setShowModal(true);
//     };

//     const openEditModal = (record: any) => {
//         const finishedGood = record?.finishedGood || {};

//         const rawMaterials =
//             record?.rawMaterials?.length > 0
//                 ? record.rawMaterials.map((item: any) =>
//                     calculateRawMaterialRow({
//                         id: item?.id || Date.now() + Math.random(),
//                         productCode: item?.productCode || "",
//                         productName: item?.productName || "",
//                         productId: item?.productId || "",
//                         quantity: item?.quantity || "",
//                         rate: item?.rate || "",
//                         amount: item?.amount || 0,
//                     })
//                 )
//                 : [{ ...emptyRawMaterialRow, id: Date.now() }];

//         setEditingRecord(record);
//         setErrors({});

//         setForm({
//             voucherNumber: getVoucherNumber(record) || "ASP",
//             voucherDate: formatDateForInput(record?.voucherDate),
//             status: record?.status || "open",
//             remarks: record?.remarks || "",

//             finishedGoodProductCode: finishedGood?.productCode || "",
//             finishedGoodProductName: finishedGood?.productName || "",
//             finishedGoodProductId: finishedGood?.productId || "",
//             finishedGoodQuantity: finishedGood?.quantity || "",
//             finishedGoodRate: finishedGood?.rate || "",
//             finishedGoodAmount:
//                 finishedGood?.amount ||
//                 calculateAmount(finishedGood?.quantity, finishedGood?.rate),

//             rawMaterials,

//             totalRawMaterialCost: record?.totalRawMaterialCost || "0.00",
//             productionCost: record?.productionCost || "0.00",
//             totalFinishedCost: record?.totalFinishedCost || "0.00",

//             warehouseCode: record?.warehouseCode || "",
//             locationCode: record?.locationCode || "",
//         });

//         setShowModal(true);
//     };

//     /* ===================================================
//         HEADER FORM CHANGE
//     =================================================== */

//     const handleMainChange = (key: string, value: any) => {
//         setForm((prev: any) => {
//             const updated = {
//                 ...prev,
//                 [key]: value,
//             };

//             if (key === "finishedGoodProductCode") {
//                 const selectedProduct = finishedGoodOptions.find(
//                     (item: any) => item.value === value
//                 );

//                 const product = selectedProduct?.raw;

//                 updated.finishedGoodProductCode = value;
//                 updated.finishedGoodProductName = selectedProduct?.label || "";
//                 updated.finishedGoodProductId = product?._id || "";
//                 updated.finishedGoodRate = getProductRate(product, "");
//                 updated.finishedGoodAmount = calculateAmount(
//                     updated.finishedGoodQuantity,
//                     updated.finishedGoodRate
//                 );
//             }

//             if (key === "finishedGoodQuantity" || key === "finishedGoodRate") {
//                 updated.finishedGoodAmount = calculateAmount(
//                     key === "finishedGoodQuantity"
//                         ? value
//                         : updated.finishedGoodQuantity,
//                     key === "finishedGoodRate" ? value : updated.finishedGoodRate
//                 );
//             }

//             return updated;
//         });

//         setErrors((prev: any) => ({
//             ...prev,
//             [key]: "",
//         }));
//     };

//     /* ===================================================
//         RAW MATERIAL ROW HANDLERS
//     =================================================== */

//     const handleAddRow = () => {
//         if (rawMaterialOptions.length === 0) {
//             toast.error("Please create at least one raw material first");
//             return;
//         }

//         setForm((prev: any) => ({
//             ...prev,
//             rawMaterials: [
//                 ...(prev.rawMaterials || []),
//                 {
//                     ...emptyRawMaterialRow,
//                     id: Date.now(),
//                 },
//             ],
//         }));
//     };

//     const handleDeleteRow = (index: number) => {
//         setForm((prev: any) => {
//             const updatedRawMaterials = prev.rawMaterials.filter(
//                 (_: any, i: number) => i !== index
//             );

//             return {
//                 ...prev,
//                 rawMaterials:
//                     updatedRawMaterials.length > 0
//                         ? updatedRawMaterials
//                         : [{ ...emptyRawMaterialRow, id: Date.now() }],
//             };
//         });
//     };

//     const handleRowChange = (index: number, key: string, value: any) => {
//         setForm((prev: any) => {
//             const updatedRawMaterials = [...(prev.rawMaterials || [])];

//             let updatedRow = {
//                 ...updatedRawMaterials[index],
//                 [key]: value,
//             };

//             if (key === "productCode") {
//                 const selectedProduct = rawMaterialOptions.find(
//                     (item: any) => item.value === value
//                 );

//                 const product = selectedProduct?.raw;

//                 updatedRow.productCode = value;
//                 updatedRow.productName = selectedProduct?.label || "";
//                 updatedRow.productId = product?._id || "";
//                 updatedRow.rate = getProductRate(product, "");
//             }

//             updatedRow = calculateRawMaterialRow(updatedRow);
//             updatedRawMaterials[index] = updatedRow;

//             return {
//                 ...prev,
//                 rawMaterials: updatedRawMaterials,
//             };
//         });

//         setErrors((prev: any) => ({
//             ...prev,
//             rawMaterials: "",
//             [`row_${index}_${key}`]: "",
//         }));
//     };

//     /* ===================================================
//         VALIDATION
//     =================================================== */

//     const validateForm = () => {
//         const err: any = {};

//         if (!form.voucherDate) {
//             err.voucherDate = "Date is required";
//         }

//         if (!form.status) {
//             err.status = "Status is required";
//         }

//         if (!form.finishedGoodProductCode) {
//             err.finishedGoodProductCode = "Finished good is required";
//         }

//         if (!form.finishedGoodQuantity || num(form.finishedGoodQuantity) <= 0) {
//             err.finishedGoodQuantity = "Finished good quantity is required";
//         }

//         if (!form.finishedGoodRate || num(form.finishedGoodRate) <= 0) {
//             err.finishedGoodRate = "Finished good rate is required";
//         }

//         const filledRows = cleanRawMaterials();

//         if (filledRows.length === 0) {
//             err.rawMaterials = "Please add at least one raw material";
//         }

//         form.rawMaterials.forEach((row: any, index: number) => {
//             const hasAnyValue = row.productCode || row.quantity || row.rate;

//             if (!hasAnyValue) return;

//             if (!row.productCode) {
//                 err[`row_${index}_productCode`] = "Product is required";
//             }

//             if (!row.quantity || num(row.quantity) <= 0) {
//                 err[`row_${index}_quantity`] = "Quantity is required";
//             }

//             if (!row.rate || num(row.rate) <= 0) {
//                 err[`row_${index}_rate`] = "Rate is required";
//             }
//         });

//         setErrors(err);

//         if (err.rawMaterials) {
//             toast.error(err.rawMaterials);
//         }

//         return Object.keys(err).length === 0;
//     };

//     /* ===================================================
//         SAVE / UPDATE
//     =================================================== */

//     const handleSubmit = async () => {
//         if (!validateForm()) return;

//         const rawMaterials = cleanRawMaterials();

//         const rawTotal = rawMaterials.reduce((sum: number, item: any) => {
//             return sum + num(item.amount);
//         }, 0);

//         const fgAmount = calculateAmount(
//             form.finishedGoodQuantity,
//             form.finishedGoodRate
//         );

//         const payload = {
//             voucherDate: form.voucherDate,
//             status: form.status || "open",
//             remarks: form.remarks || "",

//             finishedGood: {
//                 productCode: form.finishedGoodProductCode,
//                 productName: form.finishedGoodProductName,
//                 productId: form.finishedGoodProductId,
//                 quantity: String(form.finishedGoodQuantity),
//                 rate: String(form.finishedGoodRate),
//                 amount: fmtMoney(fgAmount),
//             },

//             rawMaterials: rawMaterials.map((item: any) => ({
//                 productCode: item.productCode,
//                 productName: item.productName,
//                 productId: item.productId,
//                 quantity: String(item.quantity),
//                 rate: String(item.rate),
//                 amount: fmtMoney(item.amount),
//             })),

//             totalRawMaterialCost: fmtMoney(rawTotal),
//             productionCost: fmtMoney(form.productionCost),
//             totalFinishedCost: fmtMoney(rawTotal + num(form.productionCost)),

//             warehouseCode: form.warehouseCode || "",
//             locationCode: form.locationCode || "",
//         };

//         try {
//             if (editingRecord) {
//                 const assemblyProductionVoucherNumber =
//                     getVoucherNumber(editingRecord);

//                 if (!assemblyProductionVoucherNumber) {
//                     toast.error("Voucher number not found");
//                     return;
//                 }

//                 await dispatch(
//                     updateAssemblyProduction({
//                         assemblyProductionVoucherNumber,
//                         payload,
//                     }) as any
//                 ).unwrap();

//                 toast.success("Assembly production updated successfully");
//             } else {
//                 await dispatch(addAssemblyProduction({ payload }) as any).unwrap();

//                 toast.success("Assembly production created successfully");
//             }

//             setShowModal(false);
//             resetMainForm();
//             fetchAssemblyProductions();
//         } catch (err: any) {
//             toast.error(err?.message || "Operation failed");
//         }
//     };

//     /* ===================================================
//         DELETE
//     =================================================== */

//     const handleDeleteConfirm = async () => {
//         try {
//             if (!confirmTooltip.voucherNumber) return;

//             await dispatch(
//                 deleteAssemblyProduction({
//                     assemblyProductionVoucherNumber:
//                         confirmTooltip.voucherNumber,
//                 }) as any
//             ).unwrap();

//             toast.success("Assembly production deleted");
//             fetchAssemblyProductions();
//         } catch (err: any) {
//             toast.error(err?.message || "Failed to delete assembly production");
//         } finally {
//             setConfirmTooltip({
//                 show: false,
//                 x: null,
//                 y: null,
//                 voucherNumber: null,
//             });
//         }
//     };

//     /* ===================================================
//         DYNAMIC FORM STRUCTURE
//     =================================================== */

//     const inputData = {
//         header: [
//             {
//                 key: "voucherNumber",
//                 label: "Voucher No",
//                 type: "text",
//                 disabled: true,
//             },
//             {
//                 key: "voucherDate",
//                 label: "Date",
//                 type: "date",
//                 required: true,
//             },
//             {
//                 key: "status",
//                 label: "Status",
//                 type: "select",
//                 required: true,
//                 options: [
//                     { label: "Open", value: "open" },
//                     { label: "Close", value: "close" },
//                 ],
//             },

//             {
//                 key: "remarks",
//                 label: "Remark",
//                 type: "textarea",
//                 required: false,
//                 placeholder: "Enter Remark",
//             },

//         ],

//         headerChild: [
//             {
//                 key: "finishedGoodProductCode",
//                 label: "Finished Good",
//                 type: "select",
//                 required: true,
//                 placeholder: "Select Finished Good",
//                 options: finishedGoodOptions,
//             },
//             {
//                 key: "finishedGoodQuantity",
//                 label: "Finished Qty",
//                 type: "number",
//                 required: true,
//                 placeholder: "Enter Quantity",
//             },
//             {
//                 key: "finishedGoodRate",
//                 label: "Finished Rate",
//                 type: "number",
//                 required: true,
//                 placeholder: "Enter Rate",
//             },
//             {
//                 key: "finishedGoodAmount",
//                 label: "Finished Amount",
//                 type: "number",
//                 disabled: true,
//             },
//             // {
//             //     key: "productionCost",
//             //     label: "Production Cost",
//             //     type: "number",
//             //     placeholder: "Enter Production Cost",
//             // },

//             // {
//             //     key: "warehouseCode",
//             //     label: "Warehouse Code",
//             //     type: "text",
//             //     required: false,
//             //     placeholder: "Enter Warehouse Code",
//             // },
//             // {
//             //     key: "locationCode",
//             //     label: "Location Code",
//             //     type: "text",
//             //     required: false,
//             //     placeholder: "Enter Location Code",
//             // },


//         ],

//         body: [
//             {
//                 key: "productCode",
//                 label: "Raw Material",
//                 type: "select",
//                 width: "260px",
//                 required: true,
//                 options: rawMaterialOptions,
//             },
//             {
//                 key: "productName",
//                 label: "Name",
//                 type: "text",
//                 width: "260px",
//                 disabled: true,
//             },
//             {
//                 key: "quantity",
//                 label: "Qty",
//                 type: "number",
//                 width: "130px",
//                 required: true,
//                 // align: "right",
//             },
//             {
//                 key: "rate",
//                 label: "Rate",
//                 type: "number",
//                 width: "140px",
//                 required: true,
//                 // align: "right",
//             },
//             {
//                 key: "amount",
//                 label: "Amount",
//                 type: "number",
//                 width: "150px",
//                 disabled: true,
//                 // align: "right",
//             },
//         ],

//         footer: [
//             {
//                 label: "Raw Material Cost",
//                 value: money(totalRawMaterialCost),
//             },
//             {
//                 label: "Production Cost",
//                 value: money(form.productionCost),
//             },
//             {
//                 label: "Finished Good Amount",
//                 value: money(finishedGoodAmount),
//             },
//             {
//                 label: "Total Finished Cost",
//                 value: money(totalFinishedCost),
//             },
//         ],
//     };

//     return (
//         <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
//             {/* ================= HEADER ================= */}
//             <div
//                 id="assembly-production-header"
//                 className="mb-3 flex items-center"
//             >
//                 <div
//                     id="assembly-production-summary"
//                     className="flex items-start gap-3"
//                 >
//                     <Badge
//                         {...{
//                             count: pagination?.totalDocs ?? 0,
//                             text: "Total Assembly Productions:",
//                             varient: "primary",
//                         }}
//                     />
//                 </div>

//                 <div className="ml-auto flex items-center gap-2">
//                     <Toggle
//                         {...{
//                             arr: ["open", "close"],
//                             state: status,
//                             setState: handleStatusChange,
//                         }}
//                     />

//                     <SearchInput {...{ search, setSearch }} />

//                     <DataREfreshButton
//                         {...{
//                             callBackFn: handleRefresh,
//                             loading: refreshing,
//                         }}
//                     />

//                     {/* @ts-ignore */}
//                     <DataCreateButton
//                         {...{
//                             callBackFn: openAddModal,
//                             text: "Add Assembly Production",
//                         }}
//                     />
//                 </div>
//             </div>

//             {/* ================= LIST TABLE ================= */}
//             <DataTable
//                 columns={columns}
//                 data={assemblyProductions}
//                 loading={listingLoader}
//                 emptyMessage={`No ${status} assembly production found`}
//                 actions={(record: any) => (
//                     <div className="flex items-center gap-2">
//                         <button
//                             id="assembly-production-edit-button"
//                             onClick={() => openEditModal(record)}
//                             className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
//                         >
//                             <Edit size={16} />
//                         </button>

//                         <button
//                             id="assembly-production-delete-button"
//                             disabled={deleteLoader}
//                             onClick={(e) => {
//                                 const rect =
//                                     e.currentTarget.getBoundingClientRect();

//                                 let x = rect.left - 150;
//                                 if (x < 10) x = 10;

//                                 const y = rect.top + window.scrollY - 5;

//                                 setConfirmTooltip({
//                                     show: true,
//                                     x,
//                                     y,
//                                     voucherNumber: getVoucherNumber(record),
//                                 });
//                             }}
//                             className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
//                         >
//                             <Trash2 size={16} />
//                         </button>
//                     </div>
//                 )}
//             />

//             {/* ================= PAGINATION ================= */}
//             {pagination?.totalDocs > 0 && (
//                 <Pagination
//                     {...{
//                         localLimit,
//                         selectCb: (e: any) => {
//                             setLocalLimit(Number(e.target.value));
//                             setLocalOffset(0);
//                         },
//                         preDisabled: !pagination?.hasPrevPage,
//                         nextDisabled: !pagination?.hasNextPage,
//                         setLocalOffset,
//                         pagination,
//                     }}
//                 />
//             )}

//             {/* ================= DELETE CONFIRM TOOLTIP ================= */}
//             {confirmTooltip.show && (
//                 <ConfirmTooltip
//                     x={confirmTooltip.x}
//                     y={confirmTooltip.y}
//                     message="Are you sure you want to delete this assembly production?"
//                     confirmText="Delete"
//                     cancelText="Cancel"
//                     onConfirm={handleDeleteConfirm}
//                     onCancel={() =>
//                         setConfirmTooltip({
//                             show: false,
//                             x: null,
//                             y: null,
//                             voucherNumber: null,
//                         })
//                     }
//                 />
//             )}

//             {/* ================= ADD / UPDATE FORM ================= */}
//             <DynamicAddForm
//                 {...{
//                     show: showModal,
//                     setShow: setShowModal,
//                     edit: Boolean(editingRecord),
//                     title: "Assembly Production",
//                     subtitle: "Fill in the assembly production details below",
//                     loading: addLoader || updateLoader,
//                     onClose: () => {
//                         setShowModal(false);
//                         resetMainForm();
//                     },
//                     onSubmit: handleSubmit,
//                     form,
//                     errors,
//                     handleAddRow,
//                     handleDeleteRow,
//                     handleRowChange,
//                     inputData,
//                     bodyKey: "rawMaterials",
//                     handleChange: handleMainChange,
//                 }}
//             />
//         </div>
//     );
// };

// export default AssemblyProduction;




import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import Badge from "../../../../../components/badge";
import SearchInput from "../../../../../components/searchInput";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../../components/buttons";
import DataTable from "../../../../../components/DataTable";
import Pagination from "../../../../../components/pagination";
import ConfirmTooltip from "../../../../../components/common/ConfirmTooltip";
import Toggle from "../../../../../components/toggle";
import DynamicAddForm from "../../../../../components/voucher/dynamicAddForm";

import { getAllProducts } from "../../../../../redux/slices/professionalSlice/productMasterSlice";

import {
    addAssemblyProduction,
    deleteAssemblyProduction,
    getAssemblyProductionList,
    updateAssemblyProduction,
} from "../../../../../redux/slices/professionalSlice/production/assemblyProductionSlice";

/* ===================================================
    COMMON HELPERS
=================================================== */

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const todayYMD = () => new Date().toISOString().split("T")[0];

const num = (value: any) => Number(value || 0);

const fmtMoney = (value: any) => Number(value || 0).toFixed(2);

const money = (value: any) => `₹${fmtMoney(value)}`;

const formatDateForInput = (date: any) => {
    if (!date) return todayYMD();

    return String(date).split("T")[0];
};

const formatDateForList = (date: any) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

/* ===================================================
    EMPTY RAW MATERIAL ROW
=================================================== */

const emptyRawMaterialRow = {
    id: Date.now(),
    productCode: "",
    productName: "",
    productId: "",
    quantity: "",
    rate: "",
    amount: 0,
};

/* ===================================================
    DEFAULT FORM STRUCTURE
=================================================== */

const getDefaultForm = () => ({
    voucherNumber: "ASP",
    voucherDate: todayYMD(),
    status: "open",
    remarks: "",

    finishedGoodProductCode: "",
    finishedGoodProductName: "",
    finishedGoodProductId: "",
    finishedGoodQuantity: "",
    finishedGoodRate: "",
    finishedGoodAmount: 0,

    rawMaterials: [{ ...emptyRawMaterialRow, id: Date.now() }],

    totalRawMaterialCost: "0.00",
    productionCost: "0.00",
    totalFinishedCost: "0.00",

    warehouseCode: "",
    locationCode: "",
});

const AssemblyProduction = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
        REDUX STATE
    =================================================== */

    const assemblyProductionState = useSelector(
        (state: any) => state.assemblyProduction
    );

    const {
        assemblyProductions = [],
        pagination = defaultPagination,
        addLoader = false,
        updateLoader = false,
        listingLoader = false,
        deleteLoader = false,
    } = assemblyProductionState || {};

    /* ===================================================
        LOCAL STATES
    =================================================== */

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [refreshing, setRefreshing] = useState(false);
    const [status, setStatus] = useState("open");

    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);

    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});

    const [finishedGoodOptions, setFinishedGoodOptions] = useState<any[]>([]);
    const [rawMaterialOptions, setRawMaterialOptions] = useState<any[]>([]);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        voucherNumber: null,
    });

    /* ===================================================
        OPTION HELPERS
    =================================================== */

    const getRecords = (res: any) => {
        return Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.data?.items)
                    ? res.data.items
                    : Array.isArray(res?.data?.records)
                        ? res.data.records
                        : Array.isArray(res?.data)
                            ? res.data
                            : Array.isArray(res)
                                ? res
                                : [];
    };

    const makeProductOptions = (res: any) => {
        return getRecords(res).map((item: any) => ({
            label: item.productName || item.name || item.productCode || "-",
            value: item.productCode || item.code || item._id,
            raw: item,
        }));
    };

    const getProductRate = (product: any, fallback = "") => {
        return String(
            product?.sellingPrice ||
                product?.productSellingPrice ||
                product?.salesRate ||
                product?.saleRate ||
                product?.purchasePrice ||
                product?.productPurchasePrice ||
                product?.rate ||
                fallback ||
                ""
        );
    };

    const getVoucherNumber = (record: any) => {
        return (
            record?.voucherNumber ||
            record?.assemblyProductionVoucherNumber ||
            record?.assemblyVoucherNumber ||
            ""
        );
    };

    /* ===================================================
        CALCULATION HELPERS
    =================================================== */

    const calculateAmount = (quantity: any, rate: any) => {
        return num(quantity) * num(rate);
    };

    const calculateRawMaterialRow = (row: any) => {
        return {
            ...row,
            amount: calculateAmount(row.quantity, row.rate),
        };
    };

    const cleanRawMaterials = () => {
        return (form.rawMaterials || [])
            .filter((row: any) => row.productCode || row.quantity || row.rate)
            .map((row: any) => calculateRawMaterialRow(row));
    };

    const totalRawMaterialCost = useMemo(() => {
        return (form.rawMaterials || []).reduce((sum: number, item: any) => {
            return sum + num(item.amount);
        }, 0);
    }, [form.rawMaterials]);

    const finishedGoodAmount = useMemo(() => {
        return calculateAmount(form.finishedGoodQuantity, form.finishedGoodRate);
    }, [form.finishedGoodQuantity, form.finishedGoodRate]);

    const totalFinishedCost = useMemo(() => {
        return totalRawMaterialCost + num(form.productionCost);
    }, [totalRawMaterialCost, form.productionCost]);

    /* ===================================================
        FETCH DROPDOWNS
    =================================================== */

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [finishedGoodRes, rawMaterialRes]: any =
                    await Promise.all([
                        dispatch(
                            getAllProducts({
                                offset: 0,
                                limit: 200,
                                search: "",
                                productType: "finishedgoods",
                            }) as any
                        ).unwrap(),

                        dispatch(
                            getAllProducts({
                                offset: 0,
                                limit: 200,
                                search: "",
                                productType: "rawmaterial",
                            }) as any
                        ).unwrap(),
                    ]);

                setFinishedGoodOptions(makeProductOptions(finishedGoodRes));
                setRawMaterialOptions(makeProductOptions(rawMaterialRes));
            } catch (err: any) {
                toast.error(err?.message || "Failed to load products");
            }
        };

        fetchDropdowns();
    }, [dispatch]);

    /* ===================================================
        FETCH LIST
    =================================================== */

    const fetchAssemblyProductions = async () => {
        await dispatch(
            getAssemblyProductionList({
                offset: localOffset,
                limit: localLimit,
                search: debouncedSearch,
                status,
            }) as any
        );
    };

    useEffect(() => {
        fetchAssemblyProductions();
    }, [localOffset, localLimit, debouncedSearch, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    /* ===================================================
        LIST TABLE COLUMNS
    =================================================== */

    const columns = [
        {
            key: "voucherNumber",
            title: "Voucher No",
            render: (row: any) => getVoucherNumber(row) || "-",
        },
        {
            key: "voucherDate",
            title: "Date",
            render: (row: any) => formatDateForList(row?.voucherDate),
        },
        {
            key: "finishedGood",
            title: "Finished Good",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-slate-800">
                        {row?.finishedGood?.productName || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                        {row?.finishedGood?.productCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "finishedQty",
            title: "FG Qty",
            render: (row: any) => row?.finishedGood?.quantity || "0",
        },
        {
            key: "rawMaterials",
            title: "Raw Items",
            render: (row: any) => row?.rawMaterials?.length || 0,
        },
        {
            key: "totalRawMaterialCost",
            title: "Raw Cost",
            render: (row: any) => (
                <span className="font-medium text-slate-700">
                    {money(row?.totalRawMaterialCost || 0)}
                </span>
            ),
        },
        {
            key: "productionCost",
            title: "Production Cost",
            render: (row: any) => (
                <span className="font-medium text-slate-700">
                    {money(row?.productionCost || 0)}
                </span>
            ),
        },
        {
            key: "totalFinishedCost",
            title: "Finished Cost",
            render: (row: any) => (
                <span className="font-semibold text-indigo-700">
                    {money(row?.totalFinishedCost || 0)}
                </span>
            ),
        },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${
                        row?.status === "open"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {row?.status || "-"}
                </span>
            ),
        },
    ];

    /* ===================================================
        BASIC HANDLERS
    =================================================== */

    const handleStatusChange = (nextStatus: string) => {
        setStatus(nextStatus);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        setRefreshing(true);

        try {
            await fetchAssemblyProductions();
            toast.success("Assembly production list refreshed");
        } catch (err: any) {
            toast.error(err?.message || "Failed to refresh list");
        } finally {
            setRefreshing(false);
        }
    };

    const resetMainForm = () => {
        setEditingRecord(null);
        setErrors({});
        setForm(getDefaultForm());
    };

    const openAddModal = () => {
        resetMainForm();
        setShowModal(true);
    };

    const openEditModal = (record: any) => {
        const finishedGood = record?.finishedGood || {};

        const rawMaterials =
            record?.rawMaterials?.length > 0
                ? record.rawMaterials.map((item: any) =>
                      calculateRawMaterialRow({
                          id: item?.id || Date.now() + Math.random(),
                          productCode: item?.productCode || "",
                          productName: item?.productName || "",
                          productId: item?.productId || "",
                          quantity: item?.quantity || "",
                          rate: item?.rate || "",
                          amount: item?.amount || 0,
                      })
                  )
                : [{ ...emptyRawMaterialRow, id: Date.now() }];

        setEditingRecord(record);
        setErrors({});

        setForm({
            voucherNumber: getVoucherNumber(record) || "ASP",
            voucherDate: formatDateForInput(record?.voucherDate),
            status: record?.status || "open",
            remarks: record?.remarks || "",

            finishedGoodProductCode: finishedGood?.productCode || "",
            finishedGoodProductName: finishedGood?.productName || "",
            finishedGoodProductId: finishedGood?.productId || "",
            finishedGoodQuantity: finishedGood?.quantity || "",
            finishedGoodRate: finishedGood?.rate || "",
            finishedGoodAmount:
                finishedGood?.amount ||
                calculateAmount(finishedGood?.quantity, finishedGood?.rate),

            rawMaterials,

            totalRawMaterialCost: record?.totalRawMaterialCost || "0.00",
            productionCost: record?.productionCost || "0.00",
            totalFinishedCost: record?.totalFinishedCost || "0.00",

            warehouseCode: record?.warehouseCode || "",
            locationCode: record?.locationCode || "",
        });

        setShowModal(true);
    };

    /* ===================================================
        HEADER FORM CHANGE
        Finished good product selection auto-fills rate every time.
    =================================================== */

   const handleMainChange = (key: string, value: any) => {
    setForm((prev: any) => {
        const finalValue =
            value && typeof value === "object"
                ? value.value || value.code || value._id || ""
                : value;

        const updated = {
            ...prev,
            [key]: finalValue,
        };

        if (key === "finishedGoodProductCode") {
            const selectedProduct = finishedGoodOptions.find(
                (item: any) => item.value === finalValue
            );

            const product = selectedProduct?.raw;
            const rate = finalValue ? getProductRate(product, "") : "";

            updated.finishedGoodProductCode = finalValue;
            updated.finishedGoodProductName = selectedProduct?.label || "";
            updated.finishedGoodProductId = product?._id || "";
            updated.finishedGoodRate = rate;
            updated.finishedGoodAmount = calculateAmount(
                updated.finishedGoodQuantity,
                rate
            );
        }

        if (key === "finishedGoodQuantity" || key === "finishedGoodRate") {
            const quantity =
                key === "finishedGoodQuantity"
                    ? finalValue
                    : updated.finishedGoodQuantity;

            const rate =
                key === "finishedGoodRate"
                    ? finalValue
                    : updated.finishedGoodRate;

            updated.finishedGoodAmount = calculateAmount(quantity, rate);
        }

        return updated;
    });

    setErrors((prev: any) => ({
        ...prev,
        [key]: "",
    }));
};
    /* ===================================================
        RAW MATERIAL ROW HANDLERS
        Raw material product selection auto-fills rate every time.
    =================================================== */

    const handleAddRow = () => {
        if (rawMaterialOptions.length === 0) {
            toast.error("Please create at least one raw material first");
            return;
        }

        setForm((prev: any) => ({
            ...prev,
            rawMaterials: [
                ...(prev.rawMaterials || []),
                {
                    ...emptyRawMaterialRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedRawMaterials = prev.rawMaterials.filter(
                (_: any, i: number) => i !== index
            );

            return {
                ...prev,
                rawMaterials:
                    updatedRawMaterials.length > 0
                        ? updatedRawMaterials
                        : [{ ...emptyRawMaterialRow, id: Date.now() }],
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const updatedRawMaterials = [...(prev.rawMaterials || [])];

            let updatedRow = {
                ...updatedRawMaterials[index],
                [key]: value,
            };

            if (key === "productCode") {
                const selectedProduct = rawMaterialOptions.find(
                    (item: any) => item.value === value
                );

                const product = selectedProduct?.raw;
                const rate = value ? getProductRate(product, "") : "";

                updatedRow = {
                    ...updatedRow,
                    productCode: value,
                    productName: selectedProduct?.label || "",
                    productId: product?._id || "",
                    rate,
                    amount: calculateAmount(updatedRow.quantity, rate),
                };
            }

            if (key === "quantity" || key === "rate") {
                const quantity =
                    key === "quantity" ? value : updatedRow.quantity;

                const rate = key === "rate" ? value : updatedRow.rate;

                updatedRow = {
                    ...updatedRow,
                    amount: calculateAmount(quantity, rate),
                };
            }

            updatedRawMaterials[index] = updatedRow;

            return {
                ...prev,
                rawMaterials: updatedRawMaterials,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            rawMaterials: "",
            [`row_${index}_${key}`]: "",
        }));
    };

    /* ===================================================
        VALIDATION
    =================================================== */

    const validateForm = () => {
        const err: any = {};

        if (!form.voucherDate) {
            err.voucherDate = "Date is required";
        }

        if (!form.status) {
            err.status = "Status is required";
        }

        if (!form.finishedGoodProductCode) {
            err.finishedGoodProductCode = "Finished good is required";
        }

        if (!form.finishedGoodQuantity || num(form.finishedGoodQuantity) <= 0) {
            err.finishedGoodQuantity = "Finished good quantity is required";
        }

        if (!form.finishedGoodRate || num(form.finishedGoodRate) <= 0) {
            err.finishedGoodRate = "Finished good rate is required";
        }

        const filledRows = cleanRawMaterials();

        if (filledRows.length === 0) {
            err.rawMaterials = "Please add at least one raw material";
        }

        form.rawMaterials.forEach((row: any, index: number) => {
            const hasAnyValue = row.productCode || row.quantity || row.rate;

            if (!hasAnyValue) return;

            if (!row.productCode) {
                err[`row_${index}_productCode`] = "Product is required";
            }

            if (!row.quantity || num(row.quantity) <= 0) {
                err[`row_${index}_quantity`] = "Quantity is required";
            }

            if (!row.rate || num(row.rate) <= 0) {
                err[`row_${index}_rate`] = "Rate is required";
            }
        });

        setErrors(err);

        if (err.rawMaterials) {
            toast.error(err.rawMaterials);
        }

        return Object.keys(err).length === 0;
    };

    /* ===================================================
        SAVE / UPDATE
    =================================================== */

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const rawMaterials = cleanRawMaterials();

        const rawTotal = rawMaterials.reduce((sum: number, item: any) => {
            return sum + num(item.amount);
        }, 0);

        const fgAmount = calculateAmount(
            form.finishedGoodQuantity,
            form.finishedGoodRate
        );

        const payload = {
            voucherDate: form.voucherDate,
            status: form.status || "open",
            remarks: form.remarks || "",

            finishedGood: {
                productCode: form.finishedGoodProductCode,
                productName: form.finishedGoodProductName,
                productId: form.finishedGoodProductId,
                quantity: String(form.finishedGoodQuantity),
                rate: String(form.finishedGoodRate),
                amount: fmtMoney(fgAmount),
            },

            rawMaterials: rawMaterials.map((item: any) => ({
                productCode: item.productCode,
                productName: item.productName,
                productId: item.productId,
                quantity: String(item.quantity),
                rate: String(item.rate),
                amount: fmtMoney(item.amount),
            })),

            totalRawMaterialCost: fmtMoney(rawTotal),
            productionCost: fmtMoney(form.productionCost),
            totalFinishedCost: fmtMoney(rawTotal + num(form.productionCost)),

            warehouseCode: form.warehouseCode || "",
            locationCode: form.locationCode || "",
        };

        try {
            if (editingRecord) {
                const assemblyProductionVoucherNumber =
                    getVoucherNumber(editingRecord);

                if (!assemblyProductionVoucherNumber) {
                    toast.error("Voucher number not found");
                    return;
                }

                await dispatch(
                    updateAssemblyProduction({
                        assemblyProductionVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                toast.success("Assembly production updated successfully");
            } else {
                await dispatch(
                    addAssemblyProduction({ payload }) as any
                ).unwrap();

                toast.success("Assembly production created successfully");
            }

            setShowModal(false);
            resetMainForm();
            fetchAssemblyProductions();
        } catch (err: any) {
            toast.error(err?.message || "Operation failed");
        }
    };

    /* ===================================================
        DELETE
    =================================================== */

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip.voucherNumber) return;

            await dispatch(
                deleteAssemblyProduction({
                    assemblyProductionVoucherNumber:
                        confirmTooltip.voucherNumber,
                }) as any
            ).unwrap();

            toast.success("Assembly production deleted");
            fetchAssemblyProductions();
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete assembly production");
        } finally {
            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                voucherNumber: null,
            });
        }
    };

    /* ===================================================
        DYNAMIC FORM STRUCTURE
    =================================================== */

    const inputData = {
        header: [
            {
                key: "voucherNumber",
                label: "Voucher No",
                type: "text",
                disabled: true,
            },
            {
                key: "voucherDate",
                label: "Date",
                type: "date",
                required: true,
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                required: true,
                options: [
                    { label: "Open", value: "open" },
                    { label: "Close", value: "close" },
                ],
            },
            {
                key: "remarks",
                label: "Remark",
                type: "textarea",
                required: false,
                placeholder: "Enter Remark",
            },
        ],

        headerChild: [
            {
                key: "finishedGoodProductCode",
                label: "Select product",
                type: "select",
                required: true,
                placeholder: "Select Finished Good",
                options: finishedGoodOptions,
            },
            {
                key: "finishedGoodQuantity",
                label: "Finished Qty",
                type: "number",
                required: true,
                placeholder: "Enter Quantity",
            },
            {
                key: "finishedGoodRate",
                label: "Finished Rate",
                type: "number",
                required: true,
                placeholder: "Enter Rate",
            },
            {
                key: "finishedGoodAmount",
                label: "Finished Amount",
                type: "number",
                disabled: true,
            },
        ],

        body: [
            {
                key: "productCode",
                label: "Raw Material",
                type: "select",
                width: "260px",
                required: true,
                options: rawMaterialOptions,
            },
            {
                key: "productName",
                label: "Name",
                type: "text",
                width: "260px",
                disabled: true,
            },
            {
                key: "quantity",
                label: "Qty",
                type: "number",
                width: "130px",
                required: true,
            },
            {
                key: "rate",
                label: "Rate",
                type: "number",
                width: "140px",
                required: true,
            },
            {
                key: "amount",
                label: "Amount",
                type: "number",
                width: "150px",
                disabled: true,
            },
        ],

        footer: [
            {
                label: "Raw Material Cost",
                value: money(totalRawMaterialCost),
            },
            {
                label: "Production Cost",
                value: money(form.productionCost),
            },
            {
                label: "Finished Good Amount",
                value: money(finishedGoodAmount),
            },
            {
                label: "Total Finished Cost",
                value: money(totalFinishedCost),
            },
        ],
    };

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            {/* ================= HEADER ================= */}
            <div
                id="assembly-production-header"
                className="mb-3 flex items-center"
            >
                <div
                    id="assembly-production-summary"
                    className="flex items-start gap-3"
                >
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? 0,
                            text: "Total Assembly Productions:",
                            varient: "primary",
                        }}
                    />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Toggle
                        {...{
                            arr: ["open", "close"],
                            state: status,
                            setState: handleStatusChange,
                        }}
                    />

                    <SearchInput {...{ search, setSearch }} />

                    <DataREfreshButton
                        {...{
                            callBackFn: handleRefresh,
                            loading: refreshing,
                        }}
                    />

                    {/* @ts-ignore */}
                    <DataCreateButton
                        {...{
                            callBackFn: openAddModal,
                            text: "Add Assembly Production",
                        }}
                    />
                </div>
            </div>

            {/* ================= LIST TABLE ================= */}
            <DataTable
                columns={columns}
                data={assemblyProductions}
                loading={listingLoader}
                emptyMessage={`No ${status} assembly production found`}
                actions={(record: any) => (
                    <div className="flex items-center gap-2">
                        <button
                            id="assembly-production-edit-button"
                            onClick={() => openEditModal(record)}
                            className="cursor-pointer rounded-md p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                        >
                            <Edit size={16} />
                        </button>

                        <button
                            id="assembly-production-delete-button"
                            disabled={deleteLoader}
                            onClick={(e) => {
                                const rect =
                                    e.currentTarget.getBoundingClientRect();

                                let x = rect.left - 150;
                                if (x < 10) x = 10;

                                const y = rect.top + window.scrollY - 5;

                                setConfirmTooltip({
                                    show: true,
                                    x,
                                    y,
                                    voucherNumber: getVoucherNumber(record),
                                });
                            }}
                            className="cursor-pointer rounded-md p-2 text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            />

            {/* ================= PAGINATION ================= */}
            {pagination?.totalDocs > 0 && (
                <Pagination
                    {...{
                        localLimit,
                        selectCb: (e: any) => {
                            setLocalLimit(Number(e.target.value));
                            setLocalOffset(0);
                        },
                        preDisabled: !pagination?.hasPrevPage,
                        nextDisabled: !pagination?.hasNextPage,
                        setLocalOffset,
                        pagination,
                    }}
                />
            )}

            {/* ================= DELETE CONFIRM TOOLTIP ================= */}
            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this assembly production?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            voucherNumber: null,
                        })
                    }
                />
            )}

            {/* ================= ADD / UPDATE FORM ================= */}
            <DynamicAddForm
                {...{
                    show: showModal,
                    setShow: setShowModal,
                    edit: Boolean(editingRecord),
                    title: "Assembly Production",
                    subtitle: "Fill in the assembly production details below",
                    loading: addLoader || updateLoader,
                    onClose: () => {
                        setShowModal(false);
                        resetMainForm();
                    },
                    onSubmit: handleSubmit,
                    form,
                    errors,
                    handleAddRow,
                    handleDeleteRow,
                    handleRowChange,
                    inputData,
                    headerChildTitle:"Finished Good",
                    bodyKey: "rawMaterials",
                    handleChange: handleMainChange,
                }}
            />
        </div>
    );
};

export default AssemblyProduction;