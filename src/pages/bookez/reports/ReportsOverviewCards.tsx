import { IndianRupee, Users } from "lucide-react";

type ReportsOverviewCardsProps = {
    totalAmount?: number;
    customerCount?: number;
};

const ReportsOverviewCards = ({
    totalAmount = 0,
    customerCount = 0,
}: ReportsOverviewCardsProps) => {
    const cards = [
        {
            title: "Total Receivable Amount",
            value: `₹${Number(totalAmount || 0).toFixed(2)}`,
            icon: <IndianRupee size={20} />,
        },
        {
            title: "Total Customers",
            value: Number(customerCount || 0),
            icon: <Users size={20} />,
        },
    ];

    return (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {cards.map((card) => (
                <div
                    key={card.title}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                {card.title}
                            </p>

                            <h3 className="mt-1 text-xl font-bold text-slate-900">
                                {card.value}
                            </h3>
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReportsOverviewCards;