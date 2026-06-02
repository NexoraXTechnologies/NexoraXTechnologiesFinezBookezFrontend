import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applyCoupon, clearCouponState, clearPlansState, createOrder, getAllPlans, myPlan, subscribePlan, verifyPayment } from "../../redux/slices/professionalSlice/subscriptions";
import {
    Search,
    ChevronRight,
    CheckCircle2,
    X,
    Crown,
    Sparkles,
    ReceiptText,
} from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../../components/buttons";
import { AnimatePresence, motion } from "framer-motion";
import { TextInput } from "../../components/inputs";
import { toast } from "react-toastify";

const getPlanIcon = (name = "") => {
    const type = getPlanType(name);
    if (type === "gold") return Crown;
    if (type === "silver") return Sparkles;
    if (type === "itr") return ReceiptText;
    return CheckCircle2;
};

const getLabelClass = (name = "") => {
    const type = getPlanType(name);
    if (type === "gold") return "bg-yellow-400 text-yellow-950";
    if (type === "silver") return "bg-blue-100 text-blue-800";
    if (type === "itr") return "bg-emerald-100 text-emerald-800";
    return "bg-gray-100 text-gray-700";
};

const getPlanType = (name = "") => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("gold")) return "gold";
    if (lowerName.includes("silver")) return "silver";
    if (lowerName.includes("itr")) return "itr";
    return "default";
};

const formatDuration = (months: any) => {
    if (months === 1) return "1 Month";
    if (months === 12) return "1 Year";
    return `${months} Months`;
};

