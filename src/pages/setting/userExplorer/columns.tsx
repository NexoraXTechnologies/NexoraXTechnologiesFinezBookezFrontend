const statusBadge = (status: any) => {
    const value = String(status || "-").toUpperCase();

    return (
        <span
            className={`
                rounded px-3 py-1 text-xs font-bold uppercase
                ${value === "CLOSE" ||
                    value === "CLOSED" ||
                    value === "PAID" ||
                    value === "ACCEPTED" ||
                    value === "APPROVED"
                    ? "bg-success/10 text-success"
                    : value === "REJECTED" ||
                        value === "CANCELLED" ||
                        value === "DELETED"
                        ? "bg-danger/10 text-danger"
                        : value === "OPEN"
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                }
            `}
        >
            {value}
        </span>
    );
};

const amountText = (value: any) => {
    const amount = Number(value || 0);

    if (!amount) return "-";

    return `₹${amount.toFixed(2)}`;
};

/* ===================================================
   SALES QUOTATION COLUMNS
=================================================== */

const salesQuotationColumns = [
    {
        key: "sQuoteVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.sQuoteVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "sQuoteVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "sQuoteCustomerCode",
        title: "Customer Code",
        render: (row: any) =>
            row?.sQuoteCustomerCode || row?.customerCode || "-",
    },
    {
        key: "sQuoteCustomerName",
        title: "Customer Name",
        render: (row: any) =>
            row?.sQuoteCustomerName || row?.customerName || "-",
    },
    {
        key: "sQuoteStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.sQuoteStatus || row?.status),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.sQuoteFooter?.netAmount ||
                row?.sQuoteFooter?.totalNetAmount ||
                row?.netAmount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   SALES ORDER COLUMNS
=================================================== */

const salesOrderColumns = [
    {
        key: "sOrderVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.sOrderVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "sOrderVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "sOrderCustomerCode",
        title: "Customer Code",
        render: (row: any) =>
            row?.sOrderCustomerCode || row?.customerCode || "-",
    },
    {
        key: "sOrderCustomerName",
        title: "Customer Name",
        render: (row: any) =>
            row?.sOrderCustomerName || row?.customerName || "-",
    },
    {
        key: "sOrderStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.sOrderStatus || row?.status),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.sOrderFooter?.netAmount ||
                row?.sOrderFooter?.totalNetAmount ||
                row?.netAmount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   SALES INVOICE COLUMNS
=================================================== */

const salesInvoiceColumns = [
    {
        key: "sInvVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.sInvVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "sInvVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "sInvCustomerCode",
        title: "Customer Code",
        render: (row: any) =>
            row?.sInvCustomerCode || row?.customerCode || "-",
    },
    {
        key: "sInvCustomerName",
        title: "Customer Name",
        render: (row: any) =>
            row?.sInvCustomerName || row?.customerName || "-",
    },
    {
        key: "sInvStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.sInvStatus || row?.status),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.sInvFooter?.netAmount ||
                row?.sInvFooter?.totalNetAmount ||
                row?.netAmount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   SALES RETURN COLUMNS
=================================================== */

const salesReturnColumns = [
    {
        key: "sInvReturnVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.sInvReturnVoucherNumber ||
            row?.sReturnVoucherNumber ||
            row?.voucherNumber ||
            "-",
    },
    {
        key: "sInvReturnVoucherDate",
        title: "Date",
        type: "date",
        render: (row: any) =>
            row?.sInvReturnVoucherDate ||
            row?.sReturnVoucherDate ||
            row?.voucherDate ||
            "-",
    },
    {
        key: "sInvReturnCustomerCode",
        title: "Customer Code",
        render: (row: any) =>
            row?.sInvReturnCustomerCode ||
            row?.sReturnCustomerCode ||
            row?.customerCode ||
            "-",
    },
    {
        key: "sInvReturnCustomerName",
        title: "Customer Name",
        render: (row: any) =>
            row?.sInvReturnCustomerName ||
            row?.sReturnCustomerName ||
            row?.customerName ||
            "-",
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) =>
            statusBadge(
                row?.sInvReturnStatus ||
                row?.sReturnStatus ||
                row?.status
            ),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.sInvReturnFooter?.netAmount ||
                row?.sInvReturnFooter?.totalNetAmount ||
                row?.sReturnFooter?.netAmount ||
                row?.sReturnFooter?.totalNetAmount ||
                row?.netAmount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   RECEIPT COLUMNS
=================================================== */

const receiptColumns = [
    {
        key: "recVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.recVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "recVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "recAccountCode",
        title: "Account Code",
        render: (row: any) =>
            row?.recAccountCode || row?.accountCode || "-",
    },
    {
        key: "recAccountName",
        title: "Account Name",
        render: (row: any) =>
            row?.recAccountName || row?.accountName || "-",
    },
    {
        key: "recStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.recStatus || row?.status),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.recFooter?.netAmount ||
                row?.recFooter?.totalNetAmount ||
                row?.netAmount ||
                row?.amount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   PAYMENT COLUMNS
=================================================== */

/* ===================================================
   PAYMENT COLUMNS
=================================================== */

const paymentColumns = [
    {
        key: "payVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.payVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "payVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "payAccountCode",
        title: "Paid From Code",
        render: (row: any) =>
            row?.payAccountCode || row?.accountCode || "-",
    },
    {
        key: "payAccountName",
        title: "Paid From",
        render: (row: any) =>
            row?.payAccountName || row?.accountName || "-",
    },
    {
        key: "payStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.payStatus || row?.status),
    },
    // {
    //     key: "payBody",
    //     title: "Parties",
    //     render: (row: any) => {
    //         const items = Array.isArray(row?.payBody)
    //             ? row.payBody
    //             : [];

    //         if (!items.length) return "-";

    //         return (
    //             <div className="flex flex-col gap-1">
    //                 {items.map((item: any, index: number) => (
    //                     <div key={index} className="flex flex-col text-xs">
    //                         <span className="font-bold text-card-foreground">
    //                             {item?.accountName || "-"}
    //                         </span>
    //                         <span className="text-muted-foreground">
    //                             {item?.accountCode || "-"} •{" "}
    //                             {amountText(item?.netAmount || item?.amount)}
    //                         </span>
    //                     </div>
    //                 ))}
    //             </div>
    //         );
    //     },
    // },
    // {
    //     key: "references",
    //     title: "References",
    //     render: (row: any) => {
    //         const body = Array.isArray(row?.payBody) ? row.payBody : [];

    //         const refs = body.flatMap((item: any) =>
    //             Array.isArray(item?.references) ? item.references : []
    //         );

    //         if (!refs.length) return "-";

    //         return (
    //             <div className="flex flex-col gap-1">
    //                 {refs.map((ref: any, index: number) => (
    //                     <div key={index} className="flex flex-col text-xs">
    //                         <span className="font-bold text-card-foreground">
    //                             {ref?.purchaseInvoice ||
    //                                 ref?.voucherNumber ||
    //                                 "-"}
    //                         </span>
    //                         <span className="text-muted-foreground">
    //                             {ref?.referenceType || "-"} • Adjusted:{" "}
    //                             {amountText(ref?.adjustedAmount)}
    //                         </span>
    //                     </div>
    //                 ))}
    //             </div>
    //         );
    //     },
    // },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.payFooter?.netAmount ||
                row?.netAmount ||
                row?.amount
            ),
    },
    {
        key: "adjustedAmount",
        title: "Adjusted",
        render: (row: any) =>
            amountText(row?.payFooter?.adjustedAmount),
    },
    // {
    //     key: "balanceAmount",
    //     title: "Balance",
    //     render: (row: any) =>
    //         amountText(row?.payFooter?.balanceAmount),
    // },
    // {
    //     key: "paymentMode",
    //     title: "Payment Mode",
    //     render: (row: any) =>
    //         row?.paymentMode || "-",
    // },
    // {
    //     key: "bankReferenceNumber",
    //     title: "Bank Ref.",
    //     render: (row: any) =>
    //         row?.bankReferenceNumber || "-",
    // },
    // {
    //     key: "payRemark",
    //     title: "Remark",
    //     render: (row: any) =>
    //         row?.payRemark || "-",
    // },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   PURCHASE ORDER COLUMNS
=================================================== */

const purchaseOrderColumns = [
    {
        key: "pOrdVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.pOrdVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "pOrdVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "pOrdVendorCode",
        title: "Vendor Code",
        render: (row: any) =>
            row?.pOrdVendorCode || row?.vendorCode || "-",
    },
    {
        key: "pOrdVendorName",
        title: "Vendor Name",
        render: (row: any) =>
            row?.pOrdVendorName || row?.vendorName || "-",
    },
    {
        key: "pOrdStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.pOrdStatus || row?.status),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.pOrdFooter?.netAmount ||
                row?.pOrdFooter?.totalNetAmount ||
                row?.netAmount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   GRN COLUMNS
=================================================== */

const grnColumns = [
    {
        key: "grnVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.grnVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "grnVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "grnVendorCode",
        title: "Vendor Code",
        render: (row: any) =>
            row?.grnVendorCode || row?.vendorCode || "-",
    },
    {
        key: "grnVendorName",
        title: "Vendor Name",
        render: (row: any) =>
            row?.grnVendorName || row?.vendorName || "-",
    },
    {
        key: "grnStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.grnStatus || row?.status),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.grnFooter?.netAmount ||
                row?.grnFooter?.totalNetAmount ||
                row?.netAmount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   PURCHASE RETURN COLUMNS
=================================================== */

const purchaseReturnColumns = [
    {
        key: "pRetVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.pRetVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "pRetVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "pRetVendorCode",
        title: "Vendor Code",
        render: (row: any) =>
            row?.pRetVendorCode || row?.vendorCode || "-",
    },
    {
        key: "pRetVendorName",
        title: "Vendor Name",
        render: (row: any) =>
            row?.pRetVendorName || row?.vendorName || "-",
    },
    {
        key: "pRetStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.pRetStatus || row?.status),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.pRetFooter?.netAmount ||
                row?.pRetFooter?.totalNetAmount ||
                row?.netAmount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

/* ===================================================
   PURCHASE INVOICE / PURCHASE REGISTER COLUMNS
=================================================== */

const purchaseInvoiceColumns = [
    {
        key: "pInvVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.pInvVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "pInvVoucherDate",
        title: "Date",
        type: "date",
    },
    {
        key: "pInvVendorCode",
        title: "Vendor Code",
        render: (row: any) =>
            row?.pInvVendorCode || row?.vendorCode || "-",
    },
    {
        key: "pInvVendorName",
        title: "Vendor Name",
        render: (row: any) =>
            row?.pInvVendorName || row?.vendorName || "-",
    },
    {
        key: "pInvStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.pInvStatus || row?.status),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(
                row?.pInvFooter?.netAmount ||
                row?.pInvFooter?.totalNetAmount ||
                row?.netAmount
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];
/* ===================================================
   OPENING BALANCE COLUMNS
=================================================== */

const openingBalanceColumns = [
    {
        key: "openingBalVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.openingBalVoucherNumber || "-",
    },
    {
        key: "openingBalDate",
        title: "Date",
        type: "date",
        render: (row: any) =>
            row?.openingBalDate || "-",
    },
    {
        key: "totalDebit",
        title: "Total Debit",
        render: (row: any) =>
            amountText(
                row?.openingBalFooter?.totalDebit
            ),
    },
    {
        key: "totalCredit",
        title: "Total Credit",
        render: (row: any) =>
            amountText(
                row?.openingBalFooter?.totalCredit
            ),
    },
    {
        key: "openingBalStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(
                row?.openingBalStatus
            ),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];
/* ===================================================
   OPENING STOCK COLUMNS
=================================================== */

/* ===================================================
   OPENING STOCK COLUMNS
=================================================== */

const openingStockColumns = [
    {
        key: "openingStockVoucherNumber",
        title: "Voucher No.",
        render: (row: any) =>
            row?.openingStockVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "openingStockDate",
        title: "Date",
        type: "date",
    },
    {
        key: "openingStockStatus",
        title: "Status",
        render: (row: any) =>
            statusBadge(row?.openingStockStatus || row?.status),
    },
    {
        key: "openingStockBody",
        title: "Items",
        render: (row: any) => {
            const items = Array.isArray(row?.openingStockBody)
                ? row.openingStockBody
                : [];

            return items.length || "-";
        },
    },
    {
        key: "products",
        title: "Products",
        render: (row: any) => {
            const items = Array.isArray(row?.openingStockBody)
                ? row.openingStockBody
                : [];

            if (!items.length) return "-";

            return (
                <div className="flex flex-col gap-1">
                    {items.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col text-xs">
                            <span className="font-bold text-card-foreground">
                                {item?.product || "-"}
                            </span>
                            <span className="text-muted-foreground">
                                Qty: {item?.quantity || "0"} | Rate:{" "}
                                {amountText(item?.rate)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        },
    },
    {
        key: "totalGrossAmount",
        title: "Gross Amount",
        render: (row: any) =>
            amountText(row?.openingStockFooter?.totalGrossAmount),
    },
    {
        key: "totalCGSTAmount",
        title: "CGST",
        render: (row: any) =>
            amountText(row?.openingStockFooter?.totalCGSTAmount),
    },
    {
        key: "totalSGSTAmount",
        title: "SGST",
        render: (row: any) =>
            amountText(row?.openingStockFooter?.totalSGSTAmount),
    },
    {
        key: "totalIGSTAmount",
        title: "IGST",
        render: (row: any) =>
            amountText(row?.openingStockFooter?.totalIGSTAmount),
    },
    {
        key: "totalOtherAmount",
        title: "Other Amount",
        render: (row: any) =>
            amountText(row?.openingStockFooter?.totalOtherAmount),
    },
    {
        key: "totalNetAmount",
        title: "Net Amount",
        render: (row: any) =>
            amountText(row?.openingStockFooter?.totalNetAmount),
    },
    {
        key: "createdOn",
        title: "Created On",
        type: "date",
    },
];

export {
    salesQuotationColumns,
    salesOrderColumns,
    salesInvoiceColumns,
    salesReturnColumns,
    receiptColumns,
    paymentColumns,
    purchaseOrderColumns,
    grnColumns,
    purchaseReturnColumns,
    purchaseInvoiceColumns,
    openingBalanceColumns,
    openingStockColumns
};