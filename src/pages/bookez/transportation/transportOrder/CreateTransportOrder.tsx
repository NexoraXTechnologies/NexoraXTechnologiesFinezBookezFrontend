// import { useMemo, useState } from "react";
// import {
// 	ArrowLeft,
// 	ArrowRight,
// 	Check,
// 	Package,
// 	Save,
// 	Truck,
// 	User,
// 	MapPin,
// 	ShieldCheck,
// 	IndianRupee,
// } from "lucide-react";
// import { useDispatch } from "react-redux";
// import { useLocation, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { createTransportOrder } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";

// const STEPS = [
// 	"Customer",
// 	"Load",
// 	"Pickup",
// 	"Delivery",
// 	"Vehicle",
// 	"Freight",
// 	"Risk",
// ];

// const orderTypeOptions = [
// 	{ label: "Market", value: "market" },
// 	{ label: "Contract", value: "contract" },
// ];

// const loadTypeOptions = [
// 	{ label: "FTL", value: "FTL" },
// 	{ label: "PTL", value: "PTL" },
// 	{ label: "Parcel", value: "Parcel" },
// ];

// const materialCategoryOptions = [
// 	{ label: "General", value: "General" },
// 	{ label: "Fragile", value: "Fragile" },
// 	{ label: "Hazardous", value: "Hazardous" },
// 	{ label: "Perishable", value: "Perishable" },
// ];

// const packagingOptions = [
// 	{ label: "Box", value: "Box" },
// 	{ label: "Carton", value: "Carton" },
// 	{ label: "Loose", value: "Loose" },
// 	{ label: "Pallet", value: "Pallet" },
// ];

// const ewayBillGeneratedByOptions = [
// 	{ label: "Consignor", value: "consignor" },
// 	{ label: "Consignee", value: "consignee" },
// 	{ label: "Transporter", value: "transporter" },
// ];

// const routeTypeOptions = [
// 	{ label: "National Highway", value: "National Highway" },
// 	{ label: "State Highway", value: "State Highway" },
// 	{ label: "City Route", value: "City Route" },
// 	{ label: "Mixed Route", value: "Mixed Route" },
// ];

// const priorityOptions = [
// 	{ label: "Low", value: "low" },
// 	{ label: "Normal", value: "normal" },
// 	{ label: "High", value: "high" },
// 	{ label: "Urgent", value: "urgent" },
// ];

// const vehicleTypeOptions = [
// 	{ label: "Truck", value: "Truck" },
// 	{ label: "Trailer", value: "Trailer" },
// 	{ label: "Container", value: "Container" },
// 	{ label: "Pickup", value: "Pickup" },
// ];

// const vehicleBodyTypeOptions = [
// 	{ label: "Open Body", value: "Open Body" },
// 	{ label: "Closed Body", value: "Closed Body" },
// 	{ label: "Container Body", value: "Container Body" },
// ];

// const vehicleCapacityOptions = [
// 	{ label: "1 Ton", value: "1 Ton" },
// 	{ label: "3 Ton", value: "3 Ton" },
// 	{ label: "7 Ton", value: "7 Ton" },
// 	{ label: "16 Ton", value: "16 Ton" },
// 	{ label: "32 FT", value: "32 FT" },
// ];

// const paymentTypeOptions = [
// 	{ label: "Paid", value: "paid" },
// 	{ label: "To Pay", value: "toPay" },
// 	{ label: "Billing", value: "billing" },
// ];

// const paymentModeOptions = [
// 	{ label: "Cash", value: "cash" },
// 	{ label: "Bank", value: "bank" },
// 	{ label: "UPI", value: "upi" },
// 	{ label: "Credit", value: "credit" },
// ];

// const riskOptions = [
// 	{ label: "Owner Risk", value: "ownerRisk" },
// 	{ label: "Carrier Risk", value: "carrierRisk" },
// ];

// const todayDateTime = () => {
// 	const now = new Date();
// 	now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
// 	return now.toISOString().slice(0, 16);
// };

