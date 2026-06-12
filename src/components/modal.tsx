import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PrimaryButton, SecondaryButton } from "./buttons";
import { X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { reportGeneratePdf } from "../redux/slices/professionalSlice/reportMappingSlice";
import { getCompany } from "../redux/slices/professionalSlice/professionalCompanyMaster.slice";
import { getAccountByCode } from "../redux/slices/professionalSlice/accountMasterSlice";
import { gstStateCodes } from "../utils/constant";
import { formatDateForInput } from "../utils/helperFunctions";

type ModalProps = {
    show: boolean;
    setShow?: (value: boolean) => void;
    handleSubmit?: () => void;
    handleClose?: () => void;
    state?: boolean;
    body?: React.ReactNode;
    title?: string | any;
    loader?: boolean;

    // Optional dynamic props
    gridCols?: 1 | 2 | 3 | 4 | 12;
    maxWidth?:
        | "sm"
        | "md"
        | "lg"
        | "xl"
        | "2xl"
        | "3xl"
        | "4xl"
        | "5xl"
        | "6xl"
        | "7xl"
        | "full";

    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;

    // New optional props, safe for existing usage
    modalClassName?: string;
    overlayClassName?: string;
    hideFooter?: boolean;
};

const gridColsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    12: "grid-cols-1",
};

const maxWidthClass: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",

    // Only used when you pass maxWidth="full"
    full: "w-[98vw] max-w-[98vw]",
};

