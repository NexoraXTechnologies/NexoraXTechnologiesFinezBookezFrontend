import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

// ⭐ UPDATED
const DOWNLOAD_PDF_URL = "/eTaxSolnMongoApiBackend/users/bookez/BookezReportPdf/download-pdf";

export const REPORT_TEMPLATE_CODES = {
    DEFAULT_VOUCHER: "DEFAULT_VOUCHER",
    TAXINVOICE_VOUCHER: "TAXINVOICE_VOUCHER",
};

const parseDownloadError = async (error: any) => {
    const responseData = error?.response?.data;

    if (responseData instanceof Blob) {
        try {
            const text = await responseData.text();

            if (text) {
                try {
                    const json = JSON.parse(text);
                    return json?.message || json?.error || json?.code || text;
                }
                catch {
                    return text;
                }
            }
        }
        catch {
            // keep default error
        }
    }

    return error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to download PDF";
};

// ⭐ UPDATED - DOWNLOAD REPORT PDF
export const downloadReportPdf = createAsyncThunk(
    "downloadReportPdf/download",
    async (
        {
            templateCode = REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER,
            voucherNumber,
            pdfData,
        }: {
            templateCode?: string;
            voucherNumber: string;
            pdfData: any;
        },
        { rejectWithValue }
    ) => {
        try {
            const safeTemplateCode = String(templateCode || REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER).trim() || REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER;
            const safeVoucherNumber = String(voucherNumber || "").trim();

            if (!safeVoucherNumber) throw new Error("Voucher number is required");

            const response = await professionalAxios.post(
                `${DOWNLOAD_PDF_URL}/${safeTemplateCode}/${encodeURIComponent(safeVoucherNumber)}`,
                { pdfData },
                {
                    responseType: "blob",
                    headers: { Accept: "application/pdf" },
                }
            );

            const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data], { type: "application/pdf" });

            if (!blob.size) throw new Error("PDF not returned from server");

            const pdfUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = pdfUrl;
            link.download = `${safeVoucherNumber}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(pdfUrl);

            return {
                success: true,
                templateCode: safeTemplateCode,
                voucherNumber: safeVoucherNumber,
            };
        }
        catch (error: any) {
            return rejectWithValue({
                message: await parseDownloadError(error),
            });
        }
    }
);

// STATE
const initialState: any = {
    downloadLoader: false,
    downloadedVoucherNumber: null,
    error: null,
};

// SLICE
const downloadReportPdfSlice = createSlice({
    name: "downloadReportPdf",
    initialState,
    reducers: {
        clearDownloadReportPdfError: (state) => {
            state.error = null;
        },

        clearDownloadReportPdfState: (state) => {
            state.downloadLoader = false;
            state.downloadedVoucherNumber = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // ⭐ UPDATED - DOWNLOAD PDF
            .addCase(downloadReportPdf.pending, (state) => {
                state.downloadLoader = true;
                state.error = null;
            })
            .addCase(downloadReportPdf.fulfilled, (state, action) => {
                state.downloadLoader = false;
                state.downloadedVoucherNumber = action.payload?.voucherNumber || null;
                state.error = null;
            })
            .addCase(downloadReportPdf.rejected, (state, action: any) => {
                state.downloadLoader = false;
                state.error = action.payload?.message || action.error?.message || "Failed to download PDF";
            });
    },
});

export const {
    clearDownloadReportPdfError,
    clearDownloadReportPdfState,
} = downloadReportPdfSlice.actions;

export default downloadReportPdfSlice.reducer;