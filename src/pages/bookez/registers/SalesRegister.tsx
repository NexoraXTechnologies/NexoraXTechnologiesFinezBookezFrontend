import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import RegisterFilterCard from "./RegisterFilterCard";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";
import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";
import { addSalesRegister } from "../../../redux/slices/professionalSlice/bookEzRegister/salesRegisterSlice";
import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getByVoucherNumberSalesInvoice } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";

/* ===================================================
   TABLE COLUMNS
=================================================== */

const mainColumns = [
    {
        key: "sInvVoucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.sInvVoucherNumber || "-"}
            </span>
        ),
    },
    {
        key: "sInvVoucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate = row?.sInvVoucherDate;

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
        key: "sInvCustomerName",
        title: "Customer",
        render: (row: any) => (
            <div className="flex flex-col">
                <span className="font-semibold text-card-foreground">
                    {row?.sInvCustomerName || "-"}
                </span>
                <span className="text-xs text-muted-foreground">
                    {row?.sInvCustomerCode || "-"}
                </span>
            </div>
        ),
    },
    {
        key: "sOrderNumber",
        title: "Order",
        render: (row: any) => (
            <span className="font-medium text-card-foreground">
                {row?.sInvBody?.[0]?.sOrderNumber || "-"}
            </span>
        ),
    },
    {
        key: "netAmount",
        title: "Net Amount",
        render: (row: any) => (
            <span className="font-bold text-foreground">
                ₹{Number(row?.sInvFooter?.netAmount || 0).toFixed(2)}
            </span>
        ),
    },
    {
        key: "sInvStatus",
        title: "Status",
        render: (row: any) => {
            const status = row?.sInvStatus || "-";
            const isOpen = String(status).toLowerCase() === "open";

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

const getVoucherRecordFromResponse = (res: any, voucherNumber: string) => {
    if (res?.invoice) return res.invoice;
    if (res?.data?.invoice) return res.data.invoice;

    if (res?.salesInvoice) return res.salesInvoice;
    if (res?.data?.salesInvoice) return res.data.salesInvoice;

    if (
        res &&
        typeof res === "object" &&
        res?.sInvVoucherNumber === voucherNumber
    ) {
        return res;
    }

    if (
        res?.data &&
        typeof res.data === "object" &&
        res.data?.sInvVoucherNumber === voucherNumber
    ) {
        return res.data;
    }

    const records =
        Array.isArray(res)
            ? res
            : Array.isArray(res?.records)
                ? res.records
                : Array.isArray(res?.invoices)
                    ? res.invoices
                    : Array.isArray(res?.data)
                        ? res.data
                        : Array.isArray(res?.data?.records)
                            ? res.data.records
                            : Array.isArray(res?.data?.invoices)
                                ? res.data.invoices
                                : [];

    return (
        records.find(
            (item: any) => item?.sInvVoucherNumber === voucherNumber
        ) ||
        records[0] ||
        null
    );
};

const normalizeInvoiceForView = (record: any) => {
    const footer = record?.sInvFooter || {};

    const products = (record?.sInvBody || []).map((item: any) => ({
        ...item,

        productCode: item?.productCode || "",
        productName: item?.productName || "",
        productId: item?.productId || "",

        productDescription:
            item?.productDescription || item?.description || "",
        description:
            item?.description || item?.productDescription || "",
        productHSNCode: item?.productHSNCode || "",

        quantity: item?.quantity || "",
        uom: item?.uom || item?.unit || "",
        unit: item?.unit || item?.uom || "",
        unitName: item?.unitName || "",

        rate: item?.rate || "",

        gross: item?.gross || item?.grossAmount || "",
        grossAmount: item?.grossAmount || item?.gross || "",

        discount: item?.discount || item?.discountPercentage || "",
        discountPercentage:
            item?.discountPercentage || item?.discount || "",
        discountAmount: item?.discountAmount || "0.00",

        taxableAmount: item?.taxableAmount || "0.00",

        cgst: item?.cgst || item?.cgstPercentage || "",
        cgstPercentage: item?.cgstPercentage || item?.cgst || "",
        cgstAmount: item?.cgstAmount || "0.00",

        sgst: item?.sgst || item?.sgstPercentage || "",
        sgstPercentage: item?.sgstPercentage || item?.sgst || "",
        sgstAmount: item?.sgstAmount || "0.00",

        igst: item?.igst || item?.igstPercentage || "",
        igstPercentage: item?.igstPercentage || item?.igst || "",
        igstAmount: item?.igstAmount || "0.00",

        taxAmount: item?.taxAmount || "0.00",
        otherAmount: item?.otherAmount || "0.00",

        netAmount: item?.netAmount || item?.netTotal || "",
        netTotal: item?.netTotal || item?.netAmount || "",
    }));

    return {
        ...record,

        sInvVoucherNumber:
            record?.sInvVoucherNumber || record?.voucherNumber || "",

        sInvVoucherDate:
            record?.sInvVoucherDate || record?.voucherDate || "",

        sInvCustomerCode:
            record?.sInvCustomerCode || record?.customerCode || "",

        sInvCustomerName:
            record?.sInvCustomerName || record?.customerName || "",

        sInvStatus:
            record?.sInvStatus || record?.sInvDocStatus || "open",

        sInvRemark:
            record?.sInvRemark || record?.remark || "",

        products,
        sInvBody: products,

        grossAmount:
            footer?.grossAmount || footer?.totalGrossAmount || "0.00",

        discountAmount:
            footer?.discountAmount || footer?.totalDiscountAmount || "0.00",

        cgstAmount:
            footer?.cgstAmount || footer?.totalCgstAmount || "0.00",

        sgstAmount:
            footer?.sgstAmount || footer?.totalSgstAmount || "0.00",

        igstAmount:
            footer?.igstAmount || footer?.totalIgstAmount || "0.00",

        taxAmount:
            footer?.taxAmount || footer?.totalTaxAmount || "0.00",

        otherAmount:
            footer?.otherAmount || footer?.totalOtherAmount || "0.00",

        netAmount:
            footer?.netAmount || footer?.totalNetAmount || "0.00",

        adjustedAmount:
            footer?.adjustedAmount || "0.00",

        balanceAmount:
            footer?.balanceAmount ||
            footer?.netAmount ||
            footer?.totalNetAmount ||
            "0.00",

        totalQuantity:
            footer?.totalQuantity || "0",
    };
};

/* ===================================================
   COMPONENT
=================================================== */

const SalesRegister = () => {
    const dispatch = useDispatch<any>();

    /* ===================================================
       FILTER STATES

       Default values are blank.
       So initial API call will show all records.
    =================================================== */

    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [customer, setCustomer] = useState<string>("");
    const [product, setProduct] = useState<string>("");

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

    const { products = [] } = useSelector(
        (state: any) => state.productMaster
    );

    const {
        salesRegisterData = [],
        addLoader = false,
        pagination = {},
    } = useSelector((state: any) => state.salesRegister);

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    /* ===================================================
       FILTER ACTIVE CHECK
    =================================================== */

    const hasAnyFilter = useMemo(() => {
        return Boolean(fromDate || toDate || customer || product);
    }, [fromDate, toDate, customer, product]);

    /* ===================================================
       OPTIONS
    =================================================== */

    const customerOptions = useMemo(() => {
        return (accounts || [])
            .map((item: any) => ({
                label: item?.accountName || "",
                value: item?.accountCode || "",
            }))
            .filter((item: any) => item.label && item.value);
    }, [accounts]);

    const productOptions = useMemo(() => {
        return (products || [])
            .map((item: any) => ({
                label: item?.productName || "",
                value: item?.productCode || "",
            }))
            .filter((item: any) => item.label && item.value);
    }, [products]);

    /* ===================================================
       TABLE DATA
    =================================================== */

    const tableData = useMemo(() => {
        return Array.isArray(salesRegisterData) ? salesRegisterData : [];
    }, [salesRegisterData]);

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
            customerCode: customer,
            productCode: product,
            exportType,
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
                accountType: "customer",
            })
        );
    }, [dispatch]);

    useEffect(() => {
        dispatch(
            getAllProducts({
                limit: 200,
                offset: 0,
                search: "",
            })
        );
    }, [dispatch]);

    /* ===================================================
       LOAD SALES REGISTER DATA

       This API will call:
       1. On first page load - all list
       2. On filter change - filtered list
       3. On pagination change
       4. On manual refresh button click
    =================================================== */

    useEffect(() => {
        dispatch(addSalesRegister(getPayload()));
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
                console.log("Failed to prepare sales invoice view fields", error);
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
        return {
            ...viewTemplateFields,
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
        setCustomer("");
        setProduct("");
        setLocalOffset(0);
        setRefreshKey((prev) => prev + 1);
    };

    const handleViewVoucher = async (row: any) => {
        const voucherNumber =
            row?.sInvVoucherNumber || row?.voucherNumber || "";

        if (!voucherNumber) {
            console.log("Sales invoice voucher number missing:", row);
            return;
        }

        try {
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});

            await dispatch(getAllTransactionSchema("salesInvoice") as any);

            const res = await dispatch(
                getByVoucherNumberSalesInvoice({
                    voucherNumber,
                }) as any
            ).unwrap();

            const record = getVoucherRecordFromResponse(res, voucherNumber);

            if (!record) {
                console.log("Sales invoice not found:", voucherNumber, res);
                setViewForm({});
                return;
            }

            setViewForm(normalizeInvoiceForView(record));
        } catch (error) {
            console.log("Sales register view invoice failed", error);
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
                addSalesRegister(getPayload("pdf"))
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(res.blob, "sales-register.pdf");
            }
        } catch (error) {
            console.log("Sales register PDF download failed", error);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!hasAnyFilter || excelLoading) return;

        try {
            setExcelLoading(true);

            const res = await dispatch(
                addSalesRegister(getPayload("excel"))
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(res.blob, "sales-register.xlsx");
            }
        } catch (error) {
            console.log("Sales register Excel download failed", error);
        } finally {
            setExcelLoading(false);
        }
    };

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <RegisterFilterCard
                title="Sales Register Filters"
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
                        key: "customer",
                        type: "select",
                        label: "Customer",
                        placeholder: "Customer",
                        value: customer,
                        options: customerOptions,
                        onChange: (value) => {
                            setCustomer(value);
                            setLocalOffset(0);
                        },
                    },
                    {
                        key: "product",
                        type: "select",
                        label: "Product",
                        placeholder: "Product",
                        value: product,
                        options: productOptions,
                        onChange: (value) => {
                            setProduct(value);
                            setLocalOffset(0);
                        },
                    },
                ]}
                gridCols="4"
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
                emptyMessage="No sales register data found"
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

            <DynamicAddForm
                isView={true}
                show={viewModal}
                setShow={setViewModal}
                edit={true}
                title="View Sales Invoice"
                subtitle="View sales invoice details"
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
                bodyKey="products"
                handleChange={() => { }}
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

export default SalesRegister;