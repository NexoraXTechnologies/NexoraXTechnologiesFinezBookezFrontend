import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye } from "lucide-react";
import { toast } from "react-toastify";

import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { addContraVoucherRegister } from "../../../redux/slices/professionalSlice/bookEzRegister/contraVoucherRegisterSlice";
import { getContraVoucherByVoucherNumber } from "../../../redux/slices/professionalSlice/openingBalancesStocks/contraVoucherSlice";

import {
    toDateInputValue,
    toLocalEndOfDayUtc,
    toLocalStartOfDayUtc,
} from "../../../utils/helperFunctions";

const statusOptions = [
    { label: "Open", value: "open" },
    { label: "Close", value: "close" },
];

const mainColumns = [
    {
        key: "voucherNumber",
        title: "Voucher",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.voucherNumber || row?.voucherno || "-"}
            </span>
        ),
    },
    {
        key: "voucherDate",
        title: "Date",
        type: "date",
        render: (row: any) => {
            const rawDate = row?.voucherDate || row?.createdOn;
            return (
                <span className="font-medium text-card-foreground">
                    {rawDate ? new Date(rawDate).toLocaleDateString("en-IN") : "-"}
                </span>
            );
        },
    },
  
    {
        key: "totalDebit",
        title: "Total Debit",
        type: "amount",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                ₹{Number(row?.totalDebit || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "totalCredit",
        title: "Total Credit",
        type: "amount",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                ₹{Number(row?.totalCredit || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "status",
        title: "Status",
        render: (row: any) => {
            const value = String(row?.status || "-");
            const isOpen = value.toLowerCase() === "open";

            return (
                <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        isOpen
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                    }`}
                >
                    {value}
                </span>
            );
        },
    },
];

const getVoucherRecordFromResponse = (res: any, voucherNumber: string) => {
    if (res?.voucherNumber === voucherNumber) return res;
    if (res?.data?.voucherNumber === voucherNumber) return res.data;
    if (res?.contraVoucher) return res.contraVoucher;
    if (res?.data?.contraVoucher) return res.data.contraVoucher;
    if (res?.record) return res.record;
    if (res?.data?.record) return res.data.record;

    const records =
        Array.isArray(res)
            ? res
            : Array.isArray(res?.contraVouchers)
                ? res.contraVouchers
                : Array.isArray(res?.records)
                    ? res.records
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.data?.contraVouchers)
                            ? res.data.contraVouchers
                            : Array.isArray(res?.data?.records)
                                ? res.data.records
                                : [];

    return (
        records.find(
            (item: any) =>
                String(item?.voucherNumber || item?.voucherno || "") ===
                String(voucherNumber)
        ) ||
        records[0] ||
        null
    );
};

const normalizeContraVoucherForView = (record: any) => {
    const entries = (Array.isArray(record?.entries) ? record.entries : []).map(
        (row: any) => ({
            ...row,
            id: row?.id || `${Date.now()}-${Math.random()}`,
            accountCode: row?.accountCode || row?.account || "",
            account: row?.accountCode || row?.account || "",
            accountName: row?.accountName || "",
            debit: row?.debit ?? "",
            credit: row?.credit ?? "",
            narration: row?.narration || "",
        })
    );

    return {
        ...record,
        voucherNumber:
            record?.voucherNumber ||
            record?.contraVoucherNumber ||
            record?.voucherno ||
            "AUTO",
        voucherno:
            record?.voucherno ||
            record?.voucherNumber ||
            record?.contraVoucherNumber ||
            "AUTO",
        voucherDate: record?.voucherDate
            ? String(record.voucherDate).split("T")[0]
            : "",
        voucherType: record?.voucherType || "contra",
        referenceNumber: record?.referenceNumber || "",
        remark: record?.remark || record?.remarks || "",
        remarks: record?.remarks || record?.remark || "",
        status: record?.status || "open",
        entries,
        totalDebit: record?.totalDebit ?? "0.00",
        totalCredit: record?.totalCredit ?? "0.00",
    };
};

const ContraVoucherRegister = () => {
    const dispatch = useDispatch<any>();

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [dateError, setDateError] = useState<string>("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [refreshKey, setRefreshKey] = useState(0);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewForm, setViewForm] = useState<any>({});
    const [viewErrors, setViewErrors] = useState<any>({});

    const { accounts = [] } = useSelector(
        (state: any) => state.accountMaster || {}
    );

    const contraVoucherRegisterState = useSelector(
        (state: any) => state.contraVoucherRegister || {}
    );

    const {
        addLoader = false,
        pagination = {},
    } = contraVoucherRegisterState;

    const accountOptions = useMemo(() => {
        return (accounts || [])
            .map((item: any) => ({
                label: item?.accountName || "",
                value: item?.accountCode || "",
            }))
            .filter((item: any) => item.label && item.value);
    }, [accounts]);

    const tableData = useMemo(() => {
        const data =
            contraVoucherRegisterState?.contraVoucherRegisterData ||
            contraVoucherRegisterState?.contraVouchers ||
            contraVoucherRegisterState?.records ||
            contraVoucherRegisterState?.data ||
            [];

        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.contraVouchers)) return data.contraVouchers;
        if (Array.isArray(data?.records)) return data.records;

        return [];
    }, [contraVoucherRegisterState]);

    const currentPagination = useMemo(() => {
        return (
            pagination ||
            contraVoucherRegisterState?.data?.pagination ||
            {}
        );
    }, [pagination, contraVoucherRegisterState]);

    const hasRegisterData = tableData.length > 0;

    const validateDates = (): boolean => {
        if (!fromDate && !toDate) {
            setDateError("");
            return true;
        }

        if (!fromDate || !toDate) {
            setDateError("Please select both From Date and To Date.");
            return false;
        }

        if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
            setDateError("From Date cannot be greater than To Date.");
            return false;
        }

        setDateError("");
        return true;
    };

    const getPayload:any = (
        exportType: "pdf" | "excel" | "" = ""
    ) => {
        const isExport = Boolean(exportType);

        return {
            fromDate: fromDate || "",
            toDate: toDate || "",
            offset: isExport ? 0 : localOffset,
            limit: isExport ? 120000 : localLimit,
            exportType: exportType || "",
        };
    };

    useEffect(() => {
        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 500,
                search: "",
                accountType: "bank , cash",
            }) as any
        );
    }, [dispatch]);

    useEffect(() => {
        if ((fromDate && !toDate) || (!fromDate && toDate)) return;

        if (
            fromDate &&
            toDate &&
            new Date(fromDate).getTime() > new Date(toDate).getTime()
        ) {
            return;
        }

        dispatch(
            addContraVoucherRegister(
                getPayload()
            ) as any
        );
    }, [
        dispatch,
        fromDate,
        toDate,
        localOffset,
        localLimit,
        refreshKey,
    ]);

    const viewInputData = useMemo(() => {
        return {
            header: [
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
                    key: "status",
                    label: "Status",
                    type: "select",
                    disabled: true,
                    options: statusOptions,
                },
                {
                    key: "referenceNumber",
                    label: "Reference Number",
                    type: "text",
                    disabled: true,
                },
                {
                    key: "remark",
                    label: "Remark",
                    type: "textarea",
                    disabled: true,
                    colSpan: "full",
                },
            ],
            body: [
                {
                    key: "accountCode",
                    label: "Account",
                    title: "Account",
                    type: "select",
                    width: "260px",
                    disabled: true,
                    options: accountOptions,
                },
                {
                    key: "debit",
                    label: "Debit",
                    title: "Debit",
                    type: "number",
                    width: "150px",
                    align: "right",
                    disabled: true,
                },
                {
                    key: "credit",
                    label: "Credit",
                    title: "Credit",
                    type: "number",
                    width: "150px",
                    align: "right",
                    disabled: true,
                },
            ],
            footer: [
                {
                    key: "totalDebit",
                    label: "Total Debit",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value: Number(viewForm?.totalDebit || 0).toFixed(2),
                    rawValue: viewForm?.totalDebit || "0.00",
                },
                {
                    key: "totalCredit",
                    label: "Total Credit",
                    type: "number",
                    disabled: true,
                    align: "right",
                    value: Number(viewForm?.totalCredit || 0).toFixed(2),
                    rawValue: viewForm?.totalCredit || "0.00",
                },
            ],
        };
    }, [accountOptions, viewForm]);

    const viewFooterTotals = useMemo(
        () => ({
            totalDebit: viewForm?.totalDebit || "0.00",
            totalCredit: viewForm?.totalCredit || "0.00",
        }),
        [viewForm]
    );

    const handleRefresh = () => {
        if (!validateDates()) return;
        setLocalOffset(0);
        setRefreshKey((prev) => prev + 1);
    };

    const handleClear = () => {
        setDateError("");
        setFromDate("");
        setToDate("");
        setLocalOffset(0);
        setRefreshKey((prev) => prev + 1);
    };

    const handleViewVoucher = async (row: any) => {
        const voucherNumber =
            row?.voucherNumber ||
            row?.contraVoucherNumber ||
            row?.voucherno ||
            "";

        if (!voucherNumber) {
            toast.error("Contra voucher number not found");
            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});

            const res = await dispatch(
                getContraVoucherByVoucherNumber({
                    voucherNumber,
                }) as any
            ).unwrap();

            const record = getVoucherRecordFromResponse(
                res,
                voucherNumber
            );

            if (!record) {
                toast.error("Contra voucher not found");
                setViewForm({});
                return;
            }

            setViewForm(
                normalizeContraVoucherForView(
                    record
                )
            );
        } catch (error: any) {
            console.log("Contra voucher register view failed", error);

            toast.error(
                error?.response?.data?.message ||
                error?.payload?.message ||
                error?.message ||
                "Failed to load contra voucher"
            );

            setViewForm({});
        } finally {
            setViewLoading(false);
        }
    };

    const downloadBlobFile = (
        blob: Blob,
        fileName: string
    ) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    };

    const downloadRegister = async (
        type: "pdf" | "excel"
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
            if (type === "pdf") {
                setPdfLoading(true);
            } else {
                setExcelLoading(true);
            }

            const res = await dispatch(
                addContraVoucherRegister(
                    getPayload(type)
                ) as any
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    type === "pdf"
                        ? "contra-voucher-register.pdf"
                        : "contra-voucher-register.xlsx"
                );
            }
        } catch (error: any) {
            console.log(
                `Contra voucher register ${type.toUpperCase()} download failed`,
                error
            );

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.payload?.message ||
                error?.message ||
                `Failed to download ${type.toUpperCase()}`
            );
        } finally {
            setPdfLoading(false);
            setExcelLoading(false);
        }
    };

    const handleDownloadPdf = () =>
        downloadRegister("pdf");

    const handleDownloadExcel = () =>
        downloadRegister("excel");

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Contra Voucher Register Filters"
                fields={[
                    {
                        key: "fromDate",
                        type: "date",
                        label: "From Date",
                        value: fromDate ? toDateInputValue(fromDate) : "",
                        onChange: (value) => {
                            setFromDate(
                                value
                                    ? toLocalStartOfDayUtc(value)
                                    : ""
                            );
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                    {
                        key: "toDate",
                        type: "date",
                        label: "To Date",
                        value: toDate ? toDateInputValue(toDate) : "",
                        onChange: (value) => {
                            setToDate(
                                value
                                    ? toLocalEndOfDayUtc(value)
                                    : ""
                            );
                            setLocalOffset(0);
                            setDateError("");
                        },
                        required: false,
                    },
                ]}
                gridCols="2"
                onSearch={handleRefresh}
                onClear={handleClear}
                onDownloadPdf={handleDownloadPdf}
                onDownloadExcel={handleDownloadExcel}
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
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
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
                columns={mainColumns}
                data={tableData}
                loading={addLoader}
                emptyMessage="No contra voucher register data found"
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewVoucher(row);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                        title="View Contra Voucher"
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
                title="View Contra Voucher"
                subtitle="Contra voucher details"
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
                bodyKey="entries"
                handleChange={() => {}}
                footerTotals={viewFooterTotals}
            />

            {currentPagination?.totalDocs > 0 && (
                <div className="mt-2">
                    <Pagination
                        localLimit={localLimit}
                        selectCb={(e: any) => {
                            setLocalLimit(
                                Number(
                                    e.target.value
                                )
                            );
                            setLocalOffset(0);
                        }}
                        preDisabled={
                            !currentPagination?.hasPrevPage
                        }
                        nextDisabled={
                            !currentPagination?.hasNextPage
                        }
                        setLocalOffset={setLocalOffset}
                        pagination={currentPagination}
                    />
                </div>
            )}
        </div>
    );
};

export default ContraVoucherRegister;