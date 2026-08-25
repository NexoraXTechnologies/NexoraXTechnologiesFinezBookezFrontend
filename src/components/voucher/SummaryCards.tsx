type SummaryItem = {
    label: string;
    value: string | number;
};

type SummaryCardsProps = {
    items?: SummaryItem[];
    isSummaryFooter?: boolean;
};

const SummaryCards = ({ items = [], isSummaryFooter = true }: SummaryCardsProps) => {
    if (!items.length) return null;

    return (
        isSummaryFooter ? <div className="mt-6 w-full rounded-md border border-border bg-card p-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between border-b border-border  px-5 py-1 text-sm font-semibold text-secondary-foreground"
                    >
                        <span>{item.label}</span>
                        <span>{item.value || "--"}</span>
                    </div>
                ))}
            </div>
        </div> : <></>
    );
};

export default SummaryCards;