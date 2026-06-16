type SummaryItem = {
    label: string;
    value: string | number;
};

type AccountSummaryCardProps = {
    title: string;
    accountName: string;
    summaryItems: SummaryItem[];
    finalLabel?: string;
    finalValue?: string | number;
};

const AccountSummaryCard = ({
    title,
    accountName,
    summaryItems = [],
    finalLabel = "Remaining Balance",
    finalValue = 0,
}: AccountSummaryCardProps) => {

    // console.log(summaryItems)
    return (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 border-b border-slate-200 pb-2">
                <p className="text-sm font-bold text-slate-600">
                    {title || "Account"}
                </p>

                <h3 className=" text-xl font-extrabold text-slate-900">
                    {accountName || "-"}
                </h3>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
                {summaryItems.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between gap-4"
                    >
                        <p className="text-sm font-bold text-slate-700">
                            {item.label}
                        </p>

                        <p className="text-sm font-extrabold text-slate-900">
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-1 flex items-center justify-between gap-4">
                <p className="text-sm font-extrabold text-slate-700">
                    {finalLabel}
                </p>

                <p className="text-lg font-extrabold text-slate-900">
                    {finalValue}
                </p>
            </div>
        </div>
    );
};

export default AccountSummaryCard;