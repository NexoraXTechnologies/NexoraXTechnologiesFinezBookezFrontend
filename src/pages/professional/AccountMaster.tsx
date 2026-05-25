import React, { useEffect, useState } from "react";
import { RefreshCcw, Trash2, Edit, Plus, ChevronRight, ChevronLast, ChevronLeft, ChevronFirst, Search, RefreshCw, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import ConfirmTooltip from "../../components/common/ConfirmTooltip";

import {
	getAllAccounts,
	createAccount,
	updateAccount,
	deleteAccount,
} from "../../redux/slices/professionalSlice/accountMasterSlice";
import { DataCreateButton, DataREfreshButton, PaginationButton, PrimaryButton, SecondaryButton } from "../../components/buttons";
import DataTable from "../../components/DataTable";
import Pagination from "../../components/pagination";
import SearchInput from "../../components/searchInput";
import { AnimatePresence, motion } from "framer-motion";
import { SelectInput, TextArea, TextInput } from "../../components/inputs";

const AccountMaster = () => {
	const dispatch = useDispatch();

	const {
		accounts,
		pagination,
		loading,
		createLoading,
		updateLoading,
		deleteLoading,
	} = useSelector((s) => s.accountMaster);

	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	const [refreshing, setRefreshing] = useState(false);
	const [showModal, setShowModal] = useState(false);

	const [editingAccount, setEditingAccount] = useState(null);

	const [errors, setErrors] = useState({});

	const [confirmTooltip, setConfirmTooltip] = useState({
		show: false,
		x: null,
		y: null,
		accountCode: null,
	});

	const [form, setForm] = useState({
		accountName: "",
		accountType: "",
		accountMobile: "",
		accountEmail: "",
		accountCreditLimit: "",
		accountAddress: "",
	});
	/* ============================================
		  FETCH ACCOUNTS
	============================================= */
	const fetchAccounts = () => {
		dispatch(
			getAllAccounts({
				offset: localOffset,
				limit: localLimit,
				search: debouncedSearch,
			})
		);
	};

	useEffect(() => {
		fetchAccounts();
	}, [localOffset, localLimit, debouncedSearch]);

	/* ============================================
		  DEBOUNCE SEARCH
	============================================= */
	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(search.trim());
			setLocalOffset(0);
		}, 400);

		return () => clearTimeout(t);
	}, [search]);

	/* ============================================
		  REFRESH
	============================================= */
	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchAccounts();
		toast.success("Account list refreshed");
		setRefreshing(false);
	};

	/* ============================================
		  OPEN ADD
	============================================= */
	const openAddModal = () => {
		setEditingAccount(null);

		setForm({
			accountName: "",
			accountType: "",
			accountMobile: "",
			accountEmail: "",
			accountCreditLimit: "",
			accountAddress: "",
		});

		setShowModal(true);
	};

	/* ============================================
		  OPEN EDIT
	============================================= */
	const openEditModal = (acc) => {
		setEditingAccount(acc);

		setForm({
			accountName: acc.accountName,
			accountType: acc.accountType,
			accountMobile: acc.accountMobile,
			accountEmail: acc.accountEmail,
			accountCreditLimit: acc.accountCreditLimit,
			accountAddress: acc.accountAddress,
		});

		setShowModal(true);
	};

	/* ============================================ SAVE / UPDATE ============================================= */
	const handleSubmit = async () => {
		const e = {};

		// Account Name
		if (!form.accountName.trim()) {
			e.accountName = "Account name required";
		}

		// Account Type
		if (!form.accountType.trim()) {
			e.accountType = "Account type required";
		}

		// Mobile
		if (!form.accountMobile.trim()) {
			e.accountMobile = "Mobile required";
		} else if (!/^\d{10}$/.test(form.accountMobile)) {
			e.accountMobile = "Mobile must be 10 digits";
		}

		// Email
		if (!form.accountEmail.trim()) {
			e.accountEmail = "Email required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.accountEmail)) {
			e.accountEmail = "Invalid email address";
		}

		// Credit Limit
		if (form.accountCreditLimit !== "" && Number(form.accountCreditLimit) < 0) {
			e.accountCreditLimit = "Credit limit cannot be negative";
		}

		// Address
		if (!form.accountAddress.trim()) {
			e.accountAddress = "Address required";
		}

		setErrors(e);
		if (Object.keys(e).length > 0) return;

		try {
			if (editingAccount) {
				const updatePayload = {};
				const fields = ["accountName", "accountType", "accountMobile", "accountEmail", "accountCreditLimit", "accountAddress"];
				fields.forEach((field) => {
					if (form[field] !== editingAccount[field]) {
						updatePayload[field] = form[field];
					}
				});

				if (form.accountEmail === editingAccount.accountEmail) {
					delete updatePayload.accountEmail;
				}
				if (form.accountMobile === editingAccount.accountMobile) {
					delete updatePayload.accountMobile;
				}

				await dispatch(
					updateAccount({
						accountCode: editingAccount.accountCode,
						data: updatePayload,
					})
				).unwrap();

				toast.success("Account updated successfully");
			} else {
				await dispatch(createAccount(form)).unwrap();
				toast.success("Account created");
			}

			setShowModal(false);
			fetchAccounts();
		} catch (err) {
			toast.error(err.message || "Operation failed");
		}
	};

	/* ============================================
		  DELETE CONFIRM
	============================================= */
	const handleDeleteConfirm = async () => {
		try {
			await dispatch(deleteAccount(confirmTooltip.accountCode)).unwrap();
			toast.success("Account deleted");
			fetchAccounts();
		} finally {
			setConfirmTooltip({ show: false, x: null, y: null, accountCode: null });
		}
	};

	/* ============================================
		  PAGINATION CALC
	============================================= */
	// const startIndex = pagination.totalDocs > 0 ? pagination.offset + 1 : 0;
	// const endIndex = pagination.totalDocs > 0 ? pagination.offset + accounts.length : 0;
	const columns = [
		{
			key: 'accountCode',
			title: 'Account Code',
		},
		{
			key: 'accountName',
			title: 'Name',
		},
		{
			key: 'accountType',
			title: 'Type',
			render: (row) => (
				<span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
					{row.accountType}
				</span>
			),
		},
		{
			key: 'accountMobile',
			title: 'Mobile',
		},
		{
			key: 'accountEmail',
			title: 'Email',
		},
	];

	return (
		<div className="w-full bg-white border border-gray-200  shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}
			<div id="account-header" className="flex items-center mb-3">
				<div id="account-summary" className="flex items-start gap-3">
					<div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-md px-2 py-1 h-8">
						<span className="text-xs text-gray-600">Total Accounts:</span>
						<span className="text-sm font-semibold text-green-700">
							{pagination.totalDocs ?? 0}
						</span>
					</div>
				</div>

				<div className="ml-auto flex items-center gap-2">
					<SearchInput {...{ search, setSearch }} />
					<DataREfreshButton {...{ callBackFn: handleRefresh }} />
					<DataCreateButton {...{ callBackFn: openAddModal }} />
				</div>
			</div>

			{/* ================= TABLE ================= */}

			<DataTable
				columns={columns}
				data={accounts}
				loading={loading}
				emptyMessage="No accounts found"
				actions={(acc) => (
					<div className="flex items-center gap-2">
						{/* EDIT */}
						<button
							id="account-edit-button"
							onClick={() => openEditModal(acc)}
							className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer">
							<Edit size={16} />
						</button>

						{/* DELETE */}
						<button
							id="account-delete-button"
							onClick={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								let x = rect.left - 150;
								if (x < 10) x = 10;
								const y = rect.top + window.scrollY - 5;
								setConfirmTooltip({ show: true, x, y, accountCode: acc.accountCode, });
							}}
							className="p-2 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			{pagination.totalDocs > 0 && <Pagination  {...{
				localLimit, selectCb: (e) => {
					setLocalLimit(Number(e.target.value));
					setLocalOffset(0);
				},
				preDisabled: !pagination.hasPrevPage,
				nextDisabled: !pagination.hasNextPage,
				setLocalOffset, pagination
			}} />}

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

			{/* ================= MODAL ================= */}
			<AnimatePresence>
				{showModal && (
					<motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
						<motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
							transition={{
								type: "spring",
								stiffness: 260,
								damping: 20,
							}}
							className="relative w-full max-w-3xl rounded-md bg-white shadow-2xl border border-gray-100 overflow-hidden">
							{/* Header */}
							<div className="flex items-center justify-between border-b border-gray-300 px-6 py-3 bg-gray-50">
								<div>
									<h2 className="text-xl font-semibold text-gray-800 mb-0">{editingAccount ? "Edit Account" : "Add New Account"}</h2>
									<p className="text-sm text-gray-500">Fill in the account details below</p>
								</div>

								<button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-gray-200 transition cursor-pointer">
									<X size={18} className="text-gray-600" />
								</button>
							</div>

							{/* Body */}
							<div className="p-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									{/* Account Name */}
									<TextInput {...{ label: "Account Name", mandatory: true, value: form.accountName, onChange: (e) => setForm({ ...form, accountName: e.target.value }), placeholder: "Enter account name", error: errors.accountName }} />
									<SelectInput {...{
										label: "Account Type", mandatory: true, value: form.accountType,
										onChange: (value) => setForm({ ...form, accountType: value }), options: [
											{ value: "", label: "Select account type" },
											{ value: "cash", label: "Cash" },
											{ value: "bank", label: "Bank" },
											{ value: "customer", label: "Customer" },
											{ value: "vendor", label: "Vendor" }
										]
									}} />

									<TextInput {...{
										label: "Mobile", mandatory: true, value: form.accountMobile,
										onChange: (e) => setForm({ ...form, accountMobile: e.target.value }), placeholder: "Enter mobile number", error: errors.accountMobile
									}} />

									<TextInput {...{ label: "Email", mandatory: true, value: form.accountEmail, onChange: (e) => setForm({ ...form, accountEmail: e.target.value }), placeholder: "Enter email address", error: errors.accountEmail, type: "email" }} />

									<TextInput {...{ label: "Credit Limit", mandatory: true, value: form.accountCreditLimit, onChange: (e) => setForm({ ...form, accountCreditLimit: e.target.value }), placeholder: "Enter credit limit", error: errors.accountCreditLimit, type: "number" }} />

									<TextArea {...{ label: "Address", mandatory: true, value: form.accountAddress, onChange: (e) => setForm({ ...form, accountAddress: e.target.value }), placeholder: "Enter address", error: errors.accountAddress }} />
								</div>
							</div>

							{/* Footer */}
							<div className="flex justify-end gap-3 border-t border-gray-300 bg-gray-50 px-6 py-4">
								<SecondaryButton callBackFn={() => setShowModal(false)} text="Cancel" />
								<PrimaryButton callBackFn={handleSubmit} text={editingAccount ? "Update" : "Save"} />
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default AccountMaster;
