
// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import professionalAxios from "../../../../services/professionalAxios";

// type TripAllocationState={
//     limit?:number;
//     offset?:number;
//     search?:string;
//     tripStatus?:string;
//     priority?:string;
// }

// /* ===================================================
//     CREATE Trip Allocation Slice
// =================================================== */


// export const createTripAllocation=createAsyncThunk(
//     "tripAllocation/createTripAllocation",
//     async (payload: any, { rejectWithValue }) => {
//         try {
//             const response = await professionalAxios.post(
//                 "/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/save",
//                 { payload }
//             );

//             if (!response?.data?.success) {
//                 return rejectWithValue({
//                     message:
//                         response?.data?.message || "Failed to create trip allocation",
//                 });
//             }

//             return response?.data || null;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message ||
//                     error?.message ||
//                     "Failed to create trip allocation",
//             });
//         }
//     }
// );


// /* ===================================================
//     GET ALL TRIP ALLOCATIONS
// =================================================== */


// export const getAllTripAllocation=createAsyncThunk(
//     "tripAllocation/getAllTripAllocation",
//     async(
//         {
//         limit=10,
//         offset=0,
//         search="",
//         tripStatus="",
//         priority="",
//     }: TripAllocationState = {},
//     {rejectWithValue}
// )=>{
//         try {
//             const response=await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/getAll",{
//                 params:{
//                     limit,
//                     offset,
//                     search,
//                     tripStatus,
//                     priority
//                 }
//             })

//             return response?.data || null;
//         } catch (error:any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message ||
//                     error?.message ||
//                     "Failed to get all trip allocations",
//             });
//         }
//     }
// )


// /* ===================================================
//     GET trip allocation  BY VOUCHER NUMBER
// =================================================== */

// export const getTripAllocationByVoucherNumber=createAsyncThunk(
//     "tripAllocation/getTripAllocationByVoucherNumber",
//     async(voucherNumber:string,{rejectWithValue})=>{
//         try {
//             const response=await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/getByVoucherNumber/${voucherNumber}`);
//             return response?.data || null;
//         } catch (error:any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message ||
//                     error?.message ||
//                     "Failed to get trip allocation ",
//             });
//         }
//     }
// )


// /* ===================================================
//     DELETE TRIP ALLOCATION BY VOUCHER NUMBER
// =================================================== */

// export const deleteTripAllocationByVoucherNumber=createAsyncThunk(
//     "tripAllocation/deleteTripAllocationByVoucherNumber",
//     async(voucherNumber:string,{rejectWithValue})=>{
//         try {
//             const response=await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/delete/${voucherNumber}`);
//             return response?.data || null;
//         } catch (error:any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message ||
//                     error?.message ||
//                     "Failed to delete trip allocation ",
//             });
//         }
//     }
// )


// /* ===================================================
//     UPDATE TRIP ALLOCATION BY VOUCHER NUMBER
// =================================================== */

// export const updateTripAllocationByVoucherNumber=createAsyncThunk(
//     "tripAllocation/updateTripAllocationByVoucherNumber",
//     async({voucherNumber, updateData}:{voucherNumber:string, updateData:any},{rejectWithValue})=>{
//         try {
//             const response=await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/update/${voucherNumber}`, updateData);
//             return response?.data || null;
//         } catch (error:any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message ||
//                     error?.message ||
//                     "Failed to update trip allocation ",
//             });
//         }
//     }
// )


// /* ===================================================
//     SLICE
// =================================================== */

// const initialState:any={
//     tripAllocations:[],
//     createLoader:false,
//     updateLoader:false,
//     deleteLoader:false,
//     listingLoader:false,
//     detailLoader:false,
//     error:null
// }


// const tripAllocationSlice=createSlice({
//     name:"tripAllocation",
//     initialState,
//     reducers:{
//         clearTripAllocationError:(state)=>{
//             state.error=null;
//         },
//         clearTripAllocationState:(state)=>{
//             state.tripAllocations=[];
//             state.createLoader=false;
//             state.updateLoader=false;
//             state.deleteLoader=false;
//             state.listingLoader=false;
//             state.error=null;
//         }

//     },

//     extraReducers:(builder)=>{
//         builder

//         // CREATE TRIP ALLOCATION
//         .addCase(createTripAllocation.pending,(state)=>{
//             state.createLoader=true;
//             state.error=null;
//         })
//         .addCase(createTripAllocation.fulfilled,(state,action)=>{
//             state.createLoader=false;
//             const createtrip=action.payload?.data;
//             if(createtrip){
//                 state.tripAllocations.push(createtrip);
//             }
//             state.error=null;
//         })
//         .addCase(createTripAllocation.rejected,(state,action)=>{
//             state.createLoader=false;
//             state.error=
//                 (action.payload as { message?: string })?.message ||
//                 "Failed to create trip allocation";
//         })

