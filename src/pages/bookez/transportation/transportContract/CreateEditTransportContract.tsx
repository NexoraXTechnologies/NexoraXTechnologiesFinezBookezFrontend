import { useEffect, useMemo, useState } from "react";
import {
	ArrowLeft,
	CalendarDays,
	CreditCard,
	FileText,
	Map,
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
	TextInput,
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

const DESCRIPTION_MAX = 200;

const contractTypeOptions = [
	{ label: "Select Contract Type", value: "" },
	{ label: "Annual", value: "Annual" },
	{ label: "Spot", value: "Spot" },
	{ label: "Monthly", value: "Monthly" },
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

const currencyOptions = [
	{ label: "Select Currency", value: "" },
	{ label: "INR", value: "INR" },
	{ label: "USD", value: "USD" },
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


const createEmptyRouteRow = () => ({
	id: `${Date.now()}-${Math.random()}`,
	routeCode: "",
	from: "",
	to: "",
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
	from: row?.from || row?.fromCity || "",
	to: row?.to || row?.toCity || "",
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

	const { accounts = [] } = useSelector((state: any) => state.accountMaster)



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


	const pageTitle =
		routeState?.title || (isEdit ? "Edit Contract" : "Create Contract");

	const pageDescription =
		routeState?.description ||
		(isEdit
			? "Update transport contract details."
			: "Create transport contracts with customers, billing terms, trip commitments, and route-wise rate matrix.");

	const balanceTrips = useMemo(() => computeBalanceTrips(form), [form]);

	// const customerOption = [
	// 	{ label: "Select Customer", value: "" },
	// 	...(accounts || []).map((item: any) => ({
	// 		label: item?.accountName,
	// 		value: item?.accountCode,

	// 	})),
	// ];


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
	useEffect(() => {
		dispatch(getAllAccounts({
			accountType: "customer"
		}))
	}, [dispatch])


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
					setForm(normalizeContractForForm(apiData));
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

	// const handleSelectChange = (key: string) => (e: any) => {
	// 	updateField(key, e?.target?.value ?? "");
	// };


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
		// {
		// 	key: "customerCode",
		// 	label: "Customer Code",
		// 	type: "select",
		// 	mandatory: true,

		// },
		{
			key: "customerCode",
			label: "Customer",
			type: "select",
			mandatory: true,
			options: customerOption
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
		{
			key: "currency",
			label: "Currency",
			type: "select",
			options: currencyOptions,
		},
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
			key: "from",
			label: "From",
			type: "text",
		},
		{
			key: "to",
			label: "To",
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
			type: "text",
		},
		{
			key: "loadType",
			label: "Load Type",
			type: "text",
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
		documents: form.documents || [],
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
					<div >

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
						{renderFields(contractDetailsFields)}
					</SectionCard>

					<SectionCard
						index={2}
						title="Contract Period"
						icon={<CalendarDays size={18} />}
						expanded={expandedSections.contractPeriod}
						onToggle={() => toggleSection("contractPeriod")}
					>
						{renderFields(contractPeriodFields)}
					</SectionCard>

					<SectionCard
						index={3}
						title="Billing Terms"
						icon={<CreditCard size={18} />}
						expanded={expandedSections.billingTerms}
						onToggle={() => toggleSection("billingTerms")}
					>
						{renderFields(billingTermsFields)}
					</SectionCard>

					<SectionCard
						index={4}
						title="Trip Commitment"
						icon={<Truck size={18} />}
						expanded={expandedSections.tripCommitment}
						onToggle={() => toggleSection("tripCommitment")}
					>
						{renderFields(tripCommitmentFields)}
					</SectionCard>

					<SectionCard
						index={5}
						title="Route / Rate Matrix"
						icon={<Map size={18} />}
						expanded={expandedSections.routeMatrix}
						onToggle={() => toggleSection("routeMatrix")}
					>
						<div className="md:col-span-2 xl:col-span-3">
							<div className="flex flex-col gap-3">
								{(form.routes || []).map((row: any, index: number) => (
									<div
										key={row.id || `route-${index}`}
										className="rounded-md border border-border bg-muted/30 p-3"
									>
										<div className="mb-3 flex items-center justify-between gap-3">
											<h3 className="text-sm font-bold text-card-foreground">
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

										<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
											{routeFields.map((field: any) => (
												<TextInput
													key={field.key}
													label={field.label}
													type={field.type || "text"}
													value={row?.[field.key] || ""}
													onChange={handleRouteChange(index, field.key)}
												/>
											))}
										</div>
									</div>
								))}

								<div className="flex justify-end">
									<button
										type="button"
										onClick={addRouteRow}
										className="inline-flex h-8 w-auto items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/15"
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
							<DocumentUploadInput
								label="Contract Documents"
								value={form.documents || []}
								onChange={(documents: any[]) => updateField("documents", documents)}
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