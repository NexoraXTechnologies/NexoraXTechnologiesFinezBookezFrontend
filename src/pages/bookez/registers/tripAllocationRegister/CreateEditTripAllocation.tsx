import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    FileText,
    IndianRupee,
    LoaderCircle,
    MapPin,
    RefreshCw,
    Save,
    Truck,
    UserRound,
    X,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { SelectInput } from "../../../../components/inputs";

import {
    getTransportOrderByVoucherNumber,
    getTransportOrders,
} from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
import {
    createTripAllocation,
    getActiveTripAllocations,
    getAvailableDrivers,
    getChildUserByMobile,
    getTripAllocationByVoucherNumber,
    getVehicleMasterVehicles,
    updateTripAllocationByVoucherNumber,
    updateVehicleMasterStatus,
} from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";

import {
    buildRoutesDataFromTransportOrder,
    createInitialTripAllocation,
    getAllocationVoucher,
    isAllocationClosed,
    mapTransportOrderToAllocation,
    mergeTripAllocationForm,
    normalizeAllocationStatus,
    toTripAllocationPayload,
} from "./tripAllocationInitialState";

const REMARKS_MAX = 200;

const OWNERSHIP_TYPE_OPTIONS = [
    { label: "Owned Vehicle", value: "owned" },
    { label: "Market Vehicle", value: "market" },
];

type CreateEditTripAllocationProps = {
    embedded?: boolean;
    mode?: "add" | "edit" | "view";
    voucherNumber?: string;
    allocationData?: any;
    onClose?: () => void;
    onSaved?: () => void;
};

type LocationState = {
    mode?: "add" | "edit" | "view";
    voucherNumber?: string;
    allocationData?: any;
};

type SelectOption = {
    label: string;
    value: string;
    disabled?: boolean;
};

const normalizeOwnershipType = (value: any): string => {
    const key = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    if (["owned", "own", "company", "companyowned"].includes(key)) {
        return "owned";
    }

    if (["market", "hired", "vendor", "thirdparty"].includes(key)) {
        return "market";
    }

    return "";
};

const compactVehicleType = (value: any): string =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const getTransportOrderVoucher = (order: any): string =>
    order?.voucherNumber ||
    order?.transportOrderNumber ||
    order?.transportOrderVoucherNumber ||
    "";

const getTripAllocationRecord = (
    response: any,
    voucherNumber: string,
): any | null => {
    const candidates = [
        response?.tripAllocation,
        response?.data?.tripAllocation,
        response?.allocation,
        response?.data?.allocation,
        response?.record,
        response?.data?.record,
        response?.data?.data,
        response?.data,
        response,
    ];

    for (const candidate of candidates) {
        if (
            !candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate)
        ) {
            continue;
        }

        const foundVoucher = getAllocationVoucher(candidate);
        if (!foundVoucher || foundVoucher === voucherNumber) return candidate;
    }

    return null;
};

const getTransportOrderRecord = (
    response: any,
    voucherNumber: string,
): any | null => {
    const candidates = [
        response?.transportOrder,
        response?.data?.transportOrder,
        response?.record,
        response?.data?.record,
        response?.data?.data,
        response?.data,
        response,
    ];

    for (const candidate of candidates) {
        if (
            !candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate)
        ) {
            continue;
        }

        const foundVoucher = getTransportOrderVoucher(candidate);
        if (!foundVoucher || foundVoucher === voucherNumber) return candidate;
    }

    return null;
};

const getAllocationStatus = (item: any): string =>
    normalizeAllocationStatus(
        item?.tripStatus || item?.allocationStatus || item?.status,
    );

const isActiveAllocation = (item: any): boolean =>
    !["completed", "cancelled"].includes(getAllocationStatus(item));

const buildAllocatedOrderSet = (items: any[]): Set<string> => {
    const result = new Set<string>();

    (items || []).filter(isActiveAllocation).forEach((item) => {
        const voucher =
            item?.transportOrder?.transportOrderNumber ||
            item?.transportOrderNumber ||
            "";

        if (voucher) result.add(String(voucher));
    });

    return result;
};

const buildDriverAssignmentMap = (
    items: any[],
): Record<string, { allocationVoucher: string; driverName: string }> => {
    const result: Record<
        string,
        { allocationVoucher: string; driverName: string }
    > = {};

    (items || []).filter(isActiveAllocation).forEach((item) => {
        const driverId = String(item?.driverAllocation?.driverId || "").trim();
        if (!driverId) return;

        result[driverId] = {
            allocationVoucher: getAllocationVoucher(item),
            driverName: item?.driverAllocation?.driverName || "",
        };
    });

    return result;
};

const extractDriverDetails = (value: any) => {
    const sources = [
        value,
        value?.dynamicFields,
        value?.childUserCustomFields,
        value?.rawChild,
    ].filter(Boolean);

    const read = (keys: string[]) => {
        for (const source of sources) {
            for (const key of keys) {
                const found = source?.[key];
                if (found !== undefined && found !== null && String(found).trim()) {
                    return found;
                }
            }
        }
        return "";
    };

    return {
        mobileNumber: String(
            read(["mobileNumber", "userMobileNumberHash", "mobile", "phone"]),
        ),
        licenseNumber: String(
            read(["licenseNumber", "LicenseNumber", "drivingLicenseNumber"]),
        ),
        licenseExpiryDate: read([
            "licenseExpiryDate",
            "licenseExpiry",
            "LicenseExpiry",
            "drivingLicenseExpiryDate",
        ]),
    };
};

const toNumber = (value: any): number => {
    const match = String(value ?? "")
        .replace(/,/g, "")
        .match(/-?\d+(\.\d+)?/);

    return match ? Number(match[0]) : 0;
};

const formatIndianNumber = (value: any): string =>
    toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

const formatDate = (value: any): string => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN");
};