//         // GET ALL TRIP ALLOCATIONS
//         .addCase(getAllTripAllocation.pending,(state)=>{
//             state.listingLoader=true;
//             state.error=null;
//         })
//         .addCase(getAllTripAllocation.fulfilled,(state,action)=>{
//             state.listingLoader=false;
//             state.tripAllocations=action.payload?.data?.records || [];
//             state.error=null;
//         })
//         .addCase(getAllTripAllocation.rejected,(state,action)=>{
//             state.listingLoader=false;
//             state.error=
//                 (action.payload as { message?: string })?.message ||
//                 "Failed to get trip allocations";
//         })


//         // GET TRIP ALLOCATION BY VOUCHER NUMBER
//         .addCase(getTripAllocationByVoucherNumber.pending,(state)=>{
//             state.detailLoader=true;
//             state.error=null;
//         })
//         .addCase(getTripAllocationByVoucherNumber.fulfilled,(state,action)=>{
//             state.detailLoader=false;
//             state.tripAllocations=action.payload?.data || null;
//             state.error=null;
//         })
//         .addCase(getTripAllocationByVoucherNumber.rejected,(state,action)=>{
//             state.detailLoader=false;
//             state.error=
//                 (action.payload as { message?: string })?.message ||
//                 "Failed to get trip allocation ";
//         })

//         // DELETE TRIP ALLOCATION BY VOUCHER NUMBER
//         .addCase(deleteTripAllocationByVoucherNumber.pending,(state)=>{
//             state.deleteLoader=true;
//             state.error=null;
//         })
//         .addCase(deleteTripAllocationByVoucherNumber.fulfilled,(state,action)=>{
//             state.deleteLoader=false;
//             const deletedTrip=action.payload?.data;
//             if(deletedTrip){
//                 state.tripAllocations=state.tripAllocations.filter((t:any) => t.voucherNumber !== deletedTrip.voucherNumber);
//             }
//             state.error=null;
//         })
//         .addCase(deleteTripAllocationByVoucherNumber.rejected,(state,action)=>{
//             state.deleteLoader=false;
//             state.error=
//                 (action.payload as { message?: string })?.message ||
//                 "Failed to delete trip allocation ";
//         })


//         // UPDATE TRIP ALLOCATION BY VOUCHER NUMBER

//         .addCase(updateTripAllocationByVoucherNumber.pending,(state)=>{
//             state.updateLoader=true;
//             state.error=null;
//         })
//         .addCase(updateTripAllocationByVoucherNumber.fulfilled,(state,action)=>{
//             state.updateLoader=false;
//             const updatedTrip=action.payload?.data;
//             if(updatedTrip){
//                 state.tripAllocations=state.tripAllocations.map((t:any) => t.voucherNumber === updatedTrip.voucherNumber ? updatedTrip : t);
//             }
//             state.error=null;
//         })
//         .addCase(updateTripAllocationByVoucherNumber.rejected,(state,action)=>{
//             state.updateLoader=false;
//             state.error=
//                 (action.payload as { message?: string })?.message ||
//                 "Failed to update trip allocation ";
//         })

//     }
// })

// export const {clearTripAllocationError , clearTripAllocationState}=tripAllocationSlice.actions;
// export default tripAllocationSlice.reducer;






import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type TripAllocationState = {
	limit?: number;
	offset?: number;
	search?: string;
	tripStatus?: string;
	priority?: string;
};

/* ===================================================
   CREATE TRIP ALLOCATION
=================================================== */

export const createTripAllocation = createAsyncThunk(
	"tripAllocation/createTripAllocation",
	async (payload: any, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.post(
				"/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/save",
				payload 
			);

			if (!response?.data?.success) {
				return rejectWithValue({
					message:
						response?.data?.message || "Failed to create trip allocation",
				});
			}

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to create trip allocation",
			});
		}
	}
);

/* ===================================================
   GET ALL TRIP ALLOCATIONS
=================================================== */

export const getAllTripAllocation = createAsyncThunk(
	"tripAllocation/getAllTripAllocation",
	async (
		{
			limit = 10,
			offset = 0,
			search = "",
			tripStatus = "",
			priority = "",
		}: TripAllocationState = {},
		{ rejectWithValue }
	) => {
		try {
			const response = await professionalAxios.get(
				"/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/getAll",
				{
					params: {
						limit,
						offset,
						search,
						tripStatus,
						priority,
					},
				}
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to get all trip allocations",
			});
		}
	}
);

