import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type TransportContractState = {
	limit?: number;
	offset?: number;
	search?: string;
	status?: string;
	priority?: string;
};

/* ===================================================
    CREATE Transport Contract
=================================================== */

export const createTransportContract = createAsyncThunk(
	"transportContract/createTransportContract",
	async (payload: any, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.post(
				"/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/save",
				payload
			);

			if (!response?.data?.success) {
				return rejectWithValue({
					message:
						response?.data?.message || "Failed to create Transport Contract",
				});
			}

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to create Transport Contract",
			});
		}
	}
);

/* ===================================================
    GET ALL Transport Contract
=================================================== */

export const getAllTransportContract = createAsyncThunk(
	"transportContract/getAllTransportContract",
	async (
		{
			limit = 10,
			offset = 0,
			search = "",
			status = "",
			priority = "",
		}: TransportContractState = {},
		{ rejectWithValue }
	) => {
		try {
			const response = await professionalAxios.get(
				"/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/getAll",
				{
					params: {
						limit,
						offset,
						search,
						status,
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
					"Failed to get all Transport Contract",
			});
		}
	}
);

/* ===================================================
    GET Transport Contract BY VOUCHER NUMBER
=================================================== */

export const getTransportContractByVoucherNumber = createAsyncThunk(
	"transportContract/getTransportContractByVoucherNumber",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get(
				`/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/getByVoucherNumber/${voucherNumber}`
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to get Transport Contract",
			});
		}
	}
);

/* ===================================================
    DELETE Transport Contract Entry BY VOUCHER NUMBER
=================================================== */

export const deleteTransportContract = createAsyncThunk(
	"transportContract/deleteTransportContract",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.delete(
				`/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/delete/${voucherNumber}`
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to delete Transport Contract",
			});
		}
	}
);

/* ===================================================
    UPDATE Transport Contract BY VOUCHER NUMBER
=================================================== */

export const updateTransportContract = createAsyncThunk(
	"transportContract/updateTransportContract",
	async (
		{
			voucherNumber,
			payload,
		}: {
			voucherNumber: string;
			payload: any;
		},
		{ rejectWithValue }
	) => {
		try {
			const response = await professionalAxios.put(
				`/eTaxSolnMongoApiBackend/users/bookEZ/transportContract/update/${voucherNumber}`,
				payload
			);

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({
				message:
					error?.response?.data?.message ||
					error?.message ||
					"Failed to Update Transport Contract",
			});
		}
	}
);

/* ===================================================
    SLICE
=================================================== */

const initialState: any = {
	transportContract: [],
	selectedTransportContract: null,
	pagination: null,

	createLoader: false,
	updateLoader: false,
	deleteLoader: false,
	listingLoader: false,
	detailLoader: false,

	error: null,
};

const transportContractSlice = createSlice({
	name: "transportContract",
	initialState,
	reducers: {
		clearTransportContractError: (state) => {
			state.error = null;
		},

		clearSelectedTransportContract: (state) => {
			state.selectedTransportContract = null;
			state.detailLoader = false;
			state.error = null;
		},

		clearTransportContractState: (state) => {
			state.transportContract = [];
			state.selectedTransportContract = null;
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

			/* ===================================================
			   CREATE
			=================================================== */

			.addCase(createTransportContract.pending, (state) => {
				state.createLoader = true;
				state.error = null;
			})
			.addCase(createTransportContract.fulfilled, (state, action) => {
				state.createLoader = false;

				const createdTC = action.payload?.data;

				if (createdTC && Array.isArray(state.transportContract)) {
					state.transportContract.unshift(createdTC);
				}

				state.error = null;
			})
			.addCase(createTransportContract.rejected, (state, action: any) => {
				state.createLoader = false;
				state.error =
					action.payload?.message || "Failed to create transport contract";
			})

			/* ===================================================
			   GET ALL
			=================================================== */

			.addCase(getAllTransportContract.pending, (state) => {
				state.listingLoader = true;
				state.error = null;
			})
			.addCase(getAllTransportContract.fulfilled, (state, action) => {
				state.listingLoader = false;

				const records = action.payload?.data?.records;

				state.transportContract = Array.isArray(records) ? records : [];
				state.pagination = action.payload?.data?.pagination || null;

				state.error = null;
			})
			.addCase(getAllTransportContract.rejected, (state, action: any) => {
				state.listingLoader = false;
				state.transportContract = [];
				state.pagination = null;
				state.error =
					action.payload?.message || "Failed to get transport contract";
			})

			/* ===================================================
			   GET BY VOUCHER NUMBER
			=================================================== */

			.addCase(getTransportContractByVoucherNumber.pending, (state) => {
				state.detailLoader = true;
				state.error = null;
			})
			.addCase(getTransportContractByVoucherNumber.fulfilled, (state, action) => {
				state.detailLoader = false;

				// ✅ Do not overwrite transportContract array here
				state.selectedTransportContract = action.payload?.data || null;

				state.error = null;
			})
			.addCase(getTransportContractByVoucherNumber.rejected, (state, action: any) => {
				state.detailLoader = false;
				state.selectedTransportContract = null;
				state.error =
					action.payload?.message || "Failed to get transport contract";
			})

			/* ===================================================
			   DELETE
			=================================================== */

			.addCase(deleteTransportContract.pending, (state) => {
				state.deleteLoader = true;
				state.error = null;
			})
			.addCase(deleteTransportContract.fulfilled, (state, action) => {
				state.deleteLoader = false;

				const deletedTC = action.payload?.data;
				const deletedContractNumber =
					deletedTC?.contractNumber || deletedTC?.voucherNumber;

				if (deletedContractNumber && Array.isArray(state.transportContract)) {
					state.transportContract = state.transportContract.filter(
						(t: any) =>
							t?.contractNumber !== deletedContractNumber &&
							t?.voucherNumber !== deletedContractNumber
					);
				}

				state.error = null;
			})
			.addCase(deleteTransportContract.rejected, (state, action: any) => {
				state.deleteLoader = false;
				state.error =
					action.payload?.message || "Failed to delete transport contract";
			})

			/* ===================================================
			   UPDATE
			=================================================== */

			.addCase(updateTransportContract.pending, (state) => {
				state.updateLoader = true;
				state.error = null;
			})
			.addCase(updateTransportContract.fulfilled, (state, action) => {
				state.updateLoader = false;

				const updatedTC = action.payload?.data;
				const updatedContractNumber =
					updatedTC?.contractNumber || updatedTC?.voucherNumber;

				state.selectedTransportContract = updatedTC || null;

				if (
					updatedTC &&
					updatedContractNumber &&
					Array.isArray(state.transportContract)
				) {
					state.transportContract = state.transportContract.map((t: any) => {
						const currentContractNumber =
							t?.contractNumber || t?.voucherNumber;

						return currentContractNumber === updatedContractNumber
							? updatedTC
							: t;
					});
				}

				state.error = null;
			})
			.addCase(updateTransportContract.rejected, (state, action: any) => {
				state.updateLoader = false;
				state.error =
					action.payload?.message || "Failed to update transport contract";
			});
	},
});

export const {
	clearTransportContractError,
	clearTransportContractState,
	clearSelectedTransportContract,
} = transportContractSlice.actions;

export default transportContractSlice.reducer;