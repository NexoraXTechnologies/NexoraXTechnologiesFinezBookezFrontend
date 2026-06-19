import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import RegisterFilterCard from "./RegisterFilterCard";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";

import {
    addReceiptRegister,
} from "../../../redux/slices/professionalSlice/bookEzRegister/receiptRegisterSlice";

import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberSalesReceiptList } from "../../../redux/slices/professionalSlice/salesWorkflow/salesReceipt";

import { loadAllTemplateOptions } from "../../../utils/helperFunctions";

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "recVoucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-slate-800">
                {row?.recVoucherNumber || row?.voucherNumber || "-"}
            </span>
        ),
    },
    {
        key: "recVoucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate =
                row?.recVoucherDate ||
                row?.voucherDate ||
                row?.date;

            const date = rawDate
                ? new Date(rawDate).toLocaleDateString("en-IN")
                : "-";

            return (
                <span className="font-medium text-slate-700">
                    {date}
                </span>
            );
        },
    },
    {
        key: "recAccountName",
        title: "Account",
        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-slate-800">
                    {row?.recAccountName || row?.accountName || "-"}
                </span>
                <span className="text-xs text-slate-500">
                    {row?.recAccountCode || row?.accountCode || "-"}
                </span>
            </div>
        ),
    },
    {
        key: "adjusted",
        title: "Adjusted Amount",
        render: (row: any) => (
            <span className="font-bold text-slate-900">
                ₹{Number(
                    row?.recFooter?.netAmount ||
                    row?.netAmount ||
                    row?.amount ||
                    0
                ).toFixed(2)}
            </span>
        ),
    },
    // {
    //     key: "recStatus",
    //     title: "Status",
    //     render: (row: any) => {
    //         const status = row?.recStatus || row?.status || "-";
    //         const isOpen = String(status).toLowerCase() === "open";

    //         return (
    //             <span
    //                 className={`
    //                     rounded-full px-3 py-1 text-xs font-bold uppercase
    //                     ${
    //                         isOpen
    //                             ? "bg-emerald-50 text-emerald-700"
    //                             : "bg-slate-100 text-slate-600"
    //                     }
    //                 `}
    //             >
    //                 {status}
    //             </span>
    //         );
    //     },
    // },
];

/* ===================================================
   HELPERS
=================================================== */

const getVoucherRecordFromResponse = (res: any, voucherNumber: string) => {
    if (res?.receipt) return res.receipt;
    if (res?.data?.receipt) return res.data.receipt;

    if (res?.record) return res.record;
    if (res?.data?.record) return res.data.record;

    if (
        res &&
        typeof res === "object" &&
        res?.recVoucherNumber === voucherNumber
    ) {
        return res;
    }

    if (
        res?.data &&
        typeof res.data === "object" &&
        res.data?.recVoucherNumber === voucherNumber
    ) {
        return res.data;
    }

    const records =
        Array.isArray(res)
            ? res
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.receipts)
                    ? res.receipts
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.data?.records)
                            ? res.data.records
                            : Array.isArray(res?.data?.receipts)
                                ? res.data.receipts
                                : [];

    return (
        records.find(
            (item: any) =>
                item?.recVoucherNumber === voucherNumber ||
                item?.voucherNumber === voucherNumber
        ) ||
        records[0] ||
        null
    );
};

const normalizeReceiptForView = (record: any) => {
    const footer = record?.recFooter || {};

    const recBody = (record?.recBody || []).map((item: any) => ({
        accountCode: item?.accountCode || "",
        accountName: item?.accountName || "",
        amount: item?.amount || "0",
        netAmount: item?.netAmount || item?.amount || "0",
    }));

    return {
        ...record,

        recVoucherNumber:
            record?.recVoucherNumber || record?.voucherNumber || "",

        recVoucherDate:
            record?.recVoucherDate || record?.voucherDate || "",

        recAccountCode:
            record?.recAccountCode || record?.accountCode || "",

        recAccountName:
            record?.recAccountName || record?.accountName || "",

        recStatus:
            record?.recStatus || record?.status || "open",

        recRemark:
            record?.recRemark || record?.remark || "",

        recBody,

        grossAmount: "0.00",
        discountAmount: "0.00",
        cgstAmount: "0.00",
        sgstAmount: "0.00",
        igstAmount: "0.00",
        taxAmount: "0.00",
        otherAmount: "0.00",

        netAmount:
            footer?.netAmount || record?.netAmount || "0.00",

        adjustedAmount:
            footer?.adjustedAmount || record?.adjustedAmount || "0.00",

        balanceAmount:
            footer?.balanceAmount || record?.balanceAmount || "0.00",

        totalQuantity: "0",
    };
};

