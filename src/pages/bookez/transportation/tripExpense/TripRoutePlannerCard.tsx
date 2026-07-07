import { useEffect, useMemo, useRef, useState } from "react";
import {
    Clock,
    ExternalLink,
    Loader2,
    Map,
    MapPin,
    Navigation,
    X,
} from "lucide-react";
import { extractRouteEndpoints, getRouteLatLngPoints, mapOrsRoutesToCards, openGoogleMapsDirections } from "./routePlannerHelper";
import { getBestRoutes } from "../../../../redux/slices/professionalSlice/transportation/routePlannerApi";



const buildMapHtml = ({
    origin,
    destination,
    route,
    routeIndex = 0,
    isEstimated = false,
}: any) => {
    const originPoint = [Number(origin.lat), Number(origin.lng)];
    const destPoint = [Number(destination.lat), Number(destination.lng)];

    let routeCoords = getRouteLatLngPoints?.(route, origin, destination) || [];

    if (routeCoords.length >= 2 && isEstimated && routeIndex > 0) {
        const midIdx = Math.floor(routeCoords.length / 2);

        routeCoords = routeCoords.map((point: any, idx: number) => {
            if (idx < midIdx - 5 || idx > midIdx + 5) return point;

            const [lat, lng] = point;
            const shift = routeIndex === 1 ? 0.12 : -0.1;

            return [lat + shift, lng + shift * 0.8];
        });
    }

    if (routeCoords.length < 2) {
        routeCoords = [originPoint as [number, number], destPoint as [number, number]];
    }

    return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
	html, body, #map {
		height: 100%;
		margin: 0;
		padding: 0;
		background: #F8FAFC;
	}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
	const origin = ${JSON.stringify(originPoint)};
	const destination = ${JSON.stringify(destPoint)};
	const routeCoords = ${JSON.stringify(routeCoords)};

	const map = L.map('map', {
		zoomControl: false,
		attributionControl: false
	});

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19
	}).addTo(map);

	const routeLine = L.polyline(routeCoords, {
		color: '#2563EB',
		weight: 5,
		opacity: 0.9
	}).addTo(map);

	L.circleMarker(origin, {
		radius: 8,
		color: '#16A34A',
		fillColor: '#16A34A',
		fillOpacity: 1,
		weight: 2
	}).addTo(map);

	L.circleMarker(destination, {
		radius: 8,
		color: '#DC2626',
		fillColor: '#DC2626',
		fillOpacity: 1,
		weight: 2
	}).addTo(map);

	map.fitBounds(routeLine.getBounds(), { padding: [28, 28] });
	setTimeout(() => map.invalidateSize(), 400);
</script>
</body>
</html>`;
};

const RouteBadge = ({ badge }: any) => {
    const lower = String(badge || "").toLowerCase();

    const cls = lower.includes("fast")
        ? "bg-success/10 text-success"
        : lower.includes("delay")
            ? "bg-amber-100 text-amber-700"
            : "bg-primary/10 text-primary";

    return (
        <span
            className={`rounded-xl px-2 py-1 text-[10px] font-semibold uppercase ${cls}`}
        >
            {badge}
        </span>
    );
};

const RouteOptionCard = ({ item, selected, onClick }: any) => {
    const badge = String(item?.badge || "").toLowerCase();

    const selectedClass = badge.includes("fast")
        ? "border-success bg-success/10"
        : badge.includes("delay")
            ? "border-warning bg-warning/10"
            : "border-primary bg-primary/10";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-lg border p-2 text-left transition ${selected
                ? selectedClass
                : "border-border bg-background hover:bg-muted/50"
                }`}
        >
            <div className="flex items-start justify-between gap-3">

                <RouteBadge badge={item?.badge || "Route"} />

                <p className="font-semibold uppercase text-xs">
                    {item?.label || "Route Option"}
                </p>


                {selected && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Selected
                    </span>
                )}
            </div>

            <div className="flex items-end justify-between gap-3">
                <p className="text-md font-bold text-primary">
                    {item?.distanceKm || "--"}
                </p>

                <div className="flex items-center gap-1 text-sm font-bold text-card-foreground">
                    <Clock size={13} className="text-muted-foreground" />
                    {item?.durationText || "--"}
                </div>
            </div>

            <p className="line-clamp-2 text-xs font-semibold text-muted-foreground">
                {item?.via || "Route option"}
            </p>
        </button>
    );
};
const AddressBox = ({ title, value }: any) => (
    <div className="rounded-md border border-border bg-muted/30 p-3">
        <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
            <MapPin size={14} />
            {title}
        </p>

        <p className="line-clamp-2 text-sm font-bold text-card-foreground">
            {value || "-"}
        </p>
    </div>
);

