import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
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
import {
	Building2,
	FileText,
	Landmark,
	ReceiptText,
	ShoppingCart,
	Wallet,
} from "lucide-react";

import {
	fetchProfessionalDashboardAnalytics,
	fetchTransportDashboardAnalytics,
} from "../../redux/slices/professionalSlice/dashboard/professionalDashboardSlice";

import AiTaxCopilotDrawer from "./AiChat/AiTaxCopilotDrawer";
import AiChatBox from "./AiChat/AiChatBox";
import ProQuickLinks from "../../components/professionalDashboard/ProQuickLinks";
import ProStatDonutChart from "../../components/professionalDashboard/ProStatDonutChart";
import ProDashboardCart from "../../components/professionalDashboard/ProDashboardCard";
import { formatMoney } from "../../utils/helperFunctions";
import {
	CHART_COLORS,
	CompactKpiCard,
	CompactRankItem,
	CompactTooltip,
	CompactWidgetCard,
} from "../../components/dashboardComp";

type TabType = "taxez" | "bookez";

const formatNumber = (value: any) => {
	const num = Number(value || 0);
	return new Intl.NumberFormat("en-IN").format(num);
};

const toNumber = (value: any) => Number(value || 0);

const safeJsonParse = (value: any) => {
	try {
		if (!value) return null;
		if (typeof value === "string") return JSON.parse(value);
		return value;
	} catch {
		return null;
	}
};

const getSavedPermissions = () => {
	const keys = ["permissions", "permissionData", "bookezPermissions"];

	for (const key of keys) {
		const saved = localStorage.getItem(key);
		const parsed = safeJsonParse(saved);

		if (parsed) return parsed;
	}

	return {};
};

const hasAnyViewPermission = (obj: any): boolean => {
	if (!obj || typeof obj !== "object") return false;

	return Object.values(obj).some((value: any) => {
		if (!value || typeof value !== "object") return false;

		if (value?.view === true) return true;

		return hasAnyViewPermission(value);
	});
};

const findBookEzPermissionObject = (permissions: any): any => {
	const parsed = safeJsonParse(permissions);

	if (!parsed || typeof parsed !== "object") return null;

	if (parsed?.enabled === true && parsed?.permissions) {
		return parsed;
	}

	const possibleBookEz =
		parsed?.bookez ||
		parsed?.bookEz ||
		parsed?.bookEZ ||
		parsed?.BookEz ||
		parsed?.data?.bookez ||
		parsed?.data?.bookEz ||
		parsed?.permissions?.bookez ||
		parsed?.permissions?.bookEz;

	if (possibleBookEz) {
		return safeJsonParse(possibleBookEz);
	}

	if (parsed?.data) {
		const found = findBookEzPermissionObject(parsed.data);
		if (found) return found;
	}

	return null;
};

const findTaxEzPermissionObject = (permissions: any): any => {
	const parsed = safeJsonParse(permissions);

	if (!parsed || typeof parsed !== "object") return null;

	const possibleTaxEz =
		parsed?.taxez ||
		parsed?.taxEz ||
		parsed?.taxEZ ||
		parsed?.TaxEz ||
		parsed?.incomeTax ||
		parsed?.incometax ||
		parsed?.tax ||
		parsed?.data?.taxez ||
		parsed?.data?.taxEz ||
		parsed?.permissions?.taxez ||
		parsed?.permissions?.taxEz;

	if (possibleTaxEz) {
		return safeJsonParse(possibleTaxEz);
	}

	if (parsed?.data) {
		const found = findTaxEzPermissionObject(parsed.data);
		if (found) return found;
	}

	return null;
};

const isBookEzPermission = (permissions: any) => {
	const bookez = findBookEzPermissionObject(permissions);

	if (!bookez) return false;
	if (bookez?.enabled !== true) return false;

	return hasAnyViewPermission(bookez?.permissions);
};

const isTaxEzPermission = (permissions: any) => {
	const taxez = findTaxEzPermissionObject(permissions);

	if (!taxez) return false;
	if (taxez === true) return true;

	if (taxez?.enabled === true) {
		if (!taxez?.permissions) return true;
		return hasAnyViewPermission(taxez.permissions);
	}

	return hasAnyViewPermission(taxez?.permissions || taxez);
};

const pageAnimation: any = {
	hidden: {
		opacity: 0,
		y: 14,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.35,
			ease: "easeOut",
		},
	},
	exit: {
		opacity: 0,
		y: -14,
		transition: {
			duration: 0.2,
		},
	},
};

