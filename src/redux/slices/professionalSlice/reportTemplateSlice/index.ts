import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

// ⭐ UPDATED
const THEMES_BASE_URL = "/eTaxSolnMongoApiBackend/users/bookez/themes";
const PREVIEW_URL = "/eTaxSolnMongoApiBackend/users/bookez/BookezReportPdf/preview";

export const REPORT_TEMPLATE_CODES = {
    DEFAULT_VOUCHER: "DEFAULT_VOUCHER",
    TAXINVOICE_VOUCHER: "TAXINVOICE_VOUCHER",
};

export const REPORT_TEMPLATE_OPTIONS = [
    { label: "Default Voucher", value: REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER },
    { label: "Tax Invoice Voucher", value: REPORT_TEMPLATE_CODES.TAXINVOICE_VOUCHER },
];

const getErrorMessage = (error: any, fallback: string) => error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

// ⭐ UPDATED - matches actual API response { pagination, items: [] }
const getThemeRecords = (response: any) => {
    const source = response?.data?.data ?? response?.data ?? response ?? {};

    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.items)) return source.items;
    if (Array.isArray(source?.themes)) return source.themes;
    if (Array.isArray(source?.records)) return source.records;
    if (Array.isArray(source?.docs)) return source.docs;
    if (Array.isArray(source?.data)) return source.data;

    return [];
};

const looksLikeTheme = (item: any) =>
    item &&
    typeof item === "object" &&
    (item.primaryColor || item.themeCode || item.themeName);

const unwrapTheme = (response: any) => {
    const source = response?.data?.data ?? response?.data ?? response;

    if (Array.isArray(source)) return source.find(looksLikeTheme) || null;
    if (source?.theme && looksLikeTheme(source.theme)) return source.theme;
    if (looksLikeTheme(source)) return source;
    if (source?.data && looksLikeTheme(source.data)) return source.data;

    return null;
};

export const normalizeTheme = (theme: any = {}) => ({
    _id: theme?._id || "",
    themeCode: theme?.themeCode || "",
    themeName: theme?.themeName || "",
    primaryColor: theme?.primaryColor || "#2B82D4",
    secondaryColor: theme?.secondaryColor || "#F4F8FC",
    textColor: theme?.textColor || "#222222",
    subTextColor: theme?.subTextColor || "#555555",
    headerTextColor: theme?.headerTextColor || "#FFFFFF",
    borderColor: theme?.borderColor || "#DDDDDD",
    successColor: theme?.successColor || "#28A745",
    warningColor: theme?.warningColor || "#FFC107",
    dangerColor: theme?.dangerColor || "#DC3545",
    isDefault: !!theme?.isDefault,
    isActive: !!theme?.isActive,

    // ⭐ UPDATED - your API uses createdOn/modifiedOn
    createdAt: theme?.createdAt || theme?.createdOn || "",
    updatedAt: theme?.updatedAt || theme?.modifiedOn || "",
    createdOn: theme?.createdOn || "",
    modifiedOn: theme?.modifiedOn || "",
});

export const dedupeThemesByPrimaryColor = (themes: any[] = []) => {
    const map = new Map();

    themes.forEach((theme) => {
        if (!theme?.primaryColor) return;

        const key = String(theme.primaryColor).toUpperCase();
        const existing = map.get(key);

        if (!existing) {
            map.set(key, theme);
            return;
        }

        if (theme.isActive && !existing.isActive) {
            map.set(key, theme);
            return;
        }

        const existingTime = Date.parse(existing.createdAt || existing.createdOn || existing.updatedAt || existing.modifiedOn || 0);
        const nextTime = Date.parse(theme.createdAt || theme.createdOn || theme.updatedAt || theme.modifiedOn || 0);

        if (nextTime > existingTime) map.set(key, theme);
    });

    return Array.from(map.values());
};

export const findThemeIndex = (themes: any[], theme: any) => {
    if (!Array.isArray(themes) || !theme) return -1;

    const byId = themes.findIndex((item) => item?._id && item._id === theme._id);
    if (byId >= 0) return byId;

    return themes.findIndex(
        (item) =>
            String(item?.primaryColor || "").toLowerCase() ===
            String(theme?.primaryColor || "").toLowerCase()
    );
};