// const createInitialTransportOrder = () => ({
// 	orderType: "market",
// 	contractDetails: {
// 		contractNumber: "",
// 		validityFrom: "",
// 		validityTo: "",
// 		totalTrips: "",
// 		completedTrips: 0,
// 		remainingTrips: 0,
// 	},
// 	customerDetails: {
// 		customerCode: "",
// 		customerName: "",
// 		contactPerson: "",
// 		gstNumber: "",
// 		mobileNumber: "",
// 		email: "",
// 	},
// 	loadDetails: {
// 		loadType: "",
// 		materialName: "",
// 		materialCategory: "",
// 		quantity: "",
// 		weight: "",
// 		weightUnit: "",
// 		packagingType: "",
// 		invoiceNumber: "",
// 		ewayBillDetails: {
// 			ewayBillRequired: false,
// 			ewayBillGeneratedBy: "",
// 			ewayBillNumber: "",
// 			ewayBillDate: "",
// 		},
// 		specialHandlingInstructions: "",
// 	},
// 	pickupDetails: {
// 		pickupStateCode: "",
// 		pickupStateName: "",
// 		pickupCityName: "",
// 		pickupLocation: "",
// 		pickupAddress: "",
// 		pickupDateTime: todayDateTime(),
// 		pickupContactName: "",
// 		pickupContactNumber: "",
// 	},
// 	deliveryDetails: {
// 		deliveryStateCode: "",
// 		deliveryStateName: "",
// 		deliveryCityName: "",
// 		deliveryLocation: "",
// 		deliveryAddress: "",
// 		expectedDeliveryDateTime: todayDateTime(),
// 		deliveryContactName: "",
// 		deliveryContactNumber: "",
// 	},
// 	routeDetails: {
// 		routeDistanceKm: "",
// 		routeType: "",
// 		expectedTollAmount: "",
// 	},
// 	vehicleRequirement: {
// 		vehicleType: "",
// 		vehicleBodyType: "",
// 		vehicleCapacity: "",
// 		numberOfVehicles: "",
// 		specialVehicleRequirement: "",
// 	},
// 	freightDetails: {
// 		freightPerTon: "",
// 		expectedFreight: "",
// 		advanceAmount: "",
// 		paymentType: "",
// 		paymentMode: "",
// 	},
// 	brokerDetails: {
// 		brokerRequired: false,
// 		brokerCode: "",
// 		brokerName: "",
// 		brokerCommission: "",
// 	},
// 	riskAndInsurance: {
// 		riskType: "",
// 		insuranceRequired: false,
// 		insuranceAmount: "",
// 	},
// 	trackingPreferences: {
// 		gpsTrackingRequired: false,
// 		podRequired: false,
// 		liveTrackingEnabled: false,
// 	},
// 	priority: "normal",
// 	remarks: "",
// });

// const num = (value: any) => Number(value || 0);

// const computeFreightBalance = (expectedFreight: any, advanceAmount: any) => {
// 	return Math.max(num(expectedFreight) - num(advanceAmount), 0);
// };

// const computeRemainingTrips = (totalTrips: any, completedTrips: any) => {
// 	return Math.max(num(totalTrips) - num(completedTrips), 0);
// };

// const Field = ({
// 	label,
// 	value,
// 	onChange,
// 	type = "text",
// 	required = false,
// 	disabled = false,
// 	placeholder,
// }: any) => {
// 	return (
// 		<div className="flex flex-col gap-1">
// 			<label className="text-sm font-semibold text-card-foreground">
// 				{label}
// 				{required && <span className="text-danger"> *</span>}
// 			</label>

// 			<input
// 				type={type}
// 				value={value ?? ""}
// 				disabled={disabled}
// 				placeholder={placeholder || label}
// 				onChange={(e) => onChange(e.target.value)}
// 				className="h-10 rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
// 			/>
// 		</div>
// 	);
// };

// const TextArea = ({ label, value, onChange, required = false }: any) => {
// 	return (
// 		<div className="flex flex-col gap-1 md:col-span-2 xl:col-span-3">
// 			<label className="text-sm font-semibold text-card-foreground">
// 				{label}
// 				{required && <span className="text-danger"> *</span>}
// 			</label>

// 			<textarea
// 				value={value ?? ""}
// 				onChange={(e) => onChange(e.target.value)}
// 				rows={3}
// 				placeholder={label}
// 				className="resize-none rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
// 			/>
// 		</div>
// 	);
// };

// const SelectField = ({
// 	label,
// 	value,
// 	onChange,
// 	options = [],
// 	required = false,
// 	disabled = false,
// }: any) => {
// 	return (
// 		<div className="flex flex-col gap-1">
// 			<label className="text-sm font-semibold text-card-foreground">
// 				{label}
// 				{required && <span className="text-danger"> *</span>}
// 			</label>

// 			<select
// 				value={value ?? ""}
// 				disabled={disabled}
// 				onChange={(e) => onChange(e.target.value)}
// 				className="h-10 rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-70"
// 			>
// 				<option value="">Select {label}</option>
// 				{options.map((item: any) => (
// 					<option key={item.value} value={item.value}>
// 						{item.label}
// 					</option>
// 				))}
// 			</select>
// 		</div>
// 	);
// };

// const SwitchField = ({ label, checked, onChange }: any) => {
// 	return (
// 		<div className="flex min-h-10 items-center justify-between rounded-md border border-border bg-input px-3">
// 			<span className="text-sm font-semibold text-card-foreground">
// 				{label}
// 			</span>

// 			<button
// 				type="button"
// 				onClick={() => onChange(!checked)}
// 				className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
// 					checked ? "bg-primary" : "bg-muted-foreground/30"
// 				}`}
// 			>
// 				<span
// 					className={`inline-block h-5 w-5 rounded-full bg-white transition ${
// 						checked ? "translate-x-5" : "translate-x-1"
// 					}`}
// 				/>
// 			</button>
// 		</div>
// 	);
// };

// const SectionCard = ({ title, icon, children }: any) => {
// 	return (
// 		<section className="rounded-md border border-border bg-card p-4 shadow-sm">
// 			<div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
// 				<span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
// 					{icon}
// 				</span>
// 				<h2 className="text-base font-bold text-card-foreground">{title}</h2>
// 			</div>

