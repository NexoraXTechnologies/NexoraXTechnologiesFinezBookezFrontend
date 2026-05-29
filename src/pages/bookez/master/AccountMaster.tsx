import { useEffect, useState } from "react";
import { Trash2, Edit, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import {
	getAllAccounts,
	createAccount,
	updateAccount,
	deleteAccount,
	getAllAccountMasterSchema,
} from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { DataCreateButton, DataREfreshButton, PrimaryButton, SecondaryButton } from "../../../components/buttons";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import SearchInput from "../../../components/searchInput";
import { AnimatePresence, motion } from "framer-motion";
import { SelectInput, TextArea, TextInput } from "../../../components/inputs";
import Modal from "../../../components/modal";
import Badge from "../../../components/badge";
import { getCitiesByState, getStates } from "../../../redux/slices/professionalSlice/stateCitySlice";

const columns = [
	{ key: 'accountCode', title: 'Account Code', },
	{ key: 'accountName', title: 'Name', },
	{
		key: 'accountType', title: 'Type',
		render: (row) => (
			<span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
				{row.accountType}
			</span>
		),
	},
	{ key: 'accountMobile', title: 'Mobile', },
	{ key: 'accountEmail', title: 'Email', },
];

const AccountMaster = () => {
	const dispatch = useDispatch();
	const {
		accounts,
		pagination,
		loading,
		accountMasterSchemaFields = [],
		schemaLoading,
	} = useSelector((s: any) => s.accountMaster);
	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [refreshing, setRefreshing] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [editingAccount, setEditingAccount] = useState(null);
	const [errors, setErrors] = useState({});

	const [pendingCity, setPendingCity] = useState("");
	const [confirmTooltip, setConfirmTooltip] = useState({
		show: false,
		x: null,
		y: null,
		accountCode: null,
	});




	const [form, setForm] = useState<any>({});
	useEffect(() => {
		if (accountMasterSchemaFields.length > 0) {
			setForm((prev: any) => ({
				...buildEmptyForm(accountMasterSchemaFields),
				...prev,
			}));
		}
	}, [accountMasterSchemaFields]);


	const buildEmptyForm = (fields: any[] = []) => {
		return fields.reduce((acc: any, field: any) => {
			acc[field.key] = "";
			return acc;
		}, {});
	};

	const getDisplayName = (name: any) => {
		if (!name) return "";

		if (typeof name === "string") return name;

		if (typeof name === "object") {
			return (
				name.en ||
				name.mr ||
				name.hi ||
				name.gu ||
				name.ta ||
				name.te ||
				name.kn ||
				name.ml ||
				name.pa ||
				""
			);
		}

		return String(name);
	};

	const {
		states = [],
		cities = [],
	} = useSelector((s: any) => s.stateCity || {});

	useEffect(() => {
		dispatch(getStates() as any);
	}, [dispatch]);

	useEffect(() => {
		if (form.state) {
			dispatch(
				getCitiesByState({
					stateCode: form.state,
					searchText: "",
				}) as any
			);
		}
	}, [dispatch, form.state]);



	// const getFieldOptions = (field: any) => {
	// 	if (field.key === "state") {
	// 		return (
	// 			states?.map((item: any) => {
	// 				const stateCode =
	// 					item.isoCode || item.stateCode || item.code || "";

	// 				const stateName = getDisplayName(item.name || item.stateName);

	// 				return {
	// 					value: stateCode,
	// 					label: stateName || stateCode,
	// 				};
	// 			}) || []
	// 		);
	// 	}

	// 	if (field.key === "city") {
	// 		return (
	// 			cities?.map((item: any) => {
	// 				const cityName = getDisplayName(item.name || item.cityName);

	// 				return {
	// 					value: cityName,
	// 					label: cityName,
	// 				};
	// 			}) || []
	// 		);
	// 	}

	// 	return (field.options || []).map((opt: string) => ({
	// 		value: opt,
	// 		label: opt,
	// 	}));
	// };


	const getFieldOptions = (field: any) => {
		if (field.key === "state") {
			return (
				states?.map((item: any) => {
					const stateCode =
						item.isoCode || item.stateCode || item.code || "";

					const stateName = getDisplayName(item.name || item.stateName);

					return {
						value: stateCode,
						label: stateName || stateCode,
					};
				}) || []
			);
		}

		if (field.key === "city") {
			return (
				cities?.map((item: any) => {
					const cityName = getDisplayName(item.name || item.cityName);

					return {
						value: cityName,
						label: cityName,
					};
				}) || []
			);
		}

		if (field.key === "accountType") {
			return (field.options || []).map((opt: any) => {
				const label =
					typeof opt === "object"
						? opt.label || opt.name || opt.value || ""
						: opt;

				const value =
					typeof opt === "object"
						? opt.value || opt.code || opt.name || label
						: opt;

				return {
					label,
					value: String(value).toLowerCase(),
				};
			});
		}

		return (field.options || []).map((opt: any) => {
			if (typeof opt === "object") {
				return {
					value: opt.value || opt.code || opt.name || "",
					label: opt.label || opt.name || opt.value || "",
				};
			}

			return {
				value: opt,
				label: opt,
			};
		});
	};

	const findSelectedState = () => {
		return states?.find((item: any) => {
			const stateCode =
				item.isoCode || item.stateCode || item.code || "";

			return stateCode === form.state;
		});
	};

	const findSelectedCity = () => {
		return cities?.find((item: any) => {
			const cityName = getDisplayName(item.name || item.cityName);
			return cityName === form.city;
		});
	};


	useEffect(() => {
		if (!pendingCity || !cities?.length) return;

		const matchedCity = cities.find((item: any) => {
			const cityName = getDisplayName(item.name || item.cityName);
			return cityName === pendingCity;
		});

		if (matchedCity) {
			setForm((prev: any) => ({
				...prev,
				city: pendingCity,
			}));

			setPendingCity("");
		}
	}, [cities, pendingCity]);



	/* ============================================
		  FETCH Form Fields
	============================================= */


	const renderSchemaField = (field: any) => {
		const value = form?.[field.key] ?? "";

		const commonProps = {
			label: field.label,
			mandatory: field.isRequired,
			value,
			placeholder: `Enter ${field.label}`,
			error: errors?.[field.key],
		};

		if (field.type === "select") {
			const options = getFieldOptions(field);

			return (
				<SelectInput
					key={field.key}
					label={field.label}
					mandatory={field.isRequired}
					value={form?.[field.key] ?? ""}
					placeholder={`Select ${field.label}`}
					error={errors?.[field.key]}
					onChange={(e: any) => {
						const selectedValue = e?.target?.value ?? "";

						setForm((prev: any) => ({
							...prev,
							[field.key]: selectedValue,
							...(field.key === "state" ? { city: "" } : {}),
						}));

						setErrors((prev: any) => ({
							...prev,
							[field.key]: "",
							...(field.key === "state" ? { city: "" } : {}),
						}));

						if (field.key === "state") {
							setPendingCity("");

							if (selectedValue) {
								dispatch(
									getCitiesByState({
										stateCode: selectedValue,
										searchText: "",
									}) as any
								);
							}
						}
					}}
					disabled={field.key === "city" && !form.state}
					options={[
						{
							value: "",
							label:
								field.key === "city" && !form.state
									? "Select state first"
									: `Select ${field.label}`,
						},
						...options,
					]}
				/>
			);
		}

		if (field.type === "number") {
			return (
				<TextInput
					key={field.key}
					{...commonProps}
					type="number"
					onChange={(e: any) =>
						setForm({
							...form,
							[field.key]: e.target.value,
						})
					}
				/>
			);
		}

		if (field.type === "textarea") {
			return (
				<TextArea
					key={field.key}
					{...commonProps}
					onChange={(e: any) =>
						setForm({
							...form,
							[field.key]: e.target.value,
						})
					}
				/>
			);
		}

		if (field.key === "accountMobile") {
			return (
				<TextInput
					key={field.key}
					{...commonProps}
					type="tel"
					onChange={(e: any) =>
						setForm({
							...form,
							[field.key]: e.target.value.replace(/\D/g, "").slice(0, 10),
						})
					}
				/>
			);
		}

		if (field.key === "accountEmail") {
			return (
				<TextInput
					key={field.key}
					{...commonProps}
					type="email"
					onChange={(e: any) =>
						setForm({
							...form,
							[field.key]: e.target.value,
						})
					}
				/>
			);
		}

		return (
			<TextInput
				key={field.key}
				{...commonProps}
				type="text"
				onChange={(e: any) =>
					setForm({
						...form,
						[field.key]: e.target.value,
					})
				}
			/>
		);
	};

	useEffect(() => {
		dispatch(
			getAllAccountMasterSchema({
				offset: 0,
				limit: 50,
			}) as any
		);
	}, [dispatch]);
	/* ============================================
		  FETCH ACCOUNTS
	============================================= */
	const fetchAccounts = () => {
		dispatch(getAllAccounts({ offset: localOffset, limit: localLimit, search: debouncedSearch, }));
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
		setErrors({});
		setForm(buildEmptyForm(accountMasterSchemaFields));
		setShowModal(true);
	};

	/* ============================================
		  OPEN EDIT
	============================================= */
	// const openEditModal = (acc: any) => {
	// 	setEditingAccount(acc);
	// 	setErrors({});

	// 	const nextForm = buildEmptyForm(accountMasterSchemaFields);

	// 	accountMasterSchemaFields.forEach((field: any) => {
	// 		if (field.key === "state") {
	// 			nextForm.state =
	// 				typeof acc.state === "object"
	// 					? acc.state?.isoCode || acc.state?.stateCode || acc.state?.code || ""
	// 					: acc.state || "";
	// 		} else if (field.key === "city") {
	// 			const cityName =
	// 				typeof acc.city === "object"
	// 					? getDisplayName(acc.city?.name || acc.city?.cityName)
	// 					: acc.city || "";

	// 			nextForm.city = "";
	// 			setPendingCity(cityName);
	// 		} else {
	// 			nextForm[field.key] = acc?.[field.key] ?? "";
	// 		}
	// 	});

	// 	setForm(nextForm);

	// 	if (nextForm.state) {
	// 		dispatch(
	// 			getCitiesByState({
	// 				stateCode: nextForm.state,
	// 				searchText: "",
	// 			}) as any
	// 		);
	// 	}

	// 	setShowModal(true);
	// };



	const openEditModal = (acc: any) => {
		setEditingAccount(acc);
		setErrors({});

		const nextForm = buildEmptyForm(accountMasterSchemaFields);

		accountMasterSchemaFields.forEach((field: any) => {
			const key = field.key;

			if (key === "state") {
				nextForm.state =
					typeof acc.state === "object"
						? acc.state?.isoCode || acc.state?.stateCode || acc.state?.code || ""
						: acc.state || "";

				return;
			}

			if (key === "city") {
				const cityName =
					typeof acc.city === "object"
						? getDisplayName(acc.city?.name || acc.city?.cityName)
						: acc.city || "";

				nextForm.city = "";
				setPendingCity(cityName);

				return;
			}

			if (key === "accountType") {
				nextForm.accountType = acc?.accountType
					? String(acc.accountType).toLowerCase()
					: "";

				return;
			}

			nextForm[key] = acc?.[key] ?? "";
		});

		setForm(nextForm);

		if (nextForm.state) {
			dispatch(
				getCitiesByState({
					stateCode: nextForm.state,
					searchText: "",
				}) as any
			);
		}

		setShowModal(true);
	};
	/* ============================================
		  Validate form fields
	============================================= */

	const validateForm = () => {
		const e: any = {};

		accountMasterSchemaFields.forEach((field: any) => {
			const value = form?.[field.key];

			if (field.isRequired && String(value || "").trim() === "") {
				e[field.key] = `${field.label} required`;
			}

			if (
				field.key === "accountMobile" &&
				value &&
				!/^\d{10}$/.test(String(value))
			) {
				e[field.key] = "Mobile must be 10 digits";
			}

			if (
				field.key === "accountEmail" &&
				value &&
				!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
			) {
				e[field.key] = "Invalid email address";
			}

			if (
				field.key === "accountCreditLimit" &&
				value !== "" &&
				Number(value) < 0
			) {
				e[field.key] = "Credit limit cannot be negative";
			}
		});

		setErrors(e);
		return Object.keys(e).length === 0;
	};

	/* ============================================ SAVE / UPDATE ============================================= */


	const handleSubmit = async () => {
		if (!validateForm()) return;

		const selectedState = findSelectedState();
		const selectedCity = findSelectedCity();

		const payload: any = {
			...form,
			state: selectedState || form.state,
			city: selectedCity || form.city,
		};

		try {
			if (editingAccount) {
				const updatePayload: any = {};

				accountMasterSchemaFields.forEach((field: any) => {
					const key = field.key;

					if (key === "state") {
						const oldStateCode =
							typeof editingAccount.state === "object"
								? editingAccount.state?.isoCode ||
								editingAccount.state?.stateCode ||
								editingAccount.state?.code ||
								""
								: editingAccount.state || "";

						if (form.state !== oldStateCode) {
							updatePayload.state = selectedState || form.state;
						}

						return;
					}

					if (key === "city") {
						const oldCityName =
							typeof editingAccount.city === "object"
								? getDisplayName(
									editingAccount.city?.name ||
									editingAccount.city?.cityName
								)
								: editingAccount.city || "";

						if (form.city !== oldCityName) {
							updatePayload.city = selectedCity || form.city;
						}

						return;
					}

					if (form[key] !== editingAccount[key]) {
						updatePayload[key] = form[key];
					}
				});

				await dispatch(
					updateAccount({
						accountCode: editingAccount.accountCode,
						data: updatePayload,
					}) as any
				).unwrap();

				toast.success("Account updated successfully");
			} else {
				await dispatch(createAccount(payload) as any).unwrap();
				toast.success("Account created");
			}

			setShowModal(false);
			fetchAccounts();
		} catch (err: any) {
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

	return (
		<div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}
			<div id="account-header" className="flex flex-wrap items-center gap-2 mb-3">
				<div id="account-summary" className="flex items-start gap-3">
					<Badge {...{ count: pagination.totalDocs ?? 0, text: "Total Accounts:" }} />
				</div>

				<div className="ml-auto flex flex-wrap items-center gap-2">
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



			<Modal
				{...{
					show: showModal,
					setShow: setShowModal,
					handleSubmit,
					state: editingAccount,
					title: "Account",
					body: (
						<>
							{schemaLoading ? (
								<div className="py-6 text-sm text-gray-500">
									Loading account fields...
								</div>
							) : (
								accountMasterSchemaFields.map((field: any) =>
									renderSchemaField(field)
								)
							)}
						</>
					),
				}}
			/>
		</div>
	);
};

export default AccountMaster;
