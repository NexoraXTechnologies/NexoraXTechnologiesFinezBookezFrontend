import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ExternalLink, Eye, IndianRupee, Users } from "lucide-react";
import { toast } from "react-toastify";

import DataTable from "../../../components/DataTable";
import Modal from "../../../components/modal";
import Pagination from "../../../components/pagination";
import ReportsOverviewCards from "./components/ReportsOverviewCards";

import { getAccountReceivable } from "../../../redux/slices/professionalSlice/ledgerReports/accountsReceivableSlice";
import { getByCustomerCodeSalesInvoice, getByVoucherNumberSalesInvoice } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";
import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";

const mainColumns = [
    {
        key: "sInvCustomerName",
        title: "Customer Name",
    },
    {
        key: "customerNumber",
        title: "Mobile No.",
    },
    {
        key: "sInvCustomerCode",
        title: "Customer Code",
    },
    {
        key: "totalBalanceAmount",
        title: "Total Amount",
        render: (row: any) => (
            <>₹{Number(row?.totalBalanceAmount || 0).toFixed(2)}</>
        ),
    },
    {
        key: "salesInvoiceReturns",
        title: "Return Invoices",
        render: (row: any) => {
            const returns = Array.isArray(row?.salesInvoiceReturns)
                ? row.salesInvoiceReturns
                : [];

            if (!returns.length) {
                return <span className="text-muted-foreground">N/A</span>;
            }

            return (
                <div className="flex flex-col gap-1">
                    {returns.map((item: any, index: number) => (
                        <div
                            key={`${item?.sInvReturnVoucherNumber || index}`}
                            className="flex flex-col rounded-md text-xs"
                        >
                            <span className="font-semibold text-danger">
                                {item?.sInvReturnVoucherNumber || "-"}
                            </span>

                            <span className="font-medium text-card-foreground">
                                ₹{Number(item?.returnAmount || 0).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        },
    }
];

const balanceColumns = [
    {
        key: "sInvVoucherNumber",
        title: "Invoice No",
        render: (row: any) => row?.sInvVoucherNumber || row?.voucherNumber || "-",
    },
    {
        key: "sInvVoucherDate",
        title: "Date",
        render: (row: any) =>
            row?.sInvVoucherDate
                ? new Date(row.sInvVoucherDate).toLocaleDateString("en-IN")
                : "-",
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) => (
            <>
                ₹
                {Number(
                    row?.sInvFooter?.netAmount ||
                    row?.netAmount ||
                    row?.billAmount ||
                    0
                ).toFixed(2)}
            </>
        ),
    },

    {
        key: "balanceAmount",
        title: "Balance",
        render: (row: any) => (
            <span className="font-semibold text-primary">
                ₹
                {Number(
                    row?.sInvFooter?.balanceAmount ||
                    row?.balanceAmount ||
                    row?.remainingBillAmount ||
                    row?.totalBalanceAmount ||
                    0
                ).toFixed(2)}
            </span>
        ),
    },
];

const AccountsReceivable = () => {
    const dispatch = useDispatch<any>();

    const {
        accountReceivable = [],
        listingLoader,
        pagination,
        summary = {},
        count,
    } = useSelector((s: any) => s.accountReceivable);


    const [search, setSearch] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    const [customerBalanceList, setCustomerBalanceList] = useState<any[]>([]);
    const [balanceLoading, setBalanceLoading] = useState(false);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );
    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewForm, setViewForm] = useState<any>({});
    const [viewTitle, setViewTitle] = useState("Sales Invoice");
    const [viewErrors, setViewErrors] = useState<any>({});
    const [viewTemplateFields, setViewTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });
    const [viewBodyKey, setViewBodyKey] = useState("products");


    const viewFooterTotals = useMemo(() => {
        return {
            grossAmount: viewForm?.grossAmount || "0.00",
            discountAmount: viewForm?.discountAmount || "0.00",
            cgstAmount: viewForm?.cgstAmount || "0.00",
            sgstAmount: viewForm?.sgstAmount || "0.00",
            igstAmount: viewForm?.igstAmount || "0.00",
            netAmount: viewForm?.netAmount || "0.00",
            adjustedAmount: viewForm?.adjustedAmount || "0.00",
            balanceAmount: viewForm?.balanceAmount || "0.00",
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
        return {
            ...viewTemplateFields,
            footer: viewFooterArray,
        };
    }, [viewTemplateFields, viewFooterArray]);

    useEffect(() => {
        dispatch(
            getAccountReceivable({
                offset: localOffset,
                limit: localLimit,
                search,
            } as any)
        );
    }, [dispatch, localOffset, localLimit, search]);


    useEffect(() => {
        const prepareViewFields = async () => {
            if (!transactionsSchema) return;

            const hasSchema =
                Array.isArray(transactionsSchema?.header) ||
                Array.isArray(transactionsSchema?.body) ||
                Array.isArray(transactionsSchema?.footer);

            if (!hasSchema) return;

            try {
                const updatedData = await loadAllTemplateOptions(transactionsSchema);
                setViewTemplateFields(updatedData);
            } catch (error) {
                console.log("Failed to prepare view template fields", error);
            }
        };

        prepareViewFields();
    }, [transactionsSchema]);

    const prepareSalesInvoiceView = (invoice: any) => {
        const footer = invoice?.sInvFooter || {};

        const products = (invoice?.sInvBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription: item?.productDescription || item?.description || "",
            description: item?.description || item?.productDescription || "",
            productHSNCode: item?.productHSNCode || "",

            quantity: item?.quantity || "",
            uom: item?.uom || item?.unit || "",
            unit: item?.unit || item?.uom || "",

            rate: item?.rate || "",
            gross: item?.gross || item?.grossAmount || "",
            grossAmount: item?.grossAmount || item?.gross || "",

            discount: item?.discount || item?.discountPercentage || "",
            discountAmount: item?.discountAmount || "",

            cgst: item?.cgst || item?.cgstPercentage || "",
            cgstAmount: item?.cgstAmount || "",

            sgst: item?.sgst || item?.sgstPercentage || "",
            sgstAmount: item?.sgstAmount || "",

            igst: item?.igst || item?.igstPercentage || "",
            igstAmount: item?.igstAmount || "",

            netAmount: item?.netAmount || item?.netTotal || "",
            netTotal: item?.netTotal || item?.netAmount || "",
        }));

        setViewTitle("View Sales Invoice");
        setViewBodyKey("products");

        setViewForm({
            ...invoice,

            sInvVoucherNumber:
                invoice?.sInvVoucherNumber || invoice?.voucherNumber || "",
            sInvVoucherDate:
                invoice?.sInvVoucherDate || invoice?.voucherDate || "",
            sInvCustomerName:
                invoice?.sInvCustomerName || invoice?.customerName || "",
            sInvCustomerCode:
                invoice?.sInvCustomerCode || invoice?.customerCode || "",
            sInvRemark:
                invoice?.sInvRemark || invoice?.sInvRemarks || invoice?.remark || "",
            sInvStatus:
                invoice?.sInvStatus || invoice?.sInvDocStatus || "open",

            products,

            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount:
                footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount:
                footer?.balanceAmount ||
                footer?.netAmount ||
                footer?.totalNetAmount ||
                "0.00",
        });
    };

    const handleExport = async (exportType: "pdf" | "xlsx") => {
        try {
            if (exportType === "pdf") {
                setPdfLoading(true);
            } else {
                setExcelLoading(true);
            }

            await dispatch(
                getAccountReceivable({
                    offset: 0,
                    limit: 120000,
                    search,
                    exportType,
                } as any)
            );
        } finally {
            setPdfLoading(false);
            setExcelLoading(false);
        }
    };


    const handleOpenInvoiceView = async (record: any) => {
        const voucherNumber = record?.sInvVoucherNumber;

        if (!voucherNumber) {
            toast.error("Invoice voucher number not found");
            return;
        }

        setShowBalanceModal(false);
        setViewModal(true);
        setViewLoading(true);
        setViewErrors({});
        setViewForm({});
        setViewTitle("View Sales Invoice");
        setViewBodyKey("products");

        try {
            await dispatch(getAllTransactionSchema("salesInvoice") as any);

            const res = await dispatch(
                getByVoucherNumberSalesInvoice({
                    voucherNumber,
                }) as any
            ).unwrap();

            const invoice =
                res?.invoice ||
                res?.data?.invoice ||
                res?.data ||
                res;

            if (!invoice) {
                toast.error("Invoice details not found");
                setViewForm({});
                return;
            }

            prepareSalesInvoiceView(invoice);
        } catch (error: any) {
            console.log("View invoice failed", error);
            toast.error(
                error?.message ||
                error?.payload?.message ||
                "Failed to load invoice details"
            );
            setViewModal(false);
        } finally {
            setViewLoading(false);
        }
    };
    const handleViewCustomerBalance = async (customer: any) => {
        const customerCode = customer?.sInvCustomerCode;

        if (!customerCode) {
            toast.error("Customer code not found");
            return;
        }

        setSelectedCustomer(customer);
        setShowBalanceModal(true);
        setCustomerBalanceList([]);
        setBalanceLoading(true);

        try {
            const res = await dispatch(
                getByCustomerCodeSalesInvoice({
                    customerCode,
                }) as any
            ).unwrap();

            const records = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.records)
                    ? res.records
                    : Array.isArray(res)
                        ? res
                        : [];

            setCustomerBalanceList(records);
        } catch (error: any) {
            toast.error(
                error?.message ||
                error?.payload?.message ||
                "Failed to load customer balance list"
            );
        } finally {
            setBalanceLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
            <ReportsOverviewCards
                cards={[
                    {
                        title: "Total Receivable Amount",
                        value: `₹${Number(
                            summary?.totalReceivableAmount || 0
                        ).toFixed(2)}`,
                        icon: <IndianRupee size={16} />,
                    },
                    {
                        title: "Total Customers",
                        value: Number(count || 0),
                        icon: <Users size={16} />,
                    },
                ]}
                search={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setLocalOffset(0);
                }}
                onDownloadPdf={() => handleExport("pdf")}
                onDownloadExcel={() => handleExport("xlsx")}
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
            />

            <DataTable
                columns={mainColumns}
                data={accountReceivable}
                loading={listingLoader}
                emptyMessage="No data found"
                showFieldSelector={false}
                actions={(record: any) => (
                    <button
                        type="button"
                        onClick={() => handleViewCustomerBalance(record)}
                        className="rounded-md p-2 text-primary transition hover:bg-primary/10"
                        title="View balance list"
                    >
                        <Eye size={16} />
                    </button>
                )}
            />

            {pagination?.totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    }}
                    preDisabled={!pagination.hasPrevPage}
                    nextDisabled={!pagination.hasNextPage}
                    setLocalOffset={setLocalOffset}
                    pagination={pagination}
                />
            )}



            <Modal
                show={showBalanceModal}
                setShow={setShowBalanceModal}
                title={`Balance List - ${selectedCustomer?.sInvCustomerName || "-"}`}
                state={false}
                handleSubmit={() => setShowBalanceModal(false)}
                handleClose={() => {
                    setShowBalanceModal(false);
                    setSelectedCustomer(null);
                    setCustomerBalanceList([]);
                }}
                loader={balanceLoading}
                gridCols={1}
                maxWidth="5xl"
                modalClassName="rounded-xl"
                headerClassName="bg-card"
                footerClassName="bg-card"
                bodyClassName="!block !overflow-x-hidden !p-0 bg-card text-card-foreground"
                hideFooter
                body={
                    <div className="flex flex-col bg-card text-card-foreground">
                        <div className="border-b border-border px-5 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        Customer Code
                                    </p>

                                    <h3 className="text-base font-bold text-card-foreground">
                                        {selectedCustomer?.sInvCustomerCode || "-"}
                                    </h3>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        Total Balance
                                    </p>

                                    <h3 className="text-base font-bold text-primary">
                                        ₹
                                        {Number(
                                            selectedCustomer?.totalBalanceAmount || 0
                                        ).toFixed(2)}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-5">
                            <DataTable
                                columns={balanceColumns}
                                data={customerBalanceList}
                                loading={balanceLoading}
                                emptyMessage="No balance records found"
                                showFieldSelector={false}
                                actions={(record: any) => (
                                    <button
                                        type="button"
                                        onClick={() => handleOpenInvoiceView(record)}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                                        title="View invoice"
                                    >
                                        <ExternalLink size={14} />
                                        View
                                    </button>
                                )}
                            />
                        </div>
                    </div>
                }
            />
            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={true}
                title={viewTitle}
                subtitle="View voucher details"
                loading={viewLoading}
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
                bodyKey={viewBodyKey}
                handleChange={() => { }}
                footerTotals={viewFooterTotals}
                contentLoading={viewLoading}
            />
        </div>
    );
};

export default AccountsReceivable;