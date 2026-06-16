import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import DataTable from "../../../components/DataTable";
import ReportFilterCard from "./ReportFilterCard";
import AccountSummaryCard from "./AccountSummaryCard";
import DynamicAddForm from "../../../components/voucher/dynamicAddForm";

import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";
import {
    createStockLedger,
    clearStockLedgerData,
} from "../../../redux/slices/professionalSlice/ledgerReports/stockLedgerSlice";

import { getAllTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";
import { getAllSalesInvoice } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import { getAllSalesInvoiceReturn } from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceReturn";
import { loadAllTemplateOptions } from "../../../utils/helperFunctions";

type StockLedgerProps = {
    show?: boolean;
};

const mainColumns = [
    {
        key: "voucherNumber",
        title: "Voucher Number",
        render: (row: any) => (
            <span className="font-medium text-slate-800">
                {row?.voucherNumber || row?.voucherNo || "-"}
            </span>
        ),
    },
    {
        key: "voucherDate",
        title: "Voucher Date",
        render: (row: any) => {
            const rawDate =
                row?.voucherDate ||
                row?.date ||
                row?.createdOn;

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
        key: "party",
        title: "Party",
        render: (row: any) => (
            <span className="font-medium text-slate-800">
                {row?.party || row?.party || "-"}
            </span>
        ),
    },
    {
        key: "inwardQty",
        title: "Inward Qty",
        render: (row: any) => (
            <span className="font-semibold text-emerald-700">
                {Number(
                    row?.inwardQty || 0
                ).toFixed(2)}
            </span>
        ),
    },
    {
        key: "outwardQty",
        title: "Outward Qty",
        render: (row: any) => (
            <span className="font-semibold text-red-700">
                {Number(
                    row?.outwardQty || 0
                ).toFixed(2)}
            </span>
        ),
    },
    // {
    //     key: "balanceQty",
    //     title: "Balance Qty",
    //     render: (row: any) => (
    //         <span className="font-semibold text-slate-900">
    //             {Number(
    //                 row?.balanceQty || 0
    //             ).toFixed(2)}
    //         </span>
    //     ),
    // },

    {
        key: "status",
        title: "Status",
        render: (row: any) => {
            const inwardQty = Number(
                row?.inwardQty ||
                row?.inQty ||
                row?.purchaseQty ||
                row?.receivedQty ||
                0
            );

            const outwardQty = Number(
                row?.outwardQty ||
                row?.outQty ||
                row?.salesQty ||
                row?.issuedQty ||
                0
            );

            if (inwardQty > 0) {
                return (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Inward
                    </span>
                );
            }

            if (outwardQty > 0) {
                return (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                        Outward
                    </span>
                );
            }

            return (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    -
                </span>
            );
        },
    },
];

const todayYMD = () => {
    return new Date().toISOString().split("T")[0];
};

const getLedgerDetails = (data: any) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.details)) return data.details;
    if (Array.isArray(data?.transactions)) return data.transactions;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const StockLedger = ({ show = true }: StockLedgerProps) => {
    const dispatch = useDispatch<any>();


    const {
        stockLedgerData = null,
        listingLoader = false,
        exportLoader = false,
    } = useSelector((s: any) => s.stockLedger);

    const {
        products = [],
        loading: productLoading = false,
    } = useSelector((s: any) => s.productMaster);

    const [fromDate, setFromDate] = useState(todayYMD());
    const [toDate, setToDate] = useState(todayYMD());
    const [productCode, setProductCode] = useState("");
    const [viewModal, setViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewTitle, setViewTitle] = useState("");
    const [viewForm, setViewForm] = useState<any>({});
    const [viewErrors, setViewErrors] = useState<any>({});

    const { transactionsSchema } = useSelector(
        (state: any) => state.getAllTransactionSchema
    );

    const [viewTemplateFields, setViewTemplateFields] = useState<any>({
        header: [],
        body: [],
        footer: [],
    });
    const [viewBodyKey, setViewBodyKey] = useState("products");



    const getRecords = (res: any) => {
        if (Array.isArray(res)) return res;

        if (Array.isArray(res?.items)) return res.items;
        if (Array.isArray(res?.records)) return res.records;
        if (Array.isArray(res?.docs)) return res.docs;
        if (Array.isArray(res?.data)) return res.data;

        if (Array.isArray(res?.data?.items)) return res.data.items;
        if (Array.isArray(res?.data?.records)) return res.data.records;
        if (Array.isArray(res?.data?.docs)) return res.data.docs;

        return [];
    };

    const normalizeInvoiceForView = (record: any) => {
        const footer = record?.sInvFooter || {};

        const products = (record?.sInvBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription:
                item?.productDescription || item?.description || "",
            description:
                item?.description || item?.productDescription || "",
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

        return {
            ...record,

            // ✅ Header fields
            sInvVoucherNumber: record?.sInvVoucherNumber || record?.voucherNumber || "",
            sInvVoucherDate: record?.sInvVoucherDate || record?.voucherDate || "",
            sInvCustomerName: record?.sInvCustomerName || record?.customerName || "",
            sInvCustomerCode: record?.sInvCustomerCode || record?.customerCode || "",
            sInvRemark: record?.sInvRemark || record?.sInvRemarks || "",
            sInvStatus: record?.sInvStatus || record?.sInvDocStatus || "open",
            sInvSalesAccount: record?.sInvSalesAccount || "",

            // ✅ Body key used by DynamicAddForm
            products,

            // ✅ Footer fields based on schema keys
            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount: footer?.balanceAmount || footer?.netAmount || footer?.totalNetAmount || "0.00",
        };
    };
    const normalizeSalesReturnForView = (record: any) => {
        const footer = record?.sInvReturnFooter || {};

        const products = (record?.sInvReturnBody || []).map((item: any) => ({
            ...item,

            productCode: item?.productCode || "",
            productName: item?.productName || "",
            productDescription:
                item?.productDescription || item?.description || "",
            description:
                item?.description || item?.productDescription || "",
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

        return {
            ...record,

            // ✅ Header fields
            sInvReturnVoucherNumber:
                record?.sInvReturnVoucherNumber || record?.voucherNumber || "",
            sInvReturnVoucherDate:
                record?.sInvReturnVoucherDate || record?.voucherDate || "",
            sInvVoucherNumber: record?.sInvVoucherNumber || "",
            sInvReturnCustomerName:
                record?.sInvReturnCustomerName || record?.customerName || "",
            sInvReturnCustomerCode:
                record?.sInvReturnCustomerCode || record?.sInvCustomerCode || "",
            sInvReturnRemark:
                record?.sInvReturnRemark || record?.sInvRemark || record?.remark || "",
            sInvReturnStatus:
                record?.sInvReturnStatus || record?.sInvStatus || "open",

            // ✅ Body key used by DynamicAddForm
            products,

            // ✅ Footer fields based on schema keys
            grossAmount: footer?.grossAmount || footer?.totalGrossAmount || "0.00",
            discountAmount: footer?.discountAmount || footer?.totalDiscountAmount || "0.00",
            cgstAmount: footer?.cgstAmount || footer?.totalCgstAmount || "0.00",
            sgstAmount: footer?.sgstAmount || footer?.totalSgstAmount || "0.00",
            igstAmount: footer?.igstAmount || footer?.totalIgstAmount || "0.00",
            netAmount: footer?.netAmount || footer?.totalNetAmount || "0.00",
            adjustedAmount: footer?.adjustedAmount || "0.00",
            balanceAmount: footer?.balanceAmount || footer?.netAmount || footer?.totalNetAmount || "0.00",
        };
    };


    const handleViewVoucher = async (row: any) => {
        const voucherNumber =
            row?.voucherNumber ||
            row?.voucherNo ||
            row?.sInvVoucherNumber ||
            row?.sInvReturnVoucherNumber;

        const moduleName = String(
            row?.module ||
            row?.moduleName ||
            row?.voucherType ||
            row?.type ||
            ""
        ).toLowerCase();

        const inwardQty = Number(row?.inwardQty || 0);
        const outwardQty = Number(row?.outwardQty || 0);

        if (!voucherNumber) {
            console.log("Voucher number missing in row:", row);
            return;
        }

        /*
            ✅ Important:
            - Sales Invoice = Outward
            - Sales Return = Inward
            So if module is missing, fallback works from quantity.
        */
        const isSalesReturn =
            moduleName.includes("salesreturn") ||
            moduleName.includes("sales return") ||
            moduleName.includes("sales invoice return") ||
            moduleName.includes("salesinvoicereturn") ||
            moduleName.includes("invoice return") ||
            inwardQty > 0;

        const isSalesInvoice =
            moduleName.includes("salesinvoice") ||
            moduleName.includes("sales invoice") ||
            outwardQty > 0;

        try {
            // ✅ Open modal immediately on click
            setViewModal(true);
            setViewLoading(true);
            setViewErrors({});
            setViewForm({});

            // ✅ Sales Return should check first
            if (isSalesReturn) {
                setViewTitle("View Sales Return");
                setViewBodyKey("products");

                await dispatch(getAllTransactionSchema("salesReturn") as any);

                const res = await dispatch(
                    getAllSalesInvoiceReturn({
                        offset: 0,
                        limit: 10,
                        voucherNumber: voucherNumber,
                        // status: "",
                    }) as any
                ).unwrap();

                const records = getRecords(res);

                const record =
                    records.find(
                        (item: any) =>
                            item?.sInvReturnVoucherNumber === voucherNumber ||
                            item?.voucherNumber === voucherNumber ||
                            item?.voucherNo === voucherNumber
                    ) || records[0];

                if (!record) {
                    console.log("Sales return not found:", voucherNumber, res);
                    setViewForm({});
                    return;
                }

                setViewForm(normalizeSalesReturnForView(record));
                return;
            }

            if (isSalesInvoice) {
                setViewTitle("View Sales Invoice");
                setViewBodyKey("products");

                await dispatch(getAllTransactionSchema("salesInvoice") as any);

                const res = await dispatch(
                    getAllSalesInvoice({
                        offset: 0,
                        limit: 10,
<<<<<<< HEAD
                        sInvVoucherNumber: voucherNumber,
                        // @ts-ignore 
                        status: "",
=======
                        search: voucherNumber,
>>>>>>> 382321ceb41510664b35b24a3923a0b67dd09f33
                    }) as any
                ).unwrap();

                const records = getRecords(res);

                const record =
                    records.find(
                        (item: any) =>
                            item?.sInvVoucherNumber === voucherNumber ||
                            item?.voucherNumber === voucherNumber ||
                            item?.voucherNo === voucherNumber
                    ) || records[0];

                if (!record) {
                    console.log("Sales invoice not found:", voucherNumber, res);
                    setViewForm({});
                    return;
                }

                setViewForm(normalizeInvoiceForView(record));
                return;
            }

            console.log("Unsupported voucher row:", row);
        } catch (error) {
            console.log("View voucher failed", error);
            setViewForm({});
        } finally {
            setViewLoading(false);
        }
    };
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

    const productOptions = useMemo(() => {
        return (products || [])
            .map((item: any) => ({
                label:
                    item?.productName ||
                    item?.productDescription ||
                    item?.name ||
                    "",
                value:
                    item?.productCode ||
                    item?._id ||
                    "",
            }))
            .filter((item: any) => item.label && item.value);
    }, [products]);

    const resetStockLedger = () => {
        setFromDate(todayYMD());
        setToDate(todayYMD());
        setProductCode("");
        dispatch(clearStockLedgerData());
    };

    useEffect(() => {
        dispatch(
            getAllProducts({
                offset: 0,
                limit: 100,
                search: "",
            }) as any
        );
    }, [dispatch]);

    /*
        ✅ If modal is only hidden and not unmounted,
        this will clear data when show becomes false.
    */
    useEffect(() => {
        if (!show) {
            resetStockLedger();
        }
    }, [show]);

    /*
        ✅ If modal unmounts component on close,
        this will clear redux data on unmount.
    */
    useEffect(() => {
        return () => {
            dispatch(clearStockLedgerData());
        };
    }, [dispatch]);

    useEffect(() => {
        if (!productCode) return;

        dispatch(
            createStockLedger({
                productCode,
                fromDate,
                toDate,
            }) as any
        );
    }, [dispatch, productCode, fromDate, toDate]);

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
        if (!productCode) return;

        try {
            const res = await dispatch(
                createStockLedger({
                    productCode,
                    fromDate,
                    toDate,
                    exportType: "pdf",
                }) as any
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    `stock-ledger-${productCode}.pdf`
                );
            }
        } catch (error) {
            console.log("Stock ledger PDF download failed", error);
        }
    };

    const handleDownloadExcel = async () => {
        if (!productCode) return;

        try {
            const res = await dispatch(
                createStockLedger({
                    productCode,
                    fromDate,
                    toDate,
                    exportType: "excel",
                }) as any
            ).unwrap();

            if (res?.blob) {
                downloadBlobFile(
                    res.blob,
                    `stock-ledger-${productCode}.xlsx`
                );
            }
        } catch (error) {
            console.log("Stock ledger Excel download failed", error);
        }
    };

    const selectedProductName =
        productOptions.find((item: any) => item.value === productCode)?.label ||
        "-";

    const tableData = getLedgerDetails(stockLedgerData);

    const summaryItems = [
        {
            label: "Product Code",
            value: stockLedgerData?.productCode || productCode || "-",
        },
        {
            label: "Product Type",
            value: stockLedgerData?.productType || "-",
        },
        {
            label: "UOM",
            value: stockLedgerData?.uom || "-",
        },
    ];

    const closingStock = Number(
        stockLedgerData?.balanceQuantity ||
        stockLedgerData?.closingStock ||
        stockLedgerData?.closingQty ||
        0
    ).toFixed(2);


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
                const rawValue = viewFooterTotals?.[field.key as keyof typeof viewFooterTotals] ?? "0.00";

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

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-slate-50 p-4">
            <div
                className="
                    grid w-full grid-cols-1 gap-4 xl:grid-cols-2
                    [&>*]:rounded-xl
                    [&>*]:!p-4
                    [&_*]:!text-sm
                    [&_h3]:!text-base
                    [&_h2]:!text-base
                    [&_p]:!text-sm
                    [&_label]:!text-xs
                    [&_button]:!h-10
                    [&_button]:!text-sm
                    [&_input]:!h-10
                    [&_input]:!text-sm
                    [&_select]:!h-10
                    [&_select]:!text-sm
                    [&_.text-xl]:!text-lg
                    [&_.text-lg]:!text-base
                    [&_.text-sm]:!text-xs
                "
            >
                <ReportFilterCard
                    title="Stock Ledger Filters"
                    fields={[
                        {
                            key: "fromDate",
                            type: "date",
                            label: "From Date",
                            value: fromDate,
                            onChange: (value) => {
                                setFromDate(value);
                            },
                            required: true,
                        },
                        {
                            key: "toDate",
                            type: "date",
                            label: "To Date",
                            value: toDate,
                            onChange: (value) => {
                                setToDate(value);
                            },
                            required: true,
                        },
                        {
                            key: "productCode",
                            type: "select",
                            label: "Product",
                            placeholder: productLoading
                                ? "Loading products..."
                                : "Select Product",
                            value: productCode,
                            options: productOptions,
                            disabled: productLoading,
                            onChange: (value) => {
                                setProductCode(value);
                            },
                            required: true,
                            colSpan: "full",
                        },
                    ]}
                    gridCols="2"
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadExcel={handleDownloadExcel}
                    downloadDisabled={!productCode || exportLoader}
                    downloadDisabledMessage="Please select product to download stock ledger."
                />

                <AccountSummaryCard
                    title="Product"
                    accountName={selectedProductName}
                    summaryItems={summaryItems}
                    finalLabel="Available Quantity"
                    finalValue={closingStock}
                />
            </div>

           
            <DataTable
                columns={mainColumns}
                data={tableData}
                loading={listingLoader}
                emptyMessage={
                    productCode
                        ? "No stock ledger data found"
                        : "Please select product"
                }
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewVoucher(row);
                        }}
                        className="
                inline-flex items-center gap-1 rounded-lg
                bg-indigo-50 px-3 py-1.5 text-xs font-bold
                text-indigo-700 transition hover:bg-indigo-100
                cursor-pointer
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

export default StockLedger;