// 			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
// 				{children}
// 			</div>
// 		</section>
// 	);
// };

// const CreateTransportOrder = () => {
// 	const dispatch = useDispatch<any>();
// 	const navigate = useNavigate();
// 	const location = useLocation();

// 	const [form, setForm] = useState<any>(createInitialTransportOrder());
// 	const [step, setStep] = useState(0);
// 	const [loading, setLoading] = useState(false);

// 	const pageTitle = location.state?.title || "Create Transport Order";
// 	const pageDescription =
// 		location.state?.description ||
// 		"Create and manage transport orders for customer goods movement.";

// 	const isContractOrder = form.orderType === "contract";

// 	const update = (section: string, key: string, value: any) => {
// 		setForm((prev: any) => ({
// 			...prev,
// 			[section]: {
// 				...prev[section],
// 				[key]: value,
// 			},
// 		}));
// 	};

// 	const updateNested = (
// 		section: string,
// 		nested: string,
// 		key: string,
// 		value: any
// 	) => {
// 		setForm((prev: any) => ({
// 			...prev,
// 			[section]: {
// 				...prev[section],
// 				[nested]: {
// 					...prev[section][nested],
// 					[key]: value,
// 				},
// 			},
// 		}));
// 	};

// 	const handleOrderTypeChange = (value: string) => {
// 		setForm((prev: any) => ({
// 			...prev,
// 			orderType: value,
// 			contractDetails:
// 				value === "contract"
// 					? prev.contractDetails
// 					: {
// 							contractNumber: "",
// 							validityFrom: "",
// 							validityTo: "",
// 							totalTrips: "",
// 							completedTrips: 0,
// 							remainingTrips: 0,
// 					  },
// 		}));
// 	};

// 	const handleContractTripsChange = (key: string, value: any) => {
// 		setForm((prev: any) => {
// 			const nextContract = {
// 				...prev.contractDetails,
// 				[key]: value,
// 			};

// 			nextContract.remainingTrips = computeRemainingTrips(
// 				nextContract.totalTrips,
// 				nextContract.completedTrips
// 			);

// 			return {
// 				...prev,
// 				contractDetails: nextContract,
// 			};
// 		});
// 	};

// 	const validateCurrentStep = () => {
// 		if (step === 0) {
// 			if (form.orderType === "contract" && !form.contractDetails.contractNumber) {
// 				toast.warn("Contract required");
// 				return false;
// 			}

// 			if (!form.customerDetails.customerName) {
// 				toast.warn("Customer name required");
// 				return false;
// 			}

// 			if (!form.customerDetails.mobileNumber) {
// 				toast.warn("Mobile number required");
// 				return false;
// 			}
// 		}

// 		if (step === 1) {
// 			if (!form.loadDetails.loadType) {
// 				toast.warn("Load type required");
// 				return false;
// 			}

// 			if (!form.loadDetails.materialName) {
// 				toast.warn("Material name required");
// 				return false;
// 			}
// 		}

// 		if (step === 2) {
// 			if (!form.pickupDetails.pickupStateName) {
// 				toast.warn("Pickup state required");
// 				return false;
// 			}

// 			if (!form.pickupDetails.pickupCityName) {
// 				toast.warn("Pickup city required");
// 				return false;
// 			}
// 		}

// 		if (step === 3) {
// 			if (!form.deliveryDetails.deliveryStateName) {
// 				toast.warn("Delivery state required");
// 				return false;
// 			}

// 			if (!form.deliveryDetails.deliveryCityName) {
// 				toast.warn("Delivery city required");
// 				return false;
// 			}
// 		}

// 		return true;
// 	};

// 	const next = () => {
// 		if (!validateCurrentStep()) return;
// 		setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
// 	};

// 	const back = () => {
// 		setStep((prev) => Math.max(prev - 1, 0));
// 	};

// 	const balanceAmount = useMemo(
// 		() =>
// 			computeFreightBalance(
// 				form.freightDetails.expectedFreight,
// 				form.freightDetails.advanceAmount
// 			),
// 		[form.freightDetails.expectedFreight, form.freightDetails.advanceAmount]
// 	);

// 	const buttonLabel = useMemo(() => {
// 		if (step === STEPS.length - 1) return "Save Order";
// 		return `Next: ${STEPS[step + 1]}`;
// 	}, [step]);

// 	const handleSave = async () => {
// 		try {
// 			setLoading(true);

// 			await dispatch(createTransportOrder(form) as any).unwrap();