const Subscription = () => {
    const dispatch = useDispatch();
    const { plans, currentPlan } = useSelector((e: any) => e.plans);
    const [selectedCategory, setSelectedCategory] = useState("All Plans");
    const [search, setSearch] = useState("");
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [coupon, setCoupon] = useState("");

    const fetchAccounts = () => {
        dispatch(myPlan());
        dispatch(getAllPlans({ offset: 0, limit: 100, search: "", }))
    };

    const filteredPlans = useMemo(() => {
        const filter = plans?.filter((e: any) => e?.name == selectedCategory);
        return !!filter?.length ? filter : plans;
    }, [plans, search, selectedCategory]);

    useEffect(() => {
        fetchAccounts();
    }, []);

    return (
        <div className=" bg-white p-4 md:p-8 h-[100%] pb-10">
            <div className="mx-auto max-w-7xl">
                {/* <div className="grid grid-cols-1 gap-8 lg:grid-cols-[270px_1fr]"> */}
                    {/* Sidebar */}
                    {/* <aside>
                        <h2 className="mb-3 text-xl font-bold text-gray-700">
                            Plan category
                        </h2>

                        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                            {[{ name: "All Plans" }, ...plans]?.map((category) => {
                                const isActive = selectedCategory === category?.name;
                                return (
                                    <button
                                        key={category?.name}
                                        type="button"
                                        onClick={() => setSelectedCategory(category?.name)}
                                        className={`w-full border-b border-gray-200 px-5 py-3 text-left text-base font-semibold transition last:border-b-0 ${isActive ? "bg-indigo-50 text-gray-950" : "bg-white text-gray-600 hover:bg-gray-50"}`}                                    >
                                        {category?.name}
                                    </button>
                                );
                            })}
                        </div>
                    </aside> */}

                    {/* Content */}
                    <main>
                        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <h1 className="text-3xl font-extrabold text-gray-950">
                                Subscription Plans
                            </h1>

                            <div className="flex w-full items-center gap-3 rounded-md bg-gray-100 px-5 py-3 md:w-[270px]">
                                <Search className="h-6 w-6 text-gray-900" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search plans"
                                    className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {filteredPlans.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {filteredPlans.map((plan, idx) => (
                                    <PlanCard
                                        key={idx}
                                        plan={plan}
                                        onClick={() => setSelectedPlan(plan)}
                                        currentPlan={currentPlan}

                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                                <p className="text-lg font-bold text-gray-700">
                                    No plans found
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Try changing category or search keyword.
                                </p>
                            </div>
                        )}
                    </main>
                {/* </div> */}
            </div>

            {selectedPlan && (
                <PlanDetailsModal
                    plan={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                    coupon={coupon}
                    setCoupon={setCoupon}
                    currentPlan={currentPlan}
                />
            )}
        </div>
    )
}

const PlanCard = ({ plan, onClick, currentPlan }) => {
    const Icon = getPlanIcon(plan.name);
    const labelClass = getLabelClass(plan.name);
    const hasDiscount = Number(plan.discountPercentage) > 0 && Number(plan.finalPrice) < Number(plan.price);
    const activePlan = currentPlan?.current?.planPublicId == plan?.planPublicId;

    return (
        <div
            onClick={onClick}
            className="relative w-full rounded-md bg-[#e9edf9] p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
            {/* Label */}
            {activePlan && <div className="absolute -top-3 left-4">
                <span
                    className={`rounded px-3 py-1 text-xs font-extrabold uppercase tracking-wide bg-green-200`}
                >
                    Active Plan
                </span>
            </div>}
            <div className={`absolute -top-3  ${activePlan ? "left-35" : "left-4"}`}>
                <span
                    className={`rounded px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${labelClass}`}
                >
                    {plan?.name}
                </span>
            </div>

            {/* Arrow */}
            <ChevronRight className="absolute right-5 top-5 h-6 w-6 text-blue-700" />

            {/* Price */}
            <div className="mt-3">
                <div className="flex items-end gap-2">
                    <h2 className="text-4xl font-extrabold text-gray-950">
                        ₹{plan.finalPrice}
                    </h2>

                    {hasDiscount && (
                        <span className="mb-1 text-lg font-bold text-gray-500 line-through">
                            ₹{plan.price}
                        </span>
                    )}
                </div>

                {hasDiscount && (
                    <p className="mt-1 inline-flex rounded-md bg-rose-100 px-2 py-1 text-xs font-extrabold text-rose-700">
                        {plan.discountPercentage}% OFF
                    </p>
                )}
            </div>

            {/* Required details only */}
            <div className="mt-6 grid grid-cols-[90px_1fr_auto] items-center gap-4">
                <div>
                    <p className="text-sm font-bold text-gray-500">Validity</p>
                    <p className="mt-1 text-sm font-extrabold text-gray-950">
                        {formatDuration(plan.durationMonths)}
                    </p>
                </div>

                <div>
                    <p className="text-sm font-bold text-gray-500">Plan</p>
                    <p className="mt-1 line-clamp-1 text-sm font-extrabold text-gray-950">
                        {plan.name}
                    </p>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500 text-white">
                    <Icon className="h-4 w-4" />
                </span>
            </div>

            {/* Button */}
            {/* <PrimaryButton {...{ callBackFn: onClick, text: "Subscribe", className: "w-full mt-3" }} /> */}
        </div>
    );
};

const PlanDetailsModal = ({ plan, onClose, coupon, setCoupon, currentPlan }: any) => {
    const Icon = getPlanIcon(plan.name);
    const labelClass = getLabelClass(plan.name);
    const dispatch = useDispatch()
    const { couponData, couponLoading } = useSelector((e: any) => e.plans);
    console.log({ couponData })
    const [autoPay, setAutoPay] = useState(false);
    const professionalUser = JSON.parse(localStorage.getItem("professionalUser"))
    const hasDiscount = Number(plan.discountPercentage) > 0 && Number(plan.finalPrice) < Number(plan.price);
    const activePlan = currentPlan?.current?.planPublicId == plan?.planPublicId;

    const applyCouponFun = async () => {
        if (!coupon?.length) return toast.warning("Enter Coupon Code");
        if (activePlan) return toast.error("This plan is already active!")
        if (currentPlan?.current?.price > plan?.price) return toast.error("You can not Downgrade plan!");  
       const res = await dispatch(applyCoupon({ planPublicId: plan?.planPublicId, couponCode: coupon }))
        console.log(couponData, res, "coupon")
        if (couponData?.isFree || res?.payload?.isFree) {
            toast.success("Subscription activated successfully")
            onClose();
            return;
        }
    }

    const handleModalClose = () => {
        setCoupon("");
        dispatch(clearPlansState());
        onClose();
    }

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            const existingScript = document.querySelector(
                'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            );

            if (existingScript) {
                resolve(true);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;

            script.onload = () => {
                resolve(true);
            };

            script.onerror = () => {
                resolve(false);
            };

            document.body.appendChild(script);
        });
    };

    const handleSubscriptionPayment = async () => {
        try {
            if (activePlan) return toast.error("This plan is already active!")
            if (currentPlan?.current?.price > plan?.price) return toast.error("You can not Downgrade plan!")
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded || !window.Razorpay) {
                toast.error("Razorpay SDK failed to load")
                return;
            }

            const orderRes = await dispatch(
                createOrder({
                    planPublicId: couponData?.planPublicId || plan?.planPublicId,
                    pan: professionalUser?.userPAN,
                    mobile: professionalUser?.userMobileNumberHash,
                    email: professionalUser?.userEmail,
                    firstName: professionalUser?.userFirstName,
                    middleName: professionalUser?.userMiddleName,
                    autoRenewEnabled: autoPay, // CHECKBOX FOR THIS
                    couponCode: couponData?.couponCode || "",
                    lastName: professionalUser?.userLastName,
                })
            ).unwrap();

            const orderData = orderRes;
            // Free subscription
            if (orderData?.isFree) {
                console.log("Subscription")
                toast.success("Subscription activated successfully")
                return;
            }

            /**
             * Paid subscription case
             * Razorpay order id must start with order_
             */
            if (!String(orderData?.orderId || "").startsWith("order_")) {
                toast.success("Invalid Razorpay order id received from server")
                return;
            }
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData?.amount,
                currency: orderData?.currency || "INR",
                name: "FinEZ",
                description: plan?.planName,
                order_id: orderData?.orderId,

                prefill: {
                    name: [
                        professionalUser?.userFirstName,
                        professionalUser?.userMiddleName,
                        professionalUser?.userLastName,
                    ]
                        .filter(Boolean)
                        .join(" "),
                    email: professionalUser?.userEmail || "",
                    contact: professionalUser?.userMobileNumber || "",
                },

                handler: async function (response: any) {
                    try {
                        await dispatch(
                            verifyPayment({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                            })
                        ).unwrap();

                        await dispatch(
                            subscribePlan({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id
                            })
                        ).unwrap();
                        handleModalClose();
                        dispatch(myPlan());
                        toast.success("Subscription activated")
                    } catch (error: any) {
                        console.log("Payment verification error", error);
                    }
                },

                modal: {
                    ondismiss: function () { console.log("Payment popup closed"); },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on("payment.failed", function (response: any) {
                toast.error("Payment Failed", response.error);
            });
            razorpay.open();
        } catch (error: any) {
            console.log("Payment error", error);
        }
    };

    const handleCoupon = (e: any) => {
        dispatch(clearCouponState());
        setCoupon(e?.target?.value)
    }

    return (
        <AnimatePresence>
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center  bg-black/50 backdrop-blur-sm p-4">
                <motion.div className="w-full max-w-lg rounded-md bg-white p-6 shadow-2xl "
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                    }}
                >
                {/* Header */}
                    <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                            <span className={`inline-flex rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide ${labelClass}`}>
                                {plan?.name}
                        </span>
                            <h2 className="mt-3 text-2xl font-bold text-gray-950">
                            {plan.name}
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-500">
                            {plan.description}
                        </p>
                    </div>

                    <button
                        type="button"
                            onClick={handleModalClose}
                            className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Price Box */}
                    <div className="rounded-md bg-[#e9edf9] p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                                <p className="text-sm font-semibold text-gray-500">Final Price</p>
                            <div className="mt-1 flex items-end gap-2">
                                    <h3 className="text-3xl font-extrabold text-gray-950">
                                    ₹{plan.finalPrice}
                                    </h3>
                                {hasDiscount && (
                                    <span className="mb-1 text-lg font-bold text-gray-500 line-through">
                                        ₹{plan.price}
                                    </span>
                                )}
                                </div>
                            {hasDiscount && (
                                    <p className="mt-2 inline-flex rounded-md bg-rose-100 px-2 text-xs font-extrabold text-rose-700">
                                    {plan.discountPercentage}% OFF
                                </p>
                            )}
                            </div>
                        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-500 text-white">
                            <Icon className="h-6 w-6" />
                        </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-bold text-gray-500">Validity</p>
                                <p className="mt-1 font-bold text-gray-950">
                                {formatDuration(plan.durationMonths)}
                            </p>
                            </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500">Status</p>
                                <p className="mt-1 font-bold capitalize text-emerald-700">
                                {plan.status}
                            </p>
                        </div>
                    </div>
                </div>
                    <div className="w-full max-w-md mt-3 flex flex-col gap-3 sm:flex-row">
                        <TextInput {...{ value: coupon, onChange: handleCoupon, placeholder: "Enter coupon code", className: "h-9" }} />
                        <SecondaryButton {...{
                            callBackFn: applyCouponFun, disabled: couponData?.couponCode, text: couponData?.couponCode ? "Applied" : couponLoading ? "Appling.." : "Apply",
                        }} />
                    </div>
                    {/* Benefits */}
                    {!plan.benefits[0]?.includes("NA") &&
                        <div className="mt-4">
                            <h3 className="text-base font-bold text-gray-950">Plan Benefits</h3>

                            <div className="mt-2 space-y-3">
                        {plan.benefits?.map((benefit, index) => (
                            <div key={index} className="flex items-start gap-x-3 pb-0 mb-2">
                                <CheckCircle2 className=" h-5 w-5 shrink-0 text-emerald-600" />
                                <p className="text-sm font-semibold text-gray-700 mb-0">
                                    {benefit}
                                </p>
                            </div>
                        ))}
                            </div>
                        </div>
                    }
                    <div className="mt-4">
                        <label
                            htmlFor="autopay"
                            className="flex cursor-pointer items-center justify-between rounded-md border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow-md">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Enable Auto Payment</p>
                                <p className="mt-1 text-xs text-gray-500">Bills will be paid automatically on the due date.</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="autopay"
                                    checked={autoPay}
                                    onChange={(e) => setAutoPay(e.target.checked)}
                                    className="peer sr-only"
                                />

                                {/* Toggle Background */}
                                <div className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-blue-600"></div>

                                {/* Toggle Circle */}
                                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:translate-x-5"></div>
                            </div>
                        </label>
                    </div>
                    <PrimaryButton {...{ callBackFn: handleSubscriptionPayment, text: (currentPlan?.current?.status == "active") ? "Change Plan" : "Subscribe", className: "w-full mt-3" }} />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Subscription;