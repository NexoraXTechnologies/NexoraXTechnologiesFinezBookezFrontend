// export const extractRouteEndpoints = (routesData: any = {}) => {
//   const pickup = routesData?.pickupDetails || {};
//   const delivery = routesData?.deliveryDetails || {};

//   const originLat = pickup.pickupLatitude || pickup.latitude || pickup.lat;
//   const originLng = pickup.pickupLongitude || pickup.longitude || pickup.lng;
//   const destinationLat = delivery.deliveryLatitude || delivery.latitude || delivery.lat;
//   const destinationLng = delivery.deliveryLongitude || delivery.longitude || delivery.lng;

//   if (!originLat || !originLng || !destinationLat || !destinationLng) return null;

//   return {
//     origin: {
//       lat: Number(originLat),
//       lng: Number(originLng),
//       label: pickup.pickupAddress || pickup.pickupLocation || pickup.location || "Pickup",
//     },
//     destination: {
//       lat: Number(destinationLat),
//       lng: Number(destinationLng),
//       label: delivery.deliveryAddress || delivery.deliveryLocation || delivery.location || "Delivery",
//     },
//     routeDetails: routesData?.routeDetails || {},
//   };
// };

// export const mapOrsRoutesToCards = (routes: any[] = [], savedDistanceKm = "") => {
//   if (!routes.length && savedDistanceKm) {
//     return [{ id: "saved", badge: "Saved", label: "Saved route", distanceKm: `${savedDistanceKm} km`, durationText: "Saved distance", isEstimated: true }];
//   }

//   return routes.map((route: any, index: number) => {
//     const summary = route?.summary || route?.properties?.summary || {};
//     const distanceMeters = summary.distance || route?.distance || 0;
//     const durationSeconds = summary.duration || route?.duration || 0;
//     const distanceKm = distanceMeters ? `${(Number(distanceMeters) / 1000).toFixed(1)} km` : route?.distanceKm || "--";
//     const durationText = durationSeconds ? `${Math.round(Number(durationSeconds) / 60)} min` : route?.durationText || "--";

//     return {
//       id: route?.id || `route-${index}`,
//       badge: index === 0 ? "Fastest" : "Alternate",
//       label: index === 0 ? "Recommended route" : `Alternate route ${index}`,
//       distanceKm,
//       durationText,
//       route,
//     };
//   });
// };

// export const openGoogleMapsDirections = ({ origin, destination }: any) => {
//   const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
//   window.open(url, "_blank", "noopener,noreferrer");
// };



type LatLngPoint = [number, number];



const formatDistanceKm = (meters: any) => {
	const km = Number(meters || 0) / 1000;

	if (!km) return "--";

	return `${km.toFixed(1)} km`;
};

const formatDuration = (seconds: any) => {
	const totalMinutes = Math.round(Number(seconds || 0) / 60);

	if (!totalMinutes) return "--";

	const h = Math.floor(totalMinutes / 60);
	const m = totalMinutes % 60;

	if (h && m) return `${h}h ${m}m`;
	if (h) return `${h}h`;

	return `${m} min`;
};

const numberFromDistance = (value: any) => {
	const text = String(value || "").replace(/,/g, "");
	const match = text.match(/-?\d+(\.\d+)?/);

	return match ? Number(match[0]) : 0;
};

const minutesFromDurationText = (value: any) => {
	const text = String(value || "").toLowerCase();

	const hourMatch = text.match(/(\d+)\s*h/);
	const minMatch = text.match(/(\d+)\s*m/);

	const hours = hourMatch ? Number(hourMatch[1]) : 0;
	const minutes = minMatch ? Number(minMatch[1]) : 0;

	if (hours || minutes) return hours * 60 + minutes;

	const onlyNumber = text.match(/-?\d+(\.\d+)?/);

	return onlyNumber ? Number(onlyNumber[0]) : 0;
};

const formatMinutes = (minutes: any) => {
	const total = Math.round(Number(minutes || 0));

	if (!total) return "--";

	const h = Math.floor(total / 60);
	const m = total % 60;

	if (h && m) return `${h}h ${m}m`;
	if (h) return `${h}h`;

	return `${m} min`;
};

const getRouteSummary = (route: any) => {
	return route?.summary || route?.segments?.[0] || {};
};