/* ===================================================
   GET ACTIVE TRIP ALLOCATIONS
=================================================== */

export const getActiveTripAllocations = createAsyncThunk(
	"tripAllocation/getActiveTripAllocations",
	async (_, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get(
				"/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/getAll",
				{
					params: {
						limit: 200,
						offset: 0,
					},
				}
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to get active trip allocations",
			});
		}
	}
);

/* ===================================================
   GET TRIP ALLOCATION BY VOUCHER NUMBER
=================================================== */

export const getTripAllocationByVoucherNumber = createAsyncThunk(
	"tripAllocation/getTripAllocationByVoucherNumber",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get(
				`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/getByVoucherNumber/${voucherNumber}`
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to get trip allocation",
			});
		}
	}
);

/* ===================================================
   DELETE TRIP ALLOCATION BY VOUCHER NUMBER
=================================================== */

export const deleteTripAllocationByVoucherNumber = createAsyncThunk(
	"tripAllocation/deleteTripAllocationByVoucherNumber",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.delete(
				`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/delete/${voucherNumber}`
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to delete trip allocation",
			});
		}
	}
);

/* ===================================================
   UPDATE TRIP ALLOCATION BY VOUCHER NUMBER
=================================================== */

export const updateTripAllocationByVoucherNumber = createAsyncThunk(
	"tripAllocation/updateTripAllocationByVoucherNumber",
	async (
		{
			voucherNumber,
			updateData,
		}: {
			voucherNumber: string;
			updateData: any;
		},
		{ rejectWithValue }
	) => {
		try {
			const response = await professionalAxios.put(
				`/eTaxSolnMongoApiBackend/users/bookEZ/tripAllocation/update/${voucherNumber}`,
				updateData
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to update trip allocation",
			});
		}
	}
);

/* ===================================================
   VEHICLE MASTER HELPERS
=================================================== */

