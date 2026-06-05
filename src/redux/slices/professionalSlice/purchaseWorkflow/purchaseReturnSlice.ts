import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type PurchaseReturnParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
};

type PurchaseReturnPayload = {
  payload: any;
};

type UpdatePurchaseReturnPayload = {
  payload: any;
  purchaseReturnNumber: string;
};

type DeletePurchaseReturnPayload = {
  purchaseReturnNumber: string;
};

/* ===================================================
   ADD PURCHASE RETURN
=================================================== */

export const addPurchaseReturn = createAsyncThunk<
  any,
  PurchaseReturnPayload,
  { rejectValue: RejectValue }
>(
  "purchaseReturn/addPurchaseReturn",
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseReturn/save",
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to create purchase return",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to create purchase return",
      });
    }
  }
);

/* ===================================================
   UPDATE PURCHASE RETURN
=================================================== */

export const updatePurchaseReturn = createAsyncThunk<
  any,
  UpdatePurchaseReturnPayload,
  { rejectValue: RejectValue }
>(
  "purchaseReturn/updatePurchaseReturn",
  async ({ payload, purchaseReturnNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseReturn/update/${purchaseReturnNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update purchase return",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update purchase return",
      });
    }
  }
);

/* ===================================================
   DELETE PURCHASE RETURN
=================================================== */

export const deletePurchaseReturn = createAsyncThunk<
  any,
  DeletePurchaseReturnPayload,
  { rejectValue: RejectValue }
>(
  "purchaseReturn/deletePurchaseReturn",
  async ({ purchaseReturnNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseReturn/delete/${purchaseReturnNumber}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete purchase return",
        });
      }

      return purchaseReturnNumber;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to delete purchase return",
      });
    }
  }
);

/* ===================================================
   GET PURCHASE RETURN LIST
=================================================== */

export const getPurchaseReturnList = createAsyncThunk<
  any,
  PurchaseReturnParams | undefined,
  { rejectValue: RejectValue }
>(
  "purchaseReturn/getPurchaseReturnList",
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
        "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/purchaseReturn/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch purchase returns",
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
          err?.response?.data?.message || "Failed to fetch purchase returns",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const purchaseReturnSlice = createSlice({
  name: "purchaseReturn",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    purchaseReturnList: [] as any[],
    selectedPurchaseReturn: null as any,

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
    clearPurchaseReturnState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedPurchaseReturn: (state) => {
      state.selectedPurchaseReturn = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD PURCHASE RETURN ---------- */
      .addCase(addPurchaseReturn.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addPurchaseReturn.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addPurchaseReturn.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to create purchase return";
      })

      /* ---------- PURCHASE RETURN LISTING ---------- */
      .addCase(getPurchaseReturnList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getPurchaseReturnList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.purchaseReturnList = action.payload?.records ?? [];
      })
      .addCase(getPurchaseReturnList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error =
          action.payload?.message || "Failed to fetch purchase returns";
        state.purchaseReturnList = [];
      })

      /* ---------- UPDATE PURCHASE RETURN ---------- */
      .addCase(updatePurchaseReturn.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updatePurchaseReturn.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updatePurchaseReturn.rejected, (state, action) => {
        state.addLoader = false;
        state.error =
          action.payload?.message || "Failed to update purchase return";
      })

      /* ---------- DELETE PURCHASE RETURN ---------- */
      .addCase(deletePurchaseReturn.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deletePurchaseReturn.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.purchaseReturnList = state.purchaseReturnList.filter(
          (item: any) =>
            item?.purchaseReturnNumber !== action.payload &&
            item?.pRetVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deletePurchaseReturn.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error =
          action.payload?.message || "Failed to delete purchase return";
      });
  },
});

export const {
  clearPurchaseReturnState,
  clearSelectedPurchaseReturn,
} = purchaseReturnSlice.actions;

export default purchaseReturnSlice.reducer;