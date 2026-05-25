import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

// =======================================================
// GET ALL DOCUMENTS WITH PAGINATION + FILTER
// =======================================================
export const getAllDocuments = createAsyncThunk(
  "professionalDocumentMgt/getAllDocuments",
  async (
    { page = 1, limit = 10, search = "", searchType = "name", tag = "", uploadDate = "" },
    { rejectWithValue }
  ) => {
    try {
      const query = new URLSearchParams();

      const offset = (page - 1) * limit;

      query.append("offset", offset);
      query.append("limit", limit);

      if (search) {
        if (searchType === "ownerId") {
          query.append("ownerId", search);
        } else {
          query.append("name", search);
        }
      }

      if (tag) query.append("tag", tag);
      if (uploadDate) query.append("uploadDate", uploadDate);

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/documents?${query.toString()}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch documents",
        });
      }

      return {
        documents: res.data.data.data,
        pagination: {
          offset: res.data.data.offset,
          limit: res.data.data.limit,
          totalPages: res.data.data.totalPages,
          currentPage: res.data.data.currentPage,
        },
        summary: res.data.data.summary,
      };
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to fetch documents",
      });
    }
  }
);

// =======================================================
// UPLOAD DOCUMENT
// =======================================================
export const uploadDocument = createAsyncThunk(
  "professionalDocumentMgt/uploadDocument",
  async (formData, { rejectWithValue }) => {
    try {
      
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/documents`,
        formData,{headers: { 'Content-Type': 'multipart/form-data' }}
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to upload document",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to upload document",
      });
    }
  }
);

// =======================================================
// DOWNLOAD DOCUMENT
// =======================================================
export const downloadDocument = createAsyncThunk(
  "professionalDocumentMgt/downloadDocument",
  async (name, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/documents/download?name=${name}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return { name };
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to download document",
      });
    }
  }
);

// =======================================================
// DELETE DOCUMENT
// =======================================================
export const deleteDocument = createAsyncThunk(
  "professionalDocumentMgt/deleteDocument",
  async (docId, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/documents/${docId}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to delete document",
        });
      }

      return docId;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to delete document",
      });
    }
  }
);

// =======================================================
// SLICE
// =======================================================
const professionalDocumentMgtSlice = createSlice({
  name: "professionalDocumentMgt",
  initialState: {
    documents: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      limit: 10,
    },
    summary: null,
    loading: false,
    error: null,
    uploadSuccess: false,
    deleteSuccess: false,
  },
  reducers: {
    clearProfessionalDocumentState: (state) => {
      state.loading = false;
      state.error = null;
      state.uploadSuccess = false;
      state.deleteSuccess = false;
    },
  },

  extraReducers: (builder) => {
    // GET DOCUMENTS
    builder
      .addCase(getAllDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.documents;
        state.pagination = action.payload.pagination;
        state.summary = action.payload.summary;
      })
      .addCase(getAllDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // UPLOAD
    builder
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.uploadSuccess = false;
      })
      .addCase(uploadDocument.fulfilled, (state) => {
        state.loading = false;
        state.uploadSuccess = true;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // DELETE
    builder
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.deleteSuccess = false;
      })
      .addCase(deleteDocument.fulfilled, (state) => {
        state.loading = false;
        state.deleteSuccess = true;
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearProfessionalDocumentState } =
  professionalDocumentMgtSlice.actions;

export default professionalDocumentMgtSlice.reducer;