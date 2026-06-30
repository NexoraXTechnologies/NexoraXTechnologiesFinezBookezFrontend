// import { IndianRupee, Users } from "lucide-react";

// type ReportsOverviewCardsProps = {
//     totalAmount?: number;
//     customerCount?: number;
// };

// const ReportsOverviewCards = ({
//     totalAmount = 0,
//     customerCount = 0,
// }: ReportsOverviewCardsProps) => {
//     const cards = [
//         {
//             title: "Total Receivable Amount",
//             value: `₹${Number(totalAmount || 0).toFixed(2)}`,
//             icon: <IndianRupee size={20} />,
//         },
//         {
//             title: "Total Customers",
//             value: Number(customerCount || 0),
//             icon: <Users size={20} />,
//         },
//     ];

//     return (
//         <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
//             {cards.map((card) => (
//                 <div
//                     key={card.title}
//                     className="rounded-xl border border-border bg-card p-4 shadow-sm"
//                 >
//                     <div className="flex items-center justify-between gap-4">
//                         <div>
//                             <p className="text-sm font-medium text-muted-foreground">
//                                 {card.title}
//                             </p>

//                             <h3 className="mt-1 text-xl font-bold text-card-foreground">
//                                 {card.value}
//                             </h3>
//                         </div>

//                         <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
//                             {card.icon}
//                         </div>
//                     </div>
//                 </div>
//             ))}
//         </div>
//     );
// };

// export default ReportsOverviewCards;

import { Download, FileSpreadsheet, Search } from "lucide-react";
import type { ReactNode } from "react";

type OverviewCard = {
    title: string;
    value: ReactNode;
    icon?: ReactNode;
};

type ReportsOverviewCardsProps = {
    cards?: OverviewCard[];
    search?: string;
    onSearchChange?: (value: string) => void;
    onDownloadPdf?: () => void;
    onDownloadExcel?: () => void;
    pdfLoading?: boolean;
    excelLoading?: boolean;
};

const ReportsOverviewCards = ({
    cards = [],
    search = "",
    onSearchChange,
    onDownloadPdf,
    onDownloadExcel,
    pdfLoading = false,
    excelLoading = false,
}: ReportsOverviewCardsProps) => {
    return (
        <div className="mb-4 flex w-full flex-col gap-3 xl:flex-row xl:items-center">
            {/* Dynamic Overview Cards */}
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="rounded-md border border-border bg-card px-3 py-1.5"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                {card.icon && (
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        {card.icon}
                                    </div>
                                )}

                                <p className="truncate font-semibold text-muted-foreground">
                                    {card.title}
                                </p>
                            </div>

                            <h3 className="shrink-0 truncate font-semibold text-card-foreground">
                                {card.value}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Export Buttons */}
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
                <div className="relative w-full sm:w-[260px]">
                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder="Search..."
                        className="h-10 w-full rounded-md border border-border bg-card pl-10 pr-3 text-sm font-medium text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <button
                    type="button"
                    onClick={onDownloadPdf}
                    disabled={pdfLoading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Download size={17} />
                    {pdfLoading ? "Loading..." : "PDF"}
                </button>

                <button
                    type="button"
                    onClick={onDownloadExcel}
                    disabled={excelLoading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FileSpreadsheet size={17} />
                    {excelLoading ? "Loading..." : "Excel"}
                </button>
            </div>
        </div>
    );
};

export default ReportsOverviewCards;