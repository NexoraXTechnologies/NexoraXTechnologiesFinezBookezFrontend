import { useEffect, useMemo, useState } from "react";
import {
	ArrowLeft,
	CalendarDays,
	CreditCard,
	Download,
	FileText,
	Flag,
	Map,
	MapPin,
	Paperclip,
	Plus,
	Save,
	Trash2,
	Truck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
	DocumentUploadInput,
	renderField,
} from "../../../../components/inputs";
import {
	createTransportContract,
	getTransportContractByVoucherNumber,
	updateTransportContract,
} from "../../../../redux/slices/professionalSlice/transportation/transportContractSlice";
import { SectionCard } from "../../../../components/SectionCards";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import { num, todayYMD } from "../../../../utils/helperFunctions";
import GoogleAddressAutocompleteWeb from "../../../../components/common/GoogleAddressAutocompleteWeb";
import {
	getCitiesByState,
	getStates,
} from "../../../../redux/slices/professionalSlice/stateCitySlice";

const DESCRIPTION_MAX = 200;

const contractTypeOptions = [
	{ label: "Select Contract Type", value: "" },
	{ label: "Annual", value: "Annual" },
	{ label: "Spot", value: "Spot" },
	{ label: "Monthly", value: "Monthly" },
	{ label: "3 Months", value: "3 Months" },
	{ label: "6 Months", value: "6 Months" },
];

const serviceTypeOptions = [
	{ label: "Select Service Type", value: "" },
	{ label: "Full Truck Load", value: "Full Truck Load" },
	{ label: "Part Load", value: "Part Load" },
	{ label: "Express", value: "Express" },
];

const billingBasisOptions = [
	{ label: "Select Billing Basis", value: "" },
	{ label: "Per Trip", value: "Per Trip" },
	{ label: "Per KM", value: "Per KM" },
	{ label: "Fixed Monthly", value: "Fixed Monthly" },
];

const paymentDaysOptions = [
	{ label: "Select Payment Days", value: "" },
	{ label: "7 Days", value: "7" },
	{ label: "15 Days", value: "15" },
	{ label: "30 Days", value: "30" },
	{ label: "45 Days", value: "45" },
];

// const currencyOptions = [
// 	{ label: "Select Currency", value: "" },
// 	{ label: "INR", value: "INR" },
// 	{ label: "USD", value: "USD" },
// ];

const vehicleTypeOptions = [
	{ label: "Select Vehicle Type", value: "" },
	{ label: "Truck", value: "Truck" },
	{ label: "Pick Up", value: "Pick Up" },
	{ label: "Tipper", value: "Tipper" },
	{ label: "Container", value: "Container" },
	{ label: "Trailer", value: "Trailer" },
	{ label: "LCV", value: "LCV" },
	{ label: "MCV", value: "MCV" },
	{ label: "HCV", value: "HCV" },
];

const loadTypeOptions = [
	{ label: "Select Load Type", value: "" },
	{ label: "Full Truck Load", value: "FTL" },
	{ label: "Part Truck Load", value: "PTL" },
];

const SECTION_KEYS = [
	"contractDetails",
	"contractPeriod",
	"billingTerms",
	"tripCommitment",
	"routeMatrix",
	"documents",
];

const createExpandedSectionsState = () =>
	Object.fromEntries(SECTION_KEYS.map((key) => [key, true]));

/* ===================================================
   SHARED HELPERS
=================================================== */

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

const normalizeText = (value: any) =>
	String(value || "")
		.trim()
		.toLowerCase();

/* ===================================================
   DOCUMENT HELPERS
   Existing / already-uploaded documents (especially when
   editing a contract) may come back from the API using any
   of a few common field names depending on how they were
   stored (S3 url, local path, etc). Check the ones most
   commonly used across this codebase; adjust the list below
   if your API uses a different field name for the file URL.
=================================================== */

const getDocumentUrl = (doc: any) =>
	doc?.url ||
	doc?.fileUrl ||
	doc?.documentUrl ||
	doc?.filePath ||
	doc?.path ||
	doc?.link ||
	doc?.Location ||
	doc?.location ||
	doc?.downloadUrl ||
	"";

