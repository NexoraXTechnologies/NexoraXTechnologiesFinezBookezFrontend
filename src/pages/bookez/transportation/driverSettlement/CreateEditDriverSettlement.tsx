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
import { sendWhatsAppMessage } from "../../../../redux/slices/professionalSlice/transportation/whatsappSlice";
import { selectClassNames, selectThemeStyles } from "../tripAllocation/tripAllocationInitialState";

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

/* ===================================================
   COMMON HELPERS
=================================================== */

const cleanText = (value: any) => String(value || "").trim();

const toDateTimeInputValue = (value: any) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const dateTimeInputToIso = (value: string) => value ? new Date(value).toISOString() : "";

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

const computeTripExpenseSummary = (
    tripExpense: any = {}
) => {
    const expenses = tripExpense?.expenses || {};

    const advanceEntries =
        expenses?.advanceReceived?.entries || [];

    const totalAdvanceReceived =
        sumAmounts(advanceEntries);

    const totalTripExpense = Object.entries(expenses)
        .filter(([key]) => key !== "advanceReceived")
        .reduce(
            (
                total,
                [, expenseGroup]: [string, any]
            ) => {
                const entries = Array.isArray(
                    expenseGroup?.entries
                )
                    ? expenseGroup.entries
                    : [];

                return total + sumAmounts(entries);
            },
            0
        );

    const balanceAmount = Math.max(
        totalTripExpense - totalAdvanceReceived,
        0
    );

    return {
        totalAdvanceReceived,
        totalTripExpense,
        balanceAmount,
    };
};

const EXPENSE_TYPE_LABELS: Record<string, string> = {
    dieselCost: "Diesel",
    petrolCost: "Petrol",
    foodCost: "Food",
    runningCost: "Running",
    breakdownCost: "Breakdown",
    otherCost: "Other",
};

const EXPENSE_ACCOUNT_NAMES: Record<string, string> = {
    dieselCost: "Diesel Refilling",
    petrolCost: "Petrol Refilling",
    foodCost: "Food Expenses",
    runningCost: "Vehicle Running Cost",
    breakdownCost: "Breakdown Expenses",
    otherCost: "Other Expenses",
};

const EXPENSE_KEYS = Object.keys(EXPENSE_TYPE_LABELS);

