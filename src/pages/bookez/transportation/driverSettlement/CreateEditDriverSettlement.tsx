// import {
//     Fragment,
//     useCallback,
//     useEffect,
//     useMemo,
//     useState,
// } from "react";
// import {
//     ArrowLeft,
//     BadgeIndianRupee,
//     FileText,
//     ListChecks,
//     PieChart,
//     Save,
//     Users,
// } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate, useParams } from "react-router-dom";
// import Select from "react-select";
// import { toast } from "react-toastify";

// import { FormSectionCard } from "../../../../components/SectionCards";
// import { renderField } from "../../../../components/inputs";

// import { getProfessionalUsers } from "../../../../redux/slices/professionalSlice/professionalUserSlice";
// import { getTransportOrders } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
// import {
//     getActiveTripAllocations,
//     getChildUserByMobile,
// } from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";
// import { getAllTripExpenses } from "../../../../redux/slices/professionalSlice/transportation/tripExpensesSlice";
// import { getAllLRCollection } from "../../../../redux/slices/professionalSlice/transportation/tripLRCollectionSlice";
// import { createDriverSettlement, getDriverSettlementByVoucherNumber, updateDriverSettlement } from "../../../../redux/slices/professionalSlice/transportation/driverSettlementSlice";
// import { formatDateForInput, formatDateTime, formatMoney } from "../../../../utils/helperFunctions";
// import { addSalesReceipt } from "../../../../redux/slices/professionalSlice/salesWorkflow/salesReceipt";
// import { addPayment } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/paymentSlice";

// const REMARKS_MAX = 200;

// /* ===================================================
//    OPTIONS
// =================================================== */

// const paymentModeOptions = [
//     { label: "Cash", value: "Cash" },
//     { label: "UPI", value: "UPI" },
//     { label: "Bank Transfer", value: "Bank Transfer" },
//     { label: "Cheque", value: "Cheque" },
// ];

// /* ===================================================
//    COMMON HELPERS
// =================================================== */

// const cleanText = (value: any) => String(value || "").trim();

// const normalizeText = (value: any) =>
//     String(value || "")
//         .trim()
//         .toLowerCase();

// const getInputValue = (input: any) => {
//     if (input?.target?.type === "checkbox") return input.target.checked;
//     if (input?.target) return input.target.value;
//     if (input?.value !== undefined) return input.value;
//     return input;
// };

// const unwrapThunk = async (dispatch: any, action: any) => {
//     const res = await dispatch(action);

//     if (res?.error) {
//         throw res.error;
//     }

//     return res?.payload ?? res;
// };

// const getApiList = (res: any) => {
//     if (Array.isArray(res)) return res;

//     const data = res?.data || res || {};

//     if (Array.isArray(data)) return data;

//     const list =
//         data?.records ||
//         data?.data?.records ||
//         data?.result ||
//         data?.data?.result ||
//         data?.items ||
//         data?.data?.items ||
//         data?.data ||
//         [];

//     return Array.isArray(list) ? list : [];
// };

// const getLoginUser = () => {
//     try {
//         return JSON.parse(localStorage.getItem("loginuser") || "{}");
//     } catch {
//         return {};
//     }
// };

// const getFullName = (user: any = {}) =>
//     [
//         user?.userFirstName,
//         user?.userMiddleName,
//         user?.userLastName || user?.userSurname,
//     ]
//         .filter(Boolean)
//         .join(" ")
//         .trim();

// const isAssignedStatus = (value: any) =>
//     String(value || "").trim().toLowerCase() === "assigned";

// /* ===================================================
//    DRIVER HELPERS — SAME PATTERN AS ALLOCATION
// =================================================== */

// const normalizeDriverUsers = (users: any[] = []) => {
//     return (Array.isArray(users) ? users : [])
//         .map((user: any) => {
//             const customFields = user?.childUserCustomFields || {};
//             const mobileNumber = String(user?.userMobileNumberHash || "").trim();
//             const userType = String(user?.userType || "").toLowerCase();
//             const isActive = String(user?.isUserActive || "") === "1";
//             const status = String(customFields?.status || user?.status || "");

//             return {
//                 raw: user,

//                 driverId: mobileNumber,
//                 driverName: getFullName(user) || mobileNumber,
//                 mobileNumber,

//                 licenseNumber:
//                     customFields?.licenseNumber ||
//                     user?.licenseNumber ||
//                     user?.drivingLicenseNumber ||
//                     "",

//                 licenseExpiryDate:
//                     customFields?.licenseExpiry ||
//                     user?.licenseExpiryDate ||
//                     user?.drivingLicenseExpiryDate ||
//                     "",

//                 userType: user?.userType || "",
//                 status,
//                 isActive,
//                 hasParent: Boolean(user?.parentUserMobileNumber),
//                 isDriverType:
//                     userType.includes("tax payer") ||
//                     userType.includes("employee") ||
//                     userType.includes("driver"),
//             };
//         })
//         .filter((driver: any) => {
//             return (
//                 driver.driverId &&
//                 driver.isActive &&
//                 driver.hasParent &&
//                 driver.isDriverType &&
//                 !isAssignedStatus(driver.status)
//             );
//         });
// };

// const flattenChildUsers = (users: any[] = []) => {
//     return Array.isArray(users)
//         ? users.flatMap((item: any) => {
//             if (Array.isArray(item?.ChildUsers)) return item.ChildUsers;
//             return item;
//         })
//         : [];
// };

// /* ===================================================
//    ORDER / TRIP / LR HELPERS
// =================================================== */



// const getVehicleNumber = (record: any, fallback = "-") =>
//     record?.vehicle?.vehicleNumber ||
//     record?.vehicleDetails?.vehicleNumber ||
//     record?.vehicleSelection?.vehicleNumber ||
//     record?.vehicleNumber ||
//     record?.tripDetails?.vehicleNo ||
//     fallback;




// const getDriverIdFromAny = (record: any) =>
//     cleanText(
//         record?.driver?.driverId ||
//         record?.driver?.mobileNumber ||
//         record?.driverDetails?.driverId ||
//         record?.driverDetails?.driverMobileNumber ||
//         record?.driverDetails?.mobileNumber ||
//         record?.driverAllocation?.driverId ||
//         record?.driverAllocation?.mobileNumber ||
//         record?.assignedDriverMobile ||
//         record?.tripAssignedToMobile ||
//         ""
//     );

// const getDriverNameFromAny = (record: any) =>
//     normalizeText(
//         record?.driver?.driverName ||
//         record?.driverDetails?.driverName ||
//         record?.driverName ||
//         record?.driverAllocation?.driverName ||
//         ""
//     );

// const isActiveTripRecord = (record: any) => {
//     const status = normalizeText(record?.tripStatus || record?.status || "");

//     return status !== "cancelled";
// };

// const recordMatchesDriver = (record: any, driver: any) => {
//     if (!record || !driver?.driverId) return false;

//     const driverId = cleanText(driver?.driverId);
//     const driverMobile = cleanText(driver?.mobileNumber);
//     const driverName = normalizeText(driver?.driverName);

//     const candidates = [
//         getDriverIdFromAny(record),
//         record?.assignedDriverMobile,
//         record?.tripAssignedToMobile,
//     ]
//         .map((value) => cleanText(value))
//         .filter(Boolean);

//     const nameCandidate = getDriverNameFromAny(record);

//     if (driverId && candidates.includes(driverId)) return true;
//     if (driverMobile && candidates.includes(driverMobile)) return true;
//     if (driverName && nameCandidate === driverName) return true;

//     return false;
// };

// const findTransportOrderForTrip = (orders: any[] = [], tripId = "") => {
//     const normalizedTrip = normalizeText(tripId);

//     if (!normalizedTrip) return null;

//     return (
//         orders.find((item: any) => {
//             const candidates = [
//                 item?.orderNumber,
//                 item?.transportOrderNumber,
//                 item?.tOrderNumber,
//                 item?.tripNumber,
//                 item?.tripId,
//                 item?.allocationVoucherNumber,
//                 item?.voucherNumber,
//             ]
//                 .map((value) => normalizeText(value))
//                 .filter(Boolean);

//             return candidates.includes(normalizedTrip);
//         }) || null
//     );
// };

// const findAllocationForTrip = (allocations: any[] = [], tripId = "") => {
//     const normalizedTrip = normalizeText(tripId);

//     if (!normalizedTrip) return null;

//     return (
//         allocations.find((item: any) => {
//             const candidates = [
//                 item?.tripAllocationVoucherNumber,
//                 item?.tripNumber,
//                 item?.voucherNumber,
//                 item?.allocationNumber,
//                 item?.transportOrder?.transportOrderNumber,
//             ]
//                 .map((value) => normalizeText(value))
//                 .filter(Boolean);

//             return candidates.includes(normalizedTrip);
//         }) || null
//     );
// };

// const findTripExpenseForTrip = (tripExpenses: any[] = [], tripId = "") => {
//     const normalizedTrip = normalizeText(tripId);

//     if (!normalizedTrip) return null;

//     return (
//         tripExpenses.find((item: any) => {
//             const candidates = [
//                 item?.tripId,
//                 item?.tripNumber,
//                 item?.transportOrderNumber,
//                 item?.allocationVoucherNumber,
//                 item?.tripAllocationVoucherNumber,
//                 item?.voucherNumber,
//             ]
//                 .map((value) => normalizeText(value))
//                 .filter(Boolean);

//             return candidates.includes(normalizedTrip);
//         }) || null
//     );
// };

// const findLREntryForTrip = (lrEntries: any[] = [], tripId = "") => {
//     const normalizedTrip = normalizeText(tripId);

//     if (!normalizedTrip) return null;

//     return (
//         lrEntries.find((item: any) => {
//             const candidates = [
//                 item?.tripNumber,
//                 item?.transportOrderNumber,
//                 item?.orderNumber,
//                 item?.transportOrder?.transportOrderNumber,
//                 item?.transportOrder?.orderNumber,
//                 item?.transportOrder?.voucherNumber,
//                 item?.voucherNumber,
//             ]
//                 .map((value) => normalizeText(value))
//                 .filter(Boolean);

//             return candidates.includes(normalizedTrip);
//         }) || null
//     );
// };

// const buildOrderOptionsForDriver = ({
//     selectedDriver,
//     activeAllocations = [],
//     transportOrders = [],
//     tripExpenses = [],
//     lrEntries = [],
// }: any = {}) => {
//     if (!selectedDriver) return [];

//     const optionMap = new Map<string, any>();

//     const addOption = (transportOrderNumber: string, base: any = {}) => {
//         const value = cleanText(transportOrderNumber);

//         if (!value) return;

//         const allocation =
//             base.allocation ||
//             findAllocationForTrip(activeAllocations, value);

//         const tripExpense =
//             base.tripExpense ||
//             findTripExpenseForTrip(tripExpenses, value);

//         const transportOrder =
//             base.transportOrder ||
//             allocation?.transportOrder ||
//             findTransportOrderForTrip(transportOrders, value);

//         const lrEntry =
//             base.lrEntry ||
//             findLREntryForTrip(lrEntries, value);

//         const vehicleNo =
//             getVehicleNumber(allocation, "") ||
//             getVehicleNumber(tripExpense, "") ||
//             getVehicleNumber(lrEntry, "") ||
//             getVehicleNumber(transportOrder, "") ||
//             "-";

//         const tripStatus =
//             transportOrder?.tripStatus ||
//             allocation?.tripStatus ||
//             tripExpense?.tripStatus ||
//             transportOrder?.status ||
//             "Open";

//         optionMap.set(value, {
//             label: `${value} ${vehicleNo ? ` • ${vehicleNo} (${tripStatus})` : ""
//                 }`,
//             value,
//             allocation,
//             transportOrder,
//             tripExpense,
//             lrEntry,
//         });
//     };

//     /* ==========================================================
//        ACTIVE ALLOCATIONS
//     ========================================================== */

//     for (const allocation of activeAllocations || []) {
//         if (!isActiveTripRecord(allocation)) continue;
//         if (!recordMatchesDriver(allocation, selectedDriver)) continue;

//         const transportOrder =
//             allocation?.transportOrder;

//         const orderNumber =
//             transportOrder?.transportOrderNumber || "";

//         addOption(orderNumber, {
//             allocation,
//             transportOrder,
//         });
//     }

//     /* ==========================================================
//        TRIP EXPENSES
//     ========================================================== */

//     for (const expense of tripExpenses || []) {
//         if (!isActiveTripRecord(expense)) continue;
//         if (!recordMatchesDriver(expense, selectedDriver)) continue;

//         const transportOrder =
//             findTransportOrderForTrip(
//                 transportOrders,
//                 expense?.transportOrderNumber
//             );

//         const orderNumber =
//             expense?.transportOrderNumber ||
//             transportOrder?.transportOrderNumber ||
//             "";

//         addOption(orderNumber, {
//             tripExpense: expense,
//             transportOrder,
//         });
//     }

//     /* ==========================================================
//        LR ENTRIES
//     ========================================================== */

//     for (const lr of lrEntries || []) {

//         const transportOrder =
//             lr?.transportOrder ||
//             findTransportOrderForTrip(
//                 transportOrders,
//                 lr?.transportOrderNumber
//             );

//         const orderNumber =
//             lr?.transportOrderNumber ||
//             transportOrder?.transportOrderNumber ||
//             "";

//         if (!orderNumber) continue;

//         const matchedAllocation =
//             findAllocationForTrip(activeAllocations, orderNumber);

//         const matchedExpense =
//             findTripExpenseForTrip(tripExpenses, orderNumber);

//         const matchedDriver =
//             recordMatchesDriver(matchedAllocation, selectedDriver) ||
//             recordMatchesDriver(matchedExpense, selectedDriver);

//         if (!matchedDriver) continue;

//         addOption(orderNumber, {
//             lrEntry: lr,
//             allocation: matchedAllocation,
//             tripExpense: matchedExpense,
//             transportOrder,
//         });
//     }

//     return Array.from(optionMap.values()).sort((a, b) =>
//         a.value.localeCompare(b.value)
//     );
// };

// /* ===================================================
//    EXPENSE SUMMARY HELPERS
// =================================================== */

// const sumAmounts = (entries: any[] = []) =>
//     entries.reduce((acc, row) => acc + Number(row?.amount || 0), 0);

// const computeTripExpenseSummary = (tripExpense: any = {}) => {
//     const expenses = tripExpense?.expenses || {};

//     const totalAdvanceReceived =
//         Number(expenses?.advanceReceived?.totalAdvance || 0) ||
//         sumAmounts(expenses?.advanceReceived?.entries || []);

//     const totalDieselCost =
//         Number(expenses?.dieselCost?.totalDieselCost || 0) ||
//         sumAmounts(expenses?.dieselCost?.entries || []);

//     const totalFoodCost =
//         Number(expenses?.foodCost?.totalFoodCost || 0) ||
//         sumAmounts(expenses?.foodCost?.entries || []);

//     const totalRunningCost =
//         Number(expenses?.runningCost?.totalRunningCost || 0) ||
//         sumAmounts(expenses?.runningCost?.entries || []);

//     const totalBreakdownCost =
//         Number(expenses?.breakdownCost?.totalBreakdownCost || 0) ||
//         sumAmounts(expenses?.breakdownCost?.entries || []);

//     const totalOtherCost =
//         Number(expenses?.otherCost?.totalOtherCost || 0) ||
//         sumAmounts(expenses?.otherCost?.entries || []);

//     const totalTripExpense =
//         Number(tripExpense?.summary?.totalTripExpense || 0) ||
//         totalDieselCost +
//         totalFoodCost +
//         totalRunningCost +
//         totalBreakdownCost +
//         totalOtherCost;

//     const balanceAmount =
//         Number(tripExpense?.summary?.balanceAmount || 0) ||
//         Math.max(totalTripExpense - totalAdvanceReceived, 0);

//     return {
//         totalAdvanceReceived,
//         totalTripExpense,
//         balanceAmount,
//     };
// };

// const buildExpenseRowsFromTripExpense = (tripExpense: any) => {
//     if (!tripExpense) return [];

//     const expenses = tripExpense?.expenses || {};
//     const rows: any[] = [];

//     const pushRows = (entries: any[] = [], type: string, descriptionFn: any) => {
//         entries.forEach((entry: any, index: number) => {
//             const amount = Number(entry?.amount || 0);

//             if (!amount && !entry?.fuelStation && !entry?.expenseType) return;

//             rows.push({
//                 id: `${type}-${index}`,
//                 date:
//                     entry?.date ||
//                     entry?.receivedDate ||
//                     entry?.billDate ||
//                     tripExpense?.tripDate ||
//                     tripExpense?.enteredDate ||
//                     "",
//                 type,
//                 description: descriptionFn(entry),
//                 amount,
//             });
//         });
//     };

//     pushRows(
//         expenses?.dieselCost?.entries,
//         "Diesel",
//         (entry: any) =>
//             [entry?.fuelStation, entry?.billNumber].filter(Boolean).join(" • ") ||
//             "Diesel expense"
//     );

//     pushRows(
//         expenses?.foodCost?.entries,
//         "Driver Allowance / Food",
//         (entry: any) =>
//             [entry?.mealType, entry?.location].filter(Boolean).join(" • ") ||
//             "Food / allowance"
//     );

//     pushRows(
//         expenses?.runningCost?.entries,
//         "Running",
//         (entry: any) =>
//             [entry?.expenseType, entry?.location].filter(Boolean).join(" • ") ||
//             "Running expense"
//     );

//     pushRows(
//         expenses?.breakdownCost?.entries,
//         "Breakdown",
//         (entry: any) =>
//             [entry?.issueType, entry?.serviceCenter].filter(Boolean).join(" • ") ||
//             "Breakdown expense"
//     );

//     pushRows(
//         expenses?.otherCost?.entries,
//         "Other",
//         (entry: any) =>
//             [entry?.expenseType, entry?.remarks].filter(Boolean).join(" • ") ||
//             "Other expense"
//     );

//     const pod = tripExpense?.pod || {};
//     const podStatus = cleanText(pod?.deliveryStatus);