// 			toast.success("Transport order created");
// 			navigate(-1);
// 		} catch (error: any) {
// 			toast.error(error?.message || "Failed to create transport order");
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const renderStepper = () => {
// 		return (
// 			<div className="mb-4 overflow-x-auto rounded-md border border-border bg-card p-4 shadow-sm">
// 				<div className="flex min-w-max items-start">
// 					{STEPS.map((item, index) => {
// 						const active = index === step;
// 						const done = index < step;

// 						return (
// 							<div key={item} className="flex items-start">
// 								<div className="flex flex-col items-center">
// 									<div
// 										className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black transition ${
// 											done
// 												? "border-success bg-success text-white"
// 												: active
// 												? "border-primary bg-primary text-primary-foreground"
// 												: "border-border bg-background text-muted-foreground"
// 										}`}
// 									>
// 										{done ? <Check size={15} /> : index + 1}
// 									</div>

// 									<span
// 										className={`mt-1 text-xs font-bold ${
// 											active ? "text-primary" : "text-muted-foreground"
// 										}`}
// 									>
// 										{item}
// 									</span>
// 								</div>

// 								{index !== STEPS.length - 1 && (
// 									<div
// 										className={`mx-3 mt-4 h-[2px] w-12 ${
// 											done ? "bg-success" : "bg-border"
// 										}`}
// 									/>
// 								)}
// 							</div>
// 						);
// 					})}
// 				</div>
// 			</div>
// 		);
// 	};

// 	const renderCustomerStep = () => {
// 		return (
// 			<SectionCard title="Customer Details" icon={<User size={18} />}>
// 				<SelectField
// 					label="Order Type"
// 					value={form.orderType}
// 					onChange={handleOrderTypeChange}
// 					options={orderTypeOptions}
// 					required
// 				/>

// 				{isContractOrder && (
// 					<>
// 						<Field
// 							label="Contract Number"
// 							value={form.contractDetails.contractNumber}
// 							onChange={(v: any) =>
// 								update("contractDetails", "contractNumber", v)
// 							}
// 							required
// 						/>

// 						<Field
// 							label="Validity From"
// 							type="date"
// 							value={form.contractDetails.validityFrom}
// 							onChange={(v: any) => update("contractDetails", "validityFrom", v)}
// 						/>

// 						<Field
// 							label="Validity To"
// 							type="date"
// 							value={form.contractDetails.validityTo}
// 							onChange={(v: any) => update("contractDetails", "validityTo", v)}
// 						/>

// 						<Field
// 							label="Total Trips"
// 							type="number"
// 							value={form.contractDetails.totalTrips}
// 							onChange={(v: any) => handleContractTripsChange("totalTrips", v)}
// 						/>

// 						<Field
// 							label="Completed Trips"
// 							type="number"
// 							value={form.contractDetails.completedTrips}
// 							onChange={(v: any) =>
// 								handleContractTripsChange("completedTrips", v)
// 							}
// 						/>

// 						<Field
// 							label="Remaining Trips"
// 							type="number"
// 							value={form.contractDetails.remainingTrips}
// 							onChange={() => {}}
// 							disabled
// 						/>
// 					</>
// 				)}

// 				<Field
// 					label="Customer Code"
// 					value={form.customerDetails.customerCode}
// 					onChange={(v: any) => update("customerDetails", "customerCode", v)}
// 				/>

// 				<Field
// 					label="Customer Name"
// 					value={form.customerDetails.customerName}
// 					onChange={(v: any) => {
// 						update("customerDetails", "customerName", v);
// 						update("customerDetails", "contactPerson", v);
// 					}}
// 					required
// 				/>

// 				<Field
// 					label="GST Number"
// 					value={form.customerDetails.gstNumber}
// 					onChange={(v: any) => update("customerDetails", "gstNumber", v)}
// 				/>

// 				<Field
// 					label="Contact Person"
// 					value={form.customerDetails.contactPerson}
// 					onChange={(v: any) => update("customerDetails", "contactPerson", v)}
// 					required
// 				/>

// 				<Field
// 					label="Mobile Number"
// 					type="number"
// 					value={form.customerDetails.mobileNumber}
// 					onChange={(v: any) => update("customerDetails", "mobileNumber", v)}
// 					required
// 				/>

// 				<Field
// 					label="Email"
// 					type="email"
// 					value={form.customerDetails.email}
// 					onChange={(v: any) => update("customerDetails", "email", v)}
// 				/>
// 			</SectionCard>
// 		);
// 	};

// 	const renderLoadStep = () => {
// 		return (
// 			<SectionCard title="Load Details" icon={<Package size={18} />}>
// 				<SelectField
// 					label="Load Type"
// 					value={form.loadDetails.loadType}
// 					onChange={(v: any) => update("loadDetails", "loadType", v)}
// 					options={loadTypeOptions}
// 					required
// 				/>

// 				<Field
// 					label="Material Name"
// 					value={form.loadDetails.materialName}
// 					onChange={(v: any) => update("loadDetails", "materialName", v)}
// 					required
// 				/>

// 				<SelectField
// 					label="Material Category"
// 					value={form.loadDetails.materialCategory}
// 					onChange={(v: any) => update("loadDetails", "materialCategory", v)}
// 					options={materialCategoryOptions}
// 				/>

// 				<Field
// 					label="Quantity"
// 					type="number"
// 					value={form.loadDetails.quantity}
// 					onChange={(v: any) => update("loadDetails", "quantity", v)}
// 				/>

// 				<Field
// 					label="Weight"
// 					type="number"
// 					value={form.loadDetails.weight}
// 					onChange={(v: any) =>
// 						update("loadDetails", "weight", String(v).replace(/[^0-9]/g, ""))
// 					}
// 				/>

// 				<Field
// 					label="Weight Unit"
// 					value={form.loadDetails.weightUnit}
// 					onChange={(v: any) => update("loadDetails", "weightUnit", v)}
// 					placeholder="KG / Ton / Quintal"
// 				/>

// 				<SelectField
// 					label="Packaging Type"
// 					value={form.loadDetails.packagingType}
// 					onChange={(v: any) => update("loadDetails", "packagingType", v)}
// 					options={packagingOptions}
// 				/>

// 				<Field
// 					label="Invoice Number"
// 					value={form.loadDetails.invoiceNumber}
// 					onChange={(v: any) => update("loadDetails", "invoiceNumber", v)}
// 				/>

// 				<div className="md:col-span-2 xl:col-span-3">
// 					<SwitchField
// 						label="E-Way Bill Required"
// 						checked={form.loadDetails.ewayBillDetails.ewayBillRequired}
// 						onChange={(v: any) =>
// 							updateNested(
// 								"loadDetails",
// 								"ewayBillDetails",
// 								"ewayBillRequired",
// 								v
// 							)
// 						}
// 					/>
// 				</div>

// 				{form.loadDetails.ewayBillDetails.ewayBillRequired && (
// 					<>
// 						<SelectField
// 							label="E-Way Bill Generated By"
// 							value={form.loadDetails.ewayBillDetails.ewayBillGeneratedBy}
// 							onChange={(v: any) =>
// 								updateNested(
// 									"loadDetails",
// 									"ewayBillDetails",
// 									"ewayBillGeneratedBy",
// 									v
// 								)
// 							}
// 							options={ewayBillGeneratedByOptions}
// 						/>

// 						<Field
// 							label="E-Way Bill Number"
// 							value={form.loadDetails.ewayBillDetails.ewayBillNumber}
// 							onChange={(v: any) =>
// 								updateNested(
// 									"loadDetails",
// 									"ewayBillDetails",
// 									"ewayBillNumber",
// 									v
// 								)
// 							}
// 						/>

// 						<Field
// 							label="E-Way Bill Date"
// 							type="date"
// 							value={form.loadDetails.ewayBillDetails.ewayBillDate}
// 							onChange={(v: any) =>
// 								updateNested(
// 									"loadDetails",
// 									"ewayBillDetails",
// 									"ewayBillDate",
// 									v
// 								)
// 							}
// 						/>
// 					</>
// 				)}

// 				<TextArea
// 					label="Special Handling / Instructions"
// 					value={form.loadDetails.specialHandlingInstructions}
// 					onChange={(v: any) =>
// 						update("loadDetails", "specialHandlingInstructions", v)
// 					}
// 				/>
// 			</SectionCard>
// 		);
// 	};

// 	const renderPickupStep = () => {
// 		return (
// 			<SectionCard title="Pickup Details" icon={<MapPin size={18} />}>
// 				<Field
// 					label="Pickup State"
// 					value={form.pickupDetails.pickupStateName}
// 					onChange={(v: any) => {
// 						update("pickupDetails", "pickupStateName", v);
// 						update("pickupDetails", "pickupStateCode", v);
// 					}}
// 					required
// 				/>

// 				<Field
// 					label="Pickup City"
// 					value={form.pickupDetails.pickupCityName}
// 					onChange={(v: any) => {
// 						update("pickupDetails", "pickupCityName", v);
// 						update("pickupDetails", "pickupLocation", v);
// 					}}
// 					required
// 				/>

// 				<Field
// 					label="Pickup Date & Time"
// 					type="datetime-local"
// 					value={form.pickupDetails.pickupDateTime}
// 					onChange={(v: any) => update("pickupDetails", "pickupDateTime", v)}
// 				/>

// 				<Field
// 					label="Contact Name"
// 					value={form.pickupDetails.pickupContactName}
// 					onChange={(v: any) => update("pickupDetails", "pickupContactName", v)}
// 				/>

// 				<Field
// 					label="Contact Number"
// 					type="number"
// 					value={form.pickupDetails.pickupContactNumber}
// 					onChange={(v: any) =>
// 						update("pickupDetails", "pickupContactNumber", v)
// 					}
// 				/>

// 				<TextArea
// 					label="Pickup Address"
// 					value={form.pickupDetails.pickupAddress}
// 					onChange={(v: any) => update("pickupDetails", "pickupAddress", v)}
// 				/>
// 			</SectionCard>
// 		);
// 	};

// 	const renderDeliveryStep = () => {
// 		return (
// 			<div className="space-y-4">
// 				<SectionCard title="Delivery Details" icon={<MapPin size={18} />}>
// 					<Field
// 						label="Delivery State"
// 						value={form.deliveryDetails.deliveryStateName}
// 						onChange={(v: any) => {
// 							update("deliveryDetails", "deliveryStateName", v);
// 							update("deliveryDetails", "deliveryStateCode", v);
// 						}}
// 						required
// 					/>

// 					<Field
// 						label="Delivery City"
// 						value={form.deliveryDetails.deliveryCityName}
// 						onChange={(v: any) => {
// 							update("deliveryDetails", "deliveryCityName", v);
// 							update("deliveryDetails", "deliveryLocation", v);
// 						}}
// 						required
// 					/>

// 					<Field
// 						label="Expected Delivery Date & Time"
// 						type="datetime-local"
// 						value={form.deliveryDetails.expectedDeliveryDateTime}
// 						onChange={(v: any) =>
// 							update("deliveryDetails", "expectedDeliveryDateTime", v)
// 						}
// 					/>

// 					<Field
// 						label="Contact Name"
// 						value={form.deliveryDetails.deliveryContactName}
// 						onChange={(v: any) =>
// 							update("deliveryDetails", "deliveryContactName", v)
// 						}
// 					/>

// 					<Field
// 						label="Contact Number"
// 						type="number"
// 						value={form.deliveryDetails.deliveryContactNumber}
// 						onChange={(v: any) =>
// 							update("deliveryDetails", "deliveryContactNumber", v)
// 						}
// 					/>

// 					<TextArea
// 						label="Delivery Address"
// 						value={form.deliveryDetails.deliveryAddress}
// 						onChange={(v: any) =>
// 							update("deliveryDetails", "deliveryAddress", v)
// 						}
// 					/>
// 				</SectionCard>

// 				<SectionCard title="Route Details" icon={<Truck size={18} />}>
// 					<Field
// 						label="Route Distance (KM)"
// 						type="number"
// 						value={form.routeDetails.routeDistanceKm}
// 						onChange={(v: any) => update("routeDetails", "routeDistanceKm", v)}
// 					/>

// 					<SelectField
// 						label="Route Type"
// 						value={form.routeDetails.routeType}
// 						onChange={(v: any) => update("routeDetails", "routeType", v)}
// 						options={routeTypeOptions}
// 					/>

// 					<Field
// 						label="Expected Toll Amount"
// 						type="number"
// 						value={form.routeDetails.expectedTollAmount}
// 						onChange={(v: any) =>
// 							update("routeDetails", "expectedTollAmount", v)
// 						}
// 					/>

// 					<SelectField
// 						label="Priority"
// 						value={form.priority}
// 						onChange={(v: any) =>
// 							setForm((prev: any) => ({
// 								...prev,
// 								priority: v,
// 							}))
// 						}
// 						options={priorityOptions}
// 					/>

// 					<TextArea
// 						label="Remarks"
// 						value={form.remarks}
// 						onChange={(v: any) =>
// 							setForm((prev: any) => ({
// 								...prev,
// 								remarks: v,
// 							}))
// 						}
// 					/>
// 				</SectionCard>
// 			</div>
// 		);
// 	};

// 	const renderVehicleStep = () => {
// 		return (
// 			<SectionCard title="Vehicle Requirement" icon={<Truck size={18} />}>
// 				<SelectField
// 					label="Vehicle Type"
// 					value={form.vehicleRequirement.vehicleType}
// 					onChange={(v: any) => update("vehicleRequirement", "vehicleType", v)}
// 					options={vehicleTypeOptions}
// 				/>

// 				<SelectField
// 					label="Vehicle Body Type"
// 					value={form.vehicleRequirement.vehicleBodyType}
// 					onChange={(v: any) =>
// 						update("vehicleRequirement", "vehicleBodyType", v)
// 					}
// 					options={vehicleBodyTypeOptions}
// 				/>

// 				<SelectField
// 					label="Vehicle Capacity"
// 					value={form.vehicleRequirement.vehicleCapacity}
// 					onChange={(v: any) =>
// 						update("vehicleRequirement", "vehicleCapacity", v)
// 					}
// 					options={vehicleCapacityOptions}
// 				/>

// 				<Field
// 					label="Number of Vehicles"
// 					type="number"
// 					value={form.vehicleRequirement.numberOfVehicles}
// 					onChange={(v: any) =>
// 						update("vehicleRequirement", "numberOfVehicles", v)
// 					}
// 				/>

// 				<TextArea
// 					label="Special Vehicle Requirement"
// 					value={form.vehicleRequirement.specialVehicleRequirement}
// 					onChange={(v: any) =>
// 						update("vehicleRequirement", "specialVehicleRequirement", v)
// 					}
// 				/>
// 			</SectionCard>
// 		);
// 	};

// 	const renderFreightStep = () => {
// 		return (
// 			<SectionCard title="Freight Details" icon={<IndianRupee size={18} />}>
// 				<Field
// 					label="Freight Per Ton"
// 					type="number"
// 					value={form.freightDetails.freightPerTon}
// 					onChange={(v: any) => update("freightDetails", "freightPerTon", v)}
// 				/>

// 				<Field
// 					label="Expected Freight"
// 					type="number"
// 					value={form.freightDetails.expectedFreight}
// 					onChange={(v: any) => update("freightDetails", "expectedFreight", v)}
// 				/>

// 				<Field
// 					label="Advance Amount"
// 					type="number"
// 					value={form.freightDetails.advanceAmount}
// 					onChange={(v: any) => update("freightDetails", "advanceAmount", v)}
// 				/>

// 				<Field
// 					label="Balance Amount"
// 					type="number"
// 					value={
// 						form.freightDetails.expectedFreight === "" &&
// 						form.freightDetails.advanceAmount === ""
// 							? ""
// 							: balanceAmount
// 					}
// 					onChange={() => {}}
// 					disabled
// 				/>

// 				<SelectField
// 					label="Payment Type"
// 					value={form.freightDetails.paymentType}
// 					onChange={(v: any) => update("freightDetails", "paymentType", v)}
// 					options={paymentTypeOptions}
// 				/>

// 				<SelectField
// 					label="Payment Mode"
// 					value={form.freightDetails.paymentMode}
// 					onChange={(v: any) => update("freightDetails", "paymentMode", v)}
// 					options={paymentModeOptions}
// 				/>
// 			</SectionCard>
// 		);
// 	};

// 	const renderRiskStep = () => {
// 		return (
// 			<SectionCard title="Risk, Broker & Tracking" icon={<ShieldCheck size={18} />}>
// 				<div className="md:col-span-2 xl:col-span-3">
// 					<SwitchField
// 						label="Broker Required"
// 						checked={form.brokerDetails.brokerRequired}
// 						onChange={(v: any) => update("brokerDetails", "brokerRequired", v)}
// 					/>
// 				</div>

// 				{form.brokerDetails.brokerRequired && (
// 					<>
// 						<Field
// 							label="Broker Code"
// 							value={form.brokerDetails.brokerCode}
// 							onChange={(v: any) => update("brokerDetails", "brokerCode", v)}
// 						/>

// 						<Field
// 							label="Broker Name"
// 							value={form.brokerDetails.brokerName}
// 							onChange={(v: any) => update("brokerDetails", "brokerName", v)}
// 						/>

// 						<Field
// 							label="Broker Commission"
// 							type="number"
// 							value={form.brokerDetails.brokerCommission}
// 							onChange={(v: any) =>
// 								update("brokerDetails", "brokerCommission", v)
// 							}
// 						/>
// 					</>
// 				)}

// 				<SelectField
// 					label="Risk Type"
// 					value={form.riskAndInsurance.riskType}
// 					onChange={(v: any) => update("riskAndInsurance", "riskType", v)}
// 					options={riskOptions}
// 				/>

// 				<div className="md:col-span-2 xl:col-span-3">
// 					<SwitchField
// 						label="Insurance Required"
// 						checked={form.riskAndInsurance.insuranceRequired}
// 						onChange={(v: any) =>
// 							update("riskAndInsurance", "insuranceRequired", v)
// 						}
// 					/>
// 				</div>

// 				{form.riskAndInsurance.insuranceRequired && (
// 					<Field
// 						label="Insurance Amount"
// 						type="number"
// 						value={form.riskAndInsurance.insuranceAmount}
// 						onChange={(v: any) =>
// 							update("riskAndInsurance", "insuranceAmount", v)
// 						}
// 					/>
// 				)}

// 				<div className="md:col-span-2 xl:col-span-3">
// 					<SwitchField
// 						label="GPS Tracking Required"
// 						checked={form.trackingPreferences.gpsTrackingRequired}
// 						onChange={(v: any) =>
// 							update("trackingPreferences", "gpsTrackingRequired", v)
// 						}
// 					/>
// 				</div>

// 				<div className="md:col-span-2 xl:col-span-3">
// 					<SwitchField
// 						label="POD Required"
// 						checked={form.trackingPreferences.podRequired}
// 						onChange={(v: any) =>
// 							update("trackingPreferences", "podRequired", v)
// 						}
// 					/>
// 				</div>

// 				<div className="md:col-span-2 xl:col-span-3">
// 					<SwitchField
// 						label="Live Tracking Enabled"
// 						checked={form.trackingPreferences.liveTrackingEnabled}
// 						onChange={(v: any) =>
// 							update("trackingPreferences", "liveTrackingEnabled", v)
// 						}
// 					/>
// 				</div>
// 			</SectionCard>
// 		);
// 	};

// 	const renderStep = () => {
// 		switch (step) {
// 			case 0:
// 				return renderCustomerStep();
// 			case 1:
// 				return renderLoadStep();
// 			case 2:
// 				return renderPickupStep();
// 			case 3:
// 				return renderDeliveryStep();
// 			case 4:
// 				return renderVehicleStep();
// 			case 5:
// 				return renderFreightStep();
// 			case 6:
// 				return renderRiskStep();
// 			default:
// 				return null;
// 		}
// 	};

// 	return (
// 		<div className="flex h-full w-full flex-col bg-background text-foreground">
// 			<header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
// 				<div className="min-w-0">
// 					<h1 className="flex items-center gap-2 text-lg font-bold text-card-foreground">
// 						<button
// 							type="button"
// 							onClick={() => navigate(-1)}
// 							className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
// 						>
// 							<ArrowLeft size={20} />
// 						</button>

// 						<span className="truncate">{pageTitle}</span>
// 					</h1>

// 					<p className="ml-8 mt-1 truncate text-sm text-muted-foreground">
// 						{pageDescription}
// 					</p>
// 				</div>
// 			</header>

// 			<main className="flex-1 overflow-auto p-4 pb-28 sm:p-6">
// 				{renderStepper()}
// 				{renderStep()}
// 			</main>

// 			<footer className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-border bg-card p-4 shadow-sm">
// 				{step > 0 && (
// 					<button
// 						type="button"
// 						onClick={back}
// 						className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-primary bg-background px-5 text-sm font-bold text-primary transition hover:bg-primary/10"
// 					>
// 						<ArrowLeft size={18} />
// 						Back
// 					</button>
// 				)}

// 				<button
// 					type="button"
// 					disabled={loading}
// 					onClick={step === STEPS.length - 1 ? handleSave : next}
// 					className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
// 				>
// 					{step === STEPS.length - 1 ? (
// 						<Save size={18} />
// 					) : (
// 						<ArrowRight size={18} />
// 					)}

// 					{loading ? "Saving..." : buttonLabel}
// 				</button>
// 			</footer>
// 		</div>
// 	);
// };

// export default CreateTransportOrder;











import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { createTransportOrder } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";


import CustomerStep from "./steps/CustomerStep";
import LoadStep from "./steps/LoadStep";
import PickupStep from "./steps/PickupStep";
import DeliveryStep from "./steps/DeliveryStep";
import VehicleStep from "./steps/VehicleStep";
import FreightStep from "./steps/FreightStep";
import RiskStep from "./steps/RiskStep";

import {
	STEPS,
	createInitialTransportOrder,
} from "./transportOrderInitialState";

import { computeFreightBalance } from "./transportOrderCalculations";
import { validateCurrentStep } from "./transportOrderValidation";
import TransportOrderStepper from "./component/TransportOrderStepper";
import TransportOrderFooter from "./component/TransportOrderFooter";

const CreateTransportOrder = () => {
	const dispatch = useDispatch<any>();
	const navigate = useNavigate();
	const location = useLocation();

	const [form, setForm] = useState<any>(createInitialTransportOrder());
	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(false);

	const pageTitle = location.state?.title || "Create Transport Order";
	const pageDescription =
		location.state?.description ||
		"Create and manage transport orders for customer goods movement.";

	const update = (section: string, key: string, value: any) => {
		setForm((prev: any) => ({
			...prev,
			[section]: {
				...prev[section],
				[key]: value,
			},
		}));
	};

	const updateNested = (
		section: string,
		nested: string,
		key: string,
		value: any
	) => {
		setForm((prev: any) => ({
			...prev,
			[section]: {
				...prev[section],
				[nested]: {
					...prev[section][nested],
					[key]: value,
				},
			},
		}));
	};

	const balanceAmount = useMemo(
		() =>
			computeFreightBalance(
				form.freightDetails.expectedFreight,
				form.freightDetails.advanceAmount
			),
		[form.freightDetails.expectedFreight, form.freightDetails.advanceAmount]
	);

	const next = () => {
		if (!validateCurrentStep(step, form)) return;
		setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
	};

	const back = () => {
		setStep((prev) => Math.max(prev - 1, 0));
	};

	const handleSave = async () => {
		try {
			setLoading(true);

			const payload = {
				...form,
				freightDetails: {
					...form.freightDetails,
					balanceAmount,
				},
			};

			await dispatch(createTransportOrder(payload)).unwrap();

			toast.success("Transport order created");
			navigate(-1);
		} catch (error: any) {
			toast.error(error?.message || "Failed to create transport order");
		} finally {
			setLoading(false);
		}
	};

	const renderStep = () => {
		switch (step) {
			case 0:
				return (
					<CustomerStep
						form={form}
						setForm={setForm}
						update={update}
					/>
				);

			case 1:
				return (
					<LoadStep
						form={form}
						update={update}
						updateNested={updateNested}
					/>
				);

			case 2:
				return (
					<PickupStep
						form={form}
						update={update}
					/>
				);

			case 3:
				return (
					<DeliveryStep
						form={form}
						update={update}
						setForm={setForm}
					/>
				);

			case 4:
				return (
					<VehicleStep
						form={form}
						update={update}
					/>
				);

			case 5:
				return (
					<FreightStep
						form={form}
						update={update}
						balanceAmount={balanceAmount}
					/>
				);

			case 6:
				return (
					<RiskStep
						form={form}
						update={update}
					/>
				);

			default:
				return null;
		}
	};

	const buttonLabel =
		step === STEPS.length - 1 ? "Save Order" : `Next: ${STEPS[step + 1]}`;

	return (
		<div className="flex h-full w-full flex-col bg-background text-foreground">
			<header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
				<div className="min-w-0">
					<h1 className="flex items-center gap-2 text-lg font-bold text-card-foreground">
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
						>
							<ArrowLeft size={20} />
						</button>

						<span className="truncate">{pageTitle}</span>
					</h1>

					<p className="ml-8 mt-1 truncate text-sm text-muted-foreground">
						{pageDescription}
					</p>
				</div>
			</header>

			<main className="flex-1 overflow-auto p-4 pb-28 sm:p-2">
				<TransportOrderStepper step={step} steps={STEPS} />
				{renderStep()}
			</main>

			<TransportOrderFooter
				step={step}
				totalSteps={STEPS.length}
				loading={loading}
				buttonLabel={buttonLabel}
				onBack={back}
				onNext={step === STEPS.length - 1 ? handleSave : next}
			/>
		</div>
	);
};

export default CreateTransportOrder;