export const extractRouteEndpoints = (routesData: any) => {
	const pickup = routesData?.pickupDetails || {};
	const delivery = routesData?.deliveryDetails || {};
	const routeDetails = routesData?.routeDetails || {};

	const pickupLat =
		pickup?.pickupLatitude ||
		pickup?.latitude ||
		pickup?.lat ||
		routeDetails?.pickupLatitude;

	const pickupLng =
		pickup?.pickupLongitude ||
		pickup?.longitude ||
		pickup?.lng ||
		routeDetails?.pickupLongitude;

	const deliveryLat =
		delivery?.deliveryLatitude ||
		delivery?.latitude ||
		delivery?.lat ||
		routeDetails?.deliveryLatitude;

	const deliveryLng =
		delivery?.deliveryLongitude ||
		delivery?.longitude ||
		delivery?.lng ||
		routeDetails?.deliveryLongitude;

	if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) return null;

	return {
		origin: {
			lat: Number(pickupLat),
			lng: Number(pickupLng),
			address:
				pickup?.pickupAddress ||
				pickup?.pickupLocation ||
				pickup?.address ||
				"Pickup",
			label:
				pickup?.pickupAddress ||
				pickup?.pickupLocation ||
				pickup?.address ||
				"Pickup",
		},
		destination: {
			lat: Number(deliveryLat),
			lng: Number(deliveryLng),
			address:
				delivery?.deliveryAddress ||
				delivery?.deliveryLocation ||
				delivery?.address ||
				"Delivery",
			label:
				delivery?.deliveryAddress ||
				delivery?.deliveryLocation ||
				delivery?.address ||
				"Delivery",
		},
		routeDetails,
	};
};

export const getRouteLatLngPoints = (
	route: any,
	origin: any,
	destination: any
): LatLngPoint[] => {
	const geometry = route?.geometry;

	if (Array.isArray(geometry?.coordinates)) {
		return geometry.coordinates
			.map((point: any) => {
				const lng = Number(point?.[0]);
				const lat = Number(point?.[1]);

				if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

				return [lat, lng] as LatLngPoint;
			})
			.filter(Boolean);
	}

	return [
		[Number(origin?.lat), Number(origin?.lng)],
		[Number(destination?.lat), Number(destination?.lng)],
	];
};

const buildEstimatedRoute = (base: any, index: number) => {
	const distance = numberFromDistance(base?.distanceKm);
	const minutes = minutesFromDurationText(base?.durationText);

	if (index === 1) {
		return {
			...base,
			id: "delayed-route",
			badge: "Delayed",
			label: "Route 2",
			distanceKm: distance ? `${(distance * 1.1).toFixed(1)} km` : base?.distanceKm,
			durationText: minutes ? formatMinutes(minutes * 1.12) : base?.durationText,
			via: "via scenic roads",
			isEstimated: true,
		};
	}

	return {
		...base,
		id: "alternate-route",
		badge: "Alternate",
		label: "Route 3",
		distanceKm: distance ? `${(distance * 1.18).toFixed(1)} km` : base?.distanceKm,
		durationText: minutes ? formatMinutes(minutes * 1.2) : base?.durationText,
		via: "via alternate route",
		isEstimated: true,
	};
};

export const mapOrsRoutesToCards = (routes: any[] = [], savedDistanceKm = "") => {
	const list = Array.isArray(routes) ? routes : [];

	const mapped = list.map((route: any, index: number) => {
		const summary = getRouteSummary(route);

		const distanceKm =
			formatDistanceKm(summary?.distance || route?.summary?.distance) ||
			(savedDistanceKm ? `${savedDistanceKm} km` : "--");

		const durationText = formatDuration(
			summary?.duration || route?.summary?.duration
		);

		const badge =
			index === 0 ? "Fastest" : index === 1 ? "Delayed" : "Alternate";

		const label =
			index === 0 ? "Recommended Route" : index === 1 ? "Route 2" : "Route 3";

		const via =
			index === 0
				? "Best time and distance balance"
				: index === 1
					? "via scenic roads"
					: "via alternate route";

		return {
			id: route?.id || `route-${index}`,
			badge,
			label,
			distanceKm,
			durationText,
			via,
			route,
			isEstimated: false,
		};
	});

	const base =
		mapped[0] || {
			id: "saved-route",
			badge: "Fastest",
			label: "Recommended Route",
			distanceKm: savedDistanceKm ? `${savedDistanceKm} km` : "--",
			durationText: "--",
			via: "Saved route distance",
			route: null,
			isEstimated: true,
		};

	return [
		{
			...base,
			badge: "Fastest",
			label: "Recommended Route",
			via: base?.via || "Best time and distance balance",
		},
		mapped[1] || buildEstimatedRoute(base, 1),
		mapped[2] || buildEstimatedRoute(base, 2),
	];
};

export const openGoogleMapsDirections = ({
	origin,
	destination,
}: {
	origin: any;
	destination: any;
	route?: any;
	routeIndex?: number;
	isEstimated?: boolean;
}) => {
	if (!origin || !destination) return;

	const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;

	window.open(url, "_blank", "noopener,noreferrer");
};