const getDocumentName = (doc: any, index: number) =>
	doc?.documentName || doc?.name || doc?.fileName || `Document ${index + 1}`;

/* ===================================================
   ROUTE ROW HELPERS
=================================================== */

const createEmptyRouteRow = () => ({
	id: `${Date.now()}-${Math.random()}`,
	routeCode: "",

	from: "",
	fromAddress: "",
	fromStateCode: "",
	fromStateName: "",
	fromCityName: "",
	fromPincode: "",
	fromLatitude: "",
	fromLongitude: "",
	fromPlaceId: "",

	to: "",
	toAddress: "",
	toStateCode: "",
	toStateName: "",
	toCityName: "",
	toPincode: "",
	toLatitude: "",
	toLongitude: "",
	toPlaceId: "",

	rate: "",
	vehicleType: "",
	loadType: "",
	rateType: "",
});

const createInitialTransportContract = () => ({
	contractNumber: "",
	contractDate: todayYMD(),

	customerCode: "",
	customerName: "",

	contractType: "",
	serviceType: "",
	description: "",

	periodStart: todayYMD(),
	periodEnd: todayYMD(),

	billingBasis: "",
	paymentDays: "",
	currency: "INR",

	totalTrips: "",
	monthlyCommitment: "",
	completedTrips: 0,

	routes: [createEmptyRouteRow()],
	documents: [],
});

const computeBalanceTrips = (form: any) => {
	const totalTrips = num(form?.totalTrips);
	const completedTrips = num(form?.completedTrips);

	return Math.max(totalTrips - completedTrips, 0);
};

const safeDateYMD = (value: any) => {
	if (!value) return todayYMD();

	const dateValue = String(value);

	if (dateValue.includes("T")) {
		return dateValue.slice(0, 10);
	}

	return dateValue.slice(0, 10);
};

const normalizeRouteRow = (row: any = {}, index: number) => ({
	id: row?.id || row?._id || `route-${index}`,
	routeCode: row?.routeCode || "",

	from: row?.from || row?.fromAddress || row?.fromCity || "",
	fromAddress: row?.fromAddress || row?.from || "",
	fromStateCode: row?.fromStateCode || "",
	fromStateName: row?.fromStateName || "",
	fromCityName: row?.fromCityName || row?.fromCity || "",
	fromPincode: row?.fromPincode || "",
	fromLatitude: row?.fromLatitude || "",
	fromLongitude: row?.fromLongitude || "",
	fromPlaceId: row?.fromPlaceId || "",

	to: row?.to || row?.toAddress || row?.toCity || "",
	toAddress: row?.toAddress || row?.to || "",
	toStateCode: row?.toStateCode || "",
	toStateName: row?.toStateName || "",
	toCityName: row?.toCityName || row?.toCity || "",
	toPincode: row?.toPincode || "",
	toLatitude: row?.toLatitude || "",
	toLongitude: row?.toLongitude || "",
	toPlaceId: row?.toPlaceId || "",

	rate: row?.rate || "",
	vehicleType: row?.vehicleType || "",
	loadType: row?.loadType || "",
	rateType: row?.rateType || "",
});

const normalizeContractForForm = (data: any = {}) => {
	const customer = data?.customer || {};
	const contractPeriod = data?.contractPeriod || {};
	const billingTerms = data?.billingTerms || {};
	const tripCommitment = data?.tripCommitment || {};

	return {
		...createInitialTransportContract(),

		contractNumber: data?.contractNumber || data?.voucherNumber || "",
		contractDate: safeDateYMD(data?.contractDate),

		customerCode: data?.customerCode || customer?.customerCode || "",
		customerName: data?.customerName || customer?.customerName || "",

		contractType: data?.contractType || "",
		serviceType: data?.serviceType || "",
		description: data?.description || "",

		periodStart: safeDateYMD(
			data?.periodStart || contractPeriod?.startDate
		),
		periodEnd: safeDateYMD(
			data?.periodEnd || contractPeriod?.endDate
		),

		billingBasis: data?.billingBasis || billingTerms?.billingBasis || "",
		paymentDays: String(
			data?.paymentDays ?? billingTerms?.paymentDays ?? ""
		),
		currency: data?.currency || billingTerms?.currency || "INR",

		totalTrips: String(
			data?.totalTrips ?? tripCommitment?.totalTrips ?? ""
		),
		monthlyCommitment: String(
			data?.monthlyCommitment ??
			tripCommitment?.monthlyCommitment ??
			""
		),
		completedTrips: Number(
			data?.completedTrips ?? tripCommitment?.completedTrips ?? 0
		),

		routes:
			Array.isArray(data?.routes) && data.routes.length
				? data.routes.map(normalizeRouteRow)
				: [createEmptyRouteRow()],

		documents: Array.isArray(data?.documents) ? data.documents : [],
		status: data?.status || "draft",
	};
};