export const getThemeKey = (theme: any) =>
    String(
        theme?._id ||
        theme?.primaryColor ||
        theme?.themeCode ||
        theme?.themeName ||
        ""
    );

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode(...chunk);
    }

    return window.btoa(binary);
};

const parsePreviewError = (error: any) => {
    const responseData = error?.response?.data;

    if (responseData instanceof ArrayBuffer) {
        try {
            const text = new TextDecoder().decode(new Uint8Array(responseData));

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

    return getErrorMessage(error, "Failed to generate preview");
};

// GET ALL REPORT THEMES
export const getAllReportThemes = createAsyncThunk(
    "reportTemplate/getAll",
    async (_, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`${THEMES_BASE_URL}/list`);

            // ⭐ UPDATED
            const records = getThemeRecords(response);
            const themes = records.map(normalizeTheme);

            return dedupeThemesByPrimaryColor(themes);
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to load report themes"));
        }
    }
);

// GET ACTIVE REPORT THEME
export const getActiveReportTheme = createAsyncThunk(
    "reportTemplate/getActive",
    async (_, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(`${THEMES_BASE_URL}/active`);
            const theme = unwrapTheme(response);

            return theme ? normalizeTheme(theme) : null;
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to load active report theme"));
        }
    }
);

// SET ACTIVE REPORT THEME
export const setActiveReportTheme = createAsyncThunk(
    "reportTemplate/setActive",
    async (themeId: string, { rejectWithValue }) => {
        try {
            const id = String(themeId || "").trim();

            if (!id) throw new Error("Theme id is required");

            const response = await professionalAxios.post(`${THEMES_BASE_URL}/set`, { themeId: id });
            const theme = unwrapTheme(response);

            return theme ? normalizeTheme(theme) : normalizeTheme({ _id: id });
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to save report theme"));
        }
    }
);

// SAVE REPORT THEME
export const saveReportTheme = createAsyncThunk(
    "reportTemplate/save",
    async (theme: any, { rejectWithValue }) => {
        try {
            if (!theme?.primaryColor) throw new Error("Theme primaryColor is required");

            const payload = {
                themeCode: String(theme?.themeCode || "").trim(),
                themeName: String(theme?.themeName || "").trim(),
                primaryColor: theme?.primaryColor,
                secondaryColor: theme?.secondaryColor,
                textColor: theme?.textColor,
                subTextColor: theme?.subTextColor,
                headerTextColor: theme?.headerTextColor,
                borderColor: theme?.borderColor,
                successColor: theme?.successColor,
                warningColor: theme?.warningColor,
                dangerColor: theme?.dangerColor,
                isDefault: !!theme?.isDefault,
                isActive: true,
            };

            const response = await professionalAxios.post(`${THEMES_BASE_URL}/save`, payload);

            return normalizeTheme(unwrapTheme(response) || payload);
        }
        catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Failed to save report theme"));
        }
    }
);

// GET REPORT PDF PREVIEW
export const getReportPdfPreview = createAsyncThunk(
    "reportTemplate/getPreview",
    async (
        {
            templateCode = REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER,
            retries = 1,
        }: {
            templateCode?: string;
            retries?: number;
        },
        { rejectWithValue }
    ) => {
        const safeTemplate =
            String(templateCode || REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER).trim() ||
            REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER;

        let lastError: any = null;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            try {
                const response = await professionalAxios.get(PREVIEW_URL, {
                    params: { templateCode: safeTemplate },
                    responseType: "arraybuffer",
                    headers: { Accept: "application/pdf" },
                });

                const buffer = response?.data;

                if (!buffer || !buffer.byteLength) {
                    throw new Error("Preview PDF not returned from server");
                }

                const base64 = arrayBufferToBase64(buffer);

                return {
                    templateCode: safeTemplate,
                    base64,
                };
            }
            catch (error: any) {
                lastError = error;

                const message = parsePreviewError(error);

                if (
                    attempt < retries &&
                    /target closed|printToPDF|INTERNAL_SERVER_ERROR|Failed to generate preview|network/i.test(message)
                ) {
                    await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
                    continue;
                }

                return rejectWithValue({
                    templateCode: safeTemplate,
                    message,
                });
            }
        }

        return rejectWithValue({
            templateCode: safeTemplate,
            message: parsePreviewError(lastError),
        });
    }
);

