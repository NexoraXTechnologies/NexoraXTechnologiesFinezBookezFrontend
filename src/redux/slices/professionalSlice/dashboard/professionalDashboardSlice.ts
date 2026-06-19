import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   FETCH PROFESSIONAL DASHBOARD ANALYTICS
=================================================== */

export const fetchProfessionalDashboardAnalytics = createAsyncThunk(
  "professionalDashboard/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/dashboard/analytics"
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch dashboard analytics",
        });
      }

      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch dashboard analytics",
      });
    }
  }
);

/* ===================================================
   STATIC DEFAULTS - TAXEZ OLD UI
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

  employees: {
    total: 0,
    active: 0,
    inactive: 0,
  },

  itr: {
    filedSuccessfully: 0,
    draft: 0,
  },

  accountMaster: {
    total: 0,
  },

  productMaster: {
    total: 0,
  },
};

/* ===================================================
   STATIC DEFAULTS - BOOKEZ NEW UI
=================================================== */

const bookEzDefaults = {
  masters: {
    accounts: 0,
    products: 0,
    units: 0,
    reportMappings: 0,
  },

  opening: {
    openingBalances: 0,
    totalOpeningBalanceNetAmount: 0,
    openingStocks: 0,
    totalOpeningStocksNetAmount: 0,
    journalVouchers: 0,
    totalJournalVouchersNetAmount: 0,
    contraVouchers: 0,
    totalContraVouchersNetAmount: 0,
    creditNotes: 0,
    totalCreditNotesNetAmount: 0,
    debitNotes: 0,
    totalDebitNotesNetAmount: 0,
  },

  production: {
    assemblyProduction: 0,
    issuesToProduction: 0,
    receiptFromProduction: 0,
  },

  quotation: {
    totalSalesQuotations: 0,
  },

  sales: {
    totalOrders: 0,
    totalInvoices: 0,
    totalReturns: 0,
    totalInvoiceNetAmount: 0,
    totalReturnsNetAmount: 0,
    totalOrdersNetAmount: 0,
  },

  purchase: {
    totalOrders: 0,
    totalInvoices: 0,
    totalReturns: 0,
    totalGrns: 0,
    totalGrnNetAmount: 0,
    totalInvoiceNetAmount: 0,
    totalReturnsNetAmount: 0,
    totalOrdersNetAmount: 0,
  },

  finance: {
    totalReceipt: 0,
    totalPayment: 0,
  },

  operations: {
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalDocuments: 0,
    totalDeletedDocuments: 0,
  },

  receivable: {
    totalReceivableAmount: 0,
    totalSalesInvoiceCount: 0,
    totalSalesInvoiceReturnAmount: 0,
  },

  payable: {
    totalPayableAmount: 0,
  },

  taxpayers: {
    totalTaxpayers: 0,
    activeTaxpayers: 0,
    inactiveTaxpayers: 0,
  },

  employees: {
    totalEmployees: 0,
  },

  analytics: {
    topSellingProducts: [],
    topPurchasingProducts: [],
    topCustomers: [],
    topVendors: [],
  },
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

  // ✅ New: full BookEz dashboard data
  bookEzAnalytics: {
    ...bookEzDefaults,
  },

  loading: false,
  error: null as any,
};

/* ===================================================
   MAP NEW API RESPONSE TO OLD TAXEZ UI SHAPE
=================================================== */

