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
	fetchMasterOptions,
} from "../../../redux/slices/professionalSlice/customMasterModuleSlice";
import SearchInput from "../../../components/searchInput";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/modal";
import { SelectInput, TextArea, TextInput, ToggleInput } from "../../../components/inputs";
import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import { toast } from "react-toastify";
import { PrimaryButton } from "../../../components/buttons";
import Pagination from "../../../components/pagination";

type CustomMasterCompProps = {
	name?: string;
	moduleCode?: string;
};

const DEPENDS_ON_KEY_MAP: Record<string, string> = {
	state: "statemaster",
};

const getDependsOnKey = (field: any): string | null => {
	if (!field?.dependsOn) return null;

	return (
		DEPENDS_ON_KEY_MAP[
		field.dependsOn
		] ||
		field.dependsOn
	);
};

const API_PREFIX =
	"/eTaxSolnMongoApiBackend";

const FIELD_DATA_SOURCE_OVERRIDES: Record<string, string> = {
	vendor:
		"/users/accounts/getAll?offset=0&limit=999999&type=vendor",
};

const getCurrentUserMobileHash = (): string => {
	try {
		const stored =
			localStorage.getItem(
				"professionalUser"
			);

		if (!stored) {
			return "";
		}

		const user =
			JSON.parse(
				stored
			);

		return (
			user?.userMobileNumberHash ||
			""
		);
	} catch (e) {
		return "";
	}
};

const buildApiUrl = (
	field: any,
	formState: any
): string | null => {
	const template =
		field?.dataSource?.api ||
		FIELD_DATA_SOURCE_OVERRIDES[
		field?.key
		];

	if (!template) {
		return null;
	}

	const depKey =
		getDependsOnKey(
			field
		);

	const filled =
		template.replace(
			/{(.*?)}/g,
			(
				_match: string,
				token: string
			) => {
				if (
					token ===
					"userMobileNumberHash"
				) {
					return encodeURIComponent(
						getCurrentUserMobileHash()
					);
				}

				if (
					token ===
					"stateCode"
				) {
					const stateValue =
						depKey
							? formState?.[
							depKey
							]
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
							""
						);
					}

					return encodeURIComponent(
						String(
							stateValue ||
							""
						)
					);
				}

				const tokenValue =
					formState?.[
					token
					];

				if (
					tokenValue &&
					typeof tokenValue ===
					"object"
				) {
					return encodeURIComponent(
						tokenValue.code ||
						tokenValue.isoCode ||
						tokenValue.value ||
						""
					);
				}

				return encodeURIComponent(
					String(
						tokenValue ||
						""
					)
				);
			}
		);

	return filled.startsWith(
		API_PREFIX
	)
		? filled
		: `${API_PREFIX}${filled}`;
};

const hasDynamicSource = (
	field: any
): boolean =>
	!!field?.dataSource ||
	!!FIELD_DATA_SOURCE_OVERRIDES[
	field?.key
	];

const getBooleanValue = (
	value: any
): boolean => {
	if (
		typeof value ===
		"boolean"
	) {
		return value;
	}

	if (
		typeof value ===
		"number"
	) {
		return (
			value ===
			1
		);
	}

	if (
		typeof value ===
		"string"
	) {
		return [
			"true",
			"1",
			"yes",
			"on"
		].includes(
			value
				.trim()
				.toLowerCase()
		);
	}

	return Boolean(
		value
	);
};

const getFieldType = (
	field: any
): string => {
	return String(
		field?.type ||
		"string"
	)
		.trim()
		.toLowerCase();
};

type NormalizeContext = {
	currentUserHash: string
};

const FIELD_NORMALIZERS: Record<
	string,
	(
		raw: any,
		context: NormalizeContext
	) => {
		label: string;
		value: string;
		raw: any;
	}[]
