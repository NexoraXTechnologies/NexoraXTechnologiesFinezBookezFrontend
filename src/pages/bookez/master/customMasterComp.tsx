import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	deleteSingle,
	getCustomMasterListing,
	getCustomMasterSchema,
	updateCustomData,
	searchData,
	saveCustomData,
	fetchMasterOptions, // NEW: add this thunk to customMasterModuleSlice (see snippet provided separately)
} from "../../../redux/slices/professionalSlice/customMasterModuleSlice";
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

// NOTE: backend inconsistency — the "citymaster" field declares dependsOn: "state",
// but the actual field key in the schema is "statemaster". This map lets the
// dependsOn value resolve to the real form key. Ideally the backend should send
// dependsOn: "statemaster" directly and this map can be deleted.
const DEPENDS_ON_KEY_MAP: Record<string, string> = {
	state: "statemaster",
};

const getDependsOnKey = (field: any): string | null => {
	if (!field?.dependsOn) return null;
	return DEPENDS_ON_KEY_MAP[field.dependsOn] || field.dependsOn;
};

// Every other thunk in customMasterModuleSlice prefixes its path with this
// segment (see getCustomMasterListing, getCustomMasterSchema, etc.), but the
// schema's dataSource.api values (e.g. "/users/statesMaster?...") don't
// include it. Without this prefix the request 404s / hits the wrong route.
const API_PREFIX = "/eTaxSolnMongoApiBackend";

// Fields whose schema doesn't carry a dataSource (e.g. "vendor" currently ships
// hardcoded options: ["okay"]) but that should really pull from another API.
// TODO: confirm the exact accounts endpoint path and the filter param name
// (I'm guessing `type=vendor` per your note — could be `accountType=vendor`).
const FIELD_DATA_SOURCE_OVERRIDES: Record<string, string> = {
	vendor: "/users/accounts/getAll?offset=0&limit=999999&type=vendor",
};

// Confirmed via DevTools -> Application -> Local Storage: the logged-in user
// is stored as a JSON object under the "professionalUser" key (see
// professionalHeaders too, which mirrors "x-db-name" to the same value), not
// a flat "userMobileNumberHash" key. Its userMobileNumberHash field is the
// parent's own mobile number hash.
const getCurrentUserMobileHash = (): string => {
	try {
		const stored = localStorage.getItem("professionalUser");
		if (!stored) return "";
		const user = JSON.parse(stored);
		return user?.userMobileNumberHash || "";
	} catch (e) {
		return "";
	}
};

// Fills placeholders like {stateCode} / {userMobileNumberHash} in a dataSource.api URL.
const buildApiUrl = (field: any, formState: any): string | null => {
	const template = field?.dataSource?.api || FIELD_DATA_SOURCE_OVERRIDES[field?.key];
	if (!template) return null;

	const depKey = getDependsOnKey(field);

	const filled = template.replace(
		/{(.*?)}/g,
		(_match: string, token: string) => {
			if (
				token ===
				"userMobileNumberHash"
			) {
				return encodeURIComponent(
					getCurrentUserMobileHash(),
				);
			}

			if (token === "stateCode") {
				const stateValue =
					depKey
						? formState?.[depKey]
						: null;

				if (
					stateValue &&
					typeof stateValue ===
					"object"
				) {
					return encodeURIComponent(
						stateValue.isoCode ||
						stateValue.stateCode ||
						stateValue.code ||
						"",
					);
				}

				return encodeURIComponent(
					String(stateValue || ""),
				);
			}

			const tokenValue =
				formState?.[token];

			if (
				tokenValue &&
				typeof tokenValue === "object"
			) {
				return encodeURIComponent(
					tokenValue.code ||
					tokenValue.isoCode ||
					tokenValue.value ||
					"",
				);
			}

			return encodeURIComponent(
				String(tokenValue || ""),
			);
		},
	);

	return filled.startsWith(API_PREFIX) ? filled : `${API_PREFIX}${filled}`;
};

