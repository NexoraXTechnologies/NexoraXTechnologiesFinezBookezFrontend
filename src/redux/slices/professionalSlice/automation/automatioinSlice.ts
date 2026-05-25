import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import professionalAxios from '../../../../services/professionalAxios';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ===================================================
    PREPARE AUTOMATION PACKAGE (WEB)
    POST: /eTaxSolnMongoApiBackend/users/web/automation/prepare
=================================================== */
export const prepareAutomation = createAsyncThunk(
  'automation/prepareAutomation',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        '/eTaxSolnMongoApiBackend/users/web/automation/prepare',
        payload
      );

      if (!res.data?.success) {
        return rejectWithValue({
          code: res.data?.code || 'AUTOMATION_PREPARE_FAILED',
          message: res.data?.message || 'Automation package prepare failed',
          error: res.data?.error || null,
        });
      }

      return {
        message: res.data?.message || 'Automation package prepared.',
        data: res.data?.data || null,
      };
    } catch (err) {
      return rejectWithValue({
        code: err?.response?.data?.code || 'AUTOMATION_PREPARE_API_ERROR',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Automation package prepare failed',
        error: err?.response?.data?.error || null,
      });
    }
  }
);

/* ===================================================
    DOWNLOAD AUTOMATION PACKAGE (WEB)
    GET: /eTaxSolnMongoApiBackend/users/web/automation/download
=================================================== */
export const downloadAutomation = createAsyncThunk(
  'automation/downloadAutomation',
  async ({ fileName }, { rejectWithValue }) => {
    try {
      if (!fileName) {
        return rejectWithValue({
          code: 'AUTOMATION_DOWNLOAD_VALIDATION',
          message: 'fileName is required to download automation package',
          error: null,
        });
      }

      const res = await professionalAxios.get(
        '/eTaxSolnMongoApiBackend/users/web/automation/download',
        {
          params: { file: fileName },
          responseType: 'blob',
        }
      );

      const contentType = res?.headers?.['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text?.();
        let json = null;
        try {
          json = JSON.parse(text || '{}');
        } catch (_) {}

        return rejectWithValue({
          code: json?.code || 'AUTOMATION_DOWNLOAD_FAILED',
          message: json?.message || 'Automation download failed',
          error: json?.error || json || null,
        });
      }

      return {
        message: 'Download ready',
        data: { fileName, blob: res.data },
      };
    } catch (err) {
      return rejectWithValue({
        code: err?.response?.data?.code || 'AUTOMATION_DOWNLOAD_API_ERROR',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Automation download failed',
        error: err?.response?.data?.error || null,
      });
    }
  }
);

/* ===================================================
    RUN AUTOMATION (LOCAL)
    POST: /eTaxSolnMongoApiBackend/users/jobQueueAutomation/save
=================================================== */
export const runAutomationAis = createAsyncThunk(
  'automation/runAutomationAis',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        '/eTaxSolnMongoApiBackend/users/jobQueueAutomation/save',
        payload
      );
      if (!res.data?.success) {
        return rejectWithValue({
          code: res.data?.code || 'AUTOMATION_RUN_FAILED',
          message: res.data?.message || 'Automation run failed',
          error: res.data?.error || null,
        });
      }

      return {
        message: res.data?.message || 'Automation run successful.',
        data: res.data?.data || null,
      };
    } catch (err) {
      return rejectWithValue({
        code: err?.response?.data?.code || 'AUTOMATION_RUN_API_ERROR',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Automation run failed',
        error: err?.response?.data?.error || null,
      });
    }
  }
);

