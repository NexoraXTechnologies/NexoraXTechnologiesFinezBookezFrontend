import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { formatDateTime } from "../../../../utils/helperFunctions";
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
	deleteTripAllocationByVoucherNumber,
	getAllTripAllocation,
} from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";

/* ===================================================
   TRIP ALLOCATION LIST
=================================================== */

const TripAllocationList = () => {
	const dispatch = useDispatch<any>();
	const location = useLocation();
	const navigate = useNavigate();

	const {
		tripAllocations = [],
		pagination = {},
		listingLoader = false,
		deleteLoader = false,
	} = useSelector((state: any) => state.tripAllocation);

	const [search, setSearch] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(20);
	const [activeStatus, setActiveStatus] =
		useState<"open" | "close">("open");

	const [statusCounts, setStatusCounts] = useState({
		open: 0,
		close: 0,
	});

	const [confirmTooltip, setConfirmTooltip] = useState<any>({
		show: false,
		x: null,
		y: null,
		tripAllocationNumber: null,
	});

	const pageTitle = location.state?.title || "Trip Allocation";
	const pageDescription =
		location.state?.description ||
		"Assign vehicles, drivers, and routes to planned transport trips.";

	const getTripAllocationNumber = (record: any) =>
		record?.tripAllocationNumber ||
		record?.allocationNumber ||
		record?.tripNumber ||
		record?.voucherNumber ||
		record?.transportOrderNumber ||
		"";

	const openCount = statusCounts.open;
	const closeCount = statusCounts.close;

	const fetchTripAllocations = ({
		offset = localOffset,
		limit = localLimit,
		searchValue = search,
		statusValue = activeStatus,
	}: any = {}) => {
		return dispatch(
			getAllTripAllocation({
				limit,
				offset,
				search: searchValue,
				tripStatus: getApiStatus(statusValue),
			}) as any
		);
	};

	const getApiStatus = (status: "open" | "close") => {
		return status === "open" ? "pending" : "completed";
	};

	useEffect(() => {
		fetchTripAllocations();
	}, [
		dispatch,
		localOffset,
		localLimit,
		activeStatus,
	]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setLocalOffset(0);

			dispatch(
				getAllTripAllocation({
					limit: localLimit,
					offset: 0,
					search,
					tripStatus: getApiStatus(activeStatus),
				}) as any
			);
		}, 400);

		return () => clearTimeout(timer);
	}, [search, dispatch]);


	const getPaginationTotal = (response: any) => {
		const responseData =
			response?.payload?.data ||
			response?.data ||
			response?.payload ||
			response ||
			{};

		const responsePagination =
			responseData?.pagination ||
			responseData?.data?.pagination ||
			{};

		return Number(
			responsePagination?.totalDocs ??
			responsePagination?.totalRecords ??
			0
		);
	};

	const fetchStatusCounts = async (searchValue = search) => {
		try {
			const [openResponse, closeResponse] = await Promise.all([
				dispatch(
					getAllTripAllocation({
						limit: 1,
						offset: 0,
						search: searchValue,
						tripStatus: "pending",
					}) as any
				),

				dispatch(
					getAllTripAllocation({
						limit: 1,
						offset: 0,
						search: searchValue,
						tripStatus: "completed",
					}) as any
				),
			]);

			setStatusCounts({
				open: getPaginationTotal(openResponse),
				close: getPaginationTotal(closeResponse),
			});

			await dispatch(
				getAllTripAllocation({
					limit: localLimit,
					offset: localOffset,
					search: searchValue,
					tripStatus: getApiStatus(activeStatus),
				}) as any
			);
		} catch (error) {
			console.error("Failed to fetch trip allocation counts", error);
		}
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchStatusCounts(search);
		}, 400);

		return () => clearTimeout(timer);
	}, [search]);

	const handleRefresh = async () => {
		try {
			setRefreshing(true);

			await fetchStatusCounts(search);
		} finally {
			setRefreshing(false);
		}
	};

	const openCreateTripAllocation = () => {
		navigate("/bookEz/transportation/trip-allocation/create", {
			state: {
				title: "Create Trip Allocation",
				description:
					"Assign vehicle, driver, route, and trip details for a transport order.",
				mode: "add",
			},
		});
	};

	const handleEditTripAllocation = (record: any) => {
		const tripAllocationNumber = getTripAllocationNumber(record);

		if (!tripAllocationNumber) {
			toast.warn("Trip allocation number not found");
			return;
		}

		navigate(
			`/bookEz/transportation/trip-allocation/edit/${tripAllocationNumber}`,
			{
				state: {
					title: "Edit Trip Allocation",
					description: "Update trip allocation details.",
					mode: "edit",
					tripAllocationNumber,
					voucherNumber: tripAllocationNumber,
					allocationNumber: tripAllocationNumber,
				},
			}
		);
	};

	const handleDeleteClick = (e: any, record: any) => {
		const tripAllocationNumber = getTripAllocationNumber(record);

		if (!tripAllocationNumber) {
			toast.warn("Trip allocation number not found");
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
			tripAllocationNumber,
		});
	};

	const handleDeleteConfirm = async () => {
		try {
			if (!confirmTooltip?.tripAllocationNumber) {
				toast.warn("Trip allocation number not found");
				return;
			}

			await dispatch(
				deleteTripAllocationByVoucherNumber(
					confirmTooltip.tripAllocationNumber
				)
			).unwrap();

			toast.success("Trip allocation deleted successfully");

			setConfirmTooltip({
				show: false,
				x: null,
				y: null,
				tripAllocationNumber: null,
			});

			await fetchStatusCounts(search);
		} catch (error: any) {
			toast.error(error?.message || "Failed to delete trip allocation");
		}
	};

	const columns = [
		{
			key: "tripNumber",
			title: "Allocation No",
			render: (row: any) => row?.tripNumber || "-",
		},
		{
			key: "allocationDate",
			title: "Date",
			render: (row: any) => formatDateTime(row?.allocationDate),
		},
		{
			key: "transportOrder.transportOrderNumber",
			title: "Transport Order",
			render: (row: any) => row?.transportOrder?.transportOrderNumber || "-",
		},
		{
			key: "transportOrder.customerName",
			title: "Customer",
			render: (row: any) => (
				<div>
					<div className="font-medium text-card-foreground">
						{row?.transportOrder?.customerName || "-"}
					</div>

					<div className="text-xs text-muted-foreground">
						{row?.transportOrder?.customerCode || "-"}
					</div>
				</div>
			),
		},
		{
			key: "vehicleSelection.vehicleNumber",
			title: "Vehicle",
			render: (row: any) => (
				<div>
					<div className="font-medium text-card-foreground">
						{row?.vehicleSelection?.vehicleNumber || "-"}
					</div>

					<div className="text-xs text-muted-foreground">
						{row?.vehicleSelection?.vehicleType || "-"}
						{row?.vehicleSelection?.vehicleCapacityTon
							? ` • ${row.vehicleSelection.vehicleCapacityTon} Ton`
							: ""}
					</div>
				</div>
			),
		},
		// {
		// 	key: "driverAllocation.driverName",
		// 	title: "Driver",
		// 	render: (row: any) => (
		// 		<div>
		// 			<div className="font-medium text-card-foreground">
		// 				{row?.driverAllocation?.driverName || "-"}
		// 			</div>

		// 			<div className="text-xs text-muted-foreground">
		// 				{row?.driverAllocation?.mobileNumber || "-"}
		// 			</div>
		// 		</div>
		// 	),
		// },
		{
			key: "transportOrder.source",
			title: "Route",
			render: (row: any) =>
				`${row?.transportOrder?.source || "-"} - ${row?.transportOrder?.destination || "-"
				}`,
		},
		// {
		// 	key: "tripPlan.routeDistanceKm",
		// 	title: "Trip Plan",
		// 	render: (row: any) => (
		// 		<div>
		// 			<div className="font-medium text-card-foreground">
		// 				{row?.tripPlan?.routeDistanceKm
		// 					? `${row.tripPlan.routeDistanceKm} KM`
		// 					: "-"}
		// 			</div>

		// 			<div className="text-xs text-muted-foreground">
		// 				{row?.tripPlan?.routeType || "-"}
		// 			</div>
		// 		</div>
		// 	),
		// },
		// {
		// 	key: "transportOrder.expectedFreight",
		// 	title: "Freight",
		// 	render: (row: any) =>
		// 		row?.transportOrder?.expectedFreight
		// 			? money(row.transportOrder.expectedFreight)
		// 			: "-",
		// 	type: "amount",
		// },
		// {
		// 	key: "tripStatus",
		// 	title: "Status",
		// 	render: (row: any) => (
		// 		<span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
		// 			{row?.tripStatus || "-"}
		// 		</span>
		// 	),
		// },


		{
			key: "tripStatus",
			title: "Status",
			render: (row: any) => {
				const status = String(row?.tripStatus || "")
					.trim()
					.toLowerCase();

				const completed = status === "completed";

				return (
					<span
						className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium capitalize ${completed
							? "border-success/20 bg-success/10 text-success"
							: "border-primary/20 bg-primary/10 text-primary"
							}`}
					>
						{completed ? "Completed" : "Pending"}
					</span>
				);
			},
		}
	];

	return (
		<div className="flex h-full w-full flex-col bg-card p-4 text-card-foreground shadow-sm">
			<div id="trip-allocation-header" className="mb-3 flex items-center">
				<div id="trip-allocation-summary" className="flex items-center">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
						title="Go back"
					>
						<ArrowLeft size={18} />
					</button>

					<div>
						<h1 className="truncate text-lg font-bold text-card-foreground">
							{pageTitle}
						</h1>

						<p className="text-sm text-muted-foreground">
							{pageDescription}
						</p>
					</div>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<Badge
						{...{
							count: openCount + closeCount,
							text: "Total Allocations:",
							varient: "primary",
						}}
					/>


					<div className="flex rounded-md border border-border bg-background p-1">
						<button
							type="button"
							onClick={() => {
								setActiveStatus("open");
								setLocalOffset(0);
							}}
							className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "open"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-muted"
								}`}
						>
							Open ({openCount})
						</button>

						<button
							type="button"
							onClick={() => {
								setActiveStatus("close");
								setLocalOffset(0);
							}}
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

					<Permission
						module="bookez"
						permissionKey="tripAllocation"
						action="create"
					>
						{/* @ts-ignore */}
						<DataCreateButton
							{...{
								callBackFn: openCreateTripAllocation,
								text: "Create Allocation",
							}}
						/>
					</Permission>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-hidden">
				<DataTable
					columns={columns}
					data={tripAllocations}
					loading={listingLoader}
					emptyMessage="No trip allocation found"
					actions={(record: any) => (
						<div className="flex items-center gap-2">
							<Permission
								module="bookez"
								permissionKey="tripAllocation"
								action="update"
							>
								<button
									type="button"
									onClick={() => handleEditTripAllocation(record)}
									className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
								>
									<Edit size={16} />
								</button>
							</Permission>

							<Permission
								module="bookez"
								permissionKey="tripAllocation"
								action="delete"
							>
								<button
									type="button"
									disabled={deleteLoader}
									onClick={(e) => handleDeleteClick(e, record)}
									className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
								>
									<Trash2 size={16} />
								</button>
							</Permission>
						</div>
					)}
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
					message="Are you sure you want to delete this trip allocation?"
					confirmText="Delete"
					cancelText="Cancel"
					onConfirm={handleDeleteConfirm}
					onCancel={() =>
						setConfirmTooltip({
							show: false,
							x: null,
							y: null,
							tripAllocationNumber: null,
						})
					}
				/>
			)}
		</div>
	);
};

export default TripAllocationList;