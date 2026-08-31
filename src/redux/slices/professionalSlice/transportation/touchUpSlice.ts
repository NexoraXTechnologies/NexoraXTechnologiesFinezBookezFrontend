import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type TransportTouchupState = {
	limit?: number;
	offset?: number;
	search?: string;
	status?: string;
	priority?: string;
};

// CREATE TOUCHUP
export const createTransportTouchup = createAsyncThunk(
	"transportTouchup/createTransportTouchup",
	async (payload: any, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.post("/eTaxSolnMongoApiBackend/users/bookEZ/transportTouchup/save", payload);

			if (!response?.data?.success) {
				return rejectWithValue({ message: response?.data?.message || "Failed to create Transport Touchup" });
			}

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to create Transport Touchup" });
		}
	}
);

// GET ALL
export const getAllTransportTouchup = createAsyncThunk(
	"transportTouchup/getAllTransportTouchup",
	async ({ limit = 10, offset = 0, search = "", status = "", priority = "" }: TransportTouchupState = {}, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/transportTouchup/getAll", {
				params: { limit, offset, search, status, priority },
			});

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to get all Transport Touchups" });
		}
	}
);

// GET BY VOUCHER NUMBER
export const getTransportTouchupByVoucherNumber = createAsyncThunk(
	"transportTouchup/getTransportTouchupByVoucherNumber",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/transportTouchup/getByVoucherNumber/${voucherNumber}`);
			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to get Transport Touchup" });
		}
	}
);

// DELETE BY VOUCHER NUMBER
export const deleteTransportTouchup = createAsyncThunk(
	"transportTouchup/deleteTransportTouchup",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/transportTouchup/delete/${voucherNumber}`);
			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to delete Transport Touchup" });
		}
	}
);

// UPDATE BY VOUCHER NUMBER
export const updateTransportTouchup = createAsyncThunk(
	"transportTouchup/updateTransportTouchup",
	async ({ voucherNumber, payload }: { voucherNumber: string; payload: any }, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookEZ/transportTouchup/update/${voucherNumber}`, payload);
			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to update Transport Touchup" });
		}
	}
);

// SLICE
const initialState: any = {
	transportTouchups: [],
	selectedTransportTouchup: null,
	pagination: null,
	createLoader: false,
	updateLoader: false,
	deleteLoader: false,
	listingLoader: false,
	detailLoader: false,
	error: null,
};

const transportTouchupSlice = createSlice({
	name: "transportTouchup",
	initialState,
	reducers: {
		clearTransportTouchupError: (state) => {
			state.error = null;
		},
		clearSelectedTransportTouchup: (state) => {
			state.selectedTransportTouchup = null;
			state.detailLoader = false;
			state.error = null;
		},
		clearTransportTouchupState: (state) => {
			state.transportTouchups = [];
			state.selectedTransportTouchup = null;
			state.pagination = null;
			state.createLoader = false;
			state.updateLoader = false;
			state.deleteLoader = false;
			state.listingLoader = false;
			state.detailLoader = false;
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// CREATE
			.addCase(createTransportTouchup.pending, (state) => {
				state.createLoader = true;
				state.error = null;
			})
			.addCase(createTransportTouchup.fulfilled, (state, action) => {
				state.createLoader = false;
				const createdTouchup = action.payload?.data;
				if (createdTouchup && Array.isArray(state.transportTouchups)) state.transportTouchups.unshift(createdTouchup);
				state.error = null;
			})
			.addCase(createTransportTouchup.rejected, (state, action: any) => {
				state.createLoader = false;
				state.error = action.payload?.message || "Failed to create Transport Touchup";
			})

			// GET ALL
			.addCase(getAllTransportTouchup.pending, (state) => {
				state.listingLoader = true;
				state.error = null;
			})
			.addCase(getAllTransportTouchup.fulfilled, (state, action) => {
				state.listingLoader = false;
				const records = action.payload?.data?.records;
				state.transportTouchups = Array.isArray(records) ? records : [];
				state.pagination = action.payload?.data?.pagination || null;
				state.error = null;
			})
			.addCase(getAllTransportTouchup.rejected, (state, action: any) => {
				state.listingLoader = false;
				state.transportTouchups = [];
				state.pagination = null;
				state.error = action.payload?.message || "Failed to get Transport Touchups";
			})

			// GET BY VOUCHER NUMBER
			.addCase(getTransportTouchupByVoucherNumber.pending, (state) => {
				state.detailLoader = true;
				state.error = null;
			})
			.addCase(getTransportTouchupByVoucherNumber.fulfilled, (state, action) => {
				state.detailLoader = false;
				state.selectedTransportTouchup = action.payload?.data || null;
				state.error = null;
			})
			.addCase(getTransportTouchupByVoucherNumber.rejected, (state, action: any) => {
				state.detailLoader = false;
				state.selectedTransportTouchup = null;
				state.error = action.payload?.message || "Failed to get Transport Touchup";
			})

			// DELETE
			.addCase(deleteTransportTouchup.pending, (state) => {
				state.deleteLoader = true;
				state.error = null;
			})
			.addCase(deleteTransportTouchup.fulfilled, (state, action) => {
				state.deleteLoader = false;

				const deletedTouchup = action.payload?.data;
				const deletedVoucherNumber = deletedTouchup?.voucherNumber || deletedTouchup?.touchUpNumber || deletedTouchup?.touchupNumber;

				if (deletedVoucherNumber && Array.isArray(state.transportTouchups)) {
					state.transportTouchups = state.transportTouchups.filter((touchup: any) => {
						const currentVoucherNumber = touchup?.voucherNumber || touchup?.touchUpNumber || touchup?.touchupNumber;
						return currentVoucherNumber !== deletedVoucherNumber;
					});
				}

				state.error = null;
			})
			.addCase(deleteTransportTouchup.rejected, (state, action: any) => {
				state.deleteLoader = false;
				state.error = action.payload?.message || "Failed to delete Transport Touchup";
			})

			// UPDATE
			.addCase(updateTransportTouchup.pending, (state) => {
				state.updateLoader = true;
				state.error = null;
			})
			.addCase(updateTransportTouchup.fulfilled, (state, action) => {
				state.updateLoader = false;

				const updatedTouchup = action.payload?.data;
				const updatedVoucherNumber = updatedTouchup?.voucherNumber || updatedTouchup?.touchUpNumber || updatedTouchup?.touchupNumber;

				state.selectedTransportTouchup = updatedTouchup || null;

				if (updatedTouchup && updatedVoucherNumber && Array.isArray(state.transportTouchups)) {
					state.transportTouchups = state.transportTouchups.map((touchup: any) => {
						const currentVoucherNumber = touchup?.voucherNumber || touchup?.touchUpNumber || touchup?.touchupNumber;
						return currentVoucherNumber === updatedVoucherNumber ? updatedTouchup : touchup;
					});
				}

				state.error = null;
			})
			.addCase(updateTransportTouchup.rejected, (state, action: any) => {
				state.updateLoader = false;
				state.error = action.payload?.message || "Failed to update Transport Touchup";
			});
	},
});

export const { clearTransportTouchupError, clearTransportTouchupState, clearSelectedTransportTouchup } = transportTouchupSlice.actions;

export default transportTouchupSlice.reducer;