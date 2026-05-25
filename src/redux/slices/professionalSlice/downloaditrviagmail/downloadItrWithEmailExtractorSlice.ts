import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import professionalAxios from '../../../../services/professionalAxios';

// =======================================================
// EXTRACT ATTACHMENTS
// POST
// /eTaxSolnMongoApiBackend/users/gmailExtract/extractAttachments?subject=&messageBody=&financialYear=&type=
// =======================================================
export const extractGmailAttachments = createAsyncThunk('downloadItrWithEmailExtractor/extractGmailAttachments', async ({ subject = '', messageBody = '', financialYear = '', type = '', payload }, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();

    if (subject) query.append('subject', subject);
    if (messageBody) query.append('messageBody', messageBody);
    if (financialYear) query.append('financialYear', financialYear);
    if (type) query.append('type', type);

    const res = await professionalAxios.post(`/eTaxSolnMongoApiBackend/users/gmailExtract/extractAttachments?${query.toString()}`, payload);

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to extract attachments',
      });
    }

    return {
      mode: res.data?.data?.mode ?? 'extract',
      total: res.data?.data?.total ?? 0,
      results: res.data?.data?.results ?? [],
      pagination: res.data?.data?.pagination ?? {},
      message: res.data?.message ?? 'Attachments extracted successfully',
    };
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || err.message || 'Failed to extract attachments',
    });
  }
});

// =======================================================
// DOWNLOAD ATTACHMENT
// GET
// /eTaxSolnMongoApiBackend/users/gmailExtract/downloadAttachment/:id
// =======================================================
export const downloadGmailAttachment = createAsyncThunk('downloadItrWithEmailExtractor/downloadGmailAttachment', async (attachmentId, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/gmailExtract/downloadAttachment/${attachmentId}`, {
      responseType: 'blob',
    });

    const contentDisposition = res.headers['content-disposition'];
    let fileName = 'downloaded-attachment.pdf';

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) {
        fileName = match[1];
      }
    }

    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);

    return {
      success: true,
      fileName,
    };
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || err?.message || 'Failed to download attachment',
    });
  }
});

// =======================================================
// CHECK GMAIL CONNECTION
// POST
// /eTaxSolnMongoApiBackend/users/gmailExtract/checkConnection
// =======================================================
export const checkGmailConnection = createAsyncThunk('downloadItrWithEmailExtractor/checkGmailConnection', async (payload, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post(`/eTaxSolnMongoApiBackend/users/gmailExtract/checkConnection`, payload);

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to check Gmail connection',
      });
    }

    return {
      connected: res.data?.data?.connected ?? false,
      message: res.data?.message ?? null,
    };
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || err.message || 'Failed to check Gmail connection',
    });
  }
});

// =======================================================
// CONNECT TO GOOGLE
// POST
// /eTaxSolnMongoApiBackend/users/gmailExtract/connectToGoogle
// =======================================================
export const connectToGoogleGmail = createAsyncThunk('downloadItrWithEmailExtractor/connectToGoogleGmail', async (payload, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.post(`/eTaxSolnMongoApiBackend/users/gmailExtract/connectToGoogle`, payload);

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to connect Gmail',
      });
    }

    return {
      connected: res.data?.data?.connected ?? false,
      url: res.data?.data?.url ?? '',
      message: res.data?.message ?? null,
    };
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || err.message || 'Failed to connect Gmail',
    });
  }
});

// =======================================================
// SLICE
// =======================================================
const downloadItrWithEmailExtractorSlice = createSlice({
  name: 'downloadItrWithEmailExtractor',
  initialState: {
    attachments: [],
    extractedData: null,
    pagination: {
      offset: 0,
      limit: 10,
      totalDocs: 0,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    gmailConnection: {
      connected: false,
      url: '',
    },
    downloadedFile: null,
    loading: false,
    error: null,
    extractSuccess: false,
    downloadSuccess: false,
    connectionCheckSuccess: false,
    connectSuccess: false,
  },
  reducers: {
    clearDownloadItrWithEmailExtractorState: (state) => {
      state.loading = false;
      state.error = null;
      state.extractSuccess = false;
      state.downloadSuccess = false;
      state.connectionCheckSuccess = false;
      state.connectSuccess = false;
    },
    clearExtractedAttachments: (state) => {
      state.attachments = [];
      state.extractedData = null;
      state.pagination = {
        offset: 0,
        limit: 10,
        totalDocs: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
    },
    clearDownloadedFile: (state) => {
      state.downloadedFile = null;
      state.downloadSuccess = false;
    },
    clearGoogleConnectionData: (state) => {
      state.gmailConnection = {
        connected: false,
        url: '',
      };
      state.connectionCheckSuccess = false;
      state.connectSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // EXTRACT ATTACHMENTS
    builder
      .addCase(extractGmailAttachments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.extractSuccess = false;
      })
      .addCase(extractGmailAttachments.fulfilled, (state, action) => {
        state.loading = false;
        state.extractSuccess = true;
        state.attachments = action.payload.results || [];
        state.extractedData = action.payload;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(extractGmailAttachments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to extract attachments';
      });

    // DOWNLOAD ATTACHMENT
    builder
      .addCase(downloadGmailAttachment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.downloadSuccess = false;
      })
      .addCase(downloadGmailAttachment.fulfilled, (state, action) => {
        state.loading = false;
        state.downloadSuccess = true;
        state.downloadedFile = action.payload;
      })
      .addCase(downloadGmailAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to download attachment';
      });

    // CHECK CONNECTION
    builder
      .addCase(checkGmailConnection.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.connectionCheckSuccess = false;
      })
      .addCase(checkGmailConnection.fulfilled, (state, action) => {
        state.loading = false;
        state.connectionCheckSuccess = true;
        state.gmailConnection.connected = action.payload.connected;
      })
      .addCase(checkGmailConnection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to check Gmail connection';
      });

    // CONNECT TO GOOGLE
    builder
      .addCase(connectToGoogleGmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.connectSuccess = false;
      })
      .addCase(connectToGoogleGmail.fulfilled, (state, action) => {
        state.loading = false;
        state.connectSuccess = true;
        state.gmailConnection.connected = action.payload.connected;
        state.gmailConnection.url = action.payload.url;
      })
      .addCase(connectToGoogleGmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to connect Gmail';
      });
  },
});

export const { clearDownloadItrWithEmailExtractorState, clearExtractedAttachments, clearDownloadedFile, clearGoogleConnectionData } = downloadItrWithEmailExtractorSlice.actions;

export default downloadItrWithEmailExtractorSlice.reducer;
