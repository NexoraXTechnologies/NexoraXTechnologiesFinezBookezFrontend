import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllPlans } from "../../redux/slices/professionalSlice/subscriptions";
import {
    Search,
    ChevronRight,
    CheckCircle2,
    X,
    Crown,
    Sparkles,
    ReceiptText,
} from "lucide-react";
import { PrimaryButton } from "../../components/buttons";

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

const getPlanLabel = (plan) => {
    const type = getPlanType(plan.name);
    if (type === "gold") return "GOLD PLAN";
    if (type === "silver") return "SILVER PLAN";
    if (type === "itr") return "ITR PLAN";
    return "SUBSCRIPTION PLAN";
};

const getCategoryMatch = (plan, selectedCategory) => {
    const name = plan.name.toLowerCase();
    if (selectedCategory === "All Plans") return true;
    if (selectedCategory === "Silver Plans") return name.includes("silver");
    if (selectedCategory === "Gold Plans") return name.includes("gold");
    if (selectedCategory === "ITR Plans") return name.includes("itr");
    if (selectedCategory === "Monthly Plans") return plan.durationMonths === 1;
    if (selectedCategory === "Yearly Plans") return plan.durationMonths === 12;
    return true;
};

const formatDuration = (months) => {
    if (months === 1) return "1 Month";
    if (months === 12) return "1 Year";
    return `${months} Months`;
};

const Subscription = () => {
    const dispatch = useDispatch();
    const { plans, pagination, loading } = useSelector((e: any) => e.plans);
    const [selectedCategory, setSelectedCategory] = useState("All Plans");
    const [search, setSearch] = useState("");
    const [selectedPlan, setSelectedPlan] = useState(null);
    const fetchAccounts = () => dispatch(getAllPlans({ offset: 0, limit: 100, search: "", }));

    const filteredPlans = useMemo(() => {
        const filter = plans?.filter((e) =>  e?.name == selectedCategory);
        console.log({ filter })
        return !!filter?.length ? filter : plans;
    }, [plans, search, selectedCategory]);
    console.log({ plans })
    useEffect(() => {
        fetchAccounts();
    }, []);

    return (
        <div className="min-h-screen bg-white p-4 md:p-8">
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
                />
            )}
        </div>
    )
}

const PlanCard = ({ plan, onClick }) => {
    const Icon = getPlanIcon(plan.name);
    const labelClass = getLabelClass(plan.name);
    const hasDiscount = Number(plan.discountPercentage) > 0 && Number(plan.finalPrice) < Number(plan.price);

    return (
        <div
            onClick={onClick}
            className="relative w-full rounded-md bg-[#e9edf9] p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
            {/* Label */}
            <div className="absolute -top-3 left-4">
                <span
                    className={`rounded-md px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${labelClass}`}
                >
                    {getPlanLabel(plan)}
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

            <PrimaryButton {...{ callBackFn: (e) => e.stopPropagation(), text: "Buy", className: "w-full mt-3" }} />
        </div>
    );
};

const PlanDetailsModal = ({ plan, onClose }) => {
    const Icon = getPlanIcon(plan.name);
    const labelClass = getLabelClass(plan.name);

    const hasDiscount =
        Number(plan.discountPercentage) > 0 &&
        Number(plan.finalPrice) < Number(plan.price);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <span
                            className={`inline-flex rounded-md px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${labelClass}`}
                        >
                            {getPlanLabel(plan)}
                        </span>

                        <h2 className="mt-3 text-2xl font-extrabold text-gray-950">
                            {plan.name}
                        </h2>

                        <p className="mt-1 text-sm font-medium text-gray-500">
                            {plan.description}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Price Box */}
                <div className="rounded-md bg-[#e9edf9] p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-gray-500">Final Price</p>

                            <div className="mt-1 flex items-end gap-2">
                                <h3 className="text-4xl font-extrabold text-gray-950">
                                    ₹{plan.finalPrice}
                                </h3>

                                {hasDiscount && (
                                    <span className="mb-1 text-lg font-bold text-gray-500 line-through">
                                        ₹{plan.price}
                                    </span>
                                )}
                            </div>

                            {hasDiscount && (
                                <p className="mt-2 inline-flex rounded-md bg-rose-100 px-2 py-1 text-xs font-extrabold text-rose-700">
                                    {plan.discountPercentage}% OFF
                                </p>
                            )}
                        </div>

                        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-500 text-white">
                            <Icon className="h-6 w-6" />
                        </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-bold text-gray-500">Validity</p>
                            <p className="mt-1 font-extrabold text-gray-950">
                                {formatDuration(plan.durationMonths)}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-gray-500">Status</p>
                            <p className="mt-1 font-extrabold capitalize text-emerald-700">
                                {plan.status}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Benefits */}
                <div className="mt-6">
                    <h3 className="text-base font-extrabold text-gray-950">
                        Plan Benefits
                    </h3>

                    <div className="mt-3 space-y-3">
                        {plan.benefits?.map((benefit, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                <p className="text-sm font-semibold text-gray-700">
                                    {benefit}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action */}
                <button
                    type="button"
                    className="mt-7 w-full rounded-md bg-blue-700 py-2 text-lg font-extrabold text-white transition hover:bg-blue-800 active:scale-[0.98]"
                >
                    Buy Plan
                </button>
            </div>
        </div>
    );
};

export default Subscription;