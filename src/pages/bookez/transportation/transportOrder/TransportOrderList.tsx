import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit, Eye, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { formatDateForList, money, truncate } from "../../../../utils/helperFunctions";
import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import {
	DataCreateButton,
	DataREfreshButton,
} from "../../../../components/buttons";
import Badge from "../../../../components/badge";
import { useLocation, useNavigate } from "react-router-dom";

import Pagination from "../../../../components/pagination";
import { toast } from "react-toastify";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import {
	deleteTransportOrderByVoucherNumber,
	getTransportOrders,
} from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
import { getAllLRCollection } from "../../../../redux/slices/professionalSlice/transportation/tripLRCollectionSlice";

/* ===================================================
   TRANSPORT ORDER LIST
=================================================== */

const TransportOrderList = () => {
	const dispatch = useDispatch<any>();
	const location = useLocation();
	const navigate = useNavigate();

	const {
		transportOrders = [],
		pagination = {},
		listingLoader = false,
		deleteLoader = false,
	} = useSelector((state: any) => state.transportOrder);

	const [search, setSearch] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(20);

	const [activeStatus, setActiveStatus] = useState<"open" | "close">("open");

	const [confirmTooltip, setConfirmTooltip] = useState<any>({
		show: false,
		x: null,
		y: null,
		orderNumber: null,
	});

	const {
		tripLRCollection = [],
		listingLoader: lrListingLoader = false,
	} = useSelector((state: any) => state.tripLRCollection || {});


	const pageTitle = location.state?.title || "Transport Order";


	const getOrderNumber = (record: any) =>
		record?.orderNumber ||
		record?.transportOrderNumber ||
		record?.tOrderNumber ||
		record?.voucherNumber ||
		"";


	const getLROrderNumber = (lr: any) =>
		String(
			lr?.transportOrderNumber ||
			lr?.tripNumber ||
			lr?.orderNumber ||
			lr?.transportOrder?.transportOrderNumber ||
			lr?.transportOrder?.orderNumber ||
			lr?.transportOrder?.voucherNumber ||
			lr?.voucherNumber ||
			""
		).trim();

	const getLRNumber = (lr: any) =>
		String(
			lr?.lrNumber ||
			lr?.lrVoucherNumber ||
			lr?.voucherNumber ||
			lr?.tripLRCollectionVoucherNumber ||
			""
		).trim();

	const allocatedLRMap = useMemo(() => {
		const map: any = {};

		for (const lr of Array.isArray(tripLRCollection) ? tripLRCollection : []) {
			const orderNumber = getLROrderNumber(lr);

			if (!orderNumber) continue;

			map[orderNumber] = {
				lrNumber: getLRNumber(lr),
				raw: lr,
			};
		}

		return map;
	}, [tripLRCollection]);

	const getAllocatedLR = (record: any) => {
		const orderNumber = String(getOrderNumber(record) || "").trim();

		if (!orderNumber) return null;

		return allocatedLRMap[orderNumber] || null;
	};

	// const isOrderAllocatedInLR = (record: any) => {
	// 	return Boolean(getAllocatedLR(record));
	// };


	const normalizeStatus = (value: any) =>
		String(value || "open")
			.trim()
			.toLowerCase()
			.replace(/[\s-]+/g, "_");

	const getRowStatus = (row: any) =>
		normalizeStatus(
			row?.tripStatus ||
			row?.orderStatus ||
			row?.docStatus ||
			row?.status ||
			"open"
		);

	const isClosedOrder = (row: any) => {
		const status = getRowStatus(row);

		return (
			status === "close" ||
			status === "closed" ||
			status === "complete" ||
			status === "completed"
		);
	};

	const statusLabel = (row: any) => {
		const status = getRowStatus(row);

		if (isClosedOrder(row)) return "Close";

		return status
			.replace(/_/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase());
	};

	const openCount = useMemo(
		() =>
			transportOrders.filter(
				(item: any) => !isClosedOrder(item)
			).length,
		[transportOrders]
	);

	const closeCount = useMemo(
		() =>
			transportOrders.filter(
				(item: any) => isClosedOrder(item)
			).length,
		[transportOrders]
	);

	const filteredTransportOrders = useMemo(() => {
		return transportOrders.filter((item: any) => {
			const closed = isClosedOrder(item);

			if (activeStatus === "open" && closed) return false;
			if (activeStatus === "close" && !closed) return false;

			return true;
		});
	}, [transportOrders, activeStatus]);

	const fetchLRCollection = () => {
		dispatch(
			getAllLRCollection({
				limit: 100000,
				offset: 0,
				search: "",
			}) as any
		);
	};

	const fetchTransportOrders = ({
		offset = localOffset,
		limit = localLimit,
		searchValue = search,
	}: any = {}) => {
		dispatch(
			getTransportOrders({
				limit,
				offset,
				search: searchValue,
			})
		);
	};

	useEffect(() => {
		fetchTransportOrders();
		fetchLRCollection();
	}, [dispatch, localOffset, localLimit]);


	useEffect(() => {
		const timer = setTimeout(() => {
			setLocalOffset(0);

			dispatch(
				getTransportOrders({
					limit: localLimit,
					offset: 0,
					search,
				})
			);
		}, 400);

		return () => clearTimeout(timer);
	}, [search, dispatch]);

	const handleRefresh = () => {
		setRefreshing(true);

		Promise.all([
			dispatch(
				getTransportOrders({
					limit: localLimit,
					offset: localOffset,
					search,
				}) as any
			),
			dispatch(
				getAllLRCollection({
					limit: 100000,
					offset: 0,
					search: "",
				}) as any
			),
		]).finally(() => {
			setRefreshing(false);
		});
	};

	const openCreateOrder = () => {
		navigate("/bookEz/transportation/transport-order/create", {
			state: {
				title: "Create Transport Order",
				description:
					"Create transport order with contract, customer, route, and trip details.",
				mode: "add",
			},
		});
	};

	const handleEditOrder = (record: any) => {
		if (isClosedOrder(record)) {
			toast.error("Closed transport order cannot be edited");
			return;
		}

		const orderNumber = getOrderNumber(record);

		if (!orderNumber) {
			toast.warn("Transport order number not found");
			return;
		}

		navigate(`/bookEz/transportation/transport-order/edit/${orderNumber}`, {
			state: {
				title: "Edit Transport Order",
				description: "Update transport order details.",
				mode: "edit",
				orderNumber,
				voucherNumber: orderNumber,
				transportOrderNumber: orderNumber,
			},
		});
	};

	const handleDeleteClick = (e: any, record: any) => {
		if (isClosedOrder(record)) {
			toast.error("Closed transport order cannot be deleted");
			return;
		}

		const orderNumber = getOrderNumber(record);

		if (!orderNumber) {
			toast.warn("Transport order number not found");
			return;
		}

		const rect = e.currentTarget.getBoundingClientRect();

		let x = rect.left - 160;
		if (x < 10) x = 10;

		const y = rect.top + window.scrollY - 5;

		setConfirmTooltip({
			show: true,
			x,
			y,
			orderNumber,
		});
	};

	const handleDeleteConfirm = async () => {
		try {
			if (!confirmTooltip?.orderNumber) {
				toast.warn("Transport order number not found");
				return;
			}

			await dispatch(
				deleteTransportOrderByVoucherNumber(confirmTooltip.orderNumber)
			).unwrap();

			toast.success("Transport order deleted successfully");

			setConfirmTooltip({
				show: false,
				x: null,
				y: null,
				orderNumber: null,
			});

			fetchTransportOrders();
		} catch (error: any) {
			toast.error(error?.message || "Failed to delete transport order");
		}
	};

	const columns = [
		{
			key: "transportOrderNumber",
			title: "Order No",
			render: (row: any) => getOrderNumber(row) || "-",
		},
		{
			key: "orderDate",
			title: "Date",
			render: (row: any) =>
				row?.orderDate ? formatDateForList(row.orderDate) : "-",
		},
		{
			key: "customer",
			title: "Customer",
			render: (row: any) => (
				<div>
					<div className="font-medium text-card-foreground">
						{row?.customerDetails?.customerName || "-"}
					</div>

					<div className="text-xs text-muted-foreground">
						{row?.customerDetails?.customerCode || "-"}
					</div>
				</div>
			),
		},
		// {
		// 	key: "route",
		// 	title: "Route",
		// 	render: (row: any) => {
		// 		const from =
		// 			row?.pickupDetails?.pickupLocation ||
		// 			row?.pickupDetails?.pickupCityName ||
		// 			"";

		// 		const to =
		// 			row?.deliveryDetails?.deliveryLocation ||
		// 			row?.deliveryDetails?.deliveryCityName ||
		// 			"";

		// 		return from || to ? `${from || "-"} - ${to || "-"}` : "-";
		// 	},
		// },

		{
			key: "route",
			title: "Route",
			render: (row: any) => {
				const from =
					row?.pickupDetails?.pickupLocation ||
					row?.pickupDetails?.pickupCityName ||
					"";

				const to =
					row?.deliveryDetails?.deliveryLocation ||
					row?.deliveryDetails?.deliveryCityName ||
					"";

				return from || to
					? `${truncate(from || "-", 18)} → ${truncate(to || "-", 18)}`
					: "-";
			},
		},
		{
			key: "expectedFreight",
			title: "Expected Freight",
			render: (row: any) => {
				const value = row?.freightDetails?.expectedFreight;

				return value ? money(value) : "-";
			},
			type: "amount",
		},
		{
			key: "status",
			title: "Status",
			render: (row: any) => {
				const closed = isClosedOrder(row);

				return (
					<span
						className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium capitalize ${closed
							? "border-danger/20 bg-danger/10 text-danger"
							: "border-primary/20 bg-primary/10 text-primary"
							}`}
					>
						{statusLabel(row)}
					</span>
				);
			},
		},
	];


	const handleViewOrder = (record: any) => {
		const orderNumber = getOrderNumber(record);

		if (!orderNumber) {
			toast.warn("Transport order number not found");
			return;
		}

		navigate(`/bookEz/transportation/transport-order/view/${orderNumber}`, {
			state: {
				title: "View Transport Order",
				description: "View transport order details.",
				mode: "view",
				orderNumber,
				voucherNumber: orderNumber,
				transportOrderNumber: orderNumber,
			},
		});
	};

	return (
		<div className="flex h-full w-full flex-col bg-card p-4 text-card-foreground shadow-sm">
			<div id="transport-order-header" className="mb-3 flex items-center">
				<div id="transport-order-summary" className="flex items-center">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
						title="Go back"
					>
						<ArrowLeft size={18} />
					</button>
					<div >
						<h1 className="truncate text-lg font-bold text-card-foreground">

							{pageTitle}
						</h1>


					</div>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<Badge
						{...{
							count:
								pagination?.totalDocs ??
								pagination?.totalRecords ??
								transportOrders?.length ??
								0,

							text: "Total Orders:",
							varient: "primary",
						}}
					/>

					<div className="flex rounded-md border border-border bg-background p-1">
						<button
							type="button"
							onClick={() => setActiveStatus("open")}
							className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "open"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-muted"
								}`}
						>
							Open ({openCount})
						</button>

						<button
							type="button"
							onClick={() => setActiveStatus("close")}
							className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "close"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-muted"
								}`}
						>
							Close ({closeCount})
						</button>
					</div>

					<SearchInput
						{...{
							search,
							setSearch,
						}}
					/>

					<DataREfreshButton
						{...{
							callBackFn: handleRefresh,
							loading: refreshing,
						}}
					/>

					{/* {activeStatus !== "close" && ( */}
					<Permission
						module="bookez"
						permissionKey="transportOrder"
						action="create"
					>
						{/* @ts-ignore */}
						<DataCreateButton
							{...{
								callBackFn: openCreateOrder,
								text: "Create Order",
							}}
						/>
					</Permission>
					{/* )} */}
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-hidden">
				<DataTable
					columns={columns}
					data={filteredTransportOrders}
					loading={listingLoader}
					emptyMessage="No transport order found"
					{...(activeStatus !== "close"
						? {
							// actions: (record: any) => {
							// 	const allocatedLR = getAllocatedLR(record);

							// 	if (allocatedLR) {
							// 		return (
							// 			<span className="inline-flex items-center rounded-md border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
							// 				Allocated
							// 				{allocatedLR?.lrNumber
							// 					? ` • ${allocatedLR.lrNumber}`
							// 					: ""}
							// 			</span>
							// 		);
							// 	}

							// 	if (isClosedOrder(record)) return null;

							// 	return (
							// 		<div className="flex items-center gap-2">
							// 			<Permission
							// 				module="bookez"
							// 				permissionKey="transportOrder"
							// 				action="update"
							// 			>
							// 				<button
							// 					type="button"
							// 					onClick={() => handleEditOrder(record)}
							// 					className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
							// 				>
							// 					<Edit size={16} />
							// 				</button>
							// 			</Permission>

							// 			<Permission
							// 				module="bookez"
							// 				permissionKey="transportOrder"
							// 				action="delete"
							// 			>
							// 				<button
							// 					type="button"
							// 					disabled={deleteLoader || lrListingLoader}
							// 					onClick={(e) => handleDeleteClick(e, record)}
							// 					className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
							// 				>
							// 					<Trash2 size={16} />
							// 				</button>
							// 			</Permission>
							// 		</div>
							// 	);
							// },

							actions: (record: any) => {
								const allocatedLR = getAllocatedLR(record);

								return (
									<div className="flex items-center gap-2">

										{/* View */}



										{!allocatedLR && !isClosedOrder(record) && (
											<>
												<Permission
													module="bookez"
													permissionKey="transportOrder"
													action="update"
												>
													<button
														type="button"
														onClick={() => handleEditOrder(record)}
														className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10"
														title="Edit"
													>
														<Edit size={16} />
													</button>
												</Permission>

												<Permission
													module="bookez"
													permissionKey="transportOrder"
													action="delete"
												>
													<button
														type="button"
														disabled={deleteLoader || lrListingLoader}
														onClick={(e) => handleDeleteClick(e, record)}
														className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 disabled:opacity-50"
														title="Delete"
													>
														<Trash2 size={16} />
													</button>
												</Permission>
											</>
										)}

										{allocatedLR && (
											<>

												<Permission
													module="bookez"
													permissionKey="transportOrder"
													action="view"
												>
													<button
														type="button"
														onClick={() => handleViewOrder(record)}
														className="cursor-pointer rounded-md p-2 text-info transition-all duration-200 hover:bg-info/10"
														title="View"
													>
														<Eye size={16} />
													</button>
												</Permission>
												<span className="inline-flex items-center rounded-md border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
													Allocated
													{allocatedLR?.lrNumber
														? ` • ${allocatedLR.lrNumber}`
														: ""}
												</span>


											</>
										)}
									</div>
								);
							}
						}
						: {})}
				/>
			</div>

			{pagination?.totalDocs > 0 && (
				<Pagination
					localLimit={localLimit}
					selectCb={(e: any) => {
						setLocalLimit(Number(e.target.value));
						setLocalOffset(0);
					}}
					preDisabled={!pagination?.hasPrevPage}
					nextDisabled={!pagination?.hasNextPage}
					setLocalOffset={setLocalOffset}
					pagination={pagination}
				/>
			)}

			{confirmTooltip.show && (
				<ConfirmTooltip
					x={confirmTooltip.x}
					y={confirmTooltip.y}
					message="Are you sure you want to delete this transport order?"
					confirmText="Delete"
					cancelText="Cancel"
					onConfirm={handleDeleteConfirm}
					onCancel={() =>
						setConfirmTooltip({
							show: false,
							x: null,
							y: null,
							orderNumber: null,
						})
					}
				/>
			)}
		</div>
	);
};

export default TransportOrderList;