//     if (podStatus && normalizeText(podStatus) !== "pending") {
//         rows.push({
//             id: "pod-summary",
//             date: pod?.deliveryDateTime || tripExpense?.tripDate || "",
//             type: "POD",
//             description: [podStatus, pod?.receiverName, pod?.deliveryLocation]
//                 .filter(Boolean)
//                 .join(" • "),
//             amount: 0,
//         });
//     }

//     return rows;
// };

// const buildAdvanceRowsFromTripExpense = (tripExpense: any) => {
//     const entries = tripExpense?.expenses?.advanceReceived?.entries || [];

//     return entries.map((entry: any, index: number) => ({
//         id: `advance-${index}`,
//         date: entry?.date || entry?.receivedDate || tripExpense?.tripDate || "",
//         source: entry?.sourceName || entry?.sourceType || "Advance",
//         paymentMode: entry?.paymentMode || "-",
//         amount: Number(entry?.amount || 0),
//         remarks: entry?.remarks || "",
//     }));
// };

// const mapSelectionToTripDetails = ({
//     allocation,
//     transportOrder,
//     tripExpense,
//     lrEntry,

// }: any = {}) => {
//     const summaryMeta = tripExpense ? computeTripExpenseSummary(tripExpense) : null;

//     // const tripStatus = cleanText(
//     //     tripExpense?.tripStatus ||
//     //     allocation?.tripStatus ||
//     //     transportOrder?.tripStatus ||
//     //     transportOrder?.status ||
//     //     "-"
//     // )
//     //     .replace(/_/g, " ")
//     //     .replace(/\b\w/g, (c) => c.toUpperCase());

//     if (!allocation && !transportOrder && !tripExpense && !lrEntry) return null;

//     return {
//         // ==========================
//         // LR DETAILS ONLY
//         // ==========================

//         lrNo: lrEntry?.lrNumber || "-",
//         lrDate: lrEntry?.lrDate || "",

//         tripNo: lrEntry?.tripNumber || "-",

//         tripDate:
//             lrEntry?.loading?.loadingDateTime || "",

//         customerCode:
//             lrEntry?.customer?.customerCode || "",

//         customerName:
//             lrEntry?.customer?.customerName || "",

//         tripStatus:
//             lrEntry?.tripStatus || "-",

//         // ==========================
//         // CONSIGNOR
//         // ==========================

//         consignor:
//             lrEntry?.consignor?.name || "",

//         consignorAddress:
//             lrEntry?.consignor?.address || "",

//         consignorCity:
//             lrEntry?.consignor?.location?.city || "",

//         consignorState:
//             lrEntry?.consignor?.location?.state || "",

//         // ==========================
//         // CONSIGNEE
//         // ==========================

//         consignee:
//             lrEntry?.consignee?.name || "",

//         consigneeAddress:
//             lrEntry?.consignee?.address || "",

//         consigneeCity:
//             lrEntry?.consignee?.location?.city || "",

//         consigneeState:
//             lrEntry?.consignee?.location?.state || "",

//         // ==========================
//         // ROUTE
//         // ==========================

//         from:
//             lrEntry?.route?.source || "",

//         to:
//             lrEntry?.route?.destination || "",

//         routeCode:
//             lrEntry?.route?.routeCode || "",

//         routeName:
//             lrEntry?.route?.routeName || "",

//         distanceKm:
//             lrEntry?.route?.distanceKm || "",

//         // ==========================
//         // VEHICLE
//         // ==========================

//         vehicleCode:
//             lrEntry?.vehicle?.vehicleCode || "",

//         vehicleNo:
//             lrEntry?.vehicle?.vehicleNumber || "",

//         vehicleType:
//             lrEntry?.vehicle?.vehicleType || "",

//         // ==========================
//         // DRIVER
//         // ==========================

//         driverCode:
//             lrEntry?.driver?.driverCode || "",

//         driverName:
//             lrEntry?.driver?.driverName || "",

//         // ==========================
//         // CARGO
//         // ==========================

//         productCode:
//             lrEntry?.cargo?.productCode || "",

//         goods:
//             lrEntry?.cargo?.productName || "",

//         quantity:
//             lrEntry?.cargo?.quantity || "",

//         unit:
//             lrEntry?.cargo?.unit || "",

//         weight:
//             lrEntry?.cargo?.weight || "",

//         weightUnit:
//             lrEntry?.cargo?.weightUnit || "",

//         // ==========================
//         // FREIGHT
//         // ==========================

//         agreedFreight:
//             Number(lrEntry?.freight?.agreedFreight || 0),

//         advancePaid:
//             Number(lrEntry?.freight?.advancePaid || 0),

//         balancePayable:
//             Number(lrEntry?.freight?.balancePayable || 0),

//         paymentType:
//             lrEntry?.freight?.paymentType || "",

//         // ==========================
//         // LOADING
//         // ==========================

//         loadingDateTime:
//             lrEntry?.loading?.loadingDateTime || "",

//         loadingPoint:
//             lrEntry?.loading?.loadingPoint || "",

//         // ==========================
//         // DELIVERY
//         // ==========================

//         expectedDeliveryDateTime:
//             lrEntry?.delivery?.expectedDeliveryDateTime || "",

//         // ==========================
//         // DOCUMENTS
//         // ==========================

//         documents:
//             lrEntry?.documents || [],

//         remarks:
//             lrEntry?.remarks || "",

//         // ==========================
//         // DRIVER SETTLEMENT ONLY
//         // ==========================

//         totalTripExpense:
//             summaryMeta?.totalTripExpense ?? 0,

//         balanceAmount:
//             summaryMeta?.balanceAmount ?? 0,

//         expectedFreight:
//             Number(lrEntry?.freight?.agreedFreight || 0),
//     };
// };

// const computeSettlementSummary = ({
//     salary = 0,
//     incentives = 0,
//     allowedExpenses = 0,
//     totalAdvances = 0,
// }: any = {}) => {
//     const salaryNum = Number(salary || 0);
//     const incentivesNum = Number(incentives || 0);
//     const allowedNum = Number(allowedExpenses || 0);
//     const advancesNum = Number(totalAdvances || 0);

//     const grossAmount = salaryNum + incentivesNum;
//     const netPayable = grossAmount - allowedNum - advancesNum;

//     return {
//         salary: salaryNum,
//         incentives: incentivesNum,
//         grossAmount,
//         allowedExpenses: allowedNum,
//         totalAdvances: advancesNum,
//         netPayable,
//     };
// };

// const buildSettlementFromSelections = ({
//     allocation,
//     transportOrder,
//     tripExpense,
//     lrEntry,
//     driver,
//     salary = "",
//     incentives = "",
// }: any = {}) => {
//     const expenseRows = buildExpenseRowsFromTripExpense(tripExpense);
//     const advanceRows = buildAdvanceRowsFromTripExpense(tripExpense);
//     const summaryMeta = tripExpense ? computeTripExpenseSummary(tripExpense) : null;

//     const totalExpenses = expenseRows.reduce(
//         (acc, row) => acc + Number(row.amount || 0),
//         0
//     );

//     const totalAllowedExpenses = summaryMeta?.totalTripExpense ?? totalExpenses;
//     const totalAdvances = sumAmounts(advanceRows);

//     const settlement = computeSettlementSummary({
//         salary,
//         incentives,
//         allowedExpenses: totalAllowedExpenses,
//         totalAdvances,
//     });

//     return {
//         tripDetails: mapSelectionToTripDetails({
//             allocation,
//             transportOrder,
//             tripExpense,
//             lrEntry,
//             driver,
//         }),
//         expenseRows,
//         advanceRows,
//         totalExpenses,
//         totalAllowedExpenses,
//         totalAdvances,
//         settlement,
//     };
// };



// const isTripPendingAccept = (tripExpense: any) => {
//     const status = normalizeText(
//         tripExpense?.tripStatus ||
//         tripExpense?.driverStatus ||
//         tripExpense?.acceptanceStatus ||
//         ""
//     );

//     return (
//         status === "pending" ||
//         status === "assigned" ||
//         status === "pending_accept" ||
//         status === "pending accept"
//     );
// };

// /* ===================================================
//    EDIT-MODE MAPPERS (prefill from GET-by-voucher response)
// =================================================== */

// const formatTripStatusLabel = (value: any) =>
//     cleanText(value)
//         .replace(/_/g, " ")
//         .replace(/\b\w/g, (c: string) => c.toUpperCase()) || "-";

// const mapEditRecordToTripDetails = (record: any) => {
//     if (!record) return null;

//     const lr = record?.lrDetails || {};

//     return {
//         tripNo: lr?.tripNumber || record?.transportOrderNumber || "-",
//         lrNo: lr?.lrNumber || "-",
//         tripDate: lr?.tripDate || "",
//         lrDate: lr?.lrDate || "",
//         from: lr?.from || "-",
//         to: lr?.to || "-",
//         consignor: lr?.consignor || "-",
//         consignee: lr?.consignee || "-",
//         vehicleNo: lr?.vehicleNo || "-",
//         goods: lr?.goods || "-",
//         driverName: lr?.driverName || "-",
//         tripStatus: formatTripStatusLabel(lr?.tripStatus),
//         totalTripExpense: Number(lr?.totalTripExpense || 0),
//         balanceAmount: Number(lr?.balance || 0),
//         expectedFreight: 0,
//     };
// };

// const mapEditRecordToExpenseRows = (record: any) =>
//     (record?.expenses || []).map((row: any, index: number) => ({
//         id: `edit-expense-${index}`,
//         date: row?.date || "",
//         type: row?.type || "",
//         description: row?.description || "",
//         amount: Number(row?.amount || 0),
//     }));

// const mapEditRecordToAdvanceRows = (record: any) =>
//     (record?.advances || []).map((row: any, index: number) => ({
//         id: `edit-advance-${index}`,
//         date: row?.date || "",
//         source: row?.source || "",
//         paymentMode: row?.mode || "-",
//         amount: Number(row?.amount || 0),
//         remarks: row?.remarks || "",
//     }));

// /* ===================================================
//    SMALL DISPLAY COMPONENTS
// =================================================== */

// const DetailCell = ({ label, value }: any) => (
//     <div className="rounded-lg border border-border bg-background p-3">
//         <p className="text-xs font-semibold text-muted-foreground">{label}</p>
//         <p className="mt-1 break-words text-sm font-medium">
//             {value || "-"}
//         </p>
//     </div>
// );

// const SummaryLine = ({ label, value, muted = false }: any) => (
//     <div className="flex items-center justify-between gap-3 border-b border-border py-2">
//         <p
//             className={`text-sm font-semibold ${muted ? "text-muted-foreground" : ""
//                 }`}
//         >
//             {label}
//         </p>

//         <p
//             className={`text-sm font-semibold ${muted ? "text-muted-foreground" : ""
//                 }`}
//         >
//             {formatMoney(Math.abs(Number(value || 0)))}
//         </p>
//     </div>
// );

// const EmptyHint = ({ children }: any) => (
//     <p className="rounded-md border border-dashed border-border bg-background p-4 text-sm font-semibold text-muted-foreground">
//         {children}
//     </p>
// );

// /* ===================================================
//    COMPONENT
// =================================================== */

// const CreateEditDriverSettlement = () => {
//     const dispatch = useDispatch<any>();
//     const navigate = useNavigate();

//     const { voucherNumber } = useParams<{ voucherNumber: string }>();
//     const isEditMode = Boolean(voucherNumber);

//     const { users = [] } = useSelector((s: any) => s.professionalUser || {});

//     const {
//         activeAllocations = [],
//         driversLoader = false,
//     } = useSelector((state: any) => state.tripAllocation || {});

//     const [pageLoading, setPageLoading] = useState(false);
//     const [transportOrders, setTransportOrders] = useState<any[]>([]);
//     const [tripExpenses, setTripExpenses] = useState<any[]>([]);
//     const [lrEntries, setLrEntries] = useState<any[]>([]);

//     const [selectedDriverId, setSelectedDriverId] = useState("");
//     const [selectedTripId, setSelectedTripId] = useState("");

//     const [driverDetail, setDriverDetail] = useState<any>({
//         driverId: "",
//         driverName: "",
//         mobileNumber: "",
//         licenseNumber: "",
//         licenseExpiryDate: "",
//     });

//     const [salary, setSalary] = useState("");
//     const [incentives, setIncentives] = useState("");
//     const [paymentMode, setPaymentMode] = useState("");
//     const [paymentDate, setPaymentDate] = useState(formatDateForInput(new Date()));
//     const [remarks, setRemarks] = useState("");
//     const [paymentAccountCode, setPaymentAccountCode] = useState("");
//     const [paymentAccountName, setPaymentAccountName] = useState("");

//     // Edit-mode state
//     const [editRecord, setEditRecord] = useState<any>(null);
//     const [fetchingEdit, setFetchingEdit] = useState(false);

//     const loading = pageLoading || driversLoader || fetchingEdit;

//     const loginUser = useMemo(() => getLoginUser(), []);

//     const parentMobile =
//         loginUser?.parentUserMobileNumber ||
//         loginUser?.parentUserMobileNumberHash ||
//         loginUser?.userMobileNumberHash ||
//         "";

//     const driverUsers = useMemo(() => {
//         const list = flattenChildUsers(users);
//         return normalizeDriverUsers(list);
//     }, [users]);

//     useEffect(() => {
//         dispatch(
//             getProfessionalUsers({
//                 page: 1,
//                 limit: 500,
//                 withParent: true,
//                 type: "driver",
//                 inputFields: [
//                     "ParentUser",
//                     "ChildUsers",
//                     "userFirstName",
//                     "userMiddleName",
//                     "userLastName",
//                     "userMobileNumberHash",
//                     "userEmail",
//                     "userDOB",
//                     "userGender",
//                     "userType",
//                     "isUserActive",
//                     "parentUserMobileNumber",
//                     "childUserCustomFields.licenseNumber",
//                     "childUserCustomFields.licenseExpiry",
//                     "childUserCustomFields.status",
//                 ],
//             }) as any
//         );
//     }, [dispatch]);

//     const loadSettlementSources = useCallback(async () => {
//         try {
//             setPageLoading(true);

//             const [
//                 ordersRes,
//                 allocationsRes,
//                 lrRes,
//                 expenseRes,
//             ] = await Promise.all([
//                 unwrapThunk(
//                     dispatch,
//                     getTransportOrders({
//                         limit: 100000,
//                         offset: 0,
//                         status: "open",
//                     }) as any
//                 ),

//                 unwrapThunk(
//                     dispatch,
//                     getActiveTripAllocations({
//                         limit: 100000,
//                         offset: 0,
//                     }) as any
//                 ),

//                 unwrapThunk(
//                     dispatch,
//                     getAllLRCollection({
//                         limit: 100000,
//                         offset: 0,
//                         search: "",
//                     }) as any
//                 ),

//                 unwrapThunk(
//                     dispatch,
//                     getAllTripExpenses({
//                         limit: 100000,
//                         offset: 0,
//                         search: "",
//                     }) as any
//                 ),
//             ]);

//             const orders = getApiList(ordersRes);
//             const allocations = getApiList(allocationsRes);
//             const expenses = getApiList(expenseRes);
//             const lrList = getApiList(lrRes);

//             setTransportOrders(orders);
//             setTripExpenses(expenses);
//             setLrEntries(lrList);

//             console.log("Orders:", orders.length);
//             console.log("Allocations:", allocations.length);
//             console.log("Trip Expenses:", expenses.length);
//             console.log("LR Entries:", lrList.length);
//             console.log("Sample LR:", lrList[0]);

//         } catch (error: any) {
//             toast.error(error?.message || "Failed to load settlement data");
//             setTransportOrders([]);
//             setTripExpenses([]);
//             setLrEntries([]);
//         } finally {
//             setPageLoading(false);
//         }
//     }, [dispatch, parentMobile]);

//     useEffect(() => {
//         loadSettlementSources();
//     }, [loadSettlementSources]);

//     /* ---------------------------------------------------
//        EDIT MODE: fetch settlement by voucher number and
//        prefill the simple fields (salary, incentives,
//        payment mode/date, remarks, linked trip id).
//     --------------------------------------------------- */
//     useEffect(() => {
//         if (!isEditMode) return;

//         const fetchSettlement = async () => {
//             try {
//                 setFetchingEdit(true);

//                 const response = await unwrapThunk(
//                     dispatch,
//                     getDriverSettlementByVoucherNumber(voucherNumber as string) as any
//                 );

//                 const record = response?.data || response;

//                 setEditRecord(record);

//                 setSalary(String(record?.salary ?? ""));
//                 setIncentives(String(record?.otherIncentives ?? ""));
//                 setRemarks(String(record?.remarks || "").slice(0, REMARKS_MAX));

//                 setPaymentDate(
//                     formatDateForInput(record?.paymentDate) || formatDateForInput(new Date())
//                 );

//                 const matchedMode = paymentModeOptions.find(
//                     (opt) => normalizeText(opt.value) === normalizeText(record?.paymentMode)
//                 );
//                 setPaymentMode(matchedMode?.value || "");

//                 setSelectedTripId(cleanText(record?.transportOrderNumber));
//             } catch (error: any) {
//                 toast.error(error?.message || "Failed to load settlement details");
//             } finally {
//                 setFetchingEdit(false);
//             }
//         };

//         fetchSettlement();
//     }, [isEditMode, voucherNumber, dispatch]);

//     /* ---------------------------------------------------
//        EDIT MODE: once driver list is loaded, match the
//        settlement's driver (by driverCode, falling back to
//        driver name from lrDetails) and prefill driver fields.
//     --------------------------------------------------- */
//     useEffect(() => {
//         if (!isEditMode || !editRecord || !driverUsers.length || selectedDriverId) {
//             return;
//         }

//         const driverCode = cleanText(editRecord?.driverCode);
//         const driverNameFromRecord = normalizeText(editRecord?.lrDetails?.driverName);

//         const matchedDriver =
//             driverUsers.find((d: any) => d.driverId === driverCode) ||
//             driverUsers.find(
//                 (d: any) => normalizeText(d.driverName) === driverNameFromRecord
//             );

//         if (!matchedDriver) return;

