import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

// =======================================================
// AI TAX CHAT (POST)
// =======================================================
export const aiTaxChat = createAsyncThunk(
  "aiTaxCopilot/aiTaxChat",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/ai/tax/chat`,
        payload
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "AI Tax chat failed",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "AI Tax chat failed",
      });
    }
  }
);

// =======================================================
// GET TAX PDF (DOWNLOAD)
// =======================================================
export const downloadTaxPdf = createAsyncThunk(
  "aiTaxCopilot/downloadTaxPdf",
  async (pdfKey, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/ai/tax/pdf/${pdfKey}`,
        { responseType: "blob" }
      );

      const blob = res.data;
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Tax_Summary_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      return true; // ✅ serializable payload
    } catch (err) {
      return rejectWithValue("Failed to download tax PDF");
    }
  }
);
// =======================================================
// POST TAX SUMMARY (GENERATE / USE LLM)
// =======================================================
export const generateTaxSummary = createAsyncThunk(
  "aiTaxCopilot/generateTaxSummary",
  async ({ payload, useLLM = true }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/ai/tax/summary/post?useLLM=${useLLM}`,
        payload
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to generate tax summary",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message:
          err.response?.data?.message || "Failed to generate tax summary",
      });
    }
  }
);

// =======================================================
// GET TAX SUMMARY (PAN + AY)
// =======================================================
export const getTaxSummary = createAsyncThunk(
  "aiTaxCopilot/getTaxSummary",
  async ({ pan, ay }, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.get(
        `/eTaxSolnMongoApiBackend/ai/tax/summary/get?pan=${pan}&ay=${ay}`
      );

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to fetch tax summary",
        });
      }

      return res.data.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to fetch tax summary",
      });
    }
  }
);

// =======================================================
// POST ITR-1 (NEW REGIME) SAVE
// =======================================================
export const saveITR1NewRegime = createAsyncThunk(
  "aiTaxCopilot/saveITR1NewRegime",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await professionalAxios.post(
        `/eTaxSolnMongoApiBackend/users/ai/fileITR1/save`,
        payload
      );

       if (!res.data?.success) {
        return rejectWithValue({
          message: res.data?.message || "Failed to save ITR-1",
        });
      }

      // ✅ RETURN MESSAGE + DATA
      return {
        message: res.data.message,
        data: res.data.data,
      };
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to save ITR-1",
      });
    }
  }
);

// =======================================================
// SLICE
// =======================================================
const aiTaxCopilotSlice = createSlice({
  name: "aiTaxCopilot",
  initialState: {
    chatResponse: null,
    taxSummary: null,
    loading: false,
    error: null,
    chatSuccess: false,
    summaryGenerated: false,
    pdfDownloaded: false,
    itr1Saved: false,
  },
  reducers: {
    clearAiTaxCopilotState: (state) => {
      state.loading = false;
      state.error = null;
      state.chatSuccess = false;
      state.summaryGenerated = false;
      state.pdfDownloaded = false;
      state.itr1Saved = false;
    },
  },
  extraReducers: (builder) => {
    // AI CHAT
    builder
      .addCase(aiTaxChat.pending, (state) => {
        state.loading = true;
        state.chatSuccess = false;
      })
      .addCase(aiTaxChat.fulfilled, (state, action) => {
        state.loading = false;
        state.chatSuccess = true;
        state.chatResponse = action.payload;
      })
      .addCase(aiTaxChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // GENERATE SUMMARY
    builder
      .addCase(generateTaxSummary.pending, (state) => {
        state.loading = true;
        state.summaryGenerated = false;
      })
      .addCase(generateTaxSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summaryGenerated = true;
        state.taxSummary = action.payload;
      })
      .addCase(generateTaxSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // GET SUMMARY
    builder
      .addCase(getTaxSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTaxSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.taxSummary = action.payload;
      })
      .addCase(getTaxSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });

    // PDF DOWNLOAD
    builder
      .addCase(downloadTaxPdf.pending, (state) => {
        state.loading = true;
        state.pdfDownloaded = false;
      })
      .addCase(downloadTaxPdf.fulfilled, (state) => {
        state.loading = false;
        state.pdfDownloaded = true;
      })
      .addCase(downloadTaxPdf.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    // SAVE ITR-1
    builder
      .addCase(saveITR1NewRegime.pending, (state) => {
        state.loading = true;
        state.itr1Saved = false;
      })
      .addCase(saveITR1NewRegime.fulfilled, (state, action) => {
        state.loading = false;
        state.itr1Saved = true;
      })
      .addCase(saveITR1NewRegime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { clearAiTaxCopilotState } = aiTaxCopilotSlice.actions;

export default aiTaxCopilotSlice.reducer;