const hasDynamicSource = (field: any): boolean =>
	!!field?.dataSource || !!FIELD_DATA_SOURCE_OVERRIDES[field?.key];

type NormalizeContext = { currentUserHash: string };
const FIELD_NORMALIZERS: Record<string, (raw: any, context: NormalizeContext) => { label: string; value: string; raw: any }[]> = {

	statemaster: (raw) => {
		const records =
			raw?.records ||
			(Array.isArray(raw) ? raw : []);

		return records.map((state: any) => {
			const stateCode =
				state?.stateCode ||
				state?.isoCode ||
				state?.code ||
				"";

			const stateName =
				state?.name?.en ||
				state?.stateName ||
				state?.name ||
				stateCode;

			return {
				label: stateName,
				value: stateCode,

				/*
				 * Submit the backend-required shape.
				 * Keep the original state properties as well.
				 */
				raw: {
					...state,
					stateCode,
					isoCode:
						state?.isoCode ||
						stateCode,
					name:
						typeof state?.name === "object"
							? state.name
							: {
								en: stateName,
							},
				},
			};
		});
	},
	// Same record shape as states — accounts' own "city" field stores the
	// whole {name, countryCode, stateCode, latitude, longitude} object, so
	// submit that instead of just the name string.
	citymaster: (raw) => {
		const records = raw?.records || (Array.isArray(raw) ? raw : []);
		return records.map((r: any) => ({
			label: r?.name?.en || "",
			value: r?.name?.en || "",
			raw: r,
		}));
	},
	// doc 4 shape: { result: [{ ParentUser, ChildUsers: [...] }] }. The API's
	// ?userMobileNumberHash= filter doesn't actually seem to scope the response
	// server-side — doc 7 shows every parent's entry coming back regardless. So
	// we scope it client-side here: only the ChildUsers belonging to the entry
	// whose ParentUser matches the logged-in user should be selectable, not
	// every employee of every parent in the system.
	// raw shape mirrors doc 6's dynamicFields.testaccount / employee_master_test.
	employeemaster: (
		raw,
		context,
	) => {
		const results = Array.isArray(raw?.result)
			? raw.result
			: Array.isArray(raw)
				? raw
				: [];

		const ownParentEntries =
			context.currentUserHash
				? results.filter(
					(entry: any) =>
						String(
							entry?.ParentUser
								?.userMobileNumberHash ||
							"",
						) ===
						String(
							context.currentUserHash,
						),
				)
				: [];

		/*
		 * ParentUser is deliberately not added.
		 * Only ChildUsers are shown.
		 */
		const children =
			ownParentEntries
				.flatMap((entry: any) =>
					Array.isArray(entry?.ChildUsers)
						? entry.ChildUsers
						: []
				)
				.filter((employee: any) => {
					const employeeMobile = String(
						employee?.userMobileNumberHash ||
						employee?.userMobileNumber ||
						""
					).trim();

					const parentMobile = String(
						employee?.parentUserMobileNumber ||
						context.currentUserHash ||
						""
					).trim();

					// Don't show parent user in employee list
					return employeeMobile && employeeMobile !== parentMobile;
				});

		return children.map(
			(employee: any) => {
				const employeeName = [
					employee?.userFirstName,
					employee?.userMiddleName,
					employee?.userLastName,
				]
					.filter(Boolean)
					.join(" ")
					.trim();

				const mobileHash =
					employee?.userMobileNumberHash ||
					employee?.mobileNumberHash ||
					employee?.userMobileNumber ||
					"";

				return {
					label:
						employeeName ||
						mobileHash ||
						"Unnamed employee",

					value: String(mobileHash),

					raw: {
						userMobileNumberHash:
							mobileHash,
						userFirstName:
							employee?.userFirstName ||
							"",
						userMiddleName:
							employee?.userMiddleName ||
							"",
						userLastName:
							employee?.userLastName ||
							"",
						userType:
							employee?.userType ||
							"",
						parentUserMobileNumber:
							employee?.parentUserMobileNumber ||
							context.currentUserHash ||
							"",
					},
				};
			},
		);
	},
	// doc 6 shape: { items: [{ accountCode, accountName, accountType, ... }] }.
	// raw shape mirrors doc 6's dynamicFields.productmasteradded: { code, name }.
	vendor: (raw) => {
		const items = raw?.items || (Array.isArray(raw) ? raw : []);
		return items.map((a: any) => ({
			label: a?.accountName || a?.accountCode || "",
			value: a?.accountCode || "",
			raw: { code: a?.accountCode, name: a?.accountName },
		}));
	},
};

