import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type CreditNoteParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
};

type CreditNotePayload = {
  payload: any;
};

type UpdateCreditNotePayload = {
  payload: any;
  creditNoteNumber: string;
};

type DeleteCreditNotePayload = {
  creditNoteNumber: string;
};

type GetCreditNoteByVoucherPayload = {
  voucherNumber: string;
};

/* ===================================================
   ADD CREDIT NOTE
=================================================== */

export const addCreditNote = createAsyncThunk<
  any,
  CreditNotePayload,
  { rejectValue: RejectValue }
>(
  "creditNote/addCreditNote",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesCreditNote/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create credit note",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create credit note",
      });
    }
  }
);

/* ===================================================
   UPDATE CREDIT NOTE
=================================================== */

export const updateCreditNote = createAsyncThunk<
  any,
  UpdateCreditNotePayload,
  { rejectValue: RejectValue }
>(
  "creditNote/updateCreditNote",
  async ({ payload, creditNoteNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesCreditNote/update/${creditNoteNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update credit note",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update credit note",
      });
    }
  }
);

/* ===================================================
   DELETE CREDIT NOTE
=================================================== */

export const deleteCreditNote = createAsyncThunk<
  any,
  DeleteCreditNotePayload,
  { rejectValue: RejectValue }
>(
  "creditNote/deleteCreditNote",
  async ({ creditNoteNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesCreditNote/delete/${creditNoteNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete credit note",
        });
      }

      return creditNoteNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete credit note",
      });
    }
  }
);

/* ===================================================
   GET CREDIT NOTE LIST
=================================================== */

export const getCreditNoteList = createAsyncThunk<
  any,
  CreditNoteParams | undefined,
  { rejectValue: RejectValue }
>(
  "creditNote/getCreditNoteList",
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
        "/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesCreditNote/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch credit notes",
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
          err?.response?.data?.message || "Failed to fetch credit notes",
      });
    }
  }
);





/* ===================================================
   GET CREDIT NOTE BY VOUCHER NUMBER
=================================================== */

export const getCreditNoteByVoucherNumber = createAsyncThunk<
  any,
  GetCreditNoteByVoucherPayload,
  { rejectValue: RejectValue }
>(
  "creditNote/getCreditNoteByVoucherNumber",
  async ({ voucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/otherApi/salesCreditNote/getByVoucherNo/${encodeURIComponent(
          voucherNumber
        )}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to fetch credit note",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch credit note",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const creditNoteSlice = createSlice({
  name: "creditNote",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    creditNotes: [] as any[],
    selectedCreditNote: null as any,

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
    clearCreditNoteState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedCreditNote: (state) => {
      state.selectedCreditNote = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD CREDIT NOTE ---------- */
      .addCase(addCreditNote.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addCreditNote.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addCreditNote.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create credit note";
      })

      /* ---------- CREDIT NOTE LISTING ---------- */
      .addCase(getCreditNoteList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getCreditNoteList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.creditNotes = action.payload?.records ?? [];
      })
      .addCase(getCreditNoteList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch credit notes";
        state.creditNotes = [];
      })

      /* ---------- UPDATE CREDIT NOTE ---------- */
      .addCase(updateCreditNote.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateCreditNote.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateCreditNote.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update credit note";
      })


      /* ---------- GET CREDIT NOTE BY VOUCHER ---------- */
      .addCase(getCreditNoteByVoucherNumber.pending, (state) => {
        state.error = null;
        state.selectedCreditNote = null;
      })
      .addCase(getCreditNoteByVoucherNumber.fulfilled, (state, action) => {
        state.selectedCreditNote =
          action.payload || null;

        state.error = null;
      })
      .addCase(getCreditNoteByVoucherNumber.rejected, (state, action) => {
        state.selectedCreditNote = null;

        state.error =
          action.payload?.message ||
          "Failed to fetch credit note";
      })

      /* ---------- DELETE CREDIT NOTE ---------- */
      .addCase(deleteCreditNote.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteCreditNote.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.creditNotes = state.creditNotes.filter(
          (item: any) =>
            item?.creditNoteNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteCreditNote.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete credit note";
      });
  },
});

export const {
  clearCreditNoteState,
  clearSelectedCreditNote,
} = creditNoteSlice.actions;

export default creditNoteSlice.reducer;