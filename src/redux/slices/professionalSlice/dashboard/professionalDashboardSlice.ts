import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import professionalAxios from '../../../../services/professionalAxios';

/* ===================================================
   FETCH PROFESSIONAL DASHBOARD ANALYTICS
=================================================== */
export const fetchProfessionalDashboardAnalytics = createAsyncThunk('professionalDashboard/fetchAnalytics', async (_, { rejectWithValue }) => {
  try {
    const res = await professionalAxios.get('/eTaxSolnMongoApiBackend/users/dashboard/analytics');

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to fetch dashboard analytics',
      });
    }

    return res.data?.data ?? null;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to fetch dashboard analytics',
    });
  }
});

/* ===================================================
   STATIC DEFAULTS
=================================================== */
const staticDefaults = {
  documents: { total: 0, active: 0, deleted: 0 },
  tasks: {
    total: 0,
    inProgress: 0,
    partiallyCompleted: 0,
    completed: 0,
  },
  incomeTax: {
    totalTaxPayers: 0,
    active: 0,
    inactive: 0,
  },
  employees: { total: 0, active: 0, inactive: 0 },
  itr: { filedSuccessfully: 0, draft: 0 },

  accountMaster: { total: 0 },
  productMaster: { total: 0 },
};

/* ===================================================
   INITIAL STATE
=================================================== */
const initialState = {
  analytics: {
    accountMaster: { ...staticDefaults.accountMaster },
    productMaster: { ...staticDefaults.productMaster },
    documents: { ...staticDefaults.documents },
    tasks: { ...staticDefaults.tasks },
    incomeTax: { ...staticDefaults.incomeTax },
    employees: { ...staticDefaults.employees },
    itr: { ...staticDefaults.itr },
  },
  loading: false,
  error: null,
};

/* ===================================================
   MAP NEW API RESPONSE TO OLD UI SHAPE
=================================================== */
const mapApiToDashboardShape = (api) => {
  return {
    accountMaster: {
      total: api?.masters?.accounts ?? 0,
    },
    productMaster: {
      total: api?.masters?.products ?? 0,
    },
    incomeTax: {
      totalTaxPayers: api?.taxpayers?.totalTaxpayers ?? 0,
      active: api?.taxpayers?.activeTaxpayers ?? 0,
      inactive: api?.taxpayers?.inactiveTaxpayers ?? 0,
    },
    employees: {
      total: api?.employees?.totalEmployees ?? 0,
      active: 0,
      inactive: 0,
    },
  };
};

/* ===================================================
   HELPER MERGE
=================================================== */
const mergeAnalytics = (defaults, apiMapped) => {
  return {
    accountMaster: {
      ...defaults.accountMaster,
      ...(apiMapped?.accountMaster || {}),
    },
    productMaster: {
      ...defaults.productMaster,
      ...(apiMapped?.productMaster || {}),
    },
    documents: {
      ...defaults.documents,
      ...(apiMapped?.documents || {}),
    },
    tasks: {
      ...defaults.tasks,
      ...(apiMapped?.tasks || {}),
    },
    incomeTax: {
      ...defaults.incomeTax,
      ...(apiMapped?.incomeTax || {}),
    },
    employees: {
      ...defaults.employees,
      ...(apiMapped?.employees || {}),
    },
    itr: {
      ...defaults.itr,
      ...(apiMapped?.itr || {}),
    },
  };
};

/* ===================================================
   SLICE
=================================================== */
const professionalDashboardSlice = createSlice({
  name: 'professionalDashboard',
  initialState,
  reducers: {
    resetProfessionalDashboard: (state) => {
      state.analytics = { ...initialState.analytics };
      state.loading = false;
      state.error = null;
    },

    setStaticDashboardCounts: (state, action) => {
      state.analytics = mergeAnalytics(state.analytics, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfessionalDashboardAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfessionalDashboardAnalytics.fulfilled, (state, action) => {
        state.loading = false;

        const mappedAnalytics = mapApiToDashboardShape(action.payload);

        state.analytics = mergeAnalytics(initialState.analytics, mappedAnalytics);
      })
      .addCase(fetchProfessionalDashboardAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
      });
  },
});

export const { resetProfessionalDashboard, setStaticDashboardCounts } = professionalDashboardSlice.actions;

export default professionalDashboardSlice.reducer;