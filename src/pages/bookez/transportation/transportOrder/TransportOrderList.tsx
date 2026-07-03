import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { formatDateForList, money } from "../../../../utils/helperFunctions";
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
import { deleteTransportOrderByVoucherNumber, getTransportOrders } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";

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

	const [confirmTooltip, setConfirmTooltip] = useState<any>({
		show: false,
		x: null,
		y: null,
		orderNumber: null,
	});

	const pageTitle = location.state?.title || "Transport Order";
	const pageDescription =
		location.state?.description ||
		"Create and manage transport orders for customer goods movement.";

	const getOrderNumber = (record: any) =>
		record?.orderNumber ||
		record?.transportOrderNumber ||
		record?.tOrderNumber ||
		record?.voucherNumber ||
		"";

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
	}, [search, dispatch, localLimit]);

	const handleRefresh = () => {
		setRefreshing(true);

		dispatch(
			getTransportOrders({
				limit: localLimit,
				offset: localOffset,
				search,
			})
		).finally(() => {
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
		const orderNumber = getOrderNumber(record);

		if (!orderNumber) {
			toast.warn("Transport order number not found");
			return;
		}

		navigate(
			`/bookEz/transportation/create-transport-order/edit/${orderNumber}`,
			{
				state: {
					title: "Edit Transport Order",
					description: "Update transport order details.",
					mode: "edit",
					orderNumber,
					orderData: record,
				},
			}
		);
	};

	const handleDeleteClick = (e: any, record: any) => {
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

				return from || to ? `${from || "-"} - ${to || "-"}` : "-";
			},
		},
		{
			key: "expectedFreight",
			title: "Expected Freight",
			render: (row: any) => {
				const value = row?.freightDetails?.expectedFreight;

				return value ? money(value) : "-";
			},
			type:"amount"
		},
	];

	return (
		<div className="flex h-full w-full flex-col bg-card p-4 text-card-foreground shadow-sm">
			<div id="transport-order-header" className="mb-3 flex items-center">
				<div id="transport-order-summary" className="flex items-start gap-3">
					<div>
						<h1 className="flex items-center gap-1 text-md font-bold text-card-foreground">
							<button
								type="button"
								onClick={() => navigate(-1)}
								className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
							>
								<ArrowLeft size={18} />
							</button>

							<span>{pageTitle}</span>
						</h1>

						<p className="px-2 text-sm text-muted-foreground">
							{pageDescription}
						</p>
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
						permissionKey="allRegisters"
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
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-hidden">
				<DataTable
					columns={columns}
					data={transportOrders}
					loading={listingLoader}
					emptyMessage="No transport order found"
					actions={(record: any) => (
						<div className="flex items-center gap-2">
							<Permission
								module="bookez"
								permissionKey="allRegisters"
								action="update"
							>
								<button
									type="button"
									onClick={() => handleEditOrder(record)}
									className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
								>
									<Edit size={16} />
								</button>
							</Permission>

							<Permission
								module="bookez"
								permissionKey="allRegisters"
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