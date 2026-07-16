import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";


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
import { createTransportOrder, getTransportOrderByVoucherNumber, updateTransportOrderByVoucherNumber } from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
import { formatDateForInput, formatDateTimeForInput } from "../../../../utils/helperFunctions";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import { getAllTransportContract } from "../../../../redux/slices/professionalSlice/transportation/transportContractSlice";
import { getStates } from "../../../../redux/slices/professionalSlice/stateCitySlice";
import { getAllUnits } from "../../../../redux/slices/professionalSlice/unitMasterSlice";
import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";
import { createTransportRouteCalculate } from "../../../../redux/slices/professionalSlice/transportation/transportRoutes";



const mergeTransportOrderWithInitial = (order: any) => {
	const initial = createInitialTransportOrder();

	return {
		...initial,
		...order,

		contractDetails: {
			...initial.contractDetails,
			...(order?.contractDetails || {}),
			validityFrom: formatDateForInput(order?.contractDetails?.validityFrom),
			validityTo: formatDateForInput(order?.contractDetails?.validityTo),
		},

		customerDetails: {
			...initial.customerDetails,
			...(order?.customerDetails || {}),
		},

		loadDetails: {
			...initial.loadDetails,
			...(order?.loadDetails || {}),
			ewayBillDetails: {
				...initial.loadDetails.ewayBillDetails,
				...(order?.loadDetails?.ewayBillDetails || {}),
				ewayBillDate: formatDateForInput(
					order?.loadDetails?.ewayBillDetails?.ewayBillDate
				),
			},
		},

		pickupDetails: {
			...initial.pickupDetails,
			...(order?.pickupDetails || {}),
			pickupDateTime: formatDateTimeForInput(
				order?.pickupDetails?.pickupDateTime
			),
		},

		deliveryDetails: {
			...initial.deliveryDetails,
			...(order?.deliveryDetails || {}),
			expectedDeliveryDateTime: formatDateTimeForInput(
				order?.deliveryDetails?.expectedDeliveryDateTime
			),
		},

		routeDetails: {
			...initial.routeDetails,
			...(order?.routeDetails || {}),
		},

		vehicleRequirement: {
			...initial.vehicleRequirement,
			...(order?.vehicleRequirement || {}),
		},

		freightDetails: {
			...initial.freightDetails,
			...(order?.freightDetails || {}),
		},

		brokerDetails: {
			...initial.brokerDetails,
			...(order?.brokerDetails || {}),
		},

		riskAndInsurance: {
			...initial.riskAndInsurance,
			...(order?.riskAndInsurance || {}),
		},

		trackingPreferences: {
			...initial.trackingPreferences,
			...(order?.trackingPreferences || {}),
		},
	};
};
const getOrderFromResponse = (response: any) => {
	return (
		response?.data?.record ||
		response?.data?.records?.[0] ||
		response?.data?.transportOrder ||
		response?.data ||
		response?.record ||
		response?.transportOrder ||
		response ||
		null
	);
};

