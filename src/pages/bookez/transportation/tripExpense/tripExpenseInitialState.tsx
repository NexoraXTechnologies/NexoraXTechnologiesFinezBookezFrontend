export type AnyObj = Record<string, any>;

const sumAmounts = (entries: AnyObj[] = []) =>
  entries.reduce((acc, row) => acc + Number(row?.amount || 0), 0);

const entryDateNow = () => new Date().toISOString();

export const createEmptyAdvanceEntry = () => ({
  date: entryDateNow(),
  sourceType: "company",
  sourceName: "",
  amount: "",
  paymentMode: "cash",
  remarks: "",
});

export const createEmptyDieselEntry = () => ({
  date: entryDateNow(),
  fuelStation: "",
  liters: "",
  ratePerLiter: "",
  amount: "",
  odometerReading: "",
  billNumber: "",
  billImage: "",
});

export const createEmptyFoodEntry = () => ({
  date: entryDateNow(),
  mealType: "",
  amount: "",
  location: "",
});

export const createEmptyRunningEntry = () => ({
  date: entryDateNow(),
  expenseType: "",
  amount: "",
  location: "",
});

export const createEmptyBreakdownEntry = () => ({
  date: entryDateNow(),
  issueType: "",
  serviceCenter: "",
  amount: "",
  location: "",
});

export const createEmptyOtherEntry = () => ({
  date: entryDateNow(),
  expenseType: "",
  amount: "",
  remarks: "",
});

const normalizeEntryDate = (entry: AnyObj = {}) =>
  entry?.date || entry?.receivedDate || new Date().toISOString();

export const createInitialTripExpense = () => ({
  tripId: "",
  tripDate: new Date().toISOString(),
  lrNumber: "",
  lrDate: "",

  vehicle: {
    vehicleId: "",
    vehicleNumber: "",
  },

  driver: {
    driverId: "",
    driverName: "",
  },

  startOdometer: "",
  endOdometer: "",

  expenses: {
    advanceReceived: { entries: [], totalAdvance: 0 },
    dieselCost: { entries: [], totalDieselCost: 0 },
    foodCost: { entries: [], totalFoodCost: 0 },
    runningCost: { entries: [], totalRunningCost: 0 },
    breakdownCost: { entries: [], totalBreakdownCost: 0 },
    otherCost: { entries: [], totalOtherCost: 0 },
  },

  pod: {
    deliveryStatus: "pending",
    receiverName: "",
    receiverMobile: "",
    receiverSignature: "",
    podDocument: "",
    deliveryPhoto: "",
    remarks: "",
    submittedAt: "",
  },

  summary: {
    totalAdvanceReceived: 0,
    totalTripExpense: 0,
    balanceAmount: 0,
  },

  tripStatus: "draft",
  enteredBy: "driver",
  enteredDate: new Date().toISOString(),

  assignedDriverMobile: "",
  tripAssignedToMobile: "",
  driverAccepted: false,
  acceptedAt: "",
  allocationVoucherNumber: "",
  vehicleCurrentStatus: "",

  notificationType: "",
  sendNotificationTo: "",
  notificationMessage: "",

  routesData: {
    pickupDetails: {},
    deliveryDetails: {},
    routeDetails: {},
  },
});

export const normalizeTripStatus = (status: any) => {
  const raw = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!raw) return "draft";
  if (raw === "inprogress" || raw === "in_progress") return "in_progress";
  if (raw === "complete" || raw === "completed") return "completed";
  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  return raw;
};

