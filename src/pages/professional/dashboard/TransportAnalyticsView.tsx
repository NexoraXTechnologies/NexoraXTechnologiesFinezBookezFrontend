import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Building2, ReceiptText, ShoppingCart, Wallet } from "lucide-react";
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
    compactContainerAnim,
    formatNumber,
    pageAnimation,
    scrollableCardListClass,
    toNumber,
} from "./dashboardShared";
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
            const key = String(vehicle?.vehicleNumber || vehicle?.vehicleCode || vehicle?._id || vehicle?.code || "").trim();
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
                        <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
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
                    <div className={scrollableCardListClass}>
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
                    <div className={scrollableCardListClass}>
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
                    <div className={scrollableCardListClass}>
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
                    <div className={scrollableCardListClass}>
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
                    <div className={scrollableCardListClass}>
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
                    <div className={scrollableCardListClass}>
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
                {/* <CompactWidgetCard title="Maintenance Summary" accent="purchase">
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
                </CompactWidgetCard> */}
            </div>
        </motion.div>
    );
};
export default TransportAnalyticsView;
