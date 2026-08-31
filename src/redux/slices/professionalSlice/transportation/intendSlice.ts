import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type TransportIndentState = {
	limit?: number;
	offset?: number;
	search?: string;
	status?: string;
	priority?: string;
};

// CREATE INDENT
export const createIndent = createAsyncThunk(
	"transportIndent/createIndent",
	async (payload: any, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.post("/eTaxSolnMongoApiBackend/users/bookEZ/transportIndent/save", payload);

			if (!response?.data?.success) {
				return rejectWithValue({ message: response?.data?.message || "Failed to create Transport Indent" });
			}

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to create Transport Indent" });
		}
	}
);

// GET ALL
export const getAllTransportIndent = createAsyncThunk(
	"transportIndent/getAllTransportIndent",
	async ({ limit = 10, offset = 0, search = "", status = "", priority = "" }: TransportIndentState = {}, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/transportIndent/getAll", {
				params: { limit, offset, search, status, priority },
			});

			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to get all Transport Indents" });
		}
	}
);

// GET BY INDENT NUMBER
export const getTransportIndentByVoucherNumber = createAsyncThunk(
	"transportIndent/getTransportIndentByVoucherNumber",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/bookEZ/transportIndent/getByVoucherNumber/${voucherNumber}`);
			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to get Transport Indent" });
		}
	}
);

// DELETE BY INDENT NUMBER
export const deleteTransportIndent = createAsyncThunk(
	"transportIndent/deleteTransportIndent",
	async (voucherNumber: string, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.delete(`/eTaxSolnMongoApiBackend/users/bookEZ/transportIndent/delete/${voucherNumber}`);
			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to delete Transport Indent" });
		}
	}
);

// UPDATE BY INDENT NUMBER
export const updateTransportIndent = createAsyncThunk(
	"transportIndent/updateTransportIndent",
	async ({ voucherNumber, payload }: { voucherNumber: string; payload: any }, { rejectWithValue }) => {
		try {
			const response = await professionalAxios.put(`/eTaxSolnMongoApiBackend/users/bookEZ/transportIndent/update/${voucherNumber}`, payload);
			return response?.data || null;
		} catch (error: any) {
			return rejectWithValue({ message: error?.response?.data?.message || error?.message || "Failed to update Transport Indent" });
		}
	}
);

// SLICE
const initialState: any = {
	transportIndents: [],
	selectedTransportIndent: null,
	pagination: null,
	createLoader: false,
	updateLoader: false,
	deleteLoader: false,
	listingLoader: false,
	detailLoader: false,
	error: null,
};

const transportIndentSlice = createSlice({
	name: "transportIndent",
	initialState,
	reducers: {
		clearTransportIndentError: (state) => {
			state.error = null;
		},
		clearSelectedTransportIndent: (state) => {
			state.selectedTransportIndent = null;
			state.detailLoader = false;
			state.error = null;
		},
		clearTransportIndentState: (state) => {
			state.transportIndents = [];
			state.selectedTransportIndent = null;
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
			.addCase(createIndent.pending, (state) => {
				state.createLoader = true;
				state.error = null;
			})
			.addCase(createIndent.fulfilled, (state, action) => {
				state.createLoader = false;
				const createdIndent = action.payload?.data;
				if (createdIndent && Array.isArray(state.transportIndents)) state.transportIndents.unshift(createdIndent);
				state.error = null;
			})
			.addCase(createIndent.rejected, (state, action: any) => {
				state.createLoader = false;
				state.error = action.payload?.message || "Failed to create Transport Indent";
			})

			// GET ALL
			.addCase(getAllTransportIndent.pending, (state) => {
				state.listingLoader = true;
				state.error = null;
			})
			.addCase(getAllTransportIndent.fulfilled, (state, action) => {
				state.listingLoader = false;
				const records = action.payload?.data?.records;
				state.transportIndents = Array.isArray(records) ? records : [];
				state.pagination = action.payload?.data?.pagination || null;
				state.error = null;
			})
			.addCase(getAllTransportIndent.rejected, (state, action: any) => {
				state.listingLoader = false;
				state.transportIndents = [];
				state.pagination = null;
				state.error = action.payload?.message || "Failed to get Transport Indents";
			})

			// GET BY INDENT NUMBER
			.addCase(getTransportIndentByVoucherNumber.pending, (state) => {
				state.detailLoader = true;
				state.error = null;
			})
			.addCase(getTransportIndentByVoucherNumber.fulfilled, (state, action) => {
				state.detailLoader = false;
				state.selectedTransportIndent = action.payload?.data || null;
				state.error = null;
			})
			.addCase(getTransportIndentByVoucherNumber.rejected, (state, action: any) => {
				state.detailLoader = false;
				state.selectedTransportIndent = null;
				state.error = action.payload?.message || "Failed to get Transport Indent";
			})

			// DELETE
			.addCase(deleteTransportIndent.pending, (state) => {
				state.deleteLoader = true;
				state.error = null;
			})
			.addCase(deleteTransportIndent.fulfilled, (state, action) => {
				state.deleteLoader = false;

				const deletedIndent = action.payload?.data;
				const deletedIndentNumber = deletedIndent?.indentNumber || deletedIndent?.voucherNumber;

				if (deletedIndentNumber && Array.isArray(state.transportIndents)) {
					state.transportIndents = state.transportIndents.filter(
						(indent: any) => indent?.indentNumber !== deletedIndentNumber && indent?.voucherNumber !== deletedIndentNumber
					);
				}

				state.error = null;
			})
			.addCase(deleteTransportIndent.rejected, (state, action: any) => {
				state.deleteLoader = false;
				state.error = action.payload?.message || "Failed to delete Transport Indent";
			})

			// UPDATE
			.addCase(updateTransportIndent.pending, (state) => {
				state.updateLoader = true;
				state.error = null;
			})
			.addCase(updateTransportIndent.fulfilled, (state, action) => {
				state.updateLoader = false;

				const updatedIndent = action.payload?.data;
				const updatedIndentNumber = updatedIndent?.indentNumber || updatedIndent?.voucherNumber;

				state.selectedTransportIndent = updatedIndent || null;

				if (updatedIndent && updatedIndentNumber && Array.isArray(state.transportIndents)) {
					state.transportIndents = state.transportIndents.map((indent: any) => {
						const currentIndentNumber = indent?.indentNumber || indent?.voucherNumber;
						return currentIndentNumber === updatedIndentNumber ? updatedIndent : indent;
					});
				}

				state.error = null;
			})
			.addCase(updateTransportIndent.rejected, (state, action: any) => {
				state.updateLoader = false;
				state.error = action.payload?.message || "Failed to update Transport Indent";
			});
	},
});

export const { clearTransportIndentError, clearTransportIndentState, clearSelectedTransportIndent } = transportIndentSlice.actions;

export default transportIndentSlice.reducer;