//         setSelectedDriverId(matchedDriver.driverId);
//         setDriverDetail({
//             driverId: matchedDriver.driverId,
//             driverName: matchedDriver.driverName,
//             mobileNumber: matchedDriver.mobileNumber,
//             licenseNumber: matchedDriver.licenseNumber,
//             licenseExpiryDate: matchedDriver.licenseExpiryDate,
//         });
//     }, [isEditMode, editRecord, driverUsers, selectedDriverId]);

//     const selectedDriver = useMemo(
//         () =>
//             driverUsers.find((driver: any) => driver.driverId === selectedDriverId) ||
//             null,
//         [driverUsers, selectedDriverId]
//     );

//     const driverOptions = useMemo(
//         () =>
//             (driverUsers || []).map((driver: any) => ({
//                 label: `${driver.driverName}`,
//                 value: driver.driverId,
//                 driver,
//             })),
//         [driverUsers]
//     );

//     const orderOptions = useMemo(
//         () =>
//             buildOrderOptionsForDriver({
//                 selectedDriver,
//                 activeAllocations,
//                 transportOrders,
//                 tripExpenses,
//                 lrEntries,
//             }),
//         [
//             selectedDriver,
//             activeAllocations,
//             transportOrders,
//             tripExpenses,
//             lrEntries,
//         ]
//     );

//     const selectedDriverOption =
//         driverOptions.find((item: any) => item.value === selectedDriverId) || null;

//     const selectedOrderOption =
//         orderOptions.find((item: any) => item.value === selectedTripId) || null;

//     useEffect(() => {
//         if (isEditMode) return;

//         if (
//             selectedTripId &&
//             !orderOptions.some((option: any) => option.value === selectedTripId)
//         ) {
//             setSelectedTripId("");
//         }
//     }, [selectedTripId, orderOptions, isEditMode]);

//     const selectedAllocation = useMemo(
//         () =>
//             selectedOrderOption?.allocation ||
//             findAllocationForTrip(activeAllocations, selectedTripId),
//         [selectedOrderOption, activeAllocations, selectedTripId]
//     );

//     const selectedTransportOrder = useMemo(
//         () =>
//             selectedOrderOption?.transportOrder ||
//             selectedAllocation?.transportOrder ||
//             findTransportOrderForTrip(transportOrders, selectedTripId),
//         [selectedOrderOption, selectedAllocation, transportOrders, selectedTripId]
//     );

//     const selectedTripExpense = useMemo(
//         () =>
//             selectedOrderOption?.tripExpense ||
//             findTripExpenseForTrip(tripExpenses, selectedTripId),
//         [selectedOrderOption, tripExpenses, selectedTripId]
//     );

//     const selectedLREntry = useMemo(
//         () =>
//             selectedOrderOption?.lrEntry ||
//             findLREntryForTrip(lrEntries, selectedTripId),
//         [selectedOrderOption, lrEntries, selectedTripId]
//     );


//     console.log("selectedTripId", selectedTripId);
//     console.log("selectedOrderOption", selectedOrderOption);
//     console.log("selectedAllocation", selectedAllocation);
//     console.log("selectedTransportOrder", selectedTransportOrder);
//     console.log("selectedTripExpense", selectedTripExpense);
//     console.log("selectedLREntry", selectedLREntry);

//     const liveSettlementData = useMemo(
//         () =>
//             buildSettlementFromSelections({
//                 allocation: selectedAllocation,
//                 transportOrder: selectedTransportOrder,
//                 tripExpense: selectedTripExpense,
//                 lrEntry: selectedLREntry,
//                 driver: selectedDriver,
//                 salary,
//                 incentives,
//             }),
//         [
//             selectedAllocation,
//             selectedTransportOrder,
//             selectedTripExpense,
//             selectedLREntry,
//             selectedDriver,
//             salary,
//             incentives,
//         ]
//     );

//     // In edit mode, trip/LR/expense/advance details come straight from the
//     // GET-by-voucher response instead of the live open-trip selections.
//     const settlementData = useMemo(() => {
//         if (isEditMode && editRecord) {
//             const totalAllowedExpenses = Number(editRecord?.lessAllowedExpenses || 0);
//             const totalAdvances = Number(editRecord?.lessAdvancesToDriver || 0);
//             const expenseRows = mapEditRecordToExpenseRows(editRecord);

//             return {
//                 tripDetails: mapEditRecordToTripDetails(editRecord),
//                 expenseRows,
//                 advanceRows: mapEditRecordToAdvanceRows(editRecord),
//                 totalExpenses: expenseRows.reduce(
//                     (acc: number, row: any) => acc + Number(row.amount || 0),
//                     0
//                 ),
//                 totalAllowedExpenses,
//                 totalAdvances,
//                 settlement: computeSettlementSummary({
//                     salary,
//                     incentives,
//                     allowedExpenses: totalAllowedExpenses,
//                     totalAdvances,
//                 }),
//             };
//         }

//         return liveSettlementData;
//     }, [isEditMode, editRecord, salary, incentives, liveSettlementData]);

//     const tripPendingAccept = useMemo(
//         () => (isEditMode ? false : isTripPendingAccept(selectedTripExpense)),
//         [isEditMode, selectedTripExpense]
//     );

//     const handleDriverSelect = async (driverId: string) => {
//         const selected = driverUsers.find(
//             (driver: any) => driver.driverId === driverId
//         );

//         setSelectedDriverId(driverId || "");
//         setSelectedTripId("");

//         if (!selected) {
//             setDriverDetail({
//                 driverId: "",
//                 driverName: "",
//                 mobileNumber: "",
//                 licenseNumber: "",
//                 licenseExpiryDate: "",
//             });
//             return;
//         }

//         setDriverDetail({
//             driverId: selected.driverId,
//             driverName: selected.driverName,
//             mobileNumber: selected.mobileNumber,
//             licenseNumber: selected.licenseNumber,
//             licenseExpiryDate: selected.licenseExpiryDate,
//         });

//         try {
//             const response = await unwrapThunk(
//                 dispatch,
//                 getChildUserByMobile(selected.driverId)
//             );

//             const responseData = response?.data || response;

//             const childUsersRaw =
//                 responseData?.ChildUsers ||
//                 responseData?.childUsers ||
//                 responseData?.result ||
//                 responseData?.users ||
//                 [];

//             const childUsersArray = Array.isArray(childUsersRaw)
//                 ? childUsersRaw
//                 : childUsersRaw && typeof childUsersRaw === "object"
//                     ? [childUsersRaw]
//                     : [];

//             const child =
//                 childUsersArray.find(
//                     (item: any) =>
//                         String(item?.userMobileNumberHash || "") ===
//                         String(selected.driverId)
//                 ) ||
//                 childUsersArray[0] ||
//                 responseData;

//             const customFields = child?.childUserCustomFields || {};

//             setDriverDetail((prev: any) => ({
//                 ...prev,
//                 mobileNumber:
//                     selected.mobileNumber || String(child?.userMobileNumberHash || ""),
//                 licenseNumber:
//                     selected.licenseNumber ||
//                     customFields?.licenseNumber ||
//                     child?.licenseNumber ||
//                     child?.drivingLicenseNumber ||
//                     prev.licenseNumber,
//                 licenseExpiryDate:
//                     selected.licenseExpiryDate ||
//                     customFields?.licenseExpiry ||
//                     child?.licenseExpiryDate ||
//                     child?.drivingLicenseExpiryDate ||
//                     prev.licenseExpiryDate,
//             }));
//         } catch (error: any) {
//             toast.error(error?.message || "Failed to load driver license details");
//         }
//     };

//     const handleOrderSelect = (orderNumber: string) => {
//         setSelectedTripId(orderNumber || "");
//     };

//     const fieldForm = {
//         salary,
//         incentives,
//         paymentMode,
//         paymentDate,
//         paymentAccountCode,
//         paymentAccountName,
//         remarks,
//     };

//     const updateField = (key: string, input: any) => {
//         const value = getInputValue(input);

//         if (key === "salary") {
//             setSalary(value);
//             return;
//         }

//         if (key === "incentives") {
//             setIncentives(value);
//             return;
//         }

//         if (key === "paymentMode") {
//             setPaymentMode(value);
//             return;
//         }

//         if (key === "paymentDate") {
//             setPaymentDate(value);
//             return;
//         }

//         if (key === "paymentAccountCode") {
//             setPaymentAccountCode(value);
//             return;
//         }

//         if (key === "paymentAccountName") {
//             setPaymentAccountName(value);
//             return;
//         }

//         if (key === "remarks") {
//             setRemarks(String(value || "").slice(0, REMARKS_MAX));
//         }
//     };

//     const handleInputChange = (key: string) => (e: any) => {
//         updateField(key, e);
//     };

//     const handleSelectChange = (key: string) => (e: any) => {
//         updateField(key, e);
//     };

//     const renderFields = (fields: any[]) =>
//         fields.map((field) => (
//             <Fragment key={field.key}>
//                 {renderField({
//                     field,
//                     form: fieldForm,
//                     handleInputChange,
//                     handleSelectChange,
//                     updateField,
//                 })}
//             </Fragment>
//         ));

//     const settlementFields = [
//         {
//             key: "salary",
//             label: "Salary of Driver",
//             type: "number",
//             mandatory: true,
//             placeholder: "Enter salary",
//         },
//         {
//             key: "incentives",
//             label: "Other Incentives",
//             type: "number",
//             placeholder: "Enter incentives",
//         },
//         {
//             key: "paymentMode",
//             label: "Payment Mode",
//             type: "select",
//             options: paymentModeOptions,
//             placeholder: "Select payment mode",
//         },
//         {
//             key: "paymentDate",
//             label: "Payment Date",
//             type: "date",
//         },
//         {
//             key: "remarks",
//             label: "Remarks",
//             type: "textarea",
//             className: "md:col-span-2 xl:col-span-4",
//             placeholder: "Enter remarks",
//         },
//     ];

//     const tripDetails = settlementData.tripDetails;



//     const getSettlementVoucherNumber = (
//         response: any,
//         fallback = ""
//     ) => {
//         return (
//             response?.data?.settlement?.settlementNumber ||
//             response?.data?.record?.settlementNumber ||
//             response?.data?.settlementNumber ||
//             response?.data?.voucherNumber ||
//             response?.settlementNumber ||
//             response?.voucherNumber ||
//             fallback
//         );
//     };

//     const getPaymentVoucherNumber = (response: any) => {
//         return (
//             response?.data?.payment?.payVoucherNumber ||
//             response?.data?.record?.payVoucherNumber ||
//             response?.data?.payVoucherNumber ||
//             response?.data?.voucherNumber ||
//             response?.payVoucherNumber ||
//             response?.voucherNumber ||
//             ""
//         );
//     };

//     const getReceiptVoucherNumber = (response: any) => {
//         return (
//             response?.data?.receipt?.recVoucherNumber ||
//             response?.data?.record?.recVoucherNumber ||
//             response?.data?.recVoucherNumber ||
//             response?.data?.voucherNumber ||
//             response?.recVoucherNumber ||
//             response?.voucherNumber ||
//             ""
//         );
//     };






//     const handleSave = async () => {
//         if (!selectedDriverId) {
//             toast.warn("Please select a driver");
//             return;
//         }

//         if (!selectedTripId) {
//             toast.warn("Please select order / trip");
//             return;
//         }

//         if (!String(salary || "").trim()) {
//             toast.warn("Please enter salary of driver");
//             return;
//         }

//         if (!paymentMode) {
//             toast.warn("Please select payment mode");
//             return;
//         }

//         try {
//             setPageLoading(true);

//             const calculatedNetPayable = Number(
//                 settlementData?.settlement?.netPayable || 0
//             );

//             const expenseAmount = Number(
//                 settlementData?.totalAllowedExpenses ??
//                 settlementData?.totalExpenses ??
//                 settlementData?.settlement?.allowedExpenses ??
//                 0
//             );

//             const freightAmount = Number(
//                 tripDetails?.expectedFreight ||
//                 selectedTransportOrder?.freightDetails?.expectedFreight ||
//                 selectedAllocation?.transportOrder?.freightDetails
//                     ?.expectedFreight ||
//                 selectedAllocation?.transportOrder?.expectedFreight ||
//                 0
//             );

//             const driverAccountCode =
//                 driverDetail?.driverId ||
//                 selectedDriver?.driverId ||
//                 selectedDriverId ||
//                 "";

//             const driverAccountName =
//                 driverDetail?.driverName ||
//                 selectedDriver?.driverName ||
//                 tripDetails?.driverName ||
//                 driverAccountCode;

//             const customerAccountCode =
//                 selectedAllocation?.transportOrder?.customerCode ||
//                 selectedAllocation?.transportOrder?.customerDetails
//                     ?.customerCode ||
//                 selectedTransportOrder?.customerDetails?.customerCode ||
//                 selectedTransportOrder?.customerCode ||
//                 "";

//             const customerAccountName =
//                 selectedAllocation?.transportOrder?.customerName ||
//                 selectedAllocation?.transportOrder?.customerDetails
//                     ?.customerName ||
//                 selectedTransportOrder?.customerDetails?.customerName ||
//                 selectedTransportOrder?.customerName ||
//                 customerAccountCode;

//             const transportOrderNumber =
//                 selectedTransportOrder?.transportOrderNumber ||
//                 selectedAllocation?.transportOrder?.transportOrderNumber ||
//                 selectedTripId;

//             const payload: any = {
//                 transportOrderNumber,

//                 driverCode: driverAccountCode,

//                 salary: Number(salary || 0),

//                 otherIncentives: Number(incentives || 0),

//                 grossAmount: Number(
//                     settlementData?.settlement?.grossAmount || 0
//                 ),

//                 lessAllowedExpenses: Number(
//                     settlementData?.settlement?.allowedExpenses || 0
//                 ),

//                 lessAdvancesToDriver: Number(
//                     settlementData?.settlement?.totalAdvances || 0
//                 ),

//                 netPayableToDriver: calculatedNetPayable,

//                 paymentMode,
//                 paymentDate,
//                 remarks,

//                 lrDetails: {
//                     lrNumber: tripDetails?.lrNo || "",
//                     lrDate: tripDetails?.lrDate || null,
//                     tripNumber: tripDetails?.tripNo || "",
//                     tripDate: tripDetails?.tripDate || null,
//                     driverName: tripDetails?.driverName || "",
//                     tripStatus: tripDetails?.tripStatus || "",
//                     from: tripDetails?.from || "",
//                     to: tripDetails?.to || "",
//                     consignor: tripDetails?.consignor || "",
//                     consignee: tripDetails?.consignee || "",
//                     vehicleNo: tripDetails?.vehicleNo || "",
//                     goods: tripDetails?.goods || "",

//                     expectedFreight: freightAmount,

//                     totalTripExpense:
//                         settlementData?.totalExpenses || 0,

//                     balance:
//                         tripDetails?.balanceAmount || 0,
//                 },

//                 expenses:
//                     settlementData?.expenseRows || [],

//                 advances:
//                     settlementData?.advanceRows || [],
//             };

//             /* =====================================================
//                EDIT MODE
//                Prevent duplicate Payment and Receipt vouchers.
//             ===================================================== */

//             if (isEditMode) {
//                 await dispatch(
//                     updateDriverSettlement({
//                         voucherNumber:
//                             editRecord?.settlementNumber ||
//                             voucherNumber,

//                         payload,
//                     }) as any
//                 ).unwrap();

//                 toast.success(
//                     "Driver Settlement Updated Successfully"
//                 );

//                 navigate(
//                     "/bookEz/transportation/driver-settlement"
//                 );

//                 return;
//             }

//             /* =====================================================
//                CREATE DRIVER SETTLEMENT
//             ===================================================== */

//             const settlementResponse = await dispatch(
//                 createDriverSettlement(payload) as any
//             ).unwrap();

//             const settlementNumber =
//                 getSettlementVoucherNumber(
//                     settlementResponse
//                 );

//             if (!settlementNumber) {
//                 throw new Error(
//                     "Settlement created, but settlement number was not returned"
//                 );
//             }

//             let paymentVoucherNumber = "";
//             let receiptVoucherNumber = "";

//             /* =====================================================
//                CREATE PAYMENT FOR ALL TRIP EXPENSES
//             ===================================================== */

//             if (expenseAmount > 0) {
//                 if (!driverAccountCode) {
//                     throw new Error(
//                         "Driver account code is required to create expense payment"
//                     );
//                 }

//                 if (!driverAccountName) {
//                     throw new Error(
//                         "Driver account name is required to create expense payment"
//                     );
//                 }

//                 const paymentPayload: any = {
//                     payVoucherNumber: "AUTO",
//                     payVoucherDate: paymentDate,

//                     payAccountCode: customerAccountCode,
//                     payAccountName: customerAccountName,

//                     // payStatus: "close",

//                     payRemark:
//                         remarks ||
//                         `Trip expense payment against Driver Settlement ${settlementNumber}`,

//                     paymentMode,
//                     bankReferenceNumber: "",
//                     paidBy: "",

//                     payBody: [
//                         {
//                             id: Date.now(),

//                             accountCode: customerAccountCode,
//                             accountName: customerAccountName,

//                             amount: String(expenseAmount),
//                             netAmount: String(expenseAmount),

//                             references: [
//                                 {
//                                     referenceType: "NEW",
//                                     adjustedAmount:
//                                         String(expenseAmount),
//                                 },
//                             ],

//                             remarks:
//                                 `Trip expense payment against settlement ${settlementNumber}`,
//                         },
//                     ],

//                     payFooter: {
//                         netAmount: String(expenseAmount),
//                         adjustedAmount: String(expenseAmount),
//                         balanceAmount: "0",
//                     },

//                     sourceModule: "DRIVER_SETTLEMENT",
//                     sourceVoucherNumber:
//                         settlementNumber,

//                     transportOrderNumber,

//                     transactionPurpose:
//                         "TRIP_EXPENSE_PAYMENT",
//                 };

//                 const paymentResponse = await dispatch(
//                     addPayment({
//                         payload: paymentPayload,
//                     }) as any
//                 ).unwrap();

//                 paymentVoucherNumber =
//                     getPaymentVoucherNumber(
//                         paymentResponse
//                     );

//                 if (!paymentVoucherNumber) {
//                     console.warn(
//                         "Expense payment created, but voucher number was not returned",
//                         paymentResponse
//                     );
//                 }
//             }