> = {
	statemaster: (
		raw
	) => {
		const records =
			raw?.records ||
			(
				Array.isArray(
					raw
				)
					? raw
					: []
			);

		return records.map(
			(
				state: any
			) => {
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
					label:
						stateName,

					value:
						stateCode,

					raw: {
						...state,

						stateCode,

						isoCode:
							state?.isoCode ||
							stateCode,

						name:
							typeof state?.name ===
								"object"
								? state.name
								: {
									en:
										stateName,
								},
					},
				};
			}
		);
	},

	citymaster: (
		raw
	) => {
		const records =
			raw?.records ||
			(
				Array.isArray(
					raw
				)
					? raw
					: []
			);

		return records.map(
			(
				record: any
			) => ({
				label:
					record?.name?.en ||
					record?.name ||
					"",

				value:
					record?.name?.en ||
					record?.name ||
					"",

				raw:
					record,
			})
		);
	},

	employeemaster: (
		raw,
		context
	) => {
		const results =
			Array.isArray(
				raw?.result
			)
				? raw.result
				: Array.isArray(
					raw
				)
					? raw
					: [];

		const ownParentEntries =
			context.currentUserHash
				? results.filter(
					(
						entry: any
					) =>
						String(
							entry
								?.ParentUser
								?.userMobileNumberHash ||
							""
						) ===
						String(
							context.currentUserHash
						)
				)
				: [];

		const children =
			ownParentEntries
				.flatMap(
					(
						entry: any
					) =>
						Array.isArray(
							entry?.ChildUsers
						)
							? entry.ChildUsers
							: []
				)
				.filter(
					(
						employee: any
					) => {
						const employeeMobile =
							String(
								employee
									?.userMobileNumberHash ||
								employee
									?.userMobileNumber ||
								""
							)
								.trim();

						const parentMobile =
							String(
								employee
									?.parentUserMobileNumber ||
								context.currentUserHash ||
								""
							)
								.trim();

						return (
							employeeMobile &&
							employeeMobile !==
							parentMobile
						);
					}
				);

		return children.map(
			(
				employee: any
			) => {
				const employeeName =
					[
						employee
							?.userFirstName,

						employee
							?.userMiddleName,

						employee
							?.userLastName,
					]
						.filter(
							Boolean
						)
						.join(
							" "
						)
						.trim();

				const mobileHash =
					employee
						?.userMobileNumberHash ||
					employee
						?.mobileNumberHash ||
					employee
						?.userMobileNumber ||
					"";

				return {
					label:
						employeeName ||
						mobileHash ||
						"Unnamed employee",

					value:
						String(
							mobileHash
						),

					raw: {
						userMobileNumberHash:
							mobileHash,

						userFirstName:
							employee
								?.userFirstName ||
							"",

						userMiddleName:
							employee
								?.userMiddleName ||
							"",

						userLastName:
							employee
								?.userLastName ||
							"",

						userType:
							employee
								?.userType ||
							"",

						parentUserMobileNumber:
							employee
								?.parentUserMobileNumber ||
							context.currentUserHash ||
							"",
					},
				};
			}
		);
	},

	vendor: (
		raw
	) => {
		const items =
			raw?.items ||
			(
				Array.isArray(
					raw
				)
					? raw
					: []
			);

		return items.map(
			(
				account: any
			) => ({
				label:
					account
						?.accountName ||
					account
						?.accountCode ||
					"",

				value:
					account
						?.accountCode ||
					"",

				raw: {
					code:
						account
							?.accountCode,

					name:
						account
							?.accountName,
				},
			})
		);
	},
};

