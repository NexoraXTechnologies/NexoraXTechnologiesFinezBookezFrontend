import { pick } from "./pdfHelpers";

export const normalizeDoc = (payload: any) => {
    const doc = payload?.data ?? payload;

    if (!doc || typeof doc !== "object") return null;

    const docNo = pick(doc, [
        "sInvVoucherNumber",
        "sOrderVoucherNumber",
        "sInvReturnVoucherNumber",
        "pOrdVoucherNumber",
        "grnVoucherNumber",
        "pRetVoucherNumber",
        "pInvVoucherNumber",
        "sQuoteVoucherNumber",
    ]);

    const docDate = pick(doc, [
        "sInvVoucherDate",
        "sOrderVoucherDate",
        "sInvReturnVoucherDate",
        "pOrdVoucherDate",
        "grnVoucherDate",
        "pRetVoucherDate",
        "pInvVoucherDate",
        "sQuoteVoucherDate",
    ]);

    const customerCode = pick(doc, [
        "sInvCustomerCode",
        "sOrderCustomerCode",
        "sInvReturnCustomerCode",
        "pOrdVendorCode",
        "grnVendorCode",
        "pRetVendorCode",
        "pInvVendorCode",
        "sQuoteCustomerCode",
    ]);

    const body =
        pick(doc, [
            "sInvBody",
            "sOrderBody",
            "sInvReturnBody",
            "pOrdBody",
            "grnBody",
            "pRetBody",
            "pInvBody",
            "sQuoteBody",
        ]) || [];

    const footer =
        pick(doc, [
            "sInvFooter",
            "sOrderFooter",
            "sInvReturnFooter",
            "pOrdFooter",
            "grnFooter",
            "pRetFooter",
            "pInvFooter",
            "sQuoteFooter",
        ]) || {};

    return {
        doc,
        docNo: docNo || "",
        docDate: docDate || "",
        customerCode: customerCode || "",
        body: Array.isArray(body) ? body : [],
        footer: footer && typeof footer === "object" ? footer : {},
    };
};