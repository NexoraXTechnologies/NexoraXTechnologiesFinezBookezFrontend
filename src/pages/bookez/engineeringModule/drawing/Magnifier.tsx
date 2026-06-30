import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Minus, Plus, Search } from "lucide-react";

const LOUPE_SIZE = 130;
const LOUPE_ZOOM = 2.2;
const DEFAULT_ZOOM = 1.25;

const Magnifier = ({
    children,
    contentWidth = 820,
    contentHeight = 430,
    minZoom = 0.35,
    maxZoom = 3.5,
    footer = null,
}: any) => {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const drawingRef = useRef<HTMLDivElement | null>(null);

    const [scale, setScale] = useState(1);
    const [fitScale, setFitScale] = useState(1);
    const [magnifierOn, setMagnifierOn] = useState(false);
    const [loupe, setLoupe] = useState<any>(null);

    const computeFitScale = useCallback(() => {
        const width = wrapRef.current?.clientWidth || window.innerWidth;
        const availableH = window.innerHeight * 0.55;
        const pad = 36;

        const sx = (width - pad) / contentWidth;
        const sy = (availableH - pad) / contentHeight;

        return Math.min(sx, sy, 1);
    }, [contentWidth, contentHeight]);

    // useEffect(() => {
    //     const applyFit = () => {
    //         const fit = computeFitScale();
    //         setFitScale(fit);
    //         setScale(fit);
    //     };

    //     applyFit();

    //     window.addEventListener("resize", applyFit);

    //     return () => {
    //         window.removeEventListener("resize", applyFit);
    //     };
    // }, [computeFitScale]);

    useEffect(() => {
    const applyDefaultZoom = () => {
        const fit = computeFitScale();
        const defaultScale = Math.min(maxZoom, Math.max(minZoom, fit * DEFAULT_ZOOM));

        setFitScale(fit);
        setScale(Math.round(defaultScale * 100) / 100);
    };

    applyDefaultZoom();

    window.addEventListener("resize", applyDefaultZoom);

    return () => {
        window.removeEventListener("resize", applyDefaultZoom);
    };
}, [computeFitScale, minZoom, maxZoom]);

    const scaledW = contentWidth * scale;
    const scaledH = contentHeight * scale;

    const renderScaled = useCallback(
        (zoom = scale) => {
            if (!React.isValidElement(children)) return children;

            return React.cloneElement(children as any, {
                width: contentWidth * zoom,
                height: contentHeight * zoom,
            });
        },
        [children, contentWidth, contentHeight, scale]
    );

    const zoomBy = (factor: number) => {
        setScale((prev) => {
            const next = Math.min(maxZoom, Math.max(minZoom, prev * factor));
            return Math.round(next * 100) / 100;
        });
    };

    const resetZoom = () => {
        setScale(fitScale);
    };

    const updateLoupe = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (!magnifierOn || !drawingRef.current) return;

            const rect = drawingRef.current.getBoundingClientRect();

            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;

            if (
                localX < 0 ||
                localY < 0 ||
                localX > scaledW ||
                localY > scaledH
            ) {
                setLoupe(null);
                return;
            }

            const svgX = localX / scale;
            const svgY = localY / scale;

            let loupeX = event.clientX - LOUPE_SIZE / 2;
            let loupeY = event.clientY - LOUPE_SIZE - 28;

            if (loupeY < 80) {
                loupeY = event.clientY + 28;
            }

            loupeX = Math.max(
                8,
                Math.min(window.innerWidth - LOUPE_SIZE - 8, loupeX)
            );

            setLoupe({
                loupeX,
                loupeY,
                svgX,
                svgY,
            });
        },
        [magnifierOn, scaledW, scaledH, scale]
    );

    const zoomLabel = useMemo(() => {
        if (!fitScale) return "100%";
        return `${Math.round((scale / fitScale) * 100)}%`;
    }, [scale, fitScale]);

    return (
        <div ref={wrapRef} className="relative flex h-full flex-col px-4 pb-4">
            <div className="mt-2 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <button
                    type="button"
                    onClick={() => zoomBy(0.8)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900 transition hover:bg-slate-200"
                >
                    <Minus size={18} />
                </button>

                <button
                    type="button"
                    onClick={resetZoom}
                    className="flex min-w-16 flex-col items-center justify-center px-3"
                >
                    <span className="text-sm font-black text-slate-900">
                        {zoomLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                        Click to fit
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => zoomBy(1.25)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900 transition hover:bg-slate-200"
                >
                    <Plus size={18} />
                </button>

                <div className="mx-1 h-7 w-px bg-slate-200" />

                <button
                    type="button"
                    onClick={() => {
                        setMagnifierOn((prev) => !prev);
                        setLoupe(null);
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${magnifierOn
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                        }`}
                >
                    <Search size={18} />
                </button>
            </div>

            <p className="mb-1 mt-1.5 text-center text-xs font-semibold text-slate-500">
                {magnifierOn
                    ? "Move on the drawing to magnify"
                    : "Use +/− to zoom • Scroll when zoomed in"}
            </p>

            <div
                className="min-h-[420px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white"
                onMouseMove={updateLoupe}
                onMouseLeave={() => setLoupe(null)}
            >
                <div className="h-full w-full overflow-auto">
                    <div className="flex min-h-full min-w-full items-center justify-center p-3">
                        <div
                            ref={drawingRef}
                            style={{
                                width: scaledW,
                                height: scaledH,
                            }}
                        >
                            {renderScaled()}
                        </div>
                    </div>
                </div>
            </div>

            {footer}

            {loupe ? (
                <div
                    className="pointer-events-none fixed z-[9999] rounded-full bg-white shadow-xl"
                    style={{
                        left: loupe.loupeX,
                        top: loupe.loupeY,
                        width: LOUPE_SIZE,
                        height: LOUPE_SIZE,
                    }}
                >
                    <div className="h-full w-full overflow-hidden rounded-full bg-slate-50">
                        <div
                            style={{
                                width: contentWidth * LOUPE_ZOOM * scale,
                                height: contentHeight * LOUPE_ZOOM * scale,
                                transform: `translate(${LOUPE_SIZE / 2 -
                                    loupe.svgX * scale * LOUPE_ZOOM
                                    }px, ${LOUPE_SIZE / 2 -
                                    loupe.svgY * scale * LOUPE_ZOOM
                                    }px)`,
                            }}
                        >
                            {renderScaled(LOUPE_ZOOM * scale)}
                        </div>
                    </div>

                    <div className="absolute inset-0 rounded-full border-[3px] border-primary" />
                </div>
            ) : null}
        </div>
    );
};

export default Magnifier;