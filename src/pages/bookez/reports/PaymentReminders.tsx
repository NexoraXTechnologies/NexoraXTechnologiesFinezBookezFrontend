import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/DataTable";
import { useDispatch, useSelector } from "react-redux";
import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { DataREfreshButton } from "../../../components/buttons";
import { toast } from "react-toastify";
import { getPaymentReminderReport } from "../../../redux/slices/professionalSlice/paymentReminderReportSlice";
import { CalendarDays, FileText, IndianRupee, Mail, MessageCircle, Send, Share2, UserRound, X, } from "lucide-react";
import { getCompany } from "../../../redux/slices/professionalSlice/professionalCompanyMaster.slice";

const PaymentReminders = () => {
    const dispatch = useDispatch<any>();
    const [customerCode, setCustomerCode] = useState<string>("");
    const [refreshing, setRefreshing] = useState(false);
    const [showSendMessageModal, setShowSendMessageModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [companyMaster, setCompanyMaster] = useState<any>(null);
    const { accounts = [], loading = false, } = useSelector((s: any) => s.accountMaster || {});
    const { paymentReminderReport: records = [], loading: listingLoader = false, } = useSelector((s: any) => s.paymentReminderReport || {});
    const companyName = companyMaster?.companyName || "Company";

    const customerOptions = useMemo(() => {
        return (accounts || []).map((item: any) => ({
            label: item?.accountName || "",
            value: item?.accountCode || "",
            raw: item,
        }));
    }, [accounts]);

    const selectedCustomer = useMemo(() => {
        return customerOptions.find(
            (item: any) =>
                String(item?.value) ===
                String(customerCode)
        );
    }, [customerOptions, customerCode]);

    const totalRemainingAmount = useMemo(() => {
        return (records || []).reduce(
            (total: number, item: any) => total + Number(item?.balanceAmount || 0), 0);
    }, [records]);

    useEffect(() => {
        dispatch(
            getAllAccounts({
                limit: 200,
                offset: 0,
                accountType: "customer",
            }) as any
        );
    }, [dispatch]);


    // ⭐ YELLOW STAR: GET COMPANY MASTER
    useEffect(() => {
        const fetchCompanyMaster = async () => {
            try {
                const response = await dispatch(getCompany() as any).unwrap();
                setCompanyMaster(response?.data || response || null);
            } catch (error: any) { setCompanyMaster(null); }
        };
        fetchCompanyMaster();
    }, [dispatch]);


    //  YELLOW STAR: BY DEFAULT FETCH ALL SALES INVOICES
    //  IF CUSTOMER SELECTED THEN FETCH CUSTOMER WISE SALES INVOICES
    useEffect(() => {
        dispatch(getPaymentReminderReport({ customerCode: customerCode || "" })).unwrap()
            .catch((error: any) => {
                toast.error(error?.message || "Failed to load sales invoices");
            });
    }, [customerCode, dispatch]);


    const handleRefresh = async () => {

        try {
            setRefreshing(true);
            await dispatch(getPaymentReminderReport({ customerCode: customerCode || "" })).unwrap();
            toast.success("Payment reminders refreshed");
        } catch (error: any) {
            toast.error(error?.message || "Failed to refresh payment reminders");

        } finally { setRefreshing(false); }
    };



    const formatDate = (date: string) => {
        if (!date) { return "N/A"; }
        return new Date(date).toLocaleDateString("en-IN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });

    };


    // ⭐ YELLOW STAR: FORMAT AMOUNT
    const formatAmount = (amount: any) => {
        return Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2, });
    };


    // ⭐ YELLOW STAR: FIND CUSTOMER ACCOUNT
    const getCustomerAccount = (row: any) => {
        return (accounts || []).find((item: any) => String(item?.accountCode) === String(row?.sInvCustomerCode));
    };


    // ⭐ YELLOW STAR: GET EMAIL OF SELECTED INVOICE CUSTOMER
    const getCustomerEmail = (row: any) => {
        const customerAccount = getCustomerAccount(row);

        return (
            customerAccount?.accountEmail ||
            customerAccount?.email ||
            customerAccount?.emailAddress ||
            ""
        );

    };


    // ⭐ YELLOW STAR: BUILD INVOICE REMINDER MESSAGE
    const buildInvoiceMessage = (row: any) => {
        const customer = row?.sInvCustomerName || "Customer";
        return `Hi ${customer},

        This is a reminder from ${companyName} regarding your invoice payment.

        Invoice: ${row?.sInvVoucherNumber || "N/A"}
        Date: ${formatDate(row?.sInvVoucherDate)}
        Net Amount: ₹${formatAmount(row?.netAmount)}
        Returns: ₹${formatAmount(row?.totalReturnAmount)}
        Balance Amount: ₹${formatAmount(row?.balanceAmount)}

        Kindly clear the pending balance at the earliest.

        Thank you.`;

    };


    // ⭐ YELLOW STAR: OPEN SEND MESSAGE MODAL
    const handleShare = (row: any) => {
        setSelectedInvoice(row);
        setShowSendMessageModal(true);

    };


    // ⭐ YELLOW STAR: CLOSE SEND MESSAGE MODAL
    const handleCloseSendMessageModal = () => {
        setShowSendMessageModal(false);
        setSelectedInvoice(null);

    };


    // ⭐ YELLOW STAR: SEND WHATSAPP MESSAGE
    const handleWhatsApp = () => {

        if (!selectedInvoice) { return; }

        const customerAccount = getCustomerAccount(selectedInvoice);

        const mobileNumber =
            customerAccount?.accountMobile ||
            customerAccount?.mobileNumber ||
            customerAccount?.mobile ||
            "";

        if (!mobileNumber) {
            toast.error("Customer mobile number not found");
            return;
        }
        const message = buildInvoiceMessage(selectedInvoice);
        const cleanMobileNumber = String(mobileNumber).replace(/\D/g, "");
        const whatsappNumber = cleanMobileNumber.length === 10 ? `91${cleanMobileNumber}` : cleanMobileNumber;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
        handleCloseSendMessageModal();

    };


    // ⭐ YELLOW STAR: SEND EMAIL MESSAGE
    const handleEmail = () => {

        if (!selectedInvoice) { return; }
        const emailAddress = getCustomerEmail(selectedInvoice);
        if (!emailAddress) {
            toast.error("Customer email address not found");
            return;
        }

        const message = buildInvoiceMessage(selectedInvoice);
        const subject = `Payment Reminder - ${selectedInvoice?.sInvVoucherNumber || "Invoice"}`;
        window.location.href = `mailto:${String(emailAddress).trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        handleCloseSendMessageModal();

    };


    const mainColumns = [
        {
            key: "sInvVoucherNumber",
            title: "Voucher Number",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {row?.sInvVoucherNumber ||
                        row?.voucherNumber ||
                        "-"}
                </span>
            ),
        },
        {
            key: "sInvVoucherDate",
            title: "Voucher Date",
            render: (row: any) => {

                const rawDate = row?.sInvVoucherDate || row?.voucherDate;

                return (
                    <span className="font-medium text-muted-foreground">
                        {rawDate ? new Date(rawDate).toLocaleDateString("en-IN") : "-"}
                    </span>
                );
            },
        },
        {
            key: "sInvCustomerName",
            title: "Customer",
            render: (row: any) => (
                <span className="font-medium text-card-foreground">
                    {row?.sInvCustomerName || "-"}
                </span>
            ),
        },
        {
            key: "netAmount",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-card-foreground">
                    ₹{" "}
                    {Number(row?.netAmount || 0).toLocaleString("en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}
                </span>
            ),
        },
        {
            key: "totalReturnAmount",
            title: "Return Amount",
            render: (row: any) => (
                <span className="font-semibold text-warning">
                    ₹{" "}
                    {Number(row?.totalReturnAmount || 0).toLocaleString("en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}
                </span>
            ),
        },
        {
            key: "balanceAmount",
            title: "Balance Amount",
            render: (row: any) => (
                <span className="font-bold text-danger">
                    ₹{" "}
                    {Number(row?.balanceAmount || 0).toLocaleString("en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }
                    )}
                </span>
            ),
        },
    ];

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">

            {/* ⭐ YELLOW STAR: HEADER */}
            <div className="flex w-full items-end justify-between gap-4">

                <div className="flex items-center gap-3">

                    <div>
                        <h2 className="text-lg font-bold text-card-foreground">
                            Reminder Service
                        </h2>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Payment reminder invoices
                        </p>
                    </div>

                    <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
                        {records?.length || 0}
                    </div>

                </div>


                <div className="flex items-end gap-2">

                    <div className="w-[280px]">
                        <label className="mb-1 block text-xs font-medium text-card-foreground">
                            Customer
                        </label>

                        <select
                            value={customerCode}
                            disabled={loading}
                            onChange={(e) => { setCustomerCode(e.target.value); }}
                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                        >
                            <option value="">
                                {loading ? "Loading customers..." : "All Customers"}
                            </option>

                            {customerOptions.map(
                                (item: any) => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>
                                )
                            )}
                        </select>

                    </div>


                    <DataREfreshButton
                        callBackFn={handleRefresh}
                        loading={refreshing}
                    />

                </div>

            </div>


            {/* ⭐ YELLOW STAR: SELECTED CUSTOMER SUMMARY */}
            {customerCode && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">

                    <div>

                        <div className="text-sm font-bold text-primary"> {customerCode} </div>

                        <div className="mt-1 text-sm text-muted-foreground"> {selectedCustomer?.label || "-"} </div>

                    </div>


                    <div className="text-right">

                        <div className="text-xs text-muted-foreground">
                            Total Remaining Amount
                        </div>

                        <div className="mt-1 text-base font-bold text-danger">
                            ₹{" "}
                            {Number(totalRemainingAmount || 0).toLocaleString("en-IN",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }
                            )}
                        </div>

                    </div>

                </div>
            )}


            {/* ⭐ YELLOW STAR: PAYMENT REMINDER TABLE */}
            <DataTable
                columns={mainColumns}
                data={records}
                loading={listingLoader}
                emptyMessage={customerCode
                    ? "No sales invoices found for selected customer"
                    : "No sales invoices found"}
                showFieldSelector={false}
                actions={(row: any) => (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleShare(row); }}
                        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary/10 p-2 text-primary transition hover:bg-primary/20"
                        title="Share Payment Reminder"
                    >
                        <Share2 size={17} />
                    </button>
                )}
            />


            {/* ⭐ YELLOW STAR: SEND MESSAGE MODAL */}
            {showSendMessageModal &&
                selectedInvoice && (
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                        onClick={handleCloseSendMessageModal}
                    >
                        <div
                            className="relative w-full max-w-[560px] overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl"
                            onClick={(e) => { e.stopPropagation(); }}
                        >

                            {/* ⭐ YELLOW STAR: CLOSE BUTTON */}
                            <button
                                type="button"
                                onClick={handleCloseSendMessageModal}
                                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/10 text-white transition hover:rotate-90 hover:bg-black/20"
                                aria-label="Close send reminder modal"
                            >
                                <X size={18} />
                            </button>


                            {/* ⭐ YELLOW STAR: PREMIUM MODAL HEADER */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-7 py-7 text-primary-foreground">
                                <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/10" />
                                <div className="absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-white/10" />
                                <div className="relative flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/20">
                                        <Send size={23} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold"> Send Payment Reminder </h2>
                                        <p className="mt-1 text-sm text-primary-foreground/80"> Choose how you want to contact the customer. </p>
                                    </div>
                                </div>
                            </div>


                            <div className="p-6 sm:p-7">

                                {/* ⭐ YELLOW STAR: INVOICE PREVIEW */}
                                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"> <FileText size={20} /> </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Invoice Number
                                                </p>
                                                <p className="truncate text-sm font-bold text-card-foreground">
                                                    {selectedInvoice?.sInvVoucherNumber || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
                                            Payment Due
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                                        <div className="flex items-center gap-2.5">
                                            <UserRound className="shrink-0 text-muted-foreground" size={17} />
                                            <div className="min-w-0">
                                                <p className="text-[11px] text-muted-foreground">
                                                    Customer
                                                </p>
                                                <p className="truncate text-xs font-semibold text-card-foreground">
                                                    {selectedInvoice?.sInvCustomerName || "Customer"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <CalendarDays className="shrink-0 text-muted-foreground" size={17} />
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Invoice Date
                                                </p>
                                                <p className="text-xs font-semibold text-card-foreground">
                                                    {formatDate(selectedInvoice?.sInvVoucherDate)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <IndianRupee className="shrink-0 text-danger" size={17} />
                                            <div>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Balance Amount
                                                </p>
                                                <p className="text-xs font-bold text-danger">
                                                    ₹ {formatAmount(selectedInvoice?.balanceAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* YELLOW STAR: WHATSAPP AND EMAIL OPTIONS */}
                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                                    <button
                                        type="button"
                                        onClick={handleWhatsApp}
                                        className="group flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:shadow-lg"
                                    >
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition group-hover:scale-105">
                                            <MessageCircle size={22} />
                                        </span>

                                        <span>
                                            <span className="block text-sm font-bold text-card-foreground">
                                                WhatsApp
                                            </span>
                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                Send an instant message
                                            </span>
                                        </span>

                                    </button>

                                    {/* ⭐ YELLOW STAR: SHOW EMAIL ONLY WHEN SELECTED INVOICE CUSTOMER HAS EMAIL */}


                                    <button
                                        type="button"
                                        onClick={handleEmail}
                                        className="group flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/15 hover:shadow-lg"
                                    >
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition group-hover:scale-105">
                                            <Mail size={22} />
                                        </span>

                                        <span>
                                            <span className="block text-sm font-bold text-card-foreground">
                                                Email
                                            </span>
                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                Send a detailed reminder
                                            </span>
                                        </span>

                                    </button>


                                </div>


                                <button
                                    type="button"
                                    onClick={handleCloseSendMessageModal}
                                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
                                >
                                    Cancel
                                </button>

                            </div>

                        </div>

                    </div>

                )}

        </div>
    );
};

export default PaymentReminders;