const CreateTransportOrder = () => {
	const dispatch = useDispatch<any>();
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();

	const routeOrderNumber =
		params?.orderNumber ||
		params?.transportOrderNumber ||
		params?.voucherNumber ||
		"";

	const stateOrderNumber =
		location.state?.orderNumber ||
		location.state?.transportOrderNumber ||
		location.state?.voucherNumber ||
		location.state?.orderData?.transportOrderNumber ||
		"";

	const orderNumber = routeOrderNumber || stateOrderNumber;

	// const isEditMode =
	// 	location.state?.mode === "edit" ||
	// 	Boolean(orderNumber);

	const mode = location.state?.mode;

	const isView = mode === "view";

	const isEditMode =
		mode === "edit" ||
		(!mode && Boolean(orderNumber));

	const [form, setForm] = useState<any>(createInitialTransportOrder());
	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const [prefillLoading, setPrefillLoading] = useState(false);

	const pageTitle =
		location.state?.title ||
		(isEditMode ? "Edit Transport Order" : "Create Transport Order");

	const pageDescription =
		location.state?.description ||
		(isEditMode
			? "Update transport order details."
			: "Create and manage transport orders for customer goods movement.");




	const { accounts = [] } = useSelector((state: any) => state.accountMaster);
	const { transportContract = [] } = useSelector((state: any) => state.transportContract);
	const { states = [] } = useSelector((state: any) => state.stateCity || {});
	const { units = [] } = useSelector((state: any) => state.unitMaster);
	const { products = [] } = useSelector((state: any) => state.productMaster);

	// fetch ALL shared reference data exactly once, here
	useEffect(() => {
		dispatch(getAllAccounts({ accountType: "customer" }));
		dispatch(getAllTransportContract({ limit: 500, offset: 0, status: "active" }));
		// @ts-ignore
		dispatch(getStates());
		dispatch(getAllUnits({ limit: 200, offset: 0 }));
		dispatch(getAllProducts({ limit: 200, offset: 0 }));
	}, [dispatch]);

	// This is the piece that was missing: a single place that knows how
	// to spread ONE selected contract across MANY sections of the form.
	// Adjust the right-hand-side field paths to match your actual
	// transportContract schema (route/vehicle/freight defaults etc).


	const applyContractToForm = (contractRaw: any) => {
		if (!contractRaw) return;

		const customer = contractRaw?.customer || {};
		const contractPeriod = contractRaw?.contractPeriod || {};
		const tripCommitment = contractRaw?.tripCommitment || {};
		const billingTerms = contractRaw?.billingTerms || {};
		const customerCode =
			customer?.customerCode || contractRaw?.customerCode || "";

		const account = (accounts || []).find(
			(item: any) => String(item.accountCode) === String(customerCode)
		);

		// Currently use the first route from the selected contract.
		const selectedRoute =
			Array.isArray(contractRaw?.routes) && contractRaw.routes.length > 0
				? contractRaw.routes[0]
				: {};

		const totalTrips =
			tripCommitment?.totalTrips ??
			contractRaw?.totalTrips ??
			"";

		const completedTrips =
			tripCommitment?.completedTrips ??
			contractRaw?.completedTrips ??
			0;

		const remainingTrips =
			tripCommitment?.balanceTrips ??
			tripCommitment?.remainingTrips ??
			Math.max(
				Number(totalTrips || 0) - Number(completedTrips || 0),
				0
			);

		const pickupLocation =
			selectedRoute?.from ||
			selectedRoute?.fromAddress ||
			selectedRoute?.fromCityName ||
			"";

		const deliveryLocation =
			selectedRoute?.to ||
			selectedRoute?.toAddress ||
			selectedRoute?.toCityName ||
			"";

		const routeRate =
			selectedRoute?.rate !== undefined &&
				selectedRoute?.rate !== null
				? selectedRoute.rate
				: "";

		setForm((prev: any) => ({
			...prev,

			/* =====================================================
			   CONTRACT DETAILS
			===================================================== */
			contractDetails: {
				...prev.contractDetails,

				contractNumber:
					contractRaw?.contractNumber ||
					contractRaw?.voucherNumber ||
					"",

				validityFrom: formatDateForInput(
					contractPeriod?.startDate ||
					contractRaw?.validityFrom ||
					contractRaw?.periodStart
				),

				validityTo: formatDateForInput(
					contractPeriod?.endDate ||
					contractRaw?.validityTo ||
					contractRaw?.periodEnd
				),

				totalTrips,
				completedTrips,
				remainingTrips,
			},

			/* =====================================================
			   CUSTOMER DETAILS
			===================================================== */
			customerDetails: {
				...prev.customerDetails,

				customerCode,

				customerName:
					account?.accountName ||
					customer?.customerName ||
					contractRaw?.customerName ||
					"",

				contactPerson:
					account?.accountName ||
					customer?.customerName ||
					"",

				gstNumber:
					account?.gstNumber ||
					account?.gst ||
					account?.accountGSTNumber ||
					customer?.gstNumber ||
					"",

				mobileNumber:
					account?.mobileNumber ||
					account?.mobile ||
					account?.accountMobile ||
					account?.accountMobileNumber ||
					customer?.mobileNumber ||
					"",

				email:
					account?.email ||
					account?.accountEmail ||
					account?.accountEmailId ||
					customer?.email ||
					"",
			},
			/* =====================================================
			   LOAD DETAILS
			===================================================== */
			loadDetails: {
				...prev.loadDetails,

				// FTL / PTL comes from the selected contract route.
				loadType:
					selectedRoute?.loadType ||
					prev.loadDetails?.loadType ||
					"",

				// The contract does not currently contain material/product data.
				// Existing manually entered material fields are preserved.
				materialName:
					selectedRoute?.materialName ||
					prev.loadDetails?.materialName ||
					"",

				materialCategory:
					selectedRoute?.materialCategory ||
					prev.loadDetails?.materialCategory ||
					"",

				quantity:
					selectedRoute?.quantity ??
					prev.loadDetails?.quantity ??
					"",

				weight:
					selectedRoute?.weight ??
					prev.loadDetails?.weight ??
					"",

				weightUnit:
					selectedRoute?.weightUnit ||
					prev.loadDetails?.weightUnit ||
					"",

				packagingType:
					selectedRoute?.packagingType ||
					prev.loadDetails?.packagingType ||
					"",

				ewayBillDetails: {
					...prev.loadDetails?.ewayBillDetails,
				},
			},

			/* =====================================================
			   PICKUP DETAILS
			===================================================== */
			pickupDetails: {
				...prev.pickupDetails,

				pickupLocation,

				pickupAddress:
					selectedRoute?.fromAddress ||
					selectedRoute?.from ||
					"",

				pickupState:
					selectedRoute?.fromState ||
					prev.pickupDetails?.pickupState ||
					null,

				pickupStateCode:
					selectedRoute?.fromStateCode ||
					"",

				pickupStateName:
					selectedRoute?.fromStateName ||
					"",

				pickupCity:
					selectedRoute?.fromCity ||
					prev.pickupDetails?.pickupCity ||
					null,

				pickupCityName:
					selectedRoute?.fromCityName ||
					"",

				pickupPincode:
					selectedRoute?.fromPincode ||
					"",

				pickupLatitude:
					selectedRoute?.fromLatitude ??
					"",

				pickupLongitude:
					selectedRoute?.fromLongitude ??
					"",

				pickupPlaceId:
					selectedRoute?.fromPlaceId ||
					"",
			},

			/* =====================================================
			   DELIVERY DETAILS
			===================================================== */
			deliveryDetails: {
				...prev.deliveryDetails,

				deliveryLocation,

				deliveryAddress:
					selectedRoute?.toAddress ||
					selectedRoute?.to ||
					"",

				deliveryState:
					selectedRoute?.toState ||
					prev.deliveryDetails?.deliveryState ||
					null,

				deliveryStateCode:
					selectedRoute?.toStateCode ||
					"",

				deliveryStateName:
					selectedRoute?.toStateName ||
					"",

				deliveryCity:
					selectedRoute?.toCity ||
					prev.deliveryDetails?.deliveryCity ||
					null,

				deliveryCityName:
					selectedRoute?.toCityName ||
					"",

				deliveryPincode:
					selectedRoute?.toPincode ||
					"",

				deliveryLatitude:
					selectedRoute?.toLatitude ??
					"",

				deliveryLongitude:
					selectedRoute?.toLongitude ??
					"",

				deliveryPlaceId:
					selectedRoute?.toPlaceId ||
					"",
			},

			/* =====================================================
			   VEHICLE REQUIREMENT
			===================================================== */
			vehicleRequirement: {
				...prev.vehicleRequirement,

				vehicleType:
					selectedRoute?.vehicleType ||
					prev.vehicleRequirement?.vehicleType ||
					"",

				vehicleBodyType:
					selectedRoute?.vehicleBodyType ||
					prev.vehicleRequirement?.vehicleBodyType ||
					"",

				vehicleCapacity:
					selectedRoute?.vehicleCapacity ||
					selectedRoute?.capacity ||
					prev.vehicleRequirement?.vehicleCapacity ||
					"",

				numberOfVehicles:
					selectedRoute?.numberOfVehicles ??
					prev.vehicleRequirement?.numberOfVehicles ??
					"",

				specialVehicleRequirement:
					selectedRoute?.specialVehicleRequirement ||
					prev.vehicleRequirement?.specialVehicleRequirement ||
					"",
			},

			/* =====================================================
			   FREIGHT DETAILS
			===================================================== */
			freightDetails: {
				...prev.freightDetails,

				// Contract route contains one rate.
				expectedFreight: routeRate,

				// Fill freight per ton only when the rate type indicates per-ton.
				freightPerTon:
					String(selectedRoute?.rateType || "")
						.toLowerCase()
						.includes("ton")
						? routeRate
						: prev.freightDetails?.freightPerTon || "",

				// Preserve advance because it is normally entered for this order.
				advanceAmount:
					prev.freightDetails?.advanceAmount || "",

				paymentType:
					selectedRoute?.paymentType ||
					billingTerms?.paymentType ||
					prev.freightDetails?.paymentType ||
					"",

				paymentMode:
					selectedRoute?.paymentMode ||
					billingTerms?.paymentMode ||
					prev.freightDetails?.paymentMode ||
					"",

				// Optional supporting values if they exist in your initial state.
				rateType:
					selectedRoute?.rateType ||
					prev.freightDetails?.rateType ||
					"",

				currency:
					billingTerms?.currency ||
					prev.freightDetails?.currency ||
					"INR",

				paymentDays:
					billingTerms?.paymentDays ??
					prev.freightDetails?.paymentDays ??
					"",
			},

			/* =====================================================
			   ROUTE DETAILS
			===================================================== */
			routeDetails: {
				...prev.routeDetails,

				routeCode:
					selectedRoute?.routeCode ||
					prev.routeDetails?.routeCode ||
					"",

				rateType:
					selectedRoute?.rateType ||
					prev.routeDetails?.rateType ||
					"",

				routeDistanceKm:
					selectedRoute?.routeDistanceKm ??
					selectedRoute?.distanceKm ??
					prev.routeDetails?.routeDistanceKm ??
					"",

				expectedTollAmount:
					selectedRoute?.expectedTollAmount ??
					prev.routeDetails?.expectedTollAmount ??
					"",
			},
		}));
	};



	useEffect(() => {
		const pickup = form.pickupDetails;
		const delivery = form.deliveryDetails;

		if (
			!pickup?.pickupLatitude ||
			!pickup?.pickupLongitude ||
			!delivery?.deliveryLatitude ||
			!delivery?.deliveryLongitude
		) {
			return;
		}

		const calculateRoute = async () => {
			try {
				const response = await dispatch(
					createTransportRouteCalculate({
						origin: {
							latitude: Number(pickup.pickupLatitude),
							longitude: Number(pickup.pickupLongitude),
							address:
								pickup.pickupAddress ||
								pickup.pickupLocation,
							placeId: pickup.pickupPlaceId,
						},

						destination: {
							latitude: Number(delivery.deliveryLatitude),
							longitude: Number(delivery.deliveryLongitude),
							address:
								delivery.deliveryAddress ||
								delivery.deliveryLocation,
							placeId: delivery.deliveryPlaceId,
						},

						travelMode: "DRIVE",
						routingPreference: "TRAFFIC_AWARE",
						computeAlternativeRoutes: true,
						languageCode: "en-IN",
						units: "METRIC",
						avoidTolls: false,
						avoidHighways: false,
						avoidFerries: false,
						includeSteps: true,
						includeMajorCities: false,
						maximumMajorCities: 10,
					})
				).unwrap();

				const route = response?.data?.routes?.[0];

				if (!route) return;

				setForm((prev: any) => ({
					...prev,

					routeDetails: {
						...prev.routeDetails,

						routeDistanceKm:
							parseFloat(route.distanceText) ||
							route.distanceMeters / 1000,

						routeDuration:
							route.durationText || "",

						expectedTravelTime:
							route.durationText || "",
					},
				}));
			} catch (err) {
				console.error("Route calculation failed", err);
			}
		};

		calculateRoute();
	}, [
		dispatch,

		form.pickupDetails?.pickupLatitude,
		form.pickupDetails?.pickupLongitude,
		form.pickupDetails?.pickupPlaceId,

		form.deliveryDetails?.deliveryLatitude,
		form.deliveryDetails?.deliveryLongitude,
		form.deliveryDetails?.deliveryPlaceId,
	]);


	useEffect(() => {
		if (!isEditMode && !isView) return;

		if (!orderNumber) {
			toast.warn("Transport order number not found");
			return;
		}

		const fetchOrder = async () => {
			try {
				setPrefillLoading(true);

				const response = await dispatch(
					getTransportOrderByVoucherNumber(orderNumber)
				).unwrap();

				const orderData = getOrderFromResponse(response);

				if (!orderData) {
					toast.warn("Transport order details not found");
					return;
				}

				setForm(mergeTransportOrderWithInitial(orderData));
			} catch (error: any) {
				toast.error(
					error?.message ||
					error?.payload?.message ||
					"Failed to fetch transport order details"
				);
			} finally {
				setPrefillLoading(false);
			}
		};

		fetchOrder();
	}, [dispatch, isEditMode, orderNumber]);

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
		[
			form.freightDetails.expectedFreight,
			form.freightDetails.advanceAmount,
		]
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

			if (isView) {
				navigate(-1);
				return;
			}

			if (isEditMode) {
				const finalOrderNumber =
					orderNumber ||
					payload?.transportOrderNumber ||
					payload?.orderNumber ||
					payload?.voucherNumber;

				if (!finalOrderNumber) {
					toast.warn("Transport order number not found");
					return;
				}

				await dispatch(
					updateTransportOrderByVoucherNumber({
						voucherNumber: finalOrderNumber,
						payload,
					})
				).unwrap();

				toast.success("Transport order updated");
				navigate(-1);
				return;
			}

			await dispatch(createTransportOrder(payload)).unwrap();

			toast.success("Transport order created");
			navigate(-1);
		} catch (error: any) {
			toast.error(
				error?.message ||
				`Failed to ${isEditMode ? "update" : "create"} transport order`
			);
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
						isView={isView}
						accounts={accounts}
						transportContract={transportContract}
						onContractSelect={applyContractToForm}   // <-- key wiring
					/>
				);

			case 1:
				return (
					<LoadStep
						form={form}
						update={update}
						updateNested={updateNested}
						units={units}
						products={products}
						isView={isView}
					/>
				);

			case 2:
				return (
					<PickupStep
						form={form}
						update={update}
						states={states}
						isView={isView}
					/>
				);

			case 3:
				return (
					<DeliveryStep
						form={form}
						update={update}
						setForm={setForm}
						isView={isView}
					/>
				);

			case 4:
				return (
					<VehicleStep
						form={form}
						update={update}
						isView={isView}
					/>
				);

			case 5:
				return (
					<FreightStep
						form={form}
						update={update}
						isView={isView}
						balanceAmount={balanceAmount}
					/>
				);

			case 6:
				return (
					<RiskStep
						form={form}
						isView={isView}
						update={update}
					/>
				);

			default:
				return null;
		}
	};

	// const buttonLabel =
	// 	step === STEPS.length - 1
	// 		? isEditMode
	// 			? "Update Order"
	// 			: "Save Order"
	// 		: `Next: ${STEPS[step + 1]}`;


	const buttonLabel =
		isView
			? step === STEPS.length - 1
				? "Close"
				: `Next: ${STEPS[step + 1]}`
			: step === STEPS.length - 1
				? isEditMode
					? "Update Order"
					: "Save Order"
				: `Next: ${STEPS[step + 1]}`;
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

						<p className="text-sm text-muted-foreground">
							{pageDescription}
						</p>
					</div>
				</div>
			</header>

			<main className="flex-1 overflow-auto p-4 sm:p-2">
				<TransportOrderStepper step={step} steps={STEPS} />

				{prefillLoading ? (
					<div className="rounded-md border border-border bg-card p-6 text-sm font-medium text-muted-foreground shadow-sm">
						Loading transport order details...
					</div>
				) : (
					renderStep()
				)}
			</main>

			<TransportOrderFooter
				step={step}
				totalSteps={STEPS.length}
				loading={loading || prefillLoading}
				buttonLabel={buttonLabel}
				onBack={back}
				onNext={step === STEPS.length - 1 ? handleSave : next}
				hideNext={isView}
			/>
		</div>
	);
};

export default CreateTransportOrder;