/* ===================================================
   ROUTE LOCATION BLOCK
   Self-contained pickup/delivery picker for a single route row.
   Fetches its OWN city list locally so multiple pickers
   (pickup + delivery, across multiple route rows) never
   clobber each other's state/city selections.
=================================================== */

const RouteLocationBlock = ({
	side, // "from" | "to"
	label, // "Pickup" | "Delivery"
	row,
	states,
	onFieldChange, // (key: string, value: any) => void
}: any) => {
	const dispatch = useDispatch<any>();
	const [cities, setCities] = useState<any[]>([]);
	const [loadingCities, setLoadingCities] = useState(false);

	const stateCode = row?.[`${side}StateCode`] || "";
	const cityName = row?.[`${side}CityName`] || "";

	const findStateByName = (stateNameValue: any) => {
		const clean = normalizeText(stateNameValue);

		return (
			(states || []).find((item: any) => {
				const name = getDisplayName(item?.name || item?.stateName);
				return normalizeText(name) === clean;
			}) || null
		);
	};

	// Fetch this block's own city list whenever ITS state changes
	useEffect(() => {
		if (!stateCode) {
			setCities([]);
			return;
		}

		let active = true;
		setLoadingCities(true);

		dispatch(getCitiesByState({ stateCode, searchText: "" }))
			.unwrap()
			.then((res: any) => {
				if (!active) return;
				const list = Array.isArray(res?.data) ? res.data : res || [];
				setCities(Array.isArray(list) ? list : []);
			})
			.catch(() => {
				if (active) setCities([]);
			})
			.finally(() => {
				if (active) setLoadingCities(false);
			});

		return () => {
			active = false;
		};
	}, [dispatch, stateCode]);

	const hasCurrentCityInOptions = cities.some((item: any) => {
		const name = getDisplayName(item?.name || item?.cityName);
		return normalizeText(name) === normalizeText(cityName);
	});

	const stateOptions = [
		{ label: `Select ${label} State`, value: "" },
		...(states || []).map((item: any) => {
			const code = item?.isoCode || item?.stateCode || item?.code || "";
			const name = getDisplayName(item?.name || item?.stateName);
			return { label: name || code, value: code, stateName: name };
		}),
	];

	const cityOptions = [
		{
			label: stateCode ? `Select ${label} City` : "Select state first",
			value: "",
		},
		...(cityName && !hasCurrentCityInOptions
			? [{ label: cityName, value: cityName }]
			: []),
		...cities.map((item: any) => {
			const name = getDisplayName(item?.name || item?.cityName);
			return { label: name, value: name };
		}),
	];

	const handleAddressSelect = (address: any) => {
		const matchedState = findStateByName(address?.stateName);
		const resolvedStateCode =
			matchedState?.isoCode ||
			matchedState?.stateCode ||
			matchedState?.code ||
			"";
		const resolvedStateName =
			getDisplayName(matchedState?.name || matchedState?.stateName) ||
			address?.stateName ||
			"";
		const resolvedCityName = address?.city || "";
		const fullAddress =
			address?.fullAddress || address?.formattedAddress || "";

		onFieldChange(side, fullAddress || resolvedCityName || "");
		onFieldChange(`${side}Address`, fullAddress);
		onFieldChange(`${side}StateCode`, resolvedStateCode);
		onFieldChange(`${side}StateName`, resolvedStateName);
		onFieldChange(`${side}CityName`, resolvedCityName);
		onFieldChange(`${side}Pincode`, address?.pincode || "");
		onFieldChange(`${side}Latitude`, address?.lat || "");
		onFieldChange(`${side}Longitude`, address?.lng || "");
		onFieldChange(`${side}PlaceId`, address?.placeId || "");

		if (resolvedStateCode) {
			dispatch(
				getCitiesByState({
					stateCode: resolvedStateCode,
					searchText: resolvedCityName || "",
				})
			)
				.unwrap()
				.then((res: any) => {
					const list = Array.isArray(res?.data) ? res.data : res || [];
					setCities(Array.isArray(list) ? list : []);
				})
				.catch(() => { });
		}
	};

	const handleStateChange = (e: any) => {
		const value = e?.target?.value ?? "";
		const selected = stateOptions.find(
			(item: any) => String(item.value) === String(value)
		);

		onFieldChange(`${side}StateCode`, value);
		onFieldChange(`${side}StateName`, selected?.stateName || "");
		onFieldChange(`${side}CityName`, "");
	};

	const handleCityChange = (e: any) => {
		const value = e?.target?.value ?? "";
		onFieldChange(`${side}CityName`, value);
	};

	const handleAddressTextChange = (e: any) => {
		onFieldChange(`${side}Address`, e?.target?.value ?? "");
	};

	return (
		<div className="mb-2 rounded-lg border border-border bg-background p-2">
			{/* <h4 className="mb-2 font-semibold text-primary">
				{side === "from" ? "📍" : "🏁"} {label} Details
			</h4> */}

			<h5 className="mb-2 flex items-center gap-2 text-s font-semibold text-primary">
				{side === "from" ? (
					<MapPin size={18} />
				) : (
					<Flag size={18} />
				)}
				{label} Details
			</h5>

			<GoogleAddressAutocompleteWeb
				label={`${label} Location`}
				placeholder={`Search ${label.toLowerCase()} location`}
				value={row?.[side] || ""}
				country="in"
				onInputChange={(value: string) => onFieldChange(side, value)}
				onSelectAddress={handleAddressSelect}
			/>

			<div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
				{renderField({
					field: {
						key: `${side}StateCode`,
						label: `${label} State`,
						type: "select",
						options: stateOptions,
					},
					form: row,
					handleSelectChange: () => handleStateChange,
					handleInputChange: () => handleStateChange,
				})}

				{renderField({
					field: {
						key: `${side}CityName`,
						label: `${label} City`,
						type: "select",
						options: cityOptions,
						disabled: !stateCode || loadingCities,
					},
					form: row,
					handleSelectChange: () => handleCityChange,
					handleInputChange: () => handleCityChange,
				})}

				{renderField({
					field: {
						key: `${side}Address`,
						label: `${label} Address`,
						type: "textarea",
						// className: "md:col-span-2",
					},
					form: row,
					handleInputChange: () => handleAddressTextChange,
					handleSelectChange: () => handleAddressTextChange,
				})}
			</div>
		</div>
	);
};

