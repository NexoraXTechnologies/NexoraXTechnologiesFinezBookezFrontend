import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    ChevronRight,
    Clock,
    MapPin,
    Navigation,
    RefreshCcw,
    Search,
    Truck,
    X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    getConsolidatedVehicles,
    getTripTrackingVoucher,
    getWhereIsMyDriverList,
} from "../../../../redux/slices/professionalSlice/transportation/whereIsMyDriverSlice";

/* ===================================================
   ANIMATION VARIANTS
=================================================== */

const pageVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            duration: 0.25,
            staggerChildren: 0.08,
        },
    },
};

const sectionVariants: any = {
    hidden: { opacity: 0, y: 18 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: "easeOut",
        },
    },
};

const gridVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.045,
        },
    },
};

const cardVariants: any = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        y: 10,
        scale: 0.98,
        transition: {
            duration: 0.2,
        },
    },
};

/* ===================================================
   HELPERS
=================================================== */

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

const getDriverName = (item: any) => {
    return item?.driver?.driverName || item?.driverName || "Vehicle";
};

const getVehicleNumber = (item: any) => {
    return item?.vehicle?.vehicleNumber || item?.vehicleNumber || "-";
};

const getTripLabel = (item: any) => {
    const trackingVoucher = getTripTrackingVoucher(item);

    return item?.transportOrderNumber || item?.tripNumber || trackingVoucher || "-";
};

const getLastUpdated = (item: any) => {
    return (
        item?.lastUpdatedAt ||
        item?.updatedAt ||
        item?.currentLocation?.updatedAt ||
        item?.currentLocation?.timestamp ||
        ""
    );
};

const getDriverIdentity = (item: any) => String(
    item?.driver?.driverCode ||
    item?.driver?.mobileNumber ||
    item?.driver?.driverMobile ||
    item?.driverMobile ||
    item?.mobileNumber ||
    item?.assignedDriverMobile ||
    item?.driver?.driverName ||
    item?.driverName ||
    ""
).trim().toLowerCase();

const getTrackingTime = (item: any) => new Date(
    item?.lastUpdatedAt ||
    item?.updatedAt ||
    item?.modifiedOn ||
    item?.currentLocation?.updatedAt ||
    item?.currentLocation?.timestamp ||
    0
).getTime();

const hasCurrentLatLng = (item: any) => {
    const lat = item?.currentLocation?.lat;
    const lng = item?.currentLocation?.lng;
    if (lat === undefined || lat === null || lat === "") return false;
    if (lng === undefined || lng === null || lng === "") return false;
    return !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
};

/* ⭐ ADDED — LIVE / CLOSED STATUS HELPERS */
const isClosedTrip = (item: any) => {
    const status = String(item?.tripStatus || item?.status || "").toLowerCase().trim();

    return (
        status === "delivered" ||
        status === "completed" ||
        status === "closed" ||
        status === "close"
    );
};

const getTripStatusLabel = (item: any) => {
    const status = String(item?.tripStatus || item?.status || "");

    if (!status) return "Live";

    return status
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

/* ===================================================
   SELECT BOX
=================================================== */

const SelectBox = ({
    value,
    onChange,
    options = [],
}: {
    value: string;
    onChange: (value: string) => void;
    options: any[];
}) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="
                h-10 w-full rounded-md border border-border bg-background px-3
                text-sm text-foreground outline-none transition
                focus:border-primary focus:ring-2 focus:ring-primary/10
            "
        >
            {options.map((option: any) => (
                <option key={option.value || option.label} value={option.value}>
                    {option.label}
                    {option.subtitle ? ` - ${option.subtitle}` : ""}
                </option>
            ))}
        </select>
    );
};

/* ===================================================
   DRIVER CARD
=================================================== */

