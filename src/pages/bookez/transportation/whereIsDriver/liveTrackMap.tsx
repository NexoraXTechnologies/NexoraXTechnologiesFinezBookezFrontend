import React, { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    Clock,
    ExternalLink,
    LocateFixed,
    MapPin,
    Navigation,
    RefreshCcw,
    Route,
    Truck,
    User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import professionalAxios from "../../../../services/professionalAxios";

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
};

/* ===================================================
   HELPERS
=================================================== */

const getTripTrackingVoucher = (item: any) => {
    return String(
        item?.trackingVoucherNumber ||
        item?.tripTrackingVoucherNumber ||
        item?.voucherNumber ||
        item?.trackingVoucher ||
        item?.tripTrackingNumber ||
        item?.data?.trackingVoucherNumber ||
        item?.data?.voucherNumber ||
        ""
    ).trim();
};

const unwrapTripTrackingDetail = (res: any) => {
    return (
        res?.data?.data ||
        res?.data?.record ||
        res?.data ||
        res?.record ||
        res ||
        null
    );
};

const getLatLng = (location: any) => {
    const lat = Number(location?.lat ?? location?.latitude);
    const lng = Number(location?.lng ?? location?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
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

const getDriverName = (item: any) => {
    return item?.driver?.driverName || item?.driverName || "Driver";
};

const getDriverMobile = (item: any) => {
    return (
        item?.driver?.driverMobile ||
        item?.driver?.mobileNumber ||
        item?.driverMobile ||
        item?.mobileNumber ||
        item?.assignedDriverMobile ||
        "-"
    );
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

const getStatusClass = (status: any) => {
    const value = String(status || "").toLowerCase();

    if (value === "completed" || value === "delivered") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (value === "cancelled" || value === "failed") {
        return "border-red-200 bg-red-50 text-red-700";
    }

    if (value === "in-transit" || value === "in transit") {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (value === "loading") {
        return "border-violet-200 bg-violet-50 text-violet-700";
    }

    return "border-blue-200 bg-blue-50 text-blue-700";
};

/* ===================================================
   SMALL COMPONENTS
=================================================== */

const InfoItem = ({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: any;
}) => {
    return (
        <motion.div
            variants={cardVariants}
            whileHover={{ x: 2 }}
            className="min-w-0"
        >
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon size={16} />
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                        {label}
                    </p>

                    <p className="mt-0.5 truncate text-sm font-black text-foreground">
                        {value || "-"}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const LoadingCard = () => {
    return (
        <motion.div
            variants={cardVariants}
            className="rounded-md border border-border bg-card p-3 shadow-sm"
        >
            <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <div className="h-6 w-48 rounded-md bg-muted" />
                <div className="mt-3 h-4 w-72 max-w-full rounded-md bg-muted" />
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-12 rounded-md bg-muted" />
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ===================================================
   MAIN COMPONENT
=================================================== */

const LiveTripTracking = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const state: any = location?.state || {};

    const initialTracking = state?.initialTracking || null;
    const initialCurrentLocation = state?.initialCurrentLocation || null;

    const routeVoucher =
        params?.trackingVoucherNumber ||
        params?.voucherNumber ||
        state?.trackingVoucherNumber ||
        getTripTrackingVoucher(initialTracking);

    const [tracking, setTracking] = useState<any>(initialTracking || null);
    const [loading, setLoading] = useState(!initialTracking);
    const [refreshing, setRefreshing] = useState(false);

    const trackingVoucher = useMemo(
        () => String(routeVoucher || getTripTrackingVoucher(tracking) || "").trim(),
        [routeVoucher, tracking]
    );

    const currentLocation =
        tracking?.currentLocation || initialCurrentLocation || null;

    const coords = getLatLng(currentLocation);

    const lastUpdated = getLastUpdated(tracking);

    const mapSrc = coords
        ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`
        : "";

    const googleMapsUrl = coords
        ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
        : "";

    const fetchTracking = async (silent = false) => {
        try {
            if (!trackingVoucher) {
                toast.error("Tracking voucher not found");
                setLoading(false);
                return;
            }

            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookEZ/tripTracking/getByVoucherNumber/${encodeURIComponent(
                    trackingVoucher
                )}`
            );

            const detail = unwrapTripTrackingDetail(response);

            if (detail) {
                setTracking(detail);
            }
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load live trip tracking"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTracking(false);

        const timer = window.setInterval(() => {
            fetchTracking(true);
        }, 10000);

        return () => {
            window.clearInterval(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackingVoucher]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleOpenMap = () => {
        if (!googleMapsUrl) {
            toast.warn("Current location not available");
            return;
        }

        window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
    };

    const driverName = getDriverName(tracking);
    const driverMobile = getDriverMobile(tracking);
    const vehicleNumber = getVehicleNumber(tracking);
    const tripLabel = state?.tripLabel || getTripLabel(tracking);
    const tripStatus = tracking?.tripStatus || tracking?.status || "Live";

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
                                Live Trip Tracking
                            </h2>

                            <p className="mt-1 text-xs font-bold text-muted-foreground">
                                {trackingVoucher
                                    ? `Tracking Voucher: ${trackingVoucher}`
                                    : "Tracking voucher not found"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <motion.button
                            type="button"
                            onClick={() => fetchTracking(true)}
                            disabled={loading || refreshing}
                            whileHover={!loading && !refreshing ? { scale: 1.02 } : undefined}
                            whileTap={!loading && !refreshing ? { scale: 0.96 } : undefined}
                            className="
								inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3
								text-sm font-black text-primary-foreground shadow-sm transition
								hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60
							"
                        >
                            <RefreshCcw
                                size={16}
                                className={loading || refreshing ? "animate-spin" : ""}
                            />
                            Refresh
                        </motion.button>

                        <motion.button
                            type="button"
                            onClick={handleOpenMap}
                            disabled={!coords}
                            whileHover={coords ? { scale: 1.02 } : undefined}
                            whileTap={coords ? { scale: 0.96 } : undefined}
                            className="
								inline-flex h-10 items-center gap-2 rounded-md border border-border
								bg-background px-3 text-sm font-black text-foreground
								transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60
							"
                        >
                            <ExternalLink size={16} />
                            Open Map
                        </motion.button>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <LoadingCard />
                        </motion.div>
                    ) : !tracking ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: 0.25 }}
                            className="flex min-h-[260px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-8 text-center shadow-sm"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <MapPin size={30} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-foreground">
                                Tracking not found
                            </h3>

                            <p className="mt-1 max-w-md text-sm font-semibold text-muted-foreground">
                                Live tracking details are not available for this trip.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            variants={pageVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, y: 10 }}
                            className="grid grid-cols-1 gap-3 xl:grid-cols-12"
                        >
                            {/* LEFT DETAILS */}
                            <motion.div
                                variants={sectionVariants}
                                className="xl:col-span-4"
                            >
                                <div className="rounded-md border border-border bg-card p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <motion.div
                                                whileHover={{ rotate: -4, scale: 1.06 }}
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                            >
                                                <Truck size={24} />
                                            </motion.div>

                                            <div className="min-w-0">
                                                <h3 className="truncate text-lg font-black text-foreground">
                                                    {tripLabel}
                                                </h3>

                                                <p className="mt-1 truncate text-xs font-bold text-muted-foreground">
                                                    Vehicle: {vehicleNumber}
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-black ${getStatusClass(
                                                tripStatus
                                            )}`}
                                        >
                                            <motion.span
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{
                                                    duration: 1.4,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                                            />
                                            {String(tripStatus || "LIVE").toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border/70 pt-4">
                                        <InfoItem icon={User} label="Driver" value={driverName} />

                                        <InfoItem
                                            icon={Navigation}
                                            label="Driver Mobile"
                                            value={driverMobile}
                                        />

                                        <InfoItem
                                            icon={Route}
                                            label="Trip"
                                            value={tripLabel}
                                        />

                                        <InfoItem
                                            icon={Clock}
                                            label="Last Updated"
                                            value={formatDateTime(lastUpdated)}
                                        />

                                        <InfoItem
                                            icon={LocateFixed}
                                            label="Coordinates"
                                            value={
                                                coords
                                                    ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                                                    : "-"
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 rounded-md border border-border bg-card p-3 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                                            <MapPin size={18} />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                                                Current Location
                                            </p>

                                            <p className="mt-1 text-sm font-black leading-5 text-foreground">
                                                {tracking?.currentAddress ||
                                                    tracking?.currentLocation?.address ||
                                                    tracking?.currentLocation?.formattedAddress ||
                                                    coords
                                                    ? `${coords?.lat}, ${coords?.lng}`
                                                    : "Location not available"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* MAP */}
                            <motion.div
                                variants={sectionVariants}
                                className="xl:col-span-8"
                            >
                                <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
                                    <div className="flex items-center justify-between gap-3 border-b border-border p-3">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-wide text-primary">
                                                Live Map
                                            </h3>

                                            <p className="mt-1 text-xs font-bold text-muted-foreground">
                                                Auto-refreshing every 10 seconds
                                            </p>
                                        </div>

                                        <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                                            <motion.span
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{
                                                    duration: 1.4,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                                className="h-2 w-2 rounded-full bg-emerald-500"
                                            />
                                            <span className="text-xs font-black">LIVE</span>
                                        </div>
                                    </div>

                                    <div className="relative h-[520px] bg-muted">
                                        {coords && mapSrc ? (
                                            <iframe
                                                title="Live Trip Tracking Map"
                                                src={mapSrc}
                                                className="h-full w-full border-0"
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            />
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-card text-muted-foreground shadow-sm">
                                                    <MapPin size={30} />
                                                </div>

                                                <h3 className="mt-4 text-lg font-black text-foreground">
                                                    Location not available
                                                </h3>

                                                <p className="mt-1 max-w-md text-sm font-semibold text-muted-foreground">
                                                    Driver coordinates are missing for this tracking record.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default LiveTripTracking;