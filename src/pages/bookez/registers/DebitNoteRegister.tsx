import { useEffect, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";

import {
    toLocalEndOfDayUtc,
    toLocalStartOfDayUtc,
} from "../../../utils/helperFunctions";
import { toast } from "react-toastify";

import { Eye } from "lucide-react";
import { getDebitNoteByVoucherNumber } from "../../../redux/slices/professionalSlice/openingBalancesStocks/debitNoteSlice";
import { addDebitNoteRegister } from "../../../redux/slices/professionalSlice/bookEzRegister/debitNoteRegisterSlice";

const statusOptions = [
    { label: "Draft", value: "draft" },
    { label: "Open", value: "open" },
    { label: "Posted", value: "posted" },
    { label: "Close", value: "close" },
    { label: "Cancelled", value: "cancelled" },
];

const sourceTypeOptions = [
    { label: "Adjustment", value: "Adjustment" },
    { label: "Purchase Invoice", value: "purchaseInvoice" },
    { label: "Purchase Return", value: "purchaseReturn" },
];

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "voucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.voucherNumber || "-"}
            </span>
        ),
    },
    {
        key: "voucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate = row?.voucherDate;

            const date = rawDate
                ? new Date(rawDate).toLocaleDateString("en-IN")
                : "-";

            return (
                <span className="font-medium text-card-foreground">
                    {date}
                </span>
            );
        },
    },
    {
        key: "customer",
        title: "Vendor",
        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {row?.customer?.accountName || "-"}
                </span>

                <span className="text-xs text-muted-foreground">
                    {row?.customer?.accountCode || "-"}
                </span>
            </div>
        ),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) => (
            <span className="font-bold text-foreground">
                ₹{Number(
                    row?.totals?.netAmount || 0
                ).toFixed(2)}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) => {
            const status =
                row?.status || "-";

            const isOpen =
                String(
                    status
                ).toLowerCase() ===
                "open";

            return (
                <span
                    className={`
                        rounded-full px-3 py-1 text-xs font-bold uppercase
                        ${isOpen
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }
                    `}
                >
                    {status}
                </span>
            );
        },
    },
];

/* ===================================================
   HELPERS
=================================================== */

const getVoucherRecordFromResponse = (
    res: any,
    voucherNumber: string
) => {
    if (
        res?.voucherNumber ===
        voucherNumber
    ) {
        return res;
    }

    if (
        res?.data?.voucherNumber ===
        voucherNumber
    ) {
        return res.data;
    }

    if (res?.debitNote) {
        return res.debitNote;
    }

    if (res?.data?.debitNote) {
        return res.data.debitNote;
    }

    if (res?.record) {
        return res.record;
    }

    if (res?.data?.record) {
        return res.data.record;
    }

    const records =
        Array.isArray(res)
            ? res
            : Array.isArray(
                res?.debitNotes
            )
                ? res.debitNotes
                : Array.isArray(
                    res?.records
                )
                    ? res.records
                    : Array.isArray(
                        res?.data
                    )
                        ? res.data
                        : Array.isArray(
                            res?.data
                                ?.debitNotes
                        )
                            ? res.data
                                .debitNotes
                            : Array.isArray(
                                res?.data
                                    ?.records
                            )
                                ? res.data
                                    .records
                                : [];

    return (
        records.find(
            (item: any) =>
                item?.voucherNumber ===
                voucherNumber
        ) ||
        records[0] ||
        null
    );
};

const normalizeDebitNoteForView = (
    record: any
) => {
    const rawItems =
        Array.isArray(
            record?.items
        )
            ? record.items
            : [];

    const items =
        rawItems.map(
            (
                row: any
            ) => ({
                ...row,

                id:
                    row?.id ||
                    `${Date.now()}-${Math.random()}`,

                productCode:
                    row?.productCode ||
                    "",

                productName:
                    row?.productName ||
                    "",

                quantity:
                    row?.quantity ??
                    "",

                unit:
                    row?.unit ||
                    row?.uom ||
                    "",

                uom:
                    row?.uom ||
                    row?.unit ||
                    "",

                rate:
                    row?.rate ??
                    "",

                grossAmount:
                    row?.grossAmount ??
                    0,

                discount:
                    row?.discount ??
                    "",

                discountAmount:
                    row?.discountAmount ??
                    0,

                taxableAmount:
                    row?.taxableAmount ??
                    0,

                cgstPercent:
                    row?.cgstPercent ??
                    row?.cgst ??
                    "",

                cgstAmount:
                    row?.cgstAmount ??
                    0,

                sgstPercent:
                    row?.sgstPercent ??
                    row?.sgst ??
                    "",

                sgstAmount:
                    row?.sgstAmount ??
                    0,

                igstPercent:
                    row?.igstPercent ??
                    row?.igst ??
                    "",

                igstAmount:
                    row?.igstAmount ??
                    0,

                netAmount:
                    row?.netAmount ??
                    0,

                remarks:
                    row?.remarks ||
                    "",
            })
        );

    const totals =
        record?.totals ||
        {};

    const isAdjustmentOnly =
        Boolean(
            record?.adjustmentOnly
        );

    return {
        ...record,

        voucherNumber:
            record?.voucherNumber ||
            record?.debitNoteNumber ||
            "AUTO",

        voucherno:
            record?.voucherNumber ||
            record?.debitNoteNumber ||
            "AUTO",

        voucherDate:
            record?.voucherDate
                ? String(
                    record.voucherDate
                ).split("T")[0]
                : "",

        voucherType:
            record?.voucherType ||
            "salesDebitNote",

        customerCode:
            record?.customer
                ?.accountCode ||
            record?.customerCode ||
            "",

        customerName:
            record?.customer
                ?.accountName ||
            record?.customerName ||
            "",

        sourceType:
            record?.sourceType ||
            "Adjustment",

        invoiceNumber:
            record?.reference
                ?.purchaseInvoice
                ?.invoiceNumber ||
            record?.invoiceNumber ||
            "",

        purchaseReturnNumber:
            record?.reference
                ?.purchaseReturn
                ?.purchaseReturnNumber ||
            record?.purchaseReturnNumber ||
            "",

        referenceNumber:
            record?.reference
                ?.purchaseInvoice
                ?.invoiceNumber ||
            record?.reference
                ?.purchaseReturn
                ?.purchaseReturnNumber ||
            record?.referenceNumber ||
            "",

        reason:
            record?.reason ||
            "",

        adjustmentOnly:
            isAdjustmentOnly,

        adjustmentNetAmount:
            isAdjustmentOnly
                ? String(
                    totals?.netAmount ||
                    record?.netAmount ||
                    ""
                )
                : "",

        remark:
            record?.remarks ||
            record?.remark ||
            "",

        remarks:
            record?.remarks ||
            record?.remark ||
            "",

        status:
            record?.status ||
            "draft",

        items,

        totalQty:
            totals?.totalQty ??
            0,

        grossAmount:
            totals?.grossAmount ??
            0,

        totalCgst:
            totals?.totalCgst ??
            0,

        totalSgst:
            totals?.totalSgst ??
            0,

        totalIgst:
            totals?.totalIgst ??
            0,

        totalDiscount:
            totals?.totalDiscount ??
            0,

        netAmount:
            totals?.netAmount ??
            record?.netAmount ??
            0,
    };
};

/* ===================================================
   COMPONENT
=================================================== */

