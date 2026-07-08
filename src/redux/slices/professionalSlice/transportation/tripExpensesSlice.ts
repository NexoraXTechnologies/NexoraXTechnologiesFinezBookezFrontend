// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import professionalAxios from "../../../../services/professionalAxios";

// type TripExpenseState = {
// 	limit?: number;
// 	offset?: number;
// 	search?: string;
// 	tripStatus?: string;
// };

// /* ===================================================
//    HELPERS
// =================================================== */

// const getArrayFromPayload = (payload: any) => {
// 	const data = payload?.data || payload || {};

// 	const records =
// 		data?.records ||
// 		data?.tripExpenses ||
// 		data?.data?.records ||
// 		data?.data?.tripExpenses ||
// 		data?.data ||
// 		payload?.records ||
// 		payload?.tripExpenses ||
// 		[];

// 	return Array.isArray(records) ? records : [];
// };

// const getPaginationFromPayload = (payload: any, records: any[] = []) => {
// 	const data = payload?.data || payload || {};

// 	return (
// 		data?.pagination ||
// 		data?.data?.pagination || {
// 			totalDocs: records.length,
// 			totalRecords: records.length,
// 			hasPrevPage: false,
// 			hasNextPage: false,
// 		}
// 	);
// };

// const getSingleExpenseFromPayload = (payload: any) => {
// 	const data = payload?.data || payload || {};

// 	if (Array.isArray(data)) return data[0] || null;
// 	if (Array.isArray(data?.records)) return data.records[0] || null;
// 	if (Array.isArray(data?.tripExpenses)) return data.tripExpenses[0] || null;

// 	return data || null;
// };

// const getExpenseVoucher = (item: any) =>
// 	item?.voucherNumber ||
// 	item?.tripExpenseVoucherNumber ||
// 	item?.tripExpenseNumber ||
// 	item?.tripVoucherNumber ||
// 	item?.tripId ||
// 	"";

// /* ===================================================
//    CREATE TRIP EXPENSE
// =================================================== */

// export const createTripExpense = createAsyncThunk(
// 	"tripExpenses/createTripExpense",
// 	async (payload: any, { rejectWithValue }) => {
// 		try {
// 			const response = await professionalAxios.post(
// 				"/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/save",
// 				payload
// 			);

// 			if (!response?.data?.success) {
// 				return rejectWithValue({
// 					message:
// 						response?.data?.message || "Failed to create Trip Expenses",
// 				});
// 			}

// 			return response?.data || null;
// 		} catch (error: any) {
// 			return rejectWithValue({
// 				message:
// 					error?.response?.data?.message ||
// 					error?.message ||
// 					"Failed to create trip Expenses",
// 			});
// 		}
// 	}
// );

// /* ===================================================
//    GET ALL TRIP EXPENSES
// =================================================== */

// export const getAllTripExpenses = createAsyncThunk(
// 	"tripExpenses/getAllTripExpenses",
// 	async (
// 		{
// 			limit = 10,
// 			offset = 0,
// 			search = "",
// 			tripStatus = "",
// 		}: TripExpenseState = {},
// 		{ rejectWithValue }
// 	) => {
// 		try {
// 			const response = await professionalAxios.get(
// 				"/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/getAll",
// 				{
// 					params: {
// 						limit,
// 						offset,
// 						search,
// 						tripStatus,
// 					},
// 				}
// 			);

// 			return response?.data || null;
// 		} catch (error: any) {
// 			return rejectWithValue({
// 				message:
// 					error?.response?.data?.message ||
// 					error?.message ||
// 					"Failed to get all trip expenses",
// 			});
// 		}
// 	}
// );

// /* ===================================================
//    GET TRIP EXPENSE BY VOUCHER NUMBER
// =================================================== */