const formatExpenseTypeLabel = (key: string) => {
    if (EXPENSE_TYPE_LABELS[key]) {
        return EXPENSE_TYPE_LABELS[key];
    }

    return key
        .replace(/Cost$/i, "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
};

const getExpenseDescription = (
    expenseKey: string,
    entry: any
) => {
    const valuesByType: Record<string, any[]> = {
        dieselCost: [
            entry?.fuelStation,
            entry?.billNumber,
        ],

        petrolCost: [
            entry?.fuelStation,
            entry?.billNumber,
        ],

        foodCost: [
            entry?.mealType,
            entry?.location,
        ],

        runningCost: [
            entry?.expenseType,
            entry?.location,
        ],

        breakdownCost: [
            entry?.issueType,
            entry?.serviceCenter,
            entry?.location,
        ],

        otherCost: [
            entry?.expenseType,
            entry?.remarks,
        ],
    };

    const configuredValues = valuesByType[expenseKey];

    if (configuredValues) {
        const description = configuredValues
            .filter(Boolean)
            .join(" • ");

        if (description) return description;
    }

    return (
        `${formatExpenseTypeLabel(expenseKey)} expense`
    );
};

const buildExpenseRowsFromTripExpense = (tripExpense: any) => {
    const expenses = tripExpense?.expenses || {};
    const expenseKeys = [...EXPENSE_KEYS, ...Object.keys(expenses).filter((key) => key !== "advanceReceived" && !EXPENSE_KEYS.includes(key))];

    return expenseKeys.flatMap((expenseKey) => {
        const entries = Array.isArray(expenses?.[expenseKey]?.entries) ? expenses[expenseKey].entries : [];
        const rows = entries.length ? entries : [{}];
        return rows.map((entry: any, index: number) => ({ ...entry, id: `${expenseKey}-${index}`, expenseKey, entryIndex: index, type: formatExpenseTypeLabel(expenseKey), date: entry?.date || entry?.receivedDate || entry?.billDate || "", description: getExpenseDescription(expenseKey, entry), amount: Number(entry?.amount || 0) }));
    });
};

const buildAdvanceRowsFromTripExpense = (tripExpense: any) => {
    const entries = Array.isArray(tripExpense?.expenses?.advanceReceived?.entries) ? tripExpense.expenses.advanceReceived.entries : [];
    const rows = entries.length ? entries : [{}];
    return rows.map((entry: any, index: number) => ({ ...entry, id: `advanceReceived-${index}`, entryIndex: index, date: entry?.date || entry?.receivedDate || "", source: entry?.sourceName || entry?.source || "Advance Received", paymentMode: entry?.paymentMode || "-", amount: Number(entry?.amount || 0), remarks: entry?.remarks || "" }));
};

const mapSelectionToTripDetails = ({
    allocation,
    transportOrder,
    tripExpense,
    lrEntry,

}: any = {}) => {
    const summaryMeta = tripExpense ? computeTripExpenseSummary(tripExpense) : null;

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

const mapEditRecordToExpenseRows = (record: any) => {
    const rows = Array.isArray(record?.expenses) ? record.expenses : [];
    return EXPENSE_KEYS.flatMap((expenseKey) => {
        const matchedRows = rows.filter((row: any) => row?.expenseKey === expenseKey || normalizeText(row?.type) === normalizeText(formatExpenseTypeLabel(expenseKey)));
        const sourceRows = matchedRows.length ? matchedRows : [{}];
        return sourceRows.map((row: any, index: number) => ({ ...row, id: row?.id || `${expenseKey}-${index}`, expenseKey, entryIndex: row?.entryIndex ?? index, type: row?.type || formatExpenseTypeLabel(expenseKey), date: row?.date || "", description: row?.description || getExpenseDescription(expenseKey, row), amount: Number(row?.amount || 0) }));
    });
};

const mapEditRecordToAdvanceRows = (record: any) => {
    const rows = Array.isArray(record?.advances) ? record.advances : [];
    const sourceRows = rows.length ? rows : [{}];
    return sourceRows.map((row: any, index: number) => ({ ...row, id: row?.id || `advanceReceived-${index}`, entryIndex: row?.entryIndex ?? index, date: row?.date || "", source: row?.source || row?.sourceName || "Advance Received", paymentMode: row?.mode || row?.paymentMode || "-", amount: Number(row?.amount || 0), remarks: row?.remarks || "" }));
};

/* ===================================================
   SMALL DISPLAY COMPONENTS
=================================================== */

const DetailCell = ({ label, value }: any) => (
    <div className="rounded-lg border border-border bg-background p-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">
            {value || "-"}
        </p>
    </div>
);

const SummaryLine = ({ label, value, muted = false }: any) => (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2">
        <p
            className={`text-sm font-semibold ${
                muted ? "text-muted-foreground" : "text-foreground"
            }`}
        >
            {label}
        </p>

        <p
            className={`text-sm font-semibold ${
                muted ? "text-muted-foreground" : "text-foreground"
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
   PROPS
=================================================== */

type CreateEditDriverSettlementProps = {
    embedded?: boolean;
    mode?: "add" | "edit" | "view";
    voucherNumber?: string;
    onClose?: () => void;
};

/* ===================================================
   COMPONENT
=================================================== */

const CreateEditDriverSettlement = ({
    embedded = false,
    mode: modeProp,
    voucherNumber: voucherNumberProp,
    onClose,
}: CreateEditDriverSettlementProps = {}) => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();

    const params = useParams<{ voucherNumber: string }>();

    // Props take priority (embedded/modal usage); router param remains
    // as fallback so the routed (non-embedded) "/edit/:voucherNumber"
    // usage still works untouched.
    const voucherNumber = voucherNumberProp || params?.voucherNumber || "";

    const mode = modeProp || (voucherNumber ? "edit" : "add");
    const isEditMode = mode === "edit" || mode === "view";
    const isView = mode === "view";

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

    // ⭐ ADDED — VEHICLE MASTER FROM SELECTED DRIVER DETAILS
    const [driverVehicleMaster, setDriverVehicleMaster] = useState<any>({
        code: "",
        name: "",
    });

    const [salary, setSalary] = useState("");
    const [incentives, setIncentives] = useState("");
    const [paymentMode, setPaymentMode] = useState("");
    const [paymentDate, setPaymentDate] = useState(formatDateForInput(new Date()));
    const [remarks, setRemarks] = useState("");
    const [paymentAccountCode, setPaymentAccountCode] = useState("");
    const [paymentAccountName, setPaymentAccountName] = useState("");
    const [expenseRowEdits, setExpenseRowEdits] = useState<Record<string, any>>({});
    const [advanceRowEdits, setAdvanceRowEdits] = useState<Record<string, any>>({});

    // Edit-mode state
    const [editRecord, setEditRecord] = useState<any>(null);
    const [fetchingEdit, setFetchingEdit] = useState(false);

    const loading = pageLoading || driversLoader || fetchingEdit;

    // Single place that decides how to "leave" the screen — closes the
    // modal when embedded, otherwise falls back to router navigation.
    const goBack = useCallback(() => {
        if (embedded && onClose) {
            onClose();
            return;
        }

        navigate(-1);
    }, [embedded, onClose, navigate]);

    const goToList = useCallback(() => {
        if (embedded && onClose) {
            onClose();
            return;
        }

        navigate("/bookEz/transportation/driver-settlement");
    }, [embedded, onClose, navigate]);

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

    const vendorAccountOptions = useMemo(() => accounts.filter((account: any) => normalizeText(account?.accountType) === "vendor" && cleanText(account?.accountCode)).map((account: any) => ({ value: cleanText(account?.accountCode), label: cleanText(account?.accountName) || cleanText(account?.accountCode) })), [accounts]);
    const expenseAccountOptions = useMemo(() => accounts.filter((account: any) => normalizeText(account?.accountType) === "expense" && cleanText(account?.accountCode)).map((account: any) => ({ value: cleanText(account?.accountCode), label: cleanText(account?.accountName) || cleanText(account?.accountCode) })), [accounts]);

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

    const transportExpenseAccountMap = useMemo(() => {
        const cfg =
            activeSystemConfiguration
                ?.systemConfiguration
                ?.transportationModuleConfiguration || {};

        const result: Record<
            string,
            {
                code: string;
                name: string;
                isConfigured: boolean;
                isAccountFound: boolean;
            }
        > = {};

        Object.entries(cfg).forEach(
            ([configurationKey, configuredValue]) => {
                if (
                    configurationKey ===
                    "enableTransportationModule"
                ) {
                    return;
                }

                const accountCode =
                    cleanText(configuredValue);

                if (!accountCode) return;

                const matchedAccount =
                    accountMasterByCode.get(
                        accountCode.toLowerCase()
                    );

                result[configurationKey] = {
                    code: accountCode,
                    name: matchedAccount?.name || "",
                    isConfigured: true,
                    isAccountFound: Boolean(matchedAccount),
                };
            }
        );

        return result;
    }, [
        activeSystemConfiguration,
        accountMasterByCode,
    ]);

    const getExpenseAccount = useCallback(
        (expenseKey: string, expenseType: string) => {
            const configuredAccount = transportExpenseAccountMap[expenseKey];
            const expectedAccountName = EXPENSE_ACCOUNT_NAMES[expenseKey];
            const matchedExpenseAccount = accounts.find((item: any) => normalizeText(item?.accountType) === "expense" && normalizeText(item?.accountName) === normalizeText(expectedAccountName) && cleanText(item?.accountCode));
            const account = matchedExpenseAccount
                ? { code: cleanText(matchedExpenseAccount.accountCode), name: cleanText(matchedExpenseAccount.accountName) }
                : configuredAccount?.isConfigured && configuredAccount?.isAccountFound && configuredAccount?.code && configuredAccount?.name
                    ? { code: configuredAccount.code, name: configuredAccount.name }
                    : null;

            if (!account?.code || !account?.name) throw new Error(`Expense account "${expectedAccountName || expenseType}" was not found in Account Master.`);

            return {
                code: account.code,
                name: account.name,
            };
        },
        [transportExpenseAccountMap, accounts]
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
            // @ts-ignore
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
       EDIT / VIEW MODE: fetch settlement by voucher number
       and prefill the simple fields (salary, incentives,
       payment mode/date, remarks, linked trip id).
    --------------------------------------------------- */
    useEffect(() => {
        if (!isEditMode || !voucherNumber) return;

        const fetchSettlement = async () => {
            try {
                setFetchingEdit(true);

                const response = await unwrapThunk(
                    dispatch,
                    getDriverSettlementByVoucherNumber(voucherNumber) as any
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
       EDIT / VIEW MODE: once driver list is loaded, match
       the settlement's driver (by driverCode, falling back
       to driver name from lrDetails) and prefill driver fields.
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

    // In edit/view mode, trip/LR/expense/advance details come straight
    // from the GET-by-voucher response instead of the live open-trip
    // selections.
    const baseSettlementData = useMemo(() => {
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

    useEffect(() => {
        setExpenseRowEdits({});
        setAdvanceRowEdits({});
    }, [selectedTripId, editRecord]);

    const patchExpenseRow = (id: string, patch: any) => {
        if (isView) return;
        setExpenseRowEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
    };

    const patchAdvanceRow = (id: string, patch: any) => {
        if (isView) return;
        setAdvanceRowEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
    };

    const settlementData = useMemo(() => {
        if (!baseSettlementData) return baseSettlementData;

        const expenseRows = (baseSettlementData.expenseRows || []).map((row: any) => {
            const merged = { ...row, ...(expenseRowEdits[row.id] || {}) };
            return { ...merged, amount: Number(merged.amount || 0), description: getExpenseDescription(merged.expenseKey, merged) };
        });
        const advanceRows = (baseSettlementData.advanceRows || []).map((row: any) => {
            const merged = { ...row, ...(advanceRowEdits[row.id] || {}) };
            return { ...merged, amount: Number(merged.amount || 0) };
        });
        const totalExpenses = sumAmounts(expenseRows);
        const totalAdvances = sumAmounts(advanceRows);
        const totalAllowedExpenses = totalExpenses;

        return { ...baseSettlementData, expenseRows, advanceRows, totalExpenses, totalAllowedExpenses, totalAdvances, settlement: computeSettlementSummary({ salary, incentives, allowedExpenses: totalAllowedExpenses, totalAdvances }) };
    }, [baseSettlementData, expenseRowEdits, advanceRowEdits, salary, incentives]);

    const tripPendingAccept = useMemo(
        () => (isEditMode ? false : isTripPendingAccept(selectedTripExpense)),
        [isEditMode, selectedTripExpense]
    );

    const handleDriverSelect = async (driverId: string) => {
        if (isView) return;

        const selected = driverUsers.find(
            (driver: any) => driver.driverId === driverId
        );

        setSelectedDriverId(driverId || "");
        setSelectedTripId("");
        setDriverVehicleMaster({
            code: "",
            name: "",
        });

        if (!selected) {
            setDriverDetail({
                driverId: "",
                driverName: "",
                mobileNumber: "",
                licenseNumber: "",
                licenseExpiryDate: "",
            });
            setDriverVehicleMaster({
                code: "",
                name: "",
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

            // ⭐ ADDED — TAKE VEHICLE MASTER FROM SELECTED DRIVER DETAILS
            const selectedDriverVehicleMaster =
                customFields?.vehiclemaster ||
                customFields?.vehicleMaster ||
                {};

            setDriverVehicleMaster({
                code: cleanText(selectedDriverVehicleMaster?.code),
                name: cleanText(selectedDriverVehicleMaster?.name),
            });

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
        if (isView) return;

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
        if (isView) return;

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
                    field: { ...field, disabled: isView || field.disabled },
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
        if (isView) return;

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

        let settlementSaved = false;

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
                const settlementVoucherNumber = String(
                    editRecord?.settlementNumber ||
                    editRecord?.voucherNumber ||
                    ""
                ).trim();

                if (!settlementVoucherNumber) {
                    toast.error(
                        "Driver settlement voucher number not found"
                    );
                    return;
                }

                await dispatch(
                    updateDriverSettlement({
                        voucherNumber:
                            settlementVoucherNumber,
                        payload,
                    }) as any
                ).unwrap();

                dispatch(sendWhatsAppMessage({ moduleType: "driverSettlement", voucherNumber: settlementVoucherNumber }) as any).unwrap().catch(() => { });

                toast.success(
                    "Driver Settlement Updated Successfully"
                );

                goToList();

                return;
            }

            /* =====================================================
               CREATE DRIVER SETTLEMENT
            ===================================================== */

            const settlementResponse = await dispatch(
                createDriverSettlement(payload) as any
            ).unwrap();

            settlementSaved = true;

            const voucherNumberResult =
                settlementResponse?.data?.settlementNumber ||
                settlementResponse?.settlementNumber;

            if (voucherNumberResult) {
                dispatch(sendWhatsAppMessage({ moduleType: "driverSettlement", voucherNumber: voucherNumberResult }) as any).unwrap().catch(() => { });
            }

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
                try {
                    if (!expenseLineItems.length) throw new Error("No expense entries with an amount were found to create the expense payment");

                    const payBody = expenseLineItems.map(
                    (row: any, index: number) => {
                        const account = getExpenseAccount(
                            row.expenseKey,
                            row.type
                        );
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

                    trip_order: transportOrderNumber,
                    lr_no: tripDetails?.lrNo === "-" ? "" : tripDetails?.lrNo || selectedLREntry?.lrNumber || "",
                    driver: tripDetails?.driverName || selectedLREntry?.driver?.driverName || driverDetail?.driverName || selectedDriver?.driverName || "",
                    customMasters: {
                        "Vehicle Master": {
                            code: driverVehicleMaster?.code || "",
                            name: driverVehicleMaster?.name || "",
                        },
                    },

                    transactionPurpose:
                        "TRIP_EXPENSE_PAYMENT",
                };

                    const paymentResponse = await dispatch(addPayment({ payload: paymentPayload }) as any).unwrap();

                    paymentVoucherNumber = getPaymentVoucherNumber(paymentResponse);

                    if (!paymentVoucherNumber) console.warn("Expense payment created, but voucher number was not returned", paymentResponse);
                } catch (paymentError) {
                    console.error("Driver settlement payment creation failed:", paymentError);
                }
            }

            /* =====================================================
               CREATE RECEIPT FOR EXPECTED FREIGHT
            ===================================================== */

            if (freightAmount > 0) {
                try {
                    if (!customerAccountCode) throw new Error("Customer account code is required to create freight receipt");
                    if (!customerAccountName) throw new Error("Customer account name is required to create freight receipt");

                    const receiptPayload: any = {
                    recVoucherNumber: "AUTO",
                    recVoucherDate: paymentDate,

                    recAccountCode: "Act-4",
                    recAccountName: "Cash In Hand",

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

                    trip_order: transportOrderNumber,
                    lr_no: tripDetails?.lrNo === "-" ? "" : tripDetails?.lrNo || selectedLREntry?.lrNumber || "",
                    driver: tripDetails?.driverName || selectedLREntry?.driver?.driverName || driverDetail?.driverName || selectedDriver?.driverName || "",
                    customMasters: {
                        "Vehicle Master": {
                            code: driverVehicleMaster?.code || "",
                            name: driverVehicleMaster?.name || "",
                        },
                    },
                    transactionPurpose:
                        "FREIGHT_RECEIPT",
                };

                    const receiptResponse = await dispatch(addSalesReceipt({ payload: receiptPayload }) as any).unwrap();

                    receiptVoucherNumber = getReceiptVoucherNumber(receiptResponse);

                    if (!receiptVoucherNumber) console.warn("Freight receipt created, but voucher number was not returned", receiptResponse);
                } catch (receiptError) {
                    console.error("Driver settlement receipt creation failed:", receiptError);
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

            if (expenseAmount > 0 && freightAmount > 0) {
                toast.success(`Settlement created with Payment ${paymentVoucherNumber || ""} and Receipt ${receiptVoucherNumber || ""}`);
            } else if (expenseAmount > 0) {
                toast.success(paymentVoucherNumber ? `Settlement and Expense Payment ${paymentVoucherNumber} created successfully` : "Settlement and Expense Payment created successfully");
            } else if (freightAmount > 0) {
                toast.success(receiptVoucherNumber ? `Settlement and Freight Receipt ${receiptVoucherNumber} created successfully` : "Settlement and Freight Receipt created successfully");
            } else {
                toast.success("Driver Settlement created. No expense payment or freight receipt was required.");
            }

            goToList();

        } catch (error: any) {
            console.error(
                "Driver settlement accounting error:",
                error
            );

            if (settlementSaved) {
                toast.success("Driver Settlement Created Successfully");
                goToList();
                return;
            }

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
        <div className="flex h-full w-full flex-col bg-card text-card-foreground shadow-sm">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3">
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={goBack}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go back"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h1 className="truncate text-lg font-bold text-card-foreground">
                            <span>
                                {isView
                                    ? "View Driver Settlement"
                                    : isEditMode
                                        ? "Edit Driver Settlement"
                                        : "Driver Settlement"}
                            </span>
                        </h1>

                        <p className="text-sm text-muted-foreground">
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
                                classNames={selectClassNames}
                                styles={selectThemeStyles}
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
                                classNames={selectClassNames}
                                styles={selectThemeStyles}
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
                            ) : !settlementData.expenseRows.length ? (
                                <EmptyHint>No expense entries in this trip.</EmptyHint>
                            ) : (
                                <div className="space-y-3">
                                    {settlementData.expenseRows.map((item: any, index: number) => {
                                        const accountOptions = item.expenseKey === "dieselCost" || item.expenseKey === "petrolCost" ? vendorAccountOptions : expenseAccountOptions;
                                        const getOption = (value: any) => {
                                            const current = cleanText(value);
                                            if (!current) return null;
                                            return accountOptions.find((option: any) => option.value === current) || { value: current, label: current };
                                        };
                                        return (
                                            <div key={item.id} className="rounded-md border border-border bg-muted/30 p-3">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <h3 className="text-sm font-bold text-card-foreground">{item.type} - Entry {index + 1}</h3>
                                                </div>

                                                <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${item.expenseKey === "dieselCost" || item.expenseKey === "petrolCost" ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
                                                    <label className="flex min-w-0 flex-col gap-1">
                                                        <span className="text-sm font-medium text-card-foreground">Date</span>
                                                        <input disabled={isView} type="datetime-local" value={toDateTimeInputValue(item.date)} onChange={(e) => patchExpenseRow(item.id, { date: dateTimeInputToIso(e.target.value) })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-60" />
                                                    </label>

                                                    {(item.expenseKey === "dieselCost" || item.expenseKey === "petrolCost") && (
                                                        <label className="flex min-w-0 flex-col gap-1">
                                                            <span className="text-sm font-medium text-card-foreground">Fuel Station</span>
                                                            <Select value={getOption(item.fuelStation)} options={accountOptions} placeholder="Select Fuel Station" isDisabled={isView} isSearchable onChange={(option: any) => patchExpenseRow(item.id, { fuelStation: option?.value || "" })} classNamePrefix="rs" classNames={selectClassNames} styles={selectThemeStyles} />
                                                        </label>
                                                    )}

                                                    {item.expenseKey === "foodCost" && (
                                                        <label className="flex min-w-0 flex-col gap-1">
                                                            <span className="text-sm font-medium text-card-foreground">Meal Type</span>
                                                            <input disabled={isView} value={item.mealType || ""} onChange={(e) => patchExpenseRow(item.id, { mealType: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
                                                        </label>
                                                    )}

                                                    {item.expenseKey === "breakdownCost" && (
                                                        <label className="flex min-w-0 flex-col gap-1">
                                                            <span className="text-sm font-medium text-card-foreground">Issue Type</span>
                                                            <input disabled={isView} value={item.issueType || ""} onChange={(e) => patchExpenseRow(item.id, { issueType: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
                                                        </label>
                                                    )}

                                                    {(item.expenseKey === "runningCost" || item.expenseKey === "otherCost") && (
                                                        <label className="flex min-w-0 flex-col gap-1">
                                                            <span className="text-sm font-medium text-card-foreground">Expense Type</span>
                                                            <Select value={getOption(item.expenseType)} options={accountOptions} placeholder="Select Expense Type" isDisabled={isView} isSearchable onChange={(option: any) => patchExpenseRow(item.id, { expenseType: option?.value || "" })} classNamePrefix="rs" classNames={selectClassNames} styles={selectThemeStyles} />
                                                        </label>
                                                    )}

                                                    <label className="flex min-w-0 flex-col gap-1">
                                                        <span className="text-sm font-medium text-card-foreground">Amount</span>
                                                        <input disabled={isView} type="number" min="0" step="0.01" value={expenseRowEdits[item.id]?.amount ?? String(item.amount ?? 0)} onChange={(e) => patchExpenseRow(item.id, { amount: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
                                                    </label>

                                                    {(item.expenseKey === "dieselCost" || item.expenseKey === "petrolCost") && (
                                                        <label className="flex min-w-0 flex-col gap-1">
                                                            <span className="text-sm font-medium text-card-foreground">Odometer</span>
                                                            <input disabled={isView} type="number" value={item.odometerReading ?? ""} onChange={(e) => patchExpenseRow(item.id, { odometerReading: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"><span>Total Expenses</span><span>{formatMoney(settlementData.totalExpenses)}</span></div>
                                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"><span>Total Allowed Expenses</span><span>{formatMoney(settlementData.totalAllowedExpenses)}</span></div>
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
                            ) : !settlementData.advanceRows.length ? (
                                <EmptyHint>No advances recorded for this trip.</EmptyHint>
                            ) : (
                                <div className="space-y-3">
                                    {settlementData.advanceRows.map((item: any, index: number) => (
                                        <div key={item.id} className="rounded-md border border-border bg-muted/30 p-3">
                                            <div className="mb-3 text-sm font-bold text-card-foreground">Advance Entry {index + 1}</div>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <label className="flex min-w-0 flex-col gap-1">
                                                    <span className="text-sm font-medium text-card-foreground">Date</span>
                                                    <input disabled={isView} type="datetime-local" value={toDateTimeInputValue(item.date)} onChange={(e) => patchAdvanceRow(item.id, { date: dateTimeInputToIso(e.target.value) })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-60" />
                                                </label>
                                                <label className="flex min-w-0 flex-col gap-1">
                                                    <span className="text-sm font-medium text-card-foreground">Source</span>
                                                    <input disabled={isView} value={item.source || ""} onChange={(e) => patchAdvanceRow(item.id, { source: e.target.value, sourceName: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
                                                </label>
                                                <label className="flex min-w-0 flex-col gap-1">
                                                    <span className="text-sm font-medium text-card-foreground">Amount</span>
                                                    <input disabled={isView} type="number" min="0" step="0.01" value={advanceRowEdits[item.id]?.amount ?? String(item.amount ?? 0)} onChange={(e) => patchAdvanceRow(item.id, { amount: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground"><span>Total Advances</span><span>{formatMoney(settlementData.totalAdvances)}</span></div>
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
                            <div className="rounded-lg border border-border bg-background p-4 text-foreground">
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
                    onClick={goBack}
                    disabled={loading}
                    className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
                >
                    {isView ? "Close" : "Cancel"}
                </button>

                {!isView && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                    >
                        <Save size={16} />
                        {loading ? "Loading..." : isEditMode ? "Update & Post" : "Save & Post"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CreateEditDriverSettlement;