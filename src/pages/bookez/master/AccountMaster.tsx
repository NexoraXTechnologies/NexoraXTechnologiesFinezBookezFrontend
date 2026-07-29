import { useEffect, useState } from "react";
import { Trash2, Edit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import ConfirmTooltip from "../../../components/common/ConfirmTooltip";

import {
	getAllAccounts,
	deleteAccount,
} from "../../../redux/slices/professionalSlice/accountMasterSlice";

import {
	DataCreateButton,
	DataREfreshButton,
} from "../../../components/buttons";

import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import SearchInput from "../../../components/searchInput";
import Badge from "../../../components/badge";
import Permission from "../../../components/PermissionGuard";
import { AccountMasterModal } from "../../../components/modal";

const columns = [
	{
		key: "accountCode",
		title: "Account Code",
	},
	{
		key: "accountName",
		title: "Name",
	},
	{
		key: "accountType",
		title: "Type",
		render: (row: any) => (
			<span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
				{row.accountType}
			</span>
		),
	},
	{
		key: "accountMobile",
		title: "Mobile",
	},
	{
		key: "accountEmail",
		title: "Email",
	},
];

const AccountMaster = () => {
	const dispatch = useDispatch<any>();

	const {
		accounts = [],
		pagination = {
			offset: 0,
			limit: 10,
			totalDocs: 0,
			totalPages: 0,
			currentPage: 1,
			hasNextPage: false,
			hasPrevPage: false,
		},
		loading,
	} = useSelector(
		(state: any) => state.accountMaster || {}
	);

	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] =
		useState("");

	const [showModal, setShowModal] = useState(false);
	const [editingAccount, setEditingAccount] =
		useState<any>(null);

	const [confirmTooltip, setConfirmTooltip] =
		useState<any>({
			show: false,
			x: null,
			y: null,
			accountCode: null,
		});

	/* ============================================
	   FETCH ACCOUNTS
	============================================= */

	const fetchAccounts = () => {
		return dispatch(
			getAllAccounts({
				offset: localOffset,
				limit: localLimit,
				search: debouncedSearch,
			}) as any
		);
	};

	useEffect(() => {
		fetchAccounts();
	}, [
		dispatch,
		localOffset,
		localLimit,
		debouncedSearch,
	]);

	/* ============================================
	   SEARCH DEBOUNCE
	============================================= */

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search.trim());
			setLocalOffset(0);
		}, 400);

		return () => clearTimeout(timer);
	}, [search]);

	/* ============================================
	   REFRESH
	============================================= */

	const handleRefresh = async () => {
		try {
			await fetchAccounts();
			toast.success("Account list refreshed");
		} catch (error: any) {
			toast.error(
				error?.message ||
				"Failed to refresh account list"
			);
		}
	};

	/* ============================================
	   OPEN ADD MODAL
	============================================= */

	const openAddModal = () => {
		setEditingAccount(null);
		setShowModal(true);
	};

	/* ============================================
	   OPEN EDIT MODAL
	============================================= */

	const openEditModal = (account: any) => {
		setEditingAccount(account);
		setShowModal(true);
	};

	/* ============================================
	   DELETE ACCOUNT
	============================================= */

	const handleDeleteConfirm = async () => {
		try {
			await dispatch(
				deleteAccount(
					confirmTooltip.accountCode
				) as any
			).unwrap();

			toast.success("Account deleted");
			await fetchAccounts();
		} catch (error: any) {
			toast.error(
				error?.message ||
				"Failed to delete account"
			);
		} finally {
			setConfirmTooltip({
				show: false,
				x: null,
				y: null,
				accountCode: null,
			});
		}
	};

	return (
		<div className="w-full bg-card border border-border text-card-foreground shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}

			<div
				id="account-header"
				className="flex flex-wrap items-center gap-2 mb-3"
			>
				<div
					id="account-summary"
					className="flex items-start gap-3"
				>
					<Badge
						{...{
							count:
								pagination.totalDocs ??
								0,
							text: "Total Accounts:",
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
						}}
					/>

					<Permission
						module="bookez"
						permissionKey="accountMaster"
						action="create"
					>
						<DataCreateButton
							{...{
								callBackFn:
									openAddModal,
							}}
						/>
					</Permission>
				</div>
			</div>

			{/* ================= TABLE ================= */}

			<DataTable
				columns={columns}
				data={accounts}
				loading={loading}
				showFloatingFilter={true}
				filterOptions={[
					{
						label: "All",
						value: "all",
					},
					{
						label: "Cash",
						value: "cash",
					},
					{
						label: "Bank",
						value: "bank",
					},
					{
						label: "Sale",
						value: "sale",
					},
					{
						label: "Purchase",
						value: "purchase",
					},
					{
						label: "Customer",
						value: "customer",
					},
					{
						label: "Vendor",
						value: "vendor",
					},
				]}
				filterKeys={[
					"accountType",
					"type",
					"module",
					"category",
					"groupName",
				]}
				emptyMessage="No accounts found"
				actions={(account: any) => (
					<div className="flex items-center gap-2">
						<Permission
							module="bookez"
							permissionKey="accountMaster"
							action="update"
						>
							<button
								id="account-edit-button"
								type="button"
								onClick={() =>
									openEditModal(
										account
									)
								}
								className="p-2 rounded-lg text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer"
							>
								<Edit size={16} />
							</button>
						</Permission>

						<Permission
							module="bookez"
							permissionKey="accountMaster"
							action="delete"
						>
							<button
								id="account-delete-button"
								type="button"
								onClick={(event) => {
									const rect =
										event.currentTarget.getBoundingClientRect();

									let x =
										rect.left -
										150;

									if (x < 10) {
										x = 10;
									}

									const y =
										rect.top +
										window.scrollY -
										5;

									setConfirmTooltip(
										{
											show: true,
											x,
											y,
											accountCode:
												account.accountCode,
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

			{pagination.totalDocs > 0 && (
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

							setLocalOffset(0);
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
					x={confirmTooltip.x}
					y={confirmTooltip.y}
					message="Are you sure you want to delete this account?"
					confirmText="Delete"
					cancelText="Cancel"
					onConfirm={handleDeleteConfirm}
					onCancel={() =>
						setConfirmTooltip({
							show: false,
							x: null,
							y: null,
							accountCode: null,
						})
					}
				/>
			)}

			{/* ================= ACCOUNT MODAL ================= */}

			<AccountMasterModal
				show={showModal}
				setShow={(value: boolean) => {
					setShowModal(value);

					if (!value) {
						setEditingAccount(null);
					}
				}}
				editingAccount={editingAccount}
				onSaved={() => {
					fetchAccounts();
					setEditingAccount(null);
				}}
			/>
		</div>
	);
};

export default AccountMaster;