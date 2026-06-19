

import { formatIndianNumber } from "../../components/common/DateFormator";
import { formatDateForInput } from "../helperFunctions";
import { buildPdfCalculations, knownFooterKeys } from "./pdfCalculations";
import { escapeHtml, formatFooterLabel, titleCase, toNum } from "./pdfHelpers";
import { normalizeDoc } from "./pdfNormalizer";

type BuildPdfHtmlProps = {
    signatureUri?: string;

    upiId?: string;
    upiUrl?: string;
    upiQrUri?: string;

    ifscCode?: string;
    bankAccountNumber?: string;
    bankName?: string;

    companyName?: string;
    companyAddress?: string;
    companyMobile?: string;
    companyEmail?: string;
    gstNumber?: string;

    selectedAccount?: any;
    rowData?: any;

    includeGst?: boolean;
    primaryColor?: string;
    entryType?: string;
    gstType?: string;
};

export const buildPdfHtml = ({
    signatureUri,

    upiId,
    upiUrl = "",
    upiQrUri = "",

    ifscCode,
    bankAccountNumber,
    bankName,

    companyName,
    companyAddress,
    companyMobile,
    companyEmail,
    gstNumber,

    selectedAccount,
    rowData,

    includeGst = true,
    primaryColor = "#1E88E5",
    entryType = "sales-quotation",
}: BuildPdfHtmlProps) => {
    const normalized: any = normalizeDoc(rowData);

    if (!normalized) {
        return `
            <html>
                <body>
                    <h3>No PDF data found</h3>
                </body>
            </html>
        `;
    }

    const footer = normalized.footer || {};
    const footerLabels = footer?.labels || {};
    const unitMap = {};

    const {
        items,
        totalQty,
        totalRejQty,
        totalAccQty,
        subTotal,
        discountAmt,
        cgstAmt,
        sgstAmt,
        igstAmt,
        otherAmount,
        pdfGrandTotal,
        amountWords,
    } = buildPdfCalculations({
        itemsRaw: normalized.body || [],
        footer,
        unitMap,
    });

    const billToName = selectedAccount?.accountName || "";
    const billToAddress = selectedAccount?.accountAddress || "";
    const billToGstin = selectedAccount?.gstNumber || "";

    const invNo = normalized?.docNo || "";
    const invDate = normalized?.docDate || "";

    const companyLogo = "";
    const PRIMARY = primaryColor;

    const gstHeaderTh = includeGst ? `<th class="colGst">GST</th>` : "";

    const billGstBlock =
        includeGst && billToGstin
            ? `
                <p><strong>GSTIN Number:</strong> ${escapeHtml(billToGstin)}</p>
            `
            : "";

    const companyGstBlock =
        includeGst && gstNumber
            ? `<p><strong>GSTIN:</strong> ${escapeHtml(gstNumber)}</p>`
            : "";

    const renderGstHtml = (it: any) => {
        const cgst = toNum(it.cgstPercentage ?? it.cgst);
        const sgst = toNum(it.sgstPercentage ?? it.sgst);
        const igst = toNum(it.igstPercentage ?? it.igst);
        const taxAmount = toNum(it.taxAmount);

        if (igst > 0) {
            return `
                <span class="money">${igst}%</span>
                <span class="gstSmall">IGST: ₹ ${toNum(it.igstAmount)}</span>
            `;
        }

        if (cgst > 0 || sgst > 0) {
            return `
                <span class="money">${cgst + sgst}%</span>
                <span class="gstSmall">CGST: ${cgst}% SGST: ${sgst}%</span>
            `;
        }

        if (taxAmount > 0) {
            return `
                <span class="money">₹ ${taxAmount}</span>
                <span class="gstSmall">Tax</span>
            `;
        }

        return `<span class="money">—</span>`;
    };

    const gstSummaryRows = includeGst
        ? `
            <tr>
                <td class="sumLabel">IGST</td>
                <td class="sumAmt">₹ ${formatIndianNumber(igstAmt)}</td>
            </tr>

            <tr>
                <td class="sumLabel">SGST</td>
                <td class="sumAmt">₹ ${formatIndianNumber(sgstAmt)}</td>
            </tr>

            <tr>
                <td class="sumLabel">CGST</td>
                <td class="sumAmt">₹ ${formatIndianNumber(cgstAmt)}</td>
            </tr>
        `
        : "";

    const discountRow =
        discountAmt > 0
            ? `
                <tr>
                    <td class="sumLabel">Discount</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(discountAmt)}</td>
                </tr>
            `
            : "";

    const otherAmountRow =
        otherAmount > 0
            ? `
                <tr>
                    <td class="sumLabel">Other Amount</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(otherAmount)}</td>
                </tr>
            `
            : "";

    // const totalFooterDisplayRows = `
    //     ${footer.totalQuantity != null
    //         ? `
    //                 <tr>
    //                     <td class="sumLabel">Total Quantity</td>
    //                     <td class="sumAmt">${formatIndianNumber(footer.totalQuantity)}</td>
    //                 </tr>
    //             `
    //         : ""
    //     }

    //     ${footer.totalGrossAmount != null
    //         ? `
    //                 <tr>
    //                     <td class="sumLabel">Total Gross Amount</td>
    //                     <td class="sumAmt">₹ ${formatIndianNumber(footer.totalGrossAmount)}</td>
    //                 </tr>
    //             `
    //         : ""
    //     }

    //     ${footer.totalNetAmount != null
    //         ? `
    //                 <tr>
    //                     <td class="sumLabel">Total Net Amount</td>
    //                     <td class="sumAmt">₹ ${formatIndianNumber(footer.totalNetAmount)}</td>
    //                 </tr>
    //             `
    //         : ""
    //     }
    // `;

    const extraFooterRows = Object.entries(footer || {})
        .filter(([key, value]: any) => {
            if (knownFooterKeys.has(key)) return false;
            return toNum(value) !== 0;
        })
        .map(
            ([key, value]: any) => `
                <tr>
                    <td class="sumLabel">
                        ${escapeHtml(footerLabels?.[key] || formatFooterLabel(key))}
                    </td>
                    <td class="sumAmt">₹ ${formatIndianNumber(toNum(value))}</td>
                </tr>
            `
        )
        .join("");

    const upiBlock =
        entryType === "sales-invoice"
            ? upiUrl
                ? `
                    <a class="upiLink" href="${upiUrl}">
                        Pay with UPI (GPay / PhonePe)
                    </a>

                    <div class="upiMeta">
                        UPI ID: ${escapeHtml(upiId)} • Amount: ₹ ${formatIndianNumber(pdfGrandTotal)}
                    </div>
                `
                : `<div class="upiMeta">UPI not configured in Company Master.</div>`
            : "";

    const paymentBlock =
        entryType === "sales-invoice"
            ? `
                <div class="payLeft">
                    ${upiQrUri
                ? `<img class="qr" src="${upiQrUri}" />`
                : `
                                <div class="qr" style="display:flex;align-items:center;justify-content:center;color:#888;">
                                    UPI QR not available
                                </div>
                            `
            }

                    <div class="payInfo">
                        <div><b>Pay To:</b></div>
                        <div>Bank Name: ${escapeHtml(bankName)}</div>
                        <div>Bank Account No: ${escapeHtml(bankAccountNumber)}</div>
                        <div>Bank IFSC code: ${escapeHtml(ifscCode)}</div>
                        <div>Account Holder's Name: ${escapeHtml(companyName)}</div>
                    </div>
                </div>
            `
            : `<div class="payLeft"></div>`;

    return `
<html>
<head>
    <meta charset="utf-8" />

    <style>
        @page {
            margin-top: 40px;
            margin-bottom: 40px;
            margin-left: 30px;
            margin-right: 30px;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }

        html,
        body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }

        body {
            font-family: Helvetica, Arial, sans-serif;
            color: #111;
            font-size: 12px;
        }

        .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
        }

        .company h1 {
            margin: 0 0 6px 0;
            font-size: 22px;
            font-weight: 700;
        }

        .company p {
            margin: 0;
            line-height: 1.6;
        }

        .logo {
            width: 90px;
            height: 90px;
            object-fit: contain;
        }

        .divider {
            height: 2px;
            background-color: ${PRIMARY} !important;
            margin: 14px 0 14px;
            opacity: 0.9;
        }

        .title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            color: ${PRIMARY} !important;
            margin: 0 0 8px;
        }

        .sectionRow {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
        }

        .bill,
        .details {
            width: 48%;
        }

        .sectionTitle {
            font-weight: 700;
            margin-bottom: 10px;
        }

        .bill p {
            margin: 0 0 8px;
        }

        .details .sectionTitle {
            text-align: right;
        }

        .details .kv {
            text-align: right;
            margin: 0 0 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            border: 0.5px solid #bbb;
            font-size: 12px;
        }

        thead th {
            background-color: ${PRIMARY} !important;
            color: #ffffff !important;
            padding: 9px 6px;
            text-align: center;
            border: 0.5px solid #aad;
        }

        tbody td {
            padding: 9px 6px;
            vertical-align: top;
            text-align: center;
            border: 0.5px solid #ccc;
        }

        .colNum {
            width: 28px;
        }

        .colItem {
            width: 200px;
            text-align: left;
        }

        .colQty {
            width: 90px;
        }

        .colPrice {
            width: 100px;
        }

        .colGst {
            width: 140px;
        }

        .colAmt {
            width: 120px;
        }

        .gstSmall {
            display: block;
            margin-top: 3px;
            color: #555;
            font-size: 9px;
        }

        .money {
            white-space: nowrap;
        }

        .itemMeta {
            display: block;
            margin-top: 3px;
            font-size: 10px;
            color: #666;
        }

        .dimCell {
            color: #999;
        }

        .tableTotal td {
            border-top: 1px solid #999;
            border-bottom: 1px solid #999;
            font-weight: 700;
            padding-top: 10px;
            padding-bottom: 10px;
        }

        .belowRow {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            margin-top: 18px;
        }

        .belowLeft {
            flex: 1;
        }

        .belowRight {
            width: 460px;
        }

        .blkTitle {
            font-weight: 700;
            margin: 0 0 10px;
        }

        .blkText {
            line-height: 1.6;
            margin: 0;
        }

        .sumTable {
            width: 100%;
            border-collapse: collapse;
        }

        .sumTable td {
            padding: 8px 10px;
        }

        .sumLabel {
            width: 55%;
        }

        .sumAmt {
            width: 45%;
            text-align: right;
            white-space: nowrap;
        }

        .sumTotalRow td {
            background-color: ${PRIMARY} !important;
            color: #ffffff !important;
            font-weight: 700;
        }

        .payRow {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 18px;
            margin-top: 18px;
        }

        .payLeft {
            flex: 1;
            display: flex;
            gap: 16px;
            align-items: flex-start;
        }

        .qr {
            width: 160px;
            height: 160px;
            object-fit: contain;
            border: 1px solid #ddd;
            padding: 6px;
        }

        .payInfo {
            line-height: 1.7;
        }

        .payInfo b {
            font-weight: 700;
        }

        .signRight {
            width: 360px;
            text-align: right;
        }

        .signRight .for {
            margin-bottom: 10px;
        }

        .signImg {
            height: 70px;
            object-fit: contain;
            margin: 10px 0;
        }

        .signText {
            font-weight: 700;
            margin-top: 6px;
        }

        .upiLink {
            display: inline-block;
            margin-top: 8px;
            font-weight: 700;
            color: #0b63ff;
            text-decoration: none;
        }

        .upiMeta {
            color: #555;
            margin-top: 4px;
        }

        .siteNote {
            text-align: left;
            margin-top: 10px;
            color: #0b63ff;
        }

        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            .divider {
                background-color: ${PRIMARY} !important;
            }

            .title {
                color: ${PRIMARY} !important;
            }

            thead th {
                background-color: ${PRIMARY} !important;
                color: #ffffff !important;
            }

            .sumTotalRow td {
                background-color: ${PRIMARY} !important;
                color: #ffffff !important;
            }
        }
    </style>
</head>

<body>
    <div class="row">
        <div class="company" style="max-width: 50%;">
            <h1>${escapeHtml(companyName || "Company Name")}</h1>
            <p><strong>Address:</strong> ${escapeHtml(companyAddress)}</p>
            <p><strong>Phone no:</strong> ${escapeHtml(companyMobile)}</p>
            <p><strong>Email:</strong> ${escapeHtml(companyEmail)}</p>
            ${companyGstBlock}
        </div>

        ${companyLogo
            ? `<img class="logo" src="${companyLogo}" />`
            : `<div style="width:90px;height:90px;"></div>`
        }
    </div>

    <div class="divider"></div>

    <div class="title">
        ${escapeHtml(titleCase(entryType || "Tax Invoice"))}
    </div>

    <div class="sectionRow">
        <div class="bill">
            <div class="sectionTitle">Bill To</div>
            <p><strong>Name:</strong> ${escapeHtml(billToName)}</p>
            <p><strong>Address:</strong> ${escapeHtml(billToAddress)}</p>
            ${billGstBlock}
        </div>

        <div class="details">
            <div class="sectionTitle">Invoice Details</div>
            <p class="kv"><strong>Invoice No.:</strong> ${escapeHtml(invNo)}</p>
            <p class="kv"><strong>Date:</strong> ${escapeHtml(formatDateForInput(invDate))}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="colNum">#</th>
                <th class="colItem">Item Name</th>

                ${entryType === "GRN"
            ? `
                            <th class="colQty">Accepted Qty</th>
                            <th class="colQty">Rejected Qty</th>
                        `
            : `<th class="colQty">Quantity</th>`
        }

                <th class="colPrice">Rate</th>
                <th class="colPrice">Discount %</th>
                ${gstHeaderTh}
                <th class="colAmt">Amount</th>
            </tr>
        </thead>

        <tbody>
            ${items
            .map((it: any, idx: any) => {
                return `
                        <tr>
                            <td class="colNum">${idx + 1}</td>

                            <td class="colItem">
                                ${escapeHtml(it.productName || "—")}
                                ${it.productHSNCode
                        ? `<span class="itemMeta">HSN: ${escapeHtml(it.productHSNCode)}</span>`
                        : ""
                    }
                            </td>

                            ${entryType === "GRN"
                        ? `
                                        <td class="colQty">
                                            ${escapeHtml(String(it.acceptedQuantity ?? ""))}
                                            ${it.uomLabel && it.uomLabel !== "-"
                            ? `<span class="itemMeta">${escapeHtml(it.uomLabel)}</span>`
                            : ""
                        }
                                        </td>

                                        <td class="colQty">
                                            ${escapeHtml(String(it.rejectedQuantity ?? ""))}
                                            ${it.uomLabel && it.uomLabel !== "-"
                            ? `<span class="itemMeta">${escapeHtml(it.uomLabel)}</span>`
                            : ""
                        }
                                        </td>
                                    `
                        : `
                                        <td class="colQty">
                                            ${escapeHtml(String(it.qty || ""))}
                                            ${it.uomLabel && it.uomLabel !== "-"
                            ? `<span class="itemMeta">${escapeHtml(it.uomLabel)}</span>`
                            : ""
                        }
                                        </td>
                                    `
                    }

                            <td class="colPrice">
                                <span class="money">₹ ${formatIndianNumber(it.rate)}</span>
                            </td>

                            <td class="colPrice">
                                ${toNum(it.discount) > 0 ||
                        toNum(it.discountPercentage) > 0
                        ? `<span class="money">${formatIndianNumber(
                            toNum(it.discountPercentage ?? it.discount)
                        )} %</span>`
                        : `<span class="dimCell">—</span>`
                    }
                            </td>

                            ${includeGst
                        ? `<td class="colGst">${renderGstHtml(it)}</td>`
                        : ""
                    }

                            <td class="colAmt">
                                <span class="money">
                                    ₹ ${formatIndianNumber(includeGst ? it.net : it.taxable)}
                                </span>
                            </td>
                        </tr>
                    `;
            })
            .join("")}

            <tr class="tableTotal">
                <td class="colNum"></td>
                <td class="colItem"><strong>Total</strong></td>

                ${entryType === "GRN"
            ? `
                            <td class="colQty">
                                <strong>${formatIndianNumber(totalAccQty)}</strong>
                            </td>
                            <td class="colQty">
                                <strong>${formatIndianNumber(totalRejQty)}</strong>
                            </td>
                        `
            : `
                            <td class="colQty">
                                <strong>${formatIndianNumber(totalQty)}</strong>
                            </td>
                        `
        }

                <td class="colPrice"></td>
                <td class="colPrice"></td>
                ${includeGst ? `<td class="colGst"></td>` : ""}

                <td class="colAmt">
                    <strong>₹ ${formatIndianNumber(pdfGrandTotal)}</strong>
                </td>
            </tr>
        </tbody>
    </table>

    <div class="belowRow">
        <div class="belowLeft">
            <div class="blkTitle">Invoice Amount In Words</div>
            <p class="blkText">${escapeHtml(amountWords)}</p>

            <div style="height:16px;"></div>

            <div class="blkTitle">
                Thank you for doing business with us.
            </div>

            ${upiBlock}

            ${normalized?.doc?.sInvRemark ||
            normalized?.doc?.sQuoteRemark ||
            normalized?.doc?.remark
            ? `
                        <div style="height:16px;"></div>

                        <div class="blkTitle">
                            Remark:- ${escapeHtml(
                normalized?.doc?.sInvRemark ||
                normalized?.doc?.sQuoteRemark ||
                normalized?.doc?.remark
            )}
                        </div>
                    `
            : ""
        }
        </div>

        <div class="belowRight">
            <table class="sumTable">
                <tr>
                    <td class="sumLabel">Sub Total</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(subTotal)}</td>
                </tr>

                ${discountRow}
                ${gstSummaryRows}
                ${otherAmountRow}
                ${extraFooterRows}

                <tr class="sumTotalRow">
                    <td class="sumLabel">Total</td>
                    <td class="sumAmt">₹ ${formatIndianNumber(pdfGrandTotal)}</td>
                </tr>
            </table>
        </div>
    </div>

    <div class="payRow">
        ${paymentBlock}

        <div class="signRight">
            <div class="for">For: ${escapeHtml(companyName)}</div>

            ${signatureUri
            ? `<img class="signImg" src="${signatureUri}" />`
            : `<div style="height:70px;"></div>`
        }

            <div class="signText">Authorized Signatory</div>
        </div>
    </div>
</body>
</html>
`;
};