import {
	formatDateTimeForInput,
	formatDateForInput,
} from "../../../../utils/helperFunctions";

export const getTransportOrderVoucher = (order: any) =>
	order?.voucherNumber ||
	order?.transportOrderNumber ||
	order?.transportOrderVoucherNumber ||
	"";

export const todayDateTime = () => {
	const now = new Date();
	now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
	return now.toISOString().slice(0, 16);
};

export const createInitialTripAllocation = () => ({
	allocationDate: todayDateTime(),

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
		plannedStartDateTime: todayDateTime(),
		expectedDeliveryDateTime: todayDateTime(),
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
});

export const isAllocationClosed = (item: any) =>
	String(item?.tripStatus || "").toLowerCase() === "completed";

export const isAllocationEditable = (item: any) => !isAllocationClosed(item);

export const mergeTripAllocationForm = (data: any = {}) => {
	const base = createInitialTripAllocation();

	return {
		...base,
		...data,

		allocationDate: formatDateTimeForInput(data?.allocationDate),

		transportOrder: {
			...base.transportOrder,
			...(data?.transportOrder || {}),
		},

		vehicleSelection: {
			...base.vehicleSelection,
			...(data?.vehicleSelection || {}),
			fitnessValidUpto: formatDateForInput(
				data?.vehicleSelection?.fitnessValidUpto
			),
			insuranceValidUpto: formatDateForInput(
				data?.vehicleSelection?.insuranceValidUpto
			),
			rcValidUpto: formatDateForInput(data?.vehicleSelection?.rcValidUpto),
			permitValidUpto: formatDateForInput(
				data?.vehicleSelection?.permitValidUpto
			),
			supportsRequiredWeight:
				data?.vehicleSelection?.supportsRequiredWeight === true ||
				data?.vehicleSelection?.supportsRequiredWeight === "true",
		},

		driverAllocation: {
			...base.driverAllocation,
			...(data?.driverAllocation || {}),
			helperAssigned:
				data?.driverAllocation?.helperAssigned === true ||
				data?.driverAllocation?.helperAssigned === "true",
			licenseExpiryDate: formatDateForInput(
				data?.driverAllocation?.licenseExpiryDate
			),
		},

		tripPlan: {
			...base.tripPlan,
			...(data?.tripPlan || {}),
			plannedStartDateTime: formatDateTimeForInput(
				data?.tripPlan?.plannedStartDateTime
			),
			expectedDeliveryDateTime: formatDateTimeForInput(
				data?.tripPlan?.expectedDeliveryDateTime
			),
		},

		documentsAssigned: {
			...base.documentsAssigned,
			...(data?.documentsAssigned || {}),
		},

		trackingConfig: {
			...base.trackingConfig,
			...(data?.trackingConfig || {}),
		},

		statusHistory: Array.isArray(data?.statusHistory)
			? data.statusHistory
			: base.statusHistory,
	};
};

export const mapTransportOrderToAllocation = (order: any) => ({
	transportOrderNumber: getTransportOrderVoucher(order),
	customerCode: order?.customerDetails?.customerCode || order?.customerCode || "",
	customerName:
		order?.customerDetails?.customerName || order?.customerName || "",
	source:
		order?.pickupDetails?.pickupLocation ||
		order?.pickupDetails?.pickupCityName ||
		order?.pickupLocation ||
		"",
	destination:
		order?.deliveryDetails?.deliveryLocation ||
		order?.deliveryDetails?.deliveryCityName ||
		order?.deliveryLocation ||
		"",
	materialName: order?.loadDetails?.materialName || order?.materialName || "",
	loadType: order?.loadDetails?.loadType || order?.loadType || "",
	requiredVehicleType: order?.vehicleRequirement?.vehicleType || "",
	requiredCapacityTon:
		order?.vehicleRequirement?.vehicleCapacity ||
		order?.vehicleRequirement?.vehicleCapacityTon ||
		"",
	requiredWeightTon: order?.loadDetails?.weight || "",
	expectedFreight: order?.freightDetails?.expectedFreight || "",
});

export const toTripAllocationPayload = (form: any) => ({
	...form,

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
			form.vehicleSelection?.availableCapacityTon || 0
		),
		supportsRequiredWeight: !!form.vehicleSelection?.supportsRequiredWeight,
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



export const selectClassNames = {
        control: ({ isFocused, isDisabled }: any) =>
            `!min-h-10 !rounded-md !border !shadow-none ${isFocused
                ? "!border-primary !ring-1 !ring-primary"
                : "!border-border"
            } ${isDisabled
                ? "!bg-muted !text-muted-foreground"
                : "!bg-card !text-foreground"
            }`,
        valueContainer: () => "!px-3 !py-0",
        singleValue: () => "!text-foreground",
        input: () => "!text-foreground",
        placeholder: () => "!text-muted-foreground",
        indicatorsContainer: () => "!text-muted-foreground",
        dropdownIndicator: () => "!text-muted-foreground hover:!text-foreground",
        indicatorSeparator: () => "!bg-border",
        menu: () => "!z-50 !border !border-border !bg-popover !text-popover-foreground !shadow-md",
        menuList: () => "!bg-popover !p-1",
        option: ({ isFocused, isSelected }: any) =>
            `!cursor-pointer !rounded-sm ${isSelected
                ? "!bg-primary !text-primary-foreground"
                : isFocused
                    ? "!bg-muted !text-foreground"
                    : "!bg-popover !text-popover-foreground"
            }`,
        noOptionsMessage: () => "!text-muted-foreground",
    };




export const selectThemeStyles = {
    control: (base: any, state: any) => ({
        ...base,
        backgroundColor: "var(--background)",
        borderColor: state.isFocused ? "var(--primary)" : "var(--border)",
        boxShadow: state.isFocused ? "0 0 0 1px var(--primary)" : "none",
        "&:hover": {
            borderColor: "var(--primary)",
        },
    }),
    menu: (base: any) => ({
        ...base,
        zIndex: 9999,
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        overflow: "hidden",
    }),
    menuList: (base: any) => ({
        ...base,
        backgroundColor: "var(--card)",
        padding: "4px",
    }),
    option: (base: any, state: any) => ({
        ...base,
        cursor: "pointer",
        backgroundColor: state.isSelected
            ? "var(--primary)"
            : state.isFocused
                ? "var(--muted)"
                : "var(--card)",
        color: state.isSelected
            ? "var(--primary-foreground)"
            : "var(--card-foreground)",
        "&:active": {
            backgroundColor: "var(--muted)",
        },
    }),
    singleValue: (base: any) => ({
        ...base,
        color: "var(--foreground)",
    }),
    input: (base: any) => ({
        ...base,
        color: "var(--foreground)",
    }),
    placeholder: (base: any) => ({
        ...base,
        color: "var(--muted-foreground)",
    }),
    dropdownIndicator: (base: any) => ({
        ...base,
        color: "var(--muted-foreground)",
        "&:hover": {
            color: "var(--primary)",
        },
    }),
    clearIndicator: (base: any) => ({
        ...base,
        color: "var(--muted-foreground)",
        "&:hover": {
            color: "var(--danger)",
        },
    }),
    indicatorSeparator: (base: any) => ({
        ...base,
        backgroundColor: "var(--border)",
    }),
};