// src/store/slices/alldropdownSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   GET ASSESSMENT YEAR DROPDOWN
=================================================== */
export const fetchAssessmentYearDropdown = createAsyncThunk(
  "alldropdown/fetchAssessmentYearDropdown",
  async ({ search = "", offset = 0, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "eTaxSolnMongoApiBackend/users/dropdown/fileITR1/assessmentYear/list",
        { params: { search, offset, limit } }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch assessment years",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch assessment year dropdown",
      });
    }
  }
);

/* ===================================================
   GET REGIME DROPDOWN
   GET /users/dropdown/fileITR1/regime/list
=================================================== */
export const fetchRegimeDropdown = createAsyncThunk(
  "alldropdown/fetchRegimeDropdown",
  async ({ offset = 0, limit = 100 } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "eTaxSolnMongoApiBackend/users/dropdown/fileITR1/regime/list",
        { params: { offset, limit } }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch regime list",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch regime dropdown",
      });
    }
  }
);

/* ===================================================
   GET NATURE OF EMPLOYMENT DROPDOWN
   GET /users/dropdown/fileITR1/natureOfEmployment/list
=================================================== */
export const fetchNatureOfEmploymentDropdown = createAsyncThunk(
  "alldropdown/fetchNatureOfEmploymentDropdown",
  async ({ offset = 0, limit = 100 } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "eTaxSolnMongoApiBackend/users/dropdown/fileITR1/natureOfEmployment/list",
        { params: { offset, limit } }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch nature of employment",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch nature of employment dropdown",
      });
    }
  }
);

/* ===================================================
   GET EXEMPT ALLOWANCE DROPDOWN
   GET /users/dropdown/fileITR1/exemptAllowance/getAll
=================================================== */
export const fetchExemptAllowanceDropdown = createAsyncThunk(
  "alldropdown/fetchExemptAllowanceDropdown",
  async (
    { search = "", offset = 0, limit = 100 } = {},
    { rejectWithValue }
  ) => {
    try {
      const res = await professionalAxios.get(
        "eTaxSolnMongoApiBackend/users/dropdown/fileITR1/exemptAllowance/getAll",
        { params: { search, offset, limit } }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch exempt allowance list",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch exempt allowance dropdown",
      });
    }
  }
);


/* ===================================================
   GET HOUSE PROPERTY DROPDOWN
   GET /users/dropdown/fileITR1/houseProperty/getAll
=================================================== */
export const fetchHousePropertyDropdown = createAsyncThunk(
  "alldropdown/fetchHousePropertyDropdown",
  async ({ search = "", offset = 0, limit = 100 } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "eTaxSolnMongoApiBackend/users/dropdown/fileITR1/houseProperty/getAll",
        { params: { search, offset, limit } }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch house property list",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch house property dropdown",
      });
    }
  }
);

/* ===================================================
   GET REPORTING PURPOSE DROPDOWN
   GET /users/dropdown/fileITR1/reportingPurpose/getAll
=================================================== */
export const fetchReportingPurposeDropdown = createAsyncThunk(
  "alldropdown/fetchReportingPurposeDropdown",
  async ({ search = "", offset = 0, limit = 100 } = {}, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        "eTaxSolnMongoApiBackend/users/dropdown/fileITR1/reportingPurpose/getAll",
        { params: { search, offset, limit } }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message:
            res.data?.message || "Failed to fetch reporting purpose list",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch reporting purpose dropdown",
      });
    }
  }
);

