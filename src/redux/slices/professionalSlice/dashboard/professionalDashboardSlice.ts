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
          message:
            res.data?.message ||
            "Failed to fetch dashboard analytics",
        });
      }
      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch dashboard analytics",
      });
    }
  }
);
/* ===================================================
   FETCH TRANSPORT DASHBOARD ANALYTICS
=================================================== */
export const fetchTransportDashboardAnalytics = createAsyncThunk(
  "professionalDashboard/fetchTransportAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/dashboard/transportAnalytics"
      );
      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to fetch transport analytics",
        });
      }
      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch transport analytics",
      });
    }
  }
);
/* ===================================================
   FETCH CUSTOM DASHBOARD BUILDER OPTIONS
=================================================== */
export const fetchCustomDashboardBuilderOptions = createAsyncThunk(
  "professionalDashboard/fetchCustomDashboardBuilderOptions",
  async (_, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/dashboard/builderOptions"
      );
      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to fetch custom dashboard builder options",
        });
      }
      return res.data?.data ?? {};
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom dashboard builder options",
      });
    }
  }
);

/* ===================================================
   FETCH CUSTOM DASHBOARD MODULES
=================================================== */
export const fetchCustomDashboardModules = createAsyncThunk(
  "professionalDashboard/fetchCustomDashboardModules",
  async (sourceType: string = "mongo", { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/dashboard/modules",
        {
          params: {
            sourceType,
          },
        }
      );
      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to fetch dashboard modules",
        });
      }
      return res.data?.data ?? [];
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch dashboard modules",
      });
    }
  }
);

/* ===================================================
   FETCH CUSTOM DASHBOARD MODULE FIELDS
=================================================== */
export const fetchCustomDashboardFields = createAsyncThunk(
  "professionalDashboard/fetchCustomDashboardFields",
  async (
    params: {
      sourceType?: string;
      module: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/dashboard/fields",
        {
          params: {
            sourceType: params?.sourceType || "mongo",
            module: params?.module,
          },
        }
      );
      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to fetch dashboard module fields",
        });
      }
      return res.data?.data ?? [];
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch dashboard module fields",
      });
    }
  }
);

