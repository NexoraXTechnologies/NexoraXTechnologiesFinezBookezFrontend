import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type DebitNoteParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
};

type DebitNotePayload = {
  payload: any;
};

type UpdateDebitNotePayload = {
  payload: any;
  debitNoteNumber: string;
};

type DeleteDebitNotePayload = {
  debitNoteNumber: string;
};

/* ===================================================
   ADD DEBIT NOTE
=================================================== */

export const addDebitNote = createAsyncThunk<
  any,
  DebitNotePayload,
  { rejectValue: RejectValue }
>(
  "debitNote/addDebitNote",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesDebitNote/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create debit note",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create debit note",
      });
    }
  }
);

/* ===================================================
   UPDATE DEBIT NOTE
=================================================== */

export const updateDebitNote = createAsyncThunk<
  any,
  UpdateDebitNotePayload,
  { rejectValue: RejectValue }
>(
  "debitNote/updateDebitNote",
  async ({ payload, debitNoteNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesDebitNote/update/${debitNoteNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update debit note",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update debit note",
      });
    }
  }
);

/* ===================================================
   DELETE DEBIT NOTE
=================================================== */

export const deleteDebitNote = createAsyncThunk<
  any,
  DeleteDebitNotePayload,
  { rejectValue: RejectValue }
>(
  "debitNote/deleteDebitNote",
  async ({ debitNoteNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesDebitNote/delete/${debitNoteNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete debit note",
        });
      }

      return debitNoteNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete debit note",
      });
    }
  }
);

/* ===================================================
   GET DEBIT NOTE LIST
=================================================== */

export const getDebitNoteList = createAsyncThunk<
  any,
  DebitNoteParams | undefined,
  { rejectValue: RejectValue }
>(
  "debitNote/getDebitNoteList",
  async (
    { offset = 0, limit = 10, status = "", search = "" } = {},
    { rejectWithValue }
  ) => {
    try {
      const params: any = {
        offset,
        limit,
      };

      if (status) {
        params.status = status;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesDebitNote/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch debit notes",
        });
      }

      return (
        res.data?.data ?? {
          records: [],
          pagination: null,
        }
      );
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch debit notes",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const debitNoteSlice = createSlice({
  name: "debitNote",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    debitNotes: [] as any[],
    selectedDebitNote: null as any,

    error: null as string | null,

    pagination: {
      offset: 0,
      limit: 10,
      totalDocs: 0,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  },

  reducers: {
    clearDebitNoteState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedDebitNote: (state) => {
      state.selectedDebitNote = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD DEBIT NOTE ---------- */
      .addCase(addDebitNote.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addDebitNote.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addDebitNote.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create debit note";
      })

      /* ---------- DEBIT NOTE LISTING ---------- */
      .addCase(getDebitNoteList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getDebitNoteList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.debitNotes = action.payload?.records ?? [];
      })
      .addCase(getDebitNoteList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch debit notes";
        state.debitNotes = [];
      })

      /* ---------- UPDATE DEBIT NOTE ---------- */
      .addCase(updateDebitNote.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateDebitNote.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateDebitNote.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update debit note";
      })

      /* ---------- DELETE DEBIT NOTE ---------- */
      .addCase(deleteDebitNote.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteDebitNote.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.debitNotes = state.debitNotes.filter(
          (item: any) =>
            item?.debitNoteNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteDebitNote.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete debit note";
      });
  },
});

export const {
  clearDebitNoteState,
  clearSelectedDebitNote,
} = debitNoteSlice.actions;

export default debitNoteSlice.reducer;