const Modal = ({
    show,
    setShow,
    handleSubmit,
    state,
    body,
    handleClose = () => null,
    title,
    loader = false,

    // Default old values, so other components stay same
    gridCols = 2,
    maxWidth = "3xl",
    bodyClassName = "",
    headerClassName = "",
    footerClassName = "",

    // New optional values
    modalClassName = "",
    overlayClassName = "",
    hideFooter = false,
}: ModalProps) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm ${overlayClassName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                        }}
                        className={`
                            relative flex w-full max-h-[90vh] flex-col overflow-hidden
                            rounded-md border border-gray-100 bg-white shadow-2xl
                            ${maxWidthClass[maxWidth] || maxWidthClass["3xl"]}
                            ${modalClassName}
                        `}
                    >
                        {/* Header */}
                        <div
                            className={`flex shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-6 py-3 ${headerClassName}`}
                        >
                            <div>
                                <h2 className="mb-0 text-xl font-semibold text-gray-800">
                                    {state ? `Edit ${title}` : `${title}`}
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Fill in the {title.toLowerCase()} details below
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    handleClose();
                                    // @ts-ignore 
                                    setShow(false);
                                }}
                                className="cursor-pointer rounded-full p-2 transition hover:bg-gray-200"
                            >
                                <X size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Body */}
                        <div
                            className={`
                                grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden
                                p-6 text-sm
                                ${gridColsClass[gridCols] || gridColsClass[2]}
                                ${bodyClassName}
                            `}
                        >
                            {body}
                        </div>

                        {/* Footer */}
                        {!hideFooter && (
                            <div
                                className={`flex shrink-0 justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4 ${footerClassName}`}
                            >
                                <SecondaryButton
                                    callBackFn={() => {
                                        handleClose();
                                        // @ts-ignore 
                                        setShow(false);
                                    }}
                                    text="Cancel"
                                />

                                <PrimaryButton
                                    disabled={loader}
                                    callBackFn={handleSubmit}
                                    text={
                                        loader
                                            ? "Loading.."
                                            : state
                                            ? "Update"
                                            : "Save"
                                    }
                                />
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;

// warning modal

type NoDataConfirmAlertProps = {
    show: boolean;
    title?: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
    onCancel?: () => void;
    onConfirm?: () => void;
};

const WarningModel = ({
    show,
    title = "No Data Found",
    message = "Please create at least one record to proceed.",
    cancelText = "Cancel",
    confirmText = "Yes",
    onCancel,
    onConfirm,
}: NoDataConfirmAlertProps) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-md bg-white p-6 text-center shadow-2xl">
                <h2 className="text-2xl font-bold text-slate-900">
                    {title}
                </h2>

                <p className="mt-4 text-base leading-7 text-slate-600">
                    {message}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ListingModel = ({
    show,
    title = "No Data Found",
    cancelText = "Confirm",
    report,
    rowData,
    confirmText = "Yes",
    onCancel = () => null,
    onConfirm = () => null,
}: any) => {
    const [data, setData] = useState();
    const [gstType, setGstType] = useState("With GST");
    const isReportDownload = report?.length
    const dispatch = useDispatch()
    const { company } = useSelector((s: any) => s.professionalCompanyMaster);
    const { selectedAccount } = useSelector((e: any) => e?.accountMaster)
    console.log({ selectedAccount, company })

    const downloadPdfWithoutLibrary = async () => {
        try {
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.right = "0";
            iframe.style.bottom = "0";
            iframe.style.width = "0";
            iframe.style.height = "0";
            iframe.style.border = "0";
            document.body.appendChild(iframe);
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

            if (!iframeDoc) {
                console.log("Unable to create PDF iframe");
                return;
            }
            iframeDoc.open();
            iframeDoc.write(html({ ...company, CustomerCode: rowData?.CustomerCode, selectedAccount })); // ✅ your full HTML string
            iframeDoc.close();
            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();

                    // cleanup after print dialog opens
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                }, 500);
            };
        } catch (error) {
            console.log("PDF print failed:", error);
        }
    };

    const handleConfirm = async () => {
        if (isReportDownload) {
            try {
                // @ts-ignore 
                const blobData = await dispatch(reportGeneratePdf({
                    moduleType: rowData?.moduleType,
                    templateFileId: data?.templateFileId,
                    CustomerCode: rowData?.CustomerCode,
                    voucherNumber: rowData?.voucherNumber,
                })
                ).unwrap();

                const blob = new Blob([blobData], {
                    type: "application/pdf",
                });

                const url = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = `${rowData?.voucherNumber || "report"}.pdf`;

                document.body.appendChild(link);
                link.click();

                link.remove();
                window.URL.revokeObjectURL(url);
            } catch (error: any) {
                console.log("PDF download failed:", error);
            }
        } else {
            downloadPdfWithoutLibrary()
        }
    };
    console.log({ rowData })
    useEffect(() => {
        dispatch(getCompany(""));
        dispatch(getAccountByCode(rowData?.CustomerCode));
    }, [rowData?.CustomerCode]);

    if (!show) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm `}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                        }}
                        className={`
                            relative flex w-full max-h-[90vh] flex-col overflow-hidden
                            rounded-md border border-gray-100 bg-white shadow-2xl
                            ${maxWidthClass["lg"]}
                        `}
                    >
                        <div
                            className={`flex shrink-0 items-center justify-between border-b border-gray-300 bg-gray-50 px-6 py-3 `}
                        >
                            <div>
                                <h2 className="mb-0 text-xl font-semibold text-gray-800">
                                    {title}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    // handleClose();
                                    // @ts-ignore 
                                    setShow(false);
                                }}
                                className="cursor-pointer rounded-full p-2 transition hover:bg-gray-200"
                            >
                                <X size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Body */}
                        <div
                            className={`
                                grid min-h-0 min-w-0 flex-1 gap-4 overflow-y-auto overflow-x-hidden
                                p-6 text-sm
                            `}
                        >
                            {isReportDownload ? <ul className="space-y-3">
                                {report?.map((e: any, index: number) => (
                                    <li
                                        key={index}
                                        onClick={() => setData(e)}
                                        className={`p-4 rounded-lg shadow-sm cursor-pointer transition-all duration-200 ${e?.id === data?.id ? "border-2 border-blue-500 bg-blue-50 text-blue-700 shadow-md" : "bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md"} `}
                                    >
                                        {e?.templateName}
                                    </li>
                                ))}
                            </ul> :
                                <>
                                    <div className="flex gap-3">
                                        {["With GST", "Without GST"].map((option) => (
                                            <div
                                                key={option}
                                                onClick={() => setGstType(option)}
                                                className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${gstType === option
                                                    ? "bg-blue-500 text-white border-blue-500"
                                                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"}`}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            }
                        </div>
                        <div
                            className={`flex shrink-0 justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4`}
                        >

                            <PrimaryButton
                                // disabled={loader}
                                callBackFn={handleConfirm}
                                text={"Confirm"}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