// export const getTripExpensesByVoucherNumber = createAsyncThunk(
// 	"tripExpenses/getTripExpensesByVoucherNumber",
// 	async (voucherNumber: string, { rejectWithValue }) => {
// 		try {
// 			const response = await professionalAxios.get(
// 				`/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/getByVoucherNumber/${voucherNumber}`
// 			);

// 			return response?.data || null;
// 		} catch (error: any) {
// 			return rejectWithValue({
// 				message:
// 					error?.response?.data?.message ||
// 					error?.message ||
// 					"Failed to get trip expenses",
// 			});
// 		}
// 	}
// );

// /* ===================================================
//    DELETE TRIP EXPENSE BY VOUCHER NUMBER
// =================================================== */

// export const deleteTripExpenses = createAsyncThunk(
// 	"tripExpenses/deleteTripExpenses",
// 	async (voucherNumber: string, { rejectWithValue }) => {
// 		try {
// 			const response = await professionalAxios.delete(
// 				`/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/delete/${voucherNumber}`
// 			);

// 			return response?.data || null;
// 		} catch (error: any) {
// 			return rejectWithValue({
// 				message:
// 					error?.response?.data?.message ||
// 					error?.message ||
// 					"Failed to delete trip expenses",
// 			});
// 		}
// 	}
// );

// /* ===================================================
//    UPDATE TRIP EXPENSE BY VOUCHER NUMBER
// =================================================== */

// export const updateTripExpenses = createAsyncThunk(
// 	"tripExpenses/updateTripExpenses",
// 	async (
// 		{ voucherNumber, payload }: { voucherNumber: string; payload: any },
// 		{ rejectWithValue }
// 	) => {
// 		try {
// 			const response = await professionalAxios.put(
// 				`/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/update/${voucherNumber}`,
// 				payload
// 			);

// 			return response?.data || null;
// 		} catch (error: any) {
// 			return rejectWithValue({
// 				message:
// 					error?.response?.data?.message ||
// 					error?.message ||
// 					"Failed to update trip expenses",
// 			});
// 		}
// 	}
// );

// /* ===================================================
//    SLICE
// =================================================== */

// const initialState: any = {
// 	tripExpenses: [],
// 	selectedTripExpense: null,
// 	pagination: {
// 		totalDocs: 0,
// 		totalRecords: 0,
// 		hasPrevPage: false,
// 		hasNextPage: false,
// 	},

// 	createLoader: false,
// 	updateLoader: false,
// 	deleteLoader: false,
// 	listingLoader: false,
// 	detailLoader: false,

// 	error: null,
// };

// const tripExpensesSlice = createSlice({
// 	name: "tripExpenses",
// 	initialState,
// 	reducers: {
// 		clearTripExpensesError: (state) => {
// 			state.error = null;
// 		},

// 		clearTripExpensesState: (state) => {
// 			state.tripExpenses = [];
// 			state.selectedTripExpense = null;
// 			state.pagination = {
// 				totalDocs: 0,
// 				totalRecords: 0,
// 				hasPrevPage: false,
// 				hasNextPage: false,
// 			};

// 			state.createLoader = false;
// 			state.updateLoader = false;
// 			state.deleteLoader = false;
// 			state.listingLoader = false;
// 			state.detailLoader = false;
// 			state.error = null;
// 		},
// 	},

// 	extraReducers: (builder) => {
// 		builder

// 			/* ===================================================
// 			   CREATE TRIP EXPENSE
// 			=================================================== */

// 			.addCase(createTripExpense.pending, (state) => {
// 				state.createLoader = true;
// 				state.error = null;
// 			})

// 			.addCase(createTripExpense.fulfilled, (state, action) => {
// 				state.createLoader = false;

// 				const createdExpense = getSingleExpenseFromPayload(action.payload);

// 				if (createdExpense) {
// 					const currentList = Array.isArray(state.tripExpenses)
// 						? state.tripExpenses
// 						: [];

// 					state.tripExpenses = [createdExpense, ...currentList];
// 					state.selectedTripExpense = createdExpense;
// 				}

