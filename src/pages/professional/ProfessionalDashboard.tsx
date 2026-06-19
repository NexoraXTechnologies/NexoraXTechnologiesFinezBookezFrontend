import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
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

import { fetchProfessionalDashboardAnalytics } from "../../redux/slices/professionalSlice/dashboard/professionalDashboardSlice";

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

const TabButton = ({
	active,
	label,
	icon,
	onClick,
}: {
	active: boolean;
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
}) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`cursor-pointer relative flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-all duration-300 ${active
				? "text-white"
				: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
				}`}
		>
			{active && (
				<motion.span
					layoutId="dashboard-active-tab"
					className="absolute inset-0 rounded-md bg-slate-950 shadow-md"
					transition={{
						type: "spring",
						stiffness: 420,
						damping: 32,
					}}
				/>
			)}

			<span className="relative z-10">{icon}</span>
			<span className="relative z-10">{label}</span>
		</button>
	);
};

const EmptyData = ({ text = "No data available" }: { text?: string }) => {
	return (
		<div className="rounded-md bg-gray-50 p-4 text-center text-xs font-bold text-gray-500">
			{text}
		</div>
	);
};

const ModuleAreaTooltip = ({ active, payload, label }: any) => {
	if (!active || !payload?.length) return null;

	return (
		<div className="rounded-xl bg-[#18181b] px-4 py-3 text-white shadow-xl">
			<p className="text-xs font-semibold text-gray-300">{label}</p>
			<p className="mt-1 text-xl font-black">
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
				color: "bg-[#E6F4FF]",
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
				color: "bg-[#EEF2FF]",
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
				color: "bg-[#ECFDF3]",
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
				color: "bg-[#FFF7E6]",
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
				color: "bg-[#FCE7F3]",
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
				color: "bg-[#F3F4F6]",
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
					<h1 className="text-2xl font-bold text-gray-900">TaxEz Dashboard</h1>
					<p className="mt-1 text-sm text-gray-500">
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

	const revenueTotal = amountPieData.reduce(
		(sum, item) => sum + Number(item.value || 0),
		0
	);

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
						<span className="rounded-md bg-white px-2 py-1 text-xs font-black text-orange-600">
							API Data
						</span>
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
							<h2 className="text-3xl font-black text-gray-950">
								{balanceScore}%
							</h2>
							<p className="text-xs font-semibold text-gray-500">
								receivable share
							</p>
						</div>

						<div className="mt-12 border-t border-orange-100 pt-3 text-center">
							<p className="text-sm font-black text-gray-900">
								Outstanding position
							</p>
							<p className="mt-1 text-xs leading-5 text-gray-500">
								Receivable and payable based on API data.
							</p>
						</div>
					</div>
				</CompactWidgetCard>

				<CompactWidgetCard
					title="Sales vs Purchase"
					className="xl:col-span-3"
					accent="purchase"
					right={
						<span className="rounded-md bg-white px-2 py-1 text-xs font-black text-blue-600">
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
										tick={{ fontSize: 12, fill: "#6b7280" }}
									/>
									<YAxis
										axisLine={false}
										tickLine={false}
										tick={{ fontSize: 12, fill: "#6b7280" }}
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
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				<CompactWidgetCard
					title="Module Activity"
					className="xl:col-span-2"
					accent="sales"
					right={
						<span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
							API Data
						</span>
					}
				>
					{moduleAreaChartData.length === 0 ? (
						<EmptyData text="No transaction data available" />
					) : (
						<div className="relative overflow-hidden rounded-2xl bg-white px-1 pb-2">
							<div className="mb-2 flex flex-col gap-1 px-2">
								<p className="text-xs font-bold text-gray-500">
									Total module transactions
								</p>

								<div className="flex items-end justify-between gap-3">
									<h2 className="text-4xl font-black tracking-tight text-gray-950">
										{formatNumber(totalTransactionCount)}
									</h2>

									<div className="text-right">
										<p className="text-xs font-bold text-gray-400">Top module</p>
										<p className="text-sm font-black text-orange-600">
											{highestModule.name}
										</p>
									</div>
								</div>
							</div>

							<div className="h-[260px]">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart
										data={moduleAreaChartData}
										margin={{
											top: 30,
											right: 18,
											left: 8,
											bottom: 8,
										}}
									>
										<defs>
											<linearGradient id="moduleAreaFill" x1="0" y1="0" x2="0" y2="1">
												<stop offset="0%" stopColor="#c084fc" stopOpacity={0.28} />
												<stop offset="55%" stopColor="#f5d0fe" stopOpacity={0.14} />
												<stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
											</linearGradient>
										</defs>

										<CartesianGrid
											stroke="#f1f5f9"
											strokeDasharray="0"
											vertical={false}
										/>

										<XAxis
											dataKey="name"
											axisLine={false}
											tickLine={false}
											interval={0}
											tick={{
												fontSize: 11,
												fill: "#6b7280",
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

												return text.length > 8 ? `${text.slice(0, 8)}...` : text;
											}}
										/>
										<YAxis hide />
										<Tooltip
											cursor={{
												stroke: "#e5e7eb",
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
												fill: "#ffffff",
												stroke: "#c084fc",
												strokeWidth: 3,
											}}
											activeDot={{
												r: 8,
												fill: "#ffffff",
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
						<span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
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
											stroke="#ffffff"
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
									<p className="text-xs font-bold uppercase tracking-wide text-gray-400">
										Total
									</p>

									<p className="mt-1 text-xl font-black text-gray-950">
										{formatMoney(revenueTotal)}
									</p>

									<p className="mt-1 text-[11px] font-bold text-gray-400">
										Revenue mix
									</p>
								</div>
							</div>

							{/* Legend */}
							<div className="space-y-2">
								{revenueChartData.map((item) => (
									<div
										key={item.name}
										className="rounded-2xl border border-gray-100 bg-gradient-to-r from-white to-gray-50 px-3 py-2.5 shadow-sm"
									>
										<div className="flex items-center justify-between gap-3">
											<div className="flex min-w-0 items-center gap-2">
												<span
													className="h-3 w-3 shrink-0 rounded-full shadow-sm"
													style={{ backgroundColor: item.color }}
												/>

												<div className="min-w-0">
													<p className="truncate text-sm font-black text-gray-800">
														{item.name}
													</p>

													<p className="text-xs font-bold text-gray-400">
														{item.percent}% of total
													</p>
												</div>
											</div>

											<p className="shrink-0 text-sm font-black text-gray-950">
												{formatMoney(item.value)}
											</p>
										</div>

										<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
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

const ProfessionalDashboard = () => {
	const dispatch = useDispatch();

	const [openChat, setOpenChat] = useState(false);
	const [activeTab, setActiveTab] = useState<TabType>("taxez");

	const { analytics, bookEzAnalytics, loading, error } = useSelector(
		(s: any) => s.professionalDashboard
	);

	const permissionState = useMemo(() => {
		return safeJsonParse(localStorage.getItem("permissions")) || {};
	}, []);

	const permissions = useMemo(() => {
		const possiblePermissions = permissionState

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
	}, [dispatch]);

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
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<motion.div
					initial={{ opacity: 0, scale: 0.94 }}
					animate={{ opacity: 1, scale: 1 }}
					className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
				>
					<p className="text-sm font-bold text-slate-600">
						Loading dashboard...
					</p>
				</motion.div>
			</div>
		);
	}

	if (error) {
		return <p className="mt-10 text-center text-red-500">{error}</p>;
	}

	if (visibleTabs.length === 0) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
				<div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
					<h2 className="text-lg font-bold text-slate-900">
						No dashboard permission
					</h2>

					<p className="mt-2 text-sm font-medium text-slate-500">
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
		  className="relative min-h-screen bg-gray-50 p-4 md:p-6"
	  >
		  {/* <div className="mb-4 flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-2 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 md:text-2xl">
            Professional Dashboard
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Switch between TaxEz and BookEz dashboard based on enabled
            permissions.
          </p>
        </div>
        <div>

        </div>


        {visibleTabs.length > 1 && (
          <div className="flex w-full gap-2 overflow-x-auto rounded-md bg-slate-50 p-1 lg:w-auto">
            {visibleTabs.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                label={tab.label}
                icon={tab.icon}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>
        )}
      </div> */}

		  <AnimatePresence mode="wait">
			  {activeTab === "taxez" && canShowTaxEz && (
				  <TaxEzDashboardView analytics={analytics} />
			  )}

			  {activeTab === "bookez" && canShowBookEz && (
				  <BookEzDashboardView analytics={bookEzAnalytics} />
			  )}
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
	  </motion.div>
  );
};

export default ProfessionalDashboard;