export const mergeTripExpenseForm = (data: AnyObj = {}) => {
  const base = createInitialTripExpense();

  return {
    ...base,
    ...data,
    vehicle: { ...base.vehicle, ...(data.vehicle || {}) },
    driver: { ...base.driver, ...(data.driver || {}) },
    expenses: {
      advanceReceived: {
        ...base.expenses.advanceReceived,
        ...(data.expenses?.advanceReceived || {}),
        entries: data.expenses?.advanceReceived?.entries || [],
      },
      dieselCost: {
        ...base.expenses.dieselCost,
        ...(data.expenses?.dieselCost || {}),
        entries: data.expenses?.dieselCost?.entries || [],
      },
      foodCost: {
        ...base.expenses.foodCost,
        ...(data.expenses?.foodCost || {}),
        entries: data.expenses?.foodCost?.entries || [],
      },
      runningCost: {
        ...base.expenses.runningCost,
        ...(data.expenses?.runningCost || {}),
        entries: data.expenses?.runningCost?.entries || [],
      },
      breakdownCost: {
        ...base.expenses.breakdownCost,
        ...(data.expenses?.breakdownCost || {}),
        entries: data.expenses?.breakdownCost?.entries || [],
      },
      otherCost: {
        ...base.expenses.otherCost,
        ...(data.expenses?.otherCost || {}),
        entries: data.expenses?.otherCost?.entries || [],
      },
    },
    pod: { ...base.pod, ...(data.pod || {}) },
    summary: { ...base.summary, ...(data.summary || {}) },
    tripStatus: normalizeTripStatus(data.tripStatus || base.tripStatus),
    assignedDriverMobile:
      data.assignedDriverMobile ||
      data.tripAssignedToMobile ||
      data.driver?.driverId ||
      base.assignedDriverMobile,
    tripAssignedToMobile:
      data.tripAssignedToMobile ||
      data.assignedDriverMobile ||
      data.driver?.driverId ||
      base.tripAssignedToMobile,
    lrNumber: data.lrNumber || "",
    lrDate: data.lrDate || "",
    driverAccepted: !!data.driverAccepted,
    acceptedAt: data.acceptedAt || "",
    allocationVoucherNumber: data.allocationVoucherNumber || "",
    vehicleCurrentStatus: data.vehicleCurrentStatus || "",
    notificationType: data.notificationType || "",
    sendNotificationTo: data.sendNotificationTo || "",
    notificationMessage: data.notificationMessage || "",
    routesData: {
      ...base.routesData,
      ...(data.routesData || {}),
      pickupDetails: {
        ...base.routesData.pickupDetails,
        ...(data.routesData?.pickupDetails || {}),
      },
      deliveryDetails: {
        ...base.routesData.deliveryDetails,
        ...(data.routesData?.deliveryDetails || {}),
      },
      routeDetails: {
        ...base.routesData.routeDetails,
        ...(data.routesData?.routeDetails || {}),
      },
    },
  };
};

export const getTripExpenseVoucher = (item: AnyObj = {}) =>
  item?.tripExpenseVoucherNumber || item?.voucherNumber || item?.tripExpenseNumber || "";

export const getAllocationVoucher = (item: AnyObj = {}) =>
  item?.tripNumber || item?.tripAllocationVoucherNumber || item?.voucherNumber || item?.allocationNumber || "";

export const getAssignedDriverMobile = (item: AnyObj = {}) =>
  String(
    item?.assignedDriverMobile ||
      item?.tripAssignedToMobile ||
      item?.sendNotificationTo ||
      item?.driver?.driverId ||
      item?.driver?.mobileNumber ||
      ""
  ).trim();

export const isTripClosed = (item: AnyObj = {}) =>
  normalizeTripStatus(item?.tripStatus) === "completed";

export const isTripPendingAccept = (item: AnyObj = {}) => {
  const status = normalizeTripStatus(item?.tripStatus);
  return (status === "pending" || status === "assigned") && !item?.driverAccepted;
};

export const isTripInProgress = (item: AnyObj = {}) =>
  normalizeTripStatus(item?.tripStatus) === "in_progress";

export const isParentStartedTrip = (item: AnyObj = {}) =>
  !item?.driverAccepted &&
  String(item?.notificationType || "") === "trip_started_by_parent" &&
  !isTripClosed(item);

export const canChildAcceptTrip = (item: AnyObj = {}) => isTripPendingAccept(item);

export const canChildEditTrip = (item: AnyObj = {}) => {
  if (isTripClosed(item)) return false;
  if (isTripPendingAccept(item)) return false;
  if (isTripInProgress(item)) return true;
  if (isParentStartedTrip(item)) return true;
  if (item?.driverAccepted) return true;
  return false;
};

export const isAssignedToDriver = (item: AnyObj = {}, driverMobile: any, user: AnyObj = {}) => {
  const mobile = String(driverMobile || "").trim();
  if (!mobile) return false;

  const candidates = [
    getAssignedDriverMobile(item),
    item?.tripAssignedToMobile,
    item?.assignedDriverMobile,
    item?.sendNotificationTo,
    item?.driver?.driverId,
    item?.driver?.mobileNumber,
  ]
    .map(value => String(value || "").trim())
    .filter(Boolean);

  if (candidates.some(value => value === mobile)) return true;

  const childName = [user?.userFirstName, user?.userMiddleName, user?.userLastName || user?.userSurname]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();

  const driverName = String(item?.driver?.driverName || "").trim().toLowerCase();
  return !!(childName && driverName && childName === driverName);
};