// STATE
const initialState: any = {
    themes: [],
    activeTheme: null,
    previews: {},
    previewLoading: {},

    // ⭐ UPDATED - same names used in ReportTemplate page
    themesLoader: false,
    activeThemeLoading: false,
    saving: false,

    error: null,
};

// SLICE
const reportTemplateSlice = createSlice({
    name: "reportTemplate",
    initialState,
    reducers: {
        clearReportPreviews: (state) => {
            state.previews = {};
            state.previewLoading = {};
        },

        clearReportPreviewByCode: (state, action) => {
            delete state.previews[action.payload];
            delete state.previewLoading[action.payload];
        },

        clearReportTemplateError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // GET ALL THEMES
            .addCase(getAllReportThemes.pending, (state) => {
                state.themesLoader = true;
                state.error = null;
            })
            .addCase(getAllReportThemes.fulfilled, (state, action) => {
                state.themesLoader = false;

                // ⭐ UPDATED
                state.themes = action.payload || [];
            })
            .addCase(getAllReportThemes.rejected, (state, action: any) => {
                state.themesLoader = false;
                state.themes = [];
                state.error = action.payload || "Failed to load report themes";
            })

            // GET ACTIVE THEME
            .addCase(getActiveReportTheme.pending, (state) => {
                state.activeThemeLoading = true;
                state.error = null;
            })
            .addCase(getActiveReportTheme.fulfilled, (state, action) => {
                state.activeThemeLoading = false;
                state.activeTheme = action.payload;
            })
            .addCase(getActiveReportTheme.rejected, (state, action: any) => {
                state.activeThemeLoading = false;
                state.error = action.payload || "Failed to load active report theme";
            })

            // SET ACTIVE THEME
            .addCase(setActiveReportTheme.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(setActiveReportTheme.fulfilled, (state, action) => {
                state.saving = false;
                state.activeTheme = action.payload;

                if (action.payload?._id) {
                    state.themes = state.themes.map((theme: any) => ({
                        ...theme,
                        isActive: theme._id === action.payload._id,
                    }));
                }
            })
            .addCase(setActiveReportTheme.rejected, (state, action: any) => {
                state.saving = false;
                state.error = action.payload || "Failed to save report theme";
            })

            // SAVE THEME
            .addCase(saveReportTheme.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(saveReportTheme.fulfilled, (state, action) => {
                state.saving = false;
                state.activeTheme = action.payload;
            })
            .addCase(saveReportTheme.rejected, (state, action: any) => {
                state.saving = false;
                state.error = action.payload || "Failed to save report theme";
            })

            // GET PDF PREVIEW
            .addCase(getReportPdfPreview.pending, (state, action) => {
                const code =
                    action.meta.arg.templateCode ||
                    REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER;

                state.previewLoading[code] = true;

                state.previews[code] = state.previews[code] || {
                    base64: "",
                    error: "",
                };

                state.previews[code].error = "";
            })
            .addCase(getReportPdfPreview.fulfilled, (state, action) => {
                const { templateCode, base64 } = action.payload;

                state.previewLoading[templateCode] = false;

                state.previews[templateCode] = {
                    base64,
                    error: "",
                };
            })
            .addCase(getReportPdfPreview.rejected, (state, action: any) => {
                const code =
                    action.payload?.templateCode ||
                    action.meta.arg.templateCode ||
                    REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER;

                state.previewLoading[code] = false;

                state.previews[code] = {
                    base64: "",
                    error:
                        action.payload?.message ||
                        action.error?.message ||
                        "Failed to load preview",
                };
            });
    },
});

export const {
    clearReportPreviews,
    clearReportPreviewByCode,
    clearReportTemplateError,
} = reportTemplateSlice.actions;

export default reportTemplateSlice.reducer;