// Fallback for any future dataSource field not covered above — tries the
// common { items } / { docs } / { records } / flat-array shapes.
const normalizeGeneric = (raw: any): { label: string; value: string; raw: any }[] => {
	const list = Array.isArray(raw)
		? raw
		: Array.isArray(raw?.items)
			? raw.items
			: Array.isArray(raw?.docs)
				? raw.docs
				: Array.isArray(raw?.records)
					? raw.records
					: [];
	return list.map((item: any) => {
		if (item && typeof item === "object") {
			const label = typeof item.name === "string" ? item.name : item.name?.en ?? item.label ?? "";
			return { label: label || String(item.code ?? item.value ?? ""), value: item.code ?? item.value ?? item._id ?? item.id ?? "", raw: item };
		}
		return { label: String(item), value: item, raw: item };
	});
};

const CustomMasterComp = ({
	//   name = "Custom Master",
	moduleCode = "",
}: CustomMasterCompProps) => {
	const dispatch = useDispatch<any>();
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

	// NEW: options + loading state for dynamic master-backed fields (employeemaster/statemaster/citymaster)
	const [dynamicOptions, setDynamicOptions]: any = useState({});
	const [dynamicLoading, setDynamicLoading]: any = useState({});
	// NEW: per-field error message, shown inline under the field instead of a
	// toast popup — a failed dropdown fetch shouldn't interrupt the whole form
	// with a stacking notification (was firing twice: once from the initial
	// fetch and once from the dependent-field refetch).
	const [dynamicErrors, setDynamicErrors]: any = useState({});

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

	// NEW: fetch options for a single dynamic field and store them
	const fetchDynamicOptions = async (field: any, formState: any) => {
		const url = buildApiUrl(field, formState);
		if (!url) return;

		setDynamicLoading((prev: any) => ({ ...prev, [field.key]: true }));
		setDynamicErrors((prev: any) => ({ ...prev, [field.key]: null }));
		try {
			// @ts-ignore
			const payload: any = await dispatch(fetchMasterOptions({ key: field.key, url })).unwrap();
			const raw = payload?.data;
			const normalize = FIELD_NORMALIZERS[field.type] || FIELD_NORMALIZERS[field.key] || normalizeGeneric;
			const options = normalize(raw, { currentUserHash: getCurrentUserMobileHash() });
			setDynamicOptions((prev: any) => ({ ...prev, [field.key]: options }));
		} catch (e) {
			setDynamicOptions((prev: any) => ({ ...prev, [field.key]: [] }));
			setDynamicErrors((prev: any) => ({ ...prev, [field.key]: `Couldn't load ${field.label}` }));
		} finally {
			setDynamicLoading((prev: any) => ({ ...prev, [field.key]: false }));
		}
	};

	// NEW: when a master field with dependents changes, clear + refetch those dependents
	const handleMasterFieldChange = (field: any, value: string) => {
		setForm((prev: any) => {
			const next = { ...prev, [field.key]: value };
			addInput.forEach((f: any) => {
				if (getDependsOnKey(f) === field.key) {
					next[f.key] = "";
				}
			});
			return next;
		});

		addInput.forEach((f: any) => {
			if (getDependsOnKey(f) === field.key) {
				setDynamicOptions((prev: any) => ({ ...prev, [f.key]: [] }));
				if (value) {
					fetchDynamicOptions(f, { ...form, [field.key]: value });
				}
			}
		});
	};
	const getSelectDisplayValue = (field: any, val: any): string => {
		if (val === undefined || val === null) return "";
		if (typeof val !== "object") return String(val);
		if (field.type === "statemaster") return val.isoCode || "";
		if (field.type === "citymaster") return val?.name?.en || "";
		if (field.type === "employeemaster") return val.userMobileNumberHash || "";
		if (field.key === "vendor") return val.code || "";
		return "";
	};

	const resolveSubmitValue = (
		field: any,
		currentValue: any,
	) => {
		if (!hasDynamicSource(field)) {
			return currentValue;
		}

		if (
			currentValue &&
			typeof currentValue === "object"
		) {
			return currentValue;
		}

		const options =
			dynamicOptions[field.key] || [];

		const match = options.find(
			(option: any) =>
				String(option.value) ===
				String(currentValue),
		);

		return match?.raw ?? currentValue;
	};

	const openEditModal = async (acc: any = null) => {
		setShowModal(true);
		setForm({ ...acc, moduleCode })
		setDynamicOptions({});
		setDynamicLoading({});
		setDynamicErrors({});
		// @ts-ignore
		await dispatch(getCustomMasterSchema({ moduleCode }));
		setErrors({});
	};

	useEffect(() => {
		if (!showModal || schemaLoading) return;
		addInput.forEach((field: any) => {
			if (hasDynamicSource(field) && !field?.dependsOn) {
				fetchDynamicOptions(field, form);
			}
		});

		addInput.forEach((field: any) => {
			const depKey = getDependsOnKey(field);
			if (hasDynamicSource(field) && depKey && form?.[depKey]) {
				fetchDynamicOptions(field, form);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [showModal, schemaLoading, inputSchema]);

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

		if (hasDynamicSource(field)) {
			const depKey = getDependsOnKey(field);

			const parentValue = depKey
				? getSelectDisplayValue(
					addInput.find((item: any) => item.key === depKey),
					form?.[depKey],
				)
				: "";

			const waitingOnParent =
				Boolean(depKey) && !parentValue;

			const isLoading =
				Boolean(dynamicLoading[field.key]);

			const options =
				dynamicOptions[field.key] || [];

			const fieldError =
				commonProps.error ||
				dynamicErrors[field.key];

			const displayValue =
				getSelectDisplayValue(
					field,
					form?.[field.key],
				);

			return (
				<SelectInput
					key={field.key}
					label={commonProps.label}
					mandatory={commonProps.mandatory}
					value={displayValue}
					placeholder={
						isLoading
							? "Loading..."
							: waitingOnParent
								? `Select ${addInput.find(
									(item: any) =>
										item.key === depKey,
								)?.label ||
								"the related field"
								} first`
								: `Select ${field.label}`
					}
					error={fieldError}
					disabled={
						waitingOnParent ||
						isLoading
					}
					onChange={(e: any) =>
						handleMasterFieldChange(
							field,
							e.target.value,
						)
					}
					options={options.map(
						(option: any) => ({
							label: option.label,
							value: option.value,
						}),
					)}
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

	// const handleSubmit = async () => {
	// 	let err: any = {};

	// 	addInput?.forEach((field: any) => {
	// 		const value = form?.[field.key];

	// 		if (field.isRequired && (value === undefined || value === null || String(value).trim() === "")) {
	// 			err[field.key] = `${field.label} is required`;
	// 		}
	// 	});

	// 	setErrors(err);
	// 	if (Object.keys(err).length > 0) return;
	// 	if (edit) {
	// 		// @ts-ignore
	// 		await dispatch(updateCustomData({ data: { ...form }, voucherNumber: form?.voucherNumber, }));
	// 	} else {
	// 		// @ts-ignore
	// 		await dispatch(saveCustomData({ data: { ...form }, moduleCode, }));
	// 	}
	// 	// @ts-ignore
	// 	await dispatch(getCustomMasterListing({ moduleCode, offset: 0, limit: 10, }));
	// 	setShowModal(false);
	// 	setForm({});
	// 	setErrors({});
	// };


	const handleSubmit = async () => {
		let err: Record<string, string> = {};

		addInput.forEach((field: any) => {
			const value = form?.[field.key];

			const isEmpty =
				value === undefined ||
				value === null ||
				(typeof value === "string" && value.trim() === "");

			if (field.isRequired && isEmpty) {
				err[field.key] = `${field.label} is required`;
			}
		});

		setErrors(err);

		if (Object.keys(err).length > 0) {
			return;
		}

		/*
		 * Convert primitive select values into the objects expected
		 * by the backend.
		 */
		const submitData = addInput.reduce(
			(acc: Record<string, any>, field: any) => {
				const currentValue = form?.[field.key];

				if (currentValue === undefined) {
					return acc;
				}

				acc[field.key] = resolveSubmitValue(field, currentValue);

				return acc;
			},
			{
				/*
				 * Preserve metadata fields that may not exist in inputSchema.
				 */
				...form,
				moduleCode,
			},
		);

		/*
		 * Defensive validation before calling the backend.
		 */
		const objectRequiredFields = [
			"vendor",
			"customemployeemaster",
			"statemaster",
			"citymaster",
		];

		objectRequiredFields.forEach((key) => {
			const schemaField = addInput.find(
				(field: any) => field.key === key,
			);

			if (!schemaField) return;

			const value = submitData[key];

			if (
				value !== undefined &&
				value !== null &&
				typeof value !== "object"
			) {
				err[key] =
					`${schemaField.label} selection could not be resolved. Please select it again.`;
			}
		});

		if (Object.keys(err).length > 0) {
			setErrors(err);
			return;
		}

		try {
			if (edit) {
				// @ts-ignore
				await dispatch(
					updateCustomData({
						data: submitData,
						voucherNumber: form?.voucherNumber,
					}),
				).unwrap();
			} else {
				// @ts-ignore
				await dispatch(
					saveCustomData({
						data: submitData,
						moduleCode,
					}),
				).unwrap();
			}

			// @ts-ignore
			await dispatch(
				getCustomMasterListing({
					moduleCode,
					offset: localOffset,
					limit: localLimit,
				}),
			).unwrap();

			toast.success(
				edit
					? "Data updated successfully"
					: "Data saved successfully",
			);

			setShowModal(false);
			setForm({});
			setErrors({});
			setDynamicOptions({});
			setDynamicErrors({});
		} catch (error: any) {
			const message =
				error?.message ||
				error?.data?.message ||
				"Unable to save the data.";

			toast.error(message);
		}
	};
	console.log({ moduleCode })
	const handleDeleteConfirm = async () => {
		try {
			// @ts-ignore
			await dispatch(deleteSingle({ voucherNumber: confirmTooltip?.voucherNumber }));
			toast.success("Data deleted");
			// @ts-ignore
			await dispatch(getCustomMasterListing({ moduleCode, offset: 0, limit: 10 }));
		} finally {
			// FIX: this object previously reset an "accountCode" key that doesn't
			// exist on confirmTooltip's shape — should be voucherNumber.
			setConfirmTooltip({ show: false, x: null, y: null, voucherNumber: null });
		}
	};

	const fetchAccounts = () => {
		// FIX: was reading `search` (pre-debounce) instead of `debouncedSearch`,
		// which made the debounce effect pointless — this fired on every keystroke.
		// @ts-ignore
		dispatch(searchData({ voucherNumber: moduleCode }))
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