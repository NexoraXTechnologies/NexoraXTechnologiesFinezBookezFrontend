import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

/* ---------------------------------------------------
    GET ALL TASKS
--------------------------------------------------- */
export const getAllTasks = createAsyncThunk('professionalTaskMgt/getAllTasks', async ({ page = 1, limit = 10, search = '', taskAssignedToMobile } = {}, { rejectWithValue }) => {
  try {
    const params = { page, limit };

    if (taskAssignedToMobile) params.taskAssignedToMobile = taskAssignedToMobile;

    if (search.trim()) {
      if (/^\d+$/.test(search.trim())) params.taskAssignedToMobile = search.trim();
      else params.search = search.trim();
    }

    const res = await professionalAxios.get('/eTaxSolnMongoApiBackend/taskAssign/getAll', { params });

    if (!res.data?.success) {
      return rejectWithValue({ message: res.data?.message || 'Failed to fetch tasks' });
    }

    // ✅ normalize backend response → frontend-friendly shape
    const apiData = res.data?.data || {};
    const pagination = apiData.pagination || {};

    return {
      tasks: apiData.tasks ?? [],
      page: pagination.currentPage ?? 1,
      limit: pagination.limit ?? limit,
      totalCount: pagination.totalDocs ?? 0,
      totalPages: pagination.totalPages ?? 1,
      filteredBy: 'All', // or build from apiData.filters if you want
      filters: apiData.filters ?? {},
      message: res.data?.message,
    };
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to fetch tasks',
    });
  }
});

/* ---------------------------------------------------
    CREATE TASK
--------------------------------------------------- */
export const createTask = createAsyncThunk(
  "professionalTaskMgt/createTask",
  async (payload, { rejectWithValue }) => {  
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/taskAssign/create",
        payload
      );
      if (!res.data?.success)
        return rejectWithValue({ message: res.data?.message || "Failed to create task" });

      // backend returns created task ONLY inside data
      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to create task",
      });
    }
  }
);

/* ---------------------------------------------------
    UPDATE TASK
--------------------------------------------------- */
export const updateTask = createAsyncThunk(
  "professionalTaskMgt/updateTask",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/taskAssign/${taskId}`,
        data
      );

      if (!res.data?.success)
        return rejectWithValue({ message: res.data?.message || "Failed to update task" });

      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to update task",
      });
    }
  }
);

/* ---------------------------------------------------
    SOFT DELETE TASK
--------------------------------------------------- */
export const softDeleteTask = createAsyncThunk(
  "professionalTaskMgt/softDeleteTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/taskAssign/softDelete/${taskId}`
      );

      if (!res.data?.success)
        return rejectWithValue({ message: res.data?.message || "Failed to delete task" });

      return taskId;
    } catch (err) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to delete task",
      });
    }
  }
);

/* ---------------------------------------------------
    SLICE
--------------------------------------------------- */
const professionalTaskManagementSlice = createSlice({
  name: "professionalTaskMgt",
  initialState: {
    tasks: [],
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    filteredBy: "All",

    loading: false,
    error: null,

    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
  },

  reducers: {
    clearProfessionalTaskState: (state) => {
      state.error = null;
      state.createLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;
    },
  },

  extraReducers: (builder) => {
    /* ---------- GET ALL ---------- */
    builder
      .addCase(getAllTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTasks.fulfilled, (state, action) => {
        state.loading = false;

        const { tasks, page, limit, totalCount, totalPages, filteredBy } = action.payload;

        state.tasks = tasks ?? [];
        state.page = page ?? 1;
        state.limit = limit ?? 10;
        state.totalCount = totalCount ?? 0;
        state.totalPages = totalPages ?? 1;
        state.filteredBy = filteredBy ?? "All";
      })
      .addCase(getAllTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.tasks=[];
      });

    /* ---------- CREATE ---------- */
    builder
      .addCase(createTask.pending, (state) => {
        state.createLoading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.createLoading = false;

        // ❗ Only add if valid task returned
        if (action.payload && action.payload.taskId) {
          state.tasks.unshift(action.payload);
          state.totalCount += 1;
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- UPDATE ---------- */
    builder
      .addCase(updateTask.pending, (state) => {
        state.updateLoading = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.updateLoading = false;

        const updated = action.payload;
        if (!updated?.taskId) return;

        state.tasks = state.tasks.map((t) =>
          t.taskId === updated.taskId ? { ...t, ...updated } : t
        );
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- DELETE ---------- */
    builder
      .addCase(softDeleteTask.pending, (state) => {
        state.deleteLoading = true;
      })
      .addCase(softDeleteTask.fulfilled, (state, action) => {
        state.deleteLoading = false;

        const removedId = action.payload;
        state.tasks = state.tasks.filter((t) => t.taskId !== removedId);
        state.totalCount = Math.max(0, state.totalCount - 1);
      })
      .addCase(softDeleteTask.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearProfessionalTaskState } = professionalTaskManagementSlice.actions;
export default professionalTaskManagementSlice.reducer;