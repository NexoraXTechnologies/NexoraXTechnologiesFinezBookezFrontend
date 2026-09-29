import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Check, RefreshCw, FileText, Loader2, Palette, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { findThemeIndex, getActiveReportTheme, getAllReportThemes, getReportPdfPreview, getThemeKey, REPORT_TEMPLATE_CODES, REPORT_TEMPLATE_OPTIONS, setActiveReportTheme } from "../../../redux/slices/professionalSlice/reportTemplateSlice";
import { clearReportPreviews } from "../../../redux/slices/professionalSlice/reportTemplateSlice";
import { buildPdfPreviewHtml } from "./html";

const DEFAULT_TEMPLATE_IDX = Math.max(0, REPORT_TEMPLATE_OPTIONS.findIndex(option => option.value === REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER));

// ⭐ UPDATED - theme classes
const PreviewLoader = ({ text = "Generating preview..." }: { text?: string }) => {
    return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-card text-card-foreground">
            <motion.div
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-muted/80 to-transparent"
                initial={{ x: "-150%" }}
                animate={{ x: "450%" }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />

            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 flex flex-col items-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
                    <motion.div
                        className="absolute inset-[7px] rounded-xl border-[3px] border-transparent border-r-primary/20 border-t-primary"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                    <FileText size={23} className="text-primary" />
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-card-foreground">{text}</span>
                </div>

                <span className="mt-1 text-[10px] text-muted-foreground">Preparing your report</span>
            </motion.div>
        </div>
    );
};

// UPDATED - theme classes
const ThemesLoader = () => {
    return (
        <div className="grid grid-cols-4 gap-x-2 gap-y-3 py-2">
            {Array.from({ length: 20 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-1.5">
                    <motion.div
                        className="h-10 w-10 rounded-full bg-muted"
                        animate={{ opacity: [0.45, 1, 0.45] }}
                        transition={{ duration: 1.3, repeat: Infinity, delay: index * 0.03 }}
                    />
                    <motion.div
                        className="h-2 w-12 rounded-full bg-muted"
                        animate={{ opacity: [0.45, 1, 0.45] }}
                        transition={{ duration: 1.3, repeat: Infinity, delay: index * 0.03 }}
                    />
                </div>
            ))}
        </div>
    );
};