/* ===================================================
   EXISTING DOCUMENTS LIST
   Shows each already-attached document (create or edit mode)
   with a Preview (eye) icon that opens the file in a new tab
   and a Download icon that downloads it directly. Sits above
   the upload input so users can see what's already attached
   before adding more, and can remove one if needed.
=================================================== */

const ExistingDocumentsList = ({ documents, onRemove }: any) => {
	const list = Array.isArray(documents) ? documents : [];

	if (!list.length) return null;

	return (
		<div className="mb-4 flex flex-col gap-2">
			<h4 className="text-sm font-semibold text-card-foreground">
				Uploaded Documents ({list.length})
			</h4>

			<div className="flex flex-col gap-2">
				{list.map((doc: any, docIndex: number) => {
					const docUrl = getDocumentUrl(doc);
					const docName = getDocumentName(doc, docIndex);

					return (
						<div
							key={doc?.id || doc?._id || `${docName}-${docIndex}`}
							className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
						>
							<div className="flex min-w-0 items-center gap-2">
								<FileText
									size={16}
									className="shrink-0 text-muted-foreground"
								/>
								<span
									className="truncate text-sm text-card-foreground"
									title={docName}
								>
									{docName}
								</span>
							</div>

							<div className="flex shrink-0 items-center gap-1">
								{/* <button
									type="button"
									disabled={!docUrl}
									onClick={() =>
										docUrl &&
										window.open(docUrl, "_blank", "noopener,noreferrer")
									}
									className="rounded-md p-2 text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
									title="Preview document"
								>
									<Eye size={16} />
								</button> */}

								<a
									href={docUrl || undefined}
									download={docName}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => {
										if (!docUrl) e.preventDefault();
									}}
									className={`rounded-md p-2 text-primary transition hover:bg-primary/10 ${!docUrl ? "pointer-events-none opacity-40" : ""
										}`}
									title="Download document"
								>
									<Download size={16} />
								</a>

								{onRemove && (
									<button
										type="button"
										onClick={() => onRemove(docIndex)}
										className="rounded-md p-2 text-danger transition hover:bg-danger/10"
										title="Remove document"
									>
										<Trash2 size={16} />
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

/* ===================================================
   TRANSPORT CONTRACT CREATE / EDIT
=================================================== */

const CreateEditTransportContract = () => {
	const dispatch = useDispatch<any>();
	const navigate = useNavigate();
	const location = useLocation();

	const [loading, setLoading] = useState(false);

	const [expandedSections, setExpandedSections] = useState<any>(
		createExpandedSectionsState
	);

	const { accounts = [] } = useSelector((state: any) => state.accountMaster);

	const { states = [] } = useSelector(
		(state: any) => state.stateCity || {}
	);

	const params = useParams();

	const routeState: any = location.state || {};

	const contractNumberFromUrl = params?.contractNumber;

	const contractNumberParam =
		routeState?.contractNumber || contractNumberFromUrl;

	const isEdit = routeState?.mode === "edit" || Boolean(contractNumberParam);

	const [form, setForm] = useState<any>(
		routeState?.contractData
			? normalizeContractForForm(routeState.contractData)
			: createInitialTransportContract()
	);

	// Documents that already exist on the contract (loaded from the
	// server / passed in via routeState). Shown ONLY in
	// ExistingDocumentsList (preview / download / remove).
	const [existingDocuments, setExistingDocuments] = useState<any[]>(
		routeState?.contractData
			? normalizeContractForForm(routeState.contractData).documents
			: []
	);

	// Files the user picks in THIS session. Shown ONLY inside
	// DocumentUploadInput's own list (it renders whatever is passed
	// as `value`, so it must never also contain the existing ones).
	const [newDocuments, setNewDocuments] = useState<any[]>([]);

	const pageTitle =
		routeState?.title || (isEdit ? "Edit Contract" : "Create Contract");

	const pageDescription =
		routeState?.description ||
		(isEdit
			? "Update transport contract details."
			: "Create transport contracts with customers, billing terms, trip commitments, and route-wise rate matrix.");

	const balanceTrips = useMemo(() => computeBalanceTrips(form), [form]);

	const customerOption = [
		{ label: "Select Customer", value: "" },
		...(accounts || [])
			.filter((item: any) => item?.accountCode)
			.map((item: any) => ({
				label: item?.accountName || "-",
				value: item?.accountCode || "",
				accountCode: item?.accountCode || "",
				accountName: item?.accountName || "",
			})),
	];

	// Fetch the state list once - each RouteLocationBlock fetches
	// its own city list independently.
	useEffect(() => {
		// @ts-ignore
		dispatch(getStates());
	}, [dispatch]);

	useEffect(() => {
		dispatch(
			getAllAccounts({
				accountType: "customer",
			})
		);
	}, [dispatch]);

	useEffect(() => {
		const fetchContractForEdit = async () => {
			if (!isEdit || !contractNumberParam) return;

			try {
				setLoading(true);

				const res = await dispatch(
					getTransportContractByVoucherNumber(contractNumberParam)
				).unwrap();

				const apiData = res?.data || res;

				if (apiData) {
					const normalized = normalizeContractForForm(apiData);
					setForm(normalized);
					setExistingDocuments(normalized.documents || []);
				}
			} catch (error: any) {
				toast.error(
					error?.message || "Failed to load transport contract"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchContractForEdit();
	}, [dispatch, isEdit, contractNumberParam]);

	/* ===================================================
	   FORM HANDLERS
	=================================================== */

	const updateField = (key: string, value: any) => {
		setForm((prev: any) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleInputChange = (key: string) => (e: any) => {
		updateField(key, e?.target?.value ?? "");
	};

	const handleSelectChange = (key: string) => (e: any) => {
		const value = e?.target?.value ?? "";

		if (key === "customerCode") {
			const selectedCustomer = customerOption.find(
				(item: any) => String(item?.value) === String(value)
			);

			setForm((prev: any) => ({
				...prev,
				customerCode: selectedCustomer?.accountCode || value || "",
				customerName: selectedCustomer?.accountName || "",
			}));

			return;
		}

		updateField(key, value);
	};

	const toggleSection = (sectionKey: string) => {
		setExpandedSections((prev: any) => ({
			...prev,
			[sectionKey]: !prev[sectionKey],
		}));
	};

	const updateRoute = (index: number, key: string, value: any) => {
		setForm((prev: any) => {
			const routes = [...(prev.routes || [])];

			routes[index] = {
				...routes[index],
				[key]: value,
			};

			return {
				...prev,
				routes,
			};
		});
	};

	const handleRouteChange = (index: number, key: string) => (e: any) => {
		updateRoute(index, key, e?.target?.value ?? "");
	};

	const addRouteRow = () => {
		setForm((prev: any) => ({
			...prev,
			routes: [...(prev.routes || []), createEmptyRouteRow()],
		}));
	};

	const removeRouteRow = (index: number) => {
		setForm((prev: any) => ({
			...prev,
			routes: (prev.routes || []).filter((_: any, i: number) => i !== index),
		}));
	};

	const removeExistingDocument = (docIndex: number) => {
		setExistingDocuments((prev: any[]) =>
			prev.filter((_: any, i: number) => i !== docIndex)
		);
	};

	/* ===================================================
	   FIELD CONFIG ARRAYS
	=================================================== */

	const contractDetailsFields = [
		{
			key: "contractNumber",
			label: "Contract No",
			type: "text",
			disabled: true,
			value: () => (isEdit ? form.contractNumber : "AUTO"),
		},
		{
			key: "contractDate",
			label: "Contract Date",
			type: "date",
		},
		{
			key: "customerCode",
			label: "Customer",
			type: "select",
			mandatory: true,
			options: customerOption,
		},
		{
			key: "contractType",
			label: "Contract Type",
			type: "select",
			options: contractTypeOptions,
			mandatory: true,
		},
		{
			key: "serviceType",
			label: "Service Type",
			type: "select",
			options: serviceTypeOptions,
			mandatory: true,
		},
		{
			key: "description",
			label: "Description",
			type: "textarea",
			placeholder: "Description (200 chars max)",
			maxLength: DESCRIPTION_MAX,
			className: "md:col-span-2 xl:col-span-3",
		},
	];

	const contractPeriodFields = [
		{
			key: "periodStart",
			label: "Start Date",
			type: "date",
			mandatory: true,
		},
		{
			key: "periodEnd",
			label: "End Date",
			type: "date",
			mandatory: true,
		},
	];

	const billingTermsFields = [
		{
			key: "billingBasis",
			label: "Billing Basis",
			type: "select",
			options: billingBasisOptions,
		},
		{
			key: "paymentDays",
			label: "Payment Days",
			type: "select",
			options: paymentDaysOptions,
		},
		// {
		// 	key: "currency",
		// 	label: "Currency",
		// 	type: "select",
		// 	options: currencyOptions,
		// },
	];

	const tripCommitmentFields = [
		{
			key: "totalTrips",
			label: "Total Trips",
			type: "number",
		},
		{
			key: "monthlyCommitment",
			label: "Monthly Commitment",
			type: "number",
		},
		{
			key: "completedTrips",
			label: "Completed Trips",
			type: "number",
			disabled: true,
			value: () => form.completedTrips || 0,
		},
		{
			key: "balanceTrips",
			label: "Balance Trips",
			type: "number",
			disabled: true,
			value: () => balanceTrips,
		},
	];

	const routeFields = [
		{
			key: "routeCode",
			label: "Route Code",
			type: "text",
		},
		{
			key: "rate",
			label: "Rate",
			type: "number",
		},
		{
			key: "vehicleType",
			label: "Vehicle Type",
			type: "select",
			options: vehicleTypeOptions,
		},
		{
			key: "loadType",
			label: "Load Type",
			type: "select",
			options: loadTypeOptions,
		},
		{
			key: "rateType",
			label: "Rate Type",
			type: "text",
		},
	];

	const renderFields = (fields: any[]) =>
		fields.map((field: any) =>
			renderField({
				field,
				form,
				handleInputChange,
				handleSelectChange,
				updateField,
			})
		);

	/* ===================================================
	   VALIDATION + PAYLOAD
	=================================================== */

	const validateContractForm = () => {
		if (!String(form.customerCode || "").trim()) {
			toast.warn("Customer is required");
			return false;
		}

		if (!String(form.customerName || "").trim()) {
			toast.warn("Customer Name is required");
			return false;
		}

		if (!form.contractType) {
			toast.warn("Contract type required");
			return false;
		}

		if (!form.serviceType) {
			toast.warn("Service type required");
			return false;
		}

		if (!form.periodStart) {
			toast.warn("Start date required");
			return false;
		}

		if (!form.periodEnd) {
			toast.warn("End date required");
			return false;
		}

		return true;
	};

	const toContractPayload = (status: string) => ({
		contractNumber: form.contractNumber,
		contractDate: form.contractDate,

		customer: {
			customerCode: String(form.customerCode || "").trim(),
			customerName: String(form.customerName || "").trim(),
		},

		contractType: form.contractType,
		serviceType: form.serviceType,
		description: form.description,

		contractPeriod: {
			startDate: form.periodStart,
			endDate: form.periodEnd,
		},

		billingTerms: {
			billingBasis: form.billingBasis,
			paymentDays: form.paymentDays,
			currency: form.currency,
		},

		tripCommitment: {
			totalTrips: form.totalTrips,
			monthlyCommitment: form.monthlyCommitment,
			completedTrips: form.completedTrips,
			balanceTrips,
		},

		routes: form.routes || [],
		documents: [...(existingDocuments || []), ...(newDocuments || [])],
		status,
	});

	const persistContract = async (status: string) => {
		if (!validateContractForm()) return;

		try {
			setLoading(true);

			const payload = toContractPayload(status);

			if (isEdit && contractNumberParam) {
				await dispatch(
					updateTransportContract({
						voucherNumber: contractNumberParam,
						payload,
					})
				).unwrap();
			} else {
				await dispatch(createTransportContract(payload)).unwrap();
			}

			toast.success(
				status === "draft" ? "Contract saved as draft" : "Contract saved"
			);

			navigate(-1);
		} catch (error: any) {
			toast.error(error?.message || "Failed to save contract");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex h-full w-full flex-col bg-background text-foreground">
			<header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-4">
				<div className="flex items-center">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
						title="Go back"
					>
						<ArrowLeft size={20} />
					</button>
					<div>
						<h1 className="truncate text-lg font-bold text-card-foreground">
							{pageTitle}
						</h1>

						<p className=" text-sm text-muted-foreground">
							{pageDescription}
						</p>
					</div>
				</div>
			</header>

			<main className="flex-1 overflow-auto  pb-28 sm:p-2">
				<div className="flex flex-col gap-4">
					<SectionCard
						index={1}
						title="Contract Details"
						icon={<FileText size={18} />}
						expanded={expandedSections.contractDetails}
						onToggle={() => toggleSection("contractDetails")}
					>
						<div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-4 gap-4">

							{renderFields(contractDetailsFields)}
						</div>
					</SectionCard>

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

						<SectionCard
							index={2}
							title="Contract Period"
							icon={<CalendarDays size={18} />}
							expanded={expandedSections.contractPeriod}
							onToggle={() => toggleSection("contractPeriod")}
						>
							<div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-2 gap-4">
								{renderFields(contractPeriodFields)}
							</div>
						</SectionCard>

						<SectionCard
							index={3}
							title="Billing Terms"
							icon={<CreditCard size={18} />}
							expanded={expandedSections.billingTerms}
							onToggle={() => toggleSection("billingTerms")}
						>
							<div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-2 gap-4">

								{renderFields(billingTermsFields)}
							</div>
						</SectionCard>

					</div>

					<SectionCard
						index={4}
						title="Trip Commitment"
						icon={<Truck size={18} />}
						expanded={expandedSections.tripCommitment}
						onToggle={() => toggleSection("tripCommitment")}
					>
						<div className="md:col-span-2 xl:col-span-3 grid w-full grid-cols-4 gap-4">

							{renderFields(tripCommitmentFields)}
						</div>
					</SectionCard>

					<SectionCard
						index={5}
						title="Route Details"
						icon={<Map size={18} />}
						expanded={expandedSections.routeMatrix}
						onToggle={() => toggleSection("routeMatrix")}
					>
						<div className="md:col-span-2 xl:col-span-3">
							<div className="flex flex-col gap-4">
								{(form.routes || []).map((row: any, index: number) => (
									<div
										key={row.id || `route-${index}`}
										className="rounded-lg border border-border bg-muted/30 p-4"
									>
										<div className="mb-4 flex items-center justify-between">
											<h3 className="text-sm font-bold">
												Route {index + 1}
											</h3>

											{(form.routes || []).length > 1 && (
												<button
													type="button"
													onClick={() => removeRouteRow(index)}
													className="rounded-md p-2 text-danger transition hover:bg-danger/10"
												>
													<Trash2 size={16} />
												</button>
											)}
										</div>

										{/* ================= Pickup / Delivery ================= */}
										<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
											<RouteLocationBlock
												side="from"
												label="Pickup"
												row={row}
												states={states}
												onFieldChange={(key: string, value: any) =>
													updateRoute(index, key, value)
												}
											/>

											<RouteLocationBlock
												side="to"
												label="Delivery"
												row={row}
												states={states}
												onFieldChange={(key: string, value: any) =>
													updateRoute(index, key, value)
												}
											/>
										</div>

										{/* ================= Route Information ================= */}
										<div className="rounded-lg border border-border bg-background p-4">
											{/* <h4 className="mb-4 font-semibold text-primary">
												🚚 Route Information
											</h4> */}

											<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
												{routeFields.map((field: any) =>
													renderField({
														field,
														form: row,
														handleInputChange: () =>
															handleRouteChange(index, field.key),
														handleSelectChange: () =>
															handleRouteChange(index, field.key),
														updateField: (_: any, value: any) =>
															updateRoute(index, field.key, value),
													})
												)}
											</div>
										</div>
									</div>
								))}

								<div className="flex justify-end">
									<button
										type="button"
										onClick={addRouteRow}
										className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/15"
									>
										<Plus size={14} />
										Add Route
									</button>
								</div>
							</div>
						</div>
					</SectionCard>

					<SectionCard
						index={6}
						title="Documents"
						icon={<Paperclip size={18} />}
						expanded={expandedSections.documents}
						onToggle={() => toggleSection("documents")}
					>
						<div className="md:col-span-2 xl:col-span-3">
							<ExistingDocumentsList
								documents={existingDocuments}
								onRemove={removeExistingDocument}
							/>

							<DocumentUploadInput
								label="Contract Documents"
								value={newDocuments}
								onChange={(documents: any[]) => setNewDocuments(documents)}
								placeholder="Upload Contract Documents"
								description="Attach contract PDF, rate sheet, signed copy, or image files."
								allowedText="Allowed: PDF, PNG, JPG, JPEG, XLS, XLSX, DOC, DOCX"
							/>
						</div>
					</SectionCard>
				</div>
			</main>

			<footer className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
				<button
					type="button"
					onClick={() => navigate(-1)}
					disabled={loading}
					className="inline-flex h-10 items-center justify-center rounded-md border border-primary bg-background px-5 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:opacity-60"
				>
					Cancel
				</button>

				<button
					type="button"
					onClick={() => persistContract("draft")}
					disabled={loading}
					className="inline-flex h-10 items-center justify-center rounded-md border border-warning bg-background px-5 text-sm font-semibold text-warning transition hover:bg-warning/10 disabled:opacity-60"
				>
					Save as Draft
				</button>

				<button
					type="button"
					onClick={() => persistContract("active")}
					disabled={loading}
					className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
				>
					<Save size={17} />
					{loading ? "Saving..." : isEdit ? "Update" : "Save"}
				</button>
			</footer>
		</div>
	);
};

export default CreateEditTransportContract;