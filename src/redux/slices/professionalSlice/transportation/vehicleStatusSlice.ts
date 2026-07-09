import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type VehicleStatusParams = {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
};

export const FLEET_SUMMARY_ITEMS = [
    {
        key: "Available",
        label: "Available",
        color: "#22C55E",
        icon: "check-circle",
    },
    {
        key: "Allocated",
        label: "Allocated",
        color: "#2563EB",
        icon: "link-2",
    },
    {
        key: "On-Way To Load",
        label: "On-Way To Load",
        color: "#0EA5E9",
        icon: "map-pin",
    },
    {
        key: "Loading",
        label: "Loading",
        color: "#8B5CF6",
        icon: "package",
    },
    {
        key: "In-Transit",
        label: "In-Transit",
        color: "#F59E0B",
        icon: "navigation",
    },
    {
        key: "Unloading",
        label: "Unloading",
        color: "#D97706",
        icon: "download",
    },
    {
        key: "Under Maintenance",
        label: "Under Maintenance",
        color: "#EF4444",
        icon: "tool",
    },
];

/* ===================================================
   HELPERS
=================================================== */

const getRecordValue = (record: any, keys: string[]) => {
    for (const key of keys) {
        const value =
            record?.[key] ??
            record?.data?.[key] ??
            record?.dynamicFields?.[key];

        if (value === null || value === undefined) continue;

        if (typeof value === "object") {
            const nested = value?.name ?? value?.label ?? value?.value;

            if (
                nested !== null &&
                nested !== undefined &&
                String(nested).trim()
            ) {
                return String(nested).trim();
            }

            continue;
        }

        if (String(value).trim()) return String(value).trim();
    }

    return "";
};

const parseCapacityTon = (value: any) => {
    const text = String(value ?? "").replace(/,/g, "").trim();
    const match = text.match(/-?\d+(\.\d+)?/);

    return match ? Number(match[0]) : 0;
};

export const normalizeVehicleAvailabilityStatus = (value: any) => {
    const raw = String(value || "").trim();

    if (!raw) return "Available";

    const key = raw
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const statusMap: any = {
        available: "Available",
        active: "Available",

        allocated: "Allocated",

        "on way to load": "On-Way To Load",
        "on-way to load": "On-Way To Load",
        "onway to load": "On-Way To Load",

        loading: "Loading",

        "in transit": "In-Transit",
        intransit: "In-Transit",
        "in-transit": "In-Transit",

        unloading: "Unloading",

        breakdown: "Breakdown",

        "under maintenance": "Under Maintenance",
        maintenance: "Under Maintenance",

        "partially loaded": "Partially Loaded",
    };

    return statusMap[key] || raw;
};

export const mapCustomMasterRecordToVehicle = (
    record: any,
    requiredWeight = 0,
    order: any = {}
) => {
    const name = getRecordValue(record, ["name", "vehicleName", "title"]);

    const vehicleNumber =
        getRecordValue(record, [
            "vehicleNumber",
            "registrationNumber",
            "vehicle_number",
            "number",
            "code",
        ]) || name;

    const vehicleType =
        getRecordValue(record, [
            "vehicleType",
            "type",
            "Vehicle Type",
            "vehicle_type",
        ]) || name;

    const vehicleBodyType = getRecordValue(record, [
        "vehicleBodyType",
        "bodyType",
        "body_type",
    ]);

    const vehicleCapacityTon = parseCapacityTon(
        getRecordValue(record, [
            "vehicleCapacity",
            "vehicleCapacityTon",
            "capacity",
            "capacityTon",
            "Capitcity",
            "capitcity",
            "Capacity",
        ])
    );

    const availableCapacityTon =
        parseCapacityTon(
            getRecordValue(record, [
                "availableCapacity",
                "availableCapacityTon",
                "capacity",
                "capacityTon",
                "Capacity",
            ])
        ) || vehicleCapacityTon;

    const currentLocation = getRecordValue(record, [
        "currentLocation",
        "location",
        "city",
    ]);

    const availabilityStatus = normalizeVehicleAvailabilityStatus(
        getRecordValue(record, [
            "current_status",
            "currentStatus",
            "availabilityStatus",
            "availability_status",
            "vehicleStatus",
            "vehicle_status",
            "availability",
        ]) || record?.status
    );

    return {
        selectedVehicleId:
            record?.voucherNumber ||
            record?.data?.voucherNumber ||
            getRecordValue(record, ["code"]) ||
            vehicleNumber,

        voucherNumber: record?.voucherNumber || record?.data?.voucherNumber || "",
        vehicleNumber,
        vehicleType,
        vehicleBodyType,
        vehicleCapacityTon,
        availableCapacityTon,
        currentLocation,
        availabilityStatus,
        availabilityLabel: availabilityStatus,
        loadType: getRecordValue(record, ["loadType"]) || order?.loadType || "FTL",
        supportsRequiredWeight:
            Number(availableCapacityTon || 0) >= Number(requiredWeight || 0),
        rawRecord: record,
    };
};

