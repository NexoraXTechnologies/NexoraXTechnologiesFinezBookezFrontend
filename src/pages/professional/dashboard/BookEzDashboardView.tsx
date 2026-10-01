import { motion } from "framer-motion";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Landmark, ReceiptText, ShoppingCart, Wallet } from "lucide-react";
import { formatMoney } from "../../../utils/helperFunctions";
import {
    CHART_COLORS,
    CompactKpiCard,
    CompactRankItem,
    CompactTooltip,
    CompactWidgetCard,
} from "../../../components/dashboardComp";
import {
    EmptyData,
    ModuleAreaTooltip,
    compactContainerAnim,
    formatNumber,
    pageAnimation,
    toNumber,
} from "./dashboardShared";
const BookEzDashboardView = ({ analytics }: { analytics: any }) => {
    const dashboardData = analytics || {};
    const sales = dashboardData?.sales || {};
    const purchase = dashboardData?.purchase || {};
    const finance = dashboardData?.finance || {};
    const receivable = dashboardData?.receivable || {};
    const payable = dashboardData?.payable || {};
    const bookAnalytics = dashboardData?.analytics || {};
    const salesInvoiceAmount = toNumber(sales?.totalInvoiceNetAmount);
    const salesOrderAmount = toNumber(sales?.totalOrdersNetAmount);
    const salesReturnAmount = toNumber(sales?.totalReturnsNetAmount);
    const purchaseOrderAmount = toNumber(purchase?.totalOrdersNetAmount);
    const purchaseInvoiceAmount = toNumber(purchase?.totalInvoiceNetAmount);
    const purchaseReturnAmount = toNumber(purchase?.totalReturnsNetAmount);
    const purchaseGrnAmount = toNumber(purchase?.totalGrnNetAmount);
    const receivableAmount = toNumber(receivable?.totalReceivableAmount);
    const payableAmount = toNumber(payable?.totalPayableAmount);
    const topCustomers = bookAnalytics?.topCustomers || [];
    const topVendors = bookAnalytics?.topVendors || [];
    const topSellingProducts = bookAnalytics?.topSellingProducts || [];
    const topPurchasingProducts = bookAnalytics?.topPurchasingProducts || [];
    const salesPurchaseData = [
        {
            month: "Orders",
            Sales: salesOrderAmount,
            Purchase: purchaseOrderAmount,
        },
        {
            month: "Invoice",
            Sales: salesInvoiceAmount,
            Purchase: purchaseInvoiceAmount,
        },
        {
            month: "Return",
            Sales: salesReturnAmount,
            Purchase: purchaseReturnAmount,
        },
        {
            month: "GRN",
            Sales: 0,
            Purchase: purchaseGrnAmount,
        },
    ].filter((item) => item.Sales > 0 || item.Purchase > 0);
    const amountPieData = [
        { name: "Sales Invoice", value: salesInvoiceAmount },
        { name: "Sales Return", value: salesReturnAmount },
        { name: "Purchase Invoice", value: purchaseInvoiceAmount },
        { name: "Purchase Return", value: purchaseReturnAmount },
    ].filter((item) => item.value > 0);
    const revenueTotal = salesInvoiceAmount;
    // const revenueTotal = amountPieData.reduce((sum, item) => sum + Number(item.value || 0), 0);
    // const revenueTotal = amountPieData.reduce(
    //  (sum, item) => sum + Number(item.value || 0),
    //  0
    // );
    const revenueChartData = amountPieData.map((item, index) => {
        const percent =
            revenueTotal > 0
                ? Math.round((Number(item.value || 0) / revenueTotal) * 100)
                : 0;
        return {
            ...item,
            percent,
            color: CHART_COLORS[index % CHART_COLORS.length],
        };
    });
    const transactionCountData = [
        {
            name: "Sales Orders",
            value: toNumber(sales?.totalOrders),
        },
        {
            name: "Sales Invoice",
            value: toNumber(sales?.totalInvoices),
        },
        {
            name: "Sales Return",
            value: toNumber(sales?.totalReturns),
        },
        {
            name: "Purchase Orders",
            value: toNumber(purchase?.totalOrders),
        },
        {
            name: "Purchase Invoice",
            value: toNumber(purchase?.totalInvoices),
        },
        {
            name: "Purchase Return",
            value: toNumber(purchase?.totalReturns),
        },
        {
            name: "GRN",
            value: toNumber(purchase?.totalGrns),
        },
        {
            name: "Receipts",
            value: toNumber(finance?.totalReceipt),
        },
        {
            name: "Payments",
            value: toNumber(finance?.totalPayment),
        },
    ].filter((item) => item.value > 0);
    const totalTransactionCount = transactionCountData.reduce(
        (sum: number, item: any) => sum + Number(item.value || 0),
        0
    );
    const moduleAreaChartData = transactionCountData.map((item: any) => ({
        name: item.name,
        value: Number(item.value || 0),
    }));
    const highestModule = moduleAreaChartData.reduce(
        (max: any, item: any) => {
            return item.value > max.value ? item : max;
        },
        { name: "-", value: 0 }
    );
    const outstandingTotal = receivableAmount + payableAmount;
    const balanceScore = outstandingTotal > 0 ? Math.round((receivableAmount / outstandingTotal) * 100) : 0;
    return (
        <motion.div
            key="bookez-dashboard"
            variants={pageAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5"
        >
            {/* KPI Cards */}
            <motion.div
                variants={compactContainerAnim}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
                <CompactKpiCard
                    title="Sales Invoice"
                    value={formatMoney(salesInvoiceAmount)}
                    subtitle={`${formatNumber(sales?.totalInvoices)} invoices`}
                    icon={ReceiptText}
                    chartType="bar"
                    accent="sales"
                />
                <CompactKpiCard
                    title="Sales Orders"
                    value={formatMoney(salesOrderAmount)}
                    subtitle={`${formatNumber(sales?.totalOrders)} orders`}
                    icon={ShoppingCart}
                    chartType="line"
                    accent="sales"
                />
                <CompactKpiCard
                    title="Receivable"
                    value={formatMoney(receivableAmount)}
                    subtitle={`${formatNumber(
                        receivable?.totalSalesInvoiceCount
                    )} pending invoices`}
                    icon={Wallet}
                    chartType="donut"
                    accent="receivable"
                />
                <CompactKpiCard
                    title="Payable"
                    value={formatMoney(payableAmount)}
                    subtitle="Vendor outstanding"
                    icon={Landmark}
                    chartType="bar"
                    accent="payable"
                />
            </motion.div>
            {/* Main Chart Row */}
            <motion.div
                variants={compactContainerAnim}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4 xl:grid-cols-4"
            >
                <CompactWidgetCard
                    title="Balance Position"
                    className="xl:col-span-1"
                    accent="sales"
                    right={
                        <>
                            {/* <span className="rounded-md bg-card px-2 py-1 text-xs font-black text-primary">
                                API Data
                            </span> */}
                        </>
                    }
                >
                    <div className="flex flex-col items-center">
                        <div className="h-[170px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="75%"
                                    outerRadius="100%"
                                    data={[
                                        {
                                            name: "Receivable Share",
                                            value: balanceScore,
                                            fill: "#f97316",
                                        },
                                    ]}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <RadialBar dataKey="value" cornerRadius={12} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="-mt-20 text-center">
                            <h2 className="text-3xl font-black text-foreground">
                                {balanceScore}%
                            </h2>
                            <p className="text-xs font-semibold text-muted-foreground">
                                Receivable Share
                            </p>
                        </div>
                        <div className="mt-12 border-t border-border pt-3 text-center">
                            <p className="text-sm font-black text-card-foreground">
                                Outstanding position
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                Receivable and payable based on data.
                            </p>
                        </div>
                    </div>
                </CompactWidgetCard>
                <CompactWidgetCard
                    title="Sales vs Purchase"
                    className="xl:col-span-3"
                    accent="purchase"
                    right={
                        <span className="rounded-md bg-card px-2 py-1 text-xs font-black text-primary">
                            Amount
                        </span>
                    }
                >
                    {salesPurchaseData.length === 0 ? (
                        <EmptyData text="No sales/purchase data available" />
                    ) : (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesPurchaseData} barGap={8}>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                        tickFormatter={(value) =>
                                            Number(value) >= 100000
                                                ? `${Math.round(Number(value) / 100000)}L`
                                                : value
                                        }
                                    />
                                    <Tooltip content={<CompactTooltip />} />
                                    <Bar
                                        dataKey="Sales"
                                        fill="#f97316"
                                        radius={[10, 10, 10, 10]}
                                        maxBarSize={42}
                                    />
                                    <Bar
                                        dataKey="Purchase"
                                        fill="#2563eb"
                                        radius={[10, 10, 10, 10]}
                                        maxBarSize={42}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CompactWidgetCard>
            </motion.div>
            {/* Middle Row */}
            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
                <CompactWidgetCard
                    title="Module Activity"
                    className="min-w-0 overflow-hidden xl:col-span-2"
                    accent="sales"
                    right={
                        <>
                            {/* <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                            API Data
                        </span> */}
                        </>
                    }
                >
                    {!moduleAreaChartData.length ? (
                        <EmptyData text="No transaction data available" />
                    ) : (
                        <div className="relative min-w-0 overflow-hidden rounded-2xl bg-card px-3 pb-2">
                            <div className="mb-2 flex flex-col gap-1 px-2">
                                <p className="text-xs font-bold text-muted-foreground">
                                    Total module transactions
                                </p>
                                <div className="flex items-end justify-between gap-3">
                                    <h2 className="text-4xl font-black tracking-tight text-foreground">
                                        {formatNumber(totalTransactionCount)}
                                    </h2>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-muted-foreground">
                                            Top module
                                        </p>
                                        <p className="text-sm font-black text-primary">
                                            {highestModule.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[220px] min-w-0 overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={moduleAreaChartData}
                                        margin={{
                                            top: 30,
                                            right: 35,
                                            left: 35,
                                            bottom: 18,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="moduleAreaFill"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop offset="0%" stopColor="#c084fc" stopOpacity={0.28} />
                                                <stop offset="55%" stopColor="#f5d0fe" stopOpacity={0.14} />
                                                <stop offset="100%" stopColor="var(--card)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            stroke="var(--border)"
                                            strokeDasharray="0"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            interval={0}
                                            height={42}
                                            tickMargin={12}
                                            padding={{
                                                left: 25,
                                                right: 25,
                                            }}
                                            tick={{
                                                fontSize: 11,
                                                fill: "var(--muted-foreground)",
                                                fontWeight: 700,
                                            }}
                                            tickFormatter={(value) => {
                                                const text = String(value || "");
                                                if (text === "Sales Orders") return "Sales";
                                                if (text === "Sales Invoice") return "S.Inv";
                                                if (text === "Sales Return") return "S.Ret";
                                                if (text === "Purchase Orders") return "P.Ord";
                                                if (text === "Purchase Invoice") return "P.Inv";
                                                if (text === "Purchase Return") return "P.Ret";
                                                if (text === "Receipts") return "Receipt";
                                                if (text === "Payment") return "Pay.";
                                                return text.length > 8 ? `${text.slice(0, 8)}...` : text;
                                            }}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{
                                                stroke: "var(--border)",
                                                strokeWidth: 1,
                                            }}
                                            content={<ModuleAreaTooltip />}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#c084fc"
                                            strokeWidth={5}
                                            fill="url(#moduleAreaFill)"
                                            dot={{
                                                r: 4,
                                                fill: "var(--card)",
                                                stroke: "#c084fc",
                                                strokeWidth: 3,
                                            }}
                                            activeDot={{
                                                r: 8,
                                                fill: "var(--card)",
                                                stroke: "#c084fc",
                                                strokeWidth: 4,
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </CompactWidgetCard>
                <CompactWidgetCard
                    title="Revenue Source Distribution"
                    accent="purchase"
                    right={
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                            {formatMoney(revenueTotal)}
                        </span>
                    }
                >
                    {revenueChartData.length === 0 ? (
                        <EmptyData text="No revenue data available" />
                    ) : (
                        <div className="space-y-4">
                            {/* Donut Chart */}
                            <div className="relative h-[230px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <defs>
                                            {revenueChartData.map((item, index) => (
                                                <linearGradient
                                                    key={item.name}
                                                    id={`revenueGradient-${index}`}
                                                    x1="0"
                                                    y1="0"
                                                    x2="1"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor={item.color}
                                                        stopOpacity={0.95}
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor={item.color}
                                                        stopOpacity={0.65}
                                                    />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <Pie
                                            data={revenueChartData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={78}
                                            outerRadius={100}
                                            paddingAngle={6}
                                            stroke="var(--card)"
                                            strokeWidth={5}
                                        >
                                            {revenueChartData.map((item, index) => (
                                                <Cell
                                                    key={item.name}
                                                    fill={`url(#revenueGradient-${index})`}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CompactTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        Total
                                    </p>
                                    <p className="mt-1 max-w-[145px] whitespace-nowrap text-[15px] font-black leading-tight text-foreground">
                                        {formatMoney(revenueTotal)}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold text-muted-foreground">
                                        Revenue mix
                                    </p>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="space-y-2">
                                {revenueChartData.map((item) => (
                                    <div
                                        key={item.name}
                                        className="rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span className="h-3 w-3 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: item.color, }}
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-black text-card-foreground">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs font-bold text-muted-foreground">
                                                        {item.percent}% of total
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="shrink-0 text-sm font-black text-foreground">
                                                {formatMoney(item.value)}
                                            </p>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${item.percent}%`,
                                                    backgroundColor: item.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CompactWidgetCard>
            </div>
            {/* Ranked Widgets */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <CompactWidgetCard title="Top Customers" accent="receivable">
                    <div className="space-y-2">
                        {topCustomers.length === 0 && <EmptyData />}
                        {topCustomers.map((item: any, index: number) => (
                            <CompactRankItem
                                key={index}
                                index={index}
                                title={item?.customerName}
                                subtitle={item?.customerCode}
                                value={formatMoney(item?.totalRevenue)}
                                accent="receivable"
                            />
                        ))}
                    </div>
                </CompactWidgetCard>
                <CompactWidgetCard title="Top Vendors" accent="payable">
                    <div className="space-y-2">
                        {topVendors.length === 0 && <EmptyData />}
                        {topVendors.map((item: any, index: number) => (
                            <CompactRankItem
                                key={index}
                                index={index}
                                title={item?.vendorName}
                                subtitle={item?.vendorCode}
                                value={formatMoney(item?.totalPurchase)}
                                accent="payable"
                            />
                        ))}
                    </div>
                </CompactWidgetCard>
                <CompactWidgetCard title="Top Selling" accent="sales">
                    <div className="space-y-2">
                        {topSellingProducts.length === 0 && <EmptyData />}
                        {topSellingProducts.map((item: any, index: number) => (
                            <CompactRankItem
                                key={index}
                                index={index}
                                title={item?.productName}
                                subtitle={`${item?.productCode || "-"} • Qty ${formatNumber(
                                    item?.totalSoldQty
                                )}`}
                                value={formatMoney(item?.totalRevenue)}
                                accent="sales"
                            />
                        ))}
                    </div>
                </CompactWidgetCard>
                <CompactWidgetCard title="Top Purchasing" accent="purchase">
                    <div className="space-y-2">
                        {topPurchasingProducts.length === 0 && <EmptyData />}
                        {topPurchasingProducts.map((item: any, index: number) => (
                            <CompactRankItem
                                key={index}
                                index={index}
                                title={item?.productName}
                                subtitle={`${item?.productCode || "-"} • Qty ${formatNumber(
                                    item?.totalPurchasedQty
                                )}`}
                                value={formatMoney(item?.totalPurchaseAmount)}
                                accent="purchase"
                            />
                        ))}
                    </div>
                </CompactWidgetCard>
            </div>
        </motion.div>
    );
};
export default BookEzDashboardView;
