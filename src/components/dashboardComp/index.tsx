import { ArrowUpRight, BarChart } from "lucide-react";
import { formatMoney } from "../../utils/helperFunctions";
import { motion } from "framer-motion"
import { Area, AreaChart, Bar, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

// const CHART_COLORS = [
//     "#f97316", // orange
//     "#2563eb", // blue
//     "#16a34a", // green
//     "#dc2626", // red
//     "#7c3aed", // purple
//     "#0891b2", // cyan
// ];

// const SOFT_COLORS = {
//     sales: {
//         bg: "bg-orange-50",
//         text: "text-orange-700",
//         iconBg: "bg-orange-100",
//         border: "border-orange-100",
//         chart: "#f97316",
//     },
//     purchase: {
//         bg: "bg-blue-50",
//         text: "text-blue-700",
//         iconBg: "bg-blue-100",
//         border: "border-blue-100",
//         chart: "#2563eb",
//     },
//     receivable: {
//         bg: "bg-emerald-50",
//         text: "text-emerald-700",
//         iconBg: "bg-emerald-100",
//         border: "border-emerald-100",
//         chart: "#16a34a",
//     },
//     payable: {
//         bg: "bg-rose-50",
//         text: "text-rose-700",
//         iconBg: "bg-rose-100",
//         border: "border-rose-100",
//         chart: "#dc2626",
//     },
//     neutral: {
//         bg: "bg-slate-50",
//         text: "text-slate-700",
//         iconBg: "bg-slate-100",
//         border: "border-slate-100",
//         chart: "#64748b",
//     },
// };


// best
const CHART_COLORS = [
    "#7c3aed", // violet
    "#4f46e5", // indigo
    "#06b6d4", // cyan
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
];

const SOFT_COLORS = {
    sales: {
        bg: "bg-violet-50",
        text: "text-violet-700",
        iconBg: "bg-violet-100",
        border: "border-violet-100",
        chart: "#7c3aed",
    },
    purchase: {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        iconBg: "bg-indigo-100",
        border: "border-indigo-100",
        chart: "#4f46e5",
    },
    receivable: {
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        iconBg: "bg-cyan-100",
        border: "border-cyan-100",
        chart: "#06b6d4",
    },
    payable: {
        bg: "bg-rose-50",
        text: "text-rose-700",
        iconBg: "bg-rose-100",
        border: "border-rose-100",
        chart: "#e11d48",
    },
    neutral: {
        bg: "bg-slate-50",
        text: "text-slate-700",
        iconBg: "bg-slate-100",
        border: "border-slate-100",
        chart: "#64748b",
    },
};

const CompactWidgetCard = ({
    title,
    children,
    className = "",
    right,
    accent = "neutral",
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
    right?: React.ReactNode;
    accent?: "sales" | "purchase" | "receivable" | "payable" | "neutral";
}) => {
    const color = SOFT_COLORS[accent];

    return (
        <motion.div
            variants={compactCardAnim}
            whileHover={{ y: -2 }}
            className={`overflow-hidden rounded-md border ${color.border} bg-white shadow-sm ${className}`}
        >
            <div className={`flex items-center justify-between border-b border-gray-100 px-3.5 py-2.5 ${color.bg}`}>
                <h3 className={`text-sm font-black ${color.text}`}>{title}</h3>
                {right}
            </div>

            <div className="p-3.5">{children}</div>
        </motion.div>
    );
};

const compactCardAnim = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: "easeOut" },
    },
};

const CompactKpiCard = ({
    title,
    value,
    subtitle,
    icon,
    chartType = "bar",
    accent = "neutral",
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    chartType?: "bar" | "line" | "donut";
    accent?: "sales" | "purchase" | "receivable" | "payable" | "neutral";
}) => {
    const Icon = icon;
    const color = SOFT_COLORS[accent];

    const miniBarData = [
        { name: "1", value: 35 },
        { name: "2", value: 55 },
        { name: "3", value: 46 },
        { name: "4", value: 68 },
        { name: "5", value: 60 },
    ];

    const miniLineData = [
        { name: "1", value: 15 },
        { name: "2", value: 32 },
        { name: "3", value: 25 },
        { name: "4", value: 44 },
        { name: "5", value: 38 },
    ];

    const donutData = [{ name: "value", value: 72, fill: color.chart }];

    return (
        <motion.div
            variants={compactCardAnim}
            whileHover={{ y: -3, scale: 1.01 }}
            className={`relative overflow-hidden rounded-md border ${color.border} ${color.bg} p-3.5 shadow-sm`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className={`truncate text-xs font-black uppercase tracking-wide ${color.text}`}>
                        {title}
                    </p>

                    <h2 className="mt-2 truncate text-xl font-black tracking-tight text-gray-950">
                        {value}
                    </h2>

                    {subtitle && (
                        <p className="mt-1 truncate text-xs font-semibold text-gray-500">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${color.iconBg} ${color.text}`}>
                    <Icon size={17} />
                </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
                <div className={`inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-xs font-black ${color.text}`}>
                    <ArrowUpRight size={13} />
                    Live
                </div>

                <div className="h-10 w-20">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === "bar" ? (
                            <BarChart data={miniBarData}>
                                <Bar
                                    dataKey="value"
                                    fill={color.chart}
                                    radius={[5, 5, 5, 5]}
                                    maxBarSize={8}
                                />
                            </BarChart>
                        ) : chartType === "line" ? (
                            <AreaChart data={miniLineData}>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={color.chart}
                                    strokeWidth={2}
                                    fill={color.chart}
                                    fillOpacity={0.18}
                                />
                            </AreaChart>
                        ) : (
                            <RadialBarChart
                                innerRadius="70%"
                                outerRadius="100%"
                                data={donutData}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <RadialBar dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
    );
};

const CompactTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
        <div className="rounded-md border border-gray-200 bg-[#18181b] px-4 py-3 text-white shadow-xl">
            {label && (
                <p className="mb-1 text-xs font-semibold text-gray-300">{label}</p>
            )}

            {payload.map((item: any, index: number) => (
                <p key={index} className="text-xs font-bold">
                    {item.name}:{" "}
                    {typeof item.value === "number"
                        ? formatMoney(item.value)
                        : item.value}
                </p>
            ))}
        </div>
    );
};

const CompactRankItem = ({
    index,
    title,
    subtitle,
    value,
    accent = "sales",
}: {
    index: number;
    title: string;
    subtitle: string;
    value: string;
    accent?: "sales" | "purchase" | "receivable" | "payable" | "neutral";
}) => {
    const color = SOFT_COLORS[accent];

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between rounded-md border ${color.border} ${color.bg} px-3 py-2.5 transition hover:bg-white`}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${color.iconBg} text-xs font-black ${color.text}`}>
                    {index + 1}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-black text-gray-900">
                        {title || "-"}
                    </p>
                    <p className="truncate text-xs font-semibold text-gray-500">
                        {subtitle || "-"}
                    </p>
                </div>
            </div>

            <p className="shrink-0 pl-3 text-sm font-black text-gray-950">
                {value}
            </p>
        </motion.div>
    );
};
export { CHART_COLORS, SOFT_COLORS, CompactWidgetCard, CompactKpiCard, CompactTooltip, CompactRankItem }