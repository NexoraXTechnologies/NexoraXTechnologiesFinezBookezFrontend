import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import professionalAxios from '../../../../services/professionalAxios';

// =======================================================
// GET ALL LAW SECTIONS (PAGINATION + FILTER)
// =======================================================
export const getAllProfessionalIncomeTaxLaw = createAsyncThunk('professionalIncomeTaxLaw/getAllProfessionalIncomeTaxLaw', async ({ page = 1, limit = 10, search = '', status = 'Active' }, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams();

    const offset = (page - 1) * limit;

    query.append('offset', offset);
    query.append('limit', limit);

    // API supports: search=<text>
    if (search) query.append('search', search);

    // API supports: status=Active/Inactive/...
    if (status) query.append('status', status);

    const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/lawsection/getAll?${query.toString()}`);

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to fetch law sections',
      });
    }

    const payload = res.data?.data || {};
    return {
      records: payload.records || [],
      pagination: payload.pagination || {
        offset,
        limit,
        totalDocs: 0,
        totalPages: 1,
        currentPage: page,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: payload.filters || { status, search: search || null },
    };
  } catch (err) {
    return rejectWithValue({
      message: err.response?.data?.message || 'Failed to fetch law sections',
    });
  }
});

// =======================================================
// GET LAW SECTION BY ID
// (Assuming conventional REST: /lawsection/:id
// If your backend uses a different path like /getById?id=, change it here.)
// =======================================================
export const getProfessionalIncomeTaxLawById = createAsyncThunk('professionalIncomeTaxLaw/getProfessionalIncomeTaxLawById', async (lawId, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/lawsection/${lawId}`);

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to fetch law section',
      });
    }

    // ✅ IMPORTANT: return something
    return res.data?.law; // best: modal expects a law object
    // OR return res.data if you want the whole payload
  } catch (err) {
    return rejectWithValue({
      message: err.response?.data?.message || 'Failed to fetch law section',
    });
  }
});

// =======================================================
// SLICE
// =======================================================
const professionalIncomeTaxLawSlice = createSlice({
  name: 'professionalIncomeTaxLaw',
  initialState: {
    records: [],
    selectedRecord: null,
    pagination: {
      offset: 0,
      limit: 10,
      totalDocs: 0,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    filters: {
      status: 'Active',
      search: null,
    },
    loading: false,
    error: null,
  },
  reducers: {
    clearProfessionalIncomeTaxLawState: (state) => {
      state.loading = false;
      state.error = null;
    },
    clearSelectedProfessionalIncomeTaxLaw: (state) => {
      state.selectedRecord = null;
    },
  },
  extraReducers: (builder) => {
    // GET ALL
    builder
      .addCase(getAllProfessionalIncomeTaxLaw.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllProfessionalIncomeTaxLaw.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.pagination = action.payload.pagination;
        state.filters = action.payload.filters;
      })
      .addCase(getAllProfessionalIncomeTaxLaw.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // GET BY ID
    builder
      .addCase(getProfessionalIncomeTaxLawById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfessionalIncomeTaxLawById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRecord = action.payload; // payload is now the law object
      })
      .addCase(getProfessionalIncomeTaxLawById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearProfessionalIncomeTaxLawState, clearSelectedProfessionalIncomeTaxLaw } = professionalIncomeTaxLawSlice.actions;

export default professionalIncomeTaxLawSlice.reducer;