const DebitNoteRegister = () => {
    const dispatch =
        useDispatch<any>();

    /* ===================================================
       FILTER STATES
    =================================================== */

    const [
        fromDate,
        setFromDate,
    ] =
        useState<string>("");

    const [
        toDate,
        setToDate,
    ] =
        useState<string>("");

    const [
        dateError,
        setDateError,
    ] =
        useState<string>("");

    const [
        customer,
        setCustomer,
    ] =
        useState<string>("");

    const [
        product,
        setProduct,
    ] =
        useState<string>("");

    const [
        localOffset,
        setLocalOffset,
    ] =
        useState(0);

    const [
        localLimit,
        setLocalLimit,
    ] =
        useState(10);

    const [
        refreshKey,
        setRefreshKey,
    ] =
        useState(0);

    const [
        pdfLoading,
        setPdfLoading,
    ] =
        useState(false);

    const [
        excelLoading,
        setExcelLoading,
    ] =
        useState(false);

    /* ===================================================
       VIEW MODAL STATES
    =================================================== */

    const [
        viewModal,
        setViewModal,
    ] =
        useState(false);

    const [
        viewLoading,
        setViewLoading,
    ] =
        useState(false);

    const [
        viewForm,
        setViewForm,
    ] =
        useState<any>({});

    const [
        viewErrors,
        setViewErrors,
    ] =
        useState<any>({});

    /* ===================================================
       REDUX SELECTORS
    =================================================== */

    const {
        accounts = [],
    } = useSelector(
        (
            state: any
        ) =>
            state
                .accountMaster
    );

    const {
        products = [],
    } = useSelector(
        (
            state: any
        ) =>
            state
                .productMaster
    );

    const debitNoteRegisterState = useSelector(
        (state: any) => state.debitNoteRegister || {}
    );

    const {
        addLoader = false,
        pagination = {},
    } = debitNoteRegisterState;

    /* ===================================================
       OPTIONS
    =================================================== */

    const customerOptions =
        useMemo(() => {
            return (
                accounts ||
                []
            )
                .map(
                    (
                        item: any
                    ) => ({
                        label:
                            item
                                ?.accountName ||
                            "",

                        value:
                            item
                                ?.accountCode ||
                            "",
                    })
                )
                .filter(
                    (
                        item: any
                    ) =>
                        item
                            .label &&
                        item
                            .value
                );
        }, [
            accounts,
        ]);

    const productOptions =
        useMemo(() => {
            return (
                products ||
                []
            )
                .map(
                    (
                        item: any
                    ) => ({
                        label:
                            item
                                ?.productName ||
                            "",

                        value:
                            item
                                ?.productCode ||
                            "",
                    })
                )
                .filter(
                    (
                        item: any
                    ) =>
                        item
                            .label &&
                        item
                            .value
                );
        }, [
            products,
        ]);

    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData = useMemo(() => {
        const data =
            debitNoteRegisterState?.debitNoteRegisterData ||
            debitNoteRegisterState?.debitNotes ||
            debitNoteRegisterState?.records ||
            debitNoteRegisterState?.data ||
            debitNoteRegisterState?.creditNoteRegisterData ||
            [];

        return Array.isArray(data) ? data : [];
    }, [debitNoteRegisterState]);

    const currentPagination =
        useMemo(() => {
            return (
                pagination ||
                {}
            );
        }, [
            pagination,
        ]);

    const hasRegisterData =
        tableData.length >
        0;

    const validateDates =
        (): boolean => {
            if (
                !fromDate &&
                !toDate
            ) {
                setDateError(
                    ""
                );

                return true;
            }

            if (
                !fromDate ||
                !toDate
            ) {
                setDateError(
                    "Please select both From Date and To Date."
                );

                return false;
            }

            if (
                new Date(
                    fromDate
                ).getTime() >
                new Date(
                    toDate
                ).getTime()
            ) {
                setDateError(
                    "From Date cannot be greater than To Date."
                );

                return false;
            }

            setDateError(
                ""
            );

            return true;
        };

    /* ===================================================
       PAYLOAD
    =================================================== */

    const getPayload = (
        exportType:
            | "pdf"
            | "excel"
            | "" = ""
    ) => {
        const isExport =
            Boolean(
                exportType
            );

        return {
            fromDate: fromDate ? toLocalStartOfDayUtc(fromDate) : "",
            toDate: toDate ? toLocalEndOfDayUtc(toDate) : "",

            offset:
                isExport
                    ? 0
                    : localOffset,

            limit:
                isExport
                    ? 120000
                    : localLimit,

            customerCode:
                customer,

            productCode:
                product,

            customCodes:
                [""],

            ...(isExport
                ? {
                    exportType,
                }
                : {
                    exportType:
                        "" as const,
                }),
        };
    };

    /* ===================================================
       LOAD MASTER DATA
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                search: "",
                accountType:
                    "vendor",
            })
        );
    }, [
        dispatch,
    ]);

    useEffect(() => {
        dispatch(
            getAllProducts({
                limit: 200,
                offset: 0,
                search: "",
            })
        );
    }, [
        dispatch,
    ]);

    useEffect(() => {
        if (
            (
                fromDate &&
                !toDate
            ) ||
            (
                !fromDate &&
                toDate
            )
        ) {
            return;
        }

        if (
            fromDate &&
            toDate &&
            new Date(
                fromDate
            ).getTime() >
            new Date(
                toDate
            ).getTime()
        ) {
            return;
        }

        dispatch(
            addDebitNoteRegister(
                getPayload()
            )
        );
    }, [
        dispatch,
        fromDate,
        toDate,
        customer,
        product,
        localOffset,
        localLimit,
        refreshKey,
    ]);

    const viewInputData =
        useMemo(() => {
            const header: any[] = [
                {
                    key: "voucherno",
                    label: "Voucher No",
                    type: "text",
                    disabled: true,
                },
                {
                    key: "voucherDate",
                    label: "Date",
                    type: "date",
                    disabled: true,
                },
                {
                    key: "customerCode",
                    label: "Vendor",
                    type: "select",
                    disabled: true,
                    options:
                        customerOptions,
                },
                {
                    key: "status",
                    label: "Status",
                    type: "select",
                    disabled: true,
                    options:
                        statusOptions,
                },
                {
                    key: "sourceType",
                    label: "Source Type",
                    type: "select",
                    disabled: true,
                    options:
                        sourceTypeOptions,
                },
                {
                    key: "reason",
                    label: "Reason",
                    type: "text",
                    disabled: true,
                },
            ];

            if (
                viewForm?.sourceType ===
                "purchaseInvoice"
            ) {
                header.push({
                    key: "invoiceNumber",
                    label: "Reference-Purchase Invoice",
                    type: "text",
                    disabled: true,
                });
            }

            if (
                viewForm?.sourceType ===
                "purchaseReturn"
            ) {
                header.push({
                    key: "purchaseReturnNumber",
                    label: "Reference-Purchase Return",
                    type: "text",
                    disabled: true,
                });
            }

            header.push({
                key: "adjustmentOnly",
                label: "Adjustment Only",
                type: "toggle",
                disabled: true,
            });

            if (
                viewForm?.sourceType === "Adjustment" ||
                viewForm?.adjustmentOnly
            ) {
                header.push({
                    key: "adjustmentNetAmount",
                    label: "Adjustment Net Amount",
                    type: "number",
                    disabled: true,
                });
            }

            header.push({
                key: "remark",
                label: "Remarks",
                type: "textarea",
                disabled: true,
                colSpan: "full",
            });

            const body =
                viewForm?.sourceType !==
                    "Adjustment" &&
                    !viewForm?.adjustmentOnly
                    ? [
                        {
                            key: "productCode",
                            label: "Product",
                            title: "Product",
                            type: "select",
                            width: "260px",
                            disabled: true,
                            options:
                                productOptions,
                        },
                        {
                            key: "quantity",
                            label: "Qty",
                            title: "Qty",
                            type: "number",
                            width: "110px",
                            align: "right",
                            disabled: true,
                        },
                        {
                            key: "rate",
                            label: "Rate",
                            title: "Rate",
                            type: "number",
                            width: "140px",
                            align: "right",
                            disabled: true,
                        },
                        {
                            key: "discount",
                            label: "Discount %",
                            title: "Discount %",
                            type: "number",
                            width: "140px",
                            align: "right",
                            disabled: true,
                        },
                        {
                            key: "cgstPercent",
                            label: "CGST %",
                            title: "CGST %",
                            type: "number",
                            width: "120px",
                            align: "right",
                            disabled: true,
                        },
                        {
                            key: "sgstPercent",
                            label: "SGST %",
                            title: "SGST %",
                            type: "number",
                            width: "120px",
                            align: "right",
                            disabled: true,
                        },
                        {
                            key: "igstPercent",
                            label: "IGST %",
                            title: "IGST %",
                            type: "number",
                            width: "120px",
                            align: "right",
                            disabled: true,
                        },
                        {
                            key: "remarks",
                            label: "Line Remarks",
                            title: "Line Remarks",
                            type: "text",
                            width: "220px",
                            disabled: true,
                        },
                    ]
                    : [];

            const footer = [
                {
                    key: "totalQty",
                    label: "Total Quantity",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value:
                        Number(
                            viewForm?.totalQty ||
                            0
                        ).toFixed(2),
                    rawValue:
                        viewForm?.totalQty ||
                        "0.00",
                },
                {
                    key: "grossAmount",
                    label: "Gross Amount",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value:
                        Number(
                            viewForm?.grossAmount ||
                            0
                        ).toFixed(2),
                    rawValue:
                        viewForm?.grossAmount ||
                        "0.00",
                },
                {
                    key: "totalCgst",
                    label: "CGST",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value:
                        Number(
                            viewForm?.totalCgst ||
                            0
                        ).toFixed(2),
                    rawValue:
                        viewForm?.totalCgst ||
                        "0.00",
                },
                {
                    key: "totalSgst",
                    label: "SGST",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value:
                        Number(
                            viewForm?.totalSgst ||
                            0
                        ).toFixed(2),
                    rawValue:
                        viewForm?.totalSgst ||
                        "0.00",
                },
                {
                    key: "totalIgst",
                    label: "IGST",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value:
                        Number(
                            viewForm?.totalIgst ||
                            0
                        ).toFixed(2),
                    rawValue:
                        viewForm?.totalIgst ||
                        "0.00",
                },
                {
                    key: "totalDiscount",
                    label: "Discount",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value:
                        Number(
                            viewForm?.totalDiscount ||
                            0
                        ).toFixed(2),
                    rawValue:
                        viewForm?.totalDiscount ||
                        "0.00",
                },
                {
                    key: "netAmount",
                    label: "Net Amount",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value:
                        Number(
                            viewForm?.netAmount ||
                            0
                        ).toFixed(2),
                    rawValue:
                        viewForm?.netAmount ||
                        "0.00",
                },
            ];

            return {
                header,
                body,
                footer,
            };
        }, [
            customerOptions,
            productOptions,
            viewForm,
        ]);

    const viewFooterTotals =
        useMemo(() => ({
            totalQty:
                viewForm?.totalQty ||
                "0.00",

            grossAmount:
                viewForm?.grossAmount ||
                "0.00",

            totalCgst:
                viewForm?.totalCgst ||
                "0.00",

            totalSgst:
                viewForm?.totalSgst ||
                "0.00",

            totalIgst:
                viewForm?.totalIgst ||
                "0.00",

            totalDiscount:
                viewForm?.totalDiscount ||
                "0.00",

            netAmount:
                viewForm?.netAmount ||
                "0.00",
        }), [
            viewForm,
        ]);

    /* ===================================================
       HANDLERS
    =================================================== */

    const handleRefresh =
        () => {
            if (
                !validateDates()
            ) {
                return;
            }

            setLocalOffset(
                0
            );

            setRefreshKey(
                (
                    prev
                ) =>
                    prev +
                    1
            );
        };

    const handleClear =
        () => {
            setDateError(
                ""
            );

            setFromDate(
                ""
            );

            setToDate(
                ""
            );

            setCustomer(
                ""
            );

            setProduct(
                ""
            );

            setLocalOffset(
                0
            );

            setRefreshKey(
                (
                    prev
                ) =>
                    prev +
                    1
            );
        };

    const handleViewVoucher =
        async (
            row: any
        ) => {
            const voucherNumber =
                row
                    ?.voucherNumber ||
                "";

            if (
                !voucherNumber
            ) {
                console.log(
                    "Sales debit note voucher number missing:",
                    row
                );

                return;
            }

            try {
                setViewModal(
                    true
                );

                setViewLoading(
                    true
                );

                setViewErrors(
                    {}
                );

                setViewForm(
                    {}
                );

                const res =
                    await dispatch(
                        getDebitNoteByVoucherNumber({
                            voucherNumber,
                        }) as any
                    ).unwrap();

                const record =
                    getVoucherRecordFromResponse(
                        res,
                        voucherNumber
                    );

                if (
                    !record
                ) {
                    console.log(
                        "Sales debit note not found:",
                        voucherNumber,
                        res
                    );

                    setViewForm(
                        {}
                    );

                    return;
                }

                setViewForm(
                    normalizeDebitNoteForView(
                        record
                    )
                );
            } catch (
            error
            ) {
                console.log(
                    "Sales debit note register view failed",
                    error
                );

                setViewForm(
                    {}
                );
            } finally {
                setViewLoading(
                    false
                );
            }
        };

    const downloadBlobFile = (
        blob: Blob,
        fileName: string
    ) => {
        const url =
            window.URL
                .createObjectURL(
                    blob
                );

        const link =
            document
                .createElement(
                    "a"
                );

        link.href =
            url;

        link.download =
            fileName;

        document.body
            .appendChild(
                link
            );

        link.click();

        link.remove();

        window.URL
            .revokeObjectURL(
                url
            );
    };

    const downloadRegister =
        async (
            type:
                | "pdf"
                | "excel"
        ) => {
            if (
                !hasRegisterData ||
                pdfLoading ||
                excelLoading ||
                !validateDates()
            ) {
                return;
            }

            try {
                if (
                    type ===
                    "pdf"
                ) {
                    setPdfLoading(
                        true
                    );
                } else {
                    setExcelLoading(
                        true
                    );
                }

                const res =
                    await dispatch(
                        addDebitNoteRegister(
                            getPayload(
                                type
                            )
                        )
                    ).unwrap();

                if (
                    res?.blob
                ) {
                    downloadBlobFile(
                        res.blob,
                        type ===
                            "pdf"
                            ? "sales-debit-note-register.pdf"
                            : "sales-debit-note-register.xlsx"
                    );
                }
            } catch (
            error:
                any
            ) {
                console.log(
                    `Sales debit note register ${type.toUpperCase()} download failed`,
                    error
                );

                toast.error(
                    error
                        ?.response
                        ?.data
                        ?.message ||
                    error
                        ?.response
                        ?.data
                        ?.error ||
                    error
                        ?.message ||
                    `Failed to download ${type.toUpperCase()}`
                );
            } finally {
                setPdfLoading(
                    false
                );

                setExcelLoading(
                    false
                );
            }
        };

    const handleDownloadPdf =
        () =>
            downloadRegister(
                "pdf"
            );

    const handleDownloadExcel =
        () =>
            downloadRegister(
                "excel"
            );

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Sales Debit Note Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate,
                        onChange: (value) => {
                            setFromDate(value || "");
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate,
                        onChange: (value) => {
                            setToDate(value || "");
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                    {
                        key: "customer",
                        type: "select",
                        label: "Vendor",
                        placeholder:
                            "--Select Vendor--",

                        value:
                            customer,

                        options:
                            customerOptions,

                        onChange: (
                            value
                        ) => {
                            setCustomer(
                                value
                            );

                            setLocalOffset(
                                0
                            );
                        },
                    },
                    {
                        key: "product",
                        type: "select",
                        label: "Product",
                        placeholder:
                            "--Select Product--",

                        value:
                            product,

                        options:
                            productOptions,

                        onChange: (
                            value
                        ) => {
                            setProduct(
                                value
                            );

                            setLocalOffset(
                                0
                            );
                        },
                    },
                ]}
                gridCols="4"
                onSearch={
                    handleRefresh
                }
                onClear={
                    handleClear
                }
                onDownloadPdf={
                    handleDownloadPdf
                }
                onDownloadExcel={
                    handleDownloadExcel
                }
                pdfDisabled={
                    !hasRegisterData ||
                    pdfLoading ||
                    excelLoading
                }
                excelDisabled={
                    !hasRegisterData ||
                    excelLoading ||
                    pdfLoading
                }
                pdfLoading={
                    pdfLoading
                }
                excelLoading={
                    excelLoading
                }
                downloadDisabledMessage={
                    !hasRegisterData
                        ? "No data available to export."
                        : "Please wait, export is processing."
                }
            />

            {dateError && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                    {dateError}
                </div>
            )}

            <DataTable
                columns={
                    mainColumns
                }
                data={
                    tableData
                }
                loading={
                    addLoader
                }
                emptyMessage="No sales debit note register data found"
                showFieldSelector={
                    false
                }
                actions={(
                    row:
                        any
                ) => (
                    <button
                        type="button"
                        onClick={(
                            e
                        ) => {
                            e.stopPropagation();

                            handleViewVoucher(
                                row
                            );
                        }}
                        className="
                            inline-flex cursor-pointer items-center gap-1 rounded-lg
                            bg-primary/10 px-3 py-1.5 text-xs font-bold
                            text-primary transition hover:bg-primary/20
                        "
                    >
                        <Eye
                            size={
                                15
                            }
                        />
                    </button>
                )}
            />

            <DynamicAddForm
                isView={
                    true
                }
                show={
                    viewModal
                }
                setShow={
                    setViewModal
                }
                edit={
                    true
                }
                title="View Debit Note"
                subtitle="Debit note details"
                loading={
                    viewLoading
                }
                contentLoading={
                    viewLoading
                }
                onClose={() => {
                    setViewModal(
                        false
                    );

                    setViewForm(
                        {}
                    );

                    setViewErrors(
                        {}
                    );
                }}
                onSubmit={() => { }}
                manualselected={
                    viewForm?.sourceType === "Adjustment" ||
                    Boolean(
                        viewForm?.adjustmentOnly
                    )
                }
                form={
                    viewForm
                }
                errors={
                    viewErrors
                }
                handleAddRow={() => { }}
                handleDeleteRow={() => { }}
                handleRowChange={() => { }}
                inputData={
                    viewInputData
                }
                bodyKey="items"
                handleChange={() => { }}
                footerTotals={
                    viewFooterTotals
                }
            />

            {currentPagination
                ?.totalDocs >
                0 && (
                    <div className="mt-2">
                        <Pagination
                            localLimit={
                                localLimit
                            }
                            selectCb={(
                                e:
                                    any
                            ) => {
                                setLocalLimit(
                                    Number(
                                        e
                                            .target
                                            .value
                                    )
                                );

                                setLocalOffset(
                                    0
                                );
                            }}
                            preDisabled={
                                !currentPagination
                                    ?.hasPrevPage
                            }
                            nextDisabled={
                                !currentPagination
                                    ?.hasNextPage
                            }
                            setLocalOffset={
                                setLocalOffset
                            }
                            pagination={
                                currentPagination
                            }
                        />
                    </div>
                )}
        </div>
    );
};

export default DebitNoteRegister;