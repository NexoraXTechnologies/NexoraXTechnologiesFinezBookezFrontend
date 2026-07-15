import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import RegisterFilterCard from "./RegisterFilterCard";
import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { addPaymentRegister } from "../../../redux/slices/professionalSlice/bookEzRegister/paymentRegisterSlice";
import DataTable from "../../../components/DataTable";
import { Eye } from "lucide-react";
import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberPayment } from "../../../redux/slices/professionalSlice/purchaseWorkflow/paymentSlice";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";
import Pagination from "../../../components/pagination";

const mainColumns = [
    {
        key: "payVoucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.payVoucherNumber || row?.paymentVoucherNumber || "-"}
            </span>
        ),
    },
    {
        key: "payVoucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate =
                row?.payVoucherDate ||
                row?.paymentVoucherDate ||
                row?.voucherDate;

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
        key: "payAccountName",
        title: "Account",
        render: (row: any) => (
            <div>
                <div className="font-semibold text-card-foreground">
                    {row?.payAccountName || row?.accountName || "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                    {row?.payAccountCode || row?.accountCode || "-"}
                </div>
            </div>
        ),
    },
    {
        key: "adjustedAmount",
        title: "Adjusted Amount",
        render: (row: any) => (
            <span className="font-bold text-foreground">
                ₹{Number(row?.payFooter?.adjustedAmount || row?.adjustedAmount || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "balanceAmount",
        title: "Balance Amount",
        render: (row: any) => (
            <span className="font-bold text-foreground">
                ₹{Number(row?.payFooter?.balanceAmount || row?.balanceAmount || 0).toFixed(2)}
            </span>
        ),
    },
    // {
    //     key: "payStatus",
    //     title: "Status",
    //     render: (row: any) => {
    //         const status = row?.payStatus || row?.status || "-";
    //         return <span>{status}</span>;
    //     },
    // },
];

const getVoucherRecordFromResponse = (res: any, voucherNumber: string) => {
    if (res?.payment) return res.payment;
    if (res?.data?.payment) return res.data.payment;

    if (res?.record) return res.record;
    if (res?.data?.record) return res.data.record;

    if (
        res &&
        typeof res === "object" &&
        res?.payVoucherNumber === voucherNumber
    ) {
        return res;
    }

    if (
        res?.data &&
        typeof res.data === "object" &&
        res.data?.payVoucherNumber === voucherNumber
    ) {
        return res.data;
    }

    const records =
        Array.isArray(res)
            ? res
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.payments)
                    ? res.payments
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.data?.records)
                            ? res.data.records
                            : Array.isArray(res?.data?.payments)
                                ? res.data.payments
                                : [];

    return (
        records.find(
            (item: any) =>
                item?.payVoucherNumber === voucherNumber ||
                item?.voucherNumber === voucherNumber
        ) ||
        records[0] ||
        null
    );
};

const normalizePaymentForView = (record: any) => {
    const footer = record?.payFooter || {};

    const payBody = (record?.payBody || []).map((item: any) => ({
        ...item,

        accountCode: item?.accountCode || "",
        accountName: item?.accountName || "",
        amount: item?.amount || "0",
        netAmount: item?.netAmount || item?.amount || "0",

        references: item?.references || [],
        remarks: item?.remarks || "",
        customMasters: item?.customMasters || {},
    }));

    return {
        ...record,

        payVoucherNumber:
            record?.payVoucherNumber || record?.voucherNumber || "",

        payVoucherDate:
            record?.payVoucherDate || record?.voucherDate || "",

        payAccountCode:
            record?.payAccountCode || record?.accountCode || "",

        payAccountName:
            record?.payAccountName || record?.accountName || "",

        payStatus:
            record?.payStatus || record?.status || "open",

        payRemark:
            record?.payRemark || record?.remark || "",

        payBody,

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

const TransportOrderRegister = () => {
    const dispatch = useDispatch<any>();

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [account, setAccount] = useState<string>("");

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [refreshKey, setRefreshKey] = useState(0);

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const { accounts = [] } = useSelector((state: any) => state.accountMaster);
    const {
        paymentRegisterData = [],
        addLoader = false,
        pagination = {},
    } = useSelector((state: any) => state.paymentRegister);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewForm, setViewForm] = useState<any>({});
    const [viewErrors, setViewErrors] = useState<any>({});
    const [viewTemplateFields, setViewTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    const hasAnyFilter = useMemo(() => {
        return Boolean(fromDate || toDate || account);
    }, [fromDate, toDate, account]);

    const currentPagination = useMemo(() => {
        return pagination || {};
    }, [pagination]);

    const accountOptions = useMemo(() => {
        return (accounts || []).map((item: any) => ({
            label: item.accountName || "",
            value: item.accountCode || ""
        })).filter((item: any) => item.label && item.value);
    }, [accounts]);

    useEffect(() => {
        dispatch(getAllAccounts({
            offset: 0,
            limit: 500,
            search: ""
        }));
    }, [dispatch]);

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
                console.log("Failed to prepare payment view fields", error);
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
            "payRemark",
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

    useEffect(() => {
        dispatch(addPaymentRegister(getPayload()));
    }, [
        dispatch,
        fromDate,
        toDate,
        account,
        localOffset,
        localLimit,
        refreshKey,
    ]);

    const tableData = useMemo(() => {
        return Array.isArray(paymentRegisterData)
            ? paymentRegisterData
            : [];
    }, [paymentRegisterData]);

    const handleViewVoucher = async (row: any) => {
        const voucherNumber =
            row?.payVoucherNumber ||
            row?.paymentVoucherNumber ||
            row?.voucherNumber ||
            "";

        if (!voucherNumber) {
            console.log("Payment voucher number missing:", row);
            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});

            await dispatch(getAllTransactionSchema("payment") as any);

            const res = await dispatch(
                getByVoucherNumberPayment({
                    voucherNumber,
                }) as any
            ).unwrap();

            const record = getVoucherRecordFromResponse(res, voucherNumber);

            if (!record) {
                console.log("Payment not found:", voucherNumber, res);
                setViewForm({});
                return;
            }

            setViewForm(normalizePaymentForView(record));
        } catch (error) {
            console.log("Payment register view failed", error);
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
                addPaymentRegister(getPayload("pdf"))
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(res.blob, "payment-register.pdf");
            }
        } catch (error) {
            console.log("Payment register PDF download failed", error);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!hasAnyFilter || excelLoading) return;

        try {
            setExcelLoading(true);

            const res = await dispatch(
                addPaymentRegister(getPayload("excel"))
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(res.blob, "payment-register.xlsx");
            }
        } catch (error) {
            console.log("Payment", error);
        } finally {
            setExcelLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Payment Register Filters"
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
                emptyMessage="No payment register data found"
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
                            bg-primary/10 px-3 py-1.5 text-xs font-bold
                            text-primary transition hover:bg-primary/20
                        "
                    >
                        <Eye size={15} />
                    </button>
                )}
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

            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={true}
                title="View Payment"
                subtitle="View payment details"
                loading={viewLoading}
                contentLoading={viewLoading}
                onClose={() => {
                    setViewModal(false);
                    setViewForm({});
                    setViewErrors({});
                }}
                onSubmit={() => { }}
                form={viewForm}
                errors={viewErrors}
                handleAddRow={() => { }}
                handleDeleteRow={() => { }}
                handleRowChange={() => { }}
                inputData={viewInputData}
                bodyKey="payBody"
                handleChange={() => { }}
                footerTotals={viewFooterTotals}
            />
        </div>
    );
};

export default TransportOrderRegister;