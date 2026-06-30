const n = (v: any, fallback: number) => {
    const num = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : fallback;
};

export const REF_LENGTH_MM = 7500;
export const REF_HEIGHT_MM = 1558;
export const REF_DRAW_W = 810;
export const REF_DRAW_H = 150;
export const PX_PER_MM = REF_DRAW_W / REF_LENGTH_MM;
export const PDF_MAX_FRAME_W = 480;

export function computeChassisDrawingLayout(bomData: any = {}, options: any = {}) {
    const { forPdf = false } = options;

    const d = bomData?.dimensions || {};
    const c = bomData?.calculated || {};

    const totalLength = Math.max(n(d.totalLength || c.totalLength, 7500), 1);

    const trailerHeight = Math.max(
        n(
            d.trailerHeight || d.deckHeight || d.totalHeight || c.trailerHeight,
            1558
        ),
        1
    );

    const supportCount = Math.max(
        n(
            d.supportCount ||
                d.crossMemberCount ||
                c.supportCount ||
                c.crossMemberCount,
            6
        ),
        1
    );

    const pillarCount = Math.max(
        n(d.pillarCount || c.pillarCount, n(d.crossMemberCount, 8) + 2),
        2
    );

    const sideRailCount = Math.max(n(d.sideRailCount || c.sideRailCount, 5), 2);
    const axleCount = Math.max(n(d.axleCount || c.axleCount, 3), 1);
    const axleSpacing = n(d.axleSpacing || c.axleSpacing, 1540);

    const rearOverhang = n(
        d.rearOverhang || c.rearOverhang,
        Math.round(totalLength * 0.1)
    );

    const axleGroupLength = (axleCount - 1) * axleSpacing;

    const frontOverhang = n(
        d.suspensionStartPosition ||
            d.frontOverhang ||
            c.suspensionStartPosition ||
            c.frontOverhang,
        totalLength - axleGroupLength - rearOverhang
    );

    const frameX = 45;
    const frameY = 82;

    const rawFrameW = Math.max(totalLength * PX_PER_MM, 48);

    const frameW =
        forPdf && rawFrameW > PDF_MAX_FRAME_W ? PDF_MAX_FRAME_W : rawFrameW;

    const frameH = Math.max(trailerHeight * (REF_DRAW_H / REF_HEIGHT_MM), 28);

    const px = frameW / totalLength;

    const mmX = (mm: any) => frameX + n(mm, 0) * px;

    const pillarPositionsMm = Array.from({ length: pillarCount }, (_, i) =>
        pillarCount <= 1 ? 0 : (i * totalLength) / (pillarCount - 1)
    );

    const supportPositionsMm = Array.from({ length: supportCount }, (_, i) => {
        if (supportCount <= 1) return totalLength / 2;

        const inset = Math.min(45, frameW * 0.06) / px;
        const span = Math.max(totalLength - inset * 2, 1);

        return inset + (i * span) / (supportCount - 1);
    });

    const railGap = frameH / (sideRailCount + 1);

    const axleCentersX = Array.from({ length: axleCount }, (_, i) => {
        const mm = frontOverhang + i * axleSpacing;
        return mmX(mm);
    });

    const wheelY = frameY + frameH + 105;
    const wheelR = Math.min(42, Math.max(10, frameW * 0.055));
    const pillarW = Math.min(14, Math.max(4, frameW / pillarCount / 2.5));
    const dimY = wheelY + wheelR + 28;
    const svgW = Math.max(frameX + frameW + 50, 320);
    const svgH = dimY + 50;

    return {
        totalLength,
        trailerHeight,
        pillarCount,
        sideRailCount,
        axleCount,
        axleSpacing,
        frontOverhang,
        rearOverhang,
        frameX,
        frameY,
        frameW,
        frameH,
        px,
        pillarPositionsMm,
        supportPositionsMm,
        railGap,
        axleCentersX,
        wheelY,
        wheelR,
        pillarW,
        supportCount,
        mmX,
        dimY,
        svgW,
        svgH,
    };
}