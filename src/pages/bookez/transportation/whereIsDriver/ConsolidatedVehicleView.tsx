import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, MapPin, Truck, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import TruckImg from "../../../../assets/images/topviewtruck.png";


const getStatusStyle = (status: any) => {
    const value = String(status || "").toLowerCase().trim();

    if (value === "delivered") {
        return "bg-red-100 text-red-700 border-red-200";
    }

    if (value === "completed") {
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }

    if (value === "in-transit" || value === "in transit") {
        return "bg-amber-100 text-amber-700 border-amber-200";
    }

    if (value === "loading") {
        return "bg-violet-100 text-violet-700 border-violet-200";
    }

    if (value === "cancelled" || value === "failed") {
        return "bg-red-100 text-red-700 border-red-200";
    }

    return "bg-blue-100 text-blue-700 border-blue-200";
};

const DEFAULT_CENTER = {
    lat: 21.1458,
    lng: 79.0882
};

const mapContainerStyle = {
    width: "100%",
    height: "100%"
};

const formatStatus = (status: any) => {
    return String(status || "-")
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const VehicleMapMarker = ({
    item,
    selected,
    onClick
}: {
    item: any;
    selected: boolean;
    onClick: () => void;
}) => {
    const heading = Number(item?.currentLocation?.heading || 0);
    const statusLabel = formatStatus(item?.tripStatus);
    const statusStyle = getStatusStyle(item?.tripStatus);
    return (
        <div
            onClick={onClick}
            className="relative cursor-pointer"
            style={{
                width: "150px",
                transform: "translate(-50%, -50%)"
            }}
        >
            <div className="flex flex-col items-center">
                <motion.div
                    animate={{
                        scale: selected ? 1.22 : 1
                    }}
                    transition={{ duration: 0.2 }}
                    className="relative flex h-[78px] w-[78px] items-center justify-center"
                >
                    {selected && (
                        <>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{
                                    opacity: [0.5, 0.15, 0.5],
                                    scale: [0.8, 1.35, 0.8]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 rounded-full border-2 border-primary bg-primary/15"
                            />

                            <div className="absolute inset-1 rounded-full border-2 border-primary/70" />
                        </>
                    )}

                    <div className="absolute bottom-1 left-1/2 h-3 w-10 -translate-x-1/2 rounded-full bg-black/20 blur-sm" />

                    <img
                        src={TruckImg}
                        alt={item?.vehicle?.vehicleNumber || "Vehicle"}
                        draggable={false}
                        className="relative z-10 h-[68px] w-[46px] object-contain drop-shadow-lg"
                        style={{
                            transform: `rotate(${heading - 90}deg)`,
                            transition: "transform 0.3s ease"
                        }}
                    />
                </motion.div>

                <motion.div
                    animate={{
                        scale: selected ? 1.08 : 1
                    }}
                    className={`mt-1 flex max-w-[210px] items-center gap-1.5 rounded-md border px-2 py-1.5 shadow-md ${selected
                        ? "border-primary bg-white"
                        : "border-primary/30 bg-white"
                        }`}
                >
                    <span className="max-w-[105px] truncate text-xs font-extrabold text-primary">
                        {item?.vehicle?.vehicleNumber || "-"}
                    </span>

                    <span
                        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold ${statusStyle}`}
                    >
                        {statusLabel}
                    </span>
                </motion.div>

                <div
                    className={`mt-1 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm ${selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-muted-foreground"
                        }`}
                >
                    {item?.trackingId || "-"}
                </div>
            </div>
        </div>
    );
};

const ConsolidatedMap = ({
    vehicles,
    selectedTrackingId,
    onSelectVehicle
}: {
    vehicles: any[];
    selectedTrackingId: string;
    onSelectVehicle: (item: any) => void;
}) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapRef = useRef<google.maps.Map | null>(null);
    const initialFitDoneRef = useRef(false);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey || ""
    });

    const mapOptions = useMemo(() => {
        if (!isLoaded || !(window as any)?.google) return {};

        return {
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            clickableIcons: false,
            gestureHandling: "greedy",
            backgroundColor: "#f8fafc"
        };
    }, [isLoaded]);

    const fitAllVehicles = () => {
        if (!mapRef.current || !vehicles.length || !(window as any)?.google) return;

        const bounds = new google.maps.LatLngBounds();

        vehicles.forEach((item: any) => {
            bounds.extend({
                lat: item.displayLat,
                lng: item.displayLng
            });
        });

        mapRef.current.fitBounds(bounds, 100);

        window.setTimeout(() => {
            if (!mapRef.current) return;

            if (vehicles.length === 1) {
                mapRef.current.setZoom(17);
                mapRef.current.panTo({
                    lat: vehicles[0].displayLat,
                    lng: vehicles[0].displayLng
                });
                return;
            }

            const zoom = mapRef.current.getZoom() || 15;

            if (zoom > 17) {
                mapRef.current.setZoom(17);
            }
        }, 300);
    };

    const handleMapLoad = (map: google.maps.Map) => {
        mapRef.current = map;

        if (!initialFitDoneRef.current) {
            initialFitDoneRef.current = true;

            window.setTimeout(() => {
                fitAllVehicles();
            }, 100);
        }
    };

    const focusVehicle = (item: any) => {
        onSelectVehicle(item);
    };

    useEffect(() => {
        if (!mapRef.current) return;

        if (!selectedTrackingId) {
            fitAllVehicles();
            return;
        }

        const selectedVehicle = vehicles.find(
            (item: any) => item?.trackingId === selectedTrackingId
        );

        if (!selectedVehicle) return;

        mapRef.current.panTo({
            lat: selectedVehicle.displayLat,
            lng: selectedVehicle.displayLng
        });

        mapRef.current.setZoom(19);
    }, [selectedTrackingId, vehicles]);

    if (!apiKey) {
        return (
            <div className="flex h-full items-center justify-center bg-muted p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Google Maps API key missing. Add VITE_GOOGLE_MAPS_API_KEY in .env.
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex h-full items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">
                    Loading map...
                </p>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={
                vehicles.length
                    ? {
                        lat: vehicles[0].displayLat,
                        lng: vehicles[0].displayLng
                    }
                    : DEFAULT_CENTER
            }
            zoom={15}
            options={mapOptions}
            onLoad={handleMapLoad}
            onUnmount={() => {
                mapRef.current = null;
            }}
        >
            {vehicles.map((item: any, index: number) => (
                <OverlayView
                    key={`${item?.trackingId || "vehicle"}-${index}`}
                    position={{
                        lat: item.displayLat,
                        lng: item.displayLng
                    }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                    <VehicleMapMarker
                        item={item}
                        selected={selectedTrackingId === item?.trackingId}
                        onClick={() => focusVehicle(item)}
                    />
                </OverlayView>
            ))}
        </GoogleMap>
    );
};

const ConsolidatedVehicleView = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const vehicles = Array.isArray(location.state?.vehicles)
        ? location.state.vehicles
        : [];

    const validVehicles = useMemo(() => {
        const normalizedVehicles = vehicles
            .map((item: any) => {
                const lat = Number(item?.currentLocation?.lat);
                const lng = Number(item?.currentLocation?.lng);

                return {
                    ...item,
                    lat,
                    lng,
                    hasLocation: Number.isFinite(lat) && Number.isFinite(lng)
                };
            })
            .filter((item: any) => item.hasLocation);

        const locationGroups = new Map<string, any[]>();

        normalizedVehicles.forEach((item: any) => {
            const key = `${item.lat.toFixed(6)},${item.lng.toFixed(6)}`;

            if (!locationGroups.has(key)) {
                locationGroups.set(key, []);
            }

            locationGroups.get(key)?.push(item);
        });

        const result: any[] = [];

        locationGroups.forEach((group: any[]) => {
            if (group.length === 1) {
                result.push({
                    ...group[0],
                    displayLat: group[0].lat,
                    displayLng: group[0].lng
                });

                return;
            }

            const offsetDistance = 0.00018;

            group.forEach((item: any, index: number) => {
                const angle = (index / group.length) * Math.PI * 2;

                result.push({
                    ...item,
                    displayLat: item.lat + Math.cos(angle) * offsetDistance,
                    displayLng: item.lng + Math.sin(angle) * offsetDistance
                });
            });
        });

        return result;
    }, [vehicles]);

    const [selectedTrackingId, setSelectedTrackingId] = useState("");
    const [showVehicles, setShowVehicles] = useState(false);

    const selectedVehicle = useMemo(() => {
        if (!selectedTrackingId) return null;

        return validVehicles.find(
            (item: any) => item?.trackingId === selectedTrackingId
        ) || null;
    }, [selectedTrackingId, validVehicles]);

    const handleSelectVehicle = (item: any) => {
        setSelectedTrackingId(item?.trackingId || "");
        setShowVehicles(false);
    };

    const handleShowAllVehicles = () => {
        setSelectedTrackingId("");
        setShowVehicles(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[calc(100vh-64px)] overflow-hidden bg-background p-3"
        >
            <div className="mx-auto flex h-full w-full flex-col gap-3">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex shrink-0 items-center justify-between rounded-md border border-border bg-card p-3 shadow-sm"
                >
                    <div className="flex min-w-0 items-center">
                        <motion.button
                            type="button"
                            onClick={() => navigate(-1)}
                            whileHover={{ x: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            className="me-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        >
                            <ArrowLeft size={20} />
                        </motion.button>

                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-bold text-card-foreground">
                                All Vehicles
                            </h2>

                            <p className="mt-1 truncate text-sm text-muted-foreground">
                                {selectedVehicle
                                    ? `${selectedVehicle?.vehicle?.vehicleNumber || "-"} • ${selectedVehicle?.trackingId || "-"}`
                                    : "Track all vehicles from one map"}
                            </p>
                        </div>
                    </div>

                    <div className="hidden shrink-0 items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-bold text-primary sm:flex">
                        <Truck size={17} />
                        {validVehicles.length} {validVehicles.length === 1 ? "Vehicle" : "Vehicles"}
                    </div>
                </motion.div>

                {validVehicles.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-8 text-center shadow-sm"
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <MapPin size={30} />
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-foreground">
                            No vehicle location found
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                            No valid vehicle coordinates are available.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-card shadow-sm"
                    >
                        <ConsolidatedMap
                            vehicles={validVehicles}
                            selectedTrackingId={selectedTrackingId}
                            onSelectVehicle={handleSelectVehicle}
                        />

                        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
                            <motion.button
                                type="button"
                                onClick={handleShowAllVehicles}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/95 px-4 py-2 text-sm font-bold text-primary shadow-lg backdrop-blur-md"
                            >
                                <Truck size={18} />

                                {selectedVehicle
                                    ? `${selectedVehicle?.vehicle?.vehicleNumber || "-"} • ${selectedVehicle?.trackingId || "-"}`
                                    : `${validVehicles.length} ${validVehicles.length === 1 ? "vehicle" : "vehicles"} on map`}
                            </motion.button>
                        </div>

                       <div className="absolute bottom-4 left-4 z-30">
                            <AnimatePresence>
                                {showVehicles && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                        transition={{ duration: 0.18 }}
className="absolute bottom-[58px] left-0 w-[310px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"                                    >
                                        <div className="flex items-center justify-between border-b border-border px-3 py-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-card-foreground">
                                                    Vehicles
                                                </h3>

                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Select a vehicle to focus
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setShowVehicles(false)}
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                            >
                                                <X size={17} />
                                            </button>
                                        </div>

                                        <div className="border-b border-border p-2">
                                            <motion.button
                                                type="button"
                                                onClick={handleShowAllVehicles}
                                                whileTap={{ scale: 0.98 }}
                                                className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${!selectedTrackingId
                                                    ? "border-primary bg-primary/10"
                                                    : "border-transparent hover:border-border hover:bg-muted"
                                                    }`}
                                            >
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${!selectedTrackingId
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-primary/10 text-primary"
                                                        }`}
                                                >
                                                    <MapPin size={20} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-card-foreground">
                                                        Show All Vehicles
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        View all {validVehicles.length} vehicles on map
                                                    </p>
                                                </div>
                                            </motion.button>
                                        </div>

                                        <div className="max-h-[320px] overflow-y-auto p-2">
                                            {validVehicles.map((item: any, index: number) => {
                                                const selected =
                                                    selectedTrackingId === item?.trackingId;

                                                return (
                                                    <motion.button
                                                        key={`${item?.trackingId || "vehicle"}-${index}`}
                                                        type="button"
                                                        onClick={() => handleSelectVehicle(item)}
                                                        whileHover={{ x: 2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className={`mb-1 flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition last:mb-0 ${selected
                                                            ? "border-primary bg-primary/10"
                                                            : "border-transparent hover:border-border hover:bg-muted"
                                                            }`}
                                                    >
                                                        <div
                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${selected
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-primary/10 text-primary"
                                                                }`}
                                                        >
                                                            <Truck size={21} />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="truncate text-sm font-bold text-card-foreground">
                                                                    {item?.vehicle?.vehicleNumber || "-"}
                                                                </p>

                                                                {selected && (
                                                                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                                                        Selected
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="mt-0.5 flex items-center justify-between gap-2">
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    Tracking: {item?.trackingId || "-"}
                                                                </p>

                                                                <span
                                                                    className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${getStatusStyle(
                                                                        item?.tripStatus
                                                                    )}`}
                                                                >
                                                                    {formatStatus(item?.tripStatus)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="button"
                                onClick={() => setShowVehicles((prev) => !prev)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.96 }}
                                className="flex h-12 items-center gap-2 rounded-full bg-primary px-4 font-bold text-primary-foreground shadow-xl transition hover:bg-primary/90"
                            >
                                <Truck size={20} />

                                <span className="text-sm">
                                    Vehicles ({validVehicles.length})
                                </span>

                                {showVehicles ? (
                                    <ChevronDown size={18} />
                                ) : (
                                    <ChevronUp size={18} />
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default ConsolidatedVehicleView;