const toDateTimeLocalValue = (value: any): string => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60 * 1000,
    );

    return localDate.toISOString().slice(0, 16);
};

const fromDateTimeLocalValue = (value: string): string => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const readParentMobile = (state: any): string => {
    const user =
        state?.auth?.user ||
        state?.login?.user ||
        state?.user?.user ||
        state?.profile?.user ||
        {};

    return String(
        user?.parentUserMobileNumber ||
        user?.userMobileNumberHash ||
        user?.userMobileNumber ||
        localStorage.getItem("parentUserMobileNumber") ||
        localStorage.getItem("userMobileNumber") ||
        "",
    ).trim();
};

const vehicleStatusClass = (status: any): string => {
    const key = String(status || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    if (key === "available") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    }

    if (key === "allocated" || key === "pending") {
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
    }

    if (["intransit", "loading", "unloading"].includes(key)) {
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
    }

    return "bg-muted text-muted-foreground";
};

const isVehicleAvailable = (vehicle: any): boolean => {
    const status = String(vehicle?.availabilityStatus || "Available")
        .trim()
        .toLowerCase();

    return status === "available" || status === "active";
};

const getRequiredCapacity = (transportOrder: any): number => {
    const requiredWeight = toNumber(transportOrder?.requiredWeightTon);
    const requiredCapacity = toNumber(transportOrder?.requiredCapacityTon);
    return requiredWeight > 0 ? requiredWeight : requiredCapacity;
};

const selectBestVehicle = (
    vehicles: any[],
    transportOrder: any,
    filters: {
        vehicleTypeFilter?: string;
        capacityFilter?: string;
        locationFilter?: string;
    },
): any | null => {
    const requiredCapacity = getRequiredCapacity(transportOrder);
    const requiredType = compactVehicleType(
        filters.vehicleTypeFilter || transportOrder?.requiredVehicleType,
    );

    const available = (vehicles || []).filter(isVehicleAvailable);

    const filterList = (strictType: boolean) =>
        available.filter((vehicle) => {
            const vehicleCapacity = toNumber(
                vehicle?.availableCapacityTon || vehicle?.vehicleCapacityTon,
            );

            if (requiredCapacity > 0 && vehicleCapacity < requiredCapacity) {
                return false;
            }

            if (
                filters.capacityFilter &&
                vehicleCapacity < toNumber(filters.capacityFilter)
            ) {
                return false;
            }

            if (
                filters.locationFilter &&
                String(vehicle?.currentLocation || "").trim() !== filters.locationFilter
            ) {
                return false;
            }

            if (
                strictType &&
                requiredType &&
                compactVehicleType(vehicle?.vehicleType) !== requiredType
            ) {
                return false;
            }

            return true;
        });

    const candidates = filterList(true).length
        ? filterList(true)
        : filterList(false);

    return (
        [...candidates].sort((a, b) => {
            const capacityA = toNumber(
                a?.availableCapacityTon || a?.vehicleCapacityTon,
            );
            const capacityB = toNumber(
                b?.availableCapacityTon || b?.vehicleCapacityTon,
            );

            return capacityA - capacityB;
        })[0] || null
    );
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="mb-1.5 block text-sm font-semibold text-foreground">
        {children}
    </label>
);