export const mapTripAllocationToExpenseForm = (allocation: AnyObj = {}) => {
  const allocationVoucher = getAllocationVoucher(allocation);
  const tripId = allocation?.transportOrder?.transportOrderNumber || allocationVoucher || "";
  const driverMobile = allocation?.driverAllocation?.driverId || "";
  const driverName = allocation?.driverAllocation?.driverName || "";

  return mergeTripExpenseForm({
    tripId,
    tripDate: allocation?.allocationDate || allocation?.tripPlan?.plannedStartDateTime || new Date().toISOString(),
    vehicle: {
      vehicleId: allocation?.vehicleSelection?.selectedVehicleId || "",
      vehicleNumber: allocation?.vehicleSelection?.vehicleNumber || "",
    },
    driver: { driverId: driverMobile, driverName },
    assignedDriverMobile: driverMobile,
    tripAssignedToMobile: driverMobile,
    allocationVoucherNumber: allocationVoucher,
    tripStatus: "draft",
    enteredBy: "dispatcher",
    enteredDate: new Date().toISOString(),
    routesData: {
      pickupDetails: allocation?.pickupDetails || allocation?.routesData?.pickupDetails || {},
      deliveryDetails: allocation?.deliveryDetails || allocation?.routesData?.deliveryDetails || {},
      routeDetails: allocation?.routeDetails || allocation?.routesData?.routeDetails || {},
    },
  });
};

export const buildTripExpenseFromAllocation = (allocation: AnyObj = {}, parentUser: AnyObj = {}) => {
  const tripId = allocation?.tripNumber || allocation?.transportOrder?.transportOrderNumber || allocation?.voucherNumber || "";
  const driverMobile = allocation?.driverAllocation?.driverId || "";
  const driverName = allocation?.driverAllocation?.driverName || "";
  const vehicleNumber = allocation?.vehicleSelection?.vehicleNumber || "-";

  const form = mergeTripExpenseForm({
    tripId,
    tripDate: allocation?.allocationDate || new Date().toISOString(),
    vehicle: {
      vehicleId: allocation?.vehicleSelection?.selectedVehicleId || "",
      vehicleNumber: allocation?.vehicleSelection?.vehicleNumber || "",
    },
    driver: { driverId: driverMobile, driverName },
    assignedDriverMobile: driverMobile,
    tripAssignedToMobile: driverMobile,
    driverAccepted: false,
    acceptedAt: "",
    allocationVoucherNumber: allocation?.voucherNumber || allocation?.tripAllocationVoucherNumber || "",
    tripStatus: "pending",
    enteredBy: "dispatcher",
    enteredDate: new Date().toISOString(),
    routesData: {
      pickupDetails: allocation?.pickupDetails || allocation?.routesData?.pickupDetails || {},
      deliveryDetails: allocation?.deliveryDetails || allocation?.routesData?.deliveryDetails || {},
      routeDetails: allocation?.routeDetails || allocation?.routesData?.routeDetails || {},
    },
  });

  return toTripExpensePayload(form, {
    tripStatus: "pending",
    driverAccepted: false,
    assignedDriverMobile: driverMobile,
    tripAssignedToMobile: driverMobile,
    notificationType: "trip_assigned",
    sendNotificationTo: driverMobile,
    notificationMessage: driverName
      ? `Hi ${driverName}, new trip assigned: ${tripId} | Vehicle: ${vehicleNumber}. Tap Accept in Trip Expense to start.`
      : `New trip assigned: ${tripId} | Vehicle: ${vehicleNumber}. Tap Accept in Trip Expense to start.`,
    notifyParent: false,
    assignedByMobile: parentUser?.userMobileNumberHash || "",
  });
};

export const computeTripExpenseSummary = (form: AnyObj = {}) => {
  const advanceTotal = sumAmounts(form.expenses?.advanceReceived?.entries);
  const dieselTotal = sumAmounts(form.expenses?.dieselCost?.entries);
  const foodTotal = sumAmounts(form.expenses?.foodCost?.entries);
  const runningTotal = sumAmounts(form.expenses?.runningCost?.entries);
  const breakdownTotal = sumAmounts(form.expenses?.breakdownCost?.entries);
  const otherTotal = sumAmounts(form.expenses?.otherCost?.entries);

  const totalTripExpense = dieselTotal + foodTotal + runningTotal + breakdownTotal + otherTotal;

  return {
    totalAdvanceReceived: advanceTotal,
    totalTripExpense,
    balanceAmount: advanceTotal - totalTripExpense,
    expenseTotals: {
      totalAdvance: advanceTotal,
      totalDieselCost: dieselTotal,
      totalFoodCost: foodTotal,
      totalRunningCost: runningTotal,
      totalBreakdownCost: breakdownTotal,
      totalOtherCost: otherTotal,
    },
  };
};