//             /* =====================================================
//                CREATE RECEIPT FOR EXPECTED FREIGHT
//             ===================================================== */

//             if (freightAmount > 0) {
//                 if (!customerAccountCode) {
//                     throw new Error(
//                         "Customer account code is required to create freight receipt"
//                     );
//                 }

//                 if (!customerAccountName) {
//                     throw new Error(
//                         "Customer account name is required to create freight receipt"
//                     );
//                 }

//                 const receiptPayload: any = {
//                     recVoucherNumber: "AUTO",
//                     recVoucherDate: paymentDate,

//                     recAccountCode: customerAccountCode,
//                     recAccountName: customerAccountName,

//                     // recStatus: "close",

//                     recRemark:
//                         remarks ||
//                         `Freight receipt against Driver Settlement ${settlementNumber}`,

//                     paymentMode,
//                     bankReferenceNumber: "",
//                     receivedBy: "",

//                     recBody: [
//                         {
//                             id: Date.now(),

//                             accountCode:
//                                 customerAccountCode,

//                             accountName:
//                                 customerAccountName,

//                             amount: String(freightAmount),
//                             netAmount: String(freightAmount),

//                             references: [
//                                 {
//                                     referenceType: "NEW",
//                                     adjustedAmount:
//                                         String(freightAmount),
//                                 },
//                             ],

//                             remarks:
//                                 `Freight receipt against settlement ${settlementNumber}`,
//                         },
//                     ],

//                     recFooter: {
//                         netAmount: String(freightAmount),
//                         adjustedAmount:
//                             String(freightAmount),
//                         balanceAmount: "0",
//                     },

//                     sourceModule: "DRIVER_SETTLEMENT",
//                     sourceVoucherNumber:
//                         settlementNumber,

//                     transportOrderNumber,

//                     transactionPurpose:
//                         "FREIGHT_RECEIPT",
//                 };

//                 const receiptResponse = await dispatch(
//                     addSalesReceipt({
//                         payload: receiptPayload,
//                     }) as any
//                 ).unwrap();

//                 receiptVoucherNumber =
//                     getReceiptVoucherNumber(
//                         receiptResponse
//                     );

//                 if (!receiptVoucherNumber) {
//                     console.warn(
//                         "Freight receipt created, but voucher number was not returned",
//                         receiptResponse
//                     );
//                 }
//             }

//             /* =====================================================
//                LINK ACCOUNTING VOUCHERS TO SETTLEMENT
//             ===================================================== */

//             const expensePaymentStatus =
//                 expenseAmount <= 0
//                     ? "NOT_REQUIRED"
//                     : paymentVoucherNumber
//                         ? "CREATED"
//                         : "VOUCHER_NUMBER_PENDING";

//             const freightReceiptStatus =
//                 freightAmount <= 0
//                     ? "NOT_REQUIRED"
//                     : receiptVoucherNumber
//                         ? "CREATED"
//                         : "VOUCHER_NUMBER_PENDING";

//             const accountingStatus =
//                 expenseAmount <= 0 &&
//                     freightAmount <= 0
//                     ? "NOT_REQUIRED"
//                     : (
//                         (
//                             expenseAmount <= 0 ||
//                             Boolean(paymentVoucherNumber)
//                         ) &&
//                         (
//                             freightAmount <= 0 ||
//                             Boolean(receiptVoucherNumber)
//                         )
//                     )
//                         ? "CREATED"
//                         : "PARTIALLY_CREATED";

//             await dispatch(
//                 updateDriverSettlement({
//                     voucherNumber: settlementNumber,

//                     payload: {
//                         ...payload,

//                         paymentVoucherNumber,
//                         receiptVoucherNumber,

//                         accountingReferences: {
//                             expensePayment: {
//                                 voucherNumber:
//                                     paymentVoucherNumber,

//                                 amount:
//                                     expenseAmount,

//                                 accountCode:
//                                     driverAccountCode,

//                                 accountName:
//                                     driverAccountName,

//                                 status:
//                                     expensePaymentStatus,
//                             },

//                             freightReceipt: {
//                                 voucherNumber:
//                                     receiptVoucherNumber,

//                                 amount:
//                                     freightAmount,

//                                 accountCode:
//                                     customerAccountCode,

//                                 accountName:
//                                     customerAccountName,

//                                 status:
//                                     freightReceiptStatus,
//                             },
//                         },

//                         accountingStatus,
//                     },
//                 }) as any
//             ).unwrap();

//             /* =====================================================
//                SUCCESS MESSAGE
//             ===================================================== */

//             if (
//                 expenseAmount > 0 &&
//                 freightAmount > 0
//             ) {
//                 toast.success(
//                     `Settlement created with Payment ${paymentVoucherNumber || ""
//                     } and Receipt ${receiptVoucherNumber || ""
//                     }`
//                 );
//             } else if (expenseAmount > 0) {
//                 toast.success(
//                     paymentVoucherNumber
//                         ? `Settlement and Expense Payment ${paymentVoucherNumber} created successfully`
//                         : "Settlement and Expense Payment created successfully"
//                 );
//             } else if (freightAmount > 0) {
//                 toast.success(
//                     receiptVoucherNumber
//                         ? `Settlement and Freight Receipt ${receiptVoucherNumber} created successfully`
//                         : "Settlement and Freight Receipt created successfully"
//                 );
//             } else {
//                 toast.success(
//                     "Driver Settlement created. No expense payment or freight receipt was required."
//                 );
//             }

//             navigate(
//                 "/bookEz/transportation/driver-settlement"
//             );
//         } catch (error: any) {
//             console.error(
//                 "Driver settlement accounting error:",
//                 error
//             );

//             toast.error(
//                 error?.payload?.message ||
//                 error?.response?.data?.message ||
//                 error?.message ||
//                 `Failed to ${isEditMode
//                     ? "update"
//                     : "create"
//                 } driver settlement`
//             );
//         } finally {
//             setPageLoading(false);
//         }
//     };
//     return (
//         <div className="flex h-full w-full flex-col bg-card shadow-sm">
//             <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3">
//                 <div
//                     className="flex items-center"
//                 >
//                     <button
//                         type="button"
//                         onClick={() => navigate(-1)}
//                         className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
//                         title="Go back"
//                     >
//                         <ArrowLeft size={18} />
//                     </button>
//                     <div>

//                         <h1 className="truncate text-lg font-bold text-card-foreground">
//                             <span>{isEditMode ? "Edit Driver Settlement" : "Driver Settlement"}</span>
//                         </h1>

//                         <p className=" text-sm text-muted-foreground">
//                             Salary based driver settlement using allocation, order, LR, trip expense and advances.
//                         </p>
//                     </div>
//                 </div>
//             </div>

//             <div className="min-h-0 flex-1 overflow-auto p-2">
//                 <div className="space-y-4">
//                     <FormSectionCard
//                         index={1}
//                         title="Select Driver & Order"
//                         icon={<Users size={17} />}
//                         expanded={true}
//                         onToggle={() => { }}
//                     >
//                         <div>
//                             <label className="mb-1 block text-sm font-medium text-card-foreground">
//                                 Driver <span className="text-danger">*</span>
//                             </label>

//                             <Select
//                                 value={selectedDriverOption}
//                                 options={driverOptions}
//                                 placeholder={
//                                     driversLoader ? "Loading drivers..." : "Select Driver"
//                                 }
//                                 isDisabled={driversLoader || pageLoading || isEditMode}
//                                 isSearchable
//                                 onChange={(option: any) =>
//                                     handleDriverSelect(option?.value || "")
//                                 }
//                                 classNamePrefix="rs"
//                             />
//                         </div>

//                         <div>
//                             <label className="mb-1 block text-sm font-medium text-card-foreground">
//                                 Order / Trip <span className="text-danger">*</span>
//                             </label>

//                             <Select
//                                 value={
//                                     isEditMode
//                                         ? { label: selectedTripId, value: selectedTripId }
//                                         : selectedOrderOption
//                                 }
//                                 options={orderOptions}
//                                 placeholder={
//                                     !selectedDriverId
//                                         ? "Select driver first"
//                                         : pageLoading
//                                             ? "Loading orders..."
//                                             : "Select Order / Trip"
//                                 }
//                                 isDisabled={!selectedDriverId || pageLoading || isEditMode}
//                                 isSearchable
//                                 onChange={(option: any) =>
//                                     handleOrderSelect(option?.value || "")
//                                 }
//                                 classNamePrefix="rs"
//                             />
//                         </div>

//                         <div>
//                             <label className="mb-1 block text-sm font-medium text-card-foreground">
//                                 Driver Mobile
//                             </label>

//                             <input
//                                 disabled
//                                 value={driverDetail?.mobileNumber || ""}
//                                 className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
//                             />
//                         </div>

//                         <div>
//                             <label className="mb-1 block text-sm font-medium text-card-foreground">
//                                 License Number
//                             </label>

//                             <input
//                                 disabled
//                                 value={driverDetail?.licenseNumber || ""}
//                                 className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
//                             />
//                         </div>

//                         <div>
//                             <label className="mb-1 block text-sm font-medium text-card-foreground">
//                                 License Expiry
//                             </label>

//                             <input
//                                 type="date"
//                                 disabled
//                                 value={formatDateForInput(driverDetail?.licenseExpiryDate)}
//                                 className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
//                             />
//                         </div>
//                     </FormSectionCard>

//                     {tripPendingAccept && (
//                         <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
//                             Trip not yet accepted by driver — settlement preview only.
//                         </div>
//                     )}

//                     <FormSectionCard
//                         index={2}
//                         title="Trip / LR Details"
//                         icon={<FileText size={17} />}
//                         expanded={true}
//                         onToggle={() => { }}
//                     >
//                         <div className="md:col-span-2 xl:col-span-3">
//                             {fetchingEdit ? (
//                                 <EmptyHint>Loading settlement details...</EmptyHint>
//                             ) : !selectedTripId ? (
//                                 <EmptyHint>
//                                     Select order / trip to view autofilled details.
//                                 </EmptyHint>
//                             ) : !tripDetails ? (
//                                 <EmptyHint>No trip details available.</EmptyHint>
//                             ) : (
//                                 <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
//                                     <DetailCell
//                                         label="Order / Trip No"
//                                         value={tripDetails.tripNo}
//                                     />

//                                     <DetailCell label="LR No" value={tripDetails.lrNo} />

//                                     <DetailCell
//                                         label="Trip Date"
//                                         value={formatDateTime(tripDetails.tripDate)}
//                                     />

//                                     <DetailCell
//                                         label="LR Date"
//                                         value={formatDateTime(tripDetails.lrDate)}
//                                     />

//                                     <DetailCell
//                                         label="Driver"
//                                         value={tripDetails.driverName}
//                                     />

//                                     <DetailCell
//                                         label="Trip Status"
//                                         value={tripDetails.tripStatus}
//                                     />

//                                     <DetailCell label="From" value={tripDetails.from} />

//                                     <DetailCell label="To" value={tripDetails.to} />

//                                     <DetailCell
//                                         label="Consignor / Customer"
//                                         value={tripDetails.consignor}
//                                     />

//                                     <DetailCell
//                                         label="Consignee"
//                                         value={tripDetails.consignee}
//                                     />

//                                     <DetailCell
//                                         label="Vehicle No"
//                                         value={tripDetails.vehicleNo}
//                                     />

//                                     <DetailCell label="Goods" value={tripDetails.goods} />

//                                     <DetailCell
//                                         label="Expected Freight"
//                                         value={formatMoney(tripDetails.expectedFreight)}
//                                     />

//                                     <DetailCell
//                                         label="Total Trip Expense"
//                                         value={formatMoney(tripDetails.totalTripExpense)}
//                                     />

//                                     <DetailCell
//                                         label="Balance"
//                                         value={formatMoney(tripDetails.balanceAmount)}
//                                     />
//                                 </div>
//                             )}
//                         </div>
//                     </FormSectionCard>

//                     <FormSectionCard
//                         index={3}
//                         title="Trip Expenses Details"
//                         icon={<ListChecks size={17} />}
//                         expanded={true}
//                         onToggle={() => { }}
//                     >
//                         <div className="md:col-span-2 xl:col-span-3">
//                             {fetchingEdit ? (
//                                 <EmptyHint>Loading settlement details...</EmptyHint>
//                             ) : !selectedTripId ? (
//                                 <EmptyHint>Select order / trip to view expenses.</EmptyHint>
//                             ) : !isEditMode && !selectedTripExpense ? (
//                                 <EmptyHint>No trip expense recorded yet.</EmptyHint>
//                             ) : !settlementData.expenseRows.length ? (
//                                 <EmptyHint>No expense entries in this trip.</EmptyHint>
//                             ) : (
//                                 <div className="overflow-hidden rounded-lg border border-border">
//                                     <div className="grid grid-cols-12 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
//                                         <div className="col-span-3">Date</div>
//                                         <div className="col-span-2">Type</div>
//                                         <div className="col-span-5">Description</div>
//                                         <div className="col-span-2 text-right">
//                                             Amount
//                                         </div>
//                                     </div>

//                                     {settlementData.expenseRows.map((item: any) => (
//                                         <div
//                                             key={item.id}
//                                             className="grid grid-cols-12 border-t border-border px-3 py-2 text-sm"
//                                         >
//                                             <div className="col-span-3 text-muted-foreground">
//                                                 {formatDateTime(item.date)}
//                                             </div>

//                                             <div className="col-span-2">{item.type}</div>

//                                             <div className="col-span-5">
//                                                 {item.description}
//                                             </div>

//                                             <div className="col-span-2 text-right">
//                                                 {formatMoney(item.amount)}
//                                             </div>
//                                         </div>
//                                     ))}

//                                     <div className="flex items-center justify-between border-t border-border bg-background px-3 py-2 text-sm font-semibold">
//                                         <span>Total Expenses</span>
//                                         <span>
//                                             {formatMoney(settlementData.totalExpenses)}
//                                         </span>
//                                     </div>

//                                     <div className="flex items-center justify-between border-t border-border bg-background px-3 py-2 text-sm font-semibold">
//                                         <span>Total Allowed Expenses</span>
//                                         <span>
//                                             {formatMoney(
//                                                 settlementData.totalAllowedExpenses
//                                             )}
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </FormSectionCard>

//                     <FormSectionCard
//                         index={4}
//                         title="Advances to Driver"
//                         icon={<BadgeIndianRupee size={17} />}
//                         expanded={true}
//                         onToggle={() => { }}
//                     >
//                         <div className="md:col-span-2 xl:col-span-3">
//                             {fetchingEdit ? (
//                                 <EmptyHint>Loading settlement details...</EmptyHint>
//                             ) : !selectedTripId ? (
//                                 <EmptyHint>Select order / trip to view advances.</EmptyHint>
//                             ) : !isEditMode && !selectedTripExpense ? (
//                                 <EmptyHint>No trip expense recorded yet.</EmptyHint>
//                             ) : !settlementData.advanceRows.length ? (
//                                 <EmptyHint>No advances recorded for this trip.</EmptyHint>
//                             ) : (
//                                 <div className="overflow-hidden rounded-lg border border-border">
//                                     <div className="grid grid-cols-12 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
//                                         <div className="col-span-3">Date</div>
//                                         <div className="col-span-3">Source</div>
//                                         <div className="col-span-3">Mode</div>
//                                         <div className="col-span-3 text-right">
//                                             Amount
//                                         </div>
//                                     </div>

//                                     {settlementData.advanceRows.map((item: any) => (
//                                         <div
//                                             key={item.id}
//                                             className="grid grid-cols-12 border-t border-border px-3 py-2 text-sm"
//                                         >
//                                             <div className="col-span-3 text-muted-foreground">
//                                                 {formatDateTime(item.date)}
//                                             </div>

//                                             <div className="col-span-3">
//                                                 {item.source}
//                                             </div>

//                                             <div className="col-span-3">
//                                                 {item.paymentMode}
//                                             </div>

//                                             <div className="col-span-3 text-right">
//                                                 {formatMoney(item.amount)}
//                                             </div>
//                                         </div>
//                                     ))}

//                                     <div className="flex items-center justify-between border-t border-border bg-background px-3 py-2 text-sm font-semibold">
//                                         <span>Total Advances</span>
//                                         <span>
//                                             {formatMoney(settlementData.totalAdvances)}
//                                         </span>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </FormSectionCard>

//                     <FormSectionCard
//                         index={5}
//                         title="Settlement Summary"
//                         icon={<PieChart size={17} />}
//                         expanded={true}
//                         onToggle={() => { }}
//                     >
//                         {renderFields(settlementFields)}

//                         <div className="md:col-span-2 xl:col-span-4">
//                             <div className="rounded-lg border border-border bg-background p-4">
//                                 <SummaryLine
//                                     label="Gross Amount (Salary + Incentives)"
//                                     value={settlementData.settlement.grossAmount}
//                                 />

//                                 <SummaryLine
//                                     label="Less: Allowed Expenses"
//                                     value={-settlementData.settlement.allowedExpenses}
//                                     muted
//                                 />

//                                 <SummaryLine
//                                     label="Less: Advances to Driver"
//                                     value={-settlementData.settlement.totalAdvances}
//                                     muted
//                                 />

//                                 <div className="mt-4 flex items-center justify-between rounded-lg border border-success/30 bg-success/10 p-4">
//                                     <div>
//                                         <p className="text-sm font-semibold text-success">
//                                             Net Payable to Driver
//                                         </p>

//                                         <p className="text-xs font-semibold text-muted-foreground">
//                                             Salary + Incentives - Expenses - Advances
//                                         </p>
//                                     </div>

//                                     <p className="text-2xl font-semibold text-success">
//                                         {formatMoney(
//                                             settlementData.settlement.netPayable
//                                         )}
//                                     </p>
//                                 </div>

//                                 <p className="mt-2 text-right text-xs font-semibold text-muted-foreground">
//                                     {(remarks || "").length}/{REMARKS_MAX}
//                                 </p>
//                             </div>
//                         </div>
//                     </FormSectionCard>
//                 </div>
//             </div>

//             <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
//                 <button
//                     type="button"
//                     onClick={() => navigate(-1)}
//                     disabled={loading}
//                     className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
//                 >
//                     Cancel
//                 </button>