const mapApiToDashboardShape = (api: any) => {
  return {
    accountMaster: {
      total: api?.masters?.accounts ?? api?.accountMaster?.total ?? 0,
    },

    productMaster: {
      total: api?.masters?.products ?? api?.productMaster?.total ?? 0,
    },

    documents: {
      total: api?.operations?.totalDocuments ?? api?.documents?.total ?? 0,
      active: api?.documents?.active ?? 0,
      deleted:
        api?.operations?.totalDeletedDocuments ?? api?.documents?.deleted ?? 0,
    },

    tasks: {
      total: api?.operations?.totalTasks ?? api?.tasks?.total ?? 0,
      inProgress: api?.tasks?.inProgress ?? api?.operations?.pendingTasks ?? 0,
      partiallyCompleted: api?.tasks?.partiallyCompleted ?? 0,
      completed: api?.operations?.completedTasks ?? api?.tasks?.completed ?? 0,
    },

    incomeTax: {
      totalTaxPayers:
        api?.taxpayers?.totalTaxpayers ?? api?.incomeTax?.totalTaxPayers ?? 0,
      active: api?.taxpayers?.activeTaxpayers ?? api?.incomeTax?.active ?? 0,
      inactive:
        api?.taxpayers?.inactiveTaxpayers ?? api?.incomeTax?.inactive ?? 0,
    },

    employees: {
      total: api?.employees?.totalEmployees ?? api?.employees?.total ?? 0,
      active: api?.employees?.active ?? 0,
      inactive: api?.employees?.inactive ?? 0,
    },

    itr: {
      filedSuccessfully: api?.itr?.filedSuccessfully ?? 0,
      draft: api?.itr?.draft ?? 0,
    },
  };
};

/* ===================================================
   MERGE TAXEZ ANALYTICS
=================================================== */

const mergeAnalytics = (defaults: any, apiMapped: any) => {
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
   MERGE BOOKEZ ANALYTICS
=================================================== */

const mergeBookEzAnalytics = (defaults: any, api: any) => {
  return {
    masters: {
      ...defaults.masters,
      ...(api?.masters || {}),
    },

    opening: {
      ...defaults.opening,
      ...(api?.opening || {}),
    },

    production: {
      ...defaults.production,
      ...(api?.production || {}),
    },

    quotation: {
      ...defaults.quotation,
      ...(api?.quotation || {}),
    },

    sales: {
      ...defaults.sales,
      ...(api?.sales || {}),
    },

    purchase: {
      ...defaults.purchase,
      ...(api?.purchase || {}),
    },

    finance: {
      ...defaults.finance,
      ...(api?.finance || {}),
    },

    operations: {
      ...defaults.operations,
      ...(api?.operations || {}),
    },

    receivable: {
      ...defaults.receivable,
      ...(api?.receivable || {}),
    },

    payable: {
      ...defaults.payable,
      ...(api?.payable || {}),
    },

    taxpayers: {
      ...defaults.taxpayers,
      ...(api?.taxpayers || {}),
    },

    employees: {
      ...defaults.employees,
      ...(api?.employees || {}),
    },

    analytics: {
      ...defaults.analytics,
      ...(api?.analytics || {}),
      topSellingProducts: api?.analytics?.topSellingProducts || [],
      topPurchasingProducts: api?.analytics?.topPurchasingProducts || [],
      topCustomers: api?.analytics?.topCustomers || [],
      topVendors: api?.analytics?.topVendors || [],
    },
  };
};

/* ===================================================
   SLICE
=================================================== */

const professionalDashboardSlice = createSlice({
  name: "professionalDashboard",

  initialState,

  reducers: {
    resetProfessionalDashboard: (state) => {
      state.analytics = { ...initialState.analytics };
      state.bookEzAnalytics = { ...initialState.bookEzAnalytics };
      state.loading = false;
      state.error = null;
    },

    setStaticDashboardCounts: (state, action) => {
      state.analytics = mergeAnalytics(state.analytics, action.payload);
    },

    setBookEzDashboardCounts: (state, action) => {
      state.bookEzAnalytics = mergeBookEzAnalytics(
        state.bookEzAnalytics,
        action.payload
      );
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

        const apiData = action.payload || {};

        // ✅ Old TaxEz shape
        const mappedAnalytics = mapApiToDashboardShape(apiData);
        state.analytics = mergeAnalytics(initialState.analytics, mappedAnalytics);

        // ✅ Full BookEz shape for BookEz dashboard
        state.bookEzAnalytics = mergeBookEzAnalytics(bookEzDefaults, apiData);
      })

      .addCase(fetchProfessionalDashboardAnalytics.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || "Something went wrong";
      });
  },
});

export const {
  resetProfessionalDashboard,
  setStaticDashboardCounts,
  setBookEzDashboardCounts,
} = professionalDashboardSlice.actions;

export default professionalDashboardSlice.reducer;