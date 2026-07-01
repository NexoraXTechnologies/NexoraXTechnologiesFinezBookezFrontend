import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../services/professionalAxios";

/* ===================================================
    Form ACCOUNT Master
=================================================== */

export const getAllAccountMasterSchema = createAsyncThunk(
  "accountMaster/getAllAccountMasterSchema",
  async (
    {
      offset = 0,
      limit = 20,
      isSearchable = "",
      isRequired = "",
      isFilterable = "",
    }: {
      offset?: number;
      limit?: number;
      isSearchable?: string;
      isRequired?: string;
      isFilterable?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = {
        offset,
        limit,
        isSearchable,
        isRequired,
        isFilterable,
      };

      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/users/masters/accountMaster/schema/getAll",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch account schema",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || "Failed to fetch account schema",
      });
    }
  }
);







/* ===================================================
    CREATE ACCOUNT
=================================================== */
export const createAccount = createAsyncThunk(
  "accountMaster/createAccount",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        "/eTaxSolnMongoApiBackend/accountMaster/createAccount",
        payload
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to create account",
        });

      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to create account",
      });
    }
  }
);

export const getAllAccounts = createAsyncThunk(
  "accountMaster/getAllAccounts",
  async (
    {
      offset = 0,
      limit = 10,
      search = "",
      accountType = "",
    }: {
      offset?: number;
      limit?: number;
      search?: string;
      accountType?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params: {
        offset?: number;
        limit?: number;
        search?: string;
        accountType?: string;
      } = {
        offset,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (accountType.trim()) {
        params.accountType = accountType.trim();
      }

      const res = await professionalAxios.get(
        "/eTaxSolnMongoApiBackend/accountMaster/getAllAccounts",
        { params }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch accounts",
        });
      }

      return res.data?.data;
    } catch (err: any) {
      return rejectWithValue({
        message:
          err?.response?.data?.message ||
          "Failed to fetch accounts",
      });
    }
  }
);
/* ===================================================
    GET ACCOUNT BY CODE
=================================================== */
export const getAccountByCode = createAsyncThunk(
  "accountMaster/getAccountByCode",
  async (accountCode: string, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/accountMaster/getByAccCode/${accountCode}`
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch account",
        });

      return res.data?.data?.account ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to fetch account",
      });
    }
  }
);

/* ===================================================
    UPDATE ACCOUNT
=================================================== */
export const updateAccount = createAsyncThunk(
  "accountMaster/updateAccount",
  async ({ accountCode, data }: { accountCode: string; data: any }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.put(
        `/eTaxSolnMongoApiBackend/accountMaster/updateAccount/${accountCode}`,
        data
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to update account",
        });

      return res.data?.data ?? null;
    } catch (err: any) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to update account",
      });
    }
  }
);

/* ===================================================
    DELETE ACCOUNT
=================================================== */
export const deleteAccount = createAsyncThunk(
  "accountMaster/deleteAccount",
  async (accountCode: string, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.delete(
        `/eTaxSolnMongoApiBackend/accountMaster/deleteAccount/${accountCode}`
      );

      if (!res.data?.success)
        return rejectWithValue({
          message: res.data?.message || "Failed to delete account",
        });

      return accountCode;
    } catch (err: any) {
      return rejectWithValue({
        message: err?.response?.data?.message || "Failed to delete account",
      });
    }
  }
);




/* ===================================================
    SLICE
=================================================== */
const accountMasterSlice = createSlice({
  name: "accountMaster",
  initialState: {
    accounts: [],
    pagination: {
      offset: 0,
      limit: 10,
      totalDocs: 0,
      totalPages: 1,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false,

    },

    accountMasterSchemaFields: [],
    schemaLoading: false,

    selectedAccount: null,

    loading: false,
    error: null,

    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
  },

  reducers: {
    clearAccountMasterState: (state) => {
      state.error = null;
      state.createLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;
    },
  },

  extraReducers: (builder) => {
    /* ---------- GET ALL ---------- */
    builder
      .addCase(getAllAccounts.pending, (state: any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAccounts.fulfilled, (state: any, action: any) => {
        state.loading = false;
        const data = action.payload;

        state.accounts = data.items ?? [];
        state.pagination = data.pagination ?? state.pagination;
      })
      .addCase(getAllAccounts.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload?.message;
        state.accounts = [];
      });

    /* ---------- GET BY ACCOUNT CODE ---------- */
    builder
      .addCase(getAccountByCode.pending, (state: any) => {
        state.loading = true;
      })
      .addCase(getAccountByCode.fulfilled, (state: any, action: any) => {
        state.loading = false;
        state.selectedAccount = action.payload ?? null;
      })
      .addCase(getAccountByCode.rejected, (state: any, action: any) => {
        state.loading = false;
        state.error = action.payload?.message;
      });


    /* ----------  Form ACCOUNT Master ---------- */
    builder
      .addCase(getAllAccountMasterSchema.pending, (state: any) => {
        state.schemaLoading = true;
        state.error = null;
      })

      .addCase(getAllAccountMasterSchema.fulfilled, (state: any, action: any) => {
        state.schemaLoading = false;
        state.accountMasterSchemaFields = action.payload?.fields || [];
      })

      .addCase(getAllAccountMasterSchema.rejected, (state: any, action: any) => {
        state.schemaLoading = false;
        state.error =
          action.payload?.message || "Failed to fetch account schema";
      })

    /* ---------- CREATE ACCOUNT ---------- */
    builder
      .addCase(createAccount.pending, (state: any) => {
        state.createLoading = true;
      })
      .addCase(createAccount.fulfilled, (state: any, action: any) => {
        state.createLoading = false;

        if (action.payload) {
          state.accounts.unshift(action.payload);
          state.pagination.totalDocs += 1;
        }
      })
      .addCase(createAccount.rejected, (state: any, action: any) => {
        state.createLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- UPDATE ACCOUNT ---------- */
    builder
      .addCase(updateAccount.pending, (state: any) => {
        state.updateLoading = true;
      })
      .addCase(updateAccount.fulfilled, (state: any, action: any) => {
        state.updateLoading = false;

        const updated = action.payload;
        if (!updated?.accountCode) return;

        state.accounts = state.accounts.map((acc: any) =>
          acc.accountCode === updated.accountCode ? updated : acc
        );
      })
      .addCase(updateAccount.rejected, (state: any, action: any) => {
        state.updateLoading = false;
        state.error = action.payload?.message;
      });

    /* ---------- DELETE ACCOUNT ---------- */
    builder
      .addCase(deleteAccount.pending, (state: any) => {
        state.deleteLoading = true;
      })
      .addCase(deleteAccount.fulfilled, (state: any, action: any) => {
        state.deleteLoading = false;

        const removedCode = action.payload;
        state.accounts = state.accounts.filter(
          (acc: any) => acc.accountCode !== removedCode
        );

        state.pagination.totalDocs = Math.max(
          0,
          state.pagination.totalDocs - 1
        );
      })
      .addCase(deleteAccount.rejected, (state: any, action: any) => {
        state.deleteLoading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearAccountMasterState } = accountMasterSlice.actions;
export default accountMasterSlice.reducer;