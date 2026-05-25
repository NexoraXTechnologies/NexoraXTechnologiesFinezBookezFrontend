// src/store/slices/aisSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
    GET ALL AIS (LIST)
    GET  /eTaxSolnMongoApiBackend/ais?offset=0&limit=10
=================================================== */
export const fetchAISList = createAsyncThunk(
  "ais/fetchAISList",
  async ({ offset = 0, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/ais`,
        {
          params: { offset, limit },
        }
      );

      // API sample:
      // {
      //   "total": 1,
      //   "offset": 0,
      //   "limit": 10,
      //   "count": 1,
      //   "items": [ ... ]
      // }

      return res.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.error || "Failed to fetch AIS list",
      });
    }
  }
);

/* ===================================================
    GET AIS BY DOC ID
    GET  /eTaxSolnMongoApiBackend/ais/BXRPM0015L2025-2026
=================================================== */
export const fetchAISByDocId = createAsyncThunk(
  "ais/fetchAISByDocId",
  async (docId, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/ais/${docId}`
      );

      // Sample:
      // { "_id": "...", "Data": { pan, finYear, aisJSON, ... } }
      return res?.data;
    } catch (err) {
     
      return rejectWithValue({
        message:
          err?.response?.data?.error || "Failed to fetch AIS details",
      });
    }
  }
);

/* ===================================================
    PROCESS AIS PDF
    GET  /eTaxSolnMongoApiBackend/ais/processPdf?name=...&password=...
=================================================== */
export const processAISPdf = createAsyncThunk(
  "ais/processAISPdf",
  async ({ name, password }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/ais/processPdf`,
        {
          params: { name, password },
        }
      );

      // Sample:
      // {
      //   "message": "AIS PDF processed successfully.",
      //   "data": { ... full AIS JSON ... },
      //   "responseTimeMs": 1914
      // }

      if (!res.data?.data) {
        return rejectWithValue({
          message: res.data?.message || "Failed to process AIS PDF",
        });
      }

      // Return just the AIS data part (you can adjust to keep whole object if needed)
      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.error || "Failed to process AIS PDF",
      });
    }
  }
);

/* ===================================================
    SAVE AIS
    POST /eTaxSolnMongoApiBackend/ais
    Payload example:
    {
      "pan": "BXRPM0015L",
      "finYear": "2025-2026",
      "lastSyncDateTime": "2025-10-27T11:22:00Z",
      "aisJSON": { "data": { ... } }
    }
=================================================== */
export const saveAIS = createAsyncThunk(
  "ais/saveAIS",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/ais`,
        payload
      );

      // If your backend wraps with { success, data }, handle that here:
      if (res.data?.success === false) {
        return rejectWithValue({
          message: res.data?.message || "Failed to save AIS",
        });
      }

      // Return data; could be Data / data / full object depending on backend
      return res.data?.data ?? res.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.error || "Failed to save AIS",
      });
    }
  }
);

/* ===================================================
    SLICE
=================================================== */
const aisSlice = createSlice({
  name: "ais",
  initialState: {
    // List of AIS docs (items from GET /ais)
    aisList: [],
    pagination: {
      total: 0,
      offset: 0,
      limit: 10,
      count: 0,
    },

    // Single AIS doc by docId (GET /ais/{docId})
    selectedAIS: null,

    // Result of /ais/processPdf (pure AIS JSON)
    processedAIS: null,

    // Loaders
    listLoading: false,
    detailLoading: false,
    processLoading: false,
    saveLoading: false,

    error: null,
  },

  reducers: {
    clearAISState: (state) => {
      state.error = null;
      state.selectedAIS = null;
      state.processedAIS = null;
    },
    clearProcessedAIS: (state) => {
      state.processedAIS = null;
    },
    clearSelectedAIS: (state) => {
      state.selectedAIS = null;
    },
  },

  extraReducers: (builder) => {
    /* ---------- GET ALL AIS (LIST) ---------- */
    builder
      .addCase(fetchAISList.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchAISList.fulfilled, (state, action) => {
        state.listLoading = false;

        // Using response shape from your sample
        state.aisList = action.payload?.items ?? [];
        state.pagination = {
          total: action.payload?.total ?? 0,
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 10,
          count: action.payload?.count ?? 0,
        };
      })
      .addCase(fetchAISList.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload?.message;
        state.aisList = [];
      });

    /* ---------- GET AIS BY DOC ID ---------- */
    builder
      .addCase(fetchAISByDocId.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchAISByDocId.fulfilled, (state, action) => {
        state.detailLoading = false;
        // Whole object: { _id, Data: { ... } }
        state.selectedAIS = action.payload ?? null;
      })
      .addCase(fetchAISByDocId.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- PROCESS AIS PDF ---------- */
    builder
      .addCase(processAISPdf.pending, (state) => {
        state.processLoading = true;
        state.error = null;
      })
      .addCase(processAISPdf.fulfilled, (state, action) => {
        state.processLoading = false;
        // This is res.data.data from /ais/processPdf
        state.processedAIS = action.payload ?? null;
      })
      .addCase(processAISPdf.rejected, (state, action) => {
        state.processLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- SAVE AIS ---------- */
    builder
      .addCase(saveAIS.pending, (state) => {
        state.saveLoading = true;
        state.error = null;
      })
      .addCase(saveAIS.fulfilled, (state, action) => {
        state.saveLoading = false;

        // Whatever backend returns after POST /ais
        // Often you would get the saved doc back and could:
        //   - set selectedAIS
        //   - or update aisList if docId matches
        state.selectedAIS = action.payload ?? state.selectedAIS;
      })
      .addCase(saveAIS.rejected, (state, action) => {
        state.saveLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const {
  clearAISState,
  clearProcessedAIS,
  clearSelectedAIS,
} = aisSlice.actions;

export default aisSlice.reducer;