//                 <button
//                     type="button"
//                     onClick={handleSave}
//                     disabled={loading}
//                     className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
//                 >
//                     <Save size={16} />
//                     {loading ? "Loading..." : isEditMode ? "Update & Proceed" : "Save & Proceed"}
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default CreateEditDriverSettlement;












import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    ArrowLeft,
    BadgeIndianRupee,
    FileText,
    ListChecks,
    PieChart,
    Save,
    Users,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { toast } from "react-toastify";

import { FormSectionCard } from "../../../../components/SectionCards";
import { renderField } from "../../../../components/inputs";

import { getProfessionalUsers } from "../../../../redux/slices/professionalSlice/professionalUserSlice";
import { getTransportOrders } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
import {
    getActiveTripAllocations,
    getChildUserByMobile,
} from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";
import { getAllTripExpenses } from "../../../../redux/slices/professionalSlice/transportation/tripExpensesSlice";
import { getAllLRCollection } from "../../../../redux/slices/professionalSlice/transportation/tripLRCollectionSlice";
import { createDriverSettlement, getDriverSettlementByVoucherNumber, updateDriverSettlement } from "../../../../redux/slices/professionalSlice/transportation/driverSettlementSlice";
import { formatDateForInput, formatDateTime, formatMoney } from "../../../../utils/helperFunctions";
import { addSalesReceipt } from "../../../../redux/slices/professionalSlice/salesWorkflow/salesReceipt";
import { addPayment } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/paymentSlice";
import { getAllSystemConfigurations } from "../../../../redux/slices/systemConf";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";

const REMARKS_MAX = 200;

/* ===================================================
   OPTIONS
=================================================== */

const paymentModeOptions = [
    { label: "Cash", value: "Cash" },
    { label: "UPI", value: "UPI" },
    { label: "Bank Transfer", value: "Bank Transfer" },
    { label: "Cheque", value: "Cheque" },
];

/* ===================================================
   EXPENSE PAYMENT — FIXED SOURCE ACCOUNT + EXPENSE
   ACCOUNT MAPPING
=================================================== */

// Header-level pay-from account for trip expense payments is
// always Cash in Hand (hardcoded), regardless of the driver /
// customer selected on this screen.
const CASH_IN_HAND_ACCOUNT_CODE = "ACT-4";
const CASH_IN_HAND_ACCOUNT_NAME = "Cash In Hand";

// Fallback account codes/names used only if the matching field is
// missing from transportationModuleConfiguration in System
// Configuration. The live mapping is built from that configuration
// inside the component (see transportExpenseAccountMap below).
// const DEFAULT_EXPENSE_TYPE_ACCOUNT_MAP: Record<string, { code: string; name: string }> = {
//     "Diesel": { code: "ACT-33", name: "Diesel Refilling" },
//     "Driver Allowance / Food": { code: "ACT-43", name: "Food Expenses" },
//     "Running": { code: "ACT-44", name: "Vehicle Running Cost" },
//     "Breakdown": { code: "ACT-45", name: "Breakdown Expenses" },
//     "Other": { code: "ACT-46", name: "Other Expenses" },
// };

/* ===================================================
   COMMON HELPERS
=================================================== */

const cleanText = (value: any) => String(value || "").trim();

const normalizeText = (value: any) =>
    String(value || "")
        .trim()
        .toLowerCase();

const getInputValue = (input: any) => {
    if (input?.target?.type === "checkbox") return input.target.checked;
    if (input?.target) return input.target.value;
    if (input?.value !== undefined) return input.value;
    return input;
};

const unwrapThunk = async (dispatch: any, action: any) => {
    const res = await dispatch(action);

    if (res?.error) {
        throw res.error;
    }

    return res?.payload ?? res;
};

const getApiList = (res: any) => {
    if (Array.isArray(res)) return res;

    const data = res?.data || res || {};

    if (Array.isArray(data)) return data;

    const list =
        data?.records ||
        data?.data?.records ||
        data?.result ||
        data?.data?.result ||
        data?.items ||
        data?.data?.items ||
        data?.data ||
        [];

    return Array.isArray(list) ? list : [];
};

const getLoginUser = () => {
    try {
        return JSON.parse(localStorage.getItem("loginuser") || "{}");
    } catch {
        return {};
    }
};