const compactContainerAnim: any = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.06,
		},
	},
};

const EmptyData = ({ text = "No data available" }: { text?: string }) => {
	return (
		<div className="rounded-md bg-muted p-4 text-center text-xs font-bold text-muted-foreground">
			{text}
		</div>
	);
};

const ModuleAreaTooltip = ({ active, payload, label }: any) => {
	if (!active || !payload?.length) return null;

	return (
		<div className="rounded-xl bg-card px-4 py-3 text-card-foreground shadow-xl ring-1 ring-border">
			<p className="text-xs font-semibold text-muted-foreground">{label}</p>
			<p className="mt-1 text-xl font-black text-foreground">
				{formatNumber(payload?.[0]?.value)}
			</p>
		</div>
	);
};

const TaxEzDashboardView = ({ analytics }: { analytics: any }) => {
	const cards = useMemo(() => {
		return [
			{
				title: "Total Taxpayers",
				value: analytics?.incomeTax?.totalTaxPayers ?? 0,
				stats: {
					active: analytics?.incomeTax?.active ?? 0,
					inactive: analytics?.incomeTax?.inactive ?? 0,
				},
				color: "bg-primary/10",
				delay: 0.05,
				icon: "👤",
			},
			{
				title: "ITR",
				value:
					(analytics?.itr?.filedSuccessfully ?? 0) +
					(analytics?.itr?.draft ?? 0),
				stats: {
					filed: analytics?.itr?.filedSuccessfully ?? 0,
					draft: analytics?.itr?.draft ?? 0,
				},
				color: "bg-primary/10",
				delay: 0.1,
				icon: "📄",
			},
			{
				title: "Tasks",
				value: analytics?.tasks?.total ?? 0,
				stats: {
					inProgress: analytics?.tasks?.inProgress ?? 0,
					partial: analytics?.tasks?.partiallyCompleted ?? 0,
					completed: analytics?.tasks?.completed ?? 0,
				},
				color: "bg-success/10",
				delay: 0.15,
				icon: "✅",
			},
			{
				title: "Documents",
				value: analytics?.documents?.total ?? 0,
				stats: {
					active: analytics?.documents?.active ?? 0,
					deleted: analytics?.documents?.deleted ?? 0,
				},
				color: "bg-muted",
				delay: 0.2,
				icon: "📁",
			},
			{
				title: "Employees",
				value: analytics?.employees?.total ?? 0,
				stats: {
					active: analytics?.employees?.active ?? 0,
					inactive: analytics?.employees?.inactive ?? 0,
				},
				color: "bg-primary/10",
				delay: 0.25,
				icon: "👥",
			},
			{
				title: "Masters",
				value:
					(analytics?.accountMaster?.total ?? 0) +
					(analytics?.productMaster?.total ?? 0),
				stats: {
					accounts: analytics?.accountMaster?.total ?? 0,
					products: analytics?.productMaster?.total ?? 0,
				},
				color: "bg-muted",
				delay: 0.3,
				icon: "📦",
			},
		];
	}, [analytics]);

	const taskDonut = useMemo(() => {
		const t = analytics?.tasks || {};

		return [
			{ name: "In Progress", value: t.inProgress ?? 0 },
			{ name: "Partial", value: t.partiallyCompleted ?? 0 },
			{ name: "Completed", value: t.completed ?? 0 },
		];
	}, [analytics]);

	const itrDonut = useMemo(() => {
		const i = analytics?.itr || {};

		return [
			{ name: "Filed", value: i.filedSuccessfully ?? 0 },
			{ name: "Draft", value: i.draft ?? 0 },
		];
	}, [analytics]);

	const taxpayerDonut = useMemo(() => {
		const it = analytics?.incomeTax || {};

		return [
			{ name: "Active", value: it.active ?? 0 },
			{ name: "Inactive", value: it.inactive ?? 0 },
		];
	}, [analytics]);

	return (
		<motion.div
			key="taxez-dashboard"
			variants={pageAnimation}
			initial="hidden"
			animate="visible"
			exit="exit"
		>
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">TaxEz Dashboard</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Filing overview, compliance status, and workload summary.
					</p>
				</div>

				<ProQuickLinks
					links={[
						{
							label: "Add Taxpayer",
							to: "/professional/incometax/addtaxpayer",
						},
						{
							label: "File ITR",
							to: "/professional/incometax/fileitrlist",
						},
						{
							label: "Add Team/Employee",
							to: "/professional/users",
						},
					]}
				/>
			</div>

			<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{cards.map((c) => (
					<ProDashboardCart key={c.title} {...c} />
				))}
			</div>

			<div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
				<ProStatDonutChart title="Tasks Status" items={taskDonut} />
				<ProStatDonutChart title="ITR Status" items={itrDonut} />
				<ProStatDonutChart title="Taxpayer Status" items={taxpayerDonut} />
			</div>
		</motion.div>
	);
};

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
	// 	(sum, item) => sum + Number(item.value || 0),
	// 	0
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
													<stop offset="0%" stopColor={item.color} stopOpacity={0.95} />
													<stop offset="100%" stopColor={item.color} stopOpacity={0.65} />
												</linearGradient>
											))}
										</defs>

										<Pie
											data={revenueChartData}
											dataKey="value"
											nameKey="name"
											cx="50%"
											cy="50%"
											innerRadius={68}
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
								<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
									<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
										Total
									</p>

									<p className="mt-1 text-xl font-black text-foreground">
										{formatMoney(revenueTotal)}
									</p>

									<p className="mt-1 text-[11px] font-bold text-muted-foreground">
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
												<span
													className="h-3 w-3 shrink-0 rounded-full shadow-sm"
													style={{ backgroundColor: item.color }}
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


