// src/store/slices/form26asSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
    GET ALL Form 26AS (LIST)
    GET  /eTaxSolnMongoApiBackend/form26as?offset=0&limit=10
=================================================== */
export const fetchForm26ASList = createAsyncThunk(
  "form26as/fetchForm26ASList",
  async ({ offset = 0, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/form26as`,
        { params: { offset, limit } }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch Form 26AS list",
      });
    }
  }
);

/* ===================================================
    GET Form 26AS BY DOC ID
    GET  /eTaxSolnMongoApiBackend/form26as/EDRPS4458E2025-2026
=================================================== */
export const fetchForm26ASByDocId = createAsyncThunk(
  "form26as/fetchForm26ASByDocId",
  async (docId, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/form26as/${docId}`
      );

      // Sample:
      // { "_id": "....", "Data": { pan, finYear, form26ASJSON: { Data: {...} } } }
      

      return res?.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch Form 26AS details",
      });
    }
  }
);

/* ===================================================
    PROCESS Form 26AS ZIP
    GET  /eTaxSolnMongoApiBackend/form26as/processZip?name=...&password=...
=================================================== */
export const processForm26ASZip = createAsyncThunk(
  "form26as/processForm26ASZip",
  async ({ name, password }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/form26as/processZip`,
        { params: { name, password } }
      );

      if (!res.data?.data) {
        return rejectWithValue({
          message: res.data?.message || "Failed to process Form 26AS ZIP",
        });
      }

      // Keep only the parsed data (statementTitle, assessee, parts, etc.)
      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to process Form 26AS ZIP",
      });
    }
  }
);


export const saveForm26AS = createAsyncThunk(
  "form26as/saveForm26AS",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/form26as`,
        payload
      );

      // If backend wraps with { success, data }, handle it safely
      if (res.data?.success === false) {
        return rejectWithValue({
          message: res.data?.message || "Failed to save Form 26AS",
        });
      }

      // Could be { data: { ... } } or whole doc; support both
      return res.data?.data ?? res.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to save Form 26AS",
      });
    }
  }
);

/* ===================================================
    UPLOAD FORM 26AS ZIP FILE (FORM DATA)
    POST /users/uploadfiles/upload
=================================================== */
export const uploadForm26ASFile = createAsyncThunk(
  "form26as/uploadForm26ASFile",
  async ({ name, uploadDate, file, fileType }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("uploadDate", uploadDate);
      formData.append("file", file);
      formData.append("fileType", fileType);

      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/users/uploadfiles/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return res.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to upload file",
      });
    }
  }
);

/* ===================================================
    DOWNLOAD FORM 26AS ZIP
    GET /users/uploadfiles/download/:name
=================================================== */
export const downloadForm26ASFile = createAsyncThunk(
  "form26as/downloadForm26ASFile",
  async ({ name }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/uploadfiles/download/${name}`,
        { responseType: "blob" }
      );

      return { blob: res.data, name };
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to download Form 26AS ZIP file",
      });
    }
  }
);

/* ===================================================
    SLICE
=================================================== */
const form26asSlice = createSlice({
  name: "form26as",
  initialState: {
    // List from GET /form26as
    form26asList: [],
    pagination: {
      total: 0,
      offset: 0,
      limit: 10,
      count: 0,
    },

    // Single record from GET /form26as/:docId
    selectedForm26AS: null,

    // Parsed ZIP result from /form26as/processZip
    processedForm26AS: null,

    // Loaders
    listLoading: false,
    detailLoading: false,
    processLoading: false,
    saveLoading: false,

    error: null,
    uploadLoading: false,
    downloadLoading: false,
    uploadResponse: null,
    downloadedFile: null,
  },

  reducers: {
    clearForm26ASState: (state) => {
      state.error = null;
      state.selectedForm26AS = null;
      state.processedForm26AS = null;
    },
    clearProcessedForm26AS: (state) => {
      state.processedForm26AS = null;
    },
    clearSelectedForm26AS: (state) => {
      state.selectedForm26AS = null;
    },
  },

  extraReducers: (builder) => {
    /* ---------- GET ALL Form 26AS (LIST) ---------- */
    builder
      .addCase(fetchForm26ASList.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchForm26ASList.fulfilled, (state, action) => {
        state.listLoading = false;

        state.form26asList = action.payload?.items ?? [];
        state.pagination = {
          total: action.payload?.total ?? 0,
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 10,
          count: action.payload?.count ?? 0,
        };
      })
      .addCase(fetchForm26ASList.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload?.message;
        state.form26asList = [];
      });

    /* ---------- GET Form 26AS BY DOC ID ---------- */
    builder
      .addCase(fetchForm26ASByDocId.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchForm26ASByDocId.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedForm26AS = action.payload ?? null;
      })
      .addCase(fetchForm26ASByDocId.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- PROCESS Form 26AS ZIP ---------- */
    builder
      .addCase(processForm26ASZip.pending, (state) => {
        state.processLoading = true;
        state.error = null;
      })
      .addCase(processForm26ASZip.fulfilled, (state, action) => {
        state.processLoading = false;
        // Parsed object from /processZip
        state.processedForm26AS = action.payload ?? null;
      })
      .addCase(processForm26ASZip.rejected, (state, action) => {
        state.processLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- SAVE Form 26AS ---------- */
    builder
      .addCase(saveForm26AS.pending, (state) => {
        state.saveLoading = true;
        state.error = null;
      })
      .addCase(saveForm26AS.fulfilled, (state, action) => {
        state.saveLoading = false;
        // After saving, store whatever backend returns as current selected
        state.selectedForm26AS = action.payload ?? state.selectedForm26AS;
      })
      .addCase(saveForm26AS.rejected, (state, action) => {
        state.saveLoading = false;
        state.error = action.payload?.message;
      });
    /* ---------- UPLOAD Form 26AS FILE ---------- */
    builder
      .addCase(uploadForm26ASFile.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadForm26ASFile.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.uploadResponse = action.payload ?? null;
      })
      .addCase(uploadForm26ASFile.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload?.message;
      });
    /* ---------- DOWNLOAD Form 26AS FILE ---------- */
    builder
      .addCase(downloadForm26ASFile.pending, (state) => {
        state.downloadLoading = true;
        state.error = null;
      })
      .addCase(downloadForm26ASFile.fulfilled, (state, action) => {
        state.downloadLoading = false;
        state.downloadedFile = action.payload;
      })
      .addCase(downloadForm26ASFile.rejected, (state, action) => {
        state.downloadLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const {
  clearForm26ASState,
  clearProcessedForm26AS,
  clearSelectedForm26AS,
} = form26asSlice.actions;

export default form26asSlice.reducer;