const TextField = ({
    label,
    value,
    onChange,
    disabled = false,
    type = "text",
    placeholder = "",
}: {
    label: string;
    value: any;
    onChange?: (value: string) => void;
    disabled?: boolean;
    type?: string;
    placeholder?: string;
}) => (
    <div>
        <FieldLabel>{label}</FieldLabel>
        <input
            type={type}
            value={value ?? ""}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => onChange?.(event.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        />
    </div>
);

const SelectField = ({
    label,
    value,
    onChange,
    options,
    disabled = false,
    placeholder = "Select",
    mandatory = false,
    largeData = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    disabled?: boolean;
    placeholder?: string;
    mandatory?: boolean;
    largeData?: boolean;
}) => (
    <SelectInput
        label={label}
        value={value || ""}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        mandatory={mandatory}
        largeData={largeData}
        onChange={(event: any) => {
            onChange(String(event?.target?.value ?? ""));
        }}
    />
);

const ToggleField = ({
    label,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) => (
    <label className="flex items-center justify-between gap-4 rounded-md border border-border bg-background px-3 py-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            className="h-5 w-5 accent-primary"
        />
    </label>
);

const SectionCard = ({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) => (
    <section className="rounded-md border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                {icon}
            </span>
            <h2 className="text-base font-bold text-card-foreground">{title}</h2>
        </div>
        {children}
    </section>
);

const SummaryTile = ({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) => (
    <div className="rounded-md border border-border bg-background p-3 text-center">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-bold text-card-foreground">
            {value || "-"}
        </div>
    </div>
);

const CreateEditTripAllocationRegistration = ({
    embedded = false,
    mode: propMode,
    voucherNumber: propVoucherNumber,
    allocationData: propAllocationData,
    onClose,
    onSaved,
}: CreateEditTripAllocationProps) => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();
    const { voucherNumber: routeVoucherNumber } = useParams<{ voucherNumber: string; }>();

    const locationState = location.state as LocationState | undefined;
    const pathnameMode = location.pathname.includes("/view/")
        ? "view"
        : location.pathname.includes("/edit/")
            ? "edit"
            : "add";

    const mode = propMode || locationState?.mode || pathnameMode;
    const isEdit = mode === "edit";
    const isView = mode === "view";
    const voucherNumber =
        propVoucherNumber ||
        locationState?.voucherNumber ||
        routeVoucherNumber ||
        "";

    const tripState = useSelector((state: any) => state.tripAllocation || {});
    const transportOrderState = useSelector(
        (state: any) => state.transportationOrder || state.transportOrder || {},
    );
    const parentUserMobileNumber = useSelector(readParentMobile);

    const {
        activeAllocations = [],
        activeAllocationsLoader = false,
        drivers = [],
        driversLoader = false,
        vehicles = [],
        vehiclesLoader = false,
        createLoader = false,
        updateLoader = false,
        detailLoader = false,
    } = tripState;

    const {
        transportOrders = [],
        listingLoader: transportOrdersLoading = false,
        detailLoader: transportOrderDetailLoading = false,
    } = transportOrderState;

    const initialAllocationData =
        propAllocationData || locationState?.allocationData;

    const [form, setForm] = useState(() =>
        mergeTripAllocationForm(
            initialAllocationData || createInitialTripAllocation(),
        ),
    );
    const [documentsOpen, setDocumentsOpen] = useState(false);
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
    const [capacityFilter, setCapacityFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [vehicleLocked, setVehicleLocked] = useState(isEdit || isView);
    const [formError, setFormError] = useState("");
    const [message, setMessage] = useState("");
    const [pageLoading, setPageLoading] = useState(false);
    const initialVehicleVoucherRef = useRef("");

    const saving = createLoader || updateLoader || pageLoading;
    const screenDisabled = isView || saving;

    const update = useCallback((section: string, key: string, value: any) => {
        setForm((previous: any) => ({
            ...previous,
            [section]: {
                ...previous[section],
                [key]: value,
            },
        }));
    }, []);

    const allocatedOrderSet = useMemo(
        () => buildAllocatedOrderSet(activeAllocations),
        [activeAllocations],
    );

    const driverAssignmentMap = useMemo(
        () => buildDriverAssignmentMap(activeAllocations),
        [activeAllocations],
    );

    const transportOrderOptions = useMemo<SelectOption[]>(() => {
        const options = (Array.isArray(transportOrders) ? transportOrders : [])
            .filter((order: any) => {
                const voucher = getTransportOrderVoucher(order);
                if (!voucher) return false;

                if (
                    (isEdit || isView) &&
                    voucher === form.transportOrder.transportOrderNumber
                ) {
                    return true;
                }

                return !allocatedOrderSet.has(voucher);
            })
            .map((order: any) => {
                const voucher = getTransportOrderVoucher(order);
                const customer =
                    order?.customerDetails?.customerName || order?.customerName || "-";
                const source =
                    order?.pickupDetails?.pickupLocation || order?.pickupLocation || "-";
                const destination =
                    order?.deliveryDetails?.deliveryLocation ||
                    order?.deliveryLocation ||
                    "-";

                return {
                    label: `${voucher} - ${customer} (${source} → ${destination})`,
                    value: voucher,
                };
            });

        const currentVoucher = form.transportOrder.transportOrderNumber;
        if (
            currentVoucher &&
            !options.some((option) => option.value === currentVoucher)
        ) {
            options.unshift({
                label: `${currentVoucher} - ${form.transportOrder.customerName || "-"}`,
                value: currentVoucher,
            });
        }

        return options;
    }, [allocatedOrderSet, form.transportOrder, isEdit, isView, transportOrders]);

    const driverOptions = useMemo<SelectOption[]>(() => {
        return (Array.isArray(drivers) ? drivers : []).map((driver: any) => {
            const assignment = driverAssignmentMap[driver.driverId];
            const assignedElsewhere =
                assignment &&
                (!isEdit || assignment.allocationVoucher !== voucherNumber);

            return {
                label: assignedElsewhere
                    ? `${driver.driverName || driver.driverId} — Assigned to ${assignment.allocationVoucher}`
                    : driver.driverName || driver.driverId,
                value: driver.driverId,
                disabled: Boolean(assignedElsewhere),
            };
        });
    }, [driverAssignmentMap, drivers, isEdit, voucherNumber]);

    const helperOptions = useMemo<SelectOption[]>(() => {
        return (Array.isArray(drivers) ? drivers : [])
            .filter(
                (driver: any) =>
                    driver.driverName &&
                    driver.driverId !== form.driverAllocation.driverId,
            )
            .map((driver: any) => ({
                label: driver.driverName,
                value: driver.driverName,
            }));
    }, [drivers, form.driverAllocation.driverId]);

    const vehicleTypeOptions = useMemo<SelectOption[]>(() => {
        const values = new Set<string>();
        (Array.isArray(vehicles) ? vehicles : []).forEach((vehicle: any) => {
            if (vehicle?.vehicleType) values.add(vehicle.vehicleType);
        });
        if (form.transportOrder.requiredVehicleType) {
            values.add(form.transportOrder.requiredVehicleType);
        }

        return [...values].map((value) => ({ label: value, value }));
    }, [form.transportOrder.requiredVehicleType, vehicles]);

    const capacityOptions = useMemo<SelectOption[]>(() => {
        const values = new Set<string>();
        (Array.isArray(vehicles) ? vehicles : []).forEach((vehicle: any) => {
            const value = String(vehicle?.vehicleCapacityTon || "").trim();
            if (value) values.add(value);
        });

        return [...values]
            .sort((a, b) => Number(a) - Number(b))
            .map((value) => ({
                label: `Minimum ${value} Ton`,
                value,
            }));
    }, [vehicles]);

    const locationOptions = useMemo<SelectOption[]>(() => {
        const values = new Set<string>();
        (Array.isArray(vehicles) ? vehicles : []).forEach((vehicle: any) => {
            if (vehicle?.currentLocation) values.add(vehicle.currentLocation);
        });

        return [...values].map((value) => ({ label: value, value }));
    }, [vehicles]);

    const filteredVehicles = useMemo(() => {
        return (Array.isArray(vehicles) ? vehicles : []).filter((vehicle: any) => {
            if (
                vehicleTypeFilter &&
                compactVehicleType(vehicle?.vehicleType) !==
                compactVehicleType(vehicleTypeFilter)
            ) {
                return false;
            }

            const capacity = toNumber(
                vehicle?.availableCapacityTon || vehicle?.vehicleCapacityTon,
            );

            if (capacityFilter && capacity < toNumber(capacityFilter)) {
                return false;
            }

            if (
                locationFilter &&
                String(vehicle?.currentLocation || "") !== locationFilter
            ) {
                return false;
            }

            return true;
        });
    }, [capacityFilter, locationFilter, vehicleTypeFilter, vehicles]);

    const documentsCount = useMemo(
        () => Object.values(form.documentsAssigned || {}).filter(Boolean).length,
        [form.documentsAssigned],
    );

    const closeScreen = () => {
        if (embedded) {
            onClose?.();
            return;
        }

        navigate(-1);
    };

    useEffect(() => {
        if (!propAllocationData) return;

        const merged = mergeTripAllocationForm(propAllocationData);

        setForm(merged);
        setVehicleLocked(true);
        setFormError("");
        setMessage("");
        initialVehicleVoucherRef.current = String(
            merged?.vehicleSelection?.selectedVehicleId || "",
        );
    }, [propAllocationData]);

    const fetchBaseData = useCallback(() => {
        dispatch(
            getTransportOrders({
                limit: 200,
                offset: 0,
                search: "",
                status: "open",
                priority: "",
            }),
        );

        dispatch(
            getActiveTripAllocations({
                limit: 200,
                offset: 0,
                search: "",
                tripStatus: "",
                priority: "",
            }),
        );

        if (parentUserMobileNumber) {
            dispatch(
                getAvailableDrivers({
                    parentUserMobileNumber,
                }),
            );
        }
    }, [dispatch, parentUserMobileNumber]);

    useEffect(() => {
        fetchBaseData();
    }, [fetchBaseData]);

    useEffect(() => {
        const loadAllocation = async () => {
            if (
                (!isEdit && !isView) ||
                !voucherNumber ||
                propAllocationData
            ) {
                return;
            }

            try {
                setPageLoading(true);
                setFormError("");

                const response = await dispatch(
                    getTripAllocationByVoucherNumber(voucherNumber),
                ).unwrap();

                const record = getTripAllocationRecord(response, voucherNumber);
                if (!record) {
                    setFormError("Trip allocation details were not found.");
                    return;
                }

                const merged = mergeTripAllocationForm(record);
                setForm(merged);
                setVehicleLocked(true);
                initialVehicleVoucherRef.current = String(
                    merged?.vehicleSelection?.selectedVehicleId || "",
                );

                if (isEdit && isAllocationClosed(merged)) {
                    setFormError(
                        "Completed trip allocation is read-only and cannot be edited.",
                    );
                }
            } catch (error: any) {
                setFormError(error?.message || "Failed to load trip allocation.");
            } finally {
                setPageLoading(false);
            }
        };

        loadAllocation();
    }, [
        dispatch,
        isEdit,
        isView,
        voucherNumber,
        propAllocationData,
    ]);

    useEffect(() => {
        const selectedOrderNumber = form.transportOrder.transportOrderNumber;
        if (!selectedOrderNumber) return;

        dispatch(
            getVehicleMasterVehicles({
                requiredWeight: form.transportOrder.requiredWeightTon,
                transportOrder: form.transportOrder,
            }),
        );
    }, [
        dispatch,
        form.transportOrder.requiredWeightTon,
        form.transportOrder.transportOrderNumber,
    ]);

    useEffect(() => {
        if (
            vehicleLocked ||
            isView ||
            vehiclesLoader ||
            !form.transportOrder.transportOrderNumber ||
            !vehicles.length
        ) {
            return;
        }

        const picked = selectBestVehicle(vehicles, form.transportOrder, {
            vehicleTypeFilter,
            capacityFilter,
            locationFilter,
        });

        if (!picked) return;

        setForm((previous: any) => ({
            ...previous,
            vehicleSelection: {
                ...previous.vehicleSelection,
                ...picked,
                ownershipType:
                    normalizeOwnershipType(picked.ownershipType) ||
                    previous.vehicleSelection.ownershipType ||
                    "",
                customerCode:
                    picked.customerCode || previous.transportOrder.customerCode || "",
                customerName:
                    picked.customerName || previous.transportOrder.customerName || "",
                supportsRequiredWeight:
                    getRequiredCapacity(previous.transportOrder) === 0 ||
                    toNumber(picked.availableCapacityTon || picked.vehicleCapacityTon) >=
                    getRequiredCapacity(previous.transportOrder),
            },
        }));
    }, [
        capacityFilter,
        form.transportOrder,
        isView,
        locationFilter,
        vehicleLocked,
        vehicleTypeFilter,
        vehicles,
        vehiclesLoader,
    ]);

    const handleTransportOrderSelect = async (selectedVoucher: string) => {
        if (!selectedVoucher || screenDisabled) return;

        try {
            setPageLoading(true);
            setFormError("");

            const response = await dispatch(
                getTransportOrderByVoucherNumber(selectedVoucher),
            ).unwrap();

            const order = getTransportOrderRecord(response, selectedVoucher);
            if (!order) {
                setFormError("Transport order details were not found.");
                return;
            }

            const mappedOrder = mapTransportOrderToAllocation(order);

            setForm((previous: any) => ({
                ...previous,
                transportOrder: mappedOrder,
                routesData: buildRoutesDataFromTransportOrder(order),
                vehicleSelection: createInitialTripAllocation().vehicleSelection,
                tripPlan: {
                    ...previous.tripPlan,
                    plannedStartDateTime:
                        order?.pickupDetails?.pickupDateTime ||
                        previous.tripPlan.plannedStartDateTime,
                    expectedDeliveryDateTime:
                        order?.deliveryDetails?.expectedDeliveryDateTime ||
                        previous.tripPlan.expectedDeliveryDateTime,
                    routeDistanceKm:
                        order?.routeDetails?.routeDistanceKm ||
                        previous.tripPlan.routeDistanceKm,
                    routeType:
                        order?.routeDetails?.routeType || previous.tripPlan.routeType,
                    estimatedTollAmount:
                        order?.routeDetails?.expectedTollAmount ||
                        previous.tripPlan.estimatedTollAmount,
                },
            }));

            setVehicleTypeFilter(mappedOrder.requiredVehicleType || "");
            setCapacityFilter(
                String(
                    mappedOrder.requiredWeightTon ||
                    mappedOrder.requiredCapacityTon ||
                    "",
                ),
            );
            setLocationFilter("");
            setVehicleLocked(false);
        } catch (error: any) {
            setFormError(error?.message || "Failed to load transport order details.");
        } finally {
            setPageLoading(false);
        }
    };

    const handleVehicleSelect = (vehicle: any) => {
        if (screenDisabled || vehicleLocked || !isVehicleAvailable(vehicle)) {
            return;
        }

        const requiredCapacity = getRequiredCapacity(form.transportOrder);
        const availableCapacity = toNumber(
            vehicle?.availableCapacityTon || vehicle?.vehicleCapacityTon,
        );

        setForm((previous: any) => ({
            ...previous,
            vehicleSelection: {
                ...previous.vehicleSelection,
                ...vehicle,
                ownershipType:
                    normalizeOwnershipType(vehicle.ownershipType) ||
                    previous.vehicleSelection.ownershipType ||
                    "",
                customerCode:
                    vehicle.customerCode || previous.transportOrder.customerCode || "",
                customerName:
                    vehicle.customerName || previous.transportOrder.customerName || "",
                supportsRequiredWeight:
                    requiredCapacity === 0 || availableCapacity >= requiredCapacity,
            },
        }));
    };

    const handleDriverSelect = async (driverId: string) => {
        if (screenDisabled) return;

        const selected = drivers.find(
            (driver: any) => driver.driverId === driverId,
        );
        if (!selected) return;

        const applyDriver = (value: any) => {
            const details = extractDriverDetails(value);

            setForm((previous: any) => ({
                ...previous,
                driverAllocation: {
                    ...previous.driverAllocation,
                    driverId: selected.driverId,
                    driverName: selected.driverName,
                    mobileNumber: details.mobileNumber || selected.mobileNumber || "",
                    licenseNumber: details.licenseNumber || selected.licenseNumber || "",
                    licenseExpiryDate:
                        details.licenseExpiryDate || selected.licenseExpiryDate || "",
                },
            }));
        };

        applyDriver(selected);

        try {
            const response = await dispatch(getChildUserByMobile(driverId)).unwrap();

            const child =
                response?.data?.ChildUsers ||
                response?.ChildUsers ||
                response?.data ||
                response;

            applyDriver({ ...selected, ...child, rawChild: child });
        } catch (error) {
            console.log("Driver detail fetch failed", error);
        }
    };

    const handleHelperSelect = (helperName: string) => {
        const selected = drivers.find(
            (driver: any) => driver.driverName === helperName,
        );

        setForm((previous: any) => ({
            ...previous,
            driverAllocation: {
                ...previous.driverAllocation,
                helperAssigned: Boolean(helperName),
                helperName: helperName || "",
                helperMobile: selected?.mobileNumber || "",
            },
        }));
    };

    const validateForm = (): boolean => {
        if (isView) return false;

        if (isAllocationClosed(form)) {
            setFormError("Completed trip allocation cannot be edited.");
            return false;
        }

        if (!form.transportOrder.transportOrderNumber) {
            setFormError("Transport order number is required.");
            return false;
        }

        if (!form.vehicleSelection.selectedVehicleId) {
            setFormError("Please select an available vehicle.");
            return false;
        }

        if (!form.vehicleSelection.supportsRequiredWeight) {
            setFormError(
                "Selected vehicle capacity is lower than the required load weight.",
            );
            return false;
        }

        if (!form.driverAllocation.driverId) {
            setFormError("Please select a driver.");
            return false;
        }

        const ownershipType = normalizeOwnershipType(
            form.vehicleSelection.ownershipType,
        );

        if (!ownershipType) {
            setFormError("Please select Ownership Type.");
            return false;
        }

        if (
            ownershipType === "market" &&
            !String(form.vehicleSelection.vendorName || "").trim()
        ) {
            setFormError("Market vehicle requires Vendor Name.");
            return false;
        }

        const assignment = driverAssignmentMap[form.driverAllocation.driverId];
        if (
            assignment &&
            (!isEdit || assignment.allocationVoucher !== voucherNumber)
        ) {
            setFormError(
                `${form.driverAllocation.driverName || "This driver"} is already assigned to trip ${assignment.allocationVoucher}.`,
            );
            return false;
        }

        const plannedStart = new Date(form.tripPlan.plannedStartDateTime);
        const expectedDelivery = new Date(form.tripPlan.expectedDeliveryDateTime);

        if (
            !Number.isNaN(plannedStart.getTime()) &&
            !Number.isNaN(expectedDelivery.getTime()) &&
            expectedDelivery < plannedStart
        ) {
            setFormError("Expected Delivery cannot be earlier than Planned Start.");
            return false;
        }

        setFormError("");
        return true;
    };

    const syncVehicleStatuses = async (newVehicleVoucher: string) => {
        const previousVehicleVoucher = initialVehicleVoucherRef.current;
        const warnings: string[] = [];

        if (
            previousVehicleVoucher &&
            previousVehicleVoucher !== newVehicleVoucher
        ) {
            try {
                await updateVehicleMasterStatus({
                    vehicleVoucher: previousVehicleVoucher,
                    nextStatus: "Available",
                });
            } catch (error: any) {
                warnings.push(
                    error?.message || "Previous vehicle status update failed.",
                );
            }
        }

        if (newVehicleVoucher) {
            try {
                await updateVehicleMasterStatus({
                    vehicleVoucher: newVehicleVoucher,
                    nextStatus: "Allocated",
                });
            } catch (error: any) {
                warnings.push(
                    error?.message || "Selected vehicle status update failed.",
                );
            }
        }

        return warnings;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        const driverName = form.driverAllocation.driverName || "selected driver";
        const vehicleNumber = form.vehicleSelection.vehicleNumber || "-";
        const actionText = isEdit ? "update" : "allocate";

        const confirmed = window.confirm(
            `Do you want to ${actionText} this trip?\n\nDriver: ${driverName}\nVehicle: ${vehicleNumber}\nTransport Order: ${form.transportOrder.transportOrderNumber}`,
        );

        if (!confirmed) return;

        try {
            setPageLoading(true);
            setFormError("");
            setMessage("");

            const payload = toTripAllocationPayload({
                ...form,
                tripStatus: isAllocationClosed(form) ? form.tripStatus : "pending",
            });

            let savedVoucher = voucherNumber;

            if (isEdit) {
                await dispatch(
                    updateTripAllocationByVoucherNumber({
                        voucherNumber,
                        updateData: payload,
                    }),
                ).unwrap();
            } else {
                const response = await dispatch(createTripAllocation(payload)).unwrap();

                const saved = response?.data || response || {};
                savedVoucher = getAllocationVoucher(saved);
            }

            const selectedVehicleVoucher = String(
                form.vehicleSelection.selectedVehicleId || "",
            );
            const warnings = await syncVehicleStatuses(selectedVehicleVoucher);

            initialVehicleVoucherRef.current = selectedVehicleVoucher;

            setMessage(
                warnings.length
                    ? `Trip allocation saved, but ${warnings[0]}`
                    : isEdit
                        ? "Trip allocation updated successfully."
                        : `Trip allocated successfully${savedVoucher ? ` (${savedVoucher})` : ""}.`,
            );

            if (embedded) {
                onSaved?.();
            } else {
                window.setTimeout(() => navigate(-1), 700);
            }
        } catch (error: any) {
            setFormError(
                error?.message ||
                error?.response?.data?.message ||
                "Trip allocation failed.",
            );
        } finally {
            setPageLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchBaseData();

        if (form.transportOrder.transportOrderNumber) {
            dispatch(
                getVehicleMasterVehicles({
                    requiredWeight: form.transportOrder.requiredWeightTon,
                    transportOrder: form.transportOrder,
                }),
            );
        }
    };

    const title = isView
        ? "View Trip Allocation"
        : isEdit
            ? "Edit Trip Allocation"
            : "Create Trip Allocation";

    const ownershipType = normalizeOwnershipType(
        form.vehicleSelection.ownershipType,
    );

    return (
        <main className="min-h-full bg-background p-4 text-foreground">
            {(pageLoading || detailLoader || transportOrderDetailLoading) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
                    <div className="flex items-center gap-3 rounded-md border border-border bg-card px-5 py-4 shadow-xl">
                        <LoaderCircle className="animate-spin text-primary" />
                        <span className="text-sm font-semibold">Please wait...</span>
                    </div>
                </div>
            )}

            {/* <header className="mb-4 flex flex-col justify-between gap-4 rounded-md border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={closeScreen}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background transition hover:bg-muted"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h1 className="text-xl font-bold text-card-foreground">{title}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {voucherNumber
                                ? `Allocation: ${voucherNumber}`
                                : "Assign an open transport order to a vehicle and driver."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                activeAllocationsLoader ||
                                    driversLoader ||
                                    transportOrdersLoading
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>

                    {!isView && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || isAllocationClosed(form)}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {isEdit ? "Update Allocation" : "Allocate Trip"}
                        </button>
                    )}
                </div>
            </header> */}

            {formError && (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {formError}
                </div>
            )}

            {message && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 size={17} />
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-4">
                    <SectionCard title="Transport Order" icon={<Truck size={18} />}>
                        <SelectField
                            label="Select Transport Order"
                            mandatory
                            largeData
                            value={form.transportOrder.transportOrderNumber}
                            onChange={handleTransportOrderSelect}
                            options={transportOrderOptions}
                            placeholder={
                                transportOrdersLoading
                                    ? "Loading transport orders..."
                                    : "Select Transport Order"
                            }
                            disabled={screenDisabled || transportOrdersLoading}
                        />

                        {form.transportOrder.transportOrderNumber && (
                            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <SummaryTile
                                    label="Required Vehicle"
                                    value={form.transportOrder.requiredVehicleType || "-"}
                                />
                                <SummaryTile
                                    label="Required Capacity"
                                    value={`${formatIndianNumber(
                                        form.transportOrder.requiredCapacityTon,
                                    )} Ton`}
                                />
                                <SummaryTile
                                    label="Load Type"
                                    value={form.transportOrder.loadType || "-"}
                                />
                                <SummaryTile
                                    label="Total Weight"
                                    value={`${formatIndianNumber(
                                        form.transportOrder.requiredWeightTon,
                                    )} Ton`}
                                />
                            </div>
                        )}

                        {form.transportOrder.transportOrderNumber && (
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <SummaryTile
                                    label="Customer"
                                    value={form.transportOrder.customerName}
                                />
                                <SummaryTile
                                    label="Material"
                                    value={form.transportOrder.materialName}
                                />
                                <SummaryTile
                                    label="Source"
                                    value={form.transportOrder.source}
                                />
                                <SummaryTile
                                    label="Destination"
                                    value={form.transportOrder.destination}
                                />
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard title="1. Assigned Vehicle" icon={<Truck size={18} />}>
                        {form.transportOrder.transportOrderNumber ? (
                            <>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <SelectField
                                        label="Vehicle Type"
                                        value={vehicleTypeFilter}
                                        onChange={(value) => {
                                            setVehicleTypeFilter(value);
                                            setVehicleLocked(false);
                                        }}
                                        options={vehicleTypeOptions}
                                        placeholder="All Types"
                                        disabled={screenDisabled}
                                    />
                                    <SelectField
                                        label="Minimum Capacity"
                                        value={capacityFilter}
                                        onChange={(value) => {
                                            setCapacityFilter(value);
                                            setVehicleLocked(false);
                                        }}
                                        options={capacityOptions}
                                        placeholder="All Capacities"
                                        disabled={screenDisabled}
                                    />
                                    <SelectField
                                        label="Location"
                                        value={locationFilter}
                                        onChange={(value) => {
                                            setLocationFilter(value);
                                            setVehicleLocked(false);
                                        }}
                                        options={locationOptions}
                                        placeholder="All Locations"
                                        disabled={screenDisabled}
                                    />
                                </div>

                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <SelectField
                                        label="Ownership Type"
                                        mandatory
                                        value={ownershipType}
                                        onChange={(value) =>
                                            update(
                                                "vehicleSelection",
                                                "ownershipType",
                                                normalizeOwnershipType(value),
                                            )
                                        }
                                        options={OWNERSHIP_TYPE_OPTIONS}
                                        placeholder="Select Ownership Type"
                                        disabled={screenDisabled}
                                    />

                                    {ownershipType === "market" && (
                                        <>
                                            <TextField
                                                label="Vendor Code"
                                                value={form.vehicleSelection.vendorCode}
                                                onChange={(value) =>
                                                    update("vehicleSelection", "vendorCode", value)
                                                }
                                                disabled={screenDisabled}
                                            />
                                            <TextField
                                                label="Vendor Name *"
                                                value={form.vehicleSelection.vendorName}
                                                onChange={(value) =>
                                                    update("vehicleSelection", "vendorName", value)
                                                }
                                                disabled={screenDisabled}
                                            />
                                        </>
                                    )}
                                </div>

                                {vehiclesLoader ? (
                                    <div className="mt-4 flex items-center justify-center gap-2 rounded-md border border-border bg-muted/30 py-8 text-sm text-muted-foreground">
                                        <LoaderCircle className="animate-spin" />
                                        Loading available vehicles...
                                    </div>
                                ) : (
                                    <div className="mt-4 grid max-h-[340px] grid-cols-1 gap-3 overflow-auto pr-1 lg:grid-cols-2">
                                        {filteredVehicles.length ? (
                                            filteredVehicles.map((vehicle: any, index: number) => {
                                                const selected =
                                                    form.vehicleSelection.selectedVehicleId ===
                                                    vehicle.selectedVehicleId;
                                                const available = isVehicleAvailable(vehicle);

                                                return (
                                                    <button
                                                        key={
                                                            vehicle.selectedVehicleId ||
                                                            vehicle.vehicleNumber ||
                                                            index
                                                        }
                                                        type="button"
                                                        disabled={
                                                            screenDisabled || vehicleLocked || !available
                                                        }
                                                        onClick={() => handleVehicleSelect(vehicle)}
                                                        className={`rounded-md border p-3 text-left transition ${selected
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                            : "border-border bg-background hover:border-primary/50"
                                                            } ${!available ? "cursor-not-allowed opacity-60" : ""
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="font-bold text-card-foreground">
                                                                    {vehicle.vehicleNumber || "-"}
                                                                </div>
                                                                <div className="mt-1 text-xs text-muted-foreground">
                                                                    {vehicle.vehicleType || "-"}
                                                                    {vehicle.vehicleBodyType
                                                                        ? ` | ${vehicle.vehicleBodyType}`
                                                                        : ""}
                                                                </div>
                                                            </div>
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-[11px] font-bold ${vehicleStatusClass(
                                                                    vehicle.availabilityStatus,
                                                                )}`}
                                                            >
                                                                {vehicle.availabilityStatus || "Available"}
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Capacity:
                                                                </span>{" "}
                                                                <b>{vehicle.vehicleCapacityTon || 0} Ton</b>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Available:
                                                                </span>{" "}
                                                                <b>{vehicle.availableCapacityTon || 0} Ton</b>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <span className="text-muted-foreground">
                                                                    Location:
                                                                </span>{" "}
                                                                <b>{vehicle.currentLocation || "-"}</b>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                                                No vehicles match the selected order and filters.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {form.vehicleSelection.selectedVehicleId && (
                                    <div
                                        className={`mt-4 rounded-md border p-4 ${vehicleLocked && isEdit
                                            ? "border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
                                            : "border-primary/30 bg-primary/5"
                                            }`}
                                    >
                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                            <div>
                                                <div className="font-bold text-card-foreground">
                                                    Selected Vehicle:{" "}
                                                    {form.vehicleSelection.vehicleNumber || "-"}
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {form.vehicleSelection.vehicleType || "-"}
                                                    {form.vehicleSelection.vehicleBodyType
                                                        ? ` | ${form.vehicleSelection.vehicleBodyType}`
                                                        : ""}
                                                </div>
                                            </div>
                                            {!screenDisabled && (
                                                <button
                                                    type="button"
                                                    onClick={() => setVehicleLocked(false)}
                                                    className="inline-flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-background px-3 py-2 text-sm font-semibold text-primary"
                                                >
                                                    <RefreshCw size={15} />
                                                    {vehicleLocked ? "Change Vehicle" : "Re-pick Vehicle"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                                Select a transport order first.
                            </div>
                        )}
                    </SectionCard>
                </div>

                <div className="space-y-4">
                    <SectionCard title="2. Driver Details" icon={<UserRound size={18} />}>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <SelectField
                                label="Driver"
                                mandatory
                                largeData
                                value={form.driverAllocation.driverId}
                                onChange={handleDriverSelect}
                                options={driverOptions}
                                placeholder={
                                    driversLoader ? "Loading team members..." : "Select Driver"
                                }
                                disabled={screenDisabled || driversLoader}
                            />
                            <TextField
                                label="Driver Mobile"
                                value={form.driverAllocation.mobileNumber}
                                disabled
                            />
                            <TextField
                                label="License Number"
                                value={form.driverAllocation.licenseNumber}
                                disabled
                            />
                            <TextField
                                label="License Expiry"
                                value={formatDate(form.driverAllocation.licenseExpiryDate)}
                                disabled
                            />
                        </div>
                    </SectionCard>

                    <SectionCard title="3. Trip Plan" icon={<CalendarDays size={18} />}>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <TextField
                                label="Planned Start"
                                type="datetime-local"
                                value={toDateTimeLocalValue(form.tripPlan.plannedStartDateTime)}
                                onChange={(value) =>
                                    update(
                                        "tripPlan",
                                        "plannedStartDateTime",
                                        fromDateTimeLocalValue(value),
                                    )
                                }
                                disabled={screenDisabled}
                            />
                            <TextField
                                label="Expected Delivery"
                                type="datetime-local"
                                value={toDateTimeLocalValue(
                                    form.tripPlan.expectedDeliveryDateTime,
                                )}
                                onChange={(value) =>
                                    update(
                                        "tripPlan",
                                        "expectedDeliveryDateTime",
                                        fromDateTimeLocalValue(value),
                                    )
                                }
                                disabled={screenDisabled}
                            />
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-md border border-border bg-muted/30 p-4">
                                <MapPin className="text-primary" size={20} />
                                <div className="mt-2 text-xs font-semibold text-muted-foreground">
                                    Approx. Distance
                                </div>
                                <div className="mt-1 text-lg font-bold text-card-foreground">
                                    {formatIndianNumber(form.tripPlan.routeDistanceKm)} KM
                                </div>
                            </div>
                            <div className="rounded-md border border-border bg-muted/30 p-4">
                                <IndianRupee className="text-primary" size={20} />
                                <div className="mt-2 text-xs font-semibold text-muted-foreground">
                                    Estimated Toll
                                </div>
                                <div className="mt-1 text-lg font-bold text-card-foreground">
                                    ₹ {formatIndianNumber(form.tripPlan.estimatedTollAmount)}
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="4. Additional Details"
                        icon={<FileText size={18} />}
                    >
                        <SelectField
                            label="Helper / Cleaner"
                            largeData
                            value={form.driverAllocation.helperName}
                            onChange={handleHelperSelect}
                            options={helperOptions}
                            placeholder="No Helper"
                            disabled={screenDisabled || driversLoader}
                        />

                        <button
                            type="button"
                            onClick={() => setDocumentsOpen(true)}
                            className="mt-3 flex w-full items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-left transition hover:bg-muted"
                        >
                            <span className="font-semibold text-foreground">
                                Documents Assigned
                            </span>
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                                {documentsCount}
                            </span>
                        </button>

                        <div className="mt-3">
                            <FieldLabel>Remarks</FieldLabel>
                            <textarea
                                rows={4}
                                value={form.remarks || ""}
                                disabled={screenDisabled}
                                maxLength={REMARKS_MAX}
                                onChange={(event) =>
                                    setForm((previous: any) => ({
                                        ...previous,
                                        remarks: event.target.value.slice(0, REMARKS_MAX),
                                    }))
                                }
                                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-muted"
                            />
                            <div className="mt-1 text-right text-xs text-muted-foreground">
                                {(form.remarks || "").length}/{REMARKS_MAX}
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Tracking Preferences" icon={<MapPin size={18} />}>
                        <div className="grid grid-cols-1 gap-3">
                            <ToggleField
                                label="GPS Tracking Enabled"
                                checked={Boolean(form.trackingConfig.gpsTrackingEnabled)}
                                onChange={(checked) =>
                                    update("trackingConfig", "gpsTrackingEnabled", checked)
                                }
                                disabled={screenDisabled}
                            />
                            <ToggleField
                                label="POD Required"
                                checked={Boolean(form.trackingConfig.podRequired)}
                                onChange={(checked) =>
                                    update("trackingConfig", "podRequired", checked)
                                }
                                disabled={screenDisabled}
                            />
                            <ToggleField
                                label="Live Location Sharing"
                                checked={Boolean(form.trackingConfig.liveLocationSharing)}
                                onChange={(checked) =>
                                    update("trackingConfig", "liveLocationSharing", checked)
                                }
                                disabled={screenDisabled}
                            />
                        </div>
                    </SectionCard>
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-3 rounded-md border border-border bg-card p-4 shadow-sm">
                <button
                    type="button"
                    onClick={closeScreen}
                    className="rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                    {isView ? "Back" : "Cancel"}
                </button>

                {!isView && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || isAllocationClosed(form)}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? (
                            <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isEdit ? "Update Allocation" : "Allocate Trip"}
                    </button>
                )}
            </div>

            {documentsOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-md rounded-md border border-border bg-card p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-card-foreground">
                                Documents Assigned
                            </h2>
                            <button
                                type="button"
                                onClick={() => setDocumentsOpen(false)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {[
                                ["invoiceAttached", "Invoice Attached"],
                                ["ewayBillAttached", "E-Way Bill Attached"],
                                ["deliveryChallanAttached", "Delivery Challan Attached"],
                                ["insuranceCopyAttached", "Insurance Copy Attached"],
                            ].map(([key, label]) => (
                                <ToggleField
                                    key={key}
                                    label={label}
                                    checked={Boolean(form.documentsAssigned?.[key])}
                                    onChange={(checked) =>
                                        setForm((previous: any) => ({
                                            ...previous,
                                            documentsAssigned: {
                                                ...previous.documentsAssigned,
                                                [key]: checked,
                                            },
                                        }))
                                    }
                                    disabled={screenDisabled}
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setDocumentsOpen(false)}
                            className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default CreateEditTripAllocationRegistration;