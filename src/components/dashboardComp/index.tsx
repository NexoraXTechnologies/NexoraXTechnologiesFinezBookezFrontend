import { ArrowUpRight } from "lucide-react";
import { formatMoney } from "../../utils/helperFunctions";
import { motion } from "framer-motion";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
} from "recharts";

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
        bg: "bg-primary/10",
        text: "text-primary",
        iconBg: "bg-primary/15",
        border: "border-primary/20",
        chart: "#7c3aed",
    },
    purchase: {
        bg: "bg-primary/10",
        text: "text-primary",
        iconBg: "bg-primary/15",
        border: "border-primary/20",
        chart: "#4f46e5",
    },
    receivable: {
        bg: "bg-success/10",
        text: "text-success",
        iconBg: "bg-success/15",
        border: "border-success/20",
        chart: "#06b6d4",
    },
    payable: {
        bg: "bg-danger/10",
        text: "text-danger",
        iconBg: "bg-danger/15",
        border: "border-danger/20",
        chart: "#e11d48",
    },
    neutral: {
        bg: "bg-muted",
        text: "text-muted-foreground",
        iconBg: "bg-secondary",
        border: "border-border",
        chart: "#64748b",
    },
};

const compactCardAnim = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: "easeOut" },
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
            // @ts-ignore
            variants={compactCardAnim}
            whileHover={{ y: -2 }}
            className={`overflow-hidden rounded-md border ${color.border} bg-card text-card-foreground shadow-sm ${className}`}
        >
            <div
                className={`flex items-center justify-between border-b border-border px-3.5 py-2.5 ${color.bg}`}
            >
                <h3 className={`text-sm font-black ${color.text}`}>{title}</h3>
                {right}
            </div>

            <div className="p-3.5">{children}</div>
        </motion.div>
    );
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
            // @ts-ignore
            variants={compactCardAnim}
            whileHover={{ y: -3, scale: 1.01 }}
            className={`relative overflow-hidden rounded-md border ${color.border} ${color.bg} p-3.5 text-card-foreground shadow-sm`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className={`truncate text-xs font-black uppercase tracking-wide ${color.text}`}
                    >
                        {title}
                    </p>

                    <h2 className="mt-2 truncate text-xl font-black tracking-tight text-foreground">
                        {value}
                    </h2>

                    {subtitle && (
                        <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${color.iconBg} ${color.text}`}
                >
                    <Icon size={17} />
                </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
                <div
                    className={`inline-flex items-center gap-1 rounded-md bg-card/80 px-2 py-1 text-xs font-black ${color.text}`}
                >
                    <ArrowUpRight size={13} />
                    Live
                </div>

                <div className="h-10 w-20">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === "bar" ? (
                            // @ts-ignore
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
        <div className="rounded-md border border-border bg-card px-4 py-3 text-card-foreground shadow-xl">
            {label && (
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    {label}
                </p>
            )}

            {payload.map((item: any, index: number) => (
                <p key={index} className="text-xs font-bold text-card-foreground">
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
            className={`flex items-center justify-between rounded-md border ${color.border} ${color.bg} px-3 py-2.5 transition hover:bg-card`}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${color.iconBg} text-xs font-black ${color.text}`}
                >
                    {index + 1}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-black text-card-foreground">
                        {title || "-"}
                    </p>
                    <p className="truncate text-xs font-semibold text-muted-foreground">
                        {subtitle || "-"}
                    </p>
                </div>
            </div>

            <p className="shrink-0 pl-3 text-sm font-black text-foreground">
                {value}
            </p>
        </motion.div>
    );
};

export {
    CHART_COLORS,
    SOFT_COLORS,
    CompactWidgetCard,
    CompactKpiCard,
    CompactTooltip,
    CompactRankItem,
};