export const buildPodPayload = (pod: AnyObj = {}, overrides: AnyObj = {}) => {
  const merged = { ...pod, ...(overrides || {}) };
  const delivered = String(merged.deliveryStatus || "").toLowerCase() === "delivered";

  return {
    deliveryStatus: merged.deliveryStatus || "pending",
    receiverName: merged.receiverName || "",
    receiverMobile: merged.receiverMobile || "",
    receiverSignature: merged.receiverSignature || "",
    podDocument: merged.podDocument || "",
    deliveryPhoto: merged.deliveryPhoto || "",
    remarks: merged.remarks || "",
    submittedAt: merged.submittedAt || (delivered ? new Date().toISOString() : ""),
  };
};

export const toTripExpensePayload = (form: AnyObj = {}, overrides: AnyObj = {}) => {
  const merged = { ...form, ...overrides };
  const { totalAdvanceReceived, totalTripExpense, balanceAmount, expenseTotals } =
    computeTripExpenseSummary(merged);

  const mapEntries = (entries: AnyObj[] = [], mapper: (entry: AnyObj) => AnyObj) =>
    entries.map(entry => mapper(entry));

  return {
    ...merged,
    tripDate: merged.tripDate || new Date().toISOString(),
    enteredDate: merged.enteredDate || new Date().toISOString(),
    driver: {
      ...merged.driver,
      driverId: merged.driver?.driverId || merged.assignedDriverMobile || merged.tripAssignedToMobile || "",
      driverName: merged.driver?.driverName || "",
    },
    expenses: {
      advanceReceived: {
        entries: mapEntries(merged.expenses?.advanceReceived?.entries, e => ({
          ...e,
          date: normalizeEntryDate(e),
          amount: Number(e.amount || 0),
        })),
        totalAdvance: expenseTotals.totalAdvance,
      },
      dieselCost: {
        entries: mapEntries(merged.expenses?.dieselCost?.entries, e => ({
          ...e,
          date: normalizeEntryDate(e),
          liters: Number(e.liters || 0),
          ratePerLiter: Number(e.ratePerLiter || 0),
          amount: Number(e.amount || 0),
          odometerReading: Number(e.odometerReading || 0),
        })),
        totalDieselCost: expenseTotals.totalDieselCost,
      },
      foodCost: {
        entries: mapEntries(merged.expenses?.foodCost?.entries, e => ({
          ...e,
          date: normalizeEntryDate(e),
          amount: Number(e.amount || 0),
        })),
        totalFoodCost: expenseTotals.totalFoodCost,
      },
      runningCost: {
        entries: mapEntries(merged.expenses?.runningCost?.entries, e => ({
          ...e,
          date: normalizeEntryDate(e),
          amount: Number(e.amount || 0),
        })),
        totalRunningCost: expenseTotals.totalRunningCost,
      },
      breakdownCost: {
        entries: mapEntries(merged.expenses?.breakdownCost?.entries, e => ({
          ...e,
          date: normalizeEntryDate(e),
          amount: Number(e.amount || 0),
        })),
        totalBreakdownCost: expenseTotals.totalBreakdownCost,
      },
      otherCost: {
        entries: mapEntries(merged.expenses?.otherCost?.entries, e => ({
          ...e,
          date: normalizeEntryDate(e),
          amount: Number(e.amount || 0),
        })),
        totalOtherCost: expenseTotals.totalOtherCost,
      },
    },
    summary: { totalAdvanceReceived, totalTripExpense, balanceAmount },
    pod: buildPodPayload(merged.pod, overrides.pod),
    tripStatus: normalizeTripStatus(merged.tripStatus || "draft"),
    enteredBy: merged.enteredBy || "driver",
    assignedDriverMobile: merged.assignedDriverMobile || merged.tripAssignedToMobile || merged.driver?.driverId || "",
    tripAssignedToMobile: merged.tripAssignedToMobile || merged.assignedDriverMobile || merged.driver?.driverId || "",
    lrNumber: merged.lrNumber || "",
    lrDate: merged.lrDate || "",
    driverAccepted: !!merged.driverAccepted,
    acceptedAt: merged.acceptedAt || "",
    allocationVoucherNumber: merged.allocationVoucherNumber || "",
    notificationType: overrides.notificationType || merged.notificationType || "",
    sendNotificationTo: overrides.sendNotificationTo || merged.sendNotificationTo || "",
    notificationMessage: overrides.notificationMessage || merged.notificationMessage || "",
    notifyParent: overrides.notifyParent ?? merged.notifyParent ?? false,
    assignedByMobile: overrides.assignedByMobile || merged.assignedByMobile || "",
  };
};