const ReportTemplate = () => {
    const dispatch = useDispatch<any>();
    const previewSliderRef = useRef<HTMLDivElement | null>(null);
    const savingRef = useRef(false);
    const previewQueueRef = useRef<Promise<any>>(Promise.resolve());
    const templateIdxRef = useRef(DEFAULT_TEMPLATE_IDX);
    const previewsRef = useRef<Record<string, any>>({});

    const reportTemplateState = useSelector((state: any) => state.reportTemplate);

    const themes: any = reportTemplateState?.themes || [];
    const previews = reportTemplateState?.previews || {};
    const themesLoader = reportTemplateState?.themesLoader || false;

    const [selectedIdx, setSelectedIdx] = useState(0);
    const [selectedTheme, setSelectedTheme]:any = useState(null);
    const [templateIdx, setTemplateIdx] = useState(DEFAULT_TEMPLATE_IDX);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [applyStatus, setApplyStatus] = useState("");
    const [pageError, setPageError] = useState("");

    useEffect(() => {
        previewsRef.current = previews;
    }, [previews]);

    const setTemplateIndex = useCallback((idx: number) => {
        const next = Math.max(0, Math.min(idx, REPORT_TEMPLATE_OPTIONS.length - 1));
        templateIdxRef.current = next;
        setTemplateIdx(next);
        return next;
    }, []);

    // UPDATED - one preview request at a time
    const enqueuePreviewJob = useCallback((job: () => Promise<any>) => {
        const run = previewQueueRef.current.then(job, job);
        previewQueueRef.current = run.catch(() => { });
        return run;
    }, []);

    const loadPreview = useCallback(async (code: string, { showOverlay = true, force = false } = {}) => {
        const safeCode = String(code || REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER).trim() || REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER;

        return enqueuePreviewJob(async () => {
            const cached = previewsRef.current?.[safeCode];

            if (!force && cached?.base64) return cached.base64;

            const isCurrent = REPORT_TEMPLATE_OPTIONS[templateIdxRef.current]?.value === safeCode;

            if (showOverlay && isCurrent) setPreviewLoading(true);

            try {
                const result = await dispatch(getReportPdfPreview({ templateCode: safeCode, retries: 1 })).unwrap();

                previewsRef.current = {
                    ...previewsRef.current,
                    [safeCode]: { base64: result.base64, error: "" }
                };

                return result.base64;
            } catch (error: any) {
                const message = error?.message || error || "Failed to load preview";

                previewsRef.current = {
                    ...previewsRef.current,
                    [safeCode]: { base64: "", error: message }
                };

                return null;
            } finally {
                if (REPORT_TEMPLATE_OPTIONS[templateIdxRef.current]?.value === safeCode) setPreviewLoading(false);
            }
        });
    },
        [dispatch, enqueuePreviewJob]
    );

    const ensureTemplatePreview = useCallback(
        async (code: string, { showOverlay = true, force = false } = {}) => {
            const safeCode = String(code || REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER).trim() || REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER;
            const cached = previewsRef.current?.[safeCode];

            if (!force && cached?.base64) return;

            await loadPreview(safeCode, { showOverlay, force });
        },
        [loadPreview]
    );

    const reloadVisibleThenWarm = useCallback(
        async (preferCode?: string) => {
            const current = preferCode || REPORT_TEMPLATE_OPTIONS[templateIdxRef.current]?.value || REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER;

            previewsRef.current = {};
            dispatch(clearReportPreviews());

            await loadPreview(current, { showOverlay: true, force: true });

            const other = REPORT_TEMPLATE_OPTIONS.find(option => option.value !== current);

            if (other) await loadPreview(other.value, { showOverlay: false, force: true });
        },
        [dispatch, loadPreview]
    );

    const applyTheme = useCallback(
        async (theme: any, idx: number) => {
            if (!theme?._id || savingRef.current) return;

            if (selectedTheme?._id === theme._id && selectedTheme?.isActive) {
                setSelectedIdx(idx);
                setSelectedTheme({ ...theme, isActive: true });
                return;
            }

            savingRef.current = true;
            setSaving(true);
            setPreviewLoading(true);
            setApplyStatus("Saving...");
            setSelectedIdx(idx);
            setSelectedTheme(theme);
            setPageError("");

            try {
                const saved = await dispatch(setActiveReportTheme(theme._id)).unwrap();

                localStorage.setItem("pdfPrimaryColor", saved?.primaryColor || theme.primaryColor);

                setApplyStatus("Applying...");

                const [resolvedActive, list] = await Promise.all([
                    dispatch(getActiveReportTheme()).unwrap().catch(() => null),
                    dispatch(getAllReportThemes()).unwrap().catch(() => [])
                ]);

                const nextList = list?.length ? list : themes;
                const nextActive = resolvedActive || (saved?._id ? saved : null) || { ...theme, isActive: true };
                const nextIdx = Math.max(0, findThemeIndex(nextList, nextActive));

                setSelectedTheme(nextActive);
                setSelectedIdx(nextIdx);

                await reloadVisibleThenWarm(REPORT_TEMPLATE_OPTIONS[templateIdxRef.current]?.value);
            } catch (error: any) {
                setPageError(error?.message || error || "Failed to save theme");
                setPreviewLoading(false);
            } finally {
                savingRef.current = false;
                setSaving(false);
                setApplyStatus("");
            }
        },
        [dispatch, reloadVisibleThenWarm, selectedTheme, themes]
    );

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                setPageError("");

                const [list, active] = await Promise.all([
                    dispatch(getAllReportThemes()).unwrap(),
                    dispatch(getActiveReportTheme()).unwrap().catch(() => null)
                ]);

                if (!mounted) return;

                const resolvedActive = active || list.find((theme: any) => theme.isActive) || list[0] || null;

                setSelectedTheme(resolvedActive);
                setSelectedIdx(resolvedActive ? Math.max(0, findThemeIndex(list, resolvedActive)) : 0);

                await reloadVisibleThenWarm(REPORT_TEMPLATE_CODES.DEFAULT_VOUCHER);
            } catch (error: any) {
                if (!mounted) return;
                setPageError(error?.message || error || "Failed to load report themes");
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [dispatch, reloadVisibleThenWarm]);

    const selectTheme = useCallback(
        (idx: number) => {
            if (idx < 0 || idx >= themes.length || savingRef.current) return;

            const nextTheme = themes[idx];
            if (!nextTheme?._id) return;

            setSelectedIdx(idx);
            setSelectedTheme(nextTheme);
            applyTheme(nextTheme, idx);
        },
        [applyTheme, themes]
    );

    const selectTemplate = useCallback(
        (idx: number) => {
            if (savingRef.current) return;

            const next = setTemplateIndex(idx);
            const slider = previewSliderRef.current;

            if (slider) slider.scrollTo({ left: slider.clientWidth * next, behavior: "smooth" });

            const code = REPORT_TEMPLATE_OPTIONS[next]?.value;

            if (code) ensureTemplatePreview(code, { showOverlay: true });
        },
        [ensureTemplatePreview, setTemplateIndex]
    );

    const handleTemplateScroll = useCallback(() => {
        if (savingRef.current || !previewSliderRef.current) return;

        const slider = previewSliderRef.current;
        const width = slider.clientWidth;

        if (!width) return;

        const index = Math.round(slider.scrollLeft / width);
        const clamped = Math.max(0, Math.min(index, REPORT_TEMPLATE_OPTIONS.length - 1));

        if (clamped === templateIdxRef.current) return;

        setTemplateIndex(clamped);

        const code = REPORT_TEMPLATE_OPTIONS[clamped]?.value;

        if (code) ensureTemplatePreview(code, { showOverlay: true });
    }, [ensureTemplatePreview, setTemplateIndex]);

    const activeColor = selectedTheme?.primaryColor || "#9CA3AF";
    const activeName = selectedTheme?.themeName || "Select theme";
    const isBusy = previewLoading || saving;
    const isApplied = !!selectedTheme?.isActive && !saving;
    const activeTemplate = REPORT_TEMPLATE_OPTIONS[templateIdx];
    const themeKey = getThemeKey(selectedTheme);

    return (
        // ⭐ UPDATED - theme classes
        <div className="flex h-[calc(100vh-70px)] min-h-0 flex-col overflow-hidden bg-background text-foreground">
            {/* HEADER */}
            <div className="flex h-[64px] shrink-0 items-center gap-3 border-b border-border bg-card px-5 text-card-foreground">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.history.back()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted hover:text-card-foreground"
                >
                    <ArrowLeft size={18} />
                </motion.button>

                <div className="min-w-0">
                    <h2 className="text-[17px] font-bold tracking-[-0.01em] text-card-foreground">Report Template</h2>
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">Choose a layout and customize the appearance of your reports</p>
                </div>
            </div>

            {/* MAIN */}
            <div className="min-h-0 flex-1 overflow-hidden p-3">
                <div className="mx-auto grid h-full max-w-[1550px] grid-cols-[minmax(0,1fr)_410px] gap-3">
                    {/* PREVIEW PANEL */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
                    >
                        {/* PREVIEW HEADER */}
                        <div className="flex h-[55px] shrink-0 items-center justify-between gap-3 border-b border-border px-4">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <FileText size={16} />
                                </div>

                                <div className="min-w-0">
                                    <div className="truncate text-xs font-bold text-card-foreground">{activeTemplate?.label || "Template"}</div>
                                    <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">Live document preview</div>
                                </div>
                            </div>

                            {/* ⭐ UPDATED - theme classes */}
                            <div className="flex items-center rounded-lg border border-border bg-muted p-0.5">
                                {REPORT_TEMPLATE_OPTIONS.map((option, idx) => {
                                    const active = idx === templateIdx;

                                    return (
                                        <motion.button
                                            type="button"
                                            key={option.value}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => selectTemplate(idx)}
                                            disabled={saving}
                                            className={`relative rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${active ? "text-card-foreground" : "text-muted-foreground hover:text-card-foreground"} ${saving ? "cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                            {active && (
                                                <motion.span
                                                    layoutId="template-tab"
                                                    className="absolute inset-0 rounded-md border border-border bg-card shadow-sm"
                                                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                                                />
                                            )}

                                            <span className="relative z-10">{option.label}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* PREVIEW */}
                        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/60 p-2.5">
                            {/* PDF document stays white intentionally */}
                            <div className="relative mx-auto h-full max-w-[1000px] overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                                <div
                                    ref={previewSliderRef}
                                    className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                    onScroll={handleTemplateScroll}
                                >
                                    {REPORT_TEMPLATE_OPTIONS.map(item => {
                                        const entry = previews?.[item.value] || { base64: "", error: "" };

                                        return (
                                            <div className="h-full min-w-full flex-[0_0_100%] snap-start bg-white" key={item.value}>
                                                {entry?.error && !entry?.base64 ? (
                                                    <div className="flex h-full w-full flex-col items-center justify-center bg-card px-6 text-center text-card-foreground">
                                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                                                            <FileText size={23} />
                                                        </div>

                                                        <div className="mt-3 text-xs font-bold text-card-foreground">Unable to generate preview</div>
                                                        <p className="mt-1 max-w-md text-[11px] leading-4 text-muted-foreground">{entry.error}</p>

                                                        <motion.button
                                                            type="button"
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.96 }}
                                                            onClick={() => loadPreview(item.value, { showOverlay: true, force: true })}
                                                            className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground"
                                                        >
                                                            <RefreshCw size={13} />
                                                            Retry Preview
                                                        </motion.button>
                                                    </div>
                                                ) : entry?.base64 ? (
                                                    <iframe
                                                        key={`preview-${item.value}-${themeKey}-${activeColor}`}
                                                        title={`${item.label} Preview`}
                                                        srcDoc={buildPdfPreviewHtml(entry.base64)}
                                                        className="h-full w-full border-0 bg-white pointer-events-none"
                                                    />
                                                ) : (
                                                    <PreviewLoader />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <AnimatePresence>
                                    {isBusy && (
                                        <motion.div
                                            key="preview-loader"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                            className="absolute inset-0 z-30"
                                        >
                                            <PreviewLoader text={saving ? applyStatus || "Applying theme..." : "Generating preview..."} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* PREVIEW FOOTER */}
                        <div className="flex h-[42px] shrink-0 items-center justify-between border-t border-border bg-card px-4">
                            <div className="flex min-w-0 items-center gap-2">
                                <div className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: activeColor }} />
                                <span className="max-w-[240px] truncate text-[10px] font-semibold text-card-foreground">{activeName}</span>

                                {selectedTheme?.primaryColor && (
                                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground">
                                        {selectedTheme.primaryColor}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5">
                                {REPORT_TEMPLATE_OPTIONS.map((option, idx) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        onClick={() => selectTemplate(idx)}
                                        disabled={saving}
                                        aria-label={option.label}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === templateIdx ? "w-5" : "w-1.5 bg-muted-foreground/30"}`}
                                        style={idx === templateIdx ? { backgroundColor: activeColor } : undefined}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* THEME PANEL */}
                    <motion.div
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: 0.03 }}
                        className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
                    >
                        {/* ACTIVE THEME */}
                        <div className="flex min-h-[68px] shrink-0 items-center border-b border-border px-3.5">
                            <div className="flex w-full items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <motion.div
                                        key={activeColor}
                                        initial={{ scale: 0.85, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${activeColor}18`, color: activeColor }}
                                    >
                                        <Palette size={18} />
                                    </motion.div>

                                    <div className="min-w-0">
                                        <div className="max-w-[185px] truncate text-xs font-bold text-card-foreground">{activeName}</div>

                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <span className="text-[9px] font-medium text-muted-foreground">Active theme</span>

                                            {selectedTheme?.primaryColor && (
                                                <span className="rounded bg-muted px-1 py-0.5 font-mono text-[8px] font-bold text-muted-foreground">
                                                    {selectedTheme.primaryColor}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {saving || applyStatus ? (
                                        <motion.div
                                            key="saving"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-[9px] font-bold text-warning"
                                        >
                                            <Loader2 size={10} className="animate-spin" />
                                            {applyStatus || "Saving"}
                                        </motion.div>
                                    ) : isApplied ? (
                                        <motion.div
                                            key="applied"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[9px] font-bold text-success"
                                        >
                                            <Check size={10} strokeWidth={3} />
                                            Applied
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ERROR */}
                        <AnimatePresence>
                            {pageError && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="shrink-0 overflow-hidden"
                                >
                                    <div className="mx-3 mt-2 rounded-lg border border-danger/20 bg-danger/10 px-2.5 py-2 text-[10px] font-medium text-danger">
                                        {pageError}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* THEME TITLE */}
                        <div className="flex h-[46px] shrink-0 items-center justify-between px-3.5">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Color Themes</div>
                                <div className="mt-0.5 text-[9px] font-medium text-muted-foreground">Select a color to apply</div>
                            </div>

                            {!themesLoader && themes.length > 0 && (
                                <div className="rounded-md bg-muted px-2 py-1 text-[9px] font-bold text-muted-foreground">
                                    {themes.length} Themes
                                </div>
                            )}
                        </div>

                        {/* THEME GRID */}
                        <div className="min-h-0 flex-1 overflow-hidden px-2.5 pb-2">
                            {themesLoader ? (
                                <ThemesLoader />
                            ) : themes.length > 0 ? (
                                <div className="grid h-full content-start grid-cols-4 gap-x-1 gap-y-1">
                                    {themes.map((theme:any, index:any) => {
                                        const active = index === selectedIdx;

                                        return (
                                            <motion.button
                                                type="button"
                                                key={`theme-${theme?._id || theme?.primaryColor}-${index}`}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.16, delay: Math.min(index * 0.012, 0.15) }}
                                                whileHover={saving ? undefined : { y: -1 }}
                                                whileTap={saving ? undefined : { scale: 0.96 }}
                                                onClick={() => selectTheme(index)}
                                                disabled={saving}
                                                className={`group flex min-w-0 flex-col items-center rounded-lg px-1 py-1.5 transition-colors ${active ? "bg-muted" : "hover:bg-muted/70"} ${saving ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                            >
                                                <div
                                                    className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full border-2 p-[2px] transition-all duration-200"
                                                    style={{
                                                        borderColor: active ? theme.primaryColor || "#9CA3AF" : "transparent",
                                                        boxShadow: active ? `0 3px 10px ${theme.primaryColor}35` : "none"
                                                    }}
                                                >
                                                    <motion.span
                                                        animate={{ scale: active ? 1 : 0.96 }}
                                                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                                                        className="flex h-full w-full items-center justify-center rounded-full shadow-md"
                                                        style={{ backgroundColor: theme.primaryColor || "#9CA3AF" }}
                                                    >
                                                        <AnimatePresence>
                                                            {active && (
                                                                <motion.span
                                                                    initial={{ scale: 0, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    exit={{ scale: 0, opacity: 0 }}
                                                                >
                                                                    <Check size={15} strokeWidth={3} className="text-white" />
                                                                </motion.span>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.span>
                                                </div>

                                                <span className={`mt-1 min-h-[23px] w-full break-words text-center text-[8.5px] leading-[11px] ${active ? "font-bold text-card-foreground" : "font-semibold text-muted-foreground group-hover:text-card-foreground"}`}>
                                                    {theme.themeName || "Theme"}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                        <Palette size={21} />
                                    </div>
                                    <div className="mt-2 text-xs font-bold text-card-foreground">No themes found</div>
                                </div>
                            )}
                        </div>

                        {/* FOOTER */}
                        <div className="flex h-[38px] shrink-0 items-center justify-between border-t border-border bg-muted/50 px-3.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: activeColor }} />
                                <span className="max-w-[210px] truncate text-[9px] font-semibold text-card-foreground">{activeName}</span>
                            </div>

                            <span className="text-[9px] font-medium text-muted-foreground">Click to apply</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ReportTemplate;