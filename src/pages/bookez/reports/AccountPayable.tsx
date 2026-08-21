import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import ReportsOverviewCards from "./components/ReportsOverviewCards";

import { getAccountPayable } from "../../../redux/slices/professionalSlice/ledgerReports/accountsPayableSlice";
import { ExternalLink, Eye, IndianRupee, Users } from "lucide-react";
import Modal from "../../../components/modal";
import { toast } from "react-toastify";
import { getByVoucherNumberPurchaseInvoiceList, GetVendorWisePurchaseInvoiceList } from "../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";
import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";

const mainColumns = [
    {
        key: "pInvVendorName",
        title: "Vendor Name",
    },
    {
        key: "pInvVendorCode",
        title: "Vendor Code",
    },
    {
        key: "totalBalanceAmount",
        title: "Total Amount",
        render: (row: any) => (
            <>₹{Number(row?.totalBalanceAmount || 0).toFixed(2)}</>
        ),
    },
];

const balanceColumns = [
    {
        key: "pInvVoucherNumber",
        title: "Voucher Number",
    },
    {
        key: "pInvVoucherDate",
        title: "Voucher Date",
        render: (row: any) =>
            row?.pInvVoucherDate
                ? new Date(row.pInvVoucherDate).toLocaleDateString("en-IN")
                : "-",
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) => (
            <>
                ₹
                {Number(

                    row?.netAmount || 0
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
                    row?.balanceAmount || 0
                ).toFixed(2)}
            </span>
        ),
    },
]

const AccountPayable = () => {
    const dispatch = useDispatch<any>();

    const {
        accountPayable = [],
        listingLoader,
        pagination,
        summary = {},
        count,
    } = useSelector((s: any) => s.accountPayable);

    const [search, setSearch] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<any>(null);
    const [vendorBalanceList, setVendorBalanceList] = useState<any[]>([]);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [viewForm, setViewForm] = useState<any>({})
    const [viewModal, setViewModal] = useState(false)
    const [viewLoading, setViewLoading] = useState(false)
    const [viewTitle, setViewTitle] = useState("")
    const [viewBodyKey, setViewBodyKey] = useState("")
    const [viewErrors, setViewErrors] = useState<any>({})
    const [viewTemplateFields, setViewTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );


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

    useEffect(() => {
        dispatch(
            (getAccountPayable as any)({
                offset: localOffset,
                limit: localLimit,
                search,
            })
        );
    }, [dispatch, localOffset, localLimit, search]);


    const preparePurchaseInvoiceView = (invoice: any) => {
        const footer = invoice?.pInvFooter || {};

        const products = (invoice?.pInvBody || []).map((item: any) => ({
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

        setViewTitle("View Purchase Invoice");
        setViewBodyKey("products");

        setViewForm({
            ...invoice,

            pInvVoucherNumber:
                invoice?.pInvVoucherNumber || invoice?.voucherNumber || "",
            pInvVoucherDate:
                invoice?.pInvVoucherDate || invoice?.voucherDate || "",
            pInvCustomerName:
                invoice?.pInvCustomerName || invoice?.customerName || "",
            pInvCustomerCode:
                invoice?.pInvCustomerCode || invoice?.customerCode || "",
            pInvRemark:
                invoice?.pInvRemark || invoice?.pInvRemarks || invoice?.remark || "",
            pInvStatus:
                invoice?.pInvStatus || invoice?.pInvDocStatus || "open",

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

    const handleExport = async (exportType: "pdf" | "excel") => {
        try {
            if (exportType === "pdf") {
                setPdfLoading(true);
            } else {
                setExcelLoading(true);
            }

            await dispatch(
                (getAccountPayable as any)({
                    offset: localOffset,
                    limit: localLimit,
                    search,
                    exportType,
                })
            );
        } finally {
            setPdfLoading(false);
            setExcelLoading(false);
        }
    };

    const handleOpenInvoiceView = async (record: any) => {

        const voucherNumer = record?.pInvVoucherNumber;
        if (!voucherNumer) {
            toast.error("Invoice voucher number not found");
            return;
        }

        setShowBalanceModal(false);

        setViewModal(true);
        setViewLoading(true);
        setViewErrors({});
        setViewForm({});
        setViewTitle("View Purchase Invoice");
        setViewBodyKey("products");

        try {
            await dispatch(getAllTransactionSchema("purchaseInvoice"));

            const res = await (dispatch(getByVoucherNumberPurchaseInvoiceList({
                voucherNumber: voucherNumer
            })).unwrap()
            )

            const invoiceData = res?.invoice || res
            if (!invoiceData) {
                toast.error("invoice details not found");
                setViewForm({})
                return;
            }

            preparePurchaseInvoiceView(invoiceData)

        } catch (error: any) {
            toast.error(
                error?.message ||
                error?.payload?.message ||
                "Failed to load invoice details"
            );
            setViewModal(false);
        } finally {
            setViewLoading(false);
        }


    }


    const handleViewVendorBalance = async (vendor: any) => {
        const vendorCode = vendor?.pInvVendorCode;
        if (!vendorCode) {
            toast.error("Vendor code not found");
            return;
        }
        setSelectedVendor(vendor);
        setShowBalanceModal(true);
        try {
            const res = await dispatch(GetVendorWisePurchaseInvoiceList({
                vendorCode,
            })).unwrap();

            const records = res?.data || [];

            setVendorBalanceList(records);
        } catch (error) {
            toast.error("Failed to fetch vendor balance list");
        } finally {
            setBalanceLoading(false);
        }
    }

    return (
        <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
            <ReportsOverviewCards
                cards={[
                    {
                        title: "Total Payable Amount",
                        value: `₹${Number(summary?.totalPayableAmount || 0).toFixed(2)}`,
                        icon: <IndianRupee size={16} />,
                    },
                    {
                        title: "Total Vendors",
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
                onDownloadExcel={() => handleExport("excel")}
                pdfLoading={pdfLoading}
                excelLoading={excelLoading}
            />

            <DataTable
                columns={mainColumns}
                data={accountPayable}
                loading={listingLoader}
                emptyMessage="No data found"
                showFieldSelector={false}
                actions={(record: any) => (
                    <button
                        type="button"
                        onClick={() => handleViewVendorBalance(record)}
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
                title={`Balance List - ${selectedVendor?.pInvVendorName || "-"}`}
                state={false}
                handleSubmit={() => setShowBalanceModal(false)}
                handleClose={() => {
                    setShowBalanceModal(false);
                    setSelectedVendor(null);
                    setVendorBalanceList([]);
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
                                        Vendor Code
                                    </p>

                                    <h3 className="text-base font-bold text-card-foreground">
                                        {selectedVendor?.pInvVendorCode || "-"}
                                    </h3>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-semibold text-muted-foreground">
                                        Total Balance
                                    </p>

                                    <h3 className="text-base font-bold text-primary">
                                        ₹
                                        {Number(
                                            selectedVendor?.totalBalanceAmount || 0
                                        ).toFixed(2)}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-5">
                            <DataTable
                                columns={balanceColumns}
                                data={vendorBalanceList}
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

export default AccountPayable;