import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteSingle, getCustomMasterListing, getCustomMasterSchema, updateCustomData, searchData, saveCustomData } from "../../../redux/slices/professionalSlice/customMasterModuleSlice";
import SearchInput from "../../../components/searchInput";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/modal";
import { SelectInput, TextArea, TextInput } from "../../../components/inputs";
import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import { toast } from "react-toastify";
import { PrimaryButton } from "../../../components/buttons";
import Pagination from "../../../components/pagination";

type CustomMasterCompProps = {
	name?: string;
	moduleCode?: string;
};

const CustomMasterComp = ({
	//   name = "Custom Master",
	moduleCode = "",
}: CustomMasterCompProps) => {
	const dispatch = useDispatch();
	const {
		listing,
		inputSchema,
		loading,
		submitLoader,
		schemaLoading,
		pagination
	} = useSelector((s: any) => s.customMasterModule);
	const [showModal, setShowModal] = useState(false);
	const [edit, setEdit] = useState(false);
	const [errors, setErrors] = useState({});
	const [form, setForm]: any = useState({});
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);

	const [confirmTooltip, setConfirmTooltip]: any = useState({
		show: false,
		x: null,
		y: null,
		voucherNumber: null,
	});

	const addInput = [{ "key": "moduleCode", "label": "Module Code", "type": "string", disabled: true },
	{ "key": "voucherNumber", "label": "Voucher Number", autoGen: "Auto Generated", "type": "string", disabled: true }, ...inputSchema]

	const columns = [
		{ key: 'name', title: 'Name', },
		{ key: 'code', title: 'Code', },
		{ key: 'voucherNumber', title: 'Voucher', },
		{ key: 'modifiedOn', title: 'Modified On', type: "date" },
		{ key: 'status', title: 'Status', },
	];

	const openEditModal = async (acc: any = null) => {
		setShowModal(true);
		setForm({ ...acc, moduleCode })
		// @ts-ignore
		await dispatch(getCustomMasterSchema({ moduleCode }));
		setErrors({});
	};

	const renderSchemaField = (field: any, errors: any) => {
		// @ts-ignore
		const value = form?.[field.key] ?? "";

		const commonProps = {
			label: field.label,
			mandatory: field.isRequired,
			value,
			placeholder: `Enter ${field.label}`,
			error: errors?.[field.key],
		};

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
					// type={regex?.[field.key]?.type}
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
					// @ts-ignore
					error={commonProps.error}
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


		if (field.type === "date") {
			return (
				<TextInput
					key={field.key}
					// @ts-ignore
					error={commonProps.error}
					{...commonProps}
					type="date"
					value={
						form[field.key]
							? new Date(form[field.key]).toISOString().split("T")[0]
							: ""
					}
					onChange={(e: any) =>
						setForm({
							...form,
							[field.key]: e.target.value,
						})
					}
				/>
			);
		}

		if (field.type === "select") {
			const options = field?.options?.reduce((a: any, c: any) => {
				a.push({ label: c, value: c })
				return a
			}, [])
			return (
				<SelectInput
					key={field.key}
					label={commonProps?.label}
					mandatory={commonProps?.mandatory}
					value={form?.[field.key] ?? ""}
					placeholder={`Select ${field.label}`}
					error={commonProps?.error}
					onChange={(e: any) => {
						setForm((pre: any) => ({ ...pre, [field?.key]: e?.target.value }))
					}}
					options={[
						...options]}
				/>
			);
		}
		return (
			<TextInput
				key={field.key}
				{...commonProps}
				error={errors?.[field.key]}
				value={field?.autoGen ? field?.autoGen : form?.[field?.key]}
				disabled={field?.disabled}
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

	const handleSubmit = async () => {
		let err: any = {};

		addInput?.forEach((field: any) => {
			const value = form?.[field.key];

			if (field.isRequired && (value === undefined || value === null || String(value).trim() === "")) {
				err[field.key] = `${field.label} is required`;
			}
		});

		setErrors(err);
		if (Object.keys(err).length > 0) return;
		if (edit) {
			// @ts-ignore
			await dispatch(updateCustomData({ data: { ...form }, voucherNumber: form?.voucherNumber, }));
		} else {
			// @ts-ignore
			await dispatch(saveCustomData({ data: { ...form }, moduleCode, }));
		}
		// @ts-ignore
		await dispatch(getCustomMasterListing({ moduleCode, offset: 0, limit: 10, }));
		setShowModal(false);
		setForm({});
		setErrors({});
	};

	const handleDeleteConfirm = async () => {
		try {
			// @ts-ignore
			await dispatch(deleteSingle({ voucherNumber: confirmTooltip?.voucherNumber }));
			toast.success("Data deleted");
			// @ts-ignore
			await dispatch(getCustomMasterListing({ moduleCode, offset: 0, limit: 10 }));
		} finally {
			setConfirmTooltip({ show: false, x: null, y: null, accountCode: null });
		}
	};

	const fetchAccounts = () => {
		// @ts-ignore
		dispatch(searchData({ voucherNumber: search }))
	};

	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 400);

		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		// @ts-ignore
		dispatch(getCustomMasterListing({ moduleCode, offset: localOffset, limit: localLimit }))
	}, [])

	useEffect(() => {
		fetchAccounts();
	}, [localOffset, localLimit, debouncedSearch]);

	return (
		<div className="w-full bg-white border border-gray-200 shadow-sm p-4 flex flex-col h-[100%]">
			<div className="flex justify-end items-center mb-3">
				<div className="me-2">
					<SearchInput {...{ search, setSearch }} />
				</div>
				<PrimaryButton {...{
					text: "Add", callBackFn: () => {
						openEditModal();
						setEdit(false);
					}
				}} />
			</div>
			<DataTable
				columns={columns}
				data={listing}
				loading={loading}
				emptyMessage="No data found"
				actions={(acc: any) => (
					<div className="flex items-center gap-2">
						{/* EDIT */}
						<button
							id="account-edit-button"
							onClick={() => {
								setEdit(true);
								openEditModal(acc)
							}}
							className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer">
							<Edit size={16} />
						</button>

						{/* DELETE */}
						<button
							id="account-delete-button"
							onClick={(e: any) => {
								const rect = e.currentTarget.getBoundingClientRect();
								let x: any = rect.left - 150;
								if (x < 10) x = 10;
								const y: any = rect.top + window.scrollY - 5;
								setConfirmTooltip({ show: true, x, y, voucherNumber: acc.voucherNumber, });
							}}
							className="p-2 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			{pagination.totalDocs > 0 && <Pagination  {...{
				localLimit, selectCb: (e: any) => {
					setLocalLimit(Number(e.target.value));
					setLocalOffset(0);
				},
				preDisabled: !pagination.hasPrevPage,
				nextDisabled: !pagination.hasNextPage,
				setLocalOffset, pagination
			}} />}

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
							voucherNumber: null,
						})
					}
				/>
			)}
			{/* @ts-ignore */}
			<Modal
				{...{
					show: showModal,
					setShow: setShowModal,
					handleSubmit,
					loader: submitLoader,
					state: edit,
					title: "Add New Account",
					body: (
						<>
							{schemaLoading ? (
								<div className="py-6 text-sm text-gray-500">
									Loading account fields...
								</div>
							) : (
								addInput.map((field: any) =>
									renderSchemaField(field, errors)
								)
							)}
						</>
					),
				}}
			/>
		</div>
	);
};

export default CustomMasterComp;