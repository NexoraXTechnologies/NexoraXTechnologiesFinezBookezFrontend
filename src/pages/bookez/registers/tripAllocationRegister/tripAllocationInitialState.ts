export type AnyRecord = Record<string, any>;

const getTransportOrderVoucher = (order: AnyRecord = {}) =>
    order?.voucherNumber ||
    order?.transportOrderNumber ||
    order?.transportOrderVoucherNumber ||
    "";

export const getAllocationVoucher = (item: AnyRecord = {}) =>
    item?.voucherNumber ||
    item?.tripAllocationVoucherNumber ||
    item?.tripNumber ||
    item?.allocationNumber ||
    "";

export const createInitialTripAllocation = (): AnyRecord => ({
    allocationDate: new Date().toISOString(),

    transportOrder: {
        transportOrderNumber: "",
        customerCode: "",
        customerName: "",
        source: "",
        destination: "",
        materialName: "",
        loadType: "",
        requiredVehicleType: "",
        requiredCapacityTon: "",
        requiredWeightTon: "",
        expectedFreight: "",
    },

    vehicleSelection: {
        selectedVehicleId: "",
        vehicleNumber: "",
        vehicleType: "",
        vehicleBodyType: "",
        vehicleCapacityTon: "",
        availableCapacityTon: "",
        supportsRequiredWeight: true,
        currentLocation: "",
        availabilityStatus: "Available",
        fitnessValidUpto: "",
        insuranceValidUpto: "",
        rcValidUpto: "",
        permitValidUpto: "",
        ownershipType: "",
        vendorCode: "",
        vendorName: "",
        customerCode: "",
        customerName: "",
        loadType: "FTL",
    },

    driverAllocation: {
        driverId: "",
        driverName: "",
        mobileNumber: "",
        licenseNumber: "",
        licenseExpiryDate: "",
        helperAssigned: false,
        helperName: "",
        helperMobile: "",
    },

    tripPlan: {
        plannedStartDateTime: new Date().toISOString(),
        expectedDeliveryDateTime: new Date().toISOString(),
        routeDistanceKm: "",
        routeType: "",
        estimatedTollAmount: "",
        estimatedDieselExpense: "",
        estimatedFoodExpense: "",
        estimatedOtherExpense: "",
    },

    documentsAssigned: {
        invoiceAttached: true,
        ewayBillAttached: true,
        deliveryChallanAttached: true,
        insuranceCopyAttached: true,
    },

    trackingConfig: {
        gpsTrackingEnabled: true,
        podRequired: true,
        liveLocationSharing: true,
    },

    remarks: "",
    tripStatus: "pending",

    statusHistory: [
        {
            status: "pending",
            updatedOn: new Date().toISOString(),
            updatedBy: "dispatcher",
        },
    ],

    routesData: {
        pickupDetails: {},
        deliveryDetails: {},
        routeDetails: {},
    },
});

export const normalizeAllocationStatus = (status: any): string => {
    const raw = String(status || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (raw === "complete" || raw === "completed") return "completed";
    if (raw === "cancelled" || raw === "canceled") return "cancelled";
    return raw || "pending";
};

export const isAllocationClosed = (item: AnyRecord = {}) =>
    normalizeAllocationStatus(item?.tripStatus || item?.status) === "completed";

export const isAllocationEditable = (item: AnyRecord = {}) =>
    !isAllocationClosed(item);

const toBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const key = value.trim().toLowerCase();
        if (key === "true") return true;
        if (key === "false") return false;
    }
    return Boolean(value);
};

export const mergeTripAllocationForm = (data: AnyRecord = {}): AnyRecord => {
    const base = createInitialTripAllocation();

    return {
        ...base,
        ...data,
        transportOrder: {
            ...base.transportOrder,
            ...(data.transportOrder || {}),
        },
        vehicleSelection: {
            ...base.vehicleSelection,
            ...(data.vehicleSelection || {}),
            supportsRequiredWeight: toBoolean(
                data.vehicleSelection?.supportsRequiredWeight ??
                base.vehicleSelection.supportsRequiredWeight,
            ),
        },
        driverAllocation: {
            ...base.driverAllocation,
            ...(data.driverAllocation || {}),
            helperAssigned: toBoolean(
                data.driverAllocation?.helperAssigned ??
                base.driverAllocation.helperAssigned,
            ),
        },
        tripPlan: {
            ...base.tripPlan,
            ...(data.tripPlan || {}),
        },
        documentsAssigned: {
            ...base.documentsAssigned,
            ...(data.documentsAssigned || {}),
        },
        trackingConfig: {
            ...base.trackingConfig,
            ...(data.trackingConfig || {}),
        },
        routesData: {
            pickupDetails: {
                ...base.routesData.pickupDetails,
                ...(data.routesData?.pickupDetails || data.pickupDetails || {}),
            },
            deliveryDetails: {
                ...base.routesData.deliveryDetails,
                ...(data.routesData?.deliveryDetails || data.deliveryDetails || {}),
            },
            routeDetails: {
                ...base.routesData.routeDetails,
                ...(data.routesData?.routeDetails || data.routeDetails || {}),
            },
        },
        statusHistory: Array.isArray(data.statusHistory)
            ? data.statusHistory
            : base.statusHistory,
    };
};

