import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
    GET ALL TAXPAYERS
=================================================== */
export const getAllTaxPayers = createAsyncThunk('taxpayer/getAllTaxPayers', async ({ search = '', page = 1, limit = 10 } = {}, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/taxpayers/getAllTaxPayers`, { params: { search, page, limit } });

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to fetch taxpayers',
      });
    }

    const data = res.data?.data || {};
    const pg = data.pagination || {};

    // ✅ normalize backend pagination/currentPage to frontend page
    return {
      items: data.taxpayers ?? data.items ?? [], // depending on backend key
      pagination: {
        page: pg.currentPage ?? pg.page ?? page,
        limit: pg.limit ?? limit,
        totalDocs: pg.totalDocs ?? 0,
        totalPages: pg.totalPages ?? 1,
        hasNextPage: !!pg.hasNextPage,
        hasPrevPage: !!pg.hasPrevPage,
        offset: pg.offset ?? 0,
      },
      filters: data.filters ?? {},
    };
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to fetch taxpayers',
    });
  }
}); 
/* ===================================================
    GET TAXPAYER DETAILS BY PAN
=================================================== */
export const getTaxPayerDetails = createAsyncThunk(
  "taxpayer/getTaxPayerDetails",
  async (pan, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/taxpayers/getById/${pan}`
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch taxpayer details",
        });

      return res.data?.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch taxpayer details",
      });
    }
  }
);

/* ===================================================
    VERIFY IFSC
=================================================== */
export const verifyIFSC = createAsyncThunk(
  "taxpayer/verifyIFSC",
  async (ifscCode, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/taxpayers/verifyIFSC`,
        { ifsc: ifscCode }
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Invalid IFSC code",
        });

      return res.data?.data;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to verify IFSC",
      });
    }
  }
);

/* ===================================================
    ADD TAXPAYER
=================================================== */
export const addTaxpayer = createAsyncThunk(
  "taxpayer/addTaxpayer",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/users/taxpayers/addTaxPayers`,
        payload
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to add taxpayer",
        });

      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to add taxpayer",
      });
    }
  }
);

/* ===================================================
    UPDATE TAXPAYER
=================================================== */
export const updateTaxpayer = createAsyncThunk(
  "taxpayer/updateTaxpayer",
  async ({ pan, data }, { rejectWithValue }) => {
    try {

      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/taxpayers/update/${pan}`,
        data
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to update taxpayer",
        });

      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to update taxpayer",
      });
    }
  }
);

/* ===================================================
    GET INACTIVE TAXPAYERS
=================================================== */
export const getInactiveTaxPayers = createAsyncThunk(
  "taxpayer/getInactiveTaxPayers",
  async ({ search = "", page = 1, limit = 10 }  = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/taxpayers/getInactiveTaxPayers`,
        {
          params: {
            search,
            page,
            limit,
          },
        }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch inactive taxpayers",
        });
      }

      return res.data?.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch inactive taxpayers",
      });
    }
  }
);

/* ===================================================
    UPDATE TAXPAYER STATUS
=================================================== */
export const updateTaxpayerStatus = createAsyncThunk(
  "taxpayer/updateTaxpayerStatus",
  async ({ pan, status }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.patch(
        `/eTaxSolnMongoApiBackend/users/taxpayers/updateStatus/${pan}`,
        { status }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to update taxpayer status",
        });
      }

      return res.data?.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to update taxpayer status",
      });
    }
  }
);

/* ===================================================
    SLICE
=================================================== */
const addTaxpayerSlice = createSlice({
  name: "taxpayer",
  initialState: {
    taxpayers: [],
    pagination: {
      page: 1,
      limit: 10,
      totalDocs: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },

    selectedTaxpayer: null,
    ifscDetails: null,

    loading: false,
    error: null,

    addLoading: false,
    updateLoading: false,
    verifyLoading: false,
  },

  reducers: {
    clearTaxpayerState: (state) => {
      state.error = null;
      state.ifscDetails = null;
      state.addLoading = false;
      state.updateLoading = false;
      state.verifyLoading = false;
    },
  },

  extraReducers: (builder) => {
    /* ---------- GET ALL TAXPAYERS ---------- */
    builder
      .addCase(getAllTaxPayers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllTaxPayers.fulfilled, (state, action) => {
        state.loading = false;
        state.taxpayers = action.payload?.items ?? [];
        state.pagination = action.payload?.pagination ?? state.pagination;
      })
      .addCase(getAllTaxPayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.taxpayers = [];
      });

    /* ---------- GET TAXPAYER DETAILS BY PAN ---------- */
    builder
      .addCase(getTaxPayerDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTaxPayerDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTaxpayer = action.payload ?? null;
      })
      .addCase(getTaxPayerDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    /* ---------- VERIFY IFSC ---------- */
    builder
      .addCase(verifyIFSC.pending, (state) => {
        state.verifyLoading = true;
      })
      .addCase(verifyIFSC.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.ifscDetails = action.payload;
      })
      .addCase(verifyIFSC.rejected, (state, action) => {
        state.verifyLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- ADD TAXPAYER ---------- */
    builder
      .addCase(addTaxpayer.pending, (state) => {
        state.addLoading = true;
      })
      .addCase(addTaxpayer.fulfilled, (state, action) => {
        state.addLoading = false;
        if (action.payload) {
          state.taxpayers.unshift(action.payload);
          state.pagination.totalDocs += 1;
        }
      })
      .addCase(addTaxpayer.rejected, (state, action) => {
        state.addLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- UPDATE TAXPAYER ---------- */
    builder
      .addCase(updateTaxpayer.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(updateTaxpayer.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updated = action.payload;
        if (!updated?.pan) return;

        state.taxpayers = state.taxpayers.map((t) =>
          t.pan === updated.pan ? updated : t
        );
      })
      .addCase(updateTaxpayer.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload?.message;
      });
    /* ---------- GET INACTIVE TAXPAYERS ---------- */
    builder
      .addCase(getInactiveTaxPayers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getInactiveTaxPayers.fulfilled, (state, action) => {
        state.loading = false;

        // Add status manually because API does not send it
        const items = (action.payload?.items ?? []).map((item) => ({
          ...item,
          status: "inactive",
        }));

        state.taxpayers = items;
        state.pagination = action.payload?.pagination ?? state.pagination;
      })
      .addCase(getInactiveTaxPayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.taxpayers = [];
      });
    /* ---------- UPDATE TAXPAYER STATUS ---------- */
    builder
      .addCase(updateTaxpayerStatus.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(updateTaxpayerStatus.fulfilled, (state, action) => {
        state.updateLoading = false;

        const updated = action.payload;
        if (!updated?.pan) return;

        // update list
        state.taxpayers = state.taxpayers.map((t) =>
          t.pan === updated.pan ? updated : t
        );
      })
      .addCase(updateTaxpayerStatus.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearTaxpayerState } = addTaxpayerSlice.actions;
export default addTaxpayerSlice.reducer;
