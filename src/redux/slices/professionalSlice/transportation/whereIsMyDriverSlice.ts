import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type TripTrackingParams = {
    limit?: number;
    offset?: number;
};

/* ===================================================
   HELPERS
=================================================== */

export const getTripTrackingVoucher = (item: any) => {
    return String(
        item?.trackingId ||
        item?.tripTrackingVoucherNumber ||
        item?.voucherNumber ||
        item?.trackingVoucher ||
        item?.tripTrackingNumber ||
        item?.data?.trackingVoucherNumber ||
        item?.data?.voucherNumber ||
        ""
    ).trim();
};

export const unwrapTripTrackingList = (res: any) => {
    return (
        res?.data?.records ||
        res?.data?.items ||
        res?.data?.data?.records ||
        res?.data?.data?.items ||
        res?.data?.data ||
        res?.records ||
        res?.items ||
        []
    );
};

export const getDriverUniqueKey = (item: any) => {
    return String(
        item?.driver?.driverMobile ||
        item?.driver?.mobileNumber ||
        item?.driverMobile ||
        item?.mobileNumber ||
        item?.assignedDriverMobile ||
        item?.driver?.driverName ||
        item?.driverName ||
        getTripTrackingVoucher(item) ||
        ""
    ).trim();
};

const getUpdatedTime = (item: any) => {
    const time = new Date(
        item?.lastUpdatedAt ||
        item?.updatedAt ||
        item?.currentLocation?.updatedAt ||
        item?.currentLocation?.timestamp ||
        0
    ).getTime();

    return Number.isFinite(time) ? time : 0;
};

const getLatestRecordPerDriver = (records: any[]) => {
    const map = new Map();

    records.forEach((item: any) => {
        const key = getDriverUniqueKey(item);

        if (!key) return;

        const existing = map.get(key);

        if (!existing) {
            map.set(key, item);
            return;
        }

        const existingTime = getUpdatedTime(existing);
        const itemTime = getUpdatedTime(item);

        if (itemTime >= existingTime) {
            map.set(key, item);
        }
    });

    return Array.from(map.values());
};

const getLocationLatLng = (location: any) => {
    const lat = Number(location?.lat ?? location?.latitude);
    const lng = Number(location?.lng ?? location?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    return { lat, lng };
};

const getLocationCacheKey = (location: any) => {
    const coords = getLocationLatLng(location);

    if (!coords) return "";

    return `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
};

const addressCache = new Map();

const reverseGeocodeLocation = async (location: any) => {
    const coords = getLocationLatLng(location);

    if (!coords) {
        return "Location not available";
    }

    const cacheKey = getLocationCacheKey(location);

    if (addressCache.has(cacheKey)) {
        return addressCache.get(cacheKey);
    }

    try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            const fallback = "Address unavailable. Tap to view on map.";
            addressCache.set(cacheKey, fallback);
            return fallback;
        }

        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${apiKey}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data?.status === "OK" && data?.results?.[0]?.formatted_address) {
            const address = data.results[0].formatted_address;
            addressCache.set(cacheKey, address);
            return address;
        }

        const fallbackAddress = "Address unavailable. Tap to view on map.";
        addressCache.set(cacheKey, fallbackAddress);
        return fallbackAddress;
    } catch {
        return "Address unavailable. Tap to view on map.";
    }
};

/* ===================================================
   GET DRIVER LOCATIONS
=================================================== */

export const getWhereIsMyDriverList = createAsyncThunk(
    "whereIsMyDriver/getWhereIsMyDriverList",
    async (
        { limit = 100, offset = 0 }: TripTrackingParams = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookEZ/tripTracking/getAll",
                {
                    params: {
                        limit,
                        offset,
                    },
                }
            );
            console.log({ response })
            const list = unwrapTripTrackingList(response?.data);

            const activeList = (Array.isArray(list) ? list : []).filter((item: any) => {
                const status = String(item?.tripStatus || "").toLowerCase();

                return (
                    status !== "delivered" &&
                    status !== "completed" &&
                    Number.isFinite(Number(item?.currentLocation?.lat)) &&
                    Number.isFinite(Number(item?.currentLocation?.lng))
                );
            });

            const uniqueDrivers = getLatestRecordPerDriver(activeList);

            const driversWithAddress = await Promise.all(
                uniqueDrivers.map(async (item: any) => {
                    const existingAddress = item?.currentLocation?.address || item?.currentLocation?.formattedAddress || item?.address || "";
                    const currentAddress = existingAddress || (await reverseGeocodeLocation(item?.currentLocation));
                    return {
                        ...item,
                        currentAddress,
                    };
                })
            );

            return {
                drivers: driversWithAddress,
                totalActiveRecords: activeList.length,
            };
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load driver locations",
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const initialState: any = {
    drivers: [],
    totalActiveRecords: 0,

    listingLoader: false,
    refreshLoader: false,

    error: null,
};

const whereIsMyDriverSlice = createSlice({
    name: "whereIsMyDriver",
    initialState,
    reducers: {
        clearWhereIsMyDriverError: (state) => {
            state.error = null;
        },

        clearWhereIsMyDriverState: (state) => {
            state.drivers = [];
            state.totalActiveRecords = 0;
            state.listingLoader = false;
            state.refreshLoader = false;
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(getWhereIsMyDriverList.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getWhereIsMyDriverList.fulfilled, (state, action) => {
                state.listingLoader = false;
                state.drivers = action.payload?.drivers || [];
                state.totalActiveRecords = action.payload?.totalActiveRecords || 0;
                state.error = null;
            })
            .addCase(getWhereIsMyDriverList.rejected, (state, action) => {
                state.listingLoader = false;
                state.drivers = [];
                state.totalActiveRecords = 0;
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to load driver locations";
            });
    },
});

export const {
    clearWhereIsMyDriverError,
    clearWhereIsMyDriverState,
} = whereIsMyDriverSlice.actions;

export default whereIsMyDriverSlice.reducer;