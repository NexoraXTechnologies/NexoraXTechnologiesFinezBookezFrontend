import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import professionalAxios from '../../../../services/professionalAxios';

/**
 * LIST
 * Expecting your response:
 * { success, message, data: { offset, limit, totalDocs, totalPages, hasNextPage, hasPrevPage, data: [] } }
 */
export const fetchForm16List = createAsyncThunk('form16/fetchForm16List', async ({ offset = 0, limit = 10, search = '' } = {}, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/uploadfiles/list`, {
      params: {
        fileType: 'form16',
        offset,
        limit,
        search, // if backend supports; otherwise harmless
      },
    });
    return res.data;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to fetch Form16 list',
    });
  }
});

export const uploadForm16File = createAsyncThunk('form16/uploadForm16File', async ({ name, uploadDate, file, fileType = 'form16', pan, assessmentYear }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('uploadDate', uploadDate);
    formData.append('file', file);
    formData.append('fileType', fileType); // form16

    // optional meta (only if backend accepts)
    if (pan) formData.append('pan', pan);
    if (assessmentYear) formData.append('assessmentYear', assessmentYear);

    const res = await professionalAxios.post(`/eTaxSolnMongoApiBackend/users/uploadfiles/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

    return res.data;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || err?.response?.data?.error || 'Failed to upload Form16',
    });
  }
});

/**
 * DOWNLOAD by filename (same as your 26AS / document mgmt style)
 */
export const downloadForm16File = createAsyncThunk('form16/downloadForm16File', async ({ filename }, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/uploadfiles/download/${filename}`, { responseType: 'blob' });
    return { blob: res.data, filename };
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to download Form16 file',
    });
  }
});

/**
 * DELETE by id (assuming you have something like /users/uploadfiles/:id)
 * If your delete route is different, change URL only.
 */
export const deleteForm16File = createAsyncThunk('form16/deleteForm16File', async ({ id, fileType = 'form16' }, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.delete(
      `/eTaxSolnMongoApiBackend/users/uploadfiles/delete/${id}`,
      { params: { fileType } }, // => ?fileType=form16
    );
    return res.data;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to delete Form16 file',
    });
  }
});

const form16Slice = createSlice({
  name: 'form16',
  initialState: {
    listLoading: false,
    uploadLoading: false,
    downloadLoading: false,
    deleteLoading: false,

    items: [],
    pagination: {
      offset: 0,
      limit: 10,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    downloadedFile: null,
    error: null,
  },
  reducers: {
    clearForm16Error: (state) => {
      state.error = null;
    },
    clearDownloadedForm16: (state) => {
      state.downloadedFile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LIST
      .addCase(fetchForm16List.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchForm16List.fulfilled, (state, action) => {
        state.listLoading = false;
        const d = action.payload?.data;
        state.items = d?.data ?? [];
        state.pagination = {
          offset: d?.offset ?? 0,
          limit: d?.limit ?? 10,
          totalDocs: d?.totalDocs ?? 0,
          totalPages: d?.totalPages ?? 0,
          hasNextPage: d?.hasNextPage ?? false,
          hasPrevPage: d?.hasPrevPage ?? false,
        };
      })
      .addCase(fetchForm16List.rejected, (state, action) => {
        state.listLoading = false;
        state.items = [];
        state.error = action.payload?.message;
      })

      // UPLOAD
      .addCase(uploadForm16File.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadForm16File.fulfilled, (state) => {
        state.uploadLoading = false;
      })
      .addCase(uploadForm16File.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload?.message;
      })

      // DOWNLOAD
      .addCase(downloadForm16File.pending, (state) => {
        state.downloadLoading = true;
        state.error = null;
      })
      .addCase(downloadForm16File.fulfilled, (state, action) => {
        state.downloadLoading = false;
        state.downloadedFile = action.payload;
      })
      .addCase(downloadForm16File.rejected, (state, action) => {
        state.downloadLoading = false;
        state.error = action.payload?.message;
      })

      // DELETE
      .addCase(deleteForm16File.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteForm16File.fulfilled, (state) => {
        state.deleteLoading = false;
      })
      .addCase(deleteForm16File.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearForm16Error, clearDownloadedForm16 } = form16Slice.actions;
export default form16Slice.reducer;
