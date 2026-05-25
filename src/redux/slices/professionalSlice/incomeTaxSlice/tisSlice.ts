// src/store/slices/tisSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
    GET ALL TIS (LIST)
    GET  /eTaxSolnMongoApiBackend/tis?offset=0&limit=10
=================================================== */
export const fetchTISList = createAsyncThunk(
  "tis/fetchTISList",
  async ({ offset = 0, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/tis`,
        { params: { offset, limit } }
      );

      // API sample:
      // {
      //   "total": 1,
      //   "offset": 0,
      //   "limit": 10,
      //   "count": 1,
      //   "items": [ { _id, Data: { pan, finYear, tisJSON, ... } } ]
      // }

      return res.data;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch TIS list",
      });
    }
  }
);

/* ===================================================
    GET TIS BY DOC ID
    GET  /eTaxSolnMongoApiBackend/tis/BXRPM0015L2025-2026
=================================================== */
export const fetchTISByDocId = createAsyncThunk(
  "tis/fetchTISByDocId",
  async (docId, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/tis/${docId}`
      );

      // Sample:
      // { "_id": "...", "Data": { pan, finYear, tisJSON, ... } }
      return res?.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch TIS details",
      });
    }
  }
);

/* ===================================================
    PROCESS TIS PDF
    GET  /eTaxSolnMongoApiBackend/tis/processPdf?name=...&password=...
=================================================== */
export const processTISPdf = createAsyncThunk(
  "tis/processTISPdf",
  async ({ name, password }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/tis/processPdf`,
        {
          params: { name, password },
        }
      );

      // API sample:
      // {
      //   "message": "TIS PDF processed successfully.",
      //   "data": { ... full TIS JSON ... },
      //   "responseTimeMs": 419
      // }

      if (!res.data?.data) {
        return rejectWithValue({
          message: res.data?.message || "Failed to process TIS PDF",
        });
      }

      // Return just the TIS data part
      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to process TIS PDF",
      });
    }
  }
);

/* ===================================================
    SAVE TIS
    POST /eTaxSolnMongoApiBackend/tis
    Payload example:
    {
      "pan": "BXRPM0015L",
      "finYear": "2025-2026",
      "lastSyncDateTime": "2025-10-27T11:22:00Z",
      "tisJSON": { "data": { ... } }
    }
=================================================== */
export const saveTIS = createAsyncThunk(
  "tis/saveTIS",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/tis`,
        payload
      );

      // If your backend uses { success, data }, handle it:
      if (res.data?.success === false) {
        return rejectWithValue({
          message: res.data?.message || "Failed to save TIS",
        });
      }

      // Could be { data: { ... } } or the full doc; support both
      return res.data?.data ?? res.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to save TIS",
      });
    }
  }
);

/* ===================================================
    SLICE
=================================================== */
const tisSlice = createSlice({
  name: "tis",
  initialState: {
    // List of TIS docs (items from GET /tis)
    tisList: [],
    pagination: {
      total: 0,
      offset: 0,
      limit: 10,
      count: 0,
    },

    // Single TIS doc by docId (GET /tis/{docId})
    selectedTIS: null,

    // Result of /tis/processPdf (pure TIS JSON)
    processedTIS: null,

    // Loaders
    listLoading: false,
    detailLoading: false,
    processLoading: false,
    saveLoading: false,

    error: null,
  },

  reducers: {
    clearTISState: (state) => {
      state.error = null;
      state.selectedTIS = null;
      state.processedTIS = null;
    },
    clearProcessedTIS: (state) => {
      state.processedTIS = null;
    },
    clearSelectedTIS: (state) => {
      state.selectedTIS = null;
    },
  },

  extraReducers: (builder) => {
    /* ---------- GET ALL TIS (LIST) ---------- */
    builder
      .addCase(fetchTISList.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchTISList.fulfilled, (state, action) => {
        state.listLoading = false;

        state.tisList = action.payload?.items ?? [];
        state.pagination = {
          total: action.payload?.total ?? 0,
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 10,
          count: action.payload?.count ?? 0,
        };
      })
      .addCase(fetchTISList.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload?.message;
        state.tisList = [];
      });

    /* ---------- GET TIS BY DOC ID ---------- */
    builder
      .addCase(fetchTISByDocId.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchTISByDocId.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedTIS = action.payload ?? null;
      })
      .addCase(fetchTISByDocId.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- PROCESS TIS PDF ---------- */
    builder
      .addCase(processTISPdf.pending, (state) => {
        state.processLoading = true;
        state.error = null;
      })
      .addCase(processTISPdf.fulfilled, (state, action) => {
        state.processLoading = false;
        state.processedTIS = action.payload ?? null;
      })
      .addCase(processTISPdf.rejected, (state, action) => {
        state.processLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- SAVE TIS ---------- */
    builder
      .addCase(saveTIS.pending, (state) => {
        state.saveLoading = true;
        state.error = null;
      })
      .addCase(saveTIS.fulfilled, (state, action) => {
        state.saveLoading = false;

        // After saving, set selectedTIS to returned doc (if backend sends it)
        state.selectedTIS = action.payload ?? state.selectedTIS;
      })
      .addCase(saveTIS.rejected, (state, action) => {
        state.saveLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const {
  clearTISState,
  clearProcessedTIS,
  clearSelectedTIS,
} = tisSlice.actions;

export default tisSlice.reducer;