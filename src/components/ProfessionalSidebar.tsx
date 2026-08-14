import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
	LogOut,
	IdCard,
	Users,
	Settings,
	ChevronDown,
	ChevronRight,
	Building2,
	Sliders,
	CloudCog,
	BookText,
	LayoutDashboard,
	X,
	CreditCard,
	BrickWallShield,
	WalletCards,
	BadgeIndianRupee,
	ShoppingCart,
	BarChart3,
	BookOpenCheck,
	LockKeyhole,
	Palette,
	Wrench,
	Truck,
	MonitorCog,
	Settings2,
	Workflow,
	
} from "lucide-react";
import ConfirmTooltip from "./common/ConfirmTooltip";
// import { useDispatch } from "react-redux";
import EZLogo from "../assets/Logo.EZ.png";
import FinEzLogo from "../assets/FinEZ.png";
import { isModuleEnabled } from "./PermissionGuard";
import { useDispatch, useSelector } from "react-redux";
import { getAllSystemConfigurations } from "../redux/slices/systemConf";


const ProfessionalSidebar = ({ onMenuItemsChange, onMobileClose }: any) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [openMenus, setOpenMenus] = useState({});
	const localUser = JSON.parse(localStorage.getItem("professionalUser") || "{}");
	const dispatch = useDispatch();
	const { configurations } = useSelector((state: any) => state.systemConfiguration);
	const isParentUser = localUser?.parentUserMobileNumber === localUser?.userMobileNumberHash
	const navigate = useNavigate();
	const [confirm, setConfirm] = useState<{
		show: boolean;
		x: number | null;
		y: number | null;
	}>({ show: false, x: null, y: null });

	/* open tooltip at click position */
	const openConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
		const btn = e.currentTarget.getBoundingClientRect();
		const gap = 8;
		const tooltipW = 176;
		const tooltipH = 64;

		let top = btn.top - gap - tooltipH;
		let left = btn.right - tooltipW;

		const pad = 4;
		top = Math.max(pad, Math.min(top, window.innerHeight - tooltipH - pad));
		left = Math.max(pad, Math.min(left, window.innerWidth - tooltipW - pad));

		setConfirm({ show: true, x: left, y: top });
	};

	// @ts-ignore
	const professionalHeaders = JSON.parse(localStorage.getItem("professionalHeaders"));
	const canShowUsers = professionalHeaders?.["x-db-name"] == professionalHeaders?.loginuser;

	useEffect(() => {
		const updateSidebarWidth = () => {
			const isDesktop = window.innerWidth >= 1024;
			if (!isDesktop) {
				document.documentElement.style.setProperty("--professional-sidebar-width", "0px");
				return;
			}
			document.documentElement.style.setProperty(
				"--professional-sidebar-width",
				isExpanded ? "256px" : "80px"
			);
		};

		updateSidebarWidth();
		window.addEventListener("resize", updateSidebarWidth);

		return () => {
			window.removeEventListener("resize", updateSidebarWidth);
		};
	}, [isExpanded]);

	const enablePOS = useMemo(() => {
		const locationConfig = configurations?.[0]?.systemConfiguration?.posConfiguration?.enablePOSModule
		return locationConfig === true || locationConfig === "true";
	}, [configurations]);

	useEffect(() => {
		dispatch(
			getAllSystemConfigurations({
				offset: 0,
				limit: 100000,
				status: "",
			}) as any
		);
	}, [])

	const menuItems = [
		{
			name: "Dashboard",
			path: "/",
			icon: <LayoutDashboard size={20} />,
		},
		...(isModuleEnabled("bookez")
			? [
				{
					name: "BookEZ",
					icon: <BookText size={20} />,
					module: "bookez",
					permissionKey: "bookez",
					children: [
						{
							name: "Master",
							path: "/bookEz/master",
							icon: <BrickWallShield size={20} />,
							module: "bookez",
							permissionKey: "accountMaster",
							action: "view",
						},
						// {
						// 	name: "QR",
						// 	path: "/bookEz/qr-and-barcode-generator",
						// 	icon: <BrickWallShield size={20} />,
						// 	module: "bookez",
						// 	permissionKey: "accountMaster",
						// 	action: "view",
						// },

						{
							name: "Opening Balances / Stocks",
							path: "/bookEz/transaction/opening-balances",
							icon: <WalletCards size={19} />,
							module: "bookez",
							permissionKey: "openingBalance",
							action: "view",
						},
						// {
						// 	name: "Production Workflow",
						// 	path: "/bookEz/transaction/production",
						// 	icon: <Factory size={19} />,
						// 	module: "bookez",
						// 	permissionKey: "production",
						// 	action: "view",
						// },
						{
							name: "Sale Workflow",
							path: "/bookEz/transaction/sale-workflow",
							icon: <BadgeIndianRupee size={19} />,
							module: "bookez",
							permissionKey: "salesInvoice",
							action: "view",
						},
						{
							name: "Purchase Workflow",
							path: "/bookEz/transaction/purchase-workflow",
							icon: <ShoppingCart size={19} />,
							module: "bookez",
							permissionKey: "purchaseInvoice",
							action: "view",
						},
						{
							name: "Custom Transactions",
							path: "/bookEz/transaction/custom",
							icon: <Workflow size={19} />,
							module: "bookez",
							permissionKey: "Pass",
							action: "view",
						},

						{
							name: "Engineering Module",
							path: "/bookEz/engineering-module",
							icon: <Wrench size={24} />,
							module: "bookez",
							permissionKey: "",
							action: "view",

						},
						{
							name: "Transportation",
							path: "/bookEz/transportation",
							icon: <Truck size={24} />,
							module: "bookez",
							permissionKey: "",
							action: "view",

						},
						{
							name: "Reports",
							path: "/bookEz/reports",
							icon: <BarChart3 size={20} />,
							module: "bookez",
							permissionKey: "accountLedger",
							action: "view",
						},
						{
							name: "Registers",
							path: "/bookEz/registers",
							icon: <BookOpenCheck size={20} />,
							module: "bookez",
							permissionKey: "allRegisters",
							action: "view",
						},
						...(enablePOS ? [{
							name: "POS",
							path: "/bookEz/pos",
							icon: <ShoppingCart size={20} />,
							module: "bookez",
							permissionKey: "allRegisters",
							action: "view",
						}] : [])
					],
				},
			]
			: []),
		{
			name: "Company Master",
			path: "/master/company",
			icon: <Building2 size={20} />,
		},
		{
			name: "Add Team/Employee",
			path: "/users",
			icon: <Users size={20} />,
		},
		{
			name: "Subscription",
			path: "/subscription",
			icon: <CreditCard size={20} />,
		},
		{
			name: "Settings",
			icon: <Settings size={20} />,
			children: [
				{
					name: "Profile",
					path: "/profile",
					icon: <IdCard size={19} />,
				},
				{
					name: "Appearance",
					path: "/appearance",
					icon: <Palette size={19} />,
				},
				...(isParentUser ? [{
					name: "System Configuration",
					path: "/system-configuration",
					icon: <MonitorCog size={19} />,
				}] : []),
				// ⭐ UPDATED: Added Master Configuration sidebar option
				...(isParentUser ? [{
					name: "Master Configuration",
					path: "/master-configuration",
					icon: <Sliders size={19} />,
				}] : []),
				...(isParentUser ? [{
					name: "Transaction Configuration",
					path: "/transaction-configuration",
					icon: <Settings2 size={19} />,
				}] : []),
				{
					name: "Document Series",
					path: "/document-series",
					icon: <Sliders size={19} />,
				},
				...(localUser?.accountType == "SUPER_ADMIN" ? [{
					name: "User Explorer",
					path: "/user-explorer",
					icon: <MonitorCog size={19} />,
				}] : []),
				...(isParentUser
					? [
						{
							name: "Permission",
							path: "/permission",
							icon: <LockKeyhole size={19} />,
						},
					]
					: []),
				...(canShowUsers
					? [
						{
							name: "Configuration",
							icon: <Sliders size={19} />,
							path: "/configuration",
						},
					]
					: []),
				...(canShowUsers
					? [
						{
							name: "Automation",
							icon: <CloudCog size={19} />,
							path: "/automation",
						},
					]
					: []),
			],
		},
	];

	const handleLogout = async () => {
		try {
			localStorage.removeItem("professionalHeaders");
			localStorage.removeItem("professionalUser");
			localStorage.removeItem("permissions");
			navigate("/login");
		} catch (err: any) {
			console.warn("Logout sync failed:", err?.message || err);
		}
	};

	// const isItemActive = (item: any, pathname: string) => {
	// 	if (item.path && pathname === item.path) return true;
	// 	if (item.matchPaths?.includes(pathname)) return true;
	// 	return false;
	// };

	const isItemActive = (item: any, pathname: string) => {
		if (!item.path) return false;

		// Dashboard should only match exactly
		if (item.path === "/") {
			return pathname === "/";
		}
		return pathname.startsWith(item.path);
	};

	const hasActiveChild = (item: any, pathname: string): boolean => {
		if (!item.children?.length) return false;

		return item.children.some((child: any) => {
			const childActive =
				(child.path && pathname.startsWith(child.path)) ||
				child.matchPaths?.includes(pathname);

			return childActive || hasActiveChild(child, pathname);
		});
	};

	const SidebarItem = ({
		item,
		level = 0,
		isExpanded,
		openMenus,
		setOpenMenus,
	}: any) => {
		const navigate = useNavigate();
		const location = useLocation();
		const hasChildren = item.children?.length > 0;
		const isActive = isItemActive(item, location.pathname);
		const isParentActive = hasActiveChild(item, location.pathname);
		const isOpen = openMenus[item.name] || false;

		const handleClick = () => {
			if (hasChildren) {
				setOpenMenus((prev: any) => ({
					...prev,
					[item.name]: !prev[item.name],
				}));
			} else if (item.path) {
				navigate(item.path);

				if (onMobileClose) onMobileClose();
			}
		};

		return (
			<div>
				{/* MENU ITEM */}
				<div
					onClick={handleClick}
					style={{ paddingLeft: `${20 + level * 14}px` }}
					className={`flex items-center cursor-pointer py-3 px-2 mx-2 mb-1 rounded transition-all duration-200 select-none group ${isActive || isParentActive
						? "bg-primary/10 text-primary"
						: "text-muted-foreground hover:bg-muted hover:text-primary"
						}`}
				>
					{/* ICON */}
					<div className="flex items-center justify-center w-5 h-5 shrink-0">
						{item.icon}
					</div>

					{/* LABEL */}
					<span
						className={
							"ml-3 text-sm truncate " +
							(isExpanded ? "lg:block" : "lg:hidden") +
							" block"
						}
					>
						{item.label || item.name}
					</span>

					{/* CHEVRON */}
					{hasChildren && (
						<div
							className={
								"ml-auto " +
								(isExpanded ? "lg:block" : "lg:hidden") +
								" block"
							}
						>
							{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
						</div>
					)}
				</div>

				{/* CHILDREN */}
				{hasChildren && isOpen && (
					<div
						className={
							"space-y-1 " +
							(isExpanded ? "lg:block" : "lg:hidden") +
							" block"
						}
					>
						{item.children.map((child: any) => (
							<SidebarItem
								key={child.name}
								item={child}
								level={level + 1}
								isExpanded={isExpanded}
								openMenus={openMenus}
								setOpenMenus={setOpenMenus}
							/>
						))}
					</div>
				)}
			</div>
		);
	};

	useEffect(() => {
		if (onMenuItemsChange) onMenuItemsChange(menuItems);
	}, []);

	return (
		<div
			id="professional-sidebar"
			className={
				"h-screen border-r bg-card border-border text-card-foreground shadow-lg " +
				"transition-all duration-300 flex flex-col " +
				"w-64 " +
				(isExpanded ? "lg:w-64" : "lg:w-20")
			}
			onMouseEnter={() => setIsExpanded(true)}
			onMouseLeave={() => setIsExpanded(false)}
		>
			{/* Logo */}
			<div className="flex items-center justify-between h-16 px-3">
				<h1
					className={`font-bold text-xl bg-background border border-border flex items-center justify-center overflow-hidden ${isExpanded
						? "w-full rounded-xl px-3 py-1"
						: "w-12 h-12 rounded-full p-2"
						}`}
				>
					<span className="lg:hidden flex items-center justify-center w-full">
						<img
							src={FinEzLogo}
							alt="FinEZ Logo"
							className="w-30 h-10 object-contain"
						/>
					</span>

					<span className="hidden lg:flex items-center justify-center w-full h-full">
						{isExpanded ? (
							<img
								src={FinEzLogo}
								alt="FinEZ Logo"
								className="w-30 h-10 object-contain"
							/>
						) : (
							<img
								src={EZLogo}
								alt="EZ Logo"
								className="w-full h-full object-contain rounded-full"
							/>
						)}
					</span>
				</h1>

				{/* Close button — mobile only */}
				<button
					onClick={onMobileClose}
					className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded"
					aria-label="Close sidebar"
				>
					<X size={20} />
				</button>
			</div>

			{/* Menu */}
			<div className="flex-1 mt-4 overflow-y-auto scrollbar-hide">
				{menuItems.map((item) => (
					<SidebarItem
						key={item.name}
						item={item}
						isExpanded={isExpanded}
						openMenus={openMenus}
						setOpenMenus={setOpenMenus}
					/>
				))}
			</div>

			<div className="border-t border-border py-4 px-4">
				<div
					/* @ts-ignore */
					onClick={openConfirm}
					className="flex items-center gap-3 text-muted-foreground cursor-pointer hover:bg-danger/10 px-2 py-2 rounded-lg transition-all"
				>
					<LogOut size={20} className="text-danger" />

					<span
						className={
							"text-sm font-medium text-danger " +
							(isExpanded ? "lg:block" : "lg:hidden") +
							" block"
						}
					>
						Logout
					</span>
				</div>
			</div>

			{/* ---- reusable tooltip ---- */}
			<ConfirmTooltip
				x={confirm.x}
				y={confirm.y}
				message="Are you sure you want to logout?"
				confirmText="Yes"
				cancelText="No"
				onConfirm={() => {
					handleLogout();
					setConfirm({ show: false, x: null, y: null });
				}}
				onCancel={() => setConfirm({ show: false, x: null, y: null })}
			/>
		</div>
	);
};

export default ProfessionalSidebar;