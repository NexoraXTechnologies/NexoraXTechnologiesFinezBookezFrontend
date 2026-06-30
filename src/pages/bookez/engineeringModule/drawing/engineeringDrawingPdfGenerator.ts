import { buildChassisDrawingSvgHtml } from "./chassisDrawingSvgHtml";

/* ===================================================
   HELPERS
=================================================== */

const n = (value: any, fallback = 0) => {
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : fallback;
};

const escapeHtml = (value: any) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const fmtInr = (value: any) =>
    Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

const getPdfPrimaryColor = () => {
    const stored = localStorage.getItem("pdfPrimaryColor");
    return stored || "#2563EB";
};

/* ===================================================
   COMPANY MASTER
=================================================== */



/* ===================================================
   LOGO
=================================================== */

const MAX_PDF_LOGO_LENGTH = 150000;

const sanitizeLogoForPdf = (logoUri: any) => {
    if (!logoUri || typeof logoUri !== "string") return "";

    const trimmed = logoUri.trim();
    if (!trimmed) return "";

    if (trimmed.startsWith("data:") && trimmed.length > MAX_PDF_LOGO_LENGTH) {
        return "";
    }

    return trimmed.replace(/"/g, "&quot;");
};

/* ===================================================
   HTML ROWS
=================================================== */

const infoRow = (label: string, value: any) => `
    <tr>
        <td class="left summaryLabel">${escapeHtml(label)}</td>
        <td class="right summaryValue">${escapeHtml(value ?? "-")}</td>
    </tr>
`;

/* ===================================================
   DRAWING SECTION
=================================================== */

const buildGenericDrawingSvg = (bomData: any) => {
    const d = bomData?.dimensions || {};

    const totalLength = n(d.totalLength, 9200);
    const totalHeight = n(
        d.totalHeight || d.deckHeight || d.trailerHeight,
        1600
    );

    const frameX = 60;
    const frameY = 60;
    const frameW = 620;
    const frameH = 140;

    return `
        <svg viewBox="0 0 760 260" width="100%" xmlns="http://www.w3.org/2000/svg">
            <text
                x="${frameX + frameW / 2}"
                y="28"
                font-size="14"
                font-weight="700"
                text-anchor="middle"
            >
                ${totalLength}
            </text>

            <line
                x1="24"
                y1="${frameY}"
                x2="24"
                y2="${frameY + frameH}"
                stroke="#111"
            />

            <text
                x="12"
                y="${frameY + frameH / 2}"
                font-size="12"
                font-weight="700"
                transform="rotate(-90 12 ${frameY + frameH / 2})"
            >
                ${totalHeight}
            </text>

            <rect
                x="${frameX}"
                y="${frameY}"
                width="${frameW}"
                height="${frameH}"
                fill="#f8fafc"
                stroke="#111"
                stroke-width="2"
            />

            <line
                x1="${frameX}"
                y1="${frameY + frameH / 2}"
                x2="${frameX + frameW}"
                y2="${frameY + frameH / 2}"
                stroke="#94a3b8"
            />

            <text
                x="${frameX + frameW / 2}"
                y="${frameY + frameH + 36}"
                font-size="12"
                text-anchor="middle"
            >
                Schematic - ${escapeHtml(
                    bomData?.selectedProductLabel ||
                        bomData?.selectedProduct ||
                        "Product"
                )}
            </text>
        </svg>
    `;
};

const buildDrawingSection = (
    bomData: any,
    { includeDrawing = true }: any = {}
) => {
    if (!includeDrawing) {
        return `
            <div class="section">
                <div class="sectionTitle">Technical Drawing</div>
                <div class="drawingWrap">
                    <div class="drawingBox drawingFallback">
                        Drawing preview omitted for PDF compatibility.
                    </div>
                </div>
            </div>
        `;
    }

    const isChassis =
        bomData?.finishedProduct === "chassis" ||
        bomData?.selectedProduct === "chassis";

    const svg = isChassis
        ? buildChassisDrawingSvgHtml(bomData, { forPdf: true })
        : buildGenericDrawingSvg(bomData);

    return `
        <div class="section">
            <div class="sectionTitle">Technical Drawing</div>
            <div class="drawingWrap">
                <div class="drawingBox">${svg}</div>
            </div>
        </div>
    `;
};

/* ===================================================
   SUMMARY SECTION
=================================================== */

const buildSummarySection = (bomData: any) => {
    const d = bomData?.dimensions || {};
    const c = bomData?.calculated || {};

    const isChassis =
        bomData?.finishedProduct === "chassis" ||
        bomData?.selectedProduct === "chassis";

    const totalLength = n(d.totalLength, 9200);

    const totalHeight = n(
        d.totalHeight || d.deckHeight || d.trailerHeight,
        1600
    );

    const totalWeight =
        bomData?.estimatedWeight || c.estimatedTrailerWeight || 0;

    const estimatedCost =
        bomData?.estimatedCost ||
        c.estimatedCost ||
        (bomData?.components || []).reduce(
            (sum: number, item: any) => sum + Number(item.amount || 0),
            0
        );

    const dimensionRows = isChassis
        ? [
              infoRow("Total Length (A)", `${totalLength} mm`),
              infoRow("Total Width", `${d.totalWidth || "-"} mm`),
              infoRow("Deck Height", `${totalHeight} mm`),
              infoRow(
                  "Cross Member Count",
                  String(d.crossMemberCount || "-")
              ),
              infoRow(
                  "Cross Member Spacing",
                  `${c.crossMemberSpacing || "-"} mm`
              ),
              infoRow("Axle Count", String(d.axleCount || "-")),
              infoRow("Axle Spacing", `${c.axleSpacing || "-"} mm`),
              infoRow("Tyre Count", String(c.tyreCount || "-")),
              infoRow(
                  "King Pin Position",
                  `${c.kingPinPositionMm || "-"} mm`
              ),
              infoRow("Main Beam Thickness", c.mainBeamThickness || "-"),
              infoRow("Floor Plate Thickness", c.floorPlateThickness || "-"),
              infoRow("Trailer Type", d.trailerType || "-"),
              infoRow("Payload Capacity", d.payloadCapacity || "-"),
              infoRow("Steel Grade", d.steelGrade || "-"),
          ]
        : [
              infoRow("Total Length (A)", `${totalLength} mm`),
              infoRow("Total Height (B)", `${totalHeight} mm`),
              infoRow(
                  "Pillar Count",
                  String(d.pillarCount || d.crossMemberCount || "-")
              ),
              infoRow(
                  "Pillar Spacing (C)",
                  `${n(d.pillarSpacing || c.crossMemberSpacing, 1250)} mm`
              ),
              infoRow("Pillar Width", `${n(d.pillarWidth, 60)} mm`),
              infoRow("Top Rail Height (D)", `${n(d.topRailHeight, 150)} mm`),
              infoRow(
                  "Bottom Rail Height (E)",
                  `${n(d.bottomRailHeight, 150)} mm`
              ),
              infoRow("Sheet Thickness", `${n(d.sheetThickness, 2.5)} mm`),
          ];

    return `
        <div class="section">
            <div class="sectionTitle">Engineering Summary</div>

            <div class="tableWrap">
                <table class="dataTable summaryTable">
                    <thead>
                        <tr>
                            <th class="left">Field</th>
                            <th class="right">Value</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${infoRow(
                            "Product",
                            bomData?.selectedProductLabel ||
                                bomData?.selectedProduct ||
                                "-"
                        )}
                        ${infoRow("Account", bomData?.accountName || "-")}
                        ${dimensionRows.join("")}
                        ${infoRow(
                            "Total Components",
                            String(bomData?.components?.length || 0)
                        )}
                        ${infoRow("Total Weight", `${totalWeight} kg`)}
                        ${infoRow(
                            "Estimated Cost",
                            `₹ ${fmtInr(estimatedCost)}`
                        )}
                        ${infoRow("Tax Status", "Excluding Tax")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

/* ===================================================
   BOM SECTION
=================================================== */

const buildBomSection = (bomData: any) => {
    const components = bomData?.components || [];

    const totalWeight =
        bomData?.estimatedWeight ||
        bomData?.calculated?.estimatedTrailerWeight ||
        0;

    const totalCost = components.reduce(
        (sum: number, item: any) => sum + Number(item.amount || 0),
        0
    );

    const rows = components
        .map(
            (item: any, index: number) => `
                <tr>
                    <td class="colNo">${index + 1}</td>
                    <td class="left colPart">
                        ${escapeHtml(item.product || item.productName || "-")}
                    </td>
                    <td class="colUnit">${escapeHtml(item.unit || "-")}</td>
                    <td class="colQty">
                        ${escapeHtml(item.qty || item.quantity || "-")}
                    </td>
                    <td class="right colAmt">
                        ₹ ${fmtInr(item.amount || 0)}
                    </td>
                </tr>
            `
        )
        .join("");

    return `
        <div class="section pageBreak">
            <div class="sectionTitle">Bill of Materials</div>

            <div class="tableWrap">
                <table class="dataTable bomTable">
                    <thead>
                        <tr>
                            <th class="colNo">#</th>
                            <th class="left colPart">Part Name</th>
                            <th class="colUnit">Unit</th>
                            <th class="colQty">Qty</th>
                            <th class="right colAmt">Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${
                            rows ||
                            `<tr>
                                <td colspan="5" class="empty">
                                    No BOM components available.
                                </td>
                            </tr>`
                        }

                        <tr class="totalRow">
                            <td colspan="3">
                                <strong>Total Weight: ${totalWeight} kg</strong>
                            </td>
                            <td colspan="2" class="right">
                                <strong>₹ ${fmtInr(totalCost)}</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

/* ===================================================
   FULL HTML
=================================================== */

export const buildEngineeringDrawingHtml = (
    bomData: any,
    company: any,
    primaryColor: string,
    options: any = {}
) => {
    const { includeLogo = true, includeDrawing = true } = options;

    const companyName = company?.companyName || "Company Name";

    const companyAddress = String(company?.companyAddress || "")
        .replace(/^address:\s*/i, "")
        .trim();

    const companyMobile = company?.companyMobile || "";
    const companyEmail = company?.companyEmail || "";
    const companyGst = company?.gstNumber || "";

    const companyLogo = includeLogo
        ? sanitizeLogoForPdf(company?.logoUri)
        : "";

    const generatedOn = new Date().toLocaleString("en-IN");

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8" />

                <title>Engineering Drawing Report</title>

                <style>
                    @page {
                        margin: 12mm 10mm;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    html,
                    body {
                        width: 100%;
                        max-width: 100%;
                        overflow-x: hidden;
                    }

                    body {
                        font-family: Arial, Helvetica, sans-serif;
                        color: #111827;
                        margin: 0;
                        padding: 6px 10px;
                        font-size: 9px;
                        line-height: 1.35;
                    }

                    .headerRow {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 10px;
                        max-width: 100%;
                    }

                    .companyBlock {
                        flex: 1;
                        min-width: 0;
                    }

                    .companyBlock h1 {
                        margin: 0 0 4px;
                        font-size: 14px;
                        color: ${primaryColor};
                    }

                    .companyBlock p {
                        margin: 1px 0;
                        font-size: 8px;
                        line-height: 1.3;
                    }

                    .addressBlock {
                        margin: 2px 0 5px;
                    }

                    .addressLabel {
                        font-size: 8px;
                        font-weight: 700;
                        margin: 0 0 2px;
                    }

                    .addressText {
                        font-size: 8px;
                        line-height: 1.45;
                        margin: 0;
                        max-width: 300px;
                        word-break: break-word;
                        white-space: normal;
                    }

                    .logo {
                        width: 100px;
                        height: 100px;
                        object-fit: contain;
                        flex-shrink: 0;
                    }

                    .divider {
                        border-top: 1.5px solid ${primaryColor};
                        margin: 10px 0;
                    }

                    .docTitle {
                        text-align: center;
                        font-size: 13px;
                        font-weight: 800;
                        margin-bottom: 2px;
                    }

                    .docSub {
                        text-align: center;
                        color: #64748B;
                        font-size: 8px;
                        margin-bottom: 10px;
                    }

                    .metaRow {
                        display: flex;
                        justify-content: space-between;
                        gap: 8px;
                        margin-bottom: 10px;
                        max-width: 48%;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .metaCard {
                        flex: 1;
                        border: 1px solid #E5E7EB;
                        border-radius: 6px;
                        padding: 6px 8px;
                        background: #F8FAFC;
                    }

                    .metaLabel {
                        font-size: 7px;
                        color: #64748B;
                        font-weight: 700;
                        text-transform: uppercase;
                    }

                    .metaValue {
                        font-size: 9px;
                        font-weight: 800;
                        margin-top: 2px;
                    }

                    .section {
                        margin-top: 12px;
                    }

                    .sectionTitle {
                        font-size: 11px;
                        font-weight: 800;
                        color: ${primaryColor};
                        margin-bottom: 6px;
                        padding-bottom: 4px;
                        margin-left: 40px;
                        border-bottom: 1px solid #E5E7EB;
                    }

                    .drawingWrap {
                        width: 92%;
                        max-width: 92%;
                        margin: 0 auto;
                        overflow: hidden;
                    }

                    .drawingBox {
                        border: 1px solid #CBD5E1;
                        border-radius: 6px;
                        padding: 4px;
                        background: #fff;
                        overflow: hidden;
                        width: 100%;
                    }

                    .drawingBox svg {
                        display: block;
                        width: 100% !important;
                        max-width: 100%;
                        height: auto;
                    }

                    .drawingFallback {
                        font-size: 8px;
                        color: #64748B;
                        text-align: center;
                        padding: 16px 8px;
                    }

                    .tableWrap {
                        width: 88%;
                        max-width: 88%;
                        margin: 0 auto;
                        overflow: hidden;
                    }

                    .dataTable {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                    }

                    .dataTable th,
                    .dataTable td {
                        border: 1px solid #E5E7EB;
                        padding: 3px 4px;
                        font-size: 7px;
                        line-height: 1.25;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                        vertical-align: top;
                    }

                    .dataTable th {
                        background: #F8FAFC;
                        font-weight: 800;
                        font-size: 7.5px;
                    }

                    .dataTable .left {
                        text-align: left;
                    }

                    .dataTable .right {
                        text-align: right;
                    }

                    .summaryTable .summaryLabel {
                        width: 42%;
                        color: #334155;
                        font-weight: 700;
                    }

                    .summaryTable .summaryValue {
                        width: 58%;
                        font-weight: 700;
                        color: #111827;
                    }

                    .bomTable .colNo {
                        width: 6%;
                    }

                    .bomTable .colPart {
                        width: 38%;
                    }

                    .bomTable .colUnit {
                        width: 14%;
                    }

                    .bomTable .colQty {
                        width: 10%;
                    }

                    .bomTable .colAmt {
                        width: 22%;
                    }

                    .dataTable .empty {
                        text-align: center;
                        color: #64748B;
                        padding: 10px;
                    }

                    .totalRow td {
                        background: #ECFDF5;
                        font-weight: 800;
                        font-size: 7px;
                    }

                    .pageBreak {
                        page-break-before: auto;
                    }

                    .footerNote {
                        margin-top: 14px;
                        text-align: center;
                        color: #64748B;
                        font-size: 7px;
                    }
                </style>
            </head>

            <body>
                <div class="headerRow">
                    <div class="companyBlock">
                        <h1>${escapeHtml(companyName)}</h1>

                        <div class="addressBlock">
                            <p class="addressLabel"><strong>Address:</strong></p>
                            <p class="addressText">${escapeHtml(companyAddress)}</p>
                        </div>

                        <p><strong>Phone:</strong> ${escapeHtml(companyMobile)}</p>
                        <p><strong>Email:</strong> ${escapeHtml(companyEmail)}</p>

                        ${
                            companyGst
                                ? `<p><strong>GST:</strong> ${escapeHtml(
                                      companyGst
                                  )}</p>`
                                : ""
                        }
                    </div>

                    ${
                        companyLogo
                            ? `<img class="logo" src="${companyLogo}" />`
                            : `<div style="width:100px;height:100px;"></div>`
                    }
                </div>

                <div class="divider"></div>

                <div class="docTitle">Engineering Drawing Report</div>
                <div class="docSub">Generated on ${escapeHtml(generatedOn)}</div>

                <div class="metaRow">
                    <div class="metaCard">
                        <div class="metaLabel">Product</div>
                        <div class="metaValue">
                            ${escapeHtml(
                                bomData?.selectedProductLabel ||
                                    bomData?.selectedProduct ||
                                    "-"
                            )}
                        </div>
                    </div>

                    <div class="metaCard">
                        <div class="metaLabel">Customer</div>
                        <div class="metaValue">
                            ${escapeHtml(bomData?.accountName || "-")}
                        </div>
                    </div>
                </div>

                ${buildDrawingSection(bomData, { includeDrawing })}
                ${buildSummarySection(bomData)}
                ${buildBomSection(bomData)}

                <div class="footerNote">
                    This document includes technical drawing, engineering summary and bill of materials.
                </div>
            </body>
        </html>
    `;
};

/* ===================================================
   WEB PDF GENERATION
=================================================== */
const openPrintWindowImmediately = () => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        throw new Error("Popup blocked. Please allow popups to generate PDF.");
    }

    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Generating PDF...</title>
                <style>
                    body {
                        margin: 0;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: Arial, sans-serif;
                        color: #111827;
                    }
                    .box {
                        text-align: center;
                    }
                    .loader {
                        width: 34px;
                        height: 34px;
                        border: 4px solid #e5e7eb;
                        border-top-color: #2563eb;
                        border-radius: 50%;
                        margin: 0 auto 12px;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="box">
                    <div class="loader"></div>
                    <strong>Generating PDF...</strong>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();

    return printWindow;
};

const writeHtmlAndPrint = (
    printWindow: Window,
    html: string,
    fileName: string
) => {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.document.title = fileName;

    const runPrint = () => {
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    if (printWindow.document.readyState === "complete") {
        runPrint();
    } else {
        printWindow.onload = runPrint;
    }
};

export const generateEngineeringDrawingPdf = async (
    bomData: any = {},
    { setLoading, company }: any = {}
) => {
    let printWindow: Window | null = null;

    try {
        setLoading?.(true);

        printWindow = openPrintWindowImmediately();

        if (!company?._id && !company?.companyName) {
            printWindow.close();
            throw new Error("Please create Company Master first.");
        }

        const primaryColor = getPdfPrimaryColor();

        const safeName = `Engineering_${
            bomData?.selectedProductLabel ||
            bomData?.selectedProduct ||
            "Engineering"
        }_${Date.now()}`.replace(/[^\w-]/g, "_");

        const html = buildEngineeringDrawingHtml(
            bomData,
            company,
            primaryColor,
            {
                includeLogo: true,
                includeDrawing: true,
            }
        );

        writeHtmlAndPrint(printWindow, html, safeName);

        return safeName;
    } catch (err: any) {
        console.error("Engineering PDF generation failed:", err);

        if (printWindow && !printWindow.closed) {
            printWindow.close();
        }

        throw err;
    } finally {
        setLoading?.(false);
    }
};