const normalizeGeneric = (
	raw: any
): {
	label: string;
	value: string;
	raw: any;
}[] => {
	const list =
		Array.isArray(
			raw
		)
			? raw
			: Array.isArray(
				raw?.items
			)
				? raw.items
				: Array.isArray(
					raw?.docs
				)
					? raw.docs
					: Array.isArray(
						raw?.records
					)
						? raw.records
						: [];

	return list.map(
		(
			item: any
		) => {
			if (
				item &&
				typeof item ===
				"object"
			) {
				const label =
					typeof item.name ===
						"string"
						? item.name
						: item.name?.en ??
						item.label ??
						"";

				return {
					label:
						label ||
						String(
							item.code ??
							item.value ??
							""
						),

					value:
						item.code ??
						item.value ??
						item._id ??
						item.id ??
						"",

					raw:
						item,
				};
			}

			return {
				label:
					String(
						item
					),

				value:
					item,

				raw:
					item,
			};
		}
	);
};

const CustomMasterComp = ({
	moduleCode = "",
	name = ""
}: CustomMasterCompProps) => {
	const dispatch =
		useDispatch<any>();

	const {
		listing,
		inputSchema,
		loading,
		submitLoader,
		schemaLoading,
		pagination
	} = useSelector(
		(
			state: any
		) =>
			state.customMasterModule
	);

	const [
		showModal,
		setShowModal
	] =
		useState(
			false
		);

	const [
		edit,
		setEdit
	] =
		useState(
			false
		);

	const [
		errors,
		setErrors
	]: any =
		useState(
			{}
		);

	const [
		form,
		setForm
	]: any =
		useState(
			{}
		);

	const [
		search,
		setSearch
	] =
		useState(
			""
		);

	const [
		debouncedSearch,
		setDebouncedSearch
	] =
		useState(
			""
		);

	const [
		localOffset,
		setLocalOffset
	] =
		useState(
			0
		);

	const [
		localLimit,
		setLocalLimit
	] =
		useState(
			10
		);

	const [
		dynamicOptions,
		setDynamicOptions
	]: any =
		useState(
			{}
		);

	const [
		dynamicLoading,
		setDynamicLoading
	]: any =
		useState(
			{}
		);

	const [
		dynamicErrors,
		setDynamicErrors
	]: any =
		useState(
			{}
		);

	const [
		confirmTooltip,
		setConfirmTooltip
	]: any =
		useState({
			show:
				false,

			x:
				null,

			y:
				null,

			voucherNumber:
				null,
		});

	const addInput = [
		{
			key:
				"moduleCode",

			label:
				"Module Code",

			type:
				"string",

			disabled:
				true
		},

		{
			key:
				"voucherNumber",

			label:
				"Voucher Number",

			autoGen:
				"Auto Generated",

			type:
				"string",

			disabled:
				true
		},

		...inputSchema
	];

	const columns = [
		{
			key:
				"name",

			title:
				"Name",
		},

		{
			key:
				"code",

			title:
				"Code",
		},

		{
			key:
				"voucherNumber",

			title:
				"Voucher",
		},

		{
			key:
				"modifiedOn",

			title:
				"Modified On",

			type:
				"date"
		},

		{
			key:
				"status",

			title:
				"Status",
		},
	];

	const updateField = (
		key: string,
		value: any
	) => {
		setForm(
			(
				prev: any
			) => ({
				...prev,

				[key]:
					value,
			})
		);

		setErrors(
			(
				prev: any
			) => ({
				...prev,

				[key]:
					"",
			})
		);
	};

	const fetchDynamicOptions = async (
		field: any,
		formState: any
	) => {
		const url =
			buildApiUrl(
				field,
				formState
			);

		if (!url) {
			return;
		}

		setDynamicLoading(
			(
				prev: any
			) => ({
				...prev,

				[field.key]:
					true
			})
		);

		setDynamicErrors(
			(
				prev: any
			) => ({
				...prev,

				[field.key]:
					null
			})
		);

		try {
			const payload: any =
				await dispatch(
					fetchMasterOptions({
						key:
							field.key,

						url
					})
				)
					.unwrap();

			const raw =
				payload?.data;

			const normalize =
				FIELD_NORMALIZERS[
				getFieldType(
					field
				)
				] ||
				FIELD_NORMALIZERS[
				field.key
				] ||
				normalizeGeneric;

			const options =
				normalize(
					raw,
					{
						currentUserHash:
							getCurrentUserMobileHash()
					}
				);

			setDynamicOptions(
				(
					prev: any
				) => ({
					...prev,

					[field.key]:
						options
				})
			);
		} catch (e) {
			setDynamicOptions(
				(
					prev: any
				) => ({
					...prev,

					[field.key]:
						[]
				})
			);

			setDynamicErrors(
				(
					prev: any
				) => ({
					...prev,

					[field.key]:
						`Couldn't load ${field.label}`
				})
			);
		} finally {
			setDynamicLoading(
				(
					prev: any
				) => ({
					...prev,

					[field.key]:
						false
				})
			);
		}
	};

	const handleMasterFieldChange = (
		field: any,
		value: string
	) => {
		setForm(
			(
				prev: any
			) => {
				const next = {
					...prev,

					[field.key]:
						value
				};

				addInput.forEach(
					(
						dependentField: any
					) => {
						if (
							getDependsOnKey(
								dependentField
							) ===
							field.key
						) {
							next[
								dependentField.key
							] =
								"";
						}
					}
				);

				return next;
			}
		);

		setErrors(
			(
				prev: any
			) => ({
				...prev,

				[field.key]:
					"",
			})
		);

		addInput.forEach(
			(
				dependentField: any
			) => {
				if (
					getDependsOnKey(
						dependentField
					) ===
					field.key
				) {
					setDynamicOptions(
						(
							prev: any
						) => ({
							...prev,

							[dependentField.key]:
								[]
						})
					);

					if (
						value
					) {
						fetchDynamicOptions(
							dependentField,
							{
								...form,

								[field.key]:
									value
							}
						);
					}
				}
			}
		);
	};

	const getSelectDisplayValue = (
		field: any,
		value: any
	): string => {
		if (
			value ===
			undefined ||
			value ===
			null
		) {
			return "";
		}

		if (
			typeof value !==
			"object"
		) {
			return String(
				value
			);
		}

		const fieldType =
			getFieldType(
				field
			);

		if (
			fieldType ===
			"statemaster"
		) {
			return (
				value.isoCode ||
				value.stateCode ||
				value.code ||
				""
			);
		}

		if (
			fieldType ===
			"citymaster"
		) {
			return (
				value?.name?.en ||
				value?.name ||
				value.code ||
				""
			);
		}

		if (
			fieldType ===
			"employeemaster"
		) {
			return (
				value
					.userMobileNumberHash ||
				""
			);
		}

		if (
			fieldType ===
			"custommaster"
		) {
			return (
				value.code ||
				value.value ||
				value._id ||
				""
			);
		}

		if (
			field?.key ===
			"vendor"
		) {
			return (
				value.code ||
				""
			);
		}

		return (
			value.code ||
			value.value ||
			""
		);
	};

	const resolveSubmitValue = (
		field: any,
		currentValue: any
	) => {
		if (
			!hasDynamicSource(
				field
			)
		) {
			return currentValue;
		}

		if (
			currentValue &&
			typeof currentValue ===
			"object"
		) {
			return currentValue;
		}

		const options =
			dynamicOptions[
			field.key
			] ||
			[];

		const match =
			options.find(
				(
					option: any
				) =>
					String(
						option.value
					) ===
					String(
						currentValue
					)
			);

		return (
			match?.raw ??
			currentValue
		);
	};

	const openEditModal = async (
		acc: any = null
	) => {
		setShowModal(
			true
		);

		setForm({
			...acc,

			moduleCode
		});

		setDynamicOptions(
			{}
		);

		setDynamicLoading(
			{}
		);

		setDynamicErrors(
			{}
		);

		await dispatch(
			getCustomMasterSchema({
				moduleCode
			})
		);

		setErrors(
			{}
		);
	};

	useEffect(
		() => {
			if (
				!showModal ||
				schemaLoading
			) {
				return;
			}

			addInput.forEach(
				(
					field: any
				) => {
					if (
						hasDynamicSource(
							field
						) &&
						!field?.dependsOn
					) {
						fetchDynamicOptions(
							field,
							form
						);
					}
				}
			);

			addInput.forEach(
				(
					field: any
				) => {
					const depKey =
						getDependsOnKey(
							field
						);

					if (
						hasDynamicSource(
							field
						) &&
						depKey &&
						form?.[
						depKey
						]
					) {
						fetchDynamicOptions(
							field,
							form
						);
					}
				}
			);

			// eslint-disable-next-line react-hooks/exhaustive-deps
		},
		[
			showModal,
			schemaLoading,
			inputSchema
		]
	);

	const renderSchemaField = (
		field: any
	) => {
		const fieldType =
			getFieldType(
				field
			);

		const value =
			form?.[
			field.key
			] ?? "";

		const commonProps = {
			label:
				field.label,

			mandatory:
				field.isRequired ||
				field.required,

			value,

			placeholder:
				field.placeholder ||
				`Enter ${field.label}`,

			error:
				errors?.[
				field.key
				],

			disabled:
				field.disabled ||
				field.isReadonly ||
				submitLoader,
		};

		/* ========================================
		   MASTER / CUSTOM MASTER REFERENCE
		========================================= */

		if (
			hasDynamicSource(
				field
			)
		) {
			const depKey =
				getDependsOnKey(
					field
				);

			const parentField =
				depKey
					? addInput.find(
						(
							item: any
						) =>
							item.key ===
							depKey
					)
					: null;

			const parentValue =
				depKey
					? getSelectDisplayValue(
						parentField,
						form?.[
						depKey
						]
					)
					: "";

			const waitingOnParent =
				Boolean(
					depKey
				) &&
				!parentValue;

			const isLoading =
				Boolean(
					dynamicLoading[
					field.key
					]
				);

			const options =
				dynamicOptions[
				field.key
				] ||
				[];

			const selectedValue =
				getSelectDisplayValue(
					field,
					value
				);

			return (
				<SelectInput
					key={
						field.key
					}
					name={
						field.key
					}
					label={
						field.label
					}
					mandatory={
						field.isRequired ||
						field.required
					}
					value={
						selectedValue
					}
					placeholder={
						isLoading
							? "Loading..."
							: waitingOnParent
								? `Select ${parentField?.label || "the related field"} first`
								: `Select ${field.label}`
					}
					error={
						errors?.[
						field.key
						] ||
						dynamicErrors[
						field.key
						]
					}
					largeData={
						true
					}
					disabled={
						field.disabled ||
						field.isReadonly ||
						submitLoader ||
						waitingOnParent ||
						isLoading
					}
					styles={{
						menuPortal: (
							base: any
						) => ({
							...base,

							zIndex:
								2147483647,
						}),

						menu: (
							base: any
						) => ({
							...base,

							zIndex:
								2147483647,
						}),
					}}
					options={[
						{
							value:
								"",

							label:
								isLoading
									? `Loading ${field.label}...`
									: options.length >
										0
										? `Select ${field.label}`
										: `No ${field.label} found`,
						},

						...options.map(
							(
								option: any
							) => ({
								label:
									option.label,

								value:
									option.value,
							})
						),
					]}
					onChange={(
						event: any
					) => {
						handleMasterFieldChange(
							field,

							event?.target
								?.value ??
							""
						);
					}}
				/>
			);
		}

		/* ========================================
		   NORMAL SELECT
		========================================= */

		if (
			fieldType ===
			"select"
		) {
			const options =
				(
					field?.options ||
					[]
				).map(
					(
						option: any
					) => {
						if (
							option &&
							typeof option ===
							"object"
						) {
							return {
								label:
									option.label ??
									option.name ??
									option.value ??
									option.code ??
									"",

								value:
									option.value ??
									option.code ??
									option.name ??
									"",
							};
						}

						return {
							label:
								String(
									option
								),

							value:
								option,
						};
					}
				);

			return (
				<SelectInput
					key={
						field.key
					}
					name={
						field.key
					}
					label={
						field.label
					}
					mandatory={
						field.isRequired ||
						field.required
					}
					value={
						value
					}
					placeholder={
						`Select ${field.label}`
					}
					error={
						errors?.[
						field.key
						]
					}
					largeData={
						true
					}
					disabled={
						field.disabled ||
						field.isReadonly ||
						submitLoader
					}
					styles={{
						menuPortal: (
							base: any
						) => ({
							...base,

							zIndex:
								2147483647,
						}),

						menu: (
							base: any
						) => ({
							...base,

							zIndex:
								2147483647,
						}),
					}}
					options={
						options
					}
					onChange={(
						event: any
					) => {
						updateField(
							field.key,

							event?.target
								?.value ??
							""
						);
					}}
				/>
			);
		}

		/* ========================================
		   BOOLEAN
		========================================= */

		if (
			fieldType ===
			"boolean"
		) {
			const booleanValue =
				getBooleanValue(
					form?.[
					field.key
					]
				);

			return (
				<ToggleInput
					key={
						field.key
					}
					label={
						field.label
					}
					name={
						field.key
					}
					value={
						booleanValue
					}
					checked={
						booleanValue
					}
					mandatory={
						field.isRequired ||
						field.required
					}
					error={
						errors?.[
						field.key
						]
					}
					disabled={
						field.disabled ||
						field.isReadonly ||
						submitLoader
					}
					onChange={(
						event: any
					) => {
						updateField(
							field.key,

							getBooleanValue(
								event?.target
									?.checked ??
								event?.target
									?.value
							)
						);
					}}
				/>
			);
		}

		/* ========================================
		   NUMBER
		========================================= */

		if (
			fieldType ===
			"number"
		) {
			return (
				<TextInput
					key={
						field.key
					}
					{...commonProps}
					type="number"
					onChange={(
						event: any
					) => {
						updateField(
							field.key,

							event.target
								.value
						);
					}}
				/>
			);
		}

		/* ========================================
		   TEXTAREA
		========================================= */

		if (
			fieldType ===
			"textarea"
		) {
			return (
				<TextArea
					key={
						field.key
					}
					{...commonProps}
					onChange={(
						event: any
					) => {
						updateField(
							field.key,

							event.target
								.value
						);
					}}
				/>
			);
		}

		/* ========================================
		   DATE
		========================================= */

		if (
			fieldType ===
			"date"
		) {
			let dateValue =
				"";

			if (
				value
			) {
				const date =
					new Date(
						value
					);

				if (
					!Number.isNaN(
						date.getTime()
					)
				) {
					dateValue =
						date
							.toISOString()
							.split(
								"T"
							)[0];
				}
			}

			return (
				<TextInput
					key={
						field.key
					}
					{...commonProps}
					type="date"
					value={
						dateValue
					}
					onChange={(
						event: any
					) => {
						updateField(
							field.key,

							event.target
								.value
						);
					}}
				/>
			);
		}

		/* ========================================
		   MOBILE
		========================================= */

		if (
			field.key ===
			"accountMobile"
		) {
			return (
				<TextInput
					key={
						field.key
					}
					{...commonProps}
					type="text"
					onChange={(
						event: any
					) => {
						updateField(
							field.key,

							event.target
								.value
								.replace(
									/\D/g,
									""
								)
								.slice(
									0,
									10
								)
						);
					}}
				/>
			);
		}

		/* ========================================
		   EMAIL
		========================================= */

		if (
			field.key ===
			"accountEmail"
		) {
			return (
				<TextInput
					key={
						field.key
					}
					{...commonProps}
					type="email"
					onChange={(
						event: any
					) => {
						updateField(
							field.key,

							event.target
								.value
						);
					}}
				/>
			);
		}

		/* ========================================
		   STRING
		========================================= */

		return (
			<TextInput
				key={
					field.key
				}
				{...commonProps}
				type="text"
				value={
					field?.autoGen
						? field.autoGen
						: value
				}
				onChange={(
					event: any
				) => {
					updateField(
						field.key,

						event.target
							.value
					);
				}}
			/>
		);
	};

	const handleSubmit = async () => {
		let err: Record<
			string,
			string
		> = {};

		addInput.forEach(
			(
				field: any
			) => {
				const value =
					form?.[
					field.key
					];

				const isEmpty =
					value ===
					undefined ||
					value ===
					null ||
					(
						typeof value ===
						"string" &&
						value.trim() ===
						""
					);

				if (
					(
						field.isRequired ||
						field.required
					) &&
					isEmpty
				) {
					err[
						field.key
					] =
						`${field.label} is required`;
				}
			}
		);

		setErrors(
			err
		);

		if (
			Object.keys(
				err
			).length >
			0
		) {
			return;
		}

		const submitData =
			addInput.reduce(
				(
					acc: Record<
						string,
						any
					>,

					field: any
				) => {
					const currentValue =
						form?.[
						field.key
						];

					if (
						currentValue ===
						undefined
					) {
						return acc;
					}

					acc[
						field.key
					] =
						resolveSubmitValue(
							field,
							currentValue
						);

					return acc;
				},
				{
					...form,

					moduleCode,
				}
			);

		const objectRequiredFields = [
			"vendor",
			"customemployeemaster",
			"statemaster",
			"citymaster",
		];

		objectRequiredFields.forEach(
			(
				key
			) => {
				const schemaField =
					addInput.find(
						(
							field: any
						) =>
							field.key ===
							key
					);

				if (
					!schemaField
				) {
					return;
				}

				const value =
					submitData[
					key
					];

				if (
					value !==
					undefined &&
					value !==
					null &&
					typeof value !==
					"object"
				) {
					err[
						key
					] =
						`${schemaField.label} selection could not be resolved. Please select it again.`;
				}
			}
		);

		if (
			Object.keys(
				err
			).length >
			0
		) {
			setErrors(
				err
			);

			return;
		}

		try {
			if (
				edit
			) {
				await dispatch(
					updateCustomData({
						data:
							submitData,

						voucherNumber:
							form
								?.voucherNumber,
					})
				)
					.unwrap();
			} else {
				await dispatch(
					saveCustomData({
						data:
							submitData,

						moduleCode,
					})
				)
					.unwrap();
			}

			await dispatch(
				getCustomMasterListing({
					moduleCode,

					offset:
						localOffset,

					limit:
						localLimit,
				})
			)
				.unwrap();

			toast.success(
				edit
					? "Data updated successfully"
					: "Data saved successfully"
			);

			setShowModal(
				false
			);

			setForm(
				{}
			);

			setErrors(
				{}
			);

			setDynamicOptions(
				{}
			);

			setDynamicErrors(
				{}
			);
		} catch (
		error: any
		) {
			const message =
				error?.message ||
				error?.data
					?.message ||
				"Unable to save the data.";

			toast.error(
				message
			);
		}
	};

	const handleDeleteConfirm =
		async () => {
			try {
				await dispatch(
					deleteSingle({
						voucherNumber:
							confirmTooltip
								?.voucherNumber
					})
				);

				toast.success(
					"Data deleted"
				);

				await dispatch(
					getCustomMasterListing({
						moduleCode,

						offset:
							0,

						limit:
							10
					})
				);
			} finally {
				setConfirmTooltip({
					show:
						false,

					x:
						null,

					y:
						null,

					voucherNumber:
						null
				});
			}
		};

	const fetchAccounts =
		() => {
			dispatch(
				searchData({
					voucherNumber:
						moduleCode
				})
			);
		};

	useEffect(
		() => {
			const timer =
				setTimeout(
					() => {
						setDebouncedSearch(
							search
								.trim()
						);
					},
					400
				);

			return () =>
				clearTimeout(
					timer
				);
		},
		[
			search
		]
	);

	useEffect(
		() => {
			dispatch(
				getCustomMasterListing({
					moduleCode,

					offset:
						localOffset,

					limit:
						localLimit
				})
			);
		},
		[]
	);

	useEffect(
		() => {
			fetchAccounts();
		},
		[
			localOffset,
			localLimit,
			debouncedSearch
		]
	);

	return (
		<div className="w-full bg-white border border-gray-200 shadow-sm p-4 flex flex-col h-[100%]">
			<div className="flex justify-end items-center mb-3">
				<div className="me-2">
					<SearchInput
						{...{
							search,
							setSearch
						}}
					/>
				</div>

				<PrimaryButton
					{...{
						text:
							"Add",

						callBackFn:
							() => {
								openEditModal();

								setEdit(
									false
								);
							}
					}}
				/>
			</div>

			<DataTable
				columns={
					columns
				}
				data={
					listing
				}
				loading={
					loading
				}
				emptyMessage="No data found"
				actions={(
					acc: any
				) => (
					<div className="flex items-center gap-2">
						<button
							id="account-edit-button"
							onClick={() => {
								setEdit(
									true
								);

								openEditModal(
									acc
								);
							}}
							className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer"
						>
							<Edit
								size={
									16
								}
							/>
						</button>

						<button
							id="account-delete-button"
							onClick={(
								event: any
							) => {
								const rect =
									event
										.currentTarget
										.getBoundingClientRect();

								let x: any =
									rect.left -
									150;

								if (
									x <
									10
								) {
									x =
										10;
								}

								const y: any =
									rect.top +
									window.scrollY -
									5;

								setConfirmTooltip({
									show:
										true,

									x,

									y,

									voucherNumber:
										acc
											.voucherNumber,
								});
							}}
							className="p-2 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer"
						>
							<Trash2
								size={
									16
								}
							/>
						</button>
					</div>
				)}
			/>

			{
				pagination.totalDocs >
				0 &&
				<Pagination
					{...{
						localLimit,

						selectCb: (
							event: any
						) => {
							setLocalLimit(
								Number(
									event
										.target
										.value
								)
							);

							setLocalOffset(
								0
							);
						},

						preDisabled:
							!pagination
								.hasPrevPage,

						nextDisabled:
							!pagination
								.hasNextPage,

						setLocalOffset,

						pagination
					}}
				/>
			}

			{
				confirmTooltip.show &&
				(
					<ConfirmTooltip
						x={
							confirmTooltip
								.x
						}
						y={
							confirmTooltip
								.y
						}
						message="Are you sure you want to delete this account?"
						confirmText="Delete"
						cancelText="Cancel"
						onConfirm={
							handleDeleteConfirm
						}
						onCancel={() =>
							setConfirmTooltip({
								show:
									false,

								x:
									null,

								y:
									null,

								voucherNumber:
									null,
							})
						}
					/>
				)
			}

			<Modal
				{...{
					show:
						showModal,

					setShow:
						setShowModal,

					handleSubmit,

					loader:
						submitLoader,

					state:
						edit,

					title:
						`${name}`,
					body: (
						<>
							{
								schemaLoading
									? (
										<div className="py-6 text-sm text-gray-500">
											Loading account fields...
										</div>
									)
									: (
										addInput.map(
											(
												field: any
											) =>
												renderSchemaField(
													field
												)
										)
									)
							}
						</>
					),
				}}
			/>
		</div>
	);
};

export default CustomMasterComp;