export const buildRoutesDataFromTransportOrder = (
    order: AnyRecord = {},
): AnyRecord => ({
    pickupDetails: order?.pickupDetails || {},
    deliveryDetails: order?.deliveryDetails || {},
    routeDetails: order?.routeDetails || {},
});

export const mapTransportOrderToAllocation = (
    order: AnyRecord = {},
): AnyRecord => ({
    transportOrderNumber: getTransportOrderVoucher(order),
    customerCode:
        order?.customerDetails?.customerCode || order?.customerCode || "",
    customerName:
        order?.customerDetails?.customerName || order?.customerName || "",
    source: order?.pickupDetails?.pickupLocation || order?.pickupLocation || "",
    destination:
        order?.deliveryDetails?.deliveryLocation || order?.deliveryLocation || "",
    materialName: order?.loadDetails?.materialName || order?.materialName || "",
    loadType: order?.loadDetails?.loadType || order?.loadType || "",
    requiredVehicleType: order?.vehicleRequirement?.vehicleType || "",
    requiredCapacityTon: order?.vehicleRequirement?.vehicleCapacity || "",
    requiredWeightTon: order?.loadDetails?.weight || "",
    expectedFreight: order?.freightDetails?.expectedFreight || "",
});

export const toTripAllocationPayload = (form: AnyRecord): AnyRecord => ({
    ...form,
    routesData:
        form.routesData || buildRoutesDataFromTransportOrder(form.transportOrder),
    allocationDate: form.allocationDate || new Date().toISOString(),
    transportOrder: {
        ...form.transportOrder,
        requiredCapacityTon: Number(form.transportOrder?.requiredCapacityTon || 0),
        requiredWeightTon: Number(form.transportOrder?.requiredWeightTon || 0),
        expectedFreight: Number(form.transportOrder?.expectedFreight || 0),
    },
    vehicleSelection: {
        ...form.vehicleSelection,
        vehicleCapacityTon: Number(form.vehicleSelection?.vehicleCapacityTon || 0),
        availableCapacityTon: Number(
            form.vehicleSelection?.availableCapacityTon || 0,
        ),
        supportsRequiredWeight: Boolean(
            form.vehicleSelection?.supportsRequiredWeight,
        ),
        ownershipType: String(form.vehicleSelection?.ownershipType || "")
            .trim()
            .toLowerCase(),
        vendorCode: form.vehicleSelection?.vendorCode || "",
        vendorName: form.vehicleSelection?.vendorName || "",
        customerCode:
            form.vehicleSelection?.customerCode ||
            form.transportOrder?.customerCode ||
            "",
        customerName:
            form.vehicleSelection?.customerName ||
            form.transportOrder?.customerName ||
            "",
    },
    driverAllocation: {
        ...form.driverAllocation,
        helperAssigned: Boolean(form.driverAllocation?.helperName),
    },
    tripPlan: {
        ...form.tripPlan,
        routeDistanceKm: Number(form.tripPlan?.routeDistanceKm || 0),
        estimatedTollAmount: Number(form.tripPlan?.estimatedTollAmount || 0),
        estimatedDieselExpense: Number(form.tripPlan?.estimatedDieselExpense || 0),
        estimatedFoodExpense: Number(form.tripPlan?.estimatedFoodExpense || 0),
        estimatedOtherExpense: Number(form.tripPlan?.estimatedOtherExpense || 0),
    },
    tripStatus: form.tripStatus || "pending",
    statusHistory:
        form.statusHistory?.length > 0
            ? form.statusHistory
            : [
                {
                    status: form.tripStatus || "pending",
                    updatedOn: new Date().toISOString(),
                    updatedBy: "dispatcher",
                },
            ],
});