/* ===================================================
    JOB QUEUE AUTOMATION - GET ALL
    GET: /eTaxSolnMongoApiBackend/users/jobQueueAutomation/getAll
=================================================== */
export const getAllJobQueueAutomation = createAsyncThunk(
  'automation/getAllJobQueueAutomation',
  async (
    {
      offset = 0,
      limit = 10,
      jobType = '',
      jobId = '',
      createdBy = '',
      targetAgentId = '',
      status = '',
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.get(
        '/eTaxSolnMongoApiBackend/users/jobQueueAutomation/getAll',
        {
          params: {
            offset,
            limit,
            jobType,
            jobId,
            createdBy,
            targetAgentId,
            status,
          },
        }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          code: res.data?.code || 'JOBQUEUE_GETALL_FAILED',
          message: res.data?.message || 'Failed to fetch job queue list',
          error: res.data?.error || null,
        });
      }

      return {
        message: res.data?.message || 'Job queue list fetched.',
        data: res.data?.data || null,
      };
    } catch (err) {
      return rejectWithValue({
        code: err?.response?.data?.code || 'JOBQUEUE_GETALL_API_ERROR',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to fetch job queue list',
        error: err?.response?.data?.error || null,
      });
    }
  }
);

/* ===================================================
    JOB QUEUE AUTOMATION - GET BY COMMON ID
    GET: /eTaxSolnMongoApiBackend/users/jobQueueAutomation/getByCommonId/:commonId
=================================================== */
export const getJobQueueAutomationByCommonId = createAsyncThunk(
  'automation/getJobQueueAutomationByCommonId',
  async ({ commonId }, { rejectWithValue }) => {
    try {
      if (!commonId) {
        return rejectWithValue({
          code: 'JOBQUEUE_GETBYID_VALIDATION',
          message: 'commonId is required',
          error: null,
        });
      }

      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/jobQueueAutomation/getByCommonId/${commonId}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          code: res.data?.code || 'JOBQUEUE_GETBYID_FAILED',
          message: res.data?.message || 'Failed to fetch job details',
          error: res.data?.error || null,
        });
      }

      return {
        message: res.data?.message || 'Job details fetched.',
        data: res.data?.data || null,
      };
    } catch (err) {
      return rejectWithValue({
        code: err?.response?.data?.code || 'JOBQUEUE_GETBYID_API_ERROR',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to fetch job details',
        error: err?.response?.data?.error || null,
      });
    }
  }
);

/* ===================================================
    JOB QUEUE AUTOMATION - PULL
    POST: /eTaxSolnMongoApiBackend/users/jobQueueAutomation/pull
    Body: { status, targetAgentId }
=================================================== */
export const pullJobQueueAutomation = createAsyncThunk(
  'automation/pullJobQueueAutomation',
  async (payload = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        '/eTaxSolnMongoApiBackend/users/jobQueueAutomation/pull',
        payload
      );

      if (!res.data?.success) {
        return rejectWithValue({
          code: res.data?.code || 'JOBQUEUE_PULL_FAILED',
          message: res.data?.message || 'Failed to pull job queue',
          error: res.data?.error || null,
        });
      }

      return {
        message: res.data?.message || 'Job pulled successfully.',
        data: res.data?.data || null,
      };
    } catch (err) {
      return rejectWithValue({
        code: err?.response?.data?.code || 'JOBQUEUE_PULL_API_ERROR',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to pull job queue',
        error: err?.response?.data?.error || null,
      });
    }
  }
);

