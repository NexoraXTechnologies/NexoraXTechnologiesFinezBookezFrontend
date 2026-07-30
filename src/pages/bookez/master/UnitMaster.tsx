import { useEffect, useState } from "react";
import { Trash2, Edit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import ConfirmTooltip from "../../../components/common/ConfirmTooltip";


import SearchInput from "../../../components/searchInput";
import {
	DataCreateButton,
	DataREfreshButton,
} from "../../../components/buttons";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import Badge from "../../../components/badge";

import {       
	deleteUnit,
	getAllUnits,
} from "../../../redux/slices/professionalSlice/unitMasterSlice";

import Permission from "../../../components/PermissionGuard";
import UnitMasterModal from "./UnitMasterModal";

const defaultPagination = {
	offset: 0,
	limit: 10,
	totalDocs: 0,
	totalPages: 1,
	currentPage: 1,
	hasNextPage: false,
	hasPrevPage: false,
};

const UnitMaster = () => {
	const dispatch = useDispatch<any>();

	const {
		units = [],
		pagination = defaultPagination,
		loading = false,
	} = useSelector(
		(state: any) =>
			state.unitMaster || {}
	);

	const [
		localOffset,
		setLocalOffset,
	] = useState(0);

	const [
		localLimit,
		setLocalLimit,
	] = useState(10);

	const [
		search,
		setSearch,
	] = useState("");

	const [
		debouncedSearch,
		setDebouncedSearch,
	] = useState("");

	const [
		refreshing,
		setRefreshing,
	] = useState(false);

	// ⭐ YELLOW STAR: UPDATED — COMMON UNIT MASTER MODAL STATE
	const [
		showModal,
		setShowModal,
	] = useState(false);

	const [
		editingUnit,
		setEditingUnit,
	] = useState<any>(null);

	const [
		confirmTooltip,
		setConfirmTooltip,
	] = useState<any>({
		show: false,
		x: null,
		y: null,
		unitId: null,
	});

	/* ============================================
	   TABLE COLUMNS
	============================================= */

	const columns = [
		{
			key: "unitId",
			title: "Unit ID",
		},
		{
			key: "unitCode",
			title: "Unit Code",
		},
		{
			key: "unitName",
			title: "Name",
		},
		{
			key: "unitStatus",
			title: "Status",
		},
	];

	/* ============================================
	   FETCH UNITS
	============================================= */

	const fetchUnits = () => {
		return dispatch(
			getAllUnits({
				offset: localOffset,
				limit: localLimit,
				search: debouncedSearch,
			}) as any
		);
	};

	useEffect(() => {
		fetchUnits();
	}, [
		dispatch,
		localOffset,
		localLimit,
		debouncedSearch,
	]);

	/* ============================================
	   DEBOUNCE SEARCH
	============================================= */
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(
				search.trim()
			);

			setLocalOffset(0);
		}, 400);

		return () =>
			clearTimeout(timer);
	}, [search]);

	/* ============================================
	   REFRESH
	============================================= */
	const handleRefresh = async () => {
		setRefreshing(true);

		try {
			await fetchUnits();

			toast.success(
				"Unit list refreshed"
			);
		} catch (error: any) {
			toast.error(
				error?.message ||
				"Failed to refresh unit list"
			);
		} finally {
			setRefreshing(false);
		}
	};

	/* ============================================
	   OPEN ADD MODAL
	============================================= */
	const openAddModal = () => {
		setEditingUnit(null);
		setShowModal(true);
	};

	/* ============================================
	   OPEN EDIT MODAL
	============================================= */

	const openEditModal = (
		unit: any
	) => {
		setEditingUnit(unit);
		setShowModal(true);
	};

	/* ============================================
	   UNIT SAVED
	============================================= */

	// ⭐ YELLOW STAR: ADDED — REFRESH PAGE AFTER COMMON MODAL SAVE
	const handleUnitSaved = async () => {
		await fetchUnits();

		setEditingUnit(null);
		setShowModal(false);
	};

	/* ============================================
	   DELETE UNIT
	============================================= */

	const handleDeleteConfirm =
		async () => {
			try {
				if (
					!confirmTooltip.unitId
				) {
					toast.error(
						"Unit ID not found"
					);

					return;
				}

				await dispatch(
					deleteUnit(
						confirmTooltip.unitId
					) as any
				).unwrap();

				toast.success(
					"Unit deleted"
				);

				await fetchUnits();
			} catch (error: any) {
				toast.error(
					error?.message ||
					"Failed to delete unit"
				);
			} finally {
				setConfirmTooltip({
					show: false,
					x: null,
					y: null,
					unitId: null,
				});
			}
		};

	return (
		<div className="w-full bg-card border border-border text-card-foreground rounded-lg shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}

			<div
				id="unit-header"
				className="flex flex-wrap items-center gap-2 mb-3"
			>
				<div
					id="unit-summary"
					className="flex items-start gap-3"
				>
					<Badge
						{...{
							count:
								pagination.totalDocs ??
								0,

							text:
								"Total Units:",

							varient:
								"primary",
						}}
					/>
				</div>

				<div className="ml-auto flex flex-wrap items-center gap-2">
					<SearchInput
						{...{
							search,
							setSearch,
						}}
					/>

					<DataREfreshButton
						{...{
							callBackFn:
								handleRefresh,

							loading:
								refreshing,
						}}
					/>

					<Permission
						module="bookez"
						permissionKey="unitMaster"
						action="create"
					>
						{/* @ts-ignore */}
						<DataCreateButton
							{...{
								callBackFn:
									openAddModal,

								text:
									"Add Unit",
							}}
						/>
					</Permission>
				</div>
			</div>

			{/* ================= TABLE ================= */}

			<DataTable
				columns={columns}
				data={units}
				loading={loading}
				emptyMessage="No units found"
				actions={(unit: any) => (
					<div className="flex items-center gap-2">
						<Permission
							module="bookez"
							permissionKey="unitMaster"
							action="update"
						>
							<button
								id="unit-edit-button"
								type="button"
								onClick={() =>
									openEditModal(
										unit
									)
								}
								className="p-2 rounded-lg text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer"
							>
								<Edit
									size={16}
								/>
							</button>
						</Permission>

						<Permission
							module="bookez"
							permissionKey="unitMaster"
							action="delete"
						>
							<button
								id="unit-delete-button"
								type="button"
								onClick={(
									event
								) => {
									const rect =
										event.currentTarget.getBoundingClientRect();

									let x: any =
										rect.left -
										150;

									if (x < 10) {
										x = 10;
									}

									const y: any =
										rect.top +
										window.scrollY -
										5;

									setConfirmTooltip(
										{
											show: true,
											x,
											y,
											unitId:
												unit.unitId,
										}
									);
								}}
								className="p-2 rounded-lg text-danger hover:bg-danger/10 hover:text-danger transition-all duration-200 cursor-pointer"
							>
								<Trash2
									size={16}
								/>
							</button>
						</Permission>
					</div>
				)}
			/>

			{/* ================= PAGINATION ================= */}

			{pagination.totalDocs >
				0 && (
					<Pagination
						{...{
							localLimit,

							selectCb: (
								event: any
							) => {
								setLocalLimit(
									Number(
										event.target
											.value
									)
								);

								setLocalOffset(
									0
								);
							},

							preDisabled:
								!pagination.hasPrevPage,

							nextDisabled:
								!pagination.hasNextPage,

							setLocalOffset,

							pagination,
						}}
					/>
				)}

			{/* ================= DELETE TOOLTIP ================= */}

			{confirmTooltip.show && (
				<ConfirmTooltip
					x={
						confirmTooltip.x
					}
					y={
						confirmTooltip.y
					}
					message="Are you sure you want to delete this unit?"
					confirmText="Delete"
					cancelText="Cancel"
					onConfirm={
						handleDeleteConfirm
					}
					onCancel={() =>
						setConfirmTooltip({
							show: false,
							x: null,
							y: null,
							unitId: null,
						})
					}
				/>
			)}

			{/* ================= COMMON UNIT MODAL ================= */}

			<UnitMasterModal
				show={showModal}
				setShow={(
					value: boolean
				) => {
					setShowModal(value);

					if (!value) {
						setEditingUnit(
							null
						);
					}
				}}
				editingUnit={
					editingUnit
				}
				onSaved={
					handleUnitSaved
				}
				title={
					editingUnit
						? "Update Unit"
						: "Add New Unit"
				}
			/>
		</div>
	);
};

export default UnitMaster;