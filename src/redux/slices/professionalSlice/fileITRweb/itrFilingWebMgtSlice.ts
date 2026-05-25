import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

// =======================================================
// GET ALL ITR FILING WEB WITH PAGINATION + FILTER
// =======================================================
export const getAllItrFilingWeb = createAsyncThunk(
  "itrFilingWebMgt/getAllItrFilingWeb",
  async ({ page = 1, limit = 10, pan = "", objectKey = "" }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      const offset = (page - 1) * limit;

      query.append("offset", String(offset));
      query.append("limit", String(limit));

      if (pan) query.append("pan", pan);
      if (objectKey) query.append("objectKey", objectKey);

      const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/fileITR_1/web/getAll?${query.toString()}`);
      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch ITR filing web records",
        });
      }

      const items = res.data?.data?.items ?? [];
      const pg = res.data?.data?.pagination ?? {};

      return {
        records: items,
        pagination: {
          offset: pg.offset ?? offset,
          limit: pg.limit ?? limit,
          totalDocs: pg.totalDocs ?? items.length,
          totalPages: pg.totalPages ?? 1,
          currentPage: pg.currentPage ?? page,
          // optional extras if your API gives them later
          hasNextPage: pg.hasNextPage,
          hasPrevPage: pg.hasPrevPage,
        },
        message: res.data?.message ?? null,
      };
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || err.message || "Something went wrong",
      });
    }
  }
);

// =======================================================
// SAVE (POST)
// =======================================================
export const saveItrFilingWeb = createAsyncThunk(
  "itrFilingWebMgt/saveItrFilingWeb",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/users/fileITR_1/web/save`,
        payload
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to save ITR filing web record",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err.response?.data?.message || "Failed to save ITR filing web record",
      });
    }
  }
);

// =======================================================
// UPDATE (PUT)
// =======================================================
export const updateItrFilingWeb = createAsyncThunk(
  "itrFilingWebMgt/updateItrFilingWeb",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/fileITR_1/web/update/${id}`,
        payload
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to update ITR filing web record",
        });
      }

      return { id, data: res.data.data };
    } catch (err) {
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          "Failed to update ITR filing web record",
      });
    }
  }
);

// =======================================================
// GET BY ID (PAN + AY)
// =======================================================
export const getItrFilingWebById = createAsyncThunk(
  "itrFilingWebMgt/getItrFilingWebById",
  async ({ pan, assessmentYear }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/fileITR_1/web/get/${pan}/${assessmentYear}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch ITR filing web record",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          "Failed to fetch ITR filing web record",
      });
    }
  }
);

// =======================================================
// DELETE
// =======================================================
export const deleteItrFilingWeb = createAsyncThunk(
  "itrFilingWebMgt/deleteItrFilingWeb",
  async (id, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/fileITR_1/web/delete/${id}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to delete ITR filing web record",
        });
      }

      return id;
    } catch (err) {
      return rejectWithValue({
        message:
          err.response?.data?.message ||
          "Failed to delete ITR filing web record",
      });
    }
  }
);

// =======================================================
// SLICE
// =======================================================
const itrFilingWebMgtSlice = createSlice({
  name: "itrFilingWebMgt",
  initialState: {
    records: [],
    selected: null, // for get by id response
    pagination: {
      currentPage: 1,
      totalPages: 1,
      limit: 10,
    },
    summary: null,
    loading: false,
    error: null,
    saveSuccess: false,
    updateSuccess: false,
    deleteSuccess: false,
  },
  reducers: {
    clearItrFilingWebState: (state) => {
      state.loading = false;
      state.error = null;
      state.saveSuccess = false;
      state.updateSuccess = false;
      state.deleteSuccess = false;
    },
    clearItrFilingWebSelected: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    // GET ALL
    builder
      .addCase(getAllItrFilingWeb.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllItrFilingWeb.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.pagination = action.payload.pagination;
        state.summary = action.payload.summary;
      })
      .addCase(getAllItrFilingWeb.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // SAVE
    builder
      .addCase(saveItrFilingWeb.pending, (state) => {
        state.loading = true;
        state.saveSuccess = false;
        state.error = null;
      })
      .addCase(saveItrFilingWeb.fulfilled, (state, action) => {
        state.loading = false;
        state.saveSuccess = true;

        // ✅ keep created record (for _id)
        state.selected = action.payload;

        // optional: prepend to list
        // state.records = [action.payload, ...state.records];
      })
      .addCase(saveItrFilingWeb.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // UPDATE
    builder
      .addCase(updateItrFilingWeb.pending, (state) => {
        state.loading = true;
        state.updateSuccess = false;
        state.error = null;
      })
      .addCase(updateItrFilingWeb.fulfilled, (state, action) => {
        state.loading = false;
        state.updateSuccess = true;

        // ✅ keep updated record
        state.selected = action.payload?.data ?? state.selected;

        // optional: update in list if present
        const id = action.payload?.id;
        const updated = action.payload?.data;
        if (id && updated) {
          const idx = state.records.findIndex((r) => (r._id || r.id) === id);
          if (idx !== -1) state.records[idx] = updated;
        }
      })
      .addCase(updateItrFilingWeb.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // DELETE
    builder.addCase(deleteItrFilingWeb.fulfilled, (state, action) => {
      state.loading = false;
      state.deleteSuccess = true;

      // optional: remove from list
      state.records = state.records.filter(
        (r) => (r._id || r.id) !== action.payload
      );
      if ((state.selected?._id || state.selected?.id) === action.payload) {
        state.selected = null;
      }
    });
  },
});

export const { clearItrFilingWebState, clearItrFilingWebSelected } =
  itrFilingWebMgtSlice.actions;

export default itrFilingWebMgtSlice.reducer;