const getRecordValue = (record: any, keys: string[]) => {
	for (const key of keys) {
		const value = record?.[key] ?? record?.data?.[key];

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

const normalizeVehicleStatus = (value: any) => {
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
		"in transit": "In-Transit",
		"intransit": "In-Transit",
		loading: "Loading",
		unloading: "Unloading",
		inactive: "Inactive",
		breakdown: "Breakdown",
		"under maintenance": "Under Maintenance",
	};

	return statusMap[key] || raw;
};

const mapVehicleMasterRecord = (
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

	const availabilityStatus = normalizeVehicleStatus(
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
			getRecordValue(record, ["code"]) ||
			vehicleNumber,
		vehicleNumber,
		vehicleType,
		vehicleBodyType,
		vehicleCapacityTon,
		availableCapacityTon,
		currentLocation,
		availabilityStatus,
		loadType: getRecordValue(record, ["loadType"]) || order?.loadType || "FTL",
		availabilityLabel: availabilityStatus,
		supportsRequiredWeight:
			Number(availableCapacityTon || 0) >= Number(requiredWeight || 0),
		voucherNumber: record?.voucherNumber || "",
		rawRecord: record,
	};
};

/* ===================================================
   GET VEHICLE MASTER VEHICLES
=================================================== */

export const getVehicleMasterVehicles = createAsyncThunk(
	"tripAllocation/getVehicleMasterVehicles",
	async (
		{
			requiredWeight = 0,
			transportOrder = {},
		}: {
			requiredWeight?: any;
			transportOrder?: any;
		},
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

			const vehicleModule = modules.find((item: any) => {
				return (
					String(item?.moduleName || "").trim().toLowerCase() ===
					"vehicle master"
				);
			});

			const moduleCode = vehicleModule?.moduleCode;

			if (!moduleCode) {
				return {
					vehicles: [],
					moduleCode: "",
				};
			}

			const dataResponse = await professionalAxios.get(
				"/eTaxSolnMongoApiBackend/users/customMaster/data/getAll",
				{
					params: {
						moduleCode,
						offset: 0,
						limit: 500,
						status: "active",
					},
				}
			);

			const records =
				dataResponse?.data?.items ||
				dataResponse?.data?.data?.items ||
				dataResponse?.data?.data ||
				[];

			const vehicles = Array.isArray(records)
				? records.map((item: any) =>
						mapVehicleMasterRecord(item, requiredWeight, transportOrder)
				  )
				: [];

			return {
				vehicles,
				moduleCode,
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
   DRIVER HELPERS
=================================================== */

const flattenChildUsers = (result: any) => {
	const arr = Array.isArray(result) ? result : result ? [result] : [];
	const output: any[] = [];

	for (const user of arr) {
		const parentHash = user?.ParentUser?.userMobileNumberHash;
		const children = Array.isArray(user?.ChildUsers) ? user.ChildUsers : [];

		for (const child of children) {
			if (
				child?.userMobileNumberHash &&
				child.userMobileNumberHash !== parentHash
			) {
				output.push(child);
			}
		}
	}

	return output;
};

const getChildValue = (child: any, keys: string[]) => {
	const sources = [
		child,
		child?.dynamicFields,
		child?.childUserCustomFields,
	].filter(Boolean);

	for (const key of keys) {
		for (const source of sources) {
			const value = source?.[key];

			if (
				value !== null &&
				value !== undefined &&
				String(value).trim() !== ""
			) {
				return value;
			}
		}
	}

	return "";
};

const mapChildUserToDriver = (child: any) => {
	const driverName = [
		child?.userFirstName,
		child?.userMiddleName,
		child?.userLastName || child?.userSurname,
	]
		.filter(Boolean)
		.join(" ")
		.trim();

	return {
		driverId: String(child?.userMobileNumberHash || ""),
		driverName: driverName || String(child?.userEmail || "").trim(),
		mobileNumber: String(child?.userMobileNumberHash || ""),
		licenseNumber: String(
			getChildValue(child, [
				"licenseNumber",
				"LicenseNumber",
				"drivingLicenseNumber",
			]) || ""
		).trim(),
		licenseExpiryDate: getChildValue(child, [
			"licenseExpiry",
			"licenseExpiryDate",
			"LicenseExpiry",
			"drivingLicenseExpiryDate",
		]),
		rawChild: child,
	};
};

/* ===================================================
   GET AVAILABLE DRIVERS
=================================================== */

export const getAvailableDrivers = createAsyncThunk(
	"tripAllocation/getAvailableDrivers",
	async (
		{
			parentUserMobileNumber,
		}: {
			parentUserMobileNumber: string;
		},
		{ rejectWithValue }
	) => {
		try {
			const response = await professionalAxios.get(
				"/eTaxSolnMongoApiBackend/users",
				{
					params: {
						userMobileNumberHash: parentUserMobileNumber,
						offset: 0,
						limit: 200,
					},
				}
			);

			const childUsers = flattenChildUsers(response?.data?.result);

			const drivers = childUsers
				.map(mapChildUserToDriver)
				.filter((driver: any) => driver.driverId);

			return {
				drivers,
			};
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to load drivers",
			});
		}
	}
);

/* ===================================================
   GET CHILD USER BY MOBILE
=================================================== */

export const getChildUserByMobile = createAsyncThunk(
	"tripAllocation/getChildUserByMobile",
	async (mobileNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get(
				`/eTaxSolnMongoApiBackend/users/${mobileNumber}`
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to load driver details",
			});
		}
	}
);

/* ===================================================
   SLICE
=================================================== */

const initialState: any = {
	tripAllocations: [],
	pagination: {},

	drivers: [],
	vehicles: [],
	activeAllocations: [],

	createLoader: false,
	updateLoader: false,
	deleteLoader: false,
	listingLoader: false,
	detailLoader: false,
	driversLoader: false,
	vehiclesLoader: false,
	activeAllocationsLoader: false,

	error: null,
};

