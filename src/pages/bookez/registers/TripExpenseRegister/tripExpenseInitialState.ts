/* =====================================================
   TRIP EXPENSE INITIAL STATE / HELPERS
===================================================== */

const sumAmounts = (entries: any[] = []): number =>
    entries.reduce((total, row) => total + Number(row?.amount || 0), 0);

const entryDateNow = (): string => new Date().toISOString();

export const toBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value;

    const normalized = String(value ?? "")
        .trim()
        .toLowerCase();

    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;

    return false;
};

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

const normalizeEntryDate = (entry: any): string =>
    entry?.date || entry?.receivedDate || new Date().toISOString();

export const normalizeTripStatus = (status: any): string => {
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

export const createInitialTripExpense = () => ({
    tripId: "",
    tripDate: new Date().toISOString(),
    lrNumber: "",
    lrDate: "",

    vehicle: {
        vehicleId: "",
        selectedVehicleId: "",
        vehicleVoucherNumber: "",
        voucherNumber: "",
        vehicleNumber: "",
    },

    driver: {
        driverId: "",
        driverName: "",
    },

    startOdometer: "",
    endOdometer: "",

    expenses: {
        advanceReceived: {
            entries: [],
            totalAdvance: 0,
        },
        dieselCost: {
            entries: [],
            totalDieselCost: 0,
        },
        foodCost: {
            entries: [],
            totalFoodCost: 0,
        },
        runningCost: {
            entries: [],
            totalRunningCost: 0,
        },
        breakdownCost: {
            entries: [],
            totalBreakdownCost: 0,
        },
        otherCost: {
            entries: [],
            totalOtherCost: 0,
        },
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
    completedAt: "",

    assignedDriverMobile: "",
    tripAssignedToMobile: "",
    driverAccepted: false,
    acceptedAt: "",

    allocationVoucherNumber: "",
    vehicleCurrentStatus: "",
    trackingVoucherNumber: "",

    notificationType: "",
    sendNotificationTo: "",
    notificationMessage: "",
    notifyParent: false,
    assignedByMobile: "",

    routesData: {
        pickupDetails: {},
        deliveryDetails: {},
        routeDetails: {},
    },
});

export const mergeTripExpenseForm = (data: any = {}) => {
    const base = createInitialTripExpense();

    return {
        ...base,
        ...data,

        vehicle: {
            ...base.vehicle,
            ...(data?.vehicle || {}),
        },

        driver: {
            ...base.driver,
            ...(data?.driver || {}),
        },

        expenses: {
            advanceReceived: {
                ...base.expenses.advanceReceived,
                ...(data?.expenses?.advanceReceived || {}),
                entries: Array.isArray(data?.expenses?.advanceReceived?.entries)
                    ? data.expenses.advanceReceived.entries
                    : [],
            },

            dieselCost: {
                ...base.expenses.dieselCost,
                ...(data?.expenses?.dieselCost || {}),
                entries: Array.isArray(data?.expenses?.dieselCost?.entries)
                    ? data.expenses.dieselCost.entries
                    : [],
            },

            foodCost: {
                ...base.expenses.foodCost,
                ...(data?.expenses?.foodCost || {}),
                entries: Array.isArray(data?.expenses?.foodCost?.entries)
                    ? data.expenses.foodCost.entries
                    : [],
            },

            runningCost: {
                ...base.expenses.runningCost,
                ...(data?.expenses?.runningCost || {}),
                entries: Array.isArray(data?.expenses?.runningCost?.entries)
                    ? data.expenses.runningCost.entries
                    : [],
            },

            breakdownCost: {
                ...base.expenses.breakdownCost,
                ...(data?.expenses?.breakdownCost || {}),
                entries: Array.isArray(data?.expenses?.breakdownCost?.entries)
                    ? data.expenses.breakdownCost.entries
                    : [],
            },

            otherCost: {
                ...base.expenses.otherCost,
                ...(data?.expenses?.otherCost || {}),
                entries: Array.isArray(data?.expenses?.otherCost?.entries)
                    ? data.expenses.otherCost.entries
                    : [],
            },
        },

        pod: {
            ...base.pod,
            ...(data?.pod || {}),
        },

        summary: {
            ...base.summary,
            ...(data?.summary || {}),
        },

        tripStatus: normalizeTripStatus(data?.tripStatus || base.tripStatus),

        assignedDriverMobile:
            data?.assignedDriverMobile ||
            data?.tripAssignedToMobile ||
            data?.driver?.driverId ||
            "",

        tripAssignedToMobile:
            data?.tripAssignedToMobile ||
            data?.assignedDriverMobile ||
            data?.driver?.driverId ||
            "",

        lrNumber: data?.lrNumber || "",
        lrDate: data?.lrDate || "",

        driverAccepted: toBoolean(data?.driverAccepted),
        acceptedAt: data?.acceptedAt || "",
        allocationVoucherNumber: data?.allocationVoucherNumber || "",
        vehicleCurrentStatus: data?.vehicleCurrentStatus || "",
        trackingVoucherNumber: data?.trackingVoucherNumber || "",

        notificationType: data?.notificationType || "",
        sendNotificationTo: data?.sendNotificationTo || "",
        notificationMessage: data?.notificationMessage || "",
        notifyParent: toBoolean(data?.notifyParent),
        assignedByMobile: data?.assignedByMobile || "",
        completedAt: data?.completedAt || "",

        routesData: {
            ...base.routesData,
            ...(data?.routesData || {}),

            pickupDetails: {
                ...base.routesData.pickupDetails,
                ...(data?.routesData?.pickupDetails || {}),
            },

            deliveryDetails: {
                ...base.routesData.deliveryDetails,
                ...(data?.routesData?.deliveryDetails || {}),
            },

            routeDetails: {
                ...base.routesData.routeDetails,
                ...(data?.routesData?.routeDetails || {}),
            },
        },
    };
};

export const getTripExpenseVoucher = (item: any): string =>
    item?.tripExpenseVoucherNumber ||
    item?.voucherNumber ||
    item?.tripExpenseNumber ||
    "";

export const getAllocationVoucher = (item: any): string =>
    item?.tripNumber ||
    item?.tripAllocationVoucherNumber ||
    item?.voucherNumber ||
    item?.allocationNumber ||
    "";

export const mapTripAllocationToExpenseForm = (allocation: any = {}) => {
    const allocationVoucher = getAllocationVoucher(allocation);

    const tripId =
        allocation?.transportOrder?.transportOrderNumber ||
        allocationVoucher ||
        "";

    const driverMobile =
        allocation?.driverAllocation?.driverId ||
        allocation?.driverAllocation?.mobileNumber ||
        "";

    const driverName =
        allocation?.driverAllocation?.driverName ||
        "";

    return mergeTripExpenseForm({
        tripId,

        tripDate:
            allocation?.allocationDate ||
            allocation?.tripPlan?.plannedStartDateTime ||
            new Date().toISOString(),

        vehicle: {
            vehicleId:
                allocation?.vehicleSelection?.selectedVehicleId ||
                allocation?.vehicleSelection?.voucherNumber ||
                "",
            selectedVehicleId:
                allocation?.vehicleSelection?.selectedVehicleId ||
                allocation?.vehicleSelection?.voucherNumber ||
                "",
            vehicleVoucherNumber:
                allocation?.vehicleSelection?.voucherNumber ||
                allocation?.vehicleSelection?.selectedVehicleId ||
                "",
            voucherNumber:
                allocation?.vehicleSelection?.voucherNumber ||
                allocation?.vehicleSelection?.selectedVehicleId ||
                "",
            vehicleNumber:
                allocation?.vehicleSelection?.vehicleNumber ||
                "",
        },

        driver: {
            driverId: driverMobile,
            driverName,
        },

        assignedDriverMobile: driverMobile,
        tripAssignedToMobile: driverMobile,
        allocationVoucherNumber: allocationVoucher,

        tripStatus: "draft",
        enteredBy: "dispatcher",
        enteredDate: new Date().toISOString(),
        completedAt: "",

        routesData: {
            pickupDetails:
                allocation?.routesData?.pickupDetails ||
                allocation?.pickupDetails ||
                {},
            deliveryDetails:
                allocation?.routesData?.deliveryDetails ||
                allocation?.deliveryDetails ||
                {},
            routeDetails:
                allocation?.routesData?.routeDetails ||
                allocation?.routeDetails ||
                {},
        },
    });
};

export const isTripClosed = (item: any): boolean =>
    normalizeTripStatus(item?.tripStatus) === "completed";

export const isTripPendingAccept = (item: any): boolean => {
    const status = normalizeTripStatus(item?.tripStatus);

    return (
        (status === "pending" || status === "assigned") &&
        !toBoolean(item?.driverAccepted)
    );
};

export const isTripInProgress = (item: any): boolean =>
    normalizeTripStatus(item?.tripStatus) === "in_progress";

export const computeTripExpenseSummary = (form: any) => {
    const advanceTotal = sumAmounts(
        form?.expenses?.advanceReceived?.entries,
    );

    const dieselTotal = sumAmounts(
        form?.expenses?.dieselCost?.entries,
    );

    const foodTotal = sumAmounts(
        form?.expenses?.foodCost?.entries,
    );

    const runningTotal = sumAmounts(
        form?.expenses?.runningCost?.entries,
    );

    const breakdownTotal = sumAmounts(
        form?.expenses?.breakdownCost?.entries,
    );

    const otherTotal = sumAmounts(
        form?.expenses?.otherCost?.entries,
    );

    const totalTripExpense =
        dieselTotal +
        foodTotal +
        runningTotal +
        breakdownTotal +
        otherTotal;

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

export const buildPodPayload = (
    pod: any = {},
    overrides: any = {},
) => {
    const merged = {
        ...pod,
        ...(overrides || {}),
    };

    const delivered =
        String(merged?.deliveryStatus || "").toLowerCase() ===
        "delivered";

    return {
        deliveryStatus:
            merged?.deliveryStatus || "pending",
        receiverName: merged?.receiverName || "",
        receiverMobile: merged?.receiverMobile || "",
        receiverSignature:
            merged?.receiverSignature || "",
        podDocument: merged?.podDocument || "",
        deliveryPhoto: merged?.deliveryPhoto || "",
        remarks: merged?.remarks || "",
        submittedAt:
            merged?.submittedAt ||
            (delivered
                ? new Date().toISOString()
                : ""),
    };
};

export const toTripExpensePayload = (
    form: any,
    overrides: any = {},
) => {
    const merged = {
        ...form,
        ...overrides,
    };

    const {
        totalAdvanceReceived,
        totalTripExpense,
        balanceAmount,
        expenseTotals,
    } = computeTripExpenseSummary(merged);

    const mapEntries = (
        entries: any[],
        mapper: (entry: any) => any,
    ) => (entries || []).map((entry) => mapper(entry));

    return {
        ...merged,

        tripDate:
            merged?.tripDate ||
            new Date().toISOString(),

        enteredDate:
            merged?.enteredDate ||
            new Date().toISOString(),

        completedAt:
            overrides?.completedAt ??
            merged?.completedAt ??
            "",

        driver: {
            ...merged?.driver,

            driverId:
                merged?.driver?.driverId ||
                merged?.assignedDriverMobile ||
                merged?.tripAssignedToMobile ||
                "",

            driverName:
                merged?.driver?.driverName || "",
        },

        expenses: {
            advanceReceived: {
                entries: mapEntries(
                    merged?.expenses?.advanceReceived?.entries,
                    (entry) => ({
                        ...entry,
                        date: normalizeEntryDate(entry),
                        amount: Number(entry?.amount || 0),
                    }),
                ),

                totalAdvance:
                    expenseTotals.totalAdvance,
            },

            dieselCost: {
                entries: mapEntries(
                    merged?.expenses?.dieselCost?.entries,
                    (entry) => ({
                        ...entry,
                        date: normalizeEntryDate(entry),
                        liters: Number(entry?.liters || 0),
                        ratePerLiter: Number(
                            entry?.ratePerLiter || 0,
                        ),
                        amount: Number(entry?.amount || 0),
                        odometerReading: Number(
                            entry?.odometerReading || 0,
                        ),
                    }),
                ),

                totalDieselCost:
                    expenseTotals.totalDieselCost,
            },

            foodCost: {
                entries: mapEntries(
                    merged?.expenses?.foodCost?.entries,
                    (entry) => ({
                        ...entry,
                        date: normalizeEntryDate(entry),
                        amount: Number(entry?.amount || 0),
                    }),
                ),

                totalFoodCost:
                    expenseTotals.totalFoodCost,
            },

            runningCost: {
                entries: mapEntries(
                    merged?.expenses?.runningCost?.entries,
                    (entry) => ({
                        ...entry,
                        date: normalizeEntryDate(entry),
                        amount: Number(entry?.amount || 0),
                    }),
                ),

                totalRunningCost:
                    expenseTotals.totalRunningCost,
            },

            breakdownCost: {
                entries: mapEntries(
                    merged?.expenses?.breakdownCost?.entries,
                    (entry) => ({
                        ...entry,
                        date: normalizeEntryDate(entry),
                        amount: Number(entry?.amount || 0),
                    }),
                ),

                totalBreakdownCost:
                    expenseTotals.totalBreakdownCost,
            },

            otherCost: {
                entries: mapEntries(
                    merged?.expenses?.otherCost?.entries,
                    (entry) => ({
                        ...entry,
                        date: normalizeEntryDate(entry),
                        amount: Number(entry?.amount || 0),
                    }),
                ),

                totalOtherCost:
                    expenseTotals.totalOtherCost,
            },
        },

        summary: {
            totalAdvanceReceived,
            totalTripExpense,
            balanceAmount,
        },

        pod: buildPodPayload(
            merged?.pod,
            overrides?.pod,
        ),

        tripStatus: normalizeTripStatus(
            merged?.tripStatus || "draft",
        ),

        enteredBy:
            merged?.enteredBy || "driver",

        assignedDriverMobile:
            merged?.assignedDriverMobile ||
            merged?.tripAssignedToMobile ||
            merged?.driver?.driverId ||
            "",

        tripAssignedToMobile:
            merged?.tripAssignedToMobile ||
            merged?.assignedDriverMobile ||
            merged?.driver?.driverId ||
            "",

        lrNumber: merged?.lrNumber || "",
        lrDate: merged?.lrDate || "",

        driverAccepted:
            toBoolean(merged?.driverAccepted),

        acceptedAt: merged?.acceptedAt || "",

        allocationVoucherNumber:
            merged?.allocationVoucherNumber || "",

        trackingVoucherNumber:
            merged?.trackingVoucherNumber || "",

        notificationType:
            overrides?.notificationType ||
            merged?.notificationType ||
            "",

        sendNotificationTo:
            overrides?.sendNotificationTo ||
            merged?.sendNotificationTo ||
            "",

        notificationMessage:
            overrides?.notificationMessage ||
            merged?.notificationMessage ||
            "",

        notifyParent:
            overrides?.notifyParent ??
            merged?.notifyParent ??
            false,

        assignedByMobile:
            overrides?.assignedByMobile ||
            merged?.assignedByMobile ||
            "",

        routesData: {
            pickupDetails:
                merged?.routesData?.pickupDetails ||
                {},

            deliveryDetails:
                merged?.routesData?.deliveryDetails ||
                {},

            routeDetails:
                merged?.routesData?.routeDetails ||
                {},
        },
    };
};