import React, {
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
import { useNavigate } from "react-router-dom";
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
   COMMON HELPERS
=================================================== */

const cleanText = (value: any) => String(value || "").trim();

const normalizeText = (value: any) =>
    String(value || "")
        .trim()
        .toLowerCase();

const formatMoney = (value: any) => {
    const num = Number(value || 0);

    return `₹${num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const formatDateTime = (value: any) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDateInput = (value: any) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString().slice(0, 10);
};

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

const getOrderNumber = (record: any) =>
    cleanText(
        record?.orderNumber ||
            record?.transportOrderNumber ||
            record?.tOrderNumber ||
            record?.tripNumber ||
            record?.tripId ||
            record?.allocationVoucherNumber ||
            record?.tripAllocationVoucherNumber ||
            record?.voucherNumber ||
            record?.allocationNumber ||
            record?.transportOrder?.transportOrderNumber ||
            ""
    );

const getLRNumber = (record: any) =>
    cleanText(
        record?.lrNumber ||
            record?.lrVoucherNumber ||
            record?.tripLRCollectionVoucherNumber ||
            record?.tripLREntryVoucherNumber ||
            record?.voucherNumber ||
            ""
    );

const getVehicleNumber = (record: any, fallback = "-") =>
    record?.vehicle?.vehicleNumber ||
    record?.vehicleDetails?.vehicleNumber ||
    record?.vehicleSelection?.vehicleNumber ||
    record?.vehicleNumber ||
    record?.tripDetails?.vehicleNo ||
    fallback;

const getRouteText = (record: any, fallback = "-") => {
    const from =
        record?.pickupDetails?.pickupLocation ||
        record?.pickupDetails?.pickupCityName ||
        record?.transportOrder?.pickupDetails?.pickupLocation ||
        record?.route?.source ||
        record?.route?.routeName?.split("-")?.[0] ||
        record?.routesData?.pickupDetails?.pickupLocation ||
        "";

    const to =
        record?.deliveryDetails?.deliveryLocation ||
        record?.deliveryDetails?.deliveryCityName ||
        record?.transportOrder?.deliveryDetails?.deliveryLocation ||
        record?.route?.destination ||
        record?.route?.routeName?.split("-")?.[1] ||
        record?.routesData?.deliveryDetails?.deliveryLocation ||
        "";

    return from || to ? `${from || "-"} - ${to || "-"}` : fallback;
};

const getGoodsName = (record: any, fallback = "-") =>
    record?.cargo?.productName ||
    record?.goodsDetails?.goodsName ||
    record?.goodsDetails?.productName ||
    record?.cargoDetails?.productName ||
    record?.transportOrder?.goodsDetails?.goodsName ||
    [record?.cargo?.quantity, record?.cargo?.unit].filter(Boolean).join(" ") ||
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

    const addOption = (orderNumber: string, base: any = {}) => {
        const value = cleanText(orderNumber);

        if (!value) return;

        const allocation =
            base.allocation || findAllocationForTrip(activeAllocations, value);

        const tripExpense =
            base.tripExpense || findTripExpenseForTrip(tripExpenses, value);

        const transportOrder =
            base.transportOrder ||
            allocation?.transportOrder ||
            findTransportOrderForTrip(transportOrders, value);

        const lrEntry = base.lrEntry || findLREntryForTrip(lrEntries, value);

        const vehicleNo =
            getVehicleNumber(allocation, "") ||
            getVehicleNumber(tripExpense, "") ||
            getVehicleNumber(lrEntry, "") ||
            getVehicleNumber(transportOrder, "") ||
            "-";

        const lrNumber = getLRNumber(lrEntry);

        const route =
            getRouteText(allocation, "") ||
            getRouteText(transportOrder, "") ||
            getRouteText(lrEntry, "") ||
            getRouteText(tripExpense, "") ||
            "";

        optionMap.set(value, {
            label: `${value} • ${vehicleNo}${lrNumber ? ` • LR: ${lrNumber}` : ""}${
                route ? ` • ${route}` : ""
            }`,
            value,
            allocation,
            transportOrder,
            tripExpense,
            lrEntry,
        });
    };

    for (const allocation of activeAllocations || []) {
        if (!isActiveTripRecord(allocation)) continue;
        if (!recordMatchesDriver(allocation, selectedDriver)) continue;

        const orderNumber =
            allocation?.transportOrder?.transportOrderNumber ||
            allocation?.tripAllocationVoucherNumber ||
            allocation?.tripNumber ||
            allocation?.voucherNumber ||
            "";

        addOption(orderNumber, { allocation });
    }

    for (const expense of tripExpenses || []) {
        if (!isActiveTripRecord(expense)) continue;
        if (!recordMatchesDriver(expense, selectedDriver)) continue;

        const orderNumber =
            expense?.tripId ||
            expense?.tripNumber ||
            expense?.allocationVoucherNumber ||
            expense?.tripAllocationVoucherNumber ||
            expense?.transportOrderNumber ||
            expense?.voucherNumber ||
            "";

        addOption(orderNumber, { tripExpense: expense });
    }

    for (const lr of lrEntries || []) {
        const orderNumber =
            lr?.transportOrderNumber ||
            lr?.tripNumber ||
            lr?.orderNumber ||
            lr?.transportOrder?.transportOrderNumber ||
            "";

        if (!orderNumber) continue;

        const matchedAllocation = findAllocationForTrip(activeAllocations, orderNumber);
        const matchedExpense = findTripExpenseForTrip(tripExpenses, orderNumber);

        const matchedDriver =
            recordMatchesDriver(matchedAllocation, selectedDriver) ||
            recordMatchesDriver(matchedExpense, selectedDriver);

        if (!matchedDriver) continue;

        addOption(orderNumber, { lrEntry: lr });
    }

    return Array.from(optionMap.values());
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
            "Diesel expense"
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
    driver,
}: any = {}) => {
    const summaryMeta = tripExpense ? computeTripExpenseSummary(tripExpense) : null;

    const tripStatus = cleanText(
        tripExpense?.tripStatus ||
            allocation?.tripStatus ||
            transportOrder?.tripStatus ||
            transportOrder?.status ||
            "-"
    )
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    if (!allocation && !transportOrder && !tripExpense && !lrEntry) return null;

    return {
        tripNo:
            getOrderNumber(lrEntry) ||
            getOrderNumber(tripExpense) ||
            getOrderNumber(allocation) ||
            getOrderNumber(transportOrder) ||
            "-",

        lrNo: getLRNumber(lrEntry) || tripExpense?.lrNumber || "-",

        tripDate:
            lrEntry?.loading?.loadingDateTime ||
            lrEntry?.createdAt ||
            tripExpense?.tripDate ||
            allocation?.tripPlan?.plannedStartDateTime ||
            transportOrder?.orderDate ||
            "",

        lrDate: lrEntry?.lrDate || tripExpense?.lrDate || "",

        from:
            lrEntry?.route?.source ||
            lrEntry?.route?.routeName?.split("-")?.[0] ||
            allocation?.transportOrder?.pickupDetails?.pickupLocation ||
            transportOrder?.pickupDetails?.pickupLocation ||
            tripExpense?.routesData?.pickupDetails?.pickupLocation ||
            "-",

        to:
            lrEntry?.route?.destination ||
            lrEntry?.route?.routeName?.split("-")?.[1] ||
            allocation?.transportOrder?.deliveryDetails?.deliveryLocation ||
            transportOrder?.deliveryDetails?.deliveryLocation ||
            tripExpense?.routesData?.deliveryDetails?.deliveryLocation ||
            "-",

        consignor:
            lrEntry?.consignor?.name ||
            allocation?.transportOrder?.customerDetails?.customerName ||
            transportOrder?.customerDetails?.customerName ||
            "-",

        consignee:
            lrEntry?.consignee?.name ||
            allocation?.transportOrder?.deliveryDetails?.consigneeName ||
            transportOrder?.deliveryDetails?.consigneeName ||
            "-",

        vehicleNo:
            getVehicleNumber(allocation, "") ||
            getVehicleNumber(tripExpense, "") ||
            getVehicleNumber(lrEntry, "") ||
            getVehicleNumber(transportOrder, "") ||
            "-",

        goods:
            getGoodsName(lrEntry, "") ||
            getGoodsName(allocation?.transportOrder, "") ||
            getGoodsName(transportOrder, "") ||
            getGoodsName(tripExpense, "") ||
            "-",

        driverName:
            driver?.driverName ||
            tripExpense?.driver?.driverName ||
            allocation?.driverAllocation?.driverName ||
            lrEntry?.driver?.driverName ||
            "-",

        tripStatus,
        totalTripExpense: summaryMeta?.totalTripExpense ?? 0,
        balanceAmount: summaryMeta?.balanceAmount ?? 0,
        expectedFreight: Number(
            transportOrder?.freightDetails?.expectedFreight ||
                allocation?.transportOrder?.freightDetails?.expectedFreight ||
                0
        ),
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
            className={`text-sm font-semibold ${
                muted ? "text-muted-foreground" : ""
            }`}
        >
            {label}
        </p>

        <p
            className={`text-sm font-semibold ${
                muted ? "text-muted-foreground" : ""
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

    const { users = [] } = useSelector((s: any) => s.professionalUser || {});

    const {
        activeAllocations = [],
        driversLoader = false,
    } = useSelector((state: any) => state.tripAllocation || {});

    const [pageLoading, setPageLoading] = useState(false);
    const [transportOrders, setTransportOrders] = useState<any[]>([]);
    const [tripExpenses, setTripExpenses] = useState<any[]>([]);
    const [lrEntries, setLrEntries] = useState<any[]>([]);

    const [selectedDriverId, setSelectedDriverId] = useState("");
    const [selectedTripId, setSelectedTripId] = useState("");

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
    const [paymentDate, setPaymentDate] = useState(formatDateInput(new Date()));
    const [remarks, setRemarks] = useState("");

    const loading = pageLoading || driversLoader;

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

    const loadSettlementSources = useCallback(async () => {
        try {
            setPageLoading(true);

            const [ordersRes, allocationRes, expenseRes, lrRes] = await Promise.all([
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
                    getAllTripExpenses({
                        limit: 100000,
                        offset: 0,
                        search: "",
                        // parentUserMobileNumber: parentMobile,
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
            ]);

            setTransportOrders(getApiList(ordersRes));
            setTripExpenses(getApiList(expenseRes));
            setLrEntries(getApiList(lrRes));

            // activeAllocations is kept in redux like Trip Allocation screen.
            // Dispatch result above only refreshes the slice.
            console.log("Settlement allocations:", getApiList(allocationRes));
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
        if (
            selectedTripId &&
            !orderOptions.some((option: any) => option.value === selectedTripId)
        ) {
            setSelectedTripId("");
        }
    }, [selectedTripId, orderOptions]);

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

    const settlementData = useMemo(
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

    const tripPendingAccept = useMemo(
        () => isTripPendingAccept(selectedTripExpense),
        [selectedTripExpense]
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

    const handleSave = () => {
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

        const payload = {
            driver: {
                driverId: driverDetail.driverId || selectedDriver?.driverId,
                driverName: driverDetail.driverName || selectedDriver?.driverName,
                mobileNumber: driverDetail.mobileNumber || selectedDriver?.mobileNumber,
                licenseNumber: driverDetail.licenseNumber || "",
                licenseExpiryDate: driverDetail.licenseExpiryDate || "",
            },

            orderNumber: selectedTripId,
            allocation: selectedAllocation,
            transportOrder: selectedTransportOrder,
            tripExpense: selectedTripExpense,
            lrEntry: selectedLREntry,

            salary: Number(salary || 0),
            incentives: Number(incentives || 0),
            paymentMode,
            paymentDate,
            remarks,

            settlement: settlementData.settlement,
            totalExpenses: settlementData.totalExpenses,
            totalAllowedExpenses: settlementData.totalAllowedExpenses,
            totalAdvances: settlementData.totalAdvances,

            tripDetails: settlementData.tripDetails,
            expenseRows: settlementData.expenseRows,
            advanceRows: settlementData.advanceRows,
        };

        console.log("Driver Settlement Payload", payload);

        toast.success("Driver settlement saved");
        navigate(-1);
    };

    const tripDetails = settlementData.tripDetails;

    return (
        <div className="flex h-full w-full flex-col bg-card shadow-sm">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3">
                <div>
                    <h1 className="flex items-center gap-1 text-md font-semibold">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <span>Driver Settlement</span>
                    </h1>

                    <p className="px-2 text-sm text-muted-foreground">
                        Salary based driver settlement using allocation, order, LR, trip expense and advances.
                    </p>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
                <div className="space-y-4">
                    <FormSectionCard
                        index={1}
                        title="Select Driver & Order"
                        icon={<Users size={17} />}
                        expanded={true}
                        onToggle={() => {}}
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
                                isDisabled={driversLoader || pageLoading}
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
                                value={selectedOrderOption}
                                options={orderOptions}
                                placeholder={
                                    !selectedDriverId
                                        ? "Select driver first"
                                        : pageLoading
                                        ? "Loading orders..."
                                        : "Select Order / Trip"
                                }
                                isDisabled={!selectedDriverId || pageLoading}
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
                                value={formatDateInput(driverDetail?.licenseExpiryDate)}
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
                        onToggle={() => {}}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            {!selectedTripId ? (
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
                        onToggle={() => {}}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            {!selectedTripId ? (
                                <EmptyHint>Select order / trip to view expenses.</EmptyHint>
                            ) : !selectedTripExpense ? (
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
                        onToggle={() => {}}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            {!selectedTripId ? (
                                <EmptyHint>Select order / trip to view advances.</EmptyHint>
                            ) : !selectedTripExpense ? (
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
                        onToggle={() => {}}
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
                    {loading ? "Loading..." : "Save & Proceed"}
                </button>
            </div>
        </div>
    );
};

export default CreateEditDriverSettlement;