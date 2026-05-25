import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import professionalAxios from '../../../../services/professionalAxios';

/* ===================================================
    GET PREFILL TAXPAYERS (by file name)
    endpoint:
    /eTaxSolnMongoApiBackend/users/preFillTaxPayers/uploadfiles/processJson?name=...
=================================================== */
export const getPreFillTaxPayers = createAsyncThunk('preFillTaxPayers/getPreFillTaxPayers', async (fileName, { rejectWithValue }) => {
  try {
    // fileName example: "BXRPM0015L_Prefill.json"
    const res = await professionalAxios.get(`/eTaxSolnMongoApiBackend/users/preFillTaxPayers/uploadfiles/processJson`, { params: { name: fileName } });

    if (!res.data?.success) {
      return rejectWithValue({
        message: res.data?.message || 'Failed to fetch prefill taxpayers data',
      });
    }

    return res.data?.data ?? null;
  } catch (err) {
    return rejectWithValue({
      message: err?.response?.data?.message || 'Failed to fetch prefill taxpayers data',
    });
  }
});


/* ===================================================
    GET FILED RETURN DATA (by file name)
    endpoint:
    /eTaxSolnMongoApiBackend/users/getFiledReturnData/uploadfiles/processJson?name=...
=================================================== */
export const getFiledReturnData = createAsyncThunk(
  'preFillTaxPayers/getFiledReturnData',
  async (fileName, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/users/getFiledReturnData/uploadfiles/processJson`,
        { params: { name: fileName } }
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || 'Failed to fetch filed return data',
        });
      }

      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue({
        message:
          err?.response?.data?.message || 'Failed to fetch filed return data',
      });
    }
  }
);

/* ===================================================
    SLICE
=================================================== */
const preFillTaxPayersSlice = createSlice({
  name: 'preFillTaxPayers',
  initialState: {
    data: null,
    filedReturnData: null,
    fileName: null,

    loading: false,
    error: null,
  },
  reducers: {
    clearPreFillTaxPayersState: (state) => {
      state.data = null;
      state.fileName = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPreFillTaxPayers.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.fileName = action.meta.arg ?? null;
      })
      .addCase(getPreFillTaxPayers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload ?? null;
      })
      .addCase(getPreFillTaxPayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch prefill taxpayers data';
        state.data = null;
      })

      .addCase(getFiledReturnData.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.fileName = action.meta.arg ?? null;
      })

      .addCase(getFiledReturnData.fulfilled, (state, action) => {
        state.loading = false;
        state.filedReturnData = action.payload ?? null;
      })

      .addCase(getFiledReturnData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch filed return data';
        state.filedReturnData = null;
      });
  },
});

export const { clearPreFillTaxPayersState } = preFillTaxPayersSlice.actions;

export default preFillTaxPayersSlice.reducer;
