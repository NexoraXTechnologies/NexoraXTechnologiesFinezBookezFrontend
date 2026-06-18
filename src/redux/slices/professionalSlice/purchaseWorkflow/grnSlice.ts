import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
  message: string;
};

type GrnParams = {
  offset?: number;
  limit?: number;
  status?: string;
  search?: string;
  voucherNumber?: string;
};

type GrnPayload = {
  payload: any;
};

type UpdateGrnPayload = {
  payload: any;
  grnVoucherNumber: string;
};

type DeleteGrnPayload = {
  grnVoucherNumber: string;
};

/* ===================================================
   ADD GRN
=================================================== */

export const addGrn = createAsyncThunk<
  any,
  GrnPayload,
  { rejectValue: RejectValue }
>("grn/addGrn", async ({ payload }, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post(
      "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/save",
      { ...payload }
    );

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || "Failed to create GRN",
      });
    }

    return res.data?.data;
  } catch (err: any) {
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to create GRN",
    });
  }
});

/* ===================================================
   UPDATE GRN
=================================================== */

export const updateGrn = createAsyncThunk<
  any,
  UpdateGrnPayload,
  { rejectValue: RejectValue }
>(
  "grn/updateGrn",
  async ({ payload, grnVoucherNumber }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/update/${grnVoucherNumber}`,
        { ...payload }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update GRN",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to update GRN",
      });
    }
  }
);

/* ===================================================
   DELETE GRN
=================================================== */

export const deleteGrn = createAsyncThunk<
  any,
  DeleteGrnPayload,
  { rejectValue: RejectValue }
>("grn/deleteGrn", async ({ grnVoucherNumber }, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.delete(
      `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/delete/${grnVoucherNumber}`
    );

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || "Failed to delete GRN",
      });
    }

    return grnVoucherNumber;
  } catch (err: any) {
    return rejectWithValue({
      message: err?.response?.data?.message || "Failed to delete GRN",
    });
  }
});

/* ===================================================
   getByVoucharNumber GRN LIST
=================================================== */

export const getByVoucharNumberGrnList = createAsyncThunk<
  any,
  GrnParams | undefined,
  { rejectValue: RejectValue }
>(
  "grn/getgetByVoucharNumberGrnList",
  async (
    { voucherNumber} = {},
    { rejectWithValue }
  ) => {
    try {
      
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/getByVoucherNumber/${voucherNumber}`,
       
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch GRN list",
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
        message: err?.response?.data?.message || "Failed to fetch GRN list",
      });
    }
  }
);
/* ===================================================
   GET GRN LIST
=================================================== */

export const getGrnList = createAsyncThunk<
  any,
  GrnParams | undefined,
  { rejectValue: RejectValue }
>(
  "grn/getGrnList",
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
        "/eTaxSolnMongoApiBackend/users/bookez/purchaseFlow/grn/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch GRN list",
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
        message: err?.response?.data?.message || "Failed to fetch GRN list",
      });
    }
  }
);

/* ===================================================
   SLICE
=================================================== */

const grnSlice = createSlice({
  name: "grn",

  initialState: {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,

    grnList: [] as any[],
    selectedGrn: null as any,

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
    clearGrnState: (state) => {
      state.error = null;
      state.addLoader = false;
      state.deleteLoader = false;
      state.listingLoader = false;
    },

    clearSelectedGrn: (state) => {
      state.selectedGrn = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ---------- ADD GRN ---------- */
      .addCase(addGrn.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(addGrn.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(addGrn.rejected, (state, action) => {
        state.addLoader = false;
        state.error = action.payload?.message || "Failed to create GRN";
      })

      /* ---------- GRN LISTING ---------- */
      .addCase(getGrnList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getGrnList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.grnList = action.payload?.records ?? [];
      })
      .addCase(getGrnList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error = action.payload?.message || "Failed to fetch GRN list";
        state.grnList = [];
      })
      /* ---------- GRN LISTING ---------- */
      .addCase(getByVoucharNumberGrnList.pending, (state) => {
        state.listingLoader = true;
        state.error = null;
      })
      .addCase(getByVoucharNumberGrnList.fulfilled, (state, action) => {
        state.listingLoader = false;

        state.pagination = action.payload?.pagination ?? state.pagination;
        state.grnList = action.payload?.records ?? [];
      })
      .addCase(getByVoucharNumberGrnList.rejected, (state, action) => {
        state.listingLoader = false;
        state.error = action.payload?.message || "Failed to fetch GRN list";
        state.grnList = [];
      })

      /* ---------- UPDATE GRN ---------- */
      .addCase(updateGrn.pending, (state) => {
        state.addLoader = true;
        state.error = null;
      })
      .addCase(updateGrn.fulfilled, (state) => {
        state.addLoader = false;
      })
      .addCase(updateGrn.rejected, (state, action) => {
        state.addLoader = false;
        state.error = action.payload?.message || "Failed to update GRN";
      })

      /* ---------- DELETE GRN ---------- */
      .addCase(deleteGrn.pending, (state) => {
        state.deleteLoader = true;
        state.error = null;
      })
      .addCase(deleteGrn.fulfilled, (state, action) => {
        state.deleteLoader = false;

        state.grnList = state.grnList.filter(
          (item: any) =>
            item?.grnVoucherNumber !== action.payload &&
            item?.voucherNumber !== action.payload
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteGrn.rejected, (state, action) => {
        state.deleteLoader = false;
        state.error = action.payload?.message || "Failed to delete GRN";
      });
  },
});

export const { clearGrnState, clearSelectedGrn } = grnSlice.actions;

export default grnSlice.reducer;