import React, { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CheckCircle,
    Download,
    Link2,
    MapPin,
    Navigation,
    Package,
    RefreshCcw,
    Search,
    SlidersHorizontal,
    Wrench,
    Truck,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import TruckImg from "../../../../assets/truck.png"
import {
    FLEET_SUMMARY_ITEMS,
    getAllVehicleStatus,
    normalizeVehicleAvailabilityStatus,
} from "../../../../redux/slices/professionalSlice/transportation/vehicleStatusSlice";

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

const sectionVariants = {
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

const cardVariants = {
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
   ICON MAP
=================================================== */

const iconMap: any = {
    "check-circle": CheckCircle,
    "link-2": Link2,
    "map-pin": MapPin,
    package: Package,
    navigation: Navigation,
    download: Download,
    tool: Wrench,
};

/* ===================================================
   STATUS STYLE
=================================================== */

const statusStyleMap: any = {
    Available: {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
        card: "from-emerald-500/10",
    },
    Allocated: {
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
        card: "from-blue-500/10",
    },
    "On-Way To Load": {
        badge: "border-sky-200 bg-sky-50 text-sky-700",
        dot: "bg-sky-500",
        card: "from-sky-500/10",
    },
    Loading: {
        badge: "border-violet-200 bg-violet-50 text-violet-700",
        dot: "bg-violet-500",
        card: "from-violet-500/10",
    },
    "In-Transit": {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
        card: "from-amber-500/10",
    },
    Unloading: {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        dot: "bg-orange-500",
        card: "from-orange-500/10",
    },
    "Under Maintenance": {
        badge: "border-red-200 bg-red-50 text-red-700",
        dot: "bg-red-500",
        card: "from-red-500/10",
    },
    "Partially Loaded": {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        dot: "bg-orange-500",
        card: "from-orange-500/10",
    },
};

const getStatusStyle = (status: any) => {
    const normalized = normalizeVehicleAvailabilityStatus(status);

    return (
        statusStyleMap[normalized] || {
            badge: "border-border bg-muted text-muted-foreground",
            dot: "bg-muted-foreground",
            card: "from-muted/40",
        }
    );
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
    options: { label: string; value: string }[];
}) => {
    return (
        <motion.select
            whileFocus={{ scale: 1.01 }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="
                h-10 w-full rounded-md border border-border bg-background px-3
                text-sm font-bold text-foreground outline-none transition
                focus:border-primary focus:ring-2 focus:ring-primary/10
            "
        >
            {options.map((option) => (
                <option key={option.value || option.label} value={option.value}>
                    {option.label}
                </option>
            ))}
        </motion.select>
    );
};

/* ===================================================
   FLEET SUMMARY CARD
=================================================== */

const FleetSummaryCard = ({
    item,
    value,
    selected,
    onClick,
}: {
    item: any;
    value: number;
    selected: boolean;
    onClick: () => void;
}) => {
    const Icon = iconMap[item.icon] || Truck;

    return (
        <motion.button
            type="button"
            onClick={onClick}
            variants={cardVariants}
            whileHover={{ y: -3, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            layout
            className={`
                group relative overflow-hidden rounded-md border p-3 text-left transition-colors duration-200
                ${selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card shadow-sm hover:border-primary/40"
                }
            `}
        >
            <motion.div
                layout
                className={`
                    absolute -right-7 -top-7 h-20 w-20 rounded-full opacity-10
                    ${selected ? "bg-white" : "bg-primary"}
                `}
                animate={{
                    scale: selected ? 1.2 : 1,
                    rotate: selected ? 12 : 0,
                }}
                transition={{ duration: 0.25 }}
            />

            <div className="relative flex items-center justify-between gap-2">
                <motion.div
                    layout
                    className={`
                        flex h-9 w-9 items-center justify-center rounded-md shadow-sm
                        ${selected ? "bg-white/20" : "bg-muted"}
                    `}
                    animate={{
                        rotate: selected ? [0, -8, 8, 0] : 0,
                    }}
                    transition={{ duration: 0.45 }}
                >
                    <Icon
                        size={18}
                        style={{ color: selected ? "#FFFFFF" : item.color }}
                    />
                </motion.div>

                <motion.span
                    layout
                    className={`
                        rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-wide
                        ${selected
                            ? "bg-white/20 text-white"
                            : "bg-muted text-muted-foreground"
                        }
                    `}
                >
                    Live
                </motion.span>
            </div>

            <div className="relative mt-3">
                <motion.h3
                    key={`${item.key}-${value}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`
                        text-3xl font-black leading-none tracking-tight
                        ${selected ? "text-white" : "text-foreground"}
                    `}
                >
                    {value || 0}
                </motion.h3>

                <p
                    className={`
                        mt-1 truncate text-xs font-black
                        ${selected ? "text-white/90" : "text-muted-foreground"}
                    `}
                >
                    {item.label}
                </p>
            </div>
        </motion.button>
    );
};

/* ===================================================
   CLEAN INFO TILE - NO BOX
=================================================== */

const CompactInfoTile = ({
    label,
    value,
}: {
    label: string;
    value: any;
}) => {
    return (
        <motion.div whileHover={{ x: 2 }} className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                {label}
            </p>

            <p className="mt-0 truncate text-sm font-black text-foreground">
                {value || "-"}
            </p>
        </motion.div>
    );
};

/* ===================================================
   VEHICLE CARD
=================================================== */

const VehicleCard = ({ vehicle }: { vehicle: any }) => {
    const normalizedStatus = normalizeVehicleAvailabilityStatus(
        vehicle.availabilityStatus
    );

    const partial =
        String(vehicle.availabilityStatus || "").toLowerCase() ===
        "partially loaded";

    const statusStyle = getStatusStyle(
        partial ? "Partially Loaded" : normalizedStatus
    );

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
            className={`
                group relative overflow-hidden rounded-md border border-border bg-gradient-to-br
                ${statusStyle.card} to-card p-3 shadow-sm transition-shadow duration-200
                hover:shadow-md
            `}
        >
            <motion.div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5"
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.25 }}
            />

            <div className="relative flex items-start gap-3">
                <motion.div
                    whileHover={{ rotate: -4, scale: 1.06 }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-card shadow-sm ring-1 ring-border"
                >
                    {/* <Truck size={24} className="text-primary" /> */}
                    <img src={TruckImg} alt="" />
                </motion.div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="truncate text-base font-black tracking-tight text-foreground">
                                {vehicle.vehicleNumber || "-"}
                            </h3>

                            <p className="mt-1 truncate text-xs font-bold text-muted-foreground">
                                {vehicle.vehicleType || "-"}
                                {vehicle.vehicleBodyType
                                    ? ` • ${vehicle.vehicleBodyType}`
                                    : ""}
                            </p>
                        </div>

                        <motion.span
                            layout
                            initial={{ scale: 0.96 }}
                            animate={{ scale: 1 }}
                            className={`
                                inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-1
                                text-xs font-black leading-none
                                ${statusStyle.badge}
                            `}
                        >
                            <motion.span
                                animate={{ scale: [1, 1.25, 1] }}
                                transition={{
                                    duration: 1.4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                            />
                            {vehicle.availabilityStatus || "Available"}
                        </motion.span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border/70 pt-3">
                        <CompactInfoTile
                            label="Capacity"
                            value={`${vehicle.vehicleCapacityTon || 0} Ton`}
                        />

                        <CompactInfoTile
                            label="Available"
                            value={`${vehicle.availableCapacityTon || 0} Ton`}
                        />

                        <CompactInfoTile
                            label="Location"
                            value={vehicle.currentLocation || "-"}
                        />

                        <CompactInfoTile
                            label="Load Type"
                            value={vehicle.loadType || "FTL"}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/* ===================================================
   LOADING SKELETON
=================================================== */

const SkeletonCard = ({ index }: { index: number }) => {
    return (
        <motion.div
            variants={cardVariants}
            custom={index}
            className="h-[175px] overflow-hidden rounded-md border border-border bg-card p-3 shadow-sm"
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

                <div className="mt-4 grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((__, i) => (
                        <div key={i} className="h-12 rounded-md bg-muted" />
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ===================================================
   MAIN COMPONENT
=================================================== */

const VehicleStatus = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();

    const { vehicles, listingLoader, error } = useSelector(
        (state: any) => state.vehicleStatus
    );

    const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
    const [capacityFilter, setCapacityFilter] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");

    const handleBack = () => {
        navigate(-1);
    };

    const fetchVehicles = () => {
        dispatch(
            getAllVehicleStatus({
                limit: 500,
                offset: 0,
                search: "",
                status: "active",
            }) as any
        );
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (error) toast.error(error);
    }, [error]);

    const vehicleTypeOptions = useMemo(() => {
        const values = [
            ...new Set(
                (vehicles || [])
                    .map((vehicle: any) => vehicle.vehicleType)
                    .filter(Boolean)
            ),
        ];

        return [
            { label: "Vehicle Type", value: "" },
            ...values.map((value: any) => ({ label: value, value })),
        ];
    }, [vehicles]);

    const capacityOptions = useMemo(() => {
        const values = [
            ...new Set(
                (vehicles || [])
                    .map((vehicle: any) => String(vehicle.vehicleCapacityTon || ""))
                    .filter(Boolean)
            ),
        ];

        return [
            { label: "Capacity", value: "" },
            ...values.map((value: any) => ({
                label: `${value} Ton`,
                value,
            })),
        ];
    }, [vehicles]);

    const locationOptions = useMemo(() => {
        const values = [
            ...new Set(
                (vehicles || [])
                    .map((vehicle: any) => vehicle.currentLocation)
                    .filter(Boolean)
            ),
        ];

        return [
            { label: "Location", value: "" },
            ...values.map((value: any) => ({ label: value, value })),
        ];
    }, [vehicles]);

    const handleStatusFilterPress = (statusKey: string) => {
        setStatusFilter((prev) => (prev === statusKey ? "" : statusKey));
    };

    const vehicleFleetSummary = useMemo(() => {
        const summary: any = Object.fromEntries(
            FLEET_SUMMARY_ITEMS.map((item: any) => [item.key, 0])
        );

        (vehicles || []).forEach((vehicle: any) => {
            const status = normalizeVehicleAvailabilityStatus(
                vehicle.availabilityStatus
            );

            if (Object.prototype.hasOwnProperty.call(summary, status)) {
                summary[status] += 1;
            }
        });

        return summary;
    }, [vehicles]);

    const filteredVehicles = useMemo(() => {
        return (vehicles || []).filter((vehicle: any) => {
            const normalizedStatus = normalizeVehicleAvailabilityStatus(
                vehicle.availabilityStatus
            );

            if (statusFilter && normalizedStatus !== statusFilter) return false;

            if (vehicleTypeFilter && vehicle.vehicleType !== vehicleTypeFilter) {
                return false;
            }

            if (
                capacityFilter &&
                String(vehicle.vehicleCapacityTon) !== String(capacityFilter)
            ) {
                return false;
            }

            if (locationFilter && vehicle.currentLocation !== locationFilter) {
                return false;
            }

            if (search.trim()) {
                const text = [
                    vehicle.vehicleNumber,
                    vehicle.vehicleType,
                    vehicle.vehicleBodyType,
                    vehicle.currentLocation,
                    vehicle.availabilityStatus,
                    vehicle.voucherNumber,
                ]
                    .join(" ")
                    .toLowerCase();

                if (!text.includes(search.trim().toLowerCase())) return false;
            }

            return true;
        });
    }, [
        vehicles,
        statusFilter,
        vehicleTypeFilter,
        capacityFilter,
        locationFilter,
        search,
    ]);

    const listStatusText = statusFilter
        ? `Showing ${statusFilter} vehicles only`
        : "Showing all vehicles from vehicle master";

    const resetFilters = () => {
        setVehicleTypeFilter("");
        setCapacityFilter("");
        setLocationFilter("");
        setStatusFilter("");
        setSearch("");
    };

    const hasFilter =
        Boolean(vehicleTypeFilter) ||
        Boolean(capacityFilter) ||
        Boolean(locationFilter) ||
        Boolean(statusFilter) ||
        Boolean(search);

    const totalVehicles = (vehicles || []).length;

    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="show"
            className="min-h-screen bg-background p-3"
        >
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3">
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
                            <h2 className="text-sm font-black uppercase tracking-wide text-primary">
                                Fleet Overview
                            </h2>

                            <p className="mt-1 text-xs font-bold text-muted-foreground">
                                {listingLoader
                                    ? "Updating fleet summary..."
                                    : `Total vehicles in master: ${totalVehicles}`}
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
                                        bg-background px-3 text-sm font-black text-muted-foreground
                                        transition hover:bg-muted
                                    "
                                >
                                    <X size={16} />
                                    Reset Filters
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <motion.button
                            type="button"
                            onClick={fetchVehicles}
                            disabled={listingLoader}
                            whileHover={!listingLoader ? { scale: 1.02 } : undefined}
                            whileTap={!listingLoader ? { scale: 0.96 } : undefined}
                            className="
                                inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3
                                text-sm font-black text-primary-foreground shadow-sm transition
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

                {/* SUMMARY CARDS */}
                <motion.div
                    variants={gridVariants}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
                >
                    {FLEET_SUMMARY_ITEMS.map((item: any) => (
                        <FleetSummaryCard
                            key={item.key}
                            item={item}
                            value={vehicleFleetSummary[item.key] || 0}
                            selected={statusFilter === item.key}
                            onClick={() => handleStatusFilterPress(item.key)}
                        />
                    ))}
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
                                    <SlidersHorizontal size={18} />
                                </motion.div>

                                <div>
                                    <h2 className="text-base font-black text-foreground">
                                        Available Vehicles
                                    </h2>

                                    <div className="mt-1 flex items-center gap-2">
                                        <motion.span
                                            animate={{ scale: [1, 1.35, 1] }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                            className="h-2 w-2 rounded-full bg-emerald-500"
                                        />

                                        <p className="text-xs font-bold text-muted-foreground">
                                            {listStatusText}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <motion.div
                            whileFocus={{ scale: 1.01 }}
                            className="relative w-full xl:max-w-sm"
                        >
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search vehicle number, type, location..."
                                className="
                                    h-10 w-full rounded-md border border-border bg-background
                                    pl-9 pr-3 text-sm font-bold text-foreground outline-none
                                    transition focus:border-primary focus:ring-2 focus:ring-primary/10
                                "
                            />
                        </motion.div>
                    </div>

                    <motion.div
                        variants={gridVariants}
                        className="grid grid-cols-1 gap-2 md:grid-cols-3"
                    >
                        <motion.div variants={cardVariants}>
                            <SelectBox
                                value={vehicleTypeFilter}
                                onChange={setVehicleTypeFilter}
                                options={vehicleTypeOptions}
                            />
                        </motion.div>

                        <motion.div variants={cardVariants}>
                            <SelectBox
                                value={capacityFilter}
                                onChange={setCapacityFilter}
                                options={capacityOptions}
                            />
                        </motion.div>

                        <motion.div variants={cardVariants}>
                            <SelectBox
                                value={locationFilter}
                                onChange={setLocationFilter}
                                options={locationOptions}
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* VEHICLE LIST */}
                <AnimatePresence mode="wait">
                    {listingLoader ? (
                        <motion.div
                            key="vehicle-loader"
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
                    ) : filteredVehicles.length === 0 ? (
                        <motion.div
                            key="vehicle-empty"
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: 0.25 }}
                            className="flex min-h-[240px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-8 text-center shadow-sm"
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
                                <Truck size={30} />
                            </motion.div>

                            <h3 className="mt-4 text-lg font-black text-foreground">
                                No vehicles found
                            </h3>

                            <p className="mt-1 max-w-md text-sm font-semibold text-muted-foreground">
                                Try changing your filters or refresh Vehicle Master data.
                            </p>

                            {hasFilter && (
                                <motion.button
                                    type="button"
                                    onClick={resetFilters}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
                                >
                                    Clear Filters
                                </motion.button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="vehicle-list"
                            variants={gridVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, y: 10 }}
                            layout
                            className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
                        >
                            <AnimatePresence>
                                {filteredVehicles.map((vehicle: any) => (
                                    <VehicleCard
                                        key={
                                            vehicle.selectedVehicleId ||
                                            vehicle.voucherNumber ||
                                            vehicle.vehicleNumber
                                        }
                                        vehicle={vehicle}
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

export default VehicleStatus;