// 				state.error = null;
// 			})

// 			.addCase(createTripExpense.rejected, (state, action) => {
// 				state.createLoader = false;
// 				state.error =
// 					(action.payload as { message?: string })?.message ||
// 					"Failed to create trip expenses";
// 			})

// 			/* ===================================================
// 			   GET ALL TRIP EXPENSES
// 			=================================================== */

// 			.addCase(getAllTripExpenses.pending, (state) => {
// 				state.listingLoader = true;
// 				state.error = null;
// 			})

// 			.addCase(getAllTripExpenses.fulfilled, (state, action) => {
// 				state.listingLoader = false;

// 				const records = getArrayFromPayload(action.payload);

// 				state.tripExpenses = records;
// 				state.pagination = getPaginationFromPayload(action.payload, records);

// 				state.error = null;
// 			})

// 			.addCase(getAllTripExpenses.rejected, (state, action) => {
// 				state.listingLoader = false;
// 				state.tripExpenses = [];
// 				state.pagination = {
// 					totalDocs: 0,
// 					totalRecords: 0,
// 					hasPrevPage: false,
// 					hasNextPage: false,
// 				};

// 				state.error =
// 					(action.payload as { message?: string })?.message ||
// 					"Failed to get trip expenses";
// 			})

// 			/* ===================================================
// 			   GET TRIP EXPENSE BY VOUCHER NUMBER
// 			=================================================== */

// 			.addCase(getTripExpensesByVoucherNumber.pending, (state) => {
// 				state.detailLoader = true;
// 				state.error = null;
// 			})

// 			.addCase(getTripExpensesByVoucherNumber.fulfilled, (state, action) => {
// 				state.detailLoader = false;

// 				const expense = getSingleExpenseFromPayload(action.payload);

// 				state.selectedTripExpense = expense;

// 				// IMPORTANT:
// 				// Do not replace state.tripExpenses with object here.
// 				// Keep tripExpenses always as array.

// 				state.error = null;
// 			})

// 			.addCase(getTripExpensesByVoucherNumber.rejected, (state, action) => {
// 				state.detailLoader = false;
// 				state.selectedTripExpense = null;

// 				state.error =
// 					(action.payload as { message?: string })?.message ||
// 					"Failed to get trip expenses";
// 			})

// 			/* ===================================================
// 			   DELETE TRIP EXPENSE
// 			=================================================== */

// 			.addCase(deleteTripExpenses.pending, (state) => {
// 				state.deleteLoader = true;
// 				state.error = null;
// 			})

// 			.addCase(deleteTripExpenses.fulfilled, (state, action) => {
// 				state.deleteLoader = false;

// 				const deletedExpense = getSingleExpenseFromPayload(action.payload);
// 				const deletedVoucher = getExpenseVoucher(deletedExpense);

// 				const currentList = Array.isArray(state.tripExpenses)
// 					? state.tripExpenses
// 					: [];

// 				if (deletedVoucher) {
// 					state.tripExpenses = currentList.filter(
// 						(item: any) => getExpenseVoucher(item) !== deletedVoucher
// 					);
// 				}

// 				state.error = null;
// 			})

// 			.addCase(deleteTripExpenses.rejected, (state, action) => {
// 				state.deleteLoader = false;

// 				state.error =
// 					(action.payload as { message?: string })?.message ||
// 					"Failed to delete trip expenses";
// 			})

// 			/* ===================================================
// 			   UPDATE TRIP EXPENSE
// 			=================================================== */

// 			.addCase(updateTripExpenses.pending, (state) => {
// 				state.updateLoader = true;
// 				state.error = null;
// 			})

// 			.addCase(updateTripExpenses.fulfilled, (state, action) => {
// 				state.updateLoader = false;

// 				const updatedExpense = getSingleExpenseFromPayload(action.payload);
// 				const updatedVoucher = getExpenseVoucher(updatedExpense);

