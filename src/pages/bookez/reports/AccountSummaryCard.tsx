import { formatProductType } from "../../../utils/helperFunctions";

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
        <div className="w-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
            <div className="mb-1 flex justify-between border-b border-border pb-1">
                <p className="text-sm font-bold text-muted-foreground">
                    {title || "Account"}
                </p>

                <h3 className="text-md font-bold text-card-foreground">
                    {formatProductType(accountName) || "-"}
                </h3>
            </div>

            <div className="flex flex-col gap-3 border-b border-border pb-1">
                {summaryItems.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between gap-4"
                    >
                        <p className="text-sm font-bold text-muted-foreground">
                            {item.label}
                        </p>

                        <p className="text-sm font-bold text-card-foreground">
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-1 flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-muted-foreground">
                    {finalLabel}
                </p>

                <p className="text-md font-bold text-card-foreground">
                    {finalValue}
                </p>
            </div>
        </div>
    );
};

export default AccountSummaryCard;