import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Check,
    Search,
    X,
    Plus,
    CreditCard,
    UserRound,
    Loader2,
    Wallet,
    ReceiptText,
    BadgeIndianRupee,
    PackageCheck,
    Percent,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import POSItemsTable from "./POSItemsTable";
import PaymentMethodModal from "../../../components/PaymentMethodModal";

import {
    createPosCustomer,
    getPosCompany,
    getPosCustomers,
    getPosPosting,
} from "../../../redux/slices/professionalSlice/pos";

import {
    createSalesInvoice,
    getByVoucherNumberSalesInvoice,
    updateSalesInvoice,
} from "../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";

import { addSalesReceipt } from "../../../redux/slices/professionalSlice/salesWorkflow/salesReceipt";

const safeStr = (v: any) => String(v ?? "").trim();

const toNum = (v: any) => {
    const n = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
};

const formatIndianNumber = (value: any) => {
    const num = toNum(value);
    return num.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });
};

const fadeUp:any = {
    hidden: {
        opacity: 0,
        y: 10,
        filter: "blur(4px)",
    },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 24,
        },
    },
};

const slideIn:any = {
    hidden: {
        opacity: 0,
        x: 18,
        filter: "blur(4px)",
    },
    show: {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 24,
        },
    },
};

const modalMotion:any = {
    hidden: {
        opacity: 0,
        scale: 0.94,
        y: 14,
        filter: "blur(5px)",
    },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 280,
            damping: 24,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.94,
        y: 10,
        filter: "blur(4px)",
        transition: {
            duration: 0.16,
        },
    },
};

const POSPaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<any>();

    const products = location?.state?.payload || [];
    const initialSelectedCustomer = location?.state?.selectedCustomer || null;

    const {
        customers,
        customerPagination,
        customerLoader,
        createCustomerLoader,
        companyLoader,
        posPostingLoader,
    } = useSelector((state: any) => state.pos);

    const [selected, setSelected] = useState<any>(initialSelectedCustomer);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const [customerName, setCustomerName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");

    const [errors, setErrors] = useState({
        customerName: "",
        phoneNumber: "",
        address: "",
    });

    const [openPay, setOpenPay] = useState(false);
    const [company, setCompany] = useState<any>(null);

    const [receiptConfirmOpen, setReceiptConfirmOpen] = useState(false);
    const [pendingPaymentMethod, setPendingPaymentMethod] = useState<string>("");

    const [billLoading, setBillLoading] = useState(false);

    const debounceRef = useRef<any>(null);
    const limit = 10;

    const totalAmount = useMemo(() => {
        return products.reduce((s: number, p: any) => s + toNum(p.netAmount), 0);
    }, [products]);

    const grossAmount = useMemo(() => {
        return products.reduce((s: number, p: any) => s + toNum(p.gross), 0);
    }, [products]);

    const discountAmount = useMemo(() => {
        return products.reduce(
            (s: number, p: any) => s + toNum(p.discountAmount),
            0
        );
    }, [products]);

    const taxAmount = useMemo(() => {
        return products.reduce((s: number, p: any) => s + toNum(p.taxAmount), 0);
    }, [products]);

    const selectedLabel = useMemo(() => {
        if (!selected) return "";

        const name = safeStr(selected?.accountName);
        const mobile = safeStr(selected?.accountMobile);

        return [name, mobile].filter(Boolean).join(" • ");
    }, [selected]);

    const totalLoader = billLoading || posPostingLoader;

    const fetchCustomers = useCallback(
        async ({ pageOffset = 0, append = false, q = "" } = {}) => {
            try {
                await dispatch(
                    getPosCustomers({
                        search: q,
                        offset: pageOffset,
                        limit,
                        append,
                    })
                ).unwrap();
            } catch (error: any) {
                toast.error(error?.message || "Failed to load customers");
            }
        },
        [dispatch]
    );

    useEffect(() => {
        if (!open) return;

        fetchCustomers({
            pageOffset: 0,
            append: false,
            q: query,
        });
    }, [open, fetchCustomers]);

    useEffect(() => {
        if (!open) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchCustomers({
                pageOffset: 0,
                append: false,
                q: query,
            });
        }, 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, open, fetchCustomers]);

    const loadMore = async () => {
        if (!customerPagination?.hasNextPage || customerLoader) return;

        const nextOffset =
            Number(customerPagination?.offset ?? 0) +
            Number(customerPagination?.limit ?? limit);

        await fetchCustomers({
            pageOffset: nextOffset,
            append: true,
            q: query,
        });
    };

    const onSelectCustomer = (customer: any) => {
        setSelected(customer);
        setOpen(false);
        setQuery("");
    };

    const handleAddCustomer = async () => {
        let hasError = false;

        const nextErrors = {
            customerName: "",
            phoneNumber: "",
            address: "",
        };

        if (!customerName.trim()) {
            nextErrors.customerName = "Customer name is required";
            hasError = true;
        }

        const cleanMobile = phoneNumber.replace(/\D/g, "");

        if (!cleanMobile) {
            nextErrors.phoneNumber = "Mobile number is required";
            hasError = true;
        } else if (cleanMobile.length !== 10) {
            nextErrors.phoneNumber = "Enter valid 10 digit mobile number";
            hasError = true;
        }

        if (!address.trim()) {
            nextErrors.address = "Address is required";
            hasError = true;
        }

        if (hasError) {
            setErrors(nextErrors);
            return;
        }

        try {
            const res = await dispatch(
                createPosCustomer({
                    payload: {
                        accountName: customerName.trim(),
                        accountAddress: address.trim(),
                        accountType: "customer",
                        accountMobile: cleanMobile,
                    },
                })
            ).unwrap();

            const created =
                res?.data?.account || res?.account || res?.data || res || null;

            setSelected(created);
            setCustomerName("");
            setPhoneNumber("");
            setAddress("");
            setQuery("");
            setErrors({
                customerName: "",
                phoneNumber: "",
                address: "",
            });
            setOpen(false);

            await fetchCustomers({
                pageOffset: 0,
                append: false,
                q: "",
            });

            toast.success("Customer created successfully");
        } catch (error: any) {
            toast.error(error?.message || "Failed to create customer");
        }
    };

    const openPaymentModal = async () => {
        if (!selected) {
            toast.error("Please select customer for bill");
            return;
        }

        if (!products.length) {
            toast.error("No products added");
            navigate("/bookEz/pos");
            return;
        }

        try {
            setOpenPay(true);

            const res = await dispatch(getPosCompany()).unwrap();

            const data = res?.data || res;
            const companyData = Array.isArray(data) ? data?.[0] : data;

            if (!companyData?._id) {
                toast.error("Company master missing. Please create company first.");
                setOpenPay(false);
                navigate("/bookEz/master/company-master");
                return;
            }

            setCompany(companyData);
        } catch (error: any) {
            toast.error(error?.message || "Failed to load company");
            setOpenPay(false);
        }
    };

    const getReceiptAccount = async (paymentMethod: string) => {
        const posPostingRes = await dispatch(getPosPosting()).unwrap();

        const postingRecord =
            posPostingRes?.data?.records?.[0] ||
            posPostingRes?.records?.[0] ||
            posPostingRes?.data?.data?.records?.[0];

        if (paymentMethod === "cash") {
            if (!postingRecord?.cash) {
                toast.error("Please add cash account in POS Posting");
                navigate("/bookEz/master/pos-posting");
                return null;
            }

            return postingRecord.cash;
        }

        if (paymentMethod === "qr") {
            if (!postingRecord?.upi) {
                toast.error("Please add UPI account in POS Posting");
                navigate("/bookEz/master/pos-posting");
                return null;
            }

            return postingRecord.upi;
        }

        if (!postingRecord?.cash && !postingRecord?.upi) {
            toast.error("Please add cash or UPI account in POS Posting");
            navigate("/bookEz/master/pos-posting");
            return null;
        }

        return postingRecord?.cash || postingRecord?.upi;
    };

    const generateBill = async (paymentMethod: string, createReceipt: boolean) => {
        if (!selected) {
            toast.error("Please select customer for bill");
            return;
        }

        if (!products.length) {
            toast.error("No products added");
            return;
        }

        const grossTotal = products.reduce(
            (sum: number, p: any) => sum + toNum(p.gross),
            0
        );

        const discountAmountTotal = products.reduce(
            (sum: number, p: any) => sum + toNum(p.discountAmount),
            0
        );

        const cgstAmountTotal = products.reduce(
            (sum: number, p: any) => sum + toNum(p.cgstAmount),
            0
        );

        const sgstAmountTotal = products.reduce(
            (sum: number, p: any) => sum + toNum(p.sgstAmount),
            0
        );

        const igstAmountTotal = products.reduce(
            (sum: number, p: any) => sum + toNum(p.igstAmount),
            0
        );

        const netAmountTotal = products.reduce(
            (sum: number, p: any) => sum + toNum(p.netAmount),
            0
        );

        const now = new Date().toISOString();

        const salesPayload = {
            sInvCustomerCode: selected.accountCode,
            sInvCustomerName: selected.accountName,
            sInvVoucherDate: now,
            sInvStatus: "open",
            sInvRemark: "POS Invoice",
            isPosPosting: true,

            sInvBody: products.map((p: any) => ({
                sOrderNumber: p.sOrderNumber ?? null,
                productCode: p.productCode,
                productName: p.productName,
                productType: p.productType || "",
                productDescription: p.productDescription || "",
                productHSNCode: p.productHSNCode || "",
                quantity: String(toNum(p.quantity)),
                uom: p.uom || "",
                rate: String(toNum(p.rate)),
                gross: String(toNum(p.gross)),

                discount: String(toNum(p.discount)),
                discountAmount: String(toNum(p.discountAmount)),

                cgst: String(toNum(p.cgst)),
                cgstAmount: String(toNum(p.cgstAmount)),

                sgst: String(toNum(p.sgst)),
                sgstAmount: String(toNum(p.sgstAmount)),

                igst: String(toNum(p.igst)),
                igstAmount: String(toNum(p.igstAmount)),

                taxAmount: String(toNum(p.taxAmount)),
                netAmount: String(toNum(p.netAmount)),

                from_date: p.from_date || now,
                to_date: p.to_date || now,
            })),

            sInvFooter: {
                grossAmount: String(grossTotal),
                discountAmount: String(discountAmountTotal),
                cgstAmount: String(cgstAmountTotal),
                sgstAmount: String(sgstAmountTotal),
                igstAmount: String(igstAmountTotal),
                netAmount: String(netAmountTotal),
                adjustedAmount: createReceipt ? String(netAmountTotal) : "0",
                balanceAmount: createReceipt ? "0" : String(netAmountTotal),
            },
        };

        try {
            setBillLoading(true);

            const salesPost = await dispatch(
                createSalesInvoice({
                    payload: salesPayload,
                })
            ).unwrap();

            const salesData = salesPost?.data || salesPost;

            if (!salesData?.sInvVoucherNumber) {
                throw new Error("Sales invoice created but voucher number not found");
            }

            if (!createReceipt) {
                toast.success("Invoice created successfully");
                setOpenPay(false);
                setReceiptConfirmOpen(false);
                navigate("/bookEz/pos");
                return;
            }

            const receiptAccount = await getReceiptAccount(paymentMethod);

            if (!receiptAccount) return;

            const receiptPayload = {
                recVoucherNumber: "AUTO",
                recVoucherDate: now,
                recAccountCode: receiptAccount.accountCode,
                recAccountName: receiptAccount.accountName,
                recStatus: "open",
                isPosPosting: true,

                recBody: [
                    {
                        accountCode: salesData.sInvCustomerCode,
                        accountName: salesData.sInvCustomerName,
                        amount: netAmountTotal,
                        netAmount: netAmountTotal,
                        references: [
                            {
                                referenceType: "SINV",
                                billDueDate: salesData.sInvVoucherDate,
                                billAmount: netAmountTotal,
                                adjustedAmount: netAmountTotal,
                                returnAmount: 0,
                                salesInvoice: salesData.sInvVoucherNumber,
                            },
                        ],
                        remarks: null,
                    },
                ],
            };

            const receiptPost = await dispatch(
                addSalesReceipt({
                    payload: receiptPayload,
                })
            ).unwrap();

            const receiptData = receiptPost?.data || receiptPost;

            if (!receiptData?.recVoucherNumber) {
                throw new Error("Invoice created, but receipt voucher number not found");
            }

            const invoiceRes = await dispatch(
                getByVoucherNumberSalesInvoice({
                    voucherNumber: salesData.sInvVoucherNumber,
                })
            ).unwrap();

            const invoiceData = invoiceRes?.data || invoiceRes || {};
            const existingReferenceCodes = invoiceData?.sInvReferenceCodes || [];

            await dispatch(
                updateSalesInvoice({
                    sInvVoucherNumber: salesData.sInvVoucherNumber,
                    payload: {
                        sInvReferenceCodes: [
                            ...existingReferenceCodes,
                            receiptData.recVoucherNumber,
                        ],
                        sInvStatus: "close",
                        sInvFooter: {
                            adjustedAmount: netAmountTotal,
                            balanceAmount: 0,
                        },
                    },
                })
            ).unwrap();

            toast.success("Payment collected successfully");
            setOpenPay(false);
            setReceiptConfirmOpen(false);
            navigate("/bookEz/pos");
        } catch (error: any) {
            toast.error(error?.message || "Failed to create bill");
        } finally {
            setBillLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-3 text-foreground">
            <AnimatePresence>
                {totalLoader ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            variants={modalMotion}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-2xl"
                        >
                            <Loader2 className="mx-auto mb-3 animate-spin text-foreground" />
                            <p className="text-sm font-black text-muted-foreground">
                                Processing POS bill...
                            </p>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Header */}
            <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="mb-3 flex flex-col gap-3 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm lg:flex-row lg:items-center lg:justify-between"
            >
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={() =>
                            navigate("/bookEz/pos", {
                                state: {
                                    selectedCustomer: selected,
                                },
                            })
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-input text-card-foreground transition hover:bg-muted"
                    >
                        <ArrowLeft size={18} />
                    </motion.button>

                    <div>
                        <h1 className="text-lg font-black text-card-foreground">
                            Proceed To Pay
                        </h1>
                        <p className="text-xs font-bold text-muted-foreground">
                            Verify customer, items and payment
                        </p>
                    </div>
                </div>

                <motion.div
                    whileHover={{ y: -1 }}
                    className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-black text-primary-foreground shadow-md shadow-primary/20"
                >
                    <Wallet size={16} />
                    Total: ₹ {formatIndianNumber(totalAmount)}
                </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_390px]">
                {/* Left Section */}
                <div className="space-y-3">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="relative z-30 rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm"
                    >
                        <div className="mb-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <UserRound size={20} />
                                </div>

                                <div>
                                    <p className="text-base font-black text-card-foreground">
                                        Customer Details
                                    </p>
                                    <p className="text-xs font-bold text-muted-foreground">
                                        Select existing or create new customer
                                    </p>
                                </div>
                            </div>

                            {selected?.accountName ? (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-md bg-success/10 px-2.5 py-1 text-xs font-black text-success"
                                >
                                    Selected
                                </motion.span>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={() => setOpen((prev) => !prev)}
                            className="flex h-10 w-full items-center gap-3 rounded-md border border-border bg-input px-3 text-left transition hover:bg-muted"
                        >
                            <UserRound size={18} className="text-muted-foreground" />

                            <span
                                className={`flex-1 truncate text-sm font-bold ${selectedLabel
                                        ? "text-card-foreground"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                {selectedLabel || "Select Customer"}
                            </span>

                            {open ? (
                                <ChevronUp size={19} className="text-muted-foreground" />
                            ) : (
                                <ChevronDown size={19} className="text-muted-foreground" />
                            )}
                        </button>

                        <AnimatePresence>
                            {open ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 22,
                                    }}
                                    className="mt-2 overflow-hidden rounded-md border border-border bg-card shadow-xl"
                                >
                                    <div className="flex h-10 items-center gap-2 border-b border-border px-3">
                                        <Search
                                            size={18}
                                            className="text-muted-foreground"
                                        />

                                        <input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search by name or mobile"
                                            className="h-full flex-1 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground"
                                        />

                                        {customerLoader ? (
                                            <Loader2
                                                size={17}
                                                className="animate-spin text-muted-foreground"
                                            />
                                        ) : query ? (
                                            <button
                                                type="button"
                                                onClick={() => setQuery("")}
                                            >
                                                <X
                                                    size={17}
                                                    className="text-muted-foreground"
                                                />
                                            </button>
                                        ) : null}
                                    </div>

                                    <div className="max-h-[270px] overflow-auto">
                                        {customers.length ? (
                                            customers.map((customer: any) => {
                                                const isActive =
                                                    selected?._id &&
                                                    selected?._id === customer?._id;

                                                return (
                                                    <motion.button
                                                        layout
                                                        key={
                                                            customer?._id ||
                                                            customer?.accountCode
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            onSelectCustomer(customer)
                                                        }
                                                        className={`flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition hover:bg-muted ${isActive
                                                                ? "bg-primary/10"
                                                                : "bg-card"
                                                            }`}
                                                    >
                                                        <div className="flex-1">
                                                            <p
                                                                className={`text-sm font-black ${isActive
                                                                        ? "text-primary"
                                                                        : "text-card-foreground"
                                                                    }`}
                                                            >
                                                                {customer?.accountName || "—"}
                                                            </p>

                                                            <p className="mt-0.5 text-xs font-bold text-muted-foreground">
                                                                Mobile:{" "}
                                                                {customer?.accountMobile || "—"}
                                                            </p>
                                                        </div>

                                                        {isActive ? (
                                                            <Check
                                                                size={18}
                                                                className="text-primary"
                                                            />
                                                        ) : null}
                                                    </motion.button>
                                                );
                                            })
                                        ) : !customerLoader ? (
                                            <div className="p-4 text-center">
                                                <p className="text-sm font-black text-muted-foreground">
                                                    No customer found
                                                </p>
                                            </div>
                                        ) : null}

                                        {customerPagination?.hasNextPage ? (
                                            <button
                                                type="button"
                                                onClick={loadMore}
                                                disabled={customerLoader}
                                                className="flex h-10 w-full items-center justify-center text-sm font-black text-primary disabled:opacity-60"
                                            >
                                                {customerLoader
                                                    ? "Loading..."
                                                    : "Load More"}
                                            </button>
                                        ) : null}

                                        {query ? (
                                            <div className="border-t border-border bg-muted p-3">
                                                <p className="mb-2 text-xs font-black uppercase text-muted-foreground">
                                                    Add New Customer
                                                </p>

                                                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                                    <div>
                                                        <input
                                                            value={customerName}
                                                            onChange={(e) => {
                                                                setCustomerName(e.target.value);
                                                                if (errors.customerName) {
                                                                    setErrors((prev) => ({
                                                                        ...prev,
                                                                        customerName: "",
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder="Customer Name"
                                                            className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                                        />
                                                        {errors.customerName ? (
                                                            <p className="mt-1 text-xs font-bold text-danger">
                                                                {errors.customerName}
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div>
                                                        <input
                                                            value={phoneNumber}
                                                            maxLength={10}
                                                            onChange={(e) => {
                                                                const clean =
                                                                    e.target.value.replace(/\D/g, "");
                                                                setPhoneNumber(clean);
                                                                if (errors.phoneNumber) {
                                                                    setErrors((prev) => ({
                                                                        ...prev,
                                                                        phoneNumber: "",
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder="Mobile Number"
                                                            className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                                        />
                                                        {errors.phoneNumber ? (
                                                            <p className="mt-1 text-xs font-bold text-danger">
                                                                {errors.phoneNumber}
                                                            </p>
                                                        ) : null}
                                                    </div>

                                                    <div>
                                                        <input
                                                            value={address}
                                                            onChange={(e) => {
                                                                setAddress(e.target.value);
                                                                if (errors.address) {
                                                                    setErrors((prev) => ({
                                                                        ...prev,
                                                                        address: "",
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder="Address"
                                                            className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                                                        />
                                                        {errors.address ? (
                                                            <p className="mt-1 text-xs font-bold text-danger">
                                                                {errors.address}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <motion.button
                                                    whileTap={{ scale: 0.97 }}
                                                    type="button"
                                                    onClick={handleAddCustomer}
                                                    disabled={createCustomerLoader}
                                                    className="mt-3 flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                                                >
                                                    {createCustomerLoader ? (
                                                        <Loader2
                                                            size={16}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Plus size={16} />
                                                    )}
                                                    Add Customer
                                                </motion.button>
                                            </div>
                                        ) : null}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </motion.div>

                    <POSItemsTable items={products} />
                </div>

                {/* Right Summary */}
                <motion.div
                    variants={slideIn}
                    initial="hidden"
                    animate="show"
                    className="xl:sticky xl:top-3 xl:h-fit"
                >
                    <div className="overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm">
                        <div className="relative overflow-hidden border-b border-border bg-primary p-4 text-primary-foreground">
                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-foreground/10" />
                            <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-primary-foreground/5" />

                            <div className="relative">
                                <p className="text-xs font-black uppercase tracking-wide text-primary-foreground/60">
                                    Payment Summary
                                </p>

                                <h2 className="mt-1 text-2xl font-black">
                                    ₹ {formatIndianNumber(totalAmount)}
                                </h2>
                            </div>
                        </div>

                        <div className="space-y-3 p-3">
                            <div className="grid grid-cols-2 gap-2">
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="rounded-md border border-border bg-muted p-3"
                                >
                                    <PackageCheck className="mb-2 text-primary" size={17} />
                                    <p className="text-xs font-black uppercase text-muted-foreground">
                                        Items
                                    </p>
                                    <p className="mt-1 text-sm font-black text-foreground">
                                        {products.length}
                                    </p>
                                </motion.div>

                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="rounded-md border border-border bg-muted p-3"
                                >
                                    <BadgeIndianRupee
                                        className="mb-2 text-primary"
                                        size={17}
                                    />
                                    <p className="text-xs font-black uppercase text-muted-foreground">
                                        Gross
                                    </p>
                                    <p className="mt-1 text-sm font-black text-foreground">
                                        ₹ {formatIndianNumber(grossAmount)}
                                    </p>
                                </motion.div>

                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="rounded-md border border-border bg-muted p-3"
                                >
                                    <ReceiptText className="mb-2 text-primary" size={17} />
                                    <p className="text-xs font-black uppercase text-muted-foreground">
                                        Tax
                                    </p>
                                    <p className="mt-1 text-sm font-black text-foreground">
                                        ₹ {formatIndianNumber(taxAmount)}
                                    </p>
                                </motion.div>

                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="rounded-md border border-border bg-muted p-3"
                                >
                                    <Percent className="mb-2 text-success" size={17} />
                                    <p className="text-xs font-black uppercase text-muted-foreground">
                                        Discount
                                    </p>
                                    <p className="mt-1 text-sm font-black text-success">
                                        -₹ {formatIndianNumber(discountAmount)}
                                    </p>
                                </motion.div>
                            </div>

                            <div className="rounded-md border border-border bg-muted p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-bold text-muted-foreground">
                                        Customer
                                    </span>

                                    <span className="max-w-[190px] truncate text-right text-sm font-black text-foreground">
                                        {selected?.accountName || "Not Selected"}
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={openPaymentModal}
                                disabled={!products.length || companyLoader}
                                className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-black text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                            >
                                {companyLoader ? (
                                    <Loader2 size={17} className="animate-spin" />
                                ) : (
                                    <CreditCard size={17} />
                                )}
                                Proceed To Pay
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <PaymentMethodModal
                visible={openPay}
                onClose={() => setOpenPay(false)}
                company={company}
                amount={totalAmount}
                loadingCompany={companyLoader}
                onPressCollected={(paymentMethod: string) => {
                    setPendingPaymentMethod(paymentMethod);
                    setReceiptConfirmOpen(true);
                }}
            />

            <AnimatePresence>
                {receiptConfirmOpen ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            variants={modalMotion}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            className="w-full max-w-[460px] overflow-hidden rounded-[24px] border border-border bg-card text-card-foreground shadow-2xl"
                        >
                            <div className="relative overflow-hidden bg-primary px-5 py-4 text-primary-foreground">
                                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary-foreground/10" />

                                <div className="relative flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wide text-primary-foreground/60">
                                            POS Payment
                                        </p>

                                        <h2 className="mt-1 text-lg font-black">
                                            Create Receipt?
                                        </h2>
                                    </div>

                                    <div className="rounded-2xl bg-primary-foreground/10 px-4 py-2 text-right">
                                        <p className="text-xs font-black uppercase text-primary-foreground/60">
                                            Amount
                                        </p>
                                        <p className="text-base font-black">
                                            ₹ {formatIndianNumber(totalAmount)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="mb-3 rounded-md border border-border bg-muted p-3">
                                    <p className="text-base font-black text-card-foreground">
                                        Do you want to create receipt along with this sales invoice?
                                    </p>

                                    <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
                                        Choose{" "}
                                        <span className="font-black text-card-foreground">
                                            Yes
                                        </span>{" "}
                                        if payment is collected now. Choose{" "}
                                        <span className="font-black text-card-foreground">
                                            No
                                        </span>{" "}
                                        if this is a credit invoice.
                                    </p>
                                </div>

                                <div className="mb-4 grid grid-cols-2 gap-3">
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="rounded-md border border-success/20 bg-success/10 p-3"
                                    >
                                        <p className="text-sm font-black uppercase text-success">
                                            Yes
                                        </p>
                                        <p className="mt-1 text-sm font-black text-card-foreground">
                                            Invoice + Receipt
                                        </p>
                                        {/* <p className="mt-1 text-xs font-bold text-muted-foreground">
                                            Invoice will be closed
                                        </p> */}
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="rounded-md border border-primary/20 bg-primary/10 p-3"
                                    >
                                        <p className="text-sm font-black uppercase text-primary">
                                            No
                                        </p>
                                        <p className="mt-1 text-sm font-black text-card-foreground">
                                            Invoice Only
                                        </p>
                                        {/* <p className="mt-1 text-xs font-bold text-muted-foreground">
                                            Invoice will stay open
                                        </p> */}
                                    </motion.div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        type="button"
                                        disabled={billLoading}
                                        onClick={() => {
                                            setReceiptConfirmOpen(false);
                                            setOpenPay(false);
                                            generateBill(pendingPaymentMethod, false);
                                        }}
                                        className="h-10 rounded-md border border-border bg-card text-sm font-black text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        No, Invoice Only
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        type="button"
                                        disabled={billLoading}
                                        onClick={() => {
                                            setReceiptConfirmOpen(false);
                                            setOpenPay(false);
                                            generateBill(pendingPaymentMethod, true);
                                        }}
                                        className="h-10 rounded-md bg-success text-sm font-black text-success-foreground shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                                    >
                                        Yes, Create Receipt
                                    </motion.button>
                                </div>

                                <button
                                    type="button"
                                    disabled={billLoading}
                                    onClick={() => setReceiptConfirmOpen(false)}
                                    className="mt-2 h-9 w-full rounded-md text-sm font-black text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default POSPaymentPage;