type SummaryItem = {
    label: string;
    value: string | number;
};

type SummaryCardsProps = {
    items?: SummaryItem[];
    footerTotals?: SummaryItem[];
};

const SummaryCards = ({ items = [], footerTotals }: SummaryCardsProps) => {
    if (!items.length) return null;
    console.log({ items, footerTotals })
    return (
        <div className="mt-6 w-full rounded-md border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-800"
                    >
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SummaryCards;