// 				const currentList = Array.isArray(state.tripExpenses)
// 					? state.tripExpenses
// 					: [];

// 				if (updatedExpense && updatedVoucher) {
// 					const exists = currentList.some(
// 						(item: any) => getExpenseVoucher(item) === updatedVoucher
// 					);

// 					state.tripExpenses = exists
// 						? currentList.map((item: any) =>
// 								getExpenseVoucher(item) === updatedVoucher
// 									? updatedExpense
// 									: item
// 						  )
// 						: [updatedExpense, ...currentList];

// 					state.selectedTripExpense = updatedExpense;
// 				}

// 				state.error = null;
// 			})

// 			.addCase(updateTripExpenses.rejected, (state, action) => {
// 				state.updateLoader = false;

// 				state.error =
// 					(action.payload as { message?: string })?.message ||
// 					"Failed to update trip expense";
// 			});
// 	},
// });

// export const { clearTripExpensesError, clearTripExpensesState } =
// 	tripExpensesSlice.actions;

// export default tripExpensesSlice.reducer;





import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type TripExpenseState = {
	limit?: number;
	offset?: number;
	search?: string;
	tripStatus?: string;
};

/* ===================================================
   HELPERS
=================================================== */

const getArrayFromPayload = (payload: any) => {
	const data = payload?.data || payload || {};

	const records =
		data?.records ||
		data?.tripExpenses ||
		data?.data?.records ||
		data?.data?.tripExpenses ||
		data?.data ||
		payload?.records ||
		payload?.tripExpenses ||
		[];

	return Array.isArray(records) ? records : [];
};

const getPaginationFromPayload = (payload: any, records: any[] = []) => {
	const data = payload?.data || payload || {};

	return (
		data?.pagination ||
		data?.data?.pagination || {
			totalDocs: records.length,
			totalRecords: records.length,
			hasPrevPage: false,
			hasNextPage: false,
		}
	);
};

const getSingleExpenseFromPayload = (payload: any) => {
	const data = payload?.data || payload || {};

	if (Array.isArray(data)) return data[0] || null;
	if (Array.isArray(data?.records)) return data.records[0] || null;
	if (Array.isArray(data?.tripExpenses)) return data.tripExpenses[0] || null;

	return data || null;
};

const getExpenseVoucher = (item: any) =>
	item?.voucherNumber ||
	item?.tripExpenseVoucherNumber ||
	item?.tripExpenseNumber ||
	item?.tripVoucherNumber ||
	item?.tripId ||
	"";

/* ===================================================
   CREATE TRIP EXPENSE
=================================================== */

export const createTripExpense = createAsyncThunk(
	"tripExpenses/createTripExpense",
	async (payload: any, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.post(
				"/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/save",
				payload
			);

			if (!response?.data?.success) {
				return rejectWithValue({
					message:
						response?.data?.message || "Failed to create Trip Expenses",
				});
			}

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to create trip Expenses",
			});
		}
	}
);

/* ===================================================
   GET ALL TRIP EXPENSES
=================================================== */

export const getAllTripExpenses = createAsyncThunk(
	"tripExpenses/getAllTripExpenses",
	async (
		{
			limit = 10,
			offset = 0,
			search = "",
			tripStatus = "",
		}: TripExpenseState = {},
		{ rejectWithValue }
	) => {
		try {
			const response = await professionalAxios.get(
				"/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/getAll",
				{
					params: {
						limit,
						offset,
						search,
						tripStatus,
					},
				}
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to get all trip expenses",
			});
		}
	}
);

/* ===================================================
   GET TRIP EXPENSE BY VOUCHER NUMBER
=================================================== */

export const getTripExpensesByVoucherNumber = createAsyncThunk(
	"tripExpenses/getTripExpensesByVoucherNumber",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get(
				`/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/getByVoucherNumber/${voucherNumber}`
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to get trip expenses",
			});
		}
	}
);

/* ===================================================
   UPLOAD TRIP EXPENSE POD FILE
=================================================== */

export const uploadTripExpensePodFile = createAsyncThunk(
	"tripExpenses/uploadTripExpensePodFile",
	async (formData: FormData, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.post(
				"/eTaxSolnMongoApiBackend/documents",
				formData,
				{
					headers: {
						"Content-Type": "multipart/form-data",
					},
				}
			);

			if (response?.data?.success === false) {
				return rejectWithValue({
					message: response?.data?.message || "Failed to upload POD file",
				});
			}

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to upload POD file",
			});
		}
	}
);

/* ===================================================
   DELETE TRIP EXPENSE BY VOUCHER NUMBER
=================================================== */

export const deleteTripExpenses = createAsyncThunk(
	"tripExpenses/deleteTripExpenses",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.delete(
				`/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/delete/${voucherNumber}`
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to delete trip expenses",
			});
		}
	}
);

/* ===================================================
   UPDATE TRIP EXPENSE BY VOUCHER NUMBER
=================================================== */

export const updateTripExpenses = createAsyncThunk(
	"tripExpenses/updateTripExpenses",
	async (
		{ voucherNumber, payload }: { voucherNumber: string; payload: any },
		{ rejectWithValue }
	) => {
		try {
			const response = await professionalAxios.put(
				`/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/update/${voucherNumber}`,
				payload
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to update trip expenses",
			});
		}
	}
);

/* ===================================================
   SLICE
=================================================== */

const initialState: any = {
	tripExpenses: [],
	selectedTripExpense: null,
	pagination: {
		totalDocs: 0,
		totalRecords: 0,
		hasPrevPage: false,
		hasNextPage: false,
	},

	createLoader: false,
	updateLoader: false,
	deleteLoader: false,
	uploadLoader: false,
	listingLoader: false,
	detailLoader: false,

	error: null,
};