const tripAllocationSlice = createSlice({
	name: "tripAllocation",
	initialState,
	reducers: {
		clearTripAllocationError: (state) => {
			state.error = null;
		},

		clearTripAllocationState: (state) => {
			state.tripAllocations = [];
			state.pagination = {};
			state.drivers = [];
			state.vehicles = [];
			state.activeAllocations = [];

			state.createLoader = false;
			state.updateLoader = false;
			state.deleteLoader = false;
			state.listingLoader = false;
			state.detailLoader = false;
			state.driversLoader = false;
			state.vehiclesLoader = false;
			state.activeAllocationsLoader = false;

			state.error = null;
		},
	},

	extraReducers: (builder) => {
		builder
			// CREATE
			.addCase(createTripAllocation.pending, (state) => {
				state.createLoader = true;
				state.error = null;
			})
			.addCase(createTripAllocation.fulfilled, (state, action) => {
				state.createLoader = false;

				const createdTrip = action.payload?.data;

				if (createdTrip && Array.isArray(state.tripAllocations)) {
					state.tripAllocations.push(createdTrip);
				}

				state.error = null;
			})
			.addCase(createTripAllocation.rejected, (state, action) => {
				state.createLoader = false;
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to create trip allocation";
			})

			// LIST
			.addCase(getAllTripAllocation.pending, (state) => {
				state.listingLoader = true;
				state.error = null;
			})
			.addCase(getAllTripAllocation.fulfilled, (state, action) => {
				state.listingLoader = false;
				state.tripAllocations = action.payload?.data?.records || [];
				state.pagination = action.payload?.data?.pagination || {};
				state.error = null;
			})
			.addCase(getAllTripAllocation.rejected, (state, action) => {
				state.listingLoader = false;
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to get trip allocations";
			})

			// ACTIVE ALLOCATIONS
			.addCase(getActiveTripAllocations.pending, (state) => {
				state.activeAllocationsLoader = true;
				state.error = null;
			})
			.addCase(getActiveTripAllocations.fulfilled, (state, action) => {
				state.activeAllocationsLoader = false;
				state.activeAllocations = action.payload?.data?.records || [];
				state.error = null;
			})
			.addCase(getActiveTripAllocations.rejected, (state, action) => {
				state.activeAllocationsLoader = false;
				state.activeAllocations = [];
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to get active trip allocations";
			})

			// DETAIL
			.addCase(getTripAllocationByVoucherNumber.pending, (state) => {
				state.detailLoader = true;
				state.error = null;
			})
			.addCase(getTripAllocationByVoucherNumber.fulfilled, (state) => {
				state.detailLoader = false;
				state.error = null;
			})
			.addCase(getTripAllocationByVoucherNumber.rejected, (state, action) => {
				state.detailLoader = false;
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to get trip allocation";
			})

			// DELETE
			.addCase(deleteTripAllocationByVoucherNumber.pending, (state) => {
				state.deleteLoader = true;
				state.error = null;
			})
			.addCase(deleteTripAllocationByVoucherNumber.fulfilled, (state, action) => {
				state.deleteLoader = false;

				const deletedTrip = action.payload?.data;

				if (deletedTrip && Array.isArray(state.tripAllocations)) {
					state.tripAllocations = state.tripAllocations.filter(
						(item: any) =>
							item?.tripNumber !== deletedTrip?.tripNumber &&
							item?.voucherNumber !== deletedTrip?.voucherNumber
					);
				}

				state.error = null;
			})
			.addCase(deleteTripAllocationByVoucherNumber.rejected, (state, action) => {
				state.deleteLoader = false;
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to delete trip allocation";
			})

			// UPDATE
			.addCase(updateTripAllocationByVoucherNumber.pending, (state) => {
				state.updateLoader = true;
				state.error = null;
			})
			.addCase(updateTripAllocationByVoucherNumber.fulfilled, (state, action) => {
				state.updateLoader = false;

				const updatedTrip = action.payload?.data;

				if (updatedTrip && Array.isArray(state.tripAllocations)) {
					state.tripAllocations = state.tripAllocations.map((item: any) =>
						item?.tripNumber === updatedTrip?.tripNumber ||
						item?.voucherNumber === updatedTrip?.voucherNumber
							? updatedTrip
							: item
					);
				}

				state.error = null;
			})
			.addCase(updateTripAllocationByVoucherNumber.rejected, (state, action) => {
				state.updateLoader = false;
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to update trip allocation";
			})

			// VEHICLES
			.addCase(getVehicleMasterVehicles.pending, (state) => {
				state.vehiclesLoader = true;
				state.error = null;
			})
			.addCase(getVehicleMasterVehicles.fulfilled, (state, action) => {
				state.vehiclesLoader = false;
				state.vehicles = action.payload?.vehicles || [];
				state.error = null;
			})
			.addCase(getVehicleMasterVehicles.rejected, (state, action) => {
				state.vehiclesLoader = false;
				state.vehicles = [];
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to load vehicles";
			})

			// DRIVERS
			.addCase(getAvailableDrivers.pending, (state) => {
				state.driversLoader = true;
				state.error = null;
			})
			.addCase(getAvailableDrivers.fulfilled, (state, action) => {
				state.driversLoader = false;
				state.drivers = action.payload?.drivers || [];
				state.error = null;
			})
			.addCase(getAvailableDrivers.rejected, (state, action) => {
				state.driversLoader = false;
				state.drivers = [];
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to load drivers";
			});
	},
});

export const {
	clearTripAllocationError,
	clearTripAllocationState,
} = tripAllocationSlice.actions;

export default tripAllocationSlice.reducer;