/* ===================================================
   COMPONENT
=================================================== */

const ReceiptRegister = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
       FILTER STATES
       Blank dates = no default filter.
    =================================================== */

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [account, setAccount] = useState<string>("");

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [refreshKey, setRefreshKey] = useState(0);

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    /* ===================================================
       VIEW MODAL STATES
    =================================================== */

    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewForm, setViewForm] = useState<any>({});
    const [viewErrors, setViewErrors] = useState<any>({});

    const [viewTemplateFields, setViewTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    /* ===================================================
       REDUX SELECTORS
    =================================================== */

    const { accounts = [] } = useSelector(
        (state: any) => state.accountMaster
    );

    const {
        receiptRegisterData = [],
        addLoader = false,
        pagination = {},
    } = useSelector((state: any) => state.receiptRegister);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    /* ===================================================
       FILTER ACTIVE CHECK
    =================================================== */

    const hasAnyFilter = useMemo(() => {
        return Boolean(fromDate || toDate || account);
    }, [fromDate, toDate, account]);

    /* ===================================================
       OPTIONS
    =================================================== */

    const accountOptions = useMemo(() => {
        return (accounts || [])
            .map((item: any) => ({
                label: item?.accountName || "",
                value: item?.accountCode || "",
            }))
            .filter((item: any) => item.label && item.value);
    }, [accounts]);

    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData = useMemo(() => {
        return Array.isArray(receiptRegisterData)
            ? receiptRegisterData
            : [];
    }, [receiptRegisterData]);

    const currentPagination = useMemo(() => {
        return pagination || {};
    }, [pagination]);

    /* ===================================================
       PAYLOAD
    =================================================== */

    const getPayload = (exportType: "pdf" | "excel" | "" = "") => {
        return {
            fromDate,
            toDate,
            offset: localOffset,
            limit: localLimit,
            accountCode: account,
            exportType,
        };
    };

    /* ===================================================
       LOAD ACCOUNT MASTER
    =================================================== */

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                search: "",
                
            })
        );
    }, [dispatch]);

    /* ===================================================
       LOAD RECEIPT REGISTER DATA
       Auto refresh on filter / pagination / refresh click.
    =================================================== */

    useEffect(() => {
        dispatch(addReceiptRegister(getPayload()));
    }, [
        dispatch,
        fromDate,
        toDate,
        account,
        localOffset,
        localLimit,
        refreshKey,
    ]);

    /* ===================================================
       PREPARE VIEW TEMPLATE FIELDS
    =================================================== */

    useEffect(() => {
        const prepareViewFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema =
                Array.isArray(transactionsSchema?.header) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                const updatedData = await loadAllTemplateOptions(
                    transactionsSchema
                );

                setViewTemplateFields(updatedData);
            } catch (error) {
                console.log("Failed to prepare receipt view fields", error);
            }
        };

        prepareViewFields();
    }, [transactionsSchema]);

    /* ===================================================
       VIEW FOOTER DATA
    =================================================== */

    const viewFooterTotals = useMemo(() => {
        return {
            grossAmount: viewForm?.grossAmount || "0.00",
            discountAmount: viewForm?.discountAmount || "0.00",
            cgstAmount: viewForm?.cgstAmount || "0.00",
            sgstAmount: viewForm?.sgstAmount || "0.00",
            igstAmount: viewForm?.igstAmount || "0.00",
            taxAmount: viewForm?.taxAmount || "0.00",
            otherAmount: viewForm?.otherAmount || "0.00",
            netAmount: viewForm?.netAmount || "0.00",
            adjustedAmount: viewForm?.adjustedAmount || "0.00",
            balanceAmount: viewForm?.balanceAmount || "0.00",
            totalQuantity: viewForm?.totalQuantity || "0",
        };
    }, [viewForm]);

    const viewFooterArray = useMemo(() => {
        return (viewTemplateFields?.footer || [])
            .filter((field: any) => !field.isHidden)
            .map((field: any) => {
                const rawValue =
                    viewFooterTotals?.[
                        field.key as keyof typeof viewFooterTotals
                    ] ?? "0.00";

                return {
                    ...field,
                    value: rawValue,
                    rawValue,
                };
            });
    }, [viewTemplateFields?.footer, viewFooterTotals]);

    const viewInputData = useMemo(() => {
        const hiddenBodyKeys = [
            "references",
            "reference",
            "remarks",
            "remark",
            "recRemark",
        ];

        const filteredBody = (viewTemplateFields?.body || []).filter(
            (field: any) =>
                !hiddenBodyKeys.includes(String(field?.key || "").toLowerCase())
        );

        return {
            ...viewTemplateFields,
            body: filteredBody,
            footer: viewFooterArray,
        };
    }, [viewTemplateFields, viewFooterArray]);

    /* ===================================================
       HANDLERS
    =================================================== */

    const handleRefresh = () => {
        setLocalOffset(0);
        setRefreshKey((prev) => prev + 1);
    };

    const handleClear = () => {
        setFromDate("");
        setToDate("");
        setAccount("");
        setLocalOffset(0);
        setRefreshKey((prev) => prev + 1);
    };

    const handleViewVoucher = async (row: any) => {
        const voucherNumber =
            row?.recVoucherNumber || row?.voucherNumber || "";

        if (!voucherNumber) {
            console.log("Receipt voucher number missing:", row);
            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});

            await dispatch(getAllTransactionSchema("receipt") as any);

            const res = await dispatch(
                getByVoucherNumberSalesReceiptList({
                    voucherNumber,
                }) as any
            ).unwrap();

            const record = getVoucherRecordFromResponse(res, voucherNumber);

            if (!record) {
                console.log("Receipt not found:", voucherNumber, res);
                setViewForm({});
                return;
            }

            setViewForm(normalizeReceiptForView(record));
        } catch (error) {
            console.log("Receipt register view failed", error);
            setViewForm({});
        } finally {
            setViewLoading(false);
        }
    };

    const downloadBlobFile = (blob: Blob, fileName: string) => {
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = async () => {
        if (!hasAnyFilter || pdfLoading) return;

        try {
            setPdfLoading(true);

            const res = await dispatch(
                addReceiptRegister(getPayload("pdf"))
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(res.blob, "receipt-register.pdf");
            }
        } catch (error) {
            console.log("Receipt register PDF download failed", error);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!hasAnyFilter || excelLoading) return;

        try {
            setExcelLoading(true);

            const res = await dispatch(
                addReceiptRegister(getPayload("excel"))
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(res.blob, "receipt-register.xlsx");
            }
        } catch (error) {
            console.log("Receipt register Excel download failed", error);
        } finally {
            setExcelLoading(false);
        }
    };

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-slate-50 p-4">
            <RegisterFilterCard
                title="Receipt Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate,
                        onChange: (value) => {
                            setFromDate(value);
                            setLocalOffset(0);
                        },
                        required: false,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate,
                        onChange: (value) => {
                            setToDate(value);
                            setLocalOffset(0);
                        },
                        required: false,
                    },
                    {
                        key: "account",
                        type: "select",
                        label: "Account",
                        placeholder: "Account",
                        value: account,
                        options: accountOptions,
                        onChange: (value) => {
                            setAccount(value);
                            setLocalOffset(0);
                        },
                    },
                ]}
                gridCols="3"
                onSearch={handleRefresh}
                onClear={handleClear}
                onDownloadPdf={handleDownloadPdf}
                onDownloadExcel={handleDownloadExcel}
                pdfDisabled={!hasAnyFilter || pdfLoading}
                excelDisabled={!hasAnyFilter || excelLoading}
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
                downloadDisabledMessage={
                    !hasAnyFilter
                        ? "Please select any filter first."
                        : "Please wait, export is processing."
                }
            />

            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={addLoader}
                emptyMessage="No receipt register data found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewVoucher(row);
                        }}
                        className="
                            inline-flex cursor-pointer items-center gap-1 rounded-lg
                            bg-indigo-50 px-3 py-1.5 text-xs font-bold
                            text-indigo-700 transition hover:bg-indigo-100
                        "
                    >
                        <Eye size={15} />
                    </button>
                )}
            />

            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={true}
                title="View Receipt"
                subtitle="View receipt details"
                loading={viewLoading}
                contentLoading={viewLoading}
                onClose={() => {
                    setViewModal(false);
                    setViewForm({});
                    setViewErrors({});
                }}
                onSubmit={() => {}}
                form={viewForm}
                errors={viewErrors}
                handleAddRow={() => {}}
                handleDeleteRow={() => {}}
                handleRowChange={() => {}}
                inputData={viewInputData}
                bodyKey="recBody"
                handleChange={() => {}}
                footerTotals={viewFooterTotals}
            />

            {currentPagination?.totalDocs > 0 && (
                <div className="mt-2">
                    <Pagination
                        localLimit={localLimit}
                        selectCb={(e: any) => {
                            setLocalLimit(Number(e.target.value));
                            setLocalOffset(0);
                        }}
                        preDisabled={!currentPagination?.hasPrevPage}
                        nextDisabled={!currentPagination?.hasNextPage}
                        setLocalOffset={setLocalOffset}
                        pagination={currentPagination}
                    />
                </div>
            )}
        </div>
    );
};

export default ReceiptRegister;