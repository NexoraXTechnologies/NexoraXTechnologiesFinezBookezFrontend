import { computeChassisDrawingLayout } from "./chassisDrawingLayout";

const esc = (v: any) => String(v ?? "");

const toNum = (value: any, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const dimLineHtml = (
    x1: number,
    x2: number,
    y: number,
    label: any,
    options: any = {}
) => {
    const labelY = options.labelY ?? y - 8;
    const stroke = options.stroke || "currentColor";
    const fontSize = options.fontSize || 13;
    const weight = options.weight || 500;

    return `
        <line
            x1="${x1}"
            y1="${y}"
            x2="${x2}"
            y2="${y}"
            stroke="${stroke}"
            stroke-width="1"
        />

        <polygon
            points="${x1},${y} ${x1 + 7},${y - 4} ${x1 + 7},${y + 4}"
            fill="${stroke}"
        />

        <polygon
            points="${x2},${y} ${x2 - 7},${y - 4} ${x2 - 7},${y + 4}"
            fill="${stroke}"
        />

        <text
            x="${(x1 + x2) / 2}"
            y="${labelY}"
            font-size="${fontSize}"
            font-weight="${weight}"
            text-anchor="middle"
            fill="currentColor"
        >
            ${esc(label)}
        </text>
    `;
};

const verticalDimLineHtml = (
    x: number,
    y1: number,
    y2: number,
    label: any
) => `
    <line
        x1="${x}"
        y1="${y1}"
        x2="${x}"
        y2="${y2}"
        stroke="currentColor"
        stroke-width="1"
    />

    <polygon
        points="${x},${y1} ${x - 5},${y1 + 8} ${x + 5},${y1 + 8}"
        fill="currentColor"
    />

    <polygon
        points="${x},${y2} ${x - 5},${y2 - 8} ${x + 5},${y2 - 8}"
        fill="currentColor"
    />

    <text
        x="${x - 13}"
        y="${(y1 + y2) / 2}"
        font-size="13"
        font-weight="500"
        text-anchor="middle"
        fill="currentColor"
        transform="rotate(-90 ${x - 13} ${(y1 + y2) / 2})"
    >
        ${esc(label)}
    </text>
`;

export function buildChassisDrawingSvgHtml(
    bomData: any = {},
    options: any = {}
) {
    const L = computeChassisDrawingLayout(bomData, options);

    const d = bomData?.dimensions || {};
    const c = bomData?.calculated || {};

    /*
        Dynamic version of the commented design:
        - same visual structure
        - values come from current input / computed layout
        - no fixed dependency on only 10998 / 1558 / 1540
    */

    const svgW = 1180;
    const svgH = 560;

    const frameX = 78;
    const frameY = 70;
    const frameH = 150;

    const frontEndW = 30;
    const rearEndW = 30;
    const marginRight = 42;

    const frameW = svgW - frameX - marginRight - 22;
    const bodyEndX = frameX + frameW;

    const totalLength = toNum(
        L.totalLength || d.totalLength || c.totalLength,
        10998
    );

    const trailerHeight = toNum(
        L.trailerHeight ||
            d.totalHeight ||
            d.deckHeight ||
            d.trailerHeight ||
            c.trailerHeight,
        1558
    );

    const sideRailCount = Math.max(
        toNum(L.sideRailCount || d.sideRailCount || c.sideRailCount, 8),
        4
    );

    const axleCount = Math.max(
        toNum(L.axleCount || d.axleCount || c.axleCount, 3),
        1
    );

    const axleSpacing = toNum(
        L.axleSpacing || d.axleSpacing || c.axleSpacing,
        1540
    );

    const frontOverhangInput = toNum(
        L.frontOverhang || d.frontOverhang || c.frontOverhang,
        totalLength * 0.55
    );

    const rearOverhangInput = toNum(
        L.rearOverhang || d.rearOverhang || c.rearOverhang,
        totalLength * 0.12
    );

    const mmX = (mm: number) => {
        return frameX + (mm / totalLength) * frameW;
    };

    const topDimY = 32;
    const railGap = frameH / (sideRailCount + 1);

    const wheelR = 52;
    const wheelY = frameY + frameH + 92;

    const bottomBaseY = wheelY + wheelR + 10;
    const bottomDimY = bottomBaseY + 46;
    const noteY = bottomDimY + 58;

    const railLines = Array.from({ length: sideRailCount }, (_, i) => {
        const y = frameY + railGap * (i + 1);
        const sw = i === 0 || i === sideRailCount - 1 ? 1.4 : 1;

        return `
            <line
                x1="${frameX}"
                y1="${y}"
                x2="${bodyEndX}"
                y2="${y}"
                stroke="currentColor"
                stroke-width="${sw}"
            />
        `;
    }).join("");

    const computedPillars = Array.isArray(L.pillarPositionsMm)
        ? L.pillarPositionsMm
        : [];

    const pillarCount = Math.max(
        computedPillars.length ||
            toNum(d.crossMemberCount || d.pillarCount || c.pillarCount, 10),
        2
    );

    const pillarPositions = Array.from({ length: pillarCount }, (_, i) => {
        if (computedPillars[i] !== undefined) {
            return computedPillars[i];
        }

        return (totalLength / (pillarCount - 1)) * i;
    });

    const pillarW = 18;

    const pillars = pillarPositions
        .map((mm: number) => {
            const x = mmX(mm);

            return `
                <g>
                    <rect
                        x="${x - pillarW / 2}"
                        y="${frameY}"
                        width="${pillarW}"
                        height="${frameH}"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                    />
                </g>
            `;
        })
        .join("");

    /*
        Hangers below rail.
        Position is based on gaps between pillars, so it stays dynamic.
    */
    const hangerPositions = pillarPositions
        .slice(0, -1)
        .map((mm: number, i: number) => (mm + pillarPositions[i + 1]) / 2);

    const hangers = hangerPositions
        .map((mm: number) => {
            const x = mmX(mm);
            const y = frameY + frameH + 4;

            return `
                <g>
                    <path
                        d="M ${x - 10} ${y}
                           L ${x + 10} ${y}
                           L ${x + 6} ${y + 20}
                           L ${x + 2} ${y + 24}
                           L ${x - 2} ${y + 24}
                           L ${x - 6} ${y + 20}
                           Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1"
                    />

                    <line
                        x1="${x - 6}"
                        y1="${y + 4}"
                        x2="${x + 4}"
                        y2="${y + 22}"
                        stroke="currentColor"
                        stroke-width="0.8"
                    />

                    <line
                        x1="${x + 6}"
                        y1="${y + 4}"
                        x2="${x - 4}"
                        y2="${y + 22}"
                        stroke="currentColor"
                        stroke-width="0.8"
                    />
                </g>
            `;
        })
        .join("");

    /*
        Bolts near front side, same commented-design style.
        Dynamic end point uses 4th pillar when available.
    */
    const boltsEndX = mmX(pillarPositions[3] ?? totalLength * 0.46);
    const boltsStartX = frameX + 18;
    const boltsCount = 14;

    const bolts = Array.from({ length: boltsCount }, (_, i) => {
        const cx =
            boltsCount <= 1
                ? boltsStartX
                : boltsStartX +
                  i * ((boltsEndX - boltsStartX) / (boltsCount - 1));

        const cy = frameY + frameH + (i % 2 === 0 ? 12 : 25);

        return `
            <circle
                cx="${cx}"
                cy="${cy}"
                r="2.6"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
            />
        `;
    }).join("");

    /*
        Axle positions dynamic:
        - use calculated axle centers when available
        - otherwise calculate using front overhang + axle spacing
        - clamp so wheels stay inside body
    */
    const maxFirstAxle =
        totalLength - (axleCount - 1) * axleSpacing - rearOverhangInput;

    const firstAxleMm = Math.max(
        totalLength * 0.25,
        Math.min(frontOverhangInput, maxFirstAxle)
    );

    const axleCentersMm = Array.from({ length: axleCount }, (_, i) => {
        const computedAxleX = Array.isArray(L.axleCentersX)
            ? L.axleCentersX[i]
            : null;

        if (computedAxleX !== null && computedAxleX !== undefined && L.frameW) {
            const ratio = (computedAxleX - L.frameX) / L.frameW;
            const mm = ratio * totalLength;

            if (Number.isFinite(mm) && mm > 0 && mm < totalLength) {
                return mm;
            }
        }

        return firstAxleMm + i * axleSpacing;
    }).filter((mm) => mm >= 0 && mm <= totalLength);

    const safeAxleCentersMm =
        axleCentersMm.length > 0 ? axleCentersMm : [firstAxleMm];

    const lastAxleMm = safeAxleCentersMm[safeAxleCentersMm.length - 1];
    const lastSegment = Math.max(totalLength - lastAxleMm, 0);

    const wheels = safeAxleCentersMm
        .map((mm: number) => {
            const cx = mmX(mm);

            return `
                <circle
                    cx="${cx}"
                    cy="${wheelY}"
                    r="${wheelR}"
                    fill="none"
                    stroke="currentColor"
                    opacity="0.65"
                    stroke-width="1.4"
                />
            `;
        })
        .join("");

    const bottomDimSegments = [
        {
            start: 0,
            end: safeAxleCentersMm[0],
            label: Math.round(safeAxleCentersMm[0]),
        },
        ...safeAxleCentersMm.slice(0, -1).map((mm: number, i: number) => {
            const next = safeAxleCentersMm[i + 1];

            return {
                start: mm,
                end: next,
                label: Math.round(next - mm),
            };
        }),
        {
            start: lastAxleMm,
            end: totalLength,
            label: Math.round(lastSegment),
        },
    ].filter((item) => item.end > item.start);

    const bottomDims = bottomDimSegments
        .map((item) =>
            dimLineHtml(mmX(item.start), mmX(item.end), bottomDimY, item.label, {
                labelY: bottomDimY - 7,
                fontSize: 12,
                weight: 500,
            })
        )
        .join("");

    const chassisPath = `
        M ${frameX - frontEndW + 3} ${frameY + frameH + 10}
        C ${frameX - 10} ${frameY + frameH + 22},
          ${frameX + 18} ${frameY + frameH + 20},
          ${frameX + 46} ${frameY + frameH + 18}

        L ${frameX + frameW * 0.18} ${frameY + frameH + 18}

        C ${frameX + frameW * 0.21} ${frameY + frameH + 22},
          ${frameX + frameW * 0.24} ${frameY + frameH + 35},
          ${frameX + frameW * 0.28} ${frameY + frameH + 38}

        L ${bodyEndX + rearEndW - 6} ${frameY + frameH + 38}
        L ${bodyEndX + rearEndW - 6} ${frameY + frameH + 58}
        L ${frameX + frameW * 0.28} ${frameY + frameH + 58}

        C ${frameX + frameW * 0.22} ${frameY + frameH + 58},
          ${frameX + frameW * 0.18} ${frameY + frameH + 32},
          ${frameX + frameW * 0.11} ${frameY + frameH + 24}

        L ${frameX - frontEndW + 3} ${frameY + frameH + 24}
        Z
    `;

    const frontEnd = `
        <g>
            <rect
                x="${frameX - frontEndW}"
                y="${frameY}"
                width="${frontEndW}"
                height="${frameH + 45}"
                fill="none"
                stroke="currentColor"
                stroke-width="1.4"
            />

            <path
                d="M ${frameX - frontEndW} ${frameY + frameH + 2}
                   C ${frameX - 20} ${frameY + frameH + 13},
                     ${frameX - 8} ${frameY + frameH + 16},
                     ${frameX + 8} ${frameY + frameH + 14}"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
            />

            <circle
                cx="${frameX - 20}"
                cy="${frameY + 7}"
                r="2"
                fill="none"
                stroke="currentColor"
            />

            <circle
                cx="${frameX - 20}"
                cy="${frameY + frameH + 30}"
                r="2"
                fill="none"
                stroke="currentColor"
            />

            <line
                x1="${frameX - frontEndW}"
                y1="${frameY + 9}"
                x2="${frameX}"
                y2="${frameY + 9}"
                stroke="currentColor"
                stroke-width="0.8"
            />

            <line
                x1="${frameX - frontEndW}"
                y1="${frameY + frameH - 8}"
                x2="${frameX}"
                y2="${frameY + frameH - 8}"
                stroke="currentColor"
                stroke-width="0.8"
            />
        </g>
    `;

    const rearEnd = `
        <g>
            <rect
                x="${bodyEndX}"
                y="${frameY}"
                width="${rearEndW}"
                height="${frameH + 45}"
                fill="none"
                stroke="currentColor"
                stroke-width="1.4"
            />

            <path
                d="M ${bodyEndX + rearEndW} ${frameY + frameH + 2}
                   C ${bodyEndX + 20} ${frameY + frameH + 13},
                     ${bodyEndX + 8} ${frameY + frameH + 16},
                     ${bodyEndX - 8} ${frameY + frameH + 14}"
                fill="none"
                stroke="currentColor"
                stroke-width="1"
            />

            <line
                x1="${bodyEndX + rearEndW}"
                y1="${frameY + frameH + 37}"
                x2="${bodyEndX + rearEndW + 6}"
                y2="${frameY + frameH + 37}"
                stroke="currentColor"
                stroke-width="2"
            />

            <circle
                cx="${bodyEndX + 10}"
                cy="${frameY + 7}"
                r="2"
                fill="none"
                stroke="currentColor"
            />

            <circle
                cx="${bodyEndX + 10}"
                cy="${frameY + frameH + 30}"
                r="2"
                fill="none"
                stroke="currentColor"
            />

            <line
                x1="${bodyEndX}"
                y1="${frameY + 9}"
                x2="${bodyEndX + rearEndW}"
                y2="${frameY + 9}"
                stroke="currentColor"
                stroke-width="0.8"
            />

            <line
                x1="${bodyEndX}"
                y1="${frameY + frameH - 8}"
                x2="${bodyEndX + rearEndW}"
                y2="${frameY + frameH - 8}"
                stroke="currentColor"
                stroke-width="0.8"
            />
        </g>
    `;

    const kingpinX = frameX + 18;
    const kingpinY = frameY + frameH + 26;
    const kingpinLabelX = kingpinX + 24;
    const kingpinLabelY = kingpinY + 18;

    const kingpinMarker = `
        <g>
            <line
                x1="${kingpinX}"
                y1="${kingpinY}"
                x2="${kingpinLabelX}"
                y2="${kingpinLabelY}"
                stroke="currentColor"
                stroke-width="0.8"
            />

            <text
                x="${kingpinLabelX + 2}"
                y="${kingpinLabelY + 4}"
                font-size="12"
                font-weight="500"
                fill="currentColor"
            >
                0
            </text>
        </g>
    `;

    const qtyX = svgW - 330;

    return `
        <svg
            viewBox="0 0 ${svgW} ${svgH}"
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
            class="text-foreground"
        >
            <rect
                x="0"
                y="0"
                width="${svgW}"
                height="${svgH}"
                fill="none"
            />

            ${dimLineHtml(
                frameX - frontEndW,
                bodyEndX + rearEndW,
                topDimY,
                Math.round(totalLength),
                {
                    labelY: topDimY - 7,
                    fontSize: 13,
                    weight: 500,
                }
            )}

            ${verticalDimLineHtml(
                frameX - frontEndW - 24,
                frameY,
                frameY + frameH,
                Math.round(trailerHeight)
            )}

            <line
                x1="${frameX - frontEndW - 24}"
                y1="${frameY}"
                x2="${frameX - frontEndW}"
                y2="${frameY}"
                stroke="currentColor"
                stroke-width="1"
            />

            <line
                x1="${frameX - frontEndW - 24}"
                y1="${frameY + frameH}"
                x2="${frameX - frontEndW}"
                y2="${frameY + frameH}"
                stroke="currentColor"
                stroke-width="1"
            />

            ${frontEnd}
            ${rearEnd}

            <rect
                x="${frameX}"
                y="${frameY}"
                width="${frameW}"
                height="${frameH}"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            />

            ${railLines}

            <line
                x1="${frameX}"
                y1="${frameY + 10}"
                x2="${bodyEndX}"
                y2="${frameY + 10}"
                stroke="currentColor"
                stroke-width="1.6"
            />

            <line
                x1="${frameX}"
                y1="${frameY + frameH - 10}"
                x2="${bodyEndX}"
                y2="${frameY + frameH - 10}"
                stroke="currentColor"
                stroke-width="1.6"
            />

            ${pillars}

            <path
                d="${chassisPath}"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            />

            ${hangers}
            ${bolts}
            ${kingpinMarker}
            ${wheels}

            <line
                x1="${mmX(0)}"
                y1="${wheelY + wheelR + 10}"
                x2="${mmX(totalLength)}"
                y2="${wheelY + wheelR + 10}"
                stroke="currentColor"
                opacity="0.35"
                stroke-width="1"
            />

            <line
                x1="${mmX(0)}"
                y1="${wheelY + wheelR + 10}"
                x2="${mmX(0)}"
                y2="${bottomDimY}"
                stroke="currentColor"
                opacity="0.45"
                stroke-width="1"
            />

            <line
                x1="${mmX(totalLength)}"
                y1="${wheelY + wheelR + 10}"
                x2="${mmX(totalLength)}"
                y2="${bottomDimY}"
                stroke="currentColor"
                opacity="0.45"
                stroke-width="1"
            />

            ${safeAxleCentersMm
                .map((mm) => {
                    const x = mmX(mm);

                    return `
                        <line
                            x1="${x}"
                            y1="${wheelY + wheelR + 10}"
                            x2="${x}"
                            y2="${bottomDimY}"
                            stroke="currentColor"
                            opacity="0.45"
                            stroke-width="1"
                        />
                    `;
                })
                .join("")}

            ${bottomDims}

            <text
                x="${qtyX}"
                y="${noteY}"
                font-size="13"
                font-weight="500"
                fill="currentColor"
            >
                TOTAL ORDER QUANTITY - 1 VEHICLE
            </text>

          
        </svg>
    `;
}