/* ===================================================
   TRANSPORT ANALYTICS VIEW - ADDED ONLY
=================================================== */

const TransportAnalyticsView = ({
	analytics,
	loading,
	error,
}: {
	analytics: any;
	loading: boolean;
	error: any;
}) => {
	const data = analytics || {};
	const vehicles = data?.vehicles || {};
	const transportOrder = data?.transportOrder || {};
	const tripAllocation = data?.tripAllocation || {};
	const vehicleMaintenance = data?.vehicleMaintenance || {};
	const driverSettlement = data?.driverSettlement || {};
	const ewayBill = data?.ewaybill || data?.ewayBill || {};

	const ownedList = vehicles?.ownedList || [];
	const marketList = vehicles?.marketList || [];
	const transportOrderList = transportOrder?.list || [];
	const tripAllocationList = tripAllocation?.list || [];
	const driverSettlementList = driverSettlement?.list || [];
	const ewayBillList = ewayBill?.list || [];

	const totalOwned = toNumber(vehicles?.totalOwned);
	const totalMarket = toNumber(vehicles?.totalMarket);
	const totalVehicles = totalOwned + totalMarket;
	const totalOrders = toNumber(transportOrder?.total);
	const totalTrips = toNumber(tripAllocation?.total);
	const pendingTrips = toNumber(tripAllocation?.pending);
	const totalSettlements = toNumber(driverSettlement?.total);
	const pendingSettlements = toNumber(driverSettlement?.pending);
	const totalEwayBills = toNumber(ewayBill?.total);

	const expectedFreight = transportOrderList.reduce(
		(sum: number, item: any) => sum + toNumber(item?.expectedFreight),
		0
	);

	const fleetData = [
		{ name: "Owned", value: totalOwned },
		{ name: "Market", value: totalMarket },
	].filter((item) => item.value > 0);

	const activityData = [
		{ name: "Orders", value: totalOrders },
		{ name: "Trips", value: totalTrips },
		{ name: "Settlements", value: totalSettlements },
		{ name: "E-Way Bills", value: totalEwayBills },
	];

	const [maintenanceFilter, setMaintenanceFilter] = useState<"all" | "overdue" | "dueSoon" | "upcoming">("all");
	const [maintenancePage, setMaintenancePage] = useState(1);
	const maintenancePageSize = 5;

	const maintenanceVehicleRows = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const buildDateDetail = (value: any) => {
			if (!value) return null;
			const dueDate = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
			if (Number.isNaN(dueDate.getTime())) return null;
			dueDate.setHours(0, 0, 0, 0);
			const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
			const dateLabel = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(dueDate);
			const status = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : daysLeft === 1 ? "Tomorrow" : daysLeft <= 30 ? `${daysLeft}d left` : "Valid";
			const tone = daysLeft < 0 ? "overdue" : daysLeft <= 30 ? "dueSoon" : "upcoming";
			return { dateLabel, daysLeft, status, tone };
		};

		const groupedVehicles = Object.values([...(vehicleMaintenance?.list || [])].reduce((acc: any, vehicle: any) => {
			const key = String(vehicle?.vehicleNumber || vehicle?.vehicleCode || vehicle?._id || "").trim();
			if (!key) return acc;
			if (!acc[key]) acc[key] = [];
			acc[key].push(vehicle);
			return acc;
		}, {})) as any[];

		return groupedVehicles.map((records: any[]) => {
			const sortedRecords = [...records].sort((a: any, b: any) => new Date(b?.modifiedOn || b?.createdOn || 0).getTime() - new Date(a?.modifiedOn || a?.createdOn || 0).getTime());
			const vehicle = sortedRecords[0] || {};
			const firstValue = (getter: (record: any) => any) => sortedRecords.map(getter).find((value: any) => value !== null && value !== undefined && value !== "");
			const details = {
				puc: buildDateDetail(firstValue((record: any) => record?.pucDetails?.expiryDate)),
				insurance: buildDateDetail(firstValue((record: any) => record?.insuranceDetails?.expiryDate)),
				passing: buildDateDetail(firstValue((record: any) => record?.passingDetails?.expiryDate)),
				fitness: buildDateDetail(firstValue((record: any) => record?.fitnessCertificateDetails?.expiryDate)),
				permit: buildDateDetail(firstValue((record: any) => record?.permitDetails?.expiryDate)),
				nextMaintenance: buildDateDetail(firstValue((record: any) => record?.nextMaintenance?.dueDate)),
			};
			const datedItems = Object.values(details).filter(Boolean) as any[];
			const overdueItems = datedItems.filter((item: any) => item.daysLeft < 0);
			const dueSoonItems = datedItems.filter((item: any) => item.daysLeft >= 0 && item.daysLeft <= 30);
			const upcomingItems = datedItems.filter((item: any) => item.daysLeft > 30);
			const category = overdueItems.length > 0 ? "overdue" : dueSoonItems.length > 0 ? "dueSoon" : "upcoming";
			const priorityDays = overdueItems.length > 0 ? Math.max(...overdueItems.map((item: any) => item.daysLeft)) : dueSoonItems.length > 0 ? Math.min(...dueSoonItems.map((item: any) => item.daysLeft)) : upcomingItems.length > 0 ? Math.min(...upcomingItems.map((item: any) => item.daysLeft)) : Number.MAX_SAFE_INTEGER;
			return { ...vehicle, maintenanceDetails: details, maintenanceCategory: category, maintenancePriorityDays: priorityDays, attention: overdueItems.length + dueSoonItems.length };
		}).sort((a: any, b: any) => {
			const rank: any = { overdue: 0, dueSoon: 1, upcoming: 2 };
			if (rank[a.maintenanceCategory] !== rank[b.maintenanceCategory]) return rank[a.maintenanceCategory] - rank[b.maintenanceCategory];
			if (a.maintenanceCategory === "overdue") return b.maintenancePriorityDays - a.maintenancePriorityDays;
			return a.maintenancePriorityDays - b.maintenancePriorityDays;
		});
	}, [vehicleMaintenance?.list]);

	const maintenanceCounts = useMemo(() => ({
		all: maintenanceVehicleRows.length,
		overdue: maintenanceVehicleRows.filter((item: any) => item.maintenanceCategory === "overdue").length,
		dueSoon: maintenanceVehicleRows.filter((item: any) => item.maintenanceCategory === "dueSoon").length,
		upcoming: maintenanceVehicleRows.filter((item: any) => item.maintenanceCategory === "upcoming").length,
		attention: maintenanceVehicleRows.filter((item: any) => item.attention > 0).length,
	}), [maintenanceVehicleRows]);

	const filteredMaintenanceData = useMemo(() => maintenanceVehicleRows.filter((item: any) => maintenanceFilter === "all" || item.maintenanceCategory === maintenanceFilter), [maintenanceVehicleRows, maintenanceFilter]);
	const maintenanceTotalPages = Math.max(1, Math.ceil(filteredMaintenanceData.length / maintenancePageSize));
	const filteredMaintenanceList = useMemo(() => {
		const start = (maintenancePage - 1) * maintenancePageSize;
		return filteredMaintenanceData.slice(start, start + maintenancePageSize);
	}, [filteredMaintenanceData, maintenancePage]);

	useEffect(() => { setMaintenancePage(1); }, [maintenanceFilter]);
	useEffect(() => { if (maintenancePage > maintenanceTotalPages) setMaintenancePage(maintenanceTotalPages); }, [maintenancePage, maintenanceTotalPages]);

	const renderMaintenanceDate = (detail: any) => {
		if (!detail) return <span className="text-muted-foreground">-</span>;
		const toneClass = detail.tone === "overdue" ? "text-danger" : detail.tone === "dueSoon" ? "text-orange-600" : "text-foreground";
		return <div className="whitespace-nowrap"><p className={`text-xs font-black ${toneClass}`}>{detail.dateLabel}</p>{detail.tone !== "upcoming" && <p className={`mt-0.5 text-[10px] font-bold ${toneClass}`}>{detail.status}</p>}</div>;
	};

	const hasActivityData = activityData.some((item) => item.value > 0);

	if (loading) {
		return (
			<div className="flex min-h-[420px] items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.94 }}
					animate={{ opacity: 1, scale: 1 }}
					className="rounded-2xl border border-border bg-card px-6 py-5 text-card-foreground shadow-sm"
				>
					<p className="text-sm font-bold text-muted-foreground">
						Loading transport analytics...
					</p>
				</motion.div>
			</div>
		);
	}

	if (error) {
		return <p className="mt-10 text-center text-danger">{error}</p>;
	}

	return (
		<motion.div
			key="transport-analytics"
			variants={pageAnimation}
			initial="hidden"
			animate="visible"
			exit="exit"
			className="space-y-5"
		>
			<motion.div
				variants={compactContainerAnim}
				initial="hidden"
				animate="visible"
				className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
			>
				<CompactKpiCard
					title="Total Vehicles"
					value={totalVehicles > 0 ? formatNumber(totalVehicles) : "No data found"}
					subtitle={
						totalVehicles > 0
							? `${formatNumber(totalOwned)} owned • ${formatNumber(totalMarket)} market`
							: "No vehicle data available"
					}
					icon={Building2}
					chartType="bar"
					accent="sales"
				/>

				<CompactKpiCard
					title="Transport Orders"
					value={totalOrders > 0 ? formatNumber(totalOrders) : "No data found"}
					subtitle={
						totalOrders > 0
							? `${formatMoney(expectedFreight)} expected freight`
							: "No transport orders available"
					}
					icon={ShoppingCart}
					chartType="line"
					accent="receivable"
				/>

				<CompactKpiCard
					title="Trip Allocation"
					value={totalTrips > 0 ? formatNumber(totalTrips) : "No data found"}
					subtitle={
						totalTrips > 0
							? `${formatNumber(pendingTrips)} pending`
							: "No trip allocation available"
					}
					icon={ReceiptText}
					chartType="donut"
					accent="purchase"
				/>

				<CompactKpiCard
					title="Driver Settlement"
					value={totalSettlements > 0 ? formatNumber(totalSettlements) : "No data found"}
					subtitle={
						totalSettlements > 0
							? `${formatNumber(pendingSettlements)} pending`
							: "No driver settlement available"
					}
					icon={Wallet}
					chartType="bar"
					accent="payable"
				/>
			</motion.div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<CompactWidgetCard title="Owned vs Market Vehicles" accent="sales">
					{fleetData.length === 0 ? (
						<EmptyData text="No vehicle data available" />
					) : (
						<div className="relative h-[250px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={fleetData}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										innerRadius={65}
										outerRadius={95}
										paddingAngle={6}
										stroke="var(--card)"
										strokeWidth={5}
									>
										{fleetData.map((item, index) => (
											<Cell
												key={item.name}
												fill={CHART_COLORS[index % CHART_COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip content={<CompactTooltip />} />
								</PieChart>
							</ResponsiveContainer>

							<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
								<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
									Vehicles
								</p>
								<p className="text-2xl font-black text-foreground">
									{formatNumber(totalVehicles)}
								</p>
							</div>
						</div>
					)}
				</CompactWidgetCard>

				<CompactWidgetCard
					title="Transport Activity"
					className="xl:col-span-2"
					accent="purchase"
				>
					{!hasActivityData ? (
						<EmptyData text="No transport activity found" />
					) : (
						<div className="h-[250px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={activityData} barGap={8}>
									<CartesianGrid strokeDasharray="4 4" vertical={false} />
									<XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
									<YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
									<Tooltip content={<CompactTooltip />} />
									<Bar dataKey="value" fill="#2563eb" radius={[10, 10, 10, 10]} maxBarSize={52} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					)}
				</CompactWidgetCard>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<CompactWidgetCard title="Vehicle Maintenance" className="xl:col-span-2" accent="sales" right={<span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-black text-primary">{formatNumber(maintenanceCounts.attention)} vehicles need attention</span>}>
					{maintenanceVehicleRows.length === 0 ? (
						<EmptyData text="No vehicle maintenance data found" />
					) : (
						<div className="space-y-3">
							<div className="flex flex-wrap gap-2">
								{[
									{ key: "all", label: `All ${maintenanceCounts.all}` },
									{ key: "overdue", label: `Overdue ${maintenanceCounts.overdue}` },
									{ key: "dueSoon", label: `Due Soon ${maintenanceCounts.dueSoon}` },
									{ key: "upcoming", label: `Upcoming ${maintenanceCounts.upcoming}` },
								].map((item: any) => (
									<button key={item.key} type="button" onClick={() => setMaintenanceFilter(item.key)} className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-black transition ${maintenanceFilter === item.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{item.label}</button>
								))}
							</div>

							{filteredMaintenanceList.length === 0 ? (
								<EmptyData text="No vehicles found" />
							) : (
								<div className="overflow-x-auto rounded-xl border border-border">
									<table className="w-full min-w-[900px] border-collapse text-left">
										<thead className="bg-muted/50">
											<tr className="border-b border-border">
												<th className="px-3 py-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">Vehicle</th>
												<th className="px-3 py-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">PUC</th>
												<th className="px-3 py-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">Insurance</th>
												<th className="px-3 py-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">Passing</th>
												<th className="px-3 py-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">Fitness</th>
												<th className="px-3 py-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">Permit</th>
												<th className="px-3 py-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">Next Maintenance</th>
											</tr>
										</thead>
										<tbody>
											{filteredMaintenanceList.map((item: any, index: number) => (
												<tr key={`${item?.maintenanceNumber || item?.vehicleNumber || "maintenance"}-${index}`} className="border-b border-border last:border-b-0 hover:bg-muted/30">
													<td className="px-3 py-2.5"><p className="whitespace-nowrap text-sm font-black text-foreground">{item?.vehicleNumber || "-"}</p>{item?.vehicleType && <p className="mt-0.5 text-[10px] font-bold text-muted-foreground">{item.vehicleType}</p>}</td>
													<td className="px-3 py-2.5">{renderMaintenanceDate(item?.maintenanceDetails?.puc)}</td>
													<td className="px-3 py-2.5">{renderMaintenanceDate(item?.maintenanceDetails?.insurance)}</td>
													<td className="px-3 py-2.5">{renderMaintenanceDate(item?.maintenanceDetails?.passing)}</td>
													<td className="px-3 py-2.5">{renderMaintenanceDate(item?.maintenanceDetails?.fitness)}</td>
													<td className="px-3 py-2.5">{renderMaintenanceDate(item?.maintenanceDetails?.permit)}</td>
													<td className="px-3 py-2.5">{renderMaintenanceDate(item?.maintenanceDetails?.nextMaintenance)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{filteredMaintenanceData.length > maintenancePageSize && (
								<div className="flex items-center justify-between border-t border-border pt-2">
									<p className="text-[11px] font-bold text-muted-foreground">{(maintenancePage - 1) * maintenancePageSize + 1}-{Math.min(maintenancePage * maintenancePageSize, filteredMaintenanceData.length)} of {filteredMaintenanceData.length} vehicles</p>
									<div className="flex items-center gap-2">
										<button type="button" disabled={maintenancePage === 1} onClick={() => setMaintenancePage((page) => Math.max(1, page - 1))} className="cursor-pointer rounded-md border border-border bg-card px-2.5 py-1 text-xs font-black text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
										<span className="text-[11px] font-black text-muted-foreground">{maintenancePage}/{maintenanceTotalPages}</span>
										<button type="button" disabled={maintenancePage === maintenanceTotalPages} onClick={() => setMaintenancePage((page) => Math.min(maintenanceTotalPages, page + 1))} className="cursor-pointer rounded-md border border-border bg-card px-2.5 py-1 text-xs font-black text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">Next</button>
									</div>
								</div>
							)}
						</div>
					)}
				</CompactWidgetCard>

				<CompactWidgetCard title="E-Way Bills" accent="payable">
					<div className="space-y-2">
						{ewayBillList.length === 0 && <EmptyData text="No E-Way Bills available" />}

						{ewayBillList.map((item: any, index: number) => (
							<CompactRankItem
								key={`${item?.ewayBillNumber || "eway"}-${index}`}
								index={index}
								title={item?.ewayBillNumber || "-"}
								subtitle="Valid Upto"
								value={item?.validUpto || "-"}
								accent="payable"
							/>
						))}
					</div>
				</CompactWidgetCard>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
				<CompactWidgetCard title="Owned Vehicles" accent="sales">
					<div className="space-y-2">
						{ownedList.length === 0 && <EmptyData text="No owned vehicles available" />}

						{ownedList.map((item: any, index: number) => (
							<CompactRankItem
								key={`${item?.vehicleNumber || "owned"}-${index}`}
								index={index}
								title={item?.vehicleNumber || "-"}
								subtitle="Owned Vehicle"
								value={item?.status || "-"}
								accent="sales"
							/>
						))}
					</div>
				</CompactWidgetCard>

				<CompactWidgetCard title="Market Vehicles" accent="purchase">
					<div className="space-y-2">
						{marketList.length === 0 && <EmptyData text="No market vehicles available" />}

						{marketList.map((item: any, index: number) => (
							<CompactRankItem
								key={`${item?.vehicleNumber || "market"}-${index}`}
								index={index}
								title={item?.vehicleNumber || "-"}
								subtitle="Market Vehicle"
								value={item?.status || "-"}
								accent="purchase"
							/>
						))}
					</div>
				</CompactWidgetCard>

				<CompactWidgetCard title="Transport Orders" accent="receivable">
					<div className="space-y-2">
						{transportOrderList.length === 0 && <EmptyData text="No transport orders available" />}

						{transportOrderList.map((item: any, index: number) => (
							<CompactRankItem
								key={`${item?.voucherNumber || "order"}-${index}`}
								index={index}
								title={item?.customerName || "-"}
								subtitle={item?.voucherNumber || "-"}
								value={formatMoney(item?.expectedFreight)}
								accent="receivable"
							/>
						))}
					</div>
				</CompactWidgetCard>

				<CompactWidgetCard title="Trip Allocation" accent="payable">
					<div className="space-y-2">
						{tripAllocationList.length === 0 && <EmptyData text="No trip allocations available" />}

						{tripAllocationList.map((item: any, index: number) => (
							<CompactRankItem
								key={`${item?.voucher || "trip"}-${index}`}
								index={index}
								title={item?.name || "-"}
								subtitle={item?.voucher || "-"}
								value={item?.status || "-"}
								accent="payable"
							/>
						))}
					</div>
				</CompactWidgetCard>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<CompactWidgetCard title="Driver Settlement" accent="sales">
					<div className="space-y-2">
						{driverSettlementList.length === 0 && <EmptyData text="No driver settlements available" />}

						{driverSettlementList.map((item: any, index: number) => (
							<CompactRankItem
								key={`${item?.voucherNumber || "settlement"}-${index}`}
								index={index}
								title={item?.driverName || "-"}
								subtitle={item?.voucherNumber || "-"}
								value={item?.status || "-"}
								accent="sales"
							/>
						))}
					</div>
				</CompactWidgetCard>

				<CompactWidgetCard title="Maintenance Summary" accent="purchase">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
							<p className="text-2xl font-black text-foreground">
								{formatNumber(vehicleMaintenance?.totalPuc)}
							</p>
							<p className="mt-1 text-xs font-bold text-muted-foreground">PUC</p>
						</div>

						<div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
							<p className="text-2xl font-black text-foreground">
								{formatNumber(vehicleMaintenance?.totalInsurance)}
							</p>
							<p className="mt-1 text-xs font-bold text-muted-foreground">Insurance</p>
						</div>

						<div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
							<p className="text-2xl font-black text-foreground">
								{formatNumber(vehicleMaintenance?.totalFitness)}
							</p>
							<p className="mt-1 text-xs font-bold text-muted-foreground">Fitness</p>
						</div>
					</div>
				</CompactWidgetCard>
			</div>
		</motion.div>
	);
};

const ProfessionalDashboard = () => {
	const dispatch = useDispatch();
	const location = useLocation();

	const [openChat, setOpenChat] = useState(false);
	const [activeTab, setActiveTab] = useState<TabType>("taxez");
	const [dashboardSection, setDashboardSection] = useState<"dashboard" | "analytics">("dashboard");

	const { analytics, bookEzAnalytics, loading, error } = useSelector(
		(s: any) => s.professionalDashboard
	);

	const { transportAnalytics, transportLoading, transportError } = useSelector(
		(s: any) => s.professionalDashboard
	);

	const permissionState = useMemo(() => {
		return safeJsonParse(localStorage.getItem("permissions")) || {};
	}, []);

	const permissions = useMemo(() => {
		const possiblePermissions = permissionState;

		const parsedPermission = safeJsonParse(possiblePermissions);

		if (parsedPermission && Object.keys(parsedPermission).length > 0) {
			return parsedPermission;
		}

		return getSavedPermissions();
	}, [permissionState]);

	const canShowTaxEz = useMemo(() => {
		return isTaxEzPermission(permissions);
	}, [permissions]);

	const canShowBookEz = useMemo(() => {
		return isBookEzPermission(permissions);
	}, [permissions]);

	const visibleTabs = useMemo(() => {
		const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [];

		if (canShowTaxEz && false) {
			tabs.push({
				key: "taxez",
				label: "TaxEz",
				icon: <FileText size={16} />,
			});
		}

		if (canShowBookEz) {
			tabs.push({
				key: "bookez",
				label: "BookEz",
				icon: <Building2 size={16} />,
			});
		}

		return tabs;
	}, [canShowTaxEz, canShowBookEz]);

	useEffect(() => {
		dispatch(fetchProfessionalDashboardAnalytics() as any);
	}, [dispatch, location.key]);

	useEffect(() => {
		if (dashboardSection === "analytics") {
			dispatch(fetchTransportDashboardAnalytics() as any);
		}
	}, [dashboardSection, dispatch, location.key]);

	useEffect(() => {
		if (visibleTabs.length > 0) {
			const exists = visibleTabs.some((tab) => tab.key === activeTab);

			if (!exists) {
				setActiveTab(visibleTabs[0].key);
			}
		}
	}, [visibleTabs, activeTab]);

	useEffect(() => {
		if (canShowBookEz && !canShowTaxEz) {
			setActiveTab("bookez");
		}

		if (canShowTaxEz && !canShowBookEz) {
			setActiveTab("taxez");
		}
	}, [canShowBookEz, canShowTaxEz]);

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<motion.div
					initial={{ opacity: 0, scale: 0.94 }}
					animate={{ opacity: 1, scale: 1 }}
					className="rounded-2xl border border-border bg-card px-6 py-5 text-card-foreground shadow-sm"
				>
					<p className="text-sm font-bold text-muted-foreground">
						Loading dashboard...
					</p>
				</motion.div>
			</div>
		);
	}

	if (error) {
		return <p className="mt-10 text-center text-danger">{error}</p>;
	}

	if (visibleTabs.length === 0 && false) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
				<div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-sm">
					<h2 className="text-lg font-bold text-card-foreground">
						No dashboard permission
					</h2>

					<p className="mt-2 text-sm font-medium text-muted-foreground">
						TaxEz and BookEz dashboard access is disabled for this user.
					</p>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.45 }}
			className="relative min-h-screen bg-background p-4 text-foreground md:p-6"
		>
			<div className="mb-5 inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
				<button
					type="button"
					onClick={() => setDashboardSection("dashboard")}
					className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition ${dashboardSection === "dashboard"
						? "bg-primary text-primary-foreground shadow-sm"
						: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
				>
					BookEZ
				</button>

				<button
					type="button"
					onClick={() => setDashboardSection("analytics")}
					className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition ${dashboardSection === "analytics"
						? "bg-primary text-primary-foreground shadow-sm"
						: "text-muted-foreground hover:bg-muted hover:text-foreground"
						}`}
				>
					TransportEZ
				</button>
			</div>

			{dashboardSection === "dashboard" && (
				<>
					<AnimatePresence mode="wait">
						{activeTab === "taxez" && canShowTaxEz && (
							<TaxEzDashboardView analytics={analytics} />
						)}

						{/* {activeTab === "bookez" && canShowBookEz && (
							<BookEzDashboardView analytics={bookEzAnalytics} />
						)} */}

						<BookEzDashboardView analytics={bookEzAnalytics} />
					</AnimatePresence>

					{activeTab === "taxez" && canShowTaxEz && (
						<>
							<div className="fixed bottom-8 right-6 z-50">
								<AiChatBox onClick={() => setOpenChat(true)} />
							</div>

							<AiTaxCopilotDrawer
								open={openChat}
								onClose={() => setOpenChat(false)}
							/>
						</>
					)}
				</>
			)}

			{dashboardSection === "analytics" && (
				<TransportAnalyticsView
					analytics={transportAnalytics}
					loading={transportLoading}
					error={transportError}
				/>
			)}
		</motion.div>
	);
};

export default ProfessionalDashboard;