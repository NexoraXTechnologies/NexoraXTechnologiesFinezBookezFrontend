const ORS_KEY =
	"eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjI2ODhkYTUyZjE4NDQ4ZjJhZjYwNTViZWZlODZlNzM3IiwiaCI6Im11cm11cjY0In0=";

const ROUTE_URL =
	"https://api.openrouteservice.org/v2/directions/driving-car/json";

type RoutePoint = {
	lat: number | string;
	lng: number | string;
};

type GetBestRoutesParams = {
	origin: RoutePoint;
	destination: RoutePoint;
};

const fetchRoutes = async (body: any) => {
	const res = await fetch(ROUTE_URL, {
		method: "POST",
		headers: {
			Authorization: ORS_KEY,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const data = await res.json();

	console.log("[RouteAPI] status:", res.status);
	console.log("[RouteAPI] response:", data);

	if (!res.ok) {
		throw new Error(data?.error?.message || "Failed to fetch route");
	}

	return data?.routes || [];
};

export const getBestRoutes = async ({
	origin,
	destination,
}: GetBestRoutesParams) => {
	const coordinates = [
		[Number(origin.lng), Number(origin.lat)],
		[Number(destination.lng), Number(destination.lat)],
	];

	console.log("[RouteAPI] coordinates:", coordinates);

	const invalidCoordinates = coordinates.some(([lng, lat]) => {
		return (
			Number.isNaN(lng) ||
			Number.isNaN(lat) ||
			!Number.isFinite(lng) ||
			!Number.isFinite(lat)
		);
	});

	if (invalidCoordinates) {
		throw new Error("Invalid route coordinates");
	}

	try {
		return await fetchRoutes({
			coordinates,
			alternative_routes: {
				target_count: 3,
				weight_factor: 1.6,
				share_factor: 0.6,
			},
			instructions: true,
			language: "en",
		});
	} catch (error: any) {
		console.log(
			"[RouteAPI] alternative route failed, trying normal route:",
			error?.message || error
		);

		return await fetchRoutes({
			coordinates,
			instructions: true,
			language: "en",
		});
	}
};