/* ===================================================
   GET TAX SLABS BY ASSESSMENT YEAR
   GET /users/fileITR_1/tax/slabs/byAssessmentYear
=================================================== */
export const fetchTaxSlabsByAssessmentYear = createAsyncThunk(
  "alldropdown/fetchTaxSlabsByAssessmentYear",
  async ({ assessmentYear }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `eTaxSolnMongoApiBackend/users/fileITR_1/tax/slabs/byAssessmentYear/${assessmentYear}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch tax slabs",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch tax slabs by assessment year",
      });
    }
  }
);


/* ===================================================
   SLICE
=================================================== */
const alldropdownSlice = createSlice({
  name: 'alldropdown',
  initialState: {
    assessmentYears: [],
    regimes: [],
    natureOfEmployment: [],
    exemptAllowances: [],
    houseProperties: [],
    reportingPurposes: [],
    taxSlabs: {
      assessmentYear: '',
      newSlabs: [],
      oldSlabs: [],
    },

    pagination: {
      offset: 0,
      limit: 50,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    regimePagination: {
      offset: 0,
      limit: 100,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    natureOfEmploymentPagination: {
      offset: 0,
      limit: 100,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    exemptAllowancePagination: {
      offset: 0,
      limit: 100,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    housePropertyPagination: {
      offset: 0,
      limit: 100,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    reportingPurposePagination: {
      offset: 0,
      limit: 100,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    loading: false,
    error: null,
  },

  reducers: {
    clearAssessmentYearDropdown: (state) => {
      state.assessmentYears = [];
      state.pagination = {
        offset: 0,
        limit: 50,
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
      state.error = null;
    },

    clearRegimeDropdown: (state) => {
      state.regimes = [];
      state.regimePagination = {
        offset: 0,
        limit: 100,
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
      state.error = null;
    },
    clearExemptAllowanceDropdown: (state) => {
      state.exemptAllowances = [];
      state.exemptAllowancePagination = {
        offset: 0,
        limit: 100,
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
      state.error = null;
    },
    clearHousePropertyDropdown: (state) => {
      state.houseProperties = [];
      state.housePropertyPagination = {
        offset: 0,
        limit: 100,
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
      state.error = null;
    },
    clearReportingPurposeDropdown: (state) => {
      state.reportingPurposes = [];
      state.reportingPurposePagination = {
        offset: 0,
        limit: 100,
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
      state.error = null;
    },
    clearTaxSlabs: (state) => {
      state.taxSlabs = {
        assessmentYear: '',
        newSlabs: [],
        oldSlabs: [],
      };
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      /* ---------- ASSESSMENT YEAR ---------- */
      .addCase(fetchAssessmentYearDropdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssessmentYearDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.assessmentYears = action.payload?.data ?? [];
        state.pagination = {
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 50,
          totalDocs: action.payload?.totalDocs ?? 0,
          totalPages: action.payload?.totalPages ?? 0,
          hasNextPage: action.payload?.hasNextPage ?? false,
          hasPrevPage: action.payload?.hasPrevPage ?? false,
        };
      })
      .addCase(fetchAssessmentYearDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.assessmentYears = [];
      })

      /* ---------- REGIME ---------- */
      .addCase(fetchRegimeDropdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRegimeDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.regimes = action.payload?.data ?? [];
        state.regimePagination = {
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 100,
          totalDocs: action.payload?.totalDocs ?? 0,
          totalPages: action.payload?.totalPages ?? 0,
          hasNextPage: action.payload?.hasNextPage ?? false,
          hasPrevPage: action.payload?.hasPrevPage ?? false,
        };
      })
      .addCase(fetchRegimeDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.regimes = [];
      })
      /* ---------- NATURE OF EMPLOYMENT ---------- */
      .addCase(fetchNatureOfEmploymentDropdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNatureOfEmploymentDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.natureOfEmployment = action.payload?.data ?? [];
        state.natureOfEmploymentPagination = {
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 100,
          totalDocs: action.payload?.totalDocs ?? 0,
          totalPages: action.payload?.totalPages ?? 0,
          hasNextPage: action.payload?.hasNextPage ?? false,
          hasPrevPage: action.payload?.hasPrevPage ?? false,
        };
      })
      .addCase(fetchNatureOfEmploymentDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.natureOfEmployment = [];
      })
      /* ---------- EXEMPT ALLOWANCE ---------- */
      .addCase(fetchExemptAllowanceDropdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExemptAllowanceDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.exemptAllowances = action.payload?.data ?? [];
        state.exemptAllowancePagination = {
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 100,
          totalDocs: action.payload?.totalDocs ?? 0,
          totalPages: action.payload?.totalPages ?? 0,
          hasNextPage: action.payload?.hasNextPage ?? false,
          hasPrevPage: action.payload?.hasPrevPage ?? false,
        };
      })
      .addCase(fetchExemptAllowanceDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.exemptAllowances = [];
      })
      /* ---------- HOUSE PROPERTY ---------- */
      .addCase(fetchHousePropertyDropdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHousePropertyDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.houseProperties = action.payload?.data ?? [];
        state.housePropertyPagination = {
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 100,
          totalDocs: action.payload?.totalDocs ?? 0,
          totalPages: action.payload?.totalPages ?? 0,
          hasNextPage: action.payload?.hasNextPage ?? false,
          hasPrevPage: action.payload?.hasPrevPage ?? false,
        };
      })
      .addCase(fetchHousePropertyDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.houseProperties = [];
      })
      /* ---------- REPORTING PURPOSE ---------- */
      .addCase(fetchReportingPurposeDropdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportingPurposeDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.reportingPurposes = action.payload?.data ?? [];
        state.reportingPurposePagination = {
          offset: action.payload?.offset ?? 0,
          limit: action.payload?.limit ?? 100,
          totalDocs: action.payload?.totalDocs ?? 0,
          totalPages: action.payload?.totalPages ?? 0,
          hasNextPage: action.payload?.hasNextPage ?? false,
          hasPrevPage: action.payload?.hasPrevPage ?? false,
        };
      })
      .addCase(fetchReportingPurposeDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.reportingPurposes = [];
      })
      /* ---------- TAX SLABS ---------- */
      .addCase(fetchTaxSlabsByAssessmentYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxSlabsByAssessmentYear.fulfilled, (state, action) => {
        state.loading = false;
        state.taxSlabs = {
          assessmentYear: action.payload?.assessmentYear || '',
          newSlabs: action.payload?.newSlabs ?? [],
          oldSlabs: action.payload?.oldSlabs ?? [],
        };
      })
      .addCase(fetchTaxSlabsByAssessmentYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.taxSlabs = {
          assessmentYear: '',
          newSlabs: [],
          oldSlabs: [],
        };
      });
  },
});
export const { clearAssessmentYearDropdown, clearRegimeDropdown, clearNatureOfEmploymentDropdown, clearExemptAllowanceDropdown, clearHousePropertyDropdown, clearReportingPurposeDropdown, clearTaxSlabs } = alldropdownSlice.actions;


export default alldropdownSlice.reducer;