/* ===================================================
   FETCH CUSTOM DASHBOARD CARDS
=================================================== */
export const fetchCustomDashboardCards = createAsyncThunk(
  "professionalDashboard/fetchCustomDashboardCards",
  async (
    params: {
      offset?: number;
      limit?: number;
      cardType?: string;
      module?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams: Record<string, any> = {
        offset: params?.offset ?? 0,
        limit: params?.limit ?? 100,
      };
      if (params?.cardType) {
        queryParams.cardType = params.cardType;
      }
      if (params?.module) {
        queryParams.module = params.module;
      }
      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/dashboard/cards",
        { params: queryParams }
      );
      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to fetch custom dashboard cards",
        });
      }
      return res.data?.data ?? {
        cards: [],
        pagination: null,
      };
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch custom dashboard cards",
      });
    }
  }
);
/* ===================================================
   PREVIEW CUSTOM DASHBOARD CARD
=================================================== */
export const previewCustomDashboardCard = createAsyncThunk(
  "professionalDashboard/previewCustomDashboardCard",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/dashboard/cards/preview",
        payload
      );
      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to preview dashboard card",
        });
      }
      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to preview dashboard card",
      });
    }
  }
);
/* ===================================================
   CREATE CUSTOM DASHBOARD CARD
=================================================== */
export const createCustomDashboardCard = createAsyncThunk(
  "professionalDashboard/createCustomDashboardCard",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/users/dashboard/cards",
        payload
      );
      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message ||
            "Failed to create dashboard card",
        });
      }
      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to create dashboard card",
      });
    }
  }
);
/* ===================================================
   STATIC DEFAULTS - TAXEZ OLD UI
=================================================== */
const staticDefaults = {
  documents: {
    total: 0,
    active: 0,
    deleted: 0,
  },
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
    accountMaster: {
      ...staticDefaults.accountMaster,
    },
    productMaster: {
      ...staticDefaults.productMaster,
    },
    documents: {
      ...staticDefaults.documents,
    },
    tasks: {
      ...staticDefaults.tasks,
    },
    incomeTax: {
      ...staticDefaults.incomeTax,
    },
    employees: {
      ...staticDefaults.employees,
    },
    itr: {
      ...staticDefaults.itr,
    },
  },
  bookEzAnalytics: {
    ...bookEzDefaults,
  },
  transportAnalytics: null as any,
  loading: false,
  error: null as any,
  transportLoading: false,
  transportError: null as any,
  customDashboardCards: [] as any[],
  customDashboardPagination: null as any,
  customDashboardBuilderOptions: null as any,
  customDashboardModules: [] as any[],
  customDashboardFields: [] as any[],
  customDashboardPreview: null as any,
  customDashboardLoading: false,
  customDashboardBuilderLoading: false,
  customDashboardModulesLoading: false,
  customDashboardFieldsLoading: false,
  customDashboardPreviewLoading: false,
  customDashboardCreateLoading: false,
  customDashboardError: null as any,
};
/* ===================================================
   MAP NEW API RESPONSE TO OLD TAXEZ UI SHAPE
=================================================== */
const mapApiToDashboardShape = (api: any) => {
  return {
    accountMaster: {
      total:
        api?.masters?.accounts ??
        api?.accountMaster?.total ??
        0,
    },
    productMaster: {
      total:
        api?.masters?.products ??
        api?.productMaster?.total ??
        0,
    },
    documents: {
      total:
        api?.operations?.totalDocuments ??
        api?.documents?.total ??
        0,
      active:
        api?.documents?.active ??
        0,
      deleted:
        api?.operations?.totalDeletedDocuments ??
        api?.documents?.deleted ??
        0,
    },
    tasks: {
      total:
        api?.operations?.totalTasks ??
        api?.tasks?.total ??
        0,
      inProgress:
        api?.tasks?.inProgress ??
        api?.operations?.pendingTasks ??
        0,
      partiallyCompleted:
        api?.tasks?.partiallyCompleted ??
        0,
      completed:
        api?.operations?.completedTasks ??
        api?.tasks?.completed ??
        0,
    },
    incomeTax: {
      totalTaxPayers:
        api?.taxpayers?.totalTaxpayers ??
        api?.incomeTax?.totalTaxPayers ??
        0,
      active:
        api?.taxpayers?.activeTaxpayers ??
        api?.incomeTax?.active ??
        0,
      inactive:
        api?.taxpayers?.inactiveTaxpayers ??
        api?.incomeTax?.inactive ??
        0,
    },
    employees: {
      total:
        api?.employees?.totalEmployees ??
        api?.employees?.total ??
        0,
      active:
        api?.employees?.active ??
        0,
      inactive:
        api?.employees?.inactive ??
        0,
    },
    itr: {
      filedSuccessfully:
        api?.itr?.filedSuccessfully ??
        0,
      draft:
        api?.itr?.draft ??
        0,
    },
  };
};
/* ===================================================
   MERGE TAXEZ ANALYTICS
=================================================== */
const mergeAnalytics = (
  defaults: any,
  apiMapped: any
) => {
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
const mergeBookEzAnalytics = (
  defaults: any,
  api: any
) => {
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
      topSellingProducts:
        api?.analytics?.topSellingProducts ||
        [],
      topPurchasingProducts:
        api?.analytics?.topPurchasingProducts ||
        [],
      topCustomers:
        api?.analytics?.topCustomers ||
        [],
      topVendors:
        api?.analytics?.topVendors ||
        [],
    },
  };
};
/* ===================================================
   SLICE
=================================================== */
const professionalDashboardSlice =
  createSlice({
    name: "professionalDashboard",
    initialState,
    reducers: {
      resetProfessionalDashboard: (state) => {
        state.analytics = {
          ...initialState.analytics,
        };
        state.bookEzAnalytics = {
          ...initialState.bookEzAnalytics,
        };
        state.transportAnalytics = null;
        state.loading = false;
        state.error = null;
        state.transportLoading = false;
        state.transportError = null;
        state.customDashboardCards = [];
        state.customDashboardPagination = null;
        state.customDashboardBuilderOptions = null;
        state.customDashboardModules = [];
        state.customDashboardFields = [];
        state.customDashboardPreview = null;
        state.customDashboardLoading = false;
        state.customDashboardBuilderLoading = false;
        state.customDashboardModulesLoading = false;
        state.customDashboardFieldsLoading = false;
        state.customDashboardPreviewLoading = false;
        state.customDashboardCreateLoading = false;
        state.customDashboardError = null;
      },
      setStaticDashboardCounts: (
        state,
        action
      ) => {
        state.analytics =
          mergeAnalytics(
            state.analytics,
            action.payload
          );
      },
      setBookEzDashboardCounts: (
        state,
        action
      ) => {
        state.bookEzAnalytics =
          mergeBookEzAnalytics(
            state.bookEzAnalytics,
            action.payload
          );
      },
      setTransportDashboardAnalytics: (
        state,
        action
      ) => {
        state.transportAnalytics =
          action.payload;
      },
      clearCustomDashboardPreview: (state) => {
        state.customDashboardPreview = null;
        state.customDashboardError = null;
      },
    },
    extraReducers: (builder) => {
      builder
        /* ===================================================
           PROFESSIONAL / BOOKEZ DASHBOARD ANALYTICS
        =================================================== */
        .addCase(
          fetchProfessionalDashboardAnalytics.pending,
          (state) => {
            state.loading = true;
            state.error = null;
          }
        )
        .addCase(
          fetchProfessionalDashboardAnalytics.fulfilled,
          (state, action) => {
            state.loading = false;
            const apiData =
              action.payload || {};
            const mappedAnalytics =
              mapApiToDashboardShape(
                apiData
              );
            state.analytics =
              mergeAnalytics(
                initialState.analytics,
                mappedAnalytics
              );
            state.bookEzAnalytics =
              mergeBookEzAnalytics(
                bookEzDefaults,
                apiData
              );
          }
        )
        .addCase(
          fetchProfessionalDashboardAnalytics.rejected,
          (
            state,
            action: any
          ) => {
            state.loading = false;
            state.error =
              action.payload?.message ||
              "Something went wrong";
          }
        )
        /* ===================================================
           TRANSPORT DASHBOARD ANALYTICS
        =================================================== */
        .addCase(
          fetchTransportDashboardAnalytics.pending,
          (state) => {
            state.transportLoading = true;
            state.transportError = null;
          }
        )
        .addCase(
          fetchTransportDashboardAnalytics.fulfilled,
          (state, action) => {
            state.transportLoading = false;
            state.transportAnalytics =
              action.payload ||
              null;
          }
        )
        .addCase(
          fetchTransportDashboardAnalytics.rejected,
          (
            state,
            action: any
          ) => {
            state.transportLoading = false;
            state.transportError =
              action.payload?.message ||
              "Failed to fetch transport analytics";
          }
        )
        .addCase(
          fetchCustomDashboardBuilderOptions.pending,
          (state) => {
            state.customDashboardBuilderLoading = true;
            state.customDashboardError = null;
          }
        )
        .addCase(
          fetchCustomDashboardBuilderOptions.fulfilled,
          (state, action) => {
            state.customDashboardBuilderLoading = false;
            state.customDashboardBuilderOptions = action.payload || {};
          }
        )
        .addCase(
          fetchCustomDashboardBuilderOptions.rejected,
          (state, action: any) => {
            state.customDashboardBuilderLoading = false;
            state.customDashboardError =
              action.payload?.message ||
              "Failed to fetch custom dashboard builder options";
          }
        )
        .addCase(
          fetchCustomDashboardModules.pending,
          (state) => {
            state.customDashboardModulesLoading = true;
            state.customDashboardError = null;
          }
        )
        .addCase(
          fetchCustomDashboardModules.fulfilled,
          (state, action) => {
            state.customDashboardModulesLoading = false;
            const payload: any = action.payload;
            state.customDashboardModules = Array.isArray(payload)
              ? payload
              : payload?.modules || payload?.data || [];
          }
        )
        .addCase(
          fetchCustomDashboardModules.rejected,
          (state, action: any) => {
            state.customDashboardModulesLoading = false;
            state.customDashboardModules = [];
            state.customDashboardError =
              action.payload?.message ||
              "Failed to fetch dashboard modules";
          }
        )
        .addCase(
          fetchCustomDashboardFields.pending,
          (state) => {
            state.customDashboardFieldsLoading = true;
            state.customDashboardError = null;
          }
        )
        .addCase(
          fetchCustomDashboardFields.fulfilled,
          (state, action) => {
            state.customDashboardFieldsLoading = false;
            const payload: any = action.payload;
            state.customDashboardFields = Array.isArray(payload)
              ? payload
              : payload?.fields || payload?.data || [];
          }
        )
        .addCase(
          fetchCustomDashboardFields.rejected,
          (state, action: any) => {
            state.customDashboardFieldsLoading = false;
            state.customDashboardFields = [];
            state.customDashboardError =
              action.payload?.message ||
              "Failed to fetch dashboard module fields";
          }
        )
        .addCase(
          fetchCustomDashboardCards.pending,
          (state) => {
            state.customDashboardLoading = true;
            state.customDashboardError = null;
          }
        )
        .addCase(
          fetchCustomDashboardCards.fulfilled,
          (state, action) => {
            state.customDashboardLoading = false;
            state.customDashboardCards = action.payload?.cards || [];
            state.customDashboardPagination = action.payload?.pagination || null;
          }
        )
        .addCase(
          fetchCustomDashboardCards.rejected,
          (state, action: any) => {
            state.customDashboardLoading = false;
            state.customDashboardError =
              action.payload?.message ||
              "Failed to fetch custom dashboard cards";
          }
        )
        .addCase(
          previewCustomDashboardCard.pending,
          (state) => {
            state.customDashboardPreviewLoading = true;
            state.customDashboardError = null;
          }
        )
        .addCase(
          previewCustomDashboardCard.fulfilled,
          (state, action) => {
            state.customDashboardPreviewLoading = false;
            state.customDashboardPreview = action.payload || null;
          }
        )
        .addCase(
          previewCustomDashboardCard.rejected,
          (state, action: any) => {
            state.customDashboardPreviewLoading = false;
            state.customDashboardPreview = null;
            state.customDashboardError =
              action.payload?.message ||
              "Failed to preview dashboard card";
          }
        )
        .addCase(
          createCustomDashboardCard.pending,
          (state) => {
            state.customDashboardCreateLoading = true;
            state.customDashboardError = null;
          }
        )
        .addCase(
          createCustomDashboardCard.fulfilled,
          (state) => {
            state.customDashboardCreateLoading = false;
          }
        )
        .addCase(
          createCustomDashboardCard.rejected,
          (state, action: any) => {
            state.customDashboardCreateLoading = false;
            state.customDashboardError =
              action.payload?.message ||
              "Failed to create dashboard card";
          }
        );
    },
  });
/* ===================================================
   EXPORT ACTIONS
=================================================== */
export const {
  resetProfessionalDashboard,
  setStaticDashboardCounts,
  setBookEzDashboardCounts,
  setTransportDashboardAnalytics,
  clearCustomDashboardPreview,
} = professionalDashboardSlice.actions;
/* ===================================================
   EXPORT REDUCER
=================================================== */
export default professionalDashboardSlice.reducer;