const DriverCard = ({
    item,
    onTrack,
}: {
    item: any;
    onTrack: (item: any) => void;
}) => {
    const driverName = getDriverName(item);
    const vehicleNumber = getVehicleNumber(item);
    const tripLabel = getTripLabel(item);
    const lastUpdated = getLastUpdated(item);

    /* ⭐ ADDED — STATUS FOR CARD */
    const closed = isClosedTrip(item);
    const statusLabel = getTripStatusLabel(item);

    return (
        <motion.div
            layout
            variants={cardVariants}
            exit="exit"
            whileHover={{
                y: -4,
                scale: 1.01,
                transition: { duration: 0.18 },
            }}
            className="
                group relative overflow-hidden rounded-md border border-border
                bg-gradient-to-br from-blue-500/10 to-card p-3 shadow-sm
                transition-shadow duration-200 hover:shadow-md
            "
        >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition group-hover:scale-110" />

            <div className="relative">
                <div className="flex items-start gap-3">
                    <motion.div
                        whileHover={{ rotate: -4, scale: 1.06 }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    >
                        <Truck size={24} />
                    </motion.div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="truncate text-sm font-bold text-card-foreground">
                                    {driverName}
                                </h3>

                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                    Trip: {tripLabel}
                                </p>
                            </div>

                            {/* ⭐ CHANGED — STATUS IS NOW DYNAMIC */}
                            <span
                                className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${closed
                                    ? "border-slate-200 bg-slate-100 text-slate-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    }`}
                            >
                                {!closed && (
                                    <motion.span
                                        animate={{ scale: [1, 1.3, 1] }}
                                        transition={{
                                            duration: 1.4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                        className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                                    />
                                )}

                                {statusLabel}
                            </span>
                        </div>

                        <div className="mt-4 border-t border-border/70 pt-3">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Vehicle
                                    </p>

                                    <p className="mt-1 truncate text-sm font-semibold text-card-foreground">
                                        {vehicleNumber}
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Tracking Voucher
                                    </p>

                                    <p className="mt-1 truncate text-sm font-semibold text-card-foreground">
                                        {getTripTrackingVoucher(item) || "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Current Location
                                </p>

                                <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-card-foreground">
                                    {item?.currentAddress || "Fetching address..."}
                                </p>
                            </div>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="inline-flex min-w-0 items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                                    <Clock size={15} />

                                    <p className="truncate text-xs font-medium">
                                        Last updated: {formatDateTime(lastUpdated)}
                                    </p>
                                </div>

                                <motion.button
                                    type="button"
                                    onClick={() => onTrack(item)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="
                                        inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-md
                                        bg-primary px-3 text-xs font-bold text-primary-foreground
                                        shadow-sm transition hover:bg-primary/90
                                    "
                                >
                                    <Navigation size={14} />
                                    Track Vehicle
                                    <ChevronRight size={14} />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/* ===================================================
   SKELETON CARD
=================================================== */

const SkeletonCard = ({ index }: { index: number }) => {
    return (
        <motion.div
            variants={cardVariants}
            custom={index}
            className="h-[220px] overflow-hidden rounded-md border border-border bg-card p-3 shadow-sm"
        >
            <motion.div
                className="h-full w-full"
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{
                    duration: 1.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.05,
                }}
            >
                <div className="flex gap-3">
                    <div className="h-11 w-11 rounded-md bg-muted" />

                    <div className="flex-1">
                        <div className="h-5 w-1/2 rounded-md bg-muted" />
                        <div className="mt-2 h-4 w-1/3 rounded-md bg-muted" />
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <div className="h-4 rounded-md bg-muted" />
                    <div className="h-4 w-5/6 rounded-md bg-muted" />
                    <div className="h-10 rounded-md bg-muted" />
                    <div className="h-9 w-1/3 rounded-md bg-muted" />
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ===================================================
   MAIN COMPONENT
=================================================== */

const WhereIsMyDriver = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();

    const { drivers, consolidatedVehicle, listingLoader, error } = useSelector(
        (state: any) => state.whereIsMyDriver
    );

    const [selectedDriver, setSelectedDriver] = useState("all");

    /* ⭐ ADDED — DEFAULT TAB IS LIVE */
    const [activeTab, setActiveTab] = useState<"live" | "closed">("live");

    const [search, setSearch] = useState("");

    /* ⭐ CHANGED — LATEST VALID GPS RECORD PER DRIVER */
    const latestDriverRecords = useMemo(() => {
        const latestMap = new Map<string, any>();

        (drivers || [])
            .filter((item: any) => hasCurrentLatLng(item))
            .forEach((item: any, index: number) => {
                const driverKey = getDriverIdentity(item);
                const key = driverKey || `unknown-${getTripTrackingVoucher(item) || index}`;
                const existing = latestMap.get(key);

                if (!existing || getTrackingTime(item) >= getTrackingTime(existing)) latestMap.set(key, item);
            });

        return Array.from(latestMap.values()).sort((a: any, b: any) => getTrackingTime(b) - getTrackingTime(a));
    }, [drivers]);

    const liveDrivers = useMemo(() => latestDriverRecords.filter((item: any) => !isClosedTrip(item)), [latestDriverRecords]);
    const closedDrivers = useMemo(() => latestDriverRecords.filter((item: any) => isClosedTrip(item)), [latestDriverRecords]);

    const liveCount = liveDrivers.length;
    const closedCount = closedDrivers.length;

    const fetchDrivers = () => {
        dispatch(
            getWhereIsMyDriverList({
                limit: 100,
                offset: 0,
            }) as any
        );
    };

    useEffect(() => {
        dispatch(
            getConsolidatedVehicles({
                limit: 100,
                offset: 0,
            })
        );
    }, [dispatch]);

    useEffect(() => {
        fetchDrivers();

        const timer = window.setInterval(() => {
            fetchDrivers();
        }, 10000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    const driverOptions = useMemo(() => {
        return [
            {
                label: "All Assigned Drivers",
                value: "all",
            },
            ...latestDriverRecords.map((item: any) => ({
                label: getDriverName(item),
                value: getDriverIdentity(item),
                subtitle: getVehicleNumber(item),
            })),
        ];
    }, [latestDriverRecords]);

    /* ⭐ CHANGED — FILTER BY ACTIVE TAB FIRST */
    const filteredDrivers = useMemo(() => {
        const tabRecords = activeTab === "live" ? liveDrivers : closedDrivers;

        return tabRecords.filter((item: any) => {
            if (selectedDriver !== "all") {
                if (getDriverIdentity(item) !== selectedDriver) return false;
            }

            if (search.trim()) {
                const text = [
                    getDriverName(item),
                    getVehicleNumber(item),
                    getTripLabel(item),
                    getTripTrackingVoucher(item),
                    item?.currentAddress,
                    item?.tripStatus,
                ]
                    .join(" ")
                    .toLowerCase();

                if (!text.includes(search.trim().toLowerCase())) return false;
            }

            return true;
        });
    }, [liveDrivers, closedDrivers, activeTab, selectedDriver, search]);

    console.log({ drivers });

    const handleBack = () => {
        navigate(-1);
    };

    const resetFilters = () => {
        setSelectedDriver("all");
        setSearch("");
    };

    const handleConsolidateVehicle = () => {
        const vehicles = consolidatedVehicle || [];

        if (!vehicles.length) {
            toast.error("No vehicle tracking data found");
            return;
        }

        navigate("/bookEz/transportation/consolidated-vehicle-view", {
            state: { vehicles },
        });
    };

    const openDriverMap = (item: any) => {
        console.log({ item });

        const trackingVoucher = getTripTrackingVoucher(item);

        if (!trackingVoucher) {
            toast.error("Tracking voucher not found");
            return;
        }

        navigate("/bookEz/transportation/live-trip-tracking", {
            state: {
                isDriverMode: false,
                trackingVoucherNumber: trackingVoucher,
                followDriver: true,
                tripLabel: getTripLabel(item),
                initialCurrentLocation: item?.currentLocation || null,
                initialTracking: item,
            },
        });
    };

    const hasFilter = selectedDriver !== "all" || Boolean(search);

    /* ⭐ CHANGED — COUNT BASED ON SELECTED TAB */
    const totalDrivers = activeTab === "live" ? liveCount : closedCount;
    const showingDrivers = filteredDrivers.length;

    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="show"
            className="min-h-screen bg-background p-3"
        >
            <div className="mx-auto flex w-full flex-col gap-3">
                {/* ACTION BAR */}
                <motion.div
                    variants={sectionVariants}
                    className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between"
                >
                    <div className="flex items-center">
                        <motion.button
                            type="button"
                            onClick={handleBack}
                            whileHover={{ x: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            className="me-3 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                            title="Go back"
                        >
                            <ArrowLeft size={20} />
                        </motion.button>

                        <div>
                            <h2 className="text-lg font-bold text-card-foreground">
                                Where Is My Vehicle?
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {listingLoader
                                    ? "Finding active drivers..."
                                    : `${activeTab === "live" ? "Live" : "Closed"} trips: ${totalDrivers} • Showing: ${showingDrivers}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <AnimatePresence>
                            {hasFilter && (
                                <motion.button
                                    key="reset-filter"
                                    type="button"
                                    onClick={resetFilters}
                                    initial={{ opacity: 0, scale: 0.95, x: 8 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, x: 8 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="
                                        inline-flex h-10 items-center gap-2 rounded-md border border-border
                                        bg-background px-3 text-sm font-medium text-muted-foreground
                                        transition hover:bg-muted
                                    "
                                >
                                    <X size={16} />
                                    Reset Filters
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* ⭐ ADDED — LIVE / CLOSED TABS */}
                        <motion.div
                            variants={sectionVariants}
                            className="rounded-md border border-border bg-card p-1 shadow-sm"
                        >
                            <div className="grid grid-cols-2 rounded-md bg-muted">
                                <motion.button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("live");
                                        setSelectedDriver("all");
                                        setSearch("");
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative flex h-9 min-w-[90px] items-center justify-center gap-1.5 rounded-md px-3 text-sm font-bold transition ${activeTab === "live"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {activeTab === "live" && (
                                        <motion.span
                                            layoutId="vehicle-status-tab"
                                            className="absolute inset-0 rounded-md bg-primary"
                                            transition={{
                                                type: "spring",
                                                stiffness: 350,
                                                damping: 30,
                                            }}
                                        />
                                    )}

                                    <span className="relative z-10 flex items-center gap-1.5">
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${activeTab === "live"
                                                ? "bg-primary-foreground"
                                                : "bg-emerald-500"
                                                }`}
                                        />
                                        Live ({liveCount})
                                    </span>
                                </motion.button>

                                <motion.button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("closed");
                                        setSelectedDriver("all");
                                        setSearch("");
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative flex h-9 min-w-[95px] items-center justify-center gap-1.5 rounded-md px-3 text-sm font-bold transition ${activeTab === "closed"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {activeTab === "closed" && (
                                        <motion.span
                                            layoutId="vehicle-status-tab"
                                            className="absolute inset-0 rounded-md bg-primary"
                                            transition={{
                                                type: "spring",
                                                stiffness: 450,
                                                damping: 35,
                                            }}
                                        />
                                    )}

                                    <span className="relative z-10">
                                        Closed ({closedCount})
                                    </span>
                                </motion.button>
                            </div>
                        </motion.div>

                        <motion.button
                            type="button"
                            onClick={handleConsolidateVehicle}
                            disabled={listingLoader}
                            whileHover={!listingLoader ? { scale: 1.02 } : undefined}
                            whileTap={!listingLoader ? { scale: 0.96 } : undefined}
                            className="
                                inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3
                                text-sm font-bold text-primary-foreground shadow-sm transition
                                hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60
                            "
                        >
                            <MapPin size={16} />
                            All Vehicles
                        </motion.button>

                        <motion.button
                            type="button"
                            onClick={fetchDrivers}
                            disabled={listingLoader}
                            whileHover={!listingLoader ? { scale: 1.02 } : undefined}
                            whileTap={!listingLoader ? { scale: 0.96 } : undefined}
                            className="
                                inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3
                                text-sm font-bold text-primary-foreground shadow-sm transition
                                hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60
                            "
                        >
                            <RefreshCcw
                                size={16}
                                className={listingLoader ? "animate-spin" : ""}
                            />
                            Refresh
                        </motion.button>
                    </div>
                </motion.div>

                {/* FILTER PANEL */}
                <motion.div
                    variants={sectionVariants}
                    layout
                    className="rounded-md border border-border bg-card p-3 shadow-sm"
                >
                    <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <motion.div
                                    whileHover={{ rotate: 8, scale: 1.05 }}
                                    className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"
                                >
                                    <MapPin size={18} />
                                </motion.div>

                                <div>
                                    <h2 className="text-sm font-bold text-card-foreground">
                                        {activeTab === "live"
                                            ? "Live Vehicle Locations"
                                            : "Closed Vehicle Trips"}
                                    </h2>

                                    <div className="mt-1 flex items-center gap-2">
                                        {activeTab === "live" && (
                                            <motion.span
                                                animate={{ scale: [1, 1.35, 1] }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                                className="h-2 w-2 rounded-full bg-emerald-500"
                                            />
                                        )}

                                        <p className="text-xs text-muted-foreground">
                                            Auto-refreshing every 10 seconds
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-2 xl:max-w-2xl xl:grid-cols-2">
                            <SelectBox
                                value={selectedDriver}
                                onChange={setSelectedDriver}
                                options={driverOptions}
                            />

                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />

                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search driver, vehicle, trip..."
                                    className="
                                        h-10 w-full rounded-md border border-border bg-background
                                        pl-9 pr-3 text-sm text-foreground outline-none
                                        transition focus:border-primary focus:ring-2 focus:ring-primary/10
                                    "
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* DRIVER LIST */}
                <AnimatePresence mode="wait">
                    {listingLoader ? (
                        <motion.div
                            key="driver-loader"
                            variants={gridVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, y: 10 }}
                            className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
                        >
                            {Array.from({ length: 6 }).map((_, index) => (
                                <SkeletonCard key={index} index={index} />
                            ))}
                        </motion.div>
                    ) : filteredDrivers.length === 0 ? (
                        <motion.div
                            key="driver-empty"
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: 0.25 }}
                            className="flex min-h-[260px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-8 text-center shadow-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, -3, 3, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground"
                            >
                                <MapPin size={30} />
                            </motion.div>

                            <h3 className="mt-4 text-lg font-bold text-foreground">
                                {activeTab === "live"
                                    ? "No live vehicle location"
                                    : "No closed vehicle trip"}
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                {activeTab === "live"
                                    ? "Vehicle location will appear here after a driver accepts and starts live tracking."
                                    : "Closed vehicle trips will appear here after the trip is delivered, completed or closed."}
                            </p>

                            {hasFilter && (
                                <motion.button
                                    type="button"
                                    onClick={resetFilters}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                                >
                                    Clear Filters
                                </motion.button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="driver-list"
                            variants={gridVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, y: 10 }}
                            layout
                            className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
                        >
                            <AnimatePresence>
                                {filteredDrivers.map((item: any, index: number) => (
                                    <DriverCard
                                        key={
                                            getTripTrackingVoucher(item) ||
                                            `${getDriverIdentity(item)}-${getVehicleNumber(item)}-${index}`
                                        }
                                        item={item}
                                        onTrack={openDriverMap}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default WhereIsMyDriver;