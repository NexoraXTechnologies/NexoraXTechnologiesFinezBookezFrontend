import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    Clock,
    Gauge,
    MapPin,
    Navigation,
    RefreshCcw,
    User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    DirectionsRenderer,
    GoogleMap,
    MarkerF,
    OverlayView,
    PolylineF,
    useJsApiLoader,
} from "@react-google-maps/api";
import TruckImg from "../../../../assets/images/topviewtruck.png";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   CONFIG
=================================================== */

const LIVE_REFRESH_MS = 2000;
const FOLLOW_ZOOM = 17;

const DEFAULT_CENTER = {
    lat: 21.1458,
    lng: 79.0882,
};

/* ===================================================
   ANIMATION VARIANTS
=================================================== */

const pageVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            duration: 0.18,
            staggerChildren: 0.035,
        },
    },
};

const sectionVariants: any = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.22,
            ease: "easeOut",
        },
    },
};

const cardVariants: any = {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.22,
            ease: "easeOut",
        },
    },
};

/* ===================================================
   HELPERS
=================================================== */

const getTripTrackingVoucher = (item: any) => {
    return String(
        item?.trackingId ||
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

const getAnyLocation = (item: any, keys: string[]) => {
    for (const key of keys) {
        const value = key.split(".").reduce((obj: any, part: string) => {
            return obj?.[part];
        }, item);

        if (value) return value;
    }

    return null;
};

const getPickupLocation = (tracking: any) => {
    return (
        getAnyLocation(tracking, [
            "route.from",
            "pickupLocation",
            "fromLocation",
            "sourceLocation",
            "originLocation",
            "startLocation",
            "pickup.location",
            "from.location",
            "route.pickupLocation",
            "route.fromLocation",
            "transportOrder.pickupLocation",
            "transportOrder.fromLocation",
            "pickup",
            "from",
            "source",
            "origin",
        ]) || null
    );
};

const getDeliveryLocation = (tracking: any) => {
    return (
        getAnyLocation(tracking, [
            "route.to",
            "deliveryLocation",
            "dropLocation",
            "toLocation",
            "destinationLocation",
            "endLocation",
            "delivery.location",
            "drop.location",
            "to.location",
            "route.deliveryLocation",
            "route.dropLocation",
            "route.toLocation",
            "transportOrder.deliveryLocation",
            "transportOrder.dropLocation",
            "transportOrder.toLocation",
            "delivery",
            "drop",
            "to",
            "destination",
        ]) || null
    );
};

const decodePolyline = (encoded: string) => {
    if (!encoded) return [];

    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates: { lat: number; lng: number }[] = [];

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dLat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dLat;

        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dLng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dLng;

        coordinates.push({
            lat: lat / 1e5,
            lng: lng / 1e5,
        });
    }

    return coordinates;
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

const getSpeed = (item: any) => {
    const speed = Number(item?.currentLocation?.speed);

    if (!Number.isFinite(speed)) return "-";

    return `${speed.toFixed(1)} km/h`;
};

const getHeading = (item: any) => {
    const heading = Number(item?.currentLocation?.heading);

    if (!Number.isFinite(heading)) return 0;

    return heading;
};

const getAddress = (location: any) => {
    return (
        location?.address ||
        location?.formattedAddress ||
        location?.locationAddress ||
        "-"
    );
};

const getStatusClass = (status: any) => {
    const value = String(status || "").toLowerCase().replace("_", "-");

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

const formatStatusLabel = (status: any) => {
    return String(status || "LIVE")
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

/* ===================================================
   UI COMPONENTS
=================================================== */

const InfoItem = memo(
    ({
        icon: Icon,
        label,
        value,
    }: {
        icon: any;
        label: string;
        value: any;
    }) => {
        return (
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon size={17} />
                    </div>

                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                            {label}
                        </p>

                        <p className="mt-0.5 truncate text-sm font-semibold text-card-foreground">
                            {value || "-"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
);

const RouteAddressCard = memo(
    ({
        type,
        title,
        address,
        coords,
    }: {
        type: "pickup" | "delivery";
        title: string;
        address: string;
        coords?: { lat: number; lng: number } | null;
    }) => {
        const tone: any = {
            pickup: "bg-emerald-50 text-emerald-700 ring-emerald-200",
            delivery: "bg-red-50 text-red-700 ring-red-200",
        };

        return (
            <div className="rounded-md border border-border bg-background p-2.5">
                <div className="flex items-start gap-2">
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1 ${tone[type]}`}
                    >
                        <MapPin size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            {title}
                        </p>

                        <p className="mt-0.5 line-clamp-3 text-sm font-medium leading-5 text-card-foreground">
                            {address || "-"}
                        </p>

                        {coords && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

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
   MAP COMPONENTS
=================================================== */

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const escapeHtml = (value: unknown) => {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

type LatLngPoint = {
    lat: number;
    lng: number;
};

type SnappedRoutePoint = {
    position: LatLngPoint;
    routeHeading: number | null;
    snapped: boolean;
    distanceMeters: number;
};

/*
 * Change this value only when the original PNG is not facing north/up:
 *  0   = image front faces UP
 * -90  = image front faces RIGHT
 *  90  = image front faces LEFT
 * 180  = image front faces DOWN
 */
const TRUCK_IMAGE_DIRECTION_OFFSET = -90;
const MAX_ROUTE_SNAP_DISTANCE_METERS = 120;

const getCorrectedHeading = (heading: number) => {
    const safeHeading = Number.isFinite(Number(heading))
        ? Number(heading)
        : 0;

    return (
        safeHeading +
        TRUCK_IMAGE_DIRECTION_OFFSET +
        360
    ) % 360;
};

const calculateDistanceMeters = (
    first: LatLngPoint,
    second: LatLngPoint
) => {
    const earthRadius = 6371000;

    const lat1 = (first.lat * Math.PI) / 180;
    const lat2 = (second.lat * Math.PI) / 180;
    const deltaLat = ((second.lat - first.lat) * Math.PI) / 180;
    const deltaLng = ((second.lng - first.lng) * Math.PI) / 180;

    const value =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLng / 2) ** 2;

    return (
        2 *
        earthRadius *
        Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
    );
};

const calculateBearing = (
    from: LatLngPoint,
    to: LatLngPoint
) => {
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) *
        Math.cos(lat2) *
        Math.cos(deltaLng);

    return (
        (Math.atan2(y, x) * 180) / Math.PI +
        360
    ) % 360;
};

/**
 * Projects a raw GPS point onto the nearest route-polyline segment.
 * The raw GPS point is retained when it is too far from the route.
 */
const snapPointToRoute = (
    point: LatLngPoint,
    path: LatLngPoint[],
    maxSnapDistanceMeters = MAX_ROUTE_SNAP_DISTANCE_METERS
): SnappedRoutePoint => {
    if (path.length < 2) {
        return {
            position: point,
            routeHeading: null,
            snapped: false,
            distanceMeters: 0,
        };
    }

    let nearestPoint = point;
    let nearestDistance = Number.POSITIVE_INFINITY;
    let nearestHeading: number | null = null;

    const longitudeScale = Math.max(
        Math.abs(Math.cos((point.lat * Math.PI) / 180)),
        0.000001
    );

    for (let index = 0; index < path.length - 1; index++) {
        const start = path[index];
        const end = path[index + 1];

        const startX = start.lng * longitudeScale;
        const startY = start.lat;
        const endX = end.lng * longitudeScale;
        const endY = end.lat;
        const pointX = point.lng * longitudeScale;
        const pointY = point.lat;

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const segmentLengthSquared =
            deltaX * deltaX + deltaY * deltaY;

        if (segmentLengthSquared === 0) continue;

        const rawProjection =
            ((pointX - startX) * deltaX +
                (pointY - startY) * deltaY) /
            segmentLengthSquared;

        const projection = Math.max(
            0,
            Math.min(1, rawProjection)
        );

        const candidate: LatLngPoint = {
            lat: startY + projection * deltaY,
            lng:
                (startX + projection * deltaX) /
                longitudeScale,
        };

        const distance = calculateDistanceMeters(
            point,
            candidate
        );

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestPoint = candidate;
            nearestHeading = calculateBearing(start, end);
        }
    }

    if (
        !Number.isFinite(nearestDistance) ||
        nearestDistance > maxSnapDistanceMeters
    ) {
        return {
            position: point,
            routeHeading: null,
            snapped: false,
            distanceMeters: Number.isFinite(nearestDistance)
                ? nearestDistance
                : 0,
        };
    }

    return {
        position: nearestPoint,
        routeHeading: nearestHeading,
        snapped: true,
        distanceMeters: nearestDistance,
    };
};

const VehicleMarkerHtml = ({
    heading,
    vehicleNumber,
}: {
    heading: number;
    vehicleNumber: string;
}) => {
    const correctedHeading = getCorrectedHeading(heading);
    const safeVehicleNumber = escapeHtml(
        vehicleNumber || "Vehicle"
    );

    return `
        <div
            style="
                position: relative;
                width: 90px;
                height: 110px;
                pointer-events: none;
                user-select: none;
                overflow: visible;
            "
        >
            <!-- Shadow remains below the truck -->
            <div
                style="
                    position: absolute;
                    left: 50%;
                    top: 84px;
                    width: 46px;
                    height: 12px;
                    transform: translateX(-50%);
                    border-radius: 50%;
                    background: rgba(15, 23, 42, 0.30);
                    filter: blur(6px);
                "
            ></div>

            <!-- Only the truck rotates -->
            <div
                class="truck-rotor"
                style="
                    position: absolute;
                    left: 50%;
                    top: 5px;
                    width: 58px;
                    height: 100px;
                    transform: translateX(-50%) rotate(${correctedHeading}deg);
                    transform-origin: center center;
                    will-change: transform;
                "
            >
                <img
                    src="${TruckImg}"
                    alt="Live vehicle"
                    draggable="false"
                    style="
                        display: block;
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        pointer-events: none;
                        user-select: none;
                        filter: drop-shadow(0 6px 4px rgba(15, 23, 42, 0.32));
                    "
                />
            </div>

            <!-- Small connector from truck to vehicle-number label -->
            <div
                style="
                    position: absolute;
                    left: calc(50% + 25px);
                    top: 51px;
                    width: 17px;
                    height: 2px;
                    border-radius: 999px;
                    background: rgba(79, 70, 229, 0.75);
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.22);
                "
            ></div>

            <!-- Vehicle number displayed beside the truck, not on it -->
            <div
                style="
                    position: absolute;
                    left: calc(50% + 40px);
                    top: 52px;
                    z-index: 10;
                    transform: translateY(-50%);
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    min-width: 118px;
                    max-width: 155px;
                    padding: 8px 10px;
                    overflow: hidden;
                    white-space: nowrap;
                    border: 1px solid rgba(79, 70, 229, 0.30);
                    border-radius: 9px;
                    background: rgba(255, 255, 255, 0.97);
                    color: #4338ca;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    font-weight: 800;
                    line-height: 1;
                    box-sizing: border-box;
                    box-shadow: 0 7px 18px rgba(15, 23, 42, 0.24);
                    backdrop-filter: blur(4px);
                "
            >
                <span
                    style="
                        display: block;
                        width: 8px;
                        height: 8px;
                        flex: 0 0 8px;
                        border-radius: 50%;
                        background: #10b981;
                        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
                    "
                ></span>

                <span
                    class="truck-label"
                    style="
                        display: block;
                        min-width: 0;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    "
                >
                    ${safeVehicleNumber}
                </span>
            </div>
        </div>
    `;
};

const SmoothVehicleMarker = memo(
    ({
        map,
        position,
        heading,
        vehicleNumber,
    }: {
        map: google.maps.Map | null;
        position: { lat: number; lng: number } | null;
        heading: number;
        vehicleNumber: string;
    }) => {
        const overlayRef = useRef<google.maps.OverlayView | null>(null);
        const divRef = useRef<HTMLDivElement | null>(null);
        const animationRef = useRef<number | null>(null);

        const currentPositionRef = useRef<{ lat: number; lng: number } | null>(
            position
        );

        const drawMarker = () => {
            const overlay = overlayRef.current;
            const div = divRef.current;
            const currentPosition = currentPositionRef.current;

            if (!overlay || !div || !currentPosition) return;

            const projection = overlay.getProjection();
            if (!projection) return;

            const point = projection.fromLatLngToDivPixel(
                new google.maps.LatLng(currentPosition.lat, currentPosition.lng)
            );

            if (!point) return;

            div.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        };

        useEffect(() => {
            if (!map || !position) return;

            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.willChange = "transform";
            div.style.zIndex = "9999";
            div.style.pointerEvents = "none";
            div.innerHTML = VehicleMarkerHtml({ heading, vehicleNumber });

            divRef.current = div;
            currentPositionRef.current = position;

            const overlay = new google.maps.OverlayView();

            overlay.onAdd = function () {
                const panes = overlay.getPanes();
                panes?.overlayMouseTarget.appendChild(div);
            };

            overlay.draw = function () {
                drawMarker();
            };

            overlay.onRemove = function () {
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
            };

            overlay.setMap(map);
            overlayRef.current = overlay;

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }

                overlay.setMap(null);
                overlayRef.current = null;
                divRef.current = null;
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [map]);

        useEffect(() => {
            const div = divRef.current;
            if (!div) return;

            const rotor = div.querySelector(
                ".truck-rotor"
            ) as HTMLDivElement | null;

            const label = div.querySelector(
                ".truck-label"
            ) as HTMLSpanElement | null;

            if (rotor) {
                const correctedHeading =
                    getCorrectedHeading(heading);

                rotor.style.transform =
                    `translateX(-50%) rotate(${correctedHeading}deg)`;
            }

            if (label) {
                label.textContent = vehicleNumber || "Vehicle";
            }
        }, [heading, vehicleNumber]);

        useEffect(() => {
            if (!position) return;

            const from = currentPositionRef.current || position;
            const to = position;

            if (from.lat === to.lat && from.lng === to.lng) return;

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            const startTime = performance.now();
            const duration = 4500;

            const animate = (now: number) => {
                const elapsed = now - startTime;
                const rawProgress = Math.min(elapsed / duration, 1);

                const progress =
                    rawProgress < 0.5
                        ? 2 * rawProgress * rawProgress
                        : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

                currentPositionRef.current = {
                    lat: from.lat + (to.lat - from.lat) * progress,
                    lng: from.lng + (to.lng - from.lng) * progress,
                };

                drawMarker();

                if (rawProgress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    currentPositionRef.current = to;
                    drawMarker();
                }
            };

            animationRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [position?.lat, position?.lng]);

        return null;
    }
);

const MapPinLabel = memo(
    ({
        label,
        tone,
    }: {
        label: string;
        tone: "pickup" | "delivery";
    }) => {
        const color =
            tone === "pickup"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white";

        return (
            <div className="pointer-events-none -translate-x-1/2 -translate-y-full">
                <div className="flex flex-col items-center">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full shadow-xl ring-4 ring-white ${color}`}
                    >
                        <MapPin size={20} />
                    </div>

                    <div
                        className={`mt-1 rounded-md px-2 py-1 text-xs font-bold shadow-md ${color}`}
                    >
                        {label}
                    </div>
                </div>
            </div>
        );
    }
);

const LiveTrackingMap = memo(
    ({
        coords,
        pickupCoords,
        deliveryCoords,
        routePolyline,
        heading,
        vehicleNumber,
    }: {
        coords: LatLngPoint | null;
        pickupCoords: LatLngPoint | null;
        deliveryCoords: LatLngPoint | null;
        routePolyline: string;
        heading: number;
        vehicleNumber: string;
    }) => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        const mapRef = useRef<google.maps.Map | null>(null);
        const fitBoundsDoneRef = useRef(false);
        const lastPositionKeyRef = useRef("");

        const [mapInstance, setMapInstance] =
            useState<google.maps.Map | null>(null);

        const [directions, setDirections] =
            useState<google.maps.DirectionsResult | null>(null);

        const { isLoaded } = useJsApiLoader({
            googleMapsApiKey: apiKey || "",
        });

        const decodedRoutePath = useMemo<LatLngPoint[]>(() => {
            return decodePolyline(routePolyline);
        }, [routePolyline]);

        const directionsRoutePath = useMemo<LatLngPoint[]>(() => {
            const overviewPath =
                directions?.routes?.[0]?.overview_path || [];

            return overviewPath.map((point) => ({
                lat: point.lat(),
                lng: point.lng(),
            }));
        }, [directions]);

        const activeRoutePath = useMemo<LatLngPoint[]>(() => {
            if (decodedRoutePath.length > 1) {
                return decodedRoutePath;
            }

            if (directionsRoutePath.length > 1) {
                return directionsRoutePath;
            }

            return [];
        }, [decodedRoutePath, directionsRoutePath]);

        const snappedVehicle = useMemo<SnappedRoutePoint | null>(() => {
            if (!coords) return null;

            return snapPointToRoute(
                coords,
                activeRoutePath,
                MAX_ROUTE_SNAP_DISTANCE_METERS
            );
        }, [coords?.lat, coords?.lng, activeRoutePath]);

        const displayCoords = snappedVehicle?.position || coords;

        const displayHeading =
            snappedVehicle?.routeHeading ?? heading;

        const initialMapCenterRef = useRef(
            displayCoords ||
            pickupCoords ||
            deliveryCoords ||
            DEFAULT_CENTER
        );

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
                backgroundColor: "#f8fafc",
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels.text",
                        stylers: [{ visibility: "simplified" }],
                    },
                    {
                        featureType: "transit",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }],
                    },
                    {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ visibility: "on" }],
                    },
                    {
                        featureType: "road",
                        elementType: "labels",
                        stylers: [{ visibility: "on" }],
                    },
                ],
            };
        }, [isLoaded]);

        useEffect(() => {
            if (!isLoaded || !pickupCoords || !deliveryCoords) {
                return;
            }

            if (decodedRoutePath.length > 1) {
                setDirections(null);
                return;
            }

            const service = new google.maps.DirectionsService();

            service.route(
                {
                    origin: pickupCoords,
                    destination: deliveryCoords,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (
                        status === google.maps.DirectionsStatus.OK &&
                        result
                    ) {
                        setDirections(result);
                    } else {
                        setDirections(null);
                    }
                }
            );
        }, [
            isLoaded,
            pickupCoords?.lat,
            pickupCoords?.lng,
            deliveryCoords?.lat,
            deliveryCoords?.lng,
            decodedRoutePath.length,
        ]);

        useEffect(() => {
            if (
                !isLoaded ||
                !mapRef.current ||
                fitBoundsDoneRef.current
            ) {
                return;
            }

            const bounds = new google.maps.LatLngBounds();

            if (activeRoutePath.length > 1) {
                activeRoutePath.forEach((point) =>
                    bounds.extend(point)
                );
            }

            if (pickupCoords) bounds.extend(pickupCoords);
            if (deliveryCoords) bounds.extend(deliveryCoords);
            if (displayCoords) bounds.extend(displayCoords);

            if (!bounds.isEmpty()) {
                mapRef.current.fitBounds(bounds, 50);
                fitBoundsDoneRef.current = true;

                window.setTimeout(() => {
                    if (!displayCoords || !mapRef.current) return;

                    mapRef.current.setZoom(FOLLOW_ZOOM);

                    const visibleBounds =
                        mapRef.current.getBounds();

                    if (!visibleBounds?.contains(displayCoords)) {
                        mapRef.current.panTo(displayCoords);
                    }
                }, 650);
            }
        }, [
            isLoaded,
            pickupCoords?.lat,
            pickupCoords?.lng,
            deliveryCoords?.lat,
            deliveryCoords?.lng,
            displayCoords?.lat,
            displayCoords?.lng,
            activeRoutePath,
        ]);

        useEffect(() => {
            if (
                !isLoaded ||
                !mapRef.current ||
                !displayCoords
            ) {
                return;
            }

            const positionKey =
                `${displayCoords.lat},${displayCoords.lng}`;

            if (lastPositionKeyRef.current === positionKey) {
                return;
            }

            lastPositionKeyRef.current = positionKey;

            window.requestAnimationFrame(() => {
                if (!mapRef.current) return;

                const currentZoom =
                    mapRef.current.getZoom() || 0;

                if (currentZoom < FOLLOW_ZOOM) {
                    mapRef.current.setZoom(FOLLOW_ZOOM);
                }

                mapRef.current.panTo(displayCoords);
            });
        }, [
            isLoaded,
            displayCoords?.lat,
            displayCoords?.lng,
        ]);

        if (!apiKey) {
            return (
                <div className="flex h-full items-center justify-center bg-muted p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Google Maps API key missing. Add
                        VITE_GOOGLE_MAPS_API_KEY in .env.
                    </p>
                </div>
            );
        }

        if (!isLoaded) {
            return (
                <div className="flex h-full items-center justify-center bg-muted">
                    <div className="text-sm text-muted-foreground">
                        Loading map...
                    </div>
                </div>
            );
        }

        if (!coords || !displayCoords) {
            return (
                <div className="flex h-full flex-col items-center justify-center bg-muted p-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-md bg-card text-muted-foreground shadow-sm">
                        <MapPin size={30} />
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-foreground">
                        Location not available
                    </h3>

                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        Driver coordinates are missing for this
                        tracking record.
                    </p>
                </div>
            );
        }

        const fallbackPath = [
            pickupCoords,
            displayCoords,
            deliveryCoords,
        ].filter(Boolean) as LatLngPoint[];

        return (
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={initialMapCenterRef.current}
                zoom={FOLLOW_ZOOM}
                options={mapOptions}
                onLoad={(map) => {
                    mapRef.current = map;
                    setMapInstance(map);

                    window.setTimeout(() => {
                        map.setZoom(FOLLOW_ZOOM);
                        map.panTo(displayCoords);
                    }, 200);
                }}
                onUnmount={() => {
                    mapRef.current = null;
                    setMapInstance(null);
                }}
            >
                {decodedRoutePath.length > 1 ? (
                    <PolylineF
                        path={decodedRoutePath}
                        options={{
                            strokeColor: "#2563EB",
                            strokeOpacity: 0.95,
                            strokeWeight: 7,
                        }}
                    />
                ) : directions ? (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            suppressMarkers: true,
                            preserveViewport: true,
                            polylineOptions: {
                                strokeColor: "#2563EB",
                                strokeOpacity: 0.95,
                                strokeWeight: 7,
                            },
                        }}
                    />
                ) : fallbackPath.length >= 2 ? (
                    <PolylineF
                        path={fallbackPath}
                        options={{
                            strokeColor: "#2563EB",
                            strokeOpacity: 0.95,
                            strokeWeight: 7,
                        }}
                    />
                ) : null}

                {pickupCoords && (
                    <>
                        <MarkerF
                            position={pickupCoords}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 0,
                            }}
                        />

                        <OverlayView
                            position={pickupCoords}
                            mapPaneName={
                                OverlayView.OVERLAY_MOUSE_TARGET
                            }
                        >
                            <MapPinLabel
                                label="Pickup"
                                tone="pickup"
                            />
                        </OverlayView>
                    </>
                )}

                {deliveryCoords && (
                    <>
                        <MarkerF
                            position={deliveryCoords}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 0,
                            }}
                        />

                        <OverlayView
                            position={deliveryCoords}
                            mapPaneName={
                                OverlayView.OVERLAY_MOUSE_TARGET
                            }
                        >
                            <MapPinLabel
                                label="Delivery"
                                tone="delivery"
                            />
                        </OverlayView>
                    </>
                )}

                <SmoothVehicleMarker
                    map={mapInstance}
                    position={displayCoords}
                    heading={displayHeading}
                    vehicleNumber={vehicleNumber}
                />
            </GoogleMap>
        );
    },
    (prev, next) => {
        return (
            prev.coords?.lat === next.coords?.lat &&
            prev.coords?.lng === next.coords?.lng &&
            prev.pickupCoords?.lat === next.pickupCoords?.lat &&
            prev.pickupCoords?.lng === next.pickupCoords?.lng &&
            prev.deliveryCoords?.lat === next.deliveryCoords?.lat &&
            prev.deliveryCoords?.lng === next.deliveryCoords?.lng &&
            prev.routePolyline === next.routePolyline &&
            prev.heading === next.heading &&
            prev.vehicleNumber === next.vehicleNumber
        );
    }
);

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

    const fetchInProgressRef = useRef(false);

    const trackingVoucher = useMemo(
        () => String(routeVoucher || getTripTrackingVoucher(tracking) || "").trim(),
        [routeVoucher, tracking]
    );

    const pickupLocation = getPickupLocation(tracking);
    const deliveryLocation = getDeliveryLocation(tracking);

    const pickupCoords = getLatLng(pickupLocation);
    const deliveryCoords = getLatLng(deliveryLocation);

    const currentLocation =
        tracking?.currentLocation || initialCurrentLocation || null;

    const coords = getLatLng(currentLocation);

    const routePolyline = String(tracking?.route?.routePolyline || "");
    const heading = getHeading(tracking);

    const lastUpdated = getLastUpdated(tracking);

    const fetchTracking = async (silent = false) => {
        try {
            if (!trackingVoucher) {
                toast.error("Tracking voucher not found");
                setLoading(false);
                return;
            }

            if (fetchInProgressRef.current) return;

            fetchInProgressRef.current = true;

            if (!silent) {
                setLoading(true);
                setRefreshing(true);
            }

            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/bookEZ/tripTracking/getByVoucherNumber/${encodeURIComponent(
                    trackingVoucher
                )}`
            );

            const detail = unwrapTripTrackingDetail(response);

            if (detail) {
                setTracking((prev: any) => {
                    const oldLat = String(prev?.currentLocation?.lat || "");
                    const oldLng = String(prev?.currentLocation?.lng || "");
                    const oldHeading = String(prev?.currentLocation?.heading || "");
                    const oldUpdated = String(prev?.lastUpdatedAt || prev?.updatedAt || "");

                    const newLat = String(detail?.currentLocation?.lat || "");
                    const newLng = String(detail?.currentLocation?.lng || "");
                    const newHeading = String(detail?.currentLocation?.heading || "");
                    const newUpdated = String(detail?.lastUpdatedAt || detail?.updatedAt || "");

                    if (
                        oldLat === newLat &&
                        oldLng === newLng &&
                        oldHeading === newHeading &&
                        oldUpdated === newUpdated
                    ) {
                        return prev;
                    }

                    return detail;
                });
            }
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load live trip tracking"
            );
        } finally {
            fetchInProgressRef.current = false;
            setLoading(false);

            if (!silent) {
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        fetchTracking(false);

        const timer = window.setInterval(() => {
            fetchTracking(true);
        }, LIVE_REFRESH_MS);

        return () => {
            window.clearInterval(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackingVoucher]);

    const handleBack = () => {
        navigate(-1);
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
            className="h-screen overflow-hidden bg-background p-3"
        >
            <div className="mx-auto flex h-full w-full max-w-[1700px] flex-col gap-3 overflow-hidden">
                <motion.div
                    variants={sectionVariants}
                    className="shrink-0 rounded-md border border-border bg-card p-3 shadow-sm"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center">
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

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-lg font-bold text-card-foreground">
                                        Vehicle No. :{" "}
                                        <span className="font-bold text-primary">
                                            {vehicleNumber}
                                        </span>{" "}
                                        | Trip No. :  <span className="font-bold text-primary">{tripLabel}</span>
                                    </h2>
                                </div>

                                <div className="flex items-center">
                                    <p className="my-0 truncate text-sm text-muted-foreground">
                                        {trackingVoucher
                                            ? `Tracking ID: ${trackingVoucher}`
                                            : "Tracking voucher not found"}
                                    </p>

                                    <span
                                        className={`ms-3 inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${getStatusClass(
                                            tripStatus
                                        )}`}
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        {formatStatusLabel(tripStatus)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <motion.button
                                type="button"
                                onClick={() => fetchTracking(true)}
                                disabled={loading || refreshing}
                                whileHover={!loading && !refreshing ? { scale: 1.02 } : undefined}
                                whileTap={!loading && !refreshing ? { scale: 0.96 } : undefined}
                                className="
                                    inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3
                                    text-sm font-bold text-primary-foreground shadow-sm transition
                                    hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60
                                "
                            >
                                <RefreshCcw
                                    size={16}
                                    className={loading || refreshing ? "animate-spin" : ""}
                                />
                                Refresh
                            </motion.button>
                        </div>
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
                            className="min-h-0 flex-1"
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
                            className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-8 text-center shadow-sm"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <MapPin size={30} />
                            </div>

                            <h3 className="mt-4 text-lg font-bold text-foreground">
                                Tracking not found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
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
                            className="grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)] gap-3 overflow-hidden"
                        >
                            <motion.div
                                variants={sectionVariants}
                                className="min-h-0 overflow-hidden"
                            >
                                <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
                                    <div className="shrink-0 rounded-md border border-border bg-card p-3 shadow-sm">
                                        <div className="grid grid-cols-1 gap-3">
                                            <InfoItem icon={User} label="Driver" value={driverName} />

                                            <InfoItem
                                                icon={Navigation}
                                                label="Mobile"
                                                value={driverMobile}
                                            />

                                            <InfoItem
                                                icon={Gauge}
                                                label="Speed"
                                                value={getSpeed(tracking)}
                                            />

                                            <InfoItem
                                                icon={Clock}
                                                label="Updated"
                                                value={formatDateTime(lastUpdated)}
                                            />
                                        </div>
                                    </div>

                                    <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-card p-3 shadow-sm">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <h3 className="text-sm font-bold text-card-foreground">
                                                Route Details
                                            </h3>

                                            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                                Live
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <RouteAddressCard
                                                type="pickup"
                                                title="From / Pickup"
                                                address={getAddress(pickupLocation)}
                                                coords={pickupCoords}
                                            />

                                            <RouteAddressCard
                                                type="delivery"
                                                title="To / Delivery"
                                                address={getAddress(deliveryLocation)}
                                                coords={deliveryCoords}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={sectionVariants}
                                className="min-h-0 overflow-hidden"
                            >
                                <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm">
                                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-card-foreground">
                                                Live Map
                                            </h3>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                                                <span className="text-sm text-muted-foreground">
                                                    Pickup
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded-full bg-red-500" />
                                                <span className="text-sm text-muted-foreground">
                                                    Delivery
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded-full bg-primary" />
                                                <span className="text-sm text-muted-foreground">
                                                    Vehicle
                                                </span>
                                            </div>

                                            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-sm font-medium">Live</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-h-0 flex-1 bg-muted">
                                        <LiveTrackingMap
                                            coords={coords}
                                            pickupCoords={pickupCoords}
                                            deliveryCoords={deliveryCoords}
                                            routePolyline={routePolyline}
                                            heading={heading}
                                            vehicleNumber={vehicleNumber}
                                        />
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