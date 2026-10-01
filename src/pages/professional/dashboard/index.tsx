import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Building2, FileText, Loader2 } from "lucide-react";
import {
	fetchProfessionalDashboardAnalytics,
	fetchTransportDashboardAnalytics,
} from "../../../redux/slices/professionalSlice/dashboard/professionalDashboardSlice";
import AiTaxCopilotDrawer from "../AiChat/AiTaxCopilotDrawer";
import AiChatBox from "../AiChat/AiChatBox";
import BookEzDashboardView from "./BookEzDashboardView";
import DashboardSectionTabs from "./DashboardSectionTabs";
import {
	getSavedPermissions,
	isBookEzPermission,
	isTaxEzPermission,
	safeJsonParse,
} from "./dashboardShared";

const TransportAnalyticsView = lazy(() => import("./TransportAnalyticsView"));
const CustomDashboardView = lazy(() => import("./customeDashboard"));

type TabType = "taxez" | "bookez";
type DashboardSection = "dashboard" | "analytics" | "custom";

const DashboardLazyLoader = () => {
	return (
		<div className="flex min-h-[420px] items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<Loader2
					size={28}
					className="animate-spin text-primary"
				/>
				<p className="text-sm font-bold text-muted-foreground">
					Loading dashboard...
				</p>
			</div>
		</div>
	);
};

const ProfessionalDashboard = () => {
	const dispatch = useDispatch();
	const location = useLocation();
	const [openChat, setOpenChat] = useState(false);
	const [activeTab, setActiveTab] = useState<TabType>("taxez");
	const [dashboardSection, setDashboardSection] = useState<DashboardSection>("dashboard");

	const {
		bookEzAnalytics,
		loading,
		error,
		transportAnalytics,
		transportLoading,
		transportError,
	} = useSelector((state: any) => state.professionalDashboard);

	const permissionState = useMemo(() => {
		return safeJsonParse(localStorage.getItem("permissions")) || {};
	}, []);

	const permissions = useMemo(() => {
		const parsedPermission = safeJsonParse(permissionState);

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
		const tabs: {
			key: TabType;
			label: string;
			icon: React.ReactNode;
		}[] = [];

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
					<Loader2
						size={26}
						className="mx-auto animate-spin text-primary"
					/>

					<p className="mt-3 text-sm font-bold text-muted-foreground">
						Loading dashboard...
					</p>
				</motion.div>
			</div>
		);
	}

	if (error) {
		return (
			<p className="mt-10 text-center text-danger">
				{error}
			</p>
		);
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
			<DashboardSectionTabs
				activeSection={dashboardSection}
				onChange={setDashboardSection}
			/>

			{dashboardSection === "dashboard" && (
				<>
					<AnimatePresence mode="wait">
						{/* {activeTab === "taxez" && canShowTaxEz && (
                            <TaxEzDashboardView analytics={analytics} />
                        )} */}

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
				<Suspense fallback={<DashboardLazyLoader />}>
					<TransportAnalyticsView
						analytics={transportAnalytics}
						loading={transportLoading}
						error={transportError}
					/>
				</Suspense>
			)}

			{dashboardSection === "custom" && (
				<Suspense fallback={<DashboardLazyLoader />}>
					<CustomDashboardView />
				</Suspense>
			)}
		</motion.div>
	);
};

export default ProfessionalDashboard;