/* ===================================================
    JOB QUEUE AUTOMATION - UPDATE BY COMMON ID
    PUT: /eTaxSolnMongoApiBackend/users/jobQueueAutomation/updateByCommonId/:commonId
=================================================== */
export const updateJobQueueAutomationByCommonId = createAsyncThunk(
  'automation/updateJobQueueAutomationByCommonId',
  async ({ commonId, payload = {} }, { rejectWithValue }) => {
    try {
      if (!commonId) {
        return rejectWithValue({
          code: 'JOBQUEUE_UPDATE_VALIDATION',
          message: 'commonId is required',
          error: null,
        });
      }

      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/users/jobQueueAutomation/updateByCommonId/${commonId}`,
        payload
      );

      if (!res.data?.success) {
        return rejectWithValue({
          code: res.data?.code || 'JOBQUEUE_UPDATE_FAILED',
          message: res.data?.message || 'Failed to update job',
          error: res.data?.error || null,
        });
      }

      return {
        message: res.data?.message || 'Job updated.',
        data: res.data?.data || null,
      };
    } catch (err) {
      return rejectWithValue({
        code: err?.response?.data?.code || 'JOBQUEUE_UPDATE_API_ERROR',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to update job',
        error: err?.response?.data?.error || null,
      });
    }
  }
);

/* ===================================================
    JOB QUEUE AUTOMATION - DELETE BY COMMON ID
    DELETE: /eTaxSolnMongoApiBackend/users/jobQueueAutomation/deleteByCommonId/:commonId
=================================================== */
export const deleteJobQueueAutomationByCommonId = createAsyncThunk(
  'automation/deleteJobQueueAutomationByCommonId',
  async ({ commonId }, { rejectWithValue }) => {
    try {
      if (!commonId) {
        return rejectWithValue({
          code: 'JOBQUEUE_DELETE_VALIDATION',
          message: 'commonId is required',
          error: null,
        });
      }

      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/users/jobQueueAutomation/deleteByCommonId/${commonId}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          code: res.data?.code || 'JOBQUEUE_DELETE_FAILED',
          message: res.data?.message || 'Failed to delete job',
          error: res.data?.error || null,
        });
      }

      return {
        message: res.data?.message || 'Job deleted.',
        data: res.data?.data || null,
      };
    } catch (err) {
      return rejectWithValue({
        code: err?.response?.data?.code || 'JOBQUEUE_DELETE_API_ERROR',
        message:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to delete job',
        error: err?.response?.data?.error || null,
      });
    }
  }
);

/* ===================================================
    SLICE
=================================================== */
const automationSlice = createSlice({
  name: 'automation',
  initialState: {
    message: '',
    error: null,

    prepare: {
      status: 'idle',
      loading: false,
      message: '',
      error: null,
      data: null,
    },

    download: {
      status: 'idle',
      loading: false,
      message: '',
      error: null,
      fileName: '',
      blob: null,
    },

    run: {
      status: 'idle',
      loading: false,
      message: '',
      error: null,
      data: null,
    },

    // NEW: Job Queue automation states
    jobQueue: {
      list: {
        status: 'idle',
        loading: false,
        message: '',
        error: null,
        data: null, // expect list + pagination from API
      },
      detail: {
        status: 'idle',
        loading: false,
        message: '',
        error: null,
        data: null,
      },
      pull: {
        status: 'idle',
        loading: false,
        message: '',
        error: null,
        data: null,
      },
      update: {
        status: 'idle',
        loading: false,
        message: '',
        error: null,
        data: null,
      },
      delete: {
        status: 'idle',
        loading: false,
        message: '',
        error: null,
        data: null,
      },
    },
  },

  reducers: {
    clearAutomationState: (state) => {
      state.message = '';
      state.error = null;

      state.prepare = {
        status: 'idle',
        loading: false,
        message: '',
        error: null,
        data: null,
      };

      state.download = {
        status: 'idle',
        loading: false,
        message: '',
        error: null,
        fileName: '',
        blob: null,
      };

      state.run = {
        status: 'idle',
        loading: false,
        message: '',
        error: null,
        data: null,
      };

      state.jobQueue = {
        list: { status: 'idle', loading: false, message: '', error: null, data: null },
        detail: { status: 'idle', loading: false, message: '', error: null, data: null },
        pull: { status: 'idle', loading: false, message: '', error: null, data: null },
        update: { status: 'idle', loading: false, message: '', error: null, data: null },
        delete: { status: 'idle', loading: false, message: '', error: null, data: null },
      };
    },

    clearPrepareState: (state) => {
      state.prepare.status = 'idle';
      state.prepare.loading = false;
      state.prepare.message = '';
      state.prepare.error = null;
      state.prepare.data = null;
    },

    clearDownloadState: (state) => {
      state.download.status = 'idle';
      state.download.loading = false;
      state.download.message = '';
      state.download.error = null;
      state.download.fileName = '';
      state.download.blob = null;
    },

    clearRunState: (state) => {
      state.run.status = 'idle';
      state.run.loading = false;
      state.run.message = '';
      state.run.error = null;
      state.run.data = null;
    },

    // NEW: clears
    clearJobQueueListState: (state) => {
      state.jobQueue.list = { status: 'idle', loading: false, message: '', error: null, data: null };
    },
    clearJobQueueDetailState: (state) => {
      state.jobQueue.detail = { status: 'idle', loading: false, message: '', error: null, data: null };
    },
    clearJobQueuePullState: (state) => {
      state.jobQueue.pull = { status: 'idle', loading: false, message: '', error: null, data: null };
    },
    clearJobQueueUpdateState: (state) => {
      state.jobQueue.update = { status: 'idle', loading: false, message: '', error: null, data: null };
    },
    clearJobQueueDeleteState: (state) => {
      state.jobQueue.delete = { status: 'idle', loading: false, message: '', error: null, data: null };
    },
  },

  extraReducers: (builder) => {
    builder
      /* ---------- PREPARE ---------- */
      .addCase(prepareAutomation.pending, (state) => {
        state.prepare.status = 'running';
        state.prepare.loading = true;
        state.prepare.message = 'Preparing automation package…';
        state.prepare.error = null;
        state.prepare.data = null;
      })
      .addCase(prepareAutomation.fulfilled, (state, action) => {
        state.prepare.status = 'success';
        state.prepare.loading = false;
        state.prepare.message = action.payload?.message;
        state.prepare.data = action.payload?.data;
      })
      .addCase(prepareAutomation.rejected, (state, action) => {
        state.prepare.status = 'error';
        state.prepare.loading = false;
        state.prepare.error = action.payload;
        state.prepare.message = action.payload?.message;
        state.prepare.data = null;
      })

      /* ---------- DOWNLOAD ---------- */
      .addCase(downloadAutomation.pending, (state) => {
        state.download.status = 'running';
        state.download.loading = true;
        state.download.message = 'Downloading automation package…';
        state.download.error = null;
        state.download.blob = null;
      })
      .addCase(downloadAutomation.fulfilled, (state, action) => {
        state.download.status = 'success';
        state.download.loading = false;
        state.download.message = action.payload?.message;
        state.download.fileName = action.payload?.data?.fileName;
        state.download.blob = action.payload?.data?.blob;
      })
      .addCase(downloadAutomation.rejected, (state, action) => {
        state.download.status = 'error';
        state.download.loading = false;
        state.download.error = action.payload;
        state.download.message = action.payload?.message;
        state.download.blob = null;
      })

      /* ---------- RUN ---------- */
      .addCase(runAutomationAis.pending, (state) => {
        state.run.status = 'running';
        state.run.loading = true;
        state.run.message = 'Running automation…';
        state.run.error = null;
        state.run.data = null;
      })
      .addCase(runAutomationAis.fulfilled, (state, action) => {
        state.run.status = 'success';
        state.run.loading = false;
        state.run.message = action.payload?.message;
        state.run.data = action.payload?.data;
      })
      .addCase(runAutomationAis.rejected, (state, action) => {
        state.run.status = 'error';
        state.run.loading = false;
        state.run.error = action.payload;
        state.run.message = action.payload?.message;
        state.run.data = null;
      })

      /* ---------- JOB QUEUE: GET ALL ---------- */
      .addCase(getAllJobQueueAutomation.pending, (state) => {
        state.jobQueue.list.status = 'running';
        state.jobQueue.list.loading = true;
        state.jobQueue.list.message = 'Fetching jobs…';
        state.jobQueue.list.error = null;
        state.jobQueue.list.data = null;
      })
      .addCase(getAllJobQueueAutomation.fulfilled, (state, action) => {
        state.jobQueue.list.status = 'success';
        state.jobQueue.list.loading = false;
        state.jobQueue.list.message = action.payload?.message;
        state.jobQueue.list.data = action.payload?.data;
      })
      .addCase(getAllJobQueueAutomation.rejected, (state, action) => {
        state.jobQueue.list.status = 'error';
        state.jobQueue.list.loading = false;
        state.jobQueue.list.error = action.payload;
        state.jobQueue.list.message = action.payload?.message;
        state.jobQueue.list.data = null;
      })

      /* ---------- JOB QUEUE: GET BY ID ---------- */
      .addCase(getJobQueueAutomationByCommonId.pending, (state) => {
        state.jobQueue.detail.status = 'running';
        state.jobQueue.detail.loading = true;
        state.jobQueue.detail.message = 'Fetching job details…';
        state.jobQueue.detail.error = null;
        state.jobQueue.detail.data = null;
      })
      .addCase(getJobQueueAutomationByCommonId.fulfilled, (state, action) => {
        state.jobQueue.detail.status = 'success';
        state.jobQueue.detail.loading = false;
        state.jobQueue.detail.message = action.payload?.message;
        state.jobQueue.detail.data = action.payload?.data;
      })
      .addCase(getJobQueueAutomationByCommonId.rejected, (state, action) => {
        state.jobQueue.detail.status = 'error';
        state.jobQueue.detail.loading = false;
        state.jobQueue.detail.error = action.payload;
        state.jobQueue.detail.message = action.payload?.message;
        state.jobQueue.detail.data = null;
      })

      /* ---------- JOB QUEUE: PULL ---------- */
      .addCase(pullJobQueueAutomation.pending, (state) => {
        state.jobQueue.pull.status = 'running';
        state.jobQueue.pull.loading = true;
        state.jobQueue.pull.message = 'Pulling job…';
        state.jobQueue.pull.error = null;
        state.jobQueue.pull.data = null;
      })
      .addCase(pullJobQueueAutomation.fulfilled, (state, action) => {
        state.jobQueue.pull.status = 'success';
        state.jobQueue.pull.loading = false;
        state.jobQueue.pull.message = action.payload?.message;
        state.jobQueue.pull.data = action.payload?.data;
      })
      .addCase(pullJobQueueAutomation.rejected, (state, action) => {
        state.jobQueue.pull.status = 'error';
        state.jobQueue.pull.loading = false;
        state.jobQueue.pull.error = action.payload;
        state.jobQueue.pull.message = action.payload?.message;
        state.jobQueue.pull.data = null;
      })

      /* ---------- JOB QUEUE: UPDATE ---------- */
      .addCase(updateJobQueueAutomationByCommonId.pending, (state) => {
        state.jobQueue.update.status = 'running';
        state.jobQueue.update.loading = true;
        state.jobQueue.update.message = 'Updating job…';
        state.jobQueue.update.error = null;
        state.jobQueue.update.data = null;
      })
      .addCase(updateJobQueueAutomationByCommonId.fulfilled, (state, action) => {
        state.jobQueue.update.status = 'success';
        state.jobQueue.update.loading = false;
        state.jobQueue.update.message = action.payload?.message;
        state.jobQueue.update.data = action.payload?.data;
      })
      .addCase(updateJobQueueAutomationByCommonId.rejected, (state, action) => {
        state.jobQueue.update.status = 'error';
        state.jobQueue.update.loading = false;
        state.jobQueue.update.error = action.payload;
        state.jobQueue.update.message = action.payload?.message;
        state.jobQueue.update.data = null;
      })

      /* ---------- JOB QUEUE: DELETE ---------- */
      .addCase(deleteJobQueueAutomationByCommonId.pending, (state) => {
        state.jobQueue.delete.status = 'running';
        state.jobQueue.delete.loading = true;
        state.jobQueue.delete.message = 'Deleting job…';
        state.jobQueue.delete.error = null;
        state.jobQueue.delete.data = null;
      })
      .addCase(deleteJobQueueAutomationByCommonId.fulfilled, (state, action) => {
        state.jobQueue.delete.status = 'success';
        state.jobQueue.delete.loading = false;
        state.jobQueue.delete.message = action.payload?.message;
        state.jobQueue.delete.data = action.payload?.data;
      })
      .addCase(deleteJobQueueAutomationByCommonId.rejected, (state, action) => {
        state.jobQueue.delete.status = 'error';
        state.jobQueue.delete.loading = false;
        state.jobQueue.delete.error = action.payload;
        state.jobQueue.delete.message = action.payload?.message;
        state.jobQueue.delete.data = null;
      });
  },
});

export const {
  clearAutomationState,
  clearPrepareState,
  clearDownloadState,
  clearRunState,

  // NEW exports
  clearJobQueueListState,
  clearJobQueueDetailState,
  clearJobQueuePullState,
  clearJobQueueUpdateState,
  clearJobQueueDeleteState,
} = automationSlice.actions;

export default automationSlice.reducer;