const getFullName = (user: any = {}) =>
    [
        user?.userFirstName,
        user?.userMiddleName,
        user?.userLastName || user?.userSurname,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

const isAssignedStatus = (value: any) =>
    String(value || "").trim().toLowerCase() === "assigned";

/* ===================================================
   DRIVER HELPERS — SAME PATTERN AS ALLOCATION
=================================================== */

const normalizeDriverUsers = (users: any[] = []) => {
    return (Array.isArray(users) ? users : [])
        .map((user: any) => {
            const customFields = user?.childUserCustomFields || {};
            const mobileNumber = String(user?.userMobileNumberHash || "").trim();
            const userType = String(user?.userType || "").toLowerCase();
            const isActive = String(user?.isUserActive || "") === "1";
            const status = String(customFields?.status || user?.status || "");

            return {
                raw: user,

                driverId: mobileNumber,
                driverName: getFullName(user) || mobileNumber,
                mobileNumber,

                licenseNumber:
                    customFields?.licenseNumber ||
                    user?.licenseNumber ||
                    user?.drivingLicenseNumber ||
                    "",

                licenseExpiryDate:
                    customFields?.licenseExpiry ||
                    user?.licenseExpiryDate ||
                    user?.drivingLicenseExpiryDate ||
                    "",

                userType: user?.userType || "",
                status,
                isActive,
                hasParent: Boolean(user?.parentUserMobileNumber),
                isDriverType:
                    userType.includes("tax payer") ||
                    userType.includes("employee") ||
                    userType.includes("driver"),
            };
        })
        .filter((driver: any) => {
            return (
                driver.driverId &&
                driver.isActive &&
                driver.hasParent &&
                driver.isDriverType &&
                !isAssignedStatus(driver.status)
            );
        });
};

const flattenChildUsers = (users: any[] = []) => {
    return Array.isArray(users)
        ? users.flatMap((item: any) => {
            if (Array.isArray(item?.ChildUsers)) return item.ChildUsers;
            return item;
        })
        : [];
};

/* ===================================================
   ORDER / TRIP / LR HELPERS
=================================================== */



const getVehicleNumber = (record: any, fallback = "-") =>
    record?.vehicle?.vehicleNumber ||
    record?.vehicleDetails?.vehicleNumber ||
    record?.vehicleSelection?.vehicleNumber ||
    record?.vehicleNumber ||
    record?.tripDetails?.vehicleNo ||
    fallback;




const getDriverIdFromAny = (record: any) =>
    cleanText(
        record?.driver?.driverId ||
        record?.driver?.mobileNumber ||
        record?.driverDetails?.driverId ||
        record?.driverDetails?.driverMobileNumber ||
        record?.driverDetails?.mobileNumber ||
        record?.driverAllocation?.driverId ||
        record?.driverAllocation?.mobileNumber ||
        record?.assignedDriverMobile ||
        record?.tripAssignedToMobile ||
        ""
    );

const getDriverNameFromAny = (record: any) =>
    normalizeText(
        record?.driver?.driverName ||
        record?.driverDetails?.driverName ||
        record?.driverName ||
        record?.driverAllocation?.driverName ||
        ""
    );

const isActiveTripRecord = (record: any) => {
    const status = normalizeText(record?.tripStatus || record?.status || "");

    return status !== "cancelled";
};

const recordMatchesDriver = (record: any, driver: any) => {
    if (!record || !driver?.driverId) return false;

    const driverId = cleanText(driver?.driverId);
    const driverMobile = cleanText(driver?.mobileNumber);
    const driverName = normalizeText(driver?.driverName);

    const candidates = [
        getDriverIdFromAny(record),
        record?.assignedDriverMobile,
        record?.tripAssignedToMobile,
    ]
        .map((value) => cleanText(value))
        .filter(Boolean);

    const nameCandidate = getDriverNameFromAny(record);

    if (driverId && candidates.includes(driverId)) return true;
    if (driverMobile && candidates.includes(driverMobile)) return true;
    if (driverName && nameCandidate === driverName) return true;

    return false;
};

const findTransportOrderForTrip = (orders: any[] = [], tripId = "") => {
    const normalizedTrip = normalizeText(tripId);

    if (!normalizedTrip) return null;

    return (
        orders.find((item: any) => {
            const candidates = [
                item?.orderNumber,
                item?.transportOrderNumber,
                item?.tOrderNumber,
                item?.tripNumber,
                item?.tripId,
                item?.allocationVoucherNumber,
                item?.voucherNumber,
            ]
                .map((value) => normalizeText(value))
                .filter(Boolean);

            return candidates.includes(normalizedTrip);
        }) || null
    );
};

const findAllocationForTrip = (allocations: any[] = [], tripId = "") => {
    const normalizedTrip = normalizeText(tripId);

    if (!normalizedTrip) return null;

    return (
        allocations.find((item: any) => {
            const candidates = [
                item?.tripAllocationVoucherNumber,
                item?.tripNumber,
                item?.voucherNumber,
                item?.allocationNumber,
                item?.transportOrder?.transportOrderNumber,
            ]
                .map((value) => normalizeText(value))
                .filter(Boolean);

            return candidates.includes(normalizedTrip);
        }) || null
    );
};

const findTripExpenseForTrip = (tripExpenses: any[] = [], tripId = "") => {
    const normalizedTrip = normalizeText(tripId);

    if (!normalizedTrip) return null;

    return (
        tripExpenses.find((item: any) => {
            const candidates = [
                item?.tripId,
                item?.tripNumber,
                item?.transportOrderNumber,
                item?.allocationVoucherNumber,
                item?.tripAllocationVoucherNumber,
                item?.voucherNumber,
            ]
                .map((value) => normalizeText(value))
                .filter(Boolean);

            return candidates.includes(normalizedTrip);
        }) || null
    );
};

const findLREntryForTrip = (lrEntries: any[] = [], tripId = "") => {
    const normalizedTrip = normalizeText(tripId);

    if (!normalizedTrip) return null;

    return (
        lrEntries.find((item: any) => {
            const candidates = [
                item?.tripNumber,
                item?.transportOrderNumber,
                item?.orderNumber,
                item?.transportOrder?.transportOrderNumber,
                item?.transportOrder?.orderNumber,
                item?.transportOrder?.voucherNumber,
                item?.voucherNumber,
            ]
                .map((value) => normalizeText(value))
                .filter(Boolean);

            return candidates.includes(normalizedTrip);
        }) || null
    );
};

const buildOrderOptionsForDriver = ({
    selectedDriver,
    activeAllocations = [],
    transportOrders = [],
    tripExpenses = [],
    lrEntries = [],
}: any = {}) => {
    if (!selectedDriver) return [];

    const optionMap = new Map<string, any>();

    const addOption = (transportOrderNumber: string, base: any = {}) => {
        const value = cleanText(transportOrderNumber);

        if (!value) return;

        const allocation =
            base.allocation ||
            findAllocationForTrip(activeAllocations, value);

        const tripExpense =
            base.tripExpense ||
            findTripExpenseForTrip(tripExpenses, value);

        const transportOrder =
            base.transportOrder ||
            allocation?.transportOrder ||
            findTransportOrderForTrip(transportOrders, value);

        const lrEntry =
            base.lrEntry ||
            findLREntryForTrip(lrEntries, value);

        const vehicleNo =
            getVehicleNumber(allocation, "") ||
            getVehicleNumber(tripExpense, "") ||
            getVehicleNumber(lrEntry, "") ||
            getVehicleNumber(transportOrder, "") ||
            "-";

        const tripStatus =
            transportOrder?.tripStatus ||
            allocation?.tripStatus ||
            tripExpense?.tripStatus ||
            transportOrder?.status ||
            "Open";

        optionMap.set(value, {
            label: `${value} ${vehicleNo ? ` • ${vehicleNo} (${tripStatus})` : ""
                }`,
            value,
            allocation,
            transportOrder,
            tripExpense,
            lrEntry,
        });
    };

    /* ==========================================================
       ACTIVE ALLOCATIONS
    ========================================================== */

    for (const allocation of activeAllocations || []) {
        if (!isActiveTripRecord(allocation)) continue;
        if (!recordMatchesDriver(allocation, selectedDriver)) continue;

        const transportOrder =
            allocation?.transportOrder;

        const orderNumber =
            transportOrder?.transportOrderNumber || "";

        addOption(orderNumber, {
            allocation,
            transportOrder,
        });
    }

    /* ==========================================================
       TRIP EXPENSES
    ========================================================== */

    for (const expense of tripExpenses || []) {
        if (!isActiveTripRecord(expense)) continue;
        if (!recordMatchesDriver(expense, selectedDriver)) continue;

        const transportOrder =
            findTransportOrderForTrip(
                transportOrders,
                expense?.transportOrderNumber
            );

        const orderNumber =
            expense?.transportOrderNumber ||
            transportOrder?.transportOrderNumber ||
            "";

        addOption(orderNumber, {
            tripExpense: expense,
            transportOrder,
        });
    }

    /* ==========================================================
       LR ENTRIES
    ========================================================== */

    for (const lr of lrEntries || []) {

        const transportOrder =
            lr?.transportOrder ||
            findTransportOrderForTrip(
                transportOrders,
                lr?.transportOrderNumber
            );

        const orderNumber =
            lr?.transportOrderNumber ||
            transportOrder?.transportOrderNumber ||
            "";

        if (!orderNumber) continue;

        const matchedAllocation =
            findAllocationForTrip(activeAllocations, orderNumber);

        const matchedExpense =
            findTripExpenseForTrip(tripExpenses, orderNumber);

        const matchedDriver =
            recordMatchesDriver(matchedAllocation, selectedDriver) ||
            recordMatchesDriver(matchedExpense, selectedDriver);

        if (!matchedDriver) continue;

        addOption(orderNumber, {
            lrEntry: lr,
            allocation: matchedAllocation,
            tripExpense: matchedExpense,
            transportOrder,
        });
    }

    return Array.from(optionMap.values()).sort((a, b) =>
        a.value.localeCompare(b.value)
    );
};

/* ===================================================
   EXPENSE SUMMARY HELPERS
=================================================== */

const sumAmounts = (entries: any[] = []) =>
    entries.reduce((acc, row) => acc + Number(row?.amount || 0), 0);

const computeTripExpenseSummary = (tripExpense: any = {}) => {
    const expenses = tripExpense?.expenses || {};

    const totalAdvanceReceived =
        Number(expenses?.advanceReceived?.totalAdvance || 0) ||
        sumAmounts(expenses?.advanceReceived?.entries || []);

    const totalDieselCost =
        Number(expenses?.dieselCost?.totalDieselCost || 0) ||
        sumAmounts(expenses?.dieselCost?.entries || []);

    const totalFoodCost =
        Number(expenses?.foodCost?.totalFoodCost || 0) ||
        sumAmounts(expenses?.foodCost?.entries || []);

    const totalRunningCost =
        Number(expenses?.runningCost?.totalRunningCost || 0) ||
        sumAmounts(expenses?.runningCost?.entries || []);

    const totalBreakdownCost =
        Number(expenses?.breakdownCost?.totalBreakdownCost || 0) ||
        sumAmounts(expenses?.breakdownCost?.entries || []);

    const totalOtherCost =
        Number(expenses?.otherCost?.totalOtherCost || 0) ||
        sumAmounts(expenses?.otherCost?.entries || []);

    const totalTripExpense =
        Number(tripExpense?.summary?.totalTripExpense || 0) ||
        totalDieselCost +
        totalFoodCost +
        totalRunningCost +
        totalBreakdownCost +
        totalOtherCost;

    const balanceAmount =
        Number(tripExpense?.summary?.balanceAmount || 0) ||
        Math.max(totalTripExpense - totalAdvanceReceived, 0);

    return {
        totalAdvanceReceived,
        totalTripExpense,
        balanceAmount,
    };
};

const buildExpenseRowsFromTripExpense = (tripExpense: any) => {
    if (!tripExpense) return [];

    const expenses = tripExpense?.expenses || {};
    const rows: any[] = [];

    const pushRows = (entries: any[] = [], type: string, descriptionFn: any) => {
        entries.forEach((entry: any, index: number) => {
            const amount = Number(entry?.amount || 0);

            if (!amount && !entry?.fuelStation && !entry?.expenseType) return;

            rows.push({
                id: `${type}-${index}`,
                date:
                    entry?.date ||
                    entry?.receivedDate ||
                    entry?.billDate ||
                    tripExpense?.tripDate ||
                    tripExpense?.enteredDate ||
                    "",
                type,
                description: descriptionFn(entry),
                amount,
            });
        });
    };

    pushRows(
        expenses?.dieselCost?.entries,
        "Diesel",
        (entry: any) =>
            [entry?.fuelStation, entry?.billNumber].filter(Boolean).join(" • ") ||
            "Diesel Refilling"
    );

    pushRows(
        expenses?.foodCost?.entries,
        "Driver Allowance / Food",
        (entry: any) =>
            [entry?.mealType, entry?.location].filter(Boolean).join(" • ") ||
            "Food / allowance"
    );

    pushRows(
        expenses?.runningCost?.entries,
        "Running",
        (entry: any) =>
            [entry?.expenseType, entry?.location].filter(Boolean).join(" • ") ||
            "Running expense"
    );

    pushRows(
        expenses?.breakdownCost?.entries,
        "Breakdown",
        (entry: any) =>
            [entry?.issueType, entry?.serviceCenter].filter(Boolean).join(" • ") ||
            "Breakdown expense"
    );

    pushRows(
        expenses?.otherCost?.entries,
        "Other",
        (entry: any) =>
            [entry?.expenseType, entry?.remarks].filter(Boolean).join(" • ") ||
            "Other expense"
    );

    const pod = tripExpense?.pod || {};
    const podStatus = cleanText(pod?.deliveryStatus);

    if (podStatus && normalizeText(podStatus) !== "pending") {
        rows.push({
            id: "pod-summary",
            date: pod?.deliveryDateTime || tripExpense?.tripDate || "",
            type: "POD",
            description: [podStatus, pod?.receiverName, pod?.deliveryLocation]
                .filter(Boolean)
                .join(" • "),
            amount: 0,
        });
    }

    return rows;
};

const buildAdvanceRowsFromTripExpense = (tripExpense: any) => {
    const entries = tripExpense?.expenses?.advanceReceived?.entries || [];

    return entries.map((entry: any, index: number) => ({
        id: `advance-${index}`,
        date: entry?.date || entry?.receivedDate || tripExpense?.tripDate || "",
        source: entry?.sourceName || entry?.sourceType || "Advance",
        paymentMode: entry?.paymentMode || "-",
        amount: Number(entry?.amount || 0),
        remarks: entry?.remarks || "",
    }));
};

const mapSelectionToTripDetails = ({
    allocation,
    transportOrder,
    tripExpense,
    lrEntry,

}: any = {}) => {
    const summaryMeta = tripExpense ? computeTripExpenseSummary(tripExpense) : null;

    // const tripStatus = cleanText(
    //     tripExpense?.tripStatus ||
    //     allocation?.tripStatus ||
    //     transportOrder?.tripStatus ||
    //     transportOrder?.status ||
    //     "-"
    // )
    //     .replace(/_/g, " ")
    //     .replace(/\b\w/g, (c) => c.toUpperCase());

    if (!allocation && !transportOrder && !tripExpense && !lrEntry) return null;

    return {
        // ==========================
        // LR DETAILS ONLY
        // ==========================

        lrNo: lrEntry?.lrNumber || "-",
        lrDate: lrEntry?.lrDate || "",

        tripNo: lrEntry?.tripNumber || "-",

        tripDate:
            lrEntry?.loading?.loadingDateTime || "",

        customerCode:
            lrEntry?.customer?.customerCode || "",

        customerName:
            lrEntry?.customer?.customerName || "",

        tripStatus:
            lrEntry?.tripStatus || "-",

        // ==========================
        // CONSIGNOR
        // ==========================

        consignor:
            lrEntry?.consignor?.name || "",

        consignorAddress:
            lrEntry?.consignor?.address || "",

        consignorCity:
            lrEntry?.consignor?.location?.city || "",

        consignorState:
            lrEntry?.consignor?.location?.state || "",

        // ==========================
        // CONSIGNEE
        // ==========================

        consignee:
            lrEntry?.consignee?.name || "",

        consigneeAddress:
            lrEntry?.consignee?.address || "",

        consigneeCity:
            lrEntry?.consignee?.location?.city || "",

        consigneeState:
            lrEntry?.consignee?.location?.state || "",

        // ==========================
        // ROUTE
        // ==========================

        from:
            lrEntry?.route?.source || "",

        to:
            lrEntry?.route?.destination || "",

        routeCode:
            lrEntry?.route?.routeCode || "",

        routeName:
            lrEntry?.route?.routeName || "",

        distanceKm:
            lrEntry?.route?.distanceKm || "",

        // ==========================
        // VEHICLE
        // ==========================

        vehicleCode:
            lrEntry?.vehicle?.vehicleCode || "",

        vehicleNo:
            lrEntry?.vehicle?.vehicleNumber || "",

        vehicleType:
            lrEntry?.vehicle?.vehicleType || "",

        // ==========================
        // DRIVER
        // ==========================

        driverCode:
            lrEntry?.driver?.driverCode || "",

        driverName:
            lrEntry?.driver?.driverName || "",

        // ==========================
        // CARGO
        // ==========================

        productCode:
            lrEntry?.cargo?.productCode || "",

        goods:
            lrEntry?.cargo?.productName || "",

        quantity:
            lrEntry?.cargo?.quantity || "",

        unit:
            lrEntry?.cargo?.unit || "",

        weight:
            lrEntry?.cargo?.weight || "",

        weightUnit:
            lrEntry?.cargo?.weightUnit || "",

        // ==========================
        // FREIGHT
        // ==========================

        agreedFreight:
            Number(lrEntry?.freight?.agreedFreight || 0),

        advancePaid:
            Number(lrEntry?.freight?.advancePaid || 0),

        balancePayable:
            Number(lrEntry?.freight?.balancePayable || 0),

        paymentType:
            lrEntry?.freight?.paymentType || "",

        // ==========================
        // LOADING
        // ==========================

        loadingDateTime:
            lrEntry?.loading?.loadingDateTime || "",

        loadingPoint:
            lrEntry?.loading?.loadingPoint || "",

        // ==========================
        // DELIVERY
        // ==========================

        expectedDeliveryDateTime:
            lrEntry?.delivery?.expectedDeliveryDateTime || "",

        // ==========================
        // DOCUMENTS
        // ==========================

        documents:
            lrEntry?.documents || [],

        remarks:
            lrEntry?.remarks || "",

        // ==========================
        // DRIVER SETTLEMENT ONLY
        // ==========================

        totalTripExpense:
            summaryMeta?.totalTripExpense ?? 0,

        balanceAmount:
            summaryMeta?.balanceAmount ?? 0,

        expectedFreight:
            Number(lrEntry?.freight?.agreedFreight || 0),
    };
};

const computeSettlementSummary = ({
    salary = 0,
    incentives = 0,
    allowedExpenses = 0,
    totalAdvances = 0,
}: any = {}) => {
    const salaryNum = Number(salary || 0);
    const incentivesNum = Number(incentives || 0);
    const allowedNum = Number(allowedExpenses || 0);
    const advancesNum = Number(totalAdvances || 0);

    const grossAmount = salaryNum + incentivesNum;
    const netPayable = grossAmount - allowedNum - advancesNum;

    return {
        salary: salaryNum,
        incentives: incentivesNum,
        grossAmount,
        allowedExpenses: allowedNum,
        totalAdvances: advancesNum,
        netPayable,
    };
};

const buildSettlementFromSelections = ({
    allocation,
    transportOrder,
    tripExpense,
    lrEntry,
    driver,
    salary = "",
    incentives = "",
}: any = {}) => {
    const expenseRows = buildExpenseRowsFromTripExpense(tripExpense);
    const advanceRows = buildAdvanceRowsFromTripExpense(tripExpense);
    const summaryMeta = tripExpense ? computeTripExpenseSummary(tripExpense) : null;

    const totalExpenses = expenseRows.reduce(
        (acc, row) => acc + Number(row.amount || 0),
        0
    );

    const totalAllowedExpenses = summaryMeta?.totalTripExpense ?? totalExpenses;
    const totalAdvances = sumAmounts(advanceRows);

    const settlement = computeSettlementSummary({
        salary,
        incentives,
        allowedExpenses: totalAllowedExpenses,
        totalAdvances,
    });

    return {
        tripDetails: mapSelectionToTripDetails({
            allocation,
            transportOrder,
            tripExpense,
            lrEntry,
            driver,
        }),
        expenseRows,
        advanceRows,
        totalExpenses,
        totalAllowedExpenses,
        totalAdvances,
        settlement,
    };
};



const isTripPendingAccept = (tripExpense: any) => {
    const status = normalizeText(
        tripExpense?.tripStatus ||
        tripExpense?.driverStatus ||
        tripExpense?.acceptanceStatus ||
        ""
    );

    return (
        status === "pending" ||
        status === "assigned" ||
        status === "pending_accept" ||
        status === "pending accept"
    );
};

/* ===================================================
   EDIT-MODE MAPPERS (prefill from GET-by-voucher response)
=================================================== */

const formatTripStatusLabel = (value: any) =>
    cleanText(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase()) || "-";

const mapEditRecordToTripDetails = (record: any) => {
    if (!record) return null;

    const lr = record?.lrDetails || {};

    return {
        tripNo: lr?.tripNumber || record?.transportOrderNumber || "-",
        lrNo: lr?.lrNumber || "-",
        tripDate: lr?.tripDate || "",
        lrDate: lr?.lrDate || "",
        from: lr?.from || "-",
        to: lr?.to || "-",
        consignor: lr?.consignor || "-",
        consignee: lr?.consignee || "-",
        vehicleNo: lr?.vehicleNo || "-",
        goods: lr?.goods || "-",
        driverName: lr?.driverName || "-",
        tripStatus: formatTripStatusLabel(lr?.tripStatus),
        totalTripExpense: Number(lr?.totalTripExpense || 0),
        balanceAmount: Number(lr?.balance || 0),
        expectedFreight: 0,
    };
};

const mapEditRecordToExpenseRows = (record: any) =>
    (record?.expenses || []).map((row: any, index: number) => ({
        id: `edit-expense-${index}`,
        date: row?.date || "",
        type: row?.type || "",
        description: row?.description || "",
        amount: Number(row?.amount || 0),
    }));

const mapEditRecordToAdvanceRows = (record: any) =>
    (record?.advances || []).map((row: any, index: number) => ({
        id: `edit-advance-${index}`,
        date: row?.date || "",
        source: row?.source || "",
        paymentMode: row?.mode || "-",
        amount: Number(row?.amount || 0),
        remarks: row?.remarks || "",
    }));

/* ===================================================
   SMALL DISPLAY COMPONENTS
=================================================== */

const DetailCell = ({ label, value }: any) => (
    <div className="rounded-lg border border-border bg-background p-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">
            {value || "-"}
        </p>
    </div>
);

const SummaryLine = ({ label, value, muted = false }: any) => (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2">
        <p
            className={`text-sm font-semibold ${muted ? "text-muted-foreground" : ""
                }`}
        >
            {label}
        </p>

        <p
            className={`text-sm font-semibold ${muted ? "text-muted-foreground" : ""
                }`}
        >
            {formatMoney(Math.abs(Number(value || 0)))}
        </p>
    </div>
);

const EmptyHint = ({ children }: any) => (
    <p className="rounded-md border border-dashed border-border bg-background p-4 text-sm font-semibold text-muted-foreground">
        {children}
    </p>
);

/* ===================================================
   COMPONENT
=================================================== */

const CreateEditDriverSettlement = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();

    const { voucherNumber } = useParams<{ voucherNumber: string }>();
    const isEditMode = Boolean(voucherNumber);

    const { users = [] } = useSelector((s: any) => s.professionalUser || {});

    const {
        activeAllocations = [],
        driversLoader = false,
    } = useSelector((state: any) => state.tripAllocation || {});

    const { configurations = [] } = useSelector(
        (state: any) => state.systemConfiguration || {}
    );

    const [pageLoading, setPageLoading] = useState(false);
    const [transportOrders, setTransportOrders] = useState<any[]>([]);
    const [tripExpenses, setTripExpenses] = useState<any[]>([]);
    const [lrEntries, setLrEntries] = useState<any[]>([]);

    const [selectedDriverId, setSelectedDriverId] = useState("");
    const [selectedTripId, setSelectedTripId] = useState("");
    const { accounts = [], } = useSelector((state: any) => state.accountMaster || {});

    const [driverDetail, setDriverDetail] = useState<any>({
        driverId: "",
        driverName: "",
        mobileNumber: "",
        licenseNumber: "",
        licenseExpiryDate: "",
    });

    const [salary, setSalary] = useState("");
    const [incentives, setIncentives] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [paymentDate, setPaymentDate] = useState(formatDateForInput(new Date()));
    const [remarks, setRemarks] = useState("");
    const [paymentAccountCode, setPaymentAccountCode] = useState("");
    const [paymentAccountName, setPaymentAccountName] = useState("");

    // Edit-mode state
    const [editRecord, setEditRecord] = useState<any>(null);
    const [fetchingEdit, setFetchingEdit] = useState(false);

    const loading = pageLoading || driversLoader || fetchingEdit;

    const loginUser = useMemo(() => getLoginUser(), []);

    const parentMobile =
        loginUser?.parentUserMobileNumber ||
        loginUser?.parentUserMobileNumberHash ||
        loginUser?.userMobileNumberHash ||
        "";

    const driverUsers = useMemo(() => {
        const list = flattenChildUsers(users);
        return normalizeDriverUsers(list);
    }, [users]);


    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 100000,
                search: "",

            }) as any
        );
    }, [dispatch]);



    const accountMasterByCode = useMemo(() => {
        const map = new Map<
            string,
            {
                code: string;
                name: string;
                raw: any;
            }
        >();

        accounts.forEach((account: any) => {
            const accountCode = cleanText(account?.accountCode);

            if (!accountCode) return;

            map.set(accountCode.toLowerCase(), {
                code: accountCode,
                name: cleanText(account?.accountName),
                raw: account,
            });
        });

        return map;
    }, [accounts]);

    useEffect(() => {
        dispatch(
            getProfessionalUsers({
                page: 1,
                limit: 500,
                withParent: true,
                type: "driver",
                inputFields: [
                    "ParentUser",
                    "ChildUsers",
                    "userFirstName",
                    "userMiddleName",
                    "userLastName",
                    "userMobileNumberHash",
                    "userEmail",
                    "userDOB",
                    "userGender",
                    "userType",
                    "isUserActive",
                    "parentUserMobileNumber",
                    "childUserCustomFields.licenseNumber",
                    "childUserCustomFields.licenseExpiry",
                    "childUserCustomFields.status",
                ],
            }) as any
        );
    }, [dispatch]);

    // Fetch system configurations so the trip-expense payment can be
    // booked against the account codes configured for each expense
    // type (transportationModuleConfiguration), instead of hardcoded
    // account codes.
    useEffect(() => {
        dispatch(
            getAllSystemConfigurations({
                offset: 0,
                limit: 100000,
                status: "",
            }) as any
        );
    }, [dispatch]);

    const activeSystemConfiguration = useMemo(() => {
        const list = Array.isArray(configurations) ? configurations : [];

        return (
            list.find(
                (item: any) =>
                    normalizeText(item?.status) === "active"
            ) ||
            list[0] ||
            null
        );
    }, [configurations]);

    // const transportExpenseAccountMap = useMemo(() => {
    //     const cfg =
    //         activeSystemConfiguration?.transportationModuleConfiguration || {};

    //     const withConfigCode = (
    //         configCode: any,
    //         fallback: { code: string; name: string }
    //     ) => ({
    //         code: cleanText(configCode) || fallback.code,
    //         name: fallback.name,
    //     });

    //     return {
    //         "Diesel": withConfigCode(
    //             cfg?.dieselCost,
    //             DEFAULT_EXPENSE_TYPE_ACCOUNT_MAP["Diesel"]
    //         ),
    //         "Driver Allowance / Food": withConfigCode(
    //             cfg?.foodCost,
    //             DEFAULT_EXPENSE_TYPE_ACCOUNT_MAP["Driver Allowance / Food"]
    //         ),
    //         "Running": withConfigCode(
    //             cfg?.runningCost,
    //             DEFAULT_EXPENSE_TYPE_ACCOUNT_MAP["Running"]
    //         ),
    //         "Breakdown": withConfigCode(
    //             cfg?.breakdownCost,
    //             DEFAULT_EXPENSE_TYPE_ACCOUNT_MAP["Breakdown"]
    //         ),
    //         "Other": withConfigCode(
    //             cfg?.otherCost,
    //             DEFAULT_EXPENSE_TYPE_ACCOUNT_MAP["Other"]
    //         ),
    //     } as Record<string, { code: string; name: string }>;
    // }, [activeSystemConfiguration]);


    const transportExpenseAccountMap = useMemo(() => {
        console.log("Configurations", configurations);
        console.log("Active Configuration", activeSystemConfiguration);

        const cfg =
            activeSystemConfiguration?.systemConfiguration
                ?.transportationModuleConfiguration || {};
        console.log("cfg", cfg);
        console.log("dieselCost", cfg.dieselCost);

        const resolveAccount = (
            configuredAccountCode: any,
            expenseType: string
        ) => {
            const accountCode = cleanText(configuredAccountCode);

            if (!accountCode) {
                return {
                    code: "",
                    name: "",
                    expenseType,
                    isConfigured: false,
                    isAccountFound: false,
                };
            }

            const matchedAccount = accountMasterByCode.get(
                accountCode.toLowerCase()
            );

            return {
                code: accountCode,
                name: matchedAccount?.name || "",
                expenseType,
                isConfigured: true,
                isAccountFound: Boolean(matchedAccount),
            };
        };

        return {
            Diesel: resolveAccount(
                cfg?.dieselCost,
                "Diesel"
            ),

            "Driver Allowance / Food": resolveAccount(
                cfg?.foodCost,
                "Driver Allowance / Food"
            ),

            Running: resolveAccount(
                cfg?.runningCost,
                "Running"
            ),

            Breakdown: resolveAccount(
                cfg?.breakdownCost,
                "Breakdown"
            ),

            Other: resolveAccount(
                cfg?.otherCost,
                "Other"
            ),
        };
    }, [
        activeSystemConfiguration,
        accountMasterByCode,
    ]);
    // const getExpenseAccountForType = useCallback(
    //     (type: string) =>
    //         transportExpenseAccountMap[type] ||
    //         DEFAULT_EXPENSE_TYPE_ACCOUNT_MAP["Other"],
    //     [transportExpenseAccountMap]
    // );


    const getExpenseAccountForType = useCallback(
        (expenseType: string) => {
            const account =
                transportExpenseAccountMap[expenseType as keyof typeof transportExpenseAccountMap];

            if (!account?.isConfigured || !account?.code) {
                throw new Error(
                    `Account code is not configured for expense type "${expenseType}". Please update Transportation Module Configuration.`
                );
            }

            if (!account?.isAccountFound || !account?.name) {
                throw new Error(
                    `Account Master was not found for configured account code "${account.code}" used by "${expenseType}".`
                );
            }

            return {
                code: account.code,
                name: account.name,
            };
        },
        [transportExpenseAccountMap]
    );

    const loadSettlementSources = useCallback(async () => {
        try {
            setPageLoading(true);

            const [
                ordersRes,
                allocationsRes,
                lrRes,
                expenseRes,
            ] = await Promise.all([
                unwrapThunk(
                    dispatch,
                    getTransportOrders({
                        limit: 100000,
                        offset: 0,
                        status: "open",
                    }) as any
                ),

                unwrapThunk(
                    dispatch,
                    getActiveTripAllocations({
                        limit: 100000,
                        offset: 0,
                    }) as any
                ),

                unwrapThunk(
                    dispatch,
                    getAllLRCollection({
                        limit: 100000,
                        offset: 0,
                        search: "",
                    }) as any
                ),

                unwrapThunk(
                    dispatch,
                    getAllTripExpenses({
                        limit: 100000,
                        offset: 0,
                        search: "",
                    }) as any
                ),
            ]);

            const orders = getApiList(ordersRes);
            const allocations = getApiList(allocationsRes);
            const expenses = getApiList(expenseRes);
            const lrList = getApiList(lrRes);

            setTransportOrders(orders);
            setTripExpenses(expenses);
            setLrEntries(lrList);



        } catch (error: any) {
            toast.error(error?.message || "Failed to load settlement data");
            setTransportOrders([]);
            setTripExpenses([]);
            setLrEntries([]);
        } finally {
            setPageLoading(false);
        }
    }, [dispatch, parentMobile]);

    useEffect(() => {
        loadSettlementSources();
    }, [loadSettlementSources]);

    /* ---------------------------------------------------
       EDIT MODE: fetch settlement by voucher number and
       prefill the simple fields (salary, incentives,
       payment mode/date, remarks, linked trip id).
    --------------------------------------------------- */
    useEffect(() => {
        if (!isEditMode) return;

        const fetchSettlement = async () => {
            try {
                setFetchingEdit(true);

                const response = await unwrapThunk(
                    dispatch,
                    getDriverSettlementByVoucherNumber(voucherNumber as string) as any
                );

                const record = response?.data || response;

                setEditRecord(record);

                setSalary(String(record?.salary ?? ""));
                setIncentives(String(record?.otherIncentives ?? ""));
                setRemarks(String(record?.remarks || "").slice(0, REMARKS_MAX));

                setPaymentDate(
                    formatDateForInput(record?.paymentDate) || formatDateForInput(new Date())
                );

                const matchedMode = paymentModeOptions.find(
                    (opt) => normalizeText(opt.value) === normalizeText(record?.paymentMode)
                );
                setPaymentMode(matchedMode?.value || "");

                setSelectedTripId(cleanText(record?.transportOrderNumber));
            } catch (error: any) {
                toast.error(error?.message || "Failed to load settlement details");
            } finally {
                setFetchingEdit(false);
            }
        };

        fetchSettlement();
    }, [isEditMode, voucherNumber, dispatch]);

    /* ---------------------------------------------------
       EDIT MODE: once driver list is loaded, match the
       settlement's driver (by driverCode, falling back to
       driver name from lrDetails) and prefill driver fields.
    --------------------------------------------------- */
    useEffect(() => {
        if (!isEditMode || !editRecord || !driverUsers.length || selectedDriverId) {
            return;
        }

        const driverCode = cleanText(editRecord?.driverCode);
        const driverNameFromRecord = normalizeText(editRecord?.lrDetails?.driverName);

        const matchedDriver =
            driverUsers.find((d: any) => d.driverId === driverCode) ||
            driverUsers.find(
                (d: any) => normalizeText(d.driverName) === driverNameFromRecord
            );

        if (!matchedDriver) return;

        setSelectedDriverId(matchedDriver.driverId);
        setDriverDetail({
            driverId: matchedDriver.driverId,
            driverName: matchedDriver.driverName,
            mobileNumber: matchedDriver.mobileNumber,
            licenseNumber: matchedDriver.licenseNumber,
            licenseExpiryDate: matchedDriver.licenseExpiryDate,
        });
    }, [isEditMode, editRecord, driverUsers, selectedDriverId]);

    const selectedDriver = useMemo(
        () =>
            driverUsers.find((driver: any) => driver.driverId === selectedDriverId) ||
            null,
        [driverUsers, selectedDriverId]
    );

    const driverOptions = useMemo(
        () =>
            (driverUsers || []).map((driver: any) => ({
                label: `${driver.driverName}`,
                value: driver.driverId,
                driver,
            })),
        [driverUsers]
    );

    const orderOptions = useMemo(
        () =>
            buildOrderOptionsForDriver({
                selectedDriver,
                activeAllocations,
                transportOrders,
                tripExpenses,
                lrEntries,
            }),
        [
            selectedDriver,
            activeAllocations,
            transportOrders,
            tripExpenses,
            lrEntries,
        ]
    );

    const selectedDriverOption =
        driverOptions.find((item: any) => item.value === selectedDriverId) || null;

    const selectedOrderOption =
        orderOptions.find((item: any) => item.value === selectedTripId) || null;

    useEffect(() => {
        if (isEditMode) return;

        if (
            selectedTripId &&
            !orderOptions.some((option: any) => option.value === selectedTripId)
        ) {
            setSelectedTripId("");
        }
    }, [selectedTripId, orderOptions, isEditMode]);

    const selectedAllocation = useMemo(
        () =>
            selectedOrderOption?.allocation ||
            findAllocationForTrip(activeAllocations, selectedTripId),
        [selectedOrderOption, activeAllocations, selectedTripId]
    );

    const selectedTransportOrder = useMemo(
        () =>
            selectedOrderOption?.transportOrder ||
            selectedAllocation?.transportOrder ||
            findTransportOrderForTrip(transportOrders, selectedTripId),
        [selectedOrderOption, selectedAllocation, transportOrders, selectedTripId]
    );

    const selectedTripExpense = useMemo(
        () =>
            selectedOrderOption?.tripExpense ||
            findTripExpenseForTrip(tripExpenses, selectedTripId),
        [selectedOrderOption, tripExpenses, selectedTripId]
    );

    const selectedLREntry = useMemo(
        () =>
            selectedOrderOption?.lrEntry ||
            findLREntryForTrip(lrEntries, selectedTripId),
        [selectedOrderOption, lrEntries, selectedTripId]
    );


    console.log("selectedTripId", selectedTripId);
    console.log("selectedOrderOption", selectedOrderOption);
    console.log("selectedAllocation", selectedAllocation);
    console.log("selectedTransportOrder", selectedTransportOrder);
    console.log("selectedTripExpense", selectedTripExpense);
    console.log("selectedLREntry", selectedLREntry);

    const liveSettlementData = useMemo(
        () =>
            buildSettlementFromSelections({
                allocation: selectedAllocation,
                transportOrder: selectedTransportOrder,
                tripExpense: selectedTripExpense,
                lrEntry: selectedLREntry,
                driver: selectedDriver,
                salary,
                incentives,
            }),
        [
            selectedAllocation,
            selectedTransportOrder,
            selectedTripExpense,
            selectedLREntry,
            selectedDriver,
            salary,
            incentives,
        ]
    );

    // In edit mode, trip/LR/expense/advance details come straight from the
    // GET-by-voucher response instead of the live open-trip selections.
    const settlementData = useMemo(() => {
        if (isEditMode && editRecord) {
            const totalAllowedExpenses = Number(editRecord?.lessAllowedExpenses || 0);
            const totalAdvances = Number(editRecord?.lessAdvancesToDriver || 0);
            const expenseRows = mapEditRecordToExpenseRows(editRecord);

            return {
                tripDetails: mapEditRecordToTripDetails(editRecord),
                expenseRows,
                advanceRows: mapEditRecordToAdvanceRows(editRecord),
                totalExpenses: expenseRows.reduce(
                    (acc: number, row: any) => acc + Number(row.amount || 0),
                    0
                ),
                totalAllowedExpenses,
                totalAdvances,
                settlement: computeSettlementSummary({
                    salary,
                    incentives,
                    allowedExpenses: totalAllowedExpenses,
                    totalAdvances,
                }),
            };
        }

        return liveSettlementData;
    }, [isEditMode, editRecord, salary, incentives, liveSettlementData]);

    const tripPendingAccept = useMemo(
        () => (isEditMode ? false : isTripPendingAccept(selectedTripExpense)),
        [isEditMode, selectedTripExpense]
    );

    const handleDriverSelect = async (driverId: string) => {
        const selected = driverUsers.find(
            (driver: any) => driver.driverId === driverId
        );

        setSelectedDriverId(driverId || "");
        setSelectedTripId("");

        if (!selected) {
            setDriverDetail({
                driverId: "",
                driverName: "",
                mobileNumber: "",
                licenseNumber: "",
                licenseExpiryDate: "",
            });
            return;
        }

        setDriverDetail({
            driverId: selected.driverId,
            driverName: selected.driverName,
            mobileNumber: selected.mobileNumber,
            licenseNumber: selected.licenseNumber,
            licenseExpiryDate: selected.licenseExpiryDate,
        });

        try {
            const response = await unwrapThunk(
                dispatch,
                getChildUserByMobile(selected.driverId)
            );

            const responseData = response?.data || response;

            const childUsersRaw =
                responseData?.ChildUsers ||
                responseData?.childUsers ||
                responseData?.result ||
                responseData?.users ||
                [];

            const childUsersArray = Array.isArray(childUsersRaw)
                ? childUsersRaw
                : childUsersRaw && typeof childUsersRaw === "object"
                    ? [childUsersRaw]
                    : [];

            const child =
                childUsersArray.find(
                    (item: any) =>
                        String(item?.userMobileNumberHash || "") ===
                        String(selected.driverId)
                ) ||
                childUsersArray[0] ||
                responseData;

            const customFields = child?.childUserCustomFields || {};

            setDriverDetail((prev: any) => ({
                ...prev,
                mobileNumber:
                    selected.mobileNumber || String(child?.userMobileNumberHash || ""),
                licenseNumber:
                    selected.licenseNumber ||
                    customFields?.licenseNumber ||
                    child?.licenseNumber ||
                    child?.drivingLicenseNumber ||
                    prev.licenseNumber,
                licenseExpiryDate:
                    selected.licenseExpiryDate ||
                    customFields?.licenseExpiry ||
                    child?.licenseExpiryDate ||
                    child?.drivingLicenseExpiryDate ||
                    prev.licenseExpiryDate,
            }));
        } catch (error: any) {
            toast.error(error?.message || "Failed to load driver license details");
        }
    };

    const handleOrderSelect = (orderNumber: string) => {
        setSelectedTripId(orderNumber || "");
    };

    const fieldForm = {
        salary,
        incentives,
        paymentMode,
        paymentDate,
        paymentAccountCode,
        paymentAccountName,
        remarks,
    };

    const updateField = (key: string, input: any) => {
        const value = getInputValue(input);

        if (key === "salary") {
            setSalary(value);
            return;
        }

        if (key === "incentives") {
            setIncentives(value);
            return;
        }

        if (key === "paymentMode") {
            setPaymentMode(value);
            return;
        }

        if (key === "paymentDate") {
            setPaymentDate(value);
            return;
        }

        if (key === "paymentAccountCode") {
            setPaymentAccountCode(value);
            return;
        }

        if (key === "paymentAccountName") {
            setPaymentAccountName(value);
            return;
        }

        if (key === "remarks") {
            setRemarks(String(value || "").slice(0, REMARKS_MAX));
        }
    };

    const handleInputChange = (key: string) => (e: any) => {
        updateField(key, e);
    };

    const handleSelectChange = (key: string) => (e: any) => {
        updateField(key, e);
    };

    const renderFields = (fields: any[]) =>
        fields.map((field) => (
            <Fragment key={field.key}>
                {renderField({
                    field,
                    form: fieldForm,
                    handleInputChange,
                    handleSelectChange,
                    updateField,
                })}
            </Fragment>
        ));

    const settlementFields = [
        {
            key: "salary",
            label: "Salary of Driver",
            type: "number",
            mandatory: true,
            placeholder: "Enter salary",
        },
        {
            key: "incentives",
            label: "Other Incentives",
            type: "number",
            placeholder: "Enter incentives",
        },
        {
            key: "paymentMode",
            label: "Payment Mode",
            type: "select",
            options: paymentModeOptions,
            placeholder: "Select payment mode",
        },
        {
            key: "paymentDate",
            label: "Payment Date",
            type: "date",
        },
        {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            className: "md:col-span-2 xl:col-span-4",
            placeholder: "Enter remarks",
        },
    ];

    const tripDetails = settlementData.tripDetails;



    const getSettlementVoucherNumber = (
        response: any,
        fallback = ""
    ) => {
        return (
            response?.data?.settlement?.settlementNumber ||
            response?.data?.record?.settlementNumber ||
            response?.data?.settlementNumber ||
            response?.data?.voucherNumber ||
            response?.settlementNumber ||
            response?.voucherNumber ||
            fallback
        );
    };

    const getPaymentVoucherNumber = (response: any) => {
        return (
            response?.data?.payment?.payVoucherNumber ||
            response?.data?.record?.payVoucherNumber ||
            response?.data?.payVoucherNumber ||
            response?.data?.voucherNumber ||
            response?.payVoucherNumber ||
            response?.voucherNumber ||
            ""
        );
    };

    const getReceiptVoucherNumber = (response: any) => {
        return (
            response?.data?.receipt?.recVoucherNumber ||
            response?.data?.record?.recVoucherNumber ||
            response?.data?.recVoucherNumber ||
            response?.data?.voucherNumber ||
            response?.recVoucherNumber ||
            response?.voucherNumber ||
            ""
        );
    };






    const handleSave = async () => {
        if (!selectedDriverId) {
            toast.warn("Please select a driver");
            return;
        }

        if (!selectedTripId) {
            toast.warn("Please select order / trip");
            return;
        }

        if (!String(salary || "").trim()) {
            toast.warn("Please enter salary of driver");
            return;
        }

        if (!paymentMode) {
            toast.warn("Please select payment mode");
            return;
        }

        try {
            setPageLoading(true);

            const calculatedNetPayable = Number(
                settlementData?.settlement?.netPayable || 0
            );

            const expenseAmount = Number(
                settlementData?.totalAllowedExpenses ??
                settlementData?.totalExpenses ??
                settlementData?.settlement?.allowedExpenses ??
                0
            );

            const freightAmount = Number(
                tripDetails?.expectedFreight ||
                selectedTransportOrder?.freightDetails?.expectedFreight ||
                selectedAllocation?.transportOrder?.freightDetails
                    ?.expectedFreight ||
                selectedAllocation?.transportOrder?.expectedFreight ||
                0
            );

            const driverAccountCode =
                driverDetail?.driverId ||
                selectedDriver?.driverId ||
                selectedDriverId ||
                "";

            const driverAccountName =
                driverDetail?.driverName ||
                selectedDriver?.driverName ||
                tripDetails?.driverName ||
                driverAccountCode;

            const customerAccountCode =
                selectedAllocation?.transportOrder?.customerCode ||
                selectedAllocation?.transportOrder?.customerDetails
                    ?.customerCode ||
                selectedTransportOrder?.customerDetails?.customerCode ||
                selectedTransportOrder?.customerCode ||
                "";

            const customerAccountName =
                selectedAllocation?.transportOrder?.customerName ||
                selectedAllocation?.transportOrder?.customerDetails
                    ?.customerName ||
                selectedTransportOrder?.customerDetails?.customerName ||
                selectedTransportOrder?.customerName ||
                customerAccountCode;

            const transportOrderNumber =
                selectedTransportOrder?.transportOrderNumber ||
                selectedAllocation?.transportOrder?.transportOrderNumber ||
                selectedTripId;

            const payload: any = {
                transportOrderNumber,

                driverCode: driverAccountCode,

                salary: Number(salary || 0),

                otherIncentives: Number(incentives || 0),

                grossAmount: Number(
                    settlementData?.settlement?.grossAmount || 0
                ),

                lessAllowedExpenses: Number(
                    settlementData?.settlement?.allowedExpenses || 0
                ),

                lessAdvancesToDriver: Number(
                    settlementData?.settlement?.totalAdvances || 0
                ),

                netPayableToDriver: calculatedNetPayable,

                paymentMode,
                paymentDate,
                remarks,

                lrDetails: {
                    lrNumber: tripDetails?.lrNo || "",
                    lrDate: tripDetails?.lrDate || null,
                    tripNumber: tripDetails?.tripNo || "",
                    tripDate: tripDetails?.tripDate || null,
                    driverName: tripDetails?.driverName || "",
                    tripStatus: tripDetails?.tripStatus || "",
                    from: tripDetails?.from || "",
                    to: tripDetails?.to || "",
                    consignor: tripDetails?.consignor || "",
                    consignee: tripDetails?.consignee || "",
                    vehicleNo: tripDetails?.vehicleNo || "",
                    goods: tripDetails?.goods || "",

                    expectedFreight: freightAmount,

                    totalTripExpense:
                        settlementData?.totalExpenses || 0,

                    balance:
                        tripDetails?.balanceAmount || 0,
                },

                expenses:
                    settlementData?.expenseRows || [],

                advances:
                    settlementData?.advanceRows || [],
            };

            /* =====================================================
               EDIT MODE
               Prevent duplicate Payment and Receipt vouchers.
            ===================================================== */

            if (isEditMode) {
                await dispatch(
                    updateDriverSettlement({
                        voucherNumber:
                            editRecord?.settlementNumber ||
                            voucherNumber,

                        payload,
                    }) as any
                ).unwrap();

                toast.success(
                    "Driver Settlement Updated Successfully"
                );

                navigate(
                    "/bookEz/transportation/driver-settlement"
                );

                return;
            }

            /* =====================================================
               CREATE DRIVER SETTLEMENT
            ===================================================== */

            const settlementResponse = await dispatch(
                createDriverSettlement(payload) as any
            ).unwrap();

            const settlementNumber =
                getSettlementVoucherNumber(
                    settlementResponse
                );

            if (!settlementNumber) {
                throw new Error(
                    "Settlement created, but settlement number was not returned"
                );
            }

            let paymentVoucherNumber = "";
            let receiptVoucherNumber = "";

            /* =====================================================
               CREATE PAYMENT FOR ALL TRIP EXPENSES
               The payment is always made from Cash in Hand
               (ACT-4, hardcoded) — not the driver or the customer
               account, since the driver has no ledger account and
               the customer isn't the one being paid here. Each
               trip-expense entry is booked as its own line against
               its matching expense ledger account (Diesel/Running
               -> Vehicle Running Cost, Food -> Food Expenses,
               Breakdown -> Breakdown Expenses, Other -> Other
               Expenses), instead of a single lump-sum line.
            ===================================================== */

            const expenseLineItems = (settlementData?.expenseRows || []).filter(
                (row: any) => Number(row?.amount || 0) > 0
            );

            if (expenseAmount > 0) {
                if (!expenseLineItems.length) {
                    throw new Error(
                        "No expense entries with an amount were found to create the expense payment"
                    );
                }

                // const payBody = expenseLineItems.map((row: any, index: number) => {
                //     const account = getExpenseAccountForType(row.type);
                //     const amountStr = String(row.amount);

                //     return {
                //         id: Date.now() + index,

                //         accountCode: account.code,
                //         accountName: account.name,

                //         amount: amountStr,
                //         netAmount: amountStr,

                //         references: [
                //             {
                //                 referenceType: "NEW",
                //                 newReference: "ADV",
                //                 billDueDate: paymentDate,
                //                 billAmount: amountStr,
                //             },
                //         ],

                //         remarks: `${row.type} - Trip ${transportOrderNumber}`,
                //     };
                // });


                const payBody = expenseLineItems.map(
                    (row: any, index: number) => {
                        const account = getExpenseAccountForType(row.type);
                        const amountStr = String(row.amount);

                        return {
                            id: Date.now() + index,

                            accountCode: account.code,
                            accountName: account.name,

                            amount: amountStr,
                            netAmount: amountStr,

                            references: [
                                {
                                    referenceType: "NEW",
                                    newReference: "ADV",
                                    billDueDate: paymentDate,
                                    billAmount: amountStr,
                                },
                            ],

                            remarks: `${row.type} - Trip ${transportOrderNumber}`,
                        };
                    }
                );
                const payBodyTotal = expenseLineItems.reduce(
                    (acc: number, row: any) => acc + Number(row.amount || 0),
                    0
                );

                const paymentPayload: any = {
                    payVoucherNumber: "AUTO",
                    payVoucherDate: paymentDate,

                    payAccountCode: CASH_IN_HAND_ACCOUNT_CODE,
                    payAccountName: CASH_IN_HAND_ACCOUNT_NAME,

                    // payStatus: "close",

                    payRemark:
                        remarks ||
                        `Trip expense payment against Driver Settlement ${settlementNumber}`,

                    paymentMode,
                    bankReferenceNumber: "",
                    paidBy: "",

                    payBody,

                    payFooter: {
                        netAmount: String(payBodyTotal),
                        adjustedAmount: String(payBodyTotal),
                        balanceAmount: "0",
                    },

                    sourceModule: "DRIVER_SETTLEMENT",
                    sourceVoucherNumber:
                        settlementNumber,

                    transportOrderNumber,

                    transactionPurpose:
                        "TRIP_EXPENSE_PAYMENT",
                };

                const paymentResponse = await dispatch(
                    addPayment({
                        payload: paymentPayload,
                    }) as any
                ).unwrap();

                paymentVoucherNumber =
                    getPaymentVoucherNumber(
                        paymentResponse
                    );

                if (!paymentVoucherNumber) {
                    console.warn(
                        "Expense payment created, but voucher number was not returned",
                        paymentResponse
                    );
                }
            }

            /* =====================================================
               CREATE RECEIPT FOR EXPECTED FREIGHT
            ===================================================== */

            if (freightAmount > 0) {
                if (!customerAccountCode) {
                    throw new Error(
                        "Customer account code is required to create freight receipt"
                    );
                }

                if (!customerAccountName) {
                    throw new Error(
                        "Customer account name is required to create freight receipt"
                    );
                }

                const receiptPayload: any = {
                    recVoucherNumber: "AUTO",
                    recVoucherDate: paymentDate,

                    recAccountCode: "Act-4",
                    recAccountName: "Cash In Hand",

                    // recStatus: "close",

                    recRemark:
                        remarks ||
                        `Freight receipt against Driver Settlement ${settlementNumber}`,

                    paymentMode,
                    bankReferenceNumber: "",
                    receivedBy: "",

                    recBody: [
                        {
                            id: Date.now(),

                            accountCode:
                                customerAccountCode,

                            accountName:
                                customerAccountName,

                            amount: String(freightAmount),
                            netAmount: String(freightAmount),

                            references: [
                                {
                                    referenceType: "NEW",
                                    adjustedAmount:
                                        String(freightAmount),
                                },
                            ],

                            remarks:
                                `Freight receipt against settlement ${settlementNumber}`,
                        },
                    ],

                    recFooter: {
                        netAmount: String(freightAmount),
                        adjustedAmount:
                            String(freightAmount),
                        balanceAmount: "0",
                    },

                    sourceModule: "DRIVER_SETTLEMENT",
                    sourceVoucherNumber:
                        settlementNumber,

                    transportOrderNumber,

                    transactionPurpose:
                        "FREIGHT_RECEIPT",
                };

                const receiptResponse = await dispatch(
                    addSalesReceipt({
                        payload: receiptPayload,
                    }) as any
                ).unwrap();

                receiptVoucherNumber =
                    getReceiptVoucherNumber(
                        receiptResponse
                    );

                if (!receiptVoucherNumber) {
                    console.warn(
                        "Freight receipt created, but voucher number was not returned",
                        receiptResponse
                    );
                }
            }

            /* =====================================================
               LINK ACCOUNTING VOUCHERS TO SETTLEMENT
               The expense payment was posted from Cash in Hand
               (ACT-4), so its accountingReferences entry records
               that account. The freight receipt is still booked
               against the customer account, so it keeps recording
               customerAccountCode/customerAccountName.
            ===================================================== */

            const expensePaymentStatus =
                expenseAmount <= 0
                    ? "NOT_REQUIRED"
                    : paymentVoucherNumber
                        ? "CREATED"
                        : "VOUCHER_NUMBER_PENDING";

            const freightReceiptStatus =
                freightAmount <= 0
                    ? "NOT_REQUIRED"
                    : receiptVoucherNumber
                        ? "CREATED"
                        : "VOUCHER_NUMBER_PENDING";

            const accountingStatus =
                expenseAmount <= 0 &&
                    freightAmount <= 0
                    ? "NOT_REQUIRED"
                    : (
                        (
                            expenseAmount <= 0 ||
                            Boolean(paymentVoucherNumber)
                        ) &&
                        (
                            freightAmount <= 0 ||
                            Boolean(receiptVoucherNumber)
                        )
                    )
                        ? "CREATED"
                        : "PARTIALLY_CREATED";

            await dispatch(
                updateDriverSettlement({
                    voucherNumber: settlementNumber,

                    payload: {
                        ...payload,

                        paymentVoucherNumber,
                        receiptVoucherNumber,

                        accountingReferences: {
                            expensePayment: {
                                voucherNumber:
                                    paymentVoucherNumber,

                                amount:
                                    expenseAmount,

                                accountCode:
                                    CASH_IN_HAND_ACCOUNT_CODE,

                                accountName:
                                    CASH_IN_HAND_ACCOUNT_NAME,

                                status:
                                    expensePaymentStatus,
                            },

                            freightReceipt: {
                                voucherNumber:
                                    receiptVoucherNumber,

                                amount:
                                    freightAmount,

                                accountCode:
                                    customerAccountCode,

                                accountName:
                                    customerAccountName,

                                status:
                                    freightReceiptStatus,
                            },
                        },

                        accountingStatus,
                    },
                }) as any
            ).unwrap();

            /* =====================================================
               SUCCESS MESSAGE
            ===================================================== */

            if (
                expenseAmount > 0 &&
                freightAmount > 0
            ) {
                toast.success(
                    `Settlement created with Payment ${paymentVoucherNumber || ""
                    } and Receipt ${receiptVoucherNumber || ""
                    }`
                );
            } else if (expenseAmount > 0) {
                toast.success(
                    paymentVoucherNumber
                        ? `Settlement and Expense Payment ${paymentVoucherNumber} created successfully`
                        : "Settlement and Expense Payment created successfully"
                );
            } else if (freightAmount > 0) {
                toast.success(
                    receiptVoucherNumber
                        ? `Settlement and Freight Receipt ${receiptVoucherNumber} created successfully`
                        : "Settlement and Freight Receipt created successfully"
                );
            } else {
                toast.success(
                    "Driver Settlement created. No expense payment or freight receipt was required."
                );
            }

            navigate(
                "/bookEz/transportation/driver-settlement"
            );
        } catch (error: any) {
            console.error(
                "Driver settlement accounting error:",
                error
            );

            toast.error(
                error?.payload?.message ||
                error?.response?.data?.message ||
                error?.message ||
                `Failed to ${isEditMode
                    ? "update"
                    : "create"
                } driver settlement`
            );
        } finally {
            setPageLoading(false);
        }
    };
    return (
        <div className="flex h-full w-full flex-col bg-card shadow-sm">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3">
                <div
                    className="flex items-center"
                >
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>

                        <h1 className="truncate text-lg font-bold text-card-foreground">
                            <span>{isEditMode ? "Edit Driver Settlement" : "Driver Settlement"}</span>
                        </h1>

                        <p className=" text-sm text-muted-foreground">
                            Salary based driver settlement using allocation, order, LR, trip expense and advances.
                        </p>
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-2">
                <div className="space-y-4">
                    <FormSectionCard
                        index={1}
                        title="Select Driver & Order"
                        icon={<Users size={17} />}
                        expanded={true}
                        onToggle={() => { }}
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-card-foreground">
                                Driver <span className="text-danger">*</span>
                            </label>

                            <Select
                                value={selectedDriverOption}
                                options={driverOptions}
                                placeholder={
                                    driversLoader ? "Loading drivers..." : "Select Driver"
                                }
                                isDisabled={driversLoader || pageLoading || isEditMode}
                                isSearchable
                                onChange={(option: any) =>
                                    handleDriverSelect(option?.value || "")
                                }
                                classNamePrefix="rs"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-card-foreground">
                                Order / Trip <span className="text-danger">*</span>
                            </label>

                            <Select
                                value={
                                    isEditMode
                                        ? { label: selectedTripId, value: selectedTripId }
                                        : selectedOrderOption
                                }
                                options={orderOptions}
                                placeholder={
                                    !selectedDriverId
                                        ? "Select driver first"
                                        : pageLoading
                                            ? "Loading orders..."
                                            : "Select Order / Trip"
                                }
                                isDisabled={!selectedDriverId || pageLoading || isEditMode}
                                isSearchable
                                onChange={(option: any) =>
                                    handleOrderSelect(option?.value || "")
                                }
                                classNamePrefix="rs"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-card-foreground">
                                Driver Mobile
                            </label>

                            <input
                                disabled
                                value={driverDetail?.mobileNumber || ""}
                                className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-card-foreground">
                                License Number
                            </label>

                            <input
                                disabled
                                value={driverDetail?.licenseNumber || ""}
                                className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-card-foreground">
                                License Expiry
                            </label>

                            <input
                                type="date"
                                disabled
                                value={formatDateForInput(driverDetail?.licenseExpiryDate)}
                                className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
                            />
                        </div>
                    </FormSectionCard>

                    {tripPendingAccept && (
                        <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
                            Trip not yet accepted by driver — settlement preview only.
                        </div>
                    )}

                    <FormSectionCard
                        index={2}
                        title="Trip / LR Details"
                        icon={<FileText size={17} />}
                        expanded={true}
                        onToggle={() => { }}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            {fetchingEdit ? (
                                <EmptyHint>Loading settlement details...</EmptyHint>
                            ) : !selectedTripId ? (
                                <EmptyHint>
                                    Select order / trip to view autofilled details.
                                </EmptyHint>
                            ) : !tripDetails ? (
                                <EmptyHint>No trip details available.</EmptyHint>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <DetailCell
                                        label="Order / Trip No"
                                        value={tripDetails.tripNo}
                                    />

                                    <DetailCell label="LR No" value={tripDetails.lrNo} />

                                    <DetailCell
                                        label="Trip Date"
                                        value={formatDateTime(tripDetails.tripDate)}
                                    />

                                    <DetailCell
                                        label="LR Date"
                                        value={formatDateTime(tripDetails.lrDate)}
                                    />

                                    <DetailCell
                                        label="Driver"
                                        value={tripDetails.driverName}
                                    />

                                    <DetailCell
                                        label="Trip Status"
                                        value={tripDetails.tripStatus}
                                    />

                                    <DetailCell label="From" value={tripDetails.from} />

                                    <DetailCell label="To" value={tripDetails.to} />

                                    <DetailCell
                                        label="Consignor / Customer"
                                        value={tripDetails.consignor}
                                    />

                                    <DetailCell
                                        label="Consignee"
                                        value={tripDetails.consignee}
                                    />

                                    <DetailCell
                                        label="Vehicle No"
                                        value={tripDetails.vehicleNo}
                                    />

                                    <DetailCell label="Goods" value={tripDetails.goods} />

                                    <DetailCell
                                        label="Expected Freight"
                                        value={formatMoney(tripDetails.expectedFreight)}
                                    />

                                    <DetailCell
                                        label="Total Trip Expense"
                                        value={formatMoney(tripDetails.totalTripExpense)}
                                    />

                                    <DetailCell
                                        label="Balance"
                                        value={formatMoney(tripDetails.balanceAmount)}
                                    />
                                </div>
                            )}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        index={3}
                        title="Trip Expenses Details"
                        icon={<ListChecks size={17} />}
                        expanded={true}
                        onToggle={() => { }}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            {fetchingEdit ? (
                                <EmptyHint>Loading settlement details...</EmptyHint>
                            ) : !selectedTripId ? (
                                <EmptyHint>Select order / trip to view expenses.</EmptyHint>
                            ) : !isEditMode && !selectedTripExpense ? (
                                <EmptyHint>No trip expense recorded yet.</EmptyHint>
                            ) : !settlementData.expenseRows.length ? (
                                <EmptyHint>No expense entries in this trip.</EmptyHint>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-border">
                                    <div className="grid grid-cols-12 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                                        <div className="col-span-3">Date</div>
                                        <div className="col-span-2">Type</div>
                                        <div className="col-span-5">Description</div>
                                        <div className="col-span-2 text-right">
                                            Amount
                                        </div>
                                    </div>

                                    {settlementData.expenseRows.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="grid grid-cols-12 border-t border-border px-3 py-2 text-sm"
                                        >
                                            <div className="col-span-3 text-muted-foreground">
                                                {formatDateTime(item.date)}
                                            </div>

                                            <div className="col-span-2">{item.type}</div>

                                            <div className="col-span-5">
                                                {item.description}
                                            </div>

                                            <div className="col-span-2 text-right">
                                                {formatMoney(item.amount)}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex items-center justify-between border-t border-border bg-background px-3 py-2 text-sm font-semibold">
                                        <span>Total Expenses</span>
                                        <span>
                                            {formatMoney(settlementData.totalExpenses)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-border bg-background px-3 py-2 text-sm font-semibold">
                                        <span>Total Allowed Expenses</span>
                                        <span>
                                            {formatMoney(
                                                settlementData.totalAllowedExpenses
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        index={4}
                        title="Advances to Driver"
                        icon={<BadgeIndianRupee size={17} />}
                        expanded={true}
                        onToggle={() => { }}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            {fetchingEdit ? (
                                <EmptyHint>Loading settlement details...</EmptyHint>
                            ) : !selectedTripId ? (
                                <EmptyHint>Select order / trip to view advances.</EmptyHint>
                            ) : !isEditMode && !selectedTripExpense ? (
                                <EmptyHint>No trip expense recorded yet.</EmptyHint>
                            ) : !settlementData.advanceRows.length ? (
                                <EmptyHint>No advances recorded for this trip.</EmptyHint>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-border">
                                    <div className="grid grid-cols-12 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                                        <div className="col-span-3">Date</div>
                                        <div className="col-span-3">Source</div>
                                        <div className="col-span-3">Mode</div>
                                        <div className="col-span-3 text-right">
                                            Amount
                                        </div>
                                    </div>

                                    {settlementData.advanceRows.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="grid grid-cols-12 border-t border-border px-3 py-2 text-sm"
                                        >
                                            <div className="col-span-3 text-muted-foreground">
                                                {formatDateTime(item.date)}
                                            </div>

                                            <div className="col-span-3">
                                                {item.source}
                                            </div>

                                            <div className="col-span-3">
                                                {item.paymentMode}
                                            </div>

                                            <div className="col-span-3 text-right">
                                                {formatMoney(item.amount)}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex items-center justify-between border-t border-border bg-background px-3 py-2 text-sm font-semibold">
                                        <span>Total Advances</span>
                                        <span>
                                            {formatMoney(settlementData.totalAdvances)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSectionCard>

                    <FormSectionCard
                        index={5}
                        title="Settlement Summary"
                        icon={<PieChart size={17} />}
                        expanded={true}
                        onToggle={() => { }}
                    >
                        {renderFields(settlementFields)}

                        <div className="md:col-span-2 xl:col-span-4">
                            <div className="rounded-lg border border-border bg-background p-4">
                                <SummaryLine
                                    label="Gross Amount (Salary + Incentives)"
                                    value={settlementData.settlement.grossAmount}
                                />

                                <SummaryLine
                                    label="Less: Allowed Expenses"
                                    value={-settlementData.settlement.allowedExpenses}
                                    muted
                                />

                                <SummaryLine
                                    label="Less: Advances to Driver"
                                    value={-settlementData.settlement.totalAdvances}
                                    muted
                                />

                                <div className="mt-4 flex items-center justify-between rounded-lg border border-success/30 bg-success/10 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-success">
                                            Net Payable to Driver
                                        </p>

                                        <p className="text-xs font-semibold text-muted-foreground">
                                            Salary + Incentives - Expenses - Advances
                                        </p>
                                    </div>

                                    <p className="text-2xl font-semibold text-success">
                                        {formatMoney(
                                            settlementData.settlement.netPayable
                                        )}
                                    </p>
                                </div>

                                <p className="mt-2 text-right text-xs font-semibold text-muted-foreground">
                                    {(remarks || "").length}/{REMARKS_MAX}
                                </p>
                            </div>
                        </div>
                    </FormSectionCard>
                </div>
            </div>

            <div className="sticky bottom-0 z-20 flex items-center justify-end gap-2 border-t border-border bg-card px-4 py-3">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                    <Save size={16} />
                    {loading ? "Loading..." : isEditMode ? "Update & Proceed" : "Save & Proceed"}
                </button>
            </div>
        </div>
    );
};

export default CreateEditDriverSettlement;