export default function TripRoutePlannerCard({ routesData, className = "" }: any) {
    const pickupLat = routesData?.pickupDetails?.pickupLatitude;
    const pickupLng = routesData?.pickupDetails?.pickupLongitude;
    const deliveryLat = routesData?.deliveryDetails?.deliveryLatitude;
    const deliveryLng = routesData?.deliveryDetails?.deliveryLongitude;
    const savedDistanceKm = routesData?.routeDetails?.routeDistanceKm || "";

    const routeKey = useMemo(() => {
        if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) return "";
        return `${pickupLat},${pickupLng}|${deliveryLat},${deliveryLng}`;
    }, [pickupLat, pickupLng, deliveryLat, deliveryLng]);

    const endpoints = useMemo(
        () => extractRouteEndpoints(routesData),
        [
            routeKey,
            routesData?.pickupDetails?.pickupAddress,
            routesData?.pickupDetails?.pickupLocation,
            routesData?.deliveryDetails?.deliveryAddress,
            routesData?.deliveryDetails?.deliveryLocation,
        ]
    );

    const [rawRoutes, setRawRoutes] = useState<any[]>([]);
    const [routeCards, setRouteCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [errorText, setErrorText] = useState("");
    const [sheetVisible, setSheetVisible] = useState(false);

    const fetchedKeyRef = useRef("");

    useEffect(() => {
        if (!routeKey || !endpoints) {
            setRawRoutes([]);
            setRouteCards([]);
            return;
        }

        if (fetchedKeyRef.current === routeKey) return;

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setErrorText("");

                const routes = await getBestRoutes({
                    origin: {
                        lat: endpoints.origin.lat,
                        lng: endpoints.origin.lng,
                    },
                    destination: {
                        lat: endpoints.destination.lat,
                        lng: endpoints.destination.lng,
                    },
                });

                if (cancelled) return;

                const list = Array.isArray(routes) ? routes : [];

                setRawRoutes(list);
                setRouteCards(mapOrsRoutesToCards(list, savedDistanceKm));
                setSelectedIndex(0);
                fetchedKeyRef.current = routeKey;
            } catch (e: any) {
                if (cancelled) return;

                setRawRoutes([]);
                setRouteCards(mapOrsRoutesToCards([], savedDistanceKm));
                setErrorText(e?.message || "Could not load route options");
                fetchedKeyRef.current = routeKey;
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [routeKey, savedDistanceKm, endpoints]);

    const handleOpenMaps = async (cardIndex = selectedIndex) => {
        if (!endpoints) return;

        const card = routeCards[cardIndex];

        const route =
            card?.route ||
            rawRoutes[cardIndex] ||
            rawRoutes[0] ||
            routeCards[0]?.route;

        try {
            await openGoogleMapsDirections({
                origin: endpoints.origin,
                destination: endpoints.destination,
                route,
                routeIndex: cardIndex,
                isEstimated: !!card?.isEstimated,
            });
        } catch (e: any) {
            console.log("[TripRoutePlanner] maps open failed", e?.message || e);
        }
    };

    if (!endpoints) return null;

    const fastestCard = routeCards[0];

    const selectedCard = routeCards[selectedIndex];

    const selectedRoute =
        selectedCard?.route || rawRoutes[selectedIndex] || rawRoutes[0];

    const mapHtml = buildMapHtml({
        origin: endpoints.origin,
        destination: endpoints.destination,
        route: selectedRoute,
        routeIndex: selectedIndex,
        isEstimated: !!selectedCard?.isEstimated,
    });

    const savedDistance = endpoints?.routeDetails?.routeDistanceKm;

    const compactDistance =
        fastestCard?.distanceKm || (savedDistance ? `${savedDistance} km` : "--");

    const compactDuration = fastestCard?.durationText || "Tap to view";

    return (
        <>
            <div
                className={`
		group relative w-full overflow-hidden rounded-xl 
		 
		${className}
	`}
            >
                <div className="absolute right-0 top-0 h-20 w-20 rounded-full  " />

                <div className="relative grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto_auto] xl:items-center">
                    <div className="flex min-w-0 items-center gap-4">

                        <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">

                              

                                <RouteBadge badge="Fastest" />

                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                                    Best route
                                </span>
                            </div>

                            <p className="text-sm font-bold text-card-foreground">
                                Fastest Route
                            </p>

                            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                Compare fastest, delayed, and alternative routes
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg   px-4 py-2 text-left xl:text-right">
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                <Loader2 className="animate-spin" size={16} />
                                Loading...
                            </div>
                        ) : (
                            <>
                                <p className="text-xl font-bold leading-none text-primary">
                                    {compactDistance}
                                </p>

                                <p className="mt-1 text-sm font-bold text-card-foreground">
                                    {compactDuration}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <button
                            type="button"
                            onClick={() => setSheetVisible(true)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition hover:bg-primary/15"
                        >
                            <Navigation size={15} />
                            View Routes
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOpenMaps()}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                        >
                            <ExternalLink size={15} />
                            Open Maps
                        </button>
                    </div>
                </div>


            </div>

            {sheetVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45  backdrop-blur-sm">
                    <button
                        type="button"
                        className="absolute inset-0"
                        onClick={() => setSheetVisible(false)}
                    />

                    <div className="relative z-10 flex  w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card ">
                        {/* Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card p-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                                    <Map size={20} />
                                </span>

                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-bold text-card-foreground">
                                        Best Route Planner
                                    </h3>

                                    <p className="truncate text-sm font-medium text-muted-foreground">
                                        Compare fastest, delayed, and alternative route options.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSheetVisible(false)}
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="min-h-0 flex-1 overflow-y-auto p-3">
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.8fr]">
                                {/* Left side */}
                                <div className="flex min-w-0 flex-col gap-4">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <AddressBox
                                            title="Pickup"
                                            value={endpoints.origin.address || endpoints.origin.label}
                                        />

                                        <AddressBox
                                            title="Delivery"
                                            value={
                                                endpoints.destination.address ||
                                                endpoints.destination.label
                                            }
                                        />
                                    </div>

                                    <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
                                        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
                                            <div>
                                                <p className="text-sm font-bold text-card-foreground">
                                                    Route Preview
                                                </p>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Selected route is highlighted on the map
                                                </p>
                                            </div>

                                            {selectedCard?.badge && (
                                                <RouteBadge badge={selectedCard.badge} />
                                            )}
                                        </div>

                                        <div className="h-[300px] md:h-[360px]">
                                            <iframe
                                                title="Route Preview"
                                                srcDoc={mapHtml}
                                                className="h-full w-full border-0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right side */}
                                <div className="flex  flex-col gap-2">
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2">
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                            Selected Route
                                        </p>

                                        <h4 className="text-base font-bold text-card-foreground">
                                            {selectedCard?.label || "Route Option"}
                                        </h4>

                                        <div className=" flex items-end justify-between gap-3">

                                            <p className="text-md font-bold leading-none text-primary">
                                                {selectedCard?.distanceKm || compactDistance || "--"}
                                            </p>

                                            <p className=" text-sm font-bold text-card-foreground">
                                                {selectedCard?.durationText || compactDuration || "--"}
                                            </p>


                                            {selectedCard?.badge && (
                                                <RouteBadge badge={selectedCard.badge} />
                                            )}
                                        </div>

                                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                                            {selectedCard?.via ||
                                                "Best route based on available route data."}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-border bg-card p-2">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-sm font-bold text-card-foreground">
                                                Route Options
                                            </p>

                                            <p className="text-xs font-bold text-muted-foreground">
                                                {routeCards?.length || 0} routes
                                            </p>
                                        </div>

                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 p-4 text-sm font-bold text-muted-foreground">
                                                <Loader2 className="animate-spin" size={16} />
                                                Finding routes...
                                            </div>
                                        ) : routeCards.length === 0 ? (
                                            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm font-bold text-muted-foreground">
                                                {errorText || "Route options unavailable"}
                                            </div>
                                        ) : (
                                            <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
                                                {routeCards.map((item: any, index: number) => (
                                                    <RouteOptionCard
                                                        key={item?.id || index}
                                                        item={item}
                                                        selected={selectedIndex === index}
                                                        onClick={() => setSelectedIndex(index)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleOpenMaps(selectedIndex)}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                                    >
                                        <ExternalLink size={16} />
                                        Open in Google Maps
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}