const tripExpensesSlice = createSlice({
	name: "tripExpenses",
	initialState,
	reducers: {
		clearTripExpensesError: (state) => {
			state.error = null;
		},

		clearTripExpensesState: (state) => {
			state.tripExpenses = [];
			state.selectedTripExpense = null;
			state.pagination = {
				totalDocs: 0,
				totalRecords: 0,
				hasPrevPage: false,
				hasNextPage: false,
			};

			state.createLoader = false;
			state.updateLoader = false;
			state.deleteLoader = false;
			state.uploadLoader = false;
			state.listingLoader = false;
			state.detailLoader = false;
			state.error = null;
		},
	},

	extraReducers: (builder) => {
		builder

			/* ===================================================
			   CREATE TRIP EXPENSE
			=================================================== */

			.addCase(createTripExpense.pending, (state) => {
				state.createLoader = true;
				state.error = null;
			})

			.addCase(createTripExpense.fulfilled, (state, action) => {
				state.createLoader = false;

				const createdExpense = getSingleExpenseFromPayload(action.payload);

				if (createdExpense) {
					const currentList = Array.isArray(state.tripExpenses)
						? state.tripExpenses
						: [];

					state.tripExpenses = [createdExpense, ...currentList];
					state.selectedTripExpense = createdExpense;
				}

				state.error = null;
			})

			.addCase(createTripExpense.rejected, (state, action) => {
				state.createLoader = false;
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to create trip expenses";
			})

			/* ===================================================
			   GET ALL TRIP EXPENSES
			=================================================== */

			.addCase(getAllTripExpenses.pending, (state) => {
				state.listingLoader = true;
				state.error = null;
			})

			.addCase(getAllTripExpenses.fulfilled, (state, action) => {
				state.listingLoader = false;

				const records = getArrayFromPayload(action.payload);

				state.tripExpenses = records;
				state.pagination = getPaginationFromPayload(action.payload, records);

				state.error = null;
			})

			.addCase(getAllTripExpenses.rejected, (state, action) => {
				state.listingLoader = false;
				state.tripExpenses = [];
				state.pagination = {
					totalDocs: 0,
					totalRecords: 0,
					hasPrevPage: false,
					hasNextPage: false,
				};

				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to get trip expenses";
			})

			/* ===================================================
			   GET TRIP EXPENSE BY VOUCHER NUMBER
			=================================================== */

			.addCase(getTripExpensesByVoucherNumber.pending, (state) => {
				state.detailLoader = true;
				state.error = null;
			})

			.addCase(getTripExpensesByVoucherNumber.fulfilled, (state, action) => {
				state.detailLoader = false;

				const expense = getSingleExpenseFromPayload(action.payload);

				state.selectedTripExpense = expense;

				// IMPORTANT:
				// Do not replace state.tripExpenses with object here.
				// Keep tripExpenses always as array.

				state.error = null;
			})

			.addCase(getTripExpensesByVoucherNumber.rejected, (state, action) => {
				state.detailLoader = false;
				state.selectedTripExpense = null;

				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to get trip expenses";
			})

			/* ===================================================
			   UPLOAD POD FILE
			=================================================== */

			.addCase(uploadTripExpensePodFile.pending, (state) => {
				state.uploadLoader = true;
				state.error = null;
			})

			.addCase(uploadTripExpensePodFile.fulfilled, (state) => {
				state.uploadLoader = false;
				state.error = null;
			})

			.addCase(uploadTripExpensePodFile.rejected, (state, action) => {
				state.uploadLoader = false;
				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to upload POD file";
			})

			/* ===================================================
			   DELETE TRIP EXPENSE
			=================================================== */

			.addCase(deleteTripExpenses.pending, (state) => {
				state.deleteLoader = true;
				state.error = null;
			})

			.addCase(deleteTripExpenses.fulfilled, (state, action) => {
				state.deleteLoader = false;

				const deletedExpense = getSingleExpenseFromPayload(action.payload);
				const deletedVoucher = getExpenseVoucher(deletedExpense);

				const currentList = Array.isArray(state.tripExpenses)
					? state.tripExpenses
					: [];

				if (deletedVoucher) {
					state.tripExpenses = currentList.filter(
						(item: any) => getExpenseVoucher(item) !== deletedVoucher
					);
				}

				state.error = null;
			})

			.addCase(deleteTripExpenses.rejected, (state, action) => {
				state.deleteLoader = false;

				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to delete trip expenses";
			})

			/* ===================================================
			   UPDATE TRIP EXPENSE
			=================================================== */

			.addCase(updateTripExpenses.pending, (state) => {
				state.updateLoader = true;
				state.error = null;
			})

			.addCase(updateTripExpenses.fulfilled, (state, action) => {
				state.updateLoader = false;

				const updatedExpense = getSingleExpenseFromPayload(action.payload);
				const updatedVoucher = getExpenseVoucher(updatedExpense);

				const currentList = Array.isArray(state.tripExpenses)
					? state.tripExpenses
					: [];

				if (updatedExpense && updatedVoucher) {
					const exists = currentList.some(
						(item: any) => getExpenseVoucher(item) === updatedVoucher
					);

					state.tripExpenses = exists
						? currentList.map((item: any) =>
								getExpenseVoucher(item) === updatedVoucher
									? updatedExpense
									: item
						  )
						: [updatedExpense, ...currentList];

					state.selectedTripExpense = updatedExpense;
				}

				state.error = null;
			})

			.addCase(updateTripExpenses.rejected, (state, action) => {
				state.updateLoader = false;

				state.error =
					(action.payload as { message?: string })?.message ||
					"Failed to update trip expense";
			});
	},
});

export const { clearTripExpensesError, clearTripExpensesState } =
	tripExpensesSlice.actions;

export default tripExpensesSlice.reducer;