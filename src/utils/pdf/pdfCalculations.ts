import { AmountToWords, formatFooterLabel, toNum } from "./pdfHelpers";


export const knownFooterKeys = new Set([
    "grossAmount",
    "discountAmount",
    "discount",
    "cgstAmount",
    "sgstAmount",
    "igstAmount",
    "taxAmount",
    "otherAmount",
    "netAmount",
    "adjustedAmount",
    "balanceAmount",

    "totalQuantity",
    "totalGrossAmount",
    "totalDiscountAmount",
    "totalCgstAmount",
    "totalSgstAmount",
    "totalIgstAmount",
    "totalTaxAmount",
    "totalOtherAmount",
    "totalNetAmount",

    "cgst",
    "sgst",
    "igst",

    "labels",
]);

export const buildPdfCalculations = ({
    itemsRaw,
    footer,
    unitMap = {},
}: any) => {
    const resolveUnitLabel = (uomId: any) => {
        if (!uomId) return "-";

        const u = unitMap?.[uomId];

        return u?.unitCode || u?.unitName || uomId;
    };

    const items = (itemsRaw || []).map((it: any) => {
        const qty = toNum(it.quantity ?? it.qty);
        const rate = toNum(it.rate);

        const gross =
            it.grossAmount != null
                ? toNum(it.grossAmount)
                : it.gross != null
                    ? toNum(it.gross)
                    : qty * rate;

        const discountAmount = toNum(it.discountAmount);

        const taxable =
            it.taxableAmount != null
                ? toNum(it.taxableAmount)
                : Math.max(0, gross - discountAmount);

        const tax = toNum(it.taxAmount);

        const net =
            it.netAmount != null
                ? toNum(it.netAmount)
                : it.netTotal != null
                    ? toNum(it.netTotal)
                    : taxable + tax;

        return {
            ...it,
            qty,
            rate,
            gross,
            discountAmount,
            taxable,
            tax,
            net,
            uomLabel: resolveUnitLabel(it.uom ?? it.unit),
        };
    });

    const computedGrossTotal = items.reduce(
        (s: any, it: any) => s + toNum(it.gross),
        0
    );

    const computedDiscountTotal = items.reduce(
        (s: any, it: any) => s + toNum(it.discountAmount),
        0
    );

    const computedTaxTotal = items.reduce(
        (s: any, it: any) => s + toNum(it.tax),
        0
    );

    const computedNetTotal = items.reduce(
        (s: any, it: any) => s + toNum(it.net),
        0
    );

    const totalQty = items.reduce(
        (s: any, it: any) => s + toNum(it.qty),
        0
    );

    const totalRejQty = items.reduce(
        (s: any, it: any) => s + toNum(it.rejectedQuantity),
        0
    );

    const totalAccQty = items.reduce(
        (s: any, it: any) => s + toNum(it.acceptedQuantity),
        0
    );

    const subTotal =
        footer.totalGrossAmount != null
            ? toNum(footer.totalGrossAmount)
            : footer.grossAmount != null
                ? toNum(footer.grossAmount)
                : computedGrossTotal;

    const discountAmt =
        footer.totalDiscountAmount != null
            ? toNum(footer.totalDiscountAmount)
            : footer.discountAmount != null
                ? toNum(footer.discountAmount)
                : footer.discount != null
                    ? toNum(footer.discount)
                    : computedDiscountTotal;

    const cgstAmt =
        footer.totalCgstAmount != null
            ? toNum(footer.totalCgstAmount)
            : toNum(footer.cgstAmount ?? 0);

    const sgstAmt =
        footer.totalSgstAmount != null
            ? toNum(footer.totalSgstAmount)
            : toNum(footer.sgstAmount ?? 0);

    const igstAmt =
        footer.totalIgstAmount != null
            ? toNum(footer.totalIgstAmount)
            : toNum(footer.igstAmount ?? 0);

    const totalTax =
        footer.totalTaxAmount != null
            ? toNum(footer.totalTaxAmount)
            : footer.taxAmount != null
                ? toNum(footer.taxAmount)
                : cgstAmt + sgstAmt + igstAmt || computedTaxTotal;

    const otherAmount =
        footer.totalOtherAmount != null
            ? toNum(footer.totalOtherAmount)
            : toNum(footer.otherAmount ?? 0);

    const grandTotal =
        footer.totalNetAmount != null
            ? toNum(footer.totalNetAmount)
            : footer.netAmount != null
                ? toNum(footer.netAmount)
                : computedNetTotal;

    const extraFooterTotal = Object.entries(footer || {}).reduce(
        (sum: any, [key, value]: any) => {
            if (knownFooterKeys.has(key)) return sum;

            const num = toNum(value);

            return num !== 0 ? sum + num : sum;
        },
        0
    );

    const pdfGrandTotal = grandTotal + extraFooterTotal;
    const amountWords = AmountToWords(pdfGrandTotal);

    return {
        items,
        totalQty,
        totalRejQty,
        totalAccQty,

        subTotal,
        discountAmt,
        cgstAmt,
        sgstAmt,
        igstAmt,
        totalTax,
        otherAmount,
        grandTotal,
        extraFooterTotal,
        pdfGrandTotal,
        amountWords,
        formatFooterLabel,
    };
};