/* ===================================================
   RESOLVE VEHICLE MASTER MODULE CODE
=================================================== */

export const resolveVehicleMasterModuleCode = createAsyncThunk(
    "vehicleStatus/resolveVehicleMasterModuleCode",
    async (_, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/customMaster/module/getAll",
                {
                    params: {
                        offset: 0,
                        limit: 500,
                        status: "active",
                    },
                }
            );

            const modules =
                response?.data?.items ||
                response?.data?.data?.items ||
                response?.data?.data ||
                [];

            const vehicleModule = (Array.isArray(modules) ? modules : []).find(
                (item: any) =>
                    String(item?.moduleName || "").trim().toLowerCase() ===
                    "vehicle master"
            );

            return {
                moduleCode: vehicleModule?.moduleCode || "",
            };
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to resolve vehicle master module",
            });
        }
    }
);

/* ===================================================
   GET ALL VEHICLE STATUS
=================================================== */

export const getAllVehicleStatus = createAsyncThunk(
    "vehicleStatus/getAllVehicleStatus",
    async (
        {
            limit = 500,
            offset = 0,
            search = "",
            status = "active",
        }: VehicleStatusParams = {},
        { rejectWithValue }
    ) => {
        try {
            const moduleResponse = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/customMaster/module/getAll",
                {
                    params: {
                        offset: 0,
                        limit: 500,
                        status: "active",
                    },
                }
            );

            const modules =
                moduleResponse?.data?.items ||
                moduleResponse?.data?.data?.items ||
                moduleResponse?.data?.data ||
                [];

            const vehicleModule = (Array.isArray(modules) ? modules : []).find(
                (item: any) =>
                    String(item?.moduleName || "").trim().toLowerCase() ===
                    "vehicle master"
            );

            const moduleCode = vehicleModule?.moduleCode || "";

            if (!moduleCode) {
                return {
                    success: false,
                    message: "Vehicle Master module not found",
                    data: {
                        moduleCode: "",
                        records: [],
                        pagination: {},
                    },
                };
            }

            const dataResponse = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/customMaster/data/getAll",
                {
                    params: {
                        moduleCode,
                        offset,
                        limit,
                        search,
                        status,
                    },
                }
            );

            const items =
                dataResponse?.data?.items ||
                dataResponse?.data?.data?.items ||
                dataResponse?.data?.data?.records ||
                dataResponse?.data?.data ||
                [];

            const pagination =
                dataResponse?.data?.pagination ||
                dataResponse?.data?.data?.pagination ||
                {};

            const vehicles = Array.isArray(items)
                ? items.map((item: any) => mapCustomMasterRecordToVehicle(item, 0, {}))
                : [];

            return {
                success: true,
                data: {
                    moduleCode,
                    records: vehicles,
                    pagination,
                },
            };
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load vehicle master",
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const initialState: any = {
    vehicles: [],
    pagination: {},
    moduleCode: "",

    listingLoader: false,
    detailLoader: false,
    updateLoader: false,

    error: null,
};

const vehicleStatusSlice = createSlice({
    name: "vehicleStatus",
    initialState,
    reducers: {
        clearVehicleStatusError: (state) => {
            state.error = null;
        },

        clearVehicleStatusState: (state) => {
            state.vehicles = [];
            state.pagination = {};
            state.moduleCode = "";

            state.listingLoader = false;
            state.detailLoader = false;
            state.updateLoader = false;

            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            // RESOLVE MODULE CODE
            .addCase(resolveVehicleMasterModuleCode.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
            })
            .addCase(resolveVehicleMasterModuleCode.fulfilled, (state, action) => {
                state.detailLoader = false;
                state.moduleCode = action.payload?.moduleCode || "";
                state.error = null;
            })
            .addCase(resolveVehicleMasterModuleCode.rejected, (state, action) => {
                state.detailLoader = false;
                state.moduleCode = "";
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to resolve vehicle master module";
            })

            // GET ALL VEHICLE STATUS
            .addCase(getAllVehicleStatus.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getAllVehicleStatus.fulfilled, (state, action) => {
                state.listingLoader = false;

                state.vehicles = action.payload?.data?.records || [];
                state.pagination = action.payload?.data?.pagination || {};
                state.moduleCode = action.payload?.data?.moduleCode || "";

                if (action.payload?.success === false) {
                    state.error =
                        action.payload?.message || "Vehicle Master module not found";
                } else {
                    state.error = null;
                }
            })
            .addCase(getAllVehicleStatus.rejected, (state, action) => {
                state.listingLoader = false;
                state.vehicles = [];
                state.pagination = {};
                state.error =
                    (action.payload as { message?: string })?.message ||
                    "Failed to load vehicle master";
            });
    },
});

export const { clearVehicleStatusError, clearVehicleStatusState } =
    vehicleStatusSlice.actions;

export default vehicleStatusSlice.reducer;