export { WarningModel, ListingModel };

const html = ({ companyName, companyAddress, companyMobile, companyEmail, gstNumber, CustomerCode, selectedAccount }) => {
    //entryType
    // return

    const escapeHtml = (s: any) =>
        String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    const titleCase = (s: any) =>
        String(s ?? '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())


    const billToName = selectedAccount?.accountName;
    const billToAddress = selectedAccount?.accountAddress;
    const billToGstin = selectedAccount.gstNumber || '';
    const billToState =
        selectedAccount?.gstNumber?.length >= 2
            ? gstStateCodes[selectedAccount.gstNumber.substring(0, 2)] || 'Unknown State'
            : '';
    const billGstBlock =
        gstNumber
            ? `<p><strong>GSTIN Number:</strong> ${escapeHtml(billToGstin)}</p>
                 <p><strong>State:</strong> ${escapeHtml(billToState)}</p>`
            : '';

    const companyGstBlock =
        gstNumber
            ? `<p><strong>GSTIN:</strong> ${escapeHtml(gstNumber)}</p>`
            : '';



    const PRIMARY = ""
    const companyLogo = ""


    // dont khown
    const gstHeaderTh = true ? `<th class="colGst">GST</th>` : '';
    const invNo = ""
    const invDate = ""
    const entryType = "sales Quotation"
    return (`
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page {
          margin-top: 40px;
          margin-bottom: 40px;
          margin-left: 30px;
          margin-right: 30px;
        }
        * { box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #111; font-size: 12px; }
        .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .company h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
        .company p { margin: 0; line-height: 1.6; }
        .logo { width: 90px; height: 90px; object-fit: contain; }
        .divider { height: 2px; background: ${PRIMARY}; margin: 14px 0 14px; opacity: 0.9; }
        .title { text-align: center; font-size: 22px; font-weight: 700; color: ${PRIMARY}; margin: 0 0 8px; }
        .sectionRow { display: flex; justify-content: space-between; margin-top: 10px; }
        .bill, .details { width: 48%; }
        .sectionTitle {  font-weight: 700; margin-bottom: 10px; }
        .bill p { margin: 0 0 8px; }
        .details .sectionTitle { text-align: right; }
        .details .kv { text-align: right; margin: 0 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; border: 0.5px solid #bbb; font-size: 12px; }
        thead th {
          background: ${PRIMARY};
          color: #fff;
          padding: 9px 6px;
          text-align: center;
          border: 0.5px solid #aad;
        }
        tbody td {
          padding: 9px 6px;
          vertical-align: top;
          text-align: center;
          border: 0.5px solid #ccc;
        }
        .colNum  { width: 28px; }
        .colItem { width: 200px; text-align: left; }
        .colQty  { width: 90px; }
        .colPrice{ width: 100px; }
        .colGst  { width: 140px; }
        .colAmt  { width: 120px; }
        .gstSmall { display: block; margin-top: 3px; color: #555; font-size: 9px; }
        .money { white-space: nowrap; }
        .itemMeta { display: block; margin-top: 3px; font-size: 10px; color: #666; }
        .dimCell { color: #999; }
        .tableTotal td {
          border-top: 1px solid #999;
          border-bottom: 1px solid #999;
          font-weight: 700;
          padding-top: 10px;
          padding-bottom: 10px;
        }
        .belowRow { display:flex; justify-content:space-between; gap: 18px; margin-top: 18px; }
        .belowLeft { flex: 1; }
        .belowRight { width: 460px; }
        .blkTitle { font-weight: 700; margin: 0 0 10px; }
        .blkText { line-height: 1.6; margin: 0; }
        .sumTable { width:100%; border-collapse:collapse;  }
        .sumTable td { padding: 8px 10px; }
        .sumLabel { width: 55%; }
        .sumAmt { width: 45%; text-align:right; white-space:nowrap; }
        .sumTotalRow td { background:${PRIMARY}; color:#fff; font-weight:700; }
        .payRow { display:flex; justify-content:space-between; align-items:flex-start; gap: 18px; margin-top: 18px; }
        .payLeft { flex: 1; display:flex; gap: 16px; align-items:flex-start; }
        /* ✅ bigger QR -> scannable after PDF render */
        .qr { width: 160px; height: 160px; object-fit: contain; border: 1px solid #ddd; padding: 6px; }
        .payInfo {  line-height: 1.7; }
        .payInfo b { font-weight: 700; }
        .signRight { width: 360px; text-align:right; }
        .signRight .for {  margin-bottom: 10px; }
        .signImg { height: 70px; object-fit: contain; margin: 10px 0; }
        .signText { font-weight: 700; margin-top: 6px; }
        .upiLink {
          display:inline-block;
          margin-top: 8px;
          font-weight: 700;
          color: #0b63ff;
          text-decoration: none;
        }
        .upiMeta { color: #555; margin-top: 4px; }
        .siteNote { text-align:left; margin-top: 10px;  color: #0b63ff; }
      </style>
    </head>
    <body>
      <div class="row">
        <div class="company" style="max-width: 50%;">
          <h1>${escapeHtml(companyName || 'Company Name')}</h1>
          <p><strong>Address:</strong> ${escapeHtml(companyAddress)}</p>
          <p><strong>Phone no:</strong> ${escapeHtml(companyMobile)}</p>
          <p><strong>Email:</strong> ${escapeHtml(companyEmail)}</p>
          ${companyGstBlock}
        </div>
        ${companyLogo
            ? `<img class="logo" src="${companyLogo}" />`
            : `<div style="width:90px;height:90px;"></div>`
        }
      </div>
      <div class="divider"></div>
      <div class="title">${escapeHtml(
            titleCase(entryType || 'Tax Invoice'),
        )}</div>
      <div class="sectionRow">
        <div class="bill">
          <div class="sectionTitle">Bill To</div>
          <p><strong>Name:</strong> ${escapeHtml(billToName)}</p>
          <p><strong>Address:</strong> ${escapeHtml(billToAddress)}</p>
          ${billGstBlock}
        </div>
        <div class="details">
          <div class="sectionTitle">Invoice Details</div>
          <p class="kv"><strong>Invoice No.:</strong> ${escapeHtml(invNo)}</p>
          <p class="kv"><strong>Date:</strong> ${escapeHtml(
            formatDateForInput(invDate),
        )}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th class="colNum">#</th>
            <th class="colItem">Item Name</th>
            ${entryType === 'GRN'
            ? `<th class="colQty">Accepted Qty</th><th class="colQty">Rejected Qty</th>`
            : `<th class="colQty">Quantity</th>`
        }
            <th class="colPrice">Rate</th>
            <th class="colPrice">Discount % </th>
            ${gstHeaderTh}
            <th class="colAmt">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((it, idx) => {
                return `
                <tr>
                  <td class="colNum">${idx + 1}</td>
                  <td class="colItem">
                    ${escapeHtml(it.productName || '—')}
                    ${it.productHSNCode
                        ? `<span class="itemMeta">HSN: ${escapeHtml(
                            it.productHSNCode,
                        )}</span>`
                        : ''
                    }
                  </td>
                  ${entryType === 'GRN'
                        ? `<td class="colQty">${escapeHtml(
                            String(it.acceptedQuantity ?? ''),
                        )}${it.uomLabel && it.uomLabel !== '-'
                            ? `<span class="itemMeta">${escapeHtml(
                                it.uomLabel,
                            )}</span>`
                            : ''
                        }</td>
                         <td class="colQty">${escapeHtml(
                            String(it.rejectedQuantity ?? ''),
                        )}${it.uomLabel && it.uomLabel !== '-'
                            ? `<span class="itemMeta">${escapeHtml(
                                it.uomLabel,
                            )}</span>`
                            : ''
                        }</td>`
                        : `<td class="colQty">${escapeHtml(
                            String(it.qty || ''),
                        )}${it.uomLabel && it.uomLabel !== '-'
                            ? `<span class="itemMeta">${escapeHtml(
                                it.uomLabel,
                            )}</span>`
                            : ''
                        }</td>`
                    }
                  <td class="colPrice"><span class="money">₹ ${formatIndianNumber(
                        it.rate,
                    )}</span></td>
                  <td class="colPrice">${toNum(it.discount) > 0
                        ? `<span class="money">₹ ${formatIndianNumber(
                            it.discount,
                        )} % </span>`
                        : `<span class="dimCell">—</span>`
                    }</td>
                  ${includeGst
                        ? `<td class="colGst">${renderGstHtml(it)}</td>`
                        : ''
                    }
                  <td class="colAmt"><span class="money">₹ ${formatIndianNumber(
                        includeGst ? it.net : it.taxable,
                    )}</span></td>
                </tr>
              `;
            })
            .join('')}
          <tr class="tableTotal">
            <td class="colNum"></td>
            <td class="colItem"><strong>Total</strong></td>
            ${entryType === 'GRN'
            ? `<td class="colQty"><strong>${formatIndianNumber(
                totalAccQty,
            )}</strong></td>
                   <td class="colQty"><strong>${formatIndianNumber(
                totalRejQty,
            )}</strong></td>`
            : `<td class="colQty"><strong>${formatIndianNumber(
                totalQty,
            )}</strong></td>`
        }
            <td class="colPrice"></td>
            <td class="colPrice"></td>
            ${includeGst ? `<td class="colGst"></td>` : ''}
            <td class="colAmt"><strong>₹ ${formatIndianNumber(
            pdfGrandTotal,
        )}</strong></td>
          </tr>
        </tbody>
      </table>
      <div class="belowRow">
        <div class="belowLeft">
          <div class="blkTitle">Invoice Amount In Words</div>
          <p class="blkText">${escapeHtml(amountWords)}</p>
          <div style="height:16px;"></div>
          <div class="blkTitle">Thank you for doing business with us.</div>
          ${entryType === 'sales-invoice'
            ? `${upiUrl
                ? `<a class="upiLink" href="${upiUrl}">Pay with UPI (GPay / PhonePe)</a>
                 <div class="upiMeta">UPI ID: ${escapeHtml(
                    upiId,
                )} • Amount: ₹ ${formatIndianNumber(pdfGrandTotal)}</div>`
                : `<div class="upiMeta">UPI not configured in Company Master.</div>`
            }`
            : ''
        }
          <div style="height:16px;"></div>
          ${normalized.doc.sInvRemark
            ? ` <div class="blkTitle">
                Remark:- ${normalized?.doc?.sInvRemark}
              </div>`
            : ''
        }
        </div>
        <div class="belowRight">
         <table class="sumTable">
        <tr>
          <td class="sumLabel">Sub Total</td>
          <td class="sumAmt">₹ ${formatIndianNumber(sumTableSubTotal)}</td>
        </tr>
 
        ${gstSummaryRows}
         ${discountAmt > 0
            ? `<tr>
        <td class="sumLabel">Discount</td>
        <td class="sumAmt">₹ ${formatIndianNumber(discountAmt)}</td>
      </tr>`
            : ''
        }
        ${extraFooterRows}
        <tr class="sumTotalRow">
          <td class="sumLabel">Total</td>
          <td class="sumAmt">₹ ${formatIndianNumber(pdfGrandTotal)}</td>
        </tr>
      </table>
        </div>
      </div>
      <div class="payRow">
        ${entryType === 'sales-invoice'
            ? `<div class="payLeft">
          ${upiQrUri
                ? `<img class="qr" src="${upiQrUri}" />`
                : `<div class="qr" style="display:flex;align-items:center;justify-content:center;color:#888;">
                   UPI QR not available
                 </div>`
            }
          <div class="payInfo">
            <div><b>Pay To:</b></div>
            <div>Bank Name: ${escapeHtml(bankName)}</div>
            <div>Bank Account No: ${escapeHtml(bankAcc)}</div>
            <div>Bank IFSC code: ${escapeHtml(bankIfsc)}</div>
            <div>Account Holder's Name: ${escapeHtml(companyName)}</div>
          </div>
        </div>`
            : `<div class="payLeft"></div>`
        }
        <div class="signRight">
          <div class="for">For: ${escapeHtml(companyName)}</div>
          ${signatureUri
            ? `<img class="signImg" src="${signatureUri}" />`
            : `<div style="height:70px;"></div>`
        }
          <div class="signText">Authorized Signatory</div>
        </div>
      </div>
    </body>
  </html>
  `)
};
