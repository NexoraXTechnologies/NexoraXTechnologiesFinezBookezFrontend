import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    MapPinned,
    RefreshCcw,
    Search,
    Truck,
    UserRound,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Select from "react-select";

import { FormSectionCard } from "../../../../components/SectionCards";
import { renderField } from "../../../../components/inputs";

import {
    getTransportOrders,
    getTransportOrderByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";

import {
    createTripAllocation,
    getActiveTripAllocations,
    getAvailableDrivers,
    getChildUserByMobile,
    getTripAllocationByVoucherNumber,
    getVehicleMasterVehicles,
    updateTripAllocationByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";

import {
    createInitialTripAllocation,
    getTransportOrderVoucher,
    isAllocationClosed,
    mapTransportOrderToAllocation,
    mergeTripAllocationForm,
    toTripAllocationPayload,
} from "./tripAllocationInitialState";

import {
    formatDateForInput,
    formatDateTimeForInput,
    truncate,
} from "../../../../utils/helperFunctions";

import { getProfessionalUsers } from "../../../../redux/slices/professionalSlice/professionalUserSlice";

import {
    mapTripAllocationToExpenseForm,
    toTripExpensePayload,
} from "../tripExpense/tripExpenseInitialState";
import truckImage from "../../../../assets/truck.png";
import { sendWhatsAppMessage } from "../../../../redux/slices/professionalSlice/transportation/whatsappSlice";
const REMARKS_MAX = 200;

const routeTypeOptions = [
    { label: "National Highway", value: "National Highway" },
    { label: "State Highway", value: "State Highway" },
    { label: "City Route", value: "City Route" },
    { label: "Mixed Route", value: "Mixed Route" },
];

const getSavedAllocationRecord = (response: any, fallback: any = {}) => {
    return (
        response?.data?.record ||
        response?.data ||
        response?.record ||
        response ||
        fallback
    );
};

const getAllocationVoucherFromSaved = (record: any, fallback = "") => {
    return String(
        record?.tripAllocationVoucherNumber ||
        record?.tripNumber ||
        record?.voucherNumber ||
        record?.allocationNumber ||
        fallback ||
        ""
    ).trim();
};


const getLoginUser = () => {
    try {
        return JSON.parse(localStorage.getItem("loginuser") || "{}");
    } catch {
        return {};
    }
};

const getFullName = (user: any) =>
    [
        user?.userFirstName,
        user?.userMiddleName,
        user?.userLastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

const isAssignedStatus = (value: any) =>
    String(value || "").trim().toLowerCase() === "assigned";

const parseNumber = (value: any) => {
    if (value === null || value === undefined) return 0;

    const cleaned = String(value)
        .replace(/,/g, "")
        .replace(/[^\d.]/g, "")
        .trim();

    const number = Number(cleaned);

    return Number.isFinite(number) ? number : 0;
};

const normalizeOwnershipKey = (value: any) =>
    String(value || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

const getStatusKey = (value: any) =>
    String(value || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

const isAvailableVehicleStatus = (value: any) => {
    const key = getStatusKey(value);
    return !key || key === "available" || key === "active";
};

const getVehicleStatusClasses = (status: any) => {
    const key = getStatusKey(status);

    if (key === "available" || key === "active") {
        return "bg-success/10 text-success";
    }

    if (
        key === "assigned" ||
        key === "allocated" ||
        key === "pending"
    ) {
        return "bg-amber-50 text-amber-700";
    }

    if (
        key === "intransit" ||
        key === "onway" ||
        key === "loading" ||
        key === "unloading"
    ) {
        return "bg-danger/10 text-danger";
    }

    return "bg-muted text-muted-foreground";
};

const vehicleTypeMatch = (left: any, right: any) => {
    const a = String(left || "")
        .toLowerCase()
        .replace(/[\s_-]+/g, "")
        .trim();

    const b = String(right || "")
        .toLowerCase()
        .replace(/[\s_-]+/g, "")
        .trim();

    if (!a || !b) return true;

    return a === b || a.includes(b) || b.includes(a);
};

const normalizeDriverUsers = (users: any[] = []) => {
    return (Array.isArray(users) ? users : [])
        .map((user: any) => {
            const customFields = user?.childUserCustomFields || {};
            const mobileNumber = String(user?.userMobileNumberHash || "");
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

/**
 * NOTE ON STATUS/OWNERSHIP FIELDS:
 * Vehicles coming from tripAllocationSlice's getVehicleMasterVehicles are
 * ALREADY mapped by mapVehicleMasterRecord() into a normalized shape where
 * the live status lives at `availabilityStatus` (NOT `current_status` --
 * that key only survives inside `rawRecord`). Same story for ownership: it
 * is not mapped at all upstream, so we fall back through several possible
 * raw key names AND the (currently absent) mapped key, so this keeps
 * working whether the vehicle object is the raw custom-master record or the
 * already-mapped Redux vehicle object.
 */
const normalizeVehicle = (vehicle: any = {}) => {
    const selectedVehicleId =
        vehicle?.selectedVehicleId ||
        vehicle?.voucherNumber ||
        vehicle?.vehicleId ||
        vehicle?._id ||
        vehicle?.code ||
        vehicle?.vehicleCode ||
        vehicle?.vehicle_number ||
        vehicle?.vehicleNumber ||
        "";

    const vehicleOwnership =
        vehicle?.vehicleOwnership ||
        vehicle?.ownership ||
        vehicle?.ownershipType ||
        vehicle?.ownership_type ||
        vehicle?.owner_type ||
        vehicle?.vehicle_ownership ||
        vehicle?.rawRecord?.ownership_type ||
        "";

    const vehicleNumber =
        vehicle?.vehicleNumber ||
        vehicle?.vehicle_number ||
        vehicle?.registrationNumber ||
        vehicle?.code ||
        "";

    const vehicleType =
        vehicle?.vehicleType ||
        vehicle?.vehicle_type ||
        vehicle?.type ||
        "";

    const vehicleCapacityTon =
        parseNumber(vehicle?.vehicleCapacityTon) ||
        parseNumber(vehicle?.capacity) ||
        parseNumber(vehicle?.vehicle_capacity) ||
        0;

    const availableCapacityTon =
        parseNumber(vehicle?.availableCapacityTon) ||
        vehicleCapacityTon ||
        0;

    const availabilityStatus =
        vehicle?.current_status ||
        vehicle?.currentStatus ||
        vehicle?.availability_status ||
        vehicle?.availabilityStatus ||
        vehicle?.rawRecord?.current_status ||
        "Available";


    const linkedDriver =
        vehicle?.customemployeemaster ||
        vehicle?.customEmployeeMaster ||
        vehicle?.driver ||
        vehicle?.rawRecord?.customemployeemaster ||
        vehicle?.rawRecord?.customEmployeeMaster ||
        null;

    return {
        ...vehicle,

        selectedVehicleId,
        vehicleNumber,
        vehicleType,

        vehicleCapacityTon,
        availableCapacityTon,

        currentLocation:
            vehicle?.currentLocation ||
            vehicle?.current_location ||
            vehicle?.location ||
            vehicle?.rawRecord?.location ||
            "",

        availabilityStatus,
        vehicleOwnership,

        vehicleBodyType:
            vehicle?.vehicleBodyType ||
            vehicle?.body_type ||
            vehicle?.bodyType ||
            "",

        loadType:
            vehicle?.loadType ||
            vehicle?.load_type ||
            vehicle?.body_type ||
            vehicle?.bodyType ||
            "FTL",

        vehicleVoucherNumber:
            vehicle?.vehicleVoucherNumber ||
            vehicle?.voucherNumber ||
            "",

        make: vehicle?.make || "",
        model: vehicle?.model || "",
        fuelType: vehicle?.fuel_type || vehicle?.fuelType || "",
        chassisNumber: vehicle?.chasis_number || vehicle?.chassisNumber || "",
        engineNumber: vehicle?.engine_number || vehicle?.engineNumber || "",

        // Linked driver from Vehicle Master
        linkedDriver,

        linkedDriverId: String(
            linkedDriver?.userMobileNumberHash ||
            linkedDriver?.mobileNumberHash ||
            linkedDriver?.userMobileNumber ||
            ""
        ).trim(),

        linkedDriverName: [
            linkedDriver?.userFirstName,
            linkedDriver?.userMiddleName,
            linkedDriver?.userLastName,
        ]
            .filter(Boolean)
            .join(" ")
            .trim(),
    };
};

const buildAllocatedOrderSet = (allocations: any[] = []) => {
    const set = new Set();

    for (const item of Array.isArray(allocations) ? allocations : []) {
        const status = String(item?.tripStatus || "").toLowerCase();

        if (status === "completed" || status === "cancelled") continue;

        const orderNumber = String(
            item?.transportOrder?.transportOrderNumber || ""
        ).trim();

        if (orderNumber) set.add(orderNumber);
    }

    return set;
};

const buildDriverAssignmentMap = (allocations: any[] = []) => {
    const map: any = {};

    for (const item of Array.isArray(allocations) ? allocations : []) {
        const status = String(item?.tripStatus || "").toLowerCase();

        if (status === "completed" || status === "cancelled") continue;

        const driverId = String(item?.driverAllocation?.driverId || "").trim();

        if (!driverId) continue;

        map[driverId] = {
            allocationVoucher:
                item?.tripAllocationVoucherNumber ||
                item?.tripNumber ||
                item?.voucherNumber ||
                "",
            driverName: item?.driverAllocation?.driverName || "",
            tripStatus: item?.tripStatus || "",
        };
    }

    return map;
};

const getRequiredCapacity = (transportOrder: any = {}) => {
    const requiredCapacity = parseNumber(transportOrder?.requiredCapacityTon);
    const requiredWeight = parseNumber(transportOrder?.requiredWeightTon);

    if (requiredCapacity > 0) return requiredCapacity;
    if (requiredWeight > 0) return requiredWeight;

    return 0;
};

const getRequiredVehicleType = (transportOrder: any = {}) => {
    return String(
        transportOrder?.requiredVehicleType ||
        transportOrder?.vehicleType ||
        transportOrder?.vehicle_type ||
        ""
    ).trim();
};

const filterVehicles = ({
    vehicles,
    transportOrder,
    vehicleTypeFilter,
    vehicleOwnershipFilter,
    capacityFilter,
    locationFilter,
}: any) => {
    const requiredCapacity = getRequiredCapacity(transportOrder);
    const selectedCapacity = parseNumber(capacityFilter);
    const minimumCapacity = selectedCapacity > 0 ? selectedCapacity : requiredCapacity;

    return (vehicles || [])
        .map(normalizeVehicle)
        .filter((vehicle: any) => {
            // Only ever show vehicles whose current status is Available/Active
            if (!isAvailableVehicleStatus(vehicle?.availabilityStatus)) {
                return false;
            }

            if (
                minimumCapacity > 0 &&
                parseNumber(vehicle?.availableCapacityTon) < minimumCapacity
            ) {
                return false;
            }

            if (
                vehicleTypeFilter &&
                !vehicleTypeMatch(vehicle?.vehicleType, vehicleTypeFilter)
            ) {
                return false;
            }

            if (
                vehicleOwnershipFilter &&
                normalizeOwnershipKey(vehicle?.vehicleOwnership) !==
                normalizeOwnershipKey(vehicleOwnershipFilter)
            ) {
                return false;
            }

            if (
                locationFilter &&
                String(vehicle?.currentLocation || "").trim().toLowerCase() !==
                String(locationFilter || "").trim().toLowerCase()
            ) {
                return false;
            }

            return Boolean(vehicle?.vehicleNumber || vehicle?.selectedVehicleId);
        });
};

const pickBestVehicle = (args: any) => {
    const filtered = filterVehicles(args);

    if (!filtered.length) return null;

    const availableVehicles = filtered.filter((vehicle: any) =>
        isAvailableVehicleStatus(vehicle?.availabilityStatus)
    );

    const source = availableVehicles.length ? availableVehicles : filtered;

    return [...source].sort(
        (a: any, b: any) =>
            parseNumber(a?.availableCapacityTon) -
            parseNumber(b?.availableCapacityTon)
    )[0];
};

const CreateTripAllocation = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const voucherNumber =
        params?.voucherNumber ||
        params?.tripAllocationNumber ||
        location.state?.voucherNumber ||
        location.state?.tripAllocationNumber ||
        "";

    const isEdit = location.state?.mode === "edit" || Boolean(voucherNumber);

    const { transportOrders = [] } = useSelector(
        (state: any) => state.transportOrder
    );

    const {
        createLoader = false,
        updateLoader = false,
        detailLoader = false,
        driversLoader = false,
        vehiclesLoader = false,
        activeAllocations = [],
        vehicles = [],
    } = useSelector((state: any) => state.tripAllocation || {});

    const { users = [] } = useSelector((s: any) => s.professionalUser || {});

    const [form, setForm] = useState<any>(createInitialTripAllocation());
    const [pageLoading, setPageLoading] = useState(false);

    const [vehicleOwnershipFilter, setVehicleOwnershipFilter] = useState("");
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
    const [capacityFilter, setCapacityFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [vehicleSearch, setVehicleSearch] = useState("");
    const [showDocuments, setShowDocuments] = useState(false);
    const [showAssignConfirm, setShowAssignConfirm] = useState(false);

    const loading =
        pageLoading ||
        createLoader ||
        updateLoader ||
        detailLoader ||
        driversLoader ||
        vehiclesLoader;

    const pageTitle =
        location.state?.title ||
        (isEdit ? "Edit Trip Allocation" : "Create Trip Allocation");

    const pageDescription =
        location.state?.description ||
        "Assign vehicle, driver, route, and trip details for a transport order.";

    const driverUsers = useMemo(() => {
        const list = Array.isArray(users)
            ? users.flatMap((item: any) => {
                if (Array.isArray(item?.ChildUsers)) return item.ChildUsers;
                return item;
            })
            : [];

        return normalizeDriverUsers(list);
    }, [users]);

    const allocatedOrderSet = useMemo(
        () => buildAllocatedOrderSet(activeAllocations),
        [activeAllocations]
    );

    const driverAssignmentMap = useMemo(
        () => buildDriverAssignmentMap(activeAllocations),
        [activeAllocations]
    );

    const normalizedVehicles = useMemo(
        () => (vehicles || []).map(normalizeVehicle),
        [vehicles]
    );

    const filteredVehicles = useMemo(
        () =>
            filterVehicles({
                vehicles: normalizedVehicles,
                transportOrder: form.transportOrder,
                vehicleOwnershipFilter,
                vehicleTypeFilter,
                capacityFilter,
                locationFilter,
            }),
        [
            normalizedVehicles,
            form.transportOrder,
            vehicleTypeFilter,
            vehicleOwnershipFilter,
            capacityFilter,
            locationFilter,
        ]
    );

    const searchedVehicles = useMemo(() => {
        const search = String(vehicleSearch || "").trim().toLowerCase();

        if (!search) return filteredVehicles;

        return filteredVehicles.filter((vehicle: any) => {
            const text = [
                vehicle?.vehicleNumber,
                vehicle?.vehicle_number,
                vehicle?.code,
                vehicle?.name,
                vehicle?.vehicleType,
                vehicle?.vehicle_type,
                vehicle?.availabilityStatus,
                vehicle?.current_status,
                vehicle?.make,
                vehicle?.model,
                vehicle?.fuelType,
                vehicle?.fuel_type,
                vehicle?.currentLocation,
                vehicle?.location,
                vehicle?.vehicleCapacityTon,
                vehicle?.availableCapacityTon,
                vehicle?.capacity,
                vehicle?.vehicleBodyType,
                vehicle?.body_type,
                vehicle?.loadType,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });
    }, [filteredVehicles, vehicleSearch]);


    const transportOrderOptions = useMemo(
        () =>
            (transportOrders || [])
                .filter((order: any) => {
                    const voucher = getTransportOrderVoucher(order);

                    if (!voucher) return false;

                    if (
                        isEdit &&
                        voucher === form.transportOrder?.transportOrderNumber
                    ) {
                        return true;
                    }

                    return !allocatedOrderSet.has(voucher);
                })
                .map((order: any) => ({
                    label: `${getTransportOrderVoucher(order)} - ${truncate(
                        order?.customerDetails?.customerName || "-",
                        20
                    )} (${truncate(
                        order?.pickupDetails?.pickupLocation || "-",
                        15
                    )} → ${truncate(
                        order?.deliveryDetails?.deliveryLocation || "-",
                        15
                    )})`,
                    value: getTransportOrderVoucher(order),
                })),
        [
            transportOrders,
            allocatedOrderSet,
            isEdit,
            form.transportOrder?.transportOrderNumber,
        ]
    );

    const driverOptions = useMemo(
        () =>
            (driverUsers || []).map((driver: any) => {
                const assignment = driverAssignmentMap[driver.driverId];

                const isAssignedElsewhere =
                    assignment &&
                    (!isEdit || assignment.allocationVoucher !== voucherNumber);

                return {
                    label: isAssignedElsewhere
                        ? `${driver.driverName} - Assigned (${assignment.allocationVoucher})`
                        : `${driver.driverName} `,
                    value: driver.driverId,
                    isDisabled: Boolean(isAssignedElsewhere),
                    driver,
                };
            }),
        [driverUsers, driverAssignmentMap, isEdit, voucherNumber]
    );

    const helperOptions = useMemo(
        () =>
            (driverUsers || [])
                .filter(
                    (driver: any) =>
                        driver.driverName &&
                        driver.driverId !== form.driverAllocation?.driverId
                )
                .map((driver: any) => ({
                    label: `${driver.driverName}`,
                    value: driver.driverId,
                    driver,
                })),
        [driverUsers, form.driverAllocation?.driverId]
    );

    const vehicleOwnershipOptions = [
        { label: "All Vehicles", value: "" },
        { label: "Own Fleet", value: "own" },
        { label: "Market Vehicle", value: "market" },
    ];

    const vehicleTypeOptions = useMemo(() => {
        const set = new Set<string>();

        normalizedVehicles.forEach((vehicle: any) => {
            const value = String(vehicle?.vehicleType || "").trim();
            if (value) set.add(value);
        });

        if (vehicleTypeFilter) set.add(vehicleTypeFilter);
        if (form.transportOrder?.requiredVehicleType) {
            set.add(form.transportOrder.requiredVehicleType);
        }



        return [
            { label: "All Types", value: "" },
            ...[...set].map((value) => ({ label: value, value })),
        ];
    }, [normalizedVehicles, vehicleTypeFilter, form.transportOrder?.requiredVehicleType]);

    const capacityOptions = useMemo(() => {
        const requiredCapacity = getRequiredCapacity(form.transportOrder);
        const set = new Set<string>();

        normalizedVehicles.forEach((vehicle: any) => {
            const value = parseNumber(vehicle?.availableCapacityTon);
            if (value) set.add(String(value));
        });

        if (capacityFilter) set.add(String(capacityFilter));
        if (requiredCapacity) set.add(String(requiredCapacity));

        return [
            ...[...set]
                .sort((a, b) => Number(a) - Number(b))
                .map((value) => ({
                    label: `Min ${value} Ton`,
                    value,
                })),
        ];
    }, [normalizedVehicles, capacityFilter, form.transportOrder]);

    const locationOptions = useMemo(() => {
        const set = new Set<string>();

        normalizedVehicles.forEach((vehicle: any) => {
            const value = String(vehicle?.currentLocation || "").trim();
            if (value) set.add(value);
        });

        if (locationFilter) set.add(locationFilter);

        return [
            { label: "All Locations", value: "" },
            ...[...set].map((value) => ({ label: value, value })),
        ];
    }, [normalizedVehicles, locationFilter]);

    const selectedOrderOption =
        transportOrderOptions.find(
            (item: any) => item.value === form.transportOrder?.transportOrderNumber
        ) ||
        (form.transportOrder?.transportOrderNumber
            ? {
                label: `${form.transportOrder.transportOrderNumber} - ${form.transportOrder.customerName || form.transportOrder.customerDetails?.customerName || "-"
                    } (${form.transportOrder.pickupLocation ||
                    form.transportOrder.pickupDetails?.pickupLocation ||
                    "-"
                    } → ${form.transportOrder.deliveryLocation ||
                    form.transportOrder.deliveryDetails?.deliveryLocation ||
                    "-"
                    })`,
                value: form.transportOrder.transportOrderNumber,
            }
            : null);

    const selectedDriverOption =
        driverOptions.find(
            (item: any) => item.value === form.driverAllocation?.driverId
        ) || null;

    const selectedHelperOption =
        helperOptions.find(
            (item: any) => item.value === form.driverAllocation?.helperId
        ) || null;

    const transportOrderSelected = Boolean(
        form.transportOrder?.transportOrderNumber
    );

    const selectedVehicle = Boolean(form.vehicleSelection?.selectedVehicleId);

    const documentsCount = Object.values(form.documentsAssigned || {}).filter(
        Boolean
    ).length;

    const update = (section: string, key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [section]: { ...prev[section], [key]: value },
        }));
    };

    const updateRoot = (key: string, value: any) => {
        setForm((prev: any) => ({ ...prev, [key]: value }));
    };

    const updateField = (key: string, value: any) => {
        if (key.startsWith("tripPlan.")) {
            update("tripPlan", key.replace("tripPlan.", ""), value);
            return;
        }

        if (key.startsWith("documentsAssigned.")) {
            update("documentsAssigned", key.replace("documentsAssigned.", ""), value);
            return;
        }

        if (key.startsWith("trackingConfig.")) {
            update("trackingConfig", key.replace("trackingConfig.", ""), value);
            return;
        }

        updateRoot(key, value);
    };

    const handleInputChange = (key: string) => (e: any) => {
        const value =
            e?.target?.type === "checkbox"
                ? e?.target?.checked
                : e?.target?.value ?? "";

        updateField(key, value);
    };

    const handleSelectChange = (key: string) => (e: any) => {
        updateField(key, e?.target?.value ?? "");
    };

    const fieldForm = {
        "tripPlan.plannedStartDateTime": formatDateTimeForInput(
            form.tripPlan?.plannedStartDateTime
        ),
        "tripPlan.expectedDeliveryDateTime": formatDateTimeForInput(
            form.tripPlan?.expectedDeliveryDateTime
        ),
        "tripPlan.routeDistanceKm": form.tripPlan?.routeDistanceKm || "",
        "tripPlan.routeType": form.tripPlan?.routeType || "",
        "tripPlan.estimatedTollAmount": form.tripPlan?.estimatedTollAmount || "",
        "tripPlan.estimatedDieselExpense":
            form.tripPlan?.estimatedDieselExpense || "",
        "tripPlan.estimatedFoodExpense": form.tripPlan?.estimatedFoodExpense || "",
        "tripPlan.estimatedOtherExpense":
            form.tripPlan?.estimatedOtherExpense || "",

        "documentsAssigned.invoiceAttached":
            form.documentsAssigned?.invoiceAttached || false,
        "documentsAssigned.ewayBillAttached":
            form.documentsAssigned?.ewayBillAttached || false,
        "documentsAssigned.deliveryChallanAttached":
            form.documentsAssigned?.deliveryChallanAttached || false,
        "documentsAssigned.insuranceCopyAttached":
            form.documentsAssigned?.insuranceCopyAttached || false,

        "trackingConfig.gpsTrackingEnabled":
            form.trackingConfig?.gpsTrackingEnabled || false,
        "trackingConfig.podRequired": form.trackingConfig?.podRequired || false,
        "trackingConfig.liveLocationSharing":
            form.trackingConfig?.liveLocationSharing || false,

        tripStatus: form.tripStatus || "pending",
    };

    const tripPlanFields = [
        {
            key: "tripPlan.plannedStartDateTime",
            label: "Planned Start Date & Time",
            type: "datetime-local",
        },
        {
            key: "tripPlan.expectedDeliveryDateTime",
            label: "Expected Delivery Date & Time",
            type: "datetime-local",
        },
        {
            key: "tripPlan.routeDistanceKm",
            label: "Route Distance (KM)",
            type: "number",
            placeholder: "Enter route distance",
        },
        {
            key: "tripPlan.routeType",
            label: "Route Type",
            type: "select",
            options: routeTypeOptions,
        },
        {
            key: "tripPlan.estimatedTollAmount",
            label: "Estimated Toll Amount",
            type: "number",
            placeholder: "Enter toll amount",
        },
        {
            key: "tripPlan.estimatedDieselExpense",
            label: "Estimated Diesel Expense",
            type: "number",
            placeholder: "Enter diesel expense",
        },
        {
            key: "tripPlan.estimatedFoodExpense",
            label: "Estimated Food Expense",
            type: "number",
            placeholder: "Enter food expense",
        },
        {
            key: "tripPlan.estimatedOtherExpense",
            label: "Estimated Other Expense",
            type: "number",
            placeholder: "Enter other expense",
        },
    ];

    const documentsFields = [
        {
            key: "documentsAssigned.invoiceAttached",
            label: "Invoice Attached",
            type: "toggle",
        },
        {
            key: "documentsAssigned.ewayBillAttached",
            label: "E-Way Bill Attached",
            type: "toggle",
        },
        {
            key: "documentsAssigned.deliveryChallanAttached",
            label: "Delivery Challan Attached",
            type: "toggle",
        },
        {
            key: "documentsAssigned.insuranceCopyAttached",
            label: "Insurance Copy Attached",
            type: "toggle",
        },
    ];

    const renderFields = (fields: any[]) =>
        fields.map((field: any) =>
            renderField({
                field,
                form: fieldForm,
                handleInputChange,
                handleSelectChange,
                updateField,
            })
        );

    useEffect(() => {
        dispatch(getTransportOrders({ limit: 200, offset: 0, status: "open" }));
        dispatch(getActiveTripAllocations({
            limit: 200, offset: 0,
        }));

        const loginUser = getLoginUser();

        const parentMobile =
            loginUser?.parentUserMobileNumber ||
            loginUser?.parentUserMobileNumberHash ||
            loginUser?.userMobileNumberHash ||
            "";

        if (parentMobile) {
            dispatch(getAvailableDrivers({ parentUserMobileNumber: parentMobile }));
        }
    }, [dispatch]);

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

    useEffect(() => {
        if (!isEdit || !voucherNumber) return;

        const loadAllocation = async () => {
            try {
                setPageLoading(true);

                const response = await dispatch(
                    getTripAllocationByVoucherNumber(voucherNumber)
                ).unwrap();

                const data =
                    response?.data?.record ||
                    response?.data ||
                    response?.record ||
                    response;

                if (!data) {
                    toast.warn("Trip allocation not found");
                    navigate(-1);
                    return;
                }

                const merged = mergeTripAllocationForm(data);

                if (isAllocationClosed(merged)) {
                    toast.warn("Completed trip allocation cannot be edited");
                    navigate(-1);
                    return;
                }

                const normalizedSelectedVehicle = normalizeVehicle(
                    merged?.vehicleSelection ||
                    data?.vehicleSelection ||
                    data?.assignedVehicle ||
                    data?.vehicle ||
                    {}
                );

                const nextForm = {
                    ...merged,
                    vehicleSelection: {
                        ...createInitialTripAllocation().vehicleSelection,
                        ...(merged?.vehicleSelection || {}),
                        ...normalizedSelectedVehicle,
                    },
                };

                setForm(nextForm);

                const nextVehicleType = getRequiredVehicleType(nextForm?.transportOrder);

                const nextRequiredCapacity =
                    nextForm?.transportOrder?.requiredCapacityTon ||
                    nextForm?.transportOrder?.requiredWeightTon ||
                    "";

                setVehicleTypeFilter(nextVehicleType);
                setCapacityFilter(String(nextRequiredCapacity));
                setLocationFilter("");
                setVehicleSearch("");

                if (nextForm?.transportOrder?.transportOrderNumber) {
                    dispatch(
                        getVehicleMasterVehicles({
                            requiredWeight: nextForm?.transportOrder?.requiredWeightTon,
                            transportOrder: nextForm?.transportOrder,
                        })
                    );
                }
            } catch (error: any) {
                toast.error(error?.message || "Failed to load trip allocation");
            } finally {
                setPageLoading(false);
            }
        };

        loadAllocation();
    }, [dispatch, isEdit, voucherNumber, navigate]);


    const applyVehicle = async (
        vehicle: any,
        options: {
            autoSelectDriver?: boolean;
            showDriverMessage?: boolean;
        } = {}
    ) => {
        if (!vehicle) return;

        const {
            autoSelectDriver = true,
            showDriverMessage = false,
        } = options;

        const normalized = normalizeVehicle(vehicle);

        // Update vehicle immediately
        setForm((prev: any) => ({
            ...prev,

            vehicleSelection: {
                ...prev.vehicleSelection,
                ...normalized,
            },

            // Always clear previous driver when vehicle changes
            driverAllocation: {
                ...createInitialTripAllocation().driverAllocation,
            },
        }));

        if (!autoSelectDriver) return;

        // Wait for state update (optional but helps avoid race conditions)
        await Promise.resolve();

        // Auto-select linked driver if available
        await autoSelectVehicleDriver(normalized, {
            clearWhenMissing: true,
            showMessage: showDriverMessage,
        });
    };

    const handleRepickBestVehicle = () => {
        const picked = pickBestVehicle({
            vehicles: normalizedVehicles,
            transportOrder: form.transportOrder,
            vehicleTypeFilter,
            vehicleOwnershipFilter,
            capacityFilter,
            locationFilter,
        });

        if (!picked) {
            setForm((prev: any) => ({
                ...prev,
                vehicleSelection: createInitialTripAllocation().vehicleSelection,
            }));

            toast.warn("No vehicle matches required capacity");
            return;
        }

        applyVehicle(picked);
    };

    const handleTransportOrderSelect = async (selectedVoucher: string) => {
        if (!selectedVoucher) {
            setForm((prev: any) => ({
                ...prev,
                transportOrder: createInitialTripAllocation().transportOrder,
                vehicleSelection: createInitialTripAllocation().vehicleSelection,
            }));
            setVehicleTypeFilter("");
            setCapacityFilter("");
            setLocationFilter("");
            setVehicleSearch("");
            return;
        }

        try {
            setPageLoading(true);

            const response = await dispatch(
                getTransportOrderByVoucherNumber(selectedVoucher)
            ).unwrap();

            const order =
                response?.data?.record || response?.data || response?.record || response;

            if (!order) {
                toast.warn("Transport order not found");
                return;
            }

            const mappedOrder = mapTransportOrderToAllocation(order);

            setForm((prev: any) => ({
                ...prev,
                transportOrder: mappedOrder,
                vehicleSelection: createInitialTripAllocation().vehicleSelection,
                tripPlan: {
                    ...prev.tripPlan,
                    plannedStartDateTime: formatDateTimeForInput(
                        order?.pickupDetails?.pickupDateTime ||
                        prev.tripPlan.plannedStartDateTime
                    ),
                    expectedDeliveryDateTime: formatDateTimeForInput(
                        order?.deliveryDetails?.expectedDeliveryDateTime ||
                        prev.tripPlan.expectedDeliveryDateTime
                    ),
                    routeDistanceKm:
                        order?.routeDetails?.routeDistanceKm ||
                        prev.tripPlan.routeDistanceKm,
                    routeType: order?.routeDetails?.routeType || prev.tripPlan.routeType,
                    estimatedTollAmount:
                        order?.routeDetails?.expectedTollAmount ||
                        prev.tripPlan.estimatedTollAmount,
                },
            }));

            const requiredCapacity =
                mappedOrder.requiredCapacityTon ||
                mappedOrder.requiredWeightTon ||
                "";

            const requiredVehicleType = getRequiredVehicleType(mappedOrder);

            setVehicleTypeFilter(requiredVehicleType);
            setCapacityFilter(String(requiredCapacity));
            setLocationFilter("");
            setVehicleSearch("");

            const responseVehicles = await dispatch(
                getVehicleMasterVehicles({
                    requiredWeight: mappedOrder.requiredWeightTon,
                    transportOrder: mappedOrder,
                })
            ).unwrap();

            const vehicleList =
                responseVehicles?.vehicles ||
                responseVehicles?.data?.vehicles ||
                responseVehicles?.data?.items ||
                responseVehicles?.data ||
                [];

            const normalizedVehicleList = (vehicleList || []).map(normalizeVehicle);

            const picked = pickBestVehicle({
                vehicles: normalizedVehicleList,
                transportOrder: mappedOrder,
                vehicleTypeFilter: requiredVehicleType,
                capacityFilter: String(requiredCapacity),
                locationFilter: "",
            });

            if (picked) applyVehicle(picked);
        } catch (error: any) {
            toast.error(error?.message || "Failed to load transport order");
        } finally {
            setPageLoading(false);
        }
    };

    const handleDriverSelect = async (driverId: string) => {
        const selected = driverUsers.find(
            (driver: any) => driver.driverId === driverId
        );

        if (!selected) {
            setForm((prev: any) => ({
                ...prev,
                driverAllocation: {
                    ...prev.driverAllocation,
                    driverId: "",
                    driverName: "",
                    mobileNumber: "",
                    licenseNumber: "",
                    licenseExpiryDate: "",
                },
            }));
            return;
        }

        setForm((prev: any) => ({
            ...prev,
            driverAllocation: {
                ...prev.driverAllocation,
                driverId: selected.driverId,
                driverName: selected.driverName,
                mobileNumber: selected.mobileNumber,
                licenseNumber: selected.licenseNumber,
                licenseExpiryDate: selected.licenseExpiryDate,
            },
        }));

        try {
            const response = await dispatch(
                getChildUserByMobile(selected.driverId)
            ).unwrap();

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

            setForm((prev: any) => ({
                ...prev,
                driverAllocation: {
                    ...prev.driverAllocation,

                    mobileNumber:
                        selected.mobileNumber ||
                        String(child?.userMobileNumberHash || ""),

                    licenseNumber:
                        selected.licenseNumber ||
                        customFields?.licenseNumber ||
                        child?.licenseNumber ||
                        child?.drivingLicenseNumber ||
                        prev.driverAllocation.licenseNumber,

                    licenseExpiryDate:
                        selected.licenseExpiryDate ||
                        customFields?.licenseExpiry ||
                        child?.licenseExpiryDate ||
                        child?.drivingLicenseExpiryDate ||
                        prev.driverAllocation.licenseExpiryDate,
                },
            }));
        } catch (error: any) {
            toast.error(error?.message || "Failed to load driver license details");
        }
    };


    const autoSelectVehicleDriver = async (
        vehicle: any,
        options: {
            clearWhenMissing?: boolean;
            showMessage?: boolean;
        } = {}
    ) => {
        const {
            clearWhenMissing = false,
            showMessage = false,
        } = options;

        const normalized = normalizeVehicle(vehicle);

        const linkedDriver =
            normalized?.linkedDriver ||
            vehicle?.customemployeemaster ||
            vehicle?.rawRecord?.customemployeemaster ||
            null;

        const driverId = String(
            linkedDriver?.userMobileNumberHash ||
            normalized?.linkedDriverId ||
            ""
        ).trim();

        /*
         * Vehicle does not have a linked driver.
         * Keep manual selection unless clearWhenMissing=true.
         */
        if (!driverId) {
            if (clearWhenMissing) {
                setForm((prev: any) => ({
                    ...prev,
                    driverAllocation: {
                        ...createInitialTripAllocation()
                            .driverAllocation,
                    },
                }));
            }

            return;
        }

        /*
         * Prevent auto-selecting a driver who is already
         * assigned to another active trip.
         */
        const assignment =
            driverAssignmentMap[driverId];

        const isAssignedElsewhere =
            assignment &&
            (!isEdit ||
                assignment.allocationVoucher !==
                voucherNumber);

        if (isAssignedElsewhere) {
            toast.warn(
                `${normalized?.linkedDriverName ||
                "Vehicle's linked driver"
                } is already assigned to trip ${assignment.allocationVoucher
                }. Please select another driver.`
            );

            return;
        }

        /*
         * If the linked driver exists in the loaded
         * driver master, use the existing handler.
         * This also fetches licence details.
         */
        const driverExists =
            driverUsers.some(
                (driver: any) =>
                    String(driver?.driverId) === driverId
            );

        if (driverExists) {
            await handleDriverSelect(driverId);

            if (showMessage) {
                toast.info(
                    `${normalized?.linkedDriverName ||
                    "Linked driver"
                    } selected automatically`
                );
            }

            return;
        }

        /*
         * Fallback:
         * Vehicle has an employee object, but the driver
         * is not present in driverUsers yet.
         * Populate the available information directly.
         */
        const driverName = [
            linkedDriver?.userFirstName,
            linkedDriver?.userMiddleName,
            linkedDriver?.userLastName,
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        setForm((prev: any) => ({
            ...prev,
            driverAllocation: {
                ...prev.driverAllocation,

                driverId,
                driverName:
                    driverName || driverId,
                mobileNumber: driverId,

                licenseNumber:
                    linkedDriver?.licenseNumber ||
                    linkedDriver
                        ?.childUserCustomFields
                        ?.licenseNumber ||
                    "",

                licenseExpiryDate:
                    linkedDriver?.licenseExpiryDate ||
                    linkedDriver
                        ?.childUserCustomFields
                        ?.licenseExpiry ||
                    "",
            },
        }));

        /*
         * Try fetching full child-user details even when
         * driverUsers has not finished loading.
         */
        try {
            const response = await dispatch(
                getChildUserByMobile(driverId)
            ).unwrap();

            const responseData =
                response?.data || response;

            const childUsersRaw =
                responseData?.ChildUsers ||
                responseData?.childUsers ||
                responseData?.result ||
                responseData?.users ||
                [];

            const childUsersArray =
                Array.isArray(childUsersRaw)
                    ? childUsersRaw
                    : childUsersRaw &&
                        typeof childUsersRaw === "object"
                        ? [childUsersRaw]
                        : [];

            const child =
                childUsersArray.find(
                    (item: any) =>
                        String(
                            item?.userMobileNumberHash ||
                            ""
                        ) === driverId
                ) ||
                childUsersArray[0] ||
                responseData;

            const customFields =
                child?.childUserCustomFields || {};

            setForm((prev: any) => ({
                ...prev,
                driverAllocation: {
                    ...prev.driverAllocation,

                    driverId,

                    driverName:
                        getFullName(child) ||
                        driverName ||
                        driverId,

                    mobileNumber:
                        String(
                            child?.userMobileNumberHash ||
                            driverId
                        ),

                    licenseNumber:
                        customFields?.licenseNumber ||
                        child?.licenseNumber ||
                        child?.drivingLicenseNumber ||
                        prev.driverAllocation
                            ?.licenseNumber ||
                        "",

                    licenseExpiryDate:
                        customFields?.licenseExpiry ||
                        child?.licenseExpiryDate ||
                        child
                            ?.drivingLicenseExpiryDate ||
                        prev.driverAllocation
                            ?.licenseExpiryDate ||
                        "",
                },
            }));
        } catch (error) {
            /*
             * Do not remove the basic linked-driver data.
             * Only the additional details could not load.
             */
            console.error(
                "Failed to load linked vehicle driver details",
                error
            );
        }
    };

    const handleHelperSelect = (helperId: string) => {
        const selected = driverUsers.find(
            (driver: any) => driver.driverId === helperId
        );

        setForm((prev: any) => ({
            ...prev,
            driverAllocation: {
                ...prev.driverAllocation,
                helperAssigned: Boolean(helperId),
                helperId: helperId || "",
                helperName: selected?.driverName || "",
                helperMobile: selected?.mobileNumber || "",
            },
        }));
    };

    const validate = () => {
        if (!form.transportOrder?.transportOrderNumber) {
            toast.warn("Transport order number required");
            return false;
        }

        if (!form.vehicleSelection?.selectedVehicleId) {
            toast.warn("Please select vehicle");
            return false;
        }

        if (!form.driverAllocation?.driverId) {
            toast.warn("Please select driver");
            return false;
        }

        const chosenDriverAssignment =
            driverAssignmentMap[form.driverAllocation.driverId];

        if (
            chosenDriverAssignment &&
            (!isEdit || chosenDriverAssignment.allocationVoucher !== voucherNumber)
        ) {
            toast.warn(
                `${form.driverAllocation.driverName || "This driver"
                } is already assigned to trip ${chosenDriverAssignment.allocationVoucher
                }. Please select a different driver.`
            );
            return false;
        }

        return true;
    };

    const syncTripExpenseFromAllocation = async ({
        allocationVoucher,
        savedAllocation,
    }: {
        allocationVoucher: string;
        savedAllocation: any;
    }) => {
        if (!allocationVoucher) {
            throw new Error("Allocation voucher number not found");
        }

        const driverMobile = String(
            form.driverAllocation?.driverId ||
            form.driverAllocation?.mobileNumber ||
            ""
        ).trim();

        if (!driverMobile) {
            throw new Error("Driver mobile number not found");
        }

        const allocationForExpense = {
            ...form,
            ...(savedAllocation || {}),

            voucherNumber: allocationVoucher,
            tripNumber: allocationVoucher,
            tripAllocationVoucherNumber: allocationVoucher,

            transportOrder: {
                ...form.transportOrder,
                ...(savedAllocation?.transportOrder || {}),
            },

            vehicleSelection: {
                ...form.vehicleSelection,
                ...(savedAllocation?.vehicleSelection || {}),
            },

            driverAllocation: {
                ...form.driverAllocation,
                ...(savedAllocation?.driverAllocation || {}),
            },

            tripPlan: {
                ...form.tripPlan,
                ...(savedAllocation?.tripPlan || {}),
            },
        };

        const expenseForm = mapTripAllocationToExpenseForm(allocationForExpense);

        const payload = toTripExpensePayload(expenseForm, {
            tripStatus: "assigned",
            driverAccepted: false,
            acceptedAt: "",
            allocationVoucherNumber: allocationVoucher,

            assignedDriverMobile: driverMobile,
            tripAssignedToMobile: driverMobile,
            sendNotificationTo: driverMobile,

            enteredBy: "dispatcher",
            enteredDate: new Date().toISOString(),

            notificationType: "trip_assigned_by_parent",
            notificationMessage: `Trip ${expenseForm.tripId || allocationVoucher
                } assigned to you. Please accept to start expense entry.`,
            notifyParent: false,
        });

        // await dispatch(createTripExpense(payload)).unwrap();

        return payload;
    };


    const handleSave = async () => {
        if (!validate()) return;

        try {
            setPageLoading(true);

            const payload = toTripAllocationPayload({
                ...form,
                tripStatus: form.tripStatus || "pending",
            });

            // =====================================================
            // UPDATE
            // =====================================================
            if (isEdit) {
                await dispatch(
                    updateTripAllocationByVoucherNumber({
                        voucherNumber,
                        updateData: payload,
                    })
                ).unwrap();

                // Send WhatsApp (don't fail update if notification fails)
                try {
                    await dispatch(
                        sendWhatsAppMessage({
                            moduleType: "tripAllocation",
                            voucherNumber,
                        })
                    ).unwrap();
                } catch (err) {
                    console.error(
                        "[TripAllocation] WhatsApp notification failed",
                        err
                    );
                }

                toast.success("Trip allocation updated");
                navigate(-1);
                return;
            }

            // =====================================================
            // CREATE
            // =====================================================
            const saveResponse = await dispatch(
                createTripAllocation(payload)
            ).unwrap();

            const savedAllocation = getSavedAllocationRecord(
                saveResponse,
                payload
            );

            const allocationVoucher =
                getAllocationVoucherFromSaved(savedAllocation);

            // Send WhatsApp
            if (allocationVoucher) {
                try {
                    await dispatch(
                        sendWhatsAppMessage({
                            moduleType: "tripAllocation",
                            voucherNumber: allocationVoucher,
                        })
                    ).unwrap();
                } catch (err) {
                    console.error(
                        "[TripAllocation] WhatsApp notification failed",
                        err
                    );
                }
            }

            // Sync Trip Expense
            try {
                await syncTripExpenseFromAllocation({
                    allocationVoucher,
                    savedAllocation,
                });
            } catch (expenseError: any) {
                console.error(
                    "[TripAllocation] Trip expense assignment failed",
                    expenseError
                );

                toast.error(
                    expenseError?.message ||
                    "Trip allocation saved, but driver request failed."
                );

                return;
            }

            toast.success("Trip allocated successfully. Request sent to driver.");
            navigate(-1);
        } catch (error: any) {
            toast.error(error?.message || "Trip allocation failed");
        } finally {
            setPageLoading(false);
        }
    };


    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-4">
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div>
                        <h1 className="truncate text-lg font-bold text-card-foreground">
                            {pageTitle}
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            {pageDescription}
                        </p>
                    </div>
                </div>

                {/* <button
                    type="button"
                    disabled={loading}
                    onClick={handleSave}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {loading ? "Saving..." : isEdit ? "Update Allocation" : "Allocate Trip"}
                </button> */}

                <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                        if (isEdit) {
                            // Edit flow is unchanged — saves directly, no confirmation popup
                            handleSave();
                            return;
                        }

                        // Create flow — validate first, then show the confirmation popup
                        if (!validate()) return;
                        setShowAssignConfirm(true);
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {loading ? "Saving..." : isEdit ? "Update Allocation" : "Allocate Trip"}
                </button>
            </header>

            <main className="flex-1 overflow-auto p-3 pb-8 sm:p-2">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <FormSectionCard
                            title="Transport Order"
                            icon={<ClipboardList size={18} />}
                        >
                            <div className="md:col-span-2 xl:col-span-3">
                                <label className="mb-1 block text-sm font-medium text-card-foreground">
                                    Transport Order <span className="text-danger">*</span>
                                </label>

                                <Select
                                    value={selectedOrderOption}
                                    options={transportOrderOptions}
                                    placeholder="Select Transport Order"
                                    isSearchable
                                    onChange={(option: any) =>
                                        handleTransportOrderSelect(option?.value || "")
                                    }
                                    classNamePrefix="rs"
                                />
                            </div>

                            {transportOrderSelected && (
                                <div className="md:col-span-2 xl:col-span-3 grid grid-cols-2 gap-4 rounded-md border border-border bg-background p-4 md:grid-cols-4">
                                    <Meta
                                        label="Required Vehicle Type"
                                        value={form.transportOrder.requiredVehicleType || "-"}
                                    />

                                    <Meta
                                        label="Required Capacity"
                                        value={`Min. ${form.transportOrder.requiredCapacityTon || 0
                                            } Ton`}
                                    />

                                    <Meta
                                        label="Load Type"
                                        value={form.transportOrder.loadType || "-"}
                                    />

                                    <Meta
                                        label="Total Weight"
                                        value={`${form.transportOrder.requiredWeightTon || 0
                                            } Ton`}
                                    />
                                </div>
                            )}
                        </FormSectionCard>

                        <FormSectionCard
                            title="Assigned Vehicle"
                            icon={<Truck size={18} />}
                        >
                            {!transportOrderSelected ? (
                                <div className="md:col-span-2 xl:col-span-4 flex min-h-10 flex-col items-center justify-center rounded-md border border-dashed border-border bg-background p-3 text-center">
                                    <Truck
                                        size={32}
                                        className="mb-2 text-muted-foreground/40"
                                    />

                                    <p className="text-sm text-muted-foreground">
                                        Select a transport order first
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-card-foreground">
                                            Vehicle Type
                                        </label>

                                        <select
                                            value={vehicleTypeFilter}
                                            onChange={(e) => setVehicleTypeFilter(e.target.value)}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                                        >
                                            {vehicleTypeOptions.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-card-foreground">
                                            Capacity
                                        </label>

                                        <select
                                            value={capacityFilter}
                                            onChange={(e) => setCapacityFilter(e.target.value)}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                                        >
                                            {capacityOptions.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-card-foreground">
                                            Location
                                        </label>

                                        <select
                                            value={locationFilter}
                                            onChange={(e) => setLocationFilter(e.target.value)}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                                        >
                                            {locationOptions.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-card-foreground">
                                            Vehicle Ownership
                                        </label>

                                        <select
                                            value={vehicleOwnershipFilter}
                                            onChange={(e) => setVehicleOwnershipFilter(e.target.value)}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                                        >
                                            {vehicleOwnershipOptions.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedVehicle && (
                                        <div className="md:col-span-2 xl:col-span-4">
                                            <VehicleSummary form={form} />
                                        </div>
                                    )}
                                </>
                            )}
                        </FormSectionCard>
                    </div>

                    {transportOrderSelected && (
                        <div className="rounded-md border border-border bg-card p-4">
                            {vehiclesLoader ? (
                                <div className="rounded-md border border-border bg-background p-6 text-center text-sm text-muted-foreground">
                                    Loading vehicles...
                                </div>
                            ) : filteredVehicles.length === 0 ? (
                                <div className="flex min-h-24 flex-col items-center justify-center rounded-md border border-dashed border-border bg-background p-6 text-center">
                                    <Truck
                                        size={28}
                                        className="mb-2 text-muted-foreground/40"
                                    />

                                    <p className="text-sm text-muted-foreground">
                                        No vehicle found for selected filters.
                                    </p>
                                </div>
                            ) : null}

                            {filteredVehicles.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                <Truck size={17} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-card-foreground">
                                                    Vehicle List
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {searchedVehicles.length}/{filteredVehicles.length} vehicles
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">


                                            <div className="relative w-full sm:w-[400px]">
                                                <Search
                                                    size={15}
                                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                                />

                                                <input
                                                    value={vehicleSearch}
                                                    onChange={(e) => setVehicleSearch(e.target.value)}
                                                    placeholder="Search vehicle..."
                                                    className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-9 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                                />

                                                {vehicleSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVehicleSearch("")}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground transition hover:text-danger"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>


                                            <button
                                                type="button"
                                                onClick={handleRepickBestVehicle}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary transition hover:bg-primary/10 sm:w-auto"
                                            >
                                                <RefreshCcw size={14} />
                                                <span className="whitespace-nowrap">Best Vehicle</span>
                                            </button>
                                        </div>
                                    </div>

                                    {searchedVehicles.length > 0 ? (
                                        <div className="max-h-[270px] overflow-y-auto rounded-md border border-border bg-background p-2">
                                            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                                                {searchedVehicles.map((vehicle: any) => {
                                                    const isSelected =
                                                        form.vehicleSelection?.selectedVehicleId ===
                                                        vehicle.selectedVehicleId;

                                                    return (
                                                        <button
                                                            key={vehicle.selectedVehicleId || vehicle.vehicleNumber}
                                                            type="button"
                                                            onClick={() => applyVehicle(vehicle)}
                                                            className={`group rounded-md border px-2.5 py-2 text-left text-sm transition ${isSelected
                                                                ? "border-primary bg-primary/5 shadow-sm"
                                                                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex min-w-0 items-center gap-2.5">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/5">
                                                                        <img
                                                                            src={truckImage}
                                                                            alt="Vehicle"
                                                                            className="h-7 w-7 object-contain"
                                                                        />
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <div className="flex min-w-0 items-center gap-2">
                                                                            <span className="truncate text-xs font-bold text-card-foreground">
                                                                                {vehicle.vehicleNumber || "-"}
                                                                            </span>


                                                                        </div>

                                                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                            {vehicle.vehicleType || "-"}
                                                                            {vehicle.vehicleBodyType
                                                                                ? ` | ${vehicle.vehicleBodyType}`
                                                                                : ""}
                                                                            {vehicle.model ? ` | ${vehicle.model}` : ""}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <span
                                                                    className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold ${getVehicleStatusClasses(
                                                                        vehicle.availabilityStatus
                                                                    )}`}
                                                                >
                                                                    {vehicle.availabilityStatus || "Available"}
                                                                </span>
                                                            </div>

                                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                                                <span className="text-muted-foreground">
                                                                    Cap:{" "}
                                                                    <b className="text-card-foreground">
                                                                        {vehicle.vehicleCapacityTon || 0} Ton
                                                                    </b>
                                                                </span>

                                                                <span className="text-muted-foreground">
                                                                    Avl:{" "}
                                                                    <b className="text-card-foreground">
                                                                        {vehicle.availableCapacityTon || 0} Ton
                                                                    </b>
                                                                </span>

                                                                <span className="text-muted-foreground">
                                                                    Loc:{" "}
                                                                    <b className="text-card-foreground">
                                                                        {vehicle.currentLocation || "-"}
                                                                    </b>
                                                                </span>

                                                                <span className="text-muted-foreground">
                                                                    Load:{" "}
                                                                    <b className="text-card-foreground">
                                                                        {vehicle.loadType || "FTL"}
                                                                    </b>
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-dashed border-border bg-background p-4 text-center text-sm text-muted-foreground">
                                            No vehicle found for “{vehicleSearch}”.
                                        </div>
                                    )}
                                </div>
                            )}


                        </div>
                    )}

                    <FormSectionCard title="Driver Details" icon={<UserRound size={18} />}>
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
                                isDisabled={driversLoader}
                                isSearchable
                                onChange={(option: any) =>
                                    handleDriverSelect(option?.value || "")
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
                                value={form.driverAllocation?.mobileNumber || ""}
                                className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-card-foreground">
                                License Number
                            </label>

                            <input
                                disabled
                                value={form.driverAllocation?.licenseNumber || ""}
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
                                value={formatDateForInput(
                                    form.driverAllocation?.licenseExpiryDate
                                )}
                                className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
                            />
                        </div>

                        {form.driverAllocation?.helperAssigned && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-card-foreground">
                                    Helper Mobile
                                </label>

                                <input
                                    disabled
                                    value={form.driverAllocation?.helperMobile || ""}
                                    className="h-10 w-full rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground"
                                />
                            </div>
                        )}
                    </FormSectionCard>




                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                        <FormSectionCard title="Trip Plan" icon={<MapPinned size={18} />}>
                            {renderFields(tripPlanFields)}
                        </FormSectionCard>

                        <FormSectionCard title="Additional Details" icon={<FileText size={18} />}>
                            <div className="md:col-span-2 xl:col-span-3">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="flex w-full flex-col gap-1">
                                        <label className="text-sm font-medium text-card-foreground">
                                            Helper / Cleaner
                                        </label>

                                        <Select
                                            value={selectedHelperOption}
                                            options={helperOptions}
                                            placeholder={
                                                driversLoader
                                                    ? "Loading team members..."
                                                    : "Helper / Cleaner"
                                            }
                                            isDisabled={driversLoader}
                                            isSearchable
                                            isClearable
                                            onChange={(option: any) =>
                                                handleHelperSelect(option?.value || "")
                                            }
                                            classNamePrefix="rs"
                                        />
                                    </div>

                                    <div className="flex w-full flex-col gap-1">
                                        <label className="text-sm font-medium text-card-foreground">
                                            Documents
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowDocuments((prev) => !prev)
                                            }
                                            className="flex min-h-10 w-full items-center justify-between rounded-md border border-border bg-background px-4 py-2 text-left transition hover:border-primary/50 hover:bg-primary/5"
                                        >
                                            <span className="text-sm font-semibold text-card-foreground">
                                                Documents Assigned
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-primary">
                                                    {documentsCount}
                                                </span>

                                                <ChevronRight
                                                    size={16}
                                                    className={`text-muted-foreground transition ${showDocuments ? "rotate-90" : ""
                                                        }`}
                                                />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {showDocuments && renderFields(documentsFields)}

                            <div className="md:col-span-2 xl:col-span-3">
                                <label className="mb-1 block text-sm font-medium text-card-foreground">
                                    Remarks
                                </label>

                                <div className="relative">
                                    <textarea
                                        value={form.remarks || ""}
                                        placeholder="Enter remarks (optional)"
                                        maxLength={REMARKS_MAX}
                                        onChange={(e: any) =>
                                            updateRoot(
                                                "remarks",
                                                String(e?.target?.value || "").slice(
                                                    0,
                                                    REMARKS_MAX
                                                )
                                            )
                                        }
                                        className="min-h-24 w-full resize-none rounded-md border border-border bg-background px-3 py-2 pr-16 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    />

                                    <p className="absolute bottom-2 right-3 text-xs font-bold text-muted-foreground">
                                        {String(form.remarks || "").length}/{REMARKS_MAX}
                                    </p>
                                </div>
                            </div>
                        </FormSectionCard>

                    </div>
                </div>
            </main>

            {showAssignConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-card p-6 text-center shadow-xl">
                        <h2 className="text-lg font-bold text-card-foreground">
                            Assign Trip to Team Member
                        </h2>

                        <p className="mt-3 text-sm text-muted-foreground">
                            Send trip assignment notification to{" "}
                            <span className="font-semibold text-card-foreground">
                                {form.driverAllocation?.driverName ||
                                    form.driverAllocation?.mobileNumber ||
                                    "the driver"}
                            </span>
                            ?
                        </p>

                        <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                            <p>
                                Trip:{" "}
                                <span className="font-semibold text-card-foreground">
                                    {form.transportOrder?.transportOrderNumber || "-"}
                                </span>
                            </p>
                            <p>
                                Vehicle:{" "}
                                <span className="font-semibold text-card-foreground">
                                    {form.vehicleSelection?.vehicleNumber || "-"}
                                </span>
                            </p>
                        </div>

                        <p className="mt-4 text-sm text-muted-foreground">
                            They will get a popup to Accept and start expense entry.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setShowAssignConfirm(false)}
                                className="h-11 rounded-md border border-border bg-background text-sm font-bold text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={async () => {
                                    setShowAssignConfirm(false);
                                    await handleSave();
                                }}
                                className="h-11 rounded-md bg-primary text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Assign & Notify
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

const Meta = ({ label, value }: any) => (
    <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xs font-semibold text-card-foreground">{value}</p>
    </div>
);

const VehicleSummary = ({ form }: any) => {
    const vehicle = form.vehicleSelection || {};
    const status = vehicle.availabilityStatus || "Available";

    return (
        <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <img
                            src={truckImage}
                            alt="Selected vehicle"
                            className="h-10 w-10 object-contain"
                        />
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate text-xs font-bold text-card-foreground">
                            {vehicle.vehicleNumber || "-"}
                        </h3>

                        <p className="truncate text-[11px] text-muted-foreground">
                            {vehicle.vehicleType || "-"} ·{" "}
                            {vehicle.availableCapacityTon || 0} Ton ·{" "}
                            {vehicle.currentLocation || "-"} ·{" "}
                            {vehicle.loadType || "FTL"}
                        </p>
                    </div>
                </div>

                <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${getVehicleStatusClasses(
                        status
                    )}`}
                >
                    {status}
                </span>
            </div>
        </div>
    );
};

export default CreateTripAllocation;